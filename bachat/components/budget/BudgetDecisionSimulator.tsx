'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Sparkles, ShieldCheck, ShieldAlert, AlertTriangle, XCircle, TrendingDown, TrendingUp } from 'lucide-react'
import type { Account } from '@/types'
import type { BudgetScoreResult, SimCategory, SimulationResult, PayWith } from '@/lib/budget/types'
import { simulateDecision } from '@/lib/budget/impact-calculator'

interface Props {
  scoreResult: BudgetScoreResult
  account: Account | null
}

const CATEGORY_OPTIONS: { value: SimCategory; label: string }[] = [
  { value: 'wants',      label: 'Want / discretionary' },
  { value: 'needs',      label: 'Need / fixed cost'    },
  { value: 'savings',    label: 'Savings deposit'      },
  { value: 'investment', label: 'Investment'            },
  { value: 'debt',       label: 'Debt payment'         },
]

const VERDICT_STYLE: Record<SimulationResult['verdict'], { bg: string; color: string; label: string }> = {
  good:    { bg: 'var(--accent-jade-soft)',    color: 'var(--accent-jade-deep)',    label: 'GOOD CALL' },
  neutral: { bg: 'var(--bg-card-soft)',        color: 'var(--text-muted)',          label: 'NEUTRAL'   },
  risky:   { bg: 'var(--accent-amber-soft)',   color: '#B45309',                   label: 'RISKY'     },
  avoid:   { bg: 'var(--accent-crimson-soft)', color: 'var(--accent-crimson-deep)', label: 'AVOID'     },
}

const AFFORD_CONFIG: Record<SimulationResult['affordabilityLevel'], {
  icon: React.ReactNode; bg: string; border: string; color: string; title: string
}> = {
  comfortable:  {
    icon: <ShieldCheck size={16} />,
    bg: 'var(--accent-jade-soft)', border: 'var(--accent-jade)', color: 'var(--accent-jade-deep)',
    title: 'Comfortable',
  },
  manageable:   {
    icon: <ShieldCheck size={16} />,
    bg: 'rgba(59,130,246,0.08)', border: 'var(--accent-info)', color: 'var(--accent-info)',
    title: 'Manageable',
  },
  tight:        {
    icon: <AlertTriangle size={16} />,
    bg: 'var(--accent-amber-soft)', border: 'var(--accent-amber)', color: '#B45309',
    title: 'Tight',
  },
  risky:        {
    icon: <ShieldAlert size={16} />,
    bg: 'rgba(239,68,68,0.08)', border: 'var(--accent-crimson)', color: 'var(--accent-crimson-deep)',
    title: 'Risky',
  },
  unaffordable: {
    icon: <XCircle size={16} />,
    bg: 'var(--accent-crimson-soft)', border: 'var(--accent-crimson-deep)', color: 'var(--accent-crimson-deep)',
    title: 'Cannot afford without borrowing',
  },
}

function fmtUsd(n: number) { return '$' + Math.abs(Math.round(n)).toLocaleString() }
function fmtMonths(n: number) { return n === Infinity ? '∞' : n.toFixed(1) + ' mo' }

// Show pay-with toggle only for categories where it's meaningful
const SHOW_PAY_WITH: SimCategory[] = ['wants', 'needs']

export function BudgetDecisionSimulator({ scoreResult, account }: Props) {
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [category,    setCategory]    = useState<SimCategory>('wants')
  const [payWith,     setPayWith]     = useState<PayWith>('cash')
  const [result,      setResult]      = useState<SimulationResult | null>(null)
  const [loading,     setLoading]     = useState(false)

  const hasCard = (account?.creditLimit ?? 0) > 0
  const showPayToggle = SHOW_PAY_WITH.includes(category) && hasCard

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!description.trim() || !Number.isFinite(amt) || amt <= 0) return
    setLoading(true)
    setTimeout(() => {
      setResult(simulateDecision(description.trim(), amt, category, showPayToggle ? payWith : 'cash', scoreResult, account))
      setLoading(false)
    }, 200)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-card-soft)',
    borderColor: 'var(--border-soft)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Input form */}
      <form onSubmit={onSubmit} className="surface-card p-5">
        <p className="label">Decision simulator</p>
        <h2 className="font-lora mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          What are you thinking of doing?
        </h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Describe a purchase or financial move and see its full impact — score, credit, savings, and affordability — before you commit.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='e.g. "Buy a new laptop for $1,200"'
            className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition-colors"
            style={inputStyle}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Amount ($)
              </label>
              <input
                type="number" inputMode="decimal" min="0" step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-xl border px-3 font-mono text-sm tabular-nums outline-none transition-colors"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value as SimCategory); setResult(null) }}
                className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition-colors cursor-pointer"
                style={inputStyle}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pay with toggle — only shown for wants/needs when card is configured */}
          {showPayToggle && (
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Pay with
              </label>
              <div className="inline-flex rounded-xl border p-0.5 gap-0.5" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-card-soft)' }}>
                {(['cash', 'credit'] as PayWith[]).map((p) => {
                  const active = payWith === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPayWith(p)}
                      className="px-4 h-8 rounded-lg text-sm font-medium transition-all capitalize"
                      style={{
                        background: active ? 'var(--accent-primary)' : 'transparent',
                        color: active ? '#fff' : 'var(--text-secondary)',
                        boxShadow: active ? '0 2px 8px rgba(123,97,255,0.25)' : undefined,
                      }}
                    >
                      {p === 'cash' ? 'Cash / debit' : 'Credit card'}
                    </button>
                  )
                })}
              </div>
              {payWith === 'credit' && (
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Charging to a card increases utilization — we'll model the exact credit score impact.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !description.trim() || !amount}
            className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-deep))',
              boxShadow: '0 6px 18px rgba(123,97,255,0.3)',
            }}
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Simulating…</>
              : <><Sparkles size={14} /> Simulate impact</>
            }
          </button>
        </div>
      </form>

      {/* Result card */}
      {result && (
        <ResultCard
          key={`${result.decision}-${result.amount}-${result.payWith}`}
          result={result}
          scoreResult={scoreResult}
          account={account}
        />
      )}
    </div>
  )
}

function ResultCard({
  result, scoreResult, account,
}: {
  result: SimulationResult
  scoreResult: BudgetScoreResult
  account: Account | null
}) {
  const vs = VERDICT_STYLE[result.verdict]
  const af = AFFORD_CONFIG[result.affordabilityLevel]

  return (
    <div className="surface-card section-enter p-5 flex flex-col gap-5">

      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="label">Projected impact</p>
          <h3 className="font-lora mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {result.decision} · {fmtUsd(result.amount)}
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {result.payWith === 'credit' ? 'Paid by credit card' : 'Paid with cash / debit'}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide shrink-0"
          style={{ background: vs.bg, color: vs.color }}
        >
          {vs.label}
        </span>
      </div>

      <p className="text-xs -mt-3" style={{ color: 'var(--text-secondary)' }}>{result.verdictReason}</p>

      {/* ── Affordability panel ─────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-4"
        style={{ background: af.bg, border: `1px solid ${af.border}` }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span style={{ color: af.color }}>{af.icon}</span>
          <p className="text-sm font-semibold" style={{ color: af.color }}>
            Can you afford this? — {af.title}
          </p>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {result.affordabilityDetail}
        </p>

        {/* Emergency fund bar */}
        {result.emergencyMonthsBefore > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Emergency fund
              </span>
              <span className="text-[11px] font-mono font-semibold" style={{ color: af.color }}>
                {fmtMonths(result.emergencyMonthsBefore)} → {fmtMonths(result.emergencyMonthsAfter)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
              <div
                style={{
                  width: `${Math.min(100, (result.emergencyMonthsAfter / 6) * 100)}%`,
                  height: '100%',
                  borderRadius: 2,
                  background: af.border,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Target: 3–6 months · {result.emergencyMonthsAfter >= 6 ? 'Fully funded' : result.emergencyMonthsAfter >= 3 ? 'Adequate' : result.emergencyMonthsAfter >= 1 ? 'Below target' : 'Critical — rebuild urgently'}
            </p>
          </div>
        )}
      </div>

      {/* ── Impact grid ────────────────────────────────────────────────────── */}
      <div>
        <p className="label mb-2">Financial impact breakdown</p>
        <div className="grid grid-cols-2 gap-2">
          <ImpactCell
            label="Pulse score"
            before={`${scoreResult.score}`}
            after={`${result.scoreAfter}`}
            delta={result.scoreDelta}
            suffix=" pts" good="up"
          />
          <ImpactCell
            label="Credit score"
            before={account?.creditScore != null ? `${account.creditScore}` : null}
            after={result.creditScoreAfter != null ? `${result.creditScoreAfter}` : null}
            delta={result.creditDelta}
            suffix=" pts" good="up"
            sub={result.utilizationBefore !== null && result.utilizationAfter !== null
              ? `Utilization: ${result.utilizationBefore}% → ${result.utilizationAfter}%`
              : undefined}
          />
          <ImpactCell
            label="Savings balance"
            before={fmtUsd(account?.savings ?? scoreResult.savings)}
            after={fmtUsd(result.savingsBalanceAfter)}
            delta={result.savingsBalanceAfter - (account?.savings ?? scoreResult.savings)}
            suffix="" good="up" dollar
          />
          <ImpactCell
            label="Monthly cashflow"
            before={fmtUsd(result.cashflowBefore)}
            after={fmtUsd(result.cashflowAfter)}
            delta={result.cashflowDelta}
            suffix="/mo" good="up" dollar
            sub={result.cashflowAfter < 0 ? 'Negative — expenses exceed income' : undefined}
          />
        </div>

        {/* Utilization detail row — only shown when credit card was used */}
        {result.utilizationBefore !== null && result.utilizationAfter !== null && result.payWith === 'credit' && (
          <div
            className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'var(--bg-card-soft)', border: '1px solid var(--border-soft)' }}
          >
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Credit utilization detail</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {result.utilizationBefore}% → {result.utilizationAfter}%
                </span>
                {result.utilizationAfter > 30 && result.utilizationBefore <= 30 && (
                  <span className="chip" style={{ background: 'var(--accent-crimson-soft)', color: 'var(--accent-crimson-deep)', fontSize: 10 }}>
                    Crosses 30% threshold
                  </span>
                )}
                {result.utilizationAfter > 50 && (
                  <span className="chip" style={{ background: 'var(--accent-crimson-soft)', color: 'var(--accent-crimson-deep)', fontSize: 10 }}>
                    High utilization zone
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-soft)' }}>
                <div
                  style={{
                    width: `${Math.min(100, result.utilizationAfter)}%`,
                    height: '100%',
                    borderRadius: 2,
                    background: result.utilizationAfter > 50
                      ? 'var(--accent-crimson)'
                      : result.utilizationAfter > 30
                        ? 'var(--accent-amber)'
                        : 'var(--accent-jade)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Keep below 30% for best credit score · Below 10% is optimal
              </p>
            </div>
            {result.creditDelta !== null && (
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Score impact</p>
                <p
                  className="font-mono text-sm font-bold"
                  style={{ color: result.creditDelta < 0 ? 'var(--accent-crimson-deep)' : 'var(--accent-jade-deep)' }}
                >
                  {result.creditDelta > 0 ? '+' : ''}{result.creditDelta} pts
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Alternatives ───────────────────────────────────────────────────── */}
      {result.alternatives.length > 0 && (
        <div>
          <p className="label mb-2">Instead, you could</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {result.alternatives.map((a) => {
              const isInvest = a.label.toLowerCase().includes('invest')
              const inner = (
                <div className="surface-inner rounded-xl p-3 h-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.label}</span>
                    {a.scoreGain > 0 && <span className="chip jade shrink-0">+{a.scoreGain} pts</span>}
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{a.description}</p>
                </div>
              )
              return isInvest
                ? <Link key={a.label} href="/invest" className="block hover:opacity-90 transition-opacity">{inner}</Link>
                : <div key={a.label}>{inner}</div>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ImpactCell({
  label, before, after, delta, suffix, good, dollar, sub,
}: {
  label: string; before: string | null; after: string | null
  delta: number | null; suffix: string; good: 'up' | 'down'
  dollar?: boolean; sub?: string
}) {
  if (after === null || delta === null) {
    return (
      <div className="surface-inner rounded-xl p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Not configured</p>
      </div>
    )
  }

  const positive = delta > 0
  const negative = delta < 0
  const isGood   = (positive && good === 'up') || (negative && good === 'down')
  const isBad    = (positive && good === 'down') || (negative && good === 'up')
  const color    = isGood ? 'var(--accent-jade-deep)' : isBad ? 'var(--accent-crimson-deep)' : 'var(--text-muted)'
  const sign     = positive ? '+' : ''
  const Icon     = isGood ? TrendingUp : isBad ? TrendingDown : null
  const deltaStr = dollar
    ? `${sign}${fmtUsd(delta)}`
    : `${sign}${Math.abs(delta) < 1 && delta !== 0 ? delta.toFixed(1) : Math.round(delta)}${suffix}`

  return (
    <div className="surface-inner rounded-xl p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {before ?? '—'} → {after}
      </p>
      <div className="mt-0.5 flex items-center gap-1">
        {Icon && <Icon size={11} color={color} />}
        <p className="font-mono text-[11px] font-semibold tabular-nums" style={{ color }}>
          {delta === 0 ? '±0' : deltaStr}
        </p>
      </div>
      {sub && (
        <p className="mt-1 text-[10px] leading-tight" style={{ color: 'var(--accent-crimson-deep)' }}>{sub}</p>
      )}
    </div>
  )
}
