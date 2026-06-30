---
documento: 08_GOVERNANCA_DE_TRABALHO_E_REPOSITORIO
versao: 3.0
data: 2026-06-30
classificacao: L1 — Operacional/Técnico
alteracoes: adicionadas seções 7 (ambientes Supabase), 8 (autoridade temporária) e 9 (formato de autorização) na v2.0; v3.0 acrescenta o ciclo oficial de construção e revisão entre humanos e IAs (seções 10–15), preservando as seções anteriores
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

---

## 10. Ciclo oficial de construção e revisão (humanos + IAs)

Toda evolução relevante do Hub segue este ciclo. O objetivo é reduzir o transporte manual de
contexto, aumentar a rastreabilidade e criar validações automáticas, **sem** retirar a
autoridade humana sobre decisões relevantes (seções 5 e 8).

### Etapa 1 — Intenção de negócio
Helder ou Jefferson define: problema; resultado esperado; usuários afetados; limites; riscos; prioridade.

### Etapa 2 — Arquitetura e especificação
O agente de arquitetura estrutura: proposta; módulo; impacto no Hub; entidades e dados; eventos;
tarefas de IA; indicadores; riscos; critérios de aceite; decisões pendentes.
**Decisões relevantes devem ser registradas na Knowledge Base ou em especificação versionada — o
prompt não pode ser a única fonte da arquitetura.**

### Etapa 3 — Contestação prévia do executor
Antes de implementar, o executor deve: ler a Knowledge Base; verificar o estado real do
repositório; comparar a instrução com o código existente; apontar conflitos; apontar premissas
não comprovadas; identificar excesso de escopo; confirmar o que está autorizado.
**O executor não obedece silenciosamente.** Diante de conflito relevante entre prompt, KB e
repositório, ele registra o conflito e **para antes da implementação**, pedindo decisão humana
(não escolhe silenciosamente uma interpretação).

### Etapa 4 — Autorização humana
Helder ou Jefferson decide: executar; ajustar; adiar; rejeitar. **A IA não autoriza a própria ação.**

### Etapa 5 — Implementação
Em branch própria; escopo delimitado; commits compreensíveis; DEV antes do Principal quando
houver banco; sem alterações extras não autorizadas; com relatório de execução.

### Etapa 6 — Validações determinísticas
Antes de qualquer revisão por IA ou humana: instalação reproduzível; build; typecheck; lint
(quando existir); testes (quando existirem); verificações específicas do módulo; validações de
segurança aplicáveis; conferência dos arquivos alterados. **Testes determinísticos têm prioridade
sobre opiniões de IA.**

### Etapa 7 — Revisão independente
O revisor analisa **diretamente** o diff, o código, os documentos relevantes, os critérios de
aceite, os resultados das validações, os riscos e os itens declarados como não implementados.
**O revisor não confia apenas no resumo do executor** e deve procurar falhas, conflitos e
violações — não apenas confirmar a entrega.

### Etapa 8 — Go/No-Go e memória
Humano decide merge ou correção; a decisão é registrada; a Knowledge Base é atualizada quando
necessário; implementação e validação ficam vinculadas ao PR; próximas tarefas são registradas.

## 11. Estados de uma evolução

Distinguir explicitamente e nunca pular etapas sem autorização humana:

`ideia` → `hipótese` → `proposta` → `decisão aprovada` → `implementação em andamento` →
`implementação concluída` → `implementação validada`; além de `regra substituída` e `item cancelado`.

**Nenhuma IA transforma `proposta` em `decisão aprovada` sem autorização humana explícita.**
A mudança de status documental para "decisão aprovada" exige aprovação humana (ver §14).

## 12. Papéis das IAs

### ChatGPT (ou agente de arquitetura)
Estratégia; arquitetura; linguagem de negócio; especificação; análise de impacto; e revisão
independente **quando não for o executor**.

### Claude Code (ou agente executor)
Leitura da KB; contestação prévia (Etapa 3); implementação; testes; relatório; sinalização de conflitos.

### Agente revisor
Sessão ou agente **separado**; contexto **fresco**; leitura **direta** do repositório; postura
**adversarial**; parecer fundamentado.

### IA Supervisor — futuro (NÃO implementado)
Consolidação de pareceres; classificação de risco; criação de tarefas; escalonamento de exceções;
rastreabilidade. **Ainda não está sendo implementado.**

## 13. Independência e limitações da revisão entre IAs

- Revisão por outro agente **reduz** risco, mas **não elimina** erros.
- Modelos **iguais** podem compartilhar pontos cegos.
- Modelos **diferentes** também podem aceitar a mesma premissa incorreta.
- **Testes determinísticos têm prioridade** sobre opiniões de IA.
- A **autoridade humana** permanece obrigatória nos riscos definidos (§14 e seção 8).
- **GitHub, Knowledge Base e Hub** são os meios oficiais de coordenação entre agentes; **chats
  são áreas temporárias de trabalho** (ver seção 6).

## 14. Níveis de autonomia

> Estes níveis descrevem o **modelo-alvo**. Na fase inicial atual, a seção 8 (autoridade
> temporária) permanece vigente: Helder ou Jefferson autorizam individualmente, e as "Regras que
> permanecem obrigatórias" da seção 8 continuam valendo.

### Alta autonomia (futuro)
Permitida para tarefas: reversíveis; repetitivas; com critérios objetivos; com testes
automáticos; sem dados sensíveis; sem impacto financeiro, jurídico ou contratual.

### Autonomia supervisionada
Para: código funcional; mudanças de UX; automações operacionais; integrações reversíveis;
alterações com rollback claro.

### Aprovação humana obrigatória
Para: migrations; RLS; autenticação; dados pessoais ou de pacientes; mudanças destrutivas;
ambiente Principal; contratos; financeiro; preços; condições comerciais; ações externas de alto
impacto; e **mudança de status documental para "decisão aprovada"**.

## 15. Limites desta formalização

Esta seção formaliza o ciclo, os papéis e a autonomia, mas **não** autoriza por si só: integração
direta entre chats de IA; instalação de apps externos de revisão; revisão automática por IA;
o IA Supervisor; automerge; autoaprovação. Esses itens são evolução futura e exigem autorização
específica.
