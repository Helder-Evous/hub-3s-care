import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useOnboarding } from "@/features/clientes/queries";
import { useMarkStepDone } from "@/features/clientes/mutations";
import { productLabel } from "@/features/clientes/types";
import type { OnboardingStatus, StepStatus } from "@/features/clientes/types";
import { cn } from "@/shared/lib/utils";
import {
  ChevronLeft, CheckCircle2, Circle, XCircle, MinusCircle,
  Clock, Check, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/onboarding/$id")({
  head: () => ({ meta: [{ title: "Onboarding — Hub 3S" }] }),
  component: OnboardingDetailPage,
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

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "concluido") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (status === "em_andamento") return <Circle className="h-5 w-5 text-blue-500 animate-pulse" />;
  if (status === "bloqueado") return <XCircle className="h-5 w-5 text-red-500" />;
  if (status === "pulado") return <MinusCircle className="h-5 w-5 text-gray-400" />;
  return <Circle className="h-5 w-5 text-gray-300" />;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function OnboardingDetailPage() {
  const { id } = Route.useParams();

  const { data: onboarding, isLoading } = useOnboarding(id);
  const { mutate: markDone, isPending: isMarking } = useMarkStepDone();

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!onboarding) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="text-muted-foreground">Onboarding não encontrado.</p>
          <Link to="/onboarding" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </AppShell>
    );
  }

  const completed = onboarding.steps.filter((s) => s.status === "concluido").length;
  const total = onboarding.steps.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-10">

        {/* Back */}
        <Link to="/onboarding" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> Onboarding
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", productColors[onboarding.product])}>
              {productLabel[onboarding.product]}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", onboardingStatusColors[onboarding.status])}>
              {onboardingStatusLabel[onboarding.status]}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{onboarding.clinic_name}</h1>
          {onboarding.sla_deadline && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Prazo: {fmtDate(onboarding.sla_deadline)}
            </p>
          )}
        </div>

        {/* Barra de progresso geral */}
        <div className="rounded-xl border bg-card p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso geral</span>
            <span className="text-sm font-semibold">{completed}/{total} etapas ({pct}%)</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Lista de etapas */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {onboarding.steps.map((step, idx) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-4 px-5 py-4",
                idx < onboarding.steps.length - 1 && "border-b"
              )}
            >
              {/* Número + ícone */}
              <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                <StepIcon status={step.status} />
                <span className="text-[10px] text-muted-foreground font-medium">{step.order_index}</span>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-sm font-medium",
                  step.status === "concluido" && "line-through text-muted-foreground"
                )}>
                  {step.title}
                </div>
                {step.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                )}

                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {step.sla_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> SLA: {step.sla_hours}h
                    </span>
                  )}
                  {step.status === "concluido" && step.completed_at && (
                    <span className="text-green-600 font-medium">
                      Concluído em {fmtDate(step.completed_at)}
                    </span>
                  )}
                  {step.status === "em_andamento" && (
                    <span className="text-blue-600 font-medium animate-pulse">Em andamento</span>
                  )}
                </div>
              </div>

              {/* Ação */}
              {step.status === "em_andamento" && (
                <button
                  type="button"
                  disabled={isMarking}
                  onClick={() => markDone({ stepId: step.id, onboardingId: onboarding.id })}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  {isMarking ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Marcar como concluída
                </button>
              )}
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
