'use client'

import { useEffect, useRef, useState } from 'react'
import type { Candle } from '@/types'

type Range = '1M' | '3M' | '6M' | '1Y' | '5Y'
const RANGE_DAYS: Record<Range, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '5Y': 1825 }

export function PriceChart({
  symbol,
  height,
  fill = false,
  minHeight = 280,
}: {
  symbol: string
  /** Explicit pixel height. If omitted and fill=true, chart fills its grid cell. */
  height?: number
  /** When true, chart autosizes to the parent container vertically (used when
   *  the neighbor column dictates row height). */
  fill?: boolean
  minHeight?: number
}) {
  // Separate the chart-target div from any overlay so lightweight-charts
  // doesn't fight with React's children on the same element.
  const chartTargetRef = useRef<HTMLDivElement | null>(null)
  const [range, setRange] = useState<Range>('3M')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [summary, setSummary] = useState<{ last: number; first: number } | null>(null)

  useEffect(() => {
    let destroyed = false
    let chart: { remove: () => void } | null = null
    let resizeObs: ResizeObserver | null = null

    async function load() {
      const target = chartTargetRef.current
      if (!target) return
      // Clear any previous chart DOM children
      while (target.firstChild) target.removeChild(target.firstChild)

      setLoading(true)
      setErr(null)
      setSummary(null)

      try {
        const res = await fetch(`/api/invest/prices/${encodeURIComponent(symbol)}?days=${RANGE_DAYS[range]}`)
        const json = await res.json()
        if (!res.ok || !json.data) {
          if (!destroyed) {
            setErr(json.error ?? 'No data')
            setLoading(false)
          }
          return
        }
        const candles: Candle[] = json.data
        if (destroyed) return

        const { createChart, CandlestickSeries, LineSeries } = await import('lightweight-charts')
        if (destroyed || !chartTargetRef.current) return

        const targetEl = chartTargetRef.current
        const initialH = height ?? Math.max(minHeight, targetEl.clientHeight || minHeight)
        const c = createChart(targetEl, {
          layout: {
            background: { color: 'transparent' },
            textColor: '#5E5C7A',
            fontFamily: "'Geist Sans', system-ui",
          },
          grid: {
            vertLines: { color: 'rgba(231, 226, 244, 0.8)' },
            horzLines: { color: 'rgba(231, 226, 244, 0.8)' },
          },
          rightPriceScale: { borderColor: 'rgba(231, 226, 244, 1)' },
          timeScale: {
            borderColor: 'rgba(231, 226, 244, 1)',
            timeVisible: true,
            secondsVisible: false,
          },
          crosshair: {
            vertLine: { color: '#7B61FF', width: 1, labelBackgroundColor: '#7B61FF' },
            horzLine: { color: '#7B61FF', width: 1, labelBackgroundColor: '#7B61FF' },
          },
          autoSize: fill,
          width: targetEl.clientWidth,
          height: initialH,
        })
        chart = c

        const series = c.addSeries(CandlestickSeries, {
          upColor: '#22D3AA',
          downColor: '#FF5E6C',
          borderUpColor: '#22D3AA',
          borderDownColor: '#FF5E6C',
          wickUpColor: '#22D3AA',
          wickDownColor: '#FF5E6C',
        })

        // Also draw a violet close-price line overlay for a "reference dashboard" feel
        const line = c.addSeries(LineSeries, {
          color: '#9D86FF',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        })

        type TimeTuple = { time: number; open: number; high: number; low: number; close: number }
        const data: TimeTuple[] = candles.map((cd) => ({
          time: Math.floor(cd[0] / 1000),
          open: cd[1],
          high: cd[2],
          low: cd[3],
          close: cd[4],
        }))
        // lightweight-charts v5 typings for time are complex; using unknown cast is intentional
        series.setData(data as unknown as Parameters<typeof series.setData>[0])
        line.setData(
          data.map((d) => ({ time: d.time, value: d.close })) as unknown as Parameters<typeof line.setData>[0],
        )

        c.timeScale().fitContent()
        setSummary({ first: data[0].close, last: data[data.length - 1].close })
        setLoading(false)

        // Keep it sized with the container (width always; height too when fill=true)
        if (typeof ResizeObserver !== 'undefined') {
          resizeObs = new ResizeObserver(() => {
            if (!chartTargetRef.current || destroyed) return
            const el = chartTargetRef.current
            const opts: { width: number; height?: number } = { width: el.clientWidth }
            if (fill) opts.height = Math.max(minHeight, el.clientHeight)
            c.applyOptions(opts)
          })
          resizeObs.observe(chartTargetRef.current)
        }
      } catch (e) {
        if (!destroyed) {
          setErr(e instanceof Error ? e.message : String(e))
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      destroyed = true
      resizeObs?.disconnect()
      chart?.remove()
    }
  }, [symbol, range, height, fill, minHeight])

  const pct = summary ? ((summary.last - summary.first) / summary.first) * 100 : 0

  return (
    <div className="surface-card p-5 flex flex-col" style={fill ? { height: '100%' } : undefined}>
      <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-semibold">{symbol} Chart</h3>
            {summary && (
              <span
                className={`chip ${pct >= 0 ? 'jade' : 'crimson'} font-mono`}
                style={{ fontSize: '0.72rem' }}
              >
                {pct >= 0 ? '+' : ''}
                {pct.toFixed(2)}%
              </span>
            )}
          </div>
          {summary && (
            <div className="text-xs text-[var(--text-muted)] font-mono">
              ${summary.first.toFixed(2)} → <span className="text-[var(--text-primary)]">${summary.last.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="inline-flex bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-full p-0.5">
          {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-mono rounded-full transition-colors ${
                range === r ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
              style={range === r ? { background: 'var(--accent-primary)' } : undefined}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`relative w-full ${fill ? 'flex-1' : ''}`}
        style={fill ? { minHeight } : { minHeight: height ?? minHeight }}
      >
        <div
          ref={chartTargetRef}
          className="w-full"
          style={fill ? { height: '100%', minHeight } : { height: height ?? minHeight }}
        />
        {loading && !err && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[var(--text-muted)] text-sm">
            Loading chart…
          </div>
        )}
        {err && (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--accent-crimson)] text-sm">
            {err}
          </div>
        )}
      </div>
    </div>
  )
}
