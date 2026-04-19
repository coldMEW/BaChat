import type { TxCategory } from '@/types'

export type BudgetMode = 'standard' | 'constrained' | 'survival'

export interface BudgetScoreResult {
  score: number        // 0..37
  mode: BudgetMode
  income: number

  needs: number        // dollar spend last 30d
  wants: number
  savings: number
  debt: number

  nP: number           // % of income
  wP: number
  sP: number
  dP: number
  netSav: number       // sP - dP

  needsIdeal: number
  wantsIdeal: number
  savingsIdeal: number
  adjWantsIdeal: number
  adjSavingsIdeal: number

  needsPts: number     // /7
  wantsPts: number     // /10
  savPts: number       // /15
  creditPts: number    // /5
  impPen: number

  impulseCount: number
  incomeToEscape: number
  needsCutToEscape: number
}

export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low'
export type SuggestionCategory = 'savings' | 'debt' | 'impulse' | 'needs' | 'wants' | 'credit'

export interface BudgetSuggestion {
  id: string
  priority: SuggestionPriority
  category: SuggestionCategory
  title: string
  body: string
  action: string
  scoreImpact: number
  creditImpact: number
  redirect?: {
    to: 'savings' | 'debt-payment' | 'investment' | 'emergency-fund'
    amount: number
    label: string
  }
}

export type SimCategory = 'needs' | 'wants' | 'savings' | 'debt' | 'investment'
export type PayWith = 'cash' | 'credit'

export interface SimulationResult {
  decision: string
  amount: number
  category: SimCategory
  payWith: PayWith

  // Pulse score
  scoreAfter: number
  scoreDelta: number

  // Credit score + utilization
  creditScoreAfter: number | null
  creditDelta: number | null
  utilizationBefore: number | null   // % of credit limit
  utilizationAfter: number | null

  // Savings flow + balance
  savingsAfter: number               // monthly savings flow after
  savingsDelta: number
  savingsBalanceAfter: number        // actual savings account balance after

  // Debt
  debtAfter: number
  debtDelta: number

  // Monthly cashflow
  cashflowBefore: number             // income − expenses − debt payment
  cashflowAfter: number
  cashflowDelta: number

  // Emergency fund
  emergencyMonthsBefore: number
  emergencyMonthsAfter: number

  // Affordability verdict
  canAfford: boolean
  affordabilityLevel: 'comfortable' | 'manageable' | 'tight' | 'risky' | 'unaffordable'
  affordabilityDetail: string

  impulseCountAfter: number
  verdict: 'good' | 'neutral' | 'risky' | 'avoid'
  verdictReason: string
  alternatives: { label: string; description: string; scoreGain: number }[]
}

export type CategoryBucket = 'needs' | 'wants'

export const CATEGORY_TO_BUCKET: Record<TxCategory, CategoryBucket> = {
  // Needs
  rent:            'needs',
  utilities:       'needs',
  groceries:       'needs',
  gas:             'needs',
  insurance:       'needs',
  healthcare:      'needs',
  transit:         'needs',
  'transport-other': 'needs',
  education:       'needs',
  // Wants
  restaurants:     'wants',
  coffee:          'wants',
  delivery:        'wants',
  'ride-share':    'wants',
  fitness:         'wants',
  subscriptions:   'wants',
  entertainment:   'wants',
  fashion:         'wants',
  electronics:     'wants',
  home:            'wants',
  hobbies:         'wants',
  travel:          'wants',
  gifts:           'wants',
  charity:         'wants',
  fees:            'wants',
  transfer:        'wants',
  income:          'wants',
  uncategorized:   'wants',
}
