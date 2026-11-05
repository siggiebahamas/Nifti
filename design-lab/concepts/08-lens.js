/* 08 · Lens — analytical explorer. Build a sentence ("Show me ___ by ___"), get the right chart, click any mark to inspect it. */
(function(){
const D = ND;
let root, cur = 'cash|ahead', mode = 'chart';

/* ---- generic marks (all HTML/SVG carry real values) ---- */
function hbars(rows, opt){ opt = opt || {}; const mx = opt.max || Math.max(...rows.map(r => Math.abs(r.v))), dv = opt.diverge;
  return `<div class="ln-hb${dv ? ' is-div' : ''}">${rows.map((r,i) => { const w = Math.abs(r.v) / mx * (dv ? 50 : 100);
    return `<button type="button" class="ln-hr is-${r.tone || 'n'}" onclick="LENS.pick(${i})"><span class="ln-hl"><b>${r.label}</b>${r.sub ? `<small>${r.sub}</small>` : ''}</span>
      <span class="ln-ht">${dv ? '<u aria-hidden="true"></u>' : ''}<i style="${dv ? (r.v < 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%`) : `width:${w}%`}"></i>${r.notch != null ? `<em style="left:${(r.notch / mx * 100).toFixed(1)}%" aria-hidden="true"></em>` : ''}</span>
      <span class="ln-hv num">${opt.fmt ? opt.fmt(r.v) : F.peso(r.v)}</span></button>`; }).join('')}</div>`; }
function cols(rows, opt){ opt = opt || {}; const mx = Math.max(...rows.map(r => Math.max(r.v || 0, r.ghost || 0))) * 1.08, ref = opt.ref;
  return `<div class="ln-cols" style="--n:${rows.length}">${ref ? `<div class="ln-ref" style="bottom:${(ref.v / mx * 100).toFixed(1)}%"><span>${ref.label}</span></div>` : ''}${rows.map((r,i) => `<div class="ln-c${r.v == null ? ' is-future' : ''}">
      <button type="button" class="ln-cb is-${r.tone || 'n'}" ${r.v == null ? 'disabled' : `onclick="LENS.pick(${i})"`} aria-label="${r.label}: ${r.v == null ? 'not yet' : (opt.fmt || F.peso)(r.v)}">${r.ghost ? `<i class="ln-ghost" style="height:${(r.ghost / mx * 100).toFixed(1)}%"></i>` : ''}<i style="height:${((r.v || 0) / mx * 100).toFixed(1)}%"></i>${opt.labels !== false && r.v != null ? `<span class="num">${(opt.short || F.k)(r.v)}</span>` : ''}</button>
      <small>${(opt.every && i % opt.every) ? '' : r.label}</small></div>`).join('')}</div>`; }
function line(rows, opt){ opt = opt || {}; const W = Math.max(320, Math.min(860, (root.querySelector('.ln-canvas') || {}).clientWidth - 40 || 760)), H = 260, pl = 54, pb = 30, mn = opt.min, mx = opt.max;
  const x = i => pl + i * (W - pl - 16) / (rows.length - 1), y = v => 12 + (1 - (v - mn) / (mx - mn)) * (H - pb - 12), every = W < 520 ? 3 : 1;
  const d = rows.map((r,i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(r.v).toFixed(1)).join(' ');
  const ticks = []; for(let v = mn; v <= mx; v += opt.tick) ticks.push(v);
  return `<svg class="ln-svg" viewBox="0 0 ${W} ${H}" style="max-width:${W}px" role="img" aria-label="${opt.label}">
    ${ticks.map(v => `<line x1="${pl}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}" class="ln-grid"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end" class="ln-ax">${F.k(v)}</text>`).join('')}
    ${opt.ref ? `<line x1="${pl}" x2="${W - 10}" y1="${y(opt.ref.v)}" y2="${y(opt.ref.v)}" class="ln-refl"/><text x="${pl + 6}" y="${y(opt.ref.v) + 18}" class="ln-ax is-r">${opt.ref.label}</text>` : ''}
    <path d="${d}" class="ln-path"/>
    ${rows.map((r,i) => `<g class="ln-pt is-${r.tone || 'n'}" tabindex="0" role="button" aria-label="${r.label}: ${F.peso(r.v)}" onclick="LENS.pick(${i})" onkeydown="if(event.key==='Enter')LENS.pick(${i})"><circle cx="${x(i)}" cy="${y(r.v)}" r="${r.tone === 'r' ? 7 : 4.5}"/>${r.tone === 'r' ? `<text x="${x(i)}" y="${y(r.v) + 22}" text-anchor="middle" class="ln-ax is-r">${F.peso(r.v)}</text>` : ''}</g>${i % every ? '' : `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="ln-ax">${r.label}</text>`}`).join('')}</svg>`; }

/* ---- the views a sentence can produce ---- */
const fc = D.forecast(), ibStock = D.stock.find(s => s.sku === 'IB-01');
const custFlow = () => FLOWS.overdue(), kvFlow = (kicker, title, rows, lede) => ({kicker, title, body:(lede ? `<p class="fx-lede">${lede}</p>` : '') + FLOWS.kv(rows)});
const V = {
  'profit|month':{rows:() => D.trend.map(t => ({label:t.m, v:t.profit, ghost:t.projProfit, tone:t.partial ? 'a' : 'n'})), chart:r => cols(r, {ref:{v:D.month.lastProfit, label:'July ₱35,200'}}),
    pick:() => FLOWS.metric('profit'), notes:['August is ₱30,881 after 26 days; the outline shows the ₱36,800 pace.','That would beat July by about 4.5%, the best of the last six months.','Electricity and repairs took ₱6,417 above normal; without them August would be clearly ahead.'], title:'Profit by month, March to August'},
  'sales|day':{rows:() => D.daily.map((v,i) => ({label:String(i + 1), v, tone:v > 30000 ? 'a' : 'n'})).concat([27,28,29,30,31].map(d => ({label:String(d), v:null}))), chart:r => cols(r, {every:5, labels:false, ref:{v:15385, label:'Daily average ₱15,385'}}),
    pick:i => kvFlow('Sales · ' + (i + 1) + ' Aug', F.peso(D.daily[i]) + ' in sales', [['Day', (i + 1) + ' August'], ['Sales', F.peso(D.daily[i])], ['Versus the daily average', F.signed(D.daily[i] - 15385)]], D.daily[i] > 30000 ? 'A big delivered order was billed this day.' : D.daily[i] === 0 ? 'No sales recorded.' : ''),
    notes:['Six days with big delivered orders (5, 7, 10, 12, 15, 19 Aug) carry 60% of August sales.','Other open days average about ₱9,000.','No big delivery since 19 Aug: the last seven days averaged ₱4,413.'], title:'Sales by day, August'},
  'sales|month':{rows:() => D.trend.map(t => ({label:t.m, v:t.rev, ghost:t.projRev, tone:t.partial ? 'a' : 'n'})), chart:r => cols(r, {ref:{v:D.month.lastRevenue, label:'July ₱459,200'}}),
    pick:() => FLOWS.metric('profit'), notes:['August is on pace for ₱476,900, about 4% above July.','Sales have grown four of the last five months.'], title:'Sales by month, March to August'},
  'cash|ahead':{rows:() => fc.map(p => ({label:p.d.replace(' Aug','').replace(' Sep','/9'), v:p.bal, tone:p.bal < D.cash.safety ? 'r' : 'n'})), chart:r => line(r, {min:20000, max:110000, tick:20000, ref:{v:D.cash.safety, label:'Safety line ₱40,000'}, label:'Cash, next 14 days'}),
    pick:() => FLOWS.metric('cash'), notes:['Tomorrow\'s ₱15,400 cheque is covered.','2 Sep is the low point: ₱39,730, just under the ₱40,000 safety line.','Collecting Riverside (₱77,240) before 2 Sep keeps you above it all fortnight.'], title:'Cash (BDO + GCash), next 14 days'},
  'owed|customer':{rows:() => D.receivables.map(r => ({label:r.cust, sub:r.id + ' · ' + r.days + ' days late', v:r.amount, tone:r.days > 20 ? 'r' : 'y'})), chart:r => hbars(r),
    pick:custFlow, notes:['All ₱174,968 is past due.','Riverside alone is 44% of it and 34 days late.','Bayview pays within a week of a reminder; one is due.'], title:'Owed to you, by customer'},
  'owed|age':{rows:() => [{label:'Over 30 days', sub:'Riverside Builders', v:77240, tone:'r'}, {label:'16 to 30 days', sub:'Bayview Construction', v:45144, tone:'r'}, {label:'Up to 15 days', sub:'Cavite Steel Works, Corazon Welding', v:52584, tone:'y'}], chart:r => hbars(r),
    pick:custFlow, notes:['44% of what customers owe is over a month late.','Your terms are 15 days; nobody is inside them right now.'], title:'Owed to you, by how late'},
  'owe|supplier':{rows:() => [['Metro Steel Co.','cheque tomorrow + balance 2 Sep',48900,'y'],['Cebu Aggregates','July bill due 15 Sep',31860,'n'],['Quezon Fasteners','due 11 Sep',22400,'n'],['Balintawak Wire Supply','cash on delivery (late)',9840,'y']].map(a => ({label:a[0], sub:a[1], v:a[2], tone:a[3]})), chart:r => hbars(r),
    pick:() => FLOWS.supplier(), notes:['₱113,000 owed to four suppliers; nothing is late.','Metro Steel is 43% of it, and the I-beams it pays for are slow sellers.'], title:'You owe, by supplier'},
  'owe|due':{rows:() => D.payables.slice().sort((a,b) => a.dueIdx - b.dueIdx).map(p => ({label:p.due, sub:p.sup + ' · ' + p.what, v:p.amount, tone:p.dueIdx < 8 ? 'y' : 'n'})), chart:r => hbars(r),
    pick:() => FLOWS.supplier(), notes:['₱58,740 falls due in the next 8 days.','The 2 Sep balance is the one that pushes cash under the safety line.'], title:'You owe, by due date'},
  'stock|cover':{rows:() => D.stock.slice().sort((a,b) => a.cover - b.cover).map(s => ({label:s.name, sub:`${s.on} ${s.unit} · supplier needs ${s.lead} days`, v:Math.min(s.cover, 45), notch:s.lead, tone:s.risk === 'r' ? 'r' : s.risk === 'y' ? 'y' : 'n', sku:s.sku})), chart:r => hbars(r, {max:45, fmt:v => F.days(v)}),
    pick:i => V['stock|cover'].rows()[i].sku === 'IB-01' ? FLOWS.supplier() : FLOWS.stock(), notes:['Cement and galvanized wire run out before a new delivery could arrive.','Tie wire needs ordering this week.','I-beams have 35 days and 20 more are coming: overstock risk.'], title:'Stock, days left at today\'s selling rate'},
  'stock|value':{rows:() => D.stock.slice().sort((a,b) => b.value - a.value).map(s => ({label:s.name, sub:F.days(s.cover) + ' of stock', v:s.value, tone:s.cover > 30 ? 'a' : s.risk === 'r' ? 'r' : 'n', sku:s.sku})), chart:r => hbars(r),
    pick:i => V['stock|value'].rows()[i].sku === 'IB-01' ? FLOWS.supplier() : FLOWS.stock(), notes:['₱86,624 on the shelf at cost.','I-beams and nails (over 30 days of stock) hold 55% of it.'], title:'Stock, pesos on the shelf'},
  'exp|normal':{rows:() => D.expenses.map(e => ({label:e.cat, sub:F.peso(e.amt) + ' vs normal ' + F.peso(e.avg), v:e.amt - e.avg, tone:e.amt - e.avg > 1000 ? 'r' : e.amt < e.avg ? 'g' : 'n', cat:e.cat})).sort((a,b) => b.v - a.v), chart:r => hbars(r, {diverge:true, fmt:F.signed}),
    pick:i => { const r = V['exp|normal'].rows()[i]; return r.cat === 'Electricity' ? FLOWS.expense() : kvFlow('Expenses', r.cat, [['This month', r.sub.split(' vs')[0]], ['Normal (3-month average)', r.sub.split('normal ')[1]], ['Difference', F.signed(r.v)]], ''); },
    notes:['Electricity is ₱3,017 above normal; usage jumped, not the rate.','Repairs are ₱3,400 above normal.','Fuel is ₱1,120 under normal.'], title:'Expenses, this month against normal'},
  'exp|power':{rows:() => D.electricity.map(e => ({label:e.m, v:e.kwh, tone:e.m === 'Aug' ? 'r' : 'n'})), chart:r => cols(r, {fmt:v => v + ' kWh', short:v => v + ' kWh'}),
    pick:() => FLOWS.expense(), notes:['August used 712 kWh against about 470 normally.','The rate stayed about ₱12.5 per kWh, so usage is the cause.'], title:'Electricity use by month (kWh)'},
  'counts|day':{rows:() => D.counts.filter(c => c.got != null).reverse().map(c => ({label:c.d + ' · ' + c.who.split(' ')[0], sub:'expected ' + F.peso(c.exp), v:c.got - c.exp, tone:c.got - c.exp < -100 ? 'r' : 'n', d:c.d})), chart:r => hbars(r, {diverge:true, max:900, fmt:v => v ? F.signed(v) : '₱0'}),
    pick:i => { const r = V['counts|day'].rows()[i]; return r.d === '24 Aug' ? FLOWS.staff() : kvFlow('Drawer count', r.label, [['Expected', r.sub.replace('expected ','')], ['Difference', r.v ? F.signed(r.v) : '₱0']], 'Within tolerance.'); },
    notes:['Seven counts since 19 Aug; six are within ₱20.','24 Aug (Rico) is ₱800 short, the only real gap.'], title:'Drawer counts, counted minus expected'},
  'counts|person':{rows:() => D.staff.map(s => ({label:s.name, sub:s.counts + ' counts · discounts ' + F.peso(s.discounts), v:s.net, tone:s.net ? 'r' : 'g'})), chart:r => hbars(r, {diverge:true, max:900, fmt:v => v ? F.signed(v) : '₱0'}),
    pick:i => i === 1 ? FLOWS.staff() : kvFlow('Staff', 'Liza Santos', [['Counts', '5'], ['Net difference', '₱0'], ['Discounts given', '₱0']], 'All counts within ₱20.'), notes:['Liza: five counts, net ₱0.','Rico: three counts, net −₱800, all from 24 Aug; ₱490 in discounts given.'], title:'Drawer differences, by person'}
};
const METRICS = [['cash','cash',[['ahead','day, next 14 days']]],['profit','profit',[['month','month']]],['sales','sales',[['day','day this month'],['month','month']]],['owed','money owed to me',[['customer','customer'],['age','how late']]],['owe','money I owe',[['due','due date'],['supplier','supplier']]],['stock','stock',[['cover','days left'],['value','pesos on the shelf']]],['exp','expenses',[['normal','against normal'],['power','electricity by month']]],['counts','drawer counts',[['day','count'],['person','person']]]];
const PINS = [['cash|ahead','Cash, next 14 days'],['owed|customer','Who owes me'],['stock|cover','What runs out'],['owe|due','What I pay next'],['exp|normal','Costs against normal'],['counts|day','Drawer counts'],['profit|month','Profit trend']];
const ASKMAP = ['profit|month','owed|customer','cash|ahead','stock|cover','counts|day'];

function sentence(){ const [m, b] = cur.split('|'), met = METRICS.find(x => x[0] === m);
  return `<span>Show me</span><label class="ln-slot"><span class="sr">Measure</span><select onchange="LENS.metric(this.value)">${METRICS.map(x => `<option value="${x[0]}"${x[0] === m ? ' selected' : ''}>${x[1]}</option>`).join('')}</select></label>
    <span>by</span><label class="ln-slot"><span class="sr">Split by</span><select onchange="LENS.set('${m}|'+this.value)">${met[2].map(x => `<option value="${x[0]}"${x[0] === b ? ' selected' : ''}>${x[1]}</option>`).join('')}</select></label>`; }
function table(rows){ return `<div class="fx-tw"><table class="fx-tbl ln-tbl"><thead><tr><th>Item</th><th>Detail</th><th class="n">Value</th></tr></thead><tbody>${rows.filter(r => r.v != null).map((r,i) => `<tr><td><button type="button" class="ln-tl" onclick="LENS.pick(${rows.indexOf(r)})">${r.label}</button></td><td><small>${r.sub || ''}</small></td><td class="n num">${typeof r.v === 'number' && cur.startsWith('stock|cover') ? F.days(r.v) : cur === 'exp|power' ? r.v + ' kWh' : (cur.startsWith('counts') || cur === 'exp|normal') ? F.signed(r.v) : F.peso(r.v)}</td></tr>`).join('')}</tbody></table></div>`; }
function render(){ const v = V[cur], rows = v.rows();
  root.querySelector('#lnSentence').innerHTML = sentence();
  const cv = LENS._cv || (LENS._cv = document.createElement('canvas').getContext('2d'));
  root.querySelectorAll('.ln-slot select').forEach(s => { cv.font = getComputedStyle(s).font; s.style.width = Math.ceil(cv.measureText(s.options[s.selectedIndex].text).width + 50) + 'px'; });
  root.querySelector('#lnTitle').textContent = v.title;
  root.querySelector('#lnCanvas').innerHTML = mode === 'table' ? table(rows) : v.chart(rows);
  root.querySelector('#lnNotes').innerHTML = v.notes.map(n => `<li>${n}</li>`).join('');
  root.querySelectorAll('.ln-pins button').forEach(b => b.setAttribute('aria-current', b.dataset.k === cur ? 'true' : 'false'));
  root.querySelectorAll('.ln-mode button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === mode ? 'true' : 'false'));
}
const LENS = {
  set(k){ cur = k; LENS.close(); render(); },
  metric(m){ LENS.set(m + '|' + METRICS.find(x => x[0] === m)[2][0][0]); },
  mode(m){ mode = m; render(); },
  pick(i){ const f = V[cur].pick(i), box = root.querySelector('#lnInspect');
    box.innerHTML = `<div class="ln-ih"><div><p>Inspecting · ${V[cur].title}</p><h3>${f.title}</h3><span class="ln-ik">${f.kicker}</span></div><button type="button" onclick="LENS.close()" aria-label="Close inspector">✕</button></div><div class="ln-ib">${f.body}</div>`;
    box.hidden = false; box.scrollIntoView({behavior:'smooth', block:'nearest'}); },
  close(){ const b = root.querySelector('#lnInspect'); if(b){ b.hidden = true; b.innerHTML = ''; } },
  ask(i){ const s = root.querySelector('#lnAsk'); if(i != null) s.value = String(i); if(s.value === '') return; const a = D.ask[+s.value];
    LENS.set(ASKMAP[+s.value]); root.querySelector('#lnAns').innerHTML = `<p class="ln-aq">${a.q}</p><p>${a.a}</p><small>Chart set to the data behind this answer · ${a.src.toLowerCase()} · sample answer</small>`; }
};
window.LENS = LENS;

LAB.register({
  id:'lens', n:8, name:'Lens', territory:'Analytical explorer', tagline:'Say what you want to see; Lens picks the chart',
  fonts:'family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Spline+Sans+Mono:wght@400;500;600',
  identity:{
    vision:'For the owner who wants to look for themselves. Instead of a fixed page, Lens is a sentence ("Show me cash by day, next 14 days") that turns into the right chart, with notes on what it says and an inspector for any mark.',
    philosophy:'Curiosity over curation. The owner asks; Lens answers with honest charts and plain notes. Precise, open, a little nerdy.',
    distinct:'The navigation is a sentence, not a menu. Chart form follows the question (line for time ahead, ranked bars for who, diverging bars for against-normal). Every mark is clickable into an inspector.',
    type:'Schibsted Grotesk for words, Spline Sans Mono for every number so columns align.',
    color:'White canvas on faint graph-paper dots, violet for focus and selection, amber for the highlighted series, red only when a value crosses a line.',
    visual:'One large canvas, slim notes column, pinned lenses as a shelf. Thin rules, small radius, nothing decorative.',
    motion:'Bars grow from zero when the sentence changes; the inspector slides up under the chart.',
    arch:'Pinned lenses (rail) · Sentence builder · Canvas (chart or table) · Inspector · Notes and Ask. Eight measures × 1–2 splits = 14 views.'
  },
  components:[['Sentence builder','"Show me [measure] by [split]" with dependent options'],['Adaptive chart canvas','picks line, columns, ranked or diverging bars'],['Mark inspector','click any bar or point for the full story'],['Pinned lenses','saved views as a shelf'],['Notes column','what the current view says, in plain words'],['Chart / table switch','every view as a sortable-style table']],
  tasks:{open:'Opens on the pinned "Cash, next 14 days" lens with notes.', metric:'Pick any measure in the sentence; click a point to inspect.', expense:'"Expenses by against normal": electricity is the long red bar.', overdue:'"Money owed to me by customer": click Riverside.', stock:'"Stock by days left": red bars stop short of the supplier notch.', supplier:'"Money I owe by due date": click Metro Steel.', staff:'"Drawer counts by count": 24 Aug is the only long bar.', ask:'Ask Nifti in the notes column; the chart switches to the data behind the answer.'},
  map:{arch:'Explorer: sentence → canvas → inspector', nav:'Sentence builder and pinned lenses', viz:'Adaptive: line, columns, ranked and diverging bars', type:'Schibsted Grotesk + Spline Sans Mono'},
  eval:{scores:[4,3,4,3,4,5,3], good:'Most flexible: one canvas answers dozens of questions with the right chart, and scales to new data without new screens.', bad:'Puts the asking on the owner. The home has no opinion about what matters today, which a busy owner needs most.', weak:5, weakWhy:'is an analyst\'s tool. Busy owners will not build sentences, and without a strong "today" view it fails the 5-second test.'},
  mount(el){ root = el; cur = 'cash|ahead'; mode = 'chart';
    const k = [['cash|ahead','Cash',F.peso(D.cash.total)],['profit|month','Profit, Aug',F.peso(D.month.profit)],['owed|customer','Owed to me',F.peso(D.receivablesTotal)],['owe|due','I owe',F.peso(D.payablesTotal)],['stock|cover','Stock',F.peso(D.stockValue)],['exp|normal','Expenses',F.peso(D.expenseTotal)]];
    el.innerHTML = `<div class="ln-wrap"><header class="ln-top"><div class="ln-brand"><b>Lens</b><span>${D.biz.short} · ${D.biz.todayShort}</span></div>
        <div class="ln-kpis">${k.map(x => `<button type="button" onclick="LENS.set('${x[0]}')"><span>${x[1]}</span><b class="num">${x[2]}</b></button>`).join('')}</div></header>
      <div class="ln-grid"><aside class="ln-rail" aria-label="Pinned lenses"><h3>Pinned lenses</h3><div class="ln-pins">${PINS.map(p => `<button type="button" data-k="${p[0]}" onclick="LENS.set('${p[0]}')">${p[1]}</button>`).join('')}</div><button type="button" class="ln-pinadd" onclick="proto('Pin this lens')">+ Pin current lens</button></aside>
        <main class="ln-main"><div class="ln-sentence" id="lnSentence"></div>
          <div class="ln-card"><div class="ln-ch"><h2 id="lnTitle"></h2><div class="ln-mode" role="group" aria-label="View as"><button type="button" data-m="chart" onclick="LENS.mode('chart')">Chart</button><button type="button" data-m="table" onclick="LENS.mode('table')">Table</button></div></div>
            <div class="ln-canvas" id="lnCanvas"></div><p class="ln-hint">Click any bar or point to inspect it.</p></div>
          <section class="ln-inspect" id="lnInspect" hidden aria-label="Inspector"></section></main>
        <aside class="ln-side"><h3>What this view says</h3><ul class="ln-notes" id="lnNotes"></ul>
          <div class="ln-ask"><label for="lnAsk">Ask Nifti</label><select id="lnAsk" onchange="LENS.ask()"><option value="">Choose a question</option>${D.ask.map((a,i) => `<option value="${i}">${a.q}</option>`).join('')}</select><div id="lnAns" aria-live="polite"></div></div></aside></div></div>`;
    render(); },
  run(k){ const map = {open:'cash|ahead', metric:'cash|ahead', expense:'exp|normal', overdue:'owed|customer', stock:'stock|cover', supplier:'owe|due', staff:'counts|day'};
    if(k === 'ask'){ LENS.ask(1); root.querySelector('#lnAns').scrollIntoView({behavior:'smooth', block:'center'}); return; }
    LENS.set(map[k]); if(k === 'open') return;
    const pick = k === 'expense' ? V['exp|normal'].rows().findIndex(r => r.cat === 'Electricity') : {metric:6, overdue:0, stock:0, supplier:0, staff:5}[k]; LENS.pick(pick); }
});
})();
