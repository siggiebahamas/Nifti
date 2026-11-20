/* ===== Round 53: one-minute page guides ("pre-ride videos") + clear Viber notice ===== */
const NF53_OFF = 'nifti-guides-off', NF53_SEEN = 'nifti-guides-seen';
function nf53S(k, v){ try{ if(v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); }catch(e){ return null; } }
// each step: e = big icon, h = headline, p = one plain sentence, ui = what it looks like (mini screen rows)
const NF53 = {
  dashboard: {t: 'Home', c: '#1B6B40', s: [
    {e: '☀️', h: 'Your day on one screen', p: 'Open Nifti in the morning. Home shows only what needs you today.', ui: ['<b>3</b> orders to confirm', '<b>₱18,200</b> to collect today', '<b>2</b> items running low']},
    {e: '👆', h: 'Tap a box to act', p: 'Every number opens the list behind it, so you can finish the job right there.', ui: ['Orders to confirm → <u>Open</u>', 'Who owes you → <u>Remind</u>']},
    {e: '📦', h: 'Know what runs out', p: 'Nifti watches your stock and tells you what to reorder before you run out.', ui: ['Cement 40kg · <i class=r>4 days left</i>', 'Rebar 12mm · <i class=y>9 days left</i>']},
    {e: '✅', h: 'All green = done for the day', p: 'When every box is clear, you are on top of everything. Go home.', ui: ['<i class=g>All good</i> nothing needs you']}]},
  orders: {t: 'Orders', c: '#1D4ED8', s: [
    {e: '💬', h: 'Orders come in any way', p: 'Paste a Viber message, upload their PO, or type it. Nifti lays it out as an order.', ui: ['“10 sako semento tsaka 5 wire”', '⬇', 'Cement 40kg × 10 · Wire 12ga × 5']},
    {e: '✏️', h: 'You always check before saving', p: 'Nifti fills in what it is sure of. Anything unsure is marked for you to pick. Tap a line to fix it.', ui: ['Cement 40kg × 10 <i class=g>✓</i>', 'Paint × 3 <i class=y>Pick item</i>']},
    {e: '🔗', h: 'They confirm with one tap', p: 'Send the order link on Viber. Your customer taps Confirm. No app, no sign-up for them.', ui: ['Order 0855 · ₱6,530', '<u>Tap to confirm →</u>']},
    {e: '🧭', h: 'Follow it to paid', p: 'Each order moves: To confirm → Preparing → Delivered → Paid. Customers left, suppliers right.', ui: ['To confirm · Preparing · Delivered · <b>Paid</b>']}]},
  messages: {t: 'Messages', c: '#7C3AED', s: [
    {e: '📱', h: 'Viber messages need the Nifti Android app', p: 'Nifti reads Viber only through the free Nifti app on YOUR Android phone, with Viber installed and logged in on that phone.', ui: ['Android + Nifti app → <i class=g>automatic</i>', 'iPhone → <i class=y>share or copy</i>', 'Computer only → <i class=y>copy and paste</i>']},
    {e: '🔌', h: 'Keep that phone on and online', p: 'If the phone is off or has no signal, messages wait and arrive once it is back. Only messages after setup come in.', ui: ['Phone on · Viber logged in · internet ✓']},
    {e: '🗂️', h: 'Every chat in one place', p: 'Customers, suppliers and your team in folders, with the order beside each chat.', ui: ['Customers · Suppliers · Team', 'Bayview: “Boss, 10 sako…” → <u>Make order</u>']},
    {e: '↩️', h: 'Reply from Nifti', p: 'Type your reply here and it goes out through Viber on your phone, from your own number.', ui: ['You: “Noted po, deliver bukas” ✓']}]},
  collections: {t: 'Who owes you', c: '#B91C1C', s: [
    {e: '💰', h: 'Every unpaid bill in one list', p: 'See who owes you, how much, and how late. Oldest first.', ui: ['Riverside · ₱63,400 · <i class=r>12 days late</i>', 'Bayview · ₱14,800 · promised Fri']},
    {e: '🔔', h: 'Remind in one tap', p: 'Send a polite reminder by Viber, SMS, Messenger, WhatsApp or email. Or let Nifti send them on time.', ui: ['<u>Remind</u> · <u>Send statement</u>']},
    {e: '🧾', h: 'They mark it paid, you confirm', p: 'Customers tap “I paid” on their link with a GCash or bank photo. You check and confirm.', ui: ['Corazon paid ₱6,000 · <u>Confirm</u>']},
    {e: '📈', h: 'Watch the number go down', p: 'The total at the top is money still out. Your goal: make it small.', ui: ['Owed to you <b>₱84,200</b>']}]},
  inventory: {t: 'Stock', c: '#0F766E', s: [
    {e: '📦', h: 'Your items and how many you have', p: 'Add items once (Excel, photo or typing). Sales and deliveries update the count by themselves.', ui: ['Cement 40kg · 120 bags', 'Rebar 12mm · 340 pcs']},
    {e: '⏳', h: 'Days left, not just counts', p: 'Nifti uses how fast each item sells to tell you how many days it will last.', ui: ['Wire 12ga · <i class=r>3 days left</i>']},
    {e: '🛒', h: 'Reorder in one tap', p: 'Tap Reorder and Nifti makes the supplier order for you to check and send.', ui: ['<u>Reorder 50 bags from Metro Steel</u>']},
    {e: '🔍', h: 'Count once in a while', p: 'Do a quick stock count. Differences are shown so missing stock never hides.', ui: ['Counted 118 · expected 120 · <i class=y>2 short</i>']}]},
  routes: {t: 'Deliveries', c: '#CA8A04', s: [
    {e: '🗺️', h: 'Today’s run, stop by stop', p: 'Pick the orders going out today. Nifti lists the stops for your driver.', ui: ['1 Cavite Steel · 2 Bayview · 3 Riverside']},
    {e: '📲', h: 'Send it to your driver', p: 'Your driver opens the list on their phone. No account needed for them either.', ui: ['Sent to Mark Santos on Viber ✓']},
    {e: '📸', h: 'Done with a photo', p: 'At each stop the driver taps Done or Couldn’t, and adds a photo as proof.', ui: ['Bayview · <i class=g>Done</i> · photo saved']},
    {e: '💵', h: 'Cash checked the same day', p: 'Cash the driver collected is matched against what was due. Short? You see it today.', ui: ['Collected ₱18,200 of ₱18,200 ✓']}]},
  store: {t: 'Online store', c: '#DB2777', s: [
    {e: '🏪', h: 'Your own store link', p: 'Your items, photos and prices on one page. Share the link anywhere.', ui: ['nifti.ph/delacruz-hardware']},
    {e: '📣', h: 'Post to Facebook in one tap', p: 'Nifti writes the post and makes a Monday price list picture for you.', ui: ['<u>Post today</u> · <u>Price list picture</u>']},
    {e: '🛍️', h: 'Buyers order and pay', p: 'GCash, Maya or cash on delivery. Delivery fee set by barangay.', ui: ['New store order · GCash · ₱5,290']},
    {e: '🔁', h: 'Orders land in Orders', p: 'Store orders show up with your other orders. Nothing to retype.', ui: ['Orders → <b>Store</b> · 2 new']}]},
  money: {t: 'Money', c: '#1B6B40', s: [
    {e: '📊', h: 'Your money at a glance', p: 'Cash, bank, what is coming in and what is going out, in plain words.', ui: ['Coming in <b>₱84,200</b>', 'Going out <b>₱41,600</b>']},
    {e: '📅', h: 'What is coming up', p: 'Bills to pay and payments to collect, by date, so nothing surprises you.', ui: ['Fri · Pay Metro Steel ₱22,000']},
    {e: '🧮', h: 'Profit that is real', p: 'Sales minus costs and expenses, worked out for you every day.', ui: ['Profit this month <b>₱38,400</b>']},
    {e: '📁', h: 'Ready for your accountant', p: 'Books, tax forms and summaries are kept as you go. Export any time.', ui: ['<u>Monthly summary</u> · <u>Export</u>']}]},
  expenses: {t: 'Expenses', c: '#B45309', s: [
    {e: '🧾', h: 'Snap the receipt', p: 'Add an expense with a photo of the receipt. Takes a few seconds.', ui: ['Diesel · ₱2,500 · photo ✓']},
    {e: '⚡', h: 'Same as before', p: 'Regular bills (rent, power, diesel) are one tap with last time’s details.', ui: ['<u>Same as last month</u>']},
    {e: '🚩', h: 'Odd bills are flagged', p: 'If a bill is much higher than usual, Nifti points it out.', ui: ['Electric bill · <i class=y>32% higher than usual</i>']},
    {e: '👥', h: 'Staff spending limits', p: 'Set limits per person. You are told at 80% and when someone pays above the agreed price.', ui: ['Ana · ₱49,200 of ₱60,000']}]},
  team: {t: 'Team', c: '#4338CA', s: [
    {e: '👥', h: 'Add your people', p: 'Invite staff and choose what each person can see. Cashiers do not see profit.', ui: ['Ana · Buyer · Mark · Driver']},
    {e: '📋', h: 'Tasks on one board', p: 'To do → Doing → Done. Drag a card when it moves.', ui: ['To do 3 · Doing 2 · Done 8']},
    {e: '🕘', h: 'See what happened', p: 'Every change is logged with who did it and when.', ui: ['Ana confirmed Order 0855 · 9:14']},
    {e: '🔒', h: 'Your data stays yours', p: 'Each business only ever sees its own records.', ui: ['Only Dela Cruz Hardware can see this']}]},
  sales: {t: 'Sales', c: '#1D4ED8', s: [
    {e: '🛒', h: 'Walk-in sales in seconds', p: 'Tap best sellers, set how many, and choose how they paid.', ui: ['Cement × 2 · Nails × 1 · ₱1,240']},
    {e: '💵', h: 'Change worked out', p: 'Type what they gave. Nifti shows the change.', ui: ['Gave ₱1,500 · Change <b>₱260</b>']},
    {e: '📦', h: 'Stock goes down by itself', p: 'Every sale takes the items off your stock count.', ui: ['Cement 40kg · 118 left']},
    {e: '🧮', h: 'Cash count at closing', p: 'Count the drawer at the end of the day. Short or over is shown with a reason.', ui: ['Drawer ₱12,450 · expected ₱12,450 ✓']}]}
};
NF53.notebook = {t: 'Notebook reader', c: '#92400E', s: [
  {e: '📓', h: 'Your old notebook, in Nifti', p: 'Take photos of your utang or sales notebook pages.', ui: ['3 photos added']},
  {e: '🤖', h: 'AI reads the handwriting', p: 'Nifti turns each line into a record. Taglish and shortcuts are fine.', ui: ['11/3 Bayvw semento 10 · 2,280']},
  {e: '✅', h: 'You check every line', p: 'Nothing is saved until you tick it. Fix any line by tapping it.', ui: ['Bayview Construction · ₱2,280 <i class=g>✓</i>']},
  {e: '➕', h: 'Add to your books', p: 'Ticked lines go into Who owes you or your books.', ui: ['<u>Add 5 lines</u>']}]};
const NF53_ALIAS = {getpaid: 'collections', followups: 'collections', stock: 'inventory', deliveries: 'routes', home: 'dashboard'};

function nf53Page(){ const el = [...document.querySelectorAll('.main [id^="page-"]')].find(p => p.offsetParent !== null && !p.hidden && p.getBoundingClientRect().height > 40); if(!el) return null; const k = el.id.slice(5); return {el, k: NF53[k] ? k : NF53_ALIAS[k]}; }
function nf53Paint(){
  const off = nf53S(NF53_OFF), cur = nf53Page();
  document.querySelectorAll('.nf53-btn').forEach(b => { if(off || !cur || b.parentNode !== cur.el) b.remove(); });
  if(off || !cur || !cur.k || !NF53[cur.k]) return;
  if(cur.el.querySelector(':scope > .nf53-btn')) return;
  const seen = (nf53S(NF53_SEEN) || {})[cur.k];
  const b = document.createElement('button'); b.type = 'button'; b.className = 'nf53-btn' + (seen ? ' seen' : '');
  b.innerHTML = `<span class="nf53-play">▶</span><span class="nf53-bt">${seen ? 'Guide' : 'What this page does · 1 min'}</span>`;
  b.title = 'A one-minute guide to this page'; b.onclick = () => nf53Open(cur.k);
  cur.el.insertBefore(b, cur.el.firstChild);
}
const NF53G = {k: null, i: 0, t: null, paused: false, t0: 0, dur: 6500};
function nf53Open(k){
  if(!NF53[k]) return; NF53G.k = k; NF53G.i = 0;
  let ov = document.getElementById('nf53Ov');
  if(!ov){ ov = document.createElement('div'); ov.id = 'nf53Ov'; ov.className = 'nf53-ov'; ov.onclick = e => { if(e.target === ov) nf53Close(); }; document.body.appendChild(ov);
    document.addEventListener('keydown', e => { if(!document.getElementById('nf53Ov') || document.getElementById('nf53Ov').hidden) return; if(e.key === 'Escape') nf53Close(); if(e.key === 'ArrowRight') nf53Go(1); if(e.key === 'ArrowLeft') nf53Go(-1); }); }
  ov.hidden = false; nf53Draw(); document.body.classList.add('nf53-lock');
  const s = nf53S(NF53_SEEN) || {}; s[k] = 1; nf53S(NF53_SEEN, s);
}
function nf53Draw(){
  const g = NF53[NF53G.k], st = g.s[NF53G.i], last = NF53G.i === g.s.length - 1, ov = document.getElementById('nf53Ov');
  ov.style.setProperty('--g', g.c);
  ov.innerHTML = `<div class="nf53-card" role="dialog" aria-label="${g.t} guide">
    <div class="nf53-bars">${g.s.map((x, j) => `<i class="${j < NF53G.i ? 'done' : j === NF53G.i ? 'now' : ''}"><u></u></i>`).join('')}</div>
    <div class="nf53-top"><span>${g.t} · 1-minute guide</span><button class="nf53-x" onclick="nf53Close()" aria-label="Close">×</button></div>
    <div class="nf53-stage" onmouseenter="NF53G.paused=true" onmouseleave="NF53G.paused=false">
      <button class="nf53-tap l" onclick="nf53Go(-1)" aria-label="Back"></button><button class="nf53-tap r" onclick="nf53Go(1)" aria-label="Next"></button>
      <div class="nf53-ico">${st.e}</div>
      <div class="nf53-ui">${st.ui.map((r, j) => `<div style="animation-delay:${.25 + j * .18}s">${r}</div>`).join('')}</div>
    </div>
    <div class="nf53-txt"><small>Step ${NF53G.i + 1} of ${g.s.length}</small><h3>${st.h}</h3><p>${st.p}</p></div>
    <div class="nf53-foot"><button class="nf53-hide" onclick="nf53Hide()">Hide guide buttons</button>
      <span>${NF53G.i ? '<button class="btn btn-outline" onclick="nf53Go(-1)">Back</button>' : ''}<button class="btn btn-primary" onclick="${last ? 'nf53Close()' : 'nf53Go(1)'}">${last ? 'Got it, let’s go' : 'Next'}</button></span></div></div>`;
  NF53G.t0 = performance.now(); cancelAnimationFrame(NF53G.t);
  const bar = ov.querySelector('.nf53-bars i.now u'); let acc = 0, prev = performance.now();
  const tick = now => { if(!document.getElementById('nf53Ov') || document.getElementById('nf53Ov').hidden) return; if(!NF53G.paused) acc += now - prev; prev = now;
    const k = Math.min(1, acc / NF53G.dur); if(bar) bar.style.width = (k * 100) + '%';
    if(k >= 1){ if(!last) nf53Go(1); return; } NF53G.t = requestAnimationFrame(tick); };
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches) NF53G.t = requestAnimationFrame(tick); else if(bar) bar.style.width = '100%';
}
function nf53Go(d){ const g = NF53[NF53G.k]; NF53G.i = Math.max(0, Math.min(g.s.length - 1, NF53G.i + d)); nf53Draw(); }
function nf53Close(){ cancelAnimationFrame(NF53G.t); const ov = document.getElementById('nf53Ov'); if(ov) ov.hidden = true; document.body.classList.remove('nf53-lock'); nf53Paint(); }
function nf53Hide(){ nf53S(NF53_OFF, true); nf53Close(); nf53Paint(); if(typeof showToast === 'function') showToast('Guides hidden. Turn them back on in Settings or Help.', 'success'); }
function nf53Show(){ nf53S(NF53_OFF, false); nf53Paint(); if(typeof showToast === 'function') showToast('Page guides are back on every page.', 'success'); }

// ---- Viber notice on Messages: always clear what is needed, never hidden completely ----
function nf53Viber(){
  const pg = document.getElementById('page-messages'); if(!pg || pg.offsetParent === null) return;
  const on = !!window.NiftiAndroid;
  let box = pg.querySelector('.nf53-vb');
  if(!box){ box = document.createElement('div'); box.className = 'nf53-vb'; const b = pg.querySelector('.nf53-btn'); pg.insertBefore(box, b ? b.nextSibling : pg.firstChild); }
  const small = nf53S('nifti-vb-small');
  const k = (on ? 'on' : 'off') + (small ? 's' : '');
  if(box.dataset.k === k) return; box.dataset.k = k;
  if(small){ box.innerHTML = `<span class="nf53-vb-i">📱</span><b>Viber messages come in through the Nifti Android app${on ? ' (this phone)' : ''}.</b><button onclick="nf53S('nifti-vb-small',false);nf53Viber()">How it works</button>`; box.classList.add('s'); return; }
  box.classList.remove('s');
  box.innerHTML = `<div class="nf53-vb-h"><span class="nf53-vb-i">📱</span><div><b>How Viber messages get into Nifti</b><small>Read this once so nothing surprises you.</small></div><button class="nf53-vb-x" onclick="nf53S('nifti-vb-small',true);nf53Viber()" aria-label="Make smaller">Got it</button></div>
    <div class="nf53-vb-g">
      <div class="ok"><b>Android phone + Nifti app</b><span>Automatic. Viber must be installed and logged in on that same phone. Keep it on and online.</span></div>
      <div class="mid"><b>iPhone</b><span>Not automatic (Apple does not allow it). Share or copy a message into Nifti in one tap.</span></div>
      <div class="mid"><b>Computer only</b><span>Not automatic yet. Copy and paste a message, or use the Android app on your phone.</span></div>
    </div>
    <p class="nf53-vb-n">Only messages that arrive after setup come in. If the phone is off or offline, they arrive once it is back.${on ? '' : ' <a onclick="typeof nf37Install===\'function\'?nf37Install():navigate(\'settings\')">Get the Android app</a>'}</p>`;
}
// Settings: a line to turn guides back on
function nf53SettingsLine(){
  const pg = document.getElementById('page-settings'); if(!pg || pg.offsetParent === null || pg.querySelector('.nf53-set')) return;
  const d = document.createElement('div'); d.className = 'nf53-set'; d.innerHTML = '<span><b>Page guides</b> One-minute guides at the top of each page.</span><button class="btn btn-outline btn-sm" onclick="nf53Show()">Show guides</button>';
  pg.insertBefore(d, pg.querySelector('.nf53-btn') ? pg.querySelector('.nf53-btn').nextSibling : pg.firstChild);
}
NF45_AFTER.push(() => { nf53Paint(); nf53Viber(); nf53SettingsLine(); });
setInterval(() => { if(!document.hidden && !(document.getElementById('nf53Ov') && !document.getElementById('nf53Ov').hidden)){ nf53Paint(); nf53Viber(); } }, 1500);
