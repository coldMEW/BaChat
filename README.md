# Bachat

**Bachat** (Nepali: "saving") is a privacy-first behavioral finance web app. It reads your bank statements, explains *why* you spend the way you do using clinical behavioral economics, and helps you catch yourself before you repeat the pattern. It also reviews your investment holdings retrospectively — telling you what drove past moves without ever predicting the future.

Built in 48 hours for a hackathon by a team of 4 + two AI collaborators (Claude Code + Lovable).

## Repo layout

```
.
├── docs/                          ← team reference material
│   ├── OVERVIEW.md                ← what Bachat is (start here)
│   ├── TEAMMATES.md               ← roles, workflow, hour-by-hour plan
│   ├── LOVABLE_PROMPT.md          ← paste-in prompt for Lovable AI
│   ├── MOCKUPS.md                 ← ASCII layout sketches
│   └── motive-original-spec.md    ← original inspiration spec (kept for reference)
│
└── mockup/                        ← static HTML mockup of the full app
    ├── styles.css                 ← design tokens + shared components
    ├── mock.js                    ← vanilla JS for period switcher, DNA replay, modals
    ├── index.html                 ← landing page
    ├── login.html / register.html ← auth shell
    ├── dashboard.html             ← logged-in home
    ├── upload.html                ← statement upload
    ├── dna.html                   ← Spending DNA (flagship)
    ├── predict.html               ← regret predictor
    ├── simulate.html              ← future simulator
    ├── invest.html                ← portfolio review with retrospective
    ├── check-in.html              ← weekly honest check-in
    └── settings.html              ← account + export/import
```

## Running the mockup

Open any `mockup/*.html` file in a modern browser. No build step, no install. Navigate between pages via the sidebar links.

## Status

- ✅ Mockup (static HTML/CSS/JS showing every screen)
- ⏳ Real app (Next.js + Supabase Auth + Dexie + Claude + Alpha Vantage) — begins after mockup approval

## Team

See `docs/TEAMMATES.md`.

## License

All rights reserved. Hackathon submission. Contact the team for reuse.
