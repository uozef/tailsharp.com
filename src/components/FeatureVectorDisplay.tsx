import {
  TrendingUp,
  Hash,
  Shuffle,
  Timer,
  ArrowLeftRight,
  BarChart3,
  Target,
} from "lucide-react";
import type { WalletFeatureVector } from "@/lib/wallet-intelligence";

interface MetricDef {
  key: keyof WalletFeatureVector;
  label: string;
  icon: typeof TrendingUp;
  format: (v: number) => string;
  color: (v: number) => string;
  note: (v: number) => string;
}

const metrics: MetricDef[] = [
  {
    key: "closingLineValue",
    label: "Closing Line Value",
    icon: TrendingUp,
    format: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`,
    color: (v) => (v > 0 ? "text-gold-400" : v < -2 ? "text-danger" : "text-muted"),
    note: (v) =>
      v > 3 ? "Elite edge" : v > 0 ? "Positive edge" : v < -2 ? "Negative edge" : "Marginal",
  },
  {
    key: "sampleSize",
    label: "Sample Size",
    icon: Hash,
    format: (v) => `${v.toLocaleString()} trades`,
    color: (v) => (v >= 200 ? "text-green-400" : v >= 100 ? "text-gold-400" : "text-danger"),
    note: (v) => (v >= 200 ? "Strong sample" : v >= 100 ? "Moderate" : "Low confidence"),
  },
  {
    key: "sizingEntropy",
    label: "Sizing Entropy",
    icon: Shuffle,
    format: (v) => v.toFixed(2),
    color: (v) => (v < 0.5 ? "text-green-400" : v < 1.0 ? "text-gold-400" : "text-danger"),
    note: (v) => (v < 0.5 ? "Consistent sizing" : v < 1.0 ? "Some variance" : "Erratic sizing"),
  },
  {
    key: "priceMovePrecession",
    label: "Price Precession",
    icon: Target,
    format: (v) => `${Math.round(v)}%`,
    color: (v) => (v > 55 ? "text-green-400" : v > 45 ? "text-gold-400" : "text-danger"),
    note: (v) => (v > 60 ? "Strong timing" : v > 55 ? "Good timing" : v > 45 ? "Average" : "Poor timing"),
  },
  {
    key: "lateSweepRatio",
    label: "Late Sweep Ratio",
    icon: Timer,
    format: (v) => `${Math.round(v)}%`,
    color: (v) => (v <= 10 ? "text-green-400" : v <= 20 ? "text-gold-400" : "text-danger"),
    note: (v) => (v <= 10 ? "Clean flow" : v <= 20 ? "Some late flow" : "Heavy late sweeping"),
  },
  {
    key: "twoSidedness",
    label: "Two-Sidedness",
    icon: ArrowLeftRight,
    format: (v) => `${Math.round(v)}%`,
    color: () => "text-foreground",
    note: (v) => (v > 30 ? "Balanced" : v > 15 ? "Directional" : "Heavily one-sided"),
  },
  {
    key: "categoryHerfindahl",
    label: "Category Focus (HHI)",
    icon: BarChart3,
    format: (v) => v.toFixed(2),
    color: () => "text-foreground",
    note: (v) => (v > 0.5 ? "Specialist" : v > 0.25 ? "Semi-focused" : "Diversified"),
  },
];

interface Props {
  features: WalletFeatureVector;
}

export default function FeatureVectorDisplay({ features }: Props) {
  const clvMetric = metrics[0];
  const clvValue = features[clvMetric.key] as number;
  const remaining = metrics.slice(1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">Feature Vector</h3>

      {/* CLV Hero */}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-card-border bg-gold-400/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <clvMetric.icon className="h-5 w-5 text-gold-400" />
          <div>
            <p className="text-xs font-semibold text-foreground">{clvMetric.label}</p>
            <p className="text-[10px] text-muted">{clvMetric.note(clvValue)}</p>
          </div>
        </div>
        <span className={`text-xl font-bold ${clvMetric.color(clvValue)}`}>
          {clvMetric.format(clvValue)}
        </span>
      </div>

      {/* 2-column grid */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {remaining.map((m) => {
          const val = features[m.key] as number;
          const Icon = m.icon;
          return (
            <div key={m.key} className="flex items-start gap-2 rounded-lg border border-card-border/60 px-3 py-2">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted">{m.label}</p>
                <p className={`text-sm font-bold leading-tight ${m.color(val)}`}>{m.format(val)}</p>
                <p className="text-[9px] text-muted">{m.note(val)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
