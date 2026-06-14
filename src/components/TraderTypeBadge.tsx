import { Bot, Cog, Brain, Dice5 } from "lucide-react";

type TraderType = "bot" | "systematic" | "discretionary" | "random";

const config: Record<
  TraderType,
  { bg: string; text: string; icon: typeof Bot; label: string }
> = {
  bot: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    icon: Bot,
    label: "Algorithmic Bot",
  },
  systematic: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: Cog,
    label: "Systematic",
  },
  discretionary: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: Brain,
    label: "Discretionary",
  },
  random: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    icon: Dice5,
    label: "Random/Lucky",
  },
};

interface Props {
  type: TraderType;
  confidence: number;
}

export default function TraderTypeBadge({ type, confidence }: Props) {
  const { bg, text, icon: Icon, label } = config[type];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${bg} ${text}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <span className="ml-0.5 opacity-70">{Math.round(confidence)}%</span>
    </span>
  );
}
