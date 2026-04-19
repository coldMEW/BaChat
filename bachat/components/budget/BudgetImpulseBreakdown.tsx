'use client'

import type { ImpulseAnalysis, Transaction } from '@/types'
import type { BudgetScoreResult, BudgetSuggestion } from '@/lib/budget/types'
import { ImpulseScoreRing } from '@/components/dashboard/ImpulseScoreRing'
import { DriverList } from '@/components/dashboard/DriverList'
import { BudgetSuggestionsPanel } from '@/components/budget/BudgetSuggestionsPanel'

interface Props {
  impulse: ImpulseAnalysis | null
  transactions: Transaction[]
  scoreResult: BudgetScoreResult
  suggestions: BudgetSuggestion[]
}

function fmtUsd(n: number) {
  return '$' + Math.round(n).toLocaleString()
}

export function BudgetImpulseBreakdown({ impulse, transactions, scoreResult, suggestions }: Props) {
  const cutoff     = Date.now() - 30 * 86400 * 1000
  const last30     = transactions.filter((t) => t.timestamp >= cutoff)
  const impulseTxs = last30
    .filter((t) => t.discretionaryWeight >= 0.6 && t.amount >= 40)
    .sort((a, b) => b.amount - a.amount)
  const totalImpulse = impulseTxs.reduce((s, t) => s + t.amount, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Ring + Drivers */}
      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-5">
          {impulse ? (
            <ImpulseScoreRing
              score={impulse.headline}
              burnt30d={impulse.burnt30d}
            />
          ) : (
            <div className="surface-card flex h-full items-center justify-center p-5">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No impulse data yet</p>
            </div>
          )}
        </div>
        <div className="md:col-span-7">
          <DriverList drivers={impulse?.drivers ?? []} />
        </div>
      </div>

      {/* Row 2: Impulse transaction list */}
      <div className="surface-card p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="label">Impulse transactions</p>
            <h3 className="font-lora mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {impulseTxs.length} flagged in last 30 days
            </h3>
          </div>
          {scoreResult.impPen > 0 && (
            <span className="chip jade shrink-0">Recover {scoreResult.impPen} pts</span>
          )}
        </div>
        {impulseTxs.length > 0 && (
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            Eliminating these saves {fmtUsd(totalImpulse)} and recovers {scoreResult.impPen} score points.
          </p>
        )}
        <div className="max-h-[260px] overflow-y-auto pr-1">
          {impulseTxs.length === 0 ? (
            <p className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              No impulse purchases detected. Great discipline!
            </p>
          ) : (
            <ul className="flex flex-col">
              {impulseTxs.map((t) => (
                <li
                  key={t.id ?? `${t.timestamp}-${t.merchant}`}
                  className="flex items-center gap-3 border-b py-2.5 last:border-b-0"
                  style={{ borderColor: 'var(--border-soft)' }}
                >
                  <span
                    className="shrink-0 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
                    style={{ background: 'var(--accent-crimson-soft)', color: 'var(--accent-crimson-deep)' }}
                  >
                    !
                  </span>
                  <span className="flex-1 truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t.merchant}
                  </span>
                  <span className="hidden text-[11px] sm:inline" style={{ color: 'var(--text-muted)' }}>
                    {new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums shrink-0" style={{ color: 'var(--accent-crimson-deep)' }}>
                    {fmtUsd(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Row 3: Suggestions */}
      <BudgetSuggestionsPanel suggestions={suggestions} loading={false} />
    </div>
  )
}
