// ================================================================
// Pure aggregate composer for the Dashboard surface
// ================================================================
// Input: transactions + account (+ optional now override for testing).
// Output: the full DashboardPayload ready for the UI.

import type {
  Account,
  CashflowPoint,
  CashflowSeries,
  DashboardPayload,
  HeatmapCell,
  Transaction,
  TxCategory,
} from '@/types'
import { analyzeImpulse, weekOverWeekBurntChange } from './impulse'
import { projectCreditScore } from './credit-projection'

const DAY_MS = 24 * 60 * 60 * 1000
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function localDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function startOfLocalDay(timestamp: number): number {
  const d = new Date(timestamp)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// ---------------- Weekly heatmap ----------------

function heatLevel(totalSpend: number, impulseSpend: number): HeatmapCell['level'] {
  if (totalSpend === 0) return 0
  const impulseRatio = totalSpend > 0 ? impulseSpend / totalSpend : 0
  // Thresholds tuned against the demo seed so plants light up clearly.
  if (totalSpend < 30) return 1
  if (impulseRatio > 0.7 && totalSpend > 100) return 6
  if (impulseRatio > 0.5 && totalSpend > 80)  return 5
  if (totalSpend > 200)                        return 4
  if (totalSpend > 120)                        return 3
  return 2
}

export function buildHeatmap(
  transactions: Transaction[],
  perTxImpulse: Record<number, { impulse: number }>,
  now: number,
): HeatmapCell[] {
  const todayStart = startOfLocalDay(now)
  const cells: HeatmapCell[] = []

  for (let offset = 6; offset >= 0; offset--) {
    const dayStart = todayStart - offset * DAY_MS
    const dayEnd = dayStart + DAY_MS
    const iso = localDateString(dayStart + 12 * 60 * 60 * 1000) // safely noon to avoid TZ edge
    const dayTx = transactions.filter(
      (t) => t.amount > 0 && t.timestamp >= dayStart && t.timestamp < dayEnd,
    )
    const totalSpend = dayTx.reduce((a, b) => a + b.amount, 0)
    let impulseSpend = 0
    for (const t of dayTx) {
      const imp = t.id !== undefined ? perTxImpulse[t.id]?.impulse ?? 0 : 0
      impulseSpend += t.amount * imp
    }
    const label = DAY_LABELS[new Date(dayStart).getDay()]
    const topTx = [...dayTx]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((t) => ({
        merchant: t.merchant,
        amount: t.amount,
        category: t.category as TxCategory,
      }))
    cells.push({
      date: iso,
      label,
      totalSpend,
      impulseSpend,
      level: heatLevel(totalSpend, impulseSpend),
      topTx,
    })
  }
  return cells
}

// ---------------- Cashflow series ----------------

function rangeDays(range: CashflowSeries['range']): number {
  switch (range) {
    case 'today': return 1
    case '7d':    return 7
    case '30d':   return 30
    case 'year':  return 365
  }
}

export function buildCashflow(
  transactions: Transaction[],
  range: CashflowSeries['range'],
  now: number,
): CashflowSeries {
  const days = rangeDays(range)
  const todayStart = startOfLocalDay(now)
  const points: CashflowPoint[] = []
  let cumulative = 0
  let best: CashflowPoint | null = null
  let worst: CashflowPoint | null = null

  for (let offset = days - 1; offset >= 0; offset--) {
    const dayStart = todayStart - offset * DAY_MS
    const dayEnd = dayStart + DAY_MS
    const iso = localDateString(dayStart + 12 * 60 * 60 * 1000)
    const dayTx = transactions.filter(
      (t) => t.timestamp >= dayStart && t.timestamp < dayEnd,
    )
    // Inflow = negative amounts (income). Outflow = positive (debit).
    const inflow = dayTx.filter((t) => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0)
    const outflow = dayTx.filter((t) => t.amount > 0).reduce((a, b) => a + b.amount, 0)
    const netFlow = inflow - outflow
    cumulative += netFlow
    const point: CashflowPoint = { date: iso, netFlow, cumulative }
    points.push(point)
    if (best === null || point.netFlow > best.netFlow) best = point
    if (worst === null || point.netFlow < worst.netFlow) worst = point
  }

  const totalChange = cumulative
  const totalInflow = points.reduce((a, b) => a + (b.netFlow > 0 ? b.netFlow : 0), 0)
  const totalChangePct = totalInflow > 0 ? (totalChange / totalInflow) * 100 : 0

  return { range, points, totalChange, totalChangePct, bestDay: best, worstDay: worst }
}

// ---------------- Orchestrator ----------------

export interface AnalyzeInputs {
  transactions: Transaction[]
  account: Account | null
  cashflowRange?: CashflowSeries['range']
  monthlyBudget?: number
  now?: number
}

export function composeDashboard(inputs: AnalyzeInputs): Omit<DashboardPayload, 'roast'> {
  const now = inputs.now ?? Date.now()
  const impulse = analyzeImpulse(inputs.transactions, {
    now,
    monthlyBudget: inputs.monthlyBudget,
  })
  const creditProjection = inputs.account
    ? projectCreditScore({ account: inputs.account, transactions: inputs.transactions, now })
    : null
  const heatmap = buildHeatmap(inputs.transactions, impulse.perTx, now)
  const cashflow = buildCashflow(
    inputs.transactions,
    inputs.cashflowRange ?? '30d',
    now,
  )
  return {
    impulse,
    creditProjection,
    heatmap,
    cashflow,
    generatedAt: new Date(now).toISOString(),
  }
}

/** Select the roast subject's impulse score, for passing into generateRoast. */
export function findRoastContext(
  transactions: Transaction[],
  impulse: ReturnType<typeof analyzeImpulse>,
): { subjectTx: Transaction | null; impulseScore: number; wowChange: number } {
  if (impulse.topTxId === null) {
    return { subjectTx: null, impulseScore: 0, wowChange: 0 }
  }
  const subjectTx = transactions.find((t) => t.id === impulse.topTxId) ?? null
  const impulseScore = subjectTx && subjectTx.id !== undefined
    ? impulse.perTx[subjectTx.id]?.impulse ?? 0
    : 0
  const wowChange = weekOverWeekBurntChange(transactions, impulse.perTx)
  return { subjectTx, impulseScore, wowChange }
}
