import type { VenueHealth, PolymarketRiskIndex } from "@/lib/market-risk";
import RiskGradeBadge from "./RiskGradeBadge";

interface Props {
  health: VenueHealth;
  index: PolymarketRiskIndex;
}

export default function VenueHealthPanel({ health, index }: Props) {
  const subIndices = [
    { label: "Oracle Reliability", value: index.subIndices.oracle, description: "UMA oracle resolution consistency and dispute rate" },
    { label: "Collateral Health", value: index.subIndices.collateral, description: "pUSD peg stability and reserve attestation status" },
    { label: "Liquidity Depth", value: index.subIndices.liquidity, description: "Average bid-ask spread and order book depth across markets" },
    { label: "Market Integrity", value: index.subIndices.integrity, description: "Wash trading detection and sybil resistance" },
  ];

  return (
    <div className="rounded-xl bg-surface p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Polymarket Risk Index</h2>
          <p className="text-xs text-muted">Composite venue-level risk assessment</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">{index.composite}</p>
            <p className="text-xs font-medium text-muted">
              {index.trend}
            </p>
          </div>
          <RiskGradeBadge grade={index.grade} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {subIndices.map((sub) => {
          const grade = sub.value >= 80 ? "A" as const : sub.value >= 65 ? "B" as const : sub.value >= 50 ? "C" as const : sub.value >= 35 ? "D" as const : "F" as const;
          return (
            <div key={sub.label} className="rounded-lg bg-surface-inset p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{sub.label}</span>
                <RiskGradeBadge grade={grade} />
              </div>
              <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-card-border/30">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${sub.value}%`,
                    backgroundColor:
                      sub.value >= 80 ? "var(--green-500)" :
                      sub.value >= 60 ? "var(--gold-400)" :
                      "var(--danger)",
                  }}
                />
              </div>
              <p className="text-[10px] text-muted">{sub.description}</p>
            </div>
          );
        })}
      </div>

      {/* Venue stats row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className="text-lg font-bold text-foreground">${(health.totalOI / 1_000_000).toFixed(0)}M</p>
          <p className="text-[10px] text-muted">Total OI</p>
        </div>
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className="text-lg font-bold text-foreground">${(health.totalVolume24h / 1_000_000).toFixed(1)}M</p>
          <p className="text-[10px] text-muted">24h Volume</p>
        </div>
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className="text-lg font-bold text-foreground">{health.apiUptime30d}%</p>
          <p className="text-[10px] text-muted">API Uptime 30d</p>
        </div>
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className="text-lg font-bold text-foreground">{health.electionDependence}%</p>
          <p className="text-[10px] text-muted">Election Dependence</p>
        </div>
      </div>
    </div>
  );
}
