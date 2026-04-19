// ================================================================
// File-system persistent cache with in-memory hot layer.
// Zero external infra (no Redis). Cache lives under `.cache/` which
// is git-ignored and survives `next dev` restarts.
//
// API:
//   const hit = await cacheGet<T>('prices', 'NVDA:1d:365')
//   await cacheSet('prices', 'NVDA:1d:365', data, ttlMs)
//
// Usage pattern in a route handler:
//   const key = `${symbol}:${days}`
//   const cached = await cacheGet<Candle[]>('prices', key)
//   if (cached) return NextResponse.json({ data: cached.data, cached: true, ... })
//   const fresh = await fetchUpstream(...)
//   await cacheSet('prices', key, fresh, 24 * 3600 * 1000)
//   return NextResponse.json({ data: fresh, cached: false, ... })
// ================================================================

import fs from 'node:fs/promises'
import path from 'node:path'

interface CacheEntry<T> {
  data: T
  fetchedAt: number
  ttlMs: number
}

const ROOT = path.join(process.cwd(), '.cache')
const memory = new Map<string, CacheEntry<unknown>>()

function safeKey(key: string): string {
  return Buffer.from(key).toString('base64url')
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export async function cacheGet<T>(
  bucket: string,
  key: string,
): Promise<CacheEntry<T> | null> {
  const memKey = `${bucket}:${key}`
  const hit = memory.get(memKey) as CacheEntry<T> | undefined
  if (hit && Date.now() - hit.fetchedAt < hit.ttlMs) return hit
  const file = path.join(ROOT, bucket, safeKey(key) + '.json')
  try {
    const buf = await fs.readFile(file, 'utf8')
    const json = JSON.parse(buf) as CacheEntry<T>
    if (Date.now() - json.fetchedAt < json.ttlMs) {
      memory.set(memKey, json as CacheEntry<unknown>)
      return json
    }
  } catch {
    /* no file / parse error — treat as miss */
  }
  return null
}

export async function cacheSet<T>(
  bucket: string,
  key: string,
  data: T,
  ttlMs: number,
): Promise<void> {
  const entry: CacheEntry<T> = { data, fetchedAt: Date.now(), ttlMs }
  memory.set(`${bucket}:${key}`, entry as CacheEntry<unknown>)
  const dir = path.join(ROOT, bucket)
  try {
    await ensureDir(dir)
    const final = path.join(dir, safeKey(key) + '.json')
    const tmp = final + '.tmp'
    await fs.writeFile(tmp, JSON.stringify(entry), 'utf8')
    await fs.rename(tmp, final)
  } catch (err) {
    console.warn('[fs-cache] disk write failed (memory still OK):', err)
  }
}

/** Clear both memory + disk for a bucket. */
export async function cacheClear(bucket: string): Promise<void> {
  for (const k of Array.from(memory.keys())) {
    if (k.startsWith(bucket + ':')) memory.delete(k)
  }
  try {
    await fs.rm(path.join(ROOT, bucket), { recursive: true, force: true })
  } catch { /* noop */ }
}

export const CACHE_TTL = {
  prices: 24 * 60 * 60 * 1000,       // 24h — daily OHLC doesn't change intraday
  news: 2 * 60 * 60 * 1000,          // 2h — Finnhub news is slow-moving
  analyst: 24 * 60 * 60 * 1000,      // 24h — analyst actions are daily at most
  peers: 7 * 24 * 60 * 60 * 1000,    // 7d — peer lists are very stable
  macro: 24 * 60 * 60 * 1000,        // 24h — FRED data is monthly-ish
  graph: 24 * 60 * 60 * 1000,        // 24h — correlation recomputes nightly
  predict: 6 * 60 * 60 * 1000,       // 6h — composite score
  portfolio: 12 * 60 * 60 * 1000,    // 12h — analysis for user's portfolio
}
