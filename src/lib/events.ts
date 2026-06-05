import { supabase } from "@/integrations/supabase/client";

export type SystemEventType =
  | "cliente_criado"
  | "produto_contratado"
  | "venda_registrada"
  | "onboarding_criado"
  | "etapa_onboarding_iniciada"
  | "etapa_onboarding_concluida"
  | "onboarding_concluido";

export interface RecordEventInput {
  event_type: SystemEventType;
  entity_type?: string;
  entity_id?: string;
  clinic_id?: string;
  onboarding_id?: string;
  sale_id?: string;
  payload?: Record<string, unknown>;
  source?: string;
}

/**
 * Registra um evento no log do sistema para consumo futuro por agentes IA.
 * Fire-and-forget: erros são logados mas nunca propagados ao fluxo principal.
 */
export async function recordSystemEvent(input: RecordEventInput): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("system_events").insert({
      event_type:    input.event_type,
      entity_type:   input.entity_type   ?? null,
      entity_id:     input.entity_id     ?? null,
      clinic_id:     input.clinic_id     ?? null,
      onboarding_id: input.onboarding_id ?? null,
      sale_id:       input.sale_id       ?? null,
      user_id:       user?.id            ?? null,
      source:        input.source        ?? "app",
      payload:       input.payload       ?? null,
    });
  } catch (err) {
    console.warn("[system_events] falha ao registrar evento:", err);
  }
}
