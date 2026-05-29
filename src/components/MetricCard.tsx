import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "critical" | "primary";
}) {
  const toneRing = {
    default: "border-border",
    success: "border-success/40",
    warning: "border-warning/50",
    critical: "border-critical/40",
    primary: "border-primary/40",
  }[tone];
  const toneIcon = {
    default: "text-muted-foreground bg-muted",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/15",
    critical: "text-critical bg-critical/10",
    primary: "text-primary bg-primary/10",
  }[tone];
  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-sm", toneRing)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-2", toneIcon)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
