---
title: "ADR-0004: Dono do Comparecimento (atribuição de crédito por appointment)"
doc_id: "ADR-0004_DONO_DO_COMPARECIMENTO"
version: 1.0.0
date: 2026-06-30
status: Aceito (decisão de domínio) — BLOQUEADO por gap de schema (sem migration nesta tarefa)
classification: Interno — Engenharia / Decisão de Arquitetura (ADR)
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 18_CRM_ROADMAP.md
  - ADR-0003_KANBAN_COMO_MESA_OPERACIONAL_DO_CRC.md
---

# ADR-0004 — Dono do Comparecimento

## Contexto

A 3S terá um módulo futuro de **Premiação** que recompensa o CRC pelo **comparecimento**
do paciente. É preciso definir, de forma inequívoca, **a quem pertence o comparecimento**.

## Decisão de domínio

**O comparecimento pertence ao CRC que criou o `appointment` que resultou no comparecimento.**

- **Não** pertence ao primeiro CRC que trabalhou o lead.
- **Não** pertence ao CRC que apenas confirmou o agendamento.

Exemplo:
```
Jefferson agendou → paciente faltou
Maria remarcou (novo appointment) → paciente compareceu
⇒ o comparecimento pertence a Maria (criadora do appointment que gerou o compareceu)
```

Isso reforça a decisão do S2-2B de que **remarcar cria um NOVO appointment** vinculado por
`rescheduled_from` (não atualiza a data do antigo): cada appointment carrega o crédito do seu
criador, e o comparecimento credita o criador do appointment efetivamente comparecido.

## Gap crítico de schema (FATO confirmado)

A tabela `crm.appointments` **NÃO possui** coluna que identifique **quem criou** o
agendamento. Colunas atuais: `id, clinic_id, patient_id, lead_id, status, scheduled_at,
confirmed_at, attended_at, no_show_at, cancelled_at, rescheduled_from, professional_name,
procedure_name, codefy_id, source_system, external_ref, synced_at, reconciliation_status,
created_at, updated_at`. Há `created_at`, mas **não** `created_by`/`booked_by`.

**Consequência:** com o schema atual é **impossível** atribuir o comparecimento ao CRC
criador. Qualquer appointment criado hoje (S2-2A) **já nasce sem essa rastreabilidade** —
dado perdido de forma irreversível para fins de premiação.

## Proposta (requer migration futura — NÃO autorizada nesta tarefa)

Adicionar a `crm.appointments` uma coluna **`created_by uuid`** (referência lógica a
`auth.users`/`crm.user_profiles`), preenchida no INSERT com `auth.uid()` do operador, e
**protegida** (sem UPDATE por `authenticated`, à semelhança das colunas derivadas de `leads`).
O "dono do comparecimento" é então `appointment.created_by` do appointment com
`status='compareceu'`.

Alternativas a avaliar na etapa de migration:
- `created_by` simples (recomendado) — mínimo necessário.
- `booked_by` + `confirmed_by` separados, se a premiação precisar distinguir papéis.

## Consequências
- **Premiação só é construível após a migration** de `created_by`.
- Quanto mais cedo a coluna existir, menos histórico de atribuição se perde.

## Riscos
- **Crítico:** continuar criando appointments (S2-2A/S2-2B) sem `created_by` acumula
  agendamentos sem dono — base de premiação incompleta e não reconstituível.
- **Médio:** decidir tarde entre `created_by` único vs papéis múltiplos pode exigir segunda migration.

## Status
**Decisão de domínio aceita.** **Bloqueada** pela ausência de `created_by` em
`crm.appointments`. Recomenda-se priorizar essa migration (via fluxo DEV → principal, com
aprovação de Jefferson por tocar o schema `crm`) **antes** de ampliar a criação de
appointments. Nenhuma migration foi feita nesta tarefa.
