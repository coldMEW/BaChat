'use client'

import Link from 'next/link'
import type { RoastPayload } from '@/types'

const TONE_STYLE: Record<RoastPayload['tone'], { chipBg: string; chipFg: string; label: string }> = {
  savage: {
    chipBg: 'var(--accent-crimson-soft)',
    chipFg: 'var(--accent-crimson-deep)',
    label: 'Savage',
  },
  dry: {
    chipBg: 'var(--accent-primary-soft)',
    chipFg: 'var(--accent-primary-deep)',
    label: 'Dry',
  },
  supportive: {
    chipBg: 'var(--accent-jade-soft)',
    chipFg: 'var(--accent-jade-deep)',
    label: 'Supportive',
  },
}

export function RoastCard({ roast, loading }: { roast: RoastPayload | null; loading?: boolean }) {
  if (loading) {
    return (
      <div className="surface-card p-5 h-full flex items-center" style={{ minHeight: 140 }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Analyzing the damage…</div>
      </div>
    )
  }

  if (!roast) {
    return (
      <div className="surface-card p-5 h-full flex items-center" style={{ minHeight: 140 }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Nothing roastable this week. Nice discipline.
        </div>
      </div>
    )
  }

  const style = TONE_STYLE[roast.tone]
  const href =
    roast.redirectSymbol && roast.redirectAmount
      ? `/invest?redirect=${roast.subjectTxId ?? ''}&suggest=${encodeURIComponent(roast.redirectSymbol)}&amount=${roast.redirectAmount}`
      : '/invest'

  // Accent bar on the left edge encodes tone without a visible chip.
  void style
  const accent =
    roast.tone === 'savage' ? 'var(--accent-crimson)'
    : roast.tone === 'supportive' ? 'var(--accent-jade)'
    : 'var(--accent-primary)'

  return (
    <div
      className="surface-card px-5 py-3 flex items-center gap-4 flex-wrap"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <p
        className="font-lora flex-1 min-w-[200px]"
        style={{ fontSize: 16, lineHeight: 1.4, color: 'var(--text-primary)' }}
      >
        {roast.roast}
      </p>
      {roast.redirectSymbol && (
        <Link href={href} className="btn-primary text-xs px-3 py-1.5 shrink-0">
          {roast.redirectSuggestion || 'Redirect →'}
        </Link>
      )}
    </div>
  )
}
