// Derivacoes PURAS do card operacional (S2-3). Sem estado, sem I/O, sem escrita.
// O card e um "Painel Operacional do CRC": estas funcoes traduzem os fatos do
// dominio (leads + appointments) nas perguntas operacionais do CRC.
//
// IMPORTANTE (gaps documentados em knowledge/12):
//  - Tentativas: `crm.lead_attempts` NAO existe ainda -> total sempre 0.
//  - Presenca: `crm.lead_presence` NAO existe ainda -> sempre null.
//  - Prioridade: sem fonte hoje (IA Supervisor no futuro) -> sempre null.
// Nada e inventado: quando nao ha fonte, retornamos o "vazio" honesto.
import type { LeadOperationalColumn } from "./operational-state";
import { resolveLeadOperationalState } from "./operational-state";
import type {
  LeadBoardCard,
  LeadAppointmentRow,
  LeadAttemptsSummary,
  LeadPresence,
  LeadPriority,
} from "./types";

const FUTURE_ACTIVE = new Set(["agendado", "confirmado", "remarcado"]);
const toMs = (iso: string | null): number => (iso ? new Date(iso).getTime() : NaN);

/** Coluna operacional do lead (mesma projecao do board, computada por card). */
export function operationalColumnOf(
  card: LeadBoardCard,
  now: Date = new Date(),
): LeadOperationalColumn {
  return resolveLeadOperationalState(card, card.appointments, now);
}

/**
 * Proximo agendamento ATIVO no futuro (o que o CRC precisa acompanhar).
 * null quando nao ha agendamento futuro ativo.
 */
export function nextActiveAppointment(
  card: LeadBoardCard,
  now: Date = new Date(),
): LeadAppointmentRow | null {
  const nowMs = now.getTime();
  const futures = card.appointments
    .filter((a) => {
      const ms = toMs(a.scheduled_at);
      return FUTURE_ACTIVE.has(a.status) && !Number.isNaN(ms) && ms >= nowMs;
    })
    .sort((a, b) => toMs(a.scheduled_at) - toMs(b.scheduled_at));
  return futures[0] ?? null;
}

/**
 * Timestamp de referencia para "Parado há ...": o ultimo movimento conhecido do
 * lead. PROXY honesto — nao ha timestamp por transicao operacional no schema
 * (gap de dwell-time exato registrado em knowledge/12). Usa o mais recente entre
 * lost_at, last_activity_at, last_contact_at e created_at.
 */
export function stoppedSince(card: LeadBoardCard): string {
  const candidates = [
    card.lost_at,
    card.last_activity_at,
    card.last_contact_at,
    card.created_at,
  ].filter((v): v is string => Boolean(v));
  return candidates.reduce((a, b) => (new Date(b).getTime() > new Date(a).getTime() ? b : a));
}

/**
 * Resumo de tentativas. DESIGN-ONLY ate `crm.lead_attempts` existir:
 * total = 0, last = null. Nada inventado.
 */
export function attemptsSummaryOf(_card: LeadBoardCard): LeadAttemptsSummary {
  return { total: 0, last: null };
}

/**
 * Presenca de CRC no lead. DESIGN-ONLY: sem fonte hoje -> sempre null.
 * Quando `crm.lead_presence` existir, esta funcao passara a derivar o estado.
 */
export function presenceOf(_card: LeadBoardCard): LeadPresence | null {
  return null;
}

/**
 * Prioridade do lead. DESIGN-ONLY: sem fonte hoje -> sempre null.
 * O badge so aparece quando houver dado real (IA Supervisor no futuro).
 */
export function priorityOf(_card: LeadBoardCard): LeadPriority | null {
  return null;
}
