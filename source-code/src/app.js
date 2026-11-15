/* =========================================================================
   MJR LION AGENCY — application
   ========================================================================= */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CFG = window.SITE_CONFIG, VIS = window.VIS;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const isMobile = () => window.innerWidth < 760 || window.innerWidth / window.innerHeight < .8;

  document.body.insertAdjacentHTML('afterbegin', VIS.DEFS);
  $('#logoMark').outerHTML = VIS.lionMark('lm-h');
  $('#ftrMark').outerHTML = VIS.lionMark('lm-f');
  $('#yr').textContent = new Date().getFullYear();

  /* ------------------------------------------------------------ 3D engine */
  let gl3d = null;
  try { gl3d = window.MJR3D.Engine($('#gl'), { mobile: isMobile(), reduced }); } catch (e) { console.warn(e); }
  if (!gl3d) { document.documentElement.classList.add('no-gl'); $('#fallback').innerHTML = VIS.lionMark('lm-bg'); }

  const PAGES = {
    home: { shape: 'lion', title: 'MJR LION AGENCY — Premium Digital Agency | Your Success Our Pride' },
    services: { shape: 'geodesic', title: 'Services — MJR LION AGENCY', tilt: .25 },
    works: { shape: 'knot', title: 'Works / Portfolio — MJR LION AGENCY', tilt: .3 },
    studio: { shape: 'orbits', title: 'Studio — MJR LION AGENCY', tilt: .35 },
    team: { shape: 'vault', title: 'Meet Our Team — Verification — MJR LION AGENCY', tilt: .1 },
    pricing: { shape: 'bars', title: 'Pricing — MJR LION AGENCY', tilt: .22 },
    track: { shape: 'helix', title: 'Track Your Project — MJR LION AGENCY', tilt: .12 },
    contact: { shape: 'globe', title: 'Contact Us — MJR LION AGENCY', tilt: .35 }
  };
  function placement(name) {
    const aspect = window.innerWidth / window.innerHeight, halfW = 2.41 * aspect, P = PAGES[name];
    if (isMobile()) {
      return name === 'home' ? { x: 0, y: 2.41 * .54 - (aspect > .6 ? .2 : 0), s: Math.min(.5, halfW * .34), o: .9, tilt: 0 } : { x: halfW * .2, y: 1.25, s: Math.min(.55, halfW * .42), o: .32, tilt: P.tilt || 0 };
    }
    if (name === 'home') return { x: Math.min(2.05, halfW * .44), y: -.05, s: .86, o: 1, tilt: 0 };
    if (name === 'team' || name === 'track') return { x: Math.min(3.4, halfW * .78), y: .2, s: .78, o: .38, tilt: P.tilt || 0 };
    return { x: Math.min(2.7, halfW * .6), y: .1, s: .8, o: name === 'pricing' ? .42 : .55, tilt: P.tilt || 0 };
  }

  /* ------------------------------------------------------------ hero lion photo */
  const heroLion = $('#heroLion'), lionImg = $('#lionImg');
  let lionPhoto = false;
  const shapeFor = n => n === 'home' ? (lionPhoto ? 'embers' : 'lion') : PAGES[n].shape;
  if (CFG.HERO_LION && heroLion) {
    const base = CFG.HERO_LION, uns = base.includes('images.unsplash.com');
    const u = (w, h) => uns ? `${base}?auto=format&fit=crop&crop=faces,entropy&w=${w}&h=${h}&q=72` : base;
    lionImg.onload = () => {
      lionPhoto = true; heroLion.classList.add('on'); heroLion.parentElement.classList.add('has-photo');
      if (gl3d && current === 'home') gl3d.go('embers', placement('home'), { duration: 1.6 });
    };
    lionImg.onerror = () => { heroLion.remove(); };
    if (uns) { lionImg.sizes = '(max-width: 760px) 100vw, 58vw'; lionImg.srcset = `${u(720, 900)} 720w, ${u(1200, 1300)} 1200w, ${u(1600, 1700)} 1600w`; }
    lionImg.src = u(1200, 1300);
  } else if (heroLion) heroLion.remove();

  /* ------------------------------------------------------------ text split */
  function split(el) {
    const walk = (node, gold) => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = tok; i.style.setProperty('--i', split.n++);
            if (gold) i.className = 'gold';
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          const g = n.classList.contains('gold');
          if (g) n.classList.remove('gold');
          walk(n, gold || g);
        }
      });
    };
    split.n = 0; walk(el, false);
  }
  $$('.split').forEach(split);

  /* ------------------------------------------------------------ reveal */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 }) : null;
  function observe(root) { $$('[data-r]:not(.in), .split:not(.in)', root).forEach(el => io ? io.observe(el) : el.classList.add('in')); }

  /* ------------------------------------------------------------ tilt + magnetic */
  function bindTilt(root) {
    if (!fine || reduced) return;
    $$('.tilt', root).forEach(el => {
      if (el._t) return; el._t = 1;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('moving');
        el.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => { el.classList.remove('moving'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }
  function bindMag(root) {
    if (!fine || reduced) return;
    $$('[data-mag]', root).forEach(el => {
      if (el._m) return; el._m = 1;
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${((e.clientX - r.left) / r.width - .5) * 14}px,${((e.clientY - r.top) / r.height - .5) * 12}px)`; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
  function enhance(root) { observe(root); bindTilt(root); bindMag(root); }

  /* ------------------------------------------------------------ cursor */
  if (fine && !reduced) {
    const c = $('.cursor'), d = $('.cursor-dot'); let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; c.classList.add('on'); d.classList.add('on'); d.style.transform = `translate(${x}px,${y}px)`; });
    document.addEventListener('pointerover', e => c.classList.toggle('hover', !!e.target.closest('a,button,input,select,textarea,.tilt,.o-panel')));
    document.addEventListener('pointerleave', () => { c.classList.remove('on'); d.classList.remove('on'); });
    (function loop() { cx += (x - cx) * .18; cy += (y - cy) * .18; c.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  }
  if (gl3d) addEventListener('pointermove', e => gl3d.pointer(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)), { passive: true });

  /* ------------------------------------------------------------ visuals */
  function viz(svc, extra) {
    const img = CFG.IMAGES['svc-' + svc.id];
    return `<div class="viz ${extra || ''}" data-art="${esc(svc.art)}">${img ? `<img src="${esc(img)}" alt="${esc(svc.name)} — ${esc(svc.art)}" loading="lazy">` : `<div class="vz-art">${VIS.ART[svc.icon]}</div><span class="vz-chip">${esc(svc.chip)}</span>`}<span class="shine"></span><span class="vz-slot">Image slot · ${esc(svc.art)}</span></div>`;
  }
  function photo(key, mono, name) {
    const src = CFG.TEAM_PHOTOS[key];
    return `<div class="photo">${src ? `<img src="${esc(src)}" alt="${esc(name)}" loading="lazy">` : `<div class="ring"></div><div class="mono"><span>${esc(mono)}</span></div><span class="vz-slot">Photo slot · professional portrait</span>`}</div>`;
  }
  const SVC = Object.fromEntries(SERVICES.map(s => [s.id, s]));
  const half = t => { const w = t.split(' '); return w.length < 10 ? t : w.slice(0, Math.ceil(w.length / 2)).join(' ').replace(/[,.—–-]+$/, '') + '…'; };

  /* ------------------------------------------------------------ HOME */
  $('#marquee').innerHTML = [0, 1].map(() => SERVICES.map(s => `<span>${esc(s.name)} <em>✦</em></span>`).join('')).join('');
  const STATS = [
    { v: 212, pre: '+', suf: '%', k: 'Traffic within 90 days', c: 'Northline Labs · Web' },
    { v: 6.4, suf: 'x', dec: 1, k: 'ROAS at scale', c: 'Vantage Ventures · Ads' },
    { v: 84, suf: 'k', k: 'Followers in 6 months', c: 'Halcyon Beauty · Social' },
    { v: 340, k: 'SQLs in 60 days', c: 'B2B client · Lead Gen' }
  ];
  $('#stats').innerHTML = STATS.map((s, i) => `<div class="stat glass tilt" data-r style="--d:${i * .08}s"><div class="v gold" data-count="${s.v}" data-dec="${s.dec || 0}" data-pre="${s.pre || ''}" data-suf="${s.suf || ''}">${s.pre || ''}0${s.suf || ''}</div><div class="k">${s.k}</div><div class="c">${s.c}</div></div>`).join('');
  const cio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, dec = +el.dataset.dec, t0 = performance.now(), dur = reduced ? 1 : 1800;
    (function step(t) { const p = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - p, 4)); el.textContent = el.dataset.pre + v.toFixed(dec) + el.dataset.suf; if (p < 1) requestAnimationFrame(step); })(t0);
  }), { threshold: .4 }) : null;
  $$('[data-count]').forEach(el => cio ? cio.observe(el) : 0);

  // 3D service orbit
  const orbit = $('#orbit'), oWrap = $('#orbitWrap');
  orbit.innerHTML = SERVICES.map((s, i) => `<button class="o-panel" type="button" data-svc="${s.id}" style="--i:${i}" aria-label="Explore ${esc(s.name)}"><div><div class="ico">${VIS.icon(s.icon)}</div></div><div><div class="n">SERVICE ${s.no}</div><h3>${esc(s.name)}</h3></div><p>${esc(s.desc.split('. ')[0])}.</p></button>`).join('');
  const oPanels = $$('.o-panel', orbit);
  const O = { a: 0, v: 0, drag: false, lx: 0, moved: 0, vis: false, last: 0 };
  function layoutOrbit() {
    const w = oPanels[0].offsetWidth || 260, R = Math.round(w / (2 * Math.tan(Math.PI / 10)) + 24);
    oPanels.forEach((p, i) => { p.style.transform = `rotateY(${i * 36}deg) translateZ(${R}px)`; });
  }
  function drawOrbit() {
    orbit.style.transform = `rotateX(-7deg) rotateY(${O.a}deg)`;
    oPanels.forEach((p, i) => { const d = ((i * 36 + O.a) % 360 + 360) % 360, c = Math.cos(d * Math.PI / 180); p.style.opacity = (.12 + .88 * Math.max(0, c) ** 1.5).toFixed(3); p.style.pointerEvents = c > .5 ? 'auto' : 'none'; });
  }
  function orbitLoop(t) {
    requestAnimationFrame(orbitLoop);
    if (!O.vis || document.hidden) { O.last = t; return; }
    const dt = Math.min(.05, (t - O.last) / 1000 || 0); O.last = t;
    if (!O.drag) { O.a -= (reduced ? 0 : 7) * dt; O.a += O.v; O.v *= .93; }
    drawOrbit();
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => O.vis = e.isIntersecting)).observe(oWrap); else O.vis = true;
  oWrap.addEventListener('pointerdown', e => { O.drag = true; O.lx = e.clientX; O.moved = 0; O.v = 0; });
  addEventListener('pointermove', e => { if (!O.drag) return; const dx = e.clientX - O.lx; O.lx = e.clientX; O.moved += Math.abs(dx); O.a += dx * .28; O.v = dx * .28; });
  addEventListener('pointerup', () => { O.drag = false; });
  oWrap.addEventListener('click', e => { const p = e.target.closest('.o-panel'); if (p && O.moved < 8) openService(p.dataset.svc); });
  layoutOrbit(); drawOrbit(); requestAnimationFrame(orbitLoop);
  addEventListener('resize', layoutOrbit);

  /* ------------------------------------------------------------ SERVICES */
  $('#svcGrid').innerHTML = SERVICES.map((s, i) => `
    <article class="svc-card tilt" data-r style="--d:${(i % 3) * .07}s">
      <div class="z1">${viz(s)}</div>
      <div class="body">
        <div class="top z2"><span class="outline-num">${s.no}</span><span class="tag">Service ${s.no}</span></div>
        <h3 class="z2">${esc(s.name)}</h3>
        <p class="z1">${esc(half(s.desc))}</p>
        <div class="foot z2"><button class="btn btn-ghost btn-sm" type="button" data-explore="${s.id}" data-mag>Explore Now <span class="arr">→</span></button><span class="tag">${esc(s.tech.length)} tools</span></div>
      </div>
    </article>`).join('');
  document.addEventListener('click', e => { const b = e.target.closest('[data-explore]'); if (b) openService(b.dataset.explore); });

  const sheet = $('#sheet'), sheetPanel = $('#sheetPanel');
  let lastFocus = null;
  const accItem = (ix, title, body, open) => `<div class="acc${open ? ' open' : ''}"><button class="acc-h" type="button" aria-expanded="${!!open}"><span class="ix">${ix}</span><span class="t">${title}</span><span class="pm" aria-hidden="true"></span></button><div class="acc-b"><div><div class="inner">${body}</div></div></div></div>`;
  function openService(id) {
    const s = SVC[id]; if (!s) return;
    lastFocus = document.activeElement;
    const faqs = `<div class="faq">${s.faqs.map(f => accItem('Q', esc(f.q), esc(f.a))).join('')}</div>`;
    sheetPanel.innerHTML = `
      <button class="sheet-close" type="button" data-close aria-label="Close"></button>
      <div class="sd-head">
        <div>
          <div class="label">Service ${s.no}</div>
          <h2 class="h-lg">${esc(s.name)}</h2>
          <p class="lead">${esc(s.desc)}</p>
          <div class="sd-meta"><span class="chip gold">⏱ ${esc(s.timeline)}</span><span class="chip">${s.features.length} features</span><span class="chip">${s.process.length}-step process</span></div>
        </div>
        ${viz(s, 'v2')}
      </div>
      <div class="sd-body">
        ${accItem('01', 'Features', `<ul class="ticks">${s.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`, true)}
        ${accItem('02', 'Benefits', `<ul class="ticks">${s.benefits.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`)}
        ${accItem('03', 'Process', `<ol class="steps">${s.process.map(p => `<li>${esc(p)}</li>`).join('')}</ol>`)}
        ${accItem('04', 'Estimated Timeline', `<div class="timeline-pill">${VIS.icon('clock')}<span>${esc(s.timeline)}</span></div>`)}
        ${accItem('05', 'Technologies', `<div class="techs">${s.tech.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>`)}
        ${accItem('06', 'Client Success Highlights', `<div class="wins">${s.wins.map(([b, t]) => `<div class="win"><b class="gold">${esc(b)}</b>${esc(t)}</div>`).join('')}</div>`)}
        ${accItem('07', 'Frequently Asked Questions', faqs)}
        <div class="sd-cta"><div><div class="label">Ready?</div><div class="h-md" style="margin-top:8px">Start your ${esc(s.name)} project.</div></div><div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-ghost" href="#pricing" data-close>View Pricing</a><a class="btn btn-gold" href="#contact" data-svc="${s.id}" data-close data-mag>Start This Project <span class="arr">→</span></a></div></div>
      </div>`;
    sheetPanel.scrollTop = 0;
    $('.timeline-pill svg', sheetPanel) && ($('.timeline-pill svg', sheetPanel).style.width = '22px');
    sheet.classList.add('open'); document.body.classList.add('locked');
    bindMag(sheetPanel);
    setTimeout(() => $('.sheet-close', sheetPanel).focus({ preventScroll: true }), 50);
  }
  function closeOverlays(only) {
    [sheet, $('#modal')].forEach(o => { if (!only || o === only) o.classList.remove('open'); });
    if (!$('.sheet.open,.modal.open') && !document.body.classList.contains('menu-open')) document.body.classList.remove('locked');
    if (lastFocus && lastFocus.focus && !only) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('click', e => {
    const h = e.target.closest('.acc-h');
    if (h) { const a = h.parentElement; a.classList.toggle('open'); h.setAttribute('aria-expanded', a.classList.contains('open')); }
    const ov = e.target.closest('[data-close]') && e.target.closest('.sheet,.modal');
    if (ov && !(ov.id === 'modal' && e.target.closest('[data-explore]'))) closeOverlays(ov);
    else if (ov) { ov.classList.remove('open'); }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeOverlays(); setMenu(false); } });

  /* ------------------------------------------------------------ WORKS */
  const cats = ['All'].concat([...new Set(WORKS.map(w => w.cat))]);
  $('#filters').innerHTML = cats.map((c, i) => `<button type="button" role="tab" class="${i ? '' : 'on'}" aria-selected="${!i}" data-f="${esc(c)}">${esc(c)}</button>`).join('');
  $('#wkGrid').innerHTML = WORKS.map((w, i) => { const s = SVC[w.svc]; return `
    <article class="wk-card${w.wide ? ' wide' : ''}" data-cat="${esc(w.cat)}" data-r style="--d:${(i % 3) * .07}s">
      ${viz(s, i % 2 ? 'v2' : '')}
      <div class="body"><div class="svc">${esc(s.name)}</div><h3>${esc(w.client)}</h3><div class="out">${esc(w.out)}</div>
      <div class="foot"><button class="link-arrow" type="button" data-case="${i}">View Case Study <i></i></button><span class="tag" style="font:600 10px/1 var(--fl);letter-spacing:.2em;color:var(--dim)">${String(i + 1).padStart(2, '0')}</span></div></div>
    </article>`; }).join('');
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#filters button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    const f = b.dataset.f, cards = $$('.wk-card');
    cards.forEach(c => { if (f !== 'All' && c.dataset.cat !== f) { c.classList.add('hide'); setTimeout(() => c.classList.contains('hide') && c.classList.add('gone'), 450); } });
    let k = 0;
    cards.forEach(c => { if (f === 'All' || c.dataset.cat === f) { c.classList.remove('gone'); c.classList.add('in'); const d = k++ * 60; setTimeout(() => c.classList.remove('hide'), 30 + d); } });
  });
  document.addEventListener('click', e => { const b = e.target.closest('[data-case]'); if (b) openCase(+b.dataset.case); });
  function openCase(i) {
    const w = WORKS[i], s = SVC[w.svc]; lastFocus = document.activeElement;
    $('#modalPanel').innerHTML = `
      <button class="sheet-close" type="button" data-close aria-label="Close"></button>
      ${viz(s, 'v2').replace('class="viz', 'style="aspect-ratio:21/9;border-radius:0" class="viz')}
      <div class="cs-body">
        <div><div class="label">${esc(s.name)} · Case study</div><h2 class="h-lg" style="margin-top:12px">${esc(w.client)}</h2><p class="lead" style="margin-top:14px">${esc(w.out)}</p></div>
        <div class="wins">${w.wins.map(t => `<div class="win">${esc(t)}</div>`).join('')}</div>
        <div class="cs-grid">
          <div class="cs-box"><h4 class="label">Our process</h4><ol class="steps" style="grid-template-columns:1fr 1fr">${s.process.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div>
          <div class="cs-box"><h4 class="label">Stack</h4><div class="techs">${s.tech.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div><h4 class="label" style="margin-top:22px">Timeline</h4><p class="muted">${esc(s.timeline)}</p></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px"><a class="btn btn-gold" href="#contact" data-svc="${s.id}" data-close>Start a Similar Project <span class="arr">→</span></a><button class="btn btn-ghost" type="button" data-close data-explore="${s.id}">Explore ${esc(s.name)}</button></div>
      </div>`;
    $('#modal').classList.add('open'); document.body.classList.add('locked');
    setTimeout(() => $('#modalPanel .sheet-close').focus({ preventScroll: true }), 50);
  }

  /* ------------------------------------------------------------ STUDIO */
  $('#teamGrid').innerHTML = TEAM.map((m, i) => `
    <article class="tm-card tilt${m.founder ? ' founder' : ''}" data-r style="--d:${(i % 4) * .07}s">
      <div class="z1" style="${m.founder ? 'flex:0 0 46%;display:flex' : ''}">${photo(m.key, m.mono, m.name).replace('class="photo"', `class="photo" style="${m.founder ? 'flex:1;aspect-ratio:auto;min-height:320px' : ''}"`)}</div>
      <div class="body z2">
        <div class="dept">${esc(m.dept)}</div>
        <h3>${esc(m.name)}${m.title ? ` <span class="muted" style="font-weight:400">— ${esc(m.title)}</span>` : ''}</h3>
        <div class="role">${esc(m.role)}</div>
        <p>${esc(m.desc)}</p>
        <div class="foot"><a href="#team" class="link-arrow" data-member="${esc(m.name)}">View Profile <i></i></a></div>
      </div>
    </article>`).join('');

  /* ------------------------------------------------------------ PRICING */
  $('#priceGrid').innerHTML = PRICING.map((p, i) => `
    <article class="p-card tilt" data-r style="--d:${(i % 3) * .07}s">
      <div class="pn z1">${String(i + 1).padStart(2, '0')} · Individual</div>
      <h3 class="z2">${esc(p.name)}</h3>
      <div class="pd z1">${esc(p.d)}</div>
      <div class="pr gold z2">${esc(p.p)}${p.unit ? `<small>${esc(p.unit)}</small>` : ''}</div>
      ${p.note ? `<div class="note z1"><b>Note:</b> ${esc(p.note)}</div>` : ''}
      <a class="btn btn-ghost btn-sm z2" href="#contact" data-svc="${p.svc}" data-mag>Start Project <span class="arr">→</span></a>
    </article>`).join('');

  /* ------------------------------------------------------------ CONTACT */
  const C = window.CONTACT;
  const tel = n => `<a href="tel:${n.replace(/\s/g, '')}">${esc(n)}</a>`;
  $('#cGrid').innerHTML = [
    { i: 'mail', l: 'Email', v: C.emails.map(esc).join('<br>') },
    { i: 'phone', l: 'Helpline', v: C.helpline.map(tel).join('<br>') },
    { i: 'alert', l: 'Complaints', v: C.complaints.map(tel).join('<br>') }
  ].map((c, i) => `<div class="c-card tilt" data-r style="--d:${i * .08}s"><div class="c-ico z2">${VIS.icon(c.i)}</div><div class="label z1">${c.l}</div><div class="v z2">${c.v}</div></div>`).join('');
  $('#ftrContact').innerHTML = `<div><span>Helpline</span>${C.helpline.map(tel).join('<br>')}</div><div><span>Complaints</span>${tel(C.complaints[0])}</div><div><span>Email</span>${C.emails.map(esc).join('<br>')}</div>`;
  $('#vLockIco').innerHTML = VIS.icon('lock'); $('#tLockIco').innerHTML = VIS.icon('key');
  const sel = $('#f-svc');
  sel.innerHTML = `<option value="">Select a service…</option>${SERVICES.map(s => `<option>${esc(s.name)}</option>`).join('')}<option>All-in-One Standard Brand Program</option><option>All-in-One Premium Brand Program</option><option>Not sure yet — advise me</option>`;
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-svc],[data-plan]');
    if (a && a.getAttribute('href') === '#contact') { const v = a.dataset.plan || (SVC[a.dataset.svc] || {}).name; if (v) { sel.value = v; pendingScroll = 'brief'; } }
    const m = e.target.closest('[data-member]');
    if (m) pendingMember = m.dataset.member;
    const sc = e.target.closest('[data-scrollto]');
    if (sc && current === 'contact') { e.preventDefault(); $('#' + sc.dataset.scrollto).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }
  });

  const form = $('#brief');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = n => form.elements[n].value.trim();
    const rules = { name: v('name').length > 1 || 'Please enter your name.', email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email')) || 'Please enter a valid email.', service: !!v('service') || 'Please choose a service.', message: v('message').length >= 10 || 'Tell us a little more (10+ characters).' };
    let ok = true;
    Object.entries(rules).forEach(([k, r]) => { const f = form.elements[k].closest('.fld'); f.classList.toggle('bad', r !== true); $('.err', f).textContent = r === true ? '' : r; if (r !== true) ok = false; });
    if (!ok) { form.classList.add('shake'); setTimeout(() => form.classList.remove('shake'), 500); return; }
    const brief = `New project brief — MJR LION AGENCY\n\nName: ${v('name')}\nEmail: ${v('email')}\nPhone: ${v('phone') || '—'}\nCompany: ${v('company') || '—'}\nService: ${v('service')}\n\nMessage:\n${v('message')}`;
    const sent = $('#sent');
    sent.innerHTML = `<div class="label" style="color:var(--ok)">Brief ready</div><div>Thanks, ${esc(v('name').split(' ')[0])}. Your brief is ready — send it to our team on WhatsApp in one tap, or copy it.</div><pre>${esc(brief)}</pre><div class="row"><a class="btn btn-gold btn-sm" href="https://wa.me/${C.whatsapp}?text=${encodeURIComponent(brief)}" target="_blank" rel="noopener">Send via WhatsApp <span class="arr">→</span></a><button class="btn btn-ghost btn-sm" type="button" id="copyBrief">Copy brief</button></div>`;
    sent.classList.add('show');
    $('#copyBrief').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(brief) : Promise.reject()).then(() => toast('Brief copied to clipboard'), () => toast('Select the text above to copy it')); };
    sent.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  });
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2600); }

  /* ------------------------------------------------------------ VAULT (encrypted records) */
  // Private records live on the server (Cloudflare Worker) — nothing private ships in this page.
  async function api(kind, code) {
    let r;
    try {
      r = await fetch(kind === 'team' ? '/api/verify' : '/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(kind === 'team' ? { code } : { id: code }) });
    } catch (e) { throw new Error('offline'); }
    if (!(r.headers.get('content-type') || '').includes('application/json')) throw new Error('offline');
    if (r.status === 404) return null;
    if (r.status === 429) throw new Error('rate');
    if (r.status === 503) throw new Error('setup');
    if (!r.ok) throw new Error('offline');
    const j = await r.json();
    return j && j.ok ? j.data : null;
  }
  const API_ERR = { rate: 'Too many attempts from this connection. Please wait 10 minutes and try again.', setup: 'Verification is being set up. Please try again shortly.', offline: 'Can’t reach the secure server right now. Check your connection and try again.' };
  function norm(raw, prefix) {
    let c = raw.toUpperCase().replace(/[\s_]+/g, '').replace(/[–—]/g, '-');
    if (/^\d{5}$/.test(c)) c = prefix + c;
    const bare = prefix.replace(/-/g, '');
    if (c.startsWith(bare) && /^\d{5}$/.test(c.slice(bare.length))) c = prefix + c.slice(bare.length);
    return c;
  }
  function guard(state, msgEl, btn) {
    if (state.lock > Date.now()) { msgEl.className = 'v-msg err'; msgEl.textContent = `Too many attempts. Try again in ${Math.ceil((state.lock - Date.now()) / 1000)}s.`; return false; }
    return true;
  }
  function fail(state, input, msgEl, text) {
    state.fails++;
    if (state.fails >= 5) { state.lock = Date.now() + 30000; state.fails = 0; text += ' Verification paused for 30 seconds.'; }
    msgEl.className = 'v-msg err'; msgEl.textContent = text;
    input.parentElement.classList.add('shake'); setTimeout(() => input.parentElement.classList.remove('shake'), 500);
  }

  const vState = { fails: 0, lock: 0 };
  $('#vaultForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = $('#vCode'), msg = $('#vMsg'), vault = $('#vaultForm');
    if (!guard(vState, msg)) return;
    const code = norm(input.value, 'MJR-TM-');
    if (!/^MJR-TM-\d{5}$/.test(code)) return fail(vState, input, msg, 'Codes look like MJR-TM-00000. Please check and try again.');
    msg.className = 'v-msg'; msg.textContent = 'Verifying credentials…'; vault.classList.add('scanning');
    let rec = null;
    try { [rec] = await Promise.all([api('team', code), new Promise(r => setTimeout(r, reduced ? 0 : 700))]); }
    catch (err) { vault.classList.remove('scanning'); msg.className = 'v-msg err'; msg.textContent = API_ERR[err.message] || API_ERR.offline; return; }
    vault.classList.remove('scanning');
    if (!rec) { $('#profile').classList.remove('show'); return fail(vState, input, msg, 'No team member matches this code. If someone is using the MJR LION name, please report it to our complaints line.'); }
    vState.fails = 0;
    msg.className = 'v-msg ok'; msg.innerHTML = `${VIS.icon('shield').replace('<svg', '<svg style="width:18px;height:18px"')} Verified — ${esc(rec.name)} is an official MJR LION team member.`;
    renderProfile(rec, code);
  });
  function renderProfile(p, code) {
    const list = items => `<ul class="pf-list">${items.map(it => typeof it === 'string' ? `<li>${esc(it)}</li>` : `<li>${esc(it.t)}<ul>${it.sub.map(s => `<li>${esc(s)}</li>`).join('')}</ul></li>`).join('')}</ul>`;
    const sec = (s, i) => `<section class="pf-sec glass" data-r style="--d:${Math.min(i, 6) * .05}s"><h3 class="label">${esc(s.t)}</h3>${s.list ? list(s.list) : ''}${s.paras ? s.paras.map(x => `<p>${esc(x)}</p>`).join('') : ''}${s.chips ? `<div class="techs">${s.chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>` : ''}</section>`;
    const reel = p.reel ? `<section class="pf-sec glass" data-r><h3 class="label">Video Editing Showcase</h3><p style="margin-bottom:18px">A selection of cinematic edits, colour grades and motion work by MJR.</p><div class="reel">${p.reel.map((r, i) => { const src = CFG.SHOWREEL[i]; return `<div class="reel-item" style="--ry:${(i % 3 - 1) * -8}deg">${src ? `<video src="${esc(src)}" muted loop playsinline preload="none" controls></video>` : '<span class="play"></span>'}<span class="cap">${esc(r)}</span></div>`; }).join('')}</div></section>` : '';
    const el = $('#profile');
    el.innerHTML = `<div class="pf-grid">
      <aside class="pf-side glass">${photo(p.key, p.mono, p.name)}<div class="pf-id"><span class="verified">${VIS.icon('shield').replace('<svg', '<svg style="width:14px;height:14px"')} Verified member</span><div class="dept-label">${esc(p.dept)}</div><h2>${esc(p.name)}</h2><div class="muted">${esc(p.role)}</div><div class="pf-code">ID ${esc(code.slice(0, 7))}•••${esc(code.slice(-2))}</div><button class="btn btn-ghost btn-sm" type="button" id="pfReset" style="margin-top:10px">Verify another member</button></div></aside>
      <div class="pf-main">
        <section class="pf-sec glass" data-r><div class="dept-label" style="margin-bottom:16px">${esc(p.dept)}</div><h3 class="label">Profile</h3>${p.intro.map(x => `<p>${esc(x)}</p>`).join('')}</section>
        ${p.sections.map(sec).join('')}${reel}
      </div></div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    enhance(el);
    $('#pfReset').onclick = () => { el.classList.remove('show'); el.innerHTML = ''; $('#vCode').value = ''; $('#vMsg').textContent = ''; $('#vCode').focus(); scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); };
    setTimeout(() => el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 120);
  }

  // project tracking
  const tState = { fails: 0, lock: 0 };
  if (CFG.DEMO_MODE) $('#tDemo').innerHTML = 'Demo mode — try <code>MJR-PRJ-26101</code>, <code>MJR-PRJ-26102</code> or <code>MJR-PRJ-26103</code>.';
  $('#trkForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = $('#tCode'), msg = $('#tMsg'), f = $('#trkForm');
    if (!guard(tState, msg)) return;
    const code = norm(input.value, 'MJR-PRJ-');
    if (!/^MJR-PRJ-\d{5}$/.test(code)) return fail(tState, input, msg, 'Tracking IDs look like MJR-PRJ-00000.');
    msg.className = 'v-msg'; msg.textContent = 'Authenticating & loading your project…'; f.classList.add('vault', 'scanning');
    let rec = null;
    try { [rec] = await Promise.all([api('projects', code), new Promise(r => setTimeout(r, reduced ? 0 : 600))]); }
    catch (err) { f.classList.remove('scanning'); msg.className = 'v-msg err'; msg.textContent = API_ERR[err.message] || API_ERR.offline; return; }
    f.classList.remove('scanning');
    if (!rec) { $('#dash').classList.remove('show'); return fail(tState, input, msg, 'We couldn’t find a project with that ID. Check your booking confirmation or call our helpline.'); }
    tState.fails = 0; msg.className = 'v-msg ok'; msg.textContent = 'Project found.';
    renderDash(rec);
  });
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  function renderDash(p) {
    const STAGES = ['Booked', 'In Progress', 'Review', 'Revision', 'Finalization', 'Completed'];
    const si = Math.max(0, STAGES.indexOf(p.status));
    const days = Math.ceil((new Date(p.expiry + 'T23:59:59') - new Date()) / 864e5);
    const remain = p.status === 'Completed' ? 'Completed' : days < 0 ? 'Past due' : days + (days === 1 ? ' day' : ' days');
    const paid = p.payment === 'PAID';
    const el = $('#dash');
    el.innerHTML = `
      <div class="dash-head glass"><div><div class="label">Project ${esc(p.id)}</div><h2>${esc(p.client)}</h2><div class="muted" style="margin-top:6px">${esc(p.service)} · ${esc(p.bookingType)} · ${esc(p.country)}</div></div>
        <div class="badges">${CFG.DEMO_MODE ? '<span class="badge demo"><i></i>Demo data</span>' : ''}<span class="badge stat"><i></i>${esc(p.status)}</span><span class="badge ${paid ? 'paid' : 'pending'}"><i></i>${paid ? 'Paid / Payment Clear' : 'Payment Pending'}</span></div></div>
      <div class="dash-grid">
        <div style="display:grid;gap:18px">
          <div class="prog glass"><div class="prog-top"><div><div class="label">Total project progress</div><div class="muted" style="margin-top:8px">Current stage: <b style="color:var(--text);font-weight:500">${esc(p.stage)}</b></div></div><div class="pct gold" data-pct="${p.progress}">0%</div></div>
            <div class="bar"><i></i></div>
            <div class="stages">${STAGES.map((s, i) => `<div class="stage ${i < si || p.status === 'Completed' ? 'done' : ''} ${i === si && p.status !== 'Completed' ? 'cur' : ''}">${s}</div>`).join('')}</div></div>
          <dl class="kv">${[['Client / booking name', p.client], ['Staff member who booked', p.bookedBy], ['Project number', p.id], ['Service booked', p.service], ['Project start date', fmt(p.start)], ['Project expiry date', fmt(p.expiry)], ['Country', p.country], ['Booking type', p.bookingType], ['Payment status', paid ? 'PAID / PAYMENT CLEAR' : 'PENDING'], ['Current project status', p.status], ['Assigned team member', p.assigned], ['Last update', fmt(p.lastUpdate)]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        </div>
        <aside class="side-card glass"><div class="label">Remaining time</div><div class="remain gold">${esc(remain)}</div><div class="muted" style="font-size:13px">Until ${fmt(p.expiry)}</div>
          <div class="label" style="margin-top:14px">Milestones</div><ul class="ms">${p.milestones.map(m => `<li class="${m.done ? 'done' : ''}">${esc(m.t)}<small>${fmt(m.d)}${m.done ? ' · done' : ''}</small></li>`).join('')}</ul>
          <div class="label">Important notes</div><div class="notes-box">${esc(p.notes)}</div>
          <a class="btn btn-ghost btn-sm" href="#contact">Contact your team</a></aside>
      </div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    requestAnimationFrame(() => setTimeout(() => {
      $('.bar i', el).style.width = p.progress + '%';
      const pc = $('[data-pct]', el), t0 = performance.now();
      (function step(t) { const k = Math.min(1, (t - t0) / (reduced ? 1 : 1800)); pc.textContent = Math.round(p.progress * (1 - Math.pow(1 - k, 4))) + '%'; if (k < 1) requestAnimationFrame(step); })(t0);
    }, 200));
    setTimeout(() => el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 120);
  }

  /* ------------------------------------------------------------ menu */
  function setMenu(open) { document.body.classList.toggle('menu-open', open); $('#burger').setAttribute('aria-expanded', open); $('#burger').setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); document.body.classList.toggle('locked', open); }
  $('#burger').addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#mnav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ------------------------------------------------------------ router */
  let current = null, pendingScroll = null, pendingMember = null, navTimer = null;
  function route(name, first) {
    if (!PAGES[name]) name = 'home';
    if (name === current) { if (!pendingScroll) scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); afterRoute(); return; }
    const prev = current ? $('#page-' + current) : null, next = $('#page-' + name);
    current = name;
    $$('[data-nav]').forEach(a => { const on = a.dataset.nav === name; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    document.title = PAGES[name].title;
    if (gl3d) gl3d.go(shapeFor(name), placement(name), { duration: name === 'home' ? 2.3 : 1.9 });
    const show = () => {
      if (prev) prev.classList.remove('active', 'leave', 'enter');
      next.classList.add('active');
      if (!first && !reduced) { next.classList.remove('enter'); void next.offsetWidth; next.classList.add('enter'); }
      try { scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { scrollTo(0, 0); }
      enhance(next);
      afterRoute();
    };
    clearTimeout(navTimer);
    if (prev && !reduced) {
      prev.classList.add('leave');
      const w = $('.wipe'); w.classList.remove('go'); void w.offsetWidth; w.classList.add('go');
      navTimer = setTimeout(show, 460);
    } else show();
  }
  function afterRoute() {
    if (pendingScroll && current === 'contact') { const id = pendingScroll; pendingScroll = null; setTimeout(() => $('#' + id).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }), 500); }
    if (pendingMember && current === 'team') { const m = pendingMember; pendingMember = null; const msg = $('#vMsg'); msg.className = 'v-msg'; msg.textContent = `Enter ${m}’s verification code to view the full verified profile.`; setTimeout(() => $('#vCode').focus({ preventScroll: true }), 700); }
  }
  addEventListener('hashchange', () => { closeOverlays(); route(location.hash.slice(1)); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.dataset.scrollto && current === 'contact') return;
    const h = a.getAttribute('href').slice(1);
    if (PAGES[h] && h === current) { e.preventDefault(); closeOverlays(); route(h); }
  });

  /* ------------------------------------------------------------ scroll */
  const hdr = $('#hdr');
  function onScroll() {
    const y = scrollY;
    hdr.classList.toggle('solid', y > 30);
    if (heroLion && current === 'home' && y < innerHeight * 1.5) heroLion.style.setProperty('--sy', (y * .22).toFixed(1));
    if (gl3d) gl3d.scroll(y, Math.max(current === 'home' ? .3 : .45, 1 - y / (innerHeight * 1.5)));
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { if (gl3d && current) gl3d.place(placement(current)); });
  if (fine && !reduced && heroLion) addEventListener('pointermove', e => {
    if (current !== 'home') return;
    heroLion.style.setProperty('--lx', ((e.clientX / innerWidth - .5) * -18).toFixed(1) + 'px');
    heroLion.style.setProperty('--ly', ((e.clientY / innerHeight - .5) * -12).toFixed(1) + 'px');
  }, { passive: true });

  /* ------------------------------------------------------------ intro */
  const big = $('#introBig');
  big.innerHTML = 'MJR LION AGENCY'.split('').map((ch, i) => ch === ' ' ? '<span class="sp"></span>' : `<span class="ch" style="--i:${i}">${ch}</span>`).join('');
  let introDone = false;
  function endIntro() {
    if (introDone) return; introDone = true;
    const intro = $('#intro');
    intro.classList.add('leave', 'out');
    document.body.classList.remove('intro-on');
    hdr.classList.remove('pre');
    route(location.hash.slice(1) || 'home', true);
    setTimeout(() => intro.remove(), 1300);
  }
  $('#skipIntro').addEventListener('click', endIntro);
  let seen = false;
  try { seen = sessionStorage.getItem('mjr-intro') === '1'; sessionStorage.setItem('mjr-intro', '1'); } catch (e) { }
  if (reduced || seen) { endIntro(); }
  else {
    if (gl3d) gl3d.go('galaxy', { x: 0, y: 0, s: isMobile() ? .55 : .95, o: .85, tilt: 0, spin: .35 }, { duration: 1.4, scatter: .4 });
    requestAnimationFrame(() => setTimeout(() => $('#intro').classList.add('play'), 60));
    setTimeout(endIntro, 3100);
    addEventListener('keydown', function k(e) { if (e.key === 'Enter' || e.key === ' ') { endIntro(); removeEventListener('keydown', k); } });
  }
  // pre-build every 3D sculpture in idle time so page switches never stutter
  if (gl3d) {
    const queue = ['lion', 'embers', 'geodesic', 'knot', 'orbits', 'vault', 'bars', 'helix', 'globe'];
    const idle = window.requestIdleCallback || (f => setTimeout(f, 200));
    (function next() { if (!queue.length) return; idle(() => { gl3d.prewarm([queue.shift()]); next(); }, { timeout: 2500 }); })();
  }
  enhance($('#ftr'));
  onScroll();
})();
