"use client";

import type { LeaderGrades, Grade } from "@/lib/leader-grades";

const gradeColors: Record<Grade, string> = {
  A: "var(--grade-a)",
  B: "var(--grade-b)",
  C: "var(--grade-c)",
  D: "var(--grade-d)",
  F: "var(--grade-f)",
};

interface Props {
  grades: LeaderGrades;
  size?: "sm" | "lg";
}

export default function TrustScoreBadge({ grades, size = "lg" }: Props) {
  const score = Math.round(grades.trustScore);
  const grade = grades.trustGrade;
  const color = gradeColors[grade];
  const isLarge = size === "lg";

  const viewBox = isLarge ? 100 : 52;
  const cx = viewBox / 2;
  const cy = viewBox / 2;
  const radius = isLarge ? 42 : 22;
  const strokeWidth = isLarge ? 8 : 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  if (!isLarge) {
    return (
      <div className="relative flex h-10 w-10 items-center justify-center">
        <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="h-full w-full -rotate-90">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" className="text-card-border" strokeWidth={strokeWidth} opacity={0.25} />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <span className="absolute text-xs font-bold" style={{ color }}>{grade}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
        <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="h-full w-full -rotate-90">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" className="text-card-border" strokeWidth={strokeWidth} opacity={0.25} />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold leading-none" style={{ color }}>{grade}</span>
          <span className="text-xs text-muted">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Trust Score</p>
        <p className="text-xs text-muted">Composite of consistency, risk, behavior &amp; track record</p>
      </div>
    </div>
  );
}
