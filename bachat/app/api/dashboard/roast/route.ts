// POST /api/dashboard/roast
// Body: { subjectTx: Transaction, impulseScore, burnt30d, weekOverWeekBurntChange, redirectSymbol, redirectAmount }
// Returns: ApiEnvelope<RoastPayload>

import { NextRequest, NextResponse } from 'next/server'
import { generateRoast, type RoastInputs } from '@/lib/dashboard/roast'
import type { ApiEnvelope, RoastPayload } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RoastInputs
    if (!body?.subjectTx) {
      return NextResponse.json<ApiEnvelope<RoastPayload>>(
        { data: null, error: 'Missing subjectTx', cached: false, fetchedAt: Date.now() },
        { status: 400 },
      )
    }
    const payload = await generateRoast(body)
    return NextResponse.json<ApiEnvelope<RoastPayload>>({
      data: payload,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<RoastPayload>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
