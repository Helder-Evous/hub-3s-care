---
documento: CRM-MESTRE-VOL4-IA-BOOTSTRAP
titulo: "Documento Mestre CRM Hub 3S — Volume 4: IA, Bootstrap e Prompt Oficial"
versao: 1.0 (Draft Consolidado)
data: 2026-07-01
classificacao: OFICIAL — Fonte única de verdade do módulo CRM
contem_ids: [CRM-IA-001, AI_BOOTSTRAP, PROMPT_OFICIAL]
origem: DOCUMENTO_MESTRE_CRM_HUB3S_VOLUME_4_IA_BOOTSTRAP_PROMPT.docx
status: Vigente (oficializado por decisão da Direção em 2026-07-01)
nota: >
  Transcrição fiel do volume oficial. Substitui qualquer versão anterior das mesmas
  regras (CRM-IA-001 / AI_BOOTSTRAP / Prompt Oficial).
---

# DOCUMENTO MESTRE CRM HUB 3S — VOLUME 4: IA, BOOTSTRAP E PROMPT OFICIAL
**Versão 1.0 (Draft Consolidado)**

## CRM-IA-001 — Arquitetura AI-First
A IA é parte nativa do Hub 3S. Ela executa padrões, apoia decisões e **nunca substitui a
governança**.

### Princípios
- IA executa padrões; humanos supervisionam exceções.
- Toda ação da IA é auditável.
- A IA nunca altera regras de negócio.
- Toda ação relevante produz eventos.
- A IA atua sobre o domínio e não sobre a interface.

### Agentes Oficiais
Agente Operacional do CRC · Agente de Priorização · Agente de Reativação · Agente de
Marketing · Agente Financeiro · Agente de Qualidade · IA Supervisora.

## AI_BOOTSTRAP
Toda IA deve iniciar a sessão lendo a documentação oficial **nesta ordem**:
1. MASTER-GOV-001
2. CRM-CONST-001
3. CRM-BR-001
4. CRM-DOM-001
5. CRM-DATA-001
6. CRM-EVT-001
7. CRM-LIFECYCLE-001
8. CRM-UX-001
9. CRM-KPI-001
10. CRM-IA-001

### Regras obrigatórias do Bootstrap
- A documentação é a fonte oficial de verdade.
- Código nunca prevalece sobre documentação.
- Não criar regras por inferência.
- Interromper implementações quando faltar documentação.
- Atualizar a documentação antes de implementar novas regras.

### Checklist obrigatório antes de implementar
Documentos consultados · Regras de negócio envolvidas · Entidades impactadas · Tabelas
impactadas · Eventos produzidos · KPIs afetados · Impacto arquitetural · Riscos identificados.

### Fluxo Oficial de Desenvolvimento
Discussão → Atualização da Documentação → Aprovação → Implementação → Validação → Merge →
Nova Versão Documental.

## PROMPT OFICIAL DO CLAUDE CODE
Leia integralmente o Documento Mestre do CRM Hub 3S e considere-o a única fonte oficial de
verdade. Antes de implementar qualquer alteração:
1. Carregue toda a documentação.
2. Identifique documentos consultados.
3. Valide as regras de negócio aplicáveis.
4. Caso exista conflito entre código e documentação, prevalece a documentação.
5. Caso exista lacuna documental, interrompa a implementação e solicite atualização.

Durante a implementação:
- Nunca crie regras, tabelas, eventos ou fluxos não documentados.
- Preserve rastreabilidade, auditoria e compatibilidade com IA, dashboards e premiação.

Ao finalizar apresente: arquivos alterados; regras implementadas; entidades impactadas;
eventos produzidos; KPIs afetados; riscos; necessidade de atualização da documentação.

## Encerramento
Os quatro volumes compõem a base documental do CRM Hub 3S. Eles podem ser unificados em um
único Documento Mestre para utilização pelo Claude Code.
