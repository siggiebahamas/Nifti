/* ===== Round 8 =====
   1. One order sheet: who, what, where it is, and the ONE next step with its fields already open.
      Everything else (change, cancel, return, documents) sits under "More options".
   2. Both sides of the business on one page: selling to customers and buying from suppliers,
      no switching back and forth.
   3. Small fixes: Paid samples in the demo, clearer profit editing. */

/* ---------- 1. the order sheet ---------- */
const NF_STAGE_NAMES = ['Ordered', 'Confirmed', 'Preparing', 'On the way', 'Delivered', 'Billed', 'Paid'];
function nfStageIdx(o){
  const paid = o.status === 'paid' || (o.invoice && o.invoice.status === 'paid');
  if(paid) return 6; if(o.invoice || o.status === 'invoiced') return 5;
  if(['delivered', 'partially_delivered'].includes(o.status)) return 4; if(['shipped', 'in_customs'].includes(o.status)) return 3;
  if(o.status === 'preparing') return 2; if(o.status === 'confirmed') return 1; return 0;
}
function nfNextStep(o, sell){
  const id = o.id, who = sell ? o.buyerName : o.supplierName;
  const q = s => `'${id}'` + (s ? `,'${s}'` : '');
  const amend = typeof pendingAmendment === 'function' && pendingAmendment(o);
  if(sell){
    if(amend) return {tone: 'y', title: `${who} wants to change this order`, text: 'Look at the change and say yes or no.', btns: [['Yes, accept the change', `respondAmendment(${q()}, true)`], ['No, keep it as is', `respondAmendment(${q()}, false)`, 1]]};
    if(o.rma && o.rma.status === 'open') return {tone: 'r', title: `${who} returned something`, text: 'Settle it with a credit or a replacement.', btns: [['Settle the return', `openResolveRmaForm(${q()})`]], inline: true};
    if(typeof poHasPaymentsAwaitingSupplier === 'function' && poHasPaymentsAwaitingSupplier(o)) return {tone: 'y', title: `${who} says they paid`, text: 'Check your bank or GCash, then confirm it here.', form: 'openMarkPaidForm'};
    switch(o.status){
      case 'sent': return {tone: 'y', title: 'Can you fill this order?', text: `${who} is waiting for your yes. Check the items and the delivery date below.`,
        btns: [['Yes, confirm the order', `confirmSupplierPO(${q()})`], ['Change price or quantity', `openCounterForm(${q()})`, 1, 1], ['Send only part', `openPartialConfirmForm(${q()})`, 1, 1], ['Ask for a deposit first', `openDepositRequestForm(${q()})`, 1, 1]]};
      case 'quote': return {tone: 'g', title: `Waiting for ${who} to confirm`, text: 'You sent this for their OK. Nifti reminds them for you. Nothing to do yet.', btns: [['Message ' + who, `nfMessage(${q()})`, 1]]};
      case 'countered': return {tone: 'y', title: 'They want a different price', text: 'Accept their price, or offer another one.', btns: [['Accept', `acceptCounter(${q('supplier')})`], ['Offer another price', `openNegotiateForm(${q('supplier')})`, 1, 1], ['Decline', `rejectCounter(${q('supplier')})`, 1]]};
      case 'confirmed': return {tone: 'y', title: 'Start preparing', text: 'Tap when you start packing or loading this order.', btns: [['Start preparing', `markSupplierPreparing(${q()})`]]};
      case 'preparing': return {tone: 'y', title: 'Ready to send it out?', text: 'Fill in how it is going out, then tap to mark it shipped.', form: 'openShipForm'};
      case 'shipped': return {tone: 'g', title: 'On the way', text: 'When it arrives, confirm the delivery here. A photo of the signed receipt helps.', form: 'openSupplierDeliveryConfirm'};
      case 'in_customs': return {tone: 'y', title: 'At customs', text: 'Update when it clears customs.', form: 'openCustomsForm'};
      case 'delivered': return {tone: 'y', title: 'Delivered. Send the bill', text: `One tap makes the invoice and sends it to ${who}.`, btns: [['Send the bill', `issueInvoice(${q()})`]]};
      case 'partially_delivered': return {tone: 'y', title: 'Part of it was delivered', text: 'Settle the short items, then bill.', btns: [['Settle it', `acknowledgePartialDelivery(${q()})`]]};
      case 'invoiced': return o.invoice && o.invoice.status !== 'paid' ? {tone: 'y', title: `Waiting for ${who}'s payment`, text: 'Record a payment when it comes in.', form: 'openMarkPaidForm'} : {tone: 'g', title: 'Done, paid in full', text: 'Nothing left to do.'};
      case 'paid': return {tone: 'g', title: 'Done, paid in full', text: 'Nothing left to do.', btns: [['Print the receipt', `generateReceipt(${q()})`, 1]]};
    }
  } else {
    if(amend) return {tone: 'g', title: `Waiting for ${who} to answer your change`, text: 'They will say yes or no. Nothing to do yet.'};
    switch(o.status){
      case 'draft': return {tone: 'y', title: 'Send this order', text: `Check the items, then send it to ${who}.`, btns: [['Send to ' + who, `openSendConfirmModal(${q()})`], ['Edit items', `editDraftPO(${q()})`, 1]]};
      case 'sent': return {tone: 'g', title: `Waiting for ${who} to confirm`, text: 'They will say yes, or offer a new price. Nothing to do yet.', btns: [['Message ' + who, `nfMessage(${q()})`, 1]]};
      case 'quote': return {tone: 'y', title: `${who} sent you a price`, text: 'Look at the items and prices. Say yes, or ask for changes.', more: true};
      case 'countered': return {tone: 'y', title: `${who} offered a new price`, text: 'Accept it, or offer your own price.', btns: [['Accept', `acceptCounter(${q('buyer')})`], ['Offer another price', `openNegotiateForm(${q('buyer')})`, 1, 1], ['Decline', `rejectCounter(${q('buyer')})`, 1]]};
      case 'confirmed': case 'preparing': return {tone: 'g', title: `Waiting for ${who} to ship`, text: 'They confirmed. You will see it here when it leaves their warehouse.'};
      case 'shipped': case 'in_customs': return o.deliveryConfirmation ? {tone: 'g', title: 'Received', text: 'Waiting for their bill.'} : {tone: 'y', title: 'Did it arrive?', text: 'When it arrives, check the items and confirm. Add a photo if anything is damaged.', form: 'openDeliveryConfirm'};
      case 'delivered': case 'partially_delivered': return {tone: 'g', title: `Waiting for ${who}'s bill`, text: 'Nothing to do until they bill you.'};
      case 'invoiced': return o.invoice && o.invoice.status !== 'paid' ? {tone: 'y', title: 'Pay this bill', text: 'Type what you paid and how. A photo of the receipt helps.', form: 'openMarkPaidForm'} : {tone: 'g', title: 'Done, paid in full', text: 'Nothing left to do.'};
      case 'paid': return {tone: 'g', title: 'Done, paid in full', text: 'Nothing left to do.', btns: [['Order again', `reorderFromPO(${q()})`, 1]]};
    }
  }
  return {tone: 'g', title: 'Nothing to do', text: ''};
}
function nfMessage(id){ const o = getPO(id); if(!o) return; const sell = sideOfPo(o) === 'supplier'; closeOrderDetailModal(); go('messages');
  setTimeout(() => { try{ selectConversation(sell ? o.buyerId : o.supplierId, sell ? 'supplier' : 'buyer'); }catch(e){} }, 350); }
function nfOrderSheetHtml(o, sell, legacy){
  const who = sell ? o.buyerName : o.supplierName, st = nfStageIdx(o), nx = nfNextStep(o, sell) || {};
  const items = o.lineItems || [], sub = items.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0), total = poTotal(o);
  const rd = o.requestedDeliveryDate ? stmtDate(o.requestedDeliveryDate) : 'not set';
  const btn = (b, i) => `<button type="button" class="btn ${b[2] ? 'btn-outline' : 'btn-primary'}${b[3] ? ' nf-inline-btn' : ''}" ${b[3] ? `data-nf-inline="${escapeHtml(b[1])}"` : `onclick="${b[1]}"`}>${escapeHtml(b[0])}</button>`;
  return `<div class="nfo" data-nf-who="${escapeHtml(who)}" data-nf-side="${sell ? 'cust' : 'sup'}">
    <div class="nfo-head"><span class="nf-av"></span><div class="nfo-h-m"><small>${escapeHtml(o.poNumber)} · ${sell ? 'Customer order' : 'Order to a supplier'}</small><h3>${escapeHtml(who)}</h3>
      <span>${bkPeso(total)} · ${sell ? 'deliver by' : 'arrives by'} ${escapeHtml(rd)}</span></div>${sell ? renderSupplierActionPill(o) : renderBuyerActionPill(o)}</div>
    <ol class="nfo-steps">${NF_STAGE_NAMES.map((n, i) => `<li class="${i < st ? 'done' : i === st ? 'now' : ''}"><i>${i < st ? '✓' : i + 1}</i><span>${n}</span></li>`).join('')}</ol>
    <section class="nfo-next t-${nx.tone || 'g'}"><h4>${escapeHtml(nx.title || '')}</h4>${nx.text ? `<p>${escapeHtml(nx.text)}</p>` : ''}
      <div class="nfo-slot" id="nfoSlot"></div>
      ${nx.btns ? `<div class="nfo-btns">${nx.btns.map(btn).join('')}</div>` : ''}
      ${nx.more ? '<div class="nfo-btns"><button type="button" class="btn btn-primary" onclick="nfOpenMore()">See the price and answer</button></div>' : ''}</section>
    <section class="nfo-items"><div class="nfo-sec">What's in this order</div>
      ${items.map(l => `<div class="nfo-li"><b>${escapeHtml(l.product)}</b><span>${Number(l.qty) || 0} × ${bkPeso(Number(l.unitPrice) || 0)}</span><strong>${bkPeso((Number(l.qty) || 0) * (Number(l.unitPrice) || 0))}</strong></div>`).join('')}
      ${Math.abs(total - sub) >= 1 ? `<div class="nfo-li sub"><span>Items</span><span></span><strong>${bkPeso(sub)}</strong></div><div class="nfo-li sub"><span>VAT</span><span></span><strong>${bkPeso(total - sub)}</strong></div>` : ''}
      <div class="nfo-li tot"><b>Total</b><span></span><strong>${bkPeso(total)}</strong></div>
      ${o.deliveryAddress ? `<div class="nfo-addr">Deliver to: ${escapeHtml(o.deliveryAddress)}</div>` : ''}</section>
    <div class="nfo-quick"><button type="button" class="btn btn-outline" onclick="nfMessage('${o.id}')">Message ${escapeHtml(who)}</button></div>
    <details class="nfo-more" id="nfoMore"><summary>More options <small>change, cancel, return, documents, history</small></summary><div class="nfo-legacy" id="nfoLegacy">${legacy}</div></details></div>`;
}
function nfOpenMore(){ const d = document.getElementById('nfoMore'); if(d){ d.open = true; d.scrollIntoView({behavior: 'smooth', block: 'start'}); } }
// run one of the app's own form openers, and bring the form it opens up into the next-step card
function nfRunInline(js){
  const legacy = document.getElementById('nfoLegacy'), slot = document.getElementById('nfoSlot'); if(!legacy || !slot) return;
  const before = new Map(); legacy.querySelectorAll('[id]').forEach(e => before.set(e, e.innerHTML.trim().length));
  try{ (0, eval)(js); }catch(e){ console.warn(e); }
  const oid = currentModalOrderId || '';
  const opened = [...legacy.querySelectorAll('[id]')].filter(e => (before.get(e) || 0) === 0 && e.innerHTML.trim().length > 20);
  const moved = opened.find(e => oid && e.id.endsWith('_' + oid)) || opened.find(e => oid && e.id.includes(oid)) || opened[0];
  if(moved){ slot.innerHTML = ''; slot.appendChild(moved); nfEnhanceForm(slot); setTimeout(() => { const f = slot.querySelector('input:not([type=hidden]):not([type=file]), select, textarea'); if(f && window.innerWidth > 760) f.focus({preventScroll: true}); }, 50); }
}
function nfRenderOrderSheet(o, sell){
  const body = document.getElementById('orderDetailModalBody'); if(!body) return;
  const legacy = sell ? renderSupplierPoDetail(o) : renderBuyerPoDetail(o);
  body.innerHTML = nfOrderSheetHtml(o, sell, legacy);
  document.getElementById('orderDetailModal').classList.add('nfo-modal');
  const nx = nfNextStep(o, sell) || {};
  if(nx.form) nfRunInline(`${nx.form}('${o.id}')`);
  body.querySelectorAll('[data-nf-inline]').forEach(b => b.addEventListener('click', () => nfRunInline(b.dataset.nfInline)));
}
// dropdowns with a few choices become tap buttons; every field is big and easy to hit
function nfEnhanceForm(root){
  root.querySelectorAll('select').forEach(sel => {
    if(sel.dataset.nfSeg || sel.multiple) return; const opts = [...sel.options].filter(op => op.value !== '' || op.text.trim());
    if(opts.length < 2 || opts.length > 5 || opts.some(op => op.text.length > 24)) return;
    sel.dataset.nfSeg = '1'; const seg = document.createElement('div'); seg.className = 'nf-seg';
    const draw = () => { seg.innerHTML = opts.map(op => `<button type="button" class="${op.value === sel.value ? 'on' : ''}" data-v="${escapeHtml(op.value)}">${escapeHtml(op.text)}</button>`).join(''); };
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; sel.value = b.dataset.v; sel.dispatchEvent(new Event('change', {bubbles: true})); sel.dispatchEvent(new Event('input', {bubbles: true})); draw(); });
    draw(); sel.classList.add('nf-seg-src'); sel.insertAdjacentElement('afterend', seg);
  });
}
(function(){
  const open0 = window.openOrderDetailModal, ref0 = window.refreshOrderModalIfOpen;
  if(typeof open0 !== 'function' || open0._nf8) return;
  window.openOrderDetailModal = function(id, isSupplierRole){
    const o = getPO(id); if(!o) return;
    currentModalOrderId = id; currentModalIsSupplier = !!isSupplierRole; currentAppRole = isSupplierRole ? 'supplier' : 'buyer';
    nfRenderOrderSheet(o, !!isSupplierRole);
    document.getElementById('orderDetailModal').classList.remove('hidden');
  };
  window.openOrderDetailModal._nf8 = true;
  window.refreshOrderModalIfOpen = function(id){
    if(currentModalOrderId !== id) return; const m = document.getElementById('orderDetailModal'); if(!m || m.classList.contains('hidden')) return;
    const o = getPO(id); if(o) nfRenderOrderSheet(o, currentModalIsSupplier);
  };
})();

/* ---------- 2. both sides of the business on one page ---------- */
const NF_SIDE_HEAD = {supplier: ['Selling to customers', 'What customers order and owe you'], buyer: ['Buying from suppliers', 'What you order and owe suppliers']};
function nfHalfHead(side, extra){ const h = NF_SIDE_HEAD[side]; return `<div class="nf-half-h"><i aria-hidden="true"></i><b>${h[0]}</b><small>${h[1]}</small>${extra || ''}</div>`; }
const NF_DUAL = {
  cheques: ['renderChequesPage', 'chequesContent', 'Check payments'], returns: ['renderReturnsPage', 'returnsContent', 'Returns & credits'],
  books: ['renderBooksPage', 'booksContent', 'Tax books'], taxforms: ['renderTaxFormsPage', 'taxFormsContent', 'BIR 2307s'],
  prices: ['renderPricesPage', 'pricesContent', 'Price list'], collections: ['renderCollectionsPage', 'collectionsContent', 'Money owed'],
};
const NF_DUAL_SUB = {collections: "Who owes you, and what you owe your suppliers, on one page.", prices: 'Your selling prices, and what your suppliers charge you.'};
function nfDualWrap(page){
  const [fn, el] = NF_DUAL[page], orig = window[fn]; if(typeof orig !== 'function' || orig._nfDual) return;
  const w = async function(){
    const host = document.getElementById(el); if(!host || window._nfDualIn) return orig.apply(this, arguments);
    window._nfDualIn = true; const keep = currentAppRole, parts = {};
    try{ for(const side of ['supplier', 'buyer']){ currentAppRole = side; host.innerHTML = ''; await orig.apply(this, arguments); parts[side] = [...host.childNodes]; } }
    catch(e){ console.warn('dual', page, e); }
    finally{ currentAppRole = keep; window._nfDualIn = false; }
    host.innerHTML = '';
    ['supplier', 'buyer'].forEach(side => { const sec = document.createElement('section'); sec.className = 'nf-half nf-half-' + side; sec.dataset.nfRole = side;
      sec.innerHTML = nfHalfHead(side); const b = document.createElement('div'); b.className = 'nf-half-b'; (parts[side] || []).forEach(n => b.appendChild(n)); sec.appendChild(b); host.appendChild(sec); });
    nfDualTitle(page);
  };
  w._nfDual = true; window[fn] = w;
}
function nfDualTitle(page){
  const pg = document.getElementById('page-' + page); if(!pg) return; const h1 = pg.querySelector(':scope > .page-head h1'), p = pg.querySelector(':scope > .page-head p');
  const t = NF_DUAL[page] && NF_DUAL[page][2]; if(h1 && t){ const badge = h1.querySelector('span'); h1.textContent = t + ' '; if(badge) h1.appendChild(badge); }
  if(p && NF_DUAL_SUB[page]) p.textContent = NF_DUAL_SUB[page];
}
// whichever half you tap, the app acts for that side
document.addEventListener('click', e => { const h = e.target.closest && e.target.closest('[data-nf-role]'); if(h && typeof currentAppRole !== 'undefined' && currentAppRole !== h.dataset.nfRole) currentAppRole = h.dataset.nfRole; }, true);
document.addEventListener('focusin', e => { const h = e.target.closest && e.target.closest('[data-nf-role]'); if(h && typeof currentAppRole !== 'undefined' && currentAppRole !== h.dataset.nfRole) currentAppRole = h.dataset.nfRole; }, true);

// Orders: customer orders and orders to suppliers, one under the other
function nfOrdersBoth(){
  const pg = document.getElementById('page-orders'); if(!pg) return;
  const sv = document.getElementById('supplierOrdersView'), bv = document.getElementById('buyerOrdersView'); if(!sv || !bv) return;
  if(!pg.querySelector(':scope > .nf-orders-head')){
    pg.insertAdjacentHTML('afterbegin', '<div class="page-head nf-orders-head"><div><h1>Orders</h1><p>Orders from your customers and orders you sent to suppliers. Tap one to see the next step.</p></div><button class="btn btn-primary" onclick="currentAppRole=\'buyer\'; startCreatePO()">+ New order to a supplier</button></div>');
    const s1 = document.createElement('section'); s1.className = 'nf-half nf-half-supplier'; s1.dataset.nfRole = 'supplier'; s1.innerHTML = nfHalfHead('supplier');
    const s2 = document.createElement('section'); s2.className = 'nf-half nf-half-buyer'; s2.dataset.nfRole = 'buyer'; s2.innerHTML = nfHalfHead('buyer');
    sv.parentNode.insertBefore(s1, sv); s1.appendChild(sv); bv.parentNode.insertBefore(s2, bv); s2.appendChild(bv);
    pg.insertBefore(s1, s2);
  }
  sv.classList.remove('hidden'); bv.classList.remove('hidden');
  ['supplierOrdersListWrap', 'buyerOrdersListWrap'].forEach(i => { const e = document.getElementById(i); if(e) e.classList.remove('hidden'); });
  ['supplierAgingReportView', 'buyerAgingReportView'].forEach(i => { const e = document.getElementById(i); if(e) e.classList.add('hidden'); });
  const keep = currentAppRole;
  try{ currentAppRole = 'supplier'; renderSupplierOrdersTable(); currentAppRole = 'buyer'; renderOrdersTable(); }catch(e){ console.warn(e); } finally{ currentAppRole = keep; }
}

// Customers & suppliers: two simple lists side by side
function nfPartners(){
  const pg = document.getElementById('page-suppliers'); if(!pg) return; pg.classList.add('nf-replaced');
  let host = document.getElementById('nfPartners'); if(!host){ host = document.createElement('div'); host.id = 'nfPartners'; pg.appendChild(host); }
  const card = (s, sell) => { let rel = null; try{ rel = computeCounterpartReliability(s.id, sell); }catch(e){}
    const score = rel && rel.status === 'ok' ? `<span class="nf-pill ${rel.tier === 'good' ? 'good' : rel.tier === 'mid' ? 'warn' : 'bad'}">${sell ? 'Pays on time' : 'Reliable'} ${rel.score}/100</span>` : '<span class="nf-pill plain">New</span>';
    return `<div class="pt-row nf-pt" data-nf-side="${sell ? 'cust' : 'sup'}"><span class="pt-av"></span><div class="nf-pt-m"><div class="pt-name">${escapeHtml(s.name)}</div><small>${escapeHtml(s.category || '')}${s.orders ? ' · ' + s.orders + ' orders' : ''}${s.lastOrder ? ' · last ' + escapeHtml(String(s.lastOrder)) : ''}</small></div>
      ${score}<div class="nf-pt-a">${s.isOutside ? `<button class="btn btn-outline btn-sm" onclick="currentAppRole='${sell ? 'supplier' : 'buyer'}'; resendInvite('${s.id}')">Invite to Nifti</button>` : `<button class="btn btn-outline btn-sm" onclick="nfChat('${s.id}', ${sell})">Message</button>`}
      <button class="btn btn-primary btn-sm" onclick="${sell ? `currentAppRole='supplier'; navigate('orders')` : `currentAppRole='buyer'; startCreatePO()`}">${sell ? 'Their orders' : 'New order'}</button></div></div>`; };
  host.innerHTML = `<div class="page-head"><h1>Customers & suppliers</h1><p>Everyone you sell to and buy from. Private to you.</p></div>
    <div class="nf-two-col">
      <section class="nf-half nf-half-supplier" data-nf-role="supplier">${nfHalfHead('supplier', `<button class="btn btn-outline btn-sm" onclick="currentAppRole='supplier'; navigate('invite')">+ Invite a customer</button>`)}<div class="nf-half-b">${buyersData.map(s => card(s, true)).join('') || '<div class="nf-empty">No customers yet.</div>'}</div></section>
      <section class="nf-half nf-half-buyer" data-nf-role="buyer">${nfHalfHead('buyer', `<button class="btn btn-outline btn-sm" onclick="currentAppRole='buyer'; navigate('invite')">+ Invite a supplier</button>`)}<div class="nf-half-b">${suppliersData.map(s => card(s, false)).join('') || '<div class="nf-empty">No suppliers yet.</div>'}</div></section></div>`;
}
function nfChat(id, sell){ go('messages'); setTimeout(() => { try{ selectConversation(id, sell ? 'supplier' : 'buyer'); }catch(e){} }, 350); }

(function(){
  try{ ['orders', 'suppliers', 'collections', 'prices', 'returns', 'cheques', 'books', 'taxforms'].forEach(p => { delete LENS_TABS[p]; }); }catch(e){}
  Object.keys(NF_DUAL).forEach(nfDualWrap);
  const nav = window.navigate; if(typeof nav !== 'function' || nav._nf8) return;
  const w = function(page){ const r = nav.apply(this, arguments);
    setTimeout(() => { try{
      document.querySelectorAll('#page-' + page + ' > .lens-tabs').forEach(b => b.remove());
      if(page === 'orders') nfOrdersBoth(); if(page === 'suppliers') nfPartners(); if(NF_DUAL[page]) nfDualTitle(page);
    }catch(e){ console.warn(e); } }, 0); return r; };
  w._nf8 = true; w._nf7 = true; window.navigate = w;
})();

/* ---------- 3. small fixes ---------- */
// demo: a paid sample on both sides of "Where every order is"
function nfDemoPaid(){
  if(!(typeof nfIsDemo === 'function' && nfIsDemo()) || window._nfPaidSeeded) return;
  const p12 = getPO('po12'), p3 = getPO('po3'); if(!p12 || !p3) return; window._nfPaidSeeded = true;
  if(p12.invoice){ p12.invoice.paidDate = addDaysIso(APP_TODAY, -2); }
  if(!p3.invoice){ p3.status = 'paid'; p3.invoice = {number: 'QPT-1182', issuedDate: addDaysIso(APP_TODAY, -9), dueDate: addDaysIso(APP_TODAY, 6), status: 'paid', paidDate: addDaysIso(APP_TODAY, -1), statedTotal: poTotal(p3), attachmentName: null,
    payments: [{id: 'nf-pay-q', method: 'gcash', amount: poTotal(p3), date: addDaysIso(APP_TODAY, -1), confirmStatus: 'confirmed', reference: 'GC 5521', submittedBy: 'buyer'}]}; }
}
(function(){ const f = window.nfDemoAll; if(typeof f !== 'function' || f._nf8) return; const w = function(){ f.apply(this, arguments); try{ nfDemoPaid(); }catch(e){} }; w._nf8 = true; window.nfDemoAll = w; })();
// profit: a clear "saved" after you change a cost or price
(function(){ const f = window.bkSetItemNumber; if(typeof f !== 'function' || f._nf8) return;
  const w = async function(name, field, val){ const has = inventoryData.some(i => i.name === name); const r = await f.apply(this, arguments); if(has) showToast(`Saved. ${name} ${field === 'unitCost' ? 'costs you' : 'sells for'} ${bkPeso(Number(String(val).replace(/,/g, '')) || 0)} now.`, 'success'); return r; };
  w._nf8 = true; window.bkSetItemNumber = w; })();
