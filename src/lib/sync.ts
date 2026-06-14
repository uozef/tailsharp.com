import db from "./db";
import {
  fetchLeaderboard,
  fetchUserActivity,
  fetchMarkets,
} from "./polymarket-api";

export async function syncLeaderboard(): Promise<{
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const leaders = await fetchLeaderboard(100);

    const upsert = db.prepare(`
      INSERT INTO leaders (proxy_wallet, rank, username, x_username, verified_badge, profile_image, volume, pnl, last_synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(proxy_wallet) DO UPDATE SET
        rank = excluded.rank,
        username = excluded.username,
        x_username = excluded.x_username,
        verified_badge = excluded.verified_badge,
        profile_image = excluded.profile_image,
        volume = excluded.volume,
        pnl = excluded.pnl,
        last_synced = datetime('now')
    `);

    const insertMany = db.transaction((entries: typeof leaders) => {
      for (const entry of entries) {
        upsert.run(
          entry.proxyWallet,
          parseInt(entry.rank),
          entry.userName,
          entry.xUsername,
          entry.verifiedBadge ? 1 : 0,
          entry.profileImage,
          entry.vol,
          entry.pnl
        );
        synced++;
      }
    });

    insertMany(leaders);
  } catch (e: any) {
    errors.push(`Leaderboard: ${e.message}`);
  }

  // Log sync
  db.prepare(
    `INSERT INTO sync_log (entity, status, records_synced, error, started_at) VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(
    "leaderboard",
    errors.length ? "error" : "success",
    synced,
    errors.join("; ") || null
  );

  return { synced, errors };
}

export async function syncLeaderTrades(wallet: string): Promise<{
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const trades = await fetchUserActivity(wallet, 200);

    const upsert = db.prepare(`
      INSERT OR IGNORE INTO leader_trades
        (proxy_wallet, timestamp, condition_id, type, size, usdc_size, price, side, outcome_index, outcome, title, slug, transaction_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((entries: typeof trades) => {
      for (const t of entries) {
        try {
          upsert.run(
            t.proxyWallet,
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
          synced++;
        } catch {
          /* skip duplicates */
        }
      }
    });

    insertMany(trades);
  } catch (e: any) {
    errors.push(`Trades ${wallet}: ${e.message}`);
  }

  return { synced, errors };
}

export async function syncMarkets(): Promise<{
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const markets = await fetchMarkets(100, true);

    const upsert = db.prepare(`
      INSERT INTO markets (id, question, slug, condition_id, description, outcomes, outcome_prices, volume, liquidity, active, closed, end_date, image, best_bid, best_ask, volume_24h, last_synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        question = excluded.question,
        outcome_prices = excluded.outcome_prices,
        volume = excluded.volume,
        liquidity = excluded.liquidity,
        active = excluded.active,
        closed = excluded.closed,
        best_bid = excluded.best_bid,
        best_ask = excluded.best_ask,
        volume_24h = excluded.volume_24h,
        last_synced = datetime('now')
    `);

    const insertMany = db.transaction((entries: typeof markets) => {
      for (const m of entries) {
        upsert.run(
          m.id,
          m.question,
          m.slug,
          m.conditionId,
          m.description,
          JSON.stringify(m.outcomes),
          JSON.stringify(m.outcomePrices),
          parseFloat(m.volume) || 0,
          parseFloat(m.liquidity) || 0,
          m.active ? 1 : 0,
          m.closed ? 1 : 0,
          m.endDate,
          m.image,
          parseFloat(m.bestBid) || 0,
          parseFloat(m.bestAsk) || 0,
          parseFloat(m.volume24hr) || 0
        );
        synced++;
      }
    });

    insertMany(markets);
  } catch (e: any) {
    errors.push(`Markets: ${e.message}`);
  }

  return { synced, errors };
}

export async function syncAll(): Promise<{
  leaderboard: any;
  markets: any;
  trades: any[];
}> {
  const leaderboard = await syncLeaderboard();
  const markets = await syncMarkets();

  // Sync trades for top 25 leaders
  const topLeaders = db
    .prepare("SELECT proxy_wallet FROM leaders ORDER BY rank ASC LIMIT 25")
    .all() as { proxy_wallet: string }[];
  const trades = [];
  for (const leader of topLeaders) {
    const result = await syncLeaderTrades(leader.proxy_wallet);
    trades.push({ wallet: leader.proxy_wallet, ...result });
    // Small delay to not hammer the API
    await new Promise((r) => setTimeout(r, 200));
  }

  return { leaderboard, markets, trades };
}
