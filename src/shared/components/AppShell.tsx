import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Radio, Bell, Tv, ShieldCheck,
  Sparkles, FileText, BarChart3, Layers, LogOut, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { useAuth, signOut } from "@/shared/hooks/use-auth";

type NavItem =
  | { section: string }
  | { to: string; label: string; icon: typeof Sparkles; end?: boolean };

const nav: NavItem[] = [
  { to: "/", label: "Hub 3S", icon: Sparkles, end: true },
  { to: "/crm", label: "Produto CRM", icon: LayoutDashboard, end: true },
  { section: "Chips / Canais" },
  { to: "/crm/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/crm/clinicas", label: "Clínicas", icon: Building2 },
  { to: "/crm/canais", label: "Canais", icon: Radio },
  { to: "/crm/templates", label: "Templates Meta", icon: FileText },
  { to: "/crm/volume", label: "Volume API", icon: BarChart3 },
  { to: "/crm/contingencia", label: "Contingência", icon: ShieldCheck },
  { to: "/crm/alertas", label: "Alertas", icon: Bell },
  { to: "/tv", label: "Modo TV", icon: Tv },
  { section: "Sistema" },
  { to: "/hub-builder", label: "Centro de Construção", icon: Layers },
];

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
            if ("section" in item) {
              return (
                <div key={i} className="px-2 pt-4 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
                  {item.section}
                </div>
              );
            }
            const Icon = item.icon;
            const active = item.end
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
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
