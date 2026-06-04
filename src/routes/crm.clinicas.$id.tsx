import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, StatusDot } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { clinics, channels, contingency, alerts, templates, apiVolumes } from "@/lib/mock-data";
import { clinicSummary, contingencyScore, contingencyClass } from "@/lib/calculations";
import { channelTypeLabel, channelStatusLabel, dataOriginLabel, timeAgo, severityLabel, alertStatusLabel } from "@/lib/labels";
import { ChevronLeft, ShieldCheck, Activity, Radio, FileText, Send } from "lucide-react";
import { clinicTemplateSummary, clinicVolumeForApi, deliveryRate, readRate, fmtBRL, templateCategoryLabel, templateStatusLabel, templateCategoryTone, templateStatusTone, templateAlerts } from "@/lib/templates";

export const Route = createFileRoute("/crm/clinicas/$id")({
  head: () => ({ meta: [{ title: "Clínica — Chips/Canais" }] }),
  component: ClinicDetail,
  notFoundComponent: () => (
    <AppShell><div className="p-10">Clínica não encontrada.</div></AppShell>
  ),
});

function ClinicDetail() {
  const { id } = Route.useParams();
  const clinic = clinics.find((c) => c.id === id);
  if (!clinic) throw notFound();
  const myChannels = channels.filter((c) => c.clinic_id === id);
  const cont = contingency.find((x) => x.clinic_id === id);
  const s = clinicSummary(clinic, myChannels, cont);
  const clinicAlerts = alerts.filter((a) => a.clinic_id === id);

  const contingencyItems: { label: string; ok: boolean }[] = cont
    ? [
        { label: "Número reserva", ok: cont.has_backup_number },
        { label: "API reserva", ok: cont.has_backup_api },
        { label: "Template aprovado", ok: cont.has_approved_template },
        { label: "Chip reserva físico", ok: cont.has_backup_chip },
        { label: "Aparelho reserva", ok: cont.has_backup_device },
      ]
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link to="/crm/clinicas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>
        <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{clinic.name}</h1>
            <div className="text-sm text-muted-foreground mt-1">{clinic.city} / {clinic.state} · Responsável: {clinic.responsible}</div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
            <StatusDot tone={s.health === "normal" ? "success" : s.health === "atencao" ? "warning" : "critical"} />
            <span className="text-sm font-medium">{s.health === "normal" ? "Operação normal" : s.health === "atencao" ? "Atenção" : "Crítico"}</span>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Canais" value={myChannels.length} icon={Radio} tone="primary" />
          <MetricCard label="Contingência" value={`${s.contingency}%`} hint={s.contingencyClass.label} icon={ShieldCheck} tone={s.contingencyClass.tone} />
          <MetricCard label="Comunicabilidade" value={`${s.communicability}%`} hint={s.communicabilityClass.label} icon={Activity} tone={s.communicabilityClass.tone} />
          <MetricCard label="Alertas abertos" value={clinicAlerts.filter((a) => a.status !== "resolvido").length} tone="warning" />
        </div>

        <ClinicTemplatesAndVolume clinicId={id} />

        <section className="mt-10">
          <h2 className="text-lg font-semibold mb-3">Canais</h2>
          <div className="grid gap-3">
            {myChannels.map((ch) => {
              const m = ch.monitoring;
              const tone = ["critico","bloqueado","desconectado"].includes(ch.status) ? "critical" : ch.status === "em_atencao" ? "warning" : ch.status === "livre" ? "primary" : "success";
              return (
                <div key={ch.id} className="rounded-xl border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums">{ch.phone_number}</span>
                        <StatusBadge tone="muted">{channelTypeLabel[ch.channel_type]}</StatusBadge>
                        <StatusBadge tone={tone}>{channelStatusLabel[ch.status]}</StatusBadge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Ativado {ch.activated_at} · {ch.carrier} · {ch.device} · Resp: {ch.responsible}
                      </div>
                    </div>
                    {m && (
                      <div className="text-xs text-muted-foreground text-right">
                        <div>Última verificação: {timeAgo(m.last_check)}</div>
                        <div>Origem: {dataOriginLabel[m.data_origin]}</div>
                      </div>
                    )}
                  </div>

                  {m && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {ch.channel_type === "api_oficial" && (
                        <>
                          <Field label="Conectada" value={m.connected ? "Sim" : "Não"} tone={m.connected ? "success" : "critical"} />
                          <Field label="Quality" value={m.quality_rating ?? "—"} tone={m.quality_rating === "alto" ? "success" : m.quality_rating === "medio" ? "warning" : m.quality_rating === "baixo" ? "critical" : "muted"} />
                          <Field label="Status do número" value={m.number_status ?? "—"} tone={m.number_status === "conectado" ? "success" : m.number_status === "banido" ? "critical" : "warning"} />
                          <Field label="Limite msgs" value={m.message_limit?.toLocaleString() ?? "—"} />
                          <Field label="Restrição" value={m.has_restriction ? "Sim" : "Não"} tone={m.has_restriction ? "critical" : "success"} />
                        </>
                      )}
                      {ch.channel_type === "whatsapp_comum" && (
                        <>
                          <Field label="Conectado" value={m.connected ? "Sim" : "Não"} tone={m.connected ? "success" : "critical"} />
                          <Field label="QR desconectado" value={m.qr_disconnected ? "Sim" : "Não"} tone={m.qr_disconnected ? "critical" : "success"} />
                          <Field label="Sessão expirada" value={m.session_expired ? "Sim" : "Não"} tone={m.session_expired ? "critical" : "success"} />
                          <Field label="Recebendo" value={m.receiving_messages ? "Sim" : "Não"} tone={m.receiving_messages ? "success" : "warning"} />
                          <Field label="Enviando" value={m.sending_messages ? "Sim" : "Não"} tone={m.sending_messages ? "success" : "warning"} />
                          <Field label="Última recebida" value={timeAgo(m.last_message_received)} />
                          <Field label="Última enviada" value={timeAgo(m.last_message_sent)} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Contingência</h2>
            <p className="text-xs text-muted-foreground mt-0.5">5 itens · 20 pts cada</p>
            <div className="mt-4 space-y-2">
              {contingencyItems.map((it) => (
                <div key={it.label} className="flex items-center justify-between text-sm">
                  <span>{it.label}</span>
                  <StatusBadge tone={it.ok ? "success" : "critical"}>{it.ok ? "Sim" : "Não"}</StatusBadge>
                </div>
              ))}
              {!cont && <div className="text-sm text-muted-foreground">Sem cadastro de contingência.</div>}
            </div>
            {cont && (
              <div className="mt-5 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Score</span>
                  <StatusBadge tone={contingencyClass(contingencyScore(cont)).tone}>
                    {contingencyScore(cont)}% · {contingencyClass(contingencyScore(cont)).label}
                  </StatusBadge>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${s.contingencyClass.tone === "success" ? "bg-success" : s.contingencyClass.tone === "warning" ? "bg-warning" : "bg-critical"}`} style={{ width: `${s.contingency}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Alertas da clínica</h2>
            <div className="mt-4 space-y-3">
              {clinicAlerts.length === 0 && <div className="text-sm text-muted-foreground">Sem alertas.</div>}
              {clinicAlerts.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{a.alert_type}</div>
                    <StatusBadge tone={a.severity === "critica" ? "critical" : a.severity === "alta" ? "warning" : a.severity === "media" ? "primary" : "muted"}>{severityLabel[a.severity]}</StatusBadge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{a.message}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{alertStatusLabel[a.status]} · {timeAgo(a.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, value, tone = "muted" }: { label: string; value: React.ReactNode; tone?: "success" | "warning" | "critical" | "muted" | "primary" }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1"><StatusBadge tone={tone}>{value}</StatusBadge></div>
    </div>
  );
}

function ClinicTemplatesAndVolume({ clinicId }: { clinicId: string }) {
  const summary = clinicTemplateSummary(clinicId, templates);
  const apiVol = clinicVolumeForApi(clinicId, apiVolumes);

  return (
    <section className="mt-10 grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Templates Meta</h2>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center">
          <Counter label="Utility" value={summary.utility} tone="success" />
          <Counter label="Marketing" value={summary.marketing} tone="warning" />
          <Counter label="Auth" value={summary.authentication} tone="primary" />
          <Counter label="Reprovados" value={summary.reprovados} tone={summary.reprovados > 0 ? "critical" : "muted"} />
          <Counter label="Em alerta" value={summary.em_alerta} tone={summary.em_alerta > 0 ? "warning" : "muted"} />
        </div>
        <div className="mt-4 space-y-2">
          {summary.list.length === 0 && <div className="text-sm text-muted-foreground">Sem templates cadastrados.</div>}
          {summary.list.map((t) => {
            const al = templateAlerts(t);
            return (
              <div key={t.id} className="flex items-center justify-between gap-2 text-sm border-t pt-2">
                <div className="min-w-0">
                  <div className="font-mono text-xs truncate">{t.name}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <StatusBadge tone={templateCategoryTone(t.category)} className="text-[10px]">{templateCategoryLabel[t.category]}</StatusBadge>
                    <StatusBadge tone={templateStatusTone(t.status)} className="text-[10px]">{templateStatusLabel[t.status]}</StatusBadge>
                    {al.map((a, i) => (
                      <StatusBadge key={i} tone="warning" className="text-[10px]">{a}</StatusBadge>
                    ))}
                  </div>
                </div>
                <div className="text-right text-xs tabular-nums shrink-0">
                  <div>{t.volume_7d.toLocaleString("pt-BR")} msgs</div>
                  <div className="text-muted-foreground">{fmtBRL(t.volume_7d * t.cost_per_message)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Send className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Mensagens API Oficial — hoje</h2>
        </div>
        {!apiVol ? (
          <div className="text-sm text-muted-foreground">Sem número API Oficial cadastrado.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Counter label="Enviadas" value={apiVol.sent_today.toLocaleString("pt-BR")} tone="primary" />
              <Counter label="Entregues" value={apiVol.delivered_today.toLocaleString("pt-BR")} tone="success" />
              <Counter label="Lidas" value={apiVol.read_today.toLocaleString("pt-BR")} tone="success" />
              <Counter label="Recebidas" value={apiVol.received_today.toLocaleString("pt-BR")} tone="primary" />
              <Counter label="Tx. entrega" value={`${deliveryRate(apiVol)}%`} tone={deliveryRate(apiVol) >= 90 ? "success" : "warning"} />
              <Counter label="Tx. leitura" value={`${readRate(apiVol)}%`} tone={readRate(apiVol) >= 60 ? "success" : "warning"} />
              <Counter label="Custo hoje" value={fmtBRL(apiVol.cost_today)} tone="warning" />
              <Counter label="Custo mês" value={fmtBRL(apiVol.cost_month)} tone="warning" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-muted-foreground border-t pt-3">
              <div>Último envio: {timeAgo(apiVol.last_sent_at)}</div>
              <div>Última recebida: {timeAgo(apiVol.last_received_at)}</div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Counter({ label, value, tone = "muted" }: { label: string; value: React.ReactNode; tone?: "success" | "warning" | "critical" | "muted" | "primary" }) {
  const toneClass = {
    success: "text-success",
    warning: "text-warning",
    critical: "text-critical",
    primary: "text-primary",
    muted: "text-foreground",
  }[tone];
  return (
    <div className="rounded-lg border bg-background/50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
