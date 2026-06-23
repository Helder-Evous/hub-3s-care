---
documento: 05_REGRAS_DE_DECISAO_E_APROVACOES
versao: 1.0
data: 2026-06-22
classificacao: L1 — Operacional
---

# Regras de Decisão, Priorização e Aprovação

## 1. Modelo de prioridade

A 3S não deve tentar estimar valor financeiro exato para cada tarefa. A priorização padrão combina:

- **Impacto (1–5):** efeito sobre operação, cliente, produtividade, receita ou continuidade.
- **Urgência (1–5):** tempo disponível antes de dano, atraso ou perda de oportunidade.
- **Priority score:** impacto × urgência.
- **Confiança:** só deve ser preenchida por IA quando houver análise real; regras fixas podem usar `null` ou “regra determinística”.

## 2. Interpretação

| Impacto | Significado |
|---:|---|
| 1 | Informativo |
| 2 | Organização |
| 3 | Produtividade |
| 4 | Cliente afetado |
| 5 | Receita ou operação em risco |

| Urgência | Significado |
|---:|---|
| 1 | Pode esperar |
| 2 | Baixa |
| 3 | Moderada |
| 4 | Alta |
| 5 | Crítica |

## 3. Faixas

- 20–25: crítica.
- 12–19: alta.
- 6–11: média.
- 1–5: baixa.

## 4. Regras iniciais de tarefas

| Tipo de tarefa | Impacto | Urgência | Exige humano | Próxima ação |
|---|---:|---:|---|---|
| coletar_dados_cliente | 3 | 3 | Não | Coletar dados faltantes |
| gerar_contrato | 5 | 4 | Sim | Gerar minuta e enviar para aprovação |
| preparar_cobranca | 5 | 5 | Sim | Preparar cobrança para aprovação |
| notificar_responsavel | 3 | 2 | Não | Notificar responsável interno |
| alertar_atraso_onboarding | 4 | 4 | Não | Escalar atraso ao responsável |
| analisar_evento | 2 | 2 | Não | Sugerir próximos passos |
| criar_campanha | 4 | 3 | Sim | Gerar campanha e aguardar aprovação |

## 5. Escalonamento

- Falha de canal crítico/banimento: abrir tarefa crítica e escalar para Jefferson/Celiane.
- SLA de onboarding vencido: alertar responsável; se persistir, escalar para Jefferson; se risco de cliente, levar a Helder.
- Exceção comercial ou preço: Irã + Helder.
- Assunto financeiro/contratual: responsável financeiro + aprovação conforme alçada.
- Dados pessoais/paciente: restringir acesso e escalar para responsável autorizado.

## 6. Aprendizado com feedback

Aprovações, rejeições, edições humanas e resultados devem criar registros em `decision_feedback`/`organizational_memory`. Repetição não deve virar regra automática sem revisão: a IA pode sugerir uma nova regra; liderança aprova sua promoção para política.
