-- ============================================================================
-- Migration 012 — Controle de Lead: crm.appointments.scheduled_by
-- ----------------------------------------------------------------------------
-- Objetivo : adicionar a coluna `scheduled_by` (CRC responsavel operacional pelo
--            agendamento; dono p/ premiacao), com FK a crm.user_profiles,
--            indice e protecao write-once (authenticated INSERE, nao ATUALIZA).
-- Depende  : 003 (crm.user_profiles), 008 (crm.appointments).
-- Escopo   : ADITIVA. Coluna NULLABLE (compativel com linhas existentes; SEM
--            backfill). Substitui (idempotente) a policy de INSERT de
--            `authenticated` para exigir scheduled_by = auth.uid() (ou NULL,
--            transitorio). SEM alteracao de triggers/enums, SEM S2-2B, SEM
--            importacoes, SEM frontend.
-- Decisao  : ADR-0004 / ADR-0005 / doc 23. Aprovacao de Jheferson; aplicar no
--            DEV (xcqfdnymadeqeuacqotu) e validar ANTES do Principal
--            (nndvcsdevbxpgsccyimm). Esta migration NAO foi aplicada por este commit.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) COLUNA (nullable, aditiva)
-- ----------------------------------------------------------------------------
alter table crm.appointments
  add column if not exists scheduled_by uuid;

comment on column crm.appointments.scheduled_by is
  'CRC responsavel operacional pelo agendamento (dono p/ premiacao). '
  'NAO e quem criou tecnicamente a linha. Imutavel apos a criacao (write-once).';

-- ----------------------------------------------------------------------------
-- 2) FK -> crm.user_profiles(id)
--    Mesmo alvo de crm.leads.owner_id (consistencia). user_profiles.id e 1:1 com
--    auth.users.id (trigger de signup). ON DELETE RESTRICT preserva a atribuicao
--    (nao permite apagar um CRC que ainda possui agendamentos).
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_scheduled_by_fk'
  ) then
    alter table crm.appointments
      add constraint appointments_scheduled_by_fk
      foreign key (scheduled_by) references crm.user_profiles (id)
      on delete restrict;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3) INDICE (agregacoes por CRC: premiacao / dashboards / ranking)
-- ----------------------------------------------------------------------------
create index if not exists appointments_scheduled_by_idx
  on crm.appointments (scheduled_by);

-- ----------------------------------------------------------------------------
-- 4) PROTECAO WRITE-ONCE de scheduled_by
--    A 008 concedeu UPDATE de tabela inteira a `authenticated`. Aqui revogamos e
--    reconcedemos UPDATE em TODAS as colunas EXCETO scheduled_by — assim o CRC
--    pode INSERIR o dono na criacao, mas NUNCA altera-lo depois. service_role
--    mantem ALL (importacoes/admin auditado). RLS e triggers permanecem inalterados.
-- ----------------------------------------------------------------------------
revoke update on crm.appointments from authenticated;
grant update (
  id,
  clinic_id,
  patient_id,
  lead_id,
  status,
  scheduled_at,
  confirmed_at,
  attended_at,
  no_show_at,
  cancelled_at,
  rescheduled_from,
  professional_name,
  procedure_name,
  codefy_id,
  source_system,
  external_ref,
  synced_at,
  reconciliation_status,
  created_at,
  updated_at
) on crm.appointments to authenticated;
-- (scheduled_by deliberadamente FORA da lista acima = imutavel para authenticated)

-- ----------------------------------------------------------------------------
-- 5) RLS de INSERT — authenticated so cria com scheduled_by = auth.uid()
--    Substitui a policy `appointments_insert_manage` (criada na 008) de forma
--    IDEMPOTENTE, PRESERVANDO user_can_manage_module(clinic_id) e
--    module_enabled_for_clinic(clinic_id), e ADICIONANDO a regra de que o CRC nao
--    pode atribuir o agendamento a OUTRO usuario.
--    NULL ainda e aceito de forma TRANSITORIA (o frontend atual nao envia
--    scheduled_by); apertar para `scheduled_by = auth.uid()` (sem NULL) ou tornar
--    a coluna NOT NULL apos a Fase 2 (frontend grava auth.uid()) + decisao de backfill.
--    service_role NAO passa por RLS -> importacoes/admin podem atribuir outro CRC
--    (caminho confiavel server-side).
-- ----------------------------------------------------------------------------
drop policy if exists appointments_insert_manage on crm.appointments;
create policy appointments_insert_manage
  on crm.appointments
  for insert to authenticated
  with check (
    crm.user_can_manage_module(clinic_id)
    and crm.module_enabled_for_clinic(clinic_id)
    and (scheduled_by = auth.uid() or scheduled_by is null)
  );
-- ============================================================================
