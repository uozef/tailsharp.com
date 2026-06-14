// ============================================================
// TailSharp — Market Risk Data Layer & Computation Engine
// 7 Risk Modules + Polymarket Risk Index
// ============================================================

// Seeded PRNG (mulberry32) — same pattern as mock-data.ts
function createRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
// MODULE 1: Resolution & Oracle Risk
// ============================================================

export interface OracleRisk {
  grade: "A" | "B" | "C" | "D" | "F";
  ambiguityScore: number;
  disputeRate: number;
  attackProfitabilityRatio: number;
  disputeStatus: "none" | "proposed" | "challenged" | "voting" | "resolved";
  proposerReputation: number;
  riskFactors: string[];
}

// ============================================================
// MODULE 2: Collateral Health (pUSD)
// ============================================================

export interface CollateralHealth {
  pusdPrice: number;
  pegBand: { low: number; high: number };
  isPegged: boolean;
  mintBurnFlow: { date: string; mint: number; burn: number; net: number }[];
  attestationStatus: "fresh" | "stale" | "absent";
  attestationAge: string;
  smartMoneyFloat: { date: string; balance: number }[];
  floatTrend: "accumulating" | "stable" | "withdrawing";
  netFloatChange30d: number;
}

// ============================================================
// MODULE 3: Liquidity & Execution Risk (per market)
// ============================================================

export interface LiquidityRisk {
  spread: number;
  depthAt1c: number;
  depthAt2c: number;
  depthAt5c: number;
  depthToOIRatio: number;
  slippageCurve: { size: number; cost: number }[];
  bookResilience: number;
  makerConcentration: number;
  copyabilityScore: number;
  copyabilityGrade: "A" | "B" | "C" | "D" | "F";
  spreadTimeSeries: { date: string; spread: number }[];
}

// ============================================================
// MODULE 4: Crowding & Edge Decay (per leader)
// ============================================================

export interface CrowdingMetrics {
  estimatedFollowerLoad: number;
  capacityUtilization: number;
  entryLagDistribution: { lagMinutes: number; count: number }[];
  postEntryPriceImpact: number;
  capacityEstimate: number;
  clvVsFollowerDecay: { followers: number; clv: number }[];
  crowdingStatus: "uncrowded" | "moderate" | "crowded" | "overcrowded";
}

// ============================================================
// MODULE 5: Market Integrity
// ============================================================

export interface MarketIntegrity {
  washVolumeShare: number;
  realVolume: number;
  reportedVolume: number;
  counterpartyNetworkDensity: number;
  sybilClusterCount: number;
  quoteStuffingRate: number;
  freshWalletInflow: number;
  resolutionAdjacentSurge: boolean;
  integrityScore: number;
  integrityGrade: "A" | "B" | "C" | "D" | "F";
}

// ============================================================
// MODULE 6: Venue & Systemic
// ============================================================

export interface VenueHealth {
  totalOI: number;
  totalVolume24h: number;
  oiByCategory: { category: string; oi: number; share: number }[];
  electionDependence: number;
  apiUptime30d: number;
  avgGasCost: number;
  chainCongestion: "low" | "normal" | "elevated" | "critical";
  venueHealthScore: number;
  oiTrend: { date: string; oi: number }[];
  eventFeed: { date: string; event: string; severity: "info" | "warning" | "critical" }[];
}

// ============================================================
// MODULE 7: Portfolio Overlay (user-specific)
// ============================================================

export interface PortfolioOverlay {
  thesisExposure: { thesis: string; exposure: number; markets: number; correlation: number }[];
  effectiveBetCount: number;
  totalPositions: number;
  venueCapUtilization: number;
  stressScenarios: StressScenario[];
}

export interface StressScenario {
  name: string;
  description: string;
  portfolioImpact: number;
  severity: "low" | "moderate" | "severe" | "catastrophic";
}

// ============================================================
// Polymarket Risk Index (the roll-up)
// ============================================================

export interface PolymarketRiskIndex {
  composite: number;
  grade: "A" | "B" | "C" | "D" | "F";
  subIndices: {
    oracle: number;
    collateral: number;
    liquidity: number;
    integrity: number;
  };
  trend: "improving" | "stable" | "deteriorating";
  lastUpdated: string;
  summary: string;
}

// ============================================================
// Combined market data (attached to mock markets)
// ============================================================

export interface MarketRiskProfile {
  marketId: string;
  marketName: string;
  category: string;
  openInterest: number;
  oracle: OracleRisk;
  liquidity: LiquidityRisk;
  integrity: MarketIntegrity;
}

// ============================================================
// Helpers
// ============================================================

function gradeFromScore(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

function dateStr(daysFromStart: number): string {
  const d = new Date(2025, 0, 1);
  d.setDate(d.getDate() + daysFromStart);
  return d.toISOString().split("T")[0];
}

// ============================================================
// Market definitions
// ============================================================

interface MarketDef {
  id: string;
  name: string;
  category: string;
  oiBase: number;
  liquidityTier: "excellent" | "good" | "medium" | "poor";
  oracleRiskBias: number;
  disputeChance: number;
}

const MARKET_DEFS: MarketDef[] = [
  { id: "mkt-btc-150k",     name: "Will Bitcoin reach $150K by 2026?",  category: "Crypto",        oiBase: 42_000_000, liquidityTier: "good",      oracleRiskBias: 0.15, disputeChance: 0.05 },
  { id: "mkt-pres-2028",    name: "US Presidential Election 2028",      category: "Politics",      oiBase: 85_000_000, liquidityTier: "excellent", oracleRiskBias: 0.10, disputeChance: 0.03 },
  { id: "mkt-fed-rate-q3",  name: "Fed rate cut in Q3 2026?",           category: "Economics",     oiBase: 18_000_000, liquidityTier: "medium",    oracleRiskBias: 0.20, disputeChance: 0.08 },
  { id: "mkt-tsla-500",     name: "Tesla stock above $500 by Dec?",     category: "Technology",    oiBase: 22_000_000, liquidityTier: "medium",    oracleRiskBias: 0.18, disputeChance: 0.06 },
  { id: "mkt-ai-medical",   name: "Will AI pass medical boards?",       category: "Science",       oiBase: 3_200_000,  liquidityTier: "poor",      oracleRiskBias: 0.55, disputeChance: 0.25 },
  { id: "mkt-spacex-orbit", name: "SpaceX Starship orbital success?",   category: "Science",       oiBase: 5_800_000,  liquidityTier: "poor",      oracleRiskBias: 0.40, disputeChance: 0.15 },
  { id: "mkt-oscar-2026",   name: "Oscar Best Picture 2026",            category: "Entertainment", oiBase: 2_100_000,  liquidityTier: "poor",      oracleRiskBias: 0.65, disputeChance: 0.35 },
  { id: "mkt-unemp-3pct",   name: "Will unemployment drop below 3%?",  category: "Economics",     oiBase: 14_500_000, liquidityTier: "medium",    oracleRiskBias: 0.22, disputeChance: 0.10 },
];

// ============================================================
// Generators
// ============================================================

const rng = createRng(999);

function generateOracleRisk(def: MarketDef): OracleRisk {
  const bias = def.oracleRiskBias;
  const ambiguityScore = Math.round(10 + bias * 60 + rng() * 25);
  const disputeRate = Number((bias * 12 + rng() * 5).toFixed(1));
  const oi = def.oiBase;
  const costToSwing = 50_000 + rng() * 200_000;
  const attackProfitabilityRatio = Number((oi / costToSwing).toFixed(2));

  const disputeStatuses: OracleRisk["disputeStatus"][] = ["none", "proposed", "challenged", "voting", "resolved"];
  const disputeStatus: OracleRisk["disputeStatus"] = rng() < def.disputeChance
    ? disputeStatuses[1 + Math.floor(rng() * 4)]
    : "none";

  // Consume one rng call even when dispute is "none" to keep deterministic sequence
  if (disputeStatus === "none") rng();

  const proposerReputation = Math.round(60 + rng() * 35 - bias * 20);

  const riskFactorPool = [
    "Subjective resolution criteria",
    "Multi-outcome ambiguity",
    "Time-zone dependent resolution",
    "Relies on single data source",
    "Historical dispute precedent in category",
    "High OI relative to oracle bond",
    "Resolution date far in future",
    "Politically sensitive outcome",
    "Cross-jurisdictional data dependency",
    "Partial resolution risk",
  ];
  const numFactors = Math.min(riskFactorPool.length, Math.floor(bias * 5 + rng() * 2));
  const riskFactors: string[] = [];
  const used = new Set<number>();
  for (let i = 0; i < numFactors; i++) {
    let idx = Math.floor(rng() * riskFactorPool.length);
    while (used.has(idx)) idx = (idx + 1) % riskFactorPool.length;
    used.add(idx);
    riskFactors.push(riskFactorPool[idx]);
  }

  const oracleScore = Math.max(0, Math.min(100, 90 - ambiguityScore * 0.6 - disputeRate * 1.5));
  const grade = gradeFromScore(oracleScore);

  return { grade, ambiguityScore, disputeRate, attackProfitabilityRatio, disputeStatus, proposerReputation, riskFactors };
}

function generateLiquidityRisk(def: MarketDef): LiquidityRisk {
  const tierMultipliers: Record<string, number> = { excellent: 1.0, good: 0.7, medium: 0.4, poor: 0.15 };
  const mult = tierMultipliers[def.liquidityTier];

  const spread = Number((0.5 + (1 - mult) * 4 + rng() * 1.5).toFixed(2));
  const depthAt1c = Math.round(50_000 + mult * 400_000 + rng() * 80_000);
  const depthAt2c = Math.round(depthAt1c * (1.6 + rng() * 0.4));
  const depthAt5c = Math.round(depthAt2c * (1.8 + rng() * 0.6));
  const depthToOIRatio = Number((depthAt5c / def.oiBase).toFixed(4));

  const slippageSizes = [1000, 5000, 10000, 25000, 50000];
  const baseCostPer1k = (1 - mult) * 8 + 1 + rng() * 2; // cents per $1k
  const slippageCurve = slippageSizes.map((size) => ({
    size,
    cost: Number(((size / 1000) * baseCostPer1k * (1 + (size / 50000) * 0.5)).toFixed(2)),
  }));

  const bookResilience = Number((2 + (1 - mult) * 25 + rng() * 8).toFixed(1));
  const makerConcentration = Number((20 + (1 - mult) * 50 + rng() * 15).toFixed(1));

  const copyabilityScore = Math.round(mult * 70 + rng() * 25);
  const copyabilityGrade = gradeFromScore(copyabilityScore);

  const spreadTimeSeries: { date: string; spread: number }[] = [];
  for (let i = 0; i < 30; i++) {
    spreadTimeSeries.push({
      date: dateStr(i * 7),
      spread: Number((spread + (rng() - 0.45) * spread * 0.4).toFixed(2)),
    });
  }

  return { spread, depthAt1c, depthAt2c, depthAt5c, depthToOIRatio, slippageCurve, bookResilience, makerConcentration, copyabilityScore, copyabilityGrade, spreadTimeSeries };
}

function generateIntegrity(def: MarketDef): MarketIntegrity {
  const tierWashBase: Record<string, number> = { excellent: 3, good: 6, medium: 10, poor: 18 };
  const washVolumeShare = Number((tierWashBase[def.liquidityTier] + rng() * 8).toFixed(1));
  const reportedVolume = Math.round(def.oiBase * (0.08 + rng() * 0.06));
  const realVolume = Math.round(reportedVolume * (1 - washVolumeShare / 100));
  const counterpartyNetworkDensity = Number((0.1 + rng() * 0.5).toFixed(3));
  const sybilClusterCount = Math.floor(rng() * 8 + (def.liquidityTier === "poor" ? 4 : 1));
  const quoteStuffingRate = Number((5 + rng() * 20 + (def.liquidityTier === "poor" ? 10 : 0)).toFixed(1));
  const freshWalletInflow = Math.round(10 + rng() * 40 + (def.liquidityTier === "poor" ? 15 : 0));
  const resolutionAdjacentSurge = rng() < (def.oracleRiskBias > 0.4 ? 0.3 : 0.08);

  const integrityScore = Math.round(Math.max(0, Math.min(100,
    85 - washVolumeShare * 1.2 - sybilClusterCount * 3 - (resolutionAdjacentSurge ? 15 : 0) + rng() * 10
  )));
  const integrityGrade = gradeFromScore(integrityScore);

  return { washVolumeShare, realVolume, reportedVolume, counterpartyNetworkDensity, sybilClusterCount, quoteStuffingRate, freshWalletInflow, resolutionAdjacentSurge, integrityScore, integrityGrade };
}

function generateMarketRiskProfile(def: MarketDef): MarketRiskProfile {
  return {
    marketId: def.id,
    marketName: def.name,
    category: def.category,
    openInterest: def.oiBase,
    oracle: generateOracleRisk(def),
    liquidity: generateLiquidityRisk(def),
    integrity: generateIntegrity(def),
  };
}

// ============================================================
// Generate all 8 markets
// ============================================================

export const mockMarkets: MarketRiskProfile[] = MARKET_DEFS.map(generateMarketRiskProfile);

// ============================================================
// Collateral Health (venue-level, MODULE 2)
// ============================================================

function generateCollateralHealth(): CollateralHealth {
  const r = createRng(1001);
  const pusdPrice = Number((0.996 + r() * 0.004).toFixed(4));
  const pegBand = { low: 0.98, high: 1.00 };
  const isPegged = pusdPrice >= pegBand.low && pusdPrice <= pegBand.high;

  const mintBurnFlow: CollateralHealth["mintBurnFlow"] = [];
  for (let i = 0; i < 30; i++) {
    const mint = Math.round(800_000 + r() * 3_000_000);
    const burn = Math.round(600_000 + r() * 2_500_000);
    mintBurnFlow.push({ date: dateStr(i), mint, burn, net: mint - burn });
  }

  const smartMoneyFloat: CollateralHealth["smartMoneyFloat"] = [];
  let balance = 45_000_000;
  for (let i = 0; i < 30; i++) {
    balance = balance * (0.997 + r() * 0.008);
    smartMoneyFloat.push({ date: dateStr(i), balance: Math.round(balance) });
  }

  const netFloatChange30d = Number((((smartMoneyFloat[29].balance - smartMoneyFloat[0].balance) / smartMoneyFloat[0].balance) * 100).toFixed(2));
  const floatTrend: CollateralHealth["floatTrend"] = netFloatChange30d > 2 ? "accumulating" : netFloatChange30d < -2 ? "withdrawing" : "stable";

  return {
    pusdPrice,
    pegBand,
    isPegged,
    mintBurnFlow,
    attestationStatus: "fresh",
    attestationAge: "2 hours ago",
    smartMoneyFloat,
    floatTrend,
    netFloatChange30d,
  };
}

export const collateralHealth: CollateralHealth = generateCollateralHealth();

// ============================================================
// Venue Health (venue-level, MODULE 6)
// ============================================================

function generateVenueHealth(): VenueHealth {
  const r = createRng(1002);
  const totalOI = 450_000_000;
  const totalVolume24h = Math.round(38_000_000 + r() * 12_000_000);

  const oiByCategory: VenueHealth["oiByCategory"] = [
    { category: "Politics",      oi: 195_000_000, share: 43.3 },
    { category: "Crypto",        oi: 126_000_000, share: 28.0 },
    { category: "Economics",     oi:  54_000_000, share: 12.0 },
    { category: "Technology",    oi:  31_500_000, share: 7.0 },
    { category: "Science",       oi:  18_000_000, share: 4.0 },
    { category: "Sports",        oi:  13_500_000, share: 3.0 },
    { category: "Entertainment", oi:   9_000_000, share: 2.0 },
    { category: "Other",         oi:   3_000_000, share: 0.7 },
  ];

  const electionDependence = 43.3;
  const apiUptime30d = Number((99.2 + r() * 0.7).toFixed(2));
  const avgGasCost = Number((0.02 + r() * 0.04).toFixed(3));
  const chainCongestion: VenueHealth["chainCongestion"] = "normal";
  const venueHealthScore = 82;

  const oiTrend: VenueHealth["oiTrend"] = [];
  let oi = 380_000_000;
  for (let i = 0; i < 30; i++) {
    oi = oi * (1.001 + r() * 0.006);
    oiTrend.push({ date: dateStr(i * 7), oi: Math.round(oi) });
  }

  const eventFeed: VenueHealth["eventFeed"] = [
    { date: "2026-06-10", event: "Scheduled Polygon zkEVM upgrade in 48h",              severity: "info" },
    { date: "2026-06-09", event: "pUSD attestation delayed by 4 hours",                 severity: "warning" },
    { date: "2026-06-07", event: "API latency spike (p99 > 2s) for 12 minutes",         severity: "warning" },
    { date: "2026-06-05", event: "New election market launched: UK snap election",       severity: "info" },
    { date: "2026-06-03", event: "Oracle dispute on 'Oscar Best Picture 2026'",          severity: "critical" },
    { date: "2026-06-01", event: "Gas fee spike on Polygon (avg $0.08)",                 severity: "warning" },
    { date: "2026-05-28", event: "Platform crossed $450M total OI milestone",            severity: "info" },
    { date: "2026-05-25", event: "Smart-contract audit completed by Trail of Bits",      severity: "info" },
  ];

  return { totalOI, totalVolume24h, oiByCategory, electionDependence, apiUptime30d, avgGasCost, chainCongestion, venueHealthScore, oiTrend, eventFeed };
}

export const venueHealth: VenueHealth = generateVenueHealth();

// ============================================================
// Polymarket Risk Index (the roll-up)
// ============================================================

export const riskIndex: PolymarketRiskIndex = {
  composite: 72,
  grade: "B",
  subIndices: {
    oracle: 68,
    collateral: 88,
    liquidity: 71,
    integrity: 74,
  },
  trend: "stable",
  lastUpdated: "2026-06-11T08:00:00Z",
  summary: "Venue risk elevated this week as oracle dispute activity increased on entertainment markets and election OI concentration remains high. Collateral health remains strong with pUSD peg intact. Liquidity is adequate for major markets but thin in niche categories.",
};

// ============================================================
// Portfolio Overlay (MODULE 7) — for the mock user
// ============================================================

function generatePortfolioOverlay(): PortfolioOverlay {
  const thesisExposure: PortfolioOverlay["thesisExposure"] = [
    { thesis: "US Political Stability",   exposure: 7200,  markets: 4, correlation: 0.82 },
    { thesis: "Crypto Bull Cycle",         exposure: 5400,  markets: 5, correlation: 0.78 },
    { thesis: "Fed Dovish Pivot",          exposure: 4100,  markets: 3, correlation: 0.71 },
    { thesis: "Tech / AI Acceleration",    exposure: 3300,  markets: 2, correlation: 0.65 },
  ];

  const totalPositions = 14;
  const effectiveBetCount = 4;

  const venueCapUtilization = Number(((20000 / 32500) * 100).toFixed(1));

  const stressScenarios: StressScenario[] = [
    {
      name: "Oracle Attack on Election Market",
      description: "A coordinated oracle manipulation targets the largest election market. Dispute escalates, freezing $85M in OI. Your correlated political positions lose value as uncertainty spikes.",
      portfolioImpact: -18.5,
      severity: "severe",
    },
    {
      name: "pUSD Collateral De-peg",
      description: "pUSD drops to $0.94 after attestation reveals reserve shortfall. All positions marked to market against devalued collateral. Smart money float drops 30% in 48h.",
      portfolioImpact: -32.0,
      severity: "catastrophic",
    },
    {
      name: "Top Leader Drawdown Cascade",
      description: "Your top-allocated leader (quantnina) enters a 15% drawdown. Follower panic causes liquidity withdrawal, widening spreads and compounding losses for copy-traders.",
      portfolioImpact: -11.2,
      severity: "moderate",
    },
  ];

  return { thesisExposure, effectiveBetCount, totalPositions, venueCapUtilization, stressScenarios };
}

export const portfolioOverlay: PortfolioOverlay = generatePortfolioOverlay();

// ============================================================
// Crowding Metrics (MODULE 4) — per leader
// ============================================================

interface LeaderCrowdingDef {
  leaderId: string;
  username: string;
  followers: number;
  avgTradeSize: number;
  totalCapital: number;
}

const LEADER_CROWDING_DEFS: LeaderCrowdingDef[] = [
  { leaderId: "1",  username: "greentrades",    followers: 1243, avgTradeSize: 1200, totalCapital: 285000 },
  { leaderId: "2",  username: "cryptoqueen",    followers: 3421, avgTradeSize: 2500, totalCapital: 520000 },
  { leaderId: "3",  username: "macroman",       followers: 892,  avgTradeSize: 800,  totalCapital: 190000 },
  { leaderId: "4",  username: "sportsoracle",   followers: 2156, avgTradeSize: 450,  totalCapital: 95000 },
  { leaderId: "5",  username: "techprophet",    followers: 1876, avgTradeSize: 1800, totalCapital: 345000 },
  { leaderId: "6",  username: "globalista",     followers: 1534, avgTradeSize: 1100, totalCapital: 210000 },
  { leaderId: "7",  username: "culturevulture", followers: 987,  avgTradeSize: 600,  totalCapital: 78000 },
  { leaderId: "8",  username: "sciencebet",     followers: 654,  avgTradeSize: 900,  totalCapital: 156000 },
  { leaderId: "9",  username: "latamtrader",    followers: 1345, avgTradeSize: 700,  totalCapital: 135000 },
  { leaderId: "10", username: "quantnina",      followers: 2789, avgTradeSize: 1500, totalCapital: 420000 },
  { leaderId: "11", username: "hedgefundguy",   followers: 4102, avgTradeSize: 3200, totalCapital: 680000 },
  { leaderId: "12", username: "weatherwatcher", followers: 432,  avgTradeSize: 500,  totalCapital: 67000 },
];

function generateCrowdingForLeader(def: LeaderCrowdingDef): CrowdingMetrics {
  const r = createRng(2000 + Number(def.leaderId));

  const estimatedFollowerLoad = Math.round(def.followers * (0.15 + r() * 0.25));
  const capacityEstimate = Math.round(def.totalCapital * (2 + r() * 3));
  const followerDollars = estimatedFollowerLoad * def.avgTradeSize * (0.5 + r() * 0.5);
  const capacityUtilization = Math.min(100, Number(((followerDollars / capacityEstimate) * 100).toFixed(1)));

  const entryLagDistribution: CrowdingMetrics["entryLagDistribution"] = [];
  const lagBuckets = [0.5, 1, 2, 5, 10, 30, 60];
  for (const lag of lagBuckets) {
    const count = Math.round((lag < 5 ? 20 + r() * 40 : 5 + r() * 15) * (def.followers / 2000));
    entryLagDistribution.push({ lagMinutes: lag, count });
  }

  const postEntryPriceImpact = Number(((def.followers / 4000) * (2 + r() * 3)).toFixed(2));

  const clvVsFollowerDecay: CrowdingMetrics["clvVsFollowerDecay"] = [];
  const baseCLV = 0.08 + r() * 0.04;
  for (let f = 0; f <= 5000; f += 500) {
    const decay = baseCLV * Math.exp(-f / (capacityEstimate / def.avgTradeSize));
    clvVsFollowerDecay.push({ followers: f, clv: Number(decay.toFixed(4)) });
  }

  let crowdingStatus: CrowdingMetrics["crowdingStatus"];
  if (capacityUtilization < 30) crowdingStatus = "uncrowded";
  else if (capacityUtilization < 55) crowdingStatus = "moderate";
  else if (capacityUtilization < 80) crowdingStatus = "crowded";
  else crowdingStatus = "overcrowded";

  return { estimatedFollowerLoad, capacityUtilization, entryLagDistribution, postEntryPriceImpact, capacityEstimate, clvVsFollowerDecay, crowdingStatus };
}

const crowdingCache = new Map<string, CrowdingMetrics>();
for (const def of LEADER_CROWDING_DEFS) {
  crowdingCache.set(def.leaderId, generateCrowdingForLeader(def));
}

// ============================================================
// Public API
// ============================================================

export function getMarketRisk(marketId: string): MarketRiskProfile | undefined {
  return mockMarkets.find((m) => m.marketId === marketId);
}

export function getCrowdingMetrics(leaderId: string): CrowdingMetrics {
  const cached = crowdingCache.get(leaderId);
  if (cached) return cached;
  // Fallback for unknown leaders — generate with defaults
  return generateCrowdingForLeader({
    leaderId,
    username: "unknown",
    followers: 100,
    avgTradeSize: 500,
    totalCapital: 50000,
  });
}

// ============================================================
// Backward-compatible type aliases & adapters
// Used by existing UI components that import from this module.
// ============================================================

/** Alias kept for components that imported the old `RiskGrade` type. */
export type RiskGrade = "A" | "B" | "C" | "D" | "F";

/** Flat market row used by the risk-page table component. */
export interface MockMarket {
  id: string;
  name: string;
  category: string;
  openInterest: number;
  oracleGrade: RiskGrade;
  liquidityGrade: RiskGrade;
  integrityScore: number;
  copyability: RiskGrade;
}

/** Legacy-shaped MockMarket[] derived from the full MarketRiskProfile[]. */
export const mockMarketsLegacy: MockMarket[] = mockMarkets.map((m) => ({
  id: m.marketId,
  name: m.marketName,
  category: m.category,
  openInterest: m.openInterest,
  oracleGrade: m.oracle.grade,
  liquidityGrade: m.liquidity.copyabilityGrade,
  integrityScore: m.integrity.integrityScore,
  copyability: m.liquidity.copyabilityGrade,
}))
