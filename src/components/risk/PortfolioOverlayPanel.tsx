import type { PortfolioOverlay } from "@/lib/market-risk";

const severityColors: Record<string, string> = {
  low: "bg-green-400/15 text-green-400",
  moderate: "bg-gold-400/15 text-gold-400",
  severe: "bg-orange-100 text-orange-600",
  catastrophic: "bg-danger/15 text-danger",
};

export default function PortfolioOverlayPanel({ data }: { data: PortfolioOverlay }) {
  return (
    <div className="rounded-xl bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-foreground">Portfolio Risk Overlay</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Thesis Exposure */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Thesis Exposure</h3>
          <div className="mb-3 rounded-lg bg-surface-inset p-3">
            <p className="text-sm text-muted">
              Your <span className="font-bold text-foreground">{data.totalPositions} positions</span> are effectively{" "}
              <span className="font-bold text-foreground">{data.effectiveBetCount} independent bets</span>
            </p>
          </div>

          <div className="space-y-2">
            {data.thesisExposure.map((thesis) => (
              <div key={thesis.thesis} className="rounded-lg bg-surface-inset p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{thesis.thesis}</span>
                  <span className="text-xs text-muted">${thesis.exposure.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted">
                  <span>{thesis.markets} markets</span>
                  <span>Correlation: {thesis.correlation.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-surface-inset p-3 text-center">
            <p className="text-lg font-bold text-foreground">{data.venueCapUtilization}%</p>
            <p className="text-[10px] text-muted">Capital Deployed</p>
          </div>
        </div>

        {/* Stress Scenarios */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Stress Scenarios</h3>
          <div className="space-y-2">
            {data.stressScenarios.map((scenario) => (
              <div key={scenario.name} className="rounded-lg bg-surface-inset p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{scenario.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${severityColors[scenario.severity] ?? ""}`}>
                      {scenario.severity}
                    </span>
                    <span className="text-sm font-bold text-danger">{scenario.portfolioImpact}%</span>
                  </div>
                </div>
                <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-inset">
                  <div
                    className="h-full rounded-full bg-danger"
                    style={{ width: `${Math.min(100, Math.abs(scenario.portfolioImpact))}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted">{scenario.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
