import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Radio, Bell, Tv, ShieldCheck,
  Sparkles, FileText, BarChart3, Layers, LogOut, ChevronDown, ChevronRight,
  ClipboardList, PlusCircle, Users, TrendingUp, GraduationCap,
  BookOpen, GitMerge, FileSignature, RefreshCw, XCircle,
  BarChart2, DollarSign, CheckSquare, BrainCircuit, Activity,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { useAuth, signOut } from "@/shared/hooks/use-auth";

type NavLeaf = { to: string; label: string; icon: typeof Sparkles; end?: boolean };
type NavSection = { section: string; children: NavLeaf[] };
type NavArea = { area: string; icon: typeof Sparkles; children: (NavLeaf | NavSection)[] };
type NavHome = { to: string; label: string; icon: typeof Sparkles; end?: boolean };
type NavItem = NavHome | NavArea;

function isHome(item: NavItem): item is NavHome {
  return "to" in item;
}
function isArea(item: NavItem): item is NavArea {
  return "area" in item;
}

const nav: NavItem[] = [
  { to: "/", label: "Hub 3S", icon: Sparkles, end: true },

  {
    area: "Clientes",
    icon: Building2,
    children: [
      { to: "/clientes", label: "Cadastro de Clientes", icon: Building2 },
      { to: "/comercial/nova-venda", label: "Nova Contratação", icon: PlusCircle },
      { section: "Jornada", children: [
        { to: "/onboarding", label: "Onboardings", icon: ClipboardList },
      ]},
      { section: "Em breve", children: [
        { to: "/clientes", label: "Jornada do Cliente", icon: GitMerge },
        { to: "/clientes", label: "Contratos", icon: FileSignature },
        { to: "/clientes", label: "Renovações", icon: RefreshCw },
        { to: "/clientes", label: "Cancelamentos", icon: XCircle },
      ]},
    ],
  },

  {
    area: "Operações",
    icon: Radio,
    children: [
      { section: "Produto CRM", children: [
        { to: "/crm", label: "Visão Geral", icon: LayoutDashboard, end: true },
        { to: "/crm/dashboard", label: "Dashboard", icon: BarChart2 },
        { to: "/crm/clinicas", label: "Clínicas CRM", icon: Building2 },
        { to: "/crm/canais", label: "Chips e Canais", icon: Radio },
        { to: "/crm/templates", label: "Templates Meta", icon: FileText },
        { to: "/crm/volume", label: "Volume API", icon: BarChart3 },
        { to: "/crm/contingencia", label: "Contingência", icon: ShieldCheck },
        { to: "/crm/alertas", label: "Alertas CRM", icon: Bell },
        { to: "/tv", label: "Modo TV CRM", icon: Tv },
      ]},
      { section: "Controle de Lead", children: [
        { to: "/crm/controle-lead", label: "Board de Leads", icon: ClipboardList },
      ]},
      { section: "Em breve", children: [
        { to: "/crm", label: "Tráfego Pago", icon: TrendingUp },
        { to: "/crm", label: "Gestão / Consultoria", icon: Users },
        { to: "/crm", label: "Projeto Escola", icon: GraduationCap },
      ]},
    ],
  },

  {
    area: "Gestão",
    icon: BarChart2,
    children: [
      { section: "Supervisão", children: [
        { to: "/hub-builder",          label: "Centro de Construção", icon: Layers },
        { to: "/gestao/eventos",       label: "Eventos do Sistema",   icon: Activity },
        { to: "/gestao/tarefas-ia",    label: "Tarefas de IA",        icon: BrainCircuit },
      ]},
      { section: "Em breve", children: [
        { to: "/hub-builder", label: "Financeiro", icon: DollarSign },
        { to: "/hub-builder", label: "Indicadores", icon: BookOpen },
        { to: "/hub-builder", label: "Alertas", icon: Bell },
        { to: "/hub-builder", label: "Aprovações", icon: CheckSquare },
        { to: "/hub-builder", label: "IA Supervisor", icon: BrainCircuit },
        { to: "/hub-builder", label: "TV Executiva", icon: Tv },
      ]},
    ],
  },
];

function isAreaActive(area: NavArea, pathname: string): boolean {
  return area.children.some((child) => {
    if ("to" in child) {
      return child.end ? pathname === child.to : pathname === child.to || pathname.startsWith(child.to + "/");
    }
    return child.children.some((leaf) =>
      leaf.end ? pathname === leaf.to : pathname === leaf.to || pathname.startsWith(leaf.to + "/")
    );
  });
}

function NavLeafLink({ item, pathname }: { item: NavLeaf; pathname: string }) {
  const Icon = item.icon;
  const active = item.end
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(item.to + "/");
  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {item.label}
    </Link>
  );
}

function AreaGroup({ area, pathname }: { area: NavArea; pathname: string }) {
  const defaultOpen = isAreaActive(area, pathname);
  const [open, setOpen] = useState(defaultOpen);
  const Icon = area.icon;
  const active = isAreaActive(area, pathname);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? "text-sidebar-foreground font-semibold"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{area.area}</span>
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40" />
          : <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/40" />}
      </button>

      {open && (
        <div className="ml-2 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
          {area.children.map((child, i) => {
            if ("to" in child) {
              return <NavLeafLink key={child.to} item={child} pathname={pathname} />;
            }
            // NavSection inside area
            const isComingSoon = child.section === "Em breve";
            return (
              <div key={i}>
                <div className={cn(
                  "px-2 pt-3 pb-1 text-[9px] uppercase tracking-wider",
                  isComingSoon ? "text-sidebar-foreground/30" : "text-sidebar-foreground/45",
                )}>
                  {child.section}
                </div>
                {child.children.map((leaf) => (
                  <div key={leaf.label} className={isComingSoon ? "opacity-40 pointer-events-none" : ""}>
                    <NavLeafLink item={leaf} pathname={pathname} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth/login" });
  }

  const displayName = user?.user_metadata?.full_name
    ?? user?.email?.split("@")[0]
    ?? "Usuário";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary grid place-items-center text-sidebar-primary-foreground font-bold">
              3S
            </div>
            <div>
              <div className="font-semibold leading-tight">Hub 3S</div>
              <div className="text-xs text-sidebar-foreground/60">Sala de Operação</div>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {nav.map((item, i) => {
            if (isHome(item)) {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors mb-2",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            }
            if (isArea(item)) {
              return <AreaGroup key={i} area={item} pathname={pathname} />;
            }
            return null;
          })}
        </nav>

        {/* Usuário logado */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent/60 transition-colors text-left"
          >
            <div className="h-7 w-7 rounded-full bg-sidebar-primary grid place-items-center text-[11px] font-bold text-sidebar-primary-foreground shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</div>
              <div className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</div>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 text-sidebar-foreground/50 transition-transform shrink-0", userMenuOpen && "rotate-180")} />
          </button>

          {userMenuOpen && (
            <div className="mt-1 rounded-lg border border-sidebar-border bg-sidebar overflow-hidden">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-critical transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair do sistema
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
