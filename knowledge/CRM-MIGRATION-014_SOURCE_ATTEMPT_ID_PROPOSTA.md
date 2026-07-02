---
documento: CRM-MIGRATION-014_SOURCE_ATTEMPT_ID_PROPOSTA
titulo: "Proposta técnica — Migration 014: crm.appointments.source_attempt_id"
versao: 1.0
data: 2026-07-01
classificacao: L1 — Engenharia / Proposta de Migration (NÃO autorizada a aplicar)
proprietario: Jheferson (aprovação de schema crm)
modulo: Controle de Lead (CRM)
schema: crm
status: Proposta — aguardando autorização para aplicar no DEV
arquivo_sql: supabase/migrations/20260701130000_crm_appointments_source_attempt_id.sql
depende_de: [CRM-MIGRATION-013 (crm.lead_attempts)]
fonte_de_regra: [CRM-LIFECYCLE-001, CRM-BR-001, CRM-DATA-001]
related_docs:
  - CRM-LIFECYCLE-001_CICLO_DE_VIDA_DO_LEAD.md
  - CRM-MIGRATION-013_LEAD_ATTEMPTS_PROPOSTA.md
nota: >
  Documento técnico. Nenhuma migration aplicada. Não inclui trigger/RPC
  find-or-create nem torna a tentativa obrigatória (decisões posteriores).
---

# Migration 014 — `crm.appointments.source_attempt_id` (proposta)

## 1. Objetivo
Ligar cada agendamento à **tentativa que o originou** (`Lead → LeadAttempt → Appointment`),
garantindo o invariante **1 tentativa → ≤ 1 agendamento**, e preparar o índice da janela de
elegibilidade. Base para a futura camada find-or-create (não incluída aqui).

## 2. O que a migration cria
- **Coluna** `crm.appointments.source_attempt_id uuid` **nullable** (compatível com legados).
- **FK** `appointments_source_attempt_fk` → `crm.lead_attempts(id)` `ON DELETE RESTRICT`.
- **Índice único parcial** `appointments_source_attempt_unique` em `(source_attempt_id) WHERE
  source_attempt_id IS NOT NULL` — garante o invariante **e** cobre a FK (ver §nota de índice).
- **Índice composto** `lead_attempts_lead_attempted_idx` em `crm.lead_attempts (lead_id,
  attempted_at)` — suporta a consulta de elegibilidade (janela 24h).

### Nota sobre "índice para source_attempt_id" + "unique parcial"
Um **único** índice único parcial atende os dois requisitos: impõe o invariante e serve de
índice de cobertura da FK para os valores não nulos (os únicos relevantes em joins). Por isso
**não** criamos um segundo índice simples redundante sobre a mesma coluna.

## 3. Constraints / FKs / índices
| Objeto | Tipo | Detalhe |
|---|---|---|
| `source_attempt_id` | coluna | `uuid`, nullable, sem default |
| `appointments_source_attempt_fk` | FK | → `crm.lead_attempts(id)` `ON DELETE RESTRICT` |
| `appointments_source_attempt_unique` | índice único parcial | `(source_attempt_id) WHERE NOT NULL` |
| `lead_attempts_lead_attempted_idx` | índice | `crm.lead_attempts (lead_id, attempted_at)` |

## 4. Rollback (reversível)
```sql
drop index if exists crm.lead_attempts_lead_attempted_idx;
drop index if exists crm.appointments_source_attempt_unique;
alter table crm.appointments drop constraint if exists appointments_source_attempt_fk;
alter table crm.appointments drop column if exists source_attempt_id;
```

## 5. Riscos
| Sev. | Risco | Mitigação |
|---|---|---|
| Nulo | Impacto em appointments existentes | Coluna nullable, sem backfill; FK ignora NULLs; unique parcial ignora NULLs |
| Baixo | `source_attempt_id` apontar para tentativa de **outro lead/clínica** (integridade lead↔tentativa) | Fora do escopo desta migration; será garantido pela camada **find-or-create/trigger** (015+). Hoje o app não envia `source_attempt_id`. Opcional futuro: FK composta `(source_attempt_id, lead_id) → lead_attempts(id, lead_id)` |
| Baixo | Lock ao adicionar FK | Tabela pequena (DEV 1 / Principal 3 linhas); validação trivial (todas as linhas NULL) |
| Nulo | Mudança de status/`scheduled_by`/RLS | Nenhuma — migration só adiciona coluna+índices |
| Baixo | `authenticated` poder gravar `source_attempt_id` no INSERT sem validação de origem | Aceitável nesta fase (app atual não envia); enforcement virá na camada find-or-create. Coluna é write-once p/ authenticated (fora da lista de UPDATE da 012) |

## 6. Validações planejadas no DEV (quando autorizado)
1. Aplicar no DEV; confirmar coluna nullable, FK, índice único parcial e índice composto.
2. **Legados intactos:** `select count(*) from crm.appointments` inalterado; todos com
   `source_attempt_id IS NULL`.
3. **Vínculo válido:** criar `lead_attempts` (lead X) → inserir/associar appointment com
   `source_attempt_id = attempt` → sucesso.
4. **Invariante:** segundo appointment com o **mesmo** `source_attempt_id` → **deve falhar**
   (unique parcial).
5. **NULLs múltiplos:** dois appointments com `source_attempt_id NULL` → permitido.
6. **FK inválida:** `source_attempt_id` = uuid inexistente → **deve falhar** (FK).
7. **Write-once:** `authenticated` tentar `UPDATE source_attempt_id` → **negado** (coluna fora
   do grant de UPDATE da 012).
8. **Não-regressão:** `scheduled_by`, status, RLS e app inalterados; advisors sem issue novo.

## 7. Dependências para a próxima etapa
- **Camada find-or-create** (015+ / aplicação): Cenário A (cria tentativa `origin=sistema,
  result=agendado`) e Cenário B (reutiliza tentativa elegível na janela de 24h), impondo o
  invariante para qualquer origem (recomendado **trigger `BEFORE INSERT`** em `appointments`
  e/ou **RPC** `crm.create_appointment`). Decisão trigger vs RPC ainda em aberto.
- **Tornar a tentativa obrigatória** em `appointments` (só após a camada find-or-create +
  frontend gravando `source_attempt_id`) — decisão futura.
- **Integridade lead↔tentativa** (mesma origem): avaliar FK composta `(source_attempt_id,
  lead_id)` quando a camada find-or-create existir.
- **Frontend:** passar `source_attempt_id` ao criar agendamento (Cenário B) — fase de implementação.

## 8. Recomendação
**GO** para aplicar no DEV: migration aditiva, reversível, sem impacto em dados/lógica
existentes, alinhada a CRM-LIFECYCLE-001. Aplicar no DEV → validar (§6) → então avaliar Principal.
