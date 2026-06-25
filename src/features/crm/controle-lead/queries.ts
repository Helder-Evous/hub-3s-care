// Leituras do board do Controle de Lead via Supabase (schema crm).
// RLS escopa naturalmente (apenas clinicas do operador). Sem clinic_id
// hardcoded, sem service_role.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CrmTables } from "@/integrations/supabase/crm-types";
import type { LeadBoardCard } from "./types";

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
 * NOTA: `supabase` esta tipado para o schema `public`; o schema `crm` ainda nao
 * esta no `types.ts` oficial (ver crm-types.ts temporario), por isso o cast em
 * `.schema("crm")`. Substituir quando o types.ts public+crm for gerado.
 */
export function useLeadsBoard() {
  return useQuery({
    queryKey: ["crm", "controle-lead", "board"],
    queryFn: async (): Promise<LeadBoardCard[]> => {
      const { data, error } = await (supabase as unknown as {
        schema: (s: string) => ReturnType<typeof supabase.from>;
      })
        .schema("crm")
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
