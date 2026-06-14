import { NextResponse } from "next/server";
import { getMarkets } from "@/lib/db-queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const markets = getMarkets(limit);
    return NextResponse.json(markets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
