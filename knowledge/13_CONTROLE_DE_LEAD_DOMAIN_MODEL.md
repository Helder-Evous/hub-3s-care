---
title: Controle de Lead — Domain Model
doc_id: "13_CONTROLE_DE_LEAD_DOMAIN_MODEL"
version: 1.1.0-draft
date: 2026-06-26
status: Rascunho local — domínio IMPLEMENTADO (migrations 001–011 aplicadas; MVP frontend entregue no PR #7). Aguarda reconciliação com a KB oficial da 3S
classification: Interno — Arquitetura de Domínio
owner: Liderança 3S / Arquitetura HUB 3S
module: Controle de Lead
schema: crm
route: /controle-lead
master_entity: public.clinics
sync_status: pendente   # numeração (slot 13) e padrão de frontmatter podem mudar na reconciliação com a KB oficial
depends_on:
  - (KB oficial da 3S — externa, a sincronizar)
references_absent:                # citados como dependências; inexistentes neste repo nesta data
  - 00_MASTER_CONTEXT_3S.md
  - 06_ARQUITETURA_AI_FIRST.md
  - 07_PADRAO_DE_MODULOS_DO_HUB.md
supersedes: []
changelog:
  - 1.0.0-draft (2026-06-22): Rascunho local do domínio aprovado, antes do schema físico; aguarda reconciliação com a KB oficial.
  - 1.1.0-draft (2026-06-26): Domínio implementado (migrations 001–011) e MVP frontend (board, novo lead, detalhe, atividades) entregue no PR #7. Adicionada a seção 0 (estado atual implementado).
related_docs:
  - 14_CONTROLE_DE_LEAD_FRONTEND.md
  - 15_CRM_POSTGREST_EXPOSURE.md
  - 16_CRM_DADOS_DE_TESTE.md
  - 17_CRM_TYPES_TEMPORARIO.md
  - ADR-0001_DND_PERSISTENTE.md
  - 18_CRM_ROADMAP.md
---

# Controle de Lead — Domain Model

> **Rascunho local** das decisões arquiteturais **aprovadas** do módulo Controle de Lead, aguardando sincronização/reconciliação com a Knowledge Base oficial da 3S (externa a este repositório).
> Registra o domínio antes da criação do schema físico `crm` e das migrations.
> Nenhuma decisão aqui deve ser implementada sem aprovação explícita da etapa de schema.

---

## 0. Estado atual (IMPLEMENTADO — 2026-06-26)

> As seções 1–15 descrevem o **domínio aprovado** (algumas partes ainda futuras). Esta seção 0 registra o que **já está implementado** no banco (projeto `nndvcsdevbxpgsccyimm`) e no frontend (PR #7, branch `feat/crm-controle-lead`). Detalhes de frontend/infra/types/dados de teste estão nos docs irmãos (ver frontmatter `related_docs`).

### 0.1 Migrations aplicadas (001–011, schema `crm`)
Aplicadas em DEV e no projeto principal, **uma a uma via MCP `apply_migration`** (não via `db push`).

| # | Arquivo | Conteúdo |
|---|---|---|
| 001 | `20260622165813_crm_schema_and_grants` | schema `crm` + grants base |
| 002 | `20260622172233_crm_enums_and_lead_sources` | 8 enums + catálogo `lead_sources` (seeds) |
| 003 | `20260622173509_crm_access_model` | `user_profiles` (+trigger signup), `user_units`, `module_clinics` |
| 004 | `20260622175348_crm_helpers_and_rls` | 6 helpers SECURITY DEFINER + RLS de acesso |
| 005 | `20260622180558_crm_patients` | `patients` (dedup, normalização E.164, RLS) |
| 006 | `20260622181703_crm_leads` | `leads` (FK composta anti cross-clinic, RLS) |
| 007 | `20260622183221_crm_lead_activities` | `lead_activities` (append-only) + trigger `last_*` |
| 008 | `20260623082437_crm_appointments` | `appointments` (Modelo C) |
| 009 | `20260623084735_crm_budgets` | `budgets` (Modelo C) |
| 010 | `20260623090520_crm_stage_derivation` | `lead_stage_history` + `fn_recalc_lead_stage` + triggers + proteção de colunas |
| 011 | `20260623161151_crm_api_grants` | grant de uso dos enums para `authenticated` |

### 0.2 Enums (8) — implementados
`crm_role`, `patient_status`, `lead_stage`, `appointment_status` (`agendado/confirmado/remarcado/compareceu/faltou/cancelado`), `budget_status` (`rascunho/emitido/aceito/rejeitado/expirado/cancelado`), `activity_type` (`ligacao/whatsapp/nota/visita/email/outro`), `source_category`, `reconciliation_status`.

### 0.3 Tabelas (10) — implementadas
Acesso: `user_profiles`, `user_units`, `module_clinics`. Domínio: `lead_sources`, `patients`, `leads`, `lead_activities`, `appointments`, `budgets`, `lead_stage_history`. (Tabelas das seções 6.2/IA continuam **fora** do escopo.)

### 0.4 Helpers RLS (6) — `SECURITY DEFINER`, `STABLE`, `search_path=''`
`current_user_role`, `is_super_admin_3s`, `is_staff_3s`, `user_has_clinic_access(clinic_id)`, `module_enabled_for_clinic(clinic_id)`, `user_can_manage_module(clinic_id)`.

### 0.5 RLS — implementada em todas as tabelas
- **Leitura:** `is_staff_3s()` OU (`user_has_clinic_access(clinic_id)` E `module_enabled_for_clinic(clinic_id)`).
- **Escrita (insert/update):** `user_can_manage_module(clinic_id)` E `module_enabled_for_clinic(clinic_id)`.
- `lead_activities`: **append-only** (sem update/delete; insert exige `performed_by = auth.uid()` ou staff).
- `lead_stage_history`: **somente leitura** para `authenticated` (escrita só pela função do sistema).
- **Sem policy de DELETE** em nenhuma tabela (soft-delete/cancelamento via status).

### 0.6 Derivação de `current_stage` (CQRS-lite) — implementada
- `crm.fn_recalc_lead_stage(...)` (SECURITY DEFINER) é a **única escritora** de `current_stage`; grava `lead_stage_history` apenas em mudança real.
- Triggers: `appointments`/`budgets` em `AFTER INSERT OR UPDATE OF status`; `leads` em `AFTER UPDATE OF lost_at`.
- Rank monotônico via `crm.lead_stage_rank` (perdido = override terminal).

### 0.7 Proteção de colunas derivadas — implementada (migration 010)
`REVOKE UPDATE` da tabela `leads` e `GRANT UPDATE` **apenas** em `owner_id, source_id, lost_at, lost_reason, lost_by, source_system, external_ref`. Logo `current_stage`, `last_contact_at`, `last_activity_at` **só** são escritos pelas funções `SECURITY DEFINER`.

### 0.8 Regras invioláveis (reafirmadas)
- **A aplicação NUNCA escreve `current_stage` diretamente** — sempre derivado.
- `last_contact_at`/`last_activity_at` derivados por trigger de `lead_activities` (contato só p/ `ligacao/whatsapp/email/visita`).
- `perdido` deriva de `lost_at` (fonte de verdade).

### 0.9 Fora do escopo nesta entrega
- **DnD persistente NÃO aprovado** — board faz drag & drop **apenas visual** (ver `ADR-0001`).
- **Eventos (`system_events`) e IA (`ai_tasks`)** ainda **não** implementados (apenas seams previstos).
- `evaluations/treatments/clinical_revenue/post_sales/campaigns/lead_scores` continuam futuros.

### 0.10 Infra
Schema `crm` exposto no PostgREST via `pgrst.db_schemas` (ver `15_CRM_POSTGREST_EXPOSURE.md`). Types do `crm` em arquivo **temporário** (ver `17_CRM_TYPES_TEMPORARIO.md`).

---

## 1. Objetivo

Operar o **funil clínico completo do paciente** das clínicas da operação 3S — do primeiro contato (lead) até a receita clínica gerada e o pós-venda — em um ambiente integrado ao HUB 3S, com rastreabilidade ponta a ponta, eventos auditáveis e automações de IA sobre lacunas operacionais.

## 2. Papel no HUB 3S

**Módulo operacional transversal.** Não é um produto vendido isoladamente nem um sub-pilar de Chips/Canais: é a camada onde leads de **todos** os produtos de captação convergem (tráfego pago, disparos do Produto CRM, indicações, reativação, importações, produtos futuros) e avançam até efetivação e receita. Segue o padrão de módulo do HUB: `features/controle-lead/`, `routes/controle-lead.*`, tabelas próprias no schema `crm`, sem importar outros módulos diretamente (integração só por **dado** via `clinic_id` e por **evento** via `system_events`).

## 3. Diferença para o CRM Chips/Canais

| Dimensão | CRM Chips/Canais | Controle de Lead |
|---|---|---|
| Domínio | Saúde dos **canais** de WhatsApp | **Funil clínico do paciente** |
| Pergunta | "Consigo enviar mensagem?" | "O lead virou paciente e gerou receita?" |
| Entidade central | canal / número | lead-paciente |
| Schema | tabelas em `public` | tabelas em `crm` |
| Rota | `crm.*` (`/crm/...`) | `controle-lead.*` (`/controle-lead`) |
| Relação | módulo irmão | recebe leads de disparos via `system_events` |

## 4. Fluxo clínico

```
Lead → Agendamento → Comparecimento ─┬─→ Avaliação → Orçamento → Efetivação → Receita clínica → Pós-venda
                                     │
                          Falta → Remarcação ──(volta para Agendamento)
```

Funil **cíclico** (faltas/remarcações são laços; um lead tem N agendamentos, faltas e orçamentos). O estágio macro é **derivado**, nunca digitado como verdade única.

## 5. Decisões de domínio aprovadas

### 5.1 Lead × Patient
Entidades **separadas**. `crm.patients` = identidade persistente da pessoa (alvo de dedup/Codefy). `crm.leads` = instância de funil/oportunidade (1 paciente → N leads). **Patient é criado imediatamente** na criação do lead (Opção A), após resolução de identidade, com `patients.status` (`prospecto → ativo → inativo → descartado`). Reativação = novo lead, mesmo paciente.

### 5.2 Appointment × Lead — Modelo C
`crm.appointments.patient_id` **obrigatório**; `crm.appointments.lead_id` **opcional**. Manutenção, retorno, paciente antigo, walk-in e import Codefy podem não ter lead. **Invariante:** se `lead_id` setado, `lead.patient_id = appointment.patient_id`. Atribuição de origem/campanha herdada do lead quando presente.

### 5.3 current_stage — derivado e armazenado (CQRS-lite)
Verdade = eventos + entidades-filho + `lead_stage_history`. `leads.current_stage` é projeção denormalizada, mantida por trigger, **nunca** editada à mão. Regra: `current_stage` = **maior** estágio canônico alcançado (monotônico para frente); `perdido` é override terminal.

| Stage | Índice | Origem | MVP |
|---|---|---|---|
| novo | 0 | lead_created | sim |
| agendado | 1 | appointment em agendado/confirmado/remarcado | sim |
| compareceu | 2 | appointment compareceu | sim |
| em_avaliacao | 3 | evaluation registrada | futuro |
| orcamento | 4 | budget criado | sim |
| efetivado | 5 | 1º procedimento (treatment) | futuro |
| pos_venda | 6 | pós-venda iniciado | futuro |
| perdido | override | lead_lost | sim |

Falta/remarcação **não** regridem o macro (são sinais/AI tasks). No MVP são alcançáveis: novo, agendado, compareceu, orcamento, perdido.

### 5.4 Efetivação
"Paciente Efetivado" = **primeiro procedimento realizado** (milestone clínico). Receita/pagamento é evento financeiro **separado** (não confundir conversão clínica com receita). Confirmação do procedimento é SoT do Codefy.

### 5.5 Deduplicação
Granularidade **por clínica** (`clinic_id`); sem merge cross-clínica no MVP (LGPD: controladores distintos).
- **Automático (bloqueia/funde):** `clinic_id + CPF` exato.
- **Sugestão (CRC confirma):** `clinic_id + telefone_normalizado` (E.164); ou `nome (fuzzy) + data_nascimento`; ou `telefone + nome`.
- **Aprovação humana (merge):** qualquer fusão não-CPF-exata; cross-clínica (futuro).
CPF não obrigatório; email não autoritativo. Futuro: scoring probabilístico + grafo de pessoa cross-clínica + `codefy_id` como chave preferencial.

### 5.6 Cliente → Unidade → Clínica
`public.clinics` = **unidade** (tem CNPJ/endereço). MVP usa **clinic-only**; escopo multi-unidade já é coberto por `crm.user_units` (N unidades por usuário). `crm.organizations`/`clinic_groups` **reservado** para futuro (provável entidade HUB-wide). Nada no código/RLS deve assumir 1 clínica por usuário.

### 5.7 Patients e multiunidade (evolução)
- MVP: `crm.patients` com `clinic_id` (paciente por clínica) — simples, RLS direta, LGPD-safe.
- Longo prazo: `crm.patients` (pessoa) + `crm.patient_clinics` (N:N) quando houver grupos com paciente circulando entre unidades + visão única. Migração **aditiva**.

### 5.8 Codefy — fonte da verdade por campo
Controle de Lead é SoT do **topo** do funil; Codefy é SoT do **fundo**.

| Entidade | Fonte da verdade |
|---|---|
| Paciente | Dual/reconciliado (identidade de prospecto = módulo; cadastro clínico = Codefy) |
| Agendamento | Codefy |
| Comparecimento/Falta | Codefy |
| Orçamento | Codefy quando integrado (MVP: módulo provisório) |
| Tratamento | Codefy |
| Receita clínica | Codefy |

Bridge por `codefy_id` (UNIQUE) + upsert idempotente; conciliação em batch com matching `clinic + CPF/telefone + data`. Receita clínica **nunca** confundida com receita 3S (`public.sales`/`contracts`/`charges`).

## 6. Entidades

### 6.1 MVP (10)
**Acesso:** `crm.user_profiles`, `crm.user_units`, `crm.module_clinics`.
**Domínio:** `crm.patients`, `crm.leads`, `crm.lead_sources`, `crm.lead_activities`, `crm.lead_stage_history`, `crm.appointments`, `crm.budgets`.

### 6.2 Futuras (reservadas)
`crm.evaluations`, `crm.treatments`, `crm.clinical_revenue`, `crm.post_sales`, `crm.campaigns`, `crm.organizations` (+members), `crm.import_batches`/`crm.import_rows`, `crm.codefy_reconciliations`, `crm.lead_scores` (+ IA).

### 6.3 ERD conceitual (resumo)
```
public.clinics (1) ──< (N) crm.patients (1) ──< (N) crm.leads
                                                   ├──< crm.lead_activities
                                                   ├──< crm.lead_stage_history
                                                   ├──< crm.appointments (rescheduled_from → self)
                                                   ├──< crm.budgets
                                                   ├──< crm.evaluations        [futuro]
                                                   └──(origem)──> crm.lead_sources
crm.budgets ──< crm.treatments [fut] ──< crm.clinical_revenue [fut]
crm.patients ──< crm.post_sales [fut]
Acesso: auth.users (1)─(1) crm.user_profiles ──< crm.user_units >── public.clinics ; crm.module_clinics
```

## 7. Eventos (`public.system_events`)

Padrão: `event_type='controle_lead.<x>'`, `source='controle_lead'`, `entity_type ∈ {crm.lead, crm.patient, crm.appointment}`, `entity_id`, `clinic_id`, `payload`.

**MVP:** lead_created, lead_assigned, lead_contacted, lead_stage_changed, lead_scheduled, appointment_confirmed, lead_attended, lead_no_show, lead_rescheduled, budget_created, lead_lost.
**Futuro:** budget_accepted, patient_effectuated, revenue_recorded, post_sale_done, import_started/finished, codefy_reconciliation_completed, lead_scored, lead_temperature_changed, loss_risk_high, recommendation_created.

Disparo: eventos de negócio na camada de mutation; transições garantidas via trigger `SECURITY DEFINER` com `search_path` fixo.

## 8. AI Tasks (`public.ai_tasks`)

Padrão oficial do Hub: `task_type='controle_lead.<x>'`, `entity_type='crm.lead'`, `clinic_id`, `priority` (baixa/media/alta/critica), `impact_level`+`urgency_level`, `requires_human`, `assigned_to`, `source='controle_lead'`. Geradas por job/agente que lê views do `crm`.

| Task | Gatilho | Prioridade | Exige humano | Fase |
|---|---|---|---|---|
| lead_sem_contato | sem contato após X h do lead_created | alta | sim | MVP |
| lead_quente_sem_retorno | lead qualificado/alto valor sem atividade recente | alta | sim | MVP |
| agendado_sem_confirmacao | agendado e não confirmado a < N h da data | media | sim | F3 |
| falta_sem_remarcacao | faltou sem novo agendamento em M h | alta | sim | F3 |
| orcamento_sem_aceite | apresentado há > P dias sem decisão | media | sim | F4 |
| alto_potencial_reativacao | inativo/perdido com score alto | baixa | opcional | Futuro |

## 9. KPIs

Views regulares no schema `crm` (invoker rights; respeitam RLS; **sem** view `SECURITY DEFINER`).
**MVP:** total de leads, por origem, por CRC, taxa de contato, taxa de agendamento, taxa de comparecimento/falta, leads sem retorno.
**Futuro:** taxa de remarcação, aceite de orçamento, efetivação/conversão, receita clínica atribuída, ROI por campanha.
`crm.vw_modulo_overview` alimenta card na home do HUB. Sem sobreposição com indicadores de Chips/Canais.

## 10. Permissões e RLS

Papéis (enum `crm.crm_role`, **isolados** em `crm.user_profiles`, não mapeados a `hub_users.role`):
`super_admin_3s`, `gestor_3s`, `cliente`, `gestor_unidade`, `crc`.

- **Staff 3S** (`super_admin_3s`, `gestor_3s`): cross-clínica e cross-unidade. `super_admin_3s` gerencia acesso/entitlement e é o único com hard-delete (LGPD). `gestor_3s`: write-global operacional, sem gestão de usuários, sem hard-delete.
- **Clínica** (`gestor_unidade`, `crc`): escopo só das unidades em `user_units`; nunca cruzam clínica. `crc` = front-line (cria/edita lead/agendamento/orçamento/atividade; sem delete). `gestor_unidade` = idem + gestão da unidade.
- **`cliente`**: somente leitura das suas unidades (PII minimizada; acesso sensível em `public.audit_logs`).
- **Receita clínica**: escrita só por sistema/conciliação (override `super_admin_3s`); leitura por escopo.
- **Sem hard-delete operacional**: soft-delete (status/cancelamento) + auditoria.

RLS: default-deny; filtros por `is_staff()` ou `has_unit_access(clinic_id)` + `clinic_enabled(clinic_id)` + papel×operação. Helpers `SECURITY DEFINER`, `STABLE`, `SET search_path=''`. **Proibido** `USING(true)` permissivo e views `SECURITY DEFINER`.

## 11. Evolução para IA

`crm.lead_scores` (score, temperature frio/morno/quente, conversion_probability, loss_risk, model_version, features jsonb, computed_at) + projeção denormalizada no lead (score/temperature/loss_risk/last_scored_at). Feature store via views no início; recomendações via `ai_tasks` (`controle_lead.recommendation`) ou `crm.recommendations`; eventos `lead_scored`/`lead_temperature_changed`/`loss_risk_high`. Mesma disciplina do `current_stage`: tabela = verdade, campo no lead = projeção.

## 12. Roadmap por fases

- **Fase 0** — Brief & KB (este documento + atualização do PROJECT_CONTEXT.md).
- **Fase 1** — Base & permissões (schema, enums, user_profiles+trigger, user_units, module_clinics, helpers, RLS, expor `crm` na API).
- **Fase 2** — Leads & Kanban (leads, lead_sources, lead_activities, lead_stage_history; rotas; eventos de topo; KPIs).
- **Fase 3** — Agendamento & funil clínico (appointments, budgets; comparecimento/falta/remarcação; AI tasks).
- **Fase 4** — Efetivação & receita clínica (treatments, clinical_revenue; importações).
- **Fase 5** — Pós-venda.
- **Fase 6** — Campanhas, ROI & Codefy (campaigns, codefy_reconciliations, overview na home).
- **Fase 7** — IA & eventos avançados (lead_scores, processamento de system_events).

## 13. Restrições e premissas de segurança

- Todo o módulo no schema `crm`; **nada** criado em `public` (estrutura). Permitido apenas **INSERT** de linhas em `public.system_events` e `public.ai_tasks` e leitura controlada de entidades existentes.
- Reutilizar `auth.users`; perfis próprios em `crm.user_profiles`; `public.hub_users` só leitura auxiliar de nome/e-mail.
- Migrations manuais e revisadas; sem auto-deploy; sem commit sem autorização.
- Funções `SECURITY DEFINER` sempre com `search_path` fixo; sem `USING(true)`; sem view `SECURITY DEFINER`.

## 14. Itens em aberto (parâmetros de Fase 1)

- Default de papel no signup (recomendado: `cliente` sem unidades).
- Valor de `X` horas do gatilho `lead_sem_contato`.
- Escopo fino da API do Codefy (não bloqueia o schema; seams já previstos).

## 15. Status

**APROVADO PARA DESENHO DETALHADO DO SCHEMA CRM.** Próximo passo autorizável: redigir as migrations da Fase 1 (acesso + enums + helpers + RLS) como rascunho para revisão, sem aplicação.
