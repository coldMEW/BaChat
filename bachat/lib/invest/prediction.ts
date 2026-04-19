// ================================================================
// Directional Prediction Score (DPS) — composer
// ================================================================
// Pure function of typed inputs → DirectionalPrediction output.
// No I/O. All data must be pre-fetched by the caller.

import type {
  AnalystData,
  Candle,
  DirectionalPrediction,
  Direction,
  Horizon,
  MacroSnapshot,
  NewsArticle,
  PredictionDriver,
  RiskFlag,
  Sector,
} from '@/types'
import {
  clamp,
  lastMacdCross,
  macd,
  momentumZScore,
  realizedVolatility,
  rsi,
  sma,
} from './indicators'

// ---------------- Weights per horizon ----------------

const HORIZON_WEIGHTS: Record<Horizon, { tech: number; sent: number; analyst: number; macro: number }> = {
  '7d':  { tech: 0.55, sent: 0.30, analyst: 0.05, macro: 0.10 },
  '30d': { tech: 0.40, sent: 0.25, analyst: 0.20, macro: 0.15 },
  '90d': { tech: 0.25, sent: 0.15, analyst: 0.30, macro: 0.30 },
}

// ---------------- Technical score ----------------

export interface TechnicalBreakdown {
  score: number               // -100..+100
  rsiValue: number | null
  macdCross: 'bullish' | 'bearish' | 'none'
  vs50SMA: number | null      // % above/below
  vs200SMA: number | null
  momentumZ: number
  realizedVol: number
}

export function computeTechnicalScore(candles: Candle[], horizon: Horizon): TechnicalBreakdown {
  const closes = candles.map((c) => c[4])
  if (closes.length < 30) {
    return { score: 0, rsiValue: null, macdCross: 'none', vs50SMA: null, vs200SMA: null, momentumZ: 0, realizedVol: 0 }
  }
  const rsiSeries = rsi(closes, 14)
  const macdRes = macd(closes, 12, 26, 9)
  const sma50 = sma(closes, 50)
  const sma200 = sma(closes, 200)

  const curr = closes[closes.length - 1]
  const rsiVal = rsiSeries[rsiSeries.length - 1]
  const macdCross = lastMacdCross(macdRes, 5)
  const vs50 = isNaN(sma50[sma50.length - 1]) ? null : ((curr - sma50[sma50.length - 1]) / sma50[sma50.length - 1]) * 100
  const vs200 = isNaN(sma200[sma200.length - 1]) ? null : ((curr - sma200[sma200.length - 1]) / sma200[sma200.length - 1]) * 100
  const zMom = momentumZScore(closes)
  const rVol = realizedVolatility(closes, 30)

  // RSI score: neutral at 50, bullish below 30, bearish above 70
  const rsiScore = isFinite(rsiVal) ? clamp(((50 - rsiVal) / 50) * 100, -100, 100) : 0

  // MACD score
  const macdScore = macdCross === 'bullish' ? 20 : macdCross === 'bearish' ? -20 : 0

  // vs SMA scores
  const vs50Score = vs50 === null ? 0 : clamp(vs50 * 4, -40, 40)
  const vs200Weight = horizon === '7d' ? 0.3 : horizon === '30d' ? 0.6 : 1.0
  const vs200Score = vs200 === null ? 0 : clamp(vs200 * 4, -40, 40) * vs200Weight

  // Momentum z-score
  const momScore = clamp(zMom * 15, -30, 30)

  // Weighted blend
  const raw =
    rsiScore * 0.28 +
    macdScore * 0.17 +
    vs50Score * 0.20 +
    vs200Score * 0.20 +
    momScore * 0.15
  const score = clamp(raw, -100, 100)

  return {
    score,
    rsiValue: isFinite(rsiVal) ? rsiVal : null,
    macdCross,
    vs50SMA: vs50,
    vs200SMA: vs200,
    momentumZ: zMom,
    realizedVol: rVol,
  }
}

// ---------------- Sentiment score ----------------

const HIGH_CRED_SOURCES = new Set([
  'Reuters',
  'Bloomberg',
  'Wall Street Journal',
  'The Wall Street Journal',
  'Financial Times',
  'CNBC',
  'Associated Press',
])
const MID_CRED_SOURCES = new Set(['MarketWatch', 'Barrons', "Barron's", 'Seeking Alpha', 'Yahoo', 'Yahoo Finance'])

function sourceWeight(source: string): number {
  if (HIGH_CRED_SOURCES.has(source)) return 1.0
  if (MID_CRED_SOURCES.has(source)) return 0.7
  return 0.4
}

export interface SentimentBreakdown {
  score: number               // -100..+100
  bullish: number
  bearish: number
  neutral: number
  totalArticles: number
  mostInfluential: NewsArticle | null
}

export function computeSentimentScore(articles: NewsArticle[], now = Date.now()): SentimentBreakdown {
  if (!articles.length) {
    return { score: 0, bullish: 0, bearish: 0, neutral: 0, totalArticles: 0, mostInfluential: null }
  }

  let sumWeighted = 0
  let sumMaxPossible = 0
  let bullish = 0
  let bearish = 0
  let neutral = 0
  let mostInfluential: NewsArticle | null = null
  let maxImpact = 0

  for (const a of articles) {
    const s = a.sentiment
    if (!s) {
      neutral++
      continue
    }
    if (s.stance === 'bullish') bullish++
    else if (s.stance === 'bearish') bearish++
    else neutral++

    const daysAgo = (now - a.publishedAt) / (1000 * 60 * 60 * 24)
    const recency = Math.exp(-daysAgo / 7)
    const w = sourceWeight(a.source)
    const sign = s.stance === 'bullish' ? 1 : s.stance === 'bearish' ? -1 : 0
    const impact = s.conviction * recency * w
    sumWeighted += impact * sign
    sumMaxPossible += impact

    if (impact > maxImpact) {
      maxImpact = impact
      mostInfluential = a
    }
  }

  const score = sumMaxPossible === 0 ? 0 : clamp((sumWeighted / sumMaxPossible) * 100, -100, 100)
  return { score, bullish, bearish, neutral, totalArticles: articles.length, mostInfluential }
}

// ---------------- Analyst score ----------------

export interface AnalystBreakdown {
  score: number               // -100..+100
  consensusScore: number      // from buckets
  targetGapPct: number        // % gap between mean target and current price
  recentUpgrades: number
  recentDowngrades: number
}

export function computeAnalystScore(
  analyst: AnalystData | null,
  currentPrice: number,
): AnalystBreakdown {
  if (!analyst) {
    return { score: 0, consensusScore: 0, targetGapPct: 0, recentUpgrades: 0, recentDowngrades: 0 }
  }
  const b = analyst.buckets
  const total = b.strongBuy + b.buy + b.hold + b.sell + b.strongSell
  let consensus = 0
  if (total > 0) {
    const raw = (b.strongBuy * 2 + b.buy * 1 + b.hold * 0 + b.sell * -1 + b.strongSell * -2) / total
    consensus = clamp(raw * 50, -100, 100) // map -2..2 → -100..100
  }

  const gapRaw =
    analyst.targets && analyst.targets.mean && currentPrice
      ? ((analyst.targets.mean - currentPrice) / currentPrice) * 200
      : 0
  const targetGapPct = clamp(gapRaw, -50, 50)

  const upgrades = analyst.recentChanges.filter((r) => isUpgrade(r.from, r.to)).length
  const downgrades = analyst.recentChanges.filter((r) => isDowngrade(r.from, r.to)).length
  const changesScore = clamp((upgrades - downgrades) * 10, -30, 30)

  const score = clamp(consensus * 0.5 + targetGapPct * 0.7 + changesScore, -100, 100)
  return {
    score,
    consensusScore: consensus,
    targetGapPct,
    recentUpgrades: upgrades,
    recentDowngrades: downgrades,
  }
}

const RATING_RANK: Record<string, number> = {
  'strong sell': 0,
  sell: 1,
  underperform: 1,
  hold: 2,
  neutral: 2,
  buy: 3,
  outperform: 3,
  'strong buy': 4,
  overweight: 3,
  underweight: 1,
}
function isUpgrade(from: string, to: string): boolean {
  const f = RATING_RANK[from.toLowerCase()]
  const t = RATING_RANK[to.toLowerCase()]
  return typeof f === 'number' && typeof t === 'number' && t > f
}
function isDowngrade(from: string, to: string): boolean {
  const f = RATING_RANK[from.toLowerCase()]
  const t = RATING_RANK[to.toLowerCase()]
  return typeof f === 'number' && typeof t === 'number' && t < f
}

// ---------------- Macro score ----------------

/**
 * Sector-specific macro sensitivity matrix.
 * Values are points contributed per +1 unit of the signal.
 * Signals: fedCut (+1 if cutting), fedHike (+1 if hiking),
 *          cpiAccel (+1 if accelerating), cpiDecel (+1 if decelerating),
 *          dollarStrong (+1 if strengthening).
 */
const SECTOR_MATRIX: Record<Sector, { fedCut: number; fedHike: number; cpiAccel: number; cpiDecel: number; dollarStrong: number }> = {
  tech:           { fedCut:  25, fedHike: -25, cpiAccel: -15, cpiDecel:  10, dollarStrong: -10 },
  semiconductor:  { fedCut:  30, fedHike: -30, cpiAccel: -15, cpiDecel:  10, dollarStrong: -20 },
  finance:        { fedCut: -10, fedHike:  15, cpiAccel:   0, cpiDecel:   0, dollarStrong:   5 },
  energy:         { fedCut:   0, fedHike:  -5, cpiAccel:  20, cpiDecel: -10, dollarStrong: -15 },
  consumer:       { fedCut:  15, fedHike: -15, cpiAccel: -10, cpiDecel:   5, dollarStrong:  -5 },
  healthcare:     { fedCut:  10, fedHike: -10, cpiAccel:  -5, cpiDecel:   5, dollarStrong:   0 },
  industrial:     { fedCut:  10, fedHike: -10, cpiAccel:  -5, cpiDecel:   5, dollarStrong: -10 },
  utilities:      { fedCut:  20, fedHike: -20, cpiAccel: -10, cpiDecel:   5, dollarStrong:   0 },
  'real-estate':  { fedCut:  25, fedHike: -25, cpiAccel: -10, cpiDecel:   5, dollarStrong:   0 },
  crypto:         { fedCut:  30, fedHike: -30, cpiAccel: -20, cpiDecel:  15, dollarStrong: -25 },
  'broad-market': { fedCut:  15, fedHike: -15, cpiAccel:  -5, cpiDecel:   5, dollarStrong:  -5 },
}

export interface MacroBreakdown {
  score: number               // -100..+100
  sector: Sector
  fedContribution: number
  cpiContribution: number
  dollarContribution: number
}

export function computeMacroScore(macro: MacroSnapshot | null, sector: Sector): MacroBreakdown {
  if (!macro) {
    return { score: 0, sector, fedContribution: 0, cpiContribution: 0, dollarContribution: 0 }
  }
  const m = SECTOR_MATRIX[sector] ?? SECTOR_MATRIX['broad-market']

  let fed = 0
  if (macro.fedFundsTrend === 'cutting') fed = m.fedCut
  else if (macro.fedFundsTrend === 'hiking') fed = m.fedHike

  let cpi = 0
  if (macro.cpiTrend === 'accelerating') cpi = m.cpiAccel
  else if (macro.cpiTrend === 'decelerating') cpi = m.cpiDecel

  let dollar = 0
  if (macro.dollarTrend === 'strengthening') dollar = m.dollarStrong
  else if (macro.dollarTrend === 'weakening') dollar = -m.dollarStrong

  const score = clamp(fed + cpi + dollar, -100, 100)
  return { score, sector, fedContribution: fed, cpiContribution: cpi, dollarContribution: dollar }
}

// ---------------- Composer ----------------

export interface ComposeInputs {
  symbol: string
  candles: Candle[]
  news: NewsArticle[]
  analyst: AnalystData | null
  macro: MacroSnapshot | null
  sector: Sector
  currentPrice: number
  earningsInDays: number | null   // null = unknown, otherwise days until next earnings
  horizon: Horizon
}

const DISCLAIMER =
  'Model estimate from 4 signal families. Not financial advice. Past signals do not guarantee future returns.'

export function composeDPS(inputs: ComposeInputs): DirectionalPrediction {
  const { symbol, candles, news, analyst, macro, sector, currentPrice, earningsInDays, horizon } = inputs
  const w = HORIZON_WEIGHTS[horizon]

  const tech = computeTechnicalScore(candles, horizon)
  const sent = computeSentimentScore(news)
  const an = computeAnalystScore(analyst, currentPrice)
  const mc = computeMacroScore(macro, sector)

  const dpsRaw =
    tech.score * w.tech +
    sent.score * w.sent +
    an.score * w.analyst +
    mc.score * w.macro
  const dps = Math.round(clamp(dpsRaw, -100, 100) * 10) / 10

  // Confidence
  let conf = 70

  // High vol reduces confidence
  const sectorMedianVol = sector === 'crypto' ? 0.8 : 0.25   // rough heuristic
  if (tech.realizedVol > 2 * sectorMedianVol) conf -= 25

  // Sparse news
  if (sent.totalArticles < 3) conf -= 15

  // Signal divergence — measure spread of the 4 family scores
  const scores = [tech.score, sent.score, an.score, mc.score]
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  const spread = maxScore - minScore
  if (spread > 100) conf -= 20

  // Signals strongly aligned
  const allSameSign =
    (tech.score > 0 && sent.score > 0 && an.score > 0 && mc.score > 0) ||
    (tech.score < 0 && sent.score < 0 && an.score < 0 && mc.score < 0)
  const allStrong = scores.every((s) => Math.abs(s) > 30)
  if (allSameSign && allStrong) conf += 10

  // Earnings adds actionable catalyst
  if (earningsInDays !== null && earningsInDays <= daysFor(horizon)) conf += 5

  const confidence = Math.round(clamp(conf, 30, 85))

  // Drivers
  const drivers: PredictionDriver[] = []
  const asOf = new Date().toISOString()

  // Technical
  if (tech.rsiValue !== null) {
    const label =
      tech.rsiValue > 70
        ? `RSI ${tech.rsiValue.toFixed(0)} — overbought`
        : tech.rsiValue < 30
          ? `RSI ${tech.rsiValue.toFixed(0)} — oversold`
          : `RSI ${tech.rsiValue.toFixed(0)} — neutral`
    drivers.push({
      family: 'technical',
      label,
      contribution: Math.round(clamp(((50 - tech.rsiValue) / 50) * 100 * 0.28, -30, 30) * w.tech),
      dataSource: 'Twelve Data · RSI(14) on daily candles',
      asOf,
    })
  }
  if (tech.macdCross !== 'none') {
    drivers.push({
      family: 'technical',
      label: `MACD ${tech.macdCross} cross in past 5 bars`,
      contribution: Math.round((tech.macdCross === 'bullish' ? 20 : -20) * 0.17 * w.tech),
      dataSource: 'Twelve Data · MACD(12,26,9)',
      asOf,
    })
  }
  if (tech.vs50SMA !== null) {
    drivers.push({
      family: 'technical',
      label: `${tech.vs50SMA >= 0 ? '+' : ''}${tech.vs50SMA.toFixed(1)}% vs 50-day SMA`,
      contribution: Math.round(clamp(tech.vs50SMA * 4, -40, 40) * 0.2 * w.tech),
      dataSource: 'Twelve Data · SMA(50)',
      asOf,
    })
  }

  // Sentiment
  if (sent.totalArticles > 0) {
    drivers.push({
      family: 'sentiment',
      label: `${sent.bullish} bullish, ${sent.bearish} bearish articles past 14d`,
      contribution: Math.round(sent.score * w.sent * 0.5),
      dataSource: `Finnhub news · ${sent.totalArticles} articles · Claude classifier`,
      asOf,
    })
  }

  // Analyst
  if (analyst) {
    const tot = Object.values(analyst.buckets).slice(0, 5).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)
    drivers.push({
      family: 'analyst',
      label: `${tot} analysts · target $${analyst.targets.mean.toFixed(2)} (${an.targetGapPct >= 0 ? '+' : ''}${(an.targetGapPct / 2).toFixed(1)}% vs current)`,
      contribution: Math.round(an.score * w.analyst),
      dataSource: `Finnhub /stock/recommendation & /price-target · ${analyst.targets.asOf}`,
      asOf,
    })
    if (an.recentUpgrades + an.recentDowngrades > 0) {
      drivers.push({
        family: 'analyst',
        label: `${an.recentUpgrades} upgrades, ${an.recentDowngrades} downgrades past 14d`,
        contribution: Math.round((an.recentUpgrades - an.recentDowngrades) * 10 * w.analyst),
        dataSource: 'Finnhub /stock/upgrade-downgrade',
        asOf,
      })
    }
  }

  // Macro
  if (macro) {
    const pieces: string[] = []
    if (macro.fedFundsTrend !== 'pausing') pieces.push(`Fed ${macro.fedFundsTrend}`)
    if (macro.cpiTrend !== 'stable') pieces.push(`CPI ${macro.cpiTrend}`)
    if (macro.dollarTrend !== 'stable') pieces.push(`USD ${macro.dollarTrend}`)
    drivers.push({
      family: 'macro',
      label: pieces.length ? pieces.join(' · ') : 'Macro stable',
      contribution: Math.round(mc.score * w.macro),
      dataSource: `FRED · Fed rate, CPI, DXY · ${macro.asOf}`,
      asOf,
    })
  }

  // Risk flags
  const riskFlags: RiskFlag[] = []
  if (earningsInDays !== null && earningsInDays >= 0 && earningsInDays <= daysFor(horizon)) {
    riskFlags.push({ code: 'EARNINGS_SOON', label: `Earnings in ${earningsInDays} days` })
  }
  if (tech.realizedVol > 2 * sectorMedianVol) {
    riskFlags.push({ code: 'HIGH_VOL', label: `30-day vol ${(tech.realizedVol * 100).toFixed(0)}% (elevated)` })
  }
  if (spread > 100) {
    riskFlags.push({ code: 'SIGNAL_DIVERGENCE', label: 'Signals disagree — treat with caution' })
  }

  return {
    symbol,
    horizon,
    generatedAt: asOf,
    dps,
    direction: toDirection(dps),
    confidence,
    drivers,
    riskFlags,
    disclaimer: DISCLAIMER,
  }
}

function daysFor(horizon: Horizon): number {
  return horizon === '7d' ? 7 : horizon === '30d' ? 30 : 90
}

export function toDirection(dps: number): Direction {
  if (dps > 40) return 'strong_bullish'
  if (dps > 10) return 'bullish'
  if (dps < -40) return 'strong_bearish'
  if (dps < -10) return 'bearish'
  return 'neutral'
}
