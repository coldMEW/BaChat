# Lovable Prompt — Paste this entire file into Lovable

You are building the frontend for **Bachat**, a privacy-first behavioral finance web app. A human teammate and an AI code reviewer (Claude Code) are working on this repo in parallel with you. Your job is to build presentational React components that match the design spec exactly, ship them through GitHub PRs, and stay in your lane (UI only — no data fetching).

**Before you start:** also read `docs/MOCKUPS.md` in the same repo and open the `mockup/` folder in a browser. The mockup shows every page in static HTML with the real Saffron-on-Slate theme applied — that is your visual target. This brief defines the component contract; the mockup shows the look.

---

## 1. Project context (read once, then refer back)

**App:** Bachat (Nepali: "saving"). A web app that reads bank statements, generates a behavioral-economics profile of the user's spending, predicts regret before purchases, simulates their financial future, reviews their investment holdings retrospectively, and ends with a gentle weekly check-in.

**Privacy promise:** All financial data lives in the user's browser (IndexedDB). Supabase handles auth only — never sees transactions.

**Tech stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Recharts for charts.

**Fonts (already configured in `app/layout.tsx`):** Lora (headings), Geist Sans (body), Geist Mono (numbers).

**Scope this weekend:** desktop web only. Target 1280–1440 px. Work should still reflow cleanly at 768 px (charts may stack). Do NOT optimize for 375 px right now.

---

## 2. Design system — "Saffron on Slate"

Use ONLY these CSS variables (they are defined in `app/globals.css`). Do not invent colors.

```css
--bg-base:        #0A0E14;
--bg-card:        #111720;
--bg-card-hover:  #161E29;
--border:         #1C2430;
--border-active:  #2A3544;
--text-primary:   #F5EFE4;
--text-secondary: #94A3B8;
--text-muted:     #475569;
--accent-primary: #F59E0B;   /* saffron — CTAs, active nav, key numbers */
--accent-success: #10B981;   /* jade — gains, savings */
--accent-danger:  #EF4444;   /* crimson — losses, warnings */
--accent-info:    #60A5FA;   /* sparingly — stock charts only */
```

**Typography rules:**
- Major hero headings: Lora, weight 600, tracking-tight
- UI + body: Geist Sans, weight 400
- All dollar amounts, percentages, scores: Geist Mono
- Labels: Geist Sans, weight 500, uppercase, tracking-widest, `text-secondary`

**Principles:**
- Saffron is sparing. Primary CTAs, active nav item, one hero number per screen. Never fill a whole panel.
- Jade for positive deltas, crimson for negative. Never reverse.
- Radius: `0.75rem` on cards and buttons.
- Motion: `transition-all duration-200` on interactive elements. Reveals use `animate-in fade-in slide-in-from-bottom-2`.
- Charts: saffron primary line, jade/crimson for overlays, grid lines in `var(--border)`.
- **No category pie charts.** Ever. Time-series line/area charts are welcome.

---

## 3. Your lane — presentational components only

You are building React components in `components/*`. You are **NOT** building pages, data layers, or API calls. Claude Code will wire your components to data after merging your PR.

**Every component must:**
- Accept props typed against interfaces in `@/types` (Claude Code ships `types/index.ts` first — import from it; do not invent new types)
- Emit events via callback props: `onSubmit`, `onSelectPeriod`, `onRegenerate`, etc.
- Be a Client Component (`'use client'` at the top) when it uses state or event handlers
- Use shadcn/ui primitives (`Button`, `Card`, `Input`, etc.) where applicable
- Apply design tokens via `style={{ color: 'var(--text-primary)' }}` or Tailwind arbitrary values like `bg-[var(--bg-card)]`
- Handle three states minimum where applicable: empty, populated, error

**Every component must NOT:**
- Call `fetch()`, `supabase.*`, or `db.*` (Dexie)
- Import from `next/navigation` for data (pages will handle routing; components just call callback props)
- Add new npm dependencies — the allowlist is: `react`, `lucide-react`, `recharts`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, `react-dropzone`, `html2canvas`, `date-fns`, `@radix-ui/*` (via shadcn), plus anything already in `package.json`
- Invent new colors or hex values outside the CSS variables above
- Use non-Lora/Geist fonts

If a spec is ambiguous, **choose the simpler interpretation** and ship it. Claude Code will leave `LOVABLE_FIX:` comments on the PR if adjustments are needed.

---

## 4. Components to build — four waves

Ship each wave as its own set of PRs. Wait for wave N to be merged before starting wave N+1 unless noted.

### Wave 1 — Auth + Shell (start immediately)

1. **`components/auth/login-form.tsx`** — email input, password input, Google OAuth button, "Sign in" button, link to register, forgot-password link. Props: `onSubmit(email, password)`, `onGoogle()`, `loading`, `error?: string`.
2. **`components/auth/register-form.tsx`** — name, email, password, confirm password. Google OAuth button. Link to login. Props: `onSubmit({name, email, password})`, `onGoogle()`, `loading`, `error?`.
3. **`components/auth/auth-shell.tsx`** — split-screen layout. Left column 40% width with Bachat logo (text lockup in Lora bold), one-line tagline ("Behavioral finance that stays on your device"), and a short privacy pill ("100% local data. No cloud."). Right column holds the form slot via `{children}`. Collapses to single column below 900 px.
4. **`components/period-switcher.tsx`** — segmented control with three options: Week / Biweek / Month. Props: `value: 'week'|'biweek'|'month'`, `onChange`. Active option has saffron background.
5. **`components/layout/app-shell.tsx`** — sidebar + top bar. Sidebar items: Dashboard, Upload, Spending DNA, Predict, Simulate, Invest, Check-in, Settings. Top bar shows user's name + avatar dropdown with "Sign Out". Props: `currentPath`, `user: {name, email, avatarUrl?}`, `onSignOut()`, `navItems: Array<{label, href, locked?: boolean, lockedMessage?: string}>`. Locked items are dimmed with a small lock icon and tooltip.
6. **`components/transaction-card.tsx`** — single transaction row: merchant, category chip, date, amount (mono font, right-aligned, crimson). Props: `transaction: Transaction`.
7. **`components/transaction-list.tsx`** — list of `TransactionCard`s with date grouping. Empty state: centered illustration placeholder + "No transactions yet. Upload a statement." Props: `transactions: Transaction[]`, `loading?`.
8. **`components/stat-card.tsx`** — reusable label + value + optional delta. Props: `label`, `value`, `delta?: {value, direction: 'up'|'down', label}`, `primary?: boolean` (if true, value is saffron and larger).
9. **`components/onboarding-modal.tsx`** — modal shown after first login: name, monthly income (with currency selector: USD / EUR / GBP / INR / NPR / etc.), and a "Continue" button. Props: `open`, `onComplete(profile: Profile)`.

### Wave 2 — Upload + DNA reveal

10. **`components/upload/pdf-drop-zone.tsx`** — react-dropzone wrapper. Accepts `.pdf` up to 25 MB. Shows progress states: idle, reading, extracting, categorizing, done, error. Props: `onFilesAccepted(files: File[])`, `status`, `statusMessage?`.
11. **`components/upload/screenshot-upload.tsx`** — image drop zone accepting PNG/JPG/WebP. Props: `onImage(file: File)`.
12. **`components/upload/transactions-preview.tsx`** — editable table of parsed transactions. Columns: date, merchant, category (dropdown), amount. Per-row edit + remove buttons. "Save all" button at bottom. Props: `transactions`, `onEdit(i, patch)`, `onRemove(i)`, `onSaveAll()`.
13. **`components/dna/archetype-card.tsx`** — hero card showing archetype name (Lora, large), emoji, archetype description (2–3 sentences). Props: `archetype`, `archetypeDescription`, `emoji`.
14. **`components/dna/bias-indicator.tsx`** — cognitive bias name + plain-English explanation. Does NOT use the phrase "cognitive bias" in user-facing copy. Props: `primaryBias`, `explanation`.
15. **`components/dna/causal-chain.tsx`** — large three-step visual: TRIGGER → BEHAVIOR → CONSEQUENCE. Each step is a panel with an arrow connector. Props: `causalChain` (a string the API returns in the form "X → Y → Z").
16. **`components/dna/pattern-list.tsx`** — list of behavioral patterns with monthly cost. Props: `patterns: Array<{name, description, frequency, monthlyCost}>`.
17. **`components/dna/dna-stream-viewer.tsx`** — the flagship component. Displays streaming text as it arrives from the API, then transitions to the structured card (archetype + bias + causal chain + patterns) once parsing completes. Props: `streamingText: string`, `parsed: SpendingDNA | null`, `status: 'idle'|'streaming'|'complete'|'error'`.

### Wave 3 — Predict + Simulate + Invest

18. **`components/predict/regret-form.tsx`** — three-field form: merchant (text), category (select), amount (number). Submit button "Will I regret this?". Props: `onSubmit({merchant, category, amount})`, `submitting?`.
19. **`components/predict/regret-score.tsx`** — large circular score 0–100. Green <30 (jade), amber 30–60 (saffron), red >60 (crimson). Below: "Similar past purchases: X | Regretted: Y", pattern match, loss frame, alternatives, verdict. Props: `prediction: RegretPrediction`.
20. **`components/simulator/runway-hero.tsx`** — huge "X days until zero" display, Lora font, color thresholds (crimson <7, saffron <21, jade safe). If user is spending less than income, shows "You're on track" instead. Props: `daysUntilZero: number | null`, `monthEndBalance: number`.
21. **`components/simulator/income-vs-spend-chart.tsx`** — Recharts line chart. Saffron income line (flat or stepped), crimson spend line (actual). Props: `data: Array<{date, income, spend}>`, `period`.
22. **`components/simulator/goal-form.tsx`** — goal name + amount fields. Props: `onSubmit({name, amount})`.
23. **`components/invest/add-holding-form.tsx`** — symbol autocomplete (via Claude-Code-wired search callback), shares, cost basis, purchase date. Props: `onSearchSymbol(q) => Promise<symbols>`, `onSubmit(holding)`.
24. **`components/invest/holding-card.tsx`** — ticker, shares, current value (mono), absolute gain/loss, percent gain/loss, "Explain this move" button. Props: `holding`, `snapshot`, `onExplain()`.
25. **`components/invest/portfolio-chart.tsx`** — Recharts multi-series line chart, one line per holding, normalized to % change from start. Props: `holdings`, `period`.
26. **`components/invest/explain-modal.tsx`** — modal with retrospective analysis. Two clearly-separated panels: "Verified events" (each with date + event + contribution %) and "Pattern-matching inference" (labeled as speculation). Ends with a one-sentence honest verdict. Props: `open`, `onClose`, `explanation: StockExplanation`.

### Wave 4 — Check-in + Landing

27. **`components/check-in/grade-badge.tsx`** — giant letter grade A–F with +/- modifier. Lora font, 6rem+. Scale-in animation on mount. Color: jade for A/B, saffron for C, crimson for D/F. Props: `grade: string`.
28. **`components/check-in/observation-line.tsx`** — single observation line. Shows with staggered reveal animation when `index` prop is passed. Props: `text`, `index`.
29. **`components/check-in/share-card.tsx`** — downloadable 1080x1920 card layout containing grade, title, 4 observation lines, most-pointed-line, redemption note, and a Bachat wordmark. Uses html2canvas when user clicks Download. Props: `checkIn: CheckInData`, `onDownload()`, `onShare()`.
30. **`components/landing/hero.tsx`** — landing hero. Headline (Lora, 5rem): "Every finance app shows you charts. Bachat shows you why you keep scrolling past them." Subhead: "Behavioral economics meets honest investment reviews. Your data never leaves your browser." Single CTA: "Try it free →". Small trust row below: "Built on 40 years of Nobel-winning behavioral economics (Kahneman 2002, Thaler 2017)".
31. **`components/landing/feature-strip.tsx`** — 5-feature row (Upload / DNA / Predict / Invest / Check-in), each with a lucide icon and two-line description.
32. **`components/landing/competitor-table.tsx`** — two-column contrast table, "Every other app" vs "Bachat", 5 rows.

---

## 5. Working with Claude Code (your AI code reviewer)

Claude Code is Bachat's backend and review AI. It operates in the same repo via a different branch. Your relationship:

- **Claude Code ships first:** `types/index.ts`, `app/globals.css` (design tokens), `app/layout.tsx` (fonts), and `middleware.ts` (auth). Pull `dev` before starting a wave.
- **You build:** presentational components per spec above.
- **Claude Code wires:** after your PR merges, Claude Code creates the page file (`app/(app)/dna/page.tsx` etc.) that imports your component and hooks it to Dexie + API calls.
- **Claude Code reviews your PR:** if there's a problem (type mismatch, new dep, data-fetching inside component, invented color), Claude Code leaves a `LOVABLE_FIX:` comment explaining what's wrong. Read every `LOVABLE_FIX:` carefully — the next wave's brief will incorporate the lesson.
- **Conflict resolution:** if you disagree with a `LOVABLE_FIX:`, leave a comment on the PR; Teammate-Product arbitrates.

---

## 6. Git workflow

**Repo:** `https://github.com/coldMEW/BaChat.git`

**Branch naming:** `lovable/wave<N>-<component-name>` — e.g. `lovable/wave1-login-form`, `lovable/wave2-dna-stream-viewer`.

**For each component (or small group):**
1. Pull latest `dev`: `git checkout dev && git pull`
2. Create branch: `git checkout -b lovable/wave2-archetype-card`
3. Write the component file(s) at the specified path
4. Commit with conventional style:
   ```
   git commit -m "feat(dna): archetype card component"
   ```
5. Push: `git push -u origin lovable/wave2-archetype-card`
6. Open a PR on GitHub targeting `dev`. PR title mirrors the commit. PR body: one-sentence summary + "Follows brief in docs/LOVABLE_PROMPT.md § Wave 2 item 13."
7. Wait for Claude Code's review. Address `LOVABLE_FIX:` comments if any, then push again.
8. Once approved, the human teammate merges.

**Commit message rules:**
- Use `feat(<area>):` for new components, `fix(<area>):` for fixes, `style(<area>):` for visual tweaks, `chore:` for config
- Keep first line under 72 chars
- No emoji in commits unless the commit is specifically about emoji
- No "Generated with X" signatures

**If you can generate multiple small components in one pass, batch them into one PR** as long as they're in the same wave and the diff stays under ~400 lines.

---

## 7. Definition of Done for each component

A component is done when:
- Props interface matches the spec and imports from `@/types`
- Renders correctly at 1280 px and doesn't break at 768 px (may stack)
- Uses design tokens only (no inventoried colors)
- Includes empty / loading / error states where applicable
- Passes TypeScript strict compilation: `npm run build` succeeds
- Is a Client Component if it uses state/events
- Has no data-fetching calls
- PR description names which wave + item number from this brief

---

## 8. Escalation

If a spec in this brief is impossible (a prop from `@/types` doesn't exist yet, shadcn/ui lacks a needed primitive, or the requirement is genuinely ambiguous): **do not guess and do not invent**. Leave a clear PR comment starting with `LOVABLE_QUESTION:` describing what's missing. Teammate-Product or Claude Code will resolve within one integration window.

---

Now go. Start with Wave 1. Good luck.
