// Mutations do Controle de Lead — criar lead real (paciente + lead) usando
// Supabase JS no schema crm, com a AUTENTICACAO NORMAL do operador (RLS aplica).
// NUNCA usa service_role. NAO seta current_stage (derivado pelo dominio).
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ActivityType } from "@/integrations/supabase/crm-types";
import { crmSchema } from "./queries";

/**
 * Replica a normalizacao E.164 do trigger crm.fn_normalize_patient (heuristica
 * BR, default +55). Usada para DEDUP por telefone (busca em phone_normalized).
 * Retorna null para telefones invalidos (menos de 10 digitos uteis).
 */
export function normalizePhoneBR(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length < 10) return null; // BR: DDD (2) + numero (8/9)
  if (digits.slice(0, 2) === "55") return "+" + digits;
  if (digits.length === 10 || digits.length === 11) return "+55" + digits;
  return "+" + digits;
}

export type CreateLeadInput = {
  clinic_id: string;
  full_name: string;
  phone: string;
  source_id: string | null;
  owner_id: string | null;
};

export type CreateLeadResult = {
  leadId: string;
  patientId: string;
  reusedPatient: boolean;
};

/**
 * Deduplicacao por telefone normalizado DENTRO da clinica:
 * - procura paciente existente por (clinic_id, phone_normalized);
 * - se existir, reutiliza (nunca duplica);
 * - se nao, cria o paciente (o trigger preenche phone_normalized/cpf).
 */
export async function createPatientIfNeeded(args: {
  clinic_id: string;
  full_name: string;
  phone: string;
}): Promise<{ patientId: string; reused: boolean }> {
  const normalized = normalizePhoneBR(args.phone);
  if (!normalized) {
    throw { code: "PHONE_INVALID", message: "Telefone inválido." };
  }

  const { data: existing, error: findErr } = await crmSchema()
    .from("patients")
    .select("id")
    .eq("clinic_id", args.clinic_id)
    .eq("phone_normalized", normalized)
    .limit(1);
  if (findErr) throw findErr;

  const rows = (existing ?? []) as unknown as { id: string }[];
  if (rows.length > 0) {
    return { patientId: rows[0].id, reused: true };
  }

  const { data: inserted, error: insErr } = await crmSchema()
    .from("patients")
    .insert({
      clinic_id: args.clinic_id,
      full_name: args.full_name,
      phone: args.phone,
    })
    .select("id")
    .single();
  if (insErr) throw insErr;

  return { patientId: (inserted as unknown as { id: string }).id, reused: false };
}

/**
 * Cria o lead. NAO seta current_stage (default 'novo', derivado pelo dominio).
 * owner_id = operador atual (responsavel inicial). source_id opcional.
 */
export async function createLead(args: {
  clinic_id: string;
  patient_id: string;
  source_id: string | null;
  owner_id: string | null;
}): Promise<string> {
  const payload: Record<string, unknown> = {
    clinic_id: args.clinic_id,
    patient_id: args.patient_id,
    source_id: args.source_id,
    owner_id: args.owner_id,
  };

  const { data, error } = await crmSchema().from("leads").insert(payload).select("id").single();
  if (error) throw error;

  return (data as unknown as { id: string }).id;
}

/** Mapeia erros (Postgres/PostgREST) para mensagens amigaveis ao operador. */
export function mapMutationError(e: unknown): string {
  const err = e as { code?: string; message?: string } | null;
  const code = err?.code;
  const msg = err?.message ?? "";

  if (code === "PHONE_INVALID") return "Telefone inválido.";
  if (code === "23505") return "Registro duplicado para esta clínica.";
  if (code === "23503") return "Dados relacionados inválidos (clínica ou origem).";
  if (code === "42501" || /row-level security/i.test(msg)) {
    return "Sem permissão para criar leads nesta clínica.";
  }
  if (msg) return `Erro do banco: ${msg}`;
  return "Erro inesperado ao criar o lead.";
}

/**
 * Fluxo completo "Novo Lead": createPatientIfNeeded -> createLead.
 * Ao concluir, invalida a query do board para atualizacao automatica.
 */
export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation<CreateLeadResult, unknown, CreateLeadInput>({
    mutationFn: async (input) => {
      const { patientId, reused } = await createPatientIfNeeded({
        clinic_id: input.clinic_id,
        full_name: input.full_name,
        phone: input.phone,
      });
      const leadId = await createLead({
        clinic_id: input.clinic_id,
        patient_id: patientId,
        source_id: input.source_id,
        owner_id: input.owner_id,
      });
      return { leadId, patientId, reusedPatient: reused };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "controle-lead", "board"],
      });
    },
  });
}

// ----------------------------------------------------------------------------
// Registro de atividade (crm.lead_activities) — somente INSERT, sob RLS.
// Colunas reais: performed_by (= auth.uid()) e summary (observacao).
// NAO escreve last_contact_at/last_activity_at: derivados pela trigger
// crm.fn_touch_lead_activity (last_contact_at so p/ ligacao/whatsapp/email/visita).
// ----------------------------------------------------------------------------
export type CreateActivityInput = {
  clinic_id: string;
  lead_id: string;
  patient_id: string;
  performed_by: string;
  activity_type: ActivityType;
  summary: string | null;
};

export async function createLeadActivity(input: CreateActivityInput): Promise<string> {
  const { data, error } = await crmSchema()
    .from("lead_activities")
    .insert({
      clinic_id: input.clinic_id,
      lead_id: input.lead_id,
      patient_id: input.patient_id,
      performed_by: input.performed_by,
      activity_type: input.activity_type,
      summary: input.summary,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as unknown as { id: string }).id;
}

/**
 * Registra uma atividade e invalida detail + board para refletir o historico e
 * os campos derivados (last_contact_at/last_activity_at) atualizados pela trigger.
 */
export function useCreateLeadActivity() {
  const queryClient = useQueryClient();
  return useMutation<string, unknown, CreateActivityInput>({
    mutationFn: createLeadActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "controle-lead", "detail"],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm", "controle-lead", "board"],
      });
    },
  });
}

// ----------------------------------------------------------------------------
// S2-2A — Criar agendamento (crm.appointments) — somente INSERT, sob RLS.
// A app grava clinic_id, patient_id, lead_id, scheduled_at, professional_name,
// procedure_name. O banco define status='agendado' (default). NAO escreve
// current_stage/lead_stage_history/last_contact_at/last_activity_at: a derivacao
// de estagio fica por conta da trigger crm.fn_recalc_lead_stage (AFTER INSERT).
// Sem coluna de observacao: nada de nota/lead_activity neste incremento.
// ----------------------------------------------------------------------------
export type CreateAppointmentInput = {
  clinic_id: string;
  lead_id: string;
  patient_id: string;
  scheduled_at: string; // ISO (timestamptz)
  professional_name: string | null;
  procedure_name: string | null;
};

export async function createAppointment(input: CreateAppointmentInput): Promise<string> {
  const { data, error } = await crmSchema()
    .from("appointments")
    .insert({
      clinic_id: input.clinic_id,
      patient_id: input.patient_id,
      lead_id: input.lead_id,
      scheduled_at: input.scheduled_at,
      professional_name: input.professional_name,
      procedure_name: input.procedure_name,
      // status NAO enviado: usa o default 'agendado' da tabela.
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as unknown as { id: string }).id;
}

/**
 * Cria um agendamento e invalida detail + board. Como o board projeta o estado
 * operacional a partir de `appointments` (S2-0), o lead passa a aparecer em
 * "Agendado" quando o novo agendamento for futuro ativo.
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation<string, unknown, CreateAppointmentInput>({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "controle-lead", "detail"],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm", "controle-lead", "board"],
      });
    },
  });
}

/** Mapeia erros de criacao de agendamento para mensagens amigaveis. */
export function mapAppointmentError(e: unknown): string {
  const err = e as { code?: string; message?: string } | null;
  const code = err?.code;
  const msg = err?.message ?? "";

  if (code === "23505") return "Agendamento duplicado para esta clínica.";
  if (code === "23503") return "Dados relacionados inválidos (clínica, paciente ou lead).";
  if (code === "42501" || /row-level security/i.test(msg)) {
    return "Sem permissão para criar agendamentos nesta clínica.";
  }
  if (msg) return `Erro do banco: ${msg}`;
  return "Erro inesperado ao criar o agendamento.";
}
