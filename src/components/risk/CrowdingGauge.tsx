import type { CrowdingMetrics } from "@/lib/market-risk";

interface CrowdingGaugeProps {
  metrics: CrowdingMetrics;
}

function gaugeColor(pct: number): string {
  if (pct < 50) return "var(--grade-a)";
  if (pct < 75) return "var(--gold-400)";
  return "var(--danger)";
}

function statusBadge(status: CrowdingMetrics["crowdingStatus"]): {
  cls: string;
  label: string;
} {
  switch (status) {
    case "uncrowded":
      return { cls: "bg-green-400/15 text-green-400", label: "Uncrowded" };
    case "moderate":
      return { cls: "bg-gold-400/15 text-gold-400", label: "Moderate" };
    case "crowded":
      return { cls: "bg-orange-100 text-orange-600", label: "Crowded" };
    case "overcrowded":
      return { cls: "bg-danger/15 text-danger", label: "Overcrowded" };
  }
}

export default function CrowdingGauge({ metrics }: CrowdingGaugeProps) {
  const pct = Math.min(100, Math.max(0, metrics.capacityUtilization));
  const color = gaugeColor(pct);
  const badge = statusBadge(metrics.crowdingStatus);

  // SVG arc parameters
  const radius = 52;
  const cx = 60;
  const cy = 60;
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;
  const filledAngle = startAngle + (totalAngle * pct) / 100;

  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const arcPoint = (angle: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });

  const bgStart = arcPoint(startAngle);
  const bgEnd = arcPoint(endAngle);
  const fillEnd = arcPoint(filledAngle);
  const largeArcBg = totalAngle > 180 ? 1 : 0;
  const largeArcFill = filledAngle - startAngle > 180 ? 1 : 0;

  const bgPath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${largeArcBg} 1 ${bgEnd.x} ${bgEnd.y}`;
  const fillPath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${largeArcFill} 1 ${fillEnd.x} ${fillEnd.y}`;

  return (
    <div className="rounded-xl border border-card-border bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Crowding</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Gauge */}
      <div className="mx-auto w-[120px]">
        <svg viewBox="0 0 120 90" className="w-full">
          <path
            d={bgPath}
            fill="none"
            stroke="var(--card-border)"
            strokeWidth={10}
            strokeLinecap="round"
          />
          {pct > 0 && (
            <path
              d={fillPath}
              fill="none"
              stroke={color}
              strokeWidth={10}
              strokeLinecap="round"
            />
          )}
          <text
            x={cx}
            y={cy + 2}
            textAnchor="middle"
            className="fill-foreground text-lg font-bold"
            style={{ fontSize: 18, fontWeight: 700 }}
          >
            {Math.round(pct)}%
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            className="fill-muted"
            style={{ fontSize: 9 }}
          >
            full
          </text>
        </svg>
      </div>

      {/* Metrics grid */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
        <div>
          <p className="text-muted">Impact</p>
          <p className="font-semibold text-foreground">
            {metrics.postEntryPriceImpact.toFixed(1)}c
          </p>
        </div>
        <div>
          <p className="text-muted">Followers</p>
          <p className="font-semibold text-foreground">
            {metrics.estimatedFollowerLoad}
          </p>
        </div>
        <div>
          <p className="text-muted">Utilization</p>
          <p className="font-semibold text-foreground">
            {metrics.capacityUtilization}%
          </p>
        </div>
      </div>
    </div>
  );
}
