'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard, PiggyBank, ShoppingBag, Wallet, Zap } from 'lucide-react'
import type { BudgetSuggestion, SuggestionCategory, SuggestionPriority } from '@/lib/budget/types'

interface Props {
  suggestions: BudgetSuggestion[]
  loading: boolean
}

const CATEGORY_BORDER: Record<SuggestionCategory, string> = {
  savings: 'var(--accent-jade)',
  debt:    'var(--accent-crimson)',
  impulse: 'var(--accent-crimson)',
  needs:   'var(--accent-info)',
  wants:   'var(--accent-amber)',
  credit:  'var(--accent-primary)',
}

const PRIORITY_LABEL: Record<SuggestionPriority, string> = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
}

function priorityChipStyle(p: SuggestionPriority): { background: string; color: string } {
  if (p === 'critical') return { background: 'var(--accent-crimson-soft)', color: 'var(--accent-crimson-deep)' }
  if (p === 'high')     return { background: 'var(--accent-amber-soft)',   color: '#B45309' }
  return                       { background: 'var(--bg-card-soft)',         color: 'var(--text-muted)' }
}

function categoryIcon(c: SuggestionCategory): ReactNode {
  switch (c) {
    case 'savings': return <PiggyBank size={13} />
    case 'debt':    return <CreditCard size={13} />
    case 'impulse': return <Zap size={13} />
    case 'needs':   return <Wallet size={13} />
    case 'wants':   return <ShoppingBag size={13} />
    case 'credit':  return <CreditCard size={13} />
  }
}

export function BudgetSuggestionsPanel({ suggestions, loading }: Props) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="label">Personalized suggestions</p>
          <h2 className="font-lora mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Highest-impact actions
          </h2>
        </div>
        {!loading && (
          <span className="chip muted">
            {suggestions.length} action{suggestions.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ background: 'var(--bg-card-soft)' }} />
          ))
        ) : suggestions.length === 0 ? (
          <EmptyState />
        ) : (
          suggestions.map((s) => <SuggestionCard key={s.id} s={s} />)
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl py-10 text-center" style={{ background: 'var(--bg-card-soft)' }}>
      <CheckCircle2 size={32} style={{ color: 'var(--accent-jade)' }} />
      <p className="font-lora text-base font-semibold" style={{ color: 'var(--text-primary)' }}>You're on track</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No urgent actions right now. Keep it up.</p>
    </div>
  )
}

function SuggestionCard({ s }: { s: BudgetSuggestion }) {
  const ps = priorityChipStyle(s.priority)
  return (
    <div
      className="surface-card hoverable p-4 transition-transform hover:-translate-y-[1px]"
      style={{ borderLeft: `3px solid ${CATEGORY_BORDER[s.category]}` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Priority chip */}
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={ps}
        >
          <AlertTriangle size={10} />
          {PRIORITY_LABEL[s.priority]}
        </span>
        {/* Category chip */}
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: 'var(--bg-card-soft)', color: 'var(--text-secondary)' }}
        >
          {categoryIcon(s.category)}
          <span className="capitalize">{s.category}</span>
        </span>
        {/* Impact badges */}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {s.scoreImpact > 0 && (
            <span className="chip jade">+{s.scoreImpact} pts</span>
          )}
          {s.creditImpact > 0 && (
            <span className="chip" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent-info)' }}>
              +{s.creditImpact} credit
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-2.5 text-[15px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
        {s.title}
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {s.body}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
        <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--accent-primary-deep)' }}>
          <ArrowRight size={14} />
          {s.action}
        </span>
        {s.redirect && <RedirectChip redirect={s.redirect} />}
      </div>
    </div>
  )
}

function RedirectChip({ redirect }: { redirect: NonNullable<BudgetSuggestion['redirect']> }) {
  const chip = (
    <span
      className="chip"
      style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary-deep)' }}
    >
      → {redirect.label}
    </span>
  )
  return redirect.to === 'investment'
    ? <Link href="/invest" className="hover:opacity-90">{chip}</Link>
    : chip
}
