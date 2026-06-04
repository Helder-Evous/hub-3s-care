import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { mockClientes, mockOnboardings } from "@/features/clientes/mock-data";
import { ArrowRight, Radio, TrendingUp, Users, ClipboardList, BookOpen, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hub 3S — Sala de Operação" },
      { name: "description", content: "Plataforma operacional da 3S para clínicas odontológicas." },
    ],
  }),
  component: HubHome,
});

const modules = [
  {
    label: "Produto CRM",
    description: "Chips, canais, disparos e resultados das clínicas.",
    icon: Radio,
    to: "/crm" as const,
    badge: "Disponível",
    badgeClass: "bg-green-100 text-green-700",
    available: true,
  },
  {
    label: "Tráfego Pago",
    description: "Campanhas Meta Ads e Google Ads para clínicas.",
    icon: TrendingUp,
    to: null,
    badge: "Em breve",
    badgeClass: "bg-gray-100 text-gray-500",
    available: false,
  },
  {
    label: "Gestão / Consultoria",
    description: "Diagnóstico e planos de ação para clínicas.",
    icon: Users,
    to: null,
    badge: "Em breve",
    badgeClass: "bg-gray-100 text-gray-500",
    available: false,
  },
  {
    label: "Projeto Escola",
    description: "Representantes em escolas para captação de pacientes.",
    icon: GraduationCap,
    to: null,
    badge: "Em breve",
    badgeClass: "bg-gray-100 text-gray-500",
    available: false,
  },
];

function HubHome() {
  const activeOnboardings = mockOnboardings.filter(
    (o) => o.status !== "concluido" && o.status !== "cancelado"
  );
  const activeClientes = mockClientes.filter((c) => c.status === "ativo");

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hub 3S</div>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Sala de Operação</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Central única para monitorar e operar os produtos da 3S.
          </p>
        </div>

        {/* Grid de módulos */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2 ${mod.available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {mod.available && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  )}
                </div>
                <h2 className={`mt-4 text-base font-semibold ${!mod.available ? "text-muted-foreground" : ""}`}>
                  {mod.label}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{mod.description}</p>
                <div className={`mt-3 text-xs font-medium rounded-full inline-block px-2 py-0.5 ${mod.badgeClass}`}>
                  {mod.badge}
                </div>
              </>
            );

            if (mod.available && mod.to) {
              return (
                <Link
                  key={mod.label}
                  to={mod.to}
                  className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
                >
                  {inner}
                </Link>
              );
            }

            return (
              <div key={mod.label} className="rounded-2xl border bg-muted/30 p-6 opacity-70">
                {inner}
              </div>
            );
          })}
        </div>

        {/* Operações Recentes */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Operações Recentes</h2>
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Onboardings em andamento */}
            <Link
              to="/onboarding"
              className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Onboardings em andamento</div>
                    <div className="text-xs text-muted-foreground">Acompanhe o progresso</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{activeOnboardings.length}</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Clientes ativos */}
            <Link
              to="/clientes"
              className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2 text-green-600">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Clientes ativos</div>
                    <div className="text-xs text-muted-foreground">Base de clínicas</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{activeClientes.length}</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </AppShell>
  );
}
