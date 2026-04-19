import type { Account } from '@/types'
import type { BudgetScoreResult, SimCategory, SimulationResult } from './types'

function round1(x: number): number { return Math.round(x * 10) / 10 }
function round0(x: number): number { return Math.round(x) }
function pct(part: number, whole: number): number {
  return whole > 0 ? round1((part / whole) * 100) : 0
}

// ── FICO-style utilization penalty ──────────────────────────────────────────
// Returns negative points relative to the ≤9% "perfect" band.
// Based on published FICO utilization band research.
function utilizationPenalty(util: number): number {
  if (util <= 0.09) return 0
  if (util <= 0.19) return -8
  if (util <= 0.29) return -18
  if (util <= 0.39) return -32
  if (util <= 0.49) return -48
  if (util <= 0.59) return -63
  if (util <= 0.69) return -78
  if (util <= 0.79) return -90
  if (util <= 0.89) return -102
  return -115
}

function utilizationLabel(util: number): string {
  if (util <= 0.09) return 'Excellent (≤9%)'
  if (util <= 0.29) return 'Good (10–29%)'
  if (util <= 0.49) return 'Fair (30–49%)'
  if (util <= 0.69) return 'High (50–69%)'
  return 'Very high (70%+)'
}

// ── Emergency fund severity ─────────────────────────────────────────────────
function emergencyLevel(months: number): string {
  if (months >= 6) return 'Strong (6+ months)'
  if (months >= 3) return 'Adequate (3–6 months)'
  if (months >= 1) return 'Thin (1–3 months)'
  return 'Critical (<1 month)'
}

export type PayWith = 'cash' | 'credit'

export function simulateDecision(
  description: string,
  amount: number,
  category: SimCategory,
  payWith: PayWith,
  scoreResult: BudgetScoreResult,
  account: Account | null,
): SimulationResult {
  const income = Math.max(1, scoreResult.income)

  // ── 1. Project new spending buckets ────────────────────────────────────────
  const newWants   = category === 'wants'                             ? scoreResult.wants + amount : scoreResult.wants
  const newNeeds   = category === 'needs'                             ? scoreResult.needs + amount : scoreResult.needs
  const newSavings = category === 'savings' || category === 'investment' ? scoreResult.savings + amount : scoreResult.savings

  // Debt: paying off reduces balance & monthly payment obligation
  const isDebtPayment = category === 'debt'
  const newDebt = isDebtPayment ? Math.max(0, scoreResult.debt - amount) : scoreResult.debt

  const newWP = pct(newWants, income)
  const newNP = pct(newNeeds, income)
  const newSP = pct(newSavings, income)

  const creditCardBalance = account?.currentBalance ?? 0
  const creditLimit       = account?.creditLimit ?? 0
  const monthlyPayment    = creditLimit > 0
    ? creditCardBalance * ((account?.monthlyPaymentPct ?? 3) / 100)
    : round0(scoreResult.debt * 0.05)

  const newNetSav = round1(newSP - pct(newDebt, income))

  // ── 2. Pulse score impact ──────────────────────────────────────────────────
  const newWantsPts = round1(
    newWP <= scoreResult.adjWantsIdeal
      ? 10
      : Math.max(0, 10 - (newWP - scoreResult.adjWantsIdeal) * 0.33),
  )
  const newSavPts = round1(
    newNetSav >= scoreResult.adjSavingsIdeal
      ? 15
      : newNetSav >= 0
        ? 15 * (newNetSav / Math.max(1, scoreResult.adjSavingsIdeal))
        : Math.max(0, 15 * (1 + newNetSav / Math.max(1, scoreResult.adjSavingsIdeal))),
  )
  const newNeedsPts = round1(
    newNP <= scoreResult.needsIdeal
      ? 7
      : Math.max(0, 7 - ((newNP - scoreResult.needsIdeal) / 25) * 7),
  )

  const addsImpulse    = category === 'wants' && amount >= 40
  const newImpulseCount = scoreResult.impulseCount + (addsImpulse ? 1 : 0)
  const newImpPen      = round1(0.5 * newImpulseCount)

  const newScore   = round1(Math.max(0, Math.min(37, newNeedsPts + newWantsPts + newSavPts + scoreResult.creditPts - newImpPen)))
  const scoreDelta = round1(newScore - scoreResult.score)

  // ── 3. Credit score — FICO utilization model ───────────────────────────────
  let creditDelta: number | null = null
  let creditScoreAfter: number | null = null
  let utilizationBefore: number | null = null
  let utilizationAfter: number | null = null

  if (account && account.creditScore && creditLimit > 0) {
    utilizationBefore = round1((creditCardBalance / creditLimit) * 100)

    let newCardBalance = creditCardBalance
    if (isDebtPayment) {
      // Paying off the card directly reduces balance
      newCardBalance = Math.max(0, creditCardBalance - amount)
    } else if (payWith === 'credit' && (category === 'wants' || category === 'needs')) {
      // Charging to the card increases balance
      newCardBalance = creditCardBalance + amount
    }

    utilizationAfter = round1((Math.min(newCardBalance, creditLimit) / creditLimit) * 100)

    const utilBefore = creditCardBalance / creditLimit
    const utilAfterRaw = Math.min(newCardBalance, creditLimit) / creditLimit

    creditDelta = round0(utilizationPenalty(utilAfterRaw) - utilizationPenalty(utilBefore))
    creditScoreAfter = Math.max(300, Math.min(850, account.creditScore + creditDelta))
  }

  // ── 4. Savings & cashflow impact ───────────────────────────────────────────
  // One-time cash outflow (what leaves the savings account immediately)
  const cashOut =
    isDebtPayment              ? amount      // paying off debt uses cash
    : payWith === 'cash' && (category === 'wants' || category === 'needs') ? amount
    : category === 'savings' || category === 'investment' ? 0  // adding to savings
    : 0

  const savingsBalance       = account?.savings ?? 0
  const savingsAfterBalance  = Math.max(0, savingsBalance - cashOut)

  const savingsDelta  = newSavings - scoreResult.savings  // monthly savings flow change
  const debtDelta     = isDebtPayment ? -amount : 0

  // Monthly cashflow = income minus projected ongoing spend and debt obligations
  const cashflowBefore = round0(income - scoreResult.needs - scoreResult.wants - monthlyPayment)
  const ongoingWantsAdd = category === 'wants' ? amount : 0  // treat as recurring for cashflow
  const ongoingNeedsAdd = category === 'needs' ? amount : 0
  const cashflowAfterVal  = round0(income - (scoreResult.needs + ongoingNeedsAdd) - (scoreResult.wants + ongoingWantsAdd) - monthlyPayment)
  const cashflowDelta  = cashflowAfterVal - cashflowBefore

  // ── 5. Emergency fund (months of coverage) ────────────────────────────────
  const monthlyExpenses        = Math.max(1, scoreResult.needs + scoreResult.wants)
  const emergencyMonthsBefore  = round1(savingsBalance / monthlyExpenses)
  const emergencyMonthsAfter   = round1(savingsAfterBalance / monthlyExpenses)

  // ── 6. Affordability verdict ───────────────────────────────────────────────
  const canAfford = savingsBalance >= cashOut || cashOut === 0

  let affordabilityLevel: SimulationResult['affordabilityLevel']
  let affordabilityDetail: string

  if (!canAfford) {
    affordabilityLevel = 'unaffordable'
    affordabilityDetail = `Your savings ($${round0(savingsBalance).toLocaleString()}) are less than this purchase ($${round0(amount).toLocaleString()}). You would need to borrow or use credit to make this purchase.`
  } else if (emergencyMonthsAfter < 1 || cashflowAfterVal < 0) {
    affordabilityLevel = 'risky'
    if (cashflowAfterVal < 0) {
      affordabilityDetail = `Monthly cashflow turns negative ($${Math.abs(cashflowAfterVal).toLocaleString()}/mo deficit). You would need to draw down savings each month to cover expenses.`
    } else {
      affordabilityDetail = `Emergency fund drops to ${emergencyMonthsAfter.toFixed(1)} months of coverage — below the recommended minimum of 1 month.`
    }
  } else if (emergencyMonthsAfter < 3 || cashflowAfterVal < income * 0.05) {
    affordabilityLevel = 'tight'
    affordabilityDetail = `Leaves ${emergencyMonthsAfter.toFixed(1)} months emergency cover (recommended: 3+) and $${cashflowAfterVal.toLocaleString()}/mo surplus. Manageable but leaves little room for unexpected costs.`
  } else if (emergencyMonthsAfter < 6 || cashflowAfterVal < income * 0.10) {
    affordabilityLevel = 'manageable'
    affordabilityDetail = `${emergencyMonthsAfter.toFixed(1)} months of emergency coverage remain and cashflow stays positive at $${cashflowAfterVal.toLocaleString()}/mo. Within budget but on the watchful side.`
  } else {
    affordabilityLevel = 'comfortable'
    affordabilityDetail = `${emergencyMonthsAfter.toFixed(1)} months of emergency coverage remain and $${cashflowAfterVal.toLocaleString()}/mo surplus is healthy. This purchase fits your current financial position.`
  }

  // ── 7. Verdict ────────────────────────────────────────────────────────────
  const creditHurt = creditDelta !== null && creditDelta < -10
  const isUnaffordable = affordabilityLevel === 'unaffordable'
  const isRisky = affordabilityLevel === 'risky'

  const verdict: SimulationResult['verdict'] =
    isUnaffordable || scoreDelta <= -3 || creditHurt
      ? 'avoid'
      : isRisky || scoreDelta < 0 || addsImpulse
        ? 'risky'
        : scoreDelta >= 2 && !isRisky
          ? 'good'
          : 'neutral'

  // Build a specific, numbers-driven reason
  const parts: string[] = []
  if (category === 'wants' || category === 'needs') {
    const pctLabel = category === 'wants' ? 'discretionary' : 'essential'
    const newPct = category === 'wants' ? newWP : newNP
    const ideal  = category === 'wants' ? scoreResult.adjWantsIdeal : scoreResult.needsIdeal
    parts.push(`${pctLabel} spend moves to ${newPct}% of income (ideal: ≤${ideal}%)`)
  }
  if (scoreDelta !== 0) parts.push(`Pulse score ${scoreDelta > 0 ? '+' : ''}${scoreDelta} pts`)
  if (creditDelta !== null && creditDelta !== 0) {
    const utilLine = utilizationBefore !== null && utilizationAfter !== null
      ? ` (utilization ${utilizationBefore}% → ${utilizationAfter}%)`
      : ''
    parts.push(`credit score ${creditDelta > 0 ? '+' : ''}${creditDelta} pts${utilLine}`)
  }
  if (cashOut > 0) {
    parts.push(`emergency fund: ${emergencyLevel(emergencyMonthsAfter)}`)
  }
  if (cashflowDelta < 0) parts.push(`monthly surplus shrinks by $${Math.abs(cashflowDelta).toLocaleString()}`)

  const verdictReason = parts.length > 0
    ? parts.map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p).join(' · ')
    : verdict === 'good' ? 'Improves your financial position with no downside risk.'
    : 'No significant impact on your financial health.'

  // ── 8. Alternatives ──────────────────────────────────────────────────────
  const alternatives: SimulationResult['alternatives'] = []
  if (category === 'wants') {
    const savGain = Math.max(1, Math.abs(round0(newSavPts - scoreResult.savPts)))
    alternatives.push(
      { label: 'Add to savings',  description: `Deposit $${round0(amount).toLocaleString()} into your emergency fund — brings cover to ${round1(emergencyMonthsBefore + amount / monthlyExpenses).toFixed(1)} months`, scoreGain: savGain },
      { label: 'Pay off debt',    description: `Apply $${round0(amount).toLocaleString()} to your highest-interest balance${creditLimit > 0 ? ` — drops utilization to ${round1(((Math.max(0, creditCardBalance - amount)) / creditLimit) * 100)}%` : ''}`, scoreGain: 2 },
      { label: 'Invest it',       description: `Put $${round0(amount).toLocaleString()} into a low-cost index fund`, scoreGain: 1 },
    )
  } else if (category === 'needs') {
    alternatives.push(
      { label: 'Find a lower rate',  description: 'Compare providers or negotiate — even 10% savings compounds over time', scoreGain: 1 },
      { label: 'Delay 30 days',      description: 'Apply the pause rule — if still essential in a month, commit then',      scoreGain: 1 },
    )
  } else if (isDebtPayment && creditDelta !== null && creditDelta > 0) {
    alternatives.push(
      { label: 'Keep paying down',    description: `Continuing at this rate clears the balance in ~${round0(creditCardBalance / amount)} months`, scoreGain: round0(creditDelta / 10) },
    )
  }

  return {
    decision: description,
    amount,
    category,
    payWith,
    scoreAfter: newScore,
    scoreDelta,
    creditScoreAfter,
    creditDelta,
    utilizationBefore,
    utilizationAfter,
    savingsAfter: scoreResult.savings + savingsDelta,
    savingsDelta,
    savingsBalanceAfter: savingsAfterBalance,
    debtAfter: Math.max(0, scoreResult.debt + debtDelta),
    debtDelta,
    cashflowBefore,
    cashflowAfter: cashflowAfterVal,
    cashflowDelta,
    emergencyMonthsBefore,
    emergencyMonthsAfter,
    canAfford,
    affordabilityLevel,
    affordabilityDetail,
    impulseCountAfter: newImpulseCount,
    verdict,
    verdictReason,
    alternatives,
  }
}
