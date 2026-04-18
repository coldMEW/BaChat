# Bachat

**Bachat** (Nepali: "saving") is a privacy-first behavioral finance web app. It reads your bank statements, explains *why* you spend the way you do using clinical behavioral economics, and helps you catch yourself before you repeat the pattern. It also reviews your investment holdings retrospectively — telling you what drove past moves without ever predicting the future.

Your financial data never leaves your browser.

---

## The problem with every other finance app

Mint, YNAB, Copilot, Monarch, Cleo — every one of them is a bookkeeping tool. They sort what you spent into categories and show you charts. That's accounting, not behavior change.

People don't overspend because they lack data. They overspend because of present bias, ego depletion, loss aversion, optimism bias — forty years of Nobel-winning behavioral economics that consumer finance apps have never applied. Bachat is the first that does.

---

## Features

### 1. Universal Statement Parser
Drop a PDF bank statement or a screenshot of any payment notification. Claude extracts every transaction automatically — no bank login, no OAuth, no Plaid. Works with statements from anywhere in the world, any currency.

### 2. Spending DNA
After 5+ transactions, Claude analyzes your behavioral patterns and generates a clinical profile: your dominant archetype (Stress Spender, Night Owl Splurger, Subscription Hoarder, etc.), your primary cognitive bias, and the causal chain (TRIGGER → BEHAVIOR → CONSEQUENCE) that explains your pattern. Streamed token-by-token so you watch the reasoning happen.

### 3. Regret Predictor
Pre-purchase intervention. Type in what you're about to buy → Claude returns a 0-100 regret probability score calibrated to *your* past behavior. Shows similar past purchases, which of your patterns it activates, a loss-framed translation ("this is 1.8 hours of your work time"), and alternatives.

### 4. Future Simulator
Projects your financial future using loss framing (Kahneman 1979 — losses feel ~2x more intense than equivalent gains). Leads with "days until your balance hits zero" rather than a cheerful savings goal. Shows income-vs-spend over your chosen period (weekly / biweekly / monthly toggle).

### 5. Investment Review
Add your stock holdings. Bachat pulls historical prices and — for any move you want explained — asks Claude to reconstruct the most likely drivers using publicly available information. Clearly separates *verified events* (earnings, Fed decisions) from *pattern-matching inference* (sector rotation). **Never predicts future prices. Never recommends buy/sell.** That's the anti-slop guardrail.

### 6. Honest Check-in
A weekly behavioral roast with care. Every line references real merchants and real numbers from your data. Plain English, no jargon. Punches the pattern, not the person. Ends with what a friend who actually cares would say next. Downloadable share card.

---

## Why this is different

| Every other app | Bachat |
|---|---|
| Pie charts of spending categories | Cognitive biases named and explained |
| "You spent $X on food" | "You order DoorDash 11 times/month, always 9–11 PM, costing you $280/month" |
| Requires bank login (Plaid) | Upload a PDF. Done. |
| Generic "save 20% more" tips | Intervention before the purchase happens |
| Cloud-stored financial data | IndexedDB in your browser. Always. |
| Stock price predictions (astrology) | Retrospective explanations (honest) |

---

## Privacy architecture

- **Authentication:** email/password or Google, via Supabase Auth. Stores your email + hashed password + a user ID. Nothing else.
- **Financial data:** transactions, DNA profile, predictions, holdings — all in **IndexedDB** in your browser, keyed by your user ID. Never transmitted to Supabase.
- **AI calls:** your transaction data is sent to Anthropic's Claude API only for analysis, never stored server-side. PDFs are parsed in-memory and discarded.
- **Cross-device:** export/import JSON from Settings to move data manually. Encrypted cloud sync is post-hackathon.

---

## Tech stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Fonts:** Lora (headings), Geist Sans (body), Geist Mono (numbers)
- **Auth:** Supabase Auth (identity only)
- **Local data:** Dexie.js over IndexedDB
- **AI:** Anthropic Claude `claude-sonnet-4-20250514` with streaming
- **PDF:** `pdf-parse` (server-side, in-memory)
- **Charts:** Recharts (time-series only — no category pie charts)
- **Stocks:** Alpha Vantage free tier
- **Deploy:** Vercel

---

## Theme — "Saffron on Slate"

A deliberate departure from mint-green-on-black fintech convention.

- Base: warm slate `#0A0E14`
- Cards: `#111720`, border `#1C2430`
- Text: warm ivory `#F5EFE4` primary, `#94A3B8` secondary
- Primary accent: saffron `#F59E0B` — a cultural nod to the Nepali name, and a break from cold corporate fintech
- Success: jade `#10B981` (gains, savings)
- Danger: muted crimson `#EF4444` (losses, warnings)

---

## Status

Built in 48 hours by a team of 4 for a hackathon. See `docs/TEAMMATES.md` for team credits and architecture details.
