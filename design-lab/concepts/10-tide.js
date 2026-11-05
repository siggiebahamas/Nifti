/* 10 · Tide — the rhythm of money. A month dial, the money cycle, a cash tide table and the weekly rhythm. Cyclical rather than linear. */
(function(){
const D = ND;
let root, sel = 25;
const C = 250, STEP = 360 / 31, rad = a => (a - 90) * Math.PI / 180, pt = (r, a) => [C + r * Math.cos(rad(a)), C + r * Math.sin(rad(a))];
const arc = (r1, r2, a1, a2) => { const [x1,y1] = pt(r2, a1), [x2,y2] = pt(r2, a2), [x3,y3] = pt(r1, a2), [x4,y4] = pt(r1, a1), lg = a2 - a1 > 180 ? 1 : 0;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r2} ${r2} 0 ${lg} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} A${r1} ${r1} 0 ${lg} 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`; };
const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], dow = i => dows[(i + 6) % 7];
const cnt = {}; D.counts.forEach(c => cnt[+c.d.split(' ')[0] - 1] = c);
const FUT = {26:[['Metro Steel cheque −₱15,400','r','supplier']], 27:[['Corazon promised +₱14,280','b','overdue'],['Cement runs out','r','stock']], 29:[['Galvanized wire runs out','r','stock']], 30:[['Salaries −₱14,000','y','metric']]};
const PAST = {4:'Big delivered order', 6:'Big delivered order', 9:'Big delivered order', 11:'Big delivered order', 14:'Biggest day: delivered order', 18:'Big delivered order', 23:'Rico\'s drawer ₱800 short'};

function dial(){ const mx = Math.max(...D.daily);
  let s = `<svg class="td-dial" viewBox="0 0 500 500" role="group" aria-label="August, day by day">
    <defs><linearGradient id="tdG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E86C1"/><stop offset="1" stop-color="#0B4F7C"/></linearGradient></defs>
    <circle cx="${C}" cy="${C}" r="226" class="td-ring"/><circle cx="${C}" cy="${C}" r="150" class="td-ring"/>`;
  for(let i = 0; i < 31; i++){ const a1 = i * STEP + .8, a2 = (i + 1) * STEP - .8, past = i < D.daily.length, v = past ? D.daily[i] : 0, r2 = 152 + (past ? Math.max(3, v / mx * 72) : 72), c = cnt[i];
    s += `<g class="td-day${i === sel ? ' is-sel' : ''}${i === 25 ? ' is-today' : ''}${past ? '' : ' is-fut'}" role="button" tabindex="0" aria-label="${dow(i)} ${i + 1} Aug${past ? ': sales ' + F.peso(v) : ''}" onclick="TIDE.day(${i})" onkeydown="if(event.key==='Enter')TIDE.day(${i})">
      <path d="${arc(152, 226, a1, a2)}" class="td-hit"/>
      <path d="${arc(152, r2, a1, a2)}" class="td-bar${v > 30000 ? ' is-big' : ''}"/>
      ${c ? `<path d="${arc(136, 146, a1, a2)}" class="td-cnt ${c.got == null ? 'is-due' : c.got - c.exp < -100 ? 'is-r' : 'is-ok'}"/>` : ''}
      ${FUT[i] ? FUT[i].map((f,k) => { const [x,y] = pt(208 - k * 22, (a1 + a2) / 2); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" class="td-fe is-${f[1]}"/>`; }).join('') : ''}
      <text x="${pt(240, (a1 + a2) / 2)[0].toFixed(1)}" y="${(pt(240, (a1 + a2) / 2)[1] + 4).toFixed(1)}" text-anchor="middle" class="td-dn">${i + 1}</text></g>`; }
  const [tx, ty] = pt(232, 26 * STEP);
  s += `<line x1="${pt(128, 26 * STEP)[0].toFixed(1)}" y1="${pt(128, 26 * STEP)[1].toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" class="td-now"/>
    <path d="${arc(116, 122, 0, 26 * STEP)}" class="td-prog"/><path d="${arc(116, 122, 26 * STEP, 360)}" class="td-prog is-rest"/></svg>`;
  return s; }
function centre(){ const i = sel, past = i < D.daily.length, ev = [];
  if(past) ev.push([`Sales ${F.peso(D.daily[i])}`, D.daily[i] > 30000 ? 'b' : 'n']);
  if(PAST[i]) ev.push([PAST[i], i === 23 ? 'r' : 'b', i === 23 ? 'staff' : null]);
  if(cnt[i]) ev.push([cnt[i].got == null ? 'Drawer count tonight' : `Drawer ${cnt[i].got - cnt[i].exp ? F.signed(cnt[i].got - cnt[i].exp) : 'matched'} · ${cnt[i].who.split(' ')[0]}`, cnt[i].got != null && cnt[i].got - cnt[i].exp < -100 ? 'r' : 'g', cnt[i].got != null && cnt[i].got - cnt[i].exp < -100 ? 'staff' : null]);
  (FUT[i] || []).forEach(f => ev.push(f));
  return `<p class="td-ck">${i === 25 ? 'Today' : dow(i)}</p><h3>${i === 25 ? 'Wed 26 Aug' : (i + 1) + ' August'}</h3>
    ${i === 25 ? `<p class="td-big num">${F.peso(D.month.profit)}</p><p class="td-sm">profit so far · pace ${F.peso(D.month.projProfit)}</p>` : ''}
    <ul>${ev.slice(0, 3).map(e => `<li class="is-${e[1]}">${e[2] ? `<button type="button" onclick="TIDE.open('${e[2]}',this)">${e[0]} ›</button>` : e[0]}</li>`).join('') || '<li>Nothing scheduled</li>'}</ul>`; }

function cycle(){ const cpd = D.month.cogs / 26, rpd = D.month.revenue / 26, dio = D.stockValue / cpd, dso = D.receivablesTotal / rpd, dpo = D.payablesTotal / cpd, ccc = dio + dso - dpo, tot = dio + dso, sc = 300 / tot;
  const a1 = dio * sc, a2 = tot * sc, ap = dpo * sc;
  return `<svg class="td-cyc" viewBox="0 0 260 260" role="group" aria-label="Money cycle: about ${Math.round(ccc)} days">
      <path d="${arcS(0, a1)}" class="td-seg is-shelf" role="button" tabindex="0" onclick="TIDE.open('stock',this)" onkeydown="if(event.key==='Enter')TIDE.open('stock',this)"><title>Stock sits about ${dio.toFixed(0)} days</title></path>
      <path d="${arcS(a1 + 2, a2)}" class="td-seg is-collect" role="button" tabindex="0" onclick="TIDE.open('overdue',this)" onkeydown="if(event.key==='Enter')TIDE.open('overdue',this)"><title>Customers take about ${dso.toFixed(0)} days</title></path>
      <path d="${arcS(0, ap, 74)}" class="td-seg is-credit" role="button" tabindex="0" onclick="TIDE.open('supplier',this)" onkeydown="if(event.key==='Enter')TIDE.open('supplier',this)"><title>Suppliers give about ${dpo.toFixed(0)} days</title></path>
      <text x="130" y="124" text-anchor="middle" class="td-cn num">${Math.round(ccc)} days</text><text x="130" y="146" text-anchor="middle" class="td-cl">cash out per cycle</text></svg>
    <ul class="td-legend"><li class="is-shelf"><button type="button" onclick="TIDE.open('stock',this)"><b>${Math.round(dio)} days</b> on the shelf</button></li><li class="is-collect"><button type="button" onclick="TIDE.open('overdue',this)"><b>${Math.round(dso)} days</b> waiting for customers</button></li><li class="is-credit"><button type="button" onclick="TIDE.open('supplier',this)"><b>−${Math.round(dpo)} days</b> credit from suppliers</button></li></ul>
    <p class="td-note">On average a peso spent on stock comes back in about ${Math.round(ccc)} days. <b>Riverside's has been out 49 days</b> (invoiced 8 Jul).</p>`; }
function arcS(a1, a2, r){ r = r || 100; const p = (a) => [130 + r * Math.cos(rad(a)), 130 + r * Math.sin(rad(a))], [x1,y1] = p(a1), [x2,y2] = p(a2); return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`; }

function tide(){ const fc = D.forecast(), pts = [{d:'Today', bal:D.cash.total}].concat(fc), W = 560, H = 170, mn = 20000, mx = 110000;
  const x = i => 10 + i * (W - 20) / (pts.length - 1), y = v => 10 + (1 - (v - mn) / (mx - mn)) * (H - 30);
  let d = `M${x(0)} ${y(pts[0].bal)}`; for(let i = 0; i < pts.length - 1; i++){ const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${(x(i) + (x(i + 1) - x(Math.max(0, i - 1))) / 6).toFixed(1)} ${(y(p1.bal) + (y(p2.bal) - y(p0.bal)) / 6).toFixed(1)} ${(x(i + 1) - (x(Math.min(pts.length - 1, i + 2)) - x(i)) / 6).toFixed(1)} ${(y(p2.bal) - (y(p3.bal) - y(p1.bal)) / 6).toFixed(1)} ${x(i + 1).toFixed(1)} ${y(p2.bal).toFixed(1)}`; }
  const ext = []; pts.forEach((p,i) => { if(i === 0 || i === pts.length - 1) return; const a = pts[i - 1].bal, b = pts[i + 1].bal; if(p.bal < a && p.bal <= b) ext.push(['Low', p, i]); if(p.bal > a && p.bal >= b) ext.push(['High', p, i]); });
  return `<svg class="td-wave" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cash tide, next 14 days"><defs><linearGradient id="tdW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E86C1" stop-opacity=".35"/><stop offset="1" stop-color="#2E86C1" stop-opacity=".03"/></linearGradient></defs>
      <path d="${d} L${x(pts.length - 1)} ${H - 20} L${x(0)} ${H - 20} Z" fill="url(#tdW)"/><path d="${d}" class="td-wl"/>
      <line x1="10" x2="${W - 10}" y1="${y(D.cash.safety)}" y2="${y(D.cash.safety)}" class="td-safe"/><text x="${W - 12}" y="${y(D.cash.safety) - 6}" text-anchor="end" class="td-wt is-r">safety ₱40,000</text>
      ${ext.map(e => `<circle cx="${x(e[2])}" cy="${y(e[1].bal)}" r="5" class="td-ex is-${e[0] === 'Low' ? 'lo' : 'hi'}${e[1].bal < D.cash.safety ? ' is-r' : ''}"/>`).join('')}
      ${[0, 4, 7, 11, 14].map(i => `<text x="${x(i)}" y="${H - 4}" text-anchor="${i === 0 ? 'start' : i === 14 ? 'end' : 'middle'}" class="td-wt">${pts[i].d}</text>`).join('')}</svg>
    <table class="td-tt"><thead><tr><th>Tide</th><th>Day</th><th class="n">Cash</th></tr></thead><tbody>${ext.map(e => `<tr class="${e[1].bal < D.cash.safety ? 'is-r' : ''}"><td>${e[0] === 'Low' ? '▼ Low' : '▲ High'}</td><td>${e[1].d}</td><td class="n num"><button type="button" onclick="TIDE.open('metric',this)">${F.peso(e[1].bal)}</button></td></tr>`).join('')}</tbody></table>`; }

function rose(){ const s = [0,0,0,0,0,0,0], c = [0,0,0,0,0,0,0]; D.daily.forEach((v,i) => { const k = (i + 6) % 7; s[k] += v; c[k]++; });
  const full = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], avg = s.map((v,i) => v / c[i]), mx = Math.max(...avg), top = avg.indexOf(mx), order = [1,2,3,4,5,6,0];
  return `<svg class="td-rose" viewBox="0 0 220 220" role="img" aria-label="Average sales by weekday">${order.map((k,j) => { const a1 = j * 360 / 7 + 3, a2 = (j + 1) * 360 / 7 - 3, r = 22 + avg[k] / mx * 76, p = (rr, a) => [110 + rr * Math.cos(rad(a)), 110 + rr * Math.sin(rad(a))], [x1,y1] = p(r, a1), [x2,y2] = p(r, a2), [lx,ly] = p(r + 13, (a1 + a2) / 2);
      return `<path d="M110 110 L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" class="td-pet${k === top ? ' is-top' : ''}"/><text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" class="td-rl">${dows[k].slice(0,2)}</text>`; }).join('')}</svg>
    <p class="td-note"><b>${full[top]}s bring the most</b>, about ${F.peso(Math.round(mx / 10) * 10)} on average, because three of August's six big delivered orders were billed on Wednesdays. Sundays average ${F.peso(Math.round(avg[0] / 10) * 10)}.</p>`; }

const PULSE = [['overdue','Riverside Builders','₱77,240 · 34 days late','r'],['stock','Portland Cement','runs out Friday','r'],['staff','Rico\'s drawer','₱800 short on 24 Aug','r'],['expense','Electricity','₱8,940 · +51%','y'],['supplier','Metro Steel I-beams','20 more on 2 Sep','y']];

const TIDE = {
  day(i){ sel = i; root.querySelector('#tdDial').innerHTML = dial(); root.querySelector('#tdCentre').innerHTML = centre(); },
  open(k, el){ const f = k === 'metric' ? FLOWS.metric('cash') : k === 'profit' ? FLOWS.metric('profit') : k === 'ask' ? null : FLOWS[k](), pool = root.querySelector('#tdPool'), dlg = pool.querySelector('.td-dlg');
    if(el && el.getBoundingClientRect){ const r = el.getBoundingClientRect(); dlg.style.transformOrigin = `${Math.round(r.left + r.width / 2 - (innerWidth - Math.min(720, innerWidth)) / 2)}px ${Math.round(r.top - 40)}px`; }
    dlg.innerHTML = f ? `<div class="td-dh"><div><p>${f.kicker}</p><h3>${f.title}</h3></div><button type="button" onclick="TIDE.close()" aria-label="Close">✕</button></div><div class="td-db">${f.body}</div>`
      : `<div class="td-dh"><div><p>Ask Nifti</p><h3>What would you like to know?</h3></div><button type="button" onclick="TIDE.close()" aria-label="Close">✕</button></div><div class="td-chips">${D.ask.map((a,i) => `<button type="button" onclick="TIDE.ask(${i})">${a.q}</button>`).join('')}</div><div id="tdAns" aria-live="polite"></div>`;
    pool.hidden = false; dlg.classList.remove('is-in'); void dlg.offsetWidth; dlg.classList.add('is-in'); dlg.querySelector('.td-dh button').focus(); },
  close(){ root.querySelector('#tdPool').hidden = true; },
  ask(i){ const a = D.ask[i]; root.querySelectorAll('.td-chips button').forEach((b,k) => b.setAttribute('aria-pressed', k === i ? 'true' : 'false'));
    root.querySelector('#tdAns').innerHTML = `<div class="td-a"><p class="td-aq">${a.q}</p><p>${a.a}</p><small>From ${a.src.toLowerCase()} · sample answer</small></div>`; }
};
window.TIDE = TIDE;

LAB.register({
  id:'tide', n:10, name:'Tide', territory:'Cyclical rhythm', tagline:'The business as rhythms: the month, the money cycle, the cash tide',
  fonts:'family=Outfit:wght@300;400;500;600;700',
  identity:{
    vision:'A distributor\'s money moves in cycles: buy, shelve, sell, wait, collect, pay. Tide draws Nifti in circles and waves so the owner feels the rhythm, then shows exactly where it is off-beat.',
    philosophy:'Calm, but not vague. Shapes you can read in one breath (a dial for the month, a ring for the money cycle, a wave for cash) with exact numbers one tap away. Unhurried, assured, quietly premium.',
    distinct:'Radial and cyclical where every other concept is linear: a 31-day dial, a cash-conversion ring that nobody else shows, a tide table of highs and lows, and a weekday rose. Details open as a dialog that grows from what you tapped.',
    type:'Outfit throughout: light 300 for the big figures, 600 for labels. Round, open, quiet.',
    color:'Sea-blue gradient on a near-white ground, a lilac ring for stock time, dark blue for money in, red for anything below a line or late. Plenty of air.',
    visual:'Circles, arcs and one wave. No cards; sections float on soft white with a hairline.',
    motion:'The dialog ripples open from its source; the attention list breathes with a slow ring pulse (off under reduced motion).',
    arch:'Month dial with centre readout · Money cycle · Cash tide table · Week rhythm · Pulse (things off-beat) · Ask Nifti button.'
  },
  components:[['Month dial','31 days around a ring: sales bars, drawer counts, upcoming events'],['Money cycle ring','days on the shelf + waiting for customers − supplier credit'],['Tide table','cash highs and lows ahead, with the safety line'],['Week rhythm rose','average sales by weekday'],['Pulse list','five off-beat items with a breathing marker'],['Ripple dialog','details grow from the tapped element']],
  tasks:{open:'The dial: the month so far, today marked, profit in the centre.', metric:'Tide table: the 2 Sep low opens the cash detail.', expense:'Pulse: Electricity.', overdue:'Money cycle: the "waiting for customers" arc, or Riverside in Pulse.', stock:'Pulse: Portland Cement, or the shelf arc.', supplier:'Money cycle: the supplier credit ring.', staff:'Dial: tap 24, then Rico\'s drawer.', ask:'Round Ask Nifti button, bottom right.'},
  map:{arch:'Radial: dial, ring, wave', nav:'Tap shapes; centre readout; dialog', viz:'Radial bars, arcs, smoothed wave, rose', type:'Outfit'},
  eval:{scores:[5,4,5,4,3,4,4], good:'Most memorable and calming, and the money-cycle ring explains cash pressure (customers take longer than suppliers give) in one picture.', bad:'Radial charts are less precise than bars; exact comparisons depend on the centre readout and dialogs.'},
  mount(el){ root = el; sel = 25;
    el.innerHTML = `<div class="td-wrap"><header class="td-top"><div class="td-id"><b>tide</b><span>${D.biz.short} · ${D.biz.todayLabel}</span></div>
        <div class="td-stats"><button type="button" onclick="TIDE.open('metric',this)"><span>Cash</span><b class="num">${F.peso(D.cash.total)}</b></button><button type="button" onclick="TIDE.open('overdue',this)"><span>Owed to you</span><b class="num">${F.peso(D.receivablesTotal)}</b></button><button type="button" onclick="TIDE.open('supplier',this)"><span>You owe</span><b class="num">${F.peso(D.payablesTotal)}</b></button></div></header>
      <main class="td-main"><section class="td-month" aria-labelledby="tdMH"><h2 id="tdMH">August, day by day</h2><div class="td-dialw"><div id="tdDial">${dial()}</div><div class="td-centre" id="tdCentre" aria-live="polite">${centre()}</div></div>
          <p class="td-key"><span class="k-bar"></span>sales each day <span class="k-cnt"></span>drawer count <span class="k-fe"></span>coming up · tap a day</p></section>
        <section class="td-cycle" aria-labelledby="tdCH"><h2 id="tdCH">Money cycle</h2>${cycle()}</section>
        <section class="td-tide" aria-labelledby="tdTH"><h2 id="tdTH">Cash tide, next 14 days</h2>${tide()}</section>
        <section class="td-week" aria-labelledby="tdWH"><h2 id="tdWH">Week rhythm</h2>${rose()}</section>
        <section class="td-pulse" aria-labelledby="tdPH"><h2 id="tdPH">Off-beat</h2><ul>${PULSE.map(p => `<li><button type="button" class="is-${p[3]}" onclick="TIDE.open('${p[0]}',this)"><i aria-hidden="true"></i><span><b>${p[1]}</b><small>${p[2]}</small></span></button></li>`).join('')}</ul></section></main>
      <button type="button" class="td-askbtn" onclick="TIDE.open('ask',this)">Ask Nifti</button>
      <div class="td-pool" id="tdPool" hidden onclick="if(event.target===this)TIDE.close()"><div class="td-dlg" role="dialog" aria-modal="true" aria-label="Details"></div></div></div>`;
  },
  run(k){ const r = s => root.querySelector(s);
    if(k === 'open'){ TIDE.close(); TIDE.day(25); return window.scrollTo({top:0, behavior:'smooth'}); }
    if(k === 'ask'){ TIDE.open('ask', r('.td-askbtn')); return TIDE.ask(0); }
    if(k === 'staff'){ TIDE.day(23); return TIDE.open('staff', r('#tdCentre button')); }
    const el = {metric:r('.td-tt tr.is-r button'), overdue:r('.td-seg.is-collect'), supplier:r('.td-seg.is-credit')}[k] || [...root.querySelectorAll('.td-pulse button')].find(b => b.getAttribute('onclick').includes(`'${k}'`));
    TIDE.open(k, el); }
});
})();
