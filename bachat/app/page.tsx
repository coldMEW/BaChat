'use client'

import Link from 'next/link'
import { useEffect } from 'react'

// Warm the server-side price cache for the demo tickers the moment the
// user lands — by the time they click "Open the Invest dashboard", the
// /api/invest/prices/* routes have already done most of the heavy lifting.
const PREFETCH_TICKERS = [
  'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMD',
  'VTI', 'QQQ', 'BTC/USD', 'ETH/USD',
  // Markets strip symbols
  'SPY', 'GLD', 'TLT',
]

export default function HomePage() {
  useEffect(() => {
    // Fire-and-forget prefetches. Browser limits concurrent fetches per origin
    // so these naturally queue; the server-side rate limiter takes it from here.
    for (const t of PREFETCH_TICKERS) {
      fetch(`/api/invest/prices/${encodeURIComponent(t)}?days=30`).catch(() => {})
    }
    // Macro snapshot is cheap + FREE-tier unlimited on FRED — prefetch too
    fetch('/api/invest/macro').catch(() => {})
  }, [])

  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="font-lora text-5xl font-semibold tracking-tight mb-4">
          Ba<span style={{ color: 'var(--accent-primary)' }}>chat</span>
        </div>
        <p className="text-lg text-[var(--text-secondary)] mb-6">
          Privacy-first behavioral finance. The Invest module is live.
        </p>
        <Link href="/invest" className="btn-primary inline-block">
          Open the Invest dashboard →
        </Link>
        <p className="mt-8 text-xs text-[var(--text-muted)] font-mono">
          Warming demo data in the background so Invest loads fast.
        </p>
      </div>
    </main>
  )
}
