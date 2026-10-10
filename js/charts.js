/* Minimal SVG chart kit for the results section: horizontal bars, a labeled
   scatter, and table twins. No dependencies. Emphasis form: the CARE row
   wears the accent, everything else the de-emphasis gray. */
window.BWA = window.BWA || {};
(function (B) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const C = { accent: '#e86f00', gray: '#c6c2b8', ink: '#0a0a0a', muted: '#7a786f', hair: '#e8e6e0', axis: '#c9c6bd' };

  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(parent, x, y, str, attrs) {
    const t = svgEl('text', Object.assign({ x, y }, attrs || {}), parent);
    t.textContent = str;
    return t;
  }

  /* ---- tooltip (one for the page) ---- */
  let tip = null;
  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.className = 'tip';
    tip.hidden = true;
    document.body.appendChild(tip);
    return tip;
  }
  function showTip(rows, ev) {
    const t = ensureTip();
    t.textContent = '';
    for (const r of rows) {
      const d = document.createElement('div');
      d.className = 'tip-row' + (r.strong ? ' strong' : '');
      const v = document.createElement('span'); v.className = 'tip-v'; v.textContent = r.v;
      const k = document.createElement('span'); k.className = 'tip-k'; k.textContent = r.k;
      d.append(k, v);
      t.appendChild(d);
    }
    t.hidden = false;
    moveTip(ev);
  }
  function moveTip(ev) {
    const t = ensureTip();
    const pad = 14;
    const r = t.getBoundingClientRect();
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - pad;
    t.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }
  function hideTip() { if (tip) tip.hidden = true; }
  function bindHover(target, group, rows) {
    target.addEventListener('pointerenter', ev => { if (group) group.classList.add('hover'); if (rows) showTip(rows, ev); });
    target.addEventListener('pointermove', ev => { if (rows) moveTip(ev); });
    target.addEventListener('pointerleave', () => { if (group) group.classList.remove('hover'); hideTip(); });
  }

  /* ---- horizontal bars ----
     opts.rows: [{label, value, emphasis, tip:[{k,v,strong}], header}]
     opts.max, opts.format(v) -> string, opts.note(row) -> string (muted, after the value) */
  function hbar(host, opts) {
    host.textContent = '';
    const W = Math.max(280, host.clientWidth || 600);
    const stacked = W < 560;
    const labelW = stacked ? 0 : Math.min(230, Math.round(W * 0.36));
    const valueW = opts.valueW || (stacked ? 96 : 120);
    const rowH = stacked ? 48 : 34, headH = stacked ? 34 : 30, top = 6, barH = 14;
    let H = top;
    for (const r of opts.rows) H += r.header ? headH : rowH;
    H += 6;
    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': opts.aria || '' }, host);
    const x0 = labelW, plotW = W - labelW - valueW;
    const scale = v => x0 + (Math.max(0, v) / opts.max) * plotW;
    svgEl('line', { x1: x0 + 0.5, x2: x0 + 0.5, y1: top, y2: H - 6, stroke: C.hair }, svg);
    let y = top;
    for (const r of opts.rows) {
      if (r.header) {
        text(svg, x0 + (stacked ? 0 : 0), y + (stacked ? 22 : 20), r.label, { class: 'hb-head', 'text-anchor': 'start' });
        y += headH; continue;
      }
      const g = svgEl('g', { class: 'hb-row' + (r.emphasis ? ' is-ours' : '') }, svg);
      const cy = stacked ? y + 34 : y + rowH / 2;
      const w = scale(r.value) - x0;
      const rr = Math.min(4, w / 2), by = cy - barH / 2;
      if (w > 0) {
        const d = 'M' + x0 + ',' + by + ' H' + (x0 + w - rr) + ' a' + rr + ',' + rr + ' 0 0 1 ' + rr + ',' + rr +
                  ' V' + (by + barH - rr) + ' a' + rr + ',' + rr + ' 0 0 1 -' + rr + ',' + rr + ' H' + x0 + ' Z';
        svgEl('path', { d, fill: r.emphasis ? C.accent : C.gray, class: 'hb-bar' }, g);
      }
      if (stacked) text(g, 0, y + 16, r.label, { class: 'hb-label' });
      else text(g, x0 - 10, cy + 4.5, r.label, { class: 'hb-label', 'text-anchor': 'end' });
      const vt = text(g, x0 + Math.max(w, 0) + 8, cy + 4.5, opts.format(r.value), { class: 'hb-value' });
      const note = opts.note ? opts.note(r) : '';
      if (note) {
        const ts = svgEl('tspan', { class: 'hb-note', dx: 8 }, vt);
        ts.textContent = note;
      }
      const hit = svgEl('rect', { x: 0, y, width: W, height: rowH, fill: 'transparent', class: 'hb-hit' }, g);
      bindHover(hit, g, r.tip);
      y += rowH;
    }
    return svg;
  }

  /* ---- scatter with direct labels ----
     opts.points: [{label, x, y, emphasis, lx, ly, anchor, tip}] */
  function scatter(host, opts) {
    host.textContent = '';
    const W = Math.max(280, host.clientWidth || 600);
    const H = Math.round(Math.min(400, Math.max(260, W * 0.5)));
    const m = { l: 44, r: 24, t: 22, b: 46 };
    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': opts.aria || '' }, host);
    const [xmin, xmax] = opts.xr, [ymin, ymax] = opts.yr;
    const sx = v => m.l + (v - xmin) / (xmax - xmin) * (W - m.l - m.r);
    const sy = v => H - m.b - (v - ymin) / (ymax - ymin) * (H - m.t - m.b);
    for (const t of opts.yTicks) {
      svgEl('line', { x1: m.l, x2: W - m.r, y1: sy(t) + 0.5, y2: sy(t) + 0.5, class: 'sc-grid' }, svg);
      text(svg, m.l - 8, sy(t) + 4, String(t), { class: 'sc-tick', 'text-anchor': 'end' });
    }
    for (const t of opts.xTicks) {
      text(svg, sx(t), H - m.b + 18, String(t), { class: 'sc-tick', 'text-anchor': 'middle' });
    }
    svgEl('line', { x1: m.l + 0.5, x2: m.l + 0.5, y1: m.t, y2: H - m.b, class: 'sc-axis' }, svg);
    svgEl('line', { x1: m.l, x2: W - m.r, y1: H - m.b + 0.5, y2: H - m.b + 0.5, class: 'sc-axis' }, svg);
    text(svg, W - m.r, H - m.b + 36, opts.xLabel, { class: 'sc-title', 'text-anchor': 'end' });
    text(svg, m.l, m.t - 8, opts.yLabel, { class: 'sc-title', 'text-anchor': 'start' });
    const narrow = W < 520;
    for (const p of opts.points) {
      const g = svgEl('g', { class: 'sc-row' + (p.emphasis ? ' is-ours' : '') }, svg);
      const cx = sx(p.x), cy = sy(p.y);
      svgEl('circle', { cx, cy, r: p.emphasis ? 7 : 6, fill: p.emphasis ? C.accent : C.gray, stroke: '#fff', 'stroke-width': 2, class: 'sc-pt' }, g);
      const lx = cx + (narrow ? (p.lxs !== undefined ? p.lxs : p.lx) : p.lx), ly = cy + (p.ly || 0);
      const lbl = text(g, lx, ly + 4, narrow && p.short ? p.short : p.label, { class: 'sc-label' + (p.emphasis ? ' is-ours' : ''), 'text-anchor': p.anchor || 'start' });
      if (p.emphasis) lbl.classList.add('is-ours');
      const hit = svgEl('circle', { cx, cy, r: 16, fill: 'transparent' }, g);
      bindHover(hit, g, p.tip);
    }
    return svg;
  }

  /* ---- table twin ---- */
  function table(host, cols, rows) {
    host.textContent = '';
    const t = document.createElement('table');
    t.className = 'data-table';
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    for (const c of cols) { const th = document.createElement('th'); th.textContent = c.label; th.scope = 'col'; hr.appendChild(th); }
    thead.appendChild(hr); t.appendChild(thead);
    const tb = document.createElement('tbody');
    for (const r of rows) {
      const tr = document.createElement('tr');
      if (r.group) {
        tr.className = 'is-group';
        const td = document.createElement('td'); td.colSpan = cols.length; td.textContent = r.group; tr.appendChild(td);
      } else {
        if (r.emphasis) tr.className = 'is-ours';
        for (const c of cols) {
          const td = document.createElement('td');
          const v = r[c.key];
          td.textContent = c.format ? c.format(v, r) : (v === undefined || v === null ? '' : String(v));
          tr.appendChild(td);
        }
      }
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    host.appendChild(t);
    return t;
  }

  /* re-render on width changes */
  function responsive(host, render) {
    let last = -1;
    const run = () => { const w = host.clientWidth; if (w !== last) { last = w; render(); } };
    if ('ResizeObserver' in window) new ResizeObserver(run).observe(host);
    else window.addEventListener('resize', run);
    run();
    return run;
  }

  B.charts = { hbar, scatter, table, responsive, showTip, hideTip };
})(window.BWA);
