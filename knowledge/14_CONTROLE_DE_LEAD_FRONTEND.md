---
title: Controle de Lead — Operação Frontend
doc_id: "14_CONTROLE_DE_LEAD_FRONTEND"
version: 1.0.0-draft
date: 2026-06-26
status: Rascunho local de engenharia — reflete o MVP entregue no PR #7
classification: Interno — Engenharia / Frontend
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 15_CRM_POSTGREST_EXPOSURE.md
  - 17_CRM_TYPES_TEMPORARIO.md
  - ADR-0001_DND_PERSISTENTE.md
---

# Controle de Lead — Operação Frontend

> Documento **local de engenharia** descrevendo o frontend do módulo entregue no PR #7
> (branch `feat/crm-controle-lead`). Stack: TanStack Start (React 19) + TanStack Query v5 +
> Tailwind v4 + shadcn/Radix + Supabase JS. Não é a KB oficial da 3S.

## 1. Rotas
| Rota | Arquivo | Função |
|---|---|---|
| `/crm/controle-lead` | `src/routes/crm.controle-lead.index.tsx` | Board de Leads (kanban por estágio) |
| `/crm/controle-lead/$id` | `src/routes/crm.controle-lead.$id.tsx` | Detalhe do lead (somente leitura + registrar atividade) |

Item de menu no `AppShell` (área "Operações" → "Controle de Lead" → "Board de Leads").
`routeTree.gen.ts` é **gerado automaticamente** pelo build — nunca editar à mão.

## 2. Estrutura da feature (`src/features/crm/controle-lead/`)
```
types.ts        # tipos de UI (LeadBoardCard, LeadDetailData, linhas de histórico/atividade/...)
labels.ts       # rótulos PT-BR + tons (estágio, origem, activity/appointment/budget status), opções de select
utils.ts        # groupLeadsByStage, maskPhone, formatRelative/formatDate/formatDateTime/formatCurrency
queries.ts      # leituras (useLeadsBoard, useLeadDetail, useLeadSources, useEligibleClinics) + crmSchema()
mutations.ts    # escritas (useCreateLead + dedup, useCreateLeadActivity) + mapMutationError
index.ts        # barrel da feature (data)
components/      # board e detalhe (ver abaixo) + barrel
```
`components/`: `LeadBoard`, `LeadColumn`, `LeadCard`, `DraggableLeadCard`, `NewLeadModal`,
`LeadDetailView`, `LeadDetailHeader`, `LeadStageHistory`, `LeadActivities`, `LeadAppointments`,
`LeadBudgets`, `NewActivityModal`.
Convenção: **a rota é fina** (estados/composição ficam em `components/`, ex.: `LeadDetailView`).

## 3. Board de Leads
- `useLeadsBoard()` lê `crm.leads` com embeds `patients(...)` e `lead_sources(...)`, ordenado por `created_at desc`.
- Colunas: ordem canônica + `perdido` ao final; cada coluna com **contador**; scroll horizontal.
- Cards: nome, telefone (mascarado), badge de origem, responsável, criação, "sem contato".
- **Drag & Drop apenas visual** (@dnd-kit): move o card no estado local; **não persiste, não muta, não altera estágio** (ver `ADR-0001`).

## 4. Novo Lead (real)
- `NewLeadModal` → `useCreateLead`. Campos: Nome, Telefone, Origem (catálogo via `useLeadSources`), Responsável (= operador atual).
- Clínica resolvida por `useEligibleClinics()` (`crm.module_clinics enabled=true`, escopada por RLS); 1 clínica → silenciosa; >1 → seletor.
- **Deduplicação de paciente por telefone normalizado** (E.164, replica o trigger): reusa paciente existente ou cria; nunca duplica.
- `createLead` insere `clinic_id, patient_id, source_id, owner_id = auth.uid()`. **Não** seta `current_stage` (default `novo`, derivado).
- Validação client-side (nome ≥ 2, telefone válido); erros via `mapMutationError` + toast.

## 5. Detalhe do Lead
- `useLeadDetail(id)`: **1 query agregada** em `crm.leads` com embeds `patients`, `lead_sources`,
  `owner` (via `leads_owner_id_fkey`), `lead_stage_history`, `lead_activities`, `appointments`, `budgets`.
- Ordenação das listas é feita no client (mais recente primeiro).
- Seções: cabeçalho (paciente/telefone/origem/estágio/responsável/criado em), histórico de estágio,
  atividades, agendamentos, orçamentos — cada uma com estado vazio.

## 6. Registro de Atividades
- `NewActivityModal` (no card de Atividades) → `useCreateLeadActivity`. Campos: Tipo (enums) + Observação.
- Insere em `crm.lead_activities` com colunas **reais** `performed_by = auth.uid()` e `summary`
  (não existem `created_by`/`notes`). **Não** escreve `last_contact_at`/`last_activity_at` (trigger deriva).
- Ao salvar: invalida `["crm","controle-lead","detail"]` **e** `["crm","controle-lead","board"]`.

## 7. Acesso ao schema `crm` e cache
- Todas as queries/mutations usam `crmSchema()` (cast `supabase.schema("crm")`) — ver `17_CRM_TYPES_TEMPORARIO.md`.
- Query keys: board `["crm","controle-lead","board"]`; detalhe `["crm","controle-lead","detail", id]`;
  catálogos `lead-sources` / `eligible-clinics`.
- Toaster (sonner) montado **dentro do módulo** (board e `LeadDetailView`), não global.

## 8. Limitações conhecidas
- DnD não persiste (visual). Sem edição/exclusão de atividades, sem anexos, sem data manual (`occurred_at = now()`).
- "Responsável"/autor exibe nome só quando a RLS de `user_profiles` permite (self/staff).
- `crm-types.ts` é temporário (cast `as unknown`), a substituir por types oficiais public+crm.
- Validação visual logada não automatizada (feita por build/typecheck + simulação RLS).
- 23 erros de `tsc` **pré-existentes** fora do módulo (calendar/events/eventos) — não relacionados.
