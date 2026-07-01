---
documento: CRM-MESTRE-VOL1-FUNDACAO
titulo: "Documento Mestre CRM Hub 3S — Volume 1: Fundação do CRM"
versao: 1.0 (Draft Consolidado)
data: 2026-07-01
classificacao: OFICIAL — Fonte única de verdade do módulo CRM
contem_ids: [MASTER-GOV-001, CRM-CONST-001, CRM-BR-001]
origem: DOCUMENTO_MESTRE_CRM_HUB3S_VOLUME_1_FUNDACAO.docx
status: Vigente (oficializado por decisão da Direção em 2026-07-01)
nota: >
  Este arquivo é a transcrição fiel do volume oficial. Substitui qualquer versão
  anterior das mesmas regras. Nenhuma outra fonte pode conter versão divergente
  destas regras (MASTER-GOV-001 / CRM-CONST-001 / CRM-BR-001).
---

# DOCUMENTO MESTRE CRM HUB 3S — VOLUME 1: FUNDAÇÃO DO CRM
**Versão 1.0 (Draft Consolidado)**

## Apresentação
Este volume consolida os documentos fundacionais do CRM do Hub 3S. Seu objetivo é
servir como referência normativa para qualquer implementação. **A documentação prevalece
sobre o código.**

## MASTER-GOV-001 — Governança
- Automação acima de trabalho manual repetitivo.
- Simplicidade acima de complexidade desnecessária.
- Resultado do cliente acima de atividade.
- IA executa padrões; humanos supervisionam exceções.
- Nenhuma alteração estrutural sem documentação prévia.
- Todo módulo deve produzir rastreabilidade, eventos e indicadores.

### Diretriz — Sequência de Supersessão (DECISÃO 2b, permanente)
Um documento antigo **nunca** poderá ser marcado como SUPERSEDED enquanto existir qualquer
informação exclusiva nele que ainda não tenha sido incorporada aos documentos mestres.
Sequência oficial obrigatória:
```
Documento Antigo
  ↓ Identificar informações exclusivas
  ↓ Promover essas informações para o Documento Mestre
  ↓ Validar que nada foi perdido
  ↓ Marcar o documento antigo como SUPERSEDED
  ↓ Manter apenas como histórico
```
Nunca o contrário.

### Diretriz — ADR não contém regra de negócio (DECISÃO 2d, permanente)
**Regra de negócio pertence exclusivamente aos Documentos Mestres.** ADR serve apenas para
decisões **técnicas, de arquitetura, infraestrutura, integrações, banco, performance e
tecnologia**. Nenhum ADR novo poderá conter regra de negócio.

## CRM-CONST-001 — Constituição Operacional
- O objetivo operacional do CRM é **gerar comparecimentos**. Receita é indicador
  estratégico e **não altera a jornada**.
- Kanban operacional com **cinco colunas**: Novo Lead, Agendado, Remarcar, Compareceu e
  Perdido.
- Movimentar Novo Lead para Agendado exige **modal obrigatória com data e hora**.
- Sem tentativa elegível, **criar tentativa automática**.
- Compareceu e Perdido **encerram** a jornada operacional.
- Compareceu e Perdido são **arquivados automaticamente após 24 horas**.
- Reativação ocorre por **funcionalidade específica**.
- **Origem é obrigatória. Campanha é opcional** e exibida quando existir.
- Nenhuma decisão operacional documentada poderá ser rediscutida sem revisão formal da
  Constituição.

## CRM-BR-001 — Regras de Negócio
- Lead pertence à clínica; vários CRCs podem atuar na mesma unidade.
- Presença operacional não altera responsabilidade do Lead.
- Card operacional responde: quem é, origem, campanha, próxima ação, prioridade,
  tentativas e tempo parado.
- Toda movimentação relevante produz **evento, timeline e auditoria**.
- **Appointment depende de tentativa elegível.**
- Receita substitui orçamento como indicador financeiro.
- Receitas podem ser **múltiplas e são acumuladas por Lead**.
- **Origem e Campanha nunca podem ser tratadas como sinônimos.**
- Todo comparecimento deve ser **conciliável com importação de agenda**.
- IA deverá utilizar apenas regras documentadas.

### Tentativas e Elegibilidade
> Regra promovida do ADR-0006 / S2-3B em 2026-07-01 (DECISÃO 2c). Passa a ser regra de
> negócio oficial; o ADR de origem foi marcado SUPERSEDED.
- **Tentativa é entidade de negócio.** Relacionamento canônico **Lead → LeadAttempt →
  Appointment**. Todo agendamento tem **exatamente uma** tentativa que o originou.
- **O agendamento não é uma nova tentativa** — é o **resultado** de uma tentativa.
- **Sem tentativa elegível prévia:** o sistema **cria automaticamente** uma tentativa
  (origem = sistema, resultado = agendou) e a vincula (Cenário A).
- **Com tentativa elegível prévia:** o sistema **reutiliza** a existente como origem do
  agendamento; **nunca duplica** (Cenário B).
- **Uma tentativa origina no máximo um agendamento.**
- **Resultados elegíveis** para originar/reutilizar: `contato_realizado, conversou,
  interessado, retorno, sem_resultado`.
- **Resultados não elegíveis** (nunca geram agendamento automático nem podem ser
  reutilizados): `sem_resposta, caixa_postal, ocupado, numero_invalido, nao_interessado`.
- **Canal ≠ Origem:** Canal é o meio; Origem é quem/qual sistema gerou a tentativa (CRC,
  consultor, IA, api, importação, sistema). Nunca tratar como sinônimos.
- **Pendência de decisão (não implementar por inferência):** a **janela de elegibilidade**
  (por quanto tempo uma tentativa permanece reutilizável — ex.: 24–72h, por clínica) ainda
  **não foi definida** e deve ser decidida antes de qualquer implementação.

### Dono do Comparecimento
> Regra promovida do ADR-0004 em 2026-07-01 (DECISÃO 2c). É regra de negócio (base da
> Premiação), não decisão técnica.
- **O comparecimento pertence ao `scheduled_by` do agendamento que recebeu o status
  `compareceu`.**
- **Não** pertence ao primeiro CRC que trabalhou o lead, **não** a quem apenas confirmou,
  **não** a quem importou/criou tecnicamente a linha.
- **Remarcar cria um NOVO agendamento** (vinculado ao anterior), com o `scheduled_by` de
  quem remarcou; o comparecimento credita o `scheduled_by` do agendamento comparecido.

### Fontes de Dados e Conciliação da Agenda
> Parte normativa promovida do ADR-0005 em 2026-07-01 (DECISÃO 2c). A parte técnica
> (migration/chave de conciliação/DDL) permanece na documentação de engenharia.
- **Três entradas oficiais de dados:**
  1. **Importar Leads** — informa lead, telefone, unidade, origem, campanha, responsável;
     cria/atualiza lead (dedup por telefone).
  2. **Agendamento CRC** — cria o agendamento e **define o dono operacional**
     (`scheduled_by` = CRC que agendou).
  3. **Relatório Agenda** — **atualiza o status** do agendamento existente
     (`compareceu`/`faltou`/`cancelou`); **NUNCA define o dono** do comparecimento.
- **Campanha ≠ Origem** — dimensões independentes.
- **Todo comparecimento deve ser conciliável** com a importação de agenda (a chave técnica
  de conciliação é decisão de engenharia, ainda em aberto).

## Fluxo Oficial
Discussão → Atualização da Documentação → Aprovação → Implementação → Validação → Merge.

## Observação
Este é o Volume 1 da coleção. Os volumes seguintes complementam o Modelo de Domínio,
Dados, Eventos, UX, KPIs, IA e Bootstrap.
