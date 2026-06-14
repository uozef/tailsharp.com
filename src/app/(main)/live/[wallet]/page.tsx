"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Radio, RefreshCw } from "lucide-react";

interface Trade {
  timestamp: string;
  market: string;
  side: string;
  price: number;
  size: number;
  outcome: string;
}

interface ActivityData {
  wallet: string;
  tradeCount: number;
  trades: Trade[];
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default function LiveWalletDetailPage() {
  const params = useParams();
  const wallet = params.wallet as string;

  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchActivity() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/polymarket/activity?wallet=${encodeURIComponent(wallet)}`
      );
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = await res.json();
      // API returns raw array of trades — normalize to expected shape
      const trades = Array.isArray(json) ? json : json.trades || [];
      setData({
        wallet,
        tradeCount: trades.length,
        trades: trades.map((t: any) => ({
          timestamp: t.timestamp ? new Date(t.timestamp * 1000).toISOString() : t.date || "",
          market: t.title || t.market || "Unknown",
          side: t.side || "BUY",
          price: t.price || 0,
          size: t.usdcSize || t.size || 0,
          outcome: t.outcome || "",
        })),
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivity();
  }, [wallet]);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/live"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Live Leaderboard
      </Link>

      {/* Wallet Header */}
      <div className="rounded-2xl bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Wallet Activity
            </h2>
            <p className="mt-1 font-mono text-sm text-muted">{wallet}</p>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className="rounded-lg bg-surface-inset px-3 py-1.5 text-sm font-medium text-foreground">
                {data.tradeCount} trades
              </span>
            )}
            <button
              onClick={fetchActivity}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-card-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-inset disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface py-16 text-center shadow-sm">
          <Radio className="mb-4 h-12 w-12 text-danger" />
          <h3 className="text-lg font-semibold text-foreground">
            Failed to load activity
          </h3>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <button
            onClick={fetchActivity}
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
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-24 animate-pulse rounded bg-surface-inset" />
                <div className="h-4 w-48 animate-pulse rounded bg-surface-inset" />
                <div className="h-4 w-16 animate-pulse rounded bg-surface-inset" />
                <div className="ml-auto h-4 w-16 animate-pulse rounded bg-surface-inset" />
                <div className="h-4 w-16 animate-pulse rounded bg-surface-inset" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trades Table */}
      {!loading && !error && data && (
        <div className="rounded-2xl bg-surface shadow-sm">
          <div className="border-b border-card-border px-6 py-4">
            <h3 className="text-base font-semibold text-foreground">
              Recent Trades
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-xs font-medium uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-4 py-4">Market</th>
                  <th className="px-4 py-4">Side</th>
                  <th className="px-4 py-4 text-right">Price</th>
                  <th className="px-4 py-4 text-right">Size</th>
                  <th className="px-4 py-4">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {data.trades.map((trade, i) => (
                  <tr
                    key={i}
                    className="text-foreground transition-colors hover:bg-surface-inset"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-muted">
                      {new Date(trade.timestamp).toLocaleString()}
                    </td>
                    <td className="max-w-[300px] truncate px-4 py-4 font-medium">
                      {trade.market}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          trade.side === "Yes" || trade.side === "Buy"
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-danger"
                        }`}
                      >
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono">
                      {trade.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      ${trade.size.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-muted">
                        {trade.outcome || "--"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty Trades */}
          {data.trades.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Radio className="mb-4 h-10 w-10 text-muted" />
              <p className="text-sm text-muted">No trades found for this wallet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
