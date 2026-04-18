/* ============================================================
   Bachat — Network explorer
   Renders a force-style knowledge graph of related companies
   around a focus ticker. Data comes from JSON fixtures in
   mockup/data/ (pre-fetched from Finnhub once, no keys in repo).
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

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CENTERS = ['NVDA', 'AAPL', 'TSLA', 'SOXL'];
  let currentData = null;

  /* --- color + size helpers --- */

  function colorFor(pct) {
    if (pct == null || isNaN(pct) || Math.abs(pct) < 0.5) return '#6B6B7E';
    const intensity = Math.min(Math.abs(pct) / 8, 1);      // 8% = full saturation
    const alpha = 0.45 + 0.5 * intensity;
    return pct > 0
      ? `rgba(16, 185, 129, ${alpha.toFixed(2)})`          // jade
      : `rgba(239, 68, 68, ${alpha.toFixed(2)})`;          // crimson
  }

  function strokeFor(pct) {
    if (pct == null || isNaN(pct) || Math.abs(pct) < 0.5) return '#4A4A5E';
    return pct > 0 ? '#10B981' : '#EF4444';
  }

  function sizeFor(marketCap, allCaps) {
    if (!marketCap || marketCap <= 0) return 32;
    const logs = allCaps.filter(c => c > 0).map(Math.log);
    const mn = Math.min(...logs), mx = Math.max(...logs);
    if (mx === mn) return 42;
    const t = (Math.log(marketCap) - mn) / (mx - mn);
    return 30 + 30 * t;                                     // [30, 60] px radius
  }

  function formatMktCap(millionsUSD) {
    if (!millionsUSD) return '—';
    const v = millionsUSD * 1e6;
    if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
    if (v >= 1e9)  return '$' + (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6)  return '$' + (v / 1e6).toFixed(1) + 'M';
    return '$' + v.toFixed(0);
  }

  function formatPrice(p) {
    if (p == null) return '—';
    return '$' + p.toFixed(2);
  }

  function formatPct(p) {
    if (p == null || isNaN(p)) return '—';
    const sign = p >= 0 ? '+' : '';
    return sign + p.toFixed(2) + '%';
  }

  function formatDate(unixSec) {
    const d = new Date(unixSec * 1000);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /* --- render graph --- */

  function renderGraph(data) {
    currentData = data;
    graphWrap.innerHTML = '';                               // clear

    const width  = 800;
    const height = 560;
    const cx = width / 2, cy = height / 2;

    // Collect all market caps for size scaling
    const allCaps = [
      data.center.profile.marketCapitalization || 0,
      ...data.peers.map(p => p.profile?.marketCapitalization || 0),
    ];

    // SVG root
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    graphWrap.appendChild(svg);

    // Peers positioned radially around center
    const peers = data.peers.slice(0, 5);
    const radius = 205;
    const peerPositions = peers.map((p, i) => {
      // Start from -90° (top) and go clockwise, 72° apart
      const angle = (-Math.PI / 2) + (i * (2 * Math.PI / Math.max(peers.length, 1)));
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        data: p,
      };
    });

    // 1. Edges (render first, so nodes sit on top)
    peerPositions.forEach(p => {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', p.x);
      line.setAttribute('y2', p.y);
      line.setAttribute('class', 'graph-edge');
      svg.appendChild(line);
    });

    // 2. Center node
    const centerNode = makeNode({
      cx, cy,
      ticker: data.center.ticker,
      name: data.center.profile.name,
      marketCap: data.center.profile.marketCapitalization,
      quote: data.center.quote,
      industry: data.center.profile.finnhubIndustry,
      allCaps,
      isCenter: true,
    });
    svg.appendChild(centerNode);

    // 3. Peer nodes
    peerPositions.forEach(pp => {
      const node = makeNode({
        cx: pp.x, cy: pp.y,
        ticker: pp.data.ticker,
        name: pp.data.profile?.name,
        marketCap: pp.data.profile?.marketCapitalization,
        quote: pp.data.quote,
        industry: pp.data.profile?.finnhubIndustry,
        allCaps,
        isCenter: false,
      });
      svg.appendChild(node);
    });

    // Info chip: how fresh the data is
    if (infoChip) {
      const fetchedAt = new Date(data.fetchedAt);
      infoChip.textContent = 'Live data · fetched ' + fetchedAt.toLocaleDateString();
    }
  }

  function makeNode({ cx, cy, ticker, name, marketCap, quote, industry, allCaps, isCenter }) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'graph-node-group');
    g.setAttribute('transform', `translate(${cx}, ${cy})`);
    g.dataset.ticker = ticker;

    const dp = quote?.dp ?? null;
    const r = sizeFor(marketCap, allCaps) + (isCenter ? 8 : 0);
    const fill = colorFor(dp);
    const stroke = strokeFor(dp);

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', 0);
    circle.setAttribute('cy', 0);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', fill);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', isCenter ? 2.5 : 1.5);
    circle.setAttribute('class', 'graph-node-circle');
    g.appendChild(circle);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'graph-node-label');
    label.setAttribute('x', 0);
    label.setAttribute('y', 0);
    label.textContent = ticker;
    g.appendChild(label);

    // state for hover/click
    g._meta = { ticker, name, marketCap, quote, industry, isCenter };

    // hover
    g.addEventListener('mouseenter', () => showTooltip(g));
    g.addEventListener('mousemove',  (e) => moveTooltip(e));
    g.addEventListener('mouseleave', () => hideTooltip());

    // click
    g.addEventListener('click', () => openSidePanel(g._meta));

    return g;
  }

  /* --- tooltip --- */

  function showTooltip(nodeGroup) {
    const m = nodeGroup._meta;
    const dp = m.quote?.dp ?? null;
    const cls = dp == null ? 'flat' : (dp > 0 ? 'up' : 'down');
    tooltipEl.innerHTML = `
      <span class="tt-ticker">${m.ticker}</span>
      <span class="tt-name">${m.name || '—'}</span>
      <span class="tt-change ${cls}">${formatPct(dp)}</span>
    `;
    tooltipEl.classList.add('visible');
  }

  function moveTooltip(e) {
    const wrapRect = graphWrap.getBoundingClientRect();
    const x = e.clientX - wrapRect.left + 14;
    const y = e.clientY - wrapRect.top + 14;
    tooltipEl.style.left = Math.min(x, wrapRect.width - 160) + 'px';
    tooltipEl.style.top  = Math.min(y, wrapRect.height - 90)  + 'px';
  }

  function hideTooltip() {
    tooltipEl.classList.remove('visible');
  }

  /* --- side panel --- */

  function openSidePanel(meta) {
    if (!sidePanel) return;
    const isCenter = meta.isCenter;
    const dp = meta.quote?.dp ?? null;
    const changeCls = dp == null ? '' : (dp > 0 ? 'up' : 'down');

    // Build competitors list (other peers in cluster)
    const others = currentData.peers
      .filter(p => p.ticker !== meta.ticker)
      .slice(0, 4);
    const othersHTML = others.map(p => {
      const pdp = p.quote?.dp ?? null;
      const pCls = pdp == null ? '' : (pdp > 0 ? 'up' : 'down');
      return `
        <div class="competitor-chip" data-peer="${p.ticker}">
          <div>
            <div class="ct-ticker">${p.ticker}</div>
            <div class="ct-name">${(p.profile?.name || '').slice(0, 18)}</div>
          </div>
          <div class="ct-change ${pCls}">${formatPct(pdp)}</div>
        </div>
      `;
    }).join('');

    // News: only for center. For peers, just show cluster competitors.
    const newsHTML = isCenter
      ? (currentData.news && currentData.news.length
          ? currentData.news.slice(0, 5).map(n => `
              <a class="news-item" href="${n.url}" target="_blank" rel="noopener">
                <div class="news-headline">${n.headline}</div>
                <div class="news-meta">${n.source} · ${formatDate(n.datetime)}</div>
              </a>
            `).join('')
          : '<p style="color: var(--text-muted); font-size: 0.85rem;">No recent news found.</p>'
        )
      : `<p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">
           This is a peer of <strong>${currentData.center.ticker}</strong>.
           Click the center node to see news that moved this cluster.
         </p>`;

    const industryRow = meta.industry
      ? `<div class="marketcap-row"><span class="k">Industry</span><span class="v">${meta.industry}</span></div>`
      : '';

    sidePanel.innerHTML = `
      <div class="side-top">
        <div>
          <div class="ticker-lg">${meta.ticker}</div>
          <div class="name">${meta.name || '—'}</div>
          ${meta.industry ? `<span class="industry">${meta.industry}</span>` : ''}
        </div>
        <div class="price-block">
          <div class="price-now">${formatPrice(meta.quote?.c)}</div>
          <div class="price-change ${changeCls}">${formatPct(dp)} today</div>
        </div>
      </div>

      <div>
        ${industryRow}
        <div class="marketcap-row"><span class="k">Market cap</span><span class="v">${formatMktCap(meta.marketCap)}</span></div>
        <div class="marketcap-row"><span class="k">Day range</span>
          <span class="v">${formatPrice(meta.quote?.l)} – ${formatPrice(meta.quote?.h)}</span></div>
        <div class="marketcap-row"><span class="k">Prev close</span><span class="v">${formatPrice(meta.quote?.pc)}</span></div>
      </div>

      <div>
        <div class="side-section-label">${isCenter ? 'What moved this stock recently' : 'In this cluster'}</div>
        ${isCenter ? `<div class="news-list">${newsHTML}</div>` : newsHTML}
      </div>

      ${isCenter && others.length ? `
        <div>
          <div class="side-section-label">Top competitors in this cluster</div>
          <div class="competitor-list">${othersHTML}</div>
        </div>
      ` : ''}

      <div class="side-disclaimer">
        News is real and sourced from Finnhub. This panel does not predict future prices and is not investment advice.
      </div>
    `;

    // Wire competitor chip clicks to navigate to that peer's data
    sidePanel.querySelectorAll('[data-peer]').forEach(chip => {
      chip.addEventListener('click', () => {
        const target = chip.getAttribute('data-peer');
        const peer = currentData.peers.find(p => p.ticker === target);
        if (peer) {
          openSidePanel({
            ticker: peer.ticker,
            name: peer.profile?.name,
            marketCap: peer.profile?.marketCapitalization,
            quote: peer.quote,
            industry: peer.profile?.finnhubIndustry,
            isCenter: false,
          });
        }
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
            Hover any company to see today's change.
            Click the center node for news and what drove the move.
            Click a peer to compare within the cluster.
          </p>
        </div>
      </div>
    `;
  }

  /* --- load cluster data --- */

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
            The mockup ships with pre-fetched fixtures for <code>${Object.keys(clusters).join(', ')}</code>.
            In the real build, typing a new ticker here would call the Finnhub API via a server-side proxy.
          </p>
        </div>
      `;
      if (sidePanel) showEmptyPanel();
      if (infoChip) infoChip.textContent = '';
      return;
    }
    renderGraph(data);
    showEmptyPanel();
    if (chipBar) {
      chipBar.querySelectorAll('.cluster-chip').forEach(c => c.classList.remove('active'));
      const chip = chipBar.querySelector(`[data-cluster="${up}"]`);
      if (chip) chip.classList.add('active');
    }
  }

  /* --- wire controls --- */

  if (chipBar) {
    chipBar.querySelectorAll('.cluster-chip').forEach(chip => {
      chip.addEventListener('click', () => loadCluster(chip.getAttribute('data-cluster')));
    });
  }

  if (customBtn && customIn) {
    const trigger = () => {
      const val = customIn.value.trim();
      if (val) loadCluster(val);
    };
    customBtn.addEventListener('click', trigger);
    customIn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); trigger(); }
    });
  }

  /* --- tab switching (Holdings / Network) --- */

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

  /* --- init --- */

  showEmptyPanel();
  loadCluster('NVDA');
})();
