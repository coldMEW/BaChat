'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/invest/Sidebar'
import { BudgetScoreOverview }     from '@/components/budget/BudgetScoreOverview'
import { BudgetImpulseBreakdown }  from '@/components/budget/BudgetImpulseBreakdown'
import { BudgetDecisionSimulator } from '@/components/budget/BudgetDecisionSimulator'
import { BudgetUploadPrompt }      from '@/components/budget/BudgetUploadPrompt'
import { calcBudgetScore }         from '@/lib/budget/score-engine'
import { generateSuggestions }     from '@/lib/budget/suggestion-engine'
import { db }                      from '@/lib/db'
import { DEMO_USER_ID, ensureSeed } from '@/lib/demo-seed'
import { ensureDashboardSeed }     from '@/lib/demo-transactions'
import { analyzeImpulse }          from '@/lib/dashboard/impulse'
import type { Account, ImpulseAnalysis, Transaction } from '@/types'
import type { BudgetScoreResult, BudgetSuggestion } from '@/lib/budget/types'

type Tab = 'impulse' | 'simulator'

const TABS: { key: Tab; label: string }[] = [
  { key: 'impulse',   label: 'Impulse'   },
  { key: 'simulator', label: 'Simulator' },
]

export default function BudgetPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [account,      setAccount]      = useState<Account | null>(null)
  const [loaded,       setLoaded]       = useState(false)
  const [tab,          setTab]          = useState<Tab>('impulse')

  // Bootstrap — same pattern as dashboard/page.tsx
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ensureSeed()
      await ensureDashboardSeed()
      const [txs, acct] = await Promise.all([
        db().transactions.where('userId').equals(DEMO_USER_ID).toArray(),
        db().accounts.get(DEMO_USER_ID),
      ])
      if (cancelled) return
      txs.sort((a, b) => b.timestamp - a.timestamp)
      setTransactions(txs)
      setAccount(acct ?? null)
      setLoaded(true)
    })()
    return () => { cancelled = true }
  }, [])

  // Pure derived data — no API needed, matches Dashboard's approach
  const impulse: ImpulseAnalysis | null = useMemo(
    () => loaded ? analyzeImpulse(transactions) : null,
    [transactions, loaded],
  )

  const scoreResult: BudgetScoreResult | null = useMemo(
    () => loaded ? calcBudgetScore(transactions, account) : null,
    [transactions, account, loaded],
  )

  const suggestions: BudgetSuggestion[] = useMemo(
    () => loaded && scoreResult ? generateSuggestions(scoreResult, impulse, account) : [],
    [loaded, scoreResult, impulse, account],
  )

  const handleTabChange = useCallback((t: Tab) => setTab(t), [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar active="budget" />

      <div className="pl-[68px]">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-4"
          style={{
            background: 'rgba(244,241,251,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-soft)',
          }}
        >
          <div>
            <h1 className="font-lora font-semibold" style={{ fontSize: 26, color: 'var(--text-primary)' }}>
              Budgeting
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Personalized coaching to maximize your 37-point Pulse score
            </p>
          </div>

          {/* Tab switcher */}
          <div
            className="inline-flex rounded-full p-1 gap-0.5"
            style={{ background: 'var(--bg-card-soft)', border: '1px solid var(--border-soft)' }}
          >
            {TABS.map(({ key, label }) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTabChange(key)}
                  className="px-4 py-1.5 text-sm font-medium transition-all"
                  style={{
                    borderRadius: 9999,
                    background: active ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-deep))' : 'transparent',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    boxShadow: active ? '0 4px 12px rgba(123,97,255,0.28)' : undefined,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <main className="px-4 py-6 max-w-[1400px] mx-auto sm:px-6">
          {!loaded || !scoreResult ? (
            <LoadingSkeleton />
          ) : transactions.length === 0 ? (
            <BudgetUploadPrompt />
          ) : (
            <div className="section-enter grid gap-5 lg:grid-cols-12">
              {/* Left: persistent score card */}
              <div className="lg:col-span-3">
                <div className="lg:sticky lg:top-[80px]">
                  <BudgetScoreOverview result={scoreResult} account={account} />
                </div>
              </div>

              {/* Right: tab content */}
              <div className="lg:col-span-9">
                <div key={tab} className="section-enter">
                  {tab === 'impulse' && (
                    <BudgetImpulseBreakdown
                      impulse={impulse}
                      transactions={transactions}
                      scoreResult={scoreResult}
                      suggestions={suggestions}
                    />
                  )}
                  {tab === 'simulator' && (
                    <BudgetDecisionSimulator scoreResult={scoreResult} account={account} />
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-12 section-enter">
      <div className="lg:col-span-3">
        <div className="surface-card p-5 flex flex-col gap-4">
          <div className="h-4 w-20 animate-pulse rounded" style={{ background: 'var(--bg-card-soft)' }} />
          <div className="mx-auto h-36 w-36 animate-pulse rounded-full" style={{ background: 'var(--bg-card-soft)' }} />
          <div className="flex flex-col gap-2">
            {[0,1,2,3].map((i) => <div key={i} className="h-3 animate-pulse rounded" style={{ background: 'var(--bg-card-soft)' }} />)}
          </div>
        </div>
      </div>
      <div className="lg:col-span-9 surface-card p-5">
        <div className="flex flex-col gap-3">
          {[0,1,2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ background: 'var(--bg-card-soft)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
