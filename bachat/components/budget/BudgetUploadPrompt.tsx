'use client'

import Link from 'next/link'
import { Wallet } from 'lucide-react'

export function BudgetUploadPrompt() {
  return (
    <div className="surface-card mx-auto max-w-md p-10 text-center section-enter">
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary-deep)' }}
      >
        <Wallet size={32} strokeWidth={1.6} />
      </div>
      <h2 className="font-lora text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Upload a statement to get started
      </h2>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Bachat will analyze your spending, calculate your budget score, and generate personalized suggestions.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/dashboard" className="btn-primary text-sm">
          Go to Dashboard →
        </Link>
        <Link
          href="/dashboard"
          className="btn-ghost border text-sm"
          style={{ border: '1px solid var(--border-strong)' }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
