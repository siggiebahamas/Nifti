/* ===== Round 77 ===== */
function nf77E(s){ return escapeHtml(String(s == null ? '' : s)); }
function nf77P(n){ return typeof bkPeso === 'function' ? bkPeso(n) : fmtPHP(n); }
function nf77Ic(d, s){ return `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`; }
function nf77Day(d){ try{ return new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}); }catch(e){ return d; } }

/* ---------- 1. Getting paid, selling side: one list, and each customer's buttons match what they did ---------- */
const NF77I = {
  check: '<path d="M20 6 9 17l-5-5"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  truck: '<rect x="1" y="7" width="13" height="10" rx="1"/><path d="M14 10h4l3 3v4h-7"/><circle cx="5.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
  shop: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>', hand: '<path d="M7 11V7a2 2 0 0 1 4 0v4M11 10V5a2 2 0 0 1 4 0v6M15 10a2 2 0 0 1 4 0v4a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3l-2.5-4a2 2 0 0 1 3.3-2.2L7 14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>'
};
function nf77RemindBtn(id, primary, label){
  let ch = null; try{ const p = nf33RPref(id); ch = NF33R_CH[p.channel]; }catch(e){}
  return `<button type="button" class="nf77-b ${primary ? 'p' : 's'}" onclick="colRemind('${id}')">${ch ? `<span class="ch" style="--c:${ch.c}">${ch.ic}</span>` : nf77Ic(NF77I.bell, 16)}${label || 'Remind'}${ch ? `<small>on ${nf77E(ch.l)}</small>` : ''}</button>`;
}
function nf77CustCard(g, claimBy){
  const says = Math.min(g.pending || 0, g.total), left = Math.max(0, g.total - says), late = g.overdue > 0, pr = g.promise && g.promise.status === 'open' ? g.promise : null;
  const lines = [], acts = [];
  if(says > 0) lines.push(`<div class="st b">${nf77Ic(NF77I.hand, 18)}<span>${says >= g.total ? `Says they paid <b>all of it</b>` : `Says they paid <b>${nf77P(says)}</b> · ${nf77P(left)} still to pay`}</span></div>`);
  if(late && left > 0) lines.push(`<div class="st r">${nf77Ic(NF77I.alert, 18)}<span><b>${nf77P(Math.min(g.overdue, left))} late</b> · ${g.maxLate} day${g.maxLate === 1 ? '' : 's'}</span></div>`);
  if(pr) lines.push(`<div class="st g">${nf77Ic(NF77I.check, 18)}<span>Promised <b>${nf77P(pr.amount)}</b> by ${nf77E(nf77Day(pr.promised_date))}</span><button type="button" class="nf77-x" onclick="colCancelPromise('${pr.id}')">Cancel promise</button></div>`);
  if(!lines.length) lines.push(`<div class="st n">${nf77Ic(NF77I.clock, 18)}<span>${g.nextDue ? `Not due yet · due <b>${nf77E(nf77Day(g.nextDue))}</b>` : 'Not due yet'}</span></div>`);
  if(says > 0) acts.push(`<button type="button" class="nf77-b p" onclick="nf77GoConfirm('${g.id}')">${nf77Ic(NF77I.check, 16)}${says >= g.total ? 'Check and confirm' : 'Confirm ' + nf77P(says)}</button>`);
  if(left > 0 && !(says > 0 && !late)){
    if(late && !pr){ acts.push(nf77RemindBtn(g.id, !(says > 0), says > 0 ? 'Remind for the rest' : 'Remind')); acts.push(`<button type="button" class="nf77-b s" onclick="colPromise('${g.id}')">They promised to pay</button>`); }
    else acts.push(nf77RemindBtn(g.id, false, pr ? 'Remind' : 'Friendly reminder'));
  }
  return `<div class="nf77-cu${late && left > 0 ? ' late' : says > 0 ? ' says' : ''}"><div class="top"><b class="nm">${nf77E(g.name)}</b><div class="amt"><b>${nf77P(g.total)}</b><small>owes you</small></div></div>
    <div class="sts">${lines.join('')}</div><div class="acts">${acts.join('')}</div></div>`;
}
function nf77SchedText(){
  try{ const s = collSettings().schedule.slice().sort((a, b) => a - b), bef = s.filter(o => o < 0).map(o => -o), on = s.includes(0), aft = s.filter(o => o > 0);
    const j = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join('');
    return [bef.length ? j(bef) + ' day' + (bef.length > 1 || bef[0] > 1 ? 's' : '') + ' before' : '', on ? 'on the due day' : '', aft.length ? j(aft) + ' days late' : ''].filter(Boolean).join(', '); }catch(e){ return ''; }
}
function nf77CollHtml(){
  const rows = colRows(), claims = nf43Claims(), on = typeof autoRemindersOn === 'function' && autoRemindersOn(), due = rows.filter(r => r.needsYou);
  const claimBy = {}; claims.forEach(c => { const k = c.po.buyerId || c.po.buyerName; (claimBy[k] = claimBy[k] || []).push(c); });
  const ctot = claims.reduce((a, c) => a + Number(c.p.amount || 0), 0);
  const conf = claims.length ? `<section class="nf77-conf" id="nf77Conf"><div class="h"><div><b>Payments to confirm</b><span>Check your bank, GCash or the check first. Then tap one button.</span></div><em>${nf77P(ctot)}<small>${claims.length} payment${claims.length === 1 ? '' : 's'}</small></em></div>
    ${claims.map(c => { const who = c.po.buyerName || c.po.customerName || 'Customer', m = (c.p.method || '').toLowerCase(), how = m === 'check' ? 'Check' : m === 'gcash' ? 'GCash' : m === 'bank' ? 'Bank transfer' : m === 'cash' ? 'Cash' : (c.p.method || 'Payment');
      return `<div class="r" data-b="${nf77E(c.po.buyerId || who)}"><div class="w"><b>${nf77E(who)}</b><span>${nf77E(c.po.poNumber ? 'Order ' + String(c.po.poNumber).replace(/^PO-\d{4}-/, '') : '')} · ${nf77E(how)}${c.p.date ? ' · ' + nf77E(bkDayLabel(String(c.p.date).slice(0, 10))) : ''}</span></div><em>${nf77P(c.p.amount)}</em>
        <div class="bt"><button type="button" class="nf77-b p" onclick="confirmPaymentReceived('${c.po.id}','${c.kind}','${c.key}'); setTimeout(renderCollectionsPage, 60)">${nf77Ic(NF77I.check, 16)}${m === 'check' ? 'Check cleared' : 'Money came in'}</button><button type="button" class="nf77-b s" onclick="navigate('orders'); setTimeout(() => nfoOpen('${c.po.id}'), 80)">${m === 'check' ? 'Bounced' : 'Not received'}</button></div></div>`; }).join('')}</section>` : '';
  const sched = nf77SchedText();
  const rem = `<div class="nf77-rem">${nf77Ic(NF77I.bell, 18)}<span><b>Reminders ${on ? 'on' : 'off'}</b>${on && sched ? ' · ' + nf77E(sched) : on ? '' : ' · turn on to remind customers for you'}</span>${due.length ? `<button type="button" class="nf77-b p" onclick="nf33RQueue()">Send ${due.length} reminder${due.length === 1 ? '' : 's'}</button>` : ''}<button type="button" class="nf77-link" onclick="colTab='rules'; renderCollectionsPage()">Change</button></div>`;
  const list = `<section class="nf77-list"><div class="h"><b>Customers with a balance</b>${rows.length ? `<span>${rows.length} customer${rows.length === 1 ? '' : 's'}</span>` : ''}</div>
    ${rows.length ? rows.map(g => nf77CustCard(g, claimBy)).join('') : '<div class="nf77-empty">Nobody owes you. New unpaid orders show up here.</div>'}</section>`;
  return conf + list + rem;
}
function nf77GoConfirm(id){ const box = document.getElementById('nf77Conf'); if(!box) return; box.scrollIntoView({behavior: 'smooth', block: 'start'}); box.querySelectorAll('.r').forEach(r => r.classList.toggle('hl', r.dataset.b === id)); setTimeout(() => box.querySelectorAll('.r.hl').forEach(r => r.classList.remove('hl')), 2600); }
async function nf77CollPaint(){
  const pg = document.getElementById('page-collections'); if(!pg || (typeof colTab !== 'undefined' && colTab !== 'follow')) return;
  const half = pg.querySelector('.nf-half-supplier > .nf-half-b'), body = half && half.querySelector('#colBody'); if(!body) return;
  try{ await nf33RLoad(); }catch(e){}
  let html = ''; try{ html = nf77CollHtml(); }catch(e){ console.warn('nf77 coll', e); return; }
  body.dataset.nf77 = '1'; if(body.dataset.k === html) return; body.dataset.k = html; body.innerHTML = html;
}
(function(){
  const prev = window.renderCollectionsPage; if(typeof prev !== 'function' || prev._nf77) return;
  const w = async function(){ const r = await prev.apply(this, arguments); if(!window._nfDualIn){ try{ await nf77CollPaint(); }catch(e){} } return r; };
  w._nf77 = true; w._nfDual = prev._nfDual; window.renderCollectionsPage = w; try{ renderCollectionsPage = w; }catch(e){}
})();
NF45_AFTER.push(page => { if(page && page.id === 'page-collections'){ const b = page.querySelector('.nf-half-supplier #colBody'); if(b && (!b.dataset.nf77 || !b.querySelector('.nf77-list'))) nf77CollPaint(); } });
// the older passes leave this side alone now
if(typeof nf43Collections === 'function'){ const o = nf43Collections; nf43Collections = function(page){ const b = page && page.querySelector && page.querySelector('#colBody'); if(b && b.dataset.nf77) return; return o.apply(this, arguments); }; }
if(typeof nf33RStrip === 'function'){ const o = nf33RStrip; nf33RStrip = function(page){ const b = page && page.querySelector && page.querySelector('#colBody'); if(b && b.dataset.nf77) return; return o.apply(this, arguments); }; }

/* the totals under each side: big, plain, easy to read */
nf76PaidTotals = function(){
  const pg = document.querySelector('#page-collections.active'); if(!pg) return;
  const hs = pg.querySelector('.nf-half-supplier > .nf-half-b'), hb = pg.querySelector('.nf-half-buyer > .nf-half-b');
  const row = (ic, t, sub, amt) => `<div class="r"><span class="i">${nf77Ic(ic, 20)}</span><div class="w"><b>${t}</b><small>${sub}</small></div><b class="a">${nf77P(amt)}</b></div>`;
  try{
    if(hs){
      const inv = unpaidInvoicesFor('supplier'), invAmt = inv.reduce((a, r) => a + (r.balance || 0), 0), invWho = [...new Set(inv.map(r => r.po && r.po.buyerName).filter(Boolean))];
      const ut = bkLiveSales().filter(s => bkSaleBalance(s) > 0), utAmt = ut.reduce((a, s) => a + bkSaleBalance(s), 0), utWho = [...new Set(ut.map(s => s.customer).filter(Boolean))];
      const html = `<div class="nf77-tot"><div class="hd"><span>Owed to you</span><b>${nf77P(invAmt + utAmt)}</b></div>
        ${row(NF77I.truck, 'Delivery orders not paid yet', invWho.length ? nf77E(invWho.slice(0, 3).join(', ')) + (invWho.length > 3 ? ' and ' + (invWho.length - 3) + ' more' : '') : 'none', invAmt)}
        ${row(NF77I.shop, 'Shop utang from Walk-in sales', (utWho.length ? nf77E(utWho.slice(0, 3).join(', ')) : 'none') + ` · <button type="button" class="nf77-link" onclick="go('sales')">See it</button>`, utAmt)}</div>`;
      nf76Put(hs, 'nf76TotS', html);
    }
    if(hb){
      const rows = unpaidInvoicesFor('buyer'), amt = rows.reduce((a, r) => a + (r.balance || 0), 0), who = [...new Set(rows.map(r => r.po && r.po.supplierName).filter(Boolean))], next = rows.filter(r => r.due && r.daysOverdue <= 0).map(r => r.due).sort()[0], late = rows.filter(r => r.daysOverdue > 0).length;
      const html = `<div class="nf77-tot b"><div class="hd"><span>You owe suppliers</span><b>${nf77P(amt)}</b></div>
        ${row(NF77I.truck, 'Bills not paid yet', (who.length ? nf77E(who.slice(0, 3).join(', ')) : 'none') + (late ? ` · <em class="r">${late} late</em>` : next ? ' · next due ' + nf77E(nf77Day(next)) : ''), amt)}</div>`;
      nf76Put(hb, 'nf76TotB', html);
    }
  }catch(e){}
};
window.nf76PaidTotals = nf76PaidTotals;

/* reminders: once you've picked a customer's app, the next reminder goes straight there (other apps one tap away) */
if(typeof nf33RSheet === 'function'){
  const base = nf33RSheet;
  nf33RSheet = function(){
    const x = NF33R.cur; if(!x) return base.apply(this, arguments);
    const saved = (NF33R.prefs || {})[x.id];
    if(!saved || x.all) return base.apply(this, arguments);
    const ch = x.p.channel, c = NF33R_CH[ch] || NF33R_CH.viber, needPhone = (ch === 'whatsapp' || ch === 'sms' || ch === 'viber') && !String(x.p.phone || '').trim(), needMail = ch === 'email' && !/@/.test(x.p.email || '');
    const q = NF33R.queue;
    slModal('nf33rSheet', `<div class="sl-sheet-h"><b>${q ? `Reminder ${NF33R.qi + 1} of ${q.length}: ` : 'Remind '}${escapeHtml(x.g.name)}</b><button class="sl-x" onclick="slClose('nf33rSheet'); NF33R.queue=null" aria-label="Close">✕</button></div>
      <div class="nf33r nf77-rs">
        <div class="nf33r-sum"><b>${fmtPHP(x.g.total)}</b> owed${x.g.overdue > 0 ? ` · <span class="r">${fmtPHP(x.g.overdue)} late, ${x.g.maxLate} days</span>` : ''}</div>
        <div class="nf77-via" style="--c:${c.c}"><span class="ic">${c.ic}</span><div><b>Sending on ${escapeHtml(c.l)}</b><small>the app ${escapeHtml(x.g.name)} uses${x.p.phone ? ' · ' + escapeHtml(x.p.phone) : ''}</small></div><button type="button" class="nf77-link" onclick="NF33R.cur.all=true; nf33RSheet()">Use another app</button></div>
        ${needPhone ? `<label class="nf33r-f"><span>Their mobile number</span><input id="nf33rPhone" inputmode="tel" placeholder="e.g. 0917 123 4567" value="" oninput="NF33R.cur.p.phone=this.value"></label>` : ''}
        ${needMail ? `<label class="nf33r-f"><span>Their email</span><input id="nf33rEmail" type="email" placeholder="name@example.com" value="" oninput="NF33R.cur.p.email=this.value"></label>` : ''}
        <label class="nf33r-f"><span>Message <small>· edit anything</small></span><textarea id="nf33rText" rows="6" oninput="NF33R.cur.text=this.value">${escapeHtml(x.text)}</textarea></label>
        <div class="nf33r-acts"><button type="button" class="btn btn-primary nf33r-go" style="--c:${c.c}" onclick="nf33RGo()"><span>${c.ic}</span>Send on ${escapeHtml(c.l)}</button>${q ? `<button type="button" class="btn btn-outline" onclick="nf33RNext()">Skip</button>` : ''}</div>
      </div>`);
  };
  window.nf33RSheet = nf33RSheet;
}

/* ---------- 2. Money overview: one profit table (with the cash left over), a side panel about the same month, and a coming-up list that adds up ---------- */
function nf77SideHtml(m, p){
  const sales = Number(p.sales) || 0, cost = Number(p.cost) || 0, exp = Number(p.expenses) || 0, net = Number(p.net) || 0;
  const per = v => sales ? Math.round(v / sales * 100) : 0;
  let pc = per(cost), pe = per(exp), pn = 100 - pc - pe; if(net < 0) pn = 0;
  const bar = sales ? `<div class="nf77-bar">${pc ? `<i class="c" style="width:${pc}%"></i>` : ''}${pe ? `<i class="e" style="width:${pe}%"></i>` : ''}${pn > 0 ? `<i class="n" style="width:${pn}%"></i>` : ''}</div>` : '';
  const leg = (cls, label, v, amt) => `<div class="lg"><span class="d ${cls}"></span><span class="t">${label}</span><b>₱${v}</b><small>${nf77P(amt)}</small></div>`;
  const R = typeof nf74SameRange === 'function' ? nf74SameRange(m) : null, q = R && typeof nf74PnlRange === 'function' ? nf74PnlRange(R) : null;
  const cmp = (label, now, was, goodUp) => { const d = now - was, up = d > 0, good = Math.abs(d) < 1 ? null : (up === goodUp);
    return `<div class="cr"><span class="t">${label}</span><b>${nf77P(now)}</b><em class="${good == null ? 'z' : good ? 'g' : 'r'}">${Math.abs(d) < 1 ? 'same' : (up ? '▲ ' : '▼ ') + nf77P(Math.abs(d))}</em></div>`; };
  return `<section class="panel-card nf77-split"><div class="panel-head"><h2>Out of every ₱100 you sold</h2></div>
      ${sales ? `${bar}<div class="lgs">${leg('c', 'Paid for the stock you sold', pc, cost)}${leg('e', 'Expenses', pe, exp)}${leg(net < 0 ? 'r' : 'n', net < 0 ? 'Loss' : 'You kept (profit)', net < 0 ? Math.abs(per(net)) : pn, net)}</div>` : '<p class="nf77-none">No sales yet this month.</p>'}</section>
    ${q && q.sales ? `<section class="panel-card nf77-cmp"><div class="panel-head"><h2>Compared with ${nf77E(R.label)}</h2></div>
      <div class="crs">${cmp('Sales', sales, q.sales, true)}${cmp('Cost of what you sold', cost, q.cogs, false)}${cmp('Expenses', exp, q.opex, false)}${cmp(net < 0 ? 'Loss' : 'Profit', net, q.net, true)}</div>
      <p class="nf77-cnote">${R.full ? 'Compared with the whole month before.' : 'This month so far, compared with the same days last month.'}</p></section>` : ''}`;
}
function nf77MoneyAfter(){
  const body = document.getElementById('bkMoneyBody'); if(!body) return;
  const two = body.querySelector('.bk-two'), card = body.querySelector('#bkPnlPrint'); if(!two || !card) return;
  const m = bkMonthSel || bkMonth(APP_TODAY); let p, f; try{ p = bkPnl(m); f = bkMoneyFlows(m); }catch(e){ return; }
  card.querySelectorAll('.pl-r.pl-sub > span:first-child').forEach(s => { const t = s.textContent.trim(); if(t === 'In the shop' || t === 'At the counter') s.textContent = 'Walk-in sales (shop)'; else if(t === 'Customer orders') s.textContent = 'Delivery order sales'; });
  if(!card.querySelector('.nf77-cash')){
    const html = `<div class="pl-r nf77-cash"><span>Cash left over<small>Money that came in this month, minus what you paid out</small></span><b class="${f.net < 0 ? 'neg' : ''}">${f.net < 0 ? '−' : ''}${nf77P(Math.abs(f.net))}</b></div>`;
    const after = card.querySelector('.nf74-cmp') || card.querySelector('.pl-r.big'); if(after) after.insertAdjacentHTML('afterend', html); else card.insertAdjacentHTML('beforeend', html);
  }
  const side = two.children[1]; if(side && !side.classList.contains('nf77-side')){ side.className = 'nf77-side'; side.innerHTML = nf77SideHtml(m, p); }
}
if(typeof renderMoneyPage === 'function'){ const _rm77 = renderMoneyPage; renderMoneyPage = function(){ const r = _rm77.apply(this, arguments); try{ nf77MoneyAfter(); }catch(e){ console.warn('nf77 money', e); } return r; }; window.renderMoneyPage = renderMoneyPage; }

// coming up: money in and money out as two lists, each with its own total, so every number adds up on screen
const NF77N = {allIn: false, allOut: false};
function nf77NextItems(){
  const items = nf37Items(), end = nf37SpanEnd();
  try{ bkLiveSales().filter(s => bkSaleBalance(s) > 0).forEach(s => { const due = String(s.due || s.dueDate || APP_TODAY).slice(0, 10), d = due > APP_TODAY ? due : APP_TODAY;
    if(d <= end) items.push({k: 'ut', d, amt: bkSaleBalance(s), type: 'Shop utang', ref: 'Walk-in sale ' + bkDayLabel(String(s.date).slice(0, 10)), what: 'Shop utang', who: s.customer || 'Walk-in customer', sale: s}); }); }catch(e){}
  return items.sort((a, b) => a.d.localeCompare(b.d) || (b.amt - a.amt));
}
function nf77NextHtml(){
  const items = nf77NextItems(); NF31N.items = items;
  const ins = items.map((x, i) => [x, i]).filter(([x]) => x.amt > 0), outs = items.map((x, i) => [x, i]).filter(([x]) => x.amt < 0);
  const tIn = ins.reduce((a, [x]) => a + x.amt, 0), tOut = -outs.reduce((a, [x]) => a + x.amt, 0), net = tIn - tOut, cap = 5;
  const span = NF37_SPANS.find(s => s[0] === NF37N.days) || NF37_SPANS[2];
  const status = x => x.late ? `<span class="nf37-st late">${x.days} day${x.days === 1 ? '' : 's'} late</span>` : x.k === 'ut' ? '<span class="nf37-st today">Owed now</span>' : x.d === APP_TODAY ? '<span class="nf37-st today">Due today</span>' : `<span class="nf37-st">In ${daysBetween(APP_TODAY, x.d)} day${daysBetween(APP_TODAY, x.d) === 1 ? '' : 's'}</span>`;
  const rowH = ([x, i]) => `<button type="button" class="nf77-nr ${x.amt > 0 ? 'in' : 'out'}${x.late ? ' late' : ''}" onclick="nf31Open(${i})">
      <span class="w"><b>${nf77E(x.type)}</b><small>${nf77E(String(x.ref || '').replace(/^PO-\d{4}-/, 'Order '))}</small></span>
      <span class="who">${nf77E(x.who || '')}</span><span class="due">${x.d === APP_TODAY ? 'Today' : nf77E(bkDayLabel(x.d))}</span><span class="stt">${status(x)}</span>
      <span class="a">${x.amt > 0 ? '+' : '−'}${nf77P(Math.abs(x.amt))}</span></button>`;
  const group = (key, title, list, tot, all, flag) => { const show = all ? list : list.slice(0, cap);
    return `<div class="nf77-ng ${key}"><div class="gh"><b>${title}</b><span>${list.length} item${list.length === 1 ? '' : 's'}</span></div>
      ${list.length ? show.map(rowH).join('') + (list.length > cap ? `<button type="button" class="nf77-more" onclick="NF77N.${flag} = !NF77N.${flag}; nf37NextRepaint()">${all ? 'Show fewer' : `Show ${list.length - cap} more`}</button>` : '') : `<p class="nf77-none">Nothing ${key === 'in' ? 'coming in' : 'going out'} ${nf77E(span[1].toLowerCase())}.</p>`}
      <div class="gt"><span>Total ${key === 'in' ? 'coming in' : 'going out'}</span><b>${key === 'in' ? '+' : '−'}${nf77P(tot)}</b></div></div>`; };
  return `<section class="panel-card nf31-next nf37-next nf77-next" id="nf37Next">
    <div class="nf37-nh"><h2>Coming up: money in and out</h2>
      <label class="nf37-span"><span>Show</span><select onchange="NF37N.days = this.value === 'm' ? 'm' : Number(this.value); NF77N.allIn = NF77N.allOut = false; nf37NextRepaint()">${NF37_SPANS.map(([v, l]) => `<option value="${v}"${v === NF37N.days ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <div class="nf37-tot">
      <div class="in"><small>Coming in</small><b>+${nf77P(tIn)}</b></div>
      <div class="out"><small>Going out</small><b>−${nf77P(tOut)}</b></div>
      <div class="net ${net >= 0 ? 'pos' : 'neg'}"><small>${net >= 0 ? 'Left over' : 'More going out than coming in'}</small><b>${net >= 0 ? '+' : '−'}${nf77P(Math.abs(net))}</b></div>
    </div>
    <div class="nf77-ngs">${group('in', 'Coming in', ins, tIn, NF77N.allIn, 'allIn')}${group('out', 'Going out', outs, tOut, NF77N.allOut, 'allOut')}</div>
  </section>`;
}
nf37NextRepaint = function(){ const el = document.getElementById('nf37Next'); if(el) el.outerHTML = nf77NextHtml(); };
try{ window.lgForecastHtml = nf77NextHtml; lgForecastHtml = nf77NextHtml; window.nf37NextHtml = nf77NextHtml; nf37NextHtml = nf77NextHtml; }catch(e){}

// the detail popup: amount and date beside the title; the order's lines add up to its total; shop utang opens too
if(typeof nf31Open === 'function'){
  const _o31 = nf31Open;
  nf31Open = function(i){
    const x = NF31N.items[i]; if(!x) return;
    if(x.k === 'ut'){ const s = x.sale || {};
      slModal('nf31Next', `<div class="sl-sheet-h"><b>Coming in</b><button class="sl-x" onclick="slClose('nf31Next')" aria-label="Close">✕</button></div><div class="nf31-pop">
        <div class="nf31-ph in"><em>Shop utang</em><h3>${nf77E(x.who)}</h3><p>Walk-in sale on ${nf77E(bkDayLabel(String(s.date).slice(0, 10)))}${s.by ? ' · by ' + nf77E(s.by) : ''}</p><div class="nf31-big">${nf77P(x.amt)}</div><span class="nf31-due">Owed now</span></div>
        <h4>What they bought</h4><div class="nf31-items">${(s.lines || s.items || []).map(l => `<div><span>${Number(l.qty) || 0} × ${nf77E(l.name || l.product || '')}</span><b>${nf77P((Number(l.qty) || 0) * (Number(l.price || l.unit || l.unitPrice) || 0))}</b></div>`).join('') || '<p class="nf31-none">No items saved on this sale.</p>'}</div>
        <div class="nf31-kv"><span>Sale total</span><b>${nf77P(s.total)}</b></div><div class="nf31-kv strong"><span>Still to collect</span><b>${nf77P(x.amt)}</b></div>
        <div class="nf31-acts"><button type="button" class="btn btn-primary" onclick="slClose('nf31Next'); go('sales')">Open Walk-in sales</button></div></div>`);
      return; }
    _o31.apply(this, arguments);
    try{ if(x.po){ const box = document.querySelector('#nf31Next .nf31-items'); if(box && !box.dataset.nf77){ box.dataset.nf77 = '1';
        const items = (x.po.lineItems || []).reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0), tot = typeof poTotal === 'function' ? poTotal(x.po) : items, d = Math.round((tot - items) * 100) / 100;
        if(Math.abs(d) >= 1){ const vat = Math.abs(d - items * 0.12) < 1.5; box.insertAdjacentHTML('afterend', `<div class="nf31-kv"><span>Items</span><b>${nf77P(items)}</b></div><div class="nf31-kv"><span>${d < 0 ? 'Discount' : vat ? 'VAT (12%)' : 'Delivery and other charges'}</span><b>${d < 0 ? '−' : '+'}${nf77P(Math.abs(d))}</b></div>`); } } } }catch(e){}
  };
  window.nf31Open = nf31Open;
}

/* ---------- 3. Bank & deposits / Getting paid: each total opens to show exactly what's in it ---------- */
function nf77TotToggle(btn){ const r = btn.closest('.r'); if(r) r.classList.toggle('open'); btn.setAttribute('aria-expanded', r && r.classList.contains('open') ? 'true' : 'false'); }
(function(){
  const base = nf76PaidTotals;
  nf76PaidTotals = function(){
    base.apply(this, arguments);
    const pg = document.querySelector('#page-collections.active'); if(!pg) return;
    const hs = pg.querySelector('#nf76TotS .nf77-tot'), hb = pg.querySelector('#nf76TotB .nf77-tot');
    const addList = (box, idx, items) => { const rows = box ? box.querySelectorAll(':scope > .r') : []; const r = rows[idx]; if(!r || r.dataset.nf77l) return; r.dataset.nf77l = '1';
      if(!items.length) return;
      r.classList.add('tg'); r.insertAdjacentHTML('beforeend', `<button type="button" class="nf77-tg" aria-expanded="false" onclick="nf77TotToggle(this)"><span class="o">See the ${items.length} line${items.length === 1 ? '' : 's'}</span><span class="c">Hide</span></button><div class="nf77-tl">${items.join('')}</div>`); };
    try{
      const inv = unpaidInvoicesFor('supplier').slice().sort((a, b) => String(a.due || '').localeCompare(String(b.due || '')));
      addList(hs, 0, inv.map(r => `<button type="button" class="it" onclick="openOrderDetailModal('${r.po.id}', true)"><span><b>${nf77E(r.po.buyerName || 'Customer')}</b><small>${nf77E((r.po.invoice && r.po.invoice.number) || r.po.poNumber || '')}${r.due ? ' · ' + (r.daysOverdue > 0 ? `<em class="r">${r.daysOverdue} days late</em>` : 'due ' + nf77E(nf77Day(r.due))) : ''}</small></span><b>${nf77P(r.balance)}</b></button>`));
      const ut = bkLiveSales().filter(s => bkSaleBalance(s) > 0);
      addList(hs, 1, ut.map(s => `<button type="button" class="it" onclick="go('sales')"><span><b>${nf77E(s.customer || 'Walk-in customer')}</b><small>Walk-in sale · ${nf77E(bkDayLabel(String(s.date).slice(0, 10)))}${s.by ? ' · by ' + nf77E(s.by) : ''}</small></span><b>${nf77P(bkSaleBalance(s))}</b></button>`));
      const bills = unpaidInvoicesFor('buyer').slice().sort((a, b) => String(a.due || '').localeCompare(String(b.due || '')));
      addList(hb, 0, bills.map(r => `<button type="button" class="it" onclick="openOrderDetailModal('${r.po.id}', false)"><span><b>${nf77E(r.po.supplierName || 'Supplier')}</b><small>${nf77E((r.po.invoice && r.po.invoice.number) || r.po.poNumber || '')}${r.due ? ' · ' + (r.daysOverdue > 0 ? `<em class="r">${r.daysOverdue} days late</em>` : 'due ' + nf77E(nf77Day(r.due))) : ''}</small></span><b>${nf77P(r.balance)}</b></button>`));
    }catch(e){}
  };
  window.nf76PaidTotals = nf76PaidTotals;
})();

/* ---------- 4. BIR 2307 helper: you confirm you checked it before printing; what you type for them is remembered ---------- */
function nf77TaxKey(){ return 'nifti-2307-parties:' + (myBusiness ? myBusiness.id : 'demo'); }
function nf77TaxSaved(){ try{ return JSON.parse(localStorage.getItem(nf77TaxKey()) || '{}') || {}; }catch(e){ return {}; } }
function nf77TaxRemember(){
  const cp = NF76W.cp; if(!cp) return; const all = nf77TaxSaved(), v = all[cp] || {};
  document.querySelectorAll('#statementView input[data-who="them"]').forEach(i => { const t = i.value.trim(); if(t) v[i.dataset.k] = t; });
  all[cp] = v; try{ localStorage.setItem(nf77TaxKey(), JSON.stringify(all)); }catch(e){}
}
function nf77TaxCopy(btn){ const i = btn.parentElement.querySelector('input'); if(!i || !i.value.trim()){ showToast('Nothing to copy yet.', 'warn'); return; } try{ navigator.clipboard.writeText(i.value.trim()); }catch(e){ try{ copyText(i.value.trim()); }catch(e2){} } btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy'; }, 1400); }
function nf77TaxAck(cb){ const b = document.getElementById('nf77Print'); if(b){ b.disabled = !cb.checked; b.classList.toggle('off', !cb.checked); } }
if(typeof nf76Worksheet === 'function'){
  const _ws = nf76Worksheet;
  nf76Worksheet = async function(cpId, quarter){
    await _ws.apply(this, arguments);
    const host = document.getElementById('statementView'); if(!host || !host.querySelector('.nf76-wsheet')) return;
    const saved = nf77TaxSaved()[cpId] || {};
    host.querySelectorAll('input[data-who="them"]').forEach(i => { if(!i.value.trim() && saved[i.dataset.k]){ i.value = saved[i.dataset.k]; const f = i.closest('.nf76-wf'); if(f) f.classList.remove('empty'); f && f.classList.add('kept'); } i.addEventListener('change', nf77TaxRemember); });
    host.querySelectorAll('.nf76-wf').forEach(f => { if(!f.querySelector('.nf77-cp')) f.insertAdjacentHTML('beforeend', '<button type="button" class="nf77-cp nf76-noprint" onclick="nf77TaxCopy(this)">Copy</button>'); });
    if(Object.keys(saved).length){ const n = host.querySelector('.nf76-wp.them .f span'); if(n) n.textContent = 'Filled in from what you typed last time. Check it is still right.'; }
    const tb = host.querySelector('.stmt-toolbar');
    if(tb) tb.innerHTML = `<button class="btn btn-outline" onclick="closeStatementOverlay()">✕ Close</button>
      <label class="nf77-ack"><input type="checkbox" onchange="nf77TaxAck(this)"><span>I checked every detail. I am responsible for what goes on the official form.</span></label>
      <button id="nf77Print" class="btn btn-primary off" disabled onclick="window.print()">🖨 Print / Save PDF</button>`;
    const note = host.querySelector('.nf76-ws-note'); if(note) note.innerHTML = 'This is <b>not</b> the BIR form. Nifti fills it in from your records and theirs, but <b>you</b> must check every detail before you copy it into the official BIR Form 2307 and sign. Nifti is not responsible for mistakes on the form.';
  };
  try{ open2307Worksheet = nf76Worksheet; window.open2307Worksheet = nf76Worksheet; }catch(e){}
}
