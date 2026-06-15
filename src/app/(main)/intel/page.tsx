"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Brain,
  Activity,
  AlertTriangle,
  DollarSign,
  Radio,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  X,
  Clock,
  Filter,
  TrendingUp,
} from "lucide-react";
import StatCard from "@/components/StatCard";

/* ─────────── Types ─────────── */

interface IntelMarket {
  id: string;
  question: string;
  outcomes: string[];
  outcome_prices: string[];
  volume: number;
  liquidity: number;
}

interface MacroImpact {
  factor: string;
  direction: string;
  magnitude: string;
  description: string;
}

interface ChainEffect {
  event: string;
  probability_shift: number;
  description: string;
}

interface FundImplication {
  sector: string;
  action: string;
  rationale: string;
}

interface RegionImpact {
  region: string;
  impact: string;
  sectors: string[];
}

interface IntelScenario {
  id: number;
  title: string;
  outcome: string;
  probability: number;
  macro_impacts: MacroImpact[];
  chain_effects: ChainEffect[];
  fund_implications: FundImplication[];
  region_impacts: RegionImpact[];
}

interface IntelEvent {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  volume: number;
  macro_impact: string;
  region: string;
  active: boolean;
  end_date: string;
  markets: IntelMarket[];
  scenarios: IntelScenario[];
}

/* ─────────── Constants ─────────── */

const CATEGORIES = ["All", "Economics", "Politics", "Geopolitics", "Crypto", "Technology", "Sports"];
const REGIONS = ["Global", "US", "EU", "Asia", "Australia"];
const IMPACTS = ["All", "High", "Medium", "Low"];
const SORTS = ["Volume", "Probability", "End Date", "Impact"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Economics: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Politics: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Geopolitics: "bg-red-500/20 text-red-400 border-red-500/30",
  Crypto: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Technology: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Sports: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

const IMPACT_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  High: { label: "High Impact", dot: "bg-red-500", bg: "bg-red-500/15 text-red-400 border-red-500/30" },
  Medium: { label: "Medium Impact", dot: "bg-yellow-500", bg: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  Low: { label: "Low Impact", dot: "bg-emerald-500", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

const IMPACT_SORT_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

const MACRO_FACTORS = ["GDP", "Inflation", "Interest Rates", "Employment", "AUD/USD", "Equities", "Bonds"];

/* ─────────── Helpers ─────────── */

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function timeUntil(dateStr: string): string {
  const now = new Date();
  const end = new Date(dateStr);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  }
  if (days > 0) return `${days} day${days !== 1 ? "s" : ""}`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours} hour${hours !== 1 ? "s" : ""}`;
}

function probBarColor(prob: number): string {
  if (prob > 0.6) return "bg-blue-500";
  if (prob >= 0.4) return "bg-amber-500";
  return "bg-red-500";
}

function directionArrow(dir: string) {
  const d = dir.toLowerCase();
  if (d === "up" || d === "positive" || d === "increase")
    return <ArrowUpRight className="h-4 w-4 text-emerald-400 inline" />;
  if (d === "down" || d === "negative" || d === "decrease")
    return <ArrowDownRight className="h-4 w-4 text-red-400 inline" />;
  return <ArrowRight className="h-4 w-4 text-muted inline" />;
}

function directionCellColor(dir: string): string {
  const d = dir.toLowerCase();
  if (d === "up" || d === "positive" || d === "increase") return "bg-emerald-500/20 text-emerald-400";
  if (d === "down" || d === "negative" || d === "decrease") return "bg-red-500/20 text-red-400";
  return "bg-slate-500/20 text-muted";
}

/* ─────────── Skeleton Components ─────────── */

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-card-border bg-surface p-5">
      <div className="mb-3 h-5 w-3/4 rounded bg-surface-inset" />
      <div className="mb-4 flex gap-2">
        <div className="h-5 w-20 rounded-full bg-surface-inset" />
        <div className="h-5 w-16 rounded-full bg-surface-inset" />
        <div className="h-5 w-24 rounded-full bg-surface-inset" />
      </div>
      <div className="mb-2 h-3 w-full rounded bg-surface-inset" />
      <div className="mb-2 h-3 w-2/3 rounded bg-surface-inset" />
      <div className="space-y-2 pt-3">
        <div className="h-4 w-full rounded bg-surface-inset" />
        <div className="h-4 w-5/6 rounded bg-surface-inset" />
      </div>
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-card-border bg-surface p-6">
          <div className="mb-2 h-3 w-24 rounded bg-surface-inset" />
          <div className="h-7 w-16 rounded bg-surface-inset" />
        </div>
      ))}
    </div>
  );
}

/* ─────────── Pill Button ─────────── */

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-blue-500 bg-blue-500/20 text-blue-400"
          : "border-card-border bg-surface text-muted hover:border-blue-500/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ─────────── Scenario Detail Panel ─────────── */

function ScenarioPanel({ scenarios, onClose }: { scenarios: IntelScenario[]; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(0);

  if (scenarios.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-card-border bg-surface p-6">
        <p className="text-sm text-muted">No scenario analysis available for this event.</p>
      </div>
    );
  }

  const scenario = scenarios[activeTab];

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-blue-500/30 bg-[#0f172a] dark:bg-[#0c1322]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-card-border px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">What-If Scenarios</h3>
        <button onClick={onClose} className="rounded p-1 text-muted hover:bg-surface-inset hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scenario Tabs */}
      {scenarios.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-card-border px-5 py-2">
          {scenarios.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(i)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                i === activeTab
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-muted hover:bg-surface-inset hover:text-foreground"
              }`}
            >
              {s.outcome} ({(s.probability * 100).toFixed(0)}%)
            </button>
          ))}
        </div>
      )}

      <div className="space-y-5 p-5">
        {/* Outcome + Probability */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">Outcome</p>
          <p className="text-sm font-semibold text-foreground">
            {scenario.outcome}
            <span className="ml-2 text-blue-400">({(scenario.probability * 100).toFixed(0)}%)</span>
          </p>
        </div>

        {/* Macro Impacts */}
        {scenario.macro_impacts && scenario.macro_impacts.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Macro Impacts</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border text-left text-muted">
                    <th className="pb-2 pr-4 font-medium">Factor</th>
                    <th className="pb-2 pr-4 font-medium">Direction</th>
                    <th className="pb-2 pr-4 font-medium">Magnitude</th>
                    <th className="pb-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.macro_impacts.map((m, i) => (
                    <tr key={i} className="border-b border-card-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">{m.factor}</td>
                      <td className="py-2 pr-4">{directionArrow(m.direction)} {m.direction}</td>
                      <td className="py-2 pr-4 text-foreground">{m.magnitude}</td>
                      <td className="py-2 text-muted">{m.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chain Effects */}
        {scenario.chain_effects && scenario.chain_effects.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Chain Effects</p>
            <div className="space-y-2">
              {scenario.chain_effects.map((c, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-surface-inset p-3">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      If this happens, then: {c.event}
                    </p>
                    <p className="text-xs text-muted">
                      Probability shift: {c.probability_shift > 0 ? "+" : ""}
                      {(c.probability_shift * 100).toFixed(0)}% &mdash; {c.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fund Implications */}
        {scenario.fund_implications && scenario.fund_implications.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Fund Implications</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border text-left text-muted">
                    <th className="pb-2 pr-4 font-medium">Sector</th>
                    <th className="pb-2 pr-4 font-medium">Action</th>
                    <th className="pb-2 font-medium">Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.fund_implications.map((f, i) => (
                    <tr key={i} className="border-b border-card-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">{f.sector}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            f.action.toLowerCase().includes("overweight")
                              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                              : f.action.toLowerCase().includes("underweight")
                              ? "border-red-500/30 bg-red-500/15 text-red-400"
                              : "border-card-border bg-surface-inset text-muted"
                          }`}
                        >
                          {f.action}
                        </span>
                      </td>
                      <td className="py-2 text-muted">{f.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Australia / Region Impacts */}
        {scenario.region_impacts && scenario.region_impacts.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Regional Impacts</p>
            <div className="space-y-2">
              {scenario.region_impacts.map((r, i) => (
                <div key={i} className="rounded-lg bg-surface-inset p-3">
                  <p className="text-xs font-semibold text-foreground">{r.region}</p>
                  <p className="mt-1 text-xs text-muted">{r.impact}</p>
                  {r.sectors && r.sectors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.sectors.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-card-border bg-surface px-2 py-0.5 text-[10px] text-muted"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Event Card ─────────── */

function EventCard({
  event,
  expanded,
  onToggle,
}: {
  event: IntelEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const catColor = CATEGORY_COLORS[event.category] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  const impactCfg = IMPACT_CONFIG[event.macro_impact] || IMPACT_CONFIG.Low;

  return (
    <div
      className={`rounded-xl border bg-surface transition-all duration-200 ${
        expanded ? "border-blue-500/40 shadow-lg shadow-blue-500/5" : "border-card-border hover:border-blue-500/30"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full cursor-pointer p-5 text-left"
      >
        {/* Title */}
        <h3 className="mb-3 text-sm font-bold leading-snug text-foreground">{event.title}</h3>

        {/* Badges Row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${catColor}`}>
            {event.category}
          </span>
          <span className="rounded-full border border-card-border bg-surface-inset px-2.5 py-0.5 text-[10px] font-medium text-muted">
            {event.region}
          </span>
          <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${impactCfg.bg}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${impactCfg.dot}`} />
            {impactCfg.label}
          </span>
        </div>

        {/* Volume + End Date Row */}
        <div className="mb-4 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> {formatVolume(event.volume)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeUntil(event.end_date)}
          </span>
        </div>

        {/* Market Probability Bars */}
        {event.markets && event.markets.length > 0 && (
          <div className="space-y-2">
            {event.markets.slice(0, 3).map((market) => (
              <div key={market.id}>
                {market.outcomes.map((outcome, oi) => {
                  const price = parseFloat(market.outcome_prices[oi] || "0");
                  const pct = Math.round(price * 100);
                  return (
                    <div key={oi} className="mb-1.5 flex items-center gap-2">
                      <span className="w-28 shrink-0 truncate text-[11px] text-muted" title={outcome}>
                        {outcome}
                      </span>
                      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface-inset">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full ${probBarColor(price)} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-[11px] font-semibold text-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Expand indicator */}
        <div className="mt-3 flex items-center justify-center">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-blue-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted" />
          )}
        </div>
      </button>

      {/* Expanded Scenario Panel */}
      {expanded && (
        <div className="px-5 pb-5">
          <ScenarioPanel scenarios={event.scenarios || []} onClose={onToggle} />
        </div>
      )}
    </div>
  );
}

/* ─────────── Macro Impact Matrix ─────────── */

function MacroImpactMatrix({ events }: { events: IntelEvent[] }) {
  // Build the matrix from high-impact events that have scenarios
  const topEvents = events
    .filter((e) => e.macro_impact === "High" && e.scenarios && e.scenarios.length > 0)
    .slice(0, 6);

  if (topEvents.length === 0) return null;

  // Build a lookup: factor -> event title -> { direction, magnitude }
  const matrix: Record<string, Record<string, { direction: string; magnitude: string }>> = {};
  for (const factor of MACRO_FACTORS) {
    matrix[factor] = {};
  }
  for (const event of topEvents) {
    // Use the first (most likely) scenario
    const scenario = event.scenarios[0];
    if (!scenario?.macro_impacts) continue;
    for (const mi of scenario.macro_impacts) {
      if (matrix[mi.factor]) {
        matrix[mi.factor][event.title] = { direction: mi.direction, magnitude: mi.magnitude };
      }
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-card-border bg-surface">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-card-border">
            <th className="sticky left-0 bg-surface px-4 py-3 text-left text-xs font-semibold text-muted">Factor</th>
            {topEvents.map((e) => (
              <th key={e.id} className="px-3 py-3 text-center text-xs font-medium text-muted" title={e.title}>
                <span className="inline-block max-w-[120px] truncate">{e.title}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MACRO_FACTORS.map((factor) => (
            <tr key={factor} className="border-b border-card-border/50">
              <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-foreground">{factor}</td>
              {topEvents.map((e) => {
                const cell = matrix[factor]?.[e.title];
                if (!cell) {
                  return (
                    <td key={e.id} className="px-3 py-2.5 text-center text-muted">
                      &mdash;
                    </td>
                  );
                }
                return (
                  <td key={e.id} className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${directionCellColor(cell.direction)}`}>
                      {directionArrow(cell.direction)} {cell.magnitude}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════ MAIN PAGE ═══════════ */

export default function IntelPage() {
  const [events, setEvents] = useState<IntelEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState("All");
  const [region, setRegion] = useState("Global");
  const [impact, setImpact] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Volume");

  // Expanded card
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── Fetch ── */
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/intel/events?limit=50");
      if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);
      const data = await res.json();
      const list: IntelEvent[] = Array.isArray(data) ? data : data.events ?? [];
      setEvents(list);
      setLastSynced(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ── Sync ── */
  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/intel/sync", { method: "POST" });
      if (!res.ok) throw new Error(`Sync failed (${res.status})`);
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  /* ── Filtering + Sorting ── */
  const filtered = useMemo(() => {
    let result = [...events];

    if (category !== "All") {
      result = result.filter((e) => e.category === category);
    }
    if (region !== "Global") {
      result = result.filter((e) => e.region === region);
    }
    if (impact !== "All") {
      result = result.filter((e) => e.macro_impact === impact);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.subcategory?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sort) {
      case "Volume":
        result.sort((a, b) => b.volume - a.volume);
        break;
      case "End Date":
        result.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
        break;
      case "Impact":
        result.sort((a, b) => (IMPACT_SORT_ORDER[a.macro_impact] ?? 3) - (IMPACT_SORT_ORDER[b.macro_impact] ?? 3));
        break;
      case "Probability":
        result.sort((a, b) => {
          const maxProb = (e: IntelEvent) => {
            let max = 0;
            for (const m of e.markets || []) {
              for (const p of m.outcome_prices || []) {
                const v = parseFloat(p);
                if (v > max) max = v;
              }
            }
            return max;
          };
          return maxProb(b) - maxProb(a);
        });
        break;
    }

    return result;
  }, [events, category, region, impact, search, sort]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = events.length;
    const highImpact = events.filter((e) => e.macro_impact === "High").length;
    const totalVolume = events.reduce((s, e) => s + (e.volume || 0), 0);
    const activeMarkets = events.reduce((s, e) => s + (e.markets?.length || 0), 0);
    return { total, highImpact, totalVolume, activeMarkets };
  }, [events]);

  /* ── Category counts ── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.category] = (counts[e.category] || 0) + 1;
    }
    return counts;
  }, [events]);

  /* ═══════════ RENDER ═══════════ */

  return (
    <div className="space-y-6">
      {/* ── TOP BAR: Filters & Controls ── */}
      <div className="space-y-4 rounded-xl border border-card-border bg-surface p-5">
        {/* Row 1: Category pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="mr-1 h-4 w-4 text-muted" />
          {CATEGORIES.map((c) => (
            <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
              {c !== "All" && categoryCounts[c] ? ` (${categoryCounts[c]})` : c === "All" ? ` (${events.length})` : ""}
            </Pill>
          ))}
        </div>

        {/* Row 2: Region, Impact, Search, Sort, Sync */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Region */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Region</span>
            <div className="flex gap-1">
              {REGIONS.map((r) => (
                <Pill key={r} active={region === r} onClick={() => setRegion(r)}>
                  {r}
                </Pill>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden h-6 w-px bg-card-border sm:block" />

          {/* Impact */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Impact</span>
            <div className="flex gap-1">
              {IMPACTS.map((imp) => (
                <Pill key={imp} active={impact === imp} onClick={() => setImpact(imp)}>
                  {imp}
                </Pill>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden h-6 w-px bg-card-border sm:block" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="h-8 w-48 rounded-lg border border-card-border bg-background pl-8 pr-3 text-xs text-foreground placeholder-muted outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
            className="h-8 rounded-lg border border-card-border bg-background px-2 text-xs text-foreground outline-none focus:border-blue-400"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                Sort: {s}
              </option>
            ))}
          </select>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Last synced */}
          {lastSynced && (
            <span className="hidden text-[10px] text-muted sm:block">
              Synced {new Date(lastSynced).toLocaleTimeString()}
            </span>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Data"}
          </button>
        </div>
      </div>

      {/* ── SECTION 1: Market Pulse Stats ── */}
      {loading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Events"
            value={stats.total}
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard
            title="High Impact Events"
            value={stats.highImpact}
            icon={<AlertTriangle className="h-5 w-5" />}
            className="border-red-500/20"
          />
          <StatCard
            title="Total Volume"
            value={formatVolume(stats.totalVolume)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Active Markets"
            value={stats.activeMarkets}
            icon={<Radio className="h-5 w-5" />}
          />
        </div>
      )}

      {/* ── Error State ── */}
      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── SECTION 2: Event Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-surface py-16 text-center">
          <Brain className="mb-4 h-12 w-12 text-muted" />
          <p className="mb-2 text-sm font-semibold text-foreground">No events found</p>
          <p className="mb-4 text-xs text-muted">
            {events.length === 0
              ? "Click Sync Data to fetch latest markets."
              : "Try adjusting your filters."}
          </p>
          {events.length === 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              Sync Data
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              expanded={expandedId === event.id}
              onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
            />
          ))}
        </div>
      )}

      {/* ── SECTION 4: Macro Impact Matrix ── */}
      {!loading && events.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Macro Impact Matrix</h2>
          <MacroImpactMatrix events={events} />
        </div>
      )}
    </div>
  );
}
