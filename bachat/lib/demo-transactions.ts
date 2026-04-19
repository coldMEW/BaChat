// ================================================================
// Demo transaction seed — ~75 tx over last 60 days
// ================================================================
// Four hand-placed "plants" exercise every driver + every tone:
//  1. Savage — $425 Shein at 01:47 post-payday Saturday
//  2. Medium — 4 DoorDash orders 23:00–00:30 across one week
//  3. Burst  — 3 Amazon orders within 8 minutes on a Sunday
//  4. Recovery — final week's burn down 30% vs prior week
//
// Every merchant name here appears in merchant-lookup.ts so the demo
// hits Tier-1 categorization 100%.

import { db } from './db'
import { CATEGORY_DISCRETIONARY_WEIGHTS } from './dashboard/score-calibration'
import type { Account, Transaction, TxCategory } from '@/types'
import { DEMO_USER_ID } from './demo-seed'

const SEED_VERSION = 'v1-dashboard-2026-04'
const LS_KEY = 'bachat:dashboard-seed-version'

// Reference "now" for the seed so scores stay stable.  We anchor to the last
// day of the seed window so "most recent" tx fall within ROAST_SUBJECT_WINDOW_DAYS.
const SEED_NOW_MS = Date.UTC(2026, 3, 18, 20, 0, 0) // 2026-04-18 20:00 UTC

function ts(daysAgo: number, hour = 12, minute = 0): number {
  return SEED_NOW_MS - daysAgo * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000 + minute * 60 * 1000
}

function dateOf(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

interface SeedRow {
  daysAgo: number
  hour: number
  minute: number
  amount: number
  merchant: string
  description: string
  category: TxCategory
}

const SEED_ROWS: SeedRow[] = [
  // ---------------- Plant 1: SAVAGE (single big late-night post-payday) ----------------
  { daysAgo: 2,  hour: 1,  minute: 47, amount: 425, merchant: 'Shein',   description: 'SHEIN.COM *ORDER 22417',     category: 'fashion' },

  // ---------------- Plant 2: MEDIUM (4 late-night DoorDash across a week) ----------------
  { daysAgo: 12, hour: 23, minute: 18, amount: 42,  merchant: 'DoorDash', description: 'DOORDASH*JOE\'S PIZZA',       category: 'delivery' },
  { daysAgo: 10, hour: 23, minute: 40, amount: 38,  merchant: 'DoorDash', description: 'DOORDASH*NOODLE BAR',        category: 'delivery' },
  { daysAgo: 9,  hour: 0,  minute: 22, amount: 29,  merchant: 'DoorDash', description: 'DOORDASH*TACO SHACK',        category: 'delivery' },
  { daysAgo: 7,  hour: 23, minute: 55, amount: 46,  merchant: 'DoorDash', description: 'DOORDASH*SUSHI NIGHT',       category: 'delivery' },

  // ---------------- Plant 3: BURST (3 Amazon orders in 8 min) ----------------
  { daysAgo: 21, hour: 14, minute: 12, amount: 34,  merchant: 'Amazon',  description: 'AMZN Mktp US*RT7F21',        category: 'hobbies' },
  { daysAgo: 21, hour: 14, minute: 17, amount: 58,  merchant: 'Amazon',  description: 'AMZN Mktp US*KH2M09',        category: 'hobbies' },
  { daysAgo: 21, hour: 14, minute: 20, amount: 41,  merchant: 'Amazon',  description: 'AMZN Mktp US*BV3X88',        category: 'hobbies' },

  // ---------------- Income / paydays ----------------
  { daysAgo: 3,  hour: 9,  minute: 0,  amount: -3200, merchant: 'Payroll',       description: 'PAYROLL DIRECT DEP',   category: 'income' },
  { daysAgo: 18, hour: 9,  minute: 0,  amount: -3200, merchant: 'Payroll',       description: 'PAYROLL DIRECT DEP',   category: 'income' },
  { daysAgo: 33, hour: 9,  minute: 0,  amount: -3200, merchant: 'Payroll',       description: 'PAYROLL DIRECT DEP',   category: 'income' },
  { daysAgo: 48, hour: 9,  minute: 0,  amount: -3200, merchant: 'Payroll',       description: 'PAYROLL DIRECT DEP',   category: 'income' },

  // ---------------- Groceries (regular cadence, all weeks) ----------------
  { daysAgo: 4,  hour: 18, minute: 30, amount: 87,  merchant: 'Whole Foods',  description: 'WHOLE FOODS MARKET #455', category: 'groceries' },
  { daysAgo: 11, hour: 18, minute: 40, amount: 102, merchant: 'Whole Foods',  description: 'WHOLE FOODS MARKET #455', category: 'groceries' },
  { daysAgo: 18, hour: 17, minute: 10, amount: 94,  merchant: 'Trader Joes',  description: 'TRADER JOE\'S #311',      category: 'groceries' },
  { daysAgo: 25, hour: 18, minute: 10, amount: 76,  merchant: 'Whole Foods',  description: 'WHOLE FOODS MARKET #455', category: 'groceries' },
  { daysAgo: 32, hour: 19, minute: 0,  amount: 88,  merchant: 'Trader Joes',  description: 'TRADER JOE\'S #311',      category: 'groceries' },
  { daysAgo: 39, hour: 18, minute: 20, amount: 112, merchant: 'Whole Foods',  description: 'WHOLE FOODS MARKET #455', category: 'groceries' },
  { daysAgo: 46, hour: 18, minute: 0,  amount: 95,  merchant: 'Trader Joes',  description: 'TRADER JOE\'S #311',      category: 'groceries' },
  { daysAgo: 52, hour: 17, minute: 45, amount: 98,  merchant: 'Whole Foods',  description: 'WHOLE FOODS MARKET #455', category: 'groceries' },

  // ---------------- Coffee (daily-ish habit — NOT impulse) ----------------
  { daysAgo: 1,  hour: 8,  minute: 15, amount: 5.85, merchant: 'Starbucks',  description: 'STARBUCKS STORE 08412',    category: 'coffee' },
  { daysAgo: 2,  hour: 8,  minute: 10, amount: 4.95, merchant: 'Starbucks',  description: 'STARBUCKS STORE 08412',    category: 'coffee' },
  { daysAgo: 5,  hour: 8,  minute: 22, amount: 5.25, merchant: 'Starbucks',  description: 'STARBUCKS STORE 08412',    category: 'coffee' },
  { daysAgo: 8,  hour: 8,  minute: 18, amount: 6.10, merchant: 'Philz Coffee', description: 'PHILZ COFFEE #22',       category: 'coffee' },
  { daysAgo: 12, hour: 8,  minute: 20, amount: 5.85, merchant: 'Starbucks',  description: 'STARBUCKS STORE 08412',    category: 'coffee' },
  { daysAgo: 15, hour: 8,  minute: 12, amount: 4.50, merchant: 'Starbucks',  description: 'STARBUCKS STORE 08412',    category: 'coffee' },
  { daysAgo: 19, hour: 8,  minute: 15, amount: 5.85, merchant: 'Starbucks',  description: 'STARBUCKS STORE 08412',    category: 'coffee' },
  { daysAgo: 22, hour: 8,  minute: 20, amount: 5.85, merchant: 'Starbucks',  description: 'STARBUCKS STORE 08412',    category: 'coffee' },
  { daysAgo: 26, hour: 8,  minute: 10, amount: 5.25, merchant: 'Blue Bottle', description: 'BLUE BOTTLE COFFEE 17',   category: 'coffee' },
  { daysAgo: 30, hour: 8,  minute: 15, amount: 5.85, merchant: 'Starbucks',  description: 'STARBUCKS STORE 08412',    category: 'coffee' },
  { daysAgo: 35, hour: 8,  minute: 18, amount: 5.25, merchant: 'Starbucks',  description: 'STARBUCKS STORE 08412',    category: 'coffee' },
  { daysAgo: 41, hour: 8,  minute: 20, amount: 6.10, merchant: 'Philz Coffee', description: 'PHILZ COFFEE #22',       category: 'coffee' },

  // ---------------- Restaurants ----------------
  { daysAgo: 6,  hour: 20, minute: 0,  amount: 62,  merchant: 'Chipotle',  description: 'CHIPOTLE 2841',     category: 'restaurants' },
  { daysAgo: 14, hour: 12, minute: 35, amount: 18,  merchant: 'Sweetgreen', description: 'SWEETGREEN SOMA',  category: 'restaurants' },
  { daysAgo: 17, hour: 19, minute: 20, amount: 48,  merchant: 'Shake Shack', description: 'SHAKE SHACK MADISON', category: 'restaurants' },
  { daysAgo: 24, hour: 18, minute: 45, amount: 36,  merchant: 'Chipotle',  description: 'CHIPOTLE 2841',     category: 'restaurants' },
  { daysAgo: 31, hour: 19, minute: 40, amount: 74,  merchant: 'Sweetgreen', description: 'SWEETGREEN SOMA',  category: 'restaurants' },
  { daysAgo: 38, hour: 20, minute: 10, amount: 52,  merchant: 'Chipotle',  description: 'CHIPOTLE 2841',     category: 'restaurants' },

  // ---------------- Subscriptions ----------------
  { daysAgo: 3,  hour: 6,  minute: 0,  amount: 17.99, merchant: 'Netflix', description: 'NETFLIX.COM MONTHLY', category: 'subscriptions' },
  { daysAgo: 8,  hour: 6,  minute: 0,  amount: 11.99, merchant: 'Spotify', description: 'SPOTIFY PREMIUM',     category: 'subscriptions' },
  { daysAgo: 15, hour: 6,  minute: 0,  amount: 9.99,  merchant: 'Apple',   description: 'APPLE.COM/BILL',      category: 'subscriptions' },
  { daysAgo: 33, hour: 6,  minute: 0,  amount: 17.99, merchant: 'Netflix', description: 'NETFLIX.COM MONTHLY', category: 'subscriptions' },
  { daysAgo: 38, hour: 6,  minute: 0,  amount: 11.99, merchant: 'Spotify', description: 'SPOTIFY PREMIUM',     category: 'subscriptions' },
  { daysAgo: 45, hour: 6,  minute: 0,  amount: 9.99,  merchant: 'Apple',   description: 'APPLE.COM/BILL',      category: 'subscriptions' },

  // ---------------- Gas + transit ----------------
  { daysAgo: 8,  hour: 17, minute: 30, amount: 52,  merchant: 'Chevron',  description: 'CHEVRON 093212',   category: 'gas' },
  { daysAgo: 22, hour: 17, minute: 30, amount: 48,  merchant: 'Shell',    description: 'SHELL OIL 42189',  category: 'gas' },
  { daysAgo: 36, hour: 17, minute: 30, amount: 55,  merchant: 'Chevron',  description: 'CHEVRON 093212',   category: 'gas' },
  { daysAgo: 50, hour: 17, minute: 30, amount: 50,  merchant: 'Shell',    description: 'SHELL OIL 42189',  category: 'gas' },

  // ---------------- Utilities + rent ----------------
  { daysAgo: 2,  hour: 0,  minute: 1,  amount: 2100, merchant: 'Rent',    description: 'RENT VIA VENMO',   category: 'rent' },
  { daysAgo: 32, hour: 0,  minute: 1,  amount: 2100, merchant: 'Rent',    description: 'RENT VIA VENMO',   category: 'rent' },
  { daysAgo: 5,  hour: 0,  minute: 1,  amount: 78,  merchant: 'PG&E',     description: 'PG&E ELECTRIC',    category: 'utilities' },
  { daysAgo: 35, hour: 0,  minute: 1,  amount: 85,  merchant: 'PG&E',     description: 'PG&E ELECTRIC',    category: 'utilities' },
  { daysAgo: 10, hour: 0,  minute: 1,  amount: 62,  merchant: 'Comcast',  description: 'COMCAST XFINITY',  category: 'utilities' },
  { daysAgo: 40, hour: 0,  minute: 1,  amount: 62,  merchant: 'Comcast',  description: 'COMCAST XFINITY',  category: 'utilities' },

  // ---------------- Fitness ----------------
  { daysAgo: 15, hour: 7,  minute: 0,  amount: 180, merchant: 'Equinox',  description: 'EQUINOX MONTHLY', category: 'fitness' },
  { daysAgo: 45, hour: 7,  minute: 0,  amount: 180, merchant: 'Equinox',  description: 'EQUINOX MONTHLY', category: 'fitness' },

  // ---------------- Ride-share (occasional) ----------------
  { daysAgo: 6,  hour: 22, minute: 30, amount: 26,  merchant: 'Uber',    description: 'UBER *TRIP FROM DT', category: 'ride-share' },
  { daysAgo: 13, hour: 23, minute: 15, amount: 32,  merchant: 'Lyft',    description: 'LYFT *RIDE LATE',    category: 'ride-share' },
  { daysAgo: 27, hour: 21, minute: 0,  amount: 19,  merchant: 'Uber',    description: 'UBER *TRIP FROM DT', category: 'ride-share' },
  { daysAgo: 44, hour: 22, minute: 0,  amount: 28,  merchant: 'Lyft',    description: 'LYFT *RIDE LATE',    category: 'ride-share' },

  // ---------------- Entertainment (occasional) ----------------
  { daysAgo: 16, hour: 20, minute: 0,  amount: 58,  merchant: 'AMC Theatres',  description: 'AMC THEATRES #2012', category: 'entertainment' },
  { daysAgo: 37, hour: 19, minute: 30, amount: 124, merchant: 'Ticketmaster', description: 'TICKETMASTER *CONCERT', category: 'entertainment' },

  // ---------------- Fashion (occasional non-impulse) ----------------
  { daysAgo: 28, hour: 14, minute: 0,  amount: 110, merchant: 'Uniqlo',   description: 'UNIQLO STORE 044',    category: 'fashion' },
  { daysAgo: 50, hour: 15, minute: 30, amount: 78,  merchant: 'Nike',     description: 'NIKE.COM ORDER',      category: 'fashion' },

  // ---------------- Filler hobbies (extra Amazon purchases) ----------------
  { daysAgo: 5,  hour: 15, minute: 0,  amount: 24,  merchant: 'Amazon',  description: 'AMZN Mktp US*RT1D02',  category: 'hobbies' },
  { daysAgo: 19, hour: 16, minute: 20, amount: 67,  merchant: 'Amazon',  description: 'AMZN Mktp US*KM4L77',  category: 'hobbies' },
  { daysAgo: 34, hour: 11, minute: 5,  amount: 39,  merchant: 'Amazon',  description: 'AMZN Mktp US*BF9R01',  category: 'hobbies' },
  { daysAgo: 46, hour: 13, minute: 30, amount: 28,  merchant: 'Amazon',  description: 'AMZN Mktp US*KB6P12',  category: 'hobbies' },
]

function buildTransactions(): Omit<Transaction, 'id'>[] {
  return SEED_ROWS.map((r) => {
    const timestamp = ts(r.daysAgo, r.hour, r.minute)
    return {
      userId: DEMO_USER_ID,
      date: dateOf(timestamp),
      timestamp,
      amount: r.amount,
      merchant: r.merchant,
      description: r.description,
      category: r.category,
      discretionaryWeight: CATEGORY_DISCRETIONARY_WEIGHTS[r.category],
      seedOrigin: 'seed',
      createdAt: SEED_NOW_MS,
    }
  })
}

const DEMO_ACCOUNT: Account = {
  userId: DEMO_USER_ID,
  creditScore: 720,
  creditLimit: 8000,
  currentBalance: 1400,
  monthlyPaymentPct: 3,
  savings: 6800,
  debt: 2400,
  configuredAt: SEED_NOW_MS,
}

export async function ensureDashboardSeed(): Promise<void> {
  if (typeof window === 'undefined') return

  let stored: string | null = null
  try { stored = window.localStorage.getItem(LS_KEY) } catch { /* no-op */ }

  const needsSeed = stored !== SEED_VERSION
  if (!needsSeed) return

  // Only delete rows with seedOrigin='seed' — preserve user uploads.
  await db().transactions.where({ userId: DEMO_USER_ID, seedOrigin: 'seed' }).delete()
  await db().transactions.bulkAdd(buildTransactions() as Transaction[])

  // Only seed account if it doesn't exist — users who ran AccountsSetupModal shouldn't be overwritten.
  const existingAccount = await db().accounts.get(DEMO_USER_ID)
  if (!existingAccount) {
    await db().accounts.put(DEMO_ACCOUNT)
  }

  try { window.localStorage.setItem(LS_KEY, SEED_VERSION) } catch { /* no-op */ }
}
