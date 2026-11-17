/* ===== Round 41 ===== */

/* ---------- 1. Team board: nothing on a card ever changes by itself ---------- */
// The job is shown exactly as it was typed: the "plain words" pass never rewrites it.
(function(){
  if(typeof nf33TCard !== 'function') return;
  const base = nf33TCard;
  nf33TCard = function(t){ return base(t).replace('<div class="nf39-ct"><b>', '<div class="nf39-ct"><b class="nf26-raw">'); };
  window.nf33TCard = nf33TCard;
})();
// The board is drawn off screen first and only swapped in when something on it really changed,
// so picking the same person again (or a timer refresh) redraws nothing.
(function(){
  const rtl = window.renderTaskList;
  if(typeof rtl !== 'function' || rtl._nf41) return;
  const w = function(){
    const real = document.getElementById('taskListOpen');
    if(!real || !real.parentElement) return rtl.apply(this, arguments);
    const tmp = document.createElement('div'); tmp.style.display = 'none';
    real.id = 'taskListOpen__live'; tmp.id = 'taskListOpen'; real.parentElement.insertBefore(tmp, real);
    let r;
    try{ r = rtl.apply(this, arguments); }
    finally{ const html = tmp.innerHTML; tmp.remove(); real.id = 'taskListOpen'; if(real._nf41 !== html){ real.innerHTML = html; real._nf41 = html; } }
    return r;
  };
  Object.keys(rtl).forEach(k => { w[k] = rtl[k]; }); w._nf41 = true;
  window.renderTaskList = w; try{ renderTaskList = w; }catch(e){}
})();
// Trash shows where each job was when it was deleted
const NF41_COL = {todo: ['To do', 'td'], doing: ['Doing', 'dg'], done: ['Done', 'dn']};
(function(){
  if(typeof nf40Trash !== 'function') return;
  const base = nf40Trash;
  nf40Trash = function(){
    base.apply(this, arguments);
    const box = document.getElementById('nf40Trash'); if(!box) return;
    box.querySelectorAll('.nf40-trow').forEach(row => {
      const btn = row.querySelector('button[onclick*="nf40Restore"]'), m = btn && (btn.getAttribute('onclick') || '').match(/nf40Restore\('([^']+)'/); if(!m) return;
      const t = teamTasks.find(x => x.id === m[1]); if(!t || row.querySelector('.nf41-st')) return;
      const [label, cls] = NF41_COL[typeof nf33TCol === 'function' ? nf33TCol(t) : 'todo'] || NF41_COL.todo;
      const b = row.querySelector('.nf40-tm b'); if(b){ b.classList.add('nf26-raw'); b.insertAdjacentHTML('beforebegin', `<span class="nf41-st ${cls}"><i></i>Was in ${label}</span>`); }
    });
  };
  window.nf40Trash = nf40Trash;
})();

/* ---------- 2. Team people: a list down the left on a computer, one "Showing" button on a phone ---------- */
const NF41T = {q: ''};
function nf41PeopleData(){
  const ms = typeof nf33TMembers === 'function' ? nf33TMembers() : [], all = teamTasks.filter(t => teamScoped(t) && !t.deletedAt);
  const today = t => t.status === 'done' && (t.completedAt || t.doneAt) === APP_TODAY;
  const stat = list => { const open = list.filter(t => t.status !== 'done').length, done = list.filter(today).length, late = list.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < APP_TODAY).length; return {open, done, late, tot: open + done}; };
  const people = ms.map(m => Object.assign({id: m.id, name: m.name}, stat(all.filter(t => t.assignedTo === m.id))))
    .sort((a, b) => (b.late - a.late) || (b.open - a.open) || a.name.localeCompare(b.name));
  return {people, ev: stat(all)};
}
function nf41Av(p, isAll){ return isAll ? '<span class="nf41-av all">All</span>' : `<span class="nf41-av" style="background:${typeof nfIniColor === 'function' ? nfIniColor(p.name) : '#475467'}">${escapeHtml(teamInitials(p.name))}</span>`; }
function nf41Row(p, isAll, act){
  const sub = `${p.open} open${p.late ? ` · <em>${p.late} late</em>` : ''}`;
  return `<button type="button" class="nf41-pr" data-id="${p.id}" data-n="${escapeHtml(String(isAll ? 'everyone' : p.name).toLowerCase())}" onclick="${act}('${p.id}')">${nf41Av(p, isAll)}
    <span class="nf41-pm"><b class="nf26-raw">${escapeHtml(isAll ? 'Everyone' : p.name)}</b><small>${sub}</small><span class="nf41-bar"><i style="width:${p.tot ? Math.round(p.done / p.tot * 100) : 0}%"></i></span></span></button>`;
}
function nf41Pick(id){ NF33T.who = id; try{ renderTeamPeopleStrip(); }catch(e){} try{ renderTaskList(); }catch(e){} }
function nf41SheetPick(id){ slClose('nf41Who'); nf41Pick(id); }
function nf41Filter(input, rootSel){ const q = String(input.value || '').toLowerCase().trim(); NF41T.q = q; document.querySelectorAll(rootSel + ' .nf41-pr').forEach(r => { r.hidden = !!q && !r.dataset.n.includes(q); }); }
function nf41Highlight(root){ root.querySelectorAll('.nf41-pr').forEach(r => { const on = r.dataset.id === NF33T.who; r.classList.toggle('on', on); r.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
function nf41People(){
  const page = document.getElementById('page-team'), tab = document.getElementById('teamTab_tasks'), strip = document.getElementById('teamPeopleStrip');
  if(!page || !tab) return;
  const {people, ev} = nf41PeopleData();
  // computer: the column beside the board
  let wrap = tab.querySelector(':scope > .nf41-tasks');
  if(!wrap){
    wrap = document.createElement('div'); wrap.className = 'nf41-tasks';
    wrap.innerHTML = `<aside class="nf41-col" aria-label="Team people"><label class="nf41-q"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" placeholder="Search people" oninput="nf41Filter(this, '.nf41-col')" aria-label="Search people"></label><div class="nf41-rows" id="nf41Rows"></div></aside><div class="nf41-main"></div>`;
    const main = wrap.querySelector('.nf41-main');
    [...tab.childNodes].forEach(n => main.appendChild(n));
    tab.appendChild(wrap);
  }
  const rows = document.getElementById('nf41Rows');
  const html = nf41Row(Object.assign({id: 'all'}, ev), true, 'nf41Pick') + people.map(p => nf41Row(p, false, 'nf41Pick')).join('');
  if(rows && rows._h !== html){ rows.innerHTML = html; rows._h = html; if(NF41T.q){ const inp = wrap.querySelector('.nf41-q input'); if(inp) nf41Filter(inp, '.nf41-col'); } }
  if(rows) nf41Highlight(rows);
  // phone: one button that says who you're looking at, and who is late
  if(strip){
    const sel = NF33T.who === 'all' ? null : people.find(p => p.id === NF33T.who);
    const late = people.filter(p => p.late);
    const sh = `<div class="nf41-who"><button type="button" class="nf41-show" onclick="nf41Sheet()"><span>Showing:</span><b class="nf26-raw">${escapeHtml(sel ? sel.name : 'Everyone')}</b><small>· ${people.length} ${people.length === 1 ? 'person' : 'people'}</small><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
      ${late.length ? `<span class="nf41-lt">Late jobs:</span>${late.slice(0, 4).map(p => `<button type="button" class="nf41-late" onclick="nf41Pick('${p.id}')"><i></i>${escapeHtml(p.name.split(' ')[0])}</button>`).join('')}${late.length > 4 ? `<span class="nf41-lt">+${late.length - 4}</span>` : ''}` : ''}</div>`;
    if(strip._nf41 !== sh){ strip.innerHTML = sh; strip._nf41 = sh; }
  }
}
function nf41Sheet(){
  const {people, ev} = nf41PeopleData();
  slModal('nf41Who', `<div class="sl-sheet-h"><b>Show jobs for</b><button class="sl-x" onclick="slClose('nf41Who')" aria-label="Close">✕</button></div>
    <label class="nf41-q nf41-qs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" placeholder="Search ${people.length} people" oninput="nf41Filter(this, '#nf41Who')" aria-label="Search people"></label>
    <div class="nf41-rows nf41-sheetrows">${nf41Row(Object.assign({id: 'all'}, ev), true, 'nf41SheetPick')}${people.map(p => nf41Row(p, false, 'nf41SheetPick')).join('')}</div>`);
  const box = document.getElementById('nf41Who'); if(box) nf41Highlight(box);
}
(function(){
  const w = function(){ try{ nf41People(); }catch(e){ console.warn('nf41 people', e); } };
  w._nf36 = true; w._nf40 = true; w._nf41 = true;
  window.renderTeamPeopleStrip = w; try{ renderTeamPeopleStrip = w; }catch(e){}
  if(typeof nf38AllPeople === 'function'){ window.nf38AllPeople = nf41Sheet; try{ nf38AllPeople = nf41Sheet; }catch(e){} }
})();

/* ---------- 3. Problems with orders: a table with filters ---------- */
const NF41P = {st: 'all', k: 'all'};
function nf41ProbKind(e){ const t = String(e.type || '').toLowerCase(); return /damag|broken|crack|spoil|expired/.test(t) ? 'damaged' : /partial|short|wrong|missing|late/.test(t) ? 'short' : 'return'; }
function nf41ProbRows(){
  const out = [], seen = new Set();
  ['buyer', 'supplier'].forEach(role => {
    let list = []; try{ list = computeExceptionLog(role) || []; }catch(e){}
    list.forEach(e => {
      const key = e.poId + '|' + e.type + '|' + e.date; if(seen.has(key)) return; seen.add(key);
      let po = null; try{ po = (typeof getPO === 'function' ? getPO(e.poId) : null) || purchaseOrders.find(p => p.id === e.poId); }catch(x){}
      let what = e.type, fix = '';
      if(po && po.rma && /return|dispute|damag|wrong|rma/i.test(e.type + ' ' + (po.rma.reason || '')) && e.type !== 'Partial delivery'){
        what = po.rma.desc || po.rma.reason || e.type;
        if(!e.open) fix = String(e.detail || '').replace(/^resolved\s*[—-]\s*/i, '').replace(/^resolved$/i, 'Sorted out');
      } else if(e.type === 'Partial delivery'){
        what = String(e.detail || '').split(', ').map(s => { const m = s.match(/^(.*): (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); return m ? `Got ${m[2]} of ${m[3]} ${m[1]}` : s; }).join('. ');
      } else what = e.detail || e.type;
      out.push({date: e.date || '', type: e.type, kind: nf41ProbKind(e), party: e.party || '', order: String(e.poNumber || '').replace(/^PO-\d{4}-/, 'Order '), poId: e.poId, sell: role === 'supplier', open: !!e.open, what, fix});
    });
  });
  return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
function nf41ProbSet(k, v){ NF41P[k] = v; try{ renderExceptionLog(typeof currentAppRole !== 'undefined' ? currentAppRole : 'buyer'); }catch(e){ console.warn(e); } }
function nf41ProbDate(d){ try{ return typeof bkDayLabel === 'function' ? bkDayLabel(d) : d; }catch(e){ return d; } }
function nf41RenderProblems(){
  const el = document.getElementById('exceptionLogPanel'); if(!el) return;
  const all = nf41ProbRows();
  const n = {all: all.length, open: all.filter(r => r.open).length, done: all.filter(r => !r.open).length,
    return: all.filter(r => r.kind === 'return').length, damaged: all.filter(r => r.kind === 'damaged').length, short: all.filter(r => r.kind === 'short').length};
  const rows = all.filter(r => (NF41P.st === 'all' || (NF41P.st === 'open' ? r.open : !r.open)) && (NF41P.k === 'all' || r.kind === NF41P.k));
  const chip = (k, v, label, count) => `<button type="button" class="nf41-chip${NF41P[k] === v ? ' on' : ''}" aria-pressed="${NF41P[k] === v}" onclick="nf41ProbSet('${k}','${v}')">${label}${count != null ? ` <b>${count}</b>` : ''}</button>`;
  const KIND = {return: 'Return', damaged: 'Damaged goods', short: 'Short or wrong delivery'};
  el.innerHTML = `<div class="panel-card nf41-prob">
    <div class="nf41-ph"><h2>Problems with orders</h2><p>Returns, damaged goods and short or wrong deliveries, with what happened and how it ended.</p></div>
    <div class="nf41-chips" role="group" aria-label="Filter problems">${chip('st', 'all', 'All', n.all)}${chip('st', 'open', 'Still open', n.open)}${chip('st', 'done', 'Sorted out', n.done)}<span class="nf41-sep"></span>${chip('k', 'all', 'Every kind')}${chip('k', 'return', 'Returns', n.return)}${chip('k', 'damaged', 'Damaged', n.damaged)}${chip('k', 'short', 'Short or wrong', n.short)}</div>
    ${rows.length ? `<div class="nf41-tw"><table class="nf41-pt"><thead><tr><th>Date</th><th>Problem</th><th>With</th><th>Order</th><th>What happened</th><th>Status</th><th><span class="sr-only">Open</span></th></tr></thead><tbody>
      ${rows.map(r => `<tr class="${r.open ? 'is-open' : 'is-done'}"><td data-l="Date"><b>${escapeHtml(nf41ProbDate(r.date))}</b></td><td data-l="Problem"><b>${escapeHtml(KIND[r.kind] && r.type === 'Partial delivery' ? 'Short delivery' : r.type)}</b></td>
        <td data-l="With" class="nf26-raw">${escapeHtml(r.party)}</td><td data-l="Order">${escapeHtml(r.order)}</td><td data-l="What happened" class="nf41-what"><span class="nf26-raw">${escapeHtml(r.what)}</span>${r.fix ? `<small>✓ ${escapeHtml(r.fix)}</small>` : ''}</td>
        <td data-l="Status">${r.open ? '<span class="nf41-s o">Still open</span>' : '<span class="nf41-s d">Sorted out</span>'}</td>
        <td class="nf41-go"><button type="button" class="btn btn-outline" onclick="nf41OpenOrder('${r.poId}', ${r.sell})">Open order</button></td></tr>`).join('')}
      </tbody></table></div>`
      : `<div class="nf41-none">${all.length ? 'No problems match this filter.' : 'No problems with orders. Returns, damaged goods and short deliveries show up here.'}${all.length ? ` <button type="button" onclick="NF41P.st='all'; NF41P.k='all'; nf41ProbSet('st','all')">Show all</button>` : ''}</div>`}
  </div>`;
}
function nf41OpenOrder(id, sell){
  try{ if(typeof openOrderDetailModal === 'function'){ openOrderDetailModal(id, sell); return; } }catch(e){}
  try{ navigate('orders'); setTimeout(() => toggleOrderRow(id), 80); }catch(e){}
}
(function(){
  const w = function(){ try{ nf41RenderProblems(); }catch(e){ console.warn('nf41 problems', e); } };
  window.renderExceptionLog = w; try{ renderExceptionLog = w; }catch(e){}
})();

/* ---------- 4. Add many items at once from Excel ---------- */
const NF41I = {rows: [], file: '', step: 'pick', busy: false, added: 0, updated: 0};
const NF41I_COLS = {
  name: /^(item|items|item name|product|product name|sku name|name|description|desc|particulars|pangalan|produkto)$/i,
  price: /^(price|selling price|sell price|srp|retail|retail price|unit price|presyo|selling|sale price|price \(php\)|price php)$/i,
  unit: /^(unit|uom|units|unit of measure|per)$/i,
  cost: /^(cost|cost price|buying price|puhunan|capital|purchase price|unit cost)$/i,
  stock: /^(stock|stock on hand|on hand|qty|quantity|count|inventory|available|stocks)$/i,
  code: /^(sku|sku code|code|item code|barcode|product code)$/i,
};
function nf41ImpNum(v){ const t = String(v == null ? '' : v).replace(/[₱,\s]|php/gi, ''); if(t === '') return NaN; const n = Number(t); return isFinite(n) ? n : NaN; }
function nf41ImpMap(header){
  const map = {};
  header.forEach((h, i) => { const k = String(h || '').trim().replace(/\s+/g, ' '); Object.entries(NF41I_COLS).forEach(([f, re]) => { if(map[f] == null && re.test(k)) map[f] = i; }); });
  return map;
}
function nf41ImpParse(matrix){
  const rows = matrix.filter(r => r && r.some(c => String(c).trim() !== ''));
  if(!rows.length) return [];
  let hi = rows.findIndex(r => { const m = nf41ImpMap(r); return m.name != null && m.price != null; });
  let map, body;
  if(hi >= 0){ map = nf41ImpMap(rows[hi]); body = rows.slice(hi + 1); }
  else { // no headers: the first column with words is the name, the first column with numbers is the price
    const sample = rows.slice(0, 10), cols = Math.max(...sample.map(r => r.length));
    let ni = -1, pi = -1;
    for(let c = 0; c < cols; c++){ const vals = sample.map(r => r[c]).filter(v => String(v || '').trim()); if(!vals.length) continue;
      const numeric = vals.filter(v => isFinite(nf41ImpNum(v))).length / vals.length;
      if(ni < 0 && numeric < 0.5) ni = c; else if(pi < 0 && numeric >= 0.8 && c !== ni) pi = c; }
    if(ni < 0 || pi < 0) return [];
    map = {name: ni, price: pi}; body = rows;
  }
  const have = new Map((inventoryData || []).map(i => [String(i.name).trim().toLowerCase(), i]));
  return body.map(r => {
    const name = String(r[map.name] == null ? '' : r[map.name]).trim().replace(/\s+/g, ' ').slice(0, 120);
    const price = map.price != null ? nf41ImpNum(r[map.price]) : NaN;
    const row = {name, price, unit: map.unit != null ? String(r[map.unit] || '').trim().slice(0, 20) : '', cost: map.cost != null ? nf41ImpNum(r[map.cost]) : NaN,
      stock: map.stock != null ? nf41ImpNum(r[map.stock]) : NaN, code: map.code != null ? String(r[map.code] || '').trim().slice(0, 40) : ''};
    if(!name) row.skip = 'No item name';
    else if(!isFinite(price) || price < 0) row.skip = 'No price';
    else { const ex = have.get(name.toLowerCase()); if(ex){ row.ex = ex; row.change = Number(ex.sellPrice) !== price || (isFinite(row.cost) && Number(ex.unitCost) !== row.cost) || (isFinite(row.stock) && Number(ex.onHand) !== row.stock); } }
    return row;
  }).filter(r => r.name || isFinite(r.price));
}
function nf41ImportOpen(){
  try{ if(typeof requirePermission === 'function' && !requirePermission('editInventory')) return; }catch(e){}
  Object.assign(NF41I, {rows: [], file: '', step: 'pick', busy: false, err: ''});
  nf41ImpPaint();
}
function nf41ImpPaint(){
  let body;
  if(NF41I.step === 'pick'){
    body = `<p class="nf41-ilead">Put all your items in Nifti at once: one row per item, with its name and selling price. Nothing is added until you check it and say yes.</p>
      <ol class="nf41-isteps"><li><b>Get the template</b> (or use your own Excel). Columns: <em>Item name</em> and <em>Selling price</em>. Unit, Cost and Stock on hand are optional.<button type="button" class="btn btn-outline" onclick="nf41ImpTemplate()">Download the Excel template</button></li>
        <li><b>Fill it in</b>: one item per row. Your own column names work too, like "Product", "SRP" or "Presyo".</li>
        <li><b>Upload it</b> here and check the list. Items you already have just get their prices updated.</li></ol>
      <table class="nf41-iex"><thead><tr><th>Item name</th><th>Selling price</th><th>Unit</th><th>Cost</th><th>Stock on hand</th></tr></thead><tbody><tr><td>Portland Cement 40kg</td><td>265</td><td>bag</td><td>228</td><td>120</td></tr><tr><td>Deformed Bar 10mm</td><td>185</td><td>piece</td><td>160</td><td>300</td></tr></tbody></table>
      <label class="nf41-drop"><input type="file" accept=".xlsx,.xls,.csv,text/csv" hidden onchange="nf41ImpFile(this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
        <b>${NF41I.busy ? 'Reading your file…' : 'Choose your Excel or CSV file'}</b><small>.xlsx, .xls or .csv</small></label>
      ${NF41I.err ? `<p class="nf41-ierr">${escapeHtml(NF41I.err)}</p>` : ''}`;
  } else if(NF41I.step === 'check'){
    const add = NF41I.rows.filter(r => !r.skip && !r.ex), upd = NF41I.rows.filter(r => !r.skip && r.ex && r.change), same = NF41I.rows.filter(r => !r.skip && r.ex && !r.change), skip = NF41I.rows.filter(r => r.skip);
    const pill = r => r.skip ? `<span class="nf41-ip sk">Skipped: ${escapeHtml(r.skip)}</span>` : !r.ex ? '<span class="nf41-ip nw">New item</span>' : r.change ? `<span class="nf41-ip up">Update${Number(r.ex.sellPrice) !== r.price ? ` ₱${Number(r.ex.sellPrice || 0).toLocaleString('en-US')} → ₱${r.price.toLocaleString('en-US')}` : ''}</span>` : '<span class="nf41-ip same">Already the same</span>';
    body = `<p class="nf41-ilead"><b>${escapeHtml(NF41I.file)}</b></p>
      <div class="nf41-isum"><span><b>${add.length}</b> new items</span><span><b>${upd.length}</b> price updates</span><span><b>${same.length}</b> already the same</span>${skip.length ? `<span class="sk"><b>${skip.length}</b> skipped</span>` : ''}</div>
      <div class="nf41-itw"><table class="nf41-it"><thead><tr><th>Item</th><th>Price</th><th>Unit</th><th>Stock</th><th></th></tr></thead><tbody>${NF41I.rows.slice(0, 300).map(r => `<tr class="${r.skip ? 'sk' : ''}"><td class="nf26-raw">${escapeHtml(r.name || '—')}</td><td>${isFinite(r.price) ? '₱' + r.price.toLocaleString('en-US') : '—'}</td><td>${escapeHtml(r.unit || '')}</td><td>${isFinite(r.stock) ? r.stock : ''}</td><td>${pill(r)}</td></tr>`).join('')}</tbody></table></div>
      ${NF41I.rows.length > 300 ? `<p class="nf41-ilead">Showing the first 300 of ${NF41I.rows.length} rows. All of them will be added.</p>` : ''}
      <div class="nf41-ib"><button type="button" class="btn btn-outline" onclick="NF41I.step='pick'; nf41ImpPaint()">Choose another file</button>
        <button type="button" class="btn btn-primary" ${add.length + upd.length ? '' : 'disabled'} onclick="nf41ImpApply()">${NF41I.busy ? 'Saving…' : `Add ${add.length} item${add.length === 1 ? '' : 's'}${upd.length ? ` and update ${upd.length}` : ''}`}</button></div>`;
  } else {
    body = `<div class="nf41-idone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8 12.5 3 3 5-6"/></svg>
      <b>Done: ${NF41I.added} item${NF41I.added === 1 ? '' : 's'} added${NF41I.updated ? `, ${NF41I.updated} updated` : ''}</b><span>They're in Stock and Prices now, ready for orders.</span>
      <div class="nf41-ib"><button type="button" class="btn btn-outline" onclick="slClose('nf41Imp'); go('profit')">See my prices</button><button type="button" class="btn btn-primary" onclick="slClose('nf41Imp'); go('inventory')">See my stock</button></div></div>`;
  }
  const box = document.getElementById('nf41Imp');
  if(box && box.querySelector('.nf41-ibody')) box.querySelector('.nf41-ibody').innerHTML = body;
  else slModal('nf41Imp', `<div class="sl-sheet-h"><b>Add many items from Excel</b><button class="sl-x" onclick="slClose('nf41Imp')" aria-label="Close">✕</button></div><div class="nf41-ibody">${body}</div>`);
}
async function nf41ImpFile(input){
  const f = input.files && input.files[0]; if(!f) return;
  NF41I.busy = true; NF41I.err = ''; nf41ImpPaint();
  try{
    let matrix;
    if(/\.(csv|txt)$/i.test(f.name)){ const t = await f.text(); matrix = typeof colParseCsv === 'function' ? colParseCsv(t) : t.split(/\r?\n/).map(l => l.split(',')); }
    else { await cpoLoadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); const wb = XLSX.read(await f.arrayBuffer(), {type: 'array'});
      matrix = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1, raw: false, defval: ''}); }
    const rows = nf41ImpParse(matrix || []);
    if(!rows.filter(r => !r.skip).length) throw new Error('No items with a name and a price were found. Check the file has a column for the item name and one for the selling price.');
    Object.assign(NF41I, {rows, file: f.name, step: 'check'});
  }catch(e){ NF41I.err = e.message || "Couldn't read that file."; }
  NF41I.busy = false; input.value = ''; nf41ImpPaint();
}
async function nf41ImpTemplate(){
  const rows = [['Item name', 'Selling price', 'Unit', 'Cost', 'Stock on hand'], ['Portland Cement 40kg', 265, 'bag', 228, 120], ['Deformed Bar 10mm', 185, 'piece', 160, 300], ['GI Wire #16', 95, 'kg', 78, 40]];
  try{ await cpoLoadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = [{wch: 28}, {wch: 14}, {wch: 10}, {wch: 10}, {wch: 14}];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Items'); XLSX.writeFile(wb, 'Nifti items template.xlsx'); }
  catch(e){ try{ downloadCsv('Nifti items template.csv', rows); }catch(x){ showToast("Couldn't make the template. Check your internet.", 'error'); } }
}
async function nf41ImpApply(){
  if(NF41I.busy) return; NF41I.busy = true; nf41ImpPaint();
  const made = [], changed = [];
  NF41I.rows.forEach(r => {
    if(r.skip) return;
    if(r.ex){ if(!r.change) return; r.ex.sellPrice = r.price; if(isFinite(r.cost)) r.ex.unitCost = r.cost; if(isFinite(r.stock)) r.ex.onHand = r.stock; if(r.unit) r.ex.unit = r.unit; changed.push(r.ex); return; }
    const it = {id: typeof newRecordId === 'function' ? newRecordId() : 'it_' + Date.now() + Math.random().toString(36).slice(2, 6),
      code: r.code || (typeof generateUniqueSkuCode === 'function' ? generateUniqueSkuCode('SKU-', inventoryData, 1000, 8999) : ''), name: r.name, warehouse: 'main',
      onHand: isFinite(r.stock) ? r.stock : 0, rop: 0, maxLevel: 0, lot: null, exp: null, status: 'healthy', supplier: 'Not set', daysLeft: null, leadTime: 5,
      unit: r.unit || 'piece', sellPrice: r.price, unitCost: isFinite(r.cost) ? r.cost : undefined, ropEnabled: false, maxLevelEnabled: false,
      _meta: {source: 'Excel upload', sourceTimestamp: APP_TODAY, importedAt: APP_TODAY, confidence: 'Verified'}};
    inventoryData.push(it); made.push(it);
  });
  try{ if(typeof nf25Real === 'function' && nf25Real() && typeof syncInventoryToSupabase === 'function') await syncInventoryToSupabase(made.concat(changed)); else if(typeof scheduleNiftiSave === 'function') scheduleNiftiSave(); }
  catch(e){ console.warn('nf41 import save', e); showToast("Saved on this device. Nifti will finish saving when you're back online.", 'warn'); }
  try{ renderInventoryTable(); }catch(e){}
  try{ if(typeof nf26StartSet === 'function') nf26StartSet('file', 1); }catch(e){}
  Object.assign(NF41I, {busy: false, step: 'done', added: made.length, updated: changed.length}); nf41ImpPaint();
}
// every "upload my item list" button opens this
window.openImportInventoryModal = nf41ImportOpen; try{ openImportInventoryModal = nf41ImportOpen; }catch(e){}
function nf41ImportButtons(page){
  if(!page) return;
  if(page.id === 'page-inventory'){
    const row = [...page.querySelectorAll('button')].find(b => /Bring in or save your list/.test(b.textContent));
    const host = row ? row.parentElement : page.querySelector('.page-head');
    if(host && !host.querySelector('.nf41-impbtn')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-primary nf41-impbtn'; b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>Add many items from Excel'; b.onclick = nf41ImportOpen; host.insertBefore(b, row || null); }
  }
  if(page.id === 'page-profit'){
    const head = page.querySelector('.page-head');
    if(head && !head.querySelector('.nf41-impbtn')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-outline nf41-impbtn'; b.textContent = 'Add many items from Excel'; b.onclick = nf41ImportOpen; head.appendChild(b); }
  }
}

/* ---------- 5. Prices typed in a chat ("Cement 40kg - ₱265/bag") are read and compared, no photo needed ---------- */
function nf41PriceLines(text){
  const out = [];
  String(text || '').split(/\r?\n|;\s*/).forEach(l => {
    const s = l.trim(); if(!s) return;
    const m = s.match(/^(.*?[A-Za-z].*?)\s*(?:[-–—:=@]|\bat\b|\bper\b)?\s*(?:₱|php\s?|p\s?)([\d][\d,]*(?:\.\d{1,2})?)\s*(?:\/\s*|per\s+|a\s+)?([a-z.]{1,8})?\s*$/i)
      || s.match(/^(.*?[A-Za-z].*?)\s*(?:[-–—:=@])\s*([\d][\d,]*(?:\.\d{1,2})?)\s*\/\s*([a-z.]{1,8})\s*$/i);
    if(!m) return;
    const name = m[1].replace(/[-–—:=@,]+$/, '').trim(), price = Number(m[2].replace(/,/g, ''));
    if(name.length < 2 || !(price > 0) || /^(total|subtotal|less|vat|delivery|shipping|balance)$/i.test(name)) return;
    out.push({name, unit_price: price, unit: (m[3] || '').replace(/\.$/, '')});
  });
  return out;
}
(function(){
  if(typeof nf31Ins !== 'function') return;
  const base = nf31Ins;
  nf31Ins = function(m, conv){
    try{
      if(m && m.from === 'them' && !m.attachment && conv){
        const items = nf41PriceLines(m.text);
        if(items.length >= 2 || (items.length >= 1 && /\b(quot|price ?list|presyo|new price|bagong presyo)/i.test(m.text || ''))){
          const key = m.id || conv.id + '|' + (m.time || '') + '|' + String(m.text || '').slice(0, 30);
          NF31A.last = NF31A.last || {}; NF31A.last[key] = {m, conv, ai: {kind: 'quote', items}, det: null, po: null, kind: 'quote'};
          const last = nf31LastPrices(conv);
          let up = 0, down = 0;
          const lines = items.slice(0, 4).map(it => { const mk = nf31Match(it.name, last), was = mk ? last[mk].price : 0, ch = was ? (it.unit_price - was) / was * 100 : null; if(ch > 0.5) up++; if(ch < -0.5) down++;
            return `<span class="nf31-it">${escapeHtml(it.name)} <b>${nf31Peso(it.unit_price)}${it.unit ? '/' + escapeHtml(it.unit) : ''}</b>${ch != null && Math.abs(ch) >= 0.5 ? `<em class="${ch > 0 ? 'up' : 'down'}">${ch > 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(1)}% vs the ${nf31Peso(was)} you paid</em>` : ch != null ? '<em>same as you paid</em>' : ''}</span>`; }).join('');
          const head = up ? `${up} price${up === 1 ? '' : 's'} went up` : down ? `${down} price${down === 1 ? '' : 's'} went down` : `${items.length} item${items.length === 1 ? '' : 's'} with prices`;
          return `<div class="nf31-ins ${up ? 'red' : 'blue'}"><div class="nf31-ins-h">${NF31_SPARK}<span>Nifti saw: ${up ? 'New prices' : 'Quotation'}</span></div><div class="nf31-ins-b"><b>${head}</b>${lines}${items.length > 4 ? `<span class="nf31-it">+${items.length - 4} more</span>` : ''}</div>
            <div class="nf31-ins-a"><button type="button" onclick="nf31Compare('${escapeHtml(key).replace(/'/g, '&#39;')}')">Compare with what I paid</button>${up ? `<button type="button" onclick="nf31OrderNow('${escapeHtml(conv.name).replace(/'/g, '&#39;')}')">Order before it goes up</button>` : ''}</div></div>`;
        }
      }
    }catch(e){ console.warn('nf41 prices', e); }
    return base.apply(this, arguments);
  };
  window.nf31Ins = nf31Ins;
})();

/* ---------- wiring ---------- */
(function(){
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ nf41ImportButtons(page); }catch(e){} try{ if(page && page.id === 'page-team' && !page.querySelector('.nf41-tasks')) nf41People(); }catch(e){} };
  window.nf26AfterPass = nf26AfterPass;
})();
