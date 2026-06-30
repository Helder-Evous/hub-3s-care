// Projecao operacional do Kanban da 3S (SOMENTE LEITURA / FRONTEND).
//
// O board da 3S NAO e uma copia direta de `lead.current_stage`. Ele e uma
// projecao que responde "qual e a proxima acao esperada do CRC para este lead?".
// Quando ha conflito entre historico e proxima acao, vence a proxima acao
// (ex.: compareceu no passado, mas existe novo agendamento futuro -> Agendado).
//
// Esta funcao NAO escreve nada no banco, NAO usa `current_stage` como fonte
// (exceto como unica fonte atual de "efetivado" — ver lacuna abaixo) e foi
// desenhada para ser extensivel a futuras fontes (importacoes, relatorios,
// integracoes, IA supervisionada) sem alterar a assinatura publica.
import type { LeadStage, AppointmentStatus } from "@/integrations/supabase/crm-types";

/**
 * Colunas operacionais exibidas no board da 3S (mesa do CRC, ver ADR-0003).
 * `Efetivou` NÃO é coluna: o comparecimento encerra a operação da 3S; a
 * efetivação é indicador/resultado posterior, não fila do CRC.
 */
export type LeadOperationalColumn =
  | "novo"
  | "agendado"
  | "remarcar"
  | "compareceu"
  | "perdido";

/** Agendamento ativo no futuro = ainda vai acontecer e nao foi desfeito. */
const FUTURE_ACTIVE: ReadonlySet<AppointmentStatus> = new Set([
  "agendado",
  "confirmado",
  "remarcado",
]);

/** Agenda vencida sem desfecho registrado (continua "em aberto"). */
const OVERDUE_PENDING: ReadonlySet<AppointmentStatus> = new Set([
  "agendado",
  "confirmado",
  "remarcado",
]);

/** Desfechos que exigem novo agendamento quando nao ha futuro ativo. */
const NEEDS_RESCHEDULE: ReadonlySet<AppointmentStatus> = new Set(["faltou", "cancelado"]);

/** Minimo necessario de um appointment para a projecao (subconjunto de LeadAppointmentRow). */
export type OperationalAppointment = {
  scheduled_at: string | null;
  status: AppointmentStatus;
};

/** Minimo necessario de um lead para a projecao. */
export type OperationalLead = {
  lost_at: string | null;
  current_stage: LeadStage;
};

const toMs = (iso: string | null): number => (iso ? new Date(iso).getTime() : NaN);

/**
 * Resolve a coluna operacional de um lead a partir dos fatos do dominio.
 * Prioridade aprovada (a primeira condicao satisfeita vence):
 *
 *  1. `lost_at != null`                                  -> perdido
 *  2. existe agendamento futuro ativo                    -> agendado
 *  3. agenda vencida sem desfecho, ou falta/cancelamento
 *     sem novo futuro ativo                              -> remarcar
 *  4. lead efetivado (current_stage) ou compareceu sem
 *     proxima acao agendada                              -> compareceu
 *  5. nenhuma condicao anterior                          -> novo
 *
 * `Efetivou` NAO e coluna (ADR-0003): efetivacao vira indicador, nao fila.
 */
export function resolveLeadOperationalState(
  lead: OperationalLead,
  appointments: ReadonlyArray<OperationalAppointment>,
  now: Date = new Date(),
): LeadOperationalColumn {
  // P1 — perdido vence tudo.
  if (lead.lost_at != null) return "perdido";

  const nowMs = now.getTime();

  // P2 — proxima acao: comparecer ao agendamento futuro ativo.
  const hasFutureActive = appointments.some((a) => {
    const ms = toMs(a.scheduled_at);
    return FUTURE_ACTIVE.has(a.status) && !Number.isNaN(ms) && ms >= nowMs;
  });
  if (hasFutureActive) return "agendado";

  // P3 — proxima acao: remarcar. Como ja retornamos em P2 quando ha futuro
  // ativo, aqui nunca existe futuro ativo.
  const hasOverduePending = appointments.some((a) => {
    const ms = toMs(a.scheduled_at);
    return OVERDUE_PENDING.has(a.status) && !Number.isNaN(ms) && ms < nowMs;
  });
  const hasNeedsReschedule = appointments.some((a) => NEEDS_RESCHEDULE.has(a.status));
  if (hasOverduePending || hasNeedsReschedule) return "remarcar";

  // Efetivado (ADR-0003) NÃO é coluna. Um lead já efetivado esteve na clínica:
  // projeta em "Compareceu" (encerramento operacional), nunca some do board.
  // A efetivação em si vira indicador/badge, fora do Kanban.
  if (lead.current_stage === "efetivado") return "compareceu";

  // P4 — compareceu e nao ha proxima acao agendada.
  const hasAttended = appointments.some((a) => a.status === "compareceu");
  if (hasAttended) return "compareceu";

  // P6 — sem fatos operacionais relevantes.
  return "novo";
}
