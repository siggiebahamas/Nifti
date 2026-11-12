/* ===== Round 18 ===== */

/* ---------- 1. A smaller demo: fewer examples at the source, not hidden behind "Show all" ---------- */
(function(){
  if(typeof NF_DEMO_KEEP === 'undefined') return;
  const K = NF_DEMO_KEEP, set = (a, v) => { a.length = 0; a.push(...v); };
  // 8 orders: one per situation, across both sides
  set(K.po, ['po_q5', 'po8', 'po7', 'po_q1', 'po12', 'po2', 'po13', 'po14']);
  set(K.conv, ['metro', 'cebu', 'northline', 'buy_bayview', 'buy_corazon', 'buy_riverside']);
  set(K.suppliers, ['metro', 'cebu', 'northline']);
  set(K.inv, ['Galvanized Wire 12ga@main', 'Portland Cement 40kg', 'Angle Bars', 'Steel Rebar 12mm', 'Structural I-Beams']);
})();
const NF18_RENAME = {'Rebar 12mm': 'Steel Rebar 12mm', 'Rebar 16mm': 'Steel Rebar 12mm', 'Wire Mesh Panels': 'Galvanized Wire 12ga'};
const NF18_DROP_ITEMS = ['Fresh Tomatoes (Grade A)', 'Welding Rods 3.2mm', 'Rebar 10mm', 'Whole Chicken (Fresh)'];
function nf18DemoTrim(){
  if(!(typeof nfIsDemo === 'function' && nfIsDemo())) return;
  try{
    // customers: one with no open order (Manila Bay goes), so "No open orders" shows a single example
    if(Array.isArray(buyersData)){ for(let i = buyersData.length - 1; i >= 0; i--) if(buyersData[i] && /manila ?bay/i.test(buyersData[i].name || '')) buyersData.splice(i, 1); }
    // one supplier order waiting for their OK is enough (Northline's goes; Cebu's is on the way)
    for(let i = purchaseOrders.length - 1; i >= 0; i--) if(purchaseOrders[i] && purchaseOrders[i].id === 'po_w1') purchaseOrders.splice(i, 1);
    // Cavite's paid order stays in "Paid this month" (it used to lean on an order that is gone)
    const p12 = getPO('po12'); if(p12 && p12.invoice && !p12.invoice.paidDate) p12.invoice.paidDate = addDaysIso(APP_TODAY, -2);
    // rebar bought a little cheaper, so the demo month stays in profit after every item has a cost
    (inventoryData || []).forEach(i => { if(i && i.name === 'Steel Rebar 12mm' && Number(i.unitCost) === 50) i.unitCost = 44; });
    // order lines use the same product names as Stock, so Prices lists 5 items
    (purchaseOrders || []).forEach(o => (o.lineItems || []).forEach(l => { if(NF18_RENAME[l.product]) l.product = NF18_RENAME[l.product]; }));
  }catch(e){ console.warn('nf18 trim', e); }
}
function nf18DemoBooks(){
  if(!(typeof nfIsDemo === 'function' && nfIsDemo()) || typeof BK === 'undefined' || !BK || BK._nf18) return;
  if(!Array.isArray(BK.sales) || !Array.isArray(BK.expenses)) return;
  const m = bkMonth(APP_TODAY);
  BK.expenses = BK.expenses.filter(e => !(bkMonth(e.date) === m && (/fuel/i.test(e.category || '') || /vale|advance/i.test(e.category || ''))));
  BK.sales = BK.sales.filter(s => {
    if(bkMonth(s.date) !== m) return true;
    const ls = (s.lines || []).filter(l => !NF18_DROP_ITEMS.includes(l.product));
    if(!ls.length) return false;
    ls.forEach(l => { if(NF18_RENAME[l.product]) l.product = NF18_RENAME[l.product]; });
    if(ls.length !== (s.lines || []).length){ const tot = ls.reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0); const was = Number(s.total) || 0; s.lines = ls; s.total = tot;
      if(Array.isArray(s.payments) && s.payments.length === 1 && Number(s.payments[0].amount) === was) s.payments[0].amount = tot; }
    return true; });
  BK._nf18 = true;
  try{ bkSaveDemo(); }catch(e){} try{ if(typeof lgInvalidate === 'function') lgInvalidate(); }catch(e){}
}
function nf18DemoMoney(){
  if(!(typeof nfIsDemo === 'function' && nfIsDemo())) return;
  try{ const po = getPO('po8'); if(po && po.invoice){ const list = paymentListFor(po, 'invoice'); for(let i = list.length - 1; i >= 0; i--) if(['nf-chq-2', 'nf-chq-4'].includes(list[i].id)) list.splice(i, 1); } }catch(e){}
}
function nf18DemoTools(){
  if(!(typeof nfIsDemo === 'function' && nfIsDemo())) return;
  try{ const r = (typeof demoRoutes !== 'undefined' && demoRoutes[0]); const s = r && r.stops && r.stops[0];
    if(s && /manila/i.test(s.buyer_name || '')){ const po = getPO('po12'); Object.assign(s, {buyer_business_id: 'buy_cavite', buyer_name: 'Cavite Steel Works', address: 'Dasmariñas yard', deliver_po_ids: ['po12'],
      items: ((po || {}).lineItems || []).map(li => ({product: li.product, qty: li.qty, unit: li.unit || ''}))}); } }catch(e){}
  try{ (teamActivityLog || []).forEach(a => { if(/PO-2026-0820/.test(a.action || '')) a.action = 'marked PO-2026-0798 as received'; }); }catch(e){}
}
(function(){
  // run the extra trims right after each of the Round 7 demo steps
  const after = (name, fn) => { const f = window[name]; if(typeof f !== 'function' || f._nf18) return; const w = function(){ const r = f.apply(this, arguments); try{ fn(); }catch(e){ console.warn(e); } return r; }; w._nf18 = true;
    window[name] = w; };
  after('nfDemoCurate', nf18DemoTrim); after('nfDemoBooks', nf18DemoBooks); after('nfDemoMoney', nf18DemoMoney); after('nfDemoTools', nf18DemoTools);
  // a payment photo from the customer's side, on Riverside's bill (it used to sit on an order that is gone)
  after('nfDemoOrderPhotos', () => { try{ if(typeof nfLive === 'function' && nfLive()) return; const st = nfOpDemoStore(), o = getPO('po8'); if(!o || (st.po8 && st.po8.length)) return;
    st.po8 = [{id: nfUuid(), kind: 'payment', url: nfDemoReceipt('payment', 'Riverside Builders Corp', 9500), by: 'Riverside Builders Corp', at: addDaysIso(APP_TODAY, -1) + 'T02:10:00Z', caption: '', mine: false}];
    try{ localStorage.setItem(NF_OP_DEMO, JSON.stringify(st)); }catch(e){} }catch(e){} });
  after('fuSeedDemo', () => { if(Array.isArray(window._demoLeads)) window._demoLeads = window._demoLeads.slice(0, 2); });
  try{ if(typeof demoWatchdog !== 'undefined' && Array.isArray(demoWatchdog)) demoWatchdog.splice(1); }catch(e){}
  try{ if(typeof NF_FIND_BUYERS !== 'undefined'){ const keep = ['Northgate Homebuilders', 'Sta. Rosa Hardware Center', 'J. Ramos Metal Works']; for(let i = NF_FIND_BUYERS.length - 1; i >= 0; i--) if(!keep.includes(NF_FIND_BUYERS[i].n)) NF_FIND_BUYERS.splice(i, 1); } }catch(e){}
  // To check in the demo: the three that matter most
  const PRI = [/not billed/i, /missing/i, /short/i];
  const f = window.issuesAll; if(typeof f === 'function' && !f._nf18){ const w = function(){ const r = f.apply(this, arguments); if(!(nfIsDemo() && Array.isArray(r))) return r;
      const rank = i => { const t = String(i.title || '') + ' ' + String(i.kind || ''); const k = PRI.findIndex(p => p.test(t)); return k < 0 ? 9 : k; };
      return r.slice().sort((a, b) => rank(a) - rank(b)).slice(0, 3); }; w._nf18 = true; window.issuesAll = w; try{ issuesAll = w; }catch(e){} }
})();
// supplier price changes in the demo: only from suppliers you still buy from
(function(){ const f = window.loadIncomingPrices; if(typeof f !== 'function' || f._nf18) return;
  const w = async function(){ const r = await f.apply(this, arguments); if(nfIsDemo() && Array.isArray(r)){ const keep = (suppliersData || []).map(s => s.name); for(let i = r.length - 1; i >= 0; i--) if(!keep.includes(r[i].supplier_name)) r.splice(i, 1); } return r; };
  w._nf18 = true; window.loadIncomingPrices = w; try{ loadIncomingPrices = w; }catch(e){} })();

/* Home · What to do in the demo: 3 for today, 4 for this week, picked so each one shows a different job */
const NF18_LANES = {r: [/late paying/i, /^Bill /i, /^Cash count/i], y: [/^New order from/i, /waiting for the customer/i, /^Missing & bad stock/i, /^Deposit/i], g: [/./, /./]};
function nf18Lanes(L){
  if(!(typeof nfIsDemo === 'function' && nfIsDemo())) return L;
  const all = [...L.r, ...L.y], used = new Set(), pick = (pats, from, cap) => { const out = [];
    pats.forEach(p => { const x = from.find(i => !used.has(i) && p.test(String(i.h))); if(x){ used.add(x); out.push(x); } });
    from.forEach(i => { if(out.length < cap && !used.has(i)){ used.add(i); out.push(i); } }); return out.slice(0, cap); };
  const r = pick(NF18_LANES.r, all, 3), y = pick(NF18_LANES.y, all.filter(i => !used.has(i)), 4), g = L.g.slice(0, 2);
  return {r, y, g};
}
// Home tiles: the four numbers owners ask about every day
function nf18Tiles(arr){
  const keep = [/Sales this month/, /Cash today/, /Owed to you/, /You owe suppliers/];
  const r = keep.map(k => arr.find(h => k.test(h))).filter(Boolean);
  return (r.length >= 2 ? r : arr).join('');
}

/* ---------- 2. Five main pages; everything else is a tab inside one of them ---------- */
const NF18_HUBS = {
  dashboard: {label: 'Home'},
  orders: {label: 'Orders', tabs: [['orders', 'Orders'], ['routes', 'Deliveries'], ['returns', 'Returns & credits'], ['store', 'Online store'], ['discover', 'Find customers']]},
  messages: {label: 'Messages', tabs: [['messages', 'Chats'], ['team', 'Team']]},
  inventory: {label: 'Stock'},
  money: {label: 'Money', tabs: [['money', 'Overview'], ['sales', 'Counter'], ['expenses', 'Expenses'], ['collections', 'Getting paid'], ['profit', 'Prices'], ['issues', 'To check'], ['payroll', 'Payroll'], ['ledger', 'Books']]}
};
const NF18_SUB = {
  paid: {pages: ['collections', 'cheques'], tabs: [['follow', 'Who owes you'], ['cheques', 'Checks'], ['cash', 'Cash & bank']]},
  books: {pages: ['ledger', 'books', 'taxforms'], tabs: [['ledger', 'Reports'], ['books', 'Tax books'], ['taxforms', 'BIR 2307s']]}
};
const NF18_REDIRECT = {cashcount: ['sales', 'nf18Count'], prices: ['profit', 'nf18Prices'], followups: ['orders'], watchdog: ['issues', 'nf18Team'], analytics: ['money', 'nfHomeReport']};
function nf18HubOf(page){
  if(page === 'cheques') return 'money';
  if(['books', 'taxforms'].includes(page)) return 'money';
  for(const [h, v] of Object.entries(NF18_HUBS)){ if(h === page || (v.tabs || []).some(t => t[0] === page)) return h; }
  return null;
}
function nf18TabOf(page){ if(page === 'cheques') return 'collections'; if(['books', 'taxforms'].includes(page)) return 'ledger'; return page; }
function nf18GoPaid(k){ if(k === 'cheques') return go('cheques'); try{ colTab = k; }catch(e){} go('collections'); }
function nf18HubHtml(page){
  const hub = nf18HubOf(page), H = hub && NF18_HUBS[hub]; if(!H || !H.tabs) return '';
  const cur = nf18TabOf(page);
  let html = `<nav class="nf18-hub" aria-label="${H.label} pages">${H.tabs.map(([p, l]) => `<button type="button" class="${p === cur ? 'on' : ''}" aria-current="${p === cur ? 'page' : 'false'}" onclick="go('${p}')">${l}</button>`).join('')}</nav>`;
  const sub = Object.values(NF18_SUB).find(s => s.pages.includes(page));
  if(sub){ const on = page === 'cheques' ? 'cheques' : page === 'collections' ? ((typeof colTab !== 'undefined' && colTab === 'cash') ? 'cash' : 'follow') : page;
    html += `<nav class="nf18-sub" aria-label="More">${sub.tabs.map(([k, l]) => `<button type="button" class="${k === on ? 'on' : ''}" onclick="${sub === NF18_SUB.paid ? `nf18GoPaid('${k}')` : `go('${k}')`}">${l}</button>`).join('')}</nav>`; }
  return html;
}
function nf18PaintHub(page){
  const pg = document.getElementById('page-' + page); if(!pg) return;
  let box = pg.querySelector(':scope > .nf18-hubwrap');
  const html = nf18HubHtml(page);
  if(!html){ if(box) box.remove(); return; }
  if(!box){ box = document.createElement('div'); box.className = 'nf18-hubwrap'; }
  if(pg.firstElementChild !== box) pg.insertBefore(box, pg.firstChild);
  if(box.innerHTML !== html) box.innerHTML = html;
}
function nf18Menu(){
  // sidebar: Home, Orders, Messages, Stock, Money
  document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(n => n.classList.toggle('nf18-off', !NF18_HUBS[n.dataset.page]));
  document.querySelectorAll('.sidebar .heading, .sidebar .nav-fold').forEach(h => h.classList.add('nf18-off'));
  const money = document.querySelector('.sidebar .nav-item[data-page="money"] span:not(.nav-badge)'); if(money && money.textContent !== 'Money') money.textContent = 'Money';
  const stock = document.querySelector('.sidebar .nav-item[data-page="inventory"] span:not(.nav-badge)'); if(stock && stock.textContent !== 'Stock') stock.textContent = 'Stock';
  // phone: Home, Orders, Chat, Stock, Money
  const bn = document.getElementById('bottomNav');
  if(bn && !bn.querySelector('.bnav-item[data-page="inventory"]')){
    const ic = (document.querySelector('.sidebar .nav-item[data-page="inventory"] svg') || {}).outerHTML || '';
    const b = document.createElement('button'); b.className = 'bnav-item'; b.dataset.page = 'inventory'; b.setAttribute('onclick', "go('inventory')"); b.innerHTML = ic + '<span class="bnav-label">Stock</span>';
    const order = ['dashboard', 'orders', 'messages', 'inventory', 'money'];
    const items = {}; bn.querySelectorAll('.bnav-item[data-page]').forEach(x => { items[x.dataset.page] = x; }); items.inventory = b;
    order.forEach(p => { if(items[p]) bn.appendChild(items[p]); });
    const more = document.getElementById('bnavMoreBtn'); if(more) more.classList.add('nf18-off');
  }
  // the account menu holds Settings, Help and the language switch
  const um = document.getElementById('userMenuDropdown');
  if(um && !um.querySelector('.nf18-lang')){ const d = document.createElement('div'); d.className = 'nf18-lang';
    d.innerHTML = `<span>Language</span><div class="lang-switch" role="group" aria-label="Language"><button data-lang="EN" onclick="setLanguage('EN')">English</button><button data-lang="FIL" onclick="setLanguage('FIL')">Filipino</button></div>`;
    um.insertBefore(d, um.firstChild); }
}
function nf18Active(page){
  const hub = nf18HubOf(page) || page;
  document.querySelectorAll('.sidebar .nav-item[data-page], #bottomNav .bnav-item[data-page]').forEach(n => n.classList.toggle('active', n.dataset.page === hub));
}

/* page merges: Counter (Sales + Cash count), Prices (Profit & prices + Price list), To check (+ team spending), Money (+ how the business is doing) */
function nf18Section(pg, id, title, sub){
  let s = document.getElementById(id);
  if(!s){ s = document.createElement('section'); s.id = id; s.className = 'nf18-merge'; s.innerHTML = `<div class="nf18-mh2"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`; pg.appendChild(s); }
  return s;
}
function nf18Counter(){
  const pg = document.getElementById('page-sales'); if(!pg) return;
  const h = pg.querySelector('.page-head h1'), p = pg.querySelector('.page-head p');
  if(h && h.textContent !== 'Counter') h.textContent = 'Counter';
  if(p && !p.dataset.nf18){ p.textContent = "Today's sales, then count the cash at closing."; p.dataset.nf18 = '1'; }
  const s = nf18Section(pg, 'nf18Count', 'Count the cash', 'Nifti already knows what should be in the drawer.');
  const body = document.getElementById('bkCashBody'); if(body && body.parentElement !== s) s.appendChild(body);
  try{ renderCashCountPage(); }catch(e){}
  let dw = document.getElementById('nf18DrawerWrap');
  if(!dw){ dw = document.createElement('div'); dw.id = 'nf18DrawerWrap'; dw.className = 'mh-root nf18-mh'; dw.innerHTML = '<section class="sect glass" id="mhDrawer"></section>'; s.appendChild(dw); }
  try{ const d = document.getElementById('mhDrawer'); if(d && typeof mhDrawer === 'function' && typeof BK !== 'undefined' && BK.loaded) d.innerHTML = mhDrawer(); }catch(e){}
}
function nf18Prices(){
  const pg = document.getElementById('page-profit'); if(!pg) return;
  const h = pg.querySelector('.page-head h1'), p = pg.querySelector('.page-head p');
  if(h && h.textContent !== 'Prices') h.textContent = 'Prices';
  if(p && !p.dataset.nf18){ p.textContent = 'What each item costs, what you sell it for, and every price change.'; p.dataset.nf18 = '1'; }
  const s = nf18Section(pg, 'nf18Prices', 'Price changes', 'Tell your buyers about new prices, and see what your suppliers are changing.');
  const c = document.getElementById('pricesContent'); if(c && c.parentElement !== s) s.appendChild(c);
  try{ priceChangesCache = null; incomingPricesCache = null; renderPricesPage(); }catch(e){}
}
function nf18Issues(){
  const pg = document.getElementById('page-issues'); if(!pg) return;
  const s = nf18Section(pg, 'nf18Team', 'Team spending', 'Orders your people sent above the price you agreed with the supplier.');
  const c = document.getElementById('watchdogContent'); if(c && c.parentElement !== s) s.appendChild(c);
  try{ watchdogTab = 'alerts'; watchdogAlerts = null; renderWatchdogPage(); }catch(e){}
}
function nf18Money(){
  const pg = document.getElementById('page-money'); if(!pg) return;
  let w = document.getElementById('nf18ReportWrap');
  if(!w){ w = document.createElement('div'); w.id = 'nf18ReportWrap'; w.className = 'mh-root nf18-mh'; w.innerHTML = '<section class="sect glass" id="nfHomeReport"><div class="sect-h"><h4>How the business is doing</h4></div></section>'; pg.appendChild(w); }
  try{ if(typeof nfFillHomeReport === 'function') nfFillHomeReport(); }catch(e){}
}
async function nf18Leads(){
  const pg = document.getElementById('page-discover'); if(!pg) return;
  let s = document.getElementById('nf18Leads');
  if(!s){ s = document.createElement('section'); s.id = 'nf18Leads'; s.className = 'panel-card nf18-leads'; pg.appendChild(s); }
  try{ if(typeof fuLoad === 'function') await fuLoad(); }catch(e){}
  const open = (typeof leadsCache !== 'undefined' && leadsCache || []).filter(l => l.stage !== 'won' && l.stage !== 'lost');
  s.innerHTML = `<div class="nf18-lh"><h2>Your leads</h2><p>People who asked about a price or may buy soon. They used to live in Follow-ups.</p></div>`
    + (open.length ? open.map(l => typeof fuLeadRow === 'function' ? fuLeadRow(l) : '').join('') : '<p class="nf18-none">No leads yet. Tap "Save as a lead" on any business above.</p>')
    + `<button type="button" class="btn btn-outline btn-sm" onclick="typeof fuAddLead === 'function' && fuAddLead()">+ Add a lead</button>`;
}

/* small fixes that run after any page draws (idempotent) */
function nf18Fix(){
  const pg = document.querySelector('#view-app .app-page.active'); if(!pg) return;
  const id = pg.id.slice(5);
  nf18PaintHub(id);
  // helper boxes ("1 · 2 · 3") show the first time only, then fold into a small link
  pg.querySelectorAll(':scope > .nf-steps, :scope .nf-steps').forEach(st => {
    if(st.dataset.nf18) return; st.dataset.nf18 = '1';
    let seen = false; try{ seen = localStorage.getItem('nf18-steps-' + id) === '1'; localStorage.setItem('nf18-steps-' + id, '1'); }catch(e){}
    if(seen && !(st.previousElementSibling && st.previousElementSibling.classList.contains('nf18-how'))){ st.classList.add('nf18-fold'); const a = document.createElement('button'); a.type = 'button'; a.className = 'nf18-how'; a.textContent = 'How it works';
      a.onclick = () => { st.classList.toggle('nf18-fold'); a.textContent = st.classList.contains('nf18-fold') ? 'How it works' : 'Hide how it works'; }; st.insertAdjacentElement('beforebegin', a); }
  });
  if(id === 'inventory') nf18Stock();
  if(id === 'discover') document.querySelectorAll('#page-discover > .panel-card').forEach(c => { if(!c.classList.contains('nf18-oldleads') && /Turn on the toggle above/.test(c.textContent)) c.classList.add('nf18-oldleads'); });
  if(id === 'settings') nf18SettingsSearch();
  if(id === 'sales'){ const ec = [...document.querySelectorAll('#bkCashBody section, #bkCashBody .panel-card')].find(x => /^Every count/.test(((x.querySelector('h2,h3,.panel-head') || {}).textContent || '').trim())); if(ec) ec.classList.add('nf18-off'); }
}
function nf18Stock(){
  const row = document.querySelector('#inventoryMainView .bk-stock-t'); if(!row) return;
  const crit = (document.getElementById('invStatCritical') || {}).textContent || '0', val = (document.getElementById('invStatValue') || {}).textContent || '₱0';
  let a = row.querySelector('.nf18-re'), b = row.querySelector('.nf18-val');
  if(!a){ a = document.createElement('button'); a.type = 'button'; a.className = 'bk-tile bad nt-bad nf18-re'; a.setAttribute('onclick', "nf18StockFilter('critical')"); row.insertBefore(a, row.firstChild); }
  if(!b){ b = document.createElement('div'); b.className = 'bk-tile nt-plain nf18-val'; row.appendChild(b); }
  const ah = `<small>Reorder now</small><b>${escapeHtml(crit.trim())}</b><span>${Number(crit) === 1 ? 'item' : 'items'} running out</span>`, bh = `<small>Stock value</small><b>${escapeHtml(val.trim())}</b><span>at what you paid</span>`;
  if(a.innerHTML !== ah) a.innerHTML = ah; if(b.innerHTML !== bh) b.innerHTML = bh;
  // warehouses: one dropdown next to the status filters instead of a second row
  const tb = document.querySelector('#inventoryMainView .toolbar'), tabs = [...document.querySelectorAll('#whTabs .wh-tab')];
  if(tb && tabs.length > 1){
    let sel = tb.querySelector('select.nf18-wh');
    if(!sel){ sel = document.createElement('select'); sel.className = 'nf18-wh'; sel.setAttribute('aria-label', 'Warehouse'); sel.onchange = () => { const t = [...document.querySelectorAll('#whTabs .wh-tab')][sel.selectedIndex]; if(t) t.click(); }; tb.insertBefore(sel, tb.firstChild); }
    const opts = tabs.map(t => t.textContent.trim()), cur = tabs.findIndex(t => t.classList.contains('active'));
    if([...sel.options].map(o => o.text).join('|') !== opts.join('|')) sel.innerHTML = opts.map(o => `<option>${escapeHtml(o)}</option>`).join('');
    if(cur >= 0 && sel.selectedIndex !== cur) sel.selectedIndex = cur;
  }
}
function nf18StockFilter(k){ const chip = [...document.querySelectorAll('#statusChips .chip')].find(c => /reorder/i.test(c.textContent)); if(chip) chip.click(); }
function nf18SettingsSearch(){
  const pg = document.getElementById('page-settings'); if(!pg || pg.querySelector('.nf18-ss')) return;
  const head = pg.querySelector(':scope > .page-head'); const box = document.createElement('div'); box.className = 'nf18-ss';
  box.innerHTML = `<input type="search" placeholder="Search settings, e.g. GCash, TIN, password" aria-label="Search settings"><p class="nf18-ss-none" hidden>No setting matches. Try another word.</p>`;
  (head || pg.firstChild).insertAdjacentElement('afterend', box);
  const inp = box.querySelector('input'), none = box.querySelector('.nf18-ss-none');
  inp.addEventListener('input', () => { const q = inp.value.trim().toLowerCase(); let any = false;
    pg.querySelectorAll(':scope > .settings-card').forEach(c => { const hit = !q || c.textContent.toLowerCase().includes(q); c.classList.toggle('nf18-off', !hit); if(hit) any = true;
      if(q && hit){ const d = c.querySelector('details:not([open])'); if(d) d.open = true; if(c.classList.contains('acc') && !c.classList.contains('open')){ const t = c.querySelector('h2'); if(t && typeof t.click === 'function' && !c.dataset.nf18o){ c.dataset.nf18o = '1'; } } } });
    pg.querySelectorAll(':scope > .settings-section-title').forEach(t => t.classList.toggle('nf18-off', !!q));
    none.hidden = any; });
}
let _nf18Raf = 0;
function nf18Soon(){ if(_nf18Raf) return; _nf18Raf = requestAnimationFrame(() => { _nf18Raf = 0; try{ nf18Fix(); }catch(e){ console.warn(e); } }); }

/* Team chat lives in Messages now: a "Team" chat sits on top of the list */
const NF18T = {on: false};
function nf18TeamRow(){
  const tm = (typeof teamMembers !== 'undefined' && teamMembers || []); if(!tm.length) return '';
  const msgs = (typeof teamChatMessages !== 'undefined' ? teamChatMessages : []).filter(m => typeof teamScoped !== 'function' || teamScoped(m));
  const last = msgs[msgs.length - 1];
  return `<div class="nfw-gh nf18-tgh"><span>Team</span><b>${tm.length}</b></div>
    <div class="conv-item nfw-ci nf18-tci${NF18T.on ? ' active' : ''}" onclick="nf18OpenTeam()"><div class="conv-avatar nf18-tav">${ic18('users')}</div>
      <div class="conv-info"><div class="conv-name-row"><span class="conv-name">Team chat</span><span class="conv-time">${last ? escapeHtml(String(last.time || '')) : ''}</span></div>
      <div class="conv-preview">${last ? escapeHtml((last.author ? last.author.split(' ')[0] + ': ' : '') + last.text) : 'Only your own people see this'}</div></div></div>`;
}
function ic18(n){ const P = {users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>', arrowup: '<path d="M7 17 17 7M8 7h9v9"/>', arrowdown: '<path d="M17 7 7 17M16 17H7V8"/>',
  back: '<path d="M15 6l-6 6 6 6"/>', send: '<path d="M5 12h14M13 6l6 6-6 6"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'};
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`; }
function nf18OpenTeam(){
  NF18T.on = true; try{ activeConvId = null; }catch(e){}
  const shell = document.querySelector('#page-messages .messages-shell'); if(!shell) return;
  let pane = document.getElementById('nf18TeamPane');
  if(!pane){ pane = document.createElement('div'); pane.id = 'nf18TeamPane'; pane.className = 'nf18-team-pane';
    pane.innerHTML = `<div class="nf18-tp-h"><button type="button" class="nf18-tp-back" onclick="nf18CloseTeam()" aria-label="Back to chats">${ic18('back')}</button><span class="conv-avatar nf18-tav">${ic18('users')}</span><div><b>Team chat</b><small>Only your own people see this, never your customers or suppliers.</small></div></div>`;
    shell.appendChild(pane); }
  const chat = document.querySelector('#teamTab_chat .team-chat-card'); if(chat && chat.parentElement !== pane) pane.appendChild(chat);
  shell.classList.add('nf18-team-on', 'thread-active');
  try{ renderTeamChatThread(); }catch(e){}
  try{ renderConversationList(); }catch(e){}
  const inp = document.getElementById('teamChatInput'); if(inp && !(typeof nfIsPhone === 'function' && nfIsPhone())) inp.focus();
}
function nf18CloseTeam(){ NF18T.on = false; const shell = document.querySelector('#page-messages .messages-shell'); if(shell) shell.classList.remove('nf18-team-on', 'thread-active'); try{ renderConversationList(); }catch(e){} }

/* ---------- wiring ---------- */
(function(){
  // what to do / tiles on Home
  // navigate: redirects for pages that moved, then the hub tabs and merges
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf18){
    const w = function(page){
      const r = NF18_REDIRECT[page];
      if(r){ const out = w(r[0]); if(r[1]) setTimeout(() => { const el = document.getElementById(r[1]); if(el) el.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 450); return out; }
      if(page === 'messages' && NF18T.on && !w._keepTeam) NF18T.on = false;
      const out = nav.apply(this, arguments);
      try{
        if(document.getElementById('page-' + page)){
          nf18Active(page); nf18PaintHub(page);
          if(page === 'sales') nf18Counter();
          if(page === 'profit') nf18Prices();
          if(page === 'issues') nf18Issues();
          if(page === 'money') nf18Money();
          if(page === 'discover') nf18Leads();
          if(page === 'ledger' && typeof LGV !== 'undefined' && LGV.tab === 'summary'){ LGV.tab = 'pnl'; try{ renderLedgerPage(); }catch(e){} }
          if(page === 'messages'){ const sh = document.querySelector('#page-messages .messages-shell'); if(sh && !NF18T.on) sh.classList.remove('nf18-team-on'); }
          nf18Soon();
        }
      }catch(e){ console.warn('nf18 nav', e); }
      return out; };
    w._nf18 = true; window.navigate = w; try{ navigate = w; }catch(e){}
  }
  // the cash drawer calendar now lives on Counter: anything that redraws Home redraws it too
  const rmh = window.renderMistHome;
  if(typeof rmh === 'function' && !rmh._nf18){
    const w = function(){ const out = rmh.apply(this, arguments); try{ const d = document.getElementById('mhDrawer'); if(d && typeof BK !== 'undefined' && BK.loaded && typeof mhDrawer === 'function') d.innerHTML = mhDrawer(); }catch(e){} return out; };
    w._nf18 = true; w._nf11 = true; window.renderMistHome = w; try{ renderMistHome = w; }catch(e){}
    try{ if(typeof renderOneHome !== 'undefined') renderOneHome = w; }catch(e){} try{ if(typeof renderHomeV2 !== 'undefined') renderHomeV2 = w; }catch(e){}
  }
  // Books & reports opens on Profit & loss (the summary repeated Money overview)
  try{ if(typeof LG_TABS !== 'undefined'){ const i = LG_TABS.findIndex(t => t[0] === 'summary'); if(i >= 0) LG_TABS.splice(i, 1); } if(typeof LGV !== 'undefined' && LGV.tab === 'summary') LGV.tab = 'pnl'; }catch(e){}
  // chat list: the Team chat on top
  const rcl = window.renderConversationList;
  if(typeof rcl === 'function' && !rcl._nf18){
    const w = function(){ const out = rcl.apply(this, arguments); try{ const box = document.getElementById('convList'); if(box && !box.querySelector('.nf18-tci')){ const html = nf18TeamRow(); if(html) box.insertAdjacentHTML('afterbegin', html); } }catch(e){} return out; };
    w._nf18 = true; window.renderConversationList = w; try{ renderConversationList = w; }catch(e){}
  }
  const sc = window.selectConversation;
  if(typeof sc === 'function' && !sc._nf18){
    const w = function(){ if(NF18T.on){ NF18T.on = false; const sh = document.querySelector('#page-messages .messages-shell'); if(sh) sh.classList.remove('nf18-team-on'); } return sc.apply(this, arguments); };
    w._nf18 = true; window.selectConversation = w; try{ selectConversation = w; }catch(e){}
  }
  const start = () => { const v = document.getElementById('view-app'); if(!v) return setTimeout(start, 300);
    nf18Menu(); new MutationObserver(nf18Soon).observe(v, {childList: true, subtree: true}); nf18Soon();
    try{ const a = document.querySelector('#view-app .app-page.active'); if(a) nf18Active(a.id.slice(5)); }catch(e){} };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* ---------- 3. Chat with the order beside it: why you came, 3 ready messages, the order on the right ---------- */
const NF18M = {po: null, conv: null, sell: false, sent: false, lang: 'en', open: false, last: null, undoT: 0};
const NF18_STEPS = ['To confirm', 'Preparing', 'On the way', 'Delivered', 'Billed', 'Paid'];
function nf18Peso(n){ return '₱' + Math.round(Number(n) || 0).toLocaleString('en-PH'); }
function nf18Day(d){ try{ return d ? (typeof hmDay === 'function' ? hmDay(String(d).slice(0, 10)) : String(d).slice(0, 10)) : ''; }catch(e){ return String(d || ''); } }
function nf18Row(o){ try{ return nfoAll().find(r => r.o.id === o.id) || null; }catch(e){ return null; } }
function nf18Tpl(o, sell, r){
  const who = sell ? o.buyerName : o.supplierName, po = o.poNumber, li = o.lineItems || [], me = typeof selfName === 'function' ? selfName() : 'us';
  const items = li.length ? `${li[0].qty} × ${li[0].product}${li.length > 1 ? ` + ${li.length - 1} more` : ''}` : po, prod = li.length ? li[0].product : 'items';
  const tot = nf18Peso(poTotal(o)), st = o.status, date = nf18Day(o.requestedDeliveryDate || (r && r.date) || APP_TODAY);
  let un = null; try{ un = unpaidInvoicesFor(sell ? 'supplier' : 'buyer').find(x => x.po && x.po.id === o.id) || null; }catch(e){}
  const bal = un ? nf18Peso(un.balance) : tot, due = un && un.due ? nf18Day(un.due) : date, late = un && un.daysOverdue > 0, said = un && Number(un.pending) > 0;
  const hold = o.quote && o.quote.hold_until ? nf18Day(o.quote.hold_until) : date;
  const paid = st === 'paid' || (o.invoice && o.invoice.status === 'paid'), billed = !paid && (st === 'invoiced' || !!o.invoice);
  const pay = [`Payment details`, `Hi! For ${po}, you can pay ${me} by GCash or bank transfer. Please send a photo of the receipt. Thank you!`, 'Paano magbayad', `Hi po! Sa ${po}, pwede pong magbayad sa ${me} sa GCash o bank transfer. Pakisend po ang picture ng resibo. Salamat po!`];
  let k;
  if(sell) k = paid ? 'paid' : billed ? (said ? 'said' : late ? 'late' : 'due') : st === 'quote' ? 'quote' : ['confirmed', 'preparing'].includes(st) ? 'prep' : ['shipped', 'in_customs'].includes(st) ? 'ship' : ['delivered', 'partially_delivered'].includes(st) ? 'deliv' : 'new';
  else k = paid ? 'paid' : billed ? 'bill' : ['quote', 'countered'].includes(st) ? 'quote' : ['confirmed', 'preparing'].includes(st) ? 'prep' : ['shipped', 'in_customs'].includes(st) ? 'ship' : ['delivered', 'partially_delivered'].includes(st) ? 'deliv' : st === 'draft' ? 'draft' : 'sent';
  const S = {
    new: [[`Confirm it`, `Hi ${who}! Got your order ${po} (${items}). We can deliver on ${date}. Confirming now.`, 'Kumpirmahin', `Hi po, ${who}! Natanggap namin ang order ${po} (${items}). Maide-deliver namin sa ${date}. Kinukumpirma na po namin.`],
      [`Send in two parts`, `Hi! For ${po}, part of it is ready now and the rest in a few days. OK to deliver in two parts?`, 'Dalawang delivery', `Hi po! Sa ${po}, handa na ang bahagi at ang iba ay sa susunod na ilang araw. Ok lang po ba na dalawang delivery?`],
      [`Ask a question`, `Hi! Quick question on ${po}: what time is best to deliver, and who will receive it?`, 'May tanong', `Hi po! Tanong lang sa ${po}: anong oras pinakamainam mag-deliver, at sino po ang tatanggap?`]],
    quote: sell ? [[`Friendly reminder`, `Hi ${who}! Quick reminder: your price for ${po} (${items}, ${tot}) holds until ${hold}. Can you give us your OK so we can reserve the stock?`, 'Paalala', `Hi po, ${who}! Paalala lang po: hanggang ${hold} ang presyo ng ${po} (${items}, ${tot}). Pwede po ba ang OK para ma-reserve namin ang stock?`],
      [`Offer more time`, `Hi! If you need a few more days, we can hold the ${tot} price for ${po} a little longer. Just reply YES.`, 'Dagdag na araw', `Hi po! Kung kailangan pa ng ilang araw, pwede naming i-hold nang mas matagal ang ${tot} na presyo ng ${po}. Reply lang po ng YES.`],
      [`Ask about changes`, `Hi! Anything you'd like to change on ${po} before you say yes? We can adjust the quantity or the delivery date.`, 'May babaguhin?', `Hi po! May gusto po ba kayong baguhin sa ${po} bago mag-OK? Pwede naming ayusin ang dami o ang delivery date.`]]
      : [[`Accept the price`, `Hi ${who}! We accept your price for ${po}. Please go ahead.`, 'Tanggapin', `Hi po, ${who}! Tinatanggap namin ang presyo n'yo para sa ${po}. Tuloy na po.`],
      [`Ask for a better price`, `Hi! For ${po}, can you do a better price if we order a bit more?`, 'Mas mababang presyo', `Hi po! Sa ${po}, may mas magandang presyo po ba kung dadagdagan namin ang order?`],
      [`Ask the delivery date`, `Hi! If we say yes to ${po} today, when can you deliver?`, 'Kailan ang delivery', `Hi po! Kung mag-OK kami sa ${po} ngayon, kailan po kayo makakapag-deliver?`]],
    prep: sell ? [[`Delivery date`, `Hi ${who}! ${po} is being prepared. We'll deliver on ${date}.`, 'Petsa ng delivery', `Hi po, ${who}! Inihahanda na ang ${po}. Ide-deliver namin sa ${date}.`],
      [`Ready for pickup`, `Hi! ${po} is ready. You can pick it up today, or we can deliver.`, 'Handa na', `Hi po! Handa na ang ${po}. Pwede n'yo pong kunin ngayong araw, o kami na ang magde-deliver.`],
      [`Need one more day`, `Hi! Sorry, ${po} needs one more day. We'll deliver the day after ${date}.`, 'Isa pang araw', `Hi po! Pasensya na, kailangan pa ng isang araw ang ${po}. Ide-deliver namin sa araw pagkatapos ng ${date}.`]]
      : [[`Still on track?`, `Hi ${who}! Just checking on ${po} (${items}). Is it still on track for ${date}?`, 'On time pa ba?', `Hi po, ${who}! Kumusta po ang ${po} (${items})? Darating pa rin po ba sa ${date}?`],
      [`Can it come earlier?`, `Hi! Can ${po} come earlier? We're running low. Even half the order this week would help.`, 'Paagahin', `Hi po! Pwede po bang mapaaga ang ${po}? Paubos na po kami. Kahit kalahati muna ngayong linggo.`],
      [`Photo when loaded`, `Hi! Please send a photo once ${po} is loaded, plus the driver's name and plate number. Thank you!`, 'Picture kapag naikarga', `Hi po! Pakisend po ng picture kapag naikarga na ang ${po}, pati pangalan ng driver at plate number. Salamat po!`]],
    ship: sell ? [[`On the way`, `Hi ${who}! ${po} is on the way. Please have someone ready to receive it.`, 'Paparating na', `Hi po, ${who}! Paparating na ang ${po}. Pakihanda po ang tatanggap.`],
      [`Driver details`, `Hi! Our driver is on the way with ${po}. I'll send the plate number and their phone so you can coordinate.`, 'Detalye ng driver', `Hi po! Papunta na ang driver namin dala ang ${po}. Ise-send ko po ang plate number at numero niya.`],
      [`Check it arrived`, `Hi! Did ${po} arrive complete? Reply OK, or tell us what's missing.`, 'Dumating ba?', `Hi po! Kumpleto po bang dumating ang ${po}? Reply lang ng OK, o sabihin kung may kulang.`]]
      : [[`What time?`, `Hi ${who}! ${po} is on the way. What time will it arrive?`, 'Anong oras?', `Hi po, ${who}! Paparating na ang ${po}. Anong oras po darating?`],
      [`Driver details`, `Hi! Please send the driver's name and phone for ${po} so we can receive it.`, 'Detalye ng driver', `Hi po! Pakisend po ang pangalan at numero ng driver para sa ${po} para matanggap namin.`],
      [`Received, thanks`, `Hi! We received ${po}. Thank you!`, 'Natanggap na', `Hi po! Natanggap na namin ang ${po}. Salamat po!`]],
    deliv: sell ? [[`Send the bill`, `Hi ${who}! Here's the bill for ${po}: ${tot}. You can pay by GCash, bank or check. Thank you!`, 'Ipadala ang bill', `Hi po, ${who}! Ito po ang bill para sa ${po}: ${tot}. Pwede pong GCash, bangko o tseke. Salamat po!`],
      [`Check the delivery`, `Hi! Was everything in ${po} complete and in good condition?`, 'Ayos ba ang delivery?', `Hi po! Kumpleto at maayos po ba lahat ng nasa ${po}?`], pay]
      : [[`Ask for the bill`, `Hi ${who}! We received ${po}. Please send the bill so we can pay.`, 'Hingin ang bill', `Hi po, ${who}! Natanggap na namin ang ${po}. Pakisend po ang bill para makabayad kami.`],
      [`Report a problem`, `Hi! Part of ${po} arrived damaged or short. I'll send photos. Can you take it off the bill?`, 'May problema', `Hi po! May sira o kulang sa ${po}. Ise-send ko po ang mga picture. Pwede po bang ibawas sa bill?`],
      [`Thank them`, `Hi! ${po} arrived complete. Thank you!`, 'Salamat', `Hi po! Kumpleto pong dumating ang ${po}. Salamat po!`]],
    said: [[`Thank them`, `Hi ${who}! Thanks for your payment on ${po}. We'll check our bank and confirm today.`, 'Salamat', `Hi po, ${who}! Salamat sa bayad sa ${po}. Iche-check namin sa bangko at kukumpirmahin ngayong araw.`],
      [`Ask for proof`, `Hi! Could you send a photo of the deposit slip or GCash receipt for ${po}? Thank you!`, 'Humingi ng resibo', `Hi po! Pwede po bang i-send ang picture ng deposit slip o GCash receipt para sa ${po}? Salamat po!`],
      [`Remaining balance`, `Hi! We see part of the payment for ${po}. ${bal} is still open. When can you send the rest?`, 'Natitirang balanse', `Hi po! Nakita namin ang bahagi ng bayad sa ${po}. ${bal} pa po ang natitira. Kailan po maipapadala ang iba?`]],
    late: [[`Friendly reminder`, `Hi ${who}! A reminder that ${po} (${bal}) was due on ${due}. Can you send it this week?`, 'Paalala', `Hi po, ${who}! Paalala lang po na ang ${po} (${bal}) ay due noong ${due}. Maipapadala n'yo po ba ngayong linggo?`],
      [`Ask for a date`, `Hi! When can we expect payment for ${po}? Just reply with a date.`, 'Kailan?', `Hi po! Kailan po namin maaasahan ang bayad para sa ${po}? Petsa lang po ang i-reply.`],
      [`Offer two parts`, `Hi! If it helps, you can pay ${po} in two parts: half this week, half next week.`, 'Hatiin sa dalawa', `Hi po! Kung makakatulong, pwede pong hatiin sa dalawa ang bayad sa ${po}: kalahati ngayong linggo, kalahati sa susunod.`]],
    due: [[`Due date`, `Hi ${who}! Just a note: ${po} (${bal}) is due on ${due}.`, 'Due date', `Hi po, ${who}! Paalala lang po: ang ${po} (${bal}) ay due sa ${due}.`], pay,
      [`Thank you`, `Hi! Thank you for ordering ${po}. Tell us if you need anything else.`, 'Salamat', `Hi po! Salamat sa order na ${po}. Sabihan n'yo lang po kami kung may kailangan pa.`]],
    bill: [[`Payment date`, `Hi ${who}! We'll pay ${po} (${bal}) on or before ${due}.`, 'Petsa ng bayad', `Hi po, ${who}! Babayaran namin ang ${po} (${bal}) sa o bago ang ${due}.`],
      [`Payment sent`, `Hi! We sent payment for ${po}. Please confirm when you see it.`, 'Nagbayad na', `Hi po! Naipadala na namin ang bayad para sa ${po}. Pakikumpirma po kapag nakita n'yo.`],
      [`Pay in two parts`, `Hi! Can we pay ${po} in two parts: half now and half in two weeks?`, 'Dalawang hulog', `Hi po! Pwede po bang hatiin sa dalawa ang bayad sa ${po}: kalahati ngayon, kalahati pagkalipas ng dalawang linggo?`]],
    sent: [[`Ask to confirm`, `Hi ${who}! Did you get ${po} (${items})? Please confirm the price and delivery date.`, 'Pakikumpirma', `Hi po, ${who}! Natanggap n'yo po ba ang ${po} (${items})? Pakikumpirma po ang presyo at petsa ng delivery.`],
      [`Need it by`, `Hi! We need ${po} by ${date}. Can you make it?`, 'Kailangan bago', `Hi po! Kailangan namin ang ${po} bago ang ${date}. Kaya po ba?`],
      [`Change something`, `Hi! Small change on ${po}: can we adjust the quantity before you confirm?`, 'May babaguhin', `Hi po! May maliit na pagbabago sa ${po}: pwede po bang ayusin ang dami bago n'yo kumpirmahin?`]],
    paid: sell ? [[`Thank you`, `Thank you for paying ${po}, ${who}! Hope to serve you again soon.`, 'Salamat', `Salamat po sa bayad sa ${po}, ${who}! Sana makapagsilbi ulit kami.`],
      [`Ask for BIR 2307`, `Hi! If you withheld 1% tax on ${po}, please send the BIR 2307 form so we don't pay it twice. Thank you!`, 'Humingi ng 2307', `Hi po! Kung may 1% tax kayong kinaltas sa ${po}, pakisend po ang BIR 2307 form para hindi namin ito mabayaran nang dalawang beses. Salamat po!`],
      [`Offer to reorder`, `Hi! Need more ${prod}? We can deliver this week.`, 'Mag-order ulit?', `Hi po! Kailangan n'yo pa po ba ng ${prod}? Maide-deliver namin ngayong linggo.`]]
      : [[`Thank them`, `Hi ${who}! ${po} is paid. Thank you for the quick delivery!`, 'Salamat', `Hi po, ${who}! Bayad na po ang ${po}. Salamat sa mabilis na delivery!`],
      [`Order again`, `Hi! We'd like to order more ${prod}. Can you send today's price?`, 'Mag-order ulit', `Hi po! Gusto po naming umorder ulit ng ${prod}. Pakisend po ang presyo ngayon.`],
      [`Ask for the receipt`, `Hi! Please send the official receipt for ${po}. Thank you!`, 'Hingin ang resibo', `Hi po! Pakisend po ang official receipt para sa ${po}. Salamat po!`]]
  };
  S.draft = [[`Send the order`, `Hi ${who}! Here's our order ${po} (${items}). Please confirm the price and delivery date.`, 'Ipadala ang order', `Hi po, ${who}! Ito po ang order namin ${po} (${items}). Pakikumpirma po ang presyo at petsa ng delivery.`], S.sent[1], S.sent[2]];
  return S[k] || S.sent;
}
function nf18EnsureConv(id, sell, name){
  try{ const list = sell ? supplierConversations : buyerConversations; if(!list.some(c => c.id === id)) list.push({id, name, initials: String(name).replace(/\b(co|corp|inc)\.?$/i, '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase(), unread: 0, messages: []}); }catch(e){}
}
function nf18MsgFor(poId){
  const o = getPO(poId); if(!o) return;
  const sell = sideOfPo(o) === 'supplier', id = sell ? o.buyerId : o.supplierId;
  const want = {po: poId, conv: id, sell, sent: false, open: false, last: null, undoT: 0};
  Object.assign(NF18M, want);
  try{ closeOrderDetailModal(); }catch(e){}
  try{ setLens(sell ? 'supplier' : 'buyer'); }catch(e){}
  nf18EnsureConv(id, sell, sell ? o.buyerName : o.supplierName);
  go('messages');
  // Messages may open another chat first on a laptop; then this one, with the order beside it
  setTimeout(() => { Object.assign(NF18M, want); try{ selectConversation(id, sell ? 'supplier' : 'buyer'); }catch(e){} nf18Ctx(); }, 320);
}
function nf18CtxOn(){ return !!NF18M.po && typeof activeConvId !== 'undefined' && activeConvId === NF18M.conv && !NF18T.on && !!document.querySelector('#page-messages.active') && !!getPO(NF18M.po); }
function nf18Ctx(){
  const shell = document.querySelector('#page-messages .messages-shell'); if(!shell) return;
  const on = nf18CtxOn();
  shell.classList.toggle('nf18-ctx', on);
  const thread = shell.querySelector('.msg-thread'), comp = shell.querySelector('.msg-composer'), tabs = document.getElementById('msgPoTabs');
  const get = (id, cls, parent, before) => { let e = document.getElementById(id); if(!e && parent){ e = document.createElement(cls === 'aside' ? 'aside' : 'div'); e.id = id; e.className = id.toLowerCase(); if(before) parent.insertBefore(e, before); else parent.appendChild(e); } return e; };
  if(!on){ ['nf18Task', 'nf18Ch', 'nf18Op', 'nf18Card'].forEach(i => { const e = document.getElementById(i); if(e) e.innerHTML = ''; }); return; }
  const o = getPO(NF18M.po), sell = NF18M.sell, r = nf18Row(o), who = sell ? o.buyerName : o.supplierName, T = nf18Tpl(o, sell, r), fil = NF18M.lang === 'fil';
  const card = get('nf18Card', 'div', thread, tabs ? tabs.nextSibling : null), task = get('nf18Task', 'div', thread, card ? card.nextSibling : null);
  const ch = get('nf18Ch', 'div', comp, comp ? comp.querySelector('.composer-row') : null), op = get('nf18Op', 'aside', shell, null);
  const band = r ? r.band : 'blue', stage = typeof mhStageOf === 'function' ? mhStageOf(o) : -1;
  const itemsH = `<div class="nf18-items">${(o.lineItems || []).map(l => `<div><span>${escapeHtml(String(l.qty))} × ${escapeHtml(l.product)}</span><b>${nf18Peso((Number(l.qty) || 0) * (Number(l.unitPrice) || 0))}</b></div>`).join('')}<div class="tot"><span>Total</span><b>${nf18Peso(poTotal(o))}</b></div></div>`;
  const stepsH = `<div class="nf18-steps">${NF18_STEPS.map((s, i) => `<div class="${i < stage ? 'done' : i === stage ? 'now' : ''}"><i></i><span>${s}</span></div>`).join('')}</div>`;
  const alertH = r ? `<div class="nf18-alert b-${band}"><b>${escapeHtml(r.when || '')}</b> ${escapeHtml(r.todo || '')}</div>` : '';
  const actsH = `<div class="nf18-acts">${r && r.btn && r.act !== 'msg' ? `<button type="button" class="btn btn-primary" onclick="nfoOpen('${o.id}')">${escapeHtml(r.btn)}</button>` : ''}<button type="button" class="btn btn-outline" onclick="nfoOpen('${o.id}')">Open the full order</button></div>`;
  // the order, on the right (laptop) or as a card you can open (phone)
  const opH = `<div class="nf18-oph"><small>The order</small><button type="button" class="nf18-x" onclick="nf18CtxClear()" aria-label="Close">${ic18('x')}</button></div>
    <div class="nf18-opt"><b>${escapeHtml(o.poNumber)}</b><span class="nfo-step t-${r ? r.turn : 'them'}"><i></i>${escapeHtml(r ? r.step : '')}</span><span class="nf18-who">${escapeHtml(who)}</span></div>${alertH}${itemsH}<small class="nf18-lbl">Where it is</small>${stepsH}${actsH}`;
  if(op.innerHTML !== opH) op.innerHTML = opH;
  const cardH = `<button type="button" class="nf18-cardh b-${band}" onclick="NF18M.open=!NF18M.open; nf18Ctx()" aria-expanded="${NF18M.open}">${ic18('doc')}<span><b>${escapeHtml(o.poNumber)} · ${nf18Peso(poTotal(o))}</b><small>${escapeHtml(r ? r.when : '')}</small></span><i>${NF18M.open ? '▲' : '▼'}</i></button>${NF18M.open ? `<div class="nf18-cardb">${itemsH}${stepsH}${actsH}</div>` : ''}`;
  if(card.innerHTML !== cardH) card.innerHTML = cardH;
  // why you came, then done
  const nx = nf18Next(o);
  const taskH = NF18M.sent
    ? `<div class="nf18-task done"><small>Done</small><b>Message sent to ${escapeHtml(who)}</b><span>${escapeHtml(o.poNumber)} goes with it, so they know which order you mean.</span>
        <div class="nf18-tacts"><button type="button" class="btn btn-primary btn-sm" onclick="nf18CtxClear(); go('orders')">${ic18('back')}Back to Orders</button>${nx ? `<button type="button" class="btn btn-outline btn-sm" onclick="nf18MsgFor('${nx.o.id}')">Next: ${escapeHtml(nx.who)} · ${escapeHtml(nx.step)}</button>` : ''}${NF18M.undoT ? `<button type="button" class="nf18-undo" onclick="nf18Undo()">Undo</button>` : ''}</div></div>`
    : `<div class="nf18-task"><small>Why you're here</small><b>${escapeHtml(o.poNumber)} · ${escapeHtml(r ? r.step : o.status)}</b><span>${escapeHtml(r ? `${r.when} ${r.todo}` : '')}</span><button type="button" class="nf18-all" onclick="nf18CtxClear()">See all chats</button></div>`;
  if(task.innerHTML !== taskH) task.innerHTML = taskH;
  const chH = NF18M.sent ? '' : `<div class="nf18-chh"><b>Tap Send on the one you like</b><span class="lang-switch nf18-lsw" role="group" aria-label="Message language"><button type="button" class="${fil ? '' : 'active'}" aria-pressed="${!fil}" onclick="NF18M.lang='en'; nf18Ctx()">English</button><button type="button" class="${fil ? 'active' : ''}" aria-pressed="${fil}" onclick="NF18M.lang='fil'; nf18Ctx()">Filipino</button></span></div>
    <div class="nf18-chl">${T.map((t, i) => `<div class="nf18-c"><div><small>${escapeHtml(fil ? t[2] : t[0])}</small><p>${escapeHtml(fil ? t[3] : t[1])}</p></div><div class="nf18-cb"><button type="button" class="nf18-edit" onclick="nf18Edit(${i})">Edit first</button><button type="button" class="btn btn-primary btn-sm" onclick="nf18Send(${i})">Send</button></div></div>`).join('')}</div>`;
  if(ch.innerHTML !== chH) ch.innerHTML = chH;
}
function nf18Next(o){
  try{ const pid = NF18M.conv, rank = {red: 0, yel: 1, blue: 2, green: 3};
    return nfoAll().filter(r => r.pid !== pid && r.turn !== 'done' && r.band !== 'green').sort((a, b) => rank[a.band] - rank[b.band] || String(a.date).localeCompare(String(b.date)))[0] || null; }catch(e){ return null; }
}
function nf18Text(i){ const o = getPO(NF18M.po); const t = nf18Tpl(o, NF18M.sell, nf18Row(o))[i]; return NF18M.lang === 'fil' ? t[3] : t[1]; }
function nf18Edit(i){ const inp = document.getElementById('msgInput'); if(!inp) return; inp.value = nf18Text(i); inp.focus(); try{ inp.setSelectionRange(inp.value.length, inp.value.length); inp.dispatchEvent(new Event('input')); }catch(e){} }
function nf18Send(i){ const inp = document.getElementById('msgInput'); if(!inp) return; inp.value = nf18Text(i); sendMessage();
  clearTimeout(NF18M._u); NF18M.undoT = 1; NF18M._u = setTimeout(() => { NF18M.undoT = 0; nf18Ctx(); }, 6000); nf18Ctx(); }
function nf18Undo(){ try{ const c = getActiveConv(); if(c && NF18M.last && c.messages[c.messages.length - 1] === NF18M.last && !myBusiness){ c.messages.pop(); NF18M.sent = false; NF18M.undoT = 0; NF18M.last = null; renderThread(c); renderConversationList(); showToast('Not sent'); } }catch(e){} nf18Ctx(); }
function nf18CtxClear(){ NF18M.po = null; NF18M.conv = null; nf18Ctx(); }
(function(){
  // messages you type while the order is open carry its number too
  const sm = window.sendMessage;
  if(typeof sm === 'function' && !sm._nf18){
    const w = function(){ const ctx = nf18CtxOn(); let keep = null, conv = null, n = 0;
      if(ctx){ const o = getPO(NF18M.po); conv = getActiveConv(); n = conv ? conv.messages.length : 0; keep = msgPoFilter; if(o && msgPoFilter === 'all') msgPoFilter = o.poNumber; }
      const out = sm.apply(this, arguments);
      if(ctx){ msgPoFilter = keep; if(conv && conv.messages.length > n){ NF18M.sent = true; NF18M.last = conv.messages[conv.messages.length - 1]; } try{ renderThread(getActiveConv()); }catch(e){} nf18Ctx(); }
      return out; };
    w._nf18 = true; window.sendMessage = w; try{ sendMessage = w; }catch(e){}
  }
  const rt = window.renderThread;
  if(typeof rt === 'function' && !rt._nf18){ const w = function(){ const out = rt.apply(this, arguments); try{ nf18Ctx(); }catch(e){} return out; }; w._nf18 = true; window.renderThread = w; try{ renderThread = w; }catch(e){} }
  const sc = window.selectConversation;
  if(typeof sc === 'function' && !sc._nf18m){ const w = function(id){ if(NF18M.po && id !== NF18M.conv){ NF18M.po = null; NF18M.conv = null; } const out = sc.apply(this, arguments); try{ nf18Ctx(); }catch(e){} return out; }; w._nf18 = true; w._nf18m = true; window.selectConversation = w; try{ selectConversation = w; }catch(e){} }
  // Orders: Message / Remind them open the chat with that order beside it
  const nm = window.nfMessage;
  if(typeof nm === 'function' && !nm._nf18){ const w = function(id){ return nf18MsgFor(id); }; w._nf18 = true; window.nfMessage = w; try{ nfMessage = w; }catch(e){} }
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf18m){ const w = function(page){ if(page !== 'messages' && NF18M.po){ NF18M.po = null; NF18M.conv = null; } const out = nav.apply(this, arguments); if(page === 'messages') setTimeout(() => { try{ nf18Ctx(); }catch(e){} }, 0); return out; };
    w._nf18 = true; w._nf18m = true; window.navigate = w; try{ navigate = w; }catch(e){} }
})();
