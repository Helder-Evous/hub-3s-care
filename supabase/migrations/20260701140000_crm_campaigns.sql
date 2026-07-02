-- ============================================================================
-- Migration 015 — Controle de Lead: crm.campaigns (Campanha) + crm.leads.campaign_id
-- ----------------------------------------------------------------------------
-- Objetivo : introduzir **Campanha** como entidade independente de **Origem**
--            (CRM-DATA-001 / CRM-BR-001: "Origem != Campanha"). Origem
--            (leads.source_id) permanece obrigatoria; Campanha (leads.campaign_id)
--            e OPCIONAL. Um lead pode ter Origem sem Campanha; uma Campanha agrupa
--            leads de multiplas Origens.
-- Depende  : 001 (schema/grants), 004 (helpers RLS), 006 (crm.leads).
-- Escopo   : ADITIVA e REVERSIVEL. Sem backfill, sem alterar dados existentes,
--            sem tocar source_id, sem Kanban, sem frontend, sem tornar
--            campaign_id obrigatorio. Espelha o padrao do catalogo crm.lead_sources.
-- Escrita  : campanhas sao geridas server-side (service_role), como lead_sources —
--            authenticated e READ-ONLY (nao e CRC nem gestor via app nesta fase).
-- Aplicacao: NAO aplicada por este commit. Fluxo DEV -> validar -> Principal,
--            aprovacao do Jheferson.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) TABELA crm.campaigns
-- ----------------------------------------------------------------------------
create table if not exists crm.campaigns (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null,
  name        text not null,
  active      boolean not null default true,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- FK direta a clinics (padrao do catalogo lead_sources: ON DELETE CASCADE).
  constraint campaigns_clinic_fk
    foreign key (clinic_id) references public.clinics (id) on delete cascade,

  -- Sanidade do periodo (quando ambas as datas existirem).
  constraint campaigns_dates_ck
    check (end_date is null or start_date is null or end_date >= start_date),

  -- Nao permitir campanha duplicada (mesmo nome) na mesma clinica.
  constraint campaigns_clinic_name_uq
    unique (clinic_id, name)
);

comment on table crm.campaigns is
  'Campanha de marketing/captacao por clinica. Conceito DISTINTO de Origem '
  '(crm.lead_sources): Origem = de onde veio o lead; Campanha = acao que o gerou. '
  'Um lead pode ter Origem sem Campanha; uma Campanha agrupa leads de multiplas Origens.';
comment on column crm.campaigns.active is
  'Campanha ativa (default true). Padrao do catalogo (lead_sources.active).';

-- ----------------------------------------------------------------------------
-- 2) INDICE
-- ----------------------------------------------------------------------------
create index if not exists campaigns_clinic_id_idx on crm.campaigns (clinic_id);

-- ----------------------------------------------------------------------------
-- 3) TRIGGER updated_at (reutiliza helper existente do schema)
-- ----------------------------------------------------------------------------
drop trigger if exists trg_campaigns_touch_updated_at on crm.campaigns;
create trigger trg_campaigns_touch_updated_at
  before update on crm.campaigns
  for each row execute function crm.fn_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 4) GRANTS (padrao do catalogo: authenticated READ-ONLY; service_role ALL)
-- ----------------------------------------------------------------------------
grant select on crm.campaigns to authenticated;
grant all on crm.campaigns to service_role;

-- ----------------------------------------------------------------------------
-- 5) RLS — leitura por clinica (staff global ou acesso a clinica + modulo
--    habilitado). SEM insert/update/delete para authenticated (gestao server-side),
--    espelhando lead_sources. Uma policy de escrita p/ gestor/staff pode ser
--    adicionada no futuro se o produto exigir gestao de campanhas via app.
-- ----------------------------------------------------------------------------
alter table crm.campaigns enable row level security;

drop policy if exists campaigns_select_scoped on crm.campaigns;
create policy campaigns_select_scoped
  on crm.campaigns
  for select to authenticated
  using (
    crm.is_staff_3s()
    or (crm.user_has_clinic_access(clinic_id) and crm.module_enabled_for_clinic(clinic_id))
  );

-- ----------------------------------------------------------------------------
-- 6) COLUNA crm.leads.campaign_id (nullable, aditiva) + FK + indice
--    Origem (source_id) NAO e alterada. campaign_id OPCIONAL.
--    FK simples -> campaigns(id) ON DELETE RESTRICT (mesmo padrao de source_id:
--    nao se apaga uma campanha em uso). Sem alterar RLS/grants de leads.
-- ----------------------------------------------------------------------------
alter table crm.leads
  add column if not exists campaign_id uuid;

comment on column crm.leads.campaign_id is
  'Campanha (crm.campaigns) que gerou o lead. OPCIONAL (Campanha != Origem). '
  'source_id (Origem) permanece obrigatoria e inalterada.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_campaign_fk') then
    alter table crm.leads
      add constraint leads_campaign_fk
      foreign key (campaign_id) references crm.campaigns (id) on delete restrict;
  end if;
end $$;

create index if not exists leads_campaign_idx on crm.leads (campaign_id);

-- ============================================================================
-- ROLLBACK (manual, se necessario):
--   alter table crm.leads drop constraint if exists leads_campaign_fk;
--   drop index if exists crm.leads_campaign_idx;
--   alter table crm.leads drop column if exists campaign_id;
--   drop table if exists crm.campaigns;  -- remove indice/trigger/policies junto
-- ============================================================================
