// Agendamentos do lead (crm.appointments): data, status, compareceu.
// Somente leitura.
import { CalendarDays, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_TONE } from "../labels";
import { formatDateTime } from "../utils";
import type { LeadAppointmentRow } from "../types";

export function LeadAppointments({ rows }: { rows: LeadAppointmentRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Agendamentos
        </CardTitle>
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
