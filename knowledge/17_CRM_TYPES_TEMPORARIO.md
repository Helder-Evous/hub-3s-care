---
title: crm-types.ts temporário — limitação e plano de substituição
doc_id: "17_CRM_TYPES_TEMPORARIO"
version: 1.0.0-draft
date: 2026-06-26
status: Rascunho local de engenharia — dívida técnica rastreada
classification: Interno — Engenharia / TypeScript
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 14_CONTROLE_DE_LEAD_FRONTEND.md
  - 18_CRM_ROADMAP.md
---

# `crm-types.ts` temporário — limitação e plano

## 1. Por que existe
O frontend precisa de tipos TypeScript para as tabelas/enums do schema `crm`. Esses tipos estão em
**`src/integrations/supabase/crm-types.ts`** — um arquivo **manual/temporário**, derivado das
migrations 001–011. Exporta os enums (`LeadStage`, `PatientStatus`, `ActivityType`, …) e o
`CrmDatabase`/helpers (`CrmTables<...>`).

## 2. Limitação da geração oficial
- O `types.ts` oficial (gerado pelo Lovable/Supabase) cobre **apenas o schema `public`**.
- A geração via MCP `generate_typescript_types` também só emite `public`.
- A geração via CLI com `--schema public,crm` exige **owner do projeto** (Management API) ou
  conexão direta `--db-url` — não disponível no fluxo atual do agente.

Por isso as queries/mutations usam o cast `crmSchema()` = `supabase.schema("crm")` com
`as unknown as { schema: (s) => ReturnType<typeof supabase.from> }`, contornando a ausência do `crm`
no `types.ts` oficial.

## 3. Risco de drift
`crm-types.ts` é mantido **à mão**: se o schema `crm` evoluir (nova coluna/enum) sem atualizar o arquivo,
os tipos divergem do banco (drift), e o cast `as unknown` esconde erros de tipo até o runtime.
O `types.ts` oficial também está **defasado** de outras partes (ex.: `system_events`/`ai_tasks`).

## 4. Plano de substituição
1. Gerar o `types.ts` **oficial com `public,crm`** (CLI com `--db-url` da Session Pooler **OU** como
   owner do projeto): `supabase gen types --db-url '<conn>' --schema public,crm`.
2. Trocar os imports do módulo de `crm-types.ts` para o `types.ts` oficial.
3. Remover o cast `as unknown` de `crmSchema()` quando o client estiver tipado para `crm`.
4. **Remover `crm-types.ts`.**

## 5. Regra
**Remover `crm-types.ts` assim que os types oficiais `public,crm` forem gerados.** Até lá, qualquer
mudança no schema `crm` deve refletir manualmente em `crm-types.ts` no mesmo PR.
