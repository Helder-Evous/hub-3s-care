---
documento: 06_ARQUITETURA_AI_FIRST
versao: 1.0
data: 2026-06-22
classificacao: L0 — Fundacional
---

# Arquitetura AI-first do Hub 3S

## 1. Modelo mental

A IA é a inteligência. O Hub é a memória, os olhos, as mãos, o histórico e o painel de controle.

Fluxo:

`dados e ações → system_events → ai_tasks → agente/decisão → aprovação quando necessária → execução → auditoria → aprendizado`

## 2. Camadas

### Constituição
Valores, limites, estilo de decisão e princípios da 3S. Muda pouco.

### Conhecimento operacional
Produtos, pessoas, processos, SLA, scripts, preços autorizados e responsáveis. Muda com frequência controlada.

### Eventos
Registro de fatos: venda, onboarding, falha de canal, atraso, assinatura, pagamento etc.

### Tarefas de IA
Próximo trabalho a executar, priorizado por impacto e urgência.

### Aprovação humana
Ponto de controle para decisões sensíveis, externas, financeiras, legais ou irreversíveis.

### Execuções
Registro do que o agente fez, entrada, saída, custo, tempo, erro e resultado.

### Feedback e memória organizacional
Registra o que foi aprovado, rejeitado, corrigido e aprendido.

## 3. Componentes atuais

- `system_events`: sistema nervoso.
- `ai_tasks`: fila priorizada de ações.
- tarefas com impacto, urgência, próxima ação e exigência de humano.
- painel de Eventos do Sistema.
- painel de Tarefas de IA.

## 4. Próximos componentes

1. `knowledge_base`
2. `ai_approvals`
3. `ai_executions`
4. `decision_feedback`
5. `organizational_memory`
6. `command_inbox`
7. `conversations` e `conversation_messages`
8. integrações WhatsApp/Telegram/Kommo/Meta/financeiro
9. IA Supervisor
10. agentes especializados.

## 5. Agentes futuros

- Agente de Onboarding
- Agente Financeiro
- Agente Comercial
- Agente CRM/WhatsApp
- Agente de Mídias/Campanhas
- Agente de Qualidade Operacional
- IA Supervisor Central

Todos usam a mesma Constituição, leem apenas a informação necessária e registram eventos/tarefas/auditoria.

## 6. Autonomia progressiva

Fase 1: sugerir e pedir aprovação.  
Fase 2: executar rotinas reversíveis e monitoradas.  
Fase 3: executar padrões autorizados com auditoria e amostragem humana.  
Fase 4: propor melhoria de regra baseada em evidência; promoção somente com aprovação.

## 7. Pipeline de Governança do Conhecimento

A Knowledge Base oficial não é alimentada manualmente nem escrita diretamente pela IA. O fluxo aprovado é:

`mudança real → system_events → processamento confiável → classificação → knowledge_change_proposals → ai_tasks/revisar_conhecimento → aprovação → Pull Request → sincronização da Knowledge Base`

Definições:

- `ai_tasks` permanece como **fila única de trabalho**. A revisão de conhecimento entra nessa fila como tarefa do tipo `revisar_conhecimento`.
- `knowledge_change_proposals` guarda **propostas e evidências**, não é uma fila concorrente de trabalho.
- A IA **não promove automaticamente** uma proposta para conhecimento oficial. A promoção exige aprovação humana (Helder ou Jefferson) e Pull Request.
- A IA nunca escreve diretamente na Knowledge Base oficial nem na `main`.
- `organizational_memory` e `decision_feedback` serão construídos posteriormente; até lá, decisões aprovadas são registradas manualmente em `11_ORGANIZATIONAL_MEMORY.md` via PR.
