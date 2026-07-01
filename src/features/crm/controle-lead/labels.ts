// Rotulos PT-BR e ordenacao do funil do Controle de Lead.
import type {
  LeadStage,
  SourceCategory,
  ActivityType,
  AppointmentStatus,
  BudgetStatus,
} from "@/integrations/supabase/crm-types";
import type { LeadOperationalColumn } from "./operational-state";

/** Tons aceitos pelo StatusBadge/StatusDot do projeto. */
export type BadgeTone = "success" | "warning" | "critical" | "muted" | "primary";

/**
 * Ordem das colunas OPERACIONAIS do board da 3S (mesa do CRC, ver ADR-0003).
 * `Efetivou` NAO e coluna (efetivacao = indicador posterior). `em_avaliacao`,
 * `orcamento` e `pos_venda` continuam no enum `lead_stage`, mas NAO aparecem no
 * board. `perdido` e a coluna terminal lateral, ao final.
 */
export const OPERATIONAL_COLUMN_ORDER: LeadOperationalColumn[] = [
  "novo",
  "agendado",
  "remarcar",
  "compareceu",
  "perdido",
];

export const OPERATIONAL_COLUMN_LABELS: Record<LeadOperationalColumn, string> = {
  novo: "Novo Lead",
  agendado: "Agendado",
  remarcar: "Remarcar",
  compareceu: "Compareceu",
  perdido: "Perdido",
};

export const OPERATIONAL_COLUMN_TONE: Record<LeadOperationalColumn, BadgeTone> = {
  novo: "muted",
  agendado: "primary",
  remarcar: "warning",
  compareceu: "primary",
  perdido: "critical",
};

/**
 * Proxima acao operacional sugerida por coluna (Painel Operacional do CRC).
 * E o texto em destaque do card: responde "o que eu devo fazer agora?".
 */
export const OPERATIONAL_NEXT_ACTION: Record<LeadOperationalColumn, string> = {
  novo: "Fazer primeiro contato",
  agendado: "Confirmar presença",
  remarcar: "Remarcar consulta",
  compareceu: "Operação encerrada",
  perdido: "Sem ação",
};

/**
 * Cores do card por coluna operacional (barra lateral + ponto de status).
 * Novo=azul, Agendado=amarelo, Remarcar=laranja, Compareceu=verde, Perdido=vermelho.
 * Classes estaticas (nao concatenadas) para o JIT do Tailwind detectar.
 */
export const OPERATIONAL_COLUMN_ACCENT: Record<
  LeadOperationalColumn,
  { bar: string; dot: string; text: string }
> = {
  novo: { bar: "bg-blue-500", dot: "bg-blue-500", text: "text-blue-600" },
  agendado: { bar: "bg-amber-500", dot: "bg-amber-500", text: "text-amber-600" },
  remarcar: { bar: "bg-orange-500", dot: "bg-orange-500", text: "text-orange-600" },
  compareceu: { bar: "bg-green-500", dot: "bg-green-500", text: "text-green-600" },
  perdido: { bar: "bg-red-500", dot: "bg-red-500", text: "text-red-600" },
};

/**
 * Ordem canonica das colunas do funil (sem `perdido`, que e tratado a parte
 * como coluna lateral terminal). No MVP, `em_avaliacao`/`efetivado`/`pos_venda`
 * costumam ficar vazios (dependem de etapas futuras).
 */
export const LEAD_STAGE_ORDER: LeadStage[] = [
  "novo",
  "agendado",
  "compareceu",
  "em_avaliacao",
  "orcamento",
  "efetivado",
  "pos_venda",
];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  novo: "Novo",
  agendado: "Agendado",
  compareceu: "Compareceu",
  em_avaliacao: "Em avaliação",
  orcamento: "Orçamento",
  efetivado: "Efetivado",
  pos_venda: "Pós-venda",
  perdido: "Perdido",
};

/** Tom do badge de origem conforme a categoria. */
export const SOURCE_CATEGORY_TONE: Record<SourceCategory, BadgeTone> = {
  paga: "primary",
  organica: "success",
  interna: "warning",
  importacao: "muted",
  sistema: "muted",
};

/** Tom do badge por estagio (cabecalho/detalhe). */
export const LEAD_STAGE_TONE: Record<LeadStage, BadgeTone> = {
  novo: "muted",
  agendado: "primary",
  compareceu: "primary",
  em_avaliacao: "primary",
  orcamento: "warning",
  efetivado: "success",
  pos_venda: "success",
  perdido: "critical",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  nota: "Nota",
  visita: "Visita",
  email: "E-mail",
  outro: "Outro",
};

/** Opcoes ordenadas para o seletor de tipo no modal "Nova atividade". */
export const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "ligacao", label: "Ligação" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "visita", label: "Visita" },
  { value: "nota", label: "Nota" },
  { value: "outro", label: "Outro" },
];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  remarcado: "Remarcado",
  compareceu: "Compareceu",
  faltou: "Faltou",
  cancelado: "Cancelado",
};

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, BadgeTone> = {
  agendado: "primary",
  confirmado: "primary",
  remarcado: "warning",
  compareceu: "success",
  faltou: "critical",
  cancelado: "muted",
};

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  rascunho: "Rascunho",
  emitido: "Emitido",
  aceito: "Aceito",
  rejeitado: "Rejeitado",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

export const BUDGET_STATUS_TONE: Record<BudgetStatus, BadgeTone> = {
  rascunho: "muted",
  emitido: "primary",
  aceito: "success",
  rejeitado: "critical",
  expirado: "warning",
  cancelado: "muted",
};
