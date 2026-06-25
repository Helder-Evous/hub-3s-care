// Container do detalhe do lead: 1 query agregada (sob RLS) + estados
// (loading/erro/nao-encontrado) + composicao das secoes. Mantem a rota fina.
import { AlertTriangle, SearchX } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useLeadDetail } from "../queries";
import { LeadDetailHeader } from "./LeadDetailHeader";
import { LeadStageHistory } from "./LeadStageHistory";
import { LeadActivities } from "./LeadActivities";
import { LeadAppointments } from "./LeadAppointments";
import { LeadBudgets } from "./LeadBudgets";

export function LeadDetailView({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useLeadDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-8 w-8 text-critical" />
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar o lead.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
        <SearchX className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Lead não encontrado (ou sem acesso).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LeadDetailHeader lead={data} />
      <div className="grid gap-4 lg:grid-cols-2">
        <LeadStageHistory rows={data.history} />
        <LeadActivities
          rows={data.activities}
          clinicId={data.clinic_id}
          leadId={data.id}
          patientId={data.patient_id}
        />
        <LeadAppointments rows={data.appointments} />
        <LeadBudgets rows={data.budgets} />
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
