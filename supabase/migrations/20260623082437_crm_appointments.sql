-- ============================================================================
-- Migration 008 — Controle de Lead: crm.appointments (agendamentos, Modelo C)
-- ----------------------------------------------------------------------------
-- Objetivo : criar a tabela de agendamentos (patient obrigatorio, lead opcional),
--            com FKs compostas (anti cross-clinic), self-FK de remarcacao,
--            seams Codefy, indices, updated_at (trigger), grants e RLS.
-- Depende  : 001 (schema), 002 (enums appointment_status/reconciliation_status),
--            003 (user/module), 004 (helpers RLS), 005 (patients), 006 (leads).
-- Escopo   : SEM events/ai_tasks, SEM derivacao de current_stage, SEM Codefy
--            ativo, SEM notes.
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) TABELA
-- ----------------------------------------------------------------------------
create table if not exists crm.appointments (
  id                    uuid primary key default gen_random_uuid(),
  clinic_id             uuid not null,
  patient_id            uuid not null,
  lead_id               uuid,                 -- Modelo C: opcional
  status                crm.appointment_status not null default 'agendado',
  scheduled_at          timestamptz not null,
  confirmed_at          timestamptz,
  attended_at           timestamptz,
  no_show_at            timestamptz,
  cancelled_at          timestamptz,
  rescheduled_from      uuid,                 -- self-FK (laco de remarcacao)
  professional_name     text,
  procedure_name        text,
  codefy_id             text,                 -- seam de conciliacao (Codefy inativo aqui)
  source_system         text not null default 'controle_lead',
  external_ref          text,
  synced_at             timestamptz,
  reconciliation_status crm.reconciliation_status not null default 'nao_aplicavel',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- FK direta a clinics (escopo explicito).
  constraint appointments_clinic_fk
    foreign key (clinic_id) references public.clinics (id) on delete restrict,

  -- Paciente da MESMA clinica (anti cross-clinic). Paciente removido -> agendamentos removidos.
  constraint appointments_patient_clinic_fk
    foreign key (patient_id, clinic_id)
    references crm.patients (id, clinic_id) on delete cascade,

  -- Lead OPCIONAL e do MESMO paciente. NO ACTION: SET NULL anularia patient_id (NOT NULL);
  -- NO ACTION (deferido) deixa o cascade de patient apagar o agendamento antes, e bloqueia
  -- exclusao direta de um lead que ainda tenha agendamentos. MATCH SIMPLE: nao exigido se lead_id NULL.
  constraint appointments_lead_patient_fk
    foreign key (lead_id, patient_id)
    references crm.leads (id, patient_id) on delete no action,

  -- Remarcacao: aponta o agendamento anterior. Perder o anterior nao apaga este.
  constraint appointments_rescheduled_from_fk
    foreign key (rescheduled_from) references crm.appointments (id) on delete set null
);

comment on table crm.appointments is
  'Agendamentos do paciente no funil clinico (Modelo C: patient_id obrigatorio, '
  'lead_id opcional). Nao e a agenda clinica completa nem substitui o Codefy.';
comment on column crm.appointments.lead_id is
  'Oportunidade que gerou o agendamento (opcional). NULL em retorno/manutencao/'
  'walk-in/paciente antigo/import Codefy.';
comment on column crm.appointments.rescheduled_from is
  'Agendamento anterior que foi remarcado para este (laco). O anterior recebe '
  'status=remarcado; este nasce agendado.';
comment on column crm.appointments.professional_name is
  'Nome do profissional (texto opcional). Sem cadastro de profissionais no MVP.';
comment on column crm.appointments.procedure_name is
  'Rotulo OPERACIONAL do procedimento (texto opcional). NAO e prontuario clinico. '
  'Catalogo de procedimentos fica para etapa futura.';
comment on column crm.appointments.codefy_id is
  'Identificador no Codefy para conciliacao futura. Integracao inativa nesta fase.';
comment on column crm.appointments.source_system is
  'Procedencia: controle_lead (default, manual no Hub), codefy (conciliacao), '
  'importacao. Hub pode criar agendamento manual sem Codefy.';

-- ----------------------------------------------------------------------------
-- 2) DEDUP CODEFY (unico por clinica) + INDICES
-- ----------------------------------------------------------------------------
-- codefy_id unico por clinica quando informado (idempotencia da conciliacao).
create unique index if not exists appointments_clinic_codefy_uq
  on crm.appointments (clinic_id, codefy_id)
  where codefy_id is not null;

-- Dashboard de agenda / comparecimento por periodo.
create index if not exists appointments_clinic_scheduled_idx
  on crm.appointments (clinic_id, scheduled_at);

-- Timeline clinica da pessoa / FK.
create index if not exists appointments_patient_idx
  on crm.appointments (patient_id);

-- Atribuicao ao funil.
create index if not exists appointments_lead_idx
  on crm.appointments (lead_id);

-- KPI comparecimento/falta.
create index if not exists appointments_clinic_status_idx
  on crm.appointments (clinic_id, status);

-- Navegar a cadeia de remarcacao.
create index if not exists appointments_rescheduled_from_idx
  on crm.appointments (rescheduled_from);

-- Fila de conciliacao.
create index if not exists appointments_clinic_reconc_idx
  on crm.appointments (clinic_id, reconciliation_status);

-- ----------------------------------------------------------------------------
-- 3) TRIGGER updated_at (reusa a funcao COMPARTILHADA da 005)
-- ----------------------------------------------------------------------------
drop trigger if exists trg_appointments_touch_updated_at on crm.appointments;
create trigger trg_appointments_touch_updated_at
  before update on crm.appointments
  for each row execute function crm.fn_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 4) GRANTS (UPDATE permitido; DELETE proibido p/ authenticated)
-- ----------------------------------------------------------------------------
grant select, insert, update on crm.appointments to authenticated;
grant all on crm.appointments to service_role;

-- ----------------------------------------------------------------------------
-- 5) RLS
--    Leitura: staff global; clinica = acesso + modulo habilitado.
--    Criacao/edicao: staff/gestor_unidade/crc com acesso + modulo habilitado.
--    Exclusao: NENHUMA policy (cancelar via status=cancelado). cliente: read-only.
-- ----------------------------------------------------------------------------
alter table crm.appointments enable row level security;

drop policy if exists appointments_select_scoped on crm.appointments;
create policy appointments_select_scoped
  on crm.appointments
  for select to authenticated
  using (
    crm.is_staff_3s()
    or (crm.user_has_clinic_access(clinic_id) and crm.module_enabled_for_clinic(clinic_id))
  );

drop policy if exists appointments_insert_manage on crm.appointments;
create policy appointments_insert_manage
  on crm.appointments
  for insert to authenticated
  with check (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  );

drop policy if exists appointments_update_manage on crm.appointments;
create policy appointments_update_manage
  on crm.appointments
  for update to authenticated
  using (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  )
  with check (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  );

-- (sem policy de DELETE: cancelamento via status=cancelado; hard-delete so service_role)
-- ============================================================================
