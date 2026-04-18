/* ============================================================
   Bachat — Network explorer
   Interactive knowledge graph of related companies around a
   focus ticker. Data: window.BACHAT_CLUSTERS (real Finnhub),
   summaries: window.BACHAT_SUMMARIES (synthesized).
   ============================================================ */

(function () {
  'use strict';

  const graphWrap  = document.querySelector('[data-graph-wrap]');
  if (!graphWrap) return;
  const tooltipEl  = document.querySelector('[data-graph-tooltip]');
  const sidePanel  = document.querySelector('[data-graph-side]');
  const chipBar    = document.querySelector('[data-cluster-chips]');
  const customIn   = document.querySelector('[data-custom-ticker]');
  const customBtn  = document.querySelector('[data-custom-load]');
  const infoChip   = document.querySelector('[data-graph-info]');
  const canvasWrap = document.querySelector('.graph-canvas-wrap');

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let currentData = null;
  let moverBadge = null;

  /* ---------- helpers ---------- */

  const SUMMARIES = () => window.BACHAT_SUMMARIES || {};

  function colorFor(pct) {
    if (pct == null || isNaN(pct) || Math.abs(pct) < 0.5) return '#6B6B7E';
    const intensity = Math.min(Math.abs(pct) / 8, 1);
    const a = 0.45 + 0.5 * intensity;
    return pct > 0
      ? `rgba(16, 185, 129, ${a.toFixed(2)})`
      : `rgba(239, 68, 68, ${a.toFixed(2)})`;
  }

  function strokeFor(pct) {
    if (pct == null || isNaN(pct) || Math.abs(pct) < 0.5) return '#4A4A5E';
    return pct > 0 ? '#10B981' : '#EF4444';
  }

  function sizeFor(marketCap, allCaps) {
    const caps = allCaps.filter(c => c > 0);
    if (!caps.length) return 40;
    const logs = caps.map(Math.log);
    const mn = Math.min(...logs), mx = Math.max(...logs);
    if (!marketCap || marketCap <= 0) return 30;
    if (mx === mn) return 44;
    const t = (Math.log(marketCap) - mn) / (mx - mn);
    return 32 + 30 * t;                         // [32, 62]
  }

  function formatMktCap(m) {
    if (!m) return '—';
    const v = m * 1e6;
    if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
    if (v >= 1e9)  return '$' + (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6)  return '$' + (v / 1e6).toFixed(1) + 'M';
    return '$' + Math.round(v);
  }

  const fmtPrice = p => p == null ? '—' : '$' + p.toFixed(2);
  const fmtPct   = p => (p == null || isNaN(p)) ? '—' : (p >= 0 ? '+' : '') + p.toFixed(2) + '%';
  const fmtDate  = t => new Date(t * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  /* ---------- render graph ---------- */

  function renderGraph(data) {
    currentData = data;
    graphWrap.innerHTML = '';
    if (moverBadge) { moverBadge.remove(); moverBadge = null; }

    const W = 800, H = 560, cx = W / 2, cy = H / 2;

    const allCaps = [
      data.center.profile.marketCapitalization || 0,
      ...data.peers.map(p => p.profile?.marketCapitalization || 0),
    ];

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    // <defs> with gradients
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = `
      <radialGradient id="nodeGradUp" cx="35%" cy="30%" r="75%">
        <stop offset="0%"  stop-color="#10B981" stop-opacity="1"/>
        <stop offset="55%" stop-color="#10B981" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#065F46" stop-opacity="0.75"/>
      </radialGradient>
      <radialGradient id="nodeGradDown" cx="35%" cy="30%" r="75%">
        <stop offset="0%"  stop-color="#F87171" stop-opacity="1"/>
        <stop offset="55%" stop-color="#EF4444" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#7F1D1D" stop-opacity="0.75"/>
      </radialGradient>
      <radialGradient id="nodeGradFlat" cx="35%" cy="30%" r="75%">
        <stop offset="0%"  stop-color="#64748B" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#334155" stop-opacity="0.8"/>
      </radialGradient>
      <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="centerGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="8" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
    svg.appendChild(defs);
    graphWrap.appendChild(svg);

    // Background subtle grid rings
    [80, 140, 210].forEach((r, i) => {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', 'rgba(139, 92, 246, ' + (0.08 - i * 0.02) + ')');
      c.setAttribute('stroke-width', '1');
      c.setAttribute('stroke-dasharray', '2 6');
      svg.appendChild(c);
    });

    // Peer positions
    const peers = data.peers.slice(0, 5);
    const radius = 210;
    const peerPos = peers.map((p, i) => {
      const angle = (-Math.PI / 2) + i * (2 * Math.PI / peers.length);
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        data: p,
      };
    });

    // 1. Curved edges
    peerPos.forEach(p => {
      const mx = (cx + p.x) / 2;
      const my = (cy + p.y) / 2;
      // Offset perpendicular for a gentle curve
      const dx = p.x - cx, dy = p.y - cy;
      const len = Math.hypot(dx, dy);
      const nx = -dy / len, ny = dx / len;
      const curve = 20;
      const ctrlX = mx + nx * curve;
      const ctrlY = my + ny * curve;

      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', `M ${cx} ${cy} Q ${ctrlX} ${ctrlY} ${p.x} ${p.y}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'var(--accent-primary)');
      path.setAttribute('stroke-width', '1.2');
      path.setAttribute('class', 'graph-edge');
      svg.appendChild(path);
    });

    // 2. Pulse rings around center
    const centerR = sizeFor(data.center.profile.marketCapitalization, allCaps) + 8;
    [0, 1].forEach(i => {
      const p = document.createElementNS(SVG_NS, 'circle');
      p.setAttribute('cx', cx);
      p.setAttribute('cy', cy);
      p.setAttribute('r', centerR);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', strokeFor(data.center.quote?.dp));
      p.setAttribute('stroke-width', '2');
      p.setAttribute('class', 'graph-pulse' + (i === 1 ? ' graph-pulse-2' : ''));
      svg.appendChild(p);
    });

    // 3. Center node
    svg.appendChild(makeNode({
      cx, cy, isCenter: true,
      ticker: data.center.ticker,
      meta: {
        ticker: data.center.ticker,
        name: data.center.profile?.name,
        marketCap: data.center.profile?.marketCapitalization,
        industry: data.center.profile?.finnhubIndustry,
        quote: data.center.quote,
        news: data.news || [],
        isCenter: true,
      },
      allCaps,
      classMod: 'center',
    }));

    // 4. Peer nodes
    peerPos.forEach((pp, i) => {
      svg.appendChild(makeNode({
        cx: pp.x, cy: pp.y, isCenter: false,
        ticker: pp.data.ticker,
        meta: {
          ticker: pp.data.ticker,
          name: pp.data.profile?.name,
          marketCap: pp.data.profile?.marketCapitalization,
          industry: pp.data.profile?.finnhubIndustry,
          quote: pp.data.quote,
          news: pp.data.news || [],
          isCenter: false,
        },
        allCaps,
        classMod: 'peer-' + i,
      }));
    });

    // Mover badge: biggest abs %
    const allWithMeta = [
      { ticker: data.center.ticker, dp: data.center.quote?.dp, x: cx, y: cy },
      ...peerPos.map(p => ({ ticker: p.data.ticker, dp: p.data.quote?.dp, x: p.x, y: p.y })),
    ];
    const biggest = allWithMeta.reduce((a, b) =>
      (Math.abs(b.dp ?? 0) > Math.abs(a.dp ?? 0) ? b : a)
    );
    if (biggest && biggest.ticker !== data.center.ticker && Math.abs(biggest.dp ?? 0) >= 2) {
      moverBadge = document.createElement('div');
      moverBadge.className = 'mover-badge';
      moverBadge.textContent = '↑ Biggest mover';
      // Position via percent of canvas
      const pctX = (biggest.x / W) * 100;
      const pctY = (biggest.y / H) * 100;
      moverBadge.style.left = `calc(${pctX}% + 0px)`;
      moverBadge.style.top  = `calc(${pctY}% - 55px)`;
      canvasWrap.appendChild(moverBadge);
    }

    if (infoChip) {
      const d = new Date(data.fetchedAt);
      infoChip.textContent = 'Live data · fetched ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  }

  function makeNode({ cx, cy, isCenter, ticker, meta, allCaps, classMod }) {
    // Outer wrapper holds the translate (SVG attribute, untouched by CSS).
    const wrap = document.createElementNS(SVG_NS, 'g');
    wrap.setAttribute('transform', `translate(${cx}, ${cy})`);

    // Inner group holds the CSS scale/opacity animation so it cannot
    // overwrite the outer translate.
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'graph-node-group ' + classMod);
    g.dataset.ticker = ticker;

    const dp = meta.quote?.dp ?? null;
    const r = sizeFor(meta.marketCap, allCaps) + (isCenter ? 10 : 0);
    const gradId = (dp == null || Math.abs(dp) < 0.5) ? 'nodeGradFlat'
                   : (dp > 0 ? 'nodeGradUp' : 'nodeGradDown');
    const stroke = strokeFor(dp);

    const ring = document.createElementNS(SVG_NS, 'circle');
    ring.setAttribute('cx', 0); ring.setAttribute('cy', 0);
    ring.setAttribute('r', r + 3);
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', stroke);
    ring.setAttribute('stroke-width', isCenter ? 2 : 1.2);
    ring.setAttribute('stroke-opacity', isCenter ? 0.7 : 0.45);
    g.appendChild(ring);

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', 0); circle.setAttribute('cy', 0);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', `url(#${gradId})`);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', isCenter ? 2.5 : 1.5);
    circle.setAttribute('class', 'graph-node-circle');
    if (isCenter) circle.setAttribute('filter', 'url(#centerGlow)');
    g.appendChild(circle);

    const hl = document.createElementNS(SVG_NS, 'circle');
    hl.setAttribute('cx', -r * 0.35);
    hl.setAttribute('cy', -r * 0.35);
    hl.setAttribute('r', r * 0.25);
    hl.setAttribute('fill', 'rgba(255, 255, 255, 0.15)');
    hl.setAttribute('pointer-events', 'none');
    g.appendChild(hl);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'graph-node-label');
    label.setAttribute('x', 0);
    label.setAttribute('y', dp != null && Math.abs(dp) >= 0.1 ? -6 : 0);
    label.textContent = ticker;
    if (isCenter) label.setAttribute('font-size', '16');
    g.appendChild(label);

    if (dp != null && Math.abs(dp) >= 0.1) {
      const sub = document.createElementNS(SVG_NS, 'text');
      sub.setAttribute('class', 'graph-node-sublabel');
      sub.setAttribute('x', 0);
      sub.setAttribute('y', 10);
      sub.setAttribute('fill', '#FFFFFF');
      sub.setAttribute('fill-opacity', '0.9');
      sub.textContent = fmtPct(dp);
      g.appendChild(sub);
    }

    g._meta = meta;
    g.addEventListener('mouseenter', () => showTooltip(g));
    g.addEventListener('mousemove',  (e) => moveTooltip(e));
    g.addEventListener('mouseleave', () => hideTooltip());
    g.addEventListener('click', () => openSidePanel(g._meta));

    wrap.appendChild(g);
    return wrap;
  }

  /* ---------- tooltip ---------- */

  function showTooltip(nodeGroup) {
    const m = nodeGroup._meta;
    const dp = m.quote?.dp ?? null;
    const cls = dp == null ? 'flat' : (dp > 0 ? 'up' : 'down');
    tooltipEl.innerHTML = `
      <span class="tt-ticker">${m.ticker}</span>
      <span class="tt-name">${m.name || ''}</span>
      <span class="tt-change ${cls}">${fmtPct(dp)} today</span>
    `;
    tooltipEl.classList.add('visible');
  }

  function moveTooltip(e) {
    const rect = canvasWrap.getBoundingClientRect();
    const x = e.clientX - rect.left + 14;
    const y = e.clientY - rect.top + 14;
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;
    tooltipEl.style.left = Math.min(x, rect.width - tw - 6) + 'px';
    tooltipEl.style.top  = Math.min(y, rect.height - th - 6)  + 'px';
  }

  function hideTooltip() {
    tooltipEl.classList.remove('visible');
  }

  /* ---------- side panel ---------- */

  function openSidePanel(meta) {
    if (!sidePanel) return;
    const dp = meta.quote?.dp ?? null;
    const cls = dp == null ? 'flat' : (dp > 0 ? 'up' : 'down');

    const s = SUMMARIES()[meta.ticker];
    const summaryHTML = s
      ? `<div class="summary-card">${s.summary}</div>`
      : `<div class="summary-card" style="font-style: italic; color: var(--text-secondary);">
           No synthesized driver summary for <strong>${meta.ticker}</strong>.
           In the real build, Claude generates this on-demand with anti-prediction guardrails.
         </div>`;

    const driversHTML = s && s.drivers && s.drivers.length ? `
      <div class="side-section-label">Likely drivers</div>
      <div class="drivers-list">
        ${s.drivers.map(d => `
          <div class="driver">
            <span class="driver-tag ${d.type}">${d.type === 'verified' ? 'verified' : 'inference'}</span>
            <div>${d.text}</div>
          </div>
        `).join('')}
      </div>
    ` : '';

    const news = (meta.news || []).slice(0, 4);
    const newsHTML = news.length ? `
      <div class="supporting-news" data-collapsible>
        <div class="collapse-head">
          <span class="collapse-title">Supporting headlines · ${news.length}</span>
          <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="supporting-body">
          ${news.map(n => `
            <a class="news-mini" href="${n.url}" target="_blank" rel="noopener">
              <div class="mn-headline">${n.headline}</div>
              <div class="mn-meta">${n.source || ''} · ${n.datetime ? fmtDate(n.datetime) : ''}</div>
            </a>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Competitors list (exclude the currently shown ticker)
    const others = [
      { ticker: currentData.center.ticker, quote: currentData.center.quote, profile: currentData.center.profile, isCenter: true, news: currentData.news },
      ...currentData.peers.map(p => ({ ticker: p.ticker, quote: p.quote, profile: p.profile, isCenter: false, news: p.news })),
    ].filter(x => x.ticker !== meta.ticker).slice(0, 5);

    const compHTML = others.length ? `
      <div class="side-section-sep"></div>
      <div class="side-section-label">Explore other ${meta.isCenter ? 'peers' : 'companies'} in this cluster</div>
      <div class="competitor-list">
        ${others.map(o => {
          const odp = o.quote?.dp ?? null;
          const oCls = odp == null ? '' : (odp > 0 ? 'up' : 'down');
          const nm  = (o.profile?.name || '').slice(0, 16);
          return `
            <div class="competitor-chip" data-ticker="${o.ticker}">
              <div>
                <div class="ct-ticker">${o.ticker}</div>
                <div class="ct-name">${nm}</div>
              </div>
              <div class="ct-change ${oCls}">${fmtPct(odp)}</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : '';

    sidePanel.innerHTML = `
      <div class="side-hero">
        <div class="row-top">
          <div>
            <div class="ticker-line">${meta.ticker}</div>
            <div class="name-line">${meta.name || '—'}</div>
            ${meta.industry ? `<div><span class="industry-tag">${meta.industry}</span></div>` : ''}
          </div>
          <div style="text-align: right;">
            <div class="pct-big ${cls}">${fmtPct(dp)}</div>
            <div class="sub-line">${fmtPrice(meta.quote?.c)} today</div>
          </div>
        </div>
        <div class="marketcap-row">
          <span class="k">Market cap</span>
          <span class="v">${formatMktCap(meta.marketCap)}</span>
        </div>
        <div class="marketcap-row">
          <span class="k">Day range</span>
          <span class="v">${fmtPrice(meta.quote?.l)} – ${fmtPrice(meta.quote?.h)}</span>
        </div>
      </div>

      ${summaryHTML}
      ${driversHTML}
      ${newsHTML}
      ${compHTML}

      <div class="side-disclaimer">
        Drivers are Claude-synthesized in the real build (with anti-prediction guardrails). News headlines are real and pulled from Finnhub. This panel does not predict future prices and is not investment advice.
      </div>
    `;

    // Wire up collapsibles
    sidePanel.querySelectorAll('[data-collapsible]').forEach(el => {
      const head = el.querySelector('.collapse-head');
      head.addEventListener('click', () => el.classList.toggle('open'));
    });

    // Wire up competitor chips — pivot side panel to clicked ticker
    sidePanel.querySelectorAll('.competitor-chip[data-ticker]').forEach(chip => {
      chip.addEventListener('click', () => {
        const target = chip.getAttribute('data-ticker');
        const all = [
          { ticker: currentData.center.ticker, profile: currentData.center.profile, quote: currentData.center.quote, news: currentData.news, isCenter: true },
          ...currentData.peers.map(p => ({
            ticker: p.ticker, profile: p.profile, quote: p.quote, news: p.news, isCenter: false,
          })),
        ];
        const hit = all.find(x => x.ticker === target);
        if (hit) openSidePanel({
          ticker: hit.ticker,
          name: hit.profile?.name,
          marketCap: hit.profile?.marketCapitalization,
          industry: hit.profile?.finnhubIndustry,
          quote: hit.quote,
          news: hit.news,
          isCenter: hit.isCenter,
        });
      });
    });
  }

  function showEmptyPanel() {
    if (!sidePanel) return;
    sidePanel.innerHTML = `
      <div class="empty">
        <div>
          <div class="icon-wrap">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6M12 17v6M1 12h6M17 12h6"/>
            </svg>
          </div>
          <h4>Click a node to explore</h4>
          <p style="font-size: 0.85rem; line-height: 1.5;">
            Hover any company to see today's change. Click for the likely drivers of that move — distinguishing <em>verified events</em> from <em>pattern-matching inference</em> — plus supporting headlines and competitors.
          </p>
        </div>
      </div>
    `;
  }

  /* ---------- load ---------- */

  function loadCluster(ticker) {
    const up = ticker.toUpperCase();
    const clusters = window.BACHAT_CLUSTERS || {};
    const data = clusters[up];
    if (!data) {
      graphWrap.innerHTML = `
        <div style="padding: 3rem; text-align: center; color: var(--text-secondary);">
          <p style="font-family: 'Lora', serif; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.75rem;">
            No cluster data for <strong>${up}</strong> yet.
          </p>
          <p style="font-size: 0.9rem; max-width: 420px; margin: 0 auto; line-height: 1.5;">
            Fixtures available: <code>${Object.keys(clusters).join(', ')}</code>.
            In the real build, typing a new ticker calls the Finnhub API via a server-side proxy.
          </p>
        </div>
      `;
      if (sidePanel) showEmptyPanel();
      if (infoChip) infoChip.textContent = '';
      if (moverBadge) { moverBadge.remove(); moverBadge = null; }
      return;
    }
    renderGraph(data);
    showEmptyPanel();
    if (chipBar) {
      chipBar.querySelectorAll('.cluster-chip').forEach(c => c.classList.remove('active'));
      const chip = chipBar.querySelector(`[data-cluster="${up}"]`);
      if (chip) chip.classList.add('active');
    }
    // Auto-open center after a short delay so user sees the graph first
    setTimeout(() => {
      openSidePanel({
        ticker: data.center.ticker,
        name: data.center.profile?.name,
        marketCap: data.center.profile?.marketCapitalization,
        industry: data.center.profile?.finnhubIndustry,
        quote: data.center.quote,
        news: data.news || [],
        isCenter: true,
      });
    }, 600);
  }

  /* ---------- wire controls ---------- */

  if (chipBar) {
    chipBar.querySelectorAll('.cluster-chip').forEach(c => {
      c.addEventListener('click', () => loadCluster(c.getAttribute('data-cluster')));
    });
  }
  if (customBtn && customIn) {
    const go = () => { const v = customIn.value.trim(); if (v) loadCluster(v); };
    customBtn.addEventListener('click', go);
    customIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  }

  // Tab switching
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.add('active');
    });
  });

  // Init
  showEmptyPanel();
  loadCluster('NVDA');
})();
