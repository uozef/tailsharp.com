import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

interface IngestionJob {
  wallet: string;
  status: string;
  total_fetched: number;
  total_pages: number;
  current_page: number;
  last_timestamp: number;
  newest_timestamp: number;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const job = db
      .prepare("SELECT * FROM ingestion_jobs WHERE wallet = ?")
      .get(wallet) as IngestionJob | undefined;

    if (!job) {
      return NextResponse.json({ status: "not_started" });
    }

    const percentComplete =
      job.status === "complete"
        ? 100
        : job.total_pages > 0
          ? Math.round((job.current_page / job.total_pages) * 100)
          : job.current_page > 0
            ? Math.min(job.current_page * 5, 95)
            : 0;

    return NextResponse.json({
      ...job,
      percentComplete,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
