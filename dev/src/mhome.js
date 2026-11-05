/* ===== Home: the approved "Mist" design, on real data =====
   8 headline tiles, What to do (3 lanes), Where every order is (compact board), What runs out,
   Cash drawer by person (month calendar, day tally, who counts, optional protections).
   Everything reads the same data the rest of Nifti uses; actions open the existing screens. */
const MH = {cal: null, open: {}, sheet: null, sd: null};
const MH_STAGES = [['To confirm', 'New orders waiting for a yes, from you or them.'], ['Preparing', 'Accepted. Being packed or loaded.'], ['On the way', 'Left the warehouse, to you or from you.'],
  ['Delivered', 'Received. Bill it, or pay the supplier.'], ['Billed', 'Invoice sent. Waiting to be paid.'], ['Paid', 'Done this month.']];
const MH_MODES = [['same', 'Same person', 'Every day'], ['alternate', 'Take turns', 'Switch every day'], ['weekly', 'Weekly turns', 'Switch every Monday'], ['monthly', 'Monthly turns', 'Switch every month']];
const MH_PROTS = [
  ['rotate', 'Rotate who counts', 'Warn me on Home when the same person counts 3 days in a row. A different counter the next day exposes a gap someone is hiding.'],
  ['pattern', 'Pattern alerts', 'Warn me on Home when one person is short twice in a month, or when the same weekday keeps coming up short.'],
  ['surprise', 'Surprise counts', 'Adds a "Count now" button so you can start a count in the middle of the day. The cashier counts without seeing what the drawer should hold.'],
  ['drop', 'Cash drop limit', 'Warn me on Home when the drawer should be holding more than the amount below, so cash gets moved to the safe or the bank.'],
  ['stock', 'Stock cross-check', 'When a drawer is short, the day\'s tally also lists stock that went missing in counts around that day. Missing stock plus missing cash points to theft, not a miscount.']
];
const MH_ICON = {
  sales: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>', costs: '<path d="M4 7h16M4 12h10M4 17h6"/>', pl: '<path d="m3 16 6-6 4 4 8-8M15 6h6v6"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>',
  cust: '<path d="M3 7h13l3 4v6h-3"/><circle cx="7" cy="17" r="2"/><circle cx="16" cy="17" r="2"/><path d="M9 17h5"/>',
  owed: '<path d="M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2 2.6 5 3.3 5 1.6 5 3.6-2.2 3.1-5 3.1-5-1.2-5-3.1"/>',
  owe: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>', sup: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
  sell: '<path d="M7 17 17 7M9 7h8v8"/>', buy: '<path d="M17 7 7 17M15 17H7V9"/>'
};
const mhIco = (k, c) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"${c ? ` style="color:${c}"` : ''}>${MH_ICON[k]}</svg>`;
const mhEsc = s => escapeHtml(String(s == null ? '' : s));
const mhPeso = n => '₱' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('en-PH');
const mhSigned = n => Math.round(n) === 0 ? '₱0' : (n > 0 ? '+' : '−') + mhPeso(n);
const mhK = n => { n = Math.abs(Number(n) || 0); return n >= 1000 ? '₱' + (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'K' : mhPeso(n); };
const mhTone = d => Math.round(d) === 0 ? 'g' : d < 0 ? 'r' : 'b';
const mhKey = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const mhMonL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const mhLabel = k => new Date(k + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric'});
const mhFirst = n => String(n || '').replace(/ \(You\)$/, '').split(' ')[0];
const MH_AV = [['#E3ECFF', '#1E40AF'], ['#E0F2EF', '#0F6B5C'], ['#FCE7EF', '#9D174D'], ['#E6EBF1', '#1F2937'], ['#E0F2FE', '#075985'], ['#ECFCCB', '#3F6212']];
function mhAv(name, size){ const n = String(name || '?'), h = [...n].reduce((a, c) => a + c.charCodeAt(0), 0), c = MH_AV[h % MH_AV.length];
  const ini = n.replace(/ \(You\)$/, '').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  return `<span class="av" style="background:${c[0]};color:${c[1]}${size ? `;width:${size}px;height:${size}px;font-size:${Math.round(size * .37)}px` : ''}" aria-hidden="true">${mhEsc(ini)}</span>`; }

/* ---------- settings kept with the business (books_settings) ---------- */
function mhSched(){ const s = bkSettings().count_schedule; return s && s.people ? Object.assign({over: {}}, s) : {mode: 'alternate', people: mhPeople().slice(0, 2), start: APP_TODAY, over: {}}; }
function mhProt(){ return Object.assign({rotate: false, pattern: false, surprise: false, drop: false, dropAmt: 5000, stock: false}, bkSettings().protections || {}); }
function mhPeople(){
  const names = []; const add = n => { n = String(n || '').replace(/ \(You\)$/, '').trim(); if(n && !names.includes(n)) names.push(n); };
  BK.counts.slice().sort((a, b) => String(b.day).localeCompare(a.day)).forEach(c => add(c.by));
  (typeof teamMembers !== 'undefined' ? teamMembers : []).forEach(m => add(m.name));
  if(!names.length) add(bkMe());
  return names;
}
function mhIdx(k){ return Math.round((new Date(k + 'T00:00:00') - new Date('2000-01-03T00:00:00')) / 864e5); }
function mhWho(k, s){ s = s || mhSched(); if(s.over && s.over[k]) return s.over[k]; const ps = s.people && s.people.length ? s.people : [bkMe()];
  const d = mhIdx(k) - mhIdx(s.start || APP_TODAY), mod = (a, n) => ((a % n) + n) % n;
  if(s.mode === 'same') return ps[0];
  if(s.mode === 'alternate') return ps[mod(d, ps.length)];
  if(s.mode === 'weekly') return ps[mod(Math.floor((mhIdx(k) - 0) / 7) - Math.floor(mhIdx(s.start || APP_TODAY) / 7), ps.length)];
  const a = new Date(k + 'T00:00:00'), b = new Date((s.start || APP_TODAY) + 'T00:00:00'); return ps[mod((a.getFullYear() * 12 + a.getMonth()) - (b.getFullYear() * 12 + b.getMonth()), ps.length)]; }
function mhRule(s){ s = s || mhSched(); const m = MH_MODES.find(x => x[0] === s.mode) || MH_MODES[1]; return s.mode === 'same' ? (s.people[0] || bkMe()) + ' every day' : m[1] + ': ' + s.people.map(mhFirst).join(' → '); }

/* ---------- counts ---------- */
function mhCounts(){ const by = {}; BK.counts.filter(c => !c.reopenedAt).forEach(c => { const d = by[c.day]; if(!d) by[c.day] = {day: c.day, by: c.by, diff: Number(c.difference) || 0, recs: [c]}; else { d.diff += Number(c.difference) || 0; d.recs.push(c); } }); return by; }
function mhPersonNet(name, m){ const by = mhCounts(); return Object.values(by).filter(c => mhFirst(c.by) === mhFirst(name) && (!m || bkMonth(c.day) === m)).reduce((a, c) => a + c.diff, 0); }

/* ---------- the page ---------- */
function renderMistHome(){
  const host = homeHost(); if(!host) return;
  setLens('supplier');
  const boss = typeof booksCanSeeTotals === 'function' ? booksCanSeeTotals() : true;
  const raw = oneHomeItems(), items = hmGroup(raw), lanes = mhLanes(items, boss);
  const date = new Date(APP_TODAY + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'long', month: 'long', day: 'numeric'});
  host.innerHTML = `<div id="mhHome" class="mh-root">
    <div class="hero page-head lg-head"><div><h3>${hmGreeting()}, ${mhEsc(myBusiness && typeof myTeamMember !== 'undefined' && myTeamMember && myTeamMember.name ? mhFirst(myTeamMember.name) : selfName())}</h3><p>${date} · ${lanes.r.length ? `${lanes.r.length} thing${lanes.r.length > 1 ? 's' : ''} today` : 'Nothing urgent today'}${lanes.y.length ? `, ${lanes.y.length} this week` : ''}</p></div></div>
    <div class="mosaic num">${mhTiles(boss).join('')}</div>
    <div class="rows">
      ${mhAlerts(boss)}
      <section class="sect glass"><div class="sect-h"><h4>What to do</h4></div><div class="lanes">${['r', 'y', 'g'].map(k => mhLane(k, lanes[k])).join('')}</div></section>
      <section class="sect glass"><div class="sect-h"><h4>Where every order is</h4><button class="sch-btn" type="button" onclick="go('orders')">All orders ›</button></div>
        <div class="legend"><span class="lg"><span class="spl r">Late</span>late or waiting on you</span><span class="lg"><span class="spl y">Pending</span>coming up, on track</span><span class="lg"><span class="spl g">Done</span>completed</span></div>
        <div class="num">${mhBoard()}</div></section>
      ${isPageAllowedForViewAsRole('inventory') && typeof srSection === 'function' ? `<section class="sect glass" id="srCard">${srSection()}</section>` : ''}
      ${boss && BK.loaded ? `<section class="sect glass" id="mhDrawer">${mhDrawer()}</section>` : ''}
    </div>
    <div class="mh-more"><div class="lg-grid mh-anchor"></div>${oneHomeRecent()}
      <section class="lg-panel"><div class="lg-ph"><b>Messages</b><a class="lg-link" onclick="go('messages')">All messages</a></div><div id="oneHomeMsgs" class="one-msgs"></div></section></div>
  </div>`;
  renderOneHomeMessages();
  if(typeof checkOnboardingActivation === 'function') checkOnboardingActivation();
  try{ renderGetStartedCard(); }catch(e){}
  try{ renderPhoneNotifNudge(); }catch(e){}
  try{ if(typeof renderWeeklyRecapCard === 'function') renderWeeklyRecapCard(); }catch(e){}
  if(typeof booksAfterHome === 'function') booksAfterHome();
}

/* tiles */
function mhTiles(boss){
  const out = [], tile = t => { const inner = `<span class="ic" style="background:${t.bg}">${mhIco(t.ic, t.c)}</span><span class="tx"><span class="k"><span>${t.k}</span></span><span class="v ${t.vc || ''}">${t.v}</span><span class="s ${t.sc || ''}">${t.s}</span></span>`;
    return t.a ? `<button class="tile glass click" type="button" onclick="${t.a}">${inner}</button>` : `<div class="tile glass">${inner}</div>`; };
  if(boss && BK.loaded){
    const m = bkMonth(APP_TODAY), p = bkPnl(m), cost = p.cost + p.expenses, pl = p.sales - cost, pct = n => p.sales ? Math.round(Math.abs(n) / p.sales * 100) + '% of sales' : '';
    out.push(tile({ic: 'sales', bg: '#E1EDFA', c: '#1A4F8C', k: 'Sales this month', v: mhK(p.sales), s: mhMonL[Number(m.slice(5)) - 1] + ' so far', sc: 'muted', a: "go('money')"}));
    out.push(tile({ic: 'costs', bg: '#EBEFF6', c: '#3E4B66', k: 'Costs', v: mhK(cost), s: pct(cost), sc: 'muted', a: "go('money')"}));
    out.push(tile({ic: 'pl', bg: pl >= 0 ? '#DAF0E3' : '#FCE4DE', c: pl >= 0 ? '#0E653C' : '#B42318', k: pl >= 0 ? 'Profit' : 'Loss', v: (pl < 0 ? '−' : '') + mhPeso(pl), vc: pl >= 0 ? 'tg' : 'tr', s: pct(pl), sc: 'muted', a: "go('profit')"}));
    const rec = BK.counts.find(c => c.day === APP_TODAY && !c.reopenedAt), exp = cashExpected(APP_TODAY).cash, who = mhWho(APP_TODAY), s = mhSched();
    out.push(tile({ic: 'cash', bg: '#FEF3C7', c: '#E89B0C', k: 'Cash today', v: rec ? `<span class="cpill ok"><b>${mhPeso(rec.counted && rec.counted.cash)}</b> counted</span>` : `<span class="cpill wait"><b>${mhPeso(exp)}</b> expected</span>`,
      s: `<span class="cashline">${mhEsc(rec ? rec.by : who)}${!rec && s.over && s.over[APP_TODAY] ? ' (covering)' : ''} · ${rec ? (rec.at ? new Date(rec.at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit'}) : 'counted') : 'to count at closing'}</span>`, a: rec ? `mhOpenDay('${APP_TODAY}')` : 'mhOpenSched()'}));
  } else if(isPageAllowedForViewAsRole('cashcount') && BK.loaded){
    const done = BK.countDays.some(c => c.day === APP_TODAY && !c.reopened);
    out.push(tile({ic: 'cash', bg: '#FEF3C7', c: '#E89B0C', k: 'Cash today', v: done ? '<span class="cpill ok"><b>Counted</b></span>' : '<span class="cpill wait"><b>To count</b></span>', s: done ? 'Thank you' : 'Before closing', sc: 'muted', a: "go('cashcount')"}));
  }
  const ic = {'Customer orders': ['cust', '#DDEFF5', '#0E5E75'], 'Owed to you': ['owed', '#FCE4DE', '#B42318'], 'You owe suppliers': ['owe', '#EBEFF6', '#3E4B66'], 'Coming from suppliers': ['sup', '#DDEFF5', '#0E5E75']};
  oneHomeTiles().forEach(t => { const i = ic[t.lbl] || ['sup', '#EBEFF6', '#3E4B66'];
    out.push(tile({ic: i[0], bg: i[1], c: i[2], k: t.lbl === 'Coming from suppliers' ? 'From suppliers' : t.lbl, v: String(t.num).replace(/^₱/, '₱'), s: mhEsc(String(t.sub || '').trim()), sc: t.cls === 'bad' ? 'tr' : t.cls === 'good' ? 'tg' : 'muted', a: t.a})); });
  return out;
}

/* what to do */
function mhLanes(items, boss){
  const L = {r: [], y: [], g: []};
  items.forEach(i => { const t = lgSev(i.tone); (t === 'hi' ? L.r : L.y).push({h: i.t, d: i.s || '', b: i.b, act: i.a, amt: i.amt}); });
  if(boss && BK.loaded){
    bkFlags().forEach(f => { if(f.lvl === 'red') L.r.push({h: f.t + ': ' + f.v, d: f.s || '', b: 'Open', act: f.a}); else if(f.lvl === 'amber') L.y.push({h: f.t + ': ' + f.v, d: f.s || '', b: 'Open', act: f.a}); else L.g.push({h: f.t, d: f.v + (f.s ? ' · ' + f.s : '')}); });
    const p = bkPnl(bkMonth(APP_TODAY)), pl = p.sales - p.cost - p.expenses;
    if(pl > 0) L.g.unshift({h: 'Profit ' + mhPeso(pl) + ' this month', d: p.sales ? Math.round(pl / p.sales * 100) + ' of every ₱100 sold stays with you.' : ''});
  }
  const owe = unpaidInvoicesFor('buyer');
  if(!owe.some(r => r.daysOverdue > 0)){ const nd = owe.filter(r => r.due).map(r => r.due).sort()[0]; L.g.push({h: 'Supplier payments on schedule', d: nd ? 'Next one due ' + hmDay(nd) + '.' : 'Nothing due.'}); }
  return L;
}
function mhLane(k, list){
  const name = {r: 'Act Today', y: 'This Week', g: 'Fine'}[k], key = 'lane' + k, open = MH.open[key], show = open ? list : list.slice(0, 5);
  return `<div class="lane"><div class="lane-h ${k}"><span>${name}</span><span>${list.length}</span></div>
    ${show.map(a => `<div class="task"><div><h5>${a.h}</h5>${a.d ? `<p>${a.d}</p>` : ''}</div>${a.b ? `<button class="btn" type="button" onclick="${a.act}">${mhEsc(a.b)}</button>` : ''}</div>`).join('') || `<div class="task"><div><p>Nothing here.</p></div></div>`}
    ${list.length > 5 ? `<button class="more" type="button" onclick="MH.open['${key}']=!MH.open['${key}']; renderMistHome()">${open ? 'Show less' : '+ ' + (list.length - 5) + ' more'}</button>` : ''}</div>`;
}

/* order board (compact) */
function mhStageOf(o){
  if(!o || o.status === 'draft' || o.status === 'cancelled') return -1;
  const inv = o.invoice, paid = o.status === 'paid' || (inv && inv.status === 'paid');
  if(paid){ const d = (inv && (inv.paidDate || inv.paidAt)) || o.paidDate || o.updatedDate || o.createdDate; return bkMonth(String(d || APP_TODAY).slice(0, 10)) === bkMonth(APP_TODAY) ? 5 : -1; }
  if(inv || o.status === 'invoiced') return 4;
  if(['delivered', 'partially_delivered'].includes(o.status)) return 3;
  if(['shipped', 'in_customs'].includes(o.status)) return 2;
  if(['confirmed', 'preparing'].includes(o.status)) return 1;
  return 0;
}
function mhOrderRows(){
  const late = {}; ['supplier', 'buyer'].forEach(r => unpaidInvoicesFor(r).forEach(x => { if(x.po) late[x.po.id] = x; }));
  return purchaseOrders.filter(o => ((o.supplierId === ME_SUPPLIER && o.buyerId !== ME_BUYER) || o.buyerId === ME_BUYER)).map(o => {
    const stage = mhStageOf(o); if(stage < 0) return null;
    const side = sideOfPo(o), sell = side === 'supplier', inv = late[o.id];
    const cls = sell ? getSupplierActionColorClass(o) : getBuyerActionColorClass(o);
    const rd = o.requestedDeliveryDate, lateBy = rd && rd < APP_TODAY && stage <= 2 ? daysBetween(rd, APP_TODAY) : 0;
    let note, tone = cls === 'pill-danger' ? 'r' : cls === 'pill-ok' ? 'g' : 'y';
    if(stage === 4 && inv && inv.daysOverdue > 0){ note = `Payment ${inv.daysOverdue} day${inv.daysOverdue > 1 ? 's' : ''} late`; tone = 'r'; }
    else if(stage === 4){ note = inv && inv.due ? 'Due ' + hmDay(inv.due) : 'Waiting for payment'; tone = 'y'; }
    else if(lateBy){ note = `${lateBy} day${lateBy > 1 ? 's' : ''} late`; tone = 'r'; }
    else if(stage === 0) note = tone === 'r' ? 'Waiting for your OK' : 'Waiting for their OK';
    else if(stage === 1) note = rd ? 'Deliver ' + hmDay(rd) : 'Being prepared';
    else if(stage === 2) note = rd ? 'Arrives ' + hmDay(rd) : 'On the way';
    else if(stage === 3){ note = sell ? 'Delivered · bill it' : 'Received · pay the supplier'; if(tone !== 'r') tone = 'y'; }
    else { note = 'Paid'; tone = 'g'; }
    return {o, id: o.id, side: sell ? 'sell' : 'buy', stage, name: sell ? o.buyerName : o.supplierName, total: poTotal(o), note, tone, sell};
  }).filter(Boolean);
}
function mhBoard(){
  const rows = mhOrderRows(), by = (i, side) => rows.filter(r => r.stage === i && (!side || r.side === side));
  const lbl = side => `<span class="lane-lbl">${mhIco(side)}<b>${side === 'sell' ? 'Selling' : 'Buying'}</b><small>${side === 'sell' ? 'to customers' : 'from suppliers'}</small></span>`;
  const sh = (s, d, i, n) => `<div class="sh"><span class="sn">${i + 1}</span><span><b>${s}</b> <span class="sc">${n}</span></span><small>${d}</small></div>`;
  const order = {r: 0, y: 1, g: 2};
  return `<div class="ob ob3 cmp"><div class="hdr"><span></span>${MH_STAGES.map(([s, d], i) => `<div>${sh(s, d, i, by(i).length)}</div>`).join('')}</div>${['sell', 'buy'].map(side => `<div class="lane-row ${side}">${lbl(side)}${MH_STAGES.map((x, i) => {
    const os = by(i, side).sort((a, b) => order[a.tone] - order[b.tone]), k = side + i, open = MH.open[k], show = open ? os : os.slice(0, 2);
    return `<div class="cell">${show.map(r => `<button class="ln ${r.tone}" type="button" onclick="setLens('${r.sell ? 'supplier' : 'buyer'}'); openOrderDetailModal('${r.id}', ${r.sell})" aria-label="${r.side === 'sell' ? 'Selling' : 'Buying'}: ${mhEsc(r.name)}, ${mhPeso(r.total)}, ${mhEsc(r.note)}"><span class="nm">${mhEsc(r.name)}</span><span class="amt">${mhK(r.total)}</span><span class="sub"><span class="spl ${r.tone}">${mhEsc(r.note)}</span></span></button>`).join('') || '<span class="dash">—</span>'}${os.length > 2 ? `<button class="more" type="button" onclick="MH.open['${k}']=!MH.open['${k}']; renderMistHome()">${open ? 'Show less' : '+ ' + (os.length - 2) + ' more'}</button>` : ''}</div>`; }).join('')}</div>`).join('')}</div>`;
}

/* alerts from the optional protections */
function mhAlerts(boss){
  if(!boss || !BK.loaded) return '';
  const P = mhProt(), by = mhCounts(), days = Object.keys(by).sort(), out = [];
  if(P.rotate){ const last = days.slice(-3); if(last.length === 3 && last.every(d => mhFirst(by[d].by) === mhFirst(by[last[0]].by))) out.push(`<b>Rotate who counts:</b> ${mhEsc(by[last[0]].by)} has counted the last 3 days. Let someone else count tonight.`); }
  if(P.pattern){ const m = bkMonth(APP_TODAY), sh = days.filter(d => bkMonth(d) === m && by[d].diff <= -1), per = {}, wd = {};
    sh.forEach(d => { const n = mhFirst(by[d].by); per[n] = (per[n] || 0) + 1; const w = new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'long'}); wd[w] = (wd[w] || 0) + 1; });
    Object.keys(per).filter(n => per[n] >= 2).forEach(n => out.push(`<b>Pattern watch:</b> ${mhEsc(n)} was short ${per[n]} times this month.`));
    Object.keys(wd).filter(w => wd[w] >= 2).forEach(w => out.push(`<b>Pattern watch:</b> ${w}s were short ${wd[w]} times this month.`)); }
  if(P.drop){ const exp = cashExpected(APP_TODAY).cash; if(exp > (Number(P.dropAmt) || 5000)) out.push(`<b>Cash drop:</b> the drawer should be holding ${mhPeso(exp)}, over your ${mhPeso(P.dropAmt)} limit. Move some to the safe or the bank and record it as a cash transfer.`); }
  return out.map(x => `<div class="alertline">${x}</div>`).join('');
}

/* cash drawer by person */
function mhDrawer(){
  if(!MH.cal){ const [y, m] = APP_TODAY.split('-').map(Number); MH.cal = {y, m}; }
  const {y, m} = MH.cal, by = mhCounts(), s = mhSched(), P = mhProt();
  const first = new Date(y, m - 1, 1), dim = new Date(y, m, 0).getDate(), pad = (first.getDay() + 6) % 7;
  let cells = ''; for(let i = 0; i < pad; i++) cells += '<div class="day blank" aria-hidden="true"></div>';
  let shorts = 0, overs = 0, ok = 0;
  for(let d = 1; d <= dim; d++){ const k = mhKey(y, m, d), c = by[k];
    if(k === APP_TODAY && !c){ const w = mhWho(k, s); cells += `<button class="day today" type="button" onclick="mhOpenSched()"><span class="dn">${d} · Today</span><span class="nm">${mhEsc(w)}</span><span class="st tcount">To Count</span></button>`; continue; }
    if(k > APP_TODAY){ const w = mhWho(k, s); cells += `<button class="day future${s.over && s.over[k] ? ' swapped' : ''}" type="button" onclick="mhOpenSched()"><span class="dn">${d}</span><span class="nm">${mhEsc(w)}</span><span class="st">Scheduled</span></button>`; continue; }
    if(!c){ cells += `<div class="day none"><span class="dn">${d}</span><span class="st">No count</span></div>`; continue; }
    const tn = mhTone(c.diff); if(c.diff < -0.5) shorts++; else if(c.diff > 0.5) overs++; else ok++;
    const edited = c.recs.some(r => r.reviewedAt) || BK.counts.some(r => r.day === k && r.reopenedAt);
    cells += `<button class="day ${tn}" type="button" onclick="mhOpenDay('${k}')" aria-label="${mhLabel(k)}, ${mhEsc(c.by)}, ${tn === 'g' ? 'matched' : mhSigned(c.diff)}"><span class="dn">${d}${edited ? ' <span class="ed">edited</span>' : ''}</span><span class="nm">${mhEsc(c.by)}</span><span class="st t${tn}">${tn === 'g' ? 'Matched' : mhSigned(c.diff)}</span></button>`; }
  const tail = (7 - (pad + dim) % 7) % 7; for(let i = 0; i < tail; i++) cells += '<div class="day blank" aria-hidden="true"></div>';
  const mo = mhKey(y, m, 1).slice(0, 7), people = [...new Set(Object.values(by).filter(c => bkMonth(c.day) === mo).map(c => mhFirst(c.by)))];
  const pp = people.map(n => { const net = mhPersonNet(n, mo), offs = Object.values(by).filter(c => bkMonth(c.day) === mo && mhFirst(c.by) === n && Math.abs(c.diff) >= 1).sort((a, b) => a.day.localeCompare(b.day));
    const lastDay = Object.values(by).filter(c => mhFirst(c.by) === n).map(c => c.day).sort().pop();
    return `<button class="cdpp" type="button" onclick="mhOpenDay('${lastDay}')">${mhEsc(n)} · net <b class="t${mhTone(net)}">${mhSigned(net)}</b>${offs.length ? `<span class="muted">· ${offs.map(c => mhLabel(c.day) + ' ' + mhSigned(c.diff)).join(', ')}</span>` : ''}</button>`; }).join('');
  const on = MH_PROTS.filter(([k]) => P[k]).length;
  return `<div class="sect-h"><h4>Cash drawer by person</h4><span class="hint">Tap a day for its item-by-item tally</span><span class="mh-sp"></span>${P.surprise ? `<button class="sch-btn" type="button" onclick="mhCountNow()">Count now</button>` : ''}<button class="sch-btn" type="button" onclick="mhOpenProtect()">Extra protections · ${on} on</button><button class="sch-btn" type="button" onclick="mhEditHistory()">Edit history</button></div>
    <div class="cdsum num"><button class="cdpp" type="button" onclick="mhOpenSched()"><span class="muted">Who counts:</span> ${mhEsc(mhRule(s))} <span style="color:var(--blue)">Edit ›</span></button>${pp}</div>
    <div class="calhead"><button type="button" aria-label="Previous month" onclick="mhCalMove(-1)">‹</button><b>${mhMonL[m - 1]} ${y}</b><button type="button" aria-label="Next month" onclick="mhCalMove(1)">›</button>
      <span class="calstat num">${ok || shorts || overs ? `<span class="pill g">${ok} matched</span><span class="pill r">${shorts} short</span><span class="pill b">${overs} over</span>` : '<span class="pill n">No counts this month yet</span>'}</span></div>
    <div class="cal num">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="dow">${d}</div>`).join('')}${cells}</div>`;
}
function mhCalMove(d){ MH.cal.m += d; if(MH.cal.m > 12){ MH.cal.m = 1; MH.cal.y++; } if(MH.cal.m < 1){ MH.cal.m = 12; MH.cal.y--; } const el = document.getElementById('mhDrawer'); if(el) el.innerHTML = mhDrawer(); }
function mhEditHistory(){ go('settings'); setTimeout(() => { const el = document.getElementById('auditLogContent'); if(el){ const card = el.closest('.settings-card'); if(card && card.classList.contains('collapsed')) card.click(); el.scrollIntoView({behavior: 'smooth', block: 'start'}); } }, 400); }
function mhCountNow(){ ccStart(APP_TODAY); go('cashcount'); }

/* ---------- sheets ---------- */
function mhSheet(html, label, cls){
  let w = document.getElementById('mhSheet'); const first = !w;
  if(!w){ w = document.createElement('div'); w.id = 'mhSheet'; w.className = 'sheet-wrap'; w.addEventListener('click', e => { if(e.target === w) mhClose(); }); document.body.appendChild(w); }
  const sc = !first && w.querySelector('.tmain, .sheet-b'), keep = sc ? sc.scrollTop : 0;
  w.innerHTML = `<div class="sheet${first ? ' anim' : ''}${cls ? ' ' + cls : ''}" role="dialog" aria-modal="true" aria-label="${mhEsc(label)}">${html}</div>`;
  const sc2 = w.querySelector('.tmain, .sheet-b'); if(sc2 && !first) sc2.scrollTop = keep;
}
function mhClose(){ MH.sheet = null; const w = document.getElementById('mhSheet'); if(w) w.remove(); }
document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.getElementById('mhSheet')) mhClose(); });
const mhHead = (left, title, sub) => `<div class="sheet-h">${left}<div><h4>${title}</h4>${sub ? `<span class="sub">${sub}</span>` : ''}</div><button class="x" type="button" aria-label="Close" onclick="mhClose()">✕</button></div>`;

/* day tally */
function mhOpenDay(k){ MH.sheet = {type: 'day', k, tab: 'tally'}; mhRenderDay(); }
function mhRenderDay(){
  const S = MH.sheet, by = mhCounts(), c = by[S.k]; if(!c){ mhClose(); return; }
  const who = mhFirst(c.by), list = Object.values(by).filter(x => mhFirst(x.by) === who).sort((a, b) => b.day.localeCompare(a.day)).slice(0, 40), net = list.reduce((a, x) => a + x.diff, 0);
  const left = `<div class="days" role="group" aria-label="${mhEsc(c.by)}'s count days">${list.map(x => { const exp = x.recs.reduce((a, r) => a + (Number(r.expected && r.expected.cash) || 0), 0); return `<button class="dday" type="button" aria-pressed="${x.day === S.k}" onclick="MH.sheet.k='${x.day}'; MH.sheet.tab='tally'; mhRenderDay()"><b>${mhLabel(x.day)}</b><span class="pill ${mhTone(x.diff)}">${Math.round(x.diff) === 0 ? 'OK' : mhSigned(x.diff)}</span><small>Should be ${mhPeso(exp)}</small></button>`; }).join('')}</div>`;
  const reopened = BK.counts.filter(r => r.day === S.k && r.reopenedAt), changes = reopened.length + c.recs.filter(r => r.reviewedAt).length;
  mhSheet(`${mhHead(mhAv(c.by, 48), mhEsc(c.by) + '\'s cash drawer', `${list.length} count${list.length > 1 ? 's' : ''} · net <b class="t${mhTone(net)}">${mhSigned(net)}</b>`)}
    <div class="tally">${left}<div class="tmain">
      <div class="privacy">${mhIco('lock', '#1D4F86')}<span>Only you, managers and Finance see this. ${mhEsc(who)} only entered the bills and coins.</span></div>
      <div class="tabs" role="tablist"><button class="tab" role="tab" type="button" aria-selected="${S.tab === 'tally'}" onclick="MH.sheet.tab='tally'; mhRenderDay()">${mhLabel(S.k)} tally</button><button class="tab" role="tab" type="button" aria-selected="${S.tab === 'hist'}" onclick="MH.sheet.tab='hist'; mhRenderDay()">Changes (${changes})</button><span class="mh-sp"></span><button class="btn soft" type="button" onclick="mhClose(); ccReopen('${S.k}')">Reopen and recount</button></div>
      ${S.tab === 'hist' ? mhHist(c, reopened) : mhTally(c)}</div></div>`, mhEsc(c.by) + '\'s cash drawer', 'tsm');
}
function mhSalesOn(day, cash){
  const rows = [];
  bkLiveSales().forEach(s => { const pays = (s.payments || []).filter(p => bkPayDate(p) === day), k = pays.map(p => bkMethodKey(p.method));
    if(!pays.length) return; const isCash = k.includes('cash'), isG = k.some(x => x === 'gcash' || x === 'maya'); if(cash ? !isCash : !isG) return;
    (s.lines || []).forEach(l => { const qty = Number(l.qty) || 0, price = Number(l.price != null ? l.price : l.unitPrice) || 0, list = Number(l.listPrice) || (typeof bkItemPrice === 'function' ? Number(bkItemPrice(l.product)) || 0 : 0);
      rows.push({sku: l.sku || '', item: l.product || l.name || 'Item', qty, price, list, reason: l.reason || l.discountReason || ''}); }); });
  return rows;
}
function mhTally(c){
  const rec = c.recs[0], exp = (rec.expected && rec.expected.parts) || {}, df = c.diff, tn = mhTone(df), who = mhFirst(c.by), P = mhProt();
  const cash = mhSalesOn(c.day, true), gc = mhSalesOn(c.day, false), outs = BK.expenses.filter(e => !e.deletedAt && e.date === c.day && e.paidFrom === 'cash');
  const expected = c.recs.reduce((a, r) => a + (Number(r.expected && r.expected.cash) || 0), 0), counted = c.recs.reduce((a, r) => a + (Number(r.counted && r.counted.cash) || 0), 0);
  const row = l => { const disc = l.list && l.price < l.list - .005; return `<tr class="${disc ? 'disc' : ''}"><td>${mhEsc(l.sku)}</td><td><b>${mhEsc(l.item)}</b>${disc ? `<br><span class="dtag">Sold at a discounted price</span>` : ''}${l.reason ? `<span class="why"><b>Reason:</b> ${mhEsc(l.reason)}</span>` : ''}</td><td class="r">${l.qty}</td><td class="r"><b>${mhPeso(l.price)}</b>${disc ? `<br><span class="orig">Original ${mhPeso(l.list)}</span>` : ''}</td><td class="r"><b>${mhPeso(l.qty * l.price)}</b></td></tr>`; };
  const tbl = rows => `<div class="tbl"><table class="num fixed"><colgroup><col style="width:12%"><col style="width:42%"><col style="width:12%"><col style="width:17%"><col style="width:17%"></colgroup><thead><tr><th>SKU</th><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div>`;
  const den = (rec.counted && rec.counted.denominations) || {}, coins = Number(rec.counted && rec.counted.coins) || 0;
  const dens = Object.keys(den).sort((a, b) => b - a).map(d => `<span>${mhPeso(d)} × ${den[d]}</span>`).join('') + (coins ? `<span>Coins ${mhPeso(coins)}</span>` : '');
  const big = Math.abs(df) >= (bkSettings().cash_alert || 100);
  const missing = P.stock && df < 0 ? BK.moves.filter(x => x.kind === 'count' && x.qty < 0 && Math.abs(daysBetween(x.date, c.day)) <= 2) : [];
  const verdict = big ? `<div class="box red"><b class="t">Things to check for ${mhLabel(c.day)}</b><span>• Recount with a second person before deciding anything.</span>${cash.length <= 1 ? '<span>• Only ' + cash.length + ' cash sale recorded that day.</span>' : ''}${missing.map(x => `<span>• Stock count ${mhLabel(x.date)}: ${mhEsc(x.item)} ${x.qty} (${mhEsc(x.reason)})</span>`).join('')}${rec.note ? `<span>• ${mhEsc(who)}'s note: "${mhEsc(rec.note)}"</span>` : ''}</div>`
    : Math.round(df) === 0 ? `<div class="box green">Every peso accounted for.</div>` : df < 0 ? `<div class="box red"><b class="t">Short ${mhPeso(df)}</b><span>Small amount, often loose change or a miscount. Worth a quick recount if it repeats.</span></div>` : `<div class="box blue"><b class="t">Over ${mhPeso(df)}</b><span>Extra cash in the drawer. Often a sale that wasn't recorded or change not given.</span></div>`;
  return `<div class="sum4 num"><div><small>Counted by</small><b>${mhEsc(who)}</b></div><div><small>Should be in drawer</small><b>${mhPeso(expected)}</b></div><div><small>Actually counted</small><b>${mhPeso(counted)}</b></div><div><small>Difference</small><b class="t${tn}">${tn === 'g' ? 'Matched' : mhSigned(df)}</b></div></div>
    ${verdict}
    <div><div class="sec">CASH SALES THAT DAY · ${cash.length} ITEM${cash.length === 1 ? '' : 'S'}</div>${cash.length ? tbl(cash) : '<span style="font-size:16px">No cash sales recorded.</span>'}</div>
    ${gc.length ? `<div><div class="sec">PAID BY GCASH OR MAYA (NOT IN THE DRAWER)</div>${tbl(gc)}</div>` : ''}
    <div><div class="sec">CASH PAID OUT FROM THE DRAWER</div>${outs.length ? `<div class="paid-out num">${outs.map(o => `<div class="po"><span><b style="color:#13243A">${mhEsc(o.category)}</b>${o.note || o.vendor ? ` · ${mhEsc(o.note || o.vendor)}` : ''}</span><b>−${mhPeso(o.amount)}</b><span class="att">${o.receipt ? `<span class="attach">${mhIco('clip')}Receipt attached</span>` : `<span class="attach missing">${mhIco('clip')}No receipt</span>`}</span></div>`).join('')}</div>` : '<span style="font-size:16px">None that day.</span>'}</div>
    <div class="calc num"><div class="fund"><span>Change fund at opening</span><span>${mhPeso(exp.fund)}</span></div><div class="in"><span>+ Cash sales</span><span>${mhPeso(exp.sales)}</span></div>${exp.collections ? `<div class="in"><span>+ Cash collected from customers</span><span>${mhPeso(exp.collections)}</span></div>` : ''}${exp.ownerIn ? `<div class="in"><span>+ Cash put in</span><span>${mhPeso(exp.ownerIn)}</span></div>` : ''}<div class="out"><span>− Cash paid out</span><span>${mhPeso((exp.expenses || 0) + (exp.suppliers || 0) + (exp.owner || 0) + (exp.bank || 0))}</span></div><div class="tot"><span>Should be in drawer</span><span>${mhPeso(expected)}</span></div><div><span>Counted</span><b>${mhPeso(counted)}</b></div><div class="tot"><span>Difference</span><span class="t${tn}">${tn === 'g' ? 'Matched' : mhSigned(df)}</span></div></div>
    ${dens ? `<div><div class="sec">BILLS AND COINS COUNTED</div><div class="denoms num">${dens}</div></div>` : ''}
    <div><div class="sec">HOW THIS COUNT IS PROTECTED</div><div class="prot">
      <div><i class="ok">✓</i><b>Blind count</b><span>${mhEsc(who)} didn't see what the drawer should hold.</span></div>
      <div><i class="ok">✓</i><b>Bill by bill</b><span>${dens ? 'Entered per bill and coin, not one total.' : 'Entered as one total.'}</span></div>
      <div><i class="ok">✓</i><b>Locked${rec.at ? ' at ' + new Date(rec.at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit'}) : ''}</b><span>Only you and trusted staff can reopen it; the first count stays on record.</span></div>
      <div><i class="${big ? 'no' : 'ok'}">${big ? '!' : '✓'}</i><b>Second count</b><span>${big ? 'Needed: off by ' + mhPeso(bkSettings().cash_alert || 100) + ' or more.' : 'Not needed this day.'}</span></div></div></div>
    <button class="linkish" type="button" onclick="mhOpenProtect()">Want more? See the optional extra protections ›</button>
    ${dens ? `<details class="saw"><summary>What ${mhEsc(who)} saw when counting</summary><p style="margin-top:8px">Only these boxes. No expected amount, no sales list, no difference.</p><div class="mini num">${dens}</div></details>` : ''}`;
}
function mhHist(c, reopened){
  const ev = [];
  reopened.forEach(r => ev.push({when: r.reopenedAt, what: `Reopened for a recount. First count: ${mhPeso(r.counted && r.counted.cash)} by ${mhEsc(r.by)} (difference ${mhSigned(r.difference)}).`}));
  c.recs.filter(r => r.reviewedAt).forEach(r => ev.push({when: r.reviewedAt, what: `Checked by ${mhEsc(r.reviewedBy || 'the owner')}${r.reviewNote ? ': "' + mhEsc(r.reviewNote) + '"' : ''}`}));
  ev.sort((a, b) => String(b.when).localeCompare(String(a.when)));
  return `<div class="hist">${ev.map(e => `<div class="he"><div class="meta"><span class="when">${new Date(e.when).toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})}</span></div><div class="chg">${e.what}</div></div>`).join('')}
    <div class="he"><div class="meta">${mhAv(c.by, 30)}${mhEsc(c.by)}</div><span>${ev.length ? 'Current count, kept on record.' : 'No changes. This is exactly what was entered.'}</span></div>
    <button class="linkish" type="button" onclick="mhClose(); mhEditHistory()">Every change in the business: Edit history ›</button></div>`;
}

/* who counts */
function mhOpenSched(){ const [y, m] = APP_TODAY.split('-').map(Number); MH.sd = {s: JSON.parse(JSON.stringify(mhSched())), y, m}; MH.sheet = {type: 'sched'}; mhRenderSched(); }
function mhRenderSched(){
  const sd = MH.sd, s = sd.s, all = mhPeople(), by = mhCounts();
  const first = new Date(sd.y, sd.m - 1, 1), dim = new Date(sd.y, sd.m, 0).getDate(), pad = (first.getDay() + 6) % 7;
  let cells = ''; for(let i = 0; i < pad; i++) cells += '<div class="md blank"></div>';
  for(let d = 1; d <= dim; d++){ const k = mhKey(sd.y, sd.m, d), past = k < APP_TODAY, w = past && by[k] ? by[k].by : mhWho(k, s), o = !!(s.over && s.over[k]);
    cells += past ? `<div class="md past"><span class="dn">${d}</span><span class="w">${by[k] ? mhAv(w) + `<span>${mhEsc(mhFirst(w))}</span>` : ''}</span></div>`
      : `<button class="md${k === APP_TODAY ? ' today' : ''}${o ? ' ovr' : ''}" type="button" onclick="mhSchSwap('${k}')" aria-label="${mhLabel(k)}: ${mhEsc(w)}${o ? ', swapped' : ''}. Tap to change."><span class="dn">${d}${k === APP_TODAY ? ' · Today' : ''}</span><span class="w">${mhAv(w)}<span>${mhEsc(mhFirst(w))}</span></span></button>`; }
  const base = mhWho(APP_TODAY, Object.assign({}, s, {over: {}}));
  mhSheet(`${mhHead(`<span class="av" style="background:#FEF3C7;color:#E89B0C;width:48px;height:48px">${mhIco('cash')}</span>`, 'Who counts the cash', 'Set the rule once. The person on duty shows on Home and in the calendar.')}
    <div class="sheet-b" style="max-width:1100px;margin:0 auto;width:100%">
      <div><div class="sec">HOW IT REPEATS</div><div class="modes">${MH_MODES.map(([k, a, b]) => `<button type="button" aria-pressed="${s.mode === k}" onclick="MH.sd.s.mode='${k}'; mhRenderSched()"><b>${a}</b><small>${b}</small></button>`).join('')}</div></div>
      <div><div class="sec">WHO TAKES TURNS ${s.mode === 'same' ? '(THE FIRST ONE COUNTS EVERY DAY)' : '(IN THIS ORDER)'}</div><div class="ppl">${all.map((n, j) => { const i = s.people.indexOf(n); return `<button type="button" aria-pressed="${i >= 0}" onclick="mhSchTog(${j})">${mhAv(n)}${mhEsc(n)}${i >= 0 ? `<i>${i + 1}</i>` : ''}</button>`; }).join('')}</div></div>
      <div><div class="mhead"><button type="button" aria-label="Previous month" onclick="mhSchMonth(-1)">‹</button><b>${mhMonL[sd.m - 1]} ${sd.y}</b><button type="button" aria-label="Next month" onclick="mhSchMonth(1)">›</button><span style="font-size:15px">Tap a future day to swap who counts. Blue dashed = changed by hand.</span></div>
        <div class="month">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="dow">${d}</div>`).join('')}${cells}</div></div>
      <div class="cover"><p>Someone out today? Pick who covers. Only today changes; the schedule carries on tomorrow.</p><div class="ppl">${all.filter(n => n !== base).map(n => `<button type="button" aria-pressed="${s.over && s.over[APP_TODAY] === n}" onclick="MH.sd.s.over=MH.sd.s.over||{}; MH.sd.s.over['${APP_TODAY}']=${JSON.stringify(n).replace(/"/g, '&quot;')}; mhRenderSched()">${mhAv(n)}${mhEsc(n)} covers today</button>`).join('')}${s.over && s.over[APP_TODAY] ? `<button type="button" onclick="delete MH.sd.s.over['${APP_TODAY}']; mhRenderSched()">Undo</button>` : ''}</div></div>
      <div class="sfoot"><button class="btn ghost" type="button" onclick="mhClose()">Cancel</button><button class="btn" type="button" onclick="mhSchSave()">Save schedule</button></div>
    </div>`, 'Who counts the cash');
}
function mhSchMonth(d){ const sd = MH.sd; sd.m += d; if(sd.m > 12){ sd.m = 1; sd.y++; } if(sd.m < 1){ sd.m = 12; sd.y--; } mhRenderSched(); }
function mhSchTog(j){ const n = mhPeople()[j], s = MH.sd.s, i = s.people.indexOf(n); if(i >= 0){ if(s.people.length > 1) s.people.splice(i, 1); } else s.people.push(n); mhRenderSched(); }
function mhSchSwap(k){ const s = MH.sd.s, all = s.people.length ? s.people.concat(mhPeople().filter(n => !s.people.includes(n))) : mhPeople(); s.over = s.over || {};
  const base = mhWho(k, Object.assign({}, s, {over: {}})), cur = mhWho(k, s), nxt = all[(all.indexOf(cur) + 1) % all.length]; if(nxt === base) delete s.over[k]; else s.over[k] = nxt; mhRenderSched(); }
async function mhSchSave(){ const s = MH.sd.s; if(!s.start) s.start = APP_TODAY;
  Object.keys(s.over || {}).forEach(k => { if(k < addDaysIso(APP_TODAY, -60)) delete s.over[k]; });
  if(await bkSaveSettings({count_schedule: s})){ mhClose(); renderMistHome(); showToast('Saved: ' + mhRule(s) + '. ' + mhWho(APP_TODAY, s) + ' counts today.', 'success'); } }

/* optional protections */
function mhOpenProtect(){ MH.sheet = {type: 'prot'}; mhRenderProtect(); }
function mhRenderProtect(){ const P = mhProt();
  mhSheet(`${mhHead(`<span class="av" style="background:#E1EDFA;color:#1A4F8C;width:48px;height:48px">${mhIco('lock')}</span>`, 'Extra protections', 'All optional. Turn on only what fits your shop; switch off anytime.')}
    <div class="sheet-b" style="max-width:980px;margin:0 auto;width:100%"><div class="plist">${MH_PROTS.map(([k, n, d]) => `<div class="prow"><div><b>${n}</b> <span class="pill n" style="font-size:12.5px">Optional</span><p>${d}</p>
      ${k === 'drop' && P.drop ? `<label class="dropamt">Warn me when the drawer should hold over ₱ <input type="number" min="500" step="500" value="${P.dropAmt}" onchange="mhSetProt('dropAmt', Number(this.value)||5000)"></label>` : ''}</div>
      <button class="switch" type="button" role="switch" aria-checked="${!!P[k]}" aria-label="${n}" onclick="mhSetProt('${k}', ${!P[k]})"><i></i></button></div>`).join('')}
      <div class="prow"><div><b>Price lock and receipt after every sale</b> <span class="pill g" style="font-size:12.5px">Part of Nifti</span><p>Staff can't sell under the price list without your OK, and every customer gets a receipt with the real price. Change it in Settings.</p></div></div></div></div>`, 'Extra protections'); }
async function mhSetProt(k, v){ const P = mhProt(); P[k] = v; if(await bkSaveSettings({protections: P})){ mhRenderProtect(); const el = document.getElementById('mhDrawer'); if(el) renderMistHome(); showToast(k === 'dropAmt' ? 'Limit saved.' : (MH_PROTS.find(x => x[0] === k) || [0, k])[1] + ': ' + (v ? 'on' : 'off'), 'success'); } }

renderHomeV2 = renderMistHome;
