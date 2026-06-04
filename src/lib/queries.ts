// Queries Supabase com TanStack Query — substitui os dados mock nas rotas CRM
// Etapa 3: integração real com o banco de dados

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Clinic, Channel, Contingency, Alert, MetaTemplate, ApiVolume, ChannelMonitoring } from "./mock-data";

// ---------------------------------------------------------------------------
// Clínicas
// ---------------------------------------------------------------------------

export function useClinics() {
  return useQuery({
    queryKey: ["clinics"],
    queryFn: async (): Promise<Clinic[]> => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .order("name");
      if (error || !data) return [];
      return data.map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city ?? "",
        state: r.state ?? "",
        responsible: r.responsible ?? "",
        status: r.status,
      }));
    },
  });
}

export function useClinic(id: string) {
  return useQuery({
    queryKey: ["clinics", id],
    queryFn: async (): Promise<Clinic | null> => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) return null;
      return {
        id: data.id,
        name: data.name,
        city: data.city ?? "",
        state: data.state ?? "",
        responsible: data.responsible ?? "",
        status: data.status,
      };
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Canais (com join em channel_monitoring)
// ---------------------------------------------------------------------------

export function useChannels(clinicId?: string) {
  return useQuery({
    queryKey: ["channels", clinicId ?? "all"],
    queryFn: async (): Promise<Channel[]> => {
      let q = supabase
        .from("channels")
        .select("*, channel_monitoring(*)")
        .order("phone_number");
      if (clinicId) q = q.eq("clinic_id", clinicId);
      const { data, error } = await q;
      if (error || !data) return [];
      return data.map((r) => {
        // channel_monitoring pode ser array (join 1-N) ou null
        const monRows = Array.isArray(r.channel_monitoring)
          ? r.channel_monitoring
          : r.channel_monitoring
          ? [r.channel_monitoring]
          : [];
        // pegar o mais recente por last_check
        const mon =
          monRows.length > 0
            ? monRows.sort(
                (a: { last_check: string }, b: { last_check: string }) =>
                  new Date(b.last_check).getTime() -
                  new Date(a.last_check).getTime(),
              )[0]
            : null;

        const monitoring: ChannelMonitoring | undefined = mon
          ? {
              connected: mon.connected ?? undefined,
              quality_rating: mon.quality_rating ?? undefined,
              number_status: mon.number_status ?? undefined,
              message_limit: mon.message_limit ?? undefined,
              has_restriction: mon.has_restriction ?? undefined,
              qr_disconnected: mon.qr_disconnected ?? undefined,
              session_expired: mon.session_expired ?? undefined,
              receiving_messages: mon.receiving_messages ?? undefined,
              sending_messages: mon.sending_messages ?? undefined,
              last_message_received: mon.last_message_received ?? undefined,
              last_message_sent: mon.last_message_sent ?? undefined,
              last_check: mon.last_check,
              data_origin: mon.data_origin,
            }
          : undefined;

        return {
          id: r.id,
          clinic_id: r.clinic_id,
          phone_number: r.phone_number,
          channel_type: r.channel_type,
          status: r.status,
          activated_at: r.activated_at ?? r.created_at,
          carrier: r.carrier ?? "",
          device: r.device ?? "",
          responsible: r.responsible ?? "",
          notes: r.notes ?? undefined,
          monitoring,
        };
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Contingência
// ---------------------------------------------------------------------------

export function useContingency(clinicId?: string) {
  return useQuery({
    queryKey: ["contingency", clinicId ?? "all"],
    queryFn: async (): Promise<Contingency[]> => {
      let q = supabase.from("contingency_items").select("*");
      if (clinicId) q = q.eq("clinic_id", clinicId);
      const { data, error } = await q;
      if (error || !data) return [];
      return data.map((r) => ({
        clinic_id: r.clinic_id,
        has_backup_number: r.has_backup_number,
        has_backup_api: r.has_backup_api,
        has_approved_template: r.has_approved_template,
        has_backup_chip: r.has_backup_chip,
        has_backup_device: r.has_backup_device,
      }));
    },
  });
}

// ---------------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------------

export function useAlerts(clinicId?: string) {
  return useQuery({
    queryKey: ["alerts", clinicId ?? "all"],
    queryFn: async (): Promise<Alert[]> => {
      let q = supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (clinicId) q = q.eq("clinic_id", clinicId);
      const { data, error } = await q;
      if (error || !data) return [];
      return data.map((r) => ({
        id: r.id,
        clinic_id: r.clinic_id ?? "",
        channel_id: r.channel_id ?? undefined,
        alert_type: r.alert_type,
        severity: r.severity,
        message: r.message,
        status: r.status,
        responsible: r.responsible ?? undefined,
        created_at: r.created_at,
        resolved_at: r.resolved_at ?? undefined,
      }));
    },
  });
}

// ---------------------------------------------------------------------------
// Templates Meta — tabela ainda não existe no banco; retorna array vazio
// Os componentes já tratam lista vazia com "Sem templates cadastrados."
// ---------------------------------------------------------------------------

export function useTemplates(clinicId?: string): { data: MetaTemplate[]; isLoading: false; isError: false } {
  void clinicId;
  return { data: [], isLoading: false, isError: false };
}

// ---------------------------------------------------------------------------
// Volumes API — tabela ainda não existe no banco; retorna array vazio
// ---------------------------------------------------------------------------

export function useApiVolumes(clinicId?: string): { data: ApiVolume[]; isLoading: false; isError: false } {
  void clinicId;
  return { data: [], isLoading: false, isError: false };
}
