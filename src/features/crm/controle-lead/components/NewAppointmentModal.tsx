// Modal "Novo agendamento" (S2-2A) — cria um agendamento em crm.appointments
// (somente INSERT, sob RLS). O banco define status='agendado'. NAO escreve
// current_stage nem campos derivados: a derivacao de estagio fica a cargo da
// trigger crm.fn_recalc_lead_stage. Sem campo de observacao (a tabela nao tem
// coluna de nota; nada de lead_activity neste incremento).
import { useEffect, useState } from "react";
import { CalendarPlus, AlertCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { combineDateTimeToISO } from "../utils";
import { useCreateAppointment, mapAppointmentError } from "../mutations";

type Props = {
  clinicId: string;
  leadId: string;
  patientId: string;
};

export function NewAppointmentModal({ clinicId, leadId, patientId }: Props) {
  const createAppointment = useCreateAppointment();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [professional, setProfessional] = useState("");
  const [procedure, setProcedure] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDate("");
      setTime("");
      setProfessional("");
      setProcedure("");
      setFormError(null);
    }
  }, [open]);

  function handleSave() {
    setFormError(null);
    if (!date || !time) {
      setFormError("Informe a data e a hora do agendamento.");
      return;
    }
    const scheduledAt = combineDateTimeToISO(date, time);
    if (!scheduledAt) {
      setFormError("Data ou hora inválida.");
      return;
    }
    createAppointment.mutate(
      {
        clinic_id: clinicId,
        lead_id: leadId,
        patient_id: patientId,
        scheduled_at: scheduledAt,
        professional_name: professional.trim() || null,
        procedure_name: procedure.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Agendamento criado.");
          setOpen(false);
        },
        onError: (e) => {
          const message = mapAppointmentError(e);
          setFormError(message);
          toast.error(message);
        },
      },
    );
  }

  const busy = createAppointment.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarPlus className="mr-1.5 h-4 w-4" />
          Novo agendamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>Agende uma consulta para este paciente.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ag-data">Data</Label>
              <Input
                id="ag-data"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ag-hora">Hora</Label>
              <Input
                id="ag-hora"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ag-prof">Profissional (opcional)</Label>
            <Input
              id="ag-prof"
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
              placeholder="Nome do profissional"
              disabled={busy}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ag-proc">Procedimento (opcional)</Label>
            <Input
              id="ag-proc"
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder="Ex.: avaliação, limpeza"
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
          <Button onClick={handleSave} disabled={busy}>
            {busy ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
