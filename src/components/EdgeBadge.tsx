import {
  Newspaper,
  Microscope,
  Clock,
  TrendingDown,
  AlertTriangle,
  MinusCircle,
} from "lucide-react";

type EdgeType =
  | "information"
  | "analytical"
  | "timing"
  | "contrarian"
  | "unusual_pattern"
  | "no_edge";

const config: Record<
  EdgeType,
  { icon: typeof Newspaper; label: string; color: string }
> = {
  information: { icon: Newspaper, label: "Information", color: "text-blue-400" },
  analytical: { icon: Microscope, label: "Analytical", color: "text-green-400" },
  timing: { icon: Clock, label: "Timing", color: "text-gold-400" },
  contrarian: { icon: TrendingDown, label: "Contrarian", color: "text-orange-400" },
  unusual_pattern: { icon: AlertTriangle, label: "Unusual", color: "text-danger" },
  no_edge: { icon: MinusCircle, label: "No Edge", color: "text-muted" },
};

interface Props {
  type: EdgeType;
  strength: number;
}

export default function EdgeBadge({ type, strength }: Props) {
  const { icon: Icon, label, color } = config[type];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border border-card-border bg-surface px-2 py-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
      <span className="text-muted">{strength.toFixed(0)}</span>
    </span>
  );
}
