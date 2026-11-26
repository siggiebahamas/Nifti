/* ===== Round 82 · Works without internet =====
   - The app is kept on the phone by the service worker (sw.js), so Nifti opens with no signal.
   - A signed-in shop keeps a copy of its business and its books on the phone (IndexedDB), so it can reopen with no signal.
   - Sales, utang payments, expenses and cash counts recorded offline wait on the phone and upload by themselves (bkQueue). */
function nf82Idb(){ return new Promise((res, rej) => { try{ const r = indexedDB.open('nifti-offline', 1); r.onupgradeneeded = () => { try{ r.result.createObjectStore('kv'); }catch(e){} }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }catch(e){ rej(e); } }); }
async function nf82IdbSet(k, v){ try{ const db = await nf82Idb(); return await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(true); tx.onerror = () => res(false); tx.onabort = () => res(false); }); }catch(e){ return false; } }
async function nf82IdbGet(k){ try{ const db = await nf82Idb(); return await new Promise(res => { const tx = db.transaction('kv', 'readonly'), q = tx.objectStore('kv').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); }catch(e){ return null; } }
function nf82Offline(){ return (typeof isOffline !== 'undefined' && isOffline) || !navigator.onLine; }

/* the signed-in account and its business, kept for opening with no signal */
function nf82OffSaveCtx(tm){ try{ if(tm && tm.auth_user_id) localStorage.setItem('nifti-off-ctx', JSON.stringify({at: new Date().toISOString(), tm})); }catch(e){} }
function nf82OffCtx(uid){ try{ const c = JSON.parse(localStorage.getItem('nifti-off-ctx') || 'null'); return c && c.tm && (!uid || c.tm.auth_user_id === uid) ? c.tm : null; }catch(e){ return null; } }
function nf82OffUser(){
  try{ const c = nf82OffCtx(); if(!c) return null;
    for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(/^sb-.*-auth-token$/.test(k)){ const v = JSON.parse(localStorage.getItem(k) || 'null'); const u = v && (v.user || (v.currentSession && v.currentSession.user)); if(u && u.id === c.auth_user_id) return u; } }
  }catch(e){}
  return null;
}
function nf82OffCanBoot(){ return nf82Offline() && !!nf82OffUser(); }
let NF82_OFFBOOT = false;

/* the books (sales, expenses, counts, stock moves, menu), kept after every load */
async function nf82BkSnap(){
  if(!myBusiness || !BK || !BK.loaded) return;
  const snap = {at: new Date().toISOString(), biz: myBusiness.id, expenses: (BK.expenses || []).filter(x => !x.pending), sales: (BK.sales || []).filter(x => !x.pending), moves: BK.moves || [], counts: BK.counts || [], countDays: BK.countDays || [], menu: BK.menu || []};
  await nf82IdbSet('bk:' + myBusiness.id, snap);
}
function nf82BkOffline(results){
  const allFailed = results.filter(r => r && r.error).length >= 2 && results[1] && results[1].error;
  if(!allFailed || !(nf82Offline() || (typeof bkIsNetErr === 'function' && bkIsNetErr(results[1].error)))) return false;
  return true;
}
async function nf82BkRestore(){
  if(!myBusiness) return false; const s = await nf82IdbGet('bk:' + myBusiness.id); if(!s) return false;
  BK.expenses = s.expenses || []; BK.sales = s.sales || []; BK.moves = s.moves || []; BK.counts = s.counts || []; BK.countDays = s.countDays || []; BK.menu = s.menu || [];
  if(typeof bkMergeQueued === 'function') bkMergeQueued();
  BK.offlineAt = s.at; return true;
}

/* first visit: ask the service worker to keep the app now, not only on the next visit */
(function(){
  if(!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => { setTimeout(() => { navigator.serviceWorker.ready.then(reg => { try{ if(reg.active && !localStorage.getItem('nifti-shell-kept-v82')){ reg.active.postMessage({type: 'nifti-cache-shell'}); localStorage.setItem('nifti-shell-kept-v82', '1'); } }catch(e){} }).catch(() => {}); }, 4000); });
})();

/* the banner says what still works, and how many entries are waiting */
function nf82QueueCount(){ try{ return (typeof bkQueue === 'function' ? bkQueue().length : 0); }catch(e){ return 0; } }
function nf82Ago(iso){ if(!iso) return ''; const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; }
function nf82BannerPaint(){
  const b = document.getElementById('offlineBanner'); if(!b) return;
  const n = nf82QueueCount(), off = nf82Offline();
  const html = off ? `<span class="ic" aria-hidden="true">${nf82Ic('<path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>', 18)}</span><span><b>No internet.</b> Keep recording sales, utang, expenses and cash counts. They upload by themselves when you're back online.${n ? ` <em>${n} waiting to upload</em>` : ''}${BK && BK.offlineAt ? ` <em>Your copy: ${nf82E(nf82Ago(BK.offlineAt))}</em>` : ''}</span>`
    : n ? `<span class="ic" aria-hidden="true">${nf82Ic('<path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v6h-6"/>', 18)}</span><span><b>Back online.</b> Uploading ${n} entr${n === 1 ? 'y' : 'ies'}…</span>` : '';
  if(b.dataset.k !== html){ b.dataset.k = html; b.innerHTML = html; }
  b.classList.toggle('show', !!html); b.classList.toggle('nf82-up', !off && !!n); b.classList.add('nf82-ob');
}
if(typeof updateOfflineBanner === 'function' && !updateOfflineBanner._nf82){ const _ob = updateOfflineBanner; updateOfflineBanner = function(){ try{ _ob.apply(this, arguments); }catch(e){} try{ nf82BannerPaint(); }catch(e){} }; updateOfflineBanner._nf82 = true; window.updateOfflineBanner = updateOfflineBanner; }
window.addEventListener('online', () => setTimeout(nf82BannerPaint, 50));
window.addEventListener('offline', () => setTimeout(nf82BannerPaint, 50));
setInterval(() => { try{ if(nf82Offline() || nf82QueueCount()) nf82BannerPaint(); else { const b = document.getElementById('offlineBanner'); if(b && b.classList.contains('nf82-up')) nf82BannerPaint(); } }catch(e){} }, 5000);
if(typeof bkQueueSave === 'function' && !bkQueueSave._nf82){ const _qs = bkQueueSave; bkQueueSave = function(){ const r = _qs.apply(this, arguments); setTimeout(() => { try{ nf82BannerPaint(); }catch(e){} }, 30); return r; }; bkQueueSave._nf82 = true; window.bkQueueSave = bkQueueSave; }

/* with no signal, Supabase calls answer "offline" right away instead of waiting on the network
   (the sign-in library otherwise retries for up to 30 seconds on every call, which froze the app) */
function nf82FakeQ(){
  const res = Promise.resolve({data: null, error: {message: 'Failed to fetch (offline)', offline: true}, count: null, status: 0});
  let px; const h = {get(t, k){ if(k === 'then') return res.then.bind(res); if(k === 'catch') return res.catch.bind(res); if(k === 'finally') return res.finally.bind(res); return () => px; }, apply(){ return px; }};
  px = new Proxy(function(){}, h); return px;
}
(function(){
  try{
    if(typeof sb === 'undefined' || !sb || sb._nf82) return;
    const f = sb.from.bind(sb), r = sb.rpc.bind(sb);
    sb.from = function(){ return nf82Offline() ? nf82FakeQ() : f.apply(null, arguments); };
    sb.rpc = function(){ return nf82Offline() ? nf82FakeQ() : r.apply(null, arguments); };
    if(sb.storage && sb.storage.from){ const sf = sb.storage.from.bind(sb.storage); sb.storage.from = function(){ return nf82Offline() ? nf82FakeQ() : sf.apply(null, arguments); }; }
    sb._nf82 = true;
  }catch(e){ console.warn('nf82 offline client', e); }
})();
