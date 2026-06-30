// Agendamentos do lead (crm.appointments): data, status, compareceu.
// Leitura + acao de criacao (NewAppointmentModal, S2-2A). Sem editar/remarcar
// /confirmar/cancelar (esses fluxos ficam para S2-2B).
import { CalendarDays, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_TONE } from "../labels";
import { formatDateTime } from "../utils";
import type { LeadAppointmentRow } from "../types";
import { NewAppointmentModal } from "./NewAppointmentModal";

type Props = {
  rows: LeadAppointmentRow[];
  clinicId: string;
  leadId: string;
  patientId: string;
  /** Quando o lead esta perdido (`lost_at` preenchido), nao permite agendar. */
  isLost: boolean;
};

export function LeadAppointments({ rows, clinicId, leadId, patientId, isLost }: Props) {
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
          <ul className="space-y-3">
            {rows.map((ap) => (
              <li key={ap.id} className="flex items-center justify-between gap-3">
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
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
