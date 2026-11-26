/* ===== Round 80 ===== */
function nf80E(s){ return escapeHtml(String(s == null ? "" : s)); }
function nf80P(n){ return typeof bkPeso === "function" ? bkPeso(n) : fmtPHP(n); }
function nf80Ic(d, s){ return `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`; }

/* ---------- 1. Money overview: what costs went up or down vs the same days last month, beside the profit statement ---------- */
function nf80Names(o){ const r = {}; Object.entries(o || {}).forEach(([c, v]) => { const n = lgAcct(c).name; r[n] = (r[n] || 0) + (Number(v) || 0); }); return r; }
function nf80CostJumps(m){
  try{
    if(typeof LG === 'undefined' || !LG.loaded) return null;
    const R = nf74SameRange(m), p = bkPnl(m), cur = Object.assign({}, p.byCat || {}), pq = lgPnlFor(R.from, R.to), prev = nf80Names(pq.opex);
    const keys = [...new Set(Object.keys(cur).concat(Object.keys(prev)))];
    const rows = keys.map(k => ({k, now: Math.round(cur[k] || 0), was: Math.round(prev[k] || 0)})).map(r => Object.assign(r, {d: r.now - r.was})).filter(r => Math.abs(r.d) >= 1);
    const nowT = Number(p.expenses) || 0, wasT = Object.values(prev).reduce((a, v) => a + (Number(v) || 0), 0) - (Number(pq.other) || 0);
    return {R, rows, ups: rows.filter(r => r.d > 0).sort((a, b) => b.d - a.d), downs: rows.filter(r => r.d < 0).sort((a, b) => a.d - b.d), nowT: Math.round(nowT), wasT: Math.round(wasT), sales: Number(p.sales) || 0};
  }catch(e){ return null; }
}
const NF80_NONEXP = {'Bad and missing stock': 'From stock counts and items marked damaged or missing.', 'Cash short': 'From cash counts that came up short.', 'Stock changed by hand': 'From stock numbers changed by hand.'};
function nf80JRow(r, max, m){
  const pct = r.was ? Math.round(r.d / r.was * 100) : null, up = r.d > 0;
  const chip = `<span class="chip ${up ? 'r' : 'g'}">${up ? '▲' : '▼'} ${nf80P(Math.abs(r.d))}${!up && r.now === 0 ? ' · not in yet' : pct != null ? ` · ${up ? '+' : ''}${pct}%` : up ? ' · new' : ''}</span>`;
  const lines = (BK.expenses || []).filter(e => !e.deletedAt && e.category === r.k && bkMonth(e.date) === m && (e.status || 'approved') === 'approved').sort((a, b) => b.date.localeCompare(a.date));
  const detail = NF80_NONEXP[r.k] ? `<p class="jn">${nf80E(NF80_NONEXP[r.k])}</p><button type="button" class="nf77-link" onclick="go('issues')">See them in To check</button>`
    : lines.length ? `<div class="jl">${lines.slice(0, 6).map(e => `<div><span>${nf80E(bkDayLabel(e.date))}${e.vendor ? ' · ' + nf80E(e.vendor) : ''}</span><b>${nf80P(e.amount)}</b></div>`).join('')}</div>${up ? '' : ''}`
    : `<p class="jn">${up ? 'No lines recorded yet.' : r.now ? '' : 'Nothing recorded yet this month. If it is a monthly bill, it may still be coming.'}</p>`;
  return `<div class="jr ${up ? 'up' : 'dn'}"><button type="button" class="jh" aria-expanded="false" onclick="const j=this.parentElement; j.classList.toggle('open'); this.setAttribute('aria-expanded', j.classList.contains('open'))"><span class="n">${nf80E(r.k)}</span><span class="ft">${nf80P(r.was)} <i>→</i> <b>${nf80P(r.now)}</b></span>${chip}<span class="cv" aria-hidden="true">›</span></button>
    <div class="bars" aria-hidden="true"><span><i class="was" style="width:${max ? Math.max(2, r.was / max * 100) : 0}%"></i></span><span><i class="now ${up ? 'up' : 'dn'}" style="width:${max ? Math.max(2, r.now / max * 100) : 0}%"></i></span></div>
    <div class="jd">${detail}</div></div>`;
}
function nf80JumpsHtml(m){
  const J = nf80CostJumps(m);
  if(!J) return `<section class="panel-card nf80-jumps"><div class="panel-head"><h2>Costs vs last month</h2></div><p class="sub">Loading your books…</p></section>`;
  const max = Math.max(1, ...J.rows.map(r => Math.max(r.now, r.was))), d = J.nowT - J.wasT, pct = J.wasT ? Math.round(d / J.wasT * 100) : null;
  return `<section class="panel-card nf80-jumps"><div class="panel-head"><h2>Costs vs ${nf80E(J.R.label)}</h2></div>
    <p class="sub">${J.R.full ? 'Compared with the whole month before.' : 'This month so far, compared with the same days last month.'} Tap a cost to see what's in it.</p>
    <div class="tot"><div><small>${nf80E(bkMonthLabel(m).split(' ')[0])} so far</small><b>${nf80P(J.nowT)}</b></div><span class="ar" aria-hidden="true">vs</span><div><small>${nf80E(J.R.label)}</small><b>${nf80P(J.wasT)}</b></div>${Math.abs(d) >= 1 ? `<span class="chip big ${d > 0 ? 'r' : 'g'}">${d > 0 ? '▲' : '▼'} ${nf80P(Math.abs(d))}${pct != null ? ` · ${d > 0 ? '+' : ''}${pct}%` : ''}</span>` : '<span class="chip big n">Same</span>'}</div>
    ${J.ups.length ? `<h3 class="hu">${nf80Ic('<path d="M12 19V5M5 12l7-7 7 7"/>', 16)}Went up</h3>${J.ups.map(r => nf80JRow(r, max, m)).join('')}` : '<p class="sub">No cost went up. Nice.</p>'}
    ${J.downs.length ? `<h3 class="hd">${nf80Ic('<path d="M12 5v14M19 12l-7 7-7-7"/>', 16)}Went down</h3>${J.downs.map(r => nf80JRow(r, max, m)).join('')}` : ''}
  </section>`;
}
if(typeof nf77MoneyAfter === 'function'){
  const _ma = nf77MoneyAfter;
  nf77MoneyAfter = function(){
    _ma.apply(this, arguments);
    try{ const body = document.getElementById('bkMoneyBody'); const two = body && body.querySelector('.bk-two'); if(!two) return;
      const m = bkMonthSel || bkMonth(APP_TODAY); two.classList.add('nf80-two');
      let side = two.querySelector('.nf80-jumps'); const html = nf80JumpsHtml(m);
      if(side){ if(side.dataset.k !== html){ side.outerHTML = html; side = two.querySelector('.nf80-jumps'); } } else { two.insertAdjacentHTML('beforeend', html); side = two.querySelector('.nf80-jumps'); }
      if(side) side.dataset.k = html;
    }catch(e){ console.warn('nf80 jumps', e); }
  };
  window.nf77MoneyAfter = nf77MoneyAfter;
}

// the statement: when the drawer had extra cash, that small credit is shown so the expense lines add up to the total
if(typeof nf77MoneyAfter === 'function'){
  const _mb = nf77MoneyAfter;
  nf77MoneyAfter = function(){
    _mb.apply(this, arguments);
    try{ const card = document.getElementById('bkPnlPrint'); if(!card || card.querySelector('.nf80-over')) return;
      const m = bkMonthSel || bkMonth(APP_TODAY), p = bkPnl(m), sum = Object.values(p.byCat || {}).reduce((a, v) => a + (Number(v) || 0), 0), diff = Math.round((sum - (Number(p.expenses) || 0)) * 100) / 100;
      if(Math.abs(diff) < 0.5) return; const grp = card.querySelector('.pl-grp'); if(!grp) return;
      grp.insertAdjacentHTML('beforeend', `<div class="pl-r pl-sub nf80-over"><span>${diff > 0 ? 'Less: extra cash found in counts' : 'Other costs'}</span><span>${diff > 0 ? '−' : ''}${nf80P(Math.abs(diff))}</span></div>`);
    }catch(e){}
  };
  window.nf77MoneyAfter = nf77MoneyAfter;
}

/* ---------- 2. Utang: easy to start, easy to follow, every peso traceable ---------- */
const NF80U = {tab: 'open', open: {}};
function nf80NewUtang(){
  const go2 = () => { try{ openQuickSale(); QS.paidWith = 'credit'; qsRender(); setTimeout(() => { const c = document.querySelector('#qsModal .nf44-cust input, #qsModal input[placeholder*="ustomer"]'); if(c) c.focus(); }, 120); }catch(e){ console.warn(e); } };
  if(typeof BK !== 'undefined' && !BK.loaded){ bkLoad().then(go2); return; } go2();
}
function nf80UtAll(){ return bkLiveSales().filter(s => s.paidWith === 'credit' || bkSaleBalance(s) > 0); }
function nf80LastPay(s){ const ps = (s.payments || []).map(p => bkPayDate(p) || s.date).sort(); return ps[ps.length - 1] || s.date; }
function nf80Items(s){ const ls = (s.lines || []).filter(l => !l.totalOnly); return ls.length ? ls.slice(0, 2).map(l => `${Number(l.qty) || 0} × ${l.product}`).join(', ') + (ls.length > 2 ? ` +${ls.length - 2} more` : '') : 'Sale'; }
function nf80UtHist(s, canUndo){
  const ev = [{d: s.date, at: s.at || s.date, t: 'Utang started', amt: s.total, by: s.by, k: 'start'}];
  (s.payments || []).forEach((p, i) => ev.push({d: bkPayDate(p) || s.date, at: p.at || bkPayDate(p) || s.date, t: 'Paid · ' + (NF79ML[String(p.method || '').toLowerCase()] || p.method || 'payment'), amt: p.amount, by: p.by, k: 'pay', i}));
  (s.payLog || []).filter(l => l.a === 'undone').forEach(l => ev.push({d: String(l.at || '').slice(0, 10), at: l.at, t: 'Payment taken back · ' + (NF79ML[String(l.m || '').toLowerCase()] || l.m || ''), amt: l.amt, by: l.by, k: 'undo'}));
  ev.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  return `<div class="nf80-hist">${ev.map(e => `<div class="hr ${e.k}"><span class="dt">${nf80E(bkDayLabel(String(e.d).slice(0, 10)))}</span><span class="tx">${nf80E(e.t)}${e.by ? `<small>by ${nf80E(e.by)}</small>` : ''}</span><b>${e.k === 'pay' ? '−' : ''}${nf80P(e.amt)}</b>${e.k === 'pay' && canUndo ? `<button type="button" class="nf78-undo" onclick="nf80UtUndo('${s.id}', ${e.i})">Undo</button>` : '<span></span>'}</div>`).join('')}</div>`;
}
async function nf80UtUndo(id, i){
  if(!booksCanSeeTotals()){ showToast('Only the owner can take back a payment.', 'warn'); return; }
  const s = BK.sales.find(x => x.id === id); if(!s) return; const p = (s.payments || [])[i]; if(!p) return;
  const payments = (s.payments || []).filter((_, k) => k !== i), payLog = (s.payLog || []).concat([{a: 'undone', at: new Date().toISOString(), m: p.method, amt: p.amount, by: bkMe(), paidOn: bkPayDate(p) || null}]);
  if(myBusiness){ const { error } = await sb.from('downstream_sales').update({payments, payment_log: payLog}).eq('id', id); if(error){ showToast(error.message, 'error'); return; } }
  s.payments = payments; s.payLog = payLog; try{ bkSaveDemo(); }catch(e){}
  showToast(`Taken back: ${nf80P(p.amount)}. It shows in the history.`, 'success');
  try{ bkRefreshViews(); }catch(e){} try{ if(document.querySelector('#page-collections.active')) renderCollectionsPage(); }catch(e){}
}
function nf80UtRow(s, canUndo){
  const bal = bkSaleBalance(s), paid = Math.max(0, Number(s.total) - bal), pct = s.total ? Math.round(paid / s.total * 100) : 0, n = (s.payments || []).length + (s.payLog || []).filter(l => l.a === 'undone').length;
  const age = daysBetween(s.date, APP_TODAY);
  return `<div class="nf80-ur nf79-rph${NF80U.open[s.id] ? ' hopen' : ''}" data-id="${s.id}">
    <div class="top"><div class="who"><b>${nf80E(s.customer || 'Walk-in')}</b><small>${nf80E(bkDayLabel(s.date))}${age > 0 ? ` · ${age} day${age === 1 ? '' : 's'} ago` : ''} · ${nf80E(nf80Items(s))}${s.by ? ' · by ' + nf80E(s.by) : ''}${s.photo ? ` · <button type="button" class="nf80-ph" onclick="bkShowPhoto(${JSON.stringify(s.photo).replace(/"/g, '&quot;')})">${nf80Ic('<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3.5"/>', 13)}Photo</button>` : ''}</small></div>
      <div class="amt">${bal > 0 ? `<span>Owes</span><b>${nf80P(bal)}</b>` : `<span class="done">${nf80Ic('<path d="M20 6 9 17l-5-5"/>', 15)}Paid off</span><b>${nf80P(s.total)}</b>`}</div></div>
    <div class="prog"><span><i style="width:${pct}%"></i></span><small>Paid ${nf80P(paid)} of ${nf80P(s.total)}</small></div>
    <div class="acts">${bal > 0 ? `<button type="button" class="nf77-b p sm" onclick="nf79RpOpen(this)">${nf80Ic('<path d="M12 5v14M5 12h14"/>', 15)}Record payment</button>` : ''}<button type="button" class="nf77-b s sm" onclick="NF80U.open['${s.id}'] = !NF80U.open['${s.id}']; this.closest('.nf80-ur').classList.toggle('hopen')">History${n ? ` (${n + 1})` : ''}</button></div>
    ${bal > 0 ? nf79RpHtml('ut:' + s.id, bal, {utang: true}) : ''}
    <div class="hwrap">${nf80UtHist(s, canUndo)}</div></div>`;
}
function nf80UtTracker(){
  const all = nf80UtAll(), open = all.filter(s => bkSaleBalance(s) > 0).sort((a, b) => a.date.localeCompare(b.date)), paid = all.filter(s => bkSaleBalance(s) <= 0 && daysBetween(nf80LastPay(s), APP_TODAY) <= 60).sort((a, b) => nf80LastPay(b).localeCompare(nf80LastPay(a)));
  const tot = open.reduce((a, s) => a + bkSaleBalance(s), 0), who = new Set(open.map(s => s.customer)).size, can = booksCanSeeTotals();
  const list = NF80U.tab === 'paid' ? paid : open;
  return `<div class="panel-head nf80-uh"><div><h2>Utang (pay later)</h2><p>${open.length ? `<b>${nf80P(tot)}</b> still owed by ${who} customer${who === 1 ? '' : 's'}` : 'Nobody owes you from the shop right now.'}</p></div><button type="button" class="btn btn-primary nf80-newut" onclick="nf80NewUtang()">+ New utang</button></div>
    <div class="nf80-ut-tabs" role="tablist"><button type="button" role="tab" aria-selected="${NF80U.tab !== 'paid'}" class="${NF80U.tab !== 'paid' ? 'on' : ''}" onclick="NF80U.tab='open'; nf80UtPaint(true)">Still owed <em>${open.length}</em></button><button type="button" role="tab" aria-selected="${NF80U.tab === 'paid'}" class="${NF80U.tab === 'paid' ? 'on' : ''}" onclick="NF80U.tab='paid'; nf80UtPaint(true)">Paid off <em>${paid.length}</em></button></div>
    ${list.length ? `<div class="nf80-ul">${list.map(s => nf80UtRow(s, can)).join('')}</div>` : `<div class="nf80-uempty">${NF80U.tab === 'paid' ? 'No utang paid off in the last 60 days.' : 'When someone takes items and pays later, tap <b>+ New utang</b>. It shows here until it is paid, with every payment and who took it.'}</div>`}
    ${can ? '' : '<p class="nf80-unote">Only the owner can take back a payment. Ask them if one was typed wrong.</p>'}`;
}
function nf80UtPaint(force){
  const pg = document.querySelector('#page-sales.active'); if(!pg || typeof BK === 'undefined' || !BK.loaded) return;
  let sec = pg.querySelector('.nf75-utang');
  if(!sec){ const today = pg.querySelector('.nf75-today'); if(!today) return; sec = document.createElement('section'); sec.className = 'panel-card bk-list nf75-utang'; today.after(sec); }
  sec.classList.add('nf80-ut'); sec.classList.remove('nf75-mini');
  const html = nf80UtTracker(); if(!force && sec.dataset.k === html) return; if(sec.querySelector('.nf79-rp.open') && !force) return;
  sec.dataset.k = html; sec.innerHTML = html;
}
NF45_AFTER.push(page => { if(page && page.id === 'page-sales') try{ nf80UtPaint(); }catch(e){ console.warn('nf80 ut', e); } });
// "+ Utang" next to "+ New sale" on Walk-in sales
NF45_AFTER.push(page => { if(!page || page.id !== 'page-sales') return; try{ const ns = [...page.querySelectorAll('button')].find(b => /^\+ ?New sale$/.test(b.textContent.trim()) && b.offsetParent); if(ns && !page.querySelector('.nf80-utbtn')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-outline nf80-utbtn'; b.textContent = '+ Utang (pay later)'; b.onclick = () => nf80NewUtang(); ns.insertAdjacentElement('afterend', b); } }catch(e){} });
// Getting paid: the shop utang group also shows what was paid off lately (with Undo), and how to add one
(function(){
  const base = nf76PaidTotals;
  nf76PaidTotals = function(){
    base.apply(this, arguments);
    try{ const pg = document.querySelector('#page-collections.active'); if(!pg) return; const g = pg.querySelectorAll('#nf76TotS .nf78-tot > .g')[1]; if(!g || g.dataset.nf80) return; g.dataset.nf80 = '1';
      const paid = nf80UtAll().filter(s => bkSaleBalance(s) <= 0 && daysBetween(nf80LastPay(s), APP_TODAY) <= 30).slice(0, 4), can = booksCanSeeTotals();
      const gh = g.querySelector('.gh'); if(gh && !gh.querySelector('.nf80-gadd')) gh.insertAdjacentHTML('beforeend', '');
      g.insertAdjacentHTML('beforeend', `<div class="nf80-gfoot"><button type="button" class="nf77-link" onclick="nf80NewUtang()">+ New utang</button><button type="button" class="nf77-link" onclick="go('sales')">See all utang and history</button></div>${paid.length ? `<div class="nf80-paid"><b>Paid off lately</b>${paid.map(s => { const lp = (s.payments || [])[(s.payments || []).length - 1]; return `<div class="pr"><span>${nf80E(s.customer)}<small>${nf80P(s.total)} utang · paid ${nf80E(bkDayLabel(nf80LastPay(s)))}${lp ? ' · ' + nf80E(NF79ML[String(lp.method || '').toLowerCase()] || lp.method || '') : ''}</small></span>${can && lp ? `<button type="button" class="nf78-undo" onclick="nf80UtUndo('${s.id}', ${(s.payments || []).length - 1})">Undo</button>` : ''}</div>`; }).join('')}</div>` : ''}`);
    }catch(e){ console.warn('nf80 gp', e); }
  };
  window.nf76PaidTotals = nf76PaidTotals;
})();
// a payment on an utang refreshes the tracker too
if(typeof nf79UtSave === 'function'){ const _us = nf79UtSave; nf79UtSave = async function(){ const r = await _us.apply(this, arguments); try{ setTimeout(() => nf80UtPaint(true), 80); }catch(e){} return r; }; window.nf79UtSave = nf79UtSave; }

/* ---------- 3. Home: Profit margin tile with what pulled it down; costs list gets an "Others" row ---------- */
if(typeof nf75OwnerHtml === 'function'){
  const _o80 = nf75OwnerHtml;
  nf75OwnerHtml = function(){
    let html = _o80.apply(this, arguments);
    try{
      html = html.replace('<span class="lb">You keep</span>', '<span class="lb">Profit margin</span>').replace(/<span class="u">profit margin[^<]*<\/span>/, '');
      const m = bkMonth(APP_TODAY), J = nf80CostJumps(m);
      if(J && J.ups.length && J.sales){ const u = J.ups[0], pts = u.d / J.sales * 100;
        html = html.replace(/(<button type="button" class="nf74-ot nf75-mg nf78-mg[^"]*"[^>]*>)([\s\S]*?)(<i class="go" aria-hidden="true">›<\/i><\/button>)/, (m0, a, body, c) => `${a.replace('nf78-mg', 'nf78-mg nf80-mg')}<div class="l">${body}</div><div class="drag"><small>Pulled it down</small><b>${nf80E(u.k)}</b><span>+${nf80P(u.d)}</span><em>−${pts.toFixed(1)} pts</em></div>${c}`); }
      // Others row before the Total row
      const tm = html.match(/<div class="nf79-ctot">[\s\S]*?<b>(₱[\d,.]+)<\/b>/);
      if(tm){ const total = Number(tm[1].replace(/[₱,]/g, '')) || 0, costBtn = html.match(/<button type="button" class="nf74-ot t-b nf74-costs"[\s\S]*?<\/ol>/);
        if(costBtn){ const tops = [...costBtn[0].matchAll(/<li>[\s\S]*?<b>(₱[\d,.]+)<\/b>/g)].map(x => Number(x[1].replace(/[₱,]/g, '')) || 0), others = Math.round(total - tops.reduce((a, v) => a + v, 0));
          if(others >= 1) html = html.replace('<div class="nf79-ctot">', `<div class="nf80-oth"><span class="n">+</span><span class="k">Others</span><b>${nf80P(others)}</b><em>${total ? Math.round(others / total * 100) : 0}%</em></div><div class="nf79-ctot">`); } }
    }catch(e){ console.warn('nf80 owner', e); }
    return html;
  };
  window.nf75OwnerHtml = nf75OwnerHtml;
  if(typeof nf72OwnerHtml === 'function'){ nf72OwnerHtml = nf75OwnerHtml; window.nf72OwnerHtml = nf75OwnerHtml; }
}
