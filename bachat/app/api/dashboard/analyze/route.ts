// POST /api/dashboard/analyze
// Body: { transactions: Transaction[], account?: Account, cashflowRange?: ... }
// Returns: ApiEnvelope<Omit<DashboardPayload, 'roast'>> (roast is a separate call)

import { NextRequest, NextResponse } from 'next/server'
import { composeDashboard } from '@/lib/dashboard/analyze'
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/invest/fs-cache'
import type {
  Account,
  ApiEnvelope,
  CashflowSeries,
  DashboardPayload,
  Transaction,
} from '@/types'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

interface AnalyzeBody {
  transactions: Transaction[]
  account?: Account | null
  cashflowRange?: CashflowSeries['range']
  monthlyBudget?: number
}

function hashInputs(body: AnalyzeBody): string {
  const keyed = {
    tx: body.transactions
      .map((t) => `${t.id ?? 0}:${t.timestamp}:${t.amount}:${t.category}`)
      .sort()
      .join('|'),
    account: body.account
      ? `${body.account.creditScore}:${body.account.creditLimit}:${body.account.currentBalance}:${body.account.monthlyPaymentPct}`
      : 'none',
    range: body.cashflowRange ?? '30d',
  }
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(keyed))
    .digest('hex')
    .slice(0, 20)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeBody
    if (!Array.isArray(body?.transactions)) {
      return NextResponse.json<ApiEnvelope<Omit<DashboardPayload, 'roast'>>>(
        { data: null, error: 'Missing transactions array', cached: false, fetchedAt: Date.now() },
        { status: 400 },
      )
    }

    const cacheKey = hashInputs(body)
    const cached = await cacheGet<Omit<DashboardPayload, 'roast'>>('impulse', cacheKey)
    if (cached) {
      return NextResponse.json<ApiEnvelope<Omit<DashboardPayload, 'roast'>>>({
        data: cached.data,
        error: null,
        cached: true,
        fetchedAt: cached.fetchedAt,
      })
    }

    const payload = composeDashboard({
      transactions: body.transactions,
      account: body.account ?? null,
      cashflowRange: body.cashflowRange,
      monthlyBudget: body.monthlyBudget,
    })
    await cacheSet('impulse', cacheKey, payload, CACHE_TTL.impulse)

    return NextResponse.json<ApiEnvelope<Omit<DashboardPayload, 'roast'>>>({
      data: payload,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<Omit<DashboardPayload, 'roast'>>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
