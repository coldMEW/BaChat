// Seed demo holdings on first visit. Covers equities, ETFs, and crypto
// so every feature (correlation, crypto graph, analyst consensus) has
// enough data to light up.
//
// Includes a seed-version bump — when the seed list changes, existing
// demo users are automatically refreshed.

import { db } from './db'
import type { Holding } from '@/types'

export const DEMO_USER_ID = 'demo-user'
const SEED_VERSION = 'v2-10tickers-2026-04'
const LS_VERSION_KEY = 'bachat:demo-seed-version'

const SEED: Omit<Holding, 'id'>[] = [
  { userId: DEMO_USER_ID, symbol: 'NVDA',    assetType: 'equity', shares: 12,   costBasis: 420,   purchaseDate: '2024-01-15', currency: 'USD', createdAt: Date.now() },
  { userId: DEMO_USER_ID, symbol: 'AAPL',    assetType: 'equity', shares: 25,   costBasis: 172,   purchaseDate: '2023-11-01', currency: 'USD', createdAt: Date.now() },
  { userId: DEMO_USER_ID, symbol: 'MSFT',    assetType: 'equity', shares: 10,   costBasis: 355,   purchaseDate: '2024-03-01', currency: 'USD', createdAt: Date.now() },
  { userId: DEMO_USER_ID, symbol: 'GOOGL',   assetType: 'equity', shares: 18,   costBasis: 135,   purchaseDate: '2024-02-10', currency: 'USD', createdAt: Date.now() },
  { userId: DEMO_USER_ID, symbol: 'TSLA',    assetType: 'equity', shares: 8,    costBasis: 240,   purchaseDate: '2024-04-05', currency: 'USD', createdAt: Date.now() },
  { userId: DEMO_USER_ID, symbol: 'AMD',     assetType: 'equity', shares: 15,   costBasis: 165,   purchaseDate: '2024-05-20', currency: 'USD', createdAt: Date.now() },
  { userId: DEMO_USER_ID, symbol: 'VTI',     assetType: 'etf',    shares: 14,   costBasis: 228,   purchaseDate: '2023-08-10', currency: 'USD', createdAt: Date.now() },
  { userId: DEMO_USER_ID, symbol: 'QQQ',     assetType: 'etf',    shares: 8,    costBasis: 390,   purchaseDate: '2024-01-22', currency: 'USD', createdAt: Date.now() },
  { userId: DEMO_USER_ID, symbol: 'BTC/USD', assetType: 'crypto', shares: 0.18, costBasis: 42000, purchaseDate: '2024-02-01', currency: 'USD', createdAt: Date.now() },
  { userId: DEMO_USER_ID, symbol: 'ETH/USD', assetType: 'crypto', shares: 1.4,  costBasis: 2800,  purchaseDate: '2024-03-15', currency: 'USD', createdAt: Date.now() },
]

export async function ensureSeed(): Promise<void> {
  // Version check — re-seed if SEED_VERSION bumped
  let storedVersion: string | null = null
  try {
    storedVersion = typeof window !== 'undefined' ? window.localStorage.getItem(LS_VERSION_KEY) : null
  } catch {
    /* no-op */
  }
  const needsSeed =
    storedVersion !== SEED_VERSION ||
    (await db().holdings.where('userId').equals(DEMO_USER_ID).count()) === 0

  if (!needsSeed) return

  // Clear existing demo-user rows, then re-seed.
  await db().holdings.where('userId').equals(DEMO_USER_ID).delete()
  await db().holdings.bulkAdd(SEED as Holding[])
  try {
    window.localStorage.setItem(LS_VERSION_KEY, SEED_VERSION)
  } catch {
    /* no-op */
  }
}
