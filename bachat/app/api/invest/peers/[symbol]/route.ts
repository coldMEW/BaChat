// Peer list (Finnhub for equities, CoinGecko for crypto) + metadata.
// Cache: 7d disk-backed fs-cache.

import { NextRequest, NextResponse } from 'next/server'
import { fetchCompanyProfile, fetchPeers } from '@/lib/invest/finnhub'
import { fetchCryptoPeers } from '@/lib/invest/coingecko'
import { CACHE_TTL, cacheGet, cacheSet } from '@/lib/invest/fs-cache'
import type { ApiEnvelope, PeerNode } from '@/types'

function isCrypto(symbol: string): boolean {
  const up = symbol.toUpperCase()
  return /^(BTC|ETH|SOL|ADA|DOT|AVAX|MATIC|LINK|UNI|DOGE|XRP|LTC|BCH|ATOM|NEAR)(\/USD|\/USDT)?$/.test(up)
}

function mapIndustry(industry?: string): PeerNode['sector'] {
  if (!industry) return 'broad-market'
  const low = industry.toLowerCase()
  if (low.includes('semi')) return 'semiconductor'
  if (low.includes('technology') || low.includes('software')) return 'tech'
  if (low.includes('bank') || low.includes('financ') || low.includes('insur')) return 'finance'
  if (low.includes('energy') || low.includes('oil')) return 'energy'
  if (low.includes('health') || low.includes('pharm') || low.includes('biotech')) return 'healthcare'
  if (low.includes('consumer') || low.includes('retail')) return 'consumer'
  if (low.includes('industr') || low.includes('manufact')) return 'industrial'
  if (low.includes('utilit')) return 'utilities'
  if (low.includes('real estate')) return 'real-estate'
  return 'broad-market'
}

type Payload = { center: PeerNode; peers: PeerNode[] }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const cached = await cacheGet<Payload>('peers', symbol)
  if (cached) {
    return NextResponse.json<ApiEnvelope<Payload>>({
      data: cached.data,
      error: null,
      cached: true,
      fetchedAt: cached.fetchedAt,
    })
  }

  try {
    let center: PeerNode
    let peers: PeerNode[]
    if (isCrypto(symbol)) {
      const cryptoPeers = await fetchCryptoPeers(symbol, 5)
      center = { symbol: symbol.toUpperCase(), name: symbol.toUpperCase(), sector: 'crypto' }
      peers = cryptoPeers.map((p) => ({
        symbol: p.symbol,
        name: p.name,
        marketCap: p.marketCap,
        sector: 'crypto',
      }))
    } else {
      const [profile, peerSymbols] = await Promise.all([
        fetchCompanyProfile(symbol),
        fetchPeers(symbol),
      ])
      center = {
        symbol,
        name: profile?.name ?? symbol,
        marketCap: profile?.marketCap,
        sector: mapIndustry(profile?.sector),
      }
      const topPeers = peerSymbols.slice(0, 5)
      const peerProfiles = await Promise.all(topPeers.map((s) => fetchCompanyProfile(s).catch(() => null)))
      peers = topPeers.map((s, i) => ({
        symbol: s,
        name: peerProfiles[i]?.name ?? s,
        marketCap: peerProfiles[i]?.marketCap,
        sector: mapIndustry(peerProfiles[i]?.sector),
      }))
    }
    const payload: Payload = { center, peers }
    await cacheSet('peers', symbol, payload, CACHE_TTL.peers)
    return NextResponse.json<ApiEnvelope<Payload>>({
      data: payload,
      error: null,
      cached: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    return NextResponse.json<ApiEnvelope<Payload>>(
      { data: null, error: err instanceof Error ? err.message : String(err), cached: false, fetchedAt: Date.now() },
      { status: 502 },
    )
  }
}
