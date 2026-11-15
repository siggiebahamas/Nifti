/* ===== Round 32: Help is its own page (chat with the Nifti team + short guides) ===== */
const NF32_GUIDES = [
  {t: 'Record what a customer owes', k: 'utang owe credit balance', go: "go('collections')", s: ['Open Getting paid.', 'Tap "+ Add what a customer owes".', 'Pick the customer, type the amount and the due date. Reminders go out by themselves.']},
  {t: 'Send an order to a supplier who is not on Nifti', k: 'order supplier outside link viber', go: "go('orders')", s: ['Open Orders and tap "+ New order".', 'Pick the supplier (or add a new one with just a name and phone).', 'Tap Send. Nifti gives you a link to paste in Viber or SMS. They confirm in their browser, no sign-up.']},
  {t: 'Snap a receipt as an expense', k: 'expense receipt resibo gastos', go: "go('expenses')", s: ['Open Expenses and tap "+ Add expense".', 'Take a photo of the receipt.', 'Pick who paid and where the money came from (drawer, GCash, bank).']},
  {t: 'Receive a delivery into stock', k: 'delivery receive stock dr', go: "go('orders')", s: ['Open the order that arrived.', 'Tap Receive and check the quantities.', 'Stock goes up by itself. Anything short or damaged is noted on the order.']},
  {t: 'Count the cash at closing', k: 'cash count drawer sukli', go: "go('sales')", s: ['Open Sales, scroll to Count the cash.', 'Count the drawer and type the total.', 'Nifti shows matched, over or short, and keeps a record by person.']},
  {t: 'Put your GCash or bank QR on every bill', k: 'gcash qr maya bank pay', go: "go('settings')", s: ['Open Settings, then "How customers pay you".', 'Tap Add GCash QR and take a photo of your QR.', 'Every bill and statement shows it from now on.']},
  {t: 'Let a customer who is not on Nifti see what they owe', k: 'statement soa customer outside link', go: "go('collections')", s: ['Open Getting paid and tap the customer.', 'Tap Send statement. Nifti makes a private link.', 'They open it on any phone, see every bill, and can tell you they paid with the reference number.']},
  {t: 'Add your staff and choose what they see', k: 'staff team role cashier driver', go: "go('team')", s: ['Open Team and tap "Add or manage people".', 'Type their name and pick a role (cashier, driver, collector).', 'They only see the pages for that role.']},
];
const NF32 = {q: '', open: -1, busy: false, draft: ''};
function nf32Ensure(){
  if(!appPages.includes('help')) appPages.push('help');
  if(!document.getElementById('page-help')){
    const ref = document.getElementById('page-dashboard'); if(!ref || !ref.parentElement) return;
    const d = document.createElement('div'); d.className = 'app-page'; d.id = 'page-help'; ref.parentElement.appendChild(d);
  }
}
function nf32Time(d){ try{ return new Date(d).toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}); }catch(e){ return ''; } }
async function nf32Load(){
  if(typeof nf25Real === 'function' && nf25Real()){
    try{ const [t, c] = await Promise.all([sb.rpc('help_thread'), NF26B.contacts ? {data: NF26B.contacts} : sb.rpc('support_contacts')]);
      if(!t.error) NF26B.help = t.data || []; NF26B.contacts = c.data || {}; }catch(e){}
  }
  NF26B.unread = 0; try{ nf26HelpBadge(); }catch(e){}
  nf32Paint();
}
function nf32Paint(){
  const pg = document.getElementById('page-help'); if(!pg) return;
  const ta = document.getElementById('nf32Txt'); if(ta) NF32.draft = ta.value;
  const list = NF26B.help || [], vib = NF26B.contacts && NF26B.contacts.viber, hrs = NF26B.contacts && NF26B.contacts.hours, demo = !(typeof nf25Real === 'function' && nf25Real());
  const lastMine = list.map(m => !m.from_admin).lastIndexOf(true), firstNew = list.findIndex((m, i) => m.from_admin && i > lastMine && m._new);
  const q = NF32.q.trim().toLowerCase(), guides = NF32_GUIDES.map((g, i) => ({g, i})).filter(x => !q || (x.g.t + ' ' + x.g.k + ' ' + x.g.s.join(' ')).toLowerCase().includes(q));
  pg.innerHTML = `<div class="page-header"><div><h1>Help</h1><p>Ask the Nifti team anything, or follow a short guide. A real person answers${hrs ? ', ' + escapeHtml(hrs) : ', usually within the day'}.</p></div></div>
  <div class="nf32">
    <section class="nf32-chat"><div class="nf32-ch"><span class="nf32-faces"><i style="background:#0E7490">JY</i><i style="background:#B45309">MK</i><i style="background:#1D4ED8">SG</i></span><div><b>Nifti team</b><small>Messages are kept here. You'll see a red count beside Help when we answer.</small></div></div>
      <div class="nf32-body" id="nf32Body">${list.length ? list.map((m, i) => (i === firstNew ? '<div class="nf32-new">New reply</div>' : '') + `<div class="nf32-m${m.from_admin ? '' : ' me'}${i === firstNew ? ' fresh' : ''}">${escapeHtml(m.message || (m.has_file ? 'Sent a file.' : ''))}<small>${m.from_admin ? 'Nifti team' : escapeHtml(m.from_name || 'You')} · ${nf32Time(m.created_at)}</small></div>`).join('')
        : `<p class="nf32-empty">No messages yet. Ask how to do something, where a page is, or tell us what looks wrong.</p>`}</div>
      <div class="nf32-chips">${(typeof NF26_HELP_TOPICS !== 'undefined' ? NF26_HELP_TOPICS : []).slice(0, 4).map(t => `<button type="button" onclick="const x=document.getElementById('nf32Txt'); x.value=this.textContent; x.focus()">${escapeHtml(t)}</button>`).join('')}</div>
      <div class="nf32-send"><textarea id="nf32Txt" rows="2" maxlength="2000" placeholder="Type your question here" aria-label="Your message" onkeydown="if(event.key==='Enter' && !event.shiftKey && !event.altKey){event.preventDefault(); nf32Send();}">${escapeHtml(NF32.draft)}</textarea><button type="button" class="btn btn-primary" ${NF32.busy ? 'disabled' : ''} onclick="nf32Send()">${NF32.busy ? 'Sending…' : 'Send'}</button></div>
      ${demo ? '<p class="nf32-demo">Demo shop: these messages are a sample. In your own account they reach the Nifti team.</p>' : ''}</section>
    <aside class="nf32-side">
      <div class="nf32-search"><input id="nf32Q" placeholder='Search help, e.g. "utang", "receipt", "GCash QR"' value="${escapeHtml(NF32.q)}" oninput="NF32.q=this.value; nf32Paint(); const i=document.getElementById('nf32Q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length)"></div>
      <h3>Short guides</h3>
      <div class="nf32-guides">${guides.map(({g, i}) => `<div class="nf32-g${NF32.open === i ? ' open' : ''}"><button type="button" class="nf32-gh" onclick="NF32.open = NF32.open === ${i} ? -1 : ${i}; nf32Paint()"><b>${escapeHtml(g.t)}</b><span>${NF32.open === i ? '−' : '+'}</span></button>${NF32.open === i ? `<ol>${g.s.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ol><button type="button" class="btn btn-outline" onclick="${g.go}">Take me there</button>` : ''}</div>`).join('') || '<p class="nf32-empty">No guide for that yet. Ask us in the chat.</p>'}</div>
      <div class="nf32-contact"><b>Rather talk?</b>${vib ? `<a href="viber://chat?number=${encodeURIComponent(vib.replace(/[^\d+]/g, ''))}">Message us on Viber</a>` : '<span>Chat here and we answer the same day.</span>'}</div>
    </aside></div>`;
  const b = document.getElementById('nf32Body'); if(b) b.scrollTop = b.scrollHeight;
}
async function nf32Send(){
  const ta = document.getElementById('nf32Txt'), msg = ta ? ta.value.trim() : ''; if(msg.length < 2 || NF32.busy){ if(ta) ta.focus(); return; }
  if(!(typeof nf25Real === 'function' && nf25Real())){
    NF26B.help.push({message: msg, from_admin: false, from_name: 'You', created_at: new Date().toISOString()});
    NF26B.help.push({message: 'Thanks! This is the demo shop, so this is a sample answer. In your own account, the Nifti team reads your message and answers here.', from_admin: true, created_at: new Date().toISOString(), _new: true});
    NF32.draft = ''; if(ta) ta.value = ''; nf32Paint(); return;
  }
  NF32.busy = true; nf32Paint();
  try{ const { error } = await sb.rpc('help_send', {p_message: msg, p_category: 'question', p_attachment: null}); if(error) throw error; NF32.draft = ''; NF32.busy = false; await nf32Load(); }
  catch(e){ NF32.busy = false; nf32Paint(); showToast(e.message || "Couldn't send. Try again.", 'error'); }
}
// shows the Help page directly (an older #help link handler would otherwise reopen the popup)
function nf32Show(){
  nf32Ensure();
  try{ closeMobileSidebar(); }catch(e){}
  try{ closeMoreSheet(); }catch(e){}
  document.querySelectorAll('.marketing-view').forEach(v => v.classList.add('hidden'));
  const lg = document.getElementById('view-login'); if(lg) lg.classList.add('hidden');
  const app = document.getElementById('view-app'); if(app) app.classList.remove('hidden');
  document.querySelectorAll('.app-page').forEach(x => x.classList.remove('active'));
  const pg = document.getElementById('page-help'); if(pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item[data-page], .bnav-item[data-page], .more-sheet-item[data-page]').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('#nf26HelpNav').forEach(x => x.classList.add('active'));
  try{ if(location.hash !== '#help') history.replaceState(null, '', '#help'); }catch(e){}
  try{ window.scrollTo(0, 0); }catch(e){}
  nf32Paint(); nf32Load();
}
(function(){
  try{ nf32Ensure(); }catch(e){ console.warn('nf32', e); }
  // the demo reply counts as new until Help is opened
  try{ (NF26B.help || []).forEach(m => { if(m.from_admin) m._new = true; }); }catch(e){}
  const allow = window.isPageAllowedForViewAsRole;
  if(typeof allow === 'function' && !allow._nf32){ const w = function(p){ return p === 'help' ? true : allow.apply(this, arguments); }; w._nf32 = true; window.isPageAllowedForViewAsRole = w; try{ isPageAllowedForViewAsRole = w; }catch(e){} }
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf32){ const w = function(p){ if(p === 'help') return nf32Show(); try{ document.querySelectorAll('#nf26HelpNav').forEach(b => b.classList.remove('active')); }catch(e){} return nav.apply(this, arguments); };
    Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf32 = true; window.navigate = w; try{ navigate = w; }catch(e){} }
  // the Help row in the menu opens the page
  const hp = function(){ try{ nf26HelpClose && nf26HelpClose(); }catch(e){} go('help'); }; hp._nf31 = true; hp._nf32 = true;
  window.nf26Help = hp; try{ nf26Help = hp; }catch(e){}
})();
