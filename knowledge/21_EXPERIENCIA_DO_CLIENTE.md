---
title: "Experiência do Cliente — módulo transversal (visão e acesso do cliente)"
doc_id: "21_EXPERIENCIA_DO_CLIENTE"
version: 0.1-draft
date: 2026-06-30
status: Conceito de módulo — aguardando aprovação; implementação não autorizada
classification: Interno — Arquitetura de Domínio
module: Experiência do Cliente
schema: (a definir — provável public + leitura de crm via views)
related_docs:
  - 13_CONTROLE_DE_LEAD_DOMAIN_MODEL.md
  - 22_DASHBOARD_CONFIGURAVEL_DO_CLIENTE.md
---

# Experiência do Cliente

## 1. Objetivo

Módulo **transversal** que configura **o que cada cliente pode ver e acessar** dentro do Hub.
O cliente/unidade **não** trabalha lead como CRC — acessa uma **visão de acompanhamento**.

## 2. Regras de domínio

- O cliente vê **somente dados das unidades vinculadas a ele**.
- **Multi-franqueado** pode ver **mais de uma unidade**.
- O cliente **não configura** seus próprios indicadores/permissões.
- Configuração feita por: `Gestor CRC`, `Gestor 3S`, `Super Admin`.

## 3. Permissões configuráveis

Por **cliente**, **unidade**, **usuário** e **perfil**. Exemplos (ver doc 22 para o dashboard):
pode ver receita; pode ver efetivação; pode ver origem; pode ver campanha; pode exportar;
pode ver dados por CRC; pode ver dados por dentista; pode ver agenda futura.

## 4. Estado atual (FATO) e gaps

- **Não existe** modelo de acesso "cliente" no schema atual. O `crm.user_profiles.role`
  cobre papéis internos (`crc`, staff, super admin), e `crm.user_units` vincula **operadores**
  a clínicas — **não** clientes/franqueados a unidades.
- **Não existe** entidade de configuração de visão/permância por cliente.
- O acesso multi-unidade de um cliente, o conceito de **franqueado** e a separação
  "vê, mas não opera" **não existem** hoje.

## 5. Proposta (alto nível — requer migração e RLS próprias, NÃO autorizadas aqui)

- Entidade de **cliente** e vínculo **cliente × unidade(s)** (multi-franqueado).
- Papel/perfil **cliente** com RLS de **somente leitura** sobre dados agregados das unidades vinculadas.
- Entidade de **configuração de experiência** (permissões/widgets) por cliente/unidade/usuário/perfil.
- Reaproveitar `public.clinics` como âncora de unidade (objeto compartilhado protegido — ver doc 16).

## 6. Não autorizado nesta fase
Sem schema, sem RLS, sem tela, sem código. Apenas conceito e mapeamento de impacto.
