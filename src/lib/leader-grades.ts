import type { Leader } from "./mock-data";

export type Grade = "A" | "B" | "C" | "D" | "F";
export type Severity = "critical" | "warning" | "positive";

export interface RedFlag {
  severity: Severity;
  title: string;
  message: string;
  metric: string;
  value: number;
}

export interface LeaderGrades {
  trustScore: number;        // 0-100
  trustGrade: Grade;
  consistencyScore: number;
  consistencyGrade: Grade;
  riskManagementScore: number;
  riskManagementGrade: Grade;
  behavioralHealthScore: number;
  behavioralHealthGrade: Grade;
  trackRecordScore: number;
  trackRecordGrade: Grade;
}

function scoreToGrade(score: number): Grade {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

// Clamp a value between 0-100
function clamp(val: number): number {
  return Math.max(0, Math.min(100, val));
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

export function computeConsistencyScore(leader: Leader): number {
  const bp = leader.behavioralProfile;

  // returnConsistency (lower is better)
  const returnConsistencyScore = clamp(100 - bp.returnConsistency * 50);

  // disciplineScore directly
  const disciplineScore = bp.disciplineScore;

  // Negative month ratio
  const negativeMonths = leader.monthlyReturns.filter((r) => r < 0).length;
  const negativeRatio = negativeMonths / 12;
  const negativeMonthScore = clamp(100 - negativeRatio * 200);

  // rollingWinRate30d std dev
  const winRateStdDev = stdDev(leader.riskProfile.rollingWinRate30d);
  const winRateStdDevScore = clamp(100 - winRateStdDev * 5);

  return (
    returnConsistencyScore * 0.35 +
    disciplineScore * 0.25 +
    negativeMonthScore * 0.2 +
    winRateStdDevScore * 0.2
  );
}

export function computeRiskManagementScore(leader: Leader): number {
  const rp = leader.riskProfile;

  const maxDrawdownScore = clamp(100 - leader.maxDrawdown * 4);
  const concentrationScore = clamp(100 - rp.maxPositionConcentration * 2.5);
  const martingaleScoreVal = clamp(100 - rp.martingaleScore);
  const worstLossScore = clamp(100 - rp.worstSingleTradeLoss * 8);
  const sortinoScore = clamp(leader.sortinoRatio * 25);

  // Avg drawdown recovery days (only count recovered periods)
  const periods = rp.drawdownPeriods;
  const recoveredPeriods = periods.filter((p) => p.recoveryDays !== null);
  const avgRecoveryDays =
    recoveredPeriods.length > 0
      ? recoveredPeriods.reduce((sum, p) => sum + (p.recoveryDays ?? 0), 0) / recoveredPeriods.length
      : 0;
  const recoveryScore = clamp(100 - avgRecoveryDays * 1.5);

  return (
    maxDrawdownScore * 0.25 +
    concentrationScore * 0.2 +
    martingaleScoreVal * 0.2 +
    worstLossScore * 0.15 +
    sortinoScore * 0.1 +
    recoveryScore * 0.1
  );
}

export function computeBehavioralHealthScore(leader: Leader): number {
  const bp = leader.behavioralProfile;

  const revengeScore = clamp(100 - bp.revengeTradingRate * 2);
  const tiltScore = clamp(100 - (bp.tiltRatio - 1) * 100);
  const dispositionScore = clamp(100 - (bp.dispositionRatio - 1) * 80);
  const fomoScoreVal = clamp(100 - bp.fomoScore);
  const overtradingScore = clamp(100 - (bp.overtradingSpikeFactor - 1) * 50);

  return (
    revengeScore * 0.25 +
    tiltScore * 0.25 +
    dispositionScore * 0.2 +
    fomoScoreVal * 0.15 +
    overtradingScore * 0.15
  );
}

export function computeTrackRecordScore(leader: Leader): number {
  const totalTradesScore = clamp(Math.min(leader.totalTrades / 5, 100));

  // Months since join
  const joinDate = new Date(leader.joinedDate);
  const now = new Date();
  const months =
    (now.getFullYear() - joinDate.getFullYear()) * 12 +
    (now.getMonth() - joinDate.getMonth());
  const monthsScore = clamp(months * 5);

  const winRateScore = clamp((leader.winRate - 50) * 4);
  const profitFactorScore = clamp((leader.profitFactor - 1) * 40);
  const sharpeScore = clamp(leader.sharpeRatio * 30);

  return (
    totalTradesScore * 0.25 +
    monthsScore * 0.25 +
    winRateScore * 0.2 +
    profitFactorScore * 0.15 +
    sharpeScore * 0.15
  );
}

export function computeLeaderGrades(leader: Leader): LeaderGrades {
  const consistencyScore = computeConsistencyScore(leader);
  const riskManagementScore = computeRiskManagementScore(leader);
  const behavioralHealthScore = computeBehavioralHealthScore(leader);
  const trackRecordScore = computeTrackRecordScore(leader);

  const trustScore =
    consistencyScore * 0.3 +
    riskManagementScore * 0.3 +
    behavioralHealthScore * 0.25 +
    trackRecordScore * 0.15;

  return {
    trustScore,
    trustGrade: scoreToGrade(trustScore),
    consistencyScore,
    consistencyGrade: scoreToGrade(consistencyScore),
    riskManagementScore,
    riskManagementGrade: scoreToGrade(riskManagementScore),
    behavioralHealthScore,
    behavioralHealthGrade: scoreToGrade(behavioralHealthScore),
    trackRecordScore,
    trackRecordGrade: scoreToGrade(trackRecordScore),
  };
}

export function detectRedFlags(leader: Leader): RedFlag[] {
  const flags: RedFlag[] = [];
  const bp = leader.behavioralProfile;
  const rp = leader.riskProfile;

  // --- Critical ---

  if (rp.winRateTrend < -0.5) {
    flags.push({
      severity: "critical",
      title: "Win Rate Declining",
      message: `Win rate dropping by ${Math.abs(rp.winRateTrend)}% per month`,
      metric: "winRateTrend",
      value: rp.winRateTrend,
    });
  }

  if (rp.martingaleScore > 60) {
    flags.push({
      severity: "critical",
      title: "Martingale Pattern",
      message:
        "Position sizes increase after losses \u2014 doubling-down behavior detected",
      metric: "martingaleScore",
      value: rp.martingaleScore,
    });
  }

  if (bp.tiltRatio > 1.8) {
    flags.push({
      severity: "critical",
      title: "Emotional Tilt",
      message: `Positions are ${((bp.tiltRatio - 1) * 100).toFixed(0)}% larger after losses`,
      metric: "tiltRatio",
      value: bp.tiltRatio,
    });
  }

  if (rp.maxPositionConcentration > 30) {
    flags.push({
      severity: "critical",
      title: "Extreme Concentration",
      message: `Single position is ${rp.maxPositionConcentration}% of total capital`,
      metric: "maxPositionConcentration",
      value: rp.maxPositionConcentration,
    });
  }

  if (bp.revengeTradingRate > 40) {
    flags.push({
      severity: "critical",
      title: "Revenge Trading",
      message: `${bp.revengeTradingRate}% of trades follow a loss within 2 hours`,
      metric: "revengeTradingRate",
      value: bp.revengeTradingRate,
    });
  }

  if (rp.strategyDriftScore > 15) {
    flags.push({
      severity: "critical",
      title: "Strategy Drift",
      message:
        "Recent performance deviates significantly from historical pattern",
      metric: "strategyDriftScore",
      value: rp.strategyDriftScore,
    });
  }

  // --- Warning ---

  if (bp.dispositionRatio > 1.5) {
    flags.push({
      severity: "warning",
      title: "Disposition Effect",
      message: `Holds losing trades ${bp.dispositionRatio}x longer than winners`,
      metric: "dispositionRatio",
      value: bp.dispositionRatio,
    });
  }

  if (bp.overtradingSpikeFactor > 2.0) {
    flags.push({
      severity: "warning",
      title: "Overtrading Episodes",
      message: "Trading volume spikes suggest emotional overtrading",
      metric: "overtradingSpikeFactor",
      value: bp.overtradingSpikeFactor,
    });
  }

  if (bp.fomoScore > 50) {
    flags.push({
      severity: "warning",
      title: "FOMO Trading",
      message: "Trade entries correlate with market hype periods",
      metric: "fomoScore",
      value: bp.fomoScore,
    });
  }

  if (rp.topCategoryConcentration > 70) {
    flags.push({
      severity: "warning",
      title: "Low Diversification",
      message: `${rp.topCategoryConcentration}% of trades concentrated in ${rp.topCategory}`,
      metric: "topCategoryConcentration",
      value: rp.topCategoryConcentration,
    });
  }

  if (bp.disciplineScore < 50) {
    flags.push({
      severity: "warning",
      title: "Erratic Sizing",
      message: "Position sizes are inconsistent \u2014 low discipline",
      metric: "disciplineScore",
      value: bp.disciplineScore,
    });
  }

  for (const period of rp.drawdownPeriods) {
    if (period.recoveryDays !== null && period.recoveryDays > 45) {
      flags.push({
        severity: "warning",
        title: "Slow Recovery",
        message: `Took ${period.recoveryDays} days to recover from ${period.depth}% drawdown`,
        metric: "recoveryDays",
        value: period.recoveryDays,
      });
    }
    if (period.recoveryDays === null) {
      flags.push({
        severity: "critical",
        title: "Unrecovered Drawdown",
        message: `${period.depth}% drawdown starting ${period.startDate} has not recovered`,
        metric: "recoveryDays",
        value: -1,
      });
    }
  }

  if (rp.worstSingleTradeLoss > 8) {
    flags.push({
      severity: "warning",
      title: "Large Single Loss",
      message: `Worst single trade lost ${rp.worstSingleTradeLoss}% of capital`,
      metric: "worstSingleTradeLoss",
      value: rp.worstSingleTradeLoss,
    });
  }

  // --- Positive ---

  if (bp.returnConsistency < 0.4) {
    flags.push({
      severity: "positive",
      title: "Consistent Returns",
      message: "Low return volatility \u2014 very steady strategy",
      metric: "returnConsistency",
      value: bp.returnConsistency,
    });
  }

  if (bp.disciplineScore > 80) {
    flags.push({
      severity: "positive",
      title: "Strong Discipline",
      message: "Highly consistent position sizing",
      metric: "disciplineScore",
      value: bp.disciplineScore,
    });
  }

  if (bp.tiltRatio < 1.1 && bp.tiltRatio > 0.9) {
    flags.push({
      severity: "positive",
      title: "Emotionally Stable",
      message: "No emotional sizing detected after losses",
      metric: "tiltRatio",
      value: bp.tiltRatio,
    });
  }

  if (
    rp.drawdownPeriods.length > 0 &&
    rp.drawdownPeriods.every((p) => p.recoveryDays !== null && p.recoveryDays < 20)
  ) {
    flags.push({
      severity: "positive",
      title: "Quick Recovery",
      message: "Recovers from drawdowns rapidly",
      metric: "recoveryDays",
      value: Math.max(...rp.drawdownPeriods.map((p) => p.recoveryDays ?? 0)),
    });
  }

  if (rp.winRateTrend > 0.3) {
    flags.push({
      severity: "positive",
      title: "Improving Performance",
      message: "Win rate trending upward over time",
      metric: "winRateTrend",
      value: rp.winRateTrend,
    });
  }

  return flags;
}
