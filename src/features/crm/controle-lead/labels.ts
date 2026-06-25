// Rotulos PT-BR e ordenacao do funil do Controle de Lead.
import type { LeadStage, SourceCategory } from "@/integrations/supabase/crm-types";

/** Tons aceitos pelo StatusBadge/StatusDot do projeto. */
export type BadgeTone = "success" | "warning" | "critical" | "muted" | "primary";

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

/**
 * Opcoes ESTATICAS de origem para o modal "Novo Lead" (sem consulta ao banco).
 * Espelham as origens canonicas do catalogo crm.lead_sources.
 */
export const SOURCE_OPTIONS: { key: string; label: string }[] = [
  { key: "meta_ads", label: "Meta (Ads)" },
  { key: "google_ads", label: "Google (Ads)" },
  { key: "indicacao", label: "Indicação" },
  { key: "projeto_escola", label: "Projeto Escola" },
  { key: "whatsapp_organico", label: "WhatsApp Orgânico" },
  { key: "instagram_organico", label: "Instagram Orgânico" },
  { key: "facebook_organico", label: "Facebook Orgânico" },
  { key: "site", label: "Site" },
  { key: "reativacao", label: "Reativação" },
  { key: "importacao", label: "Importação" },
  { key: "outros", label: "Outros" },
];
