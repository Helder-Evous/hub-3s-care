---
documento: CRM-MESTRE-VOL2-DOMINIO-DADOS-EVENTOS
titulo: "Documento Mestre CRM Hub 3S — Volume 2: Domínio, Dados e Eventos"
versao: 1.0 (Draft Consolidado)
data: 2026-07-01
classificacao: OFICIAL — Fonte única de verdade do módulo CRM
contem_ids: [CRM-DOM-001, CRM-DATA-001, CRM-EVT-001]
origem: DOCUMENTO_MESTRE_CRM_HUB3S_VOLUME_2_DOMINIO_DADOS_EVENTOS.docx
status: Vigente (oficializado por decisão da Direção em 2026-07-01)
nota: >
  Transcrição fiel do volume oficial. Substitui qualquer versão anterior das mesmas
  regras (CRM-DOM-001 / CRM-DATA-001 / CRM-EVT-001).
---

# DOCUMENTO MESTRE CRM HUB 3S — VOLUME 2: DOMÍNIO, DADOS E EVENTOS
**Versão 1.0 (Draft Consolidado)**

## CRM-DOM-001 — Modelo de Domínio
O **Lead é a entidade central** do CRM. Todas as demais entidades existem em função dele.
- Lead pertence a uma única clínica.
- Lead possui exatamente uma Origem.
- Lead pode possuir uma Campanha.
- **Lead → LeadAttempt → Appointment** é o fluxo oficial.
- Appointment depende de uma tentativa elegível.
- Receita substitui orçamento e não altera a jornada.
- Timeline é imutável.
- Eventos são imutáveis.
- Presence representa ocupação operacional e não propriedade.

### Entidades Oficiais
Clinic · User · Lead · LeadSource · Campaign · LeadAttempt · Appointment · Revenue ·
Activity · Timeline · Event · Presence.

## CRM-DATA-001 — Modelo de Dados
O banco representa o domínio e **nunca a interface**.

### Tabelas Oficiais
`crm.clinics` · `crm.users` · `crm.leads` · `crm.lead_sources` · `crm.campaigns` ·
`crm.lead_attempts` · `crm.appointments` · `crm.revenues` · `crm.activities` ·
`crm.timeline` · `crm.events` · `crm.presence`.

### Enums Oficiais
`lead_stage` · `appointment_status` · `attempt_channel` · `attempt_origin` ·
`attempt_result` · `presence_status`.

### Restrições
- Lead exige Origem.
- Appointment exige Lead e Tentativa.
- Origem e Campanha são independentes.
- Histórico nunca é apagado.
- Compareceu e Perdido são arquivados, nunca excluídos.

### Valores dos enums de tentativa (promovido do ADR-0006 / S2-3B em 2026-07-01)
- `attempt_channel`: `telefone, whatsapp, instagram, email, presencial, sms, outro`.
- `attempt_origin`: `manual_crc, manual_consultor, ia, api, importacao, sistema`.
- `attempt_result`: `sem_resposta, ocupado, caixa_postal, numero_invalido, nao_interessado,
  interessado, retornar_depois, agendado`.
  - **Elegíveis** (originam/reutilizam agendamento): `interessado, retornar_depois, agendado`.
  - **Não elegíveis:** `sem_resposta, ocupado, caixa_postal, numero_invalido, nao_interessado`.
  - Conjunto consolidado pela decisão de 2026-07-01 (substitui a lista provisória do
    ADR-0006, que tinha 11 valores).

### Vínculo tentativa → agendamento
- `crm.appointments.source_attempt_id` (FK → `crm.lead_attempts.id`) referencia a tentativa
  que originou o agendamento.
- **Unique parcial** em `source_attempt_id` (quando não nulo): uma tentativa origina **no
  máximo um** agendamento. (A forma de imposição — trigger vs RPC — é decisão de engenharia.)

## CRM-EVT-001 — Catálogo de Eventos
Todo fato relevante gera um evento consumível por IA, dashboards, auditoria e integrações.

`LeadCreated` · `LeadAssigned` · `LeadLost` · `LeadReactivated` · `AttemptCreated` ·
`AttemptAutoCreated` · `AppointmentCreated` · `AppointmentConfirmed` ·
`AppointmentRescheduled` · `AppointmentCancelled` · `AppointmentAttended` ·
`RevenueRegistered` · `PresenceStarted` · `PresenceEnded`.

### Fluxo Oficial de Eventos
LeadCreated → AttemptCreated → AppointmentCreated → AppointmentConfirmed →
AppointmentAttended → RevenueRegistered → LeadArchived.

## Observação
Este volume define a arquitetura lógica do CRM. O Volume 3 trata da experiência
operacional (UX) e dos indicadores (KPIs).
