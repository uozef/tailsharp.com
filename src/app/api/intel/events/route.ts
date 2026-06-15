import { type NextRequest } from "next/server";
import pool from "@/lib/mysql";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const category = sp.get("category");
    const region = sp.get("region");
    const macro = sp.get("macro");
    const search = sp.get("search");
    const limit = Math.min(parseInt(sp.get("limit") || "50", 10) || 50, 200);
    const sort = sp.get("sort") || "volume";

    const conditions: string[] = [];
    const params: any[] = [];

    if (category) {
      conditions.push("e.category = ?");
      params.push(category);
    }
    if (region) {
      conditions.push("e.region = ?");
      params.push(region);
    }
    if (macro) {
      conditions.push("e.macro_impact = ?");
      params.push(macro);
    }
    if (search) {
      conditions.push("(e.title LIKE ? OR e.description LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderBy: string;
    switch (sort) {
      case "probability":
        orderBy = "e.volume DESC"; // proxy -- probability is per-market
        break;
      case "end_date":
        orderBy = "e.end_date ASC";
        break;
      default:
        orderBy = "e.volume DESC";
    }

    const [events] = await pool.execute(
      `SELECT e.* FROM intel_events e ${where} ORDER BY ${orderBy} LIMIT ${limit}`,
      params,
    );

    // Fetch nested markets and scenarios for each event
    const enriched = [];
    for (const ev of events as any[]) {
      const [markets] = await pool.execute(
        `SELECT * FROM intel_markets WHERE event_id = ? ORDER BY volume DESC`,
        [ev.id],
      );
      const [scenarios] = await pool.execute(
        `SELECT * FROM intel_scenarios WHERE event_id = ? ORDER BY probability DESC`,
        [ev.id],
      );
      enriched.push({
        ...ev,
        tags: typeof ev.tags === "string" ? JSON.parse(ev.tags) : ev.tags,
        markets: (markets as any[]).map(parseMarketJson),
        scenarios: (scenarios as any[]).map(parseScenarioJson),
      });
    }

    return Response.json({ events: enriched, count: enriched.length });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function parseMarketJson(m: any) {
  return {
    ...m,
    outcomes: typeof m.outcomes === "string" ? JSON.parse(m.outcomes) : m.outcomes,
    outcome_prices: typeof m.outcome_prices === "string" ? JSON.parse(m.outcome_prices) : m.outcome_prices,
  };
}

function parseScenarioJson(s: any) {
  return {
    ...s,
    macro_impacts: typeof s.macro_impacts === "string" ? JSON.parse(s.macro_impacts) : s.macro_impacts,
    chain_effects: typeof s.chain_effects === "string" ? JSON.parse(s.chain_effects) : s.chain_effects,
    fund_implications: typeof s.fund_implications === "string" ? JSON.parse(s.fund_implications) : s.fund_implications,
    region_impacts: typeof s.region_impacts === "string" ? JSON.parse(s.region_impacts) : s.region_impacts,
  };
}
