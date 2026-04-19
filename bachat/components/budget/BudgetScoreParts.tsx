'use client'

import type { BudgetScoreResult } from '@/lib/budget/types'

interface Props { result: BudgetScoreResult }

interface Row {
  key: string; label: string
  actual: number; ideal: number
  color: string; goodWhenLower: boolean
}

export function BudgetScoreParts({ result }: Props) {
  const rows: Row[] = [
    { key: 'needs',   label: 'Needs',       actual: result.nP,     ideal: result.needsIdeal,    color: 'var(--accent-info)',    goodWhenLower: true  },
    { key: 'wants',   label: 'Wants',       actual: result.wP,     ideal: result.adjWantsIdeal, color: 'var(--accent-amber)',   goodWhenLower: true  },
    { key: 'savings', label: 'Net savings', actual: result.netSav, ideal: result.adjSavingsIdeal, color: 'var(--accent-jade)', goodWhenLower: false },
    { key: 'debt',    label: 'Debt',        actual: result.dP,     ideal: 10,                   color: 'var(--accent-crimson)', goodWhenLower: true  },
  ]
  const max = Math.max(60, ...rows.map((r) => Math.max(r.actual, r.ideal) + 5))

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => {
        const onTrack = r.goodWhenLower ? r.actual <= r.ideal : r.actual >= r.ideal
        const actualPct = (Math.max(0, r.actual) / max) * 100
        const idealPct  = (r.ideal / max) * 100
        return (
          <div key={r.key}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                {r.label}
              </span>
              <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: onTrack ? 'var(--accent-jade-deep)' : 'var(--accent-crimson-deep)' }}>
                {r.actual}% / {r.ideal}%
              </span>
            </div>
            <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-soft)' }}>
              <div style={{ width: `${actualPct}%`, height: '100%', background: r.color, transition: 'width 0.5s ease' }} />
              <div className="absolute top-[-2px] h-[10px] w-[2px]" style={{ left: `${idealPct}%`, background: 'var(--text-secondary)', borderRadius: 1, opacity: 0.5 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
