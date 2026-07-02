-- ============================================================================
-- Migration 014 — Controle de Lead: crm.appointments.source_attempt_id
--                 (vínculo Appointment -> Tentativa de origem) + índice de
--                 elegibilidade em crm.lead_attempts.
-- ----------------------------------------------------------------------------
-- Objetivo : ligar cada agendamento à tentativa que o originou
--            (Lead -> LeadAttempt -> Appointment), garantindo que uma tentativa
--            origine NO MÁXIMO um appointment (unique parcial). Base p/ a camada
--            find-or-create (futura, NÃO nesta migration).
-- Depende  : 008 (crm.appointments), 013 (crm.lead_attempts).
-- Escopo   : ADITIVA e REVERSÍVEL. Coluna NULLABLE (compatível com appointments
--            legados; SEM backfill). NÃO torna a tentativa obrigatória. SEM
--            trigger/RPC find-or-create. SEM mudança de status, SEM mudança em
--            scheduled_by, SEM alteração de RLS/policies, SEM frontend.
-- Grants   : não alterados. INSERT de authenticated (grant de tabela da 008)
--            já cobre a nova coluna; a coluna NÃO entra na lista de UPDATE de
--            authenticated (012), logo é efetivamente write-once p/ o operador.
-- Aplicação: NÃO aplicada por este commit. Fluxo DEV (xcqfdnymadeqeuacqotu) ->
--            validar -> Principal (nndvcsdevbxpgsccyimm), aprovação do Jheferson.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) COLUNA (nullable, aditiva)
-- ----------------------------------------------------------------------------
alter table crm.appointments
  add column if not exists source_attempt_id uuid;

comment on column crm.appointments.source_attempt_id is
  'Tentativa (crm.lead_attempts) que originou este agendamento (Lead -> '
  'LeadAttempt -> Appointment). NULLABLE nesta fase (appointments legados e '
  'fluxo atual sem tentativa). Uma tentativa origina no maximo um appointment.';

-- ----------------------------------------------------------------------------
-- 2) FK -> crm.lead_attempts(id)
--    ON DELETE RESTRICT: preserva o vinculo/historico (tentativas sao
--    append-only e nao devem ser apagadas enquanto originarem um agendamento).
--    Idempotente (guardada por pg_constraint), a exemplo da 012.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_source_attempt_fk'
  ) then
    alter table crm.appointments
      add constraint appointments_source_attempt_fk
      foreign key (source_attempt_id) references crm.lead_attempts (id)
      on delete restrict;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3) UNIQUE PARCIAL — uma tentativa origina NO MÁXIMO um appointment.
--    Índice parcial (apenas linhas com source_attempt_id NOT NULL):
--      * garante o invariante 1 tentativa -> <= 1 appointment;
--      * serve como índice de cobertura da FK para buscas por source_attempt_id
--        (os NULLs — appointments legados/sem tentativa — nao precisam ser
--        indexados). Por isso NAO criamos um segundo indice simples redundante.
--    NULLs multiplos sao permitidos (varios appointments podem ter NULL).
-- ----------------------------------------------------------------------------
create unique index if not exists appointments_source_attempt_unique
  on crm.appointments (source_attempt_id)
  where source_attempt_id is not null;

-- ----------------------------------------------------------------------------
-- 4) ÍNDICE DE ELEGIBILIDADE em crm.lead_attempts (lead_id, attempted_at)
--    Suporta a consulta da janela de elegibilidade (24h) por lead na futura
--    camada find-or-create. Aditivo.
-- ----------------------------------------------------------------------------
create index if not exists lead_attempts_lead_attempted_idx
  on crm.lead_attempts (lead_id, attempted_at);

-- ============================================================================
-- ROLLBACK (manual, se necessario):
--   drop index if exists crm.lead_attempts_lead_attempted_idx;
--   drop index if exists crm.appointments_source_attempt_unique;
--   alter table crm.appointments drop constraint if exists appointments_source_attempt_fk;
--   alter table crm.appointments drop column if exists source_attempt_id;
-- ============================================================================
