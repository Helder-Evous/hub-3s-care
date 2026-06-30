-- ============================================================================
-- Migration 005 — Controle de Lead: dominio crm.patients (identidade da pessoa)
-- ----------------------------------------------------------------------------
-- Objetivo : criar a tabela de pacientes (por clinica), com dedup, normalizacao
--            (trigger), updated_at (trigger), indices, grants e RLS completa.
-- Depende  : 001 (schema), 002 (enums patient_status/reconciliation_status),
--            003 (module_clinics/user_units), 004 (helpers de RLS).
-- Escopo   : SEM leads/appointments/budgets, SEM system_events/ai_tasks,
--            SEM integracao Codefy ativa (apenas os campos/seams).
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) TABELA
-- ----------------------------------------------------------------------------
create table if not exists crm.patients (
  id                    uuid primary key default gen_random_uuid(),
  clinic_id             uuid not null references public.clinics (id) on delete restrict,
  full_name             text not null,
  cpf                   text,                 -- normalizado p/ digitos por trigger; validado na app
  phone                 text,                 -- como digitado (valor capturado)
  phone_normalized      text,                 -- derivado (E.164) por trigger
  email                 text,
  birth_date            date,
  status                crm.patient_status not null default 'prospecto',
  notes                 text,                 -- observacao operacional do CRC (NAO e prontuario clinico)
  codefy_id             text,                 -- seam de conciliacao (integracao inativa nesta fase)
  external_ref          text,
  source_system         text not null default 'controle_lead',
  synced_at             timestamptz,
  reconciliation_status crm.reconciliation_status not null default 'nao_aplicavel',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Suporte a FK composta das filhas (impede cross-clinic no nivel do banco):
  constraint patients_id_clinic_unique unique (id, clinic_id)
);

comment on table crm.patients is
  'Identidade da pessoa atendida por uma clinica (paciente-prospecto). Por clinica '
  '(clinic_id); a mesma pessoa em outra clinica e outro registro (sem unificacao no MVP).';
comment on column crm.patients.cpf is
  'CPF normalizado (apenas digitos) por trigger. Validacao de digito verificador e da app. '
  'Chave forte de deduplicacao quando informado.';
comment on column crm.patients.phone is
  'Telefone como capturado (valor de origem). Fonte para phone_normalized.';
comment on column crm.patients.phone_normalized is
  'DERIVADO de phone (E.164) por trigger. NAO e fonte de verdade: e projecao para '
  'deduplicacao-sugestao e busca. A fonte de verdade do contato e a coluna phone.';
comment on column crm.patients.notes is
  'Observacao operacional do CRC. NAO e prontuario clinico e nao deve conter dado de saude.';
comment on column crm.patients.codefy_id is
  'Identificador no Codefy para conciliacao futura. Integracao inativa nesta fase.';
comment on column crm.patients.source_system is
  'Sistema de origem do registro: controle_lead (default, criado no modulo), '
  'codefy (conciliacao), importacao (carga em lote) ou trafego (captacao). '
  'Usado para rastrear procedencia e na conciliacao.';

-- ----------------------------------------------------------------------------
-- 2) DEDUP / INTEGRIDADE (indices unicos parciais) + INDICES OPERACIONAIS
-- ----------------------------------------------------------------------------
-- CPF unico por clinica quando informado.
create unique index if not exists patients_clinic_cpf_uq
  on crm.patients (clinic_id, cpf)
  where cpf is not null;

-- codefy_id unico por clinica quando informado (decisao: por clinica, nao global).
create unique index if not exists patients_clinic_codefy_uq
  on crm.patients (clinic_id, codefy_id)
  where codefy_id is not null;

-- Filtro/RLS por clinica (a unique(id,clinic_id) tem id como 1a coluna -> nao serve p/ isso).
create index if not exists patients_clinic_idx
  on crm.patients (clinic_id);

-- Telefone: dedup-sugestao + busca (NAO unico — telefones de familia sao compartilhados).
create index if not exists patients_clinic_phone_idx
  on crm.patients (clinic_id, phone_normalized);

-- E-mail: busca operacional case-insensitive (NAO unico).
create index if not exists patients_clinic_email_idx
  on crm.patients (clinic_id, lower(email));

-- Dashboards/coortes e fila de conciliacao.
create index if not exists patients_clinic_status_idx
  on crm.patients (clinic_id, status);
create index if not exists patients_clinic_reconc_idx
  on crm.patients (clinic_id, reconciliation_status);

-- ----------------------------------------------------------------------------
-- 3) TRIGGER DE NORMALIZACAO (cpf -> digitos; phone_normalized -> E.164 BR)
--    BEFORE INSERT/UPDATE. Nao acessa outras tabelas -> sem necessidade de
--    SECURITY DEFINER; search_path='' por seguranca.
-- ----------------------------------------------------------------------------
create or replace function crm.fn_normalize_patient()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_digits text;
begin
  -- CPF: apenas digitos (ou NULL).
  new.cpf := nullif(regexp_replace(coalesce(new.cpf, ''), '\D', '', 'g'), '');

  -- Telefone normalizado em E.164 (heuristica BR; default +55).
  v_digits := nullif(regexp_replace(coalesce(new.phone, ''), '\D', '', 'g'), '');
  if v_digits is null then
    new.phone_normalized := null;
  elsif left(v_digits, 2) = '55' then
    new.phone_normalized := '+' || v_digits;
  elsif char_length(v_digits) in (10, 11) then
    new.phone_normalized := '+55' || v_digits;
  else
    new.phone_normalized := '+' || v_digits;
  end if;

  return new;
end;
$$;

comment on function crm.fn_normalize_patient() is
  'Normaliza cpf (digitos) e phone_normalized (E.164, default BR) em crm.patients.';

drop trigger if exists trg_patients_normalize on crm.patients;
create trigger trg_patients_normalize
  before insert or update on crm.patients
  for each row execute function crm.fn_normalize_patient();

-- ----------------------------------------------------------------------------
-- 4) TRIGGER DE updated_at (FUNCAO COMPARTILHADA do schema crm)
-- ----------------------------------------------------------------------------
create or replace function crm.fn_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function crm.fn_touch_updated_at() is
  'FUNCAO COMPARTILHADA do schema crm: atualiza updated_at = now() em BEFORE UPDATE. '
  'Reutilizada por multiplas tabelas (patients e futuras leads/appointments/budgets). '
  'Nao remover ao reverter uma tabela isolada se outras ainda a utilizam.';

drop trigger if exists trg_patients_touch_updated_at on crm.patients;
create trigger trg_patients_touch_updated_at
  before update on crm.patients
  for each row execute function crm.fn_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 5) GRANTS (RLS gateia as linhas; cliente fica read-only via policies)
--    SEM delete para authenticated: nenhum usuario faz DELETE no MVP.
-- ----------------------------------------------------------------------------
grant select, insert, update on crm.patients to authenticated;
grant all on crm.patients to service_role;

-- ----------------------------------------------------------------------------
-- 6) RLS COMPLETA
--    Leitura: staff global; clinica = acesso + modulo habilitado.
--    Escrita: staff/gestor_unidade/crc com acesso + modulo habilitado.
--    Exclusao: NENHUMA policy de DELETE (decisao MVP). Remocao logica via
--              status='descartado'. cliente: somente leitura.
-- ----------------------------------------------------------------------------
alter table crm.patients enable row level security;

drop policy if exists patients_select_scoped on crm.patients;
create policy patients_select_scoped
  on crm.patients
  for select to authenticated
  using (
    crm.is_staff_3s()
    or (crm.user_has_clinic_access(clinic_id) and crm.module_enabled_for_clinic(clinic_id))
  );

drop policy if exists patients_insert_manage on crm.patients;
create policy patients_insert_manage
  on crm.patients
  for insert to authenticated
  with check (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  );

drop policy if exists patients_update_manage on crm.patients;
create policy patients_update_manage
  on crm.patients
  for update to authenticated
  using (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  )
  with check (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  );

-- (sem policy de DELETE: nenhum usuario exclui patients no MVP)
-- ============================================================================
