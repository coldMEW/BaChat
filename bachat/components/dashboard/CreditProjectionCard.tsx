'use client'

import { useState } from 'react'
import type { CreditProjection } from '@/types'

interface Props {
  projection: CreditProjection | null
  onConfigure: () => void
}

export function CreditProjectionCard({ projection, onConfigure }: Props) {
  const [horizonIdx, setHorizonIdx] = useState(0)

  if (!projection) {
    return (
      <div className="surface-card p-5 flex flex-col gap-3 h-full">
        <div className="label">Credit trajectory</div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Set up credit tracking to see how this spending pace will affect your score.
        </div>
        <button className="btn-primary self-start mt-auto" onClick={onConfigure}>
          Set up credit tracking
        </button>
      </div>
    )
  }

  const h = projection.horizons[horizonIdx]
  const deltaRounded = Math.round(h.delta)
  const deltaText = deltaRounded === 0 ? 'On track' : `${deltaRounded}`
  const deltaColor = h.onTrack ? 'var(--accent-jade-deep)' : 'var(--accent-crimson-deep)'

  const uNow = projection.currentUtilization
  const uProjected = h.projectedUtilization
  const barPct = (u: number) => Math.min(100, Math.max(0, u * 100))

  return (
    <div className="surface-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-baseline justify-between">
        <div className="label">Credit trajectory</div>
        <div className="flex gap-1">
          {projection.horizons.map((row, i) => (
            <button
              key={row.days}
              className={`text-[11px] px-2 py-1 rounded-md font-medium transition-all ${
                i === horizonIdx ? 'shadow-sm' : ''
              }`}
              onClick={() => setHorizonIdx(i)}
              style={{
                background: i === horizonIdx ? 'var(--accent-primary)' : 'var(--bg-card-soft)',
                color: i === horizonIdx ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {row.days}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Current</div>
          <div className="font-mono font-semibold tabular-nums truncate" style={{ fontSize: 22, color: 'var(--text-primary)' }}>
            {Math.round(projection.currentScore)}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Util {(uNow * 100).toFixed(0)}%
          </div>
        </div>
        <div className="flex-1 text-center min-w-0" style={{ color: deltaColor }}>
          <div className="font-mono font-semibold tabular-nums truncate" style={{ fontSize: 20 }}>
            {h.onTrack ? '→' : deltaText}
          </div>
          <div className="text-[10px] uppercase tracking-wider">
            in {h.days} days
          </div>
        </div>
        <div className="flex-1 text-right min-w-0">
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Projected</div>
          <div
            className="font-mono font-semibold tabular-nums truncate"
            style={{ fontSize: 22, color: h.onTrack ? 'var(--text-primary)' : 'var(--accent-crimson-deep)' }}
          >
            {Math.round(h.projectedScore)}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Util {(uProjected * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Utilization bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>0%</span><span>30%</span><span>75%</span><span>100%</span>
        </div>
        <div className="relative h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--border-soft)' }}>
          <div
            className="absolute top-0 h-full"
            style={{
              width: `${barPct(uProjected)}%`,
              background: uProjected > 0.3 ? 'var(--accent-crimson)' : 'var(--accent-jade)',
              transition: 'width 0.5s',
            }}
          />
          <div
            className="absolute top-0 h-full w-0.5"
            style={{ left: `${barPct(uNow)}%`, background: 'var(--accent-primary-deep)' }}
            title={`Current utilization: ${(uNow * 100).toFixed(0)}%`}
          />
        </div>
      </div>

      <div className="text-[10px] italic mt-auto" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {projection.disclaimer}
      </div>
    </div>
  )
}
