// Daily OHLC for an equity/ETF (Twelve Data) or crypto (CoinGecko).
// Cache: 24h disk-backed fs-cache.

import { NextRequest, NextResponse } from 'next/server'
import { fetchTimeSeries } from '@/lib/invest/twelvedata'
import { fetchCryptoCandles } from '@/lib/invest/coingecko'
import { CACHE_TTL, cacheGet, cacheSet } from '@/lib/invest/fs-cache'
import type { ApiEnvelope, Candle } from '@/types'

function isCrypto(symbol: string): boolean {
  const up = symbol.toUpperCase()
  return /^(BTC|ETH|SOL|ADA|DOT|AVAX|MATIC|LINK|UNI|DOGE|XRP|LTC|BCH|ATOM|NEAR)(\/USD|\/USDT)?$/.test(up)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const url = new URL(req.url)
  const days = parseInt(url.searchParams.get('days') ?? '365', 10)
  const interval = (url.searchParams.get('interval') ?? '1d') as '1d' | '1h' | '1week'
  const key = `${symbol}:${interval}:${days}`

  const cached = await cacheGet<Candle[]>('prices', key)
  if (cached) {
    return NextResponse.json<ApiEnvelope<Candle[]>>({
      data: cached.data,
      error: null,
      cached: true,
      fetchedAt: cached.fetchedAt,
    })
  }

  try {
    const candles = isCrypto(symbol)
      ? await fetchCryptoCandles(symbol, days)
      : await fetchTimeSeries(symbol, interval, days)
    await cacheSet('prices', key, candles, CACHE_TTL.prices)
    return NextResponse.json<ApiEnvelope<Candle[]>>({
      data: candles,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<Candle[]>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
