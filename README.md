# MJR LION AGENCY — Website

Full 3D agency website, deployed on Cloudflare Workers.

| Path | What it is |
|---|---|
| `website/` | The public site (served as static assets) |
| `worker/index.js` | Backend: `/api/verify` (team verification) and `/api/track` (project tracking) |
| `worker/vault.json` | Team profiles + client projects, **AES-256-GCM encrypted** |
| `source-code/` | Editable source; `node build.mjs ..` rebuilds `website/` and `worker/` |

## Security
- No verification codes or private profiles exist in plain text in this repository or on the website.
- `worker/vault.json` can only be decrypted with the Cloudflare secret **`MJR_SECRET`**
  (Cloudflare → Worker → Settings → Variables and Secrets). The key is never committed.
- To rebuild the vault you need `source-code/private/records.mjs` and `source-code/private/secret.key`
  from the owner's offline backup (both are git-ignored).

## Deploy
Cloudflare deploy command: `npx wrangler deploy`

Home page lion photo: Rod Long on Unsplash (Unsplash License) — replace via `HERO_LION` in `source-code/src/data.js`.
