---
title: Controle de Lead — Roadmap pós-MVP
doc_id: "18_CRM_ROADMAP"
version: 1.0.0-draft
date: 2026-06-26
status: Rascunho local de engenharia — pendências e próximos passos
classification: Interno — Engenharia / Planejamento
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 14_CONTROLE_DE_LEAD_FRONTEND.md
  - 16_CRM_DADOS_DE_TESTE.md
  - 17_CRM_TYPES_TEMPORARIO.md
  - ADR-0001_DND_PERSISTENTE.md
---

# Controle de Lead — Roadmap pós-MVP

## 0. Antes do merge do PR #7 (checklist)
- [ ] Click-test logado como operador (board, novo lead, detalhe, atividade).
- [ ] Gerar `types.ts` oficial `public,crm` e **remover `crm-types.ts`** (doc 17).
- [ ] **Limpar dados de teste** `[SEED]`/`[TESTE UI]` (doc 16) — sob autorização.
- [ ] Revisar o PR (sair de Draft) e mergear para `main`.

## 1. Próximos incrementos (frontend/domínio)
- **Detalhe — ações reais:** registrar/editar **agendamentos** (`appointments`) e **orçamentos**
  (`budgets`) pela UI (hoje só leitura) — disparando a derivação de estágio por trigger.
- **DnD persistente:** somente após a decisão de domínio do `ADR-0001`.
- **Reatribuição de responsável** e **embed do nome do owner** no board.
- **Edição/anexos de atividades**, data manual (`occurred_at`) — fora do MVP atual.

## 2. Funil clínico (estágios futuros)
- `em_avaliacao` (`evaluations`), `efetivado` (`treatments`/1º procedimento), `pos_venda` (`post_sales`).
- `clinical_revenue` (receita clínica — **nunca** confundir com receita 3S).

## 3. Dashboards / KPIs
- Views no schema `crm` (invoker rights, respeitando RLS): total/origem/CRC, taxas de contato/
  agendamento/comparecimento, leads sem retorno; card `vw_modulo_overview` na home do HUB.

## 4. Eventos (`public.system_events`)
- Emitir eventos de topo de funil na camada de mutation (lead_created, lead_contacted,
  lead_stage_changed, …). **Ainda não implementado** — apenas seams previstos (doc 13, §7).

## 5. IA (`public.ai_tasks`)
- Tarefas operacionais (lead_sem_contato, agendado_sem_confirmacao, orcamento_sem_aceite, …) e,
  depois, `lead_scores`/recomendações (doc 13, §8 e §11). **Fora do escopo atual.**

## 6. Integração Codefy
- Conciliação por `codefy_id` (upsert idempotente) para o fundo do funil (agendamento/comparecimento/
  tratamento/receita) — seams já existem nas tabelas; integração inativa.

## 7. Dívidas técnicas rastreadas
- `crm-types.ts` temporário (doc 17).
- Migrations aplicadas via MCP uma a uma (fora de `db push`) — possível divergência com o histórico
  do Supabase CLI; reconciliar se for adotar `db push`.
- Exposição do `crm` via `pgrst.db_schemas` sujeita a sobrescrita pelo Dashboard (doc 15).
