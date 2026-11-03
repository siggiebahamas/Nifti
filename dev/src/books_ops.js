
/* ============ BOOKS: branches, approvals, issues to check, month-end close, payroll ============ */

/* ---- branches: each branch has its own drawer, and can take stock from its own location ---- */
function bkBranches(){ const b = bkSettings().branches; return Array.isArray(b) ? b.filter(x => x && x.name) : []; }
function bkBranchKey(){ return 'nifti-branch-' + (myBusiness ? myBusiness.id : 'demo'); }
function bkHereBranch(){
  const br = bkBranches(); if(!br.length) return null;
  let v = null; try{ v = localStorage.getItem(bkBranchKey()); }catch(e){}
  return br.some(b => b.name === v) ? v : br[0].name;
}
function bkSetHereBranch(name){ try{ localStorage.setItem(bkBranchKey(), name); }catch(e){} CC = null; bkRefreshViews(); showToast('This phone is now at ' + name + '.', 'success'); }
function bkHereWarehouse(){ const b = bkBranches().find(x => x.name === bkHereBranch()); return b ? b.wh || null : null; }
function bkBranchPicker(){
  const br = bkBranches(); if(br.length < 2) return '';
  return `<label class="bk-branch">This phone is at <select onchange="bkSetHereBranch(this.value)" aria-label="Branch">${br.map(b => `<option ${b.name === bkHereBranch() ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}</select></label>`;
}
// records with no branch belong to the first one (the main branch)
function bkInBranch(rec, name){ const br = bkBranches(); if(br.length < 2 || !name) return true; return (rec.branch || br[0].name) === name; }
function bkBranchSettingsHtml(){
  const br = bkBranches(), whs = [...new Set(inventoryData.map(i => i.warehouse).filter(Boolean))];
  const whName = w => (typeof whLabel !== 'undefined' && whLabel[w]) || w;
  return `<section class="panel-card"><div class="panel-head"><h2>Branches and drawers</h2></div>
    <div class="bk-note">One business, several places? Each branch gets its own drawer to count and its own stock location. Leave it empty if you have one store.</div>
    ${br.map((b, i) => `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(b.name)}</b><small>Stock from: ${escapeHtml(whName(b.wh) || 'any location')}${i === 0 ? ' · main branch' : ''}</small></div><span class="bk-row-a"><button class="sl-link bk-dim" onclick="bkRemoveBranch(${i})">Remove</button></span></div>`).join('')}
    <div class="row-2"><div class="field"><label>New branch name</label><input id="brName" maxlength="40" placeholder="${br.length ? 'e.g. Taytay branch' : 'e.g. Main store'}"></div>
      <div class="field"><label>Takes stock from</label><select id="brWh"><option value="">Any location</option>${whs.map(w => `<option value="${escapeHtml(w)}">${escapeHtml(whName(w))}</option>`).join('')}</select></div></div>
    <button class="btn btn-outline" onclick="bkAddBranch()">+ Add branch</button></section>`;
}
async function bkAddBranch(){
  const name = String((document.getElementById('brName') || {}).value || '').trim().slice(0, 40), wh = (document.getElementById('brWh') || {}).value || null;
  if(!name){ markFieldInvalid('brName', 'Give the branch a name.'); return; }
  const br = bkBranches(); if(br.some(b => b.name.toLowerCase() === name.toLowerCase())){ markFieldInvalid('brName', 'You already have that branch.'); return; }
  if(br.length >= 20){ showToast('Up to 20 branches.'); return; }
  const next = br.length ? br.concat([{name, wh}]) : [{name, wh}];
  if(await bkSaveSettings({branches: next})){ showToast(next.length === 1 ? `${name} saved. Add a second branch to split drawers.` : `${name} added. Each phone picks its branch at the top of Sales and Cash count.`, 'success'); renderCashCountPage(); }
}
async function bkRemoveBranch(i){
  const br = bkBranches(); if(!br[i]) return;
  if(!confirm(`Remove ${br[i].name}? Past sales and counts keep their branch name.`)) return;
  br.splice(i, 1); if(await bkSaveSettings({branches: br})) renderCashCountPage();
}

/* ---- the drawer of this branch only ---- */
const _cashExpectedAll = cashExpected;
cashExpected = function(day, drawer){
  const br = bkBranches();
  if(br.length < 2) return _cashExpectedAll(day);
  drawer = drawer || bkHereBranch();
  const main = br[0].name === drawer;
  const s = bkSettings();
  const parts = {fund: s.change_fund, sales: 0, collections: 0, expenses: 0, suppliers: 0, owner: 0, bank: 0, ownerIn: 0, gcash: 0, n_sales: 0};
  bkLiveSales().filter(x => bkInBranch(x, drawer)).forEach(sale => (sale.payments || []).forEach(p => {
    if(bkPayDate(p) !== day) return; const k = bkMethodKey(p.method);
    if(k === 'cash'){ parts.sales += Number(p.amount) || 0; parts.n_sales++; } else if(k === 'gcash' || k === 'maya') parts.gcash += Number(p.amount) || 0;
  }));
  if(main){
    bkCustomerPaymentsOn(day).forEach(r => { const k = bkMethodKey(r.method); if(k === 'cash') parts.collections += r.amount; else if(k === 'gcash' || k === 'maya') parts.gcash += r.amount; });
    bkSupplierPaymentsOn(day).forEach(r => { if(bkMethodKey(r.method) === 'cash') parts.suppliers += r.amount; });
  }
  BK.expenses.filter(e => !e.deletedAt && e.date === day && e.paidFrom === 'cash' && bkInBranch(e, drawer)).forEach(e => {
    const c = bkCat(e.category);
    if(c.transfer === 'out') parts.bank += e.amount; else if(c.transfer === 'in') parts.ownerIn += e.amount; else if(c.drawing) parts.owner += e.amount; else parts.expenses += e.amount;
  });
  ((typeof depositsCache !== 'undefined' && depositsCache) || []).filter(d => String(d.deposited_on) === day && bkInBranch(d, drawer) && !(d.items && d.items.length)).forEach(d => { parts.bank += Number(d.amount) || 0; });
  const cash = parts.fund + parts.sales + parts.collections + parts.ownerIn - parts.expenses - parts.suppliers - parts.owner - parts.bank;
  return {cash: Math.round(cash * 100) / 100, gcash: Math.round(parts.gcash * 100) / 100, parts, drawer};
};

/* ---- a closed month can't be changed (the server refuses too) ---- */
function bkClosedMsg(day){ return typeof lgMonthLocked === 'function' && lgMonthLocked(day) ? 'That month is closed. Ask the owner to reopen it on Month-end close.' : ''; }

/* ---- approvals: big expenses from staff wait for the owner's OK ---- */
function bkApproveOver(){ const v = Number(bkSettings().approve_over); return v > 0 ? v : 2000; }
function bkExpStatusTag(e){
  if(e.status === 'submitted') return '<span class="bk-tag">waiting for OK</span> ';
  if(e.status === 'needs_correction') return `<span class="bk-tag bad">sent back${e.reviewNote ? ': ' + escapeHtml(e.reviewNote) : ''}</span> `;
  return '';
}
async function bkReviewExpense(id, ok){
  const e = BK.expenses.find(x => x.id === id); if(!e) return;
  let note = null;
  if(!ok){ note = prompt('What needs fixing? (they get this message)', 'Please attach the receipt'); if(note === null) return; if(String(note).trim().length < 2){ showToast('Say what needs fixing.'); return; } }
  if(myBusiness){ const { error } = await sb.rpc('review_expense', {p_id: id, p_ok: ok, p_note: note}); if(error){ showToast(error.message, 'error'); return; } await bkLoad(true); }
  else { e.status = ok ? 'approved' : 'needs_correction'; e.reviewNote = note || ''; if(ok){ e.approvedBy = bkMe(); } bkSaveDemo(); }
  if(typeof lgInvalidate === 'function') lgInvalidate();
  showToast(ok ? 'Approved. It\'s in the books now.' : 'Sent back with your note.', 'success'); renderExpensesPage();
}
function bkApprovalsHtml(){
  if(!booksCanSeeTotals()) return '';
  const list = BK.expenses.filter(e => !e.deletedAt && e.status === 'submitted').sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const s = bkSettings();
  return `${list.length ? `<section class="panel-card bk-list bk-approve"><div class="panel-head"><h2>Waiting for your OK</h2><span class="bk-dim">${list.length}</span></div>
      ${list.map(e => `<div class="bk-row"><span class="bk-ic" aria-hidden="true">${bkCat(e.category).ic}</span><div class="bk-row-m"><b>${escapeHtml(e.category)}${e.vendor ? ' · ' + escapeHtml(e.vendor) : ''}</b><small>${bkDayLabel(e.date)} · by ${escapeHtml(e.by || '—')}${e.note ? ' · ' + escapeHtml(e.note) : ''}${e.receipt ? '' : ' · <span class="bk-bad">no receipt</span>'}</small></div>
        <span class="bk-amt">${bkPeso(e.amount)}</span><span class="bk-row-a">${e.receipt ? `<button class="sl-link" onclick="bkShowPhoto(${JSON.stringify(e.receipt).replace(/"/g, '&quot;')})">Receipt</button>` : ''}<button class="sl-link" onclick="bkReviewExpense('${e.id}', true)">Approve</button><button class="sl-link bk-dim" onclick="bkReviewExpense('${e.id}', false)">Send back</button></span></div>`).join('')}</section>` : ''}
    <details class="panel-card lg-det"><summary>Approval rules</summary>
      <div class="row-2"><div class="field"><label>Staff expenses need your OK from</label><div class="ob-peso"><span>₱</span><input inputmode="decimal" value="${bkApproveOver()}" onchange="bkSaveSettings({approve_over: Number(this.value)||2000})"></div></div>
      <div class="field"><label class="bk-check"><input type="checkbox" ${s.dual_approval ? 'checked' : ''} onchange="bkSaveSettings({dual_approval: this.checked})"> Big expenses from managers and finance also need someone else's OK</label></div></div>
      <div class="bk-note">Waiting expenses are not in the books until approved. The money for cash ones still left the drawer, so the cash count includes them.</div></details>`;
}

/* ---- issues to check: explainable rules, each with evidence, a next step and a decision trail ---- */
let ISS = {decisions: null, show: 'open'};
async function issLoadDecisions(){
  if(ISS.decisions) return;
  if(myBusiness && booksCanSeeTotals()){ const { data } = await sb.from('issue_decisions').select('*').eq('business_id', myBusiness.id); ISS.decisions = {}; (data || []).forEach(d => { ISS.decisions[d.fingerprint] = d; }); }
  else { try{ ISS.decisions = JSON.parse(localStorage.getItem('nifti-issues-demo-v1') || '{}'); }catch(e){ ISS.decisions = {}; } }
}
function issueRules(){
  const out = [], s = bkSettings(), lim = s.cash_alert || 100, recOver = Number(s.receipt_over) || 1000, since = addDaysIso(APP_TODAY, -60);
  const add = x => out.push(x);
  BK.counts.filter(c => c.day >= since && !c.reopenedAt && c.difference <= -lim).forEach(c => add({fp: 'cash:' + c.id, kind: 'Cash short', lvl: 'red', date: c.day, amount: -c.difference,
    title: `Drawer ${bkPeso(-c.difference)} short on ${bkDayLabel(c.day)}`, what: `${c.drawer || 'Main'} drawer: expected ${bkPeso(c.expected.cash)}, counted ${bkPeso(c.counted.cash)} by ${c.by || 'staff'}.`,
    why: 'Cash that should be there isn\'t. It could be a missed expense, a wrong sale, or money taken.', next: 'Ask who counted, check that day\'s sales and expenses. This is a possible issue, not proof of wrongdoing.',
    ev: [['Open the count', `go('cashcount'); setTimeout(()=>{ ccStart('${c.day}'); renderCashCountPage(); }, 80)`]], basis: 'Counted by staff'}));
  bkCashSummary(bkMonth(APP_TODAY)).notCounted.concat(bkCashSummary(bkPrevMonth(bkMonth(APP_TODAY))).notCounted).filter((d, i, a) => a.indexOf(d) === i).forEach(d => add({fp: 'nocount:' + d, kind: 'Not counted', lvl: 'amber', date: d,
    title: `No cash count on ${bkDayLabel(d)}`, what: 'There were sales that day, but nobody counted the drawer.', why: 'A shortage on an uncounted day can never be found.', next: 'Count the drawer at closing every day.',
    ev: [['Open Cash count', `go('cashcount')`]], basis: 'Sales recorded'}));
  const noRec = {};
  BK.expenses.filter(e => !e.deletedAt && e.date >= since && (e.status || 'approved') === 'approved' && !e.receipt && e.amount >= recOver && !bkCat(e.category).drawing && !bkCat(e.category).transfer).forEach(e => { (noRec[bkMonth(e.date)] = noRec[bkMonth(e.date)] || []).push(e); });
  Object.entries(noRec).forEach(([mm, xs]) => { const tot = xs.reduce((a, e) => a + e.amount, 0); add({fp: 'receipts:' + mm + ':' + xs.map(e => e.id).sort().join(',').length + ':' + xs.length, kind: 'Missing receipts', lvl: 'amber', date: xs[0].date, amount: tot,
    title: `${xs.length} expense${xs.length > 1 ? 's' : ''} in ${bkMonthLabel(mm)} over ${bkPeso(recOver)} without a receipt`, what: xs.slice(0, 5).map(e => `${e.category} ${bkPeso(e.amount)} (${bkDayLabel(e.date)})`).join(', ') + (xs.length > 5 ? ` and ${xs.length - 5} more` : '') + '.',
    why: 'Without receipts you can\'t check what was paid, and your accountant can\'t use them for taxes.', next: 'Ask for the receipts and attach a photo to each. Bills paid online can use a screenshot.',
    ev: [['Open expenses', `bkMonthSel='${mm}'; go('expenses')`]], basis: 'Approved expenses'}); });
  const exps = BK.expenses.filter(e => !e.deletedAt && e.date >= since && !bkCat(e.category).transfer);
  exps.forEach((a, i) => exps.slice(i + 1).forEach(b => { if(a.amount === b.amount && a.category === b.category && (a.vendor || '') === (b.vendor || '') && Math.abs(daysBetween(a.date, b.date)) <= 3)
    add({fp: 'dup:' + [a.id, b.id].sort().join('/'), kind: 'Possible duplicate', lvl: 'amber', date: b.date, amount: b.amount, title: `${a.category} ${bkPeso(a.amount)} entered twice?`,
      what: `${bkDayLabel(a.date)} by ${a.by || '—'} and ${bkDayLabel(b.date)} by ${b.by || '—'}, same amount${a.vendor ? ' and payee' : ''}.`, why: 'Paying or recording the same bill twice makes costs look higher, or means real money was paid twice.',
      next: 'If it\'s the same bill, remove one. If both are real, mark this as fine.', ev: [['Open expenses', `go('expenses')`]], basis: 'Same amount within 3 days'}); }));
  [bkMonth(APP_TODAY), bkPrevMonth(bkMonth(APP_TODAY))].forEach(m => bkBelowCost(m).filter(r => r.kind === 'below').forEach(r => add({fp: 'below:' + (r.s ? r.s.id : r.po.id) + ':' + r.l.product, kind: 'Below cost', lvl: 'red', date: r.s ? r.s.date : r.po.createdDate, amount: r.lost,
    title: `${r.l.product} sold below cost`, what: `${r.l.qty} sold at ${bkPeso(r.l.unitPrice)} each; cost is ${bkPeso(Number(r.l.unitCost) || bkItemCost(r.l.product))}. Lost ${bkPeso(r.lost)}.`, why: 'Every one sold this way loses money.',
    next: 'Check the price list and who made the sale. If the cost is wrong, fix it on Profit & prices.', ev: [[r.s ? 'Open the sale' : 'Open the order', r.s ? `bkSalesDay='${r.s.date}'; go('sales')` : `setLens('supplier'); openOrderDetailModal('${r.po.id}', true)`]], basis: r.s ? 'Counter sale' : 'Customer order'})));
  BK.moves.filter(x => x.date >= since && (x.kind === 'count' || x.kind === 'adjust') && x.qty < 0).forEach(x => { const v = -x.qty * (Number(x.unitCost) || bkItemCost(x.item)); if(v < 500) return;
    add({fp: 'stock:' + x.id, kind: x.kind === 'count' ? 'Missing stock' : 'Changed by hand', lvl: x.kind === 'count' ? 'red' : 'amber', date: x.date, amount: v, title: `${-x.qty} ${x.item} ${x.kind === 'count' ? 'missing in a count' : 'taken off by hand'}`,
      what: `Worth ${bkPeso(v)}. ${x.reason || ''} · by ${x.by || '—'}.`, why: 'Stock that disappears without a sale is money lost.', next: x.kind === 'count' ? 'Recount it, and check deliveries and returns for that item.' : 'Ask why it was changed by hand. Use a reason (bad, used, count) next time.',
      ev: [['Open stock history', `go('inventory'); setTimeout(()=>openStockSheet('history'), 80)`]], basis: 'Stock history'}); });
  getBuyerPOs().filter(o => ['delivered', 'partially_delivered'].includes(o.status) && !o.invoice && daysBetween((o.deliveryConfirmation && o.deliveryConfirmation.confirmedDate) || o.createdDate, APP_TODAY) > 7).forEach(o => add({fp: 'nobill:' + o.id, kind: 'No supplier bill', lvl: 'amber', date: o.createdDate, amount: poTotal(o),
    title: `Received from ${o.supplierName}, no bill yet`, what: `${o.poNumber} was delivered but there's no bill.`, why: 'Without the bill, what you owe and your stock cost are understated.', next: 'Ask the supplier for the bill, or record it on the order.',
    ev: [['Open the order', `setLens('buyer'); openOrderDetailModal('${o.id}', false)`]], basis: 'Order delivered'}));
  getSupplierPOs().filter(o => ['delivered', 'partially_delivered'].includes(o.status) && !o.invoice && daysBetween((o.deliveryConfirmation && o.deliveryConfirmation.confirmedDate) || o.createdDate, APP_TODAY) > 3).forEach(o => add({fp: 'noinv:' + o.id, kind: 'Not billed', lvl: 'red', date: o.createdDate, amount: poTotal(o),
    title: `Delivered to ${o.buyerName}, not billed`, what: `${o.poNumber} was delivered but no invoice was sent.`, why: 'They can\'t pay what you haven\'t billed, and the sale isn\'t in your books.', next: 'Send the invoice from the order.',
    ev: [['Open the order', `setLens('supplier'); openOrderDetailModal('${o.id}', true)`]], basis: 'Order delivered'}));
  unpaidInvoicesFor('supplier').filter(x => x.daysOverdue > 30).forEach(x => add({fp: 'overdue:' + x.po.id, kind: 'Long overdue', lvl: 'red', date: x.due, amount: x.balance, title: `${x.po.buyerName} is ${x.daysOverdue} days late`,
    what: `${bkPeso(x.balance)} on ${x.po.invoice.number || x.po.poNumber}.`, why: 'The longer a bill waits, the less likely it gets paid.', next: 'Call them today and agree a date. Consider holding new orders.',
    ev: [['Open who owes you', `pickLens('collections','supplier')`]], basis: 'Invoice due date'}));
  BK.expenses.filter(e => !e.deletedAt && e.status === 'submitted' && daysBetween(e.date, APP_TODAY) > 2).forEach(e => add({fp: 'approve:' + e.id, kind: 'Waiting for approval', lvl: 'amber', date: e.date, amount: e.amount,
    title: `${e.category} ${bkPeso(e.amount)} waiting ${daysBetween(e.date, APP_TODAY)} days`, what: `Entered by ${e.by || '—'}.`, why: 'It stays out of the books until someone approves it.', next: 'Approve it or send it back.', ev: [['Open expenses', `go('expenses')`]], basis: 'Expense'}));
  const m = bkMonth(APP_TODAY);
  const sal = BK.expenses.filter(e => !e.deletedAt && e.category === 'Salaries' && bkMonth(e.date) === m);
  if(sal.length && typeof PR !== 'undefined' && PR.runs.some(r => r.status === 'paid' && bkMonth(r.paid_on) === m)) add({fp: 'salary-twice:' + m, kind: 'Possible duplicate', lvl: 'amber', date: APP_TODAY, amount: sal.reduce((a, e) => a + e.amount, 0),
    title: 'Salaries entered as expenses and through payroll', what: `${sal.length} salary expense${sal.length > 1 ? 's' : ''} this month, and a paid payroll.`, why: 'Salaries may be counted twice.', next: 'Use payroll only, and remove the salary expenses if they\'re the same pay.',
    ev: [['Open expenses', `bkExpFilter='Salaries'; go('expenses')`], ['Open payroll', `go('payroll')`]], basis: 'Expenses and payroll'});
  if(LG.loaded && booksCanSeeTotals()){
    const inv = lgBal(lgSums(null, APP_TODAY), '1200'), shelf = inventoryData.reduce((a, i) => a + Math.max(0, Number(i.onHand) || 0) * (Number(i.unitCost) || 0), 0);
    if(Math.abs(inv - shelf) >= Math.max(1000, shelf * 0.05)) add({fp: 'inv-recon:' + m, kind: 'Stock value differs', lvl: 'amber', date: APP_TODAY, amount: Math.abs(inv - shelf),
      title: `Books say ${bkPeso(inv)} of stock, the shelf says ${bkPeso(shelf)}`, what: `A difference of ${bkPeso(inv - shelf)}.`,
      why: 'Usually stock received without a supplier bill, costs that changed, or stock bought in cash that went to cost of goods. Profit is off by about this much.',
      next: 'Record missing supplier bills and costs. Your accountant can post an adjustment if the shelf is right.', ev: [['Open the stock account', `LGV.acct='1200'; LGV.tab='gl'; go('ledger')`]], basis: 'Ledger vs stock list'});
  }
  const noCost = bkLiveSales().filter(x => bkMonth(x.date) === m && (x.lines || []).some(l => !l.totalOnly && !(Number(l.unitCost) > 0)));
  if(noCost.length) add({fp: 'nocost:' + m, kind: 'Missing cost', lvl: 'amber', date: APP_TODAY, title: `${noCost.length} sale${noCost.length > 1 ? 's' : ''} this month with items that have no cost`,
    what: 'Their cost of goods is counted as ₱0.', why: 'Profit looks bigger than it really is.', next: 'Add the cost on Profit & prices. New sales pick it up.', ev: [['Open Profit & prices', `go('profit')`]], basis: 'Counter sales'});
  bkCostRises().slice(0, 5).forEach(r => add({fp: 'price:' + r.po, kind: 'Supplier price up', lvl: r.margin != null && r.margin < 0.1 ? 'red' : 'amber', date: APP_TODAY, amount: r.to - r.from,
    title: `${r.name} costs more from ${r.supplier}`, what: `${bkPeso(r.from)} → ${bkPeso(r.to)} on ${r.po}.${r.sell ? ' You sell at ' + bkPeso(r.sell) + '.' : ''}`, why: 'If your price stays the same, your margin shrinks.', next: 'Compare suppliers, or update your selling price.',
    ev: [['Open Profit & prices', `go('profit')`]], basis: 'Supplier orders'}));
  return out;
}
function issuesAll(){
  const d = ISS.decisions || {};
  return issueRules().map(x => Object.assign(x, {status: (d[x.fp] && d[x.fp].status) || 'new', dec: d[x.fp] || null}));
}
async function issDecide(fp, status){
  const x = issuesAll().find(i => i.fp === fp); if(!x) return;
  let note = null, to = x.dec ? x.dec.assigned_to : null;
  if(status === 'assigned'){
    const names = getActiveTeamMembers().map(m => String(m.name).replace(/ \(You\)$/, ''));
    to = prompt('Who should check this?' + (names.length ? ' (' + names.slice(0, 6).join(', ') + ')' : ''), names[0] || ''); if(!to) return;
  }
  if(status === 'resolved' || status === 'accepted'){
    note = prompt(status === 'resolved' ? 'What was done? (kept in the history)' : 'Why is this fine? (kept in the history)', ''); if(note === null) return;
    if(String(note).trim().length < 3){ showToast('Write a short reason.'); return; }
  }
  if(status === 'waiting') note = prompt('Waiting for what?', 'the receipt') || null;
  const row = {business_id: myBusiness ? myBusiness.id : 'demo', fingerprint: fp, status, assigned_to: to ? String(to).slice(0, 80) : null, note: note ? String(note).slice(0, 500) : null};
  if(myBusiness){
    const { data, error } = await sb.from('issue_decisions').upsert(row, {onConflict: 'business_id,fingerprint'}).select().single();
    if(error){ showToast(error.message, 'error'); return; }
    ISS.decisions[fp] = data;
  } else {
    const prev = ISS.decisions[fp] || {history: []};
    ISS.decisions[fp] = Object.assign({}, row, {decided_by_name: bkMe(), updated_at: new Date().toISOString(), history: (prev.history || []).concat([{status, by: bkMe(), at: new Date().toISOString(), note: row.note, to: row.assigned_to}])});
    try{ localStorage.setItem('nifti-issues-demo-v1', JSON.stringify(ISS.decisions)); }catch(e){}
  }
  showToast({assigned: 'Assigned to ' + to + '.', waiting: 'Marked as waiting.', resolved: 'Marked as fixed.', accepted: 'Marked as fine. It stays in the history.', new: 'Reopened.'}[status], 'success');
  renderIssuesPage(); if(typeof updateBooksBadges === 'function') updateBooksBadges();
}
const ISS_LABEL = {new: 'New', assigned: 'Assigned', waiting: 'Waiting for documents', resolved: 'Fixed', accepted: 'Accepted as fine'};
async function renderIssuesPage(){
  const body = document.getElementById('issBody'); if(!body) return;
  if(!booksCanSeeTotals()){ body.innerHTML = bkLockedForStaff('money'); return; }
  if(!BK.loaded || !ISS.decisions){ body.innerHTML = bkLoadingHtml(); await bkLoad(); await issLoadDecisions(); if(!LG.loaded) await lgLoad(); }
  const all = issuesAll(), open = all.filter(i => !['resolved', 'accepted'].includes(i.status));
  const list = (ISS.show === 'open' ? open : all.filter(i => ['resolved', 'accepted'].includes(i.status))).sort((a, b) => (a.lvl === 'red' ? 0 : 1) - (b.lvl === 'red' ? 0 : 1) || (b.amount || 0) - (a.amount || 0));
  body.innerHTML = `<div class="bk-tiles">${bkTile('To check', String(open.length), open.filter(i => i.lvl === 'red').length + ' important', open.some(i => i.lvl === 'red') ? 'bad' : '')}
      ${bkTile('Money involved', bkPeso(open.reduce((a, i) => a + (i.amount || 0), 0)), 'possible, not proven')}${bkTile('Closed', String(all.length - open.length), 'fixed or accepted')}</div>
    <div class="bk-toolbar"><div class="bk-seg"><button class="${ISS.show === 'open' ? 'on' : ''}" onclick="ISS.show='open'; renderIssuesPage()">Open (${open.length})</button><button class="${ISS.show === 'closed' ? 'on' : ''}" onclick="ISS.show='closed'; renderIssuesPage()">Closed (${all.length - open.length})</button></div></div>
    ${list.length ? list.map(issCardHtml).join('') : `<div class="panel-card bk-empty ok"><b>${ISS.show === 'open' ? 'Nothing to check right now.' : 'Nothing closed yet.'}</b><span>Nifti checks your sales, expenses, cash counts, stock and orders every time you open this page.</span></div>`}
    <div class="bk-note">These are checks, not accusations. Each one says why it was flagged. Mark it fine when there's a good reason; it stays in the history.</div>`;
}
function issCardHtml(i){
  const hist = (i.dec && i.dec.history) || [];
  return `<div class="lg-card ${i.lvl}"><div class="lg-card-h"><span class="bk-dot ${i.lvl}" aria-hidden="true"></span><b>${escapeHtml(i.title)}</b><span class="lg-pill">${escapeHtml(i.kind)}</span><span class="lg-pill st">${escapeHtml(ISS_LABEL[i.status])}${i.dec && i.dec.assigned_to && i.status === 'assigned' ? ' · ' + escapeHtml(i.dec.assigned_to) : ''}</span></div>
    <div class="lg-card-g"><span>What happened</span><p>${escapeHtml(i.what)}</p><span>Why it matters</span><p>${escapeHtml(i.why)}</p>
      <span>Evidence</span><p>${i.ev.map(([l, a]) => `<a class="lg-link" onclick="${a.replace(/"/g, '&quot;')}">${escapeHtml(l)}</a>`).join(' · ')} <small class="bk-dim">(${escapeHtml(i.basis)}, ${bkDayLabel(i.date)})</small></p>
      <span>Next step</span><p>${escapeHtml(i.next)}</p></div>
    <div class="bk-actions">${['resolved', 'accepted'].includes(i.status) ? `<button class="sl-link" onclick="issDecide('${i.fp}','new')">Reopen</button>` : `<button class="sl-link" onclick="issDecide('${i.fp}','assigned')">Assign</button><button class="sl-link" onclick="issDecide('${i.fp}','waiting')">Waiting</button><button class="sl-link" onclick="issDecide('${i.fp}','resolved')">Fixed</button><button class="sl-link bk-dim" onclick="issDecide('${i.fp}','accepted')">It's fine</button>`}</div>
    ${hist.length ? `<details class="lg-det"><summary>History (${hist.length})</summary>${hist.map(h => `<div class="bk-sub">${escapeHtml(ISS_LABEL[h.status] || h.status)} · ${escapeHtml(h.by || '')} · ${new Date(h.at).toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})}${h.to ? ' · to ' + escapeHtml(h.to) : ''}${h.note ? ' · “' + escapeHtml(h.note) + '”' : ''}</div>`).join('')}</details>` : ''}</div>`;
}

/* ---- month-end close: a checklist, then the month is locked ---- */
let CLS = {month: null};
function clsMonths(){ const out = []; let m = bkPrevMonth(bkMonth(APP_TODAY)); for(let i = 0; i < 12; i++){ out.push(m); m = bkPrevMonth(m); } return out; }
function clsDraftKey(m){ return 'nifti-close-' + (myBusiness ? myBusiness.id : 'demo') + '-' + m; }
function clsDraft(m){ try{ return JSON.parse(localStorage.getItem(clsDraftKey(m)) || '{}'); }catch(e){ return {}; } }
function clsChecks(m){
  const salesDays = new Set(bkLiveSales().filter(s => bkMonth(s.date) === m).map(s => s.date));
  const counted = new Set(BK.counts.filter(c => bkMonth(c.day) === m && !c.reopenedAt).map(c => c.day).concat(BK.countDays.filter(c => bkMonth(c.day) === m).map(c => c.day)));
  const notCounted = [...salesDays].filter(d => !counted.has(d));
  const waiting = BK.expenses.filter(e => !e.deletedAt && bkMonth(e.date) === m && e.status !== 'approved' && e.status);
  const bank = ((typeof bankMatchesCache !== 'undefined' && bankMatchesCache) || []).filter(x => x.line && bkMonth(x.line.date) === m);
  const iss = issuesAll().filter(i => bkMonth(i.date || APP_TODAY) === m && !['resolved', 'accepted'].includes(i.status));
  const counts = BK.moves.filter(x => bkMonth(x.date) === m && x.kind === 'count');
  const unbilled = getSupplierPOs().filter(o => ['delivered', 'partially_delivered'].includes(o.status) && !o.invoice && bkMonth(o.createdDate) === m);
  const pr = (typeof PR !== 'undefined' ? PR.runs : []), usesPayroll = pr.length > 0, paidHere = pr.some(r => r.status === 'paid' && bkMonth(r.paid_on) === m);
  return [
    {k: 'cash', t: 'Cash counted every sales day', ok: !notCounted.length, s: notCounted.length ? `${notCounted.length} day${notCounted.length > 1 ? 's' : ''} not counted: ${notCounted.slice(0, 4).map(bkDayLabel).join(', ')}` : `${counted.size} day${counted.size === 1 ? '' : 's'} counted`, a: "go('cashcount')"},
    {k: 'approve', t: 'Every expense approved', ok: !waiting.length, s: waiting.length ? `${waiting.length} waiting or sent back` : 'Nothing waiting', a: "go('expenses')"},
    {k: 'bill', t: 'Every delivery billed', ok: !unbilled.length, s: unbilled.length ? `${unbilled.length} delivered order${unbilled.length > 1 ? 's' : ''} without an invoice` : 'All billed', a: "pickLens('orders','supplier')"},
    {k: 'bank', t: 'Bank or GCash statement matched', ok: bank.length > 0, s: bank.length ? `${bank.length} line${bank.length > 1 ? 's' : ''} matched` : 'No statement uploaded for this month', a: "colTab='cash'; pickLens('collections','supplier')"},
    {k: 'stock', t: 'Stock counted at least once', ok: counts.length > 0, s: counts.length ? `${counts.length} count difference${counts.length > 1 ? 's' : ''} recorded` : 'No stock count this month', a: "go('inventory'); setTimeout(()=>openStockSheet('count'), 80)"},
    {k: 'payroll', t: 'Payroll paid', ok: !usesPayroll || paidHere, s: !usesPayroll ? 'You don\'t use payroll' : paidHere ? 'Paid' : 'No payroll paid this month', a: "go('payroll')"},
    {k: 'issues', t: 'Issues checked', ok: !iss.length, s: iss.length ? `${iss.length} still open` : 'Nothing open', a: "go('issues')"},
    {k: 'review', t: 'You looked at the profit and loss', ok: false, manual: true, s: 'Open it, check it looks right', a: `LGV.range='month'; LGV.ref='${m}-01'; LGV.tab='pnl'; go('ledger')`},
  ];
}
async function renderClosePage(){
  const body = document.getElementById('clsBody'); if(!body) return;
  if(!booksCanSeeTotals()){ body.innerHTML = bkLockedForStaff('money'); return; }
  if(!BK.loaded || !LG.loaded || !ISS.decisions){ body.innerHTML = bkLoadingHtml(); await bkLoad(); await lgLoad(); await issLoadDecisions(); }
  const m = CLS.month || clsMonths()[0];
  const per = LG.periods.find(p => String(p.period).slice(0, 7) === m);
  const locked = per && per.status === 'locked', draft = clsDraft(m), checks = clsChecks(m);
  checks.forEach(c => { const d = draft[c.k]; if(d){ c.ex = d; } });
  const ready = checks.every(c => c.ok || c.ex);
  body.innerHTML = `<div class="bk-toolbar"><select aria-label="Month" onchange="CLS.month=this.value; renderClosePage()">${clsMonths().map(x => { const p = LG.periods.find(q => String(q.period).slice(0, 7) === x); return `<option value="${x}" ${x === m ? 'selected' : ''}>${bkMonthLabel(x)}${p && p.status === 'locked' ? ' · closed' : ''}</option>`; }).join('')}</select></div>
    ${locked ? `<section class="panel-card bk-empty ok"><b>${bkMonthLabel(m)} is closed</b><span>Closed by ${escapeHtml(per.locked_by_name || '—')} on ${new Date(per.locked_at).toLocaleDateString('en-PH', {month: 'short', day: 'numeric', year: 'numeric'})}${per.note ? ' · “' + escapeHtml(per.note) + '”' : ''}. Nobody can add or change sales, expenses or cash counts in it. Late changes from orders land in the next open month.</span>
        <div class="bk-actions"><button class="btn btn-outline" onclick="clsReopen('${m}')">Reopen this month</button><button class="btn btn-outline" onclick="LGV.range='month'; LGV.ref='${m}-01'; LGV.tab='pnl'; go('ledger')">See its profit and loss</button></div></section>`
    : `<section class="panel-card bk-list"><div class="panel-head"><h2>Close ${bkMonthLabel(m)}</h2><span class="bk-dim">${checks.filter(c => c.ok || c.ex).length} of ${checks.length} done</span></div>
      ${checks.map(c => `<div class="lg-conf ${c.ok ? 'ok' : c.ex ? 'ex' : 'warn'}"><span aria-hidden="true">${c.ok ? '✓' : c.ex ? '~' : '!'}</span><div><b>${escapeHtml(c.t)}</b><small>${escapeHtml(c.s)}${c.ex ? ' · marked done: “' + escapeHtml(c.ex.note) + '” (' + escapeHtml(c.ex.by) + ')' : ''}</small></div>
        <span class="bk-row-a"><button class="sl-link" onclick="${c.a.replace(/"/g, '&quot;')}">${c.manual ? 'Open' : 'Fix'}</button>${c.ok ? '' : c.ex ? `<button class="sl-link bk-dim" onclick="clsMark('${m}','${c.k}', false)">Undo</button>` : `<button class="sl-link" onclick="clsMark('${m}','${c.k}', true)">${c.manual ? 'Done' : 'Mark done'}</button>`}</span></div>`).join('')}
      <div class="bk-actions"><button class="btn btn-primary" ${ready ? '' : 'disabled'} onclick="clsLock('${m}')">Close ${bkMonthLabel(m)}</button>${ready ? '' : '<span class="bk-dim">Fix each item, or mark it done with a reason.</span>'}</div></section>`}
    <div class="bk-note">Closing a month locks it, so last month's numbers can't quietly change after you've seen them or sent them to your accountant. Only the owner or general manager can reopen one, with a reason.</div>`;
}
function clsMark(m, k, on){
  const d = clsDraft(m);
  if(on){ const c = clsChecks(m).find(x => x.k === k); let note = c && c.manual ? 'Reviewed' : prompt('Why is this fine for this month?', ''); if(note === null) return; if(String(note).trim().length < 2){ showToast('Write a short reason.'); return; } d[k] = {note: String(note).slice(0, 200), by: bkMe(), at: new Date().toISOString()}; }
  else delete d[k];
  try{ localStorage.setItem(clsDraftKey(m), JSON.stringify(d)); }catch(e){}
  renderClosePage();
}
async function clsLock(m){
  if(!confirm(`Close ${bkMonthLabel(m)}? Nobody will be able to add or change its sales, expenses or cash counts.`)) return;
  const note = prompt('A note for your records (optional)', '') || '';
  const checklist = {};
  clsChecks(m).forEach(c => { checklist[c.k] = {ok: c.ok, summary: c.s, exception: clsDraft(m)[c.k] || null}; });
  if(myBusiness){ const { error } = await sb.rpc('lock_period', {p_month: m + '-01', p_note: note, p_checklist: checklist}); if(error){ showToast(error.message, 'error'); return; } await lgLoad(true); }
  else { const st = lgDemoStore(); st.periods = (st.periods || []).filter(p => String(p.period).slice(0, 7) !== m).concat([{period: m + '-01', status: 'locked', locked_at: new Date().toISOString(), locked_by_name: bkMe(), note, checklist}]); lgDemoSave(st); lgBuildDemo(); }
  showToast(bkMonthLabel(m) + ' is closed.', 'success'); renderClosePage();
}
async function clsReopen(m){
  const why = prompt('Why does ' + bkMonthLabel(m) + ' need reopening? (kept in the history)', ''); if(why === null) return;
  if(String(why).trim().length < 5){ showToast('Write a short reason.'); return; }
  if(myBusiness){ const { error } = await sb.rpc('reopen_period', {p_month: m + '-01', p_reason: why}); if(error){ showToast(error.message, 'error'); return; } await lgLoad(true); }
  else { const st = lgDemoStore(); const p = (st.periods || []).find(x => String(x.period).slice(0, 7) === m); if(p){ p.status = 'open'; p.reopened_at = new Date().toISOString(); p.reopened_by_name = bkMe(); p.reopen_reason = why; } lgDemoSave(st); lgBuildDemo(); }
  showToast(bkMonthLabel(m) + ' is open again.', 'success'); renderClosePage();
}

/* ---- payroll: pay per day or per month, vale and contributions taken off, a payslip each ---- */
const PR = {loaded: false, runs: [], lines: []};
const PR_DEMO_KEY = 'nifti-payroll-demo-v1';
async function prLoad(force){
  if(PR.loaded && !force) return;
  if(myBusiness){
    if(!booksCanSeeTotals()){ PR.loaded = true; return; }
    const [r, l] = await Promise.all([sb.from('payroll_runs').select('*').eq('business_id', myBusiness.id).order('period_to', {ascending: false}).limit(200),
      sb.from('payroll_lines').select('*').eq('business_id', myBusiness.id).limit(5000)]);
    PR.runs = r.data || []; PR.lines = l.data || [];
  } else { let st = {}; try{ st = JSON.parse(localStorage.getItem(PR_DEMO_KEY) || '{}'); }catch(e){} PR.runs = st.runs || []; PR.lines = st.lines || []; }
  PR.loaded = true;
}
function prSaveDemo(){ try{ localStorage.setItem(PR_DEMO_KEY, JSON.stringify({runs: PR.runs, lines: PR.lines})); }catch(e){} }
function prCalc(l){
  const rate = Number(l.rate) || 0, days = Number(l.days) || 0;
  const gross = lgR((l.basis === 'month' ? rate * (days > 0 ? days : 1) : rate * days) + (Number(l.extra) || 0));
  const net = lgR(gross - (Number(l.vale_deduct) || 0) - (Number(l.contrib_employee) || 0) - (Number(l.other_deduct) || 0));
  return {gross, net};
}
// vale given (approved staff advances) minus what payroll already took back, per person
function prValeBalances(){
  const out = {};
  BK.expenses.filter(e => !e.deletedAt && e.category === 'Staff advance (vale)' && (e.status || 'approved') === 'approved').forEach(e => { const k = String(e.staff || '').trim() || 'No name'; out[k] = (out[k] || 0) + e.amount; });
  PR.lines.filter(l => (PR.runs.find(r => r.id === l.run_id) || {}).status === 'paid').forEach(l => { out[l.staff_name] = (out[l.staff_name] || 0) - (Number(l.vale_deduct) || 0); });
  Object.keys(out).forEach(k => { out[k] = lgR(out[k]); });
  return out;
}
let PRF = null;
async function renderPayrollPage(){
  const body = document.getElementById('prBody'); if(!body) return;
  if(!booksCanSeeTotals()){ body.innerHTML = bkLockedForStaff('money'); return; }
  if(!BK.loaded || !PR.loaded){ body.innerHTML = bkLoadingHtml(); await bkLoad(); await prLoad(); }
  const vale = prValeBalances(), owed = Object.entries(vale).filter(([, v]) => v >= 0.01);
  body.innerHTML = `${owed.length ? `<section class="panel-card bk-list"><div class="panel-head"><h2>Vale not yet taken back</h2><span class="bk-dim">${bkPeso(owed.reduce((a, [, v]) => a + v, 0))}</span></div>
      ${owed.map(([k, v]) => `<div class="bk-row"><span class="bk-ic" aria-hidden="true">🤝</span><div class="bk-row-m"><b>${escapeHtml(k)}</b><small>advances minus what payroll already deducted</small></div><span class="bk-amt">${bkPeso(v)}</span></div>`).join('')}</section>` : ''}
    <section class="panel-card bk-list"><div class="panel-head"><h2>Payroll</h2><button class="btn btn-primary" onclick="prNew()">+ New payroll</button></div>
      ${PR.runs.length ? PR.runs.slice().sort((a, b) => String(b.period_to).localeCompare(String(a.period_to))).map(r => { const ls = PR.lines.filter(l => l.run_id === r.id); return `<div class="bk-row" role="button" tabindex="0" onclick="prOpenRun('${r.id}')"><div class="bk-row-m"><b>${bkDayLabel(r.period_from)} – ${bkDayLabel(r.period_to)}</b><small>${ls.length} ${ls.length === 1 ? 'person' : 'people'} · ${r.status === 'paid' ? `paid ${bkDayLabel(r.paid_on)} from ${escapeHtml({cash: 'the drawer', gcash: 'GCash', bank: 'the bank'}[r.paid_from] || r.paid_from)}` : '<span class="bk-tag">draft, not paid</span>'}</small></div><span class="bk-amt">${bkPeso(ls.reduce((a, l) => a + Number(l.net || 0), 0))}</span></div>`; }).join('')
        : `<div class="bk-empty"><b>No payroll yet.</b><span>Pay your staff by the day or the month. Nifti takes off their vale and the contributions you type in, makes a payslip for each, and puts it in the books.</span></div>`}</section>
    <div class="bk-note">SSS, PhilHealth and Pag-IBIG amounts are typed in by you; Nifti doesn't compute or file them. Don't also add salaries as an expense, or they'll count twice.</div>`;
}
function prNew(){
  const t = APP_TODAY, d = Number(t.slice(8, 10)), m = t.slice(0, 7);
  const from = d <= 15 ? bkPrevMonth(m) + '-16' : m + '-01';
  const to = d <= 15 ? (() => { const x = new Date(m + '-01T00:00:00'); x.setDate(0); return x.niftiDay ? x.niftiDay() : x.toISOString().slice(0, 10); })() : m + '-15';
  const last = {}; PR.lines.forEach(l => { last[l.staff_name] = l; });
  const names = new Set(getActiveTeamMembers().filter(x => !(x.roles || []).includes('Owner')).map(x => String(x.name).replace(/ \(You\)$/, '')));
  Object.keys(prValeBalances()).forEach(k => { if(k !== 'No name') names.add(k); }); Object.keys(last).forEach(k => names.add(k));
  const vale = prValeBalances();
  PRF = {id: null, from, to, err: '', saving: false, lines: [...names].map(n => { const p = last[n] || {}; return {staff_name: n, basis: p.basis || 'day', rate: p.rate != null ? String(p.rate) : '', days: p.basis === 'month' ? '0.5' : '', extra: '', vale_deduct: vale[n] > 0 ? String(vale[n]) : '', contrib_employee: p.contrib_employee != null ? String(p.contrib_employee) : '', contrib_employer: p.contrib_employer != null ? String(p.contrib_employer) : '', other_deduct: '', note: ''}; })};
  if(!PRF.lines.length) PRF.lines.push({staff_name: '', basis: 'day', rate: '', days: '', extra: '', vale_deduct: '', contrib_employee: '', contrib_employer: '', other_deduct: '', note: ''});
  prFormRender();
}
function prOpenRun(id){
  const r = PR.runs.find(x => x.id === id); if(!r) return;
  if(r.status === 'paid'){ prShowPaid(r); return; }
  PRF = {id: r.id, from: r.period_from, to: r.period_to, err: '', saving: false, lines: PR.lines.filter(l => l.run_id === id).map(l => ({staff_name: l.staff_name, basis: l.basis, rate: String(l.rate), days: String(l.days), extra: String(l.extra || ''), vale_deduct: String(l.vale_deduct || ''), contrib_employee: String(l.contrib_employee || ''), contrib_employer: String(l.contrib_employer || ''), other_deduct: String(l.other_deduct || ''), note: l.note || ''}))};
  prFormRender();
}
function prFormRender(){
  const v = prValeBalances();
  const tot = PRF.lines.reduce((a, l) => a + prCalc(l).net, 0);
  const f = (i, k, ph, w) => `<input inputmode="decimal" class="pr-n" style="${w ? 'width:' + w : ''}" value="${escapeHtml(String(PRF.lines[i][k]))}" placeholder="${ph}" oninput="PRF.lines[${i}].${k}=this.value; prLive(${i})" aria-label="${ph}">`;
  slModal('prModal', `<div class="sl-sheet-h"><b>${PRF.id ? 'Payroll (draft)' : 'New payroll'}</b><button class="sl-x" onclick="slClose('prModal')">✕</button></div>
    <div class="row-2"><div class="field"><label>From</label><input type="date" value="${PRF.from}" onchange="PRF.from=this.value"></div><div class="field"><label>To</label><input type="date" value="${PRF.to}" onchange="PRF.to=this.value"></div></div>
    <div class="pr-lines">${PRF.lines.map((l, i) => `<div class="pr-line"><div class="pr-top"><input class="pr-name" maxlength="80" value="${escapeHtml(l.staff_name)}" placeholder="Name" oninput="PRF.lines[${i}].staff_name=this.value" aria-label="Name">
        <select onchange="PRF.lines[${i}].basis=this.value; prFormRender()" aria-label="Pay basis"><option value="day" ${l.basis === 'day' ? 'selected' : ''}>per day</option><option value="month" ${l.basis === 'month' ? 'selected' : ''}>per month</option></select>
        <button class="sl-x" aria-label="Remove" onclick="PRF.lines.splice(${i},1); prFormRender()">✕</button></div>
      <div class="pr-grid"><label>Rate ₱${f(i, 'rate', '0')}</label><label>${l.basis === 'month' ? 'Months (0.5 = half)' : 'Days worked'}${f(i, 'days', l.basis === 'month' ? '0.5' : '0')}</label><label>Overtime, extra ₱${f(i, 'extra', '0')}</label>
        <label>Vale to take back ₱${f(i, 'vale_deduct', '0')}${v[l.staff_name] > 0 ? `<small>owes ${bkPeso(v[l.staff_name])}</small>` : ''}</label><label>SSS, PhilHealth, Pag-IBIG (their share) ₱${f(i, 'contrib_employee', '0')}</label><label>Your share ₱${f(i, 'contrib_employer', '0')}</label><label>Other deductions ₱${f(i, 'other_deduct', '0')}</label>
        <div class="pr-out" id="prOut${i}">${prOutHtml(l)}</div></div></div>`).join('')}</div>
    <button class="sl-link" onclick="PRF.lines.push({staff_name:'',basis:'day',rate:'',days:'',extra:'',vale_deduct:'',contrib_employee:'',contrib_employer:'',other_deduct:'',note:''}); prFormRender()">+ Add a person</button>
    <div class="qs-sum"><span>Total take-home pay</span><b id="prTot">${bkPeso(tot)}</b></div>
    <div class="sl-err" id="prErr">${escapeHtml(PRF.err)}</div>
    <div class="bk-actions"><button class="btn btn-outline" onclick="prSave(false)" ${PRF.saving ? 'disabled' : ''}>Save as draft</button><button class="btn btn-primary" onclick="prSave(true)" ${PRF.saving ? 'disabled' : ''}>${PRF.saving ? 'Saving…' : 'Pay now'}</button></div>`);
}
function prOutHtml(l){ const c = prCalc(l); return `<span>Pay ${bkPeso(c.gross)}</span><b class="${c.net < 0 ? 'bk-bad' : ''}">Take home ${bkPeso(c.net)}</b>`; }
function prLive(i){ const el = document.getElementById('prOut' + i); if(el) el.innerHTML = prOutHtml(PRF.lines[i]); const t = document.getElementById('prTot'); if(t) t.textContent = bkPeso(PRF.lines.reduce((a, l) => a + prCalc(l).net, 0)); }
async function prSave(pay){
  const err = m => { PRF.err = m; const e = document.getElementById('prErr'); if(e) e.textContent = m; };
  const lines = PRF.lines.filter(l => String(l.staff_name).trim()).map(l => { const n = k => lgR(String(l[k]).replace(/,/g, '')); const x = {staff_name: String(l.staff_name).trim().slice(0, 80), basis: l.basis, rate: n('rate'), days: n('days'), extra: n('extra'), vale_deduct: n('vale_deduct'), contrib_employee: n('contrib_employee'), contrib_employer: n('contrib_employer'), other_deduct: n('other_deduct'), note: l.note || null}; const c = prCalc(x); x.gross = c.gross; x.net = c.net; return x; });
  if(!PRF.from || !PRF.to || PRF.to < PRF.from) return err('Pick the dates this payroll covers.');
  if(!lines.length) return err('Add at least one person.');
  const neg = lines.find(l => l.net < 0); if(neg) return err(`Deductions are more than the pay for ${neg.staff_name}.`);
  if(lines.some(l => !(l.gross > 0))) return err('Each person needs a rate and days (or months).');
  let paid = null;
  if(pay){
    const from = prompt('Paid from? Type: cash, gcash or bank', 'cash'); if(!from) return;
    const pf = String(from).trim().toLowerCase(); if(!['cash', 'gcash', 'bank'].includes(pf)) return err('Paid from must be cash, gcash or bank.');
    const msg = bkClosedMsg(APP_TODAY); if(msg) return err(msg);
    paid = {status: 'paid', paid_on: APP_TODAY, paid_from: pf, branch: bkHereBranch()};
  }
  PRF.saving = true; prFormRender();
  if(myBusiness){
    let id = PRF.id;
    if(!id){ const { data, error } = await sb.from('payroll_runs').insert({business_id: myBusiness.id, period_from: PRF.from, period_to: PRF.to}).select().single(); if(error){ PRF.saving = false; prFormRender(); return err(error.message); } id = data.id; }
    else { const { error } = await sb.from('payroll_runs').update({period_from: PRF.from, period_to: PRF.to}).eq('id', id); if(error){ PRF.saving = false; prFormRender(); return err(error.message); } await sb.from('payroll_lines').delete().eq('run_id', id); }
    const { error: le } = await sb.from('payroll_lines').insert(lines.map(l => Object.assign({run_id: id, business_id: myBusiness.id}, l)));
    if(le){ PRF.saving = false; PRF.id = id; prFormRender(); return err(le.message); }
    if(paid){ const { error } = await sb.from('payroll_runs').update(paid).eq('id', id); if(error){ PRF.saving = false; PRF.id = id; prFormRender(); return err(error.message); } }
    await prLoad(true);
  } else {
    let r = PRF.id && PR.runs.find(x => x.id === PRF.id);
    if(!r){ r = {id: 'PR' + Date.now(), business_id: 'demo', status: 'draft', created_by_name: bkMe()}; PR.runs.push(r); }
    Object.assign(r, {period_from: PRF.from, period_to: PRF.to}, paid ? Object.assign({paid_by_name: bkMe()}, paid) : {});
    PR.lines = PR.lines.filter(l => l.run_id !== r.id).concat(lines.map((l, i) => Object.assign({id: r.id + ':' + i, run_id: r.id}, l)));
    prSaveDemo();
  }
  slClose('prModal'); PRF = null; if(typeof lgInvalidate === 'function') lgInvalidate();
  showToast(paid ? 'Payroll paid and recorded. Payslips are ready.' : 'Draft saved.', 'success'); renderPayrollPage();
}
function prShowPaid(r){
  const ls = PR.lines.filter(l => l.run_id === r.id);
  slModal('prPaid', `<div class="sl-sheet-h"><b>Payroll ${bkDayLabel(r.period_from)} – ${bkDayLabel(r.period_to)}</b><button class="sl-x" onclick="slClose('prPaid')">✕</button></div>
    <div class="sl-sub">Paid ${bkDayLabel(r.paid_on)} from ${escapeHtml({cash: 'the drawer', gcash: 'GCash', bank: 'the bank'}[r.paid_from] || r.paid_from)}${r.paid_by_name ? ' by ' + escapeHtml(r.paid_by_name) : ''}. Paid payroll can't be changed.</div>
    ${ls.map(l => `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(l.staff_name)}</b><small>pay ${bkPeso(l.gross)}${Number(l.vale_deduct) ? ' · vale −' + bkPeso(l.vale_deduct) : ''}${Number(l.contrib_employee) ? ' · contributions −' + bkPeso(l.contrib_employee) : ''}${Number(l.other_deduct) ? ' · other −' + bkPeso(l.other_deduct) : ''}</small></div><span class="bk-amt">${bkPeso(l.net)}</span><span class="bk-row-a"><button class="sl-link" onclick="prPayslip('${r.id}','${String(l.staff_name).replace(/'/g, "\\'")}')">Payslip</button></span></div>`).join('')}
    <div class="qs-sum"><span>Total take-home</span><b>${bkPeso(ls.reduce((a, l) => a + Number(l.net || 0), 0))}</b></div>`);
}
function prPayslip(runId, name){
  const r = PR.runs.find(x => x.id === runId), l = PR.lines.find(x => x.run_id === runId && x.staff_name === name); if(!r || !l) return;
  const row = (k, v) => `<div class="rc-l"><span>${k}</span><b>${bkPeso(v)}</b></div>`;
  const html = `<div class="rc"><div class="rc-h"><b>${escapeHtml(selfName())}</b></div><div class="rc-t">Payslip</div>
    <div class="rc-m"><span>${escapeHtml(l.staff_name)}</span><span>${bkDayLabel(r.period_from)} – ${bkDayLabel(r.period_to)}</span></div>
    <div class="rc-lines">${row(l.basis === 'month' ? `Pay (${l.days || 1} × ${bkPeso(l.rate)}/month)` : `Pay (${l.days} days × ${bkPeso(l.rate)})`, lgR(l.gross - (Number(l.extra) || 0)))}${Number(l.extra) ? row('Overtime, extra', l.extra) : ''}${row('Gross pay', l.gross)}</div>
    ${Number(l.vale_deduct) ? row('− Vale taken back', l.vale_deduct) : ''}${Number(l.contrib_employee) ? row('− SSS, PhilHealth, Pag-IBIG', l.contrib_employee) : ''}${Number(l.other_deduct) ? row('− Other deductions', l.other_deduct) : ''}
    <div class="rc-l rc-tot"><span>Take home</span><b>${bkPeso(l.net)}</b></div>
    <div class="rc-f">Paid ${bkDayLabel(r.paid_on)} · Received by: ____________</div></div>`;
  const f = document.createElement('iframe'); f.className = 'rc-frame'; document.body.appendChild(f);
  f.contentDocument.open(); f.contentDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>Payslip</title><style>body{font-family:ui-monospace,Menlo,Consolas,monospace;margin:0;padding:12px;font-size:13px}.rc{max-width:320px;margin:0 auto}.rc-h{text-align:center}.rc-t{text-align:center;font-weight:700;text-transform:uppercase;border-top:1px dashed #000;border-bottom:1px dashed #000;padding:4px 0;margin:6px 0}.rc-m,.rc-l{display:flex;justify-content:space-between;gap:8px;padding:2px 0}.rc-lines{border-bottom:1px dashed #000;padding-bottom:6px;margin-bottom:4px}.rc-tot{font-weight:700;font-size:15px}.rc-f{margin-top:14px}</style></head><body>${html}</body></html>`); f.contentDocument.close();
  setTimeout(() => { try{ f.contentWindow.print(); }catch(e){} setTimeout(() => f.remove(), 60000); }, 250);
}

/* ---- one set of numbers: the owner's pages read profit from the ledger once it's loaded ---- */
const _bkPnlOps = bkPnl;
bkPnl = function(m){
  if(!LG.loaded || !booksCanSeeTotals() || !LG.lines.length) return _bkPnlOps(m);
  const r = lgRange('month', m + '-01'), p = lgPnlFor(r.from, r.to), old = _bkPnlOps(m);
  const byCat = {}; Object.entries(p.opex).forEach(([c, v]) => { byCat[lgAcct(c).name] = v; });
  const d = lgSums(r.from, r.to)['3100'];
  return {sales: p.revenue, counter: p.counter, orders: p.orders, cost: p.cogs, gross: p.gross, expenses: lgR(p.opexTot - p.other), byCat, net: p.net, drawings: d ? lgR(d.d - d.c) : 0, missingCost: old.missingCost, fromLedger: true};
};
const _renderMoneyOps = renderMoneyPage;
renderMoneyPage = function(){
  const body = document.getElementById('bkMoneyBody'); if(!body) return;
  if(booksCanSeeTotals() && (!LG.loaded || !BK.loaded)){ body.innerHTML = bkLoadingHtml(); bkLoad().then(() => lgLoad()).then(() => { if(document.querySelector('#page-money.active')) renderMoneyPage(); }); return; }
  _renderMoneyOps();
  if(booksCanSeeTotals() && LG.loaded) body.insertAdjacentHTML('beforeend', `<div class="bk-note">Profit comes from your posted books. <a class="lg-link" onclick="go('ledger')">See the full statements</a>.</div>` + lgForecastHtml());
};
const _booksAfterHomeOps = booksAfterHome;
booksAfterHome = function(){
  _booksAfterHomeOps();
  if(BK.loaded && booksCanSeeTotals() && !LG.loaded && !LG.loading) lgLoad().then(() => { if(document.querySelector('#page-dashboard.active')) renderOneHome(); });
  if(BK.loaded && booksCanSeeTotals() && !ISS.decisions) issLoadDecisions().then(updateBooksBadges);
};
const _updateBooksBadgesOps = updateBooksBadges;
updateBooksBadges = function(){
  _updateBooksBadgesOps();
  const el = document.getElementById('issuesNavBadge'); if(!el) return;
  const n = BK.loaded && ISS.decisions && booksCanSeeTotals() ? issuesAll().filter(i => !['resolved', 'accepted'].includes(i.status)).length : 0;
  el.textContent = n ? String(n) : ''; el.style.display = n ? '' : 'none';
};
const _bkRefreshViewsOps = bkRefreshViews;
bkRefreshViews = function(){
  if(typeof lgInvalidate === 'function') lgInvalidate();
  const page = (document.querySelector('.app-page.active') || {}).id || '';
  const more = {'page-ledger': renderLedgerPage, 'page-issues': renderIssuesPage, 'page-close': renderClosePage, 'page-payroll': renderPayrollPage};
  if(more[page]) more[page](); else _bkRefreshViewsOps();
};
const _booksOnNavigateOps = booksOnNavigate;
booksOnNavigate = function(page){
  _booksOnNavigateOps(page);
  const more = {ledger: renderLedgerPage, issues: renderIssuesPage, close: renderClosePage, payroll: renderPayrollPage};
  if(more[page]) more[page]();
};
// queued cash counts show as counted on this phone after a reload too
const _bkMergeQueuedOps = bkMergeQueued;
bkMergeQueued = function(){
  _bkMergeQueuedOps();
  bkQueue().filter(it => it.rpc === 'save_cash_count').forEach(it => { const a = it.args; if(!BK.countDays.some(c => c.day === a.p_day && c.drawer === a.p_drawer)) BK.countDays.push({day: a.p_day, drawer: a.p_drawer, by: it.by, reopened: false, pending: true}); });
};

/* ---- bank statements: money going out (debits) is matched too, not only deposits ---- */
function bkBankDebits(text){
  const rows = colParseCsv(text); if(!rows.length) return [];
  const h = rows[0].map(x => x.toLowerCase()), idx = re => h.findIndex(x => re.test(x));
  const iDate = idx(/date/), iDesc = idx(/desc|particular|details|remarks|narrative|transaction/), iDebit = idx(/debit|withdraw|cash out|paid out/), iAmt = idx(/^amount|amount$/), iRef = idx(/ref/);
  if(iDate < 0 || (iDebit < 0 && iAmt < 0)) return [];
  const out = [];
  rows.slice(1).forEach(r => {
    const date = colParseDate(r[iDate]); let amt = null;
    if(iDebit > -1) amt = colNum(r[iDebit]); if(!(amt > 0) && iAmt > -1){ const v = colNum(r[iAmt]); if(v < 0) amt = -v; }
    if(!date || !(amt > 0)) return;
    const desc = [r[iDesc], iRef > -1 ? r[iRef] : ''].filter(Boolean).join(' ');
    out.push({date, desc: String(desc || '').slice(0, 200), amount: Math.round(amt * 100) / 100, out: true, hash: ['out', date, amt.toFixed(2), String(desc || '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 80)].join('|')});
  });
  return out;
}
function bkBankOutflows(){
  const rows = [];
  BK.expenses.filter(e => !e.deletedAt && ['bank', 'gcash', 'maya', 'card'].includes(e.paidFrom)).forEach(e => rows.push({id: 'exp:' + e.id, date: e.date, amount: e.amount, what: e.category + (e.vendor ? ' · ' + e.vendor : '')}));
  bkSupplierPaymentsOn('1900-01-01', '2999-12-31').filter(r => bkMethodKey(r.method) !== 'cash').forEach((r, i) => rows.push({id: 'sup:' + r.po.id + ':' + i + ':' + r.date, date: r.date, amount: r.amount, what: 'Paid ' + r.po.supplierName}));
  PR.runs.filter(r => r.status === 'paid' && r.paid_from !== 'cash').forEach(r => rows.push({id: 'pay:' + r.id, date: r.paid_on, amount: PR.lines.filter(l => l.run_id === r.id).reduce((a, l) => a + Number(l.net || 0), 0), what: 'Payroll'}));
  return rows;
}
const _colMatchBankOps = colMatchBank;
colMatchBank = function(){
  const text = (document.getElementById('bankPaste') || {}).value || '';
  const debits = bkBankDebits(text);
  const credits = colBankLines(text);
  if(credits.length) _colMatchBankOps();
  else colBankResult = {matched: [], unknown: [], known: [], missing: []};
  const done = new Map((bankMatchesCache || []).map(m => [m.line_hash, m])), taken = new Set((bankMatchesCache || []).map(m => m.payment_key).filter(Boolean));
  const outs = bkBankOutflows(), res = {matched: [], unknown: [], known: 0};
  debits.forEach(l => {
    if(done.has(l.hash)){ res.known++; return; }
    const hit = outs.filter(x => !taken.has(x.id) && Math.abs(x.amount - l.amount) < 1 && Math.abs(daysBetween(x.date, l.date)) <= 5).sort((a, b) => Math.abs(daysBetween(a.date, l.date)) - Math.abs(daysBetween(b.date, l.date)))[0];
    if(hit){ taken.add(hit.id); res.matched.push({line: l, hit}); } else res.unknown.push(l);
  });
  colBankResult.out = res;
  if(!credits.length && !debits.length){ showToast('Couldn\'t read any rows. Paste rows with a date and an amount, or upload the CSV.'); return; }
  document.getElementById('bankResult').innerHTML = colBankResultHtml();
};
const _colBankResultHtmlOps = colBankResultHtml;
colBankResultHtml = function(){
  const base = colBankResult && (colBankResult.matched.length || colBankResult.unknown.length || colBankResult.known.length || colBankResult.missing.length) ? _colBankResultHtmlOps() : '';
  const o = colBankResult && colBankResult.out; if(!o) return base;
  return base + `<div class="sl-result"><div class="sl-rsum"><b>Money out</b><span class="sl-good">✓ ${o.matched.length} matched</span><span class="${o.unknown.length ? 'sl-warn' : 'sl-dim'}">? ${o.unknown.length} not recorded</span>${o.known ? `<span class="sl-dim">${o.known} done before</span>` : ''}</div>
    ${o.matched.length ? `<details><summary>✓ Matched (${o.matched.length})</summary>${o.matched.map(m => `<div class="sl-row tight"><div class="sl-mid"><div class="sl-t">${escapeHtml(m.hit.what)}</div><div class="sl-s">${stmtDate(m.line.date)} · ${escapeHtml(m.line.desc)}</div></div><div class="sl-right"><b>${fmtPHP(m.line.amount)}</b></div></div>`).join('')}</details>` : ''}
    ${o.unknown.map((l, i) => `<div class="sl-row tight"><div class="sl-mid"><div class="sl-t">${fmtPHP(l.amount)} out · ${stmtDate(l.date)}</div><div class="sl-s">${escapeHtml(l.desc)} · not recorded in Nifti</div></div>
      <div class="sl-right sl-acts"><button class="hm-go" onclick="bkBankRecordOut(${i})">Record as expense</button><button class="sl-link" onclick="bkBankIgnoreOut(${i})">Not ours</button></div></div>`).join('')}
    ${o.matched.length ? `<button class="btn btn-primary sl-wide" onclick="bkBankSaveOut()">Save ${o.matched.length} money-out match${o.matched.length === 1 ? '' : 'es'}</button>` : ''}</div>`;
};
async function bkBankSaveOut(){
  const o = colBankResult && colBankResult.out; if(!o) return;
  for(const m of o.matched) await colStoreMatch({line_hash: m.line.hash, line: m.line, status: 'matched', payment_key: m.hit.id});
  showToast(`${o.matched.length} saved. Next time they're skipped.`, 'success'); o.known += o.matched.length; o.matched = [];
  document.getElementById('bankResult').innerHTML = colBankResultHtml();
}
async function bkBankIgnoreOut(i){
  const o = colBankResult.out, l = o.unknown[i]; if(!l) return;
  if(await colStoreMatch({line_hash: l.hash, line: l, status: 'ignored'})){ o.unknown.splice(i, 1); o.known++; document.getElementById('bankResult').innerHTML = colBankResultHtml(); }
}
function bkBankRecordOut(i){
  const l = colBankResult.out.unknown[i]; if(!l) return;
  openExpenseForm(); EXF.amount = String(l.amount); EXF.date = l.date; EXF.paidFrom = /gcash/i.test(l.desc) ? 'gcash' : /maya/i.test(l.desc) ? 'maya' : 'bank'; EXF.note = l.desc.slice(0, 200); exRender();
  window._bkBankPending = l;
}
