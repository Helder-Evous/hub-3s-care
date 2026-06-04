# PROJECT_CONTEXT.md — Hub 3S

> Este arquivo é a memória permanente do projeto Hub 3S.
> Deve ser lido antes de qualquer decisão técnica ou arquitetural.
> Deve ser atualizado sempre que houver mudança relevante na visão, escopo ou tecnologia do projeto.

---

## 1. Visão Geral

### O que é a 3S

A 3S é uma empresa de soluções empresariais voltada principalmente para clínicas odontológicas. Atua em múltiplas frentes: CRM e comunicação via WhatsApp, tráfego pago, gestão e consultoria, e captação de pacientes via ações em escolas. O modelo de negócio une tecnologia, operação e inteligência para aumentar a produção das clínicas atendidas.

### O que é o Hub 3S

O Hub 3S é a plataforma central da empresa — um sistema único, modular e escalável que funciona como a espinha dorsal operacional da 3S. Não é uma coleção de sistemas separados. É um único ambiente onde todos os produtos, setores e integrações da empresa se conectam.

O Hub 3S deve ser pensado como o **sistema operacional da 3S**: o lugar onde a equipe trabalha, onde os dados se concentram, onde as automações rodam e onde a liderança enxerga a operação em tempo real.

### Qual problema o sistema resolve

Hoje a 3S opera com dados e processos fragmentados entre planilhas, plataformas externas e controles manuais. Isso gera:

- Falta de visibilidade operacional em tempo real
- Dificuldade de escalar sem aumentar equipe proporcionalmente
- Retrabalho por falta de centralização das informações
- Dependência excessiva de pessoas para tarefas que poderiam ser automatizadas
- Impossibilidade de tomar decisões rápidas com dados confiáveis

O Hub 3S resolve isso criando um centro único de acesso, controle e inteligência para todos os produtos e setores da empresa.

---

## 2. Visão de Longo Prazo

### Hub 3S como sistema operacional da empresa

O objetivo final é que o Hub 3S substitua planilhas, controles avulsos e processos manuais por um ambiente integrado onde:

- Toda operação do CRM é monitorada e gerenciada
- Campanhas de WhatsApp são disparadas, acompanhadas e otimizadas
- Resultados por clínica são visíveis em tempo real
- Leads de tráfego pago são rastreados do clique ao agendamento
- O comercial da 3S tem CRM próprio para vender para novas clínicas
- O financeiro da empresa é controlado com clareza
- Relatórios executivos são gerados automaticamente

### Centralização de todos os produtos e setores

O Hub terá módulos para cada produto e setor da 3S:

| Módulo | Tipo | Status |
|--------|------|--------|
| Produto CRM | Produto externo | Em desenvolvimento |
| Tráfego Pago | Produto externo | Futuro |
| Gestão / Consultoria | Produto externo | Futuro |
| Projeto Escola | Produto externo | Futuro |
| Comercial 3S | Interno | Futuro |
| Financeiro 3S | Interno | Futuro |
| RH 3S | Interno | Futuro |
| Marketing 3S | Interno | Futuro |
| IA Central | Transversal | Futuro |

### Integração futura com IA, APIs e automações

O Hub 3S deve ser construído desde o início com mentalidade **IA First**. Integrações planejadas:

- **Meta API** — monitoramento de qualidade de números, templates e volume de mensagens
- **Kommo** — CRM externo para rastreamento de leads de tráfego pago
- **Google Sheets** — importação de dados legados e relatórios externos
- **GitHub** — versionamento e deploy automatizado
- **Agentes de IA** — automação de análise, alertas inteligentes, sugestões operacionais
- **Supabase Realtime** — atualização ao vivo de painéis operacionais
- **Webhooks** — integração com plataformas de disparo WhatsApp

---

## 3. Produtos da 3S

---

### 3.1 Produto CRM

**Descrição**

O Produto CRM usa uma plataforma de disparo e atendimento via WhatsApp para trabalhar a base de pacientes das clínicas odontológicas. A 3S executa campanhas ativas e também atende os retornos dos pacientes, com o objetivo de gerar agendamentos reais nas clínicas.

**Objetivo principal**

Manter a agenda das clínicas cheia, reativando pacientes inativos, confirmando consultas, remarcando faltosos e executando campanhas segmentadas usando a própria base de dados da clínica.

**Principais entregas do Produto CRM**

- Confirmação de agenda (redução de faltas)
- Remarcação de faltosos
- Campanha de aniversariantes
- Reativação de pacientes não efetivados
- Campanhas de retorno (pacientes que somem após tratamento)
- Outras campanhas segmentadas por perfil de paciente
- Atendimento dos retornos gerados pelos disparos
- Agendamentos entregues diretamente para as clínicas

**Estrutura interna do Produto CRM (três pilares)**

#### Pilar 1 — Chips / Canais ← PRIORIDADE ATUAL

A entrega do CRM depende inteiramente da estabilidade dos canais de WhatsApp. Sem canal funcionando, não há disparo. Sem disparo, não há resultado. Por isso este é o primeiro pilar a ser construído.

O pilar Chips / Canais é um centro de controle operacional para monitorar e gerenciar:

- Chips e números de WhatsApp de cada clínica
- API Oficial Meta (número principal de disparo)
- WhatsApp Comum (atendimento e contingência)
- Números e APIs reserva
- Aparelhos físicos vinculados aos números
- Status em tempo real de cada canal (ativo, em atenção, crítico, bloqueado, desconectado)
- Qualidade do número na Meta (alto, médio, baixo)
- Restrições e banimentos
- Score de contingência por clínica (capacidade de operar mesmo com falhas)
- Score de comunicabilidade (probabilidade real de conseguir enviar mensagens)
- Templates Meta (aprovação, categoria, volume, custo)
- Volume da API Oficial (enviados, entregues, lidos, recebidos, custo)
- Alertas operacionais com severidade e fluxo de resolução
- Modo TV para telão de sala de operações

**Telas já existentes no pilar Chips / Canais:**
- Dashboard executivo
- Lista de clínicas com scores
- Detalhe por clínica (canais, contingência, alertas, templates, volume)
- Inventário de canais
- Monitoramento de templates Meta
- Volume API Oficial
- Matriz de contingência
- Central de alertas
- Modo TV (fullscreen para operações)

#### Pilar 2 — Disparos e Campanhas ← próxima fase

Gestão completa das campanhas de WhatsApp:

- Calendário de disparos
- Criação e agendamento de campanhas
- Segmentação por tipo de campanha e perfil de paciente
- Acompanhamento em tempo real de cada disparo
- Histórico de campanhas por clínica
- Integração com a plataforma de disparo via API

#### Pilar 3 — Resultados

Visão de performance do CRM por clínica:

- Agendamentos gerados por campanha
- Taxa de conversão (disparado → agendado)
- Receita estimada gerada pelo CRM
- Comparativo entre clínicas
- Relatórios para apresentação ao cliente
- Integração com Kommo para rastreamento de leads

---

### 3.2 Produto Tráfego Pago

**Descrição**

A 3S vende serviços de tráfego pago para clínicas odontológicas, gerenciando anúncios em plataformas como Meta Ads e Google Ads.

**Modalidades**

- **Tráfego puro:** a 3S faz a gestão dos anúncios, mas a clínica recebe e atende os leads por conta própria.
- **Tráfego com agendamento:** a 3S faz os anúncios, atende os leads via WhatsApp e entrega o paciente já agendado na agenda da clínica.

**Escopo futuro do módulo**

- Painel de campanhas ativas por clínica
- Métricas de anúncios (alcance, cliques, custo por lead)
- Rastreamento do lead da captura ao agendamento
- Integração com Kommo e Meta API

---

### 3.3 Produto Gestão / Consultoria

**Descrição**

A 3S presta serviços de gestão e consultoria para clínicas odontológicas, incluindo clínicas da própria rede e clínicas externas. O trabalho envolve diagnóstico operacional, reestruturação de processos, definição de metas e acompanhamento de resultados.

**Escopo futuro do módulo**

- Acompanhamento de indicadores por clínica consultada
- Registros de reuniões e entregas de consultoria
- Planos de ação com status de execução

---

### 3.4 Projeto Escola

**Descrição**

Projeto de captação de pacientes em que representantes da 3S vão até escolas nas cidades, realizam ações comerciais e captam alunos para tratamento ortodôntico nas clínicas parceiras.

**Escopo futuro do módulo**

- Controle de visitas por escola e cidade
- Leads captados por representante
- Taxa de conversão escola → clínica
- Metas e performance por representante

---

### 3.5 Comercial 3S (módulo interno)

**Descrição**

Módulo voltado para o crescimento da própria 3S. A empresa quer estruturar um setor comercial forte para vender seus produtos e serviços para novas clínicas odontológicas.

**Escopo futuro do módulo**

- Pipeline de vendas (prospecção → proposta → fechamento)
- Controle de clínicas prospectadas
- Histórico de contatos e negociações
- Metas comerciais e performance da equipe de vendas

---

### 3.6 Financeiro 3S (módulo interno)

**Descrição**

Módulo para controle financeiro interno da própria empresa 3S.

**Escopo futuro do módulo**

- Receitas por produto e por clínica
- Custos operacionais (plataformas, chips, equipe)
- Margem por produto
- Fluxo de caixa
- Relatórios financeiros para liderança

---

## 4. Roadmap

### Fase 1 — Produto CRM > Chips / Canais (em andamento)

**Objetivo:** construir o centro de controle operacional de canais WhatsApp, que é a base de toda a entrega do CRM.

- [x] Estrutura inicial do projeto (Lovable + TanStack Start + Supabase)
- [x] Schema do banco (clinics, channels, channel_monitoring, contingency_items, alerts, audit_logs)
- [x] Telas com dados mock (dashboard, clínicas, canais, templates, volume, contingência, alertas, TV)
- [x] Lógica de scores (contingência e comunicabilidade)
- [ ] Reorganização arquitetural (`src/features/crm-chips/`)
- [ ] Tabelas faltando no banco (meta_templates, api_volume_snapshots)
- [ ] Índices de performance no banco
- [ ] Autenticação (Supabase Auth)
- [ ] Migração mock → dados reais do Supabase
- [ ] Mutations (resolver alerta, atualizar status de canal, editar contingência)
- [ ] CRUD básico de clínicas e canais
- [ ] Modo TV com Supabase Realtime

**Critério de conclusão:** sistema em produção com dados reais, equipe da 3S usando no dia a dia para monitorar os canais de todas as clínicas.

---

### Fase 2 — Produto CRM > Disparos e Campanhas

**Objetivo:** construir o segundo pilar do CRM com gestão completa das campanhas de WhatsApp.

- [ ] Modelagem do banco (campaigns, campaign_messages, campaign_results)
- [ ] Criação de `src/features/crm-disparos/`
- [ ] Telas: calendário de campanhas, criação, acompanhamento, histórico
- [ ] Integração com plataforma de disparo via API
- [ ] Alertas de campanha integrados ao sistema de alertas do Chips/Canais

**Pré-requisito:** Fase 1 concluída e em produção.

---

### Fase 3 — Produto CRM > Resultados

**Objetivo:** fechar o ciclo do CRM com visão de performance e resultados por clínica.

- [ ] Modelagem do banco (appointments_generated, conversions)
- [ ] Criação de `src/features/crm-resultados/`
- [ ] Dashboard de resultados por clínica
- [ ] Integração com Kommo para rastreamento de leads
- [ ] Relatórios exportáveis para apresentação ao cliente

**Pré-requisito:** Fase 2 concluída.

---

### Fase 4 — Demais módulos

Cada módulo segue o mesmo padrão de desenvolvimento:

1. Definir escopo e modelagem do banco
2. Criar `src/features/<modulo>/`
3. Criar rotas em `src/routes/<modulo>/`
4. Implementar queries, mutations e componentes
5. Integrar com APIs externas conforme necessário

Ordem de prioridade a definir com a liderança da 3S, mas sugestão inicial:

1. Comercial 3S (impacto direto no crescimento da empresa)
2. Tráfego Pago (produto ativo com dados dispersos)
3. Projeto Escola (operação específica com métricas próprias)
4. Gestão / Consultoria (apoio a clínicas)
5. Financeiro 3S (controle interno)

---

## 5. Tecnologias Utilizadas

| Tecnologia | Papel no projeto |
|-----------|-----------------|
| **Lovable** | Plataforma de desenvolvimento assistido por IA. Gera o scaffold inicial, mantém o projeto e acelera a criação de componentes e telas. |
| **TanStack Start** | Meta-framework full-stack com SSR, baseado em React. Define a estrutura do projeto, o sistema de rotas e as server functions. |
| **TanStack Router** | Roteamento file-based com type-safety total. Cada arquivo em `src/routes/` vira uma rota automaticamente. |
| **TanStack Query** | Gerenciamento de estado server-side. Cache, deduplicação, background sync e sincronização com o Supabase. |
| **React 19** | Biblioteca de UI. Versão mais recente com melhorias de performance e renderização. |
| **TypeScript** | Linguagem principal. Strict mode ativado. Tipos gerados automaticamente a partir do schema do Supabase. |
| **Tailwind CSS v4** | Estilização utilitária. Design system baseado em `tone` (success, warning, critical, primary, muted). |
| **Radix UI + shadcn/ui** | Componentes acessíveis e sem estilo próprio. Base do design system do Hub. |
| **Supabase** | Backend completo: banco PostgreSQL, autenticação, Row Level Security, Realtime, Storage. Fonte de verdade de todos os dados. |
| **Nitro** | Servidor SSR. Target Cloudflare Workers. Gerencia server functions e middleware de autenticação. |
| **Vite** | Build tool. Configurado via preset Lovable com suporte a TanStack, Tailwind e paths. |
| **Bun** | Package manager e runtime. Mais rápido que npm para instalar dependências. |
| **GitHub** | Versionamento do código. Integração com Claude Code para desenvolvimento assistido. |
| **Claude Code** | Agente de IA para desenvolvimento. Lê este arquivo como contexto permanente antes de qualquer tarefa. |

---

## 6. Princípios Arquiteturais

### Modularidade

Cada produto ou setor da 3S é um módulo independente dentro do Hub. Um módulo tem:
- Seus próprios tipos de domínio (`features/<modulo>/types.ts`)
- Suas próprias queries e mutations (`features/<modulo>/queries.ts`, `mutations.ts`)
- Seus próprios componentes (`features/<modulo>/components/`)
- Suas próprias rotas (`routes/<modulo>/`)
- Suas próprias tabelas no banco (com migrations versionadas)

Módulos não se importam entre si diretamente. Quando precisam compartilhar dados, usam a camada `shared/` ou uma API intermediária.

### Escalabilidade

O sistema deve crescer sem reescritas. Cada nova feature é adicionada, não substituída. Isso significa:

- Migrations sempre aditivas (nunca drop sem planejamento)
- Novos módulos adicionam pastas, não alteram as existentes
- Componentes shared são genéricos o suficiente para servir qualquer módulo
- A home do Hub é extensível: adicionar um novo módulo é adicionar um card

### Integrações futuras

O sistema deve ser construído esperando integrar com serviços externos. Boas práticas:

- Lógica de integração sempre em `features/<modulo>/` ou `integrations/`, nunca inline em componentes
- Variáveis de ambiente para todas as credenciais externas
- Server functions para qualquer chamada que exija chave secreta
- Tipos bem definidos para dados vindos de APIs externas

### IA First

O Hub 3S deve reduzir a dependência de trabalho manual repetitivo. Isso significa projetar o sistema esperando que agentes de IA vão:

- Ler dados do Supabase e gerar alertas automáticos
- Sugerir ações baseadas em padrões operacionais
- Executar tarefas rotineiras (checagens, relatórios, notificações)
- Integrar com o Claude API para análise de dados em linguagem natural

Cada feature deve ter dados estruturados o suficiente para que uma IA consiga interpretá-los sem contexto humano adicional.

### Baixa dependência operacional humana

O sistema deve funcionar de forma crescentemente autônoma. Checagens manuais devem virar automações. Alertas devem ser gerados pelo sistema, não percebidos pela equipe. Relatórios devem ser gerados automaticamente, não montados manualmente.

### Banco de dados centralizado

Um único Supabase para todo o Hub 3S. Módulos diferentes usam tabelas diferentes, mas o banco é o mesmo. Isso permite:

- Cruzar dados entre módulos quando necessário (ex: clínica do CRM é a mesma do Tráfego Pago)
- Auditoria centralizada em `audit_logs`
- Um único ponto de verdade para todas as integrações
- Relatórios consolidados sem ETL complexo

---

## 7. Regras Importantes

### Não criar retrabalho

Antes de implementar qualquer coisa, verifique se já existe algo que resolve o problema. Componentes shared devem ser reutilizados. Funções de cálculo devem ser centralizadas. Tipos de domínio não devem ser duplicados.

### Não misturar módulos

Cada módulo é responsável por seu próprio domínio. O módulo CRM não deve conter lógica de Tráfego Pago. O módulo Escola não deve depender do módulo Financeiro. Dependências entre módulos são um sinal de modelagem incorreta.

### Priorizar o Produto CRM

Todo desenvolvimento deve partir do Produto CRM enquanto ele não estiver completo e em produção. Novas ideias para outros módulos são registradas aqui mas não implementadas antes do CRM estar sólido.

### Sempre considerar a evolução futura

Nenhuma decisão técnica deve criar uma parede para o futuro. Ao modelar banco, criar componentes ou definir estruturas, sempre perguntar: *"isso vai funcionar quando tivermos 10 módulos, 100 clínicas e integrações com 5 APIs externas?"*

### Dados reais antes de novas features

Não construir o Pilar 2 (Disparos) enquanto o Pilar 1 (Chips/Canais) ainda opera com dados mock. A prioridade é sempre levar o que existe ao estado real e funcional antes de expandir.

### Este arquivo é lei

Qualquer agente de IA, desenvolvedor ou ferramenta que trabalhe neste projeto deve ler este arquivo antes de tomar qualquer decisão. Se houver conflito entre uma instrução pontual e o que está aqui, este arquivo prevalece — a menos que seja explicitamente indicado que a visão do projeto mudou, caso em que este arquivo deve ser atualizado primeiro.

---

## 8. Histórico de Decisões Técnicas Relevantes

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-05 | Stack: TanStack Start + Supabase + Tailwind | Escalabilidade, SSR nativo, tipagem end-to-end, Lovable-compatible |
| 2026-05 | File-based routing com TanStack Router | Módulos viram pastas, sem configuração manual de rotas |
| 2026-05 | Mock-data-first para MVP | Permite construir e validar UI antes da infra do banco estar completa |
| 2026-05 | RLS pública para MVP | Acesso interno apenas, sem clientes externos acessando o sistema ainda |
| 2026-06 | Proposta de `src/features/<modulo>/` | Isola domínios, facilita migração mock → Supabase sem tocar nas rotas |

---

*Última atualização: 2026-06-04*
*Versão do projeto: 0.1 — MVP Chips/Canais*
