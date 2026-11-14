/* ===== Round 27: simpler everywhere. No Telegram, short Settings, install prompt, cash drawer summary ===== */
// Telegram is off for now: the link, cards and setup step are gone. Alerts still reach phones as normal notifications.
(function(){
  document.documentElement.classList.add('nf27-notg');
  try{ nf22HomeAlertCard = function(){ const o = document.getElementById('nf22AlertCard'); if(o) o.remove(); }; window.nf22HomeAlertCard = nf22HomeAlertCard; }catch(e){}
  try{ new MutationObserver(() => { const h = document.querySelector('.nf25-svc .adm-h'); if(h && /Telegram/.test(h.textContent)) h.textContent = 'Notebook reading'; }).observe(document.body, {childList: true, subtree: true}); }catch(e){}
  const ss = window.setupSteps;
  if(typeof ss === 'function' && !ss._nf27){ const w = function(){ return (ss.apply(this, arguments) || []).filter(s => !/Telegram/i.test(s.label || '')); }; w._nf27 = true; window.setupSteps = w; try{ setupSteps = w; }catch(e){} }
})();
/* ---------- Settings: the six things people change, then "More settings" ---------- */
const NF27_KEEP = /^(Business profile|How buyers pay you|Team & roles|Who sees what|Your plan|Help & support|Account & security)/;
function nf27Settings(page){
  if(!page || page.id !== 'page-settings') return;
  const cards = [...page.querySelectorAll('.settings-card')].filter(c => !c.classList.contains('owner-only'));
  let more = 0;
  cards.forEach(c => { const t = ((c.querySelector('h2, summary, h3') || {}).textContent || '').trim(); const keep = NF27_KEEP.test(t) || c.id === 'nf26WhoCard';
    if(c.classList.contains('nf27-more') === keep) c.classList.toggle('nf27-more', !keep); if(!keep && c.offsetParent !== null || (!keep && page.classList.contains('nf27-closed'))) more++; });
  page.querySelectorAll('.settings-section-title').forEach(h => h.classList.add('nf27-more'));
  let b = document.getElementById('nf27MoreBtn');
  if(!b){ b = document.createElement('button'); b.type = 'button'; b.id = 'nf27MoreBtn'; b.className = 'nf26-foldbtn nf27-morebtn'; page.classList.add('nf27-closed');
    b.onclick = () => { const closed = page.classList.toggle('nf27-closed'); b.classList.toggle('open', !closed); };
    b.innerHTML = '<span>More settings <small>taxes, delivery partners, branches, notifications, privacy, your data, display</small></span><i aria-hidden="true">›</i>'; }
  const firstMore = page.querySelector('.settings-section-title.nf27-more, .settings-card.nf27-more');
  const lastKeep = [...page.querySelectorAll('.settings-card:not(.nf27-more):not(.owner-only)')].pop();
  if(lastKeep && b.previousElementSibling !== lastKeep){ // the everyday cards first, then the button, then the rest
    const host = lastKeep.parentElement; [...page.querySelectorAll('.settings-card:not(.nf27-more):not(.owner-only)')].forEach(k => { if(firstMore && firstMore.parentElement === host && (firstMore.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING)) host.insertBefore(k, firstMore); });
    const lk = [...page.querySelectorAll('.settings-card:not(.nf27-more):not(.owner-only)')].pop(); lk.insertAdjacentElement('afterend', b); }
  // typing in the settings search opens everything
  const q = page.querySelector('.nf18-ss input'); if(q && !q.dataset.nf27){ q.dataset.nf27 = '1'; q.addEventListener('input', () => { if(q.value.trim()){ page.classList.remove('nf27-closed'); b.classList.add('open'); } }); }
}
/* ---------- Sales: the month's cash counts in three boxes ---------- */
function nf27Drawer(page){
  if(!page || page.id !== 'page-sales') return; const d = document.getElementById('mhDrawer'); if(!d) return; const cal = d.querySelector('.cal'); if(!cal) return;
  let short = 0, shortN = 0, over = 0, overN = 0, ok = 0, counted = 0;
  cal.querySelectorAll('.day:not(.blank)').forEach(c => { const t = ((c.querySelector('.st') || {}).textContent || '').replace(/\s+/g, ' ').trim();
    const m = t.match(/([−\-+])\s*₱([\d,]+)/); if(m){ counted++; const n = Number(m[2].replace(/,/g, '')); if(m[1] === '+'){ over += n; overN++; } else { short += n; shortN++; } }
    else if(/match|✓/i.test(t)){ ok++; counted++; } });
  const key = [short, shortN, over, overN, ok].join('|'); let box = d.querySelector('.nf27-sum');
  if(box && box.dataset.k === key && box.previousElementSibling === cal) return;
  if(!box){ box = document.createElement('div'); box.className = 'nf27-sum'; }
  box.dataset.k = key; const dd = n => `${n} day${n === 1 ? '' : 's'}`;
  box.innerHTML = `<div class="r"><em>SHORT</em><b>${shortN ? '−' + bkPeso(short) : '₱0'}</b><span>${dd(shortN)}</span></div><div class="y"><em>OVER</em><b>${overN ? '+' + bkPeso(over) : '₱0'}</b><span>${dd(overN)}</span></div><div class="g"><em>MATCHED</em><b>${dd(ok)}</b><span>of ${counted} counted</span></div>`;
  cal.insertAdjacentElement('afterend', box);
}
/* ---------- Phone: put Nifti on the home screen ---------- */
function nf27Install(page){
  if(!page || page.id !== 'page-dashboard') return; const old = document.getElementById('nf27Install');
  let hide = false; try{ hide = localStorage.getItem('nifti-install-hide') === '1'; }catch(e){}
  const can = !isAlreadyInstalled() && !hide && nf26Phone() && (!!_deferredInstallPrompt || isIosDevice());
  if(!can){ if(old) old.remove(); return; } if(old) return;
  const mosaic = document.querySelector('#mhHome .mosaic'); if(!mosaic) return;
  const c = document.createElement('section'); c.id = 'nf27Install'; c.className = 'nf27-install';
  c.innerHTML = `<img src="icon-192.png" alt="" width="52" height="52"><div><b>Put Nifti on your home screen</b><span>${isIosDevice() ? 'Tap the Share button below, then "Add to Home Screen".' : 'Opens like an app, with one tap. No download from a store.'}</span>
    <div class="nf27-ib">${isIosDevice() ? '' : '<button type="button" class="btn btn-primary" onclick="promptInstallApp()">Add to home screen</button>'}<button type="button" class="nf26-link" onclick="try{localStorage.setItem(\'nifti-install-hide\',\'1\')}catch(e){} document.getElementById(\'nf27Install\').remove()">Not now</button></div></div>`;
  mosaic.parentElement.insertBefore(c, mosaic);
}
window.addEventListener('appinstalled', () => { const o = document.getElementById('nf27Install'); if(o) o.remove(); });
(function(){
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ nf27Settings(page); }catch(e){ console.warn('nf27 settings', e); } try{ nf27Drawer(page); }catch(e){ console.warn('nf27 drawer', e); } try{ nf27Install(page); }catch(e){} };
  window.nf26AfterPass = nf26AfterPass;
})();
