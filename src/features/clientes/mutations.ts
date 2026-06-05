import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { recordSystemEvent } from "@/lib/events";
import { onboardingTemplates } from "./onboarding-templates";
import type { ProductType } from "./types";

export interface NewClinicData {
  name: string;
  responsible: string;
  phone: string;
  city: string;
  state: string;
  cnpj?: string;
  razao_social?: string;
  email?: string;
  address?: string;
}

export interface RegisterSaleInput {
  /** UUID de clínica existente. Mutuamente exclusivo com newClinic. */
  clinic_id?: string;
  /** Dados para criar nova clínica antes de registrar a venda. */
  newClinic?: NewClinicData;
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
      // 0. Criar clínica se não existir ainda
      let clinicId = input.clinic_id;
      if (!clinicId) {
        if (!input.newClinic) throw new Error("Clínica não identificada");

        const { data: created, error: clinicErr } = await supabase
          .from("clinics")
          .insert({
            name: input.newClinic.name,
            responsible: input.newClinic.responsible || null,
            phone: input.newClinic.phone || null,
            city: input.newClinic.city || null,
            state: input.newClinic.state || null,
            cnpj: input.newClinic.cnpj || null,
            razao_social: input.newClinic.razao_social || null,
            email: input.newClinic.email || null,
            address: input.newClinic.address || null,
            status: "ativa",
          })
          .select()
          .single();

        if (clinicErr || !created) throw clinicErr ?? new Error("Falha ao criar clínica");
        clinicId = created.id;

        void recordSystemEvent({
          event_type: "cliente_criado",
          entity_type: "clinic",
          entity_id: clinicId,
          clinic_id: clinicId,
          payload: { name: created.name },
        });
      }

      // 1. Registrar venda
      const { data: sale, error: saleErr } = await supabase
        .from("sales")
        .insert({
          clinic_id: clinicId,
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

      void recordSystemEvent({
        event_type: "venda_registrada",
        entity_type: "sale",
        entity_id: sale.id,
        clinic_id: clinicId,
        sale_id: sale.id,
        payload: { product: input.product, value_monthly: input.value_monthly },
      });

      // 2. Ativar produto para a clínica
      const { error: cpErr } = await supabase
        .from("clinic_products")
        .upsert(
          {
            clinic_id: clinicId,
            product: input.product,
            sale_id: sale.id,
            active: true,
            started_at: new Date().toISOString(),
          },
          { onConflict: "clinic_id,product" }
        );

      if (cpErr) throw cpErr;

      void recordSystemEvent({
        event_type: "produto_contratado",
        entity_type: "clinic_product",
        entity_id: clinicId,
        clinic_id: clinicId,
        sale_id: sale.id,
        payload: { product: input.product },
      });

      // 3. Criar onboarding — SLA calculado via horas totais dos steps (base 8h/dia)
      const stepTemplates = onboardingTemplates[input.product];
      const totalWorkHours = stepTemplates.reduce((sum, s) => sum + s.sla_hours, 0);
      const slaDeadline = new Date();
      slaDeadline.setDate(slaDeadline.getDate() + Math.ceil(totalWorkHours / 8));

      const { data: onboarding, error: obErr } = await supabase
        .from("onboardings")
        .insert({
          clinic_id: clinicId,
          sale_id: sale.id,
          product: input.product,
          status: "em_execucao",
          sla_deadline: slaDeadline.toISOString(),
        })
        .select()
        .single();

      if (obErr || !onboarding) throw obErr ?? new Error("Falha ao criar onboarding");

      void recordSystemEvent({
        event_type: "onboarding_criado",
        entity_type: "onboarding",
        entity_id: onboarding.id,
        clinic_id: clinicId,
        onboarding_id: onboarding.id,
        sale_id: sale.id,
        payload: { product: input.product, sla_deadline: slaDeadline.toISOString() },
      });

      // 4. Inserir etapas do template — primeira etapa já inicia em_andamento
      const stepsPayload = stepTemplates.map((s) => ({
        onboarding_id: onboarding.id,
        step_key: s.step_key,
        title: s.title,
        description: s.description ?? null,
        status: s.order_index === 1 ? ("em_andamento" as const) : ("pendente" as const),
        order_index: s.order_index,
        sla_hours: s.sla_hours,
      }));

      const { error: stepsErr } = await supabase
        .from("onboarding_steps")
        .insert(stepsPayload);

      if (stepsErr) throw stepsErr;

      // Primeira etapa já iniciada (order_index === 1)
      const firstStep = stepTemplates.find((s) => s.order_index === 1);
      if (firstStep) {
        void recordSystemEvent({
          event_type: "etapa_onboarding_iniciada",
          entity_type: "onboarding_step",
          clinic_id: clinicId,
          onboarding_id: onboarding.id,
          sale_id: sale.id,
          payload: { step_key: firstStep.step_key, title: firstStep.title },
        });
      }

      return { sale, onboarding, clinicId };
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
      // Busca contexto do onboarding (clinic_id, sale_id) e etapa atual para eventos
      const [{ data: ob }, { data: currentStep }] = await Promise.all([
        supabase.from("onboardings").select("clinic_id, sale_id").eq("id", onboardingId).single(),
        supabase.from("onboarding_steps").select("step_key, title").eq("id", stepId).single(),
      ]);

      // Marca a etapa como concluída
      const { error: stepErr } = await supabase
        .from("onboarding_steps")
        .update({ status: "concluido", completed_at: new Date().toISOString() })
        .eq("id", stepId);

      if (stepErr) throw stepErr;

      void recordSystemEvent({
        event_type: "etapa_onboarding_concluida",
        entity_type: "onboarding_step",
        entity_id: stepId,
        clinic_id: ob?.clinic_id ?? undefined,
        onboarding_id: onboardingId,
        sale_id: ob?.sale_id ?? undefined,
        payload: { step_key: currentStep?.step_key, title: currentStep?.title },
      });

      // Busca a próxima etapa pendente (menor order_index)
      const { data: pending } = await supabase
        .from("onboarding_steps")
        .select("id, step_key, title")
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

        void recordSystemEvent({
          event_type: "etapa_onboarding_iniciada",
          entity_type: "onboarding_step",
          entity_id: nextStep.id,
          clinic_id: ob?.clinic_id ?? undefined,
          onboarding_id: onboardingId,
          sale_id: ob?.sale_id ?? undefined,
          payload: { step_key: nextStep.step_key, title: nextStep.title },
        });
      } else {
        // Todas as etapas concluídas — fecha o onboarding
        await supabase
          .from("onboardings")
          .update({ status: "concluido", completed_at: new Date().toISOString() })
          .eq("id", onboardingId);

        void recordSystemEvent({
          event_type: "onboarding_concluido",
          entity_type: "onboarding",
          entity_id: onboardingId,
          clinic_id: ob?.clinic_id ?? undefined,
          onboarding_id: onboardingId,
          sale_id: ob?.sale_id ?? undefined,
        });
      }
    },
    onSuccess: (_, { onboardingId }) => {
      qc.invalidateQueries({ queryKey: ["onboardings"] });
      qc.invalidateQueries({ queryKey: ["onboardings", onboardingId] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}
