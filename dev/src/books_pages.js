
/* ---------------- shared bits ---------------- */
let bkMonthSel = null, bkSalesDay = null, bkExpFilter = '';
function bkMonthOptions(sel){
  const out = []; let m = bkMonth(APP_TODAY);
  for(let i = 0; i < 6; i++){ out.push(`<option value="${m}" ${m === sel ? 'selected' : ''}>${bkMonthLabel(m)}</option>`); m = bkPrevMonth(m); }
  return out.join('');
}
function bkHead(title, sub, actions){
  return `<div class="page-head bk-head"><div><h1>${title}</h1><p>${sub}</p></div>${actions ? `<div class="bk-head-act">${actions}</div>` : ''}</div>`;
}
function bkTile(label, value, sub, tone, onclick){
  const inner = `<span class="bk-tile-l">${label}</span><span class="bk-tile-v">${value}</span>${sub ? `<span class="bk-tile-s">${sub}</span>` : ''}`;
  return onclick ? `<button class="bk-tile${tone ? ' ' + tone : ''}" onclick="${onclick}">${inner}</button>` : `<div class="bk-tile${tone ? ' ' + tone : ''}">${inner}</div>`;
}
function bkLockedForStaff(page){
  return `<div class="panel-card bk-empty"><b>Only the owner sees the totals here.</b><span>You can still record ${page === 'money' ? 'sales and expenses' : 'what you need'} from the + Create button.</span></div>`;
}
function bkLoadingHtml(){ return '<div class="panel-card bk-empty"><span>Loading your books…</span></div>'; }
async function bkEnsure(render){ if(!BK.loaded){ await bkLoad(); } render(); }
function bkCompressImage(file, maxSide){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      const k = Math.min(1, (maxSide || 1280) / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.72));
    }; img.onerror = reject; img.src = r.result; };
    r.onerror = reject; r.readAsDataURL(file);
  });
}
async function bkUploadPhoto(dataUrl, name){
  if(!myBusiness) return dataUrl; // the demo keeps the picture in this browser
  const blob = await (await fetch(dataUrl)).blob();
  const path = myBusiness.id + '/' + name + '.jpg';
  const { error } = await sb.storage.from('receipts').upload(path, blob, {contentType: 'image/jpeg', upsert: true});
  if(error) throw error;
  return path;
}
async function bkShowPhoto(ref){
  let url = ref;
  if(myBusiness && ref && !/^data:/.test(ref)){
    const { data, error } = await sb.storage.from('receipts').createSignedUrl(ref, 300);
    if(error){ showToast("Couldn't open the photo.", 'error'); return; }
    url = data.signedUrl;
  }
  slModal('bkPhoto', `<div class="sl-sheet-h"><b>Photo</b><button class="sl-x" onclick="slClose('bkPhoto')">✕</button></div><img class="bk-photo-big" src="${url}" alt="Receipt photo">`);
}
// Reads the biggest peso amount on a receipt photo (same in-browser reader the price-list import uses).
async function bkReadAmount(dataUrl){
  try{
    await ensureTesseractLoaded();
    const { data } = await Tesseract.recognize(dataUrl, 'eng');
    const text = String(data.text || '');
    const tot = text.match(/(?:total|amount due|amount|kabuuan)[^\d]{0,15}([\d,]+\.\d{2})/i);
    if(tot) return Number(tot[1].replace(/,/g, ''));
    const nums = (text.match(/\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2}/g) || []).map(x => Number(x.replace(/,/g, ''))).filter(n => n > 0 && n < 10000000);
    return nums.length ? Math.max(...nums) : null;
  }catch(e){ return null; }
}

/* ================= SALES (counter, walk-in, utang) ================= */
let QS = null;
function bkCustomerNames(){
  const set = new Set();
  BK.sales.forEach(s => { if(s.customer && s.customer !== 'Walk-in') set.add(s.customer); });
  (buyersData || []).forEach(b => set.add(b.name));
  return [...set].sort((a, b) => a.localeCompare(b));
}
function openQuickSale(){
  if(!BK.loaded){ bkLoad().then(openQuickSale); return; }
  QS = {mode: 'items', lines: [{product: '', qty: 1, price: ''}], total: '', customer: 'Walk-in', paidWith: 'cash', received: '', note: '', saving: false, err: ''};
  qsRender();
}
function qsTotal(){ return QS.mode === 'total' ? (Number(String(QS.total).replace(/,/g, '')) || 0) : QS.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(String(l.price).replace(/,/g, '')) || 0), 0); }
function qsPick(i, name){
  const l = QS.lines[i]; l.product = name;
  const p = bkItemPrice(name); if(p && !l.price) l.price = String(p);
  qsRender();
}
function qsRender(){
  const stock = (BK.menu || []).filter(m => m.active).map(m => m.name).concat(inventoryData.map(i => i.name)).filter((v, i, a) => a.indexOf(v) === i).sort();
  const lineHtml = (l, i) => {
    const item = bkMenuFind(l.product) ? null : inventoryData.find(x => x.name.toLowerCase() === String(l.product).toLowerCase());
    const low = item && Number(l.qty) > Number(item.onHand);
    return `<div class="qs-line">
      <input class="qs-prod" list="qsStock" placeholder="Item (type to search)" value="${escapeHtml(l.product)}" oninput="QS.lines[${i}].product=this.value" onchange="qsPick(${i}, this.value)" aria-label="Item">
      <input class="qs-qty" type="number" min="0" step="any" inputmode="decimal" value="${escapeHtml(String(l.qty))}" oninput="QS.lines[${i}].qty=this.value; qsTotalNow()" aria-label="Quantity">
      <span class="qs-x">×</span>
      <div class="ob-peso qs-price"><span>₱</span><input inputmode="decimal" placeholder="Price" value="${escapeHtml(String(l.price))}" oninput="QS.lines[${i}].price=this.value; qsTotalNow()" aria-label="Price each"></div>
      ${QS.lines.length > 1 ? `<button class="sl-x" aria-label="Remove item" onclick="QS.lines.splice(${i},1); qsRender()">✕</button>` : '<span></span>'}
      ${low ? `<div class="qs-warn">Only ${item.onHand} in stock. You can still save; count the shelf later.</div>` : ''}
    </div>`;
  };
  const t = qsTotal(), cash = QS.paidWith === 'cash', rec = Number(String(QS.received).replace(/,/g, '')) || 0;
  slModal('qsModal', `<div class="sl-sheet-h"><b>New sale</b><button class="sl-x" onclick="slClose('qsModal')">✕</button></div>
    <div class="bk-seg"><button class="${QS.mode === 'items' ? 'on' : ''}" onclick="QS.mode='items'; qsRender()">Items</button><button class="${QS.mode === 'total' ? 'on' : ''}" onclick="QS.mode='total'; qsRender()">Just the total</button></div>
    <datalist id="qsStock">${stock.map(n => `<option value="${escapeHtml(n)}">`).join('')}</datalist>
    ${QS.mode === 'items' ? `<div class="qs-lines">${QS.lines.map(lineHtml).join('')}</div><button class="sl-link" onclick="QS.lines.push({product:'',qty:1,price:''}); qsRender()">+ Add item</button>`
      : `<div class="field"><label>Total sale</label><div class="ob-peso bk-big"><span>₱</span><input id="qsTotalIn" inputmode="decimal" value="${escapeHtml(QS.total)}" placeholder="0" oninput="QS.total=this.value; qsTotalNow()"></div><div class="bk-note">For a register total. Stock won't move; record items when you can.</div></div>`}
    <div class="qs-sum"><span>Total</span><b id="qsTotal">${bkPeso(t)}</b></div>
    <div class="field"><label>Paid with</label><div class="sl-days bk-chips">${BK_SALE_PAY.map(([k, l]) => `<button type="button" class="${QS.paidWith === k ? 'on' : ''}" onclick="QS.paidWith='${k}'; qsRender()">${l}</button>`).join('')}</div></div>
    ${cash ? `<div class="row-2"><div class="field"><label>Cash received <small>(optional)</small></label><div class="ob-peso"><span>₱</span><input inputmode="decimal" value="${escapeHtml(QS.received)}" placeholder="${Math.ceil(t)}" oninput="QS.received=this.value; qsTotalNow()"></div></div>
      <div class="field"><label>Change (sukli)</label><div class="qs-change" id="qsChange">${rec > t ? bkPeso(rec - t) : '—'}</div></div></div>` : ''}
    <div class="field"><label>Customer ${QS.paidWith === 'credit' ? '' : '<small>(optional)</small>'}</label><input list="qsCust" value="${escapeHtml(QS.customer)}" onfocus="if(this.value==='Walk-in') this.select()" oninput="QS.customer=this.value" placeholder="Walk-in" aria-label="Customer">
      <datalist id="qsCust"><option value="Walk-in">${bkCustomerNames().map(n => `<option value="${escapeHtml(n)}">`).join('')}</datalist></div>
    <div class="field"><label>Note <small>(optional)</small></label><input maxlength="300" value="${escapeHtml(QS.note)}" oninput="QS.note=this.value" placeholder="e.g. suki discount"></div>
    <div class="sl-err" id="qsErr">${escapeHtml(QS.err)}</div>
    <button class="btn btn-primary sl-wide" onclick="qsSave()" ${QS.saving ? 'disabled' : ''}>${QS.saving ? 'Saving…' : 'Save sale'}</button>`);
}
function qsTotalNow(){
  const t = qsTotal(), el = document.getElementById('qsTotal'); if(el) el.textContent = bkPeso(t);
  const ch = document.getElementById('qsChange'); const rec = Number(String(QS.received).replace(/,/g, '')) || 0;
  if(ch) ch.textContent = rec > t ? bkPeso(rec - t) : '—';
}
async function qsSave(){
  const err = m => { QS.err = m; const e = document.getElementById('qsErr'); if(e) e.textContent = m; };
  const total = Math.round(qsTotal() * 100) / 100;
  let lines = [];
  if(QS.mode === 'items'){
    lines = QS.lines.filter(l => String(l.product).trim()).map(l => ({product: String(l.product).trim().slice(0, 120), qty: Number(l.qty) || 0, unitPrice: Number(String(l.price).replace(/,/g, '')) || 0}));
    if(!lines.length) return err('Add at least one item, or switch to "Just the total".');
    if(lines.some(l => l.qty <= 0)) return err('Each item needs a quantity.');
    lines.forEach(l => { l.unitCost = bkItemCost(l.product); if(bkMenuFind(l.product)) l.menu = true; });
  } else lines = [{product: 'Sale (total only)', qty: 1, unitPrice: total, unitCost: 0, totalOnly: true}];
  if(!(total > 0)) return err('The total is ₱0. Enter a price.');
  const customer = String(QS.customer || '').trim().slice(0, 120) || 'Walk-in';
  if(QS.paidWith === 'credit' && customer === 'Walk-in') return err('Who owes this? Type the customer\'s name for utang.');
  const payments = QS.paidWith === 'credit' ? [] : [{method: QS.paidWith, amount: total, date: APP_TODAY}];
  const closed = bkClosedMsg(APP_TODAY); if(closed) return err(closed);
  QS.saving = true; qsRender();
  const sale = {id: bkUid(), date: APP_TODAY, at: new Date().toISOString(), customer, lines, total, paidWith: QS.paidWith, payments, by: bkMe(), note: String(QS.note || '').trim().slice(0, 300), branch: bkHereBranch()};
  let queued = false;
  if(myBusiness){
    const row = {id: sale.id, business_id: myBusiness.id, sale_date: sale.date, customer_name: customer, line_items: lines, payments, total, paid_with: QS.paidWith, note: sale.note || null, branch: sale.branch};
    const { data, error } = isOffline ? {error: {message: 'offline'}} : await sb.from('downstream_sales').insert(row).select().single();
    if(error){
      // no signal: keep it on this phone and send it when the internet is back
      if(!bkIsNetErr(error) || !bkQueueAdd({table: 'downstream_sales', row, at: sale.at, by: sale.by})){ QS.saving = false; qsRender(); return err("Couldn't save: " + error.message); }
      sale.pending = true; queued = true;
    } else Object.assign(sale, bkRowSale(data));
  }
  BK.sales.unshift(sale); bkSaveDemo();
  const real = lines.filter(l => !l.totalOnly);
  if(real.length) stockOut(bkStockLines(real), 'sold', (customer === 'Walk-in' ? 'Counter sale' : 'Sold to ' + customer) + bkMenuNote(real), 'Sale');
  slClose('qsModal');
  const rec = QS.paidWith === 'cash' ? Number(String(QS.received).replace(/,/g, '')) || 0 : 0;
  BK_LAST_CHANGE[sale.id] = rec > total ? {received: rec, change: Math.round((rec - total) * 100) / 100} : null;
  bkSaleSnack(sale.id, queued ? `Saved on this phone · ${bkPeso(total)}. It uploads when the internet is back.` : QS.paidWith === 'credit' ? `Saved. ${customer} owes ${bkPeso(total)}.` : `Sale saved · ${bkPeso(total)}`);
  QS = null;
  bkRefreshViews();
}
async function bkVoidSale(id){
  const s = BK.sales.find(x => x.id === id); if(!s) return;
  const why = prompt('Why remove this sale? (kept in the history)', 'Wrong entry');
  if(why === null) return;
  if(s.pending){ showToast('This sale is still waiting to upload. Try again when the internet is back.'); return; }
  if(myBusiness){
    const { error } = await sb.from('downstream_sales').update({voided_at: new Date().toISOString(), void_reason: String(why).slice(0, 200)}).eq('id', id);
    if(error){ showToast(error.message, 'error'); return; }
  }
  s.voidedAt = new Date().toISOString(); s.voidedBy = bkMe(); s.voidReason = String(why).slice(0, 200);
  const real = (s.lines || []).filter(l => !l.totalOnly);
  if(real.length) stockIn(bkStockLines(real), 'returned_in', 'Sale removed: ' + s.voidReason, 'Void');
  bkSaveDemo(); showToast('Sale removed. It stays in the history.', 'success'); bkRefreshViews();
}
function bkPaySale(id){
  const s = BK.sales.find(x => x.id === id); if(!s) return;
  if(s.pending){ showToast('This sale is still waiting to upload. Try again when the internet is back.'); return; }
  slModal('bkPay', `<div class="sl-sheet-h"><b>${escapeHtml(s.customer)} paid</b><button class="sl-x" onclick="slClose('bkPay')">✕</button></div>
    <div class="sl-sub">Still owes ${bkPeso(bkSaleBalance(s))} from ${bkDayLabel(s.date)}.</div>
    <div class="field"><label>Amount</label><div class="ob-peso bk-big"><span>₱</span><input id="bkPayAmt" inputmode="decimal" value="${bkSaleBalance(s)}"></div></div>
    <div class="field"><label>Paid with</label><select id="bkPayM">${BK_SALE_PAY.filter(x => x[0] !== 'credit').map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
    <button class="btn btn-primary sl-wide" onclick="bkPaySaleSave('${id}')">Save payment</button>`);
}
async function bkPaySaleSave(id){
  const s = BK.sales.find(x => x.id === id); if(!s) return;
  const amt = Math.round((Number(String(document.getElementById('bkPayAmt').value).replace(/,/g, '')) || 0) * 100) / 100;
  if(!(amt > 0)) return markFieldInvalid('bkPayAmt', 'Enter the amount paid.');
  const payments = (s.payments || []).concat([{method: document.getElementById('bkPayM').value, amount: Math.min(amt, bkSaleBalance(s) || amt), date: APP_TODAY, by: bkMe()}]);
  if(myBusiness){ const { error } = await sb.from('downstream_sales').update({payments}).eq('id', id); if(error){ showToast(error.message, 'error'); return; } }
  s.payments = payments; bkSaveDemo(); slClose('bkPay'); showToast('Payment saved.', 'success'); bkRefreshViews();
}
function renderSalesBooksPage(){
  const page = document.getElementById('page-sales'); if(!page) return;
  if(!page.querySelector('#bkSalesBody')) page.innerHTML = bkHead('Sales', 'Every sale at the counter: walk-ins, GCash and utang. Stock comes out by itself.', `<button class="btn btn-primary" onclick="openQuickSale()">+ New sale</button>`) + '<div id="bkSalesBody"></div>';
  const body = document.getElementById('bkSalesBody');
  if(!BK.loaded){ body.innerHTML = bkLoadingHtml(); bkLoad().then(renderSalesBooksPage); return; }
  const day = bkSalesDay || APP_TODAY, boss = booksCanSeeTotals();
  const list = BK.sales.filter(s => s.date === day);
  const live = list.filter(s => !s.voidedAt);
  const sum = (f) => live.reduce((a, s) => a + (s.payments || []).filter(p => bkPayDate(p) === day && f(bkMethodKey(p.method))).reduce((b, p) => b + (Number(p.amount) || 0), 0), 0);
  const utang = live.filter(s => s.paidWith === 'credit').reduce((a, s) => a + bkSaleBalance(s), 0);
  const owing = bkLiveSales().filter(s => bkSaleBalance(s) > 0);
  const byCust = {}; owing.forEach(s => { (byCust[s.customer] = byCust[s.customer] || []).push(s); });
  const days = [APP_TODAY, addDaysIso(APP_TODAY, -1), addDaysIso(APP_TODAY, -2)];
  body.innerHTML = bkBranchPicker() + `<div class="bk-daybar">${days.map(d => `<button class="${d === day ? 'on' : ''}" onclick="bkSalesDay='${d}'; renderSalesBooksPage()">${bkDayLabel(d)}</button>`).join('')}
      <input type="date" value="${day}" max="${APP_TODAY}" onchange="bkSalesDay=this.value||null; renderSalesBooksPage()" aria-label="Pick a day"></div>
    <div class="bk-tiles">${bkTile('Sales', bkPeso(live.reduce((a, s) => a + Number(s.total), 0)), `${live.length} sale${live.length === 1 ? '' : 's'}`)}
      ${bkTile('Cash', bkPeso(sum(k => k === 'cash')), 'goes in the drawer')}${bkTile('GCash & Maya', bkPeso(sum(k => k === 'gcash' || k === 'maya')), 'check your phone')}
      ${bkTile('Utang', bkPeso(utang), 'not paid yet', utang >= 1 ? 'warn' : '')}</div>
    <section class="panel-card bk-list"><div class="panel-head"><h2>${bkDayLabel(day)}</h2>${day === APP_TODAY ? `<a class="lg-link" onclick="go('cashcount')">Count the cash →</a>` : ''}</div>
      ${list.length ? list.map(s => {
        const items = (s.lines || []).map(l => l.totalOnly ? 'Total only' : `${l.qty} × ${escapeHtml(l.product)}`).join(', ');
        const time = s.at ? new Date(s.at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit'}) : '';
        const below = (s.lines || []).some(l => (Number(l.unitCost) || 0) > (Number(l.unitPrice) || 0));
        return `<div class="bk-row${s.voidedAt ? ' void' : ''}"><div class="bk-row-m"><b>${items}</b><small>${s.pending ? '<span class="pending-sync-tag">⏳ Waiting to upload</span> ' : ''}${escapeHtml(s.customer)} · ${escapeHtml((BK_SALE_PAY.find(x => x[0] === s.paidWith) || [, s.paidWith || 'Paid'])[1])} · ${time} · by ${escapeHtml(s.by || '—')}${s.note ? ' · ' + escapeHtml(s.note) : ''}${below && boss ? ' · <span class="bk-bad">below cost</span>' : ''}${s.voidedAt ? ` · removed by ${escapeHtml(s.voidedBy || '')}: ${escapeHtml(s.voidReason || '')}` : ''}</small></div>
          <span class="bk-amt">${bkPeso(s.total)}</span>
          <span class="bk-row-a">${!s.voidedAt ? `<button class="sl-link" onclick="bkReceipt('${s.id}')">Receipt</button>` : ''}${!s.voidedAt && bkSaleBalance(s) > 0 ? `<button class="sl-link" onclick="bkPaySale('${s.id}')">Paid</button>` : ''}${boss && !s.voidedAt ? `<button class="sl-link bk-dim" onclick="bkVoidSale('${s.id}')">Remove</button>` : ''}</span></div>`;
      }).join('') : `<div class="bk-empty"><b>No sales yet${day === APP_TODAY ? ' today' : ''}.</b><span>Tap "+ New sale" for each sale, or one total at closing time.</span></div>`}</section>
    ${Object.keys(byCust).length ? `<section class="panel-card bk-list"><div class="panel-head"><h2>Utang from the counter</h2><span class="bk-dim">${bkPeso(owing.reduce((a, s) => a + bkSaleBalance(s), 0))}</span></div>
      ${Object.entries(byCust).sort((a, b) => b[1].reduce((x, s) => x + bkSaleBalance(s), 0) - a[1].reduce((x, s) => x + bkSaleBalance(s), 0)).map(([c, ss]) => {
        const old = ss.reduce((m, s) => s.date < m ? s.date : m, APP_TODAY), days = daysBetween(old, APP_TODAY);
        return `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(c)}</b><small>${ss.length} sale${ss.length > 1 ? 's' : ''} · oldest ${days} day${days === 1 ? '' : 's'} ago</small></div><span class="bk-amt ${days > 30 ? 'bk-bad' : ''}">${bkPeso(ss.reduce((x, s) => x + bkSaleBalance(s), 0))}</span><span class="bk-row-a"><button class="sl-link" onclick="bkPaySale('${ss[0].id}')">Paid</button></span></div>`;
      }).join('')}</section>` : ''}`;
}

/* ================= EXPENSES ================= */
let EXF = null;
function openExpenseForm(id){
  if(!BK.loaded){ bkLoad().then(() => openExpenseForm(id)); return; }
  const e = id ? BK.expenses.find(x => x.id === id) : null;
  EXF = e ? {cashMove: !!bkCat(e.category).transfer, id: e.id, amount: String(e.amount), category: e.category, paidFrom: e.paidFrom, date: e.date, vendor: e.vendor, staff: e.staff, note: e.note, repeat: e.repeat, photo: '', photoRef: e.receipt, reading: false, err: '', saving: false}
    : {amount: '', category: '', paidFrom: 'cash', date: APP_TODAY, vendor: '', staff: '', note: '', repeat: false, photo: '', reading: false, err: '', saving: false};
  exRender();
}
function exRender(){
  const cat = EXF.category ? bkCat(EXF.category) : null;
  const cats = EXF.cashMove ? BK_CATS.filter(c => c.transfer || c.drawing) : BK_CATS.filter(c => !c.transfer);
  if(cat && cat.transfer) EXF.paidFrom = 'cash';
  slModal('exModal', `<div class="sl-sheet-h"><b>${EXF.cashMove ? 'Cash in or out of the drawer' : EXF.id ? 'Edit expense' : 'Add an expense'}</b><button class="sl-x" onclick="slClose('exModal')">✕</button></div>
    ${EXF.cashMove ? `<div class="sl-sub">Not a sale and not an expense: money moved in or out. The cash count knows about it, so the drawer still adds up.</div>` : ''}
    <div class="field"><label>How much?</label><div class="ob-peso bk-big"><span>₱</span><input id="exAmt" inputmode="decimal" value="${escapeHtml(EXF.amount)}" placeholder="0" oninput="EXF.amount=this.value"></div></div>
    <div class="field"><label>Receipt photo <small>(optional, reads the amount for you)</small></label>
      <div class="ex-photo">${EXF.photo || EXF.photoRef ? `<span class="ex-photo-ok">✓ Photo added</span>` : ''}<label class="btn btn-outline ex-photo-btn">${EXF.reading ? 'Reading…' : EXF.photo || EXF.photoRef ? 'Change photo' : '📷 Take or choose a photo'}<input type="file" accept="image/*" capture="environment" onchange="exPhoto(this)" hidden></label></div></div>
    <div class="field"><label>${EXF.cashMove ? 'What happened?' : 'What for?'}</label><div class="ex-cats">${cats.map(c => `<button type="button" class="${EXF.category === c.k ? 'on' : ''}" onclick="EXF.category='${c.k.replace(/'/g, "\\'")}'; exRender()"><span aria-hidden="true">${c.ic}</span>${escapeHtml(c.k)}</button>`).join('')}</div></div>
    ${cat && cat.drawing ? `<div class="bk-note">Money the owner takes out is not an expense. It's kept apart so your profit stays right, and the cash count still adds up.</div>` : ''}
    ${cat && cat.cogs ? `<div class="bk-note">Stock bought with cash (palengke, quick buys) counts as the cost of what you sell.</div>` : ''}
    ${cat && cat.transfer === 'out' ? `<div class="bk-note">Cash taken from the drawer to deposit in the bank. Snap the deposit slip.</div>` : ''}
    ${cat && cat.transfer === 'in' ? `<div class="bk-note">Cash the owner added to the drawer, like extra change. It isn't a sale.</div>` : ''}
    ${cat && cat.transfer ? '' : `<div class="field"><label>Paid from</label><div class="sl-days bk-chips">${BK_PAID.map(([k, l]) => `<button type="button" class="${EXF.paidFrom === k ? 'on' : ''}" onclick="EXF.paidFrom='${k}'; exRender()">${l}</button>`).join('')}</div></div>`}
    <div class="row-2"><div class="field"><label>Date</label><input type="date" value="${EXF.date}" max="${APP_TODAY}" onchange="EXF.date=this.value||APP_TODAY"></div>
      <div class="field"><label>${cat && cat.staff ? 'Staff name' : cat && cat.transfer === 'out' ? 'Bank' : cat && cat.transfer ? 'Who' : 'Paid to'} <small>(optional)</small></label>${cat && cat.staff
        ? `<input maxlength="80" value="${escapeHtml(EXF.staff)}" oninput="EXF.staff=this.value" placeholder="e.g. Rico" list="exStaff"><datalist id="exStaff">${getActiveTeamMembers().map(m => `<option value="${escapeHtml(String(m.name).replace(/ \(You\)$/, ''))}">`).join('')}</datalist>`
        : `<input maxlength="120" value="${escapeHtml(EXF.vendor)}" oninput="EXF.vendor=this.value" placeholder="${cat && cat.transfer === 'out' ? 'e.g. BDO' : cat && cat.transfer ? 'e.g. the owner' : 'e.g. Meralco'}">`}</div></div>
    <div class="field"><label>Note <small>(optional)</small></label><input maxlength="500" value="${escapeHtml(EXF.note)}" oninput="EXF.note=this.value"></div>
    ${EXF.cashMove ? '' : `<label class="bk-check"><input type="checkbox" ${EXF.repeat ? 'checked' : ''} onchange="EXF.repeat=this.checked"> Every month (rent, bills). Nifti reminds you if it's not in yet.</label>`}
    <div class="sl-err" id="exErr">${escapeHtml(EXF.err)}</div>
    <button class="btn btn-primary sl-wide" onclick="exSave()" ${EXF.saving ? 'disabled' : ''}>${EXF.saving ? 'Saving…' : EXF.cashMove ? 'Save' : 'Save expense'}</button>`);
}
async function exPhoto(input){
  const f = input.files && input.files[0]; if(!f) return;
  try{ EXF.photo = await bkCompressImage(f, 1400); }catch(e){ showToast("Couldn't read that picture.", 'error'); return; }
  EXF.reading = !EXF.amount; exRender();
  if(!EXF.amount){
    const amt = await bkReadAmount(EXF.photo);
    if(!EXF) return;
    EXF.reading = false;
    if(amt){ EXF.amount = String(amt); showToast(`Read ${bkPeso(amt)} from the receipt. Check it before saving.`); }
    exRender();
  }
}
async function exSave(){
  const err = m => { EXF.err = m; const e = document.getElementById('exErr'); if(e) e.textContent = m; };
  const amount = Math.round((Number(String(EXF.amount).replace(/,/g, '')) || 0) * 100) / 100;
  if(!(amount > 0)) return err('Enter how much was spent.');
  if(!EXF.category) return err(EXF.cashMove ? 'Pick what happened.' : 'Pick what it was for.');
  if(bkCat(EXF.category).transfer) EXF.paidFrom = 'cash';
  const closed = bkClosedMsg(EXF.date || APP_TODAY) || (EXF.id && bkClosedMsg((BK.expenses.find(x => x.id === EXF.id) || {}).date)); if(closed) return err(closed);
  EXF.saving = true; exRender();
  const id = EXF.id || bkUid();
  let receipt = EXF.photoRef || '', laterPhoto = '';
  if(EXF.photo){ try{ receipt = await bkUploadPhoto(EXF.photo, 'exp-' + id); }catch(e){
    if(!myBusiness || EXF.id || !bkIsNetErr(e)){ EXF.saving = false; exRender(); return err("The photo didn't upload. Try again, or save without it."); }
    laterPhoto = EXF.photo; // offline: the photo goes up with the expense later
  } }
  const row = {category: EXF.category, amount, paid_from: EXF.paidFrom, spent_on: EXF.date || APP_TODAY, vendor: String(EXF.vendor || '').trim().slice(0, 120) || null,
    staff_name: String(EXF.staff || '').trim().slice(0, 80) || null, note: String(EXF.note || '').trim().slice(0, 500) || null, repeat_monthly: !!EXF.repeat, receipt_path: receipt || null};
  if(!EXF.id) row.branch = bkHereBranch();
  const bankLine = !EXF.id && window._bkBankPending; window._bkBankPending = null;
  if(myBusiness){
    const full = Object.assign({id, business_id: myBusiness.id}, row);
    const q = EXF.id ? sb.from('expenses').update(row).eq('id', id).select().single() : sb.from('expenses').insert(full).select().single();
    const { data, error } = laterPhoto || isOffline ? {error: {message: 'offline'}} : await q;
    if(error){
      if(EXF.id || !bkIsNetErr(error) || !bkQueueAdd({table: 'expenses', row: full, photo: laterPhoto, photoName: 'exp-' + id, at: new Date().toISOString(), by: bkMe()})){
        EXF.saving = false; exRender(); return err(EXF.id && bkIsNetErr(error) ? "No internet. Changes can be saved when you're back online." : "Couldn't save: " + error.message);
      }
      const local = bkRowExpense(Object.assign({created_at: new Date().toISOString(), created_by_name: bkMe()}, full)); local.pending = true; if(laterPhoto) local.receipt = '';
      BK.expenses.unshift(local);
      slClose('exModal'); showToast("Saved on this phone. It uploads when the internet is back.", 'warn'); EXF = null; bkRefreshViews(); return;
    }
    const mapped = bkRowExpense(data);
    const i = BK.expenses.findIndex(x => x.id === id); if(i > -1) BK.expenses[i] = mapped; else BK.expenses.unshift(mapped);
  } else {
    const boss = booksCanSeeTotals(), wait = amount >= bkApproveOver() && !boss;
    const e = {id, date: row.spent_on, category: row.category, amount, paidFrom: row.paid_from, vendor: row.vendor || '', note: row.note || '', staff: row.staff_name || '', receipt, repeat: row.repeat_monthly, by: bkMe(), at: new Date().toISOString(),
      status: wait ? 'submitted' : 'approved', approvedBy: wait ? '' : bkMe(), branch: row.branch || null};
    const i = BK.expenses.findIndex(x => x.id === id);
    if(i > -1){ const was = BK.expenses[i]; e.by = was.by; e.at = was.at; e.editedBy = bkMe(); e.branch = was.branch; e.status = boss ? (was.status || 'approved') : 'submitted'; BK.expenses[i] = e; } else BK.expenses.unshift(e);
    bkSaveDemo();
  }
  if(bankLine && typeof colStoreMatch === 'function') colStoreMatch({line_hash: bankLine.hash, line: bankLine, status: 'matched', payment_key: 'exp:' + id}).then(() => { if(colBankResult && colBankResult.out){ colBankResult.out.unknown = colBankResult.out.unknown.filter(x => x.hash !== bankLine.hash); colBankResult.out.known++; } });
  const waits = (BK.expenses.find(x => x.id === id) || {}).status === 'submitted';
  slClose('exModal'); showToast(EXF.cashMove ? 'Saved. The cash count includes it.' : waits ? `Saved. It's over ${bkPeso(bkApproveOver())}, so the owner will check it first.` : EXF.id ? 'Expense updated. The change is in the history.' : 'Expense saved.', 'success'); EXF = null;
  if(typeof lgInvalidate === 'function') lgInvalidate();
  bkRefreshViews();
}
async function bkRemoveExpense(id){
  const e = BK.expenses.find(x => x.id === id); if(!e) return;
  if(e.pending){ showToast('This is still waiting to upload. Try again when the internet is back.'); return; }
  const why = prompt('Why remove this expense? (kept in the history)', 'Entered twice');
  if(why === null) return;
  if(myBusiness){
    const { error } = await sb.from('expenses').update({deleted_at: new Date().toISOString(), delete_reason: String(why).slice(0, 200)}).eq('id', id);
    if(error){ showToast(error.message, 'error'); return; }
  }
  e.deletedAt = new Date().toISOString(); e.deletedBy = bkMe(); e.deleteReason = String(why).slice(0, 200);
  bkSaveDemo(); showToast('Removed. It stays in the history, crossed out.', 'success'); bkRefreshViews();
}
function renderExpensesPage(){
  const page = document.getElementById('page-expenses'); if(!page) return;
  const body = document.getElementById('bkExpBody');
  if(!BK.loaded){ body.innerHTML = bkLoadingHtml(); bkLoad().then(renderExpensesPage); return; }
  const m = bkMonthSel || bkMonth(APP_TODAY), boss = booksCanSeeTotals();
  const mx = bkMonthExpenses(m), prev = bkMonthExpenses(bkPrevMonth(m));
  const un = bkUnusualExpenses(m);
  let list = BK.expenses.filter(e => bkMonth(e.date) === m);
  if(bkExpFilter) list = list.filter(e => e.category === bkExpFilter);
  list.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.at || '').localeCompare(String(a.at || '')));
  const cats = Object.entries(mx.byCat).sort((a, b) => b[1] - a[1]);
  const max = cats.length ? cats[0][1] : 1;
  const delta = mx.total - prev.total;
  let lastDay = '';
  body.innerHTML = `<div class="bk-toolbar"><select onchange="bkMonthSel=this.value; renderExpensesPage()" aria-label="Month">${bkMonthOptions(m)}</select>
      ${bkExpFilter ? `<button class="chip active" onclick="bkExpFilter=''; renderExpensesPage()">${escapeHtml(bkExpFilter)} ✕</button>` : ''}</div>
    ${bkBranchPicker()}${bkApprovalsHtml()}
    ${boss ? `<div class="bk-tiles">${bkTile('Spent in ' + bkMonthLabel(m).split(' ')[0], bkPeso(mx.total), prev.total ? `${delta >= 0 ? '▲' : '▼'} ${bkPeso(Math.abs(delta))} vs last month` : 'Business costs, not stock', delta > prev.total * 0.2 && prev.total ? 'warn' : '')}
        ${bkTile('Stock bought in cash', bkPeso(mx.cogs), 'counted as cost of goods')}${bkTile('Owner took', bkPeso(mx.drawings), 'not an expense')}</div>
      ${un.spikes.length || un.missing.length ? `<section class="panel-card bk-alerts">${un.spikes.map(x => `<div class="bk-alert red"><b>${escapeHtml(x.cat)} is ${x.pct}% higher than usual</b><span>${bkPeso(x.now)} this month. Your last months averaged ${bkPeso(x.avg)}. Check for a leak, a wrong bill, or someone using it.</span></div>`).join('')}
        ${un.missing.map(x => `<div class="bk-alert amber"><b>${escapeHtml(x.cat)} isn't in yet</b><span>Usually ${bkPeso(x.usual)} around the ${x.day}${['th', 'st', 'nd', 'rd'][(x.day % 10 > 3 || [11, 12, 13].includes(x.day)) ? 0 : x.day % 10]}. <a class="lg-link" onclick="openExpenseForm(); EXF.category='${x.cat.replace(/'/g, "\\'")}'; EXF.amount='${x.usual}'; EXF.repeat=true; exRender()">Add it</a></span></div>`).join('')}</section>` : ''}
      ${cats.length ? `<section class="panel-card"><div class="panel-head"><h2>Where the money went</h2></div><div class="bk-bars">${cats.map(([k, v]) => `<button class="bk-bar" onclick="bkExpFilter='${k.replace(/'/g, "\\'")}'; renderExpensesPage()"><span class="bk-bar-l">${escapeHtml(k)}</span><span class="bk-bar-t"><i style="width:${Math.max(3, v / max * 100).toFixed(1)}%"></i></span><span class="bk-bar-v">${bkPeso(v)}</span></button>`).join('')}</div></section>` : ''}
      ${bkValeHtml(m)}`
    : `<div class="bk-note">You see the expenses you added. The owner sees everyone's.</div>`}
    <section class="panel-card bk-list"><div class="panel-head"><h2>${bkExpFilter ? escapeHtml(bkExpFilter) : 'All expenses'}</h2><span class="bk-dim">${list.filter(e => !e.deletedAt).length} entries</span></div>
      ${list.length ? list.map(e => {
        const head = e.date !== lastDay ? `<div class="bk-day">${bkDayLabel(e.date)}</div>` : ''; lastDay = e.date;
        const c = bkCat(e.category);
        return head + `<div class="bk-row${e.deletedAt ? ' void' : ''}"><span class="bk-ic" aria-hidden="true">${c.ic}</span><div class="bk-row-m"><b>${escapeHtml(e.category)}${e.staff ? ' · ' + escapeHtml(e.staff) : e.vendor ? ' · ' + escapeHtml(e.vendor) : ''}</b>
          <small>${e.pending ? '<span class="pending-sync-tag">⏳ Waiting to upload</span> ' : ''}${bkExpStatusTag(e)}${c.transfer || c.drawing ? 'not an expense · ' : ''}${escapeHtml((BK_PAID.find(x => x[0] === e.paidFrom) || [, e.paidFrom])[1])} · by ${escapeHtml(e.by || '—')}${e.editedBy ? ' · edited by ' + escapeHtml(e.editedBy) : ''}${e.note ? ' · ' + escapeHtml(e.note) : ''}${e.deletedAt ? ` · removed by ${escapeHtml(e.deletedBy || '')}: ${escapeHtml(e.deleteReason || '')}` : ''}</small></div>
          <span class="bk-amt">${bkPeso(e.amount)}</span><span class="bk-row-a">${e.receipt ? `<button class="sl-link" onclick="bkShowPhoto(${JSON.stringify(e.receipt).replace(/"/g, '&quot;')})">Receipt</button>` : ''}${boss && !e.deletedAt ? `<button class="sl-link" onclick="openExpenseForm('${e.id}')">Edit</button><button class="sl-link bk-dim" onclick="bkRemoveExpense('${e.id}')">Remove</button>` : !e.deletedAt && e.status === 'needs_correction' ? `<button class="sl-link" onclick="openExpenseForm('${e.id}')">Fix it</button>` : ''}</span></div>`;
      }).join('') : `<div class="bk-empty"><b>No expenses for ${bkMonthLabel(m)} yet.</b><span>Snap the receipt when you pay. Electricity, rent, salaries, gas: it all adds up here.</span></div>`}</section>`;
}

/* ================= CASH COUNT ================= */
let CC = null;
function ccTotal(){ return BK_DENOMS.reduce((s, d) => s + d * (Number(CC.den[d]) || 0), 0) + (Number(String(CC.coins).replace(/,/g, '')) || 0); }
function ccCounted(){ return CC.typed ? (Number(String(CC.total).replace(/,/g, '')) || 0) : ccTotal(); }
function ccStart(day){ CC = {day: day || APP_TODAY, den: {}, coins: '', typed: false, total: '', gcash: '', note: '', saving: false, err: '', done: null}; }
function ccFormHtml(){
  const boss = booksCanSeeTotals();
  return `<section class="panel-card cc-form"><div class="panel-head"><h2>Count the cash in the drawer</h2><span class="bk-dim">${bkDayLabel(CC.day)}</span></div>
    ${boss ? '' : '<div class="bk-note">Count what is really in the drawer. Don\'t look at the sales first: the owner compares it.</div>'}
    ${CC.typed ? `<div class="field"><label>Total cash counted</label><div class="ob-peso bk-big"><span>₱</span><input inputmode="decimal" value="${escapeHtml(CC.total)}" oninput="CC.total=this.value; ccLive()" placeholder="0"></div></div>`
      : `<div class="cc-den">${BK_DENOMS.map(d => `<label><span>₱${d.toLocaleString()}</span><input type="number" min="0" inputmode="numeric" value="${CC.den[d] || ''}" placeholder="0" oninput="CC.den[${d}]=this.value; ccLive()" aria-label="Number of ₱${d} bills"><small id="ccSub${d}">${CC.den[d] ? bkPeso(d * CC.den[d]) : ''}</small></label>`).join('')}
        <label><span>Coins</span><input inputmode="decimal" value="${escapeHtml(CC.coins)}" placeholder="₱0" oninput="CC.coins=this.value; ccLive()" aria-label="Coins total"><small></small></label></div>`}
    <div class="qs-sum"><span>Cash counted</span><b id="ccTotal">${bkPeso(ccCounted())}</b></div>
    <button class="sl-link" onclick="CC.typed=!CC.typed; renderCashCountPage()">${CC.typed ? 'Count by bills instead' : 'Type the total instead'}</button>
    <div class="row-2"><div class="field"><label>GCash / Maya received today <small>(optional)</small></label><div class="ob-peso"><span>₱</span><input inputmode="decimal" value="${escapeHtml(CC.gcash)}" oninput="CC.gcash=this.value" placeholder="from your phone"></div></div>
      <div class="field"><label>Note <small>(optional)</small></label><input maxlength="300" value="${escapeHtml(CC.note)}" oninput="CC.note=this.value" placeholder="e.g. paid the delivery guy ₱300"></div></div>
    <div class="sl-err">${escapeHtml(CC.err)}</div>
    <button class="btn btn-primary sl-wide" onclick="ccSave()" ${CC.saving ? 'disabled' : ''}>${CC.saving ? 'Saving…' : 'Save the count'}</button></section>`;
}
function ccLive(){
  BK_DENOMS.forEach(d => { const el = document.getElementById('ccSub' + d); if(el) el.textContent = CC.den[d] ? bkPeso(d * CC.den[d]) : ''; });
  const t = document.getElementById('ccTotal'); if(t) t.textContent = bkPeso(ccCounted());
}
async function ccSave(){
  const counted = Math.round(ccCounted() * 100) / 100;
  if(!(counted >= 0) || (!CC.typed && !Object.values(CC.den).some(v => Number(v) > 0) && !Number(CC.coins)) && !(CC.typed && String(CC.total).trim() !== '')){
    CC.err = 'Enter what you counted (₱0 is fine if the drawer is empty: type the total).'; renderCashCountPage(); return;
  }
  const drawer = bkHereBranch() || 'Main';
  const closed = bkClosedMsg(CC.day); if(closed){ CC.err = closed; renderCashCountPage(); return; }
  const exp = cashExpected(CC.day, drawer);
  const den = {}; BK_DENOMS.forEach(d => { if(Number(CC.den[d])) den[d] = Number(CC.den[d]); });
  const countedObj = {cash: counted, gcash: CC.gcash !== '' ? Number(String(CC.gcash).replace(/,/g, '')) || 0 : null, denominations: den, coins: Number(CC.coins) || 0};
  CC.saving = true; renderCashCountPage();
  if(myBusiness){
    const args = {p_day: CC.day, p_drawer: drawer, p_expected: {cash: exp.cash, gcash: exp.gcash, parts: exp.parts}, p_counted: countedObj, p_note: CC.note || null};
    const { data, error } = isOffline ? {error: {message: 'offline'}} : await sb.rpc('save_cash_count', args);
    if(error){
      // no signal at closing time: the count waits on this phone and is sent when the internet is back
      if(!bkIsNetErr(error) || !bkQueueAdd({rpc: 'save_cash_count', row: {id: 'cc:' + CC.day + ':' + drawer}, args, at: new Date().toISOString(), by: bkMe()})){ CC.saving = false; CC.err = error.message; renderCashCountPage(); return; }
      BK.countDays = BK.countDays.filter(c => !(c.day === CC.day && c.drawer === drawer)).concat([{day: CC.day, drawer, by: bkMe(), reopened: false, pending: true}]);
      CC.done = {saved: true, offline: true};
    } else { CC.done = data || {saved: true}; await bkLoad(true); }
  } else {
    const diff = Math.round((counted - exp.cash) * 100) / 100;
    BK.counts = BK.counts.filter(c => !(c.day === CC.day && (c.drawer || 'Main') === drawer));
    BK.counts.unshift({id: bkUid(), day: CC.day, drawer, expected: {cash: exp.cash, gcash: exp.gcash, parts: exp.parts}, counted: countedObj, difference: diff, note: CC.note || '', by: bkMe(), at: new Date().toISOString()});
    BK.countDays = BK.countDays.filter(c => !(c.day === CC.day && (c.drawer || 'Main') === drawer)).concat([{day: CC.day, drawer, by: bkMe(), reopened: false}]);
    bkSaveDemo();
    CC.done = booksCanSeeTotals() ? {saved: true, difference: diff, expected: exp.cash, counted} : {saved: true};
  }
  CC.saving = false;
  if(typeof lgInvalidate === 'function') lgInvalidate();
  showToast(CC.done && CC.done.offline ? 'Count saved on this phone. It\'s sent when the internet is back.' : 'Cash count saved.', CC.done && CC.done.offline ? 'warn' : 'success');
  renderCashCountPage();
  if(typeof updateBooksBadges === 'function') updateBooksBadges();
}
async function ccReopen(day){
  if(!confirm('Reopen ' + bkDayLabel(day) + ' so it can be counted again? The first count stays in the history.')) return;
  const drawer = bkHereBranch() || 'Main';
  if(myBusiness){ const { error } = await sb.rpc('reopen_cash_count', {p_day: day, p_drawer: drawer}); if(error){ showToast(error.message, 'error'); return; } await bkLoad(true); }
  else { const c = BK.counts.find(x => x.day === day && (x.drawer || 'Main') === drawer); if(c){ c.reopenedAt = new Date().toISOString(); } const d = BK.countDays.find(x => x.day === day && (x.drawer || 'Main') === drawer); if(d) d.reopened = true; bkSaveDemo(); }
  if(typeof lgInvalidate === 'function') lgInvalidate();
  ccStart(day); renderCashCountPage();
}
async function ccReview(id){
  const note = prompt('Checked. Add a note? (optional)', '');
  if(note === null) return;
  if(myBusiness){ const { error } = await sb.rpc('review_cash_count', {p_id: id, p_note: note}); if(error){ showToast(error.message, 'error'); return; } await bkLoad(true); }
  else { const c = BK.counts.find(x => x.id === id); if(c){ c.reviewedAt = new Date().toISOString(); c.reviewedBy = bkMe(); c.reviewNote = note; } bkSaveDemo(); }
  renderCashCountPage();
}
function ccBreakdown(exp){
  const p = exp.parts || {}, row = (l, v, sign) => v ? `<div class="cc-b"><span>${l}</span><b>${sign || ''}${bkPeso(v)}</b></div>` : '';
  return `<div class="cc-break">${row('Change fund (sukli) at opening', p.fund)}${row('Cash sales' + (p.n_sales ? ` (${p.n_sales})` : ''), p.sales, '+ ')}${row('Cash collected from customers', p.collections, '+ ')}
    ${row('Owner put in cash', p.ownerIn, '+ ')}${row('Expenses paid from the drawer', p.expenses, '− ')}${row('Paid to suppliers in cash', p.suppliers, '− ')}${row('Owner took', p.owner, '− ')}${row('Cash to bank', p.bank, '− ')}
    <div class="cc-b tot"><span>Should be in the drawer</span><b>${bkPeso(exp.cash)}</b></div>${exp.gcash ? `<div class="cc-b"><span>GCash / Maya that should have come in</span><b>${bkPeso(exp.gcash)}</b></div>` : ''}</div>`;
}
function ccDiffHtml(d){
  if(Math.abs(d) < 1) return '<span class="cc-diff ok">Matches ✓</span>';
  return d < 0 ? `<span class="cc-diff bad">Short ${bkPeso(-d)}</span>` : `<span class="cc-diff warn">Over ${bkPeso(d)}</span>`;
}
function renderCashCountPage(){
  const body = document.getElementById('bkCashBody'); if(!body) return;
  if(!BK.loaded){ body.innerHTML = bkLoadingHtml(); bkLoad().then(renderCashCountPage); return; }
  const boss = booksCanSeeTotals(), s = bkSettings();
  if(!CC) ccStart();
  const day = CC.day, drawer = bkHereBranch() || 'Main';
  const rec = BK.counts.find(c => c.day === day && (c.drawer || 'Main') === drawer) || null;
  const dayMeta = BK.countDays.find(c => c.day === day && (c.drawer || 'Main') === drawer);
  const closed = (rec && !rec.reopenedAt) || (dayMeta && !dayMeta.reopened);
  const days = []; for(let i = 0; i < 7; i++) days.push(addDaysIso(APP_TODAY, -i));
  let main;
  if(CC.done && !boss) main = `<section class="panel-card bk-empty ok"><b>Saved. Thank you!</b><span>${CC.done.offline ? 'No internet right now: it\'s kept on this phone and sent automatically. ' : ''}The owner will check it. Counted by ${escapeHtml(bkMe())}.</span></section>`;
  else if(closed && !boss) main = `<section class="panel-card bk-empty ok"><b>${bkDayLabel(day)} is already counted.</b><span>Counted by ${escapeHtml((rec && rec.by) || (dayMeta && dayMeta.by) || 'a teammate')}. If it needs a recount, ask the owner to reopen it.</span></section>`;
  else if(boss){
    const exp = cashExpected(day, drawer);
    main = `<div class="cc-grid"><section class="panel-card"><div class="panel-head"><h2>${bkDayLabel(day)}</h2>${rec ? ccDiffHtml(rec.difference) : '<span class="bk-dim">Not counted yet</span>'}</div>
        ${ccBreakdown(rec && rec.expected && rec.expected.parts ? rec.expected : exp)}
        ${rec ? `<div class="cc-b tot"><span>Counted by ${escapeHtml(rec.by || '—')}</span><b>${bkPeso(rec.counted.cash)}</b></div>${rec.counted.gcash != null ? `<div class="cc-b"><span>GCash / Maya they saw</span><b>${bkPeso(rec.counted.gcash)}</b></div>` : ''}
          ${rec.note ? `<div class="bk-note">“${escapeHtml(rec.note)}”</div>` : ''}
          <div class="bk-actions">${rec.reviewedAt ? `<span class="bk-dim">✓ Checked by ${escapeHtml(rec.reviewedBy || '')}${rec.reviewNote ? ': ' + escapeHtml(rec.reviewNote) : ''}</span>` : `<button class="btn btn-outline" onclick="ccReview('${rec.id}')">Mark as checked</button>`}
          ${rec.reopenedAt ? '<span class="bk-dim">Reopened for a recount</span>' : `<button class="sl-link" onclick="ccReopen('${day}')">Reopen for a recount</button>`}</div>` : ''}</section>
      ${!rec || rec.reopenedAt ? ccFormHtml() : ''}</div>`;
  } else main = ccFormHtml();
  const hist = boss ? BK.counts.slice().sort((a, b) => b.day.localeCompare(a.day)).slice(0, 31) : [];
  const m = bkMonth(APP_TODAY), sum = bkCashSummary(m);
  body.innerHTML = bkBranchPicker() + `<div class="bk-daybar">${days.map(d => `<button class="${d === day ? 'on' : ''}" onclick="ccStart('${d}'); renderCashCountPage()">${bkDayLabel(d)}</button>`).join('')}
      <button class="btn btn-outline bk-move-btn" onclick="openCashMove()">Cash in / out</button></div>
    ${boss ? `<div class="bk-tiles">${bkTile('Short this month', bkPeso(sum.short), sum.worst ? `worst ${bkDayLabel(sum.worst.day)}` : 'none', sum.short >= (s.cash_alert || 1) ? 'bad' : '')}
      ${bkTile('Over this month', bkPeso(sum.over), 'extra cash found')}${bkTile('Days not counted', String(sum.notCounted.length), 'days with sales, last 2 weeks', sum.notCounted.length ? 'warn' : '')}</div>` : ''}
    ${main}
    ${boss && hist.length ? `<section class="panel-card bk-list"><div class="panel-head"><h2>Every count</h2></div>
      <div class="lg-tbl-wrap"><table class="lg-tbl bk-tbl"><thead><tr><th>Day</th><th class="r">Should be</th><th class="r">Counted</th><th class="r">Difference</th><th class="lg-hide-s">Counted by</th><th class="lg-hide-s"></th></tr></thead><tbody>
      ${hist.map(c => `<tr onclick="ccStart('${c.day}'); renderCashCountPage(); window.scrollTo(0,0)"><td>${bkDayLabel(c.day)}</td><td class="r">${bkPeso(c.expected.cash)}</td><td class="r">${bkPeso(c.counted.cash)}</td><td class="r">${ccDiffHtml(c.difference)}</td><td class="lg-hide-s">${escapeHtml(c.by || '—')}</td><td class="lg-hide-s">${c.reviewedAt ? '✓ checked' : ''}</td></tr>`).join('')}
      </tbody></table></div></section>
    <section class="panel-card"><div class="panel-head"><h2>Settings</h2></div><div class="row-2">
      <div class="field"><label>Change fund (sukli) left in the drawer each morning</label><div class="ob-peso"><span>₱</span><input inputmode="decimal" value="${s.change_fund}" onchange="bkSaveSettings({change_fund: Number(this.value)||0}).then(renderCashCountPage)"></div></div>
      <div class="field"><label>Tell me when the cash is short by at least</label><div class="ob-peso"><span>₱</span><input inputmode="decimal" value="${s.cash_alert}" onchange="bkSaveSettings({cash_alert: Number(this.value)||0})"></div></div></div>
      <div class="bk-note">Staff count without seeing what the drawer should have. You get a phone alert when it's short.</div></section>${bkBranchSettingsHtml()}` : ''}`;
}

/* ================= PROFIT & PRICES ================= */
function bkItemRows(m){
  const sold = {};
  const add = (name, qty, rev, cost) => { const k = String(name); const r = sold[k] = sold[k] || {qty: 0, rev: 0, cost: 0}; r.qty += qty; r.rev += rev; r.cost += cost; };
  bkLiveSales().filter(s => bkMonth(s.date) === m).forEach(s => (s.lines || []).filter(l => !l.totalOnly).forEach(l => add(l.product, Number(l.qty) || 0, (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), (Number(l.qty) || 0) * (Number(l.unitCost) || bkItemCost(l.product)))));
  getSupplierPOs().filter(o => !['draft', 'cancelled', 'quote', 'sent', 'countered'].includes(o.status) && !(o.invoice && o.invoice.opening) && bkMonth(o.createdDate) === m)
    .forEach(o => (o.lineItems || []).forEach(l => add(l.product, Number(l.qty) || 0, (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), (Number(l.qty) || 0) * bkItemCost(l.product))));
  const names = new Set(inventoryData.map(i => i.name).concat((BK.menu || []).filter(x => x.active).map(x => x.name), Object.keys(sold)));
  return [...names].map(n => {
    const cost = bkItemCost(n), price = bkItemPrice(n), s = sold[n] || {qty: 0, rev: 0, cost: 0};
    return {name: n, cost, price, margin: price && cost ? (price - cost) / price : null, qty: s.qty, rev: s.rev, profit: s.rev - s.cost};
  }).sort((a, b) => b.profit - a.profit || b.qty - a.qty || a.name.localeCompare(b.name));
}
function bkCostRises(){
  const out = [];
  const by = {};
  getBuyerPOs().filter(o => !['draft', 'cancelled', 'quote', 'countered', 'sent'].includes(o.status)).sort((a, b) => String(a.createdDate).localeCompare(String(b.createdDate))).forEach(o => (o.lineItems || []).forEach(l => {
    const k = String(l.product).toLowerCase(); (by[k] = by[k] || []).push({po: o, price: Number(l.unitPrice) || 0, name: l.product});
  }));
  Object.values(by).forEach(list => {
    if(list.length < 2) return;
    const last = list[list.length - 1], before = list[list.length - 2];
    if(last.price > before.price && before.price > 0){
      const sell = bkItemPrice(last.name);
      out.push({name: last.name, from: before.price, to: last.price, supplier: last.po.supplierName, po: last.po.poNumber, sell, margin: sell ? (sell - last.price) / sell : null});
    }
  });
  return out.sort((a, b) => (b.to - b.from) / b.from - (a.to - a.from) / a.from);
}
async function bkSetItemNumber(name, field, val){
  const n = Math.round((Number(String(val).replace(/,/g, '')) || 0) * 100) / 100;
  const items = inventoryData.filter(i => i.name === name);
  if(!items.length){ showToast('Add this item to Stock first to keep its cost and price.'); return; }
  items.forEach(i => { i[field] = n || undefined; });
  syncInventoryToSupabase(items); scheduleNiftiSave();
  renderProfitPage();
}
function renderProfitPage(){
  const body = document.getElementById('bkProfitBody'); if(!body) return;
  if(!booksCanSeeTotals()){ body.innerHTML = bkLockedForStaff('profit'); return; }
  if(!BK.loaded){ body.innerHTML = bkLoadingHtml(); bkLoad().then(renderProfitPage); return; }
  const m = bkMonthSel || bkMonth(APP_TODAY);
  const rows = bkItemRows(m), below = bkBelowCost(m), rises = bkCostRises();
  const p = bkPnl(m), noCost = rows.filter(r => !r.cost && (r.qty || inventoryData.some(i => i.name === r.name))).length;
  const pct = v => v == null ? '—' : Math.round(v * 100) + '%';
  body.innerHTML = `<div class="bk-toolbar"><select onchange="bkMonthSel=this.value; renderProfitPage()" aria-label="Month">${bkMonthOptions(m)}</select></div>
    <div class="bk-tiles">${bkTile('Sales', bkPeso(p.sales), bkMonthLabel(m))}${bkTile('Cost of what you sold', bkPeso(p.cost), noCost ? `${noCost} item${noCost > 1 ? 's have' : ' has'} no cost yet` : 'from your supplier prices', noCost ? 'warn' : '')}
      ${bkTile('Gross profit', bkPeso(p.gross), p.sales ? pct(p.gross / p.sales) + ' of sales' : '', p.gross < 0 ? 'bad' : 'good')}</div>
    ${below.length || rises.length ? `<section class="panel-card bk-alerts">
      ${below.filter(r => r.kind === 'below').slice(0, 6).map(r => `<div class="bk-alert red"><b>${escapeHtml(r.l.product)} sold below cost</b><span>${bkPeso(r.l.unitPrice)} each, cost ${bkPeso(Number(r.l.unitCost) || bkItemCost(r.l.product))} · ${r.l.qty} sold ${r.s ? bkDayLabel(r.s.date).toLowerCase() + ' by ' + escapeHtml(r.by || '—') : 'to ' + escapeHtml(r.by || '') + ' (' + escapeHtml(r.po.poNumber) + ')'} · lost ${bkPeso(r.lost)}</span></div>`).join('')}
      ${below.filter(r => r.kind === 'discount').length ? `<div class="bk-alert amber"><b>${below.filter(r => r.kind === 'discount').length} sale${below.filter(r => r.kind === 'discount').length > 1 ? 's' : ''} under your price list</b><span>${bkPeso(below.filter(r => r.kind === 'discount').reduce((a, r) => a + r.lost, 0))} in discounts. Most by ${escapeHtml(Object.entries(below.filter(r => r.kind === 'discount').reduce((a, r) => { a[r.by] = (a[r.by] || 0) + r.lost; return a; }, {})).sort((a, b) => b[1] - a[1])[0][0] || '—')}.</span></div>` : ''}
      ${rises.slice(0, 5).map(r => `<div class="bk-alert amber"><b>${escapeHtml(r.name)}: your cost went up</b><span>${bkPeso(r.from)} → ${bkPeso(r.to)} from ${escapeHtml(r.supplier)} (${escapeHtml(r.po)}). ${r.sell ? `You still sell at ${bkPeso(r.sell)}, so your margin is ${pct(r.margin)}.` : 'Set your selling price below.'}</span></div>`).join('')}</section>` : ''}
    ${bkMenuPanel(true)}
    <section class="panel-card bk-list"><div class="panel-head"><h2>Every item</h2><span class="bk-dim">Tap a cost or price to change it</span></div>
      <div class="lg-tbl-wrap"><table class="lg-tbl bk-tbl"><thead><tr><th>Item</th><th class="r">Cost</th><th class="r">You sell at</th><th class="r">Margin</th><th class="r lg-hide-s">Sold</th><th class="r">Profit</th></tr></thead><tbody>
      ${rows.map(r => `<tr class="${r.margin != null && r.margin < 0 ? 'bk-tr-bad' : r.margin != null && r.margin < 0.05 ? 'bk-tr-warn' : ''}"><td>${escapeHtml(r.name)}${!r.cost ? ' <span class="bk-tag">no cost</span>' : ''}</td>
        ${bkMenuFind(r.name) ? `<td class="r">${bkPeso(r.cost)}</td><td class="r">${bkPeso(r.price)}</td>` : `<td class="r"><input class="bk-num" inputmode="decimal" value="${r.cost || ''}" placeholder="—" onchange="bkSetItemNumber(${JSON.stringify(r.name).replace(/"/g, '&quot;')}, 'unitCost', this.value)" aria-label="Cost of ${escapeHtml(r.name)}"></td>
        <td class="r"><input class="bk-num" inputmode="decimal" value="${r.price || ''}" placeholder="—" onchange="bkSetItemNumber(${JSON.stringify(r.name).replace(/"/g, '&quot;')}, 'sellPrice', this.value)" aria-label="Selling price of ${escapeHtml(r.name)}"></td>`}
        <td class="r">${pct(r.margin)}</td><td class="r lg-hide-s">${r.qty || ''}</td><td class="r lg-n ${r.profit < 0 ? 'bk-bad' : ''}">${r.qty ? bkPeso(r.profit) : '—'}</td></tr>`).join('')}
      </tbody></table></div></section>`;
}

/* ================= MONEY OVERVIEW ================= */
function bkMoneyFlows(m){
  const start = m + '-01', end = addDaysIso(addDaysIso(start, 32).slice(0, 7) + '-01', -1);
  const inCounter = bkLiveSales().reduce((a, s) => a + (s.payments || []).filter(p => { const d = bkPayDate(p); return d >= start && d <= end; }).reduce((b, p) => b + (Number(p.amount) || 0), 0), 0);
  const inOrders = bkCustomerPaymentsOn(start, end).reduce((a, r) => a + r.amount, 0);
  const outSup = bkSupplierPaymentsOn(start, end).reduce((a, r) => a + r.amount, 0);
  const ex = bkMonthExpenses(m);
  return {inCounter, inOrders, outSup, outExp: ex.total + ex.cogs, owner: ex.drawings, net: inCounter + inOrders - outSup - ex.total - ex.cogs - ex.drawings};
}
function booksFlagRows(flags){
  return flags.map(f => `<button class="bk-flag ${f.lvl}" onclick="${f.a}"><span class="bk-flag-dot" aria-hidden="true"></span><span class="bk-flag-t"><b>${f.t}</b><small>${escapeHtml(f.s)}</small></span><span class="bk-flag-v">${escapeHtml(f.v)}</span></button>`).join('');
}
function renderMoneyPage(){
  const body = document.getElementById('bkMoneyBody'); if(!body) return;
  if(!booksCanSeeTotals()){ body.innerHTML = bkLockedForStaff('money'); return; }
  if(!BK.loaded){ body.innerHTML = bkLoadingHtml(); bkLoad().then(renderMoneyPage); return; }
  const m = bkMonthSel || bkMonth(APP_TODAY), p = bkPnl(m), prev = bkPnl(bkPrevMonth(m)), f = bkMoneyFlows(m), flags = bkFlags(m);
  const owed = hmSum(unpaidInvoicesFor('supplier'), r => r.balance) + bkLiveSales().reduce((a, s) => a + bkSaleBalance(s), 0), owe = hmSum(unpaidInvoicesFor('buyer'), r => r.balance);
  const dl = (v, pv) => pv ? `<small class="${v >= pv ? 'up' : 'down'}">${v >= pv ? '▲' : '▼'} ${bkPeso(Math.abs(v - pv))} vs last month</small>` : '';
  const cats = Object.entries(p.byCat).sort((a, b) => b[1] - a[1]);
  body.innerHTML = `<div class="bk-toolbar"><select onchange="bkMonthSel=this.value; renderMoneyPage()" aria-label="Month">${bkMonthOptions(m)}</select>
      <span style="flex:1"></span><button class="btn btn-outline" onclick="bkDownloadPnl('${m}')">Download</button><button class="btn btn-outline" onclick="window.print()">Print</button></div>
    <section class="panel-card bk-flags-full"><div class="panel-head"><h2>Red flags</h2><span class="bk-dim">${flags.filter(x => x.lvl === 'red').length} need you now</span></div>${booksFlagRows(flags)}</section>
    <div class="bk-two">
      <section class="panel-card bk-pnl" id="bkPnlPrint"><div class="panel-head"><h2>Profit for ${bkMonthLabel(m)}</h2></div>
        <div class="pl-r"><span>Sales</span><b>${bkPeso(p.sales)}</b></div>
        <div class="pl-r pl-sub"><span>At the counter</span><span>${bkPeso(p.counter)}</span></div><div class="pl-r pl-sub"><span>Customer orders</span><span>${bkPeso(p.orders)}</span></div>
        <div class="pl-r"><span>− Cost of what you sold</span><b>${bkPeso(p.cost)}</b></div>
        <div class="pl-r tot"><span>Gross profit</span><b>${bkPeso(p.gross)}</b></div>
        <div class="pl-r"><span>− Expenses</span><b>${bkPeso(p.expenses)}</b></div>
        ${cats.map(([k, v]) => `<div class="pl-r pl-sub"><span>${escapeHtml(k)}</span><span>${bkPeso(v)}</span></div>`).join('')}
        <div class="pl-r big ${p.net < 0 ? 'neg' : ''}"><span>${p.net < 0 ? 'Loss' : 'Profit'}</span><b>${bkPeso(Math.abs(p.net))}</b></div>${dl(p.net, prev.sales ? prev.net : 0)}
        ${p.drawings ? `<div class="bk-note">The owner took ${bkPeso(p.drawings)} this month. That comes out of profit, but it isn't an expense.</div>` : ''}
        ${p.missingCost ? `<div class="bk-note">Some items have no cost yet, so profit looks higher than it is. <a class="lg-link" onclick="go('profit')">Add costs</a></div>` : ''}</section>
      <div>
        <section class="panel-card bk-pnl"><div class="panel-head"><h2>Money in and out</h2></div>
          <div class="pl-r"><span>Received at the counter</span><b class="up">${bkPeso(f.inCounter)}</b></div>
          <div class="pl-r"><span>Received from customer orders</span><b class="up">${bkPeso(f.inOrders)}</b></div>
          <div class="pl-r"><span>Paid to suppliers</span><b>− ${bkPeso(f.outSup)}</b></div>
          <div class="pl-r"><span>Expenses paid</span><b>− ${bkPeso(f.outExp)}</b></div>
          ${f.owner ? `<div class="pl-r"><span>Owner took</span><b>− ${bkPeso(f.owner)}</b></div>` : ''}
          <div class="pl-r tot"><span>Cash left over</span><b class="${f.net < 0 ? 'down' : 'up'}">${f.net < 0 ? '− ' : ''}${bkPeso(Math.abs(f.net))}</b></div></section>
        <div class="bk-tiles">${bkTile('Owed to you', bkPeso(owed), 'customers + utang', '', "pickLens('collections','supplier')")}${bkTile('You owe', bkPeso(owe), 'supplier bills', '', "pickLens('collections','buyer')")}</div>
      </div></div>`;
}
function bkDownloadPnl(m){
  const p = bkPnl(m), f = bkMoneyFlows(m);
  const rows = [['Nifti profit and money report', selfName(), bkMonthLabel(m)], [], ['Sales', p.sales], ['  At the counter', p.counter], ['  Customer orders', p.orders], ['Cost of what you sold', p.cost], ['Gross profit', p.gross], ['Expenses', p.expenses]];
  Object.entries(p.byCat).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => rows.push(['  ' + k, v]));
  rows.push([p.net < 0 ? 'Loss' : 'Profit', p.net], ['Owner took (not an expense)', p.drawings], [], ['Received at the counter', f.inCounter], ['Received from customer orders', f.inOrders], ['Paid to suppliers', f.outSup], ['Expenses paid', f.outExp]);
  rows.push([], ['Expenses list'], ['Date', 'Category', 'Paid to / staff', 'Paid from', 'Amount', 'Added by', 'Removed']);
  BK.expenses.filter(e => bkMonth(e.date) === m).forEach(e => rows.push([e.date, e.category, e.staff || e.vendor, e.paidFrom, e.amount, e.by, e.deletedAt ? 'removed: ' + e.deleteReason : '']));
  rows.push([], ['Counter sales'], ['Date', 'Customer', 'Items', 'Paid with', 'Total', 'By', 'Removed']);
  BK.sales.filter(s => bkMonth(s.date) === m).forEach(s => rows.push([s.date, s.customer, (s.lines || []).map(l => l.qty + ' x ' + l.product).join('; '), s.paidWith, s.total, s.by, s.voidedAt ? 'removed: ' + s.voidReason : '']));
  const esc = v => { const t = String(v == null ? '' : v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const blob = new Blob(['﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `nifti-money-${m}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ================= STOCK CHECK (on the Stock page) ================= */
let STK = null;
function renderStockCheckPanel(){
  const view = document.getElementById('inventoryMainView'); if(!view) return;
  let el = document.getElementById('stockCheckPanel');
  if(!el){ el = document.createElement('div'); el.id = 'stockCheckPanel'; view.insertBefore(el, view.firstChild); }
  if(!BK.loaded){ el.innerHTML = ''; bkLoad().then(renderStockCheckPanel); return; }
  const boss = booksCanSeeTotals(), m = bkMonth(APP_TODAY), loss = bkStockLoss(m), prom = bkPromised();
  const nProm = Object.keys(prom).length, lastCount = BK.moves.find(x => x.kind === 'count');
  el.innerHTML = `<section class="panel-card bk-stock"><div class="bk-stock-t">${boss ? `${bkTile('Missing this month', bkPeso(loss.missing), 'found short in counts', loss.missing >= 1 ? 'bad' : '', "openStockSheet('history','count')")}
      ${bkTile('Bad stock this month', bkPeso(loss.bad), 'expired, damaged, spoiled', loss.bad >= 1 ? 'warn' : '', "openStockSheet('history','bad')")}` : ''}
      ${bkTile('Promised to customers', String(nProm), nProm ? 'items in open orders' : 'nothing promised', '', nProm ? "openStockSheet('promised')" : '')}
      ${bkTile('Last spot count', lastCount ? bkDayLabel(lastCount.date) : 'Never', lastCount ? 'by ' + (lastCount.by || '—') : 'count a few items a day', lastCount ? '' : 'warn', "openStockSheet('count')")}</div>
    <div class="bk-actions"><button class="btn btn-outline" onclick="openStockSheet('count')">Spot count</button><button class="btn btn-outline" onclick="openStockSheet('bad')">Record bad stock</button><button class="btn btn-outline" onclick="openStockSheet('history')">Stock history</button></div></section>`;
}
function stkItemOptions(sel){
  return inventoryData.map(i => `<option value="${escapeHtml(i.code)}" ${i.code === sel ? 'selected' : ''}>${escapeHtml(i.name)}${i.warehouse && Object.keys(whLabel || {}).length > 1 ? ' · ' + escapeHtml(whLabel[i.warehouse] || i.warehouse) : ''}</option>`).join('');
}
function openStockSheet(kind, filter){
  if(!BK.loaded){ bkLoad().then(() => openStockSheet(kind, filter)); return; }
  STK = {kind, filter: filter || '', code: inventoryData[0] ? inventoryData[0].code : '', qty: '', reason: BK_BAD_REASONS[0], note: '', photo: '', err: '', saving: false, done: null};
  stkRender();
}
function stkRender(){
  const boss = booksCanSeeTotals();
  const item = inventoryData.find(i => i.code === STK.code);
  if(STK.kind === 'history'){
    let list = BK.moves.slice();
    if(STK.filter) list = list.filter(x => x.kind === STK.filter);
    if(STK.code && STK.itemOnly) list = list.filter(x => item && x.item === item.name);
    const kinds = ['', 'sold', 'received', 'bad', 'count', 'adjust'];
    slModal('stkModal', `<div class="sl-sheet-h"><b>Stock history</b><button class="sl-x" onclick="slClose('stkModal')">✕</button></div>
      <div class="sl-sub">Every change to your stock, who made it and why. Nobody can erase a line.</div>
      <div class="sl-days bk-chips">${kinds.map(k => `<button class="${STK.filter === k ? 'on' : ''}" onclick="STK.filter='${k}'; stkRender()">${k ? BK_MOVE[k] : 'All'}</button>`).join('')}</div>
      <div class="stk-list">${list.slice(0, 200).map(x => `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(x.item)}</b><small>${escapeHtml(BK_MOVE[x.kind] || x.kind)} · ${escapeHtml(x.reason || '')}${x.ref ? ' · ' + escapeHtml(x.ref) : ''} · ${bkDayLabel(x.date)} · by ${escapeHtml(x.by || '—')}</small></div>
        <span class="bk-amt ${x.qty < 0 && (x.kind === 'count' || x.kind === 'bad') ? 'bk-bad' : x.qty > 0 ? 'bk-good' : ''}">${x.qty > 0 ? '+' : ''}${x.qty}</span>${x.photo ? `<span class="bk-row-a"><button class="sl-link" onclick="bkShowPhoto(${JSON.stringify(x.photo).replace(/"/g, '&quot;')})">Photo</button></span>` : '<span></span>'}</div>`).join('') || '<div class="bk-empty"><span>Nothing here yet.</span></div>'}</div>`);
    return;
  }
  if(STK.kind === 'promised'){
    const prom = bkPromised();
    slModal('stkModal', `<div class="sl-sheet-h"><b>Promised to customers</b><button class="sl-x" onclick="slClose('stkModal')">✕</button></div>
      <div class="sl-sub">In orders you've confirmed but not delivered yet. Don't sell these at the counter.</div>
      ${Object.entries(prom).map(([k, q]) => { const it = inventoryData.filter(i => i.name.toLowerCase() === k), onHand = it.reduce((a, i) => a + Number(i.onHand), 0), name = it[0] ? it[0].name : k;
        return `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(name)}</b><small>${onHand} on the shelf · ${Math.max(0, onHand - q)} free to sell</small></div><span class="bk-amt ${q > onHand ? 'bk-bad' : ''}">${q} promised</span><span></span></div>`; }).join('')}`);
    return;
  }
  if(STK.done){
    slModal('stkModal', `<div style="text-align:center;padding:6px 0;"><div class="ob-check">✓</div><h2 style="font-family:var(--font-h);margin:8px 0 4px;">Saved</h2>
      <div class="sl-sub">${escapeHtml(STK.done)}</div></div><div class="sl-actions"><button class="btn btn-outline" onclick="slClose('stkModal')">Done</button><button class="btn btn-primary" style="flex:1;" onclick="STK.done=null; STK.qty=''; STK.note=''; STK.photo=''; stkRender()">${STK.kind === 'count' ? 'Count another item' : 'Record another'}</button></div>`);
    return;
  }
  const bad = STK.kind === 'bad';
  slModal('stkModal', `<div class="sl-sheet-h"><b>${bad ? 'Record bad stock' : 'Spot count'}</b><button class="sl-x" onclick="slClose('stkModal')">✕</button></div>
    <div class="sl-sub">${bad ? 'Expired, damaged or spoiled items come off your stock, with the reason and who recorded it.' : 'Count one item on the shelf. Do a few every day instead of one big count a year.'}</div>
    <div class="field"><label>Item</label><select onchange="STK.code=this.value; stkRender()">${stkItemOptions(STK.code)}</select></div>
    <div class="field"><label>${bad ? 'How many are bad?' : 'How many are on the shelf right now?'}</label><input id="stkQty" type="number" min="0" step="any" inputmode="decimal" value="${escapeHtml(STK.qty)}" oninput="STK.qty=this.value" placeholder="${item && item.unit ? item.unit : 'pcs'}"></div>
    ${bad ? `<div class="field"><label>Why?</label><div class="sl-days bk-chips">${BK_BAD_REASONS.map(r => `<button class="${STK.reason === r ? 'on' : ''}" onclick="STK.reason='${r}'; stkRender()">${r}</button>`).join('')}</div></div>
      <div class="field"><label>Photo <small>(optional, helps the owner)</small></label><label class="btn btn-outline ex-photo-btn">${STK.photo ? '✓ Photo added · change' : '📷 Take a photo'}<input type="file" accept="image/*" capture="environment" onchange="stkPhoto(this)" hidden></label></div>` : ''}
    <div class="field"><label>Note <small>(optional)</small></label><input maxlength="200" value="${escapeHtml(STK.note)}" oninput="STK.note=this.value"></div>
    ${!bad && boss && item ? `<div class="bk-note">Nifti has ${item.onHand} ${escapeHtml(item.unit || '')} on record. Staff don't see this number before counting.</div>` : ''}
    <div class="sl-err">${escapeHtml(STK.err)}</div>
    <button class="btn btn-primary sl-wide" onclick="stkSave()" ${STK.saving ? 'disabled' : ''}>${STK.saving ? 'Saving…' : 'Save'}</button>`);
}
async function stkPhoto(input){ const f = input.files && input.files[0]; if(!f) return; try{ STK.photo = await bkCompressImage(f, 1280); }catch(e){} stkRender(); }
async function stkSave(){
  const item = inventoryData.find(i => i.code === STK.code);
  const q = Number(STK.qty);
  if(!item){ STK.err = 'Pick an item.'; stkRender(); return; }
  if(STK.qty === '' || !(q >= 0)){ STK.err = 'Enter a number.'; stkRender(); return; }
  STK.saving = true; stkRender();
  let photo = '';
  if(STK.photo){ try{ photo = await bkUploadPhoto(STK.photo, 'stock-' + bkUid()); }catch(e){ photo = ''; } }
  const boss = booksCanSeeTotals();
  if(STK.kind === 'bad'){
    if(!(q > 0)){ STK.saving = false; STK.err = 'How many are bad?'; stkRender(); return; }
    const before = Number(item.onHand);
    item.onHand = before - q;
    if(typeof updateInvStatusFromStock === 'function') updateInvStatusFromStock(item);
    stockLabel(item, {kind: 'bad', reason: STK.reason + (STK.note ? ' · ' + STK.note : ''), photo, qty: -q});
    bkAfterStockChange([item]);
    STK.done = `${q} ${item.unit || ''} of ${item.name} taken off stock (${STK.reason.toLowerCase()}).`;
  } else {
    const diff = Math.round((q - Number(item.onHand)) * 1000) / 1000;
    if(diff){
      item.onHand = q;
      if(typeof updateInvStatusFromStock === 'function') updateInvStatusFromStock(item);
      stockLabel(item, {kind: 'count', reason: `Spot count: shelf ${q}` + (STK.note ? ' · ' + STK.note : ''), photo, qty: diff});
      bkAfterStockChange([item]);
    } else if(!myBusiness){
      BK.moves.unshift({id: bkUid(), item: item.name, qty: 0, kind: 'count', reason: `Spot count: matches (${q})`, date: APP_TODAY, at: new Date().toISOString(), by: bkMe(), unitCost: item.unitCost || null}); bkSaveDemo();
    }
    const cost = bkItemCost(item.name);
    STK.done = !boss ? 'Thank you. The owner sees the result.' : !diff ? `${item.name}: the shelf matches Nifti (${q}).` : diff < 0
      ? `${item.name}: ${-diff} missing${cost ? ' (' + bkPeso(-diff * cost) + ')' : ''}. Stock now shows ${q}.` : `${item.name}: ${diff} more than on record. Stock now shows ${q}.`;
  }
  STK.saving = false; STK.qty = '';
  stkRender();
  if(myBusiness) setTimeout(() => bkLoad(true).then(() => { if(document.getElementById('stockCheckPanel')) renderStockCheckPanel(); }), 1500);
}

/* ================= BILLS YOU OWE (Collections, suppliers' side) ================= */
function renderBillsOwed(){
  const el = document.getElementById('collectionsContent'); if(!el) return;
  const rows = unpaidInvoicesFor('buyer').sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0));
  const total = hmSum(rows, r => r.balance), late = hmSum(rows.filter(r => r.daysOverdue > 0), r => r.balance);
  const week = hmSum(rows.filter(r => r.due && r.daysOverdue <= 0 && r.daysOverdue >= -7), r => r.balance);
  el.innerHTML = `<div class="bk-tiles">${bkTile('You owe suppliers', bkPeso(total), `${new Set(rows.map(r => r.po.supplierId)).size} supplier${new Set(rows.map(r => r.po.supplierId)).size === 1 ? '' : 's'}`)}
      ${bkTile('Overdue', bkPeso(late), late ? 'pay these first' : 'nothing late', late >= 1 ? 'bad' : 'good')}${bkTile('Due this week', bkPeso(week), 'plan your cash')}</div>
    <section class="panel-card bk-list"><div class="panel-head"><h2>Bills, oldest first</h2></div>
    ${rows.length ? rows.map(r => `<div class="bk-row" onclick="setLens('buyer'); openOrderDetailModal('${r.po.id}', false)" style="cursor:pointer;"><div class="bk-row-m"><b>${escapeHtml(r.po.supplierName)}</b><small>${escapeHtml(r.po.poNumber)} · ${r.daysOverdue > 0 ? r.daysOverdue + ' day' + (r.daysOverdue > 1 ? 's' : '') + ' overdue' : r.daysOverdue === 0 ? 'due today' : r.due ? 'due ' + lgShortDate(r.due) : 'no due date'}${r.pending > 0 ? ' · ' + bkPeso(r.pending) + ' waiting for their OK' : ''}</small></div>
      <span class="bk-amt ${r.daysOverdue > 0 ? 'bk-bad' : ''}">${bkPeso(r.balance)}</span><span class="bk-row-a"><button class="sl-link">Pay</button></span></div>`).join('')
      : '<div class="bk-empty"><b>No unpaid supplier bills.</b><span>When a supplier bills you in Nifti, it shows here with its due date.</span></div>'}</section>`;
}

/* ================= wiring ================= */
function booksHomeStrip(){
  if(!BK.loaded) return '<div class="bk-strip loading"></div>';
  const m = bkMonth(APP_TODAY), p = bkPnl(m), c = bkCashSummary(m);
  const todayCount = BK.counts.find(x => x.day === APP_TODAY);
  return `<div class="bk-strip">
    <button onclick="go('money')"><small>Sales this month</small><b>${hmPeso(p.sales)}</b></button>
    <button onclick="go('money')"><small>Costs</small><b>${hmPeso(p.cost + p.expenses)}</b></button>
    <button onclick="go('money')" class="${p.net < 0 ? 'neg' : 'pos'}"><small>${p.net < 0 ? 'Loss' : 'Profit'}</small><b>${hmPeso(Math.abs(p.net))}</b></button>
    <button onclick="go('cashcount')" class="${todayCount ? (todayCount.difference < -0.5 ? 'neg' : 'pos') : ''}"><small>Today's cash</small><b>${todayCount ? (Math.abs(todayCount.difference) < 1 ? 'Matches' : (todayCount.difference < 0 ? 'Short ' : 'Over ') + hmPeso(Math.abs(todayCount.difference))) : 'Not counted'}</b></button></div>`;
}
function booksFlagsPanel(){
  if(!BK.loaded) return '';
  const flags = bkFlags();
  const reds = flags.filter(f => f.lvl === 'red').length;
  return `<section class="lg-panel bk-flags"><div class="lg-ph"><div><b>Red flags</b>${reds ? `<span class="lg-ct">${reds}</span>` : ''}</div><a class="lg-link" onclick="go('money')">Money</a></div>${booksFlagRows(flags)}</section>`;
}
function booksAfterHome(){
  if(!BK.loaded){ bkLoad().then(() => { if(document.querySelector('#page-dashboard.active')) renderOneHome(); updateBooksBadges(); }); return; }
  const host = homeHost(); if(!host) return;
  // staff who handle the cash: a nudge to count before closing
  if(!booksCanSeeTotals() && isPageAllowedForViewAsRole('cashcount') && !BK.countDays.some(c => c.day === APP_TODAY && !c.reopened)){
    const h = host.querySelector('.lg-head');
    if(h && !host.querySelector('.bk-count-nudge')) h.insertAdjacentHTML('afterend', `<div class="panel-card bk-count-nudge"><b>Count the cash before closing</b><span>It takes two minutes. The owner checks it against today's sales.</span><button class="btn btn-primary" onclick="go('cashcount')">Count now</button></div>`);
  }
  updateBooksBadges();
}
function updateBooksBadges(){
  const set = (id, txt) => { const el = document.getElementById(id); if(!el) return; el.textContent = txt || ''; el.style.display = txt ? '' : 'none'; };
  if(!BK.loaded){ set('moneyNavBadge', ''); set('cashcountNavBadge', ''); return; }
  set('moneyNavBadge', booksCanSeeTotals() ? String(bkFlags().filter(f => f.lvl === 'red').length || '') : '');
  const counted = BK.countDays.some(c => c.day === APP_TODAY && !c.reopened) || BK.counts.some(c => c.day === APP_TODAY && !c.reopenedAt);
  set('cashcountNavBadge', !counted && new Date().getHours() >= 17 ? '!' : '');
}
function booksOnNavigate(page){
  const map = {money: renderMoneyPage, expenses: renderExpensesPage, cashcount: renderCashCountPage, profit: renderProfitPage, sales: renderSalesBooksPage};
  if(map[page]){ if(page === 'cashcount') CC = null; map[page](); }
  if(page === 'inventory') renderStockCheckPanel();
}
renderSalesPage = function(){ renderSalesBooksPage(); };
const _renderCollectionsBase = renderCollectionsPage;
renderCollectionsPage = function(){
  const btn = document.querySelector('#page-collections .page-head .only-supplier');
  const h1 = document.querySelector('#page-collections .page-head h1'), sub = document.querySelector('#page-collections .page-head p');
  if(currentAppRole === 'buyer'){
    if(h1) h1.textContent = 'Bills you owe'; if(sub) sub.textContent = 'What you owe your suppliers, oldest first, so nothing gets late.';
    return renderBillsOwed();
  }
  if(h1) h1.textContent = 'Who owes you'; if(sub) sub.textContent = 'Who to chase today, promises to pay, and where every peso is.';
  return _renderCollectionsBase.apply(this, arguments);
};
