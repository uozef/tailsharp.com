import { type NextRequest } from "next/server";
import pool from "@/lib/mysql";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const id = sp.get("id");

    if (!id) {
      return Response.json(
        { error: "Missing required parameter: id" },
        { status: 400 },
      );
    }

    const [rows] = await pool.execute(
      `SELECT * FROM intel_markets WHERE id = ?`,
      [id],
    );
    const markets = rows as any[];
    if (markets.length === 0) {
      return Response.json({ error: "Market not found" }, { status: 404 });
    }

    const market = markets[0];

    // Fetch price history
    const [history] = await pool.execute(
      `SELECT price, timestamp FROM intel_price_history WHERE market_id = ? ORDER BY timestamp ASC`,
      [id],
    );

    return Response.json({
      market: {
        ...market,
        outcomes: typeof market.outcomes === "string" ? JSON.parse(market.outcomes) : market.outcomes,
        outcome_prices: typeof market.outcome_prices === "string" ? JSON.parse(market.outcome_prices) : market.outcome_prices,
      },
      price_history: history,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
