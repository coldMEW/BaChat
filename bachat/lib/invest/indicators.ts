// ================================================================
// Technical indicators — pure functions over price series
// ================================================================
// Every function is deterministic and side-effect-free. No I/O.
// Inputs are plain arrays of numbers (closes). Outputs are plain.

/** Simple moving average. Returns an array aligned to `values.length`;
 * positions before enough data are `NaN`. */
export function sma(values: number[], window: number): number[] {
  if (window <= 0 || window > values.length) {
    return values.map(() => NaN)
  }
  const out: number[] = new Array(values.length).fill(NaN)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= window) sum -= values[i - window]
    if (i >= window - 1) out[i] = sum / window
  }
  return out
}

/** Exponential moving average. Seeds from first valid SMA. */
export function ema(values: number[], window: number): number[] {
  if (window <= 0 || window > values.length) {
    return values.map(() => NaN)
  }
  const k = 2 / (window + 1)
  const out: number[] = new Array(values.length).fill(NaN)
  // Seed
  let seed = 0
  for (let i = 0; i < window; i++) seed += values[i]
  seed /= window
  out[window - 1] = seed
  for (let i = window; i < values.length; i++) {
    out[i] = values[i] * k + out[i - 1] * (1 - k)
  }
  return out
}

/** RSI (Wilder) with given period (default 14). */
export function rsi(closes: number[], period = 14): number[] {
  const out: number[] = new Array(closes.length).fill(NaN)
  if (closes.length < period + 1) return out

  let gainSum = 0
  let lossSum = 0
  // Seed with simple averages of the first `period` changes
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1]
    if (change > 0) gainSum += change
    else lossSum += -change
  }
  let avgGain = gainSum / period
  let avgLoss = lossSum / period
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? -change : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

export interface MACDResult {
  macd: number[]
  signal: number[]
  histogram: number[]
}

/** MACD(12, 26, 9). */
export function macd(closes: number[], fast = 12, slow = 26, signalPeriod = 9): MACDResult {
  const emaFast = ema(closes, fast)
  const emaSlow = ema(closes, slow)
  const macdLine = closes.map((_, i) => emaFast[i] - emaSlow[i])
  const signal = ema(macdLine.map((v) => (isNaN(v) ? 0 : v)), signalPeriod)
  // Blank out positions before MACD line is valid
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(macdLine[i])) signal[i] = NaN
  }
  const histogram = macdLine.map((v, i) => v - signal[i])
  return { macd: macdLine, signal, histogram }
}

/** Returns true if a bullish MACD cross (line crossed above signal) occurred
 *  in the last `lookback` bars. False for bearish or no cross. */
export function lastMacdCross(result: MACDResult, lookback = 5): 'bullish' | 'bearish' | 'none' {
  const { macd, signal } = result
  const end = macd.length - 1
  for (let i = end; i > end - lookback && i > 0; i--) {
    const prev = macd[i - 1] - signal[i - 1]
    const curr = macd[i] - signal[i]
    if (!isFinite(prev) || !isFinite(curr)) continue
    if (prev < 0 && curr > 0) return 'bullish'
    if (prev > 0 && curr < 0) return 'bearish'
  }
  return 'none'
}

export interface BollingerResult {
  upper: number[]
  middle: number[]
  lower: number[]
}

export function bollingerBands(closes: number[], window = 20, stdDev = 2): BollingerResult {
  const middle = sma(closes, window)
  const upper: number[] = new Array(closes.length).fill(NaN)
  const lower: number[] = new Array(closes.length).fill(NaN)
  for (let i = window - 1; i < closes.length; i++) {
    let variance = 0
    for (let j = i - window + 1; j <= i; j++) {
      variance += (closes[j] - middle[i]) ** 2
    }
    const sd = Math.sqrt(variance / window)
    upper[i] = middle[i] + stdDev * sd
    lower[i] = middle[i] - stdDev * sd
  }
  return { upper, middle, lower }
}

/** Annualized realized volatility from daily closes (last `window` bars).
 *  Returns stdev of daily log returns × sqrt(252). */
export function realizedVolatility(closes: number[], window = 30): number {
  if (closes.length < window + 1) return NaN
  const returns: number[] = []
  for (let i = closes.length - window; i < closes.length; i++) {
    if (i === 0) continue
    returns.push(Math.log(closes[i] / closes[i - 1]))
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length
  return Math.sqrt(variance) * Math.sqrt(252)
}

/** 30-day momentum z-score vs trailing 252-day mean/std of daily returns. */
export function momentumZScore(closes: number[]): number {
  if (closes.length < 253) return 0
  const dailyReturns: number[] = []
  for (let i = 1; i < closes.length; i++) {
    dailyReturns.push(Math.log(closes[i] / closes[i - 1]))
  }
  const last30 = dailyReturns.slice(-30).reduce((a, b) => a + b, 0)
  const last252 = dailyReturns.slice(-252)
  const mean = last252.reduce((a, b) => a + b, 0) / last252.length
  const variance = last252.reduce((a, b) => a + (b - mean) ** 2, 0) / last252.length
  const sd = Math.sqrt(variance) * Math.sqrt(30)
  const mean30 = mean * 30
  if (sd === 0) return 0
  return (last30 - mean30) / sd
}

/** Clamp to [min, max]. */
export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x))
}
