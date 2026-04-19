'use client'

import { useEffect, useRef, useState } from 'react'
import type { CashflowSeries } from '@/types'

type Range = CashflowSeries['range']
const RANGES: Range[] = ['today', '7d', '30d', 'year']
const RANGE_LABEL: Record<Range, string> = {
  today: 'Today', '7d': '7D', '30d': '30D', year: 'Year',
}

function fmtUSD(n: number, opts: { signed?: boolean } = {}): string {
  const sign = opts.signed && n > 0 ? '+' : ''
  const abs = Math.abs(n)
  if (abs >= 1000) return `${n < 0 ? '-' : sign}$${(abs / 1000).toFixed(1)}k`
  return `${n < 0 ? '-' : sign}$${abs.toFixed(0)}`
}

interface Props {
  cashflowByRange: Partial<Record<Range, CashflowSeries>>
  onRangeChange: (range: Range) => void
  defaultRange?: Range
}

export function CashflowChart({ cashflowByRange, onRangeChange, defaultRange = '30d' }: Props) {
  const [range, setRange] = useState<Range>(defaultRange)
  const targetRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(false)

  const series = cashflowByRange[range] ?? null

  useEffect(() => {
    onRangeChange(range)
  }, [range, onRangeChange])

  useEffect(() => {
    if (!series) return
    let destroyed = false
    let chart: { remove: () => void } | null = null

    ;(async () => {
      const target = targetRef.current
      if (!target) return
      while (target.firstChild) target.removeChild(target.firstChild)

      setLoading(true)
      const { createChart, AreaSeries } = await import('lightweight-charts')
      if (destroyed || !targetRef.current) return

      const targetEl = targetRef.current
      const c = createChart(targetEl, {
        layout: {
          background: { color: 'transparent' },
          textColor: '#5E5C7A',
          fontFamily: "'Geist Sans', system-ui",
        },
        grid: {
          vertLines: { color: 'rgba(231, 226, 244, 0.6)' },
          horzLines: { color: 'rgba(231, 226, 244, 0.6)' },
        },
        rightPriceScale: { borderColor: 'rgba(231, 226, 244, 1)' },
        timeScale: { borderColor: 'rgba(231, 226, 244, 1)', timeVisible: false },
        crosshair: {
          vertLine: { color: '#7B61FF', width: 1, labelBackgroundColor: '#7B61FF' },
          horzLine: { color: '#7B61FF', width: 1, labelBackgroundColor: '#7B61FF' },
        },
        autoSize: true,
      })
      chart = c

      const points = series.points.map((p) => ({
        time: p.date,
        value: p.cumulative,
      }))

      // Color the series by ending sign of cumulative
      const positive = series.totalChange >= 0
      const area = c.addSeries(AreaSeries, {
        lineColor: positive ? '#047857' : '#B91C1C',
        topColor:  positive ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.30)',
        bottomColor: positive ? 'rgba(16,185,129,0.02)' : 'rgba(239,68,68,0.02)',
        lineWidth: 2,
      })
      // ISO date strings are valid 'time' values for lightweight-charts v5+.
      area.setData(points as Parameters<typeof area.setData>[0])

      // Markers for best + worst day
      const markers: unknown[] = []
      if (series.bestDay) {
        markers.push({
          time: series.bestDay.date,
          position: 'aboveBar',
          color: '#047857',
          shape: 'circle',
          text: `+${fmtUSD(series.bestDay.netFlow)}`,
        })
      }
      if (series.worstDay) {
        markers.push({
          time: series.worstDay.date,
          position: 'belowBar',
          color: '#B91C1C',
          shape: 'circle',
          text: `${fmtUSD(series.worstDay.netFlow)}`,
        })
      }
      if (markers.length > 0) {
        try {
          // @ts-expect-error - setMarkers shape varies across versions
          area.setMarkers(markers)
        } catch {
          /* optional */
        }
      }

      c.timeScale().fitContent()
      setLoading(false)
    })()

    return () => {
      destroyed = true
      try { chart?.remove() } catch { /* noop */ }
    }
  }, [series])

  const totalChange = series?.totalChange ?? 0
  const totalPct = series?.totalChangePct ?? 0
  const positive = totalChange >= 0
  const changeColor = positive ? 'var(--accent-jade-deep)' : 'var(--accent-crimson-deep)'

  return (
    <div className="surface-card p-5 flex flex-col gap-4" style={{ minHeight: 340 }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="label">Cashflow</div>
          <div
            className="font-mono font-semibold tabular-nums mt-1"
            style={{ fontSize: 26, color: changeColor }}
          >
            {positive ? '+' : ''}{fmtUSD(totalChange)}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {positive ? '+' : ''}{totalPct.toFixed(1)}% · {RANGE_LABEL[range]}
            {series?.bestDay && series?.worstDay && (
              <>
                <span className="mx-2">·</span>
                best <span style={{ color: 'var(--accent-jade-deep)' }}>{fmtUSD(series.bestDay.netFlow, { signed: true })}</span>
                <span className="mx-1"> / worst </span>
                <span style={{ color: 'var(--accent-crimson-deep)' }}>{fmtUSD(series.worstDay.netFlow, { signed: true })}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all"
              style={{
                background: r === range ? 'var(--accent-primary)' : 'var(--bg-card-soft)',
                color: r === range ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1" style={{ minHeight: 220 }}>
        <div ref={targetRef} className="absolute inset-0" />
        {(!series || loading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Plotting cashflow…</span>
          </div>
        )}
      </div>
    </div>
  )
}
