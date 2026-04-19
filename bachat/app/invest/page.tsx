'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Candle, Holding } from '@/types'
import { db } from '@/lib/db'
import { DEMO_USER_ID, ensureSeed } from '@/lib/demo-seed'
import { Sidebar } from '@/components/invest/Sidebar'
import { HoldingsStrip } from '@/components/invest/HoldingsStrip'
import { OverviewCard } from '@/components/invest/OverviewCard'
import { PriceChart } from '@/components/invest/PriceChart'
import { DirectionScore } from '@/components/invest/DirectionScore'
import { DiversificationPanel } from '@/components/invest/DiversificationPanel'
import { NewsTimeline } from '@/components/invest/NewsTimeline'
import { AnalystPanel } from '@/components/invest/AnalystPanel'
import { MarketsStrip } from '@/components/invest/MarketsStrip'
import { KnowledgeGraph } from '@/components/invest/KnowledgeGraph'
import { TopNewsRow } from '@/components/invest/TopNewsRow'
import { AddHoldingForm } from '@/components/invest/AddHoldingForm'
import { SymbolSelector } from '@/components/invest/SymbolSelector'

type Section = 'overview' | 'diversification' | 'network'

const DISPLAY_NAME_KEY = 'bachat:display-name'
const DEFAULT_DISPLAY_NAME = 'Jojo'

function getDisplayName(): string {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_NAME
  try {
    return window.localStorage.getItem(DISPLAY_NAME_KEY) ?? DEFAULT_DISPLAY_NAME
  } catch {
    return DEFAULT_DISPLAY_NAME
  }
}

export default function InvestDashboard() {
  // Read URL params ONCE on mount (avoids the Next.js dynamic-render deopt
  // that `useSearchParams` triggers — which was making redirect navigation
  // much slower than direct /invest visits).
  const [bridge, setBridge] = useState<{ symbol: string; amount: number; txId: string } | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    const symbol = (p.get('suggest') ?? '').toUpperCase()
    if (!symbol) return
    setBridge({
      symbol,
      amount: Number(p.get('amount') ?? '') || 0,
      txId: p.get('redirect') ?? '',
    })
  }, [])
  const redirectSymbol = bridge?.symbol ?? ''
  const redirectAmount = bridge?.amount ?? 0
  const redirectTxId = bridge?.txId ?? ''

  const [holdings, setHoldings] = useState<Holding[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [bridgeDismissed, setBridgeDismissed] = useState(false)
  const [section, setSection] = useState<Section>('overview')
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [topNewsIds, setTopNewsIds] = useState<string[]>([])
  const [displayName, setDisplayName] = useState<string>(DEFAULT_DISPLAY_NAME)
  const [candleMap, setCandleMap] = useState<Record<string, Candle[]>>({})

  const refresh = useCallback(async () => {
    const all = await db().holdings.where('userId').equals(DEMO_USER_ID).toArray()
    setHoldings(all)
    if (all.length > 0 && (!selected || !all.some((h) => h.symbol === selected))) {
      setSelected(all[0].symbol)
    }
  }, [selected])

  useEffect(() => {
    ;(async () => {
      await ensureSeed()
      await refresh()
      setDisplayName(getDisplayName())
      setLoading(false)
    })()
  }, [refresh])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        holdings.map(async (h) => {
          try {
            const res = await fetch(`/api/invest/prices/${encodeURIComponent(h.symbol)}?days=30`)
            const json = await res.json()
            return [h.symbol, (json.data as Candle[]) ?? []] as const
          } catch {
            return [h.symbol, [] as Candle[]] as const
          }
        }),
      )
      if (cancelled) return
      const map: Record<string, Candle[]> = {}
      for (const [s, c] of entries) map[s] = c
      setCandleMap(map)
    })()
    return () => { cancelled = true }
  }, [holdings.map((h) => h.symbol).join(',')])

  // Background-prefetch the graph for the selected symbol so Network tab
  // feels instant when the user navigates there. Fire-and-forget.
  useEffect(() => {
    if (!selected) return
    fetch(`/api/invest/graph/${encodeURIComponent(selected)}?days=180`).catch(() => {})
  }, [selected])

  async function onAdd(h: Omit<Holding, 'id'>) {
    await db().holdings.add(h as Holding)
    setShowAdd(false)
    await refresh()
  }
  async function onRemoveSelected() {
    if (!selected) return
    const row = holdings.find((h) => h.symbol === selected)
    if (!row) return
    await db().holdings.delete(row.id)
    await refresh()
  }

  const sel = useMemo(() => holdings.find((h) => h.symbol === selected) ?? null, [holdings, selected])
  const selSym = selected ?? (holdings[0]?.symbol ?? 'NVDA')

  const searchMatches = useMemo(() => {
    if (!search.trim()) return []
    const q = search.trim().toUpperCase()
    return holdings.filter((h) => h.symbol.toUpperCase().includes(q)).slice(0, 6)
  }, [search, holdings])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchMatches.length > 0) {
      setSelected(searchMatches[0].symbol)
      setSearch('')
      setSearchFocused(false)
    }
  }

  const nameInitial = displayName.charAt(0).toUpperCase()

  const [refreshing, setRefreshing] = useState(false)
  async function onRefresh() {
    setRefreshing(true)
    try {
      await fetch('/api/invest/invalidate', { method: 'POST' })
    } finally {
      // Hard reload — easiest way to force every client component to refetch.
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen" style={{ color: 'var(--text-primary)' }}>
      <Sidebar active="invest" />

      <div className="pl-[68px]">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-4"
          style={{
            background: 'rgba(244, 241, 251, 0.78)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-soft)',
          }}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-[26px] font-semibold tracking-tight font-lora">Invest</h1>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-8 relative hidden md:block">
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
              className="field search-field"
              placeholder="Search your holdings (NVDA, BTC, VTI…)"
            />
            {searchFocused && searchMatches.length > 0 && (
              <div className="suggest-dropdown">
                {searchMatches.map((h, i) => (
                  <div
                    key={h.id}
                    className={`suggest-item ${i === 0 ? 'active' : ''}`}
                    onMouseDown={() => {
                      setSelected(h.symbol)
                      setSearch('')
                      setSearchFocused(false)
                    }}
                  >
                    <span>
                      <strong>{h.symbol}</strong>{' '}
                      <span className="mono-sub ml-1">{h.assetType}</span>
                    </span>
                    <span className="mono-sub">{h.shares} sh</span>
                  </div>
                ))}
              </div>
            )}
          </form>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="btn-ghost flex items-center gap-2 disabled:opacity-50"
              title="Clear cache and re-fetch all data from upstream APIs"
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className={refreshing ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button onClick={() => setShowAdd((v) => !v)} className="btn-primary">+ Add holding</button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">{displayName}</span>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #7B61FF, #5B3FE8)', color: '#fff' }}
              >
                {nameInitial}
              </div>
            </div>
          </div>
        </header>

        {redirectSymbol && !bridgeDismissed && !showAdd && (
          <div className="px-6 pt-4 max-w-[1600px] mx-auto">
            <div
              className="surface-card p-4 flex items-center justify-between gap-4"
              style={{ borderLeft: '3px solid var(--accent-primary)' }}
            >
              <div className="flex-1">
                <div className="label" style={{ fontSize: 10 }}>Dashboard redirect</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                  {redirectTxId ? 'That impulse purchase' : 'Your dashboard'} suggested redirecting{' '}
                  <span className="font-mono font-semibold" style={{ color: 'var(--accent-primary-deep)' }}>
                    ${redirectAmount.toFixed(0)}
                  </span>
                  {' '}into{' '}
                  <span className="font-mono font-semibold">{redirectSymbol}</span>.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBridgeDismissed(true)}
                  className="btn-ghost text-xs"
                >
                  Dismiss
                </button>
                <button onClick={() => setShowAdd(true)} className="btn-primary text-xs">
                  Pre-fill {redirectSymbol}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAdd && (
          <div className="px-6 pt-4 max-w-[1600px] mx-auto">
            <AddHoldingForm
              onAdd={onAdd}
              initialSymbol={redirectSymbol}
              hintAmount={redirectAmount || undefined}
            />
          </div>
        )}

        {/* Individual section pills with proper spacing */}
        <div className="px-6 pt-5 max-w-[1600px] mx-auto">
          <div className="flex flex-wrap gap-3">
            <button className={`tab-pill ${section === 'overview' ? 'active' : ''}`} onClick={() => setSection('overview')}>
              Overview
              <span className="count">{holdings.length}</span>
            </button>
            <button className={`tab-pill ${section === 'diversification' ? 'active' : ''}`} onClick={() => setSection('diversification')}>
              Diversification
            </button>
            <button className={`tab-pill ${section === 'network' ? 'active' : ''}`} onClick={() => setSection('network')}>
              Network &amp; News
            </button>
          </div>
        </div>

        <main className="px-6 py-6 max-w-[1600px] mx-auto">
          {loading ? (
            <div className="surface-card p-12 text-center text-[var(--text-muted)]">Loading portfolio…</div>
          ) : (
            <div key={section} className="section-enter space-y-5">
              {section === 'overview' && (
                <>
                  {/* ROW 1: My Holdings strip on TOP (compact, scrollable, with % change) */}
                  <div className="surface-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold">My Holdings</h3>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">
                          {holdings.length} positions · daily % change
                        </p>
                      </div>
                      <div className="flex gap-3 items-center">
                        {sel && (
                          <button onClick={onRemoveSelected} className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-crimson)]">
                            Remove {sel.symbol}
                          </button>
                        )}
                        <span className="text-[var(--accent-jade-deep)] text-sm cursor-pointer hover:underline" onClick={() => setShowAdd(true)}>
                          + Add
                        </span>
                      </div>
                    </div>
                    <HoldingsStrip holdings={holdings} selected={selected} onSelect={setSelected} preloadedCandles={candleMap} />
                  </div>

                  {/* ROW 2: Overview on the left (~30%) + Chart on the right (~70%).
                      Chart fills the vertical height of the row, matching Overview. */}
                  <div
                    className="grid gap-5 items-stretch"
                    style={{ gridTemplateColumns: 'minmax(300px, 3fr) minmax(480px, 7fr)' }}
                  >
                    <OverviewCard holdings={holdings} preloadedCandles={candleMap} />
                    <PriceChart symbol={selSym} fill minHeight={320} />
                  </div>

                  {/* ROW 3: Directional Score full-width */}
                  <DirectionScore symbol={selSym} />

                  {/* ROW 3: Top 2 news (roomier now) */}
                  <div>
                    <div className="flex items-baseline justify-between mb-3 px-1">
                      <h3 className="text-base font-semibold">
                        Top stories · <span style={{ color: 'var(--accent-primary)' }}>{selSym.replace('/USD', '')}</span>
                      </h3>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        highest-conviction headlines · past 14 days
                      </span>
                    </div>
                    <TopNewsRow symbol={selSym} onIdsChange={setTopNewsIds} />
                  </div>
                </>
              )}

              {section === 'diversification' && (
                <>
                  <SymbolSelector holdings={holdings} selected={selected} onSelect={setSelected} label="Analyst panel" />
                  <div
                    className="grid gap-5"
                    style={{ gridTemplateColumns: 'minmax(520px, 2fr) minmax(300px, 1fr)' }}
                  >
                    <DiversificationPanel holdings={holdings} />
                    <div className="grid gap-5 content-start">
                      <AnalystPanel symbol={selSym} />
                      <MarketsStrip holdings={holdings} />
                    </div>
                  </div>
                </>
              )}

              {section === 'network' && (
                <>
                  <SymbolSelector holdings={holdings} selected={selected} onSelect={setSelected} label="Center node" />
                  <div
                    className="grid gap-5"
                    style={{ gridTemplateColumns: 'minmax(520px, 3fr) minmax(320px, 2fr)' }}
                  >
                    <KnowledgeGraph symbol={selSym} onSelect={setSelected} />
                    <NewsTimeline symbol={selSym} excludeIds={topNewsIds} />
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
