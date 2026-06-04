import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useChannels, useClinics } from "@/lib/queries";
import { channelStatusLabel, channelTypeLabel, dataOriginLabel, timeAgo } from "@/lib/labels";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/crm/canais")({
  head: () => ({ meta: [{ title: "Canais — Chips/Canais" }] }),
  component: ChannelsList,
});

function ChannelsList() {
  const { data: channels = [], isLoading: loadingChannels } = useChannels();
  const { data: clinics = [], isLoading: loadingClinics } = useClinics();
  const isLoading = loadingChannels || loadingClinics;

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="animate-pulse bg-muted rounded h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  if (channels.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col items-center justify-center min-h-64 gap-3 text-center">
          <Radio className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum dado encontrado. Adicione clínicas no sistema.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Canais</h1>
          <p className="text-sm text-muted-foreground mt-1">Inventário operacional de números, chips e APIs.</p>
        </header>
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Número</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Clínica</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Operadora</th>
                <th className="text-left px-4 py-3">Aparelho</th>
                <th className="text-left px-4 py-3">Última verificação</th>
                <th className="text-left px-4 py-3">Origem</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch) => {
                const clinic = clinics.find((c) => c.id === ch.clinic_id);
                const tone = ["critico","bloqueado","desconectado"].includes(ch.status) ? "critical" : ch.status === "em_atencao" ? "warning" : ch.status === "livre" ? "primary" : "success";
                return (
                  <tr key={ch.id} className="border-t hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium tabular-nums">{ch.phone_number}</td>
                    <td className="px-4 py-3">{channelTypeLabel[ch.channel_type]}</td>
                    <td className="px-4 py-3">
                      <Link to="/crm/clinicas/$id" params={{ id: ch.clinic_id }} className="hover:text-primary">{clinic?.name}</Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge tone={tone}>{channelStatusLabel[ch.status]}</StatusBadge></td>
                    <td className="px-4 py-3 text-muted-foreground">{ch.carrier}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ch.device}</td>
                    <td className="px-4 py-3 text-muted-foreground">{timeAgo(ch.monitoring?.last_check)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ch.monitoring ? dataOriginLabel[ch.monitoring.data_origin] : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
