---
documento: CRM-MIGRATION-018_EVENTS_PROPOSTA
titulo: "Proposta técnica — Migration 018: crm.events + crm.lead_timeline (view)"
versao: 1.0
data: 2026-07-02
classificacao: L1 — Engenharia / Proposta de Migration (NÃO autorizada a aplicar)
proprietario: Jheferson (aprovação de schema crm)
modulo: Controle de Lead (CRM)
schema: crm
status: Proposta — aguardando autorização para aplicar no DEV
arquivo_sql: supabase/migrations/20260701170000_crm_events.sql
fonte_de_regra: [CRM-EVT-001, CRM-LIFECYCLE-001, CRM-IA-001, CRM-KPI-001]
related_docs:
  - CRM-MESTRE-VOL2-DOMINIO-DADOS-EVENTOS.md
  - CRM-LIFECYCLE-001_CICLO_DE_VIDA_DO_LEAD.md
nota: >
  Documento técnico. Nenhuma migration aplicada. Só infraestrutura (enum+tabela+
  view+índices+grants+RLS). NÃO cria triggers de emissão; NÃO altera system_events.
  Append-only (sem UPDATE/DELETE). Timeline é VIEW derivada (sem duplicidade).
---

# Migration 018 — `crm.events` + `crm.lead_timeline` (proposta)

## 1. Objetivo
Fundação de **eventos imutáveis** do domínio CRM por Lead (CRM-EVT-001), base para IA,
dashboards, auditoria e integrações. **Timeline = view derivada** de `events`. Coexiste com
`public.system_events` (camada global) — **não** tocada.

## 2. Enum de eventos `crm.crm_event_type` (catálogo CRM-EVT-001, fechado inicial)
`LeadCreated, LeadAssigned, LeadLost, LeadReactivated, LeadArchived, AttemptCreated,
AttemptAutoCreated, AppointmentCreated, AppointmentConfirmed, AppointmentRescheduled,
AppointmentCancelled, AppointmentAttended, RevenueRegistered, PresenceStarted, PresenceEnded`
(15 valores). Evolutivo (novos tipos por migration futura).

## 3. Estrutura de `crm.events`
| Coluna | Tipo | Nulo | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `clinic_id` | uuid | NO | — |
| `lead_id` | uuid | NO | — |
| `event_type` | `crm.crm_event_type` | NO | — |
| `entity_type` | text | YES | — |
| `entity_id` | uuid | YES | — |
| `actor_type` | text | YES | — |
| `actor_id` | uuid | YES | — (sem FK) |
| `occurred_at` | timestamptz | NO | `now()` |
| `payload` | jsonb | NO | `'{}'` |
| `created_at` | timestamptz | NO | `now()` |

- **Sem `updated_at`** (imutável). **Append-only.**
- **Anti cross-clinic:** FK composta `(lead_id, clinic_id) → leads(id, clinic_id)` RESTRICT +
  `clinic_id → public.clinics(id)` RESTRICT.
- **`actor_id` sem FK** (ator pode ser IA/sistema/api sem `user_profile`; `actor_type` desambigua).

## 4. Estrutura da view `crm.lead_timeline`
- `create view crm.lead_timeline with (security_invoker = true) as select ... from crm.events order by lead_id, occurred_at desc;`
- **`security_invoker = true`** → herda a **RLS de `crm.events`** (por clínica) para quem
  consulta; **evita** view `SECURITY DEFINER` (sem furo de RLS).
- Projeção (não materializa) → **sem duplicidade**; imutável por consequência.
- Colunas: `id, clinic_id, lead_id, event_type, entity_type, entity_id, actor_type, actor_id, occurred_at, payload`.

## 5. Índices
- `events_lead_occurred_idx (lead_id, occurred_at)` — timeline por lead (base da view).
- `events_clinic_occurred_idx (clinic_id, occurred_at)` — varreduras por clínica.
- `events_event_type_idx (event_type)` — filtro por tipo.

## 6. RLS / grants
- **RLS** habilitado em `crm.events`; **SELECT** por clínica (`is_staff_3s() OR
  (user_has_clinic_access AND module_enabled_for_clinic)`). **Sem** policy de
  INSERT/UPDATE/DELETE.
- **Grants:** `authenticated` → **SELECT**; `service_role` → **SELECT + INSERT** (append-only —
  **sem** update/delete/truncate, reforçando imutabilidade até para service_role).
- **View:** `grant select` p/ authenticated e service_role; RLS aplicada via `security_invoker`.

## 7. Rollback (reversível)
```sql
drop view if exists crm.lead_timeline;
drop table if exists crm.events;   -- remove índices/policies junto
drop type if exists crm.crm_event_type;
```

## 8. Riscos
| Sev. | Risco | Mitigação |
|---|---|---|
| Nulo | Impacto em dados/system_events/jornada | Tabela+view novas; system_events intacto; sem trigger |
| Baixo | `actor_id`/`entity_id` sem FK (integridade referencial fraca) | Deliberado (atores/entidades heterogêneos); `actor_type`/`entity_type` desambiguam; validação fica na camada de emissão |
| Baixo | View sem RLS própria | Mitigado por `security_invoker=true` (herda RLS de events) |
| Baixo/INFO | FK composta `(lead_id, clinic_id)` sem índice de cobertura dedicado | `(lead_id, occurred_at)` cobre buscas por lead; mesmo padrão das irmãs |
| Nulo | Emissão de eventos | Fora do escopo (camada futura); tabela nasce vazia |

## 9. Validações planejadas no DEV
1. Aplicar no DEV; confirmar enum (15 valores), tabela, colunas, FKs, índices, RLS, grants, view.
2. **View security_invoker:** confirmar `reloptions` da view = `security_invoker=true`.
3. **service_role insere** evento válido (ex.: `LeadCreated`) → sucesso; aparece em `lead_timeline`.
4. **Anti cross-clinic:** evento com `clinic_id` ≠ do lead → falha (FK composta).
5. **event_type inválido** (fora do enum) → falha.
6. **Append-only:** `authenticated` `insert/update/delete` → negado; `service_role` `update/delete` → negado (sem grant).
7. **Leitura RLS:** CRC lê eventos/timeline da própria clínica; de outra clínica → não.
8. **Não-regressão:** `public.system_events`, leads/Kanban/app inalterados; advisors sem issue novo (em especial **sem** `security_definer_view` para `lead_timeline`).

## 10. Recomendação
**GO** para aplicar no DEV: aditiva, reversível, append-only, sem impacto em system_events/
jornada; view sem furo de RLS (`security_invoker`). Aplicar no DEV → validar (§9) → então
avaliar Principal.
