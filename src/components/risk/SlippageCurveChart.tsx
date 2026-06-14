"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SlippagePoint {
  size: number;
  cost: number;
}

interface SlippageCurveChartProps {
  data: SlippagePoint[];
  copyabilityScore: number;
}

function formatSize(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

function copyabilityColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 50) return "text-gold-400";
  return "text-danger";
}

export default function SlippageCurveChart({
  data,
  copyabilityScore,
}: SlippageCurveChartProps) {
  return (
    <div className="relative rounded-xl border border-card-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Slippage Curve</h3>
        <span
          className={`rounded-full border border-card-border bg-surface px-2 py-0.5 text-xs font-semibold ${copyabilityColor(copyabilityScore)}`}
        >
          Copyability: {copyabilityScore}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="slippageGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold-400)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--gold-400)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="size"
            tickFormatter={formatSize}
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [`${Number(value).toFixed(2)}%`, "Cost"]}
            labelFormatter={(label) => formatSize(Number(label))}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="var(--gold-400)"
            strokeWidth={2}
            fill="url(#slippageGold)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
