---
documento: CRM-MESTRE-VOL3-UX-KPIS
titulo: "Documento Mestre CRM Hub 3S — Volume 3: UX Operacional e KPIs"
versao: 1.0 (Draft Consolidado)
data: 2026-07-01
classificacao: OFICIAL — Fonte única de verdade do módulo CRM
contem_ids: [CRM-UX-001, CRM-KPI-001]
origem: DOCUMENTO_MESTRE_CRM_HUB3S_VOLUME_3_UX_E_KPIS.docx
status: Vigente (oficializado por decisão da Direção em 2026-07-01)
nota: >
  Transcrição fiel do volume oficial. Substitui qualquer versão anterior das mesmas
  regras (CRM-UX-001 / CRM-KPI-001).
---

# DOCUMENTO MESTRE CRM HUB 3S — VOLUME 3: UX OPERACIONAL E KPIs
**Versão 1.0 (Draft Consolidado)**

## CRM-UX-001 — Experiência Operacional
A interface representa a operação. **Nunca define regras de negócio.**

### Princípios
- O CRM é um sistema operacional.
- O Kanban representa trabalho pendente.
- O CRC deve identificar a próxima ação em poucos segundos.
- A interface deve reduzir cliques sem perder rastreabilidade.

### Kanban Oficial
Novo Lead · Agendado · Remarcar · Compareceu · Perdido.

### Regras de Movimentação
- Novo Lead → Agendado abre **modal obrigatória de data e hora**.
- Sem tentativa elegível, **criar tentativa automática**.
- Compareceu e Perdido **encerram a jornada**.
- Compareceu e Perdido são **arquivados automaticamente após 24 horas**.
- Reativação ocorre apenas por funcionalidade específica.
- **Importações seguem as mesmas regras das movimentações manuais.**

### Card Operacional
Nome do Lead · Telefone · Clínica · **Origem (sempre)** · **Campanha (quando existir)** ·
Responsável · **Presença operacional** · **Prioridade calculada pelo sistema** ·
**Tentativas (sempre visíveis)** · **Tempo parado** · Próxima ação em destaque · Botão Abrir.

### Visão do CRC
Fila operacional pessoal · Próxima ação · Leads parados · Comparecimentos do dia · Prioridades.

### Visão do Gestor
Visão completa da clínica · Redistribuição de responsáveis · Produtividade por CRC ·
Reativação e arquivamento · Indicadores operacionais.

## CRM-KPI-001 — Indicadores Oficiais
Todos os dashboards e premiações utilizam **exclusivamente** estes indicadores.

### KPIs Estratégicos
- Comparecimentos (**principal KPI do CRM**)
- Tempo até o primeiro contato
- Tempo até o agendamento
- Tempo até o comparecimento
- Leads perdidos
- Leads reativados

### KPIs Operacionais
- Tentativas totais
- Tentativas por CRC
- Agendamentos
- Confirmações
- Faltas
- Remarcações
- Leads parados
- Produtividade do CRC

### KPIs de Marketing
- Leads por Origem
- Leads por Campanha
- Comparecimento por Origem
- Comparecimento por Campanha
- Receita por Origem
- Receita por Campanha

### KPIs Financeiros
- Receita Total
- Receita por Lead
- Ticket Médio
- Receita por Clínica

### Premiação
A premiação deverá priorizar **comparecimentos e produtividade**. Receita é indicador
complementar e nunca substitui o objetivo operacional do CRM.

## Observação
Este volume define a experiência do usuário e a mensuração de resultados. O Volume 4
consolida a Arquitetura AI-First, o AI Bootstrap e o Prompt Oficial do Claude Code.
