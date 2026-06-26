// Embrulho de drag (frontend-only) ao redor do LeadCard, usando @dnd-kit/core.
// Nao persiste nada — apenas habilita a movimentacao visual no board.
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { LeadCard } from "./LeadCard";
import type { LeadBoardCard } from "../types";

export function DraggableLeadCard({ card }: { card: LeadBoardCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      className="touch-none outline-none"
    >
      <LeadCard card={card} />
    </div>
  );
}
