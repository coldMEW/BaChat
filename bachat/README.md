# Bachat — Invest module (real build)

The first Bachat module promoted out of the `/mockup/` folder into a real Next.js 16 app.

## What's here

- **Candlestick charts** (TradingView `lightweight-charts`) for every holding · range tabs 1M / 3M / 6M / 1Y / 5Y
- **Directional Score (DPS)** — a signed −100…+100 score with confidence %, blending 4 signal families:
  - **Technical** (RSI, MACD cross, vs 50/200-day SMA, 30d momentum z-score)
  - **Sentiment** (Claude classifies Finnhub headlines into `{stance, conviction}`; recency + source-weighted)
  - **Analyst** (Finnhub recommendation buckets + price targets + recent upgrades/downgrades)
  - **Macro** (FRED Fed rate, CPI trend, dollar index — sector-sensitive matrix)
- **Multi-horizon predictions** — 7d / 30d / 90d tabs, each re-weighting the 4 families
- **Diversification engine** — correlation matrix · HHI · sector concentration · asset-class entropy → 0-100 score with per-driver breakdown + up to 3 math-backed rebalance suggestions
- **Per-symbol deep dive** — chart + DPS + news timeline with sentiment chips + analyst consensus + peer strip
- **Crypto support** via CoinGecko (BTC, ETH, SOL, AVAX, etc.)

## Stack

Next.js 16 App Router · TypeScript (strict) · Tailwind v4 · Dexie (IndexedDB for per-user holdings) · Anthropic Claude (structured-JSON sentiment classifier only) · TradingView `lightweight-charts`.

## APIs (all free tier)

| API | Free limit | Used for |
|---|---|---|
| Twelve Data | 800/day · 8/min | Equity + ETF + crypto OHLC, quotes, symbol search |
| Finnhub | 60/min | News, peers, analyst consensus, earnings, company profile |
| CoinGecko (demo key) | 30/min | Crypto peers by category |
| FRED | unlimited | Fed rate, CPI, dollar index |
| Anthropic | pay-as-go | Sentiment classification only |

## Running it

```bash
cd bachat
npm run dev
# open http://localhost:3000  →  click through to /invest
```

The Invest page auto-seeds demo holdings (NVDA, AAPL, VTI, BTC/USD) on first load so you see live data immediately. Add/remove from the Holdings tab.

Env vars live in `bachat/.env.local` (git-ignored). Copy `bachat/.env.example` to `.env.local` and fill in.

## Routes

```
/                                             home (links to /invest)
/invest                                        hub (Holdings / Analysis / Network tabs)
/invest/[symbol]                               per-stock research deep-dive

/api/invest/prices/[symbol]                    daily OHLC (Twelve Data / CoinGecko)
/api/invest/news/[symbol]                      Finnhub news + Claude sentiment
/api/invest/analyst/[symbol]                   Finnhub recommendations + targets
/api/invest/peers/[symbol]                     Finnhub peers (equities) / CoinGecko category (crypto)
/api/invest/macro                              FRED macro snapshot
/api/invest/predict/[symbol]?horizon=7d|30d|90d  DirectionalPrediction composer
/api/invest/portfolio-analysis                 POST holdings → diversification analysis
```

## Anti-slop guarantees

- Every DPS driver row shows `dataSource` and `asOf` — no number without attribution.
- Claude never writes freeform directional prose. Its only output is structured JSON (`{stance, conviction}` per headline), schema-validated with Zod. Invalid JSON → retry once → fall back to neutral (sentiment contribution = 0).
- Confidence drops automatically when signals diverge, volatility is high, or news is sparse.
- Disclaimer pinned near every Directional Score: *"Model estimate from 4 signal families. Not financial advice. Past signals do not guarantee future returns."*

## Shape of DPS output

```ts
{
  symbol: "NVDA",
  horizon: "30d",
  dps: 23.4,                            // -100..+100
  direction: "bullish",
  confidence: 67,                       // 30..85
  drivers: [
    { family: "technical", label: "RSI 42 — neutral",                        contribution: 4, dataSource: "Twelve Data · RSI(14)",              asOf: "..." },
    { family: "sentiment", label: "8 bullish, 3 bearish articles past 14d",  contribution: 7, dataSource: "Finnhub · Claude classifier",        asOf: "..." },
    { family: "analyst",   label: "42 analysts · target $180 (+12%)",        contribution: 8, dataSource: "Finnhub /stock/recommendation",      asOf: "..." },
    { family: "macro",     label: "Fed pausing · CPI decelerating",          contribution: 4, dataSource: "FRED · Fed rate, CPI, DXY",          asOf: "..." },
  ],
  riskFlags: [{ code: "EARNINGS_SOON", label: "Earnings in 18 days" }],
  disclaimer: "Model estimate from 4 signal families. Not financial advice..."
}
```

## What's next (out of scope for this v1)

- Supabase Auth (currently uses hardcoded `demo-user` in Dexie)
- Knowledge Graph v2 (correlation-weighted edges, click-to-expand) — mockup reference at `/mockup/invest.html`
- Macro scenario buttons + earnings-history panel on the research page
- Pre-fetched demo fixtures for rate-limit survival during demos
- Vercel deploy with env vars in dashboard
