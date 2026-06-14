import type { Leader } from "./mock-data";

// === TYPES ===

export type TraderType = "bot" | "systematic" | "discretionary" | "random";
export type EdgeType = "information" | "analytical" | "timing" | "contrarian" | "unusual_pattern" | "no_edge";
export type ConsistencyClass = "elite" | "consistent" | "streaky" | "declining" | "erratic";
export type SkillVerdict = "Skilled" | "Likely Skilled" | "Inconclusive" | "Likely Lucky" | "Lucky";

export interface TraderTypeResult {
  type: TraderType;
  confidence: number; // 0-100
  label: string; // human readable
  description: string;
}

export interface EdgeResult {
  type: EdgeType;
  strength: number; // 0-100
  label: string;
  evidence: string;
}

export interface ConsistencyResult {
  classification: ConsistencyClass;
  label: string;
  score: number; // 0-100
  trend: "improving" | "stable" | "declining";
}

export interface LuckSkillResult {
  luckScore: number; // 0-100 (0=pure skill, 100=pure luck)
  skillProbability: number; // 0-1
  components: {
    winRateVsExpected: number;
    persistenceAcrossConditions: number;
    sampleSizeStability: number;
    concentrationPenalty: number;
    streakNormality: number;
  };
  verdict: SkillVerdict;
}

export interface TraderClassification {
  traderType: TraderTypeResult;
  edges: EdgeResult[];
  primaryEdge: EdgeResult;
  consistency: ConsistencyResult;
  luckSkill: LuckSkillResult;
}

// === HELPERS ===

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// === CLASSIFICATION FUNCTIONS ===

export function classifyTraderType(leader: Leader): TraderTypeResult {
  const bp = leader.behavioralProfile;
  const monthlyReturns = leader.monthlyReturns;

  // Score each type 0-100
  // Bot score
  let botScore = 0;
  if (bp.disciplineScore > 85) botScore += 30;
  else if (bp.disciplineScore > 70) botScore += 15;
  if (bp.tiltRatio >= 0.95 && bp.tiltRatio <= 1.05) botScore += 20;
  else if (bp.tiltRatio >= 0.9 && bp.tiltRatio <= 1.1) botScore += 10;
  if (bp.revengeTradingRate < 5) botScore += 20;
  else if (bp.revengeTradingRate < 10) botScore += 10;
  if (bp.overtradingSpikeFactor < 1.2) botScore += 15;
  else if (bp.overtradingSpikeFactor < 1.5) botScore += 7;
  if (leader.tradeFrequency === "Daily" && leader.totalTrades > 400) botScore += 15;
  else if (leader.tradeFrequency === "Daily" && leader.totalTrades > 200) botScore += 7;

  // Systematic score
  let systematicScore = 0;
  if (bp.disciplineScore > 65) systematicScore += 25;
  else if (bp.disciplineScore > 50) systematicScore += 12;
  if (bp.tiltRatio < 1.2) systematicScore += 20;
  else if (bp.tiltRatio < 1.4) systematicScore += 10;
  if (bp.revengeTradingRate < 20) systematicScore += 15;
  else if (bp.revengeTradingRate < 30) systematicScore += 7;
  // Consistent monthly returns: low stddev
  const monthlyStdDev = stddev(monthlyReturns);
  if (monthlyStdDev < 2) systematicScore += 25;
  else if (monthlyStdDev < 4) systematicScore += 15;
  else if (monthlyStdDev < 6) systematicScore += 5;
  if (bp.returnConsistency < 0.6) systematicScore += 15;
  else if (bp.returnConsistency < 0.8) systematicScore += 7;

  // Discretionary score
  let discretionaryScore = 0;
  if (bp.tiltRatio > 1.2) discretionaryScore += 25;
  else if (bp.tiltRatio > 1.0) discretionaryScore += 10;
  if (bp.revengeTradingRate > 20) discretionaryScore += 20;
  else if (bp.revengeTradingRate > 10) discretionaryScore += 10;
  if (bp.fomoScore > 40) discretionaryScore += 20;
  else if (bp.fomoScore > 25) discretionaryScore += 10;
  // Variable patterns: high monthly return stddev
  if (monthlyStdDev > 4) discretionaryScore += 20;
  else if (monthlyStdDev > 2) discretionaryScore += 10;
  if (bp.overtradingSpikeFactor > 1.5) discretionaryScore += 15;
  else if (bp.overtradingSpikeFactor > 1.2) discretionaryScore += 7;

  // Random score
  let randomScore = 0;
  if (bp.returnConsistency > 1.0) randomScore += 30;
  else if (bp.returnConsistency > 0.8) randomScore += 15;
  if (leader.winRate < 55 && leader.sharpeRatio < 0.8) randomScore += 35;
  else if (leader.winRate < 60 && leader.sharpeRatio < 1.2) randomScore += 15;
  if (monthlyStdDev > 6) randomScore += 20;
  else if (monthlyStdDev > 4) randomScore += 10;
  if (leader.profitFactor < 1.5) randomScore += 15;
  else if (leader.profitFactor < 2.0) randomScore += 7;

  const scores: { type: TraderType; score: number; label: string; description: string }[] = [
    {
      type: "bot",
      score: botScore,
      label: "Algorithmic Bot",
      description: "Highly disciplined execution with minimal emotional variance suggests automated trading.",
    },
    {
      type: "systematic",
      score: systematicScore,
      label: "Systematic Trader",
      description: "Rule-based approach with consistent behavior patterns and controlled risk.",
    },
    {
      type: "discretionary",
      score: discretionaryScore,
      label: "Discretionary Trader",
      description: "Judgment-driven decisions with variable behavior and emotional influence.",
    },
    {
      type: "random",
      score: randomScore,
      label: "Random/Lucky",
      description: "No clear edge or consistent strategy detected; returns may be driven by luck.",
    },
  ];

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  const second = scores[1];
  const confidence = clamp(Math.round(((top.score - second.score) / Math.max(top.score, 1)) * 100), 10, 95);

  return {
    type: top.type,
    confidence,
    label: top.label,
    description: top.description,
  };
}

export function detectEdges(leader: Leader): EdgeResult[] {
  const edges: EdgeResult[] = [];
  const trades = leader.recentTrades;
  const closedTrades = trades.filter((t) => t.status !== "Open");
  const winRate = leader.winRate;
  const rp = leader.riskProfile;

  // Information edge: very high win rate + high frequency + fast holding
  {
    let strength = 0;
    if (winRate > 75) strength += 40;
    else if (winRate > 70) strength += 25;
    else if (winRate > 65) strength += 10;

    if (leader.tradeFrequency === "Daily") strength += 20;
    else if (leader.tradeFrequency === "Weekly") strength += 10;

    const avgHolding = leader.behavioralProfile.avgWinHoldingHours;
    if (avgHolding < 48) strength += 25;
    else if (avgHolding < 120) strength += 15;
    else if (avgHolding < 240) strength += 5;

    if (strength > 40) {
      edges.push({
        type: "information",
        strength: clamp(strength, 0, 100),
        label: "Information Edge",
        evidence: "Consistently correct on binary outcomes before resolution",
      });
    }
  }

  // Analytical edge: top category concentration > 50% with high category win rate
  {
    const topCat = rp.topCategory;
    const topConc = rp.topCategoryConcentration;
    const catEntry = rp.categoryBreakdown.find((c) => c.category === topCat);
    // Derive approximate category win rate from pnl positivity and concentration
    const catPnlPositive = catEntry ? catEntry.pnl > 0 : false;

    let strength = 0;
    if (topConc > 50) strength += 30;
    else if (topConc > 35) strength += 15;

    if (catPnlPositive) strength += 25;
    if (winRate > 68) strength += 20;
    else if (winRate > 60) strength += 10;

    // Use categoryWinRates if available
    const rollingMetrics = leader.rollingMetrics;
    if ("categoryWinRates" in rollingMetrics) {
      const cwr = (rollingMetrics as { categoryWinRates: { category: string; winRate: number; tradeCount: number }[] }).categoryWinRates;
      const topCatWr = cwr.find((c) => c.category === topCat);
      if (topCatWr && topCatWr.winRate > 70) strength += 15;
    }

    if (strength > 40) {
      edges.push({
        type: "analytical",
        strength: clamp(strength, 0, 100),
        label: "Analytical Edge",
        evidence: `Deep expertise in ${topCat} with strong returns`,
      });
    }
  }

  // Timing edge: low avg entry price distance + good win rate
  {
    const avgEntryDist = closedTrades.length > 0
      ? closedTrades.reduce((s, t) => s + t.entryPriceDistance, 0) / closedTrades.length
      : 0.25;

    let strength = 0;
    // Low entry price distance means trading near 50/50 but still winning
    if (avgEntryDist < 0.1 && winRate > 65) strength += 45;
    else if (avgEntryDist < 0.15 && winRate > 60) strength += 30;
    else if (avgEntryDist < 0.2 && winRate > 65) strength += 20;

    if (winRate > 70) strength += 20;
    else if (winRate > 60) strength += 10;

    if (strength > 40) {
      edges.push({
        type: "timing",
        strength: clamp(strength, 0, 100),
        label: "Timing Edge",
        evidence: "Consistently enters at favorable prices",
      });
    }
  }

  // Contrarian edge: > 55% "No" positions with high win rate on them
  {
    const noTrades = closedTrades.filter((t) => t.position === "No");
    const noRatio = closedTrades.length > 0 ? noTrades.length / closedTrades.length : 0;
    const noWins = noTrades.filter((t) => t.status === "Won").length;
    const noWinRate = noTrades.length > 0 ? (noWins / noTrades.length) * 100 : 0;

    let strength = 0;
    if (noRatio > 0.55 && noWinRate > 60) {
      strength += 40;
      if (noWinRate > 70) strength += 25;
      else if (noWinRate > 65) strength += 15;
      if (noRatio > 0.65) strength += 15;
    }

    if (strength > 40) {
      edges.push({
        type: "contrarian",
        strength: clamp(strength, 0, 100),
        label: "Contrarian Edge",
        evidence: "Profits from betting against consensus",
      });
    }
  }

  // Unusual pattern: very high win rate in narrow category
  {
    const catTrades: Record<string, { wins: number; total: number }> = {};
    for (const t of closedTrades) {
      if (!catTrades[t.category]) catTrades[t.category] = { wins: 0, total: 0 };
      catTrades[t.category].total++;
      if (t.status === "Won") catTrades[t.category].wins++;
    }

    for (const [cat, data] of Object.entries(catTrades)) {
      if (data.total >= 5) {
        const catWR = (data.wins / data.total) * 100;
        if (catWR > 85) {
          edges.push({
            type: "unusual_pattern",
            strength: clamp(Math.round(catWR - 10), 0, 100),
            label: "Unusual Pattern",
            evidence: `Unusually high accuracy in ${cat} events`,
          });
          break; // Only flag once
        }
      }
    }
  }

  // If no edge found, return no_edge
  if (edges.length === 0) {
    edges.push({
      type: "no_edge",
      strength: 0,
      label: "No Clear Edge",
      evidence: "No statistically significant edge pattern detected",
    });
  }

  // Sort by strength descending
  edges.sort((a, b) => b.strength - a.strength);
  return edges;
}

export function classifyConsistency(leader: Leader): ConsistencyResult {
  const rollingValues = leader.rollingMetrics.rollingWinRate30d.map((r) => r.value);

  if (rollingValues.length === 0) {
    return {
      classification: "erratic",
      label: "Erratic",
      score: 0,
      trend: "stable",
    };
  }

  const sd = stddev(rollingValues);

  // Trend: compare first half vs second half
  const mid = Math.floor(rollingValues.length / 2);
  const firstHalf = rollingValues.slice(0, mid);
  const secondHalf = rollingValues.slice(mid);
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
  const diff = secondAvg - firstAvg;

  let trend: "improving" | "stable" | "declining";
  if (diff > 3) trend = "improving";
  else if (diff < -3) trend = "declining";
  else trend = "stable";

  // Score: base from stddev, adjusted by positive month ratio
  const positiveMonths = leader.monthlyReturns.filter((r) => r > 0).length;
  const positiveMonthRatio = positiveMonths / Math.max(leader.monthlyReturns.length, 1);
  let score = clamp(Math.round(100 - sd * 5 + positiveMonthRatio * 15), 0, 100);

  // Classification
  let classification: ConsistencyClass;
  let label: string;

  if (trend === "declining" && score > 50) {
    classification = "declining";
    label = "Declining";
    score = clamp(score - 10, 0, 100); // Penalize declining
  } else if (score >= 80) {
    classification = "elite";
    label = "Elite Consistency";
  } else if (score >= 60) {
    classification = "consistent";
    label = "Consistent";
  } else if (score >= 40) {
    classification = "streaky";
    label = "Streaky";
  } else {
    classification = "erratic";
    label = "Erratic";
  }

  return { classification, label, score, trend };
}

export function assessLuckVsSkill(leader: Leader): LuckSkillResult {
  const winRate = leader.winRate;
  const rp = leader.riskProfile;

  // Component 1: winRateVsExpected (25%)
  const winRateEdge = winRate - 50;
  let winRateVsExpected: number;
  if (winRateEdge > 20) winRateVsExpected = 15;
  else if (winRateEdge > 10) winRateVsExpected = 35;
  else if (winRateEdge > 5) winRateVsExpected = 55;
  else winRateVsExpected = 80;

  // Component 2: persistenceAcrossConditions (25%)
  const positiveCats = rp.categoryBreakdown.filter((c) => c.pnl > 0).length;
  let persistenceAcrossConditions: number;
  if (positiveCats >= 3) persistenceAcrossConditions = 20;
  else if (positiveCats === 2) persistenceAcrossConditions = 40;
  else if (positiveCats === 1) persistenceAcrossConditions = 65;
  else persistenceAcrossConditions = 90;

  // Component 3: sampleSizeStability (20%)
  const rollingValues = leader.rollingMetrics.rollingWinRate30d.map((r) => r.value);
  const mid = Math.floor(rollingValues.length / 2);
  const firstHalfAvg = rollingValues.length > 0
    ? rollingValues.slice(0, mid).reduce((a, b) => a + b, 0) / (mid || 1)
    : winRate;
  const secondHalfAvg = rollingValues.length > 0
    ? rollingValues.slice(mid).reduce((a, b) => a + b, 0) / (Math.max(rollingValues.length - mid, 1))
    : winRate;
  const halfDiff = firstHalfAvg - secondHalfAvg;
  let sampleSizeStability: number;
  if (secondHalfAvg >= firstHalfAvg) sampleSizeStability = 20;
  else if (halfDiff <= 5) sampleSizeStability = 50;
  else sampleSizeStability = 80;

  // Component 4: concentrationPenalty (15%)
  const topConc = rp.topCategoryConcentration;
  let concentrationPenalty: number;
  if (topConc > 70) concentrationPenalty = 70;
  else if (topConc >= 40) concentrationPenalty = 40;
  else concentrationPenalty = 20;

  // Component 5: streakNormality (15%)
  const currentStreak = leader.streak;
  const totalTrades = leader.totalTrades;
  const wr = winRate / 100;
  // Expected max streak ~ ln(totalTrades) / ln(1/wr)
  const expectedMaxStreak = wr > 0 && wr < 1
    ? Math.log(totalTrades) / Math.log(1 / wr)
    : 5;
  const streakRatio = expectedMaxStreak > 0 ? currentStreak / expectedMaxStreak : 1;
  let streakNormality: number;
  if (streakRatio < 1.5) streakNormality = 25;
  else if (streakRatio <= 2.5) streakNormality = 50;
  else streakNormality = 80;

  // Weighted average
  const luckScore = clamp(
    Math.round(
      winRateVsExpected * 0.25 +
      persistenceAcrossConditions * 0.25 +
      sampleSizeStability * 0.20 +
      concentrationPenalty * 0.15 +
      streakNormality * 0.15
    ),
    0,
    100,
  );

  const skillProbability = Number(((100 - luckScore) / 100).toFixed(2));

  let verdict: SkillVerdict;
  if (luckScore <= 20) verdict = "Skilled";
  else if (luckScore <= 35) verdict = "Likely Skilled";
  else if (luckScore <= 55) verdict = "Inconclusive";
  else if (luckScore <= 75) verdict = "Likely Lucky";
  else verdict = "Lucky";

  return {
    luckScore,
    skillProbability,
    verdict,
    components: {
      winRateVsExpected,
      persistenceAcrossConditions,
      sampleSizeStability,
      concentrationPenalty,
      streakNormality,
    },
  };
}

export function computeTraderClassification(leader: Leader): TraderClassification {
  const traderType = classifyTraderType(leader);
  const edges = detectEdges(leader);
  const primaryEdge = edges[0];
  const consistency = classifyConsistency(leader);
  const luckSkill = assessLuckVsSkill(leader);

  return {
    traderType,
    edges,
    primaryEdge,
    consistency,
    luckSkill,
  };
}
