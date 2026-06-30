// Utilitarios do board do Controle de Lead (agrupamento, mascaras, datas).
import type { LeadBoardCard, LeadBoardColumn } from "./types";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "./labels";

/**
 * Agrupa os leads por `current_stage` na ordem canonica, com a coluna
 * `perdido` ao final. current_stage e DERIVADO no banco (read-only aqui).
 */
export function groupLeadsByStage(cards: LeadBoardCard[]): LeadBoardColumn[] {
  const columns: LeadBoardColumn[] = LEAD_STAGE_ORDER.map((stage) => ({
    stage,
    label: LEAD_STAGE_LABELS[stage],
    cards: [],
  }));
  const lost: LeadBoardColumn = {
    stage: "perdido",
    label: LEAD_STAGE_LABELS.perdido,
    cards: [],
  };

  const byStage = new Map(columns.map((c) => [c.stage, c]));
  for (const card of cards) {
    if (card.current_stage === "perdido") {
      lost.cards.push(card);
    } else {
      byStage.get(card.current_stage)?.cards.push(card);
    }
  }

  return [...columns, lost];
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
