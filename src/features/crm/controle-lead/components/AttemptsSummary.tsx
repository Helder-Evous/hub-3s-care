// Bloco de tentativas do card operacional (S2-3). SEMPRE visivel.
// Enquanto `crm.lead_attempts` nao existir, total = 0 e o CTA "Registrar tentativa"
// fica DESABILITADO ("em breve") — nada e inventado. Ao clicar (no futuro) abrira
// o historico/registro de tentativas (drawer nao implementado nesta etapa).
import { Phone, Plus } from "lucide-react";
import { formatRelative } from "../utils";
import type { LeadAttemptsSummary } from "../types";

export function AttemptsSummary({ summary }: { summary: LeadAttemptsSummary }) {
  const { total, last } = summary;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Phone className="h-3.5 w-3.5 shrink-0" />
        Tentativas
      </div>
      <div className="text-sm font-semibold tabular-nums text-foreground">
        {total} {total === 1 ? "realizada" : "realizadas"}
      </div>
      {last ? (
        <div className="text-xs text-muted-foreground">
          Última: {formatRelative(last.at)} • {last.channel}
        </div>
      ) : (
        // CTA desabilitado ("em breve"): registrar tentativa ainda nao existe
        // (depende de crm.lead_attempts — ver knowledge/12). Induz o comportamento
        // sem prometer funcao inexistente.
        <button
          type="button"
          disabled
          title="Em breve"
          aria-disabled="true"
          onPointerDown={(e) => e.stopPropagation()}
          className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs font-medium text-muted-foreground/70"
        >
          <Plus className="h-3 w-3" />
          Registrar tentativa
        </button>
      )}
    </div>
  );
}
