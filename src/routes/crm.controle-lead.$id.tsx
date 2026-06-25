import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, User, History, Activity, FileText, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/crm/controle-lead/$id")({
  head: () => ({ meta: [{ title: "Controle de Lead — Detalhe" }] }),
  component: LeadDetail,
});

/** Bloco placeholder reutilizavel (conteudo real chega em incremento futuro). */
function PlaceholderCard({
  title,
  icon: Icon,
  hint,
  className,
}: {
  title: string;
  icon: typeof User;
  hint: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
          {hint}
        </div>
      </CardContent>
    </Card>
  );
}

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

        <header className="mt-4 mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Detalhe do Lead
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estrutura inicial (somente layout). Lead{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{id}</code>
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          <PlaceholderCard
            title="Paciente"
            icon={User}
            hint="Dados do paciente em breve"
            className="lg:row-span-2"
          />
          <PlaceholderCard
            title="Histórico de estágios"
            icon={History}
            hint="Linha do tempo do funil em breve"
            className="lg:col-span-2"
          />
          <PlaceholderCard
            title="Atividades"
            icon={Activity}
            hint="Registro de contatos em breve"
            className="lg:col-span-2"
          />
          <PlaceholderCard
            title="Orçamentos"
            icon={FileText}
            hint="Orçamentos vinculados em breve"
            className="lg:col-span-2 lg:col-start-2"
          />
          <PlaceholderCard
            title="Agendamentos"
            icon={CalendarDays}
            hint="Consultas e retornos em breve"
            className="lg:col-span-2 lg:col-start-2"
          />
        </div>
      </div>
    </AppShell>
  );
}
