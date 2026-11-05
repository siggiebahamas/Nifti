/* 05 · Kumusta — approachable financial workspace. Warm, plain-spoken, and impossible to feel lost in. */
(function(){
const D = ND;
let root, sheet, done = {};
const TODO = [
  {id:'t1', k:'overdue', t:'Call Riverside Builders', s:'They owe ₱77,240 and usually pay after a phone call.', simple:'A customer took ₱77,240 of goods in July and has not paid. A call usually works.'},
  {id:'t2', k:'stock', t:'Say yes to the cement order', s:'Only 12 bags left. Cebu Aggregates is waiting for your OK.', simple:'You will run out of cement on Friday unless you approve the order today.'},
  {id:'t3', k:'supplier', t:'Check tomorrow\'s cheque', s:'₱15,400 to Metro Steel. There is enough in BDO.', simple:'A cheque you wrote clears tomorrow. Your bank has enough money for it.'},
  {id:'t4', k:'staff', t:'Ask Liza to recount the welding rods', s:'Rico\'s drawer was ₱800 short on Monday and 6 boxes are missing.', simple:'Money and stock were both missing after Monday. A recount tells you if it was a mistake.'},
  {id:'t5', k:'expense', t:'Look at the electricity bill', s:'₱8,940, about ₱3,000 more than usual.', simple:'You used much more electricity this month. Probably the rebar cutter.'},
  {id:'t6', k:'metric', sub:'cash', t:'Plan for 2 September', s:'Rent, salaries and Metro Steel all land that week.', simple:'Lots of bills arrive at once. Collecting from Riverside first keeps you safe.'}
];
function jar(fill, color, label){ const h = 120, lvl = Math.max(8, fill * 96);
  return `<svg class="ku-jar" viewBox="0 0 120 150" role="img" aria-label="${label}"><rect x="38" y="6" width="44" height="14" rx="4" class="ku-lid"/><path d="M30 22 h60 a8 8 0 0 1 8 8 v104 a10 10 0 0 1 -10 10 h-56 a10 10 0 0 1 -10 -10 v-104 a8 8 0 0 1 8 -8z" class="ku-glass"/>
    <clipPath id="jc${color.slice(1)}"><path d="M24 30 h72 v104 a10 10 0 0 1 -10 10 h-52 a10 10 0 0 1 -10 -10z"/></clipPath>
    <rect x="22" y="${142 - lvl}" width="76" height="${lvl}" fill="${color}" clip-path="url(#jc${color.slice(1)})" class="ku-liquid"/>
    ${[0,1,2].map(i => `<ellipse cx="${46 + i * 14}" cy="${138 - i * 3}" rx="6" ry="2.4" fill="#fff" opacity=".55" clip-path="url(#jc${color.slice(1)})"/>`).join('')}</svg>`; }
function render(){
  const doneN = TODO.filter(t => done[t.id]).length, C = 2 * Math.PI * 26;
  const mx = Math.max(D.cash.total, D.receivablesTotal, D.payablesTotal);
  root.querySelector('#kuBody').innerHTML = `
  <section class="ku-hello" id="ku-today"><div class="ku-hi"><p class="ku-wave">Magandang hapon, Ben!</p><h2>Here's your shop today. Three things need you; everything else is fine.</h2><p>Wednesday, 26 August. Sales so far this month are <b>₱400,000</b>, a little better than July.</p></div>
    <div class="ku-ring" aria-label="${doneN} of ${TODO.length} done today"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" class="ku-rb"/><circle cx="32" cy="32" r="26" class="ku-rf" stroke-dasharray="${(C * doneN / TODO.length).toFixed(1)} ${C.toFixed(1)}"/></svg><b>${doneN}<small>/${TODO.length}</small></b><span>done today</span></div></section>
  <section class="ku-band" aria-labelledby="kuListH"><div class="ku-in"><h3 id="kuListH">Today's list</h3><ul class="ku-list">${TODO.map(t => `<li class="${done[t.id] ? 'is-done' : ''}"><label class="ku-check"><input type="checkbox" ${done[t.id] ? 'checked' : ''} onchange="KUMUSTA.tick('${t.id}', this.checked)"><span aria-hidden="true"></span></label><div><b>${t.t}</b><small>${t.s}</small></div><button type="button" class="ku-show" onclick="KUMUSTA.show('${t.k}','${t.sub || ''}','${t.id}')">Show me</button></li>`).join('')}</ul></div></section>
  <section class="ku-band is-soft" id="ku-money" aria-labelledby="kuMoneyH"><div class="ku-in"><h3 id="kuMoneyH">Your money</h3><p class="ku-intro">Three jars, filled to scale. The middle one is the one to empty into the first.</p>
    <div class="ku-jars">${[['have','Money you have', D.cash.total, '#2F80ED', 'In BDO and GCash right now.', 'This is money you can spend today. It goes down on 2 Sep when rent, salaries and Metro Steel are paid.', ['metric','cash']],
      ['owed','Customers owe you', D.receivablesTotal, '#FFC93C', 'Four customers, all late.', 'Money for goods customers already took. When they pay, it moves into the first jar.', ['overdue','']],
      ['owe','You owe suppliers', D.payablesTotal, '#E5484D', 'Next one is tomorrow.', 'Bills from suppliers you have not paid yet. They come out of the first jar.', ['supplier','']]].map(j => `
      <div class="ku-j"><button type="button" class="ku-jb" onclick="KUMUSTA.show('${j[6][0]}','${j[6][1]}')">${jar(j[2] / mx, j[3], j[1] + ': ' + F.peso(j[2]))}<span class="ku-jl">${j[1]}</span><b class="num">${F.peso(j[2])}</b><small>${j[4]}</small></button>
        <details class="ku-tip"><summary>What does this mean?</summary><p>${j[5]}</p></details></div>`).join('')}</div></div></section>
  <section class="ku-band" id="ku-stock" aria-labelledby="kuStockH"><div class="ku-in"><h3 id="kuStockH">Your shelves</h3><p class="ku-intro">Each box is a day of stock at the speed you sell. The line on each shelf is how many days the supplier needs.</p>
    <div class="ku-shelves">${D.stock.slice().sort((a,b) => a.cover / a.lead - b.cover / b.lead).map(s => { const n = Math.min(14, Math.round(s.cover)); return `<button type="button" class="ku-sh is-${s.risk}" onclick="KUMUSTA.show('stock','')"><span class="ku-boxes" aria-hidden="true">${Array.from({length:14}, (x,i) => `<i class="${i < n ? 'on' : ''}${i === s.lead - 1 ? ' lead' : ''}"></i>`).join('')}</span><span class="ku-sl"><b>${s.name}</b><small>${s.risk === 'r' ? 'Runs out ' + (s.cover < 2 ? 'Friday' : 'in ' + F.days(s.cover)) + ' · order now' : s.risk === 'y' ? F.days(s.cover) + ' left · order soon' : F.days(s.cover) + ' left · fine'}</small></span></button>`; }).join('')}</div></div></section>
  <section class="ku-band is-soft" id="ku-team" aria-labelledby="kuTeamH"><div class="ku-in"><h3 id="kuTeamH">Your team</h3>
    <div class="ku-chat"><div class="ku-msg"><span class="ku-av">LS</span><p><b>Liza Santos</b>All five of my counts this month were within ₱20. I'm counting the drawer tonight.</p></div>
    <div class="ku-msg is-flag"><span class="ku-av">RR</span><p><b>Nifti, about Rico Reyes</b>On Monday 24 Aug, Rico's drawer was ₱800 short. The next day 6 boxes of welding rods were missing. <button type="button" class="ku-link" onclick="KUMUSTA.show('staff','')">Show me what happened</button></p></div></div></div></section>
  <section class="ku-band" id="ku-ask" aria-labelledby="kuAskH"><div class="ku-in"><h3 id="kuAskH">Ask Nifti</h3><p class="ku-intro">Ask the way you'd ask your accountant.</p>
    <div class="ku-chips">${D.ask.map((a,i) => `<button type="button" onclick="KUMUSTA.ask(${i})">${a.q}</button>`).join('')}</div><div class="ku-convo" id="kuConvo" aria-live="polite"></div></div></section>`;
}
const KUMUSTA = {
  tick(id, v){ done[id] = v; render(); if(v) LAB.toast('Nice. ' + TODO.filter(t => done[t.id]).length + ' of 6 done today.'); },
  show(k, sub, tid){ const f = k === 'metric' ? FLOWS.metric(sub || 'profit') : FLOWS[k](), t = TODO.find(x => x.id === tid) || TODO.find(x => x.k === k);
    sheet.innerHTML = `<div class="ku-sheet" role="dialog" aria-modal="true" aria-label="${F.esc(f.title)}"><div class="ku-sh-h"><div><p>${f.kicker}</p><h3>${f.title}</h3></div><button type="button" class="ku-x" onclick="KUMUSTA.close()" aria-label="Close">✕</button></div>
      ${t ? `<div class="ku-simple"><label class="ku-tg"><input type="checkbox" onchange="this.closest('.ku-sheet').classList.toggle('is-simple', this.checked)"><span aria-hidden="true"></span>Explain simply</label><p class="ku-plain">${t.simple}</p></div>` : ''}
      <div class="ku-sb">${f.body}</div>${t && !done[t.id] ? `<button type="button" class="ku-donebtn" onclick="KUMUSTA.tick('${t.id}', true); KUMUSTA.close()">Mark "${t.t}" as done</button>` : ''}</div>`;
    sheet.hidden = false; sheet.querySelector('.ku-x').focus(); },
  close(){ sheet.hidden = true; },
  ask(i){ const c = root.querySelector('#kuConvo'), a = D.ask[i];
    c.innerHTML = `<div class="ku-b is-me">${a.q}</div><div class="ku-b is-nifti is-typing" aria-label="Nifti is typing"><i></i><i></i><i></i></div>`;
    setTimeout(() => { c.innerHTML = `<div class="ku-b is-me">${a.q}</div><div class="ku-b is-nifti">${a.a}<small>From ${a.src.toLowerCase()} · sample answer</small></div>`; }, 900); },
  go(id){ document.getElementById('ku-' + id).scrollIntoView({behavior:'smooth', block:'start'}); root.querySelectorAll('.ku-nav button').forEach(b => b.setAttribute('aria-current', b.dataset.s === id ? 'page' : 'false')); }
};
window.KUMUSTA = KUMUSTA;

LAB.register({
  id:'kumusta', n:5, name:'Kumusta', territory:'Approachable financial workspace', tagline:'A friendly shop assistant, not a finance tool',
  fonts:'family=Nunito:wght@400;600;700;800;900',
  identity:{
    vision:'Nifti greets the owner like a trusted shop assistant: here is your money, here is today\'s list, here is your team. Sophisticated numbers, told in plain Filipino-English.',
    philosophy:'Many owners are intimidated by finance software. Warmth, plain words and physical metaphors (jars, shelves, a to-do list) make them feel capable. Relieved, encouraged, in charge.',
    distinct:'Money Jars filled to scale (have, owed to you, you owe), a Shelf view where each box is a day of stock, and an "Explain simply" switch on every detail.',
    type:'Nunito: rounded, friendly, very legible. Large sizes (17 px body, 30 px headlines) and short sentences.',
    color:'White and soft sky bands, sky blue for action, sunflower for money owed, coral only for things to fix, mint for done.',
    visual:'Full-width bands instead of boxes; simple drawn objects (jars, shelf boxes, chat bubbles) carry the data.',
    motion:'Gentle: the progress ring fills as items are ticked, the answer arrives after a short typing indicator, the detail sheet slides up.',
    arch:'One scrolling page in plain order: Today (greeting + list), Your money, Your shelves, Your team, Ask Nifti. Details open as a sheet from the bottom with an "Explain simply" switch.'
  },
  components:[['Today\'s list with progress ring','the morning plan as a checklist that feels good to finish'],['Money Jars','have, owed to you and you owe, filled to the same scale'],['Shelf view','each box is a day of stock; a line marks supplier lead time'],['Explain simply','every detail can be rewritten in one plain sentence'],['Team chat','staff status written as messages, with Nifti\'s flags inline'],['Ask like a person','question chips and a chat-style answer']],
  tasks:{open:'A greeting that says how many things need you, then today\'s list.', metric:'Tap a Money Jar; the detail sheet explains it in plain words.', expense:'"Look at the electricity bill" in today\'s list.', overdue:'Tap the yellow jar or "Call Riverside Builders".', stock:'Your shelves: short rows of boxes are items about to run out.', supplier:'Tap the red jar or "Check tomorrow\'s cheque".', staff:'Your team: Rico\'s message from Nifti opens the tally.', ask:'Ask Nifti: pick a question and the answer arrives as a chat reply.'},
  map:{arch:'One friendly scrolling page', nav:'Big section chips (bottom bar on phones)', viz:'Money jars, shelf boxes, chat bubbles', type:'Nunito'},
  eval:{scores:[4,5,3,4,5,3,4], good:'The most welcoming; perfect for first-time or nervous owners; every term is explained.', bad:'The metaphors (jars, shelves) stop scaling with a big catalogue; can feel less "serious" to a bank or an accountant reading over the owner\'s shoulder.', weak:2, weakWhy:'wins on warmth but its sophistication is thin. Jars and shelves are charming the first time and slow the tenth; at fifty products the shelf metaphor breaks, and it hides depth instead of organising it.'},
  mount(el){ root = el; done = {t3:true};
    el.innerHTML = `<div class="ku-wrap"><header class="ku-top"><div class="ku-logo"><b>Nifti</b><span>${D.biz.short}</span></div><nav class="ku-nav" aria-label="Sections">${[['today','Today'],['money','Money'],['stock','Shelves'],['team','Team'],['ask','Ask']].map(([s,l]) => `<button type="button" data-s="${s}" onclick="KUMUSTA.go('${s}')">${l}</button>`).join('')}</nav></header><main id="kuBody"></main><div class="ku-scrim" id="kuSheet" hidden onclick="if(event.target===this)KUMUSTA.close()"></div></div>`;
    sheet = el.querySelector('#kuSheet'); render(); },
  run(k){ if(k === 'open'){ KUMUSTA.close(); KUMUSTA.go('today'); return; }
    if(k === 'ask'){ KUMUSTA.go('ask'); setTimeout(() => KUMUSTA.ask(4), 300); return; }
    const t = TODO.find(x => x.k === k) || {}; KUMUSTA.show(k, k === 'metric' ? 'cash' : '', t.id); }
});
})();
