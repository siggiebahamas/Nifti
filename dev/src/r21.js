/* ===== Round 21 ===== */

/* ---------- 1. Orders: every order sits under its own band, so the count above it matches ---------- */
// A customer used to be listed once, under their most urgent order, with all their orders under it.
// So "Needs you now · 1" could show 2 orders, and "Waiting on them · 2" could show 1.
// Now each band lists only the orders in that band; a customer can appear in two bands.
function nf21Col(sell, all, vis){
  const k = sell ? 'c' : 's', mine = vis.filter(r => r.sell === sell), money = nf20ColMoney(sell, all.filter(r => r.sell === sell));
  const ppl = new Set(mine.map(r => r.pid)).size;
  const bands = NFO_BANDS.map(([b, h]) => { const rows = mine.filter(r => r.band === b); if(!rows.length) return '';
    const g = nfoGroups(rows);
    return `<div class="nfo-band b-${b}"><span>${h}</span><b>${rows.length}</b></div>${typeof nfoCapGroups === 'function' ? nfoCapGroups(b, g) : g.map(nfoGroupHtml).join('')}`; }).join('');
  return `<section class="nf20-col ${k}" id="nf20Col${k.toUpperCase()}">
    <header class="nf20-ch"><span class="nf20-ci">${NF20_ARROW[k]}</span><div class="nf20-ct"><b>${sell ? 'Selling to customers' : 'Buying from suppliers'}</b><small>${mine.length} order${mine.length === 1 ? '' : 's'} · ${ppl} ${sell ? (ppl === 1 ? 'customer' : 'customers') : (ppl === 1 ? 'supplier' : 'suppliers')}</small></div>
      <div class="nf20-cm"><b>${nfoPeso(money)}</b><small>${sell ? 'owed to you' : 'you owe'}</small></div>
      <button type="button" class="btn btn-sm nf20-new" onclick="nfoNew(${sell})">+ New order</button></header>
    <div class="nfo-card">${bands || `<div class="nfo-empty">${NFO.q || NFO.band ? 'Nothing matches here.' : `No ${sell ? 'customer' : 'supplier'} orders going.`} <button type="button" onclick="nfoNew(${sell})">+ New order</button></div>`}</div>
    ${nf20Idle(sell, all)}
  </section>`;
}

/* ---------- 2. Credits: given, taken off the next bill by itself, recorded on both sides ---------- */
// How it works now, in one line each:
//  - Give a customer a credit: it waits on their account.
//  - Send their next bill: Nifti takes the credit off that bill by itself.
//  - Already have an open bill? One tap ("Take ₱1,200 off INV-0418") takes it off now.
//  - A supplier gave you a credit (even one not on Nifti)? Add it with a photo of their credit slip.
// Every credit is recorded on the bill as a "Credit" line, so the bill, the customer's statement,
// your sales and both sides' books all show the lower amount.
const NF21_WHY = ['Damaged goods', 'Expired / near expiry', 'Wrong item', 'Short delivery', 'Price correction', 'Goodwill', 'Other'];
const NF21_LOCAL = () => 'nifti-supplier-credits-' + ((typeof myBusiness !== 'undefined' && myBusiness && myBusiness.id) || 'demo');
function nf21Local(){ if(!myBusiness) return []; try{ return JSON.parse(localStorage.getItem(NF21_LOCAL()) || '[]') || []; }catch(e){ return []; } }
function nf21SaveLocal(list){ try{ localStorage.setItem(NF21_LOCAL(), JSON.stringify(list)); return true; }catch(e){ showToast("Couldn't save on this phone. It may be full.", 'error'); return false; } }
// a credit you gave a customer (you are the seller); anything else is a credit a supplier gave you
function nf21Side(m){ return !m._manual && m.supplier_business_id === ME_SUPPLIER; }
function nf21Party(m, sell){
  const id = sell ? m.buyer_business_id : m.supplier_business_id;
  const list = (sell ? buyersData : suppliersData) || [], p = list.find(x => x.id === id);
  if(p) return p.name;
  const po = (sell ? getSupplierPOs() : getBuyerPOs()).find(x => (sell ? x.buyerId : x.supplierId) === id);
  return po ? (sell ? po.buyerName : po.supplierName) : (m._party || 'Partner');
}
function nf21Bills(sell, partyId){
  return (sell ? getSupplierPOs().filter(po => po.buyerId === partyId) : getBuyerPOs().filter(po => po.supplierId === partyId))
    .filter(po => po.invoice && !['paid', 'cancelled'].includes(po.status))
    .map(po => { const c = computeInvoicePayments(po); return {po, room: Math.round((c.balance - (c.pendingAmount || 0)) * 100) / 100}; })
    .filter(x => x.room >= 1).sort((a, b) => String(a.po.invoice.dueDate || '').localeCompare(String(b.po.invoice.dueDate || '')));
}
// takes `amt` of credit m off po's bill, on the side given; no questions asked (callers confirm)
async function nf21Take(m, po, sell, amt){
  if(myBusiness && sell && !m._local){ const {error} = await sb.rpc('use_credit_memo', {p_memo: m.id, p_amount: amt, p_po: po.id}); if(error){ showToast(error.message, 'error'); return false; } }
  m.remaining = Math.round((Number(m.remaining) - amt) * 100) / 100;
  if(m.remaining <= 0.005){ m.remaining = 0; m.status = 'applied'; }
  if(m._local) nf21SaveLocal(nf21Local().map(x => x.id === m.id ? m : x));
  snapshotPO(po);
  paymentListFor(po, 'invoice').push({id: newRecordId(), method: 'credit_note', amount: amt, reference: m.number, checkDate: null, date: APP_TODAY, confirmStatus: 'confirmed', confirmedAt: APP_TODAY, submittedBy: sell ? 'supplier' : 'buyer'});
  settleInvoiceStatus(po);
  poLogHistory(po, sell ? 'supplier' : 'buyer', `Credit ${m.number} taken off this bill: ${fmtPHP(amt)}`);
  try{ logAudit('credit_used', 'creditMemo', m.id, 'po', null, po.poNumber + ' ' + amt); }catch(e){}
  afterPaymentChange(po);
  if(myBusiness && !m._local) creditMemosCache = null;
  return true;
}
async function nf21Use(memoId, poId){
  const m = (await loadCreditMemos()).find(x => x.id === memoId), po = getPO(poId); if(!m || !po) return;
  const sell = nf21Side(m), c = computeInvoicePayments(po), room = Math.round((c.balance - (c.pendingAmount || 0)) * 100) / 100, amt = Math.min(Number(m.remaining), room);
  if(!(amt >= 0.5)){ showToast('That bill has nothing left to pay.', 'warn'); return; }
  const bill = po.invoice.number || po.poNumber, who = sell ? po.buyerName : po.supplierName;
  if(!confirm(`Take ${fmtPHP(amt)} off bill ${bill}?\n\n${sell ? who + ' will owe' : 'You will owe ' + who} ${fmtPHP(room - amt)} on this bill.${Number(m.remaining) - amt >= 0.5 ? `\n${fmtPHP(Number(m.remaining) - amt)} of the credit stays for the next bill.` : ''}`)) return;
  if(await nf21Take(m, po, sell, amt)){ showToast(`${fmtPHP(amt)} taken off ${bill}. The bill, ${sell ? 'their statement' : 'what you owe'} and the books are updated.${myBusiness && !sell ? ' (prototype)' : ''}`, 'success'); renderReturnsPage(); }
}
// a new bill picks up any credit waiting for that customer (or from that supplier) by itself
async function nf21AutoTake(poId){
  const po = getPO(poId); if(!po || !po.invoice) return;
  const memos = await loadCreditMemos(); let total = 0;
  const sell = sideOfPo(po) === 'supplier';
  const open = memos.filter(m => m.status === 'open' && Number(m.remaining) >= 0.5 && (sell ? (nf21Side(m) && m.buyer_business_id === po.buyerId) : (!nf21Side(m) && m.supplier_business_id === po.supplierId)));
  for(const m of open){ const c = computeInvoicePayments(po), room = Math.round((c.balance - (c.pendingAmount || 0)) * 100) / 100; if(room < 1) break;
    const amt = Math.min(Number(m.remaining), room); if(await nf21Take(m, po, sell, amt)) total += amt; }
  if(total >= 0.5) showNotificationToast(`${fmtPHP(total)} credit taken off ${po.invoice.number || po.poNumber} by itself.`);
}
// a credit from a supplier, typed in by you, with a photo of their credit slip as proof
const NF21P = {photo: null};
function nf21PickPhoto(inp){
  const f = inp.files && inp.files[0]; if(!f) return;
  const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => {
      const s = Math.min(1, 1100 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); NF21P.photo = c.toDataURL('image/jpeg', 0.72);
      const pv = document.getElementById('sc21Prev'); if(pv) pv.innerHTML = `<img src="${NF21P.photo}" alt="Credit slip photo"><button type="button" class="nfc-link" onclick="NF21P.photo=null; this.parentElement.innerHTML=''">Remove</button>`; };
    img.src = r.result; }; r.readAsDataURL(f);
}
async function nf21SaveSupplierCredit(){
  const sel = document.getElementById('sc21Sup'), amtEl = document.getElementById('sc21Amt'); if(!sel || !amtEl) return;
  const amt = Math.round(Number(amtEl.value) * 100) / 100;
  if(!(amt > 0)){ markFieldInvalid('sc21Amt', 'Type the credit amount from their slip.'); return; }
  const sup = (suppliersData || []).find(s => s.id === sel.value) || {id: sel.value, name: sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : 'Supplier'};
  const ref = (document.getElementById('sc21Ref').value || '').trim();
  const m = {id: 'scm' + Date.now(), buyer_business_id: ME_BUYER, supplier_business_id: sup.id, number: ref || 'SC-' + String(Date.now()).slice(-5), amount: amt, remaining: amt,
    reason: document.getElementById('sc21Why').value, status: 'open', created_at: new Date().toISOString(), _party: sup.name, _proof: NF21P.photo, _manual: true, _local: !!myBusiness};
  if(myBusiness){ const l = nf21Local(); l.unshift(m); if(!nf21SaveLocal(l)) return; creditMemosCache = null; }
  else demoCreditMemos.unshift(m);
  NF21P.photo = null;
  const bills = nf21Bills(false, sup.id);
  showToast(`Saved. ${fmtPHP(amt)} from ${sup.name} ${bills.length ? `can come off bill ${bills[0].po.invoice.number || bills[0].po.poNumber} now. Tap "Take it off" below.` : 'comes off your next bill from them by itself.'}${myBusiness ? ' (prototype: kept on this device)' : ''}`, 'success');
  renderReturnsPage();
}
function nf21Proof(id){
  loadCreditMemos().then(list => { const m = list.find(x => x.id === id); if(!m || !m._proof) return;
    let ov = document.getElementById('nf21Pv'); if(!ov){ ov = document.createElement('div'); ov.id = 'nf21Pv'; ov.className = 'nf20-ov nf21-pv'; ov.addEventListener('click', e => { if(e.target === ov || e.target.closest('.nf20-x')) ov.hidden = true; }); document.body.appendChild(ov); }
    ov.innerHTML = `<div class="nf21-pvc"><div class="nf21-pvh"><b>${escapeHtml(m._party || 'Supplier')} · ${escapeHtml(m.number)}</b><button type="button" class="nf20-x" aria-label="Close">✕</button></div><img src="${m._proof}" alt="Photo of the credit slip"></div>`; ov.hidden = false; });
}
async function nf21ReturnsPage(){
  const el = document.getElementById('returnsContent'); if(!el) return;
  const sell = currentAppRole === 'supplier';
  try{ nfDemoReturns(); }catch(e){}
  const pos = sell ? getSupplierPOs() : getBuyerPOs();
  const memos = (await loadCreditMemos()).filter(m => sell ? nf21Side(m) : (!nf21Side(m) && m.buyer_business_id === ME_BUYER));
  const since = addDaysIso(APP_TODAY, -180), rmas = pos.filter(po => po.rma && (po.rma.filedDate || po.createdDate) >= since);
  const open = memos.filter(m => m.status === 'open' && Number(m.remaining) >= 0.5), usedAmt = memos.reduce((s, m) => s + (m.status === 'void' ? 0 : Number(m.amount || 0) - Number(m.remaining || 0)), 0);
  const reasons = {}; rmas.forEach(po => { const r = po.rma.reason || 'Other'; reasons[r] = (reasons[r] || 0) + 1; }); const top = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
  const st = m => m.status === 'void' ? '<span class="nf-pill plain">Canceled</span>' : Number(m.remaining) < 0.5 ? '<span class="nf-pill good">Used</span>' : Number(m.remaining) < Number(m.amount) ? '<span class="nf-pill warn">Part used</span>' : '<span class="nf-pill warn">Not used yet</span>';
  const act = m => {
    if(m.status !== 'open' || Number(m.remaining) < 0.5) return m._proof ? `<button class="btn btn-outline btn-sm" onclick="nf21Proof('${m.id}')">See the slip</button>` : '—';
    const party = sell ? m.buyer_business_id : m.supplier_business_id, bills = nf21Bills(sell, party), b = bills[0];
    const take = b ? `<button class="btn btn-primary btn-sm" onclick="nf21Use('${m.id}','${b.po.id}')">Take ${fmtPHP(Math.min(Number(m.remaining), b.room))} off ${escapeHtml(b.po.invoice.number || b.po.poNumber)}</button>`
      : `<span class="nf21-auto">✓ Comes off ${sell ? 'their' : 'your'} next bill by itself</span>`;
    return `<div class="nf-acts">${take}${m._proof ? `<button class="btn btn-outline btn-sm" onclick="nf21Proof('${m.id}')">See the slip</button>` : ''}${sell && Number(m.remaining) === Number(m.amount) ? `<button class="nfc-link" onclick="voidCreditMemo('${m.id}')">Cancel</button>` : ''}${!sell && m._manual && Number(m.remaining) === Number(m.amount) ? `<button class="nfc-link" onclick="nf21Remove('${m.id}')">Remove</button>` : ''}</div>`;
  };
  const sorted = memos.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const buyers = [...new Map(getSupplierPOs().map(p => [p.buyerId, p.buyerName])).entries()];
  const sups = [...new Map([...(suppliersData || []).map(s => [s.id, s.name]), ...getBuyerPOs().map(p => [p.supplierId, p.supplierName])]).entries()];
  el.innerHTML = `<div class="bk-tiles">${bkTile(sell ? 'Credits waiting to be used' : 'Credits from suppliers', nfP(open.reduce((s, m) => s + Number(m.remaining || 0), 0)), `${open.length} credit${open.length === 1 ? '' : 's'}`, open.length ? 'warn' : '')}
      ${bkTile('Credits already used', nfP(usedAmt), 'taken off bills')}
      ${bkTile('Bad orders', String(rmas.length), 'last 6 months', rmas.length ? 'bad' : 'good')}
      ${bkTile('Most common problem', top ? escapeHtml(top[0]) : 'None', top ? `${top[1]} time${top[1] === 1 ? '' : 's'}` : 'nothing reported')}</div>
    ${sell ? `<section class="panel-card nf-card nfr-give"><div class="panel-head"><h2>Give a customer a credit</h2></div>
      <p class="nf21-how">It comes off their next bill by itself. Their bill, their statement, your sales and the books all show the lower amount.</p>
      <div class="nfr-form"><div class="field"><label for="cmBuyer">Customer</label><select id="cmBuyer">${buyers.map(([id, n]) => `<option value="${escapeHtml(id)}">${escapeHtml(n)}</option>`).join('')}</select></div>
        <div class="field"><label for="cmAmt">Amount (₱)</label><input id="cmAmt" type="number" min="1" step="0.01" inputmode="decimal" placeholder="0"></div>
        <div class="field"><label for="cmReason">Why</label><select id="cmReason">${NF21_WHY.map(r => `<option>${r}</option>`).join('')}</select></div>
        <button class="btn btn-primary" onclick="giveCreditMemo()">Give credit</button></div></section>`
    : `<section class="panel-card nf-card nfr-give nf21-add"><div class="panel-head"><h2>Add a credit a supplier gave you</h2></div>
      <p class="nf21-how">For any supplier, even one not on Nifti. Snap their credit slip and type the amount. It comes off your next bill from them by itself.</p>
      <div class="nfr-form"><div class="field"><label for="sc21Sup">Supplier</label><select id="sc21Sup">${sups.map(([id, n]) => `<option value="${escapeHtml(id)}">${escapeHtml(n)}</option>`).join('')}</select></div>
        <div class="field"><label for="sc21Amt">Amount (₱)</label><input id="sc21Amt" type="number" min="1" step="0.01" inputmode="decimal" placeholder="0"></div>
        <div class="field"><label for="sc21Why">Why</label><select id="sc21Why">${NF21_WHY.map(r => `<option>${r}</option>`).join('')}</select></div>
        <div class="field"><label for="sc21Ref">Their slip number <span class="nf21-opt">(if any)</span></label><input id="sc21Ref" type="text" maxlength="40" placeholder="e.g. CM-0442"></div>
        <label class="nf21-snap"><input type="file" accept="image/*" capture="environment" data-nf-cam="1" onchange="nf21PickPhoto(this)"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/></svg>Snap their credit slip</span></label>
        <div class="nf21-prev" id="sc21Prev">${NF21P.photo ? `<img src="${NF21P.photo}" alt="Credit slip photo">` : ''}</div>
        <button class="btn btn-primary" onclick="nf21SaveSupplierCredit()">Save credit</button></div></section>`}
    <section class="panel-card nf-card"><div class="panel-head"><h2>${sell ? 'Credits you gave' : 'Credits suppliers gave you'}</h2><span class="bk-dim">${memos.length} in total</span></div>
      ${sorted.length ? `<div class="lg-tbl-wrap"><table class="lg-tbl nf-tbl"><thead><tr><th>${sell ? 'Customer' : 'Supplier'}</th><th>Why</th><th>Amount</th><th>Left</th><th>Status</th><th>What to do</th></tr></thead><tbody>
        ${sorted.map(m => `<tr><td><b>${escapeHtml(nf21Party(m, sell))}</b><small class="nf-sub">${escapeHtml(m.number || '')} · ${stmtDate(m.created_at)}${m._manual ? ' · added by you' : ''}</small></td><td>${escapeHtml(m.reason || '')}</td><td>${nfP(m.amount)}</td><td><b>${nfP(m.remaining)}</b></td><td>${st(m)}</td><td>${act(m)}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="nf-empty">No credits yet.</div>`}</section>
    <section class="panel-card nf-card"><div class="panel-head"><h2>${sell ? 'Bad orders from customers' : 'Bad orders you reported'}</h2><span class="bk-dim">last 6 months</span></div>
      ${rmas.length ? `<div class="lg-tbl-wrap"><table class="lg-tbl nf-tbl"><thead><tr><th>Order</th><th>${sell ? 'Customer' : 'Supplier'}</th><th>What went wrong</th><th>Reported</th><th>Result</th></tr></thead><tbody>
        ${rmas.map(po => `<tr class="nf-click" onclick="openOrderDetailModal('${po.id}', ${sell})"><td><b>${escapeHtml(po.poNumber)}</b></td><td>${escapeHtml(sell ? po.buyerName : po.supplierName)}</td><td>${escapeHtml(po.rma.reason || '')}${po.rma.desc ? `<small class="nf-sub">${escapeHtml(po.rma.desc)}</small>` : ''}</td><td>${stmtDate(po.rma.filedDate)}</td>
          <td>${po.rma.status === 'open' ? '<span class="nf-pill bad">Open</span>' : po.rma.outcome === 'replacement' ? '<span class="nf-pill good">Replaced</span>' : '<span class="nf-pill good">Credited</span>'}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="nf-empty">No bad orders. ${sell ? '' : 'If a delivery comes damaged, short or wrong, open the order and tap "Report a problem".'}</div>`}</section>`;
}
async function nf21Remove(id){
  if(!confirm('Remove this credit? Use this only if it was typed in by mistake.')) return;
  if(myBusiness){ nf21SaveLocal(nf21Local().filter(x => x.id !== id)); creditMemosCache = null; }
  else { const i = demoCreditMemos.findIndex(x => x.id === id); if(i >= 0) demoCreditMemos.splice(i, 1); }
  renderReturnsPage();
}

/* ---------- 3. Phone alerts: Telegram set up in 4 steps, a team group with folders, practice chats, Viber ---------- */
// What's real today: the setup guide, the switches and the practice chats inside Nifti.
// Real messages start once Nifti's own Telegram account (a "bot") is made and connected to the server.
const NF21_TG = [
  {k: 'brief', t: 'Morning brief', who: 'You', topic: 'Daily brief', ic: '☀️', when: 'Every day at 7:00 AM',
    msg: '<b>Good morning, Sir.</b> Today:<br>🚚 3 deliveries · 1 is late<br>💰 ₱42,500 to collect<br>🏦 Deposit BDO #004512 · ₱18,200<br>⚠️ Bayview: 11 days, not billed', btns: ['Send Bayview the bill', 'Open Nifti'], reply: 'Done. The bill for ₱87,360 went to Bayview Construction.'},
  {k: 'approve', t: 'Approve with one tap', who: 'You, General Manager', topic: 'Approvals', ic: '✅', when: 'When staff go over a price, a discount or a credit limit',
    msg: '<b>Joy wants to order 100 bags cement at ₱265.</b><br>You agreed ₱245 with Metro Steel. That\'s <b>₱2,000 more</b>.', btns: ['Approve', 'Say no'], reply: 'Approved. Joy can send the order.'},
  {k: 'order', t: 'Customers order by chat', who: 'Your customers', topic: '(1-on-1 with each customer)', ic: '🛒', when: 'Whenever a customer types an order',
    msg: '<b>Your order · Aling Nena Store</b><br>Portland Cement 40kg × 10 · ₱2,450<br>GI Wire #16 × 5 · ₱475<br><b>Total ₱2,925</b> · deliver tomorrow', btns: ['Confirm', 'Change something'], reply: 'Confirmed. It\'s in your Orders now.', me: 'Boss, 10 sako semento at 5 rolyo wire, deliver bukas'},
  {k: 'proof', t: 'Payment proof matched', who: 'You, Cashier', topic: 'Payments', ic: '💳', when: 'When someone sends a GCash or bank screenshot',
    msg: '<b>Matched:</b> Dela Cruz Hardware paid <b>₱18,900</b> by GCash, ref 7012 3345. That clears bill INV-0412.', btns: ['It came in', 'Not in my account yet'], reply: 'Marked as paid. Who owes you is updated.', me: '📷 GCash screenshot · ₱18,900'},
  {k: 'driver', t: 'Drivers report each stop', who: 'Drivers', topic: 'Deliveries', ic: '🚚', when: 'During every delivery run',
    msg: '<b>Stop 3 of 6 · Boy Hardware</b><br>Drop: 5 rolls GI Wire<br>Collect: ₱4,750', btns: ['Delivered + collected', 'Can\'t deliver'], reply: 'Saved with the time. Next: Villanueva Supply, Potrero.'},
  {k: 'cash', t: 'Cash count at closing', who: 'Cashier, you get the result', topic: 'Cash count', ic: '💵', when: 'Every day at closing time',
    msg: 'Time to count the drawer. How much cash is in it?', btns: ['₱18,450', 'Type the amount'], reply: '<b>Counted ₱18,450.</b> Expected ₱18,900. <b>₱450 short.</b> The owner has been told.'},
  {k: 'stock', t: 'Running low? Reorder', who: 'You, Purchasing', topic: 'Running low', ic: '⏳', when: 'When an item will run out in a few days',
    msg: '<b>Rebar 10mm runs out in 2 days.</b><br>Order 200 pcs from Metro Steel at ₱178? That\'s ₱35,600.', btns: ['Send the order', 'Not now'], reply: 'Order PO-2026-0901 sent to Metro Steel.'},
  {k: 'pack', t: 'Packing group', who: 'Warehouse team', topic: 'Orders to pack', ic: '📦', when: 'When an order is confirmed',
    msg: '<b>New order to pack · PO-2026-0853</b><br>Corazon Welding Shop · 150 × Angle Bars<br>Deliver Aug 30', btns: ['Packed', 'Short on stock'], reply: '<b>Mark</b> packed it ✓ Everyone in the group can see it.'},
  {k: 'ask', t: 'Ask Nifti anything', who: 'You', topic: 'Ask Nifti', ic: '💬', when: 'Any time you type a question',
    msg: '<b>Bayview Construction owes ₱87,360.</b> It was delivered 11 days ago and isn\'t billed yet.', btns: ['Send the bill now'], reply: 'Done. The bill went to Bayview.', me: 'Magkano utang ni Bayview?'},
  {k: 'remind', t: 'Reminders and price news', who: 'Your customers', topic: '(1-on-1 with each customer)', ic: '🔔', when: 'Before a bill is due, and before prices go up',
    msg: 'Hi Riverside Builders! Bill <b>INV-0418</b> for ₱17,504 is due on Friday.', btns: ['See my statement', 'I already paid'], reply: 'Thanks! Here\'s your statement: 1 bill open, ₱17,504.'}
];
const NF21_TOPICS = [['Daily brief', '☀️', 'You'], ['Approvals', '✅', 'You, General Manager'], ['Payments', '💳', 'You, Cashier, Finance'], ['Cash count', '💵', 'You, Cashier'], ['Running low', '⏳', 'You, Purchasing'], ['Orders to pack', '📦', 'Warehouse team'], ['Deliveries', '🚚', 'Drivers, Warehouse'], ['Ask Nifti', '💬', 'You']];
const NF21A = {tab: 'tg', on: null, pick: 'brief', tapped: null};
function nf21AlertsOn(){ if(NF21A.on) return NF21A.on; try{ NF21A.on = JSON.parse(localStorage.getItem('nifti-alerts-on') || 'null'); }catch(e){} if(!NF21A.on){ NF21A.on = {}; NF21_TG.forEach(f => { NF21A.on[f.k] = true; }); } return NF21A.on; }
function nf21AlertToggle(k, v){ nf21AlertsOn()[k] = v; try{ localStorage.setItem('nifti-alerts-on', JSON.stringify(NF21A.on)); }catch(e){} }
function nf21OpenAlerts(tab){
  if(typeof closeUserMenu === 'function') try{ closeUserMenu(); }catch(e){}
  if(tab) NF21A.tab = tab;
  let ov = document.getElementById('nf21Alerts');
  if(!ov){ ov = document.createElement('div'); ov.id = 'nf21Alerts'; ov.className = 'nf20-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Alerts on your phone');
    ov.addEventListener('click', e => { if(e.target === ov) nf21CloseAlerts(); }); document.body.appendChild(ov); }
  ov.hidden = false; document.body.classList.add('nf20-noscroll'); nf21PaintAlerts();
}
function nf21CloseAlerts(){ const ov = document.getElementById('nf21Alerts'); if(ov) ov.hidden = true; document.body.classList.remove('nf20-noscroll'); }
function nf21Chat(f){
  const me = f.me ? `<div class="nf21-b me">${f.me}</div>` : '';
  const tapped = NF21A.tapped === f.k;
  return `<div class="nf21-phone"><div class="nf21-ph"><span>N</span><div><b>Nifti · ${escapeHtml((myBusiness && myBusiness.name) || 'Dela Cruz Hardware')}</b><small>${escapeHtml(f.topic.startsWith('(') ? 'chat with a customer' : 'Team group · ' + f.topic)}</small></div></div>
    <div class="nf21-pb">${me}<div class="nf21-b">${f.msg}</div><div class="nf21-btns">${f.btns.map((b, i) => `<button type="button" onclick="NF21A.tapped='${f.k}'; nf21PaintAlerts()" ${tapped ? 'disabled' : ''}>${b}</button>`).join('')}</div>
      ${tapped ? `<div class="nf21-b me">${f.btns[0]}</div><div class="nf21-b">${f.reply}</div>` : `<p class="nf21-try">Tap a button to try it.</p>`}</div></div>`;
}
function nf21PaintAlerts(){
  const ov = document.getElementById('nf21Alerts'); if(!ov) return;
  const on = nf21AlertsOn(), f = NF21_TG.find(x => x.k === NF21A.pick) || NF21_TG[0];
  const tg = `<div class="nf21-steps">
      <div><i>1</i><b>Get Telegram</b><span>Free from the App Store or Google Play. Sign up with your mobile number, like Viber.</span></div>
      <div><i>2</i><b>Tap "Open Nifti in Telegram"</b><span>On a computer, point your phone camera at the code instead.</span></div>
      <div><i>3</i><b>Tap START</b><span>The big button at the bottom of the chat. That's the only setting.</span></div>
      <div><i>4</i><b>Nifti says hello</b><span>You'll get a test message with one button. Tap it and you're done.</span></div></div>
    <div class="nf21-cta"><button type="button" class="btn btn-primary" onclick="showToast('Opens Telegram with your private link (prototype)', 'success')">Open Nifti in Telegram</button><span class="nf21-qr" aria-hidden="true"></span><small>Your staff get their own link by Viber or text. They do the same 4 steps on their phones.</small></div>
    <h3>Your team group, with a folder for each kind of message</h3>
    <p class="nf21-p">Nifti makes one group for your business. Inside are folders (Telegram calls them topics). Each message goes into its folder, and each person only gets the folders their role needs, using the same roles as <a onclick="nf21CloseAlerts(); nf20OpenWho()">Who sees what</a>.</p>
    <div class="nf21-topics">${NF21_TOPICS.map(([t, ic, who]) => `<div><span>${ic}</span><b>${t}</b><small>${who}</small></div>`).join('')}</div>
    <p class="nf21-p">Customers never see your group. They chat one-on-one with Nifti to order, get reminders and see price news.</p>
    <h3>The 10 alerts</h3>
    <div class="nf21-grid"><div class="nf21-list">${NF21_TG.map((x, i) => `<div class="nf21-al${x.k === f.k ? ' sel' : ''}"><button type="button" class="nf21-alb" onclick="NF21A.pick='${x.k}'; NF21A.tapped=null; nf21PaintAlerts()"><span>${x.ic}</span><b>${i + 1}. ${x.t}</b><small>${x.who} · ${x.when}</small></button>
        <label class="nf20-pr nf21-sw"><input type="checkbox" role="switch" aria-label="${x.t}" ${on[x.k] ? 'checked' : ''} onchange="nf21AlertToggle('${x.k}', this.checked)"><i aria-hidden="true"></i></label></div>`).join('')}</div>
      <div class="nf21-try-col"><div class="nf21-tt"><b>Practice: ${f.t}</b><small>Goes to: ${f.who}${f.topic.startsWith('(') ? '' : ' · folder: ' + f.topic}</small></div>${nf21Chat(f)}</div></div>
    <div class="nf21-help"><b>Help for anyone new to Telegram</b><ul><li>For the first week, Nifti sends one short tip a day with a picture.</li><li>Every message has a "?" button that explains it in Taglish or English.</li><li>Type "help" any time to get a person from Nifti.</li><li>Nothing to set up later. Your folders and alerts follow the roles you already set.</li></ul></div>`;
  const vb = `<div class="nf21-vb"><p class="nf21-p"><b>Yes, almost all of this can run on Viber too.</b> The difference is cost and setup:</p>
      <table class="nf21-cmp"><tr><th></th><th>Telegram</th><th>Viber</th></tr>
        <tr><td>Cost</td><td>Free</td><td>Viber charges the business: about €100–115 a month for Nifti's account, plus a small fee for each message Nifti starts</td></tr>
        <tr><td>Who starts</td><td>Each person taps START once</td><td>Each person taps Subscribe once</td></tr>
        <tr><td>Team folders</td><td>Yes, one group with a folder per kind of message</td><td>No folders. Each person gets their own alerts in a 1-on-1 chat instead</td></tr>
        <tr><td>Buttons, photos, questions</td><td>Yes</td><td>Yes</td></tr>
        <tr><td>Who already has it</td><td>Fewer Filipino business owners</td><td>Almost everyone</td></tr></table>
      <p class="nf21-p"><b>My recommendation:</b> customers get their reminders, order confirmations and price news on <b>Viber</b>, where they already are. You and your staff get the team alerts on <b>Telegram</b>, which is free and has folders. Nifti pays the Viber fee once for all its users, so you never deal with Viber's paperwork.</p>
      <button type="button" class="btn btn-outline" onclick="showToast('We\\'ll tell you when Viber alerts are ready (prototype)')">Tell me when Viber is ready</button></div>`;
  ov.innerHTML = `<div class="nf20-sheet nf21-sheet">
    <div class="nf20-sh"><div><h2>Alerts on your phone</h2><p>Get Nifti's important messages in the chat app you already use, with buttons that do the job right there.</p></div><button type="button" class="nf20-x" onclick="nf21CloseAlerts()" aria-label="Close">✕</button></div>
    <div class="nf20-roles" role="tablist"><button type="button" role="tab" class="${NF21A.tab === 'tg' ? 'on' : ''}" onclick="NF21A.tab='tg'; nf21PaintAlerts()">Telegram <b>free</b></button><button type="button" role="tab" class="${NF21A.tab === 'vb' ? 'on' : ''}" onclick="NF21A.tab='vb'; nf21PaintAlerts()">Viber</button></div>
    <div class="nf20-rc nf21-body">${NF21A.tab === 'vb' ? vb : tg}</div>
    <div class="nf20-sf"><span>Prototype: the guide, switches and practice chats work now. Real messages start once Nifti's Telegram account is connected.</span><button type="button" class="btn btn-primary" onclick="nf21CloseAlerts()">Done</button></div></div>`;
}

/* ---------- wiring ---------- */
(function(){
  try{ nf20Col = nf21Col; window.nf20Col = nf21Col; }catch(e){}
  try{ if(typeof NFO !== 'undefined') NFO.table = false; }catch(e){}
  // supplier credits you typed in (real accounts keep them on this device for now)
  const lc = window.loadCreditMemos;
  if(typeof lc === 'function' && !lc._nf21){ const w = async function(){ const l = await lc.apply(this, arguments) || []; if(!myBusiness) return l; const loc = nf21Local();
      return [...l.filter(m => !loc.some(x => x.id === m.id)), ...loc]; }; w._nf21 = true; window.loadCreditMemos = w; try{ loadCreditMemos = w; }catch(e){} }
  try{ window.renderReturnsPage = nf21ReturnsPage; renderReturnsPage = nf21ReturnsPage; if(typeof nfRewrap === 'function') nfRewrap('returns'); }catch(e){ console.warn('nf21 returns', e); }
  const ii = window.issueInvoice;
  if(typeof ii === 'function' && !ii._nf21){ const w = function(id){ const r = ii.apply(this, arguments); setTimeout(() => { try{ nf21AutoTake(id); }catch(e){ console.warn(e); } }, 0); return r; };
    w._nf21 = true; window.issueInvoice = w; try{ issueInvoice = w; }catch(e){} }
  // menu: Alerts on your phone, under Who sees what; and in the account menu
  const add = () => {
    const who = document.getElementById('nf20WhoLink');
    if(who && !document.getElementById('nf21AlertLink')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'nf20-who nf21-al-link'; b.id = 'nf21AlertLink';
      b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg><span>Alerts on your phone</span>`;
      b.onclick = () => nf21OpenAlerts(); who.after(b); }
    const um = document.getElementById('userMenuDropdown'); if(um && !um.querySelector('.nf21-um')){ const d = document.createElement('div'); d.className = 'notif-item nf21-um'; d.style.cursor = 'pointer'; d.innerHTML = '<div><div class="notif-text">Alerts on your phone</div></div>'; d.onclick = () => nf21OpenAlerts(); const w = um.querySelector('.nf20-um'); if(w) w.after(d); else um.insertBefore(d, um.firstChild); }
    const al = document.getElementById('nf21AlertLink'); if(al && who && al.hidden !== who.hidden) al.hidden = who.hidden;
  };
  document.addEventListener('keydown', e => { if(e.key === 'Escape'){ const ov = document.getElementById('nf21Alerts'); if(ov && !ov.hidden) nf21CloseAlerts(); const pv = document.getElementById('nf21Pv'); if(pv) pv.hidden = true; } });
  const start = () => { try{ add(); }catch(e){} if(!document.getElementById('nf20WhoLink')) setTimeout(start, 400); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf21){ const w = function(page){ const out = nav.apply(this, arguments); try{ add(); if(typeof NFO !== 'undefined') NFO.table = false; }catch(e){} return out; };
    Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf21 = true; window.navigate = w; try{ navigate = w; }catch(e){} }
  const mr = window.nf20MenuRoles;
  if(typeof mr === 'function' && !mr._nf21){ const w = function(){ const r = mr.apply(this, arguments); try{ add(); }catch(e){} return r; }; w._nf21 = true; window.nf20MenuRoles = w; try{ nf20MenuRoles = w; }catch(e){} }
})();
