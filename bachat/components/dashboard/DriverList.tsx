'use client'

import type { ImpulseDriver } from '@/types'

const FAMILY_LABEL: Record<ImpulseDriver['family'], string> = {
  amount: 'Amount',
  timing: 'Timing',
  burst: 'Burst',
  category: 'Mix',
  payday: 'Payday',
}

export function DriverList({ drivers }: { drivers: ImpulseDriver[] }) {
  if (drivers.length === 0) {
    return (
      <div className="surface-card p-5 h-full flex items-center justify-center">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No impulse signal — nothing to break down.
        </div>
      </div>
    )
  }
  const max = Math.max(...drivers.map((d) => Math.abs(d.contribution)), 1)
  return (
    <div className="surface-card p-5 h-full flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div className="label">How we got that score</div>
        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>5 signals</div>
      </div>
      <div className="flex flex-col gap-3 mt-1">
        {drivers.map((d, i) => {
          const pct = Math.abs(d.contribution) / max
          const signed = d.contribution >= 0 ? `+${d.contribution}` : `${d.contribution}`
          const barColor = d.contribution > 0 ? 'var(--accent-crimson)' : 'var(--accent-jade)'
          return (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="chip" style={{ fontSize: 10 }}>{FAMILY_LABEL[d.family]}</span>
                    <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                      {d.label}
                    </span>
                  </div>
                </div>
                <div
                  className="font-mono font-semibold tabular-nums text-[13px] whitespace-nowrap"
                  style={{ color: d.contribution > 0 ? 'var(--accent-crimson-deep)' : 'var(--accent-jade-deep)' }}
                >
                  {signed}
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--border-soft)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct * 100}%`,
                    background: barColor,
                    transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
