// Directional Prediction (DPS) orchestrator. Cache: 6h.

import { NextRequest, NextResponse } from 'next/server'
import { composeDPS } from '@/lib/invest/prediction'
import { fetchTimeSeries } from '@/lib/invest/twelvedata'
import { fetchCryptoCandles } from '@/lib/invest/coingecko'
import {
  daysUntilNextEarnings,
  fetchAnalystData,
  fetchCompanyNews,
  fetchCompanyProfile,
} from '@/lib/invest/finnhub'
import { fetchMacroSnapshot } from '@/lib/invest/fred'
import { attachSentiment, classifyHeadlines } from '@/lib/invest/sentiment'
import { CACHE_TTL, cacheGet, cacheSet } from '@/lib/invest/fs-cache'
import type { ApiEnvelope, DirectionalPrediction, Horizon, Sector } from '@/types'

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const url = new URL(req.url)
  const horizon = (url.searchParams.get('horizon') ?? '30d') as Horizon
  if (!['7d', '30d', '90d'].includes(horizon)) {
    return NextResponse.json(
      { data: null, error: 'horizon must be 7d|30d|90d', cached: false, fetchedAt: Date.now() },
      { status: 400 },
    )
  }
  const key = `${symbol}:${horizon}`

  const cached = await cacheGet<DirectionalPrediction>('predict', key)
  if (cached) {
    return NextResponse.json<ApiEnvelope<DirectionalPrediction>>({
      data: cached.data,
      error: null,
      cached: true,
      fetchedAt: cached.fetchedAt,
    })
  }

  try {
    const crypto = isCrypto(symbol)
    const fromDate = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    const toDate = new Date().toISOString().slice(0, 10)

    const [candles, rawNews, analyst, macro, profile, earningsDays] = await Promise.all([
      crypto ? fetchCryptoCandles(symbol, 365) : fetchTimeSeries(symbol, '1d', 365),
      crypto ? Promise.resolve([]) : fetchCompanyNews(symbol, fromDate, toDate),
      crypto ? Promise.resolve(null) : fetchAnalystData(symbol).catch(() => null),
      fetchMacroSnapshot().catch(() => null),
      crypto ? Promise.resolve(null) : fetchCompanyProfile(symbol).catch(() => null),
      crypto ? Promise.resolve(null) : daysUntilNextEarnings(symbol).catch(() => null),
    ])

    if (!candles.length) {
      return NextResponse.json(
        { data: null, error: 'No price history', cached: false, fetchedAt: Date.now() },
        { status: 404 },
      )
    }

    let news = rawNews
    if (rawNews.length > 0) {
      const capped = rawNews.slice(0, 60)
      const result = await classifyHeadlines(capped, symbol)
      news = attachSentiment(capped, result.classified)
    }

    const currentPrice = candles[candles.length - 1][4]
    const sector: Sector = crypto ? 'crypto' : mapIndustry(profile?.sector)

    const prediction = composeDPS({
      symbol,
      candles,
      news,
      analyst,
      macro,
      sector,
      currentPrice,
      earningsInDays: earningsDays,
      horizon,
    })

    await cacheSet('predict', key, prediction, CACHE_TTL.predict)
    return NextResponse.json<ApiEnvelope<DirectionalPrediction>>({
      data: prediction,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<DirectionalPrediction>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
