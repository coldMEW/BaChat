'use client'

import { useState } from 'react'
import type { ParsedTransactionPreview } from '@/types'

interface Props {
  previews: ParsedTransactionPreview[]
  warnings: string[]
  onConfirm: (rows: ParsedTransactionPreview[]) => void
  onCancel: () => void
}

export function ExtractedPreview({ previews, warnings, onConfirm, onCancel }: Props) {
  const [rows, setRows] = useState<ParsedTransactionPreview[]>(previews)

  function update(idx: number, patch: Partial<ParsedTransactionPreview>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  function remove(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const lowConfidenceCount = rows.filter((r) => r.needsReview).length

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(28, 26, 46, 0.55)' }}
      onClick={onCancel}
    >
      <div
        className="surface-card p-6 w-full max-w-4xl flex flex-col gap-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="label">Review & confirm</div>
          <h2 className="font-lora" style={{ fontSize: 22, color: 'var(--text-primary)' }}>
            {rows.length} transactions ready to import
          </h2>
          {lowConfidenceCount > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--accent-crimson-deep)' }}>
              {lowConfidenceCount} row{lowConfidenceCount === 1 ? '' : 's'} flagged for review
            </p>
          )}
        </div>

        {warnings.length > 0 && (
          <div
            className="text-xs px-3 py-2 rounded-md"
            style={{ background: 'var(--accent-amber-soft)', color: '#7c2d12' }}
          >
            {warnings.map((w, i) => <div key={i}>• {w}</div>)}
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <th className="text-left p-2 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date</th>
                <th className="text-left p-2 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Merchant</th>
                <th className="text-right p-2 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Amount</th>
                <th className="text-center p-2 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Confidence</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: '1px solid var(--border-soft)',
                    background: r.needsReview ? 'var(--accent-amber-soft)' : 'transparent',
                  }}
                >
                  <td className="p-2">
                    <input
                      type="date"
                      value={r.date}
                      onChange={(e) => update(i, { date: e.target.value })}
                      className="field text-xs"
                      style={{ padding: '2px 6px' }}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={r.merchant}
                      onChange={(e) => update(i, { merchant: e.target.value })}
                      className="field text-xs w-full"
                      style={{ padding: '2px 6px' }}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      value={r.amount}
                      onChange={(e) => update(i, { amount: Number(e.target.value) || 0 })}
                      className="field text-xs font-mono tabular-nums text-right"
                      style={{ padding: '2px 6px', width: 90 }}
                    />
                  </td>
                  <td className="p-2 text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {(r.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => remove(i)}
                      className="text-xs px-2 py-1 rounded-md"
                      style={{ background: 'var(--accent-crimson-soft)', color: 'var(--accent-crimson-deep)' }}
                    >
                      Skip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onCancel} className="btn-ghost">Cancel</button>
          <button
            onClick={() => onConfirm(rows)}
            className="btn-primary"
            disabled={rows.length === 0}
          >
            Import {rows.length} transactions
          </button>
        </div>
      </div>
    </div>
  )
}
