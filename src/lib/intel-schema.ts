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

const CREATE_NEWS_SOURCES = `
CREATE TABLE IF NOT EXISTS news_sources (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  url VARCHAR(500),
  type VARCHAR(50),
  category VARCHAR(100),
  reliability_score INT DEFAULT 50,
  scan_interval_sec INT DEFAULT 600,
  last_scanned TIMESTAMP NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active (active),
  INDEX idx_category (category)
)`;

const CREATE_NEWS_ITEMS = `
CREATE TABLE IF NOT EXISTS news_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  source_id BIGINT,
  title VARCHAR(1000) NOT NULL,
  content TEXT,
  url VARCHAR(1000),
  published_at TIMESTAMP NULL,
  category VARCHAR(100),
  sentiment VARCHAR(20),
  impact_score INT DEFAULT 0,
  related_markets JSON,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_source (source_id),
  INDEX idx_processed (processed),
  INDEX idx_impact (impact_score DESC),
  INDEX idx_created (created_at DESC),
  FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE SET NULL
)`;

const CREATE_TRADING_SIGNALS = `
CREATE TABLE IF NOT EXISTS trading_signals (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  news_item_id BIGINT,
  event_id VARCHAR(20),
  market_id VARCHAR(20),
  market_question VARCHAR(1000),
  direction VARCHAR(10),
  current_price DECIMAL(5,4),
  fair_value DECIMAL(5,4),
  edge DECIMAL(5,4),
  confidence INT DEFAULT 0,
  suggested_size DECIMAL(20,2),
  potential_pnl DECIMAL(20,2),
  rationale TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP NULL,
  accepted_at TIMESTAMP NULL,
  executed_at TIMESTAMP NULL,
  execution_price DECIMAL(5,4) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_confidence (confidence DESC),
  INDEX idx_created (created_at DESC),
  FOREIGN KEY (news_item_id) REFERENCES news_items(id) ON DELETE SET NULL
)`;

const CREATE_LEADS = `
CREATE TABLE IF NOT EXISTS leads (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  company VARCHAR(200),
  role VARCHAR(200),
  tier VARCHAR(50),
  message TEXT,
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created (created_at DESC)
)`;

export async function initSchema(): Promise<void> {
  const statements = [
    CREATE_INTEL_EVENTS,
    CREATE_INTEL_MARKETS,
    CREATE_INTEL_PRICE_HISTORY,
    CREATE_INTEL_SCENARIOS,
    CREATE_INTEL_SYNC_LOG,
    CREATE_NEWS_SOURCES,
    CREATE_NEWS_ITEMS,
    CREATE_TRADING_SIGNALS,
    CREATE_LEADS,
  ];

  for (const sql of statements) {
    await pool.execute(sql);
  }
}
