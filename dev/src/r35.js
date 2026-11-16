/* ===== Round 35: faster daily entry (sales and expenses), quieter menu, AI reading off for launch ===== */

/* ---------- 1. Menu: Bank & deposits no longer pretends to be Getting paid (it was opening Checks, taxes & team) ---------- */
function nf35Menu(){
  const b = document.getElementById('nf26BankNav'); if(!b) return;
  if(b.dataset.page !== 'bank-deposits') b.dataset.page = 'bank-deposits';
  const onBank = document.getElementById('page-collections') && document.getElementById('page-collections').classList.contains('active') && typeof colTab !== 'undefined' && colTab === 'cash';
  if(b.classList.contains('active') !== !!onBank) b.classList.toggle('active', !!onBank);
}
(function(){
  // Checks, taxes & team (and Selling & delivery) start folded, once, even for people who opened them before
  try{ if(!localStorage.getItem('nifti-menu-fold-v35')){ const f = JSON.parse(localStorage.getItem('nifti-menu-fold') || '{}') || {}; f.more = true; f.sell = true; localStorage.setItem('nifti-menu-fold', JSON.stringify(f)); localStorage.setItem('nifti-menu-fold-v35', '1'); } }catch(e){}
})();

/* ---------- 2. Getting paid: the Promised box adds up exactly the promises shown on the customer rows ---------- */
function nf35Promised(){
  let rows = []; try{ rows = colRows(); }catch(e){}
  const by = {}; rows.forEach(r => { if(r.promise) by[r.id] = Math.min(Number(r.promise.amount) || 0, Number(r.total) || 0); });
  const ids = Object.keys(by); return {amt: ids.reduce((s, k) => s + by[k], 0), n: ids.length};
}

/* ---------- 3. A new sale in a few taps: best sellers, + / − buttons, exact cash and change, recent customers ---------- */
function nf35TopItems(){
  const n = {};
  (BK.sales || []).slice(0, 300).forEach(s => (s.lines || []).forEach(l => { if(l.product && !l.totalOnly) n[l.product] = (n[l.product] || 0) + 1; }));
  let list = Object.keys(n).sort((a, b) => n[b] - n[a]);
  (inventoryData || []).forEach(i => { if(list.length < 8 && !list.includes(i.name)) list.push(i.name); });
  return list.slice(0, 8);
}
function nf35RecentCustomers(){ const out = []; (BK.sales || []).forEach(s => { const c = s.customer; if(c && c !== 'Walk-in' && !out.includes(c)) out.push(c); }); return out.slice(0, 5); }
function nf35AddItem(name){
  const l = QS.lines.find(x => x.product === name);
  if(l){ l.qty = (Number(l.qty) || 0) + 1; }
  else { const empty = QS.lines.find(x => !String(x.product).trim()); const p = bkItemPrice(name); const row = {product: name, qty: 1, price: p ? String(p) : ''}; if(empty) Object.assign(empty, row); else QS.lines.push(row); }
  QS.mode = 'items'; qsRender();
}
function nf35Step(i, d){ const l = QS.lines[i]; if(!l) return; l.qty = Math.max(0, (Number(l.qty) || 0) + d); if(l.qty === 0 && QS.lines.length > 1) QS.lines.splice(i, 1); qsRender(); }
function nf35Cash(v){ QS.received = String(v); qsRender(); }
function nf35SaleExtras(){
  const m = document.getElementById('qsModal'); if(!m || typeof QS === 'undefined' || !QS) return;
  const box = m.querySelector('.sl-sheet, .sl-modal, .share-modal') || m;
  if(QS.mode === 'items' && !box.querySelector('.nf35-top')){
    const top = nf35TopItems(); const lines = box.querySelector('.qs-lines');
    if(top.length && lines){ const d = document.createElement('div'); d.className = 'nf35-top';
      d.innerHTML = `<div class="nf35-lbl">Tap to add · tap again for one more</div><div class="nf35-chips">${top.map(n => { const p = bkItemPrice(n), inCart = (QS.lines.find(l => l.product === n) || {}).qty; return `<button type="button" onclick="nf35AddItem(${JSON.stringify(n).replace(/"/g, '&quot;')})"${inCart ? ' class="on"' : ''}><b>${escapeHtml(n)}</b><span>${p ? bkPeso(p) : ''}${inCart ? ` · ×${inCart}` : ''}</span></button>`; }).join('')}</div>`;
      lines.parentElement.insertBefore(d, lines); }
  }
  box.querySelectorAll('.qs-line').forEach((row, i) => { const q = row.querySelector('.qs-qty'); if(!q || row.querySelector('.nf35-step')) return;
    const minus = document.createElement('button'); minus.type = 'button'; minus.className = 'nf35-step'; minus.textContent = '−'; minus.setAttribute('aria-label', 'One less'); minus.onclick = () => nf35Step(i, -1);
    const plus = document.createElement('button'); plus.type = 'button'; plus.className = 'nf35-step'; plus.textContent = '+'; plus.setAttribute('aria-label', 'One more'); plus.onclick = () => nf35Step(i, 1);
    q.parentElement.insertBefore(minus, q); q.after(plus); row.classList.add('nf35-line'); });
  const ch = box.querySelector('#qsChange');
  if(QS.paidWith === 'cash' && ch && !box.querySelector('.nf35-cash')){
    const t = qsTotal(); if(t > 0){ const bills = [Math.ceil(t)]; [100, 200, 500, 1000].forEach(b => { const v = Math.ceil(t / b) * b; if(v > t && !bills.includes(v) && bills.length < 4) bills.push(v); });
      const d = document.createElement('div'); d.className = 'nf35-cash'; d.innerHTML = `<span>They gave</span>${bills.map((v, i) => `<button type="button" onclick="nf35Cash(${v})">${i === 0 ? 'Exact ' : ''}${bkPeso(v)}</button>`).join('')}`;
      const row = ch.closest('.row-2') || ch.parentElement; row.after(d); }
  }
  const cust = box.querySelector('input[list="qsCust"]');
  if(cust && !box.querySelector('.nf35-cust')){ const rc = nf35RecentCustomers(); if(rc.length){ const d = document.createElement('div'); d.className = 'nf35-chips nf35-cust';
    d.innerHTML = ['Walk-in'].concat(rc).map(n => `<button type="button" class="${QS.customer === n ? 'on' : ''}" onclick="QS.customer=${JSON.stringify(n).replace(/"/g, '&quot;')}; qsRender()">${escapeHtml(n)}</button>`).join('');
    cust.after(d); } }
  const save = [...box.querySelectorAll('button')].find(b => /qsSave\(\)/.test(b.getAttribute('onclick') || ''));
  if(save && !box.querySelector('.nf35-again')){ const w = document.createElement('div'); w.className = 'nf35-saverow'; save.parentElement.insertBefore(w, save); w.appendChild(save);
    const again = document.createElement('button'); again.type = 'button'; again.className = 'btn btn-outline nf35-again'; again.textContent = 'Save & new sale'; again.onclick = () => { window._nf35Again = 'sale'; qsSave(); }; w.appendChild(again); }
}

/* ---------- 4. An expense in a few taps: repeat a recent one, most-used kinds first ---------- */
function nf35RecentExpenses(){
  const seen = {}, out = [];
  (BK.expenses || []).filter(e => !e.deletedAt).sort((a, b) => String(b.date).localeCompare(String(a.date))).forEach(e => { const k = e.category + '|' + (e.vendor || ''); if(seen[k] || out.length >= 6) return; seen[k] = 1; out.push(e); });
  return out;
}
function nf35UseExpense(id){ const e = (BK.expenses || []).find(x => x.id === id); if(!e) return;
  Object.assign(EXF, {category: e.category, vendor: e.vendor || '', staff: e.staff || '', paidFrom: e.paidFrom || 'cash', amount: String(e.amount), repeat: !!e.repeat}); exRender();
  setTimeout(() => { const a = document.getElementById('exAmt'); if(a){ a.focus(); a.select(); } }, 50); }
function nf35ExpExtras(){
  const m = document.getElementById('exModal'); if(!m || typeof EXF === 'undefined' || !EXF) return;
  const box = m.querySelector('.sl-sheet, .sl-modal, .share-modal') || m;
  if(!EXF.id && !EXF.cashMove && !box.querySelector('.nf35-rep')){
    const rec = nf35RecentExpenses(), amt = box.querySelector('#exAmt');
    if(rec.length && amt){ const d = document.createElement('div'); d.className = 'nf35-rep';
      d.innerHTML = `<div class="nf35-lbl">Same as before? Tap one, change the amount if needed</div><div class="nf35-chips">${rec.map(e => `<button type="button" onclick="nf35UseExpense('${e.id}')" class="${EXF.category === e.category && (EXF.vendor || '') === (e.vendor || '') ? 'on' : ''}"><b>${escapeHtml(e.category)}${e.vendor ? ' · ' + escapeHtml(e.vendor) : ''}</b><span>${bkPeso(e.amount)} last time</span></button>`).join('')}</div>`;
      const f = amt.closest('.field'); f.parentElement.insertBefore(d, f); }
  }
  // most-used kinds first; the rest behind "More"
  const grid = box.querySelector('.ex-cats');
  if(grid && !grid.dataset.nf35){ grid.dataset.nf35 = '1';
    const use = {}; (BK.expenses || []).forEach(e => { use[e.category] = (use[e.category] || 0) + 1; });
    const btns = [...grid.querySelectorAll('button')], key = b => ((b.getAttribute('onclick') || '').match(/EXF\.category='([^']+)'/) || [])[1] || '';
    btns.sort((a, b) => (use[key(b)] || 0) - (use[key(a)] || 0)).forEach(b => grid.appendChild(b));
    if(!window._nf35AllCats && btns.length > 9){ btns.forEach((b, i) => { if(i >= 8 && !b.classList.contains('on')) b.classList.add('nf35-hid'); });
      const more = document.createElement('button'); more.type = 'button'; more.className = 'nf35-more'; more.textContent = `More (${btns.length - 8})`; more.onclick = () => { window._nf35AllCats = true; exRender(); }; grid.appendChild(more); }
  }
  const save = [...box.querySelectorAll('button')].find(b => /exSave\(\)/.test(b.getAttribute('onclick') || ''));
  if(save && !EXF.id && !box.querySelector('.nf35-again')){ const w = document.createElement('div'); w.className = 'nf35-saverow'; save.parentElement.insertBefore(w, save); w.appendChild(save);
    const again = document.createElement('button'); again.type = 'button'; again.className = 'btn btn-outline nf35-again'; again.textContent = 'Save & add another'; again.onclick = () => { window._nf35Again = 'exp:' + (EXF.paidFrom || 'cash'); exSave(); }; w.appendChild(again); }
}

/* ---------- wiring ---------- */
(function(){
  const wrap = (name, after) => { const f = window[name]; if(typeof f !== 'function' || f._nf35) return; const w = function(){ const r = f.apply(this, arguments); try{ after(); }catch(e){ console.warn('nf35 ' + name, e); } return r; }; Object.keys(f).forEach(k => { w[k] = f[k]; }); w._nf35 = true; window[name] = w; };
  wrap('qsRender', nf35SaleExtras);
  wrap('exRender', nf35ExpExtras);
  const oe = window.openExpenseForm; if(typeof oe === 'function' && !oe._nf35){ const w = function(){ window._nf35AllCats = false; return oe.apply(this, arguments); }; w._nf35 = true; window.openExpenseForm = w; try{ openExpenseForm = w; }catch(e){} }
  // "Save & new": once the form closes after a good save, open a fresh one
  const again = (name, reopen) => { const f = window[name]; if(typeof f !== 'function' || f._nf35a) return; const w = async function(){ const r = await f.apply(this, arguments); const want = window._nf35Again; window._nf35Again = null;
      if(want && !document.getElementById(name === 'qsSave' ? 'qsModal' : 'exModal')) setTimeout(() => reopen(want), 250); return r; }; w._nf35a = true; window[name] = w; };
  again('qsSave', () => openQuickSale());
  again('exSave', want => { openExpenseForm(); try{ const pf = String(want).split(':')[1]; if(pf && typeof EXF !== 'undefined' && EXF){ EXF.paidFrom = pf; exRender(); } }catch(e){} });
  try{ qsRender = window.qsRender; exRender = window.exRender; qsSave = window.qsSave; exSave = window.exSave; }catch(e){ console.warn('nf35 bind', e); }
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ nf35Menu(); }catch(e){} };
  window.nf26AfterPass = nf26AfterPass;
})();
