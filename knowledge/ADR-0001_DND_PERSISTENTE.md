---
title: "ADR-0001: Drag & Drop persistente de estágio (não aprovado)"
doc_id: "ADR-0001_DND_PERSISTENTE"
version: 1.0.0
date: 2026-06-26
status: Aceito (decisão atual) — DnD apenas visual
classification: Interno — Engenharia / Decisão de Arquitetura (ADR)
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 14_CONTROLE_DE_LEAD_FRONTEND.md
---

# ADR-0001 — Drag & Drop persistente de estágio

## Contexto
O Board de Leads tem drag & drop entre colunas (estágios). Há a tentação de, ao soltar o card,
**persistir** a mudança de estágio do lead.

## Decisão atual
**DnD persistente NÃO aprovado.** Na entrega atual (PR #7), o drag & drop é **apenas visual**:
move o card no estado local do React e **não** grava nada no banco.

## Motivo
`leads.current_stage` é **derivado** (CQRS-lite): a verdade são as entidades-filho
(`appointments`, `budgets`) e `lost_at`, e a única escritora é a função `SECURITY DEFINER`
`crm.fn_recalc_lead_stage` (ver doc 13, seções 0.6–0.8). A migration 010 inclusive **revoga** o
`UPDATE` de `current_stage` para `authenticated`.

## Risco que estamos evitando
Persistir o estágio "na mão" (arrastar = `update current_stage`) criaria **inconsistência entre a UI
e o domínio**: o valor arrastado seria sobrescrito/contradito pela derivação na próxima recalculação,
além de furar a proteção de coluna e o histórico (`lead_stage_history`).

## Condição para aprovar (no futuro)
1. O domínio definir **explicitamente quais ações** podem mudar o estágio (ex.: criar/alterar
   `appointment`/`budget`, marcar `lost_at`).
2. O "mover card" passar a **disparar essas ações de domínio** (que derivam o estágio via trigger),
   **nunca** escrever `current_stage` diretamente.
3. Tratar o caso de movimento "inválido" (que não corresponde a nenhuma ação de domínio).

## Consequências
- Board continua útil para **visualização**; reorganização manual não é salva.
- Implementação futura de persistência depende desta definição de domínio — sem ela, mantém-se visual.
