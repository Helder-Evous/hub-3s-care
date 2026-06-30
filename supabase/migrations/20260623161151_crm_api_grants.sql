-- ============================================================================
-- Migration 011 — Controle de Lead: grants de API (USAGE nos enums)
-- ----------------------------------------------------------------------------
-- Objetivo : conceder USAGE nos 8 enums do schema crm ao papel `authenticated`,
--            requisito para o PostgREST introspectar/serializar/gravar colunas
--            enum quando o schema crm for exposto na API.
-- Escopo   : SOMENTE grants de USAGE em tipos. NAO altera tabelas, NAO altera
--            RLS, NAO altera helpers, NAO concede nada a `anon`, NAO expoe o
--            schema (exposicao = config de dashboard, fora da migration).
-- Depende  : 002 (enums criados).
-- Nota     : no Postgres, USAGE de tipo e default para PUBLIC; este grant e
--            explicito/defensivo e idempotente.
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- ============================================================================

-- USAGE de TIPO: permite ao papel usar o enum (cast/serializacao de valores).
-- Concedido SOMENTE a `authenticated` (modulo exige login; `anon` nao recebe).
grant usage on type crm.crm_role              to authenticated;
grant usage on type crm.patient_status        to authenticated;
grant usage on type crm.lead_stage            to authenticated;
grant usage on type crm.appointment_status    to authenticated;
grant usage on type crm.budget_status         to authenticated;
grant usage on type crm.activity_type         to authenticated;
grant usage on type crm.source_category       to authenticated;
grant usage on type crm.reconciliation_status to authenticated;

-- ----------------------------------------------------------------------------
-- Observacoes deliberadas (sem efeito colateral):
--   * `anon` NAO recebe USAGE aqui (modulo exige autenticacao). Mesmo que `anon`
--     herde USAGE de tipo via PUBLIC (default do Postgres), ele NAO acessa o crm:
--     nao tem USAGE no schema crm (revogado na 001) nem grants de tabela.
--   * Grants de tabela/coluna, policies RLS e EXECUTE de funcoes permanecem
--     EXATAMENTE como nas migrations 002/004/005/006/010 (nada alterado).
--   * Incluir `crm` em "Exposed schemas" e passo de CONFIGURACAO do projeto
--     (dashboard/API), NAO faz parte desta migration.
-- ============================================================================
