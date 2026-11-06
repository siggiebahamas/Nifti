/* ===== Round 7: a calm, curated demo =====
   Demo only (no signed-in business). Each section shows 5 to 7 samples, one per situation
   (needs you, waiting, done, late…), and no section is left empty. Seeds never pile up across visits. */
const NF_DEMO_KEEP = {
  po: ['po7', 'po_q1', 'po_q3', 'po11', 'po_q5', 'po8', 'po12', // customer orders: to confirm, waiting for OK x2, preparing, delivered (bill it), invoice overdue, paid
       'po4', 'po_q6', 'po5', 'po2', 'po13', 'po14', 'po3'],     // orders to suppliers: draft, their quote, counter-offer, confirmed, on the way (late), bill to pay, done
  poSeeded: /^(po\d+|po_q\d+|po_consol\d+)$/,
  conv: ['metro', 'cebu', 'balintawak', 'quezon', 'buy_bayview', 'buy_corazon', 'buy_riverside'],
  convSeeded: ['metro', 'cebu', 'balintawak', 'delacruz', 'northline', 'irongate', 'quezon', 'marikina', 'buy_bayview', 'buy_corazon', 'buy_riverside', 'buy_cavite', 'buy_manilabay'],
  suppliers: ['metro', 'cebu', 'balintawak', 'quezon', 'marikina', 'northline'],
  supSeeded: ['metro', 'cebu', 'balintawak', 'delacruz', 'northline', 'quezon', 'irongate', 'marikina', 'guangzhou'],
  inv: ['Galvanized Wire 12ga@main', 'Portland Cement 40kg', 'Fresh Tomatoes (Grade A)', 'Angle Bars', 'Steel Rebar 12mm', 'Welding Rods 3.2mm', 'Structural I-Beams'],
  invSeeded: ['Galvanized Wire 12ga', 'Portland Cement 40kg', 'Fresh Tomatoes (Grade A)', 'Steel Rebar 12mm', 'Whole Chicken (Fresh)', 'Welding Rods 3.2mm', 'Rebar 10mm', 'Rebar 12mm', 'Structural I-Beams', 'Wire Mesh Panels', 'Angle Bars', 'Welding Plates 6mm', 'Rebar 16mm'],
};
function nfIsDemo(){ return typeof myBusiness === 'undefined' || !myBusiness; }
function nfDay(n){ return addDaysIso(APP_TODAY, n); }
function nfDedupe(arr, key){ if(!Array.isArray(arr)) return; const seen = new Set(); for(let i = 0; i < arr.length; i++){ const k = key(arr[i]); if(k == null) continue; if(seen.has(k)){ arr.splice(i, 1); i--; } else seen.add(k); } }
function nfTrim(arr, isSeeded, keep){ if(!Array.isArray(arr)) return; for(let i = arr.length - 1; i >= 0; i--){ const x = arr[i]; if(isSeeded(x) && !keep(x)) arr.splice(i, 1); } }

function nfDemoCurate(){
  if(!nfIsDemo()) return;
  // 1. nothing is ever added twice
  nfDedupe(purchaseOrders, p => p && p.id);
  nfDedupe(buyerConversations, c => c && c.id); nfDedupe(supplierConversations, c => c && c.id);
  nfDedupe(suppliersData, s => s && s.id); nfDedupe(buyersData, s => s && s.id);
  nfDedupe(inventoryData, i => i && (i.code || i.name) + '@' + i.warehouse);
  // 2. one sample per situation
  const K = NF_DEMO_KEEP;
  nfTrim(purchaseOrders, p => K.poSeeded.test(String(p.id)), p => K.po.includes(p.id));
  nfTrim(buyerConversations, c => K.convSeeded.includes(c.id), c => K.conv.includes(c.id));
  nfTrim(supplierConversations, c => K.convSeeded.includes(c.id), c => K.conv.includes(c.id));
  nfTrim(suppliersData, s => K.supSeeded.includes(s.id), s => K.suppliers.includes(s.id));
  nfTrim(inventoryData, i => K.invSeeded.includes(i.name), i => K.inv.includes(i.name) || K.inv.includes(i.name + '@' + i.warehouse));
}

// counter books: this month shows 7 clear expenses instead of 15 (older months stay for comparisons)
function nfDemoBooks(){
  if(!nfIsDemo() || !BK || !Array.isArray(BK.expenses) || BK._nfCurated) return;
  const m = bkMonth(APP_TODAY);
  const drop = e => bkMonth(e.date) === m && (['Water', 'Internet & phone', 'Delivery & shipping', 'Supplies', 'Food & meals', 'Bank & GCash fees', 'Salaries'].includes(e.category) || (e.category === 'Repairs' && e.vendor === 'Mang Tonyo'));
  BK.expenses = BK.expenses.filter(e => !drop(e));
  // five earlier months of sales and regular bills, so Reports can show a real trend
  const uid = () => (typeof bkUid === 'function' ? bkUid() : 'nf' + Math.random().toString(36).slice(2));
  const cost = p => (BK_DEMO_COST[p] || [0])[0];
  const sale = (n, customer, lines) => { const date = addDaysIso(APP_TODAY, -n), total = lines.reduce((x, l) => x + l[1] * l[2], 0);
    return {id: uid(), date, at: date + 'T10:15:00', customer, lines: lines.map(l => ({product: l[0], qty: l[1], unitPrice: l[2], unitCost: cost(l[0])})), total, paidWith: 'bank', payments: [{method: 'bank', amount: total, date}], by: 'Dela Cruz', note: ''}; };
  const exp = (n, category, amount, paidFrom, vendor) => ({id: uid(), date: addDaysIso(APP_TODAY, -n), category, amount, paidFrom, vendor, note: '', staff: '', repeat: true, by: 'Dela Cruz', at: addDaysIso(APP_TODAY, -n) + 'T17:00:00'});
  if(!BK.sales.some(x => daysBetween(x.date, APP_TODAY) > 40)){
    [[1, 1.0], [2, 0.86], [3, 0.92], [4, 0.74], [5, 0.8]].forEach(([k, f]) => {
      BK.sales.push(sale(30 * k + 3, 'Bayview Construction Co.', [['Portland Cement 40kg', Math.round(560 * f), 225]]), sale(30 * k + 11, 'JRC Builders', [['Steel Rebar 12mm', Math.round(1600 * f), 63]]),
        sale(30 * k + 19, 'Riverside Builders Corp', [['Structural I-Beams', Math.round(22 * f), 3650]]));
      if(k >= 4) BK.expenses.push(exp(30 * k + 1, 'Electricity', 5600, 'bank', 'Meralco'), exp(30 * k + 20, 'Rent', 18000, 'bank', 'Bldg. owner'), exp(30 * k + 10, 'Salaries', 14000, 'cash', ''));
    });
  }
  BK._nfCurated = true;
  try{ bkSaveDemo(); }catch(e){}
}

// payroll: one paid run (with payslips) and one draft for this period
function nfDemoPayroll(){
  if(!nfIsDemo() || typeof PR === 'undefined' || PR.runs.length) return;
  const mk = (id, from, to, paid) => Object.assign({id, business_id: 'demo', status: paid ? 'paid' : 'draft', period_from: from, period_to: to, created_by_name: 'Dela Cruz'}, paid ? {paid_on: paid, paid_from: 'cash', paid_by_name: 'Dela Cruz'} : {});
  const ln = (run, i, name, rate, days, extra, vale, contrib) => { const x = {id: run + ':' + i, run_id: run, staff_name: name, basis: 'day', rate, days, extra, vale_deduct: vale, contrib_employee: contrib, contrib_employer: 0, other_deduct: 0, note: null}; const c = prCalc(x); x.gross = c.gross; x.net = c.net; return x; };
  PR.runs.push(mk('PRdemo1', nfDay(-25), nfDay(-11), nfDay(-10)), mk('PRdemo2', nfDay(-10), nfDay(3), null));
  PR.lines.push(ln('PRdemo1', 0, 'Liza Santos', 650, 13, 300, 0, 450), ln('PRdemo1', 1, 'Rico Reyes', 600, 12, 0, 0, 420),
    ln('PRdemo2', 0, 'Liza Santos', 650, 11, 0, 0, 450), ln('PRdemo2', 1, 'Rico Reyes', 600, 11, 0, 500, 420));
  try{ prSaveDemo(); }catch(e){}
}

// money that is still with a person, a bank deposit, and checks in every state
function nfDemoMoney(){
  if(!nfIsDemo() || window._nfMoneySeeded) return;
  window._demoChequesSeeded = true; // the old seeder piled up checks on every visit
  const inv = id => { const po = getPO(id); return po && po.invoice ? po : null; };
  if(!inv('po8')) return; window._nfMoneySeeded = true;
  const pay = (po, p) => { if(!po) return; const list = paymentListFor(po, 'invoice'); if(!list.some(x => x.id === p.id)) list.push(p); };
  const po8 = inv('po8'), po14 = inv('po14');
  pay(po8, {id: 'nf-cash-1', method: 'cash', amount: 4000, date: nfDay(-1), confirmStatus: 'confirmed', recordedBy: 'Rico', reference: ''});
  pay(po8, {id: 'nf-chq-1', method: 'check', amount: 6000, reference: '004512', bank: 'BDO', checkDate: nfDay(0), date: nfDay(-3), confirmStatus: 'pending', checkStatus: 'pending', submittedBy: 'supplier'});
  pay(po8, {id: 'nf-chq-2', method: 'check', amount: 5000, reference: '118834', bank: 'Metrobank', checkDate: nfDay(6), date: nfDay(-3), confirmStatus: 'pending', checkStatus: 'pending', submittedBy: 'supplier'});
  pay(po8, {id: 'nf-chq-3', method: 'check', amount: 3500, reference: '220190', bank: 'BPI', checkDate: nfDay(-2), date: nfDay(-6), depositedAt: nfDay(-1), confirmStatus: 'pending', checkStatus: 'pending', submittedBy: 'supplier'});
  pay(po8, {id: 'nf-chq-4', method: 'check', amount: 3004, reference: '771002', bank: 'Security Bank', checkDate: nfDay(-9), date: nfDay(-12), confirmStatus: 'rejected', checkStatus: 'bounced', rejectReason: 'Not enough money in their account', submittedBy: 'supplier'});
  pay(po14, {id: 'nf-chq-5', method: 'check', amount: 15400, reference: '000781', bank: 'BPI', checkDate: nfDay(2), date: nfDay(-1), confirmStatus: 'pending', checkStatus: 'pending', submittedBy: 'buyer'});
  const dep = window._demoDeposits || (window._demoDeposits = []);
  if(!dep.some(d => d.id === 'nf-dep-1')) dep.push({id: 'nf-dep-1', amount: 12500, bank: 'BDO', deposited_on: nfDay(-3), reference: 'DS-20418', items: [], note: null, created_by: 'Liza'});
}

// team: a few tasks in every state, a short chat, and recent activity
function nfDemoTeam(){
  if(!nfIsDemo() || teamTasks.length || window._nfTeamSeeded) return; window._nfTeamSeeded = true;
  const tm = (teamMembers || []).concat(supplierTeamMembers || []);
  const id = i => (tm[i] || tm[0] || {}).id, nm = i => (tm[i] || tm[0] || {}).name || 'Dela Cruz';
  const t = (k, title, who, due, status, done) => ({id: 'nf-task-' + k, title, assignedTo: id(who), createdById: id(0), createdBy: nm(0), createdAt: nfDay(-2), dueDate: due, status, acknowledgedAt: nfDay(-1), doneAt: done || null, bizRole: currentAppRole});
  teamTasks.push(t(1, 'Call Riverside about the overdue invoice', 0, nfDay(0), 'open'), t(2, 'Count Portland Cement on the shelf', 1, nfDay(-1), 'open'),
    t(3, 'Load Bayview order on the van', 2, nfDay(1), 'open'), t(4, 'Deposit BDO check 004512', 1, nfDay(0), 'done', nfDay(0)));
  const msg = (k, who, text, time) => ({id: 'nf-chat-' + k, authorId: id(who), author: nm(who), text, date: nfDay(0), time, createdAt: nfDay(0) + 'T0' + k + ':00:00Z', bizRole: currentAppRole});
  teamChatMessages.push(msg(1, 1, 'Metro Steel says the rebar ships tomorrow.', '8:10 AM'), msg(2, 2, 'Van is ready for the Bayview delivery.', '8:25 AM'), msg(3, 0, 'Thanks! Collect the Riverside check on the way back.', '8:31 AM'));
  const act = (k, who, action, time, kind) => ({id: 'nf-act-' + k, actor: nm(who), action, date: nfDay(0), time, kind, bizRole: 'both'});
  teamActivityLog.push(act(1, 1, 'counted the cash drawer', '7:55 AM', 'cash'), act(2, 2, 'marked PO-2026-0820 as ready to ship', '9:10 AM', 'order'),
    act(3, 0, 'approved a ₱1,200 fuel expense', '9:40 AM', 'expense'), act(4, 1, 'recorded 2 bad bags of cement', 'Yesterday', 'stock'));
}

// tools: a route for today, a credit, a price change already sent
function nfDemoTools(){
  if(!nfIsDemo() || window._nfToolsSeeded) return; window._nfToolsSeeded = true;
  const tm = (teamMembers || []); const drv = tm[2] || tm[1] || tm[0] || {};
  if(typeof demoRoutes !== 'undefined' && !demoRoutes.length){
    const stop = (k, seq, status, buyer, name, addr, deliver, collect, amt, extra) => Object.assign({id: 'nf-st-' + k, seq, status, buyer_business_id: buyer, buyer_name: name, address: addr, phone: '', deliver_po_ids: deliver, collect_po_ids: collect,
      items: deliver.flatMap(id => ((getPO(id) || {}).lineItems || []).map(li => ({product: li.product, qty: li.qty, unit: li.unit || ''}))), amount_due: amt, note: ''}, extra || {});
    demoRoutes.push({id: 'nf-rt-1', route_date: APP_TODAY, driver_member_id: drv.id, driver_name: drv.name || 'Mark Santos', vehicle: 'L300 van', status: 'on_road', mine: true, stops: [
      stop(1, 1, 'done', 'buy_manilabay', 'Manila Bay Scaffolding Co.', 'Navotas warehouse', ['po11'], [], 0, {done_at: APP_TODAY + 'T01:40:00Z'}),
      stop(2, 2, 'pending', 'buy_riverside', 'Riverside Builders Corp', 'Pasig site, gate 2', [], ['po8'], 6000),
      stop(3, 3, 'failed', 'buy_corazon', 'Corazon Welding Shop', 'Cainta, near the market', ['po7'], [], 0, {fail_reason: 'Closed'})]});
  }
  if(typeof demoCreditMemos !== 'undefined' && !demoCreditMemos.length){
    demoCreditMemos.push({id: 'nf-cm-1', buyer_business_id: 'buy_corazon', supplier_business_id: ME_SUPPLIER, number: 'CM-00002', amount: 1200, remaining: 1200, reason: '3 bent angle bars returned', status: 'open', created_at: nfDay(-2) + 'T03:00:00Z'},
      {id: 'nf-cm-2', buyer_business_id: 'buy_bayview', supplier_business_id: ME_SUPPLIER, number: 'CM-00001', amount: 850, remaining: 0, reason: 'Short by 1 bundle of rebar', status: 'applied', created_at: nfDay(-20) + 'T03:00:00Z'});
  }
  const p12 = getPO('po12'); if(p12 && !p12.rma) p12.rma = {reason: 'Damaged goods', desc: '2 I-beams dented on delivery', filedDate: nfDay(-12), status: 'credited'};
  if(typeof demoPriceChanges !== 'undefined' && !demoPriceChanges.length){
    demoPriceChanges.push({id: 'nf-pc-1', product: 'Portland Cement 40kg', old_price: 228, new_price: 236, effective_date: nfDay(5), applied_at: null},
      {id: 'nf-pc-2', product: 'Steel Rebar 12mm', old_price: 66, new_price: 64, effective_date: nfDay(-6), applied_at: nfDay(-6) + 'T00:00:00Z'});
  }
}

function nfDemoAll(){ try{ nfDemoCurate(); nfDemoMoney(); nfDemoTeam(); nfDemoTools(); nfDemoPayroll(); }catch(e){ console.warn('demo', e); } }
// To check: one example of each kind, at most 7
(function(){ const f = window.issuesAll; if(typeof f !== 'function' || f._nf) return;
  const w = function(){ const r = f.apply(this, arguments); if(!nfIsDemo() || !Array.isArray(r)) return r; const seen = new Set();
    return r.filter(i => { const k = i.kind || i.title; if(seen.has(k)) return false; seen.add(k); return true; }).slice(0, 7); };
  w._nf = true; window.issuesAll = w; })();
(function(){
  if(typeof window === 'undefined') return;
  const wrap = (name, after) => { const f = window[name]; if(typeof f !== 'function' || f._nf) return; const w = function(){ const r = f.apply(this, arguments); const done = () => { try{ after(); }catch(e){} }; if(r && typeof r.then === 'function') return r.then(v => { done(); return v; }); done(); return r; }; w._nf = true; window[name] = w; };
  const hook = () => {
    wrap('qtSeedDemo', nfDemoCurate); wrap('bkSeedDemo', () => { nfDemoBooks(); nfDemoMoney(); }); wrap('prLoad', nfDemoPayroll);
    wrap('seedDemoCheques', nfDemoMoney);
    nfDemoAll();
    try{ const a = document.querySelector('#view-app .app-page.active'); if(a) navigate(a.id.slice(5)); }catch(e){}
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(hook, 0)); else setTimeout(hook, 0);
})();
