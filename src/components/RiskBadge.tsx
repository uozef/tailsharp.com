interface RiskBadgeProps {
  level: "Low" | "Medium" | "High";
}

const badgeStyles: Record<RiskBadgeProps["level"], string> = {
  Low: "bg-surface-inset text-blue-400",
  Medium: "bg-gold-100 text-gold-600",
  High: "bg-red-100 text-red-700",
};

export default function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[level]}`}
    >
      {level} Risk
    </span>
  );
}
