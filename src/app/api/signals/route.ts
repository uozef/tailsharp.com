import { type NextRequest } from "next/server";
import { getSignals, generateSignals, autoAllocateSignals } from "@/lib/news-monitor";
import { initSchema } from "@/lib/intel-schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const signals = await getSignals(status);
    return Response.json(Array.isArray(signals) ? signals : []);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initSchema();

    const body = await request.json().catch(() => ({}));
    const bankroll = Number((body as any)?.bankroll) || 10000;

    // 1. Scan markets and generate signals
    const newSignals = await generateSignals();

    // 2. Smart auto-allocate: rank by edge × resolution speed
    const allocated = await autoAllocateSignals(bankroll);

    return Response.json({
      success: true,
      signals_generated: newSignals.length,
      allocated: allocated.length,
      total_allocated: allocated.reduce((s: number, a: any) => s + (a.allocatedSize || 0), 0),
      signals: allocated,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
