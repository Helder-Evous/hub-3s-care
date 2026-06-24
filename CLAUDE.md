# Hub 3S — Instruções permanentes do projeto

Antes de planejar ou alterar o Hub 3S:

1. Leia `knowledge/AI_BOOTSTRAP_CONTEXT.md`.
2. Para qualquer módulo novo, leia `knowledge/07_PADRAO_DE_MODULOS_DO_HUB.md`.
3. Para decisões de negócio, leia `knowledge/05_REGRAS_DE_DECISAO_E_APROVACOES.md`.
4. Para regras técnicas e de trabalho em equipe, leia `knowledge/08_GOVERNANCA_DE_TRABALHO_E_REPOSITORIO.md`.

Regras inegociáveis:
- `knowledge/` é fonte de contexto e política; Supabase e integrações são fontes de dados vivos.
- Não invente preços, SLAs, responsáveis, dados de cliente, status ou regras.
- Preserve a arquitetura: cliente mestre → produto contratado → onboarding → operação → eventos → tarefas → aprovação → auditoria.
- Não criar módulo isolado: siga o contrato de módulo e defina entidades, eventos, tarefas, indicadores, integrações e responsável.
- Não alterar banco de dados sem migration, RLS e validação.
- Nunca colocar credenciais, service role, senhas ou dados pessoais sensíveis no front-end, código versionado ou documentos públicos.
- Decisões relevantes não entram diretamente na memória oficial. Ideias, hipóteses, sugestões e propostas não são decisões aprovadas. Ao identificar uma possível decisão relevante, prepare uma proposta de registro; a decisão só entra em `knowledge/11_ORGANIZATIONAL_MEMORY.md` após autorização explícita de Helder ou Jefferson, sempre via branch e Pull Request. A IA nunca pode alterar diretamente a `main` nem autorizar a própria proposta. Enquanto o pipeline automático de governança do conhecimento não existir, só registre decisão quando a autorização estiver explícita na conversa ou tarefa atual.
- Ao encontrar lacunas, consulte `knowledge/12_GAPS_E_VALIDACOES.md`; não preencha com suposições.
