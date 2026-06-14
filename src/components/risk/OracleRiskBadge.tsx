import type { RiskGrade } from "@/lib/market-risk";
import RiskGradeBadge from "./RiskGradeBadge";

export interface OracleRisk {
  grade: RiskGrade;
  disputeStatus: "none" | "challenged" | "appealed" | "arbitration";
  disputeStage?: string;
  attackProfitabilityRatio: number;
  provider: string;
}

interface OracleRiskBadgeProps {
  oracle: OracleRisk;
}

const disputeBadgeColors: Record<string, string> = {
  challenged: "bg-gold-400/15 text-gold-400 border-gold-400/30",
  appealed: "bg-danger/15 text-danger border-danger/30",
  arbitration: "bg-danger/25 text-danger border-danger/40",
};

export default function OracleRiskBadge({ oracle }: OracleRiskBadgeProps) {
  const showDispute = oracle.disputeStatus !== "none";
  const showAttackWarning = oracle.attackProfitabilityRatio > 0.7;

  return (
    <span className="inline-flex items-center gap-1.5">
      <RiskGradeBadge grade={oracle.grade} />

      {showDispute && (
        <span
          className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
            disputeBadgeColors[oracle.disputeStatus] ?? "bg-gold-400/15 text-gold-400 border-gold-400/30"
          }`}
        >
          {oracle.disputeStage ?? oracle.disputeStatus}
        </span>
      )}

      {showAttackWarning && (
        <span className="inline-flex items-center gap-0.5 rounded-full border border-danger/30 bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
          <svg
            viewBox="0 0 16 16"
            className="h-2.5 w-2.5"
            fill="currentColor"
          >
            <path d="M8 1l7 14H1L8 1zm0 4.5v4m0 2v1" />
          </svg>
          Attack risk {(oracle.attackProfitabilityRatio * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
}
