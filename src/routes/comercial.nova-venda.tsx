import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientes } from "@/features/clientes/queries";
import { useRegisterSale } from "@/features/clientes/mutations";
import type { NewClinicData } from "@/features/clientes/mutations";
import { productLabel } from "@/features/clientes/types";
import type { ProductType } from "@/features/clientes/types";
import { cn } from "@/shared/lib/utils";
import {
  Search, PlusCircle, CheckCircle2, ChevronLeft, Loader2,
  Building2, X,
} from "lucide-react";

export const Route = createFileRoute("/comercial/nova-venda")({
  head: () => ({ meta: [{ title: "Nova Venda — Hub 3S" }] }),
  component: NovaVendaPage,
});

type ClinicMode = "search" | "existing" | "creating";

const products: ProductType[] = [
  "crm", "trafego_pago", "trafego_com_agendamento",
  "gestao_consultoria", "projeto_escola",
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

const emptyNewClinic: NewClinicData = {
  name: "", responsible: "", phone: "", city: "", state: "",
  cnpj: "", razao_social: "", email: "", address: "",
};

function inputClass(hasError?: boolean) {
  return cn(
    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm",
    "focus:outline-none focus:ring-2 focus:ring-ring",
    hasError && "border-red-400"
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
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
  const { data: clientes = [] } = useClientes();
  const { mutateAsync: registerSale, isPending, isError } = useRegisterSale();

  // Clínica
  const [clinicMode, setClinicMode] = useState<ClinicMode>("search");
  const [clinicSearch, setClinicSearch] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [newClinic, setNewClinic] = useState<NewClinicData>(emptyNewClinic);

  // Venda
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
    ? clientes.filter((c) =>
        c.name.toLowerCase().includes(clinicSearch.toLowerCase()) ||
        (c.nome_fantasia ?? "").toLowerCase().includes(clinicSearch.toLowerCase()) ||
        (c.cnpj ?? "").includes(clinicSearch)
      )
    : [];

  const selectedClinic = clientes.find((c) => c.id === selectedClinicId);

  function selectExisting(id: string) {
    setSelectedClinicId(id);
    setClinicSearch("");
    setClinicMode("existing");
    setErrors((prev) => { const e = { ...prev }; delete e.clinic; return e; });
  }

  function startCreating() {
    setClinicMode("creating");
    setClinicSearch("");
    setErrors((prev) => { const e = { ...prev }; delete e.clinic; return e; });
  }

  function resetClinic() {
    setClinicMode("search");
    setSelectedClinicId("");
    setClinicSearch("");
    setNewClinic(emptyNewClinic);
  }

  function setNC(field: keyof NewClinicData, value: string) {
    setNewClinic((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[`nc_${field}`]; return e; });
  }

  function validate() {
    const e: Record<string, string> = {};

    if (clinicMode === "search") {
      e.clinic = "Selecione uma clínica ou crie uma nova.";
    }
    if (clinicMode === "creating") {
      if (!newClinic.name.trim()) e.nc_name = "Obrigatório";
      if (!newClinic.responsible.trim()) e.nc_responsible = "Obrigatório";
      if (!newClinic.phone.trim()) e.nc_phone = "Obrigatório";
      if (!newClinic.city.trim()) e.nc_city = "Obrigatório";
      if (!newClinic.state.trim()) e.nc_state = "Obrigatório";
    }
    if (!product) e.product = "Selecione um produto.";
    if (!soldAt) e.soldAt = "Informe a data da venda.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !product) return;

    try {
      const result = await registerSale(
        clinicMode === "existing"
          ? {
              clinic_id: selectedClinicId,
              product: product as ProductType,
              value_monthly: valueMonthly ? parseFloat(valueMonthly) : undefined,
              value_setup: valueSetup ? parseFloat(valueSetup) : undefined,
              contract_months: parseInt(contractMonths, 10) || 12,
              sold_by: soldBy || undefined,
              sold_at: soldAt,
              origin,
              notes: notes || undefined,
            }
          : {
              newClinic: {
                name: newClinic.name,
                responsible: newClinic.responsible,
                phone: newClinic.phone,
                city: newClinic.city,
                state: newClinic.state.toUpperCase(),
                cnpj: newClinic.cnpj || undefined,
                razao_social: newClinic.razao_social || undefined,
                email: newClinic.email || undefined,
                address: newClinic.address || undefined,
              },
              product: product as ProductType,
              value_monthly: valueMonthly ? parseFloat(valueMonthly) : undefined,
              value_setup: valueSetup ? parseFloat(valueSetup) : undefined,
              contract_months: parseInt(contractMonths, 10) || 12,
              sold_by: soldBy || undefined,
              sold_at: soldAt,
              origin,
              notes: notes || undefined,
            }
      );

      setToast(true);
      setTimeout(() => {
        setToast(false);
        navigate({ to: "/onboarding/$id", params: { id: result.onboarding.id } });
      }, 1500);
    } catch {
      // isError mostra o banner de erro
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-10">

        <Link to="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> Clientes
        </Link>

        <div className="mb-8">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Comercial</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Nova Venda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre uma venda fechada para iniciar o processo de onboarding.
          </p>
        </div>

        {isError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Erro ao registrar a venda. Tente novamente.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Clínica ──────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Clínica</label>

            {/* Clínica existente selecionada */}
            {clinicMode === "existing" && selectedClinic && (
              <div className="flex items-center justify-between rounded-lg border bg-accent/40 px-4 py-3">
                <div>
                  <div className="font-medium text-sm">{selectedClinic.nome_fantasia ?? selectedClinic.name}</div>
                  {selectedClinic.cnpj && (
                    <div className="text-xs text-muted-foreground">{selectedClinic.cnpj}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={resetClinic}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Alterar
                </button>
              </div>
            )}

            {/* Formulário de nova clínica */}
            {clinicMode === "creating" && (
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Building2 className="h-4 w-4 text-primary" />
                    Nova Clínica
                  </div>
                  <button
                    type="button"
                    onClick={resetClinic}
                    className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-xs font-medium mb-1">Nome da Clínica *</label>
                  <input
                    type="text"
                    placeholder="Ex: Clínica Odonto Bem"
                    value={newClinic.name}
                    onChange={(e) => setNC("name", e.target.value)}
                    className={inputClass(!!errors.nc_name)}
                  />
                  <FieldError msg={errors.nc_name} />
                </div>

                {/* Responsável + Telefone */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Responsável *</label>
                    <input
                      type="text"
                      placeholder="Nome do responsável"
                      value={newClinic.responsible}
                      onChange={(e) => setNC("responsible", e.target.value)}
                      className={inputClass(!!errors.nc_responsible)}
                    />
                    <FieldError msg={errors.nc_responsible} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Telefone *</label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={newClinic.phone}
                      onChange={(e) => setNC("phone", e.target.value)}
                      className={inputClass(!!errors.nc_phone)}
                    />
                    <FieldError msg={errors.nc_phone} />
                  </div>
                </div>

                {/* Cidade + Estado */}
                <div className="grid gap-3 sm:grid-cols-[1fr_80px]">
                  <div>
                    <label className="block text-xs font-medium mb-1">Cidade *</label>
                    <input
                      type="text"
                      placeholder="São Paulo"
                      value={newClinic.city}
                      onChange={(e) => setNC("city", e.target.value)}
                      className={inputClass(!!errors.nc_city)}
                    />
                    <FieldError msg={errors.nc_city} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">UF *</label>
                    <input
                      type="text"
                      placeholder="SP"
                      maxLength={2}
                      value={newClinic.state}
                      onChange={(e) => setNC("state", e.target.value.toUpperCase())}
                      className={inputClass(!!errors.nc_state)}
                    />
                    <FieldError msg={errors.nc_state} />
                  </div>
                </div>

                {/* Dados opcionais */}
                <details className="group">
                  <summary className="cursor-pointer text-xs text-muted-foreground select-none hover:text-foreground transition-colors">
                    + Dados adicionais opcionais (CNPJ, razão social, e-mail, endereço)
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">CNPJ</label>
                        <input
                          type="text"
                          placeholder="00.000.000/0001-00"
                          value={newClinic.cnpj}
                          onChange={(e) => setNC("cnpj", e.target.value)}
                          className={inputClass()}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Razão Social</label>
                        <input
                          type="text"
                          placeholder="Razão Social LTDA"
                          value={newClinic.razao_social}
                          onChange={(e) => setNC("razao_social", e.target.value)}
                          className={inputClass()}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">E-mail</label>
                      <input
                        type="email"
                        placeholder="contato@clinica.com.br"
                        value={newClinic.email}
                        onChange={(e) => setNC("email", e.target.value)}
                        className={inputClass()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Endereço</label>
                      <input
                        type="text"
                        placeholder="Rua, número, bairro"
                        value={newClinic.address}
                        onChange={(e) => setNC("address", e.target.value)}
                        className={inputClass()}
                      />
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Busca de clínica existente */}
            {clinicMode === "search" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar clínica por nome ou CNPJ..."
                  value={clinicSearch}
                  onChange={(e) => setClinicSearch(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border bg-background pl-9 pr-4 py-2.5 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    errors.clinic && "border-red-400"
                  )}
                />

                {filteredClinics.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border bg-card shadow-lg overflow-hidden">
                    {filteredClinics.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectExisting(c.id)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">{c.nome_fantasia ?? c.name}</div>
                        {c.cnpj && <div className="text-xs text-muted-foreground">{c.cnpj}</div>}
                      </button>
                    ))}
                  </div>
                )}

                {clinicSearch.trim() && filteredClinics.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border bg-card shadow-lg overflow-hidden">
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      Nenhuma clínica encontrada.
                    </div>
                    <button
                      type="button"
                      onClick={startCreating}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-primary border-t hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Criar nova clínica
                    </button>
                  </div>
                )}

                {!clinicSearch.trim() && clientes.length === 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={startCreating}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Criar nova clínica
                    </button>
                  </div>
                )}
              </div>
            )}

            <FieldError msg={errors.clinic} />
          </div>

          {/* ── Produto ──────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Produto</label>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value as ProductType)}
              className={cn(inputClass(!!errors.product))}
            >
              <option value="">Selecione um produto...</option>
              {products.map((p) => (
                <option key={p} value={p}>{productLabel[p]}</option>
              ))}
            </select>
            <FieldError msg={errors.product} />
          </div>

          {/* ── Valores ──────────────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Valor Mensal (R$)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0,00"
                value={valueMonthly}
                onChange={(e) => setValueMonthly(e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Setup (R$, opcional)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0,00"
                value={valueSetup}
                onChange={(e) => setValueSetup(e.target.value)}
                className={inputClass()}
              />
            </div>
          </div>

          {/* ── Meses de contrato ─────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Meses de Contrato</label>
            <input
              type="number" min="1"
              value={contractMonths}
              onChange={(e) => setContractMonths(e.target.value)}
              className={inputClass()}
            />
          </div>

          {/* ── Vendedor + Data ───────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Vendido por</label>
              <input
                type="text" placeholder="Nome do vendedor"
                value={soldBy}
                onChange={(e) => setSoldBy(e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Data da Venda</label>
              <input
                type="date"
                value={soldAt}
                onChange={(e) => setSoldAt(e.target.value)}
                className={inputClass(!!errors.soldAt)}
              />
              <FieldError msg={errors.soldAt} />
            </div>
          </div>

          {/* ── Origem ───────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Origem</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className={inputClass()}
            >
              {origins.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* ── Observações ───────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Observações (opcional)</label>
            <textarea
              rows={3}
              placeholder="Notas sobre a venda, condições especiais, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={cn(inputClass(), "resize-none")}
            />
          </div>

          {/* ── Ações ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/clientes"
              className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Registrar Venda
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {toast && (
        <Toast
          message="Venda registrada! Abrindo onboarding..."
          onClose={() => setToast(false)}
        />
      )}
    </AppShell>
  );
}
