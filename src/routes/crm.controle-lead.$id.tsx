import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LeadDetailView } from "@/features/crm/controle-lead/components/LeadDetailView";

export const Route = createFileRoute("/crm/controle-lead/$id")({
  head: () => ({ meta: [{ title: "Controle de Lead — Detalhe" }] }),
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = Route.useParams();

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <Link
          to="/crm/controle-lead"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao board
        </Link>

        <div className="mt-4">
          <LeadDetailView id={id} />
        </div>
      </div>
    </AppShell>
  );
}
