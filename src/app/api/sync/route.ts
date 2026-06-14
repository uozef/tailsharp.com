import { NextResponse } from "next/server";
import { syncAll, syncLeaderboard, syncMarkets, syncLeaderTrades } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = (body as any)?.type || "all";
    const wallet = (body as any)?.wallet;

    let result;
    if (type === "wallet" && wallet) {
      // Sync a specific wallet's trades and save to DB
      result = await syncLeaderTrades(wallet);
    } else if (type === "leaderboard") {
      result = await syncLeaderboard();
    } else if (type === "markets") {
      result = await syncMarkets();
    } else {
      result = await syncAll();
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Quick sync status
  try {
    const { getSyncStatus, getLeaderCount, getTradeCount, getLastSyncTime } =
      await import("@/lib/db-queries");
    return NextResponse.json({
      leaders: getLeaderCount(),
      trades: getTradeCount(),
      lastSync: getLastSyncTime(),
      recentSyncs: getSyncStatus(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
