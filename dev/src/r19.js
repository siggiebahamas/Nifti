/* ===== Round 19 ===== */

/* ---------- 1. The left menu: 10 pages you can always see ---------- */
const NF19_SIDE = [
  ['dashboard', 'Home'], ['orders', 'Orders'], ['messages', 'Messages'], ['inventory', 'Stock'],
  ['__money', 'Money'],
  ['money', 'Money overview'], ['sales', 'Counter'], ['expenses', 'Expenses'], ['collections', 'Getting paid'], ['profit', 'Prices'], ['ledger', 'Books']
];
// pages without their own menu line light up the line they live under
const NF19_PARENT = {cashcount: 'sales', cheques: 'collections', prices: 'profit', books: 'ledger', taxforms: 'ledger', issues: 'money', payroll: 'money', analytics: 'money',
  followups: 'orders', routes: 'orders', returns: 'orders', store: 'orders', discover: 'orders', suppliers: 'orders', team: 'messages', watchdog: 'money'};
function nf19Menu(){
  const sb = document.querySelector('.sidebar'); if(!sb) return;
  let box = sb.querySelector('.nf19-nav');
  if(!box){
    const firstGroup = sb.querySelector('.nav-group'); if(!firstGroup) return;
    box = document.createElement('div'); box.className = 'nav-group nf19-nav'; firstGroup.parentElement.insertBefore(box, firstGroup);
  }
  const want = NF19_SIDE.map(x => x[0]).join(',');
  if(box.dataset.k === want){ box.querySelectorAll('.nf18-off').forEach(n => n.classList.remove('nf18-off')); return; }
  NF19_SIDE.forEach(([p, label]) => {
    if(p === '__money'){ const h = document.createElement('div'); h.className = 'heading nf19-h'; h.textContent = label; box.appendChild(h); return; }
    const it = [...sb.querySelectorAll('.nav-item[data-page="' + p + '"]')].find(x => !x.closest('.nf19-nav')) || sb.querySelector('.nav-item[data-page="' + p + '"]');
    if(!it) return;
    it.classList.remove('nf18-off'); it.classList.add('nf19-on');
    const span = it.querySelector('span:not(.nav-badge)'); if(span) span.textContent = label;
    box.appendChild(it);
  });
  box.dataset.k = want;
  sb.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.toggle('nf18-off', !n.closest('.nf19-nav')));
  sb.querySelectorAll('.heading, .nav-fold').forEach(h => h.classList.toggle('nf18-off', !h.closest('.nf19-nav')));
}
function nf19Active(page){
  const target = NF19_SIDE.some(x => x[0] === page) ? page : (NF19_PARENT[page] || page);
  document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(n => n.classList.toggle('active', n.classList.contains('nf19-on') && n.dataset.page === target));
  const hub = (typeof nf18HubOf === 'function' && nf18HubOf(page)) || page;
  document.querySelectorAll('#bottomNav .bnav-item[data-page]').forEach(n => n.classList.toggle('active', n.dataset.page === hub));
}

/* ---------- 2. The landing pages: shown when you are not in the demo ---------- */
// The demo used to open on every load, so logging out reloaded straight back into it.
// Now: a fresh visit shows the landing page; "Try the demo" opens the app; a reload while in the demo stays in it;
// logging out goes back to the landing page. A link ending in #dashboard (or any page) still opens that page directly.
const NF19_KEY = 'nifti-in-app';
function nf19InApp(){ try{ return sessionStorage.getItem(NF19_KEY) === '1'; }catch(e){ return false; } }
function nf19SetInApp(on){ try{ if(on) sessionStorage.setItem(NF19_KEY, '1'); else sessionStorage.removeItem(NF19_KEY); }catch(e){} }
function nf19AfterBoot(){
  if(typeof myBusiness !== 'undefined' && myBusiness) return; // signed-in accounts open their app as before
  const want = window._niftiOpenPage;
  if(want){ navigate(want); return; }
  if(nf19InApp()){ const a = document.querySelector('#view-app .app-page.active'); navigate(a ? a.id.slice(5) : 'dashboard'); }
}

/* ---------- wiring ---------- */
(function(){
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf19){
    const w = function(page){
      // the demo keeps its 5 products even if a late seed adds the old ones back
      try{ if(typeof nfIsDemo === 'function' && nfIsDemo() && typeof NF_DEMO_KEEP !== 'undefined' && typeof nfTrim === 'function'){ const K = NF_DEMO_KEEP;
        nfTrim(inventoryData, i => K.invSeeded.includes(i.name), i => K.inv.includes(i.name) || K.inv.includes(i.name + '@' + i.warehouse)); } }catch(e){}
      const out = nav.apply(this, arguments);
      try{
        const app = typeof appPages !== 'undefined' && appPages.includes(page);
        if(app) nf19SetInApp(true); else if(typeof marketingPages !== 'undefined' && (marketingPages.includes(page) || page === 'login')) nf19SetInApp(false);
        // "See every order in a table": the customer half is built the first time Orders opens, whatever page you came from
        if(page === 'orders'){ const sv = document.getElementById('supplierOrdersView');
          if(sv && !sv.children.length && typeof renderSupplierFulfillmentDashboard === 'function'){ const k = currentAppRole;
            try{ currentAppRole = 'supplier'; renderSupplierFulfillmentDashboard(); window._supplierOrdersInit = true; }catch(e){ console.warn(e); } finally{ currentAppRole = k; }
            try{ nfOrdersBoth(); }catch(e){} } }
        if(document.getElementById('page-' + page)){ nf19Menu(); nf19Active(page);
          // on a phone the tab row scrolls so the page you're on is in view, not cut off at the edge
          setTimeout(() => { document.querySelectorAll('#page-' + page + ' :is(.nf18-hub,.nf18-sub)').forEach(r => { const b = r.querySelector('button.on'); if(b && r.scrollWidth > r.clientWidth) r.scrollLeft = Math.max(0, b.offsetLeft - r.offsetLeft - 16); }); }, 60); }
      }catch(e){ console.warn('nf19 nav', e); }
      return out; };
    w._nf19 = true; w._nf18 = true; w._nf18m = true; window.navigate = w; try{ navigate = w; }catch(e){}
  }
  // the books seed adds two old products back; the demo keeps its 5
  const bs = window.bkSeedDemo;
  if(typeof bs === 'function' && !bs._nf19){ const w = function(){ const r = bs.apply(this, arguments); const trim = () => { try{ if(nfIsDemo()){ const K = NF_DEMO_KEEP; nfTrim(inventoryData, i => K.invSeeded.includes(i.name), i => K.inv.includes(i.name) || K.inv.includes(i.name + '@' + i.warehouse)); } }catch(e){} };
      if(r && typeof r.then === 'function') return r.then(v => { trim(); return v; }); trim(); return r; }; w._nf19 = true; w._nf = bs._nf; window.bkSeedDemo = w; try{ bkSeedDemo = w; }catch(e){} }
  // the Round 18 helper that lit up only the five hubs now follows the 10-line menu
  try{ window.nf18Active = nf19Active; nf18Active = nf19Active; }catch(e){}
  // logging out of the demo goes back to the landing page (and stays there after the reload)
  const lo = window.logOut;
  if(typeof lo === 'function' && !lo._nf19){
    const w = function(){ if(!confirm('Log out of Nifti?')) return; nf19SetInApp(false); const c = window.confirm; window.confirm = () => true;
      try{ return lo.apply(this, arguments); } finally { window.confirm = c; } };
    w._nf19 = true; window.logOut = w; try{ logOut = w; }catch(e){}
  }
  const start = () => { if(!document.querySelector('.sidebar .nav-group')) return setTimeout(start, 300); nf19Menu();
    try{ const a = document.querySelector('#view-app .app-page.active'); if(a) nf19Active(a.id.slice(5)); }catch(e){} };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
