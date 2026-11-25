/* ===== Round 75: founder feedback pass 4 ===== */
function nf75E(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
function nf75P(n){ const v = Math.round(Number(n) || 0); return (v < 0 ? '−₱' : '₱') + Math.abs(v).toLocaleString('en-PH'); }
function nf75Ic(d, s){ return `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`; }
function nf75Boss(){ try{ return booksCanSeeTotals(); }catch(e){ return true; } }

/* ---------- 1. Home owner view: profit with a same-days bar, margin as one plain number ---------- */
function nf75OwnerHtml(){
  const m = bkMonth(APP_TODAY), p = bkPnl(m), mon = nf74Mon(m, 'long');
  const sales = Number(p.sales) || 0, cogs = Number(p.cost) || 0, opex = Number(p.expenses) || 0, spend = cogs + opex, profit = sales - spend;
  const R = nf74SameRange(m), q = nf74PnlRange(R), qp = q && q.sales ? q.net : null;
  const margin = sales ? profit / sales * 100 : null;
  const tone = v => v == null ? 'n' : v < 0 ? 'r' : v < 10 ? 'y' : 'g';
  const parts = [['Stock you sold', cogs]].concat(Object.entries(p.byCat || {}).filter(([, v]) => Number(v) > 0).sort((a, b) => b[1] - a[1]));
  const top = parts.filter(([, v]) => v > 0).slice(0, 3);
  // same-days comparison as two bars
  let cmp = '';
  if(qp != null){ const mx = Math.max(Math.abs(profit), Math.abs(qp), 1), d = profit - qp;
    const bar = (lbl, v, cls) => `<div class="nf75-cb"><span class="l">${lbl}</span><span class="t"><i class="${cls}${v < 0 ? ' neg' : ''}" style="width:${Math.max(4, Math.abs(v) / mx * 100).toFixed(1)}%"></i></span><b>${nf75P(v)}</b></div>`;
    cmp = `<div class="nf75-cmp">${bar(nf75E(mon.slice(0, 3)) + ' so far', profit, 'now')}${bar(nf75E(R.label), qp, 'was')}</div><em class="nf74-ch ${Math.abs(d) < 1 ? 'z' : d > 0 ? 'g' : 'r'}">${Math.abs(d) < 1 ? 'Same as ' + nf75E(R.label) : (d > 0 ? '▲ ' : '▼ ') + nf75P(Math.abs(d)) + (d > 0 ? ' ahead of ' : ' behind ') + nf75E(R.label)}</em>`; }
  else cmp = `<small>Sales ${nf75P(sales)} minus every cost</small>`;
  const pct = margin == null ? 0 : Math.max(0, Math.min(1, margin / 30)), C = 2 * Math.PI * 30;
  const ring = `<svg class="nf75-ring t-${tone(margin)}" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="30" class="bg"/><circle cx="36" cy="36" r="30" class="fg" stroke-dasharray="${(C * pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 36 36)"/></svg>`;
  const keep = margin == null ? null : Math.max(0, Math.round(margin));
  return `<section class="sect glass nf72-owner nf74-owner nf75-owner" aria-labelledby="nf74OwH">
    <div class="sect-h"><h4 id="nf74OwH">Owner view · ${nf75E(mon)} so far</h4><button class="sch-btn" type="button" onclick="go('money')">Money overview ›</button></div>
    <div class="nf74-ow nf75-ow">
      <button type="button" class="nf74-ot nf75-pt t-${profit < 0 ? 'r' : 'g'}" onclick="go('money')"><span class="lb">${profit < 0 ? 'Loss so far' : 'Profit so far'}</span><b>${nf75P(profit)}</b>${cmp}<i class="go" aria-hidden="true">›</i></button>
      <button type="button" class="nf74-ot nf75-mg t-${tone(margin)}" onclick="go('profit')"><span class="lb">You keep</span><div class="nf75-mgb"><div><b>${margin == null ? '—' : margin.toFixed(1) + '%'}</b><span class="u">profit margin</span></div>${ring}</div><small>${keep == null ? 'Shows once you record a sale' : `₱${keep} of every ₱100 you sell`}</small><i class="go" aria-hidden="true">›</i></button>
      <button type="button" class="nf74-ot t-b nf74-costs" onclick="go('expenses')"><span class="lb">Biggest costs · ${nf75P(spend)} in all</span>${top.length ? `<ol>${top.map(([k, v], i) => `<li><span class="n">${i + 1}</span><span class="k">${nf75E(k)}</span><b>${nf75P(v)}</b><em>${spend ? Math.round(v / spend * 100) : 0}%</em></li>`).join('')}</ol>` : '<small>No costs recorded yet this month.</small>'}<i class="go" aria-hidden="true">›</i></button>
    </div>
  </section>`;
}
if(typeof nf72OwnerHtml === 'function'){ nf72OwnerHtml = nf75OwnerHtml; window.nf72OwnerHtml = nf75OwnerHtml; }

/* ---------- 2. Walk-in sales: one page again (no tabs). Sales first, then the cash drawer, neatly ---------- */
if(typeof nf74SalesTabs === 'function'){
  nf74SalesTabs = function(){ const pg = document.getElementById('page-sales'); if(!pg) return; const bar = pg.querySelector(':scope > .nf74-tabs'); if(bar) bar.remove(); if(pg.dataset.nf74t) delete pg.dataset.nf74t; };
  window.nf74SalesTabs = nf74SalesTabs;
}
if(typeof nf74SalesTab === 'function'){
  nf74SalesTab = function(t){ if(t !== 'cash') return; const el = document.getElementById('mhDrawer') || document.getElementById('nf18Count'); if(el) el.scrollIntoView({behavior: 'smooth', block: 'start'}); };
  window.nf74SalesTab = nf74SalesTab;
}
// the month's cash summary, inside the calendar header
function nf75CalStat(y, m, by){
  try{
    const mo = y + '-' + String(m).padStart(2, '0'), days = Object.values(by || {}).filter(c => c.day.slice(0, 7) === mo);
    const settled = c => typeof nf74Settled === 'function' && nf74Settled(c);
    const shortL = days.filter(c => c.diff < -0.5 && !settled(c)), overL = days.filter(c => c.diff > 0.5 && !settled(c));
    const short = shortL.reduce((a, c) => a + c.diff, 0), over = overL.reduce((a, c) => a + c.diff, 0);
    const worst = shortL.slice().sort((a, b) => a.diff - b.diff)[0];
    const ok = days.filter(c => Math.abs(c.diff) < 1 || settled(c)).length;
    let miss = 0; const today = String(APP_TODAY), start = addDaysIso(today, -14);
    for(let d = 1; d <= new Date(y, m, 0).getDate(); d++){ const k = mo + '-' + String(d).padStart(2, '0'); if(k >= today || k < start) continue; if(!(by || {})[k]) miss++; }
    const lbl = k => new Date(k + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric'});
    return `<div class="nf75-cs" role="group" aria-label="This month's cash counts">
      <span class="c r"><i></i><b>${short ? nf75P(short) : '₱0'}</b><small>short${worst ? ' · worst ' + lbl(worst.day) : ''}</small></span>
      <span class="c y"><i></i><b>${over ? '+' + nf75P(over).replace('−', '') : '₱0'}</b><small>over</small></span>
      <span class="c n"><i></i><b>${miss}</b><small>not counted · 2 weeks</small></span>
      <span class="c g"><i></i><b>${ok} of ${days.length}</b><small>matched</small></span></div>`;
  }catch(e){ return ''; }
}
// today's box: who counts, and that anyone with cash access can step in
function nf75WhoCounts(k){
  try{
    if(k !== APP_TODAY) return '';
    const done = mhCounts()[k];
    if(done) return `<div class="nf75-who ok">${nf75Ic('<path d="M20 6 9 17l-5-5"/>', 20)}<span><b>Counted by ${nf75E(mhFull(done.by))}</b>Tap a day in the calendar to see any count.</span></div>`;
    const s = mhSched(), who = mhWho(k, s);
    let me = ''; try{ me = mhFirst(bkMe()); }catch(e){}
    return `<div class="nf75-who"><span class="av">${nf75E(mhIni ? mhIni(who) : String(who).slice(0, 2))}</span><span><b>Tonight: ${nf75E(mhFull(who))} counts the cash</b>Not in today? Anyone who can open Walk-in sales can count instead${me ? `, including you (${nf75E(me)})` : ''}. The count is saved under the name of whoever enters it.</span><button type="button" class="btn btn-outline" onclick="mhOpenSched()">Change who counts</button></div>`;
  }catch(e){ return ''; }
}
// mark the sections once so the page can lay them out
function nf75SalesMarks(){
  const pg = document.getElementById('page-sales'); if(!pg || !pg.classList.contains('active')) return;
  if(!pg.classList.contains('nf75-one')) pg.classList.add('nf75-one');
  pg.querySelectorAll('#bkSalesBody > section.panel-card').forEach(sec => {
    const h = ((sec.querySelector('.panel-head h2') || {}).textContent || '').trim();
    const c = /^Utang/.test(h) ? 'nf75-utang' : /^Discounts/.test(h) ? 'nf75-disc' : sec.querySelector('[onclick^="nf72SaleDetail"], [onclick^="bkReceipt"]') || /^(Today|Yesterday|Sun|Mon|Tue|Wed|Thu|Fri|Sat|\w{3},)/.test(h) ? 'nf75-today' : '';
    if(c && !sec.classList.contains(c)) sec.classList.add(c);
    if((c === 'nf75-utang' || c === 'nf75-disc') && !sec.classList.contains('nf75-mini')) sec.classList.add('nf75-mini');
  });
  const d = document.getElementById('mhDrawer'); if(d){ const h = d.querySelector('.sect-h h4'); if(h && h.firstChild && h.firstChild.nodeType === 3 && h.firstChild.textContent !== 'Count the cash') h.firstChild.textContent = 'Count the cash'; }
}
NF45_AFTER.push(() => { try{ nf75SalesMarks(); }catch(e){} });

/* ---------- 3. Expenses: one approval rule in the All expenses header; where the money went as tiles ---------- */
function nf75ExpRule(){
  const pg = document.querySelector('#page-expenses.active'); if(!pg || !nf75Boss()) return;
  const sec = [...pg.querySelectorAll('section.panel-card')].find(s => /^(All expenses|[A-Z])/.test(((s.querySelector('.panel-head h2') || {}).textContent || '')) && s.querySelector('table.nf25-t th.d'));
  if(!sec) return; const head = sec.querySelector('.panel-head'); if(!head) return;
  let amt = 2000; try{ amt = bkApproveOver(); }catch(e){}
  const k = String(amt);
  let r = head.querySelector('.nf75-rule');
  if(!r){ r = document.createElement('span'); r.className = 'nf75-rule'; const cnt = head.querySelector('.bk-dim'); if(cnt) cnt.before(r); else head.appendChild(r); }
  if(r.dataset.k !== k){ r.dataset.k = k; r.innerHTML = `${nf75Ic('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>', 18)}<span>Staff expenses from <b>${nf75P(amt)}</b> need your OK</span><button type="button" class="nf75-rbtn" onclick="nf75RuleEdit()">Change</button>`; }
}
function nf75RuleEdit(){
  let amt = 2000; try{ amt = bkApproveOver(); }catch(e){}
  nf45Pop('nf75Rule', 'Approval rule', `<p class="nf45-p">Expenses your staff add from this amount wait for your OK before they count in your books. Smaller ones count right away.</p>
    <label class="nf45-lbl" for="nf75RuleAmt">Needs your OK from</label><div class="nf75-peso"><span>₱</span><input id="nf75RuleAmt" inputmode="decimal" value="${amt}"></div>
    <div class="nf75-qk">${[500, 1000, 2000, 5000].map(v => `<button type="button" onclick="document.getElementById('nf75RuleAmt').value=${v}">${nf75P(v)}</button>`).join('')}</div>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf75Rule')">Cancel</button><button type="button" class="btn btn-primary" onclick="nf75RuleSave()">Save</button>`);
}
async function nf75RuleSave(){
  const v = Math.max(0, Number(String((document.getElementById('nf75RuleAmt') || {}).value || '').replace(/[^\d.]/g, '')) || 0); if(!v){ showToast('Type an amount, for example 2000.', 'warn'); return; }
  slClose('nf75Rule'); const ok = await bkSaveSettings({approve_over: v}); if(ok !== false){ showToast('Saved. Staff expenses from ' + nf75P(v) + ' need your OK.', 'success'); try{ renderExpensesPage(); }catch(e){} }
}
NF45_AFTER.push(() => { try{ nf75ExpRule(); }catch(e){} });
function nf75Where(cats, m, un){
  const total = cats.reduce((a, [, v]) => a + (Number(v) || 0), 0); if(!total) return '';
  const COL = ['#1F6B45', '#2563EB', '#B7791F', '#7C3AED', '#DB2777', '#0E7490', '#475467'];
  const top = cats.slice(0, 7), rest = cats.slice(7).reduce((a, [, v]) => a + v, 0); if(rest > 0) top.push(['Everything else', rest]);
  const spikes = {}; ((un && un.spikes) || []).forEach(x => { spikes[x.cat] = x.pct; });
  const days = Math.max(1, m === String(APP_TODAY).slice(0, 7) ? Number(String(APP_TODAY).slice(8, 10)) : new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate());
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<section class="panel-card nf75-where"><div class="panel-head"><h2>Where the money went</h2><span class="nf75-wt"><b>${nf75P(total)}</b> spent · about ${nf75P(total / days)} a day</span></div>
    <div class="nf75-wg">${top.map(([k, v], i) => { const pc = Math.round(v / total * 100), c = COL[i % COL.length];
      return `<button type="button" class="nf75-wc" style="--c:${c}" ${k === 'Everything else' ? 'disabled' : `onclick="bkExpFilter='${esc(k)}'; renderExpensesPage()"`}><span class="k">${nf75E(k)}</span><b>${nf75P(v)}</b><span class="bar"><i style="width:${Math.max(3, pc)}%"></i></span><span class="m"><em class="pc">${pc}% of spending</em>${spikes[k] ? `<em class="nf75-vs">▲ ${spikes[k]}% vs usual</em>` : ''}</span></button>`; }).join('')}</div>
    <p class="nf75-wn">Tap a kind to see only its expenses.</p></section>`;
}
if(typeof nf74Where === 'function'){ nf74Where = nf75Where; window.nf74Where = nf75Where; }

/* ---------- 4. Demo: start clean once after this update (old saved demo edits, like a leftover pending invite, go away) ---------- */
(function(){
  try{
    if(localStorage.getItem('nifti-demo-clean') === 'r75') return;
    ['nifti-books-demo-v2', 'nifti-ledger-demo-v1', 'nifti-payroll-demo-v1'].forEach(k => { try{ localStorage.removeItem(k); }catch(e){} });
    localStorage.setItem('nifti-demo-clean', 'r75');
    window._nf75Clean = true;
  }catch(e){}
})();
function nf75DemoTeamClean(){
  if(typeof myBusiness !== 'undefined' && myBusiness) return; if(window._nf75TeamClean) return; window._nf75TeamClean = true;
  try{
    const seedM = ['tm1', 'tm2', 'tm3'];
    if(Array.isArray(teamMembers)){ const keep = teamMembers.filter(m => seedM.includes(m.id) || (m.status !== 'invited' && m.status !== 'pending')); if(keep.length !== teamMembers.length){ teamMembers.length = 0; keep.forEach(m => teamMembers.push(m)); } }
    if(Array.isArray(teamTasks)){ const keep = teamTasks.filter(t => /^nf-task-/.test(String(t.id))); if(window._nf75Clean && keep.length && keep.length !== teamTasks.length){ teamTasks.length = 0; keep.forEach(t => teamTasks.push(t)); } }
    const s = teamMembers.find(m => m.id === 'tm1'); if(s && /^Dela Cruz/.test(s.name)) s.name = 'Ramon Dela Cruz (You)';
  }catch(e){}
}
(function(){ const b = booksAfterHome; booksAfterHome = function(){ try{ nf75DemoTeamClean(); }catch(e){} return b.apply(this, arguments); }; })();

/* ---------- 5. Plans & pricing: short lines with icons, one hook per plan ---------- */
const NF75_FI = {
  orders: '<path d="M3 7h18M3 12h18M3 17h12"/>', money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>', qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>', store: '<path d="M3 9 5 4h14l2 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5.5"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>', star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>', upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 3h16"/>',
  book: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M8 8h6M8 12h6"/>', wallet: '<path d="M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H3z"/><path d="M3 7V5a2 2 0 0 1 2-2h11"/><circle cx="16" cy="13.5" r="1.3"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>', megaphone: '<path d="M3 11v3a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8"/>', chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/>',
  truck: '<rect x="1" y="7" width="13" height="10" rx="1"/><path d="M14 10h4l3 3v4h-7"/><circle cx="5.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>', branch: '<path d="M3 21h18M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>', credit: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>', history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>', badge: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>'
};
function nf75Feat(f){
  const m = String(f).match(/^([a-z]+)\|(.*)$/); if(!m) return `<li><i class="nf75-fi">${nf75Ic(NF75_FI.star, 18)}</i><span>${f}</span></li>`;
  return `<li class="${m[1] === 'star' ? 'plus' : ''}"><i class="nf75-fi">${nf75Ic(NF75_FI[m[1]] || NF75_FI.star, 20)}</i><span>${m[2]}</span></li>`;
}
function nf75PlanTop(p, s){
  const day = p.m ? Math.ceil(p.m / 30) : 0, beta = s && (s.demo || s.pilot);
  if(p.k === 'free') return '';
  const hook = beta ? `Worth ₱${day} a day · yours free in beta` : `About ₱${day} a day`;
  return `<div class="nf75-hook ${p.k}">${nf75Ic(p.k === 'free' ? NF75_FI.box : p.k === 'pro' ? NF75_FI.money : NF75_FI.truck, 20)}<span>${hook}</span></div>`;
}
try{
  if(typeof NF26_PLANS !== 'undefined'){
    const set = (k, who, f) => { const p = NF26_PLANS.find(x => x.k === k); if(p){ p.who = who; p.f = f; } };
    set('free', 'For a small shop, every day.', ['orders|Orders with customers and suppliers', 'money|Who owes you, with reminders sent for you', 'qr|Your GCash or bank QR on every bill', 'box|Stock, shop sales and expenses', 'store|Online store and Facebook posts', 'users|Up to 3 people', 'download|Download everything, any time']);
    set('pro', 'Nifti chases payments and keeps your books.', ['star|Everything in Free, plus:', 'upload|We load your items and utang for you', 'book|Profit and books, ready for your bookkeeper', 'wallet|Payroll and check tracking', 'undo|Returns and credits, handled', 'megaphone|Price announcements to the buyers you pick', 'chart|Store results and reorder reminders', 'users|Up to 15 people']);
    set('business', 'For drivers, branches and bigger teams.', ['star|Everything in Pro, plus:', 'truck|Delivery routes and a driver for each run', 'branch|Branches, each with its own drawer and stock', 'shield|Spending limits and staff alerts', 'credit|Credit limits and a late-payer list', 'history|Purchase history and supplier records', 'badge|Setup by the Nifti team and priority help', 'users|Up to 75 people']);
  }
}catch(e){}

/* ---------- 6. Getting paid: each customer shows just TOTAL and the amount (the details are listed under it) ---------- */
function nf75Owed(){
  const pg = document.querySelector('#page-collections.active'); if(!pg) return;
  pg.querySelectorAll('table.nf25-owed').forEach(t => {
    const th = t.tHead && [...t.tHead.rows[0].cells].find(c => /^(Owes|Total)$/i.test(c.textContent.trim())); if(th && th.textContent.trim() !== 'Total') th.textContent = 'Total';
    t.querySelectorAll('tbody td.n').forEach(td => { if(td.getAttribute('data-l') !== 'Total') td.setAttribute('data-l', 'Total'); });
  });
}
NF45_AFTER.push(() => { try{ nf75Owed(); }catch(e){} });

/* ---------- 7. Deliveries: one rider for the week or month, add any delivery, and a 3-column status board ---------- */
function nf75Team(){ try{ const a = routeTeam() || []; if(typeof myBusiness !== 'undefined' && myBusiness) return a; const seen = new Set(), out = []; (teamMembers || []).concat(a).forEach(m => { if(m && !seen.has(m.id)){ seen.add(m.id); out.push(m); } }); return out; }catch(e){ return []; } }
// a free-form delivery (a parcel that isn't an order in Nifti) counts as "Deliver"
if(typeof nf45StopWhat === 'function'){ const _w = nf45StopWhat; nf45StopWhat = function(s){ if(!(s.deliver_po_ids || []).length && (s.items || []).length && !(s.collect_po_ids || []).length) return /collect ₱/i.test(s.note || '') ? 'Deliver + Collect' : 'Deliver'; return _w.apply(this, arguments); }; window.nf45StopWhat = nf45StopWhat; }
function nf75Rider(){ try{ const s = bkSettings().route_rider; if(!s || !s.member) return null; if(s.until && s.until < APP_TODAY) return null; const m = nf75Team().find(x => x.id === s.member); return m ? Object.assign({}, s, {name: m.name}) : null; }catch(e){ return null; } }
function nf75WeekEnd(d){ const x = new Date(d + 'T00:00:00'); const add = (7 - x.getDay()) % 7; return addDaysIso(d, add); }
function nf75MonthEnd(d){ const x = new Date(d + 'T00:00:00'); return new Date(x.getFullYear(), x.getMonth() + 1, 0).toLocaleDateString('en-CA'); }
function nf75Day(d){ return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}); }
function nf75Ini(n){ return String(n || '?').replace(/\(.*?\)/g, '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(); }
function nf75RiderCard(){
  const r = nf75Rider();
  if(!r) return `<div class="nf75-rider none"><span class="ic">${nf75Ic(NF75_FI.truck, 26)}</span><div><b>Who delivers for you?</b><span>Pick one rider for the week or the month. Every delivery goes to them; no daily dispatch.</span></div><button type="button" class="btn btn-primary" onclick="nf75RiderPick()">Choose a rider</button></div>`;
  const when = r.period === 'always' ? 'until you change it' : r.period === 'month' ? 'this month · until ' + nf75Day(r.until) : 'this week · until ' + nf75Day(r.until);
  return `<div class="nf75-rider"><span class="av">${nf75E(nf75Ini(r.name))}</span><div><b>${nf75E(r.name)} delivers for you</b><span>${nf75E(when)}. New deliveries go to ${nf75E(String(r.name).split(' ')[0])} automatically.</span></div><button type="button" class="btn btn-outline" onclick="nf75RiderPick()">Change</button></div>`;
}
function nf75RiderPick(){
  const cur = nf75Rider() || {}, team = nf75Team().filter(m => m.status !== 'removed' && m.status !== 'invited');
  window._nf75RP = {member: cur.member || (team.find(m => (m.roles || []).includes('Driver')) || team[0] || {}).id, period: cur.period || 'week'};
  const paint = () => { const s = window._nf75RP; const box = document.getElementById('nf75RPBody'); if(!box) return;
    box.innerHTML = `<div class="nf75-lbl">Who delivers</div><div class="nf75-people">${team.map(m => `<button type="button" class="${m.id === s.member ? 'on' : ''}" onclick="window._nf75RP.member='${m.id}'; window._nf75RPaint()"><span class="av">${nf75E(nf75Ini(m.name))}</span><b>${nf75E(String(m.name).replace(/\s*\(You\)/, ''))}</b><small>${nf75E((m.roles || [])[0] || '')}</small></button>`).join('')}</div>
      <div class="nf75-lbl">For how long</div><div class="nf75-seg">${[['week', 'This week', 'until ' + nf75Day(nf75WeekEnd(APP_TODAY))], ['month', 'This month', 'until ' + nf75Day(nf75MonthEnd(APP_TODAY))], ['always', 'Until I change it', 'same rider every day']].map(([k, a, b]) => `<button type="button" class="${s.period === k ? 'on' : ''}" onclick="window._nf75RP.period='${k}'; window._nf75RPaint()"><b>${a}</b><small>${b}</small></button>`).join('')}</div>
      <p class="nf45-sm">Need a different rider for one day? Change the rider on that day's run. The standing rider comes back the next day.</p>`; };
  window._nf75RPaint = paint;
  nf45Pop('nf75RP', 'Who delivers for you', '<div id="nf75RPBody"></div>', `<button type="button" class="btn btn-outline" onclick="slClose('nf75RP')">Cancel</button><button type="button" class="btn btn-primary" onclick="nf75RiderSave()">Save</button>`);
  paint();
}
async function nf75RiderSave(){
  const s = window._nf75RP || {}; if(!s.member){ showToast('Pick who delivers.', 'warn'); return; }
  const until = s.period === 'week' ? nf75WeekEnd(APP_TODAY) : s.period === 'month' ? nf75MonthEnd(APP_TODAY) : null;
  slClose('nf75RP');
  const ok = await bkSaveSettings({route_rider: {member: s.member, period: s.period, from: APP_TODAY, until}});
  if(ok !== false){ const n = (nf75Team().find(m => m.id === s.member) || {}).name || 'Your rider'; showToast(`${String(n).replace(/\s*\(You\)/, '')} delivers ${s.period === 'always' ? 'from now on' : 'this ' + s.period}.`, 'success'); try{ renderRoutesPage(); }catch(e){} }
}
// orders ready to go out that aren't on a run yet
function nf75Ready(){
  const out = [];
  try{ getSupplierPOs().forEach(po => { if(['confirmed', 'preparing', 'shipped'].includes(po.status) && !routeOnOtherRoute(po.id)) out.push(po); }); }catch(e){}
  return out;
}
function nf75StopFromPO(po){
  const b = (buyersData || []).find(x => x.id === po.buyerId) || {};
  return {buyer_business_id: po.buyerId, buyer_name: po.buyerName, address: po.deliveryAddress || b.location || '', phone: (b.outsideContact || {}).phone || '', deliver_po_ids: [po.id], collect_po_ids: [], items: (po.lineItems || []).map(li => ({product: li.product, qty: li.qty, unit: li.unit || ''})).slice(0, 20), note: ''};
}
// add stops to the run for that day and rider (a new run if there isn't one)
async function nf75AddStops(date, driver, stops){
  if(!driver){ showToast('Pick who delivers first.', 'warn'); nf75RiderPick(); return false; }
  const routes = await loadRoutes(), run = routes.find(r => r.route_date === date && r.driver_member_id === driver && r.status !== 'done');
  const keep = run ? (run.stops || []).filter(s => s.status === 'pending').map(s => ({buyer_business_id: s.buyer_business_id, buyer_name: s.buyer_name, address: s.address || '', phone: s.phone || '', deliver_po_ids: s.deliver_po_ids || [], collect_po_ids: s.collect_po_ids || [], items: s.items || [], note: s.note || ''})) : [];
  const drv = nf75Team().find(m => m.id === driver);
  if(!myBusiness){
    const mk = (s, i) => Object.assign({}, s, {id: 'st' + Date.now() + i, status: 'pending', amount_due: (s.collect_po_ids || []).reduce((x, id) => { const po = getPO(id); if(!po) return x; const c = computeInvoicePayments(po); return x + Math.max(0, c.balance - c.pendingAmount); }, 0)});
    if(run){ const base = (run.stops || []).length; stops.forEach((s, i) => run.stops.push(Object.assign(mk(s, i), {seq: base + i + 1}))); }
    else demoRoutes.push({id: 'rt' + Date.now(), route_date: date, driver_member_id: driver, driver_name: drv ? drv.name : '', vehicle: '', status: 'planned', mine: true, stops: stops.map((s, i) => Object.assign(mk(s, i), {seq: i + 1}))});
    return true;
  }
  const { error } = await sb.rpc('save_route', {p_route: run ? run.id : null, p_date: date, p_driver: driver, p_vehicle: run ? (run.vehicle || null) : null, p_stops: keep.concat(stops)});
  if(error){ showToast(error.message, 'error'); return false; }
  await loadRoutes(true); return true;
}
async function nf75SendReady(){
  const r = nf75Rider(); if(!r){ nf75RiderPick(); return; }
  const ready = nf75Ready(); if(!ready.length) return;
  if(await nf75AddStops(APP_TODAY, r.member, ready.map(nf75StopFromPO))){ showToast(`${ready.length} deliver${ready.length === 1 ? 'y' : 'ies'} sent to ${String(r.name).split(' ')[0]} for today.`, 'success'); renderRoutesPage(); }
}
// "+ Add a delivery": from an order, or anything else (a parcel, a pickup)
const NF75D = {tab: 'order', day: 'today', date: '', pick: {}, f: {}};
function nf75AddDelivery(){
  const r = nf75Rider(); NF75D.tab = nf75Ready().length ? 'order' : 'other'; NF75D.day = 'today'; NF75D.date = APP_TODAY; NF75D.pick = {}; NF75D.f = {driver: r ? r.member : ''};
  nf45Pop('nf75AD', 'Add a delivery', '<div id="nf75ADBody"></div>', `<button type="button" class="btn btn-outline" onclick="slClose('nf75AD')">Cancel</button><button type="button" class="btn btn-primary" onclick="nf75AddSave()">Add to the run</button>`, {wide: true});
  nf75ADPaint();
}
function nf75ADKeep(){ const g = id => (document.getElementById(id) || {}).value; ['name', 'addr', 'phone', 'items', 'cod'].forEach(k => { const v = g('nf75AD_' + k); if(v != null) NF75D.f[k] = v; }); const d = g('nf75AD_driver'); if(d != null) NF75D.f.driver = d; }
function nf75ADPaint(){
  const box = document.getElementById('nf75ADBody'); if(!box) return; const f = NF75D.f, team = nf75Team().filter(m => m.status !== 'removed' && m.status !== 'invited'), ready = nf75Ready();
  const dayBtn = (k, l) => `<button type="button" class="${NF75D.day === k ? 'on' : ''}" onclick="nf75ADKeep(); NF75D.day='${k}'; NF75D.date='${k === 'today' ? APP_TODAY : addDaysIso(APP_TODAY, 1)}'; nf75ADPaint()">${l}</button>`;
  box.innerHTML = `<div class="nf75-seg2" role="tablist"><button type="button" class="${NF75D.tab === 'order' ? 'on' : ''}" onclick="nf75ADKeep(); NF75D.tab='order'; nf75ADPaint()">From an order${ready.length ? ` <em>${ready.length}</em>` : ''}</button><button type="button" class="${NF75D.tab === 'other' ? 'on' : ''}" onclick="nf75ADKeep(); NF75D.tab='other'; nf75ADPaint()">Something else (a parcel, a pickup)</button></div>
    ${NF75D.tab === 'order' ? (ready.length ? `<div class="nf75-olist">${ready.map(po => `<label class="${NF75D.pick[po.id] ? 'on' : ''}"><input type="checkbox" ${NF75D.pick[po.id] ? 'checked' : ''} onchange="NF75D.pick['${po.id}']=this.checked; this.closest('label').classList.toggle('on', this.checked)"><span><b>${nf75E(po.buyerName)}</b><small>Order ${nf75E(String(po.poNumber || '').replace(/^PO-\d{4}-/, ''))} · ${nf75E((po.lineItems || []).map(l => l.qty + ' × ' + l.product).slice(0, 2).join(', '))}</small></span><em>${nf75P(typeof poTotal === 'function' ? poTotal(po) : 0)}</em></label>`).join('')}</div>`
      : `<div class="nf75-empty">No confirmed orders waiting to go out. Use <b>Something else</b> for a parcel, or confirm an order in Delivery orders first.</div>`)
    : `<div class="nf75-form"><label><span>Deliver to</span><input id="nf75AD_name" maxlength="120" placeholder="e.g. Aling Nena Store" value="${nf75E(f.name || '')}"></label>
        <label><span>Address</span><input id="nf75AD_addr" maxlength="300" placeholder="Street, barangay, landmark" value="${nf75E(f.addr || '')}"></label>
        <label><span>Phone <small>optional</small></span><input id="nf75AD_phone" maxlength="40" inputmode="tel" placeholder="0917 …" value="${nf75E(f.phone || '')}"></label>
        <label class="wide"><span>What to deliver</span><input id="nf75AD_items" maxlength="300" placeholder="e.g. 5 bags cement, 1 box nails" value="${nf75E(f.items || '')}"></label>
        <label><span>Collect cash <small>optional</small></span><input id="nf75AD_cod" inputmode="decimal" placeholder="₱0" value="${nf75E(f.cod || '')}"></label></div>`}
    <div class="nf75-adrow"><div><div class="nf75-lbl">When</div><div class="nf75-days">${dayBtn('today', 'Today')}${dayBtn('tomorrow', 'Tomorrow')}<input type="date" class="${NF75D.day === 'date' ? 'on' : ''}" value="${NF75D.day === 'date' ? NF75D.date : ''}" min="${APP_TODAY}" aria-label="Another day" onchange="nf75ADKeep(); if(this.value){ NF75D.day='date'; NF75D.date=this.value; } nf75ADPaint()"></div></div>
      <div><div class="nf75-lbl">Rider</div><select id="nf75AD_driver">${team.map(m => `<option value="${nf75E(m.id)}" ${m.id === f.driver ? 'selected' : ''}>${nf75E(String(m.name).replace(/\s*\(You\)/, ''))}</option>`).join('')}</select></div></div>`;
}
async function nf75AddSave(){
  nf75ADKeep(); const f = NF75D.f; let stops = [];
  if(NF75D.tab === 'order'){ stops = nf75Ready().filter(po => NF75D.pick[po.id]).map(nf75StopFromPO); if(!stops.length){ showToast('Tick at least one order.', 'warn'); return; } }
  else { if(!String(f.name || '').trim()){ showToast('Type who it goes to.', 'warn'); return; } if(!String(f.items || '').trim()){ showToast('Type what to deliver.', 'warn'); return; }
    const cod = Number(String(f.cod || '').replace(/[^\d.]/g, '')) || 0;
    stops = [{buyer_business_id: null, buyer_name: String(f.name).trim().slice(0, 120), address: String(f.addr || '').trim(), phone: String(f.phone || '').trim(), deliver_po_ids: [], collect_po_ids: [], items: String(f.items).split(/,|\n/).map(x => x.trim()).filter(Boolean).slice(0, 20).map(x => ({product: x, qty: '', unit: ''})), note: cod ? 'Collect ₱' + cod.toLocaleString('en-PH') + ' cash' : ''}]; }
  const driver = f.driver || (nf75Rider() || {}).member;
  if(await nf75AddStops(NF75D.date || APP_TODAY, driver, stops)){ slClose('nf75AD'); const n = (nf75Team().find(m => m.id === driver) || {}).name || 'the rider'; showToast(`Added to ${String(n).split(' ')[0]}'s run for ${NF75D.date === APP_TODAY ? 'today' : nf75Day(NF75D.date)}.`, 'success'); renderRoutesPage(); }
}
// the board: To go (yellow) · Done (green) · Couldn't (red)
function nf75StopCard(r, s, i){
  const st = nfStopState(r, s), res = s.result || {}, col = res.collected, due = Number(s.amount_due) || 0, why = res.reason || s.fail_reason;
  const t = s.done_at ? new Date(s.done_at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila'}) : '';
  const items = (s.items || []).slice(0, 2).map(x => (x.qty ? x.qty + ' × ' : '') + x.product).join(', ') + ((s.items || []).length > 2 ? ` +${s.items.length - 2} more` : '');
  const cod = (String(s.note || '').match(/Collect ₱[\d,]+/) || [''])[0];
  const lane = st === 'done' ? 'g' : st === 'fail' ? 'r' : 'y';
  const when = st === 'done' ? (t ? 'Done ' + t : 'Done') : st === 'fail' ? (t ? 'Tried ' + t : 'Not done') : st === 'next' ? 'Next stop' : 'Stop ' + (i + 1);
  return `<article class="nf75-sc t-${lane}${st === 'next' ? ' next' : ''}" role="button" tabindex="0" onclick="if(!event.target.closest('button')) nf45StopOpen('${r.id}', '${s.id}')" onkeydown="if(event.key==='Enter') nf45StopOpen('${r.id}', '${s.id}')">
    <header><span class="dot">${st === 'done' ? '✓' : st === 'fail' ? '✕' : i + 1}</span><b>${nf75E(s.buyer_name)}</b><em>${nf75E(when)}</em></header>
    <div class="what">${items ? `<span class="it">${nf75Ic(NF75_FI.box, 16)}${nf75E(items)}</span>` : ''}${due >= 1 || cod ? `<span class="money">${nf75Ic(NF75_FI.money, 16)}${col ? 'Collected ' + nfP(col.amount) : due >= 1 ? 'Collect ' + nfP(due) : nf75E(cod)}</span>` : ''}${!items && !(due >= 1) && !cod ? `<span class="it">${nf75E(nf45StopWhat(s))}</span>` : ''}</div>
    ${s.address ? `<div class="addr">${nf75Ic('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', 15)}${nf75E(String(s.address).split(',')[0])}</div>` : ''}
    <footer><span class="who"><span class="av">${nf75E(nf75Ini(r.driver_name))}</span>${nf75E(String(r.driver_name || 'No rider').split(' ')[0])}</span>${st === 'fail' ? `<span class="why">${nf75E(why || "Couldn't do")}</span>${r.status !== 'done' ? `<button type="button" class="btn btn-outline btn-sm" onclick="reopenStop('${s.id}')">Try again</button>` : ''}` : st === 'done' && due >= 1 && !col ? '<span class="why y">Not collected yet</span>' : ''}</footer></article>`;
}
function nf75Board(body, routes){
  try{ nf45HideRouteTabs(); }catch(e){}
  const tom = addDaysIso(APP_TODAY, 1), dayLbl = d => new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'long', month: 'short', day: 'numeric'});
  const today = routes.filter(r => r.route_date === APP_TODAY), later = routes.filter(r => r.route_date > APP_TODAY).sort((a, b) => a.route_date.localeCompare(b.route_date)), past = routes.filter(r => r.route_date < APP_TODAY).sort((a, b) => b.route_date.localeCompare(a.route_date));
  const all = []; today.forEach(r => (r.stops || []).forEach((s, i) => all.push({r, s, i, st: nfStopState(r, s)})));
  const lanes = [['y', 'To go', 'Not delivered yet', all.filter(x => x.st === 'next' || x.st === 'wait')], ['g', 'Done', 'Delivered or collected', all.filter(x => x.st === 'done')], ['r', "Couldn't do", 'Try again or move it', all.filter(x => x.st === 'fail')]];
  const tot = today.reduce((a, r) => { const t = routeTotals(r); a.n += t.n; a.done += t.done; a.due += t.due; a.got += t.got; return a; }, {n: 0, done: 0, due: 0, got: 0});
  const ready = nf75Ready(), rider = nf75Rider(), planner = typeof isRoutePlanner !== 'function' || isRoutePlanner(), mine = routes.some(r => r.mine && r.route_date >= APP_TODAY);
  body.innerHTML = `<div class="nf75-rtop"><span class="nf75-rday">Today · ${nf75E(dayLbl(APP_TODAY))}</span><div class="nf75-racts">${mine ? `<button type="button" class="btn btn-outline" onclick="routeTab='mine'; renderRoutesPage()">My run</button>` : ''}${planner ? `<button type="button" class="btn btn-primary" onclick="nf75AddDelivery()">+ Add a delivery</button>` : ''}</div></div>
    ${planner ? nf75RiderCard() : ''}
    ${planner && ready.length ? `<div class="nf75-ready"><span class="ic">${nf75Ic(NF75_FI.box, 22)}</span><div><b>${ready.length} order${ready.length === 1 ? '' : 's'} ready to go out</b><span>${nf75E(ready.map(p => p.buyerName).slice(0, 3).join(', '))}${ready.length > 3 ? ' and more' : ''}</span></div>${rider ? `<button type="button" class="btn btn-primary" onclick="nf75SendReady()">Send ${ready.length === 1 ? 'it' : 'all'} to ${nf75E(String(rider.name).split(' ')[0])} today</button>` : `<button type="button" class="btn btn-primary" onclick="nf75RiderPick()">Choose a rider</button>`}<button type="button" class="btn btn-outline" onclick="nf75AddDelivery()">Pick</button></div>` : ''}
    ${today.length ? `<div class="nf75-prog"><div><span>Stops done</span><b>${tot.done} of ${tot.n}</b><i><u style="width:${tot.n ? Math.round(tot.done / tot.n * 100) : 0}%"></u></i></div><div><span>Money collected</span><b>${nfP(tot.got)} of ${nfP(tot.due)}</b><i class="m"><u style="width:${tot.due ? Math.round(tot.got / tot.due * 100) : 0}%"></u></i></div></div>
      ${today.map(r => { const t = routeTotals(r), canRemit = t.n && t.done === t.n && (t.cash > 0 || t.cheque > 0) && !r.remit; return `<div class="nf75-run"><span class="av">${nf75E(nf75Ini(r.driver_name))}</span><div><b>${nf75E(r.driver_name || 'No rider yet')}${r.vehicle ? ' · ' + nf75E(r.vehicle) : ''}</b><small>${(r.stops || []).length} stops · ${t.done} done · ${nfP(t.got)} collected</small></div><span class="nf45-chipk ${r.status === 'done' ? 't-g' : r.status === 'on_road' ? 't-b' : 't-n'}">${r.status === 'done' ? 'Finished' : r.status === 'on_road' ? 'On the road' : 'Planned'}</span><span class="sp"></span>${canRemit ? `<button type="button" class="btn btn-primary btn-sm" onclick="nf45RemitOpen('${r.id}')">Count the cash handed over</button>` : ''}${planner && r.status !== 'done' ? `<button type="button" class="btn btn-outline btn-sm" onclick="editRoute('${r.id}')">Edit stops</button>` : ''}<button type="button" class="btn btn-outline btn-sm" onclick="shareRouteText('${r.id}')">Send list on Viber</button></div>`; }).join('')}
      <div class="nf75-board">${lanes.map(([c, h, sub, list]) => `<section class="nf75-lane t-${c}"><header><i></i><b>${h}</b><span class="n">${list.length}</span><small>${sub}</small></header><div class="nf75-cards">${list.map(x => nf75StopCard(x.r, x.s, x.i)).join('') || `<p class="nf75-none">${c === 'y' ? 'Nothing left to deliver today.' : c === 'g' ? 'Finished stops land here.' : 'Nothing failed today.'}</p>`}</div></section>`).join('')}</div>`
      : `<div class="nf75-empty big"><b>No deliveries today</b><span>${planner ? (rider ? `Add a delivery or send ready orders to ${nf75E(String(rider.name).split(' ')[0])}.` : 'Choose a rider once, then add deliveries.') : 'Your owner adds the deliveries.'}</span></div>`}
    <h3 class="nf75-dh">Coming up</h3>
    ${later.length ? `<div class="nf75-later">${later.map(r => { const t = routeTotals(r); return `<button type="button" onclick="${planner ? `editRoute('${r.id}')` : ''}"><b>${nf75E(r.route_date === tom ? 'Tomorrow' : dayLbl(r.route_date))}</b><span>${nf75E(r.driver_name || 'No rider')} · ${(r.stops || []).length} stop${(r.stops || []).length === 1 ? '' : 's'}${t.due ? ' · ' + nfP(t.due) + ' to collect' : ''}</span><i>›</i></button>`; }).join('')}</div>` : `<div class="nf75-none">Nothing planned after today yet.${planner ? ` <button type="button" class="nf43-link" onclick="nf75AddDelivery(); NF75D.day='tomorrow'; NF75D.date=addDaysIso(APP_TODAY,1); nf75ADPaint()">Add one for tomorrow</button>` : ''}</div>`}
    <details class="nf46-past"><summary>Past runs (${past.length})</summary>${past.length ? `<div class="nf46-pl">${past.slice(0, 10).map(r => { const t = routeTotals(r); return `<div><b>${nf75E(chequeDayLabel(r.route_date))}</b><span>${nf75E(r.driver_name || '')} · ${t.done} of ${t.n} stops · ${nfP(t.got)} collected${t.failed ? ` · ${t.failed} couldn't do` : ''}</span></div>`; }).join('')}</div>` : '<p class="nf45-sm">No past runs yet.</p>'}</details>`;
}
(function(){ const w = function(body, routes){ return nf75Board(body, routes); }; w._nf11 = true; w._nf45 = true; w._nf75 = true; window.renderRouteBoard = w; try{ renderRouteBoard = w; }catch(e){} })();
// demo: one confirmed order waiting to go out, so "ready to go out" and "From an order" have something real
function nf75DemoReady(){
  if((typeof myBusiness !== 'undefined' && myBusiness) || window._nf75Ready) return;
  try{ if(getPO('po_r75')){ window._nf75Ready = true; return; } const src = getPO('po11') || getPO('po_q5') || (getSupplierPOs() || [])[0]; if(!src) return;
    const po = JSON.parse(JSON.stringify(src)); po.id = 'po_r75'; po.poNumber = 'PO-2026-0861'; po.status = 'confirmed'; po.createdDate = APP_TODAY; po.deliveryDate = addDaysIso(APP_TODAY, 1); delete po.invoice; delete po.rma; po.payments = [];
    const b = (buyersData || []).find(x => x.id === 'buy_cavite'); if(b){ po.buyerId = b.id; po.buyerName = b.name; } else { po.buyerName = 'Cavite Steel Works'; }
    po.lineItems = [{product: 'Portland Cement 40kg', qty: 30, unitPrice: 228, unit: 'bag'}, {product: 'Galvanized Wire 12ga', qty: 4, unitPrice: 520, unit: 'roll'}];
    po.deliveryAddress = 'Cavite Steel Works yard, Imus'; po.history = [{date: APP_TODAY, time: '9:12 AM', actor: 'buyer', action: 'Confirmed the order'}];
    purchaseOrders.push(po); window._nf75Ready = true;
  }catch(e){ console.warn('demo ready', e); }
}
(function(){ const b = booksAfterHome; booksAfterHome = function(){ try{ nf75DemoReady(); }catch(e){} return b.apply(this, arguments); }; })();

/* ---------- 8. Prices & profit: announce to the buyers you choose; a start date that behaves; supplier changes made readable ---------- */
const NF75PC = {preset: 'week', date: '', aud: 'top', pick: null, note: '', vals: {}};
function nf75PcQuick(){
  const nm = (() => { const d = new Date(APP_TODAY + 'T00:00:00'); d.setMonth(d.getMonth() + 1, 1); return d.toLocaleDateString('en-CA'); })();
  return [['3d', 'In 3 days', addDaysIso(APP_TODAY, 3)], ['week', 'In a week', addDaysIso(APP_TODAY, 7)], ['2w', 'In 2 weeks', addDaysIso(APP_TODAY, 14)], ['next', '1st of next month', nm], ['today', 'Today', APP_TODAY]];
}
function nf75PcBuyers(){
  const list = (buyersData || []).filter(b => !b.isOutside), since = addDaysIso(APP_TODAY, -365), tot = {};
  try{ getSupplierPOs().forEach(po => { if(!po.buyerId || ['draft', 'cancelled', 'quote'].includes(po.status) || String(po.createdDate || '') < since) return; tot[po.buyerId] = (tot[po.buyerId] || 0) + (typeof poTotal === 'function' ? poTotal(po) : 0); }); }catch(e){}
  try{ (BK.sales || []).forEach(s => { if(s.voidedAt || String(s.date) < since) return; const b = list.find(x => String(x.name).toLowerCase().startsWith(String(s.customer || '').toLowerCase().slice(0, 8)) && s.customer && s.customer !== 'Walk-in'); if(b) tot[b.id] = (tot[b.id] || 0) + (Number(s.total) || 0); }); }catch(e){}
  return list.map(b => ({id: b.id, name: b.name, total: tot[b.id] || 0})).sort((a, b) => b.total - a.total);
}
function nf75PcPicked(){
  const bs = nf75PcBuyers();
  if(NF75PC.aud === 'all') return bs.map(b => b.id);
  if(NF75PC.aud === 'top') return bs.filter(b => b.total > 0).slice(0, 3).map(b => b.id);
  if(!NF75PC.pick) NF75PC.pick = {};
  return bs.filter(b => NF75PC.pick[b.id]).map(b => b.id);
}
function nf75Composer(el, cat, history, buyersN){
  NF75PC.cat = cat; NF75PC.history = history;
  if(!NF75PC.date){ const q = nf75PcQuick().find(x => x[0] === NF75PC.preset); NF75PC.date = q ? q[2] : addDaysIso(APP_TODAY, 7); }
  if(!cat.length){ el.innerHTML = `<div class="panel-card nf75-pc"><b>Add your items and prices first</b><p class="nf45-sm">Stock → Add items. Then you can announce price changes here.</p></div>`; return; }
  el.innerHTML = `<div class="panel-card nf75-pc"><div class="nf75-pch"><b>Announce new prices</b><span>Type the new price. Buyers are told now; the price switches on the start date.</span></div>
      <div class="nf75-pcl">${cat.map((c, i) => `<label class="nf75-pci"><span class="nm"><b>${nf75E(c.product)}</b><small>Now ${nf75P(c.price)}${c.unit ? '/' + nf75E(c.unit) : ''}</small></span><span class="in"><em>₱</em><input type="number" min="0" step="0.01" inputmode="decimal" placeholder="New price" data-pc-i="${i}" value="${NF75PC.vals[i] != null ? nf75E(NF75PC.vals[i]) : ''}" oninput="NF75PC.vals[${i}]=this.value; nf75PcLive()"></span><span class="dl" data-pc-d="${i}"></span></label>`).join('')}</div>
      <div id="nf75PcWhen"></div><div id="nf75PcWho"></div>
      <textarea id="pcNote" class="nf75-note" rows="2" maxlength="300" placeholder="Reason (optional), e.g. Cement plant raised prices" oninput="NF75PC.note=this.value; nf75PcLive()">${nf75E(NF75PC.note)}</textarea>
      <div id="nf75PcSend"></div></div>
    <div class="nf75-sent"><div class="nf75-lbl">Sent</div>${history.length ? history.slice(0, 8).map(h => { const up = h.old_price != null && Number(h.new_price) > Number(h.old_price), live = h.applied_at || h.effective_date <= APP_TODAY, pct = h.old_price ? Math.round((h.new_price - h.old_price) / h.old_price * 1000) / 10 : null;
        return `<div class="nf75-srow"><span class="nm"><b>${nf75E(h.product)}</b><small>${h.audience === 'picked' ? (h.sent_to || (h.sent_buyer_ids || []).length || 0) + ' chosen buyers' : 'All buyers'}</small></span><span class="pr">${h.old_price != null ? `<span class="old">${nf75P(h.old_price)}</span><i>→</i>` : ''}<b>${nf75P(h.new_price)}</b>${pct != null ? `<em class="${up ? 'up' : 'dn'}">${up ? '▲' : '▼'} ${Math.abs(pct)}%</em>` : ''}</span><span class="st">${h.cancelled_at ? '<em class="z">Cancelled</em>' : live ? `<em class="g">Live since ${nf75E(nf75Day(h.effective_date))}</em>` : `<em class="y">Starts ${nf75E(nf75Day(h.effective_date))}</em><button type="button" class="nf43-link" onclick="cancelPriceChange('${h.id}')">Cancel</button>`}</span></div>`; }).join('') : '<p class="nf45-sm">Nothing sent yet.</p>'}</div>`;
  nf75PcWhen(); nf75PcWho(); nf75PcLive();
}
function nf75PcWhen(){
  const box = document.getElementById('nf75PcWhen'); if(!box) return; const q = nf75PcQuick(), d = NF75PC.date, days = daysBetween(APP_TODAY, d);
  box.innerHTML = `<div class="nf75-lbl">Starts</div><div class="nf75-days">${q.map(([k, l, v]) => `<button type="button" class="${NF75PC.preset === k ? 'on' : ''}" onclick="NF75PC.preset='${k}'; NF75PC.date='${v}'; nf75PcWhen(); nf75PcLive()">${l}</button>`).join('')}<label class="nf75-dpick ${NF75PC.preset === 'date' ? 'on' : ''}"><span>${NF75PC.preset === 'date' ? nf75E(nf75Day(d)) : 'Pick a date'}</span><input type="date" min="${APP_TODAY}" value="${NF75PC.preset === 'date' ? d : ''}" aria-label="Pick a start date" onchange="if(this.value){ NF75PC.preset='date'; NF75PC.date=this.value; } nf75PcWhen(); nf75PcLive()"></label></div>
    <p class="nf75-when ${days <= 0 ? 'warn' : ''}">${days <= 0 ? 'Starts today. Buyers get no notice, so increases can surprise them.' : `Starts <b>${nf75E(new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'}))}</b> · ${days} day${days === 1 ? '' : 's'} notice. Orders sent before then keep today's price.`}</p>`;
}
function nf75PcWho(){
  const box = document.getElementById('nf75PcWho'); if(!box) return; const bs = nf75PcBuyers(), picked = new Set(nf75PcPicked()), max = Math.max(1, ...bs.map(b => b.total));
  const tot = bs.filter(b => picked.has(b.id)).reduce((a, b) => a + b.total, 0);
  box.innerHTML = `<div class="nf75-lbl">Who hears about it <small>· what each bought this year</small></div>
    <div class="nf75-aud">${[['top', 'Top 3', 'biggest buyers'], ['all', 'All ' + bs.length, 'every buyer'], ['pick', 'Pick', 'you choose']].map(([k, a, b]) => `<button type="button" class="${NF75PC.aud === k ? 'on' : ''}" onclick="NF75PC.aud='${k}'; ${k === 'pick' ? 'if(!NF75PC.pick){ NF75PC.pick={}; nf75PcPicked0(); }' : ''} nf75PcWho(); nf75PcLive()"><b>${a}</b><small>${b}</small></button>`).join('')}</div>
    <div class="nf75-buyers">${bs.map(b => `<button type="button" class="nf75-buyer ${picked.has(b.id) ? 'on' : ''}" ${NF75PC.aud === 'pick' ? `onclick="NF75PC.pick['${b.id}']=!NF75PC.pick['${b.id}']; nf75PcWho(); nf75PcLive()"` : 'tabindex="-1"'} aria-pressed="${picked.has(b.id)}"><span class="av">${nf75E(nf75Ini(b.name))}</span><span class="tx"><b>${nf75E(b.name)}</b><span class="bar"><i style="width:${Math.max(3, b.total / max * 100).toFixed(1)}%"></i></span><small>${b.total ? nf75P(b.total) : 'No orders yet'}</small></span><span class="ck">${picked.has(b.id) ? '✓' : ''}</span></button>`).join('') || '<p class="nf45-sm">No buyers on Nifti yet. Invite your customers from Customers & suppliers.</p>'}</div>
    <p class="nf75-audsum">${picked.size ? `<b>${picked.size} buyer${picked.size === 1 ? '' : 's'}</b> · ${nf75P(tot)} bought from you this year${NF75PC.aud !== 'all' ? '. Everyone else sees the new price on the start date.' : '.'}` : 'Pick at least one buyer.'}</p>`;
}
function nf75PcPicked0(){ nf75PcBuyers().filter(b => b.total > 0).slice(0, 3).forEach(b => { NF75PC.pick[b.id] = true; }); }
function nf75PcChanges(){ return (NF75PC.cat || []).map((c, i) => ({c, v: Number(NF75PC.vals[i])})).filter(x => x.c && x.v > 0 && Math.abs(x.v - Number(x.c.price)) >= 0.01); }
function nf75PcLive(){
  (NF75PC.cat || []).forEach((c, i) => { const el = document.querySelector(`[data-pc-d="${i}"]`); if(!el) return; const v = Number(NF75PC.vals[i]); if(!(v > 0) || Math.abs(v - c.price) < .01){ el.innerHTML = ''; return; } const up = v > c.price, pct = Math.round((v - c.price) / c.price * 1000) / 10; el.innerHTML = `<em class="${up ? 'up' : 'dn'}">${up ? '▲' : '▼'} ${Math.abs(pct)}%</em>`; });
  const box = document.getElementById('nf75PcSend'); if(!box) return; const ch = nf75PcChanges(), n = nf75PcPicked().length;
  box.innerHTML = `${ch.length ? `<details class="nf75-prev"><summary>See the message buyers get</summary><pre>${nf75E(priceMessageText(ch, NF75PC.date || APP_TODAY, NF75PC.note || ''))}</pre></details>` : ''}
    <button type="button" class="btn btn-primary nf75-send" ${!ch.length || !n ? 'disabled' : ''} onclick="nf75SendPrices()">${!ch.length ? 'Type a new price above' : `Send ${ch.length} new price${ch.length === 1 ? '' : 's'} to ${n} buyer${n === 1 ? '' : 's'}`}</button>`;
}
async function nf75SendPrices(){
  const ch = nf75PcChanges(), ids = nf75PcPicked(), date = NF75PC.date || APP_TODAY, note = String(NF75PC.note || '').trim();
  if(!ch.length || !ids.length) return;
  if(!confirm(`Send ${ch.length} price change${ch.length > 1 ? 's' : ''} to ${ids.length} buyer${ids.length > 1 ? 's' : ''}, starting ${date <= APP_TODAY ? 'today' : nf75Day(date)}?`)) return;
  if(!myBusiness){
    ch.forEach(x => demoPriceChanges.unshift({id: 'pc' + Date.now() + x.c.product, product: x.c.product, old_price: x.c.price, new_price: x.v, effective_date: date, applied_at: date <= APP_TODAY ? new Date().toISOString() : null, audience: NF75PC.aud === 'all' ? 'all' : 'picked', sent_to: ids.length, sent_buyer_ids: ids}));
    if(date <= APP_TODAY) ch.forEach(x => { x.c.price = x.v; x.c.updatedAt = APP_TODAY; });
    try{ getConversations().filter(c => ids.includes(c.id) || ids.includes(c.buyerId)).forEach(c => sendTextInChat(c.id, priceMessageText(ch, date, note))); }catch(e){}
    NF75PC.vals = {}; NF75PC.note = ''; showToast(`Sent to ${ids.length} buyer${ids.length > 1 ? 's' : ''}. (Demo)`, 'success'); renderPricesPage(); return;
  }
  const { data, error } = await sb.rpc('announce_price_changes', {p_changes: ch.map(x => ({product: x.c.product, new_price: x.v})), p_effective: date, p_note: note || null, p_buyers: NF75PC.aud === 'all' ? null : ids});
  if(error){ showToast(error.message, 'error'); return; }
  if(date <= APP_TODAY) ch.forEach(x => { x.c.price = x.v; x.c.updatedAt = APP_TODAY; });
  priceChangesCache = null; NF75PC.vals = {}; NF75PC.note = '';
  showToast(`Sent to ${data.buyers} buyer${data.buyers === 1 ? '' : 's'}.${date > APP_TODAY ? ' Your prices switch on ' + nf75Day(date) + '.' : ''}`, 'success'); renderPricesPage();
}
// what suppliers are changing: big rows, old vs new side by side
renderIncomingPrices = async function(el){
  const list = await loadIncomingPrices(), upcoming = list.filter(x => x.effective_date > APP_TODAY), recent = list.filter(x => x.effective_date <= APP_TODAY && x.effective_date >= addDaysIso(APP_TODAY, -14));
  const row = x => { const up = x.old_price != null && Number(x.new_price) > Number(x.old_price), pct = x.old_price ? Math.round((x.new_price - x.old_price) / x.old_price * 1000) / 10 : null;
    return `<div class="nf75-inc ${up ? 'r-up' : 'r-dn'}"><div class="nm"><b>${nf75E(x.product)}</b><small>${nf75E(x.supplier_name)}${x.effective_date > APP_TODAY ? ' · starts ' + nf75E(nf75Day(x.effective_date)) : ' · since ' + nf75E(nf75Day(x.effective_date))}</small></div>
      <div class="ov"><span><small>Was</small><b class="old">${x.old_price != null ? nf75P(x.old_price) : '—'}</b></span><i aria-hidden="true">→</i><span><small>New</small><b>${nf75P(x.new_price)}${x.unit ? `<em>/${nf75E(x.unit)}</em>` : ''}</b></span></div>
      ${pct != null ? `<span class="pct">${up ? '▲' : '▼'} ${Math.abs(pct)}%</span>` : '<span></span>'}</div>`; };
  const ups = upcoming.filter(x => x.old_price != null && Number(x.new_price) > Number(x.old_price));
  el.innerHTML = `${ups.length ? `<div class="nf75-incb"><span class="ic">${nf75Ic('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>', 22)}</span><div><b>${ups.length} price increase${ups.length > 1 ? 's start' : ' starts'} ${nf75E(nf75Day(ups.map(x => x.effective_date).sort()[0]))}</b><span>Order before then to keep today's price.</span></div></div>` : ''}
    <div class="nf75-lbl">Coming up</div>${upcoming.length ? upcoming.map(row).join('') : '<p class="nf75-none">No price changes announced.</p>'}
    <div class="nf75-lbl">Last 2 weeks</div>${recent.length ? recent.map(row).join('') : '<p class="nf75-none">No changes in the last 2 weeks.</p>'}`;
};
window.renderIncomingPrices = renderIncomingPrices;

/* ---------- 9. To check: a heads-up corner. One card, one button that fixes it, and "It's fine" to close ---------- */
const NF75I = {filter: 'all'};
const NF75_KIND = {
  'Not billed': {ic: 'book', verb: 'Send the bill'}, 'Missing stock': {ic: 'box', verb: 'Recount', recount: true}, 'Changed by hand': {ic: 'box', verb: 'See the change', recount: true},
  'Missing receipts': {ic: 'credit', verb: 'Add receipts', fine: ['No receipt for these', 'Receipt is with the bookkeeper']}, 'Cash short': {ic: 'money', verb: 'Open the count', fine: ['Recounted, it was a mistake', 'Change given by mistake']},
  'Not counted': {ic: 'money', verb: 'Count it', fine: ['Shop was closed that day']}, 'Long overdue': {ic: 'history', verb: 'Remind them', fine: ['Agreed to pay later']},
  'Below cost': {ic: 'chart', verb: 'Check the price', fine: ['Sold low on purpose']}, 'Possible duplicate': {ic: 'undo', verb: 'Check both', fine: ['Not a duplicate']},
  'Waiting for approval': {ic: 'shield', verb: 'Approve or send back'}, 'No supplier bill': {ic: 'book', verb: 'Ask for the bill', fine: ['Supplier gave a paper bill']}, 'Missing cost': {ic: 'chart', verb: 'Add the cost'}
};
renderIssuesPage = async function(){
  const body = document.getElementById('issBody'); if(!body) return;
  if(!booksCanSeeTotals()){ body.innerHTML = bkLockedForStaff('money'); return; }
  if(!BK.loaded || !ISS.decisions){ body.innerHTML = bkLoadingHtml(); await bkLoad(); await issLoadDecisions(); if(!LG.loaded) await lgLoad(); }
  const live = issuesAll(), seen = nf44IssSeen(live);
  const open = live.filter(i => !['resolved', 'accepted'].includes(i.status));
  const closed = live.filter(i => ['resolved', 'accepted'].includes(i.status));
  let list = NF75I.filter === 'closed' ? closed : NF75I.filter === 'red' ? open.filter(i => i.lvl === 'red') : open;
  list.sort((a, b) => (a.lvl === 'red' ? 0 : 1) - (b.lvl === 'red' ? 0 : 1) || (b.amount || 0) - (a.amount || 0));
  const team = (typeof getActiveTeamMembers === 'function' ? getActiveTeamMembers() : []).map(m => String(m.name).replace(/ \(You\)$/, ''));
  window._nf75Iss = {};
  const card = i => { window._nf75Iss[i.fp] = i; const k = NF75_KIND[i.kind] || {ic: 'star', verb: (i.ev && i.ev[0] && i.ev[0][0]) || 'Open'}, s = seen[i.fp] || {}, age = nf44Days(s.first || i.date, APP_TODAY), who = i.dec && i.dec.assigned_to, done = ['resolved', 'accepted'].includes(i.status);
    const act = k.recount ? `nf75Recount('${i.fp}')` : (i.ev && i.ev[0] ? i.ev[0][1].replace(/"/g, '&quot;') : '');
    return `<article class="nf75-ic l-${i.lvl === 'red' ? 'r' : 'y'}${done ? ' done' : ''}"><span class="ico">${nf75Ic(NF75_FI[k.ic] || NF75_FI.star, 22)}</span>
      <div class="tx"><div class="top"><span class="kind">${nf75E(i.kind || 'Check')}</span><span class="age">${age === 0 ? 'Today' : age + ' day' + (age === 1 ? '' : 's') + ' open'}</span>${who ? `<span class="who">${nf75E(who)} is on it</span>` : ''}</div>
        <b>${nf75E(i.title)}</b>${i.what ? `<small>${nf75E(i.what)}</small>` : ''}${i.next && !done ? `<p class="next">What to do: ${nf75E(i.next)}</p>` : ''}
        ${done ? `<p class="next">${i.status === 'accepted' ? "OK'd as fine" : 'Fixed'}${i.dec && i.dec.note ? ': ' + nf75E(i.dec.note) : ''}</p>` : ''}</div>
      <div class="side">${i.amount ? `<span class="amt">${nf75P(i.amount)}</span>` : ''}
        ${done ? `<button type="button" class="btn btn-outline" onclick="nf44IssReopen('${i.fp}')">Open again</button>` : `${act ? `<button type="button" class="btn btn-primary" onclick="${act}">${nf75E(k.verb)}</button>` : ''}<button type="button" class="btn btn-outline nf75-fine" onclick="nf75IssFine('${i.fp}')">It's fine, close it</button>
        <select class="nf75-give" onchange="nf44IssAssign('${i.fp}', this.value)" aria-label="Give this to someone"><option value="">${who ? 'Given to ' + nf75E(who) : 'Give to someone…'}</option>${team.filter(n => n !== who).map(n => `<option value="${nf75E(n)}">${nf75E(n)}</option>`).join('')}</select>`}</div></article>`; };
  const money = open.reduce((a, i) => a + (i.amount || 0), 0), red = open.filter(i => i.lvl === 'red').length;
  body.innerHTML = `<div class="nf75-ih"><div class="sum"><b>${open.length ? open.length + ' thing' + (open.length === 1 ? '' : 's') + ' to look at' : 'All clear'}</b><span>${open.length ? `${nf75P(money)} involved · ${red} important` : 'Nifti checks your sales, cash, stock and expenses every day.'}</span></div>
      <div class="nf75-if">${[['all', 'All', open.length], ['red', 'Important', red], ['closed', 'Closed', closed.length]].map(([k, l, n]) => `<button type="button" class="${NF75I.filter === k ? 'on' : ''}" onclick="NF75I.filter='${k}'; renderIssuesPage()">${l} <em>${n}</em></button>`).join('')}</div></div>
    <div class="nf75-il">${list.length ? list.map(card).join('') : `<div class="nf75-empty big"><b>${NF75I.filter === 'closed' ? 'Nothing closed yet' : 'Nothing to check right now'}</b><span>When something doesn't add up, it shows here with one button to fix it.</span></div>`}</div>
    <p class="nf44-note">A heads-up is a reason to look, not proof that anyone did anything wrong. When a problem is fixed, it closes by itself.</p>`;
};
window.renderIssuesPage = renderIssuesPage;
function nf75IssFine(fp){
  const i = (window._nf75Iss || {})[fp] || {}, k = NF75_KIND[i.kind] || {}, quick = (k.fine || []).concat(['Already handled', 'Not a problem']);
  nf45Pop('nf75Fine', "It's fine, close it", `<p class="nf45-p"><b>${nf75E(i.title || '')}</b></p><div class="nf75-lbl">Why? Tap one</div><div class="nf75-qk">${quick.map(q => `<button type="button" onclick="document.getElementById('nf75FineNote').value=${JSON.stringify(q).replace(/"/g, '&quot;')}">${nf75E(q)}</button>`).join('')}</div>
    <textarea id="nf75FineNote" class="nf75-note" rows="2" maxlength="200" placeholder="Or type a short reason"></textarea><p class="nf45-sm">It stays in the history, so anyone can see why it was closed.</p>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf75Fine')">Cancel</button><button type="button" class="btn btn-primary" onclick="nf75IssFineSave('${fp}')">Close it</button>`);
}
async function nf75IssFineSave(fp){
  const note = String((document.getElementById('nf75FineNote') || {}).value || '').trim(); if(note.length < 3){ showToast('Tap a reason or type one.', 'warn'); return; }
  const d = (ISS.decisions || {})[fp]; slClose('nf75Fine');
  if(await nf44IssSave(fp, 'accepted', d ? d.assigned_to : null, note)){ showToast('Closed. The reason is kept in the history.', 'success'); renderIssuesPage(); if(typeof updateBooksBadges === 'function') updateBooksBadges(); }
}
// recount one item: what Nifti expects, the last few changes of this item only, one number to type
function nf75Recount(fp){
  const id = String(fp).replace(/^stock:/, ''), mv = (BK.moves || []).find(x => String(x.id) === id), name = mv ? mv.item : '';
  const item = (inventoryData || []).find(x => x.name === name); if(!item){ showToast('That item is no longer in Stock.', 'warn'); return; }
  const recent = (BK.moves || []).filter(x => x.item === name && x.date >= addDaysIso(APP_TODAY, -14)).sort((a, b) => String(b.at || b.date).localeCompare(String(a.at || a.date))).slice(0, 5);
  const KIND = {sold: 'Sold', delivered: 'Delivered to a customer', count: 'Counted', bad: 'Damaged', adjust: 'Changed by hand', returned_in: 'Returned', received: 'Received'};
  nf45Pop('nf75Rc', 'Recount ' + nf75E(name), `<div class="nf75-rc"><div class="big"><span><small>Nifti expects</small><b>${Number(item.onHand) || 0}</b><em>${nf75E(item.unit || '')}</em></span>${mv && mv.kind === 'count' ? `<span class="miss"><small>Last count was short</small><b>${Math.abs(Number(mv.qty) || 0)}</b><em>${nf75E(nf75Day(mv.date))} · ${nf75E(mv.by || '')}</em></span>` : ''}</div>
      <label class="nf75-lbl" for="nf75RcQ">How many are on the shelf now?</label><div class="nf75-rcq"><button type="button" onclick="const i=document.getElementById('nf75RcQ'); i.value=Math.max(0,(Number(i.value)||0)-1)">−</button><input id="nf75RcQ" inputmode="numeric" value="${Number(item.onHand) || 0}"><button type="button" onclick="const i=document.getElementById('nf75RcQ'); i.value=(Number(i.value)||0)+1">+</button></div>
      <div class="nf75-lbl">Last changes to ${nf75E(name)} <small>· 2 weeks</small></div>${recent.length ? `<div class="nf75-rcl">${recent.map(x => `<div><span>${nf75E(nf75Day(x.date))}</span><b>${nf75E(KIND[x.kind] || x.kind)}</b><em class="${Number(x.qty) < 0 ? 'neg' : 'pos'}">${Number(x.qty) > 0 ? '+' : ''}${Number(x.qty) || 0}</em><small>${nf75E(x.by || '')}</small></div>`).join('')}</div>` : '<p class="nf45-sm">No other changes in the last 2 weeks.</p>'}
      <p class="nf45-sm">Tip: check deliveries and returns of this item before deciding anything.</p></div>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf75Rc')">Cancel</button><button type="button" class="btn btn-primary" onclick="nf75RecountSave(${JSON.stringify(name).replace(/"/g, '&quot;')})">Save the count</button>`);
}
function nf75RecountSave(name){
  const item = (inventoryData || []).find(x => x.name === name); if(!item) return;
  const q = Number(String((document.getElementById('nf75RcQ') || {}).value || '').replace(/[^\d.]/g, '')); if(!(q >= 0)){ showToast('Type a number.', 'warn'); return; }
  const diff = Math.round((q - Number(item.onHand)) * 1000) / 1000;
  if(diff){ item.onHand = q; if(typeof updateInvStatusFromStock === 'function') updateInvStatusFromStock(item); stockLabel(item, {kind: 'count', reason: 'Recount from To check: shelf ' + q, photo: '', qty: diff}); bkAfterStockChange([item]); }
  else if(!myBusiness){ BK.moves.unshift({id: bkUid(), item: item.name, qty: 0, kind: 'count', reason: 'Recount from To check: matches (' + q + ')', date: APP_TODAY, at: new Date().toISOString(), by: bkMe(), unitCost: item.unitCost || null}); bkSaveDemo(); }
  slClose('nf75Rc'); showToast(diff ? `${name}: stock now shows ${q}.` : `${name}: the shelf matches Nifti (${q}).`, 'success'); try{ renderIssuesPage(); }catch(e){}
}

/* ---------- 10. Monthly summary: tabs you can't miss; "own and owe" jumps between dates in one tap ---------- */
if(typeof lgAsOfToolbar === 'function'){
  lgAsOfToolbar = function(){
    const d = LGV.asOf || APP_TODAY, eom = (() => { const x = new Date(APP_TODAY + 'T00:00:00'); return new Date(x.getFullYear(), x.getMonth(), 0).toLocaleDateString('en-CA'); })();
    const q = [['Today', APP_TODAY], ['Yesterday', addDaysIso(APP_TODAY, -1)], ['2 days ago', addDaysIso(APP_TODAY, -2)], ['1 week ago', addDaysIso(APP_TODAY, -7)], ['2 weeks ago', addDaysIso(APP_TODAY, -14)], ['End of last month', eom]];
    const set = v => `LGV.asOf=${v === APP_TODAY ? 'null' : `'${v}'`}; renderLedgerPage()`;
    const lbl = new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'});
    return `<div class="nf75-asof"><div class="step"><button type="button" aria-label="One day earlier" onclick="${set(addDaysIso(d, -1))}">‹</button><span><small>Balances as of</small><b>${nf75E(lbl)}</b></span><button type="button" aria-label="One day later" ${d >= APP_TODAY ? 'disabled' : ''} onclick="${set(d >= APP_TODAY ? APP_TODAY : addDaysIso(d, 1))}">›</button></div>
      <div class="qk">${q.map(([l, v]) => `<button type="button" class="${v === d ? 'on' : ''}" onclick="${set(v)}">${l}</button>`).join('')}<label class="nf75-dpick ${q.some(x => x[1] === d) ? '' : 'on'}"><span>Pick a date</span><input type="date" value="${d}" max="${APP_TODAY}" aria-label="Pick a date" onchange="LGV.asOf=(this.value && this.value < APP_TODAY) ? this.value : null; renderLedgerPage()"></label></div></div>`;
  };
  window.lgAsOfToolbar = lgAsOfToolbar;
}
function nf75LgTabs(){
  const t = document.querySelector('#page-ledger.active .lg-tabs'); if(!t || t.dataset.nf75) return; t.dataset.nf75 = '1'; t.classList.add('nf75-lgt');
  const sub = {summary: ['Profit, costs, the month at a glance', '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/>'], bs: ['Cash, stock, who owes, what you owe', '<path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0z"/>'], gl: ['Every peso in and out, line by line', '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>']};
  t.querySelectorAll('button[role="tab"]').forEach(b => { const m = (b.getAttribute('onclick') || '').match(/LGV\.tab='(\w+)'/); const k = m && m[1]; if(!k || !sub[k]) return; const txt = b.textContent.trim(); b.innerHTML = `${nf75Ic(sub[k][1], 22)}<span><b>${nf75E(txt)}</b><small>${nf75E(sub[k][0])}</small></span>`; });
}
NF45_AFTER.push(() => { try{ nf75LgTabs(); }catch(e){} });

/* ---------- 11. Follow-ups: one screen. See the concern, edit the message, one tap opens that person's Viber chat with it ---------- */
function nf75Phone63(p){ const d = String(p || '').replace(/[^\d+]/g, ''); if(!d) return ''; if(/^\+63\d{10}$/.test(d)) return d; if(/^63\d{10}$/.test(d)) return '+' + d; if(/^09\d{9}$/.test(d)) return '+63' + d.slice(1); if(/^9\d{9}$/.test(d)) return '+63' + d; return d; }
function nf75Me(){ try{ return mhFirst(bkMe()); }catch(e){ return ''; } }
function nf75Shop(){ return (typeof myBusiness !== 'undefined' && myBusiness && myBusiness.name) || 'Dela Cruz Hardware'; }
function nf75Guess(text){
  // "200 bags cement" -> a price line from your own list
  const t = String(text || '').toLowerCase(), m = t.match(/(\d[\d,]*)\s*(bags?|pcs?|pieces?|rolls?|kg|lengths?|sacks?)?\s*(?:of\s+)?([a-z][a-z0-9 ]{2,30})/i); if(!m) return '';
  const qty = Number(m[1].replace(/,/g, '')), words = m[3].split(/\s+/).filter(w => w.length > 2);
  const cat = (typeof myCatalog !== 'undefined' && myCatalog || []).concat((inventoryData || []).map(i => ({product: i.name, price: i.sellPrice, unit: i.unit})));
  const hit = cat.find(c => c.product && words.some(w => String(c.product).toLowerCase().includes(w)) && Number(c.price) > 0);
  if(!hit || !qty) return '';
  return `${qty} ${m[2] || hit.unit || 'pcs'} ${hit.product}: ${nf75P(hit.price)} each, ${nf75P(qty * hit.price)} total.`;
}
function nf75Template(it){
  const first = String(it.name || '').split(' · ')[0].replace(/^(Engr\.|Mr\.|Ms\.|Mrs\.)\s*/, '').split(' ')[0], me = nf75Me(), shop = nf75Shop();
  const hi = `Hi ${first}! This is ${me ? me + ' from ' : ''}${shop}.`;
  if(it.k === 'lead'){ const l = it.l || {}, g = nf75Guess(l.interest);
    if(l.stage === 'quoted') return `${hi} Following up on the price I sent. Ready na po ba kayo mag-order? I can still hold today's price for you this week.`;
    return `${hi} Salamat sa message! ${g ? 'For ' + g : l.interest ? 'About "' + l.interest + '": I can send the prices today.' : 'What items do you need? I can send prices today.'} We can deliver this week. Shall I prepare the order?`; }
  if(it.k === 'wait'){ const po = (it.w && it.w.po) || {}, q = po.quote || {};
    return `${hi} Reminder lang po: Order ${String(po.poNumber || '').replace(/^PO-\d{4}-/, '')} (${nf75P(typeof poTotal === 'function' ? poTotal(po) : it.amt)}) is waiting for your OK${q.hold_until ? '. Your price is held until ' + nf75Day(String(q.hold_until).slice(0, 10)) : ''}. You can confirm from the link I sent. Salamat po!`; }
  if(it.k === 'quiet' || it.k === 'reorder') return `${hi} Kumusta po? Need anything this week? I can send the same as your last order${it.amt ? ' (about ' + nf75P(it.amt) + ')' : ''}.`;
  return hi;
}
function nf75ItemPhone(it){
  if(it.l && it.l.phone) return it.l.phone;
  const id = it.k === 'wait' ? ((it.w && it.w.po) || {}).buyerId : it.id; const b = (buyersData || []).find(x => x.id === id) || {};
  return (b.outsideContact || {}).phone || b.phone || '';
}
function nf75Compose(k, id){
  const it = nf45FuItems().find(x => x.k === k && String(x.id) === String(id)); if(!it) return;
  window._nf75It = it; const phone = nf75ItemPhone(it), concern = it.k === 'lead' ? ((it.l || {}).interest || '') : it.sub;
  nf45Pop('nf75Msg', 'Message ' + nf75E(String(it.name).split(' · ')[0]), `<div class="nf75-cm">
      <div class="who"><span class="av">${nf75E(nf75Ini(it.name))}</span><div><b>${nf75E(it.name)}</b><small>${phone ? nf75E(phone) : 'No phone number saved'} · ${nf75E(it.why || '')}</small></div>${it.amt ? `<em>${it.k === 'lead' ? '~' : ''}${nf75P(it.amt)}</em>` : ''}</div>
      ${concern ? `<div class="concern"><small>${it.k === 'lead' ? 'They asked' : 'What is happening'}</small><p>${nf75E(concern)}</p></div>` : ''}
      <label class="nf75-lbl" for="nf75MsgT">Your message <small>· edit anything</small></label>
      <textarea id="nf75MsgT" rows="5" maxlength="1500">${nf75E(nf75Template(it))}</textarea>
      <label class="nf75-again"><input type="checkbox" id="nf75MsgAgain" checked> Remind me to follow up again in 2 days</label>
      <p class="nf45-sm">Viber opens ${phone ? `the chat with ${nf75E(String(it.name).split(' ')[0])}` : 'so you can pick the chat'}, with this message already typed. Tap Send there. The message is also copied, in case you prefer SMS or Messenger.</p></div>`,
    `<button type="button" class="btn btn-outline" onclick="nf75MsgCopy()">Copy</button><button type="button" class="btn btn-primary nf75-viber" onclick="nf75MsgViber()">${nf75Ic('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z"/>', 18)}Send on Viber</button>`);
  setTimeout(() => { const t = document.getElementById('nf75MsgT'); if(t){ t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 60);
}
function nf75MsgText(){ return String((document.getElementById('nf75MsgT') || {}).value || '').trim(); }
function nf75MsgCopy(){ const t = nf75MsgText(); if(!t) return; try{ copyText(t); }catch(e){ try{ navigator.clipboard.writeText(t); }catch(e2){} } showToast('Message copied.', 'success'); }
async function nf75MsgViber(){
  const it = window._nf75It; const t = nf75MsgText(); if(!it || !t){ showToast('Type a message first.', 'warn'); return; }
  try{ copyText(t); }catch(e){ try{ navigator.clipboard.writeText(t); }catch(e2){} }
  const ph = nf75Phone63(nf75ItemPhone(it));
  const url = ph ? `viber://chat?number=${encodeURIComponent(ph)}&draft=${encodeURIComponent(t)}` : `viber://forward?text=${encodeURIComponent(t)}`;
  try{ window.location.href = url; }catch(e){ window.open(url, '_blank'); }
  const again = (document.getElementById('nf75MsgAgain') || {}).checked;
  try{ if(it.k === 'lead' || it.k === 'lost') await fuPatchLead(it.id, Object.assign({touches: ((it.l || {}).touches || 0) + 1, last_contact_at: new Date().toISOString()}, again ? {next_follow_up: addDaysIso(APP_TODAY, 2)} : {}), 'Sent a message on Viber'); }catch(e){}
  slClose('nf75Msg'); showToast('Viber is opening with your message. Tap Send there.', 'success'); try{ renderFollowupsPage(); }catch(e){}
}
if(typeof nf45FuAct === 'function'){
  const _act = nf45FuAct;
  nf45FuAct = function(it){
    const q = s => JSON.stringify(String(s)).replace(/"/g, '&quot;');
    const main = (label, js) => `<button type="button" class="btn btn-primary nf46-fumain" onclick="event.stopPropagation(); ${js}">${label}</button>`;
    const side = (label, js) => `<button type="button" class="btn btn-outline nf46-fuside" onclick="event.stopPropagation(); ${js}">${label}</button>`;
    if(it.k === 'lead') return [main(it.l.stage === 'quoted' ? 'Ask for the order' : it.l.stage === 'contacted' ? 'Send a price' : 'Reply', `nf75Compose('lead', ${q(it.id)})`) + side('Edit', `fuEditLead(${q(it.id)})`), []];
    if(it.k === 'wait') return [main('Remind', `nf75Compose('wait', ${q(it.id)})`) + side('Open', `qtOpen(${q(it.id)})`), []];
    if(it.k === 'quiet') return [main('Say hello', `nf75Compose('quiet', ${q(it.id)})`) + side('Later', `fuSnooze(${q(it.id)})`), []];
    return _act.apply(this, arguments);
  };
  window.nf45FuAct = nf45FuAct;
}

/* ---------- 12. BIR 2307: one side at a time, big quarter tabs, proof you can attach and open, a list you can download ---------- */
const NF75B = {side: null, q: {supplier: 'all', buyer: 'all'}, files: null};
async function nf75BFiles(force){
  if(NF75B.files && !force) return NF75B.files;
  if(!myBusiness){ NF75B.files = NF75B.files || window._nf75DemoFiles || (window._nf75DemoFiles = []); return NF75B.files; }
  const { data } = await sb.from('form2307_files').select('*').order('created_at', {ascending: false}).limit(1000); NF75B.files = data || []; return NF75B.files;
}
function nf75BQLabel(q){ const [y, n] = String(q).split('-Q'); return 'Q' + n + ' ' + y; }
async function nf75TaxForms(){
  const el = document.getElementById('taxFormsContent'); if(!el) return;
  const head = document.getElementById('taxFormsBadge'); if(head) head.innerHTML = proBadge('bir2307');
  const sell = currentAppRole === 'supplier', side = currentAppRole;
  if(!hasFeature('bir2307')){ el.innerHTML = lockedPanelHtml('bir2307', sell ? 'See every 2307 your customers owe you and remind them in one tap.' : 'Never miss a 2307 you owe your suppliers.'); return; }
  let rows = [];
  if(myBusiness){ el.innerHTML = '<div class="panel-card">Loading…</div>'; const { data, error } = await sb.rpc('ewt_tracker'); if(error){ el.innerHTML = `<div class="panel-card">${escapeHtml(error.message)}</div>`; return; } rows = (data || []).filter(r => r.role === currentAppRole); }
  else { rows = buildLocal2307().filter(r => !r.example); if(!rows.length) rows = nfDemo2307(); }
  taxFormsCache = (taxFormsCache || []).filter(r => r.role && r.role !== side).concat(rows.map(r => Object.assign({role: side}, r)));
  const files = await nf75BFiles(), fside = sell ? 'collect' : 'give';
  const done = r => sell ? r.status === 'received' : (r.status === 'sent' || r.status === 'received');
  const quarters = [...new Set(rows.map(r => r.quarter))].sort().reverse(), cur = NF75B.q[side] || 'all';
  const list = cur === 'all' ? rows : rows.filter(r => r.quarter === cur);
  const tot = rows.reduce((a, r) => a + Number(r.tax || 0), 0), doneAmt = rows.filter(done).reduce((a, r) => a + Number(r.tax || 0), 0), pending = rows.filter(r => !done(r) && r.quarter_ended);
  const stat = r => done(r) ? `<span class="nf75-bs g">${sell ? 'Received' : 'Given'}</span>` : !r.quarter_ended ? '<span class="nf75-bs n">Not due yet</span>' : sell ? (r.status === 'sent' ? '<span class="nf75-bs y">They say they sent it</span>' : '<span class="nf75-bs r">Missing</span>') : `<span class="nf75-bs ${r.overdue ? 'r' : 'y'}">${r.overdue ? 'Late' : 'To give'}</span>`;
  const a = r => `'${r.counterparty_id}', '${r.quarter}'`, R = `currentAppRole='${side}'; `;
  const act = r => sell ? (done(r) ? `<button type="button" class="btn btn-outline btn-sm" onclick="${R}open2307Worksheet(${a(r)})">See details</button>` : `${r.quarter_ended ? `<button type="button" class="btn btn-primary btn-sm" onclick="${R}remind2307(${a(r)})">Remind them</button>` : ''}<button type="button" class="btn btn-outline btn-sm" onclick="${R}mark2307(${a(r)}, 'received')">I got it</button>`)
    : (done(r) ? `<button type="button" class="btn btn-outline btn-sm" onclick="${R}open2307Worksheet(${a(r)})">Fill-in helper</button><button type="button" class="nf43-link" onclick="${R}mark2307(${a(r)}, 'owed')">Undo</button>` : `<button type="button" class="btn btn-primary btn-sm" onclick="${R}open2307Worksheet(${a(r)})">Fill-in helper</button><button type="button" class="btn btn-outline btn-sm" onclick="${R}mark2307(${a(r)}, 'sent')">I gave it</button>`);
  const proof = r => { const fs = files.filter(f => f.counterparty_id === String(r.counterparty_id) && f.quarter === r.quarter && f.side === fside);
    return `<div class="nf75-proof">${fs.map(f => `<span class="f"><button type="button" class="nf43-link" onclick="nf75BOpen('${f.id}')">${nf75Ic('<path d="M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>', 15)}${nf75E(String(f.file_name || 'File').slice(0, 22))}</button><button type="button" class="x" aria-label="Remove this file" onclick="nf75BDel('${f.id}')">✕</button></span>`).join('')}<label class="add"><input type="file" accept="application/pdf,image/*" hidden data-nf-cam="1" onchange="nf75BAttach(this, ${a(r)}, '${fside}')">${fs.length ? '+ Add' : '+ Attach proof'}</label></div>`; };
  const pct = tot ? Math.round(doneAmt / tot * 100) : 0;
  el.innerHTML = `<div class="nf75-bh ${sell ? 'c' : 'g'}"><span class="ic">${nf75Ic(sell ? '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>' : '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 3h16"/>', 26)}</span>
      <div><b>${sell ? 'Collect from customers' : 'Give to suppliers'}</b><span>${sell ? 'Customers paid you 1% less and kept it for BIR. Each one owes you a 2307 for that. Collect them so you pay this tax only once.' : 'You paid suppliers 1% less and kept it for BIR. Give each one a 2307 by the 20th after the quarter.'}</span></div>
      <div class="big"><b>${nf75P(tot)}</b><small>${pct}% ${sell ? 'collected' : 'given'}${pending.length ? ` · <em>${pending.length} ${sell ? 'missing' : 'to give'}</em>` : ''}</small><i><u style="width:${pct}%"></u></i></div></div>
    <div class="nf75-qt" role="tablist" aria-label="Quarter">${[['all', 'All quarters', rows.filter(r => !done(r) && r.quarter_ended).length]].concat(quarters.map(q => [q, nf75BQLabel(q), rows.filter(r => r.quarter === q && !done(r) && r.quarter_ended).length])).map(([k, l, n]) => `<button type="button" role="tab" aria-selected="${cur === k}" class="${cur === k ? 'on' : ''}" onclick="NF75B.q['${side}']='${k}'; renderTaxFormsPage()"><b>${l}</b>${n ? `<em>${n} ${sell ? 'missing' : 'to give'}</em>` : '<small>all done</small>'}</button>`).join('')}</div>
    ${list.length ? `<div class="nf75-bt"><table data-nf-card="1"><thead><tr><th class="t">${sell ? 'Customer' : 'Supplier'}</th><th>Quarter</th><th class="n">Tax kept</th><th>Form due</th><th>Status</th><th class="t">Proof</th><th></th></tr></thead><tbody>${list.map(r => `<tr class="${!done(r) && r.quarter_ended ? 'pend' : ''}"><td class="t"><b>${nf75E(r.counterparty)}</b><small>${r.count} payment${r.count > 1 ? 's' : ''}</small></td><td>${nf75E(nf75BQLabel(r.quarter))}</td><td class="n"><b>${nf75P(r.tax)}</b></td><td>${nf75E(stmtDate(r.due))}</td><td>${stat(r)}</td><td class="t">${proof(r)}</td><td class="a">${act(r)}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="nf75-empty">No withheld tax ${cur === 'all' ? 'yet' : 'in ' + nf75BQLabel(cur)}. When ${sell ? 'a customer pays you less because they kept 1% for BIR' : 'you keep 1% of a supplier payment for BIR'}, record it on the payment and it shows here.</div>`}
    <div class="nf75-bf"><button type="button" class="btn btn-outline" onclick="nf75BCsv('${side}')">${nf75Ic('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>', 18)}Download this list</button><span>Blank BIR Form 2307: get the official form at <a href="https://www.bir.gov.ph" target="_blank" rel="noopener">bir.gov.ph</a> (BIR Forms). Nifti keeps your records and proof; it does not file anything with BIR.</span></div>`;
}
async function nf75BAttach(input, cp, quarter, side){
  const f = input.files && input.files[0]; if(!f) return;
  if(f.size > 10 * 1024 * 1024){ showToast('That file is over 10 MB. Try a smaller photo or PDF.', 'warn'); return; }
  if(!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(f.type)){ showToast('Attach a PDF or a photo (JPG, PNG).', 'warn'); return; }
  let me = ''; try{ me = bkMe(); }catch(e){}
  if(!myBusiness){ const url = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(f); }); (window._nf75DemoFiles = window._nf75DemoFiles || []).unshift({id: 'f' + Date.now(), counterparty_id: String(cp), quarter, side, file_path: url, file_name: f.name, mime: f.type, uploaded_by_name: me, created_at: new Date().toISOString()}); NF75B.files = window._nf75DemoFiles; showToast('Proof attached. (Demo: kept in this browser.)', 'success'); renderTaxFormsPage(); return; }
  const ext = (f.name.match(/\.(pdf|jpe?g|png|webp)$/i) || ['', f.type === 'application/pdf' ? 'pdf' : 'jpg'])[1].toLowerCase();
  const path = `${myBusiness.id}/2307/${String(cp).replace(/[^\w-]/g, '')}-${quarter}-${Date.now()}.${ext}`;
  const up = await sb.storage.from('tax-forms').upload(path, f, {contentType: f.type, upsert: false}); if(up.error){ showToast("Couldn't upload: " + up.error.message, 'error'); return; }
  const { error } = await sb.from('form2307_files').insert({business_id: myBusiness.id, counterparty_id: String(cp), quarter, side, file_path: path, file_name: f.name.slice(0, 120), mime: f.type, uploaded_by_name: me || null});
  if(error){ showToast("Couldn't save: " + error.message, 'error'); return; }
  await nf75BFiles(true); showToast('Proof attached.', 'success'); renderTaxFormsPage();
}
async function nf75BOpen(id){
  const f = (NF75B.files || []).find(x => String(x.id) === String(id)); if(!f) return;
  if(!myBusiness){ const w = window.open(); if(w){ w.document.write(`<title>${nf75E(f.file_name || 'Proof')}</title><iframe src="${f.file_path}" style="border:0;width:100%;height:100%"></iframe>`); } return; }
  const { data, error } = await sb.storage.from('tax-forms').createSignedUrl(f.file_path, 300, {download: f.file_name || true}); if(error){ showToast("Couldn't open the file.", 'error'); return; }
  window.open(data.signedUrl, '_blank');
}
async function nf75BDel(id){
  const f = (NF75B.files || []).find(x => String(x.id) === String(id)); if(!f || !confirm(`Remove "${f.file_name || 'this file'}"?`)) return;
  if(!myBusiness){ window._nf75DemoFiles = (window._nf75DemoFiles || []).filter(x => x.id !== f.id); NF75B.files = window._nf75DemoFiles; renderTaxFormsPage(); return; }
  await sb.storage.from('tax-forms').remove([f.file_path]); const { error } = await sb.from('form2307_files').delete().eq('id', f.id); if(error){ showToast(error.message, 'error'); return; }
  await nf75BFiles(true); renderTaxFormsPage();
}
function nf75BCsv(side){
  const rows = (taxFormsCache || []).filter(r => r.role === side), q = NF75B.q[side] || 'all', list = q === 'all' ? rows : rows.filter(r => r.quarter === q), sell = side === 'supplier';
  const files = NF75B.files || [], fside = sell ? 'collect' : 'give', esc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const lines = [[sell ? 'Customer' : 'Supplier', 'Quarter', 'Tax kept', 'Payments', 'Form due', 'Status', 'Proof files'].map(esc).join(',')].concat(list.map(r => [r.counterparty, nf75BQLabel(r.quarter), Number(r.tax || 0).toFixed(2), r.count, r.due, r.status, files.filter(f => f.counterparty_id === String(r.counterparty_id) && f.quarter === r.quarter && f.side === fside).map(f => f.file_name).join('; ')].map(esc).join(',')));
  const blob = new Blob(['﻿' + lines.join('\n')], {type: 'text/csv'}), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `BIR-2307-${sell ? 'from-customers' : 'to-suppliers'}-${q === 'all' ? 'all-quarters' : q}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
// one side at a time, with a big switch on top
function nf75BSwitch(){
  const pg = document.querySelector('#page-taxforms.active'); if(!pg) return; const host = document.getElementById('taxFormsContent'); if(!host || !host.querySelector('.nf-half')) return;
  if(!NF75B.side){ const miss = s => (taxFormsCache || []).filter(r => r.role === s && r.quarter_ended && (s === 'supplier' ? r.status !== 'received' : r.status === 'owed')).length; NF75B.side = miss('buyer') > miss('supplier') ? 'buyer' : 'supplier'; }
  let sw = pg.querySelector('.nf75-bsw'); const k = NF75B.side;
  if(!sw){ sw = document.createElement('div'); sw.className = 'nf75-bsw'; sw.setAttribute('role', 'tablist'); host.before(sw); }
  if(sw.dataset.k !== k){ sw.dataset.k = k; sw.innerHTML = [['supplier', 'From customers', 'Forms your customers owe you', 'c'], ['buyer', 'To suppliers', 'Forms you owe your suppliers', 'g']].map(([s, a, b, c]) => `<button type="button" role="tab" class="t-${c} ${k === s ? 'on' : ''}" aria-selected="${k === s}" onclick="NF75B.side='${s}'; nf75BSwitch()">${nf75Ic(s === 'supplier' ? '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>' : '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 3h16"/>', 22)}<span><b>${a}</b><small>${b}</small></span></button>`).join(''); }
  if(pg.dataset.nf75b !== k) pg.dataset.nf75b = k;
}
NF45_AFTER.push(() => { try{ nf75BSwitch(); }catch(e){} });
try{ window.renderTaxFormsPage = nf75TaxForms; if(typeof nfRewrap === 'function') nfRewrap('taxforms'); }catch(e){}
