---
title: Controle de Lead — Dados de teste no projeto principal
doc_id: "16_CRM_DADOS_DE_TESTE"
version: 1.0.0-draft
date: 2026-06-26
status: Rascunho local de engenharia — inventário de dados de teste
classification: Interno — Engenharia / Dados
module: Controle de Lead
schema: crm
project: nndvcsdevbxpgsccyimm
clinic_piloto: 56d8c6cd-5e0d-443a-affa-6ef72fd93fd5  # "amor saude"
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 18_CRM_ROADMAP.md
---

# Controle de Lead — Dados de teste

> ⚠️ O **projeto principal** (`nndvcsdevbxpgsccyimm`) contém dados de teste **não removidos**.
> Inventariados aqui para rastreabilidade e limpeza controlada.

## 1. Dados `[SEED]` — seed visual do board
- **Tag:** `source_system = 'seed_visual_board'`.
- **O quê:** 5 leads (um por estágio: novo, agendado, compareceu, orçamento, perdido) com seus
  pacientes `[SEED] …`, mais 2 appointments e 1 budget que **derivam** os estágios via trigger.
- **Onde:** clínica piloto `56d8c6cd-…` (amor saude).
- **Finalidade:** popular o board para teste visual dos estágios.

## 2. Dados `[TESTE UI]` — validação de fluxos reais
- **O quê:**
  - Novo Lead/dedup: **1 paciente** `[TESTE UI] Lead Novo Real` (telefone `+5531988881234`) com **2 leads**
    (o segundo reaproveitou o paciente — prova da deduplicação).
  - Atividade: **1** `lead_activities` (`ligacao`, summary `[TESTE UI] ligacao de teste`) que disparou as
    triggers de `last_contact_at`/`last_activity_at`.
- **Tag:** seguem o fluxo real (`source_system = 'controle_lead'`); identificados pelo prefixo de nome `[TESTE UI]`.
- **Onde:** clínica piloto `56d8c6cd-…`.

## 3. Impacto em KPIs
Enquanto presentes, esses registros **contam** em qualquer contagem/dashboard de leads/pacientes/atividades
da clínica piloto. Devem ser removidos antes de medir métricas reais (e, idealmente, antes do merge do PR).

## 4. SQL de cleanup (apagar pacientes cascateia leads/appointments/budgets/activities/history)
```sql
delete from crm.patients
where clinic_id = '56d8c6cd-5e0d-443a-affa-6ef72fd93fd5'
  and (source_system = 'seed_visual_board' or full_name like '[TESTE UI]%');

-- verificação (esperado: 0/0)
select count(*) from crm.leads
  where clinic_id='56d8c6cd-5e0d-443a-affa-6ef72fd93fd5'
    and (source_system='seed_visual_board');
select count(*) from crm.patients
  where clinic_id='56d8c6cd-5e0d-443a-affa-6ef72fd93fd5'
    and (source_system='seed_visual_board' or full_name like '[TESTE UI]%');
```

## 5. Regra
**Cleanup somente sob autorização explícita.** Não remover automaticamente: os dados ainda servem para
validar o board/detalhe/atividades enquanto o PR está em Draft.
