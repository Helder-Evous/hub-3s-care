---
documento: 19_INTEGRACAO_DO_CRM_OPERACIONAL_AO_HUB
versao: 0.1-draft
data: 2026-06-26
classificacao: L1 — Operacional/Técnico
proprietario: Helder e Jefferson
status: Proposta de integração — aguardando revisão
implementacao: não autorizada
---

# Integração do CRM Operacional ao Hub 3S

> **Esta tarefa é exclusivamente de entendimento, inventário e desenho.** Nada foi
> implementado: sem código, sem banco, sem migrations, sem RLS, sem rotas, sem
> integrações. Apenas consultas de leitura e este documento.

## 1. Resumo executivo
A 3S possui hoje **dois** sistemas relevantes para a operação de leads de clínicas:
- O **Hub 3S** (`Helder-Evous/hub-3s-care`), cujo módulo **Controle de Lead** está
  **implementado e validado na branch `feat/crm-controle-lead`** (Draft **PR #7**,
  ainda **aberto e não mesclado**). As estruturas do schema `crm` já existem nos
  ambientes (DEV/Principal), porém o **frontend e as migrations ainda NÃO fazem parte
  da `main`** — a integração futura depende da **revisão/resolução do PR #7**.

> **Estados (para evitar ambiguidade):** implementação **concluída na branch**;
> validação técnica **realizada**; integração na **`main` pendente**; publicação
> oficial **pendente**.
- O **Sistema de Gestão de Leads do Jefferson** (`sistema-leads-3s`), uma SPA
  HTML/JS standalone sobre Supabase, em uso para captação/agendamento das clínicas
  OralDents/IEB.

A proposta é **integrar progressivamente** o sistema do Jefferson ao Hub **sem
reescrever do zero e sem copiar e colar**, preservando telas, regras, dados,
histórico e a lógica de call center, e adotando o domínio e a arquitetura AI-first
do Hub. O Comercial B2B da 3S permanece **separado** da operação B2C das clínicas.

> **Atenção de escopo (localização):** o app que roda em `localhost:3000` na máquina
> é o **`3s-premiacao`** (sistema de **premiação/comissão**, Supabase próprio
> `saahzipiiptzvztgzdvg`), que **não** é o CRM/leads. O alvo desta integração,
> confirmado por Helder/Jefferson, é o **`sistema-leads-3s`** (gestão de leads).
> O `3s-premiacao` está **fora** deste blueprint.

## 2. Problema
- Dois tipos de "lead" hoje se confundem: **comercial B2B** (clínica que quer
  contratar a 3S) e **operacional B2C** (paciente que a 3S atende em nome da
  clínica). Eles **não podem** compartilhar funil/entidades/indicadores sem
  separação explícita.
- A operação B2C nasce de **produtos** diferentes (Tráfego Pago, CRM/Reativação) e
  precisa ser organizada por **clínica → produto → campanha**.
- O sistema do Jefferson resolve a operação de leads, mas em **stack e modelo
  próprios** (SPA standalone, auth própria, RLS permissiva, status único) — não dá
  para simplesmente "colar" no Hub.

## 3. Conceitos de negócio
- **Cliente (B2B):** clínica/empresa que contrata a 3S.
- **Clínica/Unidade:** onde a operação acontece (atendimento ao paciente).
- **Produto contratado:** Tráfego Pago, CRM/Reativação, etc.
- **Campanha operacional:** instância de um produto (ex.: campanha Meta de implante).
- **Lead/oportunidade B2C:** pessoa/paciente captado para uma clínica.
- **Atividade/conversa:** toques do call center (ligação, WhatsApp, etc.).
- **Agendamento e resultado:** consulta marcada e desfecho (compareceu, efetivou…).

## 4. Comercial 3S versus Central de Leads
| Dimensão | Comercial 3S (B2B) | Central de Leads (B2C) |
|---|---|---|
| Quem é o lead | Clínica/empresa | Pessoa/paciente |
| Pergunta | "A clínica vira cliente da 3S?" | "O paciente agenda e comparece?" |
| Jornada | lead→reunião→proposta→contrato→onboarding→cliente | lead→contato→agendado→compareceu→resultado |
| Dono | Módulo Comercial da 3S | Módulo operacional das clínicas |
| Resultado | Contrato/ativação de produtos | Agendamento/efetivação clínica |

**Princípio:** a clínica conquistada no Comercial vira **o mesmo cliente/clínica**
usado na Operação — sem duplicar cliente, clínica, unidade ou contato.

## 5. Produtos e campanhas
- A operação B2C é organizada por **clínica → produto contratado → campanha → lead**.
- **Tráfego Pago:** lead chega de Meta Ads (conta/campanha/anúncio/formulário/UTM);
  os metadados da integração determinam produto e campanha de forma **determinística**.
- **CRM/Reativação:** a clínica fornece base; a 3S dispara/reativa e conduz ao
  agendamento (origem = importação/disparo).
- O **ambiente principal já possui** `public.clinic_products`, `public.contracts` e
  `public.sales` — representando, em análise, **venda, contrato e produto ativo** da
  clínica. **Não** propor recriar `clinic_products` (nem equivalente) no `crm`.
- **Cadastro mestre e relação comercial (análise pendente):** avaliar o reaproveitamento
  de `public.sales` / `public.contracts` / `public.clinic_products`.
- **Operação de leads (análise pendente):** avaliar entidades específicas para
  **campanhas operacionais**, **vínculo do lead com o produto**, **anúncios/formulários**,
  **playbooks** e **metas/indicadores de campanha**. Uma entidade `campaigns` ainda pode
  ser necessária, mas deve **relacionar-se ao produto contratado já existente, sem
  duplicar o cadastro comercial**.
- **Antes de qualquer nova tabela:** exigir **auditoria** das colunas, relacionamentos
  e usos atuais de `public.sales` / `public.contracts` / `public.clinic_products`.
- O sistema do Jefferson tem `campanhas` (catálogo simples).

## 6. Inventário do sistema de Jefferson (`sistema-leads-3s`)
**Fonte analisada:** repositório git **bare** `C:\Users\jhefi\sistema-leads-3s.git`,
branch `main`, commit `d132c27` (estado de 17/06/2026 declarado como "produção").
⚠️ Por ser um **arquivo/bare**, pode estar **desatualizado** frente à cópia ativa —
ver Decisões Pendentes.

**Stack:** SPA **HTML+CSS+JS vanilla** (arquivo único `index.html`/`sistema_leads_v2.html`,
~1.205 linhas, **sem build step**); **SheetJS** (import `.xlsx`); **Supabase**
(PostgreSQL + PostgREST) como backend; Supabase **próprio** (separado do DEV/Principal do Hub).

**Autenticação:** **própria** — tabela `usuarios` com `senha_hash` e `perfil`
(`admin`/`operador`); sessão via navegador (localStorage). **Não usa Supabase Auth.**

**Segurança (RLS):** **permissiva** — todas as tabelas com policy `acesso_total`
(`using(true)`); sem escopo por unidade/perfil (o próprio schema referencia um plano
de hardening V2).

**Tabelas (5):**
| Tabela | Campos-chave | Observações |
|---|---|---|
| `unidades` | nome, ativo | "unidade" ≈ clínica |
| `campanhas` | nome, ativo | catálogo simples |
| `usuarios` | nome, email, senha_hash, perfil(admin/operador), ativo | auth própria |
| `leads` | nome, telefone, origem, campanha_id, unidade_id, data_lead, data_agenda, data_agendamento, **status**, usuario_id | status único (ver §10) |
| `historico_status` | lead_id, status_anterior, status_novo, usuario_id, observacao | log de mudança de status |

**`leads.status`** (campo único, default `Agendado`): `Agendado, Compareceu, Faltou,
Cancelou, Efetivou, Reagendado, Desistiu` — **mistura** estágio de funil, status de
agendamento e desfecho.

**Telas (SPA por "page-"):**
| Tela | Rota (view) | Função | Fonte de dados | Persiste? | Dependências |
|---|---|---|---|---|---|
| Login | (auth) | Login por email/senha | `usuarios` | sim | auth própria/localStorage |
| Dashboard | `page-dashboard` | KPIs de leads/status | `leads`/`historico_status` | leitura | Supabase |
| Leads | `page-leads` | Lista/Kanban por status | `leads` | sim | Supabase |
| Novo Lead | `page-novo-lead` | Cadastro de lead | `leads` | sim | unidades/campanhas |
| Campanhas | `page-campanhas` | CRUD de campanhas | `campanhas` | sim | — |
| Unidades | `page-unidades` | CRUD de unidades | `unidades` | sim | — |
| Usuários | `page-usuarios` | CRUD de usuários | `usuarios` | sim | auth própria |
| Importar | `page-importar` | Import `.xlsx` de leads | `leads` | sim | SheetJS |

**Docs do repo:** `docs/Documentacao_Tecnica_Sistema_3S.docx`, `Parte1_Fundacao_BancoDeDados`,
`Parte2_Fluxo_Kanban_Telas_Dashboards`, `Parte3_Seguranca_Migracao_Roadmap` (não
parseados aqui — formato .docx; títulos indicam fundação/kanban/telas/dashboards/segurança/roadmap).

## 7. Inventário do Hub (`hub-3s-care`)
> Diferenciando **visual / mock / conectado / persistente / validado**.

| Área | Estado |
|---|---|
| **Shell visual / menu** (`AppShell`: Clientes, Operações, Gestão) | conectado |
| **Autenticação** (Supabase Auth + `crm.user_profiles`, hook `use-auth`) | conectado/persistente |
| **Cadastro mestre de Clientes** / **Nova Contratação** / **Onboarding** | conectado (B2B; ver 04/10 da KB) — profundidade a auditar |
| **Controle de Lead** (schema `crm`): board, novo lead, detalhe, atividades, **marcar perdido** | **implementação concluída na branch `feat/crm-controle-lead`; validação técnica realizada** (RLS provada). Integração na `main` **pendente** e publicação oficial **pendente** — Draft PR #7, **não mesclado** |
| `crm` tabelas: patients, leads, lead_activities, appointments, budgets, lead_stage_history, lead_sources, user_profiles, user_units, module_clinics | persistente |
| Derivação de `current_stage` (trigger; app nunca escreve) | validado |
| **system_events / ai_tasks** (tabelas em `public`) | existem, **ainda não emitidos** pelo módulo (seam) |
| CRM Chips/Canais, dashboards, templates, volume, contingência, alertas, TV | majoritariamente **visual/mock** ("Em breve") |

**Papéis (Hub):** `super_admin_3s, gestor_3s, gestor_unidade, crc, cliente`.
**Multitenant:** por clínica via `user_units` + `module_clinics` (entitlement).

## 8. Sobreposições e conflitos
| Tema | Jefferson | Hub | Conflito / decisão |
|---|---|---|---|
| **Auth** | própria (`usuarios.senha_hash`) | Supabase Auth + `user_profiles` | **Migrar** usuários para Supabase Auth; mapear `admin/operador`→papéis do Hub |
| **Segurança** | RLS `acesso_total` (aberta) | RLS estrita por clínica/perfil | Reescrever acesso sob o modelo do Hub (não importar a RLS aberta) |
| **Unidade vs Clínica** | `unidades` (lista simples) | `public.clinics` + `user_units` | Mapear unidade→clínica; sem duplicar |
| **Estágio** | `status` único (misto) | `current_stage` **derivado** + `appointments.status` + desfecho | Separar 3 eixos (ver §10); nunca escrever `current_stage` |
| **Histórico** | `historico_status` | `lead_stage_history` + `lead_activities` | Mapear; histórico do Jefferson vira atividades/transições |
| **Campanhas/Produtos** | `campanhas` | inexistente em `crm` | Decisão: criar `products`/`campaigns` (futuro) |
| **Pessoa** | embutida em `leads` (nome/telefone) | `patients` separado de `leads` | Mapear: dedup por telefone (já existe no Hub) |
| **Stack/Tela** | SPA HTML/JS | React/TanStack + design system | Reaproveitar **regras/UX**, não o código HTML |
| **KB numeração** | — | docs 13–18 da branch `feat/crm-controle-lead` colidem com a KB oficial 13–17 do `main` | **Risco confirmado** — corrigir **dentro da própria PR #7 antes do merge**; **não** renumerar nem alterar a PR #7 nesta tarefa |

## 9. Modelo de domínio proposto
```
Cliente (B2B, contratante)
└── Clínica / Unidade
    └── Produto contratado (Tráfego Pago, CRM/Reativação…)
        └── Campanha operacional
            └── Lead / oportunidade (B2C)
                ├── Pessoa/Paciente (patients)
                ├── Atividades e conversas (lead_activities)
                ├── Agendamento (appointments)
                └── Resultado clínico (efetivação)
```
**Reuso / adaptação:**
- **Reutilizar:** `public.clinics`, `crm.patients`, `crm.leads`, `crm.lead_activities`,
  `crm.appointments`, `crm.lead_stage_history`, `crm.user_profiles/user_units/module_clinics`,
  derivação de estágio, dedup por telefone.
- **Adaptar:** mapeamento unidade→clínica e usuário→`user_profiles`; histórico do Jefferson.
- **Reuso comercial (avaliar, NÃO recriar):** `public.sales`, `public.contracts`,
  `public.clinic_products` já existem — podem representar venda, contrato e produto
  ativo da clínica. **Auditar antes** de qualquer nova tabela.
- **Operação de leads (decisão futura, fora desta tarefa):** possível `campaigns`
  **ligada ao produto contratado existente**, vínculo lead↔produto, anúncios/formulários,
  playbooks e metas/indicadores — **sem duplicar** o cadastro comercial.
- **Não criar tabelas nesta tarefa.**

## 10. Revisão dos estágios
**Kanban atual do Hub:** novo, agendado, compareceu, em_avaliacao, orcamento,
efetivado, **pos_venda**, perdido.

Registros desta tarefa (sem alterar nada):
- **`pos_venda` deve sair** do fluxo operacional proposto das clínicas.
- **Origem técnica:** `pos_venda` é valor do enum `crm.lead_stage` (migration 002) e
  rank 6 em `crm.lead_stage_rank`/`fn_recalc_lead_stage` (migration 010). Remover
  exigiria migration + ajuste da função — **não autorizado agora**. (Essas migrations
  são do módulo — hoje nos **ambientes** e na branch do PR #7, **não na `main`**.)
- **Verificar uso:** antes de qualquer remoção, checar se há linhas com
  `current_stage='pos_venda'` (consulta de leitura) — **não executada/decidida aqui**.

**Separação proposta em 3 eixos** (validar com Helder/Jefferson):
| Eixo | Exemplos | Onde no Hub |
|---|---|---|
| **Estágio operacional do lead** | novo, em contato, respondeu, interessado, agendado, encerrado | derivado/`current_stage` (revisar lista) |
| **Status do agendamento** | agendado, confirmado, remarcado, compareceu, faltou, cancelado | `crm.appointments.status` (enum já existe) |
| **Resultado clínico/comercial** | avaliação realizada, orçamento apresentado, tratamento fechado | `crm.budgets`/desfecho (futuro) |

**De→Para (Jefferson → Hub):**
`Agendado`→appointment `agendado` (+estágio agendado); `Compareceu`→appointment
`compareceu`; `Faltou`→`faltou`; `Cancelou`→`cancelado`; `Reagendado`→`remarcado`;
`Efetivou`→efetivação/desfecho; `Desistiu`→lead **perdido** (`lost_at`).
> **Não definir a lista final sem validação de Helder e Jefferson.**

## 11. Estratégia de integração (progressiva)
1. **Preservar** o sistema do Jefferson (tag/branch de segurança — ver §1 abaixo / Fase 1).
2. Criar **depois** uma branch a partir de `main` para a integração (não agora).
3. **Preservar o comportamento e o conhecimento operacional sem copiar o código
   standalone como código de produção**: mapear regras, fluxos operacionais, KPIs e a
   lógica de importação; usar as **telas atuais como referência de experiência**; e
   **reconstruir** a interface, no futuro, como **módulo nativo do Hub (React/TanStack)**
   reutilizando design system e componentes. **Não inserir** o HTML/JS standalone no
   Hub, nem temporariamente. (Reconstrução não autorizada agora.)
4. **Adaptar ao shell/navegação** do Hub (AppShell, design system).
5. **Mapear auth e tenant/clínica** (Supabase Auth + `user_units`).
6. **Camada de adaptação** entre modelos (unidade↔clínica, status↔3 eixos, usuário↔perfil).
7. Conectar ao **Supabase DEV** (`xcqfdnymadeqeuacqotu`).
8. **Testar** visual e funcionalmente no DEV.
9. **Migrar regras gradualmente** (estágio derivado, RLS estrita, eventos).
10. **Promover ao Principal** (`nndvcsdevbxpgsccyimm`) só após validação.

| Categoria | Itens |
|---|---|
| **Reaproveitar (conhecimento)** | regras de negócio, fluxos operacionais, KPIs, lógica de importação `.xlsx`, e as **telas atuais como referência de UX** — **sem copiar o código** |
| **Precisa de adaptador** | auth (própria→Supabase Auth), unidade→clínica, status→3 eixos, histórico→atividades/transições |
| **Reconstruir nativo** | interface **futura** como **módulo nativo do Hub (React/TanStack)**, reutilizando design system/componentes (não autorizado agora) |
| **Não trazer** | RLS `acesso_total`; login `usuarios.senha_hash`; sessão em localStorage; o `index.html`/SPA como código de produção (**nem temporariamente**) |
| **Riscos de conflito** | numeração de KB (13–18 vs oficial); duplicação de cliente/clínica; perda de histórico na migração |
| **Dependências** | Supabase Auth, design system do Hub, `clinics`/`user_units`, products/campaigns (futuro) |
| **Rollback** | manter o sistema do Jefferson intacto e operante até validação; promoção só DEV→Principal; nenhuma remoção até confirmação |

## 12. Uso do DEV
- Toda mudança de banco/backend/auth/integração é testada **primeiro no DEV**
  (`xcqfdnymadeqeuacqotu`); só **leitura** está autorizada nesta tarefa.
- **Não** consultar dados pessoais/de pacientes.
- Promoção ao **Principal** (`nndvcsdevbxpgsccyimm`) somente após validação e
  autorização explícita.

**Autorização:** durante a fase atual, **uma autorização explícita neste chat por
Helder ou Jefferson é suficiente** — **não** é necessária uma segunda autorização
separada, salvo quando o próprio usuário declarar que a decisão exige aprovação
conjunta. A **proteção técnica do CRM permanece obrigatória** (sem `service_role`,
sem escrever campos derivados, RLS estrita), mas **não** se exige duas identidades ou
duas confirmações para prosseguir.

## 13. Arquitetura AI-first
**Eventos de domínio (registrar, não criar):** `lead_received, contact_attempted,
lead_replied, lead_qualified, appointment_scheduled, appointment_confirmed,
appointment_rescheduled, patient_attended, patient_no_show, lead_lost`; e no B2B:
`sales_meeting_scheduled, proposal_sent, contract_signed, onboarding_started,
product_activated`.

**Tarefas de IA futuras (registrar, não criar):** priorização de leads, sugestão de
próxima mensagem, lembrete de follow-up, resumo de conversa, detecção de leads
esquecidos, análise de campanha, sugestão de reativação, identificação de exceções.

**Regra central — Kanbans operados prioritariamente pela IA:**
- **Classificação automática** ao receber o lead (domínio B2B/B2C, clínica, unidade,
  produto, campanha, origem, canal, anúncio/formulário, interesse, responsável,
  prioridade, SLA, próxima ação, etiquetas). **Ordem de decisão:** (1) regras/vínculos
  configurados; (2) metadados da integração; (3) dados de campanha/produto; (4) IA;
  (5) revisão humana em ambiguidade. **Não depender só da IA quando há dado determinístico.**
- **Roteamento automático** para módulo/Kanban/clínica/produto/campanha/playbook/fila/SLA,
  **sem criar cópias** do mesmo lead para visões diferentes.
- **Movimentação por eventos confirmados** (cada evento pode aplicar etiqueta, mudar
  estágio, ajustar prioridade, criar tarefa, notificar, iniciar SLA, ativar playbook,
  pedir validação humana).
- **Rastreabilidade obrigatória:** estágio anterior/novo, evento causador, motivo,
  regra usada, agente/automação, nível de confiança, data/hora, possibilidade de
  revisão. **A IA não move cartões silenciosamente.**
- **Níveis de autonomia:** alta confiança→executa; média→executa e sinaliza;
  baixa→não move e cria tarefa humana; impacto contratual/financeiro/jurídico→exige
  aprovação humana. O usuário pode **corrigir** classificação, **desfazer** movimento,
  **explicar** o erro e **alimentar** as regras.

**Comercial integrado à jornada completa:** o B2B não termina no fechamento —
lead→qualificação→reunião→proposta→negociação→contrato→onboarding→ativação de
produtos→operação→resultados→renovação/expansão. **Cliente único** entre Comercial e
Operação; contrato assinado gera eventos/tarefas de onboarding; produtos contratados
definem módulos/checklists/playbooks; histórico acessível no cadastro mestre.

**Arquitetura obrigatória:** `system_events → ai_tasks → knowledge_base → IA Supervisor
→ agentes/integrações`. O **Kanban é representação visual** do estado da jornada, não a
fonte da regra: o estágio é **consequência** de eventos/regras/dados.

> Nenhum evento, trigger, tabela ou agente é criado nesta tarefa — apenas requisitos.

## 14. Experiência do usuário
**Princípios:** design system único do Hub; interface limpa/profissional; navegação
simples; **filtros visíveis** (clínica, produto, campanha, operador, período); reduzir
rolagem horizontal; **destacar próxima ação**; responsividade; acessibilidade;
estados de carregamento/vazio/erro/sucesso; validações claras; linguagem não técnica;
formulários rápidos; consistência; **não** alterar regra por motivo visual.

**Avaliação do Kanban atual do Hub:** 8 colunas (novo…perdido) forçam **rolagem
horizontal**; cartões já têm boa leitura (nome, telefone, origem, responsável, contato).
**Melhorias propostas (sem implementar):** remover `pos_venda` do fluxo operacional;
agrupar/ocultar colunas vazias; filtros por clínica/produto/campanha; coluna "Perdido"
recolhível; visão compacta para telas menores; destaque de "próxima ação"/SLA.

## 15. Riscos
- **Auth divergente** (custom vs Supabase Auth) → migração de usuários e sessões.
- **RLS aberta** no sistema do Jefferson → não importar; reescrever sob RLS estrita.
- **Status único** → risco de perder semântica ao quebrar em 3 eixos (mapear com cuidado).
- **Duplicação** de cliente/clínica/unidade/contato entre Comercial e Operação.
- **Repo bare/arquivado** pode estar desatualizado vs cópia ativa do Jefferson.
- **Numeração de KB (risco confirmado):** os documentos **13–18 da PR #7** têm
  prefixos que **colidem** com documentos já existentes na KB oficial. Deve ser
  corrigido **dentro da própria PR #7 antes do merge**; **não** renumerar nesta tarefa
  e **não** alterar a PR #7 nesta execução.
- **Dados de produção/pacientes** (LGPD) — só leitura, sem PII nesta fase.
- **Reescrita acidental** ("copiar e colar" ou "reescrever tudo") — evitar ambos.

## 16. Decisões pendentes (Helder + Jefferson)
1. Confirmar a **cópia canônica/atual** do `sistema-leads-3s` (o bare aqui é arquivo;
   há working copy/branch ativa? qual commit é fonte de verdade?).
2. Esclarecer o **`localhost:3000`** (hoje é o `3s-premiacao`) — onde roda a versão
   ativa do leads?
3. **Lista final de estágios** (3 eixos) e remoção de `pos_venda`.
4. **Auditar** `public.sales`/`contracts`/`clinic_products` e decidir **reuso** vs novas
   entidades de operação (`campaigns` ligada ao produto, sem duplicar o comercial).
5. **Mapa de papéis** Jefferson (`admin/operador`) → Hub (`crc/gestor_unidade/...`).
6. Estratégia de **migração de dados** (leads/histórico) e de-para de unidades→clínicas.
7. **Numeração da KB** (renumerar os docs do Controle de Lead da PR #7).
8. Escopo do **Comercial B2B** integrado à jornada (quando entra).

## 17. Plano futuro por fases
- **F0 — Blueprint** (este documento) e validação por Helder/Jefferson.
- **F1 — Preservação** (tag/branch de segurança do sistema do Jefferson; inventário).
- **F2 — Camada de adaptação** (auth, unidade↔clínica, status↔3 eixos) no DEV.
- **F3 — Importação do módulo** ao shell do Hub (sem reescrever) + filtros por produto.
- **F4 — Migração de regras** (estágio derivado, RLS estrita, histórico→atividades).
- **F5 — Eventos** (`system_events`) e rastreabilidade.
- **F6 — AI-first** (classificação/roteamento/movimentação assistida; `ai_tasks`).
- **F7 — Comercial B2B** integrado à jornada do cliente.
- **F8 — Promoção ao Principal** após validação.

## 18. Critérios de aceite
- Nenhuma perda de telas, regras, dados, dashboards, histórico ou lógica de call
  center do sistema do Jefferson.
- **Autenticação/permissões — preservar o que importa, não o mecanismo.**
  **Preservar:** usuários relevantes, papéis operacionais, vínculos com unidades e
  clínicas, responsabilidades, histórico de autoria e necessidades reais de acesso.
  **Não preservar:** login por `usuarios.senha_hash`, sessão própria em localStorage,
  RLS `acesso_total`, acesso sem escopo por clínica ou perfil. A implementação futura
  **migra** usuários e papéis para **Supabase Auth + `crm.user_profiles` +
  `crm.user_units` + RLS estrita do Hub**.
- Cliente/clínica/unidade/contato **únicos** entre Comercial e Operação.
- Estágio **derivado** de eventos; app nunca escreve `current_stage`.
- RLS estrita por clínica/perfil; sem `acesso_total`.
- Funis B2B e B2C **separados**, com indicadores próprios e consolidados.
- Tudo validado no **DEV** antes do Principal.

## 19. Itens não autorizados (nesta tarefa)
Sem implementação de código, banco, migrations, RLS, autenticação, frontend, rotas
ou integrações. Sem criar eventos/triggers/tabelas/agentes. Sem remover `pos_venda`.
Sem migração de dados. Sem merge. Sem alterar o sistema do Jefferson. Apenas leitura
e este documento.
