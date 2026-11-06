/* ===== Home: "What runs out" =====
   Days left = stock on hand ÷ how fast it really sells (last 4 weeks of sales, the latest week weighted more;
   falls back to the item's own days-left figure when there's no sales history yet).
   Reorder line = supplier delivery time + critical level (default 5 days, editable).
     red    = at or below the reorder line: order now, or stock drops under the critical level before a delivery arrives
     yellow = within the warning window above the line (default 10 days)
     green  = covered
   Settings are saved with the business (books_settings.stock_levels: {critical, warn}). */
let srMode = (() => { try{ return localStorage.getItem('nifti_sr_mode') || 'days'; }catch(e){ return 'days'; } })();
let srAll = false, srEdit = false, srOpen = null;
const SR_MAXD = 45;
const SR_IC = {
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  rate: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  peso: '<path d="M7 20V4h6a4.5 4.5 0 0 1 0 9H7M4 8h14M4 11h14"/>'
};
const srI = k => `<svg class="sr-i" viewBox="0 0 24 24" aria-hidden="true">${SR_IC[k]}</svg>`;
function srLevels(){ const s = (typeof bkSettings === 'function' ? bkSettings().stock_levels : null) || {};
  return {critical: Number(s.critical) > 0 ? Number(s.critical) : 5, warn: Number(s.warn) > 0 ? Number(s.warn) : 10}; }
function srRate(name){
  const moves = (typeof BK !== 'undefined' && BK.moves) ? BK.moves.filter(m => m.item === name && m.kind === 'sold' && m.qty < 0) : [];
  if(moves.length < 2) return null;
  const since = d => moves.filter(m => daysBetween(m.date, APP_TODAY) < d && daysBetween(m.date, APP_TODAY) >= 0).reduce((a, m) => a - m.qty, 0);
  const r7 = since(7) / 7, r28 = since(28) / 28;
  return r28 > 0 ? (r7 > 0 ? .6 * r7 + .4 * r28 : r28) : null;
}
function srRows(){
  const L = srLevels(), multi = new Set(inventoryData.map(i => i.warehouse || '')).size > 1;
  const byName = {}; inventoryData.forEach(i => { byName[i.name] = (byName[i.name] || 0) + (Number(i.onHand) || 0); });
  return inventoryData.filter(i => i && i.name).map(i => {
    const on = Number(i.onHand) || 0, leadKnown = Number(i.leadTime) > 0, lead = leadKnown ? Number(i.leadTime) : 7;
    const measured = srRate(i.name), share = byName[i.name] ? on / byName[i.name] : 1;
    let rate = measured != null ? measured * share : null;
    if(rate == null && i.daysLeft != null && i.daysLeft !== '' && Number(i.daysLeft) > 0) rate = on / Number(i.daysLeft);
    const days = rate > 0 ? on / rate : null, line = lead + L.critical;
    const risk = days == null ? 'n' : days <= line ? 'r' : days <= line + L.warn ? 'y' : 'g';
    const cost = typeof bkStockCost === 'function' ? (Number(bkStockCost(i.name)) || 0) : 0;
    const wh = multi && typeof whLabel !== 'undefined' && whLabel[i.warehouse] ? whLabel[i.warehouse].split(' — ')[0] : (typeof whLabel !== 'undefined' && whLabel[i.warehouse] ? whLabel[i.warehouse].split(' — ')[0] : '');
    const orderIn = days == null ? null : Math.floor(days - line);
    const suggest = rate > 0 ? Math.max(0, Math.ceil(rate * (lead + 30) - on)) : 0;
    return {code: i.code, name: i.name, wh, on, unit: i.unit || '', lead, leadKnown, rate, days, line, risk, cost, value: on * cost, sup: i.supplier || '', orderIn, suggest,
      slow: days == null || days > 60, drafted: i.reorderDraftPoId || null};
  });
}
function srSetMode(m){ srMode = m; srOpen = null; try{ localStorage.setItem('nifti_sr_mode', m); }catch(e){} srRefresh(); }
function srRefresh(){ const el = document.getElementById('srCard'); if(el) el.innerHTML = srSection(); }
function srFmtDays(d){ return d == null ? '—' : d < 10 ? (Math.round(d * 10) / 10).toString().replace(/\.0$/, '') : String(Math.round(d)); }
function srDateIso(n){ return addDaysIso(APP_TODAY, Math.max(0, Math.round(n))); }
function srDate(n){ return new Date(srDateIso(n) + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}); }
function srNum(n){ return n >= 10 ? Math.round(n) : Math.round(n * 10) / 10; }
function srPeso(n){ return '₱' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('en-PH'); }
async function srSaveLevels(){
  const critical = Number((document.getElementById('srCrit') || {}).value) || 5, warn = Number((document.getElementById('srWarn') || {}).value) || 10;
  if(critical < 1 || warn < 1){ showToast('Use at least 1 day for each.', 'error'); return; }
  if(await bkSaveSettings({stock_levels: {critical, warn}})){ srEdit = false; srRefresh(); showToast(`Saved: critical level ${critical} days, warning ${warn} days before the line.`, 'success'); }
}
function srLevelsPanel(L){
  return `<div class="sr-lv"><div class="sr-lv-h"><b>Set your stock levels</b><button type="button" class="sr-x" onclick="srEdit=false; srRefresh()" aria-label="Close">✕</button></div>
    <label class="sr-f"><span>Critical level: never go below</span><span class="sr-in"><input id="srCrit" type="number" min="1" max="60" value="${L.critical}" inputmode="numeric"> days of stock</span></label>
    <label class="sr-f"><span>Warn me (yellow)</span><span class="sr-in"><input id="srWarn" type="number" min="1" max="60" value="${L.warn}" inputmode="numeric"> days before the reorder line</span></label>
    <p class="sr-lv-n">Reorder line = each supplier's delivery time + your critical level.</p>
    <div class="sr-lv-f"><button type="button" class="btn ghost" onclick="srEdit=false; srRefresh()">Cancel</button><button type="button" class="btn" onclick="srSaveLevels()">Save</button></div></div>`;
}
function srToggle(code){ srOpen = srOpen === code ? null : code; srRefresh(); if(srOpen){ const el = document.getElementById('srp-' + code); if(el) el.scrollIntoView({behavior: 'smooth', block: 'nearest'}); } }
function srSetQty(code, q){ const el = document.getElementById('srQty-' + code); if(el){ el.value = q; srCost(code); } }
function srCost(code){ const r = srRows().find(x => x.code === code); const q = Number((document.getElementById('srQty-' + code) || {}).value) || 0, price = srPrice(r), el = document.getElementById('srCost-' + code);
  if(el) el.textContent = price ? srPeso(q * price) : 'price not set yet'; }
function srPrice(r){ if(!r) return 0; const sid = typeof findSupplierIdByName === 'function' ? findSupplierIdByName(r.sup) : null; const p = sid && typeof lookupKnownUnitPrice === 'function' ? Number(lookupKnownUnitPrice(sid, r.name)) || 0 : 0; return p || r.cost || 0; }
function srPanel(r){
  const L = srLevels(), price = srPrice(r), weeks = r.rate ? [[14, '2 weeks'], [30, '1 month'], [60, '2 months']].map(([d, l]) => [Math.max(0, Math.ceil(r.rate * (r.lead + d) - r.on)), l]) : [];
  const q = r.suggest || (weeks[1] ? weeks[1][0] : 0);
  return `<div class="sr-p" id="srp-${r.code}">
    <div class="sr-pg">
      <div><small>On hand</small><b>${r.on}${r.unit ? ' ' + escapeHtml(r.unit) : ''}</b></div>
      <div><small>Sells</small><b>${r.rate ? srNum(r.rate) + ' a day' : 'no sales yet'}</b></div>
      <div><small>Runs out</small><b class="${r.risk === 'r' ? 'tr' : ''}">${r.days == null ? '—' : srDate(Math.floor(r.days)) + ' · ' + srFmtDays(r.days) + ' days'}</b></div>
      <div><small>Reorder line</small><b>${r.line} days of stock</b></div>
      <div><small>Supplier</small><b>${escapeHtml(r.sup || 'Not set')}</b></div>
      <div><small>Delivers in</small><b>${r.lead} day${r.lead === 1 ? '' : 's'}${r.leadKnown ? '' : ' (assumed)'}</b></div>
    </div>
    ${r.drafted ? `<div class="sr-pn">A draft order for this item is ready. <button type="button" class="sr-lnk" onclick="openCreatePOModal('${r.drafted}')">Review it ›</button></div>` : ''}
    <div class="sr-po"><div class="sr-po-h"><b>Reorder</b><span>${r.risk === 'r' ? 'Order today to stay above ' + L.critical + ' days of stock.' : r.risk === 'y' ? 'Order by ' + (r.orderIn <= 0 ? 'today' : srDate(r.orderIn)) + '.' : 'No need yet. Covered until about ' + srDate(Math.floor((r.days || 0) - r.line)) + '.'}</span></div>
      <div class="sr-po-row"><label class="sr-q"><span>Quantity</span><input id="srQty-${r.code}" type="number" min="1" inputmode="numeric" value="${q || ''}" oninput="srCost('${r.code}')"> ${escapeHtml(r.unit || 'units')}</label>
        ${weeks.length ? `<span class="sr-chips">${weeks.map(([n, l]) => `<button type="button" onclick="srSetQty('${r.code}', ${n})">${l} · ${n}</button>`).join('')}</span>` : ''}</div>
      <div class="sr-po-row"><label class="sr-q"><span>Deliver by</span><input id="srDate-${r.code}" type="date" value="${srDateIso(r.lead)}"></label><span class="sr-est">Estimated cost <b id="srCost-${r.code}">${price && q ? srPeso(q * price) : price ? srPeso(0) : 'price not set yet'}</b>${price ? ` <small>at ${srPeso(price)} each</small>` : ''}</span></div>
      <div class="sr-po-a"><button type="button" class="btn" onclick="srReorder('${r.code}')">Create draft order</button><button type="button" class="btn ghost" onclick="srCount('${r.code}')">Record a stock count</button><button type="button" class="btn ghost" onclick="srToggle('${r.code}')">Close</button></div></div>
  </div>`;
}
async function srReorder(code){
  if(typeof requirePermission === 'function' && !requirePermission('reorderStock')) return;
  if(typeof requireReorderToolsEntitlement === 'function' && !requireReorderToolsEntitlement()) return;
  const item = inventoryData.find(i => i.code === code); if(!item) return;
  const qty = Number((document.getElementById('srQty-' + code) || {}).value), date = (document.getElementById('srDate-' + code) || {}).value;
  if(!(qty > 0) || !date){ showToast('Add a quantity and a delivery date first.', 'error'); return; }
  const supplierId = findSupplierIdByName(item.supplier);
  if(!supplierId){ showToast(`"${item.supplier}" isn't in your supplier list yet. Add them under Customers & suppliers.`, 'error'); return; }
  let po = item.reorderDraftPoId ? getPO(item.reorderDraftPoId) : null; if(po && po.status !== 'draft') po = null;
  if(po){ po.lineItems = [{product: item.name, qty, unitPrice: po.lineItems[0].unitPrice}]; po.requestedDeliveryDate = date; poLogHistory(po, 'buyer', 'Draft updated from Home · What runs out'); }
  else {
    po = await createDraftPOObject({supplierId, lineItems: [{product: item.name, qty, unitPrice: srPrice(srRows().find(x => x.code === code)) || lookupKnownUnitPrice(supplierId, item.name)}], requestedDeliveryDate: date, notes: ''});
    if(!po){ showToast('Could not create the draft. Please try again.', 'error'); return; }
    item.reorderDraftPoId = po.id; poLogHistory(po, 'buyer', 'Draft created from Home · What runs out');
    if(typeof pushBuyerInboxItem === 'function') pushBuyerInboxItem({title: 'Draft ready to send — ' + item.name, meta: po.poNumber + ' · ' + qty + ' units from ' + po.supplierName, pillLabel: 'Draft', pillClass: 'pill-lowstock', poId: po.id});
  }
  item.reordered = true; item.reorderQty = qty; item.reorderDate = date;
  if(typeof markOnboardingActionTaken === 'function') markOnboardingActionTaken();
  srRefresh(); openCreatePOModal(po.id);
}
function srCount(code){ openStockSheet('count'); setTimeout(() => { if(typeof STK !== 'undefined' && STK){ STK.code = code; stkRender(); } }, 50); }
function srSection(){
  const rows = srRows(); if(!rows.length) return `<div class="sect-h"><h4>What runs out</h4></div><p class="sr-note">Add products in Stock to see what runs out.</p>`;
  const L = srLevels(), days = srMode !== 'value';
  const known = rows.filter(r => r.days != null), nos = rows.filter(r => r.days == null);
  const nr = known.filter(r => r.risk === 'r').length, ny = known.filter(r => r.risk === 'y').length, ng = known.filter(r => r.risk === 'g').length;
  const total = rows.reduce((a, r) => a + r.value, 0), slowV = rows.filter(r => r.slow).reduce((a, r) => a + r.value, 0);
  const list = days ? known.sort((a, b) => a.days - b.days) : rows.slice().sort((a, b) => b.value - a.value);
  const mxV = Math.max(1, ...list.map(r => r.value)), shown = srAll ? list : list.slice(0, 8);
  const row = r => {
    const meta = `<span class="sr-m1">${r.wh ? srI('pin') + escapeHtml(r.wh) + '<i>·</i>' : ''}${srI('box')}${r.on}${r.unit ? ' ' + escapeHtml(r.unit) : ''} on hand<i>·</i>${srI('rate')}${r.rate ? 'sells ' + srNum(r.rate) + '/day' : 'no sales yet'}</span>
      <span class="sr-m2">${srI('truck')}${escapeHtml(r.sup || 'No supplier set')}<i>·</i>delivers in ${r.lead} day${r.lead === 1 ? '' : 's'}${r.leadKnown ? '' : ' (assumed)'}</span>`;
    let bar, val, tag;
    if(days){
      const w = Math.min(r.days, SR_MAXD) / SR_MAXD * 100;
      tag = r.risk === 'r' ? `<span class="sr-act r">Order today</span>` : r.risk === 'y' ? `<span class="sr-act y">Order by ${r.orderIn <= 0 ? 'today' : srDate(r.orderIn)}</span>` : `<span class="sr-act g">Covered</span>`;
      bar = `<span class="sr-t" aria-hidden="true"><i style="width:${Math.max(1.5, w).toFixed(1)}%"></i><u style="left:${(Math.min(r.line, SR_MAXD) / SR_MAXD * 100).toFixed(1)}%" title="Reorder line: ${r.line} days"></u></span>`;
      val = `<b>${srFmtDays(r.days)} day${srFmtDays(r.days) === '1' ? '' : 's'}</b><small>runs out ${srDate(Math.floor(r.days))}</small>`;
    } else {
      const tone = r.risk === 'r' ? 'r' : r.risk === 'y' ? 'y' : r.slow ? 'slow' : 'g';
      tag = `<span class="sr-act ${tone}">${tone === 'r' ? 'Running out' : tone === 'y' ? 'Order soon' : tone === 'slow' ? (r.days == null ? 'Not selling' : 'Slow seller') : 'Healthy'}</span>`;
      bar = `<span class="sr-t"><i style="width:${Math.max(1.5, r.value / mxV * 100).toFixed(1)}%"></i></span>`;
      val = `<b>${r.cost ? srPeso(r.value) : '—'}</b><small>${r.cost && total ? Math.round(r.value / total * 100) + '% of stock' : 'cost not set'}</small>`;
      r = Object.assign({}, r, {tone});
    }
    const cls = days ? r.risk : r.tone, open = srOpen === r.code;
    return `<div class="sr-item${open ? ' open' : ''}"><button type="button" class="sr-row${days ? '' : ' sr-val'} is-${cls}" aria-expanded="${open}" onclick="srToggle('${r.code}')">
        <span class="sr-l"><b>${escapeHtml(r.name)} ${tag}</b>${meta}</span>${bar}<span class="sr-v">${val}</span><span class="sr-chev" aria-hidden="true">›</span></button>
      ${open ? srPanel(r) : ''}</div>`;
  };
  const key = days
    ? `<div class="sr-key"><p><b>Smart colours</b> use each supplier's delivery time and your ${L.critical}-day critical level.</p><ul>
        <li><i class="r"></i><b>Red · order today:</b> at or under the black line. Without an order now, stock drops below ${L.critical} days before the delivery arrives.</li>
        <li><i class="y"></i><b>Yellow · order soon:</b> within ${L.warn} days of the line.</li>
        <li><i class="g"></i><b>Green · covered:</b> more than that.</li>
        <li><u></u><b>Black line · reorder point:</b> delivery time + ${L.critical} days.</li></ul></div>`
    : `<div class="sr-key"><p><b>${srPeso(total)} on the shelf at cost.</b>${total ? ` ${Math.round(slowV / total * 100)}% of it is slow or not selling.` : ''}</p><ul class="sr-inline">
        <li><i class="r"></i>Running out</li><li><i class="y"></i>Order soon</li><li><i class="g"></i>Healthy</li><li><i class="slow"></i>Slow or not selling: cash tied up</li></ul></div>`;
  return `<div class="sect-h"><h4>What runs out</h4><span class="mh-sp"></span>
      <span class="sr-seg" role="group" aria-label="Show stock by"><button type="button" aria-pressed="${days}" onclick="srSetMode('days')">Days left</button><button type="button" aria-pressed="${!days}" onclick="srSetMode('value')">Pesos on the shelf</button></span>
      <button type="button" class="sch-btn" onclick="srEdit=!srEdit; srRefresh()" aria-expanded="${srEdit}">Stock levels: ${L.critical}-day critical</button></div>
    ${srEdit ? srLevelsPanel(L) : ''}
    ${key}
    <div class="sr-list">${shown.map(row).join('')}</div>
    ${days ? `<div class="sr-axis" aria-hidden="true"><span></span><span class="sr-ax">${[0, 7, 14, 21, 30, 45].map(v => `<i style="left:${v / SR_MAXD * 100}%">${v}${v === 45 ? '+' : ''}</i>`).join('')}</span><span>days left</span></div>` : ''}
    ${list.length > 8 ? `<button type="button" class="sr-more" onclick="srAll=!srAll; srRefresh()">${srAll ? 'Show fewer' : `Show all ${list.length}`}</button>` : ''}
    ${days && nos.length ? `<p class="sr-nos"><b>No sales recorded yet (${nos.length}):</b> ${nos.map(r => escapeHtml(r.name) + (r.wh ? ' (' + escapeHtml(r.wh) + ')' : '')).join(', ')}.</p>` : ''}`;
}
