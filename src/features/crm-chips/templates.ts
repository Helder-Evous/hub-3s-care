import type { MetaTemplate, ApiVolume, TemplateCategory, TemplateStatus } from "./types";

export const templateCategoryLabel: Record<TemplateCategory, string> = {
  utility: "Utility",
  marketing: "Marketing",
  authentication: "Authentication",
};

export const templateStatusLabel: Record<TemplateStatus, string> = {
  aprovado: "Aprovado",
  pendente: "Pendente",
  reprovado: "Reprovado",
  pausado: "Pausado",
  desativado: "Desativado",
};

export function templateStatusTone(s: TemplateStatus): "success" | "warning" | "critical" | "muted" {
  if (s === "aprovado") return "success";
  if (s === "pendente") return "warning";
  if (s === "reprovado") return "critical";
  if (s === "pausado") return "warning";
  return "muted";
}

export function templateCategoryTone(c: TemplateCategory): "success" | "warning" | "primary" {
  if (c === "utility") return "success";
  if (c === "marketing") return "warning";
  return "primary";
}

export function templateAlerts(t: MetaTemplate): string[] {
  const out: string[] = [];
  if (t.previous_category && t.previous_category !== t.category) {
    out.push(
      `Categoria mudou de ${templateCategoryLabel[t.previous_category]} para ${templateCategoryLabel[t.category]}`,
    );
  }
  if (t.status === "reprovado") out.push("Template reprovado pela Meta");
  if (t.status === "pausado") out.push("Template pausado");
  if (t.status === "aprovado" && t.volume_7d === 0) out.push("Aprovado mas sem uso nos últimos dias");
  return out;
}

export function templateTotalCost(t: MetaTemplate): number {
  return t.volume_7d * t.cost_per_message;
}

export function clinicTemplateSummary(
  clinicId: string,
  templates: MetaTemplate[],
): {
  list: MetaTemplate[];
  utility: number;
  marketing: number;
  authentication: number;
  reprovados: number;
  em_alerta: number;
} {
  const list = templates.filter((t) => t.clinic_id === clinicId);
  return {
    list,
    utility: list.filter((t) => t.category === "utility").length,
    marketing: list.filter((t) => t.category === "marketing").length,
    authentication: list.filter((t) => t.category === "authentication").length,
    reprovados: list.filter((t) => t.status === "reprovado").length,
    em_alerta: list.filter((t) => templateAlerts(t).length > 0).length,
  };
}

export function deliveryRate(v: ApiVolume): number {
  if (v.sent_today === 0) return 0;
  return Math.round((v.delivered_today / v.sent_today) * 100);
}

export function readRate(v: ApiVolume): number {
  if (v.delivered_today === 0) return 0;
  return Math.round((v.read_today / v.delivered_today) * 100);
}

export function volumeAlerts(v: ApiVolume): { msg: string; tone: "warning" | "critical" }[] {
  const out: { msg: string; tone: "warning" | "critical" }[] = [];
  const hoursSinceSent = v.last_sent_at
    ? (Date.now() - new Date(v.last_sent_at).getTime()) / 3_600_000
    : 999;
  const hoursSinceReceived = v.last_received_at
    ? (Date.now() - new Date(v.last_received_at).getTime()) / 3_600_000
    : 999;

  if (hoursSinceSent > 4)
    out.push({
      msg: `Sem envios há ${Math.floor(hoursSinceSent)}h`,
      tone: hoursSinceSent > 12 ? "critical" : "warning",
    });
  if (hoursSinceReceived > 4)
    out.push({
      msg: `Sem recebimentos há ${Math.floor(hoursSinceReceived)}h`,
      tone: hoursSinceReceived > 12 ? "critical" : "warning",
    });

  const dr = deliveryRate(v);
  if (v.sent_today > 0 && dr < 90)
    out.push({
      msg: `Taxa de entrega ${dr}% (abaixo do padrão)`,
      tone: dr < 70 ? "critical" : "warning",
    });

  if (v.avg_daily_sent_7d > 0 && v.sent_today > 0 && v.sent_today < v.avg_daily_sent_7d * 0.5)
    out.push({
      msg: `Volume ${Math.round((1 - v.sent_today / v.avg_daily_sent_7d) * 100)}% abaixo da média 7d`,
      tone: "warning",
    });

  if (v.avg_daily_sent_7d > 0 && v.cost_today > v.avg_daily_sent_7d * 0.06)
    out.push({ msg: "Custo diário acima do esperado", tone: "warning" });

  return out;
}

export function clinicVolumeForApi(
  clinicId: string,
  apiVolumes: ApiVolume[],
): ApiVolume | undefined {
  return apiVolumes.find((v) => v.clinic_id === clinicId);
}

export function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
