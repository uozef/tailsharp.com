import { type NextRequest } from "next/server";
import pool from "@/lib/mysql";
import { checkSignalViability, executeSignal } from "@/lib/news-monitor";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const signalId = parseInt(id, 10);
    if (isNaN(signalId)) {
      return Response.json({ error: "Invalid signal ID" }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action as string;

    if (!action || !["accept", "reject", "execute"].includes(action)) {
      return Response.json(
        { error: "Invalid action. Must be accept, reject, or execute." },
        { status: 400 },
      );
    }

    // Verify signal exists
    const [rows] = await pool.execute(
      `SELECT * FROM trading_signals WHERE id = ?`,
      [signalId],
    );
    if ((rows as any[]).length === 0) {
      return Response.json({ error: "Signal not found" }, { status: 404 });
    }

    if (action === "accept") {
      await pool.execute(
        `UPDATE trading_signals SET status = 'accepted', accepted_at = NOW() WHERE id = ?`,
        [signalId],
      );
      return Response.json({ success: true, status: "accepted" });
    }

    if (action === "reject") {
      await pool.execute(
        `UPDATE trading_signals SET status = 'rejected' WHERE id = ?`,
        [signalId],
      );
      return Response.json({ success: true, status: "rejected" });
    }

    // action === "execute"
    const viability = await checkSignalViability(signalId);
    if (!viability.viable) {
      return Response.json({
        success: false,
        error: "Signal is no longer viable",
        currentPrice: viability.currentPrice,
        remainingEdge: viability.remainingEdge,
      });
    }

    const result = await executeSignal(signalId);
    return Response.json({
      success: result.success,
      executionPrice: result.executionPrice,
      error: result.error,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
