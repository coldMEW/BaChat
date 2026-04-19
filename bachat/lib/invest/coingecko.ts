// ================================================================
// CoinGecko client — crypto OHLC + categories (for graph crypto support)
// ================================================================

import type { Candle } from '@/types'
import { acquire } from './rate-limiter'
import { CACHE_TTL, cacheGet, cacheSet } from './fs-cache'

const BASE = 'https://api.coingecko.com/api/v3'

function authHeaders(): Record<string, string> {
  const k = process.env.COINGECKO_API_KEY
  return k ? { 'x-cg-demo-api-key': k } : {}
}

/** Map ticker (BTC/ETH/etc.) to a CoinGecko coin id. Simple local table;
 *  for unknown tickers we fall back to /search. */
const TICKER_TO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  DOGE: 'dogecoin',
  XRP: 'ripple',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  ATOM: 'cosmos',
  NEAR: 'near',
}

export async function tickerToCoinId(ticker: string): Promise<string | null> {
  const upper = ticker.replace('/USD', '').replace('/USDT', '').toUpperCase()
  if (TICKER_TO_ID[upper]) return TICKER_TO_ID[upper]
  // Fallback: search
  await acquire('coingecko')
  const res = await fetch(`${BASE}/search?query=${encodeURIComponent(upper)}`, {
    headers: authHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = (await res.json()) as { coins?: Array<{ id: string; symbol: string }> }
  const match = json.coins?.find((c) => c.symbol.toUpperCase() === upper)
  return match?.id ?? null
}

/** CoinGecko free tier only supports specific `days` values on /ohlc.
 *  Round to the nearest allowed value >= requested. */
const OHLC_ALLOWED_DAYS = [1, 7, 14, 30, 90, 180, 365]
function snapDays(requested: number): number {
  for (const v of OHLC_ALLOWED_DAYS) if (requested <= v) return v
  return 365
}

/** Fetch daily OHLC for a crypto. Returns oldest-first candles with volume=0
 *  (volume data requires a paid tier). Cached via fs-cache 'upstream'. */
export async function fetchCryptoCandles(ticker: string, days = 365): Promise<Candle[]> {
  const snappedDays = snapDays(days)
  const cacheKey = `cg:ohlc:${ticker}:${snappedDays}`
  const hit = await cacheGet<Candle[]>('upstream', cacheKey)
  if (hit) {
    if (hit.data.length > days && days < snappedDays) return hit.data.slice(-days)
    return hit.data
  }

  const id = await tickerToCoinId(ticker)
  if (!id) throw new Error(`Unknown crypto ticker: ${ticker}`)

  await acquire('coingecko')
  const res = await fetch(
    `${BASE}/coins/${id}/ohlc?vs_currency=usd&days=${snappedDays}`,
    { headers: authHeaders(), cache: 'no-store' },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`CoinGecko OHLC error ${res.status}: ${body.slice(0, 100)}`)
  }
  const data = (await res.json()) as Array<[number, number, number, number, number]>
  const candles: Candle[] = data.map((r) => [r[0], r[1], r[2], r[3], r[4], 0])
  await cacheSet('upstream', cacheKey, candles, CACHE_TTL.prices)
  if (candles.length > days && days < snappedDays) return candles.slice(-days)
  return candles
}

/** List coin ids in a given category (e.g. "layer-1", "decentralized-finance-defi"). */
export async function fetchCategoryCoins(category: string, top = 10): Promise<Array<{ symbol: string; name: string; marketCap: number; id: string }>> {
  await acquire('coingecko')
  const res = await fetch(
    `${BASE}/coins/markets?vs_currency=usd&category=${encodeURIComponent(category)}&order=market_cap_desc&per_page=${top}&page=1`,
    { headers: authHeaders(), cache: 'no-store' },
  )
  if (!res.ok) throw new Error(`CoinGecko category error: ${res.status}`)
  const arr = (await res.json()) as Array<{ id: string; symbol: string; name: string; market_cap: number }>
  return arr.map((c) => ({
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    marketCap: c.market_cap,
    id: c.id,
  }))
}

/** Crypto peers by shared category. Returns top-N peers (excluding the center). */
export async function fetchCryptoPeers(ticker: string, n = 5): Promise<Array<{ symbol: string; name: string; marketCap: number }>> {
  const upperTicker = ticker.replace('/USD', '').replace('/USDT', '').toUpperCase()
  // For v1, we hard-code a primary category per major ticker.
  // Post-v1 this can read from /coins/{id} and pick the top category.
  const categoryMap: Record<string, string> = {
    BTC: 'layer-1',
    ETH: 'smart-contract-platform',
    SOL: 'smart-contract-platform',
    ADA: 'smart-contract-platform',
    AVAX: 'smart-contract-platform',
    DOT: 'layer-1',
    MATIC: 'ethereum-ecosystem',
    UNI: 'decentralized-finance-defi',
    LINK: 'oracle',
  }
  const category = categoryMap[upperTicker] ?? 'layer-1'
  const list = await fetchCategoryCoins(category, n + 1)
  return list.filter((c) => c.symbol !== upperTicker).slice(0, n)
}
