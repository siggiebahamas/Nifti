/* ===== Round 37 ===== */

/* ---------- 1. Red counts: never an empty circle or a 0; a section you've opened stops nagging ---------- */
const NF37 = {seenKey: () => 'nifti-seen-37:' + ((typeof myBusiness !== 'undefined' && myBusiness && myBusiness.id) || 'demo')};
// pages whose red count means "new since you last looked". Messages and Help keep counting unread chats.
const NF37_SEEN_PAGES = ['orders', 'inventory', 'money', 'issues', 'team', 'cashcount', 'followups', 'cheques', 'collections', 'routes', 'returns'];
const NF37_BADGES = '.nav-badge, .nf26-n, .team-tab-count, .sl-n, .nf33-tabs em, .nf33-badge, .nf36v-n, #nf26HelpNav em, .nfm-it em, .bnav-item .nav-badge, #moreSheet .nav-badge';
function nf37Seen(){ try{ return JSON.parse(localStorage.getItem(NF37.seenKey()) || '{}') || {}; }catch(e){ return {}; } }
function nf37SetSeen(o){ try{ localStorage.setItem(NF37.seenKey(), JSON.stringify(o)); }catch(e){} }
function nf37Raw(el){ const t = (el.textContent || '').trim(); if(!t || t === '0') return 0; if(t === '!') return 1; const n = parseInt(t.replace(/[^\d]/g, ''), 10); return isNaN(n) ? 1 : n; }
function nf37BaseHidden(el){ const d = el.style && el.style.display; return d === 'none'; }
function nf37PageOf(el){ const it = el.closest('.nav-item[data-page], .bnav-item[data-page], .more-sheet-item[data-page]'); if(it) return it.dataset.page;
  if(el.id === 'bnavOrdersBadge') return 'orders'; return null; }
function nf37Sweep(){
  try{ if(updateInventoryNavBadge._nf37) updateInventoryNavBadge(); }catch(e){}
  const seen = nf37Seen();
  document.querySelectorAll(NF37_BADGES).forEach(el => {
    const raw = nf37BaseHidden(el) ? 0 : nf37Raw(el);
    let hide = raw <= 0;
    const pg = !hide && nf37PageOf(el);
    if(pg && NF37_SEEN_PAGES.includes(pg) && seen[pg] != null){
      if(raw < seen[pg]){ seen[pg] = raw; nf37SetSeen(seen); }
      if(raw <= seen[pg]) hide = true;
    }
    if(el.id === 'bnavMoreBadge'){ // the phone "More" count = stock + team; hidden once both were opened
      const inv = document.querySelector('.sidebar .nav-item[data-page="inventory"] .nav-badge'), tm = document.querySelector('.sidebar .nav-item[data-page="team"] .nav-badge');
      if((!inv || inv.classList.contains('nf37-hide')) && (!tm || tm.classList.contains('nf37-hide'))) hide = true;
    }
    if(el.classList.contains('nf37-hide') !== hide) el.classList.toggle('nf37-hide', hide);
  });
}
function nf37MarkSeen(page){
  if(!NF37_SEEN_PAGES.includes(page)) return;
  const el = document.querySelector('.sidebar .nav-item[data-page="' + page + '"] .nav-badge');
  const raw = el && !nf37BaseHidden(el) ? nf37Raw(el) : 0;
  const s = nf37Seen(); s[page] = raw; nf37SetSeen(s); nf37Sweep();
}
// the menu heading count adds up only the counts you can still see
nf36GroupTodo = function(g){ return [...g.querySelectorAll('.nav-item')].filter(it => typeof nf26Visible !== 'function' || nf26Visible(it)).reduce((s, it) => { const b = it.querySelector('.nav-badge'); return s + (b && !b.classList.contains('nf37-hide') && !nf37BaseHidden(b) ? nf37Raw(b) : 0); }, 0); };
try{ window.nf36GroupTodo = nf36GroupTodo; }catch(e){}

/* ---------- 2. Each page says what its red count was about ---------- */
const NF37_WHY = {
  orders: {n: n => `${n} order${n === 1 ? ' needs' : 's need'} you now`, sel: '.nfo-band.b-red, .nfo-st.s-red'},
  inventory: {n: n => `${n} item${n === 1 ? ' is' : 's are'} running low`, sel: '.rs-zone.crit, .rs-crit, [class*="crit"], .nf8-low, .stock-row.low'},
  money: {n: n => `${n} thing${n === 1 ? '' : 's'} to look at`, sel: '.bk-flag.red, .bk-alert.red, .lg-card.red, .bk-flags'},
  issues: {n: n => `${n} thing${n === 1 ? '' : 's'} to check`, sel: '#page-issues .lg-card'},
  team: {n: n => `${n} job${n === 1 ? '' : 's'} for you`, sel: '.nf33t-col, .task-card'},
  cashcount: {n: () => 'Today\'s cash isn\'t counted yet', sel: '#page-cashcount input, .cc-form'},
};
function nf37Why(page){
  if(!page) return;
  const key = page.id.replace(/^page-/, ''), cfg = NF37_WHY[key];
  const old = page.querySelector(':scope .nf37-why');
  const el = document.querySelector('.sidebar .nav-item[data-page="' + key + '"] .nav-badge');
  const raw = el && !nf37BaseHidden(el) ? nf37Raw(el) : 0;
  if(!cfg || !raw){ if(old) old.remove(); return; }
  const html = `<span class="nf37-dot" aria-hidden="true"></span><b>${escapeHtml(cfg.n(raw))}</b><button type="button" onclick="nf37ShowMe('${key}')">Show me</button>`;
  let box = old;
  if(!box){ box = document.createElement('div'); box.className = 'nf37-why'; box.setAttribute('role', 'status'); const head = page.querySelector('.page-head'); if(head && head.parentElement === page) head.after(box); else page.prepend(box); }
  if(box._h !== html){ box.innerHTML = html; box._h = html; }
}
function nf37LowNames(){ try{ return inventoryData.filter(i => { if(i.ropEnabled === false) return false; const oh = Number(i.onHand), rop = Number(i.rop); return rop > 0 && !isNaN(oh) ? oh <= rop * 1.5 : (i.status === 'critical' || i.status === 'warning'); }).map(i => i.name); }catch(e){ return []; } }
function nf37ShowMe(key){
  const cfg = NF37_WHY[key]; if(!cfg) return;
  if(key === 'inventory'){ // the items running low, wherever they sit on the page
    const names = nf37LowNames(), pg = document.getElementById('page-inventory'); if(pg){
      const rows = []; names.forEach(n => { const cell = [...pg.querySelectorAll('td, .rs-name, b, strong')].find(x => (x.textContent || '').trim() === n && x.getBoundingClientRect().height > 0); if(cell) rows.push(cell.closest('tr, .rs-row, li, .card, div') || cell); });
      if(rows.length){ rows[0].scrollIntoView({behavior: 'smooth', block: 'center'}); rows.forEach(r => { r.classList.add('nf37-flash'); setTimeout(() => r.classList.remove('nf37-flash'), 1800); }); return; } } }
  const page = document.getElementById('page-' + key) || document;
  const t = [...page.querySelectorAll(cfg.sel)].find(x => x.getBoundingClientRect().height > 0);
  if(!t){ showToast('It\'s on this page. Look for the red marks.', 'info'); return; }
  t.scrollIntoView({behavior: 'smooth', block: 'center'}); t.classList.add('nf37-flash'); setTimeout(() => t.classList.remove('nf37-flash'), 1800);
}

/* ---------- 3. To check: no "New" tag ---------- */
function nf37Issues(page){
  if(!page || page.id !== 'page-issues') return;
  page.querySelectorAll('.lg-pill.st').forEach(p => { if(/^new$/i.test((p.textContent || '').trim())) p.remove(); });
}

/* ---------- 4. Getting paid: the lines under each customer always add up ---------- */
function nf37Owed(page){
  if(!page || page.id !== 'page-collections') return;
  let rows = []; try{ rows = colRows(); }catch(e){ return; }
  page.querySelectorAll('table.nf25-owed tbody tr').forEach(tr => {
    const name = ((tr.querySelector('td.t b') || {}).textContent || '').trim(); const g = rows.find(x => x.name === name); if(!g) return;
    const total = Math.round(Number(g.total) || 0), says = Math.min(Math.round(Number(g.pending) || 0), total);
    const promAmt = g.promise ? Math.round(Number(g.promise.amount) || 0) : 0, promised = Math.min(promAmt, Math.max(0, total - says)), left = Math.max(0, total - says - promised);
    const sig = [total, says, promised, left, g.maxLate, g.promise && g.promise.promised_date].join('|'); if(tr.dataset.nf37 === sig) return; tr.dataset.nf37 = sig;
    const cell = tr.querySelector('td.w .nf26-gl') || tr.querySelector('td.w'); if(!cell) return;
    const cancel = cell.querySelector('.nf25-cancel, button[onclick^="colCancelPromise"]');
    const ln = (cls, label, val, extra) => `<div class="nf37-l"><i class="${cls}"></i><span>${escapeHtml(label)}</span>${val ? `<b>${escapeHtml(val)}</b>` : '<b></b>'}${extra || ''}</div>`;
    const out = [];
    if(g.overdue > 0 && g.maxLate > 0) out.push(ln('bad', 'Late', `${g.maxLate} day${g.maxLate === 1 ? '' : 's'}`));
    if(says > 0) out.push(ln('warn', says >= total ? 'They say they paid all of it' : 'They say they paid', bkPeso(says), `<small class="nf37-why2">${g.pending > total ? 'more than they owe' : 'check your bank or GCash'}</small>`));
    if(promised > 0) out.push(ln('good', 'Promised', bkPeso(promised) + (g.promise.promised_date ? ' by ' + fuDueLabel(g.promise.promised_date).toLowerCase() : '')));
    else if(promAmt > 0 && says >= total) out.push(ln('', 'Their promise is covered by what they say they paid', ''));
    if(left > 0 && (says > 0 || promised > 0)) out.push(ln('', 'Not promised yet', bkPeso(left)));
    cell.innerHTML = out.join('');
    if(cancel && promised > 0){ cancel.classList.add('nf37-cancel'); const pl = [...cell.querySelectorAll('.nf37-l')].find(x => /Promised/.test(x.textContent)); if(pl) pl.appendChild(cancel); }
    // the amount owed shows how it splits, so the numbers visibly add up
    const owes = tr.querySelector('td.n'); if(owes && (says > 0 || promised > 0)){
      const parts = []; if(says) parts.push(bkPeso(says) + ' says paid'); if(promised) parts.push(bkPeso(promised) + ' promised'); if(left && (says || promised)) parts.push(bkPeso(left) + ' open');
      owes.innerHTML = `<b>${bkPeso(total)}</b><small class="nf37-split">= ${parts.join(' + ')}</small>`;
    }
  });
}

/* ---------- 5. Money overview: coming up, in columns, any time span ---------- */
const NF37N = {days: 30, all: false};
const NF37_SPANS = [[7, 'This week'], [14, 'Next 2 weeks'], [30, 'Next 30 days'], ['m', 'This month'], [60, 'Next 2 months'], [90, 'Next 3 months']];
function nf37SpanEnd(){ if(NF37N.days === 'm'){ const [y, m] = APP_TODAY.split('-').map(Number); return y + '-' + String(m).padStart(2, '0') + '-' + String(new Date(y, m, 0).getDate()).padStart(2, '0'); } return addDaysIso(APP_TODAY, NF37N.days); }
function nf37Items(){
  const end = nf37SpanEnd(), items = [];
  try{ unpaidInvoicesFor('supplier').forEach(x => { const d = x.due && x.due > APP_TODAY ? x.due : APP_TODAY; if(d <= end) items.push({k: 'in', d, amt: x.balance, type: 'To collect', ref: (x.po.invoice && x.po.invoice.number) || x.po.poNumber, who: x.po.buyerName, late: x.daysOverdue > 0, days: x.daysOverdue, po: x.po, file: x.po.invoice && x.po.invoice.attachmentName, what: 'To collect · ' + ((x.po.invoice && x.po.invoice.number) || x.po.poNumber)}); }); }catch(e){}
  try{ unpaidInvoicesFor('buyer').forEach(x => { const d = x.due && x.due > APP_TODAY ? x.due : APP_TODAY; if(d <= end) items.push({k: 'bill', d, amt: -x.balance, type: 'Bill to pay', ref: (x.po.invoice && x.po.invoice.number) || x.po.poNumber, who: x.po.supplierName, late: x.daysOverdue > 0, days: x.daysOverdue, po: x.po, file: x.po.invoice && x.po.invoice.attachmentName, what: 'To pay · ' + ((x.po.invoice && x.po.invoice.number) || x.po.poNumber)}); }); }catch(e){}
  try{ const rec = {}; BK.expenses.filter(e => !e.deletedAt && e.repeat && (e.status || 'approved') === 'approved').forEach(e => { if(!rec[e.category] || e.date > rec[e.category].date) rec[e.category] = e; });
    Object.values(rec).forEach(e => { const day = String(e.date).slice(8, 10); let m = APP_TODAY.slice(0, 7);
      for(let i = 0; i < 4; i++){ const d = m + '-' + day; if(d > APP_TODAY && d <= end) items.push({k: 'exp', d, amt: -e.amount, type: 'Monthly bill', ref: e.category, what: e.category, who: e.vendor || 'Every month', cat: e.category, last: e, file: e.receipt ? 'Last bill photo' : (!myBusiness ? 'Last bill photo' : '')}); m = bkNextMonth(m); } }); }catch(e){}
  try{ const lastPay = (typeof PR !== 'undefined' ? PR.runs : []).filter(r => r.status === 'paid').sort((a, b) => String(b.paid_on).localeCompare(String(a.paid_on)))[0];
    if(lastPay){ const lines = PR.lines.filter(l => l.run_id === lastPay.id), net = lines.reduce((a, l) => a + Number(l.net || 0), 0), gap = Math.max(7, daysBetween(lastPay.period_from, lastPay.period_to) + 1);
      let d = addDaysIso(lastPay.paid_on, gap); while(d <= APP_TODAY) d = addDaysIso(d, gap);
      while(d <= end){ items.push({k: 'pay', d, amt: -net, type: 'Payroll', ref: 'Payday', what: 'Payroll', who: lines.length + ' ' + (lines.length === 1 ? 'person' : 'people'), run: lastPay, lines}); d = addDaysIso(d, gap); } } }catch(e){}
  return items.sort((a, b) => a.d.localeCompare(b.d) || (b.amt - a.amt));
}
function nf37NextHtml(){
  const items = nf37Items(); NF31N.items = items;
  const tIn = items.filter(x => x.amt > 0).reduce((a, x) => a + x.amt, 0), tOut = -items.filter(x => x.amt < 0).reduce((a, x) => a + x.amt, 0), net = tIn - tOut;
  const cap = 6, show = NF37N.all ? items : items.slice(0, cap);
  const span = NF37_SPANS.find(s => s[0] === NF37N.days) || NF37_SPANS[2];
  const status = x => x.late ? `<span class="nf37-st late">${x.days} day${x.days === 1 ? '' : 's'} late</span>` : x.d === APP_TODAY ? '<span class="nf37-st today">Due today</span>' : `<span class="nf37-st">In ${daysBetween(APP_TODAY, x.d)} day${daysBetween(APP_TODAY, x.d) === 1 ? '' : 's'}</span>`;
  return `<section class="panel-card nf31-next nf37-next" id="nf37Next">
    <div class="nf37-nh"><h2>Coming up: money in and out</h2>
      <label class="nf37-span"><span>Show</span><select onchange="NF37N.days = this.value === 'm' ? 'm' : Number(this.value); NF37N.all = false; nf37NextRepaint()">${NF37_SPANS.map(([v, l]) => `<option value="${v}"${v === NF37N.days ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <div class="nf37-tot">
      <div class="in"><small>Coming in</small><b>+${bkPeso(tIn)}</b></div>
      <div class="out"><small>Going out</small><b>−${bkPeso(tOut)}</b></div>
      <div class="net ${net >= 0 ? 'pos' : 'neg'}"><small>${net >= 0 ? 'Left over' : 'More going out than coming in'}</small><b>${net >= 0 ? '+' : '−'}${bkPeso(Math.abs(net))}</b></div>
    </div>
    ${items.length ? `<div class="nf37-tbl" role="table" aria-label="Money coming in and going out">
      <div class="nf37-tr nf37-th" role="row"><span role="columnheader">In / out</span><span role="columnheader">What</span><span role="columnheader">Who</span><span role="columnheader">Due</span><span role="columnheader">Status</span><span role="columnheader" class="r">Amount</span><span role="columnheader">File</span></div>
      ${show.map((x, i) => `<button type="button" class="nf37-tr ${x.amt > 0 ? 'in' : 'out'}${x.late ? ' late' : ''}" role="row" onclick="nf31Open(${i})">
        <span class="nf37-io" data-l="In / out">${x.amt > 0 ? NF31_IC.in : NF31_IC.out}<em>${x.amt > 0 ? 'In' : 'Out'}</em></span>
        <span class="nf37-what" data-l="What"><b>${escapeHtml(x.type)}</b><small>${escapeHtml(String(x.ref || '').replace(/^PO-\d{4}-/, 'Order '))}</small></span>
        <span class="nf37-who" data-l="Who">${escapeHtml(x.who || '')}</span>
        <span class="nf37-due" data-l="Due">${x.d === APP_TODAY ? 'Today' : escapeHtml(bkDayLabel(x.d))}</span>
        <span data-l="Status">${status(x)}</span>
        <span class="nf37-amt r" data-l="Amount">${x.amt > 0 ? '+' : '−'}${bkPeso(Math.abs(x.amt))}</span>
        <span class="nf37-file" data-l="File">${x.file ? `${NF31_IC.file}${x.k === 'exp' ? 'Photo' : 'File'}` : '—'}</span></button>`).join('')}
    </div>
    ${items.length > cap ? `<button type="button" class="nf37-more" onclick="NF37N.all = !NF37N.all; nf37NextRepaint()">${NF37N.all ? 'Show fewer' : `Show ${items.length - cap} more`}</button>` : ''}`
    : `<p class="nf37-none">Nothing due ${escapeHtml(span[1].toLowerCase())}.</p>`}
  </section>`;
}
function nf37NextRepaint(){ const el = document.getElementById('nf37Next'); if(el) el.outerHTML = nf37NextHtml(); }
try{ window.lgForecastHtml = nf37NextHtml; lgForecastHtml = nf37NextHtml; }catch(e){}

/* ---------- wiring ---------- */
(function(){
  const base = nf26AfterPass;
  nf26AfterPass = function(page){
    base(page);
    try{ if(page && page.id){ nf37MarkSeen(page.id.replace(/^page-/, '')); nf37Why(page); nf37Issues(page); nf37Owed(page); } }catch(e){ console.warn('nf37', e); }
  };
  window.nf26AfterPass = nf26AfterPass;
  setInterval(() => { try{ nf37Sweep(); }catch(e){} }, 700);
  setTimeout(() => { try{ nf37Sweep(); }catch(e){} }, 300);
})();

// the Stock count is always "items running low", whichever side (selling or buying) you last looked at
(function(){
  if(typeof updateInventoryNavBadge !== 'function') return;
  const w = function(){ const b = document.getElementById('inventoryNavBadge'); if(!b) return; const n = nf37LowNames().length; b.style.display = n > 0 ? 'inline-flex' : 'none'; b.textContent = n; };
  w._nf37 = true; window.updateInventoryNavBadge = w; try{ updateInventoryNavBadge = w; }catch(e){}
})();
