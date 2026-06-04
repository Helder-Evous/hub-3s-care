import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCliente, useClinicOnboarding, useClinicSales } from "@/features/clientes/queries";
import { productLabel } from "@/features/clientes/types";
import type { ClienteStatus, ProductType, StepStatus, OnboardingStatus } from "@/features/clientes/types";
import { cn } from "@/shared/lib/utils";
import {
  ChevronLeft, Pencil, MapPin, User, Phone, Mail, Building2,
  Hash, CheckCircle2, Circle, Clock, XCircle, MinusCircle, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente — Hub 3S" }] }),
  component: ClienteDetailPage,
});

const statusColors: Record<ClienteStatus, string> = {
  ativo: "bg-green-100 text-green-800",
  onboarding: "bg-blue-100 text-blue-800",
  inativo: "bg-gray-100 text-gray-600",
  suspenso: "bg-red-100 text-red-700",
};

const statusLabel: Record<ClienteStatus, string> = {
  ativo: "Ativo",
  onboarding: "Onboarding",
  inativo: "Inativo",
  suspenso: "Suspenso",
};

const productColors: Record<ProductType, string> = {
  crm: "bg-purple-100 text-purple-800",
  trafego_pago: "bg-orange-100 text-orange-700",
  trafego_com_agendamento: "bg-orange-200 text-orange-900",
  gestao_consultoria: "bg-blue-100 text-blue-800",
  projeto_escola: "bg-green-100 text-green-800",
};

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

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "concluido") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === "em_andamento") return <Circle className="h-4 w-4 text-blue-500 animate-pulse" />;
  if (status === "bloqueado") return <XCircle className="h-4 w-4 text-red-500" />;
  if (status === "pulado") return <MinusCircle className="h-4 w-4 text-gray-400" />;
  return <Circle className="h-4 w-4 text-gray-300" />;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function ClienteDetailPage() {
  const { id } = Route.useParams();

  const { data: cliente, isLoading: loadingCliente } = useCliente(id);
  const { data: onboarding, isLoading: loadingOnboarding } = useClinicOnboarding(id);
  const { data: sales = [] } = useClinicSales(id);

  const isLoading = loadingCliente || loadingOnboarding;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!cliente) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="text-muted-foreground">Cliente não encontrado.</p>
          <Link to="/clientes" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ChevronLeft className="h-4 w-4" /> Voltar à lista
          </Link>
        </div>
      </AppShell>
    );
  }

  const completedSteps = onboarding?.steps.filter((s) => s.status === "concluido").length ?? 0;
  const totalSteps = onboarding?.steps.length ?? 0;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Back link */}
        <Link to="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> Clientes
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {cliente.nome_fantasia ?? cliente.name}
            </h1>
            {cliente.nome_fantasia && (
              <p className="mt-0.5 text-sm text-muted-foreground">{cliente.name}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[cliente.status])}>
                {statusLabel[cliente.status]}
              </span>
              {(cliente.city || cliente.state) && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {[cliente.city, cliente.state].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
            <Pencil className="h-4 w-4" /> Editar
          </button>
        </div>

        {/* Dados cadastrais */}
        <section className="rounded-xl border bg-card p-6 mb-6">
          <h2 className="text-base font-semibold mb-4">Dados Cadastrais</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {cliente.cnpj && (
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">CNPJ</div>
                  <div className="text-sm font-medium">{cliente.cnpj}</div>
                </div>
              </div>
            )}
            {cliente.razao_social && (
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Razão Social</div>
                  <div className="text-sm font-medium">{cliente.razao_social}</div>
                </div>
              </div>
            )}
            {cliente.responsible && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Responsável</div>
                  <div className="text-sm font-medium">{cliente.responsible}</div>
                </div>
              </div>
            )}
            {cliente.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Telefone</div>
                  <div className="text-sm font-medium">{cliente.phone}</div>
                </div>
              </div>
            )}
            {cliente.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">E-mail</div>
                  <div className="text-sm font-medium">{cliente.email}</div>
                </div>
              </div>
            )}
            {cliente.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Endereço</div>
                  <div className="text-sm font-medium">{cliente.address}</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Produtos contratados */}
        <section className="rounded-xl border bg-card p-6 mb-6">
          <h2 className="text-base font-semibold mb-4">Produtos Contratados</h2>
          {cliente.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum produto ativo.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {cliente.products.map((p) => {
                const isOnboarding = onboarding != null && onboarding.product === p && onboarding.status !== "concluido";
                return (
                  <div key={p} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", productColors[p])}>
                        {productLabel[p]}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Desde {fmtDate(cliente.created_at)}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs font-medium rounded-full px-2 py-0.5",
                      isOnboarding ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    )}>
                      {isOnboarding ? "Onboarding" : "Ativo"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Onboarding ativo */}
        {onboarding && (
          <section className="rounded-xl border bg-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Onboarding Ativo</h2>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", onboardingStatusColors[onboarding.status])}>
                  {onboardingStatusLabel[onboarding.status]}
                </span>
                <Link
                  to="/onboarding/$id"
                  params={{ id: onboarding.id }}
                  className="text-xs text-primary hover:underline"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{productLabel[onboarding.product]}</span>
                <span className="text-xs font-medium">{completedSteps}/{totalSteps} etapas</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Lista de etapas */}
            <div className="space-y-2">
              {onboarding.steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                  <StepIcon status={step.status} />
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-sm",
                      step.status === "concluido" ? "text-muted-foreground line-through" : "font-medium"
                    )}>
                      {step.order_index}. {step.title}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {step.status === "concluido" && step.completed_at
                      ? fmtDate(step.completed_at)
                      : step.status === "em_andamento"
                        ? <span className="text-blue-600 font-medium">Em andamento</span>
                        : step.sla_hours
                          ? <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{step.sla_hours}h</span>
                          : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Histórico de vendas */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold mb-4">Histórico de Vendas</h2>
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left pb-2 pr-4">Produto</th>
                    <th className="text-left pb-2 pr-4">Data</th>
                    <th className="text-left pb-2 pr-4">Vendedor</th>
                    <th className="text-right pb-2">Mensalidade</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", productColors[sale.product as ProductType])}>
                          {productLabel[sale.product as ProductType]}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{fmtDate(sale.sold_at)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{sale.sold_by ?? "—"}</td>
                      <td className="py-2 text-right font-medium">
                        {sale.value_monthly != null ? fmtCurrency(sale.value_monthly) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </AppShell>
  );
}
