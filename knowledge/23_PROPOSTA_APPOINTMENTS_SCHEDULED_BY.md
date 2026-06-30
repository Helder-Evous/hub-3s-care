---
title: "Proposta técnica — appointments.scheduled_by (dono do agendamento)"
doc_id: "23_PROPOSTA_APPOINTMENTS_SCHEDULED_BY"
version: 0.2-draft
date: 2026-06-30
status: Proposta técnica — recomendação GO; migration NÃO autorizada (aguarda Jheferson)
classification: Interno — Engenharia / Proposta de Migration
module: Controle de Lead
schema: crm
related_docs:
  - ADR-0004_DONO_DO_COMPARECIMENTO.md
  - ADR-0005_FONTES_DE_DADOS_DO_CONTROLE_DE_LEAD.md
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 18_CRM_ROADMAP.md
changelog:
  - 0.1-draft (2026-06-30): proposta inicial.
  - 0.2-draft (2026-06-30): auditoria completa de crm.appointments (colunas, índices, FKs,
    triggers, grants, RLS); FK recomendada para crm.user_profiles(id); proteção write-once;
    auditoria adversarial; recomendação GO.
---

# Proposta técnica — `crm.appointments.scheduled_by`

> **Documento de proposta. NÃO cria migration, NÃO altera banco/RLS/trigger/enum/código.**
> Execução exige aprovação de **Jheferson** (toca o schema `crm`) e fluxo **DEV → Principal**.

## 1. Problema resolvido

`crm.appointments` **não possui** coluna que identifique o **CRC responsável pelo agendamento**.
Sem isso é impossível atribuir o comparecimento a um CRC — base da futura **Premiação**. Cada
appointment criado hoje (S2-2A) nasce **sem dono**, e esse dado é **irreversível** se não for
capturado na criação.

## 2. Por que `scheduled_by` (e não `created_by`)

`scheduled_by` = **CRC responsável operacional pelo agendamento** — não "quem criou tecnicamente
a linha" (job de importação, integração, Relatório Agenda). Nome alinhado à convenção do schema
`crm` (`performed_by`, `changed_by`, `lost_by`). Forma verbosa equivalente: `scheduled_by_user_id`;
adotamos `scheduled_by`. Decisão oficial da 3S (ver ADR-0004).

## 3. Auditoria completa de `crm.appointments` (FATO — principal, 2026-06-30)

**Colunas (20):** `id, clinic_id, patient_id, lead_id, status, scheduled_at, confirmed_at,
attended_at, no_show_at, cancelled_at, rescheduled_from, professional_name, procedure_name,
codefy_id, source_system, external_ref, synced_at, reconciliation_status, created_at, updated_at`.
→ **Não existe `scheduled_by` nem `created_by`.**

**Índices (8):** `appointments_pkey(id)`; `appointments_clinic_codefy_uq(clinic_id, codefy_id)
WHERE codefy_id IS NOT NULL`; `appointments_clinic_scheduled_idx(clinic_id, scheduled_at)`;
`appointments_patient_idx(patient_id)`; `appointments_lead_idx(lead_id)`;
`appointments_clinic_status_idx(clinic_id, status)`; `appointments_rescheduled_from_idx`;
`appointments_clinic_reconc_idx(clinic_id, reconciliation_status)`. → **Nenhum por dono.**

**FKs (4):**
- `appointments_clinic_fk` → `public.clinics(id)` ON DELETE RESTRICT
- `appointments_patient_clinic_fk` → `crm.patients(id, clinic_id)` ON DELETE CASCADE
- `appointments_lead_patient_fk` → `crm.leads(id, patient_id)`
- `appointments_rescheduled_from_fk` → `crm.appointments(id)` ON DELETE SET NULL
→ **Nenhuma FK para usuário.**

**Triggers (2):** `trg_appointments_recalc_stage` (AFTER INSERT OR UPDATE OF status →
`crm.fn_recalc_lead_stage`); `trg_appointments_touch_updated_at`. → **Nenhum preenche dono.**

**RLS:** habilitada. Policies:
- `appointments_insert_manage` (INSERT) — `with_check: crm.user_can_manage_module(clinic_id) AND crm.module_enabled_for_clinic(clinic_id)`
- `appointments_update_manage` (UPDATE) — `using`+`check` iguais ao acima
- `appointments_select_scoped` (SELECT) — `crm.is_staff_3s() OR (crm.user_has_clinic_access(clinic_id) AND crm.module_enabled_for_clinic(clinic_id))`
- **Sem policy de DELETE** (cancelamento via `status`).

**Grants:** `authenticated` = **table-level INSERT/SELECT/UPDATE** + column-level em **todas** as
colunas. `service_role` = ALL. ⚠️ Como o UPDATE é **table-level**, uma nova coluna `scheduled_by`
nasceria **atualizável** por `authenticated` — precisa ser revogada explicitamente (igual à
proteção de colunas derivadas feita em `crm.leads`).

## 4. Coluna proposta + FK + índice (`EXEMPLO — NÃO EXECUTAR`)

```sql
ALTER TABLE crm.appointments
  ADD COLUMN scheduled_by uuid;             -- nullable (compatível com linhas existentes)

ALTER TABLE crm.appointments
  ADD CONSTRAINT appointments_scheduled_by_fk
  FOREIGN KEY (scheduled_by) REFERENCES crm.user_profiles(id) ON DELETE RESTRICT;

CREATE INDEX appointments_scheduled_by_idx ON crm.appointments (scheduled_by);
-- opcional (ranking por CRC): (clinic_id, scheduled_by, status)

COMMENT ON COLUMN crm.appointments.scheduled_by IS
  'CRC responsável operacional pelo agendamento (dono p/ premiação). Imutável após criação.';
```

### FK recomendada: `crm.user_profiles(id)` — justificativa
- **Consistência:** mesmo alvo de `crm.leads.owner_id` (`leads_owner_id_fkey`). Mantém o padrão do schema.
- `crm.user_profiles.id` é **1:1 com `auth.users.id`** (criado pelo trigger de signup) → `auth.uid()` = `user_profiles.id`.
- **Evita FK cross-schema para `auth`** (desencorajado no Supabase); `user_profiles` é RLS-aware, dentro do `crm`.
- `ON DELETE RESTRICT` **preserva a atribuição** (não permite apagar um CRC com agendamentos). Alternativa `SET NULL` se preferir não bloquear exclusão (perde o dono) — **decisão a fixar**.

### Coluna `nullable`
`scheduled_by uuid` **NULL** para ser compatível com as linhas existentes (sem backfill obrigatório
na migration). Para **novos** appointments, app/import sempre preenchem (ver §6). Tornar `NOT NULL`
exigiria backfill prévio — ver risco #1.

## 5. Grants — proteção write-once (`EXEMPLO — NÃO EXECUTAR`)

```sql
REVOKE UPDATE ON crm.appointments FROM authenticated;
GRANT UPDATE (status, confirmed_at, attended_at, no_show_at, cancelled_at,
              scheduled_at, rescheduled_from, professional_name, procedure_name,
              codefy_id, source_system, external_ref, synced_at, reconciliation_status)
  ON crm.appointments TO authenticated;          -- tudo MENOS scheduled_by
```
- **Insere `scheduled_by`:** `authenticated` (no INSERT) e `service_role` (importações).
- **Atualiza `scheduled_by`:** **ninguém** via `authenticated` (write-once); só `service_role` em casos administrativos auditados.
- **NÃO atualiza:** `authenticated` — `scheduled_by` é **imutável** após a criação.

## 6. Comportamento por fluxo (oficial)

| Fluxo | `scheduled_by` |
|---|---|
| **Cadastro manual (S2-2A)** | `auth.uid()` do operador no INSERT. Recomendado reforçar a policy de INSERT: `with_check (... AND scheduled_by = auth.uid())` — impede um CRC atribuir a outro. |
| **Importação de Leads** | Não define agendamento; cria/atualiza lead (Novo Lead). |
| **Importação de Agenda CRC** | **CRC informado no arquivo**, resolvido para `user_profiles.id`, gravado via **caminho confiável (`service_role`/server function)** — **nunca** o usuário que rodou a importação. CRC não resolvível → **rejeitar a linha** (não gravar dono errado). |
| **Remarcação (S2-2B)** | Antigo → `status='remarcado'` (mantém `scheduled_at` e `scheduled_by`). **Novo appointment** → `scheduled_by = auth.uid()` (quem remarcou) + `rescheduled_from = antigo.id` + `status='agendado'`. |
| **Relatório Agenda** | **NUNCA** toca `scheduled_by` (garantido pelo write-once); só atualiza `status` + temporais. |

## 7. Impacto por módulo
- **Premiação (futuro):** habilitada — dono = `scheduled_by` do appointment `compareceu`. Sem a coluna, inviável.
- **Dashboard operacional / do cliente:** métricas por CRC (agendamento, comparecimento, ranking). Legados ficam `null` (ver backfill).
- **Importações:** precisam resolver o CRC → `user_profiles.id`.
- **S2-2B:** desbloqueado — confirmar/remarcar/compareceu/faltou/cancelar passam a preservar o dono.
- **Kanban:** **nenhum impacto** — projeção é por `status`, não usa `scheduled_by`.
- **Histórico/Timeline/Indicadores/SLA/Ranking/Experiência do Cliente:** ganham a dimensão "quem agendou" (aditivo). Exposição do nome do CRC ao cliente é decisão de permissão; a RLS de SELECT já escopa por clínica.

## 8. Arquivos a alterar **depois** da migration (apenas lista)
- `src/integrations/supabase/crm-types.ts` (ou `types.ts` oficial) → add `scheduled_by` ao tipo de `appointments`.
- `src/features/crm/controle-lead/mutations.ts` → `createAppointment` grava `scheduled_by: auth.uid()`; nova mutation de **remarcação** (S2-2B).
- `src/features/crm/controle-lead/types.ts` / `queries.ts` → expor `scheduled_by` se detalhe/board exibirem o dono.
- `NewAppointmentModal.tsx` → sem campo novo (auto `auth.uid()`); modal de remarcação no S2-2B.
- Futuro: módulos de **Premiação**, **Dashboard**, **Importações**.
- Docs: `ADR-0004` (status → resolvido), este doc 23, `13`/`18`.

## 9. Plano por fases
1. **Migration** — coluna + FK + índice + grants write-once. DEV → validação → Principal. Aprovação de Jheferson.
2. **Back-end** — `createAppointment` grava `scheduled_by`; policy de INSERT reforçada; (S2-2B) remarcação cria novo appointment.
3. **Front-end** — exibir dono no detalhe (opcional); modal de remarcação.
4. **Importações** — parser resolve CRC → `scheduled_by` via service_role.
5. **Premiação** — agregação por `scheduled_by` do appointment `compareceu`.

## 10. Auditoria adversarial

| # | Cenário | Risco | Mitigação |
|---|---|---|---|
| 1 | **Comparecimento sem dono** — legados (pré-migration) `null`; import sem CRC resolvido | **Crítico** | Novos sempre setam; import rejeita linha sem CRC; decidir **backfill** dos legados (sem fonte retroativa → provável `null` aceito p/ histórico) |
| 2 | **Dois CRCs no mesmo comparecimento** — >1 appointment do lead com `compareceu` | **Médio** | Premiação conta o appointment `compareceu`; tie-break por `scheduled_at` mais recente (regra a fixar) |
| 3 | **Importação sobrescreve responsável** — UPDATE de `scheduled_by` existente | **Alto → Baixo** | **Write-once** (grant revogado); import só seta no INSERT |
| 4 | **Remarcação perde histórico** — UPDATE de data no antigo em vez de novo appointment | **Alto → Baixo** | Modelo obrigatório: antigo `remarcado` + **novo** com `rescheduled_from` |
| 5 | **Dashboard inconsistente** — `scheduled_by` null em legados/imports | **Médio** | Decisão de backfill; import resolve CRC; dashboards tratam `null` como "não atribuído" |
| 6 | **Kanban inconsistente** | **Baixo** | Kanban não usa `scheduled_by` |
| 7 | **Prêmio calculado errado** — dono null, múltiplos `compareceu`, ou sobrescrita | **Crítico → Baixo** | Soma das mitigações 1–4 |

## 11. Rollback (`EXEMPLO — NÃO EXECUTAR`)
```sql
DROP INDEX IF EXISTS crm.appointments_scheduled_by_idx;
ALTER TABLE crm.appointments DROP CONSTRAINT IF EXISTS appointments_scheduled_by_fk;
ALTER TABLE crm.appointments DROP COLUMN IF EXISTS scheduled_by;
-- restaurar o grant de UPDATE table-level anterior, se alterado.
```
Aditiva, nullable → rollback sem perda nas demais colunas; não afeta o funcionamento atual.

## 12. Recomendação — **GO**
**GO** para a migration: **aditiva, reversível, baixo risco**; é o gate correto antes do S2-2B e a
fundação de Premiação/Dashboard/Ranking/SLA.

**Condições antes de executar:**
1. **Aprovação de Jheferson** (schema `crm`).
2. **DEV antes do Principal** (mesma migration validada: advisors, RLS, INSERT em transação revertida
   confirmando `scheduled_by` gravado e tentativa de UPDATE bloqueada).
3. Decisões a fixar: **FK on-delete** (RESTRICT recomendado); **backfill** dos legados; **reforço da
   policy** de INSERT (`scheduled_by = auth.uid()`); **tie-break** p/ múltiplos `compareceu`;
   **caminho de importação** via service_role.

## 13. Não autorizado nesta tarefa
Sem migration, sem alteração de banco/RLS/trigger/enum/código, sem S2-2B. Apenas esta proposta documental.
