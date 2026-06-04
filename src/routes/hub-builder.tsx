import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Circle,
  ChevronDown,
  ChevronRight,
  Radio,
  Send,
  BarChart3,
  Target,
  GraduationCap,
  TrendingUp,
  DollarSign,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hub-builder")({
  head: () => ({ meta: [{ title: "Centro de Construção — Hub 3S" }] }),
  component: HubBuilder,
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FeatureStatus = "concluido" | "andamento" | "pendente";

interface Feature {
  label: string;
  status: FeatureStatus;
}

interface SubModule {
  id: string;
  label: string;
  features: Feature[];
}

interface Module {
  id: string;
  label: string;
  description: string;
  icon: typeof Radio;
  subModules?: SubModule[];
  features?: Feature[];
}

// ─── Dados ────────────────────────────────────────────────────────────────────

const modules: Module[] = [
  {
    id: "crm",
    label: "Produto CRM",
    description:
      "Campanhas de WhatsApp, gestão de canais e resultados por clínica.",
    icon: Radio,
    subModules: [
      {
        id: "chips-canais",
        label: "Chips e Canais",
        features: [
          { label: "Estrutura visual do projeto (layout, navegação, design system)", status: "concluido" },
          { label: "Dashboard executivo com KPIs consolidados", status: "concluido" },
          { label: "Lista de clínicas com scores de saúde", status: "concluido" },
          { label: "Detalhe por clínica (canais, contingência, alertas)", status: "concluido" },
          { label: "Inventário de canais com status em tempo real", status: "concluido" },
          { label: "Score de contingência (5 itens por clínica)", status: "concluido" },
          { label: "Score de comunicabilidade por clínica", status: "concluido" },
          { label: "Monitoramento de templates Meta (status, categoria, custo)", status: "concluido" },
          { label: "Volume API Oficial (enviados, entregues, lidos, custo)", status: "concluido" },
          { label: "Central de alertas com filtros por severidade e status", status: "concluido" },
          { label: "Modo TV fullscreen para sala de operações", status: "concluido" },
          { label: "Centro de Construção do Hub (este painel)", status: "concluido" },
          { label: "Reorganização modular do código (features/crm-chips, shared/)", status: "concluido" },
          { label: "Schema do banco: tabelas de usuários e permissões (hub_users, clinic_assignments)", status: "concluido" },
          { label: "Schema do banco: campos adicionais em clínicas, canais e alertas", status: "concluido" },
          { label: "Schema do banco: tabelas de templates Meta e volume da API", status: "concluido" },
          { label: "Schema do banco: histórico de monitoramento com controle de versão", status: "concluido" },
          { label: "Schema do banco: todos os índices de performance", status: "concluido" },
          { label: "Autenticação de usuários (login seguro)", status: "andamento" },
          { label: "Leitura de dados reais substituindo dados de demonstração", status: "pendente" },
          { label: "Ações operacionais: resolver alerta, atualizar status de canal", status: "pendente" },
          { label: "Edição de checklist de contingência pelo sistema", status: "pendente" },
          { label: "Cadastro e edição de clínicas", status: "pendente" },
          { label: "Cadastro e edição de canais por clínica", status: "pendente" },
          { label: "Integração com Meta API (coleta automática de qualidade e volume)", status: "pendente" },
          { label: "Integração com plataforma de atendimento (status de sessão)", status: "pendente" },
          { label: "Robô de coleta automática de status dos canais", status: "pendente" },
          { label: "Geração automática de alertas por agente de IA", status: "pendente" },
          { label: "Notificações em tempo real (Supabase Realtime)", status: "pendente" },
          { label: "Gestão de usuários e permissões por clínica", status: "pendente" },
        ],
      },
      {
        id: "disparos",
        label: "Disparos e Campanhas",
        features: [
          { label: "Calendário de campanhas por clínica", status: "pendente" },
          { label: "Criação e agendamento de campanhas", status: "pendente" },
          { label: "Segmentação: confirmação de agenda, faltosos, aniversariantes", status: "pendente" },
          { label: "Segmentação: pacientes não efetivados, retorno", status: "pendente" },
          { label: "Acompanhamento em tempo real de cada disparo", status: "pendente" },
          { label: "Histórico de campanhas por clínica", status: "pendente" },
          { label: "Integração com plataforma de disparo via API", status: "pendente" },
          { label: "Controle de base de pacientes por clínica", status: "pendente" },
          { label: "Templates de campanha reutilizáveis", status: "pendente" },
          { label: "Relatório de campanha (disparado, entregue, respondido)", status: "pendente" },
        ],
      },
      {
        id: "resultados",
        label: "Resultados",
        features: [
          { label: "Dashboard de resultados por clínica", status: "pendente" },
          { label: "Agendamentos gerados por campanha", status: "pendente" },
          { label: "Taxa de conversão (disparo → agendamento)", status: "pendente" },
          { label: "Receita estimada gerada pelo CRM", status: "pendente" },
          { label: "Comparativo de performance entre clínicas", status: "pendente" },
          { label: "Integração com Kommo para rastreamento de leads", status: "pendente" },
          { label: "Relatórios exportáveis para apresentação ao cliente", status: "pendente" },
          { label: "Visão histórica de resultados mês a mês", status: "pendente" },
        ],
      },
    ],
  },
  {
    id: "trafego",
    label: "Tráfego Pago",
    description:
      "Gestão de anúncios, captação de leads e entrega de pacientes agendados.",
    icon: Target,
    features: [
      { label: "Painel de campanhas ativas por clínica", status: "pendente" },
      { label: "Métricas de anúncios (alcance, cliques, custo por lead)", status: "pendente" },
      { label: "Rastreamento do lead da captação ao agendamento", status: "pendente" },
      { label: "Controle de modalidade: tráfego puro vs. com agendamento", status: "pendente" },
      { label: "Integração com Meta Ads API", status: "pendente" },
      { label: "Integração com Google Ads API", status: "pendente" },
      { label: "Integração com Kommo (CRM de leads)", status: "pendente" },
      { label: "Relatório de custo por agendamento entregue", status: "pendente" },
      { label: "Comparativo de performance entre clínicas", status: "pendente" },
    ],
  },
  {
    id: "gestao",
    label: "Gestão e Consultoria",
    description:
      "Acompanhamento de indicadores e planos de ação para clínicas atendidas.",
    icon: BarChart3,
    features: [
      { label: "Painel de indicadores por clínica consultada", status: "pendente" },
      { label: "Registro de reuniões e entregas de consultoria", status: "pendente" },
      { label: "Planos de ação com status de execução por tarefa", status: "pendente" },
      { label: "Metas mensais e acompanhamento de resultado", status: "pendente" },
      { label: "Relatório executivo por clínica", status: "pendente" },
      { label: "Histórico de evolução dos indicadores", status: "pendente" },
    ],
  },
  {
    id: "escola",
    label: "Projeto Escola",
    description:
      "Captação de pacientes em escolas e conversão para tratamento ortodôntico.",
    icon: GraduationCap,
    features: [
      { label: "Controle de escolas visitadas por cidade", status: "pendente" },
      { label: "Registro de leads captados por visita e por representante", status: "pendente" },
      { label: "Taxa de conversão: escola → clínica", status: "pendente" },
      { label: "Metas e performance por representante de campo", status: "pendente" },
      { label: "Calendário de visitas programadas", status: "pendente" },
      { label: "Relatório por período e por região", status: "pendente" },
    ],
  },
  {
    id: "comercial",
    label: "Comercial 3S",
    description:
      "Pipeline de vendas para novos clientes e crescimento da base da empresa.",
    icon: TrendingUp,
    features: [
      { label: "Pipeline de prospecção de novas clínicas", status: "pendente" },
      { label: "Controle de propostas enviadas e status de negociação", status: "pendente" },
      { label: "Histórico de contatos por clínica prospectada", status: "pendente" },
      { label: "Metas comerciais por período e por vendedor", status: "pendente" },
      { label: "Performance da equipe de vendas", status: "pendente" },
      { label: "Onboarding de novos clientes pelo sistema", status: "pendente" },
      { label: "Relatório de crescimento da base", status: "pendente" },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro 3S",
    description:
      "Controle de receitas, custos e saúde financeira da empresa.",
    icon: DollarSign,
    features: [
      { label: "Receitas por produto e por clínica atendida", status: "pendente" },
      { label: "Custos operacionais (plataformas, chips, equipe)", status: "pendente" },
      { label: "Margem por produto e por cliente", status: "pendente" },
      { label: "Fluxo de caixa mensal", status: "pendente" },
      { label: "Contas a receber com status de pagamento", status: "pendente" },
      { label: "Relatórios financeiros para liderança", status: "pendente" },
      { label: "Comparativo de receita mês a mês", status: "pendente" },
    ],
  },
];

// ─── Utilitários ──────────────────────────────────────────────────────────────

function allFeatures(mod: Module): Feature[] {
  if (mod.features) return mod.features;
  return mod.subModules?.flatMap((s) => s.features) ?? [];
}

function calcProgress(features: Feature[]): number {
  if (features.length === 0) return 0;
  const done = features.filter((f) => f.status === "concluido").length;
  return Math.round((done / features.length) * 100);
}

function counts(features: Feature[]) {
  return {
    total: features.length,
    concluido: features.filter((f) => f.status === "concluido").length,
    andamento: features.filter((f) => f.status === "andamento").length,
    pendente: features.filter((f) => f.status === "pendente").length,
  };
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const color =
    value >= 80 ? "bg-success" : value >= 40 ? "bg-warning" : value > 0 ? "bg-primary" : "bg-muted";
  return (
    <div className={cn("h-2 w-full rounded-full bg-muted overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function StatusIcon({ status }: { status: FeatureStatus }) {
  if (status === "concluido")
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />;
  if (status === "andamento")
    return <Clock className="h-4 w-4 shrink-0 text-warning animate-pulse" />;
  return <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />;
}

function StatusPill({ status }: { status: FeatureStatus }) {
  const map = {
    concluido: { label: "Concluído", cls: "bg-success/10 text-success border-success/20" },
    andamento: { label: "Em andamento", cls: "bg-warning/10 text-warning border-warning/20" },
    pendente: { label: "Pendente", cls: "bg-muted text-muted-foreground border-border" },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", cls)}>
      {label}
    </span>
  );
}

function FeatureRow({ feature }: { feature: Feature }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-t first:border-t-0">
      <StatusIcon status={feature.status} />
      <span
        className={cn(
          "text-sm leading-snug",
          feature.status === "concluido"
            ? "text-foreground"
            : feature.status === "andamento"
            ? "text-foreground font-medium"
            : "text-muted-foreground",
        )}
      >
        {feature.label}
      </span>
    </div>
  );
}

function SubModuleCard({ sub }: { sub: SubModule }) {
  const [open, setOpen] = useState(sub.id === "chips-canais");
  const progress = calcProgress(sub.features);
  const c = counts(sub.features);

  return (
    <div className="rounded-xl border bg-background">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-accent/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3 min-w-0">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-medium">{sub.label}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            <span className="text-success font-medium">{c.concluido} concluídos</span>
            {c.andamento > 0 && (
              <span className="text-warning font-medium">{c.andamento} em andamento</span>
            )}
            <span>{c.pendente} pendentes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 hidden sm:block">
              <ProgressBar value={progress} />
            </div>
            <span
              className={cn(
                "text-sm font-bold tabular-nums w-10 text-right",
                progress >= 80
                  ? "text-success"
                  : progress >= 40
                  ? "text-warning"
                  : progress > 0
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {progress}%
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="sm:hidden mb-3">
            <ProgressBar value={progress} />
          </div>
          <div>
            {sub.features.map((f) => (
              <FeatureRow key={f.label} feature={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleCard({ mod }: { mod: Module }) {
  const [open, setOpen] = useState(mod.id === "crm");
  const features = allFeatures(mod);
  const progress = calcProgress(features);
  const c = counts(features);
  const Icon = mod.icon;

  const progressColor =
    progress >= 80
      ? "text-success"
      : progress >= 40
      ? "text-warning"
      : progress > 0
      ? "text-primary"
      : "text-muted-foreground/50";

  const ringColor =
    progress >= 80
      ? "border-success/30"
      : progress >= 40
      ? "border-warning/30"
      : progress > 0
      ? "border-primary/30"
      : "border-border";

  return (
    <div className={cn("rounded-2xl border bg-card shadow-sm overflow-hidden", ringColor)}>
      {/* Cabeçalho do módulo */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left hover:bg-accent/20 transition-colors"
      >
        <div className="px-6 py-5 flex items-start gap-4">
          <div
            className={cn(
              "rounded-xl p-2.5 shrink-0",
              progress > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">{mod.label}</h2>
              {progress === 0 && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground border rounded-full px-2 py-0.5">
                  Em breve
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{mod.description}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-2">
            <div className="text-right">
              <div className={cn("text-3xl font-bold tabular-nums leading-none", progressColor)}>
                {progress}%
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 text-right">concluído</div>
            </div>
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="px-6 pb-5">
          <ProgressBar value={progress} />
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-success">{c.concluido}</span> concluídos
            </span>
            {c.andamento > 0 && (
              <span>
                <span className="font-medium text-warning">{c.andamento}</span> em andamento
              </span>
            )}
            <span>
              <span className="font-medium">{c.pendente}</span> pendentes
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span>{c.total} funcionalidades no total</span>
          </div>
        </div>
      </button>

      {/* Corpo expandível */}
      {open && (
        <div className="border-t px-6 py-5 space-y-3 bg-muted/20">
          {mod.subModules ? (
            mod.subModules.map((sub) => <SubModuleCard key={sub.id} sub={sub} />)
          ) : (
            <div className="rounded-xl border bg-background px-5 py-4">
              {features.map((f) => (
                <FeatureRow key={f.label} feature={f} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

function HubBuilder() {
  const totalFeatures = modules.flatMap(allFeatures);
  const totalProgress = calcProgress(totalFeatures);
  const totalCounts = counts(totalFeatures);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Cabeçalho */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Hub 3S
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Centro de Construção</h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Acompanhe em tempo real a evolução de cada módulo do Hub 3S — do planejamento à entrega.
          </p>
        </header>

        {/* Painel geral */}
        <div className="rounded-2xl border bg-card shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Progresso geral do Hub 3S
              </div>
              <ProgressBar value={totalProgress} className="h-3" />
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="font-semibold text-success">{totalCounts.concluido}</span>
                  <span className="text-muted-foreground">concluídas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="font-semibold text-warning">{totalCounts.andamento}</span>
                  <span className="text-muted-foreground">em andamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                  <span className="font-semibold">{totalCounts.pendente}</span>
                  <span className="text-muted-foreground">pendentes</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-1 shrink-0">
              <div
                className={cn(
                  "text-6xl font-black tabular-nums leading-none",
                  totalProgress >= 80
                    ? "text-success"
                    : totalProgress >= 40
                    ? "text-warning"
                    : "text-primary",
                )}
              >
                {totalProgress}%
              </div>
              <div className="text-xs text-muted-foreground">do Hub concluído</div>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 mb-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-warning" />
            <span>Em andamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span>Pendente / Planejado</span>
          </div>
        </div>

        {/* Módulos */}
        <div className="space-y-4">
          {modules.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Hub 3S · Centro de Construção · atualizado manualmente conforme evolução do projeto
        </footer>
      </div>
    </AppShell>
  );
}
