---
documento: 17_PRESERVACAO_HISTORICA_DE_MIGRATIONS
versao: 1.0
data: 2026-06-25
classificacao: L1 — Operacional/Técnico
proprietario: Helder e Jefferson
status: Preservação histórica aprovada
implementacao: não autorizada
---

# Preservação Histórica de Migrations

> **Documento de preservação documental. Esta tarefa NÃO canonicaliza o repositório,
> não executa `migration repair`, não altera o diretório ativo `supabase/migrations/`
> e não aplica nada nos bancos. É a Etapa A aprovada no documento 16.**

> **Nota de aprovação.** A Etapa A de preservação documental foi concluída e aprovada. Os
> históricos do DEV e do principal foram preservados como evidência auditável. Esta
> aprovação não escolhe um histórico canônico e não autoriza a Etapa B, `migration repair`,
> alteração de `schema_migrations`, aplicação de migrations ou mudanças nos ambientes.

## 1. Objetivo

Preservar, como evidência histórica versionada, o conteúdo de `statements` de todas as
migrations já registradas nos dois ambientes Supabase (DEV e principal), com hashes que
permitam verificar a integridade da preservação.

A tarefa **não decide qual histórico será canônico** e **não transforma esses arquivos em
migrations executáveis**. Ela apenas cria um registro confiável e auditável, base para a
futura Etapa B (canonicalização), que depende de nova aprovação de Helder ou Jefferson.

## 2. Limites da tarefa

Esta tarefa, explicitamente:

- **não fez nenhuma mudança nos bancos** (DEV ou principal) — somente consultas de leitura;
- **não executou `migration repair`** nem qualquer alteração de `schema_migrations`;
- **não alterou o diretório ativo** `supabase/migrations/`;
- **não decidiu o histórico canônico** (nenhuma versão CRM, pública, DEV ou principal foi
  escolhida como canônica);
- **não aplicou nenhuma migration** em nenhum ambiente;
- **não alterou o schema `crm`** nem `public.clinics`;
- **não alterou RLS, grants, autenticação, dados, código ou integrações.**

Os arquivos gerados têm extensão `.sql.txt` e ficam **somente** em `knowledge/`. Nenhum
arquivo foi criado, movido ou modificado em `supabase/migrations/`.

## 3. Fontes consultadas

| Fonte | Identificação | Método |
|---|---|---|
| GitHub | `Helder-Evous/hub-3s-care` / `supabase/migrations/` | Leitura dos arquivos |
| Supabase DEV | `xcqfdnymadeqeuacqotu` | `execute_sql` somente leitura de `supabase_migrations.schema_migrations` |
| Supabase Principal | `nndvcsdevbxpgsccyimm` | `execute_sql` somente leitura de `supabase_migrations.schema_migrations` |
| Knowledge Base | docs 15 e 16 | Leitura |

Campos lidos de `schema_migrations`: `version`, `name`, `statements`, `rollback`,
`created_by`, `idempotency_key`. **Nenhuma tabela de negócio foi consultada.**

## 4. Resultado do DEV

- **Migrations registradas:** 12.
- **Manifesto:** `knowledge/migration-history/dev/manifest.md`.
- **Arquivos preservados:** 12 em `knowledge/migration-history/dev/statements/` (`.sql.txt`).
- **Hashes:** registrados no manifesto; cada arquivo carrega o SHA-256 no cabeçalho. O
  hash cobre exclusivamente o conteúdo canônico entre os marcadores `BEGIN RAW STATEMENTS`
  e `END RAW STATEMENTS`; cabeçalhos, marcadores e seção `ITEMIZED STATEMENTS` não
  participam do hash.
- **Rollback:** nenhuma migration possui conteúdo em `rollback`.
- **Migrations CRM protegidas:** `crm_001..011` (DEV) preservadas como registro histórico,
  sem qualquer alteração — ativo de Jefferson.
- **Divergências internas:** `dev_scaffold_public_clinics` é exclusivo do DEV.

## 5. Resultado do principal

- **Migrations registradas:** 23.
- **Manifesto:** `knowledge/migration-history/principal/manifest.md`.
- **Arquivos preservados:** 23 em `knowledge/migration-history/principal/statements/` (`.sql.txt`).
- **Hashes:** registrados no manifesto; cada arquivo carrega o SHA-256 no cabeçalho. O
  hash cobre exclusivamente o conteúdo canônico entre os marcadores `BEGIN RAW STATEMENTS`
  e `END RAW STATEMENTS`; cabeçalhos, marcadores e seção `ITEMIZED STATEMENTS` não
  participam do hash.
- **Rollback:** nenhuma migration possui conteúdo em `rollback`.
- **Migrations ausentes no GitHub:** `fix_rls_recursive_hub_users` (`20260604184531`) e
  `create_system_events` (`20260605143042`) — agora preservadas a partir de `statements`.
- **Migration com múltiplos statements:** `20260529143328` (33 itens) — preservada com o
  bloco canônico (LF-join) e uma seção itemizada documental que explicita os 33 itens.

## 6. Comparação DEV × principal × GitHub

### 6.1 Fundação pública (somente no principal e no GitHub)

As migrations de fundação pública existem no principal e têm equivalente no GitHub, em
geral com **timestamps diferentes** (mesma alteração, versão diferente). Não existem no DEV.

| Principal | GitHub equivalente | Relação |
|---|---|---|
| `20260529143328` | `20260529143328` | mesma versão |
| `20260604133039` | `20260604133039` | mesma versão |
| `20260604135414` add_hub_users | `20260604000001` | versão diferente, alteração equivalente |
| `20260604135435` extend_existing_tables | `20260604000002` | versão diferente, alteração equivalente |
| `20260604135449` add_templates_and_volume | `20260604000003` | versão diferente, alteração equivalente |
| `20260604135500` add_indexes | `20260604000004` | versão diferente, alteração equivalente |
| `20260604135513` add_clinic_scores_view | `20260604000005` | versão diferente, alteração equivalente |
| `20260604171237` fase1_base_estrutural | `20260604200001` | versão diferente, alteração equivalente |
| `20260619204324` create_ai_tasks | `20260619000001` | versão diferente, alteração equivalente |
| `20260619204335` evolve_ai_tasks_priority | `20260619000002` | versão diferente, alteração equivalente |
| `20260604184531` fix_rls_recursive_hub_users | — | ausente no GitHub |
| `20260605143042` create_system_events | — | ausente no GitHub |

### 6.2 CRM (DEV e principal; ausente no GitHub)

As 11 migrations CRM existem no DEV e no principal, com **timestamps de versão diferentes**
entre os dois ambientes. Comparando os hashes de `statements`:

| Migration CRM | DEV × Principal (hash) | Observação |
|---|---|---|
| `crm_001_schema_and_grants` | **iguais** | conteúdo histórico idêntico |
| `crm_002_enums_and_lead_sources` | **iguais** | conteúdo histórico idêntico |
| `crm_003_access_model` | **iguais** | conteúdo histórico idêntico |
| `crm_004_helpers_and_rls` | **diferentes** | divergência histórica textual |
| `crm_005_patients` | **diferentes** | divergência histórica textual |
| `crm_006_leads` | **diferentes** | divergência histórica textual |
| `crm_007_lead_activities` | **diferentes** | divergência histórica textual |
| `crm_008_appointments` | **diferentes** | divergência histórica textual |
| `crm_009_budgets` | **diferentes** | divergência histórica textual |
| `crm_010_stage_derivation` | **diferentes** | divergência histórica textual |
| `crm_011_api_grants` | **iguais** | conteúdo histórico idêntico |

> **Importante:** a divergência de hash em `crm_004..010` é **textual/histórica**. O estado
> estrutural final do schema `crm` é equivalente entre DEV e principal (ver doc 16 §7.9).
> Diferença textual de `statements` **não é, por si só, defeito funcional** — é divergência
> histórica a preservar e analisar, nunca a "corrigir" automaticamente.

### 6.3 Versões presentes só no GitHub, com efeitos no principal

Dois arquivos do GitHub **não possuem versão registrada** em `schema_migrations` de nenhum
ambiente, embora seus efeitos estruturais estejam presentes no principal:

- `20260604185143_716bbe07` — colunas `nome_fantasia`, `razao_social`, `cnpj`, `phone`
  existem em `public.clinics`.
- `20260611002357_aab13a75` — policies `authenticated access` existem em `sales`,
  `clinic_products`, `onboardings`, `charges`, `contracts`.

Como **não há registro em `schema_migrations`**, não há `statements` a preservar para essas
duas versões. Elas permanecem como itens de investigação (§8 e doc 16 §7).

## 7. Proteção do CRM

- O schema `crm` (DEV e principal) é **ativo protegido** — trabalho concluído por Jefferson.
- `public.clinics` é **objeto compartilhado protegido**: oito tabelas CRM possuem FK para
  `public.clinics(id)` (confirmado no doc 16 §8).
- Os arquivos `.sql.txt` em `migration-history/` são **registros históricos, não scripts
  aprovados para execução**.
- **Nenhuma versão CRM foi escolhida como canônica** nesta tarefa. A divergência textual de
  `crm_004..010` foi apenas **registrada**, não resolvida.

## 8. Pendências

### Fatos confirmados
- DEV: 12 migrations; principal: 23 migrations (contagens reconfirmadas nesta tarefa).
- Nenhuma migration possui `rollback`.
- `crm_001/002/003/011` têm `statements` idênticos entre DEV e principal (hash igual).
- `crm_004..010` têm `statements` textualmente divergentes entre DEV e principal (hash diferente).
- `fix_rls_recursive_hub_users` e `create_system_events` existem só no principal e foram preservadas.

### Hipóteses (não confirmadas)
- A divergência de timestamps GitHub × principal decorre de aplicação via Lovable/manual
  com renomeação de versão (ver doc 16 §7).
- Os efeitos de `716bbe07` e `aab13a75` podem ter sido absorvidos por outras migrations.

### Itens cuja origem ainda não foi determinada
- Caminho exato pelo qual as colunas de `716bbe07` chegaram ao principal — *efeito presente
  com origem não confirmada*.
- Caminho exato pelo qual as policies de `aab13a75` chegaram ao principal — *efeito presente
  com origem não confirmada*.

### Arquivos que não puderam ser preservados por possível conteúdo sensível
- **Nenhum.** A varredura de segurança não encontrou senha, token, chave de API, secret,
  string de conexão com credencial, JWT ou chave privada. As ocorrências do termo
  `service_role` são **nome de role padrão do Supabase** em comandos `GRANT`, e
  `access_token_hint` é **nome de coluna** — não há valores sensíveis. `created_by`
  contém um identificador corporativo de auditoria. Esse valor não foi incluído nos
  arquivos históricos, manifestos ou cabeçalhos, por não ser necessário para a preservação
  documental.

## 9. Próxima decisão (Etapa B — não executada aqui)

A canonicalização futura deverá decidir entre:

- **principal como histórico canônico** (provável melhor caminho, conforme doc 16 §10);
- **DEV CRM como histórico canônico**;
- **manutenção temporária dos históricos divergentes** com novo marco.

**Nenhuma dessas opções é escolhida ou executada nesta tarefa.** A decisão depende de
autorização explícita de Helder ou Jefferson e, para os arquivos CRM, de Jefferson.

## 10. Critérios de aceite

- [x] Os dois históricos (DEV e principal) estão preservados.
- [x] Versões e nomes estão registrados nos manifestos e nos cabeçalhos dos arquivos.
- [x] Hashes SHA-256 permitem verificar a integridade da preservação.
- [x] Nenhum arquivo foi colocado em `supabase/migrations/`.
- [x] Nenhum banco foi alterado (somente leitura).
- [x] Nenhum segredo foi exposto.
- [x] Nenhum objeto CRM foi alterado.
- [x] Nenhuma decisão de canonicalização foi executada.

## 11. Implementação não autorizada

Este documento **não autoriza a Etapa B** (canonicalização, `migration repair`, alteração
de histórico, aplicação de migrations ou qualquer mudança em DEV, principal, `supabase/migrations/`,
schema `crm`, `public.clinics`, RLS, grants, autenticação, dados, código ou integrações).
É exclusivamente preservação documental, aprovada como Etapa A no documento 16.
