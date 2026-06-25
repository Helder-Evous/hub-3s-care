// Modal "Nova atividade" — registra um contato/toque do CRC em crm.lead_activities
// (somente INSERT, sob RLS, performed_by = auth.uid()). NAO edita estagio nem
// campos derivados. Sem edicao/exclusao/anexos.
import { useEffect, useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/shared/hooks/use-auth";
import type { ActivityType } from "@/integrations/supabase/crm-types";
import { ACTIVITY_TYPE_OPTIONS } from "../labels";
import { useCreateLeadActivity, mapMutationError } from "../mutations";

type Props = {
  clinicId: string;
  leadId: string;
  patientId: string;
};

export function NewActivityModal({ clinicId, leadId, patientId }: Props) {
  const { user } = useAuth();
  const performedBy = user?.id ?? null;
  const createActivity = useCreateLeadActivity();

  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<string>("");
  const [obs, setObs] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTipo("");
      setObs("");
      setFormError(null);
    }
  }, [open]);

  function handleSave() {
    setFormError(null);
    if (!tipo) {
      setFormError("Selecione o tipo da atividade.");
      return;
    }
    if (!performedBy) {
      setFormError("Sessão não identificada. Faça login novamente.");
      return;
    }
    createActivity.mutate(
      {
        clinic_id: clinicId,
        lead_id: leadId,
        patient_id: patientId,
        performed_by: performedBy,
        activity_type: tipo as ActivityType,
        summary: obs.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Atividade registrada.");
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

  const busy = createActivity.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-4 w-4" />
          Nova atividade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova atividade</DialogTitle>
          <DialogDescription>
            Registre um contato realizado com o paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="na-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo} disabled={busy}>
              <SelectTrigger id="na-tipo">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="na-obs">Observação</Label>
            <Textarea
              id="na-obs"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="O que aconteceu neste contato? (opcional)"
              rows={4}
              disabled={busy}
            />
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
          <Button onClick={handleSave} disabled={busy || !performedBy}>
            {busy ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
