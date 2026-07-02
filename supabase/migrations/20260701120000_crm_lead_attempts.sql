-- ============================================================================
-- Migration 013 — Controle de Lead: crm.lead_attempts (Tentativa como entidade)
--                 + enums attempt_channel / attempt_origin / attempt_result.
-- ----------------------------------------------------------------------------
-- Objetivo : elevar "Tentativa" a entidade de negocio (Lead -> LeadAttempt ->
--            Appointment). Base para produtividade, conversao, premiacao, IA,
--            dashboards. Fonte: CRM-LIFECYCLE-001 / CRM-BR-001 / CRM-DATA-001.
-- Depende  : 001 (schema+grants), 003 (user_profiles), 004 (helpers RLS),
--            006 (leads: UNIQUE (id, clinic_id)).
-- Escopo   : ADITIVA e REVERSIVEL. NAO cria appointments.source_attempt_id
--            (fica para a Migration 014). NAO torna tentativa obrigatoria em
--            appointments. NAO altera enums/tabelas existentes. SEM frontend,
--            SEM S2-2B, SEM trigger de invariante (find-or-create fica p/ 014+).
-- Append-only: authenticated so faz SELECT/INSERT (sem UPDATE, sem DELETE).
-- Aplicacao: NAO aplicada por este commit. Fluxo DEV (xcqfdnymadeqeuacqotu) ->
--            validar -> Principal (nndvcsdevbxpgsccyimm), com aprovacao do Jheferson.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ENUMS (idempotentes)
--    Vocabulario consolidado pela decisao de 2026-07-01 (CRM-LIFECYCLE-001).
-- ----------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'crm' and t.typname = 'attempt_channel') then
    create type crm.attempt_channel as enum
      ('telefone', 'whatsapp', 'instagram', 'email', 'presencial', 'sms', 'outro');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'crm' and t.typname = 'attempt_origin') then
    create type crm.attempt_origin as enum
      ('manual_crc', 'manual_consultor', 'ia', 'api', 'importacao', 'sistema');
  end if;
end $$;

-- Elegiveis p/ originar/reutilizar agendamento: interessado, retornar_depois, agendado.
-- Nao elegiveis: sem_resposta, ocupado, caixa_postal, numero_invalido, nao_interessado.
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'crm' and t.typname = 'attempt_result') then
    create type crm.attempt_result as enum
      ('sem_resposta', 'ocupado', 'caixa_postal', 'numero_invalido', 'nao_interessado',
       'interessado', 'retornar_depois', 'agendado');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2) TABELA
--    Anti cross-clinic via FK composta (lead_id, clinic_id) -> leads(id, clinic_id):
--    garante que a tentativa e o lead sao da mesma clinica (leads tem UNIQUE
--    (id, clinic_id)). ON DELETE RESTRICT preserva a tentativa (histórico e base de
--    premiacao nunca sao apagados; leads nao sao hard-deletados — perda e soft).
-- ----------------------------------------------------------------------------
create table if not exists crm.lead_attempts (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null,
  lead_id       uuid not null,
  channel       crm.attempt_channel,               -- nullable (auto/sistema sem meio conhecido)
  origin        crm.attempt_origin not null,
  result        crm.attempt_result not null,
  attempted_at  timestamptz not null default now(),
  created_by    uuid,                              -- NULL p/ ia/api/importacao/sistema
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Tentativa pertence ao lead E a mesma clinica do lead (anti cross-clinic):
  constraint lead_attempts_lead_clinic_fk
    foreign key (lead_id, clinic_id)
    references crm.leads (id, clinic_id) on delete restrict,

  -- FK direta a clinics (validacao explicita de escopo):
  constraint lead_attempts_clinic_fk
    foreign key (clinic_id) references public.clinics (id) on delete restrict,

  -- Autor: RESTRICT (usuario com tentativas nao pode ser apagado; usa active=false).
  constraint lead_attempts_created_by_fk
    foreign key (created_by) references crm.user_profiles (id) on delete restrict,

  -- created_by e OBRIGATORIO quando a tentativa e manual (CRC/consultor). Para
  -- ia/api/importacao/sistema pode ser NULL (o `origin` identifica o agente).
  constraint lead_attempts_created_by_required_ck
    check (origin not in ('manual_crc', 'manual_consultor') or created_by is not null)
);

comment on table crm.lead_attempts is
  'Tentativa de contato como entidade de negocio (CRM-LIFECYCLE-001). Origem do '
  'agendamento no fluxo Lead -> LeadAttempt -> Appointment. Append-only p/ '
  'authenticated (sem UPDATE/DELETE). Base de produtividade/premiacao/IA.';
comment on column crm.lead_attempts.channel is
  'Meio da tentativa (telefone/whatsapp/...). NULLABLE: tentativa automatica '
  '(origin=sistema/ia) pode nao ter meio conhecido. Canal != Origem.';
comment on column crm.lead_attempts.origin is
  'Quem/qual sistema gerou a tentativa (manual_crc, manual_consultor, ia, api, '
  'importacao, sistema). Canal != Origem — nunca confundir.';
comment on column crm.lead_attempts.result is
  'Resultado. Elegiveis p/ originar/reutilizar agendamento: interessado, '
  'retornar_depois, agendado. Demais nao elegiveis (CRM-LIFECYCLE-001).';
comment on column crm.lead_attempts.attempted_at is
  'Quando a tentativa ocorreu (referencia temporal; base da janela de '
  'elegibilidade de 24h). Pode diferir de created_at.';
comment on column crm.lead_attempts.created_by is
  'Usuario (user_profiles) que registrou a tentativa. Obrigatorio p/ origem '
  'manual; NULL p/ ia/api/importacao/sistema.';

-- ----------------------------------------------------------------------------
-- 3) INDICES
-- ----------------------------------------------------------------------------
create index if not exists lead_attempts_lead_id_idx      on crm.lead_attempts (lead_id);
create index if not exists lead_attempts_clinic_id_idx    on crm.lead_attempts (clinic_id);
create index if not exists lead_attempts_attempted_at_idx on crm.lead_attempts (attempted_at);
create index if not exists lead_attempts_created_by_idx   on crm.lead_attempts (created_by);
create index if not exists lead_attempts_result_idx       on crm.lead_attempts (result);
create index if not exists lead_attempts_origin_idx       on crm.lead_attempts (origin);

-- ----------------------------------------------------------------------------
-- 4) TRIGGER updated_at (reutiliza o helper existente do schema)
-- ----------------------------------------------------------------------------
drop trigger if exists trg_lead_attempts_touch_updated_at on crm.lead_attempts;
create trigger trg_lead_attempts_touch_updated_at
  before update on crm.lead_attempts
  for each row execute function crm.fn_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 5) GRANTS (append-only: sem update/delete p/ authenticated)
--    service_role mantem ALL (caminho confiavel server-side: IA/importacao/auto).
-- ----------------------------------------------------------------------------
grant select, insert on crm.lead_attempts to authenticated;
grant all on crm.lead_attempts to service_role;

-- ----------------------------------------------------------------------------
-- 6) RLS
--    Leitura: staff global; ou acesso a clinica + modulo habilitado (CRC e Gestor).
--    Criacao: quem pode operar o modulo + modulo habilitado + autor = proprio
--             usuario (ou staff). Tentativas auto/IA/import entram por service_role.
--    SEM UPDATE e SEM DELETE (append-only). cliente: sem acesso.
-- ----------------------------------------------------------------------------
alter table crm.lead_attempts enable row level security;

drop policy if exists lead_attempts_select_scoped on crm.lead_attempts;
create policy lead_attempts_select_scoped
  on crm.lead_attempts
  for select to authenticated
  using (
    crm.is_staff_3s()
    or (crm.user_has_clinic_access(clinic_id) and crm.module_enabled_for_clinic(clinic_id))
  );

drop policy if exists lead_attempts_insert_manage on crm.lead_attempts;
create policy lead_attempts_insert_manage
  on crm.lead_attempts
  for insert to authenticated
  with check (
    crm.user_can_manage_module(clinic_id)
    and crm.module_enabled_for_clinic(clinic_id)
    and (created_by = (select auth.uid()) or crm.is_staff_3s())
  );

-- (sem policy de UPDATE e sem policy de DELETE: tentativa e append-only)
-- ============================================================================
-- ROLLBACK (manual, se necessario):
--   drop table if exists crm.lead_attempts;
--   drop type  if exists crm.attempt_result;
--   drop type  if exists crm.attempt_origin;
--   drop type  if exists crm.attempt_channel;
-- ============================================================================
