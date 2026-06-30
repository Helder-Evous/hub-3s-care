---
title: "ADR-0002: Kanban do Controle de Lead como Projeção Operacional"
doc_id: "ADR-0002_KANBAN_COMO_PROJECAO_OPERACIONAL"
version: 1.0.0
date: 2026-06-29
status: Aceito (decisão atual) — implementado no PR #9 (S2-0)
classification: Interno — Engenharia / Decisão de Arquitetura (ADR)
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 14_CONTROLE_DE_LEAD_FRONTEND.md
  - 18_CRM_ROADMAP.md
  - ADR-0001_DND_PERSISTENTE.md
---

# ADR-0002 — Kanban do Controle de Lead como Projeção Operacional

## Contexto

A operação da 3S **não** é um CRM comercial tradicional. O trabalho do CRC é: receber/capturar
lead → fazer contato → agendar → remarcar quando necessário → garantir comparecimento →
registrar efetivação quando houver confirmação → marcar perdido quando não houver avanço. O CRC
**não negocia orçamento** e **não faz pós-venda clínica**.

O board (Kanban) do Controle de Lead, no MVP do PR #7, agrupava os cards diretamente por
`lead.current_stage` — um enum mais amplo (`novo, agendado, compareceu, em_avaliacao, orcamento,
efetivado, pos_venda, perdido`) cujo conteúdo não corresponde ao fluxo operacional da 3S.

`current_stage` é um valor **derivado** do domínio (CQRS-lite): a única escritora é a função
`crm.fn_recalc_lead_stage` (`SECURITY DEFINER`), a partir de `appointments`, `budgets` e `lost_at`
(ver doc 13, §0.6–0.8 e `ADR-0001`).

## Problema

Usar `current_stage` como fonte direta das colunas tem dois problemas:

1. **Domínio ≠ operação:** o enum expõe etapas (`em_avaliacao`, `orcamento`, `pos_venda`) que não
   orientam o trabalho do CRC, poluindo o board.
2. **Histórico ≠ próxima ação:** `current_stage` é monotônico/histórico (nunca regride, exceto
   `perdido`). A operação precisa saber **a próxima ação esperada**, que pode divergir do histórico
   — ex.: um lead que **compareceu** no passado mas tem **novo agendamento futuro** deve aparecer
   como **Agendado**, não Compareceu.

Não existe, ainda, coluna `remarcar` no enum, embora seja um estado operacional essencial. E não
existe fonte de verdade robusta para `efetivado`.

## Decisão

O Kanban do Controle de Lead é uma **projeção operacional**, calculada a partir dos fatos do
domínio, que responde: **"qual é a próxima ação esperada do CRC para este lead?"**.

**Regra central — quando houver conflito entre histórico e próxima ação, vence a próxima ação.**

### Colunas operacionais (UI)
`Novo Lead`, `Agendado`, `Remarcar`, `Compareceu`, `Efetivou`, `Perdido`.
`em_avaliacao`, `orcamento`, `pos_venda` **continuam no enum**, mas **não** são colunas do board.

### Prioridade aprovada (primeira condição satisfeita vence)
| Prioridade | Condição | Coluna |
|---:|---|---|
| 1 | `lost_at` preenchido | Perdido |
| 2 | existe agendamento futuro ativo (`scheduled_at >= now`, status `agendado/confirmado/remarcado`) | Agendado |
| 3 | agendamento vencido sem desfecho (`scheduled_at < now`, status `agendado/confirmado/remarcado`) **ou** `faltou`/`cancelado` sem novo futuro ativo | Remarcar |
| 4 | fonte confiável de efetivação (hoje: `current_stage='efetivado'`) | Efetivou |
| 5 | comparecimento passado sem agendamento futuro | Compareceu |
| 6 | nenhuma condição anterior | Novo Lead |

> Nota de implementação: por `efetivado` ter hoje como única fonte `current_stage='efetivado'`, a
> checagem da coluna Efetivou é avaliada **antes** de Compareceu, para que um comparecimento passado
> não mascare uma efetivação já confirmada. `Perdido`/`Agendado`/`Remarcar` mantêm precedência.

### Propriedades invioláveis
- O Kanban **não é fonte da verdade**, **não escreve estado no banco**, **não substitui
  `lead_stage_history`**, **não substitui `current_stage`**, **não altera entidades**.
- `current_stage` e `lead_stage_history` permanecem como domínio e são exibidos no **detalhe**/**histórico**.
- A projeção é **somente leitura** e extensível: hoje considera `leads` e `appointments`; no
  futuro, importações, relatórios da clínica, integrações e IA supervisionada.
- **DnD permanece apenas visual** (ver `ADR-0001`): move o card entre colunas no estado local, sem
  persistir e sem escrever `current_stage`.

### Implementação (PR #9 — S2-0)
- `src/features/crm/controle-lead/operational-state.ts`: `resolveLeadOperationalState(lead, appointments, now)`
  e o tipo `LeadOperationalColumn`.
- `queries.ts`: o board passa a embutir `appointments(id, scheduled_at, status, attended_at, confirmed_at)`.
- `utils.ts`: `groupLeadsByOperationalColumn` substitui `groupLeadsByStage`.
- `labels.ts`: `OPERATIONAL_COLUMN_ORDER/LABELS/TONE`.
- `LeadBoard.tsx`: agrupamento e DnD visual sobre colunas operacionais.

## Consequências

**Positivas**
- O board reflete o trabalho real do CRC (próxima ação), não um enum genérico.
- `remarcar` existe como coluna operacional **sem** migration, sem alterar o enum.
- Domínio e histórico permanecem intactos e auditáveis.
- Base pronta para o S2-2 (Gestão de Agendamentos) alimentar diretamente a projeção.

**Negativas / custos**
- A coluna exibida pode divergir de `current_stage`, exigindo clareza na UI (board = operação;
  detalhe = domínio).
- A query do board ficou um pouco mais pesada (embed de `appointments`).
- `efetivado` permanece com fonte de verdade frágil (lacuna documentada).

## Alternativas consideradas

1. **Manter o board copiando `current_stage`** — rejeitada: expõe etapas não operacionais e não
   representa a próxima ação.
2. **Alterar o enum `lead_stage`** (adicionar `remarcar`, remover etapas) — rejeitada agora:
   exigiria migration + canonicalização (frente de governança separada), tocaria o ativo CRM de
   Jefferson e enrijeceria a UI; a projeção resolve sem custo de banco.
3. **Persistir a coluna operacional no banco** — rejeitada: violaria a derivação (CQRS-lite) e o
   `ADR-0001`; criaria inconsistência com `current_stage`.

## Riscos

- **`efetivado` sem fonte robusta** (Alto): depende de `current_stage='efetivado'` até existir
  entidade/flag de efetivação. Risco de coluna Efetivou subutilizada.
- **Leads em `em_avaliacao`/`orcamento`/`pos_venda`** (Médio): hoje, sem appointments, projetam para
  `Novo Lead`; destino visual a decidir (roadmap §1.1).
- **Timezone** (Médio): "futuro/vencido" compara `scheduled_at` com `now` — centralizar a regra.
- **DnD visual** (Médio): pode sugerir persistência; mitigar com cópia/UX (e `ADR-0001`).

## Status

**Aceito** e implementado no PR #9 (branch `helder/s2-0-projecao-operacional-kanban`, base
`feat/crm-controle-lead`). DnD persistente continua **não aprovado** (`ADR-0001`). S2-2 (Gestão de
Agendamentos) **não iniciado**.
