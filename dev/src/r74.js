/* ===== Round 74: Home order, owner view, running "vs last month", page fixes, edits everywhere ===== */
function nf74E(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
function nf74P(n){ const v = Math.round(Number(n) || 0); return (v < 0 ? '−₱' : '₱') + Math.abs(v).toLocaleString('en-PH'); }
function nf74Mon(m, len){ return new Date(m + '-01T00:00:00').toLocaleDateString('en-PH', {month: len || 'short'}); }

/* ---------- 1. One running comparison everywhere: this month so far vs the same days last month ---------- */
// Nov 1-24 is compared with Oct 1-24, not with all of October. A finished month is compared with the whole month before.
function nf74SameRange(m){
  const pm = bkPrevMonth(m), pEnd = lgRange('month', pm + '-01').to, cur = String(APP_TODAY).slice(0, 7);
  if(m !== cur) return {from: pm + '-01', to: pEnd, label: nf74Mon(pm), full: true, pm};
  let to = pm + '-' + String(APP_TODAY).slice(8, 10); if(to > pEnd) to = pEnd;
  return {from: pm + '-01', to, label: `${nf74Mon(pm)} 1–${Number(to.slice(8))}`, full: false, pm};
}
function nf74PnlRange(R){
  try{
    if(typeof LG !== 'undefined' && LG.loaded && LG.lines && LG.lines.length && booksCanSeeTotals()){
      const p = lgPnlFor(R.from, R.to); return {sales: p.revenue || 0, cogs: p.cogs || 0, opex: lgR((p.opexTot || 0) - (p.other || 0)), net: p.net || 0};
    }
    if(R.full){ const p = bkPnl(R.pm); return {sales: p.sales || 0, cogs: p.cost || 0, opex: p.expenses || 0, net: p.net || 0}; }
  }catch(e){}
  return null;
}
// the chip under a profit: "▲ ₱2,100 vs Oct 1–24" and what those days made
function nf74ProfitChip(m, net){
  const R = nf74SameRange(m), q = nf74PnlRange(R);
  if(!q || !q.sales) return '';
  const d = (Number(net) || 0) - q.net; if(Math.abs(d) < 1) return `<small class="nf74-cmp z">Same as ${nf74E(R.label)}</small>`;
  return `<small class="nf74-cmp ${d > 0 ? 'up' : 'down'}" title="${R.full ? 'Compared with the whole of ' + nf74E(nf74Mon(R.pm, 'long')) : 'This month so far, compared with the same days last month'}">${d > 0 ? '▲' : '▼'} ${nf74P(Math.abs(d))} vs ${nf74E(R.label)}<span>${nf74E(R.label)}: ${nf74P(q.net)}</span></small>`;
}
// the ledger's "previous period" for a month still in progress is the same days of last month
if(typeof lgPrevRange === 'function'){
  const _pr = lgPrevRange;
  lgPrevRange = function(r){
    try{ const days = daysBetween(r.from, r.to) + 1, m = r.from.slice(0, 7);
      if(/-01$/.test(r.from) && days <= 31 && m === String(APP_TODAY).slice(0, 7)){ const R = nf74SameRange(m); return {from: R.from, to: R.to, label: R.label}; } }catch(e){}
    return _pr.apply(this, arguments);
  };
}

/* ---------- 2. Demo: the books are rebuilt once the sample stock moves match the sample sales (one profit everywhere) ---------- */
(function(){
  const b = booksAfterHome;
  booksAfterHome = function(){
    const was = !!window._nf73Synced, r = b.apply(this, arguments);
    try{
      if(!was && window._nf73Synced && !myBusiness && !window._nf74Rebuilt && typeof lgLoad === 'function'){
        window._nf74Rebuilt = true;
        Promise.resolve(lgLoad(true)).then(() => { const h = document.querySelector('#page-dashboard.active'); if(h && typeof renderOneHome === 'function') renderOneHome(); });
      }
    }catch(e){}
    return r;
  };
})();

/* ---------- 3. Home: the 4 pills, then What to do. The price list and notebook cards sit under it, and both have a permanent home ---------- */
function nf74HomeOrder(){
  const home = document.getElementById('mhHome') || document.getElementById('page-dashboard'); if(!home) return;
  const what = [...home.querySelectorAll('.sect')].find(s => /^What to do/.test(((s.querySelector('.sect-h h4') || {}).textContent || '').trim()));
  if(!what) return;
  let after = what;
  ['.nf48-home', '.nf45-oldhint'].forEach(sel => {
    const el = home.querySelector(sel); if(!el) return;
    if(after.nextElementSibling !== el) after.after(el);
    after = el;
  });
}
NF45_AFTER.push(() => { try{ if(document.querySelector('#page-dashboard.active')) nf74HomeOrder(); }catch(e){} });
(function(){ const b = booksAfterHome; booksAfterHome = function(){ const r = b.apply(this, arguments); Promise.resolve().then(() => { try{ nf74HomeOrder(); }catch(e){} }); return r; }; })();
// closing a card says where the feature lives from now on
document.addEventListener('click', e => {
  const t = e.target && e.target.closest ? e.target : null; if(!t) return;
  if(t.closest('.nf45-oldhint .nf45-icon')) setTimeout(() => showToast('Hidden. Bring in old records anytime from the menu, or from Getting paid and Stock.', 'success'), 50);
  const nb = t.closest('.nf48-home button'); if(nb && /Not this week/i.test(nb.textContent)) setTimeout(() => showToast("OK. This week's price list is always in Prices & profit and Online store.", 'success'), 50);
}, true);
// permanent buttons on the pages these features belong to
const NF74_HOMES = {
  profit: {id: 'nf74PlBtn', html: () => `<button type="button" class="btn btn-outline nf74-home-btn" id="nf74PlBtn" onclick="nf48PriceList()">${nf74Ic('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>')}This week's price list</button>`, ok: () => typeof nf48PriceList === 'function'},
  store: {id: 'nf74PlBtn', html: () => `<button type="button" class="btn btn-outline nf74-home-btn" id="nf74PlBtn" onclick="nf48PriceList()">${nf74Ic('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>')}This week's price list</button>`, ok: () => typeof nf48PriceList === 'function'},
  collections: {id: 'nf74RecBtn', html: () => `<button type="button" class="btn btn-outline nf74-home-btn" id="nf74RecBtn" onclick="(window.nf45Old || function(){})()">${nf74Ic('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 18v-6M9 15l3-3 3 3"/>')}Bring in old utang</button>`, ok: () => typeof nf45Old === 'function'},
  inventory: {id: 'nf74RecBtn', html: () => `<button type="button" class="btn btn-outline nf74-home-btn" id="nf74RecBtn" onclick="(window.nf45Old || function(){})()">${nf74Ic('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 18v-6M9 15l3-3 3 3"/>')}Bring in old records</button>`, ok: () => typeof nf45Old === 'function'}
};
function nf74Ic(d){ return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`; }
function nf74PageHomes(){
  const a = document.querySelector('#view-app .app-page.active'); if(!a) return;
  const key = a.id.replace(/^page-/, ''), cfg = NF74_HOMES[key]; if(!cfg || !cfg.ok()) return;
  let full = true; try{ full = key === 'collections' || key === 'inventory' ? isPageAllowedForViewAsRole('datacenter') !== false : booksCanSeeTotals(); }catch(e){}
  const have = a.querySelector('#' + cfg.id);
  if(!full){ if(have) have.remove(); return; }
  if(have) return;
  const head = a.querySelector(':scope > .page-head, .page-head'); if(!head) return;
  let bar = head.querySelector('.nf74-homes');
  if(!bar){ bar = document.createElement('div'); bar.className = 'nf74-homes'; head.appendChild(bar); }
  bar.insertAdjacentHTML('beforeend', cfg.html());
}
NF45_AFTER.push(() => { try{ nf74PageHomes(); }catch(e){} });

/* ---------- 4. Owner view: three answers at a glance, each one opens its page ---------- */
function nf74OwnerHtml(){
  const m = bkMonth(APP_TODAY), p = bkPnl(m), mon = nf74Mon(m, 'long');
  const sales = Number(p.sales) || 0, cogs = Number(p.cost) || 0, opex = Number(p.expenses) || 0, spend = cogs + opex, profit = sales - spend;
  const R = nf74SameRange(m), q = nf74PnlRange(R);
  const margin = sales ? profit / sales * 100 : null, qm = q && q.sales ? q.net / q.sales * 100 : null, mDelta = margin != null && qm != null ? margin - qm : null;
  const pDelta = q && q.sales ? profit - q.net : null;
  const tone = v => v == null ? 'n' : v < 0 ? 'r' : v < 10 ? 'y' : 'g';
  const chip = (v, pts) => v == null || !isFinite(v) || Math.abs(v) < (pts ? .05 : 1) ? `<em class="nf74-ch z">${q && q.sales ? 'Same as ' + nf74E(R.label) : 'No ' + nf74E(nf74Mon(R.pm)) + ' numbers yet'}</em>`
    : `<em class="nf74-ch ${v > 0 ? 'g' : 'r'}">${v > 0 ? '▲' : '▼'} ${pts ? Math.abs(v).toFixed(1) + ' pts' : nf74P(Math.abs(v))} vs ${nf74E(R.label)}</em>`;
  const keep = margin == null ? null : Math.round(margin);
  const parts = [['Stock you sold', cogs]].concat(Object.entries(p.byCat || {}).filter(([, v]) => Number(v) > 0).sort((a, b) => b[1] - a[1]));
  const top = parts.filter(([, v]) => v > 0).slice(0, 3);
  const review = [];
  try{
    const noCost = new Set();
    bkLiveSales().filter(s => bkMonth(s.date) === m).forEach(s => (s.lines || []).forEach(l => { if(!l.totalOnly && l.product && !(Number(l.unitCost) || bkItemCost(l.product))) noCost.add(l.product); }));
    if(noCost.size) review.push({tone: 'y', t: `${noCost.size} item${noCost.size === 1 ? '' : 's'} sold with no cost saved`, s: 'Profit looks higher than it is until each item has a cost.', b: 'Add costs', a: "go('profit')"});
  }catch(e){}
  if(mDelta != null && mDelta <= -2) review.push({tone: 'r', t: `You keep less per sale than ${R.label}`, s: 'Check supplier prices, discounts given, and any price you haven\'t raised yet.', b: 'Prices & profit', a: "go('profit')"});
  else if(mDelta != null && mDelta >= 2) review.push({tone: 'g', t: `You keep more per sale than ${R.label}`, s: 'Your prices and costs are working better this month.', b: 'See why', a: "go('money')"});
  const r1 = review[0];
  return `<section class="sect glass nf72-owner nf74-owner" aria-labelledby="nf74OwH">
    <div class="sect-h"><h4 id="nf74OwH">Owner view · ${nf74E(mon)} so far</h4><button class="sch-btn" type="button" onclick="go('money')">Money overview ›</button></div>
    <div class="nf74-ow">
      <button type="button" class="nf74-ot t-${profit < 0 ? 'r' : 'g'}" onclick="go('money')"><span class="lb">${profit < 0 ? 'Loss so far' : 'Profit so far'}</span><b>${nf74P(profit)}</b>${chip(pDelta, false)}<small>${q && q.sales ? `${nf74E(R.label)}: ${nf74P(q.net)}` : `Sales ${nf74P(sales)} minus every cost`}</small><i class="go" aria-hidden="true">›</i></button>
      <button type="button" class="nf74-ot t-${tone(margin)}" onclick="go('profit')"><span class="lb">You keep</span><b>${keep == null ? '—' : '₱' + Math.max(keep, 0)}<span class="u">${keep == null ? '' : ' of every ₱100'}</span></b>${chip(mDelta, true)}<small>${margin == null ? 'Shows once you record a sale' : `Margin ${margin.toFixed(1)}% after every cost`}</small><i class="go" aria-hidden="true">›</i></button>
      <button type="button" class="nf74-ot t-b nf74-costs" onclick="go('expenses')"><span class="lb">Biggest costs · ${nf74P(spend)} in all</span>${top.length ? `<ol>${top.map(([k, v], i) => `<li><span class="n">${i + 1}</span><span class="k">${nf74E(k)}</span><b>${nf74P(v)}</b><em>${spend ? Math.round(v / spend * 100) : 0}%</em></li>`).join('')}</ol>` : '<small>No costs recorded yet this month.</small>'}<i class="go" aria-hidden="true">›</i></button>
    </div>
    ${r1 ? `<div class="nf74-ow-r t-${r1.tone}"><span class="d" aria-hidden="true"></span><span class="tx"><b>${nf74E(r1.t)}</b><small>${nf74E(r1.s)}</small></span><button type="button" class="btn btn-outline" onclick="${r1.a}">${nf74E(r1.b)}</button></div>` : ''}
  </section>`;
}
if(typeof nf72OwnerHtml === 'function'){ nf72OwnerHtml = nf74OwnerHtml; window.nf72OwnerHtml = nf74OwnerHtml; }

/* ---------- 5. Money overview: short words where a column was a sentence ---------- */

/* ---------- 6. Walk-in sales: two tabs. Sales (what was sold) and Count the cash (the drawer). The pills stay on both ---------- */
const NF74T = {sales: 'sales'};
function nf74SalesTabs(){
  const pg = document.getElementById('page-sales'); if(!pg || !pg.classList.contains('active')) return;
  const head = pg.querySelector(':scope > .page-head'); if(!head) return;
  let bar = pg.querySelector(':scope > .nf74-tabs');
  const cash = document.getElementById('nf18Count');
  if(!cash){ if(bar) bar.remove(); if(pg.dataset.nf74t) delete pg.dataset.nf74t; return; }
  let notCounted = false; try{ notCounted = !BK.counts.some(c => c.day === APP_TODAY && !c.reopenedAt); }catch(e){}
  const k = NF74T.sales + '|' + notCounted;
  if(!bar){ bar = document.createElement('div'); bar.className = 'nf74-tabs'; bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', 'Walk-in sales'); head.after(bar); }
  if(bar.dataset.k !== k){ bar.dataset.k = k;
    bar.innerHTML = `<button type="button" role="tab" aria-selected="${NF74T.sales === 'sales'}" class="${NF74T.sales === 'sales' ? 'on' : ''}" onclick="nf74SalesTab('sales')">${nf74Ic('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>')}Sales</button>`
      + `<button type="button" role="tab" aria-selected="${NF74T.sales === 'cash'}" class="${NF74T.sales === 'cash' ? 'on' : ''}" onclick="nf74SalesTab('cash')">${nf74Ic('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>')}Count the cash${notCounted ? '<em>Not counted today</em>' : ''}</button>`; }
  if(pg.dataset.nf74t !== NF74T.sales) pg.dataset.nf74t = NF74T.sales;
}
function nf74SalesTab(t){ NF74T.sales = t === 'cash' ? 'cash' : 'sales'; nf74SalesTabs(); try{ window.scrollTo({top: 0, behavior: 'smooth'}); }catch(e){} }
NF45_AFTER.push(() => { try{ nf74SalesTabs(); }catch(e){} });
(function(){
  const nav = window.navigate; if(typeof nav !== 'function' || nav._nf74) return;
  const w = function(page){ if(page === 'cashcount') NF74T.sales = 'cash'; else if(page === 'sales' && !w._keep) NF74T.sales = NF74T.sales || 'sales'; const r = nav.apply(this, arguments); try{ nf74SalesTabs(); }catch(e){} [700, 1600].forEach(ms => setTimeout(() => { try{ nf74AlignHeads(); }catch(e){} }, ms)); return r; };
  Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf74 = true; window.navigate = w; try{ navigate = w; }catch(e){}
})();
// "Count the cash ›" links on the Sales tab switch tabs instead of scrolling down a long page
document.addEventListener('click', e => {
  const a = e.target && e.target.closest ? e.target.closest('#page-sales a, #page-sales button, #page-sales .lg-link') : null; if(!a || a.closest('.nf74-tabs')) return;
  if(/^Count the cash/i.test((a.textContent || '').trim()) && document.getElementById('nf18Count')){ e.preventDefault(); e.stopPropagation(); nf74SalesTab('cash'); }
}, true);

/* ---------- 7. Cash drawer: the owner fixes a wrong count, or settles a real difference with a note. Either way the day turns green ---------- */
function nf74Settled(c){ return !!(c && c.recs && c.recs.length && c.recs.every(r => r.reviewedAt) && Math.round(c.diff) !== 0); }
function nf74SettleBox(c, verdict){
  let boss = false; try{ boss = booksCanSeeTotals(); }catch(e){}
  const S = MH.sheet || {};
  if(nf74Settled(c)){ const r = c.recs.find(x => x.reviewNote) || c.recs[0];
    return `<div class="box green nf74-settled"><b class="t">Settled by ${mhEsc(r.reviewedBy || 'the owner')}${r.reviewedAt ? ' · ' + mhEsc(new Date(r.reviewedAt).toLocaleDateString('en-PH', {month: 'short', day: 'numeric'})) : ''}</b><span>${r.reviewNote ? '“' + mhEsc(r.reviewNote) + '”' : 'Checked and accepted.'} The ${c.diff < 0 ? 'shortage' : 'extra'} of ${mhPeso(Math.abs(c.diff))} stays in your books as ${c.diff < 0 ? 'Cash short' : 'Cash over'}, and the first count stays on record.</span></div>`; }
  if(!boss || Math.round(c.diff) === 0) return verdict;
  if(S.settle) return `${verdict}<div class="box nf74-settle"><b class="t">Settle ${mhLabel(c.day)}</b>
    <label class="nf74-sl">What happened? (required, kept with the day)<textarea id="nf74SetNote" maxlength="300" placeholder="e.g. Talked to ${mhEsc(mhFirst(c.by))}: ₱${Math.abs(Math.round(c.diff))} change given by mistake to a customer.">${mhEsc(S.settleNote || '')}</textarea></label>
    ${S.settleErr ? `<span class="err">${mhEsc(S.settleErr)}</span>` : ''}
    <div class="actions"><button class="btn ghost" type="button" onclick="MH.sheet.settle=false; MH.sheet.settleErr=''; mhRenderDay()">Cancel</button><button class="btn" type="button" onclick="nf74SettleSave()">Settle the day</button></div></div>`;
  return `${verdict}<div class="box nf74-settle"><b class="t">Fix or settle this day</b>
    <span>Recounted and found the money? <b>Fix the count</b>. Checked and the ${c.diff < 0 ? 'shortage' : 'extra'} is real? <b>Settle it</b> with a short note. Either way the day turns green, and the first count stays on record.</span>
    <div class="actions"><button class="btn" type="button" onclick="mhStartEdit()">Fix the count</button><button class="btn ghost" type="button" onclick="MH.sheet.settle=true; mhRenderDay()">Settle the ${c.diff < 0 ? 'shortage' : 'extra'}</button></div></div>`;
}
async function nf74SettleSave(){
  const S = MH.sheet; if(!S) return; const c = mhCounts()[S.k]; if(!c) return;
  const note = String((document.getElementById('nf74SetNote') || {}).value || '').trim(); S.settleNote = note;
  if(note.length < 5){ S.settleErr = 'Add a short note first. It is kept with the day.'; mhRenderDay(); return; }
  for(const r of c.recs.filter(x => !x.reviewedAt)){
    if(myBusiness){ const { error } = await sb.rpc('review_cash_count', {p_id: r.id, p_note: note}); if(error){ S.settleErr = error.message; mhRenderDay(); return; } }
    else { r.reviewedAt = new Date().toISOString(); r.reviewedBy = bkMe(); r.reviewNote = note; }
  }
  if(myBusiness) await bkLoad(true); else try{ bkSaveDemo(); }catch(e){}
  S.settle = false; S.settleErr = ''; S.settleNote = '';
  try{ renderMistHome(); }catch(e){} mhRenderDay(); showToast('Settled. The day is green, and your note is kept with it.', 'success');
}

/* ---------- 8. Sale details: the table lines up, the money adds up underneath like a receipt ---------- */
function nf74SaleDetail(id){
  const s = (BK.sales || []).find(x => x.id === id); if(!s) return;
  const full = nf72FullView(), pay = {cash: 'Cash', gcash: 'GCash', maya: 'Maya', credit: 'Utang (on credit)', bank: 'Bank', other: 'Other'}[s.paidWith] || s.paidWith || '—';
  const bal = typeof bkSaleBalance === 'function' ? bkSaleBalance(s) : 0, lines = s.lines || [];
  let disc = 0, cost = 0, noCost = false;
  const rows = lines.map(l => {
    if(l.totalOnly) return `<tr><td class="t" colspan="${full ? 5 : 4}"><b>Total only, no items</b><small>Recorded before item-by-item sales, so the items can't be shown.</small></td><td class="n"><b>${bkPeso(l.unitPrice)}</b></td></tr>`;
    const q = Number(l.qty) || 0, u = Number(l.unitPrice) || 0, list = Number(l.listPrice) || 0, c = Number(l.unitCost) || 0, d = list > u ? (list - u) * q : 0;
    disc += d; cost += c * q; if(!c) noCost = true;
    return `<tr><td class="t"><b>${escapeHtml(l.product)}</b>${d ? `<small>${bkPeso(list)} on the price list</small>` : ''}</td><td class="n">${q}</td><td class="n">${bkPeso(u)}</td><td class="n">${d ? `<span class="nf74-disc">−${bkPeso(d)}</span>` : '—'}</td>${full ? `<td class="n">${c ? bkPeso(c) : '<small>not saved</small>'}</td>` : ''}<td class="n"><b>${bkPeso(q * u)}</b></td></tr>`;
  }).join('');
  const when = (typeof bkDayLabel === 'function' ? bkDayLabel(s.date) : s.date) + (s.at ? ' · ' + new Date(s.at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila'}) : '');
  const sum = [['Total', bkPeso(s.total), 'tot']];
  if(disc) sum.push(['Discount from the price list', '−' + bkPeso(disc), 'disc']);
  if(full && cost) sum.push(['Cost of these items' + (noCost ? ' (some not saved)' : ''), bkPeso(cost), ''], ['Kept before expenses', bkPeso(s.total - cost), (s.total - cost) < 0 ? 'neg' : 'keep']);
  slModal('nf72Sale', `<div class="sl-sheet-h"><b>Sale details</b><button class="sl-x" onclick="slClose('nf72Sale')" aria-label="Close">✕</button></div>
    <div class="nf72-sd nf74-sd">
      <div class="nf74-sdh"><div><small>Customer</small><b>${escapeHtml(s.customer || 'Walk-in')}</b></div><div><small>Paid with</small><b>${escapeHtml(pay)}</b></div><div><small>Payment</small><b class="${bal > 0 ? 'due' : 'ok'}">${bal > 0 ? bkPeso(bal) + ' still owed' : 'Paid in full'}</b></div><div><small>Entered by</small><b>${escapeHtml(s.by || '—')}</b></div><div><small>When</small><b>${escapeHtml(when)}</b></div></div>
      <div class="nf74-sdt"><table><thead><tr><th class="t">Item</th><th class="n">Qty</th><th class="n">Price each</th><th class="n">Discount</th>${full ? '<th class="n">Cost each</th>' : ''}<th class="n">Amount</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="nf74-sds">${sum.map(([k, v, c]) => `<div class="${c}"><span>${k}</span><b>${v}</b></div>`).join('')}</div>
      ${s.note ? `<p class="nf72-sdn"><b>Note:</b> ${escapeHtml(s.note)}</p>` : ''}
      ${s.voidedAt ? `<p class="nf72-sdn"><b>Removed</b>${s.voidReason ? ': ' + escapeHtml(s.voidReason) : ''}${s.voidedBy ? ' · by ' + escapeHtml(s.voidedBy) : ''}</p>` : ''}
    </div>
    <div class="nf43-btns"><button type="button" class="btn btn-outline" onclick="slClose('nf72Sale')">Close</button><button type="button" class="btn btn-primary" onclick="slClose('nf72Sale'); bkReceipt('${s.id}')">Receipt</button></div>`);
}
if(typeof nf72SaleDetail === 'function'){ nf72SaleDetail = nf74SaleDetail; window.nf72SaleDetail = nf74SaleDetail; }

/* ---------- 9. Every number popup: the big number stands alone, its note sits under it ---------- */
function nf74BigText(el){
  const src = el.querySelector('.v') || el.querySelector('b'); if(!src) return '';
  const c = src.cloneNode(true); c.querySelectorAll('small, span, em, i, svg').forEach(x => x.remove());
  return (c.textContent || '').replace(/\s+/g, ' ').trim() || (src.textContent || '').replace(/\s+/g, ' ').trim();
}

/* ---------- 10. Expenses: where the money went, as a ring and a ranked list (tap a kind to see its lines) ---------- */
function nf74Where(cats, m, un){
  const total = cats.reduce((a, [, v]) => a + (Number(v) || 0), 0); if(!total) return '';
  const COL = ['#1F6B45', '#2563EB', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#64748B'];
  const top = cats.slice(0, 6), rest = cats.slice(6).reduce((a, [, v]) => a + v, 0); if(rest > 0) top.push(['Everything else', rest]);
  const spikes = {}; ((un && un.spikes) || []).forEach(x => { spikes[x.cat] = x.pct; });
  const R = 54, C = 2 * Math.PI * R; let off = 0;
  const arcs = top.map(([k, v], i) => { const len = v / total * C, a = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${COL[i % COL.length]}" stroke-width="22" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 70 70)"><title>${nf74E(k)}: ${nf74P(v)}</title></circle>`; off += len; return a; }).join('');
  const days = Math.max(1, m === String(APP_TODAY).slice(0, 7) ? Number(String(APP_TODAY).slice(8, 10)) : new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate());
  return `<section class="panel-card nf74-where"><div class="panel-head"><h2>Where the money went</h2><span class="bk-dim">${nf74P(total)} · about ${nf74P(total / days)} a day</span></div>
    <div class="nf74-wb"><div class="nf74-ring"><svg viewBox="0 0 140 140" role="img" aria-label="Share of spending by kind">${arcs}</svg><div class="c"><b>${top.length > 1 ? Math.round(top[0][1] / total * 100) + '%' : '100%'}</b><small>${nf74E(top[0][0])}</small></div></div>
      <ol class="nf74-wl">${top.map(([k, v], i) => `<li><button type="button" ${k === 'Everything else' ? 'disabled' : `onclick="bkExpFilter='${String(k).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'; renderExpensesPage()"`}><i style="background:${COL[i % COL.length]}"></i><span class="k">${nf74E(k)}${spikes[k] ? `<em class="up">+${spikes[k]}% vs usual</em>` : ''}</span><span class="pc">${Math.round(v / total * 100)}%</span><b>${nf74P(v)}</b></button></li>`).join('')}</ol></div>
    <p class="nf74-wn">Tap a kind to see only its lines. A tag shows when a kind is much higher than usual.</p></section>`;
}

/* ---------- 11. Team: every task can be edited (what, who, when, which lane) and deleted from the same place ---------- */
function nf74TaskEdit(id){
  const t = (teamTasks || []).find(x => x.id === id); if(!t) return;
  const people = typeof getActiveTeamMembers === 'function' ? getActiveTeamMembers().filter(m => m.status !== 'invited') : [];
  const col = typeof nf33TCol === 'function' ? nf33TCol(t) : 'todo';
  nf45Pop('nf74Task', 'Edit task', `<label class="nf45-lbl" for="nf74TT">What needs to get done?</label><input id="nf74TT" class="nf45-ta" maxlength="300" value="${nf74E(t.title)}" onkeydown="if(event.key==='Enter') nf74TaskSave('${t.id}')">
    <div class="nf46-tr"><label><span>For</span><select id="nf74TA"><option value="">Anyone</option>${people.map(m => `<option value="${nf74E(m.id)}" ${m.id === t.assignedTo ? 'selected' : ''}>${nf74E(m.name)}</option>`).join('')}</select></label><label><span>Due <small>optional</small></span><input id="nf74TD" type="date" value="${nf74E(t.dueDate || '')}"></label></div>
    <div class="nf74-lanes" role="radiogroup" aria-label="Lane">${[['todo', 'To do'], ['doing', 'Doing'], ['done', 'Done']].map(([k, l]) => `<label class="${k === col ? 'on' : ''}"><input type="radio" name="nf74TL" value="${k}" ${k === col ? 'checked' : ''} onchange="this.closest('.nf74-lanes').querySelectorAll('label').forEach(x => x.classList.toggle('on', x.contains(this)))">${l}</label>`).join('')}</div>
    ${t.createdBy ? `<p class="nf45-sm">Added by ${nf74E(t.createdBy)}${t.createdAt ? ' · ' + nf74E(String(t.createdAt).slice(0, 10)) : ''}</p>` : ''}`,
    `<button type="button" class="btn btn-outline nf74-del" onclick="slClose('nf74Task'); deleteTask('${t.id}')">Delete</button><span style="flex:1"></span><button type="button" class="btn btn-outline" onclick="slClose('nf74Task')">Cancel</button><button type="button" class="btn btn-primary" onclick="nf74TaskSave('${t.id}')">Save</button>`);
  setTimeout(() => { const i = document.getElementById('nf74TT'); if(i){ i.focus(); i.select(); } }, 50);
}
async function nf74TaskSave(id){
  const t = (teamTasks || []).find(x => x.id === id); if(!t) return;
  const title = String((document.getElementById('nf74TT') || {}).value || '').trim(); if(!title){ showToast('Type what needs to get done.', 'warn'); return; }
  const who = (document.getElementById('nf74TA') || {}).value || null, due = (document.getElementById('nf74TD') || {}).value || null;
  const lane = (document.querySelector('input[name="nf74TL"]:checked') || {}).value || 'todo';
  slClose('nf74Task');
  if(title !== t.title || (who || null) !== (t.assignedTo || null) || (due || null) !== (t.dueDate || null))
    await setTaskFields(id, {title, assignedTo: who, dueDate: due}, {title, assigned_to: who, due_date: due}, `Edited: "${title}"`);
  if(typeof nf33TMove === 'function' && nf33TCol(t) !== lane) nf33TMove(id, lane);
  showToast('Task saved.', 'success');
}
if(typeof nf33TCard === 'function'){
  const _card = nf33TCard;
  nf33TCard = function(t){
    return _card(t).replace(/<button type="button" class="nf39-x"[^>]*>✕<\/button>/, `<button type="button" class="nf74-ed" title="Edit" aria-label="Edit task" onclick="nf74TaskEdit('${t.id}')">${nf74Ic('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')}</button>`)
      .replace('<div class="nf39-ct"><b', `<div class="nf39-ct"><b role="button" tabindex="0" title="Edit" onclick="nf74TaskEdit('${t.id}')" onkeydown="if(event.key==='Enter') nf74TaskEdit('${t.id}')"`);
  };
  window.nf33TCard = nf33TCard;
}

/* ---------- 12. Plans & pricing: the ₱0 beta offer, front and centre ---------- */
function nf74Beta(s){ return !!(s && (s.demo || s.pilot)); }
function nf74PlanPrice(p, amt, s){
  const per = p.k === 'free' ? 'forever' : NF26P.cycle === 'yearly' ? 'a year' : 'a month';
  if(!nf74Beta(s) || p.k === 'free') return `${nf74Beta(s) ? '<div class="nf74-was blank" aria-hidden="true">&nbsp;</div>' : ''}<div class="nf26-price"><b>${nf26Peso(amt)}</b><span>${per}</span></div>${nf74Beta(s) ? '<small class="nf74-save blank">Free for good</small>' : ''}`;
  return `<div class="nf74-was"><s>${nf26Peso(amt)} ${per}</s><em>Beta</em></div><div class="nf26-price"><b>₱0</b><span>during beta</span></div><small class="nf74-save">You save ${nf26Peso(amt)} ${NF26P.cycle === 'yearly' ? 'a year' : 'every month'}</small>`;
}
function nf74PlanOffer(s){
  if(!s || !s.demo) return '';
  return `<div class="nf74-offer"><div><b>Beta offer: every Pro and Business feature, ₱0.</b><span>That is up to ₱2,990 a month you don't pay while Nifti is in beta. No card, no contract. When the beta ends, we tell you first and you choose.</span></div><button type="button" class="btn btn-primary" onclick="nf74PlanDemo('business')">Start free now</button></div>`;
}
function nf74PlanDemo(k){ nf26ClosePlans(); try{ localStorage.setItem('nifti-want-plan', k); }catch(e){} navigate('login'); try{ nf20ToSignup(); }catch(e){} }
function nf74PlanFoot(s){
  if(nf74Beta(s)) return `<div class="nf26-how"><b>During beta</b><p>${s.pilot ? 'Business-level features are enabled at no charge. No payment is due and no subscription record is changed. Your assigned plan is retained for billing after the beta period.' : 'There is no payment step while Nifti is in beta. When the beta ends, we tell you first, and you choose a plan or stay on Free. Your records stay either way.'}</p></div>`;
  return `<div class="nf26-how"><b>How paying works</b><ol><li><span>1</span>Choose a plan and scan our QR with GCash, Maya or any bank app.</li><li><span>2</span>Type the reference number, or snap the receipt.</li><li><span>3</span>We switch your plan on, usually within a few hours.</li></ol>
    <p>No card and no contract. If you stop, you go back to Free and keep all your records. Questions? <a onclick="nf26ClosePlans(); nf26Help()">Message the Nifti team</a>.</p></div>`;
}

/* ---------- 13. Count the cash: the day's summary, same look as the owner view ---------- */
function nf74DaySummary(sales, pays, tot, lines, salesTotal){
  const P = n => nf74P(n), list = Object.entries(pays || {}).sort((a, b) => b[1] - a[1]);
  const byWho = {}; (lines || []).forEach(l => { if(l.discount > 0) byWho[l.by || 'Someone'] = (byWho[l.by || 'Someone'] || 0) + l.discount; });
  const who = Object.entries(byWho).sort((a, b) => b[1] - a[1]);
  const kept = (tot.revenue || 0) - (tot.cost || 0);
  return `<div class="nf74-ow nf74-day">
    <div class="nf74-ot t-b nf74-costs"><span class="lb">How they paid · ${P(salesTotal)} in all</span>${list.length ? `<ol>${list.map(([k, v], i) => `<li><span class="n">${i + 1}</span><span class="k">${nf74E(k)}</span><b>${P(v)}</b><em>${salesTotal ? Math.round(v / salesTotal * 100) : 0}%</em></li>`).join('')}</ol>` : '<small>No sales recorded this day.</small>'}<small>${sales.length} sale${sales.length === 1 ? '' : 's'}${(pays.Cash || 0) ? ` · ${P(pays.Cash)} should be in the drawer from sales` : ''}</small></div>
    <div class="nf74-ot t-${kept < 0 ? 'r' : 'g'}"><span class="lb">${kept < 0 ? 'Lost before expenses' : 'Kept before expenses'}</span><b>${P(kept)}</b><small>Sold ${P(tot.revenue)} · the items cost ${P(tot.cost)}</small></div>
    <div class="nf74-ot t-${tot.discount ? 'y' : 'g'}"><span class="lb">Discounts given</span><b>${P(tot.discount)}</b><small>${who.length ? who.map(([k, v]) => `${nf74E(k)} ${P(v)}`).join(' · ') : 'Everything sold at the price list'}</small></div>
  </div>`;
}
function nf74BigSub(el){
  const src = el.querySelector('.v') || el.querySelector('b'); if(!src) return '';
  return [...src.querySelectorAll('small, span, em')].map(x => x.textContent.trim()).filter(Boolean).join(' · ');
}

/* ---------- 14. Every table: a column's header lines up with its cells (left, centre or right) ---------- */
function nf74AlignHeads(){
  const page = document.querySelector('#view-app .app-page.active'); if(!page) return;
  page.querySelectorAll('table').forEach(t => {
    if(!t.offsetParent || t.closest('.nf74-sdt')) return;
    const head = t.tHead && t.tHead.rows[0]; if(!head) return;
    const row = [...(t.tBodies[0] ? t.tBodies[0].rows : [])].find(r => r.cells.length === head.cells.length && !r.querySelector('td[colspan]')); if(!row) return;
    [...head.cells].forEach((th, i) => { const td = row.cells[i]; if(!td) return;
      let want = getComputedStyle(td).textAlign; if(want === 'start') want = 'left'; if(want === 'end') want = 'right';
      let have = getComputedStyle(th).textAlign; if(have === 'start') have = 'left'; if(have === 'end') have = 'right';
      if(want !== have) th.style.setProperty('text-align', want, 'important'); });
  });
}
NF45_AFTER.push(() => { try{ nf74AlignHeads(); }catch(e){} });
