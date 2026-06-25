---
documento: 18_DECISAO_DE_CANONICALIZACAO_DE_MIGRATIONS
versao: 0.1-draft
data: 2026-06-25
classificacao: L1 — Operacional/Técnico
proprietario: Helder e Jefferson
status: Proposta de decisão — aguardando aprovação
implementacao: não autorizada
---

# Decisão de Canonicalização de Migrations

> **Documento exclusivamente propositivo e analítico. Nenhuma implementação, migration,
> migration repair, alteração de banco, schema, dados, RLS, grants, autenticação,
> Edge Function, código ou integração está autorizada por este documento.**

> **Proposta — aguardando aprovação de Helder e Jefferson.**
> A recomendação técnica aqui formulada só pode ser implementada após autorização
> explícita de Helder ou Jefferson, e o tratamento dos arquivos CRM depende também
> de aprovação específica de Jefferson.

---

## 1. Objetivo

Fornecer a Helder e Jefferson a análise completa e a proposta decisória para a
canonicalização do histórico de migrations do Hub 3S (Etapa B), cobrindo:

1. qual histórico será canônico no GitHub;
2. como tratar versões divergentes entre GitHub, DEV e principal;
3. como alinhar futuramente os metadados do DEV sem reaplicar DDL;
4. como adicionar futuramente ao DEV somente as estruturas públicas realmente ausentes;
5. como garantir que o schema `crm` de Jefferson não seja alterado;
6. como validar que o fluxo futuro DEV → principal ficará seguro.

Este documento não executa nenhuma dessas ações.

---

## 2. Estado atual confirmado

Verificado em 2026-06-25, após o merge do PR #5 (Etapa A):

| Item | Fato confirmado |
|---|---|
| Migrations DEV (`xcqfdnymadeqeuacqotu`) | **12** — exclusivamente CRM (11) + scaffold DEV (1) |
| Migrations principal (`nndvcsdevbxpgsccyimm`) | **23** — fundação pública (12) + CRM (11) |
| Tabelas CRM no DEV | **10** — `appointments`, `budgets`, `lead_activities`, `lead_sources`, `lead_stage_history`, `leads`, `module_clinics`, `patients`, `user_profiles`, `user_units` |
| Tabelas CRM no principal | **10** — idem |
| Schema `public` DEV | Somente `clinics` (scaffold mínimo, sem enums, sem demais tabelas) |
| Schema `public` principal | 21 tabelas, 16 enums, 4 funções, 1 trigger |
| Arquivos em `supabase/migrations/` | **12** — os mesmos inventariados no doc 16, nenhuma mudança posterior à Etapa A |
| Históricos preservados em `knowledge/migration-history/` | **35** arquivos `.sql.txt`, inalterados |
| Nenhuma mudança após Etapa A | **Confirmado** — bancos, arquivos e históricos sem alteração posterior ao merge do PR #5 |

---

## 3. Problema a resolver

O repositório GitHub, o ambiente DEV e o ambiente principal possuem históricos
divergentes que impedem o uso seguro do fluxo `supabase db push` / CLI, a reconstrução
de ambiente limpo e o controle preciso do que está ou não aplicado:

1. **Drift de timestamps**: 8 migrations públicas têm o mesmo conteúdo lógico no
   GitHub e no principal, mas com timestamps diferentes. O Supabase CLI trata cada
   timestamp como identidade distinta — o que está registrado no principal não é
   reconhecido como equivalente ao arquivo do GitHub, e vice-versa.

2. **Migrations ausentes no GitHub**: `fix_rls_recursive_hub_users` (`20260604184531`)
   e `create_system_events` (`20260605143042`) existem somente no principal. Não há
   arquivo correspondente em `supabase/migrations/`.

3. **Migrations CRM ausentes no GitHub**: `crm_001..011` existem no DEV e no principal,
   com timestamps diferentes entre si, e nenhum arquivo está em `supabase/migrations/`.

4. **DEV sem estrutura pública**: o schema `public` do DEV contém apenas `clinics`
   com scaffold mínimo. Toda a fundação pública (tabelas, enums, funções, triggers,
   índices, policies) está ausente.

5. **Versões sem registro em `schema_migrations`**: `716bbe07` e `aab13a75` existem
   no GitHub e têm efeitos estruturais presentes no principal, mas não estão
   registradas em `supabase_migrations.schema_migrations` do principal. A origem
   exata ainda é hipótese (ver §10).

6. **Risco de duplicação**: os arquivos GitHub atuais (`000001..000005`, `200001`,
   `000001_create_ai_tasks`, `000002_evolve_ai_tasks_priority`) referem-se às
   mesmas alterações lógicas já registradas no principal com timestamps diferentes.
   Se coexistirem no diretório ativo, o Supabase CLI pode considerar as versões
   GitHub como pendentes e tentar reaplicar DDL já existente.

Sem a canonicalização, é impossível: (a) saber com certeza o que está aplicado em
cada ambiente, (b) aplicar novas migrations com confiança, (c) reconstruir um
ambiente limpo a partir do repositório.

---

## 4. Escopo e limites deste documento

**Incluído nesta análise:**
- Todas as 12 migrations do GitHub ativo (`supabase/migrations/`)
- Todas as 12 migrations registradas no DEV
- Todas as 23 migrations registradas no principal
- As 2 versões sem registro em `schema_migrations` (`716bbe07`, `aab13a75`)

**Explicitamente excluído:**
- Qualquer implementação, SQL, migration repair ou alteração de banco
- Dados de negócio (clientes, leads, agendamentos etc.)
- Código da aplicação, Edge Functions, integrações, RLS de dados

---

## 5. Ativos protegidos

### Schema `crm` — trabalho de Jefferson

**Fato confirmado:** 10 tabelas, 8 enums, 13 funções, 9 objetos de trigger
(12 linhas em `information_schema.triggers`), 25 políticas RLS, índices completos.
Estado estrutural equivalente entre DEV e principal.

**Qualquer proposta que toque o schema `crm` exige aprovação específica de Jefferson.**

### `public.clinics` — objeto compartilhado protegido

**Fato confirmado:** 8 tabelas do CRM possuem FK para `public.clinics(id)`:
`crm.appointments`, `crm.budgets`, `crm.lead_activities`, `crm.lead_sources`,
`crm.leads`, `crm.module_clinics`, `crm.patients`, `crm.user_units`.

Qualquer migration futura que toque `public.clinics` deve verificar e preservar
essas 8 FKs. Alterações de PK, tipo do `id` ou exclusão/recriação da tabela são
proibidas sem autorização explícita.

### Arquivos preservados em `knowledge/migration-history/`

Os 35 arquivos `.sql.txt` são registros históricos auditáveis. Não devem ser
alterados, movidos para `supabase/migrations/` ou promovidos como executáveis.

---

## 6. Matriz completa de migrations

### 6A. Fundação pública

| # | Alteração lógica | Arquivo GitHub ativo | Versão DEV | Versão principal | Hash DEV | Hash principal | Estado estrutural | Tratamento proposto (Alternativa 1) |
|---|---|---|---|---|---|---|---|---|
| P01 | Enums base + tabelas operacionais (`clinics`, `channels`, `alerts`, `audit_logs`, etc.) | `20260529143328_0c3bac65...sql` | — | `20260529143328` ✓ | — | `661788c4...` (33 stmts) | Presente no principal | Manter versão `20260529143328`; arquivar arquivo GitHub (mesma versão, sem conflito) |
| P02 | Revogação acesso anônimo (Lovable security agent) | `20260604133039_e7560ffe...sql` | — | `20260604133039` ✓ | — | `3d4a5567...` | Presente no principal | Manter versão `20260604133039`; arquivar arquivo GitHub (mesma versão, sem conflito) |
| P03 | Usuários e papéis do Hub (`hub_users`, `clinic_assignments`) | `20260604000001_add_hub_users.sql` | — | `20260604135414` ✓ | — | `9b4a0d1a...` | Presente no principal | Versão canônica: `20260604135414`; arquivar `000001` fora de `supabase/migrations/` |
| P04 | Extensão de tabelas + `fn_user_can_access_clinic` + RLS | `20260604000002_extend_existing_tables.sql` | — | `20260604135435` ✓ | — | `b9b9e73f...` | Presente no principal | Versão canônica: `20260604135435`; arquivar `000002` |
| P05 | Templates Meta e volume de API | `20260604000003_add_templates_and_volume.sql` | — | `20260604135449` ✓ | — | `73824374...` | Presente no principal | Versão canônica: `20260604135449`; arquivar `000003` |
| P06 | Índices de performance | `20260604000004_add_indexes.sql` | — | `20260604135500` ✓ | — | `8f042917...` | Presente no principal | Versão canônica: `20260604135500`; arquivar `000004` |
| P07 | View `vw_clinic_scores` | `20260604000005_add_clinic_scores_view.sql` | — | `20260604135513` ✓ | — | `3a032f94...` | Presente no principal | Versão canônica: `20260604135513`; arquivar `000005` |
| P08 | Expansão de `clinics` + `sales`, `clinic_products`, `onboardings`, `contracts`, `charges` (fundação) | `20260604200001_fase1_base_estrutural.sql` | — | `20260604171237` ✓ | — | `b6c13c30...` | Presente no principal | Versão canônica: `20260604171237`; arquivar `200001` |
| P09 | Fix RLS recursivo `hub_users` | — (ausente no GitHub) | — | `20260604184531` ✓ | — | `186a7fd0...` | Presente no principal | Criar arquivo GitHub a partir dos `statements` preservados em `knowledge/migration-history/principal/statements/`; versão canônica: `20260604184531` |
| P10 | Criação de `system_events` | — (ausente no GitHub) | — | `20260605143042` ✓ | — | `52177bb1...` | Presente no principal | Criar arquivo GitHub a partir dos `statements` preservados; versão canônica: `20260605143042` |
| P11 | Criação de `ai_tasks` + enums + RLS | `20260619000001_create_ai_tasks.sql` | — | `20260619204324` ✓ | — | `4ccb7d0c...` | Presente no principal | Versão canônica: `20260619204324`; arquivar `000001_create_ai_tasks` |
| P12 | Evolução de prioridade de `ai_tasks` (colunas de scoring) | `20260619000002_evolve_ai_tasks_priority.sql` | — | `20260619204335` ✓ | — | `c7f2c587...` | Presente no principal | Versão canônica: `20260619204335`; arquivar `000002_evolve_ai_tasks_priority` |

> **Observação sobre P01 e P02:** os arquivos GitHub têm o mesmo timestamp das versões
> do principal (`20260529143328` e `20260604133039`). Não há conflito de versão — o arquivo
> GitHub pode ser mantido ou arquivado com o mesmo resultado. A recomendação é manter o
> arquivo e confirmar que o hash do arquivo GitHub é idêntico ao `statements` do principal.
> Essa verificação é **Gate 3**, não Gate 2.

---

### 6B. Migrations CRM

Para cada migration CRM: o schema `crm` tem **estado estrutural equivalente** entre DEV e
principal (10 tabelas, objetos idênticos). A divergência é **apenas textual/histórica** nos
`statements` registrados — não é defeito funcional.

| Migration lógica | Versão DEV | Versão principal | Hash DEV | Hash principal | Conteúdo | Versão a usar (Alternativa 1) | Versão a usar (Alternativa 2) |
|---|---|---|---|---|---|---|---|
| `crm_001_schema_and_grants` | `20260623135758` | `20260623153559` | `13415113...` | `13415113...` | **Idêntico** (mesmo hash) | `20260623153559` (principal) | `20260623135758` (DEV) |
| `crm_002_enums_and_lead_sources` | `20260623135832` | `20260623153628` | `e9a1985d...` | `e9a1985d...` | **Idêntico** (mesmo hash) | `20260623153628` (principal) | `20260623135832` (DEV) |
| `crm_003_access_model` | `20260623135853` | `20260623153647` | `677879b7...` | `677879b7...` | **Idêntico** (mesmo hash) | `20260623153647` (principal) | `20260623135853` (DEV) |
| `crm_004_helpers_and_rls` | `20260623135919` | `20260623153710` | `db3d02cb...` | `e762158a...` | **Textualmente divergente** (hashes diferentes) | `20260623153710` (principal) | `20260623135919` (DEV) — exige reparo no principal |
| `crm_005_patients` | `20260623135941` | `20260623153731` | `9075b808...` | `01db3c05...` | **Textualmente divergente** | `20260623153731` (principal) | `20260623135941` (DEV) — exige reparo no principal |
| `crm_006_leads` | `20260623135959` | `20260623153751` | `a623eeb0...` | `f3a553a5...` | **Textualmente divergente** | `20260623153751` (principal) | `20260623135959` (DEV) — exige reparo no principal |
| `crm_007_lead_activities` | `20260623140017` | `20260623153809` | `e4032807...` | `5192b19d...` | **Textualmente divergente** | `20260623153809` (principal) | `20260623140017` (DEV) — exige reparo no principal |
| `crm_008_appointments` | `20260623140045` | `20260623153826` | `9918efd3...` | `66a52de7...` | **Textualmente divergente** | `20260623153826` (principal) | `20260623140045` (DEV) — exige reparo no principal |
| `crm_009_budgets` | `20260623140106` | `20260623153846` | `262847f3...` | `67485f2e...` | **Textualmente divergente** | `20260623153846` (principal) | `20260623140106` (DEV) — exige reparo no principal |
| `crm_010_stage_derivation` | `20260623140136` | `20260623153913` | `85e1decd...` | `0a63fb40...` | **Textualmente divergente** | `20260623153913` (principal) | `20260623140136` (DEV) — exige reparo no principal |
| `crm_011_api_grants` | `20260623192204` | `20260623201809` | `ab49e281...` | `ab49e281...` | **Idêntico** (mesmo hash) | `20260623201809` (principal) | `20260623192204` (DEV) |

> **Nota sobre divergência textual em `crm_004..010`:** a diferença de hash não implica
> diferença funcional. O estado estrutural final (tabelas, funções, triggers, policies)
> é equivalente entre os dois ambientes (confirmado no doc 16 §7). A divergência é
> histórica e deve ser preservada em `knowledge/migration-history/`, não "corrigida"
> automaticamente.

> **Alternativa 2 exigiria `migration repair` no principal** para substituir os
> `statements` das versões `20260623153710..153913` pelos do DEV. Isso toca metadados
> do ambiente em operação e é o principal motivo pelo qual a Alternativa 1 é
> tecnicamente preferível.

---

### 6C. Versões sem histórico registrado

#### `20260604185143_716bbe07` — análise detalhada

**Conteúdo do arquivo GitHub (`716bbe07`):**

O arquivo executa, com guards `IF NOT EXISTS`:
1. `ADD COLUMN IF NOT EXISTS` em `public.clinics`: `nome_fantasia`, `razao_social`,
   `cnpj`, `phone`, `email`, `address`
2. `CREATE TABLE IF NOT EXISTS public.sales` — versão simplificada, coluna `product`
   é `text` (sem enum)
3. `CREATE TABLE IF NOT EXISTS public.clinic_products` — versão simplificada
4. Políticas RLS iniciais permissivas (`USING (true)`) para `sales`

**Estado no principal:**
- Colunas `nome_fantasia`, `razao_social`, `cnpj`, `phone`, `email`, `address`
  existem em `public.clinics` ✓
- Tabela `public.sales` existe — com coluna `product` do tipo `public.product_type`
  (enum), não `text` ✓

**Versão `20260604171237` (`fase1_base_estrutural`) registrada no principal:**
- Timestamp `171237` é **anterior** ao timestamp de `716bbe07` (`185143`)
- Também adiciona com `IF NOT EXISTS`: `razao_social`, `nome_fantasia`, `cnpj`,
  `email`, `address` em `public.clinics`
- Cria `public.sales` com `product public.product_type NOT NULL` (enum)
- Cria `public.clinic_products`, `public.onboardings`, `public.contracts`,
  `public.charges` e demais tabelas da fundação

**Hipótese de origem (não confirmada):** `716bbe07` foi provavelmente aplicado via
SQL direto no Lovable sem passar pelo mecanismo de migrations do Supabase. Como
`fase1_base_estrutural` (versão `171237`) já havia sido registrada ANTES do timestamp
de `716bbe07`, todos os seus efeitos estavam presentes com guards `IF NOT EXISTS`.
O SQL de `716bbe07` teria executado sem efeito observável — colunas já existiam,
tabelas já existiam — e por isso não foi registrado em `schema_migrations`.

**Efeitos estruturais presentes no principal:** ✓ (via `fase1_base_estrutural`)
**Versão registrada em `schema_migrations` do principal:** ✗
**Evidência da origem:** hipótese provável; não há log de execução disponível para
confirmar como fato.

**Tratamento proposto:** `716bbe07` **não deve ser incluído** no diretório ativo
`supabase/migrations/` porque seus efeitos estão integralmente cobertos pela versão
`20260604171237` (`fase1_base_estrutural`), que já está registrada no principal.
Incluir `716bbe07` como migration ativa criaria duplicação de DDL no histórico
executável. O arquivo deve ser **arquivado** fora de `supabase/migrations/` com
anotação explicando a sobreposição com `20260604171237`.

**Decisão pendente de Helder:** confirmar se há outro caminho de origem conhecido para
`716bbe07` que invalide esta hipótese.

---

#### `20260611002357_aab13a75` — análise detalhada

**Conteúdo do arquivo GitHub (`aab13a75`):**

Drop e recriação de políticas RLS nas tabelas `sales`, `clinic_products`,
`onboardings`, `onboarding_steps`, `charges`, `contracts` — substituindo políticas
permissivas (`USING (true)`) por políticas mais restritivas (`USING (auth.uid() IS NOT NULL)`).

**Estado no principal:**
- Policies `authenticated access` existem em `sales`, `clinic_products`,
  `onboardings`, `charges`, `contracts` ✓
- Não há registro de `20260611002357` em `schema_migrations`

**Hipótese de origem (não confirmada):** `aab13a75` foi provavelmente aplicado via
SQL direto no Lovable. As políticas restritivas que ele cria (`auth.uid() IS NOT NULL`)
podem ter sido incluídas em outra migration — possivelmente `fix_rls_recursive_hub_users`
(`20260604184531`), cujo conteúdo está preservado em
`knowledge/migration-history/principal/statements/20260604184531_fix_rls_recursive_hub_users.sql.txt`.

**Decisão pendente:** verificar o conteúdo preservado de `fix_rls_recursive_hub_users`
para confirmar se inclui as mesmas policies de `aab13a75`. Essa verificação é leitura
de arquivo local — não requer consulta ao banco.

**Tratamento proposto:** `aab13a75` **não deve ser incluído** no diretório ativo
porque seus efeitos (policies mais restritivas) estão presentes no principal por
algum caminho já registrado. Arquivar com anotação e marcar como
"Decisão pendente — evidência adicional necessária sobre o caminho exato de origem".

---

## 7. Análise das quatro alternativas

### Alternativa 1 — Principal como histórico canônico completo

**Descrição:** adotar as versões e os `statements` do principal como referência
para todos os arquivos em `supabase/migrations/`. Para migrações ausentes no GitHub
(`fix_rls_recursive_hub_users`, `create_system_events`, `crm_001..011`), criar
arquivos a partir dos `statements` preservados em `knowledge/migration-history/principal/`.
Arquivar as versões GitHub substituídas fora de `supabase/migrations/`. Alinhar
o DEV futuramente apenas por `migration repair` de metadados, sem reaplicar DDL.

| Dimensão | Classificação | Explicação |
|---|---|---|
| Segurança | **Alta** | Não reaaplica DDL existente; o principal já está em operação e seus objetos são a referência viva |
| Rastreabilidade | **Alta** | GitHub passa a refletir exatamente o que está no principal |
| Risco no DEV | **Baixo** | O reparo de metadados não altera DDL; risco elevado apenas se executado sem plano |
| Risco no principal | **Muito baixo** | Principal não precisa de nenhuma alteração de metadados ou DDL |
| Impacto no CRM | **Mínimo** | Arquivos CRM do principal adicionados ao GitHub com aprovação de Jefferson; nenhuma DDL executada |
| Compatibilidade com Supabase CLI | **Alta** | Após canonicalização, `supabase migration list` mostrará histórico consistente |
| Capacidade de reconstruir ambiente novo | **Alta** | Ambiente novo pode ser criado rodando as migrations na ordem do principal |
| Complexidade | **Média** | Requer arquivamento das versões substituídas e criação de dois arquivos ausentes |
| Reversibilidade | **Alta** | Mudanças são apenas de arquivos Git; reverter o PR desfaz tudo sem tocar o banco |
| Necessidade de `migration repair` | **Sim — somente no DEV**, após gate específico e com plano aprovado |
| Aderência ao fluxo DEV → principal | **Alta** — após o alinhamento do DEV, o fluxo ficará seguro |

**Vantagem principal:** o principal nunca precisa ser alterado durante a canonicalização.

**Risco residual:** o `migration repair` no DEV exige cuidado para não alterar DDL.
A ordem das operações (arquivos primeiro, validação local, reparo de metadados DEV
depois) mitiga esse risco.

---

### Alternativa 2 — Principal para `public`, DEV para `crm`

**Descrição:** usar as versões do principal para as migrations públicas (igual à
Alternativa 1) e as versões do DEV para as migrations CRM. Exigiria `migration repair`
no principal para substituir os `statements` de `crm_004..010` pelos do DEV.

| Dimensão | Classificação | Explicação |
|---|---|---|
| Segurança | **Média** | O `migration repair` no principal é operação de risco em ambiente em produção |
| Rastreabilidade | **Alta** — os arquivos originais de Jefferson seriam a referência | |
| Risco no DEV | **Baixo** | Metadados do DEV não precisam ser alterados para CRM |
| Risco no principal | **Alto** | `migration repair` nos `statements` de `crm_004..010` no ambiente em operação sem garantia de equivalência byte-a-byte |
| Impacto no CRM | **Médio** — os metadados históricos mudariam, a DDL não | |
| Complexidade | **Alta** | Dois ambientes precisam de reparo; ordem crítica |
| Reversibilidade | **Baixa para o principal** | Reverter `migration repair` no principal exige novo reparo ou restauração |
| Necessidade de `migration repair` | **Sim — nos dois ambientes** |
| Aderência ao fluxo DEV → principal | **Média** — melhora, mas o cruzamento de versões CRM complica |

**Desvantagem principal:** exige modificar `schema_migrations` do principal, que
é o ambiente em operação, sem benefício estrutural (o estado do banco não muda,
só os metadados históricos). A diferença textual em `crm_004..010` não é defeito
funcional — o estado estrutural já é equivalente.

**Requer aprovação específica de Jefferson** por envolver os registros históricos
das migrations CRM dele no principal.

---

### Alternativa 3 — Manter históricos divergentes e iniciar novo marco

**Descrição:** não reconciliar os históricos existentes. Definir uma data de corte e
criar todas as novas migrations a partir dessa data. As migrations antigas permanecem
somente em `knowledge/migration-history/`.

| Dimensão | Classificação | Explicação |
|---|---|---|
| Segurança | **Média** | Novas migrations seguras; histórico antigo não reconciliado |
| Rastreabilidade | **Baixa** | Impossível saber com certeza o que está aplicado em qual ambiente apenas lendo o GitHub |
| Risco no DEV | **Médio** | O DEV continuará com estado `public` completamente diferente do principal |
| Risco no principal | **Baixo** | Nenhuma alteração necessária |
| Impacto no CRM | **Nulo** | Nenhuma ação no CRM |
| Compatibilidade com Supabase CLI | **Baixa** | CLI continuará confuso sobre o que está ou não aplicado |
| Capacidade de reconstruir ambiente novo | **Muito baixa** | Ambiente novo seria reconstruído apenas a partir do ponto de corte, sem histórico |
| Complexidade | **Baixa** imediata; **Alta** a longo prazo | |
| Reversibilidade | **Alta** | Nenhuma alteração feita; pode-se decidir canonicalizar depois |
| Necessidade de `migration repair` | Não imediata; provavelmente necessária no futuro |
| Aderência ao fluxo DEV → principal | **Baixa** — o DEV sem estrutura pública não pode receber novas migrations do `public` com segurança |

**Avaliação:** solução temporária aceitável apenas se houver impedimento urgente para
prosseguir com a Alternativa 1. Não resolve o problema — adia a decisão com custo
crescente.

---

### Alternativa 4 — Baseline monolítico ou reconstrução a partir do zero

**Descrição:** destruir os históricos existentes e reconstruir os ambientes (ou criar
uma única migration monolítica cobrindo todos os objetos).

| Dimensão | Classificação | Explicação |
|---|---|---|
| Segurança | **Crítica — inaceitável** | Destrói o trabalho de Jefferson no DEV; risco de reconstruir objetos com definições divergentes |
| Rastreabilidade | **Muito baixa** | Histórico real é perdido ou obscurecido |
| Risco no DEV | **Crítico** | `db reset` destrói schema `crm`; trabalho de Jefferson perdido |
| Risco no principal | **Crítico** | Dados em operação em risco durante reset |
| Impacto no CRM | **Destrutivo** — inaceitável sem aprovação de Jefferson | |
| Compatibilidade com Supabase CLI | Tecnicamente possível | |
| Capacidade de reconstruir ambiente novo | **Alta** — mas a um custo destrutivo | |
| Complexidade | **Muito alta** | Requer mapear todos os objetos, dependências e dados |
| Reversibilidade | **Nula** | Sem backup externo, perda irreversível |
| Necessidade de `migration repair` | Não — porque o histórico seria substituído inteiramente |
| Aderência ao fluxo DEV → principal | Irrelevante — o fluxo seria reiniciado do zero |

**Esta alternativa não é recomendada.** Listada apenas para evidenciar por que
não deve ser considerada: destrói ativos protegidos, impede rollback e não preserva
o trabalho concluído de Jefferson.

---

## 8. Recomendação proposta

> **Proposta — aguardando aprovação de Helder e Jefferson.**
>
> **Adotar o histórico registrado no principal como histórico canônico do diretório
> ativo, preservar os históricos alternativos em `knowledge/migration-history/`,
> alinhar futuramente apenas os metadados de migrations do DEV por `migration repair`,
> e aplicar no DEV somente as estruturas públicas comprovadamente ausentes.**

Esta é a **Alternativa 1**, por três razões principais:

1. **O principal nunca precisa ser alterado** durante a canonicalização — elimina o
   risco mais crítico (reparo em ambiente em operação).
2. **A diferença textual em `crm_004..010` não é defeito funcional** — o estado
   estrutural é equivalente; usar as versões do principal evita uma operação de risco
   desnecessária no principal.
3. **O DEV é o ambiente de validação** — qualquer reparo de metadados ocorre primeiro
   no DEV, sem impactar o principal.

**Respostas às 15 questões decisórias:**

**1. Versões públicas no diretório ativo:**
As 12 versões do principal: `20260529143328`, `20260604133039`, `20260604135414`,
`20260604135435`, `20260604135449`, `20260604135500`, `20260604135513`,
`20260604171237`, `20260604184531`, `20260605143042`, `20260619204324`,
`20260619204335`. Para as ausentes no GitHub (`184531`, `143042`), os arquivos
serão criados a partir dos `statements` preservados.

**2. Versões CRM no diretório ativo:**
As 11 versões do principal: `20260623153559`, `20260623153628`, `20260623153647`,
`20260623153710`, `20260623153731`, `20260623153751`, `20260623153809`,
`20260623153826`, `20260623153846`, `20260623153913`, `20260623201809`.
Os arquivos serão criados a partir dos `statements` preservados em
`knowledge/migration-history/principal/statements/`.

**3. SQL canônico:**
O SQL canônico será **exatamente** o conteúdo de `statements` do principal,
conforme preservado em `knowledge/migration-history/`. Nenhuma reformatação ou
reescrita é permitida — o objetivo é rastreabilidade, não legibilidade.

**4. Arquivos GitHub com timestamps substituídos:**
Os arquivos `000001..000005`, `200001`, `000001_create_ai_tasks`,
`000002_evolve_ai_tasks_priority` serão **removidos de `supabase/migrations/`**
e movidos para `supabase/migrations_archive/` (a confirmar com Helder). Um
`README.md` nessa pasta explicará que são versões superseded e documentará a versão
canônica equivalente de cada um.

**5. Local de arquivo das versões substituídas:**
`supabase/migrations_archive/` — dentro do repositório, fora do diretório ativo.
Alternativa: pasta separada em `knowledge/migrations_superseded/`. A decisão sobre
o local exato é de Helder (Gate 0).

**6. Evitar duas versões executáveis da mesma alteração:**
No Gate 2, cada arquivo substituído será **removido** de `supabase/migrations/`
antes de o arquivo canônico ser adicionado. Nenhum PR que adicione um arquivo
canônico será mergeado enquanto o arquivo superseded ainda existir no diretório ativo.
Validação via `supabase migration list --local` no Gate 3.

**7. Tratamento de `716bbe07` e `aab13a75`:**
Ambos serão **arquivados** fora de `supabase/migrations/` com anotação explicando
que seus efeitos estão cobertos por versões já registradas no principal. Nenhum
arquivo derivado deles será adicionado ao diretório ativo. Ver §10 para detalhes.

**8. Versões marcadas como aplicadas no DEV (via `migration repair`):**
As 23 versões do principal mais `dev_scaffold_public_clinics` (`20260623135741`),
que já está no DEV. No DEV, o reparo acrescentará os registros das versões públicas
ausentes (`20260529143328..20260619204335`) como `applied`, e substituirá os
registros CRM DEV (`20260623135758..20260623192204`) pelos registros canônicos do
principal (`20260623153559..20260623201809`). Ordem e procedimento exatos no Gate 4.

**9. Versões antigas do DEV marcadas como revertidas:**
As 11 versões CRM do DEV (`20260623135758..20260623192204`) **não serão marcadas
como revertidas** — serão substituídas pelos registros canônicos do principal via
`migration repair`. A distinção é que `migration repair` altera os metadados de
versão, não executa rollback de DDL (que permanece inalterada).
`Decisão pendente — evidência adicional necessária` sobre o comportamento exato
do Supabase CLI ao substituir registros CRM via `migration repair`.

**10. Migrations públicas aplicadas de verdade no DEV:**
Somente as estruturas comprovadamente ausentes no DEV após o reparo de metadados.
Candidatas: fundação pública (P01..P12), exceto `dev_scaffold_public_clinics`
(que já existe no DEV e não existe no principal). A ordem deve respeitar dependências:
enums antes de tabelas, tabelas referenciadas antes de tabelas com FK.
`Decisão pendente — evidência adicional necessária` sobre quais objetos do `public`
o `dev_scaffold_public_clinics` criou além de `clinics`, para evitar conflito com P01.

**11. Ordem segura das operações:**
① Gate 2: canonicalização no Git (arquivos, sem banco);
② Gate 3: validação local (Supabase CLI, sem banco);
③ Gate 4: reparo de metadados no DEV (somente `schema_migrations`, sem DDL);
④ Gate 5: aplicação estrutural aditiva no DEV (DDL somente para objetos ausentes);
⑤ Gate 6: validação completa do DEV;
⑥ Gate 7: principal sem alteração (ou com PR próprio e gate específico se necessário).

**12. O principal precisará de alteração de metadados?**
**Não** — pela Alternativa 1. O principal é a referência; nenhum `migration repair`
ou alteração de `schema_migrations` é previsto no principal.

**13. Validação de que nenhuma DDL CRM foi reaplicada:**
No Gate 6, após o alinhamento do DEV: verificar que as 10 tabelas CRM, 8 enums,
13 funções, 9 objetos de trigger, 25 policies e índices estão inalterados via
`information_schema` e `pg_get_functiondef`. Comparar antes/depois.

**14. Supabase CLI sem migrations pendentes incorretas:**
No Gate 3: executar `supabase migration list` em ambiente local descartável e
confirmar que nenhuma versão canônica aparece como pendente. No Gate 6: repetir
no DEV real após o reparo de metadados.

**15. Reconstrução de ambiente limpo a partir do GitHub:**
Após Gates 2 e 3, um ambiente limpo deverá poder ser reconstruído rodando as
23 migrations em ordem. No Gate 3 isso é validado em ambiente descartável antes
de qualquer toque no DEV.

---

## 9. Tratamento proposto para cada arquivo atual em `supabase/migrations/`

| Arquivo atual (GitHub) | Equivalente canônico | Ação proposta | Versão a arquivar |
|---|---|---|---|
| `20260529143328_0c3bac65...sql` | Mesma versão no principal | Manter; confirmar hash no Gate 3 | — |
| `20260604000001_add_hub_users.sql` | `20260604135414` (principal) | Arquivar em `migrations_archive/`; criar `20260604135414_add_hub_users.sql` a partir dos `statements` | `000001` |
| `20260604000002_extend_existing_tables.sql` | `20260604135435` (principal) | Arquivar; criar `20260604135435_extend_existing_tables.sql` | `000002` |
| `20260604000003_add_templates_and_volume.sql` | `20260604135449` (principal) | Arquivar; criar `20260604135449_add_templates_and_volume.sql` | `000003` |
| `20260604000004_add_indexes.sql` | `20260604135500` (principal) | Arquivar; criar `20260604135500_add_indexes.sql` | `000004` |
| `20260604000005_add_clinic_scores_view.sql` | `20260604135513` (principal) | Arquivar; criar `20260604135513_add_clinic_scores_view.sql` | `000005` |
| `20260604133039_e7560ffe...sql` | Mesma versão no principal | Manter; confirmar hash no Gate 3 | — |
| `20260604185143_716bbe07...sql` | Efeitos cobertos por `20260604171237` | **Arquivar sem criar equivalente canônico** (ver §10) | `716bbe07` |
| `20260604200001_fase1_base_estrutural.sql` | `20260604171237` (principal) | Arquivar; criar `20260604171237_fase1_base_estrutural.sql` | `200001` |
| `20260611002357_aab13a75...sql` | Efeitos presentes no principal; origem incerta | **Arquivar sem criar equivalente canônico** (ver §10) | `aab13a75` |
| `20260619000001_create_ai_tasks.sql` | `20260619204324` (principal) | Arquivar; criar `20260619204324_create_ai_tasks.sql` | `000001_ai` |
| `20260619000002_evolve_ai_tasks_priority.sql` | `20260619204335` (principal) | Arquivar; criar `20260619204335_evolve_ai_tasks_priority.sql` | `000002_ai` |

**Arquivos ausentes no GitHub a criar:**
- `20260604184531_fix_rls_recursive_hub_users.sql` — a partir de `knowledge/migration-history/principal/statements/20260604184531_fix_rls_recursive_hub_users.sql.txt`
- `20260605143042_create_system_events.sql` — a partir de `knowledge/migration-history/principal/statements/20260605143042_create_system_events.sql.txt`
- `20260623153559_crm_001_schema_and_grants.sql` — a partir de `knowledge/migration-history/principal/statements/20260623153559_crm_001_schema_and_grants.sql.txt` (**somente após aprovação de Jefferson**)
- ...idem para `crm_002..011` (versões do principal `153628..201809`)

---

## 10. Tratamento de `716bbe07` e `aab13a75`

### `716bbe07` (`20260604185143_716bbe07-a9ca-4c4e-96b6-93928ae572ee.sql`)

**Efeitos no principal:** colunas `nome_fantasia`, `razao_social`, `cnpj`, `phone`,
`email`, `address` em `public.clinics` presentes ✓; `public.sales` e
`public.clinic_products` presentes ✓

**Hipótese de origem (provável, não confirmada como fato):** aplicado como SQL direto
no Lovable, sem registro em `schema_migrations`. A versão `20260604171237`
(`fase1_base_estrutural`), registrada no principal com timestamp anterior, já criava
os mesmos objetos com `IF NOT EXISTS` — fazendo os efeitos de `716bbe07` serem
absorvidos silenciosamente. A migration `fase1_base_estrutural` usa enum `product_type`
para `sales.product`, enquanto `716bbe07` usa `text` — a versão do principal tem
a definição mais completa.

**Decisão pendente de Helder:** confirmar se há outro caminho de origem
ou se a hipótese de SQL direto está correta.

**Ação proposta:** arquivar `716bbe07` em `supabase/migrations_archive/` com
`README` explicando a sobreposição com `20260604171237`. Não criar arquivo
executável correspondente.

### `aab13a75` (`20260611002357_aab13a75-7ba6-4439-8156-c9a8e30ea3d8.sql`)

**Efeitos no principal:** policies `authenticated access` existem em `sales`,
`clinic_products`, `onboardings`, `charges`, `contracts` ✓

**Hipótese de origem (provável, não confirmada):** aplicado como SQL direto.
As policies restritivas podem ter sido incluídas em `fix_rls_recursive_hub_users`
(`20260604184531`), cujo conteúdo está preservado e pode ser lido localmente para
verificação antes do Gate 2.

**Decisão pendente:** verificar o conteúdo de `knowledge/migration-history/principal/
statements/20260604184531_fix_rls_recursive_hub_users.sql.txt` para confirmar se
inclui as policies de `aab13a75`. Essa verificação é leitura de arquivo local,
não requer nova consulta ao banco.

**Ação proposta:** arquivar `aab13a75` em `supabase/migrations_archive/` com
`README` explicando que os efeitos estão presentes no principal por caminho ainda
a confirmar. Não criar arquivo executável correspondente até que a origem seja
confirmada ou descartada.

---

## 11. Plano futuro por gates

> Nenhum gate abaixo está autorizado. A execução depende de aprovação explícita
> de Helder ou Jefferson em cada gate.

### Gate 0 — Aprovação da decisão

**Exigências antes de qualquer ação:**
- Aprovação explícita de Helder ou Jefferson desta proposta (documento 18)
- Aprovação específica de Jefferson para o tratamento dos arquivos CRM (criação dos
  11 arquivos a partir das versões do principal e eventual `migration repair` no DEV)
- Confirmação de Helder sobre o local de arquivo das versões superseded
  (`supabase/migrations_archive/` ou alternativa)
- Confirmação de Helder sobre a hipótese de origem de `716bbe07` e `aab13a75`
- Confirmação de Helder sobre se o conteúdo de `dev_scaffold_public_clinics`
  conflita com alguma versão pública canônica

### Gate 1 — Snapshot e proteção (antes de qualquer mudança)

**Ações a executar somente com Gate 0 aprovado:**
- Exportar snapshot lógico de `schema_migrations` dos dois ambientes (read-only)
- Registrar hashes SHA-256 de todos os arquivos em `supabase/migrations/`
- Confirmar contagem: 10 tabelas CRM em cada ambiente
- Confirmar 8 FKs para `public.clinics` no principal
- Confirmar 8 FKs para `public.clinics` no DEV
- Documentar o plano de rollback de metadados (Gate 4)
- Nenhuma alteração de dados de negócio

### Gate 2 — Canonicalização somente no Git

**Ações a executar somente com Gate 1 concluído:**
- Criar branch própria (`helder/migration-canonicalization`)
- Para cada versão substituída: remover o arquivo de `supabase/migrations/` e
  mover para `supabase/migrations_archive/` no mesmo commit
- Para cada versão canônica ausente: criar o arquivo a partir dos `statements`
  preservados em `knowledge/migration-history/principal/statements/`
- Para `crm_001..011`: criar os 11 arquivos somente após autorização de Jefferson
- Arquivar `716bbe07` e `aab13a75` com README explicativo
- Verificar que `supabase/migrations/` não contém duplicatas
- Verificar que `knowledge/migration-history/` **não foi alterado**
- Nenhuma alteração de banco até Gate 3 completo

### Gate 3 — Validação local

**Comandos conceituais — NENHUM DEVE SER EXECUTADO ATÉ ESTE GATE:**

> `EXEMPLO NÃO AUTORIZADO — NÃO EXECUTAR`
> ```
> supabase migration list --local          # verificar histórico local
> supabase db diff --use-migra             # verificar que nenhuma DDL nova aparece
> ```

**Validações a confirmar no Gate 3:**
- `supabase migration list` local mostra as 23 versões canônicas (ou mais, se DEV
  for diferente de um ambiente limpo)
- Nenhuma versão aparece como pendente
- Em ambiente descartável local: aplicar as 23 migrations em ordem confirma que
  o schema resultante é equivalente ao do principal
- Hashes dos novos arquivos são idênticos aos `statements` preservados
- Ordem das versões respeita dependências de objetos

### Gate 4 — Alinhamento somente de metadados no DEV

> **Este gate altera somente `supabase_migrations.schema_migrations` no DEV.**
> **Nenhuma DDL, DML, função, trigger, policy ou índice é criado ou alterado.**

**Plano de `migration repair` no DEV (ordem a confirmar com Jefferson para CRM):**

> `EXEMPLO NÃO AUTORIZADO — NÃO EXECUTAR`
> ```
> supabase migration repair --status applied 20260529143328 --db-url $DEV_URL
> supabase migration repair --status applied 20260604133039 --db-url $DEV_URL
> # ... demais versões públicas na ordem cronológica ...
> supabase migration repair --status applied 20260623153559 --db-url $DEV_URL
> # substitui o registro DEV crm_001 (20260623135758) pelo canônico do principal
> # ... demais CRM ...
> ```

**Validação após cada grupo:**
- Conferir que a contagem de `schema_migrations` no DEV aumentou como esperado
- Conferir que nenhuma DDL CRM foi alterada (10 tabelas, 8 enums, 13 funções intactos)
- Rollback: se divergência encontrada, registrar e pausar (não corrigir automaticamente)

### Gate 5 — Alinhamento estrutural aditivo do DEV

**Estruturas públicas realmente ausentes no DEV** (a confirmar com leitura de
`information_schema` no Gate 1):

| Objeto | Migration de origem | Dependências | Risco | Impacto em `public.clinics` | Impacto no CRM |
|---|---|---|---|---|---|
| Enums `public` (16) | P01 + P08 | Nenhuma | Baixo | Nenhum | Nenhum — enums `crm` já existem |
| Tabela `hub_users` + `clinic_assignments` | P03 | `clinics` | Médio — `clinic_assignments` tem FK para `clinics` | FK dependente | Nenhum |
| Tabelas `meta_templates`, `meta_template_metrics`, `api_volume_snapshots` | P04 + P05 | Enums | Baixo | Nenhum | Nenhum |
| Índices | P06 | Tabelas | Baixo | Nenhum | Nenhum |
| View `vw_clinic_scores` | P07 | Tabelas + enums | Baixo | Nenhum | Nenhum |
| Tabelas `sales`, `clinic_products`, `onboardings`, etc. | P08 | Enums + `clinics` | Médio — FKs para `clinics` | FK dependente | Nenhum |
| Fix RLS recursivo `hub_users` | P09 | `hub_users` | Baixo | Nenhum | Nenhum |
| Tabela `system_events` | P10 | Nenhuma | Baixo | Nenhum | Nenhum |
| Tabela `ai_tasks` + enums | P11 + P12 | Enums | Baixo | Nenhum | Nenhum |

**O `dev_scaffold_public_clinics` já criou `clinics` com scaffold mínimo.**
Qualquer migration que use `ADD COLUMN` em `clinics` deve usar `IF NOT EXISTS`
ou confirmar que a coluna não existe antes de prosseguir.

**Validações por migration no Gate 5:**
- Advisors Supabase antes e depois
- Confirmar que nenhum objeto CRM foi alterado
- Confirmar FKs para `public.clinics` intactas
- Confirmar contagem de tabelas CRM = 10 após cada migration

### Gate 6 — Validação do DEV

**Comparações a realizar:**
- Contagem e definição das 10 tabelas CRM via `information_schema`
- 8 enums CRM via `pg_type`
- 13 funções CRM via `pg_proc` + `pg_get_functiondef`
- 9 objetos de trigger (12 linhas) via `information_schema.triggers`
- 25 policies CRM via `pg_policies`
- Índices CRM via `pg_indexes`
- 8 FKs para `public.clinics` via `information_schema.referential_constraints`
- Supabase advisors sem novos erros críticos
- `supabase migration list` mostra 23+ versões, nenhuma pendente incorreta
- Nenhum dado de negócio perdido ou alterado
- Nenhuma alteração funcional não planejada

### Gate 7 — Principal

**A recomendação busca não alterar o principal durante a canonicalização.**

Se qualquer mudança futura no principal for necessária (por exemplo, uma nova
migration de produto após o alinhamento do DEV), ela exige:
- PR próprio com migration previamente validada no DEV
- Nova autorização explícita de Helder ou Jefferson
- Plano de rollback documentado
- Validação pós-aplicação no principal

---

## 12. Plano de validação local

> `EXEMPLO NÃO AUTORIZADO — NÃO EXECUTAR` — comandos listados apenas para referência
> do documento de execução (doc 19, ainda não criado).

Verificações conceituais para o Gate 3:

1. `supabase migration list` — lista as versões reconhecidas localmente
2. `supabase db diff --use-migra` — confirma que nenhuma DDL nova existe em relação
   ao estado atual (deve retornar vazio após canonicalização)
3. Em ambiente descartável: `supabase start && supabase migration up` — aplica todas
   as migrations em ordem e confirma que o schema resultante é equivalente ao principal
4. Verificar integridade dos hashes: comparar SHA-256 do conteúdo canônico de cada
   arquivo criado com o hash registrado no manifesto do principal em
   `knowledge/migration-history/principal/manifest.md`
5. Confirmar que `supabase/migrations_archive/` contém exatamente os arquivos
   superseded, com README explicativo

---

## 13. Plano futuro de metadados do DEV (Gate 4)

**Operações de `migration repair` propostas — NÃO EXECUTAR:**

> `EXEMPLO NÃO AUTORIZADO — NÃO EXECUTAR`

Versões a adicionar como `applied` no DEV (ausentes):
- `20260529143328` (P01)
- `20260604133039` (P02)
- `20260604135414` (P03)
- `20260604135435` (P04)
- `20260604135449` (P05)
- `20260604135500` (P06)
- `20260604135513` (P07)
- `20260604171237` (P08)
- `20260604184531` (P09)
- `20260605143042` (P10)
- `20260619204324` (P11)
- `20260619204335` (P12)

Versões CRM a substituir (DEV tem timestamps `1357xx..1401xx..1921xx`;
canônico do principal tem timestamps `1535xx..2018xx`):

> `Decisão pendente — evidência adicional necessária` sobre se o Supabase CLI
> permite `migration repair --status applied` para substituir um registro existente
> por outro com timestamp diferente sem apagar e recriar a entrada. O documento
> de execução (doc 19) deverá cobrir esse ponto com documentação da CLI.

**Rollback do Gate 4:** se qualquer validação falhar após o reparo de metadados,
o fallback é restaurar o snapshot do `schema_migrations` do DEV capturado no Gate 1.
Nenhuma DDL precisa ser revertida (o reparo não altera DDL).

---

## 14. Plano futuro de alinhamento estrutural aditivo do DEV (Gate 5)

**Objeto faltante mais crítico: `clinics` já existe (scaffold).**
A primeira migration aplicada no DEV (P01) adiciona colunas e enums a `public.clinics`.
O `dev_scaffold_public_clinics` criou uma versão mínima de `clinics`. A migration P01
usa `CREATE TYPE` (não `IF NOT EXISTS` para alguns tipos) e `CREATE TABLE` (não
`IF NOT EXISTS`). Isso pode gerar erro se `clinics` já existir sem os enums corretos.

> `Decisão pendente — evidência adicional necessária:` leitura do conteúdo de
> `knowledge/migration-history/dev/statements/20260623135741_dev_scaffold_public_clinics.sql.txt`
> e comparação linha a linha com
> `knowledge/migration-history/principal/statements/20260529143328_0c3bac65...sql.txt`
> para identificar quais objetos já existem e quais precisam de `IF NOT EXISTS` ou
> de pular via `migration repair --status applied`.

**Estratégia alternativa para P01:** se houver conflito, marcar P01 como `applied`
no DEV via `migration repair` (sem executar o SQL) e criar uma migration delta que
adiciona somente os objetos ausentes. Essa estratégia é Gate 4.5 e requer aprovação.

---

## 15. Proteção e validação do CRM

**Fato confirmado:** o schema `crm` é estruturalmente equivalente entre DEV e
principal. As 10 tabelas, 8 enums, 13 funções, 9 objetos de trigger (12 linhas),
25 policies e índices são idênticos funcionalmente.

**Proteções obrigatórias em todos os gates:**

1. **Antes de qualquer Gate 4 ou 5:** confirmar 10 tabelas CRM, 8 FKs para
   `public.clinics`, e que nenhum objeto CRM foi alterado.
2. **Em cada etapa de Gate 5:** confirmar que a migration aplicada não tocou
   nenhum objeto do schema `crm`.
3. **Proibido sem aprovação de Jefferson:**
   - Qualquer DDL no schema `crm`
   - Qualquer alteração das FKs para `public.clinics`
   - Qualquer `migration repair` nas versões CRM sem plano aprovado por Jefferson
   - Adição dos arquivos `crm_001..011` ao GitHub sem aprovação de Jefferson

**Validação pós-Gate 5:**
- `SELECT count(*) FROM information_schema.tables WHERE table_schema='crm'` deve
  retornar 10
- `SELECT count(*) FROM pg_policies WHERE schemaname='crm'` deve retornar 25
- Todas as 8 FKs para `public.clinics` devem estar presentes

---

## 16. Estratégia de rollback

| Gate | Rollback possível | Mecanismo |
|---|---|---|
| Gate 2 (Git apenas) | **Sim — trivial** | Reverter o PR; nenhum banco alterado |
| Gate 3 (validação local) | **Sim** | Descartar ambiente local; nenhum banco alterado |
| Gate 4 (metadados DEV) | **Sim — via snapshot** | Restaurar snapshot de `schema_migrations` do DEV capturado no Gate 1; nenhuma DDL foi alterada |
| Gate 5 (DDL aditiva DEV) | **Sim — com cuidado** | Cada migration aditiva deve ter rollback documentado (DROP TABLE, DROP COLUMN IF EXISTS etc.); não afeta o CRM |
| Gate 6 (validação DEV) | **Sim** | Pausa e diagnóstico; o principal não foi tocado |
| Gate 7 (principal) | **Situacional** | Depende da migration específica; requer plano próprio |

**Não há rollback para a Alternativa 4** (reconstrução do zero) — razão adicional
para não escolhê-la.

---

## 17. Impacto no Hub

### Problema resolvido

O Hub 3S possui hoje um drift entre quatro representações do mesmo estado:
- **GitHub**: 12 arquivos com timestamps diferentes dos aplicados no principal
- **DEV**: 12 migrations, todas CRM, schema `public` quase vazio
- **Principal**: 23 migrations registradas, estado em operação
- **Histórico registrado**: `schema_migrations` com versões que o GitHub não reconhece

Esse drift impede o uso seguro do Supabase CLI, bloqueia novas migrations confiáveis
e impossibilita a reconstrução de ambiente limpo.

### Módulo envolvido

`Governança técnica e infraestrutura do Hub`

### Impacto no Hub após canonicalização aprovada

| Área | Impacto |
|---|---|
| Novas migrations | Seguras: o GitHub refletirá o estado real do principal; novas migrations terão uma base sólida |
| Fluxo DEV → principal | Restaurado: DEV alinhado com o principal permite o fluxo normal de desenvolvimento |
| CRM | Nulo durante a canonicalização; melhora a rastreabilidade histórica |
| Eventos (`system_events`) | Rastreabilidade melhorada: o arquivo `create_system_events` existirá no GitHub |
| Tarefas de IA (`ai_tasks`) | Idem: os arquivos canônicos existirão no GitHub |
| Reconstrução de ambientes | Habilitada: qualquer novo ambiente poderá ser criado a partir do GitHub |
| Auditoria | Melhora significativa: o histórico Git, o DEV e o principal estarão alinhados |

### Entidades e dados envolvidos

- Arquivos de migration em `supabase/migrations/` e `supabase/migrations_archive/`
- `supabase_migrations.schema_migrations` (DEV — Gate 4; principal — não alterado)
- Schemas `public` e `crm`
- `public.clinics` e 8 FKs do CRM
- Manifestos e hashes em `knowledge/migration-history/`
- Nenhum registro de cliente ou dado de negócio

---

## 18. Eventos e tarefas de IA futuras

> **Proposta — não implementar nesta tarefa nem sem autorização.**

### Eventos futuros propostos

- `migration_canonicalization_started` — início da Etapa B aprovada
- `migration_history_repaired` — `migration repair` concluído em um ambiente
- `migration_applied_to_dev` — migration pública aplicada no DEV
- `migration_validation_failed` — falha em qualquer validação de Gate
- `migration_canonicalization_completed` — todos os gates concluídos
- `migration_drift_detected` — discrepância futura detectada entre GitHub e banco

### Tarefas de IA futuras

- Comparar periodicamante o histórico Git × DEV × principal e detectar novas divergências
- Verificar hashes dos arquivos em `supabase/migrations/` contra os manifestos
- Identificar migration pendente inesperada e abrir tarefa humana
- Produzir relatório de validação pós-gate
- Notificar Helder ou Jefferson em caso de divergência crítica

---

## 19. Indicadores e critérios de aceite

| Indicador | Critério de aceite |
|---|---|
| Duplicações no diretório ativo | Zero migrations lógicas duplicadas em `supabase/migrations/` |
| DDL reaplicada | Zero objetos criados ou alterados que já existiam no banco |
| Alterações no CRM | Zero — nenhum objeto do schema `crm` alterado em nenhuma etapa |
| Versões canônicas com hash | 100% das versões em `supabase/migrations/` com hash verificado contra o manifesto do principal |
| Cobertura do histórico GitHub | 100% das migrations do principal explicadas por um arquivo em `supabase/migrations/` ou `supabase/migrations_archive/` |
| Migrations falsamente pendentes no DEV | Zero após Gate 4 e Gate 6 |
| Reconstrução de ambiente limpo | Concluída com sucesso em ambiente descartável no Gate 3 |
| Advisors | Sem novos erros críticos após cada gate |
| Rollback testado | Plano documentado e testado documentalmente para cada gate |
| FKs CRM para `public.clinics` | 8 FKs presentes antes e depois de todos os gates |
| Tabelas CRM | 10 em cada ambiente antes e depois |

---

## 20. Riscos e dependências

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Conflito de `dev_scaffold_public_clinics` com P01 | **Alta** — scaffold criou `clinics` sem os enums do P01 | Médio — bloqueia aplicação de P01 no DEV | Análise de conteúdo no Gate 1; estratégia de skip + delta se necessário |
| `migration repair` com comportamento inesperado no Supabase CLI | **Média** — comportamento de substituição de registro não documentado com clareza | Alto — pode corromper metadados do DEV | Testar em ambiente descartável no Gate 3 antes do Gate 4 |
| `aab13a75` com origem não confirmada | **Média** | Baixo — os efeitos já estão presentes | Verificar conteúdo de `fix_rls_recursive_hub_users` antes do Gate 2 (leitura local) |
| `716bbe07` com caminho de origem diferente da hipótese | **Baixa** — hipótese muito provável | Médio — pode alterar o tratamento proposto | Confirmar com Helder antes do Gate 0 |
| Tabelas `sales` com definição de tipo diferente (enum vs text) | **Confirmada** — `716bbe07` usa `text`, `fase1_base_estrutural` usa enum | Baixo — o principal já usa a versão enum; `716bbe07` foi absortivo | Arquivar `716bbe07`; não criar arquivo executável |
| Nova migration aplicada no principal antes da canonicalização | **Baixa** | Alto — altera a base do inventário | Congelar o principal até Gate 7 concluído |
| Perda de dados no DEV durante Gate 5 | **Muito baixa** — o DEV tem apenas dados de testes | Baixo | Snapshot antes do Gate 5; confirmação de dados antes |

---

## 21. Decisões necessárias de Helder e Jefferson

### Decisões de Helder

| # | Decisão | Contexto |
|---|---|---|
| H1 | Aprovar esta proposta (documento 18) como base para a Etapa B | Aprova a análise e a Alternativa 1 como direção |
| H2 | Confirmar o local de arquivo das versões superseded | `supabase/migrations_archive/` ou outra localização |
| H3 | Confirmar ou refutar a hipótese de origem de `716bbe07` | Aplicado via SQL direto ou há outro caminho? |
| H4 | Confirmar ou refutar a hipótese de origem de `aab13a75` | Idem |
| H5 | Confirmar se o conteúdo de `dev_scaffold_public_clinics` conflita com P01 | Ler os dois `.sql.txt` preservados e decidir a estratégia para o Gate 5 |
| H6 | Autorizar o início do Gate 0 e a criação do documento 19 (plano de execução) | Somente após H1..H5 respondidos |

### Decisões de Jefferson

| # | Decisão | Contexto |
|---|---|---|
| J1 | Aprovar a criação dos 11 arquivos CRM a partir das versões do principal | Esses arquivos representam o trabalho de Jefferson; ele decide se a versão do principal é a referência correta |
| J2 | Aprovar o `migration repair` nas versões CRM do DEV (Gate 4) | Substitui os timestamps DEV pelos do principal nos metadados do DEV; sem DDL |
| J3 | Revisar a divergência textual em `crm_004..010` | Confirmar que as versões do principal são funcionalmente corretas para o CRM |
| J4 | Confirmar que nenhum dado do CRM será afetado pelos gates | Revisão do plano de proteção do CRM (§15) |

---

## 22. Itens explicitamente não autorizados por este documento

Este documento não autoriza:
- `migration repair` em nenhum ambiente
- `supabase db push`, `supabase db reset`, `supabase migration up`
- Criação, remoção, renomeação ou movimentação de migrations executáveis
- Alteração de `supabase/migrations/`
- Alteração de `knowledge/migration-history/`
- Qualquer SQL, DDL ou DML nos bancos
- Alteração do schema `crm` ou de `public.clinics`
- Alteração de RLS, grants, autenticação, dados, Edge Functions ou integrações
- Merge ou aprovação automática desta proposta
- Force push ou alteração direta da `main`

---

## 23. Próximo documento após aprovação

Somente após aprovação explícita de Helder (decisões H1..H6) e Jefferson (J1..J4),
deverá ser criado um documento separado de execução:

`knowledge/19_PLANO_DE_EXECUCAO_DA_CANONICALIZACAO.md`

Esse documento cobrirá:
- Lista exata de arquivos a criar, arquivar e remover (com hashes esperados)
- Comandos autorizados por gate (marcados explicitamente como AUTORIZADOS)
- Ordem de operações com checkpoints e critérios de pausa
- Plano de rollback por gate com comandos de restauração
- Checklist de validação pré e pós cada gate
- Responsáveis por cada gate
- Comunicações necessárias antes de tocar o principal

**O documento 19 não deve ser criado antes da aprovação desta proposta.**
