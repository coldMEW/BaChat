'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Account } from '@/types'
import type { BudgetScoreResult } from '@/lib/budget/types'
import { modeLabel } from '@/lib/budget/score-engine'
import { BudgetProgressRing } from './BudgetProgressRing'
import { BudgetScoreParts } from './BudgetScoreParts'

interface Props {
  result: BudgetScoreResult
  account: Account | null
}

function scoreColor(score: number): string {
  if (score >= 28) return 'var(--accent-jade)'
  if (score >= 18) return 'var(--accent-amber)'
  return 'var(--accent-crimson)'
}

function creditTier(score: number): { label: string; color: string; pct: number } {
  if (score >= 750) return { label: 'Excellent',  color: 'var(--accent-jade-deep)', pct: 1    }
  if (score >= 700) return { label: 'Good',        color: 'var(--accent-jade)',      pct: 0.85 }
  if (score >= 670) return { label: 'Fair+',       color: 'var(--accent-amber)',     pct: 0.70 }
  if (score >= 580) return { label: 'Fair',        color: 'var(--accent-amber)',     pct: 0.50 }
  return               { label: 'Needs work',  color: 'var(--accent-crimson)',   pct: 0.30 }
}

function fmt(n: number) {
  return '$' + n.toLocaleString()
}

export function BudgetScoreOverview({ result, account }: Props) {
  const sc      = scoreColor(result.score)
  const netColor = result.netSav >= 20 ? 'var(--accent-jade-deep)'
    : result.netSav >= 10 ? 'var(--accent-amber)'
    : 'var(--accent-crimson-deep)'
  const debtColor = result.dP > 20 ? 'var(--accent-crimson-deep)'
    : result.dP > 10 ? 'var(--accent-amber)'
    : 'var(--text-primary)'

  return (
    <div className="surface-card flex flex-col gap-5 p-5">
      {/* Gauge */}
      <div className="flex flex-col items-center gap-2">
        <p className="label self-start">Pulse score</p>
        <BudgetProgressRing
          value={result.score / 37}
          size={148}
          stroke={12}
          color={sc}
          label={String(result.score)}
          sublabel="/ 37"
        />
        {result.mode !== 'standard' && (
          <span className={`chip ${result.mode === 'survival' ? 'crimson' : 'amber'}`}>
            {modeLabel(result.mode)}
          </span>
        )}
      </div>

      {/* Score breakdown bars */}
      <div>
        <p className="label mb-2">Bucket vs ideal</p>
        <BudgetScoreParts result={result} />
      </div>

      {/* Quick stats 2×2 */}
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Income"       value={fmt(result.income)}    color="var(--accent-jade-deep)" />
        <StatBox label="Net savings"  value={`${result.netSav}%`}   color={netColor} />
        <StatBox label="Debt ratio"   value={`${result.dP}%`}       color={debtColor} />
        <StatBox label="Impulse pen." value={`-${result.impPen} pts`} color="var(--accent-crimson-deep)" />
      </div>

      {/* Credit score row */}
      {account?.creditScore ? (() => {
        const tier = creditTier(account.creditScore)
        return (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="label">Credit score</span>
              <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: tier.color }}>
                {account.creditScore}
                <span className="ml-1 text-[10px] font-medium uppercase" style={{ color: 'var(--text-muted)' }}>
                  {tier.label}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-soft)' }}>
              <div style={{ width: `${tier.pct * 100}%`, height: '100%', background: tier.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )
      })() : null}

      {/* Bottom link → dashboard */}
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-1 rounded-full py-2 text-xs font-semibold transition-colors"
        style={{ color: 'var(--accent-primary-deep)', background: 'var(--accent-primary-soft)' }}
      >
        View full Dashboard <ChevronRight size={13} />
      </Link>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="surface-inner rounded-xl p-2.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums" style={{ color }}>{value}</p>
    </div>
  )
}
