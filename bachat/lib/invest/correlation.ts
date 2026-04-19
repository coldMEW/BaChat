// ================================================================
// Correlation & portfolio math — pure functions
// ================================================================

/** Daily log returns from a series of closes. Length = closes.length - 1. */
export function dailyReturns(closes: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < closes.length; i++) {
    out.push(Math.log(closes[i] / closes[i - 1]))
  }
  return out
}

/** Pearson correlation coefficient for two equal-length series. */
export function pearson(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  const n = a.length
  let sumA = 0
  let sumB = 0
  for (let i = 0; i < n; i++) {
    sumA += a[i]
    sumB += b[i]
  }
  const meanA = sumA / n
  const meanB = sumB / n
  let num = 0
  let denA = 0
  let denB = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA
    const db = b[i] - meanB
    num += da * db
    denA += da * da
    denB += db * db
  }
  if (denA === 0 || denB === 0) return 0
  return num / Math.sqrt(denA * denB)
}

/** Full N×N Pearson correlation matrix across a list of equal-length series. */
export function correlationMatrix(series: number[][]): number[][] {
  const n = series.length
  const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    m[i][i] = 1
    for (let j = i + 1; j < n; j++) {
      const rho = pearson(series[i], series[j])
      m[i][j] = rho
      m[j][i] = rho
    }
  }
  return m
}

/** Average off-diagonal correlation. */
export function avgOffDiagCorrelation(matrix: number[][]): number {
  const n = matrix.length
  if (n < 2) return 0
  let sum = 0
  let count = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      sum += matrix[i][j]
      count++
    }
  }
  return count === 0 ? 0 : sum / count
}

/** Herfindahl concentration index on weights (already summing to 1). */
export function hhi(weights: number[]): number {
  return weights.reduce((a, w) => a + w * w, 0)
}

/** Normalized Shannon entropy of a weights distribution, 0..1. 1 = most diverse. */
export function normalizedEntropy(weights: number[]): number {
  const n = weights.length
  if (n <= 1) return 0
  let h = 0
  for (const w of weights) {
    if (w > 0) h -= w * Math.log(w)
  }
  return h / Math.log(n)
}

/** Variance of a weighted portfolio given a covariance matrix. */
export function portfolioVariance(weights: number[], covMatrix: number[][]): number {
  const n = weights.length
  let variance = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * covMatrix[i][j]
    }
  }
  return variance
}

/** Build a covariance matrix from N series of equal-length daily returns. */
export function covarianceMatrix(series: number[][]): number[][] {
  const n = series.length
  const len = series[0]?.length ?? 0
  const means = series.map((s) => s.reduce((a, b) => a + b, 0) / len)
  const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let cov = 0
      for (let k = 0; k < len; k++) {
        cov += (series[i][k] - means[i]) * (series[j][k] - means[j])
      }
      cov /= len
      m[i][j] = cov
      m[j][i] = cov
    }
  }
  return m
}

/** Marginal contribution of holding `i` to total portfolio variance.
 *  MCV_i = w_i * (Σ_j w_j * cov[i][j]).  Larger = bigger diversification drag. */
export function marginalVarianceContribution(weights: number[], covMatrix: number[][]): number[] {
  const n = weights.length
  const mcv: number[] = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let sum = 0
    for (let j = 0; j < n; j++) sum += weights[j] * covMatrix[i][j]
    mcv[i] = weights[i] * sum
  }
  return mcv
}

/** Very rough expected Sharpe from daily returns (annualized). */
export function roughSharpe(returns: number[], riskFreeDaily = 0): number {
  if (returns.length === 0) return 0
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length - riskFreeDaily
  const variance =
    returns.reduce((a, b) => a + (b - mean - riskFreeDaily) ** 2, 0) / returns.length
  const sd = Math.sqrt(variance)
  if (sd === 0) return 0
  return (mean / sd) * Math.sqrt(252)
}
