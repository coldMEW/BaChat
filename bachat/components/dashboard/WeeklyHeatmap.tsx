'use client'

import { useState } from 'react'
import type { HeatmapCell } from '@/types'

const HEAT_COLORS: Record<HeatmapCell['level'], string> = {
  0: 'var(--border-soft)',
  1: 'var(--accent-jade-soft)',
  2: '#D9F3E4',
  3: 'var(--accent-amber-soft)',
  4: '#FED7AA',
  5: 'var(--accent-crimson-soft)',
  6: 'var(--accent-crimson)',
}

function fmtUSD(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export function WeeklyHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="surface-card p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <div className="label">Last 7 days</div>
        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          red = impulse · green = steady
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        {cells.map((cell, i) => {
          const isActive = hovered === i
          const textColor = cell.level >= 5 ? '#fff' : 'var(--text-secondary)'
          return (
            <div
              key={cell.date}
              className="flex flex-col items-center gap-1.5 flex-1 relative"
            >
              <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {cell.label}
              </div>
              <button
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="w-full aspect-square rounded-lg transition-transform"
                style={{
                  background: HEAT_COLORS[cell.level],
                  border: cell.level === 0
                    ? '1px dashed var(--border-strong)'
                    : '1px solid transparent',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  cursor: cell.totalSpend > 0 ? 'pointer' : 'default',
                  maxWidth: 52,
                }}
                aria-label={`${cell.label} ${cell.date} — ${fmtUSD(cell.totalSpend)}`}
              >
                <span
                  className="text-[10px] font-mono font-medium tabular-nums"
                  style={{ color: textColor }}
                >
                  {cell.totalSpend > 0 ? fmtUSD(cell.totalSpend) : ''}
                </span>
              </button>
              {isActive && cell.totalSpend > 0 && (
                <div
                  className="absolute top-full mt-2 z-30 pointer-events-none"
                  style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    boxShadow: 'var(--shadow-hover)',
                    minWidth: 180,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {cell.label} · {cell.date}
                  </div>
                  <div className="font-mono font-semibold tabular-nums mb-2" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                    {fmtUSD(cell.totalSpend)}
                    {cell.impulseSpend > 0 && (
                      <span className="ml-2 text-[10px] font-normal" style={{ color: 'var(--accent-crimson-deep)' }}>
                        {fmtUSD(cell.impulseSpend)} impulse
                      </span>
                    )}
                  </div>
                  {cell.topTx.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {cell.topTx.map((tx, j) => (
                        <div key={j} className="flex justify-between text-[11px]">
                          <span style={{ color: 'var(--text-secondary)' }}>{tx.merchant}</span>
                          <span className="font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                            {fmtUSD(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
