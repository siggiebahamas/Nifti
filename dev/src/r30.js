/* ===== Round 30: Count the cash = four pills, the month, and the day you tap under it ===== */
// Over is yellow with black words, short is red with dark red words, matched is green with a check, everywhere.
const NF30C = {day: null};
function nf30Peso(n){ return '₱' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('en-US'); }
function nf30Pills(page){
  const tiles = page.querySelector('#bkCashBody .bk-tiles'); if(!tiles) return;
  const mo = APP_TODAY.slice(0, 7), by = typeof mhCounts === 'function' ? mhCounts() : {};
  const month = Object.values(by).filter(c => c.day.slice(0, 7) === mo), ok = month.filter(c => Math.abs(c.diff) < 0.5).length;
  const key = month.length + '|' + ok;
  if(tiles.dataset.nf30 === key) return; tiles.dataset.nf30 = key; tiles.classList.add('nf30-pills');
  tiles.querySelectorAll('.nf30-match').forEach(x => x.remove());
  tiles.querySelectorAll('.bk-tile').forEach(t => { const v = t.querySelector('.bk-tile-v'), s = t.querySelector('.bk-tile-s'); if(v && s && v.parentElement === t){ const row = document.createElement('span'); row.className = 'nf30-row'; t.insertBefore(row, v); row.appendChild(v); row.appendChild(s); }
    const l = (t.querySelector('.bk-tile-l') || {}).textContent || ''; if(/not counted/i.test(l)){ t.classList.add('nf30-gray'); const ss = t.querySelector('.bk-tile-s'); if(ss) ss.textContent = ss.textContent.replace(/^days with sales,\s*/i, ''); } });
  const m = document.createElement('div'); m.className = 'bk-tile nf30-match';
  m.innerHTML = `<span class="bk-tile-l">Days matched</span><span class="nf30-row"><span class="bk-tile-v">${ok}</span><span class="bk-tile-s">of ${month.length} counted</span></span>`;
  tiles.appendChild(m);
}
function nf30Status(diff){ return Math.abs(diff) < 0.5 ? {c: 'g', t: '✓ Matched'} : diff > 0 ? {c: 'y', t: 'Over +' + nf30Peso(diff)} : {c: 'r', t: 'Short −' + nf30Peso(diff)}; }
function nf30DayHtml(k){
  const by = mhCounts(), c = by[k], lab = typeof mhLabel === 'function' ? mhLabel(k) : k;
  if(!c){
    if(k === APP_TODAY) return `<div class="nf30-dh"><b>${lab} · today</b><span class="nf30-st n">Not counted yet</span></div><div id="nf30FormHost"></div>`;
    return `<div class="nf30-dh"><b>${lab}</b><span class="nf30-st n">Not counted</span></div><p class="nf30-none">Nobody counted the drawer this day.</p>`;
  }
  const ex = cashExpected(k), p = ex.parts, should = c.recs.reduce((a, r) => a + (Number(r.expected && r.expected.cash) || 0), 0) || ex.cash;
  const counted = c.recs.reduce((a, r) => a + (Number(r.counted && r.counted.cash) || 0), 0), st = nf30Status(c.diff);
  const outs = BK.expenses.filter(e => !e.deletedAt && e.date === k && e.paidFrom === 'cash' && !bkCat(e.category).transfer);
  const supp = (typeof bkSupplierPaymentsOn === 'function' ? bkSupplierPaymentsOn(k) : []).filter(r => bkMethodKey(r.method) === 'cash');
  const outTotal = outs.reduce((a, e) => a + (Number(e.amount) || 0), 0) + supp.reduce((a, r) => a + (Number(r.amount) || 0), 0) + (p.bank || 0);
  const other = Math.round((should - (p.fund + p.sales + p.collections + p.ownerIn - outTotal)) * 100) / 100;
  if(other > 0 && !p.sales){ p.sales = other; }
  const other2 = Math.round((should - (p.fund + p.sales + p.collections + p.ownerIn - outTotal)) * 100) / 100;
  const sub = (name, amt) => `<div class="nf30-sub"><span>${escapeHtml(name)}</span><span>${nf30Peso(amt)}</span></div>`;
  return `<div class="nf30-dh"><b>${lab} · ${escapeHtml(mhFull ? mhFull(c.by) : c.by)}</b><span class="nf30-st ${st.c}">${st.t}</span></div>
    <div class="nf30-tiles"><div><em>Counted by</em><b>${escapeHtml(mhFirst ? mhFirst(c.by) : c.by)}</b></div><div><em>Should be in drawer</em><b>${nf30Peso(should)}</b></div><div><em>Actually counted</em><b>${nf30Peso(counted)}</b></div>
      <div class="nf30-res ${st.c}"><em>${st.c === 'g' ? 'Result' : st.c === 'y' ? 'Over' : 'Short'}</em><b>${st.c === 'g' ? '✓ Matched' : (st.c === 'y' ? '+' : '−') + nf30Peso(c.diff)}</b></div></div>
    <div class="nf30-lines"><div><b>Change fund at opening</b><span>${nf30Peso(p.fund)}</span></div>
      <div class="pos"><b>+ Cash sales${p.n_sales ? ` (${p.n_sales})` : ''}</b><span>${nf30Peso(p.sales)}</span></div>
      ${p.collections ? `<div class="pos"><b>+ Cash collected from customers</b><span>${nf30Peso(p.collections)}</span></div>` : ''}
      ${p.ownerIn ? `<div class="pos"><b>+ Owner put in cash</b><span>${nf30Peso(p.ownerIn)}</span></div>` : ''}
      <div class="neg"><b>− Cash paid out</b><span>${nf30Peso(outTotal)}</span></div>
      ${outs.map(e => sub([e.category, e.note || e.vendor].filter(Boolean).join(' · '), e.amount)).join('')}${supp.map(r => sub('Paid a supplier' + (r.name ? ' · ' + r.name : ''), r.amount)).join('')}${p.bank ? sub('Cash taken to the bank', p.bank) : ''}
      ${!outTotal ? '<div class="nf30-sub"><span>Nothing paid out from the drawer</span><span></span></div>' : ''}
      ${Math.abs(other2) >= 1 ? `<div class="${other2 > 0 ? 'pos' : 'neg'}"><b>${other2 > 0 ? '+' : '−'} Other cash in or out</b><span>${nf30Peso(other2)}</span></div>` : ''}
      <div class="tot"><b>Should be in drawer</b><span>${nf30Peso(should)}</span></div><div class="cnt"><b>Counted</b><span>${nf30Peso(counted)}</span></div>
      <div class="tot ${st.c}"><b>Difference</b><span>${st.c === 'g' ? '₱0' : (c.diff > 0 ? '+' : '−') + nf30Peso(c.diff)}</span></div></div>
    <div class="nf30-more"><button type="button" class="nf26-link" onclick="nf30Full('${k}')">See every item sold that day ›</button></div>`;
}
function nf30Full(k){ MH.sheet = {type: 'day', k, tab: 'tally'}; mhRenderDay(); }
function nf30Drawer(page){
  const d = document.getElementById('mhDrawer'); if(!d) return; const cal = d.querySelector('.cal'); if(!cal) return;
  d.classList.add('nf30-drawer');
  if(!NF30C.day){ const by = mhCounts(); NF30C.day = by[APP_TODAY] ? APP_TODAY : (Object.keys(by).filter(x => x <= APP_TODAY).sort().pop() || APP_TODAY); if(!by[APP_TODAY]) NF30C.day = APP_TODAY; }
  cal.querySelectorAll('.day').forEach(x => x.classList.remove('nf30-sel'));
  const dn = NF30C.day.slice(8).replace(/^0/, '');
  const sel = [...cal.querySelectorAll('.day')].find(x => { const t = (x.querySelector('.dn') || {}).textContent || ''; return t.trim().split(/\s/)[0] === dn; }); if(sel) sel.classList.add('nf30-sel');
  // tapping a day opens it here instead of a popup; today opens here too
  cal.querySelectorAll('button.day').forEach(b => { if(b.dataset.nf30) return; b.dataset.nf30 = '1'; const t = ((b.querySelector('.dn') || {}).textContent || '').trim().split(/\s/)[0];
    const [y, m] = [MH.cal.y, MH.cal.m]; const k = y + '-' + String(m).padStart(2, '0') + '-' + String(t).padStart(2, '0');
    if(b.classList.contains('future')) return; b.onclick = e => { e.preventDefault(); NF30C.day = k; nf30Drawer(page); }; });
  let box = d.querySelector('#nf30Day');
  if(!box){ box = document.createElement('div'); box.id = 'nf30Day'; box.className = 'nf30-day'; }
  if(box.previousElementSibling !== cal) cal.insertAdjacentElement('afterend', box);
  const key = NF30C.day + '|' + JSON.stringify(mhCounts()[NF30C.day] ? mhCounts()[NF30C.day].diff : 'x') + '|' + (BK.expenses || []).length;
  const grid = page.querySelector('#bkCashBody .cc-grid'), form0 = NF30C.form || page.querySelector('#bkCashBody .cc-form') || box.querySelector('.cc-form'); if(form0) NF30C.form = form0;
  if(box.dataset.k !== key){ if(NF30C.form && grid && box.contains(NF30C.form)){ grid.appendChild(NF30C.form); } box.dataset.k = key; box.innerHTML = nf30DayHtml(NF30C.day); }
  // today, not counted: the count form sits right here
  const host = box.querySelector('#nf30FormHost'), form = NF30C.form;
  if(form){ if(host && form.parentElement !== host) host.appendChild(form); form.hidden = !host; }
}
(function(){
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); if(!page || page.id !== 'page-sales') return; try{ nf30Pills(page); nf30Drawer(page); }catch(e){ console.warn('nf30', e); } };
  window.nf26AfterPass = nf26AfterPass;
  const sv = window.renderCashCountPage;
  if(typeof sv === 'function' && !sv._nf30){ const w = function(){ const r = sv.apply(this, arguments); const box = document.getElementById('nf30Day'); if(box) box.dataset.k = ''; return r; }; w._nf30 = true; window.renderCashCountPage = w; try{ renderCashCountPage = w; }catch(e){} }
})();
