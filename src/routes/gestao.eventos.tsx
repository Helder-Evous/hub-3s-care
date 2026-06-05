import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Activity, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/gestao/eventos")({
  head: () => ({ meta: [{ title: "Eventos do Sistema — Hub 3S" }] }),
  component: EventosPage,
});

const EVENT_LABELS: Record<string, string> = {
  cliente_criado:              "Cliente criado",
  produto_contratado:          "Produto contratado",
  venda_registrada:            "Venda registrada",
  onboarding_criado:           "Onboarding criado",
  etapa_onboarding_iniciada:   "Etapa iniciada",
  etapa_onboarding_concluida:  "Etapa concluída",
  onboarding_concluido:        "Onboarding concluído",
};

const EVENT_COLORS: Record<string, string> = {
  cliente_criado:              "bg-blue-500/10 text-blue-600 border-blue-500/20",
  produto_contratado:          "bg-purple-500/10 text-purple-600 border-purple-500/20",
  venda_registrada:            "bg-green-500/10 text-green-600 border-green-500/20",
  onboarding_criado:           "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  etapa_onboarding_iniciada:   "bg-orange-500/10 text-orange-600 border-orange-500/20",
  etapa_onboarding_concluida:  "bg-teal-500/10 text-teal-600 border-teal-500/20",
  onboarding_concluido:        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

function useSystemEvents() {
  return useQuery({
    queryKey: ["system_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_events")
        .select(`
          id, created_at, event_type, entity_type, entity_id,
          source, processed, error_message,
          payload,
          clinics:clinic_id ( name ),
          onboardings:onboarding_id ( product ),
          sales:sale_id ( product )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });
}

function EventBadge({ type }: { type: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
      EVENT_COLORS[type] ?? "bg-muted text-muted-foreground border-border",
    )}>
      {EVENT_LABELS[type] ?? type}
    </span>
  );
}

function ProcessedBadge({ processed }: { processed: boolean }) {
  return processed ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
      <CheckCircle2 className="h-3.5 w-3.5" /> Processado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" /> Pendente
    </span>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(new Date(iso));
}

type EventRow = Awaited<ReturnType<typeof useSystemEvents>["data"]>[number];

function payloadSummary(row: EventRow): string {
  if (!row) return "—";
  const p = row.payload as Record<string, unknown> | null;
  if (!p) return "—";
  const parts: string[] = [];
  if (p.step_key)     parts.push(`etapa: ${p.step_key}`);
  if (p.product)      parts.push(`produto: ${p.product}`);
  if (p.name)         parts.push(`nome: ${p.name}`);
  return parts.join(" · ") || "—";
}

function clinicName(row: EventRow): string {
  if (!row) return "—";
  const c = row.clinics as { name?: string } | null;
  return c?.name ?? "—";
}

export default function EventosPage() {
  const { data: events = [], isLoading, error } = useSystemEvents();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Eventos do Sistema</h1>
          <p className="text-sm text-muted-foreground">
            Log de eventos para observabilidade e agentes IA
          </p>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {events.length} evento{events.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Conteúdo */}
      {isLoading && (
        <div className="text-sm text-muted-foreground">Carregando eventos…</div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Erro ao carregar eventos: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && events.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <Activity className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="text-sm">Nenhum evento registrado ainda.</p>
          <p className="mt-1 text-xs">
            Registre uma venda ou avance uma etapa de onboarding para ver os eventos aqui.
          </p>
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Entidade</th>
                  <th className="px-4 py-3 font-medium">Detalhe</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <EventBadge type={ev.event_type} />
                    </td>
                    <td className="px-4 py-3 text-foreground">{clinicName(ev)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ev.entity_type ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                      {payloadSummary(ev)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {ev.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ProcessedBadge processed={ev.processed} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(ev.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
