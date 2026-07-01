// Board com drag & drop (SOMENTE FRONTEND). Mantem um estado local das colunas
// derivado dos dados reais e move cartoes entre colunas apenas visualmente.
// NAO ha mutation, NAO ha persistencia: ao refazer a query o estado se realinha.
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useClinics } from "@/lib/queries";
import { groupLeadsByOperationalColumn } from "../utils";
import { LeadColumn } from "./LeadColumn";
import { LeadCard } from "./LeadCard";
import type { LeadBoardCard, LeadBoardColumn } from "../types";
import type { LeadOperationalColumn } from "../operational-state";

export function LeadBoard({ leads }: { leads: LeadBoardCard[] }) {
  const [columns, setColumns] = useState<LeadBoardColumn[]>(() =>
    groupLeadsByOperationalColumn(leads),
  );
  const [activeCard, setActiveCard] = useState<LeadBoardCard | null>(null);

  // Nome da unidade (obrigatorio no card). `clinics` vive no schema public;
  // resolvemos por mapa client-side (sem embed cross-schema). Leitura cacheada.
  const { data: clinics = [] } = useClinics();
  const clinicNames = useMemo(
    () => new Map(clinics.map((c) => [c.id, c.name])),
    [clinics],
  );

  // Re-sincroniza com os dados reais quando a query muda (refetch/cache).
  useEffect(() => {
    setColumns(groupLeadsByOperationalColumn(leads));
  }, [leads]);

  // distance:6 => um clique simples (sem arrasto) nao inicia drag, preservando
  // o link "Abrir" do cartao.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
    const targetStage = String(over.id) as LeadOperationalColumn;

    setColumns((prev) => {
      const sourceCol = prev.find((col) => col.cards.some((c) => c.id === cardId));
      if (!sourceCol || sourceCol.stage === targetStage) return prev;
      const moved = sourceCol.cards.find((c) => c.id === cardId);
      if (!moved) return prev;

      // Movimento APENAS visual: move o cartao entre as colunas do estado
      // local, SEM escrever `current_stage` (nem local, nem no banco). Um
      // refetch realinha pela projecao operacional.
      return prev.map((col) => {
        if (col.stage === sourceCol.stage) {
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        if (col.stage === targetStage) {
          return { ...col, cards: [moved, ...col.cards] };
        }
        return col;
      });
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <LeadColumn key={column.stage} column={column} clinicNames={clinicNames} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div className="w-80">
            <LeadCard
              card={activeCard}
              clinicName={clinicNames.get(activeCard.clinic_id)}
              dragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
