'use client'

import { useEffect, useState } from 'react'
import type { Candle, Holding } from '@/types'

interface Snapshot {
  totalValue: number
  totalCost: number
  totalGain: number
  totalGainPct: number
  count: number
  series: number[]
}

export function OverviewCard({
  holdings,
  preloadedCandles,
}: {
  holdings: Holding[]
  preloadedCandles?: Record<string, Candle[]>
}) {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      if (holdings.length === 0) {
        setSnap({ totalValue: 0, totalCost: 0, totalGain: 0, totalGainPct: 0, count: 0, series: [] })
        setLoading(false)
        return
      }

      // Fetch only holdings not already in preloaded map
      const rows = await Promise.all(
        holdings.map(async (h): Promise<{ h: Holding; candles: Candle[] }> => {
          const pre = preloadedCandles?.[h.symbol]
          if (pre && pre.length > 0) return { h, candles: pre }
          try {
            const res = await fetch(`/api/invest/prices/${encodeURIComponent(h.symbol)}?days=30`)
            const json = await res.json()
            return { h, candles: (json.data as Candle[]) ?? [] }
          } catch {
            return { h, candles: [] }
          }
        }),
      )
      if (cancelled) return

      const totalCost = holdings.reduce((a, h) => a + h.shares * h.costBasis, 0)
      let totalValue = 0
      const lens = rows.map((r) => r.candles.length).filter((n) => n > 0)
      const minLen = lens.length > 0 ? Math.min(...lens) : 0
      const series: number[] = new Array(minLen).fill(0)
      for (const { h, candles } of rows) {
        const trimmed = candles.slice(-minLen)
        for (let i = 0; i < minLen; i++) series[i] += trimmed[i][4] * h.shares
        if (candles.length > 0) totalValue += candles[candles.length - 1][4] * h.shares
      }
      const totalGain = totalValue - totalCost
      const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
      setSnap({
        totalValue,
        totalCost,
        totalGain,
        totalGainPct,
        count: holdings.length,
        series,
      })
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [holdings.map((h) => `${h.symbol}:${h.shares}`).join('|'), preloadedCandles])

  return (
    <div className="surface-card p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="label">Overview</div>
        <button className="text-[var(--text-muted)] text-lg leading-none">⋮</button>
      </div>

      {loading || !snap ? (
        <div className="text-[var(--text-muted)] text-sm">Loading portfolio…</div>
      ) : (
        <>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="stat-value text-3xl">{snap.count}</span>
            <span className="text-[var(--text-secondary)] text-sm">holdings</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono mb-5">equities · ETFs · crypto</div>

          <div className="label mb-1">Current balance</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="stat-value text-4xl">
              ${snap.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="chip muted font-mono text-[10px]">USD</span>
          </div>
          <div className="flex items-baseline gap-2 mb-5">
            <span className={`font-mono text-sm ${snap.totalGain >= 0 ? 'delta-up' : 'delta-down'}`}>
              {snap.totalGain >= 0 ? '+' : ''}${Math.abs(snap.totalGain).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className={`font-mono text-xs ${snap.totalGain >= 0 ? 'delta-up' : 'delta-down'}`}>
              {snap.totalGainPct >= 0 ? '+' : ''}
              {snap.totalGainPct.toFixed(2)}%
            </span>
            <span className="text-[var(--text-muted)] text-xs">all time</span>
          </div>

          {snap.series.length > 2 && <PortfolioSpark series={snap.series} />}
        </>
      )}
    </div>
  )
}

function PortfolioSpark({ series }: { series: number[] }) {
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const w = 260
  const h = 60
  const stepX = w / (series.length - 1)
  const points = series.map((v, i) => {
    const x = i * stepX
    const y = h - ((v - min) / span) * h
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const path = 'M' + points.join(' L')
  const up = series[series.length - 1] >= series[0]
  const color = up ? '#10B981' : '#EF4444'
  return (
    <div className="mt-auto">
      <div className="label mb-2">Last 30 days</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
        <defs>
          <linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`${path} L${w},${h} L0,${h} Z`} fill="url(#pfGrad)" />
        <path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  )
}
