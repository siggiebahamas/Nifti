/* ===== Round 22: alerts you can find, one profit number everywhere, page help, welcome back, and a calm pass over every page ===== */

/* ---------- 1. Alerts on your phone: always in view ---------- */
// The menu is taller than most laptop screens, so the two owner links sat below the fold. They now sit pinned
// at the bottom of the menu, and Home, the bell and Settings each point to the alerts too.
function nf22Foot(){
  const who = document.getElementById('nf20WhoLink'); if(!who) return;
  const al = document.getElementById('nf21AlertLink');
  let f = document.getElementById('nf22Foot');
  if(!f){ f = document.createElement('div'); f.id = 'nf22Foot'; f.className = 'nf22-foot'; }
  const box = who.parentElement === f ? f.parentElement : who.parentElement; if(!box) return;
  if(f.parentElement !== box || box.lastElementChild !== f) box.appendChild(f);
  if(al && al.parentElement !== f) f.insertBefore(al, f.firstChild);
  if(who.parentElement !== f) f.appendChild(who);
  if(al){ al.hidden = who.hidden; if(!al.querySelector('.nf22-new')) al.insertAdjacentHTML('beforeend', '<em class="nf22-new">New</em>'); }
  f.hidden = who.hidden && (!al || al.hidden);
}
function nf22AlertsDone(){ try{ return localStorage.getItem('nifti-alerts-setup') === '1'; }catch(e){ return false; } }
function nf22AlertsMark(){ try{ localStorage.setItem('nifti-alerts-setup', '1'); }catch(e){} }
function nf22HomeAlertCard(){
  const rows = document.querySelector('#mhHome .rows'); if(!rows) return;
  const old = document.getElementById('nf22AlertCard');
  let hide = false; try{ hide = localStorage.getItem('nifti-alerts-card-hide') === '1'; }catch(e){}
  if(hide || nf22AlertsDone() || (typeof nf20IsOwner === 'function' && !nf20IsOwner())){ if(old) old.remove(); return; }
  if(old && old.parentElement === rows) return;
  const c = document.createElement('section'); c.id = 'nf22AlertCard'; c.className = 'nf22-alert-card';
  c.innerHTML = `<span class="nf22-ac-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg></span>
    <div class="nf22-ac-t"><b>Get Telegram alerts on your phone</b><span>New orders, payments and low stock come to Telegram. It's free. You can practice first.</span></div>
    <div class="nf22-ac-b"><button type="button" class="btn btn-primary" onclick="nf21OpenAlerts()">Set it up</button><button type="button" class="nf22-link" onclick="try{localStorage.setItem('nifti-alerts-card-hide','1')}catch(e){} this.closest('.nf22-alert-card').remove()">Not now</button></div>`;
  rows.insertBefore(c, rows.firstChild);
}

/* ---------- 2. One profit number everywhere ---------- */
// Home and Money overview used to show a number from before all the records had loaded, then Books showed the
// finished one. Now the books load once at the start and every page reads the same finished number.
function nf22DemoFix(){
  if(typeof myBusiness !== 'undefined' && myBusiness) return false;
  if(!BK || !Array.isArray(BK.expenses)) return false;
  BK.settings = BK.settings || {};
  if(BK.settings.nf22) return false;
  const m = bkMonth(APP_TODAY);
  // the sample salaries were in Expenses and in Payroll, so they counted twice (Payroll itself warns about this)
  BK.expenses = BK.expenses.filter(e => !(e.category === 'Salaries' && bkMonth(e.date) === m && Number(e.amount) === 7000 && /^(Rico|Liza)$/.test(e.staff || '')));
  // a smaller shop's rent, so the sample month ends in a small profit like most real months
  BK.expenses.forEach(e => { if(e.category === 'Rent' && Number(e.amount) === 18000 && /Bldg/.test(e.vendor || '')) e.amount = 12000; });
  BK.settings.nf22 = 1;
  try{ bkSaveDemo(); }catch(e){} try{ lgInvalidate(); }catch(e){}
  return true;
}
// the months before you started on Nifti: the demo shop typed its old monthly totals in from the notebook
const NF22_PAST = {5: [238400, 12850], 4: [251300, 15200], 3: [244100, -28600], 2: [229800, 9400], 1: [247600, 14100]};
function nf22Month(r, p, k){
  const demo = !(typeof myBusiness !== 'undefined' && myBusiness);
  if(demo && NF22_PAST[k]) return {sales: NF22_PAST[k][0], profit: NF22_PAST[k][1], paper: true};
  const sales = Number(p && p.revenue) || 0;
  return {sales, profit: Number(p && p.net) || 0, pre: !sales && k > 0};
}
function nf22Boot(){
  const run = async () => {
    try{ if(typeof bkLoad === 'function') await bkLoad(); if(nf22DemoFix()){ /* fixed the sample once */ } if(typeof lgLoad === 'function') await lgLoad(); }catch(e){ console.warn('nf22 books', e); }
    try{ if(document.querySelector('#page-dashboard.active') && typeof renderMistHome === 'function') renderMistHome(); }catch(e){}
  };
  setTimeout(run, 300);
}

/* ---------- 3. "What's this page?" on every page ---------- */
const NF22_HELP = {
  dashboard: ['Home is your morning check.', ['Red: do these today.', 'Yellow: this week.', 'Green: all fine, nothing to do.'], 'Tap any button on a card. It takes you to the exact thing.'],
  orders: ['Every order, customers on the left, suppliers on the right.', ['Start with "Needs you now" at the top.', 'Tap the green button on an order to do the next step.', 'Tap "+ New order" to write one.'], 'Nothing is sent until you tap Send.'],
  messages: ['All your chats with customers, suppliers and your team.', ['Tap a name on the left to open the chat.', 'The little tag under a chat shows which order it is about.', 'Tap "Take a photo" to send proof.'], ''],
  inventory: ['What you have, what is running out, and what is on the way.', ['Red rows: order more today.', 'Tap "Spot count" to count one shelf.', 'Tap "Edit" to change a number.'], 'Every change is saved with who made it.'],
  money: ['Your profit this month, and who owes who.', ['Read "Profit" at the bottom of the left box.', 'Yellow box: money customers still owe you.', 'Change the month at the top.'], 'You can print or download it for your accountant.'],
  sales: ['Walk-in sales and the cash drawer.', ['Tap "+ New sale" for each sale.', 'At closing, type the cash you counted.', 'Nifti tells you if the drawer is short.'], ''],
  expenses: ['Bills and spending: rent, power, gas, repairs.', ['Tap "+ Add expense" and snap the receipt.', 'Approve what your staff sent.', 'Red notes mean a bill is higher than usual.'], ''],
  collections: ['Who owes you, and what you owe suppliers.', ['Left: customers. Tap Remind to send a polite message.', 'Right: your bills. Tap Pay when you pay one.'], 'Reminders can go out by themselves. You can turn them off.'],
  profit: ['What each item costs, what you sell it for, and what you keep.', ['Tap a number to change it.', 'Red notes: sold below cost.', 'Send new prices to your buyers at the bottom.'], ''],
  issues: ['Things that don\'t add up, with the proof.', ['Read "What happened" and "Next step".', 'Tap Fixed when it is done, or "It\'s fine" if there was a good reason.'], 'These are checks, not accusations.'],
  payroll: ['Pay your staff and take back their vale.', ['Tap "+ New payroll" each payday.', 'Print a payslip for each person.'], ''],
  ledger: ['Your books, made from what you already record.', ['Profit & loss: did you make money this month?', 'Tap any line to see the records behind it.'], 'Your accountant can see this too, if you let them.'],
  followups: ['People to call or message, with the message ready.', ['Tap Nudge to send the reminder.', 'Turn on "every morning" and Nifti nudges for you.'], ''],
  routes: ['Today\'s delivery list for your driver.', ['Pick the stops, send the list to the driver.', 'Each stop turns green when it is done.'], 'Optional. Orders work the same without it.'],
  returns: ['Money off for bad or returned items.', ['Give a credit: it comes off their next bill by itself.', 'Got a credit from a supplier? Snap their slip and add it.'], 'You never have to do the math.'],
  store: ['Sell online without being an online seller.', ['"Post today" is ready: copy, save the picture, post.', 'Plan your week once and Nifti reminds you.', 'Ready replies for "HM?" and "Available pa?"'], 'Nothing is posted unless you tap it.'],
  discover: ['Businesses near you who may buy from you.', ['Tap a business to see why it is a good fit.', 'Send a hello with one tap.'], ''],
  cheques: ['Checks you received and checks you wrote.', ['Add a check with its date.', 'Nifti reminds you the day before it can be deposited.'], ''],
  books: ['The sales and purchase books BIR asks for.', ['They fill in by themselves from your orders and sales.', 'Print or download when you file.'], ''],
  taxforms: ['BIR 2307 forms from customers who withheld tax.', ['Add each 2307 you get.', 'Nifti adds them up for your quarterly filing.'], ''],
  team: ['Your people, their tasks, and who sees what.', ['Add a task for someone.', 'Tap "Who sees what" to choose their pages.'], ''],
  settings: ['Your business details and how Nifti works for you.', ['Type in the search box to find any setting.', 'Tap a section to open it.'], ''],
};
const NF22_COLORS = `<div class="nf22-hk"><b>Colors in Nifti</b><span><i class="r"></i>Red: do it now</span><span><i class="y"></i>Yellow: coming up</span><span><i class="g"></i>Green: done or fine</span><span><i class="c"></i>Blue side: selling to customers</span><span><i class="s"></i>Emerald side: buying from suppliers</span></div>`;
function nf22HelpBtn(){
  const pg = document.querySelector('#view-app .app-page.active'); if(!pg) return;
  const key = pg.id.replace(/^page-/, ''); if(!NF22_HELP[key]) return;
  const h = pg.querySelector('.page-head h1') || pg.querySelector('.hero.page-head h3') || pg.querySelector('h1'); if(!h || h.parentElement.querySelector(':scope > .nf22-help') || h.querySelector('.nf22-help')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'nf22-help'; b.setAttribute('aria-label', 'What is this page?');
  b.innerHTML = '<span aria-hidden="true">?</span><em>What\'s this page?</em>';
  b.onclick = () => nf22OpenHelp(key);
  h.insertAdjacentElement('afterend', b);
}
function nf22OpenHelp(key){
  const d = NF22_HELP[key]; if(!d) return;
  let ov = document.getElementById('nf22Help');
  if(!ov){ ov = document.createElement('div'); ov.id = 'nf22Help'; ov.className = 'nf22-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.addEventListener('click', e => { if(e.target === ov) ov.hidden = true; }); document.body.appendChild(ov); }
  ov.innerHTML = `<div class="nf22-sheet nf22-help-sh"><button class="nf22-x" type="button" aria-label="Close" onclick="document.getElementById('nf22Help').hidden=true">✕</button>
    <p class="nf22-k">What's this page?</p><h2>${escapeHtml(d[0])}</h2>
    <ol class="nf22-steps">${d[1].map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
    ${d[2] ? `<p class="nf22-calm">${escapeHtml(d[2])}</p>` : ''}${NF22_COLORS}
    <button class="btn btn-primary nf22-wide" type="button" onclick="document.getElementById('nf22Help').hidden=true">Got it</button></div>`;
  ov.hidden = false; const ok = ov.querySelector('.btn'); if(ok) ok.focus();
}

/* ---------- 4. Welcome back, for anyone who hasn't opened Nifti in a while ---------- */
const NF22_SEEN = 'nifti-last-seen';
function nf22WelcomeBack(){
  const rows = document.querySelector('#mhHome .rows'); if(!rows || document.getElementById('nf22Back')) return;
  let last = 0; try{ last = Number(localStorage.getItem(NF22_SEEN) || 0); }catch(e){}
  const days = last ? Math.floor((Date.now() - last) / 864e5) : 0;
  if(days < 4) return;
  let late = 0, owed = 0;
  try{ late = getSupplierPOs().filter(o => ['delivered', 'invoiced'].includes(o.status)).length + getBuyerPOs().filter(o => ['shipped', 'invoiced'].includes(o.status)).length; owed = hmSum(unpaidInvoicesFor('supplier'), r => r.balance); }catch(e){}
  const c = document.createElement('section'); c.id = 'nf22Back'; c.className = 'nf22-back';
  c.innerHTML = `<div><b>Welcome back! It's been ${days} days.</b><span>Nothing was lost. ${late ? late + ' order' + (late > 1 ? 's are' : ' is') + ' waiting on a step' : 'No order is stuck'}${owed ? ', and customers owe you ' + bkPeso(owed) : ''}. Start with the red cards below.</span></div>
    <button type="button" class="btn btn-outline" onclick="this.closest('.nf22-back').remove()">OK</button>`;
  rows.insertBefore(c, rows.firstChild);
}
function nf22Seen(){ try{ localStorage.setItem(NF22_SEEN, String(Date.now())); }catch(e){} }

/* ---------- 5. Calm pass: plain words, no strikethrough, quiet zeros, short notes folded away ---------- */
function nf22Words(root){
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); const fix = [];
  while(w.nextNode()){ const n = w.currentNode, v = n.nodeValue; if(!v || v.length > 400) continue;
    if(/(\b\d+d\b)|~\d|(\d)\.0 days/.test(v) && !n.parentElement.closest('input,textarea,script,style,svg,code,.nf22-keep')) fix.push(n); }
  fix.forEach(n => { n.nodeValue = n.nodeValue
    .replace(/\b1d\b/g, '1 day').replace(/\b(\d+)d\b/g, '$1 days')
    .replace(/~\s?(\d+)\.0 days/g, 'about $1 days').replace(/~\s?(\d+(?:\.\d)?) days/g, 'about $1 days').replace(/(\d)\.0 days/g, '$1 days'); });
}
function nf22Zeros(root){
  root.querySelectorAll(':is(.sl-tile,.bk-tile,.nf-tile) > :is(b,strong,.v,.val)').forEach(v => {
    const z = /^(₱\s?0|0)$/.test(v.textContent.trim()); const t = v.parentElement; if(t.classList.contains('nf22-zero') !== z) t.classList.toggle('nf22-zero', z); });
}
function nf22Fold(root){
  // long "how it works" notes: one line, then "How does this work?" opens the rest
  root.querySelectorAll('.bk-note, .sl-help').forEach(n => {
    if(n.dataset.nf22 || n.closest('.nf22-fold') || n.textContent.trim().length < 150) return;
    n.dataset.nf22 = '1';
    const d = document.createElement('details'); d.className = 'nf22-fold';
    d.innerHTML = '<summary>How does this work?</summary>';
    n.parentElement.insertBefore(d, n); d.appendChild(n);
  });
}
function nf22Page(){
  const pg = document.querySelector('#view-app .app-page.active'); if(!pg) return;
  try{ nf22Words(pg); nf22Zeros(pg); nf22Fold(pg); nf22HelpBtn(); }catch(e){ console.warn('nf22 page', e); }
  if(pg.id === 'page-inventory'){ const h = pg.querySelector('.page-head h1'), p = pg.querySelector('.page-head p');
    if(h && h.firstChild && h.firstChild.nodeType === 3 && h.firstChild.nodeValue.trim() === 'Inventory') h.firstChild.nodeValue = 'Stock';
    if(p && /auto-calculated/.test(p.textContent)) p.textContent = 'What you have, what is running out, and what is on the way.'; }
  if(pg.id === 'page-dashboard'){ nf22HomeAlertCard(); nf22WelcomeBack(); }
}
let nf22T = 0;
function nf22Soon(){ clearTimeout(nf22T); nf22T = setTimeout(nf22Page, 120); }

/* ---------- 6. wiring ---------- */
(function(){
  // the menu foot, after the menu builds
  const mr = window.nf20MenuRoles;
  if(typeof mr === 'function' && !mr._nf22){ const w = function(){ const r = mr.apply(this, arguments); try{ nf22Foot(); }catch(e){} return r; }; Object.keys(mr).forEach(k => { w[k] = mr[k]; }); w._nf22 = true; window.nf20MenuRoles = w; try{ nf20MenuRoles = w; }catch(e){} }
  // every page: help button, plain words, quiet zeros
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf22){ const w = function(page){ const out = nav.apply(this, arguments); try{ nf22Foot(); nf22Soon(); }catch(e){} return out; };
    Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf22 = true; window.navigate = w; try{ navigate = w; }catch(e){} }
  // opening the alerts counts as setting them up once the person taps the Telegram button
  const oa = window.nf21OpenAlerts;
  if(typeof oa === 'function' && !oa._nf22){ const w = function(){ const r = oa.apply(this, arguments);
      setTimeout(() => { const ov = document.getElementById('nf21Alerts'); if(ov && !ov.dataset.nf22){ ov.dataset.nf22 = '1'; ov.addEventListener('click', e => { const b = e.target.closest('a,button'); if(b && /Open Telegram|Connect|START/i.test(b.textContent)){ nf22AlertsMark(); const c = document.getElementById('nf22AlertCard'); if(c) c.remove(); } }); } }, 0);
      return r; }; w._nf22 = true; window.nf21OpenAlerts = w; try{ nf21OpenAlerts = w; }catch(e){} }
  // the bell: a way to get these on your phone
  const rn = window.renderNotifications;
  if(typeof rn === 'function' && !rn._nf22){ const w = function(){ const r = rn.apply(this, arguments); try{ const dd = document.getElementById('notifDropdown');
        if(dd && !dd.querySelector('.nf22-bell')){ const d = document.createElement('div'); d.className = 'nf22-bell'; d.innerHTML = '<span>Get these on your phone</span><b>Set up →</b>'; d.onclick = ev => { ev.stopPropagation(); dd.classList.add('hidden'); nf21OpenAlerts(); }; dd.appendChild(d); } }catch(e){} return r; };
    w._nf22 = true; window.renderNotifications = w; try{ renderNotifications = w; }catch(e){} }
  // Home: the setup list says how to get phone alerts too
  const ss = window.setupSteps;
  if(typeof ss === 'function' && !ss._nf22){ const w = function(){ const out = ss.apply(this, arguments) || []; try{ if(!out.some(s => /alerts on your phone/i.test(s.label))) out.splice(2, 0, {label: 'Get alerts on your phone (Telegram, free)', done: nf22AlertsDone(), go: 'nf21OpenAlerts()'}); }catch(e){} return out; };
    w._nf22 = true; window.setupSteps = w; try{ setupSteps = w; }catch(e){} }
  // Settings: a card at the top
  const addSettings = () => { const pg = document.getElementById('page-settings'); if(!pg || document.getElementById('nf22SetAlerts')) return; const ss2 = pg.querySelector('.nf18-ss'); if(!ss2) return;
    const c = document.createElement('button'); c.type = 'button'; c.id = 'nf22SetAlerts'; c.className = 'nf22-set-alerts';
    c.innerHTML = '<span class="nf22-ac-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg></span><span><b>Telegram alerts on your phone</b><small>Free. New orders, payments and low stock, with buttons.</small></span><i aria-hidden="true">›</i>';
    c.onclick = () => nf21OpenAlerts(); ss2.insertAdjacentElement('afterend', c); };
  // watch the app for re-renders, so the calm pass follows each page
  const start = () => { try{ nf22Foot(); addSettings(); nf22Page(); }catch(e){}
    const app = document.getElementById('view-app'); if(app && !app.dataset.nf22){ app.dataset.nf22 = '1'; new MutationObserver(() => { nf22Soon(); addSettings(); }).observe(app, {childList: true, subtree: true}); }
    if(!document.getElementById('nf20WhoLink')) setTimeout(start, 400); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  nf22Boot();
  setTimeout(nf22Seen, 15000); window.addEventListener('pagehide', nf22Seen);
  document.addEventListener('keydown', e => { if(e.key === 'Escape'){ const h = document.getElementById('nf22Help'); if(h && !h.hidden) h.hidden = true; } });
})();
