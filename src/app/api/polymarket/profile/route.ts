import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DATA_API = "https://data-api.polymarket.com";

/** Fetch complete wallet profile from multiple Polymarket data sources */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    if (!wallet)
      return NextResponse.json({ error: "wallet required" }, { status: 400 });

    // Fetch all data sources in parallel
    const [lbRes, posRes, valRes, actRes1, actRes2] = await Promise.all([
      fetch(`${DATA_API}/v1/leaderboard?limit=500`).catch(() => null),
      fetch(`${DATA_API}/positions?user=${wallet}&sizeThreshold=0`).catch(() => null),
      fetch(`${DATA_API}/value?user=${wallet}`).catch(() => null),
      fetch(`${DATA_API}/activity?user=${wallet}&limit=500&offset=0`).catch(() => null),
      fetch(`${DATA_API}/activity?user=${wallet}&limit=500&offset=500`).catch(() => null),
    ]);

    const leaderboard = lbRes?.ok ? await lbRes.json() : [];
    const positions = posRes?.ok ? await posRes.json() : [];
    const valueData = valRes?.ok ? await valRes.json() : [];
    const act1 = actRes1?.ok ? await actRes1.json() : [];
    const act2 = actRes2?.ok ? await actRes2.json() : [];
    const activity = [
      ...(Array.isArray(act1) ? act1 : []),
      ...(Array.isArray(act2) ? act2 : []),
    ];

    // Find in leaderboard
    const lbMatch = Array.isArray(leaderboard)
      ? leaderboard.find(
          (e: any) => e.proxyWallet?.toLowerCase() === wallet.toLowerCase()
        )
      : null;

    // Positions data (only shows current/unredeemed — NOT full history)
    const posArray = Array.isArray(positions) ? positions : [];
    const openPositions = posArray.filter(
      (p: any) => !p.redeemable && p.currentValue > 0 && p.curPrice > 0 && p.curPrice < 1
    );
    const posInvested = posArray.reduce((s: number, p: any) => s + (p.initialValue || 0), 0);
    const posPnl = posArray.reduce((s: number, p: any) => s + (p.cashPnl || 0), 0);
    const posCurrentValue = posArray.reduce((s: number, p: any) => s + (p.currentValue || 0), 0);

    const portfolioValue =
      Array.isArray(valueData) && valueData.length > 0 ? valueData[0].value || 0 : 0;

    // Activity-based stats (more complete than positions for historical view)
    const trades = activity.filter((a: any) => a.type === "TRADE");
    const buys = trades.filter((t: any) => t.side === "BUY");
    const sells = trades.filter((t: any) => t.side === "SELL");
    const totalTradeVolume = trades.reduce((s: number, t: any) => s + (t.usdcSize || 0), 0);

    // Compute win metrics from resolved positions
    const resolvedPos = posArray.filter(
      (p: any) => p.redeemable || p.curPrice === 0 || p.curPrice === 1
    );
    const visibleWinningPos = resolvedPos.filter((p: any) => (p.cashPnl || 0) > 0);

    // PRIMARY DATA SOURCES (priority order):
    // 1. Leaderboard PnL/Vol — most accurate for ranked wallets
    // 2. Activity trade volume — computed from actual trades
    // 3. Positions — only current/unredeemed, not full history
    const totalPnl = lbMatch?.pnl ?? posPnl;
    const totalVolume = lbMatch?.vol ?? totalTradeVolume;
    const roi = totalVolume > 0 ? (totalPnl / totalVolume) * 100 : 0;

    // Win rate estimation:
    // Polymarket auto-redeems winning positions — they vanish from the positions API.
    // So visible positions are biased toward losses. We estimate win rate by:
    // 1. Counting visible resolved positions (mostly losses since wins are redeemed)
    // 2. Estimating hidden (redeemed) winning positions from PnL gap
    // If leaderboard PnL > sum of visible positions PnL, the difference = redeemed wins
    const visiblePnl = posArray.reduce((s: number, p: any) => s + (p.cashPnl || 0), 0);
    const hiddenWinPnl = totalPnl - visiblePnl; // PnL from auto-redeemed winning positions
    const avgVisibleLoss = resolvedPos.length > 0
      ? Math.abs(resolvedPos.reduce((s: number, p: any) => s + Math.min(0, p.cashPnl || 0), 0) / Math.max(1, resolvedPos.length))
      : 0;
    // Estimate number of hidden wins: assume avg win size ≈ avg visible position size
    const avgPosSize = posArray.length > 0
      ? posArray.reduce((s: number, p: any) => s + (p.initialValue || 0), 0) / posArray.length
      : totalTradeVolume / Math.max(1, trades.length);
    const estimatedHiddenWins = avgPosSize > 0 ? Math.max(0, Math.round(hiddenWinPnl / avgPosSize)) : 0;
    const estimatedTotalPositions = posArray.length + estimatedHiddenWins;
    const estimatedWins = visibleWinningPos.length + estimatedHiddenWins;
    const estimatedWinRate = estimatedTotalPositions > 0
      ? Math.round((estimatedWins / estimatedTotalPositions) * 100)
      : null;

    // Market concentration
    const marketCounts: Record<string, number> = {};
    for (const t of trades) {
      const key = t.title || "Unknown";
      marketCounts[key] = (marketCounts[key] || 0) + 1;
    }
    const uniqueMarkets = Object.keys(marketCounts).length;
    const topMarkets = Object.entries(marketCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([title, count]) => ({ title, count }));

    // Trading frequency
    const timestamps = trades.map((t: any) => t.timestamp).filter(Boolean);
    let tradesPerDay = 0;
    let tradingDays = 0;
    if (timestamps.length > 1) {
      const minTs = Math.min(...timestamps);
      const maxTs = Math.max(...timestamps);
      tradingDays = Math.max(1, Math.round((maxTs - minTs) / 86400));
      tradesPerDay = timestamps.length / tradingDays;
    }

    // Avg trade size
    const avgTradeSize = trades.length > 0 ? totalTradeVolume / trades.length : 0;

    // Display name resolution
    const displayName =
      lbMatch?.userName ||
      (activity.length > 0 ? activity[0].name || activity[0].pseudonym : null) ||
      null;

    const profile = {
      wallet,
      displayName,
      profileImage: lbMatch?.profileImage || (activity.length > 0 ? activity[0].profileImage : "") || "",
      verified: lbMatch?.verifiedBadge || false,
      xUsername: lbMatch?.xUsername || "",

      // Rank (from leaderboard)
      rank: lbMatch ? parseInt(lbMatch.rank) : null,

      // Core metrics (leaderboard is source of truth when available)
      totalPnl,
      totalVolume,
      roi,

      // Portfolio snapshot
      portfolioValue,
      currentPositions: posArray.length,
      openPositions: openPositions.length,
      positionsInvested: posInvested,
      positionsCurrentValue: posCurrentValue,

      // Win rate (estimated — Polymarket auto-redeems wins, so positions API is biased)
      visiblePositions: posArray.length,
      resolvedPositions: resolvedPos.length,
      visibleWins: visibleWinningPos.length,
      estimatedHiddenWins: estimatedHiddenWins,
      estimatedTotalPositions: estimatedTotalPositions,
      winningPositions: estimatedWins,
      losingPositions: estimatedTotalPositions - estimatedWins,
      winRate: estimatedWinRate,

      // Activity stats
      totalTrades: trades.length,
      totalActivityRecords: activity.length,
      buyCount: buys.length,
      sellCount: sells.length,
      avgTradeSize,
      tradesPerDay: Math.round(tradesPerDay * 10) / 10,
      tradingDays,
      uniqueMarkets,
      topMarkets,

      // Raw data for charts
      positions: posArray,
      recentActivity: activity,
    };

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
