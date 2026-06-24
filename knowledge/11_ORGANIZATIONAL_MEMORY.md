---
documento: 11_ORGANIZATIONAL_MEMORY
versao: 1.0
data: 2026-06-22
classificacao: L1 — Operacional
---

# Memória Organizacional

## Como usar

Registrar decisões relevantes em formato curto:

- data;
- decisão;
- motivo;
- responsável;
- impacto;
- revisão necessária.

## Registros iniciais

### 2026-06-22 — Hub como sistema operacional AI-first
**Decisão:** o Hub 3S deve ser a espinha dorsal única de Clientes, Operações e Gestão.  
**Motivo:** evitar sistemas e módulos isolados.  
**Responsável:** Direção 3S.  
**Impacto:** todos os módulos novos devem aderir ao padrão de eventos, tarefas, dados mestre e auditoria.

### 2026-06-22 — Princípio de autonomia
**Decisão:** IA executa o padrão; humanos supervisionam exceções.  
**Motivo:** aumentar escala sem perder controle.  
**Responsável:** Direção 3S.

### 2026-06-22 — Evento antes de agente
**Decisão:** construir `system_events` e `ai_tasks` antes de agentes de WhatsApp/Telegram.  
**Motivo:** a IA precisa de memória, rastreabilidade e filas de ação antes de agir externamente.

### 2026-06-22 — Fonte de verdade
**Decisão:** GitHub oficial, Supabase oficial e `/knowledge` devem concentrar código, dados e contexto.  
**Motivo:** evitar dependência de chats ou ferramentas isoladas.

### 2026-06-22 — Trabalho em paralelo
**Decisão:** Helder mantém arquitetura e conhecimento; Jefferson acelera módulos operacionais em branches próprias.  
**Motivo:** reduzir gargalo do fundador sem fragmentar o Hub.

### 2026-06-24 — Pipeline de Governança do Conhecimento
**Decisão:** a 3S não utilizará um terceiro chat como memória oficial. Será construído um Pipeline de Governança do Conhecimento que detecta mudanças, classifica informações, gera propostas, exige aprovação quando necessária e publica alterações oficiais por Pull Request.  
**Motivo:** reduzir alimentação manual sem permitir que a IA transforme ideias, conversas ou inferências em políticas oficiais.  
**Responsáveis pela aprovação na fase inicial:** Helder ou Jefferson.  
**Impacto:** `ai_tasks` permanece como fila única; `knowledge_change_proposals` será uma estrutura de propostas e evidências; `organizational_memory` e `decision_feedback` estruturados serão construídos posteriormente.
