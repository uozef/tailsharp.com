import {
  Star,
  CheckCircle,
  Activity,
  TrendingDown,
  Shuffle,
} from "lucide-react";

type ConsistencyLevel =
  | "elite"
  | "consistent"
  | "streaky"
  | "declining"
  | "erratic";

const config: Record<
  ConsistencyLevel,
  { bg: string; text: string; icon: typeof Star; label: string }
> = {
  elite: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    icon: Star,
    label: "Elite",
  },
  consistent: {
    bg: "bg-surface-inset",
    text: "text-blue-400",
    icon: CheckCircle,
    label: "Consistent",
  },
  streaky: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: Activity,
    label: "Streaky",
  },
  declining: {
    bg: "bg-red-50",
    text: "text-red-700",
    icon: TrendingDown,
    label: "Declining",
  },
  erratic: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    icon: Shuffle,
    label: "Erratic",
  },
};

interface Props {
  level: ConsistencyLevel;
}

export default function ConsistencyBadge({ level }: Props) {
  const { bg, text, icon: Icon, label } = config[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${bg} ${text}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
