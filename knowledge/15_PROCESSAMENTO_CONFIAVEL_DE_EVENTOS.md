---
documento: 15_PROCESSAMENTO_CONFIAVEL_DE_EVENTOS
versao: 0.1-draft
data: 2026-06-24
classificacao: L1 — Operacional/Técnico
proprietario: Helder e Jefferson
status: Proposta — aguardando aprovação
implementacao: não autorizada
---

# Processamento Confiável de Eventos e Tarefas

> Documento de auditoria e proposta. Nenhuma implementação de banco, migration, Edge Function, worker, cron, trigger, RLS ou código está autorizada por este documento. Ele descreve o estado atual real, os riscos e uma proposta mínima para decisão de Helder ou Jefferson.

## 1. Problema

Um fato importante pode ocorrer no Hub (uma venda, um onboarding, um pagamento), mas o evento ou a tarefa correspondente pode **falhar silenciosamente, não ser processado ou ser executado mais de uma vez**.

A auditoria confirmou que isso não é hipótese: hoje o Hub registra eventos, mas **nenhum componente os processa**, e a criação automática de tarefas a partir de eventos **não existe em execução** — está apenas escrita como código não utilizado.

### Evidências (fatos confirmados)

- **Eventos são criados no navegador, em modo fire-and-forget.** `recordSystemEvent` (`src/lib/events.ts:27`) faz `supabase.from("system_events").insert(...)` dentro de `try/catch` que apenas `console.warn`. Se a inserção falhar (rede, RLS, sessão expirada, aba fechada), o evento é **perdido para sempre**, sem retry e sem registro.
- **Não há atomicidade.** Em `src/features/clientes/mutations.ts` a venda, o `clinic_products` e o evento são chamadas sequenciais separadas no cliente, cada `recordSystemEvent` é disparado com `void` (linhas 64, 92, 117, 146, 176, 214, 241, 257). Uma falha entre passos deixa estado parcial: venda gravada sem evento, ou produto sem evento.
- **A conversão evento → tarefa não acontece.** `createAiTask` (`src/lib/ai-tasks.ts:117`) e o mapa `EVENT_TO_TASK_TYPES` (`src/lib/ai-tasks.ts:70`) **não têm nenhum call site** no repositório. São scaffolding morto.
- **Backlog de 100% no banco de produção.** `system_events`: 19 eventos, **todos `processed=false`** (0 processados), o mais antigo não processado de **2026-06-05**; 0 com `error_message`. `ai_tasks`: 5 tarefas, todas `pendente`. As 5 tarefas não vieram dos 19 eventos — confirmam que não há pipeline ligando os dois.
- **Não há processador em lugar nenhum.** Não existem triggers em `system_events`/`ai_tasks`, não há função no banco que as referencie, não há `supabase/functions/` (nenhuma Edge Function versionada), não há cron nem worker.

## 2. Estado atual

### Como eventos são criados
- Apenas no frontend, via `recordSystemEvent`, chamado somente no módulo Clientes (`src/features/clientes/mutations.ts`).
- Tipos de evento atuais (`src/lib/events.ts:3`): `cliente_criado`, `produto_contratado`, `venda_registrada`, `onboarding_criado`, `etapa_onboarding_iniciada`, `etapa_onboarding_concluida`, `onboarding_concluido`.
- Campo `source` default `"app"`.

### Como tarefas são criadas
- Helper `createAiTask` existe mas **nunca é chamado**. As tarefas hoje no banco foram inseridas por outro meio (provavelmente manual/Lovable/seed).
- A prioridade é calculada por `priority_score = impact_level × urgency_level` (`src/lib/ai-tasks.ts`), com regras determinísticas por `task_type`; `confidence_score` permanece `null` (correto: não inventar confiança sem IA real).

### Onde pode ocorrer falha
1. Insert do evento falha no cliente → evento perdido (só `console.warn`).
2. Aba/navegador fechado antes do `void` concluir → evento perdido.
3. Estado parcial entre a escrita de negócio e o evento (sem transação).
4. Eventos nunca viram tarefa (sem processador).
5. Um futuro processador ingênuo, sem idempotência/locking, pode gerar tarefa duplicada ou repetir ação externa.

### O que acontece quando falha
Hoje: nada. O erro é engolido. Não há fila de exceções, nem alerta, nem reprocessamento.

### Como o campo `processed` é usado
- `system_events.processed` (boolean, default `false`), `processed_at` (timestamptz) e `error_message` (text) **existem no schema de produção** e há índice parcial `idx_system_events_processed WHERE processed=false` (otimizado para um poller). **Nenhum código lê ou escreve esses campos** — o processador previsto nunca foi construído.
- RLS de `system_events` UPDATE está restrita a `service_role` (`system_events_update_service`), o que **antecipa** um processador backend — coerente, mas inexistente.

### O que depende do frontend
Toda a captura de eventos. Se o usuário não estiver com a aba aberta e a requisição não completar, o fato não é registrado.

### O que já existe no backend
Praticamente nada para processamento: sem Edge Functions, sem workers, sem cron, sem triggers. Apenas as tabelas e as policies.

## 3. Requisitos

- **Processamento no backend**, independente do navegador do usuário.
- **Idempotência**: o mesmo evento não pode gerar duas tarefas nem repetir ação externa.
- **Atomicidade**: registrar o fato de negócio e o evento de forma consistente (idealmente no mesmo backend/transação).
- **Locking**: dois processadores não podem pegar o mesmo evento ao mesmo tempo.
- **Retry com backoff** e **timeout** por tentativa.
- **Limite de tentativas** com **dead-letter** (fila/estado de exceção).
- **Observabilidade**: contagem de pendentes, idade do mais antigo, taxa de sucesso, retries, falhas.
- **Auditoria**: registro de tentativas, erros, tempo e resultado.
- **Ligação evento → tarefa → execução** (`event_id` ↔ `task_id` ↔ futura `ai_executions`).
- **Validação de resultado** das ações executadas.
- **Prevenção de loops** entre evento e tarefa.

## 4. Alternativas arquiteturais

| Alternativa | Simplicidade | Confiabilidade | Custo | Manutenção | Limitações | Aderência Supabase |
|---|---|---|---|---|---|---|
| **A. Função backend acionada diretamente** (server function chama o processamento na mesma requisição) | Alta | Média | Baixo | Baixa | Ainda depende da requisição original concluir; não cobre eventos órfãos | Boa (TanStack server functions) |
| **B. Outbox + trigger no banco** (evento gravado; trigger enfileira/cria tarefa) | Média | Alta | Baixo | Média | Lógica em PL/pgSQL é menos testável; risco de loop se mal desenhado | Excelente |
| **C. Edge Function agendada** (cron Supabase invoca processador periódico) | Média | Alta | Baixo–Médio | Média | Latência do intervalo; precisa de locking | Excelente |
| **D. Worker com polling** (serviço externo lê pendentes) | Baixa | Alta | Médio | Alta | Infra adicional para manter | Média |
| **E. Webhook/fila externa** (ex.: fila gerenciada) | Baixa | Muito alta | Médio–Alto | Alta | Complexidade e custo antecipados demais para o estágio atual | Média |

## 5. Proposta mínima recomendada

Menor modelo que resolve o problema sem complexidade antecipada: **B + C combinados** — *outbox confiável no banco* + *Edge Function agendada com locking*, mantendo `ai_tasks` como fila única.

1. **Garantir a gravação do evento no backend**, não no navegador: o evento deve ser escrito junto da operação de negócio (server function/transação), eliminando o fire-and-forget como caminho único.
2. **Processador idempotente agendado** (Edge Function via cron) que:
   - seleciona eventos pendentes com `FOR UPDATE SKIP LOCKED`;
   - cria tarefa(s) conforme `EVENT_TO_TASK_TYPES`;
   - marca o evento como processado;
   - em falha, agenda retry com backoff; após o limite, marca dead-letter.

### Estruturas a avaliar (não assumir que todas serão necessárias)

| Estrutura | Onde | Necessidade | Observação |
|---|---|---|---|
| status explícito de processamento | `system_events` | Provável | Substituir/estender o `processed` boolean por estado (ver §6) |
| `attempt_count` | `system_events` | Provável | Contagem de tentativas |
| `next_retry_at` | `system_events` | Provável | Backoff |
| `last_error` | `system_events` | Provável | Já existe `error_message`; reutilizar |
| `locked_at` / `locked_by` | `system_events` | Provável | Locking cooperativo (ou usar SKIP LOCKED) |
| `processed_at` | `system_events` | Já existe | Reutilizar |
| idempotency key | `system_events` e/ou `ai_tasks` | Provável | Ex.: unique(`event_id`,`task_type`) em `ai_tasks` |
| `event_id` (FK) | `ai_tasks` | **Recomendado** | Hoje só existe `source_event_type` (text), sem ligação real |
| `event_processing_attempts` (tabela) | nova | Opcional | Só se quisermos histórico granular de tentativas |
| dead-letter lógico | `system_events.status='failed_permanent'` | Provável | Evita tabela separada no início |
| `ai_executions` | nova (futuro) | Futuro | Registro de execução real das ações |

## 6. Estados e transições

Proposta (nomes finais devem considerar o schema já existente, que hoje usa o boolean `processed`):

```
pending → processing → processed
processing → retry_wait → processing        (falha temporária, dentro do limite)
processing → failed_permanent               (excedeu limite de tentativas)
```

- `pending`: evento gravado, ainda não processado (hoje = `processed=false`).
- `processing`: capturado por um processador (com lock).
- `processed`: tarefa(s) criada(s) e evento concluído (hoje = `processed=true` + `processed_at`).
- `retry_wait`: falhou, aguardando `next_retry_at`.
- `failed_permanent`: dead-letter; exige inspeção humana.

Migração de compatibilidade: o boolean `processed` atual mapeia para `pending`/`processed`; os demais estados exigem uma coluna de status. **Decisão necessária:** manter boolean + colunas auxiliares, ou introduzir um enum de status.

## 7. Integração com ai_tasks

- **Quando um evento cria tarefa:** segundo `EVENT_TO_TASK_TYPES` (ex.: `venda_registrada` → `gerar_contrato` + `preparar_cobranca`).
- **Evitar tarefa duplicada:** constraint de unicidade idempotente, ex.: `unique(event_id, task_type)` em `ai_tasks`; o processador faz `insert ... on conflict do nothing`.
- **Relacionar `event_id` e `task_id`:** adicionar `event_id uuid REFERENCES system_events(id)` em `ai_tasks` (hoje só há `source_event_type` textual).
- **Eventos que não geram tarefa:** vão direto de `processing` para `processed` (registro/auditoria sem ação).
- **Tipo futuro `revisar_conhecimento`:** mesmo pipeline — um evento de mudança gera tarefa `revisar_conhecimento` ligada ao Pipeline de Governança do Conhecimento (doc 09/06).
- **Conexão com `ai_executions` (futuro):** a execução de uma tarefa gera registro em `ai_executions`, fechando a cadeia `event_id → task_id → execution_id`.

## 8. Segurança e aprovações

- **Automático sem aprovação:** criação de tarefa, registro de evento, notificações internas, análises — ações reversíveis e internas.
- **Exige aprovação humana:** gerar contrato, preparar cobrança, qualquer ação financeira, jurídica, externa ou irreversível (coerente com `requires_human` e `ai_approvals`).
- **Ações externas:** sempre idempotentes, com evidência antes/depois e verificação de resultado (doc 14 §6).
- **Credenciais:** o processador usa `service_role` apenas no backend (a RLS já restringe UPDATE de `system_events` a `service_role`); nunca expor service role no frontend.
- **DEV antes do principal:** toda alteração deve ser validada no DEV antes do principal. **Bloqueio atual:** o DEV não tem as tabelas (ver §12).

## 9. Indicadores

- eventos pendentes; eventos processados;
- idade do evento pendente mais antigo;
- tempo médio de processamento;
- taxa de sucesso na primeira tentativa;
- número de retries; falhas permanentes (dead-letter);
- duplicidades evitadas (conflitos de idempotência);
- tarefas criadas por evento;
- eventos sem tratamento (sem mapeamento);
- exceções escaladas para humano.

## 10. Plano de implementação futuro (não autorizado)

1. Migration mínima: ligação `event_id` em `ai_tasks`, colunas de retry/status em `system_events`, constraint de idempotência.
2. Processador backend (Edge Function) idempotente com `SKIP LOCKED`.
3. Retry com backoff, timeout e limite + dead-letter.
4. Integração com `ai_tasks` via `on conflict do nothing`.
5. Painel de observabilidade (pendentes, idade, falhas).
6. Testes de falha (queda no meio, duplo processador, retry).
7. Validação no DEV.
8. Promoção para o principal com a mesma migration validada.

## 11. Critérios de aceite

- o mesmo evento não gera duas tarefas;
- falha temporária é reprocessada automaticamente;
- falha permanente fica visível (dead-letter);
- worker interrompido no meio não perde o evento (volta a `pending`/`retry_wait`);
- dois processadores não executam o mesmo evento (lock/`SKIP LOCKED`);
- evento processado deixa evidência (`processed_at`, tarefa ligada);
- ação externa não é repetida indevidamente (idempotência);
- DEV e principal permanecem alinhados (mesma migration).

## 12. Riscos, dúvidas e decisões pendentes

### Fatos confirmados
- Eventos são fire-and-forget no navegador; falhas são silenciosas (`src/lib/events.ts`).
- Não há conversão evento→tarefa em execução (`createAiTask`/`EVENT_TO_TASK_TYPES` sem call site).
- 19 eventos em produção, 100% não processados desde 2026-06-05; 5 tarefas, todas `pendente`.
- Nenhum trigger/função/Edge Function/cron/worker processa as tabelas.
- `system_events` já tem `processed`/`processed_at`/`error_message` e índice parcial, mas nada os usa.
- `ai_tasks` liga-se a evento apenas por `source_event_type` (texto), sem `event_id`.
- **Drift de migrations:** a migration `create_system_events` (aplicada no PROD em 20260605143042) **não está no repositório**; a suíte CRM `crm_001..011` (aplicada no PROD em 2026-06-23) também não está no repo; os números das migrations de `ai_tasks` divergem (repo `20260619000001/2` vs aplicado `20260619204324/204335`).
- **Ambiente DEV vazio:** `xcqfdnymadeqeuacqotu` tem apenas a tabela `clinics` no schema `public`; **não possui `system_events` nem `ai_tasks`**, nem as migrations base. O CRM passou por DEV; a fundação de eventos/tarefas não.
- Advisors de segurança: RLS permissiva (`USING/ WITH CHECK true`) em `ai_tasks_insert/update` e `system_events_insert`.

### Hipóteses
- As 5 tarefas atuais foram criadas manualmente ou via Lovable (não confirmado).
- O drift de migrations decorre de o Lovable aplicar mudanças direto no PROD sem versionar no repo (provável, não confirmado).

### Propostas (sujeitas a aprovação)
- Mover a criação de evento para o backend e adotar outbox + processador agendado idempotente.
- Adicionar `event_id` em `ai_tasks` + idempotência por `unique(event_id, task_type)`.
- Introduzir estados de processamento e retry/backoff/dead-letter.

### Decisões necessárias de Helder ou Jefferson
1. Estados de `system_events`: manter boolean `processed` + colunas auxiliares, ou migrar para enum de status?
2. Arquitetura do processador: Edge Function agendada (recomendado) vs trigger/outbox vs server function?
3. Reconciliar o drift: trazer para o repo as migrations aplicadas (`create_system_events`, CRM, ai_tasks com versão real) antes de qualquer nova migration?
4. Reconstruir o DEV como espelho real do PROD (aplicar todas as migrations) antes de validar a fundação de eventos?
5. Endurecer a RLS permissiva de `ai_tasks`/`system_events` apontada pelos advisors?

### Não autorizado nesta tarefa
Qualquer implementação de banco, migration, Edge Function, worker, cron, trigger, RLS, frontend, backend ou integração. Este documento é apenas auditoria e proposta.
