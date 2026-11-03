
/* ============ THE LEDGER: double-entry books posted from the records you already keep ============
   Real accounts: the server posts every sale, expense, invoice, payment, stock loss, cash count,
   deposit and payroll into journal entries (ledger_sync), and nothing posted is ever edited or
   deleted: a change is a reversal plus a new entry. The app only reads those entries here.
   The demo has no server, so the same posting rules run below on the sample data. Every report
   (profit and loss, balance sheet, trial balance, ledger) is a sum of these lines, and every line
   opens the record it came from. */
const LG_ACCOUNTS = [
  ['1000', 'Cash in drawer', 'asset'], ['1010', 'GCash & Maya', 'asset'], ['1020', 'Bank', 'asset'],
  ['1100', 'Customers owe you (receivables)', 'asset'], ['1150', 'Staff advances (vale)', 'asset'], ['1200', 'Stock (inventory)', 'asset'],
  ['1400', 'Input VAT', 'asset'], ['1410', 'Tax withheld by customers', 'asset'],
  ['2000', 'You owe suppliers (payables)', 'liability'], ['2050', 'Unpaid bills', 'liability'], ['2060', 'Credit card', 'liability'],
  ['2100', 'Output VAT', 'liability'], ['2300', 'SSS, PhilHealth, Pag-IBIG to remit', 'liability'], ['2310', 'Other payroll deductions', 'liability'],
  ['3000', "Owner's money put in (capital)", 'equity'], ['3100', 'Owner took money (drawings)', 'equity'], ['3200', 'Retained earnings', 'equity'], ['3900', 'Opening balances', 'equity'],
  ['4000', 'Counter sales', 'income'], ['4010', 'Sales to customers (orders)', 'income'], ['4020', 'Credits and returns given', 'income'], ['4900', 'Other income (cash over)', 'income'],
  ['5000', 'Cost of goods sold', 'expense'], ['5100', 'Bad and missing stock', 'expense'], ['5110', 'Stock changed by hand', 'expense'],
  ['6010', 'Electricity', 'expense'], ['6020', 'Water', 'expense'], ['6030', 'Internet & phone', 'expense'], ['6040', 'Gas (LPG)', 'expense'], ['6100', 'Rent', 'expense'],
  ['6200', 'Salaries', 'expense'], ['6210', 'Employer contributions', 'expense'], ['6300', 'Fuel & transport', 'expense'], ['6310', 'Delivery & shipping', 'expense'],
  ['6400', 'Supplies', 'expense'], ['6500', 'Repairs', 'expense'], ['6600', 'Food & meals', 'expense'], ['6700', 'Taxes & permits', 'expense'],
  ['6800', 'Bank & GCash fees', 'expense'], ['6900', 'Marketing', 'expense'], ['6960', 'Cash short', 'expense'], ['6990', 'Other expenses', 'expense'],
];
const LG_TYPE_LABEL = {asset: 'What you have', liability: 'What you owe', equity: "Owner's share", income: 'Money earned', expense: 'Costs'};
const LG = {loaded: false, loading: null, accounts: [], entries: [], lines: [], periods: [], syncedAt: null, syncError: '', demo: false};
const LG_DEMO_KEY = 'nifti-ledger-demo-v1';
function lgDemoStore(){ try{ return JSON.parse(localStorage.getItem(LG_DEMO_KEY) || '{}'); }catch(e){ return {}; } }
function lgDemoSave(d){ try{ localStorage.setItem(LG_DEMO_KEY, JSON.stringify(d)); }catch(e){} }
function lgAcct(code){ return LG.accounts.find(a => a.code === code) || {code, name: 'Account ' + code, type: lgTypeOf(code)}; }
function lgTypeOf(code){ const c = String(code)[0]; return c === '1' ? 'asset' : c === '2' ? 'liability' : c === '3' ? 'equity' : c === '4' ? 'income' : 'expense'; }
function bkNextMonth(m){ const [y, mo] = m.split('-').map(Number); return mo === 12 ? (y + 1) + '-01' : y + '-' + String(mo + 1).padStart(2, '0'); }
function lgR(n){ return Math.round((Number(n) || 0) * 100) / 100; }

/* ---- posting rules (the same rules the server uses in ledger_expected) ---- */
function lgAcctMethod(m){ m = String(m || '').toLowerCase(); return m === 'cash' ? '1000' : ['gcash', 'maya', 'grabpay', 'shopeepay'].includes(m) ? '1010' : m === 'credit_note' ? '4020' : m === 'ewt' ? '1410' : '1020'; }
function lgAcctPaidFrom(m){ return {cash: '1000', gcash: '1010', maya: '1010', bank: '1020', card: '2060', owner: '3000', credit: '2050'}[String(m || '').toLowerCase()] || '1000'; }
const LG_CAT_ACCT = {'Electricity': '6010', 'Water': '6020', 'Internet & phone': '6030', 'Gas (LPG)': '6040', 'Rent': '6100', 'Salaries': '6200', 'Staff advance (vale)': '1150',
  'Stock bought in cash': '5000', 'Fuel & transport': '6300', 'Delivery & shipping': '6310', 'Supplies': '6400', 'Repairs': '6500', 'Food & meals': '6600', 'Taxes & permits': '6700',
  'Bank & GCash fees': '6800', 'Marketing': '6900', 'Owner took money': '3100', 'Cash to bank': '1020', 'Owner put in cash': '1000'};
function lgAcctCategory(c){ return LG_CAT_ACCT[c] || '6990'; }
function lgL(a, amt, side, party){ amt = lgR(amt); if(!amt) return null; const deb = (side === 'd') === (amt > 0); return {a, d: deb ? Math.abs(amt) : 0, c: deb ? 0 : Math.abs(amt), p: party || null}; }
function lgLs(){ return [...arguments].flat().filter(Boolean); }
function lgVat(total, rate){ rate = Number(rate) || 0; return rate ? lgR(total * rate / (1 + rate)) : 0; }
function lgPoCounted(p){ return (p.confirmStatus || 'confirmed') === 'confirmed' && !(p.method === 'check' && p.checkStatus !== 'cleared'); }
function lgExpected(){
  const out = [], add = (type, id, date, memo, lines, branch) => { if(date) out.push({type, id: String(id), date: String(date).slice(0, 10), memo, branch: branch || null, lines}); };
  BK.sales.filter(s => !s.voidedAt).forEach(s => {
    const same = (s.payments || []).filter(p => !bkPayDate(p) || bkPayDate(p) === s.date), later = (s.payments || []).filter(p => bkPayDate(p) && bkPayDate(p) !== s.date);
    const byAcct = {}; same.forEach(p => { const a = lgAcctMethod(p.method); byAcct[a] = (byAcct[a] || 0) + (Number(p.amount) || 0); });
    const paid = same.reduce((a, p) => a + (Number(p.amount) || 0), 0);
    const cost = (s.lines || []).filter(l => !l.totalOnly && Number(l.unitCost) > 0).reduce((a, l) => a + (Number(l.qty) || 0) * Number(l.unitCost), 0);
    add('sale', s.id, s.date, 'Counter sale' + (s.customer && s.customer !== 'Walk-in' ? ' · ' + s.customer : ''),
      lgLs(Object.entries(byAcct).map(([a, v]) => lgL(a, v, 'd')), lgL('1100', s.total - paid, 'd', s.customer || 'Walk-in'), lgL('4000', s.total, 'c'), lgL('5000', cost, 'd'), lgL('1200', cost, 'c')), s.branch);
    later.forEach((p, i) => add('sale_pay', s.id + ':' + i, bkPayDate(p), 'Utang paid', lgLs(lgL(lgAcctMethod(p.method), p.amount, 'd'), lgL('1100', p.amount, 'c', s.customer || 'Walk-in')), s.branch));
  });
  BK.expenses.filter(e => !e.deletedAt && (e.status || 'approved') === 'approved').forEach(e => {
    add('expense', e.id, e.date, e.category + (e.staff || e.vendor ? ' · ' + (e.staff || e.vendor) : ''),
      e.category === 'Owner put in cash' ? lgLs(lgL('1000', e.amount, 'd'), lgL('3000', e.amount, 'c'))
        : lgLs(lgL(lgAcctCategory(e.category), e.amount, 'd', e.staff || e.vendor), lgL(lgAcctPaidFrom(e.paidFrom), e.amount, 'c')), e.branch);
  });
  purchaseOrders.forEach(po => {
    const side = po.supplierId === ME_SUPPLIER ? 'sell' : po.buyerId === ME_BUYER ? 'buy' : null;
    if(!side || ['draft', 'cancelled'].includes(po.status)) return;
    const party = side === 'sell' ? po.buyerName : po.supplierName;
    if(po.invoice){
      const tot = Number(po.invoice.statedTotal) || poTotal(po), vat = lgVat(tot, po.taxRate), d = po.invoice.issuedDate || po.createdDate;
      const no = po.invoice.number || po.poNumber;
      if(side === 'sell') add('po_sale', po.id, d, 'Invoice ' + no + ' · ' + party, po.invoice.opening ? lgLs(lgL('1100', tot, 'd', party), lgL('3900', tot, 'c'))
        : lgLs(lgL('1100', tot, 'd', party), lgL('4010', tot - vat, 'c'), lgL('2100', vat, 'c')));
      else add('po_bill', po.id, d, 'Supplier bill ' + no + ' · ' + party, po.invoice.opening ? lgLs(lgL('3900', tot, 'd'), lgL('2000', tot, 'c', party))
        : lgLs(lgL('1200', tot - vat, 'd'), lgL('1400', vat, 'd'), lgL('2000', tot, 'c', party)));
      if(side === 'sell' && !po.invoice.opening){
        const cost = (po.lineItems || []).reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.unitCost) || bkStockCost(l.product)), 0);
        add('po_cogs', po.id, d, 'Cost of order ' + po.poNumber, lgLs(lgL('5000', cost, 'd'), lgL('1200', cost, 'c')));
      }
    }
    const inv = (po.invoice && po.invoice.payments) || [], ids = new Set(inv.map(p => p.id).filter(Boolean));
    const pays = inv.map((p, i) => ['inv:' + (p.id || i + 1), p]).concat((po.depositPayments || []).filter(p => !p.id || !ids.has(p.id)).map((p, i) => ['dep:' + (p.id || i + 1), p]));
    if(po.codPayment) pays.push(['cod', po.codPayment]);
    pays.forEach(([k, p]) => {
      if(!(Number(p.amount) > 0)) return;
      if(side === 'sell' ? !lgPoCounted(p) : (p.confirmStatus || '') === 'rejected') return;
      const d = bkPayDate(p) || po.createdDate;
      if(side === 'sell') add('po_pay', po.id + ':' + k, d, 'Payment · ' + party + ' · ' + po.poNumber, lgLs(lgL(lgAcctMethod(p.method), p.amount, 'd'), lgL('1100', p.amount, 'c', party)));
      else add('po_bill_pay', po.id + ':' + k, d, 'Payment · ' + party + ' · ' + po.poNumber,
        lgLs(lgL('2000', p.amount, 'd', party), lgL(p.method === 'credit_note' ? '1200' : p.method === 'ewt' ? '2100' : lgAcctMethod(p.method), p.amount, 'c')));
    });
  });
  BK.moves.forEach(m => {
    const cost = Number(m.unitCost) || 0, v = (Number(m.qty) || 0) * cost;
    if(!cost || !m.qty || !['opening', 'bad', 'count', 'adjust', 'used'].includes(m.kind)) return;
    const memo = ({opening: 'Starting stock', bad: 'Bad stock', count: 'Count difference', used: 'Used in the store'}[m.kind] || 'Stock changed by hand') + ' · ' + m.item;
    add('stock', m.id, m.date, memo, m.kind === 'opening' ? lgLs(lgL('1200', v, 'd'), lgL('3900', v, 'c')) : m.kind === 'used' ? lgLs(lgL('6400', -v, 'd'), lgL('1200', -v, 'c'))
      : lgLs(lgL(m.kind === 'adjust' ? '5110' : '5100', -v, 'd'), lgL('1200', -v, 'c')));
  });
  BK.counts.filter(c => !c.reopenedAt && Math.abs(Number(c.difference) || 0) >= 0.01).forEach(c => add('cash_count', c.id, c.day, 'Cash count · ' + (c.drawer || 'Main') + ' drawer',
    c.difference < 0 ? lgLs(lgL('6960', -c.difference, 'd'), lgL('1000', -c.difference, 'c')) : lgLs(lgL('1000', c.difference, 'd'), lgL('4900', c.difference, 'c')), c.drawer));
  (typeof depositsCache !== 'undefined' && depositsCache || []).forEach(d => add('deposit', d.id, d.deposited_on, 'Cash to bank' + (d.bank ? ' · ' + d.bank : ''), lgLs(lgL('1020', d.amount, 'd'), lgL('1000', d.amount, 'c')), d.branch));
  (typeof PR !== 'undefined' ? PR.runs : []).filter(r => r.status === 'paid').forEach(r => {
    const ls = PR.lines.filter(l => l.run_id === r.id), s = k => ls.reduce((a, l) => a + (Number(l[k]) || 0), 0);
    add('payroll', r.id, r.paid_on, 'Payroll ' + bkDayLabel(r.period_from) + '–' + bkDayLabel(r.period_to), lgLs(lgL('6200', s('gross'), 'd'), lgL('6210', s('contrib_employer'), 'd'),
      lgL('1150', s('vale_deduct'), 'c'), lgL('2300', s('contrib_employee') + s('contrib_employer'), 'c'), lgL('2310', s('other_deduct'), 'c'), lgL(lgAcctPaidFrom(r.paid_from), s('net'), 'c')), r.branch);
  });
  return out;
}
// The demo's journal: the rules above, plus sample opening balances so the balance sheet reads like a real shop's.
function lgBuildDemo(){
  const st = lgDemoStore();
  const entries = [], lines = [];
  const push = (e, ls) => { entries.push(e); ls.forEach(l => lines.push(Object.assign({eid: e.id}, l))); };
  lgExpected().forEach((x, i) => { if(x.lines.length) push({id: 'A' + i, date: x.date, memo: x.memo, kind: 'auto', type: x.type, sid: x.id, status: 'posted', branch: x.branch, by: 'Nifti'}, x.lines); });
  // sample opening balances (marked as such): cash on hand, bank, and the stock already on the shelf
  const first = entries.reduce((m, e) => e.date < m ? e.date : m, APP_TODAY), od = addDaysIso(first, -1);
  const inv = lines.filter(l => l.a === '1200').reduce((a, l) => a + l.d - l.c, 0);
  const shelf = inventoryData.reduce((a, i) => a + Math.max(0, Number(i.onHand) || 0) * (Number(i.unitCost) || 0), 0);
  // fixed the first time so later sales, expenses and payroll move cash and bank like they would in real life
  if(!st.ob){ const cash = lines.filter(l => l.a === '1000').reduce((a, l) => a + l.d - l.c, 0), bank = lines.filter(l => l.a === '1020').reduce((a, l) => a + l.d - l.c, 0);
    st.ob = {cash: lgR(Math.max(0, 30000 - cash)), bank: lgR(Math.max(0, 350000 - bank))}; lgDemoSave(st); }
  const ob = lgLs(lgL('1200', shelf - inv, 'd'), lgL('1000', st.ob.cash, 'd'), lgL('1020', st.ob.bank, 'd'));
  const obTot = ob.reduce((a, l) => a + l.d - l.c, 0);
  if(ob.length) push({id: 'OB', date: od, memo: 'Opening balances (sample)', kind: 'auto', type: 'opening', sid: 'demo', status: 'posted', by: 'Nifti'}, ob.concat([lgL('3900', obTot, 'c')]).filter(Boolean));
  (st.manual || []).forEach(e => push(e, e.lines));
  LG.accounts = LG_ACCOUNTS.map(([code, name, type]) => ({code, name, type, is_system: true, active: true})).concat(st.accounts || []);
  (st.renamed ? Object.entries(st.renamed) : []).forEach(([c, n]) => { const a = LG.accounts.find(x => x.code === c); if(a) a.name = n; });
  LG.entries = entries.sort((a, b) => a.date.localeCompare(b.date)); LG.lines = lines;
  LG.periods = st.periods || []; LG.syncedAt = new Date().toISOString(); LG.demo = true; LG.loaded = true;
}
async function lgLoad(force){
  if(!BK.loaded) await bkLoad();
  if(typeof prLoad === 'function') await prLoad();
  if(!myBusiness){ if(typeof depositsCache === 'undefined' || !depositsCache) window.depositsCache = window._demoDeposits || (window._demoDeposits = []); lgBuildDemo(); return; }
  if(!booksCanSeeTotals()){ LG.loaded = true; return; }
  if(LG.loaded && !force && LG.at && Date.now() - LG.at < 90000) return;
  if(LG.loading) return LG.loading;
  LG.loading = (async () => {
    const s = await sb.rpc('ledger_sync');
    LG.syncError = s.error ? s.error.message : '';
    const [a, e, l, p] = await Promise.all([
      sb.from('ledger_accounts').select('*').eq('business_id', myBusiness.id).order('code'),
      sb.from('journal_entries').select('id,entry_date,memo,kind,source_type,source_id,status,branch,created_by_name,reversal_of,created_at').eq('business_id', myBusiness.id).order('entry_date').limit(20000),
      sb.from('journal_lines').select('entry_id,account_code,debit,credit,party,memo').eq('business_id', myBusiness.id).limit(60000),
      sb.from('accounting_periods').select('*').eq('business_id', myBusiness.id),
    ]);
    LG.accounts = a.data || [];
    LG.entries = (e.data || []).map(r => ({id: r.id, date: r.entry_date, memo: r.memo, kind: r.kind, type: r.source_type, sid: r.source_id, status: r.status, branch: r.branch, by: r.created_by_name, reversalOf: r.reversal_of, at: r.created_at}));
    LG.lines = (l.data || []).map(r => ({eid: r.entry_id, a: r.account_code, d: Number(r.debit), c: Number(r.credit), p: r.party, m: r.memo}));
    LG.periods = p.data || [];
    LG.syncedAt = (s.data && s.data.at) || new Date().toISOString(); LG.at = Date.now(); LG.loaded = true; LG.loading = null;
    if(e.error || l.error) LG.syncError = (e.error || l.error).message;
  })().catch(err => { LG.loading = null; LG.syncError = String(err.message || err); LG.loaded = true; });
  return LG.loading;
}
function lgInvalidate(){ LG.at = 0; if(!myBusiness) LG.loaded = false; }

/* ---- periods and sums ---- */
function lgMonthLocked(day){ const p = String(day || '').slice(0, 7) + '-01'; return LG.periods.some(x => String(x.period).slice(0, 10) === p && x.status === 'locked'); }
function lgEntryMap(){ const m = {}; LG.entries.forEach(e => { m[e.id] = e; }); return m; }
// Sum of lines per account for entries dated within [from, to] (inclusive) and, optionally, one branch.
function lgSums(from, to, branch){
  const em = lgEntryMap(), out = {};
  LG.lines.forEach(l => {
    const e = em[l.eid]; if(!e) return;
    if(from && e.date < from) return; if(to && e.date > to) return;
    if(branch && (e.branch || '') !== branch) return;
    const r = out[l.a] = out[l.a] || {d: 0, c: 0}; r.d += l.d; r.c += l.c;
  });
  return out;
}
function lgBal(sums, code){ const r = sums[code]; if(!r) return 0; const t = lgAcct(code).type; return lgR(['asset', 'expense'].includes(t) ? r.d - r.c : r.c - r.d); }
function lgTotalOf(sums, type){ return lgR(Object.keys(sums).filter(c => lgAcct(c).type === type).reduce((a, c) => a + lgBal(sums, c), 0)); }
function lgPnlFor(from, to, branch){
  const s = lgSums(from, to, branch);
  const revenue = lgR(lgBal(s, '4000') + lgBal(s, '4010') + lgBal(s, '4020'));
  const cogs = lgBal(s, '5000');
  const other = lgBal(s, '4900');
  const opex = {}; Object.keys(s).filter(c => lgAcct(c).type === 'expense' && c !== '5000').forEach(c => { const v = lgBal(s, c); if(v) opex[c] = v; });
  const opexTot = lgR(Object.values(opex).reduce((a, v) => a + v, 0));
  const gross = lgR(revenue - cogs);
  return {s, revenue, counter: lgBal(s, '4000'), orders: lgBal(s, '4010'), credits: -lgBal(s, '4020'), cogs, gross, margin: revenue ? gross / revenue : null, opex, opexTot, other, net: lgR(gross - opexTot + other)};
}
function lgRange(kind, ref){
  const t = ref || APP_TODAY, y = t.slice(0, 4), mo = Number(t.slice(5, 7));
  const end = m => { const d = new Date(m + '-01T00:00:00'); d.setMonth(d.getMonth() + 1); d.setDate(0); return d.toISOString().slice(0, 10); };
  if(kind === 'month') return {from: t.slice(0, 7) + '-01', to: end(t.slice(0, 7)), label: bkMonthLabel(t.slice(0, 7))};
  if(kind === 'quarter'){ const q = Math.floor((mo - 1) / 3), m1 = y + '-' + String(q * 3 + 1).padStart(2, '0'); return {from: m1 + '-01', to: end(y + '-' + String(q * 3 + 3).padStart(2, '0')), label: 'Q' + (q + 1) + ' ' + y}; }
  if(kind === 'year') return {from: y + '-01-01', to: y + '-12-31', label: y};
  return {from: '1900-01-01', to: t, label: 'All time'};
}
function lgPrevRange(r){
  const days = daysBetween(r.from, r.to) + 1;
  if(/-01$/.test(r.from) && days <= 31){ const m = bkPrevMonth(r.from.slice(0, 7)); return lgRange('month', m + '-01'); }
  return {from: addDaysIso(r.from, -days), to: addDaysIso(r.from, -1), label: 'previous period'};
}

/* ---- drill-through: every line opens the record it came from ---- */
function lgOpenSource(eid){
  const e = LG.entries.find(x => x.id === eid); if(!e) return;
  const id = String(e.sid || '').split(':')[0];
  const go2 = (page, fn) => { slClose('lgEntry'); go(page); if(fn) setTimeout(fn, 120); };
  if(e.type === 'sale' || e.type === 'sale_pay'){ const s = BK.sales.find(x => x.id === id); go2('sales', () => { if(s){ bkSalesDay = s.date; renderSalesBooksPage(); } }); }
  else if(e.type === 'expense'){ const x = BK.expenses.find(z => z.id === id); go2('expenses', () => { if(x){ bkMonthSel = bkMonth(x.date); renderExpensesPage(); } }); }
  else if(['po_sale', 'po_pay', 'po_cogs'].includes(e.type)){ slClose('lgEntry'); if(getPO(id)){ setLens('supplier'); openOrderDetailModal(id, true); } else showToast('That order is no longer on this device.'); }
  else if(['po_bill', 'po_bill_pay'].includes(e.type)){ slClose('lgEntry'); if(getPO(id)){ setLens('buyer'); openOrderDetailModal(id, false); } else showToast('That order is no longer on this device.'); }
  else if(e.type === 'stock') go2('inventory', () => openStockSheet('history'));
  else if(e.type === 'cash_count'){ const c = BK.counts.find(x => x.id === id); go2('cashcount', () => { if(c){ ccStart(c.day); renderCashCountPage(); } }); }
  else if(e.type === 'deposit'){ slClose('lgEntry'); colTab = 'cash'; pickLens('collections', 'supplier'); }
  else if(e.type === 'payroll') go2('payroll', () => prOpenRun(id));
  else showToast('This entry was typed in by hand. Its lines are shown here.');
}
const LG_SRC = {sale: 'Counter sale', sale_pay: 'Utang payment', expense: 'Expense', po_sale: 'Invoice', po_cogs: 'Cost of order', po_pay: 'Customer payment', po_bill: 'Supplier bill',
  po_bill_pay: 'Supplier payment', stock: 'Stock change', cash_count: 'Cash count', deposit: 'Bank deposit', payroll: 'Payroll', manual: 'Typed-in entry', opening: 'Opening balances'};
function lgShowEntry(eid){
  const e = LG.entries.find(x => x.id === eid); if(!e) return;
  const ls = LG.lines.filter(l => l.eid === eid);
  const rev = e.reversalOf ? LG.entries.find(x => x.id === e.reversalOf) : null, revBy = LG.entries.find(x => x.reversalOf === e.id);
  slModal('lgEntry', `<div class="sl-sheet-h"><b>${escapeHtml(e.memo || 'Entry')}</b><button class="sl-x" onclick="slClose('lgEntry')">✕</button></div>
    <div class="sl-sub">${bkDayLabel(e.date)} · ${escapeHtml(LG_SRC[e.type] || 'Entry')} · ${e.kind === 'reversal' ? 'reversal' : e.status === 'reversed' ? '<span class="bk-bad">reversed</span>' : 'posted'}${e.by ? ' · by ' + escapeHtml(e.by) : ''}${e.branch ? ' · ' + escapeHtml(e.branch) : ''}</div>
    <table class="lg-tbl bk-tbl lg-entry"><thead><tr><th>Account</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>
    ${ls.map(l => `<tr><td>${escapeHtml(l.a + ' · ' + lgAcct(l.a).name)}${l.p ? `<small class="bk-sub">${escapeHtml(l.p)}</small>` : ''}</td><td class="r">${l.d ? bkPeso(l.d) : ''}</td><td class="r">${l.c ? bkPeso(l.c) : ''}</td></tr>`).join('')}
    <tr class="lg-tot"><td>Total</td><td class="r">${bkPeso(ls.reduce((a, l) => a + l.d, 0))}</td><td class="r">${bkPeso(ls.reduce((a, l) => a + l.c, 0))}</td></tr></tbody></table>
    ${rev ? `<div class="bk-note">This undoes <a class="lg-link" onclick="lgShowEntry('${rev.id}')">${escapeHtml(rev.memo || 'an entry')}</a>.</div>` : ''}
    ${revBy ? `<div class="bk-note">Undone by <a class="lg-link" onclick="lgShowEntry('${revBy.id}')">${escapeHtml(revBy.memo || 'a reversal')}</a> on ${bkDayLabel(revBy.date)}.</div>` : ''}
    <div class="bk-actions">${e.type && e.type !== 'manual' && e.type !== 'opening' ? `<button class="btn btn-outline" onclick="lgOpenSource('${e.id}')">Open the ${escapeHtml((LG_SRC[e.type] || 'record').toLowerCase())}</button>` : ''}
      ${e.kind === 'manual' && e.status === 'posted' ? `<button class="btn btn-outline" onclick="lgReverseManual('${e.id}')">Reverse this entry</button>` : ''}</div>`);
}

/* ---- the Books & reports page ---- */
let LGV = {tab: 'summary', range: 'month', ref: null, branch: '', acct: '1000'};
function lgRangeNow(){ return lgRange(LGV.range, LGV.ref || APP_TODAY); }
function lgToolbar(){
  const opts = [['month', 'This month'], ['lastmonth', 'Last month'], ['quarter', 'This quarter'], ['year', 'This year'], ['lastyear', 'Last year'], ['all', 'All time']];
  const cur = LGV.range === 'month' && LGV.ref ? 'lastmonth' : LGV.range === 'year' && LGV.ref ? 'lastyear' : LGV.range;
  const br = bkBranches();
  return `<div class="bk-toolbar"><select aria-label="Period" onchange="lgSetRange(this.value)">${opts.map(([k, l]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${l}</option>`).join('')}</select>
    ${br.length > 1 ? `<select aria-label="Branch" onchange="LGV.branch=this.value; renderLedgerPage()"><option value="">All branches</option>${br.map(b => `<option ${LGV.branch === b.name ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}</select>` : ''}
    <span class="bk-dim lg-period">${escapeHtml(lgRangeNow().label)}</span></div>`;
}
function lgSetRange(v){
  LGV.ref = null; LGV.range = v;
  if(v === 'lastmonth'){ LGV.range = 'month'; LGV.ref = bkPrevMonth(APP_TODAY.slice(0, 7)) + '-01'; }
  if(v === 'lastyear'){ LGV.range = 'year'; LGV.ref = (Number(APP_TODAY.slice(0, 4)) - 1) + '-06-01'; }
  renderLedgerPage();
}
const LG_TABS = [['summary', 'Summary'], ['pnl', 'Profit & loss'], ['bs', 'Balance sheet'], ['cash', 'Cash flow'], ['tb', 'Trial balance'], ['gl', 'Ledger'], ['journal', 'Journal'], ['accounts', 'Accounts']];
async function renderLedgerPage(){
  const body = document.getElementById('lgBody'); if(!body) return;
  if(!booksCanSeeTotals()){ body.innerHTML = bkLockedForStaff('money'); return; }
  if(!LG.loaded){ body.innerHTML = bkLoadingHtml(); await lgLoad(); if(!document.getElementById('lgBody')) return; }
  const tabs = `<div class="lens-tabs lg-tabs" role="tablist">${LG_TABS.map(([k, l]) => `<button role="tab" class="${LGV.tab === k ? 'on' : ''}" onclick="LGV.tab='${k}'; renderLedgerPage()">${l}</button>`).join('')}</div>`;
  const fn = {summary: lgSummaryHtml, pnl: lgPnlHtml, bs: lgBsHtml, cash: lgCashHtml, tb: lgTbHtml, gl: lgGlHtml, journal: lgJournalHtml, accounts: lgAccountsHtml}[LGV.tab] || lgSummaryHtml;
  body.innerHTML = tabs + (['summary', 'pnl', 'cash', 'tb', 'gl', 'journal'].includes(LGV.tab) ? lgToolbar() : LGV.tab === 'bs' ? lgAsOfToolbar() : '') + lgStatusBar() + fn();
}
function lgStatusBar(){
  const when = LG.syncedAt ? new Date(LG.syncedAt).toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) : '—';
  return `<div class="lg-status">${LG.demo ? '<span class="lg-pill demo">Sample data</span>' : ''}<span>Books updated ${escapeHtml(when)}</span>
    <span>· Bank: ${bkBankStatusText()}</span>${LG.syncError ? `<span class="bk-bad">· Couldn't update: ${escapeHtml(LG.syncError)}</span>` : ''}
    ${myBusiness ? `<button class="sl-link" onclick="lgLoad(true).then(renderLedgerPage)">Update now</button>` : ''}</div>`;
}
function bkBankStatusText(){
  const m = (typeof bankMatchesCache !== 'undefined' && bankMatchesCache) || [];
  const last = m.map(x => x.line && x.line.date).filter(Boolean).sort().pop();
  return last ? `statement matched up to ${bkDayLabel(last)} (uploaded, not a live connection)` : 'no statement uploaded yet (not connected)';
}
function lgAsOfToolbar(){ return `<div class="bk-toolbar"><label class="bk-dim">As of <input type="date" value="${LGV.asOf || APP_TODAY}" max="${APP_TODAY}" onchange="LGV.asOf=this.value||null; renderLedgerPage()"></label></div>`; }
function lgMoneyRow(label, v, opts){
  opts = opts || {};
  return `<div class="pl-r${opts.cls ? ' ' + opts.cls : ''}"${opts.code ? ` role="button" tabindex="0" onclick="LGV.acct='${opts.code}'; LGV.tab='gl'; renderLedgerPage()"` : ''}><span>${label}</span><b class="${v < 0 && opts.neg ? 'bk-bad' : ''}">${bkPeso(v)}</b></div>`;
}
function lgSummaryHtml(){
  const r = lgRangeNow(), p = lgPnlFor(r.from, r.to, LGV.branch), prev = lgPnlFor(lgPrevRange(r).from, lgPrevRange(r).to, LGV.branch);
  const all = lgSums(null, r.to, LGV.branch);
  const cash = lgBal(all, '1000') + lgBal(all, '1010') + lgBal(all, '1020');
  const ar = lgBal(all, '1100'), ap = lgBal(all, '2000') + lgBal(all, '2050'), invv = lgBal(all, '1200');
  const shelf = inventoryData.reduce((a, i) => a + Math.max(0, Number(i.onHand) || 0) * (Number(i.unitCost) || 0), 0);
  const noCost = inventoryData.filter(i => Number(i.onHand) > 0 && !(Number(i.unitCost) > 0)).length;
  const pct = v => v == null ? '—' : Math.round(v * 100) + '%';
  const ch = (a, b) => b ? `${a >= b ? '▲' : '▼'} ${bkPeso(Math.abs(a - b))} vs ${escapeHtml(lgPrevRange(r).label)}` : '';
  const changes = lgWhatChanged(p, prev, r);
  return `<div class="bk-tiles lg-tiles">
      ${bkTile('Sales', bkPeso(p.revenue), ch(p.revenue, prev.revenue))}
      ${bkTile('Gross profit', bkPeso(p.gross), 'margin ' + pct(p.margin), p.gross < 0 ? 'bad' : '')}
      ${bkTile('Costs (expenses)', bkPeso(p.opexTot), ch(p.opexTot, prev.opexTot))}
      ${bkTile('Net profit', bkPeso(p.net), p.net < 0 ? 'loss for the period' : 'after all costs', p.net < 0 ? 'bad' : 'good')}
      ${bkTile('Cash, GCash & bank', bkPeso(cash), 'recorded in Nifti, not a bank balance')}
      ${bkTile('Customers owe you', bkPeso(ar), 'receivables', '', "pickLens('collections','supplier')")}
      ${bkTile('You owe', bkPeso(ap), 'suppliers and unpaid bills', '', "pickLens('collections','buyer')")}
      ${bkTile('Stock value', bkPeso(invv), Math.abs(invv - shelf) >= 1000 ? `shelf says ${bkPeso(shelf)}` : 'matches the shelf', Math.abs(invv - shelf) >= 1000 ? 'warn' : '')}</div>
    <section class="panel-card bk-list"><div class="panel-head"><h2>What changed</h2><span class="bk-dim">vs ${escapeHtml(lgPrevRange(r).label)}</span></div>
      ${changes.length ? changes.map(c => lgInsightCard(c)).join('') : '<div class="bk-empty"><span>Not enough history yet to compare. This fills in after a full month of records.</span></div>'}</section>
    <section class="panel-card"><div class="panel-head"><h2>How sure are these numbers?</h2></div>${lgConfidenceHtml(noCost)}</section>`;
}
// Explainable "what changed" cards: each one says what, why it matters, the evidence, and what to do.
function lgWhatChanged(p, prev, r){
  const out = [], pct = (a, b) => b ? Math.round((a - b) / Math.abs(b) * 100) : null;
  if(prev.revenue >= 1 && Math.abs(pct(p.revenue, prev.revenue)) >= 10) out.push({lvl: p.revenue < prev.revenue ? 'amber' : 'green', t: Math.abs(pct(p.revenue, prev.revenue)) > 300 ? `Sales ${p.revenue < prev.revenue ? 'much lower' : 'much higher'} than ${lgPrevRange(r).label}` : `Sales ${p.revenue < prev.revenue ? 'down' : 'up'} ${Math.abs(pct(p.revenue, prev.revenue))}%`,
    what: `${bkPeso(p.revenue)} vs ${bkPeso(prev.revenue)}.`, why: p.revenue < prev.revenue ? 'Less money coming in for the same rent and salaries.' : 'Check that profit grew too, not just sales.',
    ev: 'Accounts 4000 and 4010', code: '4010', next: p.revenue < prev.revenue ? 'See which customers ordered less on Follow-ups.' : 'Compare gross margin below.', basis: 'Posted sales'});
  if(p.margin != null && prev.margin != null && Math.abs(p.margin - prev.margin) >= 0.03) out.push({lvl: p.margin < prev.margin ? 'red' : 'green', t: `Gross margin ${p.margin < prev.margin ? 'fell' : 'rose'} to ${Math.round(p.margin * 100)}%`,
    what: `It was ${Math.round(prev.margin * 100)}%. Every ₱100 sold now leaves ${bkPeso(p.margin * 100)} after the cost of goods.`, why: 'Margin pays for everything else. A small drop adds up across all sales.',
    ev: 'Cost of goods sold (5000) vs sales', code: '5000', next: 'Open Profit & prices: look for cost increases and sales below cost.', basis: (bkLiveSales().some(s => (s.lines || []).some(l => !l.totalOnly && !(Number(l.unitCost) > 0))) ? 'Partial: some sales have no cost' : 'Posted sales and costs')});
  const cats = new Set(Object.keys(p.opex).concat(Object.keys(prev.opex)));
  [...cats].map(c => ({c, now: p.opex[c] || 0, was: prev.opex[c] || 0})).filter(x => x.now - x.was >= 1000 && (x.was === 0 || x.now / x.was >= 1.25))
    .sort((a, b) => (b.now - b.was) - (a.now - a.was)).slice(0, 3).forEach(x => out.push({lvl: 'amber', t: `${lgAcct(x.c).name} up ${bkPeso(x.now - x.was)}`,
      what: `${bkPeso(x.now)} vs ${bkPeso(x.was)}.`, why: 'Costs growing faster than sales eat the profit.', ev: `Account ${x.c}`, code: x.c, next: 'Open the ledger lines and check each bill.', basis: 'Approved expenses'}));
  if(p.net < 0 && prev.net >= 0) out.push({lvl: 'red', t: 'The period shows a loss', what: `Net ${bkPeso(p.net)} after ${bkPeso(p.opexTot)} in costs.`, why: 'Losses use up cash and stock.', ev: 'Profit & loss', next: 'Check the biggest costs and whether all sales are recorded.', basis: 'Posted entries'});
  return out;
}
function lgInsightCard(c){
  return `<div class="lg-card ${c.lvl}"><div class="lg-card-h"><span class="bk-dot ${c.lvl}" aria-hidden="true"></span><b>${escapeHtml(c.t)}</b><span class="lg-pill">${escapeHtml(c.basis || '')}</span></div>
    <div class="lg-card-g"><span>What happened</span><p>${escapeHtml(c.what)}</p><span>Why it matters</span><p>${escapeHtml(c.why)}</p><span>Evidence</span><p>${c.code ? `<a class="lg-link" onclick="LGV.acct='${c.code}'; LGV.tab='gl'; renderLedgerPage()">${escapeHtml(c.ev)}</a>` : escapeHtml(c.ev)}</p><span>Next step</span><p>${escapeHtml(c.next)}</p></div></div>`;
}
function lgConfidenceHtml(noCost){
  const pending = BK.expenses.filter(e => !e.deletedAt && e.status === 'submitted').length;
  const sum = bkCashSummary(bkMonth(APP_TODAY));
  const iss = typeof issuesAll === 'function' ? issuesAll().filter(i => !['resolved', 'accepted'].includes(i.status)).length : 0;
  const costless = bkLiveSales().filter(s => (s.lines || []).some(l => !l.totalOnly && !(Number(l.unitCost) > 0))).length;
  const row = (ok, t, s, a) => `<div class="lg-conf ${ok ? 'ok' : 'warn'}"><span aria-hidden="true">${ok ? '✓' : '!'}</span><div><b>${t}</b><small>${s}</small></div>${a && !ok ? `<button class="sl-link" onclick="${a}">Fix</button>` : ''}</div>`;
  return row(!pending, pending ? `${pending} expense${pending > 1 ? 's' : ''} waiting for your OK` : 'Every expense is approved', 'Waiting expenses are not in the books yet.', "go('expenses')")
    + row(!sum.notCounted.length, sum.notCounted.length ? `${sum.notCounted.length} day${sum.notCounted.length > 1 ? 's' : ''} with sales but no cash count` : 'Cash counted on every sales day', 'Uncounted days can hide shortages.', "go('cashcount')")
    + row(!noCost && !costless, noCost || costless ? `${noCost} stock item${noCost === 1 ? '' : 's'} and ${costless} sale${costless === 1 ? '' : 's'} without a cost` : 'Every item has a cost', 'Profit is overstated where costs are missing.', "go('profit')")
    + row(!!((typeof bankMatchesCache !== 'undefined' && bankMatchesCache) || []).length, (bankMatchesCache || []).length ? 'Bank statement matched' : 'No bank statement matched yet', 'Bank figures are what you recorded until you upload a statement.', "colTab='cash'; pickLens('collections','supplier')")
    + row(!iss, iss ? `${iss} item${iss > 1 ? 's' : ''} to check` : 'Nothing waiting to check', 'Open issues may change these numbers.', "go('issues')")
    + `<div class="bk-note">Nifti does not connect to your bank, GCash or the BIR. Tax figures are preparation aids for you and your accountant, not filed returns.</div>`;
}
function lgPnlHtml(){
  const r = lgRangeNow(), p = lgPnlFor(r.from, r.to, LGV.branch);
  const pct = v => v == null ? '' : ` <small>(${Math.round(v * 100)}%)</small>`;
  const exp = Object.entries(p.opex).sort((a, b) => b[1] - a[1]);
  return `<section class="panel-card pl"><div class="panel-head"><h2>Profit &amp; loss · ${escapeHtml(r.label)}</h2><div class="bk-head-act"><button class="btn btn-outline" onclick="lgExport('pnl')">⬇ CSV</button><button class="btn btn-outline" onclick="window.print()">Print</button></div></div>
    ${lgMoneyRow('Counter sales', p.counter, {code: '4000', cls: 'pl-sub'})}${lgMoneyRow('Sales to customers (orders)', p.orders, {code: '4010', cls: 'pl-sub'})}${p.credits ? lgMoneyRow('− Credits and returns given', -p.credits, {code: '4020', cls: 'pl-sub'}) : ''}
    ${lgMoneyRow('Sales', p.revenue, {cls: 'pl-strong'})}
    ${lgMoneyRow('− Cost of goods sold', -p.cogs, {code: '5000'})}
    <div class="pl-r pl-strong pl-line"><span>Gross profit${pct(p.margin)}</span><b>${bkPeso(p.gross)}</b></div>
    ${exp.map(([c, v]) => lgMoneyRow('− ' + escapeHtml(lgAcct(c).name), -v, {code: c, cls: 'pl-sub'})).join('')}
    ${lgMoneyRow('Total costs', -p.opexTot, {cls: 'pl-strong'})}
    ${p.other ? lgMoneyRow('+ Other income', p.other, {code: '4900'}) : ''}
    <div class="pl-r pl-total"><span>Net profit</span><b class="${p.net < 0 ? 'bk-bad' : 'bk-good'}">${bkPeso(p.net)}</b></div>
    <div class="bk-note">Sales count when invoiced or sold at the counter. Costs count when approved. Tap any line to see the entries behind it. Owner drawings are not costs; they're on the balance sheet.</div></section>`;
}
function lgBsHtml(){
  const asOf = LGV.asOf || APP_TODAY, s = lgSums(null, asOf);
  const group = type => Object.keys(s).filter(c => lgAcct(c).type === type).sort().map(c => ({c, v: lgBal(s, c)})).filter(x => Math.abs(x.v) >= 0.005);
  const earnings = lgR(lgTotalOf(s, 'income') - lgTotalOf(s, 'expense'));
  const A = group('asset'), L = group('liability'), E = group('equity');
  const tA = lgR(A.reduce((a, x) => a + x.v, 0)), tL = lgR(L.reduce((a, x) => a + x.v, 0)), tE = lgR(E.reduce((a, x) => a + x.v, 0) + earnings);
  const rows = xs => xs.map(x => lgMoneyRow(escapeHtml(x.c + ' · ' + lgAcct(x.c).name), x.v, {code: x.c, cls: 'pl-sub', neg: true})).join('');
  const all = lgSums(null, asOf);
  const ca = ['1000', '1010', '1020', '1100', '1150', '1200', '1400', '1410'].reduce((a, c) => a + lgBal(all, c), 0), cl = L.reduce((a, x) => a + x.v, 0);
  return `<section class="panel-card pl"><div class="panel-head"><h2>Balance sheet · ${bkDayLabel(asOf)}</h2><div class="bk-head-act"><button class="btn btn-outline" onclick="lgExport('bs')">⬇ CSV</button></div></div>
    <div class="pl-r pl-strong"><span>What you have</span><b></b></div>${rows(A)}${lgMoneyRow('Total', tA, {cls: 'pl-line pl-strong'})}
    <div class="pl-r pl-strong"><span>What you owe</span><b></b></div>${rows(L)}${lgMoneyRow('Total', tL, {cls: 'pl-line pl-strong'})}
    <div class="pl-r pl-strong"><span>Owner's share</span><b></b></div>${rows(E)}${lgMoneyRow('Profit so far (not yet closed into retained earnings)', earnings, {cls: 'pl-sub', neg: true})}${lgMoneyRow('Total', tE, {cls: 'pl-line pl-strong'})}
    <div class="pl-r pl-total"><span>${Math.abs(tA - tL - tE) < 0.01 ? '✓ Balanced' : 'Off by'}</span><b>${Math.abs(tA - tL - tE) < 0.01 ? bkPeso(tA) : bkPeso(tA - tL - tE)}</b></div>
    <div class="bk-note">Working capital (what you have soon minus what you owe soon): <b>${bkPeso(ca - cl)}</b>${cl > 0 ? ` · current ratio ${(ca / cl).toFixed(2)}` : ''}. Ratios are indicators, not a guarantee. Cash and bank are what's recorded in Nifti, not a live bank balance.</div></section>`;
}
function lgCashHtml(){
  const r = lgRangeNow(), em = lgEntryMap(), cashA = ['1000', '1010', '1020'];
  const open = lgSums(null, addDaysIso(r.from, -1), LGV.branch), close = lgSums(null, r.to, LGV.branch);
  const by = {};
  LG.lines.forEach(l => {
    if(!cashA.includes(l.a)) return; const e = em[l.eid]; if(!e || e.date < r.from || e.date > r.to || (LGV.branch && (e.branch || '') !== LGV.branch)) return;
    if(['deposit'].includes(e.type)) return; // money moving between your own accounts
    const k = LG_SRC[e.type] || 'Other';
    const x = by[k] = by[k] || {in: 0, out: 0}; x.in += l.d; x.out += l.c;
  });
  const tIn = Object.values(by).reduce((a, x) => a + x.in, 0), tOut = Object.values(by).reduce((a, x) => a + x.out, 0);
  const sumC = s => cashA.reduce((a, c) => a + lgBal(s, c), 0);
  return `<section class="panel-card pl"><div class="panel-head"><h2>Cash flow · ${escapeHtml(r.label)}</h2><div class="bk-head-act"><button class="btn btn-outline" onclick="lgExport('cash')">⬇ CSV</button></div></div>
    ${lgMoneyRow('Cash, GCash & bank at the start', sumC(open), {cls: 'pl-strong'})}
    <div class="pl-r pl-strong"><span>Money in</span><b></b></div>${Object.entries(by).filter(([, x]) => x.in >= 0.01).map(([k, x]) => lgMoneyRow(escapeHtml(k), x.in, {cls: 'pl-sub'})).join('')}
    <div class="pl-r pl-strong"><span>Money out</span><b></b></div>${Object.entries(by).filter(([, x]) => x.out >= 0.01).map(([k, x]) => lgMoneyRow(escapeHtml(k), -x.out, {cls: 'pl-sub'})).join('')}
    ${lgMoneyRow('Net change', tIn - tOut, {cls: 'pl-line pl-strong', neg: true})}
    <div class="pl-r pl-total"><span>At the end</span><b>${bkPeso(sumC(close))}</b></div>
    <div class="bk-note">Deposits from the drawer to the bank are moves between your own accounts, so they're left out of money in and out.</div></section>
    ${lgForecastHtml()}`;
}
function lgTbHtml(){
  const r = lgRangeNow(), s = lgSums(r.from, r.to, LGV.branch);
  const codes = Object.keys(s).sort();
  const td = lgR(codes.reduce((a, c) => a + s[c].d, 0)), tc = lgR(codes.reduce((a, c) => a + s[c].c, 0));
  return `<section class="panel-card bk-list"><div class="panel-head"><h2>Trial balance · ${escapeHtml(r.label)}</h2><div class="bk-head-act"><button class="btn btn-outline" onclick="lgExport('tb')">⬇ CSV</button></div></div>
    <div class="lg-tbl-wrap"><table class="lg-tbl bk-tbl"><thead><tr><th>Account</th><th class="r">Debits</th><th class="r">Credits</th><th class="r">Balance</th></tr></thead><tbody>
    ${codes.map(c => `<tr onclick="LGV.acct='${c}'; LGV.tab='gl'; renderLedgerPage()"><td>${escapeHtml(c + ' · ' + lgAcct(c).name)}</td><td class="r">${bkPeso(s[c].d)}</td><td class="r">${bkPeso(s[c].c)}</td><td class="r">${bkPeso(lgBal(s, c))}</td></tr>`).join('')}
    <tr class="lg-tot"><td>Total ${Math.abs(td - tc) < 0.01 ? '✓ balanced' : '<span class="bk-bad">not balanced</span>'}</td><td class="r">${bkPeso(td)}</td><td class="r">${bkPeso(tc)}</td><td></td></tr></tbody></table></div></section>`;
}
function lgGlHtml(){
  const r = lgRangeNow(), em = lgEntryMap(), code = LGV.acct;
  const open = lgBal(lgSums(null, addDaysIso(r.from, -1), LGV.branch), code);
  const t = lgAcct(code).type, sign = ['asset', 'expense'].includes(t) ? 1 : -1;
  let run = open;
  const rows = LG.lines.filter(l => l.a === code).map(l => ({l, e: em[l.eid]})).filter(x => x.e && x.e.date >= r.from && x.e.date <= r.to && (!LGV.branch || (x.e.branch || '') === LGV.branch))
    .sort((a, b) => a.e.date.localeCompare(b.e.date));
  return `<section class="panel-card bk-list"><div class="panel-head"><h2>Ledger</h2><div class="bk-head-act"><select aria-label="Account" onchange="LGV.acct=this.value; renderLedgerPage()">${LG.accounts.slice().sort((a, b) => a.code.localeCompare(b.code)).map(a => `<option value="${a.code}" ${a.code === code ? 'selected' : ''}>${escapeHtml(a.code + ' · ' + a.name)}</option>`).join('')}</select>
      <button class="btn btn-outline" onclick="lgExport('gl')">⬇ CSV</button></div></div>
    <div class="lg-tbl-wrap"><table class="lg-tbl bk-tbl"><thead><tr><th>Date</th><th>What</th><th class="r">In (debit)</th><th class="r">Out (credit)</th><th class="r">Balance</th></tr></thead><tbody>
    <tr class="lg-tot"><td colspan="4">Balance at the start</td><td class="r">${bkPeso(open)}</td></tr>
    ${rows.length ? rows.map(({l, e}) => { run = lgR(run + sign * (l.d - l.c)); return `<tr onclick="lgShowEntry('${e.id}')" class="${e.status === 'reversed' || e.kind === 'reversal' ? 'bk-tr-off' : ''}"><td>${bkDayLabel(e.date)}</td><td>${escapeHtml(e.memo || '')}${l.p ? `<small class="bk-sub">${escapeHtml(l.p)}</small>` : ''}</td><td class="r">${l.d ? bkPeso(l.d) : ''}</td><td class="r">${l.c ? bkPeso(l.c) : ''}</td><td class="r">${bkPeso(run)}</td></tr>`; }).join('')
      : '<tr><td colspan="5" class="bk-dim">No entries in this period.</td></tr>'}
    <tr class="lg-tot"><td colspan="4">Balance at the end</td><td class="r">${bkPeso(run)}</td></tr></tbody></table></div>
    <div class="bk-note">Faded lines were undone by a reversal (the record was changed or removed). Tap a line to see the whole entry and open its source.</div></section>`;
}
let LGJ = null;
function lgJournalHtml(){
  const r = lgRangeNow();
  const list = LG.entries.filter(e => e.date >= r.from && e.date <= r.to && (!LGV.branch || (e.branch || '') === LGV.branch)).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 400);
  return `<section class="panel-card bk-list"><div class="panel-head"><h2>Journal</h2><div class="bk-head-act"><button class="btn btn-primary" onclick="lgOpenManual()">+ Typed-in entry</button><button class="btn btn-outline" onclick="lgExport('journal')">⬇ CSV</button></div></div>
    <div class="bk-note">Nifti posts these from your sales, expenses, invoices, payments, stock, cash counts and payroll. Use a typed-in entry only for things that have no record here, like a loan or owner capital. Your accountant can help.</div>
    ${list.map(e => { const t = LG.lines.filter(l => l.eid === e.id).reduce((a, l) => a + l.d, 0); return `<div class="bk-row" role="button" tabindex="0" onclick="lgShowEntry('${e.id}')"><div class="bk-row-m"><b>${escapeHtml(e.memo || '')}</b><small>${bkDayLabel(e.date)} · ${escapeHtml(LG_SRC[e.type] || '')}${e.kind === 'reversal' ? ' · reversal' : e.status === 'reversed' ? ' · reversed' : ''}${e.by && e.by !== 'Nifti' ? ' · by ' + escapeHtml(e.by) : ''}</small></div><span class="bk-amt">${bkPeso(t)}</span></div>`; }).join('') || '<div class="bk-empty"><span>No entries in this period.</span></div>'}</section>`;
}
function lgOpenManual(){
  LGJ = {date: APP_TODAY, memo: '', lines: [{a: '', d: '', c: ''}, {a: '', d: '', c: ''}], err: '', saving: false};
  lgManualRender();
}
function lgManualRender(){
  const opts = sel => `<option value="">Account…</option>${LG.accounts.filter(a => a.active !== false).slice().sort((a, b) => a.code.localeCompare(b.code)).map(a => `<option value="${a.code}" ${a.code === sel ? 'selected' : ''}>${escapeHtml(a.code + ' · ' + a.name)}</option>`).join('')}`;
  const td = LGJ.lines.reduce((a, l) => a + (Number(l.d) || 0), 0), tc = LGJ.lines.reduce((a, l) => a + (Number(l.c) || 0), 0);
  slModal('lgManual', `<div class="sl-sheet-h"><b>Typed-in journal entry</b><button class="sl-x" onclick="slClose('lgManual')">✕</button></div>
    <div class="row-2"><div class="field"><label>Date</label><input type="date" value="${LGJ.date}" onchange="LGJ.date=this.value"></div><div class="field"><label>What is it for?</label><input maxlength="200" value="${escapeHtml(LGJ.memo)}" oninput="LGJ.memo=this.value" placeholder="e.g. Owner put in ₱50,000 capital"></div></div>
    <div class="lgj-lines">${LGJ.lines.map((l, i) => `<div class="lgj-line"><select onchange="LGJ.lines[${i}].a=this.value">${opts(l.a)}</select>
      <input inputmode="decimal" placeholder="Debit" value="${escapeHtml(String(l.d))}" oninput="LGJ.lines[${i}].d=this.value; if(this.value) LGJ.lines[${i}].c=''; lgManualTotals()">
      <input inputmode="decimal" placeholder="Credit" value="${escapeHtml(String(l.c))}" oninput="LGJ.lines[${i}].c=this.value; if(this.value) LGJ.lines[${i}].d=''; lgManualTotals()">
      ${LGJ.lines.length > 2 ? `<button class="sl-x" aria-label="Remove line" onclick="LGJ.lines.splice(${i},1); lgManualRender()">✕</button>` : '<span></span>'}</div>`).join('')}</div>
    <button class="sl-link" onclick="LGJ.lines.push({a:'',d:'',c:''}); lgManualRender()">+ Add line</button>
    <div class="bk-note" id="lgjTot">Debits ${bkPeso(td)} · Credits ${bkPeso(tc)}</div>
    <div class="sl-err" id="lgjErr">${escapeHtml(LGJ.err)}</div>
    <button class="btn btn-primary sl-wide" onclick="lgManualSave()" ${LGJ.saving ? 'disabled' : ''}>${LGJ.saving ? 'Posting…' : 'Post entry'}</button>`);
}
function lgManualTotals(){
  const td = LGJ.lines.reduce((a, l) => a + (Number(l.d) || 0), 0), tc = LGJ.lines.reduce((a, l) => a + (Number(l.c) || 0), 0);
  const el = document.getElementById('lgjTot'); if(el) el.innerHTML = `Debits ${bkPeso(td)} · Credits ${bkPeso(tc)}${Math.abs(td - tc) >= 0.01 ? ` · <span class="bk-bad">off by ${bkPeso(Math.abs(td - tc))}</span>` : td ? ' · ✓ balanced' : ''}`;
}
async function lgManualSave(){
  const err = m => { LGJ.err = m; const e = document.getElementById('lgjErr'); if(e) e.textContent = m; };
  const lines = LGJ.lines.filter(l => l.a && (Number(l.d) > 0 || Number(l.c) > 0)).map(l => ({a: l.a, d: lgR(l.d), c: lgR(l.c)}));
  if(String(LGJ.memo).trim().length < 3) return err('Say what this entry is for.');
  if(lines.length < 2) return err('An entry needs at least two lines with an account and an amount.');
  const td = lgR(lines.reduce((a, l) => a + l.d, 0)), tc = lgR(lines.reduce((a, l) => a + l.c, 0));
  if(td !== tc) return err(`Debits (${bkPeso(td)}) and credits (${bkPeso(tc)}) must be equal.`);
  if(lgMonthLocked(LGJ.date)) return err('That month is closed. Reopen it on Month-end close, or use a date in an open month.');
  LGJ.saving = true; lgManualRender();
  if(myBusiness){
    const { error } = await sb.rpc('post_manual_journal', {p_date: LGJ.date, p_memo: LGJ.memo.trim(), p_lines: lines});
    if(error){ LGJ.saving = false; lgManualRender(); return err(error.message); }
    await lgLoad(true);
  } else {
    const st = lgDemoStore(); st.manual = st.manual || [];
    st.manual.push({id: 'M' + Date.now(), date: LGJ.date, memo: LGJ.memo.trim(), kind: 'manual', type: 'manual', sid: null, status: 'posted', by: bkMe(), lines}); lgDemoSave(st); lgBuildDemo();
  }
  slClose('lgManual'); LGJ = null; showToast('Entry posted.', 'success'); renderLedgerPage();
}
async function lgReverseManual(id){
  const why = prompt('Why reverse this entry? (it stays in the history)', 'Posted by mistake'); if(why === null) return;
  if(String(why).trim().length < 3){ showToast('Say why.'); return; }
  if(myBusiness){ const { error } = await sb.rpc('reverse_journal', {p_id: id, p_reason: why}); if(error){ showToast(error.message, 'error'); return; } await lgLoad(true); }
  else {
    const st = lgDemoStore(), e = (st.manual || []).find(x => x.id === id); if(!e) return;
    e.status = 'reversed'; st.manual.push({id: 'M' + Date.now(), date: APP_TODAY, memo: 'Reversed: ' + e.memo + ' — ' + why, kind: 'reversal', type: 'manual', status: 'posted', by: bkMe(), reversalOf: e.id, lines: e.lines.map(l => ({a: l.a, d: l.c, c: l.d}))});
    lgDemoSave(st); lgBuildDemo();
  }
  slClose('lgEntry'); showToast('Reversed. Both entries stay in the journal.', 'success'); renderLedgerPage();
}
function lgAccountsHtml(){
  const by = {}; LG.accounts.forEach(a => { (by[a.type] = by[a.type] || []).push(a); });
  const bal = lgSums(null, APP_TODAY);
  return `<section class="panel-card bk-list"><div class="panel-head"><h2>Accounts</h2><button class="btn btn-outline" onclick="lgAddAccount()">+ Add an account</button></div>
    <div class="bk-note">These are the boxes your money is sorted into. Built-in ones can be renamed. Add your own for things like a second bank or a loan.</div>
    ${['asset', 'liability', 'equity', 'income', 'expense'].map(t => `<div class="bk-day">${LG_TYPE_LABEL[t]}</div>${(by[t] || []).sort((a, b) => a.code.localeCompare(b.code)).map(a => `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(a.code + ' · ' + a.name)}</b><small>${a.is_system ? 'built-in' : 'yours'}${a.active === false ? ' · switched off' : ''}</small></div>
      <span class="bk-amt">${bkPeso(lgBal(bal, a.code))}</span><span class="bk-row-a"><button class="sl-link" onclick="lgRenameAccount('${a.code}')">Rename</button></span></div>`).join('')}`).join('')}</section>`;
}
async function lgRenameAccount(code){
  const a = lgAcct(code), name = prompt('New name for ' + code, a.name); if(!name || !name.trim()) return;
  if(myBusiness){ const { error } = await sb.from('ledger_accounts').update({name: name.trim().slice(0, 80)}).eq('business_id', myBusiness.id).eq('code', code); if(error){ showToast(error.message, 'error'); return; } await lgLoad(true); }
  else { const st = lgDemoStore(); st.renamed = st.renamed || {}; st.renamed[code] = name.trim().slice(0, 80); const own = (st.accounts || []).find(x => x.code === code); if(own) own.name = name.trim().slice(0, 80); lgDemoSave(st); lgBuildDemo(); }
  renderLedgerPage();
}
async function lgAddAccount(){
  const type = prompt('What kind? Type one: asset, liability, equity, income, expense', 'asset'); if(!type) return;
  if(!LG_TYPE_LABEL[type.trim().toLowerCase()]){ showToast('Type one of: asset, liability, equity, income, expense.'); return; }
  const t = type.trim().toLowerCase(), first = {asset: '1', liability: '2', equity: '3', income: '4', expense: '6'}[t];
  const name = prompt('Name of the account (e.g. BPI savings, Loan from Tito)'); if(!name || !name.trim()) return;
  let code = Number(first + '500'); while(LG.accounts.some(a => a.code === String(code))) code++;
  if(myBusiness){ const { error } = await sb.from('ledger_accounts').insert({business_id: myBusiness.id, code: String(code), name: name.trim().slice(0, 80), type: t}); if(error){ showToast(error.message, 'error'); return; } await lgLoad(true); }
  else { const st = lgDemoStore(); st.accounts = (st.accounts || []).concat([{code: String(code), name: name.trim().slice(0, 80), type: t, is_system: false, active: true}]); lgDemoSave(st); lgBuildDemo(); }
  showToast(`Added ${code} · ${name.trim()}.`, 'success'); renderLedgerPage();
}
// CSV with the filters, a record count and totals at the top, so the file explains itself.
function lgExport(kind){
  const r = lgRangeNow(), em = lgEntryMap(), rows = [];
  const head = [['Nifti export', kind], ['Business', selfName()], ['Period', kind === 'bs' ? 'as of ' + (LGV.asOf || APP_TODAY) : r.from + ' to ' + r.to], ['Branch', LGV.branch || 'All'], ['Generated', new Date().toISOString()], ['Data', LG.demo ? 'SAMPLE DATA' : 'Posted ledger entries']];
  if(kind === 'pnl'){ const p = lgPnlFor(r.from, r.to, LGV.branch); rows.push(['Line', 'Account', 'Amount'], ['Counter sales', '4000', p.counter], ['Sales to customers', '4010', p.orders], ['Credits and returns', '4020', -p.credits], ['Sales', '', p.revenue], ['Cost of goods sold', '5000', -p.cogs], ['Gross profit', '', p.gross]); Object.entries(p.opex).forEach(([c, v]) => rows.push([lgAcct(c).name, c, -v])); rows.push(['Other income', '4900', p.other], ['Net profit', '', p.net]); }
  else if(kind === 'bs'){ const s = lgSums(null, LGV.asOf || APP_TODAY); rows.push(['Account', 'Name', 'Type', 'Balance']); Object.keys(s).sort().forEach(c => rows.push([c, lgAcct(c).name, lgAcct(c).type, lgBal(s, c)])); rows.push(['', 'Profit so far', 'equity', lgR(lgTotalOf(s, 'income') - lgTotalOf(s, 'expense'))]); }
  else if(kind === 'tb'){ const s = lgSums(r.from, r.to, LGV.branch); rows.push(['Account', 'Name', 'Debits', 'Credits', 'Balance']); Object.keys(s).sort().forEach(c => rows.push([c, lgAcct(c).name, lgR(s[c].d), lgR(s[c].c), lgBal(s, c)])); }
  else {
    rows.push(['Entry ID', 'Date', 'Memo', 'Source', 'Source ID', 'Status', 'Branch', 'Account', 'Account name', 'Debit', 'Credit', 'Party']);
    LG.lines.forEach(l => { const e = em[l.eid]; if(!e || e.date < r.from || e.date > r.to || (LGV.branch && (e.branch || '') !== LGV.branch)) return; if(kind === 'gl' && l.a !== LGV.acct) return; if(kind === 'cash' && !['1000', '1010', '1020'].includes(l.a)) return;
      rows.push([e.id, e.date, e.memo, LG_SRC[e.type] || e.type, e.sid || '', e.kind === 'reversal' ? 'reversal' : e.status, e.branch || '', l.a, lgAcct(l.a).name, l.d, l.c, l.p || '']); });
  }
  const data = rows.slice(1);
  const nums = data.map(x => x.filter(v => typeof v === 'number'));
  head.push(['Rows', data.length]);
  if(kind === 'journal' || kind === 'gl' || kind === 'cash') head.push(['Total debits', lgR(data.reduce((a, x) => a + (Number(x[9]) || 0), 0))], ['Total credits', lgR(data.reduce((a, x) => a + (Number(x[10]) || 0), 0))]);
  const csv = head.concat([[]], rows).map(x => x.map(v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'})); a.download = `nifti-${kind}-${kind === 'bs' ? (LGV.asOf || APP_TODAY) : r.from + '_' + r.to}.csv`; document.body.appendChild(a); a.click(); a.remove();
  if(myBusiness) sb.from('audit_log').insert({business_id: myBusiness.id, action: 'export', entity_type: 'report', entity_id: kind, field: r.from + '_' + r.to, new_value: data.length, actor: bkMe()}).then(() => {});
  showToast(`Downloaded ${data.length} row${data.length === 1 ? '' : 's'}.`, 'success');
  void nums;
}

/* ---- cash outlook: what's due in and out, with the assumptions shown ---- */
function lgForecastHtml(){
  const all = lgSums(null, APP_TODAY);
  const start = ['1000', '1010', '1020'].reduce((a, c) => a + lgBal(all, c), 0);
  const items = [];
  unpaidInvoicesFor('supplier').forEach(x => items.push({d: x.due && x.due > APP_TODAY ? x.due : APP_TODAY, amt: x.balance, t: 'in', what: 'Invoice ' + (x.po.invoice.number || x.po.poNumber) + ' · ' + x.po.buyerName, late: x.daysOverdue > 0}));
  unpaidInvoicesFor('buyer').forEach(x => items.push({d: x.due && x.due > APP_TODAY ? x.due : APP_TODAY, amt: -x.balance, t: 'out', what: 'Bill · ' + x.po.supplierName, late: x.daysOverdue > 0}));
  const rec = {}; BK.expenses.filter(e => !e.deletedAt && e.repeat && (e.status || 'approved') === 'approved').forEach(e => { rec[e.category] = e; });
  Object.values(rec).forEach(e => { const day = String(e.date).slice(8, 10); let m = APP_TODAY.slice(0, 7); for(let i = 0; i < 4; i++){ const d = m + '-' + day; if(d > APP_TODAY && d <= addDaysIso(APP_TODAY, 90)) items.push({d, amt: -e.amount, t: 'out', what: e.category + ' (monthly)'}); m = bkNextMonth(m); } });
  const lastPay = (typeof PR !== 'undefined' ? PR.runs : []).filter(r => r.status === 'paid').sort((a, b) => String(b.paid_on).localeCompare(String(a.paid_on)))[0];
  if(lastPay){ const net = PR.lines.filter(l => l.run_id === lastPay.id).reduce((a, l) => a + Number(l.net || 0), 0), gap = Math.max(7, daysBetween(lastPay.period_from, lastPay.period_to) + 1); let d = addDaysIso(lastPay.paid_on, gap); while(d <= addDaysIso(APP_TODAY, 90)){ if(d > APP_TODAY) items.push({d, amt: -net, t: 'out', what: 'Payroll (same as last)'}); d = addDaysIso(d, gap); } }
  const hz = [7, 30, 60, 90].map(n => { const end = addDaysIso(APP_TODAY, n), xs = items.filter(x => x.d <= end); const inn = xs.filter(x => x.amt > 0).reduce((a, x) => a + x.amt, 0), out = -xs.filter(x => x.amt < 0).reduce((a, x) => a + x.amt, 0); return {n, inn, out, end: start + inn - out}; });
  const low = hz.find(h => h.end < 0);
  const utang = bkLiveSales().reduce((a, s) => a + bkSaleBalance(s), 0);
  return `<section class="panel-card"><div class="panel-head"><h2>Cash outlook</h2><span class="lg-pill">Estimate</span></div>
    <div class="lg-tbl-wrap"><table class="lg-tbl bk-tbl"><thead><tr><th>Next</th><th class="r">Expected in</th><th class="r">Expected out</th><th class="r">Cash at the end</th></tr></thead><tbody>
    ${hz.map(h => `<tr class="${h.end < 0 ? 'bk-tr-bad' : ''}"><td>${h.n} days</td><td class="r">${bkPeso(h.inn)}</td><td class="r">${bkPeso(h.out)}</td><td class="r">${bkPeso(h.end)}</td></tr>`).join('')}</tbody></table></div>
    ${low ? `<div class="bk-alert red"><b>Cash could run short within ${low.n} days</b><span>Collect overdue invoices first, or move a supplier payment. See the list below.</span></div>` : ''}
    <div class="bk-note"><b>How this is worked out:</b> starts from ${bkPeso(start)} recorded in cash, GCash and bank (not your real bank balance). Adds unpaid invoices on their due date (overdue ones as if paid today), takes off supplier bills on their due date, monthly bills marked "every month" on their usual day, and payroll repeating like the last one. Counter utang (${bkPeso(utang)}) has no due date, so it's left out. New sales are not guessed.</div>
    <details class="lg-det"><summary>Show the ${items.length} items</summary>${items.sort((a, b) => a.d.localeCompare(b.d)).slice(0, 120).map(x => `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(x.what)}</b><small>${bkDayLabel(x.d)}${x.late ? ' · overdue' : ''}</small></div><span class="bk-amt ${x.amt < 0 ? 'bk-bad' : ''}">${bkPeso(x.amt)}</span></div>`).join('')}</details></section>`;
}
