// Agendamentos do lead (crm.appointments): data, status, comparecimento.
// Leitura + acoes (S2-2A criacao; S2-2B operacao): confirmar, compareceu, faltou,
// cancelar e remarcar. As acoes fazem UPDATE de status (+ campo temporal) ou, na
// remarcacao, criam um novo appointment; a projecao operacional (S2-0) move o board.
import { useState } from "react";
import { CalendarDays, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_TONE } from "../labels";
import { formatDateTime } from "../utils";
import { useUpdateAppointmentStatus, mapAppointmentError } from "../mutations";
import type { AppointmentAction } from "../mutations";
import type { LeadAppointmentRow } from "../types";
import type { AppointmentStatus } from "@/integrations/supabase/crm-types";
import { NewAppointmentModal } from "./NewAppointmentModal";
import { RescheduleAppointmentModal } from "./RescheduleAppointmentModal";

type Props = {
  rows: LeadAppointmentRow[];
  clinicId: string;
  leadId: string;
  patientId: string;
  /** Quando o lead esta perdido (`lost_at` preenchido), nao permite operar. */
  isLost: boolean;
};

const ACTION_LABEL: Record<AppointmentAction, string> = {
  confirmar: "Confirmar",
  compareceu: "Compareceu",
  faltou: "Faltou",
  cancelar: "Cancelar",
};

/** Acoes validas por status (maquina de estados S2-2B). */
function actionsForStatus(status: AppointmentStatus): AppointmentAction[] {
  if (status === "agendado") return ["confirmar", "compareceu", "faltou", "cancelar"];
  if (status === "confirmado") return ["compareceu", "faltou", "cancelar"];
  return []; // remarcado/compareceu/faltou/cancelado = terminais
}
const canReschedule = (status: AppointmentStatus) =>
  status === "agendado" || status === "confirmado";

export function LeadAppointments({ rows, clinicId, leadId, patientId, isLost }: Props) {
  const updateStatus = useUpdateAppointmentStatus();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function runAction(id: string, action: AppointmentAction) {
    setPendingId(id);
    updateStatus.mutate(
      { id, action },
      {
        onSuccess: () => toast.success(`Agendamento: ${ACTION_LABEL[action].toLowerCase()}.`),
        onError: (e) => toast.error(mapAppointmentError(e)),
        onSettled: () => setPendingId(null),
      },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Agendamentos
        </CardTitle>
        {!isLost && (
          <NewAppointmentModal clinicId={clinicId} leadId={leadId} patientId={patientId} />
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum agendamento.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((ap) => {
              const actions = isLost ? [] : actionsForStatus(ap.status);
              const showReschedule = !isLost && canReschedule(ap.status);
              const busy = pendingId === ap.id && updateStatus.isPending;
              return (
                <li key={ap.id} className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium tabular-nums">
                        {formatDateTime(ap.scheduled_at)}
                      </div>
                      {ap.attended_at && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-success">
                          <Check className="h-3 w-3" />
                          Compareceu em {formatDateTime(ap.attended_at)}
                        </div>
                      )}
                    </div>
                    <StatusBadge tone={APPOINTMENT_STATUS_TONE[ap.status]}>
                      {APPOINTMENT_STATUS_LABELS[ap.status]}
                    </StatusBadge>
                  </div>

                  {(actions.length > 0 || showReschedule) && (
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <Button
                          key={action}
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => runAction(ap.id, action)}
                        >
                          {ACTION_LABEL[action]}
                        </Button>
                      ))}
                      {showReschedule && (
                        <RescheduleAppointmentModal
                          oldId={ap.id}
                          clinicId={clinicId}
                          leadId={leadId}
                          patientId={patientId}
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
