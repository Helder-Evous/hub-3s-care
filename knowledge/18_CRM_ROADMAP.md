---
title: Controle de Lead — Roadmap pós-MVP
doc_id: "18_CRM_ROADMAP"
version: 1.0.0-draft
date: 2026-06-26
status: Rascunho local de engenharia — pendências e próximos passos
classification: Interno — Engenharia / Planejamento
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 14_CONTROLE_DE_LEAD_FRONTEND.md
  - 16_CRM_DADOS_DE_TESTE.md
  - 17_CRM_TYPES_TEMPORARIO.md
  - ADR-0001_DND_PERSISTENTE.md
---

# Controle de Lead — Roadmap pós-MVP

## 0. Antes do merge do PR #7 (checklist)
- [ ] Click-test logado como operador (board, novo lead, detalhe, atividade).
- [ ] Gerar `types.ts` oficial `public,crm` e **remover `crm-types.ts`** (doc 17).
- [ ] **Limpar dados de teste** `[SEED]`/`[TESTE UI]` (doc 16) — sob autorização.
- [ ] Revisar o PR (sair de Draft) e mergear para `main`.

## 1. Próximos incrementos (frontend/domínio)
- **Detalhe — ações reais:** registrar/editar **agendamentos** (`appointments`) e **orçamentos**
  (`budgets`) pela UI (hoje só leitura) — disparando a derivação de estágio por trigger.
- **DnD persistente:** somente após a decisão de domínio do `ADR-0001`.
- **Reatribuição de responsável** e **embed do nome do owner** no board.
- **Edição/anexos de atividades**, data manual (`occurred_at`) — fora do MVP atual.

## 1.1 Kanban operacional (S2-0 — entregue no PR #9; ver `ADR-0002`)
- [x] **Projeção operacional do board** — `resolveLeadOperationalState`, agrupamento por estado
  operacional, embed de `appointments` na query do board, DnD apenas visual.
- [ ] **Definir a fonte de verdade de `efetivado`** — hoje só `current_stage='efetivado'`; avaliar
  entidade/flag de efetivação (confirmação da clínica) — possível migration futura, fora do S2-0.
- [ ] **Evoluir importações e relatórios da clínica como fatos operacionais** que alimentem a
  projeção (além de `appointments`): planilha `.xlsx`, integrações e IA supervisionada.
- [ ] **Decidir o destino visual** de leads em `em_avaliacao`/`orcamento`/`pos_venda` no board
  operacional (mapear, agrupar em "Outros" ou ocultar).

## 1.2 S2-2 — Gestão de Agendamentos (a implementar; alimenta a projeção do S2-0)
- [ ] **S2-2A — criar agendamento** (INSERT em `crm.appointments`; deriva `Agendado`) — sem migration.
- [ ] **S2-2B — remarcar** (UPDATE `status='remarcado'` + nova data; permanece `Agendado`/`Remarcar`) — sem migration.
- [ ] **S2-2C — compareceu/faltou** (UPDATE status; `compareceu`→Compareceu, `faltou`→Remarcar) — sem migration;
  regra de falta a confirmar com Helder/Jheferson (toca leitura da projeção, não o enum).
- Observações de agendamento → `lead_activity` tipo `nota` (não reusar `procedure_name`, sem migration).

## 1.3 Consolidação 2026-06-30 (auditoria arquitetural — ver docs 13 §0.12, 19–22, ADR-0003/0004)

Ordenado por dependência/risco. Itens de migration tocam o schema `crm` (exigem Jheferson).

- [x] **(Alto, frontend) Corrigir colunas do board** — `Efetivou` removido (ADR-0003); colunas
  oficiais `Novo Lead/Agendado/Remarcar/Compareceu/Perdido`; leads `efetivado` projetam em
  Compareceu. **Concluído** (commit `fix(crm): remover coluna Efetivou do board operacional`).
- [ ] **(Crítico, migration OBRIGATÓRIA antes do S2-2B) `appointments.scheduled_by`** — CRC
  responsável operacional pelo agendamento (não "quem criou a linha"); habilita o "dono do
  comparecimento" (ADR-0004/0005) e a futura Premiação. Sem ela, **pausar o S2-2B**: cada
  appointment criado/remarcado nasce sem dono (perda irreversível). Exige Jheferson, DEV antes do Principal.
- [ ] **(Alto, migration) Entidade de Campanha** — separar de Origem (`lead_sources`); base dos
  indicadores por campanha (doc 13 §0.12).
- [ ] **(Alto, migration) Tentativas como entidade (`crm.lead_attempts`)** — modelo
  `Lead → LeadAttempt → Appointment` (`appointments.source_attempt_id`), **find-or-create** sem
  duplicidade, **canal × origem**; base de produtividade/conversão/IA/premiação. Ver
  `S2-3B_LEAD_ATTEMPTS_DOMAIN.md` + `ADR-0006`. **Bloqueio:** não automatizar tentativa antes da entidade existir.
- [ ] **(Médio, migration) Observação do lead** — para card e edição (§10).
- [ ] **(Médio, migration) Vigência/histórico de `user_units`** — Gestão de Unidades CRC (doc 19).
- [ ] **(Médio, migration) Observações da unidade** — entidade visível ao CRC (doc 13 §0.12).
- [ ] **(Baixo, futuro) Card "em uso"** (presença/lock) — não implementar realtime sem aprovação.
- [ ] **(Futuro) Importações** (leads e agenda) — doc 20.
- [ ] **(Futuro) Experiência do Cliente + Dashboard configurável** — docs 21 e 22 (novo modelo de acesso de cliente).
- [ ] **Priorização/cores do card** (§7/§9) — depende de tentativas + origem (`category='paga'`).

> **S2-2B** (operação do agendamento) depende do `scheduled_by` para não criar appointments sem
> dono. Recomendação na auditoria: corrigir o board (ADR-0003) e decidir o `scheduled_by` antes de
> ampliar a criação/remarcação de appointments.

## 2. Funil clínico (estágios futuros)
- `em_avaliacao` (`evaluations`), `efetivado` (`treatments`/1º procedimento), `pos_venda` (`post_sales`).
- `clinical_revenue` (receita clínica — **nunca** confundir com receita 3S).

## 3. Dashboards / KPIs
- Views no schema `crm` (invoker rights, respeitando RLS): total/origem/CRC, taxas de contato/
  agendamento/comparecimento, leads sem retorno; card `vw_modulo_overview` na home do HUB.

## 4. Eventos (`public.system_events`)
- Emitir eventos de topo de funil na camada de mutation (lead_created, lead_contacted,
  lead_stage_changed, …). **Ainda não implementado** — apenas seams previstos (doc 13, §7).

## 5. IA (`public.ai_tasks`)
- Tarefas operacionais (lead_sem_contato, agendado_sem_confirmacao, orcamento_sem_aceite, …) e,
  depois, `lead_scores`/recomendações (doc 13, §8 e §11). **Fora do escopo atual.**

## 6. Integração Codefy
- Conciliação por `codefy_id` (upsert idempotente) para o fundo do funil (agendamento/comparecimento/
  tratamento/receita) — seams já existem nas tabelas; integração inativa.

## 7. Dívidas técnicas rastreadas
- `crm-types.ts` temporário (doc 17).
- Migrations aplicadas via MCP uma a uma (fora de `db push`) — possível divergência com o histórico
  do Supabase CLI; reconciliar se for adotar `db push`.
- Exposição do `crm` via `pgrst.db_schemas` sujeita a sobrescrita pelo Dashboard (doc 15).
