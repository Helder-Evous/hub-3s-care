import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ArrowRight, Radio, Send, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hub 3S — Sala de Operação" },
      { name: "description", content: "Plataforma operacional da 3S para clínicas odontológicas." },
    ],
  }),
  component: HubHome,
});

function HubHome() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hub 3S</div>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Sala de Operação</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Central única para monitorar os produtos da 3S em produção. Comece pelo Produto CRM.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/crm"
            className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Radio className="h-5 w-5" /></div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Produto CRM</h2>
            <p className="mt-1 text-sm text-muted-foreground">Chips, canais, disparos e resultados das clínicas.</p>
            <div className="mt-4 text-xs font-medium text-success">Disponível</div>
          </Link>

          <div className="rounded-2xl border bg-muted/30 p-6 opacity-70">
            <div className="rounded-lg bg-muted p-2 text-muted-foreground inline-flex"><Send className="h-5 w-5" /></div>
            <h2 className="mt-4 text-lg font-semibold text-muted-foreground">Atendimento IA</h2>
            <p className="mt-1 text-sm text-muted-foreground">Em breve.</p>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-6 opacity-70">
            <div className="rounded-lg bg-muted p-2 text-muted-foreground inline-flex"><BarChart3 className="h-5 w-5" /></div>
            <h2 className="mt-4 text-lg font-semibold text-muted-foreground">BI Operacional</h2>
            <p className="mt-1 text-sm text-muted-foreground">Em breve.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
