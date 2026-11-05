/* 09 · Meridian — time-first. One horizontal timeline, 1 Aug to 15 Sep, with today as the meridian. Behind it: what happened. Ahead: what is coming. */
(function(){
const D = ND;
let root, view = 'month', sel = 25, open = null;
const TODAY = 25, idx = s => { const [d, m] = s.split(' '); return m === 'Sep' ? 30 + +d : +d - 1; };
const label = i => i <= 30 ? (i + 1) + ' Aug' : (i - 30) + ' Sep', dow = i => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(i + 6) % 7];
const fc = D.forecast(), low = fc.reduce((a,b) => b.bal < a.bal ? b : a);
const LANES = [['sales','Sales','what came in each day'],['cash','Cash ahead','bank + GCash forecast'],['cust','Customers','late invoices, how long'],['sup','Suppliers','payments due'],['stock','Stock','run-outs and deliveries'],['staff','Drawers','daily counts'],['cost','Costs','bills against normal']];
const EV = [
  ...D.receivables.map((r,k) => ({lane:'cust', row:k, from:r.due.endsWith('Jul') ? -9 : idx(r.due), i:TODAY, label:`${r.cust.split(' ')[0]} ${F.k(r.amount)} · ${r.days}d`, tone:r.days > 20 ? 'r' : 'y', k:'overdue', amt:r.amount, txt:`${r.cust}: ${F.peso(r.amount)} now ${r.days} days late (due ${r.due})`})),
  {lane:'cust', row:3, i:27, label:'Corazon promised', tone:'b', k:'overdue', txt:'Corazon Welding promised ₱14,280 by GCash'},
  {lane:'sup', i:26, label:'Cheque ₱15.4K', tone:'y', k:'supplier', txt:'Metro Steel cheque ₱15,400 clears (deposit on PO-0870)'},
  {lane:'sup', i:26, label:'Balintawak COD', tone:'y', k:'supplier', txt:'Balintawak Wire ₱9,840 cash on delivery, if they deliver', row:1},
  {lane:'sup', i:32, label:'Metro ₱33.5K', tone:'r', k:'supplier', txt:'Metro Steel balance ₱33,500 on delivery of 20 I-beams'},
  {lane:'sup', i:41, label:'Quezon ₱22.4K', tone:'n', k:'supplier', txt:'Quezon Fasteners ₱22,400 due'},
  {lane:'sup', i:45, label:'Cebu ₱31.9K', tone:'n', k:'supplier', txt:'Cebu Aggregates July bill ₱31,860 due'},
  {lane:'stock', i:24, label:'Wire late', tone:'r', k:'stock', txt:'Balintawak wire delivery was due; now 1 day late'},
  {lane:'stock', i:24, label:'Nails in ✓', tone:'g', k:'stock', txt:'Quezon Fasteners delivered 400 kg nails, matches the order', row:1},
  {lane:'stock', i:27, label:'Cement out', tone:'r', k:'stock', txt:'Portland Cement runs out (12 bags, 6.5 a day). Answer Cebu by today.'},
  {lane:'stock', i:29, label:'Wire out', tone:'r', k:'stock', txt:'Galvanized wire runs out (6 rolls, 1.4 a day)', row:1},
  {lane:'stock', i:32, label:'+20 I-beams', tone:'y', k:'supplier', txt:'Metro Steel delivers 20 I-beams (you already have 35 days)'},
  {lane:'stock', i:34, label:'Tie wire low', tone:'y', k:'stock', txt:'Tie wire reaches zero around here (18 rolls, 2 a day)', row:1},
  ...D.counts.map(c => ({lane:'staff', i:idx(c.d), label:c.got == null ? 'to count' : c.got - c.exp ? F.signed(c.got - c.exp) : '✓', tone:c.got == null ? 'n' : c.got - c.exp < -100 ? 'r' : 'g', k:c.got != null && c.got - c.exp < -100 ? 'staff' : 'count', txt:`${c.who.split(' ')[0]}: ${c.got == null ? 'count due tonight, expected ' + F.peso(c.exp) : 'expected ' + F.peso(c.exp) + ', counted ' + F.peso(c.got)}`, dot:true})),
  {lane:'cost', from:0, i:TODAY, label:'Electricity ₱8,940 · +51% vs normal', tone:'r', k:'expense', txt:'Electricity this month: ₱8,940 against ₱5,923 normal'},
  {lane:'cost', i:30, label:'Salaries', tone:'n', k:'metric', txt:'Salaries ₱14,000'},
  {lane:'cost', i:31, label:'Rent', tone:'n', k:'metric', txt:'Rent ₱18,000', row:1}
];
const win = () => view === 'month' ? [0, 45] : [18, 39];
const pos = (i, a, n) => ((i - a) / n * 100).toFixed(3) + '%';

function timeline(){ const [a, b] = win(), n = b - a + 1, days = Array.from({length:n}, (_, k) => a + k), mxs = Math.max(...D.daily);
  const evs = l => EV.filter(e => e.lane === l && (e.from != null ? e.i >= a && e.from <= b : e.i >= a && e.i <= b));
  const lane = l => { if(l === 'sales') return days.map(i => i < D.daily.length ? `<i class="md-sb${D.daily[i] > 30000 ? ' is-big' : ''}" style="left:${pos(i, a, n)};width:calc(${(100 / n).toFixed(3)}% - 2px);height:${(D.daily[i] / mxs * 100).toFixed(1)}%" title="${label(i)}: ${F.peso(D.daily[i])}"></i>` : '').join('');
      if(l === 'cash'){ const pts = fc.map((p,k) => ({i:26 + k, v:p.bal})).filter(p => p.i >= a && p.i <= b), top = v => (100 - (v - 20000) / 90000 * 100).toFixed(1) + '%';
        return `<span class="md-safe" style="top:${top(D.cash.safety)}"><em>Safety ₱40,000</em></span><span class="md-now" style="left:calc(${pos(TODAY, a, n)} + ${(50 / n).toFixed(3)}%);top:${top(D.cash.total)}" title="Today ${F.peso(D.cash.total)}"></span>` + pts.map(p => `<button type="button" class="md-cp${p.v < D.cash.safety ? ' is-r' : ''}" style="left:calc(${pos(p.i, a, n)} + ${(50 / n).toFixed(3)}%);top:${top(p.v)}" onclick="MER.day(${p.i},'metric')" aria-label="${label(p.i)}: ${F.peso(p.v)}"></button>`).join('') + `<span class="md-lowl" style="left:calc(${pos(32, a, n)} + ${(50 / n).toFixed(3)}%);top:${top(low.bal)}">${F.peso(low.bal)} low</span>`; }
      return evs(l).map(e => { const L = e.from != null ? Math.max(e.from, a) : e.i, R = e.from != null ? Math.min(e.i, b) + 1 : e.i + 1;
        const end = e.from == null && !e.dot && (L - a) / n > .8, x = end ? `right:${(100 - (R - a) / n * 100).toFixed(3)}%` : `left:${pos(L, a, n)}`;
        return `<button type="button" class="md-ev is-${e.tone}${e.from != null ? ' is-span' : ''}${e.dot ? ' is-dot' : ''}${end ? ' is-end' : ''}" style="top:${4 + (e.row || 0) * 27}px;${x};${e.from != null ? `width:${((R - L) / n * 100).toFixed(3)}%` : e.dot ? `width:${(100 / n).toFixed(3)}%` : ''}" onclick="event.stopPropagation();MER.ev(${EV.indexOf(e)})" aria-label="${F.esc(e.txt)}" title="${F.esc(e.txt)}">${e.dot ? `<i></i>${e.tone === 'r' ? `<span>${e.label}</span>` : ''}` : (e.from != null && e.from < a ? '◂ ' : '') + e.label}</button>`; }).join(''); };
  return `<div class="md-tl" style="--n:${n}" onclick="MER.click(event)">
    <div class="md-hdr"><span class="md-lh"></span><div class="md-days">${days.map(i => `<span class="${i === TODAY ? 'is-today' : ''}${dow(i) === 'Sun' ? ' is-sun' : ''}${i === sel ? ' is-sel' : ''}${i > TODAY ? ' is-fut' : ''}" style="left:${pos(i, a, n)};width:${(100 / n).toFixed(3)}%">${i === 0 || i === 31 ? `<b>${i === 0 ? 'Aug' : 'Sep'}</b>` : ''}<small>${dow(i)[0]}</small>${i <= 30 ? i + 1 : i - 30}</span>`).join('')}</div></div>
    ${LANES.map(([id, name, sub]) => `<div class="md-lane is-${id}"><span class="md-lh"><b>${name}</b><small>${sub}</small></span><div class="md-track">${lane(id)}</div></div>`).join('')}
    <div class="md-over" aria-hidden="true"><span class="md-lh"></span><div class="md-ot"><i class="md-past" style="width:${pos(TODAY + 1, a, n)}"></i><i class="md-mer" style="left:calc(${pos(TODAY, a, n)} + ${(50 / n).toFixed(3)}%)"><em>Today · 26 Aug</em></i>${sel !== TODAY ? `<i class="md-selb" style="left:${pos(sel, a, n)};width:${(100 / n).toFixed(3)}%"></i>` : ''}</div></div></div>`; }

function ledger(){ const evs = EV.filter(e => e.from != null ? (sel >= e.from && sel <= e.i) : e.i === sel), f = fc.find((p,k) => 26 + k === sel);
  const rows = [];
  if(sel < D.daily.length) rows.push(`<li class="is-in"><span>Sales</span><b class="num">${F.peso(D.daily[sel])}</b></li>`);
  if(sel === TODAY) rows.push(`<li><span>Cash now (BDO + GCash)</span><b class="num">${F.peso(D.cash.total)}</b></li>`);
  if(f) rows.push(`<li class="${f.bal < D.cash.safety ? 'is-r' : ''}"><span>Cash by end of day (forecast)</span><b class="num">${F.peso(f.bal)}</b></li>` + f.ev.map(e => `<li class="is-sub"><span>${e.label}</span><b class="num ${e.amt < 0 ? 'is-neg' : 'is-pos'}">${F.signed(e.amt)}</b></li>`).join(''));
  evs.forEach(e => rows.push(`<li><button type="button" class="md-lb is-${e.tone}" onclick="MER.ev(${EV.indexOf(e)})"><span>${e.txt}</span><em>Open</em></button></li>`));
  return `<div class="md-lg-h"><p>${sel === TODAY ? 'Today' : sel < TODAY ? (TODAY - sel) + ' days ago' : 'In ' + (sel - TODAY) + ' days'}</p><h2>${dow(sel)} ${label(sel)}</h2>
      <div class="md-jump"><button type="button" onclick="MER.day(${sel - 1})" aria-label="Previous day">‹</button><button type="button" onclick="MER.day(${TODAY})">Today</button><button type="button" onclick="MER.day(${sel + 1})" aria-label="Next day">›</button></div></div>
    <ul class="md-lg">${rows.join('') || '<li><span>Nothing recorded or scheduled.</span></li>'}</ul>`; }

function render(){ root.querySelector('#mdTl').innerHTML = timeline(); root.querySelector('#mdLedger').innerHTML = ledger();
  root.querySelectorAll('.md-zoom button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === view ? 'true' : 'false'));
  const sc = root.querySelector('#mdTl'), t = sc.querySelector('.md-mer'); if(t && sc.scrollWidth > sc.clientWidth){ const r = t.getBoundingClientRect(), s = sc.getBoundingClientRect(); sc.scrollLeft += r.left - s.left - sc.clientWidth * .55; } }
function detail(f){ const box = root.querySelector('#mdDetail'); box.innerHTML = `<div class="md-dh"><div><p>${f.kicker}</p><h3>${f.title}</h3></div><button type="button" onclick="MER.closeD()" aria-label="Close">✕</button></div>${f.body}`; box.hidden = false; box.scrollIntoView({behavior:'smooth', block:'nearest'}); }
const MER = {
  zoom(v){ view = v; if(view === 'fort' && (sel < 18 || sel > 39)) sel = TODAY; render(); },
  day(i, k){ sel = Math.max(0, Math.min(45, i)); if(view === 'fort' && (sel < 18 || sel > 39)) view = 'month'; render(); if(k) detail(k === 'metric' ? FLOWS.metric('cash') : k === 'profit' ? FLOWS.metric('profit') : FLOWS[k]()); },
  ev(n){ const e = EV[n]; sel = e.from != null ? sel : e.i; render();
    detail(e.k === 'metric' ? FLOWS.metric('cash') : e.k === 'count' ? {kicker:'Drawer count', title:e.txt.split(':')[0] + ' · ' + label(e.i), body:`<p class="fx-lede">${e.txt}.</p>${FLOWS.kv([['Who', e.txt.split(':')[0]], ['Result', e.label === '✓' ? 'Matched' : e.label]])}`} : FLOWS[e.k]()); },
  click(ev){ const tr = ev.target.closest('.md-track,.md-days'); if(!tr) return; const r = tr.getBoundingClientRect(), [a, b] = win(); MER.day(a + Math.floor((ev.clientX - r.left) / r.width * (b - a + 1))); },
  closeD(){ root.querySelector('#mdDetail').hidden = true; },
  ask(i){ const s = root.querySelector('#mdAsk'); if(i != null) s.value = String(i); if(s.value === '') return; const a = D.ask[+s.value];
    root.querySelector('#mdAns').innerHTML = `<p class="md-aq">${a.q}</p><p>${a.a}</p><small>From ${a.src.toLowerCase()} · sample answer</small>`; }
};
window.MER = MER;

LAB.register({
  id:'meridian', n:9, name:'Meridian', territory:'Time-first timeline', tagline:'Everything on one line of time, with today as the meridian',
  fonts:'family=Red+Hat+Display:wght@400;500;600;700;800&family=Red+Hat+Mono:wght@400;500;600',
  identity:{
    vision:'Owners think in days: when does the cheque clear, when does cement run out, when did the drawer go short. Meridian puts every money, stock and staff event on one shared timeline, behind and ahead of today.',
    philosophy:'Cause and timing are the story. Seeing that the Metro Steel balance, rent and salaries all land in the same three days explains the cash dip better than any total. Composed, navigational, precise.',
    distinct:'A single horizontal time axis is the whole navigation. Seven swim lanes share it. The "today" meridian splits history from forecast. Pick any day to get its ledger.',
    type:'Red Hat Display for labels and headings, Red Hat Mono for dates and pesos.',
    color:'White chart room, navy ink, the past in a faint wash and the future in white. Dark blue for money in, red for money out or trouble, amber for watch, green for done.',
    visual:'Swim lanes, a meridian line, day ticks and capsules. Like a Gantt chart crossed with a bank statement.',
    motion:'The timeline glides to keep today in view; the selected day band slides between columns.',
    arch:'Behind / Ahead strip · Timeline (Sales, Cash ahead, Customers, Suppliers, Stock, Drawers, Costs) · Day ledger · Detail panel · Ask. Month or fortnight zoom.'
  },
  components:[['Meridian timeline','seven lanes on one time axis, today as the divide'],['Behind / Ahead strip','what happened next to what is coming'],['Day ledger','every event, sale and forecast for one day'],['Span capsules','late invoices drawn as length of lateness'],['Zoom switch','month or fortnight'],['Forecast lane','cash points against the safety line']],
  tasks:{open:'Timeline centred on today; the ledger shows today.', metric:'Cash lane: the red point on 2 Sep opens the cash detail.', expense:'Costs lane: the red Electricity capsule.', overdue:'Customers lane: Riverside\'s capsule is the longest.', stock:'Stock lane: "Cement out" on 28 Aug.', supplier:'Suppliers lane: cheque on 27 Aug.', staff:'Drawers lane: the red −₱800 on 24 Aug.', ask:'Ask about any day, under the ledger.'},
  map:{arch:'Single timeline with swim lanes', nav:'Time axis, day picking, zoom', viz:'Lanes, spans, forecast points, columns', type:'Red Hat Display + Mono'},
  eval:{scores:[4,3,4,3,3,4,4], good:'Best at "when": collisions of payments, run-outs and promises are obvious at a glance.', bad:'Dense, and needs sideways scrolling on a phone. "Who owes me most" is easier in a list than on a time axis.', weak:1, weakWhy:'is the weakest overall: the timeline is powerful for planning but hard to read on a phone, and most daily questions are "what" and "who", not "when".'},
  mount(el){ root = el; view = 'month'; sel = TODAY;
    const pay8 = D.payables.filter(p => p.dueIdx < 8).reduce((s,p) => s + p.amount, 0);
    el.innerHTML = `<div class="md-wrap"><header class="md-top"><div class="md-id"><b>Meridian</b><span>${D.biz.short} · ${D.biz.todayLabel}</span></div>
        <div class="md-zoom" role="group" aria-label="Zoom"><button type="button" data-v="month" onclick="MER.zoom('month')">1 Aug – 15 Sep</button><button type="button" data-v="fort" onclick="MER.zoom('fort')">Three weeks</button></div></header>
      <div class="md-ba"><div class="md-b"><p>Behind · August so far</p><div><button type="button" onclick="MER.day(${TODAY},'metric')"><span>Cash now</span><b class="num">${F.peso(D.cash.total)}</b></button><button type="button" onclick="MER.day(${TODAY},'profit')"><span>Sales · profit</span><b class="num">${F.k(D.month.revenue)} · ${F.k(D.month.profit)}</b></button><button type="button" onclick="MER.ev(0)"><span>Customers owe</span><b class="num">${F.peso(D.receivablesTotal)}</b></button></div></div>
        <div class="md-a"><p>Ahead · next 14 days</p><div><button type="button" onclick="MER.day(32,'metric')"><span>Lowest cash</span><b class="num is-r">${F.peso(low.bal)} · 2 Sep</b></button><button type="button" onclick="MER.day(26,'supplier')"><span>Due in 8 days</span><b class="num">${F.peso(pay8)}</b></button><button type="button" onclick="MER.day(27,'stock')"><span>Run-outs</span><b class="num">2 items by 30 Aug</b></button></div></div></div>
      <div class="md-scroll" id="mdTl"></div>
      <div class="md-below"><section class="md-ledger" id="mdLedger" aria-live="polite"></section>
        <div class="md-right"><section class="md-detail" id="mdDetail" hidden></section>
          <div class="md-ask"><label for="mdAsk">Ask Nifti</label><select id="mdAsk" onchange="MER.ask()"><option value="">Choose a question</option>${D.ask.map((a,i) => `<option value="${i}">${a.q}</option>`).join('')}</select><div id="mdAns" aria-live="polite"></div></div></div></div></div>`;
    render(); },
  run(k){ if(k === 'open'){ MER.closeD(); return MER.day(TODAY); }
    if(k === 'ask'){ MER.ask(2); root.querySelector('#mdAns').scrollIntoView({behavior:'smooth', block:'center'}); return; }
    const find = f => EV.findIndex(f);
    const n = {metric:-1, expense:find(e => e.k === 'expense'), overdue:find(e => e.lane === 'cust'), stock:find(e => e.label === 'Cement out'), supplier:find(e => e.label.startsWith('Cheque')), staff:find(e => e.k === 'staff')}[k];
    if(k === 'metric') return MER.day(32, 'metric'); MER.ev(n); }
});
})();
