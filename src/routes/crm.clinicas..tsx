
function ClinicTemplatesAndVolume({ clinicId }: { clinicId: string }) {
  const summary = clinicTemplateSummary(clinicId);
  const apiVol = clinicVolumeForApi(clinicId);

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
