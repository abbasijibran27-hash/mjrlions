/* =========================================================================
   MJR LION AGENCY — Cloudflare Worker backend
   - Serves the static website from ./website (ASSETS binding)
   - POST /api/verify  { code }  -> verified team member profile
   - POST /api/track   { id }    -> client project record
   Private records live in vault.json, encrypted with AES-256-GCM.
   The key is the Cloudflare secret MJR_SECRET — it is never in the repo,
   so nobody can read the records from GitHub or from the website files.
   ========================================================================= */
import VAULT from './vault.json';

const dec = new TextDecoder();
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
let records = null;

async function load(env) {
  if (records) return records;
  if (!env.MJR_SECRET) throw new Error('not_configured');
  const key = await crypto.subtle.importKey('raw', b64(env.MJR_SECRET.trim()), 'AES-GCM', false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(VAULT.iv) }, key, b64(VAULT.ct));
  records = JSON.parse(dec.decode(pt));
  return records;
}

// best-effort brute-force protection (per edge isolate)
const fails = new Map();
const LIMIT = 6, WINDOW = 10 * 60 * 1000;
function blocked(ip) {
  const f = fails.get(ip);
  if (!f) return false;
  if (Date.now() - f.t > WINDOW) { fails.delete(ip); return false; }
  return f.n >= LIMIT;
}
function failed(ip) {
  const f = fails.get(ip);
  if (!f || Date.now() - f.t > WINDOW) fails.set(ip, { n: 1, t: Date.now() });
  else f.n++;
  if (fails.size > 5000) fails.clear();
}

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

function normalise(raw, prefix) {
  let c = String(raw || '').toUpperCase().replace(/[\s_]+/g, '').replace(/[–—]/g, '-').slice(0, 24);
  const bare = prefix.replace(/-/g, '');
  if (/^\d{5}$/.test(c)) c = prefix + c;
  if (c.startsWith(bare) && /^\d{5}$/.test(c.slice(bare.length))) c = prefix + c.slice(bare.length);
  return c;
}

async function lookup(request, env, kind) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (blocked(ip)) return json({ ok: false, error: 'rate_limited' }, 429);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
  const prefix = kind === 'team' ? 'MJR-TM-' : 'MJR-PRJ-';
  const code = normalise(kind === 'team' ? body.code : body.id, prefix);
  if (!new RegExp('^' + prefix + '\\d{5}$').test(code)) return json({ ok: false, error: 'format' }, 400);
  let db;
  try { db = await load(env); } catch (e) { return json({ ok: false, error: 'not_configured' }, 503); }
  await sleep(250); // slows automated guessing
  const rec = db[kind][code];
  if (!rec) { failed(ip); return json({ ok: false, error: 'not_found' }, 404); }
  return json({ ok: true, data: rec });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/verify') return lookup(request, env, 'team');
    if (url.pathname === '/api/track') return lookup(request, env, 'projects');
    if (url.pathname.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  }
};
