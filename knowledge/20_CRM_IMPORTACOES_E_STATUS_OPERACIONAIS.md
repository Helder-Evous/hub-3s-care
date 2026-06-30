---
title: "Controle de Lead — Importações e Status Operacionais"
doc_id: "20_CRM_IMPORTACOES_E_STATUS_OPERACIONAIS"
version: 0.1-draft
date: 2026-06-30
status: Proposta de domínio — aguardando aprovação; implementação não autorizada
classification: Interno — Engenharia / Domínio
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - ADR-0002_KANBAN_COMO_PROJECAO_OPERACIONAL.md
  - ADR-0003_KANBAN_COMO_MESA_OPERACIONAL_DO_CRC.md
---

# Controle de Lead — Importações e Status Operacionais

## 1. Objetivo

Definir dois tipos de importação que alimentam o módulo. Modelos de planilha serão
fornecidos depois. **Nada implementado nesta fase.**

## 2. Importação de Leads (cria/atualiza leads)

Deve identificar/derivar: **unidade**, **nome**, **telefone**, **origem**, **campanha**,
**responsável (se houver)**, com **deduplicação** por telefone normalizado dentro da clínica
(reaproveita a lógica de `crm.fn_normalize_patient` / dedup do S2-2A).

**Gaps (FATO):** hoje existe **origem** (`crm.lead_sources`) mas **não existe campanha** nem
**responsável por linha de importação** padronizado; a dedup de paciente existe, a de lead não.

## 3. Importação de Agenda / Relatório (atualiza fatos operacionais)

Pode trazer: `agendado`, `compareceu`, `faltou`, `cancelou`, `remarcou`, **`efetivou`**,
**receita gerada**. Esses status são **fatos** que movem o Kanban por **projeção operacional**
(ADR-0002/0003) — a importação **não** escreve `current_stage`; ela cria/atualiza
`crm.appointments` (e, no futuro, entidades de efetivação/receita), e a derivação ocorre por trigger.

**Gaps (FATO):**
- **Efetivação e receita não têm entidade** no schema atual (`appointments` não guarda
  receita; não há tabela de efetivação/tratamento). `efetivado` existe só como valor de enum
  em `lead_stage`, sem fonte de verdade (ver ADR-0003).
- **`appointments` não tem `created_by`** (ADR-0004): importações de agenda atribuiriam
  comparecimento sem dono — definir regra de atribuição para fatos importados.
- **Idempotência:** `appointments.codefy_id` e `external_ref` existem como seams para
  conciliação idempotente; importações devem usá-los para não duplicar.

## 4. Princípios

- Importação alimenta **fatos**, nunca o estágio diretamente.
- Toda importação deve ser **idempotente** (chave de conciliação) e **escopada por unidade/RLS**.
- Origem e campanha são **dimensões obrigatórias** dos fatos para os indicadores (doc 13 §origem/campanha).

## 5. Não autorizado nesta fase
Sem parser, sem endpoint, sem migration. Apenas documentação e mapeamento de impacto.
