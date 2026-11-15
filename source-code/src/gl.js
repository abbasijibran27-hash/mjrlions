/* =========================================================================
   MJR LION AGENCY — dependency-free WebGL particle engine
   One particle system morphs between 3D sculptures (lion, globe, …) per page.
   ========================================================================= */
(function () {
  'use strict';
  /* All sculpture generation lives in shapeLib(): it runs inside a Web Worker
     (so building 3D shapes never blocks scrolling), with a main-thread fallback. */
  function shapeLib() {
  const TAU = Math.PI * 2;

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const GOLD = [1.0, 0.74, 0.38];
  const GOLD_L = [1.0, 0.88, 0.62];
  const BRONZE = [0.58, 0.36, 0.15];
  const AMBER = [1.0, 0.58, 0.14];
  const BLUE = [0.24, 0.36, 1.0];
  const WHITE = [1.0, 0.96, 0.88];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

  function Builder(N, seed) {
    const P = new Float32Array(N * 3), C = new Float32Array(N * 3), E = new Float32Array(N * 3);
    let i = 0;
    const R = rng(seed);
    return {
      R, N,
      get i() { return i; },
      put(x, y, z, c, s, g, w) {
        if (i >= N) return false;
        const k = i * 3;
        P[k] = x; P[k + 1] = y; P[k + 2] = z;
        C[k] = c[0]; C[k + 1] = c[1]; C[k + 2] = c[2];
        E[k] = s; E[k + 1] = g || 0; E[k + 2] = w || 0;
        i++; return true;
      },
      done() {
        const n0 = Math.max(1, i);
        while (i < N) { // pad with jittered copies so every shape has exactly N points
          const j = Math.floor(R() * n0) * 3, k = i * 3;
          P[k] = P[j] + (R() - .5) * .04; P[k + 1] = P[j + 1] + (R() - .5) * .04; P[k + 2] = P[j + 2] + (R() - .5) * .04;
          C[k] = C[j] * .6; C[k + 1] = C[j + 1] * .6; C[k + 2] = C[j + 2] * .6;
          E[k] = E[j] * .8; E[k + 1] = 0; E[k + 2] = E[j + 2];
          i++;
        }
        return { P, C, E };
      }
    };
  }

  function sphereDust(b, n, r0, r1, bright) {
    const R = b.R;
    for (let k = 0; k < n; k++) {
      const u = R() * 2 - 1, a = R() * TAU, r = r0 + (r1 - r0) * Math.pow(R(), .7);
      const s = Math.sqrt(1 - u * u);
      const col = R() < .18 ? BLUE : (R() < .5 ? GOLD : WHITE);
      b.put(Math.cos(a) * s * r, u * r, Math.sin(a) * s * r, mulc(col, bright * (0.3 + R() * .7)), .5 + R() * .8, 0, 1);
    }
  }

  /* ---------------------------------------------------------------- LION */
  function shapeLion(N) {
    const b = Builder(N, 7), R = b.R, f = N / 14000;
    const half = [[0, 1.05], [.42, 1.0], [.68, .84], [.8, .55], [.86, .15], [.82, -.25], [.7, -.58], [.55, -.86], [.38, -1.08], [.17, -1.22], [0, -1.26]];
    const poly = half.concat(half.slice(1, -1).reverse().map(p => [-p[0], p[1]]));
    const inside = (x, y) => {
      let c = false;
      for (let a = 0, j = poly.length - 1; a < poly.length; j = a++) {
        const xi = poly[a][0], yi = poly[a][1], xj = poly[j][0], yj = poly[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
      }
      return c;
    };
    const g = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
    const H = (x, y) => {
      const ax = Math.abs(x);
      let z = 0.34 * Math.max(0, 1 - (x * x) / 0.85 - (y * y) / 1.9);
      z += 0.30 * g(ax, y, 0, -0.12, 0.16, 0.42);   // nasal bridge
      z += 0.36 * g(ax, y, 0, -0.5, 0.2, 0.12);     // nose
      z += 0.30 * g(ax, y, 0.2, -0.74, 0.17, 0.14); // muzzle pads
      z += 0.12 * g(ax, y, 0, -1.02, 0.2, 0.12);    // chin
      z += 0.11 * g(ax, y, 0.32, 0.27, 0.18, 0.06); // brows
      z -= 0.15 * g(ax, y, 0.34, 0.1, 0.12, 0.07);  // eye sockets
      z += 0.08 * g(ax, y, 0.58, -0.25, 0.2, 0.25); // cheeks
      return z;
    };
    const L = [-0.45, 0.65, 0.62]; const ln = Math.hypot(L[0], L[1], L[2]); L[0] /= ln; L[1] /= ln; L[2] /= ln;
    const shade = (x, y) => {
      const e = .01, dx = (H(x + e, y) - H(x - e, y)) / (2 * e), dy = (H(x, y + e) - H(x, y - e)) / (2 * e);
      const n = Math.hypot(dx, dy, 1);
      return Math.max(0, (-dx * L[0] - dy * L[1] + L[2]) / n);
    };
    const nAura = Math.floor(N * .04);
    const nFace = Math.floor(N * .30);

    // face surface, lit by a soft key light
    let c = 0;
    while (c < nFace) {
      const x = (R() * 2 - 1) * .9, y = -1.3 + R() * 2.4;
      if (!inside(x, y)) continue;
      const s = shade(x, y), sh = .18 + .82 * s * s;
      b.put(x, y, H(x, y) + (R() - .5) * .02, mulc(mixc(BRONZE, GOLD_L, sh), .5 + .95 * sh), .95 + R() * .7, 0, .08);
      c++;
    }

    // features
    const quad = (p0, p1, p2, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
    const curve = (p0, p1, p2, n, col, size, glow, mirror = true, jit = .01) => {
      n = Math.round(n * f);
      for (let k = 0; k < n; k++) {
        const t = R(), q = quad(p0, p1, p2, t), jx = (R() - .5) * jit, jy = (R() - .5) * jit, z = H(q[0], q[1]) + .035;
        b.put(q[0] + jx, q[1] + jy, z, col, size * (.85 + R() * .3), glow, 0);
        if (mirror) b.put(-q[0] - jx, q[1] + jy, z, col, size * (.85 + R() * .3), glow, 0);
      }
    };
    const FEAT = mulc(GOLD_L, 1.0);
    // eyes — almond, slanted, glowing amber
    curve([.19, .07], [.33, .21], [.5, .17], 95, FEAT, 1.25, 0);
    curve([.19, .07], [.36, .0], [.5, .17], 75, mulc(GOLD, .9), 1.1, 0);
    for (let k = 0, n = Math.round(120 * f); k < n; k++) {
      const t = .06 + R() * .88;
      const up = quad([.19, .07], [.33, .21], [.5, .17], t), lo = quad([.19, .07], [.36, .0], [.5, .17], t);
      const y = lo[1] + (up[1] - lo[1]) * (.15 + R() * .7), x = up[0] + (R() - .5) * .01, z = H(x, y) + .05;
      b.put(x, y, z, AMBER, 1.2 + R() * .5, 1, 0);
      b.put(-x, y, z, AMBER, 1.2 + R() * .5, 1, 0);
    }
    for (let k = 0, n = Math.round(34 * f); k < n; k++) {
      const a = R() * TAU, r = Math.sqrt(R()) * .018, x = .355 + Math.cos(a) * r * .7, y = .108 + Math.sin(a) * r * 1.9;
      b.put(x, y, H(x, y) + .07, [.25, .12, .02], 1.4, 0, 0); b.put(-x, y, H(x, y) + .07, [.25, .12, .02], 1.4, 0, 0);
    }
    // nose
    for (let k = 0, n = Math.round(230 * f); k < n; k++) {
      const v = R(), y = -.38 - v * .22, w = .18 * (1 - Math.pow(v, 1.6)), x = (R() * 2 - 1) * w;
      b.put(x, y, H(x, y) + .04, mulc(GOLD_L, .8), 1.0 + R() * .4, 0, 0);
    }
    curve([0, -.6], [.1, -.5], [.18, -.39], 60, FEAT, 1.3, .3);
    curve([-.18, -.39], [0, -.35], [.18, -.39], 60, FEAT, 1.3, .3, false);
    // mouth
    curve([0, -.6], [0, -.67], [0, -.75], 40, FEAT, 1.2, 0, false, .006);
    curve([0, -.75], [.08, -.89], [.31, -.82], 95, FEAT, 1.2, 0);
    curve([-.2, -.96], [0, -1.06], [.2, -.96], 55, mulc(GOLD, .8), 1.0, 0, false);
    // nasal bridge, brows, forehead fur
    curve([.12, .04], [.1, -.18], [.16, -.38], 60, mulc(GOLD, .85), 1.0, 0);
    curve([.15, .2], [.34, .33], [.55, .2], 75, FEAT, 1.15, 0);
    curve([.05, .76], [.07, .6], [.04, .42], 32, mulc(GOLD, .8), 1.0, 0);
    curve([.17, .72], [.19, .6], [.15, .46], 26, mulc(GOLD, .7), 1.0, 0);
    curve([.29, .66], [.31, .56], [.27, .47], 18, mulc(GOLD, .6), 1.0, 0);
    // whisker dots
    for (let k = 0, n = Math.round(11 * f); k < n; k++) {
      const a = R() * TAU, rr = Math.sqrt(R()), x = .22 + Math.cos(a) * rr * .1, y = -.75 + Math.sin(a) * rr * .055;
      b.put(x, y, H(x, y) + .04, WHITE, .9 + R() * .5, .15, 0); b.put(-x + (R() - .5) * .02, y, H(x, y) + .04, WHITE, .9 + R() * .5, .15, 0);
    }
    // ears
    for (let k = 0, n = Math.round(95 * f); k < n; k++) {
      const a = .15 + R() * 2.85, x = .62 + Math.cos(a) * .21, y = .95 + Math.sin(a) * .2;
      b.put(x, y, -.08, mulc(GOLD_L, .85), 1.1, 0, .2); b.put(-x, y, -.08, mulc(GOLD_L, .85), 1.1, 0, .2);
    }
    for (let k = 0, n = Math.round(55 * f); k < n; k++) {
      const a = .3 + R() * 2.5, x = .62 + Math.cos(a) * .11, y = .96 + Math.sin(a) * .1;
      b.put(x, y, -.05, mulc(GOLD, .6), 1.0, 0, .2); b.put(-x, y, -.05, mulc(GOLD, .6), 1.0, 0, .2);
    }

    // mane — flowing strands that sweep back in depth
    const rb = new Float32Array(360);
    for (let a = 0; a < 360; a++) {
      const th = a / 360 * TAU; let r = .3;
      while (inside(Math.cos(th) * r, Math.sin(th) * r) && r < 2) r += .01;
      rb[a] = r;
    }
    while (b.i < N - nAura) {
      const th = R() * TAU, base = rb[Math.floor(th / TAU * 360) % 360];
      const sn = Math.sin(th), cs = Math.cos(th);
      const ruff = R() < .3;
      const Lm = ruff ? .18 + R() * .26 : (1.0 - .26 * sn + .12 * Math.cos(2 * th)) * (.55 + R() * .62);
      const r0 = base * (ruff ? .93 + R() * .12 : .92 + R() * .24);
      let dx = cs, dy = sn - .2; const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
      const px = -dy, py = dx;
      const amp = (.07 + R() * .2) * (R() < .5 ? -1 : 1), freq = 1.2 + R() * 1.6, ph = R() * TAU;
      const z0 = -.02 - R() * .32;
      const n = Math.max(6, Math.floor(Lm * 64 * (ruff ? 1.4 : 1)));
      const blueTip = R() < .12;
      for (let k = 0; k < n && b.i < N - nAura; k++) {
        const t = (k + R()) / n, off = amp * Math.sin(t * Math.PI * freq + ph) * t;
        const x = cs * r0 + dx * Lm * t + px * off + (R() - .5) * .022;
        const y = sn * r0 + dy * Lm * t + py * off + (R() - .5) * .022;
        const z = z0 - .8 * Math.pow(t, 1.4) * Lm + (R() - .5) * .05;
        const bright = (1 - t * .78) * (ruff ? 1 : .86);
        let col = mixc(GOLD_L, BRONZE, t * .9);
        if (blueTip && t > .55) col = mixc(col, BLUE, Math.min(1, (t - .55) * 2.2));
        b.put(x, y, z, mulc(col, .42 + .85 * bright), (1.35 - .55 * t) * (.8 + R() * .45), 0, t);
      }
    }
    sphereDust(b, nAura, 2.4, 3.4, .6);
    return b.done();
  }

  /* -------------------------------------------------------------- GALAXY */
  function shapeGalaxy(N) {
    const b = Builder(N, 11), R = b.R, tilt = 1.12;
    while (b.i < N) {
      const arm = Math.floor(R() * 3), r = Math.pow(R(), .72) * 3.1;
      const a = r * 1.9 + arm * TAU / 3 + (R() - .5) * .55 * (1 + r * .2);
      const x = Math.cos(a) * r, z = Math.sin(a) * r, y = (R() - .5) * .28 * (1 - r / 3.4);
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
      const col = mixc(GOLD_L, r > 1.9 ? BLUE : BRONZE, Math.min(1, r / 3.1));
      b.put(x, y2, z2, mulc(col, 1.05 - r / 3.6), .7 + R() * .9, r < .25 ? .4 : 0, 1);
    }
    return b.done();
  }

  /* ------------------------------------------------------------ GEODESIC */
  function shapeGeodesic(N) {
    const b = Builder(N, 21), R = b.R, rad = 1.75;
    const t = (1 + Math.sqrt(5)) / 2;
    let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const norm = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
    V = V.map(norm);
    const cache = {}, mid = (a, c) => { const key = a < c ? a + '_' + c : c + '_' + a; if (cache[key] != null) return cache[key]; V.push(norm([(V[a][0] + V[c][0]) / 2, (V[a][1] + V[c][1]) / 2, (V[a][2] + V[c][2]) / 2])); return cache[key] = V.length - 1; };
    const F2 = []; F.forEach(([a, c, d]) => { const ab = mid(a, c), bc = mid(c, d), ca = mid(d, a); F2.push([a, ab, ca], [c, bc, ab], [d, ca, bc], [ab, bc, ca]); });
    const E = {}; F2.forEach(([a, c, d]) => [[a, c], [c, d], [d, a]].forEach(([p, q]) => { E[p < q ? p + '_' + q : q + '_' + p] = [p, q]; }));
    const edges = Object.values(E);
    const nEdge = Math.floor(N * .5);
    for (let k = 0; k < nEdge; k++) {
      const [p, q] = edges[Math.floor(R() * edges.length)], s = R();
      const v = norm([V[p][0] + (V[q][0] - V[p][0]) * s, V[p][1] + (V[q][1] - V[p][1]) * s, V[p][2] + (V[q][2] - V[p][2]) * s]);
      b.put(v[0] * rad, v[1] * rad, v[2] * rad, mulc(GOLD_L, .55 + R() * .35), .8 + R() * .5, 0, .1);
    }
    const nV = Math.floor(N * .08);
    for (let k = 0; k < nV; k++) {
      const v = V[Math.floor(R() * V.length)], j = .035;
      b.put(v[0] * rad + (R() - .5) * j, v[1] * rad + (R() - .5) * j, v[2] * rad + (R() - .5) * j, WHITE, 1.4, .7, 0);
    }
    const nCore = Math.floor(N * .15);
    for (let k = 0; k < nCore; k++) {
      const y = 1 - 2 * (k + .5) / nCore, r = Math.sqrt(1 - y * y), a = k * 2.39996;
      b.put(Math.cos(a) * r * .6, y * .6, Math.sin(a) * r * .6, mulc(mixc(GOLD, BLUE, .35), .9), 1.0, .3, .3);
    }
    const nRing = Math.floor(N * .14);
    for (let k = 0; k < nRing; k++) {
      const a = R() * TAU, rr = 2.45 + (R() - .5) * .06, x = Math.cos(a) * rr, z = Math.sin(a) * rr, tl = .42;
      b.put(x, -z * Math.sin(tl), z * Math.cos(tl), mulc(R() < .3 ? BLUE : GOLD, .75), .7 + R() * .5, 0, .4);
    }
    sphereDust(b, N - b.i, 2.0, 3.3, .45);
    return b.done();
  }

  /* ----------------------------------------------------------- TORUS KNOT */
  function shapeKnot(N) {
    const b = Builder(N, 31), R = b.R, p = 2, q = 3;
    const nK = Math.floor(N * .88);
    for (let k = 0; k < nK; k++) {
      const t = R() * TAU, rr = 1.25 + .52 * Math.cos(q * t);
      const x = rr * Math.cos(p * t), y = rr * Math.sin(p * t), z = .52 * Math.sin(q * t) * 1.3;
      const u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u), tr = .2 * Math.pow(R(), .5);
      const hue = (Math.sin(t * 2) + 1) / 2;
      b.put(x + Math.cos(a) * s * tr, y + u * tr, z + Math.sin(a) * s * tr, mulc(mixc(GOLD_L, mixc(BRONZE, BLUE, .25), hue * .85), .5 + R() * .5), .8 + R() * .6, R() < .01 ? .8 : 0, .3);
    }
    sphereDust(b, N - b.i, 2.4, 3.4, .45);
    return b.done();
  }

  /* -------------------------------------------------------- STUDIO ORBITS */
  function shapeOrbits(N) {
    const b = Builder(N, 41), R = b.R;
    const orbits = [[.95, .3, 0], [1.2, 1.1, .8], [1.45, -.6, 1.7], [1.7, .9, 2.6], [1.95, -1.2, 3.4], [2.15, .4, 4.4], [2.35, -.25, 5.3]];
    const tf = (x, y, z, tx, ry) => { const y1 = y * Math.cos(tx) - z * Math.sin(tx), z1 = y * Math.sin(tx) + z * Math.cos(tx); return [x * Math.cos(ry) + z1 * Math.sin(ry), y1, -x * Math.sin(ry) + z1 * Math.cos(ry)]; };
    const nRing = Math.floor(N * .045), nMem = Math.floor(N * .024);
    orbits.forEach(([r, tx, ry], j) => {
      for (let k = 0; k < nRing; k++) { const a = R() * TAU; const v = tf(Math.cos(a) * r, 0, Math.sin(a) * r, tx, ry); b.put(v[0], v[1], v[2], mulc(j % 3 === 2 ? mixc(GOLD, BLUE, .6) : GOLD, .55), .7 + R() * .4, 0, .2); }
      const ph = j * 2.1 + .5, c = tf(Math.cos(ph) * r, 0, Math.sin(ph) * r, tx, ry);
      for (let k = 0; k < nMem; k++) { const u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u), rr = .15 * Math.cbrt(R()); b.put(c[0] + Math.cos(a) * s * rr, c[1] + u * rr, c[2] + Math.sin(a) * s * rr, mulc(GOLD_L, .75), 1.0, .4, 0); }
    });
    const nCore = Math.floor(N * .2);
    for (let k = 0; k < nCore; k++) { const y = 1 - 2 * (k + .5) / nCore, r = Math.sqrt(1 - y * y), a = k * 2.39996, rr = .5 + (R() - .5) * .04; b.put(Math.cos(a) * r * rr, y * rr, Math.sin(a) * r * rr, mulc(GOLD_L, .8), 1.0, .35, .2); }
    sphereDust(b, N - b.i, 2.5, 3.4, .4);
    return b.done();
  }

  /* ------------------------------------------------------- VAULT / GYRO */
  function shapeVault(N) {
    const b = Builder(N, 51), R = b.R;
    const rings = [[1.95, .35, 0], [1.6, 1.25, .9], [1.25, -.7, 2.1]];
    const nR = Math.floor(N * .17);
    rings.forEach(([r, tx, ry], j) => {
      for (let k = 0; k < nR; k++) {
        const a = R() * TAU, ta = R() * TAU, tr = .05 * Math.sqrt(R());
        let x = Math.cos(a) * (r + Math.cos(ta) * tr), y = Math.sin(ta) * tr * 1.6, z = Math.sin(a) * (r + Math.cos(ta) * tr);
        const y1 = y * Math.cos(tx) - z * Math.sin(tx), z1 = y * Math.sin(tx) + z * Math.cos(tx);
        const x2 = x * Math.cos(ry) + z1 * Math.sin(ry), z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
        const notch = (Math.floor(a / TAU * 48) % 4 === 0);
        b.put(x2, y1, z2, mulc(j === 1 ? mixc(GOLD, BLUE, .5) : GOLD_L, notch ? 1 : .55), notch ? 1.2 : .8, notch ? .3 : 0, .1);
      }
    });
    const nHex = Math.floor(N * .07);
    for (let k = 0; k < nHex; k++) {
      const s = Math.floor(R() * 6), t = R(), a0 = s * TAU / 6 + Math.PI / 6, a1 = (s + 1) * TAU / 6 + Math.PI / 6, r = .88;
      b.put(r * (Math.cos(a0) + (Math.cos(a1) - Math.cos(a0)) * t), r * (Math.sin(a0) + (Math.sin(a1) - Math.sin(a0)) * t), 0, GOLD_L, 1.1, .2, 0);
    }
    const nFp = Math.floor(N * .16);
    for (let k = 0; k < nFp; k++) {
      const ring = 1 + Math.floor(R() * 6), r = .1 + ring * .095, a = R() * TAU;
      if (Math.sin(a * (2 + ring) + ring) > .55) { k--; continue; }
      b.put(Math.cos(a) * r, Math.sin(a) * r * 1.12 - .02, .02, mulc(GOLD, .75), .9, 0, 0);
    }
    const nKey = Math.floor(N * .04);
    for (let k = 0; k < nKey; k++) {
      let x, y;
      if (R() < .6) { const a = R() * TAU, r = .08 * Math.sqrt(R()); x = Math.cos(a) * r; y = .05 + Math.sin(a) * r; }
      else { x = (R() - .5) * .07; y = -.02 - R() * .14; }
      b.put(x, y, .06, AMBER, 1.6, 1, 0);
    }
    sphereDust(b, N - b.i, 2.4, 3.4, .4);
    return b.done();
  }

  /* -------------------------------------------------------- GROWTH BARS */
  function shapeBars(N) {
    const b = Builder(N, 61), R = b.R, n = 7, w = .4, base = -1.45;
    const H = k => .45 * Math.pow(1.33, k);
    const nEdge = Math.floor(N * .5), nFace = Math.floor(N * .2);
    for (let m = 0; m < nEdge; m++) {
      const k = Math.floor(R() * n), x0 = -2.1 + k * .7, h = H(k), e = Math.floor(R() * 12), t = R();
      const xs = [x0 - w / 2, x0 + w / 2], zs = [-w / 2, w / 2], ys = [base, base + h];
      let x, y, z;
      if (e < 4) { x = xs[0] + (xs[1] - xs[0]) * t; y = ys[e & 1]; z = zs[e >> 1]; }
      else if (e < 8) { const q = e - 4; x = xs[q & 1]; y = ys[q >> 1]; z = zs[0] + (zs[1] - zs[0]) * t; }
      else { const q = e - 8; x = xs[q & 1]; z = zs[q >> 1]; y = ys[0] + (ys[1] - ys[0]) * t; }
      const top = (y - base) / 2.8;
      b.put(x, y, z, mulc(mixc(BRONZE, GOLD_L, .4 + top), .5 + top * .5), .9, 0, 0);
    }
    for (let m = 0; m < nFace; m++) {
      const k = Math.floor(R() * n), x0 = -2.1 + k * .7, h = H(k);
      b.put(x0 + (R() - .5) * w, base + R() * h, (R() < .5 ? -1 : 1) * w / 2, mulc(GOLD, .35), .7, 0, 0);
    }
    const nCurve = Math.floor(N * .1);
    for (let m = 0; m < nCurve; m++) {
      const t = R(), x = -2.1 + t * 4.2, kf = t * (n - 1), y = base + .45 * Math.pow(1.33, kf) + .4;
      b.put(x, y + (R() - .5) * .03, (R() - .5) * .03, mulc(GOLD_L, .55), .95, .15, 0);
    }
    const nFloor = Math.floor(N * .1);
    for (let m = 0; m < nFloor; m++) {
      const gx = Math.round((R() * 5 - 2.5) / .35) * .35, gz = (R() * 2 - 1) * 1.05;
      if (R() < .5) b.put(gx, base - .02, gz, mulc(BLUE, .35), .55, 0, 0); else b.put((R() * 5 - 2.5), base - .02, Math.round(gz / .35) * .35, mulc(BLUE, .35), .55, 0, 0);
    }
    sphereDust(b, N - b.i, 2.5, 3.4, .35);
    return b.done();
  }

  /* ------------------------------------------------------ TIMELINE HELIX */
  function shapeHelix(N) {
    const b = Builder(N, 71), R = b.R, turns = 2.4, r = 1.2;
    const nA = Math.floor(N * .45), nB = Math.floor(N * .18), nM = Math.floor(N * .018);
    for (let k = 0; k < nA; k++) { const t = R(), a = t * turns * TAU, j = .06; b.put(Math.cos(a) * r + (R() - .5) * j, -1.9 + 3.8 * t + (R() - .5) * j, Math.sin(a) * r + (R() - .5) * j, mulc(mixc(BRONZE, GOLD_L, t), .55 + t * .4), .9, 0, .1); }
    for (let k = 0; k < nB; k++) { const t = R(), a = t * turns * TAU + Math.PI; b.put(Math.cos(a) * r * .9, -1.9 + 3.8 * t, Math.sin(a) * r * .9, mulc(BLUE, .5), .7, 0, .2); }
    for (let m = 0; m < 6; m++) {
      const t = (m + .5) / 6, a = t * turns * TAU, cx = Math.cos(a) * r, cy = -1.9 + 3.8 * t, cz = Math.sin(a) * r;
      for (let k = 0; k < nM; k++) { const u = R() * 2 - 1, aa = R() * TAU, s = Math.sqrt(1 - u * u), rr = .13 * Math.cbrt(R()); b.put(cx + Math.cos(aa) * s * rr, cy + u * rr, cz + Math.sin(aa) * s * rr, mulc(m < 3 ? GOLD_L : GOLD, m < 3 ? .8 : .55), 1.0, m < 3 ? .5 : .1, 0); }
    }
    const nAx = Math.floor(N * .06);
    for (let k = 0; k < nAx; k++) b.put((R() - .5) * .02, -2.1 + R() * 4.2, (R() - .5) * .02, mulc(GOLD, .6), .8, 0, 0);
    sphereDust(b, N - b.i, 2.4, 3.4, .35);
    return b.done();
  }

  /* --------------------------------------------------------------- GLOBE */
  function shapeGlobe(N) {
    const b = Builder(N, 81), R = b.R, r = 1.75;
    const ll = (lat, lon, rr) => { const la = lat * Math.PI / 180, lo = lon * Math.PI / 180; return [rr * Math.cos(la) * Math.sin(lo), rr * Math.sin(la), rr * Math.cos(la) * Math.cos(lo)]; };
    const nS = Math.floor(N * .22);
    for (let k = 0; k < nS; k++) { const y = 1 - 2 * (k + .5) / nS, s = Math.sqrt(1 - y * y), a = k * 2.39996; b.put(Math.cos(a) * s * r, y * r, Math.sin(a) * s * r, mulc(GOLD, .32), .6, 0, 0); }
    const nG = Math.floor(N * .3);
    for (let k = 0; k < nG; k++) {
      if (R() < .5) { const lat = -60 + 20 * Math.floor(R() * 7), lon = R() * 360; const v = ll(lat, lon, r); b.put(v[0], v[1], v[2], mulc(GOLD_L, .6), .8, 0, 0); }
      else { const lon = 30 * Math.floor(R() * 12), lat = -90 + R() * 180; const v = ll(lat, lon, r); b.put(v[0], v[1], v[2], mulc(GOLD_L, .5), .8, 0, 0); }
    }
    const cities = [[33.7, 73.1], [51.5, -.1], [40.7, -74.0]];
    const nArc = Math.floor(N * .07);
    [[0, 1], [0, 2], [1, 2]].forEach(([a, c], j) => {
      const A = ll(cities[a][0], cities[a][1], 1), B = ll(cities[c][0], cities[c][1], 1);
      const dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2], om = Math.acos(Math.min(1, dot));
      for (let k = 0; k < nArc; k++) {
        const t = R(), s0 = Math.sin((1 - t) * om) / Math.sin(om), s1 = Math.sin(t * om) / Math.sin(om);
        const h = r * (1 + Math.sin(Math.PI * t) * (j === 2 ? .2 : .32));
        b.put((A[0] * s0 + B[0] * s1) * h, (A[1] * s0 + B[1] * s1) * h, (A[2] * s0 + B[2] * s1) * h, mulc(j === 2 ? mixc(BLUE, WHITE, .3) : GOLD_L, .42), .85, .12, 0);
      }
    });
    const nC = Math.floor(N * .008);
    cities.forEach(([la, lo]) => { const c = ll(la, lo, r * 1.01); for (let k = 0; k < nC; k++) { const u = R() * 2 - 1, aa = R() * TAU, s = Math.sqrt(1 - u * u), rr = .08 * Math.cbrt(R()); b.put(c[0] + Math.cos(aa) * s * rr, c[1] + u * rr, c[2] + Math.sin(aa) * s * rr, mulc(GOLD_L, .8), 1.1, .6, 0); } });
    const nAt = Math.floor(N * .1);
    for (let k = 0; k < nAt; k++) { const a = R() * TAU, rr = r * (1.12 + R() * .05); b.put(Math.cos(a) * rr, Math.sin(a) * rr, 0, mulc(BLUE, .4), .7, 0, .5); }
    sphereDust(b, N - b.i, 2.4, 3.4, .35);
    return b.done();
  }

  /* ------------------------------------------------- EMBERS (photo halo) */
  function shapeEmbers(N) {
    const b = Builder(N, 101), R = b.R;
    while (b.i < N) {
      const a = R() * TAU, u = R() * 2 - 1, r = 1.5 + Math.pow(R(), .8) * 2.1;
      const s = Math.sqrt(1 - u * u);
      const x = Math.cos(a) * s * r * 1.05, y = u * r * .9 - .2, z = Math.sin(a) * s * r * .6 - .8;
      const hot = R() < .04;
      const col = hot ? GOLD_L : (R() < .12 ? mixc(GOLD, BLUE, .5) : (R() < .5 ? GOLD : BRONZE));
      b.put(x, y, z, mulc(col, hot ? 1 : .35 + R() * .45), hot ? 1.3 + R() * .6 : .5 + R() * .9, hot ? .5 : 0, 1.5);
    }
    return b.done();
  }

  /* --------------------------------------------------------------- DUST */
  function makeDust(N) {
    const b = Builder(N, 91), R = b.R;
    while (b.i < N) {
      const col = R() < .14 ? BLUE : (R() < .45 ? GOLD : WHITE);
      b.put((R() * 2 - 1) * 9, (R() * 2 - 1) * 6, -9 + R() * 10, mulc(col, .25 + R() * .55), .5 + Math.pow(R(), 3) * 2.2, 0, 1);
    }
    return b.done();
  }

  const SHAPES = { embers: shapeEmbers, lion: shapeLion, galaxy: shapeGalaxy, geodesic: shapeGeodesic, knot: shapeKnot, orbits: shapeOrbits, vault: shapeVault, bars: shapeBars, helix: shapeHelix, globe: shapeGlobe };
  return { SHAPES, makeDust, sphereDust, Builder, rng, TAU };
  }
  const { SHAPES, makeDust, sphereDust, Builder, rng, TAU } = shapeLib();

  let shapeWorker = null;
  function getWorker() {
    if (shapeWorker !== null) return shapeWorker;
    try {
      const src = 'var lib=(' + shapeLib.toString() + ')();onmessage=function(e){var d=e.data,s=lib.SHAPES[d.name](d.N);postMessage({name:d.name,N:d.N,P:s.P,C:s.C,E:s.E},[s.P.buffer,s.C.buffer,s.E.buffer]);};';
      shapeWorker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    } catch (e) { shapeWorker = false; }
    return shapeWorker;
  }

  /* ------------------------------------------------------------- MATRICES */
  function persp(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function mul(a, b) {
    const o = new Float32Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; }
    return o;
  }
  function model(tx, ty, tz, rx, ry, rz, s) {
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    const T = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1]);
    const Ry = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1]);
    const Rx = new Float32Array([1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1]);
    const Rz = new Float32Array([cz, sz, 0, 0, -sz, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    const S = new Float32Array([s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1]);
    return mul(mul(mul(mul(T, Ry), Rx), Rz), S);
  }

  const VS = `
attribute vec3 aFrom, aTo, aCF, aCT, aEF, aET; attribute float aR;
uniform mat4 uP, uV, uM; uniform float uT, uMorph, uPx, uOpacity, uBreath, uScatter, uWave;
varying vec3 vC; varying float vA;
void main(){
  float m = clamp(uMorph*1.55 - aR*.55, 0., 1.);
  m = m < .5 ? 4.*m*m*m : 1. - pow(-2.*m + 2., 3.)/2.;
  vec3 p = mix(aFrom, aTo, m);
  vec3 e = mix(aEF, aET, m);
  float mid = sin(m*3.14159);
  p += vec3(sin(aR*41. + uT*.7), cos(aR*29. + uT*.6), sin(aR*23. + 1.7)) * mid * .55 * uScatter;
  float w = e.z * uWave;
  p.x += sin(uT*1.15 + aR*6.283 + p.y*2.1) * .03 * w;
  p.y += cos(uT*.95 + aR*6.283 + p.x*2.3) * .03 * w;
  p.z += sin(uT*.8 + aR*12.) * .02 * w;
  p *= 1. + sin(uT*1.05) * .014 * uBreath;
  vec4 mv = uV * uM * vec4(p, 1.);
  gl_Position = uP * mv;
  float glow = e.y * (.72 + .28*sin(uT*2.1 + aR*3.));
  gl_PointSize = max(1., e.x * (1. + glow*.9) * uPx * (7. / -mv.z));
  vC = mix(aCF, aCT, m) + glow * vec3(.45, .28, .06);
  float tw = .78 + .22 * sin(uT*2.6 + aR*57.);
  float depth = clamp(1.25 - (-mv.z - 5.5) * .16, .25, 1.15);
  vA = uOpacity * tw * depth;
}`;
  const FS = `
precision mediump float; varying vec3 vC; varying float vA;
void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); float a = smoothstep(.5, .0, d); a = pow(a, 1.6); gl_FragColor = vec4(vC * a * vA * 1.25, 1.); }`;

  function Engine(canvas, opts) {
    opts = opts || {};
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl) return null;
    const mobile = opts.mobile;
    const N = opts.count || Math.round((mobile ? 4800 : 10000) * (opts.lowPower ? .7 : 1));
    const reduced = !!opts.reduced;

    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; } return s; }
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return null; }
    gl.useProgram(prog);
    const A = {}, U = {};
    ['aFrom', 'aTo', 'aCF', 'aCT', 'aEF', 'aET', 'aR'].forEach(n => A[n] = gl.getAttribLocation(prog, n));
    ['uP', 'uV', 'uM', 'uT', 'uMorph', 'uPx', 'uOpacity', 'uBreath', 'uScatter', 'uWave'].forEach(n => U[n] = gl.getUniformLocation(prog, n));

    const cache = {}, waiting = {};
    let pending = null;
    const W = getWorker();
    function arrived(name, shp) {
      cache[name] = shp; delete waiting[name];
      if (pending && pending.name === name) { const p = pending; pending = null; go(p.name, p.place, p.o); }
    }
    if (W) {
      W.onmessage = e => { const d = e.data; if (d.N === N) arrived(d.name, { P: d.P, C: d.C, E: d.E }); };
      W.onerror = () => { shapeWorker = false; Object.keys(waiting).forEach(n => arrived(n, SHAPES[n](N))); };
    }
    function request(name) {
      if (cache[name] || waiting[name] || !SHAPES[name]) return;
      if (shapeWorker) { waiting[name] = 1; shapeWorker.postMessage({ name, N }); }
      else cache[name] = SHAPES[name](N);
    }

    function sys(n, init) {
      const s = { n, buf: {}, data: {} };
      ['aFrom', 'aTo', 'aCF', 'aCT', 'aEF', 'aET'].forEach(k => { s.buf[k] = gl.createBuffer(); });
      s.buf.aR = gl.createBuffer();
      const r = new Float32Array(n), R = rng(5 + n); for (let i = 0; i < n; i++) r[i] = R();
      s.r = r;
      gl.bindBuffer(gl.ARRAY_BUFFER, s.buf.aR); gl.bufferData(gl.ARRAY_BUFFER, r, gl.STATIC_DRAW);
      set(s, init, init);
      return s;
    }
    function upload(s, k, arr) { s.data[k] = arr; gl.bindBuffer(gl.ARRAY_BUFFER, s.buf[k]); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW); }
    function set(s, from, to) {
      upload(s, 'aFrom', from.P); upload(s, 'aCF', from.C); upload(s, 'aEF', from.E);
      upload(s, 'aTo', to.P); upload(s, 'aCT', to.C); upload(s, 'aET', to.E);
    }
    function bind(s) {
      ['aFrom', 'aTo', 'aCF', 'aCT', 'aEF', 'aET'].forEach(k => { gl.bindBuffer(gl.ARRAY_BUFFER, s.buf[k]); gl.enableVertexAttribArray(A[k]); gl.vertexAttribPointer(A[k], 3, gl.FLOAT, false, 0, 0); });
      gl.bindBuffer(gl.ARRAY_BUFFER, s.buf.aR); gl.enableVertexAttribArray(A.aR); gl.vertexAttribPointer(A.aR, 1, gl.FLOAT, false, 0, 0);
    }

    // start as a scattered nebula
    const start = (function () { const b = Builder(N, 3); sphereDust(b, N, .5, 5.5, .5); return b.done(); })();
    const main = sys(N, start);
    const dust = sys(mobile ? 700 : 1600, makeDust(mobile ? 700 : 1600));

    const st = {
      shape: null, morph: 1, morphDur: 1.9,
      cur: { x: 0, y: 0, s: 1, o: 0, tilt: 0 }, tgt: { x: 0, y: 0, s: 1, o: .9, tilt: 0 },
      spin: 0, spinSpeed: 0, spinTarget: 0, lion: false,
      mx: 0, my: 0, tmx: 0, tmy: 0, scroll: 0, scrollFade: 1, time: 0, scatter: 1,
      dpr: opts.lowPower ? 1 : Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 1.5), w: 1, h: 1, last: performance.now(), dirty: true,
      skip: 0, lowPower: !!opts.lowPower, paused: false, fN: 0, fT: 0
    };

    function currentBlend() {
      // replicate the shader's morph on the CPU so a new morph starts exactly where we are
      const n = N, P = new Float32Array(n * 3), C = new Float32Array(n * 3), E = new Float32Array(n * 3);
      const f = main.data, r = main.r, mo = st.morph;
      for (let i = 0; i < n; i++) {
        let m = Math.min(1, Math.max(0, mo * 1.55 - r[i] * .55));
        m = m < .5 ? 4 * m * m * m : 1 - Math.pow(-2 * m + 2, 3) / 2;
        for (let k = 0; k < 3; k++) {
          const j = i * 3 + k;
          P[j] = f.aFrom[j] + (f.aTo[j] - f.aFrom[j]) * m;
          C[j] = f.aCF[j] + (f.aCT[j] - f.aCF[j]) * m;
          E[j] = f.aEF[j] + (f.aET[j] - f.aEF[j]) * m;
        }
      }
      return { P, C, E };
    }

    function go(name, place, o) {
      o = o || {};
      if (place) Object.assign(st.tgt, place);
      st.lion = name === 'lion';
      st.spinSpeed = (place && place.spin != null) ? place.spin : (st.lion ? 0 : .14);
      if (name === st.shape) { pending = null; st.dirty = true; return; }
      if (!cache[name]) { request(name); pending = { name, place, o }; st.dirty = true; return; }   // morph starts as soon as the worker delivers it
      pending = null;
      const from = st.shape ? currentBlend() : start;
      set(main, from, cache[name]);
      st.shape = name;
      st.morph = reduced ? 1 : 0;
      st.morphDur = o.duration || 1.9;
      st.scatter = o.scatter != null ? o.scatter : 1;
      st.dirty = true;
    }
    function place(p) { Object.assign(st.tgt, p); st.dirty = true; }

    function resize() {
      const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
      st.w = w; st.h = h;
      canvas.width = Math.round(w * st.dpr); canvas.height = Math.round(h * st.dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      st.dirty = true;
    }

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden || st.paused) { st.last = now; return; }   // nothing to draw: tab hidden or a panel covers the screen
      // save power: lower frame-rate when the sculpture is far behind content or the device is slow
      const far = st.scroll > st.h * 1.2;
      const every = st.morph < 1 ? 1 : (far ? 3 : (st.lowPower ? 2 : 1));
      st.skip = (st.skip + 1) % every;
      if (st.skip !== 0) return;
      let dt = Math.min(.05, (now - st.last) / 1000); st.last = now;
      // adaptive quality: measure real frame time once, then drop resolution if needed
      if (!reduced && st.time > 4 && st.fN < 90 && !(st.lowPower || far)) {
        st.fN++; st.fT += dt;
        if (st.fN === 90) {
          const avg = st.fT / 90;
          if (avg > .024 && st.dpr > 1) { st.dpr = 1; resize(); }
          if (avg > .034) st.lowPower = true;
        }
      }
      if (reduced) { if (!st.dirty) return; dt = 0; }
      st.time += dt;
      if (st.morph < 1) st.morph = Math.min(1, st.morph + dt / st.morphDur);
      const k = reduced ? 1 : 1 - Math.pow(.0015, dt);
      for (const key of ['x', 'y', 's', 'o', 'tilt']) st.cur[key] += (st.tgt[key] - st.cur[key]) * k;
      st.mx += (st.tmx - st.mx) * (reduced ? 1 : 1 - Math.pow(.02, dt));
      st.my += (st.tmy - st.my) * (reduced ? 1 : 1 - Math.pow(.02, dt));
      if (st.lion) { const tgt = Math.round(st.spin / TAU) * TAU; st.spin += (tgt - st.spin) * (1 - Math.pow(.05, dt)); }
      else st.spin += st.spinSpeed * dt;

      const aspect = st.w / st.h;
      gl.clear(gl.COLOR_BUFFER_BIT);
      const P = persp(38 * Math.PI / 180, aspect, .1, 60);
      const V = model(-st.mx * .25, -st.my * .18 + st.scroll * .0006, -7, 0, 0, 0, 1);
      gl.uniformMatrix4fv(U.uP, false, P);
      gl.uniformMatrix4fv(U.uV, false, V);
      gl.uniform1f(U.uT, reduced ? 0 : st.time);
      gl.uniform1f(U.uPx, st.dpr * 2.5);

      // dust
      bind(dust);
      gl.uniformMatrix4fv(U.uM, false, model(0, st.scroll * .0012, 0, 0, st.time * .012 + st.mx * .05, 0, 1));
      gl.uniform1f(U.uMorph, 1); gl.uniform1f(U.uOpacity, .55); gl.uniform1f(U.uBreath, 0); gl.uniform1f(U.uScatter, 0); gl.uniform1f(U.uWave, reduced ? 0 : 3);
      gl.drawArrays(gl.POINTS, 0, dust.n);

      // main sculpture
      bind(main);
      const sway = st.lion ? Math.sin(st.time * .32) * .13 : 0;
      const ry = st.spin + sway + st.mx * (st.lion ? .32 : .2) + (st.lion ? 0 : st.scroll * .0007);
      const rx = st.cur.tilt + st.my * (st.lion ? .16 : .12) + (st.lion ? Math.sin(st.time * .21) * .03 + Math.min(.35, st.scroll * .00025) : 0);
      gl.uniformMatrix4fv(U.uM, false, model(st.cur.x, st.cur.y + st.scroll * .0009, 0, rx, ry, 0, st.cur.s));
      gl.uniform1f(U.uMorph, st.morph);
      gl.uniform1f(U.uOpacity, st.cur.o * st.scrollFade);
      gl.uniform1f(U.uBreath, st.lion && !reduced ? 1 : .3);
      gl.uniform1f(U.uScatter, reduced ? 0 : st.scatter);
      gl.uniform1f(U.uWave, reduced ? 0 : 1);
      gl.drawArrays(gl.POINTS, 0, N);
      st.dirty = false;
    }
    let raf = requestAnimationFrame(frame);
    resize();
    window.addEventListener('resize', resize);

    return {
      go, place, resize,
      pointer(x, y) { st.tmx = x; st.tmy = y; if (reduced) st.dirty = true; },
      scroll(y, fade) { st.scroll = y; st.scrollFade = fade; st.dirty = true; },
      get state() { return st; },
      prewarm(names) { names.forEach(request); },
      pause(v) { st.paused = !!v; }
    };
  }

  window.MJR3D = { Engine };
})();
