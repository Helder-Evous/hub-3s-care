// Modal "Novo Lead" — fluxo REAL: valida -> dedup de paciente por telefone ->
// cria paciente (se preciso) -> cria lead -> invalida board -> toast.
// Usa a autenticacao normal do operador (RLS). NUNCA service_role.
import { useEffect, useState } from "react";
import { PlusCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/shared/hooks/use-auth";
import { useLeadSources, useEligibleClinics } from "../queries";
import { useCreateLead, mapMutationError, normalizePhoneBR } from "../mutations";

export function NewLeadModal() {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;
  const ownerName =
    user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Você";

  const { data: sources = [], isLoading: loadingSources } = useLeadSources();
  const { data: clinics = [], isLoading: loadingClinics } = useEligibleClinics();
  const createLead = useCreateLead();

  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Clinica efetiva: unica (silenciosa) ou a escolhida quando ha mais de uma.
  const effectiveClinic = clinics.length === 1 ? clinics[0] : clinicId;

  // Limpa o formulario ao fechar.
  useEffect(() => {
    if (!open) {
      setNome("");
      setTelefone("");
      setSourceId("");
      setClinicId("");
      setFormError(null);
    }
  }, [open]);

  function validate(): string | null {
    if (nome.trim().length < 2) return "Informe o nome do paciente.";
    if (!normalizePhoneBR(telefone)) return "Telefone inválido.";
    if (!effectiveClinic) {
      return clinics.length === 0
        ? "Você não tem clínica habilitada para criar leads."
        : "Selecione a clínica.";
    }
    return null;
  }

  function handleSave() {
    setFormError(null);
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    createLead.mutate(
      {
        clinic_id: effectiveClinic,
        full_name: nome.trim(),
        phone: telefone.trim(),
        source_id: sourceId || null,
        owner_id: ownerId,
      },
      {
        onSuccess: (res) => {
          toast.success(
            res.reusedPatient
              ? "Lead criado (paciente existente reaproveitado)."
              : "Lead criado com sucesso.",
          );
          setOpen(false);
        },
        onError: (e) => {
          const message = mapMutationError(e);
          setFormError(message);
          toast.error(message);
        },
      },
    );
  }

  const busy = createLead.isPending;
  const depsLoading = loadingSources || loadingClinics;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Cadastro do lead na sua clínica. Pacientes são deduplicados por
            telefone.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="nl-nome">Nome</Label>
            <Input
              id="nl-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do paciente"
              disabled={busy}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="nl-telefone">Telefone</Label>
            <Input
              id="nl-telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              disabled={busy}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="nl-origem">Origem</Label>
            <Select
              value={sourceId}
              onValueChange={setSourceId}
              disabled={busy || depsLoading}
            >
              <SelectTrigger id="nl-origem">
                <SelectValue
                  placeholder={
                    loadingSources ? "Carregando..." : "Selecione a origem (opcional)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {clinics.length > 1 && (
            <div className="grid gap-1.5">
              <Label htmlFor="nl-clinica">Clínica</Label>
              <Select value={clinicId} onValueChange={setClinicId} disabled={busy}>
                <SelectTrigger id="nl-clinica">
                  <SelectValue placeholder="Selecione a clínica" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="nl-responsavel">Responsável</Label>
            <Input id="nl-responsavel" value={ownerName} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              O lead será atribuído a você.
            </p>
          </div>

          {formError && (
            <p className="flex items-center gap-1.5 text-sm text-critical">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={busy || depsLoading}>
            {busy ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
