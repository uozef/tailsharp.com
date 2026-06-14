"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Radio, Database, ExternalLink } from "lucide-react";

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

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default function LiveLeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/polymarket/leaderboard?limit=50");
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setLeaders(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function triggerSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "leaderboard" }),
      });
      const data = await res.json();
      setSyncResult(data);
    } catch (e: any) {
      setSyncResult({ error: e.message });
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-blue-400" />
          <p className="text-sm text-muted">
            Real-time data from Polymarket leaderboard API
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-card-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-inset disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
          >
            <Database className={`h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
            {syncing ? "Syncing..." : "Sync to Database"}
          </button>
        </div>
      </div>

      {/* Sync Result Banner */}
      {syncResult && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            syncResult.error
              ? "border-red-500/30 bg-red-500/10 text-danger"
              : "border-green-500/30 bg-green-500/10 text-green-400"
          }`}
        >
          {syncResult.error
            ? `Sync failed: ${syncResult.error}`
            : `Sync complete: ${syncResult.inserted ?? syncResult.count ?? 0} records synced`}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface py-16 text-center shadow-sm">
          <Radio className="mb-4 h-12 w-12 text-danger" />
          <h3 className="text-lg font-semibold text-foreground">
            Failed to load leaderboard
          </h3>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-8 animate-pulse rounded bg-surface-inset" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-surface-inset" />
                <div className="h-4 w-32 animate-pulse rounded bg-surface-inset" />
                <div className="ml-auto h-4 w-20 animate-pulse rounded bg-surface-inset" />
                <div className="h-4 w-20 animate-pulse rounded bg-surface-inset" />
                <div className="h-4 w-16 animate-pulse rounded bg-surface-inset" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {!loading && !error && (
        <div className="rounded-2xl bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-xs font-medium uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">#</th>
                  <th className="px-4 py-4">Trader</th>
                  <th className="px-4 py-4">Wallet</th>
                  <th className="px-4 py-4 text-right">Volume</th>
                  <th className="px-4 py-4 text-right">P&amp;L</th>
                  <th className="px-4 py-4 text-right">ROI</th>
                  <th className="px-4 py-4 text-center">X</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {leaders.map((leader) => {
                  const roi =
                    leader.vol > 0
                      ? (leader.pnl / leader.vol) * 100
                      : 0;

                  return (
                    <tr
                      key={leader.proxyWallet}
                      className="text-foreground transition-colors hover:bg-surface-inset"
                    >
                      {/* Rank */}
                      <td className="px-6 py-4 font-semibold text-muted">
                        {leader.rank}
                      </td>

                      {/* Trader */}
                      <td className="px-4 py-4">
                        <Link
                          href={`/live/${leader.proxyWallet}`}
                          className="flex items-center gap-3 transition-colors hover:text-blue-400"
                        >
                          {leader.profileImage ? (
                            <img
                              src={leader.profileImage}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-inset text-xs font-bold text-muted">
                              {(leader.userName || "?")[0].toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">
                            {leader.userName || truncateWallet(leader.proxyWallet)}
                          </span>
                          {leader.verifiedBadge && (
                            <span className="text-gold-400" title="Verified">
                              &#10003;
                            </span>
                          )}
                        </Link>
                      </td>

                      {/* Wallet */}
                      <td className="px-4 py-4 font-mono text-xs text-muted">
                        {truncateWallet(leader.proxyWallet)}
                      </td>

                      {/* Volume */}
                      <td className="px-4 py-4 text-right font-medium">
                        {formatCurrency(leader.vol)}
                      </td>

                      {/* P&L */}
                      <td
                        className={`px-4 py-4 text-right font-semibold ${
                          leader.pnl >= 0 ? "text-gold-400" : "text-danger"
                        }`}
                      >
                        {leader.pnl >= 0 ? "+" : ""}
                        {formatCurrency(leader.pnl)}
                      </td>

                      {/* ROI */}
                      <td
                        className={`px-4 py-4 text-right font-medium ${
                          roi >= 0 ? "text-gold-400" : "text-danger"
                        }`}
                      >
                        {roi >= 0 ? "+" : ""}
                        {roi.toFixed(1)}%
                      </td>

                      {/* X / Twitter */}
                      <td className="px-4 py-4 text-center">
                        {leader.xUsername ? (
                          <a
                            href={`https://x.com/${leader.xUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300"
                          >
                            @{leader.xUsername}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {leaders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Radio className="mb-4 h-12 w-12 text-muted" />
              <h3 className="text-lg font-semibold text-foreground">
                No leaderboard data
              </h3>
              <p className="mt-1 text-sm text-muted">
                Try refreshing or syncing data from Polymarket
              </p>
            </div>
          )}
        </div>
      )}

      {/* Result Count */}
      {!loading && !error && leaders.length > 0 && (
        <p className="text-sm text-muted">
          Showing{" "}
          <span className="font-semibold text-foreground">
            {leaders.length}
          </span>{" "}
          leaders
        </p>
      )}
    </div>
  );
}
