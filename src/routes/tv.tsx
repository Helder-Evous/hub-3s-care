import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { clinics, channels, contingency, alerts } from "@/lib/mock-data";
import { clinicSummary } from "@/lib/calculations";
import { severityLabel, timeAgo } from "@/lib/labels";

export const Route = createFileRoute("/tv")({
  head: () => ({ meta: [{ title: "Modo TV — Sala de Operação" }] }),
  component: TvMode,
});

function TvMode() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(i);
  }, []);

  const summaries = clinics.map((c) =>
    clinicSummary(c, channels.filter((ch) => ch.clinic_id === c.id), contingency.find((x) => x.clinic_id === c.id)),
  );
  const criticas = summaries.filter((s) => s.health === "critico");
  const atencao = summaries.filter((s) => s.health === "atencao");
  const openAlerts = alerts.filter((a) => a.status !== "resolvido");
  const criticAlerts = openAlerts.filter((a) => a.severity === "critica");
  const avgComm = Math.round(summaries.reduce((a, s) => a + s.communicability, 0) / summaries.length);

  return (
    <div className="min-h-screen bg-[oklch(0.1_0.03_260)] text-white p-8 font-sans" data-tick={tick}>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary grid place-items-center font-bold text-xl">3S</div>
          <div>
            <div className="text-3xl font-bold tracking-tight">Sala de Operação</div>
            <div className="text-white/60 text-sm">Hub 3S · Chips / Canais</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold tabular-nums">{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="text-white/60 text-sm mt-1">Atualizado agora</div>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <BigStat label="Críticas" value={criticas.length} accent="critical" />
        <BigStat label="Atenção" value={atencao.length} accent="warning" />
        <BigStat label="Alertas abertos" value={openAlerts.length} accent="primary" />
        <BigStat label="Comunicabilidade média" value={`${avgComm}%`} accent={avgComm >= 85 ? "success" : avgComm >= 60 ? "warning" : "critical"} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Panel title="🔴 Clínicas críticas" empty="Nenhuma clínica crítica">
          {criticas.map((s) => (
            <div key={s.clinic.id} className="flex items-center justify-between border-b border-white/10 py-3">
              <div>
                <div className="text-xl font-semibold">{s.clinic.name}</div>
                <div className="text-white/60 text-sm">{s.clinic.city} · Comm. {s.communicability}% · Cont. {s.contingency}%</div>
              </div>
              <div className="text-3xl">●</div>
            </div>
          ))}
        </Panel>

        <Panel title="🟡 Clínicas em atenção" empty="Nenhuma clínica em atenção">
          {atencao.map((s) => (
            <div key={s.clinic.id} className="flex items-center justify-between border-b border-white/10 py-3">
              <div>
                <div className="text-xl font-semibold">{s.clinic.name}</div>
                <div className="text-white/60 text-sm">Comm. {s.communicability}% · Cont. {s.contingency}%</div>
              </div>
              <div className="text-3xl text-warning">●</div>
            </div>
          ))}
        </Panel>
      </div>

      <Panel title="⚠️ Alertas críticos recentes" className="mt-6" empty="Nenhum alerta crítico no momento">
        {criticAlerts.map((a) => {
          const c = clinics.find((x) => x.id === a.clinic_id);
          return (
            <div key={a.id} className="flex items-start justify-between border-b border-white/10 py-3 gap-4">
              <div className="min-w-0">
                <div className="text-lg font-semibold">{a.alert_type} · <span className="text-white/70">{c?.name}</span></div>
                <div className="text-white/60 text-sm truncate">{a.message}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-critical font-bold">{severityLabel[a.severity].toUpperCase()}</div>
                <div className="text-white/50 text-xs">{timeAgo(a.created_at)}</div>
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

function BigStat({ label, value, accent }: { label: string; value: React.ReactNode; accent: "success" | "warning" | "critical" | "primary" }) {
  const color = {
    success: "text-success",
    warning: "text-warning",
    critical: "text-critical",
    primary: "text-primary",
  }[accent];
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="text-white/60 text-sm uppercase tracking-wider">{label}</div>
      <div className={`mt-3 text-6xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function Panel({ title, children, className = "", empty }: { title: string; children: React.ReactNode; className?: string; empty: string }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className={`rounded-2xl bg-white/5 border border-white/10 p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {hasContent ? children : <div className="py-6 text-white/50">{empty}</div>}
    </div>
  );
}
