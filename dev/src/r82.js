/* ===== Round 82 ===== */
function nf82E(s){ return escapeHtml(String(s == null ? '' : s)); }
function nf82P(n){ return typeof bkPeso === 'function' ? bkPeso(n) : fmtPHP(n); }
function nf82Share(v){ return v > 0 && v < 1 ? '<1%' : Math.round(v) + '%'; }
function nf82Ic(d, s){ return `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`; }

/* ---------- 1. Expenses: "Where the money went" as one bar + a table that adds up, with last month beside it ---------- */
function nf82ExpByCat(from, to){
  const o = {};
  try{ (BK.expenses || []).filter(e => !e.deletedAt && (e.status || 'approved') === 'approved' && e.date >= from && e.date <= to).forEach(e => { const c = bkCat(e.category); if(c.transfer || c.drawing || c.cogs) return; o[e.category] = (o[e.category] || 0) + (Number(e.amount) || 0); }); }catch(e){}
  return o;
}
const NF82_COL = ['#2459C9', '#15803D', '#7C3AED', '#0E7490', '#C026D3', '#B45309', '#475467'];
function nf82Where(cats, m, un){
  const total = cats.reduce((a, [, v]) => a + (Number(v) || 0), 0); if(!total) return '';
  const top = cats.slice(0, 6), rest = cats.slice(6).reduce((a, [, v]) => a + v, 0); if(rest > 0) top.push(['Everything else', rest]);
  const restKeys = cats.slice(6).map(([k]) => k);
  const mon = new Date(m + '-01T00:00:00').toLocaleDateString('en-PH', {month: 'long', year: 'numeric'});
  const days = Math.max(1, m === String(APP_TODAY).slice(0, 7) ? Number(String(APP_TODAY).slice(8, 10)) : new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate());
  let R = null, prev = {}, prevT = 0;
  try{ R = nf74SameRange(m); prev = nf82ExpByCat(R.from, R.to); prevT = Object.values(prev).reduce((a, v) => a + v, 0); }catch(e){ R = null; }
  const prevOf = k => k === 'Everything else' ? restKeys.reduce((a, x) => a + (prev[x] || 0), 0) : (prev[k] || 0);
  const chg = (now, was) => { const d = Math.round(now - was); if(!R) return ''; if(Math.abs(d) < 1) return '<span class="c s">Same</span>'; return `<span class="c ${d > 0 ? 'up' : 'dn'}">${d > 0 ? '+' : '−'}${nf82P(Math.abs(d))}</span>`; };
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const dT = total - prevT, pct = prevT ? Math.round(Math.abs(dT) / prevT * 100) : null;
  const say = R && prevT ? (Math.abs(dT) < 1 ? `Same as ${nf82E(R.label)}.` : `<b class="${dT > 0 ? 'up' : 'dn'}">${dT > 0 ? 'Up' : 'Down'} ${nf82P(Math.abs(dT))}${pct != null ? ` (${pct}%)` : ''}</b> compared with ${nf82E(R.label)}.`) : '';
  const seg = top.map(([k, v], i) => { const pc = v / total * 100; return `<i style="width:${pc.toFixed(2)}%;background:${NF82_COL[i % NF82_COL.length]}" title="${nf82E(k)}: ${nf82P(v)}">${pc >= 14 ? `<span>${nf82E(k)} ${Math.round(pc)}%</span>` : ''}</i>`; }).join('');
  const rows = top.map(([k, v], i) => { const pc = Math.round(v / total * 100), off = k === 'Everything else';
    return `<button type="button" class="wr" ${off ? 'disabled' : `onclick="bkExpFilter='${esc(k)}'; renderExpensesPage()"`}><span class="k"><i style="background:${NF82_COL[i % NF82_COL.length]}"></i>${nf82E(k)}</span><b>${nf82P(v)}</b><em>${pc}%</em>${R ? `<span class="v">${nf82P(prevOf(k))}</span>${chg(v, prevOf(k))}` : ''}</button>`; }).join('');
  return `<section class="panel-card nf76-where nf82-where"><div class="panel-head"><h2>Where the money went</h2></div>
    <div class="top"><div class="tt"><small>${nf82E(mon)}${m === String(APP_TODAY).slice(0, 7) ? ' so far' : ''}</small><b>${nf82P(total)}</b><span>about ${nf82P(total / days)} a day · ${top.length} kind${top.length === 1 ? '' : 's'} of expense</span></div>${say ? `<p class="say">${say}</p>` : ''}</div>
    <div class="stk" role="img" aria-label="Share of spending by kind">${seg}</div>
    <div class="tb${R ? '' : ' nr'}"><div class="th"><span>Kind</span><span>This month</span><span>Share</span>${R ? `<span>${nf82E(R.label)}</span><span>Change</span>` : ''}</div>${rows}
      <div class="tr"><span class="k">Total</span><b>${nf82P(total)}</b><em>100%</em>${R ? `<span class="v">${nf82P(prevT)}</span>${chg(total, prevT)}` : ''}</div></div>
    <p class="nf76-wn">Tap a kind to see only its expenses. <span class="up">+ red</span> = spent more · <span class="dn">− green</span> = spent less.</p></section>`;
}
nf74Where = nf82Where; window.nf74Where = nf82Where;
try{ if(typeof nf76Where === 'function'){ nf76Where = nf82Where; window.nf76Where = nf82Where; } }catch(e){}

/* ---------- 2. Expenses: lines waiting for your OK stand out on their own (no extra tag), type and note stack neatly ---------- */
function nf82ExpRows(){
  const pg = document.getElementById('page-expenses'); if(!pg || !pg.classList.contains('active')) return;
  pg.querySelectorAll('table.nf25-t tr').forEach(tr => {
    const ok = tr.querySelector('.nf75-ok');
    if(ok && !tr.classList.contains('nf82-need')){
      tr.classList.add('nf82-need'); tr.title = 'Waiting for your OK';
      const tag = tr.querySelector('td.t small .bk-tag');
      if(tag){ const sm = tag.parentElement; tag.remove(); sm.innerHTML = sm.innerHTML.replace(/\s*·\s*$/, ''); if(!sm.textContent.trim()) sm.remove(); }
      if(!ok.querySelector('svg')) ok.insertAdjacentHTML('afterbegin', nf82Ic('<path d="M20 6 9 17l-5-5"/>', 15));
    }
  });
}
NF45_AFTER.push(() => { try{ nf82ExpRows(); }catch(e){} });

/* ---------- 3. Plans: get-paid tools, purchase history and credit limits in Free; staff controls in Pro; Business ₱2,490 ---------- */
try{
  if(typeof NF26_PLANS !== 'undefined'){
    const set = (k, o) => { const p = NF26_PLANS.find(x => x.k === k); if(p) Object.assign(p, o); };
    set('free', {who: 'For a small shop, every day. Free for good.', f: ['orders|Orders with customers and suppliers', 'credit|Collect today: who to remind, with the message ready', 'money|A pay link for each customer, with "I paid" and screenshots', 'qr|Your GCash or bank QR on every bill', 'shield|Due dates and utang limits', 'box|Stock, shop sales and expenses', 'history|Purchase history and supplier records', 'store|Online store and Facebook posts', 'users|Up to 3 people', 'download|Download everything, any time']});
    set('pro', {m: 990, y: 9900, who: 'Nifti keeps your books and watches your staff spending.', f: ['star|Everything in Free, plus:', 'upload|We load your items and utang for you', 'book|Profit and books, ready for your bookkeeper', 'wallet|Payroll and check tracking', 'shield|Spending limits and alerts when staff overpay', 'undo|Returns and credits, handled', 'megaphone|Price announcements to the buyers you pick', 'chart|Store results and reorder reminders', 'users|Up to 10 people · more for ₱99 each a month']});
    set('business', {m: 2490, y: 24900, who: 'For drivers, branches and bigger teams.', f: ['star|Everything in Pro, plus:', 'truck|Delivery routes and a driver for each run', 'branch|2 branches included, each with its own drawer and stock · more for ₱490 each a month', 'chart|Market price check against other shops', 'badge|Setup by the Nifti team and priority help', 'users|Up to 30 people · more for ₱99 each a month']});
  }
  if(typeof PRO_PLANS !== 'undefined' && PRO_PLANS.business){ PRO_PLANS.business.features = ['Up to 30 people (more for ₱99 each a month)', 'Delivery routes and drivers', '2 branches included (more for ₱490 each a month)', 'Verified badge (green ✔) included', 'Priority support: we reply first', 'Free done-for-you setup on yearly']; }
  if(typeof FREE_PLAN_FEATURES !== 'undefined' && Array.isArray(FREE_PLAN_FEATURES) && !FREE_PLAN_FEATURES.some(x => /Collect today/.test(x))){ FREE_PLAN_FEATURES.unshift('Collect today, payment reminders and a pay link for every customer', 'Due dates, utang limits and who pays late', 'Purchase history and supplier records'); }
}catch(e){ console.warn('nf82 plans', e); }
