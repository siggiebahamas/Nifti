/* ===== Round 33: Help = help center (answers to common questions) + a live chat with the Nifti team ===== */
const NF33H_CATS = [['all', 'All'], ['start', 'Getting started'], ['orders', 'Orders'], ['money', 'Getting paid'], ['shop', 'Shop & stock'], ['team', 'Team'], ['plan', 'Plans']];
const NF33H_FAQ = [
  {c: 'start', q: 'How do I put my items in Nifti?', a: ['Upload your Excel or CSV list from Stock, "Bring in or save your list". Nifti reads the columns.', 'Or pick your kind of shop and start from 50 ready items, then fix the prices.', 'On Pro and Business, send us your file and the Nifti team loads it for you.'], go: "go('inventory')", gl: 'Open Stock'},
  {c: 'start', q: 'Do my customers and suppliers need Nifti too?', a: ['No. You can do everything with only your side on Nifti.', 'They get a link by Viber or SMS: they can confirm an order, see what they owe, and tell you they paid, all in their browser with no sign-up.']},
  {c: 'orders', q: 'How do I send an order to a supplier who is not on Nifti?', a: ['Open Orders and tap "+ New order".', 'Pick the supplier, or add one with just a name and phone.', 'Tap Send. Nifti gives you a link to paste in Viber or SMS. They confirm in their browser.'], go: "go('orders')", gl: 'Open Orders'},
  {c: 'orders', q: 'How do I receive a delivery into stock?', a: ['Open the order that arrived and tap Receive.', 'Check the quantities. Stock goes up by itself, and anything short or damaged is noted on the order.'], go: "go('orders')", gl: 'Open Orders'},
  {c: 'money', q: 'How do I record what a customer owes (utang)?', a: ['Open Getting paid and tap "+ Add what a customer owes".', 'Pick the customer, type the amount and the due date. Reminders go out on your schedule.'], go: "go('collections')", gl: 'Open Getting paid'},
  {c: 'money', q: 'How do reminders reach customers?', a: ['Each customer can get reminders on the app they use: Viber, WhatsApp, Messenger, SMS or email.', 'Email goes out by itself. For the others, Nifti lines up the message and you send it with one tap.', 'Set each customer\'s app in Getting paid.'], go: "go('collections')", gl: 'Open Getting paid'},
  {c: 'money', q: 'How do I put my GCash or bank QR on every bill?', a: ['Open Settings, then "How customers pay you".', 'Tap Add GCash QR and take a photo of your QR. Every bill and statement shows it from now on.'], go: "go('settings')", gl: 'Open Settings'},
  {c: 'money', q: 'Why is my cash count short or over?', a: ['Open Sales, Count the cash, and tap the day.', 'Nifti shows what should be in the drawer: change fund, cash sales, collections, minus cash paid out. Compare it with what was counted.'], go: "go('sales')", gl: 'Open Sales'},
  {c: 'shop', q: 'How do I snap a receipt as an expense?', a: ['Open Expenses and tap "+ Add expense".', 'Take a photo of the receipt, then pick who paid and where the money came from.'], go: "go('expenses')", gl: 'Open Expenses'},
  {c: 'shop', q: 'How do I change my selling prices?', a: ['Open Prices. Tap a cost or a price in the list to change it.', 'To tell your customers, use "Announce new prices" and pick a start date.'], go: "go('prices')", gl: 'Open Prices'},
  {c: 'team', q: 'How do I add my staff and choose what they see?', a: ['Open Team and tap "Add or manage people".', 'Type their name and pick a role (cashier, driver, collector). They only see the pages for that role.'], go: "go('team')", gl: 'Open Team'},
  {c: 'team', q: 'How do I give someone a job?', a: ['Open Team. Type the job, pick the person and a due date, and tap Add task.', 'They tap Start when they begin and Done when finished. You see it move across the board.'], go: "go('team')", gl: 'Open Team'},
  {c: 'plan', q: 'How do I upgrade to Pro or Business?', a: ['Tap Plans & pricing at the bottom of the menu and pick a plan.', 'Scan our QR with GCash, Maya or your bank app, then type the reference number. We switch you on within a few hours.'], go: 'nf26OpenPlans()', gl: 'See plans'},
  {c: 'plan', q: 'What happens if I stop paying?', a: ['You go back to Free. Your records stay, and you can download everything any time.']},
];
const NF33H = {cat: 'all', q: '', open: -1, view: 'answers', pollT: null};
function nf33HOnline(){ try{ const h = Number(new Date().toLocaleString('en-US', {timeZone: 'Asia/Manila', hour: 'numeric', hour12: false})); return h >= 8 && h < 20; }catch(e){ return true; } }
function nf33HAsk(q){ NF33H.view = 'chat'; NF32.draft = q; nf32Paint(); setTimeout(() => { const t = document.getElementById('nf32Txt'); if(t){ t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 50); }
function nf33HUnreadMine(){ return (NF26B.help || []).filter(m => m.from_admin && m._new).length; }
function nf32Paint(){
  const pg = document.getElementById('page-help'); if(!pg) return;
  const ta = document.getElementById('nf32Txt'); if(ta) NF32.draft = ta.value;
  const list = NF26B.help || [], vib = NF26B.contacts && NF26B.contacts.viber, hrs = NF26B.contacts && NF26B.contacts.hours, demo = !(typeof nf25Real === 'function' && nf25Real());
  const lastMine = list.map(m => !m.from_admin).lastIndexOf(true), firstNew = list.findIndex((m, i) => m.from_admin && m._new);
  const q = NF33H.q.trim().toLowerCase();
  const faqs = NF33H_FAQ.map((f, i) => ({f, i})).filter(x => (NF33H.cat === 'all' || x.f.c === NF33H.cat) && (!q || (x.f.q + ' ' + x.f.a.join(' ')).toLowerCase().includes(q)));
  const online = nf33HOnline(), unread = nf33HUnreadMine();
  const asked = list.filter(m => !m.from_admin).map((m, i, arr) => { const idx = list.indexOf(m); const ans = list.slice(idx + 1).find(x => x.from_admin && (list.slice(idx + 1, list.indexOf(x)).every(y => y.from_admin))); return {m, ans}; }).reverse().slice(0, 5);
  pg.innerHTML = `<div class="nf33h ${NF33H.view === 'chat' ? 'v-chat' : 'v-ans'}">
    <section class="nf33h-center">
      <div class="nf33h-hero"><h1>How can we help?</h1><p>Tap a question for the answer, or chat with a real person from the Nifti team.</p>
        <label class="nf33h-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="nf33hQ" type="search" placeholder='Try "utang", "receipt", "GCash QR"' value="${escapeHtml(NF33H.q)}" oninput="NF33H.q=this.value; NF33H.open=-1; nf32Paint(); const i=document.getElementById('nf33hQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length)"></label></div>
      <div class="nf33h-cats">${NF33H_CATS.map(([k, l]) => `<button type="button" class="${NF33H.cat === k ? 'on' : ''}" onclick="NF33H.cat='${k}'; NF33H.open=-1; nf32Paint()">${l}</button>`).join('')}</div>
      <div class="nf33h-faq">${faqs.map(({f, i}) => `<div class="nf33h-q${NF33H.open === i ? ' open' : ''}"><button type="button" class="nf33h-qh" aria-expanded="${NF33H.open === i}" onclick="NF33H.open = NF33H.open === ${i} ? -1 : ${i}; nf32Paint()"><b>${escapeHtml(f.q)}</b><span aria-hidden="true">${NF33H.open === i ? '−' : '+'}</span></button>
        ${NF33H.open === i ? `<div class="nf33h-a"><ol>${f.a.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ol><div class="nf33h-aa">${f.go ? `<button type="button" class="btn btn-primary" onclick="${f.go}">${escapeHtml(f.gl || 'Take me there')}</button>` : ''}<button type="button" class="btn btn-outline" onclick="nf33HAsk(${JSON.stringify('About: ' + f.q + ' ').replace(/"/g, '&quot;')})">Still stuck? Ask us</button></div></div>` : ''}</div>`).join('')
        || `<div class="nf33h-none"><p>No answer for "${escapeHtml(NF33H.q)}" yet.</p><button type="button" class="btn btn-primary" onclick="nf33HAsk(${JSON.stringify(NF33H.q).replace(/"/g, '&quot;')})">Ask the Nifti team</button></div>`}</div>
      ${asked.length ? `<h3 class="nf33h-h3">My questions</h3><div class="nf33h-mine">${asked.map(x => `<button type="button" class="nf33h-mq${x.ans && x.ans._new ? ' un' : ''}" onclick="NF33H.view='chat'; nf32Paint()"><span class="nf33h-st ${x.ans ? 'ok' : 'wait'}">${x.ans ? (x.ans._new ? 'New answer' : 'Answered') : 'Waiting'}</span><b>${escapeHtml(String(x.m.message || '').slice(0, 90))}</b><small>${nf32Time(x.m.created_at)}</small></button>`).join('')}</div>` : ''}
    </section>
    <aside class="nf33h-chat">
      <div class="nf33h-ch"><button type="button" class="nf33h-back" onclick="NF33H.view='answers'; nf32Paint()" aria-label="Back to answers">‹</button><span class="nf33h-faces"><i style="background:#0E7490">JY</i><i style="background:#B45309">MK</i><i style="background:#1D4ED8">SG</i></span>
        <div><b>Nifti team</b><small><span class="nf33h-dot ${online ? 'on' : ''}"></span>${online ? 'Active now · usually answers within the hour' : 'Away · we answer first thing tomorrow'}${hrs ? ' · ' + escapeHtml(hrs) : ''}</small></div></div>
      <div class="nf33h-body" id="nf32Body">${list.length ? list.map((m, i) => (i === firstNew ? '<div class="nf33h-new">New reply</div>' : '') + `<div class="nf33h-m${m.from_admin ? '' : ' me'}${m._new ? ' fresh' : ''}">${m.from_admin ? '<span class="nf33h-mav">N</span>' : ''}<div><p>${escapeHtml(m.message || (m.has_file ? 'Sent a file.' : ''))}</p><small>${m.from_admin ? 'Nifti team' : escapeHtml(m.from_name || 'You')} · ${nf32Time(m.created_at)}</small></div></div>`).join('')
        : `<div class="nf33h-hello"><span class="nf33h-mav lg">N</span><b>Hi! 👋</b><p>Ask us anything about Nifti. A real person answers, right here.</p></div>`}</div>
      <div class="nf33h-chips">${(typeof NF26_HELP_TOPICS !== 'undefined' ? NF26_HELP_TOPICS : []).map(t => `<button type="button" onclick="const x=document.getElementById('nf32Txt'); x.value=this.textContent; x.focus()">${escapeHtml(t)}</button>`).join('')}</div>
      <div class="nf33h-send"><textarea id="nf32Txt" rows="1" maxlength="2000" placeholder="Type your question…" aria-label="Your message" onkeydown="if(event.key==='Enter' && !event.shiftKey && !event.altKey){event.preventDefault(); nf32Send();}">${escapeHtml(NF32.draft)}</textarea><button type="button" class="nf33h-sendb" ${NF32.busy ? 'disabled' : ''} onclick="nf32Send()" aria-label="Send"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg></button></div>
      ${vib ? `<p class="nf33h-vib">Rather use Viber? <a href="viber://chat?number=${encodeURIComponent(vib.replace(/[^\d+]/g, ''))}">Message us on Viber</a></p>` : ''}
      ${demo ? '<p class="nf33h-demo">Demo shop: messages here are a sample. In your own account a real person answers.</p>' : ''}
    </aside>
    <button type="button" class="nf33h-fab" onclick="NF33H.view='chat'; nf32Paint()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Chat with us${unread ? `<em>${unread}</em>` : ''}</button>
  </div>`;
  const b = document.getElementById('nf32Body'); if(b) b.scrollTop = b.scrollHeight;
}
// replies show up while Help is open, like Messenger
function nf33HPoll(){
  clearInterval(NF33H.pollT);
  NF33H.pollT = setInterval(async () => {
    const pg = document.getElementById('page-help'); if(!pg || !pg.classList.contains('active')){ clearInterval(NF33H.pollT); return; }
    if(!(typeof nf25Real === 'function' && nf25Real())) return;
    try{ const { data } = await sb.rpc('help_thread'); if(Array.isArray(data) && data.length !== (NF26B.help || []).length){ const before = (NF26B.help || []).length; NF26B.help = data.map((m, i) => i >= before && m.from_admin ? Object.assign({}, m, {_new: true}) : m); nf32Paint(); } }catch(e){}
  }, 15000);
}
(function(){
  try{ window.nf32Paint = nf32Paint; }catch(e){}
  const sh = window.nf32Show;
  if(typeof sh === 'function' && !sh._nf33){ const w = function(){ const r = sh.apply(this, arguments); nf33HPoll(); return r; }; w._nf33 = true; window.nf32Show = w; try{ nf32Show = w; }catch(e){} }
})();
