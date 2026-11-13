/* ===== Round 26: Plans & pricing inside the app, and a simple way to subscribe ===== */
// One sheet, reachable from the menu, the account menu, Settings and Home. Three plans with what each one gives
// you. Choosing one shows where to send the money (GCash, Maya or bank), takes the reference number or a photo
// of the receipt, and sends it to the Nifti owner to switch the plan on. Nifti never holds a card.
const NF26_PLANS = [
  {k: 'free', name: 'Free', m: 0, y: 0, who: 'A small shop running day to day.',
    f: ['Orders with customers and suppliers', 'Messages, stock, shop sales, expenses', 'Who owes you, with reminders you send yourself', 'Online store and Facebook posts', 'Telegram alerts', '10 notebook pages a month', 'Up to 3 people', 'Download everything any time']},
  {k: 'pro', name: 'Pro', m: 990, y: 9900, who: 'Shops that want Nifti to chase money and keep the books.',
    f: ['Everything in Free', 'Payment reminders sent for you, and statements', 'Books, profit and summaries for your bookkeeper', 'Payroll, checks and delivery routes', 'Credits, returns and credit limits', 'Price announcements and price alerts', 'Store results, promos, reorder reminders', 'Team spending caps and order watchdog', '300 notebook pages a month', 'Up to 15 people']},
  {k: 'business', name: 'Business', m: 2990, y: 29900, who: 'Distributors with branches, drivers and a bigger team.',
    f: ['Everything in Pro', 'Done-for-you setup included', 'Verified badge, featured in Find customers', 'Priority help: we answer you first', '1,500 notebook pages a month', 'Up to 50 people']}
];
const NF26P = {cycle: 'monthly', pick: null, step: 'plans', method: 'GCash', receipt: null, busy: false, instr: '', note: '', err: ''};
const NF26_CHK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
function nf26Peso(n){ return '₱' + Number(n || 0).toLocaleString('en-US'); }
function nf26PlanNow(){
  if(!nf25Real()) return {plan: 'free', demo: true};
  const i = (typeof myPlanInfo !== 'undefined' && myPlanInfo) || {};
  return {plan: i.plan === 'business' ? 'business' : ['pro', 'supplier_pro', 'buyer_pro'].includes(i.plan) ? 'pro' : 'free', pilot: !!i.pilot, paidUntil: i.paid_until || null, pending: i.pending_request || null, seats: i.seats_used, seatLimit: i.seat_limit};
}
function nf26Day(d){ try{ return new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric', year: 'numeric'}); }catch(e){ return String(d || ''); } }
function nf26PlanLine(){
  const s = nf26PlanNow(), name = NF26_PLANS.find(p => p.k === s.plan).name;
  if(s.pending) return 'Payment sent, being checked';
  if(s.plan !== 'free') return `You're on ${name}` + (s.paidUntil ? ` until ${nf26Day(s.paidUntil)}` : '');
  return "You're on Free. See what Pro adds";
}
function nf26OpenPlans(pick, note){
  try{ if(typeof closeUserMenu === 'function') closeUserMenu(); if(typeof closeUpgradePrompt === 'function') closeUpgradePrompt(); if(typeof closeMobileSidebar === 'function') closeMobileSidebar(); }catch(e){}
  let ov = document.getElementById('nf26Plans');
  if(!ov){ ov = document.createElement('div'); ov.id = 'nf26Plans'; ov.className = 'nf20-ov nf26-plans'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Plans and pricing');
    ov.addEventListener('click', e => { if(e.target === ov) nf26ClosePlans(); }); document.body.appendChild(ov); }
  NF26P.step = 'plans'; NF26P.pick = null; NF26P.receipt = null; NF26P.err = ''; NF26P.note = typeof note === 'string' ? note : '';
  ov.hidden = false; document.body.classList.add('nf20-noscroll'); nf26PaintPlans();
  if(nf25Real()){ Promise.all([typeof loadMyPlan === 'function' ? loadMyPlan() : null, sb.rpc('billing_instructions')]).then(r => { NF26P.instr = (r[1] && r[1].data) || ''; if(!ov.hidden && NF26P.step !== 'done') nf26PaintPlans(); if(pick && pick !== 'free' && NF26P.step === 'plans' && !nf26PlanNow().pending) nf26Choose(pick); }).catch(() => {}); }
  else if(pick && pick !== 'free') nf26Choose(pick);
}
function nf26ClosePlans(){ const ov = document.getElementById('nf26Plans'); if(ov) ov.hidden = true; document.body.classList.remove('nf20-noscroll'); try{ nf26MenuPost(); }catch(e){} }
function nf26Choose(k){ NF26P.pick = k; NF26P.step = 'pay'; NF26P.err = ''; nf26PaintPlans(); const s = document.querySelector('#nf26Plans .nf20-sheet'); if(s) s.scrollIntoView({block: 'start'}); const ov = document.getElementById('nf26Plans'); if(ov) ov.scrollTop = 0; }
function nf26PaintPlans(){
  const ov = document.getElementById('nf26Plans'); if(!ov) return;
  const s = nf26PlanNow(), owner = !nf25Real() || (typeof isPrivilegedUser === 'function' && isPrivilegedUser());
  const x = `<button type="button" class="nf20-x" onclick="nf26ClosePlans()" aria-label="Close">✕</button>`;
  if(NF26P.step === 'done'){
    ov.innerHTML = `<div class="nf20-sheet nf26-psheet"><div class="nf26-done"><span class="nf26-done-ic">${NF26_CHK}</span><h2>Thank you. We got it.</h2>
      <p>We'll check the payment and switch your plan on, usually within a few hours. You'll get an alert here${''} and on Telegram if you linked it.</p>
      <button type="button" class="btn btn-primary" onclick="nf26ClosePlans()">Done</button></div></div>`; return;
  }
  if(NF26P.step === 'pay'){
    const p = NF26_PLANS.find(z => z.k === NF26P.pick) || NF26_PLANS[1], amt = NF26P.cycle === 'yearly' ? p.y : p.m;
    const demo = !nf25Real();
    const instr = demo ? 'GCash 0917 000 0000 (Nifti) · sample\nBPI 0000-0000-00 (Nifti) · sample' : NF26P.instr;
    ov.innerHTML = `<div class="nf20-sheet nf26-psheet">
      <div class="nf20-sh"><div><button type="button" class="nf26-back" onclick="NF26P.step='plans'; nf26PaintPlans()">‹ All plans</button><h2>Subscribe to ${p.name}</h2><p>Three short steps. No card, no contract. Stop any time.</p></div>${x}</div>
      <div class="nf26-paybody">
        <div class="nf26-cyc" role="group" aria-label="How often">
          <button type="button" class="${NF26P.cycle === 'monthly' ? 'on' : ''}" onclick="NF26P.cycle='monthly'; nf26PaintPlans()"><b>Monthly</b><span>${nf26Peso(p.m)} a month</span></button>
          <button type="button" class="${NF26P.cycle === 'yearly' ? 'on' : ''}" onclick="NF26P.cycle='yearly'; nf26PaintPlans()"><b>Yearly</b><span>${nf26Peso(p.y)} a year · 2 months free</span></button></div>
        <div class="nf26-pstep"><span class="n">1</span><div><b>Send ${nf26Peso(amt)}</b>
          ${instr ? `<pre class="nf26-instr">${escapeHtml(instr)}</pre>` : `<p class="nf26-soft">Payment details are being set up. Tap <a onclick="nf26ClosePlans(); nf26Help('I want to subscribe to ${p.name}. Where do I send the payment?')">Need help?</a> and we'll send them to you right away.</p>`}</div></div>
        <div class="nf26-pstep"><span class="n">2</span><div><b>Tell us how you paid</b>
          <div class="nf26-meth" role="group" aria-label="Paid with">${['GCash', 'Maya', 'Bank transfer'].map(m => `<button type="button" class="${NF26P.method === m ? 'on' : ''}" onclick="nf26Keep(); NF26P.method='${m}'; nf26PaintPlans()">${m}</button>`).join('')}</div>
          <label class="nf26-fl" for="nf26Ref">Reference number from your receipt</label>
          <input id="nf26Ref" class="nf26-in" maxlength="80" inputmode="text" autocomplete="off" placeholder="e.g. 9012 345 678901" value="${escapeHtml(NF26P.ref || '')}">
          <div class="nf26-or">or</div>
          <label class="nf26-photo"><input type="file" accept="image/*" hidden onchange="nf26Receipt(this)">${NF26P.receipt ? `<img src="${NF26P.receipt}" alt="Your receipt"><span>Receipt added. Tap to change</span>` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><span>Add a photo of the receipt</span>`}</label></div></div>
        <div class="nf26-pstep"><span class="n">3</span><div><b>We switch you on</b><p class="nf26-soft">Usually within a few hours. Your records stay exactly as they are.</p></div></div>
        ${NF26P.err ? `<div class="nf26-err" role="alert">${escapeHtml(NF26P.err)}</div>` : ''}
        ${demo ? `<div class="nf26-demo">This is the demo shop, so nothing is sent. Create your free account to subscribe for real.</div>` : ''}
      </div>
      <div class="nf20-sf nf26-payfoot"><span>${p.name} · ${NF26P.cycle === 'yearly' ? 'yearly' : 'monthly'} · <b>${nf26Peso(amt)}</b></span>
        ${demo ? `<button type="button" class="btn btn-primary" onclick="nf26ClosePlans(); try{ localStorage.setItem('nifti-want-plan','${p.k}'); }catch(e){} navigate('login'); try{ nf20ToSignup(); }catch(e){}">Create my free account</button>`
          : `<button type="button" class="btn btn-primary" id="nf26PayBtn" ${NF26P.busy ? 'disabled' : ''} onclick="nf26Pay()">${NF26P.busy ? 'Sending…' : `I've paid ${nf26Peso(amt)}`}</button>`}</div></div>`;
    return;
  }
  const head = s.pending ? `<div class="nf26-pbanner wait"><b>Payment sent for ${NF26_PLANS.find(z => z.k === (s.pending.plan === 'business' ? 'business' : 'pro')).name} (${escapeHtml(s.pending.cycle || '')}).</b> We're checking it now. You'll get an alert when your plan is on.</div>`
    : s.plan !== 'free' ? `<div class="nf26-pbanner good"><b>You're on ${NF26_PLANS.find(z => z.k === s.plan).name}.</b> ${s.paidUntil ? `Paid until ${nf26Day(s.paidUntil)}. Renew any time; extra time is added on.` : ''}</div>`
    : s.pilot ? `<div class="nf26-pbanner good"><b>Launch period: every Pro tool is switched on for you at no charge.</b> Subscribe any time to keep them when the launch period ends.</div>` : '';
  ov.innerHTML = `<div class="nf20-sheet nf26-psheet">
    <div class="nf20-sh"><div><h2>Plans &amp; pricing</h2><p>Start free. Upgrade when it pays for itself. One plan covers buying, selling and your books.</p></div>${x}</div>
    ${NF26P.note ? `<div class="nf26-pbanner note">${NF26P.note}</div>` : ''}${head}
    <div class="nf26-cyc top" role="group" aria-label="How often"><button type="button" class="${NF26P.cycle === 'monthly' ? 'on' : ''}" onclick="NF26P.cycle='monthly'; nf26PaintPlans()"><b>Monthly</b></button><button type="button" class="${NF26P.cycle === 'yearly' ? 'on' : ''}" onclick="NF26P.cycle='yearly'; nf26PaintPlans()"><b>Yearly</b><span>2 months free</span></button></div>
    <div class="nf26-pcards">${NF26_PLANS.map(p => { const cur = s.plan === p.k && !s.demo, amt = NF26P.cycle === 'yearly' ? p.y : p.m;
      const btn = p.k === 'free' ? (s.plan === 'free' ? `<span class="nf26-cur">${s.demo ? 'Where everyone starts' : 'Your plan now'}</span>` : `<span class="nf26-cur soft">Always there if you stop paying</span>`)
        : s.pending ? `<span class="nf26-cur soft">Payment being checked</span>`
        : !owner ? `<span class="nf26-cur soft">Ask your owner to subscribe</span>`
        : `<button type="button" class="btn ${p.k === 'pro' ? 'btn-primary' : 'btn-outline'}" onclick="nf26Choose('${p.k}')">${cur ? 'Renew ' + p.name : 'Choose ' + p.name}</button>`;
      return `<section class="nf26-pc ${p.k}${cur ? ' cur' : ''}">${p.k === 'pro' ? '<span class="nf26-flag">MOST SHOPS</span>' : ''}<h3>${p.name}${cur ? '<em>Your plan</em>' : ''}</h3>
        <div class="nf26-price"><b>${nf26Peso(amt)}</b><span>${p.k === 'free' ? 'forever' : NF26P.cycle === 'yearly' ? 'a year' : 'a month'}</span></div>
        <p class="nf26-who">${p.who}</p><ul>${p.f.map(f => `<li>${NF26_CHK}<span>${f}</span></li>`).join('')}</ul>${btn}</section>`; }).join('')}</div>
    <div class="nf26-how"><b>How paying works</b><ol><li><span>1</span>Choose a plan and send the amount by GCash, Maya or bank transfer.</li><li><span>2</span>Type the reference number, or snap the receipt.</li><li><span>3</span>We switch your plan on, usually within a few hours.</li></ol>
      <p>No card and no contract. If you stop, you go back to Free and keep all your records. Questions? <a onclick="nf26ClosePlans(); nf26Help()">Message the Nifti team</a>.</p></div>
  </div>`;
}
function nf26Keep(){ const r = document.getElementById('nf26Ref'); if(r) NF26P.ref = r.value; }
function nf26Receipt(input){
  const f = input.files && input.files[0]; if(!f) return; nf26Keep();
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => { const max = 1400, k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); NF26P.receipt = c.toDataURL('image/jpeg', 0.8); URL.revokeObjectURL(url); nf26PaintPlans(); };
  img.onerror = () => { URL.revokeObjectURL(url); NF26P.err = "That file isn't a photo. Try again with a picture of the receipt."; nf26PaintPlans(); };
  img.src = url;
}
function nf26DataBlob(dataUrl){ const [h, b] = dataUrl.split(','), bin = atob(b), u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], {type: (h.match(/:(.*?);/) || [])[1] || 'image/jpeg'}); }
async function nf26Upload(dataUrl, folder){
  const path = `${myBusiness.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await sb.storage.from('receipts').upload(path, nf26DataBlob(dataUrl), {contentType: 'image/jpeg', upsert: false});
  if(error) throw error; return path;
}
async function nf26Pay(){
  if(NF26P.busy || !nf25Real()) return; nf26Keep();
  const ref = (NF26P.ref || '').trim();
  if(ref.length < 4 && !NF26P.receipt){ NF26P.err = 'Type the reference number from your receipt, or add a photo of it.'; nf26PaintPlans(); const r = document.getElementById('nf26Ref'); if(r) r.focus(); return; }
  NF26P.busy = true; NF26P.err = ''; nf26PaintPlans();
  try{
    let path = null; if(NF26P.receipt) path = await nf26Upload(NF26P.receipt, 'upgrade');
    const { error } = await sb.rpc('request_upgrade', {p_plan: NF26P.pick, p_cycle: NF26P.cycle, p_method: NF26P.method, p_reference: ref, p_receipt: path});
    if(error) throw error;
    try{ myPlanInfo = null; await loadMyPlan(); }catch(e){}
    NF26P.step = 'done'; NF26P.ref = ''; NF26P.receipt = null;
  }catch(e){ NF26P.err = (e && e.message) || "Couldn't send it. Check your internet and try again."; }
  NF26P.busy = false; nf26PaintPlans();
}

/* ---------- pages that belong to a paid plan: say so plainly, with what you get ---------- */
const NF26_PRO_PAGES = {
  payroll: ['payroll', 'Payroll', ['Add up days and take off vale by itself', 'Payslips ready to print or send', 'Pay day goes straight into your books']],
  ledger: ['owner_books', 'Books', ['Profit that matches every sale and expense', 'Summaries your bookkeeper can use as is', 'Month-end close with one checklist']],
  books: ['vat_books', 'Tax books', ['Sales and purchase summaries for your bookkeeper', 'VAT you collected and paid, per bill', 'One tap to export']],
  taxforms: ['bir2307', 'BIR 2307s', ['Which customers still owe you a 2307', 'Due dates so nothing is forgotten', 'A ready message to ask for the form']],
  cheques: ['cheques', 'Checks', ['The day to deposit each check', 'A warning before a check goes stale', 'Bounced checks followed up for you']],
  routes: ['routes', 'Deliveries', ["Today's stops in one list for the driver", 'Delivered and collected, marked on the spot', 'Send the list by Viber']]
};
function nf26Locked(page){ const c = NF26_PRO_PAGES[page]; if(!c) return false; try{ return !hasFeature(c[0]); }catch(e){ return false; } }
function nf26Gate(page){
  if(!page) return; const pid = page.id.replace(/^page-/, ''), cfg = NF26_PRO_PAGES[pid], lock = nf26Locked(pid);
  const old = page.querySelector(':scope > .nf26-lock');
  if(page.classList.contains('nf26-locked') !== lock) page.classList.toggle('nf26-locked', lock);
  if(!lock){ if(old) old.remove(); return; }
  if(old) return;
  const c = document.createElement('section'); c.className = 'nf26-lock';
  c.innerHTML = `<span class="nf26-lock-k">PART OF PRO</span><h2>${cfg[1]} comes with Pro</h2><ul>${cfg[2].map(f => `<li>${NF26_CHK}<span>${f}</span></li>`).join('')}</ul>
    <div class="nf26-lock-b"><button type="button" class="btn btn-primary" onclick="nf26OpenPlans('pro')">See Pro · ₱990 a month</button><button type="button" class="nf26-link" onclick="nf26OpenPlans()">Compare all plans</button></div>`;
  const head = page.querySelector(':scope > .page-head'); page.insertBefore(c, head ? head.nextSibling : page.firstChild);
}
function nf26MenuLocks(){
  document.querySelectorAll('.sidebar .nf19-nav .nav-item[data-page]').forEach(n => { const lock = nf26Locked(n.dataset.page) && n.dataset.nf26 !== 'bank'; let t = n.querySelector('.nf26-pro');
    if(lock && !t){ t = document.createElement('em'); t.className = 'nf26-pro'; t.textContent = 'Pro'; n.appendChild(t); } else if(!lock && t) t.remove(); });
}

/* ---------- wiring ---------- */
(function(){
  // the small "PRO · free in pilot" tags are gone; a tool that needs a plan says so when you open it
  try{ proBadge = function(key){ let locked = false; try{ locked = !hasFeature(key); }catch(e){} return locked ? `<span class="pro-badge locked" role="button" tabindex="0" onclick="event.stopPropagation(); nf26OpenPlans('pro')">Pro</span>` : ''; }; window.proBadge = proBadge; }catch(e){}
  try{ openUpgradePrompt = function(message){ nf26OpenPlans(null, message); }; window.openUpgradePrompt = openUpgradePrompt; }catch(e){}
  // Settings, Your plan: one clear line and one button
  const rb = window.renderBillingSettings;
  if(typeof rb === 'function' && !rb._nf26){ const w = async function(){ let out; try{ out = await rb.apply(this, arguments); }catch(e){}
      try{ const el = document.getElementById('billingPlanContent'); if(el){ const s = nf26PlanNow();
        el.innerHTML = `<div class="nf26-set"><div><b>${escapeHtml(nf26PlanLine())}</b><span>${s.seats != null ? `${s.seats} of ${s.seatLimit} people used. ` : ''}Free ₱0 · Pro ₱990 a month · Business ₱2,990 a month.</span></div><button type="button" class="btn btn-primary" onclick="nf26OpenPlans()">See plans &amp; pricing</button></div><div id="nf26SetServices"></div>`; } }catch(e){ console.warn('nf26 billing', e); }
      return out; };
    Object.keys(rb).forEach(k => { w[k] = rb[k]; }); w._nf26 = true; window.renderBillingSettings = w; try{ renderBillingSettings = w; }catch(e){} }
  // admin: see the receipt photo next to each payment to confirm
  const ob = window.renderOwnerBillingCard;
  if(typeof ob === 'function' && !ob._nf26){ const w = async function(){ const out = await ob.apply(this, arguments);
      try{ const el = document.getElementById('ownerBillingContent'); if(el){ el.querySelectorAll('button[onclick^="decideUpgrade"]').forEach(b => { const m = (b.getAttribute('onclick') || '').match(/decideUpgrade\('([^']+)', true\)/); if(!m || b.parentElement.querySelector('.nf26-rc')) return;
          const a = document.createElement('button'); a.type = 'button'; a.className = 'btn btn-outline nf26-rc'; a.style.cssText = 'padding:6px 12px;font-size:14px;'; a.textContent = 'See receipt'; a.onclick = () => nf26AdminReceipt(m[1], a); b.parentElement.appendChild(a); });
        el.querySelectorAll('div').forEach(d => { if(d.children.length === 0 && d.textContent.trim() === 'Pilot') d.textContent = 'Launch period'; if(d.classList.contains('toggle-sub') && /pilot ends/.test(d.textContent)) d.textContent = 'On: every shop gets the Pro tools at no charge. Turn off when you start charging. Paid shops keep their plan; everyone else moves to Free.'; }); } }catch(e){ console.warn('nf26 admin billing', e); }
      return out; };
    Object.keys(ob).forEach(k => { w[k] = ob[k]; }); w._nf26 = true; window.renderOwnerBillingCard = w; try{ renderOwnerBillingCard = w; }catch(e){} }
  // account menu
  const addUm = () => { const um = document.getElementById('userMenuDropdown'); if(um && !um.querySelector('.nf26-um')){
      const mk = (t, fn) => { const d = document.createElement('div'); d.className = 'notif-item nf26-um'; d.style.cursor = 'pointer'; d.innerHTML = `<div><div class="notif-text">${t}</div></div>`; d.onclick = fn; return d; };
      um.insertBefore(mk('Need help? Message us', () => nf26Help()), um.firstChild); um.insertBefore(mk('Plans &amp; pricing', () => nf26OpenPlans()), um.firstChild); } };
  const start = () => { try{ addUm(); }catch(e){} };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 700)); else setTimeout(start, 700);
  document.addEventListener('keydown', e => { if(e.key === 'Escape'){ ['nf26Plans', 'nf26HelpOv', 'nf26StartOv'].forEach(id => { const ov = document.getElementById(id); if(ov && !ov.hidden){ ov.hidden = true; document.body.classList.remove('nf20-noscroll'); } }); } });
})();
async function nf26AdminReceipt(id, btn){
  try{ btn.disabled = true; const { data: path, error } = await sb.rpc('admin_upgrade_receipt', {p_request: id}); if(error) throw error;
    if(!path){ btn.textContent = 'No photo, reference only'; return; }
    const { data, error: e2 } = await sb.storage.from('receipts').createSignedUrl(path, 600); if(e2) throw e2;
    window.open(data.signedUrl, '_blank', 'noopener'); btn.disabled = false;
  }catch(e){ btn.disabled = false; showToast((e && e.message) || "Couldn't open the receipt.", 'error'); }
}
// Home: owners see their plan in one small line under the greeting
function nf26HomePlan(page){
  if(!page || page.id !== 'page-dashboard') return;
  const host = document.querySelector('#mhHome .rows'); if(!host) return;
  let own = true; try{ own = nf20IsOwner() && !previewRole; }catch(e){}
  let el = document.getElementById('nf26HomePlan');
  if(!own){ if(el) el.remove(); return; }
  const line = nf26PlanLine();
  if(!el){ el = document.createElement('button'); el.type = 'button'; el.id = 'nf26HomePlan'; el.className = 'nf26-homeplan'; el.onclick = () => nf26OpenPlans(); }
  const html = `${NF26_STAR_IC}<span>${escapeHtml(line)}</span><b>Plans &amp; pricing ›</b>`;
  if(el.dataset.k !== line){ el.innerHTML = html; el.dataset.k = line; }
  if(el.parentElement !== host.parentElement || el.nextElementSibling !== host) host.parentElement.insertBefore(el, host);
}
