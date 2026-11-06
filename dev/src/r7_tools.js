/* ===== Round 7: the More tools, made simple =====
   Every tool page opens with what it is for in one sentence and three numbered steps.
   Check payments and Reports are rebuilt as short, plain pages; the other tools keep their
   buttons and data, with simpler words and the same look as the rest of the app. */
const NF_TOOL_TEXT = {
  cheques: ['Check payments', 'Checks customers gave you, and checks you gave. Nifti tells you the day each one can go to the bank.',
    ['Write down each check you get', 'Deposit it on the day Nifti shows', 'Tap when it clears or bounces']],
  returns: ['Returns & credits', 'When a customer sends items back or gets money off for a bad item, write it here. Nifti takes it off their next bill.',
    ['A customer returns items or complains', 'Tap "Give a credit" and type the amount', 'It comes off their next bill by itself']],
  routes: ['Delivery routes', "Make today's delivery list for your driver. They tick each stop on their phone and bring back the cash.",
    ['Pick what to deliver and what to collect', 'Send the list to your driver', 'Watch each stop turn green']],
  books: ['Tax books', 'Your sales book and purchase book for the BIR, filled in from your invoices. Download it for your bookkeeper.',
    ['Pick the month', 'Check the totals', 'Tap "Download for Excel"']],
  taxforms: ['BIR 2307s', 'When a big customer keeps 1% of your payment for tax, they owe you a 2307 paper. Collect them here so you pay less tax.',
    ['See who still owes you a 2307', 'Tap "Remind" to ask for it', 'Tap "Mark received" when you get it']],
  analytics: ['Reports', 'How your business is doing this month, in plain numbers.', null],
  discover: ['Find suppliers & customers', 'Look for new suppliers or customers on Nifti. Nobody sees your prices or your partners.',
    ['Pick a category', 'Open a business', 'Tap "Message" to say hello']],
};
const NF_LENS_TEXT = {cheques: {supplier: 'Checks you got', buyer: 'Checks you gave'}, returns: {supplier: 'From customers', buyer: 'To suppliers'}};
function nfStepsHtml(steps){ return steps ? `<ol class="nf-steps">${steps.map((s, i) => `<li><i>${i + 1}</i><span>${s}</span></li>`).join('')}</ol>` : ''; }
function nfToolHead(page){
  const t = NF_TOOL_TEXT[page], el = document.getElementById('page-' + page); if(!t || !el) return;
  const head = el.querySelector(':scope > .page-head'); if(!head) return;
  const h1 = head.querySelector('h1'), p = head.querySelector('p');
  if(h1){ const badge = h1.querySelector('span'); h1.textContent = t[0] + ' '; if(badge) h1.appendChild(badge); }
  if(p) p.textContent = t[1];
  let st = el.querySelector(':scope > .nf-steps'); if(!st && t[2]){ head.insertAdjacentHTML('afterend', nfStepsHtml(t[2])); }
  const lens = el.querySelector(':scope > .lens-tabs'), names = NF_LENS_TEXT[page];
  if(lens && names) lens.querySelectorAll('button').forEach(b => { const side = (b.getAttribute('onclick') || '').match(/'(supplier|buyer)'\)/); if(side && names[side[1]]){ const n = b.querySelector('.lens-n'); b.textContent = names[side[1]]; if(n) b.appendChild(n); } });
}

/* ---------- Check payments ---------- */
function nfChqWhen(c){
  const d = c.date; if(!d) return 'No date';
  const n = daysBetween(APP_TODAY, d), lbl = stmtDate(d).replace(/, \d{4}$/, '');
  if(c.status === 'bounced') return 'Bounced · dated ' + lbl;
  if(c.status === 'cleared') return 'Cleared · dated ' + lbl;
  if(c.status === 'deposited') return 'In the bank, waiting to clear';
  if(n <= 0) return n === 0 ? 'Can go to the bank today' : 'Can go to the bank now';
  return `Can go to the bank in ${n} day${n === 1 ? '' : 's'} · ${lbl}`;
}
renderChequesPage = function(){
  const el = document.getElementById('chequesContent'); if(!el) return;
  const badge = document.getElementById('chequesBadge'); if(badge) badge.innerHTML = proBadge('cheques');
  nfToolHead('cheques');
  if(!hasFeature('cheques')){ el.innerHTML = lockedPanelHtml('cheques', 'Every check in one list, a reminder the day each one can go to the bank, and an alert if one bounces.'); return; }
  try{ seedDemoCheques(); }catch(e){}
  const side = currentAppRole === 'supplier' ? 'supplier' : 'buyer', got = side === 'supplier';
  const all = collectCheques(side), sum = l => l.reduce((s, c) => s + c.amount, 0);
  const back60 = addDaysIso(APP_TODAY, -60);
  const due = all.filter(c => c.status === 'due'), later = all.filter(c => c.status === 'hold'), dep = all.filter(c => c.status === 'deposited');
  const bounced = all.filter(c => c.status === 'bounced' && (c.date || APP_TODAY) >= addDaysIso(APP_TODAY, -90)), cleared = all.filter(c => c.status === 'cleared' && (c.date || APP_TODAY) >= back60);
  const n = l => `${l.length} check${l.length === 1 ? '' : 's'}`;
  const tiles = `<div class="bk-tiles">${bkTile(got ? 'Deposit today' : 'Cashed soon (7 days)', bkPeso(sum(got ? due : all.filter(c => ['due', 'hold', 'deposited'].includes(c.status) && c.date <= addDaysIso(APP_TODAY, 7)))), got ? n(due) : 'keep this in your bank', got && due.length ? 'warn' : '')}
    ${bkTile('Coming later', bkPeso(sum(later)), n(later))}${bkTile('Waiting to clear', bkPeso(sum(dep)), n(dep))}${bkTile('Bounced', bkPeso(sum(bounced)), bounced.length ? n(bounced) + ', last 90 days' : 'none, nice', bounced.length ? 'bad' : 'good')}</div>`;
  const order = {due: 0, deposited: 1, hold: 2, bounced: 3, cleared: 4};
  const list = due.concat(dep, later, bounced, cleared).sort((a, b) => (order[a.status] - order[b.status]) || String(a.date).localeCompare(String(b.date)));
  const pill = {due: ['warn', 'Deposit today'], hold: ['plain', 'Later'], deposited: ['info', 'Waiting to clear'], cleared: ['good', 'Cleared'], bounced: ['bad', 'Bounced']};
  const row = c => {
    const key = `'${c.po.id}','${c.kind}','${c.key}'`, p = pill[c.status] || ['plain', c.status];
    let act = '';
    if(got && c.status === 'due') act = `<button class="btn btn-primary btn-sm" onclick="chequeDeposited(${key})">I deposited it</button>`;
    else if(got && c.status === 'deposited') act = `<button class="btn btn-primary btn-sm" onclick="chequeCleared(${key})">It cleared</button><button class="btn btn-outline btn-sm nf-bad" onclick="chequeBounced(${key})">It bounced</button>`;
    else if(got && c.status === 'bounced') act = `<button class="btn btn-outline btn-sm" onclick="askReplacementCheque(${key})">Ask for a new check</button>`;
    else if(got && c.status === 'hold') act = `<button class="btn btn-outline btn-sm" onclick="chequeDeposited(${key}, true)">Deposit early</button>`;
    return `<div class="nf-row nf-${c.status}"><span class="nf-ic-chq" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 14h5M15 11h3"/></svg></span>
      <div class="nf-row-m"><b>${escapeHtml(c.party || '—')}</b><small>${escapeHtml(c.bank || 'Bank')} · check #${escapeHtml(c.no || '—')} · ${escapeHtml(nfChqWhen(c))}</small></div>
      <div class="nf-row-r"><strong>${bkPeso(c.amount)}</strong><span class="nf-pill ${p[0]}">${p[1]}</span></div><div class="nf-row-a">${act}</div></div>`;
  };
  el.innerHTML = tiles + `<section class="panel-card nf-card"><div class="panel-head"><h2>${got ? 'Checks you got' : 'Checks you gave'}</h2><span class="bk-dim">${list.length} check${list.length === 1 ? '' : 's'}</span></div>
    ${list.length ? list.map(row).join('') : `<div class="nf-empty">No checks yet. ${got ? 'When a customer pays by check, add it below.' : 'Checks you pay suppliers with show here.'}</div>`}</section>
    ${got ? chequeQuickAddHtml().replace('＋ Record a cheque you received', '＋ Add a check you got').replace(/cheque/g, 'check').replace('Save check', 'Save') : ''}`;
  if(got) try{ renderChequeInvoices(); }catch(e){}
};

/* ---------- Reports: one calm page ---------- */
function nfMonthRange(k){ const [y, m] = APP_TODAY.slice(0, 7).split('-').map(Number); const d = new Date(y, m - 1 - k, 1); const from = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0); let to = end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0'); if(to > APP_TODAY) to = APP_TODAY;
  return {from, to, label: d.toLocaleDateString('en-PH', {month: 'short'})}; }
function nfMerge(map){ const out = {}, name = {}; Object.entries(map).forEach(([k, v]) => { const key = String(k).toLowerCase().replace(/[.,]/g, '').replace(/\s+(co|corp|inc|corporation|company)$/, '').replace(/[^a-z0-9]/g, '');
  out[key] = (out[key] || 0) + v; if(!name[key] || k.length > name[key].length) name[key] = k; }); const r = {}; Object.keys(out).forEach(k => { r[name[k]] = out[k]; }); return r; }
function nfTop(map, n){ map = nfMerge(map); return Object.entries(map).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, n || 5); }
function nfBars(rows, money){ const max = Math.max(1, ...rows.map(r => r[1])); return rows.length ? rows.map(([k, v], i) => `<div class="nf-bar"><span class="nf-bar-k"><i>${i + 1}</i>${escapeHtml(k)}</span><span class="nf-bar-t"><u style="width:${Math.max(4, Math.round(v / max * 100))}%"></u></span><b>${money ? bkPeso(v) : v}</b></div>`).join('') : '<div class="nf-empty">Nothing here yet. It fills in as you record sales and orders.</div>'; }
async function nfRenderReports(){
  const page = document.getElementById('page-analytics'); if(!page) return;
  page.classList.add('nf-replaced');
  let host = document.getElementById('nfReports');
  if(!host){ host = document.createElement('div'); host.id = 'nfReports'; host.innerHTML = `<div class="page-head"><h1>Reports</h1><p>${NF_TOOL_TEXT.analytics[1]}</p></div><div id="nfRepBody"><div class="panel-card bk-empty"><span>Adding up your numbers…</span></div></div>`; page.appendChild(host); }
  try{ if(typeof bkLoad === 'function') await bkLoad(); if(typeof lgLoad === 'function') await lgLoad(); }catch(e){}
  const body = document.getElementById('nfRepBody'); if(!body) return;
  const months = [5, 4, 3, 2, 1, 0].map(k => { const r = nfMonthRange(k); let p = {revenue: 0, net: 0}; try{ p = lgPnlFor(r.from, r.to) || p; }catch(e){} return Object.assign(r, {sales: Number(p.revenue) || 0, profit: Number(p.net) || 0}); });
  const now = months[5], prev = months[4];
  const sup = getSupplierPOs().filter(o => o.status !== 'cancelled' && o.status !== 'draft'), buy = getBuyerPOs().filter(o => o.status !== 'cancelled' && o.status !== 'draft');
  const open = po => { try{ const c = computeInvoicePayments(po); return Math.max(0, c.balance); }catch(e){ return 0; } };
  const owedToYou = sup.filter(o => o.invoice && o.status !== 'paid').reduce((s, o) => s + open(o), 0);
  const youOwe = buy.filter(o => o.invoice && o.status !== 'paid').reduce((s, o) => s + open(o), 0);
  const late = sup.filter(o => o.invoice && o.status !== 'paid' && o.invoice.dueDate && o.invoice.dueDate < APP_TODAY && open(o) >= 1)
    .map(o => ({o, days: daysBetween(o.invoice.dueDate, APP_TODAY), amt: open(o)})).sort((a, b) => b.days - a.days);
  const cust = {}, items = {}, sups = {};
  const y = APP_TODAY.slice(0, 4);
  sup.filter(o => ['delivered', 'invoiced', 'paid'].includes(o.status) || o.invoice).forEach(o => { cust[o.buyerName] = (cust[o.buyerName] || 0) + poTotal(o); (o.lineItems || []).forEach(l => { items[l.product] = (items[l.product] || 0) + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0); }); });
  (BK.sales || []).filter(s => String(s.date).startsWith(y) && !s.voided).forEach(s => { if(s.customer && s.customer !== 'Walk-in') cust[s.customer] = (cust[s.customer] || 0) + Number(s.total || 0); (s.lines || []).forEach(l => { items[l.product] = (items[l.product] || 0) + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0); }); });
  buy.forEach(o => { sups[o.supplierName] = (sups[o.supplierName] || 0) + poTotal(o); });
  const ch = prev.sales ? Math.round((now.sales - prev.sales) / Math.abs(prev.sales) * 100) : null;
  const maxS = Math.max(1, ...months.map(m => m.sales));
  body.innerHTML = `<div class="bk-tiles">
      ${bkTile('Sales this month', bkPeso(now.sales), ch == null ? now.label + ' so far' : `${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch)}% vs ${prev.label}`, '', "go('sales')")}
      ${bkTile(now.profit < 0 ? 'Loss this month' : 'Profit this month', bkPeso(now.profit), now.profit < 0 ? 'costs were more than sales' : 'after all costs', now.profit < 0 ? 'bad' : now.profit > 0 ? 'good' : '', "go('ledger')")}
      ${bkTile('Customers owe you', bkPeso(owedToYou), late.length ? `${late.length} late to pay` : 'nobody is late', late.length ? 'bad' : owedToYou ? 'warn' : 'good', "go('collections')")}
      ${bkTile('You owe suppliers', bkPeso(youOwe), 'unpaid bills', '', "pickLens('collections','buyer')")}</div>
    <section class="panel-card nf-card"><div class="panel-head"><h2>Sales, last 6 months</h2><span class="bk-dim">green = profit, red = loss</span></div>
      <div class="nf-chart">${months.map(m => `<div class="nf-col${m === now ? ' now' : ''}"><b>${m.sales >= 1e6 ? '₱' + (m.sales / 1e6).toFixed(1) + 'M' : m.sales >= 1000 ? '₱' + Math.round(m.sales / 1000) + 'K' : bkPeso(m.sales)}</b><span class="nf-col-t"><u style="height:${Math.max(3, Math.round(m.sales / maxS * 100))}%"></u></span><em class="${m.profit < 0 ? 'bad' : 'good'}">${m.profit < 0 ? '−' : '+'}${m.profit >= 1000 || m.profit <= -1000 ? '₱' + Math.round(Math.abs(m.profit) / 1000) + 'K' : bkPeso(Math.abs(m.profit))}</em><small>${m.label}</small></div>`).join('')}</div></section>
    <section class="panel-card nf-card"><div class="panel-head"><h2>Who is late to pay you</h2><a class="lg-link" onclick="go('collections')">Open Who owes you →</a></div>
      ${late.length ? late.slice(0, 5).map(x => `<div class="nf-row"><span class="nf-dot bad"></span><div class="nf-row-m"><b>${escapeHtml(x.o.buyerName)}</b><small>${escapeHtml((x.o.invoice && x.o.invoice.number) || x.o.poNumber)} · ${x.days} day${x.days === 1 ? '' : 's'} late</small></div><div class="nf-row-r"><strong class="bad">${bkPeso(x.amt)}</strong></div></div>`).join('') : '<div class="nf-empty good">Nobody is late. Every customer is paying on time.</div>'}</section>
    <div class="nf-two">
      <section class="panel-card nf-card"><div class="panel-head"><h2>Your best customers</h2><span class="bk-dim">this year</span></div>${nfBars(nfTop(cust), true)}</section>
      <section class="panel-card nf-card"><div class="panel-head"><h2>Your best-selling items</h2><span class="bk-dim">this year</span></div>${nfBars(nfTop(items), true)}</section>
    </div>
    <section class="panel-card nf-card"><div class="panel-head"><h2>Where you buy the most</h2><span class="bk-dim">orders to suppliers</span></div>${nfBars(nfTop(sups), true)}</section>
    <p class="nf-foot">Want every peso in and out? <a class="lg-link" onclick="go('ledger')">Open Books & reports →</a></p>`;
}

/* ---------- after each page opens ---------- */
(function(){
  const nav = window.navigate; if(typeof nav !== 'function' || nav._nf7) return;
  const w = function(page){ const r = nav.apply(this, arguments); setTimeout(() => { try{
    if(NF_TOOL_TEXT[page] && page !== 'analytics') nfToolHead(page);
    if(page === 'analytics') nfRenderReports();
  }catch(e){ console.warn(e); } }, 0); return r; };
  w._nf7 = true; window.navigate = w;
  try{ LENS_TABS.cheques = [['supplier', 'Checks you got'], ['buyer', 'Checks you gave']]; delete LENS_TABS.analytics; }catch(e){}
})();
