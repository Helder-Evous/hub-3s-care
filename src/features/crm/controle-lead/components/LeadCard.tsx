// Card visual de um lead no board. Apresenta paciente, telefone, origem,
// responsavel, ultimo contato e data de criacao. Somente apresentacao —
// nao consulta nem muta dados.
import { Link } from "@tanstack/react-router";
import { Phone, Clock, CalendarDays, User, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { SOURCE_CATEGORY_TONE } from "../labels";
import { maskPhone, formatRelative, formatDate } from "../utils";
import type { LeadBoardCard } from "../types";

type Props = {
  card: LeadBoardCard;
  /** true quando renderizado dentro do DragOverlay (estilo elevado, sem link). */
  dragging?: boolean;
};

export function LeadCard({ card, dragging = false }: Props) {
  const semContato = card.last_contact_at == null;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm transition",
        dragging
          ? "rotate-1 cursor-grabbing shadow-lg ring-2 ring-primary/40"
          : "cursor-grab hover:border-primary/50 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight text-foreground">
            {card.patient?.full_name ?? "—"}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            {maskPhone(card.patient?.phone ?? null)}
          </div>
        </div>
        {card.source && (
          <StatusBadge tone={SOURCE_CATEGORY_TONE[card.source.category]}>
            {card.source.label}
          </StatusBadge>
        )}
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 truncate">
          <User className="h-3 w-3 shrink-0" />
          {card.owner_id ? "Atribuído" : "Sem responsável"}
        </span>
        <span className="flex items-center gap-1 truncate">
          <CalendarDays className="h-3 w-3 shrink-0" />
          Criado {formatDate(card.created_at)}
        </span>
        <span
          className={cn(
            "col-span-2 flex items-center gap-1 truncate",
            semContato && "text-warning",
          )}
        >
          <Clock className="h-3 w-3 shrink-0" />
          {semContato ? "Sem contato" : `Últ. contato ${formatRelative(card.last_contact_at)}`}
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
