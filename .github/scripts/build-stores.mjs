// Builds one small page per live online store (/s/<slug>/) so links shared on Facebook,
// Messenger and Viber show the store's name, headline and products in the preview (their link
// readers don't run JavaScript). Each page loads the lightweight store (store.js, a few KB)
// instead of the full app, so it opens fast on mobile data.
// Also adds the stores to sitemap.xml so Google can find them. Runs on every deploy and every
// 2 hours (see deploy-pages.yml). Uses only the public read-only list_public_stores() function.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const API = 'https://ctryvcloavfpecbrbzxy.supabase.co/rest/v1/rpc/list_public_stores';
const KEY = 'sb_publishable_oWW-IMSOeNNFiQDjUnpWdQ_hlezb7wS';
const SITE = 'https://siggiebahamas.github.io/Nifti/';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let stores = [];
try {
  const r = await fetch(API, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: '{}' });
  if (r.ok) stores = await r.json(); else console.log('store list failed', r.status, await r.text());
} catch (e) { console.log('store list error', e.message); }

for (const s of stores) {
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(s.slug)) continue;
  const title = `${s.name} · Order online`;
  const desc = [s.headline, s.items, s.location].filter(Boolean).join(' · ').slice(0, 280) || `Order from ${s.name} online. See products and prices, order in a minute.`;
  const url = `${SITE}s/${s.slug}/`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Nifti">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${SITE}icon-512.png">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#1B6B40">
<link rel="icon" href="../../icon-512.png">
<link rel="preconnect" href="https://ctryvcloavfpecbrbzxy.supabase.co">
</head><body>
<div id="store-root"><div style="max-width:640px;margin:0 auto;padding:24px 16px;font-family:system-ui,sans-serif;"><h1 style="font-size:21px;">${esc(s.name)}</h1><p>${esc(s.headline || '')}</p><p>Loading the store…</p></div></div>
<script>window.NIFTI_STORE_SLUG = '${s.slug}';</script>
<script src="../../store.js" defer></script>
</body></html>`;
  mkdirSync(`_site/s/${s.slug}`, { recursive: true });
  writeFileSync(`_site/s/${s.slug}/index.html`, html);
}

if (existsSync('_site/sitemap.xml') && stores.length) {
  const sm = readFileSync('_site/sitemap.xml', 'utf8');
  const extra = stores.filter(s => /^[a-z0-9-]+$/.test(s.slug)).map(s => `  <url><loc>${SITE}s/${s.slug}/</loc><changefreq>daily</changefreq></url>`).join('\n');
  writeFileSync('_site/sitemap.xml', sm.replace('</urlset>', extra + '\n</urlset>'));
}
console.log(`built ${stores.length} store page(s)`);
