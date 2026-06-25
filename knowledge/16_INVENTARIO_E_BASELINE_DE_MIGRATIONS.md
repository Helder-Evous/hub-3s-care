---
documento: 16_INVENTARIO_E_BASELINE_DE_MIGRATIONS
versao: 0.1-draft
data: 2026-06-25
classificacao: L1 — Operacional/Técnico
proprietario: Helder e Jefferson
status: Proposta — aguardando aprovação
implementacao: não autorizada
---

# Inventário e Baseline de Migrations

> **Documento de auditoria exclusiva. Nenhuma implementação, migration, alteração de banco, schema, dados, RLS, grants, autenticação, Edge Function ou código está autorizada por este documento.**

## 1. Objetivo

Criar uma fonte confiável e comparativa do histórico de migrations do Hub 3S, identificando divergências entre o repositório GitHub, o ambiente DEV e o ambiente principal, sem alterar nenhum dos ambientes. O documento serve de base para a decisão sobre a estratégia de baseline a adotar antes de qualquer nova migration.

## 2. Fontes analisadas

| Fonte | Identificação | Método de consulta |
|---|---|---|
| GitHub | `Helder-Evous/hub-3s-care` / `supabase/migrations/` | Leitura direta dos arquivos |
| Supabase DEV | `xcqfdnymadeqeuacqotu` | `list_migrations` + `execute_sql` leitura de metadados |
| Supabase Principal | `nndvcsdevbxpgsccyimm` | `list_migrations` + `execute_sql` leitura de metadados |
| Knowledge Base | docs 13, 15 | Leitura dos documentos |

Consultas realizadas em 2026-06-25. Somente metadados e contagens; nenhum dado pessoal ou de conteúdo de registros foi consultado.

---

## 3. Inventário do GitHub

12 arquivos em `supabase/migrations/`, todos lidos. Nenhum arquivo de migration foi modificado.

| # | Arquivo (versão GitHub) | Objetivo | Schemas/objetos afetados | Natureza | Aplicada no PROD? |
|---|---|---|---|---|---|
| 1 | `20260529143328_0c3bac65...sql` | Enums base e tabelas operacionais | `public`: enums `clinic_status`, `channel_type`, `channel_status`, `alert_severity`; tabelas `clinics`, `channels`, `channel_monitoring`, `contingency_items`, `alerts`, `audit_logs` | Aditiva | Sim — mesma versão |
| 2 | `20260604000001_add_hub_users.sql` | Usuários e permissões do Hub | `public`: enum `hub_role`, tabelas `hub_users`, `clinic_assignments` | Aditiva | Sim — versão `20260604135414` no PROD |
| 3 | `20260604000002_extend_existing_tables.sql` | Extensão de tabelas, fn_user_can_access_clinic, RLS granular | `public`: função `fn_user_can_access_clinic`, alterações em `clinics`, `channels`, `audit_logs` | Aditiva | Sim — versão `20260604135435` no PROD |
| 4 | `20260604000003_add_templates_and_volume.sql` | Templates Meta e volume de API | `public`: enums `template_category`, `template_status`; tabelas `meta_templates`, `meta_template_metrics`, `api_volume_snapshots` | Aditiva | Sim — versão `20260604135449` no PROD |
| 5 | `20260604000004_add_indexes.sql` | Índices de performance | `public`: índices em `clinics`, `channels`, `alerts`, `audit_logs`, etc. | Aditiva | Sim — versão `20260604135500` no PROD |
| 6 | `20260604000005_add_clinic_scores_view.sql` | View de scores por clínica | `public`: view `vw_clinic_scores` | Aditiva | Sim — versão `20260604135513` no PROD |
| 7 | `20260604133039_e7560ffe...sql` | Revogação do acesso anônimo (Lovable security agent) | `public`: REVOKE SELECT FROM anon, RLS provisória | Restritiva | Sim — mesma versão `20260604133039` |
| 8 | `20260604185143_716bbe07...sql` | ADD COLUMN em `clinics` (nome_fantasia, razao_social, cnpj, phone...) | `public.clinics` | Aditiva | **Não confirmada — ausente no PROD** |
| 9 | `20260604200001_fase1_base_estrutural.sql` | Expansão de `clinics` e outras tabelas de negócio | `public`: `clinics`, `sales`, `clinic_products`, `onboardings`, `onboarding_steps`, `pending_approvals`, `ai_audit_log`, `contracts`, `charges`; enums `onboarding_status`, `product_type`, `step_status`, `data_origin`, `number_status`, `quality_rating`, `alert_status` | Aditiva | Sim — versão `20260604171237` no PROD (timestamp anterior ao do repo) |
| 10 | `20260611002357_aab13a75...sql` | RLS para `sales`, `clinic_products`, `onboardings`, `charges`, `contracts` | `public`: policies de acesso | Aditiva/Alteração de policy | **Não confirmada — ausente no PROD** |
| 11 | `20260619000001_create_ai_tasks.sql` | Criação de `ai_tasks`, enums `ai_task_status` e `ai_task_priority` | `public`: enums, tabela `ai_tasks`, índices, RLS | Aditiva | Sim — versão `20260619204324` no PROD |
| 12 | `20260619000002_evolve_ai_tasks_priority.sql` | ADD COLUMN `impact_level`, `urgency_level`, `priority_score`, `confidence_score`, `source_event_type`, `requires_human`, `next_action` em `ai_tasks` | `public.ai_tasks` | Aditiva | Sim — versão `20260619204335` no PROD |

**Ausências confirmadas no GitHub:** `create_system_events`, `fix_rls_recursive_hub_users`, todas as migrations CRM (`crm_001..011`), `dev_scaffold_public_clinics`.

---

## 4. Inventário do DEV (`xcqfdnymadeqeuacqotu`)

### Migrations registradas (12)

| Versão | Nome | Presente no GitHub | Presente no PROD |
|---|---|---|---|
| `20260623135741` | `dev_scaffold_public_clinics` | Não | Não |
| `20260623135758` | `crm_001_schema_and_grants` | Não | Sim (`20260623153559`) |
| `20260623135832` | `crm_002_enums_and_lead_sources` | Não | Sim (`20260623153628`) |
| `20260623135853` | `crm_003_access_model` | Não | Sim (`20260623153647`) |
| `20260623135919` | `crm_004_helpers_and_rls` | Não | Sim (`20260623153710`) |
| `20260623135941` | `crm_005_patients` | Não | Sim (`20260623153731`) |
| `20260623135959` | `crm_006_leads` | Não | Sim (`20260623153751`) |
| `20260623140017` | `crm_007_lead_activities` | Não | Sim (`20260623153809`) |
| `20260623140045` | `crm_008_appointments` | Não | Sim (`20260623153826`) |
| `20260623140106` | `crm_009_budgets` | Não | Sim (`20260623153846`) |
| `20260623140136` | `crm_010_stage_derivation` | Não | Sim (`20260623153913`) |
| `20260623192204` | `crm_011_api_grants` | Não | Sim (`20260623201809`) |

### Resumo estrutural do DEV

**Schema `public`:**
- Tabelas: `clinics` (1 registro — scaffold mínimo, sem enums, sem índices além da PK)
- Enums: nenhum
- Funções: nenhuma
- Triggers: nenhum
- Políticas RLS: somente `clinics` (via scaffold)
- Índices: somente `clinics_pkey`
- **Ausentes:** `system_events`, `ai_tasks`, `hub_users`, `channels`, `sales`, `onboardings`, `contracts`, `charges` e todas as demais tabelas e objetos do `public` no PROD

**Schema `crm`:**
- Tabelas (10): `appointments`, `budgets`, `lead_activities`, `lead_sources`, `lead_stage_history`, `leads`, `module_clinics`, `patients`, `user_profiles`, `user_units` — **estruturalmente equivalentes ao PROD**
- Enums (8): `activity_type`, `appointment_status`, `budget_status`, `crm_role`, `lead_stage`, `patient_status`, `reconciliation_status`, `source_category` — **idênticos ao PROD**
- Funções (13): `current_user_role`, `fn_handle_new_user`, `fn_normalize_patient`, `fn_recalc_lead_stage`, `fn_touch_lead_activity`, `fn_touch_updated_at`, `fn_trg_recalc_lead_stage`, `is_staff_3s`, `is_super_admin_3s`, `lead_stage_rank`, `module_enabled_for_clinic`, `user_can_manage_module`, `user_has_clinic_access` — **idênticas ao PROD**
- Triggers (9 objetos): `trg_appointments_recalc_stage`, `trg_appointments_touch_updated_at`, `trg_budgets_recalc_stage`, `trg_budgets_touch_updated_at`, `trg_lead_activities_touch`, `trg_leads_recalc_stage_on_lost`, `trg_leads_touch_updated_at`, `trg_patients_normalize`, `trg_patients_touch_updated_at` — **idênticos ao PROD**. Estes 9 objetos de trigger aparecem como 12 linhas no `information_schema.triggers` porque alguns respondem a mais de um evento (ex.: `trg_appointments_recalc_stage`, `trg_budgets_recalc_stage` e `trg_patients_normalize` respondem a `INSERT` e `UPDATE`, gerando uma linha por evento).
- Políticas RLS (25): completas por tabela CRM — **idênticas ao PROD**
- Índices CRM: conjunto completo — **idêntico ao PROD**

---

## 5. Inventário do Principal (`nndvcsdevbxpgsccyimm`)

### Migrations registradas (23)

A tabela do principal contém 23 registros: 12 da fundação pública e 11 do CRM.


| Versão | Nome | Presente no GitHub | Presente no DEV |
|---|---|---|---|
| `20260529143328` | `0c3bac65-0b3f-43bd-86c2-e0897b9d7924` | Sim (mesma versão) | Não |
| `20260604133039` | `e7560ffe-f3fe-4190-9f11-2f38c1563aea` | Sim (mesma versão) | Não |
| `20260604135414` | `add_hub_users` | Sim (`20260604000001`) | Não |
| `20260604135435` | `extend_existing_tables` | Sim (`20260604000002`) | Não |
| `20260604135449` | `add_templates_and_volume` | Sim (`20260604000003`) | Não |
| `20260604135500` | `add_indexes` | Sim (`20260604000004`) | Não |
| `20260604135513` | `add_clinic_scores_view` | Sim (`20260604000005`) | Não |
| `20260604171237` | `fase1_base_estrutural` | Sim (`20260604200001`) | Não |
| `20260604184531` | `fix_rls_recursive_hub_users` | **Não** | Não |
| `20260605143042` | `create_system_events` | **Não** | Não |
| `20260619204324` | `create_ai_tasks` | Sim (`20260619000001`) | Não |
| `20260619204335` | `evolve_ai_tasks_priority` | Sim (`20260619000002`) | Não |
| `20260623153559` | `crm_001_schema_and_grants` | Não | Sim (`20260623135758`) |
| `20260623153628` | `crm_002_enums_and_lead_sources` | Não | Sim (`20260623135832`) |
| `20260623153647` | `crm_003_access_model` | Não | Sim (`20260623135853`) |
| `20260623153710` | `crm_004_helpers_and_rls` | Não | Sim (`20260623135919`) |
| `20260623153731` | `crm_005_patients` | Não | Sim (`20260623135941`) |
| `20260623153751` | `crm_006_leads` | Não | Sim (`20260623135959`) |
| `20260623153809` | `crm_007_lead_activities` | Não | Sim (`20260623140017`) |
| `20260623153826` | `crm_008_appointments` | Não | Sim (`20260623140045`) |
| `20260623153846` | `crm_009_budgets` | Não | Sim (`20260623140106`) |
| `20260623153913` | `crm_010_stage_derivation` | Não | Sim (`20260623140136`) |
| `20260623201809` | `crm_011_api_grants` | Não | Sim (`20260623192204`) |

As 23 migrations acima dividem-se em 12 da fundação pública e 11 do CRM.

### Resumo estrutural do Principal

**Schema `public` (21 tabelas):** `clinics`, `channels`, `channel_monitoring`, `contingency_items`, `alerts`, `audit_logs`, `hub_users`, `clinic_assignments`, `meta_templates`, `meta_template_metrics`, `api_volume_snapshots`, `sales`, `clinic_products`, `onboardings`, `onboarding_steps`, `pending_approvals`, `ai_audit_log`, `contracts`, `charges`, `system_events`, `ai_tasks`

**Enums `public` (16):** `ai_task_priority`, `ai_task_status`, `alert_severity`, `alert_status`, `channel_status`, `channel_type`, `clinic_status`, `data_origin`, `hub_role`, `number_status`, `onboarding_status`, `product_type`, `quality_rating`, `step_status`, `template_category`, `template_status`

**Funções `public` (4):** `fn_channel_monitoring_set_latest`, `fn_create_hub_user_on_signup`, `fn_user_can_access_clinic`, `get_my_role`

**Triggers `public` (1):** `trg_channel_monitoring_latest` (INSERT AFTER em `channel_monitoring`)

**`system_events` — colunas confirmadas:** `id` (uuid PK), `created_at`, `event_type` (text NOT NULL), `entity_type`, `entity_id` (uuid), `clinic_id` (uuid), `onboarding_id` (uuid), `sale_id` (uuid), `user_id` (uuid), `source` (text, default `'app'`), `payload` (jsonb), `processed` (bool, default false), `processed_at` (timestamptz), `error_message` (text)

**`ai_tasks` — colunas confirmadas:** `id`, `created_at`, `updated_at`, `task_type`, `title`, `description`, `priority` (enum), `status` (enum), `entity_type`, `entity_id`, `clinic_id`, `onboarding_id`, `sale_id`, `source`, `auto_executable`, `payload`, `result`, `assigned_to`, `reviewed_by`, `reviewed_at`, `executed_at`, `error_message`, `impact_level`, `urgency_level`, `priority_score`, `confidence_score`, `source_event_type`, `requires_human`, `next_action`

**Schema `crm` (PROD):** estruturalmente equivalente ao DEV — 10 tabelas, 8 enums, 13 funções, 9 objetos de trigger (12 linhas em `information_schema.triggers`), 25 políticas RLS, índices completos. O estado estrutural final é equivalente; o SQL histórico não é necessariamente idêntico byte a byte (ver §7).

---

## 6. Matriz comparativa

| Migration / alteração | GitHub | DEV | Principal | Estado | Risco CRM | Ação proposta |
|---|:---:|:---:|:---:|---|---|---|
| `20260529143328` (enums base + tabelas) | ✓ | ✗ | ✓ | GitHub + PROD, ausente DEV | Baixo | Registrar em baseline; incluir no alinhamento aditivo do DEV |
| `20260604133039` (revoke anon) | ✓ | ✗ | ✓ | GitHub + PROD, ausente DEV | Baixo | Idem |
| `add_hub_users` (nomes divergem) | ✓ `000001` | ✗ | ✓ `135414` | Mesma alteração, timestamps diferentes | Baixo | Documentar equivalência; não reaplicar |
| `extend_existing_tables` (nomes divergem) | ✓ `000002` | ✗ | ✓ `135435` | Mesma alteração, timestamps diferentes | Baixo | Documentar equivalência; não reaplicar |
| `add_templates_and_volume` (nomes divergem) | ✓ `000003` | ✗ | ✓ `135449` | Mesma alteração, timestamps diferentes | Baixo | Documentar equivalência; não reaplicar |
| `add_indexes` (nomes divergem) | ✓ `000004` | ✗ | ✓ `135500` | Mesma alteração, timestamps diferentes | Baixo | Documentar equivalência; não reaplicar |
| `add_clinic_scores_view` (nomes divergem) | ✓ `000005` | ✗ | ✓ `135513` | Mesma alteração, timestamps diferentes | Baixo | Documentar equivalência; não reaplicar |
| `fase1_base_estrutural` (timestamps divergem, PROD mais antigo) | ✓ `200001` | ✗ | ✓ `171237` | Mesma alteração, timestamps diferentes; PROD aplicou antes do repo | Baixo | Documentar equivalência; não reaplicar |
| `716bbe07` (ADD COLUMN clinics) | ✓ `185143` | ✗ | efeitos ✓ / versão ✗ | Versão ausente no histórico do PROD; colunas presentes | Médio | Investigar caminho de origem; não reaplicar — efeitos já presentes |
| `fix_rls_recursive_hub_users` | **✗** | ✗ | ✓ `184531` | Somente PROD | Baixo | Preservar `statements` como histórico; incluir no alinhamento do DEV |
| `create_system_events` | **✗** | ✗ | ✓ `143042` | Somente PROD | Baixo | Preservar `statements` como histórico; incluir no alinhamento do DEV |
| `aab13a75` (RLS sales/products) | ✓ `20260611002357` | ✗ | efeitos ✓ / versão ✗ | Versão ausente no histórico do PROD; policies presentes | Médio | Investigar caminho de origem; não reaplicar — policies já presentes |
| `create_ai_tasks` (timestamps divergem) | ✓ `000001` | ✗ | ✓ `204324` | Mesma alteração, timestamps diferentes | Baixo | Documentar equivalência; não reaplicar |
| `evolve_ai_tasks_priority` (timestamps divergem) | ✓ `000002` | ✗ | ✓ `204335` | Mesma alteração, timestamps diferentes | Baixo | Documentar equivalência; não reaplicar |
| `dev_scaffold_public_clinics` | **✗** | ✓ `135741` | **✗** | Somente DEV | Baixo | Documentar como scaffold temporário; não promover ao PROD |
| `crm_001..011` (DEV e PROD, timestamps e textos divergentes) | **✗** | ✓ (versão DEV) | ✓ (versão PROD) | DEV + PROD, ausente GitHub; estrutura equivalente, histórico textual divergente (ex.: crm_004, crm_005) | **Alto — ativo protegido de Jefferson** | Preservar ambos os históricos; canonicalizar e versionar somente após autorização explícita de Jefferson |

---

## 7. Drift confirmado

### Fatos confirmados

1. **Timestamps divergentes entre GitHub e PROD** para pelo menos 8 migrations com mesmo nome: as migrations foram aplicadas no PROD com timestamps distintos dos presentes no arquivo versionado no GitHub. O Supabase registra o timestamp do nome do arquivo, não o momento da aplicação. Isso significa que o histórico do PROD não reconhece as versões do GitHub como aplicadas — e vice-versa.

2. **`create_system_events` ausente no GitHub**: migration aplicada no PROD em `20260605143042` não existe no repositório. A tabela existe e está em uso (19 eventos registrados, conforme auditoria do doc 15).

3. **`fix_rls_recursive_hub_users` ausente no GitHub**: migration aplicada no PROD em `20260604184531` não existe no repositório.

4. **`crm_001..011` ausentes no GitHub**: as 11 migrations CRM estão registradas no DEV e no PROD, mas nenhum arquivo correspondente existe em `supabase/migrations/`. Os timestamps de versão diferem entre DEV e PROD (ver §3/§4/§5).

5. **`dev_scaffold_public_clinics` exclusivo do DEV**: migration criada diretamente no DEV, sem equivalente no GitHub ou no PROD.

6. **`716bbe07`: versão ausente no histórico do principal; efeitos estruturais presentes**: a versão `20260604185143` não está registrada no histórico do principal, mas as colunas correspondentes (`nome_fantasia`, `razao_social`, `cnpj`, `phone`) **existem no principal**. Classificação: *versão ausente; efeitos presentes por caminho ainda não confirmado* — não se trata de alteração simplesmente ausente do principal.

7. **`aab13a75`: versão ausente no histórico do principal; efeitos estruturais presentes**: a versão `20260611002357` não está registrada no histórico do principal, mas as policies correspondentes **existem no principal**: `sales: authenticated access`, `clinic_products: authenticated access`, `onboardings: authenticated access`, `charges: authenticated access`, `contracts: authenticated access`. Classificação: *versão ausente; efeitos presentes por caminho ainda não confirmado*.

8. **Schema `public` do DEV praticamente vazio**: apenas `clinics` com scaffold mínimo. Toda a fundação (tabelas, enums, funções, triggers, índices, policies) está ausente.

9. **Schema `crm` estruturalmente equivalente entre DEV e PROD**: 10 tabelas, 8 enums, 13 funções, 9 objetos de trigger, 25 policies e índices têm o mesmo estado estrutural final em ambos os ambientes. **Porém, o SQL histórico não é necessariamente byte a byte idêntico**: as versões registradas em `statements` de `crm_004` e `crm_005`, por exemplo, apresentam diferenças textuais entre DEV e PROD. Isso impede afirmar que os arquivos históricos dos dois ambientes são literalmente idênticos. Essas diferenças **não são automaticamente um problema funcional** — devem ser classificadas como divergência histórica a ser preservada e analisada, não como defeito.

10. **`ai_tasks` não possui `event_id`**: a ligação evento → tarefa existe apenas como texto (`source_event_type`), sem FK real para `system_events`. Confirmado pelas colunas auditadas.

### Fonte real dos SQLs históricos

A tabela `supabase_migrations.schema_migrations` (verificada nos dois ambientes) possui as colunas:

- `version` (text)
- `name` (text)
- `statements` (array de text) — **contém o SQL registrado de cada migration**
- `rollback` (array de text)
- `created_by` (text)
- `idempotency_key` (text)

A coluna `statements` é a **fonte primária** para recuperação do conteúdo histórico das migrations (incluindo as ausentes no GitHub). O procedimento de validação, quando autorizado, deve ser:

1. extrair `statements` de cada migration;
2. preservar `version` e `name` originais;
3. comparar com os arquivos equivalentes do GitHub;
4. validar o estado atual com `information_schema`, `pg_get_functiondef`, `pg_policies`, constraints, triggers e índices.

Nesta tarefa **nenhum `statements` foi extraído para arquivo e nenhum arquivo foi gravado** — apenas o esquema da tabela foi confirmado.

### Hipóteses (não confirmadas)

- A divergência de timestamps entre GitHub e PROD decorre de o Lovable ter aplicado as migrations diretamente no PROD usando os arquivos do GitHub com timestamps renomeados, ou de uma aplicação manual anterior ao versionamento.
- `716bbe07` e `aab13a75` podem ter sido absorvidos pelo conteúdo de outras migrations que foram aplicadas — as colunas e algumas policies existem no PROD, mas a origem exata não é confirmada.
- As 5 tarefas `ai_tasks` no PROD foram criadas manualmente ou via Lovable, não pelo pipeline de eventos (que não existe em execução).

### Itens pendentes de investigação

- Verificar se as colunas adicionadas por `716bbe07` (`nome_fantasia`, `razao_social`, `cnpj`, `phone`) já existiam no PROD antes dessa migration ser criada no GitHub.
- Verificar se as policies de `aab13a75` existem no PROD e por qual caminho foram criadas.
- Confirmar o conteúdo exato das migrations `fix_rls_recursive_hub_users` e `create_system_events` no PROD para produzir os arquivos históricos corretos.

---

## 8. Ativos protegidos

### Schema `crm` — trabalho de Jefferson

O schema `crm` nos dois ambientes (DEV e PROD) é **ativo protegido**. As migrations `crm_001` a `crm_011` representam trabalho concluído e validado por Jefferson.

**Objetos protegidos confirmados:**
- 10 tabelas: `appointments`, `budgets`, `lead_activities`, `lead_sources`, `lead_stage_history`, `leads`, `module_clinics`, `patients`, `user_profiles`, `user_units`
- 8 enums no schema `crm`
- 13 funções no schema `crm`
- 9 objetos de trigger no schema `crm` (12 linhas em `information_schema.triggers`)
- 25 políticas RLS no schema `crm`
- Índices completos no schema `crm`

**Dependência confirmada (fato):** oito tabelas do schema `crm` possuem foreign keys para `public.clinics(id)`, verificadas via `information_schema` no PROD:

- `crm.appointments(clinic_id)` → `public.clinics(id)`
- `crm.budgets(clinic_id)` → `public.clinics(id)`
- `crm.lead_activities(clinic_id)` → `public.clinics(id)`
- `crm.lead_sources(clinic_id)` → `public.clinics(id)`
- `crm.leads(clinic_id)` → `public.clinics(id)`
- `crm.module_clinics(clinic_id)` → `public.clinics(id)`
- `crm.patients(clinic_id)` → `public.clinics(id)`
- `crm.user_units(clinic_id)` → `public.clinics(id)`

**`public.clinics` é, portanto, objeto compartilhado protegido.** Alterações de PK, tipo da coluna `id`, constraints, exclusão ou recriação de `public.clinics` podem afetar diretamente a integridade referencial do CRM. Qualquer migration futura que toque `public.clinics` deve verificar e preservar essas oito FKs.

**Proibido sem autorização explícita de Jefferson ou Helder:** ver `knowledge/15_PROCESSAMENTO_CONFIAVEL_DE_EVENTOS.md` §12 — lista completa de ações proibidas.

---

## 9. Estratégias possíveis de baseline

> **Aviso crítico sobre duplicação no diretório ativo.** Não é permitido adicionar arquivos históricos duplicados ao diretório ativo `supabase/migrations/` antes de definir qual histórico será canônico e como as versões substituídas serão tratadas. Exemplo concreto: o GitHub possui `20260604000001_add_hub_users.sql` e o principal registra `20260604135414_add_hub_users`. Se ambos coexistirem no diretório ativo, o Supabase pode considerar uma das versões como pendente e tentar reaplicar a DDL — risco de erro ou de efeito duplicado. O mesmo problema existe entre os timestamps CRM do DEV e do principal. Por isso, a estratégia abaixo não pode ser reduzida a "adicionar arquivos com timestamps exatos".

### Alternativa A — Registrar arquivos históricos com versões reais

Recuperar os `statements` registrados nos bancos e versioná-los, reproduzindo fielmente o que está aplicado — **sem coexistência de versões duplicadas no diretório ativo**.

| Critério | Avaliação |
|---|---|
| Segurança | Alta se resolvida a questão da duplicação; sem isso, média |
| Rastreabilidade | Muito alta — GitHub passa a refletir o estado exato dos bancos |
| Risco de reaplicação | **Real se versões antigas e novas coexistirem** no diretório ativo |
| Impacto no CRM | Nulo para o banco; requer arquivos CRM no repo (com autorização de Jefferson) |
| Dificuldade | Média — exige extrair `statements` e tratar versões substituídas |
| Reversibilidade | Alta — pode remover/arquivar os arquivos sem afetar o banco |
| Aderência ao fluxo DEV → PROD | Excelente — futuras migrations seguem o fluxo normal |

**Risco principal:** sem decidir qual histórico é canônico e sem arquivar as versões substituídas, a coexistência de duplicatas pode disparar reaplicação de DDL.

### Alternativa B — Criar uma migration de baseline sem reaplicar objetos

Criar um único arquivo de baseline que usa `CREATE TABLE IF NOT EXISTS`, `CREATE TYPE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` etc., documentando o estado atual sem criar conflito de reexecução.

| Critério | Avaliação |
|---|---|
| Segurança | Média — depende de IF NOT EXISTS correto em todos os objetos |
| Rastreabilidade | Média — o histórico real fica implícito, não explícito |
| Risco de reaplicação | Baixo se usados corretamente os guards IF NOT EXISTS |
| Impacto no CRM | Risco moderado — inclui objetos CRM em arquivo `public`, pode criar ambiguidade |
| Dificuldade | Alta — exige mapear todos os objetos dos dois schemas |
| Reversibilidade | Baixa — desfazer um baseline complexo pode ser difícil |
| Aderência ao fluxo DEV → PROD | Moderada |

**Risco principal:** um baseline monolítico dificulta entender o que é fundação vs. CRM vs. evolução futura.

### Alternativa C — Adotar marco de baseline e manter migrations antigas apenas como histórico

Criar um arquivo de marco (`00000000000000_baseline_snapshot.sql`) com comentários descritivos do estado, sem SQL executável para objetos já existentes. As migrations antigas ficam no diretório como documentação histórica. Futuras migrations partem de um ponto de referência claro.

| Critério | Avaliação |
|---|---|
| Segurança | Alta — arquivo de marco não executa DML/DDL |
| Rastreabilidade | Média — o histórico real precisa ser buscado manualmente nas migrations antigas |
| Risco de reaplicação | Muito baixo — arquivo descritivo não altera banco |
| Impacto no CRM | Nulo |
| Dificuldade | Baixa |
| Reversibilidade | Alta — remover o arquivo não afeta nada |
| Aderência ao fluxo DEV → PROD | Boa |

**Risco principal:** não resolve o problema de o Supabase não reconhecer as migrations existentes como aplicadas.

### Alternativa D — Recriar ambiente a partir do repositório

Destruir o DEV e reconstruí-lo do zero a partir do GitHub, ignorando o histórico atual.

| Critério | Avaliação |
|---|---|
| Segurança | **Muito baixa** — destrói o schema `crm` e o trabalho de Jefferson |
| Rastreabilidade | Baixa — histórico real é perdido |
| Risco de reaplicação | **Muito alto** — reaplica objetos que já existem de forma diferente |
| Impacto no CRM | **Destrutivo** — inaceitável |
| Dificuldade | Alta |
| Reversibilidade | Nula |
| Aderência ao fluxo | Não aplicável |

**Esta alternativa não é recomendável. Listada apenas para comparação teórica.**

---

## 10. Recomendação em duas etapas

A recomendação separa o que é seguro fazer agora (preservação documental) do que exige nova aprovação (canonicalização que toca metadados de ambiente).

### Etapa A — Preservação documental, sem implementação

Pode ser preparada sem risco aos ambientes:

- registrar os dois históricos (DEV e PROD), lado a lado;
- registrar `version`, `name` e hashes de cada migration;
- preservar o SQL de `statements` de cada migration (incluindo as ausentes no GitHub);
- documentar os arquivos GitHub equivalentes;
- **não adicionar duplicatas ao diretório ativo** `supabase/migrations/`;
- **não remover nem renomear** migrations existentes;
- **não executar `migration repair`**.

### Etapa B — Canonicalização futura, sujeita a nova aprovação

Compara três opções; nenhuma é executada sem autorização:

#### Opção 1 — Principal como histórico canônico (provável melhor caminho)

- usar as versões e o SQL registrados no principal como referência;
- arquivar os arquivos GitHub superseded **fora do diretório ativo** (ex.: `supabase/migrations_archive/` ou documentação);
- alinhar o histórico CRM do DEV via `migration repair`, **somente após confirmar equivalência estrutural** entre DEV e PROD;
- aplicar no DEV apenas as migrations públicas realmente ausentes, de forma aditiva.

#### Opção 2 — DEV CRM como histórico canônico

- exigiria reparar o histórico do principal;
- risco maior por alterar metadados do ambiente principal;
- **não recomendada** sem justificativa forte.

#### Opção 3 — Manter históricos divergentes e iniciar novo marco

- evita reparo imediato;
- reduz a capacidade de reconstruir um ambiente novo a partir do repositório;
- serve apenas como solução temporária.

**Recomendação provável: Opção 1**, por usar o ambiente principal (fonte de verdade em operação) como referência. Permanece, contudo, como **proposta pendente de aprovação** de Helder ou Jefferson — nada na Etapa B é executado sem autorização explícita.

A recomendação **preserva o CRM, não reaplica objetos existentes, não falsifica histórico e não altera versões já registradas sem autorização**.

## 11. Regras obrigatórias para a futura canonicalização

Nenhuma futura implementação poderá:

- deixar duas versões executáveis da mesma migration no diretório ativo `supabase/migrations/`;
- reaplicar DDL já existente nos ambientes;
- alterar o schema CRM;
- modificar a história do Supabase (`schema_migrations`) sem autorização explícita;
- usar `migration repair` sem plano, backup lógico do histórico e validação estrutural prévia;
- remover arquivos históricos sem preservá-los em local de arquivo/documentação;
- aplicar mudanças diretamente no principal antes de validar no DEV.

---

## 12. Plano futuro por fases

1. **Aprovar este inventário** (Helder ou Jefferson).
2. **Aprovar a estratégia de baseline** (Etapa A; Etapa B / Opção 1 como provável caminho, pendente de aprovação).
3. **Criar branch específica** (`helder/migration-baseline-registrar`).
4. **Extrair `statements`** das migrations do PROD (incluindo `fix_rls_recursive_hub_users` e `create_system_events`) — preservação documental, sem gravar no diretório ativo.
5. **Registrar os dois históricos** (DEV e PROD) com versões, nomes e hashes.
6. **Investigar `716bbe07` e `aab13a75`**: confirmar por qual caminho os efeitos chegaram ao PROD.
7. **Decidir o histórico canônico** e como tratar versões substituídas (sem duplicatas no diretório ativo).
8. **Abrir PR** para revisão dos arquivos históricos do `public`.
9. **Autorização de Jefferson** para os arquivos CRM (`crm_001..011`).
10. **Validar localmente** que o Supabase CLI não considera nenhuma migration como pendente.
11. **Planejar alinhamento aditivo do DEV** (aplicar migrations faltantes do `public` preservando o `crm`).
12. **Executar alinhamento do DEV** com checklist de compatibilidade CRM (ver doc 15 §12).
13. **Comparar objetos antes/depois** no DEV.
14. **Executar advisors** no DEV pós-alinhamento.
15. **Revisar PR** e obter autorização.
16. Somente então **considerar promoção** de novas migrations ao PROD.

---

## 13. Critérios de aceite

- Nenhuma migration existente é reaplicada em nenhum ambiente.
- Nenhum objeto CRM é alterado, removido ou recriado.
- GitHub passa a conter os arquivos históricos que explicam o estado atual de DEV e PROD.
- As divergências de timestamp entre GitHub e PROD ficam documentadas e reconciliadas.
- DEV e PROD têm suas diferenças de `public` documentadas e com plano de alinhamento aprovado.
- Futuras migrations podem ser aplicadas seguindo o fluxo DEV → PROD com segurança.
- Rollback de qualquer etapa do alinhamento não afeta o schema `crm`.
- Nenhuma versão duplicada da mesma migration coexiste no diretório ativo.
- Nenhum dado pessoal ou de conteúdo de registros está neste documento.

---

## 14. Decisões necessárias de Helder ou Jefferson

1. Aprovar este inventário como base de trabalho.
2. Escolher a estratégia de baseline (Etapa A agora; Etapa B / Opção 1 como provável caminho).
3. Autorizar Jefferson a revisar e aprovar a adição dos arquivos CRM (`crm_001..011`) ao GitHub.
4. Confirmar o caminho de origem dos efeitos de `716bbe07` (colunas presentes, versão ausente).
5. Confirmar o caminho de origem das policies de `aab13a75` (policies presentes, versão ausente).
6. Autorizar o uso futuro de `migration repair` para canonicalização (Etapa B), com plano e backup.
7. Autorizar o início da Etapa A (preservação documental) somente após aprovação das decisões 1 e 2.

---

## 15. Implementação não autorizada

Este documento não autoriza nenhuma alteração em banco de dados, migration, schema, dados, RLS, grants, autenticação, Edge Function, cron, frontend, backend ou integração. É exclusivamente auditoria e proposta de estratégia para decisão de Helder ou Jefferson.
