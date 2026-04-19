'use client'

import type { Holding } from '@/types'

/** Compact pill row for selecting the "focus" symbol inside non-Overview tabs.
 *  Same visual language as the header tab pills so it feels native. */
export function SymbolSelector({
  holdings,
  selected,
  onSelect,
  label = 'Focus on',
}: {
  holdings: Holding[]
  selected: string | null
  onSelect: (symbol: string) => void
  label?: string
}) {
  if (holdings.length === 0) return null
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="label">{label}</span>
      <div className="flex gap-2 flex-wrap">
        {holdings.map((h) => {
          const isSel = selected === h.symbol
          return (
            <button
              key={h.id}
              onClick={() => onSelect(h.symbol)}
              className="font-mono text-xs transition-all"
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                background: isSel
                  ? 'linear-gradient(135deg, #7B61FF, #5B3FE8)'
                  : 'var(--bg-panel)',
                color: isSel ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${isSel ? 'transparent' : 'var(--border-soft)'}`,
                boxShadow: isSel
                  ? '0 6px 16px rgba(123, 97, 255, 0.28)'
                  : 'var(--shadow-card)',
                cursor: 'pointer',
              }}
            >
              {h.symbol.replace('/USD', '')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
