import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Cliente, Onboarding, OnboardingStatus, ProductType, StepStatus, ClienteStatus } from "./types";

type DbClinicStatus = "ativa" | "pausada" | "cancelada";

function toClienteStatus(dbStatus: DbClinicStatus, hasActiveOnboarding: boolean): ClienteStatus {
  if (hasActiveOnboarding) return "onboarding";
  if (dbStatus === "ativa") return "ativo";
  if (dbStatus === "cancelada") return "suspenso";
  return "inativo";
}

function mapStep(s: {
  id: string; step_key: string; title: string; description: string | null;
  status: string; order_index: number; sla_hours: number | null;
  due_at: string | null; completed_at: string | null; notes: string | null;
}) {
  return {
    id: s.id,
    step_key: s.step_key,
    title: s.title,
    description: s.description ?? undefined,
    status: s.status as StepStatus,
    order_index: s.order_index,
    sla_hours: s.sla_hours ?? undefined,
    due_at: s.due_at ?? undefined,
    completed_at: s.completed_at ?? undefined,
    notes: s.notes ?? undefined,
  };
}

function mapOnboarding(ob: {
  id: string; clinic_id: string; product: string; status: string;
  sla_deadline: string | null; completed_at: string | null; created_at: string;
  clinics: { name: string; nome_fantasia: string | null } | null;
  onboarding_steps: ReturnType<typeof mapStep>[];
}): Onboarding {
  return {
    id: ob.id,
    clinic_id: ob.clinic_id,
    clinic_name: ob.clinics?.nome_fantasia ?? ob.clinics?.name ?? "—",
    product: ob.product as ProductType,
    status: ob.status as OnboardingStatus,
    sla_deadline: ob.sla_deadline ?? undefined,
    completed_at: ob.completed_at ?? undefined,
    steps: ob.onboarding_steps.sort((a, b) => a.order_index - b.order_index),
    created_at: ob.created_at,
  };
}

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async (): Promise<Cliente[]> => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*, clinic_products(product, active), onboardings(status)")
        .order("name");

      if (error || !data) return [];

      return data.map((c) => {
        const products = (c.clinic_products as { product: string; active: boolean }[])
          .filter((cp) => cp.active)
          .map((cp) => cp.product as ProductType);

        const hasActiveOnboarding = (c.onboardings as { status: string }[]).some(
          (o) => o.status !== "concluido" && o.status !== "cancelado"
        );

        return {
          id: c.id,
          name: c.name,
          nome_fantasia: c.nome_fantasia ?? undefined,
          razao_social: c.razao_social ?? undefined,
          cnpj: c.cnpj ?? undefined,
          responsible: c.responsible ?? "",
          phone: c.phone ?? undefined,
          email: c.email ?? undefined,
          city: c.city ?? undefined,
          state: c.state ?? undefined,
          address: c.address ?? undefined,
          status: toClienteStatus(c.status as DbClinicStatus, hasActiveOnboarding),
          products,
          created_at: c.created_at,
        };
      });
    },
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ["clientes", id],
    enabled: !!id,
    queryFn: async (): Promise<Cliente | null> => {
      const { data: c, error } = await supabase
        .from("clinics")
        .select("*, clinic_products(product, active), onboardings(status)")
        .eq("id", id)
        .single();

      if (error || !c) return null;

      const products = (c.clinic_products as { product: string; active: boolean }[])
        .filter((cp) => cp.active)
        .map((cp) => cp.product as ProductType);

      const hasActiveOnboarding = (c.onboardings as { status: string }[]).some(
        (o) => o.status !== "concluido" && o.status !== "cancelado"
      );

      return {
        id: c.id,
        name: c.name,
        nome_fantasia: c.nome_fantasia ?? undefined,
        razao_social: c.razao_social ?? undefined,
        cnpj: c.cnpj ?? undefined,
        responsible: c.responsible ?? "",
        phone: c.phone ?? undefined,
        email: c.email ?? undefined,
        city: c.city ?? undefined,
        state: c.state ?? undefined,
        address: c.address ?? undefined,
        status: toClienteStatus(c.status as DbClinicStatus, hasActiveOnboarding),
        products,
        created_at: c.created_at,
      };
    },
  });
}

export function useClinicOnboarding(clinicId: string) {
  return useQuery({
    queryKey: ["onboardings", "clinic", clinicId],
    enabled: !!clinicId,
    queryFn: async (): Promise<Onboarding | null> => {
      const { data, error } = await supabase
        .from("onboardings")
        .select("*, clinics(name, nome_fantasia), onboarding_steps(*)")
        .eq("clinic_id", clinicId)
        .neq("status", "concluido")
        .neq("status", "cancelado")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) return null;

      const ob = data[0] as typeof data[0] & {
        clinics: { name: string; nome_fantasia: string | null } | null;
        onboarding_steps: Parameters<typeof mapStep>[0][];
      };

      return mapOnboarding({
        ...ob,
        onboarding_steps: ob.onboarding_steps.map(mapStep),
      });
    },
  });
}

export function useOnboardings() {
  return useQuery({
    queryKey: ["onboardings"],
    queryFn: async (): Promise<Onboarding[]> => {
      const { data, error } = await supabase
        .from("onboardings")
        .select("*, clinics(name, nome_fantasia), onboarding_steps(*)")
        .order("created_at", { ascending: false });

      if (error || !data) return [];

      return data.map((ob) => {
        const typed = ob as typeof ob & {
          clinics: { name: string; nome_fantasia: string | null } | null;
          onboarding_steps: Parameters<typeof mapStep>[0][];
        };
        return mapOnboarding({
          ...typed,
          onboarding_steps: typed.onboarding_steps.map(mapStep),
        });
      });
    },
  });
}

export function useOnboarding(id: string) {
  return useQuery({
    queryKey: ["onboardings", id],
    enabled: !!id,
    queryFn: async (): Promise<Onboarding | null> => {
      const { data: ob, error } = await supabase
        .from("onboardings")
        .select("*, clinics(name, nome_fantasia), onboarding_steps(*)")
        .eq("id", id)
        .single();

      if (error || !ob) return null;

      const typed = ob as typeof ob & {
        clinics: { name: string; nome_fantasia: string | null } | null;
        onboarding_steps: Parameters<typeof mapStep>[0][];
      };

      return mapOnboarding({
        ...typed,
        onboarding_steps: typed.onboarding_steps.map(mapStep),
      });
    },
  });
}

export function useClinicSales(clinicId: string) {
  return useQuery({
    queryKey: ["sales", "clinic", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("sold_at", { ascending: false });

      if (error || !data) return [];
      return data;
    },
  });
}
