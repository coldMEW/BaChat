'use client'

import type { CreditProjection } from '@/types'

interface Props {
  score: number              // 0..100, higher = worse
  burnt30d: number           // USD
  creditProjection?: CreditProjection | null
  onConfigureCredit?: () => void
}

function interpretLabel(score: number): string {
  if (score >= 60) return 'Heavy impulse'
  if (score >= 35) return 'Some impulse'
  if (score >= 15) return 'Mostly steady'
  return 'Pristine'
}

/** Return colors interpolated jade → amber → crimson as score climbs. */
function ringColor(score: number): { stroke: string; glow: string } {
  if (score >= 60) return { stroke: 'var(--accent-crimson)', glow: 'rgba(239,68,68,0.25)' }
  if (score >= 35) return { stroke: 'var(--accent-amber)',   glow: 'rgba(245,158,11,0.25)' }
  if (score >= 15) return { stroke: 'var(--accent-primary)', glow: 'rgba(123,97,255,0.25)' }
  return { stroke: 'var(--accent-jade)', glow: 'rgba(16,185,129,0.25)' }
}

export function ImpulseScoreRing({ score, burnt30d, creditProjection, onConfigureCredit }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  const { stroke, glow } = ringColor(clamped)

  // Credit projection block — use the 30-day horizon if available
  const horizon = creditProjection?.horizons[0]
  const current = creditProjection ? Math.round(creditProjection.currentScore) : null
  const projected = horizon ? Math.round(horizon.projectedScore) : null
  const delta = horizon ? Math.round(horizon.delta) : 0
  // Higher projected score is good (up, jade). Lower is bad (down, crimson).
  const creditUp = delta > 0
  const creditFlat = delta === 0
  const creditColor = creditFlat
    ? 'var(--text-muted)'
    : creditUp ? 'var(--accent-jade-deep)' : 'var(--accent-crimson-deep)'
  const arrow = creditFlat ? '→' : creditUp ? '↑' : '↓'

  return (
    <div className="surface-card flex flex-col items-center gap-3 py-5 px-4 h-full min-w-0">
      <div className="label">Impulse Score</div>
      <div className="relative" style={{ width: 128, height: 128, filter: `drop-shadow(0 0 12px ${glow})` }}>
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--border-soft)" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 64 64)"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1), stroke 0.4s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="font-mono font-semibold tabular-nums"
            style={{ fontSize: 38, color: 'var(--text-primary)', lineHeight: 1 }}
          >
            {clamped}
          </div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            of 100
          </div>
        </div>
      </div>
      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {interpretLabel(clamped)}
      </div>
      <div className="text-[11px] text-center" style={{ color: 'var(--text-secondary)' }}>
        Burnt <span className="font-mono font-medium" style={{ color: 'var(--accent-crimson)' }}>${burnt30d.toFixed(0)}</span> last 30 days
      </div>

      {/* Credit trajectory — inline, compact */}
      <div
        className="w-full mt-1 pt-3 flex flex-col gap-1.5"
        style={{ borderTop: '1px solid var(--border-soft)' }}
      >
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          <span>Credit · 30d</span>
          {creditProjection && (
            <span style={{ color: 'var(--text-muted)' }}>
              util {(horizon!.projectedUtilization * 100).toFixed(0)}%
            </span>
          )}
        </div>
        {creditProjection && current !== null && projected !== null ? (
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex flex-col items-start min-w-0">
              <div
                className="font-mono font-semibold tabular-nums truncate"
                style={{ fontSize: 18, color: 'var(--text-primary)' }}
              >
                {current}
              </div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>now</div>
            </div>
            <div className="flex flex-col items-center shrink-0" style={{ color: creditColor }}>
              <div className="font-mono font-semibold" style={{ fontSize: 18, lineHeight: 1 }}>
                {arrow}
              </div>
              <div className="text-[9px] font-mono tabular-nums">
                {creditFlat ? '±0' : `${delta > 0 ? '+' : ''}${delta}`}
              </div>
            </div>
            <div className="flex flex-col items-end min-w-0">
              <div
                className="font-mono font-semibold tabular-nums truncate"
                style={{ fontSize: 18, color: creditColor }}
              >
                {projected}
              </div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>projected</div>
            </div>
          </div>
        ) : (
          <button
            onClick={onConfigureCredit}
            className="text-[11px] px-2 py-1 rounded-md text-left"
            style={{ background: 'var(--bg-card-soft)', color: 'var(--accent-primary-deep)' }}
          >
            + Set up credit tracking
          </button>
        )}
      </div>
    </div>
  )
}
