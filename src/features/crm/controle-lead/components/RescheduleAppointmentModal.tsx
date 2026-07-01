// Modal "Remarcar" (S2-2B) — cria um NOVO agendamento vinculado ao antigo
// (rescheduled_from) e marca o antigo como 'remarcado'. Nao altera a data do
// antigo nem seu scheduled_by. O novo appointment nasce 'agendado' com
// scheduled_by = auth.uid() (quem remarcou). Ver ADR-0004.
import { useEffect, useState } from "react";
import { CalendarClock, AlertCircle } from "lucide-react";
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
import { useRescheduleAppointment, mapAppointmentError } from "../mutations";

type Props = {
  oldId: string;
  clinicId: string;
  leadId: string;
  patientId: string;
};

export function RescheduleAppointmentModal({ oldId, clinicId, leadId, patientId }: Props) {
  const reschedule = useRescheduleAppointment();

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
      setFormError("Informe a nova data e hora.");
      return;
    }
    const scheduledAt = combineDateTimeToISO(date, time);
    if (!scheduledAt) {
      setFormError("Data ou hora inválida.");
      return;
    }
    reschedule.mutate(
      {
        old_id: oldId,
        clinic_id: clinicId,
        lead_id: leadId,
        patient_id: patientId,
        scheduled_at: scheduledAt,
        professional_name: professional.trim() || null,
        procedure_name: procedure.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Agendamento remarcado.");
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

  const busy = reschedule.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
          Remarcar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remarcar agendamento</DialogTitle>
          <DialogDescription>
            Cria um novo agendamento e marca o atual como remarcado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rm-data">Nova data</Label>
              <Input
                id="rm-data"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rm-hora">Nova hora</Label>
              <Input
                id="rm-hora"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="rm-prof">Profissional (opcional)</Label>
            <Input
              id="rm-prof"
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
              placeholder="Nome do profissional"
              disabled={busy}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="rm-proc">Procedimento (opcional)</Label>
            <Input
              id="rm-proc"
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
            {busy ? "Salvando..." : "Remarcar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
