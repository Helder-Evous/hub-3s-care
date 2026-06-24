---
documento: 04_JORNADA_DO_CLIENTE_E_ONBOARDING
versao: 1.0
data: 2026-06-22
classificacao: L1 — Operacional
---

# Jornada do Cliente e Onboarding

## 1. Jornada padrão

1. **Venda fechada**
2. **Cadastro mestre**
3. **Produto(s) contratado(s)**
4. **Coleta de dados**
5. **Contrato**
6. **Financeiro inicial**
7. **Onboarding por produto**
8. **Implantação**
9. **Operação ativa**
10. **Renovação ou cancelamento**

O Hub começa, por enquanto, da venda fechada. Um CRM comercial próprio poderá alimentar o Hub no futuro com dados de leads e negociação.

## 2. Automação desejada

Após a venda, a IA deve:
- criar/atualizar o cadastro da clínica;
- identificar produtos contratados;
- coletar dados faltantes em canal autorizado;
- preparar contrato e enviar para aprovação/assinatura conforme regra;
- criar dados financeiros iniciais, cobranças e lembretes quando houver integração;
- abrir onboarding correto;
- atribuir responsáveis, prazos e SLA;
- monitorar atraso, dependência e exceção;
- registrar tudo em eventos e tarefas.

## 3. Aprovação humana inicial

Exigem aprovação humana na fase inicial:
- envio final de contrato;
- alteração de preço/condição comercial;
- emissão de cobrança ou nota fiscal;
- cancelamento/suspensão;
- campanha externa de alto impacto;
- ação que use dados sensíveis ou gere compromisso relevante.

## 4. Onboarding CRM

Etapas de referência:
1. coletar base e dados da clínica;
2. criar/configurar ambiente e acessos;
3. cadastrar canais/chips/números;
4. configurar templates;
5. configurar campanhas/rotinas;
6. definir scripts, agenda e responsáveis;
7. treinar;
8. ativar operação;
9. acompanhar estabilidade e resultado inicial.

## 5. Onboarding Tráfego Pago

1. coletar acesso Meta/Business Manager;
2. coletar Facebook/Instagram e ativos;
3. configurar pixel/eventos quando aplicável;
4. criar estratégia, criativos e campanhas;
5. aprovar;
6. publicar e acompanhar.

### Tráfego com agendamento
Inclui também: agenda, scripts, operador, qualificação, handoff e rotina de agendamento.

## 6. Onboarding Mídias Sociais

1. coletar identidade, ativos e acessos;
2. definir calendário e objetivos;
3. criar/padronizar conteúdo;
4. obter aprovações necessárias;
5. publicar/executar;
6. medir entrega e alcance.

## 7. Onboarding Gestão/Consultoria

1. diagnóstico;
2. coleta de dados e acessos;
3. indicadores iniciais;
4. reunião de alinhamento;
5. plano de ação;
6. calendário de acompanhamento;
7. relatórios e melhoria contínua.

## 8. Onboarding Projeto Escola

1. definir cidade/objetivo;
2. mapear escolas;
3. preparar equipe e materiais;
4. agendar visitas;
5. executar captação;
6. tratar contatos/agendamentos;
7. medir conversão e resultado.

## 9. Eventos mínimos

- cliente_criado
- venda_registrada
- produto_contratado
- onboarding_criado
- etapa_onboarding_iniciada
- etapa_onboarding_concluida
- onboarding_concluido
- contrato_enviado
- contrato_assinado
- cobranca_criada
- pagamento_confirmado
- operacao_ativada
- cancelamento_registrado
