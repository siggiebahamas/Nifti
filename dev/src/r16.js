/* ===== Round 16 =====
   1. Orders: one list grouped by customer or supplier, with a date beside every order (theme 2 with dates).
      Light blue now means "waiting on them". Pictures without a photo are plain white circles, so only dates carry colour.
   2. Customers & suppliers page removed. Its people, invites and buttons live at the bottom of Orders.
   3. Global search and old links that opened Customers & suppliers now open Orders. */

const NFO = {side: 'all', band: null, q: '', table: false, t: 0};
const NFO_BANDS = [['red', 'Needs you now'], ['yel', 'Coming up'], ['blue', 'Waiting on them'], ['green', 'All good']];
const NFO_RANK = {red: 0, yel: 1, blue: 2, green: 3};
const NFO_MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function nfoE(s){ return typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s); }
function nfoPeso(n){ return '₱' + Math.round(Number(n) || 0).toLocaleString('en-PH'); }
function nfoD(d){ return d ? daysBetween(APP_TODAY, String(d).slice(0, 10)) : null; } // days from today: + is later, − is earlier
function nfoIn(n){ return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n === -1 ? 'yesterday' : n > 1 ? `in ${n} days` : `${-n} days ago`; }
function nfoAgo(d){ const n = -(nfoD(d) || 0); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`; }
function nfoHist(o, re){ const h = (o.history || []).filter(x => re.test(String(x.action || x.text || ''))); const x = h[h.length - 1]; return x ? String(x.date || '').slice(0, 10) || null : null; }
function nfoLast(o){ const h = o.history || [], x = h[h.length - 1]; return (x && String(x.date || '').slice(0, 10)) || o.updatedDate || o.createdDate || APP_TODAY; }
function nfoItems(o){ return (o.lineItems || []).map(l => `${Number(l.qty) || 0} × ${l.product || ''}`).join(', '); }

/* one order → what it means today */
function nfoRow(o, unpaid){
  const sell = sideOfPo(o) === 'supplier', st = o.status, who = sell ? o.buyerName : o.supplierName, pid = sell ? o.buyerId : o.supplierId;
  const inv = o.invoice, paid = st === 'paid' || (inv && inv.status === 'paid'), total = poTotal(o), rd = o.requestedDeliveryDate, dRd = nfoD(rd);
  const amend = typeof pendingAmendment === 'function' && pendingAmendment(o), rma = o.rma && o.rma.status === 'open';
  const r = {o, id: o.id, sell, who, pid, total, amt: total, amtL: 'order', items: nfoItems(o), btn: '', act: 'open', tone: ''};
  const set = (step, turn, band, date, when, todo, btn, act) => Object.assign(r, {step, turn, band, date: String(date || o.createdDate || APP_TODAY).slice(0, 10), when, todo, btn: btn || '', act: act || 'open'});
  if(paid){
    const pd = (inv && (inv.paidDate || inv.paidAt)) || o.paidDate || nfoHist(o, /paid/i) || nfoLast(o);
    if(-nfoD(pd) > 30) return null;
    set('Paid', 'done', 'green', pd, `Paid ${nfoAgo(pd)}.`, 'All done.'); r.amtL = 'paid'; r.tone = 'green'; return r;
  }
  if(sell){
    if(amend){ set('Change asked', 'you', 'yel', nfoLast(o), 'They want to change this order.', 'Say yes or no.', 'Answer'); return r; }
    if(rma){ set('Return', 'you', 'red', nfoLast(o), 'They returned something.', 'Settle it with a credit or a replacement.', 'Settle it'); r.tone = 'red'; return r; }
    switch(st){
      case 'sent': { const d = rd ? dRd : null; set('To confirm', 'you', d != null && d <= 1 ? 'red' : 'yel', rd || o.createdDate,
        d == null ? `New order came ${nfoAgo(o.createdDate)}.` : d < 0 ? `Needed ${-d} day${d === -1 ? '' : 's'} ago.` : d === 0 ? 'Needed today.' : `Needed ${nfoIn(d)}.`, 'Say yes, or change it.', 'Answer'); r.amtL = 'new order'; if(d != null && d <= 1) r.tone = 'red'; return r; }
      case 'quote': { const hu = o.quote && o.quote.hold_until, d = nfoD(hu);
        set('To confirm', 'them', 'blue', hu || o.createdDate, hu ? (d < 0 ? 'Price hold ended.' : d === 0 ? 'Price hold ends today.' : `Price hold ends ${nfoIn(d)}.`) : `Sent ${nfoAgo(o.createdDate)}.`, 'Waiting for their OK.', 'Remind them', 'msg'); r.amtL = 'for their OK'; return r; }
      case 'countered': set('To confirm', 'them', 'blue', nfoLast(o), `You offered a new price ${nfoAgo(nfoLast(o))}.`, 'Waiting for their answer.', 'Message', 'msg'); return r;
      case 'confirmed': case 'preparing': { const late = dRd != null && dRd <= 0;
        set('Preparing', 'you', late ? 'red' : 'yel', rd || nfoLast(o), dRd == null ? 'Confirmed.' : dRd < 0 ? `${-dRd} day${dRd === -1 ? '' : 's'} late.` : dRd === 0 ? 'Deliver today.' : `Deliver ${nfoIn(dRd)}.`,
          st === 'confirmed' ? 'Start packing it.' : 'Pack it and send it out.', st === 'confirmed' ? 'Start preparing' : 'Send it out'); if(late) r.tone = 'red'; return r; }
      case 'shipped': case 'in_customs': { const late = dRd != null && dRd < 0;
        set('On the way', 'them', late ? 'red' : 'blue', rd || nfoLast(o), dRd == null ? 'On the way.' : late ? `${-dRd} day${dRd === -1 ? '' : 's'} late.` : dRd === 0 ? 'Arrives today.' : `Arrives ${nfoIn(dRd)}.`,
          late ? 'Tell them when it will arrive.' : 'On the way to them.', 'Message', 'msg'); if(late) r.tone = 'red'; return r; }
      case 'delivered': case 'partially_delivered': { const dd = nfoHist(o, /deliver|received/i) || rd || nfoLast(o), ago = -(nfoD(dd) || 0);
        set('Delivered', 'you', ago >= 3 ? 'red' : 'yel', dd, `Delivered ${nfoAgo(dd)},`, st === 'partially_delivered' ? 'part of it. Settle the short items, then bill.' : 'not billed yet. Send the bill so they can pay.', 'Send the bill');
        r.amtL = 'not billed'; if(ago >= 3) r.tone = 'red'; return r; }
      case 'invoiced': { const u = unpaid[o.id], due = (u && u.due) || (inv && inv.dueDate), d = nfoD(due); r.amt = u ? u.balance : total; r.amtL = 'owes you';
        if(typeof poHasPaymentsAwaitingSupplier === 'function' && poHasPaymentsAwaitingSupplier(o)){ set('Billed', 'you', 'red', due || nfoLast(o), 'They say they paid.', 'Check your bank or GCash, then confirm it.', 'Check payment'); r.tone = 'red'; return r; }
        if(d != null && d < 0){ set('Billed', 'you', 'red', due, `${-d} day${d === -1 ? '' : 's'} late.`, 'Remind them to pay.', 'Remind them', 'msg'); r.tone = 'red'; return r; }
        set('Billed', 'them', 'blue', due || nfoLast(o), d == null ? 'Billed.' : d === 0 ? 'Due today.' : `Due ${nfoIn(d)}.`, 'Waiting for their payment.', 'Message', 'msg'); return r; }
    }
    set('Open', 'them', 'blue', nfoLast(o), 'In progress.', ''); return r;
  }
  // buying from a supplier
  if(amend){ set('Change asked', 'them', 'blue', nfoLast(o), 'You asked for a change.', 'Waiting for their answer.', 'Message', 'msg'); return r; }
  if(rma){ set('Return', 'them', 'blue', nfoLast(o), 'You returned something.', 'Waiting for them to settle it.', 'Message', 'msg'); return r; }
  switch(st){
    case 'draft': set('Draft', 'you', 'yel', o.createdDate, `Made ${nfoAgo(o.createdDate)},`, 'not sent yet. Check it and send it.', 'Send it'); r.amtL = 'draft'; return r;
    case 'sent': { const seen = nfoHist(o, /seen/i); set('To confirm', 'them', 'blue', seen || o.createdDate, seen ? `Seen ${nfoAgo(seen)}.` : `Sent ${nfoAgo(o.createdDate)}.`, 'Waiting for their yes.', 'Message', 'msg'); return r; }
    case 'quote': set('To confirm', 'you', 'yel', o.createdDate, `Their price came ${nfoAgo(o.createdDate)}.`, 'Say yes, or ask for changes.', 'See price'); r.amtL = 'their price'; return r;
    case 'countered': set('To confirm', 'you', 'yel', nfoLast(o), `New price came ${nfoAgo(nfoLast(o))}.`, 'Accept it, or offer yours.', 'Answer'); r.amtL = 'their offer'; return r;
    case 'confirmed': case 'preparing': {
      if(typeof getBuyerNextAction === 'function' && getBuyerNextAction(o) === 'Pay the deposit'){ set('Preparing', 'you', 'yel', nfoLast(o), 'They asked for a deposit.', 'Pay it so they can start.', 'Pay deposit'); return r; }
      const late = dRd != null && dRd < 0;
      set('Preparing', 'them', late ? 'red' : 'blue', rd || nfoLast(o), dRd == null ? 'Confirmed.' : late ? `${-dRd} day${dRd === -1 ? '' : 's'} late.` : dRd === 0 ? 'Arrives today.' : `Arrives ${nfoIn(dRd)}.`,
        late ? 'Ask them when it will come.' : 'They are packing it.', late ? 'Ask them' : 'Message', 'msg'); if(late) r.tone = 'red'; return r; }
    case 'shipped': case 'in_customs': {
      if(o.deliveryConfirmation){ set('On the way', 'them', 'blue', nfoLast(o), `Received ${nfoAgo(nfoLast(o))}.`, 'Waiting for their bill.', 'Message', 'msg'); return r; }
      const now = dRd != null && dRd <= 0;
      set('On the way', 'you', now ? 'red' : 'yel', rd || nfoLast(o), dRd == null ? 'On the way.' : dRd < 0 ? `${-dRd} day${dRd === -1 ? '' : 's'} late.` : dRd === 0 ? 'Arrives today.' : `Arrives ${nfoIn(dRd)}.`,
        'Count what came so your stock updates.', 'Count it'); if(now) r.tone = 'red'; return r; }
    case 'delivered': case 'partially_delivered': { const dd = nfoHist(o, /deliver|received/i) || rd || nfoLast(o);
      set('Delivered', 'them', 'blue', dd, `Received ${nfoAgo(dd)}.`, 'Waiting for their bill.', 'Message', 'msg'); return r; }
    case 'invoiced': { const u = unpaid[o.id], due = (u && u.due) || (inv && inv.dueDate), d = nfoD(due); r.amt = u ? u.balance : total; r.amtL = 'you owe';
      if(u && u.pending > 0 && u.balance - u.pending <= 0.5){ set('Billed', 'them', 'blue', due || nfoLast(o), 'You paid.', 'Waiting for them to confirm it.', 'Message', 'msg'); return r; }
      const hot = d != null && d <= 0;
      set('Billed', 'you', hot ? 'red' : 'yel', due || nfoLast(o), d == null ? 'Bill came.' : d < 0 ? `${-d} day${d === -1 ? '' : 's'} late.` : d === 0 ? 'Due today.' : `Due ${nfoIn(d)}.`, 'Pay this bill.', 'Pay'); if(hot) r.tone = 'red'; return r; }
  }
  set('Open', 'them', 'blue', nfoLast(o), 'In progress.', ''); return r;
}
function nfoAll(){
  const unpaid = {}; try{ ['supplier', 'buyer'].forEach(role => unpaidInvoicesFor(role).forEach(x => { if(x.po) unpaid[x.po.id] = x; })); }catch(e){}
  return purchaseOrders.filter(o => o && o.status !== 'cancelled' && ((o.supplierId === ME_SUPPLIER && o.buyerId !== ME_BUYER) || o.buyerId === ME_BUYER))
    .map(o => { try{ return nfoRow(o, unpaid); }catch(e){ console.warn('nfoRow', o && o.id, e); return null; } }).filter(Boolean);
}
function nfoMatch(r){
  if(NFO.side !== 'all' && (NFO.side === 'sell') !== r.sell) return false;
  const q = NFO.q.trim().toLowerCase(); if(!q) return true;
  return [r.who, r.o.poNumber, r.items].some(x => String(x || '').toLowerCase().includes(q));
}

/* people */
function nfoPerson(sell, id, name){
  const list = (sell ? buyersData : suppliersData) || [], s = list.find(x => x.id === id) || {id, name};
  let rel = null; try{ rel = computeCounterpartReliability(id, sell); }catch(e){}
  let un = []; try{ un = unpaidInvoicesFor(sell ? 'supplier' : 'buyer').filter(x => x.po && (sell ? x.po.buyerId : x.po.supplierId) === id); }catch(e){}
  const unbilled = sell ? purchaseOrders.filter(o => o.buyerId === id && o.supplierId === ME_SUPPLIER && !o.invoice && ['delivered', 'partially_delivered'].includes(o.status)).reduce((a, o) => a + poTotal(o), 0) : 0;
  return {s, rel, owe: un.reduce((a, x) => a + (Number(x.balance) || 0), 0), unbilled, late: un.some(x => x.daysOverdue > 0)};
}
function nfoAv(name){
  const p = typeof nfPhotoFor === 'function' ? nfPhotoFor(name) : null;
  return p ? `<span class="nfo-av"><img alt="" src="${p}"></span>` : `<span class="nfo-av ini" aria-hidden="true">${nfoE(typeof nfInitials === 'function' ? nfInitials(name) : String(name || '?').slice(0, 2).toUpperCase())}</span>`;
}
function nfoSideTag(sell){ return `<span class="nfo-side ${sell ? 'c' : 's'}">${sell ? 'Customer' : 'Supplier'}</span>`; }
function nfoFacts(p, sell){
  const s = p.s, bits = [];
  if(s.orders) bits.push(`<b>${s.orders}</b> orders`);
  if(s.lastOrder) bits.push(`last <b>${nfoE(s.lastOrder)}</b>`);
  if(p.rel && p.rel.status === 'ok') bits.push(`${sell ? 'pays on time' : 'on time'} <b>${p.rel.score}</b>/100`);
  return bits.join(' · ') || nfoE(s.category || '');
}

/* actions */
function nfoOpen(id){ const o = getPO(id); if(!o) return; const sell = sideOfPo(o) === 'supplier'; try{ setLens(sell ? 'supplier' : 'buyer'); }catch(e){} currentAppRole = sell ? 'supplier' : 'buyer'; openOrderDetailModal(id, sell); }
function nfoNew(sell, id){ currentAppRole = sell ? 'supplier' : 'buyer'; if(typeof nfwOpen === 'function') nfwOpen(sell ? 'sell' : 'buy', id ? (sell ? {buyerId: id} : {supplierId: id}) : null); else if(sell) openCustomerPoImport(); else startCreatePO(); }
function nfoChat(id, sell){ if(typeof nfChat === 'function') nfChat(id, sell); else go('messages'); }
function nfoInvite(sell){ currentAppRole = sell ? 'supplier' : 'buyer'; navigate('invite'); }
function nfoSet(k, v){ if(k === 'band') NFO.band = NFO.band === v ? null : v; else NFO[k] = v; nfoPaint(); }
function nfoTable(){ NFO.table = !NFO.table; const pg = document.getElementById('page-orders'); if(pg) pg.classList.toggle('nfo-table', NFO.table);
  const b = document.getElementById('nfoTblBtn'); if(b) b.textContent = NFO.table ? 'Hide the table' : 'See every order in a table, with filters and export';
  if(NFO.table){ const h = document.querySelector('#page-orders > .nf-half'); if(h) h.scrollIntoView({behavior: 'smooth', block: 'start'}); } }

/* drawing */
function nfoTile(r){
  const [y, m, d] = r.date.split('-').map(Number), today = r.date === APP_TODAY;
  return `<span class="nfo-dt ${today ? 'today' : r.band}" title="${nfoE(new Date(y, m - 1, d).toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'}))}"><span class="m">${today ? 'TODAY' : NFO_MON[m - 1]}</span><span class="d">${d}</span></span>`;
}
function nfoBtn(r){
  if(!r.btn) return r.turn === 'done' ? `<span class="nfo-done">✓ Done</span>` : '<span></span>';
  const on = r.act === 'msg' ? `nfMessage('${r.id}')` : `nfoOpen('${r.id}')`;
  return `<button type="button" class="btn ${r.turn === 'you' ? 'btn-primary' : 'btn-outline'} nfo-b" onclick="event.stopPropagation(); ${on}">${nfoE(r.btn)}</button>`;
}
function nfoPo(r, last){
  return `<div class="nfo-d${last ? ' last' : ''}">${nfoTile(r)}</div>
    <div class="nfo-po b-${r.band}" role="button" tabindex="0" onclick="nfoOpen('${r.id}')" onkeydown="if(event.key==='Enter')nfoOpen('${r.id}')">
      <div class="nfo-pm"><div class="l1"><span class="n">${nfoE(r.o.poNumber || '')}</span><span class="nfo-step t-${r.turn}"><i></i>${nfoE(r.step)}</span><span class="it">${nfoE(r.items)}</span></div>
        <div class="l2"><span class="when ${r.tone}">${nfoE(r.when)}</span> ${nfoE(r.todo)}</div></div>
      <div class="nfo-amt">${nfoPeso(r.amt)}<span class="l">${nfoE(r.amtL)}</span></div>${nfoBtn(r)}</div>`;
}
function nfoGroups(rows){
  const by = new Map(); rows.forEach(r => { const k = (r.sell ? 'c:' : 's:') + (r.pid || r.who); if(!by.has(k)) by.set(k, []); by.get(k).push(r); });
  return [...by.values()].map(os => { os.sort((a, b) => a.date.localeCompare(b.date)); const band = os.map(o => o.band).sort((x, y) => NFO_RANK[x] - NFO_RANK[y])[0];
    return {os, band, sell: os[0].sell, pid: os[0].pid, who: os[0].who, first: os.filter(o => o.band === band).map(o => o.date).sort()[0]}; })
    .sort((a, b) => NFO_RANK[a.band] - NFO_RANK[b.band] || a.first.localeCompare(b.first));
}
function nfoGroupHtml(g){
  const p = nfoPerson(g.sell, g.pid, g.who);
  return `<div class="nfo-pc"><div class="nfo-tl">
    <div class="nfo-a">${nfoAv(g.who)}</div>
    <div class="nfo-h"><div class="nfo-hm"><div class="nm"><b>${nfoE(g.who)}</b>${nfoSideTag(g.sell)}</div><div class="fx">${nfoFacts(p, g.sell)}</div></div>
      <div class="nfo-money${p.late ? ' r' : ''}"><b>${nfoPeso(p.owe || p.unbilled)}</b><span class="l">${g.sell ? (p.owe ? 'owes you' : p.unbilled ? 'not billed yet' : 'owes nothing') : (p.owe ? 'you owe' : 'you owe nothing')}</span></div></div>
    ${g.os.map((r, i) => nfoPo(r, i === g.os.length - 1)).join('')}
    <div class="nfo-more"><button type="button" onclick="nfoChat('${g.pid}', ${g.sell})">Message</button><button type="button" onclick="nfoNew(${g.sell}, '${g.pid}')">New order</button></div>
  </div></div>`;
}
function nfoPeopleHtml(all){
  const busy = new Set(all.map(r => (r.sell ? 'c:' : 's:') + r.pid));
  const list = [...(buyersData || []).map(s => ({s, sell: true})), ...(suppliersData || []).map(s => ({s, sell: false}))]
    .filter(x => !busy.has((x.sell ? 'c:' : 's:') + x.s.id) && (NFO.side === 'all' || (NFO.side === 'sell') === x.sell) && (!NFO.q.trim() || x.s.name.toLowerCase().includes(NFO.q.trim().toLowerCase())));
  const row = x => { const p = nfoPerson(x.sell, x.s.id, x.s.name);
    return `<div class="nfo-pp"><span class="nfo-ppa">${nfoAv(x.s.name)}</span><div class="nfo-ppm"><div class="nm"><b>${nfoE(x.s.name)}</b>${nfoSideTag(x.sell)}</div><div class="fx">${[x.s.category ? nfoE(x.s.category) : '', nfoFacts(p, x.sell)].filter(Boolean).join(' · ')}</div></div>
      <div class="nfo-ppb">${x.s.isOutside ? `<button type="button" class="btn btn-outline btn-sm" onclick="currentAppRole='${x.sell ? 'supplier' : 'buyer'}'; resendInvite('${x.s.id}')">Invite to Nifti</button>` : `<button type="button" class="btn btn-outline btn-sm" onclick="nfoChat('${x.s.id}', ${x.sell})">Message</button>`}
        <button type="button" class="btn btn-outline btn-sm" onclick="nfoNew(${x.sell}, '${x.s.id}')">New order</button></div></div>`; };
  return `<section class="nfo-people" id="nfoPeople"><div class="nfo-ph"><div><h2>No open orders</h2><p>Customers and suppliers with nothing going on right now.</p></div>
      <div class="nfo-inv"><button type="button" class="btn btn-outline btn-sm" onclick="nfoInvite(true)">+ Invite a customer</button><button type="button" class="btn btn-outline btn-sm" onclick="nfoInvite(false)">+ Invite a supplier</button></div></div>
    ${list.length ? `<div class="nfo-pl">${list.map(row).join('')}</div>` : `<p class="nfo-none">Everyone has an order going.</p>`}</section>`;
}
function nfoPaint(){
  const host = document.getElementById('nfOrd'); if(!host) return;
  const all = nfoAll(), seen = all.filter(nfoMatch), vis = seen.filter(r => !NFO.band || r.band === NFO.band);
  const st = document.getElementById('nfoStats');
  if(st) st.innerHTML = NFO_BANDS.map(([b, l]) => { const rs = seen.filter(r => r.band === b), sum = rs.reduce((a, r) => a + (Number(r.amt) || 0), 0);
    return `<button type="button" class="nfo-st s-${b}${NFO.band === b ? ' on' : ''}" aria-pressed="${NFO.band === b}" onclick="nfoSet('band','${b}')"><span class="k"><i></i>${l}</span><b>${rs.length}<span> order${rs.length === 1 ? '' : 's'}</span></b><em${rs.length ? '' : ' class="z"'}>${rs.length ? nfoPeso(sum) : 'Nothing'}</em></button>`; }).join('');
  const ch = document.getElementById('nfoChips');
  if(ch) ch.innerHTML = [['all', 'Everything', all.length], ['sell', 'Selling', all.filter(r => r.sell).length], ['buy', 'Buying', all.filter(r => !r.sell).length]]
    .map(([k, l, n]) => `<button type="button" class="${NFO.side === k ? 'on' : ''}" aria-pressed="${NFO.side === k}" onclick="nfoSet('side','${k}')">${l}<b>${n}</b></button>`).join('');
  const G = nfoGroups(vis), body = document.getElementById('nfoBody');
  if(body) body.innerHTML = all.length ? `<div class="nfo-card">${NFO_BANDS.map(([b, h]) => { const g = G.filter(x => x.band === b); if(!g.length) return '';
      return `<div class="nfo-band b-${b}"><span>${h}</span><b>${vis.filter(r => r.band === b).length}</b></div>${g.map(nfoGroupHtml).join('')}`; }).join('') || `<div class="nfo-empty">Nothing matches. <button type="button" onclick="NFO.q=''; NFO.band=null; NFO.side='all'; nfoRender()">Show everything</button></div>`}</div>
      <div class="nfo-key"><span><i class="k-red"></i>Late or today: do it now</span><span><i class="k-yel"></i>Coming up</span><span><i class="k-blue"></i>Waiting on them</span><span><i class="k-green"></i>Done</span><span><i class="k-today"></i>Today</span></div>`
    : `<div class="nfo-card"><div class="nfo-empty">No orders yet. Tap <b>Customer's order</b> or <b>Order from a supplier</b> to start.</div></div>`;
  const pp = document.getElementById('nfoPeopleWrap'); if(pp) pp.innerHTML = nfoPeopleHtml(all);
}
function nfoRender(){
  const pg = document.getElementById('page-orders'); if(!pg) return;
  pg.classList.add('nfo-on'); pg.classList.toggle('nfo-table', NFO.table);
  let host = document.getElementById('nfOrd'); if(!host){ host = document.createElement('div'); host.id = 'nfOrd'; pg.insertBefore(host, pg.firstChild); }
  const a = document.activeElement, typing = a && a.id === 'nfoQ', pos = typing ? a.selectionStart : 0;
  const t = new Date(APP_TODAY + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'});
  host.innerHTML = `<div class="nfo-top"><div><h1>Orders</h1><p>Who needs you, and their orders under them. Today is <b>${t}</b>.</p></div>
      <div class="nfo-acts"><button type="button" class="btn btn-outline" onclick="nfoNew(true)">+ Customer's order</button><button type="button" class="btn btn-primary" onclick="nfoNew(false)">+ Order from a supplier</button></div></div>
    <div class="nfo-stats" id="nfoStats"></div>
    <div class="nfo-flt"><div class="nfo-chips" id="nfoChips" role="group" aria-label="Show"></div>
      <label class="nfo-q"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="nfoQ" type="search" placeholder="Search name, order # or item" value="${nfoE(NFO.q)}" autocomplete="off" oninput="NFO.q=this.value; nfoPaint()"></label></div>
    <div id="nfoBody"></div>
    <div id="nfoPeopleWrap"></div>
    <button type="button" class="nfo-tbl" id="nfoTblBtn" onclick="nfoTable()">${NFO.table ? 'Hide the table' : 'See every order in a table, with filters and export'}</button>`;
  nfoPaint();
  if(typing){ const q = document.getElementById('nfoQ'); if(q){ q.focus(); try{ q.setSelectionRange(pos, pos); }catch(e){} } }
}
function nfoSoon(){ clearTimeout(NFO.t); NFO.t = setTimeout(() => { const pg = document.getElementById('page-orders'); if(pg && pg.classList.contains('active')) nfoRender(); }, 80); }

(function(){
  const base = nfOrdersBoth;
  nfOrdersBoth = function(){ try{ base.apply(this, arguments); }catch(e){ console.warn(e); } try{ nfoRender(); }catch(e){ console.warn('orders', e); } };
  ['renderOrdersTable', 'renderSupplierOrdersTable'].forEach(fn => { const f = window[fn]; if(typeof f !== 'function' || f._nfo) return; const w = function(){ const r = f.apply(this, arguments); nfoSoon(); return r; }; w._nfo = true; window[fn] = w; });
  // the old Customers & suppliers page now opens Orders, at the people list
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf16){
    const w = function(page){ if(page === 'suppliers'){ const r = nav.call(this, 'orders'); setTimeout(() => { const el = document.getElementById('nfoPeople'); if(el) el.scrollIntoView({block: 'start'}); }, 120); return r; } return nav.apply(this, arguments); };
    Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf16 = true; window.navigate = w;
  }
  try{ jumpToParty = function(id, side){ const r = document.getElementById('globalSearchResults'), i = document.getElementById('globalSearchInput'); if(r) r.classList.add('hidden'); if(i) i.value = '';
    const p = [...(buyersData || []), ...(suppliersData || [])].find(x => x.id === id); NFO.q = p ? p.name : ''; NFO.band = null; NFO.side = 'all'; navigate('orders'); }; }catch(e){}
})();
