// ================================================================
// Twelve Data client — OHLC, quotes, symbol search
// ================================================================
// Server-only. Never import from a client component.

import type { Candle, Interval, Quote } from '@/types'
import { acquire } from './rate-limiter'
import { CACHE_TTL, cacheGet, cacheSet } from './fs-cache'

const BASE = 'https://api.twelvedata.com'

function key(): string {
  const k = process.env.TWELVEDATA_API_KEY
  if (!k) throw new Error('TWELVEDATA_API_KEY not set')
  return k
}

interface TDTimeSeriesResponse {
  meta?: { symbol: string; interval: string; type: string }
  values?: Array<{
    datetime: string
    open: string
    high: string
    low: string
    close: string
    volume?: string
  }>
  status?: string
  code?: number
  message?: string
}

/** Fetch daily OHLC. `outputsize` caps at 5000 for free tier.
 *  Cached across ALL consumers via fs-cache 'upstream' bucket, so the prices route,
 *  portfolio-analysis, graph, and predict all share the same disk entry per symbol. */
export async function fetchTimeSeries(
  symbol: string,
  interval: Interval = '1d',
  outputsize = 365,
): Promise<Candle[]> {
  const cacheKey = `td:ts:${symbol}:${interval}:${outputsize}`
  const hit = await cacheGet<Candle[]>('upstream', cacheKey)
  if (hit) return hit.data

  await acquire('twelvedata')
  const tdInterval = interval === '1d' ? '1day' : interval === '1h' ? '1h' : '1week'
  const url = `${BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tdInterval}&outputsize=${outputsize}&apikey=${key()}`

  const res = await fetch(url, { cache: 'no-store' })
  const json = (await res.json()) as TDTimeSeriesResponse

  if (json.status === 'error' || !json.values) {
    throw new Error(`Twelve Data error for ${symbol}: ${json.message ?? 'no values'}`)
  }

  const candles: Candle[] = json.values
    .map((v) => [
      new Date(v.datetime + 'Z').getTime(),
      parseFloat(v.open),
      parseFloat(v.high),
      parseFloat(v.low),
      parseFloat(v.close),
      v.volume ? parseFloat(v.volume) : 0,
    ] as Candle)
    .sort((a, b) => a[0] - b[0])

  await cacheSet('upstream', cacheKey, candles, CACHE_TTL.prices)
  return candles
}

interface TDQuoteResponse {
  symbol?: string
  name?: string
  close?: string
  change?: string
  percent_change?: string
  status?: string
  message?: string
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  await acquire('twelvedata')
  const url = `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key()}`
  const res = await fetch(url, { cache: 'no-store' })
  const json = (await res.json()) as TDQuoteResponse
  if (json.status === 'error' || !json.close) {
    throw new Error(`Twelve Data quote error for ${symbol}: ${json.message ?? 'missing close'}`)
  }
  return {
    symbol: json.symbol ?? symbol,
    price: parseFloat(json.close),
    change: parseFloat(json.change ?? '0'),
    changePct: parseFloat(json.percent_change ?? '0'),
    timestamp: Date.now(),
  }
}

interface TDSearchResponse {
  data?: Array<{
    symbol: string
    instrument_name?: string
    exchange?: string
    instrument_type?: string
    country?: string
    currency?: string
  }>
}

export interface SymbolMatch {
  symbol: string
  name: string
  type: 'equity' | 'etf' | 'crypto' | 'other'
  exchange?: string
}

export async function searchSymbols(query: string, limit = 10): Promise<SymbolMatch[]> {
  await acquire('twelvedata')
  const url = `${BASE}/symbol_search?symbol=${encodeURIComponent(query)}&outputsize=${limit}`
  const res = await fetch(url, { cache: 'no-store' })
  const json = (await res.json()) as TDSearchResponse
  if (!json.data) return []
  return json.data.slice(0, limit).map((d) => ({
    symbol: d.symbol,
    name: d.instrument_name ?? d.symbol,
    type: mapInstrumentType(d.instrument_type),
    exchange: d.exchange,
  }))
}

function mapInstrumentType(t?: string): SymbolMatch['type'] {
  if (!t) return 'other'
  const low = t.toLowerCase()
  if (low.includes('etf')) return 'etf'
  if (low.includes('digital') || low.includes('crypto')) return 'crypto'
  if (low.includes('stock') || low.includes('common')) return 'equity'
  return 'other'
}
