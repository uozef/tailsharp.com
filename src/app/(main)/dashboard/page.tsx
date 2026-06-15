"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DollarSign, TrendingUp, Users, Target } from "lucide-react";
import StatCard from "@/components/StatCard";
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

export default function DashboardPage() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/polymarket/leaderboard?limit=10");
        if (!res.ok) {
          throw new Error(`Failed to fetch leaderboard (${res.status})`);
        }
        const data: LeaderEntry[] = await res.json();
        setLeaders(data);
        setFetchedAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const stats = useMemo(() => {
    if (leaders.length === 0) return null;
    const topPnl = Math.max(...leaders.map((l) => l.pnl));
    const totalVol = leaders.reduce((sum, l) => sum + l.vol, 0);
    const totalPnl = leaders.reduce((sum, l) => sum + l.pnl, 0);
    const avgRoi = totalVol > 0 ? (totalPnl / totalVol) * 100 : 0;
    return { topPnl, totalVol, avgRoi };
  }, [leaders]);

  const chartData = useMemo(() => {
    return leaders.map((l) => ({
      name: l.userName || l.proxyWallet.slice(0, 6),
      pnl: l.pnl,
    }));
  }, [leaders]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <span className="text-sm text-muted">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-2xl border border-danger/30 bg-surface p-8 text-center">
          <p className="text-lg font-semibold text-danger">
            Failed to load data
          </p>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
        {fetchedAt && <Timestamp date={fetchedAt} />}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Leaders Tracked"
          value={leaders.length}
          subtitle="From leaderboard"
          trend="neutral"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Top PnL"
          value={`$${(stats?.topPnl ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtitle="Highest single leader"
          trend="up"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Total Volume"
          value={`$${((stats?.totalVol ?? 0) / 1e6).toFixed(1)}M`}
          subtitle="Combined top 10"
          trend="up"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Avg ROI"
          value={`${(stats?.avgRoi ?? 0).toFixed(1)}%`}
          subtitle="Avg PnL / Volume"
          trend={
            (stats?.avgRoi ?? 0) > 0
              ? "up"
              : (stats?.avgRoi ?? 0) < 0
                ? "down"
                : "neutral"
          }
          icon={<Target className="h-5 w-5" />}
        />
      </div>

      {/* PnL Bar Chart */}
      <div className="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Top 10 Leaders by PnL
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                tickFormatter={(val: number) =>
                  val >= 1e6 || val <= -1e6
                    ? `$${(val / 1e6).toFixed(1)}M`
                    : `$${(val / 1e3).toFixed(0)}k`
                }
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--card-border)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
                cursor={{ fill: "var(--surface-inset)", opacity: 0.5 }}
                formatter={(value) => [
                  `$${Number(value).toLocaleString()}`,
                  "PnL",
                ]}
              />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]} barSize={32}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.pnl >= 0 ? "var(--gold-400)" : "var(--danger)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaders Table */}
      <div className="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Leaderboard
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="pb-3 pr-4 font-medium">Rank</th>
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 text-right font-medium">Volume</th>
                <th className="pb-3 pr-4 text-right font-medium">PnL</th>
                <th className="pb-3 text-right font-medium">ROI <span className="font-normal text-[10px] text-muted">(All-Time)</span></th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader) => {
                const roi =
                  leader.vol > 0
                    ? ((leader.pnl / leader.vol) * 100).toFixed(1)
                    : "0.0";
                return (
                  <tr
                    key={leader.proxyWallet}
                    className="border-b border-card-border/50 transition-colors last:border-0 hover:bg-surface-inset cursor-pointer"
                    onClick={() => window.location.href = `/leader/${leader.proxyWallet}`}
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">
                      #{leader.rank}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {leader.profileImage && (
                          <img
                            src={leader.profileImage}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                        )}
                        <span className="font-medium text-foreground">
                          {leader.userName || leader.proxyWallet.slice(0, 8)}
                        </span>
                        {leader.verifiedBadge && (
                          <span className="text-xs text-blue-400">&#10003;</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right text-muted">
                      ${leader.vol.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-semibold ${
                        leader.pnl >= 0 ? "text-gold-500" : "text-danger"
                      }`}
                    >
                      {leader.pnl >= 0 ? "+" : ""}$
                      {Math.abs(leader.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td
                      className={`py-3 text-right font-medium ${
                        Number(roi) >= 0 ? "text-gold-500" : "text-danger"
                      }`}
                    >
                      {Number(roi) >= 0 ? "+" : ""}
                      {roi}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
