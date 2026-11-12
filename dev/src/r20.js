/* ===== Round 20 ===== */

/* ---------- 1. Signing in: say what went wrong in plain words ---------- */
// The browser fills in a password saved for another app on the same web address, and Nifti answered
// with Supabase's own "Invalid login credentials". Now it says what that means and what to do next.
function nf20SignInError(el, error){
  const m = String((error && error.message) || error || '');
  if(/invalid login credentials/i.test(m)){
    el.innerHTML = `No Nifti account uses that email and password. If your browser filled them in, they may be saved from another app. `
      + `<a onclick="nf20ToSignup()" style="cursor:pointer;text-decoration:underline;">Create a Nifti account</a> or <a onclick="toggleAccountRecovery()" style="cursor:pointer;text-decoration:underline;">reset your password</a>.`;
    return;
  }
  if(/email not confirmed/i.test(m)){ el.textContent = 'Open the email we sent you and tap the link first, then sign in.'; return; }
  if(/failed to fetch|network/i.test(m)){ el.textContent = "Can't reach Nifti right now. Check your internet and try again."; return; }
  el.textContent = m;
}
function nf20ToSignup(){ const b = document.querySelectorAll('#view-login .tabs button')[1]; if(b && typeof setLoginTab === 'function') setLoginTab('signup', b); }

/* ---------- 2. The owner's left menu: every page, in groups you can fold ---------- */
const NF20_GROUPS = [
  {k: 'main', label: '', items: [['dashboard', 'Home'], ['orders', 'Orders'], ['messages', 'Messages'], ['inventory', 'Stock']]},
  {k: 'money', label: 'Money', items: [['money', 'Money overview'], ['sales', 'Counter'], ['expenses', 'Expenses'], ['collections', 'Getting paid'], ['profit', 'Prices'], ['issues', 'To check'], ['payroll', 'Payroll'], ['ledger', 'Books']]},
  {k: 'sell', label: 'Selling & delivery', items: [['followups', 'Follow-ups'], ['routes', 'Deliveries'], ['returns', 'Returns & credits'], ['store', 'Online store'], ['discover', 'Find customers']]},
  {k: 'more', label: 'Checks, taxes & team', items: [['cheques', 'Checks'], ['books', 'Tax books'], ['taxforms', 'BIR 2307s'], ['team', 'Team']]}
];
const NF20_PAGES = NF20_GROUPS.flatMap(g => g.items.map(x => x[0]));
// pages that were folded into another page go with it
const NF20_PARENT = {cashcount: 'sales', prices: 'profit', watchdog: 'issues', analytics: 'money', close: 'ledger', suppliers: 'orders', invite: 'orders'};
const NF20_FOLD_KEY = 'nifti-menu-fold';
function nf20Folded(){ try{ return JSON.parse(localStorage.getItem(NF20_FOLD_KEY) || '{}') || {}; }catch(e){ return {}; } }
function nf20Fold(k){ const f = nf20Folded(); f[k] = !f[k]; try{ localStorage.setItem(NF20_FOLD_KEY, JSON.stringify(f)); }catch(e){}
  const g = document.querySelector('.sidebar .nf20-g[data-g="' + k + '"]'); if(g){ g.classList.toggle('folded', !!f[k]); const h = g.querySelector('.nf20-h'); if(h) h.setAttribute('aria-expanded', String(!f[k])); } }
function nf20IsOwner(){ try{ return getCurrentUserRoles().includes('Owner'); }catch(e){ return true; } }
function nf20Menu(){
  const sb = document.querySelector('.sidebar'); if(!sb) return;
  let box = sb.querySelector('.nf19-nav');
  if(!box){ const firstGroup = sb.querySelector('.nav-group'); if(!firstGroup) return;
    box = document.createElement('div'); box.className = 'nav-group nf19-nav'; firstGroup.parentElement.insertBefore(box, firstGroup); }
  const want = 'nf20:' + NF20_PAGES.join(',');
  if(box.dataset.k !== want){
    const folded = nf20Folded();
    const keep = [...box.querySelectorAll('.nav-item[data-page]')];
    box.innerHTML = ''; box.classList.add('nf20-nav');
    NF20_GROUPS.forEach(g => {
      const wrap = document.createElement('div'); wrap.className = 'nf20-g' + (folded[g.k] && g.label ? ' folded' : ''); wrap.dataset.g = g.k;
      if(g.label){ const h = document.createElement('button'); h.type = 'button'; h.className = 'heading nf19-h nf20-h'; h.setAttribute('aria-expanded', String(!folded[g.k]));
        h.innerHTML = `<span>${g.label}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
        h.onclick = () => nf20Fold(g.k); wrap.appendChild(h); }
      const list = document.createElement('div'); list.className = 'nf20-gi';
      g.items.forEach(([p, label]) => {
        const it = keep.find(x => x.dataset.page === p && !x.closest('.nf20-gi')) || [...sb.querySelectorAll('.nav-item[data-page="' + p + '"]')].find(x => !x.closest('.nf20-gi'));
        if(!it) return;
        it.classList.remove('nf18-off'); it.classList.add('nf19-on');
        // "Bank & deposits" also says data-page="collections"; only the real Getting paid line goes in
        if(p === 'collections' && /colTab/.test(it.getAttribute('onclick') || '')) return;
        const span = it.querySelector('span:not(.nav-badge)'); if(span) span.textContent = label;
        list.appendChild(it);
      });
      wrap.appendChild(list); box.appendChild(wrap);
    });
    const who = document.createElement('button'); who.type = 'button'; who.className = 'nf20-who'; who.id = 'nf20WhoLink';
    who.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M17 11l2 2 3.5-3.5"/></svg><span>Who sees what</span>`;
    who.onclick = () => nf20OpenWho(); box.appendChild(who);
    box.dataset.k = want;
  }
  sb.querySelectorAll('.nav-item[data-page]').forEach(n => { const on = !!n.closest('.nf20-gi'); if(n.classList.contains('nf18-off') === on) n.classList.toggle('nf18-off', !on); });
  sb.querySelectorAll('.heading, .nav-fold').forEach(h => { const on = !!h.closest('.nf19-nav'); if(h.classList.contains('nf18-off') === on) h.classList.toggle('nf18-off', !on); });
  nf20MenuRoles();
}
// a staff member only sees their own pages; a group with nothing in it hides its heading too
function nf20MenuRoles(){
  document.querySelectorAll('.sidebar .nf20-g').forEach(g => {
    const any = [...g.querySelectorAll('.nav-item[data-page]')].some(n => n.style.display !== 'none');
    if(g.classList.contains('nf20-empty') === any) g.classList.toggle('nf20-empty', !any);
  });
  const who = document.getElementById('nf20WhoLink'); let show = true;
  try{ show = isPrivilegedUser() && !previewRole; }catch(e){}
  if(who && who.hidden === show) who.hidden = !show;
}
function nf20Active(page){
  const target = NF20_PAGES.includes(page) ? page : (NF20_PARENT[page] || page);
  document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(n => { const on = n.classList.contains('nf19-on') && n.dataset.page === target; if(n.classList.contains('active') !== on) n.classList.toggle('active', on); });
  const hub = (typeof nf18HubOf === 'function' && nf18HubOf(page)) || page;
  document.querySelectorAll('#bottomNav .bnav-item[data-page]').forEach(n => { const on = n.dataset.page === hub; if(n.classList.contains('active') !== on) n.classList.toggle('active', on); });
  // an open group follows you: if you land on a page inside a folded group, the group opens
  const it = document.querySelector('.sidebar .nf20-g.folded .nav-item.active'); if(it){ const g = it.closest('.nf20-g'); if(g) nf20Fold(g.dataset.g); }
}

/* ---------- 3. Who sees what: the owner picks every page each role can open ---------- */
// The roles were already there (Owner, General Manager, Purchasing Agent, Warehouse Manager, Cashier,
// Finance, Driver, Viewer, plus your own), but the pages each one sees were fixed in the code and the
// "preview" lived in a menu nobody found. Now it's one panel: pick a role, switch pages on or off,
// and see Nifti exactly as they would.
const NF20_ALSO = {sales: ['cashcount'], profit: ['prices'], issues: ['watchdog'], money: ['analytics'], ledger: ['close'], orders: ['suppliers', 'invite']};
const NF20_RP = () => 'nifti-role-pages-' + ((typeof myBusiness !== 'undefined' && myBusiness && myBusiness.id) || 'demo');
const NF20W = {role: null};
function nf20LoadRolePages(){
  try{ const o = JSON.parse(localStorage.getItem(NF20_RP()) || 'null'); if(!o) return;
    Object.entries(o).forEach(([r, pages]) => { if(r !== 'Owner' && r in ROLE_PERMISSIONS && Array.isArray(pages)) ROLE_PERMISSIONS[r] = pages; }); }catch(e){}
}
function nf20SaveRolePages(){
  const o = {}; Object.keys(ROLE_PERMISSIONS).forEach(r => { if(r !== 'Owner' && Array.isArray(ROLE_PERMISSIONS[r])) o[r] = ROLE_PERMISSIONS[r]; });
  try{ localStorage.setItem(NF20_RP(), JSON.stringify(o)); }catch(e){}
}
function nf20Roles(){ try{ return getAllRoleNames().filter(r => r !== 'Owner'); }catch(e){ return []; } }
function nf20RolePages(role){ const a = getRoleAllowedPages(role); return a === null ? null : (a || []); }
function nf20Has(role, p){ const a = nf20RolePages(role); return a === null || a.includes(p); }
function nf20People(role){ try{ return getActiveTeamMembers().filter(m => (m.roles || []).includes(role)).map(m => String(m.name || '').replace(/\s*\(You\)\s*/, '')); }catch(e){ return []; } }
function nf20OpenWho(role){
  if(typeof closeUserMenu === 'function') try{ closeUserMenu(); }catch(e){}
  const roles = nf20Roles(); NF20W.role = role || NF20W.role || roles.find(r => r === 'Cashier') || roles[0];
  let ov = document.getElementById('nf20Who');
  if(!ov){ ov = document.createElement('div'); ov.id = 'nf20Who'; ov.className = 'nf20-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Who sees what');
    ov.addEventListener('click', e => { if(e.target === ov) nf20CloseWho(); }); document.body.appendChild(ov); }
  ov.hidden = false; document.body.classList.add('nf20-noscroll'); nf20PaintWho();
}
function nf20CloseWho(){ const ov = document.getElementById('nf20Who'); if(ov) ov.hidden = true; document.body.classList.remove('nf20-noscroll'); }
function nf20PaintWho(){
  const ov = document.getElementById('nf20Who'); if(!ov) return;
  const roles = nf20Roles(), role = NF20W.role, owner = nf20IsOwner(), all = nf20RolePages(role) === null;
  const people = nf20People(role), custom = (customRoles || []).some(r => r.name === role);
  const count = NF20_PAGES.filter(p => nf20Has(role, p)).length;
  const row = ([p, label]) => { const on = nf20Has(role, p), lock = p === 'dashboard';
    return `<label class="nf20-pr${lock ? ' lock' : ''}"><span>${label}${lock ? '<small>Everyone has Home</small>' : ''}</span>
      <input type="checkbox" role="switch" ${on ? 'checked' : ''} ${lock || !owner ? 'disabled' : ''} onchange="nf20Toggle('${p}', this.checked)"><i aria-hidden="true"></i></label>`; };
  ov.innerHTML = `<div class="nf20-sheet">
    <div class="nf20-sh"><div><h2>Who sees what</h2><p>You're the owner, so you always see every page. Pick a role, then switch pages on or off for them.</p></div>
      <button type="button" class="nf20-x" onclick="nf20CloseWho()" aria-label="Close">✕</button></div>
    <div class="nf20-roles" role="tablist">${roles.map(r => `<button type="button" role="tab" class="${r === role ? 'on' : ''}" aria-selected="${r === role}" onclick="NF20W.role='${r.replace(/'/g, "\\'")}'; nf20PaintWho()">${escapeHtml(r)}<b>${NF20_PAGES.filter(p => nf20Has(r, p)).length}</b></button>`).join('')}
      ${owner ? `<button type="button" class="nf20-newrole" onclick="nf20NewRole()">+ New role</button>` : ''}</div>
    <div class="nf20-rc">
      <div class="nf20-rch"><div><b>${escapeHtml(role || '')}</b><small>${people.length ? `${people.length} ${people.length === 1 ? 'person' : 'people'}: ${people.map(escapeHtml).join(', ')}` : 'Nobody has this role yet'} · sees ${count} of ${NF20_PAGES.length} pages</small></div>
        <button type="button" class="btn btn-outline" onclick="nf20Preview('${(role || '').replace(/'/g, "\\'")}')">See Nifti as ${/^[AEIOU]/i.test(role || '') ? 'an' : 'a'} ${escapeHtml(role || '')}</button></div>
      ${all ? `<p class="nf20-note">This role sees everything, like you. Switch a page off to hide it from them.</p>` : ''}
      <div class="nf20-pg">${NF20_GROUPS.map(g => `<section><h3>${g.label || 'Main pages'}</h3>${g.items.map(row).join('')}</section>`).join('')}</div>
      <div class="nf20-quick">${owner ? `<button type="button" class="nf20-lnk" onclick="nf20SetAll(true)">Turn all on</button><button type="button" class="nf20-lnk" onclick="nf20SetAll(false)">Turn all off</button>${custom ? `<button type="button" class="nf20-lnk bad" onclick="nf20RemoveRole()">Remove this role</button>` : ''}` : '<span>Only the owner can change these.</span>'}</div>
    </div>
    <div class="nf20-sf"><span>${myBusiness ? 'Changes save as you tap (prototype: saved on this device until staff accounts sync).' : 'Changes save as you tap.'}</span><button type="button" class="btn btn-primary" onclick="nf20CloseWho()">Done</button></div>
  </div>`;
  const rr = ov.querySelector('.nf20-roles'), on = rr && rr.querySelector('button.on');
  if(on && rr.scrollWidth > rr.clientWidth) rr.scrollLeft = Math.max(0, on.offsetLeft - rr.offsetLeft - 16);
}
async function nf20Store(role, pages){
  const c = (customRoles || []).find(r => r.name === role);
  if(c){ c.allowedPages = pages;
    if(myBusiness && c.rowId){ try{ const {error} = await sb.from('custom_roles').update({allowed_pages: pages}).eq('id', c.rowId); if(error) throw error; }catch(e){ showToast("Couldn't save that change. Try again.", 'error'); } } }
  else { ROLE_PERMISSIONS[role] = pages; nf20SaveRolePages(); }
  try{ logAudit('role_pages_changed', 'role', role, 'allowedPages', null, pages.join(', ')); }catch(e){}
  try{ renderSidebarForViewAsRole(); }catch(e){}
}
function nf20Expand(p){ return [p, ...(NF20_ALSO[p] || [])]; }
function nf20Toggle(p, on){
  if(!nf20IsOwner()) return;
  const role = NF20W.role, cur = nf20RolePages(role);
  let pages = cur === null ? NF20_PAGES.flatMap(nf20Expand).concat(['settings']) : cur.slice();
  pages = pages.filter(x => !nf20Expand(p).includes(x)); if(on) pages.push(...nf20Expand(p));
  if(!pages.includes('dashboard')) pages.unshift('dashboard');
  nf20Store(role, [...new Set(pages)]); nf20PaintWho();
}
function nf20SetAll(on){ if(!nf20IsOwner()) return; nf20Store(NF20W.role, on ? [...new Set(NF20_PAGES.flatMap(nf20Expand))] : ['dashboard']); nf20PaintWho(); }
async function nf20NewRole(){
  const name = (prompt('Name the new role, e.g. Chat Manager or Helper') || '').trim(); if(!name) return;
  if(getAllRoleNames().some(r => r.toLowerCase() === name.toLowerCase())){ showToast('A role with that name already exists.'); return; }
  const pages = ['dashboard', 'messages'];
  if(myBusiness){ const {data, error} = await sb.from('custom_roles').insert({business_id: myBusiness.id, name, allowed_pages: pages}).select().single();
    if(error){ showToast("Couldn't create that role. Try again.", 'error'); return; } customRoles.push({name: data.name, allowedPages: data.allowed_pages, rowId: data.id}); }
  else customRoles.push({name, allowedPages: pages});
  try{ logAudit('custom_role_created', 'role', name, 'allowedPages', null, pages.join(', ')); renderCustomRolesList(); }catch(e){}
  NF20W.role = name; nf20PaintWho(); showNotificationToast(`"${name}" made. It starts with Home and Messages; switch on what they need.`);
}
function nf20RemoveRole(){ const r = NF20W.role; if(!confirm(`Remove the "${r}" role? Anyone who has it keeps their other roles.`)) return;
  Promise.resolve(removeCustomRole(r)).then(() => { NF20W.role = null; nf20PaintWho(); }); }
function nf20Preview(role){ nf20CloseWho(); try{ setPreviewRole(role); }catch(e){} nf20Banner(); }
function nf20ExitPreview(){ try{ previewRole = null; renderSidebarForViewAsRole(); renderViewAsRoleMenu(); }catch(e){} nf20Banner(); nf20MenuRoles();
  const a = document.querySelector('#view-app .app-page.active'); try{ navigate(a ? a.id.slice(5) : 'dashboard'); }catch(e){} showNotificationToast('Back to your own view.'); }
function nf20Banner(){
  let b = document.getElementById('nf20Prev'); let role = null; try{ role = previewRole; }catch(e){}
  if(!role){ if(b) b.remove(); document.body.classList.remove('nf20-previewing'); return; }
  if(!b){ b = document.createElement('div'); b.id = 'nf20Prev'; b.className = 'nf20-prev'; document.body.appendChild(b); }
  b.innerHTML = `<span>You're seeing Nifti as ${/^[AEIOU]/i.test(role) ? 'an' : 'a'} <b>${escapeHtml(role)}</b>. Only their pages show.</span><button type="button" onclick="nf20OpenWho('${role.replace(/'/g, "\\'")}')">Change their pages</button><button type="button" class="on" onclick="nf20ExitPreview()">Back to my view</button>`;
  document.body.classList.add('nf20-previewing'); nf20MenuRoles();
}

/* ---------- 4. Tabs on top: a coloured band with the section name and big pills ---------- */
const NF20_HUB_ICON = {orders: 'orders', messages: 'messages', money: 'money'};
function nf20Icon(page){ const s = document.querySelector('.sidebar .nav-item[data-page="' + page + '"] svg'); return s ? s.outerHTML : ''; }
function nf20HubHtml(page){
  const hub = nf18HubOf(page), H = hub && NF18_HUBS[hub]; if(!H || !H.tabs) return '';
  const cur = nf18TabOf(page);
  const tabs = H.tabs.filter(([p]) => { try{ return isPageAllowedForViewAsRole(p); }catch(e){ return true; } });
  if(tabs.length < 2) return '';
  let html = `<div class="nf20-band"><div class="nf20-bk"><span class="nf20-bi">${nf20Icon(NF20_HUB_ICON[hub] || hub)}</span><div><b>${H.label}</b><small>${tabs.length} pages here</small></div></div>`
    + `<nav class="nf18-hub nf20-pills" aria-label="${H.label} pages">${tabs.map(([p, l]) => `<button type="button" class="${p === cur ? 'on' : ''}" aria-current="${p === cur ? 'page' : 'false'}" onclick="go('${p}')">${l}</button>`).join('')}</nav>`;
  const sub = Object.values(NF18_SUB).find(s => s.pages.includes(page));
  if(sub){ const on = page === 'cheques' ? 'cheques' : page === 'collections' ? ((typeof colTab !== 'undefined' && colTab === 'cash') ? 'cash' : 'follow') : page;
    const st = sub.tabs.filter(([k]) => { const p = sub === NF18_SUB.paid ? (k === 'cheques' ? 'cheques' : 'collections') : k; try{ return isPageAllowedForViewAsRole(p); }catch(e){ return true; } });
    if(st.length > 1) html += `<nav class="nf18-sub nf20-subp" aria-label="More"><em>In ${escapeHtml((H.tabs.find(t => t[0] === cur) || [])[1] || '')}:</em>${st.map(([k, l]) => `<button type="button" class="${k === on ? 'on' : ''}" onclick="${sub === NF18_SUB.paid ? `nf18GoPaid('${k}')` : `go('${k}')`}">${l}</button>`).join('')}</nav>`; }
  return html + '</div>';
}

/* ---------- 5. Orders: customers on the left, suppliers on the right, no switching ---------- */
const NF20_ARROW = {c: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>', s: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M17 7 7 17M16 17H7V8"/></svg>'};
function nf20ColMoney(sell, rows){
  const ids = [...new Set(rows.map(r => r.pid))]; let sum = 0;
  ids.forEach(id => { try{ const p = nfoPerson(sell, id, ''); sum += (p.owe || 0) + (sell ? (p.unbilled || 0) : 0); }catch(e){} });
  return sum;
}
function nf20Idle(sell, all){
  const busy = new Set(all.filter(r => r.sell === sell).map(r => r.pid)), q = NFO.q.trim().toLowerCase();
  const list = ((sell ? buyersData : suppliersData) || []).filter(s => !busy.has(s.id) && (!q || String(s.name || '').toLowerCase().includes(q)));
  const row = s => { let p = {}; try{ p = nfoPerson(sell, s.id, s.name); }catch(e){}
    return `<div class="nfo-pp"><span class="nfo-ppa">${nfoAv(s.name)}</span><div class="nfo-ppm"><div class="nm"><b>${nfoE(s.name)}</b></div><div class="fx">${[s.category ? nfoE(s.category) : '', nfoFacts(p, sell)].filter(Boolean).join(' · ')}</div></div>
      <div class="nfo-ppb">${s.isOutside ? `<button type="button" class="btn btn-outline btn-sm" onclick="currentAppRole='${sell ? 'supplier' : 'buyer'}'; resendInvite('${s.id}')">Invite to Nifti</button>` : `<button type="button" class="btn btn-outline btn-sm" onclick="nfoChat('${s.id}', ${sell})">Message</button>`}
        <button type="button" class="btn btn-outline btn-sm" onclick="nfoNew(${sell}, '${s.id}')">New order</button></div></div>`; };
  return `<div class="nf20-idle"${sell ? ' id="nfoPeople"' : ''}><div class="nf20-ih"><b>No open orders</b><button type="button" class="nfc-link" onclick="nfoInvite(${sell})">+ Invite ${sell ? 'a customer' : 'a supplier'}</button></div>
    ${list.length ? list.map(row).join('') : `<p class="nfo-none">Every ${sell ? 'customer' : 'supplier'} has an order going.</p>`}</div>`;
}
function nf20Col(sell, all, vis){
  const k = sell ? 'c' : 's', mine = vis.filter(r => r.sell === sell), G = nfoGroups(mine), money = nf20ColMoney(sell, all.filter(r => r.sell === sell));
  const ppl = new Set(mine.map(r => r.pid)).size;
  const bands = NFO_BANDS.map(([b, h]) => { const g = G.filter(x => x.band === b); if(!g.length) return '';
    return `<div class="nfo-band b-${b}"><span>${h}</span><b>${mine.filter(r => r.band === b).length}</b></div>${typeof nfoCapGroups === 'function' ? nfoCapGroups(b, g) : g.map(nfoGroupHtml).join('')}`; }).join('');
  return `<section class="nf20-col ${k}" id="nf20Col${k.toUpperCase()}">
    <header class="nf20-ch"><span class="nf20-ci">${NF20_ARROW[k]}</span><div class="nf20-ct"><b>${sell ? 'Selling to customers' : 'Buying from suppliers'}</b><small>${mine.length} order${mine.length === 1 ? '' : 's'} · ${ppl} ${sell ? (ppl === 1 ? 'customer' : 'customers') : (ppl === 1 ? 'supplier' : 'suppliers')}</small></div>
      <div class="nf20-cm"><b>${nfoPeso(money)}</b><small>${sell ? 'owed to you' : 'you owe'}</small></div>
      <button type="button" class="btn btn-sm nf20-new" onclick="nfoNew(${sell})">+ New order</button></header>
    <div class="nfo-card">${bands || `<div class="nfo-empty">${NFO.q || NFO.band ? 'Nothing matches here.' : `No ${sell ? 'customer' : 'supplier'} orders going.`} <button type="button" onclick="nfoNew(${sell})">+ New order</button></div>`}</div>
    ${nf20Idle(sell, all)}
  </section>`;
}
function nf20Jump(k){ const el = document.getElementById('nf20Col' + k.toUpperCase()); if(el) el.scrollIntoView({behavior: 'smooth', block: 'start'}); }
function nf20OrdersPaint(){
  const host = document.getElementById('nfOrd'); if(!host) return;
  NFO.side = 'all';
  const all = nfoAll(), seen = all.filter(nfoMatch), vis = seen.filter(r => !NFO.band || r.band === NFO.band);
  const st = document.getElementById('nfoStats');
  if(st) st.innerHTML = NFO_BANDS.map(([b, l]) => { const rs = seen.filter(r => r.band === b), sum = rs.reduce((a, r) => a + (Number(r.amt) || 0), 0);
    return `<button type="button" class="nfo-st s-${b}${NFO.band === b ? ' on' : ''}" aria-pressed="${NFO.band === b}" onclick="nfoSet('band','${b}')"><span class="k"><i></i>${l}</span><span class="ln"><b>${rs.length}<span> order${rs.length === 1 ? '' : 's'}</span></b><em${rs.length ? '' : ' class="z"'}>${rs.length ? nfoPeso(sum) : 'Nothing'}</em></span></button>`; }).join('');
  const jp = document.getElementById('nf20Jump');
  if(jp) jp.innerHTML = `<button type="button" class="c" onclick="nf20Jump('c')">${NF20_ARROW.c}Customers <b>${vis.filter(r => r.sell).length}</b></button><button type="button" class="s" onclick="nf20Jump('s')">${NF20_ARROW.s}Suppliers <b>${vis.filter(r => !r.sell).length}</b></button>`;
  const body = document.getElementById('nfoBody');
  if(body) body.innerHTML = `<div class="nf20-cols">${nf20Col(true, all, vis)}${nf20Col(false, all, vis)}</div>
    <div class="nfo-key"><span><i class="k-red"></i>Late or today: do it now</span><span><i class="k-yel"></i>Coming up</span><span><i class="k-blue"></i>Waiting on them</span><span><i class="k-green"></i>Done</span><span><i class="k-today"></i>Today</span></div>`;
  const pp = document.getElementById('nfoPeopleWrap'); if(pp) pp.innerHTML = '';
}
function nf20OrdersRender(){
  const pg = document.getElementById('page-orders'); if(!pg) return;
  pg.classList.add('nfo-on', 'nf20-two'); pg.classList.toggle('nfo-table', NFO.table);
  let host = document.getElementById('nfOrd'); if(!host){ host = document.createElement('div'); host.id = 'nfOrd'; const hw = pg.querySelector(':scope > .nf18-hubwrap'); pg.insertBefore(host, hw ? hw.nextSibling : pg.firstChild); }
  const a = document.activeElement, typing = a && a.id === 'nfoQ', pos = typing ? a.selectionStart : 0;
  const t = new Date(APP_TODAY + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'});
  const html = `<div class="nfo-top"><div><h1>Orders</h1><p>Customers on the left, suppliers on the right. Today is <b>${t}</b>.</p></div></div>
    <div class="nfo-stats" id="nfoStats"></div>
    <div class="nfo-flt nf20-flt"><label class="nfo-q"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="nfoQ" type="search" placeholder="Search name, order # or item" value="${nfoE(NFO.q)}" autocomplete="off" oninput="NFO.q=this.value; nfoPaint()"></label></div>
    <div class="nf20-jump" id="nf20Jump"></div>
    <div id="nfoBody"></div>
    <div id="nfoPeopleWrap"></div>
    <button type="button" class="nfo-tbl" id="nfoTblBtn" onclick="nfoTable()">${NFO.table ? 'Hide the table' : 'See every order in a table, with filters and export'}</button>`;
  host.innerHTML = html;
  nf20OrdersPaint();
  if(typing){ const q = document.getElementById('nfoQ'); if(q){ q.focus(); try{ q.setSelectionRange(pos, pos); }catch(e){} } }
}

/* ---------- 6. Tables inside a half: clean cards (label left, value right, buttons on their own line) ---------- */
function nf20Cells(){
  document.querySelectorAll('#view-app .nf-half table.nf-cardtable tbody td').forEach(td => {
    if(td.dataset.nf20) return; td.dataset.nf20 = '1';
    const act = !!td.querySelector('button, .btn, .row-action, a.sl-link');
    const txt = td.textContent.replace(/\s+/g, ' ').trim();
    if(act && td === td.parentElement.lastElementChild) td.classList.add('nf20-act');
    else if(!txt || txt === '—' || txt === '-') td.classList.add('nf20-none');
  });
}

/* ---------- 7. The landing page: shorter, with one "see it in action" showcase ---------- */
// It was 9 long blocks of features, each with a Free or Pro badge. Now: what it is, how it works,
// one showcase you can click through, before and after, questions, and the button to try it.
const NF20_SHOW = [
  ['Orders from any chat', 'Orders from chat', 'chat'], ['Know exactly who owes you', 'Who owes you', 'peso'], ['Routes your drivers', 'Driver routes', 'truck'],
  ['Cheques you never miss', 'Checks', 'check'], ['Order from every supplier', 'Buying', 'cart'], ['Know when staff overpay', 'Staff overspending', 'shield'],
  ['Your own store', 'Your own store', 'store'], ['__books', 'Books', 'book']
];
const NF20_SICON = {
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z"/>',
  peso: '<path d="M7 20V4h6a4 4 0 0 1 0 8H7"/><path d="M4 8h16M4 11h16"/>',
  truck: '<rect x="1" y="7" width="13" height="10" rx="1"/><path d="M14 10h4l3 3v4h-7"/><circle cx="5.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
  check: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 14h6M15 14h3M6 10h12"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M8 7h8M8 11h6"/>'
};
const NF20S = {i: 0, t: 0, stop: false};
function nf20BooksPanel(){
  return `<div class="f4-spot-t"><h3>Books that keep themselves</h3><p>Every sale, expense and payment lands in proper books. You always know your profit, your cash, and what to check.</p>
    <ul class="m2-ticks"><li>Counter sales and expenses with a receipt photo</li><li>Cash short, missing stock and odd bills flagged, each with the reason</li><li>Profit and loss, ready for your accountant</li></ul>
    <div class="f4-out"><b>₱38,400</b><span>real profit this month, not a guess</span></div></div>
  <div class="f4-art green"><div class="f4-main"><div class="mk-stack">
    <div class="mk-bigstat"><small>PROFIT THIS MONTH</small><b>₱38,400</b><span>Sales ₱212,000 · costs ₱173,600</span></div>
    <div class="mk-owe"><div><b>Cash count, Tuesday</b><small>₱450 short · counted by Joy</small></div><span class="mk-btnsm p">Check</span></div>
    <div class="mk-owe"><div><b>Electric bill</b><small>32% higher than usual</small></div><span class="mk-btnsm">See why</span></div>
    <div class="mk-owe"><div><b>August books</b><small>closed · sent to accountant</small></div><span class="mk-green">✓</span></div>
  </div></div></div>`;
}
function nf20Landing(){
  const v = document.getElementById('view-index'), pick = document.getElementById('mkPick');
  if(!v || !pick || v.dataset.nf20) return;
  const spots = [...pick.querySelectorAll('.f4-spot')], find = t => spots.find(s => { const h = s.querySelector('h3'); return h && h.textContent.indexOf(t) === 0; });
  const panels = NF20_SHOW.map(([t, label, ic]) => {
    let inner = '';
    if(t === '__books') inner = nf20BooksPanel();
    else { const s = find(t); if(!s) return null; const c = s.cloneNode(true);
      c.querySelectorAll('.m2-badge').forEach(b => b.remove());
      c.querySelectorAll('.m2-ticks li').forEach(li => { li.textContent = li.textContent.replace(/\s*\(Pro\)\s*$/i, ''); });
      inner = c.innerHTML; }
    return {label, ic, inner};
  }).filter(Boolean);
  // How it works: keep the 3 steps and the 3 numbers
  const sell = document.getElementById('mkSell');
  const how = document.createElement('section'); how.className = 'nf20-how'; how.id = 'mkHowItWorks';
  const wrap = document.createElement('div'); wrap.className = 'wrap'; how.appendChild(wrap);
  if(sell){ const h = sell.querySelector('.f5-head'), f = sell.querySelector('.h4-flow'), n = sell.querySelector('.h4-facts'); [h, f, n].forEach(x => { if(x) wrap.appendChild(x); }); }
  const show = document.createElement('section'); show.className = 'nf20-show'; show.id = 'mkShow';
  show.innerHTML = `<div class="wrap"><div class="f5-head"><div class="p2-burst">SEE IT IN ACTION</div><h2>Everything between the order <span>and the payment.</span></h2><p>Selling, buying and your books, in one app. Tap any of these.</p></div>
    <div class="nf20-stabs" role="tablist" aria-label="Features">${panels.map((p, i) => `<button type="button" role="tab" id="nf20St${i}" aria-controls="nf20Sp${i}" aria-selected="${i === 0}" class="${i === 0 ? 'on' : ''}" onclick="nf20ShowGo(${i}, true)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NF20_SICON[p.ic]}</svg><span>${p.label}</span><i></i></button>`).join('')}</div>
    <div class="nf20-stage">${panels.map((p, i) => `<div class="f4-spot nf20-sp${i === 0 ? ' on' : ''}" role="tabpanel" id="nf20Sp${i}" aria-labelledby="nf20St${i}"${i === 0 ? '' : ' hidden'}>${p.inner}</div>`).join('')}</div></div>`;
  pick.replaceWith(how); how.after(show);
  const free = document.getElementById('mkFree'); if(free) free.remove();
  v.dataset.nf20 = '1';
  let reduce = false; try{ reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
  if(!reduce) nf20ShowTimer();
  show.addEventListener('pointerenter', () => { clearTimeout(NF20S.t); }); show.addEventListener('pointerleave', () => { if(!NF20S.stop && !reduce) nf20ShowTimer(); });
}
function nf20ShowTimer(){ clearTimeout(NF20S.t); NF20S.t = setTimeout(() => { const v = document.getElementById('view-index'); if(NF20S.stop) return;
  if(v && !v.classList.contains('hidden')){ const n = document.querySelectorAll('#mkShow .nf20-sp').length; nf20ShowGo((NF20S.i + 1) % n); } nf20ShowTimer(); }, 7000); }
function nf20ShowGo(i, user){
  NF20S.i = i; if(user){ NF20S.stop = true; clearTimeout(NF20S.t); }
  document.querySelectorAll('#mkShow .nf20-stabs button').forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', String(k === i)); });
  document.querySelectorAll('#mkShow .nf20-sp').forEach((p, k) => { p.hidden = k !== i; p.classList.toggle('on', k === i); });
  const b = document.getElementById('nf20St' + i), row = b && b.parentElement; if(row && row.scrollWidth > row.clientWidth) row.scrollTo({left: Math.max(0, b.offsetLeft - row.offsetLeft - 24), behavior: user ? 'smooth' : 'auto'});
}

/* ---------- wiring ---------- */
(function(){
  try{ nf20LoadRolePages(); }catch(e){}
  try{ nf19Menu = nf20Menu; window.nf19Menu = nf20Menu; }catch(e){}
  try{ nf19Active = nf20Active; window.nf19Active = nf20Active; nf18Active = nf20Active; window.nf18Active = nf20Active; }catch(e){}
  try{ nf18HubHtml = nf20HubHtml; window.nf18HubHtml = nf20HubHtml; }catch(e){}
  try{ nfoRender = nf20OrdersRender; window.nfoRender = nf20OrdersRender; nfoPaint = nf20OrdersPaint; window.nfoPaint = nf20OrdersPaint; }catch(e){}
  try{ const base = nfCardTables; nfCardTables = function(){ base.apply(this, arguments); try{ nf20Cells(); }catch(e){} }; }catch(e){}
  // the role menu hides pages; keep the group headings and the menu in step
  const rs = window.renderSidebarForViewAsRole;
  if(typeof rs === 'function' && !rs._nf20){ const w = function(){ const r = rs.apply(this, arguments); try{ nf20MenuRoles(); const a = document.querySelector('#view-app .app-page.active'); if(a) nf18PaintHub(a.id.slice(5)); }catch(e){} return r; };
    w._nf20 = true; window.renderSidebarForViewAsRole = w; try{ renderSidebarForViewAsRole = w; }catch(e){} }
  const sp = window.setPreviewRole;
  if(typeof sp === 'function' && !sp._nf20){ const w = function(){ const r = sp.apply(this, arguments); try{ nf20Banner(); }catch(e){} return r; }; w._nf20 = true; window.setPreviewRole = w; try{ setPreviewRole = w; }catch(e){} }
  // the Orders badge counted one side only (whichever view loaded last: 7 on Home, 2 on Orders);
  // both sides show on Orders now, so the badge is the "Needs you now" number from that page
  const ob = window.updateOpenItemsBadge;
  if(typeof ob === 'function' && !ob._nf20){ const w = function(){ const r = ob.apply(this, arguments);
      try{ const n = nfoAll().filter(x => x.band === 'red').length, nb = document.getElementById('ordersNavBadge');
        if(nb){ const d = n > 0 ? 'inline-flex' : 'none'; if(nb.style.display !== d) nb.style.display = d; if(nb.textContent !== String(n)) nb.textContent = n; } }catch(e){}
      return r; };
    w._nf20 = true; window.updateOpenItemsBadge = w; try{ updateOpenItemsBadge = w; }catch(e){} }
  // Team page and the account menu open Who sees what too
  const addEntry = () => {
    const head = document.querySelector('#page-team .page-head > button'); if(head && !document.getElementById('nf20TeamWho')){ const b = document.createElement('button'); b.id = 'nf20TeamWho'; b.className = 'btn btn-outline'; b.textContent = 'Who sees what'; b.onclick = () => nf20OpenWho(); head.parentElement.insertBefore(b, head); }
    // phone: a Menu button opens the full list of pages
    const bn = document.getElementById('bottomNav');
    if(bn){ let mb = document.getElementById('nf20MenuBtn');
      if(!mb){ mb = document.createElement('button'); mb.type = 'button'; mb.className = 'bnav-item'; mb.id = 'nf20MenuBtn'; mb.setAttribute('aria-label', 'All pages');
        mb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span class="bnav-label">Menu</span>';
        mb.onclick = () => { if(typeof toggleMobileSidebar === 'function') toggleMobileSidebar(); }; }
      if(bn.lastElementChild !== mb) bn.appendChild(mb); }
    const um = document.getElementById('userMenuDropdown'); if(um && !um.querySelector('.nf20-um')){ const d = document.createElement('div'); d.className = 'notif-item nf20-um'; d.style.cursor = 'pointer'; d.innerHTML = '<div><div class="notif-text">Who sees what</div></div>'; d.onclick = () => nf20OpenWho(); um.insertBefore(d, um.firstChild); }
  };
  document.addEventListener('keydown', e => { if(e.key === 'Escape'){ const ov = document.getElementById('nf20Who'); if(ov && !ov.hidden) nf20CloseWho(); } });
  const start = () => { try{ nf20Landing(); }catch(e){ console.warn('nf20 landing', e); } try{ addEntry(); }catch(e){}
    if(document.querySelector('.sidebar .nav-group')){ try{ nf20Menu(); const a = document.querySelector('#view-app .app-page.active'); if(a) nf20Active(a.id.slice(5)); }catch(e){} } else setTimeout(start, 300); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  [1200, 3000].forEach(ms => setTimeout(() => { try{ updateOpenItemsBadge(); }catch(e){} }, ms));
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf20){ const w = function(page){ const out = nav.apply(this, arguments); try{ addEntry(); nf20Banner(); }catch(e){} try{ updateOpenItemsBadge(); }catch(e){} return out; };
    Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf20 = true; window.navigate = w; try{ navigate = w; }catch(e){} }
})();
