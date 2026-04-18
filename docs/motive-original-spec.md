# Motive — CODING AGENT MASTER PROMPT
## Complete Build Guide for Claude Code / Lovable / Cursor

---

> **How to use this document:**
> Read every section before writing a single line of code. This document makes decisions for you so you don't waste time guessing. Follow the opinions. They are not suggestions — they are the result of deep thinking about what wins a hackathon with these specific judging criteria. When you finish reading, you will know exactly what to build, why, how, and what to never touch.

---

## PART 0: UNDERSTAND WHAT YOU ARE ACTUALLY BUILDING

Before you touch code, understand the thesis. Everything in this project flows from one insight:

**The insight:** Every personal finance app ever built — Mint, YNAB, Copilot, Monarch, Cleo — is fundamentally an accounting tool. They track what you spent, sort it into categories, and show you charts. That is bookkeeping. It is not behavior change.

The problem people have with money is not that they lack data. They know they're overspending. They just keep doing it anyway. That is a behavioral problem, not an information problem. Behavioral economists have studied this for 40+ years. Daniel Kahneman won the 2002 Nobel Prize in Economics for mapping exactly how and why humans make irrational financial decisions. Richard Thaler won in 2017 for showing how to fix it. Their work — Present Bias, Loss Aversion, Ego Depletion, Optimism Bias, Nudge Theory — has never been applied in a consumer finance product.

**Motive is that product.**

Motive is not a budgeting app. It is the first behavioral finance AI — a system that uses clinical behavioral economics to diagnose why you spend the way you do, then intervenes before you repeat the pattern.

The word "Motive" means savings in multiple South Asian languages. The name is global in spirit — savings is a concept every human understands regardless of where they live.

**This matters for the pitch:** You are not saying "we made a better Mint." You are saying "we made the first finance app that treats money problems as the behavior problems they actually are." That is a different category. That is a defensible startup.

---

## PART 1: THE JUDGING CRITERIA — REVERSE-ENGINEER EVERY DECISION

The judges score across 5 dimensions. Every feature, every design choice, every sentence of the pitch should earn points in at least one dimension. Here is how Motive scores across all five:

### 1. Technical Execution & Functionality (30%)
This is the biggest category. Judges reward **working demos over polished slides**. This means:
- The app must actually work end-to-end during the demo, no errors, no loading skeletons
- Claude AI must respond in real-time with streaming output — judges feel the technology
- PDF parsing must work with real bank statements — bring 3 real PDFs to test before demo
- The behavioral DNA generation must be visible and impressive, not a spinner that returns a paragraph
- The regret predictor needs to show a score, not just text — make it visual

**Technical credibility signals to build in:**
- Streaming AI responses (SSE/streaming, not waiting for full response)
- Real-time transaction count updating as PDF processes
- Mobile-responsive — judges will pull out their phones
- Sub-2-second UI interactions (optimistic updates)
- No console errors, no broken UI states

### 2. Problem Clarity & Solution Fit (20%)
The problem must be felt by the judge personally. Money stress is universal. Every judge in the room:
- Has overspent on food delivery
- Has a subscription they forgot about
- Has said "I'll save next month" and didn't

Your pitch frame: "You've used a budgeting app. You stopped using it. Here's why that's not your fault — and what actually works."

Solution fit: Every feature maps directly to a named, researched cognitive bias. This is not generic "AI insights" — this is named behavioral science applied to real data.

### 3. Market Viability & Financial Logic (20%)
You need real numbers ready:
- $1.5B personal finance software market (Verified Market Research, 2024)
- 130M+ millennials and Gen Z in the US who have tried and abandoned budgeting apps
- Mint had 25M users before shutdown — they had the users but never the behavioral layer
- Cleo (closest competitor) is valued at $500M with 7M users and only has shallow AI chat
- Business model: freemium → Pro at $9/month → B2B for financial therapists and coaches

The gap is clear: the market is proven (Mint/YNAB proved it), the incumbent solutions are all accounting tools (the pivot is untouched), and behavioral science as a moat is genuinely defensible.

### 4. Impact & Growth Potential (20%)
Scale argument:
- Works for any human with a bank account in any country — the problem (ego depletion, present bias) is identical in Austin and Amsterdam
- The behavioral DNA profile compounds — more data = more accurate = harder to leave (data flywheel)
- Roast Mode is designed for social sharing — free distribution baked into the product
- Potential expansion: financial therapists use it with clients, employers offer it as a wellness benefit

### 5. Presentation & Professionalism (10%)
The demo is the pitch. The app should look like a Series A company built it, not a hackathon project. Invest in design. Use the dark theme specified in this document. Every transition should feel intentional.

---

## PART 2: THE FEATURES — WHAT TO BUILD

### Feature 1: Universal Statement Parser (The Entry Point)
**What it is:** User uploads a PDF bank statement OR a screenshot of any payment notification. AI extracts every transaction automatically. Zero manual entry, zero bank login.

**Why it works technically:** Claude claude-sonnet-4-20250514 with Vision can read any bank statement format. A Chase PDF and a Barclays PDF and a Revolut CSV all contain the same information in different formats — the model handles all of them without custom parsers per bank.

**Why it is strategically important:** The biggest friction in every finance app is onboarding. Bank OAuth (Plaid) takes 5–10 minutes and requires trusting the app with bank credentials. PDF upload takes 30 seconds and requires trusting nothing. This is the reason users will actually try it during the demo.

**What to implement:**
- Drag-and-drop zone accepting PDF files up to 25MB
- Image upload (PNG, JPG, WebP) for screenshots
- Progress indicator during parsing with real-time status messages ("Reading statement...", "Extracting transactions...", "Categorizing...")
- Parsed transactions displayed immediately with ability to edit before saving
- Auto-detection of currency, bank name, and statement period
- Support for multi-currency (USD, EUR, GBP, CAD, AUD, INR, etc.)

**What NOT to implement:**
- Plaid bank account linking — adds complexity, requires approval, creates trust barrier, and is US-only. You have 48 hours. Skip it.
- CSV import — PDF is more universal and impressive. CSV is Excel energy. Drop it.
- Manual transaction entry form — defeats the frictionless promise. One optional "Add manually" button is fine but do not build a full form UI.

---

### Feature 2: Spending DNA (The Core Differentiator)
**What it is:** After the user has at least 5 transactions, Claude analyzes the behavioral and psychological patterns in their spending and generates a behavioral profile. Not categories. Not totals. A clinical behavioral diagnosis.

**This is what no other app does.** Mint tells you "you spent $400 on restaurants." Spending DNA tells you "you are a Stress Spender — 64% of your food delivery orders happen between 9–11PM on weekdays, which is precisely when ego depletion peaks and impulse control is lowest. This pattern costs you an estimated $280/month more than your daytime ordering."

**The archetypes to implement:**
```
1. Stress Spender         — spends when cognitively/emotionally depleted
2. FOMO Buyer             — concentrated, reactive spending after social exposure
3. Comfort Consumer       — consistent emotional-category spending (food, entertainment)
4. Night Owl Splurger     — disproportionate late-night transaction clustering
5. Social Validation Shopper — status/appearance category dominance
6. Subscription Hoarder   — accumulating recurring charges, never auditing
7. Payday Implosion        — dramatic spending spike in first 3 days after income
8. Boredom Spender         — high frequency, small amount, scattered categories
9. Avoidance Spender       — spending as procrastination or emotional avoidance
```

**The cognitive biases to identify:**
```
1. Present Bias            — overweighting immediate reward vs. future cost
2. Loss Aversion (inverted) — spending to avoid feeling deprived
3. Ego Depletion           — making worse decisions after mentally exhausting activities
4. Optimism Bias           — consistently underestimating future spending
5. Social Proof            — spending influenced by perceived social norms
6. Anchoring               — first price seen distorts all subsequent value judgments
7. Sunk Cost Fallacy       — continuing patterns due to past investment
```

**What to implement:**
- A full-screen "DNA card" with archetype name, emoji, and color identity
- Animated reveal sequence — bias by bias, not all at once (creates drama in demo)
- The causal chain displayed prominently: TRIGGER → BEHAVIOR → CONSEQUENCE
- A "Behavioral Patterns" section listing 3–4 specific patterns with real numbers
- A "Regenerate" button that re-runs analysis as new transactions are added
- Lock state: show a teaser with "Upload your statement to unlock your DNA"

**Why streaming matters here:** Stream the DNA response token by token from Claude. The judge watches the behavioral analysis appear in real time. This demonstrates the AI is actually doing something — not just returning cached text. It is technically impressive and creates a natural moment in the demo.

---

### Feature 3: Regret Predictor (The Intervention Layer)
**What it is:** A pre-purchase check. User types in "I'm about to buy [thing] for $X" and the AI calculates a 0–100 regret probability score based on their specific behavioral pattern history.

**Why this matters behaviorally:** Research shows that a brief mandatory pause before a purchase reduces impulse buying by 30–40%. The pause is the product. The score is the conversation starter. Knowing your regret probability, calibrated to your own past behavior, creates a cognitive interruption that generic budgeting apps cannot replicate.

**Why no other app does this:** Regret prediction requires two things: a user's behavioral DNA profile AND their transaction history. You need both to generate a calibrated prediction. Motive has both after onboarding. No competitor has either.

**What to implement:**
- Simple 3-field form: merchant name, category dropdown, amount
- A circular score visualization (0–100, color coded: green < 30, yellow 30–60, red > 60)
- Below the score: "Similar past purchases: 7 | Regretted: 5"
- Pattern match: "This activates your [Ego Depletion] pattern — you make these purchases after [late evenings]"
- Loss frame: "At this frequency, this category costs you $X/year. That's [Y hours of your work time]."
- Two alternatives and one "cooling off" suggestion specific to their pattern
- A verdict: "High Regret Risk" / "Probably Fine" / "Treat Yourself"

**What NOT to implement:**
- Feedback loop (asking user to rate if they regretted it later) — great idea, wrong time. Post-hackathon. Skip.
- Push notifications — requires app, out of scope for a web hackathon demo

---

### Feature 4: Future Regret Simulator (The Loss Frame)
**What it is:** AI projects the user's financial future at current spending rates. Displayed using loss framing — the psychologically proven way to motivate behavior change. Not "you'll save $200 if you cut back." But "at this rate, you will run out of money 9 days before your next paycheck."

**The behavioral science:** Loss aversion (Kahneman & Tversky, 1979) proves that humans feel losses approximately 2x more intensely than equivalent gains. Showing someone what they WILL LOSE is dramatically more motivating than showing what they could gain. Every finance app frames positively. Motive deliberately frames negatively. This is not pessimism — it is the correct application of 40 years of research.

**What to implement:**
- Top stat: "[X] days until your balance hits zero" (if applicable) — big, red, visible
- Monthly burn rate vs income as a percentage bar
- Top drain category with monthly amount
- Yearly projection: "You are on track to spend $[X] this year" — then translate: "That's a [MacBook Pro / trip to Europe / 3 months of rent] you're not saving"
- Goal input: let user type a goal ("New laptop — $1,499") and show "At current rate, you'll reach this in [X] months. Cut your top category 20% and it's [Y] months."
- Three specific, actionable cuts with estimated monthly savings
- A "verdict" sentence — make it uncomfortable but not cruel

**The single most important display decision:** The "days until zero" number should be the first thing users see. Full width. Large font. No chart. No explanation above it. The number IS the explanation.

---

### Feature 5: Reality Check / Roast Mode (The Viral Hook)
**What it is:** A brutally honest, funny, shareable summary of the user's financial behavior. Think: what would your most financially literate friend say if they had access to your bank statements and zero tact?

**Why this matters for growth:** This feature is engineered for social sharing. The user screenshots it and posts it. Every post is free distribution. This is the same mechanic that made Spotify Wrapped a $0 marketing channel that generates millions of organic posts every year. Cleo proved this works in fintech — their roast mode drove massive organic growth. Motive's version is smarter because it's calibrated to behavioral science, not just sarcasm.

**What to implement:**
- A spending grade: A through F with +/- (e.g., "D+", "C-", "F")
- A title: funny, specific to their data (e.g., "DoorDash's Most Loyal Unpaid Employee")
- 4 roast lines — each referencing a real merchant or real number from their data
- The "most absurd stat" — the single most shocking number translated into something relatable
- A redemption note — one kind, specific observation that ends the roast with hope
- A share caption they'd actually want to post
- Share button: Web Share API (iOS/Android native share) with clipboard fallback
- Download as image: html2canvas or canvas API to create a shareable card image

**Design directive for this screen:** Dark background, large grade in a contrasting color, roast lines appear one by one with a short animation delay. The grade should be bigger than anything else on the screen. It should feel like getting a report card.

---

## PART 3: FEATURES TO EXPLICITLY SKIP (AND WHY)

Read this section carefully. Every hour you spend on these is an hour stolen from the 5 core features above.

**❌ Stock market tracking**
Why skip: Completely different product. If a judge asks "is this a spending app or an investing app?" you've lost the pitch. Pick one thesis. Spending DNA is your thesis. Investments have nothing to do with behavioral spending patterns. Cut it completely.

**❌ Bank OAuth / Plaid integration**
Why skip: 3–5 days of setup, requires Plaid production approval (not granted in 48 hours), US-bank-only, massive trust barrier for users, and adds zero behavioral intelligence. The PDF parser is better in every way for this hackathon.

**❌ Budget setting and tracking**
Why skip: YNAB does this. Every finance app does this. Showing a budget bar is exactly the "pie chart energy" you are trying to escape. Your story is behavioral diagnosis, not budget tracking. The moment you add a budget bar, you look like every other app.

**❌ Weekly tips / financial advice**
Why skip: Fortune cookie content. Nobody reads it. It signals you ran out of real features. It is the thing every mediocre finance app adds when they have nothing else to say.

**❌ Social features (compare to friends)**
Why skip: Chicken-and-egg problem with no users. Requires significant data privacy consideration. Cannot demo effectively. Save for Series A.

**❌ Gamification (badges, streaks, XP)**
Why skip: Patronizing. The target user is a stressed adult trying to change their behavior, not a child who needs a gold star. The behavioral science approach is more respectful and more effective.

**❌ Data visualizations (pie charts, bar charts, line graphs)**
Why skip: This is the single thing every competitor already does. If your app has a pie chart showing food/transport/shopping, a judge will immediately categorize you with Mint. You are specifically trying to be different from Mint. The only exception is the burn rate progress bar in the simulator, which is functional, not decorative.

---

## PART 4: TECH STACK DECISIONS

Every decision below has a reason. Read the reasoning — it will help you make good sub-decisions when you hit edge cases.

---

### Frontend Framework: Next.js 14 with App Router

**Use this. Do not debate it.**

Why Next.js 14 App Router specifically:
- Server Components mean behavioral analysis happens server-side — no API key exposure to client
- API routes eliminate the need for a separate backend — single repository, single deploy
- Streaming support is built-in via `ReadableStream` — this is required for the live DNA reveal
- Vercel deployment is one click with zero config for Next.js projects

**Why not Vite + React SPA:**
A pure SPA requires a separate backend (Express/FastAPI) to hold API keys securely. Two repositories, two deploys, two potential failure points during demo. You do not have time for this. Next.js keeps everything in one place.

**Why not Remix:**
Excellent framework, but smaller ecosystem, fewer shadcn/ui examples, and your team probably knows Next.js better. Not the time to learn a new router paradigm.

**Why not Lovable specifically:**
Lovable is excellent for rapid prototyping but generates client-side code that would expose your Anthropic API key. If using Lovable, you must add a serverless function layer (Supabase Edge Functions or Vercel Functions) to proxy all AI calls. Factor this in. If using Claude Code directly, Next.js App Router is cleaner.

---

### Styling: Tailwind CSS v3 + shadcn/ui

**Use this. Do not debate it.**

Why Tailwind:
- Fastest way to build custom UI without writing CSS files
- No stylesheet management overhead
- Works perfectly with shadcn/ui components

Why shadcn/ui:
- Copy-paste components with zero dependency weight
- Fully customizable — not a component library you are locked into
- Accessible by default (ARIA roles, keyboard nav)
- Works with the dark theme you will be using

**What to customize from shadcn defaults:**
- Change the default radius to `0.75rem` (more modern)
- Use the Zinc color palette as base
- Override the primary color to `emerald-400` (#34D399) — this is the Motive accent color

**Typography — use Geist font:**
```
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
```
Geist is Vercel's font. It is modern, technical, and free. It signals "serious tech product" without being generic like Inter.

**Design direction: Dark-first, minimal, data-forward**
- Background: `#080808` (not pure black — slightly warm)
- Cards: `#111111` with `#1F1F1F` border
- Primary accent: `#34D399` (emerald green — money, growth)
- Danger/warning: `#F87171` (red — regret, losses)
- Text primary: `#FAFAFA`
- Text secondary: `#71717A`

Why dark theme: Finance apps are used when people are anxious about money. Dark, calm, minimal design reduces cognitive load. It also looks significantly more impressive than a white app in a demo room.

---

### Database: Supabase (PostgreSQL + Auth + Storage)

**Use this. Do not debate it.**

Why Supabase over Firebase:
- PostgreSQL is real SQL — you can write complex queries for behavioral analysis
- Built-in Row Level Security — user data is isolated without app-level logic
- Storage bucket for PDFs and screenshots — everything in one place
- Auth has Google OAuth built in — no Passport.js, no sessions, no cookies (mostly)
- Free tier is generous: 500MB database, 1GB storage, 50K monthly active users

Why not PlanetScale / Neon / Turso:
All great options. Supabase wins because it bundles database + auth + storage + edge functions in one platform. For a 48-hour hackathon, reducing the number of platforms you manage is worth the tradeoff.

Why not Firebase:
NoSQL means you cannot write the aggregation queries needed for behavioral pattern analysis. You need SQL JOIN and GROUP BY. Firebase cannot do this natively.

**Critical Supabase setup steps to do FIRST:**
1. Create project
2. Run the full SQL schema (provided in Part 7)
3. Enable Google OAuth in Authentication settings
4. Create `statements` storage bucket with RLS policies
5. Copy the URL and anon key to `.env.local`
Do these before writing any application code or you will be blocked.

---

### AI: Anthropic Claude claude-sonnet-4-20250514

**Use this model specifically. Do not use anything else.**

Why Claude over GPT-4o:
- Claude claude-sonnet-4-20250514 has demonstrated superior performance on nuanced psychological reasoning tasks — critical for behavioral pattern detection
- Claude's context window handles large PDFs more reliably
- The structured JSON output from Claude is more consistent — fewer parse failures in production
- For a hackathon using Claude as the AI, using Claude's own model is on-brand

Why claude-sonnet-4-20250514 over claude-opus-4-6:
- Sonnet is 3–5x faster for the same quality on these tasks
- Cost is meaningfully lower — important if you demo multiple times
- For behavioral analysis at this scope, Sonnet is not a downgrade from Opus

Why claude-sonnet-4-20250514 over Haiku:
- Haiku struggles with complex JSON generation and nuanced behavioral reasoning
- The DNA prompt is complex — Haiku will return generic analysis. Sonnet returns specific, calibrated insights.

**Use streaming for the DNA reveal:**
```typescript
const stream = await anthropic.messages.stream({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2048,
  messages: [{ role: 'user', content: prompt }],
})

// Stream to client via Server-Sent Events
for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    controller.enqueue(encoder.encode(`data: ${chunk.delta.text}\n\n`))
  }
}
```
This is technically impressive and creates a natural "wow" moment during demo.

---

### PDF Parsing: pdf-parse + Claude

**The two-step approach:**
1. `pdf-parse` extracts raw text from the PDF on the server (Node.js)
2. Claude reads the extracted text and returns structured transaction JSON

Why not send the PDF directly to Claude Vision:
PDF Vision support in Claude is less reliable than text extraction for structured financial data. The text extraction path is faster, cheaper, and produces more consistent results.

Why not use a third-party PDF-to-data service (Docparser, Extracta.ai):
These require API keys, have rate limits, cost money, and add latency. `pdf-parse` is free, runs locally, and is a single npm install.

```bash
pnpm add pdf-parse
pnpm add -D @types/pdf-parse
```

---

### File Uploads: react-dropzone

Clean, accessible, customizable. One npm install.

```bash
pnpm add react-dropzone
```

Do not build a custom drag-and-drop from scratch. react-dropzone handles all edge cases (mobile, accessibility, file validation) that you would spend 3 hours debugging.

---

### Deployment: Vercel

One command: `vercel --prod`. Environment variables added via dashboard. Preview URLs for every commit. Free tier handles demo traffic easily. Do not overthink this.

---

### What You Do NOT Need

**No Redis / caching layer:** Supabase PostgreSQL handles your query volume easily. Add caching post-hackathon.

**No message queue:** Your async jobs (PDF parsing) complete fast enough for synchronous HTTP requests.

**No Docker:** Vercel handles containerization. Running Docker locally during a hackathon is asking for permission errors at 2AM.

**No GraphQL:** REST API routes in Next.js are sufficient. GraphQL adds a schema layer you do not need.

**No external analytics (Mixpanel, Amplitude):** Not needed for demo. Add post-launch.

---

## PART 5: ARCHITECTURE — HOW EVERYTHING CONNECTS

```
User Browser
     │
     │ HTTPS
     ▼
Next.js App (Vercel)
     │
     ├── /api/parse-pdf         → pdf-parse → Claude API → Supabase INSERT
     ├── /api/parse-screenshot  → Claude Vision API → Supabase INSERT
     ├── /api/spending-dna      → Supabase SELECT → Claude API (streaming) → Supabase UPSERT
     ├── /api/regret-predict    → Supabase SELECT → Claude API → Supabase INSERT
     ├── /api/simulate          → Supabase SELECT → Claude API → response
     └── /api/roast             → Supabase SELECT → Claude API → Supabase INSERT
          │
          ├── Supabase Auth    (Google OAuth + JWT)
          ├── Supabase DB      (PostgreSQL, row-level security)
          └── Supabase Storage (PDF + screenshot files)
```

**Data flow for the most important feature (Spending DNA):**

```
1. User clicks "Generate My DNA"
2. Browser → POST /api/spending-dna
3. Server verifies JWT (Supabase auth)
4. Server queries last 60 days of transactions from Supabase
5. Server builds behavioral analysis prompt with transaction data
6. Server opens streaming connection to Claude claude-sonnet-4-20250514
7. Server streams Claude's response to browser via Server-Sent Events
8. Browser renders DNA card token by token as response arrives
9. When complete, server parses full JSON and upserts to spending_dna table
10. Browser displays final polished DNA card
```

---

## PART 6: PROJECT FILE STRUCTURE

```
Motive/
├── app/
│   ├── layout.tsx                    ← Root layout, Geist font, dark bg
│   ├── page.tsx                      ← Marketing/landing page
│   ├── (auth)/
│   │   ├── login/page.tsx            ← Login form + Google OAuth button
│   │   └── signup/page.tsx           ← Signup form + Google OAuth button
│   └── (app)/
│       ├── layout.tsx                ← App shell: sidebar + top nav
│       ├── dashboard/page.tsx        ← Overview: recent transactions + stat cards
│       ├── upload/page.tsx           ← PDF + screenshot upload interface
│       ├── dna/page.tsx              ← Spending DNA reveal page
│       ├── predict/page.tsx          ← Regret predictor form + result
│       ├── simulate/page.tsx         ← Future simulator + goal input
│       └── roast/page.tsx            ← Reality check + share card
│
├── app/api/
│   ├── parse-pdf/route.ts            ← POST: PDF upload → transactions
│   ├── parse-screenshot/route.ts     ← POST: image upload → transaction
│   ├── spending-dna/
│   │   └── route.ts                  ← GET: fetch DNA | POST: generate DNA (streaming)
│   ├── regret-predict/route.ts       ← POST: merchant+amount → prediction
│   ├── simulate/route.ts             ← POST: goal → simulation result
│   └── roast/route.ts                ← POST: generate roast
│
├── components/
│   ├── ui/                           ← shadcn/ui components (auto-generated)
│   ├── upload/
│   │   ├── pdf-drop-zone.tsx         ← Drag-drop PDF upload with progress
│   │   └── screenshot-upload.tsx     ← Image upload with camera option
│   ├── dna/
│   │   ├── dna-reveal-stream.tsx     ← Streaming DNA display component
│   │   ├── archetype-card.tsx        ← Big archetype display card
│   │   ├── bias-indicator.tsx        ← Visual bias meter
│   │   └── pattern-list.tsx          ← Behavioral patterns list
│   ├── simulator/
│   │   ├── burn-meter.tsx            ← Burn rate visual
│   │   └── goal-form.tsx             ← Goal input form
│   ├── roast/
│   │   ├── roast-reveal.tsx          ← Animated roast display
│   │   ├── grade-badge.tsx           ← Large grade display
│   │   └── share-card.tsx            ← Shareable image card
│   ├── transaction-list.tsx          ← List of parsed transactions
│   ├── transaction-card.tsx          ← Single transaction display
│   └── nav-sidebar.tsx               ← App navigation sidebar
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 ← Browser client
│   │   └── server.ts                 ← Server client
│   ├── anthropic.ts                  ← Client + model constant + safeParseJSON
│   ├── prompts.ts                    ← ALL AI prompts — the core IP
│   ├── pdf-utils.ts                  ← PDF extraction + text cleaning
│   └── utils.ts                      ← cn(), formatCurrency(), formatDate()
│
├── types/index.ts                    ← All TypeScript types
├── middleware.ts                     ← Auth protection
├── .env.local                        ← API keys (never commit)
└── package.json
```

---

## PART 7: DATABASE SCHEMA

Run this SQL in Supabase SQL Editor. Run it all at once. Do not run it in pieces.

```sql
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── PROFILES ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id             uuid references auth.users(id) on delete cascade primary key,
  email          text unique not null,
  full_name      text,
  avatar_url     text,
  currency_code  text    not null default 'USD',
  currency_symbol text   not null default '$',
  monthly_income numeric(12,2) default 0,
  created_at     timestamptz default now()
);

-- ── TRANSACTIONS ──────────────────────────────────────────────────────────────
create table public.transactions (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  amount           numeric(12,2) not null check (amount > 0),
  merchant         text not null,
  category         text not null,
  description      text,
  transaction_date timestamptz not null,
  source           text not null check (source in ('pdf','screenshot','manual')),
  raw_text         text,
  file_url         text,
  currency_code    text not null default 'USD',
  -- Computed columns for behavioral analysis (auto-maintained by Postgres)
  hour_of_day   int  generated always as (extract(hour  from transaction_date)::int) stored,
  day_of_week   int  generated always as (extract(dow   from transaction_date)::int) stored,
  day_of_month  int  generated always as (extract(day   from transaction_date)::int) stored,
  is_weekend    bool generated always as (extract(dow   from transaction_date) in (0,6)) stored,
  is_late_night bool generated always as (
    extract(hour from transaction_date) >= 21 or
    extract(hour from transaction_date) <= 3
  ) stored,
  created_at timestamptz default now()
);

-- Index for fast behavioral queries
create index idx_transactions_user_date on public.transactions (user_id, transaction_date desc);
create index idx_transactions_category  on public.transactions (user_id, category);
create index idx_transactions_hour      on public.transactions (user_id, hour_of_day);

-- ── SPENDING DNA ──────────────────────────────────────────────────────────────
create table public.spending_dna (
  id                        uuid default uuid_generate_v4() primary key,
  user_id                   uuid references public.profiles(id) on delete cascade unique not null,
  archetype                 text not null,
  archetype_description     text not null,
  primary_bias              text not null,
  primary_bias_explanation  text not null,
  emotional_trigger         text not null,
  peak_spending_time        text,
  behavioral_patterns       jsonb not null default '[]',
  causal_chain              text not null,
  honest_summary            text not null,
  transaction_count         int  not null,
  data_range_days           int  not null,
  generated_at              timestamptz default now()
);

-- ── REGRET PREDICTIONS ────────────────────────────────────────────────────────
create table public.regret_predictions (
  id                uuid default uuid_generate_v4() primary key,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  merchant          text not null,
  category          text not null,
  amount            numeric(12,2) not null,
  prediction_score  int  not null check (prediction_score between 0 and 100),
  reasoning         text not null,
  similar_past_count int,
  verdict           text,
  created_at        timestamptz default now()
);

-- ── ROASTS ───────────────────────────────────────────────────────────────────
create table public.roasts (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  roast_data   jsonb not null,
  share_token  text unique default encode(gen_random_bytes(8), 'hex'),
  created_at   timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.transactions      enable row level security;
alter table public.spending_dna      enable row level security;
alter table public.regret_predictions enable row level security;
alter table public.roasts            enable row level security;

create policy "own_profile"      on public.profiles         for all using (auth.uid() = id);
create policy "own_transactions" on public.transactions      for all using (auth.uid() = user_id);
create policy "own_dna"          on public.spending_dna      for all using (auth.uid() = user_id);
create policy "own_predictions"  on public.regret_predictions for all using (auth.uid() = user_id);
create policy "own_roasts"       on public.roasts            for all using (auth.uid() = user_id);
create policy "shared_roast"     on public.roasts            for select using (true);

-- ── AUTO-CREATE PROFILE ───────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── STORAGE ───────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('statements', 'statements', false);

create policy "upload_own"   on storage.objects for insert
  with check (bucket_id = 'statements' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "read_own"     on storage.objects for select
  using (bucket_id = 'statements' and auth.uid()::text = (storage.foldername(name))[1]);
```

---

## PART 8: ALL AI PROMPTS

These prompts are the product. They encode the behavioral economics framework. Do not simplify them to save tokens. The specificity is what makes the output impressive.

### PROMPT A — Universal PDF Parser

```typescript
export const PDF_PARSER_SYSTEM = `You are a financial data extraction system. You receive raw text from bank statements and return structured transaction data as JSON.

Extract ONLY outgoing/debit transactions (money the user spent). Skip all income, deposits, refunds, and credits.

Clean merchant names: "AMZN*MKTP US*AB123" → "Amazon". "SQ *BLUE BOTTLE" → "Blue Bottle Coffee". "UBER* TRIP" → "Uber".

Categories:
- food_dining: restaurants, cafes, food delivery apps (DoorDash, Uber Eats, Grubhub, Instacart)
- shopping: Amazon, retail, clothing, electronics, department stores
- transport: Uber, Lyft, gas stations, parking, toll, subway/transit
- entertainment: streaming (Netflix, Spotify, Hulu), movies, games, concerts
- groceries: Whole Foods, Trader Joe's, Kroger, Safeway, Costco, any supermarket
- utilities: electric, gas, water, internet, phone bill, insurance premium
- health: pharmacy, gym, doctor, dentist, therapy
- travel: hotels, Airbnb, flights, vacation spending
- subscriptions: recurring SaaS, software, membership fees
- transfers: Venmo, Zelle, PayPal, CashApp, bank transfers
- other: anything else

Return ONLY this exact JSON structure, no markdown, no explanation:
{
  "transactions": [
    {
      "amount": <positive number>,
      "merchant": "<cleaned name>",
      "category": "<category from list>",
      "description": "<brief description of what this likely was>",
      "transaction_date": "<ISO 8601 date>",
      "currency_code": "<ISO 4217 code>"
    }
  ],
  "detected_currency": "<primary currency>",
  "detected_bank": "<bank name or Unknown Bank>",
  "statement_period": "<human readable period>",
  "total_transactions": <count>
}`

export const PDF_PARSER_USER = (statementText: string) =>
  `Extract all debit/spending transactions from this bank statement:\n\n${statementText}`
```

### PROMPT B — Screenshot Parser (Vision)

```typescript
export const SCREENSHOT_PARSER = `Extract the payment transaction from this image. It may be a banking notification, payment app screenshot, receipt, or any payment confirmation from anywhere in the world.

Return ONLY valid JSON:
{
  "amount": <positive number, no currency symbols>,
  "merchant": "<cleaned merchant name>",
  "category": "<food_dining|shopping|transport|entertainment|groceries|utilities|health|travel|subscriptions|transfers|other>",
  "description": "<brief description>",
  "transaction_date": "<ISO 8601, use today if not visible>",
  "currency_code": "<ISO 4217 code, USD if unknown>",
  "confidence": "<high|medium|low>"
}

If no clear payment amount is visible: {"error": "No transaction found", "confidence": "low"}
Return ONLY JSON.`
```

### PROMPT C — Spending DNA (Behavioral Profile)

```typescript
export const buildDNAPrompt = (transactions: any[], profile: any) => {
  const spend = transactions.reduce((s: number, t: any) => s + t.amount, 0)
  const avg = spend / transactions.length
  const late = transactions.filter((t: any) => t.is_late_night).length
  const weekend = transactions.filter((t: any) => t.is_weekend).length

  return `You are a behavioral economist and financial psychologist with deep knowledge of Kahneman's cognitive biases, Thaler's nudge theory, and ego depletion research.

Analyze this spending data to generate a BEHAVIORAL profile — not an accounting summary. Your job is to find the psychological patterns, not the category totals.

TRANSACTION DATA (${transactions.length} transactions):
${JSON.stringify(transactions.slice(0, 80), null, 2)}

KEY STATISTICS:
- Total spend: ${profile.currency_symbol || '$'}${spend.toFixed(2)}
- Average transaction: ${profile.currency_symbol || '$'}${avg.toFixed(2)}  
- Late-night transactions (9PM–3AM): ${late} of ${transactions.length} (${Math.round(late/transactions.length*100)}%)
- Weekend transactions: ${weekend} of ${transactions.length} (${Math.round(weekend/transactions.length*100)}%)
- Monthly income: ${profile.monthly_income ? profile.currency_symbol + profile.monthly_income : 'not provided'}

AVAILABLE ARCHETYPES (choose the closest fit):
"Stress Spender" | "FOMO Buyer" | "Comfort Consumer" | "Night Owl Splurger" |
"Social Validation Shopper" | "Subscription Hoarder" | "Payday Implosion" |
"Boredom Spender" | "Avoidance Spender"

AVAILABLE COGNITIVE BIASES (identify the dominant one):
"Present Bias" | "Loss Aversion (inverted)" | "Ego Depletion" | "Optimism Bias" |
"Social Proof" | "Anchoring" | "Sunk Cost Fallacy"

CRITICAL INSTRUCTIONS:
- Use REAL NUMBERS from their data. "You spend $240/month on food delivery" not "you spend a lot on food"
- The causal_chain must follow: [emotional state / trigger] → [specific behavior] → [financial consequence with number]
- behavioral_patterns must reference actual merchants or time patterns from the data
- honest_summary should read like a wise, direct friend — not a financial advisor or a chatbot
- Be specific enough that a different user's data would produce a noticeably different profile

Return ONLY this JSON, no markdown:
{
  "archetype": "<archetype name>",
  "archetype_description": "<2-3 direct sentences about this person's spending personality using their data. Uncomfortable but not cruel.>",
  "primary_bias": "<bias name>",
  "primary_bias_explanation": "<1-2 sentences: exactly how this bias appears in their specific transaction data, with real numbers>",
  "emotional_trigger": "<the single most specific trigger — time-based, event-based, or emotional>",
  "peak_spending_time": "<derived from data — e.g. 'Friday 9–11PM' or 'First 3 days of month'>",
  "behavioral_patterns": [
    {
      "name": "<pattern name>",
      "description": "<1 sentence with real numbers from their data>",
      "frequency": "<how often>",
      "bias_at_play": "<which bias>",
      "monthly_cost": <estimated monthly impact as a number>
    }
  ],
  "causal_chain": "<The single most powerful insight: trigger → behavior → consequence chain. Use their real data. Must be specific, not generic.>",
  "honest_summary": "<2-3 sentences of blunt truth. End with ONE specific, small, actionable thing they could change.>"
}`
}
```

### PROMPT D — Regret Predictor

```typescript
export const buildRegretPrompt = (
  purchase: { merchant: string; category: string; amount: number },
  history: any[],
  dna: any
) => `You are a behavioral finance decision support system. A user is considering a purchase. Assess their regret probability based on their specific behavioral history.

PROPOSED PURCHASE:
- Merchant: ${purchase.merchant}
- Category: ${purchase.category}  
- Amount: $${purchase.amount}

USER BEHAVIORAL PROFILE:
- Archetype: ${dna?.archetype || 'Unknown'}
- Primary Bias: ${dna?.primary_bias || 'Unknown'}
- Main Trigger: ${dna?.emotional_trigger || 'Unknown'}
- Peak Spending Time: ${dna?.peak_spending_time || 'Unknown'}
- Causal Pattern: ${dna?.causal_chain || 'Not available'}

RECENT HISTORY IN THIS CATEGORY:
${JSON.stringify(history.filter((t: any) => t.category === purchase.category).slice(0, 8), null, 2)}

Current time context: ${new Date().toLocaleString('en-US', { weekday: 'long', hour: 'numeric', hour12: true })}

Return ONLY this JSON:
{
  "prediction_score": <0-100 integer — regret probability>,
  "confidence": "<high|medium|low>",
  "reasoning": "<2-3 sentences. Reference their actual pattern history. Not generic.>",
  "similar_past_purchases": <integer>,
  "pattern_match": "<which of their behavioral patterns this activates>",
  "loss_frame": "<translate this into work time or an emotional equivalent — e.g. 'This is 1.8 hours of your work time' or 'At this frequency you spend $X/year on this category'>",
  "alternatives": ["<specific alternative 1>", "<specific alternative 2>"],
  "cooling_off": "<one specific tactic calibrated to their pattern — not generic advice>",
  "verdict": "<High Regret Risk | Probably Fine | Your Call | Treat Yourself>"
}`
```

### PROMPT E — Future Simulator

```typescript
export const buildSimulatorPrompt = (
  transactions: any[],
  profile: any,
  goal: { name: string; amount: number } | null
) => {
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - today.getDate()
  const totalSpend = transactions.reduce((s: number, t: any) => s + t.amount, 0)
  
  return `You are a financial projection engine using loss-framed behavioral economics.

IMPORTANT: Frame all findings using LOSS FRAMING — show what the user will lose or miss, not what they could gain. This is psychologically more effective (Kahneman 1979).

USER DATA:
- Monthly income: ${profile.currency_symbol}${profile.monthly_income || 0}
- Days left this month: ${daysLeft} of ${daysInMonth}
- Currency: ${profile.currency_code}
- Goal: ${goal ? `${goal.name} (${profile.currency_symbol}${goal.amount})` : 'None set'}

LAST 30 DAYS TRANSACTIONS:
${JSON.stringify(transactions, null, 2)}

Total in data: ${profile.currency_symbol}${totalSpend.toFixed(2)} over ${transactions.length} transactions

Return ONLY this JSON:
{
  "days_until_zero": <integer | null — days until balance reaches zero given income. null if they're spending less than income>,
  "projected_month_end_balance": <number>,
  "monthly_burn_rate": <number — calculated monthly spend>,
  "burn_rate_vs_income_pct": <number | null>,
  "top_drain": {
    "category": "<category>",
    "amount": <monthly amount>,
    "pct_of_spend": <percentage>
  },
  "yearly_projection": <current monthly burn * 12>,
  "loss_frame_comparison": "<translate yearly_projection into something viscerally relatable. Examples: 'That is enough for a 10-day trip to Japan', 'That is a new car down payment', 'That is 1,100 hours of your work time at US average wage'. Make it something REAL that a young adult would actually want.>",
  "if_cut_20pct": "<specific: 'Cutting [top category] 20% saves $X/month — $Y extra over 6 months'>",
  "goal_delay_days": <integer | null — extra days to reach goal at current rate>,
  "verdict": "<one sentence, loss-framed, uncomfortable but not mean>",
  "actionable_cuts": [
    { "action": "<specific cut — name the merchant or behavior>", "monthly_saving": <number> },
    { "action": "<specific>", "monthly_saving": <number> },
    { "action": "<specific>", "monthly_saving": <number> }
  ]
}`
}
```

### PROMPT F — Roast Mode

```typescript
export const buildRoastPrompt = (
  transactions: any[],
  dna: any,
  currencySymbol: string
) => {
  const total = transactions.reduce((s: number, t: any) => s + t.amount, 0)
  const topMerchants = Object.entries(
    transactions.reduce((acc: any, t: any) => {
      acc[t.merchant] = (acc[t.merchant] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)
  ).sort((a: any, b: any) => (b[1] as number) - (a[1] as number)).slice(0, 5)

  return `You are the Motive Reality Check engine. Your job: generate a brutally honest, funny, SHAREABLE assessment of this person's spending behavior. 

Think of it as: a best friend who studied behavioral economics, has seen your bank statements, and has decided today is the day to say what everyone else is thinking.

THEIR BEHAVIORAL PROFILE:
- Archetype: ${dna?.archetype || 'Unanalyzed Spender'}
- Primary Bias: ${dna?.primary_bias || 'Unknown'}
- Dominant Trigger: ${dna?.emotional_trigger || 'Unknown'}
- Causal Pattern: ${dna?.causal_chain || 'Not available'}

SPENDING DATA (30 DAYS):
- Total: ${currencySymbol}${total.toFixed(2)}
- Transactions: ${transactions.length}
- Top merchants: ${topMerchants.map((m: any) => `${m[0]} (${currencySymbol}${(m[1] as number).toFixed(0)})`).join(', ')}

SAMPLE TRANSACTIONS:
${JSON.stringify(transactions.slice(0, 12), null, 2)}

ROAST RULES:
1. Every roast line must reference a REAL number or REAL merchant from their data
2. Punch the behavior pattern, never the person — they're not bad, they're human
3. Reference the behavioral science (bias) without using jargon — explain it simply and mockingly
4. roast_lines[3] is the kill shot — the most uncomfortable true thing about their pattern
5. The redemption_note must be genuinely kind — end with real hope
6. share_caption must be something a 25-year-old would actually post on Instagram or X

Return ONLY this JSON, no markdown:
{
  "spending_grade": "<A|B|C|D|F with +/-, e.g. D+, C-, F>",
  "title": "<funny 3-5 word title for their spending archetype — e.g. 'DoorDash\\'s Unpaid Loyalist', 'Sponsored by Amazon', 'Subscribed to Everything, Using Nothing'>",
  "roast_lines": [
    "<roast 1 — reference a real merchant and real number>",
    "<roast 2 — name their cognitive bias in plain English without using the word 'cognitive'>",
    "<roast 3 — translate spending into absurd real-world equivalent>",
    "<roast 4 — the kill shot, their single most egregious documented pattern>"
  ],
  "most_absurd_stat": "<the single most shocking true statement from their data — framed to be screenshot-worthy>",
  "redemption_note": "<1-2 genuinely kind sentences — one real thing they did right, or one small change that would fix everything. End on hope.>",
  "share_caption": "<a one-liner for social media — self-aware, funny, includes their grade. Something people actually post.>"
}`
}
```

---

## PART 9: CRITICAL IMPLEMENTATION DETAILS

### Streaming the DNA reveal
This is the single most technically impressive moment. Implement it correctly.

In your API route:
```typescript
// app/api/spending-dna/route.ts
export async function POST(req: NextRequest) {
  // ... auth check, data fetch ...

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const anthropicStream = await anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })

      let fullText = ''
      for await (const chunk of anthropicStream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullText += chunk.delta.text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
        }
      }

      // Parse and save to DB after stream completes
      try {
        const dnaData = safeParseJSON(fullText)
        await supabase.from('spending_dna').upsert({ user_id: user.id, ...dnaData, ... })
      } catch (e) { /* handle parse error */ }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

In your React component:
```typescript
// components/dna/dna-reveal-stream.tsx
const generateDNA = async () => {
  setStatus('generating')
  setStreamedText('')

  const res = await fetch('/api/spending-dna', { method: 'POST' })
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value)
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') { setStatus('complete'); break }
        try {
          const { text } = JSON.parse(data)
          setStreamedText(prev => prev + text)
        } catch {}
      }
    }
  }
}
```

### Error handling for AI JSON responses
Claude occasionally wraps responses in markdown despite being told not to. Always use a safe parser:

```typescript
export function safeParseJSON(text: string): any {
  const cleaned = text
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/im, '')
    .trim()
  return JSON.parse(cleaned)
}
```

### PDF text truncation
Large PDFs can exceed Claude's context window. Truncate intelligently:

```typescript
export function prepareStatementText(rawText: string, maxChars = 75000): string {
  const cleaned = rawText.replace(/\s+/g, ' ').replace(/[^\x20-\x7E\n]/g, '').trim()
  if (cleaned.length <= maxChars) return cleaned
  // Keep beginning (account info) + end (recent transactions) — both are valuable
  const keep = Math.floor(maxChars / 2)
  return cleaned.slice(0, keep) + '\n[...truncated...]\n' + cleaned.slice(-keep)
}
```

### Currency symbol mapping
```typescript
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'CA$', AUD: 'A$',
  CHF: 'Fr', CNY: '¥', INR: '₹', MXN: '$', BRL: 'R$', KRW: '₩',
  SGD: 'S$', HKD: 'HK$', NOK: 'kr', SEK: 'kr', DKK: 'kr',
  NZD: 'NZ$', ZAR: 'R', TRY: '₺', RUB: '₽', AED: 'د.إ',
}
```

### Optimistic UI for transaction saves
When a screenshot is parsed, show the result immediately while saving to DB in the background. The user should see their transaction added to the list before the database write completes.

---

## PART 10: DESIGN SYSTEM

### Colors (CSS variables in globals.css)
```css
:root {
  --bg-base: #080808;
  --bg-card: #111111;
  --bg-card-hover: #161616;
  --border: #1F1F1F;
  --border-active: #2D2D2D;
  --text-primary: #FAFAFA;
  --text-secondary: #71717A;
  --text-muted: #3F3F46;
  --accent-green: #34D399;
  --accent-green-muted: rgba(52, 211, 153, 0.1);
  --accent-red: #F87171;
  --accent-red-muted: rgba(248, 113, 113, 0.1);
  --accent-amber: #FBBF24;
  --accent-amber-muted: rgba(251, 191, 36, 0.1);
}
```

### Typography rules
- Display / hero text: Geist Sans, weight 800, tracking-tighter
- Body: Geist Sans, weight 400, leading-relaxed
- Numbers / data: Geist Mono (monospace makes numbers feel precise)
- Labels / metadata: weight 500, uppercase, tracking-widest, text-secondary

### Component patterns to use consistently

**Stat card:**
```
bg-card + border + rounded-xl + p-6
Label: text-xs uppercase tracking-widest text-secondary
Value: text-3xl font-black font-mono
```

**Section header:**
```
text-xs uppercase tracking-widest text-muted + mb-4
NO large H2 headers inside the app — keep it data-forward
```

**Button primary:**
```
bg-accent-green text-black font-semibold rounded-xl
hover: brightness-110
active: scale-95
```

**Transaction item:**
```
flex items-center justify-between
bg-card border rounded-xl p-4
Merchant: text-sm font-medium text-primary
Meta: text-xs text-secondary
Amount: font-mono text-sm text-primary
```

### Animation principles
- Use `transition-all duration-200` on interactive elements
- DNA reveal: each section fades in with `animate-in fade-in slide-in-from-bottom-2`
- Grade reveal (roast): scale from 0 to 1 with `animate-in zoom-in-50 duration-500`
- Page transitions: `animate-in fade-in duration-300`

---

## PART 11: NAVIGATION STRUCTURE

The app has 5 sections. The sidebar must make the flow feel like a journey, not a menu.

```
● Dashboard      — your numbers at a glance
● Upload         — add your bank statement
● Spending DNA   — your behavioral profile (locked until 5+ transactions)
● Predict        — will you regret this? (locked until DNA generated)
● Simulate       — your financial future
● Reality Check  — roast mode (locked until 5+ transactions)
```

Show lock states clearly. A greyed-out nav item with "Upload a statement to unlock" is not a frustrating gate — it is a progress indicator that shows users where they're headed. The locks create a natural product tour.

---

## PART 12: LANDING PAGE REQUIREMENTS

The landing page must do one job: make someone who has never heard of behavioral finance understand in 10 seconds why Motive is different from every app they've abandoned.

**Hero headline direction:**
Do NOT say "AI-powered finance app" — every app says this.
Do NOT say "understand your spending" — every app says this.
DO say something that implies the competitor insight: "Your budgeting app shows you charts. Motive shows you why you keep ignoring them."

**Key sections in order:**
1. Hero — headline + subheadline + single CTA ("Upload your first statement →")
2. The Nobel Prize callout — brief, establishes credibility ("Built on 40 years of behavioral economics research")
3. The 4 features — with a visual for each, emphasizing what's NEW about each
4. Competitor contrast — a simple table: "What every other app does" vs "What Motive does"
5. Social proof placeholder — "Join X people who finally understand their spending" (use a dummy number)
6. Final CTA

**The competitor contrast table:**

| Every other app | Motive |
|---|---|
| Shows you pie charts | Shows you cognitive biases |
| Tells you what you spent | Explains why you spent it |
| Requires bank login | Needs only a PDF upload |
| Generic financial tips | Behavioral interventions |
| You know everything already | You learn something new |

---

## PART 13: DEMO PREPARATION

The demo is a judged performance. Prepare it like one.

### Pre-load real data
Before the hackathon demo, create a test account and upload a real 90-day PDF bank statement (your own, a friend's, or a realistic synthetic one). The behavioral DNA needs enough data to be specific and surprising. A 5-transaction profile is not impressive. A 60-transaction profile that surfaces a real pattern ("you ordered Chipotle 11 times this month, always between 9-11PM") is the demo moment.

### The 3-minute demo script

**:00** — Open landing page, read the hero headline out loud. "This is what we're building and why it's different from every finance app that already exists."

**:25** — Navigate to Upload. Drop in the pre-prepared PDF. Watch transactions appear. "No bank login. No OAuth. Upload a file. Works with any bank in any country."

**:50** — Navigate to Spending DNA. Click Generate. Let the streaming response play out — do not skip it. "Watch Claude analyze the behavioral patterns in real time." When it completes, read the causal chain out loud. "That specific sentence — trigger to behavior to consequence — is what no other app produces."

**:1:30** — Navigate to Regret Predictor. Type in a realistic purchase ("DoorDash, $35"). Show the score (make sure it's high for demo effect — test with your data first). Read the cooling-off suggestion. "This is a pre-purchase intervention. The pause is the product."

**:2:00** — Navigate to Simulate. Click generate. Point to the "days until zero" number. Read the loss_frame_comparison. "That number is why people actually change behavior — loss framing, not charts."

**:2:20** — Navigate to Reality Check. Click Roast Me. Let the grade appear dramatically. Read two roast lines. Show the share button. "This is designed to be posted. Free distribution built into the product."

**:2:45** — Close: "Mint, YNAB, Copilot — $1.5 billion market, all built on the same accounting model that hasn't changed behavior for 20 years. Motive is the first product built on the actual science of why people are bad with money. We're not making a better budgeting app. We're making budgeting apps obsolete."

---

## PART 14: INSTALLATION COMMANDS

Run these in exact order:

```bash
# 1. Create Next.js project
npx create-next-app@14 Motive \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --import-alias "@/*" \
  --no-src-dir
cd Motive

# 2. Install core dependencies
pnpm add \
  @anthropic-ai/sdk \
  @supabase/ssr \
  @supabase/supabase-js \
  react-dropzone \
  pdf-parse \
  lucide-react \
  class-variance-authority \
  clsx \
  tailwind-merge \
  tailwindcss-animate \
  geist

pnpm add -D @types/pdf-parse

# 3. Install shadcn/ui
npx shadcn@latest init
# → Style: Default
# → Base color: Zinc  
# → CSS variables: Yes

npx shadcn@latest add \
  button card input label \
  tabs toast dialog badge \
  progress separator tooltip \
  dropdown-menu avatar

# 4. Set environment variables
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# 5. Run dev server
pnpm dev
```

---

## PART 15: ENVIRONMENT SETUP CHECKLIST

```
□ Supabase project created at supabase.com
□ Full SQL schema from Part 7 executed in Supabase SQL Editor
□ 'statements' storage bucket created
□ All storage RLS policies applied
□ Google OAuth enabled in Supabase → Auth → Providers
□ Redirect URL added: http://localhost:3000/auth/callback
□ Anthropic API key obtained from console.anthropic.com
□ All 4 env vars filled in .env.local
□ pnpm dev starts without errors
□ Test: create account → upload PDF → view transactions
□ Test: generate DNA → confirm streaming works
□ Test: roast mode → confirm JSON parses correctly
□ Test on mobile browser (judges will pull out phones)
□ Vercel project created and connected to GitHub
□ All 4 env vars added to Vercel dashboard
□ Production deploy tested with real PDF
□ Share URL for roast card tested and working
```

---

## FINAL INSTRUCTION TO CODING AGENT

You now have everything you need. Here is the priority order for building:

**Hour 1–2:** Supabase setup + auth + Next.js scaffolding + env vars
**Hour 3–5:** PDF parser route + transaction storage + basic transaction list UI
**Hour 6–8:** Spending DNA API route (with streaming) + DNA reveal component
**Hour 9–10:** Regret predictor + simulator routes + UI
**Hour 11–12:** Roast mode + share card + screenshot/image upload
**Hour 13–14:** Landing page + onboarding flow
**Hour 15–16:** Polish, mobile responsiveness, error states, demo data prep

**The most important thing to get right is the streaming DNA reveal.** If nothing else in the demo works, that one moment — watching Claude analyze your behavioral psychology in real time — is technically impressive, emotionally resonant, and unlike anything any competitor has built.

Build it. Ship it. Win it.
