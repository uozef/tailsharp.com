const DATA_API = "https://data-api.polymarket.com";
const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";

export interface LeaderboardEntry {
  rank: string;
  proxyWallet: string;
  userName: string;
  xUsername: string;
  verifiedBadge: boolean;
  vol: number;
  pnl: number;
  profileImage: string;
}

export interface TradeActivity {
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: string;
  size: number;
  usdcSize: number;
  transactionHash: string;
  price: number;
  asset: string;
  side: string;
  outcomeIndex: number;
  title: string;
  slug: string;
  eventSlug: string;
  outcome: string;
  name: string;
}

export interface MarketData {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  endDate: string;
  liquidity: string;
  description: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  active: boolean;
  closed: boolean;
  image: string;
  bestBid: string;
  bestAsk: string;
  volume24hr: string;
}

export interface PositionData {
  conditionId: string;
  title: string;
  slug: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentValue: number;
  pnl: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 }, // cache 5 min in Next.js
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json();
}

export async function fetchLeaderboard(
  limit = 50
): Promise<LeaderboardEntry[]> {
  return fetchJson(`${DATA_API}/v1/leaderboard?limit=${limit}`);
}

export async function fetchUserActivity(
  wallet: string,
  limit = 100
): Promise<TradeActivity[]> {
  return fetchJson(`${DATA_API}/activity?user=${wallet}&limit=${limit}`);
}

/** Fetch all available activity by paginating with cursor (offset). */
export async function fetchUserActivityAll(
  wallet: string,
  maxPages = 10,
  perPage = 500,
): Promise<TradeActivity[]> {
  const all: TradeActivity[] = [];
  for (let page = 0; page < maxPages; page++) {
    const offset = page * perPage;
    const url = `${DATA_API}/activity?user=${wallet}&limit=${perPage}&offset=${offset}`;
    try {
      const batch: TradeActivity[] = await fetchJson(url);
      if (!Array.isArray(batch) || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < perPage) break; // last page
    } catch {
      break;
    }
  }
  return all;
}

export async function fetchUserPositions(wallet: string): Promise<any[]> {
  try {
    return await fetchJson(`${DATA_API}/positions?user=${wallet}`);
  } catch {
    return [];
  }
}

export async function fetchMarkets(
  limit = 50,
  active = true
): Promise<MarketData[]> {
  return fetchJson(`${GAMMA_API}/markets?limit=${limit}&active=${active}`);
}

export async function fetchMarketById(id: string): Promise<MarketData> {
  return fetchJson(`${GAMMA_API}/markets/${id}`);
}

export async function fetchOrderbook(tokenId: string): Promise<any> {
  return fetchJson(`${CLOB_API}/v1/orderbook?token_id=${tokenId}`);
}

export async function fetchMidpoint(tokenId: string): Promise<any> {
  return fetchJson(`${CLOB_API}/v1/midpoint?token_id=${tokenId}`);
}

export async function fetchSpread(tokenId: string): Promise<any> {
  return fetchJson(`${CLOB_API}/v1/spread?token_id=${tokenId}`);
}
