// Board com drag & drop (SOMENTE FRONTEND). Mantem um estado local das colunas
// derivado dos dados reais e move cartoes entre colunas apenas visualmente.
// NAO ha mutation, NAO ha persistencia: ao refazer a query o estado se realinha.
import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { groupLeadsByStage } from "../utils";
import { LeadColumn } from "./LeadColumn";
import { LeadCard } from "./LeadCard";
import type { LeadBoardCard, LeadBoardColumn, LeadStageValue } from "../types";

export function LeadBoard({ leads }: { leads: LeadBoardCard[] }) {
  const [columns, setColumns] = useState<LeadBoardColumn[]>(() =>
    groupLeadsByStage(leads),
  );
  const [activeCard, setActiveCard] = useState<LeadBoardCard | null>(null);

  // Re-sincroniza com os dados reais quando a query muda (refetch/cache).
  useEffect(() => {
    setColumns(groupLeadsByStage(leads));
  }, [leads]);

  // distance:6 => um clique simples (sem arrasto) nao inicia drag, preservando
  // o link "Abrir" do cartao.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function findCard(id: string): LeadBoardCard | null {
    for (const col of columns) {
      const found = col.cards.find((c) => c.id === id);
      if (found) return found;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveCard(findCard(String(event.active.id)));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const targetStage = String(over.id) as LeadStageValue;

    setColumns((prev) => {
      let moved: LeadBoardCard | undefined;
      const without = prev.map((col) => {
        const hit = col.cards.find((c) => c.id === cardId);
        if (hit) moved = hit;
        return hit
          ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
          : col;
      });
      if (!moved || moved.current_stage === targetStage) return prev;

      // Movimento apenas visual: ajusta current_stage no estado LOCAL.
      const movedCard: LeadBoardCard = { ...moved, current_stage: targetStage };
      return without.map((col) =>
        col.stage === targetStage
          ? { ...col, cards: [movedCard, ...col.cards] }
          : col,
      );
    });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <LeadColumn key={column.stage} column={column} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div className="w-80">
            <LeadCard card={activeCard} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
