// Leituras do board do Controle de Lead via Supabase (schema crm).
// RLS escopa naturalmente (apenas clinicas do operador). Sem clinic_id
// hardcoded, sem service_role.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  CrmTables,
  LeadStage,
  SourceCategory,
  PatientStatus,
  ActivityType,
  AppointmentStatus,
  BudgetStatus,
} from "@/integrations/supabase/crm-types";
import type { LeadBoardCard, LeadDetailData } from "./types";

// Linha crua retornada pelo .select (com embeds patients/lead_sources).
type RawLeadRow = {
  id: string;
  clinic_id: string;
  patient_id: string;
  current_stage: CrmTables<"leads">["current_stage"];
  owner_id: string | null;
  source_id: string | null;
  last_contact_at: string | null;
  last_activity_at: string | null;
  lost_at: string | null;
  created_at: string;
  patients: {
    full_name: string;
    phone: string | null;
    status: CrmTables<"patients">["status"];
  } | null;
  lead_sources: {
    key: string;
    label: string;
    category: CrmTables<"lead_sources">["category"];
  } | null;
};

const LEADS_BOARD_SELECT =
  "id, clinic_id, patient_id, current_stage, owner_id, source_id, " +
  "last_contact_at, last_activity_at, lost_at, created_at, " +
  "patients ( full_name, phone, status ), " +
  "lead_sources ( key, label, category )";

/**
 * Board de leads do operador (todas as clinicas as quais ele tem acesso/RLS).
 * Usa o helper `crmSchema()` (cast temporario para o schema `crm`; ver crm-types.ts).
 */
export function useLeadsBoard() {
  return useQuery({
    queryKey: ["crm", "controle-lead", "board"],
    queryFn: async (): Promise<LeadBoardCard[]> => {
      const { data, error } = await crmSchema()
        .from("leads")
        .select(LEADS_BOARD_SELECT)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as unknown as RawLeadRow[];
      return rows.map((r) => ({
        id: r.id,
        clinic_id: r.clinic_id,
        patient_id: r.patient_id,
        current_stage: r.current_stage,
        owner_id: r.owner_id,
        source_id: r.source_id,
        last_contact_at: r.last_contact_at,
        last_activity_at: r.last_activity_at,
        lost_at: r.lost_at,
        created_at: r.created_at,
        patient: r.patients
          ? {
              full_name: r.patients.full_name,
              phone: r.patients.phone,
              status: r.patients.status,
            }
          : null,
        source: r.lead_sources
          ? {
              key: r.lead_sources.key,
              label: r.lead_sources.label,
              category: r.lead_sources.category,
            }
          : null,
      }));
    },
  });
}

/**
 * Cliente PostgREST escopado ao schema `crm` (cast temporario ate o types.ts
 * oficial public+crm; ver crm-types.ts). Reutilizado por queries e mutations.
 */
export function crmSchema() {
  return (
    supabase as unknown as {
      schema: (s: string) => ReturnType<typeof supabase.from>;
    }
  ).schema("crm");
}

/** Catalogo de origens (lead_sources) para o seletor do modal "Novo Lead". */
export function useLeadSources() {
  return useQuery({
    queryKey: ["crm", "controle-lead", "lead-sources"],
    queryFn: async (): Promise<{ id: string; key: string; label: string }[]> => {
      const { data, error } = await crmSchema()
        .from("lead_sources")
        .select("id, key, label")
        .order("label", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        key: string;
        label: string;
      }[];
    },
  });
}

/**
 * Clinicas em que o operador pode criar leads: modulo habilitado (enabled=true)
 * e com acesso (a RLS de module_clinics ja escopa por user_has_clinic_access).
 */
export function useEligibleClinics() {
  return useQuery({
    queryKey: ["crm", "controle-lead", "eligible-clinics"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await crmSchema()
        .from("module_clinics")
        .select("clinic_id")
        .eq("enabled", true);
      if (error) throw error;
      return ((data ?? []) as unknown as { clinic_id: string }[]).map((r) => r.clinic_id);
    },
  });
}

// ----------------------------------------------------------------------------
// Detalhe do lead — UMA query agregada via embeds PostgREST (tudo sob RLS).
// ----------------------------------------------------------------------------
const LEAD_DETAIL_SELECT =
  "id, clinic_id, patient_id, current_stage, owner_id, source_id, created_at, " +
  "last_contact_at, lost_at, lost_reason, " +
  "patients ( full_name, phone, status ), " +
  "lead_sources ( key, label, category ), " +
  "owner:user_profiles!leads_owner_id_fkey ( full_name ), " +
  "lead_stage_history ( id, from_stage, to_stage, changed_at, changed_by, reason, source_table ), " +
  "lead_activities ( id, activity_type, summary, occurred_at, created_at ), " +
  "appointments ( id, scheduled_at, status, attended_at, confirmed_at ), " +
  "budgets ( id, total_amount, currency, status, presented_at, created_at )";

type RawDetailRow = {
  id: string;
  clinic_id: string;
  patient_id: string;
  current_stage: LeadStage;
  owner_id: string | null;
  source_id: string | null;
  created_at: string;
  last_contact_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  patients: { full_name: string; phone: string | null; status: PatientStatus } | null;
  lead_sources: { key: string; label: string; category: SourceCategory } | null;
  owner: { full_name: string | null } | null;
  lead_stage_history:
    | {
        id: string;
        from_stage: LeadStage | null;
        to_stage: LeadStage;
        changed_at: string;
        changed_by: string | null;
        reason: string | null;
        source_table: string | null;
      }[]
    | null;
  lead_activities:
    | {
        id: string;
        activity_type: ActivityType;
        summary: string | null;
        occurred_at: string;
        created_at: string;
      }[]
    | null;
  appointments:
    | {
        id: string;
        scheduled_at: string;
        status: AppointmentStatus;
        attended_at: string | null;
        confirmed_at: string | null;
      }[]
    | null;
  budgets:
    | {
        id: string;
        total_amount: number | string | null;
        currency: string;
        status: BudgetStatus;
        presented_at: string | null;
        created_at: string;
      }[]
    | null;
};

const byDateDesc = (a: string | null, b: string | null) =>
  new Date(b ?? 0).getTime() - new Date(a ?? 0).getTime();

/** Detalhe agregado do lead (somente leitura). null quando nao encontrado/sem acesso. */
export function useLeadDetail(id: string) {
  return useQuery({
    queryKey: ["crm", "controle-lead", "detail", id],
    enabled: !!id,
    queryFn: async (): Promise<LeadDetailData | null> => {
      const { data, error } = await crmSchema()
        .from("leads")
        .select(LEAD_DETAIL_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const r = data as unknown as RawDetailRow;

      return {
        id: r.id,
        clinic_id: r.clinic_id,
        patient_id: r.patient_id,
        current_stage: r.current_stage,
        owner_id: r.owner_id,
        owner_name: r.owner?.full_name ?? null,
        source: r.lead_sources
          ? {
              key: r.lead_sources.key,
              label: r.lead_sources.label,
              category: r.lead_sources.category,
            }
          : null,
        created_at: r.created_at,
        last_contact_at: r.last_contact_at,
        lost_at: r.lost_at,
        lost_reason: r.lost_reason,
        patient: r.patients
          ? {
              full_name: r.patients.full_name,
              phone: r.patients.phone,
              status: r.patients.status,
            }
          : null,
        history: (r.lead_stage_history ?? [])
          .map((h) => ({
            id: h.id,
            from_stage: h.from_stage,
            to_stage: h.to_stage,
            changed_at: h.changed_at,
            changed_by: h.changed_by,
            reason: h.reason,
            source_table: h.source_table,
          }))
          .sort((a, b) => byDateDesc(a.changed_at, b.changed_at)),
        activities: (r.lead_activities ?? [])
          .map((a) => ({
            id: a.id,
            activity_type: a.activity_type,
            summary: a.summary,
            occurred_at: a.occurred_at,
            created_at: a.created_at,
          }))
          .sort((a, b) => byDateDesc(a.occurred_at, b.occurred_at)),
        appointments: (r.appointments ?? [])
          .map((ap) => ({
            id: ap.id,
            scheduled_at: ap.scheduled_at,
            status: ap.status,
            attended_at: ap.attended_at,
            confirmed_at: ap.confirmed_at,
          }))
          .sort((a, b) => byDateDesc(a.scheduled_at, b.scheduled_at)),
        budgets: (r.budgets ?? [])
          .map((bd) => ({
            id: bd.id,
            total_amount: bd.total_amount == null ? null : Number(bd.total_amount),
            currency: bd.currency,
            status: bd.status,
            presented_at: bd.presented_at,
          }))
          .sort((a, b) => byDateDesc(a.presented_at, b.presented_at)),
      };
    },
  });
}
