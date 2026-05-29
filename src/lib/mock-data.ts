// Mock data para o MVP do Hub 3S — Módulo Chips/Canais

export type ClinicStatus = "ativa" | "pausada" | "cancelada";
export type ChannelType = "api_oficial" | "whatsapp_comum" | "numero_reserva" | "api_reserva";
export type ChannelStatus = "ativo" | "em_atencao" | "critico" | "livre" | "bloqueado" | "desconectado";
export type AlertSeverity = "baixa" | "media" | "alta" | "critica";
export type AlertStatus = "aberto" | "em_tratamento" | "resolvido";
export type DataOrigin = "meta_api" | "plataforma" | "manual" | "robo_tela";
export type QualityRating = "alto" | "medio" | "baixo" | "desconhecido";
export type NumberStatus = "conectado" | "restrito" | "banido" | "pendente" | "desconhecido";

export interface Clinic {
  id: string;
  name: string;
  city: string;
  state: string;
  responsible: string;
  status: ClinicStatus;
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

export const clinics: Clinic[] = [
  { id: "c1", name: "OdontoVida São Paulo", city: "São Paulo", state: "SP", responsible: "Marina Costa", status: "ativa" },
  { id: "c2", name: "Sorrisos Belo Horizonte", city: "Belo Horizonte", state: "MG", responsible: "Rafael Lima", status: "ativa" },
  { id: "c3", name: "Clínica Dental Rio", city: "Rio de Janeiro", state: "RJ", responsible: "Juliana Souza", status: "ativa" },
  { id: "c4", name: "Implantes Curitiba", city: "Curitiba", state: "PR", responsible: "Carlos Mendes", status: "ativa" },
  { id: "c5", name: "OdontoCenter Salvador", city: "Salvador", state: "BA", responsible: "Patrícia Alves", status: "ativa" },
  { id: "c6", name: "Sorria Porto Alegre", city: "Porto Alegre", state: "RS", responsible: "Fernando Reis", status: "ativa" },
  { id: "c7", name: "Clínica Estética Recife", city: "Recife", state: "PE", responsible: "Beatriz Nogueira", status: "ativa" },
  { id: "c8", name: "OdontoExpress Fortaleza", city: "Fortaleza", state: "CE", responsible: "Daniel Castro", status: "pausada" },
];

const now = Date.now();
const mins = (m: number) => new Date(now - m * 60_000).toISOString();
const hours = (h: number) => new Date(now - h * 3_600_000).toISOString();

export const channels: Channel[] = [
  // c1 — operação blindada
  { id: "ch1", clinic_id: "c1", phone_number: "+55 11 99876-5432", channel_type: "api_oficial", status: "ativo", activated_at: "2024-03-12", carrier: "Vivo", device: "Servidor Meta", responsible: "Marina Costa",
    monitoring: { connected: true, quality_rating: "alto", number_status: "conectado", message_limit: 100000, has_restriction: false, last_check: mins(3), data_origin: "meta_api" } },
  { id: "ch2", clinic_id: "c1", phone_number: "+55 11 98765-1111", channel_type: "whatsapp_comum", status: "ativo", activated_at: "2024-05-02", carrier: "Claro", device: "Galaxy A14", responsible: "Recepção",
    monitoring: { connected: true, qr_disconnected: false, session_expired: false, receiving_messages: true, sending_messages: true, last_message_received: mins(2), last_message_sent: mins(4), last_check: mins(2), data_origin: "robo_tela" } },
  { id: "ch3", clinic_id: "c1", phone_number: "+55 11 97777-2222", channel_type: "numero_reserva", status: "livre", activated_at: "2024-06-15", carrier: "TIM", device: "Motorola E13", responsible: "Estoque",
    monitoring: { connected: true, last_check: mins(15), data_origin: "manual" } },

  // c2 — atenção (quality médio)
  { id: "ch4", clinic_id: "c2", phone_number: "+55 31 99888-7777", channel_type: "api_oficial", status: "em_atencao", activated_at: "2024-02-10", carrier: "Vivo", device: "Servidor Meta", responsible: "Rafael Lima",
    monitoring: { connected: true, quality_rating: "medio", number_status: "conectado", message_limit: 10000, has_restriction: false, last_check: mins(8), data_origin: "meta_api" } },
  { id: "ch5", clinic_id: "c2", phone_number: "+55 31 98777-3333", channel_type: "whatsapp_comum", status: "ativo", activated_at: "2024-04-21", carrier: "Claro", device: "iPhone SE", responsible: "Recepção",
    monitoring: { connected: true, qr_disconnected: false, session_expired: false, receiving_messages: true, sending_messages: true, last_message_received: mins(12), last_message_sent: mins(20), last_check: mins(5), data_origin: "robo_tela" } },

  // c3 — crítico (API banida)
  { id: "ch6", clinic_id: "c3", phone_number: "+55 21 99555-4444", channel_type: "api_oficial", status: "critico", activated_at: "2024-01-05", carrier: "Vivo", device: "Servidor Meta", responsible: "Juliana Souza",
    monitoring: { connected: false, quality_rating: "baixo", number_status: "banido", message_limit: 1000, has_restriction: true, last_check: mins(7), data_origin: "meta_api" } },
  { id: "ch7", clinic_id: "c3", phone_number: "+55 21 98444-5555", channel_type: "whatsapp_comum", status: "desconectado", activated_at: "2024-03-30", carrier: "TIM", device: "Galaxy A24", responsible: "Recepção",
    monitoring: { connected: false, qr_disconnected: true, session_expired: true, receiving_messages: false, sending_messages: false, last_message_received: hours(4), last_message_sent: hours(5), last_check: mins(6), data_origin: "robo_tela" } },

  // c4 — normal
  { id: "ch8", clinic_id: "c4", phone_number: "+55 41 99666-8888", channel_type: "api_oficial", status: "ativo", activated_at: "2024-04-18", carrier: "Vivo", device: "Servidor Meta", responsible: "Carlos Mendes",
    monitoring: { connected: true, quality_rating: "alto", number_status: "conectado", message_limit: 50000, has_restriction: false, last_check: mins(4), data_origin: "meta_api" } },
  { id: "ch9", clinic_id: "c4", phone_number: "+55 41 98555-9999", channel_type: "numero_reserva", status: "livre", activated_at: "2024-07-01", carrier: "Claro", device: "Motorola G14", responsible: "Estoque",
    monitoring: { connected: true, last_check: mins(30), data_origin: "manual" } },

  // c5 — atenção sem reserva
  { id: "ch10", clinic_id: "c5", phone_number: "+55 71 99333-2222", channel_type: "api_oficial", status: "ativo", activated_at: "2024-02-22", carrier: "Vivo", device: "Servidor Meta", responsible: "Patrícia Alves",
    monitoring: { connected: true, quality_rating: "alto", number_status: "conectado", message_limit: 100000, has_restriction: false, last_check: mins(10), data_origin: "meta_api" } },
  { id: "ch11", clinic_id: "c5", phone_number: "+55 71 98222-1111", channel_type: "whatsapp_comum", status: "em_atencao", activated_at: "2024-05-14", carrier: "TIM", device: "Galaxy A14", responsible: "Recepção",
    monitoring: { connected: true, qr_disconnected: false, session_expired: false, receiving_messages: false, sending_messages: true, last_message_received: hours(3), last_message_sent: mins(45), last_check: mins(9), data_origin: "robo_tela" } },

  // c6 — normal
  { id: "ch12", clinic_id: "c6", phone_number: "+55 51 99111-3344", channel_type: "api_oficial", status: "ativo", activated_at: "2024-03-08", carrier: "Vivo", device: "Servidor Meta", responsible: "Fernando Reis",
    monitoring: { connected: true, quality_rating: "alto", number_status: "conectado", message_limit: 100000, has_restriction: false, last_check: mins(5), data_origin: "meta_api" } },
  { id: "ch13", clinic_id: "c6", phone_number: "+55 51 98666-5544", channel_type: "whatsapp_comum", status: "ativo", activated_at: "2024-04-02", carrier: "Claro", device: "iPhone 11", responsible: "Recepção",
    monitoring: { connected: true, receiving_messages: true, sending_messages: true, last_message_received: mins(7), last_message_sent: mins(8), last_check: mins(3), data_origin: "robo_tela" } },
  { id: "ch14", clinic_id: "c6", phone_number: "+55 51 97777-9988", channel_type: "numero_reserva", status: "livre", activated_at: "2024-06-20", carrier: "TIM", device: "Motorola E13", responsible: "Estoque",
    monitoring: { connected: true, last_check: mins(60), data_origin: "manual" } },

  // c7 — crítico WhatsApp comum bloqueado
  { id: "ch15", clinic_id: "c7", phone_number: "+55 81 99444-7766", channel_type: "whatsapp_comum", status: "bloqueado", activated_at: "2024-01-19", carrier: "Vivo", device: "Galaxy A24", responsible: "Beatriz Nogueira",
    monitoring: { connected: false, qr_disconnected: true, session_expired: true, receiving_messages: false, sending_messages: false, last_message_received: hours(8), last_message_sent: hours(9), last_check: mins(15), data_origin: "robo_tela" } },

  // c8 — pausada
  { id: "ch16", clinic_id: "c8", phone_number: "+55 85 99222-8877", channel_type: "api_oficial", status: "em_atencao", activated_at: "2024-02-14", carrier: "Vivo", device: "Servidor Meta", responsible: "Daniel Castro",
    monitoring: { connected: true, quality_rating: "medio", number_status: "conectado", message_limit: 10000, has_restriction: false, last_check: mins(40), data_origin: "meta_api" } },
];

export const contingency: Contingency[] = [
  { clinic_id: "c1", has_backup_number: true, has_backup_api: true, has_approved_template: true, has_backup_chip: true, has_backup_device: true },
  { clinic_id: "c2", has_backup_number: false, has_backup_api: true, has_approved_template: true, has_backup_chip: true, has_backup_device: false },
  { clinic_id: "c3", has_backup_number: false, has_backup_api: false, has_approved_template: false, has_backup_chip: false, has_backup_device: false },
  { clinic_id: "c4", has_backup_number: true, has_backup_api: false, has_approved_template: true, has_backup_chip: true, has_backup_device: true },
  { clinic_id: "c5", has_backup_number: false, has_backup_api: false, has_approved_template: true, has_backup_chip: false, has_backup_device: true },
  { clinic_id: "c6", has_backup_number: true, has_backup_api: true, has_approved_template: true, has_backup_chip: true, has_backup_device: false },
  { clinic_id: "c7", has_backup_number: false, has_backup_api: false, has_approved_template: false, has_backup_chip: false, has_backup_device: true },
  { clinic_id: "c8", has_backup_number: false, has_backup_api: false, has_approved_template: true, has_backup_chip: false, has_backup_device: false },
];

export const alerts: Alert[] = [
  { id: "a1", clinic_id: "c3", channel_id: "ch6", alert_type: "Número banido", severity: "critica", message: "API Oficial banida pela Meta. Clínica sem canal principal.", status: "aberto", responsible: "Juliana Souza", created_at: mins(12) },
  { id: "a2", clinic_id: "c3", channel_id: "ch7", alert_type: "WhatsApp desconectado", severity: "critica", message: "WhatsApp comum desconectado há mais de 4 horas.", status: "em_tratamento", responsible: "Suporte", created_at: hours(4) },
  { id: "a3", clinic_id: "c2", channel_id: "ch4", alert_type: "Quality Rating médio", severity: "alta", message: "Quality Rating caiu para MEDIUM. Risco de queda para LOW.", status: "aberto", responsible: "Rafael Lima", created_at: mins(45) },
  { id: "a4", clinic_id: "c5", channel_id: "ch11", alert_type: "Sem mensagens recebidas", severity: "alta", message: "Mais de 2 horas sem mensagens recebidas no WhatsApp comum.", status: "aberto", responsible: "Patrícia Alves", created_at: hours(3) },
  { id: "a5", clinic_id: "c5", alert_type: "Sem número reserva", severity: "media", message: "Clínica não possui número reserva cadastrado.", status: "aberto", created_at: hours(8) },
  { id: "a6", clinic_id: "c7", channel_id: "ch15", alert_type: "Número principal bloqueado", severity: "critica", message: "WhatsApp comum bloqueado. Clínica sem comunicação ativa.", status: "aberto", responsible: "Beatriz Nogueira", created_at: hours(2) },
  { id: "a7", clinic_id: "c7", alert_type: "Contingência abaixo de 50%", severity: "alta", message: "Score de contingência em 20%. Sem reservas críticas.", status: "aberto", created_at: hours(2) },
  { id: "a8", clinic_id: "c2", alert_type: "Sem aparelho reserva", severity: "media", message: "Clínica não possui aparelho reserva cadastrado.", status: "aberto", created_at: hours(12) },
  { id: "a9", clinic_id: "c8", alert_type: "Quality Rating médio", severity: "media", message: "Quality Rating em MEDIUM por mais de 24h.", status: "em_tratamento", responsible: "Daniel Castro", created_at: hours(18) },
  { id: "a10", clinic_id: "c1", alert_type: "Verificação concluída", severity: "baixa", message: "Rotina de checagem executada com sucesso.", status: "resolvido", created_at: hours(1), resolved_at: mins(20) },
];
