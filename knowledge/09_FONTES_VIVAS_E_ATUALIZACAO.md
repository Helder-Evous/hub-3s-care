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
- Decisões: registrar no mesmo dia em que forem tomadas.
