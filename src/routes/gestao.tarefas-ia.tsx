import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  BrainCircuit, CheckCircle2, XCircle, Clock, AlertTriangle,
  Loader2, RefreshCw, ChevronDown, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/gestao/tarefas-ia")({
  head: () => ({ meta: [{ title: "Tarefas de IA — Hub 3S" }] }),
  component: TarefasIAPage,
});

// ─── tipos ────────────────────────────────────────────────────────────────────
type TaskStatus   = "pendente" | "em_revisao" | "aprovada" | "rejeitada" | "executando" | "concluida" | "falhou";
type TaskPriority = "baixa" | "media" | "alta" | "critica";
type TabFilter    = "todas" | TaskStatus;

interface AiTask {
  id: string;
  created_at: string;
  task_type: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  entity_type: string | null;
  source: string;
  auto_executable: boolean;
  error_message: string | null;
  clinics: { name: string } | null;
}

// ─── constantes de exibição ────────────────────────────────────────────────────
const STATUS_LABEL: Record<TaskStatus, string> = {
  pendente:    "Pendente",
  em_revisao:  "Em revisão",
  aprovada:    "Aprovada",
  rejeitada:   "Rejeitada",
  executando:  "Executando",
  concluida:   "Concluída",
  falhou:      "Falhou",
};

const STATUS_CLASS: Record<TaskStatus, string> = {
  pendente:    "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  em_revisao:  "bg-blue-500/10   text-blue-600   border-blue-500/20",
  aprovada:    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejeitada:   "bg-red-500/10    text-red-600    border-red-500/20",
  executando:  "bg-purple-500/10 text-purple-600 border-purple-500/20",
  concluida:   "bg-teal-500/10   text-teal-600   border-teal-500/20",
  falhou:      "bg-destructive/10 text-destructive border-destructive/20",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  baixa:   "Baixa",
  media:   "Média",
  alta:    "Alta",
  critica: "Crítica",
};

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  baixa:   "bg-muted text-muted-foreground border-border",
  media:   "bg-blue-500/10  text-blue-600  border-blue-500/20",
  alta:    "bg-orange-500/10 text-orange-600 border-orange-500/20",
  critica: "bg-red-500/10   text-red-600   border-red-500/20",
};

const TABS: { key: TabFilter; label: string }[] = [
  { key: "todas",     label: "Todas"      },
  { key: "pendente",  label: "Pendentes"  },
  { key: "aprovada",  label: "Aprovadas"  },
  { key: "concluida", label: "Concluídas" },
  { key: "falhou",    label: "Falhas"     },
  { key: "rejeitada", label: "Rejeitadas" },
];

// ─── query ────────────────────────────────────────────────────────────────────
function useAiTasks() {
  return useQuery({
    queryKey: ["ai_tasks"],
    queryFn: async (): Promise<AiTask[]> => {
      const { data, error } = await supabase
        .from("ai_tasks" as never)
        .select(`
          id, created_at, task_type, title, description,
          priority, status, entity_type, source, auto_executable, error_message,
          clinics:clinic_id ( name )
        `)
        .order("created_at", { ascending: false })
        .limit(300);

      // tabela ainda não existe → trata como lista vazia
      if (error) {
        if ((error as { code?: string }).code === "42P01") return [];
        throw error;
      }
      return (data ?? []) as AiTask[];
    },
    refetchInterval: 30_000,
  });
}

// ─── mutations ────────────────────────────────────────────────────────────────
function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase
        .from("ai_tasks" as never)
        .update({ status, reviewed_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_tasks"] }),
  });
}

// ─── subcomponents ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
      STATUS_CLASS[status],
    )}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
      PRIORITY_CLASS[priority],
    )}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

function StatCard({
  label, value, sub, accent,
}: { label: string; value: number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", accent ?? "text-foreground")}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ExpandableRow({ task, onApprove, onReject, updating }: {
  task: AiTask;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  updating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const clinic = (task.clinics as { name?: string } | null)?.name ?? "—";
  const isPending = task.status === "pendente" || task.status === "em_revisao";

  return (
    <>
      <tr
        className="hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-4 py-3 w-6">
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={task.status} />
        </td>
        <td className="px-4 py-3">
          <PriorityBadge priority={task.priority} />
        </td>
        <td className="px-4 py-3 font-medium text-foreground max-w-[240px] truncate">
          {task.title}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{clinic}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5">{task.task_type}</span>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
          {new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit", month: "2-digit",
            hour: "2-digit", minute: "2-digit",
          }).format(new Date(task.created_at))}
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          {isPending && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={updating}
                onClick={() => onApprove(task.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium",
                  "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                  "hover:bg-emerald-500/20 transition-colors disabled:opacity-50",
                )}
              >
                {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Aprovar
              </button>
              <button
                disabled={updating}
                onClick={() => onReject(task.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium",
                  "bg-red-500/10 text-red-600 border border-red-500/20",
                  "hover:bg-red-500/20 transition-colors disabled:opacity-50",
                )}
              >
                <XCircle className="h-3 w-3" />
                Rejeitar
              </button>
            </div>
          )}
          {task.status === "concluida" && (
            <span className="inline-flex items-center gap-1 text-xs text-teal-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Concluída
            </span>
          )}
          {task.status === "falhou" && (
            <span className="inline-flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" /> Falha
            </span>
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-muted/10 border-t border-dashed">
          <td colSpan={8} className="px-8 py-3">
            <div className="flex flex-col gap-1.5 text-sm">
              {task.description && (
                <p className="text-foreground">{task.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                {task.entity_type && <span>Entidade: <strong>{task.entity_type}</strong></span>}
                <span>Origem: <strong>{task.source}</strong></span>
                <span>Auto-executável: <strong>{task.auto_executable ? "Sim" : "Não"}</strong></span>
                {task.error_message && (
                  <span className="text-destructive">Erro: {task.error_message}</span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── página ───────────────────────────────────────────────────────────────────
export default function TarefasIAPage() {
  const [tab, setTab] = useState<TabFilter>("todas");
  const { data: tasks = [], isLoading, error, refetch, isFetching } = useAiTasks();
  const { mutate: updateStatus, isPending: updating } = useUpdateTaskStatus();

  const filtered = tab === "todas" ? tasks : tasks.filter((t) => t.status === tab);

  const counts = {
    pendente:  tasks.filter((t) => t.status === "pendente" || t.status === "em_revisao").length,
    critica:   tasks.filter((t) => t.priority === "critica" && t.status === "pendente").length,
    concluida: tasks.filter((t) => t.status === "concluida").length,
    falhou:    tasks.filter((t) => t.status === "falhou").length,
  };

  function approve(id: string) { updateStatus({ id, status: "aprovada" }); }
  function reject(id: string)  { updateStatus({ id, status: "rejeitada" }); }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── cabeçalho ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Tarefas de IA</h1>
            <p className="text-sm text-muted-foreground">
              Fila de tarefas propostas por agentes — supervisão e aprovação humana
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {/* ── stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Aguardando revisão" value={counts.pendente}
          accent={counts.pendente > 0 ? "text-yellow-600" : undefined}
          sub={counts.pendente > 0 ? "requerem ação" : "nenhuma pendente"} />
        <StatCard label="Prioridade crítica" value={counts.critica}
          accent={counts.critica > 0 ? "text-red-600" : undefined}
          sub="pendentes críticas" />
        <StatCard label="Concluídas" value={counts.concluida}
          accent="text-teal-600" sub="executadas com sucesso" />
        <StatCard label="Com falha" value={counts.falhou}
          accent={counts.falhou > 0 ? "text-destructive" : undefined}
          sub="precisam de revisão" />
      </div>

      {/* ── tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b">
        {TABS.map(({ key, label }) => {
          const count = key === "todas" ? tasks.length
            : tasks.filter((t) => t.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                tab === key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              {count > 0 && (
                <span className={cn(
                  "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium",
                  tab === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── estados ───────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando tarefas…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Erro ao carregar tarefas: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && tasks.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <BrainCircuit className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">Nenhuma tarefa de IA ainda</p>
          <p className="mt-1 text-xs">
            Quando agentes criarem tarefas, elas aparecerão aqui para revisão e aprovação.
          </p>
        </div>
      )}

      {!isLoading && !error && tasks.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <Clock className="mx-auto mb-2 h-6 w-6 opacity-30" />
          <p className="text-sm">Nenhuma tarefa com status "{TABS.find(t => t.key === tab)?.label}"</p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 w-6" />
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Prioridade</th>
                  <th className="px-4 py-3 font-medium">Tarefa</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Criada em</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((task) => (
                  <ExpandableRow
                    key={task.id}
                    task={task}
                    onApprove={approve}
                    onReject={reject}
                    updating={updating}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            {filtered.length} tarefa{filtered.length !== 1 ? "s" : ""}
            {tab !== "todas" && ` · ${tasks.length} no total`}
          </div>
        </div>
      )}
    </div>
  );
}
