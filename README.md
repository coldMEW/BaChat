# Bachat

**Bachat** (Nepali: *"saving"*) is a privacy-first personal finance app that truly understands you — not just your numbers. It learns your lifestyle, spots impulse spending before it drains your wallet, and shows you exactly how to redirect that money into investments that grow. No bank logins, no data syncing, no servers. Everything stays local, entirely in your browser.

> **Your money. Your data. Your browser. No compromises.**

---

## What Bachat does

| Section | What you get |
|---|---|
| **Dashboard** | Upload a bank statement or receipt (PDF, CSV, image). Bachat extracts every transaction automatically and shows your spending heatmap, cashflow chart, impulse score, and a plain-English breakdown of your habits. |
| **Budgeting** | A 37-point Pulse score across four dimensions — needs, wants, savings, and credit health. Personalized suggestions ranked by impact. Impulse transaction flagging with recovery potential. A decision simulator that shows you the exact effect of a purchase before you make it. |
| **Invest** | Add your holdings. Get a Directional Score (−100 to +100) blending technical indicators, news sentiment, analyst consensus, and macroeconomic signals — across 7-day, 30-day, and 90-day horizons. Diversification analysis with a correlation matrix and rebalance suggestions. |
| **Settings** | Configure your financial profile (credit score, savings, debt) used to personalise your Pulse score. Reset or clear local data at any time. |

---

## Features at a glance

- **100% local & private** — all your data lives in your browser's IndexedDB. Nothing is ever uploaded, stored, or shared. No account needed.
- **Understands your lifestyle** — Bachat doesn't just categorise transactions. It learns your spending patterns, habits, and tendencies to give you advice that actually fits how you live.
- **Impulse spending detection** — identifies emotional and discretionary purchases, quantifies exactly how much they cost your financial health, and shows you the recovery potential if you redirect them.
- **Redirect impulse → investment** — see precisely how money wasted on impulse buys could grow as investments. Bachat connects the dots between your daily habits and your long-term wealth.
- **Decision simulator** — before you spend, type the purchase (e.g. "Buy a new laptop for $1,200") and see projected changes to your Pulse score, credit, savings, and debt in real time.
- **Universal statement parser** — drop a PDF, CSV, or photo of any bank statement from any bank in the world. Transactions are extracted and categorised automatically.
- **Receipt scanning** — photograph a receipt and have it added as a transaction instantly.
- **Directional Score (DPS)** — a signed confidence-weighted investment signal across 4 families: technical (RSI, MACD, SMA), sentiment (news analysis), analyst (consensus + price targets), and macro (Fed rate, CPI, DXY).
- **Knowledge graph** — visualises correlations between your holdings.
- **Diversification engine** — computes HHI, sector concentration, asset-class entropy and suggests rebalancing moves.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Local database | Dexie.js (IndexedDB) |
| Charts | TradingView `lightweight-charts` |
| Document processing | Anthropic API |
| Stock/ETF prices | Twelve Data |
| News + analyst data | Finnhub |
| Crypto prices | CoinGecko |
| Macro data | FRED (St. Louis Fed) |

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js 18 or later** — download from [nodejs.org](https://nodejs.org). To check your version:
  ```bash
  node --version
  ```
- **npm** — comes with Node.js. To check:
  ```bash
  npm --version
  ```
- **Git** — download from [git-scm.com](https://git-scm.com)

---

## Step 1 — Clone the repository

```bash
git clone https://github.com/coldMEW/BaChat.git
cd BaChat/bachat
```

> All commands from here forward are run from inside the `bachat/` directory (the Next.js app folder).

---

## Step 2 — Install dependencies

```bash
npm install
```

This installs everything in `package.json`. It will take a minute the first time.

---

## Step 3 — Get your API keys

Bachat needs five API keys. Follow each section below to get them. All of them have free tiers that are more than enough for personal use.

---

### 3a. Anthropic API key *(required)*

Used for: extracting transactions from uploaded PDFs, images, and CSV files; analysing your spending patterns; generating the financial commentary on your dashboard.

1. Go to [console.anthropic.com](https://console.anthropic.com) and create a free account.
2. Once logged in, click **API Keys** in the left sidebar.
3. Click **Create Key**, give it a name (e.g. `bachat-local`), and copy the key — it starts with `sk-ant-`.
4. Anthropic charges per use. For personal daily use the cost is typically a few cents per month. You can set a spending limit under **Billing → Usage Limits**.

Your key will look like:
```
sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 3b. Twelve Data API key *(required)*

Used for: real-time and historical stock, ETF, and crypto price data (OHLC charts, quotes, symbol search).

1. Go to [twelvedata.com](https://twelvedata.com) and click **Get free API key**.
2. Sign up with your email and verify it.
3. Go to **Dashboard → API Keys** and copy your key.
4. The free tier gives you **800 API calls per day** and **8 per minute** — enough for personal use.

Your key will look like:
```
a1b2c3d4e5f6789012345678901234ab
```

---

### 3c. Finnhub API key *(required)*

Used for: company news, analyst recommendations, price targets, peer companies, and earnings calendars.

1. Go to [finnhub.io](https://finnhub.io) and click **Get free API token**.
2. Sign up and verify your email.
3. Your API key is shown immediately on the dashboard. Copy it.
4. The free tier gives you **60 API calls per minute** with no daily cap.

Your key will look like:
```
ct1abc2def3ghi4jkl5mno6pqr7stu8v
```

---

### 3d. FRED API key *(required)*

Used for: macroeconomic data — Federal Reserve interest rate, CPI inflation, and US Dollar Index. This powers the macro signal in the Directional Score.

1. Go to [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html)
2. Click **Request API Key** and fill in the short form.
3. Check your email — the key arrives within a few minutes.
4. **FRED is completely free** with no rate limits for normal usage.

Your key will look like:
```
abcdef1234567890abcdef1234567890
```

---

### 3e. CoinGecko API key *(optional)*

Used for: crypto price charts and peer coin discovery for holdings like BTC, ETH, SOL. The app works without this key at reduced crypto chart quality.

1. Go to [coingecko.com/en/api](https://www.coingecko.com/en/api) and click **Get Your API Key Now**.
2. Sign up and verify your email.
3. Under **Developer Dashboard**, copy your **Demo API key**.
4. The demo tier gives you **30 calls per minute** for free.

Your key will look like:
```
CG-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 4 — Create your `.env.local` file

Inside the `bachat/` folder, create a file called `.env.local`:

```bash
# On Mac/Linux:
touch .env.local

# On Windows (Command Prompt):
type nul > .env.local

# On Windows (PowerShell):
New-Item .env.local
```

Open `.env.local` in any text editor and paste the following, replacing each value with your actual key:

```env
# Document processing — get from console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Stock & ETF price data — get from twelvedata.com
TWELVEDATA_API_KEY=your-key-here

# News, analyst data, peers — get from finnhub.io
FINNHUB_API_KEY=your-key-here

# Macroeconomic data (free) — get from fred.stlouisfed.org
FRED_API_KEY=your-key-here

# Crypto data (optional) — get from coingecko.com
COINGECKO_API_KEY=your-key-here
```

> **Important:** `.env.local` is listed in `.gitignore` and will never be committed. Never share this file or push it to a public repository.

---

## Step 5 — Run the app

```bash
npm run dev
```

Open your browser and go to:
```
http://localhost:3000
```

You will be redirected to the Dashboard automatically. Demo data is seeded on the first load so every feature is visible immediately — no upload required to explore the app.

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server at `localhost:3000` with hot-reload |
| `npm run build` | Build the optimised production bundle |
| `npm run start` | Start the production server (requires `npm run build` first) |
| `npm run lint` | Run ESLint across all source files |

---

## Navigating the app

Once the app is running, use the sidebar on the left to navigate:

| Icon | Page | What to do there |
|---|---|---|
| Grid | **Dashboard** | See your spending overview. Click the purple upload button at the top of the sidebar to import a real bank statement. |
| Clock | **Budgeting** | View your 37-point Pulse score, impulse analysis, and personalised suggestions. Use the Simulator tab to test a purchase. |
| Bars | **Invest** | Add stock/ETF/crypto holdings. Switch between Analysis and Network tabs for signals and correlation graphs. |
| Gear | **Settings** | Enter your credit score, savings, and debt to personalise your Pulse score. Reset demo data here. |

### Uploading a statement

Click the **purple upload button** at the top of the sidebar from any page. Supported formats:

- **CSV** — export from your bank's online portal ("Download transactions as CSV")
- **PDF** — your monthly bank statement PDF
- **JPG / PNG / WEBP** — a photo or screenshot of a receipt or transaction list

After upload you will see a preview of extracted transactions. Review them, then click **Confirm Import** to save them to your local database.

---

## Project structure

```
bachat/
├── app/
│   ├── api/
│   │   ├── dashboard/
│   │   │   ├── analyze/      ← spending pattern analysis
│   │   │   ├── extract/      ← statement + receipt parsing
│   │   │   └── roast/        ← plain-English habit summary
│   │   └── invest/
│   │       ├── prices/       ← OHLC data (Twelve Data / CoinGecko)
│   │       ├── news/         ← headlines + sentiment (Finnhub)
│   │       ├── analyst/      ← recommendations + price targets
│   │       ├── peers/        ← peer companies / coins
│   │       ├── macro/        ← Fed rate, CPI, DXY (FRED)
│   │       ├── predict/      ← Directional Score composer
│   │       └── portfolio-analysis/  ← diversification engine
│   ├── budget/               ← Budgeting page
│   ├── dashboard/            ← Dashboard page
│   ├── invest/               ← Invest hub + per-symbol deep-dive
│   ├── settings/             ← Settings page
│   ├── layout.tsx            ← Root layout
│   └── page.tsx              ← Redirects to /dashboard
│
├── components/
│   ├── budget/               ← Score overview, simulator, impulse breakdown
│   ├── dashboard/            ← Heatmap, cashflow chart, upload zone
│   └── invest/               ← Charts, sidebar, analyst panel, etc.
│
├── lib/
│   ├── budget/               ← Score engine, suggestion engine, simulator
│   ├── dashboard/            ← Statement parser, impulse analyser, merchant lookup
│   └── invest/               ← Finnhub, Twelve Data, CoinGecko, FRED clients
│
├── types/
│   └── index.ts              ← All shared TypeScript types
│
├── .env.local                ← Your API keys (git-ignored, create this yourself)
├── .gitignore
└── package.json
```

---

## Data privacy

- **No account required** — the app works entirely offline after the initial page load.
- **No tracking** — there are no analytics, session recording tools, or telemetry of any kind.
- **Local-only storage** — all your transactions and financial profile are stored in your browser's IndexedDB. Clearing your browser data deletes everything. Use **Settings → Clear all data** for a clean wipe from within the app.
- **API calls are server-side** — when you upload a statement, the file content is sent to the Next.js API routes running on your own machine (`localhost`). It is not stored anywhere server-side.

---

## Troubleshooting

**The app shows no data / blank charts**
Make sure all required API keys are set in `.env.local` and restart the dev server (`Ctrl+C`, then `npm run dev`). Environment variables are only read at startup.

**"API key not set" error in the browser console**
One or more keys in `.env.local` are missing or misspelled. Check the variable names match exactly (they are case-sensitive).

**Upload returns an error**
Ensure `ANTHROPIC_API_KEY` is valid and your Anthropic account has a positive credit balance. Check [console.anthropic.com/settings/billing](https://console.anthropic.com/settings/billing).

**Stock charts are empty**
Your `TWELVEDATA_API_KEY` may have hit the daily limit (800 calls/day on the free tier). The limit resets at midnight UTC. You can check usage at [twelvedata.com/usage](https://twelvedata.com/usage).

**Crypto charts are empty**
Add your `COINGECKO_API_KEY` to `.env.local`. Without it the app falls back to unauthenticated requests which are rate-limited more aggressively.

---

## License

All rights reserved. Contact the team for reuse enquiries.
