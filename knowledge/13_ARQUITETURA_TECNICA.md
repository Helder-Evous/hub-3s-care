---
documento: 13_ARQUITETURA_TECNICA
versao: 1.0
data: 2026-06-24
classificacao: L1 — Operacional/Técnico
proprietario: Helder
origem: incorporado de PROJECT_CONTEXT.md §5, §6 e §8 (2026-06-04)
---

# Arquitetura Técnica do Hub 3S

## 1. Stack tecnológica

| Tecnologia | Papel |
|---|---|
| **TanStack Start v1** | Meta-framework full-stack com SSR. Define estrutura, rotas e server functions. |
| **TanStack Router** | Roteamento file-based com type-safety total. Cada arquivo em `src/routes/` vira uma rota automaticamente. |
| **TanStack Query** | Estado server-side: cache, deduplicação, background sync, sincronização com Supabase. |
| **React 19** | Biblioteca de UI. |
| **TypeScript 5.8** | Strict mode. Tipos gerados automaticamente do schema Supabase. |
| **Tailwind CSS v4** | Estilização utilitária. Design system baseado em tokens (success, warning, critical, primary, muted). |
| **Radix UI + shadcn/ui** | Componentes acessíveis sem estilo próprio. Base do design system. |
| **Supabase** | Backend: PostgreSQL, autenticação, Row Level Security, Realtime, Storage. Fonte de verdade dos dados. |
| **Nitro** | Servidor SSR. Target Cloudflare Workers. Gerencia server functions e middleware de autenticação. |
| **Vite 7** | Build tool configurado via preset Lovable com suporte a TanStack, Tailwind e paths. |
| **Bun** | Package manager e runtime. |
| **GitHub** | Versionamento. Integração com Claude Code (desenvolvimento) e Lovable (visualização/espelho via GitHub Action em `main`). |
| **Claude Code** | Agente de desenvolvimento no repositório real. |
| **Lovable** | Plataforma de visualização e espelho do projeto. Sincronização confirmada via GitHub Action `.github/workflows/mirror-to-lovable.yml`, que faz push de `main` para o repositório espelho `Helder-Evous/custom-data-buddy` a cada push em `main`. |

## 2. Ambientes Supabase

| Ambiente | Project ID | Uso |
|---|---|---|
| **DEV** | `xcqfdnymadeqeuacqotu` | Desenvolvimento e testes de migration |
| **Principal (PROD)** | `nndvcsdevbxpgsccyimm` | Ambiente oficial em operação |

**Fluxo obrigatório de migration:**

1. Desenvolver em branch Git.
2. Criar migration versionada em `supabase/migrations/`.
3. Aplicar e testar no ambiente DEV.
4. Executar validações: RLS, advisors, integridade referencial.
5. Revisar Pull Request.
6. Obter autorização humana na alçada correta (ver `08_GOVERNANCA_DE_TRABALHO_E_REPOSITORIO.md`).
7. Aplicar a **mesma migration validada** no ambiente principal.
8. Executar validação pós-aplicação.

Proibido reproduzir manualmente no principal uma alteração feita no DEV: a migration versionada é o único veículo autorizado.

## 3. Organização do código-fonte

### Módulos por produto/setor

Cada produto ou setor da 3S é um módulo independente:

```
src/
  features/
    <modulo>/
      types.ts         # tipos de domínio do módulo
      queries.ts       # leituras do Supabase (TanStack Query)
      mutations.ts     # escritas no Supabase
      components/      # componentes exclusivos do módulo
  routes/
    <modulo>/          # rotas file-based do módulo
  integrations/
    supabase/
      types.ts         # gerado automaticamente pelo Supabase MCP
  lib/                 # utilitários compartilhados
  components/          # componentes shared (AppShell, etc.)
```

### Regras de organização

- Lógica de integração externa sempre em `features/<modulo>/` ou `integrations/`, nunca inline em componentes.
- Variáveis de ambiente para todas as credenciais externas.
- Server functions para qualquer chamada que exija chave secreta.
- Tipos bem definidos para dados vindos de APIs externas.
- Módulos não se importam entre si diretamente. Dados compartilhados passam pela camada `shared/` ou por API intermediária.
- Componentes shared são genéricos o suficiente para servir qualquer módulo.

## 4. Princípios de escalabilidade

- Migrations sempre aditivas; nunca `DROP` sem planejamento, validação e backup.
- Novos módulos adicionam pastas, não alteram as existentes.
- Toda tabela nova exige migration versionada, RLS e owner definido.
- Não escrever dado crítico apenas em tela ou localStorage.
- Não acoplar módulo a uma pessoa específica: usar responsáveis configuráveis.

## 5. Convenções de qualidade

- Reutilizar antes de criar: verificar componentes shared e funções de cálculo existentes.
- Não duplicar tipos de domínio entre módulos.
- Estrutura de dados deve ser interpretável por IA sem contexto humano adicional.
- Checagens manuais devem virar automações; relatórios devem ser gerados automaticamente.

## 6. Histórico de decisões técnicas

| Data | Decisão | Motivo |
|---|---|---|
| 2026-05 | Stack: TanStack Start + Supabase + Tailwind v4 | Escalabilidade, SSR nativo, tipagem end-to-end, Lovable-compatible |
| 2026-05 | File-based routing com TanStack Router | Módulos viram pastas; sem configuração manual de rotas |
| 2026-05 | Mock-data-first para telas de MVP | Permite construir e validar UI antes da infra do banco estar completa |
| 2026-05 | RLS pública para MVP inicial | Acesso interno somente, sem clientes externos — decisão temporária, superada em 2026-06 |
| 2026-06 | `src/features/<modulo>/` como convenção de módulo | Isola domínios; facilita migração mock → Supabase sem tocar nas rotas |
| 2026-06 | Dois ambientes Supabase (DEV + Principal) | Separação de risco entre desenvolvimento/testes e produção |
