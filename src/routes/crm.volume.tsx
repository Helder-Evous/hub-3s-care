import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { apiVolumes, clinics, channels } from "@/lib/mock-data";
import { deliveryRate, readRate, volumeAlerts, fmtBRL } from "@/lib/templates";
import { timeAgo } from "@/lib/labels";
import { Send, CheckCheck, Eye, Inbox, DollarSign } from "lucide-react";

export const Route = createFileRoute("/crm/volume")({
  head: () => ({ meta: [{ title: "Volume API Oficial — Hub 3S" }] }),
  component: VolumePage,
});

function VolumePage() {
  const sent = apiVolumes.reduce((a, v) => a + v.sent_today, 0);
  const delivered = apiVolumes.reduce((a, v) => a + v.delivered_today, 0);
  const read = apiVolumes.reduce((a, v) => a + v.read_today, 0);
  const received = apiVolumes.reduce((a, v) => a + v.received_today, 0);
  const costToday = apiVolumes.reduce((a, v) => a + v.cost_today, 0);
  const costMonth = apiVolumes.reduce((a, v) => a + v.cost_month, 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Chips / Canais</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Volume API Oficial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento de envios, entregas e custos por número API Oficial.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="Enviadas hoje" value={sent.toLocaleString("pt-BR")} icon={Send} tone="primary" />
          <MetricCard label="Entregues hoje" value={delivered.toLocaleString("pt-BR")} icon={CheckCheck} tone="success" />
          <MetricCard label="Lidas hoje" value={read.toLocaleString("pt-BR")} icon={Eye} tone="success" />
          <MetricCard label="Recebidas hoje" value={received.toLocaleString("pt-BR")} icon={Inbox} tone="primary" />
          <MetricCard label="Custo hoje" value={fmtBRL(costToday)} icon={DollarSign} tone="warning" />
          <MetricCard label="Custo mês" value={fmtBRL(costMonth)} icon={DollarSign} tone="warning" />
        </div>

        <section className="mt-10 grid gap-4">
          {apiVolumes.map((v) => {
            const clinic = clinics.find((c) => c.id === v.clinic_id);
            const ch = channels.find((c) => c.id === v.channel_id);
            const dr = deliveryRate(v);
            const rr = readRate(v);
            const alertsList = volumeAlerts(v);
            return (
              <div key={v.channel_id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <Link to="/crm/clinicas/$id" params={{ id: v.clinic_id }} className="font-semibold hover:text-primary">
                      {clinic?.name}
                    </Link>
                    <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                      {ch?.phone_number} · API Oficial
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {alertsList.length === 0 && <StatusBadge tone="success">Operação normal</StatusBadge>}
                    {alertsList.map((a, i) => (
                      <StatusBadge key={i} tone={a.tone}>{a.msg}</StatusBadge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
                  <Cell label="Enviadas" value={v.sent_today.toLocaleString("pt-BR")} />
                  <Cell label="Entregues" value={v.delivered_today.toLocaleString("pt-BR")} />
                  <Cell label="Lidas" value={v.read_today.toLocaleString("pt-BR")} />
                  <Cell label="Recebidas" value={v.received_today.toLocaleString("pt-BR")} />
                  <Cell label="Taxa entrega" value={`${dr}%`} tone={dr >= 90 ? "success" : dr >= 70 ? "warning" : "critical"} />
                  <Cell label="Taxa leitura" value={`${rr}%`} tone={rr >= 60 ? "success" : rr >= 40 ? "warning" : "critical"} />
                  <Cell label="Custo hoje" value={fmtBRL(v.cost_today)} />
                  <Cell label="Custo mês" value={fmtBRL(v.cost_month)} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
                  <div>Último envio: {timeAgo(v.last_sent_at)}</div>
                  <div>Última recebida: {timeAgo(v.last_received_at)}</div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}

function Cell({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "success" | "warning" | "critical" }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold tabular-nums text-sm">
        {tone ? <StatusBadge tone={tone}>{value}</StatusBadge> : value}
      </div>
    </div>
  );
}
