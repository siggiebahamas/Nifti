/* ===== Round 81 ===== */
function nf81E(s){ return escapeHtml(String(s == null ? '' : s)); }
function nf81P(n){ return typeof bkPeso === 'function' ? bkPeso(n) : fmtPHP(n); }
const NF81 = {costs: false, open: {}, mopen: {}};
function nf81Tog(btn, key, store){ const t = btn.parentElement; t.classList.toggle('open'); const on = t.classList.contains('open'); btn.setAttribute('aria-expanded', on); NF81[store][key] = on; }

/* ---------- 1. New sale: "Utang (pay later)" never gets cut off: Utang on top, (pay later) below ---------- */
function nf81TwoLine(root){
  (root || document).querySelectorAll('.nf43-seg > button, .nf43-drop > button').forEach(b => {
    const t = b.textContent.replace('▾', '').replace(/\s+/g, ' ').trim();
    if(!/^Utang \(pay later\)$/i.test(t) || b.querySelector('.nf81-2l, .nf81-dl')) return;
    b.innerHTML = b.parentElement.classList.contains('nf43-drop')
      ? '<span class="nf81-dl"><b>Utang</b><small>(pay later)</small></span>'
      : '<span class="nf81-2l"><span>Utang ▾</span><small>(pay later)</small></span>';
    b.setAttribute('aria-label', 'Utang, pay later');
  });
}
(function(){
  if(typeof slModal !== 'function' || slModal._nf81) return;
  const base = slModal;
  const w = function(){ const m = base.apply(this, arguments); try{ nf81TwoLine(m); }catch(e){} return m; };
  w._nf43 = true; w._nf81 = true; slModal = w; window.slModal = w;
})();

/* ---------- 2. Money overview: costs this month vs the same days last month, as one plain table ---------- */
function nf81CostRows(m){
  if(typeof LG === 'undefined' || !LG.loaded) return null;
  const R = nf74SameRange(m), p = bkPnl(m), cur = Object.assign({}, p.byCat || {}), pq = lgPnlFor(R.from, R.to), prev = nf80Names(pq.opex);
  const keys = [...new Set(Object.keys(cur).concat(Object.keys(prev)))];
  const rows = keys.map(k => ({k, now: Math.round(cur[k] || 0), was: Math.round(prev[k] || 0)})).filter(r => r.now || r.was).map(r => Object.assign(r, {d: r.now - r.was}));
  rows.sort((a, b) => (b.d - a.d) || (b.now - a.now));
  const nowT = Math.round(Number(p.expenses) || 0), wasT = Math.round(Object.values(prev).reduce((a, v) => a + (Number(v) || 0), 0) - (Number(pq.other) || 0));
  const sumNow = rows.reduce((a, r) => a + r.now, 0), sumWas = rows.reduce((a, r) => a + r.was, 0);
  const extra = {now: nowT - sumNow, was: wasT - sumWas};
  const cm = String(APP_TODAY).slice(0, 7), curLabel = R.full ? nf74Mon(m, 'long') : `${nf74Mon(m)} 1–${Number(String(APP_TODAY).slice(8, 10))}`;
  return {R, rows, nowT, wasT, extra, curLabel, wasLabel: R.full ? nf74Mon(R.pm, 'long') : R.label, partial: m === cm};
}
function nf81Chg(d, was, note){
  if(Math.abs(d) < 1) return '<span class="c s">Same</span>';
  const up = d > 0, pct = was ? Math.round(Math.abs(d) / was * 100) : null;
  return `<span class="c ${up ? 'up' : 'dn'}"><b>${up ? '+' : '−'}${nf81P(Math.abs(d))}</b>${note ? `<small>${note}</small>` : pct != null && was ? `<small>${up ? '+' : '−'}${pct}%</small>` : up ? '<small>new</small>' : ''}</span>`;
}
function nf81CostLines(k, m){
  if(NF80_NONEXP[k]) return `<p class="jn">${nf81E(NF80_NONEXP[k])} <button type="button" class="nf77-link" onclick="go('issues')">See them in To check</button></p>`;
  const lines = (BK.expenses || []).filter(e => !e.deletedAt && e.category === k && bkMonth(e.date) === m && (e.status || 'approved') === 'approved').sort((a, b) => b.date.localeCompare(a.date));
  if(!lines.length) return '<p class="jn">Nothing recorded for this yet this month.</p>';
  return `<div class="jl">${lines.slice(0, 8).map(e => `<div><span>${nf81E(bkDayLabel(e.date))}${e.vendor ? ' · ' + nf81E(e.vendor) : ''}${e.note ? ' · ' + nf81E(String(e.note).slice(0, 40)) : ''}</span><b>${nf81P(e.amount)}</b></div>`).join('')}${lines.length > 8 ? `<button type="button" class="nf77-link" onclick="go('expenses')">See all ${lines.length} in Expenses</button>` : ''}</div>`;
}
nf80JumpsHtml = function(m){
  let T = null; try{ T = nf81CostRows(m); }catch(e){ T = null; }
  if(!T) return `<section class="panel-card nf80-jumps nf81-ct"><div class="panel-head"><h2>Costs vs last month</h2></div><p class="sub">Loading your books…</p></section>`;
  const d = T.nowT - T.wasT, pct = T.wasT ? Math.round(Math.abs(d) / T.wasT * 100) : null, top = d >= 0 ? T.rows.filter(r => r.d > 0)[0] : T.rows.slice().reverse().filter(r => r.d < 0)[0];
  const say = Math.abs(d) < 1 ? 'Your costs are the same as ' + nf81E(T.wasLabel) + '.'
    : `Costs are <b class="${d > 0 ? 'up' : 'dn'}">${d > 0 ? 'up' : 'down'} ${nf81P(Math.abs(d))}${pct != null ? ` (${pct}%)` : ''}</b> compared with ${nf81E(T.wasLabel)}.${top ? ` Biggest ${d > 0 ? 'jump' : 'drop'}: <b>${nf81E(top.k)}</b>, ${d > 0 ? 'up' : 'down'} ${nf81P(Math.abs(top.d))}.` : ''}`;
  const row = r => { const notYet = T.partial && !r.now && r.was > 0;
    const op = !!NF81.mopen[r.k];
    return `<div class="tr${op ? ' open' : ''}"><button type="button" class="rw" aria-expanded="${op}" onclick="nf81Tog(this, ${nf81E(JSON.stringify(r.k))}, 'mopen')"><span class="k"><i aria-hidden="true">›</i>${nf81E(r.k)}</span><span class="v">${nf81P(r.was)}</span><span class="v">${nf81P(r.now)}</span>${nf81Chg(r.d, r.was, notYet ? 'no bill yet' : '')}</button><div class="jd">${nf81CostLines(r.k, bkMonthSel || bkMonth(APP_TODAY))}</div></div>`; };
  const ex = Math.abs(T.extra.now) >= 1 || Math.abs(T.extra.was) >= 1 ? `<div class="tr x"><div class="rw"><span class="k">Less: extra cash found in counts</span><span class="v">${T.extra.was ? '−' + nf81P(Math.abs(T.extra.was)) : nf81P(0)}</span><span class="v">${T.extra.now ? '−' + nf81P(Math.abs(T.extra.now)) : nf81P(0)}</span><span class="c"></span></div></div>` : '';
  return `<section class="panel-card nf80-jumps nf81-ct"><div class="panel-head"><h2>Costs: this month vs last month</h2></div>
    <p class="sub">${T.R.full ? `${nf81E(T.curLabel)} compared with ${nf81E(T.wasLabel)}.` : `${nf81E(T.curLabel)} compared with the same days last month (${nf81E(T.wasLabel)}).`} Tap a cost to see what's in it.</p>
    <p class="say">${say}</p>
    <div class="tb" role="table" aria-label="Costs compared with last month">
      <div class="th" role="row"><span>Cost</span><span class="pm"><small>${T.partial ? 'Last month' : 'Month before'}</small>${nf81E(T.wasLabel)}</span><span class="cm"><small>${T.partial ? 'This month' : 'Month shown'}</small>${nf81E(T.curLabel)}</span><span>Change</span></div>
      ${T.rows.map(row).join('')}${ex}
      <div class="tt" role="row"><span class="k">Total costs</span><span class="v">${nf81P(T.wasT)}</span><span class="v">${nf81P(T.nowT)}</span>${nf81Chg(d, T.wasT, '')}</div>
    </div>
    <p class="key"><span class="up">+ red</span> = you spent more · <span class="dn">− green</span> = you spent less</p>
  </section>`;
};
window.nf80JumpsHtml = nf80JumpsHtml;

/* ---------- 3. Home owner view: margin tile matches Profit so far; walk-in vs delivery; costs open right here ---------- */
function nf81Channels(m){
  const p = bkPnl(m), sales = (BK.sales || []).filter(r => bkMonth(r.date) === m && !r.voided && !r.voidedAt && !r.deletedAt);
  let wc = 0; sales.forEach(r => (r.lines || []).forEach(l => { wc += (Number(l.qty) || 0) * (Number(l.unitCost) || 0); }));
  const ws = Number(p.counter) || 0, os = Number(p.orders) || 0, cost = Number(p.cost) || 0;
  wc = Math.min(wc, cost); const oc = Math.max(0, cost - wc);
  const one = (s, c) => ({sales: s, gross: Math.round(s - c), pct: s > 0 ? (s - c) / s * 100 : null});
  return {walk: one(ws, wc), del: one(os, oc)};
}
function nf81Pct(v){ return v == null ? '—' : (Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + '%'; }
function nf81CostsPanel(){
  const m = bkMonth(APP_TODAY), p = bkPnl(m), byCat = Object.entries(p.byCat || {}).filter(([, v]) => Math.abs(Number(v) || 0) >= 1).sort((a, b) => b[1] - a[1]);
  const exp = Math.round(Number(p.expenses) || 0), sumCat = byCat.reduce((a, [, v]) => a + Math.round(Number(v) || 0), 0), extra = exp - sumCat, cost = Math.round(Number(p.cost) || 0), total = cost + exp;
  const pc = v => total ? Math.round(v / total * 100) : 0, max = Math.max(1, cost, ...byCat.map(([, v]) => v));
  const row = (k, v, note, cls) => `<div class="cr${cls ? ' ' + cls : ''}${NF81.open[k] ? ' open' : ''}"><button type="button" class="rw" aria-expanded="${!!NF81.open[k]}" onclick="nf81Tog(this, ${nf81E(JSON.stringify(k))}, 'open')"><span class="k"><i aria-hidden="true">›</i>${nf81E(k)}</span><b>${nf81P(v)}</b><span class="bar" aria-hidden="true"><i style="width:${Math.max(2, v / max * 100).toFixed(1)}%"></i></span><em>${pc(v)}%</em></button><div class="jd">${note}</div></div>`;
  return `<div class="nf81-cb" id="nf81Costs">
    <div class="hd"><b>Where your money went · ${nf81E(nf74Mon(m, 'long'))} so far</b><button type="button" class="nf77-b s sm" onclick="nf81Costs()">Close</button></div>
    <div class="th"><span>Cost</span><span>Amount</span><span>Share of all costs</span></div>
    ${cost ? row('Stock you sold', cost, '<p class="jn">What the items you sold cost you to buy. Change it by fixing an item\'s cost in Stock.</p>', 'cogs') : ''}
    ${byCat.map(([k, v]) => row(k, Math.round(v), nf81CostLines(k, m))).join('')}
    ${Math.abs(extra) >= 1 ? `<div class="cr x"><div class="rw"><span class="k">${extra < 0 ? 'Less: extra cash found in counts' : 'Other costs'}</span><b>${extra < 0 ? '−' : ''}${nf81P(Math.abs(extra))}</b><span></span><em></em></div></div>` : ''}
    <div class="ct"><span class="k">Total costs</span><b>${nf81P(total)}</b><span></span><em>100%</em></div>
    <div class="ft"><span>Tap a cost to see each expense under it.</span><button type="button" class="nf77-link" onclick="go('expenses')">Open Expenses ›</button></div>
  </div>`;
}
function nf81Costs(){
  NF81.costs = !NF81.costs;
  try{ const home = document.getElementById('mhHome'); if(home && typeof nf72Owner === 'function') nf72Owner(home); }catch(e){}
  if(NF81.costs) setTimeout(() => { const el = document.getElementById('nf81Costs'); if(el){ const r = el.getBoundingClientRect(); if(r.bottom > innerHeight) el.scrollIntoView({behavior: 'smooth', block: 'nearest'}); } }, 60);
}
if(typeof nf75OwnerHtml === 'function'){
  const _o81 = nf75OwnerHtml;
  nf75OwnerHtml = function(){
    let html = _o81.apply(this, arguments);
    try{
      // margin tile: no "pulled it down"; same label/number as Profit so far; walk-in vs delivery underneath
      html = html.replace(/<div class="drag">[\s\S]*?<\/div>/, '');
      const m = bkMonth(APP_TODAY), C = nf81Channels(m);
      const allS = (C.walk.sales || 0) + (C.del.sales || 0), shr = v => allS ? v / allS * 100 : 0;
      const chRow = (lb, c, cls) => `<div class="r"><span><i class="${cls}" aria-hidden="true"></i>${lb}</span><em>${nf81P(c.sales || 0)}</em><b>${allS ? nf82Share(shr(c.sales || 0)) : '—'}</b></div>`;
      const ch = allS ? `<div class="nf81-ch"><small>Share of sales · walk-in vs delivery</small><div class="sb" role="img" aria-label="Walk-in ${nf82Share(shr(C.walk.sales || 0))} of sales, delivery ${nf82Share(shr(C.del.sales || 0))}"><i class="w" style="width:${shr(C.walk.sales || 0).toFixed(1)}%"></i><i class="d" style="width:${shr(C.del.sales || 0).toFixed(1)}%"></i></div>${chRow('Walk-in', C.walk, 'w')}${chRow('Delivery', C.del, 'd')}</div>` : '';
      html = html.replace(/(<button type="button" class="nf74-ot nf75-mg[^"]*)("[^>]*>)([\s\S]*?)(<i class="go" aria-hidden="true">›<\/i><\/button>)/, (m0, a, b, body, c) => `${a} nf81-mg${b}${/^<div class="l">/.test(body) ? body : '<div class="l">' + body + '</div>'}${ch}${c}`);
      // Biggest costs: open the breakdown right here instead of leaving the page
      html = html.replace(/class="nf74-ot t-b nf74-costs" onclick="go\('expenses'\)"/, `class="nf74-ot t-b nf74-costs${NF81.costs ? ' on' : ''}" onclick="nf81Costs()" aria-expanded="${NF81.costs ? 'true' : 'false'}" aria-controls="nf81Costs"`);
      if(NF81.costs){ const k = html.lastIndexOf('</section>'); if(k > 0) html = html.slice(0, k) + nf81CostsPanel() + html.slice(k); }
    }catch(e){ console.warn('nf81 owner', e); }
    return html;
  };
  window.nf75OwnerHtml = nf75OwnerHtml;
  if(typeof nf72OwnerHtml === 'function'){ nf72OwnerHtml = nf75OwnerHtml; window.nf72OwnerHtml = nf75OwnerHtml; }
}
