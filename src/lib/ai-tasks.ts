import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Tarefas de IA — priorização inteligente
// priority_score = impact_level × urgency_level
// confidence_score é nullable: nunca inventamos confiança fictícia quando não
// há uma IA real decidindo. Só é preenchido quando explicitamente informado.
// ─────────────────────────────────────────────────────────────────────────────

export type AiTaskType =
  | "coletar_dados_cliente"
  | "gerar_contrato"
  | "preparar_cobranca"
  | "notificar_responsavel"
  | "alertar_atraso_onboarding"
  | "analisar_evento"
  | "criar_campanha";

export type AiTaskPriority = "baixa" | "media" | "alta" | "critica";

/** Regras iniciais por task_type (heurística determinística, sem IA real). */
export interface TaskTypeRule {
  impact_level: number;   // 1..5
  urgency_level: number;  // 1..5
  requires_human: boolean;
  next_action: string;
}

export const TASK_TYPE_RULES: Record<AiTaskType, TaskTypeRule> = {
  coletar_dados_cliente: {
    impact_level: 3, urgency_level: 3, requires_human: false,
    next_action: "Coletar dados faltantes do cliente",
  },
  gerar_contrato: {
    impact_level: 5, urgency_level: 4, requires_human: true,
    next_action: "Gerar minuta e enviar para aprovação",
  },
  preparar_cobranca: {
    impact_level: 5, urgency_level: 5, requires_human: true,
    next_action: "Preparar cobrança para aprovação",
  },
  notificar_responsavel: {
    impact_level: 3, urgency_level: 2, requires_human: false,
    next_action: "Notificar responsável interno",
  },
  alertar_atraso_onboarding: {
    impact_level: 4, urgency_level: 4, requires_human: false,
    next_action: "Escalar atraso para responsável",
  },
  analisar_evento: {
    impact_level: 2, urgency_level: 2, requires_human: false,
    next_action: "Analisar evento e sugerir próximos passos",
  },
  criar_campanha: {
    impact_level: 4, urgency_level: 3, requires_human: true,
    next_action: "Gerar campanha e aguardar aprovação",
  },
};

/** priority_score = impact_level × urgency_level (faixa efetiva 1..25). */
export function calculateTaskPriority(impact_level: number, urgency_level: number): number {
  return impact_level * urgency_level;
}

/**
 * Mapeia um event_type do system_events para o(s) task_type(s) que ele deve
 * disparar. Base determinística para a geração automática de tarefas — um
 * agente IA real pode posteriormente refinar/expandir esse mapa.
 */
export const EVENT_TO_TASK_TYPES: Record<string, AiTaskType[]> = {
  cliente_criado:               ["coletar_dados_cliente"],
  produto_contratado:           ["gerar_contrato"],
  venda_registrada:             ["gerar_contrato", "preparar_cobranca"],
  onboarding_criado:            ["notificar_responsavel"],
  etapa_onboarding_iniciada:    ["analisar_evento"],
  etapa_onboarding_concluida:   ["analisar_evento"],
  onboarding_concluido:         ["preparar_cobranca"],
};

/** Mapeia o priority_score para o enum legível de prioridade. */
export function priorityScoreToLabel(score: number): AiTaskPriority {
  if (score >= 20) return "critica";
  if (score >= 12) return "alta";
  if (score >= 6)  return "media";
  return "baixa";
}

export interface CreateAiTaskInput {
  task_type: AiTaskType;
  title: string;
  description?: string;
  entity_type?: string;
  entity_id?: string;
  clinic_id?: string;
  onboarding_id?: string;
  sale_id?: string;
  source_event_type?: string;
  payload?: Record<string, unknown>;
  source?: string;
  /** Só preencher quando houver IA real decidindo. Caso contrário fica null. */
  confidence_score?: number;
  /** Overrides opcionais das regras padrão por task_type. */
  impact_level?: number;
  urgency_level?: number;
  requires_human?: boolean;
  next_action?: string;
}

/**
 * Cria uma tarefa de IA preenchendo impacto, urgência, priority_score,
 * requires_human e next_action a partir das regras do task_type
 * (com possibilidade de override). confidence_score só é gravado quando
 * explicitamente informado — caso contrário permanece null.
 *
 * Fire-and-forget: erros são logados, nunca propagados ao fluxo principal.
 */
export async function createAiTask(input: CreateAiTaskInput): Promise<void> {
  try {
    const rule = TASK_TYPE_RULES[input.task_type];

    const impact_level  = input.impact_level  ?? rule.impact_level;
    const urgency_level = input.urgency_level ?? rule.urgency_level;
    const priority_score = calculateTaskPriority(impact_level, urgency_level);
    const requires_human = input.requires_human ?? rule.requires_human;
    const next_action    = input.next_action    ?? rule.next_action;

    await supabase.from("ai_tasks" as never).insert({
      task_type:         input.task_type,
      title:             input.title,
      description:       input.description       ?? null,
      priority:          priorityScoreToLabel(priority_score),
      status:            "pendente",
      entity_type:       input.entity_type       ?? null,
      entity_id:         input.entity_id         ?? null,
      clinic_id:         input.clinic_id         ?? null,
      onboarding_id:     input.onboarding_id     ?? null,
      sale_id:           input.sale_id           ?? null,
      source:            input.source            ?? "agente_ia",
      source_event_type: input.source_event_type ?? null,
      payload:           input.payload           ?? null,
      impact_level,
      urgency_level,
      priority_score,
      requires_human,
      next_action,
      confidence_score:  input.confidence_score  ?? null,
    } as never);
  } catch (err) {
    console.warn("[ai_tasks] falha ao criar tarefa:", err);
  }
}
