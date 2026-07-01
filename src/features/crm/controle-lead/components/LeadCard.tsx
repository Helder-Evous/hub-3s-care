// Card OPERACIONAL do Controle de Lead (S2-3) — "Painel Operacional do CRC".
// Cada elemento responde a uma pergunta que o CRC faz durante o atendimento:
// quem e o paciente? de qual unidade? quem e o responsavel? alguem esta usando?
// quantas tentativas? ha quanto tempo parado? qual e a proxima acao?
//
// Somente apresentacao — NAO consulta nem muta dados. As acoes reais de operacao
// (S2-2B) vivem no detalhe do lead ("Abrir"). DnD continua apenas visual.
import { Link } from "@tanstack/react-router";
import { Phone, User, Building2, CalendarDays, Clock, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import {
  SOURCE_CATEGORY_TONE,
  OPERATIONAL_COLUMN_LABELS,
  OPERATIONAL_COLUMN_ACCENT,
  OPERATIONAL_NEXT_ACTION,
} from "../labels";
import { maskPhone, formatRelative, formatDateTime, formatDurationSince } from "../utils";
import {
  operationalColumnOf,
  nextActiveAppointment,
  stoppedSince,
  attemptsSummaryOf,
  presenceOf,
  priorityOf,
} from "../card-presenter";
import type { LeadBoardCard } from "../types";
import { AttemptsSummary } from "./AttemptsSummary";
import { PresenceBadge, presenceTone } from "./PresenceBadge";
import { PriorityBadge } from "./PriorityBadge";

type Props = {
  card: LeadBoardCard;
  /** Nome da unidade (clinica) resolvido no board. "—" quando desconhecido. */
  clinicName?: string;
  /** true quando renderizado dentro do DragOverlay (estilo elevado, sem link). */
  dragging?: boolean;
};

const Divider = () => <div className="my-2 border-t" />;

export function LeadCard({ card, clinicName, dragging = false }: Props) {
  const column = operationalColumnOf(card);
  const accent = OPERATIONAL_COLUMN_ACCENT[column];
  const nextAppt = nextActiveAppointment(card);
  const parado = formatDurationSince(stoppedSince(card));
  const attempts = attemptsSummaryOf(card);
  const presence = presenceOf(card);
  const priority = priorityOf(card);
  const tone = presenceTone(presence);

  const isTrafegoPago = card.source?.category === "paga";
  const isTerminal = column === "compareceu" || column === "perdido";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card p-3 pl-4 shadow-sm transition",
        // Borda por presenca (design-only): verde=voce, ambar=outro CRC.
        tone === "self" && "border-green-500 ring-1 ring-green-500/30",
        tone === "other" && "border-amber-500 ring-1 ring-amber-500/30",
        dragging
          ? "rotate-1 cursor-grabbing shadow-lg ring-2 ring-primary/40"
          : "cursor-grab hover:border-primary/50 hover:shadow-md",
      )}
    >
      {/* Barra lateral colorida pela coluna operacional. */}
      <span className={cn("absolute inset-y-0 left-0 w-1.5", accent.bar)} aria-hidden />

      {/* Identidade: paciente + origem (destaque se trafego pago). */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate text-sm font-semibold leading-tight text-foreground">
            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {card.patient?.full_name ?? "—"}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            {maskPhone(card.patient?.phone ?? null)}
          </div>
        </div>
        {card.source && (
          <StatusBadge tone={SOURCE_CATEGORY_TONE[card.source.category]}>
            {isTrafegoPago ? `⚡ ${card.source.label}` : card.source.label}
          </StatusBadge>
        )}
      </div>

      {/* Unidade (obrigatoria) + responsavel (owner) + presenca. */}
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1 truncate">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{clinicName ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <User className="h-3 w-3 shrink-0" />
          Responsável: <span className="font-medium text-foreground">{card.owner_name ?? "Sem responsável"}</span>
        </div>
        <PresenceBadge presence={presence} />
      </div>

      {/* Prioridade (so aparece se houver dado) + tempo parado. */}
      {(priority || parado) && (
        <>
          <Divider />
          <div className="flex items-center justify-between gap-2">
            <PriorityBadge priority={priority} />
            {parado && (
              <span className="ml-auto text-xs text-muted-foreground">
                Parado há <span className="font-semibold text-foreground">{parado}</span>
              </span>
            )}
          </div>
        </>
      )}

      {/* Tentativas — SEMPRE visivel. */}
      <Divider />
      <AttemptsSummary summary={attempts} />

      {/* Proxima acao — em destaque (o que o CRC deve fazer agora). */}
      <Divider />
      <div>
        <div className={cn("text-[11px] font-semibold uppercase tracking-wide", accent.text)}>
          Próxima ação
        </div>
        <div
          className={cn(
            "mt-0.5 text-base font-bold leading-tight",
            isTerminal ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {OPERATIONAL_NEXT_ACTION[column]}
        </div>
        {nextAppt && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {formatDateTime(nextAppt.scheduled_at)}
          </div>
        )}
      </div>

      {/* Rodape: status operacional + ultimo contato + abrir (entra p/ operar). */}
      <Divider />
      <div className="flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1 text-xs font-medium", accent.text)}>
          <span className={cn("h-2 w-2 shrink-0 rounded-full", accent.dot)} />
          {OPERATIONAL_COLUMN_LABELS[column]}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          {card.last_contact_at ? formatRelative(card.last_contact_at) : "Sem contato"}
        </span>
      </div>

      {!dragging && (
        <div className="mt-2 flex justify-end">
          <Link
            to="/crm/controle-lead/$id"
            params={{ id: card.id }}
            // impede que o clique no link inicie um drag do cartao
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
          >
            Abrir
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
