-- ============================================================================
-- Migration 010 — Controle de Lead: derivacao de current_stage
--   * crm.lead_stage_history (append-only)
--   * crm.lead_stage_rank (helper IMMUTABLE)
--   * crm.fn_recalc_lead_stage (escritora oficial de current_stage)
--   * triggers em appointments/budgets/leads
--   * protecao de colunas derivadas (current_stage/last_contact_at/last_activity_at)
-- ----------------------------------------------------------------------------
-- Depende  : 002 (enums), 003 (user_profiles), 004 (helpers RLS),
--            006 (leads), 008 (appointments), 009 (budgets).
-- Escopo   : SEM system_events/ai_tasks, SEM treatments/evaluations/post_sales/revenue.
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) HISTORICO DE TRANSICOES (append-only)
-- ----------------------------------------------------------------------------
create table if not exists crm.lead_stage_history (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null,                 -- denormalizado (RLS/escopo)
  lead_id       uuid not null references crm.leads (id) on delete cascade,
  patient_id    uuid not null,                 -- denormalizado (timeline/joins)
  from_stage    crm.lead_stage,                -- nulo na 1a transicao
  to_stage      crm.lead_stage not null,
  reason        text,
  source_table  text,                          -- appointments | budgets | leads
  source_id     uuid,                          -- id do registro que motivou
  changed_at    timestamptz not null default now(),
  changed_by    uuid references crm.user_profiles (id) on delete set null
);

comment on table crm.lead_stage_history is
  'Historico append-only das transicoes de leads.current_stage. Escrito apenas '
  'pela funcao de recalculo (sistema). clinic_id/patient_id denormalizados.';

create index if not exists lead_stage_history_lead_idx
  on crm.lead_stage_history (lead_id, changed_at);
create index if not exists lead_stage_history_clinic_idx
  on crm.lead_stage_history (clinic_id, changed_at);

-- Grants: leitura para authenticated (gateada por RLS); escrita so sistema/service_role.
grant select on crm.lead_stage_history to authenticated;
grant all    on crm.lead_stage_history to service_role;

-- RLS: somente leitura escopada; sem insert/update/delete p/ authenticated.
alter table crm.lead_stage_history enable row level security;

drop policy if exists lead_stage_history_select_scoped on crm.lead_stage_history;
create policy lead_stage_history_select_scoped
  on crm.lead_stage_history
  for select to authenticated
  using (
    crm.is_staff_3s()
    or (crm.user_has_clinic_access(clinic_id) and crm.module_enabled_for_clinic(clinic_id))
  );
-- (sem policy de INSERT/UPDATE/DELETE: append-only escrito pela funcao SECURITY DEFINER)

-- ----------------------------------------------------------------------------
-- 2) HELPER DE RANK (IMMUTABLE; mapa explicito, NAO depende de enumsortorder)
-- ----------------------------------------------------------------------------
create or replace function crm.lead_stage_rank(p_stage crm.lead_stage)
returns int
language sql
immutable
set search_path = ''
as $$
  select case p_stage
    when 'novo'         then 0
    when 'agendado'     then 1
    when 'compareceu'   then 2
    when 'em_avaliacao' then 3
    when 'orcamento'    then 4
    when 'efetivado'    then 5
    when 'pos_venda'    then 6
    when 'perdido'      then -1   -- terminal/lateral: nunca usado como piso de progressao
  end
$$;

comment on function crm.lead_stage_rank(crm.lead_stage) is
  'Rank ordinal do estagio do funil (mapa explicito). perdido=-1 (terminal, nao '
  'participa do maximo). Usado pela derivacao monotonica.';

-- ----------------------------------------------------------------------------
-- 3) FUNCAO OFICIAL DE RECALCULO (escritora unica de current_stage)
--    SECURITY DEFINER + search_path='' ; maior estagio alcancado; perdido override;
--    grava historico apenas se houver mudanca real; sem loop de trigger.
-- ----------------------------------------------------------------------------
create or replace function crm.fn_recalc_lead_stage(
  p_lead_id      uuid,
  p_source_table text default null,
  p_source_id    uuid default null,
  p_reason       text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current   crm.lead_stage;
  v_lost      timestamptz;
  v_clinic    uuid;
  v_patient   uuid;
  v_rank      int := 0;
  v_base_rank int;
  v_new       crm.lead_stage;
begin
  if p_lead_id is null then
    return;
  end if;

  select current_stage, lost_at, clinic_id, patient_id
    into v_current, v_lost, v_clinic, v_patient
  from crm.leads
  where id = p_lead_id;

  if not found then
    return;
  end if;

  -- Candidato a partir das ENTIDADES OPERACIONAIS (fonte de verdade).
  if exists (
    select 1 from crm.appointments a
    where a.lead_id = p_lead_id
      and a.status in ('agendado', 'confirmado', 'remarcado')
  ) then
    v_rank := greatest(v_rank, 1);  -- agendado
  end if;

  if exists (
    select 1 from crm.appointments a
    where a.lead_id = p_lead_id and a.status = 'compareceu'
  ) then
    v_rank := greatest(v_rank, 2);  -- compareceu
  end if;

  -- Apenas orcamentos efetivamente apresentados participam (cancelado NAO conta
  -- ate haver definicao operacional explicita; rascunho tambem nao).
  if exists (
    select 1 from crm.budgets b
    where b.lead_id = p_lead_id
      and b.status in ('emitido', 'aceito', 'rejeitado', 'expirado')
  ) then
    v_rank := greatest(v_rank, 4);  -- orcamento
  end if;

  -- Piso monotonico: nunca regredir. Excecao: se atual e 'perdido' (un-lose),
  -- ignora o piso e recompoe a partir das filhas.
  if v_current = 'perdido' then
    v_base_rank := 0;
  else
    v_base_rank := crm.lead_stage_rank(v_current);
  end if;
  v_rank := greatest(v_rank, v_base_rank);

  -- Mapa rank -> stage.
  v_new := (case v_rank
    when 0 then 'novo'
    when 1 then 'agendado'
    when 2 then 'compareceu'
    when 3 then 'em_avaliacao'
    when 4 then 'orcamento'
    when 5 then 'efetivado'
    when 6 then 'pos_venda'
    else 'novo'
  end)::crm.lead_stage;

  -- Override terminal de perda.
  if v_lost is not null then
    v_new := 'perdido';
  end if;

  -- Grava SOMENTE se houve mudanca real (evita loop/historico duplicado).
  if v_new is distinct from v_current then
    update crm.leads
      set current_stage = v_new
    where id = p_lead_id;   -- atualiza SO current_stage -> trigger 'OF lost_at' nao re-dispara

    insert into crm.lead_stage_history
      (clinic_id, lead_id, patient_id, from_stage, to_stage, reason, source_table, source_id, changed_by)
    values
      (v_clinic, p_lead_id, v_patient, v_current, v_new, p_reason, p_source_table, p_source_id, (select auth.uid()));
  end if;
end;
$$;

comment on function crm.fn_recalc_lead_stage(uuid, text, uuid, text) is
  'Escritora oficial de leads.current_stage: maior estagio alcancado a partir de '
  'appointments/budgets, perdido override por lost_at, historico so em mudanca real.';

-- ----------------------------------------------------------------------------
-- 4) WRAPPER DE TRIGGER (deriva o lead_id conforme a tabela de origem)
-- ----------------------------------------------------------------------------
create or replace function crm.fn_trg_recalc_lead_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead uuid;
begin
  if tg_table_name = 'leads' then
    v_lead := new.id;
  else
    v_lead := new.lead_id;   -- appointments / budgets
  end if;

  perform crm.fn_recalc_lead_stage(v_lead, tg_table_name, new.id, null);
  return null;  -- AFTER trigger
end;
$$;

comment on function crm.fn_trg_recalc_lead_stage() is
  'Wrapper de trigger: chama crm.fn_recalc_lead_stage com o lead correto '
  '(NEW.lead_id em appointments/budgets; NEW.id em leads).';

-- EXECUTE: sem public; helper de rank tambem p/ authenticated (uso em queries).
revoke execute on function crm.fn_recalc_lead_stage(uuid, text, uuid, text) from public;
revoke execute on function crm.fn_trg_recalc_lead_stage() from public;
revoke execute on function crm.lead_stage_rank(crm.lead_stage) from public;
grant execute on function crm.fn_recalc_lead_stage(uuid, text, uuid, text) to service_role;
grant execute on function crm.lead_stage_rank(crm.lead_stage) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5) TRIGGERS
-- ----------------------------------------------------------------------------
drop trigger if exists trg_appointments_recalc_stage on crm.appointments;
create trigger trg_appointments_recalc_stage
  after insert or update of status on crm.appointments
  for each row execute function crm.fn_trg_recalc_lead_stage();

drop trigger if exists trg_budgets_recalc_stage on crm.budgets;
create trigger trg_budgets_recalc_stage
  after insert or update of status on crm.budgets
  for each row execute function crm.fn_trg_recalc_lead_stage();

drop trigger if exists trg_leads_recalc_stage_on_lost on crm.leads;
create trigger trg_leads_recalc_stage_on_lost
  after update of lost_at on crm.leads
  for each row execute function crm.fn_trg_recalc_lead_stage();

-- ----------------------------------------------------------------------------
-- 6) PROTECAO DAS COLUNAS DERIVADAS DE crm.leads
--    Remove o UPDATE de tabela (concedido na 006) e reconcede UPDATE apenas nas
--    colunas editaveis pela aplicacao. current_stage/last_contact_at/last_activity_at
--    passam a ser escritas SO pelas funcoes SECURITY DEFINER (owner bypassa coluna).
-- ----------------------------------------------------------------------------
revoke update on crm.leads from authenticated;
grant update (
  owner_id,
  source_id,
  lost_at,
  lost_reason,
  lost_by,
  source_system,
  external_ref
) on crm.leads to authenticated;
-- ============================================================================
