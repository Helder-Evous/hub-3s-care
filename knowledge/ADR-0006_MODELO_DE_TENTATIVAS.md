---
title: "ADR-0006: Tentativa como entidade de negócio e origem do agendamento (lead_attempts)"
doc_id: "ADR-0006_MODELO_DE_TENTATIVAS"
version: 1.0
data: 2026-06-30
status: SUPERSEDED (2026-07-01) — regra de negócio promovida para CRM-BR-001/CRM-DATA-001. Mantido como histórico técnico.
classificacao: L1 — Engenharia / Decisão de Arquitetura (ADR)
proprietario: Helder e Jheferson
module: Controle de Lead
schema: crm
related_docs:
  - S2-3B_LEAD_ATTEMPTS_DOMAIN.md
  - ADR-0004_DONO_DO_COMPARECIMENTO.md
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
---

# ADR-0006 — Modelo de Tentativas (`lead_attempts`) e origem do agendamento

> **⚠️ SUPERSEDED (2026-07-01).** A **regra de negócio** (elegibilidade, Cenário A/B, sem
> duplicidade, Canal ≠ Origem) foi promovida para **`CRM-BR-001`** (Vol.1) e os **valores de
> enum + `source_attempt_id`** para **`CRM-DATA-001`** (Vol.2). A **janela de elegibilidade**
> e a forma de imposição (trigger vs RPC) seguem como decisões **de engenharia em aberto**.
> Mantido como histórico. Fonte de verdade: volumes CRM-MESTRE.

## Contexto
O card exibe "Tentativas" mas não há entidade que as represente (`attemptsSummaryOf` é
design-only). Sem isso, não é possível medir produtividade/conversão, e há risco de
**duplicidade** entre tentativa manual, tentativa automática e criação de agendamento.
A operação da 3S termina no **comparecimento**; produtividade/premiação dependem de
tentativas rastreáveis e sem duplicidade.

## Decisão
1. **Tentativa vira entidade de negócio:** `crm.lead_attempts`.
2. **Relacionamento canônico `Lead → LeadAttempt → Appointment`.** Todo appointment referencia
   a tentativa que o originou via **`appointments.source_attempt_id`**.
3. **Nunca appointment sem tentativa**, e **nunca tentativa duplicada** por um único contato:
   - **Cenário A** (agenda sem tentativa prévia): sistema **cria automaticamente** 1 tentativa
     (`origin=sistema, result=agendou`) e vincula;
   - **Cenário B** (tentativa elegível já existe): sistema **reutiliza** (não cria outra).
4. **Elegibilidade** para originar/reutilizar: `contato_realizado, conversou, interessado,
   retorno, sem_resultado`. **Nunca** `sem_resposta, caixa_postal, ocupado, numero_invalido,
   nao_interessado`.
5. **Canal ≠ Origem** — dois eixos/enums distintos (`attempt_channel` × `attempt_origin`);
   modelar para **múltiplas origens** (CRC, consultor, **IA**, api, importação, sistema).
6. **Invariante garantido no banco** (trigger/RPC + unique parcial em `source_attempt_id`),
   não apenas na aplicação (para cobrir importações e IA).

## Alternativas consideradas
- **Sobrecarregar `crm.lead_activities`:** rejeitado — é log append-only de notas, sem
  `result/channel/origin/appointment` estruturados; não modela tentativa como métrica.
- **Regra só na aplicação (`createAppointment`):** insuficiente — importações/IA/API criariam
  appointment sem tentativa. Precisa de invariante no banco.
- **`appointments.source_attempt_id` vs `lead_attempts.appointment_id`:** escolhido o primeiro
  (uma origem por appointment; reverso por join; unique parcial impede 1→2).

## Consequências
- Rastreabilidade `Lead→Tentativa→Agendamento→Comparecimento→Receita` completa.
- Base para **IA** (origin=ia), **Premiação** (produtividade/conversão/comparecimento),
  **Dashboard** e indicadores.
- Card deixa de ser design-only; contador coerente.
- **Custo:** novas migrations (enums + tabela + FK + trigger/RPC + RLS) — exigem **Jheferson**
  e validação no **DEV** antes do Principal.

## Condições / não autorizado
- **Não** implementar "tentativa automática" antes de `lead_attempts` existir (risco de
  duplicidade/perda). **Pausar** qualquer automação até a entidade + regra estarem no DEV.
- Esta ADR é **direção**; nenhuma migration/DDL/RLS/código autorizado aqui.
