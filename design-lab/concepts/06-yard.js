/* 06 · Yard — modern distribution operations. Goods and money drawn as movement: inbound and outbound lanes, dock schedule, cover vs lead time, capital on the shelf. */
(function(){
const D = ND;
let root, docket;
const IN = [['To confirm',0],['On the way',2],['Received',3],['Paid',5]], OUT = [['Preparing',1],['Billed',4],['Paid',5]];
const ticket = o => `<button type="button" class="yd-tk is-${o.tone}" onclick="YARD.open('order','${o.id}')"><span class="yd-tk-id">${o.id}</span><b>${o.who}</b><span class="num">${F.peso(o.amount)}</span><small>${o.note}</small></button>`;
function lanes(){
  const lane = (side, stages, title, sub) => `<div class="yd-lane is-${side}"><div class="yd-lh"><span class="yd-arrow" aria-hidden="true">${side === 'buy' ? '⟶' : '⟶'}</span><b>${title}</b><small>${sub}</small></div>
    <div class="yd-track" style="--n:${stages.length}">${stages.map(([name, st]) => { const os = D.orders.filter(o => o.side === side && o.stage === st); return `<div class="yd-st"><div class="yd-sth"><span>${name}</span><b class="num">${os.length ? F.k(os.reduce((a,o) => a + o.amount, 0)) : '—'}</b></div>${os.map(ticket).join('') || '<p class="yd-empty">Nothing here</p>'}</div>`; }).join('')}</div></div>`;
  return `<section class="yd-flow" aria-labelledby="ydFlowH"><div class="yd-sec-h"><h2 id="ydFlowH">Flow</h2><span>Goods in from suppliers, through the warehouse, out to customers</span></div>
    <div class="yd-flowgrid">${lane('buy', IN, 'Inbound', 'from 4 suppliers')}
      <button type="button" class="yd-wh" onclick="YARD.open('stock')"><span>Warehouse</span><b class="num">${F.peso(D.stockValue)}</b><small>at cost · 8 items · 2 below supplier lead time</small></button>
      ${lane('sell', OUT, 'Outbound', 'to 6 customers')}</div></section>`;
}
function cover(){
  const mx = 40, rows = D.stock.slice().sort((a,b) => a.cover / a.lead - b.cover / b.lead);
  return `<section aria-labelledby="ydCovH"><div class="yd-sec-h"><h2 id="ydCovH">Cover against lead time</h2><span>Bar = days of stock at today's selling rate · notch = days the supplier needs</span></div>
    <div class="yd-cov">${rows.map(s => `<button type="button" class="yd-cr is-${s.risk}" onclick="YARD.open('stock')"><span class="yd-cn"><b>${s.name}</b><small>${s.on} ${s.unit} · sells ${s.perDay}/day · ${s.sup}</small></span>
      <span class="yd-cb"><i style="width:${Math.min(100, s.cover / mx * 100).toFixed(1)}%"></i><u style="left:${(s.lead / mx * 100).toFixed(1)}%" aria-hidden="true"></u></span><b class="yd-cd num">${F.days(s.cover)}</b><span class="yd-cs">${s.risk === 'r' ? '▲ short before delivery' : s.risk === 'y' ? '● order soon' : '✓ covered'}</span></button>`).join('')}
      <div class="yd-axr" aria-hidden="true"><span></span><span class="yd-axb">${[0,10,20,30,40].map(v => `<i style="left:${v / mx * 100}%">${v}${v === 40 ? '+' : ''}</i>`).join('')}</span><span>days</span><span></span></div></div></section>`;
}
function dock(){
  const days = ['Wed 26','Thu 27','Fri 28','Sat 29','Sun 30','Mon 31','Tue 1','Wed 2'];
  const ev = [
    {d:1, lane:'in', t:'Balintawak wire (late)', k:'stock', tone:'r'}, {d:7, lane:'in', t:'Metro Steel · 20 I-beams', k:'supplier', tone:'y'}, {d:4, lane:'in', t:'Cebu cement if confirmed today', k:'stock', tone:'y'},
    {d:1, lane:'out', t:'Bayview · 560 rebar', k:'overdue', tone:'g'}, {d:2, lane:'out', t:'Manila Bay · 68 angle bars', k:'order', ref:'SO-0302', tone:'g'},
    {d:1, lane:'cash', t:'Cheque −₱15,400', k:'supplier', tone:'y'}, {d:2, lane:'cash', t:'Corazon +₱14,280 promised', k:'overdue', tone:'g'}, {d:5, lane:'cash', t:'Salaries −₱14,000', k:'metric', tone:'y'}, {d:6, lane:'cash', t:'Rent −₱18,000', k:'metric', tone:'y'}, {d:7, lane:'cash', t:'Metro −₱33,500 · cash low', k:'metric', tone:'r'},
    {d:0, lane:'in', t:'Confirm Cebu cement order', k:'order', ref:'PO-0877', tone:'r'}, {d:0, lane:'out', t:'Load Bayview rebar', k:'order', ref:'SO-0301', tone:'y'}, {d:0, lane:'cash', t:'Count drawers 6 pm', k:'staff', tone:'y'},
    {d:0, lane:'out', t:'Cement runs out Fri', k:'stock', tone:'r', at:2}
  ];
  return `<section aria-labelledby="ydDockH"><div class="yd-sec-h"><h2 id="ydDockH">Dock schedule</h2><span>Next 8 days · trucks in, trucks out, money moving</span></div>
    <div class="yd-dockw"><div class="yd-dock" style="--n:${days.length}"><span></span>${days.map((d,i) => `<span class="yd-dd${i === 0 ? ' is-today' : ''}">${d}${i === 0 ? ' · today' : ''}</span>`).join('')}
      ${[['in','Inbound'],['out','Outbound'],['cash','Money']].map(([l,n]) => `<span class="yd-dl">${n}</span>${days.map((d,i) => `<div class="yd-dc${i === 0 ? ' is-today' : ''}">${ev.filter(e => e.lane === l && (e.at != null ? e.at : e.d) === i).map(e => `<button type="button" class="yd-ev is-${e.tone}" onclick="YARD.open('${e.k}'${e.ref ? `,'${e.ref}'` : ''})">${e.t}</button>`).join('')}</div>`).join('')}`).join('')}</div></div></section>`;
}
function capital(){
  const total = D.stockValue, by = D.stock.slice().sort((a,b) => b.value - a.value), rows = [by.slice(0,3), by.slice(3)];
  const blk = s => `<button type="button" class="yd-blk${s.cover > 30 ? ' is-slow' : s.risk === 'r' ? ' is-short' : ''}" style="flex-grow:${s.value}" onclick="YARD.open('${s.cover > 30 ? 'supplier' : 'stock'}')" title="${s.name}: ${F.peso(s.value)}, ${F.days(s.cover)} of stock"><b>${s.name}</b><span class="num">${F.peso(s.value)} · ${Math.round(s.value / total * 100)}%</span><small>${F.days(s.cover)} of stock</small><i class="yd-bar" style="width:${(s.value / by[0].value * 100).toFixed(1)}%"></i></button>`;
  return `<section aria-labelledby="ydCapH"><div class="yd-sec-h"><h2 id="ydCapH">Capital on the shelf</h2><span>Area = pesos tied up at cost · stripes = slow sellers (over 30 days of stock) · red = running short</span></div>
    <div class="yd-cap">${rows.map(r => `<div class="yd-caprow" style="flex-grow:${r.reduce((a,s) => a + s.value, 0)}">${r.map(blk).join('')}</div>`).join('')}</div>
    <p class="yd-note"><b>I-beams hold 37% of shelf capital and sell 0.4 a day.</b> Metro Steel is delivering 20 more on 2 Sep. <button type="button" class="yd-lnk" onclick="YARD.open('supplier')">Review that order</button></p></section>`;
}
function crew(){
  return `<section aria-labelledby="ydCrewH"><div class="yd-sec-h"><h2 id="ydCrewH">Crew and drawers</h2><span>Counts, discounts and anything to verify</span></div>
    <div class="yd-crew">${D.staff.map(s => `<button type="button" class="yd-cw${s.net ? ' is-r' : ''}" onclick="YARD.open('${s.net ? 'staff' : 'person'}')"><span class="yd-ini">${s.ini}</span><span><b>${s.name}</b><small>${s.role}</small></span><span class="num">${s.counts} counts · net ${F.signed(s.net)}</span><span class="num">discounts ${F.peso(s.discounts)}</span><span class="yd-cwn">${s.net ? '▲ ' : '✓ '}${s.note}</span></button>`).join('')}</div></section>`;
}
function orderDocket(id){ const o = D.orders.find(x => x.id === id);
  return {kicker:(o.side === 'buy' ? 'Inbound · ' : 'Outbound · ') + o.id, title:o.who, body:`<div class="yd-man"><div><span>Items</span><b>${o.items}</b></div><div><span>Value</span><b class="num">${F.peso(o.amount)}</b></div><div><span>Stage</span><b>${D.stages[o.stage]}</b></div><div><span>Status</span><b>${o.note}</b></div></div>
    <ol class="yd-steps">${D.stages.map(s => o.side === 'buy' ? ({Preparing:'Supplier packing', Delivered:'Received', Billed:'Bill in'}[s] || s) : s).map((s,i) => `<li class="${i < o.stage ? 'done' : i === o.stage ? 'now' : ''}">${s}</li>`).join('')}</ol>
    <div class="fx-next"><button type="button" class="fx-btn is-primary" onclick="proto('${o.stage === 0 ? 'Confirm order' : o.stage === 1 ? 'Mark as loaded' : o.stage === 2 ? 'Mark as received' : o.stage === 4 ? 'Send reminder' : 'Print docket'}')">${o.stage === 0 ? 'Confirm order' : o.stage === 1 ? 'Mark as loaded' : o.stage === 2 ? 'Mark as received' : o.stage === 4 ? 'Send reminder' : 'Print docket'}</button><button type="button" class="fx-btn" onclick="proto('Print docket')">Print docket</button></div>`}; }
const YARD = {
  open(k, ref){ let f;
    if(k === 'order'){ f = ref.startsWith('INV') ? FLOWS.overdue() : ref === 'PO-0870' ? FLOWS.supplier() : (ref === 'PO-0877' || ref === 'PO-0841') ? FLOWS.stock() : orderDocket(ref); if(ref.startsWith('INV') || ref === 'PO-0870' || ref === 'PO-0877' || ref === 'PO-0841'){ const od = orderDocket(ref); f = {kicker:od.kicker, title:od.title, body:od.body + '<hr class="yd-hr">' + f.body}; } }
    else if(k === 'person') f = {kicker:'Crew', title:'Liza Santos · cashier', body:`<p class="fx-lede">Five counts this month, all within ₱20. Counting the drawer tonight.</p>${FLOWS.kv([['Counts','5'],['Net','₱0'],['Discounts','₱0'],['Edited counts','1 typo, fixed by Ben']])}`};
    else f = k === 'metric' ? FLOWS.metric(ref || 'cash') : FLOWS[k]();
    docket.innerHTML = `<div class="yd-dk" role="dialog" aria-modal="true" aria-label="${F.esc(f.title)}"><div class="yd-dk-h"><span class="yd-tape" aria-hidden="true"></span><p>${f.kicker}</p><h3>${f.title}</h3><button type="button" class="yd-x" onclick="YARD.close()" aria-label="Close">✕</button></div><div class="yd-dk-b">${f.body}</div></div>`;
    docket.hidden = false; docket.querySelector('.yd-x').focus(); },
  close(){ docket.hidden = true; },
  ask(i){ const a = D.ask[i], box = root.querySelector('#ydAns'); box.innerHTML = `<p class="yd-q">${a.q}</p><p>${a.a}</p><small>From ${a.src.toLowerCase()} · sample answer</small>`; }
};
window.YARD = YARD;

LAB.register({
  id:'yard', n:6, name:'Yard', territory:'Modern distribution operations', tagline:'The business drawn as goods and money in motion',
  fonts:'family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700',
  identity:{
    vision:'A distributor thinks in trucks, shelves and days. Yard draws Nifti the way goods actually move: inbound lane, warehouse, outbound lane, then the dock schedule and the shelf.',
    philosophy:'Operations first, accounting as a consequence. When the owner sees an order stuck on a lane or a shelf running dry before the truck arrives, the money problem explains itself. Practical, alert, on top of things.',
    distinct:'Order tickets on conveyor lanes, a cover-against-lead-time chart (the one picture every distributor needs), an 8-day dock schedule mixing trucks and cash, and a capital map of the shelf.',
    type:'Barlow Condensed in caps for signage-like headers, lanes and tickets; Barlow for reading. Numbers tabular.',
    color:'White yard, graphite ink, safety yellow used only as a thin marker stripe, blue for inbound, teal for outbound, red for anything that stops the flow.',
    visual:'Lanes, tickets with perforated edges, notches and blocks. Each section is a band with a signage-style header, not a card.',
    motion:'Tickets lift on hover; the docket slides in like a clipboard from the right.',
    arch:'One operations board: Flow (inbound → warehouse → outbound), Cover against lead time, Dock schedule, Capital on the shelf, Crew and drawers. Every ticket, bar and block opens a docket.'
  },
  components:[['Conveyor lanes with order tickets','each order is a ticket on its stage'],['Warehouse hinge','stock value sits between inbound and outbound'],['Cover against lead time','days of stock with a notch for supplier lead time'],['Dock schedule','trucks in, trucks out and cash, day by day'],['Capital on the shelf','blocks sized by pesos tied up, shaded by slow movers'],['Docket panel','manifest-style detail with stage tracker']],
  tasks:{open:'The flow board: inbound, warehouse, outbound, then what arrives and leaves this week.', metric:'Money lane on the dock schedule; "cash low" on 2 Sep opens the position.', expense:'Ask the yard about costs, or open bills from the crew band (electricity is flagged).', overdue:'Billed tickets on the outbound lane open receivables.', stock:'Cover chart: red bars stop before their notch.', supplier:'Metro Steel ticket or the I-beam block opens the payment check and the overstock warning.', staff:'Crew band: Rico\'s row opens the drawer tally.', ask:'Radio box at the top: ask the yard; answer appears below.'},
  map:{arch:'Operations board: lanes, cover, dock, capital', nav:'Anchor bar of yard zones', viz:'Conveyor lanes, cover/lead bars, schedule grid, area blocks', type:'Barlow + Barlow Condensed'},
  eval:{scores:[5,4,4,5,4,4,5], good:'Most specific to distributors: cover against lead time and the dock schedule answer daily operational questions no generic dashboard does.', bad:'Finance (profit, expenses) is secondary and reached indirectly; owners who think money-first will look for it.'},
  mount(el){ root = el;
    el.innerHTML = `<div class="yd-wrap"><header class="yd-top"><div class="yd-sign"><b>NIFTI YARD</b><span>${D.biz.short.toUpperCase()} · WED 26 AUG · 14:15</span></div>
        <nav class="yd-zones" aria-label="Zones">${[['ydFlowH','Flow'],['ydCovH','Cover'],['ydDockH','Dock'],['ydCapH','Capital'],['ydCrewH','Crew']].map(([id,l]) => `<button type="button" onclick="document.getElementById('${id}').scrollIntoView({behavior:'smooth',block:'start'})">${l}</button>`).join('')}</nav>
        <div class="yd-radio"><label for="ydAsk">Ask the yard</label><select id="ydAsk" onchange="if(this.value!=='')YARD.ask(+this.value)"><option value="">Choose a question</option>${D.ask.map((a,i) => `<option value="${i}">${a.q}</option>`).join('')}</select></div></header>
      <div class="yd-ans" id="ydAns" aria-live="polite"></div>
      <div class="yd-kpis"><button type="button" onclick="YARD.open('metric','cash')"><span>Cash</span><b class="num">${F.peso(D.cash.total)}</b><small>low ₱39,730 on 2 Sep</small></button><button type="button" onclick="YARD.open('overdue')"><span>Billed, not paid</span><b class="num">${F.peso(D.receivablesTotal)}</b><small>4 customers late</small></button><button type="button" onclick="YARD.open('supplier')"><span>Owed to suppliers</span><b class="num">${F.peso(D.payablesTotal)}</b><small>cheque clears tomorrow</small></button><button type="button" onclick="YARD.open('metric','profit')"><span>August profit</span><b class="num">${F.peso(D.month.profit)}</b><small>pace ₱36,800</small></button><button type="button" onclick="YARD.open('expense')"><span>Bills</span><b class="num">${F.peso(D.expenseTotal)}</b><small>electricity +51%</small></button></div>
      <main class="yd-main">${lanes()}${cover()}${dock()}${capital()}${crew()}</main><div class="yd-scrim" id="ydDocket" hidden onclick="if(event.target===this)YARD.close()"></div></div>`;
    docket = el.querySelector('#ydDocket'); },
  run(k){ if(k === 'open'){ YARD.close(); window.scrollTo({top:0, behavior:'smooth'}); return; }
    if(k === 'ask'){ const s = root.querySelector('#ydAsk'); s.value = '3'; YARD.ask(3); s.scrollIntoView({block:'center'}); return; }
    if(k === 'overdue') return YARD.open('order','INV-0412'); if(k === 'supplier') return YARD.open('order','PO-0870');
    YARD.open(k, k === 'metric' ? 'cash' : null); }
});
})();
