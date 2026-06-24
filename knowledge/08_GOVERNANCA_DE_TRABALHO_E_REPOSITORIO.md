---
documento: 08_GOVERNANCA_DE_TRABALHO_E_REPOSITORIO
versao: 2.0
data: 2026-06-24
classificacao: L1 — Operacional/Técnico
alteracoes: adicionadas seções 7 (ambientes Supabase), 8 (autoridade temporária) e 9 (formato de autorização)
---

# Governança de Trabalho: Helder, Jefferson e IAs

## 1. Fontes oficiais

- **Código:** GitHub `hub-3s-care`.
- **Dados operacionais:** Supabase principal `nndvcsdevbxpgsccyimm`.
- **Ambiente de desenvolvimento:** Supabase DEV `xcqfdnymadeqeuacqotu`.
- **Visualização/espelho:** `custom-data-buddy` / Lovable (recebe push de `main` via GitHub Action).
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
- `claude/nome-da-entrega`: entregas geradas por IA (Claude Code).
- Pull request obrigatório antes de merge em `main`. Nenhuma alteração direta em `main`.

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

## 7. Ambientes Supabase e governança de migrations

### Projetos

| Ambiente | Project ID | Uso |
|---|---|---|
| DEV | `xcqfdnymadeqeuacqotu` | Desenvolvimento, testes de migration e validação |
| Principal | `nndvcsdevbxpgsccyimm` | Ambiente oficial em operação |

### Fluxo obrigatório

1. Desenvolver em branch Git.
2. Criar migration versionada em `supabase/migrations/`.
3. Aplicar e testar no DEV.
4. Executar validações: RLS, advisors, integridade referencial.
5. Revisar Pull Request.
6. Obter autorização humana na alçada correta (seção 8).
7. Aplicar a **mesma migration validada** no ambiente principal.
8. Executar validação pós-aplicação.

Proibido reproduzir manualmente no principal uma alteração feita no DEV. A migration versionada é o único veículo autorizado.

## 8. Autoridade temporária — fase inicial do Hub

Durante a fase inicial de construção do Hub 3S, **Helder ou Jefferson podem, individualmente, autorizar qualquer mudança necessária no projeto**, incluindo:

- estratégia e arquitetura;
- Knowledge Base e regras de IA;
- produtos, preços e condições comerciais;
- módulos operacionais;
- frontend e backend;
- banco de dados e migrations;
- autenticação, RLS e segurança;
- entidades centrais ou compartilhadas;
- integrações externas;
- alterações aditivas, estruturais ou destrutivas;
- aplicação no ambiente DEV;
- promoção de alterações validadas para o ambiente principal;
- qualquer outra mudança necessária à evolução do Hub.

A autorização de apenas um dos dois é suficiente. Não é necessária aprovação conjunta, salvo quando Helder ou Jefferson declararem explicitamente que determinada decisão exige alinhamento entre ambos.

**Em caso de conflito entre Helder e Jefferson:** a IA não escolhe qual prevalece. Deve interromper a ação ainda não executada, registrar o conflito e solicitar alinhamento entre os dois.

Esta regra é temporária. Futuramente, as permissões e alçadas serão controladas pelo cadastro mestre de pessoas, papéis, responsabilidades e políticas de aprovação.

### Regras que permanecem obrigatórias mesmo com autorização

1. A IA nunca pode autorizar a própria ação.
2. Alterações de banco devem usar migration versionada.
3. Alterações devem ser aplicadas e testadas primeiro no DEV, salvo autorização explícita em contrário.
4. A mesma migration validada no DEV deve ser utilizada no ambiente principal.
5. Nenhuma alteração direta em `main`.
6. Mudanças relevantes devem passar por branch, commit e Pull Request.
7. Credenciais, dados sensíveis e service role nunca expostos.
8. Alterações destrutivas devem possuir backup, validação de impacto ou plano de rollback.
9. O relatório deve identificar claramente qual ambiente foi alterado.
10. A autorização para uma ação não autoriza automaticamente outras mudanças fora do escopo informado.

## 9. Formato de registro de autorização

Toda autorização deve ser explícita e registrada, contendo quando aplicável:

- **Quem autorizou:** Helder ou Jefferson.
- **Qual alteração foi autorizada:** descrição clara do escopo.
- **Ambiente autorizado:** DEV, principal ou ambos.
- **Migration, branch ou Pull Request relacionado.**
- **Riscos identificados.**
- **Validações realizadas.**
- **Resultado da execução.**
- **Plano de rollback** para alterações relevantes.
