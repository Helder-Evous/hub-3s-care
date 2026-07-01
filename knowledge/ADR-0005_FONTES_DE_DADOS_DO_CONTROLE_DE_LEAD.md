---
title: "ADR-0005: Fontes de dados do Controle de Lead (3 entradas + fontes de verdade)"
doc_id: "ADR-0005_FONTES_DE_DADOS_DO_CONTROLE_DE_LEAD"
version: 1.0.0
date: 2026-06-30
status: SUPERSEDED (2026-07-01, parte normativa) — promovida para CRM-BR-001 (Vol.1). Parte técnica permanece como engenharia.
classification: Interno — Engenharia / Decisão de Arquitetura (ADR)
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 20_CRM_IMPORTACOES_E_STATUS_OPERACIONAIS.md
  - ADR-0003_KANBAN_COMO_MESA_OPERACIONAL_DO_CRC.md
  - ADR-0004_DONO_DO_COMPARECIMENTO.md
---

# ADR-0005 — Fontes de dados do Controle de Lead

> **⚠️ SUPERSEDED (parte normativa, 2026-07-01).** As três entradas oficiais, a matriz de
> fontes de verdade, "Relatório Agenda nunca define o dono" e "Campanha ≠ Origem" foram
> **promovidas para `CRM-BR-001`** (Vol.1 — seção "Fontes de Dados e Conciliação da Agenda").
> A **parte técnica** (migration, chave de conciliação, DDL) permanece como documentação de
> engenharia. Fonte de verdade da regra: `CRM-MESTRE-VOL1-FUNDACAO.md`.

## Contexto

O Controle de Lead recebe dados por caminhos diferentes, e misturá-los gera ambiguidade
(quem agendou? quem ganha o comparecimento? de onde veio o status?). Este ADR fixa as
**três entradas oficiais** de dados e a **matriz de fontes de verdade**.

## Decisão — três entradas oficiais

### 1. Incluir Lead / Importar Leads
Informa: lead, telefone, **unidade**, **origem**, **campanha**, responsável (se houver).
Função: cria/atualiza paciente+lead (dedup por telefone normalizado), define unidade, origem
e campanha, e coloca o lead no fluxo. Alimenta principalmente a coluna **Novo Lead** (ou o que
a projeção operacional resolver a partir de fatos já existentes).

### 2. Agendamento CRC
Informa: **qual CRC agendou**, data/hora, unidade, lead, paciente, e se é novo agendamento ou
remarcação. Função: cria o `appointment`, preserva histórico, e **define o dono operacional**
daquele appointment (base da premiação).
> **Regra:** o CRC que executou o agendamento é o dono daquele appointment
> (`appointments.scheduled_by` — o responsável operacional, não quem criou tecnicamente a linha).

### 3. Relatório Agenda
Informa o status vindo da agenda/relatório da clínica: `compareceu`, `faltou`, `cancelou`,
eventualmente `confirmado`/`remarcado`. Função: **atualiza o status** do appointment existente,
move o Kanban por projeção operacional e alimenta indicadores.
> **Regra crítica:** o Relatório Agenda **NUNCA** define o dono do comparecimento. Ele só
> **confirma o status** de um appointment que já existe (criado pela entrada 2).

## Matriz de fontes de verdade

| Informação | Fonte de verdade |
|---|---|
| Lead existe | Importação de Leads / criação manual |
| Unidade do lead | Importação de Leads / gestor autorizado |
| Origem | Importação de Leads / gestor autorizado |
| Campanha | Importação de Leads / gestor autorizado |
| Quem agendou | Appointment executado pelo CRC (`scheduled_by`) |
| Quem remarcou | Novo appointment com `rescheduled_from` (`scheduled_by` = quem remarcou) |
| Compareceu / Faltou / Cancelou | Relatório Agenda (atualiza `status`) |
| Dono do comparecimento | `scheduled_by` do appointment com `status='compareceu'` |
| Movimento do Kanban | Projeção operacional (somente leitura) |
| Efetivação / Receita | Relatório/entrada posterior da clínica (indicador, não fila) |

## Consequências

- O dono do comparecimento depende **exclusivamente** de `appointments.scheduled_by` (o CRC
  responsável operacional) — que **não existe** no schema atual (ver ADR-0004 e §gap abaixo).
- O Relatório Agenda é um **atualizador de status**, não um criador de appointments nem de donos.
- Origem e campanha precisam ser **dimensões separadas** (campanha não existe hoje — ver doc 13 §0.12).

## Gap crítico (FATO confirmado 2026-06-30)

`crm.appointments` **não possui `scheduled_by`**. Sem ela, as entradas 2 e 3 não conseguem
atribuir o comparecimento. Cada appointment criado hoje (S2-2A) nasce sem dono — perda
irreversível para premiação. **Recomendação: pausar o S2-2B até criar `scheduled_by`** (ADR-0004).

## Status
**Aceito** como decisão de domínio. Sem implementação nesta tarefa. A criação de `scheduled_by`
é migration no schema `crm` (exige Jheferson, DEV antes do Principal).
