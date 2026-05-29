import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { templates, clinics, channels } from "@/lib/mock-data";
import {
  templateCategoryLabel,
  templateStatusLabel,
  templateStatusTone,
  templateCategoryTone,
  templateAlerts,
  templateTotalCost,
  fmtBRL,
} from "@/lib/templates";
import { timeAgo } from "@/lib/labels";
import { FileText, AlertTriangle, DollarSign, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/crm/templates")({
  head: () => ({ meta: [{ title: "Templates Meta — Hub 3S" }] }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const total = templates.length;
  const aprovados = templates.filter((t) => t.status === "aprovado").length;
  const reprovados = templates.filter((t) => t.status === "reprovado").length;
  const emAlerta = templates.filter((t) => templateAlerts(t).length > 0).length;
  const custoTotal = templates.reduce((a, t) => a + templateTotalCost(t), 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Chips / Canais</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Templates Meta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento de templates oficiais por clínica · categoria, status e custo estimado.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard label="Templates" value={total} icon={FileText} tone="primary" />
          <MetricCard label="Aprovados" value={aprovados} icon={CheckCircle2} tone="success" />
          <MetricCard label="Reprovados" value={reprovados} icon={AlertTriangle} tone="critical" />
          <MetricCard label="Em alerta" value={emAlerta} icon={AlertTriangle} tone="warning" />
          <MetricCard label="Custo (7d)" value={fmtBRL(custoTotal)} icon={DollarSign} tone="primary" />
        </div>

        <section className="mt-10 rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Clínica</th>
                <th className="text-left px-4 py-3">Número API</th>
                <th className="text-left px-4 py-3">Template</th>
                <th className="text-left px-4 py-3">Categoria</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Volume 7d</th>
                <th className="text-right px-4 py-3">Custo/msg</th>
                <th className="text-right px-4 py-3">Custo total</th>
                <th className="text-left px-4 py-3">Alertas</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => {
                const clinic = clinics.find((c) => c.id === t.clinic_id);
                const ch = channels.find((c) => c.id === t.channel_id);
                const alertsList = templateAlerts(t);
                return (
                  <tr key={t.id} className="border-t hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium">
                      <Link to="/crm/clinicas/$id" params={{ id: t.clinic_id }} className="hover:text-primary">
                        {clinic?.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{ch?.phone_number}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={templateCategoryTone(t.category)}>
                        {templateCategoryLabel[t.category]}
                      </StatusBadge>
                      {t.previous_category && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          era {templateCategoryLabel[t.previous_category]}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={templateStatusTone(t.status)}>{templateStatusLabel[t.status]}</StatusBadge>
                      <div className="text-[10px] text-muted-foreground mt-1">checado {timeAgo(t.last_check)}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{t.volume_7d.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(t.cost_per_message)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtBRL(templateTotalCost(t))}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {alertsList.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        {alertsList.map((a, i) => (
                          <StatusBadge key={i} tone="warning" className="text-[10px]">
                            {a}
                          </StatusBadge>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
