---
title: Exposição do schema crm no PostgREST
doc_id: "15_CRM_POSTGREST_EXPOSURE"
version: 1.0.0-draft
date: 2026-06-26
status: Rascunho local de engenharia — runbook operacional
classification: Interno — Engenharia / Infra
module: Controle de Lead
schema: crm
project: nndvcsdevbxpgsccyimm
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 14_CONTROLE_DE_LEAD_FRONTEND.md
---

# Exposição do schema `crm` no PostgREST (runbook)

> O frontend consulta `supabase.schema("crm")`. Para o PostgREST aceitar isso, o schema `crm`
> precisa estar nos **Exposed schemas**. Este doc registra o problema, a solução aplicada e como operar.

## 1. Problema encontrado
Ao consultar `crm` pela API, o PostgREST retornava:
```json
{ "code": "PGRST106", "message": "Invalid schema: crm",
  "hint": "Only the following schemas are exposed: public, graphql_public" }
```
HTTP **406**.

## 2. Causa
O schema `crm` **não estava de fato exposto**. A tentativa anterior pelo Dashboard
(*Settings → API → Exposed schemas*) **não persistiu**: o GUC `pgrst.db_schemas` estava
**ausente** no papel `authenticator` (a config não foi escrita/propagada ao PostgREST em execução).

## 3. Solução aplicada (no projeto principal)
Override in-database do PostgREST, gravado direto no papel que ele lê:
```sql
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, crm';
notify pgrst, 'reload config';   -- recarrega a config (lista de schemas)
notify pgrst, 'reload schema';   -- recarrega o cache de tabelas (necessário p/ schema novo)
```
> Foram necessários **os dois** `notify`: o `reload config` atualizou a lista de schemas, mas o
> `reload schema` foi preciso para o cache de tabelas reconhecer `crm.*` (senão, PGRST205).

## 4. Diferença entre os erros
| Código | HTTP | Significado | Ação |
|---|---|---|---|
| **PGRST106** | 406 | `Invalid schema: crm` — `crm` não está nos Exposed schemas | aplicar `db_schemas` + `reload config` |
| **PGRST205** | 404 | schema ok, mas a **tabela não está no schema cache** | `notify pgrst, 'reload schema'` |
| **42501** | 401 | `permission denied for schema crm` — schema servido, mas o papel (ex.: `anon`) não tem `USAGE`/grant | **esperado** (gating de RLS/grants); não é bug |

→ Sucesso = **PGRST106 desaparece**; `anon` passa a receber `42501` (negação segura), e o operador autenticado lê sob RLS.

## 5. Como validar
Probe REST (anon, sem sessão), esperando `42501` (e **não** PGRST106/205):
```bash
curl -s 'https://nndvcsdevbxpgsccyimm.supabase.co/rest/v1/leads?select=id&limit=1' \
  -H 'apikey: <PUBLISHABLE_KEY>' -H 'Accept-Profile: crm'
```
Conferir o GUC no banco:
```sql
select s from pg_roles r, unnest(r.rolconfig) s
where r.rolname='authenticator' and s like 'pgrst.db_schemas%';
-- esperado: pgrst.db_schemas=public, graphql_public, crm
```

## 6. Risco de sobrescrita pelo Dashboard
`ALTER ROLE ... SET` é **persistente** (catálogo `pg_db_role_setting`, sobrevive a restart).
**Porém**, alterar os *Exposed schemas* pelo **Dashboard** futuramente pode **sobrescrever** este GUC.
Se o PGRST106 voltar, reaplicar a seção 3 (ou ajustar pelo Dashboard de forma consistente).

## 7. Como desfazer
```sql
alter role authenticator reset pgrst.db_schemas;
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
```
Volta ao default da plataforma (`public, graphql_public`) — o `crm` deixa de ser servido.
