# Bachat — Page Mockups

Low-fidelity ASCII layouts. Use them as a blocking guide: widths, vertical rhythm, where the saffron accent lives, what the hierarchy is on each page. **Not pixel-precise.** Lovable fills in shadcn primitives, spacing, and polish. Claude Code wires data.

For a live rendering of these layouts with real Saffron-on-Slate theme + typography, open `mockup/*.html` in any browser.

Legend:
```
════  section divider / hero rule
┃     card / container edge
▓▓▓▓  saffron-filled element (primary CTA, key number, active nav)
░░░░  muted / secondary text or element
<  >  text placeholder
```

---

## 1. Landing Page (`app/page.tsx`)

Target: 1440px wide. Dark base `#0A0E14`. Hero dominates the first viewport. Scroll reveals features, competitor table, final CTA.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Bachat                                         Login   [▓▓ Get Started ]  │
│  ═════════════════════════════════════════════════════════════════════════ │
│                                                                            │
│    Every finance app shows you charts.                                     │
│    Bachat shows you why                                                    │
│    you keep scrolling past them.                    (Lora, 5rem, ivory)    │
│                                                                            │
│    Behavioral economics meets honest investment reviews.                   │
│    Your data never leaves your browser.           (Geist, 1.25rem, muted)  │
│                                                                            │
│    [ ▓▓  Try it free  →  ]                                                 │
│                                                                            │
│    Built on 40 years of Nobel-winning behavioral economics                 │
│    (Kahneman 2002, Thaler 2017)             (tiny, uppercase, tracked)     │
│                                                                            │
│  ═════════════════════════════════════════════════════════════════════════ │
│                                                                            │
│    ┏━━━━━━━┓  ┏━━━━━━━┓  ┏━━━━━━━┓  ┏━━━━━━━┓  ┏━━━━━━━┓                  │
│    ┃Upload ┃  ┃  DNA  ┃  ┃Predict┃  ┃Invest ┃  ┃Check- ┃                  │
│    ┃       ┃  ┃       ┃  ┃       ┃  ┃       ┃  ┃  in   ┃                  │
│    ┗━━━━━━━┛  ┗━━━━━━━┛  ┗━━━━━━━┛  ┗━━━━━━━┛  ┗━━━━━━━┛                  │
│                                                                            │
│  ═════════════════════════════════════════════════════════════════════════ │
│                                                                            │
│    ░░░░░░ EVERY OTHER APP         ░░░░░░ BACHAT                            │
│    ─────────────────────────────────────────────────────                   │
│    Pie charts of categories        Cognitive biases, named                 │
│    "You spent $X on food"          "DoorDash 11×/mo, 9–11PM, $280 drain"   │
│    Requires bank login             Upload a PDF                            │
│    Generic save-more tips          Pre-purchase intervention               │
│    Cloud-stored data               IndexedDB. In your browser. Always.     │
│    Price predictions (astrology)   Retrospective explanations (honest)     │
│                                                                            │
│  ═════════════════════════════════════════════════════════════════════════ │
│                                                                            │
│                    [ ▓▓  Start your first upload  →  ]                     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Auth Shell — Login (`app/(auth)/login/page.tsx`)

Split layout. Left 40% is branding + privacy pitch. Right 60% holds the form. Collapses to single column below 900px.

```
┌─────────────────────────────────────┬──────────────────────────────────────┐
│                                     │                                      │
│                                     │          Welcome back                │
│   Bachat                            │          ──────────                  │
│   ▓▓▓▓                              │                                      │
│                                     │          ┌────────────────────┐      │
│   Behavioral finance                │          │ Email              │      │
│   that stays on                     │          └────────────────────┘      │
│   your device.                      │                                      │
│                                     │          ┌────────────────────┐      │
│   (Lora, warm ivory, 2.25rem)       │          │ Password           │      │
│                                     │          └────────────────────┘      │
│                                     │                                      │
│                                     │          Forgot password?            │
│   ╔═══════════════════════════╗     │                                      │
│   ║ 100% local data           ║     │          [ ▓▓  Sign in  ]            │
│   ║ No cloud. No tracking.    ║     │                                      │
│   ╚═══════════════════════════╝     │          ─── or ───                  │
│                                     │                                      │
│                                     │          [ G  Continue with Google ] │
│                                     │                                      │
│                                     │          New to Bachat? Register →   │
│                                     │                                      │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

**Register page:** same shell, same left column. Right column form becomes Name / Email / Password / Confirm password, submit "Create account".

---

## 3. Dashboard (`app/(app)/dashboard/page.tsx`)

App shell = persistent sidebar left, top bar up top, content area.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Bachat                                        [Week|▓Biweek|Month]   ◐   │
│  ═════════════════════════════════════════════════════════════════════════ │
│                                                                            │
│ ┌─────────────┬──────────────────────────────────────────────────────────┐ │
│ │ ▓ Dashboard │   Your last 14 days                                      │ │
│ │   Upload    │   ─────────────────                                      │ │
│ │   DNA       │                                                          │ │
│ │   Predict   │   ┌──────────────┬──────────────┬───────────────┐        │ │
│ │   Simulate  │   │ TOTAL SPEND  │ TRANSACTIONS │ BURN vs INCOME│        │ │
│ │   Invest    │   │ ▓ $1,847.22  │    47        │    78%        │        │ │
│ │   Check-in  │   └──────────────┴──────────────┴───────────────┘        │ │
│ │   Settings  │                                                          │ │
│ │             │   ┌─────────────────────────────────────────────────┐    │ │
│ │             │   │  Spend over time                      biweekly  │    │ │
│ │             │   │   $      ╱╲          ╱╲                          │    │ │
│ │             │   │   │     ╱  ╲        ╱  ╲     ▓ income line       │    │ │
│ │             │   │   │    ╱    ╲╱╲   ╱    ╲                        │    │ │
│ │             │   │   │___╱_______╲_╱_______╲__  ░ spend line        │    │ │
│ │             │   │      W1    W2    W3    W4                        │    │ │
│ │             │   └─────────────────────────────────────────────────┘    │ │
│ │             │                                                          │ │
│ │             │   Recent transactions                   View all →       │ │
│ │             │   ┌──────────────────────────────────────────────────┐   │ │
│ │             │   │ Apr 17  DoorDash       food_dining    -$32.50    │   │ │
│ │             │   │ Apr 17  Amazon         shopping       -$89.00    │   │ │
│ │             │   │ Apr 16  Uber           transport      -$14.20    │   │ │
│ │             │   │ Apr 16  Starbucks      food_dining     -$6.75    │   │ │
│ │             │   └──────────────────────────────────────────────────┘   │ │
│ └─────────────┴──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

**Sidebar note:** active item has a saffron vertical bar on the left edge and `text-primary` color. Inactive items are `text-secondary`. Locked items (before first upload: DNA, Predict, Check-in) show a tiny lock icon and tooltip on hover.

---

## 4. Spending DNA — the flagship (`app/(app)/dna/page.tsx`)

Pre-generation: locked empty state with a saffron CTA. Post-generation: full DNA card with streaming reveal on regenerate.

**State: complete**
```
┌───────────────────────────────────────────────────────────────────────────┐
│ │             │   Spending DNA                           ⟳ Regenerate    │ │
│ │             │   ─────────────                                          │ │
│ │             │                                                          │ │
│ │             │   ┌──────────────────────────────────────────────────┐   │ │
│ │             │   │     🦉                                           │   │ │
│ │             │   │     Night Owl Splurger           (Lora, 3rem)   │   │ │
│ │             │   │     64% of your food-delivery orders happen      │   │ │
│ │             │   │     between 9 and 11 PM, costing you $280/mo     │   │ │
│ │             │   │     more than your daytime ordering.             │   │ │
│ │             │   └──────────────────────────────────────────────────┘   │ │
│ │             │                                                          │ │
│ │             │   WHY                                                    │ │
│ │             │   ┌──────────────────────────────────────────────────┐   │ │
│ │             │   │  Ego Depletion                                   │   │ │
│ │             │   │  After a long workday, your mental willpower     │   │ │
│ │             │   │  is drained. DoorDash is the path of least       │   │ │
│ │             │   │  resistance. Not laziness — depleted resources.  │   │ │
│ │             │   └──────────────────────────────────────────────────┘   │ │
│ │             │                                                          │ │
│ │             │   THE PATTERN                                            │ │
│ │             │   ┌───────────────┐   ┌───────────────┐   ┌──────────┐   │ │
│ │             │   │ Late weeknight│ → │ Order DoorDash│ → │ $280/mo  │   │ │
│ │             │   │  (trigger)    │   │  (behavior)   │   │  drain   │   │ │
│ │             │   └───────────────┘   └───────────────┘   └──────────┘   │ │
│ │             │                                                          │ │
│ │             │   BEHAVIORAL PATTERNS                                    │ │
│ │             │   ┌──────────────────────────────────────────────────┐   │ │
│ │             │   │ 9–11 PM food delivery cluster    $280/mo         │   │ │
│ │             │   │ Friday-night Amazon orders       $110/mo         │   │ │
│ │             │   │ Forgotten subscriptions (6)       $54/mo         │   │ │
│ │             │   └──────────────────────────────────────────────────┘   │ │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Investment Review (`app/(app)/invest/page.tsx`)

Portfolio overview + per-holding cards. Explain modal opens over the page when a user clicks "Explain this move."

**Main view**
```
┌───────────────────────────────────────────────────────────────────────────┐
│ │             │   Investment Review                 + Add holding         │ │
│ │             │                                                          │ │
│ │             │   ┌──────────────────────────────────────────────────┐   │ │
│ │             │   │  Portfolio — last 90 days                        │   │ │
│ │             │   │   % │  ▓ NVDA ╱╲                                 │   │ │
│ │             │   │     │       ╱  ╲           ░ AAPL                │   │ │
│ │             │   │   0 │──────╱────╲──────────── baseline ──────    │   │ │
│ │             │   │     │     ╱      ╲  ▓ SOXL  ╲                    │   │ │
│ │             │   │     │___╱_________╲___________╲___               │   │ │
│ │             │   └──────────────────────────────────────────────────┘   │ │
│ │             │                                                          │ │
│ │             │   Holdings                                               │ │
│ │             │   ┌──────────────────────────────────────────────────┐   │ │
│ │             │   │ NVDA   10 sh   cost $400     now ▓$612  +53% ↑  │   │ │
│ │             │   │                                  [ Explain ]    │   │ │
│ │             │   ├──────────────────────────────────────────────────┤   │ │
│ │             │   │ AAPL   25 sh   cost $170     now  $185   +9% ↑  │   │ │
│ │             │   │                                  [ Explain ]    │   │ │
│ │             │   ├──────────────────────────────────────────────────┤   │ │
│ │             │   │ SOXL    5 sh   cost  $35     now   $22  -37% ↓  │   │ │
│ │             │   │                                  [ Explain ]    │   │ │
│ │             │   └──────────────────────────────────────────────────┘   │ │
└───────────────────────────────────────────────────────────────────────────┘
```

**Explain modal (opens on click)**
```
        ┌────────────────────────────────────────────────────────┐
        │  Why SOXL fell 37% over 90 days                    ✕   │
        │                                                        │
        │  VERIFIED EVENTS                                       │
        │  ┌────────────────────────────────────────────────┐    │
        │  │ Feb 12  NVDA earnings guidance warning   ~18%  │    │
        │  │ Mar 04  Fed pause signal, semis rotation ~10%  │    │
        │  └────────────────────────────────────────────────┘    │
        │                                                        │
        │  PATTERN-MATCHING INFERENCE ░░  (speculation)          │
        │  ┌────────────────────────────────────────────────┐    │
        │  │ Broad AI-infrastructure sell-off            ~9% │    │
        │  │ (plausible but not individually verifiable)     │    │
        │  └────────────────────────────────────────────────┘    │
        │                                                        │
        │  SOXL is a 3× leveraged semis ETF; leverage amplifies  │
        │  both directions. This loss reflects known events +    │
        │  a sector rotation — nothing unusual given the ETF's   │
        │  structure.                                            │
        │                                                        │
        │  ░ This analysis does not predict future prices        │
        │  ░ and is not investment advice.                       │
        └────────────────────────────────────────────────────────┘
```

---

## 6. Honest Check-in (`app/(app)/check-in/page.tsx`)

Dramatic center-stage grade reveal, then observations cascade in. Share card is downloadable.

```
┌───────────────────────────────────────────────────────────────────────────┐
│ │             │                       ┌─────────┐                         │ │
│ │             │                       │   ▓▓    │                         │ │
│ │             │                       │   C-    │  (Lora, 8rem, saffron)  │ │
│ │             │                       │         │                         │ │
│ │             │                       └─────────┘                         │ │
│ │             │                                                          │ │
│ │             │           "DoorDash's Most Loyal Unpaid Employee"         │ │
│ │             │             (Lora italic, 1.5rem, centered)               │ │
│ │             │                                                          │ │
│ │             │   ┌──────────────────────────────────────────────────┐   │ │
│ │             │   │ You ordered DoorDash 11 times in 30 days —       │   │ │
│ │             │   │ 9 of them after 10 PM. That tip adds up.          │   │ │
│ │             │   ├──────────────────────────────────────────────────┤   │ │
│ │             │   │ $54 on subscriptions you haven't opened in       │   │ │
│ │             │   │ three months. Set a reminder, friend.             │   │ │
│ │             │   ├──────────────────────────────────────────────────┤   │ │
│ │             │   │ At your current rate, that Amazon habit is       │   │ │
│ │             │   │ a three-day weekend in Lisbon, every year.        │   │ │
│ │             │   ├──────────────────────────────────────────────────┤   │ │
│ │             │   │ You paid full price for three books on Amazon    │   │ │
│ │             │   │ this month. The library exists. Just saying.     │   │ │
│ │             │   └──────────────────────────────────────────────────┘   │ │
│ │             │                                                          │ │
│ │             │   One thing you're doing right: grocery spend is          │ │
│ │             │   steady and reasonable. That's the foundation —         │ │
│ │             │   now just bring the food-delivery line down to match.   │ │
│ │             │                                                          │ │
│ │             │   [ ↓ Download card ]   [ 🔗 Copy share link ]            │ │
└───────────────────────────────────────────────────────────────────────────┘
```

**Share card (downloaded PNG, 1080×1920):** same content, centered, with "bachat.app" wordmark bottom-right. Meant to feel like a mirror, not a dunk. The tone must read as concerned friend, not comedian.

---

## Recurring layout primitives (reuse across all pages)

- **Card:** `bg-[var(--bg-card)]` + `border border-[var(--border)]` + `rounded-xl` + `p-6`
- **Primary CTA:** `bg-[var(--accent-primary)]` + `text-black` + `font-semibold` + `rounded-xl` + `px-5 py-2.5`
- **Section label (above cards):** `text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-3`
- **Stat value:** Geist Mono, `text-3xl font-bold`, saffron only on the primary stat of a row
- **Sidebar active state:** 2px saffron bar on left edge + `text-[var(--text-primary)]` (vs secondary default)
- **Delta indicators:** jade ↑ for gains/savings, crimson ↓ for losses/overspend — never the reverse

## Notes for Lovable

These ASCII sketches show **hierarchy and rhythm**, not pixel-perfect spacing. You pick the exact padding, border weight, and micro-interactions. The non-negotiables are:
1. Color tokens (only the CSS vars from `docs/LOVABLE_PROMPT.md` § 2)
2. Font assignments (Lora for major headings, Geist Sans body, Geist Mono for all numbers)
3. Saffron is sparing — one hero number per screen
4. No category pie charts anywhere
5. Sidebar layout is identical on every `(app)/*` page
