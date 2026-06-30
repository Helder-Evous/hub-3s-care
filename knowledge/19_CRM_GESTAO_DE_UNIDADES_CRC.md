---
title: "Controle de Lead — Gestão de Unidades CRC (alocação CRC × unidade)"
doc_id: "19_CRM_GESTAO_DE_UNIDADES_CRC"
version: 0.1-draft
date: 2026-06-30
status: Proposta de domínio — aguardando aprovação; implementação não autorizada
classification: Interno — Engenharia / Domínio
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 18_CRM_ROADMAP.md
---

# Controle de Lead — Gestão de Unidades CRC

## 1. Objetivo

Permitir, dentro do módulo operacional, distribuir **unidades (clínicas)** para **CRCs**,
com vigência e histórico auditável. A alocação pode mudar ao longo do dia/semana.

## 2. Regra principal (domínio)

- Um CRC pode ser responsável por **uma ou mais** unidades.
- Uma unidade pode ter **um ou mais** CRCs.
- **O CRC só vê e interage com leads das unidades em que está alocado ATUALMENTE.**
- Ao perder a alocação de uma unidade, o CRC **perde acesso aos leads ativos** dela — mas
  **as ações históricas dele permanecem atribuídas a ele** (auditoria preservada).

## 3. Quem gerencia

Tela/conceito futuro **"Gestão de Unidades CRC"**, disponível somente para:
`Gestor CRC`, `Gestor 3S`, `Super Admin`. **CRC comum não movimenta** unidade entre pessoas.

A tela deve permitir: ver unidades; ver CRCs vinculados; adicionar/remover CRC da unidade;
registrar **vigência**; **preservar histórico**; evitar perda de auditoria.

## 4. Estado atual do schema (FATO)

`crm.user_units` existe com: `id, user_id, clinic_id, active (bool), created_at`.

**Gaps confirmados:**
- **Sem vigência temporal** (`valid_from`/`valid_to`): a alocação é só um booleano `active`.
- **Sem histórico de alocação**: desativar/remover uma linha **perde** o registro de que o
  CRC já foi responsável por aquela unidade em um período.
- O acesso atual (`crm.user_has_clinic_access`) usa a linha vigente; não há trilha temporal.

## 5. Proposta (requer migration futura — NÃO autorizada aqui)

Opção recomendada: tornar `crm.user_units` **append-only com vigência** ou criar
`crm.user_unit_allocations (user_id, clinic_id, valid_from, valid_until null, created_by,
created_at)`, e derivar o acesso atual de `valid_until is null`. Isso:
- preserva histórico (premiação/auditoria sabem quem respondia pela unidade em cada data);
- mantém a regra "só vê leads das unidades atuais" via filtro de vigência;
- mantém ações históricas atribuídas ao autor (já garantido por `owner_id`,
  `lead_stage_history.changed_by`, `lead_activities.performed_by`).

## 6. Impacto e dependências

- **Premiação e relatórios por CRC** dependem de saber a alocação **na data do fato**.
- Relaciona-se com `ADR-0004` (dono do comparecimento): o crédito é do criador do
  appointment, mas a leitura por unidade/período exige vigência.

## 7. Não autorizado nesta fase
Sem migration, sem RLS nova, sem tela. Apenas documentação e proposta.
