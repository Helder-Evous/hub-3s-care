import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useOnboardings } from "@/features/clientes/queries";
import { productLabel } from "@/features/clientes/types";
import type { OnboardingStatus } from "@/features/clientes/types";
import { cn } from "@/shared/lib/utils";
import { ClipboardList, ArrowRight, Clock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({ meta: [{ title: "Onboarding — Hub 3S" }] }),
  component: OnboardingListPage,
});

const onboardingStatusLabel: Record<OnboardingStatus, string> = {
  aguardando_dados: "Aguardando dados",
  em_execucao: "Em execução",
  pausado: "Pausado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const onboardingStatusColors: Record<OnboardingStatus, string> = {
  aguardando_dados: "bg-yellow-100 text-yellow-800",
  em_execucao: "bg-blue-100 text-blue-800",
  pausado: "bg-orange-100 text-orange-700",
  concluido: "bg-green-100 text-green-800",
  cancelado: "bg-gray-100 text-gray-600",
};

const productColors: Record<string, string> = {
  crm: "bg-purple-100 text-purple-800",
  trafego_pago: "bg-orange-100 text-orange-700",
  trafego_com_agendamento: "bg-orange-200 text-orange-900",
  gestao_consultoria: "bg-blue-100 text-blue-800",
  projeto_escola: "bg-green-100 text-green-800",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function OnboardingListPage() {
  const { data: allOnboardings = [], isLoading } = useOnboardings();

  const activeOnboardings = allOnboardings.filter(
    (o) => o.status !== "concluido" && o.status !== "cancelado"
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Operações</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Onboarding</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading
                ? "Carregando..."
                : `${activeOnboardings.length} onboarding${activeOnboardings.length !== 1 ? "s" : ""} em andamento`}
            </p>
          </div>
          <Link
            to="/comercial/nova-venda"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            Nova Venda
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Vazio */}
        {!isLoading && activeOnboardings.length === 0 && (
          <div className="rounded-xl border bg-card p-16 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum onboarding ativo no momento.</p>
            <Link
              to="/comercial/nova-venda"
              className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Registrar nova venda
            </Link>
          </div>
        )}

        {/* Lista */}
        {!isLoading && activeOnboardings.length > 0 && (
          <div className="space-y-4">
            {activeOnboardings.map((ob) => {
              const completed = ob.steps.filter((s) => s.status === "concluido").length;
              const total = ob.steps.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={ob.id} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold">{ob.clinic_name}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", productColors[ob.product])}>
                          {productLabel[ob.product]}
                        </span>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", onboardingStatusColors[ob.status])}>
                          {onboardingStatusLabel[ob.status]}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/onboarding/$id"
                      params={{ id: ob.id }}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors shrink-0"
                    >
                      Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Progresso */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        {completed}/{total} etapas concluídas
                      </span>
                      <span className="text-xs font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* SLA */}
                  {ob.sla_deadline && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Prazo: {fmtDate(ob.sla_deadline)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
