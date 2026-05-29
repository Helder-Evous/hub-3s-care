import type { Channel, Clinic, Contingency } from "./mock-data";

export function contingencyScore(c: Contingency): number {
  const items = [c.has_backup_number, c.has_backup_api, c.has_approved_template, c.has_backup_chip, c.has_backup_device];
  return items.filter(Boolean).length * 20;
}

export function contingencyClass(score: number): { label: string; tone: "success" | "warning" | "critical" } {
  if (score >= 80) return { label: "Blindada", tone: "success" };
  if (score >= 50) return { label: "Risco moderado", tone: "warning" };
  return { label: "Alto risco", tone: "critical" };
}

export function communicabilityScore(channels: Channel[], contingency?: Contingency): number {
  let score = 0;
  const apiOficial = channels.find((c) => c.channel_type === "api_oficial");
  if (apiOficial?.monitoring?.connected && apiOficial.monitoring.number_status === "conectado") score += 30;

  const wpp = channels.find((c) => c.channel_type === "whatsapp_comum");
  if (wpp?.monitoring?.connected) score += 20;

  const reserva = channels.find((c) => c.channel_type === "numero_reserva" || c.channel_type === "api_reserva");
  if (reserva && reserva.status !== "bloqueado" && reserva.status !== "desconectado") score += 20;

  if (contingency?.has_approved_template) score += 15;

  const plataformaOk = channels.some(
    (c) => c.monitoring?.receiving_messages && c.monitoring?.sending_messages,
  );
  if (plataformaOk) score += 15;

  return score;
}

export function communicabilityClass(score: number): { label: string; tone: "success" | "warning" | "critical" } {
  if (score >= 85) return { label: "Blindada", tone: "success" };
  if (score >= 60) return { label: "Atenção", tone: "warning" };
  return { label: "Crítica", tone: "critical" };
}

export function clinicHealth(channels: Channel[]): "normal" | "atencao" | "critico" {
  if (channels.some((c) => c.status === "critico" || c.status === "bloqueado" || c.status === "desconectado")) return "critico";
  if (channels.some((c) => c.status === "em_atencao")) return "atencao";
  return "normal";
}

export function clinicSummary(clinic: Clinic, channels: Channel[], contingency?: Contingency) {
  const cont = contingency ? contingencyScore(contingency) : 0;
  const comm = communicabilityScore(channels, contingency);
  return {
    clinic,
    channels,
    contingency: cont,
    contingencyClass: contingencyClass(cont),
    communicability: comm,
    communicabilityClass: communicabilityClass(comm),
    health: clinicHealth(channels),
  };
}
