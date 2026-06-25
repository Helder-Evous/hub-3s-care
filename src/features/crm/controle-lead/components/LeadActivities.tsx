// Atividades do lead (crm.lead_activities): tipo, descricao, criado em.
// Leitura + acao de registro (NewActivityModal). Sem edicao/exclusao.
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ACTIVITY_TYPE_LABELS } from "../labels";
import { formatDateTime } from "../utils";
import type { LeadActivityRow } from "../types";
import { NewActivityModal } from "./NewActivityModal";

type Props = {
  rows: LeadActivityRow[];
  clinicId: string;
  leadId: string;
  patientId: string;
};

export function LeadActivities({ rows, clinicId, leadId, patientId }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Atividades
        </CardTitle>
        <NewActivityModal
          clinicId={clinicId}
          leadId={leadId}
          patientId={patientId}
        />
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem atividades registradas.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <StatusBadge tone="muted">
                    {ACTIVITY_TYPE_LABELS[a.activity_type]}
                  </StatusBadge>
                  <p className="mt-1 text-sm text-foreground">
                    {a.summary ?? (
                      <span className="text-muted-foreground">Sem descrição</span>
                    )}
                  </p>
                </div>
                <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatDateTime(a.occurred_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
