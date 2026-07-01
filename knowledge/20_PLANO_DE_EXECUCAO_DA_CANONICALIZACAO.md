---
documento: 20_PLANO_DE_EXECUCAO_DA_CANONICALIZACAO
versao: 0.1-draft
data: 2026-06-29
classificacao: L1 — Operacional/Técnico
proprietario: Helder e Jefferson
status: Plano proposto — aguardando autorização de execução
implementacao: não autorizada
---

# Plano de Execução da Canonicalização de Migrations

> **Plano de execução — NENHUMA execução é realizada nesta tarefa.** Decorre da decisão
> aprovada no [doc 18](18_DECISAO_DE_CANONICALIZACAO_DE_MIGRATIONS.md) (**Alternativa 1**:
> Principal como referência canônica). A análise por migration (matriz completa, hashes,
> hipóteses de origem) está no doc 18 §§6, 9, 10 — **não duplicada aqui**.
> **Nenhum gate, `migration repair`, `db push`/`reset`, DDL/DML ou alteração de ambiente
> está autorizado.**

## 1. Objetivo
Reconciliar o histórico de migrations do **repositório** com os **ambientes** (DEV e
Principal), de modo a:
- preservar as estruturas existentes (sem recriar/reaplicar);
- evitar reaplicação de DDL;
- tornar os ambientes **reproduzíveis** a partir do repositório;
- **proteger especialmente o schema `crm`**;
- criar uma **fonte única e confiável** para migrations futuras.

## 2. Escopo
**Incluído:** migrations do repositório; histórico registrado no **Principal**; histórico
registrado no **DEV**; arquivos preservados em `knowledge/migration-history/`; migrations
**públicas**; migrations do schema **`crm`**; metadados de `supabase_migrations.schema_migrations`.

**Excluído:** alteração de dados; limpeza de dados de teste; mudança de RLS; mudança de
regra de negócio; alteração funcional da **PR #7**; integração da Central de Leads;
qualquer mudança no **Principal** durante a fase documental.

## 3. Fonte canônica
- O **Principal** é a referência para migrations **já aplicadas** (nomes, versões, ordem, statements).
- Os arquivos canônicos deverão **reproduzir exatamente a intenção e os statements registrados**
  (sem reformatar/reescrever — rastreabilidade, não legibilidade).
- **Diferenças textuais** (ex.: `crm_004..010`, hashes distintos DEV×Principal) deverão ser
  **analisadas antes** de qualquer substituição.
- O **estado real dos objetos** deverá ser comparado com o histórico — **sem assumir** que
  metadados garantem igualdade estrutural.

## 4. Regras de proteção
- **Nunca** reaplicar migration CRM já existente.
- **Nunca** apagar tabela, função, trigger, policy ou enum para "alinhar histórico".
- **Nunca** usar `db reset` em DEV ou Principal (ambientes compartilhados).
- **Nunca** executar `db push` sem dry-run e autorização.
- **Nunca** reparar metadados antes de validar que os objetos correspondentes já existem.
- **Nunca** alterar o Principal apenas para coincidir com arquivos locais.
- **Preservar rollback e evidências** antes de cada gate.

## 5. Gates de execução
> Estrutura. **Nenhum gate é executado nesta tarefa.** Cada gate exige autorização explícita.

### Gate 0 — Preservação e snapshots
Registrar commits/branches/versões/estado das PRs; exportar lista de migrations dos
ambientes (read-only); inventariar objetos existentes; preservar arquivos atuais.
**Nenhuma escrita em banco.**

### Gate 1 — Inventário comparativo
Comparar repositório × Principal × DEV × históricos preservados. Por migration: versão,
nome, checksum/hash disponível, statement, ambiente onde existe, objeto correspondente,
divergência, risco, decisão proposta. (Base: doc 18 §6.)

### Gate 2 — Classificação
Classificar cada migration: canônica · equivalente com divergência textual · ausente no
repositório · ausente no DEV · histórica/superseded · duplicada · conflitante · exige investigação.

### Gate 3 — Preparação dos arquivos canônicos (sem executar)
Planejar criação/substituição dos arquivos canônicos; preservar versões substituídas;
validar ordem/dependências e idempotência. **Nenhuma alteração em banco.**

### Gate 4 — Reconciliação de metadados do DEV (futuro `migration repair`)
Descrever a estratégia, **sem executar**. Exigir antes: correspondência comprovada
migration↔objeto; comparação de schema; dry-run; backup das tabelas de metadados; comando
exato documentado; rollback documentado; autorização explícita. **O repair altera apenas
metadados, nunca DDL.**

### Gate 5 — Estruturas ausentes no DEV
Separar migrations **realmente ausentes** das **apenas não registradas**. Para cada estrutura
ausente: provar ausência; analisar dependências; preparar migration específica; testar em
ambiente isolado quando possível; autorização separada; **nunca reaplicar o conjunto CRM inteiro**.

### Gate 6 — Validação
Comparar objetos/schemas/enums/tabelas/constraints/índices/funções/triggers/policies/grants/RLS;
PostgREST; autenticação; build e typecheck; funcionamento do CRM no DEV; **ausência de
alteração em dados**.

### Gate 7 — Go/No-Go
Checklist final: pronto p/ atualizar arquivos no repositório · pronto p/ reparar metadados
do DEV · pronto p/ aplicar estruturas ausentes · não pronto · rollback necessário.

## 6. Matriz de migrations (para complementação futura)
> Preenchida apenas com o **comprovado** (via `list_migrations` em 2026-06-29 e doc 18 §6).
> Detalhe por migration (hashes, statements, origem) no **doc 18 §6/§9/§10**.

| Versão | Nome | Repositório | Principal | DEV | Objetos | Estado | Ação proposta | Risco |
|---|---|---|---|---|---|---|---|---|
| `20260529143328` | base pública (P01) | ✓ (mesma versão) | ✓ | — | enums/tabelas `public` | canônica | manter; confirmar hash (Gate 3) | baixo |
| `20260604133039` | revoga anon (P02) | ✓ (mesma versão) | ✓ | — | grants | canônica | manter; confirmar hash | baixo |
| `20260604135414..135513` | P03–P07 | ✓ (timestamps `000001..05`) | ✓ | — | hub_users/templates/índices/view | equivalente c/ divergência de timestamp | arquivar repo; criar canônico do Principal | médio |
| `20260604171237` | fase1_base (P08) | ✓ (`200001`) | ✓ | — | sales/contracts/clinic_products… | equivalente (timestamp) | arquivar `200001`; criar canônico | médio |
| `20260604184531` | fix RLS hub_users (P09) | **ausente** | ✓ | — | policies | ausente no repo | criar do statements preservado | baixo |
| `20260605143042` | create_system_events (P10) | **ausente** | ✓ | — | system_events | ausente no repo | criar do statements preservado | baixo |
| `20260619204324/…335` | ai_tasks + evolução (P11/P12) | ✓ (`000001/2_…`) | ✓ | — | ai_tasks | equivalente (timestamp) | arquivar repo; criar canônico | baixo |
| `20260604185143_716bbe07` | sales/colunas (SQL direto) | ✓ | efeitos presentes; **sem registro** | — | clinics/sales | superseded por `171237` | arquivar; **não** criar executável | médio (origem a confirmar) |
| `20260611002357_aab13a75` | policies restritivas | ✓ | efeitos presentes; **sem registro** | — | policies | origem incerta | arquivar; investigar | médio (a confirmar) |
| `20260623153559..201809` | `crm_001..011` (Principal) | **ausente** (arquivos repo usam `2026062216..2316`) | ✓ | — | schema `crm` | **canônica (Principal)** | criar 11 arquivos do statements **(aprovação de Jefferson)** | médio |
| `20260623135758..192204` | `crm_001..011` (DEV) | — | — | ✓ | schema `crm` | timestamps DEV (superseded) | reconciliar metadados (Gate 4) | médio |
| `20260623135741` | `dev_scaffold_public_clinics` | **ausente** | — | ✓ | `public.clinics` mínimo | DEV-only (não no repo/Principal) | tratar separadamente (Gate 5) | **alto** (conflito c/ P01) |
| (públicas P01–P12 no DEV) | — | — | — | **ausentes** | `public.*` | ausentes no DEV | Gate 5 (aditivo) após auditoria | médio |

> Campos não comprovados: marcar **"a confirmar"** ao complementar (ex.: hashes byte-a-byte,
> conteúdo exato do `dev_scaffold`, origem de `716bbe07`/`aab13a75`).

## 7. Plano de rollback (por categoria)
- **Arquivos do repositório:** reverter o PR/commit (Git); nenhum banco tocado.
- **Metadados de migrations (DEV):** restaurar o snapshot de `schema_migrations` capturado
  no Gate 0/1; **nenhuma DDL** foi alterada.
- **Migrations públicas ausentes (Gate 5):** cada migration aditiva traz rollback próprio
  (`DROP ... IF EXISTS`), aplicável só a objetos **realmente** criados pelo gate.
- **Configuração do PostgREST:** `alter role authenticator reset pgrst.db_schemas; notify pgrst,'reload config'/'reload schema'`.
- **Estruturas do CRM:** **sem rollback destrutivo** — o CRM nunca é recriado/reaplicado;
  rollback = não executar. **Rollback não significa apagar objetos ativos.**

## 8. Aprovações
**Aprovação documental (já concedida):** atualizar o doc 18; criar o doc 20; registrar a
Alternativa 1 como direção.

**Aprovações ainda necessárias (não concedidas):** alterar `supabase/migrations`; criar
arquivos canônicos; mover históricos; executar `migration repair`; aplicar migration no
DEV; qualquer alteração no Principal; alterar CRM; alterar RLS; mesclar PRs. (CRM exige
aprovação específica de **Jefferson** — doc 18 §21 J1–J4.)

## 9. Relação com as PRs
- **PR #6** (`helder/migration-canonicalization-decision`): decisão (doc 18) + plano (doc 20). Draft.
- **PR #7** (`feat/crm-controle-lead`): fundação do Controle de Lead — **não alterar** nesta tarefa.
- **PR #8** (`helder/crm-operational-integration-blueprint`): integração do CRM operacional (doc 19) — **não alterar**.
- **Ordem:** a **canonicalização deve ser resolvida antes** do saneamento e merge da PR #7.

## 10. Arquitetura e impacto no Hub
1. **Problema resolvido:** drift entre repositório, DEV e Principal que impede `db push`
   seguro e reconstrução de ambiente.
2. **Módulo afetado:** governança técnica e infraestrutura do Hub.
3. **Impacto no Hub:** histórico de migrations confiável; fluxo DEV→Principal restaurado;
   reconstrução de ambientes habilitada; CRM intocado.
4. **Entidades/metadados:** arquivos `supabase/migrations`(+archive); `schema_migrations`
   (DEV no Gate 4; Principal não alterado); `public.clinics` + 8 FKs do CRM; manifests em
   `knowledge/migration-history/`. **Nenhum dado de negócio.**
5. **Eventos futuros possíveis (não criar):** `migration_canonicalization_started/completed`,
   `migration_history_repaired`, `migration_drift_detected`.
6. **Tarefas de IA futuras (não criar):** comparar periodicamente Git×DEV×Principal; verificar
   hashes; abrir tarefa humana em divergência; relatório pós-gate.
7. **Indicadores de confiabilidade:** migrations canônicas identificadas; divergências
   resolvidas; ambientes reconciliados; objetos protegidos; migrations reproduzíveis;
   **zero DDL reaplicado indevidamente**; **zero perda de dados**; **zero quebra de RLS**.
8. **Riscos/dependências/aprovação humana:** conflito `dev_scaffold`×P01 (alto); comportamento
   do `migration repair` (testar em descartável); origem de `716bbe07`/`aab13a75` (a confirmar).
   **Toda execução depende de autorização humana explícita por gate** (CRM: Jefferson).
