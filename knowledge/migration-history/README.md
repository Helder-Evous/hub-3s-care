# migration-history — registros históricos de migrations

Esta pasta preserva **evidências documentais** do histórico de migrations do Hub 3S,
extraídas em modo somente-leitura de `supabase_migrations.schema_migrations` nos dois
ambientes Supabase (DEV e principal).

## O que estes arquivos são

- Registros históricos do conteúdo de `statements` de cada migration já aplicada.
- Material de auditoria e rastreabilidade.
- Acompanhados de manifestos com `version`, `name`, contagem de `statements`/`rollback`,
  hash SHA-256 e classificação.

## O que estes arquivos NÃO são

- **Não são scripts aprovados para execução.** Cada arquivo tem extensão `.sql.txt`
  justamente para não ser tratado como migration executável.
- **Não representam o histórico canônico aprovado.** A escolha do histórico canônico
  (canonicalização / Etapa B) depende de nova decisão de Helder ou Jefferson.
- **Não devem ser copiados, renomeados ou movidos para `supabase/migrations/`.**
  Fazer isso pode levar o Supabase a tentar reaplicar DDL já existente.

## Regras de uso

1. Trate o conteúdo como **registro histórico** — não execute.
2. Não promova nenhum arquivo para o diretório ativo de migrations.
3. Qualquer uso destes registros deve consultar antes:
   - `knowledge/16_INVENTARIO_E_BASELINE_DE_MIGRATIONS.md` (inventário e estratégia);
   - `knowledge/17_PRESERVACAO_HISTORICA_DE_MIGRATIONS.md` (esta preservação).
4. O schema `crm` e `public.clinics` são **ativos protegidos** (trabalho de Jefferson e
   objeto compartilhado). Nenhuma versão CRM foi escolhida como canônica nesta tarefa.

## Estrutura

```
migration-history/
├── README.md
├── dev/
│   ├── manifest.md
│   └── statements/        # 12 arquivos .sql.txt (DEV)
└── principal/
    ├── manifest.md
    └── statements/        # 23 arquivos .sql.txt (principal)
```

## Integridade (SHA-256)

O hash de cada arquivo cobre o conteúdo bruto de `statements` — os itens do array unidos
por LF (U+000A), na ordem original, sem newline final. É o mesmo valor calculado no banco
com `encode(digest(array_to_string(statements, E'\n'),'sha256'),'hex')`, permitindo
verificar a fidelidade da preservação a qualquer momento.

Para migrations com mais de um item em `statements` (apenas `20260529143328` no principal,
com 33 itens), o arquivo inclui também uma seção **ITEMIZED STATEMENTS** documental, que
explicita a separação entre cada item do array sem alterar o conteúdo canônico.
