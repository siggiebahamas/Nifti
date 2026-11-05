/* Nifti Design Lab shell: concept switcher, identity panel, 8-task walkthrough, review page.
   Concepts register themselves with LAB.register({...}); each one owns its own DOM, CSS scope and interactions. */
(function(){
const LAB = { concepts: [], cur: null };
const $ = s => document.querySelector(s);

LAB.register = c => { LAB.concepts.push(c); LAB.concepts.sort((a,b) => a.n - b.n); };
LAB.toast = msg => {
  document.querySelectorAll('.lab-toast').forEach(e => e.remove());
  const t = document.createElement('div'); t.className = 'lab-toast'; t.setAttribute('role','status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3400);
};
const fontsLoaded = {};
function loadFonts(c){ if(!c.fonts || fontsLoaded[c.id]) return; fontsLoaded[c.id] = true;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?' + c.fonts + '&display=swap'; document.head.appendChild(l); }

function show(id){
  const stage = $('#stage');
  document.querySelectorAll('.lab-tab').forEach(b => b.setAttribute('aria-current', b.dataset.id === id ? 'page' : 'false'));
  $('#labSelect').value = id;
  closePanels();
  if(id === 'review'){ LAB.cur = null; stage.className = 'stage stage-review'; stage.innerHTML = REVIEW(); $('#labTools').hidden = true; window.scrollTo(0,0); return; }
  const c = LAB.concepts.find(x => x.id === id) || LAB.concepts[0];
  LAB.cur = c; loadFonts(c); $('#labTools').hidden = false;
  stage.className = 'stage cx cx-' + c.id; stage.innerHTML = '';
  c.mount(stage);
  $('#labName').textContent = c.n + '. ' + c.name; $('#labTerr').textContent = c.territory;
}
function closePanels(){ ['#aboutPanel','#walkPanel'].forEach(s => { const p = $(s); if(p) p.hidden = true; }); document.querySelectorAll('[aria-expanded]').forEach(b => b.setAttribute('aria-expanded','false')); }
function toggle(panelSel, btn){
  const p = $(panelSel), open = p.hidden; closePanels(); p.hidden = !open; btn.setAttribute('aria-expanded', String(open));
  if(open && panelSel === '#aboutPanel') p.innerHTML = ABOUT(LAB.cur);
  if(open && panelSel === '#walkPanel') p.innerHTML = WALK(LAB.cur);
}
const ABOUT = c => `<div class="lab-about">
  <div class="la-head"><span class="la-n">${String(c.n).padStart(2,'0')}</span><div><h2>${c.name}</h2><p>${c.territory} · ${c.tagline}</p></div><button type="button" class="lab-x" onclick="LAB.close()" aria-label="Close">✕</button></div>
  <div class="la-grid">${[['Creative vision', c.identity.vision], ['Philosophy and feeling', c.identity.philosophy], ['What makes it recognizable', c.identity.distinct], ['Typography', c.identity.type], ['Colour and surfaces', c.identity.color], ['Visual language and components', c.identity.visual], ['Motion and interaction', c.identity.motion], ['Architecture', c.identity.arch]].map(([k,v]) => `<div><b>${k}</b><p>${v}</p></div>`).join('')}</div>
  <div class="la-comp"><b>Signature components</b><ol>${c.components.map(x => `<li><span>${x[0]}</span> ${x[1]}</li>`).join('')}</ol></div></div>`;
const WALK = c => `<div class="lab-walk">
  <div class="la-head"><div><h2>Walk through the 8 owner tasks</h2><p>Each button runs the task inside ${c.name}, the way this concept handles it.</p></div><button type="button" class="lab-x" onclick="LAB.close()" aria-label="Close">✕</button></div>
  <ol class="lw-list">${FLOWS.keys.map(([k,l],i) => `<li><button type="button" onclick="LAB.task('${k}')"><span class="lw-n">${i+1}</span><span class="lw-t"><b>${l}</b><small>${c.tasks[k]}</small></span><span class="lw-go" aria-hidden="true">→</span></button></li>`).join('')}</ol></div>`;
LAB.close = closePanels;
LAB.task = k => { closePanels(); if(LAB.cur && LAB.cur.run) LAB.cur.run(k); };

/* ---------- review: audit, concept map, evaluation, self-critique ---------- */
function REVIEW(){
  const C = LAB.concepts;
  const scoreRow = c => `<tr><th scope="row">${c.n}. ${c.name}</th>${c.eval.scores.map(s => `<td><span class="rv-dots" aria-label="${s} out of 5">${'●'.repeat(s)}<span>${'●'.repeat(5 - s)}</span></span></td>`).join('')}</tr>`;
  return `<article class="rv">
  <header class="rv-head"><p class="rv-kick">Design lab · stages 1, 2 and 4</p><h1>Audit, concept map and honest review</h1><p>Read this alongside the prototypes. Nothing here is a recommendation of a winner; the choice is yours.</p></header>
  <section><h2>1 · Audit of the current product</h2>
    <div class="rv-cols"><div><h3>What Nifti does today</h3><ul>
      <li>One file app (Nifti_Sept17.html) with 33 pages: Home, Orders, Messages, Customers and suppliers, Stock, Sales, Expenses, Cash count, Who owes you, Profit and prices, To check, Books and reports, Bank and deposits, Payroll, Month-end close, Online store, Price list, Cheques, Routes, Returns, BIR 2307, Watchdog, Team and others.</li>
      <li>Data in Supabase: purchase_orders (both sides), downstream_sales, expenses, cash_counts, stock_moves, inventory_items, a double-entry ledger, audit_log, price_approvals.</li>
      <li>Controls already live: blind cash counts, price lock with owner approval, receipts on every sale, expense approvals, month-end lock, edit history.</li>
      <li>English and Filipino switch; demo mode with a sample hardware shop.</li></ul></div>
    <div><h3>Design limitations</h3><ul>
      <li>Every page is the same recipe: page title, row of number cards, white rounded panels, a table.</li>
      <li>Hierarchy comes only from size and colour. Nothing says why a number moved or what happens next.</li>
      <li>Functions sit in separate pages; the owner has to connect cash, receivables, stock and staff in their head.</li>
      <li>Theme rounds changed paint, not structure. The Dusk screenshot also shows a contrast bug: "Tally" buttons are purple text on a purple button.</li>
      <li>Charts are rare and mostly decorative; no forecasting, no cross-links between metrics.</li></ul></div>
    <div><h3>Owner workflows to design for</h3><ul>
      <li>Morning: how did yesterday go, what needs me today.</li>
      <li>Money: can I pay what is due; who do I chase.</li>
      <li>Stock: what runs out before the supplier can deliver; what ties up cash.</li>
      <li>People: whose drawer was off and why; what was edited.</li>
      <li>Month: am I making more than last month, and where did it go.</li></ul></div>
    <div><h3>Opportunities</h3><ul>
      <li>Nifti already holds the data to connect signals (a short drawer plus missing stock plus one sale), which most tools cannot.</li>
      <li>A forward view of cash (cheques, rent, salaries, promised payments) is missing and high value.</li>
      <li>Explanations in plain words, with evidence, fit owners who are not accountants.</li>
      <li>Distributor-specific views: days of stock against supplier lead time, orders in transit, capital tied in slow stock.</li></ul></div></div>
  </section>
  <section><h2>2 · The ten concepts at a glance</h2>
    <div class="rv-tbl"><table><thead><tr><th>#</th><th>Concept</th><th>Architecture</th><th>Navigation</th><th>Data language</th><th>Type</th></tr></thead><tbody>
    ${C.map(c => `<tr><td>${c.n}</td><td><b>${c.name}</b><small>${c.territory}</small></td><td>${c.map.arch}</td><td>${c.map.nav}</td><td>${c.map.viz}</td><td>${c.map.type}</td></tr>`).join('')}</tbody></table></div>
  </section>
  <section><h2>4 · Critical evaluation</h2>
    <p class="rv-note">Scored 1–5 by me against the brief, deliberately harshly. Columns: originality, usability, visual sophistication, information architecture, accessibility, scalability, fit for distributors.</p>
    <div class="rv-tbl"><table class="rv-scores"><thead><tr><th>Concept</th><th>Orig.</th><th>Usab.</th><th>Visual</th><th>IA</th><th>Access.</th><th>Scale</th><th>Fit</th></tr></thead><tbody>${C.map(scoreRow).join('')}</tbody></table></div>
    <div class="rv-cards">${C.map(c => `<div><h3>${c.n}. ${c.name}</h3><p><b>Holds up:</b> ${c.eval.good}</p><p><b>Falls short:</b> ${c.eval.bad}</p></div>`).join('')}</div>
  </section>
  <section><h2>Self-critique: the five weakest</h2>
    <p class="rv-note">Judged as a demanding design panel would. These five lean on patterns that already exist in many products, or trade usability for novelty.</p>
    <ol class="rv-weak">${C.filter(c => c.eval.weak).sort((a,b) => a.eval.weak - b.eval.weak).map(c => `<li><b>${c.name}</b> ${c.eval.weakWhy}</li>`).join('')}</ol>
    <p class="rv-note">Next round (per section 12 of the brief): five replacement concepts that deliberately avoid sidebars, KPI rows, card grids and tables as the primary structure. Not built yet; I'll make them once you've looked at these ten.</p>
  </section></article>`;
}

/* ---------- boot ---------- */
LAB.boot = () => {
  const tabs = LAB.concepts.map(c => `<button class="lab-tab" type="button" data-id="${c.id}" aria-current="false" onclick="location.hash='${c.id}'"><span>${String(c.n).padStart(2,'0')}</span>${c.name}</button>`).join('');
  $('#labTabs').innerHTML = tabs + `<button class="lab-tab lab-tab-rv" type="button" data-id="review" aria-current="false" onclick="location.hash='review'">Review</button>`;
  $('#labSelect').innerHTML = LAB.concepts.map(c => `<option value="${c.id}">${c.n}. ${c.name}</option>`).join('') + '<option value="review">Audit and review</option>';
  $('#labSelect').onchange = e => { location.hash = e.target.value; };
  $('#btnAbout').onclick = e => toggle('#aboutPanel', e.currentTarget);
  $('#btnWalk').onclick = e => toggle('#walkPanel', e.currentTarget);
  const route = () => show((location.hash || '').slice(1) || LAB.concepts[0].id);
  window.addEventListener('hashchange', route); route();
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closePanels(); });
};
window.LAB = LAB;
})();
