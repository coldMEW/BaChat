'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from '@/components/invest/Sidebar'
import { db } from '@/lib/db'
import { DEMO_USER_ID, ensureSeed } from '@/lib/demo-seed'
import { ensureDashboardSeed } from '@/lib/demo-transactions'
import type { Account } from '@/types'
import { CheckCircle, AlertTriangle, RotateCcw, Trash2, Shield, Database } from 'lucide-react'

const DEFAULT_ACCOUNT: Omit<Account, 'userId' | 'configuredAt'> = {
  creditScore: 720,
  creditLimit: 10000,
  currentBalance: 2400,
  monthlyPaymentPct: 10,
  savings: 8500,
  debt: 12000,
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type ResetState = 'idle' | 'resetting' | 'done'

export default function SettingsPage() {
  const [account, setAccount] = useState<Omit<Account, 'userId' | 'configuredAt'>>(DEFAULT_ACCOUNT)
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [resetState, setResetState] = useState<ResetState>('idle')
  const [clearConfirm, setClearConfirm] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ensureSeed()
      await ensureDashboardSeed()
      const acct = await db().accounts.get(DEMO_USER_ID)
      if (cancelled) return
      if (acct) {
        const { userId: _u, configuredAt: _c, ...rest } = acct
        setAccount(rest)
      }
      setLoaded(true)
    })()
    return () => { cancelled = true }
  }, [])

  const handleChange = useCallback(
    (field: keyof typeof DEFAULT_ACCOUNT, raw: string) => {
      const val = field === 'monthlyPaymentPct'
        ? Math.min(100, Math.max(0, Number(raw) || 0))
        : Math.max(0, Number(raw) || 0)
      setAccount((prev) => ({ ...prev, [field]: val }))
      setSaveState('idle')
    },
    [],
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveState('saving')
    try {
      await db().accounts.put({
        userId: DEMO_USER_ID,
        ...account,
        configuredAt: Date.now(),
      })
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch {
      setSaveState('error')
    }
  }

  async function handleResetDemoData() {
    setResetState('resetting')
    try {
      await db().transactions.where('userId').equals(DEMO_USER_ID).delete()
      localStorage.removeItem('bachat:dashboard-seed-version')
      localStorage.removeItem('bachat:demo-seed-version')
      await ensureSeed()
      await ensureDashboardSeed()
      setResetState('done')
      setTimeout(() => setResetState('idle'), 2500)
    } catch {
      setResetState('idle')
    }
  }

  async function handleClearAll() {
    if (!clearConfirm) { setClearConfirm(true); return }
    await db().transactions.where('userId').equals(DEMO_USER_ID).delete()
    await db().accounts.delete(DEMO_USER_ID)
    localStorage.removeItem('bachat:dashboard-seed-version')
    localStorage.removeItem('bachat:demo-seed-version')
    setClearConfirm(false)
    setAccount(DEFAULT_ACCOUNT)
    setSaveState('idle')
    window.location.href = '/dashboard'
  }

  const inputCls = "h-10 w-full rounded-xl border px-3 font-mono text-sm tabular-nums outline-none transition-colors focus:ring-2"
  const inputStyle = {
    background: 'var(--bg-card-soft)',
    borderColor: 'var(--border-soft)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar active="settings" />

      <div className="pl-[68px]">
        {/* Header */}
        <header
          className="sticky top-0 z-20 flex items-center gap-3 px-6 py-4"
          style={{
            background: 'rgba(244,241,251,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-soft)',
          }}
        >
          <div>
            <h1 className="font-lora font-semibold" style={{ fontSize: 26, color: 'var(--text-primary)' }}>
              Settings
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Configure your financial profile and manage app data
            </p>
          </div>
        </header>

        <main className="px-4 py-6 max-w-[860px] mx-auto sm:px-6">
          {!loaded ? (
            <SettingsSkeleton />
          ) : (
            <div className="flex flex-col gap-5 section-enter">

              {/* ── Financial Profile ── */}
              <form onSubmit={handleSave} className="surface-card p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={16} style={{ color: 'var(--accent-primary)' }} />
                  <p className="label">Financial profile</p>
                </div>
                <h2 className="font-lora text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Your account details
                </h2>
                <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
                  These figures are stored locally in your browser and used to compute your budget score. Nothing leaves your device.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Credit score"
                    hint="300 – 850"
                    value={account.creditScore}
                    min={300} max={850}
                    onChange={(v) => handleChange('creditScore', v)}
                    inputCls={inputCls} inputStyle={inputStyle}
                  />
                  <Field
                    label="Credit limit ($)"
                    hint="Total available credit"
                    value={account.creditLimit}
                    onChange={(v) => handleChange('creditLimit', v)}
                    inputCls={inputCls} inputStyle={inputStyle}
                  />
                  <Field
                    label="Current credit balance ($)"
                    hint="Amount currently owed on card"
                    value={account.currentBalance}
                    onChange={(v) => handleChange('currentBalance', v)}
                    inputCls={inputCls} inputStyle={inputStyle}
                  />
                  <Field
                    label="Monthly payment (%)"
                    hint="% of balance paid each month"
                    value={account.monthlyPaymentPct}
                    min={0} max={100}
                    onChange={(v) => handleChange('monthlyPaymentPct', v)}
                    inputCls={inputCls} inputStyle={inputStyle}
                  />
                  <Field
                    label="Total savings ($)"
                    hint="Emergency fund + savings accounts"
                    value={account.savings}
                    onChange={(v) => handleChange('savings', v)}
                    inputCls={inputCls} inputStyle={inputStyle}
                  />
                  <Field
                    label="Total debt ($)"
                    hint="Loans, student debt (excl. credit card)"
                    value={account.debt}
                    onChange={(v) => handleChange('debt', v)}
                    inputCls={inputCls} inputStyle={inputStyle}
                  />
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saveState === 'saving'}
                    className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-deep))',
                      boxShadow: '0 6px 18px rgba(123,97,255,0.3)',
                    }}
                  >
                    {saveState === 'saving' ? 'Saving…' : 'Save changes'}
                  </button>
                  {saveState === 'saved' && (
                    <span className="flex items-center gap-1.5 text-sm font-medium section-enter" style={{ color: 'var(--accent-jade-deep)' }}>
                      <CheckCircle size={14} /> Saved
                    </span>
                  )}
                  {saveState === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm font-medium section-enter" style={{ color: 'var(--accent-crimson-deep)' }}>
                      <AlertTriangle size={14} /> Failed to save
                    </span>
                  )}
                </div>
              </form>

              {/* ── Data Management ── */}
              <div className="surface-card p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Database size={16} style={{ color: 'var(--accent-primary)' }} />
                  <p className="label">Data management</p>
                </div>
                <h2 className="font-lora text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Manage your local data
                </h2>

                <div className="flex flex-col gap-3">
                  {/* Reset demo */}
                  <div
                    className="flex items-center justify-between gap-4 rounded-xl p-4"
                    style={{ background: 'var(--bg-card-soft)', border: '1px solid var(--border-soft)' }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Reset demo transactions</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Restores the original demo spending data. Your account settings are kept.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetDemoData}
                      disabled={resetState === 'resetting'}
                      className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-opacity disabled:opacity-50"
                      style={{
                        background: 'var(--accent-primary-soft)',
                        color: 'var(--accent-primary-deep)',
                      }}
                    >
                      <RotateCcw size={13} className={resetState === 'resetting' ? 'animate-spin' : ''} />
                      {resetState === 'resetting' ? 'Resetting…' : resetState === 'done' ? 'Done!' : 'Reset data'}
                    </button>
                  </div>

                  {/* Clear all */}
                  <div
                    className="flex items-center justify-between gap-4 rounded-xl p-4"
                    style={{
                      background: clearConfirm ? 'var(--accent-crimson-soft)' : 'var(--bg-card-soft)',
                      border: `1px solid ${clearConfirm ? 'var(--accent-crimson)' : 'var(--border-soft)'}`,
                      transition: 'background 0.2s, border-color 0.2s',
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: clearConfirm ? 'var(--accent-crimson-deep)' : 'var(--text-primary)' }}>
                        {clearConfirm ? 'Are you sure? This cannot be undone.' : 'Clear all data'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {clearConfirm
                          ? 'All transactions, account settings, and cache will be wiped.'
                          : 'Wipes all transactions, account settings, and cached data from your browser.'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {clearConfirm && (
                        <button
                          type="button"
                          onClick={() => setClearConfirm(false)}
                          className="inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold"
                          style={{ background: 'var(--bg-card-soft)', color: 'var(--text-secondary)' }}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition-opacity"
                        style={{ background: 'var(--accent-crimson)' }}
                      >
                        <Trash2 size={13} />
                        {clearConfirm ? 'Yes, clear everything' : 'Clear all'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── About ── */}
              <div className="surface-card p-6">
                <p className="label mb-3">About Bachat</p>
                <div className="flex flex-col gap-2">
                  <InfoRow label="Version" value="0.1.0" />
                  <InfoRow label="Storage" value="Browser IndexedDB — 100% local" />
                  <InfoRow label="Data policy" value="Nothing ever leaves your device" />
                  <InfoRow label="Score model" value="37-point Bachat Pulse (needs · wants · savings · credit)" />
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function Field({
  label, hint, value, min, max, onChange, inputCls, inputStyle,
}: {
  label: string; hint: string; value: number
  min?: number; max?: number
  onChange: (v: string) => void
  inputCls: string; inputStyle: React.CSSProperties
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <input
        type="number"
        inputMode="decimal"
        min={min ?? 0}
        max={max}
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        style={inputStyle}
      />
      <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2" style={{ borderBottom: '1px solid var(--border-soft)' }}>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-sm font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-5 section-enter">
      {[200, 280, 120].map((h, i) => (
        <div key={i} className="surface-card p-6">
          <div className="h-4 w-32 animate-pulse rounded mb-4" style={{ background: 'var(--bg-card-soft)' }} />
          <div className={`h-[${h}px] animate-pulse rounded-xl`} style={{ height: h, background: 'var(--bg-card-soft)' }} />
        </div>
      ))}
    </div>
  )
}
