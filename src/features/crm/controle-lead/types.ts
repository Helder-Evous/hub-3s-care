// Tipos de UI do modulo Controle de Lead (dominio CRM).
// Derivados dos tipos do schema crm (temporariamente em crm-types.ts).
import type { CrmTables, LeadStage } from "@/integrations/supabase/crm-types";

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
};

/** Coluna do board (um estagio do funil). */
export type LeadBoardColumn = {
  stage: LeadStage;
  label: string;
  cards: LeadBoardCard[];
};
