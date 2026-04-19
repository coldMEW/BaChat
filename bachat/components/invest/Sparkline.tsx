'use client'

import { useEffect, useState } from 'react'
import type { Candle } from '@/types'

export function Sparkline({ symbol, width = 100, height = 28, days = 30 }: { symbol: string; width?: number; height?: number; days?: number }) {
  const [path, setPath] = useState<string>('')
  const [color, setColor] = useState<string>('#A4A2C7')
  const [err, setErr] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/invest/prices/${encodeURIComponent(symbol)}?days=${days}`)
        const json = await res.json()
        if (cancelled || !json.data) {
          if (!cancelled) setErr(true)
          return
        }
        const candles: Candle[] = json.data
        if (candles.length < 2) {
          if (!cancelled) setErr(true)
          return
        }
        const closes = candles.map((c) => c[4])
        const min = Math.min(...closes)
        const max = Math.max(...closes)
        const span = max - min || 1
        const stepX = width / (closes.length - 1)
        const points = closes.map((v, i) => {
          const x = i * stepX
          const y = height - ((v - min) / span) * height
          return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        setPath('M' + points.join(' L'))
        setColor(closes[closes.length - 1] >= closes[0] ? '#22D3AA' : '#FF5E6C')
      } catch {
        if (!cancelled) setErr(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [symbol, width, height, days])

  if (err) return <div style={{ width, height }} className="text-[10px] text-[var(--text-muted)] font-mono">n/a</div>

  return (
    <svg width={width} height={height} className="flex-none">
      {path && <path d={path} stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
  )
}
