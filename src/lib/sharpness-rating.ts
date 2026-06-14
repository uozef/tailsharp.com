import type { Leader } from "./mock-data";

// ============================================================
// APPENDIX A — Feature Dictionary
// ============================================================

export interface FeatureDictionary {
  // Skill / CLV family
  clv_mean_w: number;      // Size-weighted mean of logit(c) - logit(p) across fills
  clv_t: number;           // t-statistic of CLV against zero, thesis-clustered SEs

  // Sizing family
  kelly_corr: number;      // corr(stake, per-trade CLV) — conviction-edge correlation
  result_react: number;    // β of stake_t on trailing realised P&L (target ≈ 0)
  stake_entropy: number;   // Entropy of stake distribution (0-1, lower = more disciplined)

  // Timing family
  lead_1h_72h: number;     // Post-entry drift toward entity's side (positive = leads)
  chase_score: number;     // Share of entries in top decile of trailing price moves (0-1)

  // Selection family
  cat_hhi: number;         // Herfindahl of activity over market categories (0-1)
  abstain_elast: number;   // Activity elasticity to market dislocation (higher = more selective)

  // Transience family
  tilt_index: number;      // Composite: loss-escalation, interval-shrink, session drift (0-1)
  streak_z: number;        // Runs-test z-score vs binomial null (>2 = suspicious clustering)
  thesis_conc: number;     // Share of P&L attributable to largest correlated thesis (0-1)

  // Structure family
  two_sided: number;       // Same-market opposite-side volume share (maker flag, 0-1)
  cp_conc: number;         // Profit share vs k most frequent counterparties (wash flag, 0-1)

  // Clustering family
  fund_cluster: string;    // Entity ID from funding-graph
}

// ============================================================
// SECTION 3 — Participant Taxonomy
// ============================================================

export type ParticipantType =
  | "sharp"
  | "square"
  | "lucky_monkey"
  | "market_maker"
  | "arbitrageur"
  | "late_sweeper"
  | "likely_informed"
  | "manipulator"
  | "hedger";

export interface ParticipantTyping {
  primaryType: ParticipantType;
  typePosteriors: Record<ParticipantType, number>;
  isEligibleForRanking: boolean;
  rankExclusionReason: string | null;
  label: string;
  economicRole: string;
}

// ============================================================
// SECTION 4 — Skill Signals
// ============================================================

export interface SkillSignals {
  clvMeanWeighted: number;
  clvTStat: number;
  clvStabilityAcrossTheses: number;

  convictionEdgeCorr: number;
  resultReactivity: number;

  timingLead: number;
  leadDistributionStability: number;

  categoryConcentration: number;
  abstentionElasticity: number;
  withinSpecialtyEdge: number;
}

// ============================================================
// SECTION 5 — Transience Signals
// ============================================================

export interface TransienceSignals {
  tiltIndex: number;
  streakZScore: number;
  thesisConcentration: number;
  formVsBaseline: number;
  edgeDecayRate: number;
}

// ============================================================
// SECTION 6 — The Sharpness Rating
// ============================================================

export interface SharpnessRating {
  posteriorMean: number;
  posteriorStdDev: number;
  lowerConfidenceBound: number;
  probPositiveEdge: number;

  rating: number;
  effectiveSampleSize: number;
  specialtyDecomposition: { category: string; clv: number; weight: number }[];
  evidenceSummary: string;

  rank: number;
  percentile: number;
}

// ============================================================
// SECTION 7 — Integrity Signals
// ============================================================

export interface IntegritySignals {
  washTradingRisk: number;
  sybilRisk: number;
  selectiveDisplayRisk: number;
  overallIntegrity: number;
  flags: string[];
}

// ============================================================
// Combined output
// ============================================================

export interface SharpnessProfile {
  features: FeatureDictionary;
  typing: ParticipantTyping;
  skillSignals: SkillSignals;
  transienceSignals: TransienceSignals;
  rating: SharpnessRating;
  integrity: IntegritySignals;

  // ── Flattened convenience fields for backward-compatible component access ──
  /** Composite rating 0-100 (alias for rating.rating) */
  ratingScore: number;
  /** Rank among eligible participants (0 if not ranked) */
  rank: number | null;
  /** Total ranked participants */
  totalRanked: number;
  /** Percentile (0-100, null if not ranked) */
  percentile: number | null;
  /** Participant classification */
  participantType: ParticipantType;
  /** Whether participant is eligible for the ranking */
  eligible: boolean;
  /** Reason for ineligibility, if applicable */
  ineligibilityReason: string | null;

  /** CLV section for card display */
  clv: {
    clv: number;
    tStatistic: number;
    pValue: number;
    effectiveSampleSize: number;
  };

  /** Transience section for card display */
  transience: {
    tiltIndex: number;
    streakZ: number;
    thesisConcentration: number;
    edgeHalfLifeMonths: number | null;
  };

  /** Integrity section for card display */
  integrityDisplay: {
    score: number;
    flags: string[];
  };

  /** Human-readable evidence summary */
  evidenceSummary: string;
}

// ============================================================
// HELPERS
// ============================================================

function createRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ============================================================
// Display helpers (used by components)
// ============================================================

export function ratingColor(rating: number): string {
  if (rating > 70) return "var(--grade-a)";
  if (rating > 40) return "var(--warning)";
  return "var(--danger)";
}

export function ratingLabel(rating: number): string {
  if (rating > 70) return "Sharp";
  if (rating > 40) return "Moderate";
  return "Weak";
}

export function clvSignificanceStars(pValue: number): string {
  if (pValue < 0.01) return "\u2605\u2605\u2605";
  if (pValue < 0.05) return "\u2605\u2605";
  if (pValue < 0.10) return "\u2605";
  return "";
}

export function dotColor(
  value: number,
  thresholds: { green: number; amber: number },
): string {
  if (value < thresholds.green) return "var(--grade-a)";
  if (value < thresholds.amber) return "var(--warning)";
  return "var(--danger)";
}

export const participantTypeLabels: Record<ParticipantType, string> = {
  sharp: "Sharp",
  square: "Square",
  lucky_monkey: "Lucky Monkey",
  market_maker: "Market Maker",
  arbitrageur: "Arbitrageur",
  late_sweeper: "Late Sweeper",
  likely_informed: "Likely Informed",
  manipulator: "Manipulator",
  hedger: "Hedger",
};

// ============================================================
// Archetype-specific presets
// ============================================================

interface ArchetypePreset {
  clvBase: number;
  clvSpread: number;
  kellyBase: number;
  leadBase: number;
  chaseBase: number;
  tiltBase: number;
  abstainBase: number;
  type: ParticipantType;
}

const archetypePresets: Record<string, ArchetypePreset> = {
  greentrades:    { clvBase: 0.035, clvSpread: 0.01,  kellyBase: 0.41, leadBase: -25, chaseBase: 0.12, tiltBase: 0.10, abstainBase: 0.65, type: "sharp" },
  cryptoqueen:    { clvBase: 0.018, clvSpread: 0.008, kellyBase: 0.28, leadBase: -12, chaseBase: 0.22, tiltBase: 0.25, abstainBase: 0.40, type: "sharp" },
  macroman:       { clvBase: 0.048, clvSpread: 0.008, kellyBase: 0.55, leadBase: -35, chaseBase: 0.08, tiltBase: 0.06, abstainBase: 0.78, type: "sharp" },
  sportsoracle:   { clvBase: -0.025, clvSpread: 0.01,  kellyBase: 0.05, leadBase: 18,  chaseBase: 0.55, tiltBase: 0.62, abstainBase: 0.15, type: "square" },
  techprophet:    { clvBase: 0.022, clvSpread: 0.01,  kellyBase: 0.30, leadBase: -15, chaseBase: 0.20, tiltBase: 0.20, abstainBase: 0.50, type: "sharp" },
  globalista:     { clvBase: 0.032, clvSpread: 0.008, kellyBase: 0.38, leadBase: -22, chaseBase: 0.14, tiltBase: 0.12, abstainBase: 0.72, type: "sharp" },
  culturevulture: { clvBase: -0.015, clvSpread: 0.01,  kellyBase: 0.10, leadBase: 12,  chaseBase: 0.42, tiltBase: 0.45, abstainBase: 0.22, type: "square" },
  sciencebet:     { clvBase: 0.038, clvSpread: 0.012, kellyBase: 0.45, leadBase: -40, chaseBase: 0.10, tiltBase: 0.08, abstainBase: 0.80, type: "sharp" },
  latamtrader:    { clvBase: 0.005, clvSpread: 0.015, kellyBase: 0.12, leadBase: 5,   chaseBase: 0.35, tiltBase: 0.40, abstainBase: 0.25, type: "lucky_monkey" },
  quantnina:      { clvBase: 0.052, clvSpread: 0.008, kellyBase: 0.58, leadBase: -30, chaseBase: 0.06, tiltBase: 0.05, abstainBase: 0.82, type: "sharp" },
  hedgefundguy:   { clvBase: 0.035, clvSpread: 0.01,  kellyBase: 0.42, leadBase: -20, chaseBase: 0.15, tiltBase: 0.15, abstainBase: 0.60, type: "sharp" },
  weatherwatcher: { clvBase: 0.020, clvSpread: 0.012, kellyBase: 0.25, leadBase: -18, chaseBase: 0.25, tiltBase: 0.22, abstainBase: 0.45, type: "likely_informed" },
};

// ============================================================
// COMPUTATION — Feature Dictionary
// ============================================================

export function computeFeatureDictionary(leader: Leader): FeatureDictionary {
  const localRng = createRng(92731 + Number(leader.id) * 257);
  const preset = archetypePresets[leader.username];
  const fv = leader.walletIntelligence.wallet.featureVector;
  const bp = leader.behavioralProfile;
  const rp = leader.riskProfile;

  // CLV family
  const clv_mean_w = preset
    ? Number((preset.clvBase + (localRng() - 0.5) * preset.clvSpread).toFixed(4))
    : Number((fv.closingLineValue / 100).toFixed(4));

  const topCatShare = rp.topCategoryConcentration / 100;
  const thesisConc = topCatShare > 0.6 ? topCatShare * 0.8 : topCatShare * 0.5;
  const effectiveN = Math.max(20, Math.round(leader.totalTrades * (1 - thesisConc * 0.4)));
  const sigma = Math.max(0.01, 0.04 + localRng() * 0.03);
  const clv_t = Number((clv_mean_w * Math.sqrt(effectiveN) / sigma).toFixed(2));

  // Sizing family
  const kelly_corr = preset
    ? Number((preset.kellyBase + (localRng() - 0.5) * 0.08).toFixed(3))
    : Number((clamp(bp.disciplineScore / 100 * 0.6, 0.05, 0.6) + (localRng() - 0.5) * 0.1).toFixed(3));

  const tiltDeviation = Math.abs(bp.tiltRatio - 1.0);
  const result_react = Number((tiltDeviation * (localRng() > 0.5 ? 1 : -1) + (localRng() - 0.5) * 0.05).toFixed(3));

  const stake_entropy = Number(fv.sizingEntropy.toFixed(3));

  // Timing family
  const lead_1h_72h = preset
    ? Number((preset.leadBase + (localRng() - 0.5) * 10).toFixed(1))
    : Number(fv.timingLeadLag.toFixed(1));

  const chase_score = preset
    ? Number((preset.chaseBase + (localRng() - 0.5) * 0.06).toFixed(3))
    : Number(clamp(1 - (fv.timingLeadLag < 0 ? 0.8 : 0.3) + localRng() * 0.2, 0, 1).toFixed(3));

  // Selection family
  const cat_hhi = Number(fv.categoryHerfindahl.toFixed(4));

  const abstain_elast = preset
    ? Number((preset.abstainBase + (localRng() - 0.5) * 0.1).toFixed(3))
    : Number(clamp((bp.disciplineScore / 100) * 0.8 - (bp.fomoScore / 100) * 0.4 + localRng() * 0.15, 0, 1).toFixed(3));

  // Transience family
  const tilt_index = preset
    ? Number(clamp(preset.tiltBase + (localRng() - 0.5) * 0.06, 0, 1).toFixed(3))
    : Number(clamp(tiltDeviation * 0.8 + bp.revengeTradingRate / 100 * 0.3 + (localRng() - 0.5) * 0.1, 0, 1).toFixed(3));

  const p = leader.winRate / 100;
  const n = leader.totalTrades;
  const expectedRuns = 1 + 2 * n * p * (1 - p);
  const runsStdDev = Math.sqrt(Math.max(1, 2 * n * p * (1 - p) * (2 * n * p * (1 - p) - n)) / Math.max(1, (n - 1)));
  const observedRuns = expectedRuns - leader.streak * 1.5 + (localRng() - 0.5) * 5;
  const streak_z = Number(clamp(Math.abs((observedRuns - expectedRuns) / Math.max(runsStdDev, 1)), 0, 4).toFixed(2));

  const thesis_conc = Number(clamp(thesisConc, 0, 1).toFixed(3));

  // Structure family
  const two_sided = Number(fv.twoSidedness.toFixed(3));
  const cp_conc = Number(fv.counterpartyConcentration.toFixed(3));

  const fund_cluster = "entity-" + leader.id;

  return {
    clv_mean_w, clv_t,
    kelly_corr, result_react, stake_entropy,
    lead_1h_72h, chase_score,
    cat_hhi, abstain_elast,
    tilt_index, streak_z, thesis_conc,
    two_sided, cp_conc,
    fund_cluster,
  };
}

// ============================================================
// SECTION 3 — Participant Typing
// ============================================================

const ALL_PARTICIPANT_TYPES: ParticipantType[] = [
  "sharp", "square", "lucky_monkey", "market_maker",
  "arbitrageur", "late_sweeper", "likely_informed", "manipulator", "hedger",
];

const typeEconomicRoles: Record<ParticipantType, string> = {
  sharp: "Edge-positive forecaster with demonstrated skill across thesis-independent observations",
  square: "Recreational participant providing liquidity; negative expected value",
  lucky_monkey: "Insufficient sample to distinguish from noise; hot-streak-driven performance",
  market_maker: "Two-sided liquidity provider profiting from spread, not direction",
  arbitrageur: "Cross-venue or cross-market arbitrage exploiting pricing inefficiencies",
  late_sweeper: "Buys near-certainties for gaudy win rates; negligible per-trade returns",
  likely_informed: "Concentrated early correct bets in niche markets; possible information edge",
  manipulator: "Artificial activity patterns consistent with wash trading or leaderboard farming",
  hedger: "Deliberately negative EV on platform; offsetting external exposure",
};

export function typeParticipant(features: FeatureDictionary, leader: Leader): ParticipantTyping {
  const preset = archetypePresets[leader.username];
  const fv = leader.walletIntelligence.wallet.featureVector;

  const scores: Record<ParticipantType, number> = {
    sharp: 0, square: 0, lucky_monkey: 0, market_maker: 0,
    arbitrageur: 0, late_sweeper: 0, likely_informed: 0, manipulator: 0, hedger: 0,
  };

  // Sharp
  if (features.clv_mean_w > 0.02) scores.sharp += 25;
  else if (features.clv_mean_w > 0.01) scores.sharp += 12;
  if (features.clv_t > 2.0) scores.sharp += 20;
  else if (features.clv_t > 1.5) scores.sharp += 12;
  if (features.kelly_corr > 0.25) scores.sharp += 15;
  else if (features.kelly_corr > 0.15) scores.sharp += 8;
  if (features.lead_1h_72h < -10) scores.sharp += 15;
  else if (features.lead_1h_72h < 0) scores.sharp += 5;
  if (features.chase_score < 0.2) scores.sharp += 10;
  else if (features.chase_score < 0.3) scores.sharp += 5;
  if (features.tilt_index < 0.2) scores.sharp += 10;
  if (features.abstain_elast > 0.5) scores.sharp += 5;

  // Square
  if (features.clv_mean_w < -0.01) scores.square += 25;
  else if (features.clv_mean_w < 0) scores.square += 10;
  if (features.chase_score > 0.4) scores.square += 20;
  else if (features.chase_score > 0.3) scores.square += 10;
  if (Math.abs(features.result_react) > 0.3) scores.square += 15;
  else if (Math.abs(features.result_react) > 0.15) scores.square += 8;
  if (features.tilt_index > 0.4) scores.square += 15;
  if (features.lead_1h_72h > 10) scores.square += 10;
  if (features.stake_entropy > 0.5) scores.square += 10;

  // Lucky monkey
  const effectiveN = Math.max(20, Math.round(leader.totalTrades * (1 - features.thesis_conc * 0.4)));
  if (effectiveN < 100) scores.lucky_monkey += 25;
  else if (effectiveN < 200) scores.lucky_monkey += 12;
  if (Math.abs(features.clv_mean_w) < 0.015) scores.lucky_monkey += 15;
  if (features.streak_z > 2.0) scores.lucky_monkey += 20;
  else if (features.streak_z > 1.5) scores.lucky_monkey += 12;
  if (leader.roi > 50 && effectiveN < 200) scores.lucky_monkey += 15;
  if (features.kelly_corr < 0.2) scores.lucky_monkey += 8;

  // Market maker
  if (features.two_sided > 0.25) scores.market_maker += 35;
  else if (features.two_sided > 0.15) scores.market_maker += 15;
  if (Math.abs(features.clv_mean_w) < 0.005) scores.market_maker += 20;
  if (leader.totalTrades > 500) scores.market_maker += 15;

  // Arbitrageur
  if (leader.winRate > 88) scores.arbitrageur += 35;
  else if (leader.winRate > 85) scores.arbitrageur += 15;
  if (fv.lateSweepRatio < 0.05 && leader.winRate > 85) scores.arbitrageur += 20;
  if (features.stake_entropy < 0.15) scores.arbitrageur += 15;

  // Late sweeper
  if (fv.lateSweepRatio > 0.3) scores.late_sweeper += 30;
  else if (fv.lateSweepRatio > 0.15) scores.late_sweeper += 12;
  if (leader.winRate > 85 && fv.lateSweepRatio > 0.2) scores.late_sweeper += 25;

  // Likely informed
  if (features.lead_1h_72h < -30) scores.likely_informed += 20;
  else if (features.lead_1h_72h < -15) scores.likely_informed += 10;
  if (features.cat_hhi > 0.3) scores.likely_informed += 15;
  if (leader.totalTrades < 250) scores.likely_informed += 10;
  if (fv.priceMovePrecession > 65) scores.likely_informed += 15;
  if (features.clv_mean_w > 0.02) scores.likely_informed += 10;

  // Manipulator
  if (features.cp_conc > 0.4) scores.manipulator += 35;
  else if (features.cp_conc > 0.3) scores.manipulator += 15;
  if (fv.depositBlowPattern > 0.25) scores.manipulator += 20;
  if (features.cp_conc > 0.3 && leader.winRate > 70) scores.manipulator += 15;

  // Hedger
  if (features.clv_mean_w < -0.02) scores.hedger += 20;
  if (features.two_sided > 0.15) scores.hedger += 15;
  if (leader.roi < 10 && leader.winRate < 55) scores.hedger += 25;

  // Boost preset type
  if (preset) {
    scores[preset.type] += 30;
  }

  // Softmax to posteriors
  const maxScore = Math.max(...Object.values(scores));
  const expScores: Record<string, number> = {};
  let expSum = 0;
  for (const t of ALL_PARTICIPANT_TYPES) {
    const e = Math.exp((scores[t] - maxScore) / 15);
    expScores[t] = e;
    expSum += e;
  }

  const typePosteriors = {} as Record<ParticipantType, number>;
  for (const t of ALL_PARTICIPANT_TYPES) {
    typePosteriors[t] = Number((expScores[t] / expSum).toFixed(4));
  }

  const sorted = ALL_PARTICIPANT_TYPES.slice().sort((a, b) => typePosteriors[b] - typePosteriors[a]);
  const primaryType = sorted[0];

  const isEligibleForRanking = primaryType === "sharp" || primaryType === "likely_informed";
  let rankExclusionReason: string | null = null;
  if (!isEligibleForRanking) {
    const reasons: Record<ParticipantType, string> = {
      sharp: "",
      square: "Negative CLV — recreational participant not eligible for sharpness ranking",
      lucky_monkey: "Insufficient thesis-independent sample size to confirm edge",
      market_maker: "Two-sided flow — market maker not eligible for directional ranking",
      arbitrageur: "Structural arbitrage — not a directional forecaster",
      late_sweeper: "Late sweep pattern — win rate does not reflect forecasting skill",
      likely_informed: "",
      manipulator: "Integrity flag — wash trading signals detected",
      hedger: "Hedging pattern — deliberately negative EV on platform",
    };
    rankExclusionReason = reasons[primaryType] || "Not classified as Sharp";
  }

  return {
    primaryType,
    typePosteriors,
    isEligibleForRanking,
    rankExclusionReason,
    label: participantTypeLabels[primaryType],
    economicRole: typeEconomicRoles[primaryType],
  };
}

// ============================================================
// SECTION 4 — Skill Signals
// ============================================================

export function computeSkillSignals(features: FeatureDictionary, leader: Leader): SkillSignals {
  const localRng = createRng(77123 + Number(leader.id) * 311);
  const rp = leader.riskProfile;

  const clvStabilityAcrossTheses = Number(
    clamp(1 - features.thesis_conc * 0.8 - localRng() * 0.15, 0, 1).toFixed(3)
  );

  const topCatPnl = rp.categoryBreakdown.length > 0 ? rp.categoryBreakdown[0].pnl : 0;
  const totalPnl = rp.categoryBreakdown.reduce((s, c) => s + c.pnl, 0);
  const topCatWeight = rp.topCategoryConcentration / 100;
  const withinSpecialtyEdge = totalPnl !== 0
    ? Number(clamp((topCatPnl / Math.max(Math.abs(totalPnl), 1)) * topCatWeight + localRng() * 0.1, -0.5, 1).toFixed(3))
    : Number((localRng() * 0.3).toFixed(3));

  const leadDistributionStability = features.lead_1h_72h < -10
    ? Number(clamp(0.6 + localRng() * 0.3, 0, 1).toFixed(3))
    : Number(clamp(0.2 + localRng() * 0.4, 0, 1).toFixed(3));

  return {
    clvMeanWeighted: features.clv_mean_w,
    clvTStat: features.clv_t,
    clvStabilityAcrossTheses,
    convictionEdgeCorr: features.kelly_corr,
    resultReactivity: features.result_react,
    timingLead: features.lead_1h_72h,
    leadDistributionStability,
    categoryConcentration: features.cat_hhi,
    abstentionElasticity: features.abstain_elast,
    withinSpecialtyEdge,
  };
}

// ============================================================
// SECTION 5 — Transience Signals
// ============================================================

export function computeTransienceSignals(features: FeatureDictionary, leader: Leader): TransienceSignals {
  const localRng = createRng(33891 + Number(leader.id) * 419);

  const rollingValues = leader.riskProfile.rollingWinRate30d;
  const recentWinRate = rollingValues.length > 0
    ? rollingValues[rollingValues.length - 1]
    : leader.winRate;
  const lifetimeWinRate = leader.winRate;
  const formVsBaseline = Number(
    clamp((recentWinRate - lifetimeWinRate) / Math.max(lifetimeWinRate, 1) * 2, -1, 1).toFixed(3)
  );

  const baseDecay = features.clv_mean_w > 0.03 ? 18 : features.clv_mean_w > 0.01 ? 12 : 6;
  const edgeDecayRate = Number(
    clamp(baseDecay + (localRng() - 0.5) * 6, 2, 36).toFixed(1)
  );

  return {
    tiltIndex: features.tilt_index,
    streakZScore: features.streak_z,
    thesisConcentration: features.thesis_conc,
    formVsBaseline,
    edgeDecayRate,
  };
}

// ============================================================
// SECTION 6 — Sharpness Rating (Hierarchical Bayesian Model)
// ============================================================

export function computeSharpnessRating(
  features: FeatureDictionary,
  typing: ParticipantTyping,
  skillSignals: SkillSignals,
  transienceSignals: TransienceSignals,
  leader: Leader,
): SharpnessRating {
  const localRng = createRng(12457 + Number(leader.id) * 523);

  // 1. Prior from behavior
  let prior = 0;
  if (features.kelly_corr > 0.2) prior += 0.01;
  if (features.lead_1h_72h < -10) prior += 0.01;
  if (features.abstain_elast > 0.5) prior += 0.005;
  if (features.tilt_index < 0.2) prior += 0.005;

  const priorPrecision = 50;

  // 2. Posterior from data
  const effectiveN = Math.max(20, Math.round(
    leader.totalTrades * (1 - features.thesis_conc * 0.4)
  ));
  const dataPrecision = effectiveN;

  const posteriorMean = Number(
    ((prior * priorPrecision + features.clv_mean_w * dataPrecision) / (priorPrecision + dataPrecision)).toFixed(5)
  );
  const posteriorStdDev = Number(
    (1 / Math.sqrt(priorPrecision + dataPrecision) * 0.3).toFixed(5)
  );

  // 3. LCB: posteriorMean - 1.28 * posteriorStdDev (alpha ~ 0.10)
  const lowerConfidenceBound = Number((posteriorMean - 1.28 * posteriorStdDev).toFixed(5));

  // P(theta > 0 | data) via logistic approximation to normal CDF
  const zScore = posteriorMean / Math.max(posteriorStdDev, 0.0001);
  const probPositiveEdge = Number(
    clamp(1 / (1 + Math.exp(-1.7 * zScore)), 0.001, 0.999).toFixed(3)
  );

  // 4. Rating: normalize LCB to 0-100
  const rating = Number(
    clamp(Math.round(50 + (lowerConfidenceBound / 0.05) * 35), 0, 100)
  );

  // Specialty decomposition
  const rp = leader.riskProfile;
  const specialtyDecomposition = rp.categoryBreakdown.map((cb) => {
    const weight = cb.percentage / 100;
    const catClv = Number((features.clv_mean_w * (1 + (localRng() - 0.5) * 0.4)).toFixed(4));
    return { category: cb.category, clv: catClv, weight: Number(weight.toFixed(3)) };
  });

  // 5. Evidence summary
  const clvPct = (features.clv_mean_w * 100).toFixed(1);
  const topCat = rp.topCategory;
  const topCatWeight = Math.round(rp.topCategoryConcentration);
  const leadHours = Math.abs(features.lead_1h_72h / 60).toFixed(1);
  const leadDir = features.lead_1h_72h < 0 ? "leads" : "lags";

  let evidenceSummary: string;
  if (typing.primaryType === "sharp") {
    evidenceSummary = `Sharp forecaster with ${clvPct.startsWith("-") ? "" : "+"}${clvPct}% CLV across ${effectiveN} thesis-independent trades, specializing in ${topCat} (${topCatWeight}% weight). Sizing discipline correlates ${features.kelly_corr.toFixed(2)} with edge. Timing ${leadDir} market by ${leadHours} hours on average.`;
  } else if (typing.primaryType === "likely_informed") {
    evidenceSummary = `Likely informed flow with ${clvPct.startsWith("-") ? "" : "+"}${clvPct}% CLV concentrated in ${topCat} (${topCatWeight}% weight). Extreme timing lead of ${leadHours} hours suggests information advantage. Sample size of ${effectiveN} trades warrants monitoring.`;
  } else if (typing.primaryType === "square") {
    evidenceSummary = `Recreational participant with ${clvPct}% CLV across ${effectiveN} observations. Chase score of ${(features.chase_score * 100).toFixed(0)}% indicates narrative-following behavior. Tilt index ${(features.tilt_index * 100).toFixed(0)}% suggests emotional reactivity.`;
  } else if (typing.primaryType === "lucky_monkey") {
    evidenceSummary = `Unconfirmed edge: ${clvPct.startsWith("-") ? "" : "+"}${clvPct}% CLV on only ${effectiveN} thesis-independent observations. Streak z-score of ${features.streak_z.toFixed(1)} suggests run may be noise. Requires ${Math.max(0, 200 - effectiveN)} more trades for confidence.`;
  } else {
    evidenceSummary = `Classified as ${typing.label}. CLV of ${clvPct}% across ${effectiveN} observations. ${typing.economicRole}`;
  }

  return {
    posteriorMean,
    posteriorStdDev,
    lowerConfidenceBound,
    probPositiveEdge,
    rating,
    effectiveSampleSize: effectiveN,
    specialtyDecomposition,
    evidenceSummary,
    rank: 0,
    percentile: 0,
  };
}

// ============================================================
// SECTION 7 — Integrity Signals
// ============================================================

export function computeIntegritySignals(features: FeatureDictionary): IntegritySignals {
  const flags: string[] = [];

  const washTradingRisk = Number(
    clamp(Math.round(features.cp_conc > 0.3 ? features.cp_conc * 200 : features.cp_conc * 80), 0, 100)
  );
  if (washTradingRisk > 50) flags.push("Elevated counterparty concentration — possible wash trading");
  else if (washTradingRisk > 30) flags.push("Moderate counterparty concentration — monitor for patterns");

  const sybilRisk = Number(clamp(Math.round(features.cp_conc * 30 + (features.two_sided > 0.15 ? 10 : 0)), 0, 100));
  if (sybilRisk > 40) flags.push("Funding graph anomaly — possible sybil cluster");

  const selectiveDisplayRisk = 0;

  const overallIntegrity = Number(
    clamp(Math.round(100 - washTradingRisk * 0.5 - sybilRisk * 0.3 - selectiveDisplayRisk * 0.2), 0, 100)
  );

  if (flags.length === 0) {
    flags.push("No integrity concerns detected");
  }

  return {
    washTradingRisk,
    sybilRisk,
    selectiveDisplayRisk,
    overallIntegrity,
    flags,
  };
}

// ============================================================
// Master function — compute profile for one leader
// ============================================================

export function computeSharpnessProfile(leader: Leader): SharpnessProfile {
  const features = computeFeatureDictionary(leader);
  const typing = typeParticipant(features, leader);
  const skillSignals = computeSkillSignals(features, leader);
  const transienceSignals = computeTransienceSignals(features, leader);
  const ratingData = computeSharpnessRating(features, typing, skillSignals, transienceSignals, leader);
  const integrity = computeIntegritySignals(features);

  // Compute p-value from t-statistic for display
  // Two-tailed p-value approximation from t-stat using logistic approx
  const absT = Math.abs(features.clv_t);
  const pValue = Number(clamp(2 * (1 / (1 + Math.exp(1.7 * absT))), 0.0001, 1).toFixed(4));

  return {
    features,
    typing,
    skillSignals,
    transienceSignals,
    rating: ratingData,
    integrity,

    // Flattened convenience fields for component consumption
    ratingScore: ratingData.rating,
    rank: typing.isEligibleForRanking ? ratingData.rank : null,
    totalRanked: 0, // set by batch function
    percentile: typing.isEligibleForRanking ? ratingData.percentile : null,
    participantType: typing.primaryType,
    eligible: typing.isEligibleForRanking,
    ineligibilityReason: typing.rankExclusionReason,

    clv: {
      clv: features.clv_mean_w * 100, // display as percentage points
      tStatistic: features.clv_t,
      pValue,
      effectiveSampleSize: ratingData.effectiveSampleSize,
    },

    transience: {
      tiltIndex: transienceSignals.tiltIndex,
      streakZ: transienceSignals.streakZScore,
      thesisConcentration: transienceSignals.thesisConcentration,
      edgeHalfLifeMonths: transienceSignals.edgeDecayRate,
    },

    integrityDisplay: {
      score: integrity.overallIntegrity,
      flags: integrity.flags,
    },

    evidenceSummary: ratingData.evidenceSummary,
  };
}

// ============================================================
// Batch: compute all profiles and assign ranks
// ============================================================

export function computeAllSharpnessProfiles(leaders: Leader[]): SharpnessProfile[] {
  const profiles = leaders.map((l) => computeSharpnessProfile(l));

  // Collect eligible profiles with their indices
  const eligible: { index: number; lcb: number }[] = [];
  for (let i = 0; i < profiles.length; i++) {
    if (profiles[i].typing.isEligibleForRanking) {
      eligible.push({ index: i, lcb: profiles[i].rating.lowerConfidenceBound });
    }
  }

  // Sort by LCB descending
  eligible.sort((a, b) => b.lcb - a.lcb);

  const totalRanked = eligible.length;

  // Assign ranks and percentiles
  for (let rank = 0; rank < eligible.length; rank++) {
    const idx = eligible[rank].index;
    const r = rank + 1;
    const pctl = Number(((1 - rank / Math.max(eligible.length - 1, 1)) * 100).toFixed(1));

    profiles[idx].rating.rank = r;
    profiles[idx].rating.percentile = pctl;
    profiles[idx].rank = r;
    profiles[idx].percentile = pctl;
    profiles[idx].totalRanked = totalRanked;
  }

  // Set totalRanked for non-eligible too
  for (const p of profiles) {
    p.totalRanked = totalRanked;
  }

  return profiles;
}
