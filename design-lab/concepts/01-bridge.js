/* 01 · Bridge — financial command centre. One position beam, one exception queue ranked by pesos, one runway. */
(function(){
const D = ND;
const EXC = [
  {k:'overdue', sev:'r', t:'₱77,240 from Riverside Builders is 34 days late', s:'2 reminders ignored · 44% of everything owed to you', amt:77240, due:'Call today'},
  {k:'stock', sev:'r', t:'Cement runs out on 28 Aug', s:'12 bags left · Cebu Aggregates order waiting for your OK', amt:63056, due:'Confirm by 28 Aug'},
  {k:'supplier', sev:'y', t:'Metro Steel cheque clears tomorrow', s:'₱15,400 deposit on 20 I-beams you may not need', amt:48900, due:'27 Aug'},
  {k:'metric', sev:'y', t:'Cash dips under the safety line on 2 Sep', s:'₱39,730 after rent, salaries and Metro balance', amt:40000, due:'2 Sep', mk:'cash'},
  {k:'expense', sev:'y', t:'Electricity 51% above normal', s:'₱8,940 against ₱5,923 · usage, not price', amt:3017, due:'This month'},
  {k:'staff', sev:'r', t:'Rico Reyes · drawer ₱800 short on 24 Aug', s:'6 boxes of welding rods missing the next day', amt:800, due:'Review'}
];
const maxAmt = Math.max(...EXC.map(e => e.amt));
let root, panel;

function beam(){
  const assets = [['Cash', D.cash.total, 'cash'], ['Owed to you', D.receivablesTotal, 'receivables'], ['Stock at cost', D.stockValue, 'stock']];
  const totalA = assets.reduce((a,x) => a + x[1], 0), scale = totalA;
  return `<section class="b-pos" aria-labelledby="bPosH">
    <div class="b-sec-h"><h2 id="bPosH">Position</h2><span>What the business holds against what it owes, today</span></div>
    <div class="b-beam">
      <div class="b-row"><span class="b-side">You have</span><div class="b-track">${assets.map(a => `<button type="button" class="b-seg is-${a[2]}" style="flex:${a[1]}" onclick="BRIDGE.open('metric','${a[2]}')"><span>${a[0]}</span><b class="num">${F.k(a[1])}</b></button>`).join('')}</div><b class="b-tot num">${F.peso(totalA)}</b></div>
      <div class="b-row"><span class="b-side">You owe</span><div class="b-track"><button type="button" class="b-seg is-owe" style="flex:${D.payablesTotal}" onclick="BRIDGE.open('supplier')"><span>Suppliers</span><b class="num">${F.k(D.payablesTotal)}</b></button><span class="b-gap" style="flex:${scale - D.payablesTotal}"></span></div><b class="b-tot num">${F.peso(D.payablesTotal)}</b></div>
      <p class="b-net">Working position <b class="num">${F.signed(totalA - D.payablesTotal)}</b>. Only <b class="num">${F.k(D.cash.total)}</b> of it is cash you can spend this week; ${Math.round(D.receivablesTotal / totalA * 100)}% is still in customers' hands.</p>
    </div>
    <div class="b-pl"><button type="button" onclick="BRIDGE.open('metric','profit')"><span class="b-pl-k">August, day 26 of 31</span><span class="b-pl-v"><b class="num">${F.peso(D.month.revenue)}</b> sales <i aria-hidden="true">→</i> <b class="num">${F.peso(D.month.profit)}</b> profit</span><span class="b-pl-s">On pace for <b class="num">${F.peso(D.month.projProfit)}</b> · July ${F.k(D.month.lastProfit)} ${SVG.spark(D.trend.map(t => t.profit), 84, 22, {label:'Profit, March to August'})}</span></button></div>
  </section>`;
}
function queue(){
  return `<section class="b-q" aria-labelledby="bQH"><div class="b-sec-h"><h2 id="bQH">Exceptions <span class="num">${EXC.length}</span></h2><span>Ranked by pesos at stake</span></div>
    <ol class="b-list">${EXC.map((e,i) => `<li><button type="button" class="b-item" data-i="${i}" onclick="BRIDGE.open('${e.k}'${e.mk ? `,'${e.mk}'` : ''}, ${i})">
      <span class="b-sev is-${e.sev}" aria-label="${e.sev === 'r' ? 'Act now' : 'Watch'}">${e.sev === 'r' ? '▲' : '●'}</span>
      <span class="b-it"><b>${e.t}</b><small>${e.s}</small></span>
      <span class="b-amt"><b class="num">${F.k(e.amt)}</b><i style="width:${Math.max(4, e.amt / maxAmt * 100).toFixed(0)}%"></i></span>
      <span class="b-due">${e.due}</span></button></li>`).join('')}</ol></section>`;
}
function deltas(){
  return `<section class="b-d" aria-labelledby="bDH"><div class="b-sec-h"><h2 id="bDH">Since yesterday</h2><span>Tue 25 Aug, 6 PM → now</span></div>
    <ul class="b-dl">${D.deltas.map(d => `<li class="is-${d.tone}"><span class="b-dk">${d.t}</span><b>${d.v}</b><small>${d.note}</small></li>`).join('')}</ul></section>`;
}
function runway(Wd){
  const f = D.forecast(), W = Math.max(600, Math.round(Wd || 760)), H = 220, L = 56, R = 14, T = 18, B = 34, mx = 120000;
  const x = i => L + i * (W - L - R) / (f.length - 1), y = v => T + (1 - v / mx) * (H - T - B);
  let g = '';
  [0,40000,80000,120000].forEach(v => g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="b-grid"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" class="b-ax">${v ? '₱' + v/1000 + 'K' : '0'}</text>`);
  g += `<rect x="${L}" y="${y(D.cash.safety)}" width="${W - L - R}" height="${y(0) - y(D.cash.safety)}" class="b-safe"/><text x="${L + 8}" y="${y(D.cash.safety) + 16}" class="b-ax is-red">below the ₱40K safety line</text>`;
  const d = f.map((p,i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.bal).toFixed(1)).join(' ');
  g += `<path d="${d}" class="b-line"/>`;
  f.forEach((p,i) => { if(i % 2 === 0) g += `<text x="${x(i)}" y="${H - 12}" text-anchor="middle" class="b-ax">${p.d}</text>`;
    g += `<circle cx="${x(i)}" cy="${y(p.bal)}" r="${p.bal < D.cash.safety ? 5 : 3}" class="b-pt${p.bal < D.cash.safety ? ' is-low' : ''}"><title>${p.d}: ${F.peso(p.bal)}</title></circle>`;
    p.ev.forEach((e,j) => { if(e.amt < 0) g += `<g class="b-ev" role="button" tabindex="0" aria-label="${e.label} ${F.peso(e.amt)} on ${p.d}" onclick="BRIDGE.open('${/Metro/.test(e.label) ? 'supplier' : 'metric'}','cash')"><path d="M${x(i) - 6} ${T - 2 + j * 0} l6 9 l6 -9z"/><title>${e.label} ${F.peso(e.amt)}</title></g>`; }); });
  return `<section class="b-r" aria-labelledby="bRH"><div class="b-sec-h"><h2 id="bRH">Runway</h2><span>Bank and GCash, next 14 days · triangles are payments going out</span></div>
    <div class="b-chart"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Cash forecast: lowest ${F.peso(Math.min(...f.map(p => p.bal)))} on 2 September">${g}</svg></div></section>`;
}
function cmd(){
  return `<div class="b-cmd"><label for="bCmd" class="b-sr">Ask or jump</label><span class="b-k" aria-hidden="true">⌘K</span><input id="bCmd" autocomplete="off" placeholder="Ask, or jump to a customer, supplier or item" onfocus="BRIDGE.sug(true)" oninput="BRIDGE.sug(true)" onkeydown="BRIDGE.key(event)">
    <div class="b-sug" id="bSug" hidden role="listbox" aria-label="Suggestions"></div></div>`;
}
function drawRun(){ const host = root && root.querySelector('#bRun'); if(!host) return; host.innerHTML = runway(host.clientWidth || 760); }
let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if(document.querySelector('.cx-bridge')) drawRun(); }, 150); });
const BRIDGE = {
  open(k, sub, i){
    document.querySelectorAll('.b-item').forEach(b => b.classList.toggle('is-on', String(i) === b.dataset.i));
    const f = k === 'metric' ? FLOWS.metric(sub || 'profit') : k === 'ask' ? FLOWS.ask(sub || 0) : FLOWS[k]();
    panel.innerHTML = `<div class="b-ph"><nav class="b-crumb" aria-label="Breadcrumb">Bridge › ${f.kicker}</nav><button type="button" class="b-x" onclick="BRIDGE.close()" aria-label="Close">✕</button></div><h3>${f.title}</h3><div class="b-pb">${f.body}</div>`;
    panel.hidden = false; root.classList.add('has-panel'); drawRun(); panel.querySelector('.b-x').focus();
  },
  close(){ panel.hidden = true; root.classList.remove('has-panel'); drawRun(); document.querySelectorAll('.b-item').forEach(b => b.classList.remove('is-on')); },
  sug(show){ const box = root.querySelector('#bSug'), q = root.querySelector('#bCmd').value.toLowerCase();
    const items = D.ask.map((a,i) => ({t:a.q, k:'ask', s:i, g:'Ask'})).concat([
      {t:'Riverside Builders · ₱77,240 owed', k:'overdue', g:'Customer'}, {t:'Metro Steel Co. · cheque 27 Aug', k:'supplier', g:'Supplier'},
      {t:'Portland Cement 40kg · 12 bags', k:'stock', g:'Item'}, {t:'Rico Reyes · cash counts', k:'staff', g:'Staff'}, {t:'Electricity · August bill', k:'expense', g:'Expense'}])
      .filter(x => !q || x.t.toLowerCase().includes(q));
    box.innerHTML = items.length ? items.map((x,j) => `<button type="button" role="option" class="b-so" onclick="BRIDGE.open('${x.k}', ${x.s == null ? 'null' : x.s}); BRIDGE.sug(false)"><small>${x.g}</small>${x.t}</button>`).join('') : '<p class="b-empty">Nothing matches. Try a customer, supplier, item or question.</p>';
    box.hidden = !show; },
  key(e){ if(e.key === 'Escape'){ root.querySelector('#bSug').hidden = true; e.target.blur(); } if(e.key === 'Enter'){ const f = root.querySelector('.b-so'); if(f) f.click(); } },
  close2(){}
};
window.BRIDGE = BRIDGE;
document.addEventListener('keydown', e => { if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && document.querySelector('.cx-bridge')){ e.preventDefault(); const i = document.getElementById('bCmd'); if(i) i.focus(); } });
document.addEventListener('click', e => { const b = document.getElementById('bSug'); if(b && !e.target.closest('.b-cmd')) b.hidden = true; });

LAB.register({
  id:'bridge', n:1, name:'Bridge', territory:'Financial command centre', tagline:'One beam, one queue, one runway',
  fonts:'family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600',
  identity:{
    vision:'The owner\'s bridge: position, exceptions and runway on one calm screen, with everything else one click away in a context panel.',
    philosophy:'Control without noise. The owner should feel "I know where I stand" in ten seconds. No decorative charts; every mark answers a question.',
    distinct:'The Position Beam: what you have and what you owe drawn on one scale, so working capital is visible, not calculated. Exceptions ranked by pesos at stake, not by module.',
    type:'IBM Plex Sans for words, Plex Mono for every figure so columns align like a ledger. Three sizes only: 13, 15, 28.',
    color:'Near-white canvas, ink navy, one signal blue for selection. Red and amber appear only on exceptions, always with a shape (▲ act, ● watch) so colour is never the only cue.',
    visual:'No cards. Sections are separated by hairlines and whitespace. Segments, rows and chart marks are all clickable.',
    motion:'Context panel slides in 200 ms from the right; the page narrows instead of being covered, so the owner never loses context.',
    arch:'Overview first (position, exceptions, changes, runway). Detail always opens in the right-hand context panel. A command bar (Ctrl/⌘K) jumps to any customer, supplier, item or question.'
  },
  components:[['Position Beam','assets against obligations on one scale, every segment clickable'],['Exception Queue','ranked by pesos at stake, with severity shapes and impact bars'],['Since Yesterday ledger','what moved overnight, in one column'],['Runway','14-day cash line with a safety band and outgoing-payment markers'],['Context panel','slide-in detail that keeps the overview visible'],['Command bar','jump or ask from anywhere with Ctrl/⌘K']],
  tasks:{open:'Overview loads in reading order: position, exceptions, changes, runway.', metric:'Click a beam segment or the profit line; the context panel explains it.', expense:'Exception "Electricity 51% above normal" opens usage, cost and likely cause.', overdue:'Top exception opens the receivables breakdown with patterns.', stock:'Exception "Cement runs out" opens days-left against supplier lead time.', supplier:'Triangle markers on the runway or the Metro Steel exception open the payment check.', staff:'Rico\'s exception opens the drawer tally and cross-checks.', ask:'Command bar suggests questions; the answer opens in the context panel.'},
  map:{arch:'Overview + right context panel', nav:'Command bar (Ctrl/⌘K), no sidebar', viz:'Position beam, ranked impact bars, runway line', type:'IBM Plex Sans + Mono'},
  eval:{scores:[3,5,4,4,5,4,4], good:'Fastest to read; the beam makes working capital tangible; everything is one click from the overview.', bad:'Structurally close to a well-made admin overview. The beam is the only truly new idea.', weak:3, weakWhy:'is excellent to use but a panel of design leaders would call it a refined version of a familiar overview page: list plus line chart plus side panel. The Position Beam alone does not make it a signature.'},
  mount(el){ root = el;
    el.innerHTML = `<div class="b-wrap"><header class="b-top"><div class="b-id"><b>Nifti</b><span>${D.biz.short} · ${D.biz.todayShort}, 2:15 PM</span></div>${cmd()}<span class="b-who">Ben · Owner</span></header>
      <main class="b-main">${beam()}<div class="b-split">${queue()}${deltas()}</div><div id="bRun"></div></main></div><aside class="b-panel" id="bPanel" hidden aria-label="Details"></aside>`;
    panel = el.querySelector('#bPanel'); drawRun(); },
  run(k){
    if(k === 'open'){ BRIDGE.close(); root.classList.remove('b-anim'); void root.offsetWidth; root.classList.add('b-anim'); window.scrollTo({top:0, behavior:'smooth'}); return; }
    if(k === 'ask'){ const i = root.querySelector('#bCmd'); i.value = ''; i.focus(); BRIDGE.sug(true); setTimeout(() => { BRIDGE.open('ask', 2); root.querySelector('#bSug').hidden = true; }, 900); return; }
    const idx = {overdue:0, stock:1, supplier:2, expense:4, staff:5}[k];
    BRIDGE.open(k, k === 'metric' ? 'profit' : null, idx);
  }
});
})();
