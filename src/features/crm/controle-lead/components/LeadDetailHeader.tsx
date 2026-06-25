// Cabecalho do detalhe do lead: paciente, telefone, origem, estagio, responsavel,
// criado em. Somente leitura.
import { Phone, User, CalendarDays, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import {
  LEAD_STAGE_LABELS,
  LEAD_STAGE_TONE,
  SOURCE_CATEGORY_TONE,
} from "../labels";
import { formatDateTime } from "../utils";
import type { LeadDetailData } from "../types";

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export function LeadDetailHeader({ lead }: { lead: LeadDetailData }) {
  const p = lead.patient;
  const responsavel =
    lead.owner_name ?? (lead.owner_id ? "Atribuído" : "Sem responsável");

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {p?.full_name ?? "—"}
            </h1>
            <div className="mt-1 flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {p?.phone ?? "—"}
            </div>
          </div>
          <StatusBadge tone={LEAD_STAGE_TONE[lead.current_stage]}>
            {LEAD_STAGE_LABELS[lead.current_stage]}
          </StatusBadge>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field icon={Tag} label="Origem">
            {lead.source ? (
              <StatusBadge tone={SOURCE_CATEGORY_TONE[lead.source.category]}>
                {lead.source.label}
              </StatusBadge>
            ) : (
              "—"
            )}
          </Field>
          <Field icon={User} label="Responsável">
            {responsavel}
          </Field>
          <Field icon={CalendarDays} label="Criado em">
            {formatDateTime(lead.created_at)}
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
