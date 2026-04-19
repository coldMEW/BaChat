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

// ================================================================
// Dashboard (behavioral finance)
// ================================================================

// ---------------- Transactions ----------------

/** Coarse category; drives discretionary weighting for impulse. */
export type TxCategory =
  | 'groceries' | 'restaurants' | 'coffee' | 'delivery'
  | 'ride-share' | 'gas' | 'transit' | 'transport-other'
  | 'utilities' | 'rent' | 'insurance' | 'healthcare'
  | 'subscriptions' | 'entertainment' | 'fitness'
  | 'fashion' | 'electronics' | 'home' | 'hobbies'
  | 'travel' | 'education' | 'gifts' | 'charity'
  | 'fees' | 'transfer' | 'income' | 'uncategorized'

export type SeedOrigin = 'seed' | 'upload'

export interface Transaction {
  id?: number
  userId: string
  date: string                // ISO yyyy-mm-dd (local)
  timestamp: number           // ms epoch (includes hour-of-day for impulse)
  amount: number              // USD, positive = debit (money out)
  merchant: string            // normalized merchant name
  description: string         // raw description as seen on statement / receipt
  category: TxCategory
  discretionaryWeight: number // 0..1 (looked up from category)
  seedOrigin: SeedOrigin
  pendingReview?: boolean     // true if OCR confidence was below threshold
  createdAt: number
}

// ---------------- Accounts ----------------

export interface Account {
  userId: string
  creditScore: number         // 300..850
  creditLimit: number         // USD
  currentBalance: number      // USD on the credit card
  monthlyPaymentPct: number   // % of balance paid each month (default 3)
  savings: number             // USD total savings
  debt: number                // USD total debt (excl. credit card)
  configuredAt: number
}

// ---------------- Impulse ----------------

export type ImpulseDriverFamily =
  | 'amount' | 'timing' | 'burst' | 'category' | 'payday'

export interface ImpulseDriver {
  family: ImpulseDriverFamily
  label: string               // "Late-night spend (3 tx, 23:00–02:00)"
  contribution: number        // signed points toward headline score
  dataSource: string          // "Dexie · transactions · rolling-30d"
  asOf: string                // ISO timestamp
}

export interface TxImpulseScore {
  txId: number
  impulse: number             // 0..1 sigmoid output
  parts: {
    zScore: number
    lateNight: number
    burst: number
    discretionary: number
    postPayday: number
  }
}

export interface ImpulseAnalysis {
  headline: number            // 0..100, higher = worse
  burnt30d: number            // USD "could have been saved"
  drivers: ImpulseDriver[]
  perTx: Record<number, TxImpulseScore>
  topTxId: number | null      // roast subject
  asOf: string
}

// ---------------- Credit projection ----------------

export interface CreditProjectionHorizon {
  days: number
  projectedBalance: number
  projectedUtilization: number
  projectedScore: number
  delta: number               // projected - current (always ≤ 0)
  utilizationImpact: number
  onTrack: boolean            // true when utilization_impact >= 0
}

export interface CreditProjection {
  currentScore: number
  currentUtilization: number
  dailyBurn: number
  horizons: CreditProjectionHorizon[]
  disclaimer: string
  asOf: string
}

// ---------------- Roast ----------------

export type RoastTone = 'savage' | 'dry' | 'supportive'

export interface RoastPayload {
  tone: RoastTone
  roast: string
  redirectSuggestion: string
  redirectSymbol: string | null     // e.g. "VTI"
  redirectAmount: number | null     // USD
  subjectTxId: number | null
  asOf: string
}

// ---------------- Heatmap ----------------

export interface HeatmapCell {
  date: string                // ISO yyyy-mm-dd
  label: string               // "Mon", "Tue", …
  totalSpend: number
  impulseSpend: number
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = empty, 6 = worst
  topTx: Array<{ merchant: string; amount: number; category: TxCategory }>
}

// ---------------- Cashflow chart ----------------

export interface CashflowPoint {
  date: string                // ISO
  netFlow: number             // negative = spending day
  cumulative: number          // running cumulative from start of range
}

export interface CashflowSeries {
  range: 'today' | '7d' | '30d' | 'year'
  points: CashflowPoint[]
  totalChange: number
  totalChangePct: number
  bestDay: CashflowPoint | null
  worstDay: CashflowPoint | null
}

// ---------------- Dashboard payload (server → client) ----------------

export interface DashboardPayload {
  impulse: ImpulseAnalysis
  creditProjection: CreditProjection | null   // null until AccountsSetupModal runs
  heatmap: HeatmapCell[]
  cashflow: CashflowSeries
  roast: RoastPayload | null
  generatedAt: string
}

// ---------------- Vision usage log ----------------

export interface VisionUsageRow {
  userId: string
  date: string                // ISO yyyy-mm-dd
  count: number
}

// ---------------- Parsed-upload preview ----------------

export interface ParsedTransactionPreview {
  date: string
  amount: number
  merchant: string
  description: string
  confidence: number          // 0..1, lowest of the extracted fields
  needsReview: boolean
}

export type ExtractKind = 'csv' | 'pdf' | 'image'

export interface ExtractResult {
  kind: ExtractKind
  transactions: ParsedTransactionPreview[]
  warnings: string[]
}
