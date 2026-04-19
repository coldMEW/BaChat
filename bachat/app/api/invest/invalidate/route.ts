// POST /api/invest/invalidate
// Clears both memory and disk cache. Optional `?bucket=prices` to scope.
// Called by the UI's Refresh button to force-fetch fresh data on the next request.

import { NextRequest, NextResponse } from 'next/server'
import { cacheClear } from '@/lib/invest/fs-cache'

const ALL_BUCKETS = [
  'upstream',  // shared cache wrapping the API clients
  'prices',
  'news',
  'analyst',
  'peers',
  'macro',
  'graph',
  'predict',
  'portfolio',
]

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const bucket = url.searchParams.get('bucket')
  const buckets = bucket ? [bucket] : ALL_BUCKETS
  for (const b of buckets) {
    await cacheClear(b)
  }
  return NextResponse.json({ ok: true, cleared: buckets, at: Date.now() })
}
