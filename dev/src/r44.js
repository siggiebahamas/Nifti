/* ===== Round 44 ===== */

/* ---------- 1. Small fixes that make every page easier ---------- */
// The menu group holding the page you are on always opens, so the highlight is never hidden inside a folded group
function nf44Menu(){
  const a = document.querySelector('#view-app .sidebar .nav-item.active'); if(!a) return;
  const g = a.closest('.nf20-g'); if(!g || !g.classList.contains('folded')) return;
  g.classList.remove('folded'); const h = g.querySelector(':scope > .nf20-h'); if(h) h.setAttribute('aria-expanded', 'true');
  try{ const k = 'nifti-menu-fold-26', f = JSON.parse(localStorage.getItem(k) || '{}') || {}; if(g.dataset.g && f[g.dataset.g]){ f[g.dataset.g] = false; localStorage.setItem(k, JSON.stringify(f)); } }catch(e){}
}
// Stock: "200 on the way / confirmed, due Nov 25" becomes one line: "200 arriving Nov 25"
function nf44Stock(page){
  if(!page || page.id !== 'page-inventory') return;
  page.querySelectorAll('#inventoryTable .nf-inb').forEach(pill => {
    const small = pill.parentElement.querySelector('.nf-inb-d'); if(!small) return;
    const q = (pill.textContent.match(/([\d,]+)\s+on the way/i) || [])[1], d = (small.textContent.match(/(?:due|arriv\w*)\s+(.+)$/i) || [])[1];
    if(!q) return; const t = d ? `${q} arriving ${d.trim()}` : `${q} on the way`;
    const n = [...pill.childNodes].find(x => x.nodeType === 3 && x.textContent.trim()); if(n && n.textContent !== t) n.textContent = t;
    small.classList.add('nf44-hid');
  });
}
// Team: Trash and Job history move under the board, so the three lanes line up with the people column
function nf44Team(page){
  if(!page || page.id !== 'page-team') return;
  const bar = document.getElementById('nf36TBar'), main = bar && bar.closest('.nf41-main'); if(!bar || !main) return;
  if(main.lastElementChild !== bar) main.appendChild(bar);
  bar.classList.add('nf44-tbar');
}
// What runs out: one short line under each item instead of two crowded ones
function nf44RunsOut(page){
  if(!page || page.id !== 'page-dashboard') return;
  const many = typeof warehouses !== 'undefined' && Array.isArray(warehouses) && warehouses.length > 1;
  document.querySelectorAll('#page-dashboard .nf42-sr .sr-l').forEach(l => {
    if(l.dataset.nf44) return; l.dataset.nf44 = '1';
    const m1 = l.querySelector('.sr-m1'), m2 = l.querySelector('.sr-m2'); if(!m1 || !m2) return;
    const ems = [...m1.querySelectorAll('em')], sells = ems.find(e => /sells/i.test(e.textContent)), loc = ems.find(e => e !== sells);
    const sup = m2.querySelector('em'), dl = [...m2.querySelectorAll('em')].find(e => /deliver/i.test(e.textContent));
    const days = dl ? (dl.textContent.match(/(\d+)\s*day/) || [])[1] : '';
    const parts = [sells ? sells.textContent.trim().replace(/^sells\s*/i, 'Sells ') : '', sup ? sup.textContent.trim() + (days ? ` · ${days}-day delivery` : '') : '', many && loc ? loc.textContent.trim() : ''].filter(Boolean);
    const line = document.createElement('span'); line.className = 'nf44-srm'; line.textContent = parts.join(' · ');
    m1.replaceWith(line); m2.remove();
  });
}
(function(){
  if(typeof nf26AfterPass !== 'function') return;
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ document.body.classList.toggle('nf44-msg', !!page && page.id === 'page-messages'); }catch(e){} [nf44Menu, nf44Stock, nf44Team, nf44RunsOut].forEach(f => { try{ f(page); }catch(e){ console.warn('nf44', f.name, e); } }); };
  window.nf26AfterPass = nf26AfterPass;
})();
