// ================================================================
// Per-transaction impulse scoring + aggregate dashboard driver list
// ================================================================
// Pure, deterministic. Takes an array of Transaction rows and returns
// a TxImpulseScore per tx + an ImpulseAnalysis with named drivers.

import type {
  ImpulseAnalysis,
  ImpulseDriver,
  Transaction,
  TxCategory,
  TxImpulseScore,
} from '@/types'
import {
  BURST_MIN_COUNT,
  BURST_WINDOW_MINUTES,
  EB_PRIOR_WEIGHT,
  IMPULSE_WINDOW_DAYS,
  LATE_NIGHT_END_HOUR,
  LATE_NIGHT_START_HOUR,
  PAYDAY_MIN_AMOUNT,
  POST_PAYDAY_WINDOW_HOURS,
  ROAST_SUBJECT_WINDOW_DAYS,
  SIGMOID_INTERCEPT,
  WEIGHTS,
  Z_CLAMP_ABS,
} from './score-calibration'

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

interface CategoryStats {
  mean: number
  std: number
  count: number
}

function statsByCategory(
  discretionary: Transaction[],
): Map<TxCategory, CategoryStats> {
  const byCat = new Map<TxCategory, number[]>()
  for (const t of discretionary) {
    const arr = byCat.get(t.category) ?? []
    arr.push(t.amount)
    byCat.set(t.category, arr)
  }
  const out = new Map<TxCategory, CategoryStats>()
  for (const [cat, arr] of byCat.entries()) {
    const n = arr.length
    const mean = arr.reduce((a, b) => a + b, 0) / n
    const variance = n > 1
      ? arr.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)
      : 0
    out.set(cat, { mean, std: Math.sqrt(variance), count: n })
  }
  return out
}

function globalStats(discretionary: Transaction[]): CategoryStats {
  const amounts = discretionary.map((t) => t.amount)
  if (amounts.length === 0) return { mean: 0, std: 1, count: 0 }
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const variance = amounts.length > 1
    ? amounts.reduce((a, b) => a + (b - mean) ** 2, 0) / (amounts.length - 1)
    : 1
  return { mean, std: Math.sqrt(variance) || 1, count: amounts.length }
}

function isLateNight(timestamp: number): boolean {
  const hour = new Date(timestamp).getHours()
  return hour >= LATE_NIGHT_START_HOUR || hour < LATE_NIGHT_END_HOUR
}

/** For each tx, is there a burst of ≥ BURST_MIN_COUNT discretionary tx within
 *  BURST_WINDOW_MINUTES including this one? */
function flagBursts(discretionary: Transaction[]): Set<number> {
  const sorted = [...discretionary].sort((a, b) => a.timestamp - b.timestamp)
  const inBurst = new Set<number>()
  const windowMs = BURST_WINDOW_MINUTES * 60 * 1000
  let i = 0
  for (let j = 0; j < sorted.length; j++) {
    while (sorted[j].timestamp - sorted[i].timestamp > windowMs) i++
    if (j - i + 1 >= BURST_MIN_COUNT) {
      for (let k = i; k <= j; k++) {
        if (sorted[k].id !== undefined) inBurst.add(sorted[k].id!)
      }
    }
  }
  return inBurst
}

/** Detect paydays (income-style credits) and build a set of tx IDs that occurred
 *  within POST_PAYDAY_WINDOW_HOURS after one. */
function flagPostPayday(all: Transaction[]): Set<number> {
  const paydays = all
    .filter((t) => t.category === 'income' || (t.amount < 0 && Math.abs(t.amount) >= PAYDAY_MIN_AMOUNT))
    .map((t) => t.timestamp)
  if (paydays.length === 0) return new Set()
  const windowMs = POST_PAYDAY_WINDOW_HOURS * 60 * 60 * 1000
  const out = new Set<number>()
  for (const t of all) {
    if (t.amount <= 0 || t.id === undefined) continue
    for (const p of paydays) {
      if (t.timestamp > p && t.timestamp - p <= windowMs) {
        out.add(t.id!)
        break
      }
    }
  }
  return out
}

function daysAgo(timestamp: number, now: number): number {
  return (now - timestamp) / (24 * 60 * 60 * 1000)
}

export interface ImpulseOptions {
  now?: number            // ms epoch, defaults to Date.now()
  monthlyBudget?: number  // USD, optional; used for tone & burnt ratio
}

export function analyzeImpulse(
  rawTransactions: Transaction[],
  opts: ImpulseOptions = {},
): ImpulseAnalysis {
  const now = opts.now ?? Date.now()
  const asOf = new Date(now).toISOString()

  // Discretionary spend only (amount > 0, weight > 0.1 feels right empirically).
  const discretionary = rawTransactions.filter(
    (t) => t.amount > 0 && t.discretionaryWeight >= 0.2,
  )

  if (discretionary.length === 0) {
    return {
      headline: 0,
      burnt30d: 0,
      drivers: [],
      perTx: {},
      topTxId: null,
      asOf,
    }
  }

  const catStats = statsByCategory(discretionary)
  const gStats = globalStats(discretionary)

  const burstIds = flagBursts(discretionary)
  const paydayIds = flagPostPayday(rawTransactions)

  // Blend each tx's category stats with the global prior (Empirical-Bayes).
  const perTx: Record<number, TxImpulseScore> = {}
  for (const t of discretionary) {
    if (t.id === undefined) continue
    const cs = catStats.get(t.category) ?? { mean: gStats.mean, std: gStats.std, count: 0 }
    const n = cs.count
    const blendedMean = (n * cs.mean + EB_PRIOR_WEIGHT * gStats.mean) / (n + EB_PRIOR_WEIGHT)
    const blendedStd = Math.max(
      (n * cs.std + EB_PRIOR_WEIGHT * gStats.std) / (n + EB_PRIOR_WEIGHT),
      1, // floor to avoid divide-by-zero
    )
    const rawZ = (t.amount - blendedMean) / blendedStd
    const z = clamp(rawZ, -Z_CLAMP_ABS, Z_CLAMP_ABS)

    const lateNight = isLateNight(t.timestamp) ? 1 : 0
    const burst = burstIds.has(t.id) ? 1 : 0
    const discretionaryFlag = t.discretionaryWeight
    const postPayday = paydayIds.has(t.id) ? 1 : 0

    const linear =
      SIGMOID_INTERCEPT +
      WEIGHTS.zScore * z +
      WEIGHTS.lateNight * lateNight +
      WEIGHTS.burst * burst +
      WEIGHTS.discretionary * discretionaryFlag +
      WEIGHTS.postPayday * postPayday

    const impulse = sigmoid(linear)

    perTx[t.id] = {
      txId: t.id,
      impulse,
      parts: {
        zScore: z,
        lateNight,
        burst,
        discretionary: discretionaryFlag,
        postPayday,
      },
    }
  }

  // Rolling 30-day window
  const windowStartMs = now - IMPULSE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const recent = discretionary.filter((t) => t.timestamp >= windowStartMs)

  let burnt30d = 0
  let weightedNumerator = 0
  let amountSum = 0
  for (const t of recent) {
    const score = perTx[t.id!]?.impulse ?? 0
    burnt30d += t.amount * score
    weightedNumerator += t.amount * score
    amountSum += t.amount
  }
  const headline = amountSum > 0
    ? Math.round(100 * (weightedNumerator / amountSum))
    : 0

  // Roast subject: max (amount * impulse) inside the 14-day window.
  const roastWindowMs = now - ROAST_SUBJECT_WINDOW_DAYS * 24 * 60 * 60 * 1000
  let topTxId: number | null = null
  let topScore = 0
  for (const t of discretionary) {
    if (t.timestamp < roastWindowMs || t.id === undefined) continue
    const impulse = perTx[t.id]?.impulse ?? 0
    const weighted = t.amount * impulse
    if (weighted > topScore) {
      topScore = weighted
      topTxId = t.id
    }
  }

  // ---- Aggregate drivers ----
  const drivers: ImpulseDriver[] = []

  // amount driver — biggest z-score contributor in the window
  const topZ = recent
    .map((t) => ({ t, part: perTx[t.id!]?.parts.zScore ?? 0 }))
    .sort((a, b) => Math.abs(b.part) - Math.abs(a.part))[0]
  if (topZ && Math.abs(topZ.part) > 0.5) {
    const direction = topZ.part > 0 ? 'above' : 'below'
    const pts = Math.round(Math.abs(topZ.part * WEIGHTS.zScore * 100))
    drivers.push({
      family: 'amount',
      label: `$${topZ.t.amount.toFixed(0)} at ${topZ.t.merchant} is ${topZ.part.toFixed(1)}σ ${direction} your ${topZ.t.category} baseline`,
      contribution: topZ.part > 0 ? pts : -pts,
      dataSource: 'Dexie · transactions · rolling-30d',
      asOf,
    })
  }

  // timing driver
  const lateNightCount = recent.filter((t) => isLateNight(t.timestamp)).length
  if (lateNightCount > 0) {
    const lateSpend = recent
      .filter((t) => isLateNight(t.timestamp))
      .reduce((a, b) => a + b.amount, 0)
    drivers.push({
      family: 'timing',
      label: `Late-night spend ($${lateSpend.toFixed(0)} across ${lateNightCount} tx, 23:00–03:00)`,
      contribution: Math.round(Math.min(25, lateNightCount * 4)),
      dataSource: 'Dexie · transactions · hour-of-day',
      asOf,
    })
  }

  // burst driver
  const burstCount = Array.from(burstIds).filter((id) => {
    const row = recent.find((t) => t.id === id)
    return row !== undefined
  }).length
  if (burstCount >= BURST_MIN_COUNT) {
    drivers.push({
      family: 'burst',
      label: `Burst spending (${burstCount} discretionary tx in ≤${BURST_WINDOW_MINUTES}-min windows)`,
      contribution: Math.round(Math.min(20, burstCount * 3)),
      dataSource: 'Dexie · transactions · interarrival-window',
      asOf,
    })
  }

  // category mix driver
  const discretionaryInRecent = recent.reduce((a, b) => a + b.amount, 0)
  const allRecent = rawTransactions
    .filter((t) => t.amount > 0 && t.timestamp >= windowStartMs)
    .reduce((a, b) => a + b.amount, 0)
  const discretionaryPct = allRecent > 0 ? discretionaryInRecent / allRecent : 0
  if (discretionaryPct > 0.35) {
    drivers.push({
      family: 'category',
      label: `${Math.round(discretionaryPct * 100)}% of 30-day spend was discretionary`,
      contribution: Math.round((discretionaryPct - 0.35) * 60),
      dataSource: 'Dexie · transactions · category-mix',
      asOf,
    })
  }

  // payday driver
  const paydayCount = Array.from(paydayIds).filter((id) => {
    const row = recent.find((t) => t.id === id)
    return row !== undefined
  }).length
  if (paydayCount > 0) {
    const paydaySpend = recent
      .filter((t) => t.id !== undefined && paydayIds.has(t.id))
      .reduce((a, b) => a + b.amount, 0)
    drivers.push({
      family: 'payday',
      label: `$${paydaySpend.toFixed(0)} spent within 48h of a paycheck (${paydayCount} tx)`,
      contribution: Math.round(Math.min(15, paydayCount * 3)),
      dataSource: 'Dexie · transactions · post-payday window',
      asOf,
    })
  }

  return { headline, burnt30d, drivers, perTx, topTxId, asOf }
}

/** Week-over-week burn delta for tone selection. */
export function weekOverWeekBurntChange(
  transactions: Transaction[],
  perTx: Record<number, TxImpulseScore>,
  now = Date.now(),
): number {
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000
  const thisWeekStart = now - oneWeekMs
  const prevWeekStart = now - 2 * oneWeekMs

  let thisWeek = 0, prevWeek = 0
  for (const t of transactions) {
    if (t.amount <= 0 || t.id === undefined) continue
    const impulse = perTx[t.id]?.impulse ?? 0
    const burn = t.amount * impulse
    if (t.timestamp >= thisWeekStart) thisWeek += burn
    else if (t.timestamp >= prevWeekStart) prevWeek += burn
  }
  if (prevWeek < 1) return 0
  return (thisWeek - prevWeek) / prevWeek
}
