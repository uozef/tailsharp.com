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

export async function POST(request: Request) {
  try {
    const { wallet } = await request.json();
    if (!wallet) {
      return NextResponse.json(
        { error: "wallet is required" },
        { status: 400 }
      );
    }

    // Check if already running
    const existing = db
      .prepare("SELECT * FROM ingestion_jobs WHERE wallet = ?")
      .get(wallet) as IngestionJob | undefined;

    if (existing?.status === "running") {
      return NextResponse.json({ message: "Already running", ...existing });
    }

    // Mark as running
    db.prepare(
      `
      INSERT INTO ingestion_jobs (wallet, status, started_at, updated_at)
      VALUES (?, 'running', datetime('now'), datetime('now'))
      ON CONFLICT(wallet) DO UPDATE SET
        status = 'running',
        current_page = 0,
        total_fetched = CASE WHEN ingestion_jobs.status = 'complete' THEN ingestion_jobs.total_fetched ELSE 0 END,
        started_at = datetime('now'),
        updated_at = datetime('now'),
        error = NULL
    `
    ).run(wallet);

    // Start fetching in background (don't await)
    ingestWalletData(wallet).catch((err) => {
      db.prepare(
        "UPDATE ingestion_jobs SET status = 'error', error = ?, updated_at = datetime('now') WHERE wallet = ?"
      ).run(err.message, wallet);
    });

    return NextResponse.json({ status: "started", wallet });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const jobs = db
      .prepare(
        "SELECT * FROM ingestion_jobs ORDER BY updated_at DESC LIMIT 50"
      )
      .all() as IngestionJob[];

    return NextResponse.json(jobs);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function ingestWalletData(wallet: string) {
  const DATA_API = "https://data-api.polymarket.com";

  // 1. Fetch positions (for accurate PnL/stats)
  let posArray: Array<{
    initialValue?: number;
    cashPnl?: number;
    redeemable?: boolean;
    currentValue?: number;
  }> = [];
  try {
    const posRes = await fetch(
      `${DATA_API}/positions?user=${wallet}&sizeThreshold=0`
    );
    if (posRes.ok) {
      const positions = await posRes.json();
      posArray = Array.isArray(positions) ? positions : [];
    }
  } catch {
    // positions fetch failed, continue without
  }

  const totalInvested = posArray.reduce(
    (s, p) => s + (p.initialValue || 0),
    0
  );
  const totalPnl = posArray.reduce((s, p) => s + (p.cashPnl || 0), 0);

  // Upsert leader
  db.prepare(
    `
    INSERT INTO leaders (proxy_wallet, volume, pnl, last_synced)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(proxy_wallet) DO UPDATE SET
      volume = excluded.volume,
      pnl = excluded.pnl,
      last_synced = datetime('now')
  `
  ).run(wallet, totalInvested, totalPnl);

  // 2. Check what we already have (for gap fill)
  const existingJob = db
    .prepare("SELECT newest_timestamp FROM ingestion_jobs WHERE wallet = ?")
    .get(wallet) as { newest_timestamp: number } | undefined;
  const newestExisting = existingJob?.newest_timestamp || 0;

  // 3. Paginate activity
  let page = 0;
  let totalFetched = 0;
  let hasMore = true;
  let newestTs = newestExisting;
  let oldestTs = Infinity;

  const insertTrade = db.prepare(`
    INSERT OR IGNORE INTO leader_trades
      (proxy_wallet, timestamp, condition_id, type, size, usdc_size, price, side, outcome_index, outcome, title, slug, transaction_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  while (hasMore && page < 200) {
    const offset = page * 500;
    try {
      const res = await fetch(
        `${DATA_API}/activity?user=${wallet}&limit=500&offset=${offset}`
      );
      if (!res.ok) break;
      const batch = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) {
        hasMore = false;
        break;
      }

      // Insert trades in a transaction
      const insertBatch = db.transaction(
        (
          trades: Array<{
            timestamp: number;
            conditionId: string;
            type: string;
            size: number;
            usdcSize: number;
            price: number;
            side: string;
            outcomeIndex: number;
            outcome: string;
            title: string;
            slug: string;
            transactionHash: string;
          }>
        ) => {
          for (const t of trades) {
            insertTrade.run(
              wallet,
              t.timestamp,
              t.conditionId,
              t.type,
              t.size,
              t.usdcSize,
              t.price,
              t.side,
              t.outcomeIndex,
              t.outcome,
              t.title,
              t.slug,
              t.transactionHash
            );
            if (t.timestamp > newestTs) newestTs = t.timestamp;
            if (t.timestamp < oldestTs) oldestTs = t.timestamp;
          }
        }
      );
      insertBatch(batch);

      totalFetched += batch.length;
      page++;

      // Update progress
      db.prepare(
        `
        UPDATE ingestion_jobs SET
          current_page = ?, total_fetched = ?, newest_timestamp = ?,
          last_timestamp = ?, updated_at = datetime('now')
        WHERE wallet = ?
      `
      ).run(
        page,
        totalFetched,
        newestTs,
        oldestTs === Infinity ? 0 : oldestTs,
        wallet
      );

      if (batch.length < 500) hasMore = false;

      // If doing gap fill and we've reached existing data, stop
      if (
        newestExisting > 0 &&
        batch.some(
          (t: { timestamp: number }) => t.timestamp <= newestExisting
        )
      ) {
        hasMore = false;
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 150));
    } catch {
      break;
    }
  }

  // 4. Mark complete
  db.prepare(
    `
    UPDATE ingestion_jobs SET
      status = 'complete', total_fetched = ?, total_pages = ?,
      newest_timestamp = ?, last_timestamp = ?,
      completed_at = datetime('now'), updated_at = datetime('now')
    WHERE wallet = ?
  `
  ).run(
    totalFetched,
    page,
    newestTs,
    oldestTs === Infinity ? 0 : oldestTs,
    wallet
  );
}
