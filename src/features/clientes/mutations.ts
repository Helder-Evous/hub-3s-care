import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { onboardingTemplates } from "./onboarding-templates";
import type { ProductType } from "./types";

export interface RegisterSaleInput {
  clinic_id: string;
  product: ProductType;
  value_monthly?: number;
  value_setup?: number;
  contract_months: number;
  sold_by?: string;
  sold_at: string;
  origin: string;
  notes?: string;
}

export function useRegisterSale() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterSaleInput) => {
      // 1. Insert sale record
      const { data: sale, error: saleErr } = await supabase
        .from("sales")
        .insert({
          clinic_id: input.clinic_id,
          product: input.product,
          value_monthly: input.value_monthly ?? null,
          value_setup: input.value_setup ?? 0,
          contract_months: input.contract_months,
          sold_by: input.sold_by ?? null,
          sold_at: input.sold_at,
          origin: input.origin,
          notes: input.notes ?? null,
        })
        .select()
        .single();

      if (saleErr || !sale) throw saleErr ?? new Error("Falha ao registrar venda");

      // 2. Activate product for clinic (upsert handles repeated sale of same product)
      const { error: cpErr } = await supabase
        .from("clinic_products")
        .upsert(
          {
            clinic_id: input.clinic_id,
            product: input.product,
            sale_id: sale.id,
            active: true,
            started_at: new Date().toISOString(),
          },
          { onConflict: "clinic_id,product" }
        );

      if (cpErr) throw cpErr;

      // 3. Create onboarding — SLA calculated from total step hours (assuming 8h workday)
      const stepTemplates = onboardingTemplates[input.product];
      const totalWorkHours = stepTemplates.reduce((sum, s) => sum + s.sla_hours, 0);
      const slaDeadline = new Date();
      slaDeadline.setDate(slaDeadline.getDate() + Math.ceil(totalWorkHours / 8));

      const { data: onboarding, error: obErr } = await supabase
        .from("onboardings")
        .insert({
          clinic_id: input.clinic_id,
          sale_id: sale.id,
          product: input.product,
          status: "em_execucao",
          sla_deadline: slaDeadline.toISOString(),
        })
        .select()
        .single();

      if (obErr || !onboarding) throw obErr ?? new Error("Falha ao criar onboarding");

      // 4. Insert all steps from template; first step starts immediately
      const stepsPayload = stepTemplates.map((s) => ({
        onboarding_id: onboarding.id,
        step_key: s.step_key,
        title: s.title,
        description: s.description ?? null,
        status: s.order_index === 1 ? "em_andamento" : ("pendente" as const),
        order_index: s.order_index,
        sla_hours: s.sla_hours,
      }));

      const { error: stepsErr } = await supabase
        .from("onboarding_steps")
        .insert(stepsPayload);

      if (stepsErr) throw stepsErr;

      return { sale, onboarding };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["onboardings"] });
    },
  });
}

export function useMarkStepDone() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ stepId, onboardingId }: { stepId: string; onboardingId: string }) => {
      // Mark this step as concluded
      const { error: stepErr } = await supabase
        .from("onboarding_steps")
        .update({ status: "concluido", completed_at: new Date().toISOString() })
        .eq("id", stepId);

      if (stepErr) throw stepErr;

      // Find the next pending step (lowest order_index)
      const { data: pending } = await supabase
        .from("onboarding_steps")
        .select("id")
        .eq("onboarding_id", onboardingId)
        .eq("status", "pendente")
        .order("order_index")
        .limit(1);

      const nextStep = pending?.[0] ?? null;

      if (nextStep) {
        await supabase
          .from("onboarding_steps")
          .update({ status: "em_andamento", started_at: new Date().toISOString() })
          .eq("id", nextStep.id);
      } else {
        // All steps done — complete the onboarding
        await supabase
          .from("onboardings")
          .update({ status: "concluido", completed_at: new Date().toISOString() })
          .eq("id", onboardingId);
      }
    },
    onSuccess: (_, { onboardingId }) => {
      qc.invalidateQueries({ queryKey: ["onboardings"] });
      qc.invalidateQueries({ queryKey: ["onboardings", onboardingId] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}
