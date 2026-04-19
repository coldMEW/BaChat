// FRED macro snapshot: Fed rate, CPI, Dollar Index. Cache 24h.

import { NextResponse } from 'next/server'
import { fetchMacroSnapshot } from '@/lib/invest/fred'
import { CACHE_TTL, cacheGet, cacheSet } from '@/lib/invest/fs-cache'
import type { ApiEnvelope, MacroSnapshot } from '@/types'

export async function GET() {
  const cached = await cacheGet<MacroSnapshot>('macro', 'snapshot')
  if (cached) {
    return NextResponse.json<ApiEnvelope<MacroSnapshot>>({
      data: cached.data,
      error: null,
      cached: true,
      fetchedAt: cached.fetchedAt,
    })
  }
  try {
    const data = await fetchMacroSnapshot()
    await cacheSet('macro', 'snapshot', data, CACHE_TTL.macro)
    return NextResponse.json<ApiEnvelope<MacroSnapshot>>({
      data,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<MacroSnapshot>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
