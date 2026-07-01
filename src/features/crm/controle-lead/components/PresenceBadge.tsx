// Indicador de presenca de CRC no card (S2-3). DESIGN-ONLY: sem backend,
// sem realtime, sem lock. Renderiza null quando nao ha presenca (estado padrao
// "livre"). Quando `crm.lead_presence` existir, este componente exibira:
//  - proprio CRC:  🟢 Você está atendendo  (card com borda verde)
//  - outro CRC:    🟡 Em uso por X          (card com borda ambar)
// A borda do card e aplicada pelo LeadCard a partir de `presenceTone`.
import type { LeadPresence } from "../types";

export function PresenceBadge({ presence }: { presence: LeadPresence | null }) {
  if (!presence) return null; // livre: nenhum indicador

  if (presence.is_self) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
        Você está atendendo
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
      Em uso por {presence.user_name}
    </div>
  );
}

/** Tom da borda do card conforme presenca (design-only). null quando livre. */
export function presenceTone(presence: LeadPresence | null): "self" | "other" | null {
  if (!presence) return null;
  return presence.is_self ? "self" : "other";
}
