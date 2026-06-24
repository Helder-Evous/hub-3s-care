---
documento: 14_MODELO_OPERACIONAL_AGENTICO_E_AUTOMACAO
versao: 1.0
data: 2026-06-24
classificacao: L0 — Fundacional
proprietario: Direção 3S
status: Decisão aprovada
revisao: diante de mudança estratégica ou de arquitetura
---

# Modelo Operacional Agêntico e Automação Ponta a Ponta

## 1. Decisão estratégica

O Hub 3S é a infraestrutura que permite à IA compreender, coordenar, executar, verificar e melhorar os processos da 3S com segurança e rastreabilidade.

A IA será a principal executora dos processos padronizáveis. Humanos permanecem responsáveis por estratégia, exceções, relações sensíveis, riscos, aprovações relevantes e decisões que não possam ser tratadas com segurança por uma regra autorizada.

Helder e Jefferson trabalham em frentes diferentes do mesmo sistema. Os módulos não devem apenas registrar informações ou exibir telas; devem ser preparados para permitir execução automática ponta a ponta.

> "O Hub não é apenas um conjunto de telas. É a infraestrutura que permite à IA compreender, coordenar, executar, verificar e melhorar os processos da 3S com segurança e rastreabilidade."

## 2. Estado de destino

Agentes devem conseguir:

- captar dados por APIs, webhooks, integrações autorizadas e navegador controlado;
- interpretar eventos e contexto;
- criar e priorizar tarefas;
- executar ações em sistemas internos e externos;
- gerar documentos, comunicações, relatórios, alertas e análises;
- acompanhar prazos e dependências;
- verificar o resultado real da ação;
- registrar evidências, erros, custos, tempo e resultado;
- aprender com aprovações, rejeições, correções e resultados;
- propor melhorias de processo, produto, regra e conhecimento.

## 3. Fluxo de cliente de referência

`venda fechada → cadastro mestre → produtos contratados → contrato → assinatura → cobrança → confirmação do pagamento → onboarding por produto → coleta de dados e acessos → configuração → treinamento → ativação da operação → monitoramento → relatório → renovação ou cancelamento`

A IA deve executar o padrão, acompanhar respostas e prazos, confirmar conclusões e escalar exceções.

## 4. Arquitetura operacional

`dados e ações → system_events → processamento confiável → ai_tasks → orquestrador de processos → agente especializado → ferramentas e integrações → aprovação quando necessária → execução → verificação → auditoria → feedback → proposta de melhoria`

### Componentes necessários

| Componente | Papel |
|---|---|
| **Dados estruturados** | Entidades bem modeladas que a IA consiga interpretar sem contexto humano adicional |
| **Eventos** | `system_events`: registro de fatos relevantes que disparam trabalho |
| **Tarefas** | `ai_tasks`: fila única priorizada de próximas ações |
| **Orquestração de processos longos** | Gerencia sequências de passos, dependências, prazos e estado de execução |
| **Agentes especializados** | Executores de domínio (onboarding, financeiro, CRM, etc.) |
| **Ferramentas e integrações** | APIs, webhooks, integrações diretas e navegador controlado |
| **Aprovações** | `ai_approvals`: ponto de controle humano para ações sensíveis |
| **Execuções e auditoria** | `ai_executions`: registro de entrada, saída, custo, tempo, erro e resultado |
| **Feedback e conhecimento** | `decision_feedback`, `organizational_memory`, `knowledge_change_proposals` |

## 5. Agentes previstos

| Agente | Domínio |
|---|---|
| Agente Comercial | Prospecção, propostas, pipeline de vendas |
| Agente de Contratos | Minutas, assinaturas, condições, renovações |
| Agente Financeiro | Cobranças, confirmações, inadimplência, relatórios |
| Agente de Onboarding | Coleta de dados, acessos, configuração, treinamento, ativação |
| Agente CRM/WhatsApp | Campanhas, atendimento, agendamentos, disparos |
| Agente de Tráfego Pago | Campanhas, leads, rastreamento do clique ao agendamento |
| Agente de Mídias/Campanhas | Produção, calendário, execução, resultados |
| Agente de Qualidade Operacional | SLA, alertas, falhas, escalamentos |
| Agente de Conhecimento | Detecta mudanças, propõe atualizações da Knowledge Base |
| IA Supervisor Central | Distribui e acompanha trabalho entre agentes; não substitui regras de autorização |

A IA Supervisor distribui e acompanha trabalho, mas não autoriza a própria ação nem aprova decisões que exijam aprovação humana.

## 6. Ordem dos meios de execução

Sempre usar o meio mais direto e controlado disponível:

1. API oficial;
2. webhook;
3. integração direta autorizada;
4. automação controlada de navegador;
5. ação humana.

### Automação controlada de navegador

Deve ser o último recurso técnico antes de acionar o humano. Exige:

- credenciais protegidas (nunca em texto simples ou código);
- permissão mínima necessária;
- idempotência (reexecutar não causa efeito duplo);
- evidência antes e depois da execução;
- verificação do resultado real;
- número máximo de tentativas definido;
- tratamento de falha e registro de erro;
- escalonamento humano em caso de dúvida ou risco;
- respeito aos termos e autorizações do sistema acessado.

## 7. Aprendizado e melhoria contínua

A IA não deve alterar livremente as próprias regras. O ciclo de aprendizado é:

`execução → resultado → feedback → identificação de padrão → proposta → aprovação → atualização de regra/processo/Knowledge Base → nova execução monitorada`

Repetição não transforma automaticamente comportamento em política. A promoção de padrão observado para regra aprovada sempre exige aprovação humana.

## 8. Autonomia progressiva

| Nível | Descrição |
|---|---|
| 1 — Sugestão | A IA sugere; humano decide e executa |
| 2 — Preparação com aprovação | A IA prepara a ação completa; humano aprova e autoriza a execução |
| 3 — Execução reversível | A IA executa ações reversíveis e monitoradas; humano revisa resultado |
| 4 — Processo ponta a ponta | A IA conduz o fluxo completo, escalando exceções para humanos |
| 5 — Operação amplamente autônoma | Supervisão estratégica; humano define diretrizes e aprova mudanças de regra |

A meta da 3S é alcançar **Nível 4** na maior parte dos processos padronizáveis e **Nível 5** onde segurança, qualidade e evidência demonstrarem maturidade.

Uma sessão do Claude Code pode construir e manter o sistema, mas não deve ser o executor permanente da operação. A execução contínua deve viver em agentes, serviços, workers, filas e integrações controlados pelo Hub.

## 9. Requisitos para todo módulo agêntico

Além do padrão definido em `07_PADRAO_DE_MODULOS_DO_HUB.md`, todo módulo deve responder:

1. Qual trabalho manual ou gargalo será reduzido?
2. Qual evento inicia o fluxo?
3. Qual agente será responsável?
4. Quais ferramentas serão necessárias?
5. Quais dados serão lidos e gravados?
6. O que pode ser executado automaticamente?
7. O que exige aprovação?
8. Como evitar duplicidade (idempotência)?
9. Como confirmar o resultado real?
10. Qual evidência será armazenada?
11. Como retentar, compensar ou desfazer uma falha?
12. Quais indicadores medem automação e resultado?
13. Que feedback pode gerar proposta de melhoria?

## 10. Indicadores de automação

- percentual de etapas automatizadas por processo;
- intervenções humanas por execução;
- tempo total do ciclo (end-to-end);
- SLA cumprido vs. violado;
- sucesso na primeira execução;
- taxa de reprocessamento e de erro;
- exceções escaladas para humano;
- tempo humano economizado;
- custo por execução;
- resultado para a 3S e para o cliente;
- melhorias aprovadas a partir de feedback da IA.
