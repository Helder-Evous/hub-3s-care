-- ============================================================================
-- Migration 006 — Controle de Lead: dominio crm.leads (oportunidade de funil)
-- ----------------------------------------------------------------------------
-- Objetivo : criar a tabela de leads (oportunidade), com FK direta a clinics,
--            FK composta para patients (anti cross-clinic), constraints p/ FKs
--            das filhas, indices, updated_at (trigger), grants e RLS.
-- Depende  : 001 (schema), 002 (enum lead_stage, lead_sources), 003 (user_profiles),
--            004 (helpers de RLS), 005 (patients + fn_touch_updated_at).
-- Escopo   : SEM lead_activities/appointments/budgets/stage_history,
--            SEM system_events/ai_tasks, SEM integracoes externas.
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) TABELA
-- ----------------------------------------------------------------------------
create table if not exists crm.leads (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null,
  patient_id        uuid not null,
  source_id         uuid references crm.lead_sources (id) on delete restrict,
  owner_id          uuid references crm.user_profiles (id) on delete set null,
  current_stage     crm.lead_stage not null default 'novo',
  lost_at           timestamptz,
  lost_reason       text,
  lost_by           uuid references crm.user_profiles (id) on delete set null,
  last_contact_at   timestamptz,
  last_activity_at  timestamptz,
  source_system     text not null default 'controle_lead',
  external_ref      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- FK direta a clinics (validacao explicita do escopo da clinica).
  constraint leads_clinic_fk
    foreign key (clinic_id) references public.clinics (id) on delete restrict,

  -- FK composta: garante que o lead e o paciente sao da MESMA clinica
  -- (impede cross-clinic no nivel do banco). Paciente removido -> leads removidos.
  constraint leads_patient_clinic_fk
    foreign key (patient_id, clinic_id)
    references crm.patients (id, clinic_id) on delete cascade,

  -- Alvos das FKs compostas das filhas (appointments/budgets, em migrations futuras):
  constraint leads_id_patient_unique unique (id, patient_id),   -- obrigatorio
  constraint leads_id_clinic_unique  unique (id, clinic_id)     -- recomendado
);

comment on table crm.leads is
  'Oportunidade de entrada no funil clinico (1 patient -> N leads). Nao e CRM '
  'comercial: rastreia a jornada do paciente. clinic_id tem FK direta a clinics '
  'e e validado tambem pela FK composta com patients (mesma clinica).';
comment on column crm.leads.current_stage is
  'Estagio macro DERIVADO. NAO e fonte de verdade e NAO deve ser atualizado '
  'diretamente pela aplicacao. A escritora oficial sera a trigger futura de '
  'derivacao (apos appointments/budgets); perdido deriva de lost_at. Default novo.';
comment on column crm.leads.lost_at is
  'FONTE DE VERDADE do "perdido": lost_at IS NOT NULL significa lead perdido. '
  'A trigger de derivacao setara current_stage=perdido (override terminal).';
comment on column crm.leads.lost_reason is
  'Motivo OPERACIONAL da perda (ex.: sem resposta, sem interesse, contato invalido). '
  'NAO utilizar para dados clinicos.';
comment on column crm.leads.owner_id is
  'CRC/responsavel (user_profiles). Pode ser NULL no nascimento do lead; regra '
  'operacional (NAO constraint): deve existir antes de a operacao avancar.';
comment on column crm.leads.last_contact_at is
  'Mantido por trigger futura de lead_activities (toques de contato). Usado por '
  'dashboards e pela ai_task lead_sem_contato sem escanear activities.';
comment on column crm.leads.source_system is
  'Procedencia do registro: controle_lead (default), importacao, trafego. '
  'Eixo distinto de source_id (origem de marketing).';

-- ----------------------------------------------------------------------------
-- 2) INDICES
-- ----------------------------------------------------------------------------
-- Funil/board (consulta mais quente).
create index if not exists leads_clinic_stage_idx
  on crm.leads (clinic_id, current_stage);

-- Timeline da pessoa / joins (a unique(id,patient_id) tem id como 1a coluna).
create index if not exists leads_patient_idx
  on crm.leads (patient_id);

-- "Meus leads" (CRC) e KPI por origem.
create index if not exists leads_owner_idx  on crm.leads (owner_id);
create index if not exists leads_source_idx on crm.leads (source_id);

-- Series temporais e SLA/IA.
create index if not exists leads_clinic_created_idx
  on crm.leads (clinic_id, created_at);
create index if not exists leads_clinic_last_contact_idx
  on crm.leads (clinic_id, last_contact_at);

-- ----------------------------------------------------------------------------
-- 3) TRIGGER updated_at (reusa a funcao COMPARTILHADA criada na 005)
-- ----------------------------------------------------------------------------
drop trigger if exists trg_leads_touch_updated_at on crm.leads;
create trigger trg_leads_touch_updated_at
  before update on crm.leads
  for each row execute function crm.fn_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 4) GRANTS (RLS gateia as linhas; cliente read-only; sem DELETE p/ authenticated)
-- ----------------------------------------------------------------------------
grant select, insert, update on crm.leads to authenticated;
grant all on crm.leads to service_role;

-- ----------------------------------------------------------------------------
-- 5) RLS
--    Leitura: staff global; clinica = acesso + modulo habilitado.
--    Escrita: staff/gestor_unidade/crc com acesso + modulo habilitado.
--    Exclusao: NENHUMA policy (MVP). Perda via lost_at. cliente: read-only.
-- ----------------------------------------------------------------------------
alter table crm.leads enable row level security;

drop policy if exists leads_select_scoped on crm.leads;
create policy leads_select_scoped
  on crm.leads
  for select to authenticated
  using (
    crm.is_staff_3s()
    or (crm.user_has_clinic_access(clinic_id) and crm.module_enabled_for_clinic(clinic_id))
  );

drop policy if exists leads_insert_manage on crm.leads;
create policy leads_insert_manage
  on crm.leads
  for insert to authenticated
  with check (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  );

drop policy if exists leads_update_manage on crm.leads;
create policy leads_update_manage
  on crm.leads
  for update to authenticated
  using (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  )
  with check (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  );

-- (sem policy de DELETE: nenhum usuario exclui leads no MVP)
-- ============================================================================
