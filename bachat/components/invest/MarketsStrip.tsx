'use client'

import { useEffect, useState } from 'react'
import { Sparkline } from './Sparkline'
import type { Holding } from '@/types'

const WATCHLIST_DEFAULT = ['SPY', 'QQQ', 'GLD', 'TLT', 'ETH/USD']

interface MarketRow { symbol: string; price: number; changePct: number }

export function MarketsStrip({ holdings }: { holdings: Holding[] }) {
  const [rows, setRows] = useState<MarketRow[]>([])

  // Build the list: user's holdings (first 3) + top-4 anchor watchlist, deduped
  const symbols = Array.from(
    new Set([...holdings.slice(0, 3).map((h) => h.symbol), ...WATCHLIST_DEFAULT]),
  ).slice(0, 6)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const fetched = await Promise.all(
        symbols.map(async (sym) => {
          try {
            const res = await fetch(`/api/invest/prices/${encodeURIComponent(sym)}?days=5`)
            const json = await res.json()
            const candles: number[][] = json.data ?? []
            if (candles.length < 2) return null
            const latest = candles[candles.length - 1][4]
            const prev = candles[candles.length - 2][4]
            return { symbol: sym, price: latest, changePct: ((latest - prev) / prev) * 100 } as MarketRow
          } catch {
            return null
          }
        }),
      )
      if (cancelled) return
      setRows(fetched.filter((r): r is MarketRow => r !== null))
    })()
    return () => { cancelled = true }
  }, [symbols.join(',')])

  return (
    <div className="surface-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Markets</h3>
        <div className="flex gap-2 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="text-[var(--text-primary)]">USD</span>
          <span>EUR</span>
          <span>BTC</span>
        </div>
      </div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.symbol} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-mono">
                {r.symbol}
                <span className={`ml-2 ${r.changePct >= 0 ? 'delta-up' : 'delta-down'}`}>
                  {r.changePct >= 0 ? '+' : ''}
                  {r.changePct.toFixed(2)}%
                </span>
              </div>
              <div className="font-mono text-sm text-[var(--text-primary)] mt-0.5">
                {r.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                <span className="text-[var(--text-muted)] text-[11px]">USD</span>
              </div>
            </div>
            <Sparkline symbol={r.symbol} width={80} height={28} days={30} />
          </li>
        ))}
        {rows.length === 0 && <li className="text-[var(--text-muted)] text-sm">Loading…</li>}
      </ul>
    </div>
  )
}
