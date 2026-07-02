---
documento: CRM-MIGRATION-017_ARQUIVAMENTO_PROPOSTA
titulo: "Proposta técnica — Migration 017: crm.leads.archived_at (arquivamento operacional 24h)"
versao: 1.0
data: 2026-07-01
classificacao: L1 — Engenharia / Proposta de Migration (NÃO autorizada a aplicar)
proprietario: Jheferson (aprovação de schema crm)
modulo: Controle de Lead (CRM)
schema: crm
status: Proposta — aguardando autorização para aplicar no DEV
arquivo_sql: supabase/migrations/20260701160000_crm_leads_archived_at.sql
fonte_de_regra: [CRM-LIFECYCLE-001, CRM-CONST-001]
related_docs:
  - CRM-LIFECYCLE-001_CICLO_DE_VIDA_DO_LEAD.md
nota: >
  Documento técnico. Nenhuma migration aplicada. Cria apenas a coluna+índices;
  NÃO cria job/pg_cron/Edge Function; NÃO altera current_stage nem RLS/grants.
---

# Migration 017 — `crm.leads.archived_at` (proposta)

## 1. Objetivo
Infraestrutura mínima de dados para **arquivamento operacional 24h** (CRM-LIFECYCLE-001 §6 /
P10–P12): Compareceu e Perdido **saem da fila do Kanban** após 24h, **sem apagar histórico**.
- `archived_at IS NULL` → **visível** na fila operacional.
- `archived_at IS NOT NULL` → **arquivado** operacionalmente (lead íntegro no CRM).

## 2. Coluna criada
- `crm.leads.archived_at timestamptz` **nullable** (aditiva, sem default, sem backfill).
- Leads legados nascem com `archived_at NULL` (visíveis).
- **Não** altera `current_stage` (arquivar ≠ mudar estágio).

## 3. Índices
- `leads_archived_at_idx` em `(archived_at)` — suporta o futuro job 24h (varrer arquiváveis).
- `leads_clinic_archived_idx` em `(clinic_id, archived_at)` — suporta a query operacional do
  board (`where clinic_id = ? and archived_at is null`).

## 4. RLS / grants (sem alteração)
- **Não** altera RLS/grants de `crm.leads`. O UPDATE de `authenticated` é **por coluna** e cobre
  apenas `external_ref, lost_at, lost_by, lost_reason, owner_id, source_id, source_system`.
  Como `archived_at` **não** está nessa lista, é **gravável somente por service_role** nesta
  fase — exatamente a decisão (5/6), sem necessidade de mexer em grants/policies.

## 5. Rollback (reversível)
```sql
drop index if exists crm.leads_clinic_archived_idx;
drop index if exists crm.leads_archived_at_idx;
alter table crm.leads drop column if exists archived_at;
```

## 6. Riscos
| Sev. | Risco | Mitigação |
|---|---|---|
| Nulo | Impacto em leads/dados/jornada | Coluna nullable, sem backfill; `current_stage` intacto; sem trigger |
| Nulo | authenticated escrever `archived_at` | Impossível: fora do grant de UPDATE por-coluna |
| Baixo | Projeção do Kanban ainda não filtra `archived_at` | É frontend (fase posterior); esta migration só cria o dado |
| Baixo | Sem mecanismo automático de 24h | Deliberado: job é engenharia à parte (ver §7) |

## 7. Dependências para job 24h e reativação futura
- **Job 24h (engenharia, fora desta migration):** setar `archived_at = now()` para leads em
  Compareceu/Perdido cujo evento final tenha ≥ 24h e `archived_at IS NULL`. Mecanismo a definir
  (**pg_cron** vs **Edge Function** agendada) — via `service_role`. Regra de "evento final"
  (comparecimento/perda) já definida em CRM-LIFECYCLE-001.
- **Projeção do Kanban (frontend, fase posterior):** a query operacional passa a filtrar
  `archived_at IS NULL`; Compareceu/Perdido continuam visíveis nas 24h enquanto `archived_at`
  for NULL.
- **Arquivamento manual pelo gestor (futuro):** exigirá liberar escrita de `archived_at` a
  gestor/staff (policy/grant) — decisão de produto posterior.
- **Reativação (futuro):** funcionalidade própria seta `archived_at = NULL` (via service_role/
  RPC), preservando todo o histórico.

## 8. Recomendação
**GO** para aplicar no DEV: aditiva, reversível, sem impacto em dados/jornada/RLS; cria a base
mínima do arquivamento operacional. Aplicar no DEV → validar → então avaliar Principal.
