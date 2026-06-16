"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Zap,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Rss,
  Globe,
  AtSign,
  Radio,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

/* ───────────────────────── Types ───────────────────────── */

type SignalStatus = "pending" | "accepted" | "rejected" | "expired" | "executed";
type Direction = "BUY_YES" | "BUY_NO";

interface Signal {
  id: string;
  marketQuestion: string;
  direction: Direction;
  currentPrice: number;
  fairValue: number;
  edge: number;
  confidence: number;
  suggestedSize: number;
  potentialPnl: number;
  rationale: string;
  expiresAt: string;
  status: SignalStatus;
  pnl?: number;
  executedPrice?: number;
  createdAt: string;
}

interface NewsItem {
  id: string;
  source: string;
  sourceReliability: number;
  title: string;
  category: string;
  sentiment: "bullish" | "bearish" | "neutral";
  impactScore: number;
  timestamp: string;
  relatedMarkets: number;
}

interface MonitoredSource {
  id: string;
  name: string;
  type: "twitter" | "rss" | "api" | "website";
  category: string;
  reliability: number;
  lastScanned: string;
  active: boolean;
}

/* ───────────────────────── Mock Data ───────────────────────── */

const MOCK_SIGNALS: Signal[] = [
  {
    id: "sig-001",
    marketQuestion: "Will Bitcoin exceed $150,000 by December 2026?",
    direction: "BUY_YES",
    currentPrice: 0.42,
    fairValue: 0.58,
    edge: 16.0,
    confidence: 78,
    suggestedSize: 250,
    potentialPnl: 345,
    rationale:
      "Strong institutional inflows, ETF momentum, and on-chain metrics suggest BTC is underpriced at current levels. Historical halving cycle data supports a higher probability than the market implies.",
    expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    status: "pending",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "sig-002",
    marketQuestion: "Will the Fed cut rates at the July 2026 FOMC meeting?",
    direction: "BUY_NO",
    currentPrice: 0.65,
    fairValue: 0.48,
    edge: 7.2,
    confidence: 65,
    suggestedSize: 150,
    potentialPnl: 108,
    rationale:
      "Latest CPI data shows persistent core inflation above target. Fed officials have signaled patience. Market is overpricing a July cut based on lagging employment data.",
    expiresAt: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
    status: "pending",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "sig-003",
    marketQuestion: "Will Nvidia report Q3 revenue above $45B?",
    direction: "BUY_YES",
    currentPrice: 0.71,
    fairValue: 0.82,
    edge: 11.0,
    confidence: 82,
    suggestedSize: 300,
    potentialPnl: 127,
    rationale:
      "Supply chain checks indicate accelerating data center GPU demand. Major hyperscalers have expanded capex guidance. Whisper numbers suggest beat potential.",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: "pending",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "sig-004",
    marketQuestion: "Will US GDP growth exceed 3% in Q2 2026?",
    direction: "BUY_YES",
    currentPrice: 0.38,
    fairValue: 0.44,
    edge: 3.8,
    confidence: 52,
    suggestedSize: 75,
    potentialPnl: 47,
    rationale:
      "Atlanta Fed GDPNow tracking above consensus. Consumer spending resilient but edge is marginal.",
    expiresAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: "expired",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig-005",
    marketQuestion: "Will Trump sign an infrastructure bill by September 2026?",
    direction: "BUY_NO",
    currentPrice: 0.55,
    fairValue: 0.38,
    edge: 8.5,
    confidence: 70,
    suggestedSize: 200,
    potentialPnl: 170,
    rationale:
      "Congressional gridlock and budget constraints make passage unlikely in this timeframe.",
    expiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: "accepted",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig-006",
    marketQuestion: "Will ETH/BTC ratio exceed 0.06 by August 2026?",
    direction: "BUY_YES",
    currentPrice: 0.33,
    fairValue: 0.46,
    edge: 13.0,
    confidence: 60,
    suggestedSize: 180,
    potentialPnl: 234,
    rationale: "ETH ETF catalyst and rotation narrative gaining traction among institutional desks.",
    expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "executed",
    pnl: 198,
    executedPrice: 0.34,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig-007",
    marketQuestion: "Will Apple announce AR glasses at WWDC 2026?",
    direction: "BUY_NO",
    currentPrice: 0.72,
    fairValue: 0.61,
    edge: 4.2,
    confidence: 45,
    suggestedSize: 50,
    potentialPnl: 21,
    rationale: "Supply chain leaks suggest hardware not ready. Low confidence signal.",
    expiresAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: "rejected",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_NEWS: NewsItem[] = [
  {
    id: "n1",
    source: "Bloomberg",
    sourceReliability: 95,
    title: "Fed Officials Signal Patience on Rate Cuts Amid Sticky Inflation",
    category: "Macro",
    sentiment: "bearish",
    impactScore: 88,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    relatedMarkets: 12,
  },
  {
    id: "n2",
    source: "CoinDesk",
    sourceReliability: 82,
    title: "Bitcoin ETF Inflows Hit Record $1.2B in Single Day",
    category: "Crypto",
    sentiment: "bullish",
    impactScore: 92,
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    relatedMarkets: 8,
  },
  {
    id: "n3",
    source: "Reuters",
    sourceReliability: 96,
    title: "US Jobs Report Shows Mixed Signals for Economic Outlook",
    category: "Economy",
    sentiment: "neutral",
    impactScore: 75,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    relatedMarkets: 15,
  },
  {
    id: "n4",
    source: "@unusual_whales",
    sourceReliability: 72,
    title: "Massive options flow detected in NVDA ahead of earnings",
    category: "Equities",
    sentiment: "bullish",
    impactScore: 68,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    relatedMarkets: 4,
  },
  {
    id: "n5",
    source: "Politico",
    sourceReliability: 88,
    title: "Senate Infrastructure Deal Collapses Over Funding Dispute",
    category: "Politics",
    sentiment: "bearish",
    impactScore: 71,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    relatedMarkets: 6,
  },
  {
    id: "n6",
    source: "WSJ",
    sourceReliability: 94,
    title: "OPEC+ Agrees to Extended Production Cuts Through Q4",
    category: "Commodities",
    sentiment: "bullish",
    impactScore: 80,
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    relatedMarkets: 3,
  },
];

const MOCK_SOURCES: MonitoredSource[] = [
  { id: "s1", name: "Bloomberg", type: "api", category: "Financial", reliability: 95, lastScanned: new Date(Date.now() - 5 * 60 * 1000).toISOString(), active: true },
  { id: "s2", name: "@unusual_whales", type: "twitter", category: "Options Flow", reliability: 72, lastScanned: new Date(Date.now() - 12 * 60 * 1000).toISOString(), active: true },
  { id: "s3", name: "Reuters", type: "rss", category: "World News", reliability: 96, lastScanned: new Date(Date.now() - 3 * 60 * 1000).toISOString(), active: true },
  { id: "s4", name: "CoinDesk", type: "website", category: "Crypto", reliability: 82, lastScanned: new Date(Date.now() - 20 * 60 * 1000).toISOString(), active: true },
  { id: "s5", name: "@DeItaone", type: "twitter", category: "Breaking News", reliability: 78, lastScanned: new Date(Date.now() - 8 * 60 * 1000).toISOString(), active: true },
  { id: "s6", name: "Polymarket Blog", type: "rss", category: "Prediction Markets", reliability: 85, lastScanned: new Date(Date.now() - 30 * 60 * 1000).toISOString(), active: false },
  { id: "s7", name: "Kalshi API", type: "api", category: "Prediction Markets", reliability: 90, lastScanned: new Date(Date.now() - 2 * 60 * 1000).toISOString(), active: true },
  { id: "s8", name: "WSJ", type: "website", category: "Financial", reliability: 94, lastScanned: new Date(Date.now() - 15 * 60 * 1000).toISOString(), active: true },
];

/* ───────────────────────── Helpers ───────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function countdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hrs > 0) return `${hrs}h ${remainMins}m`;
  return `${remainMins}m`;
}

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatPct(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function formatUsd(n: number): string {
  return `${n >= 0 ? "+" : ""}$${Math.abs(n).toLocaleString()}`;
}

/* ───────────────────────── Skeleton ───────────────────────── */

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-card-border bg-card-bg p-5">
      <div className="mb-3 h-5 w-3/4 rounded bg-green-200" />
      <div className="mb-2 h-4 w-1/3 rounded bg-green-200" />
      <div className="mb-4 flex gap-4">
        <div className="h-4 w-20 rounded bg-green-200" />
        <div className="h-4 w-20 rounded bg-green-200" />
        <div className="h-4 w-20 rounded bg-green-200" />
      </div>
      <div className="mb-3 h-3 w-full rounded bg-green-200" />
      <div className="mb-3 h-3 w-5/6 rounded bg-green-200" />
      <div className="flex gap-2">
        <div className="h-9 w-24 rounded-lg bg-green-200" />
        <div className="h-9 w-24 rounded-lg bg-green-200" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 py-3 px-4">
      <div className="h-4 w-1/3 rounded bg-green-200" />
      <div className="h-4 w-16 rounded bg-green-200" />
      <div className="h-4 w-12 rounded bg-green-200" />
      <div className="h-4 w-16 rounded bg-green-200" />
      <div className="h-4 w-16 rounded bg-green-200" />
    </div>
  );
}

/* ───────────────────────── Sub-Components ───────────────────────── */

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 75
      ? "bg-emerald-500"
      : value >= 50
        ? "bg-amber-400"
        : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-green-200">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted">{value}</span>
    </div>
  );
}

function ImpactBar({ value }: { value: number }) {
  const color =
    value >= 80
      ? "bg-red-400"
      : value >= 50
        ? "bg-amber-400"
        : "bg-blue-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-green-200">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-[11px] font-mono text-muted">{value}</span>
    </div>
  );
}

function ReliabilityBar({ value }: { value: number }) {
  const color =
    value >= 90
      ? "bg-emerald-500"
      : value >= 70
        ? "bg-amber-400"
        : "bg-red-400";
  return (
    <div className="h-1.5 w-full rounded-full bg-green-200">
      <div
        className={`h-1.5 rounded-full ${color}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function DirectionBadge({ direction }: { direction: Direction }) {
  const isBuyYes = direction === "BUY_YES";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
        isBuyYes
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-red-500/15 text-red-400"
      }`}
    >
      {isBuyYes ? (
        <ArrowUpCircle className="h-3 w-3" />
      ) : (
        <ArrowDownCircle className="h-3 w-3" />
      )}
      {isBuyYes ? "BUY YES" : "BUY NO"}
    </span>
  );
}

function StatusBadge({ status }: { status: SignalStatus }) {
  const styles: Record<SignalStatus, string> = {
    pending: "bg-amber-500/15 text-amber-400",
    accepted: "bg-emerald-500/15 text-emerald-400",
    rejected: "bg-red-500/15 text-red-400",
    expired: "bg-gray-500/15 text-gray-400",
    executed: "bg-blue-500/15 text-blue-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function SentimentBadge({ sentiment }: { sentiment: "bullish" | "bearish" | "neutral" }) {
  if (sentiment === "bullish")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
        <TrendingUp className="h-3 w-3" /> Bullish
      </span>
    );
  if (sentiment === "bearish")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400">
        <TrendingDown className="h-3 w-3" /> Bearish
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
      <Minus className="h-3 w-3" /> Neutral
    </span>
  );
}

function SourceTypeBadge({ type }: { type: MonitoredSource["type"] }) {
  const config: Record<
    MonitoredSource["type"],
    { icon: React.ElementType; label: string; cls: string }
  > = {
    twitter: { icon: AtSign, label: "Twitter", cls: "bg-sky-500/15 text-sky-400" },
    rss: { icon: Rss, label: "RSS", cls: "bg-orange-500/15 text-orange-400" },
    api: { icon: Radio, label: "API", cls: "bg-violet-500/15 text-violet-400" },
    website: { icon: Globe, label: "Website", cls: "bg-teal-500/15 text-teal-400" },
  };
  const c = config[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${c.cls}`}>
      <c.icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="rounded-md bg-green-200 px-2 py-0.5 text-[11px] font-medium text-green-800">
      {category}
    </span>
  );
}

function ReliabilityBadge({ value }: { value: number }) {
  const color = value >= 90 ? "text-emerald-400" : value >= 70 ? "text-amber-400" : "text-red-400";
  return <span className={`text-[11px] font-bold ${color}`}>{value}%</span>;
}

/* ───────────────────────── Main Page ───────────────────────── */

const STATUS_FILTERS: { label: string; value: SignalStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Expired", value: "expired" },
  { label: "Executed", value: "executed" },
];

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<MonitoredSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SignalStatus | "all">("all");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [executeResult, setExecuteResult] = useState<Record<string, string>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, setTick] = useState(0); // for countdown re-renders

  /* Countdown ticker */
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  /* Fetch data */
  const fetchData = useCallback(async () => {
    try {
      // In production these would be real API calls:
      // const [sigRes, newsRes, srcRes] = await Promise.all([
      //   fetch("/api/signals?status=pending"),
      //   fetch("/api/signals/news?limit=20"),
      //   fetch("/api/signals/sources"),
      // ]);
      // Simulate with mock data:
      await new Promise((r) => setTimeout(r, 600));
      setSignals(MOCK_SIGNALS);
      setNews(MOCK_NEWS);
      setSources(MOCK_SOURCES);
      setLastScanned(new Date().toISOString());
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  /* Scan for opportunities */
  const handleScan = async () => {
    setScanning(true);
    try {
      // POST /api/signals
      await new Promise((r) => setTimeout(r, 1500));
      setLastScanned(new Date().toISOString());
      await fetchData();
    } finally {
      setScanning(false);
    }
  };

  /* Accept / Reject */
  const handleAction = async (id: string, action: "accept" | "reject") => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      // PATCH /api/signals/{id} with { action }
      await new Promise((r) => setTimeout(r, 500));
      setSignals((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: action === "accept" ? "accepted" : "rejected" }
            : s
        )
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  /* Execute */
  const handleExecute = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      // PATCH /api/signals/{id} with { action: "execute" }
      await new Promise((r) => setTimeout(r, 800));
      const signal = signals.find((s) => s.id === id);
      if (!signal) return;

      // Simulate viability check
      const viable = Math.random() > 0.3;
      if (viable) {
        const execPrice = signal.currentPrice + (Math.random() * 0.02 - 0.01);
        const edgeCaptured = ((signal.fairValue - execPrice) * 100).toFixed(1);
        setExecuteResult((prev) => ({
          ...prev,
          [id]: `Signal executed at $${execPrice.toFixed(2)} \u2014 edge captured: ${edgeCaptured}%`,
        }));
        setSignals((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, status: "executed", executedPrice: execPrice, pnl: signal.potentialPnl * 0.85 }
              : s
          )
        );
      } else {
        const newPrice = signal.currentPrice + 0.08;
        setExecuteResult((prev) => ({
          ...prev,
          [id]: `Opportunity expired \u2014 edge no longer available (current price: $${newPrice.toFixed(2)})`,
        }));
        setSignals((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "expired" } : s))
        );
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  /* Source toggle */
  const handleSourceToggle = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  /* Filtered data */
  const pendingSignals = signals.filter((s) => s.status === "pending");
  const historySignals = signals.filter((s) => s.status !== "pending");
  const filteredHistory =
    statusFilter === "all" || statusFilter === "pending"
      ? historySignals
      : historySignals.filter((s) => s.status === statusFilter);

  /* ── Render ── */
  return (
    <div className="space-y-8">
      {/* ═══ TOP BAR ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Trading Signals</h2>
            {lastScanned && (
              <p className="text-xs text-muted">
                Last scanned: {timeAgo(lastScanned)}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-amber-400 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? "Scanning..." : "Scan for Opportunities"}
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === f.value
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-card-bg text-muted border border-card-border hover:bg-green-200"
            }`}
          >
            {f.label}
            {f.value === "pending" && !loading && (
              <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                {pendingSignals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ SECTION 1: ACTIVE SIGNALS ═══ */}
      {(statusFilter === "all" || statusFilter === "pending") && (
        <section>
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Active Signals
            <span className="ml-2 text-sm font-normal text-muted">
              ({pendingSignals.length} pending)
            </span>
          </h3>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : pendingSignals.length === 0 ? (
            <div className="rounded-xl border border-card-border bg-card-bg p-8 text-center">
              <Zap className="mx-auto mb-3 h-8 w-8 text-muted" />
              <p className="text-sm text-muted">
                No pending signals. Click &ldquo;Scan for Opportunities&rdquo; to find new trades.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pendingSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="flex flex-col rounded-xl border border-card-border bg-card-bg p-5 transition-shadow hover:shadow-lg"
                >
                  {/* Question */}
                  <h4 className="mb-2 text-sm font-bold text-foreground line-clamp-2">
                    {sig.marketQuestion}
                  </h4>

                  {/* Direction + Expires */}
                  <div className="mb-3 flex items-center justify-between">
                    <DirectionBadge direction={sig.direction} />
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Clock className="h-3 w-3" />
                      {countdown(sig.expiresAt)}
                    </span>
                  </div>

                  {/* Price info */}
                  <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                        Price
                      </p>
                      <p className="text-sm font-bold text-foreground font-mono">
                        {formatPrice(sig.currentPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                        Fair Value
                      </p>
                      <p className="text-sm font-bold text-foreground font-mono">
                        {formatPrice(sig.fairValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                        Edge
                      </p>
                      <p
                        className={`text-sm font-bold font-mono ${
                          sig.edge >= 10
                            ? "text-emerald-400"
                            : sig.edge >= 5
                              ? "text-amber-400"
                              : "text-foreground"
                        }`}
                      >
                        {formatPct(sig.edge)}
                      </p>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="mb-3">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
                      Confidence
                    </p>
                    <ConfidenceBar value={sig.confidence} />
                  </div>

                  {/* Size + P&L */}
                  <div className="mb-3 flex gap-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                        Suggested Size
                      </p>
                      <p className="text-sm font-semibold text-foreground font-mono">
                        ${sig.suggestedSize}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                        Potential P&amp;L
                      </p>
                      <p className="text-sm font-semibold text-emerald-400 font-mono">
                        {formatUsd(sig.potentialPnl)}
                      </p>
                    </div>
                  </div>

                  {/* Rationale */}
                  <p className="mb-4 flex-1 text-xs leading-relaxed text-muted line-clamp-3">
                    {sig.rationale}
                  </p>

                  {/* Execute result */}
                  {executeResult[sig.id] && (
                    <div
                      className={`mb-3 rounded-lg p-2.5 text-xs font-medium ${
                        executeResult[sig.id].includes("executed")
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {executeResult[sig.id]}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {sig.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAction(sig.id, "accept")}
                          disabled={!!actionLoading[sig.id]}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleAction(sig.id, "reject")}
                          disabled={!!actionLoading[sig.id]}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-card-border bg-card-bg py-2 text-xs font-semibold text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                    {sig.status === "accepted" && (
                      <button
                        onClick={() => handleExecute(sig.id)}
                        disabled={!!actionLoading[sig.id]}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                      >
                        {actionLoading[sig.id] ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        Execute
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══ SECTION 2: NEWS FEED ═══ */}
      {(statusFilter === "all" || statusFilter === "pending") && (
        <section>
          <h3 className="mb-4 text-lg font-semibold text-foreground">News Feed</h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto divide-y divide-card-border">
                {news.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-green-50"
                  >
                    {/* Source */}
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <span className="text-sm font-semibold text-foreground">
                        {item.source}
                      </span>
                      <ReliabilityBadge value={item.sourceReliability} />
                    </div>

                    {/* Title */}
                    <p className="flex-1 min-w-[200px] text-sm font-medium text-foreground line-clamp-1">
                      {item.title}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3">
                      <CategoryBadge category={item.category} />
                      <SentimentBadge sentiment={item.sentiment} />
                      <div>
                        <p className="text-[10px] text-muted mb-0.5">Impact</p>
                        <ImpactBar value={item.impactScore} />
                      </div>
                      <span className="text-xs text-muted whitespace-nowrap">
                        {timeAgo(item.timestamp)}
                      </span>
                      <span className="text-[11px] text-muted whitespace-nowrap">
                        {item.relatedMarkets} markets
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══ SECTION 3: MONITORED SOURCES ═══ */}
      {(statusFilter === "all" || statusFilter === "pending") && (
        <section>
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Monitored Sources
          </h3>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-card-border bg-card-bg p-4">
                  <div className="mb-2 h-4 w-2/3 rounded bg-green-200" />
                  <div className="mb-2 h-3 w-1/2 rounded bg-green-200" />
                  <div className="h-2 w-full rounded bg-green-200" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className={`rounded-xl border bg-card-bg p-4 transition-opacity ${
                    src.active
                      ? "border-card-border"
                      : "border-card-border opacity-50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {src.name}
                    </span>
                    <button
                      onClick={() => handleSourceToggle(src.id)}
                      className="text-muted hover:text-foreground transition-colors"
                      title={src.active ? "Deactivate" : "Activate"}
                    >
                      {src.active ? (
                        <ToggleRight className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <SourceTypeBadge type={src.type} />
                    <CategoryBadge category={src.category} />
                  </div>
                  <div className="mb-1.5">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-muted">
                      Reliability
                    </p>
                    <ReliabilityBar value={src.reliability} />
                  </div>
                  <p className="text-[11px] text-muted">
                    Scanned {timeAgo(src.lastScanned)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══ SECTION 4: SIGNAL HISTORY ═══ */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Signal History
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-xl border border-card-border bg-card-bg p-8 text-center">
            <p className="text-sm text-muted">No signals match the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-card-border bg-card-bg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Market
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Direction
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Edge
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Confidence
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    P&amp;L
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filteredHistory.map((sig) => (
                  <tr
                    key={sig.id}
                    className="transition-colors hover:bg-green-50"
                  >
                    <td className="max-w-[280px] truncate px-5 py-3 font-medium text-foreground">
                      {sig.marketQuestion}
                    </td>
                    <td className="px-4 py-3">
                      <DirectionBadge direction={sig.direction} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono font-semibold ${
                          sig.edge >= 10
                            ? "text-emerald-400"
                            : sig.edge >= 5
                              ? "text-amber-400"
                              : "text-foreground"
                        }`}
                      >
                        {formatPct(sig.edge)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-24">
                        <ConfidenceBar value={sig.confidence} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sig.status} />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {sig.status === "executed" && sig.pnl != null ? (
                        <span
                          className={
                            sig.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {formatUsd(sig.pnl)}
                        </span>
                      ) : (
                        <span className="text-muted">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {timeAgo(sig.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
