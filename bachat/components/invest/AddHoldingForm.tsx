'use client'

import { useState } from 'react'
import type { AssetType, Holding } from '@/types'

const CRYPTO_REGEX = /^(BTC|ETH|SOL|ADA|DOT|AVAX|MATIC|LINK|UNI|DOGE|XRP|LTC|BCH|ATOM|NEAR)(\/USD|\/USDT)?$/i
const ETF_PATTERNS = ['VTI', 'VXUS', 'VOO', 'SPY', 'QQQ', 'BND', 'TLT', 'GLD', 'DBC', 'VNQ', 'USO']

function inferAssetType(sym: string): AssetType {
  const up = sym.toUpperCase()
  if (CRYPTO_REGEX.test(up)) return 'crypto'
  if (ETF_PATTERNS.some((p) => up === p)) return 'etf'
  return 'equity'
}

export function AddHoldingForm({
  onAdd,
}: {
  onAdd: (h: Omit<Holding, 'id'>) => Promise<void> | void
}) {
  const [symbol, setSymbol] = useState('')
  const [shares, setShares] = useState('')
  const [costBasis, setCostBasis] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const s = symbol.trim().toUpperCase()
    const sh = parseFloat(shares)
    const cb = parseFloat(costBasis)
    if (!s || !Number.isFinite(sh) || !Number.isFinite(cb)) return
    setSubmitting(true)
    try {
      await onAdd({
        userId: 'demo-user',
        symbol: s,
        assetType: inferAssetType(s),
        shares: sh,
        costBasis: cb,
        purchaseDate: new Date().toISOString().slice(0, 10),
        currency: 'USD',
        createdAt: Date.now(),
      })
      setSymbol('')
      setShares('')
      setCostBasis('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="surface-card p-4 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[120px]">
        <label className="label mb-1 block">Symbol</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="NVDA / BTC/USD"
          className="w-full bg-[var(--bg-card-soft)] border border-[var(--border-soft)] rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-[var(--accent-primary)]"
        />
      </div>
      <div className="w-28">
        <label className="label mb-1 block">Shares</label>
        <input
          type="number"
          step="any"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          placeholder="10"
          className="w-full bg-[var(--bg-card-soft)] border border-[var(--border-soft)] rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-[var(--accent-primary)]"
        />
      </div>
      <div className="w-32">
        <label className="label mb-1 block">Cost basis</label>
        <input
          type="number"
          step="any"
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
          placeholder="$400"
          className="w-full bg-[var(--bg-card-soft)] border border-[var(--border-soft)] rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-[var(--accent-primary)]"
        />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
        {submitting ? 'Adding…' : '+ Add holding'}
      </button>
    </form>
  )
}
