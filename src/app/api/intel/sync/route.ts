import { type NextRequest } from "next/server";
import { initSchema } from "@/lib/intel-schema";
import { syncAll } from "@/lib/intel-sync";
import pool from "@/lib/mysql";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest) {
  try {
    // Ensure tables exist
    await initSchema();

    const result = await syncAll();
    return Response.json({ success: true, result });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM intel_sync_log ORDER BY completed_at DESC LIMIT 10`,
    );
    const [eventCount] = await pool.execute(
      `SELECT COUNT(*) AS count FROM intel_events`,
    );
    const [marketCount] = await pool.execute(
      `SELECT COUNT(*) AS count FROM intel_markets`,
    );
    const [scenarioCount] = await pool.execute(
      `SELECT COUNT(*) AS count FROM intel_scenarios`,
    );

    return Response.json({
      events: (eventCount as any[])[0]?.count ?? 0,
      markets: (marketCount as any[])[0]?.count ?? 0,
      scenarios: (scenarioCount as any[])[0]?.count ?? 0,
      recentSyncs: rows,
    });
  } catch (error: any) {
    // Tables may not exist yet
    return Response.json({
      events: 0,
      markets: 0,
      scenarios: 0,
      recentSyncs: [],
      note: "Schema not initialised. POST to /api/intel/sync to run first sync.",
    });
  }
}
