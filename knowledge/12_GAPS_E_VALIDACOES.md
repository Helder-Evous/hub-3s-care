---
documento: 12_GAPS_E_VALIDACOES
versao: 1.0
data: 2026-06-22
classificacao: L1 — Operacional
---

# Gaps e Validações Pendentes

Este documento protege a IA contra suposições. Tudo abaixo deve ser confirmado antes de virar regra automática.

## Produtos e comercial
- catálogo oficial de preços por produto/modalidade;
- validade da tabela de preços e descontos autorizados;
- Preço atual informado do Projeto Escola: R$ 5,90. Confirmar a unidade de cobrança — por aluno, lead, contato ou outro critério;
- escopo fechado do NuPonto;
- regras de contrato, renovação e cancelamento;
- SLA oficial por produto e etapa.

## Pessoas
- cadastro mestre atualizado de colaboradores, vínculo, cargo, gestor, canal de contato, substituto e disponibilidade;
- situação ativa/inativa da equipe indicada apenas na planilha de custos;
- papel detalhado de cada CRC/estagiário;
- remuneração e comissão como dado restrito e validado por RH/financeiro;
- inclusão formal de Jefferson no cadastro mestre.

## Financeiro
- data de referência do workbook de custos/receitas;
- diferença entre preço de referência, preço negociado e preço sugerido por simulação;
- validação das fórmulas de despesas diretas/indiretas antes de usar como demonstração financeira;
- integração financeira oficial a ser escolhida/validada.

## Tecnologia
- plataforma atual de atendimento por produto;
- fontes autorizadas de dados Meta/Kommo/WhatsApp;
- política de retenção e consentimento para conversas;
- papéis de acesso de cada usuário/agente.

## Operação
- SLA e checklist aprovados por produto;
- scripts de atendimento;
- critérios de qualidade;
- definição de métricas de resultado por produto.

## Controle de Lead — Card Operacional (S2-3)

Contexto: o card do Kanban evoluiu para um **Painel Operacional do CRC** (S2-3, só
frontend). Alguns elementos foram desenhados com o componente **pronto porém
desligado** (sem fonte de dados), para evoluir sem refatoração. Os itens abaixo são
GAPS técnicos — nada foi inventado no card; onde não há dado, o elemento não aparece
(ou mostra o vazio honesto, ex.: "0 tentativas").

### Tentativas de contato — proposta `crm.lead_attempts` (NÃO implementada)
Hoje as tentativas serão registradas manualmente pelo CRC; no futuro, por agentes de
IA — **usando exatamente a mesma entidade** (sem estrutura paralela). Contagem no card
é sempre `0` até a entidade existir. Decisão aprovada: **entidade dedicada** (não reusar
`crm.lead_activities`), porque `result`/`origin` são cidadãos de primeira classe para
Dashboard/Premiação/IA e agregações tipadas (evita JSON frágil).

Modelo proposto (migration/enums/RLS = etapa futura, PR separado, com validação em DEV):
```
crm.lead_attempts
  id             uuid pk
  clinic_id      uuid  → clinics(id)           [unidade dona do lead]
  lead_id        uuid  → leads(id)
  patient_id     uuid                          [par (lead_id,patient_id), padrão do módulo]
  channel        enum attempt_channel   (phone|whatsapp|email|presencial|sms|api|outro)
  attempt_source enum attempt_source    (manual_crc|manual_consultor|ia|importacao|api|sistema)
  result         enum attempt_result    (no_answer|answered|busy|scheduled|invalid|callback|outro)
  notes          text null
  created_by     uuid null → user_profiles(id) [null p/ sistema]
  created_at     timestamptz default now()
```
- Separar `channel` (meio) de `attempt_source` (proveniência) — não colapsar num campo só.
- RLS futura: mesmos helpers já usados (`user_has_clinic_access`, `is_staff_3s`), escopo
  por `clinic_id`. Não altera RLS existente.
- Ponte opcional com `lead_activities` (espelhar tentativa na timeline) = decisão aberta.
- Pendências: enums, migration, índices, política de escrita por IA, drawer de histórico.

### Presença / colaboração entre CRCs — proposta `crm.lead_presence` (NÃO implementada)
Premissa: o lead pertence à **unidade**, não ao CRC; vários CRCs veem o mesmo card.
Design pronto no card (borda verde = "Você está atendendo"; borda âmbar = "Em uso por X";
livre = borda normal), porém **desligado**: sem fonte, nenhuma presença é exibida.
Regra é **estado efêmero de sessão, NÃO auditoria** — ações reais continuam em
`appointments`, `lead_activities` e `lead_stage_history`.

Entidade candidata (futura): `crm.lead_presence` — `id, clinic_id, lead_id, user_id,
started_at, expires_at, heartbeat_at, mode(viewing|editing|calling), active`.
Pendências (todas requerem aprovação): backend, realtime, expiração automática ao fechar
a tela, e a decisão de comportamento — **bloquear edição / abrir somente leitura / apenas
alerta visual** (ainda não decidido). Segurança: só CRC com acesso à unidade registra
presença; gestor CRC pode ver quem está usando.

### Prioridade do lead (badge desligado)
Sem fonte hoje (futuro: IA Supervisor). O badge só aparece quando houver dado real —
prioridade **não é inventada**.

### Tempo no status atual (proxy)
Não há timestamp por transição operacional no schema. O card mostra "Parado há ..." como
**proxy honesto** (último movimento conhecido: `lost_at`/`last_activity_at`/
`last_contact_at`/`created_at`). Dwell-time exato por coluna é gap futuro (exigiria
persistir a entrada em cada estado operacional).

### Campanha
`Origem` (lead_sources) existe; **Campanha** é conceito separado e **não existe** no
schema — por isso **não** é exibida no card (não virou placeholder).

### Ações de operação no card (decisão de escopo)
As ações S2-2B (Confirmar/Compareceu/Faltou/Remarcar) permanecem no **detalhe do lead**
("Abrir"), não inline no card. Trazer operação para o board (com alvo de agendamento
definido) é etapa futura — evita mutação no board e ambiguidade de qual agendamento operar.
