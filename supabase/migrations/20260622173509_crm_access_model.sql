-- ============================================================================
-- Migration 003 — Controle de Lead: modelo de acesso
-- ----------------------------------------------------------------------------
-- Objetivo : criar user_profiles (+ trigger de signup), user_units e
--            module_clinics, com constraints, indices, grants minimos e RLS
--            minima (self-read, sem helpers).
-- Depende  : 001 (schema crm) e 002 (enum crm.crm_role).
-- Escopo   : SEM helpers/funcoes de autorizacao, SEM tabelas de dominio,
--            SEM system_events/ai_tasks.
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) PERFIL DO USUARIO NO MODULO  (1:1 com auth.users)
-- ----------------------------------------------------------------------------
create table if not exists crm.user_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        crm.crm_role not null default 'cliente',
  full_name   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table crm.user_profiles is
  'Perfil/papel do usuario no modulo Controle de Lead (1:1 auth.users). '
  'Ter perfil NAO concede acesso a dados: acesso depende de user_units + module_clinics.';
comment on column crm.user_profiles.role is
  'Papel global do usuario no modulo. Default cliente (menor privilegio). '
  'Elevacao de papel e acao manual de super_admin_3s.';

-- ----------------------------------------------------------------------------
-- 2) TRIGGER DE SIGNUP  (cria o perfil automaticamente para todo novo usuario)
--    SECURITY DEFINER + search_path='' ; idempotente via ON CONFLICT.
--    NAO atribui unidade, NAO habilita modulo, NAO eleva papel.
-- ----------------------------------------------------------------------------
create or replace function crm.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into crm.user_profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function crm.fn_handle_new_user() is
  'Cria crm.user_profiles (role default cliente) ao inserir em auth.users. '
  'Resiliente (ON CONFLICT DO NOTHING). Nao concede escopo nem entitlement.';

drop trigger if exists trg_crm_handle_new_user on auth.users;
create trigger trg_crm_handle_new_user
  after insert on auth.users
  for each row execute function crm.fn_handle_new_user();

-- ----------------------------------------------------------------------------
-- 3) VINCULO USUARIO <-> CLINICA/UNIDADE
-- ----------------------------------------------------------------------------
create table if not exists crm.user_units (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references crm.user_profiles (id) on delete cascade,
  clinic_id   uuid not null references public.clinics (id)    on delete cascade,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint user_units_user_clinic_unique unique (user_id, clinic_id)
);

-- (user_id ja indexado pelo prefixo do unique; indexar clinic_id p/ buscas inversas)
create index if not exists user_units_clinic_idx on crm.user_units (clinic_id);

comment on table crm.user_units is
  'Escopo de acesso: quais clinicas/unidades o usuario alcanca. '
  'Staff (super_admin_3s/gestor_3s) nao precisa de vinculo (acesso global). '
  'Desativacao sem perda de historico via active=false.';

-- ----------------------------------------------------------------------------
-- 4) ENTITLEMENT DO MODULO POR CLINICA
-- ----------------------------------------------------------------------------
create table if not exists crm.module_clinics (
  clinic_id   uuid primary key references public.clinics (id) on delete cascade,
  enabled     boolean not null default true,
  enabled_by  uuid references auth.users (id) on delete set null,
  enabled_at  timestamptz not null default now()
);

comment on table crm.module_clinics is
  'Habilitacao do modulo Controle de Lead por clinica. Clinica existir em '
  'public.clinics nao basta: precisa estar aqui com enabled=true.';
comment on column crm.module_clinics.enabled_by is
  'Usuario (auth.users) que habilitou. PODE SER NULL: bootstrap inicial, '
  'carga manual administrativa e importacoes futuras nao tem ator humano.';

-- ----------------------------------------------------------------------------
-- 5) GRANTS MINIMOS
--    user_profiles/user_units: leitura para authenticated (gateada por RLS).
--    module_clinics: SEM grant a authenticated por ora (politica definitiva
--    fica para a migration de helpers/RLS); apenas service_role.
--    Escrita geral: service_role (provisioning/bootstrap).
-- ----------------------------------------------------------------------------
grant select on crm.user_profiles to authenticated;
grant select on crm.user_units    to authenticated;

grant all on crm.user_profiles  to service_role;
grant all on crm.user_units     to service_role;
grant all on crm.module_clinics to service_role;

-- ----------------------------------------------------------------------------
-- 6) RLS MINIMA (self-read; SEM helpers). Fecha a janela de exposicao.
--    Politicas de staff/gestao/escopo completo entram na migration de RLS.
-- ----------------------------------------------------------------------------
alter table crm.user_profiles  enable row level security;
alter table crm.user_units     enable row level security;
alter table crm.module_clinics enable row level security;

-- user_profiles: cada usuario le apenas o proprio perfil.
drop policy if exists user_profiles_select_self on crm.user_profiles;
create policy user_profiles_select_self
  on crm.user_profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- user_units: cada usuario le apenas os proprios vinculos ativos.
drop policy if exists user_units_select_self on crm.user_units;
create policy user_units_select_self
  on crm.user_units
  for select
  to authenticated
  using (user_id = (select auth.uid()) and active);

-- module_clinics: RLS habilitada, PORÉM sem politica nesta fase.
-- Resultado: nenhum acesso via authenticated (default-deny); apenas service_role.
-- A politica definitiva (escopo + staff) sera criada na migration de helpers/RLS.
-- ============================================================================
