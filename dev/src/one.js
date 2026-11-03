
/* ============ ONE BUSINESS: buying and selling in one place ============
   Every business buys (from suppliers) and sells (to customers), so there is no "buyer account" or
   "supplier account" any more. currentAppRole is only the lens a page looks through:
   'supplier' = the customers' side (what you sell), 'buyer' = the suppliers' side (what you buy).
   Home, Money, Stock and the books are combined; pages that hold both kinds of records (orders,
   contacts, returns...) show two plain tabs. Nobody is ever asked to pick a side. */
function selfName(){ return myBusiness ? myBusiness.name : 'Dela Cruz Hardware'; }
const LENS_TABS = {
  orders: [['supplier', 'Customer orders'], ['buyer', 'Orders to suppliers']],
  suppliers: [['supplier', 'Customers'], ['buyer', 'Suppliers']],
  collections: [['supplier', 'Who owes you'], ['buyer', 'Bills you owe']],
  prices: [['supplier', 'Your selling prices'], ['buyer', 'Supplier prices']],
  returns: [['supplier', 'From customers'], ['buyer', 'To suppliers']],
  cheques: [['supplier', 'Cheques you received'], ['buyer', 'Cheques you gave']],
  books: [['supplier', 'Sales book'], ['buyer', 'Purchase book']],
  taxforms: [['supplier', 'From customers'], ['buyer', 'For suppliers']],
  invite: [['supplier', 'Invite a customer'], ['buyer', 'Invite a supplier']],
  analytics: [['supplier', 'Selling'], ['buyer', 'Buying']],
  discover: [['buyer', 'Find suppliers'], ['supplier', 'Find customers']],
};
// Pages that only make sense from one side; going there quietly sets the lens.
const PAGE_FIXED_LENS = {followups: 'supplier', routes: 'supplier', store: 'supplier', watchdog: 'buyer', inventory: 'buyer', sales: 'buyer', dashboard: 'supplier',
  money: 'supplier', expenses: 'buyer', cashcount: 'supplier', profit: 'supplier'};
let lensByPage = {};
function setLens(role){
  if(role !== 'buyer' && role !== 'supplier') return;
  if(currentAppRole === role) return;
  currentAppRole = role;
  window._msgInit = false;
  if(typeof syncRoleNavVisibility === 'function') syncRoleNavVisibility();
  if(typeof applyRoleAwareText === 'function') applyRoleAwareText(role);
  if(typeof updateAnnounceButtonVisibility === 'function') updateAnnounceButtonVisibility();
}
// Kept for every older call site: changing the lens re-renders the page you're on.
switchAppRole = function(role){
  setLens(role);
  updateOpenItemsBadge();
  updateInventoryNavBadge();
  renderSidebarForViewAsRole();
  const activePage = document.querySelector('.app-page.active');
  navigate(activePage ? activePage.id.replace('page-', '') : 'dashboard');
};
function sideOfPo(po){ return po && po.supplierId === ME_SUPPLIER && po.buyerId !== ME_BUYER ? 'supplier' : 'buyer'; }
function openPoCount(side){
  const done = ['draft', 'cancelled', 'paid'];
  return (side === 'supplier' ? getSupplierPOs() : getBuyerPOs()).filter(o => !done.includes(o.status) && !(o.invoice && o.invoice.opening)).length;
}
function defaultLensFor(page){
  if(page === 'orders') return openPoCount('supplier') || !openPoCount('buyer') ? 'supplier' : 'buyer';
  if(page === 'suppliers') return buyersData.length || !suppliersData.length ? 'supplier' : 'buyer';
  return LENS_TABS[page] ? LENS_TABS[page][0][0] : currentAppRole;
}
// Sidebar / bottom bar / More sheet: open a page on the side you last used there.
function go(page){
  if(LENS_TABS[page]) setLens(lensByPage[page] || defaultLensFor(page));
  navigate(page);
}
function pickLens(page, side){
  lensByPage[page] = side;
  if(page === 'orders' && typeof orderSeg !== 'undefined') window._ordersInit = window._ordersInit; // views re-render on navigate
  setLens(side);
  navigate(page);
}
function lensCount(page, side){
  if(page === 'orders'){ const n = openPoCount(side); return n ? ` <span class="lens-n">${n}</span>` : ''; }
  if(page === 'suppliers'){ const n = (side === 'supplier' ? buyersData : suppliersData).length; return n ? ` <span class="lens-n">${n}</span>` : ''; }
  return '';
}
function renderLensTabs(page){
  const host = document.getElementById('page-' + page); if(!host) return;
  let bar = host.querySelector(':scope > .lens-tabs');
  const tabs = LENS_TABS[page];
  if(!tabs){ if(bar) bar.remove(); return; }
  if(!bar){ bar = document.createElement('div'); bar.className = 'lens-tabs'; bar.setAttribute('role', 'tablist'); host.insertBefore(bar, host.firstChild); }
  lensByPage[page] = currentAppRole;
  bar.innerHTML = tabs.map(([side, label]) => `<button role="tab" aria-selected="${side === currentAppRole}" class="${side === currentAppRole ? 'on' : ''}" onclick="pickLens('${page}','${side}')">${label}${lensCount(page, side)}</button>`).join('');
}
function homeHost(){ return document.getElementById('oneHome'); }

/* ---- Conversations: one list, each chat knows whether it's a customer or a supplier ---- */
function allConversations(){
  buyerConversations.forEach(c => { if(!c.side) c.side = 'buyer'; });
  supplierConversations.forEach(c => { if(!c.side) c.side = 'supplier'; });
  return supplierConversations.concat(buyerConversations);
}
function convSide(conv){ return (conv && conv.side) || (supplierConversations.includes(conv) ? 'supplier' : 'buyer'); }
function convLastTs(c){ const m = c.messages[c.messages.length - 1]; return m ? (m.date || '') + ' ' + (m.time || '') : ''; }
totalUnread = function(){ return allConversations().reduce((s, c) => s + (c.unread || 0), 0); };
const _selectConversationBase = selectConversation;
selectConversation = function(id, side){
  if(!side){
    const here = getConversations().some(c => c.id === id);
    if(!here){ const other = allConversations().find(c => c.id === id); if(other) side = convSide(other); }
  }
  if(side) setLens(side);
  return _selectConversationBase(id);
};
renderConversationList = function(){
  const box = document.getElementById('convList'); if(!box){ updateMessagesBadge(); return; }
  const searchInput = document.getElementById('msgSearchInput');
  const term = (searchInput ? searchInput.value : '').toLowerCase();
  const all = allConversations();
  let list = all.filter(c => c.name.toLowerCase().includes(term));
  if(msgFilter === 'unread') list = list.filter(c => c.unread > 0);
  if(msgFilter === 'customers') list = list.filter(c => convSide(c) === 'supplier');
  if(msgFilter === 'suppliers') list = list.filter(c => convSide(c) === 'buyer');
  list.sort((a, b) => (b.unread > 0) - (a.unread > 0) || convLastTs(b).localeCompare(convLastTs(a)));
  const activeSide = currentAppRole;
  box.innerHTML = list.map(c => {
    const last = c.messages[c.messages.length - 1];
    const preview = last ? (last.attachment ? '📎 ' + last.attachment.name : last.text) : '';
    const side = convSide(c);
    return `<div class="conv-item ${c.id === activeConvId && side === activeSide ? 'active' : ''}" onclick="selectConversation('${c.id}','${side}')">
      <div class="conv-avatar">${escapeHtml(c.initials || '?')}</div>
      <div class="conv-info">
        <div class="conv-name-row"><span class="conv-name">${escapeHtml(c.name)}</span><span class="conv-time">${last ? escapeHtml(String(last.time || '').split(',')[0]) : ''}</span></div>
        <div class="conv-preview"><span class="conv-kind ${side}">${side === 'supplier' ? 'Customer' : 'Supplier'}</span>${escapeHtml(preview)}</div>
      </div>
      ${c.unread > 0 ? `<span class="conv-unread-badge">${c.unread}</span>` : ''}
    </div>`;
  }).join('') || (all.length === 0
    ? `<div style="padding:32px 20px;text-align:center;color:var(--ink);"><div style="font-weight:800;font-size:15.5px;margin-bottom:6px;">No conversations yet</div>
        <div style="font-size:15px;">Chats with your customers and suppliers show up here, and stay here.</div></div>`
    : `<div style="padding:24px;text-align:center;color:var(--ink);font-size:15.5px;">No conversations match.</div>`);
  updateMessagesBadge();
  if(document.getElementById('oneHomeMsgs')) renderOneHomeMessages();
};

/* ---- Search: orders, customers, suppliers and products, from both sides ---- */
onGlobalSearch = function(q){
  const box = document.getElementById('globalSearchResults');
  const query = (q || '').trim().toLowerCase();
  if(!query){ box.classList.add('hidden'); box.innerHTML = ''; return; }
  const pos = purchaseOrders.filter(o => (o.supplierId === ME_SUPPLIER && o.buyerId !== ME_BUYER) || o.buyerId === ME_BUYER);
  const orderHits = pos.filter(o => String(o.poNumber).toLowerCase().includes(query) || (o.lineItems || []).some(li => String(li.product).toLowerCase().includes(query))
    || String(o.buyerName || '').toLowerCase().includes(query) || String(o.supplierName || '').toLowerCase().includes(query)).slice(0, 6);
  const parties = buyersData.map(p => ({p, side: 'supplier'})).concat(suppliersData.map(p => ({p, side: 'buyer'})));
  const partyHits = parties.filter(x => String(x.p.name).toLowerCase().includes(query) || String(x.p.category || '').toLowerCase().includes(query)).slice(0, 6);
  const stock = (typeof inventoryData !== 'undefined' ? inventoryData : []).filter(i => String(i.name).toLowerCase().includes(query));
  const seen = new Set(); const productHits = stock.filter(i => !seen.has(i.name) && seen.add(i.name)).slice(0, 5);
  const rows = [];
  if(orderHits.length){
    rows.push(`<div class="notif-head">Orders</div>`);
    orderHits.forEach(o => { const sell = sideOfPo(o) === 'supplier'; rows.push(`<div class="notif-item" style="cursor:pointer;" onclick="jumpToOrder('${o.id}')"><div><div class="notif-text">${escapeHtml(o.poNumber)} — ${escapeHtml((o.lineItems[0] || {}).product || '')}</div><div class="notif-time">${sell ? 'Customer: ' + escapeHtml(o.buyerName) : 'Supplier: ' + escapeHtml(o.supplierName)}</div></div></div>`); });
  }
  if(partyHits.length){
    rows.push(`<div class="notif-head">Customers &amp; suppliers</div>`);
    partyHits.forEach(x => rows.push(`<div class="notif-item" style="cursor:pointer;" onclick="jumpToParty('${x.p.id}','${x.side}')"><div><div class="notif-text">${escapeHtml(x.p.name)}</div><div class="notif-time">${x.side === 'supplier' ? 'Customer' : 'Supplier'}${x.p.category ? ' · ' + escapeHtml(x.p.category) : ''}</div></div></div>`));
  }
  if(productHits.length){
    rows.push(`<div class="notif-head">Stock</div>`);
    productHits.forEach(i => rows.push(`<div class="notif-item" style="cursor:pointer;" onclick="document.getElementById('globalSearchResults').classList.add('hidden'); go('inventory')"><div><div class="notif-text">${escapeHtml(i.name)}</div><div class="notif-time">${Number(i.onHand) || 0} ${escapeHtml(i.unit || 'on hand')}</div></div></div>`));
  }
  box.innerHTML = rows.length ? rows.join('') : `<div class="notif-item"><div class="notif-text" style="color:var(--ink);">No matches for "${escapeHtml(q)}"</div></div>`;
  box.classList.remove('hidden');
};
const _jumpToOrderBase = jumpToOrder;
jumpToOrder = function(id){ const po = getPO(id); if(po) setLens(sideOfPo(po)); return _jumpToOrderBase(id); };
jumpToParty = function(id, side){
  document.getElementById('globalSearchResults').classList.add('hidden');
  document.getElementById('globalSearchInput').value = '';
  setLens(side || (buyersData.some(b => b.id === id) ? 'supplier' : 'buyer'));
  navigate('suppliers');
  expandedSupplierId = id;
  renderSuppliersTable();
};
hmOpenOrders = function(side, seg){ orderSeg[side] = seg; setLens(side); navigate('orders'); };
toggleCreateMenu = function(e){ e.stopPropagation(); document.getElementById('createMenuDropdown').classList.toggle('hidden'); };
function createAs(side, fn){ closeCreateMenu(); setLens(side); fn(); }
updateSalesNavVisibility = function(){ const n = document.getElementById('salesNavItem'); if(n) n.classList.remove('hidden'); };
renderHomeInviteNudge = function(){};

/* ---- The one Home: everything that needs you today, from both sides ---- */
function oneHomeItems(){
  const keep = currentAppRole;
  setLens('supplier'); const sell = hmItemsSupplier().map(i => Object.assign({}, i, {a: `setLens('supplier'); ${i.a}`}));
  setLens('buyer'); const buy = hmItemsBuyer().map(i => Object.assign({}, i, {a: `setLens('buyer'); ${i.a}`}));
  setLens(keep);
  return sell.concat(buy);
}
function oneHomeTiles(){
  const sPos = getSupplierPOs().filter(o => o.status !== 'draft' && o.status !== 'cancelled');
  const toConfirm = sPos.filter(o => o.status === 'sent' || pendingAmendment(o)).length;
  const toDeliver = sPos.filter(o => ['confirmed', 'preparing', 'shipped', 'in_customs'].includes(o.status));
  const lateOut = toDeliver.filter(o => o.requestedDeliveryDate && o.requestedDeliveryDate < APP_TODAY && o.status !== 'shipped' && o.status !== 'in_customs').length;
  const owedRows = unpaidInvoicesFor('supplier'), oweRows = unpaidInvoicesFor('buyer');
  const owed = hmSum(owedRows, r => r.balance), owedLate = hmSum(owedRows.filter(r => r.daysOverdue > 0), r => r.balance);
  const owe = hmSum(oweRows, r => r.balance), oweLate = hmSum(oweRows.filter(r => r.daysOverdue > 0), r => r.balance);
  const nextDue = oweRows.filter(r => r.due && r.daysOverdue <= 0).map(r => r.due).sort()[0];
  const arriving = getBuyerPOs().filter(o => ['confirmed', 'preparing', 'shipped', 'in_customs'].includes(o.status));
  const lateIn = arriving.filter(o => o.requestedDeliveryDate && o.requestedDeliveryDate < APP_TODAY).length;
  return [
    {lbl: 'Customer orders', num: toConfirm + toDeliver.length, sub: toConfirm ? `${toConfirm} waiting for your OK` : lateOut ? `${lateOut} late to deliver` : toDeliver.length ? `${toDeliver.length} to deliver` : 'Nothing waiting', cls: lateOut ? 'bad' : '', hot: toConfirm > 0, a: "hmOpenOrders('supplier','turn')"},
    {lbl: 'Owed to you', num: hmPeso(owed), sub: owedLate >= 1 ? `${hmPeso(owedLate)} overdue` : owed >= 1 ? 'Nothing overdue' : 'All paid up', cls: owedLate >= 1 ? 'bad' : owed >= 1 ? '' : 'good', a: "go('collections')"},
    {lbl: 'You owe suppliers', num: hmPeso(owe), sub: oweLate >= 1 ? `${hmPeso(oweLate)} overdue` : nextDue ? `Next due ${hmDay(nextDue)}` : 'All paid', cls: oweLate >= 1 ? 'bad' : owe >= 1 ? '' : 'good', hot: oweLate >= 1, a: "pickLens('collections','buyer')"},
    {lbl: 'Coming from suppliers', num: arriving.length, sub: lateIn ? `${lateIn} running late` : arriving.length ? 'All on schedule' : 'Nothing on the way', cls: lateIn ? 'bad' : '', a: "hmOpenOrders('buyer','arriving')"},
  ];
}
function oneHomeRecent(){
  const rows = purchaseOrders.filter(o => o.status !== 'draft' && ((o.supplierId === ME_SUPPLIER && o.buyerId !== ME_BUYER) || o.buyerId === ME_BUYER) && !(o.invoice && o.invoice.opening))
    .sort((a, b) => String(b.createdDate || '').localeCompare(String(a.createdDate || '')) || String(b.poNumber).localeCompare(String(a.poNumber))).slice(0, 7);
  if(!rows.length) return '';
  return `<section class="lg-panel lg-recent"><div class="lg-ph"><b>Recent orders</b><a class="lg-link" onclick="go('orders')">All orders</a></div>
    <div class="lg-tbl-wrap"><table class="lg-tbl"><thead><tr><th>With</th><th class="lg-hide-s">Items</th><th class="lg-hide-s">Date</th><th class="r">Amount</th><th class="lg-hide-s">Status</th></tr></thead><tbody>
    ${rows.map(o => { const side = sideOfPo(o), sell = side === 'supplier', li = o.lineItems || [];
      return `<tr onclick="setLens('${side}'); openOrderDetailModal('${o.id}', ${sell})">
        <td class="lg-who"><span class="lg-who-n">${escapeHtml(sell ? o.buyerName : o.supplierName)}</span><span class="one-dir ${sell ? 'in' : 'out'}">${sell ? 'Sale' : 'Purchase'}</span></td>
        <td class="lg-hide-s">${li.length ? escapeHtml(li[0].product) + (li.length > 1 ? ` <span class="lg-dim">+${li.length - 1}</span>` : '') : '—'}</td>
        <td class="lg-hide-s">${lgShortDate(o.createdDate)}</td><td class="r lg-n">${fmtPHP(poTotal(o))}<span class="lg-pill-s">${lgStatusPill(o, side)}</span></td><td class="lg-hide-s">${lgStatusPill(o, side)}</td></tr>`; }).join('')}
    </tbody></table></div></section>`;
}
function renderOneHomeMessages(){
  const el = document.getElementById('oneHomeMsgs'); if(!el) return;
  const list = allConversations().filter(c => c.messages.length).sort((a, b) => (b.unread > 0) - (a.unread > 0) || convLastTs(b).localeCompare(convLastTs(a))).slice(0, 4);
  el.innerHTML = list.length ? list.map(c => { const last = c.messages[c.messages.length - 1], side = convSide(c);
    return `<div class="one-msg" onclick="go('messages'); selectConversation('${c.id}','${side}')"><span class="conv-avatar">${escapeHtml(c.initials || '?')}</span>
      <span class="one-msg-t"><b>${escapeHtml(c.name)}</b> <span class="conv-kind ${side}">${side === 'supplier' ? 'Customer' : 'Supplier'}</span><small>${escapeHtml(last.attachment ? '📎 ' + last.attachment.name : last.text)}</small></span>
      ${c.unread ? `<span class="conv-unread-badge">${c.unread}</span>` : ''}</div>`; }).join('')
    : `<div class="lg-empty"><b>No chats yet.</b><span>Messages with customers and suppliers land here.</span></div>`;
}
function renderOneHome(){
  const host = homeHost(); if(!host) return;
  setLens('supplier');
  const raw = oneHomeItems();
  const items = hmGroup(raw);
  const n = raw.length;
  const date = new Date(APP_TODAY + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'long', month: 'long', day: 'numeric'});
  const boss = typeof booksCanSeeTotals === 'function' ? booksCanSeeTotals() : true;
  host.innerHTML = `<div class="page-head hm-hello lg-head"><div><div class="lg-date">${date}</div><h1>${hmGreeting()}, ${escapeHtml(selfName())}</h1></div>
      <p class="lg-status">${n ? `${n} thing${n > 1 ? 's' : ''} need${n > 1 ? '' : 's'} you` : 'All caught up'}</p></div>
    <div id="oneBooksStrip">${boss && typeof booksHomeStrip === 'function' ? booksHomeStrip() : ''}</div>
    <div class="lg-kpis">${oneHomeTiles().map(lgKpi).join('')}</div>
    <div class="lg-grid">${lgAttention(items, n)}<div class="one-side">${boss && typeof booksFlagsPanel === 'function' ? booksFlagsPanel() : ''}${lgMoney('supplier')}</div></div>
    ${oneHomeRecent()}
    <section class="lg-panel"><div class="lg-ph"><b>Messages</b><a class="lg-link" onclick="go('messages')">All messages</a></div><div id="oneHomeMsgs" class="one-msgs"></div></section>`;
  renderOneHomeMessages();
  if(typeof checkOnboardingActivation === 'function') checkOnboardingActivation();
  try{ renderGetStartedCard(); }catch(e){}
  try{ renderPhoneNotifNudge(); }catch(e){}
  try{ if(typeof renderWeeklyRecapCard === 'function') renderWeeklyRecapCard(); }catch(e){}
  if(typeof booksAfterHome === 'function') booksAfterHome();
}
renderHomeV2 = renderOneHome;
