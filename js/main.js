/* Page behavior: nav state, videos, the outcome comparison, the
   decomposition explainer, the result charts and the BibTeX button. */
(function () {
  'use strict';
  const D = window.BWA_DATA;
  const CH = window.BWA.charts;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt1 = v => (Math.round(v * 10) / 10).toFixed(1);

  /* ---------- nav ---------- */
  const nav = $('[data-nav]');
  const navLinks = $$('.nav nav a[href^="#"]');
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if ('IntersectionObserver' in window) {
    const targets = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
      }
    }, { rootMargin: '-40% 0px -55% 0px' });
    targets.forEach(t => io.observe(t));
  }

  /* ---------- videos: pick a rendition, pause when off-screen ---------- */
  const saveData = navigator.connection && navigator.connection.saveData;
  const wantSmall = saveData || window.innerWidth <= 720;
  $$('video[data-src-1080]').forEach(v => {
    const src = wantSmall ? v.dataset.src720 : v.dataset.src1080;
    const source = v.querySelector('source[type="video/mp4"]');
    if (source && source.getAttribute('src') !== src) { source.setAttribute('src', src); v.load(); }
    if (v.autoplay && reduceMotion) { v.removeAttribute('autoplay'); v.pause(); }
  });
  const hero = $('.hero-video video');
  const toggle = $('[data-video-toggle]');
  if (hero && toggle) {
    let userPaused = reduceMotion;
    const sync = () => { toggle.classList.toggle('is-paused', hero.paused); toggle.setAttribute('aria-label', hero.paused ? 'Play video' : 'Pause video'); };
    toggle.addEventListener('click', () => { if (hero.paused) { userPaused = false; hero.play().catch(() => {}); } else { userPaused = true; hero.pause(); } sync(); });
    hero.addEventListener('play', sync); hero.addEventListener('pause', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (!userPaused) hero.play().catch(() => {}); }
        else hero.pause();
      }, { threshold: 0.2 }).observe(hero);
    }
    sync();
  }
  /* chapter buttons seek the matching video */
  $$('[data-chapters]').forEach(list => {
    const v = $('video[data-chapter-video="' + list.dataset.chapters + '"]');
    if (!v) return;
    $$('button[data-t]', list).forEach(b => b.addEventListener('click', () => {
      v.currentTime = Number(b.dataset.t);
      v.play().catch(() => {});
      v.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
  });

  /* ---------- same start, two choices ---------- */
  const COMPARE = {
    lb: {
      initial: { src: 'assets/img/sim/lb-0.jpg', cap: 'Two robots hold the barrier. The acting robot must decide whether to move now or with its partner.' },
      fail:    { src: 'assets/img/sim/lb-fail.jpg', pill: 'Default action · dropped', cap: 'The default action moves before the partner lifts. The barrier loses joint support and drops.' },
      care:    { src: 'assets/img/sim/lb-2.jpg', pill: 'CARE selection · lifted', cap: 'CARE’s response-aware choice moves with the partner’s upward motion, keeps the barrier supported and completes the lift.' }
    },
    tp: {
      initial: { src: 'assets/img/sim/tp-0.jpg', cap: 'Four robots coordinate an object and a camera. One robot must hold its pose until its partner is in position.' },
      fail:    { src: 'assets/img/sim/tp-fail.jpg', pill: 'Baseline rollout · failed', cap: 'Every action-only policy fails at least a third of its Take Photo rollouts: the pose is not held while the partner gets into place.' },
      care:    { src: 'assets/img/sim/tp-2.jpg', pill: 'CARE rollout · succeeded', cap: 'CARE succeeds in all 20 Take Photo rollouts. Its gain concentrates on tasks where the preferred action depends on the partner’s timing.' }
    }
  };
  const cmp = $('[data-compare]');
  if (cmp) {
    const imgs = { initial: $('[data-cmp="initial"]', cmp), fail: $('[data-cmp="fail"]', cmp), care: $('[data-cmp="care"]', cmp) };
    const caps = { initial: $('[data-cmp-cap="initial"]', cmp), fail: $('[data-cmp-cap="fail"]', cmp), care: $('[data-cmp-cap="care"]', cmp) };
    const pills = { fail: $('[data-cmp-pill="fail"]', cmp), care: $('[data-cmp-pill="care"]', cmp) };
    const tabs = $$('[data-task]', cmp);
    const show = key => {
      const d = COMPARE[key];
      for (const k of ['initial', 'fail', 'care']) { imgs[k].src = d[k].src; caps[k].textContent = d[k].cap; }
      pills.fail.textContent = d.fail.pill; pills.care.textContent = d.care.pill;
      tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.task === key)));
    };
    tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.task)));
    Object.values(COMPARE).forEach(d => Object.values(d).forEach(x => { const i = new Image(); i.src = x.src; }));
    show('lb');
  }

  /* ---------- decomposition explainer ---------- */
  const QUANT = {
    A: { tiles: ['rk', 'r0'], tone: 'teal',
         formula: '<span class="tk-teal"><i>A<sub>k</sub></i></span> = <i>U</i>(<i>Y<sub>k</sub></i><sup>R</sup>) − <i>U</i>(<i>Y</i><sub>0</sub><sup>R</sup>)',
         text: 'Total advantage. Both branches let the teammates react. It compares the candidate with the nominal action when the team is allowed to respond, which is what a value model conditioned on the action would learn.' },
    D: { tiles: ['pk', 'p0'], tone: 'gray',
         formula: '<span class="tk-gray"><i>D<sub>k</sub></i></span> = <i>U</i>(<i>Y<sub>k</sub></i><sup>P</sup>) − <i>U</i>(<i>Y</i><sub>0</sub><sup>P</sup>)',
         text: 'Direct advantage. Teammates replay the commands recorded under the nominal action, so only the ego action changes. The physical scene still evolves; only the commanded teammate actions are held fixed.' },
    R: { tiles: ['rk', 'r0', 'pk', 'p0'], tone: 'accent',
         formula: '<span class="tk-accent"><i>R<sub>k</sub></i></span> = <span class="tk-teal"><i>A<sub>k</sub></i></span> − <span class="tk-gray"><i>D<sub>k</sub></i></span>',
         text: 'Response interaction. The part of the advantage that exists only because the teammates adapted. Its distribution given the local history is the team-response belief, and it becomes an explicit training target.' }
  };
  const dec = $('[data-decomp]');
  if (dec) {
    const chips = $$('[data-q]', dec);
    const tiles = $$('[data-tile]', dec);
    const fEl = $('[data-formula]', dec), tEl = $('[data-text]', dec);
    let timer = null;
    const order = ['A', 'D', 'R'];
    const set = q => {
      const s = QUANT[q];
      chips.forEach(c => c.setAttribute('aria-selected', String(c.dataset.q === q)));
      tiles.forEach(t => {
        const on = s.tiles.includes(t.dataset.tile);
        t.classList.toggle('is-on', on);
        t.classList.remove('tone-teal', 'tone-gray');
        if (on && s.tone !== 'accent') t.classList.add('tone-' + s.tone);
      });
      dec.classList.add('is-focus');
      fEl.innerHTML = s.formula;
      tEl.textContent = s.text;
    };
    const cycle = () => { const cur = chips.find(c => c.getAttribute('aria-selected') === 'true'); const i = order.indexOf(cur ? cur.dataset.q : 'A'); set(order[(i + 1) % order.length]); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    chips.forEach(c => c.addEventListener('click', () => { stop(); set(c.dataset.q); }));
    dec.addEventListener('pointerenter', stop);
    set('A');
    if (!reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !timer) timer = setInterval(cycle, 4200);
        else if (!e.isIntersecting) stop();
      }, { threshold: 0.4 }).observe(dec);
    }
  }

  /* ---------- chart/table toggles ---------- */
  $$('.chart').forEach(fig => {
    const body = $('[data-chart-body]', fig), tbl = $('[data-chart-table]', fig);
    $$('[data-view]', fig).forEach(b => b.addEventListener('click', () => {
      $$('[data-view]', fig).forEach(x => x.setAttribute('aria-selected', String(x === b)));
      const showTable = b.dataset.view === 'table';
      body.hidden = showTable; tbl.hidden = !showTable;
    }));
  });

  /* ---------- main comparison chart ---------- */
  const GROUP_LABEL = { scratch: 'Without external robot-action pretraining', pretrained: 'With external robot-action pretraining', ours: 'Ours · no external pretraining' };
  const mainFig = $('[data-chart="main"]');
  if (mainFig) {
    const body = $('[data-chart-body]', mainFig), tblHost = $('[data-chart-table]', mainFig);
    const sel = $('[data-task-select]', mainFig);
    const benchBtns = $$('[data-bench]', mainFig);
    let bench = 'rf', task = -1;
    const fillSelect = () => {
      sel.textContent = '';
      const opt = document.createElement('option'); opt.value = '-1'; opt.textContent = 'Benchmark average'; sel.appendChild(opt);
      if (bench === 'mean') { sel.parentElement.hidden = true; return; }
      sel.parentElement.hidden = false;
      const list = bench === 'rf' ? D.tasks.robofactory : D.tasks.mars;
      list.forEach((t, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = t.name + ' (' + t.robots + ' robots)'; sel.appendChild(o); });
      sel.value = String(task);
    };
    const valueOf = p => bench === 'mean' ? p.mean : (task < 0 ? (bench === 'rf' ? p.rfAvg : p.marsAvg) : (bench === 'rf' ? p.rf[task] : p.mars[task]));
    const tipOf = p => {
      const rows = [{ k: '', v: p.name, strong: true }];
      D.tasks.robofactory.forEach((t, i) => rows.push({ k: t.name, v: p.rf[i] + '%' }));
      rows.push({ k: 'RoboFactory average', v: fmt1(p.rfAvg) + '%' });
      D.tasks.mars.forEach((t, i) => rows.push({ k: t.name, v: p.mars[i] + '%' }));
      rows.push({ k: 'MARS average', v: fmt1(p.marsAvg) + '%' });
      rows.push({ k: 'Mean of benchmarks', v: fmt1(p.mean) + '%' });
      return rows;
    };
    const render = () => {
      const rows = []; let g = null;
      for (const p of D.main) {
        if (p.group !== g) { rows.push({ header: true, label: GROUP_LABEL[p.group] }); g = p.group; }
        rows.push({ label: p.name + (p.adapted ? ' †' : ''), value: valueOf(p), emphasis: !!p.ours, tip: tipOf(p) });
      }
      CH.hbar(body, { rows, max: 100, format: v => fmt1(v) + '%', valueW: 64, aria: 'Closed-loop success rate by policy' });
    };
    benchBtns.forEach(b => b.addEventListener('click', () => { bench = b.dataset.bench; task = -1; benchBtns.forEach(x => x.setAttribute('aria-selected', String(x === b))); fillSelect(); render(); }));
    sel.addEventListener('change', () => { task = Number(sel.value); render(); });
    fillSelect();
    CH.responsive(body, render);
    /* table twin: the full Table I */
    const cols = [{ key: 'name', label: 'Policy' }];
    D.tasks.robofactory.forEach((t, i) => cols.push({ key: 'rf' + i, label: t.key + ' ' + t.robots }));
    cols.push({ key: 'rfAvg', label: 'RF avg', format: fmt1 });
    D.tasks.mars.forEach((t, i) => cols.push({ key: 'mars' + i, label: t.key + ' ' + t.robots }));
    cols.push({ key: 'marsAvg', label: 'MARS avg', format: fmt1 });
    cols.push({ key: 'mean', label: 'Mean', format: fmt1 });
    const trows = []; let gg = null;
    for (const p of D.main) {
      if (p.group !== gg) { trows.push({ group: GROUP_LABEL[p.group] }); gg = p.group; }
      const r = { name: p.name + (p.adapted ? ' †' : ''), rfAvg: p.rfAvg, marsAvg: p.marsAvg, mean: p.mean, emphasis: !!p.ours };
      p.rf.forEach((v, i) => r['rf' + i] = v); p.mars.forEach((v, i) => r['mars' + i] = v);
      trows.push(r);
    }
    CH.table(tblHost, cols, trows);
  }

  /* ---------- physical evaluation: small multiples ---------- */
  const realFig = $('[data-chart="real"]');
  if (realFig) {
    const body = $('[data-chart-body]', realFig), tblHost = $('[data-chart-table]', realFig);
    const render = () => {
      body.textContent = '';
      [['fb', 'Folding Bed'], ['ob', 'Opening Box']].forEach(([key, title]) => {
        const wrap = document.createElement('div');
        const h = document.createElement('p'); h.className = 'mult-title'; h.textContent = title; wrap.appendChild(h);
        const host = document.createElement('div'); wrap.appendChild(host); body.appendChild(wrap);
        const rows = D.real.map(p => ({
          label: p.name, value: p[key], emphasis: !!p.ours,
          tip: [{ k: '', v: p.name, strong: true }, { k: 'Folding Bed', v: p.fb + '/20' }, { k: 'Opening Box', v: p.ob + '/20' }, { k: 'Average SR', v: fmt1(p.avg) + '%' }, { k: 'Override rate', v: p.or == null ? 'n/a' : fmt1(p.or) + '%' }]
        }));
        CH.hbar(host, { rows, max: 20, format: v => v + '/20', valueW: 56, aria: title + ' successes out of 20' });
      });
    };
    CH.responsive(body, render);
    CH.table(tblHost, [
      { key: 'name', label: 'Policy' }, { key: 'fb', label: 'FB', format: v => v + '/20' },
      { key: 'ob', label: 'OB', format: v => v + '/20' }, { key: 'avg', label: 'Avg. SR (%)', format: fmt1 }, { key: 'or', label: 'OR (%)', format: v => v == null ? 'n/a' : fmt1(v) }
    ], D.real.map(p => Object.assign({ emphasis: !!p.ours }, p)));
  }

  /* ---------- selector effectiveness ---------- */
  const selFig = $('[data-chart="selection"]');
  if (selFig) {
    const body = $('[data-chart-body]', selFig), tblHost = $('[data-chart-table]', selFig);
    const render = () => CH.hbar(body, {
      rows: D.selection.map(p => ({ label: p.name, value: p.recov, emphasis: !!p.ours, or: p.or,
        tip: [{ k: '', v: p.name, strong: true }, { k: 'Recovered headroom', v: p.recov.toFixed(2) }, { k: 'Override rate', v: fmt1(p.or) + '%' }, { k: 'Closed-loop SR', v: fmt1(p.sr) + '%' }, { k: 'Regret', v: p.regret.toFixed(4) }] })),
      max: 1, format: v => v.toFixed(2), note: r => 'OR ' + fmt1(r.or) + '%', valueW: 118, aria: 'Recovered headroom by selector'
    });
    CH.responsive(body, render);
    CH.table(tblHost, [
      { key: 'name', label: 'Proposals / selector' }, { key: 'sr', label: 'SR ↑', format: fmt1 }, { key: 'recov', label: 'Recov. ↑', format: v => v.toFixed(3) },
      { key: 'regret', label: 'Regret ↓', format: v => v.toFixed(4) }, { key: 'or', label: 'OR', format: fmt1 }
    ], D.selection.map(p => Object.assign({ emphasis: !!p.ours }, p)));
  }

  /* ---------- supervision ablation ---------- */
  const supFig = $('[data-chart="supervision"]');
  if (supFig) {
    const body = $('[data-chart-body]', supFig), tblHost = $('[data-chart-table]', supFig);
    const render = () => CH.hbar(body, {
      rows: D.supervision.filter(p => p.rmae != null).map(p => ({ label: p.name, value: p.rmae, emphasis: !!p.ours,
        tip: [{ k: '', v: p.name, strong: true }, { k: 'R MAE', v: p.rmae.toFixed(3) }, { k: 'Rank agreement', v: p.rank.toFixed(3) }, { k: 'Regret', v: p.regret.toFixed(4) }, { k: 'Closed-loop SR', v: fmt1(p.sr) + '%' }] })),
      max: 0.14, format: v => v.toFixed(3), valueW: 60, aria: 'Response mean absolute error by supervision variant'
    });
    CH.responsive(body, render);
    CH.table(tblHost, [
      { key: 'name', label: 'Supervision variant' }, { key: 'sr', label: 'SR ↑', format: fmt1 }, { key: 'rmae', label: 'R MAE ↓', format: v => v == null ? '—' : v.toFixed(4) },
      { key: 'rank', label: 'Rank ↑', format: v => v.toFixed(3) }, { key: 'regret', label: 'Regret ↓', format: v => v.toFixed(4) }
    ], D.supervision.map(p => Object.assign({ emphasis: !!p.ours }, p)));
  }

  /* ---------- calibration scatter ---------- */
  const scFig = $('[data-chart="selector"]');
  if (scFig) {
    const body = $('[data-chart-body]', scFig), tblHost = $('[data-chart-table]', scFig);
    const LAB = {
      'Nominal path (selector off)': { lx: 12, ly: 15, short: 'Selector off' },
      'Posterior mean': { lx: -12, ly: 0, anchor: 'end' },
      'Uncalibrated lower quantile': { lx: 12, ly: 12, short: 'Uncalibrated quantile' },
      'Candidate-wise calibration': { lx: 12, ly: -8, short: 'Candidate-wise cal.' },
      'Simultaneous calibration': { lx: 12, ly: 14, short: 'Simultaneous cal.' },
      'CARE (+ safety filter)': { lx: 12, ly: -4, short: 'CARE' }
    };
    const render = () => {
      /* the two CARE rows coincide; draw one point labeled for both */
      const pts = D.selector.filter(p => p.name !== 'Simultaneous calibration').map(p => {
        const l = LAB[p.name] || { lx: 10, ly: 0 };
        const label = p.ours ? 'CARE = simultaneous calibration + safety filter' : p.name;
        return Object.assign({ label, x: p.or, y: p.sr, emphasis: !!p.ours,
          tip: [{ k: '', v: p.ours ? 'CARE (simultaneous calibration + safety filter)' : p.name, strong: true }, { k: 'Override rate', v: fmt1(p.or) + '%' }, { k: 'Closed-loop SR', v: fmt1(p.sr) + '%' }] }, l);
      });
      CH.scatter(body, { points: pts, xr: [-4, 104], yr: [35, 95], xTicks: [0, 25, 50, 75, 100], yTicks: [40, 50, 60, 70, 80, 90],
        xLabel: 'Override rate (% of control steps)', yLabel: 'Closed-loop success rate (%)', aria: 'Success rate against override rate for selection rules' });
    };
    CH.responsive(body, render);
    CH.table(tblHost, [{ key: 'name', label: 'Selector' }, { key: 'or', label: 'OR (%)', format: fmt1 }, { key: 'sr', label: 'SR (%) ↑', format: fmt1 }],
      D.selector.map(p => Object.assign({ emphasis: !!p.ours }, p)));
  }

  /* ---------- simulation task cards ---------- */
  const TASKS = [
    { key: 'LB', name: 'Lift Barrier', robots: 2, frames: ['lb-0', 'lb-1', 'lb-2'], sr: 100, desc: 'Cooperatively lift the barrier upward. The synchronized lift is where LatentToM also does well; the two tie.' },
    { key: 'TP', name: 'Take Photo', robots: 4, frames: ['tp-0', 'tp-1', 'tp-2'], sr: 100, desc: 'Coordinate objects and a camera for photography. One robot holds its pose until its partner is in position.' },
    { key: 'CA', name: 'Camera Alignment', robots: 3, frames: ['ca-0', 'ca-1', 'ca-2'], sr: 60, desc: 'Lift and align the camera and the meat. Precise positioning dominates, and π₀.₅ is strongest here.' },
    { key: 'PS', name: 'Pass Shoe', robots: 2, frames: ['ps-0', 'ps-1', 'ps-2'], sr: 100, desc: 'Pass the shoe between two robots. Holding the object until the partner is ready decides the handoff.' },
    { key: 'LP', name: 'Long Pipeline Delivery', robots: 4, frames: ['lpd-0', 'lpd-1', 'lpd-2', 'lpd-3'], sr: 90, desc: 'Deliver the shoe along a pipeline of four robots. A long sequential chain, with less for the interaction contrast to change.' },
    { key: 'PF', name: 'Place Food', robots: 2, frames: ['pf-0', 'pf-1', 'pf-2'], sr: 65, desc: 'Place the meat inside the pot. Single-robot precision dominates; ACT succeeds in every rollout here.' }
  ];
  const tasksHost = $('[data-tasks]');
  if (tasksHost) {
    for (const t of TASKS) {
      const card = document.createElement('article'); card.className = 'task';
      const strip = document.createElement('div'); strip.className = 'task-strip';
      t.frames.forEach((f, i) => {
        const fig = document.createElement('figure');
        const img = document.createElement('img'); img.src = 'assets/img/sim/' + f + '.jpg'; img.loading = 'lazy'; img.alt = t.name + ', frame ' + (i + 1);
        const cap = document.createElement('figcaption'); cap.textContent = String(i + 1);
        fig.append(img, cap); strip.appendChild(fig);
      });
      const meta = document.createElement('div'); meta.className = 'task-meta';
      const h = document.createElement('h3'); h.textContent = t.name;
      const rb = document.createElement('span'); rb.className = 'robots'; rb.textContent = t.robots + ' robots'; h.appendChild(rb);
      const sr = document.createElement('span'); sr.className = 'task-sr' + (t.sr < 80 ? ' mid' : ''); sr.textContent = 'CARE ' + t.sr + '%';
      meta.append(h, sr);
      const d = document.createElement('p'); d.className = 'desc'; d.textContent = t.desc;
      card.append(strip, meta, d); tasksHost.appendChild(card);
    }
  }

  /* ---------- copy bibtex ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const src = $(b.dataset.copy); if (!src) return;
    const txt = src.textContent;
    try { await navigator.clipboard.writeText(txt); }
    catch (e) { const r = document.createRange(); r.selectNodeContents(src); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); s.removeAllRanges(); }
    const old = b.textContent; b.textContent = 'Copied'; b.classList.add('is-done');
    setTimeout(() => { b.textContent = old; b.classList.remove('is-done'); }, 1600);
  }));
})();
