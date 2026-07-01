// Coluna do board (um estagio do funil). Droppable do @dnd-kit, com cabecalho,
// contador e lista de cartoes arrastaveis.
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { DraggableLeadCard } from "./DraggableLeadCard";
import type { LeadBoardColumn } from "../types";

export function LeadColumn({
  column,
  clinicNames,
}: {
  column: LeadBoardColumn;
  clinicNames: Map<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage });
  const isLost = column.stage === "perdido";

  return (
    <div className="flex w-80 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className={cn("text-sm font-semibold", isLost ? "text-critical" : "text-foreground")}>
          {column.label}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
          {column.cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[14rem] flex-1 flex-col gap-2 rounded-xl border bg-muted/30 p-2 transition-colors",
          isOver && "border-primary/60 bg-primary/5",
          isLost && "bg-critical/5",
        )}
      >
        {column.cards.length === 0 ? (
          <p className="px-1 py-10 text-center text-xs text-muted-foreground">Nenhum lead</p>
        ) : (
          column.cards.map((card) => (
            <DraggableLeadCard
              key={card.id}
              card={card}
              clinicName={clinicNames.get(card.clinic_id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
