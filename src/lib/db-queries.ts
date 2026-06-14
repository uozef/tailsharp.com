import db from "./db";

export interface DbLeader {
  proxy_wallet: string;
  rank: number;
  username: string;
  x_username: string;
  verified_badge: number;
  profile_image: string;
  volume: number;
  pnl: number;
  last_synced: string;
  trade_count: number;
  win_rate: number;
}

export function getLeaders(limit = 50): DbLeader[] {
  return db
    .prepare(
      `
    SELECT l.*,
      COALESCE((SELECT COUNT(*) FROM leader_trades WHERE proxy_wallet = l.proxy_wallet), 0) as trade_count,
      COALESCE(
        (SELECT ROUND(
          CAST(SUM(CASE WHEN usdc_size > 0 AND side = 'BUY' THEN 1 ELSE 0 END) AS FLOAT) /
          NULLIF(COUNT(*), 0) * 100, 1
        ) FROM leader_trades WHERE proxy_wallet = l.proxy_wallet), 0
      ) as win_rate
    FROM leaders l
    ORDER BY l.rank ASC
    LIMIT ?
  `
    )
    .all(limit) as DbLeader[];
}

export function getLeaderByWallet(wallet: string): DbLeader | undefined {
  return db
    .prepare(
      `
    SELECT l.*,
      COALESCE((SELECT COUNT(*) FROM leader_trades WHERE proxy_wallet = l.proxy_wallet), 0) as trade_count,
      0 as win_rate
    FROM leaders l WHERE l.proxy_wallet = ?
  `
    )
    .get(wallet) as DbLeader | undefined;
}

export function getLeaderTrades(wallet: string, limit = 50) {
  return db
    .prepare(
      `
    SELECT * FROM leader_trades
    WHERE proxy_wallet = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `
    )
    .all(wallet, limit);
}

export function getMarkets(limit = 50) {
  return db
    .prepare(
      `
    SELECT * FROM markets
    WHERE active = 1
    ORDER BY volume DESC
    LIMIT ?
  `
    )
    .all(limit);
}

export function getMarketBySlug(slug: string) {
  return db.prepare("SELECT * FROM markets WHERE slug = ?").get(slug);
}

export function getSyncStatus() {
  return db
    .prepare(
      `
    SELECT entity, status, records_synced, error, completed_at
    FROM sync_log
    ORDER BY completed_at DESC
    LIMIT 10
  `
    )
    .all();
}

export function getLeaderCount(): number {
  return (db.prepare("SELECT COUNT(*) as count FROM leaders").get() as any)
    .count;
}

export function getTradeCount(): number {
  return (
    db.prepare("SELECT COUNT(*) as count FROM leader_trades").get() as any
  ).count;
}

export function getLastSyncTime(): string | null {
  const row = db
    .prepare(
      "SELECT MAX(completed_at) as last FROM sync_log WHERE status = 'success'"
    )
    .get() as any;
  return row?.last || null;
}
