---
documento: 09_FONTES_VIVAS_E_ATUALIZACAO
versao: 1.0
data: 2026-06-22
classificacao: L1 — Operacional
---

# Fontes Vivas e Atualização sem Burocracia

## 1. Separação necessária

A 3S não deve tentar atualizar manualmente todo número em documentos.

### Documentos guardam
- princípios;
- processo;
- responsabilidades;
- política;
- modelo de decisão;
- definição de produto;
- fatos estratégicos.

### Sistemas vivos guardam
- clientes ativos;
- preços vigentes;
- contratos;
- pagamentos;
- membros ativos;
- tarefas;
- eventos;
- indicadores;
- capacidade operacional;
- campanhas;
- SLA.

## 2. Autoridade por tema

| Tema | Fonte viva desejada |
|---|---|
| Clientes, produtos, onboarding | Supabase / Hub |
| Eventos e tarefas | Supabase / Hub |
| Preços vigentes | catálogo comercial/financeiro no Hub |
| Cobrança, nota, pagamentos | Conta Azul ou financeiro integrado |
| Pessoas, cargo e disponibilidade | cadastro mestre de pessoas |
| Remuneração individual | área restrita de RH/financeiro |
| Código e migrations | GitHub |
| Decisões estratégicas | organizational memory + aprovação |
| Processos e políticas | `/knowledge` |

## 3. Ciclo de aprendizado

1. Evento acontece.
2. IA/humano executa.
3. Resultado é registrado.
4. Aprovação, rejeição ou correção gera feedback.
5. IA identifica padrão.
6. IA propõe melhoria.
7. Responsável aprova ou rejeita.
8. Regra aprovada atualiza processo/knowledge base.

## 4. Revisões

- Constituição/cultura: trimestral.
- Produtos e processos: sempre que mudar entrega/SLA.
- Pessoas e responsáveis: mensal ou em mudança de equipe.
- Preço/custos: financeiro define periodicidade; agente nunca presume documento como preço final.
- Decisões: registrar no mesmo dia em que forem tomadas, sempre via proposta + aprovação + Pull Request (ver seção 6).

## 5. Três naturezas de informação

| Natureza | O que é | Onde vive | Quem altera |
|---|---|---|---|
| **Dado operacional vivo** | clientes, preços vigentes, contratos, tarefas, eventos, indicadores | Supabase / Hub | sistema e operação, conforme alçada |
| **Política oficial** | princípios, processos, regras de decisão, definição de produto | `/knowledge` | só por Pull Request aprovado |
| **Memória histórica** | decisões datadas, contexto de mudanças | `11_ORGANIZATIONAL_MEMORY.md` (e futuras tabelas) | só por proposta aprovada |

Misturar as três é proibido: a IA não pode transformar um dado vivo ou uma conversa em política oficial sem passar pelo pipeline.

## 6. Pipeline de atualização da Knowledge Base

1. **Detecção automática:** uma mudança real gera `system_events`; o backend processa o evento de forma confiável.
2. **Classificação:** a informação é classificada (dado vivo, política ou memória).
3. **Geração de proposta:** quando indicar mudança de política/memória, a IA cria uma entrada em `knowledge_change_proposals` com evidências, e abre `ai_tasks/revisar_conhecimento`.
4. **Aprovação humana:** Helder ou Jefferson revisam, editam, aprovam ou rejeitam.
5. **Atualização oficial:** somente após aprovação, a mudança vira Pull Request na branch e atualiza a Knowledge Base.
6. **Sincronização:** documentos aprovados ficam disponíveis para consulta da IA.

**Proibição:** a IA nunca escreve diretamente na Knowledge Base oficial nem na `main`. Toda alteração passa por proposta, aprovação e Pull Request. Ver `06_ARQUITETURA_AI_FIRST.md` §7.
