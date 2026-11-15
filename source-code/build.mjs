// MJR LION AGENCY — build
//   node build.mjs [outDir]
// Writes  <outDir>/website/index.html  (public site, no private data)
//         <outDir>/worker/vault.json   (team profiles + projects, AES-256-GCM encrypted)
// The encryption key is read from private/secret.key (base64, 32 bytes) and must be
// added to Cloudflare as the secret MJR_SECRET. private/ is never committed.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { webcrypto as wc } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || resolve(here, 'dist'));
const read = f => readFileSync(resolve(here, f), 'utf8');

// ---------- encrypted vault for the Worker
const keyFile = resolve(here, 'private/secret.key');
if (!existsSync(keyFile)) {
  writeFileSync(keyFile, Buffer.from(wc.getRandomValues(new Uint8Array(32))).toString('base64') + '\n');
  console.log('created new private/secret.key — add it to Cloudflare as secret MJR_SECRET');
}
const rawKey = Buffer.from(readFileSync(keyFile, 'utf8').trim(), 'base64');
if (rawKey.length !== 32) throw new Error('private/secret.key must be 32 bytes (base64)');
const { TEAM_RECORDS, PROJECT_RECORDS, OWNER } = await import('./private/records.mjs');
if (!OWNER || !OWNER.password) throw new Error('private/records.mjs needs an OWNER login');
const db = { team: {}, projects: {} };
{ // owner login for the Updates page — only a salted PBKDF2 hash is stored (inside the encrypted vault)
  const salt = wc.getRandomValues(new Uint8Array(16));
  const base = await wc.subtle.importKey('raw', new TextEncoder().encode(OWNER.password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await wc.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 10000, hash: 'SHA-256' }, base, 256));
  db.owner = { username: OWNER.username, name: OWNER.name, salt: Buffer.from(salt).toString('base64'), hash: Buffer.from(bits).toString('base64') };
}
TEAM_RECORDS.forEach(r => { db.team[r.code] = r.data; });
PROJECT_RECORDS.forEach(r => { db.projects[r.code] = r.data; });
const key = await wc.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
const iv = wc.getRandomValues(new Uint8Array(12));
const ct = new Uint8Array(await wc.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(db))));
mkdirSync(resolve(out, 'worker'), { recursive: true });
writeFileSync(resolve(out, 'worker/vault.json'), JSON.stringify({ v: 1, iv: Buffer.from(iv).toString('base64'), ct: Buffer.from(ct).toString('base64') }));
copyFileSync(resolve(here, 'worker/index.js'), resolve(out, 'worker/index.js'));

// ---------- public website
let html = read('src/index.html');
const js = ['src/data.js', 'src/visuals.js', 'src/gl.js', 'src/app.js'].map(read).join('\n;\n');
html = html.replace('/*__STYLES__*/', () => read('src/styles.css')).replace('/*__SCRIPTS__*/', () => js);
mkdirSync(resolve(out, 'website'), { recursive: true });
writeFileSync(resolve(out, 'website/index.html'), html);
for (const f of ['robots.txt', 'sitemap.xml', '_headers']) copyFileSync(resolve(here, 'public', f), resolve(out, 'website', f));

// ---------- safety: nothing private may reach the public files
const pub = html + read('src/data.js');
for (const r of [...TEAM_RECORDS, ...PROJECT_RECORDS]) {
  if (pub.includes(r.code) && !r.code.startsWith('MJR-PRJ-261')) throw new Error('LEAK: code ' + r.code);
}
const strings = []; JSON.stringify(db, (k, v) => { if (typeof v === 'string' && v.length > 30) strings.push(v); return v; });
for (const w of strings) if (pub.includes(w) && !/^(Founder|Web Developer|Graphic Designer)/.test(w)) throw new Error('LEAK: private text found in public files');
if (pub.includes(OWNER.password)) throw new Error('LEAK: owner password');
console.log('built →', out, (html.length / 1024).toFixed(1) + ' KB');
