-- ============================================================================
-- Migration 007 — Controle de Lead: crm.lead_activities (log de toques do CRC)
--                 + trigger que atualiza leads.last_contact_at/last_activity_at.
-- ----------------------------------------------------------------------------
-- Depende  : 001 (schema), 002 (enum activity_type), 003 (user_profiles),
--            004 (helpers RLS), 005 (patients), 006 (leads + colunas last_*).
-- Escopo   : SEM appointments/budgets/stage_history, SEM system_events/ai_tasks,
--            SEM integracoes externas, SEM log de mensagens automaticas.
-- Append-only: sem UPDATE/DELETE para authenticated.
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) TABELA
-- ----------------------------------------------------------------------------
create table if not exists crm.lead_activities (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null,
  patient_id     uuid not null,
  lead_id        uuid not null,
  activity_type  crm.activity_type not null,
  occurred_at    timestamptz not null default now(),
  performed_by   uuid not null,
  summary        text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),

  -- Atividade pertence ao lead E ao mesmo paciente do lead:
  constraint lead_activities_lead_patient_fk
    foreign key (lead_id, patient_id)
    references crm.leads (id, patient_id) on delete cascade,

  -- Paciente pertence a mesma clinica (anti cross-clinic):
  constraint lead_activities_patient_clinic_fk
    foreign key (patient_id, clinic_id)
    references crm.patients (id, clinic_id) on delete cascade,

  -- FK direta a clinics (validacao explicita de escopo):
  constraint lead_activities_clinic_fk
    foreign key (clinic_id) references public.clinics (id) on delete restrict,

  -- Autor (obrigatorio). RESTRICT preserva o log: usuario com atividades nao
  -- pode ser apagado (usuarios sao desativados via active=false, nao deletados).
  constraint lead_activities_performed_by_fk
    foreign key (performed_by) references crm.user_profiles (id) on delete restrict
);

comment on table crm.lead_activities is
  'Log append-only de toques manuais/relevantes do CRC sobre um lead. NAO e '
  'firehose de mensagens automaticas, NAO substitui system_events/auditoria e '
  'NAO e prontuario clinico.';
comment on column crm.lead_activities.occurred_at is
  'Quando o toque aconteceu (referencia temporal; pode diferir de created_at). '
  'Usado para atualizar leads.last_contact_at/last_activity_at via GREATEST.';
comment on column crm.lead_activities.performed_by is
  'Usuario (user_profiles) que registrou a atividade. Obrigatorio.';
comment on column crm.lead_activities.summary is
  'Campo operacional PRINCIPAL da atividade: descricao curta do que ocorreu. '
  'Recomenda-se preencher em todas as atividades relevantes. '
  'NAO utilizar para dados clinicos/de saude.';
comment on column crm.lead_activities.metadata is
  'Metadados OPERACIONAIS controlados (jsonb, default {}). '
  'PERMITIDO: dados estruturados nao-sensiveis (ex.: call_duration_s, channel_id, '
  'template_id, external_message_id). '
  'PROIBIDO: dados clinicos/de saude; payload bruto de WhatsApp; conteudo de '
  'mensagem do paciente; qualquer PII/sensivel desnecessario.';

-- ----------------------------------------------------------------------------
-- 2) INDICES
-- ----------------------------------------------------------------------------
-- Timeline do lead (ordenada).
create index if not exists lead_activities_lead_occurred_idx
  on crm.lead_activities (lead_id, occurred_at);

-- Varredura SLA/IA por clinica (ex.: lead_sem_contato).
create index if not exists lead_activities_clinic_occurred_idx
  on crm.lead_activities (clinic_id, occurred_at);

-- Timeline da pessoa / FK.
create index if not exists lead_activities_patient_idx
  on crm.lead_activities (patient_id);

-- "Minhas atividades".
create index if not exists lead_activities_performed_by_idx
  on crm.lead_activities (performed_by);

-- ----------------------------------------------------------------------------
-- 3) TRIGGER DE DENORMALIZACAO -> leads.last_contact_at / last_activity_at
--    SECURITY DEFINER (atualiza crm.leads sem depender da RLS do autor),
--    search_path='', GREATEST() para nao regredir, occurred_at como referencia.
--    Hardening: o UPDATE casa lead_id E patient_id (coerencia com a FK composta).
-- ----------------------------------------------------------------------------
create or replace function crm.fn_touch_lead_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update crm.leads l
  set
    last_activity_at = greatest(coalesce(l.last_activity_at, new.occurred_at), new.occurred_at),
    last_contact_at  = case
      when new.activity_type in ('ligacao', 'whatsapp', 'email', 'visita')
        then greatest(coalesce(l.last_contact_at, new.occurred_at), new.occurred_at)
      else l.last_contact_at
    end
  where l.id = new.lead_id
    and l.patient_id = new.patient_id;

  return null;  -- AFTER trigger
end;
$$;

comment on function crm.fn_touch_lead_activity() is
  'AFTER INSERT em lead_activities: atualiza leads.last_activity_at (toda atividade) '
  'e leads.last_contact_at (apenas tipos de contato: ligacao/whatsapp/email/visita), '
  'usando GREATEST(occurred_at) para nunca regredir. UPDATE casa lead_id e patient_id.';

drop trigger if exists trg_lead_activities_touch on crm.lead_activities;
create trigger trg_lead_activities_touch
  after insert on crm.lead_activities
  for each row execute function crm.fn_touch_lead_activity();

-- ----------------------------------------------------------------------------
-- 4) GRANTS (append-only: sem update/delete p/ authenticated)
-- ----------------------------------------------------------------------------
grant select, insert on crm.lead_activities to authenticated;
grant all on crm.lead_activities to service_role;

-- ----------------------------------------------------------------------------
-- 5) RLS
--    Leitura: staff global; clinica = acesso + modulo habilitado.
--    Criacao: quem pode operar o modulo + modulo habilitado + autor = proprio
--             usuario (ou staff).
--    SEM UPDATE e SEM DELETE (log imutavel). cliente: read-only.
-- ----------------------------------------------------------------------------
alter table crm.lead_activities enable row level security;

drop policy if exists lead_activities_select_scoped on crm.lead_activities;
create policy lead_activities_select_scoped
  on crm.lead_activities
  for select to authenticated
  using (
    crm.is_staff_3s()
    or (crm.user_has_clinic_access(clinic_id) and crm.module_enabled_for_clinic(clinic_id))
  );

drop policy if exists lead_activities_insert_manage on crm.lead_activities;
create policy lead_activities_insert_manage
  on crm.lead_activities
  for insert to authenticated
  with check (
    crm.user_can_manage_module(clinic_id)
    and crm.module_enabled_for_clinic(clinic_id)
    and (performed_by = (select auth.uid()) or crm.is_staff_3s())
  );

-- (sem policy de UPDATE e sem policy de DELETE: log append-only no MVP)
-- ============================================================================
