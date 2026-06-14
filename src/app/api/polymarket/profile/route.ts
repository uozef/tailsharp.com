import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DATA_API = "https://data-api.polymarket.com";

/** Fetch complete wallet profile: leaderboard rank, positions, value, and activity */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    if (!wallet)
      return NextResponse.json({ error: "wallet required" }, { status: 400 });

    // Fetch all data sources in parallel
    const [lbRes, posRes, valRes, actRes] = await Promise.all([
      fetch(`${DATA_API}/v1/leaderboard?limit=500`).catch(() => null),
      fetch(`${DATA_API}/positions?user=${wallet}&sizeThreshold=0`).catch(() => null),
      fetch(`${DATA_API}/value?user=${wallet}`).catch(() => null),
      fetch(`${DATA_API}/activity?user=${wallet}&limit=500&offset=0`).catch(() => null),
    ]);

    // Parse responses
    const leaderboard = lbRes?.ok ? await lbRes.json() : [];
    const positions = posRes?.ok ? await posRes.json() : [];
    const valueData = valRes?.ok ? await valRes.json() : [];
    const activity = actRes?.ok ? await actRes.json() : [];

    // Find rank
    const lbMatch = Array.isArray(leaderboard)
      ? leaderboard.find(
          (e: any) => e.proxyWallet?.toLowerCase() === wallet.toLowerCase()
        )
      : null;

    // Compute aggregates from positions (the source of truth)
    const posArray = Array.isArray(positions) ? positions : [];
    const totalInvested = posArray.reduce(
      (s: number, p: any) => s + (p.initialValue || 0),
      0
    );
    const totalCurrentValue = posArray.reduce(
      (s: number, p: any) => s + (p.currentValue || 0),
      0
    );
    const totalCashPnl = posArray.reduce(
      (s: number, p: any) => s + (p.cashPnl || 0),
      0
    );
    const totalVolume = posArray.reduce(
      (s: number, p: any) => s + (p.totalBought || 0) * (p.avgPrice || 0),
      0
    );

    const winningPositions = posArray.filter((p: any) => (p.cashPnl || 0) > 0);
    const losingPositions = posArray.filter((p: any) => (p.cashPnl || 0) < 0);
    const resolvedPositions = posArray.filter(
      (p: any) => p.redeemable || p.currentValue === 0 || p.curPrice === 0 || p.curPrice === 1
    );
    const openPositions = posArray.filter(
      (p: any) => !p.redeemable && p.currentValue > 0 && p.curPrice > 0 && p.curPrice < 1
    );

    const portfolioValue =
      Array.isArray(valueData) && valueData.length > 0
        ? valueData[0].value || 0
        : 0;

    // Activity stats
    const actArray = Array.isArray(activity) ? activity : [];
    const trades = actArray.filter((a: any) => a.type === "TRADE");

    const profile = {
      wallet,
      displayName:
        lbMatch?.userName ||
        (actArray.length > 0 ? actArray[0].name || actArray[0].pseudonym : null) ||
        null,
      profileImage: lbMatch?.profileImage || (actArray.length > 0 ? actArray[0].profileImage : "") || "",
      verified: lbMatch?.verifiedBadge || false,
      xUsername: lbMatch?.xUsername || "",

      // Rank
      rank: lbMatch ? parseInt(lbMatch.rank) : null,
      leaderboardPnl: lbMatch?.pnl || null,
      leaderboardVol: lbMatch?.vol || null,

      // Portfolio (from positions API — accurate)
      totalPositions: posArray.length,
      openPositions: openPositions.length,
      resolvedPositions: resolvedPositions.length,
      winningPositions: winningPositions.length,
      losingPositions: losingPositions.length,
      totalInvested,
      totalCurrentValue,
      totalCashPnl,
      portfolioValue,
      winRate:
        resolvedPositions.length > 0
          ? Math.round(
              (winningPositions.length / resolvedPositions.length) * 100
            )
          : null,
      roi: totalInvested > 0 ? (totalCashPnl / totalInvested) * 100 : 0,

      // Activity summary
      totalTrades: trades.length,
      totalActivityRecords: actArray.length,

      // Raw data for charts
      positions: posArray.slice(0, 200), // top 200 positions
      recentActivity: actArray.slice(0, 200), // recent 200 trades
    };

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
