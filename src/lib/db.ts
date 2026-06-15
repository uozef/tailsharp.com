import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "tailsharp.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("busy_timeout = 5000");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS leaders (
      proxy_wallet TEXT PRIMARY KEY,
      rank INTEGER,
      username TEXT,
      x_username TEXT,
      verified_badge INTEGER DEFAULT 0,
      profile_image TEXT,
      volume REAL DEFAULT 0,
      pnl REAL DEFAULT 0,
      last_synced TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leader_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proxy_wallet TEXT NOT NULL,
      condition_id TEXT,
      title TEXT,
      slug TEXT,
      outcome TEXT,
      size REAL,
      avg_price REAL,
      current_value REAL,
      pnl REAL,
      synced_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (proxy_wallet) REFERENCES leaders(proxy_wallet)
    );

    CREATE TABLE IF NOT EXISTS leader_trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proxy_wallet TEXT NOT NULL,
      timestamp INTEGER,
      condition_id TEXT,
      type TEXT,
      size REAL,
      usdc_size REAL,
      price REAL,
      side TEXT,
      outcome_index INTEGER,
      outcome TEXT,
      title TEXT,
      slug TEXT,
      transaction_hash TEXT UNIQUE,
      synced_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (proxy_wallet) REFERENCES leaders(proxy_wallet)
    );

    CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      question TEXT,
      slug TEXT,
      condition_id TEXT,
      description TEXT,
      outcomes TEXT,
      outcome_prices TEXT,
      volume REAL,
      liquidity REAL,
      active INTEGER,
      closed INTEGER,
      end_date TEXT,
      image TEXT,
      best_bid REAL,
      best_ask REAL,
      volume_24h REAL,
      last_synced TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT,
      status TEXT,
      records_synced INTEGER,
      error TEXT,
      started_at TEXT,
      completed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ingestion_jobs (
      wallet TEXT PRIMARY KEY,
      status TEXT DEFAULT 'pending',
      total_fetched INTEGER DEFAULT 0,
      total_pages INTEGER DEFAULT 0,
      current_page INTEGER DEFAULT 0,
      last_timestamp INTEGER DEFAULT 0,
      newest_timestamp INTEGER DEFAULT 0,
      error TEXT,
      started_at TEXT,
      completed_at TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  return _db;
}

// Proxy that lazily initializes the database on first access
const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as any)[prop];
    if (typeof value === "function") return value.bind(instance);
    return value;
  },
});

export default db;
