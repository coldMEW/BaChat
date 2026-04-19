// ================================================================
// FRED client — Fed rate, CPI, Dollar Index
// ================================================================
// Server-only. FRED returns time series by series_id.

import type { MacroSnapshot } from '@/types'
import { acquire } from './rate-limiter'
import { CACHE_TTL, cacheGet, cacheSet } from './fs-cache'

const BASE = 'https://api.stlouisfed.org/fred'

function key(): string {
  const k = process.env.FRED_API_KEY
  if (!k) throw new Error('FRED_API_KEY not set')
  return k
}

interface FredObservation {
  date: string
  value: string           // "." means missing
}

interface FredSeriesResponse {
  observations?: FredObservation[]
}

async function fetchSeries(seriesId: string, limit = 12): Promise<FredObservation[]> {
  await acquire('fred')
  const url = `${BASE}/series/observations?series_id=${seriesId}&api_key=${key()}&file_type=json&sort_order=desc&limit=${limit}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`FRED error ${res.status} for ${seriesId}`)
  const json = (await res.json()) as FredSeriesResponse
  return json.observations ?? []
}

function toNumbers(obs: FredObservation[]): Array<{ date: string; value: number }> {
  return obs
    .filter((o) => o.value !== '.')
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }))
}

export async function fetchMacroSnapshot(): Promise<MacroSnapshot> {
  const hit = await cacheGet<MacroSnapshot>('upstream', 'fred:macro:snapshot')
  if (hit) return hit.data

  // FEDFUNDS — effective fed funds rate (monthly)
  // CPIAUCSL — CPI for all urban consumers (monthly, SA)
  // DTWEXBGS — broad dollar index (daily)
  const [fed, cpi, dxy] = await Promise.all([
    fetchSeries('FEDFUNDS', 6),
    fetchSeries('CPIAUCSL', 14),
    fetchSeries('DTWEXBGS', 30),
  ])

  const fedVals = toNumbers(fed)
  const cpiVals = toNumbers(cpi)
  const dxyVals = toNumbers(dxy)

  const fedCurrent = fedVals[0]?.value ?? 0
  const fedPrev = fedVals[1]?.value ?? fedCurrent

  let fedTrend: MacroSnapshot['fedFundsTrend'] = 'pausing'
  if (fedCurrent < fedPrev - 0.05) fedTrend = 'cutting'
  else if (fedCurrent > fedPrev + 0.05) fedTrend = 'hiking'

  // YoY CPI: CPI_now / CPI_12mo_ago - 1
  let cpiYoY = 0
  if (cpiVals.length >= 13) {
    cpiYoY = (cpiVals[0].value / cpiVals[12].value - 1) * 100
  }
  // CPI trend: last 3 months vs previous 3 months
  let cpiTrend: MacroSnapshot['cpiTrend'] = 'stable'
  if (cpiVals.length >= 6) {
    const recent3 = (cpiVals[0].value + cpiVals[1].value + cpiVals[2].value) / 3
    const prev3 = (cpiVals[3].value + cpiVals[4].value + cpiVals[5].value) / 3
    const delta = (recent3 / prev3 - 1) * 100
    if (delta > 0.3) cpiTrend = 'accelerating'
    else if (delta < -0.3) cpiTrend = 'decelerating'
  }

  const dxyNow = dxyVals[0]?.value ?? 100
  const dxy30ago = dxyVals[29]?.value ?? dxyNow
  let dollarTrend: MacroSnapshot['dollarTrend'] = 'stable'
  const dxyDelta = ((dxyNow - dxy30ago) / dxy30ago) * 100
  if (dxyDelta > 1.5) dollarTrend = 'strengthening'
  else if (dxyDelta < -1.5) dollarTrend = 'weakening'

  const snapshot: MacroSnapshot = {
    fedFundsRate: fedCurrent,
    fedFundsTrend: fedTrend,
    cpiYoY,
    cpiTrend,
    dollarIndex: dxyNow,
    dollarTrend,
    fetchedAt: Date.now(),
    asOf: fedVals[0]?.date ?? new Date().toISOString().slice(0, 10),
  }
  await cacheSet('upstream', 'fred:macro:snapshot', snapshot, CACHE_TTL.macro)
  return snapshot
}
