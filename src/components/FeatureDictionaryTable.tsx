"use client";

import { Fragment, useState } from "react";
import type { FeatureDictionary } from "@/lib/sharpness-rating";

/* ─── Feature metadata ─── */

interface FeatureMeta {
  key: keyof FeatureDictionary;
  label: string;
  family: string;
  /** Return "green" | "amber" | "red" based on value */
  interpret: (v: number | string | null) => "green" | "amber" | "red";
  format: (v: number | string | null) => string;
}

function thresholdInterp(
  greenBelow?: number,
  amberBelow?: number,
  invert?: boolean,
): (v: number | string | null) => "green" | "amber" | "red" {
  return (v) => {
    if (v == null || typeof v === "string") return "amber";
    const n = invert ? -v : v;
    if (greenBelow != null && n < greenBelow) return "green";
    if (amberBelow != null && n < amberBelow) return "amber";
    return "red";
  };
}

function higherIsBetter(green: number, amber: number): (v: number | string | null) => "green" | "amber" | "red" {
  return (v) => {
    if (v == null || typeof v === "string") return "amber";
    if (v >= green) return "green";
    if (v >= amber) return "amber";
    return "red";
  };
}

function fmt(decimals: number, suffix = "") {
  return (v: number | string | null) => {
    if (v == null) return "N/A";
    if (typeof v === "string") return v;
    return `${v.toFixed(decimals)}${suffix}`;
  };
}

const features: FeatureMeta[] = [
  /* Skill / CLV */
  { key: "clv_mean_w", label: "CLV Mean (weighted)", family: "Skill / CLV", interpret: higherIsBetter(0.02, 0), format: fmt(4) },
  { key: "clv_t", label: "CLV t-statistic", family: "Skill / CLV", interpret: higherIsBetter(2.5, 1.5), format: fmt(2) },
  /* Sizing */
  { key: "kelly_corr", label: "Kelly Correlation", family: "Sizing", interpret: higherIsBetter(0.3, 0.15), format: fmt(3) },
  { key: "result_react", label: "Result Reactivity", family: "Sizing", interpret: (v) => { const a = Math.abs(typeof v === "number" ? v : 0); return a < 0.1 ? "green" : a < 0.25 ? "amber" : "red"; }, format: fmt(3) },
  { key: "stake_entropy", label: "Stake Entropy", family: "Sizing", interpret: thresholdInterp(0.25, 0.5), format: fmt(3) },
  /* Timing */
  { key: "lead_1h_72h", label: "Timing Lead (min)", family: "Timing", interpret: (v) => { if (typeof v !== "number") return "amber"; return v < -20 ? "green" : v < 0 ? "amber" : "red"; }, format: fmt(1) },
  { key: "chase_score", label: "Chase Score", family: "Timing", interpret: thresholdInterp(0.2, 0.4), format: fmt(3) },
  /* Selection */
  { key: "cat_hhi", label: "Category HHI", family: "Selection", interpret: (v) => "amber" as const, format: fmt(4) },
  { key: "abstain_elast", label: "Abstention Elasticity", family: "Selection", interpret: higherIsBetter(0.5, 0.25), format: fmt(3) },
  /* Transience */
  { key: "tilt_index", label: "Tilt Index", family: "Transience", interpret: thresholdInterp(0.2, 0.5), format: fmt(3) },
  { key: "streak_z", label: "Streak z-score", family: "Transience", interpret: (v) => { const a = Math.abs(typeof v === "number" ? v : 0); return a < 1.5 ? "green" : a < 2.5 ? "amber" : "red"; }, format: fmt(2) },
  { key: "thesis_conc", label: "Thesis Concentration", family: "Transience", interpret: thresholdInterp(0.3, 0.6), format: fmt(3) },
  /* Structure */
  { key: "two_sided", label: "Two-Sidedness", family: "Structure", interpret: thresholdInterp(0.1, 0.25), format: fmt(3) },
  { key: "cp_conc", label: "Counterparty Conc.", family: "Structure", interpret: thresholdInterp(0.2, 0.4), format: fmt(3) },
  /* Clustering */
  { key: "fund_cluster", label: "Funding Cluster", family: "Clustering", interpret: () => "amber" as const, format: (v) => (v != null ? String(v) : "N/A") },
];

const indicatorColors: Record<string, string> = {
  green: "var(--grade-a)",
  amber: "var(--warning)",
  red: "var(--danger)",
};

/* ─── Component ─── */

interface Props {
  features: FeatureDictionary;
}

export default function FeatureDictionaryTable({ features: data }: Props) {
  const [open, setOpen] = useState(false);

  // Group by family
  const families: { name: string; items: FeatureMeta[] }[] = [];
  const seen = new Set<string>();
  for (const f of features) {
    if (!seen.has(f.family)) {
      seen.add(f.family);
      families.push({ name: f.family, items: features.filter((x) => x.family === f.family) });
    }
  }

  return (
    <div className="rounded-xl border border-card-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground"
      >
        <span>Show Feature Dictionary</span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="border-t border-card-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                <th className="px-4 py-2 font-medium">Feature</th>
                <th className="px-4 py-2 font-medium">Value</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {families.map((fam) => (
                <Fragment key={fam.name}>
                  <tr>
                    <td
                      colSpan={3}
                      className="bg-surface-inset px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400"
                    >
                      {fam.name}
                    </td>
                  </tr>
                  {fam.items.map((meta) => {
                    const raw = data[meta.key];
                    const level = meta.interpret(raw);
                    return (
                      <tr key={meta.key} className="border-t border-card-border/50">
                        <td className="px-4 py-1.5 text-muted">{meta.label}</td>
                        <td className="px-4 py-1.5 tabular-nums text-foreground">
                          {meta.format(raw)}
                        </td>
                        <td className="px-4 py-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: indicatorColors[level] }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
