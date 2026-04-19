// ================================================================
// Impulse-score calibration constants
// ================================================================
// All tunables live here so the composition in impulse.ts stays clean.
// Every constant was picked so a "normal" (median) purchase sits near
// 0.25 and a clearly-impulsive one sits near 0.80.

import type { TxCategory } from '@/types'

/** Sigmoid intercept. Shifts the whole curve — a normal purchase with zero
 *  flags sits around sigmoid(-1.0) ≈ 0.27 (not 0.5). */
export const SIGMOID_INTERCEPT = -1.0

/** Z-score clamp magnitude. A single $4 000 outlier shouldn't saturate
 *  every nearby purchase at 1.0. */
export const Z_CLAMP_ABS = 3

/** Weight blending user-specific category stats with a global prior
 *  (empirical-Bayes shrinkage for low-n categories / cold-start users). */
export const EB_PRIOR_WEIGHT = 10

/** Per-family signed-weight contribution into the linear combo. */
export const WEIGHTS = {
  zScore: 0.35,
  lateNight: 0.25,
  burst: 0.20,
  discretionary: 0.15,
  postPayday: 0.05,
}

/** Discretionary propensity per category (0 = never impulsive → 1 = most impulsive). */
export const CATEGORY_DISCRETIONARY_WEIGHTS: Record<TxCategory, number> = {
  rent: 0.05,
  utilities: 0.05,
  insurance: 0.05,
  healthcare: 0.10,
  transit: 0.10,
  gas: 0.10,
  groceries: 0.15,
  education: 0.15,
  'transport-other': 0.20,
  fees: 0.20,
  charity: 0.25,
  subscriptions: 0.45,
  fitness: 0.45,
  coffee: 0.55,
  restaurants: 0.60,
  gifts: 0.65,
  home: 0.70,
  travel: 0.75,
  hobbies: 0.80,
  electronics: 0.85,
  entertainment: 0.90,
  delivery: 0.95,
  'ride-share': 0.55,
  fashion: 1.00,
  uncategorized: 0.50,
  transfer: 0.0,
  income: 0.0,
}

/** Rolling window for headline aggregation. */
export const IMPULSE_WINDOW_DAYS = 30

/** Window for "roast subject" selection — last two weeks feels current. */
export const ROAST_SUBJECT_WINDOW_DAYS = 14

/** Local-hour range treated as "late night". Inclusive start, exclusive end. */
export const LATE_NIGHT_START_HOUR = 23   // 23:00
export const LATE_NIGHT_END_HOUR = 3      // 03:00 next day

/** A "burst" = ≥ this many discretionary tx within this many minutes. */
export const BURST_MIN_COUNT = 3
export const BURST_WINDOW_MINUTES = 10

/** Days after a detected payday (income > $500 in a single tx) that count as post-payday. */
export const POST_PAYDAY_WINDOW_HOURS = 48

/** Income threshold (absolute value in the tx amount stream) that detects a payday. */
export const PAYDAY_MIN_AMOUNT = 500

/** Tone-selection thresholds. */
export const SAVAGE_TX_BURN = 80             // single-tx amount * impulse > $80 → savage
export const SAVAGE_MONTHLY_RATIO = 0.50     // burnt_30d / monthly_budget > 0.5 → savage
export const SUPPORTIVE_WEEK_DROP = 0.20     // week-over-week burn down ≥ 20% → supportive
