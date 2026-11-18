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
  // router state — declared first so nothing can touch it before it exists
  let current = null, pendingScroll = null, pendingMember = null, navTimer = null;
  const isMobile = () => window.innerWidth < 760 || window.innerWidth / window.innerHeight < .8;

  document.body.insertAdjacentHTML('afterbegin', VIS.DEFS);
  $('#logoMark').outerHTML = VIS.lionMark('lm-h');
  $('#ftrMark').outerHTML = VIS.lionMark('lm-f');
  $('#yr').textContent = new Date().getFullYear();

  /* ------------------------------------------------------------ 3D engine */
  let gl3d = null;
  const NAV = navigator, conn = NAV.connection || {};
  const weak = (NAV.deviceMemory && NAV.deviceMemory <= 4) || (NAV.hardwareConcurrency && NAV.hardwareConcurrency <= 4);
  const skip3d = conn.saveData || (NAV.deviceMemory && NAV.deviceMemory <= 2);     // data-saver or very low-memory phones: no 3D at all
  try { if (!skip3d) gl3d = window.MJR3D.Engine($('#gl'), { mobile: isMobile(), reduced, lowPower: weak }); } catch (e) { console.warn(e); }
  if (gl3d && 'MutationObserver' in window) new MutationObserver(() => gl3d.pause(document.body.classList.contains('locked'))).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  if (!gl3d) { document.documentElement.classList.add('no-gl'); $('#fallback').innerHTML = VIS.lionMark('lm-bg'); }

  const PAGES = {
    home: { shape: 'lion', title: 'MJR LION AGENCY — Premium Digital Agency | Your Success Our Pride' },
    services: { shape: 'geodesic', title: 'Services — MJR LION AGENCY', tilt: .25 },
    team: { shape: 'vault', title: 'Meet Our Team — Verification — MJR LION AGENCY', tilt: .1 },
    updates: { shape: 'knot', title: 'Updates — MJR LION AGENCY', tilt: .3 },
    portal: { shape: 'helix', title: 'Admin Portal — MJR LION AGENCY', tilt: .12 },
    pricing: { shape: 'bars', title: 'Pricing — MJR LION AGENCY', tilt: .22 },
    track: { shape: 'helix', title: 'Track Your Project — MJR LION AGENCY', tilt: .12 },
    contact: { shape: 'globe', title: 'Contact Us — MJR LION AGENCY', tilt: .35 }
  };
  function placement(name) {
    const aspect = window.innerWidth / window.innerHeight, halfW = 2.41 * aspect, P = PAGES[name];
    if (isMobile()) {
      return name === 'home' ? { x: 0, y: .3, s: Math.min(.6, halfW * .5), o: 1.15, tilt: 0 } : { x: halfW * .2, y: 1.25, s: Math.min(.55, halfW * .42), o: .32, tilt: P.tilt || 0 };
    }
    if (name === 'home') return { x: Math.min(1.25, halfW * .22), y: -.05, s: 1, o: 1.05, tilt: 0 };   // behind the headline, medium opacity
    if (name === 'team' || name === 'track') return { x: Math.min(3.4, halfW * .78), y: .2, s: .78, o: .38, tilt: P.tilt || 0 };
    return { x: Math.min(2.7, halfW * .6), y: .1, s: .8, o: name === 'pricing' ? .42 : .55, tilt: P.tilt || 0 };
  }

  /* home: animated 3D particle lion behind the headline (jumps toward the screen every few seconds) */
  const shapeFor = n => PAGES[n].shape;

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
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px 12% 0px', threshold: 0 }) : null;
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
  function markLoaded(root) { $$('.viz img:not(.ld)', root).forEach(i => { if (i.complete) i.classList.add('ld'); }); }
  document.addEventListener('load', e => { if (e.target.tagName === 'IMG') e.target.classList.add('ld'); }, true);
  document.addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.classList.add('ld'); }, true);
  function enhance(root) { observe(root); bindTilt(root); bindMag(root); markLoaded(root); }

  if (gl3d) addEventListener('pointermove', e => gl3d.pointer(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)), { passive: true });

  /* ------------------------------------------------------------ visuals */
  function viz(svc, extra) {
    const img = CFG.IMAGES['svc-' + svc.id], P = (CFG.IMAGE_POS || {})['svc-' + svc.id];
    const pos = P && typeof P === 'object' ? (extra === 'v2' ? P.detail : P.card) : P;   // separate focus for card vs detail view
    let tag = '';
    if (img) {
      const alt = `${svc.name} by MJR LION AGENCY`, st = pos ? ` style="object-position:${esc(pos)}"` : '';
      const sizes = extra === 'v2' ? '(max-width:860px) 92vw, 44vw' : '(max-width:760px) 62vw, (max-width:1100px) 46vw, 30vw';
      tag = /\.(webp|avif|jpe?g|png)(\?|$)/i.test(img)
        ? `<img src="${esc(img)}" alt="${esc(alt)}" loading="lazy" decoding="async"${st}>`
        : `<img src="${esc(img)}-1600.webp" srcset="${esc(img)}-960.webp 960w, ${esc(img)}-1600.webp 1600w" sizes="${sizes}" width="1600" height="901" alt="${esc(alt)}" loading="lazy" decoding="async"${st}>`;
    }
    const lq = img && (CFG.IMAGE_LQIP || {})['svc-' + svc.id];
    const bg = lq ? ` style="background-image:url(${lq})${pos ? ';background-position:' + esc(pos) : ''}"` : '';
    return `<div class="viz ${extra || ''}${img ? ' has-img' : ''}"${bg} data-art="${esc(svc.art)}">${img ? tag : `<div class="vz-art">${VIS.ART[svc.icon]}</div><span class="vz-chip">${esc(svc.chip)}</span><span class="vz-slot">Image slot · ${esc(svc.art)}</span>`}<span class="shine"></span></div>`;
  }
  function photo(key, mono, name, own) {
    const src = own || CFG.TEAM_PHOTOS[key];
    return `<div class="photo">${src ? `<img src="${esc(src)}" alt="${esc(name)}" loading="lazy">` : `<div class="ring"></div><div class="mono"><span>${esc(mono)}</span></div><span class="vz-slot">Photo slot · professional portrait</span>`}</div>`;
  }
  const SVC = Object.fromEntries(SERVICES.map(s => [s.id, s]));
  const half = t => { const w = t.split(' '); return w.length < 10 ? t : w.slice(0, Math.ceil(w.length / 2)).join(' ').replace(/[,.—–-]+$/, '') + '…'; };

  /* ------------------------------------------------------------ HOME */
  $('#marquee').innerHTML = [0, 1].map(() => SERVICES.map(s => `<span>${esc(s.name)} <em>✦</em></span>`).join('')).join('');

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
        ${[
          ['Features', `<ul class="ticks">${s.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`],
          ['Benefits', `<ul class="ticks">${s.benefits.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`],
          ['Process', `<ol class="steps">${s.process.map(p => `<li>${esc(p)}</li>`).join('')}</ol>`],
          ['Estimated Timeline', `<div class="timeline-pill">${VIS.icon('clock')}<span>${esc(s.timeline)}</span></div>`],
          ['Technologies', `<div class="techs">${s.tech.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>`],
          s.wins && s.wins.length ? ['Client Success Highlights', `<div class="wins">${s.wins.map(([b, t]) => `<div class="win"><b class="gold">${esc(b)}</b>${esc(t)}</div>`).join('')}</div>`] : null,
          ['Frequently Asked Questions', faqs]
        ].filter(Boolean).map(([t, h], i) => accItem(String(i + 1).padStart(2, '0'), t, h, i === 0)).join('')}
        <div class="sd-cta"><div><div class="label">Ready?</div><div class="h-md" style="margin-top:8px">Start your ${esc(s.name)} project.</div></div><div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-ghost" href="#pricing" data-close>View Pricing</a><a class="btn btn-gold" href="#contact" data-svc="${s.id}" data-close data-mag>Start This Project <span class="arr">→</span></a></div></div>
      </div>`;
    sheetPanel.scrollTop = 0;
    $('.timeline-pill svg', sheetPanel) && ($('.timeline-pill svg', sheetPanel).style.width = '22px');
    sheet.classList.add('open'); document.body.classList.add('locked');
    bindMag(sheetPanel);
    setTimeout(() => $('.sheet-close', sheetPanel).focus({ preventScroll: true }), 50);
  }
  function closeOverlays(only) {
    [sheet, $('#adminModal'), $('#leadModal')].filter(Boolean).forEach(o => { if (!only || o === only) o.classList.remove('open'); });
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
  const mail = m => m.includes('@') ? `<a href="mailto:${esc(m)}">${esc(m)}</a>` : esc(m);
  $('#cGrid').innerHTML = [
    { i: 'mail', l: 'Email', v: C.emails.map(mail).join('<br>') },
    { i: 'phone', l: 'Helpline', v: C.helpline.map(tel).join('<br>') },
    { i: 'alert', l: 'Complaints', v: C.complaints.map(tel).join('<br>') }
  ].map((c, i) => `<div class="c-card tilt" data-r style="--d:${i * .08}s"><div class="c-ico z2">${VIS.icon(c.i)}</div><div class="label z1">${c.l}</div><div class="v z2">${c.v}</div>${c.i === 'alert' ? '<button class="btn btn-ghost btn-sm c-act z2" type="button" data-complaint>File a Complaint <span class="arr">→</span></button>' : ''}</div>`).join('');
  $('#ftrContact').innerHTML = `<div><span>Helpline</span>${C.helpline.map(tel).join('<br>')}</div><div><span>Complaints</span>${tel(C.complaints[0])}</div><div><span>Email</span>${C.emails.map(mail).join('<br>')}</div>`;
  const SOC = (C.social || []).filter(s => s && /^https:\/\//.test(s.url));
  const socPill = s => `<a class="soc-pill" href="${esc(s.url)}" target="_blank" rel="noopener me" aria-label="${esc(s.name)} ${esc(s.handle || '')} (opens in a new tab)"><span class="soc-n">${esc(s.name)}</span>${s.handle ? `<span class="soc-h">${esc(s.handle)}</span>` : ''}<span class="arr" aria-hidden="true">↗</span></a>`;
  if (SOC.length) {
    const sr = $('#socRow'); sr.hidden = false;
    sr.innerHTML = `<div class="label">Follow MJR Lion</div><div class="soc">${SOC.map(socPill).join('')}</div>`;
    $('#ftrSoc').innerHTML = SOC.map(socPill).join('');
  }
  $('#vLockIco').innerHTML = VIS.icon('lock'); $('#tLockIco').innerHTML = VIS.icon('key');
  /* ---------- project / complaint form (contact page + popup everywhere) */
  const SVC_OPTS = SERVICES.map(s => s.name).concat(['All-in-One Standard Brand Program', 'All-in-One Premium Brand Program', 'Not sure yet — advise me']);
  function formHTML(px) {
    return `
      <fieldset class="qtype full"><legend class="sr">What is this about?</legend>
        <label><input type="radio" name="type" value="inquiry" checked><span>New project / Inquiry</span></label>
        <label><input type="radio" name="type" value="complaint"><span>Complaint</span></label>
      </fieldset>
      <div class="fld"><label for="${px}-name">Name</label><input id="${px}-name" name="name" autocomplete="name" maxlength="100" required><span class="err"></span></div>
      <div class="fld"><label for="${px}-email">Email</label><input id="${px}-email" name="email" type="email" autocomplete="email" maxlength="160" required><span class="err"></span></div>
      <div class="fld"><label for="${px}-phone">Phone / WhatsApp</label><input id="${px}-phone" name="phone" type="tel" autocomplete="tel" maxlength="40"><span class="err"></span></div>
      <div class="fld"><label for="${px}-company">Company</label><input id="${px}-company" name="company" autocomplete="organization" maxlength="120"><span class="err"></span></div>
      <div class="fld full"><label for="${px}-svc" data-svc-label>Service interested in</label><select id="${px}-svc" name="service"><option value="">Select a service…</option>${SVC_OPTS.map(o => `<option>${esc(o)}</option>`).join('')}</select><span class="err"></span></div>
      <div class="fld full only-complaint" hidden><label for="${px}-proj">Project / Tracking ID (optional)</label><input id="${px}-proj" name="project" maxlength="40" placeholder="e.g. MJR-PRJ-7K4P-Q9XD"><span class="err"></span></div>
      <div class="fld full"><label for="${px}-msg" data-msg-label>Message</label><textarea id="${px}-msg" name="message" maxlength="4000" required placeholder="Your goals, timeline and budget range…"></textarea><span class="err"></span></div>
      <div class="hp" aria-hidden="true"><label for="${px}-web">Website</label><input id="${px}-web" name="website" tabindex="-1" autocomplete="off"></div>
      <div class="actions"><button class="btn btn-gold" type="submit">Submit <span class="arr">→</span></button><span class="muted f-note" style="font-size:13px">We reply to every message within 24 hours.</span></div>
      <div class="f-alert" role="alert" hidden></div>`;
  }
  let formCfg = null;
  async function getFormCfg() {
    if (formCfg) return formCfg;
    try { const r = await fetch('/api/form-config'); const j = await r.json(); if (j && j.ok) formCfg = j; } catch (e) { }
    return formCfg || { services: '', complaints: '' };
  }
  async function deliverEmail(type, d, ref) {
    // email copy straight to the right MJR inbox (services vs complaints) — the visitor never sees where it goes
    const cfg = await getFormCfg(), key = type === 'complaint' ? cfg.complaints : cfg.services;
    if (!key) return false;
    const subject = type === 'complaint' ? `Complaint ${ref} — ${d.name}` : `New inquiry ${ref} — ${d.service || 'General'} — ${d.name}`;
    try {
      const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ access_key: key, subject, from_name: 'MJR LION AGENCY Website', replyto: d.email, 'Reference': ref, 'Type': type === 'complaint' ? 'Complaint' : 'New project / Inquiry', 'Name': d.name, 'Email': d.email, 'Phone': d.phone || '—', 'Company': d.company || '—', 'Service': d.service || '—', 'Project ID': d.project || '—', 'Message': d.message, botcheck: '' }) });
      const j = await r.json().catch(() => ({}));
      return !!j.success;
    } catch (e) { return false; }
  }
  function setType(form, type) {
    const c = type === 'complaint';
    $('[data-svc-label]', form).textContent = c ? 'Related service (optional)' : 'Service interested in';
    $('[data-msg-label]', form).textContent = c ? 'Describe the issue' : 'Message';
    form.elements.message.placeholder = c ? 'What went wrong, and when? We take every complaint seriously.' : 'Your goals, timeline and budget range…';
    $('.only-complaint', form).hidden = !c;
    form.classList.toggle('is-complaint', c);
  }
  function bindForm(form, px) {
    form.innerHTML = formHTML(px);
    form.addEventListener('change', e => { if (e.target.name === 'type') setType(form, e.target.value); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.dataset.busy) return;
      const v = n => (form.elements[n] ? form.elements[n].value.trim() : '');
      const type = (form.querySelector('input[name=type]:checked') || {}).value === 'complaint' ? 'complaint' : 'inquiry';
      const rules = { name: v('name').length > 1 || 'Please enter your name.', email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email')) || 'Please enter a valid email address.', service: type === 'complaint' || !!v('service') || 'Please choose a service.', message: v('message').length >= 10 || 'Please write a little more (at least 10 characters).' };
      let ok = true, first = null;
      Object.entries(rules).forEach(([k, r]) => { const f = form.elements[k].closest('.fld'); f.classList.toggle('bad', r !== true); $('.err', f).textContent = r === true ? '' : r; if (r !== true) { ok = false; first = first || form.elements[k]; } });
      if (!ok) { form.classList.add('shake'); setTimeout(() => form.classList.remove('shake'), 500); first.focus(); return; }
      const d = { type, name: v('name'), email: v('email'), phone: v('phone'), company: v('company'), service: v('service'), project: v('project'), message: v('message'), website: v('website'), page: current || '' };
      const btn = $('button[type=submit]', form), alertEl = $('.f-alert', form);
      form.dataset.busy = '1'; btn.disabled = true; btn.innerHTML = 'Sending… <span class="spin"></span>'; alertEl.hidden = true;
      let res = null;
      try { const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) }); res = { status: r.status, data: await r.json().catch(() => ({})) }; } catch (err) { res = { status: 0, data: {} }; }
      let ref = res.data && res.data.ok ? res.data.ref : null;
      const mailed = d.website ? true : await deliverEmail(type, d, ref || 'MJR-WEB');
      delete form.dataset.busy; btn.disabled = false; btn.innerHTML = 'Submit <span class="arr">→</span>';
      if (!ref && !mailed) {
        alertEl.hidden = false;
        alertEl.textContent = res.status === 429 ? 'You have sent several messages in a short time. Please wait a few minutes and try again.' : 'We couldn’t send your message right now. Please check your internet connection and try again.';
        return;
      }
      ref = ref || 'Received';
      const first2 = esc(d.name.split(' ')[0]);
      form.innerHTML = `<div class="f-done full" role="status">
        <div class="f-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h3>${type === 'complaint' ? `Thank you, ${first2}. Your complaint has been received.` : `Thank you, ${first2}! Your message has been received.`}</h3>
        <p>${type === 'complaint' ? 'We’re sorry for the trouble. Our complaints team will review it and contact you' : 'Our team will review your request and get back to you'} at <b>${esc(d.email)}</b> within 24 hours.</p>
        <div class="f-ref">Reference: <b>${esc(ref)}</b></div>
        <button class="btn btn-ghost btn-sm" type="button" data-again>Send another message</button></div>`;
      $('[data-again]', form).onclick = () => { bindForm(form, px); const f = form.elements.name; f && f.focus(); };
      if (!form.closest('.modal')) form.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }
  const pageForm = $('#brief'), leadForm = $('#leadForm'), leadModal = $('#leadModal');
  bindForm(pageForm, 'f'); bindForm(leadForm, 'lm');
  function presetForm(form, opts) {
    if (!form.elements.name) bindForm(form, form === leadForm ? 'lm' : 'f');      // fresh form after a previous success
    const t = opts.type || 'inquiry';
    const r = form.querySelector(`input[name=type][value=${t}]`); if (r) { r.checked = true; setType(form, t); }
    if (opts.service) form.elements.service.value = opts.service;
  }
  function openLead(opts) {
    lastFocus = document.activeElement;
    presetForm(leadForm, opts);
    const c = opts.type === 'complaint';
    $('#leadKicker').textContent = c ? 'Complaints' : (opts.service ? opts.service : 'Start your project');
    $('#leadTitle').textContent = c ? 'Tell us what went wrong' : 'Tell us about your project';
    $('#leadSub').textContent = c ? 'Your complaint goes straight to our complaints team. We reply within 24 hours.' : 'Share a few details. Our team replies within 24 hours.';
    leadModal.classList.add('open'); document.body.classList.add('locked');
    setTimeout(() => { const f = leadForm.elements.name; f && f.focus({ preventScroll: true }); }, 80);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-svc],[data-plan],[data-complaint]');
    if (a && (a.getAttribute('href') === '#contact' || a.hasAttribute('data-complaint'))) {
      e.preventDefault();
      if (a.closest('.sheet')) closeOverlays($('#sheet'));
      openLead({ service: a.dataset.plan || (SVC[a.dataset.svc] || {}).name || '', type: a.hasAttribute('data-complaint') ? 'complaint' : 'inquiry' });
      return;
    }
    const m = e.target.closest('[data-member]');
    if (m) pendingMember = m.dataset.member;
    const sc = e.target.closest('[data-scrollto]');
    if (sc && current === 'contact') { e.preventDefault(); $('#' + sc.dataset.scrollto).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }
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
    let c = raw.toUpperCase().replace(/[\s_()[\]{}]+/g, '').replace(/[–—]/g, '-');
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
    // video showcase only appears when real video files are added (SITE_CONFIG.SHOWREEL) — no empty boxes
    const vids = (p.reel || []).map((r, i) => ({ r, src: (CFG.SHOWREEL || [])[i] })).filter(x => x.src);
    const reel = vids.length ? `<section class="pf-sec glass" data-r><h3 class="label">Video Editing Showcase</h3><p style="margin-bottom:18px">A selection of cinematic edits, colour grades and motion work by MJR.</p><div class="reel">${vids.map((x, i) => `<div class="reel-item" style="--ry:${(i % 3 - 1) * -8}deg"><video src="${esc(x.src)}" muted loop playsinline preload="none" controls></video><span class="cap">${esc(x.r)}</span></div>`).join('')}</div></section>` : '';
    const el = $('#profile');
    el.innerHTML = `<div class="pf-grid">
      <aside class="pf-side glass">${photo(p.key, p.mono, p.name, p.photo)}<div class="pf-id"><span class="verified">${VIS.icon('shield').replace('<svg', '<svg style="width:14px;height:14px"')} Verified member</span><div class="dept-label">${esc(p.dept)}</div><h2>${esc(p.name)}</h2><div class="muted">${esc(p.role)}</div><div class="pf-code">ID ${esc(code.slice(0, 7))}•••${esc(code.slice(-2))}</div><button class="btn btn-ghost btn-sm" type="button" id="pfReset" style="margin-top:10px">Verify another member</button></div></aside>
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
  function projId(raw) {
    let c = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 30);
    if (c.startsWith('MJRPRJ')) c = c.slice(6);
    if (/^\d{5}$/.test(c)) return 'MJR-PRJ-' + c;
    if (/^[A-Z0-9]{8}$/.test(c)) return 'MJR-PRJ-' + c.slice(0, 4) + '-' + c.slice(4);
    return null;
  }
  $('#trkForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = $('#tCode'), msg = $('#tMsg'), f = $('#trkForm');
    if (!guard(tState, msg)) return;
    const code = projId(input.value);
    if (!code) return fail(tState, input, msg, 'Tracking IDs look like MJR-PRJ-7K4P-Q9XD. Please check and try again.');
    msg.className = 'v-msg'; msg.textContent = 'Authenticating & loading your project…'; f.classList.add('vault', 'scanning');
    let rec = null;
    try { [rec] = await Promise.all([api('projects', code), new Promise(r => setTimeout(r, reduced ? 0 : 600))]); }
    catch (err) { f.classList.remove('scanning'); msg.className = 'v-msg err'; msg.textContent = API_ERR[err.message] || API_ERR.offline; return; }
    f.classList.remove('scanning');
    if (!rec) { $('#dash').classList.remove('show'); return fail(tState, input, msg, 'We couldn’t find a project with that ID. Check your booking confirmation or call our helpline.'); }
    tState.fails = 0; msg.className = 'v-msg ok'; msg.textContent = 'Project found.';
    renderDash(rec);
  });
  const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  function renderDash(p) {
    const STAGES = ['Booked', 'In Progress', 'Review', 'Revision', 'Finalization', 'Completed'];
    const si = Math.max(0, STAGES.indexOf(p.status));
    const days = p.expiry ? Math.ceil((new Date(p.expiry + 'T23:59:59') - new Date()) / 864e5) : null;
    const remain = p.status === 'Completed' ? 'Completed' : days == null ? 'Ongoing' : days < 0 ? 'Past due' : days + (days === 1 ? ' day' : ' days');
    const ms = p.milestones || [], log = p.log || [];
    const when = t => new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
          <dl class="kv">${[['Client / booking name', p.client], ['Staff member who booked', p.bookedBy], ['Project number', p.id], ['Service booked', p.service], ['Project start date', fmt(p.start)], ['Project expiry date', fmt(p.expiry)], ['Country', p.country], ['Booking type', p.bookingType], ['Payment status', paid ? 'PAID / PAYMENT CLEAR' : 'PENDING'], ['Current project status', p.status], ['Assigned team member', p.assigned], ['Last update', fmt(p.lastUpdate)]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v || '—')}</dd></div>`).join('')}</dl>
          ${log.length ? `<div class="log glass"><div class="label" style="margin-bottom:16px">Progress log</div><ul class="ms">${log.slice(0, 10).map(l => `<li class="done">${esc(l.status)} · ${+l.progress}%${l.stage ? ' — ' + esc(l.stage) : ''}${l.note ? `<span class="ln-note">${esc(l.note)}</span>` : ''}<small>${when(l.at)}</small></li>`).join('')}</ul></div>` : ''}
        </div>
        <aside class="side-card glass"><div class="label">Remaining time</div><div class="remain gold">${esc(remain)}</div><div class="muted" style="font-size:13px">Until ${fmt(p.expiry)}</div>
          ${ms.length ? `<div class="label" style="margin-top:14px">Milestones</div><ul class="ms">${ms.map(m => `<li class="${m.done ? 'done' : ''}">${esc(m.t)}<small>${m.d ? fmt(m.d) : ''}${m.done ? (m.d ? ' · ' : '') + 'done' : ''}</small></li>`).join('')}</ul>` : ''}
          ${p.notes ? `<div class="label">Important notes</div><div class="notes-box">${esc(p.notes)}</div>` : ''}
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
      ${p.video && /^\/(api\/video|media)\/[\w.-]+$/.test(p.video) ? `<div class="post-vid"><video src="${esc(p.video)}"${p.poster ? ` poster="${esc(p.poster)}"` : ''} controls muted playsinline loop preload="none"${p.w && p.h ? ` width="${+p.w}" height="${+p.h}"` : ''} aria-label="${esc(p.title || 'Video')}"></video></div>` : ''}
      ${Array.isArray(p.quotes) && p.quotes.length ? `<div class="post-quotes">${p.quotes.map(q => `<blockquote><p>${esc(q)}</p><cite>MJR LION AGENCY</cite></blockquote>`).join('')}</div>` : ''}
      ${p.cta ? `<div class="post-cta"><a class="btn btn-gold btn-sm" href="#contact" data-plan="">${esc(p.cta)} <span class="arr">→</span></a></div>` : ''}
      <footer class="post-f"><button type="button" data-share="${esc(p.id)}">${ICO_SHARE}Share</button>${US.me ? `<button type="button" class="del" data-del="${esc(p.id)}">${ICO_DEL}Delete</button>` : ''}</footer>
    </article>`;
  }
  function renderFilters() {
    $('#uFilters').innerHTML = [['all', 'All']].concat(Object.entries(UT)).map(([k, v]) => `<button type="button" role="tab" class="${US.f === k ? 'on' : ''}" aria-selected="${US.f === k}" data-uf="${k}">${esc(v)}</button>`).join('');
  }
  // post videos: play silently while on screen, pause when scrolled away (tap for controls / fullscreen)
  const vidIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting && e.intersectionRatio >= .55) { if (!v.dataset.user && !reduced && !(navigator.connection && navigator.connection.saveData)) { v.preload = 'auto'; v.play().catch(() => { }); } }
    else if (!v.paused) v.pause();
  }), { threshold: [0, .55] }) : null;
  function renderFeed() {
    if (!US.loaded) { feedEl.innerHTML = '<div class="sk"></div><div class="sk"></div>'; return; }
    const list = US.posts.filter(p => US.f === 'all' || p.type === US.f);
    feedEl.innerHTML = list.length ? list.map(postHTML).join('') :
      `<div class="feed-empty glass"><b>${US.posts.length ? 'Nothing in this category yet.' : 'No updates yet.'}</b>New offers, partnerships and announcements will appear here.</div>`;
    $$('.post-vid video', feedEl).forEach(v => {
      v.addEventListener('pause', () => { if (v.dataset.auto !== '1' && document.visibilityState === 'visible' && v.getBoundingClientRect().top < innerHeight && v.getBoundingClientRect().bottom > 0) v.dataset.user = '1'; });
      v.addEventListener('play', () => { delete v.dataset.user; });
      vidIO && vidIO.observe(v);
    });
  }
  function renderComposer() {
    $('#adminBtn').hidden = !US.me; // admin controls are invisible to visitors
    if (!US.me) { compEl.innerHTML = ''; return; }
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
  async function ensureMe() {
    if (!US.checked && US.token) { US.checked = true; const r = await uapi('/api/admin/me'); if (r.data.ok) US.me = r.data.me; else if (r.status === 401) logout(false); }
  }
  const loginHTML = (px, title, sub) => `<div class="label">MJR LION · Admin</div><h3>${title}</h3><p class="muted" style="font-size:14px">${sub}</p>
    <form id="${px}Form" autocomplete="on" style="display:grid;gap:10px"><label class="sr" for="${px}U">Username</label><input class="fi" id="${px}U" autocomplete="username" placeholder="Username" autocapitalize="none" spellcheck="false">
    <label class="sr" for="${px}P">Password</label><input class="fi" id="${px}P" type="password" autocomplete="current-password" placeholder="Password">
    <button class="btn btn-gold" type="submit">Log In</button><div class="v-msg" id="${px}Msg" role="status"></div></form>`;
  function bindLogin(px, done) {
    $('#' + px + 'Form').onsubmit = async e => {
      e.preventDefault();
      const m = $('#' + px + 'Msg'); m.className = 'v-msg'; m.textContent = 'Checking…';
      const r = await uapi('/api/admin/login', 'POST', { username: $('#' + px + 'U').value.trim(), password: $('#' + px + 'P').value });
      if (!r.data.ok) { m.className = 'v-msg err'; m.textContent = errText(r); return; }
      US.token = r.data.token; US.me = r.data.me; US.checked = true; try { localStorage.setItem('mjr-admin', US.token); } catch (err) { }
      renderComposer(); renderFeed(); toast('Welcome, ' + US.me.name);
      if (done) done();
    };
  }
  async function loadUpdates(force) {
    renderFilters();
    await ensureMe();
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
    if (current === 'portal') { closeOverlays(sheet); renderPortal(); }
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
      adminPanel.innerHTML = `${close}<div class="admin-body">${loginHTML('lg', 'Log in to post updates', 'Only the MJR LION owner and admins approved by the owner can post updates and manage projects.')}</div>`;
      bindLogin('lg', () => { renderAdmin(); if (current === 'portal') renderPortal(); });
      return;
    }
    const owner = US.me.role === 'owner';
    adminPanel.innerHTML = `${close}<div class="admin-body"><div class="label">${owner ? 'Owner' : 'Admin'} panel</div><h3>${esc(US.me.name)}</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-gold btn-sm" href="#updates" data-close>Write a Post</a><a class="btn btn-ghost btn-sm" href="#portal" data-close>Project Portal</a><a class="btn btn-ghost btn-sm" href="#portal" data-close data-inbox>Inbox</a><button class="btn btn-ghost btn-sm" type="button" id="lgOut">Log Out</button></div>
      ${owner ? `<hr><div class="label">Admins who can post</div><div class="ad-list" id="adList"><div class="muted" style="font-size:14px">Loading…</div></div>
        <form id="adForm"><div class="cm-row" style="grid-template-columns:1fr 1fr"><label class="sr" for="adN">Name</label><input class="fi" id="adN" placeholder="Member name" maxlength="60"><label class="sr" for="adT">Role</label><input class="fi" id="adT" placeholder="Role, e.g. Marketing Manager" maxlength="60"></div>
        <button class="btn btn-ghost btn-sm" type="submit">Make Admin</button><div id="adMsg"></div></form>
        <hr><div class="label">Website form emails</div>
        <p class="mk-help">Every message from the website is saved in your <b>Inbox</b>. To also get it by email, paste a free access key from <a href="https://web3forms.com" target="_blank" rel="noopener">web3forms.com</a> for each Gmail: <b>New project / Inquiry</b> messages go to the Services email, <b>Complaints</b> go to the Complaints email. Visitors never see these addresses.</p>
        <form id="mkForm"><label class="sr" for="mkS">Services email key</label><input class="fi" id="mkS" placeholder="Services email — access key" maxlength="40" autocomplete="off" spellcheck="false">
        <label class="sr" for="mkC">Complaints email key</label><input class="fi" id="mkC" placeholder="Complaints email — access key" maxlength="40" autocomplete="off" spellcheck="false">
        <button class="btn btn-ghost btn-sm" type="submit">Save Email Keys</button><div class="v-msg" id="mkMsg" role="status"></div></form>` : ''}
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
    uapi('/api/admin/settings').then(r => { if (r.data.ok && $('#mkS')) { $('#mkS').value = r.data.settings.w3f_services || ''; $('#mkC').value = r.data.settings.w3f_complaints || ''; } });
    $('#mkForm').onsubmit = async e => {
      e.preventDefault();
      const m = $('#mkMsg'); m.className = 'v-msg'; m.textContent = 'Saving…';
      const r = await uapi('/api/admin/settings', 'POST', { w3f_services: $('#mkS').value.trim(), w3f_complaints: $('#mkC').value.trim() });
      if (r.status === 401) return logout(true);
      m.className = 'v-msg ' + (r.data.ok ? 'ok' : 'err');
      m.textContent = r.data.ok ? 'Saved. New website messages will now also arrive by email.' : (r.data.error === 'key_format' ? 'That doesn’t look like an access key (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).' : errText(r));
      if (r.data.ok) formCfg = null;
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

  /* ------------------------------------------------------------ PROJECT PORTAL (owner / admins) */
  const portalEl = $('#portal');
  const PJ = { list: [], q: '', tab: 'projects', inbox: [], ibf: 'all' };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href="#portal"]'); if (!a) return;
    PJ.tab = a.hasAttribute('data-inbox') ? 'inbox' : 'projects';
    if (current === 'portal') setTimeout(renderPortal, 0);
  }, true);
  const STAGE_LIST = ['Booked', 'In Progress', 'Review', 'Revision', 'Finalization', 'Completed'];
  const SVC_NAMES = SERVICES.map(s => s.name).concat(['All-in-One Standard Brand Program', 'All-in-One Premium Brand Program']);
  const TEAM_NAMES = ['MJR (Mr. Jibran)', 'Ms. Sana Salahuddin', 'Ms. Roma', 'Mr. Wasi Mughal', 'Mr. Wahab Haider', 'Mr. Husnain Abbasi', 'Mr. Jamshaid Abbasi'];
  const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const opt = (list, v) => list.map(x => `<option${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('');
  async function renderPortal() {
    await ensureMe();
    if (!US.me) {
      portalEl.innerHTML = `<div class="vault glass" style="max-width:540px">${loginHTML('pl', 'Log in to manage projects', 'Only the MJR LION owner and approved admins can open the project portal.')}</div>`;
      bindLogin('pl', () => renderPortal());
      return;
    }
    if (PJ.tab === 'inbox') return renderInbox();
    portalEl.innerHTML = `${tabsHTML()}
      <div class="pj-bar glass"><div><div class="label">${US.me.role === 'owner' ? 'Owner' : 'Admin'}</div><b>${esc(US.me.name)}</b></div>
        <label class="sr" for="pjQ">Search projects</label><input class="fi" id="pjQ" placeholder="Search by client, tracking ID or service…" value="${esc(PJ.q)}">
        <button class="btn btn-gold btn-sm" type="button" id="pjNew">+ New Project</button><button class="btn btn-ghost btn-sm" type="button" data-admin-open>Admin Panel</button></div>
      <div class="pj-stats" id="pjStats"></div>
      <div class="pj-list" id="pjList"><div class="sk"></div><div class="sk"></div></div>`;
    $('#pjNew').onclick = () => openProject(null);
    $('#pjQ').oninput = e => { PJ.q = e.target.value; renderProjects(); };
    const r = await uapi('/api/admin/projects');
    if (r.status === 401) return logout(true);
    if (!r.data.ok) { $('#pjList').innerHTML = `<div class="feed-empty glass"><b>Projects couldn’t load.</b>${esc(errText(r))}</div>`; return; }
    PJ.list = r.data.projects || [];
    renderProjects();
    refreshUnread();
  }
  /* ---------- inbox: every website form message (inquiries + complaints) */
  const unreadN = () => PJ.inbox.filter(m => !m.read).length;
  function tabsHTML() {
    const n = unreadN();
    return `<div class="pj-tabs" role="tablist"><button type="button" role="tab" aria-selected="${PJ.tab === 'projects'}" data-tab="projects">Projects</button><button type="button" role="tab" aria-selected="${PJ.tab === 'inbox'}" data-tab="inbox">Inbox${n ? `<span class="cnt">${n}</span>` : ''}</button></div>`;
  }
  async function refreshUnread() {
    const r = await uapi('/api/admin/inbox'); if (!r.data.ok) return;
    PJ.inbox = r.data.messages || [];
    const t = $('.pj-tabs', portalEl); if (t) t.outerHTML = tabsHTML();
  }
  portalEl.addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t && t.dataset.tab !== PJ.tab) { PJ.tab = t.dataset.tab; renderPortal(); } });
  async function renderInbox() {
    portalEl.innerHTML = `${tabsHTML()}<div class="pj-bar glass"><div><div class="label">Website messages</div><b>Inquiries &amp; complaints</b></div>
      <label class="sr" for="ibQ">Search messages</label><input class="fi" id="ibQ" placeholder="Search by name, email, service or reference…" value="${esc(PJ.q)}"></div>
      <div class="ib-filter" id="ibF"></div><div id="ibList"><div class="sk"></div><div class="sk"></div></div>`;
    $('#ibQ').oninput = e => { PJ.q = e.target.value; drawInbox(); };
    const r = await uapi('/api/admin/inbox');
    if (r.status === 401) return logout(true);
    if (!r.data.ok) { $('#ibList').innerHTML = `<div class="feed-empty glass"><b>Inbox couldn’t load.</b>${esc(errText(r))}</div>`; return; }
    PJ.inbox = r.data.messages || [];
    $('.pj-tabs', portalEl).outerHTML = tabsHTML();
    drawInbox();
  }
  function drawInbox() {
    const L = PJ.inbox, q = PJ.q.trim().toLowerCase(), f = PJ.ibf, el = $('#ibList'); if (!el) return;
    const cnt = t => L.filter(m => t === 'all' || (t === 'unread' ? !m.read : m.type === t)).length;
    $('#ibF').innerHTML = [['all', 'All'], ['unread', 'Unread'], ['inquiry', 'Inquiries'], ['complaint', 'Complaints']].map(([k, l]) => `<button type="button" aria-pressed="${f === k}" data-ibf="${k}">${l} (${cnt(k)})</button>`).join('');
    const rows = L.filter(m => (f === 'all' || (f === 'unread' ? !m.read : m.type === f)) && (!q || [m.ref, m.name, m.email, m.service, m.preview].join(' ').toLowerCase().includes(q)));
    el.innerHTML = rows.length ? rows.map(m => `<div class="ib${m.read ? '' : ' unread'}" data-ib="${esc(m.id)}">
        <button class="ib-h" type="button" aria-expanded="false"><span class="dot" aria-label="${m.read ? 'Read' : 'Unread'}"></span>
          <div><b>${esc(m.name)} <span class="badge ${m.type === 'complaint' ? 'cmp' : 'stat'}" style="margin-left:6px;padding:.45em .75em;font-size:9px">${m.type === 'complaint' ? 'Complaint' : 'Inquiry'}</span></b><small>${m.service ? esc(m.service) + ' · ' : ''}${esc(m.preview)}</small></div>
          <time datetime="${new Date(m.at).toISOString()}">${ago(m.at)}</time></button>
        <div class="ib-body"></div></div>`).join('')
      : `<div class="feed-empty glass"><b>${L.length ? 'No messages match.' : 'No messages yet.'}</b>${L.length ? '' : 'When someone sends the project or complaint form on the website, it appears here.'}</div>`;
  }
  portalEl.addEventListener('click', async e => {
    const fb = e.target.closest('[data-ibf]'); if (fb) { PJ.ibf = fb.dataset.ibf; drawInbox(); return; }
    const del = e.target.closest('[data-ibdel]');
    if (del) {
      if (!del.classList.contains('arm')) { del.classList.add('arm'); del.textContent = 'Confirm delete'; return; }
      const r = await uapi('/api/admin/inbox/' + encodeURIComponent(del.dataset.ibdel), 'DELETE');
      if (r.data.ok) { PJ.inbox = PJ.inbox.filter(x => x.id !== del.dataset.ibdel); toast('Message deleted'); drawInbox(); $('.pj-tabs', portalEl).outerHTML = tabsHTML(); } else toast(errText(r));
      return;
    }
    const h = e.target.closest('.ib-h'); if (!h) return;
    const card = h.parentElement, id = card.dataset.ib, body = $('.ib-body', card);
    const open = !card.classList.contains('open');
    card.classList.toggle('open', open); h.setAttribute('aria-expanded', open);
    if (!open || body.dataset.loaded) return;
    body.innerHTML = '<div class="sk"></div>';
    const r = await uapi('/api/admin/inbox/' + encodeURIComponent(id));
    if (!r.data.ok) { body.innerHTML = `<div class="cm-msg err">${esc(errText(r))}</div>`; return; }
    const m = r.data.message; body.dataset.loaded = '1';
    const subj = encodeURIComponent((m.type === 'complaint' ? 'Re: your complaint ' : 'Re: your inquiry ') + m.ref + ' — MJR LION AGENCY');
    body.innerHTML = `<div class="ib-meta">${[['Reference', m.ref], ['Email', `<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>`, 1], ['Phone', m.phone ? `<a href="tel:${esc(m.phone.replace(/[^\d+]/g, ''))}">${esc(m.phone)}</a>` : '—', 1], ['Company', m.company || '—'], [m.type === 'complaint' ? 'Related service' : 'Service', m.service || '—'], m.project ? ['Project ID', m.project] : null, ['Received', new Date(m.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })], m.country ? ['Country', m.country] : null]
        .filter(Boolean).map(([k, v, raw]) => `<div><span>${k}</span>${raw ? v : esc(v)}</div>`).join('')}</div>
      <div class="ib-msg">${esc(m.message)}</div>
      <div class="ib-act"><a class="btn btn-gold btn-sm" href="mailto:${esc(m.email)}?subject=${subj}">Reply by Email <span class="arr">→</span></a>${m.phone ? `<a class="btn btn-ghost btn-sm" href="https://wa.me/${esc(m.phone.replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}<button class="btn btn-ghost btn-sm" type="button" data-ibdel="${esc(m.id)}">Delete</button></div>`;
    if (!m.read) {
      uapi('/api/admin/inbox/' + encodeURIComponent(id), 'PUT', { read: true });
      const s = PJ.inbox.find(x => x.id === id); if (s) s.read = true;
      card.classList.remove('unread'); $('.pj-tabs', portalEl).outerHTML = tabsHTML();
      const ff = $('#ibF'); if (ff) $$('[data-ibf]', ff).forEach(x => { const k = x.dataset.ibf, n = PJ.inbox.filter(m => k === 'all' || (k === 'unread' ? !m.read : m.type === k)).length; x.textContent = x.textContent.replace(/\(\d+\)/, `(${n})`); });
    }
  });
  function renderProjects() {
    const L = PJ.list, q = PJ.q.trim().toLowerCase();
    const stats = $('#pjStats'), listEl = $('#pjList');
    if (!listEl) return;
    stats.innerHTML = [[L.length, 'Total projects'], [L.filter(p => p.status !== 'Completed').length, 'Active'], [L.filter(p => p.status === 'Completed').length, 'Completed'], [L.filter(p => p.payment !== 'PAID').length, 'Payment pending']]
      .map(([n, k]) => `<div class="pj-stat"><b class="gold">${n}</b><span>${k}</span></div>`).join('');
    const rows = L.filter(p => !q || [p.id, p.client, p.service, p.country, p.status].join(' ').toLowerCase().includes(q));
    listEl.innerHTML = rows.length ? rows.map(p => `<div class="pj">
        <div><div class="pj-id">${esc(p.id)}</div><b>${esc(p.client)}</b><small>${esc(p.service || '—')}${p.country ? ' · ' + esc(p.country) : ''}</small></div>
        <div class="badges"><span class="badge stat"><i></i>${esc(p.status)}</span><span class="badge ${p.payment === 'PAID' ? 'paid' : 'pending'}"><i></i>${p.payment === 'PAID' ? 'Paid' : 'Pending'}</span></div>
        <div class="pj-prog"><div class="bar sm"><i style="width:${+p.progress}%"></i></div><small>${+p.progress}% · updated ${fmt(p.lastUpdate)}</small></div>
        <button class="btn btn-ghost btn-sm" type="button" data-pj="${esc(p.id)}">Update</button></div>`).join('')
      : `<div class="feed-empty glass"><b>${L.length ? 'No projects match your search.' : 'No projects yet.'}</b>${L.length ? '' : 'Click “New Project” to book your first client project and get a tracking ID.'}</div>`;
  }
  portalEl.addEventListener('click', e => { const b = e.target.closest('[data-pj]'); if (b) openProject(b.dataset.pj); });
  function msRow(m) {
    return `<div class="ms-row"><input class="fi" type="text" placeholder="Milestone, e.g. Design approved" value="${esc(m.t || '')}" maxlength="120"><input class="fi" type="date" value="${esc(m.d || '')}"><label><input type="checkbox"${m.done ? ' checked' : ''}> Done</label><button class="x" type="button" aria-label="Remove milestone">×</button></div>`;
  }
  async function openProject(id) {
    lastFocus = document.activeElement;
    let p = { client: '', bookedBy: US.me.name, service: '', start: todayISO(), expiry: '', country: '', bookingType: 'Project-wise', payment: 'PENDING', status: 'Booked', progress: 0, assigned: '', stage: '', notes: '', milestones: [] };
    if (id) {
      const r = await uapi('/api/admin/projects/' + encodeURIComponent(id));
      if (r.status === 401) return logout(true);
      if (!r.data.ok) { toast(errText(r)); return; }
      p = r.data.project;
    }
    const F = (lbl, html, full) => `<div class="fld${full ? ' full' : ''}"><label>${lbl}</label>${html}</div>`;
    sheetPanel.innerHTML = `<button class="sheet-close" type="button" data-close aria-label="Close"></button>
      <div class="admin-body" style="max-width:980px;margin:0 auto">
        <div class="label">${id ? 'Update project · ' + esc(p.id) : 'New project'}</div>
        <h3 style="font-size:clamp(1.6rem,3vw,2.3rem)">${id ? esc(p.client) : 'Book a client project'}</h3>
        <form class="pj-form" id="pjForm" novalidate>
          ${F('Client / booking name', `<input name="client" value="${esc(p.client)}" maxlength="120" required>`)}
          ${F('Staff member who booked', `<input name="bookedBy" value="${esc(p.bookedBy)}" maxlength="80" list="pjTeam">`)}
          ${F('Service booked', `<select name="service"><option value="">Select a service…</option>${opt(SVC_NAMES, p.service)}</select>`)}
          ${F('Assigned team member', `<input name="assigned" value="${esc(p.assigned)}" maxlength="80" list="pjTeam">`)}
          ${F('Project start date', `<input type="date" name="start" value="${esc(p.start)}">`)}
          ${F('Project expiry date', `<input type="date" name="expiry" value="${esc(p.expiry)}">`)}
          ${F('Country', `<input name="country" value="${esc(p.country)}" maxlength="60" placeholder="e.g. United Kingdom">`)}
          ${F('Booking type', `<select name="bookingType">${opt(['Project-wise', 'Contract-based'], p.bookingType)}</select>`)}
          ${F('Payment status', `<select name="payment"><option value="PENDING"${p.payment !== 'PAID' ? ' selected' : ''}>PENDING</option><option value="PAID"${p.payment === 'PAID' ? ' selected' : ''}>PAID / PAYMENT CLEAR</option></select>`)}
          ${F('Current project status', `<select name="status">${opt(STAGE_LIST, p.status)}</select>`)}
          ${F(`Total progress: <b id="pjPct" style="color:var(--gold2)">${+p.progress}%</b>`, `<input type="range" name="progress" min="0" max="100" step="5" value="${+p.progress}">`, true)}
          ${F('Current stage (what the team is doing now)', `<input name="stage" value="${esc(p.stage)}" maxlength="120" placeholder="e.g. Development & QA">`, true)}
          ${F('Important notes for the client', `<textarea name="notes" maxlength="2000" placeholder="Anything the client should know…">${esc(p.notes)}</textarea>`, true)}
          <h4 class="label">Milestones</h4>
          <div class="full ms-edit" id="msEdit">${(p.milestones || []).map(msRow).join('')}</div>
          <div class="full pj-actions"><button class="btn btn-ghost btn-sm" type="button" id="msAdd">+ Add Milestone</button><button class="btn btn-ghost btn-sm" type="button" id="msFill">Use Service Steps</button></div>
          ${F('Update message for the client (optional — appears in their progress log)', `<textarea name="logNote" maxlength="300" style="min-height:80px" placeholder="e.g. Homepage design approved, development has started."></textarea>`, true)}
          <div class="full pj-actions" style="justify-content:space-between;margin-top:6px">
            <div class="pj-actions"><button class="btn btn-gold" type="submit" id="pjSave">${id ? 'Save Changes' : 'Create Project'} <span class="arr">→</span></button><span class="cm-msg" id="pjMsg"></span></div>
            ${id && US.me.role === 'owner' ? '<button class="btn btn-ghost btn-sm" type="button" id="pjDel" style="color:#e38a6c;border-color:rgba(227,138,108,.45)">Delete Project</button>' : ''}
          </div>
        </form>
        <datalist id="pjTeam">${TEAM_NAMES.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
        <div id="pjDone"></div>
      </div>`;
    const form = $('#pjForm'), msEdit = $('#msEdit');
    form.elements.progress.oninput = e => { $('#pjPct').textContent = e.target.value + '%'; };
    form.elements.status.onchange = e => { if (e.target.value === 'Completed') { form.elements.progress.value = 100; $('#pjPct').textContent = '100%'; } };
    $('#msAdd').onclick = () => { msEdit.insertAdjacentHTML('beforeend', msRow({})); $('.ms-row:last-child input', msEdit).focus(); };
    $('#msFill').onclick = () => {
      const s = SERVICES.find(x => x.name === form.elements.service.value);
      if (!s) { toast('Select a service first'); return; }
      msEdit.innerHTML = s.process.map(t => msRow({ t })).join('');
    };
    msEdit.onclick = e => { const x = e.target.closest('.x'); if (x) x.parentElement.remove(); };
    if (id && $('#pjDel')) $('#pjDel').onclick = async e => {
      const b = e.currentTarget;
      if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = 'Click again to delete'; return; }
      const r = await uapi('/api/admin/projects/' + encodeURIComponent(id), 'DELETE');
      if (!r.data.ok) { toast(errText(r)); return; }
      PJ.list = PJ.list.filter(x => x.id !== id); renderProjects(); closeOverlays(sheet); toast('Project deleted');
    };
    form.onsubmit = async e => {
      e.preventDefault();
      const fe = form.elements, msg = $('#pjMsg');
      const body = { client: fe.client.value, bookedBy: fe.bookedBy.value, service: fe.service.value, assigned: fe.assigned.value, start: fe.start.value, expiry: fe.expiry.value, country: fe.country.value, bookingType: fe.bookingType.value, payment: fe.payment.value, status: fe.status.value, progress: +fe.progress.value, stage: fe.stage.value, notes: fe.notes.value, logNote: fe.logNote.value,
        milestones: $$('.ms-row', msEdit).map(r => ({ t: r.querySelector('input[type=text]').value, d: r.querySelector('input[type=date]').value, done: r.querySelector('input[type=checkbox]').checked })) };
      if (body.client.trim().length < 2) { msg.className = 'cm-msg err'; msg.textContent = 'Please enter the client / booking name.'; fe.client.focus(); return; }
      $('#pjSave').disabled = true; msg.className = 'cm-msg'; msg.textContent = 'Saving…';
      const r = await uapi(id ? '/api/admin/projects/' + encodeURIComponent(id) : '/api/admin/projects', id ? 'PUT' : 'POST', body);
      $('#pjSave').disabled = false;
      if (r.status === 401) return logout(true);
      if (!r.data.ok) { msg.className = 'cm-msg err'; msg.textContent = r.data.error === 'client' ? 'Please enter the client / booking name.' : errText(r); return; }
      const saved = r.data.project;
      PJ.list = [{ id: saved.id, client: saved.client, service: saved.service, status: saved.status, progress: saved.progress, payment: saved.payment, country: saved.country, expiry: saved.expiry, lastUpdate: saved.lastUpdate }].concat(PJ.list.filter(x => x.id !== saved.id));
      renderProjects();
      if (id) { closeOverlays(sheet); toast('Project updated — the client sees it now'); return; }
      const link = location.origin + location.pathname + '#track';
      const note = `Hello ${saved.client},\nThank you for choosing MJR LION AGENCY. Your project${saved.service ? ' (' + saved.service + ')' : ''} is booked.\n\nTracking ID: ${saved.id}\nTrack your project anytime: ${link}\n\nMJR LION AGENCY — Your Success Our Pride`;
      form.remove();
      $('#pjDone').innerHTML = `<div class="pj-done"><div class="label" style="color:var(--ok)">Project created</div><div>Share this tracking ID with <b>${esc(saved.client)}</b>:</div><div class="big">${esc(saved.id)}</div>
        <div class="pj-actions"><button class="btn btn-gold btn-sm" type="button" id="cpMsg">Copy Message for Client</button><a class="btn btn-ghost btn-sm" href="https://wa.me/?text=${encodeURIComponent(note)}" target="_blank" rel="noopener">Send on WhatsApp</a><button class="btn btn-ghost btn-sm" type="button" id="cpId">Copy ID</button><button class="btn btn-ghost btn-sm" type="button" data-close>Done</button></div></div>`;
      const copy = t => (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copied'), () => toast('Select the text to copy it'));
      $('#cpMsg').onclick = () => copy(note); $('#cpId').onclick = () => copy(saved.id);
    };
    sheetPanel.scrollTop = 0;
    sheet.classList.add('open'); document.body.classList.add('locked');
    setTimeout(() => { const f = id ? $('.sheet-close', sheetPanel) : form.elements.client; f && f.focus({ preventScroll: true }); }, 60);
  }

  /* ------------------------------------------------------------ menu */
  // mobile / tablet 3-line menu
  function setMenu(open) {
    const b = $('#burger');
    if (!b) return;
    document.body.classList.toggle('menu-open', open);
    b.setAttribute('aria-expanded', open); b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) document.body.classList.add('locked'); else if (!$('.sheet.open,.modal.open')) document.body.classList.remove('locked');
  }
  $('#burger').addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#mnav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('resize', () => { if (window.innerWidth > 959 && document.body.classList.contains('menu-open')) setMenu(false); });
  // keep the active page visible in the one-line menu on small screens
  function revealActiveNav() {
    const nav = $('.nav'), a = $('.nav a.on:not(.btn)');
    if (!nav || !a || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ------------------------------------------------------------ router */
  function route(name, first) {
    if (!PAGES[name]) name = 'home';
    if (name === current) { if (!pendingScroll) scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); afterRoute(); return; }
    const prev = current ? $('#page-' + current) : null, next = $('#page-' + name);
    current = name;
    $$('[data-nav]').forEach(a => { const on = a.dataset.nav === name; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    document.title = PAGES[name].title;
    revealActiveNav();
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
      show();   // instant swap — the new page fades in, nothing waits for the old one
    } else show();
  }
  function afterRoute() {
    if (current === 'updates') loadUpdates();
    if (current === 'portal') renderPortal();
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
    if (gl3d) gl3d.scroll(y, Math.max(current === 'home' ? .3 : .45, 1 - y / (innerHeight * 1.5)));
  }
  let scrollQueued = false;
  addEventListener('scroll', () => { if (scrollQueued) return; scrollQueued = true; requestAnimationFrame(() => { scrollQueued = false; onScroll(); }); }, { passive: true });
  addEventListener('resize', () => { if (gl3d && current) gl3d.place(placement(current)); });

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
    setTimeout(() => intro.remove(), 650);
  }
  $('#skipIntro').addEventListener('click', endIntro);
  if (reduced) { endIntro(); }
  else {
    if (gl3d) gl3d.go('galaxy', { x: 0, y: 0, s: isMobile() ? .55 : .95, o: .85, tilt: 0, spin: .35 }, { duration: 1.4, scatter: .4 });
    requestAnimationFrame(() => setTimeout(() => $('#intro').classList.add('play'), 60));
    setTimeout(endIntro, 1500);
    addEventListener('keydown', function k(e) { if (e.key === 'Enter' || e.key === ' ') { endIntro(); removeEventListener('keydown', k); } });
  }
  // build every 3D sculpture in the background worker so page switches never stutter
  if (gl3d) gl3d.prewarm(['lion', 'geodesic', 'bars', 'vault', 'knot', 'helix', 'globe']);
  enhance($('#ftr'));
  onScroll();
  window.__mjrReady = true;
})();
