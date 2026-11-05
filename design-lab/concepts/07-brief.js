/* 07 · Brief — decision-first. The day arrives as a short deck of decisions, one at a time; the rest of the business is summarised once you are through. */
(function(){
const D = ND;
let root, at = 0, done = {}, evidence = false;
const fc = D.forecast(), low = fc.reduce((a,b) => b.bal < a.bal ? b : a);

/* one focused picture per decision */
const VIS = {
  cash(){ const sw = root.querySelector('#brStack').clientWidth || 760, w = Math.max(300, Math.min(700, sw - 70)), h = w < 480 ? 200 : 190, pad = 34, step = w < 480 ? 4 : 2, mx = 110000, mn = 20000, x = i => pad + i * (w - pad - 10) / (fc.length - 1), y = v => h - 26 - (v - mn) / (mx - mn) * (h - 46);
    const d = fc.map((p,i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.bal).toFixed(1)).join(' '), li = fc.indexOf(low);
    return `<svg class="br-svg" viewBox="0 0 ${w} ${h}" style="max-width:${w}px" role="img" aria-label="Cash forecast for the next 14 days, lowest ${F.peso(low.bal)} on ${low.d}">
      <line x1="${pad}" x2="${w - 10}" y1="${y(D.cash.safety)}" y2="${y(D.cash.safety)}" class="br-safe"/><text x="${w - 10}" y="${y(D.cash.safety) - 6}" text-anchor="end" class="br-tx">Safety line ₱40,000</text>
      <path d="${d} L${x(fc.length - 1)} ${h - 26} L${pad} ${h - 26} Z" class="br-area"/><path d="${d}" class="br-line"/>
      <circle cx="${x(li)}" cy="${y(low.bal)}" r="6" class="br-low"/><text x="${x(li)}" y="${y(low.bal) + 22}" text-anchor="middle" class="br-tx is-r">${F.peso(low.bal)} · ${low.d}</text>
      <text x="${pad + 4}" y="${y(fc[0].bal) + 24}" class="br-tx">${F.k(fc[0].bal)} tomorrow</text>
      ${fc.map((p,i) => i % step ? '' : `<text x="${x(i)}" y="${h - 6}" text-anchor="middle" class="br-ax">${p.d}</text>`).join('')}</svg>`; },
  overdue(){ const mx = D.receivables[0].amount;
    return `<div class="br-hb">${D.receivables.map((r,i) => `<div class="br-hr${i === 0 ? ' is-focus' : ''}"><span>${r.cust}</span><i><b style="width:${(r.amount / mx * 100).toFixed(1)}%"></b></i><span class="num">${F.peso(r.amount)}</span><em>${r.days} days late</em></div>`).join('')}</div>`; },
  stock(){ const s = D.stock.find(x => x.sku === 'PC-40'), days = ['Wed 26','Thu 27','Fri 28','Sat 29','Sun 30'];
    return `<div class="br-days">${days.map((d,i) => `<div class="br-day${i < 2 ? ' is-has' : i === 2 ? ' is-out' : ''}"><span>${d}</span><b>${i === 0 ? '12 bags' : i === 1 ? '~6 left' : i === 2 ? 'Runs out' : ''}</b>${i === 3 ? '<em>Cement arrives if you confirm today</em>' : ''}</div>`).join('')}</div>
      <p class="br-cap">${s.on} bags · sells ${s.perDay} a day · Cebu Aggregates needs ${s.lead} days · the quoted price ends 28 Aug</p>`; },
  supplier(){ const ib = D.stock.find(x => x.sku === 'IB-01'), after = (ib.on + 20) / ib.perDay, mx = 90;
    return `<div class="br-cmp"><div><span>I-beams now</span><i><b style="width:${(ib.cover / mx * 100).toFixed(1)}%"></b></i><strong class="num">${F.days(ib.cover)} · ${F.peso(ib.value)}</strong></div>
      <div class="is-after"><span>After 20 more</span><i><b style="width:${(after / mx * 100).toFixed(1)}%"></b></i><strong class="num">${F.days(after)} · ${F.peso(ib.value + 48900)}</strong></div>
      <div class="is-alt"><span>If you take 10</span><i><b style="width:${((ib.on + 10) / ib.perDay / mx * 100).toFixed(1)}%"></b></i><strong class="num">${F.days((ib.on + 10) / ib.perDay)} · ${F.peso(ib.value + 24450)}</strong></div></div>`; },
  expense(){ const mx = 760;
    return `<div class="br-kwh">${D.electricity.map(e => `<div class="${e.m === 'Aug' ? 'is-hi' : ''}"><b style="height:${(e.kwh / mx * 100).toFixed(1)}%"><span class="num">${e.kwh} kWh</span></b><em>${e.m}</em><small class="num">${F.peso(e.amt)}</small></div>`).join('')}</div>`; },
  staff(){ const c = D.counts.slice().reverse().filter(x => x.got != null);
    return `<div class="br-cnt">${c.map(x => { const d = x.got - x.exp; return `<div class="${d < -100 ? 'is-r' : ''}"><i style="height:${Math.min(100, Math.abs(d) / 8 + 6)}%"></i><b class="num">${d === 0 ? '₱0' : F.signed(d)}</b><span>${x.d.replace(' Aug','')}</span><em>${x.who.split(' ')[0]}</em></div>`; }).join('')}</div>
      <p class="br-cap">Every drawer count since 19 Aug (counted minus expected). One stands out.</p>`; }
};

const CARDS = [
  {k:'cash', cat:'Money', q:`Cash dips to ${F.peso(low.bal)} on 2 Sep. Collect first, or move the Metro Steel balance?`,
   why:`Tomorrow's ₱15,400 cheque is fine. The squeeze is 2 Sep, when salaries, rent and the ₱33,500 Metro Steel balance land in the same week and cash ends ₱270 under your ₱40,000 safety line.`,
   opts:[['Collect Riverside first','Collect from Riverside first'],['Ask Metro to move to 9 Sep','Ask Metro Steel to move the balance to 9 Sep'],['Accept the dip','Accept the dip and watch it']], ev:() => FLOWS.metric('cash')},
  {k:'overdue', cat:'Customers', q:'Call Riverside Builders about ₱77,240, now 34 days late?',
   why:'They owe 44% of everything customers owe you. Two written reminders have not worked; they usually pay after a phone call.',
   opts:[['Call Engr. Mendoza','Call Engr. Paolo Mendoza'],['Send a final reminder','Send a final reminder'],['Pause new orders','Pause new orders until paid']], ev:() => FLOWS.overdue()},
  {k:'stock', cat:'Stock', q:'Confirm 220 bags of cement from Cebu Aggregates (₱63,056)?',
   why:'You have 12 bags and sell about 6.5 a day, so cement runs out Friday. Cebu needs 3 days, and their price holds only until 28 Aug.',
   opts:[['Confirm the order','Confirm PO-0877 with Cebu Aggregates'],['Confirm 120 bags only','Confirm a smaller order of 120 bags'],['Hold','Hold the cement order']], ev:() => FLOWS.stock()},
  {k:'supplier', cat:'Suppliers', q:'Cut the Metro Steel I-beam order from 20 to 10?',
   why:'You already hold 35 days of I-beams (₱32,200). Twenty more ties up ₱48,900 for over two months. The ₱15,400 deposit already covers most of a 10-beam order.',
   opts:[['Ask to reduce to 10','Ask Metro Steel to reduce PO-0870 to 10'],['Keep 20','Keep the order at 20'],['Cancel the balance','Ask Metro Steel to cancel the balance']], ev:() => FLOWS.supplier()},
  {k:'expense', cat:'Costs', q:'Electricity jumped 51% to ₱8,940. Check the shop before the next bill?',
   why:'Usage went from about 470 kWh a month to 712. The rate barely moved, so something is using more power, not costing more per unit.',
   opts:[['Ask Rico to check','Ask Rico to check the freezer and the new welding outlet'],['Call Meralco','Ask Meralco to check the meter'],['Ignore this month','Ignore it this month']], ev:() => FLOWS.expense()},
  {k:'staff', cat:'Staff', q:'Talk to Rico about 24 Aug (₱800 short, 6 boxes of rods missing)?',
   why:'One event, not a pattern yet. His other two counts matched. Rods he sold that day were the item missing at the next stock count.',
   opts:[['Ask Liza to recount rods','Ask Liza to recount the welding rod shelf'],['Talk to Rico today','Schedule a talk with Rico'],['Note it and watch','Note it and watch the next counts']], ev:() => FLOWS.staff()}
];

function deck(){ const c = CARDS[at], d = done[c.k], f = c.ev();
  return `<article class="br-card${d ? ' is-done' : ''}" aria-labelledby="brQ"><div class="br-meta"><span class="br-cat is-${c.k}">${c.cat}</span><span>Decision ${at + 1} of ${CARDS.length}</span></div>
    <h2 id="brQ">${c.q}</h2><p class="br-why">${c.why}</p>
    <div class="br-vis">${VIS[c.k]()}</div>
    ${d ? `<div class="br-stamp" role="status">✓ You chose: <b>${d}</b> <button type="button" onclick="BRIEF.undo()">Change</button></div>` :
      `<div class="br-opts">${c.opts.map((o,i) => `<button type="button" class="br-opt${i === 0 ? ' is-primary' : ''}" onclick="BRIEF.decide(${i})"><kbd>${i + 1}</kbd>${o[0]}</button>`).join('')}<button type="button" class="br-skip" onclick="BRIEF.go(${at + 1})">Not now</button></div>`}
    <button type="button" class="br-evbtn" aria-expanded="${evidence}" onclick="BRIEF.toggle()">${evidence ? 'Hide the evidence' : 'Show the evidence'}</button>
    <div class="br-ev"${evidence ? '' : ' hidden'}><p class="br-evk">${f.kicker}</p><h3>${f.title}</h3>${f.body}</div></article>`; }

function summary(){ const n = Object.keys(done).length;
  const tiles = [['cash','Cash now',F.peso(D.cash.total),`low ${F.peso(low.bal)} on ${low.d}`],['profit','August profit',F.peso(D.month.profit),'on pace for ₱36,800 · July ₱35,200'],['receivables','Customers owe',F.peso(D.receivablesTotal),'4 late'],['payables','You owe suppliers',F.peso(D.payablesTotal),'next: cheque tomorrow'],['stock','Stock at cost',F.peso(D.stockValue),'2 items short']];
  return `<article class="br-card is-end" aria-labelledby="brEnd"><div class="br-meta"><span class="br-cat">Done</span><span>${n} of ${CARDS.length} decided</span></div>
    <h2 id="brEnd">${n === CARDS.length ? 'That is everything for today.' : `You decided ${n}. ${CARDS.length - n} can wait.`}</h2>
    <p class="br-why">Nothing else needs you. Here is where the business stands.</p>
    <div class="br-tiles">${tiles.map(t => `<button type="button" onclick="BRIEF.metric('${t[0]}')"><span>${t[1]}</span><b class="num">${t[2]}</b><small>${t[3]}</small></button>`).join('')}</div>
    <div class="br-mx" id="brMx" hidden></div>
    <div class="br-ask"><label for="brAsk">Ask Nifti</label><div><select id="brAsk"><option value="">Choose a question</option>${D.ask.map((a,i) => `<option value="${i}">${a.q}</option>`).join('')}</select><button type="button" onclick="BRIEF.ask()">Ask</button></div><div id="brAns" aria-live="polite"></div></div>
    <button type="button" class="br-evbtn" onclick="BRIEF.go(0)">Back to the first decision</button></article>`; }

function render(){
  const end = at >= CARDS.length;
  root.querySelector('#brProg').innerHTML = CARDS.map((c,i) => `<button type="button" class="${done[c.k] ? 'is-done' : ''}${i === at ? ' is-now' : ''}" onclick="BRIEF.go(${i})" aria-label="Decision ${i + 1}: ${c.cat}${done[c.k] ? ', decided' : ''}"></button>`).join('') + `<button type="button" class="is-sum${end ? ' is-now' : ''}" onclick="BRIEF.go(${CARDS.length})" aria-label="Summary"></button>`;
  root.querySelector('#brRail').innerHTML = CARDS.map((c,i) => `<li><button type="button" class="${i === at ? 'is-now' : ''}" onclick="BRIEF.go(${i})"><span class="br-dot${done[c.k] ? ' is-done' : ''}">${done[c.k] ? '✓' : i + 1}</span><span><small>${c.cat}</small>${done[c.k] ? done[c.k] : c.q.split('?')[0].replace(/^(.{0,58}).*$/, (m, a) => a.length < m.length ? a + '…' : a)}</span></button></li>`).join('') + `<li><button type="button" class="${end ? 'is-now' : ''}" onclick="BRIEF.go(${CARDS.length})"><span class="br-dot">★</span><span><small>Then</small>Where the business stands</span></button></li>`;
  const stack = root.querySelector('#brStack'); stack.innerHTML = end ? summary() : deck();
  stack.style.setProperty('--left', Math.max(0, CARDS.length - at - 1));
  root.querySelector('#brPrev').disabled = at === 0; root.querySelector('#brNext').textContent = end ? 'Start again' : at === CARDS.length - 1 ? 'Finish' : 'Next';
}
const BRIEF = {
  go(i){ at = Math.max(0, Math.min(CARDS.length, i)); evidence = false; const s = root.querySelector('#brStack'); s.classList.remove('is-in'); void s.offsetWidth; s.classList.add('is-in'); render(); },
  decide(i){ const c = CARDS[at]; done[c.k] = c.opts[i][0]; proto(c.opts[i][1]); render(); setTimeout(() => { if(CARDS[at] === c) BRIEF.go(at + 1); }, 900); },
  undo(){ delete done[CARDS[at].k]; render(); },
  toggle(){ evidence = !evidence; render(); if(evidence) root.querySelector('.br-ev').scrollIntoView({behavior:'smooth', block:'start'}); },
  metric(k){ const f = FLOWS.metric(k), box = root.querySelector('#brMx'); box.hidden = false; box.innerHTML = `<div class="br-mxh"><div><p class="br-evk">${f.kicker}</p><h3>${f.title}</h3></div><button type="button" onclick="this.closest('.br-mx').hidden=true" aria-label="Close">✕</button></div>${f.body}`; box.scrollIntoView({behavior:'smooth', block:'start'}); },
  ask(i){ const s = root.querySelector('#brAsk'); if(i != null) s.value = String(i); if(s.value === '') return; const a = D.ask[+s.value], box = root.querySelector('#brAns');
    box.innerHTML = `<div class="br-a"><p class="br-aq">${a.q}</p><p>${a.a}</p><small>From ${a.src.toLowerCase()} · sample answer</small></div>`; }
};
window.BRIEF = BRIEF;
if(!window.__brKey){ window.__brKey = true; document.addEventListener('keydown', e => { if(!document.querySelector('.cx-brief') || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || document.querySelector('#aboutPanel:not([hidden]),#walkPanel:not([hidden])')) return;
  if(e.key === 'ArrowRight') BRIEF.go(at + 1); else if(e.key === 'ArrowLeft') BRIEF.go(at - 1); else if(/^[1-3]$/.test(e.key) && at < CARDS.length && !done[CARDS[at].k]) BRIEF.decide(+e.key - 1); }); }

LAB.register({
  id:'brief', n:7, name:'Brief', territory:'Decision-first briefing', tagline:'Six decisions, one at a time, then you are done',
  fonts:'family=Manrope:wght@400;500;600;700;800',
  identity:{
    vision:'The owner does not open Nifti to look at numbers; they open it to know what to do. Brief turns the day into a short deck of decisions, each with one picture and two or three real choices, and only then shows the state of the business.',
    philosophy:'A dashboard should end. Brief has a finish line: when the six decisions are made, Nifti says so. Calm, decisive, finished.',
    distinct:'Linear, one-card-at-a-time architecture with a progress bar and keyboard shortcuts. The overview is the last card, not the first. Every card has its own purpose-built chart and an evidence drawer with the full working.',
    type:'Manrope throughout: heavy 800 for the question, 500 for reasoning. Big type, few words.',
    color:'Pale lilac-grey room, white cards, deep indigo for the primary choice. Category chips carry the only other colour. Red only on the number that caused the decision.',
    visual:'A stack of cards with edges showing how many remain. Rounded, generous padding, one visual per card.',
    motion:'The card rises in; when you decide, a stamp appears and the next card slides up. Respects reduced motion.',
    arch:'Deck of 6 decisions (cash, customers, stock, suppliers, costs, staff) → summary card with five numbers, metric drill-down and Ask Nifti. Rail on the right lists the deck.'
  },
  components:[['Decision card','question, reason, one tailored chart, 2–3 choices'],['Deck progress','segmented bar you can jump through, plus ←/→ and 1–3 keys'],['Evidence drawer','the full investigation behind a card'],['Decision stamp','records the choice with a Change link'],['Finish card','the business at a glance, only after decisions'],['Deck rail','every decision and its outcome in one list']],
  tasks:{open:'Opens on decision 1 of 6. Progress shows what is left.', metric:'Finish card: tap Cash now for the detail.', expense:'Decision 5: electricity; Show the evidence explains the jump.', overdue:'Decision 2: Riverside; evidence lists all four late customers.', stock:'Decision 3: cement runs out Friday.', supplier:'Decision 4: I-beam order and the cheque check in the evidence.', staff:'Decision 6: Rico, 24 Aug, with every count since 19 Aug.', ask:'Finish card: Ask Nifti.'},
  map:{arch:'Linear deck of decisions, overview last', nav:'Progress segments, rail, keyboard', viz:'One purpose-built chart per decision', type:'Manrope'},
  eval:{scores:[5,5,4,4,4,3,5], good:'Clearest answer to "what do I do today"; finishes, so it respects a busy owner\'s time.', bad:'Exploring freely is harder; a day with 15 decisions would need grouping or a cap.'},
  mount(el){ root = el; at = 0; done = {}; evidence = false;
    el.innerHTML = `<div class="br-wrap"><header class="br-top"><div class="br-id"><b>Today's brief</b><span>${D.biz.todayLabel} · ${D.biz.short}</span></div><div class="br-prog" id="brProg" role="group" aria-label="Progress"></div><span class="br-keys">← → to move · 1 2 3 to choose</span></header>
      <div class="br-body"><div class="br-stage"><div class="br-stack is-in" id="brStack"></div>
        <nav class="br-nav" aria-label="Deck"><button type="button" id="brPrev">Back</button><button type="button" id="brNext" class="is-primary">Next</button></nav></div>
        <aside class="br-side" aria-label="Today's decisions"><h3>Today's decisions</h3><ol id="brRail"></ol></aside></div></div>`;
    el.querySelector('#brPrev').onclick = () => BRIEF.go(at - 1);
    el.querySelector('#brNext').onclick = () => BRIEF.go(at >= CARDS.length ? 0 : at + 1);
    render(); },
  run(k){ const idx = {overdue:1, stock:2, supplier:3, expense:4, staff:5}[k];
    if(k === 'open') return BRIEF.go(0);
    if(idx != null){ BRIEF.go(idx); BRIEF.toggle(); return; }
    BRIEF.go(CARDS.length);
    if(k === 'metric') BRIEF.metric('cash'); else if(k === 'ask'){ BRIEF.ask(2); root.querySelector('#brAns').scrollIntoView({behavior:'smooth', block:'center'}); } }
});
})();
