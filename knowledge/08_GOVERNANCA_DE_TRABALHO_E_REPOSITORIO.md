---
documento: 08_GOVERNANCA_DE_TRABALHO_E_REPOSITORIO
versao: 1.0
data: 2026-06-22
classificacao: L1 — Operacional/Técnico
---

# Governança de Trabalho: Helder, Jefferson e IAs

## 1. Fontes oficiais

- **Código:** GitHub `hub-3s-care`.
- **Dados:** Supabase `nndvcsdevbxpgsccyimm`.
- **Visualização/espelho:** `custom-data-buddy` / Lovable.
- **Conhecimento institucional:** pasta `/knowledge`.
- **Decisões históricas:** `11_ORGANIZATIONAL_MEMORY.md` e, futuramente, tabelas de memória do Hub.

## 2. Papéis de construção

### Helder
Trabalha na espinha dorsal: estratégia, produtos, cultura, knowledge base, regras de decisão, arquitetura AI-first e aprovações de alto impacto.

### Jefferson
Trabalha em módulos operacionais: CRM/agendamentos, relatórios, processos, dashboards, qualidade de entrega e integrações de rotina.

## 3. Branches

- `main`: estável e oficial.
- `helder/nome-da-entrega`: arquitetura/conhecimento.
- `jefferson/nome-do-modulo`: operação/módulos.
- Pull request obrigatório antes de merge em `main`.

## 4. Rotina mínima

1. Definir uma entrega por pessoa.
2. Criar/atualizar o brief do módulo.
3. Trabalhar em branch própria.
4. Revisar impacto em eventos/tarefas/dados.
5. Abrir PR.
6. Atualizar documentação e memória quando a decisão alterar regra, produto ou processo.

## 5. Uso de IA

- ChatGPT: estratégia, arquitetura, linguagem de negócio e estrutura de conhecimento.
- Claude Chat/Artifacts: protótipo visual quando necessário.
- Claude Code: implementação no repositório real.
- Qualquer IA deve ler `AI_BOOTSTRAP_CONTEXT.md` e documentos relevantes antes de agir.

## 6. Regra de contexto

Chats são áreas de trabalho, não a memória institucional. A memória da empresa fica no repositório e no Hub.
