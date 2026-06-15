import pool from "./mysql";

const CREATE_INTEL_EVENTS = `
CREATE TABLE IF NOT EXISTS intel_events (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500),
  description TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  volume DECIMAL(20,2) DEFAULT 0,
  open_interest DECIMAL(20,2) DEFAULT 0,
  start_date DATETIME,
  end_date DATETIME,
  active BOOLEAN DEFAULT true,
  closed BOOLEAN DEFAULT false,
  image VARCHAR(1000),
  tags JSON,
  macro_impact VARCHAR(50),
  region VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (active),
  INDEX idx_volume (volume DESC),
  INDEX idx_macro (macro_impact)
)`;

const CREATE_INTEL_MARKETS = `
CREATE TABLE IF NOT EXISTS intel_markets (
  id VARCHAR(20) PRIMARY KEY,
  event_id VARCHAR(20),
  question VARCHAR(1000) NOT NULL,
  slug VARCHAR(500),
  outcomes JSON,
  outcome_prices JSON,
  volume DECIMAL(20,2) DEFAULT 0,
  liquidity DECIMAL(20,2) DEFAULT 0,
  best_bid DECIMAL(5,4),
  best_ask DECIMAL(5,4),
  active BOOLEAN DEFAULT true,
  closed BOOLEAN DEFAULT false,
  end_date DATETIME,
  group_item_title VARCHAR(200),
  condition_id VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_event (event_id),
  INDEX idx_active (active),
  INDEX idx_volume (volume DESC),
  FOREIGN KEY (event_id) REFERENCES intel_events(id) ON DELETE CASCADE
)`;

const CREATE_INTEL_PRICE_HISTORY = `
CREATE TABLE IF NOT EXISTS intel_price_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  market_id VARCHAR(20) NOT NULL,
  price DECIMAL(5,4),
  timestamp DATETIME NOT NULL,
  INDEX idx_market_time (market_id, timestamp),
  FOREIGN KEY (market_id) REFERENCES intel_markets(id) ON DELETE CASCADE
)`;

const CREATE_INTEL_SCENARIOS = `
CREATE TABLE IF NOT EXISTS intel_scenarios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(20) NOT NULL,
  title VARCHAR(500),
  description TEXT,
  outcome VARCHAR(200),
  probability DECIMAL(5,4),
  macro_impacts JSON,
  chain_effects JSON,
  fund_implications JSON,
  region_impacts JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_event (event_id),
  FOREIGN KEY (event_id) REFERENCES intel_events(id) ON DELETE CASCADE
)`;

const CREATE_INTEL_SYNC_LOG = `
CREATE TABLE IF NOT EXISTS intel_sync_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sync_type VARCHAR(50),
  records_synced INT DEFAULT 0,
  status VARCHAR(20),
  error TEXT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

export async function initSchema(): Promise<void> {
  const statements = [
    CREATE_INTEL_EVENTS,
    CREATE_INTEL_MARKETS,
    CREATE_INTEL_PRICE_HISTORY,
    CREATE_INTEL_SCENARIOS,
    CREATE_INTEL_SYNC_LOG,
  ];

  for (const sql of statements) {
    await pool.execute(sql);
  }
}
