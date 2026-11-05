/* 02 · The Ledger — editorial financial intelligence. The day's business as a front page; every story opens into an article. */
(function(){
const D = ND;
let root, main;
const sp = (vals, label, opt) => `<span class="lg-wsp">${SVG.spark(vals, 54, 14, Object.assign({label}, opt || {}))}</span>`;

function profitChart(){
  const W = 640, H = 230, L = 46, R = 12, T = 28, B = 30, mx = 40000, n = D.trend.length, bw = (W - L - R) / n;
  const y = v => T + (1 - v / mx) * (H - T - B);
  let g = '';
  [0,10000,20000,30000,40000].forEach(v => g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="lg-grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="lg-ax">${v ? '₱' + v / 1000 + 'K' : '0'}</text>`);
  D.trend.forEach((t,i) => { const x = L + i * bw + bw * .2, w = bw * .6;
    if(t.partial){ g += `<rect x="${x}" y="${y(t.projProfit)}" width="${w}" height="${y(0) - y(t.projProfit)}" class="lg-proj"/>`; }
    g += `<rect x="${x}" y="${y(t.profit)}" width="${w}" height="${y(0) - y(t.profit)}" class="lg-bar${t.partial ? ' is-now' : ''}"><title>${t.m}: ${F.peso(t.profit)}</title></rect><text x="${x + w / 2}" y="${H - 10}" text-anchor="middle" class="lg-ax">${t.m}</text>`; });
  const jx = L + 4 * bw + bw / 2, ax = L + 5 * bw + bw / 2;
  g += `<text x="${jx}" y="${y(35200) - 8}" text-anchor="middle" class="lg-note">Jul ₱35.2K</text>`;
  g += `<path d="M${ax} ${y(36800) - 4} L${ax} ${T - 6}" class="lg-lead"/><text x="${ax - 6}" y="${T - 10}" text-anchor="end" class="lg-note is-b">August pace ₱36.8K (so far ₱30.9K)</text>`;
  return `<figure class="lg-fig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Profit by month, March to August. July ₱35,200; August so far ₱30,881, on pace for ₱36,800.">${g}</svg><figcaption>Profit by month. August outlined to its projected finish.</figcaption></figure>`;
}
function smallMult(){
  const mx = 800;
  return `<div class="lg-sm">${D.electricity.map(e => `<div class="${e.m === 'Aug' ? 'is-hi' : ''}"><span class="lg-sm-b"><i style="height:${(e.kwh / mx * 100).toFixed(0)}%"></i></span><b class="num">${e.kwh}</b><small>${e.m} kWh</small></div>`).join('')}</div>`;
}
function front(){
  const nums = [
    ['Cash on hand', F.peso(D.cash.total), 'Bank and GCash. Dips to ₱39,730 on 2 Sep.', D.forecast().map(f => f.bal), 'metric', 'cash'],
    ['Owed to you', F.peso(D.receivablesTotal), 'Four customers, all past due.', [62000,98000,121000,150000,168000,174968], 'overdue'],
    ['Stock at cost', F.peso(D.stockValue), '₱32,200 of it in slow-moving I-beams.', [91000,88000,93000,89000,90000,86624], 'stock'],
    ['You owe suppliers', F.peso(D.payablesTotal), 'Next: Metro Steel cheque, tomorrow.', [98000,120000,104000,116000,109000,113000], 'supplier']
  ];
  return `<div class="lg-front">
    <article class="lg-lead-story">
      <p class="lg-kick">The month so far</p>
      <h2><button type="button" class="lg-hl" onclick="LEDGER.read('metric')">On pace for ₱36,800 in profit, but ₱175,000 is stuck with four customers</button></h2>
      <p class="lg-by">By Nifti · from 1,284 sales, bills and counts, updated 6:00 AM</p>
      <div class="lg-cols2">
        <p class="lg-dropcap">Sales reached <b class="num">₱400,000</b> after 26 days ${sp(D.daily, 'Daily sales in August', {zero:true})}, about 4% ahead of the same days in July. For every ₱100 sold, the shop keeps ₱7.70, and the month is on pace to beat July's ₱35,200.</p>
        <p>The cash is another matter. <b class="num">₱174,968</b> is owed by four customers, all past their 15-day terms, and Riverside Builders alone accounts for 44% of it. Without a collection, bank and GCash fall to <b class="num">₱39,730</b> on 2 September, just under the safety line. <button type="button" class="lg-more" onclick="LEDGER.read('overdue')">Who owes what →</button></p>
      </div>
      ${profitChart()}
    </article>
    <aside class="lg-numbers" aria-label="In numbers"><p class="lg-kick">In numbers</p>
      ${nums.map(n => `<button type="button" class="lg-num" onclick="LEDGER.read('${n[4]}'${n[5] ? `,'${n[5]}'` : ''})"><span>${n[0]}</span><b class="num">${n[1]}</b><small>${n[2]}</small>${SVG.spark(n[3], 120, 26, {label: n[0] + ' trend'})}</button>`).join('')}
    </aside>
    <div class="lg-row3">
      <article><p class="lg-kick is-r">Costs</p><h3><button type="button" class="lg-hl" onclick="LEDGER.read('expense')">Electricity bill jumps 51%</button></h3>${smallMult()}<p>August used 712 kWh against about 470 in earlier months. The jump began the week the rebar cutter motor was rewound.</p></article>
      <article><p class="lg-kick is-r">Stock</p><h3><button type="button" class="lg-hl" onclick="LEDGER.read('stock')">Cement will run out on Friday</button></h3>
        <div class="lg-cover">${D.stock.slice().sort((a,b) => a.cover - b.cover).slice(0,3).map(s => `<div><span>${s.name}</span><span class="lg-cv"><i style="width:${Math.min(100, s.cover / 10 * 100)}%" class="is-${s.risk}"></i><u style="left:${s.lead / 10 * 100}%" title="supplier lead time"></u></span><b class="num">${F.days(s.cover)}</b></div>`).join('')}<small>Bar: days of stock left. Tick: days the supplier needs.</small></div>
        <p>Twelve bags remain. The Cebu Aggregates order that fixes it is waiting for a yes, and their price ends the same day.</p></article>
      <article><p class="lg-kick is-r">People</p><h3><button type="button" class="lg-hl" onclick="LEDGER.read('staff')">A short drawer on Monday</button></h3><p class="lg-pull">"₱800 short, and 6 boxes of welding rods missing the next morning."</p><p>Rico Reyes counted on 24 August. His two other counts this month matched. One event, not a pattern; a recount comes first.</p></article>
    </div>
    <div class="lg-row3 lg-foot">
      <section><p class="lg-kick">Due this week</p><ol class="lg-agenda">${D.payables.slice().sort((a,b) => a.dueIdx - b.dueIdx).map(p => `<li><b>${p.due}</b><span>${p.sup}<small>${p.what}</small></span><span class="num">${F.peso(p.amount)}</span></li>`).join('')}</ol><button type="button" class="lg-more" onclick="LEDGER.read('supplier')">Check the Metro Steel cheque →</button></section>
      <section class="lg-corr"><p class="lg-kick">Corrections and amendments</p><p><b>22 Aug, cash count.</b> Liza Santos entered ₱3,020; corrected to ₱3,320 by Ben Dela Cruz on 23 Aug after a recount found ₱300 in the side tray. The original entry is kept on record.</p><p><b>Price lock.</b> No sale below the price list this week without an owner's OK.</p></section>
      <section id="lgLetters"><p class="lg-kick">Letters to the desk</p><p class="lg-small">Ask a question about the business; the desk answers from your records.</p><ul class="lg-qs">${D.ask.map((a,i) => `<li><button type="button" onclick="LEDGER.letter(${i})">${a.q}</button></li>`).join('')}</ul><div id="lgReply" aria-live="polite"></div></section>
    </div></div>`;
}
const LEDGER = {
  read(k, sub){ const f = k === 'metric' ? FLOWS.metric(sub || 'profit') : FLOWS[k]();
    main.innerHTML = `<article class="lg-article"><button type="button" class="lg-back" onclick="LEDGER.home()">← Front page</button><p class="lg-kick">${f.kicker}</p><h2>${f.title}</h2><p class="lg-by">By Nifti · ${D.biz.todayLabel}</p><div class="lg-body">${f.body}</div></article>`;
    setNav(k); main.querySelector('.lg-back').focus(); root.scrollIntoView({block:'start'}); },
  home(){ main.innerHTML = front(); setNav('front'); },
  letter(i){ const a = D.ask[i], r = document.getElementById('lgReply'); r.innerHTML = `<div class="lg-letter is-loading"><p>The desk is checking your records…</p></div>`;
    setTimeout(() => { r.innerHTML = `<blockquote class="lg-letter"><p class="lg-q">“${a.q}”</p><p>Dear Ben, ${a.a.charAt(0).toLowerCase() + a.a.slice(1)}</p><footer>The Nifti desk · based on ${a.src.toLowerCase()} · sample answer for this prototype</footer></blockquote>`; }, 700); },
  section(s){ if(s === 'front') return LEDGER.home(); if(s === 'letters'){ LEDGER.home(); document.getElementById('lgLetters').scrollIntoView({behavior:'smooth', block:'start'}); setNav('letters'); return; } LEDGER.read(s); }
};
function setNav(k){ root.querySelectorAll('.lg-nav button').forEach(b => b.setAttribute('aria-current', b.dataset.s === k || (k === 'metric' && b.dataset.s === 'metric') ? 'page' : 'false')); }
window.LEDGER = LEDGER;

LAB.register({
  id:'ledger', n:2, name:'The Ledger', territory:'Editorial financial intelligence', tagline:'Your business as this morning\'s front page',
  fonts:'family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=Source+Sans+3:wght@400;600;700',
  identity:{
    vision:'Nifti writes the owner a newspaper every morning. The most important story is the lead; numbers sit inside sentences that explain them.',
    philosophy:'Owners read stories, not dashboards. Editorial hierarchy (headline, deck, lead, sidebar) is a centuries-old way to say what matters most. Calm, intelligent, a little proud.',
    distinct:'Headlines generated from the data, word-sized sparklines inside sentences, annotated charts, a "Corrections and amendments" box for edit history, and "Letters to the desk" for questions.',
    type:'Newsreader (optical sizes) for headlines and numerals, Source Sans 3 for body. Small caps kickers, a strict baseline rhythm, 65-character columns.',
    color:'Paper white, ink black, one deep blue for links and highlights, editorial red only for kickers that need attention. Rules, not boxes.',
    visual:'Column grid and hairline rules. Charts carry direct labels instead of legends. No cards anywhere.',
    motion:'Almost none: stories open as a page turn (instant swap with focus moved to the headline). Letters fade in after a short "checking your records" line.',
    arch:'Front page (lead story, In numbers, three secondary stories, due this week, corrections, letters). Every headline opens a full article. Sections: Money, Trade, Stock, People, Letters.'
  },
  components:[['Generated lead headline','the day\'s most important development written as a headline and deck'],['Word-sized sparklines','trends inside the sentence they explain'],['Annotated profit chart','projection outline and direct labels, no legend'],['Small multiples','electricity usage month by month at a glance'],['Corrections and amendments','edit history presented the way newspapers own their mistakes'],['Letters to the desk','ask a question, receive a written reply with its sources']],
  tasks:{open:'The front page: lead story first, then In numbers, then the three stories that need attention.', metric:'Click any figure under In numbers, or the lead headline, to read the full article.', expense:'Story "Electricity bill jumps 51%" opens the article with usage and likely cause.', overdue:'"Who owes what" in the lead story opens the receivables article.', stock:'Story "Cement will run out on Friday" shows days left against supplier lead time.', supplier:'"Due this week" lists every payment; the Metro Steel link opens the check.', staff:'Story "A short drawer on Monday" opens Rico\'s full tally.', ask:'Letters to the desk: pick a question and the desk writes back with sources.'},
  map:{arch:'Newspaper front page + article pages', nav:'Section bar like a newspaper', viz:'Word-sized sparklines, annotated bars, small multiples', type:'Newsreader + Source Sans 3'},
  eval:{scores:[5,4,5,4,4,3,4], good:'The strongest point of view: numbers arrive with their meaning. Feels expensive and calm; very readable.', bad:'Reading is slower for owners who only want the numbers; story generation must be excellent every day or it feels canned.'},
  mount(el){ root = el;
    el.innerHTML = `<div class="lg-paper"><header class="lg-mast"><p class="lg-ed">Edition 238 · ${D.biz.city}</p><h1>The Dela Cruz Ledger</h1><p class="lg-date">${D.biz.todayLabel} · Prepared for ${D.biz.owner}</p></header>
      <nav class="lg-nav" aria-label="Sections">${[['front','Front page'],['metric','Money'],['overdue','Trade'],['stock','Stock'],['staff','People'],['letters','Letters']].map(([s,l]) => `<button type="button" data-s="${s}" onclick="LEDGER.section('${s}')">${l}</button>`).join('')}</nav>
      <main id="lgMain">${front()}</main></div>`;
    main = el.querySelector('#lgMain'); setNav('front'); },
  run(k){ if(k === 'open') return LEDGER.home(); if(k === 'ask'){ LEDGER.section('letters'); setTimeout(() => LEDGER.letter(1), 400); return; } LEDGER.read(k); }
});
})();
