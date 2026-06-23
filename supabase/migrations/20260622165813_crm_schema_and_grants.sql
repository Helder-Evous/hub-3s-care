-- ============================================================================
-- Migration 001 — Controle de Lead: schema base e grants minimos
-- ----------------------------------------------------------------------------
-- Objetivo : criar o namespace `crm`, isolado do schema public do HUB 3S,
--            e conceder apenas a permissao minima de USO do schema.
-- Escopo   : NAO cria tabelas, enums, funcoes ou policies (vem nas proximas).
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- Ref      : knowledge/13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md (rascunho local)
-- Premissa : public permanece intocado em estrutura; modulo vive 100% em crm.
-- ============================================================================

-- 1) Schema dedicado ao modulo Controle de Lead.
--    `if not exists` torna a migration idempotente e resiliente a reexecucao.
create schema if not exists crm;

-- 2) Documentacao do schema (aparece no catalogo do banco).
comment on schema crm is
  'Modulo Controle de Lead — funil clinico do paciente (lead -> agendamento -> '
  'comparecimento -> orcamento -> efetivacao -> receita clinica -> pos-venda). '
  'Isolado de public; integra por clinic_id (public.clinics) e pelos barramentos '
  'public.system_events / public.ai_tasks. Identidade via auth.users.';

-- 3) Postura de seguranca: garantir que o schema nao exponha nada por padrao.
--    Em Postgres um schema novo ja nasce sem privilegios para PUBLIC; este
--    revoke e defensivo/explicito e idempotente (no-op se nada havia).
revoke all on schema crm from public;

-- 4) Permissao MINIMA de uso do schema.
--    USAGE permite apenas "enxergar/resolver" objetos do schema; NAO concede
--    acesso a tabelas (isso sera dado por-tabela, junto da habilitacao da RLS).
grant usage on schema crm to authenticated;
grant usage on schema crm to service_role;

-- 5) Observacao deliberada (sem codigo):
--    NAO usamos ALTER DEFAULT PRIVILEGES para conceder SELECT/DML automatico a
--    `authenticated` em tabelas futuras. Isso evita uma janela de exposicao
--    entre a criacao de uma tabela e a habilitacao da sua RLS. Grants de tabela
--    serao concedidos explicitamente nas migrations das respectivas tabelas,
--    junto com `enable row level security`.
-- ============================================================================
