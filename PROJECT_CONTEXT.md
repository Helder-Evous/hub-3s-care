# PROJECT_CONTEXT.md — Hub 3S

> **Este arquivo foi transformado em documento de compatibilidade e entrada histórica.**
>
> A fonte canônica de conhecimento do Hub 3S é a pasta `/knowledge`.
> Toda IA, desenvolvedor ou ferramenta deve começar por:
>
> **`knowledge/AI_BOOTSTRAP_CONTEXT.md`**
>
> Este arquivo não deve ser removido nem atualizado. Ele preserva decisões tomadas durante
> a fase inicial do projeto e serve como referência histórica para entender a origem da
> arquitetura atual.

---

## O que aconteceu com o conteúdo deste arquivo

O conteúdo foi analisado e classificado em 2026-06-24. Veja a tabela abaixo.

| Seção | Destino |
|---|---|
| §1 Visão geral da 3S e do Hub | Incorporado em `knowledge/00_MASTER_CONTEXT_3S.md` |
| §2 Visão de longo prazo | Incorporado em `knowledge/00_MASTER_CONTEXT_3S.md` e `knowledge/10_ROADMAP_DO_HUB.md` |
| §3 Produtos da 3S | Incorporado em `knowledge/02_PORTFOLIO_E_CLIENTE_IDEAL.md` |
| §3 CRM Chips/Canais — lista de telas | Mantido aqui como histórico (telas do MVP inicial) |
| §4 Roadmap MVP (fases 1–4) | Obsoleto; substituído por `knowledge/10_ROADMAP_DO_HUB.md` (estado atual) |
| §5 Stack tecnológica | Incorporado em `knowledge/13_ARQUITETURA_TECNICA.md` |
| §6 Princípios arquiteturais (modularidade, integrações, IA First) | Incorporado em `knowledge/13_ARQUITETURA_TECNICA.md` e `knowledge/06_ARQUITETURA_AI_FIRST.md` |
| §6 "Um único Supabase" | **Obsoleto e conflitante.** Existem dois projetos: DEV (`xcqfdnymadeqeuacqotu`) e principal (`nndvcsdevbxpgsccyimm`). Ver `knowledge/08_GOVERNANCA_DE_TRABALHO_E_REPOSITORIO.md` §7 |
| §7 "Priorizar o Produto CRM" | **Obsoleto.** CRM Chips/Canais já está concluído. Roadmap atualizado em `knowledge/10_ROADMAP_DO_HUB.md` |
| §7 "Este arquivo é lei" | **Conflitante.** A fonte canônica é `/knowledge`. Este arquivo é histórico. |
| §7 Demais regras (não retrabalho, não misturar módulos, evolução futura) | Incorporado em `knowledge/07_PADRAO_DE_MODULOS_DO_HUB.md` e `knowledge/13_ARQUITETURA_TECNICA.md` |
| §8 Histórico de decisões técnicas | Incorporado em `knowledge/13_ARQUITETURA_TECNICA.md` §6 |
| §4 "RLS pública para MVP" | **Obsoleto.** Autenticação e RLS com policies reais já estão em produção. |

---

## Conteúdo histórico preservado

### Telas do Pilar CRM / Chips e Canais (MVP 2026-05)

Lista de telas construídas durante a fase de MVP do Pilar 1 (Chips/Canais):

- Dashboard executivo
- Lista de clínicas com scores de contingência e comunicabilidade
- Detalhe por clínica (canais, contingência, alertas, templates, volume)
- Inventário de canais
- Monitoramento de templates Meta
- Volume API Oficial
- Matriz de contingência
- Central de alertas
- Modo TV (fullscreen para operações)

Estas telas constituíam o escopo do Pilar 1 conforme definido em 2026-05.
O estado atual do módulo CRM deve ser consultado diretamente no repositório e no Hub.

### Roadmap original de fases (2026-05 a 2026-06)

Registrado aqui como memória de intenção. O estado real de cada item deve ser
consultado em `knowledge/10_ROADMAP_DO_HUB.md`.

**Fase 1 — CRM Chips/Canais:** concluída. Autenticação, clientes, produtos,
onboarding, events, ai_tasks e módulo CRM em produção.

**Fase 2 — Disparos e Campanhas:** prevista; ver roadmap atual.

**Fase 3 — Resultados CRM:** prevista; ver roadmap atual.

**Fase 4 — Demais módulos:** ordem de prioridade a ser definida com liderança.

---

*Arquivo preservado em: 2026-06-24*
*Última atualização original: 2026-06-04 — Versão 0.1 MVP Chips/Canais*
