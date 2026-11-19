/* ===== Round 50 ===== */

/* ---------- 1. Notebook reader, Old records (Excel or typing) and Plans & pricing are real pages ----------
   They used to open on top of the page you were on. Now each one is its own page in the app: the menu
   beside it stays, the item is highlighted, the page scrolls like any other, and "Back to ..." returns
   to where you were. The screens inside are the same ones as before, so every step still works. */
const NF50P = {
  notebook: {el: 'nf22Nb', name: 'Notebook reader', nav: ['nf23NbNav', 'nf23NbMore'], role: 'datacenter'},
  oldrecords: {el: 'nf45Old', name: 'Excel or typing', nav: ['nf45OldNav', 'nf45OldMore'], role: 'datacenter'},
  plans: {el: 'nf26Plans', name: 'Plans & pricing', nav: ['nf26PlanNav']}
};
const NF50 = {from: {}, busy: false, step: null};
function nf50E(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]); }
function nf50Cur(){ return ((document.querySelector('#view-app .app-page.active') || {}).id || '').replace('page-', ''); }
function nf50Ensure(p){
  try{ if(!appPages.includes(p)) appPages.push(p); }catch(e){}
  let pg = document.getElementById('page-' + p);
  if(!pg){ const ref = document.getElementById('page-dashboard'); if(!ref || !ref.parentElement) return null;
    pg = document.createElement('div'); pg.className = 'app-page nf50-page'; pg.id = 'page-' + p; ref.parentElement.appendChild(pg); }
  return pg;
}
function nf50Name(p){ if(NF50P[p]) return NF50P[p].name; try{ return nf47PageName(p); }catch(e){ return 'the last page'; } }
function nf50Allowed(p){ const r = NF50P[p] && NF50P[p].role; if(!r) return true; try{ return isPageAllowedForViewAsRole(r); }catch(e){ return true; } }
function nf50NavMark(p){
  const want = p && NF50P[p] ? NF50P[p].nav : [];
  Object.values(NF50P).forEach(h => h.nav.forEach(id => { const b = document.getElementById(id); if(b) b.classList.toggle('active', want.includes(id)); }));
  if(p && NF50P[p]) document.querySelectorAll('#view-app .nav-item[data-page].active, #bottomNav .bnav-item.active, .more-sheet-item[data-page].active, #nf26HelpNav.active').forEach(n => n.classList.remove('active'));
}
// show one of these pages without the usual page switch (which would close what is being shown)
function nf50Show(p){
  const pg = nf50Ensure(p); if(!pg) return;
  const cur = nf50Cur();
  if(cur !== p){
    if(NF50P[cur]){ if(!NF50.from[p] || NF50.from[p] === p) NF50.from[p] = NF50.from[cur] || 'dashboard'; }
    else if(cur) NF50.from[p] = cur;
    // leaving the notebook for another of these pages keeps its work as a draft, like any other page change
    if(cur === 'notebook' && p !== 'notebook'){ try{ if(nf45NbOpenNow()) nf45NbLeft(p); }catch(e){} }
  }
  try{ nf48PeekClear(); }catch(e){}
  try{ closeMobileSidebar(); }catch(e){}
  try{ closeMoreSheet(); }catch(e){}
  try{ if(typeof closeUserMenu === 'function') closeUserMenu(); }catch(e){}
  document.querySelectorAll('.marketing-view').forEach(v => v.classList.add('hidden'));
  const lg = document.getElementById('view-login'); if(lg) lg.classList.add('hidden');
  const app = document.getElementById('view-app'); if(app) app.classList.remove('hidden');
  if(cur !== p){ document.querySelectorAll('#view-app .app-page').forEach(x => { if(x !== pg) x.classList.remove('active', 'nf48-under', 'nf48-peek'); }); pg.classList.add('active'); window.scrollTo(0, 0); }
  nf50NavMark(p);
  try{ if(location.hash !== '#' + p) history.replaceState(null, '', '#' + p); }catch(e){}
  try{ document.title = nf50Name(p) + ' · Nifti'; }catch(e){}
}
function nf50Back(p){
  if(nf50Cur() !== p) return;
  let to = NF50.from[p] || 'dashboard'; if(to === p || NF50P[to]) to = 'dashboard';
  NF50.busy = true; try{ NF47J.src = 'menu'; NF47J.t = Date.now(); }catch(e){}
  try{ navigate(to); }finally{ NF50.busy = false; }
}
// after a screen closes: go back, unless something else opened in the meantime
function nf50Leave(p){ setTimeout(() => { if(nf50Cur() === p && !nf50IsOpen(p)) nf50Back(p); }, 0); }
function nf50IsOpen(p){
  const el = document.getElementById(NF50P[p].el), pg = document.getElementById('page-' + p);
  return !!(el && pg && pg.contains(el) && !el.hidden);
}
function nf50BarHtml(p){
  const to = NF50.from[p] && NF50.from[p] !== p ? NF50.from[p] : 'dashboard';
  let ic = ''; try{ ic = nf47Svg('back', 18); }catch(e){ ic = '‹'; }
  return `<div class="nf50-bar"><button type="button" class="nf50-back" onclick="nf50Back('${p}')">${ic}<span>Back to ${nf50E(nf50Name(to))}</span></button></div>`;
}
function nf50Dock(p){
  const pg = nf50Ensure(p), el = document.getElementById(NF50P[p].el); if(!pg || !el) return;
  if(el.parentElement !== pg) pg.appendChild(el);
  el.classList.add('nf50-docked'); el.removeAttribute('aria-modal'); el.setAttribute('role', 'region');
  document.body.classList.remove('nf22-nb-open', 'nf20-noscroll');
  if(p !== 'notebook'){ let bar = pg.querySelector(':scope > .nf50-bar'); const html = nf50BarHtml(p);
    if(!bar || bar.dataset.k !== html){ const w = document.createElement('div'); w.innerHTML = html; const nb = w.firstElementChild; nb.dataset.k = html; if(bar) bar.replaceWith(nb); else pg.insertBefore(nb, pg.firstChild); } }
}
// one way in for the menu, the phone's More sheet, links and a reload on #notebook / #oldrecords / #plans
function nf50Go(p){
  if(!NF50P[p]) return;
  if(!nf50Allowed(p)){ try{ showToast("Your role doesn't include that page.", 'warn'); }catch(e){} return; }
  if(p === 'notebook'){ if(nf50IsOpen('notebook')){ nf50Show('notebook'); nf50Dock('notebook'); return; } nf22NbOpen(); return; }
  if(p === 'oldrecords'){ nf45Old(); return; }
  if(p === 'plans'){ nf26OpenPlans(); return; }
}

// the notebook reader
(function(){
  if(typeof nf22NbOpen !== 'function') return;
  const open = nf22NbOpen;
  nf22NbOpen = function(){
    nf50Show('notebook');
    const r = open.apply(this, arguments);
    nf50Dock('notebook');
    try{ NF47NB.from = NF50.from.notebook || 'dashboard'; nf47NbHead(); }catch(e){}
    NF50.step = null;
    return r;
  };
  window.nf22NbOpen = nf22NbOpen;
  const close = nf22NbClose;
  nf22NbClose = function(){ const docked = nf50IsOpen('notebook'); const r = close.apply(this, arguments); if(docked) nf50Leave('notebook'); return r; };
  window.nf22NbClose = nf22NbClose;
  const paint = nf22NbPaint;
  nf22NbPaint = function(){
    const r = paint.apply(this, arguments);
    try{ if(nf50IsOpen('notebook')){ const k = (typeof NB !== 'undefined' ? NB.step + '|' + !!NB.added : '') + (typeof NB25 !== 'undefined' && NB25.reading ? '|r' : '');
      if(NF50.step !== null && NF50.step !== k && nf50Cur() === 'notebook') window.scrollTo(0, 0); NF50.step = k;
      document.body.classList.remove('nf22-nb-open'); } }catch(e){}
    return r;
  };
  window.nf22NbPaint = nf22NbPaint;
})();

// Old records: the hub, "Match your columns" and "Type your old records" draw into the page
(function(){
  if(typeof nf45Pop !== 'function') return;
  const pop = nf45Pop;
  nf45Pop = function(id, title, body, foot, opts){
    if(id !== 'nf45Old') return pop.apply(this, arguments);
    nf50Show('oldrecords');
    const pg = nf50Ensure('oldrecords');
    document.querySelectorAll('#nf45Old').forEach(x => { if(!pg.contains(x)) x.remove(); });
    let w = pg.querySelector(':scope > #nf45Old');
    if(!w){ w = document.createElement('div'); w.id = 'nf45Old'; w.className = 'nf50-tool'; pg.appendChild(w); }
    w.hidden = false;
    w.innerHTML = `<header class="nf50-head"><h1>${title}</h1>${title === 'Bring in your old records' ? '<p>Notebooks, ledgers and Excel files into Nifti, without typing everything again.</p>' : ''}</header>
      <div class="nf50-body">${body}</div>${foot ? `<div class="nf50-foot">${foot}</div>` : ''}`;
    w.querySelectorAll('.nf43-cancel').forEach(c => c.remove());
    w.querySelectorAll('.nf50-foot button').forEach(b => { if(/^Close$/i.test(b.textContent.trim())) b.remove(); });
    w.querySelectorAll('.nf50-foot').forEach(f => { if(!f.querySelector('button, a, label')) f.remove(); });
    nf50Dock('oldrecords');
    if(nf50Cur() === 'oldrecords') window.scrollTo(0, 0);
    return w;
  };
  window.nf45Pop = nf45Pop;
  const close = slClose;
  slClose = function(id){
    const el = id ? document.getElementById(id) : null;
    if(el && el.classList.contains('nf50-tool')){ el.hidden = true; nf50Leave('oldrecords'); return; }
    return close.apply(this, arguments);
  };
  window.slClose = slClose;
})();

// Plans & pricing
(function(){
  if(typeof nf26OpenPlans !== 'function') return;
  const open = nf26OpenPlans;
  nf26OpenPlans = function(){
    nf50Show('plans');
    const r = open.apply(this, arguments);
    const ov = document.getElementById('nf26Plans');
    if(ov && !ov.dataset.nf50){ ov.dataset.nf50 = '1'; ov.addEventListener('click', e => { if(e.target === ov && ov.classList.contains('nf50-docked')) e.stopImmediatePropagation(); }, true); }
    nf50Dock('plans');
    return r;
  };
  window.nf26OpenPlans = nf26OpenPlans;
  const close = nf26ClosePlans;
  nf26ClosePlans = function(){ const docked = nf50IsOpen('plans'); const r = close.apply(this, arguments); if(docked) nf50Leave('plans'); return r; };
  window.nf26ClosePlans = nf26ClosePlans;
  if(typeof nf26Choose === 'function'){ const ch = nf26Choose; nf26Choose = function(){ const r = ch.apply(this, arguments); if(nf50IsOpen('plans')) window.scrollTo(0, 0); return r; }; window.nf26Choose = nf26Choose; }
  if(typeof nf26PaintPlans === 'function'){ const pp = nf26PaintPlans; nf26PaintPlans = function(){ const r = pp.apply(this, arguments); if(nf50IsOpen('plans')) document.body.classList.remove('nf20-noscroll'); return r; }; window.nf26PaintPlans = nf26PaintPlans; }
})();

// page switches: these three go through nf50Go; every other page clears their highlight
(function(){
  const nav = navigate;
  navigate = function(page){
    if(NF50P[page] && !NF50.busy){ nf50Go(page); return; }
    try{ nf50NavMark(null); }catch(e){}
    try{ if(NF50P[(location.hash || '').slice(1)] && typeof page === 'string' && appPages.includes(page)) history.replaceState(null, '', '#' + page); }catch(e){}
    return nav.apply(this, arguments);
  };
  Object.keys(nav).forEach(k => { navigate[k] = nav[k]; }); window.navigate = navigate;
  const allow = window.isPageAllowedForViewAsRole;
  if(typeof allow === 'function' && !allow._nf50){ const w = function(p){ if(NF50P[p]) return nf50Allowed(p); return allow.apply(this, arguments); }; w._nf50 = true; window.isPageAllowedForViewAsRole = w; try{ isPageAllowedForViewAsRole = w; }catch(e){} }
  Object.keys(NF50P).forEach(nf50Ensure);
  // a reload on one of these pages opens it again
  const h = (location.hash || '').slice(1);
  if(NF50P[h]) setTimeout(() => { try{ if(!document.getElementById('view-app').classList.contains('hidden')) nf50Go(h); }catch(e){} }, 400);
})();
// the menu buttons themselves (some were wired straight to the old popups)
function nf50Wire(){
  const set = (id, p, more) => { const b = document.getElementById(id); if(!b || b.dataset.nf50 === p) return; b.dataset.nf50 = p; b.removeAttribute('onclick');
    b.onclick = e => { if(e){ e.preventDefault(); e.stopPropagation(); } if(more){ try{ closeMoreSheet(); }catch(_){} } nf50Go(p); }; };
  set('nf23NbNav', 'notebook'); set('nf23NbMore', 'notebook', true); set('nf45OldNav', 'oldrecords'); set('nf45OldMore', 'oldrecords', true); set('nf26PlanNav', 'plans');
  const cur = nf50Cur(); if(NF50P[cur]) nf50NavMark(cur);
}
try{ NF45_AFTER.push(nf50Wire); }catch(e){}
try{ nf50Wire(); }catch(e){}
