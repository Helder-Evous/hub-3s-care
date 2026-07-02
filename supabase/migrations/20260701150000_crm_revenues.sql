-- ============================================================================
-- Migration 016 — Controle de Lead: crm.revenues (Receita efetivamente gerada)
-- ----------------------------------------------------------------------------
-- Objetivo : registrar a RECEITA efetivamente gerada por um Lead como entidade
--            oficial (CRM-BR-001/CRM-LIFECYCLE-001). MULTIPLAS receitas por Lead
--            (acumulaveis). Receita e INDICADOR estrategico e **NAO altera a
--            jornada operacional** (sem recalculo de current_stage).
-- Depende  : 001 (schema/grants), 004 (helpers RLS), 005 (patients), 006 (leads),
--            008 (appointments), 003 (user_profiles).
-- Escopo   : ADITIVA e REVERSIVEL. NAO remove nem altera crm.budgets (mantido como
--            historico, tratado como DEPRECATED — documentado, sem DDL nesta migration).
--            Sem frontend, sem Kanban. Escrita SOMENTE service_role (authenticated
--            e read-only nesta fase). Sem trigger de estagio (receita != jornada).
-- Aplicacao: NAO aplicada por este commit. Fluxo DEV -> validar -> Principal,
--            aprovacao do Jheferson.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) TABELA crm.revenues
--    Anti cross-clinic via FKs compostas (padrao crm.budgets):
--      (lead_id, patient_id) -> leads(id, patient_id)
--      (patient_id, clinic_id) -> patients(id, clinic_id)
--    ON DELETE RESTRICT nas relacoes de negocio: receita e fato financeiro e
--    NUNCA deve ser apagada em cascata (difere de budgets, que usa CASCADE em
--    patients — decisao deliberada de preservacao de historico financeiro).
-- ----------------------------------------------------------------------------
create table if not exists crm.revenues (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null,
  patient_id     uuid not null,
  lead_id        uuid not null,
  amount         numeric(12,2) not null,
  currency       text not null default 'BRL',
  revenue_date   date not null default current_date,
  appointment_id uuid,                 -- vinculo OPCIONAL ao agendamento
  notes          text,
  created_by     uuid,                 -- NULL p/ importacao/service_role
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint revenues_amount_positive_ck check (amount > 0),

  -- Receita pertence ao lead E ao mesmo paciente do lead:
  constraint revenues_lead_patient_fk
    foreign key (lead_id, patient_id)
    references crm.leads (id, patient_id) on delete restrict,

  -- Paciente pertence a mesma clinica (anti cross-clinic):
  constraint revenues_patient_clinic_fk
    foreign key (patient_id, clinic_id)
    references crm.patients (id, clinic_id) on delete restrict,

  -- FK direta a clinics (validacao explicita de escopo):
  constraint revenues_clinic_fk
    foreign key (clinic_id) references public.clinics (id) on delete restrict,

  -- Vinculo opcional ao agendamento; se o appointment sumir, a receita permanece:
  constraint revenues_appointment_fk
    foreign key (appointment_id) references crm.appointments (id) on delete set null,

  -- Autor (opcional): RESTRICT preserva a atribuicao.
  constraint revenues_created_by_fk
    foreign key (created_by) references crm.user_profiles (id) on delete restrict
);

comment on table crm.revenues is
  'Receita efetivamente gerada por um Lead (indicador financeiro oficial). '
  'MULTIPLAS receitas por Lead (acumulaveis). Receita e INDICADOR e NAO altera a '
  'jornada operacional (sem recalculo de current_stage). Substitui crm.budgets '
  '(orcamento/proposta, DEPRECATED) como fonte de receita.';
comment on column crm.revenues.amount is
  'Valor da receita, numeric(12,2), sempre > 0.';
comment on column crm.revenues.appointment_id is
  'Vinculo OPCIONAL ao agendamento relacionado (nullable).';
comment on column crm.revenues.created_by is
  'Usuario que registrou (user_profiles). NULL p/ importacao/service_role.';

-- ----------------------------------------------------------------------------
-- 2) INDICES
-- ----------------------------------------------------------------------------
create index if not exists revenues_lead_id_idx        on crm.revenues (lead_id);
create index if not exists revenues_clinic_id_idx      on crm.revenues (clinic_id);
create index if not exists revenues_revenue_date_idx   on crm.revenues (revenue_date);
create index if not exists revenues_appointment_id_idx on crm.revenues (appointment_id);
create index if not exists revenues_created_by_idx     on crm.revenues (created_by);

-- ----------------------------------------------------------------------------
-- 3) TRIGGER updated_at (reutiliza helper existente). SEM trigger de estagio:
--    receita NAO altera a jornada operacional.
-- ----------------------------------------------------------------------------
drop trigger if exists trg_revenues_touch_updated_at on crm.revenues;
create trigger trg_revenues_touch_updated_at
  before update on crm.revenues
  for each row execute function crm.fn_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 4) GRANTS (escrita SOMENTE service_role; authenticated READ-ONLY)
-- ----------------------------------------------------------------------------
grant select on crm.revenues to authenticated;
grant all on crm.revenues to service_role;

-- ----------------------------------------------------------------------------
-- 5) RLS — leitura por clinica (staff global ou acesso + modulo habilitado).
--    SEM insert/update/delete para authenticated nesta fase (gestao server-side).
-- ----------------------------------------------------------------------------
alter table crm.revenues enable row level security;

drop policy if exists revenues_select_scoped on crm.revenues;
create policy revenues_select_scoped
  on crm.revenues
  for select to authenticated
  using (
    crm.is_staff_3s()
    or (crm.user_has_clinic_access(clinic_id) and crm.module_enabled_for_clinic(clinic_id))
  );

-- ============================================================================
-- ROLLBACK (manual, se necessario):
--   drop table if exists crm.revenues;  -- remove indices/trigger/policies junto
-- ============================================================================
