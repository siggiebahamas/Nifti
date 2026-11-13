/* ===== Round 26: the last "saved on this phone" pieces now save to the business, and a real help line ===== */
const NF26B = {slips: null, booted: null, help: [], helpBusy: false, contacts: null, unread: 0, admin: {list: [], open: null, thread: []}};

/* ---------- 1. Need help? A chat with the Nifti team ---------- */
// Every message lands in the Nifti owner's Admin page (Help inbox), their email, and their own Telegram if linked.
// The owner answers from there and the shop gets an alert. A Viber button shows when the owner has set a number.
const NF26_HELP_TOPICS = ['How do I add my items?', "I can't find a page", 'Question about my plan', 'Something looks wrong'];
function nf26Help(prefill){
  try{ if(typeof closeUserMenu === 'function') closeUserMenu(); if(typeof closeMobileSidebar === 'function') closeMobileSidebar(); }catch(e){}
  let ov = document.getElementById('nf26HelpOv');
  if(!ov){ ov = document.createElement('div'); ov.id = 'nf26HelpOv'; ov.className = 'nf20-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Need help? Message the Nifti team');
    ov.addEventListener('click', e => { if(e.target === ov) nf26HelpClose(); }); document.body.appendChild(ov); }
  ov.hidden = false; document.body.classList.add('nf20-noscroll');
  NF26B.helpDraft = typeof prefill === 'string' ? prefill : (NF26B.helpDraft || '');
  nf26HelpPaint(); nf26HelpLoad();
}
function nf26HelpClose(){ const ov = document.getElementById('nf26HelpOv'); if(ov) ov.hidden = true; document.body.classList.remove('nf20-noscroll'); }
async function nf26HelpLoad(){
  if(!nf25Real()){ if(!NF26B.help.length) NF26B.help = []; nf26HelpPaint(); return; }
  try{ const [t, c] = await Promise.all([sb.rpc('help_thread'), NF26B.contacts ? {data: NF26B.contacts} : sb.rpc('support_contacts')]);
    if(!t.error) NF26B.help = t.data || []; NF26B.contacts = c.data || {}; NF26B.unread = 0; nf26HelpBadge(); }catch(e){}
  nf26HelpPaint();
}
function nf26HelpTime(d){ try{ return new Date(d).toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}); }catch(e){ return ''; } }
function nf26HelpPaint(){
  const ov = document.getElementById('nf26HelpOv'); if(!ov || ov.hidden) return;
  const ta = document.getElementById('nf26HelpTxt'); if(ta) NF26B.helpDraft = ta.value;
  const list = NF26B.help, vib = NF26B.contacts && NF26B.contacts.viber, hrs = NF26B.contacts && NF26B.contacts.hours, demo = !nf25Real();
  ov.innerHTML = `<div class="nf20-sheet nf26-hsheet">
    <div class="nf20-sh"><div><h2>Need help?</h2><p>Message the Nifti team. A real person answers${hrs ? ', ' + escapeHtml(hrs) : ', usually the same day'}.</p></div><button type="button" class="nf20-x" onclick="nf26HelpClose()" aria-label="Close">✕</button></div>
    ${vib ? `<div class="nf26-hviber"><span>Prefer Viber?</span><a href="viber://chat?number=${encodeURIComponent(vib.replace(/[^\d+]/g, ''))}">Message us on Viber</a></div>` : ''}
    <div class="nf26-hbody" id="nf26HelpBody">${list.length ? list.map(m => `<div class="nf26-hm${m.from_admin ? '' : ' me'}">${escapeHtml(m.message || (m.has_file ? 'Sent a file.' : ''))}<small>${m.from_admin ? 'Nifti team' : escapeHtml(m.from_name || 'You')} · ${nf26HelpTime(m.created_at)}</small></div>`).join('')
      : `<p class="nf26-hempty">Ask anything: how to do something, where a page is, or what looks wrong. Tap a question below or type your own.</p>`}</div>
    ${list.length ? '' : `<div class="nf26-hchips">${NF26_HELP_TOPICS.map(t => `<button type="button" onclick="document.getElementById('nf26HelpTxt').value='${t.replace(/'/g, "\\'")}'; document.getElementById('nf26HelpTxt').focus()">${escapeHtml(t)}</button>`).join('')}</div>`}
    <div class="nf26-hsend"><textarea id="nf26HelpTxt" rows="2" maxlength="2000" placeholder="Type your question here" aria-label="Your message">${escapeHtml(NF26B.helpDraft || '')}</textarea>
      <button type="button" class="btn btn-primary" ${NF26B.helpBusy ? 'disabled' : ''} onclick="nf26HelpSend()">${NF26B.helpBusy ? 'Sending…' : 'Send'}</button></div>
    ${demo ? `<p class="nf26-soft" style="padding:0 20px 14px;">This is the demo shop: messages here are a sample and go nowhere. In your own account they reach the Nifti team.</p>` : ''}</div>`;
  const b = document.getElementById('nf26HelpBody'); if(b) b.scrollTop = b.scrollHeight;
}
async function nf26HelpSend(){
  const ta = document.getElementById('nf26HelpTxt'), msg = ta ? ta.value.trim() : ''; if(msg.length < 2 || NF26B.helpBusy) { if(ta) ta.focus(); return; }
  if(!nf25Real()){ NF26B.help.push({message: msg, from_admin: false, from_name: 'You', created_at: new Date().toISOString()});
    NF26B.help.push({message: 'Thanks! This is the demo shop, so this is a sample answer. In your own account, the Nifti team reads your message and answers here.', from_admin: true, created_at: new Date().toISOString()});
    NF26B.helpDraft = ''; if(ta) ta.value = ''; nf26HelpPaint(); return; }
  NF26B.helpBusy = true; nf26HelpPaint();
  try{ const { error } = await sb.rpc('help_send', {p_message: msg, p_category: 'question', p_attachment: null}); if(error) throw error;
    NF26B.helpDraft = ''; const t2 = document.getElementById('nf26HelpTxt'); if(t2) t2.value = ''; NF26B.helpBusy = false; await nf26HelpLoad();
    showToast("Sent. We'll answer here, and you'll get an alert.", 'success');
  }catch(e){ NF26B.helpBusy = false; nf26HelpPaint(); showToast((e && e.message) || "Couldn't send. Check your internet and try again.", 'error'); }
}
function nf26HelpBadge(){ const b = document.getElementById('nf26HelpNav'); if(!b) return; let e = b.querySelector('em'); if(NF26B.unread > 0){ if(!e){ e = document.createElement('em'); b.appendChild(e); } e.textContent = NF26B.unread; } else if(e) e.remove(); }
async function nf26HelpPoll(){ if(!nf25Real()) return; try{ const { data } = await sb.rpc('help_unread'); NF26B.unread = Number(data) || 0; nf26HelpBadge(); }catch(e){} }

/* ---------- 2. Admin: the Help inbox (threads on the left, the chat and your answer on the right) ---------- */
async function nf26AdminInbox(body){
  let list = [], st = {}; try{ list = await adminRpc('admin_help_inbox') || []; st = await adminRpc('admin_support_settings') || {}; }catch(e){ body.innerHTML = `<div class="panel-card">${escapeHtml(e.message || 'Could not load the inbox.')}</div>`; return; }
  const A = NF26B.admin; A.list = list; if(!A.open || !list.some(x => x.business_id === A.open)) A.open = list.length ? list[0].business_id : null;
  if(A.open){ try{ A.thread = await adminRpc('admin_help_thread', {p_business: A.open}) || []; }catch(e){ A.thread = []; } }
  const cur = list.find(x => x.business_id === A.open);
  body.innerHTML = `<div class="panel-card"><div class="adm-h">Help inbox</div>
    <p class="nf25-p" style="margin:0 0 12px;">Every "Need help?" message from a shop lands here. You also get an email, and a Telegram alert if you linked your own Telegram. Business plan shops are listed first.</p>
    ${list.length ? `<div class="nf26-inbox"><div class="nf26-ilist">${list.map(x => `<button type="button" class="${x.business_id === A.open ? 'on' : ''}" onclick="NF26B.admin.open='${x.business_id}'; renderAdminPage()"><b><span>${x.plan === 'business' ? '★ ' : ''}${escapeHtml(x.business_name || 'Shop')}</span>${x.unread ? `<i>${x.unread}</i>` : ''}</b><small>${x.last_from_admin ? 'You: ' : ''}${escapeHtml(x.last_message || 'Sent a file')}</small></button>`).join('')}</div>
      <div class="nf26-ithread"><div class="nf26-hbody" id="nf26AdmBody">${A.thread.map(m => `<div class="nf26-hm${m.from_admin ? ' me' : ''}">${escapeHtml(m.message || '')}${m.attachment_path ? `<br><a class="row-action" onclick="nf26AdminFile('${escapeHtml(m.attachment_path)}')">Open their file</a>` : ''}<small>${m.from_admin ? 'You' : escapeHtml(m.from_name || 'Shop')} · ${escapeHtml(m.category || '')} · ${nf26HelpTime(m.created_at)}</small></div>`).join('')}</div>
        <div class="nf26-hsend"><textarea id="nf26AdmTxt" rows="2" maxlength="2000" placeholder="Answer ${escapeHtml((cur && cur.business_name) || '')}" aria-label="Your answer"></textarea><button type="button" class="btn btn-primary" onclick="nf26AdminReply()">Send</button></div></div></div>`
      : '<div style="padding:8px 0;">No messages yet. When a shop taps "Need help?", it shows here.</div>'}</div>
    <div class="panel-card"><div class="adm-h">Where shops can reach you</div>
      <p class="nf25-p" style="margin:0 0 10px;">The chat above always works. If you also want a Viber button under "Need help?", type your Viber number. Leave it blank to keep everything in the inbox.</p>
      <div class="nf25-in"><input id="nf26Viber" type="tel" autocomplete="off" placeholder="+63 917 123 4567" value="${escapeHtml(st.viber || '')}" aria-label="Viber number"><button type="button" class="btn btn-outline" onclick="nf26AdminSet('support_viber', 'nf26Viber')">Save Viber number</button></div>
      <div class="nf25-in" style="margin-top:8px;"><input id="nf26Hours" type="text" maxlength="60" autocomplete="off" placeholder="Mon to Sat, 8 AM to 6 PM" value="${escapeHtml(st.hours || '')}" aria-label="When you answer"><button type="button" class="btn btn-outline" onclick="nf26AdminSet('support_hours', 'nf26Hours')">Save hours</button></div></div>`;
  const b = document.getElementById('nf26AdmBody'); if(b) b.scrollTop = b.scrollHeight;
}
async function nf26AdminReply(){
  const ta = document.getElementById('nf26AdmTxt'), msg = ta ? ta.value.trim() : ''; if(!msg || !NF26B.admin.open) return;
  try{ await adminRpc('admin_help_reply', {p_business: NF26B.admin.open, p_message: msg}); showToast('Answer sent. They get an alert.', 'success'); renderAdminPage(); }catch(e){ showToast(e.message, 'error'); }
}
async function nf26AdminSet(name, inputId){
  const v = (document.getElementById(inputId) || {}).value || '';
  try{ await adminRpc('admin_set_secret', {p_name: name, p_value: v.trim()}); NF26B.contacts = null; showToast(v.trim() ? 'Saved.' : 'Removed.', 'success'); }catch(e){ showToast(e.message, 'error'); }
}
async function nf26AdminFile(path){ try{ const { data, error } = await sb.storage.from('receipts').createSignedUrl(path, 600); if(error) throw error; window.open(data.signedUrl, '_blank', 'noopener'); }catch(e){ showToast((e && e.message) || "Couldn't open the file.", 'error'); } }

/* ---------- 3. Who sees what: saved for the whole team ---------- */
async function nf26RolePagesLoad(){
  if(!nf25Real()) return;
  try{ const { data, error } = await sb.from('role_pages').select('pages').eq('business_id', myBusiness.id).maybeSingle(); if(error || !data || !data.pages) return;
    Object.entries(data.pages).forEach(([r, pages]) => { if(r !== 'Owner' && r in ROLE_PERMISSIONS && (Array.isArray(pages) || pages === null)) ROLE_PERMISSIONS[r] = pages; });
    try{ localStorage.setItem(NF20_RP(), JSON.stringify(data.pages)); }catch(e){}
    try{ renderSidebarForViewAsRole(); nf20MenuRoles(); }catch(e){}
  }catch(e){ console.warn('nf26 role pages', e); }
}
(function(){
  const base = window.nf20SaveRolePages; if(typeof base !== 'function' || base._nf26) return; let t = 0;
  const w = function(){ const r = base.apply(this, arguments);
    if(nf25Real()){ clearTimeout(t); t = setTimeout(async () => { const o = {}; Object.keys(ROLE_PERMISSIONS).forEach(k => { if(k !== 'Owner') o[k] = ROLE_PERMISSIONS[k]; });
        try{ const { error } = await sb.rpc('set_role_pages', {p_pages: o}); if(error) throw error; }catch(e){ showToast((e && e.message) || "Couldn't save for your team. Check your internet.", 'error'); } }, 500); }
    return r; };
  w._nf26 = true; window.nf20SaveRolePages = w; try{ nf20SaveRolePages = w; }catch(e){}
})();

/* ---------- 4. Supplier credit slips: kept with the business, photo and all ---------- */
async function nf26SlipsLoad(){
  if(!nf25Real()) return;
  try{ const { data, error } = await sb.from('supplier_credit_slips').select('id, data, proof_path').eq('business_id', myBusiness.id).order('created_at', {ascending: false}); if(error) throw error;
    const rows = data || [], paths = rows.filter(r => r.proof_path).map(r => r.proof_path); let urls = {};
    if(paths.length){ try{ const { data: signed } = await sb.storage.from('receipts').createSignedUrls(paths, 3600); (signed || []).forEach(s => { if(s.signedUrl) urls[s.path] = s.signedUrl; }); }catch(e){} }
    // slips written on this phone before this update move to the business once
    let old = []; try{ old = JSON.parse(localStorage.getItem(NF21_LOCAL()) || '[]') || []; }catch(e){}
    NF26B.slips = rows.map(r => Object.assign({}, r.data, {id: r.id, _local: true, _manual: true, _path: r.proof_path || null, _proof: r.proof_path ? (urls[r.proof_path] || null) : null}));
    const have = new Set(NF26B.slips.map(s => s.id)), move = old.filter(o => o && o.id && !have.has(o.id));
    if(move.length){ const next = move.concat(NF26B.slips); nf21SaveLocal(next); try{ localStorage.removeItem(NF21_LOCAL()); }catch(e){} }
    try{ creditMemosCache = null; const a = document.querySelector('#view-app .app-page.active'); if(a && a.id === 'page-returns') renderReturnsPage(); }catch(e){}
  }catch(e){ console.warn('nf26 slips', e); NF26B.slips = NF26B.slips || []; }
}
async function nf26SlipPush(m){
  const row = {business_id: myBusiness.id, id: String(m.id), updated_at: new Date().toISOString()};
  if(m._proof && /^data:/.test(m._proof) && !m._path){ try{ m._path = await nf26Upload(m._proof, 'credit-slips'); }catch(e){ console.warn('slip photo', e); } }
  const data = Object.assign({}, m); delete data._proof; delete data._path; row.data = data; row.proof_path = m._path || null;
  try{ row.created_by_name = (myTeamMember && myTeamMember.name) || null; }catch(e){}
  const { error } = await sb.from('supplier_credit_slips').upsert(row, {onConflict: 'business_id,id'}); if(error) throw error;
}
(function(){
  if(typeof nf21Local !== 'function') return;
  nf21Local = function(){ if(!myBusiness) return []; return (NF26B.slips || []).slice(); }; window.nf21Local = nf21Local;
  nf21SaveLocal = function(list){
    const before = NF26B.slips || [], byId = new Map(before.map(x => [String(x.id), JSON.stringify(x)]));
    NF26B.slips = (list || []).slice();
    const gone = before.filter(x => !NF26B.slips.some(y => String(y.id) === String(x.id)));
    const changed = NF26B.slips.filter(x => byId.get(String(x.id)) !== JSON.stringify(x));
    (async () => { try{
        for(const m of changed) await nf26SlipPush(m);
        for(const g of gone){ const { error } = await sb.from('supplier_credit_slips').delete().eq('business_id', myBusiness.id).eq('id', String(g.id)); if(error) throw error; }
      }catch(e){ showToast("Couldn't save that credit slip for your team. Check your internet and try again.", 'error'); console.warn('nf26 slip save', e); } })();
    return true; };
  window.nf21SaveLocal = nf21SaveLocal;
})();

/* ---------- 5. The week's post plan goes to the server, so the morning reminder really arrives ---------- */
async function nf26PlanLoad(){
  if(!nf25Real()) return;
  try{ const { data } = await sb.from('post_plans').select('plan').eq('business_id', myBusiness.id).maybeSingle();
    if(data && data.plan && Object.keys(data.plan).length){ NF26B.planRow = true; try{ localStorage.setItem('nifti-post-plan', JSON.stringify(data.plan)); }catch(e){} } }catch(e){}
}
async function nf26PlanPush(p){
  if(!nf25Real()) return;
  try{ const { error } = await sb.from('post_plans').upsert({business_id: myBusiness.id, plan: p, updated_at: new Date().toISOString()}, {onConflict: 'business_id'}); if(error) throw error; NF26B.planRow = true; }catch(e){ console.warn('nf26 post plan', e); }
}
(function(){
  const base = window.nf22SavePlan; if(typeof base !== 'function' || base._nf26) return; let t = 0;
  const w = function(p){ const r = base.apply(this, arguments); clearTimeout(t); t = setTimeout(() => nf26PlanPush(p), 600); return r; };
  w._nf26 = true; window.nf22SavePlan = w; try{ nf22SavePlan = w; }catch(e){}
})();

/* ---------- 6. Once the signed-in business is known ---------- */
async function nf26RealBoot(){
  if(!nf25Real() || NF26B.booted === myBusiness.id) return; NF26B.booted = myBusiness.id;
  await Promise.all([nf26RolePagesLoad(), nf26SlipsLoad(), nf26PlanLoad(), nf26HelpPoll()].map(p => p.catch(() => {})));
  try{ if(typeof loadMyPlan === 'function' && !myPlanInfo) await loadMyPlan(); nf26MenuPost(); }catch(e){}
  try{ if(typeof nf26StartBoot === 'function') nf26StartBoot(); }catch(e){ console.warn(e); }
  try{ const want = localStorage.getItem('nifti-want-plan'); if(want && nf20IsOwner()){ localStorage.removeItem('nifti-want-plan'); setTimeout(() => nf26OpenPlans(want), 1200); } }catch(e){}
  if(!NF26B.pollT) NF26B.pollT = setInterval(nf26HelpPoll, 120000);
}
(function(){
  const base = window.loadMyBusinessContext;
  if(typeof base === 'function' && !base._nf26){ const w = async function(){ const out = await base.apply(this, arguments); try{ setTimeout(nf26RealBoot, 50); }catch(e){} return out; };
    Object.keys(base).forEach(k => { w[k] = base[k]; }); w._nf26 = true; window.loadMyBusinessContext = w; try{ loadMyBusinessContext = w; }catch(e){} }
  // admin Help tab: the two-way inbox
  try{ renderAdminSupport = async function(body){ return nf26AdminInbox(body); }; window.renderAdminSupport = renderAdminSupport; }catch(e){}
  // links like #help, #plans and #start (from Telegram buttons and alerts) open the right thing
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf26b){ const w = function(page){
      if(page === 'help' || page === 'plans' || page === 'start'){ const inApp = (() => { try{ return !document.getElementById('view-app').classList.contains('hidden'); }catch(e){ return false; } })();
        const out = inApp ? undefined : nav.call(this, 'dashboard'); setTimeout(() => { try{ page === 'help' ? nf26Help() : page === 'plans' ? nf26OpenPlans() : nf26OpenStart(); }catch(e){} }, inApp ? 0 : 900); return out; }
      return nav.apply(this, arguments); };
    Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf26b = true; window.navigate = w; try{ navigate = w; }catch(e){} }
  const start = () => { try{ if(nf25Real()) nf26RealBoot(); }catch(e){}
    // the opening screen goes away as soon as there is something to look at
    let n = 0; const iv = setInterval(() => { n++; const b = document.getElementById('nf26Boot'); if(!b){ clearInterval(iv); return; }
      let ready = false; try{ const app = document.getElementById('view-app'); ready = n > 40 || (app && !app.classList.contains('hidden') && !!document.querySelector('#view-app .app-page.active')) || !!document.querySelector('.marketing-view:not(.hidden), #view-login:not(.hidden)'); }catch(e){ ready = true; }
      if(ready){ b.remove(); clearInterval(iv); } }, 200); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 400)); else setTimeout(start, 400);
  setTimeout(() => { try{ if(nf25Real()) nf26RealBoot(); }catch(e){} }, 4000);
})();
// the Bank page: say plainly that Nifti does not connect to the bank
function nf26BankNote(page){
  if(!page || page.id !== 'page-collections' || typeof colTab === 'undefined' || colTab !== 'cash') { const o = document.getElementById('nf26BankNote'); if(o && page && page.id === 'page-collections') o.remove(); return; }
  if(document.getElementById('nf26BankNote')) return;
  const n = document.createElement('p'); n.id = 'nf26BankNote'; n.className = 'nf26-banknote';
  n.textContent = "Nifti doesn't connect to your bank or GCash. Upload the statement they give you and Nifti matches each line to your records.";
  const head = page.querySelector(':scope > .page-head'); page.insertBefore(n, head ? head.nextSibling : page.firstChild);
}
