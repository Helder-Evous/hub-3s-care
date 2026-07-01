---
documento: S2-3B_LEAD_ATTEMPTS_DOMAIN
versao: 0.1-draft
data: 2026-06-30
classificacao: L1 — Operacional/Técnico
proprietario: Helder e Jheferson
status: Proposta de domínio — aguardando aprovação (sem implementação)
implementacao: não autorizada
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 18_CRM_ROADMAP.md
  - ADR-0004_DONO_DO_COMPARECIMENTO.md
  - ADR-0005_FONTES_DE_DADOS_DO_CONTROLE_DE_LEAD.md
  - ADR-0006_MODELO_DE_TENTATIVAS.md
---

# S2-3B — Modelo de Domínio de Tentativas (`lead_attempts`)

> **Documentação/arquitetura apenas.** Nenhuma migration, banco, RLS, código ou frontend
> alterado. Base para IA, Premiação, Dashboard e indicadores dos próximos anos do CRM 3S.

## 1. Problema e objetivo
Hoje o card de tentativas é **design-only** (`attemptsSummaryOf` retorna `0`/`null` até
`crm.lead_attempts` existir). Sem uma entidade de tentativas, corre-se o risco de
**duplicidade** (ex.: `2 tentativas` para `1 contato`) e é impossível medir produtividade,
conversão e ranking de CRC. Objetivo: elevar **Tentativa** a **entidade de negócio** e
garantir rastreabilidade completa `Lead → Tentativa → Agendamento → Comparecimento → Receita`.

## 2. Regra de negócio aprovada
- **Todo agendamento tem uma tentativa que o originou** — nunca existe appointment sem tentativa.
- **O agendamento NÃO é uma nova tentativa** — é o **resultado** de uma tentativa.
- **Relacionamento canônico:** `Lead → LeadAttempt → Appointment` (e **não** `Lead → Appointment → Tentativa`).

### Cenário A — CRC agenda sem tentativa prévia
O CRC leva o card para "Agendado" (cria appointment) sem ter registrado tentativa.
→ **o sistema cria automaticamente 1 tentativa** (`origin=sistema`, `result=agendou`) e a vincula.

### Cenário B — CRC registrou tentativa antes
Ex.: WhatsApp → `result=conversou`. Depois cria o agendamento.
→ **o sistema NÃO cria outra tentativa**; **reutiliza** a existente como origem do appointment.
→ Nunca `Tentativa → Tentativa automática → Agendamento`. **Sem duplicidade.**

## 3. Canal × Origem (conceitos distintos — não confundir)
- **Canal (meio):** `telefone, whatsapp, instagram, email, presencial, sms, outro`.
- **Origem (quem/qual sistema gerou):** `manual_crc, manual_consultor, ia, api, importacao, sistema`.
> Modelar para **múltiplas origens** (o CRC **e** a IA geram tentativas), não só o CRC.

## 4. Entidades e enums propostos (conceitual — NÃO criar agora)
### `crm.lead_attempts`
```
id            uuid pk
clinic_id     uuid not null            -- FK public.clinics (anti-cross-clinic via composta c/ lead)
lead_id       uuid not null
patient_id    uuid not null            -- denormalizado (FK composta com clinic)
channel       crm.attempt_channel      -- nullable p/ auto/sistema sem meio conhecido (ver §7)
origin        crm.attempt_origin  not null
result        crm.attempt_result  not null
notes         text
occurred_at   timestamptz not null default now()
created_by    uuid                     -- FK crm.user_profiles; NULL quando ia/api/importacao/sistema
created_at    timestamptz not null default now()
-- índices: (lead_id, occurred_at), (clinic_id, occurred_at), (created_by)
```
### Enums
- `crm.attempt_channel`: `telefone, whatsapp, instagram, email, presencial, sms, outro`
- `crm.attempt_origin`: `manual_crc, manual_consultor, ia, api, importacao, sistema`
- `crm.attempt_result`: `sem_resposta, caixa_postal, ocupado, numero_invalido, nao_interessado, contato_realizado, conversou, interessado, retorno, sem_resultado, agendou`

### Vínculo com o agendamento
`crm.appointments.source_attempt_id uuid` (**FK → `crm.lead_attempts.id`**, nullable).
**Unique parcial** em `source_attempt_id where source_attempt_id is not null` →
uma tentativa origina **no máximo um** appointment (impede `1 tentativa → 2 agendamentos`).
> `lead_attempts` **não** precisa de `appointment_id` (derivável por join reverso).

## 5. Elegibilidade (tentativa que pode originar agendamento)
**Pode:** `contato_realizado, conversou, interessado, retorno, sem_resultado`.
**Não pode:** `sem_resposta, caixa_postal, ocupado, numero_invalido, nao_interessado`.
Esses resultados **nunca** geram agendamento automático nem podem ser reutilizados como origem.

## 6. Fluxo de criação do Appointment (find-or-create)
```
ao criar Appointment(lead, scheduled_by, scheduled_at):
  se source_attempt_id foi informado e é válido:      -- app já sabe a origem (Cenário B explícito)
     usar como origem
  senão:
     eleg := última lead_attempts onde
             lead_id = lead
         AND created_by = scheduled_by                -- mesmo CRC
         AND result ∈ ELEGÍVEL
         AND ainda não vinculada a nenhum appointment
         AND occurred_at >= now() - JANELA            -- janela parametrizável (ex.: 24–72h)
     se eleg existe:  source_attempt_id := eleg.id     -- Cenário B (reutiliza)
     senão:           att := insert lead_attempts(lead, patient, clinic,
                              origin='sistema', result='agendou', created_by=scheduled_by)
                      source_attempt_id := att.id       -- Cenário A (auto)
```
```
Cenário A:   Lead ──▶ (sistema) LeadAttempt(agendou) ──▶ Appointment
Cenário B:   Lead ──▶ (crc) LeadAttempt(conversou) ──▶ Appointment      (sem tentativa extra)
```

## 7. Decisões em aberto (para Helder/Jheferson)
- **Onde impor a regra:** **trigger `BEFORE INSERT` em `appointments`** (garante o invariante para
  qualquer origem, inclusive importações) **e/ou** RPC `crm.create_appointment(...)` (UX rica com
  canal/observação). Recomendação: **trigger como invariante** + app pode informar `source_attempt_id`.
- **Canal da tentativa automática (Cenário A):** `channel` **nullable** ou valor `outro`/`nao_informado`.
- **Janela de elegibilidade:** valor default (24h? 72h?) e se é por clínica.
- **`created_by` em tentativas de IA/import:** NULL + `origin` identifica o agente.

## 8. Card operacional (comportamento — sem implementar)
Tentativas **sempre visíveis**: `N realizadas` + `Última: <quando> • <canal>`; quando `0`,
CTA **"Registrar tentativa"** (hoje desabilitado). Fonte passa de *design-only* para
`crm.lead_attempts` (contador coerente: nunca `0 tentativas / 1 agendamento`).

## 9. Rastreabilidade completa
```
Lead ─▶ LeadAttempt ─▶ Appointment ─▶ (status: compareceu) ─▶ Receita
        origin/canal    scheduled_by     Relatório Agenda        (lead_revenues, futuro)
```
- **Produtividade/premiação:** contam-se **tentativas** (por CRC/origem/canal) e a **conversão
  tentativa→agendamento**; o **comparecimento** credita o `scheduled_by` do appointment comparecido
  (ADR-0004); a **receita** é indicador do lead (ADR-0007, futuro).

## 10. Integrações futuras
- **IA:** gera `lead_attempts` (`origin=ia`) a partir de WhatsApp/telefonia; supervisão humana em exceções.
- **Premiação:** produtividade (tentativas), conversão, comparecimento; receita como métrica separada.
- **Dashboard:** funil `Lead→Tentativa→Agendamento→Comparecimento→Receita`; taxas por origem/canal/campanha/unidade/CRC/período.

## 11. Riscos
| Sev. | Risco | Mitigação |
|---|---|---|
| Alto | Implementar "tentativa automática" **sem** `lead_attempts` → duplicidade/perda | **Pausar** até a entidade + regra existirem |
| Alto | Regra só na aplicação → importações/IA criam appointment sem tentativa | **Trigger** garante o invariante |
| Médio | `1 tentativa → 2 appointments` | **unique parcial** em `source_attempt_id` |
| Médio | Confundir canal com origem | dois enums distintos |
| Baixo | Janela de elegibilidade mal calibrada | parametrizar; começar conservador |

## 12. Não autorizado nesta etapa
Sem migration, banco, RLS, enums, triggers, código, frontend, commit ou PR. Apenas domínio/plano.
