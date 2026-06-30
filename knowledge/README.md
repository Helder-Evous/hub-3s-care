# Knowledge Base — HUB 3S (local)

> **A Knowledge Base oficial da 3S é externa a este repositório** e será sincronizada para cá posteriormente. Esta pasta `knowledge/` ainda **não** contém a KB oficial — são **documentos locais de engenharia** do módulo Controle de Lead.
>
> O arquivo [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) (raiz) é um documento de contexto legado **dentro** do repo e **não** é a fonte de verdade da Knowledge Base — não deve ser tratado como substituto da estrutura `knowledge/` oficial.

## Conteúdo atual (rascunhos locais de engenharia)

| # | Documento | Tipo | Estado |
|---|---|---|---|
| 13 | [Controle de Lead — Domain Model](13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md) | Domínio | Atualizado — inclui seção 0 (estado **implementado**, migrations 001–011) |
| 14 | [Controle de Lead — Operação Frontend](14_CONTROLE_DE_LEAD_FRONTEND.md) | Frontend | Novo — rotas, feature, board/novo lead/detalhe/atividades, DnD visual |
| 15 | [Exposição do schema crm no PostgREST](15_CRM_POSTGREST_EXPOSURE.md) | Infra/Runbook | Novo — PGRST106/205/42501, `pgrst.db_schemas`, validar/desfazer |
| 16 | [Dados de teste no projeto principal](16_CRM_DADOS_DE_TESTE.md) | Dados | Novo — `[SEED]`/`[TESTE UI]`, impacto em KPIs, cleanup sob autorização |
| 17 | [crm-types.ts temporário](17_CRM_TYPES_TEMPORARIO.md) | TypeScript | Novo — limitação da geração, drift, plano de substituição |
| ADR-0001 | [Drag & Drop persistente (não aprovado)](ADR-0001_DND_PERSISTENTE.md) | Decisão (ADR) | Novo — DnD apenas visual; condição para aprovar |
| ADR-0002 | [Kanban como Projeção Operacional](ADR-0002_KANBAN_COMO_PROJECAO_OPERACIONAL.md) | Decisão (ADR) | Novo — board reflete a próxima ação do CRC (S2-0, PR #9) |
| ADR-0003 | [Kanban como Mesa Operacional do CRC](ADR-0003_KANBAN_COMO_MESA_OPERACIONAL_DO_CRC.md) | Decisão (ADR) | Novo — `Efetivou` deixa de ser coluna; colunas oficiais do CRC |
| ADR-0004 | [Dono do Comparecimento](ADR-0004_DONO_DO_COMPARECIMENTO.md) | Decisão (ADR) | Novo — crédito do comparecimento; bloqueado por gap (`appointments.created_by`) |
| 18 | [Roadmap pós-MVP](18_CRM_ROADMAP.md) | Planejamento | Atualizado — consolidação 2026-06-30 (gaps/migrations) |
| 19 | [Gestão de Unidades CRC](19_CRM_GESTAO_DE_UNIDADES_CRC.md) | Domínio | Novo — alocação CRC×unidade com vigência/histórico (gap) |
| 20 | [Importações e Status Operacionais](20_CRM_IMPORTACOES_E_STATUS_OPERACIONAIS.md) | Domínio | Novo — importação de leads e de agenda (conceito) |
| 21 | [Experiência do Cliente](21_EXPERIENCIA_DO_CLIENTE.md) | Domínio | Novo — módulo transversal de visão/acesso do cliente (conceito) |
| 22 | [Dashboard Configurável do Cliente](22_DASHBOARD_CONFIGURAVEL_DO_CLIENTE.md) | Domínio | Novo — widgets/KPIs/permissões do cliente (conceito) |

> Todos os documentos acima são **locais de engenharia** (rascunhos), não a KB oficial. Numeração e
> padrão de frontmatter podem mudar na reconciliação com a KB oficial da 3S.

## Pendências de sincronização

- Importar a KB oficial da 3S (estrutura numerada: `00_MASTER_CONTEXT_3S.md`, `06_ARQUITETURA_AI_FIRST.md`, `07_PADRAO_DE_MODULOS_DO_HUB.md`, etc.), hoje **inexistente** neste repositório.
- Reconciliar os rascunhos `13`–`18` + `ADR-0001`/`ADR-0002` com a versão e o padrão oficiais quando a sincronização ocorrer.
- Confirmar com a liderança a numeração canônica (os slots `13`–`18` são provisórios).
