// ================================================================
// Token-bucket rate limiter — per-API, per-process
// ================================================================
// Each API gets its own bucket. `acquire()` waits for a token.

interface Bucket {
  capacity: number
  refillPerSec: number
  tokens: number
  last: number
}

const buckets = new Map<string, Bucket>()

export function createBucket(name: string, capacity: number, perMinute: number): void {
  buckets.set(name, {
    capacity,
    refillPerSec: perMinute / 60,
    tokens: capacity,
    last: Date.now(),
  })
}

function refill(b: Bucket) {
  const now = Date.now()
  const elapsed = (now - b.last) / 1000
  b.tokens = Math.min(b.capacity, b.tokens + elapsed * b.refillPerSec)
  b.last = now
}

export async function acquire(name: string, cost = 1): Promise<void> {
  const b = buckets.get(name)
  if (!b) throw new Error(`Rate-limit bucket "${name}" not registered`)
  while (true) {
    refill(b)
    if (b.tokens >= cost) {
      b.tokens -= cost
      return
    }
    const deficit = cost - b.tokens
    const waitMs = Math.max(50, (deficit / b.refillPerSec) * 1000)
    await new Promise((r) => setTimeout(r, waitMs))
  }
}

// Register bucket defaults — matches free-tier limits.
// These are safe on cold module load (idempotent).
if (!buckets.has('twelvedata'))    createBucket('twelvedata', 8, 7)    // 7/min to stay under 8
if (!buckets.has('finnhub'))       createBucket('finnhub', 60, 55)     // 55/min under 60
if (!buckets.has('coingecko'))     createBucket('coingecko', 30, 25)   // 25/min (with demo key)
if (!buckets.has('fred'))          createBucket('fred', 100, 100)      // effectively unmetered
if (!buckets.has('anthropic'))     createBucket('anthropic', 50, 50)   // generous
if (!buckets.has('anthropic-vision')) createBucket('anthropic-vision', 10, 8) // conservative for Vision
