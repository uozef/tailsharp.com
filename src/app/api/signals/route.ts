import { type NextRequest } from "next/server";
import { getSignals, generateSignals } from "@/lib/news-monitor";
import { initSchema } from "@/lib/intel-schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const signals = await getSignals(status);
    return Response.json({ signals });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    await initSchema();
    const signals = await generateSignals();
    return Response.json({
      success: true,
      signals_generated: signals.length,
      signals,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
