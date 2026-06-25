import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Inbox } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useLeadsBoard } from "@/features/crm/controle-lead/queries";
import { LeadBoard } from "@/features/crm/controle-lead/components/LeadBoard";
import { NewLeadModal } from "@/features/crm/controle-lead/components/NewLeadModal";

export const Route = createFileRoute("/crm/controle-lead/")({
  head: () => ({ meta: [{ title: "Controle de Lead — Board" }] }),
  component: ControleLeadBoard,
});

function Header() {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Controle de Lead</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Board do funil clínico, agrupado por estágio. Arraste cartões para
          reorganizar — movimento apenas visual, ainda não é salvo.
        </p>
      </div>
      <NewLeadModal />
    </header>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[120rem] px-6 py-8">
        <Header />
        {children}
      </div>
    </AppShell>
  );
}

function ControleLeadBoard() {
  const { data: leads = [], isLoading, isError, refetch } = useLeadsBoard();

  if (isLoading) {
    return (
      <Shell>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 w-80 shrink-0 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell>
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-critical" />
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os leads.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </Shell>
    );
  }

  if (leads.length === 0) {
    return (
      <Shell>
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum lead encontrado para a sua clínica ainda.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <LeadBoard leads={leads} />
    </Shell>
  );
}
