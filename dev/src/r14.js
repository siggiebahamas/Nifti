/* ===== Round 14 =====
   1. Waiting on a supplier: To confirm shows read receipts (sent, seen, they say yes);
      Preparing shows how long they usually take and the days until it arrives.
   2. Messages: Customers and Suppliers in two groups, unread first, each chat shows its order.
   3. New order popup, one question at a time, for selling (their PO) and buying (your order),
      with only the ways that are reliable: paste, a file, type it in, your order form, the usual. */

/* ---------- 1. waiting on a supplier ---------- */
if(typeof NFF_IC !== 'undefined'){ NFF_IC.plus = '<path d="M12 5v14M5 12h14"/>'; NFF_IC.clock = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'; }
function nfwTimeNow(){ return new Date().toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit'}); }
function nfwHist(o, rx, actor){ return (o.history || []).find(h => rx.test(h.action || '') && (!actor || h.actor === actor)); }
function nfwWhen(h){ if(!h) return ''; const d = h.date ? nffShort(h.date) : ''; const t = h.time && !/just now/i.test(h.time) ? h.time : ''; return [d, t].filter(Boolean).join(' · '); }
function nfwParseDT(h){ if(!h || !h.date) return null; const m = String(h.time || '').match(/(\d{1,2}):(\d{2})\s*([AP]M)/i); const d = new Date(h.date + 'T00:00:00');
  if(m){ let hr = Number(m[1]) % 12; if(/p/i.test(m[3])) hr += 12; d.setHours(hr, Number(m[2])); } else d.setHours(12); return d; }
// how long this supplier usually takes to say yes, from your past orders with them
function nfwUsualAnswer(supplierId){
  const hrs = purchaseOrders.filter(p => p.supplierId === supplierId && p.buyerId === ME_BUYER).map(p => {
    const a = nfwParseDT(nfwHist(p, /order sent|^sent/i)), b = nfwParseDT(nfwHist(p, /^confirmed|said yes|accepted/i, 'supplier'));
    return a && b && b > a ? (b - a) / 3600000 : null; }).filter(x => x != null);
  if(!hrs.length) return null;
  hrs.sort((x, y) => x - y); const med = hrs[Math.floor(hrs.length / 2)];
  return {hrs: med, n: hrs.length, text: med < 1.5 ? 'within an hour' : med < 20 ? `in about ${Math.round(med)} hours` : med < 36 ? 'in about a day' : `in about ${Math.round(med / 24)} days`};
}
function nfwOnTime(supplierId){
  const done = purchaseOrders.filter(p => p.supplierId === supplierId && p.buyerId === ME_BUYER && p.deliveryConfirmation && p.deliveryConfirmation.confirmedDate && p.requestedDeliveryDate);
  if(done.length < 2) return null;
  const ok = done.filter(p => p.deliveryConfirmation.confirmedDate <= p.requestedDeliveryDate).length;
  return Math.round(ok / done.length * 100);
}
function nfwReceiptsHtml(o){
  const first = nffFirst(o.supplierName), sent = nfwHist(o, /order sent|^sent/i), seen = nfwHist(o, /^seen the order/i, 'supplier');
  const sup = (suppliersData || []).find(s => s.id === o.supplierId) || {}, outside = !!sup.isOutside;
  const usual = nfwUsualAnswer(o.supplierId);
  const rows = [['ok', `Sent to ${first}`, nfwWhen(sent) || nffShort(o.createdDate)],
    seen ? ['seen', `Seen by ${first}`, nfwWhen(seen)] : ['wait', outside ? `Sent by link: waiting for ${first} to open it` : `In ${nffPoss(first)} Nifti inbox`, outside ? '' : 'not opened yet'],
    ['now', `${first} says yes`, ''], ['next', `${first} packs it`, '']];
  return `<div class="nfw-rc">${rows.map(([s, t, w]) => `<div class="nfw-rc-r ${s}"><span class="k">${s === 'ok' ? nffI('check') : s === 'seen' ? nffI('check') + nffI('check') : s === 'now' ? '<i></i>' : s === 'wait' ? nffI('check') : ''}</span><b>${nffE(t)}</b>${s === 'now' ? `<em>${nffE(nffPoss(first))} turn</em>` : `<time>${nffE(w)}</time>`}</div>`).join('')}</div>
    <div class="nfw-tip">${nffI('clock')}<span>${usual ? `${nffE(first)} usually answers ${usual.text}.` : `Most suppliers answer the same day.`} No answer yet? Send them a message.</span></div>`;
}
function nfwUsualHtml(o){
  const first = nffFirst(o.supplierName), eta = (o.shipping && o.shipping.eta) || o.requestedDeliveryDate;
  if(!eta) return `<div class="nfw-us"><div class="nfw-us-h"><span class="k">${nffI('box')}</span><div><b>${nffE(first)} is ${o.status === 'preparing' ? 'packing it' : 'getting it ready'}</b><span>No delivery day set yet. Ask them when it arrives.</span></div></div></div>`;
  const days = daysBetween(APP_TODAY, eta), on = nfwOnTime(o.supplierId);
  const cells = []; const start = new Date(APP_TODAY + 'T00:00:00'), end = new Date(String(eta).slice(0, 10) + 'T00:00:00');
  const total = Math.max(0, Math.round((end - start) / 86400000));
  const idx = total <= 6 ? [...Array(total + 1).keys()] : [0, 1, 2, -1, total - 1, total];
  idx.forEach(i => { if(i === -1){ cells.push('<div class="gap">…</div>'); return; } const d = new Date(start); d.setDate(d.getDate() + i);
    cells.push(`<div class="${i === 0 ? 'today' : ''}${i === total ? ' arr' : ''}"><small>${d.toLocaleDateString('en-US', {weekday: 'short'}).toUpperCase()}</small><b>${d.getDate()}</b></div>`); });
  return `<div class="nfw-us"><div class="nfw-us-h"><span class="k">${nffI('truck')}</span><div><b>Arrives ${nffE(nffDay(eta))}</b><span>${days < 0 ? `${-days} day${days === -1 ? '' : 's'} late. Ask ${nffE(first)} for an update.` : days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} to go`}${on != null && days >= 0 ? ` · on time ${on}% of the time` : ''}</span></div></div>
    <div class="nfw-days" style="grid-template-columns:repeat(${cells.length},minmax(0,1fr))">${cells.join('')}</div>
    <div class="nfw-tip">${nffI('bell')}<span>${days > 1 ? `If it hasn't left by ${nffE(nffDay(addDaysIso(String(eta).slice(0, 10), -1)))}, send ${nffE(first)} a message.` : `Expect it ${days <= 0 ? 'today' : 'tomorrow'}. You'll count it when it arrives.`}</span></div></div>`;
}
(function(){
  const spec0 = window.nffSpec, task0 = window.nffTaskHtml;
  if(typeof spec0 !== 'function' || spec0._nf14) return;
  window.nffSpec = function(o, sell){
    const sp = spec0.apply(this, arguments);
    if(!sell && sp.tasks && sp.tasks.length && sp.tasks[0].type === 'hand'){
      if(o.status === 'sent') sp.tasks = [{type: 'receipts'}];
      else if(['confirmed', 'preparing'].includes(o.status)) sp.tasks = [{type: 'usual'}];
    }
    return sp;
  };
  window.nffSpec._nf14 = true;
  window.nffTaskHtml = function(o, sell, t){
    if(t.type === 'receipts') return nfwReceiptsHtml(o);
    if(t.type === 'usual') return nfwUsualHtml(o);
    return task0.apply(this, arguments);
  };
  // the supplier opening a sent order is what "Seen" means: logged once, with the time
  const open0 = window.openOrderDetailModal;
  window.openOrderDetailModal = function(id, isSupplierRole){
    const r = open0.apply(this, arguments);
    try{ const o = getPO(id);
      if(o && isSupplierRole && o.status === 'sent' && o.supplierId === ME_SUPPLIER && !nfwHist(o, /^seen the order/i)){
        (o.history = o.history || []).push({date: APP_TODAY, time: nfwTimeNow(), actor: 'supplier', action: 'Seen the order'});
        if(typeof syncPoToSupabase === 'function') syncPoToSupabase(o);
      } }catch(e){}
    return r;
  };
  window.openOrderDetailModal._nf8 = true;
})();
// demo: one order waiting for a supplier's yes, so the read receipts have something to show
setTimeout(function(){
  try{
    if((typeof myBusiness !== 'undefined' && myBusiness) || purchaseOrders.some(p => p.id === 'po_w1')) return;
    purchaseOrders.push({id: 'po_w1', poNumber: 'PO-2026-0879', buyerId: ME_BUYER, buyerName: 'Dela Cruz Hardware', supplierId: 'northline', supplierName: 'Northline Welding Materials', type: 'local', status: 'sent', currency: 'PHP', taxRate: 0.12,
      lineItems: [{product: 'Welding Rods 3.2mm', qty: 40, unitPrice: 98}, {product: 'Welding Gas Cylinder', qty: 2, unitPrice: 1850}], createdDate: addDaysIso(APP_TODAY, -1), requestedDeliveryDate: addDaysIso(APP_TODAY, 4),
      deliveryAddress: 'Dela Cruz Hardware, Marikina City', notes: '', shipping: null, customs: null, invoice: null, counter: null, deliveryConfirmation: null, atRisk: false, riskNote: '',
      history: [{date: addDaysIso(APP_TODAY, -1), time: '3:10 PM', actor: 'buyer', action: 'Order sent'}, {date: addDaysIso(APP_TODAY, -1), time: '3:22 PM', actor: 'supplier', action: 'Seen the order'}]});
    if(typeof renderOrdersTable === 'function' && document.getElementById('orderRows')) renderOrdersTable();
  }catch(e){ console.warn(e); }
}, 0);

/* ---------- 2. Messages: two groups, unread first, with the order ---------- */
function nfwConvOrder(c, side){
  const sell = side === 'supplier';
  const pos = purchaseOrders.filter(p => sell ? (p.supplierId === ME_SUPPLIER && p.buyerId === c.id) : (p.buyerId === ME_BUYER && p.supplierId === c.id)).filter(p => p.status !== 'draft' || !sell);
  if(!pos.length) return null;
  const info = pos.map(p => { let sp = null; try{ sp = nffSpec(p, sell); }catch(e){} const step = sp ? sp.step : 0;
    return {p, sp, step, turn: sp ? sp.turn : 'them', open: step >= 0 && step < 5}; });
  const pick = info.find(x => x.open && x.turn === 'you') || info.filter(x => x.open).sort((a, b) => String(b.p.createdDate).localeCompare(String(a.p.createdDate)))[0]
    || info.sort((a, b) => String(b.p.createdDate).localeCompare(String(a.p.createdDate)))[0];
  if(!pick) return null;
  const n = String(pick.p.poNumber).replace(/^PO-\d{4}-/, 'PO-');
  const label = pick.step === -1 ? 'Cancelled' : pick.step === 5 ? 'Paid' : NFF_STEPS[pick.step];
  return {n, label, turn: pick.step >= 5 || pick.step === -1 ? 'done' : pick.turn, id: pick.p.id, sell, more: info.filter(x => x.open).length - (pick.open ? 1 : 0)};
}
renderConversationList = function(){
  const box = document.getElementById('convList'); if(!box){ updateMessagesBadge(); return; }
  const searchInput = document.getElementById('msgSearchInput');
  const term = (searchInput ? searchInput.value : '').toLowerCase();
  const all = allConversations();
  let list = all.filter(c => c.name.toLowerCase().includes(term));
  if(msgFilter === 'unread') list = list.filter(c => c.unread > 0);
  const order = c => (c.unread > 0 ? 1 : 0);
  const groups = [['supplier', 'Customers'], ['buyer', 'Suppliers']].filter(([s]) => !(msgFilter === 'customers' && s !== 'supplier') && !(msgFilter === 'suppliers' && s !== 'buyer'));
  const row = (c, side) => {
    const last = c.messages[c.messages.length - 1];
    const preview = last ? (last.attachment ? '📎 ' + last.attachment.name : last.text) : '';
    const oc = nfwConvOrder(c, side);
    return `<div class="conv-item nfw-ci${c.unread > 0 ? ' un' : ''} ${c.id === activeConvId && side === currentAppRole ? 'active' : ''}" onclick="selectConversation('${c.id}','${side}')">
      <div class="conv-avatar">${escapeHtml(c.initials || '?')}</div>
      <div class="conv-info">
        <div class="conv-name-row"><span class="conv-name">${escapeHtml(c.name)}</span><span class="conv-time">${last ? escapeHtml(String(last.time || '').split(',')[0]) : ''}</span></div>
        <div class="conv-preview">${escapeHtml(preview)}</div>
        ${oc ? `<span class="nfw-oc" title="${oc.turn === 'you' ? 'Your turn' : oc.turn === 'done' ? 'Done' : 'Their turn'}" onclick="event.stopPropagation(); openOrderDetailModal('${oc.id}', ${oc.sell})"><i class="${oc.turn}"></i>${escapeHtml(oc.n)} · ${escapeHtml(oc.label)}${oc.turn === 'you' ? ' · your turn' : ''}${oc.more > 0 ? ` <u>+${oc.more}</u>` : ''}</span>` : ''}
      </div>
      ${c.unread > 0 ? `<span class="conv-unread-badge">${c.unread}</span>` : ''}
    </div>`;
  };
  let html = '';
  groups.forEach(([side, title]) => {
    const g = list.filter(c => convSide(c) === side).sort((a, b) => order(b) - order(a) || convLastTs(b).localeCompare(convLastTs(a)));
    if(!g.length) return;
    const un = g.filter(c => c.unread > 0).length;
    html += `<div class="nfw-gh"><span>${title}</span><b>${g.length}</b>${un ? `<em>${un} new</em>` : ''}</div>` + g.map(c => row(c, side)).join('');
  });
  box.innerHTML = html || (all.length === 0
    ? `<div style="padding:32px 20px;text-align:center;color:var(--ink);"><div style="font-weight:800;font-size:15.5px;margin-bottom:6px;">No conversations yet</div>
        <div style="font-size:15px;">Chats with your customers and suppliers show up here, and stay here.</div></div>`
    : `<div style="padding:24px;text-align:center;color:var(--ink);font-size:15.5px;">No conversations match.</div>`);
  updateMessagesBadge();
  if(document.getElementById('oneHomeMsgs') && typeof renderOneHomeMessages === 'function') renderOneHomeMessages();
};

/* ---------- 3. new order: one question at a time ---------- */
let NFW = null;
const NFW_HOW = {
  sell: [['paste', 'msg', 'Paste their message', 'From Viber, Messenger or a text'], ['file', 'img', 'Upload their file', 'Excel, CSV or a PDF made on a computer'], ['type', 'edit', 'Type it in', 'Pick from your items. Best for photos and handwritten POs'], ['form', 'clip', 'Send them your order form', 'They pick from your items and prices. Nothing to type']],
  buy: [['paste', 'msg', 'Paste your Viber message', 'Write it the way you would message them'], ['type', 'edit', 'Pick from their items', 'Tap items and type how many'], ['file', 'img', 'Upload your list', 'Excel or CSV']]
};
function nfwOpen(side, prefill){
  const p = prefill || {};
  NFW = {side, step: 0, who: p.buyerId || p.supplierId || null, name: p.name || '', phone: p.phone || '', email: p.email || '', leadId: p.leadId || null, tentative: !!p.tentative, how: null,
    text: '', rows: [], ref: '', neededBy: '', address: '', vat: false, photo: null, search: '', reading: false, err: '', result: null, newWho: false, addQ: ''};
  if(!NFW.who && NFW.name && side === 'sell'){ const b = (buyersData || []).find(x => x.name.toLowerCase() === NFW.name.toLowerCase()); if(b) NFW.who = b.id; else NFW.newWho = true; }
  if(NFW.who) NFW.step = 1;
  if(typeof cpoLoadAliases === 'function') cpoLoadAliases();
  nfwRender();
}
window.openCustomerPoImport = function(prefill){ nfwOpen('sell', prefill); };
window.openPasteOrderModal = function(){ if(typeof requirePermission === 'function' && !requirePermission('sendOrder')) return; nfwOpen('buy'); };
function nfwClose(){ const m = document.getElementById('nfwModal'); if(m) m.remove(); document.removeEventListener('keydown', nfwEsc); NFW = null; }
function nfwEsc(e){ if(e.key === 'Escape' && !document.querySelector('.share-modal-backdrop')) nfwClose(); }
const nfwSell = () => NFW.side === 'sell';
function nfwPeople(){
  const list = nfwSell() ? (buyersData || []) : (suppliersData || []);
  const last = id => { const ps = purchaseOrders.filter(p => nfwSell() ? (p.supplierId === ME_SUPPLIER && p.buyerId === id) : (p.buyerId === ME_BUYER && p.supplierId === id)); return ps.map(p => p.createdDate || '').sort().pop() || ''; };
  return list.map(x => ({id: x.id, name: x.name, last: last(x.id), outside: !!x.isOutside})).sort((a, b) => b.last.localeCompare(a.last) || a.name.localeCompare(b.name));
}
function nfwWhoName(){ if(NFW.newWho || !NFW.who) return NFW.name || (nfwSell() ? 'this customer' : 'this supplier'); const x = nfwPeople().find(p => p.id === NFW.who); return x ? x.name : ''; }
// what this order can match against
function nfwCands(){
  const map = new Map(); const add = (product, price, unit) => { if(!product) return; const k = String(product).toLowerCase(); if(!map.has(k)) map.set(k, {product, price: Number(price) || 0, unit: unit || null}); else if(price && !map.get(k).price) map.get(k).price = Number(price); };
  if(nfwSell()){
    (typeof myCatalog !== 'undefined' ? myCatalog : []).forEach(c => add(c.product, c.price, c.unit));
    (typeof inventoryData !== 'undefined' ? inventoryData : []).forEach(i => add(i.name, i.sellPrice, i.unit));
    // names from past orders only when they are not the same item as one already in your list (Rebar 12mm = Steel Rebar 12mm)
    const prim = [...map.values()].map(v => ({w: nfwWords(v.product), z: nfwSizes(v.product).map(x => x.v + x.u).sort().join(',')}));
    getSupplierPOs().forEach(p => (p.lineItems || []).forEach(li => { const w = nfwWords(li.product), z = nfwSizes(li.product).map(x => x.v + x.u).sort().join(',');
      if(prim.some(q => q.z === z && w.length && w.every(x => q.w.includes(x)))) return; add(li.product, typeof bkItemPrice === 'function' ? bkItemPrice(li.product) : 0); }));
    map.forEach(v => { if(!v.price && typeof bkItemPrice === 'function') v.price = bkItemPrice(v.product) || 0; });
  } else if(NFW.who){
    knownProductsForSupplier(NFW.who).forEach(n => add(n, lookupKnownUnitPrice(NFW.who, n)));
    const sname = nfwWhoName().toLowerCase(); (typeof inventoryData !== 'undefined' ? inventoryData : []).filter(i => String(i.supplier || '').toLowerCase() === sname).forEach(i => add(i.name, i.unitCost || i.cost || 0, i.unit));
  }
  return [...map.values()];
}
function nfwAliasKey(){ return nfwSell() ? (NFW.who || '') : 'sup:' + NFW.who; }
function nfwAlias(text){
  if(typeof cpoAliases === 'undefined' || !cpoAliases) return null; const n = typeof cpoNorm === 'function' ? cpoNorm(text) : String(text).toLowerCase();
  const a = cpoAliases.find(x => x.alias_norm === n && x.customer_key === nfwAliasKey()) || (nfwSell() ? cpoAliases.find(x => x.alias_norm === n && !x.customer_key) : null); return a ? a.product : null;
}
function nfwRowsFrom(parsed){
  const cands = nfwCands();
  return parsed.rows.slice(0, 200).map(r => {
    const name = r.name || r.text || '', m = nfwMatch(name, cands, nfwAlias(name)), c = cands.find(x => x.product === m.product);
    const their = r.price != null ? Number(r.price) : (r.amount != null && r.qty ? Math.round(r.amount / r.qty * 100) / 100 : null);
    return {raw: r.raw || name, words: name, qty: r.qty != null && r.qty > 0 ? r.qty : null, unit: r.unit || (c && c.unit) || null, product: m.product, conf: m.conf, options: m.options || [], why: m.why || '',
      price: c && c.price ? c.price : (nfwSell() ? (their != null ? their : null) : (their != null ? their : null)), their, isNew: false};
  });
}
function nfwPrice(product){ const c = nfwCands().find(x => x.product === product); return c && c.price ? c.price : null; }
function nfwNeed(){
  if(NFW.step === 0){ if(NFW.newWho){ return String(NFW.name || '').trim().length < 2 ? (nfwSell() ? "Type the customer's name" : "Type the supplier's name") : ''; } return NFW.who ? '' : (nfwSell() ? 'Pick the customer' : 'Pick the supplier'); }
  if(NFW.step === 1) return NFW.how ? '' : (nfwSell() ? 'Pick how they sent it' : 'Pick how you want to order');
  if(NFW.step === 2){ if(NFW.how === 'paste') return NFW.text.trim().length < 3 ? (nfwSell() ? 'Paste their message' : 'Paste or type your message') : ''; if(NFW.how === 'file') return NFW.rows.length ? '' : 'Choose the file'; return ''; }
  if(NFW.step === 3){
    if(!NFW.rows.length) return 'Add at least one item';
    const u = NFW.rows.find(r => !r.product && !r.isNew); if(u) return `Pick what “${u.words || u.raw}” is`;
    const q = NFW.rows.find(r => !(Number(r.qty) > 0)); if(q) return `Type how many: ${q.product || q.words}`;
    if(nfwSell()){ const p = NFW.rows.find(r => !(Number(r.price) > 0)); if(p) return `Add a price for ${p.product || p.words}`; }
  }
  return '';
}
const nfwTotal = () => NFW.rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.price) || 0), 0) * (NFW.vat ? 1.12 : 1);
function nfwPrimary(){
  if(NFW.reading) return `<button type="button" class="nff-btn1 lock">${nffI('clock')}<span>Reading the file…</span></button>`;
  const need = nfwNeed();
  if(need) return `<button type="button" class="nff-btn1 lock" data-nfw="locked">${nffI('lock')}<span>${nffE(need)}</span></button>`;
  if(NFW.step === 1 && NFW.how === 'form') return `<button type="button" class="nff-btn1" data-nfw="form"><span>Send the order form</span>${nffI('arrow')}</button>`;
  if(NFW.step === 2 && NFW.how === 'paste') return `<button type="button" class="nff-btn1" data-nfw="read"><span>Read it</span>${nffI('arrow')}</button>`;
  if(NFW.step === 3){ const tot = nfwTotal(); return `<button type="button" class="nff-btn1" data-nfw="create"><span>${nfwSell() ? (NFW.tentative ? 'Send for their OK' : 'Create the order') : 'Make the order'}${tot ? ' · ' + bkPeso(tot) : ''}</span>${nffI('arrow')}</button>`; }
  return `<button type="button" class="nff-btn1" data-nfw="next"><span>Next</span>${nffI('arrow')}</button>`;
}
function nfwStepHtml(){
  const sell = nfwSell(), who = nfwWhoName();
  if(NFW.step === 0){
    const ppl = nfwPeople().filter(p => !NFW.search || p.name.toLowerCase().includes(NFW.search.toLowerCase()));
    return `<div class="nff-hero"><h2>${sell ? 'Whose order is this?' : 'Who are you ordering from?'}</h2><p>Tap one${ppl.length > 8 ? ', or search' : ''}.</p></div>
      ${nfwPeople().length > 8 ? `<input class="nff-in" data-nfw-in="search" value="${nffE(NFW.search)}" placeholder="Search ${sell ? 'customers' : 'suppliers'}" autocomplete="off">` : ''}
      <div class="nfw-who" data-t="who">${ppl.slice(0, 12).map(p => `<button type="button" class="nfw-wb${NFW.who === p.id && !NFW.newWho ? ' on' : ''}" data-nfw="who" data-v="${nffE(p.id)}"><span class="nff-av" style="background:${typeof nfIniColor === 'function' ? nfIniColor(p.name) : '#2563EB'};color:#fff">${nffE(nfInitials(p.name))}</span><span>${nffE(p.name)}</span></button>`).join('')}
        <button type="button" class="nfw-wb new${NFW.newWho ? ' on' : ''}" data-nfw="newwho"><span class="nff-av">${nffI('plus')}</span><span>New ${sell ? 'customer' : 'supplier'}</span></button></div>
      ${NFW.newWho ? `<div class="nfw-new"><div class="nff-task" data-t="name"><div class="nff-lbl"><span>${sell ? "Customer's name" : "Supplier's name"}</span></div><input class="nff-in" data-nfw-in="name" value="${nffE(NFW.name)}" placeholder="${sell ? 'e.g. Juan Hardware' : 'e.g. Northline Welding'}" maxlength="120"></div>
        <div class="nff-task"><div class="nff-lbl"><span>Mobile</span><small>Optional</small></div><input class="nff-in" data-nfw-in="phone" type="tel" value="${nffE(NFW.phone)}" placeholder="0917 123 4567" maxlength="20"></div></div>` : ''}`;
  }
  if(NFW.step === 1){
    const past = NFW.who && !NFW.newWho ? purchaseOrders.filter(p => sell ? (p.supplierId === ME_SUPPLIER && p.buyerId === NFW.who) : (p.buyerId === ME_BUYER && p.supplierId === NFW.who)).filter(p => !['draft', 'cancelled'].includes(p.status)).length : 0;
    const ways = NFW_HOW[NFW.side].slice(); if(past) ways.push(['usual', 'again', sell ? 'Send their usual order' : 'Order the usual again', sell ? 'Their last order, for them to check and confirm' : 'Your last order to them, ready to check']);
    return `<div class="nff-hero"><h2>${sell ? 'How did they send their order?' : 'How do you want to make your order?'}</h2><p>${nffE(who)}</p></div>
      <div class="nfw-how" data-t="how">${ways.map(([k, i, l, s]) => `<button type="button" class="nfw-hw${NFW.how === k ? ' on' : ''}" data-nfw="how" data-v="${k}">${nffI(i)}<span><b>${nffE(l)}</b><small>${nffE(s)}</small></span></button>`).join('')}</div>`;
  }
  if(NFW.step === 2){
    if(NFW.how === 'paste') return `<div class="nff-hero"><h2>${sell ? 'Paste their message' : 'Paste or type your message'}</h2><p>${sell ? 'Copy it from Viber or Messenger and paste it here.' : `The way you'd send it to ${nffE(nffFirst(who))} on Viber.`}</p></div>
      <div class="nff-task" data-t="text"><textarea class="nff-in nfw-ta" data-nfw-in="text" rows="7" placeholder="${sell ? 'e.g.\n50 bags cement\nrebar 12mm - 200 pcs\n10 rolls GI wire #16' : 'e.g.\n10 bags cement\nrebar 10mm x100\n5 rolls GI wire #16'}">${nffE(NFW.text)}</textarea>
      <div class="nff-hint">One item per line works best. Commas are fine too. Nifti checks each line against ${sell ? 'your items' : 'what you buy from them'}, and asks you about anything it isn't sure of.</div></div>`;
    if(NFW.how === 'file') return `<div class="nff-hero"><h2>${sell ? 'Upload their file' : 'Upload your list'}</h2><p>${sell ? 'Excel, CSV, or a PDF made on a computer.' : 'Excel or CSV, one item per row.'}</p></div>
      <div class="nff-task" data-t="file"><label class="nff-pbtn nfw-file">${nffI('img')}<span><b>${NFW.fileName ? nffE(NFW.fileName) : 'Choose the file'}</b><small>${NFW.fileName ? `${NFW.rows.length} item${NFW.rows.length === 1 ? '' : 's'} found · tap to choose another` : (sell ? 'A scanned or photographed PDF cannot be read: use Type it in for those.' : 'Columns like Item and Qty are read for you.')}</small></span><input type="file" accept="${sell ? '.pdf,.xlsx,.xls,.csv,.txt' : '.xlsx,.xls,.csv,.txt'}" hidden data-nfw-file="1"></label>
      ${NFW.err ? `<div class="nfw-err">${nffE(NFW.err)}</div>` : ''}</div>`;
    return '';
  }
  if(NFW.step === 3) return nfwCheckHtml();
  return '';
}
function nfwCheckHtml(){
  const sell = nfwSell(), who = nfwWhoName(), cands = nfwCands();
  const unsure = NFW.rows.filter(r => !r.product && !r.isNew).length;
  const rowsHtml = NFW.rows.map((r, i) => {
    const sure = r.product || r.isNew;
    const head = r.product ? `<b>${nffE(r.product)}</b>` : r.isNew ? `<b>${nffE(r.words)}</b> <span class="nfw-tag">New item</span>` : `<b class="q">“${nffE(r.words || r.raw)}”</b>`;
    const ask = !sure ? `<div class="nfw-ask">${r.options.length ? (r.why === 'size' ? 'Which size?' : 'Which item is this?') : `Not in ${sell ? 'your items' : 'what you buy from them'}.`}</div>
      <div class="nff-chips">${r.options.map(o => `<button type="button" class="nff-chip" data-nfw="pick" data-i="${i}" data-v="${nffE(o)}">${nffE(o)}</button>`).join('')}
        <button type="button" class="nff-chip ghost" data-nfw="findopen" data-i="${i}">${r.options.length ? 'Something else' : 'Find it in your list'}</button>
        <button type="button" class="nff-chip ghost" data-nfw="asnew" data-i="${i}">${sell ? 'Keep their words' : `New item for ${nffE(nffFirst(who))}`}</button></div>
      ${r.finding ? `<input class="nff-in nfw-find" list="nfwList" data-nfw-in="find" data-i="${i}" placeholder="Type to search your items" autocomplete="off">` : ''}` : '';
    return `<div class="nfw-row${sure ? '' : ' need'}${!(Number(r.qty) > 0) ? ' noqty' : ''}" data-t="row${i}">
      <div class="nfw-row-h">${head}<button type="button" class="nfw-x" data-nfw="del" data-i="${i}" aria-label="Remove">${nffI('x')}</button></div>
      ${r.raw && r.raw !== r.product ? `<div class="nfw-src">${sell ? 'They wrote' : 'You wrote'}: “${nffE(r.raw)}”</div>` : ''}
      ${ask}
      <div class="nfw-qp"><div class="nfw-q"><button type="button" data-nfw="qm" data-i="${i}" aria-label="Less">−</button><input inputmode="decimal" data-nfw-in="qty" data-i="${i}" value="${r.qty != null ? nffE(r.qty) : ''}" placeholder="How many" aria-label="How many"><button type="button" data-nfw="qp" data-i="${i}" aria-label="More">+</button></div>
        <span class="nfw-u">${nffE(r.unit || '')}</span>
        <div class="nfw-p"><span>₱</span><input inputmode="decimal" data-nfw-in="price" data-i="${i}" value="${r.price != null ? nffE(r.price) : ''}" placeholder="${sell ? 'Price' : 'Price (optional)'}" aria-label="Price each"></div>
        <b class="nfw-lt">${Number(r.qty) > 0 && Number(r.price) > 0 ? bkPeso(Number(r.qty) * Number(r.price)) : ''}</b></div>
      ${sell && r.their != null && r.price != null && Math.abs(r.their - r.price) >= 0.01 && r.product ? `<div class="nfw-note">Their PO says ${bkPeso(r.their)}. Your price list: ${bkPeso(r.price)}.</div>` : ''}</div>`;
  }).join('');
  return `<div class="nff-hero"><h2>${sell ? 'Check the order' : 'Check your order'}</h2><p>${!NFW.rows.length ? 'Add the items below.' : unsure ? `${unsure} line${unsure === 1 ? ' needs' : 's need'} you. Tap the right item.` : 'All matched. Check how many, then go.'}</p></div>
    ${NFW.photo ? `<button type="button" class="nfw-ph" data-nfw="zoom"><img alt="Their PO" src="${NFW.photo}"><span>${nffI('img')}Their PO · tap to zoom</span></button>` : ''}
    <div class="nfw-rows">${rowsHtml}</div>
    <div class="nfw-add" data-t="add"><input class="nff-in" list="nfwList" data-nfw-in="addQ" value="${nffE(NFW.addQ)}" placeholder="+ Add an item: type its name" autocomplete="off"><button type="button" class="nff-btn2" data-nfw="add">${nffI('arrow')}Add</button></div>
    <datalist id="nfwList">${cands.slice(0, 300).map(c => `<option value="${nffE(c.product)}">`).join('')}</datalist>
    ${NFW.how === 'type' && !NFW.photo ? `<div class="nff-photo-2"><button type="button" class="nff-pbtn" data-nfw="shoot">${nffI('cam')}<span><b>Photo of their PO</b><small>To look at while you type</small></span></button><label class="nff-pbtn">${nffI('img')}<span><b>Attach their PO</b><small>Kept with the order</small></span><input type="file" accept="image/*" hidden data-nfw-photo="1" data-nf-cam="1" data-nf-own="1"></label></div>` : ''}
    ${NFW.rows.length ? `<div class="nfw-tot"><span>Total${NFW.vat ? ' with VAT' : ''}</span><b>${bkPeso(nfwTotal())}</b></div>` : ''}
    <details class="nfw-more"${NFW.ref || NFW.neededBy ? ' open' : ''}><summary>${sell ? 'PO number, delivery date, address' : 'When you need it'}</summary><div class="nfw-more-in">
      ${sell ? `<div class="nff-task"><div class="nff-lbl"><span>Their PO number</span><small>Optional</small></div><input class="nff-in" data-nfw-in="ref" value="${nffE(NFW.ref)}" maxlength="60"></div>` : ''}
      <div class="nff-task"><div class="nff-lbl"><span>${sell ? 'Deliver by' : 'Needed by'}</span><small>Optional</small></div><input class="nff-in" type="date" data-nfw-in="neededBy" value="${nffE(NFW.neededBy)}" min="${APP_TODAY}"></div>
      ${sell ? `<div class="nff-task"><div class="nff-lbl"><span>Deliver to</span><small>Optional</small></div><input class="nff-in" data-nfw-in="address" value="${nffE(NFW.address)}" maxlength="300"></div>
        <div class="nff-chips"><button type="button" class="nff-chip${NFW.vat ? ' on' : ''}" data-nfw="vat">Add 12% VAT</button><button type="button" class="nff-chip${NFW.tentative ? ' on' : ''}" data-nfw="tent">They still need to say yes</button></div>` : ''}</div></details>`;
}
function nfwRender(keepScroll){
  let m = document.getElementById('nfwModal');
  if(!m){ m = document.createElement('div'); m.id = 'nfwModal'; m.className = 'nfw-modal'; m.addEventListener('click', e => { if(e.target === m) nfwClose(); }); document.body.appendChild(m); document.addEventListener('keydown', nfwEsc); }
  const sell = nfwSell(), sc = (m.querySelector('.nff-body') || {}).scrollTop || 0;
  if(NFW.result){ m.innerHTML = `<div class="nfw-card"><div class="nff nfw">${nfwHead(0)}<div class="nff-body"><div class="nff-pane nff-step">${nfwDoneHtml()}</div></div>${nfwDoneFoot()}</div></div>`; return; }
  const n = NFW.step;
  m.innerHTML = `<div class="nfw-card"><div class="nff nfw">${nfwHead(n)}
    <div class="nff-body"><div class="nff-pane nff-step">${n ? `<button type="button" class="nff-back" data-nfw="back">${nffI('left')}Back</button>` : ''}${nfwStepHtml()}</div></div>
    <div class="nff-foot">${nfwPrimary()}</div></div></div>`;
  if(keepScroll){ const b = m.querySelector('.nff-body'); if(b) b.scrollTop = sc; }
}
function nfwHead(n){
  const sell = nfwSell();
  return `<div class="nff-top"><span class="nfw-ic0">${nffI(sell ? 'clip' : 'msg')}</span><div class="nff-who"><b>${sell ? (NFW.tentative ? 'Send an order for their OK' : "Enter a customer's order") : 'New order to a supplier'}</b><span>${sell ? 'Selling to a customer' : 'Buying from a supplier'}${NFW.who || NFW.name ? ' · ' + nffE(nfwWhoName()) : ''}</span></div><button type="button" class="nff-x" aria-label="Close" data-nfw="close">${nffI('x')}</button></div>
    ${NFW.result ? '' : `<div class="nff-prog"><div class="nff-segs" style="grid-template-columns:repeat(4,1fr)">${[0, 1, 2, 3].map(i => `<i class="${i < n ? 'd' : i === n ? 'n' : ''}"></i>`).join('')}</div><div class="nff-pl"><span>Step ${n + 1} of 4 · <b>${['Who', 'How', sell ? 'Their order' : 'Your order', 'Check it'][n]}</b></span><span class="nff-turn you"><i></i>Your turn</span></div></div>`}`;
}
function nfwDoneHtml(){
  const r = NFW.result, sell = nfwSell();
  return `<div class="nff-hero"><div class="nff-seal">${nffI('check')}</div><h2>${sell ? (r.tentative ? `${nffE(r.poNumber)} is waiting for their OK` : `${nffE(r.poNumber)} is confirmed`) : `Draft ${nffE(r.poNumber)} is ready`}</h2>
    <p>${sell ? (r.tentative ? `Send ${nffE(nffFirst(r.who))} the link. They check it and tap Confirm, no app needed.` : `${nffE(r.who)}'s order is in your Orders, in your item names and prices.`) : `Nothing is sent yet. Check it once more, then send it to ${nffE(nffFirst(r.who))}.`}</p></div>
    <div class="nff-rcpt">${r.items.map(it => `<div class="nff-it"><b>${nffE(it.product)}</b><strong>${it.unitPrice ? bkPeso(it.qty * it.unitPrice) : 'price to follow'}</strong><small>${nffE(it.qty)} × ${it.unitPrice ? bkPeso(it.unitPrice) : '—'}</small></div>`).join('')}<div class="nff-tot"><span>Total</span><b>${bkPeso(r.total)}</b></div></div>`;
}
function nfwDoneFoot(){
  const r = NFW.result, sell = nfwSell();
  if(!sell) return `<div class="nff-foot"><button type="button" class="nff-btn1" data-nfw="sendpo"><span>Send to ${nffE(nffFirst(r.who))}</span>${nffI('arrow')}</button><div class="nff-sec"><button type="button" class="nff-btn2" data-nfw="openpo">${nffI('clip')}<span>Open the order</span></button></div></div>`;
  if(r.tentative) return `<div class="nff-foot"><button type="button" class="nff-btn1" data-nfw="qtsend"><span>Send them the confirm link</span>${nffI('arrow')}</button><div class="nff-sec"><button type="button" class="nff-btn2" data-nfw="openpo">${nffI('clip')}<span>Open the order</span></button></div></div>`;
  return `<div class="nff-foot"><button type="button" class="nff-btn1" data-nfw="openpo"><span>Open the order</span>${nffI('arrow')}</button><div class="nff-sec"><button type="button" class="nff-btn2" data-nfw="print">${nffI('print')}<span>Print your sales order</span></button><button type="button" class="nff-btn2" data-nfw="track">${nffI('truck')}<span>Send a tracking link</span></button></div></div>`;
}
function nfwFoot(){ const f = document.querySelector('#nfwModal .nff-foot'); if(f && !NFW.result) f.innerHTML = nfwPrimary(); }
function nfwFlag(){
  const need = nfwNeed(); if(!need) return; let sel = '[data-t="who"]';
  if(NFW.step === 0 && NFW.newWho) sel = '[data-t="name"]'; if(NFW.step === 1) sel = '[data-t="how"]'; if(NFW.step === 2) sel = NFW.how === 'file' ? '[data-t="file"]' : '[data-t="text"]';
  if(NFW.step === 3){ const i = NFW.rows.findIndex(r => (!r.product && !r.isNew) || !(Number(r.qty) > 0) || (nfwSell() && !(Number(r.price) > 0))); sel = i >= 0 ? `[data-t="row${i}"]` : '[data-t="add"]'; }
  const el = document.querySelector('#nfwModal ' + sel);
  if(el){ el.scrollIntoView({behavior: 'smooth', block: 'center'}); el.classList.remove('nff-need'); void el.offsetWidth; el.classList.add('nff-need'); }
  const b = document.querySelector('#nfwModal .nff-btn1.lock'); if(b){ b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
}
function nfwRead(){
  const parsed = nfwParse(NFW.text);
  if(!parsed.rows.length){ showToast('No items found. Put each item with how many, like "cement 50 bags".', 'error'); return; }
  NFW.rows = nfwRowsFrom(parsed);
  if(parsed.ref) NFW.ref = parsed.ref;
  if(parsed.neededRaw && typeof colParseDate === 'function'){ const d = colParseDate(parsed.neededRaw); if(d && d >= APP_TODAY) NFW.neededBy = d; }
  if(parsed.address) NFW.address = parsed.address;
  NFW.step = 3; nfwPrefillAddr(); nfwRender();
}
function nfwPrefillAddr(){
  if(!nfwSell() || NFW.address || !NFW.who || NFW.newWho) return;
  const last = getSupplierPOs().filter(p => p.buyerId === NFW.who && p.deliveryAddress).sort((a, b) => String(b.createdDate).localeCompare(String(a.createdDate)))[0]; if(last) NFW.address = last.deliveryAddress;
}
async function nfwReadFile(file){
  const name = (file.name || '').toLowerCase(); NFW.err = ''; NFW.fileName = file.name; NFW.reading = true; nfwRender();
  try{
    let parsed;
    if(/\.(csv|txt)$/.test(name) || /text\//.test(file.type)){ const t = await file.text(); parsed = /,|\t|;/.test(t.split('\n')[0] || '') && /qty|quantity|item|desc/i.test(t.split('\n').slice(0, 6).join(' ')) ? nfwFromTable(cpoRowsFromTable(colParseCsv(t))) : nfwParse(t); }
    else if(/\.(xlsx|xls)$/.test(name)){ await cpoLoadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); const wb = XLSX.read(await file.arrayBuffer(), {type: 'array'});
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1, raw: false, defval: ''}); const t = cpoRowsFromTable(rows);
      parsed = t.rows.length ? nfwFromTable(t) : nfwParse(rows.map(r => r.filter(Boolean).join('   ')).join('\n')); }
    else if(nfwSell() && (/\.pdf$/.test(name) || file.type === 'application/pdf')){
      await cpoLoadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'); pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({data: await file.arrayBuffer()}).promise; const lines = [];
      for(let p = 1; p <= Math.min(pdf.numPages, 10); p++){ const tc = await (await pdf.getPage(p)).getTextContent(); const byY = {};
        tc.items.forEach(it => { const y = Math.round(it.transform[5] / 3); (byY[y] = byY[y] || []).push(it); });
        Object.keys(byY).sort((a, b) => b - a).forEach(y => lines.push(byY[y].sort((a, b) => a.transform[4] - b.transform[4]).map(i => i.str).join('   '))); }
      if(lines.join('').replace(/\s/g, '').length < 10) throw new Error('This PDF is a scanned picture, so it cannot be read. Go back and choose Type it in, then look at it while you type.');
      parsed = nfwParse(lines.join('\n'));
    } else throw new Error(nfwSell() ? 'Use an Excel, CSV or PDF file.' : 'Use an Excel or CSV file.');
    if(!parsed.rows.length) throw new Error('No items found in that file. Check it has item names and quantities, or type them in.');
    NFW.rows = nfwRowsFrom(parsed); if(parsed.ref) NFW.ref = parsed.ref; if(parsed.address) NFW.address = parsed.address;
    if(parsed.neededRaw && typeof colParseDate === 'function'){ const d = colParseDate(parsed.neededRaw); if(d && d >= APP_TODAY) NFW.neededBy = d; }
    NFW.reading = false; NFW.step = 3; nfwPrefillAddr(); nfwRender();
  }catch(e){ NFW.reading = false; NFW.rows = []; NFW.err = e.message || "Couldn't read that file."; nfwRender(); }
}
function nfwFromTable(t){ return {rows: (t.rows || []).map(r => ({name: r.text, qty: r.qty, unit: r.unit, price: r.price, amount: r.amount, raw: r.raw || r.text})), ref: t.ref, neededRaw: t.neededBy || null, address: t.address}; }
function nfwUsualRows(){
  const sell = nfwSell();
  const last = purchaseOrders.filter(p => sell ? (p.supplierId === ME_SUPPLIER && p.buyerId === NFW.who) : (p.buyerId === ME_BUYER && p.supplierId === NFW.who)).filter(p => !['draft', 'cancelled'].includes(p.status)).sort((a, b) => String(b.createdDate).localeCompare(String(a.createdDate)))[0];
  return last ? (last.lineItems || []).map(li => ({raw: li.product, words: li.product, qty: li.qty, unit: null, product: li.product, conf: 'ok', options: [], price: sell ? (nfwPrice(li.product) || li.unitPrice) : (lookupKnownUnitPrice(NFW.who, li.product) || li.unitPrice), their: null, isNew: false})) : [];
}
function nfwAddItem(){
  const t = String(NFW.addQ || '').trim(); if(!t) return;
  const cands = nfwCands(), exact = cands.find(c => c.product.toLowerCase() === t.toLowerCase());
  const m = exact ? {product: exact.product, conf: 'ok', options: []} : nfwMatch(t, cands, nfwAlias(t));
  const pr = m.product ? nfwPrice(m.product) : null;
  NFW.rows.push({raw: exact ? '' : t, words: t, qty: null, unit: null, product: m.product, conf: m.conf, options: m.options || [], why: m.why || '', price: pr, their: null, isNew: false});
  NFW.addQ = ''; nfwRender(true);
  setTimeout(() => { const q = document.querySelector(`#nfwModal [data-nfw-in="qty"][data-i="${NFW.rows.length - 1}"]`); if(q && window.innerWidth > 760) q.focus(); }, 40);
}
async function nfwCreate(){
  const sell = nfwSell(), who = nfwWhoName();
  const rows = NFW.rows.filter(r => (r.product || r.isNew) && Number(r.qty) > 0);
  const items = rows.map(r => ({product: (r.product || r.words).slice(0, 200), qty: Number(r.qty), unitPrice: Number(r.price) || 0, unit: r.unit || null, customerText: sell && r.product && r.raw && r.raw !== r.product ? r.raw : null}));
  const btn = document.querySelector('#nfwModal .nff-btn1'); if(btn){ btn.disabled = true; btn.innerHTML = '<span>Saving…</span>'; }
  const aliasRows = rows.filter(r => r.product && r.words && r.conf !== 'saved').map(r => ({product: r.product, text: r.words}));
  if(sell){
    const holdUntil = NFW.tentative ? addDaysIso(APP_TODAY, 3) : null; let poId, poNumber, buyerId, buyerName;
    if(myBusiness){
      const { data, error } = await sb.rpc('record_customer_order', {p_buyer: NFW.newWho ? null : NFW.who, p_name: NFW.newWho ? NFW.name : null, p_phone: NFW.newWho ? NFW.phone || null : null, p_email: null,
        p_address: NFW.address || null, p_items: items, p_ref: NFW.ref || null, p_needed_by: NFW.neededBy || null, p_notes: null, p_tax_rate: NFW.vat ? 0.12 : 0, p_tentative: !!NFW.tentative, p_hold_until: holdUntil, p_allow_edit: true});
      if(error){ showToast(error.message, 'error'); nfwRender(true); return; }
      poId = data.po_id; poNumber = data.po_number; buyerId = data.buyer_id; buyerName = data.buyer_name; window._cpoTokens = Object.assign(window._cpoTokens || {}, {[poId]: data.token});
      if(!(buyersData || []).some(b => b.id === buyerId) && typeof loadMyConnections === 'function') await loadMyConnections();
      await refreshPOsById([poId]);
    } else {
      if(NFW.newWho){ buyerId = 'buy_new_' + Date.now(); buyersData.push({id: buyerId, name: NFW.name, category: 'New customer', score: null, tier: 'mid', orders: 1, lastOrder: 'Today', since: APP_TODAY, isOutside: true, phone: NFW.phone}); } else buyerId = NFW.who;
      buyerName = (buyersData.find(b => b.id === buyerId) || {}).name || NFW.name;
      poId = 'po_cpo_' + Date.now(); poNumber = 'PO-2026-0' + (900 + Math.floor(Math.random() * 90));
      purchaseOrders.push({id: poId, poNumber, buyerId, buyerName, supplierId: ME_SUPPLIER, supplierName: selfName(), type: 'local', status: NFW.tentative ? 'quote' : 'confirmed', currency: 'PHP', taxRate: NFW.vat ? 0.12 : 0,
        quote: NFW.tentative ? {sent_at: APP_TODAY, hold_until: holdUntil, allow_edit: true, nudges: []} : null, lineItems: items, createdDate: APP_TODAY, requestedDeliveryDate: NFW.neededBy || null, deliveryAddress: NFW.address || null, notes: '', customerRef: NFW.ref || null, atRisk: false, documents: [],
        history: [{date: APP_TODAY, time: nfwTimeNow(), actor: 'supplier', action: `📄 Entered from ${buyerName}'s order${NFW.ref ? ' #' + NFW.ref : ''} by ${slMemberName()} · ${NFW.tentative ? 'waiting for their OK' : 'confirmed'}`}]});
      if(NFW.leadId && !NFW.tentative){ const l = (typeof leadsCache !== 'undefined' && leadsCache || []).find(x => x.id === NFW.leadId); if(l) Object.assign(l, {stage: 'won', next_follow_up: null}); }
    }
    if(aliasRows.length && typeof cpoSaveAliases === 'function') try{ await cpoSaveAliases(aliasRows, buyerId); }catch(e){}
    if(NFW.photo && typeof nfOpAdd === 'function') nfOpAdd(poId, 'other', NFW.photo).catch(() => {});
    NFW.result = {poId, poNumber, who: buyerName, tentative: !!NFW.tentative, items, total: nfwTotal()};
    if(typeof renderSupplierOrdersTable === 'function') renderSupplierOrdersTable();
    if(typeof trackEvent === 'function') trackEvent('customer_po_imported', {lines: rows.length, how: NFW.how});
  } else {
    let supplierId = NFW.who;
    if(NFW.newWho){ showToast('Add the supplier first, then make the order.', 'error'); nfwClose(); navigate('invite'); return; }
    const po = await createDraftPOObject({supplierId, lineItems: items.map(x => ({product: x.product, qty: x.qty, unitPrice: x.unitPrice})), type: 'local', notes: '', requestedDeliveryDate: NFW.neededBy || ''});
    if(!po){ showToast("Couldn't create the order. Try again.", 'error'); nfwRender(true); return; }
    rows.forEach(r => appendToBuyerProductReference(supplierId, r.product || r.words, r.unit || 'unit'));
    if(myBusiness) syncPoToSupabase(po);
    if(typeof scheduleNiftiSave === 'function') scheduleNiftiSave();
    if(aliasRows.length && typeof cpoSaveAliases === 'function') try{ await cpoSaveAliases(aliasRows, 'sup:' + supplierId); }catch(e){}
    NFW.result = {poId: po.id, poNumber: po.poNumber, who, items, total: nfwTotal()};
    if(typeof renderOrdersTable === 'function') renderOrdersTable();
    if(typeof trackEvent === 'function') trackEvent('paste_order_created', {items: rows.length, how: NFW.how});
  }
  nfwRender();
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#nfwModal [data-nfw]'); if(!b || !NFW) return;
  const a = b.dataset.nfw, i = Number(b.dataset.i), r = NFW.rows[i];
  if(a === 'close') return nfwClose();
  if(a === 'locked') return nfwFlag();
  if(a === 'who'){ NFW.who = b.dataset.v; NFW.newWho = false; nfwRender(); return; }
  if(a === 'newwho'){ NFW.newWho = true; NFW.who = null; nfwRender(); setTimeout(() => { const f = document.querySelector('#nfwModal [data-nfw-in="name"]'); if(f) f.focus(); }, 40); return; }
  if(a === 'how'){ NFW.how = b.dataset.v; if(NFW.how === 'usual'){ NFW.rows = nfwUsualRows(); NFW.step = 3; nfwPrefillAddr(); } nfwRender(); return; }
  if(a === 'next'){ if(nfwNeed()) return nfwFlag();
    if(NFW.step === 1 && NFW.how === 'type'){ NFW.rows = []; NFW.step = 3; nfwPrefillAddr(); nfwRender(); setTimeout(() => { const f = document.querySelector('#nfwModal [data-nfw-in="addQ"]'); if(f && window.innerWidth > 760) f.focus(); }, 40); return; }
    if(NFW.step === 2 && NFW.how === 'file'){ NFW.step = 3; nfwRender(); return; }
    NFW.step = Math.min(3, NFW.step + 1); nfwRender(); if(NFW.step === 2 && NFW.how === 'paste') setTimeout(() => { const t = document.querySelector('#nfwModal [data-nfw-in="text"]'); if(t && window.innerWidth > 760) t.focus(); }, 40); return; }
  if(a === 'back'){ NFW.step = NFW.step === 3 && (NFW.how === 'type' || NFW.how === 'usual') ? 1 : Math.max(0, NFW.step - 1); nfwRender(); return; }
  if(a === 'read') return nfwRead();
  if(a === 'form'){ const id = NFW.who, nm = nfwWhoName(); nfwClose(); if(typeof CPO !== 'undefined'){ CPO = Object.assign(CPO || {}, {buyerId: id || '', name: nm}); } if(typeof cpoSendForm === 'function') cpoSendForm(); return; }
  if(a === 'pick' && r){ r.product = b.dataset.v; r.conf = 'ok'; r.isNew = false; r.finding = false; const p = nfwPrice(r.product); if(p) r.price = p; nfwRender(true); return; }
  if(a === 'findopen' && r){ r.finding = true; nfwRender(true); setTimeout(() => { const f = document.querySelector(`#nfwModal [data-nfw-in="find"][data-i="${i}"]`); if(f) f.focus(); }, 40); return; }
  if(a === 'asnew' && r){ r.isNew = true; r.product = ''; r.finding = false; nfwRender(true); return; }
  if(a === 'del'){ NFW.rows.splice(i, 1); nfwRender(true); return; }
  if((a === 'qm' || a === 'qp') && r){ r.qty = Math.max(0, (Number(r.qty) || 0) + (a === 'qp' ? 1 : -1)); nfwRender(true); return; }
  if(a === 'add') return nfwAddItem();
  if(a === 'vat'){ NFW.vat = !NFW.vat; nfwRender(true); return; }
  if(a === 'tent'){ NFW.tentative = !NFW.tentative; nfwRender(true); return; }
  if(a === 'create'){ if(nfwNeed()) return nfwFlag(); nfwCreate(); return; }
  if(a === 'shoot'){ nfTakePhoto(d => { NFW.photo = d; nfwRender(true); }, {title: 'Photo of their PO'}); return; }
  if(a === 'zoom'){ slModal('nfwPh', `<div class="sl-sheet-h"><b>Their PO</b><button class="sl-x" onclick="slClose('nfwPh')">✕</button></div><div class="nf-ok-img"><img alt="Their PO" src="${NFW.photo}"></div>`); return; }
  if(a === 'openpo'){ const res = NFW.result, sell = nfwSell(); nfwClose(); navigate('orders'); setTimeout(() => openOrderDetailModal(res.poId, sell), 150); return; }
  if(a === 'sendpo'){ const res = NFW.result; nfwClose(); navigate('orders'); setTimeout(() => openSendConfirmModal(res.poId), 150); return; }
  if(a === 'print'){ printSalesOrder(NFW.result.poId); return; }
  if(a === 'track'){ shareTrackingLink(NFW.result.poId); return; }
  if(a === 'qtsend'){ const id = NFW.result.poId; nfwClose(); qtSendFirst(id); return; }
});
document.addEventListener('input', e => {
  const t = e.target; if(!t || !t.dataset || !t.dataset.nfwIn || !NFW || !t.closest('#nfwModal')) return;
  const k = t.dataset.nfwIn, i = Number(t.dataset.i), r = NFW.rows[i];
  if(k === 'search'){ NFW.search = t.value; const pos = t.selectionStart; nfwRender(); const f = document.querySelector('#nfwModal [data-nfw-in="search"]'); if(f){ f.focus(); f.setSelectionRange(pos, pos); } return; }
  if(k === 'qty' && r){ r.qty = t.value === '' ? null : Number(String(t.value).replace(/,/g, '')); const lt = t.closest('.nfw-row').querySelector('.nfw-lt'); if(lt) lt.textContent = Number(r.qty) > 0 && Number(r.price) > 0 ? bkPeso(r.qty * r.price) : ''; t.closest('.nfw-row').classList.toggle('noqty', !(Number(r.qty) > 0)); nfwTot(); nfwFoot(); return; }
  if(k === 'price' && r){ r.price = t.value === '' ? null : Number(String(t.value).replace(/,/g, '')); const lt = t.closest('.nfw-row').querySelector('.nfw-lt'); if(lt) lt.textContent = Number(r.qty) > 0 && Number(r.price) > 0 ? bkPeso(r.qty * r.price) : ''; nfwTot(); nfwFoot(); return; }
  if(k === 'find' && r){ const c = nfwCands().find(x => x.product.toLowerCase() === t.value.trim().toLowerCase()); if(c){ r.product = c.product; r.conf = 'ok'; r.isNew = false; r.finding = false; if(c.price) r.price = c.price; nfwRender(true); } return; }
  NFW[k] = t.value;
  if(k === 'addQ'){ const c = nfwCands().find(x => x.product.toLowerCase() === t.value.trim().toLowerCase()); if(c && e.inputType === 'insertReplacementText') nfwAddItem(); return; }
  nfwFoot();
});
document.addEventListener('keydown', e => { const t = e.target; if(e.key === 'Enter' && t && t.dataset && t.dataset.nfwIn === 'addQ' && NFW){ e.preventDefault(); nfwAddItem(); } });
document.addEventListener('change', e => {
  const t = e.target; if(!t || !t.dataset || !NFW || !t.closest || !t.closest('#nfwModal')) return;
  if(t.dataset.nfwFile){ const f = t.files && t.files[0]; if(f) nfwReadFile(f); return; }
  if(t.dataset.nfwPhoto){ nfPickFile(t, d => { NFW.photo = d; nfwRender(true); }); return; }
  if(t.dataset.nfwIn === 'neededBy'){ NFW.neededBy = t.value; return; }
  if(t.dataset.nfwIn === 'addQ'){ const c = nfwCands().find(x => x.product.toLowerCase() === t.value.trim().toLowerCase()); if(c) nfwAddItem(); }
});
function nfwTot(){ const el = document.querySelector('#nfwModal .nfw-tot b'); if(el) el.textContent = bkPeso(nfwTotal()); }
