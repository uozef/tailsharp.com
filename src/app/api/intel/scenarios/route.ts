import { type NextRequest } from "next/server";
import pool from "@/lib/mysql";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const eventId = sp.get("event_id");

    if (!eventId) {
      return Response.json(
        { error: "Missing required parameter: event_id" },
        { status: 400 },
      );
    }

    const [rows] = await pool.execute(
      `SELECT * FROM intel_scenarios WHERE event_id = ? ORDER BY probability DESC`,
      [eventId],
    );

    const scenarios = (rows as any[]).map((s) => ({
      ...s,
      macro_impacts: typeof s.macro_impacts === "string" ? JSON.parse(s.macro_impacts) : s.macro_impacts,
      chain_effects: typeof s.chain_effects === "string" ? JSON.parse(s.chain_effects) : s.chain_effects,
      fund_implications: typeof s.fund_implications === "string" ? JSON.parse(s.fund_implications) : s.fund_implications,
      region_impacts: typeof s.region_impacts === "string" ? JSON.parse(s.region_impacts) : s.region_impacts,
    }));

    return Response.json({ event_id: eventId, scenarios });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
