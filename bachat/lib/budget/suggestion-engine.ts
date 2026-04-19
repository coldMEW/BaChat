import type { Account, ImpulseAnalysis } from '@/types'
import type { BudgetScoreResult, BudgetSuggestion } from './types'

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

export function generateSuggestions(
  score: BudgetScoreResult,
  impulse: ImpulseAnalysis | null,
  account: Account | null,
): BudgetSuggestion[] {
  const out: BudgetSuggestion[] = []
  let id = 0
  const nid = () => String(++id)
  const burnt30d = impulse?.burnt30d ?? 0

  // ── Impulse-driven ──────────────────────────────────────────────────────
  if (score.impulseCount >= 3) {
    const redirectAmt = Math.max(50, Math.round(burnt30d * 0.5))
    out.push({
      id: nid(), priority: 'critical', category: 'impulse',
      title: `${score.impulseCount} impulse purchases costing you ${score.impPen} pts`,
      body: `You flagged ${score.impulseCount} impulse buys totalling ~$${Math.round(burnt30d)}. Eliminating half would recover ${score.impPen} score points and redirect $${redirectAmt} toward your goals.`,
      action: `Redirect $${redirectAmt} away from impulse`,
      scoreImpact: score.impPen, creditImpact: 0,
      redirect: { to: 'savings', amount: redirectAmt, label: 'High-yield savings' },
    })
  } else if (score.impulseCount > 0) {
    out.push({
      id: nid(), priority: 'high', category: 'impulse',
      title: `${score.impulseCount} impulse purchase${score.impulseCount > 1 ? 's' : ''} detected`,
      body: `Each impulse buy costs 0.5 pts off your score. You're ${score.impPen} pts behind your potential. These are the quickest wins available.`,
      action: 'Review and eliminate impulse items',
      scoreImpact: score.impPen, creditImpact: 0,
    })
  }

  // ── Debt-driven ─────────────────────────────────────────────────────────
  if (score.dP > 20) {
    const excess = Math.min(200, Math.max(50, Math.round(score.debt * 0.4)))
    out.push({
      id: nid(), priority: 'critical', category: 'debt',
      title: `Debt at ${score.dP}% of income — crushing net savings`,
      body: `Debt payments consume ${score.dP}% of income, dragging net savings to ${score.netSav}%. Every extra $100 toward principal lifts your net savings rate and score.`,
      action: `Increase debt payment by $${excess}/mo`,
      scoreImpact: 3, creditImpact: account ? 8 : 0,
      redirect: { to: 'debt-payment', amount: excess, label: 'High-interest debt' },
    })
  } else if (score.dP > 10) {
    out.push({
      id: nid(), priority: 'high', category: 'debt',
      title: `Debt ratio at ${score.dP}% — room to accelerate`,
      body: `You're managing debt but ${score.dP}% still eats into savings headroom. An extra $100–150/mo would lift your net savings rate within 3 months.`,
      action: 'Add $100–150/mo to debt paydown',
      scoreImpact: 2, creditImpact: account ? 5 : 0,
    })
  }

  // ── Credit-driven ───────────────────────────────────────────────────────
  if (account && account.creditScore && account.creditScore < 700) {
    const util = account.creditLimit > 0
      ? account.currentBalance / account.creditLimit
      : null
    if (util !== null && util > 0.3) {
      const targetBalance = Math.round(account.creditLimit * 0.28)
      const paydown = Math.max(50, Math.round(account.currentBalance - targetBalance))
      out.push({
        id: nid(), priority: 'high', category: 'credit',
        title: `Credit utilization at ${Math.round(util * 100)}% — hurting your score`,
        body: `Utilization above 30% is the second-biggest credit factor. Paying $${paydown} down brings you to 28% utilization — typically adding 15–40 pts within 1–2 cycles.`,
        action: `Pay down $${paydown} on credit card`,
        scoreImpact: 1, creditImpact: 25,
        redirect: { to: 'debt-payment', amount: paydown, label: 'Credit card balance' },
      })
    } else {
      out.push({
        id: nid(), priority: 'medium', category: 'credit',
        title: `Credit score ${account.creditScore} — targeted tips to reach 700+`,
        body: 'On-time payments (35% of score) and utilization under 30% (30% of score) are your fastest levers. Set autopay for minimums today, then attack the balance.',
        action: 'Set up autopay for all credit cards',
        scoreImpact: 0, creditImpact: 20,
      })
    }
  }

  // ── Savings ─────────────────────────────────────────────────────────────
  if (score.netSav < score.adjSavingsIdeal) {
    const gap = round1(score.adjSavingsIdeal - score.netSav)
    const gapDollars = Math.max(50, Math.round((gap / 100) * score.income))
    const recover = Math.max(0, round1(15 - score.savPts))
    out.push({
      id: nid(), priority: gap > 10 ? 'high' : 'medium', category: 'savings',
      title: `Net savings at ${score.netSav}% — ${gap}% below your target`,
      body: `Your mode-adjusted target is ${score.adjSavingsIdeal}%. Closing the gap (~$${gapDollars}/mo) would add up to ${recover} pts and double your emergency-fund speed.`,
      action: `Save an extra $${Math.min(gapDollars, 300)}/mo`,
      scoreImpact: recover, creditImpact: 0,
      redirect: { to: 'emergency-fund', amount: Math.min(gapDollars, 300), label: 'Emergency fund (3–6 mo expenses)' },
    })
  } else if (score.netSav >= 20) {
    const surplus = Math.round(((score.netSav - 20) / 100) * score.income)
    out.push({
      id: nid(), priority: 'low', category: 'savings',
      title: `Savings at ${score.netSav}% — channel surplus into investments`,
      body: 'You\'re beating the 20% benchmark. Surplus beyond your emergency fund is better deployed in low-cost index funds (VTI/VXUS) than sitting in cash.',
      action: 'Redirect surplus to Invest →',
      scoreImpact: 0, creditImpact: 0,
      redirect: { to: 'investment', amount: Math.max(50, surplus), label: 'Index fund portfolio' },
    })
  }

  // ── Mode escape ──────────────────────────────────────────────────────────
  if (score.mode === 'survival') {
    out.push({
      id: nid(), priority: 'critical', category: 'needs',
      title: 'Survival Mode: structural fix required',
      body: `${score.nP}% of income goes to fixed costs — discipline alone can't solve this. You need +$${score.incomeToEscape.toLocaleString()}/mo income or -$${score.needsCutToEscape.toLocaleString()}/mo in fixed costs to escape.`,
      action: `Target $${score.needsCutToEscape.toLocaleString()}/mo in fixed-cost cuts`,
      scoreImpact: 5, creditImpact: 0,
    })
  } else if (score.mode === 'constrained') {
    out.push({
      id: nid(), priority: 'high', category: 'needs',
      title: `Constrained Mode: ${score.nP}% in fixed costs`,
      body: `Needs above 65% compress your discretionary budget. Audit subscriptions, insurance, and any fixed costs added in the last 6 months. Cutting $${score.needsCutToEscape.toLocaleString()}/mo unlocks Standard Mode.`,
      action: 'Audit recurring subscriptions',
      scoreImpact: 4, creditImpact: 0,
    })
  }

  // ── Wants overage ────────────────────────────────────────────────────────
  if (score.wP > score.adjWantsIdeal) {
    const overBy = round1(score.wP - score.adjWantsIdeal)
    const overDollars = Math.max(50, Math.round((overBy / 100) * score.income))
    out.push({
      id: nid(), priority: overBy > 10 ? 'high' : 'medium', category: 'wants',
      title: `Wants at ${score.wP}% — ${overBy}% over target`,
      body: `You're spending ${overBy}% (~$${overDollars}) more than your wants target. Audit dining, entertainment, and subscriptions for quick wins.`,
      action: `Cut ~$${Math.min(overDollars, 200)}/mo from discretionary`,
      scoreImpact: round1(overBy * 0.33), creditImpact: 0,
    })
  }

  const order: Record<BudgetSuggestion['priority'], number> = { critical: 0, high: 1, medium: 2, low: 3 }
  out.sort((a, b) => order[a.priority] - order[b.priority] || b.scoreImpact - a.scoreImpact)
  return out
}
