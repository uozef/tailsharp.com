import type { Grade } from "@/lib/leader-grades";

const gradeColors: Record<Grade, string> = {
  A: "var(--grade-a)",
  B: "var(--grade-b)",
  C: "var(--grade-c)",
  D: "var(--grade-d)",
  F: "var(--grade-f)",
};

interface Props {
  title: string;
  score: number;
  grade: Grade;
}

export default function GradeCard({ title, score, grade }: Props) {
  const color = gradeColors[grade];
  const rounded = Math.round(score);

  return (
    <div className="rounded-xl border border-card-border bg-surface p-3 shadow-sm">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{title}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold leading-none" style={{ color }}>{grade}</span>
        <span className="text-xs text-muted">{rounded}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-card-border/25">
        <div
          className="h-full rounded-full"
          style={{ width: `${rounded}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
