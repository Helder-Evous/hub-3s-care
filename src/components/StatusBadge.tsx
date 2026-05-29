import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "critical" | "muted" | "primary";

const toneClass: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/40",
  critical: "bg-critical/15 text-critical border-critical/30",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/30",
};

export function StatusBadge({ tone = "muted", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", toneClass[tone], className)}>
      {children}
    </span>
  );
}

export function StatusDot({ tone }: { tone: Tone }) {
  const color = {
    success: "bg-success",
    warning: "bg-warning",
    critical: "bg-critical animate-pulse",
    muted: "bg-muted-foreground",
    primary: "bg-primary",
  }[tone];
  return <span className={cn("inline-block h-2 w-2 rounded-full", color)} />;
}
