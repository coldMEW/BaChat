'use client'

import { useEffect, useState } from 'react'
import type { NewsArticle } from '@/types'

export function NewsTimeline({
  symbol,
  excludeIds = [],
}: {
  symbol: string
  excludeIds?: string[]
}) {
  const [items, setItems] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setErr(null)
      setItems([])
      try {
        const res = await fetch(`/api/invest/news/${encodeURIComponent(symbol)}?days=14`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.data) {
          setErr(json.error ?? 'No news available for this ticker')
          return
        }
        const exclude = new Set(excludeIds)
        const filtered = (json.data as NewsArticle[]).filter((a) => !exclude.has(a.id))
        setItems(filtered.slice(0, 20))
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
  }, [symbol, excludeIds.join(',')])

  const bull = items.filter((a) => a.sentiment?.stance === 'bullish').length
  const bear = items.filter((a) => a.sentiment?.stance === 'bearish').length
  const neut = items.filter((a) => !a.sentiment || a.sentiment.stance === 'neutral').length

  return (
    <div className="surface-card p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-semibold">
            News · <span style={{ color: 'var(--accent-primary)' }}>{symbol.replace('/USD', '')}</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Finnhub · past 14 days · Claude-classified sentiment
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex gap-1 flex-wrap justify-end">
            <span className="chip jade font-mono">{bull} bull</span>
            <span className="chip crimson font-mono">{bear} bear</span>
            <span className="chip muted font-mono">{neut} neutral</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1" style={{ maxHeight: '460px' }}>
        {loading ? (
          <div className="text-[var(--text-muted)] text-sm py-4">Fetching + classifying headlines…</div>
        ) : err ? (
          <div className="text-[var(--accent-crimson)] text-sm py-4">{err}</div>
        ) : items.length === 0 ? (
          <div className="text-[var(--text-muted)] text-sm py-4">No articles for {symbol} in the last 14 days.</div>
        ) : (
          <ul className="space-y-3">
            {items.map((a) => (
              <li key={a.id} className="border-b border-[var(--border-soft)] last:border-0 pb-3 last:pb-0">
                <div className="flex items-start gap-2 mb-1">
                  {a.sentiment && (
                    <span
                      className={`chip ${
                        a.sentiment.stance === 'bullish'
                          ? 'jade'
                          : a.sentiment.stance === 'bearish'
                            ? 'crimson'
                            : 'muted'
                      } flex-none`}
                    >
                      {a.sentiment.stance}
                    </span>
                  )}
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--text-primary)] hover:text-[var(--accent-primary)] leading-snug"
                  >
                    {a.headline}
                  </a>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                  {a.source} · {timeAgo(a.publishedAt)}
                  {a.sentiment && ` · conviction ${a.sentiment.conviction.toFixed(2)}`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
