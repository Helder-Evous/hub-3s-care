import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Radio, Send, BarChart3, ArrowRight, Lock } from "lucide-react";

export const Route = createFileRoute("/crm/")({
  head: () => ({ meta: [{ title: "Produto CRM — Hub 3S" }] }),
  component: CrmHome,
});

function CrmHome() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Produto CRM</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Pilares do CRM</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            O produto CRM da 3S é organizado em três pilares. Nesta versão, o pilar de Chips/Canais está ativo.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Link to="/crm/dashboard" className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Radio className="h-5 w-5" /></div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">1. Chips / Canais</h2>
            <p className="mt-1 text-sm text-muted-foreground">Inventário, monitoramento, contingência e alertas dos canais de WhatsApp.</p>
            <div className="mt-4 inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">Ativo</div>
          </Link>

          <div className="rounded-2xl border bg-muted/30 p-6 opacity-70">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-muted p-2 text-muted-foreground"><Send className="h-5 w-5" /></div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-muted-foreground">2. Disparos / Campanhas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Confirmação de agenda, faltosos, aniversariantes, orçamento e retorno.</p>
            <div className="mt-4 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Em breve</div>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-6 opacity-70">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-muted p-2 text-muted-foreground"><BarChart3 className="h-5 w-5" /></div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-muted-foreground">3. Resultados</h2>
            <p className="mt-1 text-sm text-muted-foreground">Indicadores de comunicabilidade, conversão e retorno por clínica.</p>
            <div className="mt-4 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Em breve</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
