'use client'

import type { Account } from '@/types'

function fmtUSD(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function scoreChip(score: number): { label: string; bg: string; fg: string } {
  if (score >= 800) return { label: 'Excellent', bg: 'var(--accent-jade-soft)', fg: 'var(--accent-jade-deep)' }
  if (score >= 740) return { label: 'Very good',  bg: 'var(--accent-jade-soft)', fg: 'var(--accent-jade-deep)' }
  if (score >= 670) return { label: 'Good',       bg: 'var(--accent-primary-soft)', fg: 'var(--accent-primary-deep)' }
  if (score >= 580) return { label: 'Fair',       bg: 'var(--accent-amber-soft)', fg: '#92400e' }
  return { label: 'Poor', bg: 'var(--accent-crimson-soft)', fg: 'var(--accent-crimson-deep)' }
}

export function TotalMoneyCard({ account, onConfigure }: { account: Account | null; onConfigure: () => void }) {
  if (!account) {
    return (
      <div className="surface-card p-5 flex flex-col gap-4">
        <div className="label">Your money</div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Configure your accounts to see your financial overview.
        </div>
        <button className="btn-primary self-start" onClick={onConfigure}>
          Set up accounts
        </button>
      </div>
    )
  }

  const total = account.savings + account.debt + account.currentBalance
  const safeTotal = total > 0 ? total : 1
  const savingsPct = (account.savings / safeTotal) * 100
  const debtPct = (account.debt / safeTotal) * 100
  const creditPct = (account.currentBalance / safeTotal) * 100

  const chip = scoreChip(account.creditScore)

  return (
    <div className="surface-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="label">Your money</div>
          <div
            className="font-mono font-semibold tabular-nums mt-1"
            style={{ color: 'var(--text-primary)', fontSize: 28, lineHeight: 1 }}
          >
            {fmtUSD(account.savings - account.currentBalance - account.debt)}
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Net worth (savings − debt)
          </div>
        </div>
        <button
          className="text-xs px-2 py-1 rounded-md hover:opacity-80 transition-opacity"
          style={{ background: 'var(--bg-card-soft)', color: 'var(--text-secondary)' }}
          onClick={onConfigure}
          title="Edit accounts"
        >
          Edit
        </button>
      </div>

      {/* Stacked bar */}
      <div className="flex flex-col gap-2">
        <div className="h-2.5 w-full rounded-full overflow-hidden flex" style={{ background: 'var(--border-soft)' }}>
          <div style={{ width: `${savingsPct}%`, background: 'var(--accent-jade)' }} />
          <div style={{ width: `${creditPct}%`,   background: 'var(--accent-amber)' }} />
          <div style={{ width: `${debtPct}%`,     background: 'var(--accent-crimson)' }} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <Row color="var(--accent-jade)"    label="Savings" value={fmtUSD(account.savings)} />
          <Row color="var(--accent-amber)"   label="Credit"  value={fmtUSD(account.currentBalance)} />
          <Row color="var(--accent-crimson)" label="Debt"    value={fmtUSD(account.debt)} />
        </div>
      </div>

      {/* Credit score */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
        style={{ background: 'var(--bg-card-soft)' }}
      >
        <div>
          <div className="label" style={{ fontSize: 10 }}>Credit score</div>
          <div className="font-mono font-semibold tabular-nums" style={{ fontSize: 20, color: 'var(--text-primary)' }}>
            {account.creditScore}
          </div>
        </div>
        <span
          className="text-[11px] font-medium px-2 py-1 rounded-full"
          style={{ background: chip.bg, color: chip.fg }}
        >
          {chip.label}
        </span>
      </div>
    </div>
  )
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="font-mono font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}
