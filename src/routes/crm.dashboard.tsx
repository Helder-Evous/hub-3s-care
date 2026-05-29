import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge, StatusDot } from "@/components/StatusBadge";
import { Building2, Radio, AlertTriangle, AlertOctagon, ShieldCheck, ShieldAlert, Activity } from "lucide-react";
import { clinics, channels, contingency, alerts } from "@/lib/mock-data";
import { clinicSummary } from "@/lib/calculations";

export const Route = createFileRoute("/crm/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Chips/Canais" }] }),
  component: Dashboard,
});

function Dashboard() {
  const summaries = clinics.map((c) =>
    clinicSummary(c, channels.filter((ch) => ch.clinic_id === c.id), contingency.find((x) => x.clinic_id === c.id)),
  );

  const total = summaries.length;
  const activeChannels = channels.filter((c) => c.status === "ativo").length;
  const attention = channels.filter((c) => c.status === "em_atencao").length;
  const critical = channels.filter((c) => ["critico", "bloqueado", "desconectado"].includes(c.status)).length;
  const reserves = channels.filter((c) => c.channel_type === "numero_reserva" && c.status === "livre").length;
  const noContingency = summaries.filter((s) => s.contingency < 50).length;
  const avgComm = Math.round(summaries.reduce((a, s) => a + s.communicability, 0) / total);
  const openAlerts = alerts.filter((a) => a.status !== "resolvido").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Chips / Canais</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Tela Executiva</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão consolidada da operação de WhatsApp das clínicas.</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Clínicas monitoradas" value={total} icon={Building2} tone="primary" />
          <MetricCard label="Canais ativos" value={activeChannels} icon={Radio} tone="success" />
          <MetricCard label="Canais em atenção" value={attention} icon={AlertTriangle} tone="warning" />
          <MetricCard label="Canais críticos" value={critical} icon={AlertOctagon} tone="critical" />
          <MetricCard label="Chips reserva disponíveis" value={reserves} icon={ShieldCheck} tone="primary" />
          <MetricCard label="Clínicas sem contingência" value={noContingency} icon={ShieldAlert} tone="critical" hint="Score abaixo de 50%" />
          <MetricCard label="Comunicabilidade média" value={`${avgComm}%`} icon={Activity} tone={avgComm >= 85 ? "success" : avgComm >= 60 ? "warning" : "critical"} />
          <MetricCard label="Alertas em aberto" value={openAlerts} icon={AlertTriangle} tone="warning" />
        </div>

        <section className="mt-10">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-semibold">Status por clínica</h2>
            <Link to="/crm/clinicas" className="text-sm text-primary hover:underline">Ver todas →</Link>
          </div>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Clínica</th>
                  <th className="text-left px-4 py-3">Cidade</th>
                  <th className="text-left px-4 py-3">Canais</th>
                  <th className="text-left px-4 py-3">Contingência</th>
                  <th className="text-left px-4 py-3">Comunicabilidade</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr key={s.clinic.id} className="border-t hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium">
                      <Link to="/crm/clinicas/$id" params={{ id: s.clinic.id }} className="hover:text-primary">
                        {s.clinic.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.clinic.city} / {s.clinic.state}</td>
                    <td className="px-4 py-3 tabular-nums">{s.channels.length}</td>
                    <td className="px-4 py-3"><StatusBadge tone={s.contingencyClass.tone}>{s.contingency}% · {s.contingencyClass.label}</StatusBadge></td>
                    <td className="px-4 py-3"><StatusBadge tone={s.communicabilityClass.tone}>{s.communicability}% · {s.communicabilityClass.label}</StatusBadge></td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-2">
                        <StatusDot tone={s.health === "normal" ? "success" : s.health === "atencao" ? "warning" : "critical"} />
                        <span className="capitalize">{s.health === "normal" ? "Normal" : s.health === "atencao" ? "Atenção" : "Crítico"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
