// ================================================================
// Dexie schema — all Bachat local (IndexedDB) state
// ================================================================
// Every table is keyed such that multiple users can coexist in one
// browser safely: `userId` is always indexed; caches use composite keys.

import Dexie, { type Table } from 'dexie'
import type {
  AnalystData,
  DirectionalPrediction,
  DiversificationAnalysis,
  Holding,
  NewsCache,
  PriceHistory,
} from '@/types'

export interface PredictionCacheRow {
  key: string               // `${symbol}:${horizon}`
  userId: string
  prediction: DirectionalPrediction
  fetchedAt: number
  ttlMs: number
}

export interface PortfolioAnalysisRow {
  portfolioHash: string
  userId: string
  analysis: DiversificationAnalysis
  fetchedAt: number
  ttlMs: number
}

export interface AnalystCacheRow extends AnalystData {
  // table uses symbol + userId as composite key; stored here for clarity
  userId: string
}

export interface PriceCacheRow extends PriceHistory {
  key: string               // `${symbol}:${interval}`
  userId: string
}

export interface NewsCacheRow extends NewsCache {
  userId: string
}

class BachatDB extends Dexie {
  holdings!: Table<Holding, number>
  priceCache!: Table<PriceCacheRow, string>
  newsCache!: Table<NewsCacheRow, [string, string]>
  analystCache!: Table<AnalystCacheRow, [string, string]>
  predictionCache!: Table<PredictionCacheRow, string>
  portfolioAnalysisCache!: Table<PortfolioAnalysisRow, [string, string]>

  constructor() {
    super('bachat')
    this.version(1).stores({
      holdings: '++id, userId, symbol, assetType, [userId+symbol]',
      priceCache: 'key, userId, fetchedAt',
      newsCache: '[userId+symbol], fetchedAt',
      analystCache: '[userId+symbol], fetchedAt',
      predictionCache: 'key, userId, fetchedAt',
      portfolioAnalysisCache: '[userId+portfolioHash], fetchedAt',
    })
  }
}

// Lazy singleton — only instantiate in the browser.
let _db: BachatDB | null = null

export function db(): BachatDB {
  if (typeof window === 'undefined') {
    throw new Error('db() called in server context — move to client or use server-side cache')
  }
  if (!_db) _db = new BachatDB()
  return _db
}

export function isCacheFresh(row: { fetchedAt: number; ttlMs: number }): boolean {
  return Date.now() - row.fetchedAt < row.ttlMs
}
