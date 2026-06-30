---
title: "ADR-0004: Dono do Comparecimento (atribuição de crédito por appointment)"
doc_id: "ADR-0004_DONO_DO_COMPARECIMENTO"
version: 1.1.0
date: 2026-06-30
status: Aceito (decisão de domínio) — BLOQUEADO por gap de schema (sem migration nesta tarefa)
classification: Interno — Engenharia / Decisão de Arquitetura (ADR)
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 18_CRM_ROADMAP.md
  - ADR-0003_KANBAN_COMO_MESA_OPERACIONAL_DO_CRC.md
  - ADR-0005_FONTES_DE_DADOS_DO_CONTROLE_DE_LEAD.md
changelog:
  - 1.0.0 (2026-06-30): decisão inicial usando `created_by`.
  - 1.1.0 (2026-06-30): conceito renomeado para `scheduled_by` (CRC responsável operacional
    pelo agendamento), não "quem criou tecnicamente a linha".
---

# ADR-0004 — Dono do Comparecimento

## Contexto

A 3S terá um módulo futuro de **Premiação** que recompensa o CRC pelo **comparecimento**
do paciente. É preciso definir, de forma inequívoca, **a quem pertence o comparecimento**.

## Conceito: `scheduled_by` (não `created_by`)

O campo que identifica o dono do appointment é **`scheduled_by`** — o **CRC responsável
operacional pelo agendamento**. **Não** é "quem criou tecnicamente a linha no banco" (isso
seria `created_by`, que pode ser um job de importação, uma integração ou outro usuário). Por
isso o nome `created_by` foi **descartado** em favor de `scheduled_by`, alinhado à convenção
do schema `crm` (`performed_by`, `changed_by`, `lost_by`). (Forma verbosa equivalente:
`scheduled_by_user_id`; adotamos `scheduled_by` por consistência.)

## Decisão de domínio

**O comparecimento pertence ao CRC que executou o último agendamento válido do lead** — ou
seja, ao **`scheduled_by` do appointment que recebeu `status='compareceu'`**.

- **Não** pertence ao primeiro CRC que trabalhou o lead.
- **Não** pertence ao CRC que apenas confirmou o agendamento.
- **Não** depende de quem importou/criou a linha (Relatório Agenda, job, integração).

**Relação com o Relatório Agenda (ADR-0005):** o Relatório Agenda apenas **atualiza o status**
do appointment (`compareceu`/`faltou`/`cancelou`). Ele **NUNCA** define ou sobrescreve o dono —
o dono é sempre o `scheduled_by` gravado quando o agendamento foi executado pelo CRC.

Exemplo:
```
Jheferson agendou (scheduled_by = Jheferson) → paciente faltou
Maria remarcou: novo appointment (scheduled_by = Maria, rescheduled_from = o de Jheferson)
→ paciente compareceu (Relatório Agenda marca status = compareceu)
⇒ o comparecimento pertence a Maria (scheduled_by do appointment comparecido)
```

Isso reforça a decisão do S2-2B de que **remarcar cria um NOVO appointment** vinculado por
`rescheduled_from` (não atualiza a data do antigo): cada appointment carrega o `scheduled_by`
do CRC que o executou, e o comparecimento credita o `scheduled_by` do appointment comparecido.

## Gap crítico de schema (FATO confirmado)

A tabela `crm.appointments` **NÃO possui** coluna que identifique o CRC responsável pelo
agendamento. Colunas atuais: `id, clinic_id, patient_id, lead_id, status, scheduled_at,
confirmed_at, attended_at, no_show_at, cancelled_at, rescheduled_from, professional_name,
procedure_name, codefy_id, source_system, external_ref, synced_at, reconciliation_status,
created_at, updated_at`. Há `created_at`, mas **não** `scheduled_by` (nem `created_by`/`booked_by`).

**Consequência:** com o schema atual é **impossível** atribuir o comparecimento ao CRC. Qualquer
appointment criado hoje (S2-2A) **já nasce sem essa rastreabilidade** — dado perdido de forma
irreversível para fins de premiação.

## Proposta (requer migration futura — NÃO autorizada nesta tarefa)

Adicionar a `crm.appointments` uma coluna **`scheduled_by uuid`** (referência lógica a
`auth.users`/`crm.user_profiles`), preenchida na execução do agendamento com o CRC responsável
(no fluxo manual, `auth.uid()` do operador), e **protegida** (sem UPDATE por `authenticated`,
à semelhança das colunas derivadas de `leads`). O "dono do comparecimento" é então o
`scheduled_by` do appointment com `status='compareceu'`.

Notas de modelagem para a etapa de migration:
- `scheduled_by` (recomendado) — o CRC responsável operacional pelo agendamento.
- Em importações/integrações, `scheduled_by` deve refletir o CRC informado na origem (não o
  job). Se a origem não informar o CRC, definir regra de atribuição explícita.
- Opcional futuro: `confirmed_by` separado, se a premiação precisar distinguir papéis.

## Consequências
- **Premiação só é construível após a migration** de `scheduled_by`.
- Quanto mais cedo a coluna existir, menos histórico de atribuição se perde.

## Riscos
- **Crítico:** continuar criando appointments (S2-2A/S2-2B) sem `scheduled_by` acumula
  agendamentos sem dono — base de premiação incompleta e não reconstituível.
- **Médio:** decidir tarde entre `scheduled_by` único vs papéis múltiplos pode exigir segunda migration.

## Status
**Decisão de domínio aceita.** **Bloqueada** pela ausência de `scheduled_by` em
`crm.appointments`. Recomenda-se priorizar essa migration (via fluxo DEV → principal, com
aprovação de Jheferson por tocar o schema `crm`) **antes** de ampliar a criação de
appointments. Nenhuma migration foi feita nesta tarefa.
