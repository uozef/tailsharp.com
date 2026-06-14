import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import type { RedFlag, Severity } from "@/lib/leader-grades";

const severityOrder: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  positive: 2,
};

const severityConfig: Record<
  Severity,
  { borderColor: string; icon: React.ReactNode; label: string; bg: string; text: string }
> = {
  critical: {
    borderColor: "border-l-red-500",
    icon: <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />,
    label: "Critical",
    bg: "bg-danger/10",
    text: "text-danger",
  },
  warning: {
    borderColor: "border-l-gold-400",
    icon: <AlertCircle className="h-4 w-4 text-gold-400 shrink-0" />,
    label: "Warnings",
    bg: "bg-gold-400/10",
    text: "text-gold-500",
  },
  positive: {
    borderColor: "border-l-green-400",
    icon: <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />,
    label: "Positive",
    bg: "bg-green-400/10",
    text: "text-green-400",
  },
};

interface Props {
  flags: RedFlag[];
}

export default function RedFlagsPanel({ flags }: Props) {
  const sorted = [...flags].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  const grouped = {
    critical: sorted.filter((f) => f.severity === "critical"),
    warning: sorted.filter((f) => f.severity === "warning"),
    positive: sorted.filter((f) => f.severity === "positive"),
  };

  const sections = (
    ["critical", "warning", "positive"] as Severity[]
  ).filter((s) => grouped[s].length > 0);

  if (sections.length === 0) {
    return <p className="py-3 text-center text-sm text-muted">No flags detected.</p>;
  }

  return (
    <div className="space-y-3">
      {sections.map((severity) => {
        const config = severityConfig[severity];
        return (
          <div key={severity}>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {config.label} ({grouped[severity].length})
            </p>
            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
              {grouped[severity].map((flag, idx) => (
                <div
                  key={`${flag.metric}-${idx}`}
                  className={`flex items-center gap-2 rounded-md border-l-3 px-3 py-2 ${config.borderColor} ${config.bg}`}
                >
                  {config.icon}
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground">{flag.title}</span>
                    <span className="ml-1.5 text-[11px] text-muted">{flag.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
