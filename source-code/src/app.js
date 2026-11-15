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
    team: { shape: 'vault', title: 'Meet Our Team — Verification — MJR LION AGENCY', tilt: .1 },
    updates: { shape: 'knot', title: 'Updates — MJR LION AGENCY', tilt: .3 },
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
    [sheet, $('#adminModal')].filter(Boolean).forEach(o => { if (!only || o === only) o.classList.remove('open'); });
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

  /* ------------------------------------------------------------ UPDATES (feed + admin) */
  const UT = { offer: 'Offer', merger: 'Merger & Partnership', news: 'News', update: 'Update', alert: 'Important' };
  const US = { token: null, me: null, posts: [], f: 'all', loaded: false, at: 0, img: null, checked: false };
  try { US.token = localStorage.getItem('mjr-admin') || null; } catch (e) { }
  const feedEl = $('#feed'), compEl = $('#composer'), adminPanel = $('#adminPanel'), adminModal = $('#adminModal');
  async function uapi(path, method, body) {
    const h = {};
    if (body) h['content-type'] = 'application/json';
    if (US.token) h.authorization = 'Bearer ' + US.token;
    let r;
    try { r = await fetch(path, { method: method || 'GET', headers: h, body: body ? JSON.stringify(body) : undefined }); } catch (e) { return { status: 0, data: {} }; }
    if (!(r.headers.get('content-type') || '').includes('application/json')) return { status: 0, data: {} };
    let data = {}; try { data = await r.json(); } catch (e) { }
    return { status: r.status, data };
  }
  const ERR = { rate_limited: 'Too many attempts. Please wait 10 minutes.', invalid: 'Username or password is incorrect.', not_configured: 'Secure server is being set up. Please try again shortly.', storage_not_configured: 'Updates storage is being set up. Please try again shortly.', image: 'This photo format is not supported.', image_too_large: 'Photo is too large. Please choose a smaller one.', too_large: 'Photo is too large. Please choose a smaller one.', empty: 'Write something or add a photo first.', weak: 'New password must be at least 10 characters.', name: 'Please enter the member’s name.', limit: 'Admin limit reached (25).', forbidden: 'Only the owner can do this.' };
  const errText = r => r.status === 0 ? 'Can’t reach the server. Check your connection and try again.' : (ERR[r.data.error] || 'Something went wrong. Please try again.');
  const ago = ms => {
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return 'Just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; if (s < 604800) return Math.floor(s / 86400) + 'd ago';
    return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const linkify = t => esc(t).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g, '<a href="$1" target="_blank" rel="noopener nofollow">$1</a>');
  const ICO_SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
  const ICO_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
  function postHTML(p) {
    return `<article class="post glass" data-id="${esc(p.id)}">
      <header class="post-h"><div class="post-av">${VIS.lionMark('pa-' + esc(p.id))}</div>
        <div><div class="post-au">MJR LION AGENCY <i title="Official">✓</i></div><div class="post-meta">${esc(p.author || 'MJR LION')}${p.atitle ? ' · ' + esc(p.atitle) : ''} · <time datetime="${new Date(p.at).toISOString()}">${ago(p.at)}</time></div></div>
        <span class="post-tag t-${esc(p.type)}">${esc(UT[p.type] || 'Update')}</span></header>
      ${p.title ? `<h3>${esc(p.title)}</h3>` : ''}
      ${p.body ? `<div class="post-body">${linkify(p.body)}</div>` : ''}
      ${p.img ? `<div class="post-img"><img src="/api/media/${esc(p.img)}" alt="${esc(p.title || UT[p.type] || 'Update')}" loading="lazy" decoding="async"${p.w && p.h ? ` width="${+p.w}" height="${+p.h}"` : ''}></div>` : ''}
      <footer class="post-f"><button type="button" data-share="${esc(p.id)}">${ICO_SHARE}Share</button>${US.me ? `<button type="button" class="del" data-del="${esc(p.id)}">${ICO_DEL}Delete</button>` : ''}</footer>
    </article>`;
  }
  function renderFilters() {
    $('#uFilters').innerHTML = [['all', 'All']].concat(Object.entries(UT)).map(([k, v]) => `<button type="button" role="tab" class="${US.f === k ? 'on' : ''}" aria-selected="${US.f === k}" data-uf="${k}">${esc(v)}</button>`).join('');
  }
  function renderFeed() {
    if (!US.loaded) { feedEl.innerHTML = '<div class="sk"></div><div class="sk"></div>'; return; }
    const list = US.posts.filter(p => US.f === 'all' || p.type === US.f);
    feedEl.innerHTML = list.length ? list.map(postHTML).join('') :
      `<div class="feed-empty glass"><b>${US.posts.length ? 'Nothing in this category yet.' : 'No updates yet.'}</b>New offers, partnerships and announcements will appear here.</div>`;
  }
  function renderComposer() {
    if (!US.me) { compEl.innerHTML = ''; $('#adminBtn').textContent = 'Admin Login'; return; }
    $('#adminBtn').textContent = 'Admin Panel';
    compEl.innerHTML = `<form class="composer glass" id="cmForm" novalidate>
      <div class="cm-top"><div class="post-av">${VIS.lionMark('pa-me')}</div><div><b>${esc(US.me.name)}</b><small>${esc(US.me.role === 'owner' ? 'Owner' : (US.me.title || 'Admin'))} · posting as MJR LION AGENCY</small></div>
        <div class="cm-act"><button class="btn btn-ghost btn-sm" type="button" data-admin-open>Admin Panel</button></div></div>
      <div class="cm-row"><label class="sr" for="cmType">Category</label><select class="fi" id="cmType">${Object.entries(UT).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select>
        <label class="sr" for="cmTitle">Title</label><input class="fi" id="cmTitle" maxlength="140" placeholder="Headline (optional)"></div>
      <label class="sr" for="cmBody">Post</label><textarea class="fi" id="cmBody" maxlength="5000" placeholder="Share an offer, partnership, merger or announcement…"></textarea>
      <div id="cmPrev"></div>
      <div class="cm-bar"><label class="btn btn-ghost btn-sm file-btn">Add Photo<input type="file" id="cmFile" accept="image/*"></label><span class="cm-msg" id="cmMsg"></span><button class="btn btn-gold btn-sm" type="submit" id="cmPost">Post Update <span class="arr">→</span></button></div>
    </form>`;
    $('#cmFile').onchange = async e => {
      const f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      const msg = $('#cmMsg'); msg.className = 'cm-msg'; msg.textContent = 'Preparing photo…';
      try { US.img = await shrink(f); $('#cmPrev').innerHTML = `<div class="cm-prev"><img src="${US.img.data}" alt="Selected photo"><button type="button" id="cmRm" aria-label="Remove photo">×</button></div>`; $('#cmRm').onclick = () => { US.img = null; $('#cmPrev').innerHTML = ''; }; msg.textContent = ''; }
      catch (err) { msg.className = 'cm-msg err'; msg.textContent = 'Couldn’t read this photo. Try a JPG or PNG.'; }
    };
    $('#cmForm').onsubmit = async e => {
      e.preventDefault();
      const msg = $('#cmMsg'), btn = $('#cmPost');
      const body = { type: $('#cmType').value, title: $('#cmTitle').value.trim(), body: $('#cmBody').value.trim() };
      if (US.img) Object.assign(body, { image: US.img.data, w: US.img.w, h: US.img.h });
      if (!body.title && !body.body && !body.image) { msg.className = 'cm-msg err'; msg.textContent = ERR.empty; return; }
      btn.disabled = true; msg.className = 'cm-msg'; msg.textContent = 'Posting…';
      const r = await uapi('/api/posts', 'POST', body);
      btn.disabled = false;
      if (r.status === 401) return logout(true);
      if (!r.data.ok) { msg.className = 'cm-msg err'; msg.textContent = errText(r); return; }
      US.posts.unshift(r.data.post); US.img = null; renderComposer(); renderFeed(); toast('Update posted');
    };
  }
  function shrink(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
        URL.revokeObjectURL(url);
        let data = c.toDataURL('image/webp', .82);
        if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/jpeg', .85);
        res({ data, w, h });
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
      im.src = url;
    });
  }
  async function loadUpdates(force) {
    renderFilters();
    if (!US.checked && US.token) { US.checked = true; const r = await uapi('/api/admin/me'); if (r.data.ok) US.me = r.data.me; else if (r.status === 401) logout(false); }
    renderComposer();
    if (!force && US.loaded && Date.now() - US.at < 30000) return renderFeed();
    if (!US.loaded) renderFeed();
    const r = await uapi('/api/posts');
    US.loaded = true; US.at = Date.now();
    if (r.data.ok) { US.posts = r.data.posts || []; renderFeed(); }
    else feedEl.innerHTML = `<div class="feed-empty glass"><b>Updates couldn’t load.</b>${esc(errText(r))}</div>`;
  }
  function logout(expired) {
    US.token = null; US.me = null; try { localStorage.removeItem('mjr-admin'); } catch (e) { }
    renderComposer(); renderFeed(); if (expired) toast('Session expired. Please log in again.');
    if (adminModal.classList.contains('open')) renderAdmin();
  }
  $('#uFilters').addEventListener('click', e => { const b = e.target.closest('[data-uf]'); if (!b) return; US.f = b.dataset.uf; renderFilters(); renderFeed(); });
  feedEl.addEventListener('click', async e => {
    const sh = e.target.closest('[data-share]');
    if (sh) {
      const p = US.posts.find(x => x.id === sh.dataset.share), url = location.origin + location.pathname + '#updates';
      try { if (navigator.share) { await navigator.share({ title: (p && p.title) || 'MJR LION AGENCY — Update', text: p ? (p.title || p.body || '').slice(0, 140) : '', url }); return; } } catch (err) { if (err && err.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch (err) { toast(url); }
      return;
    }
    const d = e.target.closest('[data-del]');
    if (d) {
      if (!d.classList.contains('arm')) { d.classList.add('arm'); d.lastChild.textContent = 'Confirm delete'; setTimeout(() => { if (d.isConnected) { d.classList.remove('arm'); d.lastChild.textContent = 'Delete'; } }, 4000); return; }
      d.disabled = true;
      const r = await uapi('/api/posts/' + encodeURIComponent(d.dataset.del), 'DELETE');
      if (r.status === 401) return logout(true);
      if (r.data.ok) { US.posts = US.posts.filter(x => x.id !== d.dataset.del); renderFeed(); toast('Post deleted'); }
      else { d.disabled = false; toast(errText(r)); }
    }
  });

  // admin panel (login · manage admins · change password)
  function openAdmin() { lastFocus = document.activeElement; renderAdmin(); adminModal.classList.add('open'); document.body.classList.add('locked'); setTimeout(() => { const f = $('input', adminPanel); f && f.focus({ preventScroll: true }); }, 80); }
  $('#adminBtn').addEventListener('click', openAdmin);
  document.addEventListener('click', e => { if (e.target.closest('[data-admin-open]')) openAdmin(); });
  async function renderAdmin() {
    const close = '<button class="sheet-close" type="button" data-close aria-label="Close"></button>';
    if (!US.me) {
      adminPanel.innerHTML = `${close}<div class="admin-body"><div class="label">Updates · Admin</div><h3>Log in to post updates</h3><p class="muted" style="font-size:14px">Only the MJR LION owner and admins approved by the owner can post.</p>
        <form id="lgForm" autocomplete="on"><label class="sr" for="lgU">Username</label><input class="fi" id="lgU" autocomplete="username" placeholder="Username" autocapitalize="none" spellcheck="false">
        <label class="sr" for="lgP">Password</label><input class="fi" id="lgP" type="password" autocomplete="current-password" placeholder="Password">
        <button class="btn btn-gold" type="submit">Log In</button><div class="v-msg" id="lgMsg" role="status"></div></form></div>`;
      $('#lgForm').onsubmit = async e => {
        e.preventDefault();
        const m = $('#lgMsg'); m.className = 'v-msg'; m.textContent = 'Checking…';
        const r = await uapi('/api/admin/login', 'POST', { username: $('#lgU').value.trim(), password: $('#lgP').value });
        if (!r.data.ok) { m.className = 'v-msg err'; m.textContent = errText(r); return; }
        US.token = r.data.token; US.me = r.data.me; US.checked = true; try { localStorage.setItem('mjr-admin', US.token); } catch (err) { }
        renderComposer(); renderFeed(); renderAdmin(); toast('Welcome, ' + US.me.name);
      };
      return;
    }
    const owner = US.me.role === 'owner';
    adminPanel.innerHTML = `${close}<div class="admin-body"><div class="label">${owner ? 'Owner' : 'Admin'} panel</div><h3>${esc(US.me.name)}</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-gold btn-sm" type="button" data-close>Write a Post</button><button class="btn btn-ghost btn-sm" type="button" id="lgOut">Log Out</button></div>
      ${owner ? `<hr><div class="label">Admins who can post</div><div class="ad-list" id="adList"><div class="muted" style="font-size:14px">Loading…</div></div>
        <form id="adForm"><div class="cm-row" style="grid-template-columns:1fr 1fr"><label class="sr" for="adN">Name</label><input class="fi" id="adN" placeholder="Member name" maxlength="60"><label class="sr" for="adT">Role</label><input class="fi" id="adT" placeholder="Role, e.g. Marketing Manager" maxlength="60"></div>
        <button class="btn btn-ghost btn-sm" type="submit">Make Admin</button><div id="adMsg"></div></form>` : ''}
      <hr><div class="label">Change password</div>
      <form id="pwForm"><label class="sr" for="pwC">Current password</label><input class="fi" id="pwC" type="password" autocomplete="current-password" placeholder="Current password">
      <label class="sr" for="pwN">New password</label><input class="fi" id="pwN" type="password" autocomplete="new-password" placeholder="New password (10+ characters)">
      <button class="btn btn-ghost btn-sm" type="submit">Update Password</button><div class="v-msg" id="pwMsg" role="status"></div></form></div>`;
    $('#lgOut').onclick = () => { logout(false); closeOverlays(adminModal); toast('Logged out'); };
    $('#pwForm').onsubmit = async e => {
      e.preventDefault();
      const m = $('#pwMsg'); m.className = 'v-msg'; m.textContent = 'Saving…';
      const r = await uapi('/api/admin/password', 'POST', { current: $('#pwC').value, next: $('#pwN').value });
      if (r.status === 401 && r.data.error === 'unauthorized') return logout(true);
      m.className = 'v-msg ' + (r.data.ok ? 'ok' : 'err'); m.textContent = r.data.ok ? 'Password updated.' : (r.data.error === 'invalid' ? 'Current password is incorrect.' : errText(r));
      if (r.data.ok) { $('#pwC').value = ''; $('#pwN').value = ''; }
    };
    if (!owner) return;
    const list = async () => {
      const r = await uapi('/api/admin/users');
      if (r.status === 401) return logout(true);
      const el = $('#adList'); if (!el) return;
      el.innerHTML = r.data.ok ? (r.data.admins.length ? r.data.admins.map(a => `<div class="ad-item"><div><b>${esc(a.name)}</b><small>${esc(a.title || 'Admin')} · username: ${esc(a.u)}</small></div><button type="button" data-rm="${esc(a.u)}">Remove</button></div>`).join('') : '<div class="muted" style="font-size:14px">No admins yet. Only you can post.</div>') : `<div class="cm-msg err">${esc(errText(r))}</div>`;
    };
    list();
    $('#adList').onclick = async e => {
      const b = e.target.closest('[data-rm]'); if (!b) return;
      if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = 'Confirm'; return; }
      const r = await uapi('/api/admin/users/' + encodeURIComponent(b.dataset.rm), 'DELETE');
      if (r.data.ok) { toast('Admin removed'); list(); } else toast(errText(r));
    };
    $('#adForm').onsubmit = async e => {
      e.preventDefault();
      const m = $('#adMsg');
      const r = await uapi('/api/admin/users', 'POST', { name: $('#adN').value.trim(), title: $('#adT').value.trim() });
      if (!r.data.ok) { m.innerHTML = `<div class="cm-msg err">${esc(errText(r))}</div>`; return; }
      const cred = `Username: ${r.data.admin.u}\nPassword: ${r.data.password}`;
      m.innerHTML = `<div class="cred"><b>${esc(r.data.admin.name)}</b> is now an admin. Share these login details privately — the password is shown only once.<br>Username: <code>${esc(r.data.admin.u)}</code><br>Password: <code>${esc(r.data.password)}</code><br><button class="btn btn-ghost btn-sm" type="button" id="adCopy" style="margin-top:8px">Copy Details</button></div>`;
      $('#adCopy').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(cred) : Promise.reject()).then(() => toast('Copied'), () => toast('Select the details to copy them')); };
      $('#adN').value = ''; $('#adT').value = ''; list();
    };
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
    if (current === 'updates') loadUpdates();
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
    const queue = ['lion', 'embers', 'geodesic', 'bars', 'vault', 'knot', 'helix', 'globe'];
    const idle = window.requestIdleCallback || (f => setTimeout(f, 200));
    (function next() { if (!queue.length) return; idle(() => { gl3d.prewarm([queue.shift()]); next(); }, { timeout: 2500 }); })();
  }
  enhance($('#ftr'));
  onScroll();
})();
