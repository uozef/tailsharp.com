"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  Heart,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  ExternalLink,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Timestamp from "@/components/Timestamp";
import type { LeaderboardEntry, TradeActivity } from "@/lib/polymarket-api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TradeAnalysis {
  totalTrades: number;
  buyCount: number;
  sellCount: number;
  avgTradeSize: number;
  mostTradedMarkets: { title: string; count: number }[];
  tradesPerDay: number;
  uniqueMarkets: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncateWallet(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatTimestamp(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const tooltipStyle = {
  borderRadius: "12px",
  border: "none",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
};

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-40 rounded bg-surface-inset" />
      <div className="rounded-2xl bg-surface p-8">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 rounded-full bg-surface-inset" />
          <div className="space-y-3 flex-1">
            <div className="h-6 w-48 rounded bg-surface-inset" />
            <div className="h-4 w-64 rounded bg-surface-inset" />
            <div className="h-4 w-32 rounded bg-surface-inset" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl bg-surface p-5 shadow-sm">
            <div className="h-4 w-20 rounded bg-surface-inset mb-3" />
            <div className="h-7 w-28 rounded bg-surface-inset" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-surface p-6">
        <div className="h-5 w-36 rounded bg-surface-inset mb-4" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 w-full rounded bg-surface-inset mb-2" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function LeaderProfilePage() {
  const params = useParams<{ id: string }>();
  const walletAddress = params.id;

  interface WalletProfile {
    wallet: string;
    displayName: string | null;
    profileImage: string;
    verified: boolean;
    xUsername: string;
    rank: number | null;
    totalPnl: number;
    totalVolume: number;
    roi: number;
    portfolioValue: number;
    currentPositions: number;
    openPositions: number;
    positionsInvested: number;
    positionsCurrentValue: number;
    resolvedPositions: number;
    winningPositions: number;
    losingPositions: number;
    winRate: number | null;
    totalTrades: number;
    totalActivityRecords: number;
    buyCount: number;
    sellCount: number;
    avgTradeSize: number;
    tradesPerDay: number;
    tradingDays: number;
    uniqueMarkets: number;
    topMarkets: { title: string; count: number }[];
    positions: any[];
    recentActivity: TradeActivity[];
  }

  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [activity, setActivity] = useState<TradeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  // Ingestion progress
  const [ingestion, setIngestion] = useState<{
    status: string; totalFetched: number; currentPage: number; percentComplete: number;
  } | null>(null);

  /* ---- Fetch data ---- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Fetch comprehensive profile (positions + leaderboard + value + activity)
        const profileRes = await fetch(`/api/polymarket/profile?wallet=${walletAddress}`);
        if (!profileRes.ok) throw new Error(`Profile API returned ${profileRes.status}`);
        const profileData: WalletProfile = await profileRes.json();

        if (cancelled) return;

        setProfile(profileData);
        setActivity(Array.isArray(profileData.recentActivity) ? profileData.recentActivity : []);
        setFetchedAt(new Date().toISOString());

        // Trigger background ingestion of full trade history
        fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress }),
        }).catch(() => {});
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Failed to fetch data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [walletAddress]);

  // Poll ingestion progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      try {
        const res = await fetch(`/api/ingest/${walletAddress}`);
        if (res.ok) {
          const data = await res.json();
          setIngestion(data);
          if (data.status === "complete" || data.status === "error" || data.status === "not_started") {
            if (interval) clearInterval(interval);
          }
        }
      } catch { /* ignore */ }
    }

    poll();
    interval = setInterval(poll, 2000);
    return () => { if (interval) clearInterval(interval); };
  }, [walletAddress]);

  /* ---- Derived analytics ---- */
  const analysis = useMemo<TradeAnalysis | null>(() => {
    if (!activity.length) return null;

    const buyCount = activity.filter((t) => t.side === "BUY").length;
    const sellCount = activity.filter((t) => t.side === "SELL").length;
    const totalSize = activity.reduce((s, t) => s + (t.usdcSize || 0), 0);
    const avgTradeSize = activity.length > 0 ? totalSize / activity.length : 0;

    // Group by market title
    const marketCounts: Record<string, number> = {};
    for (const t of activity) {
      const key = t.title || t.name || "Unknown";
      marketCounts[key] = (marketCounts[key] || 0) + 1;
    }
    const mostTradedMarkets = Object.entries(marketCounts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Trades per day
    const timestamps = activity.map((t) => t.timestamp).filter(Boolean);
    let tradesPerDay = 0;
    if (timestamps.length > 1) {
      const minTs = Math.min(...timestamps);
      const maxTs = Math.max(...timestamps);
      const daySpan = Math.max(1, (maxTs - minTs) / 86400);
      tradesPerDay = timestamps.length / daySpan;
    }

    return {
      totalTrades: activity.length,
      buyCount,
      sellCount,
      avgTradeSize,
      mostTradedMarkets,
      tradesPerDay,
      uniqueMarkets: Object.keys(marketCounts).length,
    };
  }, [activity]);

  /* ---- Computed stats (from profile API — leaderboard + positions + activity) ---- */
  const displayName = profile?.displayName || truncateWallet(walletAddress);
  const profileImage = profile?.profileImage || "";
  const totalVolume = profile?.totalVolume ?? 0;
  const totalPnl = profile?.totalPnl ?? 0;
  const roi = profile?.roi ?? 0;
  const rank = profile?.rank ?? null;
  const winRate = profile?.winRate ?? null;
  const portfolioValue = profile?.portfolioValue ?? 0;
  const openPositions = profile?.openPositions ?? 0;
  const totalPositions = profile?.currentPositions ?? 0;

  /* ---- Side distribution chart data ---- */
  const sideData = useMemo(() => {
    if (!analysis) return [];
    return [
      { name: "BUY", value: analysis.buyCount, color: "var(--green-500)" },
      { name: "SELL", value: analysis.sellCount, color: "var(--danger)" },
    ];
  }, [analysis]);

  /* ---- Most traded markets bar data ---- */
  const marketBarData = useMemo(() => {
    if (!analysis) return [];
    return analysis.mostTradedMarkets.map((m) => ({
      name: m.title.length > 30 ? m.title.slice(0, 30) + "..." : m.title,
      trades: m.count,
    }));
  }, [analysis]);

  /* ---- Sharp Score ---- */
  const sharpScore = useMemo(() => {
    if (!activity.length) return null;
    const buyTrades = activity.filter((t) => t.side === "BUY" && t.price != null);
    if (!buyTrades.length) return { score: 0, label: "Recreational" as const };
    const totalWeight = buyTrades.reduce((s, t) => s + (t.usdcSize || 1), 0);
    const weightedEdge = buyTrades.reduce((s, t) => {
      const dist = Math.abs(Number(t.price) - 0.5);
      return s + dist * (t.usdcSize || 1);
    }, 0);
    const avgEdge = totalWeight > 0 ? weightedEdge / totalWeight : 0;
    const raw = Math.min(100, Math.round(avgEdge * 200));
    let label: "Sharp" | "Moderate" | "Recreational" | "Losing" = "Recreational";
    if (roi > 50 && (analysis?.totalTrades ?? 0) > 50) label = "Sharp";
    else if (roi > 20) label = "Moderate";
    else if (roi > 0) label = "Recreational";
    else label = "Losing";
    return { score: raw, label };
  }, [activity, roi, analysis]);

  /* ---- Forecasting Edge & Skill Signals ---- */
  const forecastingEdge = useMemo(() => {
    if (!activity.length || !analysis) return null;
    const buyTrades = activity.filter((t) => t.side === "BUY" && t.price != null);
    const winningUnderdogs = buyTrades.filter((t) => Number(t.price) < 0.5);
    const clv = winningUnderdogs.length > 0
      ? winningUnderdogs.reduce((s, t) => s + (0.5 - Number(t.price)), 0) / winningUnderdogs.length
      : 0;

    // Sizing Discipline: 1 - CV (coefficient of variation), scaled 0-100
    const sizes = activity.map((t) => t.usdcSize || 0).filter((s) => s > 0);
    let sizingDiscipline = 50;
    if (sizes.length > 1) {
      const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      const variance = sizes.reduce((s, v) => s + (v - mean) ** 2, 0) / sizes.length;
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
      sizingDiscipline = Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100)));
    }

    // Timing Lead: % of trades with conviction entries (price < 0.4 or > 0.6)
    const pricedTrades = activity.filter((t) => t.price != null);
    const convictionEntries = pricedTrades.filter((t) => Number(t.price) < 0.4 || Number(t.price) > 0.6);
    const timingLead = pricedTrades.length > 0
      ? Math.round((convictionEntries.length / pricedTrades.length) * 100)
      : 0;

    // Trade Diversity
    const tradeDiversity = Math.min(100, Math.round((analysis.uniqueMarkets / analysis.totalTrades) * 100));

    // Win Rate Estimate: % of BUY trades at prices < 0.5
    const winRateEst = buyTrades.length > 0
      ? Math.round((winningUnderdogs.length / buyTrades.length) * 100)
      : 0;

    return {
      clv: (clv * 100).toFixed(1),
      sizingDiscipline,
      timingLead,
      tradeDiversity,
      winRateEst,
    };
  }, [activity, analysis]);

  /* ---- Trade Size Distribution ---- */
  const tradeSizeDistribution = useMemo(() => {
    if (!activity.length) return [];
    const buckets = [
      { label: "$0-50", min: 0, max: 50, count: 0 },
      { label: "$50-100", min: 50, max: 100, count: 0 },
      { label: "$100-500", min: 100, max: 500, count: 0 },
      { label: "$500-1K", min: 500, max: 1000, count: 0 },
      { label: "$1K-5K", min: 1000, max: 5000, count: 0 },
      { label: "$5K+", min: 5000, max: Infinity, count: 0 },
    ];
    for (const t of activity) {
      const size = t.usdcSize || 0;
      for (const b of buckets) {
        if (size >= b.min && size < b.max) { b.count++; break; }
      }
    }
    return buckets.map((b) => ({ name: b.label, count: b.count }));
  }, [activity]);

  /* ---- Trading Activity Over Time ---- */
  const tradingActivityOverTime = useMemo(() => {
    if (!activity.length) return [];
    const dayCounts: Record<string, number> = {};
    for (const t of activity) {
      if (!t.timestamp) continue;
      const d = new Date(t.timestamp * 1000);
      const key = d.toISOString().slice(0, 10);
      dayCounts[key] = (dayCounts[key] || 0) + 1;
    }
    const sorted = Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-30);
  }, [activity]);

  /* ---- Price Entry Analysis ---- */
  const priceEntryData = useMemo(() => {
    if (!activity.length) return [];
    const ranges = Array.from({ length: 10 }, (_, i) => ({
      label: `${(i / 10).toFixed(1)}-${((i + 1) / 10).toFixed(1)}`,
      min: i / 10,
      max: (i + 1) / 10,
      count: 0,
      totalSize: 0,
    }));
    for (const t of activity) {
      if (t.price == null) continue;
      const p = Number(t.price);
      const idx = Math.min(9, Math.floor(p * 10));
      ranges[idx].count++;
      ranges[idx].totalSize += t.usdcSize || 0;
    }
    return ranges.map((r) => ({
      range: r.label,
      count: r.count,
      avgSize: r.count > 0 ? Math.round(r.totalSize / r.count) : 0,
    }));
  }, [activity]);

  /* ---- PnL Equity Curve (computed from cumulative trade activity) ---- */
  const [pnlTimeframe, setPnlTimeframe] = useState<"1W" | "1M" | "3M" | "ALL">("ALL");
  const pnlCurve = useMemo(() => {
    if (!activity.length) return [];
    // Sort by timestamp ascending
    const trades = [...activity]
      .filter(t => t.timestamp)
      .sort((a, b) => a.timestamp - b.timestamp);
    if (!trades.length) return [];

    // Build daily running PnL from buy/sell activity
    // For buys: -usdcSize (money out), for sells/redeems: +usdcSize (money in)
    const dailyPnl: Record<string, number> = {};
    for (const t of trades) {
      const day = new Date(t.timestamp * 1000).toISOString().slice(0, 10);
      const flow = t.type === "REDEEM" || t.type === "REWARD" || t.type === "MAKER_REBATE"
        ? (t.usdcSize || 0)
        : t.side === "SELL"
          ? (t.usdcSize || 0)
          : -(t.usdcSize || 0);
      dailyPnl[day] = (dailyPnl[day] || 0) + flow;
    }

    // Build cumulative curve
    const sorted = Object.entries(dailyPnl).sort((a, b) => a[0].localeCompare(b[0]));
    let cumulative = 0;
    const curve = sorted.map(([date, dayPnl]) => {
      cumulative += dayPnl;
      return { date, pnl: Math.round(cumulative * 100) / 100 };
    });

    // Apply timeframe filter
    if (pnlTimeframe !== "ALL" && curve.length > 0) {
      const now = new Date(curve[curve.length - 1].date);
      const days = pnlTimeframe === "1W" ? 7 : pnlTimeframe === "1M" ? 30 : 90;
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return curve.filter(p => p.date >= cutoffStr);
    }
    return curve;
  }, [activity, pnlTimeframe]);

  /* ---- Behavioral Profile (computed from trades) ---- */
  const behavioralProfile = useMemo(() => {
    if (!activity.length) return null;
    const trades = activity.filter(t => t.type === "TRADE");
    if (!trades.length) return null;

    // 1. Revenge Trading: trades within 5 min of each other (rapid-fire after loss proxy)
    const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
    let rapidPairs = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].timestamp - sorted[i-1].timestamp < 300) rapidPairs++;
    }
    const revengeTradingRate = Math.round((rapidPairs / Math.max(1, sorted.length - 1)) * 100);

    // 2. Tilt: size after loss vs after win (proxy: size increases after SELL vs BUY)
    const buySizes = trades.filter(t => t.side === "BUY").map(t => t.usdcSize || 0);
    const sellSizes = trades.filter(t => t.side === "SELL").map(t => t.usdcSize || 0);
    const avgBuy = buySizes.length ? buySizes.reduce((a,b)=>a+b,0)/buySizes.length : 0;
    const avgSell = sellSizes.length ? sellSizes.reduce((a,b)=>a+b,0)/sellSizes.length : 0;
    const tiltRatio = avgBuy > 0 ? avgSell / avgBuy : 1;

    // 3. Discipline: coefficient of variation of trade sizes
    const sizes = trades.map(t => t.usdcSize || 0).filter(s => s > 0);
    let disciplineScore = 50;
    if (sizes.length > 1) {
      const mean = sizes.reduce((a,b) => a+b, 0) / sizes.length;
      const std = Math.sqrt(sizes.reduce((s,v) => s + (v-mean)**2, 0) / sizes.length);
      const cv = mean > 0 ? std / mean : 1;
      disciplineScore = Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1.5) / 1.5) * 100)));
    }

    // 4. FOMO: % of trades at prices near 0.5 (crowd-following)
    const pricedTrades = trades.filter(t => t.price != null);
    const midRangeTrades = pricedTrades.filter(t => {
      const p = Number(t.price);
      return p >= 0.4 && p <= 0.6;
    });
    const fomoScore = pricedTrades.length > 0 ? Math.round((midRangeTrades.length / pricedTrades.length) * 100) : 50;

    // 5. Overtrading: max trades in a single day vs average
    const dayCounts: Record<string, number> = {};
    for (const t of sorted) {
      if (!t.timestamp) continue;
      const day = new Date(t.timestamp * 1000).toISOString().slice(0, 10);
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
    const dayCntArr = Object.values(dayCounts);
    const avgPerDay = dayCntArr.length ? dayCntArr.reduce((a,b)=>a+b,0)/dayCntArr.length : 0;
    const maxPerDay = dayCntArr.length ? Math.max(...dayCntArr) : 0;
    const overtradingSpike = avgPerDay > 0 ? maxPerDay / avgPerDay : 1;

    // 6. Holding pattern: average time between consecutive trades (proxy for patience)
    let avgInterval = 0;
    if (sorted.length > 1) {
      const intervals = [];
      for (let i = 1; i < sorted.length; i++) {
        intervals.push(sorted[i].timestamp - sorted[i-1].timestamp);
      }
      avgInterval = intervals.reduce((a,b) => a+b, 0) / intervals.length;
    }
    const patienceHours = avgInterval / 3600;

    // 7. Category concentration
    const categories: Record<string, number> = {};
    for (const t of trades) {
      const cat = t.title || "Unknown";
      categories[cat] = (categories[cat] || 0) + 1;
    }
    const catValues = Object.values(categories);
    const total = catValues.reduce((a,b) => a+b, 0);
    const topCatPct = total > 0 ? Math.round((Math.max(...catValues) / total) * 100) : 0;

    return {
      revengeTradingRate,
      tiltRatio: Number(tiltRatio.toFixed(2)),
      disciplineScore,
      fomoScore,
      overtradingSpike: Number(overtradingSpike.toFixed(1)),
      patienceHours: Number(patienceHours.toFixed(1)),
      topCategoryConcentration: topCatPct,
      tradeCount: trades.length,
    };
  }, [activity]);

  /* ---- Red Flags (computed from behavioral profile) ---- */
  const redFlags = useMemo(() => {
    if (!behavioralProfile) return [];
    const flags: { severity: "critical" | "warning" | "positive"; title: string; message: string }[] = [];

    if (behavioralProfile.revengeTradingRate > 40)
      flags.push({ severity: "critical", title: "Rapid-Fire Trading", message: `${behavioralProfile.revengeTradingRate}% of trades placed within 5 min of previous trade` });
    if (behavioralProfile.tiltRatio > 1.5)
      flags.push({ severity: "critical", title: "Tilt Detected", message: `SELL size is ${((behavioralProfile.tiltRatio - 1) * 100).toFixed(0)}% larger than BUY size on average` });
    if (behavioralProfile.overtradingSpike > 3)
      flags.push({ severity: "warning", title: "Overtrading Episodes", message: `Peak day has ${behavioralProfile.overtradingSpike}x more trades than average` });
    if (behavioralProfile.fomoScore > 60)
      flags.push({ severity: "warning", title: "Crowd-Following", message: `${behavioralProfile.fomoScore}% of entries at mid-range prices (0.4-0.6)` });
    if (behavioralProfile.topCategoryConcentration > 80)
      flags.push({ severity: "warning", title: "High Concentration", message: `${behavioralProfile.topCategoryConcentration}% of trades in a single market` });
    if (behavioralProfile.disciplineScore < 30)
      flags.push({ severity: "warning", title: "Erratic Sizing", message: "High variance in trade sizes — low discipline" });

    // Positive signals
    if (behavioralProfile.disciplineScore > 70)
      flags.push({ severity: "positive", title: "Disciplined Sizing", message: "Consistent position sizing across trades" });
    if (behavioralProfile.tiltRatio >= 0.8 && behavioralProfile.tiltRatio <= 1.2)
      flags.push({ severity: "positive", title: "Emotionally Stable", message: "No sizing bias between buy and sell trades" });
    if (behavioralProfile.revengeTradingRate < 15)
      flags.push({ severity: "positive", title: "Patient Trader", message: "Low rapid-fire trading rate" });
    if (roi > 30 && (analysis?.totalTrades ?? 0) > 30)
      flags.push({ severity: "positive", title: "Proven Track Record", message: `${roi.toFixed(1)}% ROI across ${analysis?.totalTrades} trades` });

    return flags;
  }, [behavioralProfile, roi, analysis]);

  /* ---- Psychological Profile (10 attributes) ---- */
  const psychProfile = useMemo(() => {
    if (!behavioralProfile || !forecastingEdge) return null;
    const attrs = [
      { name: "Emotional Resilience", score: Math.max(0, 100 - behavioralProfile.revengeTradingRate * 2), isStrength: behavioralProfile.revengeTradingRate < 20 },
      { name: "Discipline", score: behavioralProfile.disciplineScore, isStrength: behavioralProfile.disciplineScore > 60 },
      { name: "Patience", score: Math.min(100, Math.round(behavioralProfile.patienceHours * 5)), isStrength: behavioralProfile.patienceHours > 12 },
      { name: "Conviction", score: forecastingEdge.timingLead, isStrength: forecastingEdge.timingLead > 50 },
      { name: "Loss Aversion", score: Math.round(Math.abs(behavioralProfile.tiltRatio - 1) * 100), isStrength: false },
      { name: "FOMO Resistance", score: Math.max(0, 100 - behavioralProfile.fomoScore), isStrength: behavioralProfile.fomoScore < 40 },
      { name: "Overconfidence", score: Math.min(100, Math.round((behavioralProfile.overtradingSpike - 1) * 30)), isStrength: false },
      { name: "Adaptability", score: forecastingEdge.tradeDiversity, isStrength: forecastingEdge.tradeDiversity > 40 },
      { name: "Risk Calibration", score: forecastingEdge.sizingDiscipline, isStrength: forecastingEdge.sizingDiscipline > 60 },
      { name: "Focus", score: behavioralProfile.topCategoryConcentration, isStrength: behavioralProfile.topCategoryConcentration > 50 },
    ];
    const overall = Math.round(attrs.filter(a => a.isStrength).length / attrs.length * 100);
    return { attrs, overall };
  }, [behavioralProfile, forecastingEdge]);

  /* ---- Time-of-Day Heatmap Data ---- */
  const timeHeatmap = useMemo(() => {
    if (!activity.length) return [];
    const grid: { day: number; hour: number; count: number }[] = [];
    const counts: Record<string, number> = {};
    for (const t of activity) {
      if (!t.timestamp) continue;
      const d = new Date(t.timestamp * 1000);
      const day = d.getDay(); // 0=Sun
      const hour = d.getHours();
      const block = Math.floor(hour / 4); // 6 blocks of 4 hours
      const key = `${day}-${block}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    for (let day = 0; day < 7; day++) {
      for (let block = 0; block < 6; block++) {
        grid.push({ day, hour: block * 4, count: counts[`${day}-${block}`] || 0 });
      }
    }
    return grid;
  }, [activity]);

  /* ---- Wallet Classification ---- */
  const walletType = useMemo(() => {
    if (!behavioralProfile || !analysis) return null;

    // Simple classification from observable features
    const buySellRatio = analysis.buyCount / Math.max(1, analysis.sellCount);
    const hasBothSides = analysis.buyCount > 0 && analysis.sellCount > 0;
    const highVolume = totalVolume > 500000;
    const highDiscipline = behavioralProfile.disciplineScore > 70;
    const highROI = roi > 30;
    const lowFomo = behavioralProfile.fomoScore < 30;

    if (highDiscipline && lowFomo && highROI && analysis.totalTrades > 100)
      return { type: "Sharp", color: "text-green-400", description: "Disciplined trader with consistent positive edge" };
    if (highDiscipline && highVolume && hasBothSides && buySellRatio < 2 && buySellRatio > 0.5)
      return { type: "Market Maker", color: "text-purple-400", description: "Two-sided trader, profits from spread" };
    if (analysis.totalTrades < 50 && highROI)
      return { type: "Lucky/Small Sample", color: "text-amber-400", description: "Strong returns but limited trade history" };
    if (!highROI && behavioralProfile.fomoScore > 50)
      return { type: "Recreational", color: "text-blue-400", description: "Entertainment-driven, follows the crowd" };
    if (highROI)
      return { type: "Moderate Edge", color: "text-cyan-400", description: "Positive returns, developing track record" };
    return { type: "Unclassified", color: "text-muted", description: "Insufficient data for classification" };
  }, [behavioralProfile, analysis, totalVolume, roi]);

  /* ---- Tab state ---- */
  const [activeTab, setActiveTab] = useState<"overview" | "behavior" | "analysis" | "patterns" | "history">("overview");

  /* ---- Copy wallet ---- */
  function copyWallet() {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  /* ---- Error state ---- */
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Link>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-danger" />
          <h2 className="text-xl font-semibold text-foreground">
            Failed to load leader data
          </h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <Link
            href="/discover"
            className="mt-6 text-sm font-medium text-blue-400 hover:underline"
          >
            &larr; Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Link>
        <Skeleton />
      </div>
    );
  }

  /* ---- Rendered page ---- */
  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Discover
      </Link>

      {/* Data freshness */}
      <Timestamp date={fetchedAt ?? undefined} />

      {/* Ingestion Progress Bar */}
      {ingestion && ingestion.status === "running" && (
        <div className="rounded-xl bg-[#1e293b] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              <span className="text-sm font-medium text-white">Fetching historical data...</span>
            </div>
            <span className="text-xs text-slate-400">
              {ingestion.totalFetched.toLocaleString()} trades · Page {ingestion.currentPage}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.max(2, ingestion.percentComplete || 0)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Building complete profile with behavioral analysis, classification, and risk signals...
          </p>
        </div>
      )}
      {ingestion && ingestion.status === "complete" && ingestion.totalFetched > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-xs text-green-400">
          <CheckCircle className="h-3.5 w-3.5" />
          Full history loaded: {ingestion.totalFetched.toLocaleString()} trades across {ingestion.currentPage} pages
        </div>
      )}

      {/* ===== Hero Section ===== */}
      <div className="rounded-2xl bg-surface p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <img
              src={profileImage || `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(displayName || walletAddress)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
              alt={displayName}
              className="h-16 w-16 shrink-0 rounded-full object-cover bg-surface-inset"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {displayName}
                </h1>
                {profile?.verified && (
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                )}
                {rank && (
                  <span className="rounded-full bg-gold-400/15 px-2.5 py-0.5 text-xs font-bold text-gold-400">
                    #{rank}
                  </span>
                )}
              </div>

              {profile?.xUsername && (
                <p className="text-sm text-muted">@{profile.xUsername}</p>
              )}

              <button
                onClick={copyWallet}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-surface-inset px-2.5 py-1 text-xs font-mono text-muted transition-colors hover:text-foreground"
              >
                {truncateWallet(walletAddress)}
                <Copy className="h-3 w-3" />
                {copied && (
                  <span className="text-green-500 font-sans">Copied!</span>
                )}
              </button>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={`https://polymarket.com/profile/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                >
                  View on Polymarket
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800">
              <Copy className="h-4 w-4" />
              Copy This Leader
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-card-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-inset">
              <Heart className="h-4 w-4" />
              Follow
            </button>
          </div>
        </div>
      </div>

      {/* ===== Stats Row ===== */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {[
          {
            label: "Total Invested",
            value: formatUsd(totalVolume),
            icon: <DollarSign className="h-4 w-4" />,
            color: "text-foreground",
          },
          {
            label: "Total PnL",
            value: (totalPnl >= 0 ? "+" : "") + formatUsd(totalPnl),
            icon: <TrendingUp className="h-4 w-4" />,
            color: totalPnl >= 0 ? "text-gold-500" : "text-danger",
          },
          {
            label: "ROI",
            value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`,
            icon: <BarChart3 className="h-4 w-4" />,
            color: roi >= 0 ? "text-gold-500" : "text-danger",
          },
          {
            label: "Win Rate",
            value: winRate != null ? `${winRate}%` : "—",
            icon: <CheckCircle className="h-4 w-4" />,
            color: (winRate ?? 0) >= 50 ? "text-gold-500" : "text-danger",
          },
          {
            label: "Portfolio Value",
            value: formatUsd(portfolioValue),
            icon: <DollarSign className="h-4 w-4" />,
            color: "text-foreground",
          },
          {
            label: "Open Positions",
            value: openPositions.toLocaleString(),
            icon: <Activity className="h-4 w-4" />,
            color: "text-foreground",
            href: `https://polymarket.com/profile/${walletAddress}`,
          },
          {
            label: "Total Positions",
            value: totalPositions.toLocaleString(),
            icon: <BarChart3 className="h-4 w-4" />,
            color: "text-foreground",
            href: `https://polymarket.com/profile/${walletAddress}`,
          },
          {
            label: "Trades",
            value: (analysis?.totalTrades ?? activity.length).toLocaleString(),
            icon: <Activity className="h-4 w-4" />,
            color: "text-foreground",
            href: `https://polymarket.com/profile/${walletAddress}?tab=trade-history`,
          },
        ].map((stat) => {
          const inner = (
            <>
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-inset text-muted">
                {stat.icon}
              </div>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted">{stat.label}</p>
            </>
          );
          if ("href" in stat && stat.href) {
            return (
              <a
                key={stat.label}
                href={stat.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-surface p-5 text-center shadow-sm cursor-pointer transition-colors hover:bg-surface-inset hover:ring-1 hover:ring-blue-400/30"
              >
                {inner}
                <p className="mt-1 text-[10px] text-blue-400 flex items-center justify-center gap-1">View on Polymarket <ExternalLink className="h-2.5 w-2.5" /></p>
              </a>
            );
          }
          return (
            <div key={stat.label} className="rounded-xl bg-surface p-5 text-center shadow-sm">
              {inner}
            </div>
          );
        })}
      </div>

      {/* ===== Tabs ===== */}
      <div className="flex gap-1 rounded-xl bg-surface p-1 shadow-sm">
        {(["overview", "behavior", "analysis", "patterns", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-surface-inset"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ===== Overview Tab ===== */}
      {activeTab === "overview" && (
        <>
          {/* PnL Equity Curve */}
          {pnlCurve.length > 1 && (
            <div className="rounded-2xl bg-[#1e293b] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${totalPnl >= 0 ? "bg-green-400" : "bg-danger"}`} />
                    <span className="text-sm font-medium text-slate-400">Profit / Loss</span>
                  </div>
                  <p className={`text-3xl font-bold mt-1 ${totalPnl >= 0 ? "text-white" : "text-danger"}`}>
                    {totalPnl >= 0 ? "+" : ""}{formatUsd(totalPnl)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {pnlTimeframe === "ALL" ? "All-Time" : pnlTimeframe === "1W" ? "Past Week" : pnlTimeframe === "1M" ? "Past Month" : "Past 3 Months"}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(["1W", "1M", "3M", "ALL"] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setPnlTimeframe(tf)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        pnlTimeframe === tf
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-700"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pnlCurve}>
                    <defs>
                      <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={totalPnl >= 0 ? "#3b82f6" : "#ef4444"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={totalPnl >= 0 ? "#3b82f6" : "#ef4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      axisLine={false} tickLine={false}
                      interval={Math.max(0, Math.floor(pnlCurve.length / 6))}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(v: number) => v >= 1000 || v <= -1000 ? `$${(v/1000).toFixed(0)}k` : `$${v.toFixed(0)}`}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", backgroundColor: "#1e293b", color: "#f1f5f9" }}
                      formatter={(value) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, "P&L"]}
                      labelFormatter={(label) => new Date(label as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    />
                    <Area
                      type="monotone"
                      dataKey="pnl"
                      stroke={totalPnl >= 0 ? "#3b82f6" : "#ef4444"}
                      strokeWidth={2}
                      fill="url(#pnlGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Sharpness Analytics Cards */}
          {sharpScore && forecastingEdge && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Sharp Score Card */}
              <div className="rounded-2xl bg-[#1e293b] p-6 shadow-sm">
                <h3 className="mb-5 text-base font-semibold text-white">Sharp Score</h3>
                <div className="flex items-center gap-8">
                  {/* Circular Gauge */}
                  <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="#3b82f6" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(sharpScore.score / 100) * 264} 264`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{sharpScore.score}</span>
                      <span className="text-[10px] text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      sharpScore.label === "Sharp" ? "bg-green-500/20 text-green-400" :
                      sharpScore.label === "Moderate" ? "bg-blue-500/20 text-blue-400" :
                      sharpScore.label === "Recreational" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {sharpScore.label}
                    </span>
                    {rank && (
                      <p className="text-sm text-slate-400">
                        Leaderboard Rank: <span className="font-semibold text-white">#{rank}</span>
                      </p>
                    )}
                    <p className="text-sm text-slate-400">
                      ROI: <span className={`font-semibold ${roi >= 0 ? "text-green-400" : "text-red-400"}`}>{roi >= 0 ? "+" : ""}{roi.toFixed(1)}%</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Based on edge signal weighted by trade size
                    </p>
                  </div>
                </div>
              </div>

              {/* Forecasting Edge Card */}
              <div className="rounded-2xl bg-[#1e293b] p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-white">Forecasting Edge</h3>
                <div className="mb-5">
                  <p className="text-3xl font-bold text-white">{forecastingEdge.clv}%</p>
                  <p className="text-xs text-slate-400 mt-1">Avg CLV on underdog BUY entries</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Sizing Discipline", value: forecastingEdge.sizingDiscipline },
                    { label: "Timing Lead", value: forecastingEdge.timingLead },
                    { label: "Trade Diversity", value: forecastingEdge.tradeDiversity },
                    { label: "Win Rate Est.", value: forecastingEdge.winRateEst },
                  ].map((signal) => (
                    <div key={signal.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-slate-300">{signal.label}</span>
                        <span className="text-slate-400">{signal.value}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-700">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${signal.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== Behavior Tab ===== */}
      {activeTab === "behavior" && (
        <>
          {/* Wallet Classification Card */}
          {walletType && (
            <div className="rounded-2xl bg-[#1e293b] p-6 shadow-sm">
              <h3 className="text-base font-semibold text-white mb-3">Leader Classification</h3>
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-bold ${walletType.color}`}>{walletType.type}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{walletType.description}</p>
            </div>
          )}

          {/* Red Flags */}
          {redFlags.length > 0 && (
            <div className="rounded-2xl bg-surface p-6 shadow-sm">
              <h3 className="text-base font-semibold text-foreground mb-4">Risk Signals</h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {redFlags.map((flag, i) => (
                  <div key={i} className={`flex items-center gap-2.5 rounded-lg border-l-3 px-3 py-2.5 ${
                    flag.severity === "critical" ? "border-l-red-500 bg-red-500/10" :
                    flag.severity === "warning" ? "border-l-amber-400 bg-amber-400/10" :
                    "border-l-green-500 bg-green-500/10"
                  }`}>
                    <AlertTriangle className={`h-4 w-4 shrink-0 ${
                      flag.severity === "critical" ? "text-red-500" :
                      flag.severity === "warning" ? "text-amber-400" :
                      "text-green-500"
                    }`} />
                    <div>
                      <span className="text-xs font-semibold text-foreground">{flag.title}</span>
                      <span className="ml-1.5 text-[11px] text-muted">{flag.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavioral Metrics Grid */}
          {behavioralProfile && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Behavioral Stats */}
              <div className="rounded-2xl bg-surface p-6 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-4">Behavioral Metrics</h3>
                <div className="space-y-3">
                  {[
                    { label: "Rapid-Fire Rate", value: `${behavioralProfile.revengeTradingRate}%`, bad: behavioralProfile.revengeTradingRate > 30 },
                    { label: "Tilt Ratio (Sell/Buy size)", value: `${behavioralProfile.tiltRatio}x`, bad: behavioralProfile.tiltRatio > 1.5 || behavioralProfile.tiltRatio < 0.7 },
                    { label: "Discipline Score", value: `${behavioralProfile.disciplineScore}/100`, bad: behavioralProfile.disciplineScore < 40 },
                    { label: "FOMO Score", value: `${behavioralProfile.fomoScore}%`, bad: behavioralProfile.fomoScore > 50 },
                    { label: "Overtrading Spike", value: `${behavioralProfile.overtradingSpike}x`, bad: behavioralProfile.overtradingSpike > 3 },
                    { label: "Avg Trade Interval", value: `${behavioralProfile.patienceHours}h`, bad: behavioralProfile.patienceHours < 1 },
                    { label: "Top Market Concentration", value: `${behavioralProfile.topCategoryConcentration}%`, bad: behavioralProfile.topCategoryConcentration > 70 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-muted">{item.label}</span>
                      <span className={`text-sm font-bold ${item.bad ? "text-danger" : "text-foreground"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Psychological Profile */}
              {psychProfile && (
                <div className="rounded-2xl bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-foreground">Psychological Profile</h3>
                    <span className="text-sm font-bold text-foreground">{psychProfile.overall}/100</span>
                  </div>
                  <div className="space-y-2">
                    {psychProfile.attrs.map((attr) => (
                      <div key={attr.name} className="flex items-center gap-2">
                        <span className="w-36 shrink-0 text-xs text-muted">{attr.name}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-inset">
                          <div
                            className={`h-full rounded-full ${attr.isStrength ? "bg-green-500" : "bg-danger"}`}
                            style={{ width: `${Math.min(100, attr.score)}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-bold text-foreground">{Math.min(100, attr.score)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Time-of-Day Heatmap */}
          {timeHeatmap.length > 0 && (
            <div className="rounded-2xl bg-surface p-6 shadow-sm">
              <h3 className="text-base font-semibold text-foreground mb-4">Trading Activity by Time</h3>
              <div className="overflow-x-auto">
                <div className="inline-grid gap-1" style={{ gridTemplateColumns: "auto repeat(6, 1fr)" }}>
                  {/* Header row */}
                  <div />
                  {["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"].map(label => (
                    <div key={label} className="px-2 py-1 text-center text-[10px] text-muted">{label}</div>
                  ))}
                  {/* Day rows */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayLabel, dayIdx) => {
                    const maxCount = Math.max(1, ...timeHeatmap.map(h => h.count));
                    return (
                      <React.Fragment key={`row-${dayIdx}`}>
                        <div className="px-2 py-1 text-right text-[10px] text-muted">{dayLabel}</div>
                        {[0, 1, 2, 3, 4, 5].map(block => {
                          const cell = timeHeatmap.find(h => h.day === dayIdx && h.hour === block * 4);
                          const count = cell?.count || 0;
                          const intensity = count / maxCount;
                          return (
                            <div
                              key={`${dayIdx}-${block}`}
                              className="flex items-center justify-center rounded text-[10px] font-medium"
                              style={{
                                backgroundColor: `rgba(96, 165, 250, ${intensity * 0.8})`,
                                color: intensity > 0.4 ? "white" : "var(--muted)",
                                minHeight: "28px",
                                minWidth: "40px",
                              }}
                              title={`${dayLabel} ${block*4}:00-${(block+1)*4}:00: ${count} trades`}
                            >
                              {count > 0 ? count : ""}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== Analysis Tab ===== */}
      {activeTab === "analysis" && (
        <>
          {/* Trade Analysis (original) */}
          {analysis && analysis.totalTrades > 0 && (
            <>
              <h2 className="text-lg font-bold text-foreground">Trade Analysis</h2>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Quick stats */}
                <div className="rounded-2xl bg-surface p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-foreground">
                    Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Avg Trade Size</span>
                      <span className="font-semibold text-foreground">
                        {formatUsd(analysis.avgTradeSize)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Trades / Day</span>
                      <span className="font-semibold text-foreground">
                        {analysis.tradesPerDay.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Unique Markets</span>
                      <span className="font-semibold text-foreground">
                        {analysis.uniqueMarkets}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Buy Trades</span>
                      <span className="font-semibold text-green-500">
                        {analysis.buyCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Sell Trades</span>
                      <span className="font-semibold text-danger">
                        {analysis.sellCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Side distribution donut */}
                <div className="rounded-2xl bg-surface p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-foreground">
                    Side Distribution
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="h-44 w-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sideData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {sideData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {sideData.map((d) => (
                        <div key={d.name} className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="text-sm text-muted">
                            {d.name}: <strong>{d.value}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Most traded markets */}
                <div className="rounded-2xl bg-surface p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-foreground">
                    Most Traded Markets
                  </h3>
                  {marketBarData.length > 0 ? (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={marketBarData}
                          layout="vertical"
                          margin={{ left: 0, right: 10 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--chart-grid)"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 10, fill: "var(--muted)" }}
                            width={120}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar
                            dataKey="trades"
                            fill="var(--gold-400)"
                            radius={[0, 4, 4, 0]}
                            barSize={16}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No market data available</p>
                  )}
                </div>
              </div>
            </>
          )}

        </>
      )}

      {/* ===== Patterns Tab ===== */}
      {activeTab === "patterns" && (
        <>
          <h2 className="text-lg font-bold text-foreground">Trading Patterns</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Trade Size Distribution */}
            <div className="rounded-2xl bg-surface p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                Trade Size Distribution
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tradeSizeDistribution} margin={{ left: 0, right: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="var(--gold-400)" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trading Activity Over Time */}
            <div className="rounded-2xl bg-surface p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                Trading Activity Over Time
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tradingActivityOverTime} margin={{ left: 0, right: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "var(--muted)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Price Entry Analysis */}
          <h2 className="text-lg font-bold text-foreground">Price Entry Analysis</h2>
          <div className="rounded-2xl bg-surface p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">
              Entry Price Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceEntryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="range"
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    width={60}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => [
                      name === "count" ? `${value} trades` : formatUsd(Number(value)),
                      name === "count" ? "Trades" : "Avg Size",
                    ]}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} name="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ===== History Tab ===== */}
      {activeTab === "history" && (
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Trade History
            {activity.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted">
                ({activity.length} trades)
              </span>
            )}
          </h2>

          {activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No trade activity found for this wallet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-xs font-medium uppercase tracking-wider text-muted">
                    <th className="pb-3 pr-4">Time</th>
                    <th className="pb-3 pr-4">Market</th>
                    <th className="pb-3 pr-4">Side</th>
                    <th className="pb-3 pr-4">Outcome</th>
                    <th className="pb-3 pr-4">Price</th>
                    <th className="pb-3 pr-4">Size (USDC)</th>
                    <th className="pb-3 pr-4">Result</th>
                    <th className="pb-3">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {activity.map((trade, idx) => {
                    // Determine win/lose result
                    let result: "WIN" | "LOSS" | "OPEN" | "—" = "—";
                    if (trade.type === "REDEEM") {
                      result = "WIN";
                    } else if (trade.type === "TRADE") {
                      // Check if this market exists in positions (resolved)
                      const pos = profile?.positions?.find(
                        (p: any) => p.conditionId === trade.conditionId
                      );
                      if (pos) {
                        if (pos.curPrice === 1 || (pos.cashPnl > 0)) result = "WIN";
                        else if (pos.curPrice === 0 || pos.redeemable) result = "LOSS";
                        else result = "OPEN";
                      }
                    }
                    return (
                    <tr key={`${trade.transactionHash}-${idx}`} className="text-foreground">
                      <td className="whitespace-nowrap py-3 pr-4 text-xs text-muted">
                        {trade.timestamp
                          ? formatTimestamp(trade.timestamp)
                          : "--"}
                      </td>
                      <td className="max-w-[240px] truncate py-3 pr-4 font-medium">
                        {trade.title || trade.name || "Unknown Market"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            trade.side === "BUY"
                              ? "bg-green-500/15 text-green-500"
                              : trade.side === "SELL"
                                ? "bg-danger/15 text-danger"
                                : "bg-surface-inset text-muted"
                          }`}
                        >
                          {trade.side || "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-sm">
                        {trade.outcome || "--"}
                      </td>
                      <td className="py-3 pr-4 font-mono text-sm">
                        {trade.price != null && trade.price > 0
                          ? `$${Number(trade.price).toFixed(2)}`
                          : "--"}
                      </td>
                      <td className="py-3 pr-4 font-mono text-sm">
                        {trade.usdcSize != null
                          ? formatUsd(trade.usdcSize)
                          : trade.size != null
                            ? trade.size.toLocaleString()
                            : "--"}
                      </td>
                      <td className="py-3 pr-4">
                        {result === "WIN" && (
                          <span className="rounded px-2 py-0.5 text-xs font-bold bg-green-500/15 text-green-400">WIN</span>
                        )}
                        {result === "LOSS" && (
                          <span className="rounded px-2 py-0.5 text-xs font-bold bg-danger/15 text-danger">LOSS</span>
                        )}
                        {result === "OPEN" && (
                          <span className="rounded px-2 py-0.5 text-xs font-medium bg-blue-400/15 text-blue-400">OPEN</span>
                        )}
                        {result === "—" && (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-surface-inset px-2.5 py-0.5 text-xs font-medium text-muted">
                          {trade.type || "TRADE"}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
