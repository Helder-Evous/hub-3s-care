export const channelTypeLabel: Record<string, string> = {
  api_oficial: "API Oficial",
  whatsapp_comum: "WhatsApp Comum",
  numero_reserva: "Número Reserva",
  api_reserva: "API Reserva",
};

export const channelStatusLabel: Record<string, string> = {
  ativo: "Ativo",
  em_atencao: "Em atenção",
  critico: "Crítico",
  livre: "Livre",
  bloqueado: "Bloqueado",
  desconectado: "Desconectado",
};

export const severityLabel: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const alertStatusLabel: Record<string, string> = {
  aberto: "Aberto",
  em_tratamento: "Em tratamento",
  resolvido: "Resolvido",
};

export const dataOriginLabel: Record<string, string> = {
  meta_api: "Meta API",
  plataforma: "Plataforma",
  manual: "Manual",
  robo_tela: "Robô de tela",
};

export function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}
