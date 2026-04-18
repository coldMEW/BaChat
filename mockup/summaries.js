// Causal summaries per ticker, synthesized from the real Finnhub headlines.
// In the production build these come from Claude with anti-prediction guardrails.
// Each entry:
//   summary  — 1-3 sentence "likely drivers" paragraph
//   drivers  — 2-4 bullets, each tagged {type: 'verified'|'inference', text}

window.BACHAT_SUMMARIES = {

  /* ===================== NVDA cluster ===================== */

  NVDA: {
    summary: "Moderate gain as the AI-infrastructure narrative stays broadly supportive for GPU-heavy names. Coverage in the last 30 days is dominated by peer comparisons (Broadcom, AMD) rather than a single discrete NVDA catalyst.",
    drivers: [
      { type: 'verified', text: "Continued AI data-center capex narrative lifting GPU-heavy chipmakers" },
      { type: 'inference', text: "Persistent 'NVDA vs AMD / AVGO' framing in financial media keeps attention on NVDA's leadership" },
      { type: 'inference', text: "No specific earnings, guidance, or regulatory catalyst detected in the news window" },
    ],
  },

  AVGO: {
    summary: "Rose on continued bullish framing versus AMD in major financial outlets. Coverage this week increasingly positions Broadcom as the preferred way to play AI-chip demand — and that preference correlates with near-term buying interest.",
    drivers: [
      { type: 'verified', text: "Prominent 'Broadcom vs AMD — which is the better AI-chip buy?' coverage" },
      { type: 'inference', text: "Software-segment rebound narrative lifting the broader complex" },
    ],
  },

  MU: {
    summary: "Small pullback despite largely constructive AI-memory narratives. Coverage still frames Micron as riding the AI boom at a discount to peers — today's slight decline looks like profit-taking rather than fresh negative news.",
    drivers: [
      { type: 'inference', text: "Light profit-taking after a recent run on AI-memory enthusiasm" },
      { type: 'verified', text: "Discount-valuation framing (MU at below-peer multiples) continues in coverage" },
    ],
  },

  AMD: {
    summary: "Essentially flat. Several analyst pieces this week are rotating preference toward Broadcom and reiterating Nvidia's Blackwell-Ultra dominance — both slightly weigh on AMD's relative positioning even as the sector tape is up.",
    drivers: [
      { type: 'inference', text: "Analyst preference rotating toward Broadcom in AI-chipmaker comparisons" },
      { type: 'verified', text: "NVIDIA Blackwell-Ultra launch framing keeps AMD relatively behind" },
    ],
  },

  INTC: {
    summary: "Unchanged. No Intel-specific catalyst surfaces in the 30-day window — macro and geopolitical headlines (Iran, energy) are drawing investor attention instead. Quiet period ahead of earnings adds to the flat tape.",
    drivers: [
      { type: 'inference', text: "No Intel-specific catalysts; attention is elsewhere" },
      { type: 'inference', text: "Pre-earnings quiet period damping volatility" },
    ],
  },

  TXN: {
    summary: "Strong up-move on a fresh Nvidia-robotics partnership headline plus reiterated bullish earnings outlook. The robotics angle adds a new growth narrative beyond Texas Instruments' traditional analog-chip business, which the market is rewarding.",
    drivers: [
      { type: 'verified', text: "Announcement of a Texas Instruments / NVIDIA robotics partnership" },
      { type: 'verified', text: "Analyst reiteration of a strong forward earnings outlook this week" },
    ],
  },

  /* ===================== AAPL cluster ===================== */

  AAPL: {
    summary: "Solid gain following positive analyst framing about upcoming results. Berkshire Hathaway-selling headlines are noted but didn't dent sentiment — the market is prioritizing the services / buyback narrative and mega-cap rotation.",
    drivers: [
      { type: 'verified', text: "Analyst pieces framing 'incredible news for Apple investors' ahead of results" },
      { type: 'inference', text: "Services + buyback thesis continues to support the name at current levels" },
      { type: 'inference', text: "Mega-cap rotation benefiting the largest 7 holdings broadly" },
    ],
  },

  SNDK: {
    summary: "Modest gain as under-the-radar AI-storage narratives build. SanDisk is increasingly being mentioned alongside Micron as a cheaper way to express AI-driven memory demand.",
    drivers: [
      { type: 'inference', text: "'Under-the-radar AI storage' positioning gaining mainstream mentions" },
      { type: 'inference', text: "Pair-trade narrative vs. Micron drawing incremental attention" },
    ],
  },

  DELL: {
    summary: "Solid gain driven by speculation of a potential NVIDIA deal that would amplify Dell's AI-server positioning. Valuation-and-momentum coverage is increasingly highlighting Dell as a Tier-1 way to express the enterprise-AI-infrastructure thesis.",
    drivers: [
      { type: 'verified', text: "Media speculation about an NVIDIA-related deal or partnership involving Dell hardware" },
      { type: 'inference', text: "Enterprise-AI-server thesis rotating out of pure-semi names into integrators" },
    ],
  },

  WDC: {
    summary: "Strong up-move alongside SanDisk on the AI-storage sleeper theme. Same-day tracking pieces specifically note WDC outpacing the broader market — consistent with a sector rotation into NAND-exposed names.",
    drivers: [
      { type: 'verified', text: "Same-day coverage flagged WDC as outpacing the S&P 500 today" },
      { type: 'inference', text: "AI-storage rotation lifting NAND-exposed names together" },
    ],
  },

  HPE: {
    summary: "Rose on renewed coverage of HPE's NVIDIA AI-cloud alliance and its implications for the enterprise-infrastructure moat. Value-stock framing continues to bring new positional buyers at current levels.",
    drivers: [
      { type: 'verified', text: "HPE / NVIDIA AI-cloud alliance coverage refreshed this week" },
      { type: 'inference', text: "Value-stock framing attracting positional buyers into the name" },
    ],
  },

  NTAP: {
    summary: "Modest positive move on fresh Google Cloud collaboration expansion news. Valuation pieces are starting to catch up to the recent share-price gains but haven't flipped bearish yet.",
    drivers: [
      { type: 'verified', text: "Announced expanded collaboration with Google Cloud this week" },
      { type: 'inference', text: "Enterprise-infrastructure category momentum benefiting NTAP alongside peers" },
    ],
  },

  /* ===================== TSLA cluster ===================== */

  TSLA: {
    summary: "Strong gain heading into earnings. Wall Street preview verdicts are mixed but net-bullish in positioning; macro tailwinds (Hormuz-related energy easing, broad auto strength) add to the up-move.",
    drivers: [
      { type: 'verified', text: "Pre-earnings positioning building ahead of the upcoming TSLA report" },
      { type: 'inference', text: "Macro easing on energy/shipping lifting consumer-durables sentiment" },
      { type: 'inference', text: "Broad auto-complex strength on the day amplifies the move" },
    ],
  },

  GM: {
    summary: "Strong rally — biggest in the auto cluster — on Deutsche Bank's bullish upgrade despite Goldman Sachs trimming its valuation outlook the same week. When two major banks diverge, the upgrade side typically wins near-term narrative momentum, which is what's playing out here.",
    drivers: [
      { type: 'verified', text: "Deutsche Bank turned bullish on GM this week" },
      { type: 'verified', text: "Goldman Sachs lowered valuation outlook — did not override the upgrade momentum" },
    ],
  },

  F: {
    summary: "Solid rally despite two nominally negative headlines — a vehicle recall and the Model-E EV-chief departure. The market appears to be pricing the Model-E reorganization as a cost-discipline positive rather than a disruption.",
    drivers: [
      { type: 'verified', text: "Ford reorganized its Model E EV unit; new operations leadership announced" },
      { type: 'verified', text: "Recall headline did NOT materially dent the rally" },
      { type: 'inference', text: "Market interpreting restructuring as a streamlining/cost-cut positive" },
    ],
  },

  RIVN: {
    summary: "Rising with broader auto-complex strength plus a fresh battery-recycling partnership with Redwood Materials. The Redwood deal reinforces Rivian's sustainability narrative and diversifies strategic positioning beyond vehicle sales.",
    drivers: [
      { type: 'verified', text: "New partnership with Redwood Materials to repurpose used EV batteries" },
      { type: 'inference', text: "Broader auto-sector bid benefiting EV pure-plays together" },
    ],
  },

  THO: {
    summary: "Rising with the broader recreational-vehicle and watercraft sector today. No company-specific catalyst — this looks like sector rotation rather than news-driven movement.",
    drivers: [
      { type: 'verified', text: "Broad RV / recreational-vehicle sector trading higher on the day" },
      { type: 'inference', text: "Rate-cut expectations supporting consumer-durables cohorts" },
    ],
  },

  LCID: {
    summary: "Sharp decline — the only red name in the auto cluster today. No Lucid-specific negative headline surfaces clearly in the 30-day window; this looks like market-structure activity (profit-taking, funding-concern overhang) rather than fresh bad news.",
    drivers: [
      { type: 'inference', text: "Profit-taking after recent strength in the EV peer group" },
      { type: 'inference', text: "Cash-burn and funding-concern overhang remain structural" },
      { type: 'verified', text: "No discrete negative company-specific headline detected in the 30-day news window" },
    ],
  },

  /* ===================== SOXL cluster (extras) ===================== */

  SOXL: {
    summary: "Large gain because SOXL is a 3× leveraged semiconductor ETF — when the semi complex rises ~2-2.5%, SOXL triples that. Today's move reflects broad strength across its underlying holdings (NVDA, AVGO, AMD, TSM, INTC), not anything fund-specific.",
    drivers: [
      { type: 'verified', text: "3× leverage amplifies underlying semi-sector moves in both directions" },
      { type: 'verified', text: "Underlying holdings (NVDA, AVGO, TSM) all rose today" },
      { type: 'inference', text: "AI-infrastructure rotation back into leveraged semi exposure" },
    ],
  },

  TSM: {
    summary: "Rising on continued AI-accelerator TAM bullishness. Recent analyses argue investors still underestimate the addressable market for AI chips, with TSMC as the sole leading-edge fabrication partner. ASML-bottleneck commentary reinforces TSMC's scarcity value.",
    drivers: [
      { type: 'verified', text: "Recent bullish TAM analyses for AI accelerators circulating this week" },
      { type: 'verified', text: "ASML EUV-bottleneck commentary reinforcing TSMC's irreplaceability" },
    ],
  },

};
