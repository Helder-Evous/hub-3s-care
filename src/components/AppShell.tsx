import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Building2, Radio, Bell, Tv, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Hub 3S", icon: Sparkles, end: true },
  { to: "/crm", label: "Produto CRM", icon: LayoutDashboard },
  { section: "Chips / Canais" },
  { to: "/crm/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/crm/clinicas", label: "Clínicas", icon: Building2 },
  { to: "/crm/canais", label: "Canais", icon: Radio },
  { to: "/crm/contingencia", label: "Contingência", icon: ShieldCheck },
  { to: "/crm/alertas", label: "Alertas", icon: Bell },
  { to: "/tv", label: "Modo TV", icon: Tv },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary grid place-items-center text-sidebar-primary-foreground font-bold">3S</div>
            <div>
              <div className="font-semibold leading-tight">Hub 3S</div>
              <div className="text-xs text-sidebar-foreground/60">Sala de Operação</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {nav.map((item, i) => {
            if ("section" in item) {
              return <div key={i} className="px-2 pt-4 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">{item.section}</div>;
            }
            const Icon = item.icon;
            const active = item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
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
        <div className="px-4 py-3 text-[11px] text-sidebar-foreground/50 border-t border-sidebar-border">
          v0.1 · MVP Chips/Canais
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
