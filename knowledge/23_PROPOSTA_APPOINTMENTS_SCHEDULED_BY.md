---
title: "Proposta técnica — appointments.scheduled_by (dono do agendamento)"
doc_id: "23_PROPOSTA_APPOINTMENTS_SCHEDULED_BY"
version: 0.1-draft
date: 2026-06-30
status: Proposta técnica — aguardando aprovação; migration NÃO autorizada
classification: Interno — Engenharia / Proposta de Migration
module: Controle de Lead
schema: crm
related_docs:
  - ADR-0004_DONO_DO_COMPARECIMENTO.md
  - ADR-0005_FONTES_DE_DADOS_DO_CONTROLE_DE_LEAD.md
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 18_CRM_ROADMAP.md
---

# Proposta técnica — `crm.appointments.scheduled_by`

> **Documento de proposta. NÃO cria migration, NÃO altera banco/RLS/trigger/enum/código.**
> A execução exige aprovação humana (Jheferson, por tocar o schema `crm`) e fluxo DEV → Principal.

## 1. Problema resolvido

`crm.appointments` **não possui** coluna que identifique o **CRC responsável pelo agendamento**
(confirmado: colunas atuais não incluem `scheduled_by` nem `created_by`). Sem isso é **impossível**
atribuir o comparecimento a um CRC — base da futura Premiação. Cada appointment criado hoje
(S2-2A) nasce **sem dono**, e esse dado é **irreversível** se não for capturado na criação.

## 2. Por que `scheduled_by` (e não `created_by`)

`scheduled_by` = **CRC responsável operacional pelo agendamento**. **Não** é "quem criou
tecnicamente a linha" (`created_by`), que poderia ser um job de importação, integração ou o
Relatório Agenda. O nome segue a convenção do schema `crm` (`performed_by`, `changed_by`,
`lost_by`). Forma verbosa equivalente: `scheduled_by_user_id` — adotamos `scheduled_by`.

## 3. Impactos

- **Premiação:** torna-se construível — o dono do comparecimento é o `scheduled_by` do
  appointment com `status='compareceu'`. Sem a coluna, a premiação é inviável e não reconstituível.
- **S2-2B:** é **gate bloqueante**. Confirmar/remarcar/compareceu/faltou/cancelar sem `scheduled_by`
  acumula appointments sem dono. **Pausar o S2-2B até a coluna existir.**
- **Importações (doc 20):** a importação de **Agenda/Relatório** atualiza `status` e **não** define
  o dono; a importação/registro de **Agendamento** é quem informa o CRC. `scheduled_by` deve
  refletir o CRC informado na origem, nunca o job de importação.
- **Dashboard (doc 22):** habilita métricas **por CRC** (comparecimento, produtividade, ranking),
  hoje impossíveis.

## 4. DDL sugerida (PROPOSTA — `EXEMPLO NÃO AUTORIZADO — NÃO EXECUTAR`)

```sql
-- Migration futura no schema crm. Aprovação de Jheferson; DEV antes do Principal.
ALTER TABLE crm.appointments
  ADD COLUMN scheduled_by uuid;   -- nullable (compatível com linhas existentes / backfill)

COMMENT ON COLUMN crm.appointments.scheduled_by IS
  'CRC responsável operacional pelo agendamento (dono do appointment). Base da premiação. '
  'NÃO é quem criou tecnicamente a linha. Imutável após a criação.';

-- Índice para agregações por CRC (premiação/dashboards).
CREATE INDEX IF NOT EXISTS appointments_scheduled_by_idx
  ON crm.appointments (scheduled_by);
```

**Decisão de modelagem (a confirmar):** FK rígida a `auth.users(id)` ou a `crm.user_profiles(id)`,
ou apenas `uuid` sem FK — seguindo o padrão já usado por `lead_activities.performed_by`
(verificar antes de executar para manter consistência).

## 5. RLS / grants necessários (PROPOSTA)

Proteger `scheduled_by` contra alteração após a criação (mesma filosofia das colunas derivadas de
`leads`):

```sql
-- EXEMPLO NÃO AUTORIZADO — NÃO EXECUTAR
-- Hoje: grant select, insert, update (tabela inteira) para authenticated.
REVOKE UPDATE ON crm.appointments FROM authenticated;
GRANT UPDATE (status, confirmed_at, attended_at, no_show_at, cancelled_at,
              scheduled_at, rescheduled_from, professional_name, procedure_name)
  ON crm.appointments TO authenticated;   -- tudo MENOS scheduled_by
```

- **INSERT (RLS WITH CHECK):** no fluxo manual (S2-2A), exigir `scheduled_by = auth.uid()` —
  garante que o operador não atribua o agendamento a outro CRC indevidamente.
- **Importações/integrações:** seguem por **caminho confiável** (server function / service role)
  que define `scheduled_by` com o CRC informado na origem; esse caminho **não** passa pela policy
  `authenticated` de INSERT. *(Decisão de arquitetura — confirmar.)*

## 6. Como preencher

### S2-2A (criar agendamento — código futuro)
`createAppointment` passa a enviar `scheduled_by: auth.uid()` no INSERT (operador = CRC que agenda).

### Remarcação (S2-2B — código futuro)
- Appointment antigo: `status='remarcado'`; **mantém** `scheduled_at`, `scheduled_by`.
- Novo appointment: `scheduled_by = auth.uid()` (CRC que remarcou), `rescheduled_from = antigo.id`,
  `status='agendado'`, nova `scheduled_at`.

### Relatório Agenda (importação de status — futuro)
- Atualiza **apenas** `status` (e campos temporais correlatos). **NUNCA** escreve/sobrescreve
  `scheduled_by`. A proteção de coluna (§5) e o caminho de importação devem garantir isso.

## 7. Validações em DEV (antes de promover ao Principal)

1. Aplicar a migration no **DEV** (`xcqfdnymadeqeuacqotu`).
2. `INSERT` em transação revertida simulando o operador: confirmar `scheduled_by = auth.uid()` gravado.
3. Tentar `UPDATE scheduled_by` como `authenticated`: deve **falhar** (coluna protegida).
4. Confirmar que a trigger de derivação de estágio continua funcionando (INSERT/UPDATE OF status).
5. Advisors Supabase sem novos erros; integridade referencial OK.
6. Confirmar **nenhum impacto** em linhas existentes (ficam com `scheduled_by = null`).
7. Só então aplicar a **mesma** migration no Principal, com validação pós-aplicação.

## 8. Riscos

- **Backfill (Médio):** appointments já existentes ficam com `scheduled_by = null` → premiação só
  a partir do go-live, salvo regra de backfill aprovada (não há fonte confiável retroativa hoje).
- **RLS de importação (Médio):** uma policy `scheduled_by = auth.uid()` rígida bloquearia
  importações; por isso importações usam caminho confiável separado.
- **FK alvo (Baixo):** escolher `auth.users` vs `user_profiles` sem alinhar com o padrão atual
  pode exigir ajuste posterior.
- **Sequência (Crítico se ignorado):** construir S2-2B antes desta coluna gera perda irreversível.

## 9. Rollback

```sql
-- EXEMPLO NÃO AUTORIZADO — NÃO EXECUTAR
DROP INDEX IF EXISTS crm.appointments_scheduled_by_idx;
ALTER TABLE crm.appointments DROP COLUMN IF EXISTS scheduled_by;
-- Restaurar o grant de UPDATE anterior, se tiver sido alterado.
```
Reversível e sem perda de dados nas demais colunas. Como a coluna é aditiva e nullable, o rollback
não afeta o funcionamento atual.

## 10. Decisões que precisam de aprovação humana antes de executar

1. **Jheferson** — autorização para tocar o schema `crm` (ativo dele).
2. Nome final do campo: `scheduled_by` (recomendado) vs `scheduled_by_user_id`.
3. Alvo da FK: `auth.users`, `crm.user_profiles` ou `uuid` sem FK (alinhar com `performed_by`).
4. Estratégia de **backfill** dos appointments existentes (nenhum / regra específica).
5. Caminho e regra de atribuição de `scheduled_by` em **importações/integrações**.
6. Confirmar a proteção por **grant de coluna** + a regra de RLS de INSERT.

## 11. Não autorizado nesta tarefa
Sem migration, sem alteração de banco/RLS/trigger/enum/código, sem S2-2B. Apenas esta proposta
documental.
