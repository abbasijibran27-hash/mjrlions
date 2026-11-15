/* =========================================================================
   MJR LION AGENCY — art-directed vector visuals (replaceable image slots)
   ========================================================================= */
(function () {
  const G = '#d6b26e', G2 = '#f1d9a0', GL = 'rgba(214,178,110,.35)', GD = 'rgba(214,178,110,.18)', B = 'rgba(110,135,255,.6)', BF = 'rgba(53,87,232,.22)', W1 = 'rgba(255,255,255,.16)', W2 = 'rgba(255,255,255,.09)';
  const svg = inner => `<svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  const bars = (x, y, w, hs, gap, fill) => hs.map((h, i) => `<rect x="${x + i * (w + gap)}" y="${y - h}" width="${w}" height="${h}" rx="2" fill="${typeof fill === 'function' ? fill(i) : fill}"/>`).join('');
  const lines = (x, y, ws, step, c) => ws.map((w, i) => `<rect x="${x}" y="${y + i * step}" width="${w}" height="4" rx="2" fill="${c || W1}"/>`).join('');

  const ART = {
    web: svg(`
      <rect x="18" y="16" width="226" height="152" rx="10" fill="url(#g-panel)" stroke="url(#g-gold)" stroke-width="1.2"/>
      <path d="M18 36h226" stroke="${GL}"/><circle cx="31" cy="26" r="3" fill="${G}"/><circle cx="42" cy="26" r="3" fill="${GL}"/><circle cx="53" cy="26" r="3" fill="${GD}"/>
      <rect x="78" y="21" width="110" height="10" rx="5" fill="${W2}"/>
      <rect x="34" y="52" width="122" height="13" rx="3" fill="url(#g-gold)"/><rect x="34" y="71" width="88" height="13" rx="3" fill="rgba(241,217,160,.45)"/>
      ${lines(34, 94, [140, 112, 126], 9)}
      <rect x="34" y="130" width="58" height="20" rx="10" fill="url(#g-gold)"/><rect x="98" y="130" width="58" height="20" rx="10" stroke="${GL}"/>
      <circle cx="206" cy="84" r="26" stroke="${GL}"/><circle cx="206" cy="84" r="15" fill="${BF}" stroke="${B}"/>
      <rect x="182" y="102" width="122" height="84" rx="10" fill="#0b0b10" stroke="${B}"/>
      <path d="M194 118l-6 6 6 6M214 118l6 6-6 6" stroke="${G2}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${lines(226, 121, [52, 34], 8, 'rgba(120,140,255,.55)')}${lines(194, 140, [70, 92, 54, 80], 9, W1)}`),
    social: svg(`
      <rect x="104" y="10" width="112" height="182" rx="18" fill="url(#g-panel)" stroke="url(#g-gold)" stroke-width="1.2"/>
      <rect x="140" y="17" width="40" height="5" rx="2.5" fill="${W2}"/>
      <circle cx="126" cy="40" r="9" fill="url(#g-gold)"/>${lines(140, 34, [44, 30], 8)}
      ${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${114 + c * 32}" y="${58 + r * 32}" width="28" height="28" rx="4" fill="${(r + c) % 3 === 0 ? 'rgba(214,178,110,.42)' : (r + c) % 3 === 1 ? BF : 'rgba(255,255,255,.07)'}"/>`).join('')).join('')}
      <rect x="114" y="160" width="92" height="20" rx="10" fill="url(#g-gold)"/>
      <rect x="18" y="40" width="74" height="54" rx="12" fill="#0d0d11" stroke="${GL}"/><path d="M34 76c10-18 22 4 34-14 6-8 10-4 14-10" stroke="${G2}" stroke-width="1.6" stroke-linecap="round"/>
      ${lines(30, 50, [30], 0, W1)}
      <rect x="228" y="100" width="78" height="60" rx="12" fill="#0d0d11" stroke="${B}"/>
      <path d="M256 122c-4-7-14-4-12 4 2 7 12 12 12 12s10-5 12-12c2-8-8-11-12-4z" fill="${G}"/>${lines(240, 146, [54], 0, W1)}`),
    perf: svg(`
      <rect x="14" y="16" width="292" height="168" rx="12" fill="url(#g-panel)" stroke="url(#g-gold)" stroke-width="1.2"/>
      ${lines(30, 30, [70], 0, W1)}<rect x="30" y="42" width="54" height="14" rx="3" fill="url(#g-gold)"/>
      ${[0, 1, 2].map(i => `<rect x="${110 + i * 64}" y="28" width="56" height="30" rx="7" fill="rgba(255,255,255,.04)" stroke="${GD}"/><rect x="${118 + i * 64}" y="36" width="22" height="4" rx="2" fill="${W1}"/><rect x="${118 + i * 64}" y="45" width="34" height="6" rx="3" fill="${i === 1 ? B : 'rgba(241,217,160,.7)'}"/>`).join('')}
      ${bars(32, 166, 14, [22, 30, 26, 42, 38, 56, 50, 70, 64, 88], 7, i => i % 2 ? 'url(#g-gold)' : 'rgba(214,178,110,.35)')}
      <path d="M36 140 C 80 136, 110 120, 140 112 S 190 92, 236 76" stroke="${G2}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="236" cy="76" r="5" fill="${G2}"/><circle cx="236" cy="76" r="11" stroke="${GL}"/>
      <path d="M252 84h40l-8 22h-24z M262 112h20l-5 14h-10z M268 132h8l-2 10h-4z" fill="${BF}" stroke="${B}"/>`),
    design: svg(`
      <rect x="16" y="14" width="200" height="172" rx="10" fill="url(#g-panel)" stroke="url(#g-gold)" stroke-width="1.2"/>
      <circle cx="78" cy="78" r="38" stroke="${G2}" stroke-width="1.4"/><path d="M78 46 98 92H58z" fill="url(#g-gold)"/><circle cx="78" cy="78" r="50" stroke="${GD}" stroke-dasharray="3 5"/>
      <text x="138" y="96" fill="${G2}" font-family="Sora,Poppins,sans-serif" font-size="46" font-weight="700">Aa</text>
      ${lines(138, 108, [58, 42], 9)}
      ${['#f1d9a0', '#d6b26e', '#8f6c30', '#3557e8', '#f4f1ea'].map((c, i) => `<rect x="${32 + i * 34}" y="146" width="28" height="24" rx="5" fill="${c}" opacity="${i === 4 ? .85 : 1}"/>`).join('')}
      <rect x="230" y="30" width="76" height="98" rx="10" fill="#0d0d11" stroke="${B}"/>
      <path d="M244 50h48M244 62h30" stroke="${W1}" stroke-width="4" stroke-linecap="round"/><rect x="244" y="76" width="48" height="38" rx="5" fill="${BF}"/>
      <path d="M252 152l22-22 10 10-22 22h-10z" fill="url(#g-gold)"/><path d="M286 134l6-6 10 10-6 6z" stroke="${G}"/>`),
    video: svg(`
      <rect x="16" y="12" width="288" height="110" rx="10" fill="url(#g-panel)" stroke="url(#g-gold)" stroke-width="1.2"/>
      <rect x="28" y="22" width="170" height="90" rx="6" fill="#0a0a0d"/><path d="M28 92 C 70 60, 110 96, 150 64 S 190 56, 198 52 V112 H28z" fill="rgba(214,178,110,.22)"/>
      <circle cx="160" cy="44" r="10" fill="rgba(241,217,160,.8)"/><path d="M104 58l18 10-18 10z" fill="${G2}"/>
      <rect x="210" y="22" width="84" height="90" rx="6" fill="#0d0d11" stroke="${GD}"/>
      ${[0, 1, 2].map(i => `<circle cx="${232 + i * 22}" cy="48" r="9" stroke="${['#e2725b', '#7fd3a0', '#6e87ff'][i]}" stroke-width="2"/>`).join('')}
      ${lines(222, 72, [60, 44, 52], 10)}
      <rect x="16" y="132" width="288" height="56" rx="10" fill="#0b0b0e" stroke="${GD}"/>
      <rect x="30" y="140" width="96" height="12" rx="3" fill="url(#g-gold)"/><rect x="130" y="140" width="60" height="12" rx="3" fill="rgba(214,178,110,.45)"/><rect x="194" y="140" width="96" height="12" rx="3" fill="url(#g-gold)"/>
      <rect x="30" y="156" width="140" height="12" rx="3" fill="${BF}" stroke="${B}"/><rect x="176" y="156" width="70" height="12" rx="3" fill="${BF}" stroke="${B}"/>
      <path d="M30 176h260" stroke="${W2}" stroke-dasharray="2 4"/><path d="M150 134v52" stroke="${G2}" stroke-width="1.5"/><path d="M145 132h10l-5 6z" fill="${G2}"/>`),
    aivideo: svg(`
      <rect x="20" y="14" width="180" height="172" rx="12" fill="url(#g-panel)" stroke="url(#g-gold)" stroke-width="1.2"/>
      <circle cx="110" cy="74" r="28" stroke="${G2}" stroke-width="1.3"/>
      <path d="M62 160c4-30 24-46 48-46s44 16 48 46" stroke="${G2}" stroke-width="1.3"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${82 + i * 7} ${74 - 18 + (i % 3) * 6}v${16 - (i % 3) * 4}" stroke="rgba(214,178,110,.4)"/>`).join('')}
      <circle cx="100" cy="72" r="2.5" fill="${G2}"/><circle cx="120" cy="72" r="2.5" fill="${G2}"/>
      <path d="M30 28h28M30 28v20M190 28h-28M190 28v20M30 172h28M30 172v-20M190 172h-28M190 172v-20" stroke="${G}" stroke-width="1.6"/>
      <rect x="212" y="32" width="94" height="58" rx="10" fill="#0d0d11" stroke="${B}"/>
      ${Array.from({ length: 14 }, (_, i) => { const h = [8, 16, 26, 12, 30, 20, 34, 18, 28, 10, 22, 14, 24, 8][i]; return `<rect x="${222 + i * 6}" y="${61 - h / 2}" width="3" height="${h}" rx="1.5" fill="${i % 4 === 0 ? G2 : B}"/>`; }).join('')}
      <rect x="212" y="104" width="94" height="72" rx="10" fill="#0d0d11" stroke="${GD}"/>
      ${[0, 1, 2, 3].map(i => `<rect x="${222 + (i % 2) * 40}" y="${114 + Math.floor(i / 2) * 28}" width="34" height="22" rx="4" fill="${i === 0 ? 'rgba(214,178,110,.45)' : 'rgba(255,255,255,.07)'}"/>`).join('')}
      <path d="M262 18l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="${G2}"/>`),
    ugc: svg(`
      <rect x="40" y="8" width="104" height="184" rx="18" fill="url(#g-panel)" stroke="url(#g-gold)" stroke-width="1.2"/>
      <circle cx="58" cy="26" r="4" fill="#e2725b"/><text x="66" y="29" fill="#e9e3d7" font-family="Montserrat,Poppins,sans-serif" font-size="8" font-weight="700" letter-spacing="1.5">REC</text>
      <circle cx="92" cy="78" r="20" stroke="${G2}" stroke-width="1.3"/><path d="M58 150c3-26 16-40 34-40s31 14 34 40" stroke="${G2}" stroke-width="1.3"/>
      <rect x="100" y="112" width="26" height="40" rx="5" fill="url(#g-gold)"/><rect x="104" y="120" width="18" height="6" rx="2" fill="rgba(0,0,0,.35)"/>
      <path d="M50 164h84" stroke="${W2}"/><rect x="50" y="170" width="54" height="6" rx="3" fill="${G}"/>
      ${[0, 1, 2].map(i => `<rect x="${170 + i * 8}" y="${24 + i * 46}" width="${130 - i * 16}" height="38" rx="9" fill="#0d0d11" stroke="${i === 1 ? B : GD}"/><circle cx="${188 + i * 8}" cy="${43 + i * 46}" r="8" fill="${i === 1 ? BF : 'rgba(214,178,110,.4)'}"/><rect x="${202 + i * 8}" y="${36 + i * 46}" width="${64 - i * 10}" height="4" rx="2" fill="${W1}"/><rect x="${202 + i * 8}" y="${46 + i * 46}" width="${40 - i * 6}" height="4" rx="2" fill="${W2}"/>`).join('')}`),
    write: svg(`
      <rect x="40" y="10" width="170" height="180" rx="10" fill="url(#g-panel)" stroke="url(#g-gold)" stroke-width="1.2"/>
      <text x="58" y="50" fill="${G2}" font-family="Sora,Poppins,sans-serif" font-size="22" font-weight="700">Headline</text>
      ${lines(58, 62, [132, 120, 128, 96], 10)}
      <rect x="58" y="108" width="60" height="44" rx="5" fill="rgba(214,178,110,.25)"/>${lines(126, 110, [64, 52, 60, 44], 10, W2)}
      ${lines(58, 162, [128, 100], 10, W2)}
      <path d="M248 40l32 32-62 62-36 6 6-36z" fill="#0d0d11" stroke="url(#g-gold)" stroke-width="1.2"/>
      <path d="M182 140l12-12M228 50l32 32" stroke="${G}"/><circle cx="226" cy="96" r="5" stroke="${G2}"/>
      <rect x="236" y="150" width="70" height="34" rx="8" fill="#0d0d11" stroke="${B}"/><path d="M246 172l10-8 8 5 12-12 10 6" stroke="${B}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
    lead: svg(`
      <path d="M22 26h120l-34 52v46l-52 18V78z" fill="url(#g-panel)" stroke="url(#g-gold)" stroke-width="1.2"/>
      ${Array.from({ length: 16 }, (_, i) => `<circle cx="${34 + (i * 37) % 96}" cy="${36 + (i * 13) % 32}" r="3" fill="${i % 3 ? GL : G2}"/>`).join('')}
      <circle cx="78" cy="98" r="3.5" fill="${G2}"/><circle cx="70" cy="114" r="3.5" fill="${G2}"/><circle cx="84" cy="124" r="3.5" fill="${G}"/>
      <path d="M112 116 C 140 116, 150 70, 176 70" stroke="${GL}" stroke-dasharray="3 4"/>
      ${[0, 1, 2, 3].map(i => `<rect x="168" y="${18 + i * 42}" width="138" height="34" rx="8" fill="#0d0d11" stroke="${i === 0 ? 'url(#g-gold)' : GD}"/><circle cx="186" cy="${35 + i * 42}" r="8" fill="${i === 0 ? 'rgba(214,178,110,.5)' : BF}"/><rect x="200" y="${28 + i * 42}" width="${62 - i * 6}" height="4" rx="2" fill="${W1}"/><rect x="200" y="${38 + i * 42}" width="${40 - i * 4}" height="4" rx="2" fill="${W2}"/><rect x="272" y="${29 + i * 42}" width="26" height="12" rx="6" fill="${i < 2 ? 'url(#g-gold)' : 'rgba(110,135,255,.35)'}"/>`).join('')}`),
    aicontent: svg(`
      ${[[60, 60], [60, 140], [130, 30], [130, 100], [130, 170], [200, 60], [200, 140]].map(([x, y], i, a) => i < 2 ? [2, 3, 4].map(j => `<path d="M${x} ${y}L${a[j][0]} ${a[j][1]}" stroke="${GD}"/>`).join('') : (i < 5 ? [5, 6].map(j => `<path d="M${x} ${y}L${a[j][0]} ${a[j][1]}" stroke="${GD}"/>`).join('') : '')).join('')}
      ${[[60, 60], [60, 140], [130, 30], [130, 100], [130, 170], [200, 60], [200, 140]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 3 ? 14 : 9}" fill="${i === 3 ? 'url(#g-gold)' : '#0d0d11'}" stroke="${i % 2 ? G : B}"/>`).join('')}
      <rect x="226" y="20" width="80" height="50" rx="9" fill="url(#g-panel)" stroke="url(#g-gold)"/>${lines(236, 32, [56, 44, 50], 9)}
      <rect x="226" y="80" width="80" height="50" rx="9" fill="#0d0d11" stroke="${B}"/>${lines(236, 92, [48, 56, 36], 9, W2)}
      <rect x="226" y="140" width="80" height="44" rx="9" fill="#0d0d11" stroke="${GD}"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${234 + i * 10}" y="150" width="7" height="7" rx="1.5" fill="${i < 5 ? 'rgba(214,178,110,.6)' : W2}"/><rect x="${234 + i * 10}" y="161" width="7" height="7" rx="1.5" fill="${i < 3 ? 'rgba(214,178,110,.6)' : W2}"/>`).join('')}
      <path d="M18 100h28" stroke="${G}" stroke-dasharray="2 3"/>`)
  };

  const ICON = {
    web: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M9 21h6M12 18v3"/>',
    social: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M10 6h4"/><circle cx="12" cy="13" r="3"/>',
    perf: '<path d="M3 20h18"/><path d="M6 16v-4M10 16V9M14 16v-6M18 16V5"/><path d="M5 9l5-4 4 3 5-5"/>',
    design: '<circle cx="12" cy="12" r="9"/><path d="M12 3l4 9h-8z"/><circle cx="12" cy="16" r="1.5"/>',
    video: '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="M17 10l5-3v10l-5-3"/>',
    aivideo: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="11" r="3"/><path d="M7 18c1-2.5 2.8-3.5 5-3.5s4 1 5 3.5M18 2l.6 1.4L20 4l-1.4.6L18 6l-.6-1.4L16 4l1.4-.6z"/>',
    ugc: '<rect x="6" y="2" width="12" height="20" rx="3"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 17c.8-2 2-3 3.5-3s2.7 1 3.5 3"/><circle cx="9" cy="5" r=".6"/>',
    write: '<path d="M4 20h6l10-10-6-6L4 14z"/><path d="M13 5l6 6"/>',
    lead: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
    aicontent: '<circle cx="5" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="12" cy="12" r="2.5"/><circle cx="19" cy="7" r="2"/><circle cx="19" cy="17" r="2"/><path d="M7 7.8l3 2.8M7 16.2l3-2.8M14.3 10.9L17 8M14.3 13.1L17 16"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 018 0v3"/><circle cx="12" cy="15.5" r="1.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  const icon = (k, sw) => `<svg viewBox="0 0 24 24" fill="none" stroke="url(#g-gold)" stroke-width="${sw || 1.4}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  /* original geometric lion mark */
  function lionMark(id, cls) {
    const pts = [], N = 15;
    for (let k = 0; k < 2 * N; k++) {
      const a = -Math.PI / 2 + k * Math.PI / N;
      let r = k % 2 === 0 ? 47 : 36.5;
      r *= 1 + .07 * Math.max(0, Math.sin(a));
      pts.push((50 + Math.cos(a) * r).toFixed(1) + ' ' + (52 + Math.sin(a) * r).toFixed(1));
    }
    const mane = 'M' + pts.join(' L') + ' Z';
    const face = 'M50 23 L65.5 29 L72 45 L67.5 61 L58.5 74.5 L50 79 L41.5 74.5 L32.5 61 L28 45 L34.5 29 Z';
    return `<svg class="lion-mark ${cls || ''}" viewBox="0 0 100 104" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><clipPath id="${id}-c"><path d="${mane}"/></clipPath></defs>
      <circle class="glow" cx="50" cy="52" r="46" fill="url(#g-glow)"/>
      <path d="${mane}" fill="url(#g-mane)" stroke="url(#g-gold)" stroke-width="1.2" stroke-linejoin="round"/>
      <g clip-path="url(#${id}-c)"><rect class="shine" x="-30" y="-10" width="22" height="130" fill="rgba(255,248,225,.35)" transform="skewX(-18)"/></g>
      <path d="${face}" fill="#0a0a0c" stroke="url(#g-gold)" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M50 25.5 V39 M45.5 33 L47.3 57 M54.5 33 L52.7 57" stroke="#d6b26e" stroke-width=".9" opacity=".55" stroke-linecap="round"/>
      <path d="M36 46.5 L46 48.5 L39 51.5 Z M64 46.5 L54 48.5 L61 51.5 Z" fill="#f1d9a0"/>
      <path d="M43.5 60 L56.5 60 L50 66.5 Z" fill="url(#g-gold)"/>
      <path d="M50 66.5 V70.5 M50 70.5 Q45.5 74.5 41 71.5 M50 70.5 Q54.5 74.5 59 71.5" stroke="#d6b26e" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="g-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3dca0"/><stop offset=".5" stop-color="#d6b26e"/><stop offset="1" stop-color="#8f6c30"/></linearGradient>
    <linearGradient id="g-panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1a17"/><stop offset="1" stop-color="#0c0c0f"/></linearGradient>
    <linearGradient id="g-mane" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a2c14"/><stop offset=".55" stop-color="#1a140a"/><stop offset="1" stop-color="#0d0b08"/></linearGradient>
    <radialGradient id="g-glow"><stop offset="0" stop-color="rgba(214,178,110,.55)"/><stop offset="1" stop-color="rgba(214,178,110,0)"/></radialGradient>
  </defs></svg>`;

  window.VIS = { ART, icon, lionMark, DEFS };
})();
