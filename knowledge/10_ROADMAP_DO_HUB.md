---
documento: 10_ROADMAP_DO_HUB
versao: 1.1
data: 2026-06-24
classificacao: L0 — Fundacional
---

# Roadmap do Hub 3S

## Concluído / em funcionamento

- autenticação;
- cadastro mestre de clientes;
- nova contratação;
- produtos contratados;
- onboarding por produto;
- avanço de etapas;
- `system_events`;
- painel de eventos;
- `ai_tasks`;
- priorização por impacto e urgência;
- painel de tarefas de IA;
- navegação Clientes / Operações / Gestão;
- módulo CRM com base de Chips e Canais;
- integração inicial Supabase/GitHub/Claude Code/Lovable.

## Próximo bloco: memória e governança do conhecimento

1. Consolidar `/knowledge`. — **concluído após merge deste PR**
2. Resolver e incorporar o conteúdo válido do `PROJECT_CONTEXT.md`. — **concluído após merge deste PR**
3. Tornar o processamento de `system_events` confiável no backend.
4. Criar `knowledge_change_proposals`.
5. Adicionar `revisar_conhecimento` em `ai_tasks`.
6. Criar tela de revisão, edição, aprovação e rejeição de propostas.
7. Gerar Pull Request após aprovação.
8. Sincronizar documentos aprovados para consulta da IA.
9. Posteriormente, criar `organizational_memory` e `decision_feedback`.

## Visão de destino

A 3S pretende operar de forma amplamente automatizada por agentes de IA, com execução ponta a ponta dos processos padronizáveis, escalando exceções para humanos.

Ver: `knowledge/14_MODELO_OPERACIONAL_AGENTICO_E_AUTOMACAO.md`

## Próximo bloco: inteligência e execução agêntica

1. `ai_approvals`.
2. `ai_executions`.
3. Orquestração de processos longos.
4. Catálogo de ferramentas, permissões e políticas.
5. IA Supervisor em modo sugestão.
6. Primeiro agente de onboarding.
7. Primeiro agente operacional CRM.
8. Integrações prioritárias (WhatsApp, Kommo, Meta).
9. Navegador controlado para sistemas sem API.
10. Autonomia progressiva por evidência.

## Próximo bloco: canais de comando e conversa

1. `command_inbox`.
2. Conversas unificadas.
3. WhatsApp/Telegram.
4. Integração comercial futura.
5. Integração financeira.
6. Integração Meta/Kommo/plataforma de atendimento.

## Próximo bloco: produtos operacionais

- CRM: Disparos, Campanhas e Resultados.
- CRM: agendamentos e módulo operacional do Jefferson.
- Tráfego Pago.
- Mídias Sociais.
- Gestão/Consultoria.
- Projeto Escola.
- Financeiro 3S.
- Comercial 3S.
