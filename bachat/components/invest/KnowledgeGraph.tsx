'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { PeerGraph, PeerNode } from '@/types'

function logSize(cap: number | undefined, all: Array<number | undefined>): number {
  const caps = all.filter((c): c is number => typeof c === 'number' && c > 0)
  if (!caps.length || !cap || cap <= 0) return 30
  const max = Math.max(...caps)
  const min = Math.min(...caps)
  if (max === min) return 32
  const t = (Math.log(cap) - Math.log(min)) / (Math.log(max) - Math.log(min))
  return 22 + t * 28 // 22..50
}

function corrColor(c: number | null): string {
  if (c === null) return 'rgba(154, 152, 179, 0.45)'   // muted gray for "unavailable"
  if (c >= 0) {
    const g = 0.5 + c * 0.5
    return `rgba(16, 185, 129, ${g.toFixed(2)})`
  } else {
    const r = 0.5 + Math.abs(c) * 0.5
    return `rgba(239, 68, 68, ${r.toFixed(2)})`
  }
}

function corrLabel(c: number | null): string {
  if (c === null) return '—'
  return (c >= 0 ? '+' : '') + c.toFixed(2)
}

function nodeFill(sector: string | undefined): string {
  switch (sector) {
    case 'semiconductor': return 'linear-gradient(135deg, #7B61FF, #5B3FE8)'
    case 'tech':          return 'linear-gradient(135deg, #60A5FA, #3B82F6)'
    case 'finance':       return 'linear-gradient(135deg, #10B981, #047857)'
    case 'energy':        return 'linear-gradient(135deg, #F59E0B, #D97706)'
    case 'consumer':      return 'linear-gradient(135deg, #F472B6, #DB2777)'
    case 'healthcare':    return 'linear-gradient(135deg, #22D3EE, #0891B2)'
    case 'crypto':        return 'linear-gradient(135deg, #FBBF24, #D97706)'
    default:              return 'linear-gradient(135deg, #A78BFA, #7C3AED)'
  }
}

export function KnowledgeGraph({ symbol, onSelect }: { symbol: string; onSelect?: (s: string) => void }) {
  const [data, setData] = useState<PeerGraph | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [focusedPeer, setFocusedPeer] = useState<PeerNode | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setErr(null)
      setFocusedPeer(null)
      setData(null)  // clear the old graph so we don't render it under the overlay
      try {
        const res = await fetch(`/api/invest/graph/${encodeURIComponent(symbol)}?days=180`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.data) {
          setErr(json.error ?? 'No graph data')
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
    return () => { cancelled = true }
  }, [symbol])

  // Layout: center at (0,0), peers evenly spaced around a 160px radius
  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [] as Array<PeerNode & { x: number; y: number; r: number; isCenter: boolean }>, edges: [] as Array<{ from: string; to: string; corr: number; x1: number; y1: number; x2: number; y2: number }> }
    const allCaps = [data.center.marketCap, ...data.peers.map((p) => p.marketCap)]
    const centerR = logSize(data.center.marketCap, allCaps) + 10
    const centerNode = { ...data.center, x: 0, y: 0, r: centerR, isCenter: true }
    const radius = 170
    const peerNodes = data.peers.map((p, i) => {
      const angle = (i / data.peers.length) * 2 * Math.PI - Math.PI / 2
      const r = logSize(p.marketCap, allCaps)
      return {
        ...p,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        r,
        isCenter: false,
      }
    })
    const edgeData = data.edges.map((e) => {
      const peer = peerNodes.find((p) => p.symbol === e.to)
      if (!peer) return null
      return { from: e.from, to: e.to, corr: e.correlation as number | null, x1: 0, y1: 0, x2: peer.x, y2: peer.y }
    }).filter((e): e is NonNullable<typeof e> => e !== null)
    return { nodes: [centerNode, ...peerNodes], edges: edgeData }
  }, [data])

  return (
    <div className="surface-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold">Knowledge graph</h3>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            {symbol} · 5 peers · edges weighted by 180-day return correlation
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-jade)' }} /> +corr</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-crimson)' }} /> −corr</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-[340px]">
        {/* Canvas */}
        <div className="flex-1 relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-card-soft)' }}>
          {loading && !data && (
            <div
              className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-sm z-10"
              style={{ background: 'rgba(246, 243, 253, 0.92)', backdropFilter: 'blur(2px)' }}
            >
              <div className="flex items-center gap-2">
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="animate-spin"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Building graph for {symbol.replace('/USD', '')}…
              </div>
            </div>
          )}
          {err && (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--accent-crimson)] text-sm z-10">
              {err}
            </div>
          )}
          {data && !err && (
            <svg viewBox="-240 -210 480 420" className="w-full h-full">
              <defs>
                {nodes.map((n) => (
                  <radialGradient key={n.symbol + '-grad'} id={`g-${safeId(n.symbol)}`} cx="30%" cy="30%">
                    <stop offset="0%" stopColor={gradStart(n.sector)} />
                    <stop offset="100%" stopColor={gradEnd(n.sector)} />
                  </radialGradient>
                ))}
              </defs>
              {/* edges */}
              {edges.map((e) => {
                const strokeWidth = e.corr === null ? 1 : 1 + Math.abs(e.corr) * 4
                const dash = e.corr === null ? '4 3' : undefined
                return (
                  <line
                    key={`${e.from}->${e.to}`}
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                    stroke={corrColor(e.corr)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dash}
                    strokeLinecap="round"
                    opacity={hover && hover !== e.to ? 0.2 : 1}
                  />
                )
              })}
              {/* edge correlation labels */}
              {edges.map((e) => {
                const mx = e.x2 * 0.55
                const my = e.y2 * 0.55
                const fill = e.corr === null ? 'var(--text-muted)' : 'var(--text-primary)'
                return (
                  <g key={`lbl-${e.from}-${e.to}`}>
                    <rect
                      x={mx - 22}
                      y={my - 8}
                      width="44"
                      height="16"
                      rx="8"
                      fill="white"
                      stroke="var(--border-soft)"
                      opacity={hover && hover !== e.to ? 0.2 : 0.95}
                    />
                    <text
                      x={mx}
                      y={my + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="'Geist Mono', monospace"
                      fill={fill}
                      opacity={hover && hover !== e.to ? 0.2 : 1}
                    >
                      {corrLabel(e.corr)}
                    </text>
                  </g>
                )
              })}
              {/* nodes */}
              {nodes.map((n) => {
                const isHover = hover === n.symbol
                return (
                  <g
                    key={n.symbol}
                    transform={`translate(${n.x}, ${n.y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHover(n.symbol)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => {
                      if (n.isCenter) return
                      setFocusedPeer(n)
                    }}
                  >
                    <circle
                      r={n.r + (isHover ? 4 : 0)}
                      fill={`url(#g-${safeId(n.symbol)})`}
                      stroke={n.isCenter ? 'var(--accent-primary)' : 'white'}
                      strokeWidth={n.isCenter ? 3 : 2}
                      style={{ transition: 'r 0.12s ease-out' }}
                    />
                    <text
                      y={4}
                      textAnchor="middle"
                      fontSize={n.isCenter ? 13 : 11}
                      fontFamily="'Geist Mono', monospace"
                      fontWeight={600}
                      fill="#fff"
                    >
                      {n.symbol.replace('/USD', '')}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>

        {/* Side panel — selected peer or center */}
        <div className="md:w-[260px] flex-none surface-inner p-4">
          {focusedPeer ? (
            <PeerDetail peer={focusedPeer} center={data?.center ?? null} edge={data?.edges.find((e) => e.to === focusedPeer.symbol) ?? null} onOpen={() => onSelect?.(focusedPeer.symbol)} onClose={() => setFocusedPeer(null)} />
          ) : data ? (
            <CenterDetail center={data.center} peerCount={data.peers.length} />
          ) : (
            <div className="text-[var(--text-muted)] text-sm">Select a peer to see details.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function safeId(s: string): string {
  return s.replace(/[^A-Za-z0-9]/g, '_')
}

function gradStart(sector: string | undefined): string {
  if (sector === 'crypto') return '#FBBF24'
  if (sector === 'tech') return '#60A5FA'
  if (sector === 'semiconductor') return '#7B61FF'
  if (sector === 'finance') return '#10B981'
  if (sector === 'consumer') return '#F472B6'
  if (sector === 'healthcare') return '#22D3EE'
  if (sector === 'energy') return '#F59E0B'
  return '#A78BFA'
}
function gradEnd(sector: string | undefined): string {
  if (sector === 'crypto') return '#D97706'
  if (sector === 'tech') return '#2563EB'
  if (sector === 'semiconductor') return '#5B3FE8'
  if (sector === 'finance') return '#047857'
  if (sector === 'consumer') return '#BE185D'
  if (sector === 'healthcare') return '#0891B2'
  if (sector === 'energy') return '#B45309'
  return '#7C3AED'
}

function CenterDetail({ center, peerCount }: { center: PeerNode; peerCount: number }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="label mb-1">Center</div>
        <div className="font-lora text-xl font-semibold">{center.symbol.replace('/USD', '')}</div>
        <div className="text-xs text-[var(--text-secondary)]">{center.name}</div>
      </div>
      <div>
        <div className="label mb-1">Sector</div>
        <div className="text-sm capitalize">{center.sector?.replace('-', ' ') ?? 'n/a'}</div>
      </div>
      {center.marketCap && (
        <div>
          <div className="label mb-1">Market cap</div>
          <div className="font-mono text-sm">${formatCap(center.marketCap)}</div>
        </div>
      )}
      <div className="text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border-soft)]">
        Click any of the {peerCount} peer nodes to inspect its correlation & market-cap.
      </div>
    </div>
  )
}

function PeerDetail({
  peer, center, edge, onOpen, onClose,
}: {
  peer: PeerNode
  center: PeerNode | null
  edge: { correlation: number | null } | null
  onOpen: () => void
  onClose: () => void
}) {
  const corrText =
    !edge || edge.correlation === null
      ? 'Data unavailable — peer price history could not be fetched (rate limit or insufficient history). Reload the page once the cache warms.'
      : edge.correlation > 0.7
        ? 'Strongly positively correlated'
        : edge.correlation > 0.3
          ? 'Moderately positively correlated'
          : edge.correlation > -0.3
            ? 'Weakly correlated'
            : edge.correlation > -0.7
              ? 'Moderately negatively correlated'
              : 'Strongly negatively correlated'
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="label mb-1">Peer</div>
          <div className="font-lora text-xl font-semibold">{peer.symbol.replace('/USD', '')}</div>
          <div className="text-xs text-[var(--text-secondary)]">{peer.name}</div>
        </div>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg leading-none">×</button>
      </div>
      <div>
        <div className="label mb-1">Sector</div>
        <div className="text-sm capitalize">{peer.sector?.replace('-', ' ') ?? 'n/a'}</div>
      </div>
      {peer.marketCap !== undefined && (
        <div>
          <div className="label mb-1">Market cap</div>
          <div className="font-mono text-sm">${formatCap(peer.marketCap)}</div>
        </div>
      )}
      {edge && (
        <div>
          <div className="label mb-1">Correlation w/ {center?.symbol.replace('/USD', '') ?? 'center'}</div>
          <div
            className="font-mono text-base"
            style={{
              color:
                edge.correlation === null
                  ? 'var(--text-muted)'
                  : edge.correlation >= 0
                    ? 'var(--accent-jade-deep)'
                    : 'var(--accent-crimson-deep)',
            }}
          >
            {edge.correlation === null
              ? '—'
              : `${edge.correlation >= 0 ? '+' : ''}${edge.correlation.toFixed(3)}`}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">{corrText}</div>
        </div>
      )}
      <div className="flex gap-2 pt-3 border-t border-[var(--border-soft)]">
        <button onClick={onOpen} className="btn-primary flex-1 text-xs">Open research →</button>
      </div>
    </div>
  )
}

function formatCap(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)}T`
  if (m >= 1) return `${m.toFixed(0)}B`
  return m.toFixed(0)
}
