/* ===== Round 47: split order boxes, prices table, month table + line, add items, store, clear page names,
   pages you can switch on and off, a menu that grows as you go, and no more jumping away from what you were doing ===== */

const nf47E = s => nf45Esc(s);
const nf47P = n => nf45Peso(n);
const NF47_IC = {
  cam: '<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>', down: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  back: '<path d="M15 18l-6-6 6-6"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
};
const nf47Svg = (k, w) => `<svg viewBox="0 0 24 24" width="${w || 20}" height="${w || 20}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NF47_IC[k] || ''}</svg>`;
function nf47PageName(id){
  const named = {dashboard: 'Home', orders: 'Delivery orders', sales: 'Walk-in sales', inventory: 'Stock', collections: 'Getting paid', profit: 'Prices & profit', ledger: 'Monthly summary', routes: 'Deliveries', followups: 'Follow-ups', discover: 'Find customers', store: 'Online store', settings: 'Settings', messages: 'Messages', team: 'Team', payroll: 'Payroll', expenses: 'Expenses', money: 'Money overview', issues: 'To check', returns: 'Returns & credits', cheques: 'Checks', books: 'Tax books', taxforms: '2307 forms'};
  if(named[id]) return named[id];
  const nv = document.querySelector(`#view-app .sidebar [data-page="${id}"] span`);
  return nv ? nv.textContent.trim() : 'the last page';
}

/* ---------- 1. Clear names: Delivery orders and Walk-in sales ---------- */
try{
  Object.assign(NF43_NAV, {orders: 'Delivery orders', sales: 'Walk-in sales'});
  Object.assign(NF43_TITLE, {orders: 'Delivery orders', sales: 'Walk-in sales'});
  Object.assign(NF43_SUB, {orders: 'Orders you deliver to customers, and orders suppliers deliver to you.', sales: 'Customers who walk in and pay on the spot. Count the cash at closing.', ledger: 'Your month at a glance, and what is worth a look.'});
  Object.assign(PAGE_DISPLAY_NAMES, {orders: 'Delivery orders', sales: 'Walk-in sales'});
  NF26_FIND.forEach(f => { if(f.p === 'orders'){ f.t = 'Delivery orders'; f.d = 'Orders you deliver, and orders from suppliers'; f.w += ' delivery orders deliveries'; } if(f.p === 'sales'){ f.t = 'Walk-in sales'; f.d = 'Customers who walk in and pay, count the cash'; f.w += ' walk in walkin counter tindahan'; } });
}catch(e){ console.warn('nf47 names', e); }
function nf47Names(){
  document.querySelectorAll('#view-app .nf18-hubwrap button, #view-app .nf18-hub button, #view-app .nf18-hub a').forEach(b => { const sp = [...b.querySelectorAll('span, b')].find(x => !x.children.length && /^(Orders|Sales)$/.test(x.textContent.trim())) || (/^(Orders|Sales)$/.test(b.textContent.trim()) && !b.children.length ? b : null); if(!sp) return; const t = sp.textContent.trim() === 'Orders' ? 'Delivery orders' : 'Walk-in sales'; if(sp.textContent !== t) sp.textContent = t; });
  document.querySelectorAll('#moreSheet .more-sheet-item[data-page="sales"], #moreSheet .more-sheet-item[data-page="orders"]').forEach(b => {
    const t = b.dataset.page === 'sales' ? 'Walk-in sales' : 'Delivery orders';
    const n = [...b.childNodes].reverse().find(x => (x.nodeType === 3 && x.textContent.trim()) || (x.nodeType === 1 && x.tagName === 'SPAN' && !x.className));
    if(n && n.textContent.trim() !== t) n.textContent = n.nodeType === 3 ? ' ' + t : t;
  });
}

/* ---------- 2. Team: the people list starts level with To do, Doing and Done ---------- */
function nf47TeamAlign(page){
  if(!page || page.id !== 'page-team') return;
  const col = page.querySelector('.nf41-col'), q = col && col.querySelector('.nf41-q'), rows = col && col.querySelector('#nf41Rows'), main = page.querySelector('.nf41-main'), board = page.querySelector('#taskListOpen');
  if(!col || !q || !rows || !main || !board || window.innerWidth <= 900 || col.offsetParent === null || board.offsetParent === null) return;
  let hint = col.querySelector('.nf47-thint');
  if(!hint){ hint = document.createElement('p'); hint.className = 'nf47-thint'; hint.innerHTML = '<span>Tap a name to see only their jobs.</span>'; q.after(hint); }
  const cur = hint.getBoundingClientRect().height;
  const lane = board.querySelector('.nf33t-col') || board;
  const delta = (lane.getBoundingClientRect().top - main.getBoundingClientRect().top) - (rows.getBoundingClientRect().top - col.getBoundingClientRect().top + col.scrollTop);
  if(Math.abs(delta) < 1) return;
  const h = Math.max(0, Math.round(cur + delta));
  if(hint.style.height !== h + 'px') hint.style.height = h + 'px';
}
window.addEventListener('resize', () => { clearTimeout(nf47TeamAlign._t); nf47TeamAlign._t = setTimeout(() => nf47TeamAlign(document.getElementById('page-team')), 120); });

/* ---------- 3. Prices & profit: plain numbers until you press Edit, profit each, a colored margin, profit or loss ---------- */
function nf47PriceRow(tr){
  const ci = tr.querySelector('td.nf47-cost input'), si = tr.querySelector('td.nf47-sell input'); if(!ci || !si) return;
  const cost = Number(ci.value), sell = Number(si.value), ok = cost > 0 && sell > 0, each = sell - cost, mg = ok ? Math.round(each / sell * 100) : null;
  const pe = tr.querySelector('td.nf47-pe');
  const peHtml = ok ? `<span class="${each < 0 ? 'nf47-neg' : ''}">${each < 0 ? '−' : ''}₱${Math.abs(Math.round(each * 100) / 100).toLocaleString('en-PH')}</span>` : '<span class="nf47-dim">—</span>';
  if(pe && pe.dataset.k47 !== peHtml){ pe.dataset.k47 = peHtml; pe.innerHTML = peHtml; }
  const m = tr.querySelector('td.nf47-mgc');
  if(m){ const cls = mg == null ? 'n' : mg < 0 ? 'r' : mg < 20 ? 'y' : 'g'; const mh = `<span class="nf47-mg ${cls}">${mg == null ? 'No cost yet' : mg < 0 ? 'Losing ' + Math.abs(mg) + '%' : mg + '%'}</span>`; if(m.dataset.k47 !== mh){ m.dataset.k47 = mh; m.innerHTML = mh; } }
  const p = tr.querySelector('td.nf47-pl');
  if(p){ const txt = p.textContent.replace(/−/g, '-'), v = nf43Num(txt), loss = v < 0 || /-\s*₱/.test(txt);
    if(p.classList.contains('nf47-loss') !== (loss && v !== 0)) p.classList.toggle('nf47-loss', loss && v !== 0); if(p.classList.contains('nf47-gain') !== (!loss && v > 0)) p.classList.toggle('nf47-gain', !loss && v > 0); }
  [['nf47-cost', 'Cost'], ['nf47-sell', 'You sell at'], ['nf47-pe', 'Profit each'], ['nf47-mgc', 'Margin'], ['nf47-sold', 'Qty sold'], ['nf47-pl', 'Profit / loss']].forEach(([c, l]) => { const td = tr.querySelector('td.' + c); if(td && td.dataset.label !== l) td.dataset.label = l; });
}
function nf47Prices(page){
  if(!page || page.id !== 'page-profit') return;
  const t = page.querySelector('table.bk-tbl'); if(!t) return;
  const hr = t.querySelector('thead tr'); if(!hr) return;
  // find each column by its heading, leaving out the one this pass adds
  const base = [...hr.children].filter(th => !th.classList.contains('nf47-pe')), nm = base.map(th => th.textContent.trim().toLowerCase());
  const ix = re => nm.findIndex(x => re.test(x));
  const iC = ix(/^cost$/), iS = ix(/^you sell at$/), iM = ix(/^(profit per ₱100|margin)$/), iQ = ix(/^(sold|qty sold)$/), iP = ix(/^(profit|profit \/ loss)$/);
  if(iC < 0 || iS < 0) return;
  if(!hr.querySelector('.nf47-pe')){ const th = document.createElement('th'); th.className = 'r nf47-pe'; th.textContent = 'Profit each'; base[iS].after(th); }
  base.forEach((th, i) => { const to = i === iM ? 'Margin' : i === iQ ? 'Qty sold' : i === iP ? 'Profit / loss' : null; if(to && th.textContent !== to) th.textContent = to; });
  t.querySelectorAll('tbody tr').forEach(tr => {
    if(!tr.querySelector('td.nf47-pe')){ const tds = [...tr.children]; if(tds.length !== base.length) return;
      const mark = (i, c) => { if(i >= 0 && tds[i]) tds[i].classList.add(c); }; mark(iC, 'nf47-cost'); mark(iS, 'nf47-sell'); mark(iM, 'nf47-mgc'); mark(iQ, 'nf47-sold'); mark(iP, 'nf47-pl');
      const td = document.createElement('td'); td.className = 'r nf47-pe'; tds[iS].after(td); }
    nf47PriceRow(tr);
    if(!tr.dataset.nf47){ tr.dataset.nf47 = '1'; tr.querySelectorAll('input.bk-num').forEach(i => i.addEventListener('input', () => nf47PriceRow(tr))); }
  });
  const b = page.querySelector('.nf26-editp');
  if(b){ if(!b.classList.contains('nf47-editp')){ b.classList.add('nf47-editp'); b.addEventListener('click', () => setTimeout(() => nf47Prices(page), 0)); }
    const ro = t.classList.contains('nf26-ro'), want = ro ? 'Edit prices' : 'Done editing'; if(b.textContent !== want) b.textContent = want; b.classList.toggle('on', !ro); }
  page.querySelectorAll('.panel-head span, .panel-head small, .bk-dim').forEach(s => { if(/Tap a cost or price to change it|Press Edit prices|saves by itself/.test(s.textContent)){ const ro = t.classList.contains('nf26-ro'); const w = ro ? 'Press Edit prices to change a cost or price' : 'Type the new number. It saves by itself.'; if(s.textContent !== w) s.textContent = w; } });
}

/* ---------- 4. Monthly summary: a month table and a line of what you kept, side by side ---------- */
function nf47K(n){ const a = Math.abs(n); return (n < 0 ? '−' : '') + '₱' + (a >= 1e6 ? (a / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : a >= 1000 ? (a / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : Math.round(a)); }
function nf47MonthViews(hist, cur){
  const mon = m => new Date(m + '-01T00:00:00').toLocaleDateString('en-PH', {month: 'short'});
  const rows = hist.map((h, i) => { const prev = hist[i - 1], diff = prev ? h.k - prev.k : null, costs = h.s - h.k;
    return `<tr class="${h.m === cur ? 'on' : ''}" onclick="nf45LgMonth('${h.m}')" title="Open ${nf47E(bkMonthLabel(h.m))}"><td>${nf47E(mon(h.m))}${h.m === APP_TODAY.slice(0, 7) ? ' <small>so far</small>' : ''}</td><td>${nf47P(h.s)}</td><td>${nf47P(costs)}</td><td class="${h.k < 0 ? 'dn' : 'up'}">${h.k < 0 ? '−' : ''}${nf47P(Math.abs(h.k))}</td><td class="${diff == null ? '' : diff < 0 ? 'dn' : 'up'}">${diff == null ? '—' : (diff < 0 ? '▼ ' : '▲ ') + nf47P(Math.abs(diff))}</td></tr>`; }).join('');
  const table = `<div class="nf47-mt"><table><thead><tr><th>Month</th><th>Sales</th><th>Costs</th><th>You kept</th><th>Change</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  let line = '';
  if(hist.length >= 2){
    const W = window.innerWidth < 600 ? 340 : 560, H = 220, L = 48, R = 28, T = 58, B = 34, ks = hist.map(h => h.k), hi = Math.max(0, ...ks), lo = Math.min(0, ...ks), span = (hi - lo) || 1;
    const x = i => L + (hist.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (hist.length - 1)), y = v => T + (hi - v) / span * (H - T - B), y0 = y(0);
    const pts = hist.map((h, i) => `${Math.round(x(i))},${Math.round(y(h.k))}`).join(' ');
    line = `<div class="nf47-ml"><b>What you kept each month</b><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="What you kept each month">
      <line x1="${L}" y1="${y0}" x2="${W - R}" y2="${y0}" stroke="#98A2B3" stroke-width="2"/><text x="${L - 6}" y="${y0 + 4}" font-size="13" text-anchor="end" fill="#344054">₱0</text>
      <polyline fill="none" stroke="#1F6B45" stroke-width="3" stroke-linejoin="round" points="${pts}"/>
      ${hist.map((h, i) => { const cx = Math.round(x(i)), cy = Math.round(y(h.k)), neg = h.k < 0, on = h.m === cur; return `<g class="nf47-pt" onclick="nf45LgMonth('${h.m}')"><circle cx="${cx}" cy="${cy}" r="${on ? 8 : 6}" fill="${neg ? '#D92D20' : '#16A34A'}" ${on ? 'stroke="#0B0F14" stroke-width="2"' : ''}/><text x="${cx}" y="${neg ? cy + 22 : cy - 12}" font-size="13" font-weight="800" text-anchor="middle" fill="${neg ? '#B42318' : '#15803D'}">${nf47K(h.k)}</text><text x="${cx}" y="20" font-size="13" text-anchor="middle" fill="#0B0F14" font-weight="${on ? 800 : 600}">${nf47E(mon(h.m))}</text></g>`; }).join('')}
    </svg><p>Above the gray line you made money, below it you lost money.</p></div>`;
  }
  return `<div class="nf47-mv${line ? '' : ' one'}">${table}${line || '<p class="nf47-mone">The line shows up once you have two months of sales.</p>'}</div><p class="nf45-gl"><span>Tap a month to open it.</span></p>`;
}
// "What changed" keeps only what the glance above doesn't already say, in short rows
(function(){
  if(typeof lgWhatChanged !== 'function') return;
  const base = lgWhatChanged;
  lgWhatChanged = function(p, prev, r){ const out = base.apply(this, arguments); try{ if(LGV.range === 'month' && LGV.tab === 'summary') return out.filter(c => !/^Sales (up|down|much)/.test(c.t)); }catch(e){} return out; };
  window.lgWhatChanged = lgWhatChanged;
  lgInsightCard = function(c){
    return `<div class="lg-card nf47-wl ${c.lvl}"><span class="bk-dot ${c.lvl}" aria-hidden="true"></span><div class="tx"><b>${escapeHtml(c.t)}</b><small>${escapeHtml(c.what)} ${escapeHtml(c.next || '')}</small></div>${c.code ? `<button type="button" class="btn btn-outline btn-sm" onclick="LGV.acct='${c.code}'; LGV.tab='gl'; renderLedgerPage()">See the lines</button>` : ''}</div>`;
  };
  window.lgInsightCard = lgInsightCard;
})();
function nf47Ledger(page){
  if(!page || page.id !== 'page-ledger') return;
  page.querySelectorAll('.panel-head h2').forEach(h => { if(h.textContent.trim() === 'What changed') h.textContent = 'Worth a look'; });
  page.querySelectorAll('.bk-empty span').forEach(s => { if(/^Not enough history yet to compare/.test(s.textContent)) s.textContent = 'Nothing unusual this month. Costs and margins look like last month.'; });
  page.querySelectorAll('button').forEach(b => { if(b.textContent.trim() === 'What changed' && b.closest('[role="tablist"], .nf-tabcards, .lg-tabs, .nf23-ltabs')) b.textContent = 'At a glance'; });
}

/* ---------- 5. Getting paid: "You paid ₱X" on one line, what's left on the next ---------- */
function nf47ColStatus(page){
  if(!page || page.id !== 'page-collections') return;
  page.querySelectorAll('table.nf25-t td.w[data-l="Status"]').forEach(td => {
    if(td.querySelector('.nf26-l1, button, a, .nf26-gl')) return;
    const m = td.textContent.replace(/\s+/g, ' ').trim().match(/^You paid (₱[\d,.]+),\s*(.+)$/i); if(!m) return;
    td.innerHTML = `<span class="nf26-l1">You paid ${nf47E(m[1])}</span><span class="nf26-l2">${nf47E(m[2])}</span>`;
  });
}

/* ---------- 6. Stock: one Add items button, the photo reader first ---------- */
function nf47Read(kind){ try{ nf22NbOpen(); if(kind){ nf22NbDo('kind', kind); nf22NbDo('next'); } }catch(e){ console.warn('nf47 read', e); } }
function nf47AddItems(){
  const way = (ic, t, s, fn) => `<button type="button" class="nf47-way" onclick="${fn}"><span class="ic">${nf47Svg(ic, 22)}</span><span><b>${t}</b><small>${s}</small></span></button>`;
  nf45Pop('nf47Add', 'Add items', `
    <div class="nf47-ai"><span class="ic">${nf47Svg('cam', 26)}</span><div><b>Snap a photo, Nifti fills it in</b><small>Take a photo of anything with your items on it. Nifti reads the names, sizes, prices and quantities, then you check each line.</small>
      <div class="chips"><span>Supplier receipt</span><span>Price list</span><span>Handwritten stock list</span><span>Delivery slip</span></div></div>
      <button type="button" class="btn btn-primary" onclick="slClose('nf47Add'); nf47Read('stock')">Take a photo</button></div>
    <div class="nf47-ways">
      ${way('plus', 'Type one item', 'Name, price and how many. About 20 seconds.', "slClose('nf47Add'); openAddInventoryItem()")}
      ${way('grid', 'Upload Excel or CSV', 'Your whole list at once. Nifti matches the columns.', "slClose('nf47Add'); nf41ImportOpen()")}
      ${way('star', 'Start from a ready list', 'The 50 most common items for your kind of shop. Just fix the prices.', "slClose('nf47Add'); nf26OpenStart('kind')")}
      ${way('down', 'Save my list to Excel', 'A backup, or a copy for your accountant.', 'nf47SaveList()')}</div>
    <p class="nf45-sm">Delivery slips also update stock: Nifti adds what arrived to what you already have. Old utang, sales or supplier bills? <button type="button" class="nf43-link" onclick="slClose('nf47Add'); nf45Old()">Bring in old records</button></p>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf47Add')">Close</button>`, {wide: true});
}
function nf47SaveList(){
  const q = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = [['Item', 'Code', 'On hand', 'Reorder at', 'Cost', 'Selling price', 'Supplier', 'Storage place']].concat((inventoryData || []).map(i => [i.name, i.code || '', i.onHand, i.rop || '', i.unitCost || '', i.sellPrice || '', i.supplier || '', i.warehouse || '']));
  const blob = new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `nifti-stock-${APP_TODAY}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  showToast(`Saved ${rows.length - 1} items. Open the file in Excel or Google Sheets.`, 'success');
}
function nf47StockHead(page){
  if(!page || page.id !== 'page-inventory') return;
  const head = page.querySelector('.page-head'); if(!head) return;
  const olds = [document.getElementById('nf22NbInv'), head.querySelector('.nf41-impbtn'), ...[...head.querySelectorAll('button')].filter(b => /Bring in or save your list/.test(b.textContent)), ...[...page.querySelectorAll('button[onclick="openAddInventoryItem()"]')]];
  olds.forEach(b => { if(b && !b.classList.contains('nf47-gone')) b.classList.add('nf47-gone'); });
  const count = [...head.querySelectorAll('button')].find(b => /^Count all stock$/.test(b.textContent.trim()));
  let add = head.querySelector('.nf47-addbtn');
  if(!add){ add = document.createElement('button'); add.type = 'button'; add.className = 'btn btn-primary nf47-addbtn'; add.innerHTML = `${nf47Svg('plus', 18)}<span>Add items</span>`; add.onclick = nf47AddItems;
    if(count) count.after(add); else (head.querySelector('.nf26-actions, .page-actions') || head).appendChild(add); }
}

/* ---------- 7. Follow ups, order boxes: sizes are CSS only ---------- */

/* ---------- 8. Online store, one screen: your link, the numbers, this week, today's post ---------- */
const NF47ST = {at: 0, data: null, busy: false};
async function nf47StoreStats(){
  if(NF47ST.busy || Date.now() - NF47ST.at < 300000) return;
  if(!myBusiness){ NF47ST.data = {views: 96, orders: 5, sales: 38600, demo: true}; NF47ST.at = Date.now(); return; }
  if(typeof hasFeature === 'function' && !hasFeature('store_insights')){ NF47ST.data = {locked: true}; NF47ST.at = Date.now(); return; }
  NF47ST.busy = true;
  try{ const { data, error } = await sb.rpc('store_stats', {p_days: 7}); if(!error && data) NF47ST.data = data; }catch(e){}
  NF47ST.busy = false; NF47ST.at = Date.now();
  try{ if(document.querySelector('#storeContent .nf47-sthero')) nf22Paint(); }catch(e){}
}
function nf47StoreTab(t){ NF22S.tab = t; try{ localStorage.setItem('nifti-store-tab', t); }catch(e){} nf22Paint(); const b = document.getElementById('nf22sBody'); if(b) b.scrollIntoView({behavior: 'smooth', block: 'start'}); }
function nf47Share(where){
  const s = nf22Shop(), url = s.url(where === 'fb' ? 'fb' : where === 'viber' ? 'viber' : 'link');
  if(where === 'fb'){ window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener'); nf22Logged('share', 'fb'); return; }
  if(where === 'viber'){ const msg = `Order from ${s.name} online po: ${url}`; window.open('viber://forward?text=' + encodeURIComponent(msg), '_blank'); try{ copyText(msg); }catch(e){} nf22Logged('share', 'viber'); return; }
  copyText(url);
}
(function(){
  if(typeof nf22Top !== 'function') return;
  nf22Top = function(){
    const s = nf22Shop(), log = nf22Week(), goal = nf22Plan().goal || 3, top = document.createElement('section'); top.className = 'nf22s-top nf47-sthero';
    const d = new Date(APP_TODAY + 'T00:00:00'), dow = (d.getDay() + 6) % 7, mon = addDaysIso(APP_TODAY, -dow);
    const days = Array.from({length: 7}, (_, i) => { const iso = addDaysIso(mon, i), done = nf22Log().some(x => x.d === iso && x.type !== 'share'); return `<span class="${done ? 'on' : ''}${iso === APP_TODAY ? ' td' : ''}">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}${done ? ' ✓' : ''}</span>`; }).join('');
    const st = NF47ST.data; nf47StoreStats();
    const k = (lbl, v) => `<div><span>${lbl}</span><b>${v}</b></div>`;
    const stats = !st ? k('Visits this week', '…') + k('Orders from the store', '…') + k('Sold through it', '…')
      : st.locked ? `<div class="nf47-stlock"><b>See who visits your store</b><span>Visits, orders and sales from your link show here on Pro.</span><button type="button" class="nf43-link" onclick="nf26OpenPlans()">See plans</button></div>`
      : k('Visits this week', Number(st.views || 0).toLocaleString('en-PH')) + k('Orders from the store', Number(st.orders || 0).toLocaleString('en-PH')) + k('Sold through it', nf47P(st.sales || 0));
    const posted = log.filter(x => x.type !== 'share').length;
    top.innerHTML = `<div class="nf47-stcard"><div class="nf22s-who"><span class="nf22s-dot ${s.open ? 'on' : ''}"></span><div><b>${s.open ? 'Your store is open' : 'Your store is closed'}</b><small>${s.open ? 'Anyone with the link can order, even without Nifti.' : 'Open it in Store settings so buyers can order.'}</small></div></div>
        <code class="nf47-url">${nf22Esc(nf22Short(s.url()))}</code>
        <div class="nf47-share"><button type="button" class="fb" onclick="nf47Share('fb')">Share on Facebook</button><button type="button" class="vb" onclick="nf47Share('viber')">Send on Viber</button><button type="button" class="cp" onclick="nf47Share('link')">Copy link</button></div>
        <div class="nf47-stmore"><button type="button" class="nf43-link" data-go="poster">QR poster for your counter</button><button type="button" class="nf43-link" onclick="nf47StoreTab('store')">Store settings</button></div></div>
      <div class="nf47-stside"><div class="nf47-k3">${stats}</div>${st && st.demo ? '<small class="nf47-ex">Example numbers for the demo shop.</small>' : ''}
        <div class="nf47-wk"><div class="h"><b>This week's posts</b><span>${Math.min(posted, goal)} of ${goal}</span><button type="button" class="nf43-link" onclick="nf47StoreTab('week')">Plan my week</button></div><div class="d">${days}</div></div></div>`;
    return top;
  };
  window.nf22Top = nf22Top;
  const paint = nf22Paint;
  nf22Paint = function(){
    const r = paint.apply(this, arguments);
    try{ const body = document.getElementById('nf22sBody');
      if(body && NF22S.tab !== 'today' && !body.querySelector(':scope > .nf47-stback')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'nf47-stback'; b.innerHTML = `${nf47Svg('back', 18)}<span>Back to today's post</span>`; b.onclick = () => nf47StoreTab('today'); body.insertBefore(b, body.firstChild); } }catch(e){}
    return r;
  };
  window.nf22Paint = nf22Paint;
})();

/* ---------- 9. Deliveries: edit a run right where it is ---------- */
const NF47R = {edit: null};
function nf47EditRun(id){
  const r = (routesCache || []).find(x => x.id === id); if(!r) return;
  routeDraft = {id: r.id, date: r.route_date, driver: r.driver_member_id || '', vehicle: r.vehicle || '',
    stops: (r.stops || []).filter(s => s.status === 'pending').map(s => ({buyer_business_id: s.buyer_business_id, buyer_name: s.buyer_name, address: s.address || '', phone: s.phone || '', deliver_po_ids: s.deliver_po_ids || [], collect_po_ids: s.collect_po_ids || [], items: s.items || [], note: s.note || ''}))};
  NF47R.edit = id; routeTab = 'today'; renderRoutesPage(); nf47RunFocus();
}
function nf47PlanRun(day){ newRouteDraft(); if(day === 'tomorrow') routeDraft.date = addDaysIso(APP_TODAY, 1); else if(day === 'today') routeDraft.date = APP_TODAY; NF47R.edit = 'new'; routeTab = 'today'; renderRoutesPage(); nf47RunFocus(); }
function nf47RunCancel(){ routeDraft = null; NF47R.edit = null; renderRoutesPage(); }
function nf47RunFocus(){ setTimeout(() => { const c = document.querySelector('#routesContent .nf47-runedit'); if(c){ const r = c.getBoundingClientRect(); if(r.top < 70 || r.top > window.innerHeight - 120) c.scrollIntoView({behavior: 'smooth', block: 'start'}); } }, 60); }
function nf47RunEditor(r){
  const d = routeDraft, team = routeTeam().filter(m => m.status !== 'removed'), cands = routeCandidates(); window._routeCands = cands;
  if(!d.driver && r && r.driver_name){ const m = team.find(x => String(x.name).replace(/ \(You\)$/, '') === r.driver_name); if(m) d.driver = m.id; }
  const due = d.stops.reduce((a, s) => a + s.collect_po_ids.reduce((x, id) => { const po = getPO(id); if(!po) return x; const c = computeInvoicePayments(po); return x + Math.max(0, c.balance - c.pendingAmount); }, 0), 0);
  const done = r ? (r.stops || []).filter(s => s.status !== 'pending') : [];
  const what = s => [s.deliver_po_ids.length ? `Deliver ${s.deliver_po_ids.length} order${s.deliver_po_ids.length > 1 ? 's' : ''}` : '', s.collect_po_ids.length ? `Collect ${s.collect_po_ids.length} bill${s.collect_po_ids.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');
  return `<section class="panel-card nf46-run nf47-runedit"><header><div><b>${d.id ? `Editing ${nf47E(r && r.driver_name ? r.driver_name + "'s run" : 'this run')}` : 'New run'}</b><small>Change anything below, then save. Nothing changes for your driver until you save.</small></div><span class="nf45-chipk t-y">Editing</span></header>
    <div class="nf47-rf"><label>Day<input type="date" value="${d.date}" onchange="routeDraft.date=this.value; renderRoutesPage()"></label>
      <label>Driver<select id="rtDriver" onchange="routeDraft.driver=this.value"><option value="">Choose…</option>${team.map(m => `<option value="${nf47E(m.id)}" ${d.driver === m.id ? 'selected' : ''}>${nf47E(m.name)}</option>`).join('')}</select></label>
      <label>Vehicle <small>optional</small><input maxlength="40" placeholder="e.g. L300 van" value="${nf47E(d.vehicle)}" oninput="routeDraft.vehicle=this.value"></label></div>
    <div class="nf46-stops">
      ${done.map(s => `<div class="nf46-stop s-done nf47-lockd"><span class="nf45-ld done">✓</span><div><b>${nf47E(s.buyer_name)}</b><small>${nf45StopWhat(s)} · already done, stays on this run</small></div></div>`).join('')}
      ${d.stops.map((s, i) => `<div class="nf47-es"><span class="nf45-ld next">${done.length + i + 1}</span>
        <div class="m"><b>${nf47E(s.buyer_name)}</b><small>${what(s)}</small>
          <div class="in"><input placeholder="Address for the driver" value="${nf47E(s.address)}" oninput="routeDraft.stops[${i}].address=this.value"><input placeholder="Note, e.g. ask for Nena at the gate" value="${nf47E(s.note)}" oninput="routeDraft.stops[${i}].note=this.value"></div></div>
        <div class="b"><button type="button" aria-label="Move up" onclick="moveDraftStop(${i}, -1)" ${i === 0 ? 'disabled' : ''}>▲</button><button type="button" aria-label="Move down" onclick="moveDraftStop(${i}, 1)" ${i === d.stops.length - 1 ? 'disabled' : ''}>▼</button><button type="button" class="x" onclick="routeDraft.stops.splice(${i}, 1); renderRoutesPage()">Remove</button></div></div>`).join('')}
      ${!d.stops.length && !done.length ? '<p class="nf45-sm nf47-rnone">No stops yet. Add them from the list below.</p>' : ''}</div>
    <details class="nf47-radd" ${d.stops.length ? '' : 'open'}><summary>+ Add a stop <small>${cands.length} waiting</small></summary>
      <label class="nf47-rall"><input type="checkbox" ${routeShowAllUnpaid ? 'checked' : ''} onchange="routeShowAllUnpaid=this.checked; renderRoutesPage()"> Show every unpaid bill, not just the ones due</label>
      ${cands.length ? cands.map((b, bi) => { const col = b.collect.reduce((a, c) => a + c.open, 0), late = Math.max(0, ...b.collect.map(c => c.late)); return `<div class="nf47-rc"><div><b>${nf47E(b.buyer_name)}</b><small>${[b.deliver.length ? `${b.deliver.length} to deliver` : '', col >= 1 ? `${nfP(col)} to collect` : '', late ? `${late} days late` : ''].filter(Boolean).join(' · ')}${b.address ? ' · ' + nf47E(String(b.address).split(',')[0]) : ''}</small></div><button type="button" class="btn btn-outline btn-sm" onclick="addCandidateStop(${bi})">+ Add</button></div>`; }).join('')
        : '<p class="nf45-sm">Nothing waiting: no confirmed orders to deliver and no bills due. Tick the box above to add collections anyway.</p>'}</details>
    <footer><span class="nf47-rsum">${d.stops.length + done.length} stop${d.stops.length + done.length === 1 ? '' : 's'}${due >= 1 ? ` · ${nfP(due)} to collect` : ''}</span><button type="button" class="btn btn-outline btn-sm" onclick="nf47RunCancel()">Cancel</button><button type="button" class="btn btn-primary btn-sm" onclick="saveRouteDraft()">${d.id ? 'Save changes' : 'Save and send to driver'}</button></footer></section>`;
}
(function(){
  if(typeof nf46RouteDay !== 'function') return;
  const day = nf46RouteDay;
  nf46RouteDay = function(body, routes){
    if(!routeDraft) NF47R.edit = null;
    if(routeDraft && !NF47R.edit) NF47R.edit = routeDraft.id || 'new';
    day.apply(this, arguments);
    try{
      body.querySelectorAll('button').forEach(b => { const oc = b.getAttribute('onclick') || '';
        if(/routeTab='plan'/.test(oc)){ const tom = /tomorrow/i.test(b.textContent); b.setAttribute('onclick', `nf47PlanRun('${tom ? 'tomorrow' : 'today'}')`); } });
      if(NF47R.edit && routeDraft){
        const tmp = document.createElement('div'); tmp.innerHTML = nf47RunEditor(NF47R.edit === 'new' ? null : (routes || []).find(x => x.id === NF47R.edit));
        const ed = tmp.firstElementChild;
        const own = NF47R.edit !== 'new' && [...body.querySelectorAll('.nf46-run')].find(c => (c.querySelector('[onclick*="editRoute(\'' + NF47R.edit + '\')"]')));
        if(own) own.replaceWith(ed);
        else { const tom = addDaysIso(APP_TODAY, 1), hT = body.querySelector('.nf46-dayh');
          if(routeDraft.date === tom && hT){ const none = hT.nextElementSibling && hT.nextElementSibling.classList.contains('nf46-none') ? hT.nextElementSibling : null; if(none) none.replaceWith(ed); else hT.after(ed); }
          else { const anchor = body.querySelector('.nf45-rprog') || body.querySelector('.nf45-fuempty') || body.querySelector('.nf46-key'); if(anchor && anchor.classList.contains('nf45-fuempty')) anchor.replaceWith(ed); else if(anchor) anchor.after(ed); else body.prepend(ed); } }
      }
    }catch(e){ console.warn('nf47 run editor', e); }
  };
  window.nf46RouteDay = nf46RouteDay;
  editRoute = nf47EditRun; window.editRoute = nf47EditRun;
})();

/* ---------- 10. No more jumping away: a way back on every page you reach from inside another page ---------- */
const NF47J = {src: '', t: 0, from: null, fromY: 0, to: null, back: false, depth: 0, at: 0};
function nf47ScrollY(){ return window.scrollY || (document.scrollingElement || {}).scrollTop || 0; }
function nf47ScrollTo(y){ try{ window.scrollTo({top: y, behavior: 'auto'}); }catch(e){ window.scrollTo(0, y); } }
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, e => {
  if(ev === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
  const t = e.target && e.target.closest ? e.target : null; if(!t) return; NF47J.t = Date.now();
  NF47J.src = t.closest('.sidebar, #moreSheet, .bottom-nav, .mobile-bottom-nav, .bnav-item, .topbar, .nf47-jback, .nf26-find, #nf26FindBox') ? 'menu' : t.closest('#view-app .app-page, .sl-sheet, .sl-modal, .share-modal, .modal, .nf20-band, .nf22-nb') ? 'content' : 'other';
}, true));
(function(){
  const nav = navigate;
  navigate = function(page){
    try{ const from = NF46N.cur || ((document.querySelector('#view-app .app-page.active') || {}).id || '').replace('page-', '');
      if(NF47J.depth > 0){ if(NF47J.to) NF47J.to = page; } // a page that sends you on to another one: the way back still goes to where you started
      else if(page && from && page !== from){
        if(NF47J.back){ NF47J.back = false; NF47J.to = null; }
        else if((Date.now() - NF47J.t < 2500 && NF47J.src === 'content') || NF46_HIDDEN[page]){ NF47J.from = from; NF47J.fromY = nf47ScrollY(); NF47J.to = page; NF47J.at = Date.now(); }
        else NF47J.to = null; }
    }catch(e){}
    NF47J.depth++;
    try{ return nav.apply(this, arguments); } finally { NF47J.depth--; }
  };
  Object.keys(nav).forEach(k => { navigate[k] = nav[k]; }); window.navigate = navigate;
})();
function nf47GoBack(){ const from = NF47J.from || 'dashboard', y = NF47J.fromY; NF47J.back = true; NF47J.to = null; navigate(from); [60, 300, 700].forEach(ms => setTimeout(() => nf47ScrollTo(y), ms)); }
function nf47JumpBar(page){
  if(!page) return; const id = page.id.replace('page-', '');
  let wrap = page.querySelector(':scope > .nf47-jbar');
  if(NF47J.to && NF47J.to !== id && Date.now() - NF47J.at < 1500 && NF47J.from !== id) NF47J.to = id;
  const want = NF47J.to === id && NF47J.from && NF47J.from !== id;
  if(!want){ if(wrap) wrap.remove(); return; }
  const label = 'Back to ' + nf47PageName(NF47J.from);
  if(!wrap){ wrap = document.createElement('div'); wrap.className = 'nf47-jbar'; const bar = document.createElement('button'); bar.type = 'button'; bar.className = 'nf47-jback'; bar.addEventListener('click', nf47GoBack); wrap.appendChild(bar); page.insertBefore(wrap, page.firstChild); }
  const bar = wrap.firstElementChild;
  if(bar.dataset.k !== label){ bar.dataset.k = label; bar.innerHTML = `${nf47Svg('back', 18)}<span>${nf47E(label)}</span>`; }
}
// the old back line for hidden pages is replaced by this one
try{ const i = NF45_AFTER.indexOf(nf46BackBar); if(i >= 0) NF45_AFTER.splice(i, 1); }catch(e){}

// the notebook reader opens on top of the page you were on, with a clear way back to it
const NF47NB = {from: null};
(function(){
  const open = nf22NbOpen;
  nf22NbOpen = function(){ try{ const ov = document.getElementById('nf22Nb'); if(!ov || ov.hidden) NF47NB.from = NF46N.cur || ((document.querySelector('#view-app .app-page.active') || {}).id || '').replace('page-', ''); }catch(e){} const r = open.apply(this, arguments); nf47NbHead(); return r; };
  window.nf22NbOpen = nf22NbOpen;
  const paint = nf22NbPaint;
  nf22NbPaint = function(){ const r = paint.apply(this, arguments); nf47NbHead(); return r; };
  window.nf22NbPaint = nf22NbPaint;
})();
function nf47NbHead(){
  const ov = document.getElementById('nf22Nb'); if(!ov || ov.hidden) return;
  // the page you came from stays visible, dimmed; the menu beside it stays usable; a tap on the dim goes back
  let dim = document.getElementById('nf47NbDim'); if(!dim){ dim = document.createElement('div'); dim.id = 'nf47NbDim'; dim.className = 'nf47-dim'; dim.addEventListener('click', () => { const c = document.querySelector('#nf22Nb .nf22-nbx'); if(c) c.click(); }); }
  if(dim.nextElementSibling !== ov) ov.parentElement.insertBefore(dim, ov);
  { const sb = document.querySelector('#view-app .sidebar'), l = sb && sb.offsetParent !== null ? Math.round(sb.getBoundingClientRect().right) : 0; if(dim.style.left !== l + 'px') dim.style.left = l + 'px'; }
  const x = ov.querySelector('.nf22-nbx'); if(!x) return;
  const host = x.parentElement; let b = ov.querySelector('.nf47-nbback');
  const label = 'Back to ' + nf47PageName(NF47NB.from || 'dashboard');
  if(!b){ b = document.createElement('button'); b.type = 'button'; b.className = 'nf47-nbback'; b.addEventListener('click', () => { const c = document.querySelector('#nf22Nb .nf22-nbx'); if(c) c.click(); }); }
  const title = host.querySelector('h2, h3, .nf22-nbt, b') || host.firstElementChild;
  const where = (title && title !== x && title.parentElement === host) ? title : host.firstChild;
  if(b.parentElement !== host || b.nextSibling !== where) host.insertBefore(b, where);
  if(b.dataset.k !== label){ b.dataset.k = label; b.innerHTML = `${nf47Svg('back', 18)}<span>${nf47E(label)}</span>`; }
}

/* ---------- 11. Pages you use: a menu that grows as you go, and pages you can switch on or off ----------
   Saved with the business (books_settings.menu), so every phone and computer shows the same menu.
   mode 'grow': new shops start with Home, Delivery orders, Messages and Stock. Each step they finish
   unlocks the pages that go with it, and a page also unlocks the moment they open it.
   mode 'all': every page their role allows. off: pages the owner chose to hide. Nothing is ever deleted. */
const NF47_STARTER = ['dashboard', 'orders', 'messages', 'inventory', 'settings'];
const NF47_PAGES = [
  {p: 'collections', t: 'Getting paid', d: 'Who owes you, reminders and promises to pay.', s: 'order'},
  {p: 'routes', t: 'Deliveries', d: "Your driver's list for the day, with money to collect.", s: 'order'},
  {p: 'returns', t: 'Returns & credits', d: 'Returned or damaged items, and the credits that go with them.', s: 'order'},
  {p: 'money', t: 'Money overview', d: 'Your profit, and where the money went.', s: 'order'},
  {p: 'profit', t: 'Prices & profit', d: 'What each item costs, sells for and earns.', s: 'items'},
  {p: 'sales', t: 'Walk-in sales', d: 'Customers who come in and pay on the spot, and the cash drawer.', s: 'walkin'},
  {p: 'expenses', t: 'Expenses', d: 'Rent, gas, electricity and other bills, with receipts.', s: 'expense'},
  {p: 'ledger', t: 'Monthly summary', d: 'Your month at a glance, ready for your bookkeeper.', s: 'expense'},
  {p: 'issues', t: 'To check', d: "Things that don't add up, with the proof.", s: 'expense'},
  {p: 'team', t: 'Team', d: 'Your people, their jobs and what they did.', s: 'team'},
  {p: 'payroll', t: 'Payroll', d: 'Pay your staff. Vale comes off by itself.', s: 'team'},
  {p: 'followups', t: 'Follow-ups', d: 'Leads and quiet customers to win back.', s: 'lead'},
  {p: 'discover', t: 'Find customers', d: 'New buyers and better suppliers near you.', s: 'lead'},
  {p: 'store', t: 'Online store', d: 'Your order page for Facebook and Viber.', s: 'store'},
  {p: 'cheques', t: 'Checks', d: 'Checks to deposit and checks to fund.', s: 'cheque'},
  {p: 'books', t: 'Tax books', d: 'Sales and purchases for your BIR books.', s: 'expense'},
  {p: 'taxforms', t: '2307 forms', d: 'Tax withheld forms you give and collect.', s: 'expense'},
];
const NF47_STEPS = [
  {k: 'items', t: 'Add your items', why: 'Snap a price list, upload Excel or type them in. Stock, prices and profit all start here.', go: 'nf47AddItems()', done: () => (inventoryData || []).length > 0},
  {k: 'order', t: 'Record your first delivery order', why: 'An order from a customer, or one you place with a supplier. Nifti then tracks delivery and payment.', go: 'nfoNew(true)', done: () => (purchaseOrders || []).length > 0},
  {k: 'expense', t: 'Record an expense', why: 'Rent, gas or electricity. Your monthly summary and profit need these.', go: 'openExpenseForm()', done: () => (BK.expenses || []).some(e => !e.deletedAt)},
  {k: 'walkin', t: 'Sell to a walk-in customer', why: 'Only if people come to your store and pay on the spot. Skip it if you only deliver.', go: 'openQuickSale()', done: () => bkLiveSales().length > 0, optional: true},
  {k: 'team', t: 'Add a team member', why: 'Give your staff their own login. They only see the pages you allow.', go: 'openTeamPeopleSettings()', done: () => (teamMembers || []).filter(m => m.status !== 'removed').length > 1, optional: true},
  {k: 'lead', t: 'Add a possible customer', why: 'Someone who asked for a price. Nifti reminds you to follow up.', go: 'fuAddLead()', done: () => (leadsCache || []).length > 0, optional: true},
  {k: 'store', t: 'Share your online store', why: 'Customers order from your link on Facebook or Viber, even without Nifti.', go: "nf47Unlock(['store']); go('store')", done: () => nf22Log().length > 0, optional: true},
];
const NF47_CHEQUE = () => { try{ return typeof chequesCache !== 'undefined' && (chequesCache || []).length > 0; }catch(e){ return false; } };
function nf47PreviewOn(){ try{ return !nf25Real() && localStorage.getItem('nifti-menu-preview') === 'grow'; }catch(e){ return false; } }
function nf47MenuState(){
  const s = typeof bkSettings === 'function' ? bkSettings() : {}, m = s.menu || {};
  if(nf47PreviewOn()){ let on = {}; try{ on = JSON.parse(localStorage.getItem('nifti-menu-preview-on') || '{}') || {}; }catch(e){} return {mode: 'grow', on, off: m.off || {}, preview: true}; }
  let mode = m.mode;
  if(!mode){ const c = myBusiness && myBusiness.created_at; mode = nf25Real() && c && String(c) >= '2026-11-19' ? 'grow' : 'all'; }
  return {mode, on: m.on || {}, off: m.off || {}};
}
async function nf47SaveMenu(next){
  if(next.preview){ try{ localStorage.setItem('nifti-menu-preview-on', JSON.stringify(next.on || {})); }catch(e){} return true; }
  const menu = {mode: next.mode, on: next.on || {}, off: next.off || {}};
  const all = Object.assign({}, typeof bkSettings === 'function' ? bkSettings() : {}, {menu});
  if(myBusiness){ try{ const { error } = await sb.from('businesses').update({books_settings: all}).eq('id', myBusiness.id); if(error) throw error; myBusiness.books_settings = all; return true; }catch(e){ console.warn('nf47 menu save', e); return false; } }
  BK.settings = all; try{ bkSaveDemo(); }catch(e){} return true;
}
function nf47StepDone(k){ const st = NF47_STEPS.find(x => x.k === k); if(k === 'cheque') return NF47_CHEQUE(); if(!st) return false; if(nf47PreviewOn()) return !!(nf47MenuState().on['step:' + k]); try{ return !!st.done(); }catch(e){ return false; } }
function nf47IsOpen(p, st){ st = st || nf47MenuState(); if(st.off[p]) return false; if(st.mode !== 'grow' || NF47_STARTER.includes(p)) return true; const x = NF47_PAGES.find(y => y.p === p); if(!x) return true; return !!st.on[p] || nf47StepDone(x.s); }
let nf47SaveT = 0;
function nf47Unlock(pages, quiet){
  const st = nf47MenuState(); let changed = false;
  pages.forEach(p => { if(!st.on[p]){ st.on[p] = 1; changed = true; } });
  if(!changed) return; clearTimeout(nf47SaveT); nf47SaveT = setTimeout(() => nf47SaveMenu(st), 400);
  if(st.preview) nf47SaveMenu(st);
  try{ nf26MenuPost(); }catch(e){}
  if(!quiet) nf47Unlocked(pages);
}
// a short note when new pages arrive in the menu, with the next step
function nf47Unlocked(pages){
  const names = pages.map(p => (NF47_PAGES.find(x => x.p === p) || {}).t).filter(Boolean); if(!names.length) return;
  let n = document.getElementById('nf47New'); if(!n){ n = document.createElement('div'); n.id = 'nf47New'; n.className = 'nf47-new'; n.setAttribute('role', 'status'); document.body.appendChild(n); }
  const next = NF47_STEPS.find(s => !nf47StepDone(s.k) && !s.optional) || NF47_STEPS.find(s => !nf47StepDone(s.k));
  n.innerHTML = `<span class="ic">${nf47Svg('spark', 22)}</span><div><b>New in your menu: ${nf47E(names.join(', '))}</b><small>${next ? 'Next: ' + nf47E(next.t) : 'Every step is done. Nice work.'}</small></div><button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('nf47New').hidden = true; nf47Guide()">${next ? 'Next step' : 'See all'}</button><button type="button" class="nf47-x" aria-label="Close" onclick="document.getElementById('nf47New').hidden = true">✕</button>`;
  n.hidden = false; clearTimeout(n._t); n._t = setTimeout(() => { n.hidden = true; }, 12000);
  pages.forEach(p => document.querySelectorAll(`.sidebar .nav-item[data-page="${p}"]`).forEach(el => { el.classList.add('nf47-fresh'); setTimeout(() => el.classList.remove('nf47-fresh'), 8000); }));
}
// steps finished since last look unlock their pages (orders, items, expenses ... added anywhere)
const NF47D = {seen: null};
function nf47CheckSteps(){
  const st = nf47MenuState(); if(st.mode !== 'grow') return;
  const done = NF47_STEPS.filter(s => nf47StepDone(s.k)).map(s => s.k).concat(NF47_CHEQUE() ? ['cheque'] : []);
  if(NF47D.seen === null){ NF47D.seen = done; return; }
  const fresh = done.filter(k => !NF47D.seen.includes(k)); NF47D.seen = done;
  if(!fresh.length) return;
  const pages = NF47_PAGES.filter(x => fresh.includes(x.s) && !st.on[x.p] && !st.off[x.p]).map(x => x.p);
  if(pages.length) nf47Unlock(pages);
}
function nf47MenuApply(){
  const box = document.querySelector('.sidebar .nf19-nav'); if(!box) return;
  const st = nf47MenuState(), grow = st.mode === 'grow';
  const keyOf = el => el.dataset.nf26 === 'bank' ? 'collections' : el.dataset.page;
  const apply = el => { const k = keyOf(el); if(!k) return; const hide = !nf47IsOpen(k, st);
    if(hide){ if(!el.classList.contains('nf47-hid')){ el.classList.add('nf47-hid'); el.dataset.nf47h = '1'; } if(!el.hidden) el.hidden = true; }
    else if(el.dataset.nf47h){ el.classList.remove('nf47-hid'); delete el.dataset.nf47h; el.hidden = false; } };
  box.querySelectorAll('.nav-item[data-page]').forEach(apply);
  document.querySelectorAll('#moreSheet .more-sheet-item[data-page], .bottom-nav .bnav-item[data-page], .mobile-bottom-nav [data-page]').forEach(apply);
  // groups with nothing left in them hide their heading too
  let total = 0;
  box.querySelectorAll(':scope > .nf20-g').forEach(g => { const n = [...g.querySelectorAll('.nav-item')].filter(nf26Visible).length; total += n;
    const empty = n === 0; if(empty && !g.hidden){ g.hidden = true; g.dataset.nf47g = '1'; } else if(!empty && g.dataset.nf47g){ g.hidden = false; delete g.dataset.nf47g; } });
  const flat = total <= 7; if(box.classList.contains('nf26-flat') !== flat) box.classList.toggle('nf26-flat', flat);
  // Getting started, while the menu is still growing
  let gb = document.getElementById('nf47Grow');
  const locked = grow ? NF47_PAGES.filter(x => !nf47IsOpen(x.p, st) && !st.off[x.p] && (typeof isPageAllowedForViewAsRole !== 'function' || isPageAllowedForViewAsRole(x.p))) : [];
  const showGrow = grow && (typeof nf20IsOwner !== 'function' || nf20IsOwner()) && (locked.length || NF47_STEPS.some(s => !s.optional && !nf47StepDone(s.k)));
  if(!showGrow){ if(gb) gb.remove(); return; }
  if(!gb){ gb = document.createElement('div'); gb.id = 'nf47Grow'; gb.className = 'nf47-grow'; }
  const foot = box.querySelector('#nf22Foot') || box.querySelector('#nf26Foot');
  if(gb.parentElement !== box || gb.nextElementSibling !== foot) box.insertBefore(gb, foot || null);
  const steps = NF47_STEPS.filter(s => !s.optional), nd = steps.filter(s => nf47StepDone(s.k)).length;
  const next = locked.slice(0, 3);
  const html = `<button type="button" class="nf47-gs" onclick="nf47Guide()"><span><b>Getting started</b><small>${nd} of ${steps.length} steps done</small></span><i><u style="width:${Math.round(nd / steps.length * 100)}%"></u></i></button>
    ${next.length ? `<div class="nf47-nx"><small>Unlock next</small>${next.map(x => `<button type="button" onclick="nf47LockInfo('${x.p}')">${nf47Svg('lock', 15)}<span>${nf47E(x.t)}</span></button>`).join('')}${locked.length > next.length ? `<button type="button" class="more" onclick="nf47Guide()">+${locked.length - next.length} more</button>` : ''}</div>` : ''}`;
  if(gb.dataset.k !== html){ gb.dataset.k = html; gb.innerHTML = html; }
}
(function(){ if(typeof nf26MenuPost !== 'function') return; const base = nf26MenuPost; nf26MenuPost = function(){ const r = base.apply(this, arguments); try{ nf47MenuApply(); }catch(e){ console.warn('nf47 menu', e); } return r; }; window.nf26MenuPost = nf26MenuPost; })();
// opening a page by any route unlocks it
(function(){ const nav = navigate; navigate = function(page){ try{ const st = nf47MenuState(); if(st.mode === 'grow' && NF47_PAGES.some(x => x.p === page) && !nf47IsOpen(page, st) && !st.off[page]) nf47Unlock([page], true); }catch(e){} return nav.apply(this, arguments); }; Object.keys(nav).forEach(k => { navigate[k] = nav[k]; }); window.navigate = navigate; })();
function nf47LockInfo(p){
  const x = NF47_PAGES.find(y => y.p === p); if(!x) return; const s = NF47_STEPS.find(y => y.k === x.s);
  nf45Pop('nf47Lock', x.t, `<p class="nf47-ld">${nf47E(x.d)}</p>
    <div class="nf47-lu"><span class="ic">${nf47Svg('lock', 20)}</span><div><b>Opens when you ${s ? nf47E(s.t.charAt(0).toLowerCase() + s.t.slice(1)) : 'start using it'}</b><small>${s ? nf47E(s.why) : 'Or open it now.'}</small></div></div>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf47Lock'); nf47Unlock(['${p}']); go('${p}')">Open it now</button>${s ? `<button type="button" class="btn btn-primary" onclick="slClose('nf47Lock'); nf47StepGo('${s.k}')">${nf47E(s.t)}</button>` : ''}`);
}
function nf47StepGo(k){
  const s = NF47_STEPS.find(y => y.k === k); if(!s) return;
  const st = nf47MenuState();
  if(st.preview){ st.on['step:' + k] = 1; const pages = NF47_PAGES.filter(x => x.s === k).map(x => x.p); pages.forEach(p => { st.on[p] = 1; }); nf47SaveMenu(st); try{ nf26MenuPost(); }catch(e){} nf47Unlocked(pages); return; }
  try{ (new Function(s.go))(); }catch(e){ console.warn('nf47 step', e); }
}
function nf47Guide(){
  const st = nf47MenuState(), steps = NF47_STEPS, main = steps.filter(s => !s.optional), nd = main.filter(s => nf47StepDone(s.k)).length;
  const firstOpen = steps.find(s => !nf47StepDone(s.k));
  const row = s => { const done = nf47StepDone(s.k), pages = NF47_PAGES.filter(x => x.s === s.k), isNext = firstOpen && firstOpen.k === s.k;
    return `<div class="nf47-st ${done ? 'done' : ''} ${isNext ? 'next' : ''}"><span class="n">${done ? nf47Svg('check', 16) : ''}</span><div><b>${nf47E(s.t)}${s.optional ? ' <em>if it fits your shop</em>' : ''}</b><small>${nf47E(s.why)}</small>
      ${pages.length ? `<span class="u">${done ? 'Unlocked' : 'Unlocks'}: ${pages.map(x => nf47E(x.t)).join(', ')}</span>` : ''}</div>${done ? '<span class="ok">Done</span>' : `<button type="button" class="btn ${isNext ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="slClose('nf47Guide'); nf47StepGo('${s.k}')">${isNext ? 'Do it now' : 'Do it'}</button>`}</div>`; };
  nf45Pop('nf47Guide', 'Getting started', `<div class="nf47-gh"><b>${nd} of ${main.length} steps done</b><i><u style="width:${Math.round(nd / main.length * 100)}%"></u></i><small>Each step adds the pages that go with it to your menu, so you learn Nifti one part at a time. You stay on the page you're on.${st.preview ? ' Demo preview: tapping a step unlocks it right away.' : ''}</small></div>
    <div class="nf47-sts">${steps.map(row).join('')}</div>`,
    `<button type="button" class="nf43-link" onclick="slClose('nf47Guide'); nf47ShowAll()">Show every page now</button><button type="button" class="btn btn-outline" onclick="slClose('nf47Guide')">Close</button>`, {wide: true});
}
async function nf47ShowAll(){ const st = nf47MenuState(); if(st.preview){ try{ localStorage.removeItem('nifti-menu-preview'); }catch(e){} } else { st.mode = 'all'; await nf47SaveMenu(st); } try{ nf26MenuPost(); }catch(e){} nf47PagesPaint(); showToast('Every page is in your menu now. You can hide the ones you don\'t use in Settings, Pages you use.', 'success'); }
async function nf47Grow(){ if(!nf25Real()){ try{ localStorage.setItem('nifti-menu-preview', 'grow'); localStorage.setItem('nifti-menu-preview-on', '{}'); }catch(e){} NF47D.seen = null; } else { const st = nf47MenuState(); st.mode = 'grow'; await nf47SaveMenu(st); } try{ nf26MenuPost(); }catch(e){} nf47PagesPaint(); nf47Guide(); }

// Settings: Pages you use
function nf47PagesCard(page){
  if(!page || page.id !== 'page-settings') return;
  let c = document.getElementById('nf47Pages');
  if(!c){ c = document.createElement('div'); c.id = 'nf47Pages'; c.className = 'settings-card nf47-pages'; const head = page.querySelector('.page-head'); if(head) head.after(c); else page.prepend(c); }
  // the old Deliveries switch lives here now
  const old = document.getElementById('routesMenuToggle'); if(old){ const r = old.closest('.toggle-row'); if(r && !r.hidden) r.hidden = true; }
  nf47PagesPaint();
}
function nf47RoutesOff(){ return document.body.classList.contains('routes-off'); }
function nf47PagesPaint(){
  const c = document.getElementById('nf47Pages'); if(!c) return;
  const st = nf47MenuState(), owner = typeof nf20IsOwner !== 'function' || nf20IsOwner();
  const rows = NF47_PAGES.filter(x => typeof isPageAllowedForViewAsRole !== 'function' || isPageAllowedForViewAsRole(x.p) || owner).map(x => {
    const off = x.p === 'routes' ? (st.off.routes || nf47RoutesOff()) : !!st.off[x.p], open = !off && nf47IsOpen(x.p, st), locked = !off && !open;
    const s = NF47_STEPS.find(y => y.k === x.s);
    return `<div class="nf47-pr"><div><b>${nf47E(x.t)}</b><small>${nf47E(x.d)}${locked && s ? ` <em>Opens when you ${nf47E(s.t.charAt(0).toLowerCase() + s.t.slice(1))}.</em>` : ''}</small></div>
      <button type="button" class="nf47-sw ${open ? 'on' : ''} ${locked ? 'wait' : ''}" role="switch" aria-checked="${open}" aria-label="${nf47E(x.t)}" ${owner ? '' : 'disabled'} onclick="nf47Toggle('${x.p}')"><i></i><span>${open ? 'Shown' : locked ? 'Not yet' : 'Hidden'}</span></button></div>`; }).join('');
  const html = `<h2>Pages you use</h2><div class="sub">Show only what your business needs. Hiding a page never deletes anything: its records stay in your books and reports, and you can show it again here any time.</div>
    <div class="nf47-mode"><button type="button" class="${st.mode === 'grow' ? 'on' : ''}" ${owner ? '' : 'disabled'} onclick="nf47Grow()"><b>Grow my menu as I go</b><small>Start with 4 pages. Each step you finish adds the next ones, with a short guide.${st.preview ? ' (demo preview)' : ''}</small></button>
      <button type="button" class="${st.mode !== 'grow' ? 'on' : ''}" ${owner ? '' : 'disabled'} onclick="nf47ShowAll()"><b>Show every page</b><small>Everything your role allows, right away. Hide the ones you don't need below.</small></button></div>
    <div class="nf47-prs">${rows}</div>${owner ? '' : '<p class="nf45-sm">Only the owner can change which pages show.</p>'}`;
  if(c.dataset.k !== html){ c.dataset.k = html; c.innerHTML = html; }
}
function nf47Toggle(p){
  const st = nf47MenuState(), x = NF47_PAGES.find(y => y.p === p); if(!x) return;
  const off = p === 'routes' ? (st.off.routes || nf47RoutesOff()) : !!st.off[p], open = !off && nf47IsOpen(p, st);
  if(!open){ // show it
    delete st.off[p]; st.on[p] = 1; if(p === 'routes' && nf47RoutesOff() && typeof setRoutesHidden === 'function') setRoutesHidden(false);
    nf47SaveMenu(st).then(ok => { try{ nf26MenuPost(); }catch(e){} nf47PagesPaint(); showToast(ok ? `${x.t} is in your menu.` : `${x.t} is in your menu on this device. Couldn't save it for your team.`, ok ? 'success' : 'warn'); });
    return; }
  if(p === 'sales') return nf47SalesAsk();
  nf45Pop('nf47Off', `Hide ${x.t}?`, `<p class="nf45-p">${nf47E(x.d)}</p><ul class="nf47-safe"><li>Nothing is deleted. Every record stays in your books and reports.</li><li>Your team stops seeing it in their menu too.</li><li>Show it again any time in Settings, Pages you use.</li></ul>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf47Off')">Keep it</button><button type="button" class="btn btn-primary" onclick="slClose('nf47Off'); nf47HideNow('${p}')">Hide ${nf47E(x.t)}</button>`);
}
function nf47HideNow(p){
  const st = nf47MenuState(), x = NF47_PAGES.find(y => y.p === p) || {t: p}; st.off[p] = 1;
  if(p === 'routes' && typeof setRoutesHidden === 'function') setRoutesHidden(true);
  nf47SaveMenu(st).then(ok => { try{ nf26MenuPost(); }catch(e){} nf47PagesPaint(); showToast(ok ? `${x.t} is hidden. Show it again in Settings, Pages you use.` : `Hidden on this device only. Couldn't save it for your team.`, ok ? 'success' : 'warn');
    const cur = NF46N.cur || ''; if(cur === p) navigate('dashboard'); });
}
// Walk-in sales: check how the business sells before hiding it
const NF47SA = {pick: ''};
function nf47Walkins30(){ try{ const from = addDaysIso(APP_TODAY, -30); return bkLiveSales().filter(s => String(s.date || s.created_at || s.at || '').slice(0, 10) >= from).length; }catch(e){ return 0; } }
function nf47SalesAsk(){
  NF47SA.pick = ''; const n = nf47Walkins30();
  const opt = (k, t, s) => `<button type="button" class="nf47-opt" data-k="${k}" onclick="nf47SalesPick('${k}')"><i></i><span><b>${t}</b><small>${s}</small></span></button>`;
  nf45Pop('nf47Sales', 'Before you hide Walk-in sales', `<p class="nf45-p"><b>How do your customers usually buy from you?</b> Pick the one that fits. This page is only worth hiding if nobody buys at your store.</p>
    <div class="nf47-opts">${opt('walk', 'They come to my store and pay on the spot', 'Like a hardware, sari-sari store, pharmacy or bakery counter.')}${opt('deliver', 'I only take orders and deliver or bill them', 'Like a distributor, wholesaler or supplier with no counter.')}${opt('both', 'Both', 'Some walk in, some order for delivery.')}</div>
    <div class="nf47-sres" id="nf47SalesRes"></div>
    <ul class="nf47-safe">${n ? `<li>You recorded <b>${n} walk-in sale${n === 1 ? '' : 's'}</b> in the last 30 days. Hiding the page keeps them in your books and reports.</li>` : '<li>No walk-in sales were recorded in the last 30 days.</li>'}<li>Your cash count stays on Home.</li><li>Show it again any time in Settings, Pages you use.</li></ul>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf47Sales')">Keep Walk-in sales</button><button type="button" class="btn btn-primary" id="nf47SalesGo" disabled onclick="slClose('nf47Sales'); nf47HideNow('sales')">Hide Walk-in sales</button>`);
}
function nf47SalesPick(k){
  NF47SA.pick = k; document.querySelectorAll('.nf47-opt').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  const res = document.getElementById('nf47SalesRes'), go = document.getElementById('nf47SalesGo'), n = nf47Walkins30();
  const ok = k === 'deliver';
  if(res) res.innerHTML = ok ? (n ? `<div class="nf47-warn"><b>You did record ${n} walk-in sale${n === 1 ? '' : 's'} lately.</b> If those were real, keep this page. If they were orders you delivered, it's fine to hide it.</div>` : '<div class="nf47-okk"><b>Hiding it makes sense.</b> Your delivery orders, bills and payments are all in Delivery orders and Getting paid.</div>')
    : `<div class="nf47-keep"><b>Keep Walk-in sales on.</b> ${k === 'both' ? 'Your counter sales need it, even if most orders are delivered.' : 'This is where you record counter sales and count the cash drawer.'}</div>`;
  if(go) go.disabled = !ok;
}
// a gentle suggestion on the page itself, only when it has gone unused for a month
function nf47SalesHint(page){
  if(!page || page.id !== 'page-sales') return;
  let h = page.querySelector('.nf47-shint');
  const st = nf47MenuState(), dismissed = (() => { try{ return localStorage.getItem('nifti-sales-hint-' + (myBusiness ? myBusiness.id : 'demo')) === '1'; }catch(e){ return false; } })();
  const c = myBusiness && myBusiness.created_at, old = c && (Date.now() - new Date(c).getTime()) > 30 * 864e5;
  const show = nf25Real() && old && !dismissed && !st.off.sales && nf47Walkins30() === 0 && (typeof nf20IsOwner !== 'function' || nf20IsOwner());
  if(!show){ if(h) h.remove(); return; }
  if(!h){ h = document.createElement('div'); h.className = 'nf47-shint'; const head = page.querySelector('.page-head'); if(head) head.after(h); else page.prepend(h);
    h.innerHTML = `<div><b>No walk-in sales in the last 30 days</b><small>If every sale is a delivery order, you can hide this page. Nothing is deleted.</small></div><button type="button" class="btn btn-outline btn-sm" onclick="try{ localStorage.setItem('nifti-sales-hint-' + (myBusiness ? myBusiness.id : 'demo'), '1'); }catch(e){} this.closest('.nf47-shint').remove()">Keep this page</button><button type="button" class="btn btn-primary btn-sm" onclick="nf47SalesAsk()">Check if I can hide it</button>`; }
}

/* ---------- wiring ---------- */
NF45_AFTER.push(page => {
  nf47Names();
  nf47TeamAlign(page); nf47Prices(page); nf47Ledger(page); nf47ColStatus(page); nf47StockHead(page); nf47PagesCard(page); nf47SalesHint(page);
  nf47JumpBar(page);
  try{ nf47CheckSteps(); nf47MenuApply(); }catch(e){ console.warn('nf47 menu pass', e); }
});
document.querySelectorAll('.nf46-back').forEach(b => b.remove());
