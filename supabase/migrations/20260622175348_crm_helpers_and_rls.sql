-- ============================================================================
-- Migration 004 — Controle de Lead: helpers SECURITY DEFINER + RLS completa
--                 das tabelas de acesso.
-- ----------------------------------------------------------------------------
-- Objetivo : criar os helpers de autorizacao e expandir as policies de
--            user_profiles, user_units, module_clinics e lead_sources (leitura
--            escopada de sources clinic).
-- Depende  : 001 (schema), 002 (enums, lead_sources), 003 (tabelas de acesso).
-- Escopo   : SEM tabelas de dominio, SEM system_events/ai_tasks, SEM bootstrap.
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) HELPERS — SECURITY DEFINER, STABLE, search_path='' (owned by postgres).
--    O dono (postgres) bypassa RLS das tabelas lidas -> sem recursao.
-- ----------------------------------------------------------------------------

-- Papel do usuario logado (NULL se nao houver perfil ativo).
create or replace function crm.current_user_role()
returns crm.crm_role
language sql
stable
security definer
set search_path = ''
as $$
  select up.role
  from crm.user_profiles up
  where up.id = (select auth.uid()) and up.active
  limit 1
$$;

-- E super_admin_3s?
create or replace function crm.is_super_admin_3s()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(crm.current_user_role() = 'super_admin_3s', false)
$$;

-- E staff 3S (super_admin_3s OU gestor_3s)? -> visao global.
create or replace function crm.is_staff_3s()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(crm.current_user_role() in ('super_admin_3s', 'gestor_3s'), false)
$$;

-- Usuario tem acesso a clinica? (staff = global; demais = vinculo ativo)
create or replace function crm.user_has_clinic_access(p_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select crm.is_staff_3s() or exists (
    select 1
    from crm.user_units uu
    where uu.user_id = (select auth.uid())
      and uu.clinic_id = p_clinic_id
      and uu.active
  )
$$;

-- Modulo habilitado para a clinica?
create or replace function crm.module_enabled_for_clinic(p_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from crm.module_clinics mc
    where mc.clinic_id = p_clinic_id and mc.enabled
  )
$$;

-- Usuario pode OPERAR/ESCREVER dados da clinica? (reservado para o dominio:
-- staff, ou gestor_unidade/crc com acesso). cliente nunca escreve.
create or replace function crm.user_can_manage_module(p_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select crm.is_staff_3s() or (
    crm.current_user_role() in ('gestor_unidade', 'crc')
    and crm.user_has_clinic_access(p_clinic_id)
  )
$$;

comment on function crm.current_user_role() is 'Papel do auth.uid() (NULL se sem perfil ativo).';
comment on function crm.is_super_admin_3s() is 'True se o usuario logado e super_admin_3s.';
comment on function crm.is_staff_3s() is 'True se staff 3S (super_admin_3s ou gestor_3s) — visao global.';
comment on function crm.user_has_clinic_access(uuid) is 'True se staff ou vinculo ativo em user_units.';
comment on function crm.module_enabled_for_clinic(uuid) is 'True se a clinica tem o modulo habilitado.';
comment on function crm.user_can_manage_module(uuid) is
  'Autorizacao de ESCRITA de dados operacionais no escopo de uma clinica '
  '(staff, ou gestor_unidade/crc com acesso). IMPORTANTE: '
  '(1) NAO participa de nenhuma policy desta Migration 004; '
  '(2) sera consumido apenas pelas migrations de DOMINIO (patients/leads/'
  'appointments/budgets); '
  '(3) NAO concede gestao de acessos (roles/user_units/module_clinics); '
  '(4) NAO substitui is_super_admin_3s() — gestao de acessos e exclusiva do super_admin.';

-- ----------------------------------------------------------------------------
-- 2) EXECUTE seguro dos helpers (sem anon/public; so authenticated/service_role)
-- ----------------------------------------------------------------------------
revoke execute on function
  crm.current_user_role(),
  crm.is_super_admin_3s(),
  crm.is_staff_3s(),
  crm.user_has_clinic_access(uuid),
  crm.module_enabled_for_clinic(uuid),
  crm.user_can_manage_module(uuid)
from public;

grant execute on function
  crm.current_user_role(),
  crm.is_super_admin_3s(),
  crm.is_staff_3s(),
  crm.user_has_clinic_access(uuid),
  crm.module_enabled_for_clinic(uuid),
  crm.user_can_manage_module(uuid)
to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3) GRANTS DE TABELA p/ escrita do super_admin via RLS
--    (privilegio de tabela e checado ANTES da RLS; a RLS restringe as linhas).
-- ----------------------------------------------------------------------------
grant update on crm.user_profiles to authenticated;                 -- so super_admin passa na policy
grant insert, update, delete on crm.user_units to authenticated;    -- gestao por super_admin
grant select, insert, update, delete on crm.module_clinics to authenticated;  -- leitura escopada + gestao

-- ----------------------------------------------------------------------------
-- 4) RLS — crm.user_profiles  (self-read ja existe da 003)
-- ----------------------------------------------------------------------------
-- Staff le todos os perfis.
drop policy if exists user_profiles_select_staff on crm.user_profiles;
create policy user_profiles_select_staff
  on crm.user_profiles
  for select to authenticated
  using (crm.is_staff_3s());

-- Apenas super_admin altera role/active.
drop policy if exists user_profiles_update_admin on crm.user_profiles;
create policy user_profiles_update_admin
  on crm.user_profiles
  for update to authenticated
  using (crm.is_super_admin_3s())
  with check (crm.is_super_admin_3s());

-- (sem policy de INSERT/DELETE: criacao pelo trigger; hard-delete so service_role)

-- ----------------------------------------------------------------------------
-- 5) RLS — crm.user_units  (self-read ativo ja existe da 003)
-- ----------------------------------------------------------------------------
-- Staff le todos os vinculos.
drop policy if exists user_units_select_staff on crm.user_units;
create policy user_units_select_staff
  on crm.user_units
  for select to authenticated
  using (crm.is_staff_3s());

-- Apenas super_admin gerencia vinculos (insert/update/delete).
drop policy if exists user_units_manage_admin on crm.user_units;
create policy user_units_manage_admin
  on crm.user_units
  for all to authenticated
  using (crm.is_super_admin_3s())
  with check (crm.is_super_admin_3s());

-- ----------------------------------------------------------------------------
-- 6) RLS — crm.module_clinics  (na 003: RLS on, sem policy)
-- ----------------------------------------------------------------------------
-- Leitura escopada: staff (global) OU usuario com acesso a clinica.
-- (user_has_clinic_access ja inclui staff)
drop policy if exists module_clinics_select_scoped on crm.module_clinics;
create policy module_clinics_select_scoped
  on crm.module_clinics
  for select to authenticated
  using (crm.user_has_clinic_access(clinic_id));

-- Apenas super_admin habilita/desabilita.
drop policy if exists module_clinics_manage_admin on crm.module_clinics;
create policy module_clinics_manage_admin
  on crm.module_clinics
  for all to authenticated
  using (crm.is_super_admin_3s())
  with check (crm.is_super_admin_3s());

-- ----------------------------------------------------------------------------
-- 7) RLS — crm.lead_sources  (leitura escopada de sources 'clinic')
--    A policy de sources 'system' (lead_sources_select_system) veio na 002.
--    Escrita de sources 'clinic' fica para etapa futura.
-- ----------------------------------------------------------------------------
drop policy if exists lead_sources_select_clinic on crm.lead_sources;
create policy lead_sources_select_clinic
  on crm.lead_sources
  for select to authenticated
  using (managed_by = 'clinic' and crm.user_has_clinic_access(clinic_id));
-- ============================================================================
