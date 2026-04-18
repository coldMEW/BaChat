# Bachat — Team Roles, Workflow, and Hour-by-Hour Plan

## Team (4)

| Role | Owner | Domain |
|---|---|---|
| **Agent** | Claude Code (AI) | Backend, data layer, AI plumbing, auth integration, code review, wiring |
| **Lovable** | Lovable AI | Presentational React components (frontend UI only) |
| **Teammate-Invest** | [Name] | Investment module, Alpha Vantage integration, stock analysis |
| **Teammate-Product** | [Name — repo owner coldMEW] | Supabase setup, prompts/content/tone-QA, landing copy, demo prep, Vercel deploy |

---

## Detailed Responsibilities

### Agent (Claude Code)
- Repo scaffolding (`npx create-next-app`, Tailwind, shadcn/ui, Supabase packages, Dexie)
- `types/index.ts` — the TypeScript contract file that Lovable builds against. **Ships first.**
- `lib/supabase/{client,server}.ts` + `middleware.ts` + `app/auth/callback/route.ts` — auth wiring
- `lib/db.ts` — Dexie schema, namespaced by `user.id`
- `lib/behavioral-stats.ts`, `lib/period.ts`, `lib/anthropic.ts` (with `safeParseJSON`), `lib/prompts.ts`
- All `app/api/*` routes: parse-pdf, parse-screenshot, spending-dna (SSE streaming), regret-predict, simulate, check-in, stock-search, stock-history, stock-explain
- Auth pages wiring (`app/(auth)/login`, `app/(auth)/register`) — imports Lovable's forms, wires Supabase calls
- App pages wiring (`app/(app)/dashboard`, `upload`, `dna`, `predict`, `simulate`, `invest`, `check-in`, `settings`) — imports Lovable's components, wires Dexie + API
- Export/import JSON feature in Settings
- **Review every Lovable PR.** Reject slop, fix bugs, enforce `@/types` contracts.
- Git branching + merge discipline.

### Lovable
- Presentational React components only. **No data fetching. No Dexie. No API calls.**
- Uses `@/types` for all props. Invents no new types.
- Applies Saffron-on-Slate design tokens from `app/globals.css`.
- Uses shadcn/ui primitives.
- Pushes each component (or small group) as a separate branch → PR to `dev`.
- Scope enumerated in `docs/LOVABLE_PROMPT.md` (four waves, ~30 components).

### Teammate-Invest
- **Hour 0:** Sign up for Alpha Vantage free API key (30-second signup at https://www.alphavantage.co/support/#api-key). Share key with Teammate-Product for Vercel env.
- **Hour 4–8:** Implement `lib/alphavantage.ts` (symbol search, TIME_SERIES_DAILY, in-memory LRU cache). Implement `app/api/stock-search/route.ts` and `app/api/stock-history/route.ts`.
- **Hour 8–11:** Wire Lovable's `/invest` components to Dexie `holdings` + `stockHistory` tables. Build `app/(app)/invest/page.tsx`.
- **Hour 11–13:** Implement `app/api/stock-explain/route.ts` with anti-prediction prompt guardrails:
  - NEVER predict future prices
  - NEVER recommend buy/sell/hold
  - ALWAYS separate "verifiable event" from "pattern-matching inference"
  - Regex post-filter blocks `/\b(buy|sell|target|expect|will (rise|fall|grow))\b/i` → retry with stricter system prompt
- **Hour 13–14:** Pre-fetch demo fixtures for NVDA/AAPL/TSLA so a demo survives Alpha Vantage rate-limiting (25 requests/day).

### Teammate-Product (coldMEW)
- **Hour 0:** Create Supabase project at supabase.com → enable email auth + Google OAuth → add redirect URL `http://localhost:3000/auth/callback` (and eventual Vercel URL). Share 3 keys with Agent: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Hour 0–2:** Draft landing page copy: hero headline, privacy pitch, competitor contrast table. Draft auth page microcopy.
- **Hour 4–10:** Review Agent's `lib/prompts.ts` — every prompt read aloud. Gate: does each one force real numbers / real merchants in the output? If not, rewrite.
- **Hour 10–14:** Own the **Check-in prompt rewrite** (`buildGentleCheckInPrompt`). This is the hardest tone-craft job:
  - Every line references real data (merchant + number + time)
  - No jargon ("cognitive bias" forbidden in user-facing output)
  - `most_pointed_line` = specific observation + one sentence of genuine care (not a punchline)
  - `redemption_note` leads with what they did RIGHT (data-sourced)
  - `share_caption` = honest self-awareness, not self-deprecation
- **Hour 14–15:** Desktop QA at 1280 and 1440 px. Best-effort reflow check at 768 px.
- **Hour 15–16:** Vercel deploy. Add all 5 env vars to Vercel dashboard. Production smoke test with real PDF.
- **Demo:** run the 3-minute demo script. Have a recorded screencap of DNA streaming as backup if network fails.

---

## Git Workflow

**Repo:** `https://github.com/coldMEW/BaChat.git`

### Branches
- `main` — protected, production-ready only
- `dev` — integration branch, default PR target
- `feat/<owner>-<feature>` — e.g. `feat/agent-parse-pdf`, `feat/invest-portfolio-wiring`
- `lovable/<wave>-<component>` — e.g. `lovable/wave1-login-form`, `lovable/wave2-dna-card`

### Rules
- **No direct commits to `main`.** Every merge is a PR.
- PRs target `dev`. `dev` → `main` at milestone checkpoints only.
- **Every PR needs one review.** Agent reviews every Lovable PR. Teammate-Product reviews every prompt/content PR. Teammates cross-review each other's code PRs.
- **Conventional commit style:** `feat:`, `fix:`, `chore:`, `style:`, `docs:`. Example: `feat(dna): streaming reveal component`.
- Small commits, small PRs. Easier to review, easier to revert.
- Lovable PRs are reviewed for: types match `@/types`, no new deps, no data-fetching inside the component, design tokens used correctly.

### Kickoff (Agent runs, once)
1. `git clone https://github.com/coldMEW/BaChat.git`
2. Move `Motive_AGENT_PROMPT.md` → `docs/motive-original-spec.md`
3. Create `docs/OVERVIEW.md`, `docs/TEAMMATES.md`, `docs/LOVABLE_PROMPT.md`, `docs/MOCKUPS.md`
4. Scaffold Next.js, install deps, apply design tokens, create `types/index.ts`, `lib/db.ts` stubs, Supabase client split, `middleware.ts`, auth callback route, `.env.example`
5. Branch: `feat/agent-scaffold` → push → PR → merge to `dev`
6. Merge `dev` → `main` as the initial commit
7. Notify team: "scaffold up; claim your branches"

---

## Hour-by-Hour Milestones

| Hour | Milestone | Owner(s) |
|---|---|---|
| 0–2 | Supabase project exists. Alpha Vantage key obtained. Repo cloned. | Teammate-Product, Teammate-Invest |
| 2–3 | Scaffold + auth wiring + types committed to `dev`. Login/register pages render Lovable forms. | Agent |
| 3–5 | PDF upload round-trips transactions into Dexie. Dashboard shows stat cards + time-series chart. | Agent + Lovable (Wave 2) |
| 6–8 | **DNA streaming reveal working end-to-end with real PDF data.** (Flagship feature.) | Agent + Lovable (Wave 2) |
| 9–11 | Predict + Simulate pages wired. Invest page renders with symbol search + portfolio chart. | Agent + Lovable (Wave 3) + Teammate-Invest |
| 11–13 | Stock-explain + Check-in producing non-slop output per Teammate-Product review. | Teammate-Invest + Teammate-Product |
| 13–14 | Landing page live. `dev` → `main`. Vercel deploy succeeds on production URL. | Lovable (Wave 4) + Teammate-Product |
| 14–16 | Bug triage. Demo dress rehearsal. Backup recordings made. | All |

**Hard gate before every `dev` → `main`:** features work on the Vercel preview URL, not just localhost.

---

## Communication

- **Where:** team group chat (Discord/Slack/iMessage — pick one at kickoff)
- **What to broadcast:** branch created, PR opened, PR merged, blockers, decisions that affect others (renaming a type, changing a prop shape)
- **Do NOT broadcast:** every keystroke. Respect each other's focus.
- **Blockers:** if stuck > 30 minutes, tag the relevant owner
- **Integration windows:** hour 5, 8, 11, 14 — Agent does a synchronous merge pass on pending PRs. Queue PRs for those windows rather than demanding ad-hoc reviews.

---

## Risks

- Alpha Vantage 25 req/day limit during demo → pre-fetched fixtures
- Stock-explain prompt drifting to prediction → regex post-filter + strict system prompt
- Lovable hallucinating libs/paths → briefs forbid new deps; Agent rewrites instead of looping
- Git merge conflicts during crunch → small PRs, scheduled integration windows
- Check-in tone drift during late-night coding → Teammate-Product is named gatekeeper, no Check-in PR merges without their LGTM
