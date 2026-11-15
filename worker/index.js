/* =========================================================================
   MJR LION AGENCY — Cloudflare Worker backend
   Static site:  ./website (ASSETS binding)
   Team verify:  POST /api/verify  { code }
   Tracking:     POST /api/track   { id }
   Updates feed: GET  /api/posts            (public)
                 POST /api/posts            (owner/admin)  { type, title, body, image? }
                 DELETE /api/posts/:id      (owner/admin)
                 GET  /api/media/:id        (public images)
   Projects:     GET|POST /api/admin/projects, GET|PUT|DELETE /api/admin/projects/:id  (owner/admin; delete = owner)
   Admin:        POST /api/admin/login      { username, password }
                 GET  /api/admin/me
                 POST /api/admin/password   { current, next }
                 GET|POST /api/admin/users, DELETE /api/admin/users/:u   (owner only)
   Private records (team, projects, owner login) live in vault.json, AES-256-GCM
   encrypted with the Cloudflare secret MJR_SECRET. Posts/admins live in KV (UPDATES).
   ========================================================================= */
import VAULT from './vault.json';

const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const tob64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const b64url = u8 => tob64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = s => b64(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4));
const rand = n => crypto.getRandomValues(new Uint8Array(n));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const json = (body, status = 200, extra) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...(extra || {}) }
});

/* ---------------------------------------------------------------- vault */
let records = null;
async function load(env) {
  if (records) return records;
  if (!env.MJR_SECRET) throw new Error('not_configured');
  const key = await crypto.subtle.importKey('raw', b64(env.MJR_SECRET.trim()), 'AES-GCM', false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(VAULT.iv) }, key, b64(VAULT.ct));
  records = JSON.parse(dec.decode(pt));
  return records;
}

/* ---------------------------------------------------------------- rate limiting (best effort, per isolate) */
const fails = new Map();
const LIMIT = 6, WINDOW = 10 * 60 * 1000;
function blocked(k) { const f = fails.get(k); if (!f) return false; if (Date.now() - f.t > WINDOW) { fails.delete(k); return false; } return f.n >= LIMIT; }
function failed(k) { const f = fails.get(k); if (!f || Date.now() - f.t > WINDOW) fails.set(k, { n: 1, t: Date.now() }); else f.n++; if (fails.size > 5000) fails.clear(); }
const ipOf = r => r.headers.get('cf-connecting-ip') || 'unknown';

/* ---------------------------------------------------------------- team verify + project tracking */
function normalise(raw, prefix) {
  let c = String(raw || '').toUpperCase().replace(/[\s_]+/g, '').replace(/[–—]/g, '-').slice(0, 24);
  const bare = prefix.replace(/-/g, '');
  if (/^\d{5}$/.test(c)) c = prefix + c;
  if (c.startsWith(bare) && /^\d{5}$/.test(c.slice(bare.length))) c = prefix + c.slice(bare.length);
  return c;
}
async function lookup(request, env, kind) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  const ip = ipOf(request);
  if (blocked('v:' + ip)) return json({ ok: false, error: 'rate_limited' }, 429);
  let body; try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
  let code;
  if (kind === 'team') {
    code = normalise(body.code, 'MJR-TM-');
    if (!/^MJR-TM-\d{5}$/.test(code)) return json({ ok: false, error: 'format' }, 400);
  } else {
    code = projId(body.id);
    if (!code) return json({ ok: false, error: 'format' }, 400);
  }
  await sleep(250);
  let rec = null;
  if (kind === 'projects' && kvOK(env)) {
    const p = await env.UPDATES.get('project:' + code, 'json');
    if (p) rec = publicProject(p);
  }
  if (!rec) {
    let db; try { db = await load(env); } catch { return json({ ok: false, error: 'not_configured' }, 503); }
    rec = db[kind][code] || null;
  }
  if (!rec) { failed('v:' + ip); return json({ ok: false, error: 'not_found' }, 404); }
  return json({ ok: true, data: rec });
}

/* ---------------------------------------------------------------- passwords + sessions */
async function hashPw(pw, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(String(pw)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: b64(salt), iterations: 10000, hash: 'SHA-256' }, base, 256);
  return tob64(new Uint8Array(bits));
}
function same(a, b) { if (a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; }
let hmac = null;
async function sessionKey(env) {
  if (hmac) return hmac;
  const material = await crypto.subtle.digest('SHA-256', new Uint8Array([...enc.encode('mjr-session:'), ...b64(env.MJR_SECRET.trim())]));
  hmac = await crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  return hmac;
}
async function issue(env, user) {
  const payload = enc.encode(JSON.stringify({ u: user.u, n: user.name, r: user.role, t: user.title || '', exp: Date.now() + 7 * 864e5 }));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await sessionKey(env), payload));
  return b64url(payload) + '.' + b64url(sig);
}
async function auth(request, env) {
  const h = request.headers.get('authorization') || '';
  const m = h.match(/^Bearer ([\w-]+)\.([\w-]+)$/);
  if (!m || !env.MJR_SECRET) return null;
  try {
    const payload = unb64url(m[1]);
    if (!(await crypto.subtle.verify('HMAC', await sessionKey(env), unb64url(m[2]), payload))) return null;
    const s = JSON.parse(dec.decode(payload));
    if (s.exp < Date.now()) return null;
    if (s.r === 'admin') { // admin must still exist (owner can revoke)
      const list = await admins(env);
      const a = list.find(x => x.u === s.u);
      if (!a) return null;
      s.n = a.name; s.t = a.title;
    }
    return s;
  } catch { return null; }
}

/* ---------------------------------------------------------------- KV helpers */
const kvOK = env => !!(env.UPDATES && env.UPDATES.get);
async function admins(env) { return (await env.UPDATES.get('admins', 'json')) || []; }
async function feed(env) { return (await env.UPDATES.get('feed', 'json')) || []; }
const TYPES = ['offer', 'merger', 'news', 'update', 'alert'];
const slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '').slice(0, 14) || 'admin';
function genPassword() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const r = rand(16); let p = '';
  for (let i = 0; i < 16; i++) { p += A[r[i] % A.length]; if (i === 3 || i === 7 || i === 11) p += '-'; }
  return p;
}

async function login(request, env) {
  const ip = ipOf(request);
  if (blocked('l:' + ip)) return json({ ok: false, error: 'rate_limited' }, 429);
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
  const u = String(b.username || '').trim().toLowerCase(), pw = String(b.password || '');
  if (!u || !pw || pw.length > 200) return json({ ok: false, error: 'bad_request' }, 400);
  let db; try { db = await load(env); } catch { return json({ ok: false, error: 'not_configured' }, 503); }
  await sleep(300);
  let user = null;
  if (u === db.owner.username) {
    const override = kvOK(env) ? await env.UPDATES.get('owner_pw', 'json') : null;
    const rec = override || db.owner;
    if (same(await hashPw(pw, rec.salt), rec.hash)) user = { u, name: db.owner.name, role: 'owner', title: 'Owner' };
  } else if (kvOK(env)) {
    const a = (await admins(env)).find(x => x.u === u);
    if (a && same(await hashPw(pw, a.salt), a.hash)) user = { u, name: a.name, role: 'admin', title: a.title };
  }
  if (!user) { failed('l:' + ip); return json({ ok: false, error: 'invalid' }, 401); }
  return json({ ok: true, token: await issue(env, user), me: { u: user.u, name: user.name, role: user.role, title: user.title } });
}

async function changePassword(request, env, me) {
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
  const next = String(b.next || '');
  if (next.length < 10 || next.length > 120) return json({ ok: false, error: 'weak' }, 400);
  const db = await load(env);
  const salt = tob64(rand(16));
  if (me.r === 'owner') {
    const rec = (await env.UPDATES.get('owner_pw', 'json')) || db.owner;
    if (!same(await hashPw(b.current, rec.salt), rec.hash)) return json({ ok: false, error: 'invalid' }, 401);
    await env.UPDATES.put('owner_pw', JSON.stringify({ salt, hash: await hashPw(next, salt) }));
  } else {
    const list = await admins(env), a = list.find(x => x.u === me.u);
    if (!a || !same(await hashPw(b.current, a.salt), a.hash)) return json({ ok: false, error: 'invalid' }, 401);
    a.salt = salt; a.hash = await hashPw(next, salt);
    await env.UPDATES.put('admins', JSON.stringify(list));
  }
  return json({ ok: true });
}

async function users(request, env, me, id) {
  if (me.r !== 'owner') return json({ ok: false, error: 'forbidden' }, 403);
  const list = await admins(env);
  if (request.method === 'GET') return json({ ok: true, admins: list.map(a => ({ u: a.u, name: a.name, title: a.title, at: a.at })) });
  if (request.method === 'DELETE' && id) {
    const next = list.filter(a => a.u !== id);
    await env.UPDATES.put('admins', JSON.stringify(next));
    return json({ ok: true });
  }
  if (request.method === 'POST') {
    let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
    const name = String(b.name || '').trim().slice(0, 60), title = String(b.title || 'Admin').trim().slice(0, 60);
    if (name.length < 2) return json({ ok: false, error: 'name' }, 400);
    if (list.length >= 25) return json({ ok: false, error: 'limit' }, 400);
    let u = slug(name), n = 1;
    while (u === 'owner' || list.some(a => a.u === u)) u = slug(name) + (++n);
    const password = genPassword(), salt = tob64(rand(16));
    list.push({ u, name, title, salt, hash: await hashPw(password, salt), at: Date.now() });
    await env.UPDATES.put('admins', JSON.stringify(list));
    return json({ ok: true, admin: { u, name, title }, password });
  }
  return json({ ok: false, error: 'method' }, 405);
}

/* ---------------------------------------------------------------- posts */
async function createPost(request, env, me) {
  if (Number(request.headers.get('content-length') || 0) > 4e6) return json({ ok: false, error: 'too_large' }, 413);
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
  const type = TYPES.includes(b.type) ? b.type : 'update';
  const title = String(b.title || '').trim().slice(0, 140);
  const body = String(b.body || '').trim().slice(0, 5000);
  if (!title && !body && !b.image) return json({ ok: false, error: 'empty' }, 400);
  const id = Date.now().toString(36) + b64url(rand(5));
  let img = null;
  if (b.image) {
    const m = String(b.image).match(/^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return json({ ok: false, error: 'image' }, 400);
    const bytes = b64(m[2]);
    if (bytes.length > 2.5e6) return json({ ok: false, error: 'image_too_large' }, 413);
    await env.UPDATES.put('img:' + id, bytes, { metadata: { type: m[1] } });
    img = id;
  }
  const post = { id, type, title, body, img, w: +b.w || 0, h: +b.h || 0, author: me.n, atitle: me.t || '', role: me.r, at: Date.now() };
  const list = await feed(env);
  list.unshift(post);
  const drop = list.splice(300);
  await env.UPDATES.put('feed', JSON.stringify(list));
  for (const p of drop) if (p.img) await env.UPDATES.delete('img:' + p.img);
  return json({ ok: true, post });
}
async function deletePost(env, id) {
  const list = await feed(env), p = list.find(x => x.id === id);
  if (!p) return json({ ok: false, error: 'not_found' }, 404);
  await env.UPDATES.put('feed', JSON.stringify(list.filter(x => x.id !== id)));
  if (p.img) await env.UPDATES.delete('img:' + p.img);
  return json({ ok: true });
}
async function media(request, env, id, ctx) {
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  if (cache) { const hit = await cache.match(request); if (hit) return hit; }
  const { value, metadata } = await env.UPDATES.getWithMetadata('img:' + id, 'arrayBuffer');
  if (!value) return new Response('Not found', { status: 404 });
  const res = new Response(value, { headers: { 'content-type': (metadata && metadata.type) || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
  if (cache && ctx) ctx.waitUntil(cache.put(request, res.clone()));
  return res;
}

/* ---------------------------------------------------------------- client projects (tracking portal) */
const STATUSES = ['Booked', 'In Progress', 'Review', 'Revision', 'Finalization', 'Completed'];
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newProjectId() { const r = rand(8); let s = ''; for (let i = 0; i < 8; i++) s += ID_CHARS[r[i] % ID_CHARS.length]; return 'MJR-PRJ-' + s.slice(0, 4) + '-' + s.slice(4); }
function projId(raw) {
  let c = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 30);
  if (c.startsWith('MJRPRJ')) c = c.slice(6);
  if (/^\d{5}$/.test(c)) return 'MJR-PRJ-' + c;                         // legacy / demo IDs
  if (/^[A-Z0-9]{8}$/.test(c)) return 'MJR-PRJ-' + c.slice(0, 4) + '-' + c.slice(4);
  return null;
}
const str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const day = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '';
function today() { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }); } catch { return new Date().toISOString().slice(0, 10); } }
function cleanProject(b) {
  return {
    client: str(b.client, 120), bookedBy: str(b.bookedBy, 80), service: str(b.service, 90),
    start: day(b.start), expiry: day(b.expiry), country: str(b.country, 60),
    bookingType: b.bookingType === 'Contract-based' ? 'Contract-based' : 'Project-wise',
    payment: b.payment === 'PAID' ? 'PAID' : 'PENDING',
    status: STATUSES.includes(b.status) ? b.status : 'Booked',
    progress: Math.max(0, Math.min(100, Math.round(Number(b.progress) || 0))),
    assigned: str(b.assigned, 80), stage: str(b.stage, 120), notes: str(b.notes, 2000),
    milestones: (Array.isArray(b.milestones) ? b.milestones : []).slice(0, 20)
      .map(m => ({ t: str(m && m.t, 120), d: day(m && m.d), done: !!(m && m.done) })).filter(m => m.t)
  };
}
function publicProject(p) {
  const { updatedBy, createdAt, updatedAt, createdBy, ...pub } = p;
  return pub;
}
const projSummary = p => ({ id: p.id, client: p.client, service: p.service, status: p.status, progress: p.progress, payment: p.payment, country: p.country, expiry: p.expiry, lastUpdate: p.lastUpdate, at: p.updatedAt });
async function projIndex(env) { return (await env.UPDATES.get('projects', 'json')) || []; }
async function saveProject(env, p) {
  await env.UPDATES.put('project:' + p.id, JSON.stringify(p));
  const idx = (await projIndex(env)).filter(x => x.id !== p.id);
  idx.unshift(projSummary(p));
  await env.UPDATES.put('projects', JSON.stringify(idx.slice(0, 3000)));
}
async function projects(request, env, me, id) {
  const M = request.method;
  if (!id && M === 'GET') return json({ ok: true, projects: await projIndex(env) });
  if (id && M === 'GET') {
    const p = await env.UPDATES.get('project:' + id, 'json');
    return p ? json({ ok: true, project: p }) : json({ ok: false, error: 'not_found' }, 404);
  }
  if (id && M === 'DELETE') {
    if (me.r !== 'owner') return json({ ok: false, error: 'forbidden' }, 403);
    await env.UPDATES.delete('project:' + id);
    await env.UPDATES.put('projects', JSON.stringify((await projIndex(env)).filter(x => x.id !== id)));
    return json({ ok: true });
  }
  if (M !== 'POST' && M !== 'PUT') return json({ ok: false, error: 'method' }, 405);
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
  const c = cleanProject(b);
  if (c.client.length < 2) return json({ ok: false, error: 'client' }, 400);
  const now = Date.now(), note = str(b.logNote, 300);
  if (M === 'POST' && !id) {
    let nid = newProjectId();
    while (await env.UPDATES.get('project:' + nid)) nid = newProjectId();
    const p = { id: nid, ...c, lastUpdate: today(), createdAt: now, updatedAt: now, createdBy: me.n, updatedBy: me.n,
      log: [{ at: now, status: c.status, progress: c.progress, stage: c.stage, note: note || 'Project booked' }] };
    await saveProject(env, p);
    return json({ ok: true, project: p });
  }
  if (M === 'PUT' && id) {
    const old = await env.UPDATES.get('project:' + id, 'json');
    if (!old) return json({ ok: false, error: 'not_found' }, 404);
    const p = { ...old, ...c, id, lastUpdate: today(), updatedAt: now, updatedBy: me.n };
    const changed = old.status !== c.status || old.progress !== c.progress || old.stage !== c.stage;
    if (changed || note) p.log = [{ at: now, status: c.status, progress: c.progress, stage: c.stage, note }].concat(old.log || []).slice(0, 40);
    await saveProject(env, p);
    return json({ ok: true, project: p });
  }
  return json({ ok: false, error: 'method' }, 405);
}

/* ---------------------------------------------------------------- router */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url), p = url.pathname, M = request.method;
    if (!p.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      if (p === '/api/verify') return await lookup(request, env, 'team');
      if (p === '/api/track') return await lookup(request, env, 'projects');

      if (p.startsWith('/api/media/') && M === 'GET') {
        if (!kvOK(env)) return new Response('Not found', { status: 404 });
        return await media(request, env, p.slice(11).replace(/[^\w-]/g, ''), ctx);
      }
      if (p === '/api/posts' && M === 'GET') {
        if (!kvOK(env)) return json({ ok: true, posts: [] });
        return json({ ok: true, posts: await feed(env) });
      }
      if (p === '/api/admin/login' && M === 'POST') return await login(request, env);

      // everything below needs a valid owner/admin session
      if (!kvOK(env)) return json({ ok: false, error: 'storage_not_configured' }, 503);
      const me = await auth(request, env);
      if (!me) return json({ ok: false, error: 'unauthorized' }, 401);
      if (p === '/api/admin/me') return json({ ok: true, me: { u: me.u, name: me.n, role: me.r, title: me.t } });
      if (p === '/api/admin/password' && M === 'POST') return await changePassword(request, env, me);
      if (p === '/api/admin/users') return await users(request, env, me);
      if (p.startsWith('/api/admin/users/') && M === 'DELETE') return await users(request, env, me, decodeURIComponent(p.slice(17)));
      if (p === '/api/admin/projects') return await projects(request, env, me);
      if (p.startsWith('/api/admin/projects/')) { const pid = projId(decodeURIComponent(p.slice(20))); if (!pid) return json({ ok: false, error: 'not_found' }, 404); return await projects(request, env, me, pid); }
      if (p === '/api/posts' && M === 'POST') return await createPost(request, env, me);
      if (p.startsWith('/api/posts/') && M === 'DELETE') return await deletePost(env, p.slice(11));
      return json({ ok: false, error: 'not_found' }, 404);
    } catch (e) {
      return json({ ok: false, error: 'server_error' }, 500);
    }
  }
};
