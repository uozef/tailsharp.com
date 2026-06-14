import { computeWalletIntelligence, type WalletIntelligence } from "./wallet-intelligence";
import { computeAllSharpnessProfiles, type SharpnessProfile } from "./sharpness-rating";

export interface Trade {
  id: string;
  market: string;
  position: "Yes" | "No";
  entry: number;
  current: number;
  size: number;
  pnl: number;
  date: string;
  status: "Open" | "Won" | "Lost";
  openedAt: string;
  closedAt: string | null;
  holdingDurationHours: number | null;
  sizeAsPercentOfCapital: number;
  previousTradeResult: "Won" | "Lost" | null;
  category: string;
  entryPriceDistance: number;
}

export interface BehavioralProfile {
  revengeTradingRate: number;
  tiltRatio: number;
  overtradingSpikeFactor: number;
  avgWinHoldingHours: number;
  avgLossHoldingHours: number;
  dispositionRatio: number;
  returnConsistency: number;
  disciplineScore: number;
  fomoScore: number;
  lossAversionRatio: number;
  recencyBiasIndicator: number;
}

export interface RiskProfile {
  maxPositionConcentration: number;
  topCategoryConcentration: number;
  topCategory: string;
  categoryBreakdown: { category: string; percentage: number; pnl: number }[];
  drawdownPeriods: { startDate: string; endDate: string | null; depth: number; recoveryDays: number | null }[];
  martingaleScore: number;
  strategyDriftScore: number;
  eventDependencyScore: number;
  worstSingleTradeLoss: number;
  winRateTrend: number;
  rollingWinRate30d: number[];
}

export interface RollingMetrics {
  rollingSharpe30d: { date: string; value: number }[];
  rollingWinRate30d: { date: string; value: number }[];
  rollingWinRate60d: { date: string; value: number }[];
  rollingWinRate90d: { date: string; value: number }[];
  pnlDistribution: { bucket: string; count: number; isNegative: boolean }[];
  sizeVsOutcome: { size: number; pnl: number; won: boolean }[];
  holdingVsProfitability: { holdingHours: number; pnl: number; won: boolean }[];
  timeOfDayHeatmap: { day: number; hour: number; trades: number; winRate: number }[];
  underwaterEquity: { date: string; drawdownPercent: number }[];
  weeklyTradeCount: { week: string; count: number }[];
  categoryWinRates: { category: string; winRate: number; tradeCount: number }[];
  noPositionRatio: number;
}

export interface FollowerComment {
  id: string;
  username: string;
  avatarUrl: string;
  date: string;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  likes: number;
}

export interface FollowerStats {
  totalFollowers: number;
  followerWinRate: number;
  leaderWinRate: number;
  followerAvgReturn: number;
  sentimentScore: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  maxSlippage: number;
  avgSlippage: number;
  moneyFollowingOverTime: { date: string; amount: number }[];
  followerVsLeaderReturns: { date: string; leader: number; follower: number }[];
  comments: FollowerComment[];
}

export interface Leader {
  id: string;
  name: string;
  username: string;
  avatar: string;
  avatarUrl: string;
  verified: boolean;
  category: string;
  riskLevel: "Low" | "Medium" | "High";
  totalCapital: number;
  roi: number;
  winRate: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  activeTrades: number;
  followers: number;
  tradeFrequency: string;
  avgTradeSize: number;
  profitFactor: number;
  streak: number;
  bio: string;
  joinedDate: string;
  tags: string[];
  correlationGroup: string;
  monthlyReturns: number[];
  equityCurve: { date: string; value: number }[];
  recentTrades: Trade[];
  behavioralProfile: BehavioralProfile;
  riskProfile: RiskProfile;
  rollingMetrics: RollingMetrics;
  followerStats: FollowerStats;
  walletIntelligence: WalletIntelligence;
  sharpnessProfile: SharpnessProfile;
}

export interface Portfolio {
  leaders: PortfolioLeader[];
  totalAllocated: number;
  totalPnl: number;
  balance: number;
}

export interface PortfolioLeader {
  leaderId: string;
  allocated: number;
  pnl: number;
  followingSince: string;
  isActive: boolean;
}

// Seeded PRNG (mulberry32) to avoid hydration mismatches
function createRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rng = createRng(42);

function clampVal(v: number): number {
  return Math.max(0, Math.min(100, v));
}

const tradeCategories = [
  "Politics",
  "Crypto",
  "Economics",
  "Sports",
  "Technology",
  "World Events",
  "Entertainment",
  "Science",
];

function generateEquityCurve(months: number, finalReturn: number): { date: string; value: number }[] {
  const curve: { date: string; value: number }[] = [];
  const startValue = 10000;
  const targetValue = startValue * (1 + finalReturn / 100);
  const step = (targetValue - startValue) / (months * 30);

  for (let i = 0; i < months * 30; i++) {
    const date = new Date(2025, 0, 1);
    date.setDate(date.getDate() + i);
    const noise = (rng() - 0.45) * step * 8;
    const value = startValue + step * i + noise;
    curve.push({
      date: date.toISOString().split("T")[0],
      value: Math.max(value, startValue * 0.85),
    });
  }
  return curve;
}

function generateMonthlyReturns(avg: number, volatility: number): number[] {
  return Array.from({ length: 12 }, () =>
    Number((avg + (rng() - 0.5) * volatility * 2).toFixed(1))
  );
}

function generateTrades(count: number, winRate: number, leaderCategory: string, totalCapital: number): Trade[] {
  const markets = [
    "Will Bitcoin reach $150K by 2026?",
    "US Presidential Election 2028",
    "Fed rate cut in Q3 2026?",
    "Tesla stock above $500 by Dec?",
    "Will AI pass medical boards?",
    "SpaceX Starship success?",
    "NBA Finals - Lakers vs Celtics",
    "Ethereum above $10K?",
    "Will Congress pass crypto bill?",
    "Oscar Best Picture 2026",
    "Will unemployment drop below 3%?",
    "Next iPhone release date",
  ];

  const marketCategories = [
    "Crypto", "Politics", "Economics", "Technology",
    "Science", "Science", "Sports", "Crypto",
    "Politics", "Entertainment", "Economics", "Technology",
  ];

  let prevResult: "Won" | "Lost" | null = null;

  return Array.from({ length: count }, (_, i) => {
    const won = rng() < winRate / 100;
    const isOpen = i < 3;
    const entry = Number((0.3 + rng() * 0.4).toFixed(2));
    const current = isOpen
      ? Number((entry + (rng() - 0.4) * 0.2).toFixed(2))
      : won
        ? Number((0.85 + rng() * 0.15).toFixed(2))
        : 0;
    const size = Math.round((500 + rng() * 4500) / 100) * 100;

    const openMonth = Math.floor(rng() * 12);
    const openDay = Math.floor(rng() * 28) + 1;
    const openHour = Math.floor(rng() * 24);
    const openMin = Math.floor(rng() * 60);
    const openedAt = new Date(2025, openMonth, openDay, openHour, openMin).toISOString();

    let closedAt: string | null = null;
    let holdingDurationHours: number | null = null;
    if (!isOpen) {
      const holdHours = won ? 12 + rng() * 480 : 4 + rng() * 600;
      holdingDurationHours = Number(holdHours.toFixed(1));
      const closeDate = new Date(new Date(openedAt).getTime() + holdHours * 3600000);
      closedAt = closeDate.toISOString();
    }

    const sizeAsPercentOfCapital = Number(((size / totalCapital) * 100).toFixed(2));
    const entryPriceDistance = Number(Math.abs(entry - 0.5).toFixed(3));

    const mktIdx = i % markets.length;
    const category = rng() < 0.6 ? leaderCategory : marketCategories[mktIdx];

    const tradeResult: "Won" | "Lost" | null = isOpen ? null : won ? "Won" : "Lost";
    const previousTradeResult = prevResult;
    if (tradeResult !== null) {
      prevResult = tradeResult;
    }

    return {
      id: `trade-${i}`,
      market: markets[mktIdx],
      position: rng() > 0.4 ? "Yes" as const : "No" as const,
      entry,
      current: Math.min(current, 0.99),
      size,
      pnl: isOpen
        ? Number(((current - entry) * size).toFixed(2))
        : won
          ? Number(((0.9 - entry) * size).toFixed(2))
          : Number((-entry * size).toFixed(2)),
      date: new Date(2025, openMonth, openDay).toISOString().split("T")[0],
      status: isOpen ? "Open" as const : won ? "Won" as const : "Lost" as const,
      openedAt,
      closedAt,
      holdingDurationHours,
      sizeAsPercentOfCapital,
      previousTradeResult,
      category,
      entryPriceDistance,
    };
  });
}

function generateBehavioralProfile(
  localRng: () => number,
  riskLevel: "Low" | "Medium" | "High",
): BehavioralProfile {
  let revengeTradingRate: number;
  let tiltRatio: number;
  let disciplineScore: number;
  let fomoScore: number;
  let overtradingSpikeFactor: number;

  if (riskLevel === "Low") {
    revengeTradingRate = Number((5 + localRng() * 10).toFixed(1));
    tiltRatio = Number((0.9 + localRng() * 0.2).toFixed(2));
    disciplineScore = Number((75 + localRng() * 20).toFixed(0));
    fomoScore = Number((10 + localRng() * 20).toFixed(0));
    overtradingSpikeFactor = Number((0.8 + localRng() * 0.6).toFixed(2));
  } else if (riskLevel === "Medium") {
    revengeTradingRate = Number((15 + localRng() * 15).toFixed(1));
    tiltRatio = Number((1.1 + localRng() * 0.3).toFixed(2));
    disciplineScore = Number((50 + localRng() * 25).toFixed(0));
    fomoScore = Number((30 + localRng() * 25).toFixed(0));
    overtradingSpikeFactor = Number((1.2 + localRng() * 1.0).toFixed(2));
  } else {
    revengeTradingRate = Number((30 + localRng() * 25).toFixed(1));
    tiltRatio = Number((1.3 + localRng() * 0.7).toFixed(2));
    disciplineScore = Number((30 + localRng() * 30).toFixed(0));
    fomoScore = Number((50 + localRng() * 35).toFixed(0));
    overtradingSpikeFactor = Number((1.8 + localRng() * 1.5).toFixed(2));
  }

  const avgWinHoldingHours = Number((24 + localRng() * 200).toFixed(1));
  const avgLossHoldingHours = Number((avgWinHoldingHours * (0.6 + localRng() * 1.2)).toFixed(1));
  const dispositionRatio = Number((avgLossHoldingHours / avgWinHoldingHours).toFixed(2));

  const returnConsistency = riskLevel === "Low"
    ? Number((0.3 + localRng() * 0.4).toFixed(2))
    : riskLevel === "Medium"
      ? Number((0.5 + localRng() * 0.5).toFixed(2))
      : Number((0.8 + localRng() * 0.6).toFixed(2));

  const lossAversionRatio = Number((1.0 + localRng() * 2.0).toFixed(2));
  const recencyBiasIndicator = Number(((localRng() - 0.4) * 15).toFixed(1));

  return {
    revengeTradingRate,
    tiltRatio,
    overtradingSpikeFactor,
    avgWinHoldingHours,
    avgLossHoldingHours,
    dispositionRatio,
    returnConsistency,
    disciplineScore: Number(disciplineScore),
    fomoScore: Number(fomoScore),
    lossAversionRatio,
    recencyBiasIndicator,
  };
}

function generateRollingWinRates(localRng: () => number, winRate: number): number[] {
  return Array.from({ length: 12 }, () =>
    Number((winRate - 10 + localRng() * 20).toFixed(1))
  );
}

function generateRiskProfile(
  localRng: () => number,
  riskLevel: "Low" | "Medium" | "High",
  leaderCategory: string,
  maxDrawdown: number,
  avgTradeSize: number,
  totalCapital: number,
  winRate: number,
): RiskProfile {
  const maxPositionConcentration = riskLevel === "Low"
    ? Number((3 + localRng() * 5).toFixed(1))
    : riskLevel === "Medium"
      ? Number((6 + localRng() * 8).toFixed(1))
      : Number((10 + localRng() * 15).toFixed(1));

  const topCategory = leaderCategory;
  const topCategoryConcentration = Number((40 + localRng() * 40).toFixed(1));

  const otherCats = tradeCategories.filter((c) => c !== leaderCategory);
  let remaining = 100 - topCategoryConcentration;
  const categoryBreakdown: { category: string; percentage: number; pnl: number }[] = [
    {
      category: topCategory,
      percentage: topCategoryConcentration,
      pnl: Number(((localRng() * 2 - 0.3) * totalCapital * 0.1).toFixed(0)),
    },
  ];
  const numOther = 2 + Math.floor(localRng() * 3);
  for (let i = 0; i < numOther && i < otherCats.length; i++) {
    const pct = i === numOther - 1
      ? remaining
      : Number((remaining * (0.2 + localRng() * 0.5)).toFixed(1));
    remaining -= pct;
    if (remaining < 0) remaining = 0;
    categoryBreakdown.push({
      category: otherCats[Math.floor(localRng() * otherCats.length)],
      percentage: Number(Math.max(0, pct).toFixed(1)),
      pnl: Number(((localRng() * 2 - 0.8) * totalCapital * 0.03).toFixed(0)),
    });
  }

  const numDrawdowns = 2 + Math.floor(localRng() * 3);
  const drawdownPeriods: { startDate: string; endDate: string | null; depth: number; recoveryDays: number | null }[] = [];
  for (let i = 0; i < numDrawdowns; i++) {
    const startMonth = Math.floor(localRng() * 10);
    const startDay = Math.floor(localRng() * 28) + 1;
    const depth = Number((maxDrawdown * (0.3 + localRng() * 0.7)).toFixed(1));
    const recovered = localRng() > 0.15;
    const recoveryDays = recovered ? Math.floor(5 + localRng() * 45) : null;
    const startDate = new Date(2025, startMonth, startDay);
    const endDate = recovered
      ? new Date(startDate.getTime() + (recoveryDays! + Math.floor(localRng() * 10)) * 86400000)
      : null;
    drawdownPeriods.push({
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate ? endDate.toISOString().split("T")[0] : null,
      depth,
      recoveryDays,
    });
  }

  const martingaleScore = riskLevel === "Low"
    ? Number((5 + localRng() * 20).toFixed(0))
    : riskLevel === "Medium"
      ? Number((20 + localRng() * 30).toFixed(0))
      : Number((40 + localRng() * 45).toFixed(0));

  const strategyDriftScore = riskLevel === "Low"
    ? Number((5 + localRng() * 15).toFixed(0))
    : riskLevel === "Medium"
      ? Number((15 + localRng() * 25).toFixed(0))
      : Number((30 + localRng() * 40).toFixed(0));

  const eventDependencyScore = Number((20 + localRng() * 60).toFixed(0));

  const worstSingleTradeLoss = Number((1 + localRng() * 12 * (riskLevel === "Low" ? 0.3 : riskLevel === "Medium" ? 0.6 : 1.0)).toFixed(1));

  // Rolling win rate array for backward compat with leader-grades.ts
  const rollingWinRate30d = generateRollingWinRates(localRng, winRate);
  const rates = rollingWinRate30d;
  const winRateTrend = rates.length > 1
    ? Number(((rates[rates.length - 1] - rates[0]) / rates.length).toFixed(2))
    : 0;

  return {
    maxPositionConcentration,
    topCategoryConcentration,
    topCategory,
    categoryBreakdown,
    drawdownPeriods,
    martingaleScore: Number(martingaleScore),
    strategyDriftScore: Number(strategyDriftScore),
    eventDependencyScore: Number(eventDependencyScore),
    worstSingleTradeLoss,
    winRateTrend,
    rollingWinRate30d,
  };
}

function generateRollingMetrics(
  localRng: () => number,
  winRate: number,
  sharpeRatio: number,
  equityCurve: { date: string; value: number }[],
  riskLevel: "Low" | "Medium" | "High",
  leaderCategory?: string,
  recentTrades?: Trade[],
): RollingMetrics {
  const numWeeks = 40;

  // Rolling Sharpe 30d
  const rollingSharpe30d: { date: string; value: number }[] = [];
  for (let i = 0; i < numWeeks; i++) {
    const d = new Date(2025, 0, 1);
    d.setDate(d.getDate() + i * 7);
    const noise = riskLevel === "Low" ? 0.3 : riskLevel === "Medium" ? 0.6 : 1.0;
    rollingSharpe30d.push({
      date: d.toISOString().split("T")[0],
      value: Number((sharpeRatio + (localRng() - 0.5) * noise * 2).toFixed(2)),
    });
  }

  // Rolling win rates with dates
  const makeRollingWinRate = (window: number) => {
    const result: { date: string; value: number }[] = [];
    const smoothing = window / 30;
    for (let i = 0; i < numWeeks; i++) {
      const d = new Date(2025, 0, 1);
      d.setDate(d.getDate() + i * 7);
      const drift = (localRng() - 0.45) * (12 / smoothing);
      result.push({
        date: d.toISOString().split("T")[0],
        value: Number(Math.min(95, Math.max(35, winRate + drift)).toFixed(1)),
      });
    }
    return result;
  };

  const rollingWinRate30d = makeRollingWinRate(30);
  const rollingWinRate60d = makeRollingWinRate(60);
  const rollingWinRate90d = makeRollingWinRate(90);

  // PnL distribution histogram
  const buckets = [
    { bucket: "-$2000+", isNegative: true },
    { bucket: "-$1500 to -$1000", isNegative: true },
    { bucket: "-$1000 to -$500", isNegative: true },
    { bucket: "-$500 to $0", isNegative: true },
    { bucket: "$0 to $500", isNegative: false },
    { bucket: "$500 to $1000", isNegative: false },
    { bucket: "$1000 to $1500", isNegative: false },
    { bucket: "$1500 to $2000", isNegative: false },
    { bucket: "$2000+", isNegative: false },
  ];
  const pnlDistribution = buckets.map((b) => {
    let count: number;
    if (b.bucket === "$0 to $500" || b.bucket === "-$500 to $0") {
      count = Math.floor(20 + localRng() * 40);
    } else if (b.bucket.includes("2000")) {
      count = Math.floor(2 + localRng() * 10);
    } else {
      count = Math.floor(8 + localRng() * 25);
    }
    return { ...b, count };
  });

  // Size vs outcome
  const sizeVsOutcome: { size: number; pnl: number; won: boolean }[] = [];
  for (let i = 0; i < 50; i++) {
    const size = Math.round((200 + localRng() * 5000) / 100) * 100;
    const won = localRng() < winRate / 100;
    const pnl = won
      ? Number((size * (0.1 + localRng() * 0.8)).toFixed(0))
      : Number((-size * (0.2 + localRng() * 0.6)).toFixed(0));
    sizeVsOutcome.push({ size, pnl, won });
  }

  // Holding vs profitability
  const holdingVsProfitability: { holdingHours: number; pnl: number; won: boolean }[] = [];
  for (let i = 0; i < 50; i++) {
    const holdingHours = Number((1 + localRng() * 500).toFixed(1));
    const won = localRng() < winRate / 100;
    const pnl = won
      ? Number((100 + localRng() * 2000).toFixed(0))
      : Number((-50 - localRng() * 1500).toFixed(0));
    holdingVsProfitability.push({ holdingHours, pnl, won });
  }

  // Time of day heatmap: 7 days x 6 time blocks (0-4, 4-8, 8-12, 12-16, 16-20, 20-24)
  const timeOfDayHeatmap: { day: number; hour: number; trades: number; winRate: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let block = 0; block < 6; block++) {
      const hour = block * 4;
      const baseCount = hour < 8 || hour >= 20 ? 2 : 8;
      const trades = Math.floor(baseCount + localRng() * baseCount * 2);
      const wr = Number(Math.min(90, Math.max(30, winRate + (localRng() - 0.5) * 30)).toFixed(1));
      timeOfDayHeatmap.push({ day, hour, trades, winRate: wr });
    }
  }

  // Underwater equity derived from equity curve
  const underwaterEquity: { date: string; drawdownPercent: number }[] = [];
  if (equityCurve.length > 0) {
    let peak = equityCurve[0].value;
    for (let i = 0; i < equityCurve.length; i += 7) {
      const point = equityCurve[i];
      if (point.value > peak) peak = point.value;
      const dd = Number((((peak - point.value) / peak) * 100).toFixed(2));
      underwaterEquity.push({ date: point.date, drawdownPercent: dd });
    }
  }

  // Weekly trade count
  const weeklyTradeCount: { week: string; count: number }[] = [];
  for (let i = 0; i < numWeeks; i++) {
    const d = new Date(2025, 0, 1);
    d.setDate(d.getDate() + i * 7);
    const baseCount = riskLevel === "Low" ? 3 : riskLevel === "Medium" ? 6 : 10;
    const count = Math.max(0, Math.floor(baseCount + (localRng() - 0.3) * baseCount * 1.5));
    weeklyTradeCount.push({
      week: d.toISOString().split("T")[0],
      count,
    });
  }

  // Category win rates — derived from recentTrades if available, otherwise generated
  let categoryWinRates: { category: string; winRate: number; tradeCount: number }[];
  if (recentTrades && recentTrades.length > 0) {
    const catMap: Record<string, { wins: number; total: number }> = {};
    for (const t of recentTrades) {
      if (t.status === "Open") continue;
      if (!catMap[t.category]) catMap[t.category] = { wins: 0, total: 0 };
      catMap[t.category].total++;
      if (t.status === "Won") catMap[t.category].wins++;
    }
    categoryWinRates = Object.entries(catMap).map(([category, data]) => ({
      category,
      winRate: data.total > 0 ? Number(((data.wins / data.total) * 100).toFixed(1)) : 0,
      tradeCount: data.total,
    }));
  } else {
    const cats = leaderCategory ? [leaderCategory, ...tradeCategories.filter((c) => c !== leaderCategory).slice(0, 3)] : tradeCategories.slice(0, 4);
    categoryWinRates = cats.map((category, i) => ({
      category,
      winRate: Number(Math.min(95, Math.max(35, winRate + (localRng() - 0.5) * (i === 0 ? 10 : 20))).toFixed(1)),
      tradeCount: Math.floor(10 + localRng() * 50),
    }));
  }

  // No-position ratio — derived from recentTrades if available, otherwise generated
  let noPositionRatio: number;
  if (recentTrades && recentTrades.length > 0) {
    const noCount = recentTrades.filter((t) => t.position === "No").length;
    noPositionRatio = Number((noCount / recentTrades.length).toFixed(3));
  } else {
    noPositionRatio = Number((0.3 + localRng() * 0.4).toFixed(3));
  }

  return {
    rollingSharpe30d,
    rollingWinRate30d,
    rollingWinRate60d,
    rollingWinRate90d,
    pnlDistribution,
    sizeVsOutcome,
    holdingVsProfitability,
    timeOfDayHeatmap,
    underwaterEquity,
    weeklyTradeCount,
    categoryWinRates,
    noPositionRatio,
  };
}

// Reset seed before generating leader data for deterministic output
rng = createRng(42);

function generateFollowerStats(
  localRng: () => number,
  leader: {
    followers: number;
    winRate: number;
    roi: number;
    category: string;
    username: string;
  },
): FollowerStats {
  const totalFollowers = leader.followers;
  const followerWinRate = Number((leader.winRate - (2 + localRng() * 8)).toFixed(1));
  const leaderWinRate = leader.winRate;
  const followerAvgReturn = Number((leader.roi * (0.6 + localRng() * 0.25)).toFixed(1));

  // Sentiment based on performance
  let sentimentScore: number;
  if (leader.roi > 60 && leader.winRate > 68) {
    sentimentScore = Number((70 + localRng() * 25).toFixed(0));
  } else if (leader.roi > 30 && leader.winRate > 60) {
    sentimentScore = Number((45 + localRng() * 25).toFixed(0));
  } else {
    sentimentScore = Number((20 + localRng() * 30).toFixed(0));
  }
  sentimentScore = Number(sentimentScore);

  // Derive breakdown from score
  const positiveBase = sentimentScore * 0.8 + localRng() * 10;
  const negativeBase = (100 - sentimentScore) * 0.7 + localRng() * 10;
  const total = positiveBase + negativeBase + 20;
  const sentimentBreakdown = {
    positive: Number(((positiveBase / total) * 100).toFixed(0)),
    neutral: Number(((20 / total) * 100).toFixed(0)),
    negative: Number(((negativeBase / total) * 100).toFixed(0)),
  };

  const maxSlippage = Number((1.5 + localRng() * 6).toFixed(2));
  const avgSlippage = Number((maxSlippage * (0.2 + localRng() * 0.3)).toFixed(2));

  // Money following over time: 40 weekly data points
  const moneyFollowingOverTime: { date: string; amount: number }[] = [];
  const popularityFactor = totalFollowers / 1000;
  let currentAUM = (100000 + localRng() * 200000) * popularityFactor;
  const isGoodLeader = leader.roi > 40 && leader.winRate > 65;
  for (let i = 0; i < 40; i++) {
    const d = new Date(2025, 0, 1);
    d.setDate(d.getDate() + i * 7);
    const trend = isGoodLeader ? 1.01 + localRng() * 0.04 : 0.98 + localRng() * 0.05;
    const dip = localRng() < 0.15 ? 0.85 + localRng() * 0.1 : 1;
    currentAUM = currentAUM * trend * dip;
    moneyFollowingOverTime.push({
      date: d.toISOString().split("T")[0],
      amount: Math.round(currentAUM),
    });
  }

  // Follower vs leader cumulative returns: 40 weekly data points
  const followerVsLeaderReturns: { date: string; leader: number; follower: number }[] = [];
  let leaderCum = 0;
  let followerCum = 0;
  const weeklyLeaderReturn = leader.roi / 52;
  for (let i = 0; i < 40; i++) {
    const d = new Date(2025, 0, 1);
    d.setDate(d.getDate() + i * 7);
    const weekReturn = weeklyLeaderReturn + (localRng() - 0.45) * 2;
    leaderCum += weekReturn;
    followerCum += weekReturn * (0.65 + localRng() * 0.2);
    followerVsLeaderReturns.push({
      date: d.toISOString().split("T")[0],
      leader: Number(leaderCum.toFixed(2)),
      follower: Number(followerCum.toFixed(2)),
    });
  }

  // Comments: 6-10 per leader
  const commentUsernames = [
    "crypto_mike", "trader_jane", "pm_enthusiast", "alpha_seeker",
    "market_maven", "degentrader", "risk_master", "poly_pro",
    "whale_watcher", "odds_hunter", "signal_surfer", "bet_brain",
    "momentum_matt", "data_dana", "sharp_shooter",
  ];

  const positiveTemplates = [
    `Great calls on ${leader.category.toLowerCase()} markets!`,
    `Been following for 3 months, very impressed with the consistency.`,
    `${leader.username} is my top performer. Solid returns every week.`,
    `Best ${leader.category.toLowerCase()} trader on the platform, hands down.`,
    `The win rate speaks for itself. Highly recommend.`,
    `Copied every trade for 2 months and I'm up significantly.`,
  ];

  const neutralTemplates = [
    `Following for a month, decent returns so far.`,
    `Returns are OK but slippage eats into profits a bit.`,
    `Solid ${leader.category.toLowerCase()} picks but could be more active.`,
    `Average week was fine. Waiting to see more data before judging.`,
    `Mixed results for me personally but the strategy seems sound.`,
  ];

  const negativeTemplates = [
    `Slippage is killing my returns on the bigger positions.`,
    `Win rate dropped recently, hoping it's just a rough patch.`,
    `My actual returns are way below what's advertised. Disappointed.`,
    `Too many ${leader.category.toLowerCase()} bets concentrated in one area.`,
    `Had a bad month copying this leader. Considering unfollowing.`,
  ];

  const numComments = 6 + Math.floor(localRng() * 5);
  const comments: FollowerComment[] = [];
  for (let i = 0; i < numComments; i++) {
    const r = localRng();
    let sentiment: "positive" | "neutral" | "negative";
    let text: string;
    if (r < sentimentBreakdown.positive / 100) {
      sentiment = "positive";
      text = positiveTemplates[Math.floor(localRng() * positiveTemplates.length)];
    } else if (r < (sentimentBreakdown.positive + sentimentBreakdown.neutral) / 100) {
      sentiment = "neutral";
      text = neutralTemplates[Math.floor(localRng() * neutralTemplates.length)];
    } else {
      sentiment = "negative";
      text = negativeTemplates[Math.floor(localRng() * negativeTemplates.length)];
    }

    const commUser = commentUsernames[Math.floor(localRng() * commentUsernames.length)];
    const commentDay = Math.floor(localRng() * 280);
    const commentDate = new Date(2025, 0, 1);
    commentDate.setDate(commentDate.getDate() + commentDay);

    comments.push({
      id: `comment-${leader.username}-${i}`,
      username: commUser,
      avatarUrl: `https://i.pravatar.cc/40?u=${commUser}${i}`,
      date: commentDate.toISOString().split("T")[0],
      text,
      sentiment,
      likes: Math.floor(localRng() * 50),
    });
  }

  return {
    totalFollowers,
    followerWinRate,
    leaderWinRate,
    followerAvgReturn,
    sentimentScore,
    sentimentBreakdown,
    maxSlippage,
    avgSlippage,
    moneyFollowingOverTime,
    followerVsLeaderReturns,
    comments,
  };
}

function buildLeader(
  base: {
    id: string; name: string; username: string; avatar: string; verified: boolean;
    category: string; riskLevel: "Low" | "Medium" | "High"; totalCapital: number;
    roi: number; winRate: number; sharpeRatio: number; sortinoRatio: number;
    maxDrawdown: number; totalTrades: number; activeTrades: number; followers: number;
    tradeFrequency: string; avgTradeSize: number; profitFactor: number; streak: number;
    bio: string; joinedDate: string; tags: string[]; correlationGroup: string;
    monthlyReturnArgs: [number, number]; equityCurveArgs: [number, number];
    tradeCount: number;
  },
): Leader {
  const monthlyReturns = generateMonthlyReturns(base.monthlyReturnArgs[0], base.monthlyReturnArgs[1]);
  const equityCurve = generateEquityCurve(base.equityCurveArgs[0], base.equityCurveArgs[1]);
  const recentTrades = generateTrades(base.tradeCount, base.winRate, base.category, base.totalCapital);
  const behavioralProfile = generateBehavioralProfile(rng, base.riskLevel);
  const riskProfile = generateRiskProfile(rng, base.riskLevel, base.category, base.maxDrawdown, base.avgTradeSize, base.totalCapital, base.winRate);
  const rollingMetrics = generateRollingMetrics(rng, base.winRate, base.sharpeRatio, equityCurve, base.riskLevel, base.category, recentTrades);
  const followerStatsRng = createRng(77 + Number(base.id));
  const followerStats = generateFollowerStats(followerStatsRng, {
    followers: base.followers,
    winRate: base.winRate,
    roi: base.roi,
    category: base.category,
    username: base.username,
  });
  // Build the leader without walletIntelligence first, then compute and attach
  const leader: Leader = {
    id: base.id,
    name: base.name,
    username: base.username,
    avatar: base.avatar,
    avatarUrl: `https://i.pravatar.cc/150?u=${base.username}`,
    verified: base.verified,
    category: base.category,
    riskLevel: base.riskLevel,
    totalCapital: base.totalCapital,
    roi: base.roi,
    winRate: base.winRate,
    sharpeRatio: base.sharpeRatio,
    sortinoRatio: base.sortinoRatio,
    maxDrawdown: base.maxDrawdown,
    totalTrades: base.totalTrades,
    activeTrades: base.activeTrades,
    followers: base.followers,
    tradeFrequency: base.tradeFrequency,
    avgTradeSize: base.avgTradeSize,
    profitFactor: base.profitFactor,
    streak: base.streak,
    bio: base.bio,
    joinedDate: base.joinedDate,
    tags: base.tags,
    correlationGroup: base.correlationGroup,
    monthlyReturns,
    equityCurve,
    recentTrades,
    behavioralProfile,
    riskProfile,
    rollingMetrics,
    followerStats,
    walletIntelligence: null as unknown as WalletIntelligence, // placeholder
    sharpnessProfile: null as unknown as SharpnessProfile, // placeholder — set by computeAllSharpnessProfiles after all leaders are built
  };
  leader.walletIntelligence = computeWalletIntelligence(leader);
  return leader;
}

export const leaders: Leader[] = [
  buildLeader({
    id: "1",
    name: "Alex Greenfield",
    username: "greentrades",
    avatar: "AG",
    verified: true,
    category: "Politics",
    riskLevel: "Low",
    totalCapital: 285000,
    roi: 47.2,
    winRate: 72,
    sharpeRatio: 2.14,
    sortinoRatio: 3.21,
    maxDrawdown: 8.3,
    totalTrades: 342,
    activeTrades: 8,
    followers: 1243,
    tradeFrequency: "Daily",
    avgTradeSize: 1200,
    profitFactor: 2.8,
    streak: 7,
    bio: "Former political analyst at Bloomberg. Specializing in US & global election markets with data-driven approach.",
    joinedDate: "2024-03-15",
    tags: ["Elections", "Policy", "Data-Driven"],
    correlationGroup: "politics",
    monthlyReturnArgs: [4.2, 2.5],
    equityCurveArgs: [12, 47.2],
    tradeCount: 15,
  }),
  buildLeader({
    id: "2",
    name: "Sarah Chen",
    username: "cryptoqueen",
    avatar: "SC",
    verified: true,
    category: "Crypto",
    riskLevel: "Medium",
    totalCapital: 520000,
    roi: 89.5,
    winRate: 68,
    sharpeRatio: 1.95,
    sortinoRatio: 2.87,
    maxDrawdown: 15.2,
    totalTrades: 567,
    activeTrades: 12,
    followers: 3421,
    tradeFrequency: "Daily",
    avgTradeSize: 2500,
    profitFactor: 2.4,
    streak: 4,
    bio: "Crypto researcher & on-chain analyst. Previously at Chainalysis. Focus on BTC/ETH price markets and DeFi events.",
    joinedDate: "2024-01-10",
    tags: ["Bitcoin", "Ethereum", "DeFi"],
    correlationGroup: "crypto",
    monthlyReturnArgs: [6.8, 4.5],
    equityCurveArgs: [12, 89.5],
    tradeCount: 20,
  }),
  buildLeader({
    id: "3",
    name: "Michael Torres",
    username: "macroman",
    avatar: "MT",
    verified: true,
    category: "Economics",
    riskLevel: "Low",
    totalCapital: 190000,
    roi: 31.8,
    winRate: 76,
    sharpeRatio: 2.45,
    sortinoRatio: 3.67,
    maxDrawdown: 5.1,
    totalTrades: 198,
    activeTrades: 5,
    followers: 892,
    tradeFrequency: "Weekly",
    avgTradeSize: 800,
    profitFactor: 3.2,
    streak: 11,
    bio: "PhD in Economics from MIT. Macro-focused predictions on interest rates, GDP, and employment figures.",
    joinedDate: "2024-06-20",
    tags: ["Fed", "Interest Rates", "Employment"],
    correlationGroup: "economics",
    monthlyReturnArgs: [2.8, 1.2],
    equityCurveArgs: [12, 31.8],
    tradeCount: 12,
  }),
  buildLeader({
    id: "4",
    name: "Jessica Park",
    username: "sportsoracle",
    avatar: "JP",
    verified: false,
    category: "Sports",
    riskLevel: "High",
    totalCapital: 95000,
    roi: 124.6,
    winRate: 61,
    sharpeRatio: 1.42,
    sortinoRatio: 1.89,
    maxDrawdown: 22.5,
    totalTrades: 892,
    activeTrades: 15,
    followers: 2156,
    tradeFrequency: "Daily",
    avgTradeSize: 450,
    profitFactor: 1.9,
    streak: 3,
    bio: "Sports analytics professional. Uses proprietary models for NBA, NFL, and soccer predictions.",
    joinedDate: "2024-02-28",
    tags: ["NBA", "NFL", "Soccer"],
    correlationGroup: "sports",
    monthlyReturnArgs: [8.5, 7.0],
    equityCurveArgs: [12, 124.6],
    tradeCount: 25,
  }),
  buildLeader({
    id: "5",
    name: "David Kim",
    username: "techprophet",
    avatar: "DK",
    verified: true,
    category: "Technology",
    riskLevel: "Medium",
    totalCapital: 345000,
    roi: 62.3,
    winRate: 69,
    sharpeRatio: 1.87,
    sortinoRatio: 2.65,
    maxDrawdown: 12.8,
    totalTrades: 445,
    activeTrades: 9,
    followers: 1876,
    tradeFrequency: "Daily",
    avgTradeSize: 1800,
    profitFactor: 2.3,
    streak: 5,
    bio: "Ex-FAANG engineer turned prediction market trader. Deep expertise in AI/ML, product launches, and tech policy.",
    joinedDate: "2024-04-05",
    tags: ["AI", "Big Tech", "Product Launches"],
    correlationGroup: "tech",
    monthlyReturnArgs: [5.2, 3.2],
    equityCurveArgs: [12, 62.3],
    tradeCount: 18,
  }),
  buildLeader({
    id: "6",
    name: "Emma Wilson",
    username: "globalista",
    avatar: "EW",
    verified: true,
    category: "World Events",
    riskLevel: "Low",
    totalCapital: 210000,
    roi: 38.9,
    winRate: 74,
    sharpeRatio: 2.31,
    sortinoRatio: 3.45,
    maxDrawdown: 6.7,
    totalTrades: 267,
    activeTrades: 6,
    followers: 1534,
    tradeFrequency: "Weekly",
    avgTradeSize: 1100,
    profitFactor: 2.9,
    streak: 9,
    bio: "Former Foreign Service officer. Expert in geopolitics, international relations, and global event prediction.",
    joinedDate: "2024-05-12",
    tags: ["Geopolitics", "Climate", "Global Events"],
    correlationGroup: "geopolitics",
    monthlyReturnArgs: [3.4, 1.8],
    equityCurveArgs: [12, 38.9],
    tradeCount: 14,
  }),
  buildLeader({
    id: "7",
    name: "Ryan O'Brien",
    username: "culturevulture",
    avatar: "RO",
    verified: false,
    category: "Entertainment",
    riskLevel: "Medium",
    totalCapital: 78000,
    roi: 55.1,
    winRate: 65,
    sharpeRatio: 1.65,
    sortinoRatio: 2.12,
    maxDrawdown: 14.3,
    totalTrades: 534,
    activeTrades: 11,
    followers: 987,
    tradeFrequency: "Daily",
    avgTradeSize: 600,
    profitFactor: 2.1,
    streak: 2,
    bio: "Entertainment industry insider. Predicts box office, awards, and cultural events with uncanny accuracy.",
    joinedDate: "2024-07-01",
    tags: ["Movies", "Awards", "Pop Culture"],
    correlationGroup: "entertainment",
    monthlyReturnArgs: [4.6, 3.5],
    equityCurveArgs: [12, 55.1],
    tradeCount: 16,
  }),
  buildLeader({
    id: "8",
    name: "Lisa Nakamura",
    username: "sciencebet",
    avatar: "LN",
    verified: true,
    category: "Science",
    riskLevel: "Low",
    totalCapital: 156000,
    roi: 28.4,
    winRate: 78,
    sharpeRatio: 2.67,
    sortinoRatio: 4.01,
    maxDrawdown: 4.2,
    totalTrades: 145,
    activeTrades: 4,
    followers: 654,
    tradeFrequency: "Monthly",
    avgTradeSize: 900,
    profitFactor: 3.5,
    streak: 14,
    bio: "Research scientist at Stanford. Specializes in biotech, space exploration, and scientific milestone predictions.",
    joinedDate: "2024-08-15",
    tags: ["Biotech", "Space", "Research"],
    correlationGroup: "science",
    monthlyReturnArgs: [2.4, 0.9],
    equityCurveArgs: [12, 28.4],
    tradeCount: 10,
  }),
  buildLeader({
    id: "9",
    name: "Carlos Rivera",
    username: "latamtrader",
    avatar: "CR",
    verified: false,
    category: "Politics",
    riskLevel: "High",
    totalCapital: 135000,
    roi: 98.7,
    winRate: 63,
    sharpeRatio: 1.54,
    sortinoRatio: 2.01,
    maxDrawdown: 19.8,
    totalTrades: 678,
    activeTrades: 14,
    followers: 1345,
    tradeFrequency: "Daily",
    avgTradeSize: 700,
    profitFactor: 2.0,
    streak: 1,
    bio: "Political consultant specializing in Latin American and emerging market elections.",
    joinedDate: "2024-04-20",
    tags: ["Latin America", "Emerging Markets", "Elections"],
    correlationGroup: "politics",
    monthlyReturnArgs: [7.5, 6.0],
    equityCurveArgs: [12, 98.7],
    tradeCount: 22,
  }),
  buildLeader({
    id: "10",
    name: "Nina Patel",
    username: "quantnina",
    avatar: "NP",
    verified: true,
    category: "Multi-Category",
    riskLevel: "Low",
    totalCapital: 420000,
    roi: 41.5,
    winRate: 71,
    sharpeRatio: 2.38,
    sortinoRatio: 3.52,
    maxDrawdown: 7.1,
    totalTrades: 312,
    activeTrades: 7,
    followers: 2789,
    tradeFrequency: "Weekly",
    avgTradeSize: 1500,
    profitFactor: 2.7,
    streak: 8,
    bio: "Quantitative analyst with 15 years on Wall Street. Applies systematic strategies across all market categories.",
    joinedDate: "2024-02-01",
    tags: ["Quantitative", "Systematic", "Diversified"],
    correlationGroup: "quant",
    monthlyReturnArgs: [3.6, 1.5],
    equityCurveArgs: [12, 41.5],
    tradeCount: 15,
  }),
  buildLeader({
    id: "11",
    name: "James Thornton",
    username: "hedgefundguy",
    avatar: "JT",
    verified: true,
    category: "Economics",
    riskLevel: "Medium",
    totalCapital: 680000,
    roi: 52.8,
    winRate: 67,
    sharpeRatio: 1.92,
    sortinoRatio: 2.78,
    maxDrawdown: 11.5,
    totalTrades: 389,
    activeTrades: 10,
    followers: 4102,
    tradeFrequency: "Daily",
    avgTradeSize: 3200,
    profitFactor: 2.5,
    streak: 6,
    bio: "Former hedge fund PM at Bridgewater. Macro specialist with focus on rates, inflation, and central bank policy.",
    joinedDate: "2024-01-05",
    tags: ["Macro", "Rates", "Central Banks"],
    correlationGroup: "economics",
    monthlyReturnArgs: [4.8, 3.0],
    equityCurveArgs: [12, 52.8],
    tradeCount: 18,
  }),
  buildLeader({
    id: "12",
    name: "Aisha Mohammed",
    username: "weatherwatcher",
    avatar: "AM",
    verified: false,
    category: "Science",
    riskLevel: "Medium",
    totalCapital: 67000,
    roi: 44.2,
    winRate: 70,
    sharpeRatio: 1.78,
    sortinoRatio: 2.45,
    maxDrawdown: 10.9,
    totalTrades: 234,
    activeTrades: 6,
    followers: 432,
    tradeFrequency: "Weekly",
    avgTradeSize: 500,
    profitFactor: 2.2,
    streak: 4,
    bio: "Climate scientist turned prediction market trader. Specializes in weather, climate policy, and environmental milestones.",
    joinedDate: "2024-09-01",
    tags: ["Climate", "Weather", "Environment"],
    correlationGroup: "science",
    monthlyReturnArgs: [3.8, 2.2],
    equityCurveArgs: [12, 44.2],
    tradeCount: 12,
  }),
];

// Compute sharpness profiles for all leaders (batch — assigns ranks)
{
  const profiles = computeAllSharpnessProfiles(leaders);
  for (let i = 0; i < leaders.length; i++) {
    leaders[i].sharpnessProfile = profiles[i];
  }
}

export const categories = [
  "All",
  "Politics",
  "Crypto",
  "Economics",
  "Sports",
  "Technology",
  "World Events",
  "Entertainment",
  "Science",
  "Multi-Category",
];

export const riskLevels = ["All", "Low", "Medium", "High"];
export const frequencies = ["All", "Daily", "Weekly", "Monthly"];

export function getLeaderById(id: string): Leader | undefined {
  return leaders.find((l) => l.id === id);
}

export function calculateKellyCriterion(winRate: number, avgWin: number, avgLoss: number): number {
  const p = winRate / 100;
  const q = 1 - p;
  const b = avgWin / avgLoss;
  const kelly = (p * b - q) / b;
  return Math.max(0, Math.min(kelly, 0.25)); // Cap at 25%
}

export function getCorrelationScore(group1: string, group2: string): number {
  if (group1 === group2) return 0.85;
  const highCorr: Record<string, string[]> = {
    politics: ["geopolitics"],
    geopolitics: ["politics"],
    crypto: ["tech"],
    tech: ["crypto"],
    economics: ["crypto"],
  };
  if (highCorr[group1]?.includes(group2)) return 0.55;
  return 0.15;
}

export const mockPortfolio: Portfolio = {
  leaders: [
    { leaderId: "1", allocated: 5000, pnl: 2360, followingSince: "2025-01-15", isActive: true },
    { leaderId: "3", allocated: 3000, pnl: 954, followingSince: "2025-02-01", isActive: true },
    { leaderId: "5", allocated: 4000, pnl: 2492, followingSince: "2025-01-20", isActive: true },
    { leaderId: "8", allocated: 2000, pnl: 568, followingSince: "2025-03-10", isActive: true },
    { leaderId: "10", allocated: 6000, pnl: 2490, followingSince: "2025-01-05", isActive: true },
  ],
  totalAllocated: 20000,
  totalPnl: 8864,
  balance: 32500,
};
