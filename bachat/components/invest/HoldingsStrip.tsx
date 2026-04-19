'use client'

import { useEffect, useState } from 'react'
import type { Candle, Holding } from '@/types'

interface LiveQuote { price: number; changePct: number }

function deriveQuote(candles: Candle[] | undefined): LiveQuote | null {
  if (!candles || candles.length < 2) return null
  const latest = candles[candles.length - 1][4]
  const prev = candles[candles.length - 2][4]
  return { price: latest, changePct: ((latest - prev) / prev) * 100 }
}

async function fetchQuote(symbol: string): Promise<LiveQuote | null> {
  const res = await fetch(`/api/invest/prices/${encodeURIComponent(symbol)}?days=5`)
  if (!res.ok) return null
  const json = await res.json()
  return deriveQuote(json.data ?? [])
}

function symbolDot(sym: string) {
  const colors: Record<string, string> = {
    NVDA: '#76B900', AAPL: '#A2AAAD', VTI: '#C11F2E', BTC: '#F7931A', ETH: '#627EEA',
    SOL: '#14F195', MSFT: '#00A4EF', TSLA: '#CC0000', GOOGL: '#EA4335', AMZN: '#FF9900',
    AMD: '#ED1C24', QQQ: '#00AE4D',
  }
  const key = sym.replace('/USD', '').toUpperCase()
  const bg = colors[key] ?? '#7B61FF'
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-none"
      style={{ background: bg, opacity: 0.92 }}
    >
      {key.charAt(0)}
    </div>
  )
}

export function HoldingsStrip({
  holdings,
  selected,
  onSelect,
  preloadedCandles,
}: {
  holdings: Holding[]
  selected: string | null
  onSelect: (symbol: string) => void
  preloadedCandles?: Record<string, Candle[]>
}) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote | null>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        holdings.map(async (h): Promise<readonly [string, LiveQuote | null]> => {
          const pre = preloadedCandles?.[h.symbol]
          if (pre && pre.length >= 2) return [h.symbol, deriveQuote(pre)] as const
          const q = await fetchQuote(h.symbol).catch(() => null)
          return [h.symbol, q] as const
        }),
      )
      if (cancelled) return
      const map: Record<string, LiveQuote | null> = {}
      for (const [s, q] of entries) map[s] = q
      setQuotes(map)
    })()
    return () => { cancelled = true }
  }, [holdings.map((h) => h.symbol).join(','), preloadedCandles])

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 px-1">
      {holdings.map((h) => {
        const q = quotes[h.symbol]
        const isSel = selected === h.symbol
        return (
          <button
            key={h.id}
            onClick={() => onSelect(h.symbol)}
            className={`holding-chip text-left ${isSel ? 'selected' : ''}`}
          >
            {symbolDot(h.symbol)}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {h.symbol.replace('/USD', '')}
                </span>
                {q && (
                  <span className={`font-mono text-[11px] ${q.changePct >= 0 ? 'delta-up' : 'delta-down'}`}>
                    {q.changePct >= 0 ? '+' : ''}
                    {q.changePct.toFixed(2)}%
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {h.shares} sh
                </span>
                <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                  {q ? `$${q.price.toFixed(2)}` : '—'}
                </span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
