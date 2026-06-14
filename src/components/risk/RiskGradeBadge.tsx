import type { RiskGrade } from "@/lib/market-risk";

const gradeColors: Record<RiskGrade, string> = {
  A: "bg-surface-inset text-blue-400",
  B: "bg-surface-inset text-blue-400",
  C: "bg-gold-400/15 text-gold-500",
  D: "bg-orange-100 text-orange-600",
  F: "bg-red-100 text-danger",
};

export default function RiskGradeBadge({ grade }: { grade: RiskGrade }) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${gradeColors[grade]}`}
    >
      {grade}
    </span>
  );
}
