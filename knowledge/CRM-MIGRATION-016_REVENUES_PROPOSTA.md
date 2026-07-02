---
documento: CRM-MIGRATION-016_REVENUES_PROPOSTA
titulo: "Proposta técnica — Migration 016: crm.revenues"
versao: 1.0
data: 2026-07-01
classificacao: L1 — Engenharia / Proposta de Migration (NÃO autorizada a aplicar)
proprietario: Jheferson (aprovação de schema crm)
modulo: Controle de Lead (CRM)
schema: crm
status: Proposta — aguardando autorização para aplicar no DEV
arquivo_sql: supabase/migrations/20260701150000_crm_revenues.sql
fonte_de_regra: [CRM-BR-001, CRM-LIFECYCLE-001, CRM-KPI-001]
related_docs:
  - CRM-MESTRE-VOL1-FUNDACAO.md
  - CRM-LIFECYCLE-001_CICLO_DE_VIDA_DO_LEAD.md
nota: >
  Documento técnico. Nenhuma migration aplicada. NÃO remove nem altera crm.budgets
  (mantido como histórico, tratado como DEPRECATED — ver §Deprecação). Receita é
  indicador e NÃO altera a jornada (sem recálculo de current_stage).
---

# Migration 016 — `crm.revenues` (proposta)

## 1. Objetivo
Registrar a **receita efetivamente gerada** por um Lead como entidade oficial, permitindo
**múltiplas receitas por Lead** (acumuláveis). **Receita é indicador estratégico e não altera
a jornada operacional** (CRM-CONST-001/CRM-LIFECYCLE-001). Substitui `crm.budgets`
(orçamento/proposta) como **fonte de receita** — `budgets` permanece como histórico DEPRECATED.

## 2. Estrutura da tabela `crm.revenues`
| Coluna | Tipo | Nulo | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `clinic_id` | uuid | NO | — |
| `patient_id` | uuid | NO | — |
| `lead_id` | uuid | NO | — |
| `amount` | numeric(12,2) | NO | — (CHECK `> 0`) |
| `currency` | text | NO | `'BRL'` |
| `revenue_date` | date | NO | `current_date` |
| `appointment_id` | uuid | YES | — (vínculo opcional) |
| `notes` | text | YES | — |
| `created_by` | uuid | YES | — (NULL p/ service_role/import) |
| `created_at` | timestamptz | NO | `now()` |
| `updated_at` | timestamptz | NO | `now()` |

- **`amount numeric(12,2)`** + CHECK `amount > 0` (decisão 4).
- **`currency text default 'BRL'`** (decisão 5).
- **`appointment_id` nullable** (decisão 3).
- **`lead_id NOT NULL`**: receita é sempre atribuída a um Lead (difere de `budgets`, cujo
  `lead_id` é nullable).

## 3. FKs / índices / RLS / grants
- **FKs (anti cross-clinic, padrão budgets):** `(lead_id, patient_id) → leads` **RESTRICT**;
  `(patient_id, clinic_id) → patients` **RESTRICT**; `clinic_id → public.clinics` **RESTRICT**;
  `appointment_id → appointments(id)` **ON DELETE SET NULL** (vínculo opcional); `created_by →
  user_profiles` **RESTRICT**.
  - *Deviação deliberada de `budgets`:* budgets usa CASCADE em `patients`; aqui usamos
    **RESTRICT** para **nunca** apagar receita em cascata (fato financeiro/histórico).
- **CHECK:** `revenues_amount_positive_ck` (`amount > 0`).
- **Índices:** `lead_id`, `clinic_id`, `revenue_date`, `appointment_id`, `created_by`.
- **Trigger:** `trg_revenues_touch_updated_at` (`crm.fn_touch_updated_at`). **Sem** trigger de
  recálculo de estágio (receita ≠ jornada).
- **Grants:** `authenticated` → **SELECT**; `service_role` → **ALL** (decisão 2).
- **RLS:** RLS habilitado; **SELECT** por clínica (`is_staff_3s() OR (user_has_clinic_access
  AND module_enabled_for_clinic)`). **Sem** policy de INSERT/UPDATE/DELETE p/ `authenticated`
  → escrita **server-side** (service_role).

## 4. Deprecação de `crm.budgets`
`budgets` **não é tocado** por esta migration (respeitando "não alterar budgets"). Fica como
**histórico DEPRECATED**: a fonte oficial de receita passa a ser `crm.revenues`. Se desejado,
uma migration futura pode adicionar `comment on table crm.budgets is 'DEPRECATED ...'` — **não**
incluído aqui para não alterar `budgets`.

## 5. Rollback (reversível)
```sql
drop table if exists crm.revenues;  -- remove índices/trigger/policies junto
```
Totalmente reversível: nada referencia `revenues`.

## 6. Riscos
| Sev. | Risco | Mitigação |
|---|---|---|
| Nulo | Impacto em dados/`budgets`/jornada | Tabela nova; `budgets` intacto; sem trigger de estágio |
| Baixo | `appointment_id` apontar appointment de outro lead/clínica | Vínculo opcional; integridade fina fica p/ camada futura (mesmo caveat de source_attempt_id) |
| Baixo | Escrita apenas server-side pode limitar registro via app | Decisão 2 (nesta fase); policy p/ gestor/staff pode vir depois |
| Baixo | FKs compostas sem índice de cobertura (advisor INFO) | Mesmo padrão de budgets/lead_activities; aceito |

## 7. Validações planejadas no DEV
1. Aplicar no DEV; confirmar tabela, colunas, CHECK, FKs, índices, trigger, RLS, grants.
2. **CHECK valor:** `amount = 0`/negativo → falha.
3. **Múltiplas receitas por lead:** inserir 2+ receitas para o mesmo lead → sucesso (acumulável).
4. **Vínculo opcional:** receita com `appointment_id` válido → ok; receita **sem** appointment → ok.
5. **Anti cross-clinic:** `clinic_id` ≠ do lead/paciente → falha (FK composta).
6. **FK inválida:** `lead_id`/`appointment_id` inexistente → falha.
7. **Leitura RLS:** CRC lê receitas da própria clínica; de outra clínica → não.
8. **Escrita bloqueada:** `authenticated` `insert`/`update`/`delete` → negado.
9. **Jornada intacta:** inserir receita **não** altera `leads.current_stage` (sem trigger de estágio).
10. **Não-regressão:** `budgets`, Kanban, RLS/leads e app inalterados; advisors sem issue novo.

## 8. Recomendação
**GO** para aplicar no DEV: aditiva, reversível, sem impacto em `budgets`/jornada/dados,
cumpre "receita é indicador, múltiplas por lead, não altera jornada". Aplicar no DEV →
validar (§7) → então avaliar Principal.
