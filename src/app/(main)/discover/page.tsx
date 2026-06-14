"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, BadgeCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Timestamp from "@/components/Timestamp";

interface LeaderEntry {
  rank: string;
  proxyWallet: string;
  userName: string;
  xUsername: string;
  verifiedBadge: boolean;
  vol: number;
  pnl: number;
  profileImage: string;
}

type SortKey = "pnl" | "vol" | "roi";

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getInitials(name: string): string {
  if (!name) return "??";
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function displayName(entry: LeaderEntry): string {
  if (entry.userName) return entry.userName;
  const wallet = entry.proxyWallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-card-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-card-border" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded bg-card-border" />
          <div className="h-3 w-16 rounded bg-card-border" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="h-10 rounded-lg bg-card-border" />
        <div className="h-10 rounded-lg bg-card-border" />
        <div className="h-10 rounded-lg bg-card-border" />
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("pnl");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/polymarket/leaderboard?limit=100");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const data: LeaderEntry[] = await res.json();
        if (!cancelled) {
          setLeaders(data);
          setFetchedAt(new Date().toISOString());
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Failed to load leaderboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLeaders = useMemo(() => {
    let results = [...leaders];

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (l) =>
          l.userName?.toLowerCase().includes(q) ||
          l.proxyWallet.toLowerCase().includes(q) ||
          l.xUsername?.toLowerCase().includes(q)
      );
    }

    results.sort((a, b) => {
      if (sortBy === "pnl") return b.pnl - a.pnl;
      if (sortBy === "vol") return b.vol - a.vol;
      // ROI = pnl / vol
      const roiA = a.vol ? a.pnl / a.vol : 0;
      const roiB = b.vol ? b.pnl / b.vol : 0;
      return roiB - roiA;
    });

    return results;
  }, [leaders, search, sortBy]);

  const selectClass =
    "h-10 rounded-xl border border-card-border bg-surface px-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer";

  const [lookupInput, setLookupInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  function isValidInput(input: string): boolean {
    const trimmed = input.trim();
    if (!trimmed) return false;
    // Wallet address
    if (/^0x[a-fA-F0-9]{40}$/i.test(trimmed)) return true;
    // URL with wallet
    if (/(0x[a-fA-F0-9]{40})/i.test(trimmed)) return true;
    // polymarket.com/@username or polymarket.com/profile/...
    if (/polymarket\.com\/@/i.test(trimmed) || /polymarket\.com\/profile\//i.test(trimmed)) return true;
    // Bare username (letters, numbers, dots, underscores, at least 2 chars)
    if (/^@?[a-zA-Z0-9_.-]{2,}$/.test(trimmed)) return true;
    return false;
  }

  async function handleLookup() {
    const trimmed = lookupInput.trim().replace(/^@/, "");
    if (!trimmed) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      // Resolve via server — handles wallets, URLs, and usernames
      const res = await fetch(`/api/polymarket/resolve?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok || !data.wallet) {
        setLookupError(data.error || "Could not resolve this address or username");
        setLookupLoading(false);
        return;
      }
      // Save to database in background
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "wallet", wallet: data.wallet }),
      }).catch(() => {});
      window.location.href = `/leader/${data.wallet}`;
    } catch (e: any) {
      setLookupError(e.message || "Failed to resolve");
      setLookupLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Any Wallet */}
      <div className="rounded-2xl bg-[#1e293b] p-5 shadow-sm">
        <h2 className="text-sm font-bold text-white mb-3">Profile Any Wallet</h2>
        <p className="text-xs text-slate-400 mb-3">
          Paste a Polymarket profile URL or wallet address to analyze any trader
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="0x..., @username, or https://polymarket.com/@username"
            value={lookupInput}
            onChange={(e) => setLookupInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="h-11 flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-mono"
          />
          <button
            onClick={handleLookup}
            disabled={!isValidInput(lookupInput) || lookupLoading}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {lookupLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Analyze
          </button>
        </div>
        {lookupError && (
          <p className="mt-2 text-xs text-danger">{lookupError}</p>
        )}
        {lookupInput.trim() && !isValidInput(lookupInput) && !lookupError && (
          <p className="mt-2 text-xs text-amber-400">Enter a wallet address (0x...), @username, or Polymarket profile URL</p>
        )}
      </div>

      {/* Search Leaderboard */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Filter leaderboard by username or wallet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 w-full rounded-2xl border border-card-border bg-surface pl-12 pr-4 text-sm text-foreground placeholder-muted shadow-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Sort by:</span>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className={selectClass}
        >
          <option value="pnl">PnL</option>
          <option value="vol">Volume</option>
          <option value="roi">ROI</option>
        </select>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {loading ? (
            "Loading leaderboard..."
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filteredLeaders.length}
              </span>{" "}
              leaders
            </>
          )}
        </p>
        <Timestamp date={fetchedAt ?? undefined} />
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center">
          <p className="text-sm font-medium text-danger">
            Failed to load leaderboard
          </p>
          <p className="mt-1 text-xs text-muted">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-danger/10 px-4 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger/20"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Leader Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredLeaders.map((entry) => {
            const roi = entry.vol ? (entry.pnl / entry.vol) * 100 : 0;
            const pnlPositive = entry.pnl >= 0;
            const roiPositive = roi >= 0;

            return (
              <Link
                key={entry.proxyWallet}
                href={`/leader/${entry.proxyWallet}`}
                className="group rounded-2xl border border-card-border bg-surface p-5 transition-all hover:border-blue-400/40 hover:shadow-lg"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  {entry.profileImage ? (
                    <Image
                      src={entry.profileImage}
                      alt={displayName(entry)}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-400">
                      {getInitials(entry.userName)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                        {displayName(entry)}
                      </span>
                      {entry.verifiedBadge && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-blue-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center rounded-md bg-gold-400/10 px-1.5 py-0.5 text-[10px] font-bold text-gold-400">
                        #{entry.rank}
                      </span>
                      {entry.xUsername && (
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(
                              `https://x.com/${entry.xUsername}`,
                              "_blank"
                            );
                          }}
                          className="inline-flex items-center gap-0.5 text-[11px] text-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                          @{entry.xUsername}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-background/50 p-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      Volume
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {formatCurrency(entry.vol)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      PnL
                    </p>
                    <p
                      className={`mt-0.5 text-sm font-semibold ${
                        pnlPositive ? "text-gold-400" : "text-danger"
                      }`}
                    >
                      {pnlPositive ? "+" : ""}
                      {formatCurrency(entry.pnl)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      ROI
                    </p>
                    <p
                      className={`mt-0.5 text-sm font-semibold ${
                        roiPositive ? "text-gold-400" : "text-danger"
                      }`}
                    >
                      {roiPositive ? "+" : ""}
                      {roi.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredLeaders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="mb-4 h-12 w-12 text-muted" />
          <h3 className="text-lg font-semibold text-foreground">
            No leaders found
          </h3>
          <p className="mt-1 text-sm text-muted">
            Try adjusting your search terms
          </p>
        </div>
      )}
    </div>
  );
}
