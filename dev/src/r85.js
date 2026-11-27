/* ===== Round 85 ===== */
function nf85E(s){ return escapeHtml(String(s == null ? '' : s)); }
function nf85P(n){ return typeof bkPeso === 'function' ? bkPeso(n) : fmtPHP(n); }
function nf85Ic(d, s){ return `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`; }
const NF85I = {shop: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>', truck: '<rect x="1" y="7" width="13" height="10" rx="1"/><path d="M14 10h4l3 3v4h-7"/><circle cx="5.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>', peso: '<path d="M7 20V4h6a4 4 0 0 1 0 8H7"/><path d="M4 8h16M4 11h16"/>', star: '<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.9 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>', chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/>', plus: '<path d="M12 5v14M5 12h14"/>', down: '<path d="m6 9 6 6 6-6"/>', alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'};

/* ---------- Suki score: how reliably someone pays, and a safe utang limit ---------- */
function nf85Suki(g){
  let paid = 0, onTime = 0, bought90 = 0;
  try{
    if(g.src === 'ut'){
      const k = g.key.slice(3);
      (BK.sales || []).filter(s => !s.voidedAt && !s.deletedAt && nf82Norm(s.customer) === k).forEach(s => {
        if(daysBetween(s.date, APP_TODAY) <= 90) bought90 += Number(s.total) || 0;
        if(s.paidWith !== 'credit' && !(s.payments || []).some(p => p.date > s.date)) return;
        if(bkSaleBalance(s) >= 1) return;
        const last = (s.payments || []).map(p => String(p.date || '').slice(0, 10)).sort().pop(); if(!last) return;
        paid++; if(daysBetween(nf82Due(s), last) <= 3) onTime++;
      });
    } else {
      const r = typeof computeBuyerPaymentReliability === 'function' ? computeBuyerPaymentReliability(g.key) : null;
      if(r && r.status === 'ok'){ paid = r.sampleSize; onTime = r.onTimeCount; }
      (purchaseOrders || []).filter(o => o.buyerId === g.key && o.supplierId === ME_SUPPLIER && daysBetween(o.createdDate, APP_TODAY) <= 90 && !['draft', 'cancelled'].includes(o.status)).forEach(o => { bought90 += poTotal(o); });
    }
  }catch(e){}
  let score = paid ? 45 + Math.round(45 * onTime / paid) + Math.min(10, paid) : 55;
  if(g.maxLate > 0) score -= Math.min(35, Math.round(g.maxLate / 2) + 5);
  score = Math.max(5, Math.min(99, score));
  const month = bought90 / 3, f = score >= 80 ? 1.5 : score >= 60 ? 1 : score >= 40 ? .5 : 0;
  const limit = Math.round(Math.max(month, g.total) * f / 500) * 500;
  const tier = score >= 80 ? 'good' : score >= 55 ? 'ok' : 'risk';
  const why = paid ? `Paid ${onTime} of ${paid} past utang on time${g.maxLate > 0 ? `, and is ${g.maxLate} day${g.maxLate === 1 ? '' : 's'} late now` : ''}.` : (g.maxLate > 0 ? `No paid utang on record yet, and is ${g.maxLate} days late now.` : 'No paid utang on record yet, so this is a starting guess.');
  return {score, tier, limit, why, word: tier === 'good' ? 'Pays on time' : tier === 'ok' ? 'Sometimes late' : 'Often late'};
}

/* ---------- Who owes you: clear header, one card per person ---------- */
function nf85Card(g){
  const o = NF82G.open[g.id], kind = g.src === 'ut' ? 'Shop utang' : 'Delivery order' + (g.items.length === 1 ? '' : 's'), sk = nf85Suki(g);
  const pay = g.src === 'ut' ? nf79RpHtml('uc:' + g.id, Math.max(0, g.total - (g.pending || 0)), {utang: true}) : nf79RpHtml(g.key, Math.max(0, g.total - (g.pending || 0)));
  const lim = g.src === 'ut' ? nf82UtLimit(g.name) : 0, esc = JSON.stringify(g.name).replace(/"/g, '&quot;');
  return `<article class="nf85-pc ${g.bucket}${o ? ' open' : ''}" data-g="${g.id}">
    <div class="hd" role="button" tabindex="0" aria-expanded="${!!o}" onclick="nf83Open('${g.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); nf83Open('${g.id}');}">
      <span class="av" aria-hidden="true">${nf85E(nf82Initials(g.name))}</span>
      <div class="nm"><b>${nf85E(g.name)}</b><div class="st">${nf83Status(g)}<span class="k">${kind}${g.items.length > 1 ? ' · ' + g.items.length + ' bills' : ''}${g.sent ? ' · reminded today' : ''}</span></div></div>
      <div class="am"><b>${nf85P(g.total)}</b><span class="suki ${sk.tier}" title="${nf85E(sk.why)}">${nf85Ic(NF85I.star, 13)}Suki ${sk.score}</span></div>
    </div>
    <div class="ac">${nf83Main(g)}<button type="button" class="nf85-tg" onclick="nf83Open('${g.id}')" aria-expanded="${!!o}">${o ? 'Hide' : 'Details'}${nf85Ic(NF85I.down, 16)}</button></div>
    ${o ? `<div class="dt">
      <div class="sk ${sk.tier}"><div class="t"><b>Suki score ${sk.score}/100 · ${sk.word}</b><span>${nf85E(sk.why)}</span></div>
        <div class="l"><small>Safe utang limit</small><b>${sk.limit ? nf85P(sk.limit) : 'Cash only for now'}</b>${g.src === 'ut' && nf82Boss() ? (!sk.limit ? '<em class="cur">Ask for cash next time</em>' : lim === sk.limit ? '<em>Set ✓</em>' : `<button type="button" onclick="nf82SaveLimit(${esc}, ${sk.limit})">${lim ? 'Use this limit' : 'Set this limit'}</button>`) : ''}${lim && lim !== sk.limit ? `<em class="cur">Now ${nf85P(lim)}</em>` : ''}</div></div>
      ${nf83Bills(g)}
      <div class="mo"><button type="button" class="nf82-btn s" onclick="nf79RpOpen(this)">${nf85Ic(NF85I.plus, 15)}Record payment</button><button type="button" class="nf82-btn s" onclick="nf82Remind('${g.id}')">${nf85Ic(NF85I.chat, 15)}Send pay link</button><button type="button" class="nf82-btn s" onclick="nf83Qr('${g.id}')">${nf85Ic(NF85I.qr, 15)}Show QR to scan</button></div>
      ${pay}</div>` : ''}
  </article>`;
}
nf83WhoHtml = function(where){
  const rows = nf83Rows(), home = where === 'home';
  const sum = b => rows.filter(g => b === 'all' || g.bucket === b), tot = b => sum(b).reduce((a, g) => a + g.total, 0);
  const f = home ? 'all' : NF82G.f, list = sum(f).slice(0, home ? 4 : 999);
  const tile = (k, l, cls) => { const n = sum(k).length; return `<button type="button" class="tl ${cls}${!home && f === k ? ' on' : ''}" ${home ? `onclick="NF82G.f='${k}'; go('collections')"` : `onclick="NF82G.f = NF82G.f === '${k}' ? 'all' : '${k}'; nf82Repaint()"`} aria-pressed="${!home && f === k}"><small>${l}</small><b>${nf85P(tot(k))}</b><span>${n} ${n === 1 ? 'person' : 'people'}</span></button>`; };
  let po = 0, ut = 0, nPo = 0, nUt = 0; rows.forEach(g => { if(g.src === 'po'){ po += g.total; nPo++; } else { ut += g.total; nUt++; } });
  const line = (cls, ic, label, amt, n, go2) => `<li class="${cls}"><span class="i">${nf85Ic(ic, 18)}</span><span class="l">${label}</span><b>${nf85P(amt)}</b><em>${n} ${n === 1 ? 'person' : 'people'}</em>${go2 || ''}</li>`;
  return `<section class="panel-card nf83-who nf85-who" aria-labelledby="nf83WhoH${where}">
    <div class="nf85-top"><h2 id="nf83WhoH${where}">Who owes you</h2>
      <ul class="nf85-sum">${line('t', NF85I.peso, 'Total owed to you', tot('all'), rows.length)}${line('u', NF85I.shop, 'Shop utang · walk-in sales', ut, nUt)}${line('d', NF85I.truck, 'Delivery orders not paid', po, nPo)}</ul></div>
    ${rows.length ? `<div class="tls">${tile('late', 'Late', 'r')}${tile('soon', 'Due in 7 days', 'a')}${tile('later', 'Not due yet', 'g')}</div>
      <div class="nf85-ls">${list.length ? list.map(nf85Card).join('') : '<p class="em">Nobody in this group. Tap the tile again to see everyone.</p>'}</div>`
      : `<div class="em">${nf85Ic('<path d="M20 6 9 17l-5-5"/>', 22)}<span>Nobody owes you right now. Utang and unpaid orders show up here.</span></div>`}
    <div class="ft">${home && rows.length > list.length ? `<button type="button" class="nf82-lk" onclick="go('collections')">See all ${rows.length} people ›</button>` : '<span></span>'}<button type="button" class="nf82-btn s" onclick="nf83BringOpen('utang')">${nf85Ic(NF85I.plus, 15)}Someone owes me</button></div>
  </section>`;
};
window.nf83WhoHtml = nf83WhoHtml; try{ nf82CollectHtml = function(where){ return nf83WhoHtml(where); }; }catch(e){}

/* ---------- Walk-in sales: utang lives in one place (Who owes you); this page shows a clear summary ---------- */
function nf85SalesUtang(){
  const pg = document.querySelector('#page-sales.active'); if(!pg) return;
  const old = pg.querySelector('.nf80-ut'); if(!old) return;
  const rows = nf83Rows().filter(g => g.src === 'ut'), tot = rows.reduce((a, g) => a + g.total, 0), late = rows.filter(g => g.bucket === 'late');
  const key = rows.map(g => g.id + g.total).join('|');
  let box = pg.querySelector('.nf85-su'); if(box && box.dataset.k === key){ old.classList.add('nf85-hide'); return; } if(box) box.remove();
  box = document.createElement('section'); box.className = 'panel-card nf85-su'; box.dataset.k = key;
  box.innerHTML = `<div class="h"><div><h2>Utang from walk-in sales</h2><p>All utang is kept in one place: <b>Getting paid → Who owes you</b>.</p></div><div class="tt"><b>${nf85P(tot)}</b><span>${rows.length} ${rows.length === 1 ? 'person' : 'people'}${late.length ? ` · <em>${late.length} late</em>` : ''}</span></div></div>
    ${rows.length ? `<div class="ls">${rows.slice(0, 3).map(g => `<button type="button" class="r ${g.bucket}" onclick="NF82G.open['${g.id}']=true; go('collections')"><span class="n">${nf85E(g.name)}</span>${nf83Status(g)}<b>${nf85P(g.total)}</b></button>`).join('')}</div>` : '<p class="em">Nobody owes you from the counter.</p>'}
    <div class="a"><button type="button" class="nf82-btn p" onclick="go('collections')">Open Who owes you${rows.length > 3 ? ` (${rows.length})` : ''}</button><button type="button" class="nf82-btn s" onclick="nf83BringOpen('utang')">${nf85Ic(NF85I.plus, 15)}Someone owes me</button></div>`;
  old.before(box); old.classList.add('nf85-hide');
}
NF45_AFTER.push(() => { try{ nf85SalesUtang(); }catch(e){ console.warn('nf85 su', e); } });

/* ---------- Expenses: "Where the money went" in plain words, right colours, columns that add up ---------- */
function nf85Where(cats, m){
  m = m || String(APP_TODAY).slice(0, 7);
  const last = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).toLocaleDateString('en-CA'), to = m === String(APP_TODAY).slice(0, 7) ? String(APP_TODAY).slice(0, 10) : last;
  const now = nf82ExpByCat(m + '-01', to);
  let R = null, prev = {}; try{ R = nf74SameRange(m); prev = nf82ExpByCat(R.from, R.to); }catch(e){ R = null; }
  const keys = [...new Set([...Object.keys(now), ...(R ? Object.keys(prev) : [])])].filter(k => (now[k] || 0) >= 1 || (prev[k] || 0) >= 1);
  const total = keys.reduce((a, k) => a + (now[k] || 0), 0), prevT = keys.reduce((a, k) => a + (prev[k] || 0), 0); if(!total && !prevT) return '';
  keys.sort((a, b) => (now[b] || 0) - (now[a] || 0) || (prev[b] || 0) - (prev[a] || 0));
  const cut = keys.length <= 8 ? keys.length : 6, top = keys.slice(0, cut), rest = keys.slice(cut), rows = top.map(k => [k, now[k] || 0, prev[k] || 0]);
  if(rest.length) rows.push(['Everything else', rest.reduce((a, k) => a + (now[k] || 0), 0), rest.reduce((a, k) => a + (prev[k] || 0), 0), true]);
  const days = Math.max(1, Number(to.slice(8, 10)));
  const mon = new Date(m + '-01T00:00:00').toLocaleDateString('en-PH', {month: 'long', year: 'numeric'});
  const chg = (a, b) => { const d = Math.round(a - b); if(!R) return ''; if(Math.abs(d) < 1) return '<span class="c s">Same</span>'; return `<span class="c ${d > 0 ? 'more' : 'less'}">${nf85P(Math.abs(d))} ${d > 0 ? 'more' : 'less'}</span>`; };
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const dT = Math.round(total - prevT), pct = prevT ? Math.round(Math.abs(dT) / prevT * 100) : null;
  const say = R && prevT ? (Math.abs(dT) < 1 ? `You spent the same as ${nf85E(R.label)}.` : `You spent <b class="${dT > 0 ? 'more' : 'less'}">${nf85P(Math.abs(dT))} ${dT > 0 ? 'more' : 'less'}</b> than ${nf85E(R.label)}${pct != null ? ` (${pct}% ${dT > 0 ? 'more' : 'less'})` : ''}.`) : '';
  const shown = rows.filter(r => r[1] >= 1);
  const seg = shown.map(([k, v], i) => { const pc = v / (total || 1) * 100; return `<i style="width:${pc.toFixed(2)}%;background:${NF82_COL[i % NF82_COL.length]}" title="${nf85E(k)}: ${nf85P(v)}">${pc >= 14 ? `<span>${nf85E(k)} ${Math.round(pc)}%</span>` : ''}</i>`; }).join('');
  let ci = 0; const col = {}; shown.forEach(([k]) => { col[k] = NF82_COL[ci++ % NF82_COL.length]; });
  const trs = rows.map(([k, v, pv, off]) => { const pc = total ? Math.round(v / total * 100) : 0;
    return `<button type="button" class="wr" ${off || !(v >= 1) ? 'disabled' : `onclick="bkExpFilter='${esc(k)}'; renderExpensesPage()"`}><span class="k"><i style="background:${col[k] || '#D0D5DD'}"></i>${nf85E(k)}</span><b>${nf85P(v)}</b><em>${pc}%</em>${R ? `<span class="v">${nf85P(pv)}</span>${chg(v, pv)}` : ''}</button>`; }).join('');
  return `<section class="panel-card nf76-where nf82-where nf85-where"><div class="panel-head"><h2>Where the money went</h2></div>
    <div class="top"><div class="tt"><small>${nf85E(mon)}${m === String(APP_TODAY).slice(0, 7) ? ' so far' : ''}</small><b>${nf85P(total)}</b><span>about ${nf85P(total / days)} a day · ${shown.length} kind${shown.length === 1 ? '' : 's'} of expense</span></div>${say ? `<p class="say">${say}</p>` : ''}</div>
    ${seg ? `<div class="stk" role="img" aria-label="Share of spending by kind">${seg}</div>` : ''}
    <div class="tb${R ? '' : ' nr'}"><div class="th"><span>Kind</span><span>This month</span><span>Share</span>${R ? `<span>${nf85E(R.label)}</span><span>Difference</span>` : ''}</div>${trs}
      <div class="tr"><span class="k">Total</span><b>${nf85P(total)}</b><em>100%</em>${R ? `<span class="v">${nf85P(prevT)}</span>${chg(total, prevT)}` : ''}</div></div>
    <p class="nf76-wn">Tap a kind to see only its expenses. <span class="more">Red</span> = you spent more · <span class="less">green</span> = you spent less.</p></section>`;
}
try{ nf74Where = nf85Where; window.nf74Where = nf85Where; nf82Where = nf85Where; window.nf82Where = nf85Where; if(typeof nf76Where === 'function'){ nf76Where = nf85Where; window.nf76Where = nf85Where; } }catch(e){}

/* ---------- Prices: change prices in 3 steps, with an optional end date, and edit/end/cancel anything you sent ---------- */
Object.assign(NF75PC, {endMode: NF75PC.endMode || 'stay', endPreset: NF75PC.endPreset || 'week', endDate: NF75PC.endDate || ''});
function nf85Day(d){ try{ return new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'}); }catch(e){ return d; } }
function nf85StartQuick(){ const nm = (() => { const d = new Date(APP_TODAY + 'T00:00:00'); d.setMonth(d.getMonth() + 1, 1); return d.toLocaleDateString('en-CA'); })();
  return [['today', 'Today', APP_TODAY], ['tom', 'Tomorrow', addDaysIso(APP_TODAY, 1)], ['week', 'In a week', addDaysIso(APP_TODAY, 7)], ['next', '1st of next month', nm]]; }
function nf85EndQuick(from){ const eom = (() => { const d = new Date(from + 'T00:00:00'); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString('en-CA'); })();
  return [['3d', '3 days', addDaysIso(from, 3)], ['week', '1 week', addDaysIso(from, 7)], ['2w', '2 weeks', addDaysIso(from, 14)], ['eom', 'End of the month', eom > from ? eom : addDaysIso(from, 30)]]; }
function nf85EndDate(){ if(NF75PC.endMode !== 'until') return null; const from = NF75PC.date || APP_TODAY; if(NF75PC.endPreset === 'date') return NF75PC.endDate && NF75PC.endDate > from ? NF75PC.endDate : null; const q = nf85EndQuick(from).find(x => x[0] === NF75PC.endPreset); return q ? q[2] : addDaysIso(from, 7); }
nf75Composer = function(el, cat, history, buyersN){
  NF75PC.cat = cat; NF75PC.history = history;
  if(!NF75PC.date || NF75PC.date < APP_TODAY){ const q = nf85StartQuick().find(x => x[0] === NF75PC.preset) || nf85StartQuick()[2]; NF75PC.preset = q[0]; NF75PC.date = q[2]; }
  if(!cat.length){ el.innerHTML = `<div class="panel-card nf75-pc"><b>Add your items and prices first</b><p class="nf45-sm">Stock → Add items. Then you can change prices here.</p></div>`; return; }
  el.innerHTML = `<div class="panel-card nf75-pc nf85-pcx"><div class="nf75-pch"><b>Change your selling prices</b><span>Type the new price, pick when it starts (and ends, for a sale), and Nifti tells your buyers.</span></div>
      <div class="nf85-step"><span>1</span><b>New prices</b></div>
      <div class="nf75-pcl">${cat.map((c, i) => `<label class="nf75-pci"><span class="nm"><b>${nf85E(c.product)}</b><small>Now ${nf85P(c.price)}${c.unit ? '/' + nf85E(c.unit) : ''}</small></span><span class="nf85-pin"><em>₱</em><input type="text" inputmode="decimal" placeholder="New price" data-pc-i="${i}" value="${NF75PC.vals[i] != null ? nf85E(NF75PC.vals[i]) : ''}" oninput="NF75PC.vals[${i}]=this.value.replace(/[^\\d.]/g,''); nf75PcLive()"></span><span class="d" data-pc-d="${i}"></span></label>`).join('')}</div>
      <div class="nf85-step"><span>2</span><b>When</b></div><div id="nf75PcWhen"></div>
      <div class="nf85-step"><span>3</span><b>Who hears about it</b></div><div id="nf75PcWho"></div>
      <textarea id="pcNote" class="nf75-note" rows="2" maxlength="300" placeholder="Reason (optional), e.g. Cement plant raised prices" oninput="NF75PC.note=this.value; nf75PcLive()">${nf85E(NF75PC.note)}</textarea>
      <div id="nf75PcSend"></div></div>
    ${nf85SentHtml(history)}`;
  nf75PcWhen(); nf75PcWho(); nf75PcLive();
};
nf75PcWhen = function(){
  const box = document.getElementById('nf75PcWhen'); if(!box) return; const d = NF75PC.date || APP_TODAY, end = nf85EndDate();
  const ch = nf75PcChanges(), ex = ch[0] || null;
  const chip = (on, label, sub, js) => `<button type="button" class="${on ? 'on' : ''}" onclick="${js}"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
  box.innerHTML = `<div class="nf85-q">Starts</div><div class="nf85-chips">${nf85StartQuick().map(([k, l, v]) => chip(NF75PC.preset === k, l, k === 'today' ? 'no notice' : nf85Day(v), `NF75PC.preset='${k}'; NF75PC.date='${v}'; nf75PcWhen(); nf75PcLive()`)).join('')}
      <label class="nf85-dp ${NF75PC.preset === 'date' ? 'on' : ''}"><b>${NF75PC.preset === 'date' ? nf85E(nf85Day(d)) : 'Pick a date'}</b><small>calendar</small><input type="date" min="${APP_TODAY}" value="${d}" onchange="if(this.value){ NF75PC.preset='date'; NF75PC.date=this.value; nf75PcWhen(); nf75PcLive(); }"></label></div>
    <div class="nf85-q">How long?</div>
    <div class="nf85-mode">${[['stay', 'Stays at the new price', 'Until you change it again'], ['until', 'For a limited time', 'A sale or promo, then back to the usual price']].map(([k, a, b]) => `<button type="button" class="${NF75PC.endMode === k ? 'on' : ''}" onclick="NF75PC.endMode='${k}'; nf75PcWhen(); nf75PcLive()"><i></i><span><b>${a}</b><small>${b}</small></span></button>`).join('')}</div>
    ${NF75PC.endMode === 'until' ? `<div class="nf85-q">Ends after</div><div class="nf85-chips">${nf85EndQuick(d).map(([k, l, v]) => chip(NF75PC.endPreset === k, l, nf85Day(v), `NF75PC.endPreset='${k}'; nf75PcWhen(); nf75PcLive()`)).join('')}
      <label class="nf85-dp ${NF75PC.endPreset === 'date' ? 'on' : ''}"><b>${NF75PC.endPreset === 'date' && end ? nf85E(nf85Day(end)) : 'Pick a date'}</b><small>calendar</small><input type="date" min="${addDaysIso(d, 1)}" value="${end || addDaysIso(d, 7)}" onchange="if(this.value){ NF75PC.endPreset='date'; NF75PC.endDate=this.value; nf75PcWhen(); nf75PcLive(); }"></label></div>` : ''}
    <div class="nf85-tl"><div class="s now"><small>Today</small><b>${ex ? nf85P(ex.c.price) : 'Current price'}</b></div><i></i>
      <div class="s new"><small>${d <= APP_TODAY ? 'From today' : 'From ' + nf85E(nf85Day(d))}</small><b>${ex ? nf85P(ex.v) : 'New price'}</b></div>
      ${end ? `<i></i><div class="s back"><small>From ${nf85E(nf85Day(end))}</small><b>${ex ? nf85P(ex.c.price) : 'Usual price'}</b><em>back to usual</em></div>` : ''}</div>
    ${d <= APP_TODAY ? '<p class="nf85-warn">Starts today, so buyers get no notice. Fine for a price drop; a price increase can surprise them.</p>' : `<p class="nf85-ok">${daysBetween(APP_TODAY, d)} day${daysBetween(APP_TODAY, d) === 1 ? '' : 's'} notice. Orders sent before then keep today's price.</p>`}`;
};
nf75PcLive = function(){
  (NF75PC.cat || []).forEach((c, i) => { const el = document.querySelector(`[data-pc-d="${i}"]`); if(!el) return; const v = Number(NF75PC.vals[i]); if(!(v > 0) || Math.abs(v - c.price) < .01){ el.innerHTML = ''; return; } const up = v > c.price, pct = Math.round((v - c.price) / c.price * 1000) / 10; el.innerHTML = `<em class="${up ? 'up' : 'dn'}">${up ? '▲ ' + Math.abs(pct) + '% higher' : '▼ ' + Math.abs(pct) + '% lower'}</em>`; });
  { const ch0 = nf75PcChanges(), k = ch0[0] ? ch0[0].c.product + '|' + ch0[0].v : ''; const tl = document.querySelector('#nf75PcWhen .nf85-tl'); if(tl && tl.dataset.k !== k){ nf75PcWhen(); const t2 = document.querySelector('#nf75PcWhen .nf85-tl'); if(t2) t2.dataset.k = k; } }
  const box = document.getElementById('nf75PcSend'); if(!box) return; const ch = nf75PcChanges(), n = nf75PcPicked().length, d = NF75PC.date || APP_TODAY, end = nf85EndDate();
  const sum = ch.length ? `<div class="nf85-sumx"><b>What happens</b><ul>${ch.slice(0, 4).map(x => `<li><span>${nf85E(x.c.product)}</span> ${nf85P(x.c.price)} → <b>${nf85P(x.v)}</b> ${d <= APP_TODAY ? 'from today' : 'from ' + nf85E(nf85Day(d))}${end ? `, back to ${nf85P(x.c.price)} on ${nf85E(nf85Day(end))}` : ''}</li>`).join('')}${ch.length > 4 ? `<li>and ${ch.length - 4} more</li>` : ''}</ul><span>${n} buyer${n === 1 ? '' : 's'} get a message now. You can edit or end it any time below.</span></div>` : '';
  box.innerHTML = `${sum}${ch.length ? `<details class="nf75-prev"><summary>See the message buyers get</summary><pre>${nf85E(priceMessageText(ch, d, (NF75PC.note || '') + (end ? ` (Until ${nf85Day(end)}, then back to the usual price.)` : '')))}</pre></details>` : ''}
    <button type="button" class="btn btn-primary nf75-send" ${!ch.length || !n ? 'disabled' : ''} onclick="nf75SendPrices()">${!ch.length ? 'Type a new price in step 1' : !n ? 'Pick at least one buyer' : `Send ${ch.length} new price${ch.length === 1 ? '' : 's'} to ${n} buyer${n === 1 ? '' : 's'}`}</button>`;
};
nf75SendPrices = async function(){
  const ch = nf75PcChanges(), ids = nf75PcPicked(), date = NF75PC.date || APP_TODAY, note = String(NF75PC.note || '').trim(), end = nf85EndDate();
  if(!ch.length || !ids.length) return;
  if(!myBusiness){
    ch.forEach(x => demoPriceChanges.unshift({id: 'pc' + Date.now() + x.c.product, product: x.c.product, unit: x.c.unit || '', old_price: x.c.price, new_price: x.v, effective_date: date, ends_on: end, applied_at: date <= APP_TODAY ? new Date().toISOString() : null, audience: NF75PC.aud === 'all' ? 'all' : 'picked', sent_to: ids.length, sent_buyer_ids: ids}));
    if(date <= APP_TODAY) ch.forEach(x => { x.c.price = x.v; x.c.updatedAt = APP_TODAY; });
    nf85DemoTell(ids, priceMessageText(ch, date, note + (end ? ` (Until ${nf85Day(end)}, then back to the usual price.)` : '')));
    NF75PC.vals = {}; NF75PC.note = ''; nf84Undo(`Sent to ${ids.length} buyer${ids.length > 1 ? 's' : ''}. You can edit or end it under "Sent".`); renderPricesPage(); return;
  }
  const { data, error } = await sb.rpc('announce_price_changes2', {p_changes: ch.map(x => ({product: x.c.product, new_price: x.v})), p_effective: date, p_note: note || null, p_buyers: NF75PC.aud === 'all' ? null : ids, p_ends: end});
  if(error){ showToast(error.message, 'error'); return; }
  if(date <= APP_TODAY) ch.forEach(x => { x.c.price = x.v; x.c.updatedAt = APP_TODAY; });
  priceChangesCache = null; NF75PC.vals = {}; NF75PC.note = '';
  nf84Undo(`Sent to ${data.buyers} buyer${data.buyers === 1 ? '' : 's'}. You can edit or end it under "Sent".`); renderPricesPage();
};
window.nf75Composer = nf75Composer; window.nf75PcWhen = nf75PcWhen; window.nf75PcLive = nf75PcLive; window.nf75SendPrices = nf75SendPrices;
function nf85DemoTell(ids, msg){ try{ getConversations().filter(c => !ids || ids.includes(c.id) || ids.includes(c.buyerId)).forEach(c => sendTextInChat(c.id, msg)); }catch(e){} }
function nf85PcState(h){
  if(h.cancelled_at) return {k: 'off', t: 'Cancelled'};
  if(h.ended_at) return {k: 'off', t: 'Ended ' + nf85Day(h.ends_on || String(h.ended_at).slice(0, 10))};
  const live = h.applied_at || h.effective_date <= APP_TODAY;
  if(live) return {k: 'live', t: h.ends_on ? 'On now · ends ' + nf85Day(h.ends_on) : 'On now · since ' + nf85Day(h.effective_date)};
  return {k: 'soon', t: 'Starts ' + nf85Day(h.effective_date) + (h.ends_on ? ' · until ' + nf85Day(h.ends_on) : '')};
}
function nf85SentHtml(history){
  const list = (history || []).filter(h => !h.cancelled_at && (!h.ended_at || daysBetween(String(h.ended_at).slice(0, 10), APP_TODAY) <= 14)).slice(0, 8);
  return `<div class="nf75-sent nf85-sent"><div class="nf85-sh"><b>Sent price changes</b><span>Edit, end or cancel any of these. Buyers are told right away.</span></div>${list.length ? list.map(h => { const st = nf85PcState(h), up = h.old_price != null && Number(h.new_price) > Number(h.old_price), pct = h.old_price ? Math.round((h.new_price - h.old_price) / h.old_price * 1000) / 10 : null;
    return `<div class="nf85-srow ${st.k}"><div class="nm"><b>${nf85E(h.product)}</b><small>${h.audience === 'picked' ? (h.sent_to || (h.sent_buyer_ids || []).length || 0) + ' chosen buyers' : 'All buyers'}</small></div>
      <div class="pr">${h.old_price != null ? `<span class="old">${nf85P(h.old_price)}</span><i>→</i>` : ''}<b>${nf85P(h.new_price)}</b>${pct != null ? `<em class="${up ? 'up' : 'dn'}">${up ? '▲' : '▼'} ${Math.abs(pct)}%</em>` : ''}</div>
      <span class="st ${st.k}">${nf85E(st.t)}</span>
      <div class="ac">${st.k === 'soon' ? `<button type="button" onclick="nf85PcEdit('${h.id}')">Edit</button><button type="button" class="x" onclick="nf85PcEnd('${h.id}')">Cancel</button>` : st.k === 'live' ? `<button type="button" onclick="nf85PcEdit('${h.id}')">${h.ends_on ? 'Change end date' : 'Set an end date'}</button><button type="button" class="x" onclick="nf85PcEnd('${h.id}')">End now</button>` : ''}</div></div>`; }).join('') : '<p class="nf75-none">Nothing sent yet.</p>'}</div>`;
}
function nf85PcFind(id){ return (myBusiness ? priceChangesCache : demoPriceChanges || []).find(h => String(h.id) === String(id)); }
const NF85E = {};
function nf85PcEdit(id){
  const h = nf85PcFind(id); if(!h) return; const live = !!(h.applied_at || h.effective_date <= APP_TODAY);
  Object.assign(NF85E, {id, price: String(h.new_price), start: h.effective_date, end: h.ends_on || '', live});
  nf85PcEditPaint();
}
function nf85PcEditPaint(){
  const h = nf85PcFind(NF85E.id); if(!h) return; const live = NF85E.live;
  nf45Pop('nf85PcE', `${live ? 'Change how long' : 'Edit'}: ${nf85E(h.product)}`, `<div class="nf85-ed">
      <p class="lead">${live ? `On now at <b>${nf85P(h.new_price)}</b> (usual ${nf85P(h.old_price)}).` : `Usual price ${nf85P(h.old_price)}.`} Buyers who were told get a message about the change.</p>
      ${live ? '' : `<label class="f"><span>New price</span><span class="nf85-pin"><em>₱</em><input type="text" inputmode="decimal" value="${nf85E(NF85E.price)}" oninput="NF85E.price=this.value.replace(/[^\\d.]/g,'')"></span></label>
      <label class="f"><span>Starts</span><input type="date" min="${APP_TODAY}" value="${NF85E.start}" onchange="NF85E.start=this.value"></label>`}
      <div class="f"><span>Ends</span><div class="nf85-mode sm"><button type="button" class="${!NF85E.end ? 'on' : ''}" onclick="NF85E.end=''; nf85PcEditPaint()"><i></i><span><b>Stays</b><small>no end date</small></span></button><button type="button" class="${NF85E.end ? 'on' : ''}" onclick="NF85E.end=NF85E.end||addDaysIso(NF85E.live?APP_TODAY:NF85E.start,7); nf85PcEditPaint()"><i></i><span><b>Ends on a date</b><small>then back to ${nf85P(h.old_price)}</small></span></button></div>
        ${NF85E.end ? `<input type="date" min="${addDaysIso(live ? APP_TODAY : NF85E.start, 1)}" value="${NF85E.end}" onchange="NF85E.end=this.value">` : ''}</div></div>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf85PcE')">Close</button><button type="button" class="btn btn-primary" onclick="nf85PcEditSave()">Save and tell buyers</button>`);
}
async function nf85PcEditSave(){
  const h = nf85PcFind(NF85E.id); if(!h) return; const price = Number(NF85E.price), live = NF85E.live, end = NF85E.end || null, start = live ? h.effective_date : NF85E.start;
  if(!live && !(price > 0)){ showToast('Type the new price.', 'warn'); return; } if(end && end <= (live ? APP_TODAY : start)){ showToast('The end date must be after the start.', 'warn'); return; }
  if(!myBusiness){
    const was = Object.assign({}, h); if(!live){ h.new_price = price; h.effective_date = start; } h.ends_on = end;
    nf85DemoTell(h.audience === 'picked' ? h.sent_buyer_ids : null, `📢 Update: ${h.product} ${live ? `at ${nf85P(h.new_price)} ${end ? 'lasts until ' + nf85Day(end) + ', then goes back to ' + nf85P(h.old_price) : 'stays until further notice'}` : `will be ${nf85P(price)} from ${nf85Day(start)}${end ? ' until ' + nf85Day(end) : ''}`}.`);
    slClose('nf85PcE'); renderPricesPage(); nf84Undo('Saved. Buyers were told.', () => { Object.assign(h, was); renderPricesPage(); }); return;
  }
  const { error } = await sb.rpc('edit_price_change', {p_id: h.id, p_new_price: live ? h.new_price : price, p_effective: start, p_ends: end, p_note: null});
  if(error){ showToast(error.message, 'error'); return; }
  slClose('nf85PcE'); priceChangesCache = null; renderPricesPage(); nf84Undo('Saved. Buyers were told.');
}
async function nf85PcEnd(id){
  const h = nf85PcFind(id); if(!h) return; const live = !!(h.applied_at || h.effective_date <= APP_TODAY);
  if(!confirm(live ? `End the new price for ${h.product} now? It goes back to ${nf85P(h.old_price)} today and buyers are told.` : `Cancel the new price for ${h.product}? Buyers are told it stays at ${nf85P(h.old_price)}.`)) return;
  if(!myBusiness){
    if(live){ h.ended_at = new Date().toISOString(); h.ends_on = APP_TODAY; const c = (myCatalog || []).find(x => x.product === h.product); if(c && h.old_price != null) c.price = h.old_price; } else h.cancelled_at = new Date().toISOString();
    nf85DemoTell(h.audience === 'picked' ? h.sent_buyer_ids : null, live ? `📢 Update: ${h.product} is back to ${nf85P(h.old_price)} starting today.` : `📢 Update: the new price for ${h.product} is cancelled. It stays at ${nf85P(h.old_price)}.`);
    renderPricesPage(); nf84Undo(live ? `${h.product} is back to ${nf85P(h.old_price)}. Buyers were told.` : 'Cancelled. Buyers were told.'); return;
  }
  const { error } = await sb.rpc('end_price_change', {p_id: id}); if(error){ showToast(error.message, 'error'); return; }
  priceChangesCache = null; try{ if(typeof loadMyBusinessContext === 'function') await loadMyBusinessContext(); }catch(e){} renderPricesPage(); nf84Undo(live ? 'Ended. Buyers were told.' : 'Cancelled. Buyers were told.');
}

/* ---------- Deliveries: "Pending" not "To go"; move any stop to another day or rider; Done goes straight back to Pending ---------- */
if(typeof nf75Board === 'function' && !nf75Board._nf85){
  const _b85 = nf75Board;
  nf75Board = function(body, routes){
    const r = _b85.apply(this, arguments);
    try{
      body.querySelectorAll('.nf75-lane.t-y header b').forEach(b => { if(b.textContent.trim() === 'To go') b.textContent = 'Pending'; });
      body.querySelectorAll('.nf75-lane.t-r header small').forEach(s => { s.textContent = 'Move it back to Pending or to another day'; });
      const planner = typeof isRoutePlanner !== 'function' || isRoutePlanner();
      body.querySelectorAll('.nf75-sc').forEach(card => {
        const m = (card.getAttribute('onclick') || '').match(/nf45StopOpen\('([^']+)', '([^']+)'\)/); if(!m || card.querySelector('.nf85-sa')) return;
        const [, rid, sid] = m, rt = (routes || []).find(x => x.id === rid), s = rt && (rt.stops || []).find(x => x.id === sid); if(!s) return;
        const st = nfStopState(rt, s), foot = card.querySelector('footer'); if(!foot) return;
        foot.querySelectorAll('button').forEach(b => { if(/Try again/.test(b.textContent)) b.remove(); });
        const acts = document.createElement('div'); acts.className = 'nf85-sa';
        if(st === 'done' || st === 'fail') acts.innerHTML = `<button type="button" onclick="event.stopPropagation(); reopenStop('${sid}')">↩ Back to Pending</button>`;
        else if(planner) acts.innerHTML = `<button type="button" onclick="event.stopPropagation(); nf85StopMove('${rid}', '${sid}')">Change day or rider</button>`;
        if(acts.innerHTML) card.appendChild(acts);
      });
    }catch(e){ console.warn('nf85 board', e); }
    return r;
  };
  nf75Board._nf85 = 1; window.nf75Board = nf75Board;
}
const NF85M = {};
function nf85StopMove(rid, sid){
  const rt = (routesCache || []).find(x => x.id === rid), s = rt && (rt.stops || []).find(x => x.id === sid); if(!s) return;
  Object.assign(NF85M, {rid, sid, date: rt.route_date, driver: rt.driver_member_id});
  nf85StopMovePaint();
}
function nf85StopMovePaint(){
  const rt = (routesCache || []).find(x => x.id === NF85M.rid), s = rt && (rt.stops || []).find(x => x.id === NF85M.sid); if(!s) return;
  const team = (typeof nf75Team === 'function' ? nf75Team() : []).filter(m => m.id);
  const days = [['Today', APP_TODAY], ['Tomorrow', addDaysIso(APP_TODAY, 1)], ['In 2 days', addDaysIso(APP_TODAY, 2)]];
  nf45Pop('nf85Mv', `Move the delivery to ${nf85E(s.buyer_name)}`, `<div class="nf85-ed">
      <p class="lead">Now: <b>${nf85E(rt.route_date === APP_TODAY ? 'today' : nf85Day(rt.route_date))}</b> with <b>${nf85E(rt.driver_name || 'no rider')}</b>. Pick a new day, a new rider, or both.</p>
      <div class="f"><span>Day</span><div class="nf85-chips">${days.map(([l, d]) => `<button type="button" class="${NF85M.date === d ? 'on' : ''}" onclick="NF85M.date='${d}'; nf85StopMovePaint()"><b>${l}</b><small>${nf85E(nf85Day(d))}</small></button>`).join('')}<label class="nf85-dp ${!days.some(x => x[1] === NF85M.date) ? 'on' : ''}"><b>${!days.some(x => x[1] === NF85M.date) ? nf85E(nf85Day(NF85M.date)) : 'Pick a date'}</b><small>calendar</small><input type="date" min="${APP_TODAY}" value="${NF85M.date}" onchange="if(this.value){ NF85M.date=this.value; nf85StopMovePaint(); }"></label></div></div>
      <div class="f"><span>Rider</span><div class="nf85-chips">${team.map(m => `<button type="button" class="${NF85M.driver === m.id ? 'on' : ''}" onclick="NF85M.driver='${m.id}'; nf85StopMovePaint()"><b>${nf85E(String(m.name).split(' ')[0])}</b><small>${nf85E(m.role || 'Team')}</small></button>`).join('')}</div></div></div>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf85Mv')">Close</button><button type="button" class="btn btn-outline nf85-del" onclick="nf85StopMoveSave(true)">Remove from deliveries</button><button type="button" class="btn btn-primary" onclick="nf85StopMoveSave()">Save</button>`);
}
async function nf85StopMoveSave(remove){
  const rt = (routesCache || []).find(x => x.id === NF85M.rid), s = rt && (rt.stops || []).find(x => x.id === NF85M.sid); if(!s) return;
  if(!remove && NF85M.date === rt.route_date && NF85M.driver === rt.driver_member_id){ slClose('nf85Mv'); return; }
  if(remove && !confirm(`Take ${s.buyer_name} off the deliveries? The order stays; you can add it again any time.`)) return;
  const payload = {buyer_business_id: s.buyer_business_id, buyer_name: s.buyer_name, address: s.address || '', phone: s.phone || '', deliver_po_ids: s.deliver_po_ids || [], collect_po_ids: s.collect_po_ids || [], items: s.items || [], note: s.note || ''};
  const keep = (rt.stops || []).filter(x => x.status === 'pending' && x.id !== s.id).map(x => ({buyer_business_id: x.buyer_business_id, buyer_name: x.buyer_name, address: x.address || '', phone: x.phone || '', deliver_po_ids: x.deliver_po_ids || [], collect_po_ids: x.collect_po_ids || [], items: x.items || [], note: x.note || ''}));
  if(!myBusiness){
    rt.stops = rt.stops.filter(x => x.id !== s.id); if(!rt.stops.length){ const i = demoRoutes.indexOf(rt); if(i > -1) demoRoutes.splice(i, 1); }
    if(!remove) await nf75AddStops(NF85M.date, NF85M.driver, [payload]);
  } else {
    const { error } = await sb.rpc('save_route', {p_route: rt.id, p_date: rt.route_date, p_driver: rt.driver_member_id, p_vehicle: rt.vehicle || null, p_stops: keep});
    if(error){ showToast(error.message, 'error'); return; }
    await loadRoutes(true);
    if(!remove && !(await nf75AddStops(NF85M.date, NF85M.driver, [payload]))) return;
  }
  slClose('nf85Mv'); renderRoutesPage();
  const who = ((typeof nf75Team === 'function' ? nf75Team() : []).find(m => m.id === NF85M.driver) || {}).name || 'the rider';
  nf84Undo(remove ? `${s.buyer_name} taken off the deliveries.` : `${s.buyer_name} moved to ${NF85M.date === APP_TODAY ? 'today' : nf85Day(NF85M.date)} with ${String(who).split(' ')[0]}.`);
}

/* ---------- Messages: the chat always fits the screen; one-tap actions above the message box ---------- */
function nf85MsgFit(){
  const sh = document.querySelector('#page-messages.active .messages-shell'); if(!sh) return;
  const top = sh.getBoundingClientRect().top + window.scrollY, nav = innerWidth <= 980 ? ((document.getElementById('bottomNav') || {}).offsetHeight || 64) : 0;
  const h = Math.max(420, Math.round(innerHeight - top - nav - 16)); if(Math.abs(sh.offsetHeight - h) > 2) sh.style.setProperty('height', h + 'px', 'important');
}
window.addEventListener('resize', () => { try{ nf85MsgFit(); }catch(e){} });
NF45_AFTER.push(() => { try{ nf85MsgFit(); nf85MsgQA(); }catch(e){} });
setInterval(() => { try{ if(document.querySelector('#page-messages.active')){ nf85MsgFit(); nf85MsgQA(); } }catch(e){} }, 1000);
const NF85_REPLIES = ['Salamat po!', 'Noted po.', 'On the way na po.', 'Ready na po, pwede na kunin.', 'Magkano po ang order ninyo?'];
function nf85MsgQA(){
  const inp = document.getElementById('msgInput'); if(!inp) return; const comp = inp.closest('.msg-composer') || inp.parentElement.parentElement;
  const id = typeof activeConvId !== 'undefined' ? activeConvId : null; const kind = id ? nf84KindOf(id) : null; const key = (id || '') + kind;
  let qa = document.querySelector('.nf85-qa'); if(qa && qa.dataset.k === key) return; if(qa) qa.remove(); if(!id) return;
  const conv = [...(supplierConversations || []), ...(buyerConversations || [])].find(c => c.id === id), name = (conv && conv.name) || '', esc = String(name).replace(/'/g, "\\'");
  qa = document.createElement('div'); qa.className = 'nf85-qa'; qa.dataset.k = key;
  qa.innerHTML = (kind === 'customer' ? `<button type="button" class="a" onclick="nf84PayLink('${id}', '${esc}')">Send pay link</button><button type="button" class="a" onclick="nfoNew(true, '${id}')">New order for them</button>` : kind === 'supplier' ? `<button type="button" class="a" onclick="nfoNew(false, '${id}')">Order from them</button>` : '')
    + NF85_REPLIES.map(t => `<button type="button" onclick="nf85Reply(${JSON.stringify(t).replace(/"/g, '&quot;')})">${nf85E(t)}</button>`).join('');
  comp.before(qa);
}
function nf85Reply(t){ const i = document.getElementById('msgInput'); if(!i) return; i.value = (i.value ? i.value.trim() + ' ' : '') + t; i.focus(); try{ autoResizeComposer(i); }catch(e){} }

/* ---------- Monthly summary & money pages: "see the lines" opens them in the middle, no jump to another tab ---------- */
function nf85LedgerPop(code){
  if(typeof lgGlHtml !== 'function' || typeof LGV === 'undefined') return false;
  const was = LGV.acct; LGV.acct = code; let html = '';
  try{ html = lgGlHtml(); }catch(e){ LGV.acct = was; return false; } LGV.acct = was;
  html = html.replace(/<div class="panel-head">[\s\S]*?<\/div><\/div>/, '').replace(/^<section class="panel-card bk-list">/, '<div class="nf85-glp">').replace(/<\/section>$/, '</div>');
  const acc = typeof lgAcct === 'function' ? lgAcct(code) : {name: code};
  nf45Pop('nf85Gl', `${nf85E(acc.name || code)} · ${nf85E((typeof lgRangeNow === 'function' ? lgRangeNow().label : '') || 'this period')}`, html,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf85Gl')">Close</button><button type="button" class="btn btn-primary" onclick="slClose('nf85Gl'); LGV.acct='${code}'; LGV.tab='gl'; go('ledger'); renderLedgerPage()">Open the full ledger</button>`, {wide: true});
  return true;
}
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[onclick*="LGV.tab=\'gl\'"]'); if(!el) return;
  if(el.closest('#nf85Gl, [role=tablist], .lg-tabs, .nf23-ltabs, .nf75-lgt, .nf-tabcards, nav, .sidebar')) return; if(typeof LGV !== 'undefined' && LGV.tab === 'gl' && document.querySelector('#page-ledger.active')) return;
  const m = (el.getAttribute('onclick') || '').match(/LGV\.acct='([^']+)'/); if(!m) return;
  if(nf85LedgerPop(m[1])){ e.preventDefault(); e.stopPropagation(); }
}, true);

/* ---------- Sidebar badge = what you can act on: Money overview lists its red alerts at the top, each with a button ---------- */
function nf85MoneyAttn(){
  const pg = document.querySelector('#page-money.active'); if(!pg || typeof bkFlags !== 'function' || !BK.loaded) return;
  let flags = []; try{ flags = bkFlags().filter(f => f.lvl === 'red'); }catch(e){}
  const key = flags.map(f => f.k + f.v).join('|'); let box = pg.querySelector('.nf85-attn');
  if(box && box.dataset.k === key) return; if(box) box.remove(); if(!flags.length) return;
  box = document.createElement('section'); box.className = 'panel-card nf85-attn'; box.dataset.k = key;
  box.innerHTML = `<div class="h"><b>Needs your attention</b><span>${flags.length}</span></div>` + flags.map((f, i) => `<div class="r"><span class="d"></span><div class="t"><b>${nf85E(f.t)}: ${nf85E(f.v)}</b><small>${nf85E(f.s || '')}</small></div><button type="button" class="nf82-btn p" data-i="${i}">Fix it</button></div>`).join('');
  box.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { const f = flags[Number(b.dataset.i)]; try{ (0, eval)(f.a); }catch(e){ console.warn(e); } });
  const head = pg.querySelector('.page-head'); if(head) head.after(box); else pg.prepend(box);
}
NF45_AFTER.push(() => { try{ nf85MoneyAttn(); }catch(e){} });

/* ---------- Demo: show at most 3 example rows per list (See all opens the rest), so pages never feel crowded ---------- */
try{ if(typeof nf26Cap === 'function' && !nf26Cap._nf85){ const o = nf26Cap; nf26Cap = function(page){ if(typeof myBusiness !== 'undefined' && myBusiness) return o.apply(this, arguments); const ph = nf26Phone; nf26Phone = () => true; try{ return o.apply(this, arguments); } finally { nf26Phone = ph; } }; nf26Cap._nf85 = 1; window.nf26Cap = nf26Cap; } }catch(e){}

/* ---------- Morning briefing: your shop's numbers turned into today's plan, one coach-like card ---------- */
const NF85_TIPS = {
  collect: ['Remind on the due day, not a week after. People pay the first person who asks.', 'Offer a small "pay today" option: ₱100 off if they settle the whole utang this week.', 'Send the pay link with the exact amount. A clear number gets paid faster than "may utang ka pa".', 'Before giving new utang, check the suki score. Good payers earn more room; late payers pay cash first.'],
  margin: ['Raise prices a little on items people buy every week, not on the big-ticket items they compare.', 'Check your supplier cost every time it changes. A ₱5 jump on cement wipes out a day of profit if your price stays the same.', 'Bundle a slow item with a fast seller (rebar + tie wire). It moves stock and protects margin.', 'Stop discounting by habit. Give discounts only for cash payment or big orders.'],
  stock: ['Order your fast sellers when they hit 7 days left, not when the shelf is empty.', 'Count your top 5 items every week. Most missing stock hides in the items that move most.', 'Buy slow items in smaller lots. Cash sitting on the shelf earns nothing.'],
  sell: ['Message 3 regular customers who haven\'t ordered in 3 weeks. A simple "Kumusta po, may kailangan po ba kayo?" brings orders back.', 'Tell buyers about price increases before they happen. Many will order early at today\'s price.', 'Ask your top customer what else they buy elsewhere. That is your easiest new sale.', 'Post this week\'s price list on Facebook every Monday. Buyers who see prices order faster.'],
  cost: ['Look at your biggest cost once a week. Small leaks there matter more than big leaks elsewhere.', 'Electricity jumped? Check for an aircon or freezer left on overnight before blaming the rate.', 'Ask two suppliers for a price every month. Just asking often lowers the price.']
};
function nf85Brief(){
  const m = String(APP_TODAY).slice(0, 7), y = addDaysIso(APP_TODAY, -1), day = Number(String(APP_TODAY).slice(8, 10));
  const sales = typeof bkLiveSales === 'function' ? bkLiveSales() : [];
  const dayTot = d => sales.filter(s => s.date === d).reduce((a, s) => a + (Number(s.total) || 0), 0) + (typeof getSupplierPOs === 'function' ? getSupplierPOs().filter(o => o.createdDate === d && !['draft', 'cancelled', 'quote'].includes(o.status)).reduce((a, o) => a + poTotal(o), 0) : 0);
  const yTot = dayTot(y), wk = [7, 14, 21, 28].map(k => dayTot(addDaysIso(y, -k))), avg = wk.reduce((a, v) => a + v, 0) / 4;
  let pnl = null, prev = null, R = null; try{ pnl = bkPnl(m); R = nf74SameRange(m); prev = nf74PnlRange(R); }catch(e){}
  const mg = pnl && pnl.sales ? (pnl.sales - pnl.cost) / pnl.sales * 100 : null, mgPrev = prev && prev.sales ? (prev.sales - prev.cogs) / prev.sales * 100 : null;
  let owed = []; try{ owed = nf83Rows(); }catch(e){}
  const late = owed.filter(g => g.bucket === 'late'), lateAmt = late.reduce((a, g) => a + g.total, 0), dueToday = owed.filter(g => g.maxLate === 0);
  const low = (inventoryData || []).filter(i => Number(i.rop) > 0 && Number(i.onHand) <= Number(i.rop)).sort((a, b) => Number(a.onHand) / Number(a.rop) - Number(b.onHand) / Number(b.rop));
  const top = {}; sales.filter(s => daysBetween(s.date, APP_TODAY) <= 30).forEach(s => (s.lines || []).forEach(l => { top[l.product] = (top[l.product] || 0) + l.qty * l.unitPrice; }));
  const topItems = Object.entries(top).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const lowTop = low.find(i => topItems.slice(0, 5).includes(i.name));
  let cash = null; try{ cash = bkCashSummary(m); }catch(e){}
  const yShort = cash && cash.list.find(c => c.day === y && c.difference < 0);
  let bills = []; try{ bills = unpaidInvoicesFor('buyer').filter(r => r.due && daysBetween(APP_TODAY, String(r.due).slice(0, 10)) <= 3); }catch(e){}
  let need = 0; try{ need = nfoAll().filter(r => r.band === 'red').length; }catch(e){}
  const routes = (typeof routesCache !== 'undefined' && routesCache) || (typeof demoRoutes !== 'undefined' ? demoRoutes : []);
  const stops = routes.filter(r => r.route_date === APP_TODAY).reduce((a, r) => a + (r.stops || []).filter(s => s.status === 'pending').length, 0);
  let spikes = []; try{ spikes = bkUnusualExpenses(m).spikes || []; }catch(e){}
  const lastBuy = {}; try{ getSupplierPOs().forEach(o => { if(o.buyerId && (!lastBuy[o.buyerId] || o.createdDate > lastBuy[o.buyerId])) lastBuy[o.buyerId] = o.createdDate; }); }catch(e){}
  const quiet = (buyersData || []).filter(b => lastBuy[b.id] && daysBetween(lastBuy[b.id], APP_TODAY) >= 21).slice(0, 3);
  let incoming = []; try{ incoming = (incomingPricesCache || []).filter(x => x.effective_date > APP_TODAY && x.old_price != null && Number(x.new_price) > Number(x.old_price)); }catch(e){}
  // the one thing to focus on today
  const monthSales = pnl ? pnl.sales : 0; let focus;
  if(lateAmt >= 1 && (lateAmt > monthSales * .1 || late.length >= 3)) focus = {tag: 'collect', ic: NF85I.peso, t: `Collect ${nf85P(lateAmt)} in late utang`, why: `${late.length} ${late.length === 1 ? 'person is' : 'people are'} past due. ${late[0] ? `${late[0].name} owes the most: ${nf85P(late[0].total)}.` : ''} That money is already yours; it just isn't in your drawer.`, how: ['Start with the biggest amount. Send the pay link, not just a reminder.', 'Offer a date: "Pwede po ba bukas o sa Sabado?" A promise with a date gets paid.', 'Hold new utang for anyone 30+ days late until they pay part of it.'], btn: ['Open Who owes you', "go('collections')"]};
  else if(mg != null && mgPrev != null && mg < mgPrev - 3) focus = {tag: 'margin', ic: NF85I.alert, t: `Your margin fell to ${mg.toFixed(1)}%`, why: `It was ${mgPrev.toFixed(1)}% at this point last month. On ${nf85P(monthSales)} of sales, every point is about ${nf85P(monthSales / 100)}.`, how: ['Check if a supplier raised a cost you haven\'t passed on.', 'Look for sales below your price list (discounts given by staff).', 'Raise the price of one fast seller by a small amount this week.'], btn: ['See Prices & profit', "go('profit')"]};
  else if(lowTop) focus = {tag: 'stock', ic: NF85I.alert, t: `Don't run out of ${lowTop.name}`, why: `It's one of your top sellers and only ${lowTop.onHand} ${lowTop.unit || 'left'} are on the shelf (reorder point ${lowTop.rop}). Every day it's out, buyers go elsewhere.`, how: [`Order it today from ${lowTop.supplier || 'your supplier'}.`, 'Ask for delivery before the weekend rush.', 'If the supplier is slow, buy a small lot from a second supplier.'], btn: ['Open Stock', "go('inventory')"]};
  else if(avg > 0 && yTot < avg * .8) focus = {tag: 'sell', ic: NF85I.chat, t: 'Bring buyers back today', why: `Yesterday's sales were ${nf85P(yTot)}, below your usual ${nf85P(avg)} for that day.${quiet.length ? ` ${quiet.map(b => b.name).join(', ')} haven't ordered in 3+ weeks.` : ''}`, how: ['Message 3 regular customers you haven\'t heard from.', 'Share this week\'s price list on Facebook and Viber.', 'Offer free delivery for orders above your usual size this week.'], btn: ['Open Messages', "go('messages')"]};
  else if(spikes.length) focus = {tag: 'cost', ic: NF85I.alert, t: `${spikes[0].cat || spikes[0].category || 'An expense'} is higher than usual`, why: `It's up ${Math.round(spikes[0].pct || 0)}% compared with your usual month.`, how: ['Open the expense and check the receipt.', 'Ask who approved it and why.', 'If it repeats, set a spending limit for it.'], btn: ['Open Expenses', "go('expenses')"]};
  else focus = {tag: 'sell', ic: NF85I.star, t: topItems[0] ? `Sell more ${topItems[0]}` : 'Grow your best customer', why: topItems[0] ? `${topItems[0]} is your best seller this month. The easiest growth is selling more of what already sells.` : 'Things are steady. Use today to grow.', how: ['Ask your top 3 customers if they need more this week.', 'Put it at the front of your price list post.', 'Offer a small discount for buying a full bundle.'], btn: ['Open Messages', "go('messages')"]};
  // today's to-do list, in the order a good manager would do it
  const todo = [];
  if(yShort) todo.push({t: `Ask about yesterday's cash: ${nf85P(-yShort.difference)} short`, s: `Counted by ${yShort.by || 'staff'}`, a: "nf86Task('cash')", b: 'Check', k: 'cash'});
  if(need) todo.push({t: `${need} order${need === 1 ? '' : 's'} need you`, s: 'Bill, confirm or answer them first thing', a: "nf86Task('orders')", b: 'Do it', k: 'orders'});
  if(dueToday.length) todo.push({t: `${dueToday.length} ${dueToday.length === 1 ? 'person' : 'people'} due to pay today`, s: dueToday.slice(0, 2).map(g => g.name).join(', '), a: "nf86Task('due')", b: 'Remind', k: 'due'});
  if(late.length) todo.push({t: `Follow up ${late.length} late utang (${nf85P(lateAmt)})`, s: late.slice(0, 2).map(g => `${g.name} ${nf85P(g.total)}`).join(' · '), a: "nf86Task('late')", b: 'Collect', k: 'late'});
  if(stops) todo.push({t: `${stops} deliver${stops === 1 ? 'y' : 'ies'} to send out`, s: 'Check the rider has the list and the items', a: "nf86Task('deliveries')", b: 'Check', k: 'deliveries'});
  if(low.length) todo.push({t: `Reorder ${low.length} item${low.length === 1 ? '' : 's'}`, s: low.slice(0, 3).map(i => i.name).join(', '), a: "nf86Task('reorder')", b: 'Order', k: 'reorder'});
  if(bills.length) todo.push({t: `${bills.length} supplier bill${bills.length === 1 ? '' : 's'} due within 3 days`, s: nf85P(bills.reduce((a, r) => a + (Number(r.balance) || 0), 0)) + ' to pay', a: "nf86Task('bills')", b: 'Pay', k: 'bills'});
  if(incoming.length) todo.push({t: `${incoming.length} supplier price increase${incoming.length === 1 ? '' : 's'} coming`, s: `Order ${incoming[0].product} before ${nf85Day(incoming[0].effective_date)} to keep today's price`, a: "nf86Task('prices')", b: 'Review', k: 'prices'});
  todo.push({t: 'Count the cash at closing', s: 'Two minutes. Catches mistakes the same day.', a: "nf86Task('count')", b: 'Count', k: 'count'});
  const tips = NF85_TIPS[focus.tag] || NF85_TIPS.sell, tip = tips[(day + focus.tag.length) % tips.length];
  return {yTot, avg, mg, mgPrev, monthSales, net: pnl ? pnl.net : null, focus, todo, tip, quiet, lateAmt, R, late, dueToday, low, bills, need, stops, incoming, yShort};
}
function nf85BriefCard(){
  let b; try{ b = nf85Brief(); }catch(e){ console.warn('brief', e); return ''; }
  const hour = new Date().getHours(), hi = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const vs0 = b.avg >= 1000 ? Math.round((b.yTot - b.avg) / b.avg * 100) : null, vs = vs0 != null && Math.abs(vs0) <= 150 ? vs0 : null, vsWord = vs0 != null && vs == null ? (vs0 > 0 ? 'much higher than usual' : 'much lower than usual') : '';
  const done = nf85BriefDone();
  return `<section class="panel-card nf85-brief" id="nf85Brief"><div class="bh"><span class="sun" aria-hidden="true">${nf85Ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 22)}</span><div><h2>${hi}! Your briefing for today</h2><p>${nf85E(new Date(APP_TODAY + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'long', month: 'long', day: 'numeric'}))} · made from your own sales, costs, utang and stock</p></div><span class="tag">Business</span></div>
    <div class="nums"><div><small>Sales yesterday</small><b>${nf85P(b.yTot)}</b>${vs != null ? `<em class="${vs >= 0 ? 'g' : 'r'}">${vs >= 0 ? vs + '% above' : -vs + '% below'} your usual</em>` : vsWord ? `<em class="${vs0 > 0 ? 'g' : 'r'}">${vsWord}</em>` : `<em class="g">vs your usual day</em>`}</div>
      <div><small>Profit margin this month</small><b>${b.mg != null ? b.mg.toFixed(1) + '%' : '—'}</b>${b.mg != null && b.mgPrev != null ? `<em class="${b.mg >= b.mgPrev ? 'g' : 'r'}">${b.mg >= b.mgPrev ? 'up' : 'down'} from ${b.mgPrev.toFixed(1)}%</em>` : ''}</div>
      <div><small>Late utang</small><b>${nf85P(b.lateAmt)}</b><em class="${b.lateAmt >= 1 ? 'r' : 'g'}">${b.lateAmt >= 1 ? 'collect it' : 'none late'}</em></div></div>
    <div class="fc"><div class="fh"><span class="ic">${nf85Ic(b.focus.ic, 20)}</span><div><small>Focus for today</small><b>${nf85E(b.focus.t)}</b></div></div><p>${nf85E(b.focus.why)}</p><ol>${b.focus.how.map(h => `<li>${nf85E(h)}</li>`).join('')}</ol><button type="button" class="nf82-btn p" onclick="${b.focus.btn[1]}">${nf85E(b.focus.btn[0])}</button></div>
    <div class="td"><div class="tdh"><b>Today's list</b><span>${done.size} of ${b.todo.length} done</span></div>${b.todo.map((t, i) => { const k = t.t.replace(/[^\w]/g, '').slice(0, 40), ok = done.has(k); return `<div class="ti${ok ? ' ok' : ''}"><button type="button" class="ck" aria-label="${ok ? 'Mark not done' : 'Mark done'}" onclick="nf85BriefTick('${k}')">${ok ? '✓' : ''}</button><div class="tt"><b>${nf85E(t.t)}</b><small>${nf85E(t.s)}</small></div><button type="button" class="go" onclick="${t.a}">${nf85E(t.b)}</button></div>`; }).join('')}</div>
    <div class="tip">${nf85Ic('<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>', 18)}<span><b>Tip from Nifti:</b> ${nf85E(b.tip)}</span></div>
  </section>`;
}
function nf85BriefKey(){ return 'nifti-brief:' + ((typeof myBusiness !== 'undefined' && myBusiness && myBusiness.id) || 'demo') + ':' + APP_TODAY; }
function nf85BriefDone(){ try{ return new Set(JSON.parse(localStorage.getItem(nf85BriefKey()) || '[]')); }catch(e){ return new Set(); } }
function nf85BriefTick(k){ const s = nf85BriefDone(); if(s.has(k)) s.delete(k); else s.add(k); try{ localStorage.setItem(nf85BriefKey(), JSON.stringify([...s])); }catch(e){} nf85BriefPaint(true); }
function nf85BriefPaint(force){
  const home = document.getElementById('mhHome'); if(!home || !document.querySelector('#page-dashboard.active')) return;
  try{ if(typeof booksCanSeeTotals === 'function' && !booksCanSeeTotals()) return; }catch(e){}
  let el = document.getElementById('nf85Brief'); if(el && !force) return;
  const html = nf85BriefCard(); if(!html) return;
  if(el){ el.outerHTML = html; return; }
  const anchor = home.querySelector('#nf82StartW') || home.querySelector('.hero'); if(anchor) anchor.insertAdjacentHTML('afterend', html);
}
NF45_AFTER.push(() => { try{ nf85BriefPaint(); }catch(e){ console.warn('nf85 brief', e); } });
