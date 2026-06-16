import pool from "./mysql";

const GAMMA_API = "https://gamma-api.polymarket.com";

// ---------------------------------------------------------------------------
// Default news sources
// ---------------------------------------------------------------------------

const DEFAULT_SOURCES = [
  { name: "Reuters", url: "https://www.reuters.com", type: "rss", category: "geopolitics", reliability: 90 },
  { name: "AP News", url: "https://apnews.com", type: "rss", category: "politics", reliability: 90 },
  { name: "Bloomberg", url: "https://bloomberg.com", type: "website", category: "economics", reliability: 85 },
  { name: "Federal Reserve", url: "https://federalreserve.gov", type: "api", category: "economics", reliability: 95 },
  { name: "ESPN", url: "https://espn.com", type: "rss", category: "sports", reliability: 85 },
  { name: "CoinDesk", url: "https://coindesk.com", type: "rss", category: "crypto", reliability: 75 },
  { name: "The Block", url: "https://theblock.co", type: "rss", category: "crypto", reliability: 75 },
  { name: "Polymarket Twitter", url: "https://x.com/Polymarket", type: "twitter", category: "general", reliability: 70 },
  { name: "Nate Silver", url: "https://x.com/NateSilver538", type: "twitter", category: "politics", reliability: 80 },
  { name: "WSJ", url: "https://wsj.com", type: "website", category: "economics", reliability: 88 },
  { name: "BBC News", url: "https://bbc.com/news", type: "rss", category: "geopolitics", reliability: 85 },
  { name: "RBA (Reserve Bank AU)", url: "https://rba.gov.au", type: "api", category: "economics", reliability: 95 },
  { name: "ASX Announcements", url: "https://asx.com.au", type: "api", category: "economics", reliability: 90 },
  { name: "White House", url: "https://whitehouse.gov", type: "website", category: "politics", reliability: 90 },
  { name: "UFC Official", url: "https://ufc.com", type: "website", category: "sports", reliability: 85 },
];

export async function seedSources(): Promise<number> {
  let count = 0;
  for (const s of DEFAULT_SOURCES) {
    await pool.execute(
      `INSERT IGNORE INTO news_sources (name, url, type, category, reliability_score) VALUES (?, ?, ?, ?, ?)`,
      [s.name, s.url, s.type, s.category, s.reliability],
    );
    count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SensitiveMarket {
  market_id: string;
  question: string;
  category: string;
  volume: number;
  end_date: string | null;
  current_price: number;
  event_id: string;
}

interface NewsItem {
  id: number;
  source_id: number | null;
  title: string;
  content: string | null;
  sentiment: string;
  impact_score: number;
  category: string | null;
  related_markets: any;
}

interface TradingSignal {
  id: number;
  news_item_id: number | null;
  event_id: string;
  market_id: string;
  market_question: string;
  direction: string;
  current_price: number;
  fair_value: number;
  edge: number;
  confidence: number;
  suggested_size: number;
  potential_pnl: number;
  rationale: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

const NEWS_SENSITIVE_CATEGORIES = ["politics", "economics", "geopolitics", "crypto"];

/**
 * Query intel_markets for active markets that are high-volume, not resolved,
 * close to resolution, and in news-sensitive categories.
 */
export async function identifySensitiveMarkets(): Promise<SensitiveMarket[]> {
  const [rows] = await pool.execute(
    `SELECT
       m.id AS market_id,
       m.question,
       e.category,
       m.volume,
       m.end_date,
       m.outcome_prices,
       m.event_id
     FROM intel_markets m
     JOIN intel_events e ON m.event_id = e.id
     WHERE m.active = true
       AND m.closed = false
       AND m.volume > 100000
       AND m.end_date IS NOT NULL
       AND m.end_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)
       AND e.category IN (?, ?, ?, ?)
     ORDER BY m.volume DESC
     LIMIT 50`,
    NEWS_SENSITIVE_CATEGORIES,
  );

  return (rows as any[]).map((r) => {
    let prices: string[];
    try {
      prices = typeof r.outcome_prices === "string" ? JSON.parse(r.outcome_prices) : (r.outcome_prices ?? []);
    } catch {
      prices = [];
    }
    return {
      market_id: r.market_id,
      question: r.question,
      category: r.category,
      volume: Number(r.volume),
      end_date: r.end_date,
      current_price: parseFloat(prices[0]) || 0.5,
      event_id: r.event_id,
    };
  });
}

/**
 * For a given market, detect price movements and generate news items.
 * Since we cannot scrape RSS/news in real-time, we detect movements via
 * the Polymarket API and store synthetic news items.
 */
export async function scanNewsForMarket(market: SensitiveMarket): Promise<NewsItem | null> {
  // Fetch the latest price from Polymarket
  let livePrice: number | null = null;
  try {
    const res = await fetch(`${GAMMA_API}/markets/${market.market_id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      let prices: string[];
      try {
        prices = typeof data.outcomePrices === "string" ? JSON.parse(data.outcomePrices) : (data.outcomePrices ?? []);
      } catch {
        prices = [];
      }
      livePrice = parseFloat(prices[0]) || null;
    }
  } catch {
    // API unavailable — fall through
  }

  if (livePrice === null) return null;

  // Compare to stored price
  const priceDelta = livePrice - market.current_price;
  const pctChange = market.current_price > 0 ? Math.abs(priceDelta / market.current_price) : 0;

  // Only flag movements > 5%
  if (pctChange < 0.05) return null;

  const direction = priceDelta > 0 ? "up" : "down";
  const sentiment = priceDelta > 0 ? "bullish" : "bearish";
  const impactScore = Math.min(100, Math.round(pctChange * 200));

  const title = `Price movement detected: "${market.question}" moved ${direction} ${(pctChange * 100).toFixed(1)}%`;
  const content = `Market "${market.question}" (${market.market_id}) moved from ${market.current_price.toFixed(4)} to ${livePrice.toFixed(4)} (${direction} ${(pctChange * 100).toFixed(1)}%). This suggests news-driven activity in the ${market.category} category.`;

  const relatedMarkets = JSON.stringify([
    {
      market_id: market.market_id,
      event_id: market.event_id,
      direction: sentiment,
      confidence: impactScore,
    },
  ]);

  const [result] = await pool.execute(
    `INSERT INTO news_items (title, content, published_at, category, sentiment, impact_score, related_markets, processed)
     VALUES (?, ?, NOW(), ?, ?, ?, ?, false)`,
    [title, content, market.category, sentiment, impactScore, relatedMarkets],
  );

  const insertId = (result as any).insertId;

  return {
    id: insertId,
    source_id: null,
    title,
    content,
    sentiment,
    impact_score: impactScore,
    category: market.category,
    related_markets: relatedMarkets,
  };
}

/**
 * Compare current price to fair value estimated from news sentiment.
 * If edge > 5%, generate a trading signal.
 */
export async function detectMispricing(
  market: SensitiveMarket,
  newsItem: NewsItem,
  livePrice?: number,
): Promise<TradingSignal | null> {
  // Use live price if provided, otherwise fetch
  let currentPrice = livePrice;
  if (currentPrice === undefined) {
    try {
      const res = await fetch(`${GAMMA_API}/markets/${market.market_id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        let prices: string[];
        try {
          prices = typeof data.outcomePrices === "string" ? JSON.parse(data.outcomePrices) : (data.outcomePrices ?? []);
        } catch {
          prices = [];
        }
        currentPrice = parseFloat(prices[0]) || undefined;
      }
    } catch {
      // fall through
    }
  }

  if (currentPrice === undefined) return null;

  // Fair value estimation
  let fairValue: number;
  const impactAdj = newsItem.impact_score / 200;

  if (newsItem.sentiment === "bullish") {
    fairValue = currentPrice < 0.5
      ? currentPrice + impactAdj
      : Math.min(0.99, currentPrice + impactAdj * 0.5);
  } else if (newsItem.sentiment === "bearish") {
    fairValue = currentPrice > 0.5
      ? currentPrice - impactAdj
      : Math.max(0.01, currentPrice - impactAdj * 0.5);
  } else {
    fairValue = currentPrice;
  }

  // Clamp
  fairValue = Math.max(0.01, Math.min(0.99, fairValue));

  const edge = fairValue - currentPrice;

  // Need at least 5% edge
  if (Math.abs(edge) < 0.05) return null;

  const direction = edge > 0 ? "YES" : "NO";
  const confidence = Math.min(100, Math.round(Math.abs(edge) * 200 + newsItem.impact_score * 0.3));
  const suggestedSize = Math.round(Math.abs(edge) * 1000 * 100) / 100; // rough sizing
  const potentialPnl = Math.round(suggestedSize * Math.abs(edge) * 100) / 100;

  const rationale = `${newsItem.sentiment === "bullish" ? "Bullish" : "Bearish"} signal on "${market.question}". ` +
    `News impact score: ${newsItem.impact_score}/100. ` +
    `Current price: ${currentPrice.toFixed(4)}, estimated fair value: ${fairValue.toFixed(4)}, edge: ${(Math.abs(edge) * 100).toFixed(1)}%. ` +
    `Category: ${market.category}.`;

  // Expiry: 30 minutes from now
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const [result] = await pool.execute(
    `INSERT INTO trading_signals
       (news_item_id, event_id, market_id, market_question, direction, current_price, fair_value, edge, confidence, suggested_size, potential_pnl, rationale, status, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      newsItem.id,
      market.event_id,
      market.market_id,
      market.question,
      direction,
      currentPrice,
      fairValue,
      edge,
      confidence,
      suggestedSize,
      potentialPnl,
      rationale,
      expiresAt,
    ],
  );

  const insertId = (result as any).insertId;

  // Mark news item as processed
  await pool.execute(`UPDATE news_items SET processed = true WHERE id = ?`, [newsItem.id]);

  return {
    id: insertId,
    news_item_id: newsItem.id,
    event_id: market.event_id,
    market_id: market.market_id,
    market_question: market.question,
    direction,
    current_price: currentPrice,
    fair_value: fairValue,
    edge,
    confidence,
    suggested_size: suggestedSize,
    potential_pnl: potentialPnl,
    rationale,
    status: "pending",
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
  };
}

/**
 * Master function: scan sensitive markets, detect price movements,
 * generate news items, and produce trading signals.
 */
export async function generateSignals(): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];

  // Expire old pending signals
  await pool.execute(
    `UPDATE trading_signals SET status = 'expired' WHERE status = 'pending' AND expires_at < NOW()`,
  );

  // Seed sources if empty
  const [srcCount] = await pool.execute(`SELECT COUNT(*) AS cnt FROM news_sources`);
  if ((srcCount as any[])[0]?.cnt === 0) {
    await seedSources();
  }

  const markets = await identifySensitiveMarkets();

  for (const market of markets) {
    try {
      const newsItem = await scanNewsForMarket(market);
      if (!newsItem) continue;

      const signal = await detectMispricing(market, newsItem);
      if (signal) {
        signals.push(signal);
      }
    } catch {
      // Skip individual market errors
    }
  }

  return signals;
}

/**
 * Re-check a signal's viability before execution.
 */
export async function checkSignalViability(
  signalId: number,
): Promise<{ viable: boolean; currentPrice: number | null; remainingEdge: number | null }> {
  const [rows] = await pool.execute(
    `SELECT * FROM trading_signals WHERE id = ?`,
    [signalId],
  );
  const signals = rows as any[];
  if (signals.length === 0) {
    return { viable: false, currentPrice: null, remainingEdge: null };
  }

  const signal = signals[0];

  if (signal.status !== "pending" && signal.status !== "accepted") {
    return { viable: false, currentPrice: null, remainingEdge: null };
  }

  // Check expiry
  if (signal.expires_at && new Date(signal.expires_at) < new Date()) {
    await pool.execute(`UPDATE trading_signals SET status = 'expired' WHERE id = ?`, [signalId]);
    return { viable: false, currentPrice: null, remainingEdge: null };
  }

  // Fetch current price
  let currentPrice: number | null = null;
  try {
    const res = await fetch(`${GAMMA_API}/markets/${signal.market_id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      let prices: string[];
      try {
        prices = typeof data.outcomePrices === "string" ? JSON.parse(data.outcomePrices) : (data.outcomePrices ?? []);
      } catch {
        prices = [];
      }
      currentPrice = parseFloat(prices[0]) || null;
    }
  } catch {
    // API unavailable
  }

  if (currentPrice === null) {
    return { viable: false, currentPrice: null, remainingEdge: null };
  }

  const remainingEdge = signal.direction === "YES"
    ? Number(signal.fair_value) - currentPrice
    : currentPrice - Number(signal.fair_value);

  // Edge shrunk below 2% => expired
  if (remainingEdge < 0.02) {
    await pool.execute(`UPDATE trading_signals SET status = 'expired' WHERE id = ?`, [signalId]);
    return { viable: false, currentPrice, remainingEdge };
  }

  return { viable: true, currentPrice, remainingEdge };
}

/**
 * Mark a signal as executed (tracking only, no actual trades).
 */
export async function executeSignal(
  signalId: number,
): Promise<{ success: boolean; executionPrice: number | null; error?: string }> {
  const viability = await checkSignalViability(signalId);
  if (!viability.viable) {
    return { success: false, executionPrice: null, error: "Signal is no longer viable" };
  }

  await pool.execute(
    `UPDATE trading_signals SET status = 'executed', executed_at = NOW(), execution_price = ? WHERE id = ?`,
    [viability.currentPrice, signalId],
  );

  return { success: true, executionPrice: viability.currentPrice };
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export async function getSources(): Promise<any[]> {
  const [rows] = await pool.execute(`SELECT * FROM news_sources ORDER BY reliability_score DESC`);
  return rows as any[];
}

export async function getSignals(status?: string): Promise<any[]> {
  if (status) {
    const [rows] = await pool.execute(
      `SELECT * FROM trading_signals WHERE status = ? ORDER BY created_at DESC LIMIT 100`,
      [status],
    );
    return rows as any[];
  }
  const [rows] = await pool.execute(
    `SELECT * FROM trading_signals ORDER BY created_at DESC LIMIT 100`,
  );
  return rows as any[];
}

export async function getNewsItems(limit = 50): Promise<any[]> {
  const [rows] = await pool.execute(
    `SELECT * FROM news_items ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  return rows as any[];
}
