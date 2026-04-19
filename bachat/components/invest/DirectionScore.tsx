'use client'

import { useEffect, useState } from 'react'
import type { DirectionalPrediction, Horizon } from '@/types'

export function DirectionScore({ symbol }: { symbol: string }) {
  const [horizon, setHorizon] = useState<Horizon>('30d')
  const [data, setData] = useState<DirectionalPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setErr(null)
      try {
        const res = await fetch(`/api/invest/predict/${encodeURIComponent(symbol)}?horizon=${horizon}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.data) {
          setErr(json.error ?? 'Prediction unavailable')
          setData(null)
        } else {
          setData(json.data)
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [symbol, horizon])

  const { bg, label, color } = directionStyle(data?.direction ?? 'neutral', data?.dps ?? 0)

  return (
    <div className="surface-card p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <div className="label mb-1">Directional score</div>
          <div className="text-xs text-[var(--text-muted)] font-mono">
            Model blend of technical + sentiment + analyst + macro
          </div>
        </div>
        <div className="inline-flex bg-[var(--bg-card-soft)] border border-[var(--border-soft)] rounded-full p-0.5">
          {(['7d', '30d', '90d'] as Horizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 text-xs font-mono rounded-full transition-colors ${
                horizon === h ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
              style={horizon === h ? { background: 'var(--accent-primary)' } : undefined}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[var(--text-muted)]">Running model across 4 signal families…</div>
      ) : err ? (
        <div className="py-12 text-center text-[var(--accent-crimson)]">Error: {err}</div>
      ) : data ? (
        <>
          <div className="flex items-center gap-6 mb-5">
            <ScoreGauge dps={data.dps} color={color} />
            <div>
              <div className="text-2xl font-lora font-semibold" style={{ color }}>
                {label}
              </div>
              <div className="text-sm text-[var(--text-secondary)] font-mono mt-1">
                Confidence {data.confidence}% {data.confidence < 50 ? '· low-confidence read' : ''}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                Generated {new Date(data.generatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {data.riskFlags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {data.riskFlags.map((f) => (
                <span key={f.code} className="chip amber">
                  ⚠ {f.label}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {data.drivers.map((d, i) => (
              <div
                key={`${d.family}:${i}`}
                className="flex items-start justify-between gap-3 py-2.5 border-b border-[var(--border-soft)] last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`chip ${
                        d.family === 'technical'
                          ? ''
                          : d.family === 'sentiment'
                            ? 'amber'
                            : d.family === 'analyst'
                              ? 'jade'
                              : 'muted'
                      }`}
                    >
                      {d.family}
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">{d.label}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">
                    {d.dataSource} · {new Date(d.asOf).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className={`font-mono text-sm font-semibold whitespace-nowrap ${
                    d.contribution > 0 ? 'delta-up' : d.contribution < 0 ? 'delta-down' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {d.contribution > 0 ? '+' : ''}
                  {d.contribution}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-[11px] text-[var(--text-muted)] leading-relaxed">{data.disclaimer}</p>
        </>
      ) : null}
    </div>
  )
}

function directionStyle(direction: string, dps: number): { bg: string; label: string; color: string } {
  switch (direction) {
    case 'strong_bullish':
      return { bg: 'var(--accent-jade-soft)', label: 'Strongly bullish', color: '#34D399' }
    case 'bullish':
      return { bg: 'var(--accent-jade-soft)', label: 'Bullish', color: '#6EE7B7' }
    case 'strong_bearish':
      return { bg: 'var(--accent-crimson-soft)', label: 'Strongly bearish', color: '#F87171' }
    case 'bearish':
      return { bg: 'var(--accent-crimson-soft)', label: 'Bearish', color: '#FCA5A5' }
    default:
      return { bg: 'var(--bg-card-soft)', label: dps >= 0 ? 'Neutral (slightly positive)' : 'Neutral (slightly negative)', color: 'var(--text-primary)' }
  }
}

function ScoreGauge({ dps, color }: { dps: number; color: string }) {
  // Semicircle gauge: -100 left, 0 top, +100 right
  const angle = (dps / 100) * 90   // -90..+90 degrees
  const r = 46
  const cx = 50
  const cy = 54
  const x = cx + r * Math.sin((angle * Math.PI) / 180)
  const y = cy - r * Math.cos((angle * Math.PI) / 180)
  return (
    <svg width="110" height="70" viewBox="0 0 100 70">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="var(--bg-card-soft)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fontFamily="'Geist Mono', monospace"
        fill={color}
      >
        {dps > 0 ? '+' : ''}
        {dps.toFixed(0)}
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fontSize="7"
        fontFamily="'Geist Mono', monospace"
        fill="var(--text-muted)"
      >
        DPS
      </text>
    </svg>
  )
}
