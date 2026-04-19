'use client'

import { useEffect, useState } from 'react'
import type { NewsArticle } from '@/types'

export function TopNewsRow({ symbol, onIdsChange }: { symbol: string; onIdsChange?: (ids: string[]) => void }) {
  const [items, setItems] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setItems([])
      try {
        const res = await fetch(`/api/invest/news/${encodeURIComponent(symbol)}?days=14`)
        const json = await res.json()
        if (cancelled || !json.data) return
        const articles = json.data as NewsArticle[]
        // Score = |sentiment_sign| * conviction * recency, pick top 2
        const now = Date.now()
        const ranked = articles
          .map((a) => {
            const recency = Math.exp(-(now - a.publishedAt) / (7 * 24 * 3600 * 1000))
            const sign = a.sentiment?.stance === 'bullish' ? 1 : a.sentiment?.stance === 'bearish' ? 1 : 0.3
            const conviction = a.sentiment?.conviction ?? 0
            return { a, score: sign * conviction * recency }
          })
          .sort((x, y) => y.score - x.score)
        const top = ranked.slice(0, 2).map((r) => r.a)
        setItems(top)
        onIdsChange?.(top.map((a) => a.id))
      } catch {
        /* noop */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [symbol, onIdsChange])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {loading &&
        [0, 1].map((i) => (
          <div key={i} className="news-hero">
            <div className="text-[var(--text-muted)] text-sm">Loading top story…</div>
          </div>
        ))}

      {!loading &&
        items.map((a) => {
          const accent =
            a.sentiment?.stance === 'bullish'
              ? 'var(--accent-jade)'
              : a.sentiment?.stance === 'bearish'
                ? 'var(--accent-crimson)'
                : 'var(--accent-primary)'
          return (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-hero group"
              style={{ borderLeft: `3px solid ${accent}` }}
            >
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  {a.sentiment && (
                    <span
                      className={`chip ${
                        a.sentiment.stance === 'bullish'
                          ? 'jade'
                          : a.sentiment.stance === 'bearish'
                            ? 'crimson'
                            : 'muted'
                      }`}
                    >
                      {a.sentiment.stance}
                    </span>
                  )}
                  <span>{a.source}</span>
                </div>
                <span>{timeAgo(a.publishedAt)}</span>
              </div>
              <h3 className="text-base font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">
                {a.headline}
              </h3>
              {a.summary && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                  {a.summary}
                </p>
              )}
              {a.sentiment && (
                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                  conviction {a.sentiment.conviction.toFixed(2)} · rank by relevance × recency
                </div>
              )}
            </a>
          )
        })}
      {!loading && items.length === 0 && (
        <div className="news-hero col-span-2 text-[var(--text-muted)] text-sm">
          No recent news for {symbol.replace('/USD', '')} in the last 14 days.
        </div>
      )}
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
