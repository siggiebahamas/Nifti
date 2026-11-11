/* ===== Round 17: shorter lists everywhere ===== */
// Every long list shows its first few. The rest open with "Show N more", so nothing is lost.
const NF_CAP_OPEN = new Set();
const NF_CAPS = [
  {k: 'inv', page: 'inventory', box: '#invTableBody', items: ':scope > tr', n: 4, noun: ['product', 'products'], at: 'table'},
  {k: 'profit', page: 'profit', box: '#page-profit section.bk-list table.bk-tbl > tbody', items: ':scope > tr', n: 4, noun: ['item', 'items'], at: 'table'},
  {k: 'cc', page: 'cashcount', box: '#page-cashcount section.bk-list table.bk-tbl > tbody', items: ':scope > tr', n: 4, noun: ['count', 'counts'], at: 'table'},
  {k: 'exp', page: 'expenses', box: '#bkExpBody > section.bk-list:last-of-type', items: ':scope > .bk-row', heads: ':scope > .bk-day', n: 4, noun: ['expense', 'expenses'], at: 'list'},
  {k: 'iss', page: 'issues', box: '#issBody', items: ':scope > .lg-card', n: 4, noun: ['check', 'checks'], at: 'list'},
  {k: 'find', page: 'discover', box: '#nfFind .nfx-grid', items: ':scope > article', n: 3, noun: ['business', 'businesses'], at: 'box'}
];
function nfCapToggle(k){ if(NF_CAP_OPEN.has(k)) NF_CAP_OPEN.delete(k); else NF_CAP_OPEN.add(k); nfCapRun(); }
function nfCapRun(){
  const pg = document.querySelector('#view-app .app-page.active'); if(!pg) return;
  NF_CAPS.forEach(c => {
    if(pg.id !== 'page-' + c.page) return;
    const box = document.querySelector(c.box); if(!box) return;
    const items = [...box.querySelectorAll(c.items)].filter(e => e.style.display !== 'none');
    const open = NF_CAP_OPEN.has(c.k), over = items.length > c.n;
    items.forEach((e, i) => { const hide = over && !open && i >= c.n; if(e.classList.contains('nf-cap-h') !== hide) e.classList.toggle('nf-cap-h', hide); });
    if(c.heads){ const hs = c.heads.replace(':scope > ', ''), is = c.items.replace(':scope > ', '');
      box.querySelectorAll(c.heads).forEach(h => { let n = h.nextElementSibling, any = false;
      while(n && !n.matches(hs)){ if(n.matches(is) && !n.classList.contains('nf-cap-h')) any = true; n = n.nextElementSibling; }
      if(h.classList.contains('nf-cap-h') === any) h.classList.toggle('nf-cap-h', !any); }); }
    let btn = pg.querySelector(`.nf-capm[data-capk="${c.k}"]`);
    if(!over){ if(btn) btn.remove(); return; }
    const label = open ? 'Show fewer' : `Show all ${items.length} ${c.noun[1]}`;
    if(!btn){
      btn = document.createElement('div'); btn.className = 'nf-capm'; btn.dataset.capk = c.k;
      btn.innerHTML = `<button type="button" onclick="nfCapToggle('${c.k}')"></button>`;
      const anchor = c.at === 'table' ? (box.closest('.lg-tbl-wrap') || box.closest('table')) : c.at === 'box' ? box : items[items.length - 1];
      anchor.insertAdjacentElement('afterend', btn);
    }
    const b = btn.querySelector('button'); if(b.textContent !== label){ b.textContent = label; b.setAttribute('aria-expanded', String(open)); }
  });
}
let _nfCapRaf = 0;
function nfCapSoon(){ if(_nfCapRaf) return; _nfCapRaf = requestAnimationFrame(() => { _nfCapRaf = 0; try{ nfCapRun(); }catch(e){ console.warn(e); } }); }
(function(){
  const start = () => { const v = document.getElementById('view-app'); if(!v){ return setTimeout(start, 300); }
    new MutationObserver(nfCapSoon).observe(v, {childList: true, subtree: true}); nfCapSoon(); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* Orders: each colour band shows 4 customers or suppliers, the rest behind "Show N more" */
const NFO_OPEN = {};
function nfoCapGroups(b, g){
  const n = 4, all = NFO.band === b || !!NFO.q.trim(), open = all || NFO_OPEN[b], show = open ? g : g.slice(0, n);
  return show.map(nfoGroupHtml).join('') + (g.length > n && !all
    ? `<div class="nfo-capm"><button type="button" aria-expanded="${!!NFO_OPEN[b]}" onclick="NFO_OPEN['${b}']=!NFO_OPEN['${b}']; nfoPaint()">${NFO_OPEN[b] ? 'Show fewer' : `Show ${g.length - n} more`}</button></div>` : '');
}
