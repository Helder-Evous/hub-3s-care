// Historico de transicoes de estagio (crm.lead_stage_history), mais recente
// primeiro. Somente leitura.
import { History, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAD_STAGE_LABELS } from "../labels";
import { formatDateTime } from "../utils";
import type { LeadStageHistoryRow } from "../types";

export function LeadStageHistory({ rows }: { rows: LeadStageHistoryRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-muted-foreground" />
          Histórico do lead
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem mudanças de estágio registradas.
          </p>
        ) : (
          <ol className="space-y-3">
            {rows.map((h) => (
              <li
                key={h.id}
                className="flex items-start justify-between gap-3 border-l-2 border-muted pl-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="text-muted-foreground">
                      {h.from_stage ? LEAD_STAGE_LABELS[h.from_stage] : "Início"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{LEAD_STAGE_LABELS[h.to_stage]}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {h.source_table ? `via ${h.source_table}` : "manual"}
                    {" · "}
                    {h.changed_by ? "por usuário" : "pelo sistema"}
                  </div>
                </div>
                <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatDateTime(h.changed_at)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
