'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Candle, Holding } from '@/types'
import { db } from '@/lib/db'
import { DEMO_USER_ID } from '@/lib/demo-seed'

interface HoldingSummary {
  holding: Holding
  last: number
  change24h: number
  changePct: number
}

export function MiniInvestStrip() {
  const [summaries, setSummaries] = useState<HoldingSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const holdings = await db().holdings.where('userId').equals(DEMO_USER_ID).toArray()
      // Sort by current value (shares * costBasis is a fine proxy; we overwrite with last price once known)
      holdings.sort((a, b) => b.shares * b.costBasis - a.shares * a.costBasis)
      const top = holdings.slice(0, 3)

      const results = await Promise.all(
        top.map(async (h): Promise<HoldingSummary> => {
          try {
            const res = await fetch(`/api/invest/prices/${encodeURIComponent(h.symbol)}?days=7`)
            const json = await res.json()
            const candles = (json.data as Candle[]) ?? []
            const last = candles[candles.length - 1]?.[4] ?? h.costBasis
            const prev = candles[candles.length - 2]?.[4] ?? last
            const change24h = last - prev
            const changePct = prev > 0 ? (change24h / prev) * 100 : 0
            return { holding: h, last, change24h, changePct }
          } catch {
            return { holding: h, last: h.costBasis, change24h: 0, changePct: 0 }
          }
        }),
      )
      if (!cancelled) {
        setSummaries(results)
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="surface-card p-5 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <div className="label">Investments</div>
        <Link href="/invest" className="text-[11px] font-medium" style={{ color: 'var(--accent-primary-deep)' }}>
          View all →
        </Link>
      </div>
      {loading && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading…</div>
      )}
      {!loading && summaries.length === 0 && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No holdings yet. <Link href="/invest" style={{ color: 'var(--accent-primary-deep)' }}>Add some.</Link>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {summaries.map(({ holding, last, changePct }) => {
          const up = changePct >= 0
          return (
            <Link
              key={holding.id ?? holding.symbol}
              href={`/invest?focus=${encodeURIComponent(holding.symbol)}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg transition-all hover:shadow"
              style={{ background: 'var(--bg-card-soft)' }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {holding.symbol}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {holding.shares} shares
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-mono font-medium text-sm tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  ${last.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span
                  className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded"
                  style={{
                    background: up ? 'var(--accent-jade-soft)' : 'var(--accent-crimson-soft)',
                    color: up ? 'var(--accent-jade-deep)' : 'var(--accent-crimson-deep)',
                  }}
                >
                  {up ? '+' : ''}{changePct.toFixed(2)}%
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
