import pool from "./mysql";

const GAMMA_API = "https://gamma-api.polymarket.com";

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

const CATEGORY_RULES: [RegExp, string][] = [
  [/president|election|vote|congress|senate|governor|party|democrat|republican|parliament/i, "politics"],
  [/GDP|inflation|rate.?cut|unemployment|fed\b|reserve.?bank|CPI|trade.?war|tariff|recession|economy/i, "economics"],
  [/bitcoin|ethereum|crypto|BTC|ETH|defi|token|blockchain/i, "crypto"],
  [/war|missile|sanctions|treaty|invasion|nuclear|NATO|military/i, "geopolitics"],
  [/\bAI\b|tech|apple|google|microsoft|tesla|spacex|robot/i, "technology"],
  [/world.?cup|NBA|NFL|UFC|olympics|premier.?league|FIFA/i, "sports"],
];

export function classifyCategory(title: string, description?: string): string {
  const text = `${title} ${description || ""}`;
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(text)) return cat;
  }
  return "other";
}

export function classifyMacroImpact(category: string, volume: number): string {
  const highCats = ["politics", "economics", "geopolitics"];
  if (highCats.includes(category) && volume > 100_000) return "high";
  if (highCats.includes(category) && volume > 10_000) return "medium";
  if (volume > 100_000) return "medium";
  return "low";
}

const REGION_RULES: [RegExp, string][] = [
  [/Australia|RBA|ASX|AUD/i, "Australia"],
  [/US\b|America|Fed\b|Congress/i, "US"],
  [/EU\b|Europe|ECB/i, "EU"],
  [/China|Beijing|CCP|yuan/i, "Asia"],
  [/Japan|yen|BOJ|Tokyo/i, "Asia"],
  [/India|Mumbai|rupee/i, "Asia"],
];

export function classifyRegion(title: string, description?: string): string {
  const text = `${title} ${description || ""}`;
  for (const [re, region] of REGION_RULES) {
    if (re.test(text)) return region;
  }
  return "Global";
}

// ---------------------------------------------------------------------------
// Scenario generation (template-based)
// ---------------------------------------------------------------------------

interface ScenarioTemplate {
  macro_impacts: { factor: string; direction: string; magnitude: string; description: string }[];
  chain_effects: { event: string; probability_shift: number; description: string }[];
  fund_implications: { sector: string; action: string; rationale: string }[];
  region_impacts: { region: string; impact: string; sectors: string[] }[];
}

function economicsScenario(title: string, outcome: string, isPositive: boolean): ScenarioTemplate {
  const dir = isPositive ? "positive" : "negative";
  const inv = isPositive ? "negative" : "positive";
  return {
    macro_impacts: [
      { factor: "GDP", direction: dir, magnitude: "high", description: `${outcome} outcome implies ${dir} GDP impact` },
      { factor: "Inflation", direction: inv, magnitude: "medium", description: `Inflationary pressures shift ${inv}` },
      { factor: "Interest Rates", direction: inv, magnitude: "medium", description: `Rate expectations adjust` },
      { factor: "AUD/USD", direction: isPositive ? "negative" : "positive", magnitude: "medium", description: `Currency responds to rate differential` },
    ],
    chain_effects: [
      { event: "Bond yields shift", probability_shift: isPositive ? -0.05 : 0.05, description: "Fixed income repricing" },
      { event: "Equity rotation", probability_shift: isPositive ? 0.1 : -0.1, description: "Growth vs value rotation" },
    ],
    fund_implications: [
      { sector: "Equities", action: isPositive ? "overweight" : "underweight", rationale: `${title}: ${outcome} favours risk assets` },
      { sector: "Bonds", action: isPositive ? "underweight" : "overweight", rationale: "Duration positioning adjusts" },
      { sector: "Real Estate", action: isPositive ? "overweight" : "underweight", rationale: "Rate-sensitive sector reprices" },
    ],
    region_impacts: [
      { region: "Australia", impact: `RBA policy likely responds; AUD ${isPositive ? "weakens" : "strengthens"}`, sectors: ["Financials", "Mining", "Real Estate"] },
      { region: "US", impact: "Primary impact zone", sectors: ["Tech", "Financials", "Consumer"] },
    ],
  };
}

function geopoliticsScenario(title: string, outcome: string, isPositive: boolean): ScenarioTemplate {
  return {
    macro_impacts: [
      { factor: "Oil Prices", direction: isPositive ? "negative" : "positive", magnitude: "high", description: "Supply chain disruption risk" },
      { factor: "Defense Spending", direction: "positive", magnitude: "medium", description: "Geopolitical tension drives defence budgets" },
      { factor: "Trade Flows", direction: isPositive ? "positive" : "negative", magnitude: "high", description: "Global trade patterns shift" },
    ],
    chain_effects: [
      { event: "Commodity price spike", probability_shift: isPositive ? -0.1 : 0.15, description: "Energy and metals repricing" },
      { event: "Safe-haven flows", probability_shift: isPositive ? -0.05 : 0.1, description: "Flight to quality" },
    ],
    fund_implications: [
      { sector: "Energy", action: isPositive ? "underweight" : "overweight", rationale: `${title}: ${outcome} shifts energy dynamics` },
      { sector: "Defence", action: "overweight", rationale: "Spending tailwind regardless of outcome" },
      { sector: "Consumer Discretionary", action: isPositive ? "overweight" : "underweight", rationale: "Consumer confidence shifts" },
    ],
    region_impacts: [
      { region: "Australia", impact: "Resource exports affected; AUD volatility", sectors: ["Mining", "Energy", "Agriculture"] },
      { region: "Global", impact: "Risk premia repricing", sectors: ["All"] },
    ],
  };
}

function politicsScenario(title: string, outcome: string, isPositive: boolean): ScenarioTemplate {
  return {
    macro_impacts: [
      { factor: "Regulation", direction: isPositive ? "positive" : "negative", magnitude: "medium", description: "Regulatory environment shifts" },
      { factor: "Fiscal Policy", direction: isPositive ? "positive" : "negative", magnitude: "high", description: "Government spending trajectory changes" },
      { factor: "Market Confidence", direction: isPositive ? "positive" : "negative", magnitude: "medium", description: "Investor sentiment adjusts" },
    ],
    chain_effects: [
      { event: "Policy uncertainty", probability_shift: isPositive ? -0.1 : 0.1, description: "Markets price in new political landscape" },
      { event: "Sector regulation changes", probability_shift: 0.05, description: "Industry-specific impacts" },
    ],
    fund_implications: [
      { sector: "Healthcare", action: isPositive ? "overweight" : "underweight", rationale: `${title}: ${outcome} affects healthcare policy` },
      { sector: "Infrastructure", action: isPositive ? "overweight" : "neutral", rationale: "Fiscal spending implications" },
      { sector: "Financials", action: isPositive ? "overweight" : "underweight", rationale: "Regulatory clarity/uncertainty" },
    ],
    region_impacts: [
      { region: "US", impact: "Primary policy impact", sectors: ["Financials", "Healthcare", "Energy"] },
      { region: "Australia", impact: "Trade policy flow-through", sectors: ["Mining", "Agriculture"] },
    ],
  };
}

function cryptoScenario(title: string, outcome: string, isPositive: boolean): ScenarioTemplate {
  return {
    macro_impacts: [
      { factor: "Institutional Adoption", direction: isPositive ? "positive" : "negative", magnitude: "high", description: "Institutional capital flows shift" },
      { factor: "Regulatory Clarity", direction: isPositive ? "positive" : "negative", magnitude: "medium", description: "Regulatory framework evolves" },
      { factor: "DeFi Growth", direction: isPositive ? "positive" : "negative", magnitude: "medium", description: "Decentralised finance adoption" },
    ],
    chain_effects: [
      { event: "Altcoin correlation", probability_shift: isPositive ? 0.15 : -0.15, description: "Broader crypto market follows" },
      { event: "TradFi integration", probability_shift: isPositive ? 0.1 : -0.05, description: "Traditional finance bridges" },
    ],
    fund_implications: [
      { sector: "Digital Assets", action: isPositive ? "overweight" : "underweight", rationale: `${title}: ${outcome} signals market direction` },
      { sector: "Fintech", action: isPositive ? "overweight" : "neutral", rationale: "Infrastructure plays benefit" },
      { sector: "Traditional Finance", action: isPositive ? "underweight" : "overweight", rationale: "Competitive dynamics shift" },
    ],
    region_impacts: [
      { region: "Global", impact: "Borderless asset class", sectors: ["Digital Assets", "Fintech"] },
      { region: "US", impact: "Regulatory tone setter", sectors: ["Exchanges", "Custody"] },
    ],
  };
}

function technologyScenario(title: string, outcome: string, isPositive: boolean): ScenarioTemplate {
  return {
    macro_impacts: [
      { factor: "Productivity", direction: isPositive ? "positive" : "negative", magnitude: "high", description: "Tech-driven productivity shift" },
      { factor: "Sector Rotation", direction: isPositive ? "positive" : "negative", magnitude: "medium", description: "Capital flows to/from tech" },
      { factor: "Venture Capital", direction: isPositive ? "positive" : "negative", magnitude: "medium", description: "Startup funding environment" },
    ],
    chain_effects: [
      { event: "AI capex cycle", probability_shift: isPositive ? 0.1 : -0.1, description: "Infrastructure investment wave" },
      { event: "Labour market disruption", probability_shift: isPositive ? 0.05 : -0.05, description: "Automation accelerates" },
    ],
    fund_implications: [
      { sector: "Technology", action: isPositive ? "overweight" : "underweight", rationale: `${title}: ${outcome} drives sector` },
      { sector: "Semiconductors", action: isPositive ? "overweight" : "neutral", rationale: "Supply chain beneficiary" },
      { sector: "Industrials", action: isPositive ? "overweight" : "neutral", rationale: "Automation adoption" },
    ],
    region_impacts: [
      { region: "US", impact: "Tech leadership", sectors: ["Big Tech", "Semiconductors", "Cloud"] },
      { region: "Asia", impact: "Manufacturing and supply chain", sectors: ["Semiconductors", "Hardware"] },
    ],
  };
}

function defaultScenario(title: string, outcome: string, isPositive: boolean): ScenarioTemplate {
  return {
    macro_impacts: [
      { factor: "Market Sentiment", direction: isPositive ? "positive" : "negative", magnitude: "low", description: `${outcome} outcome for ${title}` },
    ],
    chain_effects: [],
    fund_implications: [
      { sector: "Broad Market", action: "neutral", rationale: "Limited direct fund implications" },
    ],
    region_impacts: [
      { region: "Global", impact: "Localised impact", sectors: [] },
    ],
  };
}

function buildScenario(category: string, title: string, outcome: string, isPositive: boolean): ScenarioTemplate {
  switch (category) {
    case "economics": return economicsScenario(title, outcome, isPositive);
    case "geopolitics": return geopoliticsScenario(title, outcome, isPositive);
    case "politics": return politicsScenario(title, outcome, isPositive);
    case "crypto": return cryptoScenario(title, outcome, isPositive);
    case "technology": return technologyScenario(title, outcome, isPositive);
    default: return defaultScenario(title, outcome, isPositive);
  }
}

// ---------------------------------------------------------------------------
// Event / market types from Polymarket gamma API
// ---------------------------------------------------------------------------

interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string;          // JSON string e.g. '["Yes","No"]'
  outcomePrices: string;     // JSON string e.g. '["0.65","0.35"]'
  volume: string;
  liquidity: string;
  active: boolean;
  closed: boolean;
  endDate: string;
  bestBid: string;
  bestAsk: string;
  groupItemTitle: string;
  conditionId: string;
}

interface GammaEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  volume: string;
  openInterest: string;
  startDate: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  image: string;
  tags: string[];
  markets: GammaMarket[];
}

// ---------------------------------------------------------------------------
// Sync functions
// ---------------------------------------------------------------------------

export async function syncEvents(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const res = await fetch(
      `${GAMMA_API}/events?limit=50&active=true&order=volume&ascending=false`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`Gamma events API ${res.status}`);
    const events: GammaEvent[] = await res.json();

    for (const ev of events) {
      try {
        const category = classifyCategory(ev.title, ev.description);
        const vol = parseFloat(ev.volume) || 0;
        const macroImpact = classifyMacroImpact(category, vol);
        const region = classifyRegion(ev.title, ev.description);

        await pool.execute(
          `INSERT INTO intel_events (id, title, slug, description, category, volume, open_interest, start_date, end_date, active, closed, image, tags, macro_impact, region)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             slug = VALUES(slug),
             description = VALUES(description),
             category = VALUES(category),
             volume = VALUES(volume),
             open_interest = VALUES(open_interest),
             start_date = VALUES(start_date),
             end_date = VALUES(end_date),
             active = VALUES(active),
             closed = VALUES(closed),
             image = VALUES(image),
             tags = VALUES(tags),
             macro_impact = VALUES(macro_impact),
             region = VALUES(region)`,
          [
            ev.id,
            ev.title,
            ev.slug || null,
            ev.description || null,
            category,
            vol,
            parseFloat(ev.openInterest) || 0,
            ev.startDate ? new Date(ev.startDate) : null,
            ev.endDate ? new Date(ev.endDate) : null,
            ev.active,
            ev.closed,
            ev.image || null,
            JSON.stringify(ev.tags || []),
            macroImpact,
            region,
          ],
        );
        synced++;

        // Also upsert nested markets
        if (ev.markets) {
          for (const m of ev.markets) {
            try {
              await upsertMarket(m, ev.id);
            } catch (e: any) {
              errors.push(`Market ${m.id}: ${e.message}`);
            }
          }
        }
      } catch (e: any) {
        errors.push(`Event ${ev.id}: ${e.message}`);
      }
    }
  } catch (e: any) {
    errors.push(`Events fetch: ${e.message}`);
  }

  return { synced, errors };
}

async function upsertMarket(m: GammaMarket, eventId: string | null): Promise<void> {
  let outcomes: string[];
  let outcomePrices: string[];
  try {
    outcomes = typeof m.outcomes === "string" ? JSON.parse(m.outcomes) : m.outcomes;
  } catch {
    outcomes = [];
  }
  try {
    outcomePrices = typeof m.outcomePrices === "string" ? JSON.parse(m.outcomePrices) : m.outcomePrices;
  } catch {
    outcomePrices = [];
  }

  await pool.execute(
    `INSERT INTO intel_markets (id, event_id, question, slug, outcomes, outcome_prices, volume, liquidity, best_bid, best_ask, active, closed, end_date, group_item_title, condition_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       event_id = VALUES(event_id),
       question = VALUES(question),
       slug = VALUES(slug),
       outcomes = VALUES(outcomes),
       outcome_prices = VALUES(outcome_prices),
       volume = VALUES(volume),
       liquidity = VALUES(liquidity),
       best_bid = VALUES(best_bid),
       best_ask = VALUES(best_ask),
       active = VALUES(active),
       closed = VALUES(closed),
       end_date = VALUES(end_date),
       group_item_title = VALUES(group_item_title),
       condition_id = VALUES(condition_id)`,
    [
      m.id,
      eventId,
      m.question,
      m.slug || null,
      JSON.stringify(outcomes),
      JSON.stringify(outcomePrices),
      parseFloat(m.volume) || 0,
      parseFloat(m.liquidity) || 0,
      parseFloat(m.bestBid) || null,
      parseFloat(m.bestAsk) || null,
      m.active,
      m.closed,
      m.endDate ? new Date(m.endDate) : null,
      m.groupItemTitle || null,
      m.conditionId || null,
    ],
  );

  // Record price snapshot
  if (outcomePrices.length > 0) {
    const price = parseFloat(outcomePrices[0]) || null;
    if (price !== null) {
      await pool.execute(
        `INSERT INTO intel_price_history (market_id, price, timestamp) VALUES (?, ?, NOW())`,
        [m.id, price],
      );
    }
  }
}

export async function syncMarkets(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const res = await fetch(
      `${GAMMA_API}/markets?limit=200&active=true`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`Gamma markets API ${res.status}`);
    const markets: GammaMarket[] = await res.json();

    for (const m of markets) {
      try {
        // event_id may not be present when fetching standalone markets
        await upsertMarket(m, (m as any).eventId || null);
        synced++;
      } catch (e: any) {
        errors.push(`Market ${m.id}: ${e.message}`);
      }
    }
  } catch (e: any) {
    errors.push(`Markets fetch: ${e.message}`);
  }

  return { synced, errors };
}

export async function generateScenarios(eventId: string): Promise<number> {
  // Fetch the event
  const [rows] = await pool.execute(
    `SELECT * FROM intel_events WHERE id = ?`,
    [eventId],
  );
  const events = rows as any[];
  if (events.length === 0) return 0;
  const ev = events[0];

  // Fetch markets for this event
  const [marketRows] = await pool.execute(
    `SELECT * FROM intel_markets WHERE event_id = ?`,
    [eventId],
  );
  const markets = marketRows as any[];

  // Delete old scenarios for this event
  await pool.execute(`DELETE FROM intel_scenarios WHERE event_id = ?`, [eventId]);

  let created = 0;

  // For each market, generate scenarios for each outcome
  for (const m of markets) {
    let outcomes: string[];
    let prices: string[];
    try {
      outcomes = typeof m.outcomes === "string" ? JSON.parse(m.outcomes) : m.outcomes;
    } catch {
      outcomes = ["Yes", "No"];
    }
    try {
      prices = typeof m.outcome_prices === "string" ? JSON.parse(m.outcome_prices) : m.outcome_prices;
    } catch {
      prices = [];
    }

    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i];
      const probability = parseFloat(prices[i]) || 0;
      const isPositive = i === 0; // First outcome treated as the "positive" scenario
      const tmpl = buildScenario(ev.category || "other", ev.title, outcome, isPositive);

      await pool.execute(
        `INSERT INTO intel_scenarios (event_id, title, description, outcome, probability, macro_impacts, chain_effects, fund_implications, region_impacts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId,
          `${ev.title} — ${outcome}`,
          `Scenario analysis for "${outcome}" outcome of ${ev.title}`,
          outcome,
          probability,
          JSON.stringify(tmpl.macro_impacts),
          JSON.stringify(tmpl.chain_effects),
          JSON.stringify(tmpl.fund_implications),
          JSON.stringify(tmpl.region_impacts),
        ],
      );
      created++;
    }
  }

  // If no markets found, generate generic Yes/No scenarios
  if (markets.length === 0) {
    for (const [outcome, isPositive] of [["Yes", true], ["No", false]] as const) {
      const tmpl = buildScenario(ev.category || "other", ev.title, outcome, isPositive);
      await pool.execute(
        `INSERT INTO intel_scenarios (event_id, title, description, outcome, probability, macro_impacts, chain_effects, fund_implications, region_impacts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId,
          `${ev.title} — ${outcome}`,
          `Scenario analysis for "${outcome}" outcome of ${ev.title}`,
          outcome,
          0.5,
          JSON.stringify(tmpl.macro_impacts),
          JSON.stringify(tmpl.chain_effects),
          JSON.stringify(tmpl.fund_implications),
          JSON.stringify(tmpl.region_impacts),
        ],
      );
      created++;
    }
  }

  return created;
}

export async function syncAll(): Promise<{
  events: { synced: number; errors: string[] };
  markets: { synced: number; errors: string[] };
  scenarios: number;
}> {
  const events = await syncEvents();
  const markets = await syncMarkets();

  // Generate scenarios for all active events
  let scenarioCount = 0;
  const [eventRows] = await pool.execute(
    `SELECT id FROM intel_events WHERE active = true`,
  );
  for (const row of eventRows as any[]) {
    scenarioCount += await generateScenarios(row.id);
  }

  // Log the sync
  await pool.execute(
    `INSERT INTO intel_sync_log (sync_type, records_synced, status) VALUES (?, ?, ?)`,
    ["full", events.synced + markets.synced + scenarioCount, "success"],
  );

  return { events, markets, scenarios: scenarioCount };
}
