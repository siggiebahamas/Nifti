
/* ============ BOOKS: the bookkeeping that replaces the notebook ============
   Sales (counter / walk-in / on credit), expenses (with receipt photos), the daily cash count
   (blind for staff), a stock history where every change says who and why, and the owner's view:
   profit, prices, and five red flags. Real accounts keep all of it on the server (expenses,
   downstream_sales, cash_counts, stock_moves); the demo keeps a sample month in this browser.
   Staff record; the owner (and General Manager / Finance) see totals, differences and flags. */
const BK_CATS = [
  {k: 'Electricity', ic: '💡', g: 'Utilities'}, {k: 'Water', ic: '🚰', g: 'Utilities'}, {k: 'Internet & phone', ic: '📶', g: 'Utilities'}, {k: 'Gas (LPG)', ic: '🔥', g: 'Utilities'},
  {k: 'Rent', ic: '🏠', g: 'Rent'}, {k: 'Salaries', ic: '👥', g: 'People', staff: true}, {k: 'Staff advance (vale)', ic: '🤝', g: 'People', staff: true},
  {k: 'Stock bought in cash', ic: '🧺', g: 'Stock', cogs: true}, {k: 'Fuel & transport', ic: '⛽', g: 'Transport'}, {k: 'Delivery & shipping', ic: '🚚', g: 'Transport'},
  {k: 'Supplies', ic: '🧻', g: 'Supplies'}, {k: 'Repairs', ic: '🔧', g: 'Repairs'}, {k: 'Food & meals', ic: '🍚', g: 'Other'},
  {k: 'Taxes & permits', ic: '🏛', g: 'Taxes'}, {k: 'Bank & GCash fees', ic: '🏦', g: 'Fees'}, {k: 'Marketing', ic: '📣', g: 'Marketing'},
  {k: 'Owner took money', ic: '👤', g: 'Owner', drawing: true}, {k: 'Other', ic: '•', g: 'Other'},
  // cash moving in or out of the drawer that isn't spending: kept out of expenses, counted in the cash count
  {k: 'Cash to bank', ic: '🏦', g: 'Transfer', transfer: 'out'}, {k: 'Owner put in cash', ic: '💵', g: 'Transfer', transfer: 'in'},
];
const BK_PAID = [['cash', 'Cash drawer'], ['gcash', 'GCash'], ['maya', 'Maya'], ['bank', 'Bank'], ['card', 'Card'], ['owner', "Owner's own money"], ['credit', 'Not paid yet']];
const BK_SALE_PAY = [['cash', 'Cash'], ['gcash', 'GCash'], ['maya', 'Maya'], ['bank', 'Bank'], ['card', 'Card'], ['credit', 'Utang (pay later)']];
const BK_MOVE = {opening: 'Starting stock', received: 'Received', sold: 'Sold', delivered: 'Delivered', bad: 'Bad stock', count: 'Count difference', adjust: 'Changed by hand',
  returned_in: 'Returned to us', returned_out: 'Returned to supplier', used: 'Used', transfer: 'Moved'};
const BK_BAD_REASONS = ['Expired', 'Damaged', 'Spoiled', 'Lost or missing', 'Used for the store', 'Given free'];
const BK_DENOMS = [1000, 500, 200, 100, 50, 20];
const BK = {loaded: false, loading: null, expenses: [], counts: [], countDays: [], moves: [], sales: [], menu: [], settings: {}};
function bkCat(k){ return BK_CATS.find(c => c.k === k) || BK_CATS[BK_CATS.length - 1]; }
function bkMonth(d){ return String(d || APP_TODAY).slice(0, 7); }
function bkPrevMonth(m){ const [y, mo] = String(m).slice(0, 7).split('-').map(Number); return mo === 1 ? (y - 1) + '-12' : y + '-' + String(mo - 1).padStart(2, '0'); } // plain arithmetic: toISOString shifts the day in UTC+8
function bkMonthLabel(m){ return new Date(m + '-01T00:00:00').toLocaleDateString('en-PH', {month: 'long', year: 'numeric'}); }
function bkDayLabel(d){ const n = daysBetween(d, APP_TODAY); return n === 0 ? 'Today' : n === 1 ? 'Yesterday' : new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'}); }
function bkPeso(n){ return fmtPHP(Math.round((Number(n) || 0) * 100) / 100); }
function bkMe(){
  if(myBusiness && myTeamMember) return myTeamMember.name || (myTeamMember.email || '').split('@')[0] || 'You';
  const m = (typeof teamMe === 'function') && teamMe();
  return m ? String(m.name).replace(/ \(You\)$/, '') : 'You';
}
function booksCanSeeTotals(){ return getEffectiveRoles().some(r => ['Owner', 'General Manager', 'Finance'].includes(r)); }
function bkUid(){ return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'bk' + Date.now() + Math.random().toString(36).slice(2, 8); }
function bkSettings(){
  const s = Object.assign({cash_alert: 100, change_fund: 1000}, (myBusiness && myBusiness.books_settings) || BK.settings || {});
  s.cash_alert = Number(s.cash_alert) || 0; s.change_fund = Number(s.change_fund) || 0;
  return s;
}
async function bkSaveSettings(patch){
  const next = Object.assign({}, bkSettings(), patch);
  if(myBusiness){
    const { error } = await sb.from('businesses').update({books_settings: next}).eq('id', myBusiness.id);
    if(error){ showToast("Couldn't save: " + error.message, 'error'); return false; }
    myBusiness.books_settings = next;
  } else { BK.settings = next; bkSaveDemo(); }
  return true;
}

/* ---- demo month: believable numbers for Dela Cruz Hardware ---- */
const BK_DEMO_KEY = 'nifti-books-demo-v2';
const BK_DEMO_COST = {'Galvanized Wire 12ga': [430, 520], 'Portland Cement 40kg': [184, 228], 'Steel Rebar 12mm': [50, 64], 'Welding Rods 3.2mm': [88, 120],
  'Fresh Tomatoes (Grade A)': [45, 60], 'Whole Chicken (Fresh)': [165, 210], 'Rebar 10mm': [51, 62], 'Rebar 12mm': [50, 64], 'Rebar 16mm': [55, 70], 'Structural I-Beams': [2950, 3650],
  'Wire Mesh Panels': [165, 210], 'Angle Bars': [66, 85], 'Welding Plates 6mm': [380, 480]};
function bkSaveDemo(){ if(myBusiness) return; try{ localStorage.setItem(BK_DEMO_KEY, JSON.stringify({expenses: BK.expenses, counts: BK.counts, moves: BK.moves, sales: BK.sales, menu: BK.menu, settings: BK.settings})); }catch(e){} }
function bkSeedDemo(){
  if(!inventoryData.some(i => i.name === 'Welding Plates 6mm')) inventoryData.push({code: 'SKU-1060', name: 'Welding Plates 6mm', warehouse: 'main', onHand: 26, rop: 10, maxLevel: 60, lot: null, exp: null, status: 'healthy', supplier: 'Metro Steel Co.', daysLeft: null, leadTime: 5});
  if(!inventoryData.some(i => i.name === 'Rebar 16mm')) inventoryData.push({code: 'SKU-1016', name: 'Rebar 16mm', warehouse: 'main', onHand: 180, rop: 60, maxLevel: 400, lot: null, exp: null, status: 'healthy', supplier: 'Metro Steel Co.', daysLeft: null, leadTime: 5});
  inventoryData.forEach(i => { const c = BK_DEMO_COST[i.name]; if(c){ if(i.unitCost == null) i.unitCost = c[0]; if(i.sellPrice == null) i.sellPrice = c[1]; } });
  try{ const saved = JSON.parse(localStorage.getItem(BK_DEMO_KEY) || 'null'); if(saved && saved.expenses){ Object.assign(BK, saved); BK.loaded = true; return; } }catch(e){}
  const d = n => addDaysIso(APP_TODAY, -n), m = bkMonth(APP_TODAY);
  const ex = (n, category, amount, paidFrom, vendor, by, extra) => Object.assign({id: bkUid(), date: d(n), category, amount, paidFrom, vendor: vendor || '', note: '', staff: '', repeat: false, by, at: d(n) + 'T17:00:00'}, extra || {});
  BK.expenses = [
    ex(1, 'Electricity', 8940, 'bank', 'Meralco', 'Dela Cruz', {repeat: true}), ex(4, 'Water', 820, 'gcash', 'Maynilad', 'Dela Cruz', {repeat: true}),
    ex(6, 'Internet & phone', 1299, 'bank', 'PLDT', 'Dela Cruz', {repeat: true}), ex(20, 'Rent', 18000, 'bank', 'Bldg. owner', 'Dela Cruz', {repeat: true}),
    ex(1, 'Repairs', 3200, 'cash', 'Mang Ben welding', 'Rico', {status: 'submitted', note: 'gate hinge'}), ex(10, 'Salaries', 7000, 'cash', '', 'Dela Cruz', {staff: 'Rico'}), ex(10, 'Salaries', 7000, 'cash', '', 'Dela Cruz', {staff: 'Liza'}), ex(3, 'Staff advance (vale)', 1500, 'cash', '', 'Liza', {staff: 'Rico'}),
    ex(0, 'Fuel & transport', 1200, 'cash', 'Petron', 'Rico'), ex(2, 'Delivery & shipping', 850, 'cash', 'Lalamove', 'Liza'), ex(5, 'Supplies', 640, 'cash', 'National Book Store', 'Liza'),
    ex(8, 'Repairs', 2300, 'cash', 'Mang Tonyo', 'Dela Cruz'), ex(1, 'Food & meals', 480, 'cash', '', 'Rico'), ex(12, 'Bank & GCash fees', 150, 'gcash', 'GCash', 'Dela Cruz'),
    ex(2, 'Owner took money', 5000, 'cash', '', 'Dela Cruz'),
  ];
  // last 3 months of the regular bills, so "unusual" has something to compare with
  [[1, 5900, 790, 1299, 18000], [2, 6150, 840, 1299, 18000], [3, 5720, 760, 1299, 18000]].forEach(([k, el, wa, net, rent]) => {
    BK.expenses.push(ex(30 * k + 1, 'Electricity', el, 'bank', 'Meralco', 'Dela Cruz', {repeat: true}), ex(30 * k + 4, 'Water', wa, 'gcash', 'Maynilad', 'Dela Cruz', {repeat: true}),
      ex(30 * k + 6, 'Internet & phone', net, 'bank', 'PLDT', 'Dela Cruz', {repeat: true}), ex(30 * k + 20, 'Rent', rent, 'bank', 'Bldg. owner', 'Dela Cruz', {repeat: true}),
      ex(30 * k + 10, 'Salaries', 14000, 'cash', '', 'Dela Cruz', {staff: 'Rico & Liza'}));
  });
  // counter sales: walk-ins and a few on utang
  const sale = (n, lines, paidWith, by, customer, extra) => {
    const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    return Object.assign({id: bkUid(), date: d(n), at: d(n) + 'T' + String(9 + (n * 7) % 9).padStart(2, '0') + ':15:00', customer: customer || 'Walk-in', lines, total, paidWith,
      payments: paidWith === 'credit' ? [] : [{method: paidWith, amount: total, date: d(n)}], by, note: ''}, extra || {});
  };
  const L = (product, qty, unitPrice) => ({product, qty, unitPrice, unitCost: (BK_DEMO_COST[product] || [0])[0]});
  BK.sales = [
    sale(0, [L('Portland Cement 40kg', 10, 228)], 'cash', 'Liza'), sale(0, [L('Galvanized Wire 12ga', 2, 520), L('Welding Rods 3.2mm', 2, 120)], 'gcash', 'Liza'),
    sale(0, [L('Steel Rebar 12mm', 20, 64)], 'cash', 'Liza'), sale(0, [L('Angle Bars', 10, 78)], 'cash', 'Rico', null, {note: 'suki discount'}),
    sale(1, [L('Portland Cement 40kg', 25, 228)], 'credit', 'Liza', 'Mang Bert Construction'), sale(1, [L('Rebar 10mm', 30, 48)], 'cash', 'Rico'),
    sale(2, [L('Wire Mesh Panels', 4, 210)], 'gcash', 'Rico'), sale(3, [L('Structural I-Beams', 1, 3650)], 'bank', 'Dela Cruz'),
    sale(4, [L('Portland Cement 40kg', 15, 228), L('Galvanized Wire 12ga', 1, 520)], 'cash', 'Liza'), sale(6, [L('Welding Rods 3.2mm', 5, 120)], 'credit', 'Liza', 'Aling Nena Store'),
    sale(9, [L('Steel Rebar 12mm', 12, 64)], 'cash', 'Liza'), sale(13, [L('Portland Cement 40kg', 40, 222)], 'bank', 'Dela Cruz'),
    sale(15, [L('Rebar 16mm', 40, 70), L('Angle Bars', 12, 85)], 'cash', 'Liza'), sale(18, [L('Portland Cement 40kg', 60, 225)], 'bank', 'Dela Cruz'),
    // contractors who come in for big lots and pay by bank transfer
    sale(7, [L('Portland Cement 40kg', 200, 225)], 'bank', 'Dela Cruz', 'JRC Builders'), sale(11, [L('Steel Rebar 12mm', 800, 63)], 'bank', 'Dela Cruz', 'Bayview Construction'),
    sale(16, [L('Structural I-Beams', 10, 3650)], 'bank', 'Dela Cruz', 'JRC Builders'), sale(19, [L('Portland Cement 40kg', 150, 225), L('Galvanized Wire 12ga', 10, 520)], 'bank', 'Dela Cruz', 'Bayview Construction'),
    sale(21, [L('Rebar 16mm', 300, 70), L('Angle Bars', 40, 85)], 'gcash', 'Rico', 'Mang Bert Construction'),
  ];
  // the customer orders that were delivered get their invoices (one partly paid, one overdue, one still not billed)
  if(!window._demoOverdueSeeded){
    window._demoOverdueSeeded = true;
    const delivered = getSupplierPOs().filter(p => p.status === 'delivered' && !p.invoice).sort((a, b) => String(a.createdDate).localeCompare(String(b.createdDate)));
    const dd = p => (p.deliveryConfirmation && p.deliveryConfirmation.confirmedDate) || p.createdDate;
    if(delivered[0]){ const p = delivered[0]; p.status = 'invoiced'; p.invoice = {number: 'INV-2026-0418', issuedDate: dd(p), dueDate: addDaysIso(dd(p), 30), status: 'partial', statedTotal: poTotal(p),
      payments: [{id: 'demo-pay-1', method: 'bank_transfer', amount: 10000, date: addDaysIso(dd(p), 3), confirmStatus: 'confirmed', reference: 'BDO 77120'}]}; }
    if(delivered[1]){ const p = delivered[1]; p.status = 'invoiced'; p.invoice = {number: 'INV-2026-0421', issuedDate: dd(p) < APP_TODAY ? dd(p) : addDaysIso(APP_TODAY, -4), dueDate: addDaysIso(APP_TODAY, -2), status: 'unpaid', statedTotal: poTotal(p), payments: []}; }
  }
  // the stock trail: deliveries in, sales out, a bad bag, and a count that came up short
  const mv = (n, item, qty, kind, reason, by, ref) => ({id: bkUid(), item, qty, kind, reason, ref: ref || '', date: d(n), at: d(n) + 'T16:00:00', by, unitCost: (BK_DEMO_COST[item] || [0])[0]});
  BK.moves = [
    mv(9, 'Portland Cement 40kg', 100, 'received', 'Received from Cebu Aggregates', 'Rico', 'PO-2026-0839'), mv(4, 'Portland Cement 40kg', -15, 'sold', 'Counter sale', 'Liza'),
    mv(1, 'Portland Cement 40kg', -25, 'sold', 'Counter sale (utang)', 'Liza'), mv(0, 'Portland Cement 40kg', -10, 'sold', 'Counter sale', 'Liza'),
    mv(2, 'Portland Cement 40kg', -3, 'bad', 'Damaged · bags torn in the rain', 'Rico'), mv(0, 'Portland Cement 40kg', -6, 'count', 'Spot count: system 18, shelf 12', 'Liza'),
    mv(7, 'Welding Rods 3.2mm', -4, 'count', 'Spot count: system 314, shelf 310', 'Rico'), mv(3, 'Fresh Tomatoes (Grade A)', -6, 'bad', 'Spoiled', 'Liza'),
    mv(1, 'Galvanized Wire 12ga', 30, 'received', 'Received from Metro Steel Co.', 'Rico', 'PO-2026-0798'), mv(0, 'Galvanized Wire 12ga', -6, 'sold', 'Counter sale', 'Liza'),
    mv(5, 'Angle Bars', -2, 'adjust', 'Changed by hand', 'Rico'),
  ];
  // the cash counts: most days fine, one short, one not counted yet (today)
  const cc = (n, expected, counted, by, note) => ({id: bkUid(), day: d(n), drawer: 'Main', expected: {cash: expected}, counted: {cash: counted}, difference: counted - expected, note: note || '', by, at: d(n) + 'T20:10:00'});
  BK.counts = [cc(1, 12980, 12980, 'Liza'), cc(2, 8450, 7650, 'Rico', 'busy, many customers'), cc(3, 4120, 4140, 'Liza'), cc(4, 9620, 9620, 'Liza'), cc(5, 3880, 3880, 'Rico'), cc(6, 5410, 5390, 'Liza')];
  BK.settings = {cash_alert: 100, change_fund: 1000};
  BK.loaded = true;
  bkSaveDemo();
}

/* ---- real accounts: load from the server ---- */
function bkRowExpense(r){ return {id: r.id, date: r.spent_on, category: r.category, amount: Number(r.amount), paidFrom: r.paid_from, vendor: r.vendor || '', note: r.note || '', staff: r.staff_name || '',
  receipt: r.receipt_path || '', repeat: !!r.repeat_monthly, by: r.created_by_name || '', byId: r.created_by, at: r.created_at, status: r.status || 'approved', approvedBy: r.approved_by_name || '', reviewNote: r.review_note || '', branch: r.branch || null, editedBy: r.edited_by_name || '', deletedAt: r.deleted_at, deletedBy: r.deleted_by_name || '', deleteReason: r.delete_reason || ''}; }
function bkRowSale(r){ return {id: r.id, date: r.sale_date, at: r.created_at, customer: r.customer_name || 'Walk-in', customerId: r.customer_id, lines: r.line_items || [], total: Number(r.total) || 0,
  paidWith: r.paid_with || '', payments: r.payments || [], branch: r.branch || null, by: r.created_by_name || '', note: r.note || '', voidedAt: r.voided_at, voidedBy: r.voided_by_name || '', voidReason: r.void_reason || ''}; }
function bkRowMove(r){ return {id: r.id, itemId: r.item_id, item: r.item_name, qty: Number(r.qty), kind: r.kind, unitCost: r.unit_cost != null ? Number(r.unit_cost) : null, reason: r.reason || '', ref: r.ref || '',
  photo: r.photo_path || '', date: r.moved_on, at: r.created_at, by: r.created_by_name || ''}; }
function bkRowMenu(r){ return {id: r.id, name: r.name, price: Number(r.price) || 0, recipe: Array.isArray(r.recipe) ? r.recipe : [], active: r.active !== false}; }
function bkRowCount(r){ return {id: r.id, day: r.count_day, drawer: r.drawer, expected: r.expected || {}, counted: r.counted || {}, difference: Number(r.difference), note: r.note || '', by: r.closed_by_name || '',
  at: r.closed_at, reopenedAt: r.reopened_at, reviewedAt: r.reviewed_at, reviewedBy: r.reviewed_by_name || '', reviewNote: r.review_note || ''}; }
async function bkLoad(force){
  if(!myBusiness){ if(!BK.loaded) bkSeedDemo(); return; }
  if(BK.loaded && !force) return;
  if(BK.loading) return BK.loading;
  const since = addDaysIso(APP_TODAY, -130);
  BK.loading = (async () => {
    const [ex, sa, mv, ct, cd, mn] = await Promise.all([
      sb.from('expenses').select('*').eq('business_id', myBusiness.id).gte('spent_on', since).order('spent_on', {ascending: false}).limit(2000),
      sb.from('downstream_sales').select('*').eq('business_id', myBusiness.id).gte('sale_date', since).order('created_at', {ascending: false}).limit(3000),
      sb.from('stock_moves').select('*').eq('business_id', myBusiness.id).gte('moved_on', since).order('created_at', {ascending: false}).limit(3000),
      booksCanSeeTotals() ? sb.from('cash_counts').select('*').eq('business_id', myBusiness.id).gte('count_day', since).order('count_day', {ascending: false}) : Promise.resolve({data: []}),
      sb.rpc('my_cash_count_days', {p_days: 14}),
      sb.from('menu_items').select('*').eq('business_id', myBusiness.id).order('name').limit(500),
    ]);
    BK.expenses = (ex.data || []).map(bkRowExpense);
    BK.sales = (sa.data || []).map(bkRowSale);
    BK.moves = (mv.data || []).map(bkRowMove);
    BK.counts = (ct.data || []).map(bkRowCount);
    BK.countDays = (cd.data || []).map(r => ({day: r.count_day, drawer: r.drawer, by: r.closed_by_name, reopened: r.reopened}));
    BK.menu = (mn.data || []).map(bkRowMenu);
    if(typeof bkMergeQueued === 'function') bkMergeQueued();
    BK.loaded = true; BK.loading = null;
    if(typeof bkFlushQueue === 'function') setTimeout(bkFlushQueue, 1500);
  })().catch(e => { BK.loading = null; console.warn('Books load failed', e); });
  return BK.loading;
}
function bkRefreshViews(){
  const page = (document.querySelector('.app-page.active') || {}).id || '';
  const map = {'page-money': renderMoneyPage, 'page-expenses': renderExpensesPage, 'page-cashcount': renderCashCountPage, 'page-profit': renderProfitPage, 'page-sales': renderSalesBooksPage, 'page-dashboard': renderOneHome, 'page-inventory': renderStockCheckPanel};
  if(map[page]) map[page]();
}

/* ---- stock: every change gets a reason, and sales/deliveries take it out of the one list ---- */
// o = {kind, reason, ref, unitCost, photo, qty}. qty (signed) is what moved; the server works it out
// itself for real accounts (inventory trigger), the demo writes its own history line with it.
function stockLabel(item, o){
  if(!item || !o) return;
  item._lastMove = {kind: o.kind, reason: String(o.reason || '').slice(0, 200), ref: o.ref ? String(o.ref).slice(0, 80) : undefined, photo: o.photo || undefined, at: new Date().toISOString()};
  if(o.kind === 'received' && Number(o.unitCost) > 0) item.unitCost = Number(o.unitCost);
  if(Number(o.qty)){ // shown right away; a real account's list is refreshed from the server's own history
    BK.moves.unshift({id: bkUid(), item: item.name, qty: Number(o.qty), kind: o.kind, reason: o.reason || '', ref: o.ref || '', photo: o.photo || '', date: APP_TODAY,
      at: new Date().toISOString(), by: bkMe(), unitCost: item.unitCost != null ? Number(item.unitCost) : null});
    bkSaveDemo();
  }
}
function bkAfterStockChange(touched){
  if(!touched.length) return;
  syncInventoryToSupabase(touched); scheduleNiftiSave();
  if(document.getElementById('invTableBody')) renderInventoryTable();
  if(document.getElementById('stockCheckPanel')) renderStockCheckPanel();
}
function stockOut(lines, kind, reason, ref){
  const touched = [];
  (lines || []).forEach(li => {
    let left = Number(li.qty) || 0; if(left <= 0) return;
    const name = String(li.product || '').toLowerCase();
    // this branch's own location first, then wherever holds the most
    const wh = typeof bkHereWarehouse === 'function' ? bkHereWarehouse() : null;
    const cands = inventoryData.filter(i => String(i.name).toLowerCase() === name).sort((a, b) => (wh ? (b.warehouse === wh) - (a.warehouse === wh) : 0) || b.onHand - a.onHand);
    cands.forEach((item, idx) => {
      if(left <= 0) return;
      // take from the location holding the most; the last one absorbs any remainder (stock can go negative: that's a count to do)
      const take = idx === cands.length - 1 ? left : Math.min(left, Math.max(0, Number(item.onHand) || 0));
      if(!take) return;
      item.onHand = Number(item.onHand) - take; left -= take;
      if(item.batches && item.batches.length){ let r = take; item.batches.sort((a, b) => String(a.exp).localeCompare(String(b.exp))).forEach(b => { const t = Math.min(b.qty, r); b.qty -= t; r -= t; }); item.batches = item.batches.filter(b => b.qty > 0); }
      if(typeof updateInvStatusFromStock === 'function') updateInvStatusFromStock(item);
      stockLabel(item, {kind, reason, ref, qty: -take});
      touched.push(item);
    });
  });
  bkAfterStockChange(touched);
  return touched;
}
function stockIn(lines, kind, reason, ref){
  const touched = [];
  (lines || []).forEach(li => {
    const item = inventoryData.find(i => String(i.name).toLowerCase() === String(li.product || '').toLowerCase());
    if(!item || !(Number(li.qty) > 0)) return;
    item.onHand = Number(item.onHand) + Number(li.qty);
    if(typeof updateInvStatusFromStock === 'function') updateInvStatusFromStock(item);
    stockLabel(item, {kind, reason, ref, qty: Number(li.qty)});
    touched.push(item);
  });
  bkAfterStockChange(touched);
  return touched;
}
// menu items (a plate of sisig, a bundle) cost what their ingredients cost
function bkMenuFind(name){ const n = String(name || '').trim().toLowerCase(); return n ? (BK.menu || []).find(m => m.active && m.name.toLowerCase() === n) : null; }
function bkMenuCost(m){ return Math.round((m.recipe || []).reduce((a, r) => a + (Number(r.qty) || 0) * bkStockCost(r.item), 0) * 100) / 100; }
function bkItemCost(name){ const m = bkMenuFind(name); return m ? bkMenuCost(m) : bkStockCost(name); }
function bkStockCost(name){
  const i = inventoryData.find(x => String(x.name).toLowerCase() === String(name).toLowerCase());
  if(i && Number(i.unitCost) > 0) return Number(i.unitCost);
  return typeof computeCostBasis === 'function' ? (Number(computeCostBasis(name)) || 0) : 0;
}
function bkItemPrice(name){
  const mi = bkMenuFind(name); if(mi) return mi.price;
  const i = inventoryData.find(x => String(x.name).toLowerCase() === String(name).toLowerCase());
  if(i && Number(i.sellPrice) > 0) return Number(i.sellPrice);
  const c = (typeof myCatalog !== 'undefined' ? myCatalog : []).find(x => String(x.product).toLowerCase() === String(name).toLowerCase());
  return c ? Number(c.price) || 0 : 0;
}
function bkPromised(){
  const out = {};
  getSupplierPOs().filter(o => ['sent', 'confirmed', 'preparing', 'shipped', 'in_customs'].includes(o.status)).forEach(o => (o.lineItems || []).forEach(li => {
    const k = String(li.product).toLowerCase(); out[k] = (out[k] || 0) + (Number(li.qty) || 0);
  }));
  return out;
}

/* ---- the numbers ---- */
function bkPayDate(p){ return String(p.date || p.reportedAt || '').slice(0, 10); }
// Money that came in from customer orders on a day (confirmed only), by method.
function bkCustomerPaymentsOn(day, endDay){
  const rows = [];
  getSupplierPOs().forEach(po => {
    const inv = (po.invoice && po.invoice.payments) || [];
    const ids = new Set(inv.map(p => p.id).filter(Boolean));
    inv.concat((po.depositPayments || []).filter(p => !p.id || !ids.has(p.id))).forEach(p => {
      if(!paymentIsCounted(p)) return;
      const d = bkPayDate(p); if(!d || d < day || d > (endDay || day)) return;
      rows.push({po, method: p.method, amount: Number(p.amount) || 0, date: d});
    });
  });
  return rows;
}
function bkSupplierPaymentsOn(day, endDay){
  const rows = [];
  getBuyerPOs().forEach(po => {
    const inv = (po.invoice && po.invoice.payments) || [];
    const ids = new Set(inv.map(p => p.id).filter(Boolean));
    inv.concat((po.depositPayments || []).filter(p => !p.id || !ids.has(p.id))).forEach(p => {
      if((p.confirmStatus || 'confirmed') === 'rejected') return;
      const d = bkPayDate(p); if(!d || d < day || d > (endDay || day)) return;
      rows.push({po, method: p.method, amount: Number(p.amount) || 0, date: d});
    });
  });
  return rows;
}
function bkLiveSales(){ return BK.sales.filter(s => !s.voidedAt); }
function bkSalePaid(s){ return (s.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0); }
function bkSaleBalance(s){ return Math.max(0, Math.round((Number(s.total) - bkSalePaid(s)) * 100) / 100); }
function bkMethodKey(m){ m = String(m || '').toLowerCase(); return m === 'cash' ? 'cash' : m === 'gcash' ? 'gcash' : m === 'maya' ? 'maya' : 'other'; }
// What should be in the drawer at the end of a day.
function cashExpected(day){
  const s = bkSettings();
  const parts = {fund: s.change_fund, sales: 0, collections: 0, expenses: 0, suppliers: 0, owner: 0, bank: 0, ownerIn: 0, gcash: 0, n_sales: 0};
  bkLiveSales().forEach(sale => (sale.payments || []).forEach(p => {
    if(bkPayDate(p) !== day) return;
    const k = bkMethodKey(p.method);
    if(k === 'cash'){ parts.sales += Number(p.amount) || 0; parts.n_sales++; } else if(k === 'gcash' || k === 'maya') parts.gcash += Number(p.amount) || 0;
  }));
  bkCustomerPaymentsOn(day).forEach(r => { const k = bkMethodKey(r.method); if(k === 'cash') parts.collections += r.amount; else if(k === 'gcash' || k === 'maya') parts.gcash += r.amount; });
  BK.expenses.filter(e => !e.deletedAt && e.date === day && e.paidFrom === 'cash').forEach(e => {
    const c = bkCat(e.category);
    if(c.transfer === 'out') parts.bank += e.amount; else if(c.transfer === 'in') parts.ownerIn += e.amount; else if(c.drawing) parts.owner += e.amount; else parts.expenses += e.amount;
  });
  bkSupplierPaymentsOn(day).forEach(r => { if(bkMethodKey(r.method) === 'cash') parts.suppliers += r.amount; });
  const cash = parts.fund + parts.sales + parts.collections + parts.ownerIn - parts.expenses - parts.suppliers - parts.owner - parts.bank;
  return {cash: Math.round(cash * 100) / 100, gcash: Math.round(parts.gcash * 100) / 100, parts};
}
function bkMonthSales(m){
  const counter = bkLiveSales().filter(s => bkMonth(s.date) === m);
  const counterTotal = counter.reduce((a, s) => a + (Number(s.total) || 0), 0);
  const counterCost = counter.reduce((a, s) => a + (s.lines || []).reduce((b, l) => b + (Number(l.qty) || 0) * (Number(l.unitCost) || bkItemCost(l.product)), 0), 0);
  const orders = getSupplierPOs().filter(o => !['draft', 'cancelled', 'quote', 'sent', 'countered'].includes(o.status) && !(o.invoice && o.invoice.opening) && bkMonth(o.createdDate) === m);
  const orderTotal = orders.reduce((a, o) => a + poTotal(o), 0);
  const orderCost = orders.reduce((a, o) => a + (o.lineItems || []).reduce((b, l) => b + (Number(l.qty) || 0) * bkItemCost(l.product), 0), 0);
  const missingCost = counter.concat([]).some(s => (s.lines || []).some(l => !(Number(l.unitCost) || bkItemCost(l.product)))) || orders.some(o => (o.lineItems || []).some(l => !bkItemCost(l.product)));
  return {counter, counterTotal, counterCost, orders, orderTotal, orderCost, total: counterTotal + orderTotal, cost: counterCost + orderCost, missingCost};
}
function bkMonthExpenses(m){
  const list = BK.expenses.filter(e => !e.deletedAt && bkMonth(e.date) === m && (e.status || 'approved') === 'approved');
  const byCat = {};
  let total = 0, cogs = 0, drawings = 0;
  list.forEach(e => { const c = bkCat(e.category); if(c.transfer) return; if(c.drawing){ drawings += e.amount; return; } if(c.cogs){ cogs += e.amount; return; } total += e.amount; byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  return {list, byCat, total, cogs, drawings};
}
function bkPnl(m){
  const s = bkMonthSales(m), e = bkMonthExpenses(m);
  const cost = s.cost + e.cogs;
  const gross = s.total - cost;
  return {sales: s.total, counter: s.counterTotal, orders: s.orderTotal, cost, gross, expenses: e.total, byCat: e.byCat, net: gross - e.total, drawings: e.drawings, missingCost: s.missingCost};
}
function bkStockLoss(m){
  let missing = 0, bad = 0; const byItem = {};
  BK.moves.filter(x => bkMonth(x.date) === m).forEach(x => {
    const cost = (x.unitCost != null ? x.unitCost : bkItemCost(x.item)) || 0;
    if(x.kind === 'count' && x.qty < 0){ missing += -x.qty * cost; byItem[x.item] = (byItem[x.item] || 0) + -x.qty * cost; }
    if(x.kind === 'bad') bad += -x.qty * cost;
  });
  return {missing, bad, byItem, hand: BK.moves.filter(x => bkMonth(x.date) === m && x.kind === 'adjust').length};
}
function bkBelowCost(m){
  const rows = [];
  bkLiveSales().filter(s => bkMonth(s.date) === m).forEach(s => (s.lines || []).forEach(l => {
    const cost = Number(l.unitCost) || bkItemCost(l.product), list = Number(l.listPrice) || bkItemPrice(l.product), price = Number(l.unitPrice) || 0;
    if(cost && price < cost) rows.push({kind: 'below', s, l, lost: (cost - price) * l.qty, by: s.by});
    else if(list && price < list) rows.push({kind: 'discount', s, l, lost: (list - price) * l.qty, by: s.by});
  }));
  getSupplierPOs().filter(o => bkMonth(o.createdDate) === m && !['draft', 'cancelled'].includes(o.status)).forEach(o => (o.lineItems || []).forEach(l => {
    const cost = bkItemCost(l.product), price = Number(l.unitPrice) || 0;
    if(cost && price && price < cost) rows.push({kind: 'below', po: o, l, lost: (cost - price) * l.qty, by: o.buyerName});
  }));
  return rows;
}
function bkUnusualExpenses(m){
  const out = [];
  const months = [bkPrevMonth(m)]; months.push(bkPrevMonth(months[0])); months.push(bkPrevMonth(months[1]));
  const cur = bkMonthExpenses(m).byCat;
  Object.keys(cur).forEach(k => {
    const hist = months.map(mm => bkMonthExpenses(mm).byCat[k] || 0).filter(v => v > 0);
    if(hist.length < 2) return;
    const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
    if(avg > 0 && cur[k] > avg * 1.3 && cur[k] - avg >= 500) out.push({cat: k, now: cur[k], avg, pct: Math.round((cur[k] / avg - 1) * 100)});
  });
  // regular monthly bills not entered yet this month (only nags after the usual day has passed)
  const missing = [];
  if(m === bkMonth(APP_TODAY)){
    const seen = {};
    BK.expenses.filter(e => !e.deletedAt && e.repeat && bkMonth(e.date) === bkPrevMonth(m)).forEach(e => { seen[e.category] = e; });
    Object.values(seen).forEach(e => {
      if(BK.expenses.some(x => !x.deletedAt && x.category === e.category && bkMonth(x.date) === m)) return;
      const day = Number(String(e.date).slice(8, 10));
      if(Number(APP_TODAY.slice(8, 10)) > day + 3) missing.push({cat: e.category, usual: e.amount, day});
    });
  }
  return {spikes: out.sort((a, b) => (b.now - b.avg) - (a.now - a.avg)), missing};
}
function bkCashSummary(m){
  const list = BK.counts.filter(c => bkMonth(c.day) === m);
  const short = list.filter(c => c.difference < 0).reduce((a, c) => a - c.difference, 0);
  const over = list.filter(c => c.difference > 0).reduce((a, c) => a + c.difference, 0);
  const today = BK.counts.find(c => c.day === APP_TODAY) || BK.countDays.find(c => c.day === APP_TODAY);
  const salesDays = new Set(bkLiveSales().filter(s => bkMonth(s.date) === m && s.date < APP_TODAY).map(s => s.date));
  const counted = new Set(list.map(c => c.day));
  const notCounted = [...salesDays].filter(d => !counted.has(d) && daysBetween(d, APP_TODAY) <= 14);
  return {list, short, over, today, notCounted, worst: list.filter(c => c.difference < 0).sort((a, b) => a.difference - b.difference)[0]};
}
// The five red flags an owner checks every morning.
function bkFlags(m){
  m = m || bkMonth(APP_TODAY);
  const lim = bkSettings().cash_alert || 1;
  const cash = bkCashSummary(m), loss = bkStockLoss(m), below = bkBelowCost(m), unusual = bkUnusualExpenses(m);
  const owed = unpaidInvoicesFor('supplier'), owe = unpaidInvoicesFor('buyer');
  const owedLate = hmSum(owed.filter(r => r.daysOverdue > 0), r => r.balance) + bkLiveSales().filter(s => bkSaleBalance(s) > 0 && daysBetween(s.date, APP_TODAY) > 30).reduce((a, s) => a + bkSaleBalance(s), 0);
  const oweLate = hmSum(owe.filter(r => r.daysOverdue > 0), r => r.balance);
  const lostBelow = below.reduce((a, r) => a + r.lost, 0), nBelow = below.filter(r => r.kind === 'below').length;
  const lvl = (bad, warn) => bad ? 'red' : warn ? 'amber' : 'green';
  return [
    {k: 'cash', t: 'Cash count', lvl: lvl(cash.short >= lim, cash.notCounted.length > 0 || !cash.today),
      v: cash.short >= 1 ? bkPeso(cash.short) + ' short' : 'No shortage',
      s: cash.worst && cash.short >= 1 ? `Worst: ${bkDayLabel(cash.worst.day)}, ${bkPeso(-cash.worst.difference)} short · counted by ${cash.worst.by || 'staff'}` : cash.notCounted.length ? `${cash.notCounted.length} day${cash.notCounted.length > 1 ? 's' : ''} with sales not counted` : cash.today ? 'Today is counted' : 'Today not counted yet',
      a: "go('cashcount')"},
    {k: 'stock', t: 'Missing & bad stock', lvl: lvl(loss.missing >= 1, loss.bad >= 1 || loss.hand > 0),
      v: loss.missing + loss.bad >= 1 ? bkPeso(loss.missing + loss.bad) : 'Nothing missing',
      s: loss.missing >= 1 ? `${bkPeso(loss.missing)} missing in counts · ${bkPeso(loss.bad)} bad stock` : loss.bad >= 1 ? `${bkPeso(loss.bad)} written off as bad stock` : loss.hand ? `${loss.hand} change${loss.hand > 1 ? 's' : ''} made by hand` : 'Counts match the shelf',
      a: "go('inventory'); setTimeout(()=>openStockSheet('history'), 80)"},
    {k: 'price', t: 'Selling below cost', lvl: lvl(nBelow > 0, lostBelow >= 1),
      v: lostBelow >= 1 ? bkPeso(lostBelow) + ' given away' : 'Prices OK',
      s: nBelow ? `${nBelow} sale${nBelow > 1 ? 's' : ''} below cost` + (below.length > nBelow ? ` · ${below.length - nBelow} discounts` : '') : below.length ? `${below.length} discount${below.length > 1 ? 's' : ''} under your price list` : 'Every sale at or above your price',
      a: "go('profit')"},
    {k: 'spend', t: 'Unusual expenses', lvl: lvl(unusual.spikes.some(x => x.pct >= 50), unusual.spikes.length > 0 || unusual.missing.length > 0),
      v: unusual.spikes.length ? `${unusual.spikes[0].cat} +${unusual.spikes[0].pct}%` : 'Normal',
      s: unusual.spikes.length ? `${bkPeso(unusual.spikes[0].now)} this month vs usual ${bkPeso(unusual.spikes[0].avg)}` : unusual.missing.length ? `${unusual.missing[0].cat} not entered yet this month` : 'Bills look like the usual months',
      a: "go('expenses')"},
    {k: 'late', t: 'Overdue money', lvl: lvl(owedLate >= 1 && owedLate >= oweLate, owedLate >= 1 || oweLate >= 1),
      v: owedLate >= 1 ? bkPeso(owedLate) + ' late to you' : oweLate >= 1 ? bkPeso(oweLate) + ' you owe' : 'Nothing late',
      s: owedLate >= 1 && oweLate >= 1 ? `You also owe suppliers ${bkPeso(oweLate)} overdue` : owedLate >= 1 ? 'Customers past their due date' : oweLate >= 1 ? 'Supplier bills past due' : 'Everyone is on time',
      a: owedLate >= 1 ? "pickLens('collections','supplier')" : "pickLens('collections','buyer')"},
  ];
}
