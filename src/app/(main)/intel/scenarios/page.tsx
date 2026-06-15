"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowDown,
  Target,
  Zap,
  TrendingUp,
  Shield,
  Globe,
  BarChart3,
  Link2,
  X,
} from "lucide-react";

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

interface CorrelatedEvent {
  event: IntelEvent;
  correlationType: string;
  strength: "high" | "medium" | "low";
  explanation: string;
}

/* ─────────── Helpers ─────────── */

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function directionArrow(dir: string) {
  const d = dir.toLowerCase();
  if (d === "up" || d === "positive" || d === "increase")
    return <span className="text-emerald-400">&#8593;</span>;
  if (d === "down" || d === "negative" || d === "decrease")
    return <span className="text-red-400">&#8595;</span>;
  return <span className="text-slate-400">&#8594;</span>;
}

function directionColor(dir: string): string {
  const d = dir.toLowerCase();
  if (d === "up" || d === "positive" || d === "increase") return "text-emerald-400";
  if (d === "down" || d === "negative" || d === "decrease") return "text-red-400";
  return "text-slate-400";
}

function magnitudeBadge(mag: string) {
  const m = mag.toLowerCase();
  if (m === "high")
    return (
      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/30">
        High
      </span>
    );
  if (m === "medium")
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
        Medium
      </span>
    );
  return (
    <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-500/30">
      Low
    </span>
  );
}

function magnitudeBarWidth(mag: string): string {
  const m = mag.toLowerCase();
  if (m === "high") return "75%";
  if (m === "medium") return "50%";
  return "25%";
}

function magnitudeBarColor(dir: string): string {
  const d = dir.toLowerCase();
  if (d === "up" || d === "positive" || d === "increase") return "bg-emerald-500";
  if (d === "down" || d === "negative" || d === "decrease") return "bg-red-500";
  return "bg-slate-500";
}

function actionBadge(action: string) {
  const a = action.toLowerCase();
  if (a.includes("overweight"))
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
        OVERWEIGHT
      </span>
    );
  if (a.includes("underweight"))
    return (
      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
        UNDERWEIGHT
      </span>
    );
  return (
    <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-500/30">
      HOLD
    </span>
  );
}

function correlationStrengthBar(strength: "high" | "medium" | "low") {
  const w = strength === "high" ? "w-full" : strength === "medium" ? "w-2/3" : "w-1/3";
  const color =
    strength === "high"
      ? "bg-blue-500"
      : strength === "medium"
      ? "bg-blue-400"
      : "bg-blue-300";
  return (
    <div className="h-1.5 w-20 rounded-full bg-surface-inset">
      <div className={`h-full rounded-full ${color} ${w}`} />
    </div>
  );
}

function correlationTypeBadge(type: string) {
  const colors: Record<string, string> = {
    "Same Category": "bg-purple-500/15 text-purple-400 border-purple-500/30",
    "Macro Aligned": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "Direct Chain": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "Inverse Correlation": "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const c = colors[type] || "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${c}`}>
      {type}
    </span>
  );
}

/* ─────────── Correlation Engine ─────────── */

function computeCorrelations(
  selectedEvent: IntelEvent,
  selectedScenario: IntelScenario,
  allEvents: IntelEvent[],
): CorrelatedEvent[] {
  const results: CorrelatedEvent[] = [];
  const selectedMacroMap = new Map<string, string>();
  for (const m of selectedScenario.macro_impacts || []) {
    selectedMacroMap.set(m.factor, m.direction.toLowerCase());
  }

  const chainEventNames = new Set(
    (selectedScenario.chain_effects || []).map((c) => c.event.toLowerCase()),
  );

  for (const event of allEvents) {
    if (event.id === selectedEvent.id) continue;

    // Check chain effect match
    const titleLower = event.title.toLowerCase();
    if (chainEventNames.has(titleLower) || [...chainEventNames].some((cn) => titleLower.includes(cn) || cn.includes(titleLower))) {
      results.push({
        event,
        correlationType: "Direct Chain",
        strength: "high",
        explanation: `Directly referenced in scenario chain effects for "${selectedScenario.outcome}".`,
      });
      continue;
    }

    // Check macro alignment / inverse
    if (event.scenarios && event.scenarios.length > 0) {
      const topScenario = event.scenarios[0];
      if (topScenario.macro_impacts && topScenario.macro_impacts.length > 0) {
        let alignedCount = 0;
        let inverseCount = 0;
        let overlapCount = 0;

        for (const em of topScenario.macro_impacts) {
          const selectedDir = selectedMacroMap.get(em.factor);
          if (selectedDir) {
            overlapCount++;
            const emDir = em.direction.toLowerCase();
            const sameDir =
              (selectedDir === emDir) ||
              (["up", "positive", "increase"].includes(selectedDir) && ["up", "positive", "increase"].includes(emDir)) ||
              (["down", "negative", "decrease"].includes(selectedDir) && ["down", "negative", "decrease"].includes(emDir));
            const oppositeDir =
              (["up", "positive", "increase"].includes(selectedDir) && ["down", "negative", "decrease"].includes(emDir)) ||
              (["down", "negative", "decrease"].includes(selectedDir) && ["up", "positive", "increase"].includes(emDir));

            if (sameDir) alignedCount++;
            if (oppositeDir) inverseCount++;
          }
        }

        if (inverseCount > 0 && inverseCount >= alignedCount && overlapCount >= 2) {
          results.push({
            event,
            correlationType: "Inverse Correlation",
            strength: overlapCount >= 3 ? "high" : "medium",
            explanation: `Opposing macro impacts on ${overlapCount} shared factors.`,
          });
          continue;
        }
        if (alignedCount >= 2) {
          results.push({
            event,
            correlationType: "Macro Aligned",
            strength: alignedCount >= 3 ? "high" : "medium",
            explanation: `Aligned macro impacts on ${alignedCount} shared factors.`,
          });
          continue;
        }
      }
    }

    // Same category
    if (event.category === selectedEvent.category) {
      results.push({
        event,
        correlationType: "Same Category",
        strength: event.region === selectedEvent.region ? "medium" : "low",
        explanation: `Both in "${event.category}" category${event.region === selectedEvent.region ? `, same region (${event.region})` : ""}.`,
      });
    }
  }

  // Sort by strength
  const order = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => order[a.strength] - order[b.strength]);
  return results.slice(0, 12);
}

/* ─────────── Loading Skeleton ─────────── */

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-xl border border-card-border bg-surface p-6">
        <div className="h-10 w-full rounded-lg bg-surface-inset" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-card-border bg-surface p-5">
            <div className="mb-3 h-4 w-1/2 rounded bg-surface-inset" />
            <div className="mb-2 h-3 w-full rounded bg-surface-inset" />
            <div className="mb-2 h-3 w-3/4 rounded bg-surface-inset" />
            <div className="h-3 w-2/3 rounded bg-surface-inset" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ MAIN PAGE ═══════════ */

export default function ScenarioLabPage() {
  const [events, setEvents] = useState<IntelEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<IntelEvent | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<IntelScenario | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ── Fetch ── */
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/intel/events?limit=100");
      if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);
      const data = await res.json();
      const list: IntelEvent[] = Array.isArray(data) ? data : data.events ?? [];
      setEvents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ── Click outside to close dropdown ── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Filtered search results ── */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return events.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.subcategory?.toLowerCase().includes(q),
    );
  }, [events, searchQuery]);

  /* ── Outcomes for selected event ── */
  const outcomes = useMemo(() => {
    if (!selectedEvent) return [];
    // Map scenario outcomes to buttons
    return (selectedEvent.scenarios || []).map((s) => ({
      scenario: s,
      label: s.outcome,
      probability: s.probability,
    }));
  }, [selectedEvent]);

  /* ── Correlations ── */
  const correlations = useMemo(() => {
    if (!selectedEvent || !selectedScenario) return [];
    return computeCorrelations(selectedEvent, selectedScenario, events);
  }, [selectedEvent, selectedScenario, events]);

  /* ── AU-specific data from scenario ── */
  const auImpacts = useMemo(() => {
    if (!selectedScenario) return null;
    const auRegion = (selectedScenario.region_impacts || []).find(
      (r) => r.region.toLowerCase().includes("australia") || r.region.toLowerCase() === "au",
    );
    const audFactor = (selectedScenario.macro_impacts || []).find(
      (m) => m.factor.toLowerCase().includes("aud"),
    );
    return { auRegion, audFactor };
  }, [selectedScenario]);

  /* ── Select event handler ── */
  const handleSelectEvent = (event: IntelEvent) => {
    setSelectedEvent(event);
    setSelectedScenario(null);
    setSearchQuery(event.title);
    setShowDropdown(false);
  };

  /* ── Clear selection ── */
  const handleClear = () => {
    setSelectedEvent(null);
    setSelectedScenario(null);
    setSearchQuery("");
  };

  /* ═══════════ RENDER ═══════════ */

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── SECTION 1: Search & Select ─── */}
      <div className="rounded-xl border border-card-border bg-surface p-6">
        <div ref={searchRef} className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
              if (!e.target.value.trim()) {
                setSelectedEvent(null);
                setSelectedScenario(null);
              }
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search any market or event..."
            className="h-12 w-full rounded-xl border border-card-border bg-background pl-12 pr-12 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Search Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-card-border bg-surface shadow-xl">
              {searchResults.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-inset"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                        {event.category}
                      </span>
                      <span className="text-[10px] text-muted">{event.region}</span>
                      <span className="text-[10px] text-muted">{formatVolume(event.volume)} vol</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted">
                    {event.scenarios?.length || 0} scenarios
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Event Card */}
        {selectedEvent && (
          <div className="mt-4 rounded-lg border border-blue-500/30 bg-[#0f172a] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Selected Event</p>
                <h3 className="mt-1 text-sm font-bold text-foreground">{selectedEvent.title}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/30">
                    {selectedEvent.category}
                  </span>
                  <span className="text-[10px] text-muted">{selectedEvent.region}</span>
                  <span className="text-[10px] text-muted">{formatVolume(selectedEvent.volume)} volume</span>
                  <span className="text-[10px] text-muted">{selectedEvent.scenarios?.length || 0} scenarios</span>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="rounded p-1 text-muted hover:bg-surface-inset hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── SECTION 2: Outcome Selector ─── */}
      {selectedEvent && outcomes.length > 0 && (
        <div className="rounded-xl border border-card-border bg-surface p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="h-4 w-4 text-blue-400" />
            Select an Outcome
          </h2>
          <p className="mb-4 text-xs text-muted">Click an outcome to simulate &ldquo;What if this happens?&rdquo;</p>
          <div className="flex flex-wrap gap-2">
            {outcomes.map(({ scenario, label, probability }) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`rounded-lg border px-4 py-2.5 text-left transition-all ${
                  selectedScenario?.id === scenario.id
                    ? "border-blue-500 bg-blue-500/15 shadow-sm shadow-blue-500/10"
                    : "border-card-border bg-surface-inset hover:border-blue-500/50"
                }`}
              >
                <span className="block text-xs font-semibold text-foreground">{label}</span>
                <span className="block text-[11px] text-blue-400">{(probability * 100).toFixed(0)}% probability</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedEvent && outcomes.length === 0 && (
        <div className="rounded-xl border border-card-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">No scenario analysis available for this event.</p>
        </div>
      )}

      {/* ─── SECTION 3: Scenario Impact Dashboard ─── */}
      {selectedScenario && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Column 1: Macro Impact Analysis */}
          <div className="rounded-xl border border-card-border bg-[#0f172a] p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              Macro Impact Analysis
            </h3>
            <p className="mb-4 text-xs text-blue-400">
              If &ldquo;{selectedScenario.outcome}&rdquo; happens...
            </p>

            {selectedScenario.macro_impacts && selectedScenario.macro_impacts.length > 0 ? (
              <div className="space-y-3">
                {selectedScenario.macro_impacts.map((m, i) => (
                  <div key={i} className="rounded-lg bg-surface-inset p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{m.factor}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${directionColor(m.direction)}`}>
                          {directionArrow(m.direction)}
                        </span>
                        {magnitudeBadge(m.magnitude)}
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{m.description}</p>
                    {/* Impact bar */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-background">
                      <div
                        className={`h-full rounded-full transition-all ${magnitudeBarColor(m.direction)}`}
                        style={{ width: magnitudeBarWidth(m.magnitude) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No macro impact data available.</p>
            )}
          </div>

          {/* Column 2: Chain Reaction Map */}
          <div className="rounded-xl border border-card-border bg-[#0f172a] p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Zap className="h-4 w-4 text-amber-400" />
              Cascading Effects
            </h3>
            <p className="mb-4 text-xs text-muted">Vertical chain reaction flow</p>

            {selectedScenario.chain_effects && selectedScenario.chain_effects.length > 0 ? (
              <div className="relative space-y-0">
                {/* Starting node */}
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">If</p>
                  <p className="text-xs font-semibold text-foreground">{selectedScenario.outcome}</p>
                  <p className="text-[10px] text-muted">{(selectedScenario.probability * 100).toFixed(0)}% probability</p>
                </div>

                {selectedScenario.chain_effects.map((c, i) => (
                  <div key={i}>
                    {/* Connector arrow */}
                    <div className="flex justify-center py-1">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-px bg-blue-500/40" />
                        <ArrowDown className="h-3 w-3 text-blue-400" />
                      </div>
                    </div>

                    {/* Effect node */}
                    <div className="rounded-lg border border-card-border bg-[#1e293b] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                        Then
                      </p>
                      <p className="text-xs font-semibold text-foreground">{c.event}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold ${
                            c.probability_shift > 0 ? "text-emerald-400" : c.probability_shift < 0 ? "text-red-400" : "text-slate-400"
                          }`}
                        >
                          {c.probability_shift > 0 ? "+" : ""}
                          {(c.probability_shift * 100).toFixed(0)}%
                        </span>
                        <span className="text-[10px] text-muted">probability shift</span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted">{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No chain effects data available.</p>
            )}
          </div>

          {/* Column 3: Portfolio Action */}
          <div className="rounded-xl border border-card-border bg-[#0f172a] p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4 text-emerald-400" />
              Fund Positioning
            </h3>
            <p className="mb-4 text-xs text-muted">Recommended sector allocations</p>

            {selectedScenario.fund_implications && selectedScenario.fund_implications.length > 0 ? (
              <div className="space-y-2">
                {selectedScenario.fund_implications.map((f, i) => (
                  <div key={i} className="rounded-lg bg-surface-inset p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{f.sector}</span>
                      {actionBadge(f.action)}
                    </div>
                    <p className="mt-1 text-[10px] text-muted">{f.rationale}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No fund positioning data available.</p>
            )}

            {/* Australian Focus Section */}
            {(auImpacts?.auRegion || auImpacts?.audFactor) && (
              <div className="mt-4 border-t border-card-border pt-4">
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Globe className="h-3.5 w-3.5 text-blue-400" />
                  Australian Focus
                </h4>

                {auImpacts.audFactor && (
                  <div className="mb-3 rounded-lg bg-surface-inset p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">AUD Impact</span>
                      <span className={`text-sm font-bold ${directionColor(auImpacts.audFactor.direction)}`}>
                        {directionArrow(auImpacts.audFactor.direction)}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted">{auImpacts.audFactor.description}</p>
                  </div>
                )}

                {auImpacts.auRegion && (
                  <div className="rounded-lg bg-surface-inset p-3">
                    <p className="text-xs font-semibold text-foreground">{auImpacts.auRegion.region}</p>
                    <p className="mt-1 text-[10px] text-muted">{auImpacts.auRegion.impact}</p>
                    {auImpacts.auRegion.sectors && auImpacts.auRegion.sectors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {auImpacts.auRegion.sectors.map((s) => (
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
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SECTION 4: Correlated Markets ─── */}
      {selectedScenario && correlations.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Link2 className="h-4 w-4 text-blue-400" />
            Correlated Markets
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {correlations.map((corr) => {
              const topProb = corr.event.scenarios?.[0]?.probability;
              return (
                <div
                  key={corr.event.id}
                  className="rounded-xl border border-card-border bg-surface p-4 transition-colors hover:border-blue-500/30"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="text-xs font-semibold leading-snug text-foreground">
                      {corr.event.title}
                    </h4>
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {correlationTypeBadge(corr.correlationType)}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted">Strength</span>
                      {correlationStrengthBar(corr.strength)}
                    </div>
                  </div>
                  {topProb !== undefined && (
                    <p className="mb-1 text-[10px] text-muted">
                      Top scenario probability:{" "}
                      <span className="font-semibold text-foreground">
                        {(topProb * 100).toFixed(0)}%
                      </span>
                    </p>
                  )}
                  <p className="text-[10px] text-muted">{corr.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── SECTION 5: Simulation Summary ─── */}
      {selectedScenario && selectedEvent && (
        <div className="rounded-xl border border-blue-500/20 bg-[#0f172a] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            Simulation Summary
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Scenario */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Scenario</p>
              <p className="mt-1 text-xs text-foreground">
                If <span className="font-semibold">{selectedEvent.title}</span> resolves to{" "}
                <span className="font-semibold text-blue-400">{selectedScenario.outcome}</span>
              </p>
            </div>

            {/* Probability */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Probability</p>
              <p className="mt-1 text-lg font-bold text-blue-400">
                {(selectedScenario.probability * 100).toFixed(0)}%
              </p>
            </div>

            {/* Key Macro Shifts */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Key Macro Shifts</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(selectedScenario.macro_impacts || []).slice(0, 4).map((m, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      m.direction.toLowerCase().includes("up") || m.direction.toLowerCase().includes("positive") || m.direction.toLowerCase().includes("increase")
                        ? "bg-emerald-500/15 text-emerald-400"
                        : m.direction.toLowerCase().includes("down") || m.direction.toLowerCase().includes("negative") || m.direction.toLowerCase().includes("decrease")
                        ? "bg-red-500/15 text-red-400"
                        : "bg-slate-500/15 text-slate-400"
                    }`}
                  >
                    {m.factor} {directionArrow(m.direction)}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Positioning */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Recommended Positioning</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(selectedScenario.fund_implications || []).slice(0, 4).map((f, i) => (
                  <span key={i} className="text-[10px] text-foreground">
                    {f.sector}: <span className={
                      f.action.toLowerCase().includes("overweight")
                        ? "font-semibold text-emerald-400"
                        : f.action.toLowerCase().includes("underweight")
                        ? "font-semibold text-red-400"
                        : "font-semibold text-slate-400"
                    }>{f.action}</span>
                    {i < Math.min((selectedScenario.fund_implications || []).length, 4) - 1 && " | "}
                  </span>
                ))}
              </div>

              {/* Most affected AU sectors */}
              {auImpacts?.auRegion?.sectors && auImpacts.auRegion.sectors.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-muted">
                    Most affected AU sectors:{" "}
                    <span className="text-foreground">{auImpacts.auRegion.sectors.join(", ")}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state when nothing selected */}
      {!selectedEvent && events.length > 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-surface py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted" />
          <p className="mb-2 text-sm font-semibold text-foreground">Search for a market event</p>
          <p className="text-xs text-muted">
            Type in the search bar above to find an event, then select an outcome to run a what-if scenario simulation.
          </p>
        </div>
      )}
    </div>
  );
}
