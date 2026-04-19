'use client'

import { useEffect, useState } from 'react'
import type { DiversificationAnalysis, Holding } from '@/types'

export function DiversificationPanel({ holdings }: { holdings: Holding[] }) {
  const [analysis, setAnalysis] = useState<DiversificationAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (holdings.length === 0) return
      setLoading(true)
      setErr(null)
      try {
        const res = await fetch('/api/invest/portfolio-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ holdings }),
        })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.data) {
          setErr(json.error ?? 'Analysis failed')
          setAnalysis(null)
        } else {
          setAnalysis(json.data)
        }
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
  }, [holdings.map((h) => `${h.symbol}:${h.shares}`).join('|')])

  if (holdings.length === 0) {
    return (
      <div className="surface-card p-6">
        <div className="label mb-2">Diversification</div>
        <p className="text-[var(--text-secondary)] text-sm">
          Add at least 2 holdings to see your diversification score.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="surface-card p-6">
        <div className="label mb-2">Diversification</div>
        <p className="text-[var(--text-muted)] text-sm">Crunching correlations across {holdings.length} holdings…</p>
      </div>
    )
  }

  if (err || !analysis) {
    return (
      <div className="surface-card p-6">
        <div className="label mb-2">Diversification</div>
        <p className="text-[var(--accent-crimson)] text-sm">Could not compute: {err ?? 'unknown'}</p>
      </div>
    )
  }

  const scoreColor =
    analysis.score >= 75
      ? 'var(--accent-jade)'
      : analysis.score >= 50
        ? 'var(--accent-amber)'
        : 'var(--accent-crimson)'

  return (
    <div className="surface-card p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="label mb-1">Diversification score</div>
          <div className="flex items-baseline gap-2">
            <div
              className="stat-value text-5xl"
              style={{ color: scoreColor }}
            >
              {analysis.score}
            </div>
            <div className="text-sm text-[var(--text-muted)] font-mono">/ 100</div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">
            {analysis.lookbackDays} trading days · as of {analysis.asOf.slice(0, 10)}
          </div>
        </div>
        <ScoreRing score={analysis.score} color={scoreColor} />
      </div>

      <div className="space-y-3">
        {analysis.drivers.map((d) => (
          <div key={d.key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--text-secondary)]">{d.label}</span>
              <span className="font-mono text-[var(--text-primary)]">
                {d.value.toFixed(3)} · −{d.contribution}pt
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-card-soft)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, d.contribution * 2)}%`,
                  background: 'linear-gradient(90deg, var(--accent-amber), var(--accent-crimson))',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {analysis.suggestions.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[var(--border-soft)]">
          <div className="label mb-3">Suggested rebalances</div>
          <div className="space-y-3">
            {analysis.suggestions.map((s) => (
              <div key={s.id} className="surface-panel p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="font-mono text-sm font-semibold">
                    Move ${s.action.dollarAmount.toLocaleString()} from {s.action.from} → {s.action.to}
                  </div>
                  <span
                    className={`chip ${
                      s.confidence === 'high' ? 'jade' : s.confidence === 'medium' ? 'amber' : 'muted'
                    }`}
                  >
                    {s.confidence}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{s.rationale}</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-[var(--text-muted)] uppercase tracking-widest">Score</div>
                    <div className="font-mono mt-1">
                      {s.projectedScoreChange.from} → <span className="delta-up">{s.projectedScoreChange.to}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--text-muted)] uppercase tracking-widest">Sharpe</div>
                    <div className="font-mono mt-1">
                      {s.projectedSharpeChange.from} → {s.projectedSharpeChange.to}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--text-muted)] uppercase tracking-widest">Corr</div>
                    <div className="font-mono mt-1">{s.correlationWithPortfolio}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-[11px] text-[var(--text-muted)] leading-relaxed">
        Based on {analysis.lookbackDays} trading days. Correlation is historical — a 0.8 today does not guarantee 0.8 next
        month.
      </p>
    </div>
  )
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r={r} stroke="var(--bg-card-soft)" strokeWidth="8" fill="none" />
      <circle
        cx="45"
        cy="45"
        r={r}
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 45 45)"
      />
    </svg>
  )
}
