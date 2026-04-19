// ================================================================
// Bachat — canonical type contracts
// ================================================================
// This is the single source of truth for every shared interface.
// Every lib, API route, and component must import from here.

// ---------------- Holdings ----------------

export type AssetType = 'equity' | 'etf' | 'crypto'

export interface Holding {
  id: number
  userId: string
  symbol: string              // "NVDA" | "BTC/USD" | "VTI"
  assetType: AssetType
  shares: number
  costBasis: number           // USD per share at purchase
  purchaseDate: string        // ISO date
  currency: 'USD'
  createdAt: number           // ms epoch
}

// ---------------- Market data ----------------

export type Candle = [timestamp: number, open: number, high: number, low: number, close: number, volume: number]

export type Interval = '1d' | '1h' | '1week'

export interface PriceHistory {
  symbol: string
  interval: Interval
  candles: Candle[]
  fetchedAt: number
  ttlMs: number
}

export interface Quote {
  symbol: string
  price: number
  change: number              // dollar change
  changePct: number           // percent
  timestamp: number
}

// ---------------- News + sentiment ----------------

export type SentimentStance = 'bullish' | 'bearish' | 'neutral'

export interface NewsArticle {
  id: string                  // hash of url
  headline: string
  summary?: string
  url: string
  source: string              // "Reuters", "Bloomberg", etc.
  publishedAt: number         // ms epoch
  sentiment?: {
    stance: SentimentStance
    conviction: number        // 0..1
  }
}

export interface NewsCache {
  symbol: string
  articles: NewsArticle[]
  fetchedAt: number
  ttlMs: number
}

// ---------------- Analyst data ----------------

export interface AnalystBuckets {
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
  period: string              // "2026-04" month bucket
}

export interface PriceTargets {
  mean: number
  high: number
  low: number
  numAnalysts: number
  asOf: string                // ISO date
}

export interface AnalystData {
  symbol: string
  buckets: AnalystBuckets
  targets: PriceTargets
  recentChanges: Array<{
    firm: string
    from: string              // "Buy" / "Hold" / etc.
    to: string
    date: string              // ISO date
  }>
  fetchedAt: number
  ttlMs: number
}

// ---------------- Macro data ----------------

export type Sector =
  | 'tech'
  | 'semiconductor'
  | 'finance'
  | 'energy'
  | 'consumer'
  | 'healthcare'
  | 'industrial'
  | 'utilities'
  | 'real-estate'
  | 'crypto'
  | 'broad-market'

export interface MacroSnapshot {
  fedFundsRate: number        // % current
  fedFundsTrend: 'cutting' | 'pausing' | 'hiking'
  cpiYoY: number              // % annual
  cpiTrend: 'accelerating' | 'stable' | 'decelerating'
  dollarIndex: number         // DXY-style
  dollarTrend: 'strengthening' | 'stable' | 'weakening'
  fetchedAt: number
  asOf: string                // ISO date
}

// ---------------- Directional Prediction (core IP) ----------------

export type Horizon = '7d' | '30d' | '90d'

export type Direction =
  | 'strong_bearish'
  | 'bearish'
  | 'neutral'
  | 'bullish'
  | 'strong_bullish'

export type DriverFamily = 'technical' | 'sentiment' | 'analyst' | 'macro'

export interface PredictionDriver {
  family: DriverFamily
  label: string               // "RSI 74 (overbought)"
  contribution: number        // signed points toward DPS
  dataSource: string          // "Twelve Data · RSI(14) on daily candles"
  asOf: string                // ISO timestamp
}

export interface RiskFlag {
  code: string                // "EARNINGS_SOON"
  label: string               // "Earnings in 12 days"
}

export interface DirectionalPrediction {
  symbol: string
  horizon: Horizon
  generatedAt: string
  dps: number                 // -100 .. +100
  direction: Direction
  confidence: number          // 30 .. 85
  drivers: PredictionDriver[]
  riskFlags: RiskFlag[]
  disclaimer: string
}

// ---------------- Diversification ----------------

export interface DiversificationDriver {
  key: 'concentration' | 'correlation' | 'sector' | 'asset_mix'
  label: string
  value: number               // the raw metric
  contribution: number        // how many points it pulls down
}

export interface RebalanceSuggestion {
  id: string
  rationale: string           // 1-2 sentence Claude-drafted context
  action: {
    from: string              // symbol being reduced
    to: string                // symbol being added
    dollarAmount: number
    percentOfPortfolio: number
  }
  projectedScoreChange: {
    from: number
    to: number
  }
  projectedSharpeChange: {
    from: number
    to: number
  }
  correlationWithPortfolio: number
  confidence: 'high' | 'medium' | 'low'
}

export interface DiversificationAnalysis {
  score: number               // 0..100
  drivers: DiversificationDriver[]
  correlationMatrix: {
    symbols: string[]
    values: number[][]
  }
  suggestions: RebalanceSuggestion[]
  asOf: string
  lookbackDays: number
}

// ---------------- Peers / graph ----------------

export interface PeerNode {
  symbol: string
  name: string
  marketCap?: number
  sector?: Sector
  newsVolume7d?: number
}

export interface PeerEdge {
  from: string
  to: string
  /** −1..1 computed from 180-day daily returns. `null` means we couldn't compute
   *  it (rate-limited, insufficient history, or symbol not found). */
  correlation: number | null
}

export interface PeerGraph {
  center: PeerNode
  peers: PeerNode[]
  edges: PeerEdge[]
  fetchedAt: number
  lookbackDays: number
}

// ---------------- API response envelopes ----------------

export interface ApiEnvelope<T> {
  data: T | null
  error: string | null
  cached: boolean
  fetchedAt: number
}
