import { type NextRequest } from "next/server";
import pool from "@/lib/mysql";
import { getSources, seedSources } from "@/lib/news-monitor";
import { initSchema } from "@/lib/intel-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sources = await getSources();
    return Response.json({ sources });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initSchema();

    const body = await request.json();
    const { name, url, type, category, reliability_score } = body;

    if (!name) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }

    const [result] = await pool.execute(
      `INSERT INTO news_sources (name, url, type, category, reliability_score) VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        url || null,
        type || null,
        category || null,
        reliability_score ?? 50,
      ],
    );

    return Response.json({
      success: true,
      id: (result as any).insertId,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
