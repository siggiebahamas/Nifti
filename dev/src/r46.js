/* ===== Round 46: delete wrong photos, Nifti-styled suggestions, clean Follow-ups rows, Deliveries day view, add tasks from each lane, no dead-end pages ===== */

/* ---------- 1. Notebook reader: delete a photo that was uploaded by mistake ---------- */
function nf46PageList(){ try{ return (typeof nb25Real === 'function' && nb25Real()) ? (NB25.server || []) : nf24Waiting(); }catch(e){ return []; } }
async function nf46PageDelete(id, ask){
  if(ask !== false && !confirm('Delete this photo? It is removed from the notebook reader and nothing from it goes into your books.')) return;
  try{
    if(typeof nb25Real === 'function' && nb25Real() && (NB25.server || []).some(x => x.id === id)){
      const { error } = await sb.from('nb_pages').delete().eq('id', id);
      if(error){ await sb.from('nb_pages').update({status: 'skipped'}).eq('id', id); }
      NB25.server = (NB25.server || []).filter(x => x.id !== id);
    } else { nf24SaveInbox(nf24Inbox().filter(x => x.id !== id)); }
  }catch(e){ showToast("Couldn't delete it. Try again.", 'error'); return; }
  if(NB24.curId === id){ NB24.curId = null; NB.photo = ''; NB.lines = []; NB.step = 0; }
  try{ nf24Badge(); }catch(e){}
  nf22NbPaint(); showToast('Photo deleted.', 'success');
}
function nf46NbPaint(){
  const ov = document.getElementById('nf22Nb'), main = ov && ov.querySelector('.nf22-nbmain'); if(!main) return;
  // first screen: every saved photo can be checked or deleted
  const box = main.querySelector('.nf24-inbox');
  if(box && !main.querySelector('.nf46-saved')){
    const list = nf46PageList();
    if(list.length){
      const d = document.createElement('details'); d.className = 'nf46-saved';
      d.innerHTML = `<summary>See or delete saved photos (${list.length})</summary><div class="nf46-sl">${list.slice(0, 24).map(x => `<div class="nf46-sp"><img src="${x.photo}" alt="Saved page"><div><b>${nf45Esc(nf24Kind(x.kind))}</b><small>Saved ${nf45Esc(nf24When(x.at))}${x.by ? ' by ' + nf45Esc(x.by) : ''}</small></div><button type="button" class="btn btn-outline btn-sm" data-nb="nb24open" data-v="${x.id}">Check</button><button type="button" class="nf46-del" onclick="nf46PageDelete('${x.id}')">Delete</button></div>`).join('')}</div>`;
      box.after(d);
    }
  }
  // photos taken but not saved yet: a clear Remove on each
  main.querySelectorAll('.nf24-grid figure button[data-nb="nb24rm"]').forEach(b => { if(b.textContent !== 'Remove'){ b.textContent = 'Remove'; b.classList.add('nf46-rm'); } });
  // check screen: delete the photo being checked
  const ph = ov.querySelector('.nf42-cphh');
  if(ph && NB24.curId && !ph.querySelector('.nf46-del')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'nf46-del'; b.textContent = 'Delete this photo'; b.onclick = () => nf46PageDelete(NB24.curId); ph.appendChild(b); }
}
(function(){ const p = nf22NbPaint; nf22NbPaint = function(){ const r = p.apply(this, arguments); try{ nf46NbPaint(); }catch(e){ console.warn('nf46 nb', e); } return r; }; window.nf22NbPaint = nf22NbPaint; })();

/* ---------- 2. Typing suggestions look like Nifti, not like the browser's own list ---------- */
const NF46S = {inp: null, opts: [], i: -1};
function nf46SugBox(){ let b = document.getElementById('nf46Sug'); if(!b){ b = document.createElement('div'); b.id = 'nf46Sug'; b.className = 'nf46-sug'; b.setAttribute('role', 'listbox'); b.hidden = true; document.body.appendChild(b); b.addEventListener('mousedown', e => { const o = e.target.closest('[data-v]'); if(!o) return; e.preventDefault(); nf46SugPick(o.dataset.v); }); } return b; }
function nf46SugOpts(inp){ const id = inp.dataset.nf46list || inp.getAttribute('list'); const dl = id && document.getElementById(id); return dl ? [...dl.options].map(o => o.value).filter(Boolean) : []; }
function nf46SugShow(inp){
  if(inp.getAttribute('list')){ inp.dataset.nf46list = inp.getAttribute('list'); inp.removeAttribute('list'); }
  const all = nf46SugOpts(inp); if(!all.length) return nf46SugHide();
  const q = String(inp.value || '').trim();
  let list = q ? all.map(v => [v, typeof nf45Match === 'function' ? nf45Match(v, q) : (v.toLowerCase().includes(q.toLowerCase()) ? 1 : 0)]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).map(x => x[0]) : all.slice();
  list = list.filter(v => v !== q).slice(0, 6);
  if(!list.length) return nf46SugHide();
  const b = nf46SugBox(), r = inp.getBoundingClientRect();
  NF46S.inp = inp; NF46S.opts = list; NF46S.i = -1;
  b.innerHTML = list.map((v, i) => `<div class="o" role="option" data-v="${nf45Esc(v)}" data-i="${i}">${nf45Esc(v)}</div>`).join('');
  b.style.left = Math.round(r.left) + 'px'; b.style.width = Math.round(Math.max(r.width, 200)) + 'px';
  const below = window.innerHeight - r.bottom;
  b.style.top = (below > 230 || below > r.top ? Math.round(r.bottom + 4) : Math.round(r.top - Math.min(230, list.length * 42 + 8) - 4)) + 'px';
  b.hidden = false;
}
function nf46SugHide(){ const b = document.getElementById('nf46Sug'); if(b) b.hidden = true; NF46S.inp = null; }
function nf46SugPick(v){ const inp = NF46S.inp; if(!inp) return; inp.value = v; inp.dispatchEvent(new Event('input', {bubbles: true})); inp.dispatchEvent(new Event('change', {bubbles: true})); nf46SugHide(); }
document.addEventListener('focusin', e => { const t = e.target; if(t && t.matches && t.matches('input[list], input[data-nf46list]')) nf46SugShow(t); });
document.addEventListener('input', e => { const t = e.target; if(t && t.matches && t.matches('input[list], input[data-nf46list]')) nf46SugShow(t); });
document.addEventListener('focusout', e => { if(e.target === NF46S.inp) setTimeout(() => { if(document.activeElement !== NF46S.inp) nf46SugHide(); }, 120); });
document.addEventListener('keydown', e => {
  const b = document.getElementById('nf46Sug'); if(!b || b.hidden || e.target !== NF46S.inp) return;
  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); NF46S.i = Math.max(0, Math.min(NF46S.opts.length - 1, NF46S.i + (e.key === 'ArrowDown' ? 1 : -1))); b.querySelectorAll('.o').forEach((o, i) => o.classList.toggle('on', i === NF46S.i)); }
  else if(e.key === 'Enter' && NF46S.i >= 0){ e.preventDefault(); nf46SugPick(NF46S.opts[NF46S.i]); }
  else if(e.key === 'Escape') nf46SugHide();
}, true);
window.addEventListener('scroll', () => { const b = document.getElementById('nf46Sug'); if(NF46S.inp && b && !b.hidden){ const r = NF46S.inp.getBoundingClientRect(); if(r.bottom < 0 || r.top > window.innerHeight) nf46SugHide(); else nf46SugShow(NF46S.inp); } }, true);

/* ---------- 3. Follow-ups: one row layout, equal buttons, no ⋯ menu ---------- */
(function(){
  if(typeof nf45FuAct !== 'function') return;
  nf45FuAct = function(it){
    const q = s => JSON.stringify(s).replace(/"/g, '&quot;');
    const main = (label, js) => `<button type="button" class="btn btn-primary nf46-fumain" onclick="event.stopPropagation(); ${js}">${label}</button>`;
    const side = (label, js) => `<button type="button" class="btn btn-outline nf46-fuside" onclick="event.stopPropagation(); ${js}">${label}</button>`;
    let html;
    if(it.k === 'wait') html = main('Remind', `qtNudge(${q(it.id)})`) + side('Open', `qtOpen(${q(it.id)})`);
    else if(it.k === 'lead') html = main(it.l.stage === 'quoted' ? 'Ask for the order' : it.l.stage === 'contacted' ? 'Send a price' : 'Reply', `fuOpenLead(${q(it.id)})`) + side('Edit', `fuEditLead(${q(it.id)})`);
    else if(it.k === 'lost') html = main('Try again', `fuPatchLead(${q(it.id)}, {stage: 'contacted', next_follow_up: APP_TODAY}, 'Opened again').then(renderFollowupsPage)`) + side('Edit', `fuEditLead(${q(it.id)})`);
    else if(it.k === 'reorder') html = main('Send usual order', `fuSendReorder(${q(it.id)}, 'reorder')`) + side('Later', `fuSnooze(${q(it.id)})`);
    else html = main('Say hello', `fuSendReorder(${q(it.id)}, 'quiet')`) + side('Later', `fuSnooze(${q(it.id)})`);
    return [html, []];
  };
  window.nf45FuAct = nf45FuAct;
})();

/* ---------- 4. Deliveries: today on top, tomorrow below, past runs folded ---------- */
function nf46StopRow(r, s, i){
  const st = nfStopState(r, s), res = s.result || {}, col = res.collected, due = Number(s.amount_due) || 0, why = res.reason || s.fail_reason;
  const pill = col ? `<span class="nf45-chipk t-g">Collected ${nfP(col.amount)}</span>` : st === 'fail' ? `<span class="nf45-chipk t-r">${nf45Esc(why ? "Couldn't: " + why : "Couldn't do")}</span>`
    : st === 'done' ? `<span class="nf45-chipk t-g">${due >= 1 ? 'Delivered · not collected' : 'Delivered'}</span>` : due >= 1 ? `<span class="nf45-chipk t-y">Collect ${nfP(due)}</span>` : st === 'next' ? '<span class="nf45-chipk t-b">Next stop</span>' : '<span class="nf45-chipk t-n">Not yet</span>';
  return `<div class="nf46-stop s-${st}" role="button" tabindex="0" onclick="if(!event.target.closest('button')) nf45StopOpen('${r.id}', '${s.id}')" onkeydown="if(event.key==='Enter') nf45StopOpen('${r.id}', '${s.id}')">
    <span class="nf45-ld ${st === 'wait' ? 'wait' : st}">${st === 'done' ? '✓' : st === 'fail' ? '✕' : i + 1}</span>
    <div><b>${nf45Esc(s.buyer_name)}</b><small>${nf45StopWhat(s)}${s.address ? ' · ' + nf45Esc(String(s.address).split(',')[0]) : ''}${s.done_at && st !== 'wait' ? ' · ' + new Date(s.done_at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila'}) : ''}</small></div>
    <span class="nf46-sr">${pill}${st === 'fail' && r.status !== 'done' ? `<button type="button" class="btn btn-outline btn-sm" onclick="reopenStop('${s.id}')">Try again</button>` : ''}<i aria-hidden="true">›</i></span></div>`;
}
function nf46RunCard(r, day){
  const t = routeTotals(r), canRemit = day === 'today' && t.n && t.done === t.n && (t.cash > 0 || t.cheque > 0) && !r.remit;
  return `<section class="panel-card nf46-run"><header><div><b>${nf45Esc(r.driver_name || 'No driver yet')}</b>${r.vehicle ? ' · ' + nf45Esc(r.vehicle) : ''}<small>${(r.stops || []).length} stop${(r.stops || []).length === 1 ? '' : 's'}${day === 'today' ? ` · ${t.done} done · ${nfP(t.got)} of ${nfP(t.due)} collected` : t.due ? ` · ${nfP(t.due)} to collect` : ''}</small></div>
      <span class="nf45-chipk ${r.status === 'done' ? 't-g' : r.status === 'on_road' ? 't-b' : 't-n'}">${r.status === 'done' ? 'Finished' : r.status === 'on_road' ? 'On the road' : 'Planned'}</span></header>
    <div class="nf46-stops">${(r.stops || []).map((s, i) => nf46StopRow(r, s, i)).join('') || '<p class="nf45-sm">No stops yet.</p>'}</div>
    <footer>${canRemit ? `<button type="button" class="btn btn-primary btn-sm" onclick="nf45RemitOpen('${r.id}')">Count the cash handed over</button>` : r.remit ? `<span class="nf45-chipk ${Math.abs(r.remit.diff) >= 1 ? 't-r' : 't-g'}">${Math.abs(r.remit.diff) >= 1 ? 'Cash ' + (r.remit.diff < 0 ? 'short ' : 'over ') + nfP(Math.abs(r.remit.diff)) : 'Cash handed over matches'}</span>` : ''}
      ${r.status !== 'done' ? `<button type="button" class="btn btn-outline btn-sm" onclick="editRoute('${r.id}')">Edit stops</button>` : ''}<button type="button" class="btn btn-outline btn-sm" onclick="shareRouteText('${r.id}')">Send list on Viber</button></footer></section>`;
}
function nf46RouteDay(body, routes){
  nf45HideRouteTabs();
  const tom = addDaysIso(APP_TODAY, 1);
  const today = routes.filter(r => r.route_date === APP_TODAY), tomorrow = routes.filter(r => r.route_date === tom), later = routes.filter(r => r.route_date > tom).sort((a, b) => a.route_date.localeCompare(b.route_date));
  const past = routes.filter(r => r.route_date < APP_TODAY).sort((a, b) => b.route_date.localeCompare(a.route_date));
  const tot = today.reduce((a, r) => { const t = routeTotals(r); a.n += t.n; a.done += t.done; a.due += t.due; a.got += t.got; return a; }, {n: 0, done: 0, due: 0, got: 0});
  const mine = routes.some(r => r.mine && r.route_date >= APP_TODAY);
  const dayLbl = d => new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'long', month: 'short', day: 'numeric'});
  body.innerHTML = `<div class="nf45-rbar"><span class="nf45-rday">Today · ${nf45Esc(dayLbl(APP_TODAY))}</span><div class="nf45-fubtns">${mine ? `<button type="button" class="btn btn-outline" onclick="routeTab='mine'; renderRoutesPage()">My run</button>` : ''}<button type="button" class="btn btn-primary" onclick="routeTab='plan'; if(!routeDraft) newRouteDraft(); renderRoutesPage()">+ Plan a run</button></div></div>
    <div class="nf46-key"><span><i class="nf45-ld done">✓</i>Done</span><span><i class="nf45-ld next">2</i>Next stop</span><span><i class="nf45-ld wait"></i>Not yet</span><span><i class="nf45-ld fail">✕</i>Couldn't do</span></div>
    ${today.length ? `<div class="nf45-rprog"><div><span>Stops done</span><b>${tot.done} of ${tot.n}</b><i><u style="width:${tot.n ? Math.round(tot.done / tot.n * 100) : 0}%"></u></i></div><div><span>Money collected</span><b>${nfP(tot.got)} of ${nfP(tot.due)}</b><i class="m"><u style="width:${tot.due ? Math.min(100, Math.round(tot.got / tot.due * 100)) : 0}%"></u></i></div></div>${today.map(r => nf46RunCard(r, 'today')).join('')}`
      : `<div class="nf45-fuempty panel-card"><b>No deliveries today</b><span>Plan a run: pick what to deliver and collect, choose a driver, and send the list on Viber.</span></div>`}
    <h3 class="nf46-dayh">Tomorrow · ${nf45Esc(dayLbl(tom))}</h3>
    ${tomorrow.length ? tomorrow.map(r => nf46RunCard(r, 'tomorrow')).join('') : `<div class="nf46-none"><span>Nothing planned for tomorrow yet.</span><button type="button" class="btn btn-outline btn-sm" onclick="routeTab='plan'; if(!routeDraft) newRouteDraft(); renderRoutesPage()">+ Plan tomorrow</button></div>`}
    ${later.length ? `<p class="nf45-sm">Later: ${later.map(r => `<button type="button" class="nf43-link" onclick="editRoute('${r.id}')">${nf45Esc(chequeDayLabel(r.route_date))} · ${nf45Esc(r.driver_name || 'No driver')}</button>`).join(' · ')}</p>` : ''}
    <details class="nf46-past"><summary>Past runs (${past.length})</summary>${past.length ? `<div class="nf46-pl">${past.slice(0, 10).map(r => { const t = routeTotals(r); return `<div><b>${nf45Esc(chequeDayLabel(r.route_date))}</b><span>${nf45Esc(r.driver_name || '')} · ${t.done} of ${t.n} stops · ${nfP(t.got)} collected${t.failed ? ` · ${t.failed} couldn't do` : ''}</span></div>`; }).join('')}</div><button type="button" class="nf43-link" onclick="routeTab='history'; renderRoutesPage()">See every past run in full ›</button>` : '<p class="nf45-sm">No past runs in the last 30 days.</p>'}</details>
    <p class="nf45-futip nf45-rtip">Tap any stop to see what to deliver and collect, call the customer, open Maps or mark it done.</p>`;
}
(function(){ const w = function(body, routes){ return nf46RouteDay(body, routes); }; w._nf11 = true; w._nf45 = true; window.renderRouteBoard = w; try{ renderRouteBoard = w; }catch(e){} })();

/* ---------- 5. Team: add a task right under each lane ---------- */
function nf46TeamLanes(page){
  if(!page || page.id !== 'page-team') return;
  page.querySelectorAll('.nf33t-col[data-col]').forEach(col => {
    const h = col.querySelector(':scope > header'); if(!h || col.querySelector(':scope > .nf46-addt')) return;
    const c = col.dataset.col, b = document.createElement('button'); b.type = 'button'; b.className = 'nf46-addt'; b.textContent = '+ Add a task'; b.setAttribute('aria-label', 'Add a task to ' + ({todo: 'To do', doing: 'Doing', done: 'Done'}[c] || c));
    b.onclick = () => nf46TaskAdd(c); h.after(b);
  });
}
function nf46TaskAdd(col){
  const lane = {todo: 'To do', doing: 'Doing', done: 'Done'}[col] || 'To do';
  const people = (typeof getActiveTeamMembers === 'function' ? getActiveTeamMembers() : []);
  nf45Pop('nf46Task', 'Add a task to ' + lane, `<label class="nf45-lbl" for="nf46TT">What needs to get done?</label><input id="nf46TT" class="nf45-ta" maxlength="300" placeholder="e.g. Follow up Metro Steel on the rebar delivery" onkeydown="if(event.key==='Enter') nf46TaskSave('${col}')">
    <div class="nf46-tr"><label><span>For</span><select id="nf46TA">${people.map(m => `<option value="${nf45Esc(m.id)}" ${m.id === currentUserId ? 'selected' : ''}>${nf45Esc(m.name)}</option>`).join('')}</select></label><label><span>Due <small>optional</small></span><input id="nf46TD" type="date"></label></div>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf46Task')">Cancel</button><button type="button" class="btn btn-primary" onclick="nf46TaskSave('${col}')">Add task</button>`);
  setTimeout(() => { const i = document.getElementById('nf46TT'); if(i) i.focus(); }, 50);
}
async function nf46TaskSave(col){
  const t = (document.getElementById('nf46TT') || {}).value || ''; if(!t.trim()){ showToast('Type what needs to get done.', 'warn'); return; }
  const ti = document.getElementById('newTaskTitle'), as = document.getElementById('newTaskAssignee'), du = document.getElementById('newTaskDue'); if(!ti || !as || !du) return;
  ti.value = t.trim(); const a = document.getElementById('nf46TA').value; if(![...as.options].some(o => o.value === a)){ const o = document.createElement('option'); o.value = a; as.appendChild(o); } as.value = a; du.value = document.getElementById('nf46TD').value || '';
  slClose('nf46Task');
  await submitNewTask();
  try{ const nt = teamTasks[0]; if(nt && col !== 'todo' && typeof nf33TMove === 'function') nf33TMove(nt.id, col); }catch(e){}
}

/* ---------- 6. Bring in or save your list: a popup, not a jump to another page ---------- */
function nf46ListPop(){
  nf45Pop('nf46List', 'Bring in or save your list', `<p class="nf45-p">Pick what you want to do. You stay on this page.</p>
    <div class="nf46-opts">
      <button type="button" onclick="slClose('nf46List'); nf41ImportOpen()"><b>Add many items from Excel</b><small>Your items with prices and stock, from an Excel or CSV file.</small></button>
      <button type="button" onclick="slClose('nf46List'); nf45Old()"><b>Bring in old records</b><small>Utang, sales, supplier bills or expenses: Excel, typing, or a photo.</small></button>
      <button type="button" onclick="slClose('nf46List'); nf22NbOpen()"><b>Read a notebook</b><small>Take photos of handwritten pages. Nifti reads them for you to check.</small></button>
      <button type="button" onclick="slClose('nf46List'); (typeof myBusiness !== 'undefined' && myBusiness && typeof downloadMyData === 'function') ? downloadMyData() : (typeof nf25ExportXlsx === 'function' ? nf25ExportXlsx() : exportAllData())"><b>Save everything to Excel</b><small>One file with your items, customers, orders and money. Good for backups or your accountant.</small></button></div>
    <p class="nf45-sm">Need the full data tools? <button type="button" class="nf43-link" onclick="slClose('nf46List'); navigate('datacenter')">Open the data center</button></p>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf46List')">Close</button>`);
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('button'); if(!b || !/Bring in or save your list|Import \/ export data/.test(b.textContent)) return;
  if(!/navigate\('datacenter'\)/.test(b.getAttribute('onclick') || '')) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); nf46ListPop();
}, true);

/* ---------- 7. No dead ends: pages reached from a button get a clear way back ---------- */
const NF46N = {prev: null, cur: null};
(function(){ const nav = navigate; navigate = function(page){ try{ if(NF46N.cur && NF46N.cur !== page) NF46N.prev = NF46N.cur; NF46N.cur = page; }catch(e){} return nav.apply(this, arguments); }; Object.keys(nav).forEach(k => { navigate[k] = nav[k]; }); window.navigate = navigate; })();
const NF46_HIDDEN = {datacenter: 1, invite: 1, status: 1, admin: 1, analytics: 1, growth: 1, watchdog: 1, suppliers: 1, prices: 1, cashcount: 1};
function nf46BackBar(page){
  if(!page) return; const id = page.id.replace('page-', ''); if(!NF46_HIDDEN[id]) return;
  const nv = document.querySelector(`#view-app .sidebar [data-page="${id}"]`); if(nv && nv.offsetParent !== null) return;
  if(page.querySelector(':scope > .nf46-back, .nf46-back')) return;
  const prev = NF46N.prev && NF46N.prev !== id ? NF46N.prev : 'dashboard';
  const name = (document.querySelector(`#view-app .sidebar [data-page="${prev}"]`) || {}).textContent || (prev === 'dashboard' ? 'Home' : 'the last page');
  const b = document.createElement('button'); b.type = 'button'; b.className = 'nf46-back'; b.innerHTML = `‹ Back to ${nf45Esc(String(name).replace(/\d+$/, '').trim())}`; b.onclick = () => navigate(prev);
  page.insertBefore(b, page.firstChild);
}

/* ---------- 8. Monthly summary: "Balance at the start" lines up on the left ---------- */
function nf46Ledger(page){
  if(!page || page.id !== 'page-ledger') return;
  page.querySelectorAll('td').forEach(td => { if(!td.classList.contains('nf46-start') && /^\s*Balance at the (start|end)\s*$/i.test(td.textContent)) td.classList.add('nf46-start'); });
}
NF45_AFTER.push(nf46TeamLanes, nf46BackBar, nf46Ledger);
