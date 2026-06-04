import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { mockClientes } from "@/features/clientes/mock-data";
import { productLabel } from "@/features/clientes/types";
import type { ClienteStatus, ProductType } from "@/features/clientes/types";
import { cn } from "@/shared/lib/utils";
import { Search, PlusCircle, MapPin, User } from "lucide-react";

export const Route = createFileRoute("/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — Hub 3S" }] }),
  component: ClientesPage,
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

function ClientesPage() {
  const [search, setSearch] = useState("");

  const filtered = mockClientes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.nome_fantasia ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Operações</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Clientes</h1>
            <p className="mt-1 text-sm text-muted-foreground">{mockClientes.length} clínicas cadastradas</p>
          </div>
          <Link
            to="/comercial/nova-venda"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Nova Venda
          </Link>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar clínica..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Grid de cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((cliente) => (
            <Link
              key={cliente.id}
              to="/clientes/$id"
              params={{ id: cliente.id }}
              className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                    {cliente.nome_fantasia ?? cliente.name}
                  </h2>
                  {cliente.nome_fantasia && (
                    <p className="text-xs text-muted-foreground truncate">{cliente.name}</p>
                  )}
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[cliente.status])}>
                  {statusLabel[cliente.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {(cliente.city || cliente.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[cliente.city, cliente.state].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {cliente.responsible}
                </span>
              </div>

              {/* Badges de produtos */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cliente.products.map((p) => (
                  <span key={p} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", productColors[p])}>
                    {productLabel[p]}
                  </span>
                ))}
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-2 py-16 text-center text-muted-foreground text-sm">
              Nenhum cliente encontrado para "{search}".
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
