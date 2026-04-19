'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Holding, Quote } from '@/types'

interface QuoteMap {
  [symbol: string]: { price: number; changePct: number } | undefined
}

async function fetchLatestClose(symbol: string): Promise<{ price: number; changePct: number } | null> {
  const res = await fetch(`/api/invest/prices/${encodeURIComponent(symbol)}?days=5`)
  if (!res.ok) return null
  const json = await res.json()
  if (!json.data || json.data.length < 2) return null
  const candles: number[][] = json.data
  const latest = candles[candles.length - 1]
  const prev = candles[candles.length - 2]
  const price = latest[4]
  const changePct = ((price - prev[4]) / prev[4]) * 100
  return { price, changePct }
}

export function HoldingsTable({
  holdings,
  onRemove,
}: {
  holdings: Holding[]
  onRemove: (id: number) => void
}) {
  const [quotes, setQuotes] = useState<QuoteMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const entries = await Promise.all(
        holdings.map(async (h) => {
          const q = await fetchLatestClose(h.symbol).catch(() => null)
          return [h.symbol, q] as const
        }),
      )
      if (cancelled) return
      const next: QuoteMap = {}
      for (const [sym, q] of entries) next[sym] = q ?? undefined
      setQuotes(next)
      setLoading(false)
    }
    if (holdings.length > 0) load()
    else setLoading(false)
    return () => {
      cancelled = true
    }
  }, [holdings.map((h) => h.symbol).join(',')])

  if (holdings.length === 0) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-[var(--text-secondary)]">No holdings yet. Add one above to get started.</p>
      </div>
    )
  }

  return (
    <div className="surface-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--border-soft)]">
          <tr className="text-left">
            <th className="label px-5 py-3">Symbol</th>
            <th className="label px-5 py-3">Shares</th>
            <th className="label px-5 py-3">Cost basis</th>
            <th className="label px-5 py-3">Price</th>
            <th className="label px-5 py-3">Market value</th>
            <th className="label px-5 py-3">Gain</th>
            <th className="label px-5 py-3">Today</th>
            <th className="label px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const q = quotes[h.symbol]
            const price = q?.price
            const value = price ? price * h.shares : null
            const costTotal = h.costBasis * h.shares
            const gain = value !== null ? value - costTotal : null
            const gainPct = gain !== null && costTotal > 0 ? (gain / costTotal) * 100 : null
            return (
              <tr key={h.id} className="border-b border-[var(--border-soft)] last:border-0">
                <td className="px-5 py-4">
                  <Link
                    href={`/invest/${encodeURIComponent(h.symbol)}`}
                    className="font-lora font-semibold text-base hover:text-[var(--accent-primary)]"
                  >
                    {h.symbol}
                  </Link>
                  <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                    {h.assetType}
                  </div>
                </td>
                <td className="px-5 py-4 font-mono">{h.shares}</td>
                <td className="px-5 py-4 font-mono">${h.costBasis.toFixed(2)}</td>
                <td className="px-5 py-4 font-mono">
                  {price !== undefined ? `$${price.toFixed(2)}` : loading ? '—' : 'n/a'}
                </td>
                <td className="px-5 py-4 font-mono">
                  {value !== null ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
                </td>
                <td className={`px-5 py-4 font-mono ${gain !== null ? (gain >= 0 ? 'delta-up' : 'delta-down') : ''}`}>
                  {gain !== null
                    ? `${gain >= 0 ? '+' : ''}$${gain.toFixed(0)} (${gainPct?.toFixed(1)}%)`
                    : '—'}
                </td>
                <td className={`px-5 py-4 font-mono ${q ? (q.changePct >= 0 ? 'delta-up' : 'delta-down') : ''}`}>
                  {q ? `${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%` : '—'}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onRemove(h.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-crimson)] text-xs"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
