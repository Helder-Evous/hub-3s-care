-- ============================================================================
-- Migration 009 — Controle de Lead: crm.budgets (orcamento/proposta clinica)
-- ----------------------------------------------------------------------------
-- Objetivo : criar a tabela de orcamentos (patient obrigatorio, lead opcional),
--            com FKs compostas (anti cross-clinic), seams Codefy, indices,
--            updated_at (trigger), grants e RLS.
-- Depende  : 001 (schema), 002 (enums budget_status/reconciliation_status),
--            003 (user/module), 004 (helpers RLS), 005 (patients), 006 (leads).
-- Escopo   : SEM budget_items, SEM revenue, SEM derivacao de current_stage,
--            SEM events/ai_tasks, SEM Codefy ativo.
-- Orcamento NAO e pagamento nem receita (clinica ou 3S).
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) TABELA
-- ----------------------------------------------------------------------------
create table if not exists crm.budgets (
  id                    uuid primary key default gen_random_uuid(),
  clinic_id             uuid not null,
  patient_id            uuid not null,
  lead_id               uuid,                 -- Modelo C: opcional
  status                crm.budget_status not null default 'rascunho',
  total_amount          numeric(12,2),        -- nulo so em rascunho; app exige ao emitir
  currency              text not null default 'BRL',
  presented_at          timestamptz,
  accepted_at           timestamptz,
  rejected_at           timestamptz,
  expired_at            timestamptz,
  cancelled_at          timestamptz,
  valid_until           timestamptz,
  description           text,
  codefy_id             text,                 -- seam de conciliacao (Codefy inativo aqui)
  source_system         text not null default 'controle_lead',
  external_ref          text,
  synced_at             timestamptz,
  reconciliation_status crm.reconciliation_status not null default 'nao_aplicavel',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Valor nao-negativo (nulo permitido em rascunho).
  constraint budgets_total_amount_chk
    check (total_amount is null or total_amount >= 0),

  -- FK direta a clinics (escopo explicito).
  constraint budgets_clinic_fk
    foreign key (clinic_id) references public.clinics (id) on delete restrict,

  -- Paciente da MESMA clinica (anti cross-clinic). Paciente removido -> orcamentos removidos.
  constraint budgets_patient_clinic_fk
    foreign key (patient_id, clinic_id)
    references crm.patients (id, clinic_id) on delete cascade,

  -- Lead OPCIONAL e do MESMO paciente. NO ACTION: SET NULL anularia patient_id (NOT NULL);
  -- NO ACTION (deferido) deixa o cascade de patient apagar o orcamento antes, e bloqueia
  -- exclusao direta de um lead que ainda tenha orcamentos. MATCH SIMPLE: nao exigido se lead_id NULL.
  constraint budgets_lead_patient_fk
    foreign key (lead_id, patient_id)
    references crm.leads (id, patient_id) on delete no action
);

comment on table crm.budgets is
  'Orcamento/proposta clinica apresentada ao paciente. NAO e pagamento, NAO e '
  'receita clinica e NAO e receita da 3S (public.sales/contracts). Modelo C: '
  'patient_id obrigatorio, lead_id opcional. Emitido alimenta o stage orcamento.';
comment on column crm.budgets.lead_id is
  'Oportunidade vinculada (opcional). NULL em orcamento de retorno/manutencao '
  'sem lead ativo ou vindo do Codefy.';
comment on column crm.budgets.status is
  'Estado da proposta. Default rascunho (nao conta como emitido). emitido dispara '
  'o stage orcamento (trigger futura); aceito habilita futura efetivacao.';
comment on column crm.budgets.total_amount is
  'Valor total da proposta (>= 0). Pode ser NULL em rascunho; a aplicacao exige '
  'valor ao emitir. NAO representa receita nem pagamento.';
comment on column crm.budgets.description is
  'Texto operacional CURTO do que foi orcado. NAO e prontuario, NAO e descricao '
  'clinica detalhada e NAO deve armazenar diagnostico. Itens estruturados ficam '
  'para etapa futura (budget_items).';
comment on column crm.budgets.codefy_id is
  'Identificador no Codefy para conciliacao futura. Integracao inativa nesta fase.';
comment on column crm.budgets.source_system is
  'Procedencia: controle_lead (default, manual no Hub), codefy (conciliacao), '
  'importacao.';

-- ----------------------------------------------------------------------------
-- 2) DEDUP CODEFY (unico por clinica) + INDICES
-- ----------------------------------------------------------------------------
-- codefy_id unico por clinica quando informado (idempotencia da conciliacao).
create unique index if not exists budgets_clinic_codefy_uq
  on crm.budgets (clinic_id, codefy_id)
  where codefy_id is not null;

-- Dashboard de conversao (taxa de aceite) por status.
create index if not exists budgets_clinic_status_idx
  on crm.budgets (clinic_id, status);

-- Timeline / joins.
create index if not exists budgets_patient_idx
  on crm.budgets (patient_id);

-- Atribuicao ao funil.
create index if not exists budgets_lead_idx
  on crm.budgets (lead_id);

-- Series temporais de emissao.
create index if not exists budgets_clinic_presented_idx
  on crm.budgets (clinic_id, presented_at);

-- Follow-up de orcamento / expiracao.
create index if not exists budgets_clinic_valid_until_idx
  on crm.budgets (clinic_id, valid_until);

-- Fila de conciliacao.
create index if not exists budgets_clinic_reconc_idx
  on crm.budgets (clinic_id, reconciliation_status);

-- ----------------------------------------------------------------------------
-- 3) TRIGGER updated_at (reusa a funcao COMPARTILHADA da 005)
-- ----------------------------------------------------------------------------
drop trigger if exists trg_budgets_touch_updated_at on crm.budgets;
create trigger trg_budgets_touch_updated_at
  before update on crm.budgets
  for each row execute function crm.fn_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 4) GRANTS (UPDATE permitido; DELETE proibido p/ authenticated)
-- ----------------------------------------------------------------------------
grant select, insert, update on crm.budgets to authenticated;
grant all on crm.budgets to service_role;

-- ----------------------------------------------------------------------------
-- 5) RLS
--    Leitura: staff global; clinica = acesso + modulo habilitado.
--    Criacao/edicao: staff/gestor_unidade/crc com acesso + modulo habilitado.
--    Exclusao: NENHUMA policy (cancelar via status=cancelado). cliente: read-only.
-- ----------------------------------------------------------------------------
alter table crm.budgets enable row level security;

drop policy if exists budgets_select_scoped on crm.budgets;
create policy budgets_select_scoped
  on crm.budgets
  for select to authenticated
  using (
    crm.is_staff_3s()
    or (crm.user_has_clinic_access(clinic_id) and crm.module_enabled_for_clinic(clinic_id))
  );

drop policy if exists budgets_insert_manage on crm.budgets;
create policy budgets_insert_manage
  on crm.budgets
  for insert to authenticated
  with check (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  );

drop policy if exists budgets_update_manage on crm.budgets;
create policy budgets_update_manage
  on crm.budgets
  for update to authenticated
  using (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  )
  with check (
    crm.user_can_manage_module(clinic_id) and crm.module_enabled_for_clinic(clinic_id)
  );

-- (sem policy de DELETE: cancelamento via status=cancelado; hard-delete so service_role)
-- ============================================================================
