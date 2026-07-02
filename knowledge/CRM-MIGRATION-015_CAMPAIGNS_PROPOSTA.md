---
documento: CRM-MIGRATION-015_CAMPAIGNS_PROPOSTA
titulo: "Proposta técnica — Migration 015: crm.campaigns + crm.leads.campaign_id"
versao: 1.0
data: 2026-07-01
classificacao: L1 — Engenharia / Proposta de Migration (NÃO autorizada a aplicar)
proprietario: Jheferson (aprovação de schema crm)
modulo: Controle de Lead (CRM)
schema: crm
status: Proposta — aguardando autorização para aplicar no DEV
arquivo_sql: supabase/migrations/20260701140000_crm_campaigns.sql
fonte_de_regra: [CRM-DATA-001, CRM-BR-001, CRM-LIFECYCLE-001]
related_docs:
  - CRM-MESTRE-VOL2-DOMINIO-DADOS-EVENTOS.md
  - CRM-MESTRE-VOL1-FUNDACAO.md
nota: >
  Documento técnico. Nenhuma migration aplicada. Espelha o padrão do catálogo
  crm.lead_sources. Não torna campaign_id obrigatório, não altera source_id,
  não faz backfill.
---

# Migration 015 — `crm.campaigns` + `crm.leads.campaign_id` (proposta)

## 1. Objetivo
Introduzir **Campanha** como entidade **independente de Origem** (regra "Origem ≠ Campanha",
CRM-BR-001/CRM-DATA-001). Origem (`leads.source_id`) permanece **obrigatória e inalterada**;
Campanha (`leads.campaign_id`) é **opcional**.

## 2. Estrutura da tabela `crm.campaigns`
| Coluna | Tipo | Nulo | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `clinic_id` | uuid | NO | — |
| `name` | text | NO | — |
| `active` | boolean | NO | `true` |
| `start_date` | date | YES | — |
| `end_date` | date | YES | — |
| `created_at` | timestamptz | NO | `now()` |
| `updated_at` | timestamptz | NO | `now()` |

- **`active boolean default true`** segue o padrão real do catálogo `lead_sources` (não há
  enum de status para catálogos no schema).
- **CHECK** `campaigns_dates_ck`: `end_date >= start_date` quando ambas existirem.
- **UNIQUE** `campaigns_clinic_name_uq` em `(clinic_id, name)`: sem campanha duplicada por clínica.

## 3. Coluna em `crm.leads`
- `campaign_id uuid` **nullable** (aditiva). **`source_id` não é tocada.**
- FK `leads_campaign_fk` → `crm.campaigns(id)` `ON DELETE RESTRICT` (mesmo padrão de
  `source_id → lead_sources`: não se apaga uma campanha em uso).
- Índice `leads_campaign_idx` em `(campaign_id)`.

## 4. FKs / índices / RLS / grants
- **FKs:** `campaigns_clinic_fk` (`clinic_id → public.clinics(id)` **ON DELETE CASCADE**, igual
  a `lead_sources`); `leads_campaign_fk` (`campaign_id → campaigns(id)` **RESTRICT**).
- **Índices:** `campaigns_clinic_id_idx (clinic_id)`; `leads_campaign_idx (campaign_id)`.
- **Trigger:** `trg_campaigns_touch_updated_at` (`crm.fn_touch_updated_at`).
- **Grants:** `authenticated` → **SELECT**; `service_role` → **ALL** (padrão do catálogo).
- **RLS:** RLS habilitado; **SELECT** por clínica: `is_staff_3s() OR (user_has_clinic_access
  AND module_enabled_for_clinic)`. **Sem** policy de INSERT/UPDATE/DELETE p/ `authenticated`
  → escrita **server-side** (service_role), como `lead_sources`. `leads` **não** tem RLS/grants
  alterados (coluna aditiva; INSERT já cobre a nova coluna).

## 5. Rollback (reversível)
```sql
alter table crm.leads drop constraint if exists leads_campaign_fk;
drop index if exists crm.leads_campaign_idx;
alter table crm.leads drop column if exists campaign_id;
drop table if exists crm.campaigns;  -- remove indice/trigger/policies junto
```

## 6. Riscos
| Sev. | Risco | Mitigação |
|---|---|---|
| Nulo | Impacto em leads/dados existentes | Coluna nullable, sem backfill; `source_id` intacto |
| Baixo | `leads.campaign_id` apontar campanha de **outra clínica** | FK simples (mesmo padrão de `source_id`). Se quiser reforço, futuro: `unique(id, clinic_id)` em campaigns + FK composta `(campaign_id, clinic_id)` |
| Baixo | Gestão de campanhas via app | Nesta fase é **read-only** p/ authenticated (padrão catálogo); policy de escrita p/ gestor/staff pode ser adicionada depois se o produto exigir |
| Nulo | Nomes de campanha duplicados por clínica | Resolvido: UNIQUE `(clinic_id, name)` |
| Nulo | Kanban/status/scheduled_by/source_id | Nenhuma alteração |

## 7. Validações planejadas no DEV
1. Aplicar no DEV; confirmar tabela `campaigns` (colunas/CHECK), FKs, índices, trigger, RLS, grants.
2. Confirmar `leads.campaign_id` nullable + FK + índice; `leads` existentes com `campaign_id NULL` (sem backfill).
3. **Leitura RLS:** como CRC da clínica X, `select` de campanha da própria clínica → visível; de outra clínica → não.
4. **Escrita bloqueada:** `authenticated` tentar `insert`/`update`/`delete` em campaigns → negado (sem grant/policy).
5. **Vínculo:** criar campanha (service_role) e inserir/atualizar lead com `campaign_id` válido → sucesso; lead com Origem e **sem** Campanha → sucesso.
6. **FK inválida:** `campaign_id` inexistente → falha.
7. **CHECK datas:** `end_date < start_date` → falha.
8. **Não-regressão:** `source_id`, Kanban, RLS de leads e app inalterados; advisors sem issue novo.

## 8. Recomendação
**GO** para aplicar no DEV: aditiva, reversível, sem impacto em dados/lógica existentes,
espelha o catálogo `lead_sources`, cumpre "Origem ≠ Campanha". Aplicar no DEV → validar (§7)
→ então avaliar Principal.
