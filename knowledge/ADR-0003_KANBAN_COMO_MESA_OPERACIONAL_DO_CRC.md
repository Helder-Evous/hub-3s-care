---
title: "ADR-0003: Kanban como Mesa Operacional do CRC (Efetivou fora das colunas)"
doc_id: "ADR-0003_KANBAN_COMO_MESA_OPERACIONAL_DO_CRC"
version: 1.0.0
date: 2026-06-30
status: Aceito (decisão de negócio) — pendente de implementação
classification: Interno — Engenharia / Decisão de Arquitetura (ADR)
module: Controle de Lead
schema: crm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 14_CONTROLE_DE_LEAD_FRONTEND.md
  - ADR-0002_KANBAN_COMO_PROJECAO_OPERACIONAL.md
supersedes_partial: ADR-0002 (ajusta o conjunto de colunas)
---

# ADR-0003 — Kanban como Mesa Operacional do CRC

## Contexto

O ADR-0002 estabeleceu o Kanban como **projeção operacional**. A regra de negócio agora
é refinada: o Kanban representa a **mesa de trabalho do CRC**, não o estágio comercial do
lead. O trabalho operacional da 3S termina no **comparecimento** do paciente à clínica. A
**efetivação** (tratamento fechado, receita gerada) é confirmação **posterior** da clínica
— **indicador de valor**, não fila operacional do CRC.

## Problema

O board implementado no S2-0 (PR #9) expõe **`Efetivou`** como coluna do Kanban
(`OPERATIONAL_COLUMN_ORDER = [novo, agendado, remarcar, compareceu, efetivado, perdido]`).
Isso contradiz a operação: `Efetivou` não é uma ação que o CRC executa na mesa — é um
resultado informado depois pela clínica/relatório/importação.

## Decisão

**Colunas operacionais oficiais do Kanban (mesa do CRC):**

```
Novo Lead → Agendado → Remarcar → Compareceu → Perdido
```

- **`Efetivou` deixa de ser coluna.** Efetivação passa a ser **indicador/badge/resultado**
  (taxa de efetivação, receita gerada), exibida no detalhe e nos dashboards, **não** no board.
- **Compareceu é o encerramento operacional da 3S.** `Compareceu` **não** implica `Efetivou`.
- A projeção continua dirigida por fatos (lead, appointments, lost_at, e futuramente
  importações/relatórios/integrações/IA), **somente leitura**, sem escrever estado no banco.

### Regra de projeção (atualizada)
| Prioridade | Condição | Coluna |
|---:|---|---|
| 1 | `lost_at` preenchido | Perdido |
| 2 | agendamento futuro ativo (`agendado/confirmado/remarcado`, `scheduled_at >= now`) | Agendado |
| 3 | agenda vencida sem desfecho **ou** `faltou`/`cancelado` sem novo futuro | Remarcar |
| 4 | comparecimento (`compareceu`) sem novo agendamento futuro | Compareceu |
| 5 | nenhuma condição anterior | Novo Lead |

> `cancelado` → **Remarcar** (decisão de negócio confirmada nesta rodada; revoga a proposta
> anterior do S2-2B de separar `cancelado`). `efetivado` **não** participa mais da projeção
> de coluna.

### Tratamento de leads com `current_stage='efetivado'`
Como o enum `lead_stage` ainda contém `efetivado`, leads nesse estágio (ou que compareceram
e foram efetivados) devem ser projetados pela **última ação operacional real** — na prática,
**Compareceu** (o paciente esteve na clínica). A efetivação aparece como **badge/indicador**
no card/detalhe, não como coluna. Nenhum lead pode "sumir" do board por causa dessa mudança.

## Consequências

**Positivas**
- O board reflete exatamente o trabalho do CRC; remove ruído comercial.
- Efetivação vira métrica de valor (origem/campanha/receita), no lugar certo (dashboards).

**Negativas / ajustes necessários (frontend, sem migration)**
- Editar `OPERATIONAL_COLUMN_ORDER`/`LABELS`/`TONE` (remover `efetivado`).
- Ajustar `resolveLeadOperationalState`: remover o ramo `efetivado` e garantir que leads
  efetivados caiam em **Compareceu** (não sumam).
- Exibir efetivação como **badge/indicador** (detalhe e, futuramente, dashboards).

## Alternativas consideradas
1. **Manter `Efetivou` como coluna** — rejeitada: contradiz a operação da 3S.
2. **Esconder `Efetivou` só visualmente, mantendo o ramo na projeção** — rejeitada:
   leads efetivados ficariam sem coluna (risco de sumirem do board).
3. **Remover `efetivado` do enum** — rejeitada agora: exige migration + canonicalização
   (governança separada); o enum pode permanecer, só não orienta o board.

## Riscos
- **Leads `efetivado` sumirem do board** se a projeção não os realocar para Compareceu (Médio).
- **Inconsistência temporária** entre o código atual do PR #9 (com `Efetivou`) e esta decisão
  até a implementação (Alto até corrigir).

## Status
**Aceito como decisão de negócio.** Implementação **não autorizada** nesta tarefa (só
documentação/auditoria). A correção do board é o primeiro incremento recomendado, antes do S2-2B.
