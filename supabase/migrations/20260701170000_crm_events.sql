-- ============================================================================
-- Migration 018 — Controle de Lead: crm.events (eventos operacionais por Lead)
--                 + enum crm_event_type + view crm.lead_timeline.
-- ----------------------------------------------------------------------------
-- Objetivo : fundacao de EVENTOS IMUTAVEIS do dominio CRM (CRM-EVT-001),
--            consumivel por IA, dashboards, auditoria e integracoes. Timeline e
--            uma VIEW derivada de events (sem duplicidade). Coexiste com
--            public.system_events (camada global/plataforma) — que NAO e tocada.
-- Depende  : 001 (schema/grants), 004 (helpers RLS), 006 (crm.leads).
-- Escopo   : ADITIVA e REVERSIVEL. APPEND-ONLY (sem UPDATE/DELETE). SO cria
--            infraestrutura (enum + tabela + view + indices + grants + RLS).
--            NAO cria triggers de emissao (etapa posterior por app/RPC). NAO
--            altera system_events. Sem frontend.
-- Aplicacao: NAO aplicada por este commit. Fluxo DEV -> validar -> Principal,
--            aprovacao do Jheferson.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ENUM crm.crm_event_type (catalogo CRM-EVT-001, fechado inicial)
-- ----------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'crm' and t.typname = 'crm_event_type') then
    create type crm.crm_event_type as enum (
      'LeadCreated', 'LeadAssigned', 'LeadLost', 'LeadReactivated', 'LeadArchived',
      'AttemptCreated', 'AttemptAutoCreated',
      'AppointmentCreated', 'AppointmentConfirmed', 'AppointmentRescheduled',
      'AppointmentCancelled', 'AppointmentAttended',
      'RevenueRegistered',
      'PresenceStarted', 'PresenceEnded'
    );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2) TABELA crm.events (append-only; imutavel — sem updated_at)
--    Anti cross-clinic: FK composta (lead_id, clinic_id) -> leads(id, clinic_id).
--    ON DELETE RESTRICT: evento de auditoria NUNCA e apagado em cascata.
--    actor_id NAO tem FK (o ator pode ser IA/sistema/api sem user_profile;
--    actor_type desambigua). payload default '{}'.
-- ----------------------------------------------------------------------------
create table if not exists crm.events (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null,
  lead_id      uuid not null,
  event_type   crm.crm_event_type not null,
  entity_type  text,                 -- ex.: 'lead','appointment','attempt','revenue','presence'
  entity_id    uuid,                 -- id da entidade referenciada pelo evento
  actor_type   text,                 -- ex.: 'crc','gestor','ia','api','importacao','sistema'
  actor_id     uuid,                 -- usuario quando humano; NULL p/ ia/sistema (sem FK)
  occurred_at  timestamptz not null default now(),
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),

  -- Evento pertence ao lead E a mesma clinica do lead (anti cross-clinic):
  constraint events_lead_clinic_fk
    foreign key (lead_id, clinic_id)
    references crm.leads (id, clinic_id) on delete restrict,

  -- FK direta a clinics (validacao explicita de escopo):
  constraint events_clinic_fk
    foreign key (clinic_id) references public.clinics (id) on delete restrict
);

comment on table crm.events is
  'Eventos operacionais IMUTAVEIS do CRM por Lead (CRM-EVT-001). Append-only: sem '
  'UPDATE/DELETE. Consumivel por IA/dashboards/auditoria/integracoes. Coexiste com '
  'public.system_events (camada global). Emissao por app/RPC/triggers em etapa posterior.';
comment on column crm.events.event_type is
  'Tipo do evento (enum crm.crm_event_type, catalogo CRM-EVT-001).';
comment on column crm.events.actor_id is
  'Usuario responsavel quando o ator e humano; NULL p/ ia/api/sistema. Sem FK '
  '(ator pode nao ser um user_profile); actor_type desambigua.';
comment on column crm.events.payload is
  'Metadados estruturados do evento (jsonb, default {}). NAO usar p/ dados '
  'clinicos/sensiveis desnecessarios.';

-- ----------------------------------------------------------------------------
-- 3) INDICES
-- ----------------------------------------------------------------------------
create index if not exists events_lead_occurred_idx   on crm.events (lead_id, occurred_at);
create index if not exists events_clinic_occurred_idx on crm.events (clinic_id, occurred_at);
create index if not exists events_event_type_idx      on crm.events (event_type);

-- ----------------------------------------------------------------------------
-- 4) GRANTS (append-only: authenticated SELECT; service_role SELECT+INSERT).
--    Deliberadamente SEM update/delete/truncate p/ service_role (imutabilidade).
-- ----------------------------------------------------------------------------
grant select on crm.events to authenticated;
grant select, insert on crm.events to service_role;

-- ----------------------------------------------------------------------------
-- 5) RLS — leitura por clinica (staff global ou acesso + modulo habilitado).
--    SEM policy de INSERT/UPDATE/DELETE p/ authenticated (nao tem grant de
--    escrita); emissao vem por service_role (bypassa RLS) na camada futura.
-- ----------------------------------------------------------------------------
alter table crm.events enable row level security;

drop policy if exists events_select_scoped on crm.events;
create policy events_select_scoped
  on crm.events
  for select to authenticated
  using (
    crm.is_staff_3s()
    or (crm.user_has_clinic_access(clinic_id) and crm.module_enabled_for_clinic(clinic_id))
  );

-- ----------------------------------------------------------------------------
-- 6) VIEW crm.lead_timeline — projecao (derivada) de crm.events.
--    security_invoker=true: aplica a RLS de crm.events ao usuario que consulta
--    (evita view SECURITY DEFINER). Timeline nao duplica dados.
-- ----------------------------------------------------------------------------
create or replace view crm.lead_timeline
  with (security_invoker = true) as
select
  e.id,
  e.clinic_id,
  e.lead_id,
  e.event_type,
  e.entity_type,
  e.entity_id,
  e.actor_type,
  e.actor_id,
  e.occurred_at,
  e.payload
from crm.events e
order by e.lead_id, e.occurred_at desc;

comment on view crm.lead_timeline is
  'Timeline derivada (projecao) de crm.events. security_invoker=true -> herda a RLS '
  'de crm.events. Timeline e imutavel por consequencia (events e append-only).';

grant select on crm.lead_timeline to authenticated;
grant select on crm.lead_timeline to service_role;

-- ============================================================================
-- ROLLBACK (manual, se necessario):
--   drop view if exists crm.lead_timeline;
--   drop table if exists crm.events;   -- remove indices/policies junto
--   drop type if exists crm.crm_event_type;
-- ============================================================================
