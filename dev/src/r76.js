/* ===== Round 76: founder feedback pass 5 ===== */
function nf76E(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
function nf76P(n){ const v = Math.round(Number(n) || 0); return (v < 0 ? '−₱' : '₱') + Math.abs(v).toLocaleString('en-PH'); }
function nf76Ic(d, s){ return `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`; }

/* ---------- 1. Home owner view: margin in green or red only, a ₱100 split instead of the ring, bigger costs ---------- */
if(typeof nf75OwnerHtml === 'function'){
  const _o = nf75OwnerHtml;
  nf75OwnerHtml = function(){
    let html = _o.apply(this, arguments);
    try{
      const m = bkMonth(APP_TODAY), p = bkPnl(m), sales = Number(p.sales) || 0, spend = (Number(p.cost) || 0) + (Number(p.expenses) || 0), profit = sales - spend, margin = sales ? profit / sales * 100 : null;
      const tone = margin == null ? 'n' : margin < 0 ? 'r' : 'g', keep = margin == null ? 0 : Math.round(margin), cost = 100 - keep;
      const split = margin == null ? '<small>Shows once you record a sale</small>' : `<div class="nf76-split" role="img" aria-label="Of every 100 pesos sold, ${Math.max(0, cost)} pesos went to costs and ${keep} pesos was kept"><div class="bar"><i class="c" style="width:${Math.min(100, Math.max(0, cost))}%"></i><i class="k t-${tone}" style="width:${Math.min(100, Math.max(0, keep))}%"></i></div><div class="lg"><span><i class="c"></i>₱${Math.max(0, Math.min(100, cost))} costs</span><span><i class="k t-${tone}"></i>₱${keep} ${keep < 0 ? 'lost' : 'kept'}</span></div><small>out of every ₱100 you sell</small></div>`;
      const box = `<button type="button" class="nf74-ot nf75-mg nf76-mg t-${tone}" onclick="go('profit')"><span class="lb">You keep</span><div class="nf76-mgb"><b>${margin == null ? '—' : margin.toFixed(1) + '%'}</b><span class="u">profit margin</span></div>${split}<i class="go" aria-hidden="true">›</i></button>`;
      html = html.replace(/<button type="button" class="nf74-ot nf75-mg[\s\S]*?<i class="go" aria-hidden="true">›<\/i><\/button>/, box);
    }catch(e){}
    return html;
  };
  window.nf75OwnerHtml = nf75OwnerHtml;
  if(typeof nf72OwnerHtml === 'function'){ nf72OwnerHtml = nf75OwnerHtml; window.nf72OwnerHtml = nf75OwnerHtml; }
}

/* ---------- 2. Walk-in sales: the day in two sum boxes, the breakdown table, plain notes ---------- */
const NF76_PAY = {Cash: 'cash', GCash: 'gcash', Maya: 'maya', Utang: 'utang', Bank: 'bank', Card: 'card', Other: 'other', cash: 'cash', gcash: 'gcash', maya: 'maya', credit: 'utang', bank: 'bank', card: 'card'};
function nf76PayChip(k){ const c = NF76_PAY[k] || 'other', l = {cash: 'Cash', gcash: 'GCash', maya: 'Maya', utang: 'Utang', bank: 'Bank', card: 'Card', other: 'Other'}[c]; return `<span class="nf76-pay p-${c}">${l}</span>`; }
if(typeof nf74DaySummary === 'function'){
  nf74DaySummary = function(sales, pays, tot, lines, salesTotal){
    const list = Object.entries(pays || {}).sort((a, b) => b[1] - a[1]), kept = (tot.revenue || 0) - (tot.cost || 0);
    return `<div class="nf76-day">
      <div class="nf76-sum"><b class="h">How they paid</b>${list.length ? list.map(([k, v]) => `<div class="r">${nf76PayChip(k)}<span>${nf76P(v)}</span></div>`).join('') : '<div class="r"><span>No sales yet</span></div>'}<div class="t"><span>Total · ${sales.length} sale${sales.length === 1 ? '' : 's'}</span><b>${nf76P(salesTotal)}</b></div></div>
      <div class="nf76-sum ${kept < 0 ? 'neg' : 'pos'}"><b class="h">${kept < 0 ? 'Lost before expenses' : 'Kept before expenses'}</b><div class="r"><span class="k">Sold</span><span>${nf76P(tot.revenue)}</span></div><div class="r"><span class="k">− What the items cost</span><span>${nf76P(tot.cost)}</span></div><div class="t"><span>${kept < 0 ? 'Lost' : 'Kept'}</span><b>${nf76P(kept)}</b></div></div>
    </div>`;
  };
  window.nf74DaySummary = nf74DaySummary;
}
function nf76Detail(head, summary, lines, other, unitemized){
  const KIND = {sold: 'Sold', delivered: 'Delivered to a customer', count: 'Counted', bad: 'Damaged or expired', adjust: 'Changed by hand', returned_in: 'Returned to stock', received: 'Received from a supplier'};
  const look = [];
  (other || []).filter(m => m.kind === 'count' && Number(m.qty) < 0).forEach(m => look.push(`<b>${nf76E(m.item)}</b>: ${Math.abs(Number(m.qty))} short in the count${m.by ? ' (counted by ' + nf76E(m.by) + ')' : ''}.`));
  (other || []).filter(m => m.kind === 'count' && Number(m.qty) > 0).forEach(m => look.push(`<b>${nf76E(m.item)}</b>: ${Number(m.qty)} more than the records in the count.`));
  (other || []).filter(m => m.kind === 'bad').forEach(m => look.push(`<b>${nf76E(m.item)}</b>: ${Math.abs(Number(m.qty))} marked damaged${m.by ? ' by ' + nf76E(m.by) : ''}.`));
  if((unitemized || []).length) look.push(`${unitemized.length} sale${unitemized.length > 1 ? 's have' : ' has'} no items, so ${unitemized.length > 1 ? 'they' : 'it'} can't be matched to stock.`);
  const est = (lines || []).filter(l => l.costEst).length; if(est) look.push(`${est} item${est > 1 ? 's' : ''} had no cost saved; today's cost was used.`);
  const T = (lines || []).reduce((a, l) => ({qty: a.qty + l.qty, cost: a.cost + l.costTotal, total: a.total + l.total}), {qty: 0, cost: 0, total: 0});
  const itemized = (lines || []).length ? `<h3 class="nf76-h">Every item sold</h3><div class="nf76-tw"><table class="nf76-t" data-nf-card="1"><thead><tr><th class="t">Item</th><th class="n">Qty</th><th class="n">Original price</th><th class="n">Price now</th><th class="n">Cost per unit</th><th class="n">Total cost</th><th class="n">Total</th><th>Customer · paid by</th></tr></thead><tbody>${lines.map(l => { const disc = l.list && l.unit < l.list;
      return `<tr><td class="t"><b>${nf76E(l.name)}</b>${l.by ? `<small>by ${nf76E(l.by)}</small>` : ''}</td><td class="n">${l.qty}</td><td class="n">${l.list ? nf76P(l.list) : nf76P(l.unit)}</td><td class="n ${disc ? 'disc' : ''}">${nf76P(l.unit)}${disc ? `<small>−${nf76P((l.list - l.unit) * l.qty)}</small>` : ''}</td><td class="n">${l.cost ? nf76P(l.cost) : '<small>not saved</small>'}</td><td class="n">${l.cost ? nf76P(l.costTotal) : '—'}</td><td class="n"><b>${nf76P(l.total)}</b></td><td><span class="cu">${nf76E(l.customer)}</span>${nf76PayChip(l.pay)}</td></tr>`; }).join('')}</tbody>
      <tfoot><tr><td class="t">Total</td><td class="n">${T.qty}</td><td></td><td></td><td></td><td class="n">${nf76P(T.cost)}</td><td class="n">${nf76P(T.total)}</td><td></td></tr></tfoot></table></div>` : '';
  const stock = `<section class="nf76-other"><h3 class="nf76-h">Other stock changes <small>not from sales</small></h3>${(other || []).length ? `<div class="nf76-tw"><table class="nf76-t" data-nf-card="1"><thead><tr><th class="t">Item</th><th class="t">What happened</th><th class="n">Change</th><th class="t">Reason</th><th>By</th></tr></thead><tbody>${other.map(m => `<tr><td class="t"><b>${nf76E(m.item || '—')}</b></td><td class="t">${nf76E(KIND[m.kind] || m.kind || '—')}</td><td class="n ${Number(m.qty) < 0 ? 'neg' : 'pos'}">${Number(m.qty) > 0 ? '+' : ''}${Number(m.qty) || 0}</td><td class="t">${nf76E(m.reason || '—')}</td><td>${nf76E(m.by || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="nf76-none">No other changes today.</p>'}</section>`;
  const looks = `<section class="nf76-look"><h3 class="nf76-h">Worth a second look</h3>${look.length ? `<ul>${look.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p class="nf76-none">Nothing stands out today.</p>'}</section>`;
  return '<section class="panel-card nf70-cash-detail">' + head + summary + itemized + stock + looks + '</section>';
}

/* ---------- 3. Getting paid: the totals add up, shown under each side (orders + shop utang = owed to you) ---------- */
if(typeof nf73HalfSum === 'function'){ const _hs = nf73HalfSum; nf73HalfSum = function(page, side){ if(page === 'collections') return ''; return _hs.apply(this, arguments); }; window.nf73HalfSum = nf73HalfSum; }
function nf76PaidTotals(){
  const pg = document.querySelector('#page-collections.active'); if(!pg) return;
  const halves = {supplier: pg.querySelector('.nf-half-supplier > .nf-half-b'), buyer: pg.querySelector('.nf-half-buyer > .nf-half-b')};
  try{
    if(halves.supplier){
      const inv = unpaidInvoicesFor('supplier'), invAmt = inv.reduce((a, r) => a + (r.balance || 0), 0), invWho = new Set(inv.map(r => r.po && r.po.buyerName).filter(Boolean));
      const ut = bkLiveSales().filter(s => bkSaleBalance(s) > 0), utAmt = ut.reduce((a, s) => a + bkSaleBalance(s), 0), utWho = [...new Set(ut.map(s => s.customer).filter(Boolean))];
      const html = `<div class="nf76-tot"><b class="h">Where ${nf76P(invAmt + utAmt)} comes from</b>
        <div class="r"><span>Delivery orders not paid yet<small>${invWho.size} customer${invWho.size === 1 ? '' : 's'}${invWho.size ? ': ' + nf76E([...invWho].slice(0, 3).join(', ')) : ''}</small></span><b>${nf76P(invAmt)}</b></div>
        <div class="r"><span>Shop utang from Walk-in sales<small>${utWho.length ? nf76E(utWho.slice(0, 3).join(', ')) : 'none'} · <button type="button" class="nf43-link" onclick="go('sales')">see it</button></small></span><b>${nf76P(utAmt)}</b></div>
        <div class="t"><span>Owed to you</span><b>${nf76P(invAmt + utAmt)}</b></div></div>`;
      nf76Put(halves.supplier, 'nf76TotS', html);
    }
    if(halves.buyer){
      const rows = unpaidInvoicesFor('buyer'), amt = rows.reduce((a, r) => a + (r.balance || 0), 0), who = new Set(rows.map(r => r.po && r.po.supplierName).filter(Boolean)), next = rows.filter(r => r.due && r.daysOverdue <= 0).map(r => r.due).sort()[0], late = rows.filter(r => r.daysOverdue > 0).length;
      const html = `<div class="nf76-tot b"><b class="h">What you owe suppliers</b>
        <div class="r"><span>Bills not paid yet<small>${who.size} supplier${who.size === 1 ? '' : 's'}${who.size ? ': ' + nf76E([...who].slice(0, 3).join(', ')) : ''}</small></span><b>${nf76P(amt)}</b></div>
        <div class="t"><span>${late ? late + ' late' : next ? 'Next due ' + new Date(next + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}) : 'You owe'}</span><b>${nf76P(amt)}</b></div></div>`;
      nf76Put(halves.buyer, 'nf76TotB', html);
    }
  }catch(e){}
}
function nf76Put(host, id, html){ let el = host.querySelector('#' + id); if(el && el.dataset.k === html && el === host.lastElementChild) return; if(!el){ el = document.createElement('div'); el.id = id; } if(el.dataset.k !== html){ el.dataset.k = html; el.innerHTML = html; } if(host.lastElementChild !== el) host.appendChild(el); }
NF45_AFTER.push(() => { try{ nf76PaidTotals(); }catch(e){} });

/* ---------- 4. Expenses: one breakdown card (total once, a ring, then every kind with its bar) ---------- */
function nf76ExpRange(from, to){ try{ return (BK.expenses || []).filter(e => !e.deletedAt && (e.status || 'approved') === 'approved' && e.date >= from && e.date <= to).filter(e => { const c = bkCat(e.category); return !c.transfer && !c.drawing && !c.cogs; }).reduce((a, e) => a + (Number(e.amount) || 0), 0); }catch(e){ return 0; } }
function nf76Where(cats, m, un){
  const total = cats.reduce((a, [, v]) => a + (Number(v) || 0), 0); if(!total) return '';
  const COL = ['#2563EB', '#16A34A', '#7C3AED', '#0891B2', '#DB2777', '#4F46E5', '#64748B'];
  const top = cats.slice(0, 6), rest = cats.slice(6).reduce((a, [, v]) => a + v, 0); if(rest > 0) top.push(['Everything else', rest]);
  const spikes = {}; ((un && un.spikes) || []).forEach(x => { spikes[x.cat] = x.pct; });
  const mon = new Date(m + '-01T00:00:00').toLocaleDateString('en-PH', {month: 'long', year: 'numeric'});
  let cmp = '';
  try{ const R = nf74SameRange(m), prev = nf76ExpRange(R.from, R.to); if(prev > 0){ const d = Math.round((total - prev) / prev * 100); cmp = d === 0 ? `<span class="nf76-cmp z">Same as ${nf76E(R.label)}</span>` : `<span class="nf76-cmp ${d < 0 ? 'g' : 'r'}">${d < 0 ? '▼' : '▲'} ${Math.abs(d)}% ${d < 0 ? 'lower' : 'higher'} than ${nf76E(R.label)}</span>`; } }catch(e){}
  const R = 52, C = 2 * Math.PI * R; let off = 0;
  const arcs = top.map(([k, v], i) => { const len = v / total * C, gap = top.length > 1 ? 2 : 0; const a = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${COL[i % COL.length]}" stroke-width="20" stroke-dasharray="${Math.max(0, len - gap).toFixed(2)} ${(C - Math.max(0, len - gap)).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 70 70)"><title>${nf76E(k)}: ${nf76P(v)}</title></circle>`; off += len; return a; }).join('');
  const days = Math.max(1, m === String(APP_TODAY).slice(0, 7) ? Number(String(APP_TODAY).slice(8, 10)) : new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate());
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<section class="panel-card nf76-where"><div class="panel-head"><h2>Where the money went</h2></div>
    <div class="nf76-wtop"><div><small>${nf76E(mon)} · ${top.length} kind${top.length === 1 ? '' : 's'} of expense</small><b>${nf76P(total)}</b><span>about ${nf76P(total / days)} a day</span></div>${cmp}</div>
    <div class="nf76-wb"><div class="nf76-ring"><svg viewBox="0 0 140 140" role="img" aria-label="Share of spending by kind"><circle cx="70" cy="70" r="${R}" fill="none" stroke="#F2F4F7" stroke-width="20"/>${arcs}</svg><div class="c"><b>${Math.round(top[0][1] / total * 100)}%</b><small>${nf76E(top[0][0])}</small></div></div>
      <div class="nf76-wl">${top.map(([k, v], i) => { const pc = Math.round(v / total * 100); return `<button type="button" class="it" style="--c:${COL[i % COL.length]}" ${k === 'Everything else' ? 'disabled' : `onclick="bkExpFilter='${esc(k)}'; renderExpensesPage()"`}><span class="top"><i></i><b>${nf76E(k)}</b>${spikes[k] ? `<em>▲ ${spikes[k]}% vs usual</em>` : ''}<span class="sp"></span><strong>${nf76P(v)}</strong></span><span class="bar"><u style="width:${Math.max(2, pc)}%"></u></span><span class="pc">${pc}%</span></button>`; }).join('')}</div></div>
    <p class="nf76-wn">Tap a kind to see only its expenses.</p></section>`;
}
if(typeof nf74Where === 'function'){ nf74Where = nf76Where; window.nf74Where = nf76Where; }

/* ---------- 5. Deliveries: no rider banner; the ready box picks the rider right there; orders only; bigger board ---------- */
function nf76ReadyBox(){
  const ready = nf75Ready(); if(!ready.length) return '';
  const team = nf75Team().filter(m => m.status !== 'removed' && m.status !== 'invited'), cur = (nf75Rider() || {}).member || (team.find(m => /driver/i.test((m.roles || []).join(' '))) || team.find(m => /Mark/.test(m.name)) || team[0] || {}).id;
  const tot = ready.reduce((a, p) => a + (typeof poTotal === 'function' ? poTotal(p) : 0), 0);
  return `<div class="nf76-ready"><div class="top"><span class="ic">${nf76Ic('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>', 24)}</span><div><b>${ready.length} order${ready.length === 1 ? '' : 's'} ready to go out</b><span>${nf76P(tot)} worth of goods</span></div></div>
    <div class="list">${ready.map(po => `<div class="o"><b>${nf76E(po.buyerName)}</b><span>Order ${nf76E(String(po.poNumber || '').replace(/^PO-\d{4}-/, ''))} · ${nf76E((po.lineItems || []).map(l => l.qty + ' × ' + l.product).slice(0, 2).join(', '))}</span></div>`).join('')}</div>
    <div class="go"><label><span>Rider</span><select id="nf76Rider">${team.map(m => `<option value="${nf76E(m.id)}" ${m.id === cur ? 'selected' : ''}>${nf76E(String(m.name).replace(/\s*\(You\)/, ''))}</option>`).join('')}</select></label><label><span>When</span><select id="nf76When"><option value="${APP_TODAY}">Today</option><option value="${addDaysIso(APP_TODAY, 1)}">Tomorrow</option></select></label><button type="button" class="btn btn-primary" onclick="nf76SendReady()">Send ${ready.length === 1 ? 'it' : 'all ' + ready.length}</button></div></div>`;
}
async function nf76SendReady(){
  const rider = (document.getElementById('nf76Rider') || {}).value, when = (document.getElementById('nf76When') || {}).value || APP_TODAY; if(!rider){ showToast('Pick a rider.', 'warn'); return; }
  const ready = nf75Ready(); if(!ready.length) return;
  if(await nf75AddStops(when, rider, ready.map(nf75StopFromPO))){
    try{ if(!nf75Rider() || nf75Rider().member !== rider) await bkSaveSettings({route_rider: {member: rider, period: 'always', from: APP_TODAY, until: null}}); }catch(e){}
    const n = (nf75Team().find(m => m.id === rider) || {}).name || 'the rider';
    showToast(`${ready.length} deliver${ready.length === 1 ? 'y' : 'ies'} sent to ${String(n).split(' ')[0]} for ${when === APP_TODAY ? 'today' : 'tomorrow'}.`, 'success'); renderRoutesPage();
  }
}
if(typeof nf75Board === 'function'){
  const _b = nf75Board;
  nf75Board = function(body, routes){
    _b.apply(this, arguments);
    try{
      const rider = body.querySelector('.nf75-rider'); if(rider) rider.remove();
      const old = body.querySelector('.nf75-ready'); const html = nf76ReadyBox();
      if(old){ if(html){ old.insertAdjacentHTML('afterend', html); } old.remove(); }
      else if(html){ const top = body.querySelector('.nf75-rtop'); if(top) top.insertAdjacentHTML('afterend', html); }
      // "+ Add a delivery" picks from orders only; hide it when nothing is ready
      const add = [...body.querySelectorAll('.nf75-racts button')].find(b => /Add a delivery/.test(b.textContent)); if(add && !nf75Ready().length) add.remove();
    }catch(e){}
  };
  window.nf75Board = nf75Board;
}
if(typeof nf75ADPaint === 'function'){
  const _p = nf75ADPaint;
  nf75ADPaint = function(){ NF75D.tab = 'order'; _p.apply(this, arguments); const box = document.getElementById('nf75ADBody'); if(box){ const seg = box.querySelector('.nf75-seg2'); if(seg) seg.remove(); } };
  window.nf75ADPaint = nf75ADPaint;
}

/* ---------- 6. Prices & profit: a tidy "who hears about it", a readable new-price box, supplier changes laid out cleanly ---------- */
if(typeof nf75PcWho === 'function'){
  nf75PcWho = function(){
    const box = document.getElementById('nf75PcWho'); if(!box) return; const bs = nf75PcBuyers(), picked = new Set(nf75PcPicked()), pick = NF75PC.aud === 'pick';
    const tot = bs.filter(b => picked.has(b.id)).reduce((a, b) => a + b.total, 0);
    box.innerHTML = `<div class="nf75-lbl">Who hears about it</div>
      <div class="nf76-aud" role="radiogroup">${[['top', 'Top 3 buyers'], ['all', 'All buyers (' + bs.length + ')'], ['pick', 'Pick buyers']].map(([k, l]) => `<button type="button" role="radio" aria-checked="${NF75PC.aud === k}" class="${NF75PC.aud === k ? 'on' : ''}" onclick="NF75PC.aud='${k}'; ${k === 'pick' ? 'if(!NF75PC.pick){ NF75PC.pick={}; nf75PcPicked0(); }' : ''} nf75PcWho(); nf75PcLive()">${l}</button>`).join('')}</div>
      <div class="nf76-buyers ${pick ? 'pick' : ''}">${bs.length ? `<div class="hd"><span>Buyer</span><span>Bought this year</span></div>` + bs.map(b => `<button type="button" class="b ${picked.has(b.id) ? 'on' : ''}" ${pick ? `onclick="NF75PC.pick['${b.id}']=!NF75PC.pick['${b.id}']; nf75PcWho(); nf75PcLive()"` : 'tabindex="-1" aria-disabled="true"'} aria-pressed="${picked.has(b.id)}"><span class="ck">${picked.has(b.id) ? '✓' : ''}</span><span class="nm">${nf76E(b.name)}</span><span class="am">${b.total ? nf76P(b.total) : '—'}</span></button>`).join('') : '<p class="nf45-sm">No buyers on Nifti yet.</p>'}</div>
      <p class="nf76-audsum">${picked.size ? `<b>${picked.size} buyer${picked.size === 1 ? '' : 's'}</b> will be told · ${nf76P(tot)} bought from you this year${NF75PC.aud !== 'all' ? '. Everyone else sees the new price on the start date.' : '.'}` : 'Pick at least one buyer.'}</p>`;
  };
  window.nf75PcWho = nf75PcWho;
}
if(typeof nf75Composer === 'function'){
  const _c = nf75Composer;
  nf75Composer = function(el){ _c.apply(this, arguments); try{ el.querySelectorAll('.nf75-pci .in input').forEach(i => { i.placeholder = 'New'; }); }catch(e){} };
  window.nf75Composer = nf75Composer;
}
renderIncomingPrices = async function(el){
  const list = await loadIncomingPrices(), upcoming = list.filter(x => x.effective_date > APP_TODAY), recent = list.filter(x => x.effective_date <= APP_TODAY && x.effective_date >= addDaysIso(APP_TODAY, -14));
  const day = d => new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'});
  const row = x => { const up = x.old_price != null && Number(x.new_price) > Number(x.old_price), pct = x.old_price ? Math.round((x.new_price - x.old_price) / x.old_price * 1000) / 10 : null, future = x.effective_date > APP_TODAY;
    return `<div class="nf76-inc ${up ? 'r-up' : 'r-dn'}"><div class="nm"><b>${nf76E(x.product)}</b><small>${nf76E(x.supplier_name)}</small><span class="when ${future ? 'f' : 'p'}">${future ? 'Starts ' : 'Since '}${nf76E(day(x.effective_date))}</span></div>
      <div class="pr"><div class="ov"><span><small>Was</small><b class="old">${x.old_price != null ? nf76P(x.old_price) : '—'}</b></span><i aria-hidden="true">→</i><span><small>New</small><b>${nf76P(x.new_price)}</b></span></div>${x.unit ? `<small class="u">per ${nf76E(x.unit)}</small>` : ''}</div>
      ${pct != null ? `<span class="pct">${up ? '▲' : '▼'} ${Math.abs(pct)}%</span>` : '<span></span>'}</div>`; };
  const ups = upcoming.filter(x => x.old_price != null && Number(x.new_price) > Number(x.old_price));
  el.innerHTML = `${ups.length ? `<div class="nf75-incb"><span class="ic">${nf76Ic('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>', 22)}</span><div><b>${ups.length} price increase${ups.length > 1 ? 's start' : ' starts'} ${nf76E(day(ups.map(x => x.effective_date).sort()[0]))}</b><span>Order before then to keep today's price.</span></div></div>` : ''}
    <div class="nf75-lbl">Coming up</div>${upcoming.length ? upcoming.map(row).join('') : '<p class="nf75-none">No price changes announced.</p>'}
    <div class="nf75-lbl">Last 2 weeks</div>${recent.length ? recent.map(row).join('') : '<p class="nf75-none">No changes in the last 2 weeks.</p>'}`;
};
window.renderIncomingPrices = renderIncomingPrices;

/* ---------- 7. To check: what to do as a checklist, an Assign task button, recount with before/after and a day you can open ---------- */
function nf76Steps(t){ return String(t || '').split(/(?<=\.)\s+/).map(s => s.trim().replace(/\.$/, '')).filter(Boolean); }
if(typeof renderIssuesPage === 'function'){
  const _ri = renderIssuesPage;
  renderIssuesPage = async function(){
    const r = await _ri.apply(this, arguments);
    try{
      document.querySelectorAll('#issBody .nf75-ic').forEach(card => {
        if(card.dataset.r76) return; card.dataset.r76 = '1';
        const nx = card.querySelector('.next'); if(nx && /^What to do:/.test(nx.textContent)){ const steps = nf76Steps(nx.textContent.replace(/^What to do:\s*/, '')); const box = document.createElement('div'); box.className = 'nf76-todo'; box.innerHTML = `<span class="h">What to do</span><ul>${steps.map(s => `<li>${nf76Ic('<path d="M20 6 9 17l-5-5"/>', 16)}<span>${nf76E(s)}</span></li>`).join('')}</ul>`; nx.replaceWith(box); }
        const sel = card.querySelector('.nf75-give'); if(sel){ const given = /^Given to /.test(sel.options[0].textContent); sel.options[0].textContent = given ? sel.options[0].textContent.replace(/^Given to /, 'Assigned to ') : 'Assign task'; sel.classList.add(given ? 'given' : 'assign'); }
        const who = card.querySelector('.top .who'); if(who) who.textContent = who.textContent.replace(/ is on it$/, ' is on it');
      });
    }catch(e){}
    return r;
  };
  window.renderIssuesPage = renderIssuesPage;
}
// recount: every change shows before and after; tap a day to see why it moved
function nf76ItemHistory(name){
  const item = (inventoryData || []).find(x => x.name === name); if(!item) return [];
  const mv = (BK.moves || []).filter(x => x.item === name).slice().sort((a, b) => String(b.at || b.date).localeCompare(String(a.at || a.date)));
  let run = Number(item.onHand) || 0; return mv.map(x => { const after = run, before = run - (Number(x.qty) || 0); run = before; return Object.assign({}, x, {before, after}); });
}
if(typeof nf75Recount === 'function'){
  nf75Recount = function(fp){
    const id = String(fp).replace(/^stock:/, ''), mv0 = (BK.moves || []).find(x => String(x.id) === id), name = mv0 ? mv0.item : '';
    const item = (inventoryData || []).find(x => x.name === name); if(!item){ showToast('That item is no longer in Stock.', 'warn'); return; }
    const hist = nf76ItemHistory(name).filter(x => x.date >= addDaysIso(APP_TODAY, -14));
    const days = [...new Set(hist.map(x => x.date))];
    const KIND = {sold: 'Sold', delivered: 'Delivered', count: 'Counted', bad: 'Damaged', adjust: 'Changed by hand', returned_in: 'Returned', received: 'Received'};
    const unit = item.unit || '';
    nf45Pop('nf75Rc', 'Recount ' + nf76E(name), `<div class="nf75-rc"><div class="big"><span><small>Nifti expects now</small><b>${Number(item.onHand) || 0}</b><em>${nf76E(unit)}</em></span>${mv0 && mv0.kind === 'count' ? `<span class="miss"><small>Last count was short</small><b>${Math.abs(Number(mv0.qty) || 0)}</b><em>${nf76E(nf75Day(mv0.date))} · ${nf76E(mv0.by || '')}</em></span>` : ''}</div>
        <label class="nf75-lbl" for="nf75RcQ">How many are on the shelf now?</label><div class="nf75-rcq"><button type="button" onclick="const i=document.getElementById('nf75RcQ'); i.value=Math.max(0,(Number(i.value)||0)-1)">−</button><input id="nf75RcQ" inputmode="numeric" value="${Number(item.onHand) || 0}"><button type="button" onclick="const i=document.getElementById('nf75RcQ'); i.value=(Number(i.value)||0)+1">+</button></div>
        <div class="nf75-lbl">What moved, day by day <small>· tap a day to see why</small></div>${days.length ? `<div class="nf76-days">${days.map(d => { const xs = hist.filter(x => x.date === d), start = xs[xs.length - 1].before, end = xs[0].after, net = end - start;
          return `<button type="button" class="d" onclick="nf76DayWhy(${JSON.stringify(name).replace(/"/g, '&quot;')}, '${d}')"><span class="dt">${nf76E(nf75Day(d))}</span><span class="what">${nf76E([...new Set(xs.map(x => KIND[x.kind] || x.kind))].join(', '))}</span><span class="ba"><b>${start}</b><i>→</i><b>${end}</b></span><em class="${net < 0 ? 'neg' : net > 0 ? 'pos' : ''}">${net > 0 ? '+' : ''}${net}</em><span class="go">›</span></button>`; }).join('')}</div>` : '<p class="nf45-sm">No changes in the last 2 weeks.</p>'}
        <p class="nf45-sm">Each day shows the count at the start and the end of that day.</p></div>`,
      `<button type="button" class="btn btn-outline" onclick="slClose('nf75Rc')">Cancel</button><button type="button" class="btn btn-primary" onclick="nf75RecountSave(${JSON.stringify(name).replace(/"/g, '&quot;')})">Save the count</button>`);
  };
  window.nf75Recount = nf75Recount;
}
function nf76DayWhy(name, d){
  const xs = nf76ItemHistory(name).filter(x => x.date === d).reverse(); if(!xs.length) return;
  const KIND = {sold: 'Sold at the counter', delivered: 'Delivered to a customer', count: 'Stock count', bad: 'Marked damaged', adjust: 'Changed by hand', returned_in: 'Returned to stock', received: 'Received from a supplier'};
  const sales = (BK.sales || []).filter(s => s.date === d && !s.voidedAt).flatMap(s => (s.lines || []).filter(l => l.product === name).map(l => ({s, l})));
  const label = new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'long', month: 'short', day: 'numeric'});
  nf45Pop('nf76Why', nf76E(name) + ' · ' + nf76E(label), `<div class="nf76-why"><div class="sum"><span><small>Start of day</small><b>${xs[0].before}</b></span><i>→</i><span><small>End of day</small><b>${xs[xs.length - 1].after}</b></span></div>
      <ol class="steps">${xs.map(x => { const q = Number(x.qty) || 0; return `<li class="${q < 0 ? 'neg' : 'pos'}"><span class="t">${x.at ? nf76E(new Date(x.at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila'})) : ''}</span><div><b>${nf76E(KIND[x.kind] || x.kind)}</b><small>${nf76E(x.reason || '')}${x.by ? ' · by ' + nf76E(x.by) : ''}</small></div><span class="ba">${x.before} → ${x.after}</span><em>${q > 0 ? '+' : ''}${q}</em></li>`; }).join('')}</ol>
      ${sales.length ? `<div class="nf75-lbl">Sales of ${nf76E(name)} that day</div><div class="nf76-ws">${sales.map(({s, l}) => `<div><span>${s.at ? nf76E(new Date(s.at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila'})) : ''}</span><b>${Number(l.qty) || 0} sold</b><span>${nf76E(s.customer || 'Walk-in')} · ${nf76E(s.by || '')}</span></div>`).join('')}</div>` : ''}</div>`,
    `<button type="button" class="btn btn-primary" onclick="slClose('nf76Why')">Back</button>`);
}

/* ---------- 8. Monthly summary tabs drawn styled at once; date pickers that open; Follow-ups messages stand out; Viber that opens ---------- */
function nf76LgTabsHtml(){
  const sub = {summary: ['At a glance', 'Profit, costs, the month at a glance', '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/>'], bs: ['What you own and owe', 'Cash, stock, who owes, what you owe', '<path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0z"/>'], gl: ['Every peso (ledger)', 'Every peso in and out, line by line', '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>']};
  return `<div class="lens-tabs lg-tabs nf75-lgt" data-nf75="1" role="tablist">${LG_TABS.map(([k, l]) => { const s = sub[k]; return `<button role="tab" aria-selected="${LGV.tab === k}" class="${LGV.tab === k ? 'on' : ''}" onclick="LGV.tab='${k}'; renderLedgerPage()">${s ? `${nf76Ic(s[2], 22)}<span><b>${s[0]}</b><small>${s[1]}</small></span>` : nf76E(l)}</button>`; }).join('')}</div>`;
}
// "Pick a date" opens the calendar on any click (not only on the small icon)
document.addEventListener('click', e => {
  const lab = e.target && e.target.closest ? e.target.closest('.nf75-dpick') : null; if(!lab) return;
  const inp = lab.querySelector('input[type="date"]'); if(!inp) return;
  e.preventDefault(); try{ if(typeof inp.showPicker === 'function'){ inp.showPicker(); return; } }catch(err){} inp.focus(); inp.click();
}, true);
// Follow-ups: a customer's own words get a chat-bubble colour; order details stay grey
function nf76FuMsgs(){
  document.querySelectorAll('#page-followups .nf45-fum > small').forEach(s => { const msg = /^[“"]/.test((s.textContent || '').trim()); if(s.classList.contains('nf76-msg') !== msg) s.classList.toggle('nf76-msg', msg); });
}
NF45_AFTER.push(() => { try{ nf76FuMsgs(); }catch(e){} });
// Viber: open by a real link tap, keep the message copied, and say plainly what to do if it didn't open
if(typeof nf75MsgViber === 'function'){
  nf75MsgViber = async function(){
    const it = window._nf75It; const t = nf75MsgText(); if(!it || !t){ showToast('Type a message first.', 'warn'); return; }
    let copied = false; try{ await navigator.clipboard.writeText(t); copied = true; }catch(e){ try{ copyText(t); copied = true; }catch(e2){} }
    const ph = nf75Phone63(nf75ItemPhone(it)), mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    const url = ph ? `viber://chat?number=${encodeURIComponent(ph)}${mobile ? '&draft=' + encodeURIComponent(t) : ''}` : `viber://forward?text=${encodeURIComponent(t)}`;
    const a = document.createElement('a'); a.href = url; a.rel = 'noopener'; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 1000);
    const again = (document.getElementById('nf75MsgAgain') || {}).checked;
    try{ if(it.k === 'lead' || it.k === 'lost') await fuPatchLead(it.id, Object.assign({touches: ((it.l || {}).touches || 0) + 1, last_contact_at: new Date().toISOString()}, again ? {next_follow_up: addDaysIso(APP_TODAY, 2)} : {}), 'Sent a message on Viber'); }catch(e){}
    const m = document.querySelector('#nf75Msg .nf75-cm'); if(m){ m.innerHTML = `<div class="nf76-sent"><span class="ic">${nf76Ic('<path d="M20 6 9 17l-5-5"/>', 26)}</span><div><b>Viber is opening${ph ? ' the chat with ' + nf76E(String(it.name).split(' ')[0]) : ''}.</b><span>${mobile ? 'Your message is already typed in. Tap Send in Viber.' : 'Your message is copied. In Viber, paste it (Ctrl+V) and press Send.'}</span></div></div>
      <div class="nf76-ifnot"><b>Viber didn't open?</b><span>Viber needs to be installed on this ${mobile ? 'phone' : 'computer'}. ${copied ? 'The message is copied, so you can paste it into Viber, SMS or Messenger.' : ''}${ph ? ` Their number: <b>${nf76E(ph)}</b>` : ''}</span><button type="button" class="btn btn-outline" onclick="nf75MsgCopy()">Copy the message again</button></div><textarea id="nf75MsgT" hidden>${nf76E(t)}</textarea>`; }
    const vb = document.querySelector('#nf75Msg .nf75-viber'), foot = vb && vb.parentElement; if(foot) foot.innerHTML = `<button type="button" class="btn btn-primary" onclick="slClose('nf75Msg'); try{ renderFollowupsPage(); }catch(e){}">Done</button>`;
  };
  window.nf75MsgViber = nf75MsgViber;
}

/* ---------- 9. BIR 2307 fill-in helper: tidy header, type in what's missing (or ask them), and a signing section ---------- */
const NF76W = {w: null, cp: null, q: null, mine: null};
function nf76WsField(who, key, label, val, ph){
  const v = String(val || '').trim();
  return `<div class="nf76-wf${v ? '' : ' empty'}"><span class="l">${label}</span><input type="text" data-who="${who}" data-k="${key}" value="${nf76E(v)}" placeholder="${nf76E(ph)}" oninput="nf76WsDirty('${who}')" aria-label="${nf76E(label)}"></div>`;
}
function nf76WsDirty(who){ const b = document.getElementById('nf76WsAct_' + who); if(b) b.classList.add('on'); }
async function nf76WsSaveMine(){
  if(typeof requirePermission === 'function' && !requirePermission('manageAccount')) return;
  const get = k => { const i = document.querySelector(`#statementView input[data-who="me"][data-k="${k}"]`); return i ? i.value.trim() : ''; };
  const p = getMyTaxProfile(); if(get('name')) p.businessName = get('name'); p.tin = get('tin'); p.registeredAddress = get('address');
  try{ scheduleNiftiSave(); }catch(e){}
  if(myBusiness){ const { error } = await sb.from('tax_profiles').upsert({business_id: myBusiness.id, business_name: p.businessName || myBusiness.name, tin: p.tin || null, registered_address: p.registeredAddress || null}, {onConflict: 'business_id'}); if(error){ showToast(error.message, 'error'); return; } }
  const b = document.getElementById('nf76WsAct_me'); if(b){ b.classList.remove('on'); }
  showToast('Saved to your business details. It fills in by itself next time.', 'success');
}
function nf76WsAsk(){
  const r = NF76W.row || {}; const me = myBusiness ? myBusiness.name : (getMyTaxProfile().businessName || 'us');
  const miss = ['tin', 'address'].filter(k => { const i = document.querySelector(`#statementView input[data-who="them"][data-k="${k}"]`); return !i || !i.value.trim(); }).map(k => k === 'tin' ? 'TIN' : 'registered address');
  const text = `Hi ${r.counterparty || ''}! This is ${me}. For your BIR Form 2307 (${String(NF76W.q).replace('-', ' ')}), may we have your ${miss.length ? miss.join(' and ') : 'TIN and registered address'}? We'll put it on the form. Salamat po!`;
  let sent = false; try{ if(getConversations().find(c => c.id === NF76W.cp)) sent = sendTextInChat(NF76W.cp, text); }catch(e){}
  if(sent){ showToast('Asked them in your Nifti chat.', 'success'); return; }
  try{ navigator.clipboard.writeText(text); }catch(e){ try{ copyText(text); }catch(e2){} }
  showToast('Message copied. Paste it in Viber or SMS to ask them.', 'success');
}
async function nf76Worksheet(cpId, quarter){
  let w; const role = currentAppRole, mineIsPayee = role === 'supplier';
  const row = (taxFormsCache || []).find(x => x.counterparty_id === cpId && x.quarter === quarter && (!x.role || x.role === role)) || (taxFormsCache || []).find(x => x.counterparty_id === cpId && x.quarter === quarter);
  if(myBusiness){
    const { data, error } = await sb.rpc('form2307_worksheet', {p_counterparty: cpId, p_quarter: quarter});
    if(error){ showToast(error.message, 'error'); return; } w = data;
  } else {
    if(!row) return; const byAtc = {};
    (row.lines || []).forEach(l => { const a = byAtc[l.atc] || (byAtc[l.atc] = {atc: l.atc, rate: l.rate, m1: 0, m2: 0, m3: 0, total: 0, tax: 0}); a['m' + l.month] += Number(l.base || 0); a.total += Number(l.base || 0); a.tax += Number(l.tax || 0); });
    const [y, qq] = quarter.split('-Q'), tp = getMyTaxProfile();
    const me = {name: tp.businessName, tin: tp.tin, address: tp.registeredAddress}, them = {name: row.counterparty, tin: '', address: ''};
    w = {quarter, period_from: `${y}-${String(Number(qq) * 3 - 2).padStart(2, '0')}-01`, period_to: new Date(Number(y), Number(qq) * 3, 0).niftiDay ? new Date(Number(y), Number(qq) * 3, 0).niftiDay() : `${y}-${String(Number(qq) * 3).padStart(2, '0')}-30`, payee: mineIsPayee ? me : them, payor: mineIsPayee ? them : me, rows: Object.values(byAtc)};
  }
  NF76W.w = w; NF76W.cp = cpId; NF76W.q = quarter; NF76W.row = row;
  const [y, qq] = quarter.split('-Q');
  const months = [1, 2, 3].map(i => new Date(Number(y), (Number(qq) - 1) * 3 + i - 1, 1).toLocaleDateString('en-PH', {month: 'short'}));
  const rows = w.rows || [], tot = rows.reduce((s, r) => ({base: s.base + Number(r.total || 0), tax: s.tax + Number(r.tax || 0)}), {base: 0, tax: 0});
  const party = (part, label, p, who) => {
    const missing = !String(p.tin || '').trim() || !String(p.address || '').trim();
    const act = who === 'me' ? `<button type="button" id="nf76WsAct_me" class="btn btn-primary btn-sm nf76-ws-save nf76-noprint" onclick="nf76WsSaveMine()">Save to my business details</button>`
      : (missing ? `<button type="button" class="btn btn-outline btn-sm nf76-noprint" onclick="nf76WsAsk()">${nf76Ic('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z"/>', 16)}Ask them for it</button>` : '');
    return `<div class="nf76-wp ${who}"><div class="h"><span class="pt">${part}</span><b>${label}</b><em>${who === 'me' ? 'You' : 'Them'}</em></div>
      ${nf76WsField(who, 'name', 'Name', p.name, 'Business name')}${nf76WsField(who, 'tin', 'TIN', p.tin, who === 'me' ? 'Type your TIN' : 'Type their TIN')}${nf76WsField(who, 'address', 'Registered address', p.address, who === 'me' ? 'Type your registered address' : 'Type their registered address')}
      ${missing || who === 'me' ? `<div class="f">${who === 'me' ? (missing ? '<span>Type what\'s missing here. Save it once and it fills in every time.</span>' : '<span>Change anything here, then save.</span>') : '<span>Type it in if you know it, or ask them. Nifti remembers it for next time.</span>'}${act}</div>` : ''}</div>`;
  };
  const html = `<div class="stmt-paper nf76-wsheet">
    <div class="nf76-ws-h"><div class="tt"><b>BIR Form 2307 fill-in helper</b><span>Certificate of Creditable Tax Withheld at Source</span></div><div class="q"><b>${nf76E(nf75BQLabel(quarter))}</b><span>${nf76E(stmtDate(w.period_from))} to ${nf76E(stmtDate(w.period_to))}</span></div></div>
    <div class="nf76-ws-note">This is <b>not</b> the BIR form. Copy these details into the official BIR Form 2307, then sign it.</div>
    <div class="nf76-ws-parts">${party('Part I', 'Payee (who got paid)', w.payee || {}, mineIsPayee ? 'me' : 'them')}${party('Part II', 'Payor (who kept the tax)', w.payor || {}, mineIsPayee ? 'them' : 'me')}</div>
    <div class="nf76-ws-sec">Part III · Payments and tax kept</div>
    <div class="nf76-ws-tw"><table class="nf76-ws-t"><thead><tr><th class="l">ATC</th><th>${months[0]}</th><th>${months[1]}</th><th>${months[2]}</th><th>Total paid</th><th>Tax kept</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td class="l"><b>${nf76E(r.atc || '—')}</b><small>${r.rate ? Math.round(r.rate * 1000) / 10 + '%' : ''}</small></td><td>${fmtPHP(r.m1)}</td><td>${fmtPHP(r.m2)}</td><td>${fmtPHP(r.m3)}</td><td>${fmtPHP(r.total)}</td><td><b>${fmtPHP(r.tax)}</b></td></tr>`).join('')}
    </tbody><tfoot><tr><td class="l">Total</td><td></td><td></td><td></td><td>${fmtPHP(tot.base)}</td><td>${fmtPHP(tot.tax)}</td></tr></tfoot></table></div>
    <div class="nf76-ws-sec">Signatures (on the official form)</div>
    <div class="nf76-ws-sign">
      <div class="s"><i></i><b>Payor or authorized representative</b><span>Signature over printed name · ${mineIsPayee ? 'they sign' : 'you sign'}</span><div class="sm"><span><i></i>Title / position</span><span><i></i>Date signed</span></div></div>
      <div class="s"><i></i><b>Conforme: payee or authorized representative</b><span>Signature over printed name · ${mineIsPayee ? 'you sign when you receive it' : 'they sign when they receive it'}</span><div class="sm"><span><i></i>Title / position</span><span><i></i>Date signed</span></div></div>
    </div>
    <div class="nf76-ws-steps nf76-noprint"><b>How to finish it</b><ol>
      <li>Get the official BIR Form 2307 at <a href="https://www.bir.gov.ph" target="_blank" rel="noopener">bir.gov.ph</a> (BIR Forms).</li>
      <li>Copy Parts I, II and III from this sheet.</li>
      <li>${mineIsPayee ? 'They sign as payor and give it to you. You sign the Conforme part when you get it.' : 'You sign as payor. They sign the Conforme part when they get it.'}</li>
      <li>${mineIsPayee ? 'Attach a photo of the signed form in Nifti so it\'s on file.' : 'Give it to them within 20 days after the quarter ends. Attach a photo in Nifti so it\'s on file.'}</li></ol></div>
    <div class="stmt-foot">ATC: WC = company, WI = individual · 158 = goods (1%), 160 = services (2%). Check with your accountant if unsure. Made with Nifti.</div>
  </div>`;
  let host = document.getElementById('statementView');
  if(!host){ host = document.createElement('div'); host.id = 'statementView'; document.body.appendChild(host); }
  document.body.classList.add('statement-open');
  host.innerHTML = `<div class="stmt-toolbar"><button class="btn btn-outline" onclick="closeStatementOverlay()">✕ Close</button><button class="btn btn-outline" onclick="window.print()">🖨 Print / Save PDF</button></div>${html}`;
  window.scrollTo(0, 0);
}
try{ open2307Worksheet = nf76Worksheet; window.open2307Worksheet = nf76Worksheet; }catch(e){}
