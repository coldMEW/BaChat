// ================================================================
// Diversification engine — score + concrete rebalance suggestions
// ================================================================
// Pure function: (holdings, price-return series) → analysis.
// No I/O. Caller fetches returns.

import type {
  DiversificationAnalysis,
  DiversificationDriver,
  Holding,
  RebalanceSuggestion,
  Sector,
} from '@/types'
import {
  avgOffDiagCorrelation,
  correlationMatrix,
  covarianceMatrix,
  dailyReturns,
  hhi,
  marginalVarianceContribution,
  normalizedEntropy,
  pearson,
  roughSharpe,
} from './correlation'

export interface HoldingWithHistory {
  holding: Holding
  closes: number[]            // daily closes, aligned across all holdings
  sector: Sector
  currentPrice: number
}

/** Curated low-correlation anchors used as rebalance candidates.
 *  Real price history is supplied by the caller at analysis time. */
export const ANCHOR_CANDIDATES: Array<{ symbol: string; sector: Sector; description: string; inceptionYear: number }> = [
  { symbol: 'VTI',  sector: 'broad-market', description: 'Vanguard Total Stock Market ETF — 4,000+ U.S. equities', inceptionYear: 2001 },
  { symbol: 'VXUS', sector: 'broad-market', description: 'Vanguard Total International Stock ETF — ex-U.S. equities', inceptionYear: 2011 },
  { symbol: 'BND',  sector: 'broad-market', description: 'Vanguard Total Bond Market ETF — U.S. investment-grade bonds', inceptionYear: 2007 },
  { symbol: 'TLT',  sector: 'broad-market', description: 'iShares 20+ Year Treasury Bond ETF — long-duration Treasuries', inceptionYear: 2002 },
  { symbol: 'GLD',  sector: 'broad-market', description: 'SPDR Gold Shares ETF — physical gold exposure', inceptionYear: 2004 },
  { symbol: 'DBC',  sector: 'broad-market', description: 'Invesco DB Commodity Index ETF — broad commodities basket', inceptionYear: 2006 },
  { symbol: 'VNQ',  sector: 'real-estate', description: 'Vanguard Real Estate ETF — U.S. REITs', inceptionYear: 2004 },
]

// ---------- Score computation ----------

export interface ScoreInputs {
  weights: number[]
  correlations: number[][]
  sectors: Sector[]
  assetTypes: Array<'equity' | 'etf' | 'crypto'>
}

export function computeScore(i: ScoreInputs): { score: number; drivers: DiversificationDriver[] } {
  const { weights, correlations, sectors, assetTypes } = i

  const concentrationHHI = hhi(weights)
  const avgCorr = avgOffDiagCorrelation(correlations)

  // Sector weights: sum over positions by sector
  const sectorWeights: Record<string, number> = {}
  for (let j = 0; j < weights.length; j++) {
    const s = sectors[j] ?? 'broad-market'
    sectorWeights[s] = (sectorWeights[s] ?? 0) + weights[j]
  }
  const sectorHHI = Object.values(sectorWeights).reduce((a, w) => a + w * w, 0)

  // Asset class mix entropy
  const classWeights: Record<string, number> = {}
  for (let j = 0; j < weights.length; j++) {
    const c = assetTypes[j]
    classWeights[c] = (classWeights[c] ?? 0) + weights[j]
  }
  const classEntropy = normalizedEntropy(Object.values(classWeights))

  const raw =
    1
    - 0.35 * concentrationHHI
    - 0.30 * Math.max(0, avgCorr)
    - 0.20 * sectorHHI
    - 0.15 * (1 - classEntropy)

  const score = Math.round(Math.max(0, Math.min(1, raw)) * 100)

  const drivers: DiversificationDriver[] = [
    {
      key: 'concentration',
      label: `Position concentration (HHI)`,
      value: concentrationHHI,
      contribution: Math.round(0.35 * concentrationHHI * 100),
    },
    {
      key: 'correlation',
      label: `Average pairwise correlation`,
      value: avgCorr,
      contribution: Math.round(0.30 * Math.max(0, avgCorr) * 100),
    },
    {
      key: 'sector',
      label: `Sector concentration (HHI)`,
      value: sectorHHI,
      contribution: Math.round(0.20 * sectorHHI * 100),
    },
    {
      key: 'asset_mix',
      label: `Asset class entropy (higher = better)`,
      value: classEntropy,
      contribution: Math.round(0.15 * (1 - classEntropy) * 100),
    },
  ]

  return { score, drivers }
}

// ---------- Suggestion engine ----------

export interface SuggestionInputs {
  holdings: HoldingWithHistory[]
  /** Anchor candidates with fetched price history aligned to holdings window. */
  anchors: Array<{ symbol: string; closes: number[]; sector: Sector }>
}

export function generateSuggestions(i: SuggestionInputs): RebalanceSuggestion[] {
  const { holdings, anchors } = i
  if (holdings.length === 0) return []

  const positions = holdings.map((h) => ({
    symbol: h.holding.symbol,
    assetType: h.holding.assetType,
    sector: h.sector,
    marketValue: h.holding.shares * h.currentPrice,
    returns: dailyReturns(h.closes),
    closes: h.closes,
  }))

  const totalValue = positions.reduce((a, p) => a + p.marketValue, 0)
  if (totalValue === 0) return []

  const weights = positions.map((p) => p.marketValue / totalValue)
  const returnSeries = positions.map((p) => p.returns)
  const covMatrix = covarianceMatrix(returnSeries)
  const mcv = marginalVarianceContribution(weights, covMatrix)
  const correlations = correlationMatrix(returnSeries)

  const currentScore = computeScore({
    weights,
    correlations,
    sectors: positions.map((p) => p.sector),
    assetTypes: positions.map((p) => p.assetType),
  }).score
  const currentSharpe = roughSharpe(
    combineWeightedReturns(returnSeries, weights),
  )

  // Pick the holding that contributes the most to portfolio variance
  let topIdx = 0
  for (let k = 1; k < mcv.length; k++) if (mcv[k] > mcv[topIdx]) topIdx = k
  const topHolding = positions[topIdx]
  const topWeight = weights[topIdx]

  // Rank anchors by diversification uplift when swapping 20% of top holding
  const candidates = anchors
    .filter((a) => a.symbol !== topHolding.symbol)
    .filter((a) => a.closes.length >= topHolding.closes.length * 0.8) // enough history
    .map((a) => {
      const aReturns = dailyReturns(a.closes)
      const trimmed = aReturns.slice(-topHolding.returns.length)
      const corr = pearson(trimmed, combineWeightedReturns(returnSeries, weights))
      // Simulate: move 20% of top holding into this anchor
      const shift = 0.2 * topWeight
      const newWeights = weights.slice()
      newWeights[topIdx] -= shift
      newWeights.push(shift)
      const newReturns = returnSeries.map((r) => r.slice(-trimmed.length))
      newReturns.push(trimmed)
      const newCorr = correlationMatrix(newReturns)
      const newScore = computeScore({
        weights: newWeights,
        correlations: newCorr,
        sectors: [...positions.map((p) => p.sector), a.sector],
        assetTypes: [...positions.map((p) => p.assetType), inferAssetType(a.symbol)],
      }).score
      const newCombined = combineWeightedReturns(newReturns, newWeights)
      const newSharpe = roughSharpe(newCombined)
      return {
        anchor: a,
        corr,
        newScore,
        newSharpe,
        scoreUplift: newScore - currentScore,
        sharpeUplift: newSharpe - currentSharpe,
      }
    })
    .filter((c) => c.scoreUplift >= 3)
    .sort((a, b) => b.scoreUplift - a.scoreUplift)
    .slice(0, 3)

  const suggestions: RebalanceSuggestion[] = candidates.map((c) => {
    const dollarAmount = Math.round(topHolding.marketValue * 0.2)
    const pct = Math.round(topWeight * 0.2 * 100)
    const anchorMeta = ANCHOR_CANDIDATES.find((a) => a.symbol === c.anchor.symbol)
    const rationale = anchorMeta
      ? `${c.anchor.symbol} is ${anchorMeta.description} (launched ${anchorMeta.inceptionYear}). Its historical correlation with your current portfolio is ${c.corr.toFixed(2)} — lower than ${topHolding.symbol} alone, which is doing most of the heavy lifting in your variance right now.`
      : `${c.anchor.symbol} adds low-correlation exposure (${c.corr.toFixed(2)}) that reduces concentration.`
    return {
      id: `${topHolding.symbol}-to-${c.anchor.symbol}`,
      rationale,
      action: {
        from: topHolding.symbol,
        to: c.anchor.symbol,
        dollarAmount,
        percentOfPortfolio: pct,
      },
      projectedScoreChange: { from: currentScore, to: c.newScore },
      projectedSharpeChange: {
        from: Math.round(currentSharpe * 100) / 100,
        to: Math.round(c.newSharpe * 100) / 100,
      },
      correlationWithPortfolio: Math.round(c.corr * 100) / 100,
      confidence: c.scoreUplift > 8 ? 'high' : c.scoreUplift > 4 ? 'medium' : 'low',
    }
  })

  return suggestions
}

function combineWeightedReturns(series: number[][], weights: number[]): number[] {
  if (series.length === 0) return []
  const minLen = Math.min(...series.map((s) => s.length))
  const out: number[] = new Array(minLen).fill(0)
  for (let t = 0; t < minLen; t++) {
    for (let i = 0; i < series.length; i++) {
      const s = series[i]
      out[t] += weights[i] * s[s.length - minLen + t]
    }
  }
  return out
}

function inferAssetType(symbol: string): 'equity' | 'etf' | 'crypto' {
  // Anchor set is all ETFs in v1
  return 'etf'
}

// ---------- Top-level analysis ----------

export interface AnalyzeInputs {
  holdings: HoldingWithHistory[]
  anchors: Array<{ symbol: string; closes: number[]; sector: Sector }>
  lookbackDays: number
}

export function analyzePortfolio(i: AnalyzeInputs): DiversificationAnalysis {
  const { holdings, anchors, lookbackDays } = i
  if (holdings.length === 0) {
    return {
      score: 0,
      drivers: [],
      correlationMatrix: { symbols: [], values: [] },
      suggestions: [],
      asOf: new Date().toISOString(),
      lookbackDays,
    }
  }
  const totalValue = holdings.reduce((a, h) => a + h.holding.shares * h.currentPrice, 0)
  const weights = holdings.map((h) => (h.holding.shares * h.currentPrice) / totalValue)
  const returnSeries = holdings.map((h) => dailyReturns(h.closes))
  const corr = correlationMatrix(returnSeries)
  const { score, drivers } = computeScore({
    weights,
    correlations: corr,
    sectors: holdings.map((h) => h.sector),
    assetTypes: holdings.map((h) => h.holding.assetType),
  })
  const suggestions = generateSuggestions({ holdings, anchors })
  return {
    score,
    drivers,
    correlationMatrix: {
      symbols: holdings.map((h) => h.holding.symbol),
      values: corr,
    },
    suggestions,
    asOf: new Date().toISOString(),
    lookbackDays,
  }
}
