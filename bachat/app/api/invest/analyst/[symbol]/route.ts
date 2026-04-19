// Finnhub analyst consensus + price targets + recent rating changes.
// Cache: 24h disk-backed fs-cache.

import { NextRequest, NextResponse } from 'next/server'
import { fetchAnalystData } from '@/lib/invest/finnhub'
import { CACHE_TTL, cacheGet, cacheSet } from '@/lib/invest/fs-cache'
import type { AnalystData, ApiEnvelope } from '@/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const cached = await cacheGet<AnalystData>('analyst', symbol)
  if (cached) {
    return NextResponse.json<ApiEnvelope<AnalystData>>({
      data: cached.data,
      error: null,
      cached: true,
      fetchedAt: cached.fetchedAt,
    })
  }
  try {
    const data = await fetchAnalystData(symbol)
    if (!data) {
      return NextResponse.json<ApiEnvelope<AnalystData>>(
        { data: null, error: 'No analyst coverage', cached: false, fetchedAt: Date.now() },
        { status: 404 },
      )
    }
    await cacheSet('analyst', symbol, data, CACHE_TTL.analyst)
    return NextResponse.json<ApiEnvelope<AnalystData>>({
      data,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<AnalystData>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
