'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
import { UploadZone } from '@/components/dashboard/UploadZone'
import { ExtractedPreview } from '@/components/dashboard/ExtractedPreview'
import { db } from '@/lib/db'
import { DEMO_USER_ID } from '@/lib/demo-seed'
import { lookupMerchant, defaultFallback } from '@/lib/dashboard/merchant-lookup'
import { CATEGORY_DISCRETIONARY_WEIGHTS } from '@/lib/dashboard/score-calibration'
import type { ExtractResult, ParsedTransactionPreview, Transaction, TxCategory } from '@/types'

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  budget: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M2 7h20M2 12h14M2 17h9" />
      <circle cx="19" cy="17" r="3" />
      <path d="M19 15.5v1.5l1 1" />
    </svg>
  ),
  invest: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

const NAV_ITEMS = [
  { key: 'dashboard', icon: ICONS.dashboard, label: 'Dashboard', href: '/dashboard' },
  { key: 'budget',    icon: ICONS.budget,    label: 'Budgeting', href: '/budget'    },
  { key: 'invest',    icon: ICONS.invest,    label: 'Invest',    href: '/invest'    },
  { key: 'settings',  icon: ICONS.settings,  label: 'Settings',  href: '/settings'  },
]

export function Sidebar({ active }: { active: string }) {
  const [showUpload, setShowUpload] = useState(false)
  const [preview, setPreview] = useState<ExtractResult | null>(null)

  const handleConfirmImport = useCallback(async (rows: ParsedTransactionPreview[]) => {
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
        seedOrigin: 'upload' as const,
        pendingReview: r.needsReview,
        createdAt: Date.now(),
      }
    })
    await db().transactions.bulkAdd(toAdd as Transaction[])
    setPreview(null)
    setShowUpload(false)
    window.location.href = '/dashboard'
  }, [])

  const handleClose = useCallback(() => {
    setPreview(null)
    setShowUpload(false)
  }, [])

  return (
    <>
      <aside
        className="fixed left-0 top-0 bottom-0 w-[68px] flex flex-col items-center py-5 gap-3 z-20"
        style={{ background: 'var(--bg-panel)', borderRight: '1px solid var(--border-soft)' }}
      >
        {/* Logo */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
          style={{ background: 'linear-gradient(135deg, #7B61FF, #5B3FE8)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 L22 7 L12 12 L2 7 Z" />
            <path d="M2 17 L12 22 L22 17" />
            <path d="M2 12 L12 17 L22 12" />
          </svg>
        </div>

        {/* Upload button — top of nav */}
        <button
          type="button"
          title="Upload statement or receipt"
          onClick={() => setShowUpload(true)}
          className="sidebar-icon"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-deep))',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(123,97,255,0.35)',
          }}
        >
          {ICONS.upload}
        </button>

        {/* Divider */}
        <div className="w-8 my-1" style={{ height: 1, background: 'var(--border-soft)' }} />

        {/* Nav items */}
        {NAV_ITEMS.map((it) => (
          <Link
            key={it.key}
            href={it.href}
            title={it.label}
            className={`sidebar-icon ${active === it.key ? 'active' : ''}`}
          >
            {it.icon}
          </Link>
        ))}
      </aside>

      {/* Upload modal */}
      {showUpload && !preview && (
        <UploadZone
          onExtracted={(result) => setPreview(result)}
          onClose={handleClose}
        />
      )}
      {preview && (
        <ExtractedPreview
          previews={preview.transactions}
          warnings={preview.warnings}
          onConfirm={handleConfirmImport}
          onCancel={handleClose}
        />
      )}
    </>
  )
}
