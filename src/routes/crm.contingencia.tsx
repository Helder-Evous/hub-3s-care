import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useClinics, useContingency } from "@/lib/queries";
import { contingencyScore, contingencyClass } from "@/lib/calculations";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/crm/contingencia")({
  head: () => ({ meta: [{ title: "Contingência — Chips/Canais" }] }),
  component: ContingencyPage,
});

const items = [
  { key: "has_backup_number", label: "Nº reserva" },
  { key: "has_backup_api", label: "API reserva" },
  { key: "has_approved_template", label: "Template" },
  { key: "has_backup_chip", label: "Chip reserva" },
  { key: "has_backup_device", label: "Aparelho reserva" },
] as const;

function ContingencyPage() {
  const { data: clinics = [], isLoading: loadingClinics } = useClinics();
  const { data: contingency = [], isLoading: loadingContingency } = useContingency();
  const isLoading = loadingClinics || loadingContingency;

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="animate-pulse bg-muted rounded h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  if (clinics.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col items-center justify-center min-h-64 gap-3 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum dado encontrado. Adicione clínicas no sistema.</p>
        </div>
      </AppShell>
    );
  }

  const rows = clinics.map((c) => {
    const cont = contingency.find((x) => x.clinic_id === c.id);
    const score = cont ? contingencyScore(cont) : 0;
    return { clinic: c, cont, score, klass: contingencyClass(score) };
  }).sort((a, b) => a.score - b.score);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Contingência</h1>
          <p className="text-sm text-muted-foreground mt-1">Score de blindagem por clínica · cada item vale 20 pontos.</p>
        </header>
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Clínica</th>
                {items.map((it) => <th key={it.key} className="text-center px-3 py-3">{it.label}</th>)}
                <th className="text-left px-4 py-3">Score</th>
                <th className="text-left px-4 py-3">Classificação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ clinic, cont, score, klass }) => (
                <tr key={clinic.id} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium">
                    <Link to="/crm/clinicas/$id" params={{ id: clinic.id }} className="hover:text-primary">{clinic.name}</Link>
                  </td>
                  {items.map((it) => (
                    <td key={it.key} className="text-center px-3 py-3">
                      <span className={cont?.[it.key] ? "text-success" : "text-muted-foreground/40"}>
                        {cont?.[it.key] ? "●" : "○"}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 tabular-nums font-medium">{score}%</td>
                  <td className="px-4 py-3"><StatusBadge tone={klass.tone}>{klass.label}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
