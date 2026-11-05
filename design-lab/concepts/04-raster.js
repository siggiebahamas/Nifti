/* 04 · Raster — premium Swiss minimalism. A numbered index, strict 12-column grid, giant numerals, bar-tables and footnotes. */
(function(){
const D = ND;
let root, openNote = null;
const NOTES = {
  1:{k:'overdue', t:'Riverside Builders: ₱77,240, 34 days late, 44% of the total.'},
  2:{k:'stock', t:'Cement: 12 bags, runs out 28 Aug; supplier needs 3 days.'},
  3:{k:'supplier', t:'Metro Steel cheque ₱15,400 clears 27 Aug.'},
  4:{k:'expense', t:'Electricity ₱8,940 against a ₱5,923 average (+51%).'},
  5:{k:'staff', t:'Rico Reyes, 24 Aug: drawer ₱800 short; 6 rod boxes missing next day.'},
  6:{k:'metric', sub:'cash', t:'Cash falls to ₱39,730 on 2 Sep, below the ₱40,000 line.'}
};
const fn = n => `<button type="button" class="rs-fn" onclick="RASTER.note(${n}, this)" aria-label="Footnote ${n}: ${F.esc(NOTES[n].t)}">${n}</button>`;
const SECTIONS = [['pos','Position'],['perf','Performance'],['recv','Receivables'],['pay','Payables'],['stock','Stock'],['count','Cash counts'],['ask','Question']];

function sec(id, i, title, lede, body, notes){
  return `<section class="rs-sec" id="rs-${id}" aria-labelledby="rs-h-${id}"><div class="rs-sh"><span class="rs-no">${String(i + 1).padStart(2,'0')}</span><h2 id="rs-h-${id}">${title}</h2><p>${lede}</p></div>
    <div class="rs-body">${body}</div>${notes ? `<ol class="rs-notes">${notes.map(n => `<li value="${n}"><button type="button" onclick="RASTER.note(${n}, this)">${NOTES[n].t}</button></li>`).join('')}</ol>` : ''}<div class="rs-open" id="rs-open-${id}" aria-live="polite"></div></section>`;
}
function build(){
  const fc = D.forecast(), low = Math.min(...fc.map(f => f.bal));
  const pos = `<div class="rs-tower">${[['Cash','Bank and GCash', D.cash.total, fn(6), 'Lowest in 14 days ' + F.peso(low)],['Owed to you','4 customers, all past due', D.receivablesTotal, fn(1), '44% from one customer'],['Stock','at cost', D.stockValue, fn(2), '2 items under supplier lead time'],['You owe','5 suppliers', D.payablesTotal, fn(3), 'Next: tomorrow, ₱15,400']].map(r => `<div class="rs-tr"><span class="rs-tl">${r[0]}<small>${r[1]}</small></span><span class="rs-big num">${F.peso(r[2])}${r[3]}</span><span class="rs-tn">${r[4]}</span></div>`).join('')}</div>`;
  const mxR = 480000, mxP = 40000;
  const perf = `<div class="rs-tw"><table class="rs-t"><thead><tr><th>Month</th><th class="n">Sales</th><th class="rs-barh"></th><th class="n">Cost of goods</th><th class="n">Expenses</th><th class="n">Profit</th><th class="rs-barh"></th><th class="n">Kept per ₱100</th></tr></thead><tbody>
    ${D.trend.map(t => { const exp = t.partial ? D.month.expenses : Math.round(t.rev * .118), cogs = t.partial ? D.month.cogs : t.rev - exp - t.profit; return `<tr class="${t.partial ? 'is-now' : ''}"><th scope="row">${t.m}${t.partial ? ' <small>1–26</small>' : ''}</th><td class="n num">${F.peso(t.rev)}</td><td class="rs-bc"><i style="width:${t.rev / mxR * 100}%"></i></td><td class="n num">${F.peso(cogs)}</td><td class="n num">${F.peso(exp)}${t.partial ? fn(4) : ''}</td><td class="n num"><b>${F.peso(t.profit)}</b></td><td class="rs-bc is-p"><i style="width:${t.profit / mxP * 100}%"></i></td><td class="n num">₱${(t.profit / t.rev * 100).toFixed(1)}</td></tr>`; }).join('')}
    <tr class="rs-proj"><th scope="row">Aug pace</th><td class="n num">${F.peso(D.month.projRevenue)}</td><td class="rs-bc is-o"><i style="width:${D.month.projRevenue / mxR * 100}%"></i></td><td></td><td></td><td class="n num">${F.peso(D.month.projProfit)}</td><td class="rs-bc is-o is-p"><i style="width:${D.month.projProfit / mxP * 100}%"></i></td><td></td></tr></tbody></table></div>`;
  const recv = `<div class="rs-tw"><table class="rs-t"><thead><tr><th>Customer</th><th>Days late <span class="rs-axl"><span>0</span><span>15</span><span>30</span><span>45</span></span></th><th class="n">Owes</th><th class="rs-barh">Share</th></tr></thead><tbody>
    ${D.receivables.map((r,i) => `<tr><th scope="row">${r.cust}${i === 0 ? fn(1) : ''}<small>${r.id} · due ${r.due}</small></th><td><span class="rs-dl"><i style="left:${r.days / 45 * 100}%"></i><u style="left:${15 / 45 * 100}%"></u></span><span class="rs-dlv num">${r.days}</span></td><td class="n num"><b>${F.peso(r.amount)}</b></td><td class="rs-bc"><i style="width:${r.share * 100}%"></i></td></tr>`).join('')}
    <tr class="rs-sum"><th scope="row">Total</th><td></td><td class="n num"><b>${F.peso(D.receivablesTotal)}</b></td><td></td></tr></tbody></table></div>`;
  let bal = D.cash.bank;
  const pay = `<div class="rs-tw"><table class="rs-t"><thead><tr><th>Due</th><th>Supplier</th><th>For</th><th class="n">Amount</th><th class="n">BDO after</th></tr></thead><tbody>
    ${D.payables.slice().sort((a,b) => a.dueIdx - b.dueIdx).map((p,i) => { bal -= p.amount; return `<tr><td class="num">${p.due}</td><th scope="row">${p.sup}${i === 0 ? fn(3) : ''}</th><td><small>${p.what}</small></td><td class="n num">${F.peso(p.amount)}</td><td class="n num${bal < D.cash.safety ? ' is-neg' : ''}">${F.peso(bal)}</td></tr>`; }).join('')}</tbody></table>
    <p class="rs-cap">BDO after: what remains if every bill is paid from today's balance with no new money coming in. The red figure falls under the ₱40,000 safety line.</p></div>`;
  const stock = `<div class="rs-tw"><table class="rs-t"><thead><tr><th>Item</th><th class="n">On hand</th><th>Days left · supplier needs <span class="rs-axl"><span>0</span><span>10</span><span>20</span><span>30+</span></span></th><th class="n">At cost</th></tr></thead><tbody>
    ${D.stock.slice().sort((a,b) => a.cover / a.lead - b.cover / b.lead).map(s => `<tr class="${s.risk === 'r' ? 'is-risk' : ''}"><th scope="row">${s.name}${s.sku === 'PC-40' ? fn(2) : ''}</th><td class="n num">${s.on} <small>${s.unit}</small></td><td><span class="rs-cv"><b style="width:${Math.min(100, s.cover / 30 * 100)}%"></b><u style="left:${s.lead / 30 * 100}%"></u></span><span class="rs-dlv num">${F.days(s.cover)}</span></td><td class="n num">${F.peso(s.value)}</td></tr>`).join('')}</tbody></table>
    <p class="rs-cap">Line: days of stock at the current selling rate. Tick: days the supplier needs to deliver. A line that stops before its tick means a gap on the shelf.</p></div>`;
  const days = ['18','19','20','21','22','23','24','25','26'];
  const cnt = d => D.counts.find(c => c.d === d + ' Aug');
  const count = `<div class="rs-tw"><table class="rs-t rs-m"><thead><tr><th>Counted by</th>${days.map(d => `<th class="n num">${d}</th>`).join('')}<th class="n">Net</th></tr></thead><tbody>
    ${D.staff.map(s => `<tr><th scope="row">${s.name}${s.net ? fn(5) : ''}</th>${days.map(d => { const c = cnt(d); if(!c || c.who !== s.name) return '<td class="n rs-nil">·</td>'; if(c.got === null) return '<td class="n rs-due">due</td>'; const df = c.got - c.exp; return `<td class="n num${df < 0 ? ' is-neg' : ''}">${df === 0 ? '0' : (df > 0 ? '+' : '−') + Math.abs(df)}${c.edited ? '*' : ''}</td>`; }).join('')}<td class="n num${s.net < 0 ? ' is-neg' : ''}"><b>${s.net === 0 ? '0' : '−' + Math.abs(s.net)}</b></td></tr>`).join('')}</tbody></table>
    <p class="rs-cap">Pesos over (+) or short (−) per count. Dot: not their day. * edited, original kept: 22 Aug typo fixed by Ben (₱3,020 → ₱3,320).</p></div>`;
  const ask = `<div class="rs-ask"><label for="rsQ">Ask</label><select id="rsQ" onchange="RASTER.ask(this.value)"><option value="">Choose a question</option>${D.ask.map((a,i) => `<option value="${i}">${a.q}</option>`).join('')}</select><div id="rsA" aria-live="polite"></div></div>`;
  return sec('pos',0,'Position','Wednesday 26 August, 14:15. Figures in Philippine pesos.', pos, [6,1,2,3]) + sec('perf',1,'Performance','Six months. August to day 26, with its pace.', perf, [4]) + sec('recv',2,'Receivables','Every peso owed to you is past due.', recv, [1]) +
    sec('pay',3,'Payables','In date order, with the bank balance after each.', pay, [3]) + sec('stock',4,'Stock','Sorted by risk of running out before the supplier can deliver.', stock, [2]) +
    sec('count',5,'Cash counts','Person by day, last nine days.', count, [5]) + sec('ask',6,'Question','Answers from your records.', ask, null);
}
const RASTER = {
  note(n, btn){ const N = NOTES[n], s = btn.closest('.rs-sec'), box = s.querySelector('.rs-open');
    if(openNote === n + s.id){ box.innerHTML = ''; openNote = null; return; } openNote = n + s.id;
    const f = N.k === 'metric' ? FLOWS.metric(N.sub) : FLOWS[N.k]();
    box.innerHTML = `<div class="rs-x"><div class="rs-xh"><span class="rs-xn">${n}</span><div><p>${f.kicker}</p><h3>${f.title}</h3></div><button type="button" onclick="this.closest('.rs-open').innerHTML=''" aria-label="Close note">✕</button></div><div class="rs-xb">${f.body}</div></div>`;
    box.scrollIntoView({behavior:'smooth', block:'nearest'}); },
  go(id){ document.getElementById('rs-' + id).scrollIntoView({behavior:'smooth', block:'start'}); },
  ask(i){ const box = document.getElementById('rsA'); if(i === '') return box.innerHTML = ''; const a = D.ask[+i];
    box.innerHTML = `<blockquote class="rs-q"><p>${a.a}</p><footer>Source: ${a.src}. Sample answer for this prototype.</footer></blockquote>`; }
};
window.RASTER = RASTER;
function spy(){ if(!root || !root.classList.contains('cx-raster')) return; const secs = [...root.querySelectorAll('.rs-sec')]; if(!secs.length) return; let cur = secs[0].id; secs.forEach(s => { if(s.getBoundingClientRect().top < 160) cur = s.id; });
  root.querySelectorAll('.rs-idx a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + cur ? 'true' : 'false')); }

LAB.register({
  id:'raster', n:4, name:'Raster', territory:'Premium Swiss-inspired minimalism', tagline:'Seven numbered sections, nothing decorative',
  fonts:'family=Archivo:wdth,wght@75..100,300..800',
  identity:{
    vision:'A financial report designed like Swiss poster typography: a numbered index, a strict grid, huge exact numbers, and footnotes for everything unusual.',
    philosophy:'Precision is calming. When every figure is aligned, labelled and in its place, the owner trusts it. Composed, exact, quietly confident.',
    distinct:'Footnotes as the alert system: anomalies are numbered marks next to the figure they affect, and each opens inline. Bar-tables put tiny exact bars inside the cells, so tables and charts are one thing.',
    type:'Archivo in two widths: condensed for numerals and the index, normal for text. Five sizes on a strict scale, all figures tabular.',
    color:'White and black. One red, used only for footnote marks and figures below a line that matters. Grey hairlines for structure.',
    visual:'No boxes, no shadows, no rounded corners. Every element sits on a 12-column grid with an 8-pixel baseline.',
    motion:'None except smooth scrolling to a section and footnotes opening in place.',
    arch:'One long document with a fixed numbered index (scroll-spy shows where you are): 01 Position, 02 Performance, 03 Receivables, 04 Payables, 05 Stock, 06 Cash counts, 07 Question.'
  },
  components:[['Numbered index with scroll-spy','always shows which section you are in'],['Numeral tower','four figures at poster scale with their footnote marks'],['Bar-tables','tables whose cells carry tiny exact bars'],['Dot-line stock rows','days left against supplier lead time in one line'],['Person-by-day count matrix','who counted, which day, how far off'],['Inline footnotes','anomalies numbered beside the figure and opened in place']],
  tasks:{open:'Section 01 Position: four exact numbers, each with its footnote mark.', metric:'Footnote 6 beside Cash opens the 14-day position.', expense:'Footnote 4 beside August expenses in Performance.', overdue:'Section 03 Receivables plots days late on one exact axis.', stock:'Section 05 Stock: lines that stop before their tick run out first.', supplier:'Section 04 Payables lists every bill with the bank balance after it.', staff:'Section 06 Cash counts: footnote 5 beside Rico Reyes.', ask:'Section 07 Question: the answer is set as a quotation with its source.'},
  map:{arch:'Single document with numbered sections', nav:'Fixed numbered index + scroll-spy', viz:'Bar-tables, dot-line rows, count matrix', type:'Archivo (two widths)'},
  eval:{scores:[3,4,5,4,5,5,4], good:'Superb clarity and density without clutter; scales to many more rows; accessible by design.', bad:'Swiss reporting is a known style, so originality is limited; the long document asks the owner to scroll rather than being pointed to one action.', weak:4, weakWhy:'is beautifully disciplined but it is a known style applied well rather than a new idea. It presents information precisely without doing much of the thinking for the owner.'},
  mount(el){ root = el; openNote = null;
    el.innerHTML = `<div class="rs-wrap"><nav class="rs-idx" aria-label="Sections"><div class="rs-id"><b>Nifti</b><span>${D.biz.short}<br>26.08.2026</span></div><ol>${SECTIONS.map(([id,l],i) => `<li><a href="#rs-${id}" onclick="event.preventDefault(); RASTER.go('${id}')"><span class="num">${String(i + 1).padStart(2,'0')}</span>${l}</a></li>`).join('')}</ol><p class="rs-fnc"><span>${Object.keys(NOTES).length}</span> footnotes need a look</p></nav><main class="rs-main">${build()}</main></div>`;
    if(!window.__rsSpy){ window.addEventListener('scroll', () => spy(), {passive:true}); window.__rsSpy = true; } spy(); },
  run(k){ const map = {metric:['pos',6], expense:['perf',4], overdue:['recv',1], stock:['stock',2], supplier:['pay',3], staff:['count',5]};
    if(k === 'open'){ window.scrollTo({top:0, behavior:'smooth'}); return; }
    if(k === 'ask'){ RASTER.go('ask'); const s = document.getElementById('rsQ'); s.value = '0'; RASTER.ask('0'); return; }
    const [id, n] = map[k]; RASTER.go(id); const b = document.querySelector(`#rs-${id} .rs-notes button`); setTimeout(() => RASTER.note(n, b), 350); }
});
})();
