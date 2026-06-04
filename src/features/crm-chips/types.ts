// Tipos do domínio CRM > Chips e Canais
// Fonte de verdade para toda a feature — independente da origem dos dados (mock ou Supabase)

export type ClinicStatus = "ativa" | "pausada" | "cancelada";
export type ChannelType = "api_oficial" | "whatsapp_comum" | "numero_reserva" | "api_reserva";
export type ChannelStatus = "ativo" | "em_atencao" | "critico" | "livre" | "bloqueado" | "desconectado";
export type AlertSeverity = "baixa" | "media" | "alta" | "critica";
export type AlertStatus = "aberto" | "em_tratamento" | "resolvido";
export type DataOrigin = "meta_api" | "plataforma" | "manual" | "robo_tela";
export type QualityRating = "alto" | "medio" | "baixo" | "desconhecido";
export type NumberStatus = "conectado" | "restrito" | "banido" | "pendente" | "desconhecido";
export type TemplateCategory = "utility" | "marketing" | "authentication";
export type TemplateStatus = "aprovado" | "pendente" | "reprovado" | "pausado" | "desativado";

export interface Clinic {
  id: string;
  name: string;
  city: string;
  state: string;
  responsible: string;
  status: ClinicStatus;
}

export interface ChannelMonitoring {
  connected?: boolean;
  quality_rating?: QualityRating;
  number_status?: NumberStatus;
  message_limit?: number;
  has_restriction?: boolean;
  qr_disconnected?: boolean;
  session_expired?: boolean;
  receiving_messages?: boolean;
  sending_messages?: boolean;
  last_message_received?: string;
  last_message_sent?: string;
  last_check: string;
  data_origin: DataOrigin;
}

export interface Channel {
  id: string;
  clinic_id: string;
  phone_number: string;
  channel_type: ChannelType;
  status: ChannelStatus;
  activated_at: string;
  carrier: string;
  device: string;
  responsible: string;
  notes?: string;
  monitoring?: ChannelMonitoring;
}

export interface Contingency {
  clinic_id: string;
  has_backup_number: boolean;
  has_backup_api: boolean;
  has_approved_template: boolean;
  has_backup_chip: boolean;
  has_backup_device: boolean;
}

export interface Alert {
  id: string;
  clinic_id: string;
  channel_id?: string;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  responsible?: string;
  created_at: string;
  resolved_at?: string;
}

export interface MetaTemplate {
  id: string;
  channel_id: string;
  clinic_id: string;
  name: string;
  category: TemplateCategory;
  previous_category?: TemplateCategory;
  status: TemplateStatus;
  last_check: string;
  volume_7d: number;
  cost_per_message: number;
  last_sent_at?: string;
}

export interface ApiVolume {
  channel_id: string;
  clinic_id: string;
  sent_today: number;
  delivered_today: number;
  read_today: number;
  received_today: number;
  last_sent_at?: string;
  last_received_at?: string;
  avg_daily_sent_7d: number;
  cost_today: number;
  cost_month: number;
}

export interface ClinicSummary {
  clinic: Clinic;
  channels: Channel[];
  contingency: number;
  contingencyClass: { label: string; tone: "success" | "warning" | "critical" };
  communicability: number;
  communicabilityClass: { label: string; tone: "success" | "warning" | "critical" };
  health: "normal" | "atencao" | "critico";
}
