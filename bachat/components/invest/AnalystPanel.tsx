'use client'

import { useEffect, useState } from 'react'
import type { AnalystData } from '@/types'

export function AnalystPanel({ symbol }: { symbol: string }) {
  const [data, setData] = useState<AnalystData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/invest/analyst/${encodeURIComponent(symbol)}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setErr(json.error ?? 'No coverage')
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

  if (loading) {
    return (
      <div className="surface-card p-5">
        <div className="label mb-2">Analyst consensus</div>
        <div className="text-[var(--text-muted)] text-sm">Loading…</div>
      </div>
    )
  }
  if (err || !data) {
    return (
      <div className="surface-card p-5">
        <div className="label mb-2">Analyst consensus</div>
        <div className="text-[var(--text-muted)] text-sm">{err ?? 'No coverage available for this symbol.'}</div>
      </div>
    )
  }

  const b = data.buckets
  const total = b.strongBuy + b.buy + b.hold + b.sell + b.strongSell

  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="label mb-1">Analyst consensus</div>
          <div className="text-xs text-[var(--text-muted)] font-mono">
            {total} analysts · period {b.period} · targets as of {data.targets.asOf}
          </div>
        </div>
      </div>

      {/* Bucket bar */}
      {total > 0 && (
        <div className="flex h-4 rounded-full overflow-hidden mb-4 bg-[var(--bg-card-soft)]">
          {b.strongBuy > 0 && <div style={{ width: `${(b.strongBuy / total) * 100}%`, background: '#047857' }} />}
          {b.buy > 0 && <div style={{ width: `${(b.buy / total) * 100}%`, background: '#10B981' }} />}
          {b.hold > 0 && <div style={{ width: `${(b.hold / total) * 100}%`, background: '#6B7280' }} />}
          {b.sell > 0 && <div style={{ width: `${(b.sell / total) * 100}%`, background: '#EF4444' }} />}
          {b.strongSell > 0 && <div style={{ width: `${(b.strongSell / total) * 100}%`, background: '#B91C1C' }} />}
        </div>
      )}

      <div className="grid grid-cols-5 gap-1 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-mono text-center mb-5">
        <div>Str Buy<br /><span className="text-[var(--text-primary)]">{b.strongBuy}</span></div>
        <div>Buy<br /><span className="text-[var(--text-primary)]">{b.buy}</span></div>
        <div>Hold<br /><span className="text-[var(--text-primary)]">{b.hold}</span></div>
        <div>Sell<br /><span className="text-[var(--text-primary)]">{b.sell}</span></div>
        <div>Str Sell<br /><span className="text-[var(--text-primary)]">{b.strongSell}</span></div>
      </div>

      {/* Price targets */}
      {data.targets.mean > 0 && (
        <div className="mb-4">
          <div className="label mb-2">12-month price target</div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Low</div>
              <div className="font-mono text-[var(--text-primary)]">${data.targets.low.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Mean</div>
              <div className="font-mono text-[var(--accent-primary)] text-base font-semibold">
                ${data.targets.mean.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">High</div>
              <div className="font-mono text-[var(--text-primary)]">${data.targets.high.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent changes */}
      {data.recentChanges.length > 0 && (
        <div>
          <div className="label mb-2">Recent rating changes</div>
          <ul className="text-xs space-y-1 font-mono">
            {data.recentChanges.slice(0, 6).map((r, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="text-[var(--text-secondary)]">{r.firm}</span>
                <span className="text-[var(--text-muted)]">
                  {r.from} → <span className="text-[var(--text-primary)]">{r.to}</span> · {r.date}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
