// Orcamentos do lead (crm.budgets): valor, status, apresentado em.
// Somente leitura.
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { BUDGET_STATUS_LABELS, BUDGET_STATUS_TONE } from "../labels";
import { formatCurrency, formatDateTime } from "../utils";
import type { LeadBudgetRow } from "../types";

export function LeadBudgets({ rows }: { rows: LeadBudgetRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Orçamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum orçamento.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold tabular-nums">
                    {formatCurrency(b.total_amount, b.currency)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {b.presented_at
                      ? `Apresentado ${formatDateTime(b.presented_at)}`
                      : "Não apresentado"}
                  </div>
                </div>
                <StatusBadge tone={BUDGET_STATUS_TONE[b.status]}>
                  {BUDGET_STATUS_LABELS[b.status]}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
