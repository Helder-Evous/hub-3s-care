---
documento: CRM-LIFECYCLE-001_CICLO_DE_VIDA_DO_LEAD
titulo: "CRM-LIFECYCLE-001 — Ciclo de Vida Operacional do Lead"
versao: 1.0
data: 2026-07-01
classificacao: OFICIAL — Documento Mestre (máquina de estados operacional do Lead)
contem_ids: [CRM-LIFECYCLE-001]
posicao_hierarquia: subordinado a MASTER-GOV-001 e CRM-CONST-001; autoritativo para transições de estado
status: Vigente (decisões de negócio aprovadas pela Direção em 2026-07-01)
related_docs:
  - CRM-MESTRE-VOL1-FUNDACAO.md
  - CRM-MESTRE-VOL2-DOMINIO-DADOS-EVENTOS.md
  - CRM-MESTRE-VOL3-UX-KPIS.md
  - CRM-MESTRE-VOL4-IA-BOOTSTRAP.md
nota: >
  Consolida a máquina de estados do Lead e absorve as regras exclusivas de projeção do
  Kanban dos ADR-0002/ADR-0003 (que poderão ser superseded após o merge deste documento).
  Nenhuma regra nova foi inventada: todas derivam das decisões aprovadas e dos volumes.
---

# CRM-LIFECYCLE-001 — Ciclo de Vida Operacional do Lead

> **Objetivo operacional (CRM-CONST-001):** gerar **comparecimentos**. Este documento define
> a máquina de estados do Lead do nascimento ao arquivamento, de forma **determinística e
> auditável**. Receita é indicador estratégico e **não altera** a jornada operacional.

## 0. Parâmetros oficiais (v1)
| Parâmetro | Valor v1 | Escopo |
|---|---|---|
| Janela de elegibilidade da tentativa | **24 horas** | por Lead |
| SLA de "tempo parado" (Novo sem contato) | **24 horas** | por clínica (configurável) |
| Janela de arquivamento (Compareceu/Perdido) | **24 horas** após o evento final | por Lead |
> Os valores são **parâmetros operacionais iniciais**, deterministas e configuráveis por
> clínica no futuro. Não são regras discricionárias em runtime.

## 1. Ciclo oficial do Lead
```
Novo Lead ─▶ Tentativa ─▶ Agendamento ─▶ Comparecimento ─▶ (Receita) ─▶ Arquivamento
                 │                            │
                 │                            └─▶ Falta/Cancelamento ─▶ Remarcar ─▶ (novo Agendamento)
                 └─▶ (sem sucesso / desqualificado) ─▶ Perdido ─▶ Arquivamento
```
- **Estados operacionais ativos (fila do Kanban):** Novo Lead, Agendado, Remarcar.
- **Estados encerrados:** Compareceu, Perdido (ambos arquivam após 24h).
- O **domínio** (`current_stage`, derivado) preserva o histórico completo; a **projeção
  operacional** (Kanban) mostra apenas o trabalho ativo. Em conflito, **vence a próxima ação**.

## 2. Tentativa elegível
- **Tentativa é entidade de negócio.** Relacionamento canônico **Lead → LeadAttempt →
  Appointment**. Todo agendamento tem **exatamente uma** tentativa que o originou
  (`appointments.source_attempt_id`).
- **O agendamento é o resultado de uma tentativa, nunca uma nova tentativa.**
- **Uma tentativa é elegível** para originar/reutilizar um agendamento quando **todas** as
  condições são verdadeiras:
  1. pertence ao **mesmo Lead**;
  2. ocorreu nas **últimas 24 horas**;
  3. **não foi usada** em outro Appointment;
  4. teve **resultado elegível**.
- **Resultados elegíveis:** `interessado, retornar_depois, agendado`.
- **Resultados não elegíveis:** `sem_resposta, ocupado, caixa_postal, numero_invalido,
  nao_interessado`.
- **Find-or-create ao agendar:**
  - **Cenário A** (sem tentativa elegível): o sistema **cria automaticamente** uma tentativa
    (`origin=sistema`, `result=agendado`) e a vincula.
  - **Cenário B** (tentativa elegível existe): o sistema **reutiliza** a existente; **nunca
    duplica** (nunca `Tentativa → Tentativa automática → Agendamento`).
- **Invariante:** uma tentativa origina **no máximo um** agendamento (unique parcial em
  `source_attempt_id`), garantido no banco (cobre importações e IA), não só na aplicação.
- **Canal ≠ Origem:** dois eixos distintos; múltiplas origens (CRC, consultor, IA, api,
  importação, sistema).

## 3. Agendamento
- Criar agendamento exige **data e hora** (modal obrigatória). **Sem data/hora, a
  movimentação é cancelada** (nada é persistido).
- O agendamento grava **`scheduled_by`** = CRC responsável operacional (dono do agendamento).
- **Remarcar cria um NOVO agendamento** vinculado ao anterior (`rescheduled_from`), com o
  `scheduled_by` de quem remarcou — nunca altera a data do agendamento antigo.
- Status oficiais (`appointment_status`): `agendado, confirmado, remarcado, compareceu,
  faltou, cancelado`.

## 4. Comparecimento
- **Comparecimento encerra a jornada operacional** (CRM-CONST-001). `Compareceu` **não**
  implica efetivação/receita.
- **Dono do comparecimento = `scheduled_by` do agendamento com `status=compareceu`.** Não é o
  primeiro CRC, não é o confirmador, não é quem importou a linha.
- O status de comparecimento entra pela **conciliação do Relatório Agenda** (§10), não por
  digitação livre que sobrescreva o dono.

## 5. Perda
- `Perdido` **encerra** a jornada e **exige motivo** (`lost_reason`). **Nunca exclui** o Lead.
- Existe para medir qualidade de leads/campanhas/origens, motivos de perda e oportunidades de
  reativação.

## 6. Arquivamento (24h)
- **Arquivar = sair da fila operacional do Kanban, sem excluir nem alterar histórico.**
- `Compareceu` e `Perdido` permanecem visíveis por **24h após o evento final**; depois
  **deixam de aparecer na query operacional** do Kanban.
- Permanecem íntegros e disponíveis em **relatórios, histórico, busca, reativação, IA e
  dashboards**.
- **Implementação recomendada (engenharia):** campo operacional de visibilidade/arquivamento
  + job/função agendada. **Nunca apagar dados.**

## 7. Reativação
- Ocorre **apenas por funcionalidade específica** (não é "desarquivar visual").
- Reativar recoloca o Lead na fila operacional (novo ciclo de trabalho) **preservando** todo
  o histórico anterior (tentativas, agendamentos, comparecimentos, perdas).
- Produz evento `LeadReactivated`.

## 8. Prioridade do card (v1 — determinística, sem IA)
Regra simples, auditável (a fórmula por pesos poderá evoluir depois):
| Condição | Prioridade |
|---|---|
| Lead **sem tentativa** | **Alta** |
| Lead **parado acima do SLA** (§9) | **Alta** |
| Lead em **Remarcar** | **Alta** |
| **Agendamento para hoje** | **Alta** |
| **Agendamento futuro** | Média |
| Lead **recente dentro do SLA** | Média/Baixa |
> Avaliação de cima para baixo; a primeira condição satisfeita define a prioridade.

## 9. Tempo parado (SLA)
- **Tempo parado** = tempo desde a última ação operacional relevante do Lead (criação sem
  contato, ou última tentativa/movimentação).
- **SLA v1 = 24h** (configurável por clínica). Acima do SLA → contribui para prioridade
  **Alta** (§8). Dentro do SLA → prioridade Média/Baixa.
- É indicador auditável e alimenta KPIs de tempo (§13).

## 10. Conciliação do Relatório Agenda
- O Relatório Agenda **atualiza o status** do Appointment (`compareceu/faltou/cancelou`) e
  **nunca sobrescreve `scheduled_by`**.
- **Chave principal de conciliação:** `appointment_id` / `codefy_id` / `external_ref` quando
  existir.
- **Fallback:** `clinic_id` + paciente/telefone + `scheduled_at` aproximado + status da agenda.
- **Nunca** conciliar apenas por `scheduled_by` (ele define o CRC responsável, não identifica
  o appointment).
- Importações seguem **as mesmas regras** das movimentações manuais (inclusive tentativa
  elegível e eventos).

## 11. Projeção do Kanban (absorve ADR-0002/ADR-0003)
**Colunas oficiais:** `Novo Lead · Agendado · Remarcar · Compareceu · Perdido`. `Efetivou`
**não** é coluna (efetivação é indicador). Projeção **somente leitura** (não escreve estado).

**Prioridade de projeção (primeira condição satisfeita vence):**
| # | Condição | Coluna |
|---|---|---|
| 1 | `lost_at` preenchido (e dentro da janela de 24h) | **Perdido** |
| 2 | agendamento **futuro ativo** (`agendado/confirmado/remarcado`, `scheduled_at ≥ agora`) | **Agendado** |
| 3 | agenda vencida sem desfecho **ou** `faltou`/`cancelado` sem novo futuro | **Remarcar** |
| 4 | `compareceu` (ou efetivado) sem novo agendamento futuro (e dentro da janela de 24h) | **Compareceu** |
| 5 | nenhuma condição anterior | **Novo Lead** |
- `cancelado` → **Remarcar**. Leads `efetivado` projetam em **Compareceu** (nunca somem).
- **Após 24h**, `Compareceu`/`Perdido` saem da projeção (arquivamento, §6).
- **Movimentação nunca é apenas visual:** todo movimento decorre de um fato (tentativa,
  agendamento, Relatório Agenda, perda) e produz evento/timeline/auditoria.

## 12. Eventos produzidos (CRM-EVT-001)
| Transição | Evento(s) |
|---|---|
| Criação do Lead | `LeadCreated` (+ `LeadAssigned` se houver responsável) |
| Registro de tentativa (manual) | `AttemptCreated` |
| Tentativa automática (Cenário A) | `AttemptAutoCreated` |
| Criação de agendamento | `AppointmentCreated` |
| Confirmação | `AppointmentConfirmed` |
| Remarcação (novo appointment) | `AppointmentRescheduled` |
| Cancelamento | `AppointmentCancelled` |
| Comparecimento (via Relatório Agenda) | `AppointmentAttended` |
| Registro de receita | `RevenueRegistered` |
| Perda | `LeadLost` |
| Reativação | `LeadReactivated` |
| Arquivamento (24h) | `LeadArchived` |
| Presença operacional | `PresenceStarted` / `PresenceEnded` |
> Todo evento é **imutável** e consumível por IA, dashboards, auditoria e integrações.

## 13. Impactos

### 13.1 Dados (CRM-DATA-001)
- Requer `crm.lead_attempts` (+ enums `attempt_channel/origin/result`), `crm.appointments.
  source_attempt_id` (unique parcial), campo operacional de **arquivamento/visibilidade** em
  `crm.leads` (ou equivalente), `crm.revenues`, `crm.campaigns`, `crm.events`, `crm.timeline`,
  `crm.presence`. `Origem` obrigatória (`leads.source_id NOT NULL`).

### 13.2 UX (CRM-UX-001)
- Kanban de 5 colunas; **Novo→Agendado abre modal obrigatória**; card exibe origem (sempre),
  campanha (quando existir), responsável, **presença**, **prioridade (§8)**, **tentativas**,
  **tempo parado (§9)**, próxima ação. Compareceu/Perdido somem após 24h.

### 13.3 IA (CRM-IA-001)
- IA gera tentativas (`origin=ia`), prioriza e sugere próxima ação **sobre o domínio**, nunca
  sobre a interface; toda ação é auditável e produz eventos. IA usa **apenas** estas regras.

### 13.4 KPIs (CRM-KPI-001)
- Alimenta: comparecimentos, tempo até 1º contato/agendamento/comparecimento, leads
  parados/perdidos/reativados, tentativas (totais/por CRC), conversão tentativa→agendamento,
  remarcações, produtividade do CRC; marketing/financeiros por origem/campanha; premiação
  (comparecimentos + produtividade).

### 13.5 Migrations (direção — não autorizadas aqui)
- Ordem sugerida: `lead_attempts` (+enums) → `source_attempt_id` → `campaigns` → `revenues` →
  arquivamento/visibilidade → `events`/`timeline` → `presence` → `origem NOT NULL`.
- Toda migration é fluxo **DEV → Principal** com autorização do Jheferson.

## 14. ADRs que poderão ser SUPERSEDED após o merge deste documento
- **ADR-0002** (Kanban como projeção) e **ADR-0003** (mesa operacional / colunas / prioridade
  de projeção) — regra exclusiva absorvida no §11.
- **ADR-0001** (DnD) — a regra "nunca mover só visualmente" já está em CRM-CONST-001/§11;
  o que restar é decisão **técnica** de implementação do DnD (permanece como engenharia).

## 15. Pendências reais restantes (apenas para migrations/engenharia)
- Forma de imposição do invariante de tentativa: **trigger `BEFORE INSERT`** em `appointments`
  vs **RPC** `crm.create_appointment` (decisão técnica).
- Modelagem exata do **campo de arquivamento/visibilidade** e do **job/função** de 24h.
- `channel` da tentativa automática (Cenário A): `nullable` ou valor `outro`.
- Nenhuma **regra de negócio** pendente — todas as decisões operacionais foram fechadas.
