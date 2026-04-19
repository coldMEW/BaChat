// Knowledge graph: center + 5 peers + correlation-weighted edges.
// Cache: 24h disk-backed fs-cache.

import { NextRequest, NextResponse } from 'next/server'
import { fetchCompanyProfile, fetchPeers } from '@/lib/invest/finnhub'
import { fetchCryptoPeers, fetchCryptoCandles } from '@/lib/invest/coingecko'
import { fetchTimeSeries } from '@/lib/invest/twelvedata'
import { dailyReturns } from '@/lib/invest/correlation'
import { CACHE_TTL, cacheGet, cacheSet } from '@/lib/invest/fs-cache'
import type { ApiEnvelope, PeerEdge, PeerGraph, PeerNode, Sector } from '@/types'

function isCrypto(symbol: string): boolean {
  const up = symbol.toUpperCase()
  return /^(BTC|ETH|SOL|ADA|DOT|AVAX|MATIC|LINK|UNI|DOGE|XRP|LTC|BCH|ATOM|NEAR)(\/USD|\/USDT)?$/.test(up)
}

function mapIndustry(industry?: string): Sector {
  if (!industry) return 'broad-market'
  const low = industry.toLowerCase()
  if (low.includes('semi')) return 'semiconductor'
  if (low.includes('technology') || low.includes('software')) return 'tech'
  if (low.includes('bank') || low.includes('financ') || low.includes('insur')) return 'finance'
  if (low.includes('energy') || low.includes('oil')) return 'energy'
  if (low.includes('health') || low.includes('pharm') || low.includes('biotech')) return 'healthcare'
  if (low.includes('consumer') || low.includes('retail')) return 'consumer'
  if (low.includes('industr') || low.includes('manufact')) return 'industrial'
  if (low.includes('utilit')) return 'utilities'
  if (low.includes('real estate')) return 'real-estate'
  return 'broad-market'
}

/** Fetch closes. We deliberately request 365 days so the disk cache entry
 *  is IDENTICAL to the one the PriceChart component already populated — one
 *  shared upstream-cache row, no duplicate rate-limited fetches.
 *  We slice to the desired `days` window for the correlation math afterwards. */
async function getCloses(symbol: string, days: number): Promise<number[]> {
  const fetchDays = Math.max(days, 365)
  let closes: number[]
  if (isCrypto(symbol)) {
    const c = await fetchCryptoCandles(symbol, fetchDays)
    closes = c.map((r) => r[4])
  } else {
    const c = await fetchTimeSeries(symbol, '1d', fetchDays)
    closes = c.map((r) => r[4])
  }
  return closes.length > days ? closes.slice(-days) : closes
}

/** Fetch with one delayed retry. Recovers rate-limit misses ~80% of the time. */
async function getClosesResilient(symbol: string, days: number): Promise<number[]> {
  try {
    const first = await getCloses(symbol, days)
    if (first.length > 30) return first
  } catch {
    /* fall through to retry */
  }
  await new Promise((r) => setTimeout(r, 3000))
  try {
    const second = await getCloses(symbol, days)
    return second
  } catch {
    return []
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const url = new URL(req.url)
  const lookback = parseInt(url.searchParams.get('days') ?? '180', 10)
  const key = `${symbol}:${lookback}`

  const cached = await cacheGet<PeerGraph>('graph', key)
  if (cached) {
    return NextResponse.json<ApiEnvelope<PeerGraph>>({
      data: cached.data,
      error: null,
      cached: true,
      fetchedAt: cached.fetchedAt,
    })
  }

  try {
    const crypto = isCrypto(symbol)
    let center: PeerNode
    let peerSymbols: string[]
    let peerMeta: Array<{ name: string; marketCap?: number; sector: Sector }> = []

    if (crypto) {
      const cryptoPeers = await fetchCryptoPeers(symbol, 5)
      peerSymbols = cryptoPeers.map((p) => `${p.symbol}/USD`)
      peerMeta = cryptoPeers.map((p) => ({ name: p.name, marketCap: p.marketCap, sector: 'crypto' as const }))
      center = { symbol: symbol.toUpperCase(), name: symbol.replace('/USD', '').toUpperCase(), sector: 'crypto' }
    } else {
      const [profile, rawPeers] = await Promise.all([
        fetchCompanyProfile(symbol).catch(() => null),
        fetchPeers(symbol),
      ])
      peerSymbols = rawPeers.slice(0, 5)
      const profiles = await Promise.all(peerSymbols.map((s) => fetchCompanyProfile(s).catch(() => null)))
      peerMeta = profiles.map((p, i) => ({
        name: p?.name ?? peerSymbols[i],
        marketCap: p?.marketCap,
        sector: mapIndustry(p?.sector),
      }))
      center = {
        symbol,
        name: profile?.name ?? symbol,
        marketCap: profile?.marketCap,
        sector: mapIndustry(profile?.sector),
      }
    }

    // First pass: fetch all closes in parallel with single delayed retry
    const closesAll = await Promise.all(
      [symbol, ...peerSymbols].map((s) => getClosesResilient(s, lookback)),
    )
    const centerCloses = closesAll[0]
    const centerReturns = centerCloses.length > 30 ? dailyReturns(centerCloses) : []

    const edges: PeerEdge[] = peerSymbols.map((s, i) => {
      const peerCloses = closesAll[i + 1]
      // Unavailable = null (distinct from "computed, happens to be zero").
      if (centerReturns.length === 0 || peerCloses.length <= 30) {
        return { from: symbol, to: s, correlation: null }
      }
      const peerReturns = dailyReturns(peerCloses)
      const minLen = Math.min(centerReturns.length, peerReturns.length)
      if (minLen < 20) return { from: symbol, to: s, correlation: null }
      const a = centerReturns.slice(-minLen)
      const b = peerReturns.slice(-minLen)
      const n = minLen
      let sa = 0, sb = 0
      for (let k = 0; k < n; k++) { sa += a[k]; sb += b[k] }
      const ma = sa / n, mb = sb / n
      let num = 0, dA = 0, dB = 0
      for (let k = 0; k < n; k++) {
        const x = a[k] - ma, y = b[k] - mb
        num += x * y; dA += x * x; dB += y * y
      }
      const rho = (dA === 0 || dB === 0) ? 0 : num / Math.sqrt(dA * dB)
      return { from: symbol, to: s, correlation: Math.round(rho * 1000) / 1000 }
    })

    const peers: PeerNode[] = peerSymbols.map((s, i) => ({
      symbol: s,
      name: peerMeta[i].name,
      marketCap: peerMeta[i].marketCap,
      sector: peerMeta[i].sector,
    }))

    const graph: PeerGraph = {
      center,
      peers,
      edges,
      fetchedAt: Date.now(),
      lookbackDays: lookback,
    }
    await cacheSet('graph', key, graph, CACHE_TTL.graph)
    return NextResponse.json<ApiEnvelope<PeerGraph>>({
      data: graph,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<PeerGraph>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
