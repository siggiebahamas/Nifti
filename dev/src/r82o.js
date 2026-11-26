/* ===== Round 82 · Onboarding & ease of use =====
   1) Welcome setup (3 short steps): kind of business, what to help with first, which pages show in the menu.
   2) Pages you use: any page can be turned off in the menu and back on any time. Nothing is deleted; a hidden page still opens from search or a link.
   3) Start here: 7 steps on Home with "Show me", each one opens the right screen and points at the button to press.
   4) Show me around: a 1-minute spotlight tour of the main parts of Nifti. */
const NF82O = {step: 1, draft: null, tour: null, tourI: 0};
const NF82_TYPES = [
  {k: 'sarisari', l: 'Sari-sari store or mini-mart', d: 'Utang, small sales, the cash count at closing', ic: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/>'},
  {k: 'hardware', l: 'Hardware or construction supply', d: 'Contractors on credit, bigger orders, deliveries', ic: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>'},
  {k: 'distributor', l: 'Distributor or wholesaler', d: 'Orders from stores, riders, collections on routes', ic: '<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'},
  {k: 'food', l: 'Carinderia, restaurant or bakery', d: 'Menu items that use up your ingredients', ic: '<path d="M3 11h18"/><path d="M5 11a7 7 0 0 1 14 0"/><path d="M4 15h16l-1.5 5h-13z"/><path d="M12 4v-1"/>'},
  {k: 'retail', l: 'Other shop', d: 'Any store that sells to walk-in customers', ic: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'}
];
const NF82_GOALS = [
  {k: 'paid', l: 'Get paid faster (utang and reminders)', pages: ['collections', 'sales']},
  {k: 'sales', l: 'Record sales and count the cash', pages: ['sales', 'issues']},
  {k: 'profit', l: 'Know my real profit', pages: ['money', 'expenses', 'ledger', 'profit']},
  {k: 'stock', l: 'Keep my stock right', pages: ['inventory', 'profit', 'issues']},
  {k: 'deliver', l: 'Orders and deliveries', pages: ['orders', 'routes', 'returns', 'messages']},
  {k: 'staff', l: 'Pay my staff', pages: ['payroll', 'team']},
  {k: 'bir', l: 'BIR forms (2307 and tax books)', pages: ['taxforms', 'books', 'cheques']},
  {k: 'grow', l: 'Find customers and sell online', pages: ['store', 'discover', 'followups']}
];
const NF82_PAGES = [
  {g: 'Every day', items: [['dashboard', 'Home', 'Today at a glance: what to do, who to collect from, profit so far', 1], ['collections', 'Getting paid', 'Who owes you, reminders, payments to confirm'], ['sales', 'Walk-in sales', 'Shop sales, utang and the cash count'], ['inventory', 'Stock', 'Items, prices, counts and what runs out', 1], ['orders', 'Delivery orders', 'Orders with customers and suppliers', 1], ['messages', 'Messages', 'Chat with customers and suppliers, and Viber', 1]]},
  {g: 'Money', items: [['money', 'Money overview', 'Profit this month and where the money went'], ['expenses', 'Expenses', 'Bills, rent and salaries, with receipts'], ['profit', 'Prices & profit', 'Selling prices, margins, supplier price changes'], ['issues', 'To check', "Cash shorts and stock that doesn't add up"], ['payroll', 'Payroll', 'Pay your staff, with vale and deductions'], ['ledger', 'Monthly summary', 'Profit and loss, what you own and owe'], ['cheques', 'Checks', 'Post-dated checks and when they clear']]},
  {g: 'Selling & delivery', items: [['routes', 'Deliveries', 'Riders, stops and delivery runs'], ['returns', 'Returns & credits', 'Returned goods and credit notes'], ['followups', 'Follow-ups', 'Leads and customers to follow up'], ['store', 'Online store', 'Your shop link and Facebook posts'], ['discover', 'Find customers', 'Nearby businesses that may buy from you']]},
  {g: 'Tax & team', items: [['books', 'Tax books', 'Sales and purchase books for BIR'], ['taxforms', 'BIR 2307s', 'Withholding tax certificates to give and collect'], ['team', 'Team', 'Your people, tasks and what each one can see']]}
];
const NF82_TYPE_OFF = {sarisari: ['routes', 'followups', 'discover', 'cheques', 'books', 'taxforms', 'returns'], hardware: ['discover'], distributor: [], food: ['routes', 'followups', 'discover', 'cheques', 'books', 'taxforms', 'returns'], retail: ['routes', 'followups', 'discover', 'cheques', 'books', 'taxforms']};
const NF82_TYPE_GOALS = {sarisari: ['paid', 'sales', 'profit', 'stock'], hardware: ['paid', 'sales', 'profit', 'stock', 'deliver', 'bir'], distributor: ['paid', 'deliver', 'profit', 'stock', 'bir', 'staff'], food: ['paid', 'sales', 'profit', 'stock', 'staff'], retail: ['paid', 'sales', 'profit', 'stock']};
function nf82Onb(){ try{ return Object.assign({}, bkSettings().nf_onb || {}); }catch(e){ return {}; } }
async function nf82OnbSave(patch){
  const p = Object.assign({}, patch), hid = p.hidden; delete p.hidden;
  let ok = true;
  if(Object.keys(p).length) ok = await bkSaveSettings({nf_onb: Object.assign(nf82Onb(), p)});
  if(ok && Array.isArray(hid) && typeof nf47MenuState === 'function'){ const st = nf47MenuState(), off = {}; hid.forEach(k => { off[k] = 1; }); const on = Object.assign({}, st.on || {}); hid.forEach(k => { delete on[k]; });
    ok = await nf47SaveMenu({mode: 'all', on, off, preview: false});
    try{ if(!hid.includes('routes') && document.body.classList.contains('routes-off') && typeof setRoutesHidden === 'function') setRoutesHidden(false); }catch(e){} }
  nf82ApplyPages(); return ok;
}
function nf82Hidden(){ try{ const st = nf47MenuState(); const h = Object.keys(st.off || {}).filter(k => st.off[k]); if(document.body.classList.contains('routes-off') && !h.includes('routes')) h.push('routes'); return h; }catch(e){ return []; } }
function nf82PageLabel(k){ for(const g of NF82_PAGES){ const it = g.items.find(x => x[0] === k); if(it) return it[1]; } return k; }
function nf82ProposeHidden(type, goals){
  const off = new Set(NF82_TYPE_OFF[type] || []);
  (goals || []).forEach(gk => { const g = NF82_GOALS.find(x => x.k === gk); if(g) g.pages.forEach(p => off.delete(p)); });
  return [...off];
}

/* ---------- menu: hidden pages leave the sidebar, the phone menu and the More sheet ---------- */
function nf82ApplyPages(){ try{ if(typeof nf26MenuPost === 'function') nf26MenuPost(); else if(typeof nf47MenuApply === 'function') nf47MenuApply(); }catch(e){} }
function nf82HiddenBanner(page){
  if(!page || !page.id || !/^page-/.test(page.id)) return;
  const k = page.id.slice(5), hid = nf82Hidden().includes(k), old = page.querySelector(':scope > .nf82-hb');
  if(!hid){ if(old) old.remove(); return; }
  if(old) return;
  page.insertAdjacentHTML('afterbegin', `<div class="nf82-hb" role="status">${nf82Ic('<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/>', 18)}<span><b>${nf82E(nf82PageLabel(k))} is hidden from your menu.</b> It still works here.</span><button type="button" class="nf82-btn s" onclick="nf82ShowPage('${k}')">Show it in my menu</button></div>`);
}
async function nf82ShowPage(k){ const h = nf82Hidden().filter(x => x !== k); if(await nf82OnbSave({hidden: h})){ showToast(`${nf82PageLabel(k)} is back in your menu.`, 'success'); document.querySelectorAll('.nf82-hb').forEach(x => x.remove()); try{ if(typeof nf47PagesPaint === 'function') nf47PagesPaint(); }catch(e){} } }
NF45_AFTER.push(page => { try{ nf82HiddenBanner(page); if(page && page.id === 'page-settings') nf82SettingsCard(); }catch(e){} });

/* ---------- welcome setup ---------- */
function nf82OnbOpen(step){
  try{ if(typeof closeUserMenu === 'function') closeUserMenu(); if(typeof closeMobileSidebar === 'function') closeMobileSidebar(); }catch(e){}
  const o = nf82Onb();
  NF82O.draft = {type: o.type || null, goals: Array.isArray(o.goals) && o.goals.length ? o.goals.slice() : ['paid'], hidden: Array.isArray(o.hidden) ? o.hidden.slice() : null};
  NF82O.step = step || 1;
  let ov = document.getElementById('nf82Onb');
  if(!ov){ ov = document.createElement('div'); ov.id = 'nf82Onb'; ov.className = 'nf82-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'nf82OnbH'); document.body.appendChild(ov);
    ov.addEventListener('keydown', e => { if(e.key === 'Escape') nf82OnbClose(); }); }
  ov.hidden = false; document.body.classList.add('nf82-noscroll'); nf82OnbPaint();
  try{ localStorage.setItem('nifti-onb-seen:' + (myBusiness ? myBusiness.id : 'demo'), '1'); }catch(e){}
}
function nf82OnbClose(){ const ov = document.getElementById('nf82Onb'); if(ov){ ov.hidden = true; ov.innerHTML = ''; } document.body.classList.remove('nf82-noscroll'); }
function nf82OnbPick(k){ const d = NF82O.draft; d.type = k; d.goals = (NF82_TYPE_GOALS[k] || ['paid']).slice(); d.hidden = null; nf82OnbPaint(); }
function nf82OnbGoal(k){ const d = NF82O.draft, i = d.goals.indexOf(k); if(i >= 0) d.goals.splice(i, 1); else d.goals.push(k); d.hidden = null; nf82OnbPaint(); }
function nf82OnbTog(k){ const d = NF82O.draft; if(!d.hidden) d.hidden = nf82ProposeHidden(d.type, d.goals); const i = d.hidden.indexOf(k); if(i >= 0) d.hidden.splice(i, 1); else d.hidden.push(k); nf82OnbPaint(); }
function nf82OnbGo(n){ if(n === 2 && !NF82O.draft.type){ showToast('Pick the one closest to your business.', 'warn'); return; } NF82O.step = n; nf82OnbPaint(); const c = document.querySelector('#nf82Onb .card'); if(c) c.scrollTop = 0; }
async function nf82OnbFinish(){
  const d = NF82O.draft, hidden = d.hidden || nf82ProposeHidden(d.type, d.goals);
  const ok = await nf82OnbSave({type: d.type, goals: d.goals, hidden, done_at: new Date().toISOString()});
  if(!ok) return;
  NF82O.step = 4; nf82OnbPaint();
  try{ if(typeof renderDashboard === 'function') renderDashboard(); }catch(e){}
  setTimeout(() => { try{ nf82StartPaint(true); }catch(e){} }, 120);
}
function nf82PagesListHtml(hidden, tog){
  return NF82_PAGES.map(g => `<div class="pg"><h4>${nf82E(g.g)}</h4>${g.items.map(([k, l, dsc, lock]) => { const on = !hidden.includes(k);
    return `<button type="button" class="pr${on ? ' on' : ''}" role="switch" aria-checked="${on}" ${lock ? 'disabled aria-disabled="true"' : `onclick="${tog}('${k}')"`}><span class="t"><b>${nf82E(l)}</b><small>${nf82E(dsc)}</small></span><span class="sw" aria-hidden="true"><i></i></span>${lock ? '<em>Always on</em>' : ''}</button>`; }).join('')}</div>`).join('');
}
function nf82OnbPaint(){
  const ov = document.getElementById('nf82Onb'); if(!ov) return;
  const d = NF82O.draft, s = NF82O.step, name = myBusiness ? myBusiness.name : 'Dela Cruz Hardware';
  const dots = `<div class="dots" aria-label="Step ${Math.min(s, 3)} of 3">${[1, 2, 3].map(i => `<i class="${i < s ? 'done' : i === s ? 'on' : ''}"></i>`).join('')}</div>`;
  let body = '';
  if(s === 1) body = `<div class="wel"><span class="tl">Mabayaran nang mas mabilis. Alam ang tunay na kita, araw-araw.</span><h2 id="nf82OnbH">Welcome to Nifti, ${nf82E(name)}</h2><p>Let's set up Nifti for your shop. It takes about 2 minutes, and you can change anything later.</p></div>
    <h3>What kind of business is it?</h3>
    <div class="types">${NF82_TYPES.map(t => `<button type="button" class="ty${d.type === t.k ? ' on' : ''}" aria-pressed="${d.type === t.k}" onclick="nf82OnbPick('${t.k}')"><span class="ic">${nf82Ic(t.ic, 26)}</span><span class="tx"><b>${nf82E(t.l)}</b><small>${nf82E(t.d)}</small></span><span class="ck" aria-hidden="true">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 16)}</span></button>`).join('')}</div>
    <div class="ft"><button type="button" class="nf82-lk" onclick="nf82OnbClose()">I'll do this later</button><button type="button" class="nf82-btn p" onclick="nf82OnbGo(2)">Next</button></div>`;
  else if(s === 2) body = `<h2 id="nf82OnbH">What should Nifti help with first?</h2><p>Pick as many as you like. We picked the usual ones for ${nf82E((NF82_TYPES.find(t => t.k === d.type) || {}).l || 'your shop').toLowerCase()}.</p>
    <div class="goals">${NF82_GOALS.map(g => `<button type="button" class="gl${d.goals.includes(g.k) ? ' on' : ''}" aria-pressed="${d.goals.includes(g.k)}" onclick="nf82OnbGoal('${g.k}')"><span class="ck" aria-hidden="true">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 15)}</span>${nf82E(g.l)}</button>`).join('')}</div>
    <div class="ft"><button type="button" class="nf82-btn s" onclick="nf82OnbGo(1)">Back</button><button type="button" class="nf82-btn p" onclick="nf82OnbGo(3)">Next</button></div>`;
  else if(s === 3){ const hid = d.hidden || nf82ProposeHidden(d.type, d.goals), on = NF82_PAGES.reduce((a, g) => a + g.items.filter(x => !hid.includes(x[0])).length, 0);
    body = `<h2 id="nf82OnbH">Your menu</h2><p>These ${on} pages will show in your menu. Turn any on or off. <b>Nothing is deleted:</b> a hidden page still opens from search, and you can bring it back any time in Settings, Pages you use.</p>
    <div class="pages">${nf82PagesListHtml(hid, 'nf82OnbTog')}</div>
    <div class="ft"><button type="button" class="nf82-btn s" onclick="nf82OnbGo(2)">Back</button><button type="button" class="nf82-btn p" onclick="nf82OnbFinish()">Start using Nifti</button></div>`; }
  else body = `<div class="done"><span class="big" aria-hidden="true">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 34)}</span><h2 id="nf82OnbH">You're ready</h2><p>Your menu is set. On Home you'll find <b>Start here</b>: a few short steps, each with a "Show me" button that points at exactly what to press.</p>
    <div class="ft col"><button type="button" class="nf82-btn p" onclick="nf82OnbClose(); go('dashboard'); setTimeout(nf82TourStart, 450)">Show me around (1 minute)</button><button type="button" class="nf82-btn s" onclick="nf82OnbClose(); go('dashboard')">I'll explore on my own</button></div></div>`;
  ov.innerHTML = `<div class="card" tabindex="-1">${s < 4 ? dots : ''}${body}</div>`;
  const h = ov.querySelector('#nf82OnbH'); if(h){ h.setAttribute('tabindex', '-1'); try{ h.focus({preventScroll: true}); }catch(e){} }
}

/* ---------- Pages you use (Settings, and from the hidden-page banner) ---------- */
function nf82PagesOpen(){
  try{ if(typeof closeUserMenu === 'function') closeUserMenu(); }catch(e){}
  navigate('settings');
  setTimeout(() => { const c = document.getElementById('nf47Pages'); if(c){ c.classList.add('open'); c.scrollIntoView({behavior: 'smooth', block: 'start'}); c.classList.add('nf82-flash'); setTimeout(() => c.classList.remove('nf82-flash'), 1800); } }, 350);
}
function nf82SettingsCard(){
  const pg = document.getElementById('page-settings'); if(!pg) return;
  let c = document.getElementById('nf82SetCard'); const o = nf82Onb(), hid = nf82Hidden(), t = NF82_TYPES.find(x => x.k === o.type);
  const html = `<h2>${nf82Ic('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', 20)}Your shop and menu</h2>
    <div class="sub">${t ? `Set up as <b>${nf82E(t.l)}</b>.` : "You haven't told Nifti what kind of business this is yet."} ${hid.length ? `${hid.length} page${hid.length === 1 ? ' is' : 's are'} hidden from the menu.` : 'Every page shows in the menu.'}</div>
    <div class="nf82-sc-acts"><button type="button" class="nf82-btn p" onclick="nf82PagesOpen()">Pages you use</button><button type="button" class="nf82-btn s" onclick="nf82OnbOpen(1)">${t ? 'Change kind of business' : 'Set up my shop'}</button><button type="button" class="nf82-btn s" onclick="go('dashboard'); setTimeout(nf82TourStart, 450)">Show me around</button></div>`;
  if(!c){ c = document.createElement('div'); c.id = 'nf82SetCard'; c.className = 'settings-card no-acc nf82-setcard'; }
  const anchor = document.getElementById('nf47Pages') || pg.querySelector(':scope > .nf18-ss') || pg.querySelector(':scope > .page-head');
  if(anchor && anchor.parentElement === pg){ if(anchor.id === 'nf47Pages'){ if(anchor.previousElementSibling !== c) anchor.insertAdjacentElement('beforebegin', c); } else if(anchor.nextElementSibling !== c) anchor.insertAdjacentElement('afterend', c); } else if(!c.isConnected) pg.prepend(c);
  c.classList.remove('nf27-more'); c.hidden = false;
  if(c.dataset.k !== html){ c.dataset.k = html; c.innerHTML = html; }
}

/* ---------- Start here (Home) ---------- */
function nf82Steps(){
  const o = nf82Onb(), sales = (BK.sales || []).filter(s => !s.voidedAt);
  let pay = 0; try{ pay = (getMyPaymentAccounts() || []).length; }catch(e){}
  let items = 0; try{ items = (inventoryData || []).length + ((typeof myCatalog !== 'undefined' && myCatalog) ? myCatalog.length : 0); }catch(e){}
  let members = 1; try{ members = getActiveTeamMembers().length; }catch(e){}
  let reminded = (NF82G.remlog || []).length > 0; try{ reminded = reminded || (typeof remLogCache !== 'undefined' && (remLogCache || []).length > 0); }catch(e){}
  const utang = sales.some(s => s.paidWith === 'credit' || bkSaleBalance(s) > 0);
  return [
    {k: 'type', t: 'Tell Nifti about your shop', d: 'So the menu only shows what you use.', m: '1 min', done: !!o.type, go: () => nf82OnbOpen(1)},
    {k: 'pay', t: 'Add how customers pay you', d: 'Your GCash or bank goes on every bill and pay link.', m: '1 min', done: pay > 0, go: () => { openSettingsCard('paymentDetailsCard'); setTimeout(() => nf82Spot('#paymentDetailsCard, [id*="paymentDetails"]', 'Add your GCash or bank', 'Customers see these on their bill and on their pay link.'), 450); }},
    {k: 'items', t: 'Add your items and prices', d: 'Pick your kind of shop for starter items, or upload your Excel.', m: '3 min', done: items >= 3, go: () => { if(typeof nf26OpenStart === 'function') nf26OpenStart('kind'); else go('inventory'); }},
    {k: 'sale', t: 'Record your first sale', d: 'Scan or pick items. The total and change add up for you.', m: '30 sec', done: sales.length > 0, go: () => { go('sales'); setTimeout(() => { if(typeof openQuickSale === 'function') openQuickSale(); }, 250); }},
    {k: 'utang', t: 'Write down an utang', d: 'Who owes you, how much, and when they pay.', m: '30 sec', done: utang, go: () => { if(typeof nf80NewUtang === 'function') nf80NewUtang(); }},
    {k: 'remind', t: 'Send your first reminder', d: 'They get a message with a link to pay you by GCash.', m: '1 min', done: reminded, go: () => { go('dashboard'); setTimeout(() => nf82Spot('#nf82Home .nf82-btn.p, #nf82Home', 'Tap Remind', 'Pick Viber, WhatsApp, Messenger or text. The message and pay link are ready.'), 500); }},
    {k: 'team', t: 'Add a teammate', d: 'A cashier or helper, with only what they need to see.', m: '1 min', opt: true, done: members > 1, go: () => go('team')}
  ];
}
function nf82StartHtml(){
  const st = nf82Steps(), need = st.filter(s => !s.opt), done = st.filter(s => s.done).length, all = need.every(s => s.done), next = st.find(s => !s.done);
  const mins = st.filter(s => !s.done).reduce((a, s) => a + (s.m === '30 sec' ? 0.5 : parseFloat(s.m) || 1), 0);
  const pct = Math.round(done / st.length * 100), R = 22, C = 2 * Math.PI * R;
  if(all) return `<section class="panel-card nf82-start ok" id="nf82Start"><div class="hd"><span class="ring ok" aria-hidden="true">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 22)}</span><div class="tt"><h2>You're set up</h2><p>Your shop is in. From here, Home shows what to do each day.</p></div><div class="ha"><button type="button" class="nf82-btn s" onclick="nf82TourStart()">Show me around</button><button type="button" class="nf82-lk" onclick="nf82StartHide()">Hide</button></div></div></section>`;
  return `<section class="panel-card nf82-start" id="nf82Start" aria-labelledby="nf82StartH"><div class="hd">
      <span class="ring" aria-hidden="true"><svg viewBox="0 0 52 52" width="52" height="52"><circle cx="26" cy="26" r="${R}" fill="none" stroke="#E4E7EC" stroke-width="5"/><circle cx="26" cy="26" r="${R}" fill="none" stroke="#1F6B45" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(pct / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 26 26)"/></svg><b>${done}/${st.length}</b></span>
      <div class="tt"><h2 id="nf82StartH">Start here</h2><p>${done} of ${st.length} done · about ${Math.max(1, Math.round(mins))} minute${Math.round(mins) === 1 ? '' : 's'} left. Each "Show me" opens the right screen and points at what to press.</p></div>
      <div class="ha"><button type="button" class="nf82-btn s" onclick="nf82TourStart()">${nf82Ic('<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>', 16)}Show me around</button><button type="button" class="nf82-lk" onclick="nf82StartHide()">Hide for now</button></div></div>
    <ol class="st">${st.map((s, i) => `<li class="${s.done ? 'done' : s === next ? 'next' : ''}"><span class="n" aria-hidden="true">${s.done ? nf82Ic('<path d="M20 6 9 17l-5-5"/>', 15) : i + 1}</span><div class="w"><b>${nf82E(s.t)}${s.opt ? ' <em>optional</em>' : ''}</b><small>${nf82E(s.d)}</small></div><span class="m">${s.done ? 'Done' : nf82E(s.m)}</span>${s.done ? '<span></span>' : `<button type="button" class="nf82-btn ${s === next ? 'p' : 's'}" onclick="nf82StepGo('${s.k}')">${s === next ? 'Show me' : 'Go'}</button>`}</li>`).join('')}</ol>
  </section>`;
}
function nf82StepGo(k){ const s = nf82Steps().find(x => x.k === k); if(s) s.go(); }
function nf82StartHide(){ try{ localStorage.setItem('nifti-start-hide:' + (myBusiness ? myBusiness.id : 'demo'), APP_TODAY); }catch(e){} const el = document.getElementById('nf82StartW'); if(el) el.remove(); showToast('Start here is hidden. Open it again from Settings, Your shop and menu.', 'info'); }
function nf82StartPaint(force){
  const home = document.getElementById('mhHome'); if(!home || !home.offsetParent) return;
  let own = true; try{ own = isPrivilegedUser() && !previewRole; }catch(e){}
  let hidden = false; try{ hidden = !!localStorage.getItem('nifti-start-hide:' + (myBusiness ? myBusiness.id : 'demo')); }catch(e){}
  let w = document.getElementById('nf82StartW');
  if(!own || hidden || !BK.loaded){ if(w) w.remove(); return; }
  const html = nf82StartHtml(); const o = nf82Onb();
  if(/ ok"/.test(html.slice(0, 80)) && o.done_at && daysBetween(String(o.done_at).slice(0, 10), APP_TODAY) > 3){ if(w) w.remove(); return; }
  if(!w){ w = document.createElement('div'); w.id = 'nf82StartW'; }
  if(w.dataset.k !== html){ w.dataset.k = html; w.innerHTML = html; }
  const old26 = document.getElementById('nf26Start'); if(old26) old26.classList.add('nf82-merged');
  const head = home.querySelector('.hero, .page-head'); if(head){ if(head.nextElementSibling !== w) head.insertAdjacentElement('afterend', w); } else if(!w.isConnected) home.prepend(w);
}
NF45_AFTER.push(page => { try{ if(page && page.id === 'page-dashboard') nf82StartPaint(); }catch(e){} });

/* first visit of a new real shop: the welcome setup opens by itself, once */
function nf82AutoOnb(){
  try{
    if(!myBusiness || nf82Onb().type) return; let own = false; try{ own = isPrivilegedUser() && !previewRole; }catch(e){} if(!own) return;
    if(localStorage.getItem('nifti-onb-seen:' + myBusiness.id)) return;
    const made = String(myBusiness.created_at || '').slice(0, 10); if(made && daysBetween(made, APP_TODAY) > 21) return;
    setTimeout(() => { if(!document.getElementById('nf82Onb') || document.getElementById('nf82Onb').hidden) nf82OnbOpen(1); }, 900);
  }catch(e){}
}
NF45_AFTER.push(page => { if(page && page.id === 'page-dashboard' && !NF82O.auto){ NF82O.auto = true; nf82AutoOnb(); } });

/* ---------- spotlight: one tip, or the 1-minute tour ---------- */
function nf82VisEl(sel){ const list = typeof sel === 'function' ? [].concat(sel() || []) : [...document.querySelectorAll(sel)]; return list.find(e => { if(!e) return false; const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && getComputedStyle(e).visibility !== 'hidden'; }) || null; }
function nf82SpotDraw(el, title, text, foot){
  let ov = document.getElementById('nf82Spot');
  if(!ov){ ov = document.createElement('div'); ov.id = 'nf82Spot'; ov.innerHTML = '<div class="hole"></div><div class="tip" role="dialog" aria-live="polite"></div>'; document.body.appendChild(ov); }
  ov.hidden = false; ov.classList.toggle('nohole', !el);
  const hole = ov.querySelector('.hole'), tip = ov.querySelector('.tip');
  tip.innerHTML = `<b>${nf82E(title)}</b><p>${nf82E(text)}</p>${foot || `<div class="tf"><span></span><button type="button" class="nf82-btn p" onclick="nf82SpotClose()">Got it</button></div>`}`;
  const place = () => {
    const vw = innerWidth, vh = innerHeight, tw = Math.min(340, vw - 24);
    tip.style.width = tw + 'px';
    if(!el){ hole.style.cssText = 'display:none'; tip.style.left = Math.round((vw - tw) / 2) + 'px'; tip.style.top = Math.round(vh / 2 - tip.offsetHeight / 2) + 'px'; return; }
    const r = el.getBoundingClientRect(), pad = 6;
    hole.style.cssText = `display:block;left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
    let top = r.bottom + 14, left = Math.min(Math.max(12, r.left), vw - tw - 12);
    if(top + tip.offsetHeight > vh - 12) top = Math.max(12, r.top - tip.offsetHeight - 14);
    if(r.width < vw * 0.4 && r.right + tw + 24 < vw && (top < 12 || top + tip.offsetHeight > vh - 12)){ left = r.right + 14; top = Math.max(12, Math.min(vh - tip.offsetHeight - 12, r.top)); }
    tip.style.left = Math.round(left) + 'px'; tip.style.top = Math.round(top) + 'px';
  };
  place(); ov._place = place; ov._el = el;
  if(!ov._raf){ const loop = () => { if(ov.hidden){ ov._raf = 0; return; } if(ov._el && ov._place) ov._place(); ov._raf = requestAnimationFrame(loop); }; ov._raf = requestAnimationFrame(loop); }
  const b = tip.querySelector('.nf82-btn.p'); if(b) try{ b.focus({preventScroll: true}); }catch(e){}
}
function nf82SpotClose(){ const ov = document.getElementById('nf82Spot'); if(ov){ ov.hidden = true; ov._el = null; if(ov._raf){ cancelAnimationFrame(ov._raf); ov._raf = 0; } } NF82O.tour = null; document.removeEventListener('keydown', nf82SpotKey, true); }
function nf82SpotKey(e){ if(e.key === 'Escape') nf82SpotClose(); else if(NF82O.tour && e.key === 'ArrowRight') nf82TourStep(NF82O.tourI + 1); else if(NF82O.tour && e.key === 'ArrowLeft') nf82TourStep(NF82O.tourI - 1, -1); }
window.addEventListener('resize', () => { const ov = document.getElementById('nf82Spot'); if(ov && !ov.hidden && ov._place) ov._place(); });
window.addEventListener('scroll', () => { const ov = document.getElementById('nf82Spot'); if(ov && !ov.hidden && ov._place) ov._place(); }, true);
function nf82ScrollTo(el){
  if(!el) return; const r = el.getBoundingClientRect(), vh = innerHeight, y = window.scrollY + r.top - (r.height > vh * 0.45 ? Math.min(260, vh * 0.32) : Math.max(90, (vh - r.height) / 2));
  const fixed = (() => { let n = el; while(n && n !== document.body){ const ps = getComputedStyle(n).position; if(ps === 'fixed' || ps === 'sticky') return true; n = n.parentElement; } return false; })();
  if(fixed) return;
  try{ window.scrollTo({top: Math.max(0, y), behavior: 'instant'}); }catch(e){ window.scrollTo(0, Math.max(0, y)); }
}
function nf82Spot(sel, title, text){
  const el = nf82VisEl(sel); nf82ScrollTo(el);
  setTimeout(() => { nf82SpotDraw(el, title, text); document.addEventListener('keydown', nf82SpotKey, true); }, 60);
}
function nf82TourSteps(){
  const phone = innerWidth < 900;
  const nav = k => phone ? `.bnav-item[data-page="${k}"], .more-sheet-item[data-page="${k}"]` : `.sidebar .nav-item[data-page="${k}"]`;
  const byText = (sel, re) => () => [...document.querySelectorAll(sel)].filter(e => re.test(e.textContent));
  return [
    {s: null, t: 'A quick look around', x: 'Six stops, about a minute. Use Next, or the arrow keys.'},
    {s: '#nf82Home, .nf82-col', t: 'Collect today', x: 'Who to remind today, ranked by how much and how late. The message and their pay link are ready: you just tap send.'},
    {s: '.nf75-owner', t: 'Owner view', x: 'Profit so far, your margin and biggest costs. Tap Biggest costs to see every expense right here.'},
    {s: byText('button, a', /^\s*\+\s*Create\s*$/), t: '+ Create', x: 'Record a sale, an utang, an expense or an order from any page.'},
    {s: 'input[placeholder*="utang"], .nf-search input, #globalSearch', t: 'Search anything', x: 'Type what you need, like "utang", "sahod" or a customer, and jump straight there. Hidden pages open from here too.'},
    {s: nav('sales'), t: 'Walk-in sales', x: 'Your counter: record sales, utang, and count the cash at closing.'},
    {s: nav('collections'), t: 'Getting paid', x: 'Everyone who owes you, payments to confirm, and your reminder days.'},
    {s: byText('button', /What's this page\?/), t: 'Help on every page', x: '"What\'s this page?" explains each page in plain words, and most pages have a 1-minute tour.'}
  ];
}
function nf82TourStart(){
  try{ if(typeof closeMobileSidebar === 'function') closeMobileSidebar(); }catch(e){}
  NF82O.tour = nf82TourSteps(); NF82O.tourI = 0; document.addEventListener('keydown', nf82SpotKey, true); nf82TourStep(0);
}
function nf82TourStep(i, dir){
  const T = NF82O.tour; if(!T) return; dir = dir || 1; if(i < 0){ i = 0; dir = 1; }
  if(i >= T.length){ nf82SpotClose(); try{ nf82OnbSave({tour_seen: APP_TODAY}); }catch(e){} showToast('That\'s the tour. Replay it any time from Settings, Your shop and menu.', 'success'); return; }
  NF82O.tourI = i; const st = T[i], el = st.s ? nf82VisEl(st.s) : null;
  if(st.s && !el) return nf82TourStep(i + dir, dir);
  const foot = `<div class="tf"><span class="cnt">${i + 1} of ${T.length}</span><span class="bt">${i > 0 ? `<button type="button" class="nf82-btn s" onclick="nf82TourStep(${i - 1}, -1)">Back</button>` : `<button type="button" class="nf82-lk" onclick="nf82SpotClose()">Skip</button>`}<button type="button" class="nf82-btn p" onclick="nf82TourStep(${i + 1})">${i === T.length - 1 ? 'Done' : 'Next'}</button></span></div>`;
  nf82ScrollTo(el);
  setTimeout(() => nf82SpotDraw(el, st.t, st.x, foot), 60);
}
