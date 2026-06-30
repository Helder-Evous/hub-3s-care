// Tipos de UI do modulo Controle de Lead (dominio CRM).
// Derivados dos tipos do schema crm (temporariamente em crm-types.ts).
import type {
  CrmTables,
  LeadStage,
  PatientStatus,
  ActivityType,
  AppointmentStatus,
  BudgetStatus,
} from "@/integrations/supabase/crm-types";
import type { LeadOperationalColumn } from "./operational-state";

export type LeadStageValue = LeadStage;

/** Preview minimo do paciente embutido no card do board. */
export type LeadPatientPreview = {
  full_name: string;
  phone: string | null;
  status: CrmTables<"patients">["status"];
};

/** Preview da origem (lead_sources) embutida no card. */
export type LeadSourcePreview = {
  key: string;
  label: string;
  category: CrmTables<"lead_sources">["category"];
};

/** Card de lead ja mapeado para consumo da UI do board. */
export type LeadBoardCard = {
  id: string;
  clinic_id: string;
  patient_id: string;
  current_stage: LeadStage;
  owner_id: string | null;
  source_id: string | null;
  last_contact_at: string | null;
  last_activity_at: string | null;
  lost_at: string | null;
  created_at: string;
  patient: LeadPatientPreview | null;
  source: LeadSourcePreview | null;
  // Agendamentos do lead (subconjunto), usados para derivar a coluna
  // operacional do board. Read-only — nunca persistidos a partir do board.
  appointments: LeadAppointmentRow[];
};

/**
 * Coluna do board, identificada pela coluna OPERACIONAL da 3S (projecao).
 * Nao corresponde 1:1 ao enum `lead_stage` (ex.: `remarcar` so existe na UI).
 */
export type LeadBoardColumn = {
  stage: LeadOperationalColumn;
  label: string;
  cards: LeadBoardCard[];
};

// ----------------------------------------------------------------------------
// Detalhe do Lead (somente leitura) — tipos ja mapeados para a UI.
// ----------------------------------------------------------------------------

export type LeadStageHistoryRow = {
  id: string;
  from_stage: LeadStage | null;
  to_stage: LeadStage;
  changed_at: string;
  changed_by: string | null;
  reason: string | null;
  source_table: string | null;
};

export type LeadActivityRow = {
  id: string;
  activity_type: ActivityType;
  summary: string | null;
  occurred_at: string;
  created_at: string;
};

export type LeadAppointmentRow = {
  id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  attended_at: string | null;
  confirmed_at: string | null;
};

export type LeadBudgetRow = {
  id: string;
  total_amount: number | null;
  currency: string;
  status: BudgetStatus;
  presented_at: string | null;
};

/** Agregado completo do detalhe do lead (1 query, embeds sob RLS). */
export type LeadDetailData = {
  id: string;
  clinic_id: string;
  patient_id: string;
  current_stage: LeadStage;
  owner_id: string | null;
  owner_name: string | null;
  source: LeadSourcePreview | null;
  created_at: string;
  last_contact_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  patient: {
    full_name: string;
    phone: string | null;
    status: PatientStatus;
  } | null;
  history: LeadStageHistoryRow[];
  activities: LeadActivityRow[];
  appointments: LeadAppointmentRow[];
  budgets: LeadBudgetRow[];
};
