// Utilitarios do board do Controle de Lead (agrupamento, mascaras, datas).
import type { LeadBoardCard, LeadBoardColumn } from "./types";
import { OPERATIONAL_COLUMN_LABELS, OPERATIONAL_COLUMN_ORDER } from "./labels";
import { resolveLeadOperationalState } from "./operational-state";

/**
 * Agrupa os leads pela coluna OPERACIONAL da 3S (projecao), na ordem
 * `novo, agendado, remarcar, compareceu, perdido` (Efetivou nao e coluna — ADR-0003).
 *
 * A coluna NAO e `current_stage`: ela e derivada dos fatos do dominio
 * (`lost_at`, `appointments`) por `resolveLeadOperationalState`. Nada e
 * persistido — projecao puramente de leitura. `current_stage` permanece como
 * dado historico/canonico (usado no detalhe e no historico do lead).
 */
export function groupLeadsByOperationalColumn(
  cards: LeadBoardCard[],
  now: Date = new Date(),
): LeadBoardColumn[] {
  const columns: LeadBoardColumn[] = OPERATIONAL_COLUMN_ORDER.map((stage) => ({
    stage,
    label: OPERATIONAL_COLUMN_LABELS[stage],
    cards: [],
  }));

  const byColumn = new Map(columns.map((c) => [c.stage, c]));
  for (const card of cards) {
    const column = resolveLeadOperationalState(card, card.appointments, now);
    byColumn.get(column)?.cards.push(card);
  }

  return columns;
}

/**
 * Combina data (`yyyy-mm-dd`) + hora (`HH:mm`) do formulario em um ISO string
 * (UTC) para gravar em `scheduled_at`. Interpreta no fuso LOCAL do operador.
 * Retorna null se a data/hora forem invalidas.
 */
export function combineDateTimeToISO(date: string, time: string): string | null {
  if (!date || !time) return null;
  const dt = new Date(`${date}T${time}`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

/** Mascara minima de telefone para a UI (mostra apenas os ultimos digitos). */
export function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `••• ${digits.slice(-4)}`;
}

/** Formata um timestamp ISO como tempo relativo curto (pt-BR). */
export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `há ${diffD} d`;
  return date.toLocaleDateString("pt-BR");
}

/** Formata um timestamp ISO como data curta dd/mm/aa (pt-BR). */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/** Data + hora curtas dd/mm/aa HH:mm (pt-BR). */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Valor monetario em BRL (— quando nulo). */
export function formatCurrency(value: number | null, currency = "BRL"): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}
