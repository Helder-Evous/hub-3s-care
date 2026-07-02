-- ============================================================================
-- Migration 017 — Controle de Lead: crm.leads.archived_at (arquivamento operacional 24h)
-- ----------------------------------------------------------------------------
-- Objetivo : infraestrutura MINIMA de dados para que Compareceu/Perdido saiam da
--            FILA OPERACIONAL do Kanban apos 24h, SEM apagar historico
--            (CRM-LIFECYCLE-001 §6 / P10-P12). archived_at IS NULL = visivel na
--            fila; archived_at IS NOT NULL = arquivado operacionalmente (lead
--            permanece integro no CRM).
-- Depende  : 006 (crm.leads).
-- Escopo   : ADITIVA e REVERSIVEL. Coluna NULLABLE (leads legados nascem NULL;
--            SEM backfill). NAO altera current_stage. NAO cria job/pg_cron/Edge
--            Function (arquivamento automatico e engenharia a parte). NAO altera
--            RLS/grants de leads (ver nota abaixo). Sem frontend, sem Kanban.
-- Escrita  : archived_at NAO entra no grant de UPDATE por-coluna de `authenticated`
--            (que cobre apenas external_ref/lost_*/owner_id/source_*), portanto
--            e efetivamente gravavel SOMENTE por service_role nesta fase — sem
--            necessidade de alterar grants/policies.
-- Aplicacao: NAO aplicada por este commit. Fluxo DEV -> validar -> Principal,
--            aprovacao do Jheferson.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) COLUNA (nullable, aditiva)
-- ----------------------------------------------------------------------------
alter table crm.leads
  add column if not exists archived_at timestamptz;

comment on column crm.leads.archived_at is
  'Arquivamento OPERACIONAL do lead (sai da fila do Kanban). NULL = visivel na '
  'fila; NOT NULL = arquivado (Compareceu/Perdido apos 24h, ou manual pelo gestor '
  'no futuro). NAO apaga historico e NAO altera current_stage. Reativacao futura '
  'seta archived_at = NULL via funcionalidade propria.';

-- ----------------------------------------------------------------------------
-- 2) INDICES
--    (a) simples em archived_at: suporta o futuro job 24h (varrer arquivaveis).
--    (b) composto (clinic_id, archived_at): suporta a query operacional do board
--        (leads da clinica NAO arquivados: where clinic_id=? and archived_at is null).
-- ----------------------------------------------------------------------------
create index if not exists leads_archived_at_idx
  on crm.leads (archived_at);

create index if not exists leads_clinic_archived_idx
  on crm.leads (clinic_id, archived_at);

-- ============================================================================
-- ROLLBACK (manual, se necessario):
--   drop index if exists crm.leads_clinic_archived_idx;
--   drop index if exists crm.leads_archived_at_idx;
--   alter table crm.leads drop column if exists archived_at;
-- ============================================================================
