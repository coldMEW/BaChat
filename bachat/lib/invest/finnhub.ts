// ================================================================
// Finnhub client — news, peers, analyst consensus, earnings
// ================================================================
// Server-only.

import type { AnalystData, AnalystBuckets, NewsArticle, PriceTargets } from '@/types'
import { acquire } from './rate-limiter'
import { CACHE_TTL, cacheGet, cacheSet } from './fs-cache'

const BASE = 'https://finnhub.io/api/v1'

function key(): string {
  const k = process.env.FINNHUB_API_KEY
  if (!k) throw new Error('FINNHUB_API_KEY not set')
  return k
}

interface FinnhubNewsItem {
  category: string
  datetime: number          // seconds epoch
  headline: string
  id: number
  image?: string
  related: string
  source: string
  summary: string
  url: string
}

/** Company news within a date window (YYYY-MM-DD). Cached via fs-cache upstream. */
export async function fetchCompanyNews(symbol: string, from: string, to: string): Promise<NewsArticle[]> {
  const cacheKey = `fh:news:${symbol}:${from}:${to}`
  const hit = await cacheGet<NewsArticle[]>('upstream', cacheKey)
  if (hit) return hit.data
  await acquire('finnhub')
  const url = `${BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${key()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Finnhub news error: ${res.status}`)
  const items = (await res.json()) as FinnhubNewsItem[]
  const articles: NewsArticle[] = items.map((it) => ({
    id: String(it.id),
    headline: it.headline,
    summary: it.summary,
    url: it.url,
    source: it.source,
    publishedAt: it.datetime * 1000,
  }))
  await cacheSet('upstream', cacheKey, articles, CACHE_TTL.news)
  return articles
}

export async function fetchPeers(symbol: string): Promise<string[]> {
  const cacheKey = `fh:peers:${symbol}`
  const hit = await cacheGet<string[]>('upstream', cacheKey)
  if (hit) return hit.data
  await acquire('finnhub')
  const url = `${BASE}/stock/peers?symbol=${encodeURIComponent(symbol)}&token=${key()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Finnhub peers error: ${res.status}`)
  const arr = (await res.json()) as string[]
  const filtered = arr.filter((s) => s !== symbol).slice(0, 10)
  await cacheSet('upstream', cacheKey, filtered, CACHE_TTL.peers)
  return filtered
}

interface FinnhubRecommendation {
  buy: number
  hold: number
  period: string
  sell: number
  strongBuy: number
  strongSell: number
  symbol: string
}

interface FinnhubPriceTarget {
  lastUpdated?: string
  symbol?: string
  targetHigh?: number
  targetLow?: number
  targetMean?: number
  targetMedian?: number
  numberOfAnalysts?: number
}

interface FinnhubUpgradeDowngrade {
  symbol: string
  gradeTime: number
  fromGrade: string
  toGrade: string
  company: string
  action: string
}

export async function fetchAnalystData(symbol: string): Promise<AnalystData | null> {
  const cacheKey = `fh:analyst:${symbol}`
  const hit = await cacheGet<AnalystData>('upstream', cacheKey)
  if (hit) return hit.data

  await acquire('finnhub')
  const [recRes, tgtRes, udRes] = await Promise.all([
    fetch(`${BASE}/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${key()}`, { cache: 'no-store' }),
    fetch(`${BASE}/stock/price-target?symbol=${encodeURIComponent(symbol)}&token=${key()}`, { cache: 'no-store' }),
    fetch(`${BASE}/stock/upgrade-downgrade?symbol=${encodeURIComponent(symbol)}&token=${key()}`, { cache: 'no-store' }),
  ])

  // Recommendations are mandatory; price-targets and upgrade-downgrade are optional
  if (!recRes.ok) return null
  const recs = (await recRes.json().catch(() => [])) as FinnhubRecommendation[]
  if (!recs || recs.length === 0) return null

  const tgt: FinnhubPriceTarget = tgtRes.ok
    ? ((await tgtRes.json().catch(() => ({}))) as FinnhubPriceTarget)
    : {}
  const uds: FinnhubUpgradeDowngrade[] = udRes.ok
    ? ((await udRes.json().catch(() => [])) as FinnhubUpgradeDowngrade[])
    : []

  const latest = recs[0]
  const buckets: AnalystBuckets = {
    strongBuy: latest.strongBuy ?? 0,
    buy: latest.buy ?? 0,
    hold: latest.hold ?? 0,
    sell: latest.sell ?? 0,
    strongSell: latest.strongSell ?? 0,
    period: latest.period,
  }
  const targets: PriceTargets = {
    mean: tgt.targetMean ?? 0,
    high: tgt.targetHigh ?? 0,
    low: tgt.targetLow ?? 0,
    numAnalysts: tgt.numberOfAnalysts ?? 0,
    asOf: tgt.lastUpdated ?? new Date().toISOString().slice(0, 10),
  }
  const fourteenDaysAgo = Date.now() - 14 * 24 * 3600 * 1000
  const recentChanges = (uds ?? [])
    .filter((u) => u.gradeTime * 1000 > fourteenDaysAgo)
    .map((u) => ({
      firm: u.company,
      from: u.fromGrade || 'Unrated',
      to: u.toGrade || 'Unrated',
      date: new Date(u.gradeTime * 1000).toISOString().slice(0, 10),
    }))

  const result: AnalystData = {
    symbol,
    buckets,
    targets,
    recentChanges,
    fetchedAt: Date.now(),
    ttlMs: CACHE_TTL.analyst,
  }
  await cacheSet('upstream', cacheKey, result, CACHE_TTL.analyst)
  return result
}

interface FinnhubEarningsItem {
  date: string
  epsActual?: number
  epsEstimate?: number
  hour?: string
  quarter?: number
  revenueActual?: number
  revenueEstimate?: number
  symbol: string
  year?: number
}

/** Returns the days until next earnings, or null if unknown. */
export async function daysUntilNextEarnings(symbol: string): Promise<number | null> {
  await acquire('finnhub')
  const to = new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const from = new Date().toISOString().slice(0, 10)
  const url = `${BASE}/calendar/earnings?from=${from}&to=${to}&symbol=${encodeURIComponent(symbol)}&token=${key()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  const json = (await res.json()) as { earningsCalendar?: FinnhubEarningsItem[] }
  const items = json.earningsCalendar ?? []
  if (!items.length) return null
  const next = items.sort((a, b) => a.date.localeCompare(b.date))[0]
  const ms = new Date(next.date).getTime() - Date.now()
  return Math.max(0, Math.round(ms / (24 * 3600 * 1000)))
}

export async function fetchCompanyProfile(symbol: string): Promise<{ name: string; marketCap?: number; sector?: string } | null> {
  const cacheKey = `fh:profile:${symbol}`
  const hit = await cacheGet<{ name: string; marketCap?: number; sector?: string }>('upstream', cacheKey)
  if (hit) return hit.data
  await acquire('finnhub')
  const url = `${BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  const json = (await res.json()) as { name?: string; marketCapitalization?: number; finnhubIndustry?: string }
  if (!json.name) return null
  const result = {
    name: json.name,
    marketCap: json.marketCapitalization,
    sector: json.finnhubIndustry,
  }
  await cacheSet('upstream', cacheKey, result, CACHE_TTL.peers) // 7d — profile rarely changes
  return result
}
