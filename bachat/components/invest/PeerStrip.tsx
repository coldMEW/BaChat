'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { PeerNode } from '@/types'

export function PeerStrip({ symbol }: { symbol: string }) {
  const [data, setData] = useState<{ center: PeerNode; peers: PeerNode[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/invest/peers/${encodeURIComponent(symbol)}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.data) {
          setErr(json.error ?? 'No peers')
          return
        }
        setData(json.data)
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [symbol])

  return (
    <div className="surface-card p-5">
      <div className="label mb-3">Peers</div>
      {loading ? (
        <div className="text-[var(--text-muted)] text-sm">Loading…</div>
      ) : err || !data ? (
        <div className="text-[var(--text-muted)] text-sm">{err ?? 'No peer data'}</div>
      ) : (
        <ul className="space-y-2">
          {data.peers.map((p) => (
            <li key={p.symbol}>
              <Link
                href={`/invest/${encodeURIComponent(p.symbol)}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--bg-card-soft)] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm font-semibold truncate">{p.symbol}</div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">{p.name}</div>
                </div>
                {p.marketCap && (
                  <div className="text-[11px] text-[var(--text-muted)] font-mono whitespace-nowrap">
                    ${formatCap(p.marketCap)}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function formatCap(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)}T`
  if (m >= 1) return `${m.toFixed(0)}B`
  return m.toFixed(0)
}
