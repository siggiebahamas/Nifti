/* ===== Round 26: page-by-page fixes from the launch review ===== */
// Shorter pages on a phone (one side at a time, three rows then "See all"), fewer buttons (Edit, Remove and Receipt
// show after you tap a line), Home's order board and To check's team spending fold away, prices are read-only
// until you tap Edit prices, and pages that repeat each other don't.
const NF26_SIDE = {v: null};
function nf26Phone(){ try{ return nfIsPhone(); }catch(e){ return innerWidth <= 760; } }
function nf26SideSwitch(page){
  const c = page.querySelector('.nf-half-supplier, .nf20-col:not(.s)'), s = page.querySelector('.nf-half-buyer, .nf20-col.s');
  let sw = page.querySelector(':scope .nf26-side');
  if(!nf26Phone() || !c || !s){ if(sw) sw.remove(); [c, s].forEach(x => x && x.classList.remove('nf26-off')); return; }
  const count = h => { const n = h.querySelectorAll('.nfo-po').length || h.querySelectorAll('table.nf25-t tbody tr:not(.nf25-g), table.nf24-tb tbody tr').length; return n; };
  const cur = NF26_SIDE.v === 's' ? 's' : 'c', key = cur + '|' + count(c) + '|' + count(s);
  if(!sw){ sw = document.createElement('div'); sw.className = 'nf26-side'; sw.setAttribute('role', 'tablist'); c.parentElement.insertBefore(sw, c.parentElement.firstChild === c ? c : c.parentElement.firstChild); }
  if(sw.dataset.k !== key){ sw.dataset.k = key;
    sw.innerHTML = `<button type="button" role="tab" class="c${cur === 'c' ? ' on' : ''}" aria-selected="${cur === 'c'}" onclick="nf26SideSet('c')">Selling<b>${count(c)}</b></button><button type="button" role="tab" class="s${cur === 's' ? ' on' : ''}" aria-selected="${cur === 's'}" onclick="nf26SideSet('s')">Buying<b>${count(s)}</b></button>`; }
  c.classList.toggle('nf26-off', cur !== 'c'); s.classList.toggle('nf26-off', cur !== 's');
}
function nf26SideSet(v){ NF26_SIDE.v = v; const p = document.querySelector('#view-app .app-page.active'); if(p){ const sw = p.querySelector('.nf26-side'); if(sw) sw.dataset.k = ''; nf26SideSwitch(p); } }
// long lists: three rows on a phone (eight on a computer), then one "See all" button
function nf26Cap(page){
  const max = nf26Phone() ? 3 : 8;
  page.querySelectorAll('table.nf25-t, table.nf24-tb' + (nf26Phone() ? ', table.bk-tbl, table.lg-tbl' : '')).forEach(t => {
    if(t.closest('.nf20-ov, .modal, #mhSheet')) return;
    const rows = [...t.querySelectorAll('tbody tr')].filter(r => !r.classList.contains('nf25-g')); const wrap = t.closest('.nf25-tw') || t.parentElement;
    let btn = wrap.nextElementSibling && wrap.nextElementSibling.classList.contains('nf26-more') ? wrap.nextElementSibling : null;
    if(rows.length <= max + 1 || t.dataset.nf26all){ if(btn && !t.dataset.nf26all) btn.remove(); t.querySelectorAll('.nf26-rowoff').forEach(r => r.classList.remove('nf26-rowoff')); return; }
    rows.forEach((r, i) => r.classList.toggle('nf26-rowoff', i >= max));
    t.querySelectorAll('tbody tr.nf25-g').forEach(g => { let n = g.nextElementSibling, any = false; while(n && !n.classList.contains('nf25-g')){ if(!n.classList.contains('nf26-rowoff')) any = true; n = n.nextElementSibling; } g.classList.toggle('nf26-rowoff', !any); });
    const tf = t.querySelector('tfoot'); if(tf) tf.classList.add('nf26-rowoff');
    if(!btn){ btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nf26-more'; wrap.insertAdjacentElement('afterend', btn);
      btn.onclick = () => { t.dataset.nf26all = '1'; t.querySelectorAll('.nf26-rowoff').forEach(r => r.classList.remove('nf26-rowoff')); btn.remove(); }; }
    const label = `See all ${rows.length}`; if(btn.textContent !== label) btn.textContent = label;
  });
}
// Edit, Remove and Receipt wait until you tap the line
function nf26RowActions(page){
  page.querySelectorAll('table.nf25-t td.a').forEach(td => {
    if(td.dataset.nf26a) return; const btns = [...td.querySelectorAll('button, a')]; if(!btns.length) return; td.dataset.nf26a = '1';
    const sec = btns.filter(b => /^(Edit|Remove|Receipt|Delete|Void)$/i.test(b.textContent.trim())); if(!sec.length) return;
    sec.forEach(b => b.classList.add('nf26-sec')); const tr = td.closest('tr'); tr.classList.add('nf26-tap');
    if(sec.length === btns.length){ const m = document.createElement('button'); m.type = 'button'; m.className = 'nf26-dots'; m.setAttribute('aria-label', 'More for this line'); m.textContent = '⋯'; td.appendChild(m); }
    tr.addEventListener('click', e => { if(e.target.closest('button:not(.nf26-dots), a, input, select')) return; const on = !tr.classList.contains('nf26-open'); tr.parentElement.querySelectorAll('.nf26-open').forEach(x => x.classList.remove('nf26-open')); tr.classList.toggle('nf26-open', on); });
  });
}
function nf26Fold(el, label, key){
  if(!el || el.dataset.nf26fold) return; el.dataset.nf26fold = '1'; el.classList.add('nf26-folded');
  const b = document.createElement('button'); b.type = 'button'; b.className = 'nf26-foldbtn'; b.innerHTML = `<span>${label}</span><i aria-hidden="true">›</i>`;
  b.onclick = () => { const open = el.classList.toggle('nf26-folded'); b.classList.toggle('open', !open); };
  el.parentElement.insertBefore(b, el);
}
function nf26PagesPass(page){
  if(!page) return; const pid = page.id.replace(/^page-/, '');
  try{ nf26SideSwitch(page); }catch(e){ console.warn('nf26 side', e); }
  try{ nf26RowActions(page); nf26Cap(page); }catch(e){ console.warn('nf26 cap', e); }
  if(nf26Phone()){
    if(pid === 'sales'){ const d = document.getElementById('nf18DrawerWrap'); if(d) nf26Fold(d, 'Cash drawer by person <small>who counted, short or over, this month</small>'); }
    if(pid === 'money'){ const r = document.getElementById('nf18ReportWrap'); if(r) nf26Fold(r, 'How the business is doing <small>sales, profit and best sellers</small>'); }
  }
  if(pid === 'issues'){ const t = document.getElementById('nf18Team'); if(t) nf26Fold(t, 'Team spending <small>orders above your agreed price, spending limits</small>'); }
  if(pid === 'profit'){
    const t = page.querySelector('table.bk-tbl'); 
    if(t){ t.querySelectorAll('thead th').forEach(th => { if(th.textContent.trim() === 'Margin') th.textContent = 'Profit per ₱100'; });
      t.querySelectorAll('td[data-label="Margin"]').forEach(td => { td.dataset.label = 'Profit per ₱100'; const m = td.textContent.trim().match(/^(-?\d+(?:\.\d+)?)%$/); if(m && !td.children.length) td.textContent = (Number(m[1]) < 0 ? '−₱' : '₱') + Math.abs(Math.round(Number(m[1]))); });
      if(!t.dataset.nf26e){ t.dataset.nf26e = '1'; t.classList.add('nf26-ro'); const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-outline nf26-editp'; b.textContent = 'Edit prices';
        b.onclick = () => { const ro = t.classList.toggle('nf26-ro'); b.textContent = ro ? 'Edit prices' : 'Done editing'; t.querySelectorAll('input.bk-num').forEach(i => { i.readOnly = ro; i.tabIndex = ro ? -1 : 0; }); };
        (t.closest('.nf-cardtable-wrap') || t).insertAdjacentElement('beforebegin', b); }
      const ro = t.classList.contains('nf26-ro'); t.querySelectorAll('input.bk-num').forEach(i => { if(i.readOnly !== ro){ i.readOnly = ro; i.tabIndex = ro ? -1 : 0; } }); }
  }
  if(pid === 'team'){ const w = document.getElementById('nf20TeamWho'); if(w && !w.dataset.nf26){ w.dataset.nf26 = '1'; w.textContent = 'Who sees what'; } }
  if(pid === 'discover' && nf25Real()){
    // until more shops join, the directory is mostly empty: say so and point to inviting
    const cards = page.querySelectorAll('.discover-card, .disc-card, .biz-card').length;
    if(cards < 5 && !page.querySelector('.nf26-empty')){ const c = document.createElement('section'); c.className = 'nf26-empty';
      c.innerHTML = `<span class="nf26-empty-ic" aria-hidden="true">${NF26_STAR_IC}</span><div><b>Nifti is new in your area</b><p>More shops show up here as they join. The fastest way to grow your list is to invite the customers and suppliers you already have. Your leads are in Follow-ups.</p><button type="button" class="btn btn-primary" onclick="nf26OpenStart('invite')">Invite customers and suppliers</button></div>`;
      const head = page.querySelector(':scope > .page-head'); page.insertBefore(c, head ? head.nextSibling : page.firstChild); }
  }
  if(pid === 'settings' && !document.getElementById('nf26WhoCard')){
    const first = page.querySelector('.settings-card:not(.owner-only)'); let own = true; try{ own = isPrivilegedUser(); }catch(e){}
    if(first && own){ const c = document.createElement('div'); c.className = 'settings-card no-acc'; c.id = 'nf26WhoCard';
      c.innerHTML = `<h2>Who sees what</h2><div class="sub">Pick the pages each role can open. A cashier doesn't need to see payroll.</div><button type="button" class="btn btn-outline" onclick="nf20OpenWho()">Choose pages for each role</button>`;
      first.parentElement.insertBefore(c, first); }
  }
  // BIR 2307s only matter once a customer withholds tax: the menu line shows from then on
  try{ if(nf25Real()){ const it = document.querySelector('.sidebar .nf19-nav .nav-item[data-page="taxforms"]');
      if(it){ const any = (purchaseOrders || []).some(po => JSON.stringify(po.invoice || {}).includes('"ewt')) || pid === 'taxforms'; if(it.classList.contains('nf26-none') === any) it.classList.toggle('nf26-none', !any); } } }catch(e){}
}
window.addEventListener('resize', () => { try{ const p = document.querySelector('#view-app .app-page.active'); if(p) nf26SideSwitch(p); }catch(e){} });
