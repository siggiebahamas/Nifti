
/* ================= BOOKS: works without internet, receipts, cash in/out, vale, menu & recipes ================= */
const BK_LAST_CHANGE = {};
// ---- no signal at the counter: sales and expenses wait on this phone, then upload by themselves
function bkIsNetErr(e){ return isOffline || !navigator.onLine || /fetch|network|timed? ?out|load failed|offline/i.test(String((e && (e.message || e.error_description)) || e || '')); }
function bkQueueKey(){ return 'nifti-books-queue-' + (myBusiness ? myBusiness.id : 'demo'); }
function bkQueue(){ try{ return JSON.parse(localStorage.getItem(bkQueueKey()) || '[]'); }catch(e){ return []; } }
function bkQueueSave(q){ try{ localStorage.setItem(bkQueueKey(), JSON.stringify(q)); return true; }catch(e){ return false; } }
function bkQueueAdd(item){
  const q = bkQueue(); q.push(item);
  if(bkQueueSave(q)) return true;
  if(item.photo){ item.photo = ''; q[q.length - 1] = item; if(bkQueueSave(q)){ showToast("The photo was too big to keep offline. The entry is saved without it.", 'warn'); return true; } }
  return false;
}
function bkMergeQueued(){
  bkQueue().forEach(it => {
    if(it.table === 'downstream_sales' && !BK.sales.some(x => x.id === it.row.id)){ const s = bkRowSale(Object.assign({created_at: it.at, created_by_name: it.by}, it.row)); s.pending = true; BK.sales.unshift(s); }
    if(it.table === 'expenses' && !BK.expenses.some(x => x.id === it.row.id)){ const e = bkRowExpense(Object.assign({created_at: it.at, created_by_name: it.by}, it.row)); e.pending = true; BK.expenses.unshift(e); }
  });
}
let bkFlushing = false;
async function bkFlushQueue(){
  if(!myBusiness || bkFlushing || isOffline) return;
  if(!bkQueue().length) return;
  bkFlushing = true; let sent = 0;
  try{
    for(const it of bkQueue()){
      if(it.photo){
        try{ it.row.receipt_path = await bkUploadPhoto(it.photo, it.photoName); }
        catch(e){ if(bkIsNetErr(e)) break; it.row.receipt_path = null; }
      }
      const { error } = it.rpc ? await sb.rpc(it.rpc, it.args) : await sb.from(it.table).upsert(it.row, {onConflict: 'id', ignoreDuplicates: true});
      if(error && bkIsNetErr(error)) break;
      const q = bkQueue().filter(x => x.row.id !== it.row.id);
      if(error){ // the server refused it (not a signal problem): keep it a few more tries, then let it go with a note
        it.tries = (it.tries || 0) + 1; console.warn('Books upload refused', error.message);
        if(it.tries < 5){ q.push(Object.assign({}, it, {photo: it.photo})); bkQueueSave(q); continue; }
        showToast("One entry couldn't upload: " + error.message, 'error');
      }
      bkQueueSave(q); if(!error) sent++;
      const local = it.rpc ? null : (it.table === 'downstream_sales' ? BK.sales : BK.expenses).find(x => x.id === it.row.id);
      if(local){ local.pending = false; if(it.row.receipt_path) local.receipt = it.row.receipt_path; }
    }
  } finally { bkFlushing = false; }
  if(sent){ showToast(`${sent} saved entr${sent === 1 ? 'y' : 'ies'} uploaded.`, 'success'); bkRefreshViews(); }
}
window.addEventListener('online', () => setTimeout(bkFlushQueue, 1200));
setInterval(() => { if(myBusiness && !isOffline && bkQueue().length) bkFlushQueue(); }, 60000);

// ---- menu items: one plate of sisig takes its pork, onion and oil out of stock
function bkStockLines(lines){
  const out = [];
  (lines || []).forEach(l => {
    const m = bkMenuFind(l.product);
    if(!m){ out.push({product: l.product, qty: Number(l.qty) || 0}); return; }
    (m.recipe || []).forEach(r => { if(r.item && Number(r.qty) > 0) out.push({product: r.item, qty: Math.round(Number(r.qty) * (Number(l.qty) || 0) * 1000) / 1000}); });
  });
  return out;
}
function bkMenuNote(lines){
  const m = (lines || []).filter(l => bkMenuFind(l.product));
  return m.length ? ' · ' + m.map(l => `${l.qty} × ${l.product}`).join(', ').slice(0, 120) : '';
}
let MF = null;
function bkMenuPanel(){
  if(!booksCanSeeTotals()) return '';
  const list = (BK.menu || []).slice().sort((a, b) => (b.active - a.active) || a.name.localeCompare(b.name));
  // the same screen for every kind of business: nothing here depends on what was picked at sign-up
  if(!list.length) return `<section class="panel-card bk-menu-empty"><div><b>Selling food or bundles?</b><span>Add a menu item with what goes into it. Each sale takes the ingredients out of stock, and you see the real profit per plate.</span></div><button class="btn btn-outline" onclick="openMenuForm()">+ Add menu item</button></section>`;
  const pct = v => v == null ? '—' : Math.round(v * 100) + '%';
  return `<section class="panel-card bk-list"><div class="panel-head"><h2>Menu &amp; recipes</h2><button class="sl-link" onclick="openMenuForm()">+ Add menu item</button></div>
    <div class="lg-tbl-wrap"><table class="lg-tbl bk-tbl"><thead><tr><th>Menu item</th><th class="r">Ingredients cost</th><th class="r">You sell at</th><th class="r">Margin</th><th></th></tr></thead><tbody>
    ${list.map(m => { const c = bkMenuCost(m), mg = m.price && c ? (m.price - c) / m.price : null; return `<tr class="${!m.active ? 'bk-tr-off' : mg != null && mg < 0 ? 'bk-tr-bad' : mg != null && mg < 0.2 ? 'bk-tr-warn' : ''}">
      <td>${escapeHtml(m.name)}${!m.active ? ' <span class="bk-tag">off the menu</span>' : ''}<small class="bk-sub">${(m.recipe || []).map(r => `${escapeHtml(String(r.qty))} ${escapeHtml(bkUnitOf(r.item))} ${escapeHtml(r.item)}`).join(' · ') || 'no ingredients yet'}</small></td>
      <td class="r">${c ? bkPeso(c) : '—'}</td><td class="r">${bkPeso(m.price)}</td><td class="r">${pct(mg)}</td><td class="r"><button class="sl-link" onclick="openMenuForm('${m.id}')">Edit</button></td></tr>`; }).join('')}
    </tbody></table></div></section>`;
}
function bkUnitOf(name){ const i = inventoryData.find(x => String(x.name).toLowerCase() === String(name).toLowerCase()); return (i && i.unit) || ''; }
function openMenuForm(id){
  if(!booksCanSeeTotals()){ showToast('Only the owner can change the menu.'); return; }
  const m = id ? (BK.menu || []).find(x => x.id === id) : null;
  MF = m ? {id: m.id, name: m.name, price: String(m.price || ''), recipe: (m.recipe || []).map(r => ({item: r.item, qty: String(r.qty)})), active: m.active, err: '', saving: false}
    : {name: '', price: '', recipe: [{item: '', qty: ''}], active: true, err: '', saving: false};
  if(!MF.recipe.length) MF.recipe.push({item: '', qty: ''});
  mfRender();
}
function mfCost(){ return MF.recipe.reduce((a, r) => a + (Number(String(r.qty).replace(/,/g, '')) || 0) * bkStockCost(r.item), 0); }
function mfCostNow(){
  const el = document.getElementById('mfCost'); if(!el) return;
  const c = mfCost(), p = Number(String(MF.price).replace(/,/g, '')) || 0;
  el.textContent = c ? `Ingredients cost ${bkPeso(c)} per serving${p ? ` · you keep ${bkPeso(p - c)} (${Math.round((p - c) / p * 100)}%)` : ''}` : 'Add ingredients from your stock to see the cost per serving.';
}
function mfRender(){
  const stock = inventoryData.map(i => i.name).filter((v, i, a) => a.indexOf(v) === i).sort();
  slModal('mfModal', `<div class="sl-sheet-h"><b>${MF.id ? 'Edit menu item' : 'New menu item'}</b><button class="sl-x" onclick="slClose('mfModal')">✕</button></div>
    <div class="row-2"><div class="field"><label>Name</label><input id="mfName" maxlength="120" value="${escapeHtml(MF.name)}" oninput="MF.name=this.value" placeholder="e.g. Pork sisig"></div>
      <div class="field"><label>Price</label><div class="ob-peso"><span>₱</span><input id="mfPrice" inputmode="decimal" value="${escapeHtml(MF.price)}" oninput="MF.price=this.value; mfCostNow()" placeholder="0"></div></div></div>
    <div class="field"><label>What goes into one serving</label>
      <datalist id="mfStock">${stock.map(n => `<option value="${escapeHtml(n)}">`).join('')}</datalist>
      <div class="mf-lines">${MF.recipe.map((r, i) => `<div class="mf-line">
        <input list="mfStock" value="${escapeHtml(r.item)}" placeholder="Ingredient from your stock" oninput="MF.recipe[${i}].item=this.value" onchange="mfRender()" aria-label="Ingredient">
        <input type="number" min="0" step="any" inputmode="decimal" value="${escapeHtml(r.qty)}" placeholder="How much" oninput="MF.recipe[${i}].qty=this.value; mfCostNow()" aria-label="Amount per serving">
        <span class="mf-unit">${escapeHtml(bkUnitOf(r.item) || '')}</span>
        ${MF.recipe.length > 1 ? `<button class="sl-x" aria-label="Remove ingredient" onclick="MF.recipe.splice(${i},1); mfRender()">✕</button>` : '<span></span>'}
        ${r.item && !inventoryData.some(x => String(x.name).toLowerCase() === String(r.item).toLowerCase()) ? '<div class="qs-warn">Not in your stock list yet. Add it in Stock so it can be counted.</div>' : ''}</div>`).join('')}</div>
      <button class="sl-link" onclick="MF.recipe.push({item:'',qty:''}); mfRender()">+ Add ingredient</button></div>
    <div class="bk-note" id="mfCost"></div>
    ${MF.id ? `<label class="bk-check"><input type="checkbox" ${MF.active ? 'checked' : ''} onchange="MF.active=this.checked"> On the menu (turn off to stop selling it; past sales stay)</label>` : ''}
    <div class="sl-err" id="mfErr">${escapeHtml(MF.err)}</div>
    <button class="btn btn-primary sl-wide" onclick="mfSave()" ${MF.saving ? 'disabled' : ''}>${MF.saving ? 'Saving…' : 'Save menu item'}</button>`);
  mfCostNow();
}
async function mfSave(){
  const err = m => { MF.err = m; const e = document.getElementById('mfErr'); if(e) e.textContent = m; };
  const name = String(MF.name || '').trim().slice(0, 120), price = Math.round((Number(String(MF.price).replace(/,/g, '')) || 0) * 100) / 100;
  if(!name) return err('Give it a name.');
  if(!(price > 0)) return err('Enter the price.');
  if(inventoryData.some(i => String(i.name).toLowerCase() === name.toLowerCase())) return err('A stock item already has this name. Use a different name for the menu item.');
  if((BK.menu || []).some(m => m.id !== MF.id && m.name.toLowerCase() === name.toLowerCase())) return err('You already have a menu item with this name.');
  const recipe = MF.recipe.map(r => ({item: String(r.item || '').trim().slice(0, 120), qty: Math.round((Number(String(r.qty).replace(/,/g, '')) || 0) * 1000) / 1000})).filter(r => r.item && r.qty > 0);
  if(!recipe.length) return err('Add at least one ingredient and how much goes into one serving.');
  const row = {id: MF.id || bkUid(), name, price, recipe, active: MF.id ? !!MF.active : true};
  MF.saving = true; mfRender();
  if(myBusiness){
    const { data, error } = await sb.from('menu_items').upsert(Object.assign({business_id: myBusiness.id}, row)).select().single();
    if(error){ MF.saving = false; mfRender(); return err("Couldn't save: " + error.message); }
    Object.assign(row, bkRowMenu(data));
  }
  const i = BK.menu.findIndex(m => m.id === row.id); if(i > -1) BK.menu[i] = row; else BK.menu.push(row);
  bkSaveDemo(); slClose('mfModal'); showToast('Menu item saved. Selling it takes the ingredients out of stock.', 'success'); MF = null;
  bkRefreshViews();
}

// ---- receipts for counter sales (print, or send by Viber / Messenger)
function bkSaleRef(s){ return 'S-' + String(s.id).replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase(); }
function bkSaleSnack(id, text){
  const old = document.getElementById('bkSnack'); if(old) old.remove();
  const el = document.createElement('div'); el.id = 'bkSnack'; el.className = 'bk-snack'; el.setAttribute('role', 'status');
  el.innerHTML = `<span>${escapeHtml(text)}</span><button onclick="bkReceipt('${id}'); this.parentNode.remove()">🧾 Receipt</button><button class="bk-snack-x" aria-label="Close" onclick="this.parentNode.remove()">✕</button>`;
  document.body.appendChild(el);
  setTimeout(() => { if(el.parentNode) el.remove(); }, 9000);
}
function bkReceiptData(s){
  const tax = (typeof getMyTaxProfile === 'function' && getMyTaxProfile()) || {}, c = (typeof partnerContact === 'function' && partnerContact()) || {};
  const at = s.at ? new Date(s.at) : new Date(s.date + 'T12:00:00');
  const paid = bkSalePaid(s), bal = bkSaleBalance(s), ch = BK_LAST_CHANGE[s.id];
  return {biz: (tax.registeredName || selfName()), addr: tax.registeredAddress || '', phone: c.phone || '', tin: tax.tin || '',
    when: at.toLocaleDateString('en-PH', {month: 'short', day: 'numeric', year: 'numeric'}) + ' ' + at.toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit'}),
    ref: bkSaleRef(s), lines: (s.lines || []).map(l => l.totalOnly ? {name: 'Items', qty: 1, each: s.total, sum: s.total} : {name: l.product, qty: l.qty, each: Number(l.unitPrice) || 0, sum: (Number(l.qty) || 0) * (Number(l.unitPrice) || 0)}),
    total: s.total, method: (BK_SALE_PAY.find(x => x[0] === s.paidWith) || [, s.paidWith || ''])[1], paid, bal, customer: s.customer, by: s.by, ch};
}
function bkReceiptHtml(d){
  return `<div class="rc"><div class="rc-h"><b>${escapeHtml(d.biz)}</b>${d.addr ? `<span>${escapeHtml(d.addr)}</span>` : ''}${d.phone ? `<span>${escapeHtml(d.phone)}</span>` : ''}${d.tin ? `<span>TIN ${escapeHtml(d.tin)}</span>` : ''}</div>
    <div class="rc-t">Acknowledgment receipt</div>
    <div class="rc-m"><span>No. ${escapeHtml(d.ref)}</span><span>${escapeHtml(d.when)}</span></div>
    ${d.customer && d.customer !== 'Walk-in' ? `<div class="rc-m"><span>Customer</span><span>${escapeHtml(d.customer)}</span></div>` : ''}
    <div class="rc-lines">${d.lines.map(l => `<div class="rc-l"><span>${escapeHtml(l.name)}<small>${l.qty} × ${bkPeso(l.each)}</small></span><b>${bkPeso(l.sum)}</b></div>`).join('')}</div>
    <div class="rc-l rc-tot"><span>Total</span><b>${bkPeso(d.total)}</b></div>
    ${d.paid ? `<div class="rc-l"><span>Paid · ${escapeHtml(d.method)}</span><b>${bkPeso(d.paid)}</b></div>` : ''}
    ${d.ch ? `<div class="rc-l"><span>Cash received</span><b>${bkPeso(d.ch.received)}</b></div><div class="rc-l"><span>Change</span><b>${bkPeso(d.ch.change)}</b></div>` : ''}
    ${d.bal >= 0.01 ? `<div class="rc-l rc-bal"><span>Balance (utang)</span><b>${bkPeso(d.bal)}</b></div>` : ''}
    <div class="rc-f">Served by ${escapeHtml(d.by || '—')} · Salamat po!</div></div>`;
}
function bkReceiptText(d){
  const L = [d.biz]; if(d.addr) L.push(d.addr); if(d.phone) L.push(d.phone);
  L.push('', 'Receipt ' + d.ref + ' · ' + d.when);
  if(d.customer && d.customer !== 'Walk-in') L.push('Customer: ' + d.customer);
  L.push(''); d.lines.forEach(l => L.push(`${l.qty} × ${l.name} @ ${bkPeso(l.each)} = ${bkPeso(l.sum)}`));
  L.push('', 'TOTAL ' + bkPeso(d.total)); if(d.paid) L.push('Paid (' + d.method + ') ' + bkPeso(d.paid)); if(d.ch) L.push('Change ' + bkPeso(d.ch.change)); if(d.bal >= 0.01) L.push('Balance (utang) ' + bkPeso(d.bal));
  L.push('', 'Salamat po!'); return L.join('\n');
}
function bkReceipt(id){
  const s = BK.sales.find(x => x.id === id); if(!s) return;
  const d = bkReceiptData(s);
  slModal('bkRcpt', `<div class="sl-sheet-h"><b>Receipt</b><button class="sl-x" onclick="slClose('bkRcpt')">✕</button></div>
    <div class="no-i18n">${bkReceiptHtml(d)}</div>
    <div class="bk-actions rc-act"><button class="btn btn-outline" onclick="bkPrintReceipt('${id}')">🖨 Print</button><button class="btn btn-primary" onclick="bkShareReceipt('${id}')">📤 Send</button></div>`);
}
function bkPrintReceipt(id){
  const s = BK.sales.find(x => x.id === id); if(!s) return;
  const f = document.createElement('iframe'); f.className = 'rc-frame'; f.setAttribute('aria-hidden', 'true'); document.body.appendChild(f);
  const css = `body{font-family:ui-monospace,Menlo,Consolas,monospace;margin:0;padding:12px;color:#000;font-size:13px}.rc{max-width:300px;margin:0 auto}.rc-h{text-align:center;display:flex;flex-direction:column;gap:2px;margin-bottom:8px}.rc-h b{font-size:15px}
    .rc-t{text-align:center;font-weight:700;text-transform:uppercase;font-size:12px;border-top:1px dashed #000;border-bottom:1px dashed #000;padding:4px 0;margin:6px 0}.rc-m,.rc-l{display:flex;justify-content:space-between;gap:8px;padding:2px 0}
    .rc-l small{display:block;color:#333}.rc-lines{border-bottom:1px dashed #000;padding-bottom:6px;margin-bottom:4px}.rc-tot{font-size:15px;font-weight:700}.rc-f{text-align:center;margin-top:10px}@page{margin:6mm}`;
  f.contentDocument.open(); f.contentDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>${bkSaleRef(s)}</title><style>${css}</style></head><body>${bkReceiptHtml(bkReceiptData(s))}</body></html>`); f.contentDocument.close();
  setTimeout(() => { try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ showToast("This browser can't print here. Use Send instead."); } setTimeout(() => f.remove(), 60000); }, 250);
}
async function bkShareReceipt(id){
  const s = BK.sales.find(x => x.id === id); if(!s) return;
  const text = bkReceiptText(bkReceiptData(s));
  if(navigator.share){ try{ await navigator.share({text}); return; }catch(e){ if(e && e.name === 'AbortError') return; } }
  try{ await navigator.clipboard.writeText(text); showToast('Copied. Paste it in Viber or Messenger.', 'success'); }
  catch(e){ showToast("Couldn't copy. Take a screenshot of the receipt instead."); }
}

// ---- cash in / out of the drawer (bank deposits, owner adding change)
function openCashMove(){
  if(!BK.loaded){ bkLoad().then(openCashMove); return; }
  openExpenseForm(); EXF.cashMove = true; EXF.paidFrom = 'cash'; exRender();
}

// ---- staff vale: who borrowed how much this month
function bkValeHtml(m){
  const by = {};
  BK.expenses.filter(e => !e.deletedAt && bkMonth(e.date) === m && e.category === 'Staff advance (vale)').forEach(e => {
    const k = String(e.staff || '').trim() || 'No name'; const r = by[k] = by[k] || {amt: 0, n: 0}; r.amt += e.amount; r.n++;
  });
  const rows = Object.entries(by).sort((a, b) => b[1].amt - a[1].amt);
  if(!rows.length) return '';
  return `<section class="panel-card bk-list"><div class="panel-head"><h2>Vale this month</h2><span class="bk-dim">${bkPeso(rows.reduce((a, r) => a + r[1].amt, 0))}</span></div>
    ${rows.map(([k, r]) => `<div class="bk-row"><span class="bk-ic" aria-hidden="true">🤝</span><div class="bk-row-m"><b>${escapeHtml(k)}</b><small>${r.n} time${r.n > 1 ? 's' : ''} · take it off the next salary</small></div><span class="bk-amt">${bkPeso(r.amt)}</span></div>`).join('')}</section>`;
}
