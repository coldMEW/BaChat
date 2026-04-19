'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/invest/Sidebar'
import { TotalMoneyCard } from '@/components/dashboard/TotalMoneyCard'
import { MiniInvestStrip } from '@/components/dashboard/MiniInvestStrip'
import { WeeklyHeatmap } from '@/components/dashboard/WeeklyHeatmap'
import { CashflowChart } from '@/components/dashboard/CashflowChart'
import { ImpulseScoreRing } from '@/components/dashboard/ImpulseScoreRing'
import { DriverList } from '@/components/dashboard/DriverList'
import { RoastCard } from '@/components/dashboard/RoastCard'
import { UploadZone } from '@/components/dashboard/UploadZone'
import { AccountsSetupModal } from '@/components/dashboard/AccountsSetupModal'
import { ExtractedPreview } from '@/components/dashboard/ExtractedPreview'
import { db } from '@/lib/db'
import { DEMO_USER_ID, ensureSeed } from '@/lib/demo-seed'
import { ensureDashboardSeed } from '@/lib/demo-transactions'
import { CATEGORY_DISCRETIONARY_WEIGHTS } from '@/lib/dashboard/score-calibration'
import { lookupMerchant, defaultFallback } from '@/lib/dashboard/merchant-lookup'
import type {
  Account,
  ApiEnvelope,
  CashflowSeries,
  DashboardPayload,
  ExtractResult,
  ParsedTransactionPreview,
  RoastPayload,
  Transaction,
  TxCategory,
} from '@/types'

const DISPLAY_NAME_KEY = 'bachat:display-name'
const DEFAULT_DISPLAY_NAME = 'Jojo'

function getDisplayName(): string {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_NAME
  try {
    return window.localStorage.getItem(DISPLAY_NAME_KEY) ?? DEFAULT_DISPLAY_NAME
  } catch { return DEFAULT_DISPLAY_NAME }
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5)  return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

type LoadState = 'bootstrapping' | 'analyzing' | 'ready'

export default function DashboardPage() {
  const [loadState, setLoadState] = useState<LoadState>('bootstrapping')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [displayName, setDisplayName] = useState<string>(DEFAULT_DISPLAY_NAME)
  const [payload, setPayload] = useState<Omit<DashboardPayload, 'roast'> | null>(null)
  const [cashflowByRange, setCashflowByRange] = useState<Partial<Record<CashflowSeries['range'], CashflowSeries>>>({})
  const [roast, setRoast] = useState<RoastPayload | null>(null)
  const [roastLoading, setRoastLoading] = useState(false)

  const [showUpload, setShowUpload] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)
  const [preview, setPreview] = useState<ExtractResult | null>(null)

  // Bootstrap — ensure seeds, then read from Dexie
  useEffect(() => {
    ;(async () => {
      await ensureSeed()              // invest holdings (for MiniInvestStrip)
      await ensureDashboardSeed()     // dashboard tx + demo account
      setDisplayName(getDisplayName())
      await refresh()
      setLoadState('analyzing')
    })()
  }, [])

  const refresh = useCallback(async () => {
    const [txs, acct] = await Promise.all([
      db().transactions.where('userId').equals(DEMO_USER_ID).toArray(),
      db().accounts.get(DEMO_USER_ID),
    ])
    // Sort newest-first for cleaner later rendering
    txs.sort((a, b) => b.timestamp - a.timestamp)
    setTransactions(txs)
    setAccount(acct ?? null)
  }, [])

  // Analyze whenever transactions or account change
  const analyzeSignature = useMemo(
    () => JSON.stringify({
      n: transactions.length,
      a: account?.currentBalance,
      l: account?.creditLimit,
      s: account?.creditScore,
    }),
    [transactions, account],
  )

  useEffect(() => {
    if (loadState === 'bootstrapping') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/dashboard/analyze', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ transactions, account, cashflowRange: '30d' }),
        })
        const envelope = (await res.json()) as ApiEnvelope<Omit<DashboardPayload, 'roast'>>
        if (cancelled || !envelope.data) return
        setPayload(envelope.data)
        setCashflowByRange((prev) => ({ ...prev, '30d': envelope.data!.cashflow }))
        setLoadState('ready')
      } catch (err) {
        console.error('[dashboard] analyze failed', err)
        setLoadState('ready')
      }
    })()
    return () => { cancelled = true }
  }, [analyzeSignature, loadState])

  // Load additional cashflow ranges on demand
  const handleRangeChange = useCallback(async (range: CashflowSeries['range']) => {
    if (cashflowByRange[range]) return
    try {
      const res = await fetch('/api/dashboard/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transactions, account, cashflowRange: range }),
      })
      const envelope = (await res.json()) as ApiEnvelope<Omit<DashboardPayload, 'roast'>>
      if (envelope.data?.cashflow) {
        setCashflowByRange((prev) => ({ ...prev, [range]: envelope.data!.cashflow }))
      }
    } catch (err) { console.error('[dashboard] range fetch failed', err) }
  }, [transactions, account, cashflowByRange])

  // Generate roast once payload is ready and we have a subject
  useEffect(() => {
    if (!payload?.impulse?.topTxId) { setRoast(null); return }
    const subject = transactions.find((t) => t.id === payload.impulse.topTxId)
    if (!subject) return
    const impulseScore = payload.impulse.perTx[subject.id!]?.impulse ?? 0
    const redirectAmount = Math.round(subject.amount * impulseScore)
    if (redirectAmount < 5) return // too small to roast meaningfully

    let cancelled = false
    setRoastLoading(true)
    ;(async () => {
      try {
        // Compute w/w burn change client-side (fast)
        const now = Date.now()
        const weekMs = 7 * 24 * 60 * 60 * 1000
        let thisWeek = 0, prevWeek = 0
        for (const t of transactions) {
          if (t.amount <= 0 || t.id === undefined) continue
          const imp = payload.impulse.perTx[t.id]?.impulse ?? 0
          const burn = t.amount * imp
          if (t.timestamp >= now - weekMs) thisWeek += burn
          else if (t.timestamp >= now - 2 * weekMs) prevWeek += burn
        }
        const wow = prevWeek > 1 ? (thisWeek - prevWeek) / prevWeek : 0

        const res = await fetch('/api/dashboard/roast', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            subjectTx: subject,
            impulseScore,
            burnt30d: payload.impulse.burnt30d,
            weekOverWeekBurntChange: wow,
            redirectSymbol: 'VTI',
            redirectAmount,
          }),
        })
        const envelope = (await res.json()) as ApiEnvelope<RoastPayload>
        if (!cancelled && envelope.data) setRoast(envelope.data)
      } catch (err) {
        console.error('[dashboard] roast failed', err)
      } finally {
        if (!cancelled) setRoastLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [payload?.impulse?.topTxId, payload?.impulse?.burnt30d, transactions])

  // Handle extracted preview → confirm → write to Dexie
  async function handleConfirmImport(rows: ParsedTransactionPreview[]) {
    if (!preview) return
    const toAdd: Omit<Transaction, 'id'>[] = rows.map((r) => {
      const lookup = lookupMerchant(r.description || r.merchant) ?? defaultFallback(r.merchant)
      const category: TxCategory = lookup.category
      const weight = CATEGORY_DISCRETIONARY_WEIGHTS[category]
      const timestamp = new Date(r.date + 'T12:00:00').getTime()
      return {
        userId: DEMO_USER_ID,
        date: r.date,
        timestamp,
        amount: r.amount,
        merchant: lookup.merchant,
        description: r.description || r.merchant,
        category,
        discretionaryWeight: weight,
        seedOrigin: 'upload',
        pendingReview: r.needsReview,
        createdAt: Date.now(),
      }
    })
    await db().transactions.bulkAdd(toAdd as Transaction[])
    setPreview(null)
    setShowUpload(false)
    await refresh()
  }

  async function saveAccount(acct: Account) {
    await db().accounts.put(acct)
    setShowAccounts(false)
    await refresh()
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar active="dashboard" />

      <div className="pl-[68px]">
        {/* Header */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-4"
          style={{
            background: 'rgba(244, 241, 251, 0.78)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-soft)',
          }}
        >
          <div>
            <h1
              className="font-lora font-semibold"
              style={{ fontSize: 26, color: 'var(--text-primary)' }}
            >
              {greeting()}, {displayName}
            </h1>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Honest snapshot of where your money is going
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowUpload(true)} className="btn-ghost">
              Upload
            </button>
            <button onClick={() => setShowAccounts(true)} className="btn-primary">
              {account ? 'Edit accounts' : 'Set up accounts'}
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="px-6 py-6 max-w-[1600px] mx-auto">
          <div className="section-enter">
            {loadState !== 'ready' && !payload && (
              <div className="surface-card p-10 flex items-center justify-center">
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {loadState === 'bootstrapping' ? 'Loading your transactions…' : 'Crunching impulse scores…'}
                </div>
              </div>
            )}

            {/* Roast banner — short, punchy, right under the greeting */}
            {payload && (roast || roastLoading) && (
              <div className="mb-5">
                <RoastCard roast={roast} loading={roastLoading} />
              </div>
            )}

            {payload && (
              <div
                className="grid gap-5"
                style={{ gridTemplateColumns: 'minmax(280px, 3fr) minmax(520px, 6fr) minmax(280px, 3fr)' }}
              >
                {/* Column 1: Left — TotalMoney + MiniInvestStrip */}
                <div className="flex flex-col gap-5">
                  <TotalMoneyCard account={account} onConfigure={() => setShowAccounts(true)} />
                  <MiniInvestStrip />
                </div>

                {/* Column 2: Center — Heatmap + CashflowChart */}
                <div className="flex flex-col gap-5">
                  <WeeklyHeatmap cells={payload.heatmap} />
                  <CashflowChart
                    cashflowByRange={cashflowByRange}
                    onRangeChange={handleRangeChange}
                    defaultRange="30d"
                  />
                </div>

                {/* Column 3: Right — Impulse Ring (with credit inline) + Driver List */}
                <div className="flex flex-col gap-5">
                  <ImpulseScoreRing
                    score={payload.impulse.headline}
                    burnt30d={payload.impulse.burnt30d}
                    creditProjection={payload.creditProjection}
                    onConfigureCredit={() => setShowAccounts(true)}
                  />
                  <DriverList drivers={payload.impulse.drivers} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showUpload && !preview && (
        <UploadZone
          onExtracted={(result) => setPreview(result)}
          onClose={() => setShowUpload(false)}
        />
      )}
      {preview && (
        <ExtractedPreview
          previews={preview.transactions}
          warnings={preview.warnings}
          onConfirm={handleConfirmImport}
          onCancel={() => { setPreview(null); setShowUpload(false) }}
        />
      )}
      {showAccounts && (
        <AccountsSetupModal
          initial={account ?? {}}
          userId={DEMO_USER_ID}
          onSave={saveAccount}
          onClose={() => setShowAccounts(false)}
        />
      )}
    </div>
  )
}
