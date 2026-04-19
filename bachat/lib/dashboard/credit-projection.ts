// ================================================================
// Credit-score projection — utilization-only, deterministic
// ================================================================
// Public-approximation of the FICO utilization curve. Never projects
// upward (we don't model positive drivers). Disclaimer names the four
// omitted factors.

import type {
  Account,
  CreditProjection,
  CreditProjectionHorizon,
  Transaction,
} from '@/types'

const HORIZONS = [30, 60, 90] as const

const DISCLAIMER =
  'Utilization-only projection. Omits payment history, credit age, new inquiries, and credit mix. Real FICO weights 5 factors.'

function utilizationImpact(u: number): number {
  if (u <= 0.09) return 0
  if (u <= 0.29) return -5 * (u - 0.09) / 0.20
  if (u <= 0.49) return -5 - 25 * (u - 0.29) / 0.20
  if (u <= 0.74) return -30 - 50 * (u - 0.49) / 0.25
  return -80 - Math.min(40, 40 * (u - 0.74) / 0.26)
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

export interface ProjectionInputs {
  account: Account
  transactions: Transaction[]
  now?: number
}

export function projectCreditScore(inputs: ProjectionInputs): CreditProjection {
  const { account, transactions } = inputs
  const now = inputs.now ?? Date.now()
  const asOf = new Date(now).toISOString()

  // Daily discretionary burn over last 30 d
  const windowMs = 30 * 24 * 60 * 60 * 1000
  const recent = transactions.filter(
    (t) => t.amount > 0 && t.discretionaryWeight >= 0.2 && now - t.timestamp <= windowMs,
  )
  const totalBurn = recent.reduce((a, b) => a + b.amount, 0)
  const dailyBurn = totalBurn / 30

  const pct = account.monthlyPaymentPct / 100
  const currentU = account.creditLimit > 0
    ? account.currentBalance / account.creditLimit
    : 0

  const horizons: CreditProjectionHorizon[] = HORIZONS.map((h) => {
    const projectedBalance = Math.max(
      0,
      account.currentBalance + dailyBurn * h - account.currentBalance * pct * (h / 30),
    )
    const u = account.creditLimit > 0 ? projectedBalance / account.creditLimit : 0
    const impact = utilizationImpact(u)
    const projectedScore = clamp(account.creditScore + impact, 300, 850)
    return {
      days: h,
      projectedBalance,
      projectedUtilization: u,
      projectedScore,
      delta: Math.min(0, projectedScore - account.creditScore),
      utilizationImpact: impact,
      onTrack: impact >= 0,
    }
  })

  return {
    currentScore: account.creditScore,
    currentUtilization: currentU,
    dailyBurn,
    horizons,
    disclaimer: DISCLAIMER,
    asOf,
  }
}
