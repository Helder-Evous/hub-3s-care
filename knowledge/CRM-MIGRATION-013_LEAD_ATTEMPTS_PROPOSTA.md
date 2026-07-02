---
documento: CRM-MIGRATION-013_LEAD_ATTEMPTS_PROPOSTA
titulo: "Proposta técnica — Migration 013: crm.lead_attempts + enums"
versao: 1.0
data: 2026-07-01
classificacao: L1 — Engenharia / Proposta de Migration (NÃO autorizada a aplicar)
proprietario: Jheferson (aprovação de schema crm)
modulo: Controle de Lead (CRM)
schema: crm
status: Proposta — aguardando autorização para aplicar no DEV
arquivo_sql: supabase/migrations/20260701120000_crm_lead_attempts.sql
fonte_de_regra: [CRM-LIFECYCLE-001, CRM-BR-001, CRM-DATA-001]
related_docs:
  - CRM-LIFECYCLE-001_CICLO_DE_VIDA_DO_LEAD.md
  - CRM-MESTRE-VOL2-DOMINIO-DADOS-EVENTOS.md
nota: >
  Documento técnico. Nenhuma migration foi aplicada (nem DEV, nem Principal).
  É a 1ª migration da Fase 5. Por CRM-MASTER-GOV (2d), ADR não contém regra de
  negócio; este é doc de engenharia (não define regra, implementa as já aprovadas).
---

# Migration 013 — `crm.lead_attempts` + enums (proposta)

## 1. Objetivo
Elevar **Tentativa** a entidade de negócio (`Lead → LeadAttempt → Appointment`), base de
produtividade, conversão, premiação, IA e dashboards. Implementa as regras já aprovadas em
**CRM-LIFECYCLE-001 / CRM-BR-001 / CRM-DATA-001**. **Aditiva e reversível.**

## 2. O que a migration cria
- **Enums:** `crm.attempt_channel`, `crm.attempt_origin`, `crm.attempt_result` (vocabulário
  consolidado de 2026-07-01).
- **Tabela `crm.lead_attempts`:** `id, clinic_id, lead_id, channel(null), origin, result,
  attempted_at, created_by(null), notes, created_at, updated_at`.
- **6 índices** (`lead_id, clinic_id, attempted_at, created_by, result, origin`).
- **Trigger** `updated_at` reutilizando `crm.fn_touch_updated_at()`.
- **Grants** `select, insert` p/ `authenticated`; `all` p/ `service_role`.
- **RLS**: SELECT (staff ou acesso à clínica + módulo habilitado); INSERT (pode operar módulo
  + habilitado + `created_by = auth.uid()` ou staff). **Sem UPDATE/DELETE** (append-only).

## 3. Aderência às regras (rastreabilidade)
| Regra (fonte) | Implementação |
|---|---|
| `lead_id`/`clinic_id`/`attempted_at`/`origin`/`result` obrigatórios | `NOT NULL` |
| `channel` nullable p/ tentativa automática | coluna nullable |
| `created_by` obrigatório p/ origem manual | `CHECK (origin not in ('manual_crc','manual_consultor') or created_by is not null)` |
| Tentativa não deletada / histórico preservado | sem policy DELETE + FKs `ON DELETE RESTRICT` |
| RLS por clínica | helpers `user_has_clinic_access` / `user_can_manage_module` / `module_enabled_for_clinic` |
| CRC cria/lê na sua clínica; Gestor lê | policies SELECT/INSERT (idênticas ao padrão `lead_activities`) |
| Update restrito / delete não permitido | sem grant/policy de UPDATE/DELETE p/ `authenticated` |
| Anti cross-clinic | FK composta `(lead_id, clinic_id) → leads(id, clinic_id)` |

## 4. Eventos (CRM-EVT-001) — futuros, não nesta migration
`AttemptCreated`, `AttemptAutoCreated` (origin=sistema/ia), `AttemptUpdated` (se houver edição
futura). Esta migration cria só a tabela; a **emissão de eventos** virá com a camada de
aplicação/trigger (Fase 6+), não aqui.

## 5. Riscos
| Sev. | Risco | Mitigação |
|---|---|---|
| Baixo | Divergência com `lead_activities` (que usa `ON DELETE CASCADE` no lead) | Uso deliberado de `RESTRICT` para honrar "tentativa nunca deletada"; documentado |
| Baixo | `origin='gestor'` citado na decisão não existe no enum | Mapeado para origens manuais; **confirmar** se um `gestor` explícito é desejado |
| Baixo | Autenticado inserir `origin=ia/importacao` indevidamente | Caminhos auto usam `service_role`; refino de origem por papel pode vir depois |
| Médio | Consulta de elegibilidade (janela 24h) sem índice composto | Índices atuais atendem; recomendável `(lead_id, attempted_at)` na Migration 014 |
| Nulo | Impacto em `appointments` | Nenhuma alteração em `appointments` nesta migration |

## 6. Rollback
```sql
drop table if exists crm.lead_attempts;
drop type  if exists crm.attempt_result;
drop type  if exists crm.attempt_origin;
drop type  if exists crm.attempt_channel;
```
Totalmente reversível: nada referencia `lead_attempts` ainda (`source_attempt_id` é a 014).

## 7. Validações planejadas no DEV (quando autorizado)
1. Aplicar no DEV (`xcqfdnymadeqeuacqotu`); confirmar criação de enums + tabela + índices + trigger.
2. **RLS/Grants:** `\dp crm.lead_attempts`; confirmar apenas `select, insert` p/ authenticated.
3. **Insert autorizado:** como CRC da clínica X, inserir tentativa com `created_by = auth.uid()` → sucesso.
4. **CHECK:** inserir `origin='manual_crc'` com `created_by = null` → **deve falhar**.
5. **Cross-clinic:** inserir tentativa com `clinic_id` ≠ clínica do `lead_id` → **deve falhar** (FK composta).
6. **Cross-clinic RLS:** CRC da clínica Y tentar inserir/ler na clínica X → **negado**.
7. **Append-only:** tentar `update`/`delete` como authenticated → **negado**.
8. **Não-regressão:** `select count(*) from crm.appointments` antes/depois → inalterado; app atual (board/detalhe/criar lead/atividade/agendar) funciona igual.

## 8. Dependências para a próxima migration (014 — `source_attempt_id`)
- 014 adiciona `crm.appointments.source_attempt_id uuid` **FK → `crm.lead_attempts(id)`** +
  **unique parcial** (`where source_attempt_id is not null`) → 1 tentativa ⇒ ≤1 agendamento.
- 014 **não** torna a tentativa obrigatória em `appointments` (isso é decisão posterior,
  quando a camada find-or-create/trigger existir).
- Recomenda-se criar em 014 o índice composto `(lead_id, attempted_at)` p/ a consulta de
  elegibilidade (janela 24h).
- A **forma de imposição do invariante** (trigger `BEFORE INSERT` em appointments vs RPC
  `crm.create_appointment`) permanece decisão de engenharia em aberto (não bloqueia a 013).
