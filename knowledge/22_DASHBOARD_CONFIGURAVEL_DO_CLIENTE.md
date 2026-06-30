---
title: "Dashboard Configurável do Cliente"
doc_id: "22_DASHBOARD_CONFIGURAVEL_DO_CLIENTE"
version: 0.1-draft
date: 2026-06-30
status: Conceito — aguardando aprovação; implementação não autorizada
classification: Interno — Arquitetura de Domínio
module: Experiência do Cliente
schema: (a definir — leitura agregada via views sob RLS)
related_docs:
  - 21_EXPERIENCIA_DO_CLIENTE.md
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
---

# Dashboard Configurável do Cliente

## 1. Objetivo

Dashboard do cliente **configurável** (widgets/KPIs e filtros), governado pelas permissões do
módulo **Experiência do Cliente** (doc 21). O cliente **não** configura os próprios indicadores.

## 2. Widgets / KPIs possíveis

leads · agendamentos · comparecimentos · remarcações · faltas · cancelamentos · efetivação ·
receita · ticket médio · origem · campanha · agenda futura · ranking de campanhas · ranking de origens.

## 3. Filtros possíveis
período · unidade · origem · campanha · CRC · dentista.

## 4. Permissões possíveis
ver receita · ver efetivação · ver origem · ver campanha · exportar · ver dados por CRC ·
ver dados por dentista · ver agenda futura.

## 5. Estado atual (FATO) e gaps

- **Não existe** dashboard de cliente nem configuração de widgets/permissões.
- Fontes **existentes** para KPIs: `crm.leads`, `crm.appointments`, `crm.lead_stage_history`,
  `crm.lead_sources` (origem). Dá para derivar leads/agendamentos/comparecimentos/faltas/
  cancelamentos/remarcações por **origem**.
- Fontes **inexistentes**: **campanha** (não há entidade), **efetivação/receita/ticket médio**
  (sem entidade), **dentista** (só `appointments.professional_name` texto livre, sem cadastro),
  **dono do comparecimento por CRC** (sem `appointments.created_by` — ADR-0004).
- **RLS de cliente** não existe (ver doc 21): hoje a RLS escopa **operadores** por unidade,
  não **clientes**.

## 6. Proposta (alto nível — NÃO autorizada aqui)

- Views agregadas no schema `crm` (invoker rights, respeitando RLS) por unidade/origem/campanha/período.
- Permissões por cliente/unidade controlando **quais** widgets e **quais** dimensões (receita,
  CRC, dentista) são visíveis.
- Depende de: entidade de **campanha**, entidade de **efetivação/receita**, `created_by` em
  appointments, cadastro de **dentista** (ou aceitar texto livre), e do modelo de acesso de cliente.

## 7. Não autorizado nesta fase
Sem views, sem permissões, sem tela, sem código. Apenas conceito e dependências.
