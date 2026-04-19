import type { Account, Transaction } from '@/types'
import { CATEGORY_TO_BUCKET, type BudgetMode, type BudgetScoreResult } from './types'

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0
  return round1((part / whole) * 100)
}

function deriveMode(needsPct: number): BudgetMode {
  if (needsPct > 80) return 'survival'
  if (needsPct > 65) return 'constrained'
  return 'standard'
}

function modeIdeals(mode: BudgetMode) {
  switch (mode) {
    case 'survival':    return { needsIdeal: 80, wantsIdeal: 15, savingsIdeal: 5 }
    case 'constrained': return { needsIdeal: 65, wantsIdeal: 20, savingsIdeal: 15 }
    default:            return { needsIdeal: 50, wantsIdeal: 30, savingsIdeal: 20 }
  }
}

function inferIncome(account: Account | null, transactions: Transaction[]): number {
  // Use last-30d spend * 1.25 as income proxy; floor at $3000
  const cutoff = Date.now() - 30 * 86400 * 1000
  const spend = transactions
    .filter((t) => t.timestamp >= cutoff && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)
  return Math.max(3000, Math.round(spend * 1.25))
}

export function calcBudgetScore(
  transactions: Transaction[],
  account: Account | null,
): BudgetScoreResult {
  const cutoff = Date.now() - 30 * 86400 * 1000
  const last30 = transactions.filter((t) => t.timestamp >= cutoff)

  const income = inferIncome(account, transactions)

  let needsSpend = 0
  let wantsSpend = 0
  for (const t of last30) {
    if (t.amount <= 0) continue
    const bucket = CATEGORY_TO_BUCKET[t.category] ?? 'wants'
    if (bucket === 'needs') needsSpend += t.amount
    else wantsSpend += t.amount
  }

  // Derive savings and debt from account or implicit balance
  const debtBalance = Math.max(0, account?.debt ?? 0)
  const monthlyDebtPay = account && account.creditLimit > 0
    ? account.currentBalance * (account.monthlyPaymentPct / 100)
    : Math.round(debtBalance * 0.05)

  const impliedSavings = Math.max(0, income - needsSpend - wantsSpend - monthlyDebtPay)

  const needs   = Math.round(needsSpend)
  const wants   = Math.round(wantsSpend)
  const savings = Math.round(impliedSavings)
  const debt    = Math.round(monthlyDebtPay)

  const nP = pct(needs,   income)
  const wP = pct(wants,   income)
  const sP = pct(savings, income)
  const dP = pct(debt,    income)
  const netSav = round1(sP - dP)

  const mode   = deriveMode(nP)
  const ideals = modeIdeals(mode)

  const adjWantsIdeal   = ideals.wantsIdeal
  const adjSavingsIdeal = ideals.savingsIdeal

  // Score components
  const needsPts = round1(
    nP <= ideals.needsIdeal
      ? 7
      : Math.max(0, 7 - ((nP - ideals.needsIdeal) / 25) * 7),
  )
  const wantsPts = round1(
    wP <= adjWantsIdeal
      ? 10
      : Math.max(0, 10 - (wP - adjWantsIdeal) * 0.33),
  )
  const savPts = round1(
    netSav >= adjSavingsIdeal
      ? 15
      : netSav >= 0
        ? 15 * (netSav / Math.max(1, adjSavingsIdeal))
        : Math.max(0, 15 * (1 + netSav / Math.max(1, adjSavingsIdeal))),
  )
  // Credit score component (5 pts, scaled 580..780)
  const cs = account?.creditScore ?? 0
  const creditPts = account
    ? round1(clamp(((cs - 580) / (780 - 580)) * 5, 0, 5))
    : 0

  // Impulse: count discretionary tx above $40 (consistent with Dashboard threshold)
  const impulseCount = last30.filter(
    (t) => t.discretionaryWeight >= 0.6 && t.amount >= 40,
  ).length
  const impPen = round1(0.5 * impulseCount)

  const rawScore = needsPts + wantsPts + savPts + creditPts - impPen
  const score    = round1(clamp(rawScore, 0, 37))

  const incomeToEscape   = Math.max(0, Math.round(needs / 0.65 - income))
  const needsCutToEscape = Math.max(0, Math.round(needs - income * 0.65))

  return {
    score, mode, income,
    needs, wants, savings, debt,
    nP, wP, sP, dP, netSav,
    needsIdeal:   ideals.needsIdeal,
    wantsIdeal:   ideals.wantsIdeal,
    savingsIdeal: ideals.savingsIdeal,
    adjWantsIdeal, adjSavingsIdeal,
    needsPts, wantsPts, savPts, creditPts, impPen,
    impulseCount, incomeToEscape, needsCutToEscape,
  }
}

export function modeLabel(m: BudgetMode): string {
  if (m === 'survival')    return 'Survival mode'
  if (m === 'constrained') return 'Constrained mode'
  return 'Standard mode'
}
