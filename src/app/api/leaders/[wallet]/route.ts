import { NextResponse } from "next/server";
import { getLeaderByWallet, getLeaderTrades } from "@/lib/db-queries";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const leader = getLeaderByWallet(wallet);
    if (!leader) {
      return NextResponse.json({ error: "Leader not found" }, { status: 404 });
    }
    const trades = getLeaderTrades(wallet, 100);
    return NextResponse.json({ leader, trades });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
