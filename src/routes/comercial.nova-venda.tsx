import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { mockClientes } from "@/features/clientes/mock-data";
import { productLabel } from "@/features/clientes/types";
import type { ProductType } from "@/features/clientes/types";
import { cn } from "@/shared/lib/utils";
import { Search, PlusCircle, CheckCircle2, ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/comercial/nova-venda")({
  head: () => ({ meta: [{ title: "Nova Venda — Hub 3S" }] }),
  component: NovaVendaPage,
});

const products: ProductType[] = [
  "crm",
  "trafego_pago",
  "trafego_com_agendamento",
  "gestao_consultoria",
  "projeto_escola",
];

const origins = [
  { value: "manual", label: "Manual" },
  { value: "kommo", label: "Kommo" },
  { value: "indicacao", label: "Indicação" },
  { value: "webhook", label: "Webhook" },
];

function today() {
  return new Date().toISOString().split("T")[0];
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border bg-card shadow-lg px-5 py-4 animate-in slide-in-from-bottom-4">
      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground text-xs">
        Fechar
      </button>
    </div>
  );
}

function NovaVendaPage() {
  const navigate = useNavigate();

  const [clinicSearch, setClinicSearch] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [product, setProduct] = useState<ProductType | "">("");
  const [valueMonthly, setValueMonthly] = useState("");
  const [valueSetup, setValueSetup] = useState("");
  const [contractMonths, setContractMonths] = useState("12");
  const [soldBy, setSoldBy] = useState("");
  const [soldAt, setSoldAt] = useState(today());
  const [origin, setOrigin] = useState("manual");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredClinics = clinicSearch.trim()
    ? mockClientes.filter(
        (c) =>
          c.name.toLowerCase().includes(clinicSearch.toLowerCase()) ||
          (c.nome_fantasia ?? "").toLowerCase().includes(clinicSearch.toLowerCase()) ||
          (c.cnpj ?? "").includes(clinicSearch)
      )
    : [];

  const selectedClinic = mockClientes.find((c) => c.id === selectedClinicId);

  function validate() {
    const e: Record<string, string> = {};
    if (!selectedClinicId) e.clinic = "Selecione uma clínica.";
    if (!product) e.product = "Selecione um produto.";
    if (!soldAt) e.soldAt = "Informe a data da venda.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setToast(true);
    setTimeout(() => {
      setToast(false);
      navigate({ to: "/onboarding" });
    }, 2000);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-10">

        {/* Back */}
        <Link to="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> Clientes
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Comercial</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Nova Venda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre uma venda fechada para iniciar o processo de onboarding.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Busca de clínica */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Clínica</label>
            {selectedClinic ? (
              <div className="flex items-center justify-between rounded-lg border bg-accent/40 px-4 py-3">
                <div>
                  <div className="font-medium text-sm">{selectedClinic.nome_fantasia ?? selectedClinic.name}</div>
                  {selectedClinic.cnpj && (
                    <div className="text-xs text-muted-foreground">{selectedClinic.cnpj}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedClinicId(""); setClinicSearch(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Alterar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar clínica ou CNPJ..."
                  value={clinicSearch}
                  onChange={(e) => setClinicSearch(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                    errors.clinic && "border-red-400"
                  )}
                />
                {filteredClinics.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border bg-card shadow-lg overflow-hidden">
                    {filteredClinics.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedClinicId(c.id); setClinicSearch(""); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">{c.nome_fantasia ?? c.name}</div>
                        {c.cnpj && <div className="text-xs text-muted-foreground">{c.cnpj}</div>}
                      </button>
                    ))}
                  </div>
                )}
                {clinicSearch.trim() && filteredClinics.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border bg-card shadow-lg px-4 py-3 text-sm text-muted-foreground">
                    Nenhuma clínica encontrada.{" "}
                    <Link to="/clientes" className="text-primary hover:underline">
                      Criar nova clínica
                    </Link>
                  </div>
                )}
              </div>
            )}
            {errors.clinic && <p className="mt-1 text-xs text-red-500">{errors.clinic}</p>}
          </div>

          {/* Produto */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Produto</label>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value as ProductType)}
              className={cn(
                "w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                errors.product && "border-red-400"
              )}
            >
              <option value="">Selecione um produto...</option>
              {products.map((p) => (
                <option key={p} value={p}>{productLabel[p]}</option>
              ))}
            </select>
            {errors.product && <p className="mt-1 text-xs text-red-500">{errors.product}</p>}
          </div>

          {/* Valores */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Valor Mensal (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={valueMonthly}
                onChange={(e) => setValueMonthly(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Setup (R$, opcional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={valueSetup}
                onChange={(e) => setValueSetup(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Meses de contrato */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Meses de Contrato</label>
            <input
              type="number"
              min="1"
              value={contractMonths}
              onChange={(e) => setContractMonths(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Vendido por + Data */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Vendido por</label>
              <input
                type="text"
                placeholder="Nome do vendedor"
                value={soldBy}
                onChange={(e) => setSoldBy(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Data da Venda</label>
              <input
                type="date"
                value={soldAt}
                onChange={(e) => setSoldAt(e.target.value)}
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.soldAt && "border-red-400"
                )}
              />
              {errors.soldAt && <p className="mt-1 text-xs text-red-500">{errors.soldAt}</p>}
            </div>
          </div>

          {/* Origem */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Origem</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {origins.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Observações (opcional)</label>
            <textarea
              rows={3}
              placeholder="Notas sobre a venda, condições especiais, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/clientes"
              className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Registrar Venda
            </button>
          </div>

        </form>
      </div>

      {toast && (
        <Toast
          message="Venda registrada! Redirecionando para onboarding..."
          onClose={() => setToast(false)}
        />
      )}
    </AppShell>
  );
}
