/* ===== Round 78 ===== */
function nf78E(s){ return escapeHtml(String(s == null ? "" : s)); }
function nf78P(n){ return typeof bkPeso === "function" ? bkPeso(n) : fmtPHP(n); }
function nf78Ic(d, s){ return `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`; }

/* ---------- 1. Home owner view: the margin at the same size as the profit, last month's margin for the same days, costs total on the right ---------- */
if(typeof nf75OwnerHtml === 'function'){
  const _o78 = nf75OwnerHtml;
  nf75OwnerHtml = function(){
    let html = _o78.apply(this, arguments);
    try{
      const m = bkMonth(APP_TODAY), p = bkPnl(m), sales = Number(p.sales) || 0, spend = (Number(p.cost) || 0) + (Number(p.expenses) || 0), margin = sales ? (sales - spend) / sales * 100 : null;
      let was = '';
      try{ const R = nf74SameRange(m), q = nf74PnlRange(R); if(q && q.sales){ const pm = (q.sales - q.cogs - q.opex) / q.sales * 100; was = `<div class="nf78-was"><span>${nf78E(R.label)}</span><b>${pm.toFixed(1)}%</b></div>`; } }catch(e){}
      const tone = margin == null ? 'n' : margin < 0 ? 'r' : 'g';
      const box = `<button type="button" class="nf74-ot nf75-mg nf78-mg t-${tone}" onclick="go('profit')"><span class="lb">You keep</span><b class="v">${margin == null ? '—' : margin.toFixed(1) + '%'}</b><span class="u">profit margin${margin == null ? ' · shows once you record a sale' : ''}</span>${was}<i class="go" aria-hidden="true">›</i></button>`;
      html = html.replace(/<button type="button" class="nf74-ot nf75-mg[\s\S]*?<i class="go" aria-hidden="true">›<\/i><\/button>/, box);
      { const mt = html.match(/<span class="lb">Biggest costs · (₱[\d,.]+) in all<\/span>/); if(mt){ html = html.replace(mt[0], '<span class="lb">Biggest costs</span>'); html = html.replace(/(<button type="button" class="nf74-ot t-b nf74-costs"[\s\S]*?<\/ol>)/, `$1<div class="nf79-ctot"><span class="n"></span><span class="k">Total</span><b>${mt[1]}</b><em>100%</em></div>`); } }
    }catch(e){}
    return html;
  };
  window.nf75OwnerHtml = nf75OwnerHtml;
  if(typeof nf72OwnerHtml === 'function'){ nf72OwnerHtml = nf75OwnerHtml; window.nf72OwnerHtml = nf75OwnerHtml; }
}

/* ---------- 2. Getting paid: compact payments to confirm, simpler customer cards, every peso owed shown under its total ---------- */
const NF78M = {check: ['Check', 'c'], bank: ['Bank', 'b'], gcash: ['GCash', 'g'], maya: ['Maya', 'g'], cash: ['Cash', 'k']};
function nf78ConfRow(c){
  const who = c.po.buyerName || c.po.customerName || 'Customer', m = String(c.p.method || '').toLowerCase(), mm = NF78M[m] || [c.p.method || 'Payment', 'k'];
  const ref = m === 'check' ? `Check #${c.p.reference || '—'}${c.p.bank ? ' · ' + c.p.bank : ''}` : m === 'bank' ? `Bank transfer${c.p.bank ? ' · ' + c.p.bank : ''}${c.p.reference ? ' · ref ' + c.p.reference : ''}` : m === 'gcash' || m === 'maya' ? `${mm[0]}${c.p.reference ? ' · ref ' + c.p.reference : ''}` : mm[0];
  const when = c.p.date ? bkDayLabel(String(c.p.date).slice(0, 10)) : '';
  const yes = m === 'check' ? 'Check cleared' : 'It came in', no = m === 'check' ? 'Bounced' : 'Not in yet';
  return `<div class="r" data-b="${nf78E(c.po.buyerId || who)}"><span class="mt t-${mm[1]}">${nf78E(mm[0])}</span>
    <div class="w"><b>${nf78E(who)}</b><small>${nf78E(ref)}${when ? ' · ' + nf78E(when) : ''}${c.po.poNumber ? ' · Order ' + nf78E(String(c.po.poNumber).replace(/^PO-\d{4}-/, '')) : ''}</small></div>
    <em>${nf78P(c.p.amount)}</em>
    <div class="bt"><button type="button" class="nf77-b p sm" onclick="confirmPaymentReceived('${c.po.id}','${c.kind}','${c.key}'); setTimeout(renderCollectionsPage, 60)">${nf78Ic('<path d="M20 6 9 17l-5-5"/>', 15)}${yes}</button><button type="button" class="nf77-b s sm" onclick="navigate('orders'); setTimeout(() => nfoOpen('${c.po.id}'), 80)">${no}</button></div></div>`;
}
function nf78CustCard(g){
  const says = Math.min(g.pending || 0, g.total), left = Math.max(0, g.total - says), late = g.overdue > 0, pr = g.promise && g.promise.status === 'open' ? g.promise : null;
  const lines = [], acts = [];
  if(says > 0) lines.push(`<div class="st b">${nf78Ic(NF77I.hand, 18)}<span>${says >= g.total ? 'Says they paid <b>all of it</b>' : `Says they paid <b>${nf78P(says)}</b> · ${nf78P(left)} still to pay`}</span></div>`);
  if(late && left > 0) lines.push(`<div class="st r">${nf78Ic(NF77I.alert, 18)}<span><b>${nf78P(Math.min(g.overdue, left))} late</b> · ${g.maxLate} day${g.maxLate === 1 ? '' : 's'}</span></div>`);
  if(pr) lines.push(`<div class="st g">${nf78Ic(NF77I.check, 18)}<span>Promised <b>${nf78P(pr.amount)}</b> by ${nf78E(nf77Day(pr.promised_date))}</span><button type="button" class="nf77-x" onclick="colCancelPromise('${pr.id}')">Cancel</button></div>`);
  if(!lines.length) lines.push(`<div class="st n">${nf78Ic(NF77I.clock, 18)}<span>${g.nextDue ? `Not due yet · due <b>${nf78E(nf77Day(g.nextDue))}</b>` : 'Not due yet'}</span></div>`);
  if(says > 0) acts.push(`<button type="button" class="nf77-b p" onclick="nf77GoConfirm('${g.id}')">${nf78Ic('<path d="M20 6 9 17l-5-5"/>', 16)}${says >= g.total ? 'Check and confirm' : 'Confirm ' + nf78P(says)}</button>`);
  if(left > 0 && (late || !(says > 0))) acts.push(nf77RemindBtn(g.id, late && !(says > 0) && !pr, 'Remind'));
  return `<div class="nf77-cu nf78-cu${late && left > 0 ? ' late' : says > 0 ? ' says' : ''}"><div class="top"><b class="nm">${nf78E(g.name)}</b><span class="amt">Owes <b>${nf78P(g.total)}</b></span></div>
    <div class="sts">${lines.join('')}</div>${acts.length ? `<div class="acts">${acts.join('')}</div>` : ''}</div>`;
}
nf77CollHtml = function(){
  const rows = colRows(), claims = nf43Claims(), on = typeof autoRemindersOn === 'function' && autoRemindersOn(), due = rows.filter(r => r.needsYou);
  const ctot = claims.reduce((a, c) => a + Number(c.p.amount || 0), 0);
  const conf = claims.length ? `<section class="nf77-conf nf78-conf" id="nf77Conf"><div class="h"><div><b>Payments to confirm</b><span>Check your bank, GCash or the check first, then tap.</span></div><em>${nf78P(ctot)}<small>${claims.length} payment${claims.length === 1 ? '' : 's'}</small></em></div>${claims.map(nf78ConfRow).join('')}</section>` : '';
  const sched = nf77SchedText();
  const rem = `<div class="nf77-rem">${nf78Ic(NF77I.bell, 18)}<span><b>Reminders ${on ? 'on' : 'off'}</b>${on && sched ? ' · ' + nf78E(sched) : on ? '' : ' · turn on to remind customers for you'}</span>${due.length ? `<button type="button" class="nf77-b p" onclick="nf33RQueue()">Send ${due.length} reminder${due.length === 1 ? '' : 's'}</button>` : ''}<button type="button" class="nf77-link" onclick="colTab='rules'; renderCollectionsPage()">Change</button></div>`;
  const list = `<section class="nf77-list"><div class="h"><b>Customers with a balance</b>${rows.length ? `<span>${rows.length} customer${rows.length === 1 ? '' : 's'}</span>` : ''}</div>${rows.length ? rows.map(nf78CustCard).join('') : '<div class="nf77-empty">Nobody owes you. New unpaid orders show up here.</div>'}</section>`;
  return conf + list + rem;
};
window.nf77CollHtml = nf77CollHtml;

// owed to you / you owe: the lines sit right under their total, amounts in one column; one line needs no list
function nf78Line(name, sub, chip, amt, onclick){ return `<button type="button" class="ln" onclick="${onclick}"><span class="n"><b>${name}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="c">${chip}</span><b class="a">${nf78P(amt)}</b></button>`; }
function nf78One(name, sub, chip, onclick){ return `<button type="button" class="ln o1" onclick="${onclick}"><span class="n"><b>${name}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="c">${chip}</span><span class="go">Open ›</span></button>`; }
function nf78Chip(r){ return r.daysOverdue > 0 ? `<em class="late">${r.daysOverdue} day${r.daysOverdue === 1 ? '' : 's'} late</em>` : r.due ? `<em>Due ${nf78E(nf77Day(r.due))}</em>` : ''; }
nf76PaidTotals = function(){
  const pg = document.querySelector('#page-collections.active'); if(!pg) return;
  const hs = pg.querySelector('.nf-half-supplier > .nf-half-b'), hb = pg.querySelector('.nf-half-buyer > .nf-half-b');
  const grp = (ic, title, lines, amt, one) => `<div class="g"><div class="gh"><span class="i">${nf78Ic(ic, 20)}</span><b>${title}</b><b class="a">${nf78P(amt)}</b></div>${lines.length > 1 ? `<div class="ls">${lines.join('')}</div>` : lines.length === 1 ? `<div class="ls">${one}</div>` : '<div class="one"><span class="none">None right now</span></div>'}</div>`;
  try{
    if(hs){
      const inv = unpaidInvoicesFor('supplier').slice().sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0) || String(a.due || '').localeCompare(String(b.due || ''))), invAmt = inv.reduce((a, r) => a + (r.balance || 0), 0);
      const ut = bkLiveSales().filter(s => bkSaleBalance(s) > 0), utAmt = ut.reduce((a, s) => a + bkSaleBalance(s), 0);
      const invL = inv.map(r => nf78Line(nf78E(r.po.buyerName || 'Customer'), nf78E((r.po.invoice && r.po.invoice.number) || r.po.poNumber || ''), nf78Chip(r), r.balance, `openOrderDetailModal('${r.po.id}', true)`));
      const utL = ut.map(s => nf78Line(nf78E(s.customer || 'Walk-in customer'), 'Walk-in sale · ' + nf78E(bkDayLabel(String(s.date).slice(0, 10))), '', bkSaleBalance(s), "go('sales')"));
      const one1 = inv[0] ? nf78One(nf78E(inv[0].po.buyerName || ''), nf78E((inv[0].po.invoice && inv[0].po.invoice.number) || inv[0].po.poNumber || ''), nf78Chip(inv[0]), `openOrderDetailModal('${inv[0].po.id}', true)`) : '';
      const one2 = ut[0] ? nf78One(nf78E(ut[0].customer || 'Walk-in customer'), 'Walk-in sale · ' + nf78E(bkDayLabel(String(ut[0].date).slice(0, 10))), '', "go('sales')") : '';
      const html = `<div class="nf77-tot nf78-tot"><div class="hd"><span>Owed to you</span><b>${nf78P(invAmt + utAmt)}</b></div>
        ${grp(NF77I.truck, 'Delivery orders not paid yet', invL, invAmt, one1)}${grp(NF77I.shop, 'Shop utang from Walk-in sales', utL, utAmt, one2)}</div>`;
      nf76Put(hs, 'nf76TotS', html);
    }
    if(hb){
      const rows = unpaidInvoicesFor('buyer').slice().sort((a, b) => String(a.due || '').localeCompare(String(b.due || ''))), amt = rows.reduce((a, r) => a + (r.balance || 0), 0);
      const L = rows.map(r => nf78Line(nf78E(r.po.supplierName || 'Supplier'), nf78E((r.po.invoice && r.po.invoice.number) || r.po.poNumber || ''), nf78Chip(r), r.balance, `openOrderDetailModal('${r.po.id}', false)`));
      const one = rows[0] ? nf78One(nf78E(rows[0].po.supplierName || ''), nf78E((rows[0].po.invoice && rows[0].po.invoice.number) || rows[0].po.poNumber || ''), nf78Chip(rows[0]), `openOrderDetailModal('${rows[0].po.id}', false)`) : '';
      nf76Put(hb, 'nf76TotB', `<div class="nf77-tot nf78-tot b"><div class="hd"><span>You owe suppliers</span><b>${nf78P(amt)}</b></div>${grp(NF77I.truck, 'Bills not paid yet', L, amt, one)}</div>`);
    }
  }catch(e){ console.warn('nf78 totals', e); }
};
window.nf76PaidTotals = nf76PaidTotals;

/* ---------- 3. Finish later: anything saved without its photo, reference or signature shows up until it is added ---------- */
function nf78AllPOs(){ try{ return (purchaseOrders || []).slice(); }catch(e){ return []; } }
function nf78Incomplete(){
  const out = [];
  nf78AllPOs().forEach(po => {
    ['invoice', 'deposit'].forEach(kind => { let list = []; try{ list = paymentListFor(po, kind) || []; }catch(e){} list.forEach((p, i) => { if(p && Array.isArray(p.missing) && p.missing.length && p.confirmStatus !== 'rejected') out.push({k: 'pay', po, p, kind, key: typeof paymentKey === 'function' ? paymentKey(p, i) : p.id, i}); }); });
    const dc = po.deliveryConfirmation; if(dc && Array.isArray(dc.missing) && dc.missing.length) out.push({k: 'dlv', po});
  });
  return out;
}
function nf78MissText(x){
  if(x.k === 'dlv') return 'Delivery proof (signature or photo)';
  return x.p.missing.map(m => m === 'ref' ? (x.p.method === 'check' ? 'check number' : 'reference number') : 'photo of the payment').join(' and ').replace(/^./, c => c.toUpperCase());
}
function nf78IncItemHtml(x){
  const who = x.k === 'dlv' ? (x.po.buyerName || x.po.supplierName || '') : (viewerSideForPo(x.po) === 'buyer' ? x.po.supplierName : x.po.buyerName) || '';
  const what = x.k === 'dlv' ? 'Delivered order ' + String(x.po.poNumber || '').replace(/^PO-\d{4}-/, '') : nf78P(x.p.amount) + ' ' + (PAYMENT_METHOD_LABELS && PAYMENT_METHOD_LABELS[x.p.method] || x.p.method || 'payment');
  return `<div class="nf78-inc-r"><span class="tag">Add later</span><div class="w"><b>${nf78E(what)} · ${nf78E(who)}</b><small>Missing: ${nf78E(nf78MissText(x))}</small></div><button type="button" class="nf77-b s sm" onclick="nf78Fix('${x.po.id}', '${x.k}', '${x.kind || ''}', ${x.i == null ? -1 : x.i})">Add now</button></div>`;
}
function nf78Fix(poId, k, kind, i){
  const po = getPO(poId); if(!po) return;
  const p = k === 'pay' ? (paymentListFor(po, kind) || [])[i] : null, dc = po.deliveryConfirmation || {};
  const miss = k === 'pay' ? (p && p.missing) || [] : dc.missing || [];
  window._nf78Fix = {poId, k, kind, i, photo: null};
  slModal('nf78Fix', `<div class="sl-sheet-h"><b>Finish this ${k === 'pay' ? 'payment' : 'delivery'}</b><button class="sl-x" onclick="slClose('nf78Fix')" aria-label="Close">✕</button></div>
    <div class="nf78-fix"><p>${k === 'pay' ? `${nf78P(p.amount)} by ${nf78E(PAYMENT_METHOD_LABELS[p.method] || p.method)} · order ${nf78E(String(po.poNumber || '').replace(/^PO-\d{4}-/, ''))}` : `Order ${nf78E(String(po.poNumber || '').replace(/^PO-\d{4}-/, ''))} · delivered ${nf78E(stmtDate(dc.confirmedDate || APP_TODAY))}`}</p>
      ${miss.includes('ref') ? `<label class="nf33r-f"><span>${p && p.method === 'check' ? 'Check number' : 'Reference number'}</span><input id="nf78FixRef" inputmode="numeric" placeholder="e.g. 5521 0087 113"></label>` : ''}
      ${miss.includes('proof') ? `<div class="nf78-fix-ph"><span>${k === 'pay' ? 'Photo or screenshot of the payment' : 'Photo of the signed receipt'}</span><div class="b"><button type="button" class="nf77-b s" onclick="nfTakePhoto(d => { window._nf78Fix.photo = d; nf78FixShow(); }, {title: 'Proof photo'})">${nf78Ic('<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3.5"/>', 16)}Take or pick a photo</button></div><div id="nf78FixPrev"></div></div>` : ''}
      <div class="nf33r-acts"><button type="button" class="btn btn-primary" onclick="nf78FixSave()">Save</button><button type="button" class="btn btn-outline" onclick="slClose('nf78Fix')">Later</button></div></div>`);
}
function nf78FixShow(){ const el = document.getElementById('nf78FixPrev'), d = window._nf78Fix && window._nf78Fix.photo; if(el) el.innerHTML = d ? `<img src="${d}" alt="" class="nf78-fix-img"><small>Photo ready</small>` : ''; }
function nf78FixSave(){
  const f = window._nf78Fix; if(!f) return; const po = getPO(f.poId); if(!po) return;
  const ref = (document.getElementById('nf78FixRef') || {}).value, photo = f.photo;
  if(!String(ref || '').trim() && !photo){ showToast('Add the number or a photo, or tap Later.', 'warn'); return; }
  snapshotPO(po);
  if(f.k === 'pay'){ const p = (paymentListFor(po, f.kind) || [])[f.i]; if(!p) return;
    if(String(ref || '').trim()){ p.reference = stripMarkup(String(ref)).trim().slice(0, 64); p.missing = (p.missing || []).filter(m => m !== 'ref'); }
    if(photo){ p.proofUrl = photo; p.proofName = 'proof.jpg'; p.missing = (p.missing || []).filter(m => m !== 'proof'); }
    if(!p.missing.length) delete p.missing; poLogHistory(po, viewerSideForPo(po), 'Payment details added later — ' + paymentSummaryText(p));
    try{ afterPaymentChange(po); }catch(e){ try{ scheduleNiftiSave(); }catch(e2){} }
  } else { const dc = po.deliveryConfirmation || (po.deliveryConfirmation = {});
    if(photo){ dc.proofUrl = photo; dc.proofName = 'proof.jpg'; delete dc.missing; poLogHistory(po, viewerSideForPo(po), 'Delivery proof added later'); }
    try{ if(typeof persistPO === 'function') persistPO(po); }catch(e){} try{ scheduleNiftiSave(); }catch(e){}
  }
  slClose('nf78Fix'); showToast('Saved. Thanks!', 'success');
  try{ const pg = (document.querySelector('.app-page.active') || {}).id; if(pg === 'page-collections') renderCollectionsPage(); else if(pg === 'page-dashboard' && typeof renderOneHome === 'function') renderOneHome(); }catch(e){}
  try{ if(typeof refreshOrderModalIfOpen === 'function') refreshOrderModalIfOpen(po.id); }catch(e){}
}
// on Getting paid: a short "finish later" list on top of each side
function nf78IncPaint(){
  const pg = document.querySelector('#page-collections.active'); if(!pg || (typeof colTab !== 'undefined' && colTab !== 'follow')) return;
  const all = nf78Incomplete();
  [['supplier', '.nf-half-supplier > .nf-half-b'], ['buyer', '.nf-half-buyer > .nf-half-b']].forEach(([side, sel]) => {
    const host = pg.querySelector(sel); if(!host) return;
    const mine = all.filter(x => x.k === 'pay' ? (side === 'buyer' ? x.po.buyerId === ME_BUYER : x.po.supplierId === ME_SUPPLIER) : x.po.supplierId === ME_SUPPLIER && side === 'supplier');
    let box = host.querySelector(':scope > .nf78-inc'); const html = mine.length ? `<div class="h"><b>Finish later</b><span>${mine.length} saved without a photo or number</span></div>${mine.map(nf78IncItemHtml).join('')}` : '';
    if(!html){ if(box) box.remove(); return; }
    if(!box){ box = document.createElement('section'); box.className = 'nf78-inc'; host.prepend(box); }
    if(box.dataset.k !== html){ box.dataset.k = html; box.innerHTML = html; }
    if(host.firstElementChild !== box) host.prepend(box);
  });
}
NF45_AFTER.push(page => { if(page && page.id === 'page-collections') try{ nf78IncPaint(); }catch(e){} });
// on Home "What to do"
if(typeof mhLanes === 'function'){ const _ml = mhLanes; mhLanes = function(){ const L = _ml.apply(this, arguments); try{ nf78Incomplete().slice(0, 4).forEach(x => L.y.unshift({h: 'Finish later: ' + nf78MissText(x).toLowerCase(), d: (x.k === 'dlv' ? 'Order ' : nf78P(x.p.amount) + ' · order ') + String(x.po.poNumber || '').replace(/^PO-\d{4}-/, ''), b: 'Add now', act: `nf78Fix('${x.po.id}', '${x.k}', '${x.kind || ''}', ${x.i == null ? -1 : x.i})`})); }catch(e){} return L; }; window.mhLanes = mhLanes; }
// in the order itself
if(typeof nffRender === 'function'){ const _nr = nffRender; nffRender = function(o){ const r = _nr.apply(this, arguments); try{ const body = document.getElementById('nffBody'); if(body && o){ const mine = nf78Incomplete().filter(x => x.po.id === o.id); let b = body.querySelector('.nf78-inc'); if(mine.length){ const html = mine.map(nf78IncItemHtml).join(''); if(!b){ b = document.createElement('section'); b.className = 'nf78-inc in'; body.prepend(b); } if(b.dataset.k !== html){ b.dataset.k = html; b.innerHTML = html; } } else if(b) b.remove(); } }catch(e){} return r; }; window.nffRender = nffRender; }

/* ---------- 4. Money overview: one profit table that fills the width, owner draws as a real minus, nothing extra ---------- */
function nf78OwnerName(){ try{ const m = getActiveTeamMembers()[0]; return String((m && m.name) || '').replace(/ \(You\)$/, ''); }catch(e){ return ''; } }
function nf78TookMoney(){
  const go = () => { try{ openExpenseForm(); EXF.category = 'Owner took money'; EXF.paidFrom = 'cash'; if(!EXF.vendor) EXF.vendor = nf78OwnerName(); exRender(); const h = document.querySelector('#exModal .sl-sheet-h b'); if(h) h.textContent = 'I took money out'; }catch(e){ console.warn(e); } };
  if(typeof BK !== 'undefined' && !BK.loaded){ bkLoad().then(go); return; } go();
}
nf77MoneyAfter = function(){
  const body = document.getElementById('bkMoneyBody'); if(!body) return;
  const two = body.querySelector('.bk-two'), card = body.querySelector('#bkPnlPrint'); if(!two || !card || card.dataset.nf78) return;
  const m = bkMonthSel || bkMonth(APP_TODAY); let p; try{ p = bkPnl(m); }catch(e){ return; }
  card.dataset.nf78 = '1';
  card.querySelectorAll('.pl-r.pl-sub > span:first-child').forEach(s => { const t = s.textContent.trim(); if(t === 'In the shop' || t === 'At the counter') s.textContent = 'Walk-in sales (shop)'; else if(t === 'Customer orders') s.textContent = 'Delivery order sales'; });
  // drop the side column, the cash line, the comparison under Profit and the footnote
  [...two.children].forEach(c => { if(c !== card) c.remove(); });
  two.classList.add('nf78-one');
  card.querySelectorAll('.nf77-cash, .nf74-cmp, .bk-note').forEach(x => { if(/owner took/i.test(x.textContent) || x.classList.contains('nf77-cash') || x.classList.contains('nf74-cmp')) x.remove(); });
  // two columns: what came in on the left, what it cost on the right, the result across the bottom
  const kids = [...card.children], head = kids.find(k => k.classList.contains('panel-head')), big = kids.find(k => k.classList.contains('big'));
  const expRow = kids.find(k => k.classList.contains('pl-r') && /Expenses/.test(k.textContent) && !k.classList.contains('pl-sub'));
  const left = document.createElement('div'), right = document.createElement('div'), cols = document.createElement('div');
  left.className = 'nf78-col'; right.className = 'nf78-col r'; cols.className = 'nf78-cols';
  let side = left;
  kids.forEach(k => { if(k === head || k === big || k.classList.contains('bk-note')) return; if(k === expRow) side = right; side.appendChild(k); });
  cols.append(left, right);
  if(head) head.after(cols); else card.prepend(cols);
  const net = Number(p.net) || 0, took = Number(p.drawings) || 0;
  const res = document.createElement('div'); res.className = 'nf78-res';
  res.innerHTML = `${big ? big.outerHTML : ''}
    ${took ? `<div class="pl-r nf78-took"><span>− Owner took out<small>Money the owner took for personal use. Not a cost of the business.</small></span><b>−${nf78P(took)}</b></div>
    <div class="pl-r nf78-left ${net - took < 0 ? 'neg' : ''}"><span>Left in the business</span><b>${net - took < 0 ? '−' : ''}${nf78P(Math.abs(net - took))}</b></div>` : ''}
    <div class="nf78-took-b"><button type="button" class="nf77-b s" onclick="nf78TookMoney()">${nf78Ic('<path d="M12 5v14M5 12h14"/>', 16)}I took money out</button><span>Took cash or sent yourself money? Note it here so the drawer and your profit stay right.</span></div>`;
  if(big) big.remove();
  cols.after(res);
};
window.nf77MoneyAfter = nf77MoneyAfter;

// the same button where the owner usually is: Expenses and the Walk-in cash count
function nf78TookButtons(page){
  if(!page) return;
  if(page.id === 'page-expenses'){ const add = [...page.querySelectorAll('button')].find(b => /^\+ ?Add expense$/i.test(b.textContent.trim()) && b.offsetParent);
    if(add && !page.querySelector('.nf78-tookbtn')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-outline nf78-tookbtn'; b.textContent = 'I took money out'; b.onclick = () => nf78TookMoney(); add.insertAdjacentElement('beforebegin', b); } }
  if(page.id === 'page-sales'){ const hd = [...page.querySelectorAll('h2, h3, b')].find(h => /^Count the cash$/.test(h.textContent.trim()));
    const host = hd && (hd.closest('.panel-head, .mh-h, header, div'));
    if(host && !page.querySelector('.nf78-tookbtn')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'nf77-link nf78-tookbtn'; b.textContent = 'Owner took cash'; b.onclick = () => nf78TookMoney(); host.appendChild(b); } }
}
NF45_AFTER.push(page => { try{ nf78TookButtons(page); }catch(e){} });

/* ---------- 5. BIR 2307: upload the form, mark it, undo; a Remind that really sends; no fill-in helper ---------- */
async function nf78TaxForms(){
  const el = document.getElementById('taxFormsContent'); if(!el) return;
  const head = document.getElementById('taxFormsBadge'); if(head) head.innerHTML = proBadge('bir2307');
  const sell = currentAppRole === 'supplier', side = currentAppRole;
  if(!hasFeature('bir2307')){ el.innerHTML = lockedPanelHtml('bir2307', sell ? 'See every 2307 your customers owe you and remind them in one tap.' : 'Never miss a 2307 you owe your suppliers.'); return; }
  let rows = [];
  if(myBusiness){ el.innerHTML = '<div class="panel-card">Loading…</div>'; const { data, error } = await sb.rpc('ewt_tracker'); if(error){ el.innerHTML = `<div class="panel-card">${escapeHtml(error.message)}</div>`; return; } rows = (data || []).filter(r => r.role === currentAppRole); }
  else { rows = buildLocal2307().filter(r => !r.example); if(!rows.length) rows = nfDemo2307(); }
  taxFormsCache = (taxFormsCache || []).filter(r => r.role && r.role !== side).concat(rows.map(r => Object.assign({role: side}, r)));
  const files = await nf75BFiles(), fside = sell ? 'collect' : 'give';
  const done = r => sell ? r.status === 'received' : (r.status === 'sent' || r.status === 'received');
  const quarters = [...new Set(rows.map(r => r.quarter))].sort().reverse(), cur = NF75B.q[side] || 'all';
  const list = cur === 'all' ? rows : rows.filter(r => r.quarter === cur);
  const tot = rows.reduce((a, r) => a + Number(r.tax || 0), 0), doneAmt = rows.filter(done).reduce((a, r) => a + Number(r.tax || 0), 0), pending = rows.filter(r => !done(r) && r.quarter_ended);
  const stat = r => done(r) ? `<span class="nf75-bs g">${sell ? 'Received' : 'Given'}</span>` : !r.quarter_ended ? '<span class="nf75-bs n">Not due yet</span>' : sell ? (r.status === 'sent' ? '<span class="nf75-bs y">They say they sent it</span>' : '<span class="nf75-bs r">Missing</span>') : `<span class="nf75-bs ${r.overdue ? 'r' : 'y'}">${r.overdue ? 'Late' : 'To give'}</span>`;
  const a = r => `'${r.counterparty_id}', '${r.quarter}'`, R = `currentAppRole='${side}'; `;
  const undo = r => `<button type="button" class="nf78-undo" onclick="${R}mark2307(${a(r)}, '${sell ? 'owed' : 'owed'}')">Undo</button>`;
  const remindCell = r => done(r) ? '<span class="nf78-dash">—</span>' : r.quarter_ended ? `<button type="button" class="btn btn-outline btn-sm" onclick="${R}nf78Remind2307(${a(r)})">Remind them</button>` : '<span class="nf78-dash">Not yet</span>';
  const gotCell = r => sell ? (done(r) ? `<span class="nf78-ok">✓ Got it</span>${undo(r)}` : `<button type="button" class="btn btn-primary btn-sm" onclick="${R}mark2307(${a(r)}, 'received')">I got it</button>`)
    : (done(r) ? `<span class="nf78-ok">✓ Given</span>${undo(r)}` : `<button type="button" class="btn btn-primary btn-sm" onclick="${R}mark2307(${a(r)}, 'sent')">I gave it</button>`);
  const proof = r => { const fs = files.filter(f => f.counterparty_id === String(r.counterparty_id) && f.quarter === r.quarter && f.side === fside);
    return `<div class="nf75-proof">${fs.map(f => `<span class="f"><button type="button" class="nf43-link" onclick="nf75BOpen('${f.id}')">${nf75Ic('<path d="M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>', 15)}${nf75E(String(f.file_name || 'File').slice(0, 22))}</button><button type="button" class="x" aria-label="Remove this file" onclick="nf75BDel('${f.id}')">✕</button></span>`).join('')}<label class="add"><input type="file" accept="application/pdf,image/*" hidden data-nf-cam="1" onchange="nf75BAttach(this, ${a(r)}, '${fside}')">${fs.length ? '+ Add' : '+ Upload'}</label></div>`; };
  const pct = tot ? Math.round(doneAmt / tot * 100) : 0;
  const hic = sell ? '<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z"/><path d="m9 11 2 2 4-4"/>' : '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 15l2 2 4-4"/>';
  el.innerHTML = `<div class="nf75-bh nf78-bh ${sell ? 'c' : 'g'}"><span class="ic">${nf75Ic(hic, 26)}</span>
      <div><b>${sell ? 'Collect from customers' : 'Give to suppliers'}</b><span>${sell ? 'Customers paid you 1% less and kept it for BIR. Each one owes you a signed 2307 for that. Ask for it, then upload it here.' : 'You paid suppliers 1% less and kept it for BIR. Give each one a signed 2307 by the 20th after the quarter, then upload a copy here.'}</span></div>
      <div class="big"><b>${nf75P(tot)}</b><small>${pct}% ${sell ? 'collected' : 'given'}${pending.length ? ` · <em>${pending.length} ${sell ? 'missing' : 'to give'}</em>` : ''}</small><i><u style="width:${pct}%"></u></i></div></div>
    <div class="nf75-qt" role="tablist" aria-label="Quarter">${[['all', 'All quarters', rows.filter(r => !done(r) && r.quarter_ended).length]].concat(quarters.map(q => [q, nf75BQLabel(q), rows.filter(r => r.quarter === q && !done(r) && r.quarter_ended).length])).map(([k, l, n]) => `<button type="button" role="tab" aria-selected="${cur === k}" class="${cur === k ? 'on' : ''}" onclick="NF75B.q['${side}']='${k}'; renderTaxFormsPage()"><b>${l}</b>${n ? `<em>${n} ${sell ? 'missing' : 'to give'}</em>` : '<small>all done</small>'}</button>`).join('')}</div>
    ${list.length ? `<div class="nf75-bt nf78-bt"><table data-nf-card="1"><thead><tr><th class="t">${sell ? 'Customer' : 'Supplier'}</th><th>Quarter</th><th class="n">Tax kept</th><th>Form due</th><th>Status</th><th class="p">The form</th>${sell ? '<th class="c">Ask for it</th><th class="c">Got the form?</th>' : '<th class="c">Gave the form?</th>'}</tr></thead><tbody>${list.map(r => `<tr class="${!done(r) && r.quarter_ended ? 'pend' : ''}"><td class="t"><b>${nf75E(r.counterparty)}</b><small>${r.count} payment${r.count > 1 ? 's' : ''}</small></td><td>${nf75E(nf75BQLabel(r.quarter))}</td><td class="n"><b>${nf75P(r.tax)}</b></td><td class="d">${nf75E(stmtDate(r.due))}</td><td>${stat(r)}</td><td class="p">${proof(r)}</td>${sell ? `<td class="c">${remindCell(r)}</td>` : ''}<td class="c">${gotCell(r)}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="nf75-empty">No withheld tax ${cur === 'all' ? 'yet' : 'in ' + nf75BQLabel(cur)}. When ${sell ? 'a customer pays you less because they kept 1% for BIR' : 'you keep 1% of a supplier payment for BIR'}, record it on the payment and it shows here.</div>`}
    <div class="nf75-bf"><button type="button" class="btn btn-outline" onclick="nf75BCsv('${side}')">${nf75Ic('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>', 18)}Download this list</button><span>The official BIR Form 2307 is at <a href="https://www.bir.gov.ph" target="_blank" rel="noopener">bir.gov.ph</a> (BIR Forms). ${sell ? 'Your customer fills it in and signs it.' : 'You fill it in and sign it yourself.'} Nifti only keeps track and stores the copy you upload. It does not fill in or file anything with BIR.</span></div>`;
}
try{ window.renderTaxFormsPage = nf78TaxForms; if(typeof nfRewrap === 'function') nfRewrap('taxforms'); }catch(e){}
// Remind them: opens the same reminder as Getting paid, on the app this customer uses, with a 2307 message
async function nf78Remind2307(cp, q){
  try{ await nf33RLoad(); }catch(e){}
  const r = (taxFormsCache || []).find(x => x.counterparty_id === cp && x.quarter === q && x.role === 'supplier') || (taxFormsCache || []).find(x => x.counterparty_id === cp && x.quarter === q); if(!r) return;
  const me = myBusiness ? myBusiness.name : ((typeof getMyTaxProfile === 'function' && getMyTaxProfile().businessName) || 'us');
  const text = `Hi ${r.counterparty}! This is ${me}. May we ask for your BIR Form 2307 for ${nf75BQLabel(q)}? You kept ${fmtPHP(r.tax)} (1%) from ${r.count} payment${r.count > 1 ? 's' : ''} to us. We need the signed form for our quarterly filing. A photo or PDF is fine. Salamat po!`;
  let pref = {}; try{ pref = nf33RPref(cp); }catch(e){ pref = {channel: 'viber'}; }
  NF33R.cur = {id: cp, g: {id: cp, name: r.counterparty, total: r.tax, overdue: 0, maxLate: 0, needs: []}, p: Object.assign({}, pref), text, always: true, sum: `BIR 2307 for <b>${nf78E(nf75BQLabel(q))}</b> · tax they kept <b>${nf78E(fmtPHP(r.tax))}</b>`, after2307: true};
  window._colPendingLog = []; NF33R.queue = null;
  nf33RSheet();
}
if(typeof nf33RSheet === 'function'){ const _s = nf33RSheet; nf33RSheet = function(){ const r = _s.apply(this, arguments); try{ const x = NF33R.cur; if(x && x.sum){ const s = document.querySelector('#nf33rSheet .nf33r-sum'); if(s) s.innerHTML = x.sum; const h = document.querySelector('#nf33rSheet .sl-sheet-h b'); if(h && x.after2307) h.textContent = 'Ask ' + x.g.name + ' for their 2307'; } }catch(e){} return r; }; window.nf33RSheet = nf33RSheet; }
if(typeof nf33RGo === 'function'){ const _g = nf33RGo; nf33RGo = async function(){ const x = NF33R.cur; if(x && x.after2307){ const r = await _g.apply(this, arguments); try{ if(document.querySelector('#page-taxforms.active')) renderTaxFormsPage(); }catch(e){} return r; } return _g.apply(this, arguments); }; window.nf33RGo = nf33RGo; }
// the old fill-in helper stays out of reach
try{ open2307Worksheet = function(){ showToast('Upload the signed BIR 2307 in the form column instead.', 'info'); }; window.open2307Worksheet = open2307Worksheet; }catch(e){}
