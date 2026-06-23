---
documento: 07_PADRAO_DE_MODULOS_DO_HUB
versao: 1.0
data: 2026-06-22
classificacao: L1 — Operacional/Técnico
---

# Padrão Obrigatório para Módulos do Hub

Nenhum módulo novo pode nascer isolado. Todo módulo deve se conectar ao Hub por dados, eventos, tarefas, métricas e responsabilidades.

## Checklist obrigatório

1. Nome e objetivo do módulo.
2. Produto/área relacionada.
3. Cliente ou entidade mestre usada.
4. Dados que lê e grava.
5. Entidades/tabelas próprias.
6. Eventos que gera.
7. Tarefas de IA que pode gerar.
8. Indicadores.
9. Responsável operacional.
10. Ações que exigem aprovação.
11. Integrações externas.
12. Riscos e dados sensíveis.
13. Telas/rotas.
14. Critérios de aceite.
15. Plano de migração/rollback quando houver alteração relevante.

## Integrações obrigatórias

- Cliente deve referenciar cadastro mestre; não duplicar clínica.
- Produto deve vincular-se a `clinic_products`/produto contratado.
- Fatos relevantes devem ir para `system_events`.
- Próximas ações automatizáveis devem ser representadas em `ai_tasks`.
- Métricas devem aparecer em área apropriada de Operações ou Gestão.
- Toda alteração relevante deve poder ser auditada.

## Convenções

- Não escrever dado crítico apenas em tela/local storage.
- Não criar tabela sem migration, RLS e owner.
- Não acoplar módulo a uma pessoa específica: usar responsáveis configuráveis.
- Não usar service role no frontend.
- Não executar ação externa sensível sem política e trilha de auditoria.
