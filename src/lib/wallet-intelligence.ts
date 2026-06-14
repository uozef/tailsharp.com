import type { Leader } from "./mock-data";

// === TYPES ===

export type WalletType =
  | "sharp"           // +EV, survives statistical scrutiny, CLV positive
  | "square"          // recreational, chases narratives, negative CLV
  | "lucky_monkey"    // hot streak indistinguishable from skill at small n
  | "market_maker"    // two-sided quoting, spread profits, not followable
  | "arbitrageur"     // exploits pricing inconsistencies, near-perfect win rate
  | "late_sweeper"    // buys at 97c on decided markets, gaudy win rate, tiny returns
  | "informed_flow"   // fresh wallet, large early correct bets on niche markets
  | "manipulator"     // wash trading, leaderboard farming signals
  | "hedger";         // offsetting external exposure, systematically -EV

export interface WalletFeatureVector {
  closingLineValue: number;        // avg CLV across all trades, +/- percentage points
  sampleSize: number;              // total resolved trades
  sizingEntropy: number;           // 0-1, how random/consistent position sizing is (low = disciplined)
  timingLeadLag: number;           // avg minutes between entry and subsequent price move. negative = before move (skill)
  twoSidedness: number;            // 0-1, ratio of markets where both Yes and No positions taken
  counterpartyConcentration: number; // 0-1, Herfindahl index of counterparties
  categoryHerfindahl: number;      // 0-1, concentration in categories (low = diversified, high = specialized)
  avgEntryDistanceFromClose: number; // how far entry was from closing price (lower = better entries)
  lateSweepRatio: number;          // % of trades entered when market was >90% resolved
  depositBlowPattern: number;      // 0-1, how much behavior matches deposit-and-lose cycles
  priceMovePrecession: number;     // % of trades where price moved in trader's direction within 2 hours of entry
}

export interface WalletClassification {
  primaryType: WalletType;
  confidence: number; // 0-100
  isFollowable: boolean;
  followabilityReason: string;
  label: string;
  description: string;
  featureVector: WalletFeatureVector;
  skillPercentile: number; // 0-100
  specialization: string;
  sampleSize: number;
}

export interface PsychAttribute {
  id: string;
  name: string;
  score: number;          // 0-100
  isStrength: boolean;
  description: string;
  evidence: string;
  icon: string;           // lucide icon name
}

export interface PsychologicalProfile {
  attributes: PsychAttribute[];
  overallScore: number;       // 0-100 composite
  dominantTrait: string;
  riskPersonality: "calculated" | "aggressive" | "fearful" | "erratic" | "disciplined";
}

export interface WalletIntelligence {
  wallet: WalletClassification;
  psychology: PsychologicalProfile;
}

// === HELPERS ===

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// Seeded PRNG (mulberry32) — mirrors the one in mock-data.ts
function createRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// === WALLET TYPE LABELS & DESCRIPTIONS ===

const walletTypeMeta: Record<WalletType, { label: string; description: string; followable: boolean; followReason: string }> = {
  sharp: {
    label: "Sharp",
    description: "Positive expected value. Survives CLV scrutiny with disciplined sizing and pre-move entries.",
    followable: true,
    followReason: "Demonstrated +EV edge with statistical significance",
  },
  square: {
    label: "Square",
    description: "Recreational bettor. Chases narratives, enters after moves, negative closing line value.",
    followable: true,
    followReason: "Followable but negative expected value — useful as a fade signal",
  },
  lucky_monkey: {
    label: "Lucky Monkey",
    description: "Hot streak on a small sample. Indistinguishable from skill until more data arrives.",
    followable: true,
    followReason: "Potentially skilled but insufficient data to confirm — follow with caution",
  },
  market_maker: {
    label: "Market Maker",
    description: "Two-sided quoting across markets. Profits from spread, not direction. Not copyable.",
    followable: false,
    followReason: "Two-sided flow cannot be replicated by copy-trading",
  },
  arbitrageur: {
    label: "Arbitrageur",
    description: "Exploits pricing inconsistencies with near-perfect win rate. Requires infrastructure to replicate.",
    followable: false,
    followReason: "Latency-dependent strategy not replicable via copy-trading",
  },
  late_sweeper: {
    label: "Late Sweeper",
    description: "Buys near-certainties at 97c. High win rate, negligible returns per trade.",
    followable: false,
    followReason: "Gaudy win rate masks tiny per-trade returns — slippage destroys follower edge",
  },
  informed_flow: {
    label: "Informed Flow",
    description: "Fresh wallet with large, early, correct bets concentrated in niche markets. Possible insider signal.",
    followable: true,
    followReason: "Potentially high-alpha signal source if information edge is genuine",
  },
  manipulator: {
    label: "Manipulator",
    description: "Wash trading and leaderboard farming signals detected. Metrics are fabricated.",
    followable: false,
    followReason: "Metrics are artificially inflated — following would lose money",
  },
  hedger: {
    label: "Hedger",
    description: "Offsetting external exposure. Systematically -EV on platform because value is captured elsewhere.",
    followable: false,
    followReason: "Deliberately -EV on platform — hedging external positions",
  },
};

// === ARCHETYPE MAPPING ===
// Maps known usernames to their intended wallet type for realistic mock data

const archetypeMap: Record<string, WalletType> = {
  quantnina: "sharp",
  macroman: "sharp",
  hedgefundguy: "sharp",
  greentrades: "sharp",
  globalista: "sharp",
  sciencebet: "informed_flow",
  weatherwatcher: "informed_flow",
  sportsoracle: "square",
  latamtrader: "lucky_monkey",
  cryptoqueen: "lucky_monkey",
  techprophet: "square",
  culturevulture: "square",
};

// === FEATURE VECTOR GENERATION ===

function generateFeatureVector(leader: Leader, localRng: () => number): WalletFeatureVector {
  const targetType = archetypeMap[leader.username] || "square";
  const bp = leader.behavioralProfile;
  const rp = leader.riskProfile;

  let closingLineValue: number;
  let sizingEntropy: number;
  let timingLeadLag: number;
  let twoSidedness: number;
  let counterpartyConcentration: number;
  let lateSweepRatio: number;
  let depositBlowPattern: number;
  let priceMovePrecession: number;

  switch (targetType) {
    case "sharp":
      closingLineValue = Number((3.5 + localRng() * 4.5).toFixed(2));            // 3.5-8.0%
      sizingEntropy = Number((0.08 + localRng() * 0.2).toFixed(3));              // 0.08-0.28
      timingLeadLag = Number((-30 - localRng() * 40).toFixed(1));                // -30 to -70 min
      twoSidedness = Number((0.02 + localRng() * 0.08).toFixed(3));              // 0.02-0.10
      counterpartyConcentration = Number((0.05 + localRng() * 0.15).toFixed(3)); // 0.05-0.20
      lateSweepRatio = Number((0.02 + localRng() * 0.06).toFixed(3));            // 0.02-0.08
      depositBlowPattern = Number((localRng() * 0.05).toFixed(3));               // 0.00-0.05
      priceMovePrecession = Number((56 + localRng() * 14).toFixed(1));           // 56-70%
      break;

    case "square":
      closingLineValue = Number((-1.5 - localRng() * 4).toFixed(2));             // -1.5 to -5.5%
      sizingEntropy = Number((0.5 + localRng() * 0.4).toFixed(3));               // 0.50-0.90
      timingLeadLag = Number((20 + localRng() * 40).toFixed(1));                 // 20-60 min (after move)
      twoSidedness = Number((0.01 + localRng() * 0.05).toFixed(3));              // 0.01-0.06
      counterpartyConcentration = Number((0.08 + localRng() * 0.15).toFixed(3)); // 0.08-0.23
      lateSweepRatio = Number((0.05 + localRng() * 0.12).toFixed(3));            // 0.05-0.17
      depositBlowPattern = Number((0.1 + localRng() * 0.3).toFixed(3));          // 0.10-0.40
      priceMovePrecession = Number((35 + localRng() * 12).toFixed(1));           // 35-47%
      break;

    case "lucky_monkey":
      closingLineValue = Number((0.5 + localRng() * 3).toFixed(2));              // 0.5-3.5% (looks good short term)
      sizingEntropy = Number((0.3 + localRng() * 0.35).toFixed(3));              // 0.30-0.65
      timingLeadLag = Number((-5 + localRng() * 25).toFixed(1));                 // -5 to 20 (mixed)
      twoSidedness = Number((0.03 + localRng() * 0.08).toFixed(3));              // 0.03-0.11
      counterpartyConcentration = Number((0.08 + localRng() * 0.2).toFixed(3));  // 0.08-0.28
      lateSweepRatio = Number((0.04 + localRng() * 0.1).toFixed(3));             // 0.04-0.14
      depositBlowPattern = Number((0.02 + localRng() * 0.1).toFixed(3));         // 0.02-0.12
      priceMovePrecession = Number((48 + localRng() * 12).toFixed(1));           // 48-60%
      break;

    case "informed_flow":
      closingLineValue = Number((2 + localRng() * 5).toFixed(2));                // 2-7%
      sizingEntropy = Number((0.15 + localRng() * 0.25).toFixed(3));             // 0.15-0.40
      timingLeadLag = Number((-40 - localRng() * 50).toFixed(1));                // -40 to -90 (very early)
      twoSidedness = Number((0.01 + localRng() * 0.04).toFixed(3));              // 0.01-0.05
      counterpartyConcentration = Number((0.1 + localRng() * 0.15).toFixed(3));  // 0.10-0.25
      lateSweepRatio = Number((0.01 + localRng() * 0.04).toFixed(3));            // 0.01-0.05
      depositBlowPattern = Number((localRng() * 0.05).toFixed(3));               // 0.00-0.05
      priceMovePrecession = Number((66 + localRng() * 12).toFixed(1));           // 66-78%
      break;

    default:
      closingLineValue = Number((-0.5 + localRng() * 2 - 1).toFixed(2));
      sizingEntropy = Number((0.3 + localRng() * 0.5).toFixed(3));
      timingLeadLag = Number((localRng() * 30).toFixed(1));
      twoSidedness = Number((0.02 + localRng() * 0.1).toFixed(3));
      counterpartyConcentration = Number((0.05 + localRng() * 0.25).toFixed(3));
      lateSweepRatio = Number((0.05 + localRng() * 0.15).toFixed(3));
      depositBlowPattern = Number((0.05 + localRng() * 0.2).toFixed(3));
      priceMovePrecession = Number((40 + localRng() * 15).toFixed(1));
      break;
  }

  // Category Herfindahl from existing risk profile
  const catBreakdown = rp.categoryBreakdown;
  const categoryHerfindahl = catBreakdown.reduce((sum, c) => sum + (c.percentage / 100) ** 2, 0);

  // Average entry distance from close — derive from trades
  const closedTrades = leader.recentTrades.filter((t) => t.status !== "Open");
  const avgEntryDistanceFromClose = closedTrades.length > 0
    ? Number((closedTrades.reduce((s, t) => s + t.entryPriceDistance, 0) / closedTrades.length).toFixed(4))
    : Number((0.1 + localRng() * 0.2).toFixed(4));

  return {
    closingLineValue,
    sampleSize: leader.totalTrades,
    sizingEntropy,
    timingLeadLag,
    twoSidedness,
    counterpartyConcentration,
    categoryHerfindahl: Number(Math.min(1, categoryHerfindahl).toFixed(4)),
    avgEntryDistanceFromClose,
    lateSweepRatio,
    depositBlowPattern,
    priceMovePrecession,
  };
}

// === WALLET CLASSIFICATION ===

function scoreWalletType(fv: WalletFeatureVector, leader: Leader): { type: WalletType; score: number }[] {
  const scores: { type: WalletType; score: number }[] = [];

  // Sharp: CLV > 3%, sampleSize > 200, sizingEntropy < 0.3, timingLeadLag < -10, priceMovePrecession > 55%
  {
    let s = 0;
    if (fv.closingLineValue > 3) s += 25;
    else if (fv.closingLineValue > 1) s += 10;
    if (fv.sampleSize > 200) s += 20;
    else if (fv.sampleSize > 100) s += 10;
    if (fv.sizingEntropy < 0.3) s += 20;
    else if (fv.sizingEntropy < 0.5) s += 8;
    if (fv.timingLeadLag < -10) s += 20;
    else if (fv.timingLeadLag < 0) s += 8;
    if (fv.priceMovePrecession > 55) s += 15;
    else if (fv.priceMovePrecession > 50) s += 5;
    scores.push({ type: "sharp", score: s });
  }

  // Square: CLV < -1%, fomoScore > 40, timingLeadLag > 20, sizing correlates with recent wins
  {
    let s = 0;
    if (fv.closingLineValue < -1) s += 25;
    else if (fv.closingLineValue < 0) s += 10;
    if (leader.behavioralProfile.fomoScore > 40) s += 20;
    else if (leader.behavioralProfile.fomoScore > 25) s += 10;
    if (fv.timingLeadLag > 20) s += 20;
    else if (fv.timingLeadLag > 5) s += 8;
    if (fv.sizingEntropy > 0.5) s += 15;
    else if (fv.sizingEntropy > 0.35) s += 5;
    if (fv.depositBlowPattern > 0.1) s += 10;
    if (fv.priceMovePrecession < 48) s += 10;
    scores.push({ type: "square", score: s });
  }

  // Lucky Monkey: sampleSize < 100 AND winRate > 65%, performance degrades
  {
    let s = 0;
    if (fv.sampleSize < 100 && leader.winRate > 65) s += 40;
    else if (fv.sampleSize < 150 && leader.winRate > 60) s += 20;
    // Check rolling win rate degradation (second half < first half)
    const rollingValues = leader.rollingMetrics.rollingWinRate30d.map((r) => r.value);
    if (rollingValues.length >= 4) {
      const mid = Math.floor(rollingValues.length / 2);
      const firstAvg = rollingValues.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const secondAvg = rollingValues.slice(mid).reduce((a, b) => a + b, 0) / (rollingValues.length - mid);
      if (firstAvg - secondAvg > 3) s += 25;
      else if (firstAvg - secondAvg > 0) s += 10;
    }
    if (fv.closingLineValue > 0 && fv.closingLineValue < 3) s += 15;
    if (fv.sizingEntropy > 0.3 && fv.sizingEntropy < 0.7) s += 10;
    scores.push({ type: "lucky_monkey", score: s });
  }

  // Market Maker: twoSidedness > 0.3, high frequency, near-zero net directional exposure
  {
    let s = 0;
    if (fv.twoSidedness > 0.3) s += 40;
    else if (fv.twoSidedness > 0.15) s += 15;
    if (leader.totalTrades > 500) s += 20;
    else if (leader.totalTrades > 300) s += 10;
    if (Math.abs(fv.closingLineValue) < 0.5) s += 20;
    if (fv.counterpartyConcentration < 0.1) s += 10;
    scores.push({ type: "market_maker", score: s });
  }

  // Arbitrageur: winRate > 90% AND avgEntryDistanceFromClose < 0.05 AND high frequency
  {
    let s = 0;
    if (leader.winRate > 90 && fv.avgEntryDistanceFromClose < 0.05) s += 50;
    else if (leader.winRate > 85 && fv.avgEntryDistanceFromClose < 0.08) s += 25;
    if (leader.totalTrades > 400) s += 20;
    if (fv.closingLineValue > 0 && fv.closingLineValue < 1) s += 15;
    scores.push({ type: "arbitrageur", score: s });
  }

  // Late Sweeper: lateSweepRatio > 0.4, winRate > 85%, very small avg PnL
  {
    let s = 0;
    if (fv.lateSweepRatio > 0.4) s += 40;
    else if (fv.lateSweepRatio > 0.2) s += 15;
    if (leader.winRate > 85) s += 25;
    else if (leader.winRate > 80) s += 10;
    // Small avg PnL per trade
    const avgPnlPerTrade = leader.roi * leader.totalCapital / 100 / Math.max(leader.totalTrades, 1);
    if (avgPnlPerTrade < 20) s += 20;
    else if (avgPnlPerTrade < 50) s += 10;
    scores.push({ type: "late_sweeper", score: s });
  }

  // Informed Flow: sampleSize < 150 AND priceMovePrecession > 65% AND high concentration in niche
  {
    let s = 0;
    if (fv.sampleSize < 150 && fv.priceMovePrecession > 65) s += 40;
    else if (fv.sampleSize < 250 && fv.priceMovePrecession > 60) s += 20;
    if (fv.categoryHerfindahl > 0.3) s += 20;
    else if (fv.categoryHerfindahl > 0.2) s += 10;
    if (fv.timingLeadLag < -30) s += 20;
    else if (fv.timingLeadLag < -10) s += 10;
    if (fv.closingLineValue > 2) s += 10;
    scores.push({ type: "informed_flow", score: s });
  }

  // Manipulator: counterpartyConcentration > 0.5 AND depositBlowPattern > 0.3
  {
    let s = 0;
    if (fv.counterpartyConcentration > 0.5) s += 35;
    else if (fv.counterpartyConcentration > 0.3) s += 15;
    if (fv.depositBlowPattern > 0.3) s += 30;
    else if (fv.depositBlowPattern > 0.15) s += 10;
    // Suspicious: high win rate with high deposit blow pattern
    if (leader.winRate > 70 && fv.depositBlowPattern > 0.2) s += 15;
    scores.push({ type: "manipulator", score: s });
  }

  // Hedger: systematically -EV, position sizes don't correlate with conviction
  {
    let s = 0;
    if (fv.closingLineValue < -2) s += 25;
    else if (fv.closingLineValue < 0) s += 10;
    if (fv.sizingEntropy > 0.6) s += 15; // random sizing
    // Low correlation between entry distance and size (hard to check without raw data, use proxy)
    if (fv.twoSidedness > 0.15) s += 20;
    if (leader.roi < 10 && leader.winRate < 55) s += 25;
    scores.push({ type: "hedger", score: s });
  }

  return scores;
}

export function classifyWallet(leader: Leader): WalletClassification {
  const localRng = createRng(31415 + Number(leader.id) * 137);
  const featureVector = generateFeatureVector(leader, localRng);

  const typeScores = scoreWalletType(featureVector, leader);
  typeScores.sort((a, b) => b.score - a.score);

  const topType = typeScores[0];
  const secondType = typeScores[1];
  const confidence = clamp(
    Math.round(((topType.score - secondType.score) / Math.max(topType.score, 1)) * 100),
    15,
    95,
  );

  const meta = walletTypeMeta[topType.type];

  // Skill percentile: composite of CLV, win rate, sample size, Sharpe
  const clvComponent = clamp((featureVector.closingLineValue + 5) * 8, 0, 100);
  const wrComponent = clamp((leader.winRate - 45) * 2.5, 0, 100);
  const sampleComponent = clamp(leader.totalTrades / 8, 0, 100);
  const sharpeComponent = clamp(leader.sharpeRatio * 30, 0, 100);
  const skillPercentile = clamp(
    Math.round(clvComponent * 0.4 + wrComponent * 0.25 + sampleComponent * 0.15 + sharpeComponent * 0.2),
    1,
    99,
  );

  // Specialization
  const rp = leader.riskProfile;
  const topCatConc = rp.topCategoryConcentration;
  const specialization = topCatConc > 50
    ? `${rp.topCategory.toLowerCase()}-specialized`
    : topCatConc > 35
      ? `${rp.topCategory.toLowerCase()}-leaning`
      : "diversified";

  return {
    primaryType: topType.type,
    confidence,
    isFollowable: meta.followable,
    followabilityReason: meta.followReason,
    label: meta.label,
    description: meta.description,
    featureVector,
    skillPercentile,
    specialization,
    sampleSize: leader.totalTrades,
  };
}

// === PSYCHOLOGICAL PROFILE ===

export function profilePsychology(leader: Leader): PsychologicalProfile {
  const bp = leader.behavioralProfile;
  const rp = leader.riskProfile;
  const trades = leader.recentTrades;
  const closedTrades = trades.filter((t) => t.status !== "Open");

  // 1. Emotional Resilience
  const postLossTrades = closedTrades.filter((t) => t.previousTradeResult === "Lost");
  const postLossWins = postLossTrades.filter((t) => t.status === "Won").length;
  const postLossWinRate = postLossTrades.length > 0
    ? (postLossWins / postLossTrades.length) * 100
    : 50;
  const resilienceScore = clamp(
    Math.round((100 - bp.revengeTradingRate) * 0.5 + (100 - (bp.tiltRatio - 0.9) * 80) * 0.3 + postLossWinRate * 0.2),
    0,
    100,
  );

  // 2. Discipline
  const disciplineScore = clamp(Math.round(bp.disciplineScore), 0, 100);

  // 3. Patience
  const avgHolding = bp.avgWinHoldingHours;
  // Category average holding ~ 100 hours as baseline
  const categoryAvgHolding = 100;
  const holdingRatio = avgHolding / categoryAvgHolding;
  const patienceScore = clamp(
    Math.round(holdingRatio * 40 + (leader.tradeFrequency === "Monthly" ? 30 : leader.tradeFrequency === "Weekly" ? 15 : 0) + (100 - bp.fomoScore) * 0.3),
    0,
    100,
  );
  const holdingDiffPct = Math.round((holdingRatio - 1) * 100);

  // 4. Conviction
  const avgEntryDist = closedTrades.length > 0
    ? closedTrades.reduce((s, t) => s + t.entryPriceDistance, 0) / closedTrades.length
    : 0.15;
  const convictionScore = clamp(Math.round(avgEntryDist * 400), 0, 100);

  // 5. Loss Aversion
  const lossAversionScore = clamp(
    Math.round(bp.dispositionRatio * 40 + bp.lossAversionRatio * 15),
    0,
    100,
  );
  const holdRatio = bp.avgLossHoldingHours / Math.max(bp.avgWinHoldingHours, 1);

  // 6. FOMO Susceptibility
  const fomoScore = clamp(Math.round(bp.fomoScore), 0, 100);

  // 7. Overconfidence
  // Proxy: tilt ratio > 1 means sizing up after wins
  const overconfidenceScore = clamp(
    Math.round(
      (bp.tiltRatio > 1 ? (bp.tiltRatio - 1) * 120 : 0) +
      rp.martingaleScore * 0.3 +
      (bp.overtradingSpikeFactor > 1.5 ? 20 : 0),
    ),
    0,
    100,
  );
  const sizeUpPct = Math.round((bp.tiltRatio - 1) * 100);

  // 8. Adaptability
  const catWinRates = leader.rollingMetrics.categoryWinRates;
  const profitableCats = catWinRates.filter((c) => c.winRate > 50).length;
  const totalCats = catWinRates.length;
  const adaptabilityScore = clamp(
    Math.round(
      (profitableCats / Math.max(totalCats, 1)) * 60 +
      (100 - rp.strategyDriftScore) * 0.2 +
      (leader.riskProfile.winRateTrend > 0 ? 15 : 0),
    ),
    0,
    100,
  );

  // 9. Risk Calibration
  // Optimal kelly fraction vs actual sizing
  const avgWin = closedTrades.filter((t) => t.status === "Won").length > 0
    ? closedTrades.filter((t) => t.status === "Won").reduce((s, t) => s + t.pnl, 0) / closedTrades.filter((t) => t.status === "Won").length
    : 500;
  const avgLoss = closedTrades.filter((t) => t.status === "Lost").length > 0
    ? Math.abs(closedTrades.filter((t) => t.status === "Lost").reduce((s, t) => s + t.pnl, 0) / closedTrades.filter((t) => t.status === "Lost").length)
    : 300;
  const kellyFraction = Math.max(0, Math.min(0.25, ((leader.winRate / 100) * (avgWin / avgLoss) - (1 - leader.winRate / 100)) / (avgWin / avgLoss)));
  const optimalSizePct = kellyFraction * 100;
  const actualAvgSizePct = closedTrades.length > 0
    ? closedTrades.reduce((s, t) => s + t.sizeAsPercentOfCapital, 0) / closedTrades.length
    : 2;
  const kellyDeviation = optimalSizePct > 0 ? Math.abs(actualAvgSizePct - optimalSizePct) / optimalSizePct : 0.5;
  const riskCalibrationScore = clamp(Math.round(100 - kellyDeviation * 60), 0, 100);
  const kellyPct = optimalSizePct > 0 ? Math.round((actualAvgSizePct / optimalSizePct) * 100) : 50;

  // 10. Focus
  const focusScore = clamp(Math.round(rp.topCategoryConcentration), 0, 100);

  const attributes: PsychAttribute[] = [
    {
      id: "emotional_resilience",
      name: "Emotional Resilience",
      score: resilienceScore,
      isStrength: resilienceScore >= 60,
      description: resilienceScore >= 70
        ? "Handles losses exceptionally well, minimal tilt"
        : resilienceScore >= 40
          ? "Average loss recovery, some emotional trading"
          : "Prone to tilt and revenge trading after losses",
      evidence: `${Math.round(postLossWinRate)}% of trades after a loss were profitable`,
      icon: "shield",
    },
    {
      id: "discipline",
      name: "Discipline",
      score: disciplineScore,
      isStrength: disciplineScore >= 65,
      description: disciplineScore >= 75
        ? "Highly disciplined — consistent sizing and rules-based approach"
        : disciplineScore >= 50
          ? "Moderately disciplined with occasional lapses"
          : "Inconsistent execution and position sizing",
      evidence: `Position sizes stay within ${clamp(Math.round(100 - disciplineScore), 5, 80)}% of average`,
      icon: "target",
    },
    {
      id: "patience",
      name: "Patience",
      score: patienceScore,
      isStrength: patienceScore >= 55,
      description: patienceScore >= 70
        ? "Very patient — waits for optimal entries and holds positions"
        : patienceScore >= 40
          ? "Average patience, sometimes enters prematurely"
          : "Impatient — frequent trades and short holding periods",
      evidence: `Avg hold: ${Math.round(avgHolding)} hours, ${holdingDiffPct >= 0 ? `${holdingDiffPct}%` : `${Math.abs(holdingDiffPct)}%`} ${holdingDiffPct >= 0 ? "longer" : "shorter"} than category avg`,
      icon: "clock",
    },
    {
      id: "conviction",
      name: "Conviction",
      score: convictionScore,
      isStrength: convictionScore >= 30 && convictionScore <= 70,
      description: convictionScore >= 60
        ? "High conviction — enters at extreme prices, strong directional views"
        : convictionScore >= 30
          ? "Moderate conviction — balanced entry positioning"
          : "Low conviction — trades near midpoint, hedged positioning",
      evidence: `Avg entry distance: ${avgEntryDist.toFixed(3)} from fair value`,
      icon: "flame",
    },
    {
      id: "loss_aversion",
      name: "Loss Aversion",
      score: lossAversionScore,
      isStrength: lossAversionScore < 45,
      description: lossAversionScore >= 60
        ? "Highly loss averse — holds losers too long, cuts winners early"
        : lossAversionScore >= 35
          ? "Moderate loss aversion — some disposition effect"
          : "Rational loss handling — appropriate exit decisions",
      evidence: `Holds losers ${holdRatio.toFixed(1)}x longer than winners`,
      icon: "shield-alert",
    },
    {
      id: "fomo_susceptibility",
      name: "FOMO Susceptibility",
      score: fomoScore,
      isStrength: fomoScore < 30,
      description: fomoScore >= 50
        ? "Highly susceptible to FOMO — chases hype and volume spikes"
        : fomoScore >= 25
          ? "Some FOMO tendencies on high-profile markets"
          : "Immune to hype — disciplined entry criteria",
      evidence: `${fomoScore}% of entries coincide with volume spikes`,
      icon: "trending-up",
    },
    {
      id: "overconfidence",
      name: "Overconfidence",
      score: overconfidenceScore,
      isStrength: overconfidenceScore < 30,
      description: overconfidenceScore >= 50
        ? "Overconfident — significantly sizes up after winning streaks"
        : overconfidenceScore >= 25
          ? "Mildly overconfident — slight increase in sizing after wins"
          : "Well-calibrated confidence — sizing stays consistent",
      evidence: `Sizes up ${Math.abs(sizeUpPct)}% after winning streaks`,
      icon: "trophy",
    },
    {
      id: "adaptability",
      name: "Adaptability",
      score: adaptabilityScore,
      isStrength: adaptabilityScore >= 55,
      description: adaptabilityScore >= 65
        ? "Highly adaptable — profitable across multiple market categories"
        : adaptabilityScore >= 40
          ? "Moderately adaptable — some category dependence"
          : "Low adaptability — results concentrated in one category",
      evidence: `Profitable in ${profitableCats} of ${totalCats} categories traded`,
      icon: "shuffle",
    },
    {
      id: "risk_calibration",
      name: "Risk Calibration",
      score: riskCalibrationScore,
      isStrength: riskCalibrationScore >= 55,
      description: riskCalibrationScore >= 70
        ? "Excellent risk calibration — sizing near Kelly optimal"
        : riskCalibrationScore >= 40
          ? "Moderate calibration — some over- or under-betting"
          : "Poor calibration — significantly over- or under-sizing positions",
      evidence: `Avg position size is ${kellyPct}% of Kelly optimal`,
      icon: "scale",
    },
    {
      id: "focus",
      name: "Focus",
      score: focusScore,
      isStrength: focusScore >= 40 && focusScore <= 75,
      description: focusScore >= 65
        ? `Highly focused — deep specialization in ${rp.topCategory}`
        : focusScore >= 35
          ? `Moderately focused — ${rp.topCategory} primary with some diversification`
          : "Broadly diversified — no dominant category",
      evidence: `${Math.round(rp.topCategoryConcentration)}% of trades in ${rp.topCategory}`,
      icon: "crosshair",
    },
  ];

  // Overall composite: weighted average of "good" attributes
  const overallScore = clamp(
    Math.round(
      resilienceScore * 0.15 +
      disciplineScore * 0.15 +
      patienceScore * 0.1 +
      (100 - lossAversionScore) * 0.1 +
      (100 - fomoScore) * 0.1 +
      (100 - overconfidenceScore) * 0.1 +
      adaptabilityScore * 0.1 +
      riskCalibrationScore * 0.1 +
      convictionScore * 0.05 +
      focusScore * 0.05,
    ),
    0,
    100,
  );

  // Dominant trait: highest absolute signal
  const sorted = [...attributes].sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50));
  const dominantTrait = sorted[0].name;

  // Risk personality
  let riskPersonality: PsychologicalProfile["riskPersonality"];
  if (disciplineScore >= 70 && resilienceScore >= 65 && overconfidenceScore < 30) {
    riskPersonality = "disciplined";
  } else if (disciplineScore >= 60 && riskCalibrationScore >= 55) {
    riskPersonality = "calculated";
  } else if (fomoScore >= 50 || overconfidenceScore >= 50) {
    riskPersonality = "aggressive";
  } else if (lossAversionScore >= 60 && patienceScore < 35) {
    riskPersonality = "fearful";
  } else {
    riskPersonality = "erratic";
  }

  return {
    attributes,
    overallScore,
    dominantTrait,
    riskPersonality,
  };
}

// === COMBINED INTELLIGENCE ===

export function computeWalletIntelligence(leader: Leader): WalletIntelligence {
  const wallet = classifyWallet(leader);
  const psychology = profilePsychology(leader);
  return { wallet, psychology };
}
