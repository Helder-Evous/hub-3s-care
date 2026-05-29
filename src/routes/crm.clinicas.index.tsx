import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, StatusDot } from "@/components/StatusBadge";
import { clinics, channels, contingency } from "@/lib/mock-data";
import { clinicSummary } from "@/lib/calculations";

export const Route = createFileRoute("/crm/clinicas/")({
  head: () => ({ meta: [{ title: "Clínicas — Chips/Canais" }] }),
  component: ClinicsList,
});

function ClinicsList() {
  const summaries = clinics.map((c) =>
    clinicSummary(c, channels.filter((ch) => ch.clinic_id === c.id), contingency.find((x) => x.clinic_id === c.id)),
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Clínicas</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastro mestre de clínicas e canais vinculados.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((s) => (
            <Link
              key={s.clinic.id}
              to="/crm/clinicas/$id"
              params={{ id: s.clinic.id }}
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{s.clinic.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.clinic.city} / {s.clinic.state}</div>
                </div>
                <StatusDot tone={s.health === "normal" ? "success" : s.health === "atencao" ? "warning" : "critical"} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-muted-foreground">Canais</div><div className="font-medium tabular-nums text-sm">{s.channels.length}</div></div>
                <div><div className="text-muted-foreground">Responsável</div><div className="font-medium text-sm truncate">{s.clinic.responsible}</div></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge tone={s.contingencyClass.tone}>Cont. {s.contingency}%</StatusBadge>
                <StatusBadge tone={s.communicabilityClass.tone}>Comm. {s.communicability}%</StatusBadge>
                {s.clinic.status !== "ativa" && <StatusBadge tone="muted">{s.clinic.status}</StatusBadge>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
