import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAlerts, useClinics, useChannels } from "@/lib/queries";
import { severityLabel, alertStatusLabel, timeAgo } from "@/lib/labels";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/crm/alertas")({
  head: () => ({ meta: [{ title: "Central de Alertas — Chips/Canais" }] }),
  component: AlertsPage,
});

type Filter = "todos" | "aberto" | "em_tratamento" | "resolvido";

function AlertsPage() {
  const [filter, setFilter] = useState<Filter>("aberto");
  const { data: alerts = [], isLoading: loadingAlerts } = useAlerts();
  const { data: clinics = [], isLoading: loadingClinics } = useClinics();
  const { data: channels = [], isLoading: loadingChannels } = useChannels();
  const isLoading = loadingAlerts || loadingClinics || loadingChannels;

  const filtered = alerts.filter((a) => filter === "todos" || a.status === filter)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="animate-pulse bg-muted rounded h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Central de Alertas</h1>
            <p className="text-sm text-muted-foreground mt-1">Eventos críticos detectados na operação de canais.</p>
          </div>
          <div className="inline-flex rounded-lg border bg-card p-1 text-sm">
            {(["aberto","em_tratamento","resolvido","todos"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md capitalize ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f === "todos" ? "Todos" : alertStatusLabel[f]}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-3">
          {filtered.map((a) => {
            const clinic = clinics.find((c) => c.id === a.clinic_id);
            const channel = channels.find((c) => c.id === a.channel_id);
            const tone = a.severity === "critica" ? "critical" : a.severity === "alta" ? "warning" : a.severity === "media" ? "primary" : "muted";
            return (
              <div key={a.id} className={`rounded-xl border bg-card p-5 ${a.severity === "critica" ? "border-critical/40" : ""}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge tone={tone}>{severityLabel[a.severity]}</StatusBadge>
                      <span className="font-semibold">{a.alert_type}</span>
                      <StatusBadge tone="muted">{alertStatusLabel[a.status]}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm">{a.message}</p>
                    <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                      {clinic && <Link to="/crm/clinicas/$id" params={{ id: clinic.id }} className="hover:text-primary">📍 {clinic.name}</Link>}
                      {channel && <span>📡 {channel.phone_number}</span>}
                      <span>⏱ {timeAgo(a.created_at)}</span>
                      {a.responsible && <span>👤 {a.responsible}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="text-center text-muted-foreground py-10">Nenhum alerta neste filtro.</div>}
        </div>
      </div>
    </AppShell>
  );
}
