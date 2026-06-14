import type { CollateralHealth } from "@/lib/market-risk";
import RiskGradeBadge from "./RiskGradeBadge";

function trendBadge(trend: CollateralHealth["floatTrend"]): { cls: string; label: string } {
  switch (trend) {
    case "accumulating":
      return { cls: "bg-green-400/15 text-green-400", label: "Accumulating" };
    case "stable":
      return { cls: "bg-gold-400/15 text-gold-400", label: "Stable" };
    case "withdrawing":
      return { cls: "bg-danger/15 text-danger", label: "Withdrawing" };
  }
}

export default function CollateralPanel({ data }: { data: CollateralHealth }) {
  const healthGrade = data.isPegged ? (data.pusdPrice >= 0.995 ? "A" as const : "B" as const) : "D" as const;
  const badge = trendBadge(data.floatTrend);

  return (
    <div className="rounded-xl bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Collateral Health (pUSD)</h2>
        <RiskGradeBadge grade={healthGrade} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className="text-lg font-bold text-foreground">${data.pusdPrice.toFixed(4)}</p>
          <p className="text-[10px] text-muted">pUSD Price</p>
        </div>
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className={`text-lg font-bold ${data.isPegged ? "text-blue-400" : "text-danger"}`}>
            {data.isPegged ? "Yes" : "No"}
          </p>
          <p className="text-[10px] text-muted">Peg Intact</p>
        </div>
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className={`text-lg font-bold ${data.attestationStatus === "fresh" ? "text-blue-400" : "text-danger"}`}>
            {data.attestationAge}
          </p>
          <p className="text-[10px] text-muted">Attestation ({data.attestationStatus})</p>
        </div>
        <div className="rounded-lg bg-surface-inset p-3 text-center">
          <p className={`text-lg font-bold ${data.netFloatChange30d >= 0 ? "text-blue-400" : "text-danger"}`}>
            {data.netFloatChange30d >= 0 ? "+" : ""}{data.netFloatChange30d}%
          </p>
          <p className="text-[10px] text-muted">Smart Money Float 30d</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Float Trend</h3>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
    </div>
  );
}
