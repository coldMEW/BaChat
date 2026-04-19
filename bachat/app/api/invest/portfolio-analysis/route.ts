// Portfolio-wide correlation + diversification score + rebalance suggestions.
// Cache: 12h, keyed by a stable hash of the holdings list.

import { NextRequest, NextResponse } from 'next/server'
import { fetchTimeSeries } from '@/lib/invest/twelvedata'
import { fetchCryptoCandles } from '@/lib/invest/coingecko'
import { fetchCompanyProfile } from '@/lib/invest/finnhub'
import {
  ANCHOR_CANDIDATES,
  analyzePortfolio,
  type HoldingWithHistory,
} from '@/lib/invest/diversification'
import { CACHE_TTL, cacheGet, cacheSet } from '@/lib/invest/fs-cache'
import type { ApiEnvelope, DiversificationAnalysis, Holding, Sector } from '@/types'
import crypto from 'node:crypto'

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

async function fetchCloses(symbol: string, days = 252): Promise<number[]> {
  const candles = isCrypto(symbol)
    ? await fetchCryptoCandles(symbol, days)
    : await fetchTimeSeries(symbol, '1d', days)
  return candles.map((c) => c[4])
}

async function resolveSector(symbol: string, assetType: string): Promise<Sector> {
  if (assetType === 'crypto') return 'crypto'
  if (assetType === 'etf') return 'broad-market'
  const profile = await fetchCompanyProfile(symbol).catch(() => null)
  return mapIndustry(profile?.sector)
}

function alignToShortest(series: number[][]): number[][] {
  const minLen = Math.min(...series.map((s) => s.length))
  return series.map((s) => s.slice(-minLen))
}

function hashHoldings(holdings: Holding[]): string {
  const keyed = holdings
    .map((h) => `${h.symbol}:${h.shares}:${h.costBasis}`)
    .sort()
    .join('|')
  return crypto.createHash('sha256').update(keyed).digest('hex').slice(0, 16)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { holdings: Holding[]; lookbackDays?: number }
    const lookback = body.lookbackDays ?? 252
    if (!body.holdings || body.holdings.length === 0) {
      return NextResponse.json<ApiEnvelope<DiversificationAnalysis>>({
        data: {
          score: 0,
          drivers: [],
          correlationMatrix: { symbols: [], values: [] },
          suggestions: [],
          asOf: new Date().toISOString(),
          lookbackDays: lookback,
        },
        error: null,
        cached: false,
        fetchedAt: Date.now(),
      })
    }

    const cacheKey = `${hashHoldings(body.holdings)}:${lookback}`
    const cached = await cacheGet<DiversificationAnalysis>('portfolio', cacheKey)
    if (cached) {
      return NextResponse.json<ApiEnvelope<DiversificationAnalysis>>({
        data: cached.data,
        error: null,
        cached: true,
        fetchedAt: cached.fetchedAt,
      })
    }

    const holdingData = await Promise.all(
      body.holdings.map(async (h) => {
        const [closes, sector] = await Promise.all([
          fetchCloses(h.symbol, lookback).catch(() => [] as number[]),
          resolveSector(h.symbol, h.assetType),
        ])
        return { holding: h, closes, sector, currentPrice: closes[closes.length - 1] ?? 0 }
      }),
    )
    const validHoldings = holdingData.filter((h) => h.closes.length >= 30)
    if (validHoldings.length === 0) {
      return NextResponse.json<ApiEnvelope<DiversificationAnalysis>>(
        { data: null, error: 'No holdings with sufficient price history', cached: false, fetchedAt: Date.now() },
        { status: 422 },
      )
    }

    const alignedCloses = alignToShortest(validHoldings.map((h) => h.closes))
    const holdings: HoldingWithHistory[] = validHoldings.map((h, i) => ({
      ...h,
      closes: alignedCloses[i],
    }))

    const anchorFetches = await Promise.all(
      ANCHOR_CANDIDATES.map(async (a) => {
        try {
          const closes = await fetchCloses(a.symbol, lookback)
          return { symbol: a.symbol, sector: a.sector, closes }
        } catch {
          return null
        }
      }),
    )
    const anchors = anchorFetches.filter((a): a is NonNullable<typeof a> => a !== null)

    const analysis = analyzePortfolio({ holdings, anchors, lookbackDays: lookback })
    await cacheSet('portfolio', cacheKey, analysis, CACHE_TTL.portfolio)
    return NextResponse.json<ApiEnvelope<DiversificationAnalysis>>({
      data: analysis,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<DiversificationAnalysis>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
