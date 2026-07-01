// Badge de prioridade do lead (S2-3). DESIGN-ONLY: sem fonte de dados hoje.
// Renderiza null enquanto nao houver prioridade real (nao inventamos prioridade).
// Futuro: alimentado pelo IA Supervisor.
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadPriority } from "../types";

const PRIORITY_LABEL: Record<LeadPriority, string> = {
  alta: "Alta prioridade",
  media: "Média prioridade",
  baixa: "Baixa prioridade",
};

const PRIORITY_CLASS: Record<LeadPriority, string> = {
  alta: "text-red-600",
  media: "text-amber-600",
  baixa: "text-muted-foreground",
};

export function PriorityBadge({ priority }: { priority: LeadPriority | null }) {
  if (!priority) return null; // sem dado: nao aparece

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", PRIORITY_CLASS[priority])}>
      <Star className="h-3.5 w-3.5 shrink-0 fill-current" />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
