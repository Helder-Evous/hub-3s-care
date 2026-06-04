import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClientes, useOnboardings } from "@/features/clientes/queries";
import {
  Building2, Radio, BarChart2, ArrowRight,
  ClipboardList, AlertTriangle, Package, XCircle, Loader2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

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
  const { data: clientes = [], isLoading: loadingClientes } = useClientes();
  const { data: allOnboardings = [], isLoading: loadingOnboardings } = useOnboardings();

  const isLoading = loadingClientes || loadingOnboardings;

  const activeClientes = clientes.filter((c) => c.status === "ativo");
  const onboardingAtivos = allOnboardings.filter(
    (o) => o.status !== "concluido" && o.status !== "cancelado"
  );
  const onboardingAtrasados = allOnboardings.filter((o) => {
    if (o.status === "concluido" || o.status === "cancelado") return false;
    if (!o.sla_deadline) return false;
    return new Date(o.sla_deadline) < new Date();
  });
  const produtosAtivos = clientes.reduce((acc, c) => acc + (c.products?.length ?? 0), 0);
  const cancelamentos = clientes.filter((c) => c.status === "suspenso").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hub 3S</div>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Sala de Operação</h1>
          <p className="mt-2 text-muted-foreground">
            Central única para monitorar e operar os produtos da 3S.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* 3 Grandes Áreas */}
            <div className="grid gap-4 sm:grid-cols-3 mb-10">
              <AreaCard
                icon={Building2}
                iconClass="bg-blue-100 text-blue-600"
                label="Clientes"
                description="Cadastro, jornada, contratos e onboardings."
                to="/clientes"
              />
              <AreaCard
                icon={Radio}
                iconClass="bg-purple-100 text-purple-600"
                label="Operações"
                description="Entrega dos produtos CRM, tráfego e consultoria."
                to="/crm"
              />
              <AreaCard
                icon={BarChart2}
                iconClass="bg-emerald-100 text-emerald-600"
                label="Gestão"
                description="Indicadores, financeiro, aprovações e supervisão."
                to="/hub-builder"
              />
            </div>

            {/* Indicadores */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Visão Geral
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricLink
                  to="/clientes"
                  icon={Building2}
                  iconClass="bg-blue-100 text-blue-600"
                  label="Clientes ativos"
                  value={activeClientes.length}
                  valueClass="text-blue-600"
                  sub="base de clínicas"
                />
                <MetricLink
                  to="/onboarding"
                  icon={ClipboardList}
                  iconClass="bg-indigo-100 text-indigo-600"
                  label="Onboardings em andamento"
                  value={onboardingAtivos.length}
                  valueClass="text-indigo-600"
                  sub="em execução agora"
                />
                <MetricLink
                  to="/onboarding"
                  icon={AlertTriangle}
                  iconClass={onboardingAtrasados.length > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"}
                  label="Onboardings atrasados"
                  value={onboardingAtrasados.length}
                  valueClass={onboardingAtrasados.length > 0 ? "text-red-600" : "text-gray-400"}
                  sub="prazo SLA vencido"
                  urgent={onboardingAtrasados.length > 0}
                />
                <MetricLink
                  to="/clientes"
                  icon={Package}
                  iconClass="bg-emerald-100 text-emerald-600"
                  label="Produtos ativos"
                  value={produtosAtivos}
                  valueClass="text-emerald-600"
                  sub="contratos em vigor"
                />
                <MetricLink
                  to="/clientes"
                  icon={XCircle}
                  iconClass={cancelamentos > 0 ? "bg-orange-100 text-orange-500" : "bg-gray-100 text-gray-400"}
                  label="Clientes suspensos"
                  value={cancelamentos}
                  valueClass={cancelamentos > 0 ? "text-orange-500" : "text-gray-400"}
                  sub="requerem atenção"
                />
                <div className="rounded-xl border bg-muted/30 p-4 flex items-center gap-3 opacity-50">
                  <div className="rounded-lg bg-gray-100 p-2 text-gray-400">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Receita mensal</div>
                    <div className="text-sm text-muted-foreground mt-0.5">Em breve</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function AreaCard({
  icon: Icon, iconClass, label, description, to,
}: {
  icon: typeof Building2; iconClass: string; label: string; description: string; to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
    >
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl p-3", iconClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 mt-1" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{label}</h2>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
    </Link>
  );
}

function MetricLink({
  to, icon: Icon, iconClass, label, value, valueClass, sub, urgent,
}: {
  to: string; icon: typeof Building2; iconClass: string;
  label: string; value: number; valueClass: string; sub: string; urgent?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group rounded-xl border bg-card p-4 flex items-center gap-4 transition-all hover:shadow-md",
        urgent && "border-red-200",
      )}
    >
      <div className={cn("rounded-lg p-2 shrink-0", iconClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground font-medium truncate">{label}</div>
        <div className={cn("text-2xl font-bold leading-tight", valueClass)}>{value}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
