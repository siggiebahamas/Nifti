/* ===== Round 26: the menu (labeled groups that open, per role), shop-word search, weekly tip, empty pages ===== */

/* ---------- 1. Labeled groups that open ---------- */
// Home, Orders, Messages and Stock always show. Money is open; the other groups show how many pages are inside
// and open with one tap. Each person only sees the pages their role allows; someone with seven pages or fewer
// gets a plain list with no groups at all.
(function(){
  try{
    NF20_GROUPS.splice(0, NF20_GROUPS.length,
      {k: 'main', label: '', items: [['dashboard', 'Home'], ['orders', 'Orders'], ['messages', 'Messages'], ['inventory', 'Stock']]},
      {k: 'money', label: 'Money', items: [['money', 'Money overview'], ['sales', 'Sales'], ['expenses', 'Expenses'], ['collections', 'Getting paid'], ['profit', 'Prices'], ['issues', 'To check'], ['payroll', 'Payroll'], ['ledger', 'Books']]},
      {k: 'sell', label: 'Selling & delivery', items: [['followups', 'Follow-ups'], ['routes', 'Deliveries'], ['returns', 'Returns & credits'], ['store', 'Online store'], ['discover', 'Find customers']]},
      {k: 'more', label: 'Checks, taxes & team', items: [['cheques', 'Checks'], ['books', 'Tax books'], ['taxforms', 'BIR 2307s'], ['team', 'Team']]});
    NF20_PAGES.splice(0, NF20_PAGES.length, ...NF20_GROUPS.flatMap(g => g.items.map(x => x[0])));
  }catch(e){ console.warn('nf26 groups', e); }
})();
const NF26_FOLD = 'nifti-menu-fold-26', NF26_FOLD_DEFAULT = {money: false, sell: true, more: true, ai: false};
nf20Folded = function(){ let f = null; try{ f = JSON.parse(localStorage.getItem(NF26_FOLD) || 'null'); }catch(e){} return Object.assign({}, NF26_FOLD_DEFAULT, f || {}); };
nf20Fold = function(k, open){
  const f = nf20Folded(); f[k] = open === true ? false : open === false ? true : !f[k];
  try{ localStorage.setItem(NF26_FOLD, JSON.stringify(f)); }catch(e){}
  const g = document.querySelector('.sidebar .nf20-g[data-g="' + k + '"]');
  if(g){ g.classList.toggle('folded', !!f[k]); const h = g.querySelector('.nf20-h'); if(h) h.setAttribute('aria-expanded', String(!f[k])); }
};
const NF26_BANK_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>';
const NF26_HELP_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>';
const NF26_STAR_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1Z"/></svg>';
function nf26Visible(el){ return el && el.style.display !== 'none' && !el.hidden; }
function nf26MenuPost(){
  const box = document.querySelector('.sidebar .nf19-nav'); if(!box) return;
  // the Bank page (deposits and bank statements) lives under Checks, taxes & team
  const more = box.querySelector('.nf20-g[data-g="more"] .nf20-gi');
  let bank = document.getElementById('nf26BankNav');
  if(!bank){ bank = document.createElement('button'); bank.type = 'button'; bank.className = 'nav-item nf19-on'; bank.id = 'nf26BankNav'; bank.dataset.page = 'collections'; bank.dataset.nf26 = 'bank';
    bank.innerHTML = NF26_BANK_IC + '<span>Bank & deposits</span>'; bank.onclick = () => { nf18GoPaid('cash'); try{ if(typeof closeMobileSidebar === 'function') closeMobileSidebar(); }catch(e){} }; }
  if(more){ const ch = more.querySelector('.nav-item[data-page="cheques"]'); const at = ch ? ch.nextSibling : more.firstChild; if(bank.parentElement !== more || bank.previousElementSibling !== ch) more.insertBefore(bank, at); }
  try{ bank.style.display = isPageAllowedForViewAsRole('collections') ? '' : 'none'; }catch(e){}
  // AI tools goes last, under the other groups
  // how many pages each group holds, shown on its heading
  let total = 0;
  box.querySelectorAll(':scope > .nf20-g').forEach(g => {
    const n = [...g.querySelectorAll('.nav-item')].filter(nf26Visible).length; total += n;
    const h = g.querySelector('.nf20-h'); if(!h) return;
    let c = h.querySelector('.nf26-n'); if(!c){ c = document.createElement('em'); c.className = 'nf26-n'; h.insertBefore(c, h.querySelector('svg')); }
    if(c.textContent !== String(n)) c.textContent = n;
  });
  // seven pages or fewer: one plain list, no groups to open
  const flat = total <= 7; if(box.classList.contains('nf26-flat') !== flat) box.classList.toggle('nf26-flat', flat);
  nf26MenuFoot(box);
  nf26MenuSearch(box);
}
function nf26MenuFoot(box){
  let f = document.getElementById('nf26Foot');
  if(!f){ f = document.createElement('div'); f.id = 'nf26Foot'; f.className = 'nf26-foot';
    f.innerHTML = `<button type="button" class="nf26-plan" id="nf26PlanNav" onclick="nf26OpenPlans()">${NF26_STAR_IC}<span><b>Plans &amp; pricing</b><small id="nf26PlanSub">See what Pro adds</small></span></button>
      <button type="button" class="nf26-help" id="nf26HelpNav" onclick="nf26Help()">${NF26_HELP_IC}<span><b>Need help?</b><small>Message the Nifti team</small></span></button>`; }
  const after = box.querySelector('#nf22Foot');
  if(f.parentElement !== box || box.lastElementChild !== f) box.appendChild(f);
  if(after && after.nextElementSibling !== f) box.insertBefore(after, f);
  try{ const sub = document.getElementById('nf26PlanSub'); const t = typeof nf26PlanLine === 'function' ? nf26PlanLine() : ''; if(sub && t && sub.textContent !== t) sub.textContent = t; }catch(e){}
  try{ const pl = document.getElementById('nf26PlanNav'); const own = nf20IsOwner() && !previewRole; if(pl && pl.hidden === own) pl.hidden = !own; }catch(e){}
}

/* ---------- 2. A search that knows shop words ---------- */
// "utang", "resibo", "sahod", "tseke": the right page comes up first, in the menu and in the search on top.
const NF26_FIND = [
  {p: 'collections', t: 'Getting paid', d: 'Who owes you, reminders, promises to pay', w: 'utang pautang singil singilin maniningil collect collection owe owes owed balance overdue late reminder paalala statement soa bayad due'},
  {p: 'sales', t: 'Sales', d: 'Record a sale, receipts, count the cash', w: 'benta sale sales sold tinda resibo receipt walkin walk-in gcash sukli kahon drawer cash count bilang pera'},
  {p: 'expenses', t: 'Expenses', d: 'Bills, rent, gas, snap a receipt', w: 'gastos gastusin expense expenses bayarin kuryente tubig upa renta rent gasolina gas meralco maynilad resibo receipt'},
  {p: 'payroll', t: 'Payroll', d: 'Pay your staff, vale comes off', w: 'sahod sweldo suweldo payroll salary salaries vale kaltas payslip pay staff'},
  {p: 'cheques', t: 'Checks', d: 'When to deposit, what bounced', w: 'tseke cheque cheques check checks pdc postdated deposit bounced tumalbog'},
  {p: 'bank', t: 'Bank & deposits', d: 'Cash to the bank, match your statement', w: 'bangko bank deposit deposito statement bdo bpi metrobank'},
  {p: 'inventory', t: 'Stock', d: 'What you have and what runs out', w: 'stock stocks imbentaryo paninda produkto product products item items ubos paubos bilang inventory count'},
  {p: 'orders', t: 'Orders', d: 'Orders from customers and to suppliers', w: 'order orders po purchase padala bili kuha delivery'},
  {p: 'routes', t: 'Deliveries', d: "The driver's list for today", w: 'deliver delivery deliveries hatid driver rider ruta route truck'},
  {p: 'returns', t: 'Returns & credits', d: 'Returns, damaged items, credits', w: 'return returns sauli isauli credit credits sira damaged palit refund'},
  {p: 'store', t: 'Online store', d: 'Your store link and Facebook posts', w: 'store online tindahan facebook fb post posts marketplace shop'},
  {p: 'profit', t: 'Prices', d: 'Cost, selling price, price changes', w: 'presyo price prices patong markup puhunan cost tubo'},
  {p: 'money', t: 'Money overview', d: 'Profit and where the money went', w: 'kita kinita tubo profit income pera money overview cash flow'},
  {p: 'ledger', t: 'Books', d: 'Summaries for your bookkeeper', w: 'books libro accounting report reports bookkeeper ledger accountant'},
  {p: 'books', t: 'Tax books', d: 'VAT summaries for your bookkeeper', w: 'vat tax buwis bir tax books sales book'},
  {p: 'taxforms', t: 'BIR 2307s', d: 'Withholding forms owed to you', w: '2307 withholding ewt bir form'},
  {p: 'issues', t: 'To check', d: 'Things that look off, in plain words', w: 'kulang nawawala missing suspicious check to check problem mali'},
  {p: 'team', t: 'Team', d: 'Your people and their tasks', w: 'staff tauhan empleyado team task gawain tao people'},
  {p: 'messages', t: 'Messages', d: 'Chats with customers and suppliers', w: 'chat message messages mensahe viber usap'},
  {p: 'followups', t: 'Follow-ups', d: 'Who to call back and sell to again', w: 'follow followup follow-up leads balikan tawag reorder'},
  {p: 'discover', t: 'Find customers', d: 'New buyers and suppliers', w: 'find new customers bagong customer supplier hanap'},
  {p: 'settings', t: 'Settings', d: 'Your business, team and account', w: 'settings setting password account setup business ayos'},
  {p: '@notebook', t: 'Notebook reader', d: 'Turn a notebook photo into records', w: 'notebook kuwaderno kwaderno listahan sulat photo litrato'},
  {p: '@alerts', t: 'Telegram alerts', d: 'Alerts on your phone', w: 'telegram alert alerts abiso notification'},
  {p: '@plans', t: 'Plans & pricing', d: 'Free, Pro and Business', w: 'plan plans pro upgrade subscribe subscription pricing bayad nifti business'},
  {p: '@help', t: 'Need help?', d: 'Message the Nifti team', w: 'help tulong saklolo support question tanong'},
  {p: '@start', t: 'Bring your shop in', d: 'Set up items, customers and utang', w: 'setup start simula import excel bring'}
];
function nf26FindOk(x){
  if(x.p === '@plans') return nf20IsOwner();
  if(x.p[0] === '@') return true;
  try{ return isPageAllowedForViewAsRole(x.p === 'bank' ? 'collections' : x.p); }catch(e){ return true; }
}
function nf26Find(q){
  const s = String(q || '').toLowerCase().trim(); if(s.length < 2) return [];
  const toks = s.split(/\s+/);
  return NF26_FIND.filter(nf26FindOk).map(x => { const words = x.w.split(' '); let score = 0;
    toks.forEach(t => { if(x.t.toLowerCase().startsWith(t)) score += 5; else if(x.t.toLowerCase().includes(t)) score += 3;
      words.forEach(w => { if(w === t) score += 4; else if(w.startsWith(t)) score += 2; }); });
    return {x, score}; }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 4).map(r => r.x);
}
function nf26Go(p){
  try{ document.getElementById('globalSearchResults').classList.add('hidden'); document.getElementById('globalSearchInput').value = ''; }catch(e){}
  try{ if(typeof closeMobileSidebar === 'function') closeMobileSidebar(); }catch(e){}
  const i = document.getElementById('nf26MenuQ'); if(i){ i.value = ''; nf26MenuFilter(''); }
  if(p === '@notebook') return nf22NbOpen(); if(p === '@alerts') return nf21OpenAlerts(); if(p === '@plans') return nf26OpenPlans();
  if(p === '@help') return nf26Help(); if(p === '@start') return nf26OpenStart();
  if(p === 'bank') return nf18GoPaid('cash');
  go(p); window.scrollTo(0, 0);
}
function nf26FindRows(list){
  return list.map(x => `<div class="notif-item nf26-fr" role="button" tabindex="0" onclick="nf26Go('${x.p}')"><div><div class="notif-text"><b>${escapeHtml(x.t)}</b></div><div class="notif-time">${escapeHtml(x.d)}</div></div><span class="nf26-go" aria-hidden="true">›</span></div>`).join('');
}
(function(){
  const base = window.onGlobalSearch;
  if(typeof base !== 'function' || base._nf26) return;
  const w = function(q){
    const r = base.apply(this, arguments);
    try{ const box = document.getElementById('globalSearchResults'); const hits = nf26Find(q);
      if(hits.length && box){ const none = /No matches for/.test(box.textContent);
        box.innerHTML = `<div class="notif-head">Go to a page</div>${nf26FindRows(hits)}` + (none ? '' : box.innerHTML); box.classList.remove('hidden'); } }catch(e){}
    return r; };
  w._nf26 = true; window.onGlobalSearch = w; try{ onGlobalSearch = w; }catch(e){}
})();
function nf26MenuSearch(box){
  if(document.getElementById('nf26MenuFind')) return;
  const d = document.createElement('div'); d.id = 'nf26MenuFind'; d.className = 'nf26-mfind';
  d.innerHTML = `<label class="nf26-mq"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="nf26MenuQ" type="search" autocomplete="off" placeholder="Find a page…" aria-label="Find a page" oninput="nf26MenuFilter(this.value)" onkeydown="if(event.key==='Enter'){ const f = nf26Find(this.value)[0]; if(f) nf26Go(f.p); }"></label><div class="nf26-mres" id="nf26MenuRes" hidden></div>`;
  box.insertBefore(d, box.firstChild);
}
function nf26MenuFilter(q){
  const res = document.getElementById('nf26MenuRes'); if(!res) return;
  const hits = nf26Find(q);
  if(!String(q || '').trim()){ res.hidden = true; res.innerHTML = ''; return; }
  res.hidden = false;
  res.innerHTML = hits.length ? hits.map(x => `<button type="button" onclick="nf26Go('${x.p}')"><b>${escapeHtml(x.t)}</b><small>${escapeHtml(x.d)}</small></button>`).join('')
    : `<p>No page for "${escapeHtml(q)}". Try "utang", "benta" or "stock".</p>`;
}

/* ---------- 3. One tip a week on Home, only for tools you haven't opened ---------- */
const NF26_SEEN = 'nifti-opened-tools';
function nf26Seen(){ try{ return JSON.parse(localStorage.getItem(NF26_SEEN) || '{}') || {}; }catch(e){ return {}; } }
function nf26MarkSeen(k){ const s = nf26Seen(); if(s[k]) return; s[k] = Date.now(); try{ localStorage.setItem(NF26_SEEN, JSON.stringify(s)); }catch(e){} }
const NF26_TIPS = [
  {k: '@notebook', t: 'Did you know Nifti can read your old notebook?', d: 'Take a photo of your utang or sales notebook. Nifti types it in for you, and you say yes to each line.', b: 'Try it'},
  {k: '@alerts', t: 'Get new orders and payments on Telegram', d: "Nifti sends a message to your phone when an order comes in, someone pays, or stock runs low. It's free.", b: 'Set it up'},
  {k: 'cheques', t: 'Got a check from a customer?', d: 'Write it in Checks. Nifti tells you the day to deposit it, so nothing bounces or expires.', b: 'Open Checks'},
  {k: 'store', t: 'Your own online store, free', d: 'Share one link on Facebook. Buyers pick items and the order lands in Nifti.', b: 'See my store'},
  {k: 'payroll', t: 'Pay your staff in two taps', d: 'Nifti adds up the days, takes off vale, and makes the payslips.', b: 'Open Payroll'},
  {k: 'routes', t: "Send your driver today's list", d: 'All stops and what to collect, sent by Viber.', b: 'Open Deliveries'},
  {k: 'followups', t: 'Who should you call today?', d: 'Nifti lists customers who usually reorder about now, with the message ready.', b: 'Open Follow-ups'},
  {k: 'returns', t: 'Credits that take themselves off', d: 'Write down a return once. Nifti takes it off their next bill for you.', b: 'Open Returns'}
];
function nf26Week(){ const d = new Date(); const j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() * 100 + Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7); }
function nf26TipPick(){
  let hide = ''; try{ hide = localStorage.getItem('nifti-tip-hide') || ''; }catch(e){}
  if(hide === String(nf26Week())) return null;
  const seen = nf26Seen(); const ok = NF26_TIPS.filter(x => !seen[x.k] && nf26FindOk({p: x.k}));
  if(!ok.length) return null;
  return ok[nf26Week() % ok.length];
}
function nf26Tip(){
  const rows = document.querySelector('#mhHome .rows'); if(!rows) return;
  const old = document.getElementById('nf26Tip'); const tip = nf26TipPick();
  if(!tip){ if(old) old.remove(); return; }
  if(old && old.dataset.k === tip.k && old.parentElement === rows) return;
  const c = old || document.createElement('section'); c.id = 'nf26Tip'; c.className = 'nf26-tip'; c.dataset.k = tip.k;
  c.innerHTML = `<span class="nf26-tip-k">TIP OF THE WEEK</span><div class="nf26-tip-t"><b>${escapeHtml(tip.t)}</b><span>${escapeHtml(tip.d)}</span></div>
    <div class="nf26-tip-b"><button type="button" class="btn btn-primary" onclick="nf26Go('${tip.k}')">${escapeHtml(tip.b)}</button><button type="button" class="nf26-link" onclick="try{localStorage.setItem('nifti-tip-hide','${nf26Week()}')}catch(e){} document.getElementById('nf26Tip').remove()">Not now</button></div>`;
  const ac = document.getElementById('nf22AlertCard'), st = document.getElementById('nf26Start');
  const at = (st && st.parentElement === rows) ? st.nextSibling : (ac && ac.parentElement === rows) ? ac.nextSibling : rows.firstChild;
  if(c.parentElement !== rows) rows.insertBefore(c, at);
}

/* ---------- 4. Empty pages point the way ---------- */
// A page with nothing in it yet says what it's for and has one button to start.
const nf26Click = sel => () => { const b = document.querySelector(sel); if(b){ b.scrollIntoView({block: 'center'}); if(b.tagName === 'DETAILS') b.open = true; else b.click(); return true; } return false; };
const NF26_EMPTY = {
  cheques: {t: 'Checks you receive, and when to deposit them', d: 'When a customer pays a bill by check, write it here. Nifti reminds you on the day to deposit it and warns you before it goes stale.', b: '+ Record a check',
    go: () => { if(!nf26Click('#page-cheques details')()) go('collections'); }, empty: () => { try{ return !collectCheques('supplier').length && !collectCheques('buyer').length; }catch(e){ return false; } }},
  payroll: {t: 'Pay your staff without a calculator', d: 'Add your people once with their daily or monthly rate. Each payday Nifti adds the days, takes off vale and makes the payslips.', b: 'Start a payroll',
    go: () => { if(!nf26Click('#page-payroll .page-head .btn-primary, #page-payroll .btn-primary')()) go('team'); }, empty: () => { try{ return PR.loaded && !(PR.runs || []).length; }catch(e){ return false; } }},
  routes: {t: "Your driver's list for the day", d: "Pick today's deliveries and send the stop list to your driver by Viber. They mark each stop delivered and what they collected.", b: "Plan today's deliveries",
    go: () => { try{ newRouteDraft(); }catch(e){ nf26Click('#page-routes .btn-primary')(); } }, empty: () => { try{ return Array.isArray(routesCache) && !routesCache.length; }catch(e){ return false; } }},
  team: {t: 'Your people, each with their own login', d: 'Add your cashier, driver or helper. Each one only sees the pages you pick.', b: '+ Add a person',
    go: () => { try{ openAddTeamMemberForm(); }catch(e){ nf26Click('#page-team .page-head .btn-primary')(); } }, empty: () => { try{ return getActiveTeamMembers().length <= 1; }catch(e){ return false; } }},
  expenses: {t: 'Every peso that goes out', d: 'Snap the receipt and type the amount. Nifti files it under rent, gas or supplies and keeps your profit right.', b: '+ Add an expense',
    go: () => { try{ openExpenseForm(); }catch(e){} }, empty: () => { try{ return BK.loaded && !(BK.expenses || []).length; }catch(e){ return false; } }},
  sales: {t: 'Sales in your shop', d: 'Tap what was sold and how they paid: cash, GCash or utang. Stock comes out by itself.', b: '+ Record a sale',
    go: () => { try{ openQuickSale(); }catch(e){} }, empty: () => { try{ return BK.loaded && !(BK.sales || []).length; }catch(e){ return false; } }},
  inventory: {t: 'Your stock, always counted', d: 'Bring in your items with a photo of your price list, an Excel file, or the starter list for your kind of shop.', b: 'Bring in my items',
    go: () => nf26OpenStart('items'), empty: () => { try{ return !(inventoryData || []).length; }catch(e){ return false; } }},
  orders: {t: 'Orders, both ways, in one list', d: "Send your first order to a supplier, or add a customer's order. They don't need the app; they get a link.", b: '+ New order',
    go: () => { try{ nfoNew(true); }catch(e){} }, empty: () => { try{ return !(purchaseOrders || []).length; }catch(e){ return false; } }},
  collections: {t: 'Who owes you, and reminders that go out by themselves', d: 'Bring in what customers already owe you (from your notebook) and Nifti reminds them politely on schedule.', b: 'Bring in utang',
    go: () => nf26OpenStart('utang'), empty: () => { try{ return !(buyersData || []).length && (typeof colTab === 'undefined' || colTab !== 'cash'); }catch(e){ return false; } }}
};
function nf26Empty(page){
  if(!page) return; const pid = page.id.replace(/^page-/, ''), cfg = NF26_EMPTY[pid];
  const old = page.querySelector(':scope > .nf26-empty');
  let isEmpty = false; try{ isEmpty = !!(cfg && myBusiness && cfg.empty()); }catch(e){}
  if(!isEmpty){ if(old) old.remove(); return; }
  if(old) return;
  const c = document.createElement('section'); c.className = 'nf26-empty';
  c.innerHTML = `<span class="nf26-empty-ic" aria-hidden="true">${NF26_STAR_IC}</span><div><b>${escapeHtml(cfg.t)}</b><p>${escapeHtml(cfg.d)}</p><button type="button" class="btn btn-primary">${escapeHtml(cfg.b)}</button></div>`;
  c.querySelector('button').onclick = () => { try{ cfg.go(); }catch(e){ console.warn(e); } };
  const head = page.querySelector(':scope > .page-head');
  page.insertBefore(c, head ? head.nextSibling : page.firstChild);
}

/* ---------- wiring ---------- */
(function(){
  const nm = window.nf20Menu;
  if(typeof nm === 'function' && !nm._nf26){ const w = function(){ const r = nm.apply(this, arguments); try{ nf26MenuPost(); }catch(e){ console.warn('nf26 menu', e); } return r; };
    w._nf26 = true; window.nf20Menu = w; try{ nf20Menu = w; }catch(e){} }
  const mr = window.nf20MenuRoles;
  if(typeof mr === 'function' && !mr._nf26){ const w = function(){ const r = mr.apply(this, arguments); try{ nf26MenuPost(); }catch(e){} return r; }; Object.keys(mr).forEach(k => { w[k] = mr[k]; }); w._nf26 = true; window.nf20MenuRoles = w; try{ nf20MenuRoles = w; }catch(e){} }
  const na = window.nf20Active;
  if(typeof na === 'function' && !na._nf26){ const w = function(page){ const r = na.apply(this, arguments);
      try{ const bank = document.getElementById('nf26BankNav'), gp = [...document.querySelectorAll('.sidebar .nav-item[data-page="collections"]')].filter(x => x !== bank);
        const cash = page === 'collections' && typeof colTab !== 'undefined' && colTab === 'cash';
        if(bank) bank.classList.toggle('active', cash); gp.forEach(x => { if(cash) x.classList.remove('active'); });
        const it = document.querySelector('.sidebar .nf20-g.folded .nav-item.active'); if(it){ const g = it.closest('.nf20-g'); if(g) nf20Fold(g.dataset.g, true); } }catch(e){}
      return r; };
    w._nf26 = true; window.nf20Active = w; try{ nf20Active = w; }catch(e){} }
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf26){ const w = function(page){ const out = nav.apply(this, arguments);
      try{ nf26MarkSeen(page); if(page === 'collections' && typeof colTab !== 'undefined' && colTab === 'cash') nf26MarkSeen('bank'); }catch(e){}
      try{ nf26MenuPost(); }catch(e){}
      return out; };
    Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf26 = true; window.navigate = w; try{ navigate = w; }catch(e){} }
  [['nf22NbOpen', '@notebook'], ['nf21OpenAlerts', '@alerts']].forEach(([fn, k]) => { const f = window[fn]; if(typeof f === 'function' && !f._nf26s){ const w = function(){ nf26MarkSeen(k); return f.apply(this, arguments); }; Object.keys(f).forEach(x => { w[x] = f[x]; }); w._nf26s = true; window[fn] = w; } });
  const gi = document.getElementById('globalSearchInput'); if(gi) gi.placeholder = 'Search, or type "utang", "sahod"…';
  const start = () => { try{ nf26MenuPost(); }catch(e){} };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 600)); else setTimeout(start, 600);
})();
function nf26AfterPass(page){
  try{ if(page && page.id === 'page-dashboard') nf26Tip(); }catch(e){ console.warn('nf26 tip', e); }
  try{ nf26Empty(page); }catch(e){ console.warn('nf26 empty', e); }
  try{ if(typeof nf26PagesPass === 'function') nf26PagesPass(page); }catch(e){ console.warn('nf26 pages', e); }
  try{ if(typeof nf26StartPass === 'function') nf26StartPass(page); }catch(e){ console.warn('nf26 start', e); }
}
