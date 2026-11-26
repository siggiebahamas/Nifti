/* ===== Round 79 ===== */
function nf79E(s){ return escapeHtml(String(s == null ? "" : s)); }
function nf79P(n){ return typeof bkPeso === "function" ? bkPeso(n) : fmtPHP(n); }
function nf79Ic(d, s){ return `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`; }

/* ---------- 1. Getting paid: everything can be settled right here ---------- */
const NF79MI = {
  check: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 14h6M15 14h3M6 10h12"/>',
  bank: '<path d="M3 10h18M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18M12 3l9 5H3z"/>',
  gcash: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>', maya: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>', card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'
};
const NF79ML = {check: 'Check', bank: 'Bank transfer', gcash: 'GCash', maya: 'Maya', cash: 'Cash', card: 'Card'};
function nf79Method(m){ m = String(m || '').toLowerCase(); return {ic: NF79MI[m] || NF79MI.cash, l: NF79ML[m] || (m ? m.replace(/^./, c => c.toUpperCase()) : 'Payment')}; }
// payments to confirm: icon, who, how (one line), when (next line), amount in its own column, buttons under
nf78ConfRow = function(c){
  const who = c.po.buyerName || c.po.customerName || 'Customer', m = String(c.p.method || '').toLowerCase(), mi = nf79Method(m);
  const how = m === 'check' ? `${mi.l} #${c.p.reference || '—'}${c.p.bank ? ' · ' + c.p.bank : ''}` : `${mi.l}${c.p.bank && m === 'bank' ? ' · ' + c.p.bank : ''}${c.p.reference ? ' · ref ' + c.p.reference : ''}`;
  const when = [c.p.date ? bkDayLabel(String(c.p.date).slice(0, 10)) : '', c.po.poNumber ? 'Order ' + String(c.po.poNumber).replace(/^PO-\d{4}-/, '') : ''].filter(Boolean).join(' · ');
  const yes = m === 'check' ? 'Check cleared' : 'It came in', no = m === 'check' ? 'Bounced' : 'Not in yet';
  const k = `${c.po.id}|${c.kind}|${c.key}`.replace(/"/g, '');
  const why = (m === 'check' ? ['Not enough funds (DAIF)', 'Account closed', 'Signature or date problem'] : ['Not in my account yet', 'Wrong amount', "Can't find this payment"]);
  return `<div class="r nf79-cr" data-b="${nf79E(c.po.buyerId || who)}" data-k="${nf79E(k)}"><span class="mi" title="${nf79E(mi.l)}">${nf79Ic(mi.ic, 20)}</span>
    <div class="w"><b>${nf79E(who)}</b><small class="how">${nf79E(how)}</small></div>
    <em>${nf79P(c.p.amount)}</em>
    <div class="ft"><div class="bt"><button type="button" class="nf77-b p sm" onclick="confirmPaymentReceived('${c.po.id}','${c.kind}','${c.key}'); setTimeout(renderCollectionsPage, 60)">${nf79Ic('<path d="M20 6 9 17l-5-5"/>', 15)}${yes}</button><button type="button" class="nf77-b s sm" onclick="this.closest('.nf79-cr').classList.toggle('why')">${no}</button></div>${when ? `<small class="when">${nf79E(when)}</small>` : ''}</div>
    <div class="nf79-why"><span>What happened?</span>${why.map(w => `<button type="button" onclick="nf79Reject('${c.po.id}','${c.kind}','${c.key}', ${JSON.stringify(w).replace(/"/g, '&quot;')})">${nf79E(w)}</button>`).join('')}</div></div>`;
};
function nf79Reject(poId, kind, key, reason){
  if(typeof requirePermission === 'function' && !requirePermission('markInvoicePaid')) return;
  const po = getPO(poId); if(!po) return; const p = findPayment(po, kind, key); if(!p || !paymentNeedsSupplierAction(p)) return;
  snapshotPO(po); po._undoLabel = 'Payment marked not received.';
  p.confirmStatus = 'rejected'; p.rejectReason = stripMarkup(reason).slice(0, 200); p.rejectedAt = APP_TODAY; if(p.method === 'check') p.checkStatus = 'bounced';
  mirrorPaymentStatus(po, kind, p); settleInvoiceStatus(po);
  const label = p.method === 'check' ? 'Check bounced' : 'Payment not received';
  poLogHistory(po, 'supplier', `⚠ ${label} — ${paymentSummaryText(p)} — "${p.rejectReason}"`);
  try{ pushNotification(`⚠ ${label} — ${po.poNumber}`, 'var(--danger)', {type: 'order', poId: po.id}); }catch(e){}
  showToast(`${label}. ${po.buyerName} is told why, and it still counts as owed.`, 'success');
  afterPaymentChange(po); setTimeout(renderCollectionsPage, 60);
}
// record a payment for a customer (they paid by phone, cash at the counter, a deposit): inline, no popup
function nf79RpHtml(key, amount, opts){
  const o = opts || {}, methods = o.utang ? ['cash', 'gcash', 'maya', 'bank'] : ['cash', 'gcash', 'bank', 'check'];
  return `<div class="nf79-rp" data-rp="${nf79E(key)}" data-m="cash">
    <div class="rr"><label>How much?<span class="pe"><i>₱</i><input type="text" inputmode="decimal" value="${Math.round(Number(amount) * 100) / 100}" data-f="amt"></span></label>
      <div class="ms"><span>Paid with</span><div class="mc">${methods.map((m, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-m="${m}" onclick="nf79RpPick(this)">${nf79Ic(NF79MI[m], 15)}${NF79ML[m].replace('Bank transfer', 'Bank')}</button>`).join('')}</div></div></div>
    ${o.utang ? '' : `<input type="text" class="ref" data-f="ref" maxlength="64" placeholder="Reference or check number (optional)">`}
    <div class="ra"><button type="button" class="nf77-b p" onclick="${o.utang ? 'nf79UtSave' : 'nf79RpSave'}(this)">${nf79Ic('<path d="M20 6 9 17l-5-5"/>', 16)}Save payment</button><button type="button" class="nf77-b s" onclick="this.closest('.nf79-rp').classList.remove('open')">Cancel</button></div></div>`;
}
function nf79RpOpen(btn){ const host = btn.closest('.nf79-rph'); if(!host) return; const f = host.querySelector('.nf79-rp'); if(!f) return; const was = f.classList.contains('open'); document.querySelectorAll('.nf79-rp.open').forEach(x => x.classList.remove('open')); if(!was){ f.classList.add('open'); const i = f.querySelector('input[data-f="amt"]'); if(i){ i.focus(); i.select(); } } }
function nf79RpPick(b){ const f = b.closest('.nf79-rp'); f.querySelectorAll('.mc button').forEach(x => x.classList.toggle('on', x === b)); f.dataset.m = b.dataset.m; const r = f.querySelector('.ref'); if(r) r.placeholder = b.dataset.m === 'check' ? 'Check number (optional)' : b.dataset.m === 'cash' ? 'Note (optional)' : 'Reference number (optional)'; }
function nf79RpVals(f){ const amt = Math.round((Number(String((f.querySelector('input[data-f="amt"]') || {}).value || '').replace(/[,₱\s]/g, '')) || 0) * 100) / 100; return {amt, m: f.dataset.m || 'cash', ref: stripMarkup(String((f.querySelector('input[data-f="ref"]') || {}).value || '')).trim().slice(0, 64)}; }
function nf79RpSave(btn){
  if(typeof requirePermission === 'function' && !requirePermission('markInvoicePaid')) return;
  const f = btn.closest('.nf79-rp'), key = f.dataset.rp, v = nf79RpVals(f);
  if(!(v.amt > 0)){ showToast('Type how much they paid.', 'warn'); return; }
  // key = customer id (oldest bill first) or "po:<id>" (one bill)
  let invs = unpaidInvoicesFor('supplier'); invs = key.startsWith('po:') ? invs.filter(r => r.po.id === key.slice(3)) : invs.filter(r => r.po.buyerId === key);
  invs.sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')));
  let left = v.amt, n = 0;
  invs.forEach(r => { if(left <= 0.004) return; const room = Math.max(0, roundPeso(r.balance - (r.pending || 0))); const use = Math.min(left, room > 0 ? room : r.balance); if(use <= 0) return;
    const po = r.po; snapshotPO(po); po._undoLabel = 'Payment recorded.';
    const entry = {id: newRecordId(), method: v.m, amount: roundPeso(use), reference: v.ref || null, checkDate: v.m === 'check' ? APP_TODAY : null, date: APP_TODAY, proofUrl: null, proofName: null, submittedBy: 'supplier', recordedBy: typeof slMemberName === 'function' ? slMemberName() : null};
    if(v.m === 'check'){ entry.confirmStatus = 'pending'; entry.checkStatus = 'pending'; } else { entry.confirmStatus = 'confirmed'; entry.confirmedAt = APP_TODAY; }
    if(v.m !== 'cash' && !v.ref) entry.missing = ['ref'];
    paymentListFor(po, 'invoice').push(entry); settleInvoiceStatus(po);
    poLogHistory(po, 'supplier', `Payment received — ${paymentSummaryText(entry)}${v.m === 'check' ? ' — waiting to clear' : ''}`);
    afterPaymentChange(po); left = roundPeso(left - use); n++; });
  if(!n){ showToast('Nothing left to pay on this.', 'info'); return; }
  showToast(`Saved ${nf79P(v.amt - Math.max(0, left))}${left > 0.004 ? ` (${nf79P(left)} more than they owe was not recorded)` : ''}.`, 'success');
  setTimeout(renderCollectionsPage, 60);
}
// shop utang: mark it paid right here
async function nf79UtSave(btn){
  const f = btn.closest('.nf79-rp'), id = f.dataset.rp.replace(/^ut:/, ''), v = nf79RpVals(f), s = BK.sales.find(x => x.id === id); if(!s) return;
  if(s.pending){ showToast('This sale is still waiting to upload. Try again when the internet is back.'); return; }
  if(!(v.amt > 0)){ showToast('Type how much they paid.', 'warn'); return; }
  const payments = (s.payments || []).concat([{method: v.m, amount: Math.min(v.amt, bkSaleBalance(s) || v.amt), date: APP_TODAY, by: bkMe()}]);
  if(myBusiness){ const { error } = await sb.from('downstream_sales').update({payments}).eq('id', id); if(error){ showToast(error.message, 'error'); return; } }
  s.payments = payments; try{ bkSaveDemo(); }catch(e){} showToast('Utang payment saved.', 'success');
  try{ bkRefreshViews(); }catch(e){} setTimeout(renderCollectionsPage, 60);
}
// customer cards: + Record a payment, in the card
nf78CustCard = (function(base){ return function(g){
  let html = base.apply(this, arguments); const says = Math.min(g.pending || 0, g.total), left = Math.max(0, g.total - says);
  if(left <= 0) return html;
  const btn = `<button type="button" class="nf77-b s nf79-rpb" onclick="nf79RpOpen(this)">${nf79Ic('<path d="M12 5v14M5 12h14"/>', 16)}Record payment</button>`;
  html = html.replace(/<div class="acts">([\s\S]*?)<\/div><\/div>$/, (m0, a) => `<div class="acts">${a}${btn}</div>${nf79RpHtml(g.id, left)}</div>`);
  if(!/nf79-rpb/.test(html)) html = html.replace(/<\/div>$/, `<div class="acts">${btn}</div>${nf79RpHtml(g.id, left)}</div>`);
  return html.replace('class="nf77-cu nf78-cu', 'class="nf77-cu nf78-cu nf79-rph');
}; })(nf78CustCard);
window.nf78CustCard = nf78CustCard;
// owed to you: every line opens in place (record a payment / mark utang paid / open)
function nf79LineWrap(html, kind, id, amt, open){
  return `<div class="nf79-lw nf79-rph">${html.replace('<button type="button" class="ln', '<button type="button" aria-expanded="false" class="ln').replace(/onclick="[^"]*"/, `onclick="nf79LineToggle(this)"`)}<div class="nf79-la">${nf79RpHtml(kind === 'ut' ? 'ut:' + id : 'po:' + id, amt, {utang: kind === 'ut'})}<div class="nf79-lo"><button type="button" class="nf77-link" onclick="${open}">${kind === 'ut' ? 'Open the sale' : 'Open the order'}</button></div></div></div>`;
}
function nf79LineToggle(b){ const w = b.closest('.nf79-lw'); const was = w.classList.contains('open'); document.querySelectorAll('.nf79-lw.open').forEach(x => { x.classList.remove('open'); const bb = x.querySelector('.ln'); if(bb) bb.setAttribute('aria-expanded', 'false'); }); if(!was){ w.classList.add('open'); b.setAttribute('aria-expanded', 'true'); const f = w.querySelector('.nf79-rp'); if(f){ f.classList.add('open'); const i = f.querySelector('input[data-f="amt"]'); if(i) i.focus(); } } }
(function(){
  const base = nf76PaidTotals;
  nf76PaidTotals = function(){
    base.apply(this, arguments);
    const pg = document.querySelector('#page-collections.active'); if(!pg) return;
    const box = pg.querySelector('#nf76TotS .nf78-tot'); if(!box || box.dataset.nf79 === box.parentElement.dataset.k) return; box.dataset.nf79 = box.parentElement.dataset.k;
    try{
      const inv = unpaidInvoicesFor('supplier').slice().sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0) || String(a.due || '').localeCompare(String(b.due || '')));
      const ut = bkLiveSales().filter(s => bkSaleBalance(s) > 0);
      const groups = box.querySelectorAll(':scope > .g');
      const wrapAll = (g, items, kind) => { if(!g) return; g.querySelectorAll('.ls > .ln').forEach((ln, i) => { const it = items[i]; if(!it) return;
        const id = kind === 'ut' ? it.id : it.po.id, amt = kind === 'ut' ? bkSaleBalance(it) : Math.max(0, roundPeso(it.balance - (it.pending || 0))) || it.balance;
        const open = kind === 'ut' ? "go('sales')" : `openOrderDetailModal('${it.po.id}', true)`;
        const w = document.createElement('div'); w.innerHTML = nf79LineWrap(ln.outerHTML.replace('Open ›', 'Settle'), kind, id, amt, open); ln.replaceWith(w.firstElementChild);
      }); };
      wrapAll(groups[0], inv, 'po'); wrapAll(groups[1], ut, 'ut');
      // utang photos: a small camera mark you can tap
      if(groups[1]) groups[1].querySelectorAll('.nf79-lw').forEach((w, i) => { const s = ut[i]; if(s && s.photo){ const sm = w.querySelector('.ln .n'); if(sm && !sm.querySelector('.nf79-ph')) sm.insertAdjacentHTML('beforeend', `<span class="nf79-ph" role="button" tabindex="0" onclick="event.stopPropagation(); bkShowPhoto(${JSON.stringify(s.photo).replace(/"/g, '&quot;')})">${nf79Ic('<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3.5"/>', 13)}Photo</span>`); } });
    }catch(e){ console.warn('nf79 lines', e); }
  };
  window.nf76PaidTotals = nf76PaidTotals;
})();

// utang: an optional photo when the sale is saved (the person, an ID, a signed note)
function nf79UtangPhotoHtml(){
  if(typeof QS === 'undefined' || !QS) return '';
  return `<section class="nf79-uph"><div class="nf43-q">Photo <small class="nf44-opt">optional</small></div>${QS.photo ? `<div class="pv"><img src="${QS.photo}" alt=""><span>Photo added</span><button type="button" class="nf43-link" onclick="QS.photo=null; qsRender()">Remove</button></div>` : `<button type="button" class="nf77-b s" onclick="nfTakePhoto(d => { QS.photo = d; qsRender(); }, {title: 'Photo for this utang'})">${nf79Ic('<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3.5"/>', 16)}Add a photo</button><small class="hint">Of the person, their ID, or a signed note. Helps if there is a question later.</small>`}</section>`;
}

/* ---------- 2. BIR 2307: exact centavos, the base each tax comes from, and plain guide-only wording ---------- */
function nf79P2(n){ return '₱' + (Number(n) || 0).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
if(typeof nf78TaxForms === 'function'){
  const _tf = nf78TaxForms;
  const nf79TaxForms = async function(){
    await _tf.apply(this, arguments);
    try{
      const el = document.getElementById('taxFormsContent'); if(!el) return; const side = currentAppRole, sell = side === 'supplier';
      const rows = (taxFormsCache || []).filter(r => r.role === side), cur = NF75B.q[side] || 'all', list = cur === 'all' ? rows : rows.filter(r => r.quarter === cur);
      el.querySelectorAll('.nf78-bt tbody tr').forEach((tr, i) => { const r = list[i]; const td = tr.children[2]; if(!r || !td || td.dataset.nf79) return; td.dataset.nf79 = '1';
        const base = Number(r.base) || (r.lines || []).reduce((a, l) => a + (Number(l.base) || 0), 0), rate = base ? Math.round(Number(r.tax) / base * 1000) / 10 : null;
        td.innerHTML = `<b>${nf79P2(r.tax)}</b>${base ? `<small class="nf79-of">${rate}% of ${nf79P2(base)}</small>` : ''}`; });
      const big = el.querySelector('.nf78-bh .big > b'); if(big) big.textContent = nf79P2(rows.reduce((a, r) => a + Number(r.tax || 0), 0));
      const bh = el.querySelector('.nf78-bh'); if(bh && !el.querySelector('.nf79-guide')) bh.insertAdjacentHTML('afterend', `<div class="nf79-guide">${nf79Ic('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>', 18)}<span><b>A guide only. You don't have to use this page.</b> The amounts come from the tax you recorded on each payment (1% for goods, 2% for services, on the amount before VAT). Check them with your accountant or bookkeeper before you file. Nifti does not compute your taxes for BIR and is not responsible for what you file.</span></div>`);
      const bf = el.querySelector('.nf75-bf span'); if(bf) bf.innerHTML = `The official BIR Form 2307 is at <a href="https://www.bir.gov.ph" target="_blank" rel="noopener">bir.gov.ph</a> (BIR Forms). ${sell ? 'Your customer fills it in and signs it.' : 'You fill it in and sign it yourself.'} Nifti only keeps track and stores the copy you upload.`;
    }catch(e){ console.warn('nf79 2307', e); }
  };
  try{ window.renderTaxFormsPage = nf79TaxForms; if(typeof nfRewrap === 'function') nfRewrap('taxforms'); }catch(e){}
}

/* ---------- 3. Fewer popups: "Paid" on any utang row opens the settle form right under that row ---------- */
if(typeof bkPaySale === 'function'){
  const _bps = bkPaySale;
  bkPaySale = function(id){
    try{
      const ev = window.event, btn = ev && ev.target && ev.target.closest ? ev.target.closest('button, a') : null, row = btn && btn.closest('tr, .bk-row, .nf79-lw, li');
      const s = BK.sales.find(x => x.id === id); if(!row || !s) return _bps.apply(this, arguments);
      if(s.pending){ showToast('This sale is still waiting to upload. Try again when the internet is back.'); return; }
      const next = row.nextElementSibling;
      if(next && next.classList && next.classList.contains('nf79-inl')){ next.remove(); return; }
      document.querySelectorAll('.nf79-inl').forEach(x => x.remove());
      const form = `<div class="nf79-rp open">${nf79RpHtml('ut:' + id, bkSaleBalance(s), {utang: true}).replace(/^<div class="nf79-rp"[^>]*>/, '').replace(/<\/div>$/, '')}</div>`;
      const html = nf79RpHtml('ut:' + id, bkSaleBalance(s), {utang: true}).replace('class="nf79-rp"', 'class="nf79-rp open"');
      if(row.tagName === 'TR'){ const cols = row.children.length || 1; row.insertAdjacentHTML('afterend', `<tr class="nf79-inl"><td colspan="${cols}">${html}</td></tr>`); }
      else row.insertAdjacentHTML('afterend', `<div class="nf79-inl">${html}</div>`);
      const i = row.nextElementSibling.querySelector('input[data-f="amt"]'); if(i){ i.focus(); i.select(); }
    }catch(e){ return _bps.apply(this, arguments); }
  };
  window.bkPaySale = bkPaySale;
}
