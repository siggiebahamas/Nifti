/* ===== Round 36: menu open by default with real to-do counts, steady chat list, wide summary boxes, clean lead cards, task history ===== */

/* ---------- 1. Menu: every section open the first time (you can still fold them); headings count real to-dos ---------- */
(function(){ try{ if(!localStorage.getItem('nifti-menu-fold-v36b')){ localStorage.setItem('nifti-menu-fold', '{}'); localStorage.setItem('nifti-menu-fold-26', '{}'); localStorage.setItem('nifti-menu-fold-v36', '1'); localStorage.setItem('nifti-menu-fold-v36b', '1'); } }catch(e){} })();
// the menu's saved folds live under nifti-menu-fold-26; with nothing saved, every section is open
nf20Folded = function(){ let f = null; try{ f = JSON.parse(localStorage.getItem('nifti-menu-fold-26') || 'null'); }catch(e){} return Object.assign({money: false, sell: false, more: false, ai: false}, f || {}); };
try{ window.nf20Folded = nf20Folded; }catch(e){}
function nf36GroupTodo(g){ return [...g.querySelectorAll('.nav-item')].filter(it => typeof nf26Visible !== 'function' || nf26Visible(it)).reduce((s, it) => s + (Number(((it.querySelector('.nav-badge') || {}).textContent || '').trim()) || 0), 0); }

/* ---------- 2. Wide summary boxes: label and number on the left, the details on the right ---------- */
function nf36Wide(page){
  page.querySelectorAll('.sl-tile, .bk-tile').forEach(t => {
    if(t.closest('.nf30-pills')) return;
    const wide = t.getBoundingClientRect().width >= 440;
    if(t.classList.contains('nf36-wide') !== wide) t.classList.toggle('nf36-wide', wide);
    const sub = t.querySelector(':scope > span:not(.bk-tile-l):not(.bk-tile-v), :scope > .bk-tile-s');
    if(wide && sub && !sub.dataset.nf36 && / · /.test(sub.textContent) && !sub.querySelector('*')){
      sub.dataset.nf36 = '1'; sub.innerHTML = sub.textContent.split(' · ').map(x => `<i>${escapeHtml(x)}</i>`).join('');
    }
  });
}

/* ---------- 3. Find customers: clean lead cards (theme A), any area, Message on every card, more from Google Maps ---------- */
const NF36F = {q: '', area: 'All Philippines', type: 'All', gq: ''};
function nf36Msg(i){
  const x = nfFindList()[i]; if(!x) return; const me = (myBusiness && myBusiness.name) || 'Metro Steel Co.';
  const text = `Hi ${x.n}! This is ${me}. We supply ${(x.buys || []).slice(0, 3).join(', ') || 'building supplies'}${x.area ? ' with delivery to ' + x.area : ''}. Can we send you our prices?`;
  slModal('nf36Msg', `<div class="sl-sheet-h"><b>Message ${escapeHtml(x.n)}</b><button class="sl-x" onclick="slClose('nf36Msg')" aria-label="Close">✕</button></div>
    <div class="sl-sub">Change the message if you like, then pick the app.</div><textarea id="nf36MsgTxt" class="sl-ta" rows="5">${escapeHtml(text)}</textarea>
    <div class="nf36-mapps">${x.live && x.connected ? `<button type="button" class="btn btn-primary" onclick="slClose('nf36Msg'); go('messages')">Nifti chat</button>` : ''}
      <a class="btn btn-outline" href="viber://forward?text=${encodeURIComponent(text)}" onclick="this.href='viber://forward?text='+encodeURIComponent(document.getElementById('nf36MsgTxt').value)">Viber</a>
      <a class="btn btn-outline" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text)}" onclick="this.href='https://wa.me/?text='+encodeURIComponent(document.getElementById('nf36MsgTxt').value)">WhatsApp</a>
      <button type="button" class="btn btn-outline" onclick="copyPlainText(document.getElementById('nf36MsgTxt').value, 'Copied. Paste it in Messenger or a text.')">Copy</button></div>`);
}
function nf36GoogleSearch(){
  const what = (document.getElementById('nf36Gq') || {}).value || 'hardware store', where = NF36F.area === 'All Philippines' ? 'Philippines' : NF36F.area;
  window.open('https://www.google.com/maps/search/' + encodeURIComponent(what + ' in ' + where), '_blank', 'noopener');
}
function nf36FindHtml(){
  const mine = nfMyItems(), list = nfFindList();
  const areas = ['All Philippines', ...new Set(list.map(x => x.area).filter(Boolean)), 'Metro Manila', 'Cebu', 'Davao'].filter((v, i, a) => a.indexOf(v) === i);
  const types = ['All', ...new Set(list.map(x => x.type))];
  const q = NF36F.q.trim().toLowerCase();
  const shown = list.map((x, i) => Object.assign({}, x, {i, match: (x.buys || []).filter(b => mine.has(String(b).toLowerCase())).length}))
    .filter(x => (NF36F.type === 'All' || x.type === NF36F.type) && (NF36F.area === 'All Philippines' || x.area === NF36F.area) && (!q || (x.n + ' ' + x.type + ' ' + (x.buys || []).join(' ') + ' ' + (x.note || '')).toLowerCase().includes(q)))
    .sort((a, b) => b.match - a.match || (b.monthly || 0) - (a.monthly || 0));
  const ini = n => String(n).split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return `<div class="nf36f-tools"><input type="search" placeholder="Search a business or what they buy, e.g. rebar" value="${escapeHtml(NF36F.q)}" oninput="NF36F.q=this.value; nfFindRender(); const i=document.querySelector('.nf36f-tools input'); i.focus(); i.setSelectionRange(i.value.length,i.value.length)">
      <select onchange="NF36F.type=this.value; nfFindRender()" aria-label="Type of business">${types.map(t => `<option ${NF36F.type === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}</select>
      <select onchange="NF36F.area=this.value; nfFindRender()" aria-label="Area">${areas.map(a => `<option ${NF36F.area === a ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('')}</select></div>
    <div class="nf36f-grid">${shown.map(x => `<article class="nf36f-card"><div class="nf36f-hd"><span class="nf36f-av" style="background:${typeof nfIniColor === 'function' ? nfIniColor(x.n) : '#1F6B45'}">${escapeHtml(ini(x.n))}</span><div><b>${escapeHtml(x.n)}</b><small>${escapeHtml(x.type)}${x.area ? ' · ' + escapeHtml(x.area) : ''}</small></div></div>
        <span class="nf36f-src">On Nifti</span>
        ${x.monthly ? `<div class="nf36f-money"><b>${nfP(x.monthly)}</b><span>a month in supplies</span></div>` : ''}
        ${(x.buys || []).length ? `<div class="nf36f-buys"><b>They buy:</b> ${x.buys.map(b => mine.has(String(b).toLowerCase()) ? `<strong>${escapeHtml(b)}</strong>` : escapeHtml(b)).join(', ')}</div>` : ''}
        ${x.match || x.note ? `<div class="nf36f-why">${x.note ? escapeHtml(x.note) + '. ' : ''}${x.match ? `Buys ${x.match} thing${x.match > 1 ? 's' : ''} you sell.` : ''}</div>` : ''}
        <div class="nf36f-acts"><button type="button" class="btn btn-primary" onclick="nf36Msg(${x.i})">Message</button>
          ${x.live ? (x.connected ? '<span class="nf-pill good">Connected</span>' : x.req === 'pending' ? '<span class="nf-pill warn">Request sent</span>' : `<button type="button" class="btn btn-outline" onclick="nfFindConnect('${x.id}')">Connect on Nifti</button>`) : `<button type="button" class="btn btn-outline" onclick="nfFindIntro(${x.i})">Send price list</button>`}
          <button type="button" class="btn btn-outline" onclick="nfFindLead(${x.i})">Save</button></div></article>`).join('') || '<div class="nf-empty">No businesses match yet. Try All Philippines, or search Google Maps below.</div>'}</div>
    <div class="nf36f-google"><div><b>Find more on Google Maps</b><small>Any shop, builder or fabricator in any area, with their phone number. Found one you like? Add it as a lead.</small></div>
      <input id="nf36Gq" placeholder="e.g. hardware store, contractor" value="${escapeHtml(NF36F.gq)}" oninput="NF36F.gq=this.value"><button type="button" class="btn btn-primary" onclick="nf36GoogleSearch()">Search Google Maps</button>
      <button type="button" class="btn btn-outline" onclick="try{ navigate('followups'); setTimeout(fuAddLead, 150); }catch(e){}">Add a lead</button></div>
    <p class="nfx-note">${myBusiness ? 'On Nifti: businesses that chose to be found. They never see your prices or customers until you connect.' : 'Sample businesses for the demo. In your account, this lists real buyers on Nifti who chose to be found.'}</p>`;
}

/* ---------- 4. Team: deleted jobs can be brought back, and every change is written down ---------- */
const NF36T = {events: null, showDeleted: false};
async function nf36DeleteTask(id){
  const t = teamTasks.find(x => x.id === id); if(!t) return;
  const me = teamMe(), who = me ? me.name : 'Someone';
  t.deletedAt = new Date().toISOString(); t.deletedBy = who;
  logTeamActivity(`Deleted: "${t.title}"`, 'task'); refreshTeamViews(); scheduleNiftiSave();
  nf36Undo(`Deleted "${t.title}"`, () => nf36Restore(id));
  const ok = await teamServerWrite(() => sb.from('team_tasks').update({deleted_at: t.deletedAt, deleted_by_name: who}).eq('id', id), "Couldn't delete that task.");
  if(!ok){ t.deletedAt = null; t.deletedBy = null; refreshTeamViews(); }
  NF36T.events = null;
}
async function nf36Restore(id){
  const t = teamTasks.find(x => x.id === id); if(!t) return;
  t.deletedAt = null; t.deletedBy = null; logTeamActivity(`Brought back: "${t.title}"`, 'task'); refreshTeamViews(); scheduleNiftiSave();
  await teamServerWrite(() => sb.from('team_tasks').update({deleted_at: null, deleted_by_name: null}).eq('id', id), "Couldn't bring that task back.");
  NF36T.events = null; try{ if(document.getElementById('nf36Hist')) nf36History(); }catch(e){}
  showToast(`"${t.title}" is back on the board.`, 'success');
}
function nf36Undo(text, fn){
  const old = document.getElementById('nf36Undo'); if(old) old.remove();
  const d = document.createElement('div'); d.id = 'nf36Undo'; d.className = 'nf36-undo';
  d.innerHTML = `<span>${escapeHtml(text)}</span><button type="button">Undo</button>`;
  d.querySelector('button').onclick = () => { d.remove(); fn(); };
  document.body.appendChild(d); setTimeout(() => { try{ d.remove(); }catch(e){} }, 8000);
}
async function nf36History(){
  if(myBusiness && !NF36T.events){ try{ const { data } = await sb.from('team_task_events').select('*').eq('business_id', myBusiness.id).order('at', {ascending: false}).limit(200); NF36T.events = data || []; }catch(e){ NF36T.events = []; } }
  const del = teamTasks.filter(t => t.deletedAt).sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt)));
  const ev = myBusiness ? (NF36T.events || []).map(e => ({t: e.title, a: e.action, at: e.at})) : (teamActivityLog || []).filter(a => a.kind === 'task').map(a => ({line: a.actor + ' · ' + a.action, at: a.date + ' ' + (a.time || '')}));
  const when = s => { try{ const d = new Date(s); return isNaN(d) ? s : d.toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}); }catch(e){ return s; } };
  slModal('nf36Hist', `<div class="sl-sheet-h"><b>Job history</b><button class="sl-x" onclick="slClose('nf36Hist')" aria-label="Close">✕</button></div>
    <div class="nf36-hist">
      <h4>Deleted jobs${del.length ? ` (${del.length})` : ''}</h4>
      ${del.length ? del.map(t => `<div class="nf36-hrow"><div><b>${escapeHtml(t.title)}</b><small>Deleted by ${escapeHtml(t.deletedBy || 'someone')} · ${escapeHtml(when(t.deletedAt))}</small></div><button type="button" class="btn btn-outline" onclick="nf36Restore('${t.id}')">Bring back</button></div>`).join('') : '<p class="nf36-none">Nothing deleted. 👍</p>'}
      <h4>Every change</h4><p class="nf36-none">Written down automatically when anyone adds, starts, finishes, edits or deletes a job. Nobody can change this list.</p>
      <div class="nf36-ev">${ev.length ? ev.slice(0, 80).map(e => `<div><span>${e.line ? escapeHtml(e.line) : `<b>${escapeHtml(e.a)}</b> · ${escapeHtml(e.t || '')}`}</span><small>${escapeHtml(when(e.at))}</small></div>`).join('') : '<p class="nf36-none">No changes yet.</p>'}</div></div>`);
}
function nf36TeamBar(page){
  const box = page.querySelector('#taskListOpen'); if(!box || !box.parentElement) return;
  let bar = document.getElementById('nf36TBar');
  const n = teamTasks.filter(t => t.deletedAt).length, sig = String(n);
  if(bar && bar.dataset.sig === sig && bar.nextElementSibling === box) return;
  if(!bar){ bar = document.createElement('div'); bar.id = 'nf36TBar'; bar.className = 'nf36-tbar'; }
  bar.dataset.sig = sig; bar.innerHTML = `<button type="button" onclick="nf36History()">🕘 Job history${n ? ` · ${n} deleted` : ''}</button>`;
  box.parentElement.insertBefore(bar, box);
}

/* ---------- wiring ---------- */
(function(){
  try{ window.nfFindHtml = nf36FindHtml; nfFindHtml = nf36FindHtml; }catch(e){ console.warn('nf36 find', e); }
  try{ window.deleteTask = nf36DeleteTask; deleteTask = nf36DeleteTask; }catch(e){ console.warn('nf36 del', e); }
  // deleted jobs stay off the board (but in history)
  const rtl = window.renderTaskList;
  if(typeof rtl === 'function' && !rtl._nf36){ const w = function(){ const keep = teamTasks; teamTasks = keep.filter(t => !t.deletedAt); try{ return rtl.apply(this, arguments); } finally { teamTasks = keep; } }; w._nf36 = true; window.renderTaskList = w; try{ renderTaskList = w; }catch(e){} }
  const rps = window.renderTeamPeopleStrip;
  if(typeof rps === 'function' && !rps._nf36){ const w = function(){ const keep = teamTasks; teamTasks = keep.filter(t => !t.deletedAt); try{ return rps.apply(this, arguments); } finally { teamTasks = keep; } }; w._nf36 = true; window.renderTeamPeopleStrip = w; try{ renderTeamPeopleStrip = w; }catch(e){} }
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); if(!page) return; try{ nf36Wide(page); }catch(e){} try{ if(page.id === 'page-team') nf36TeamBar(page); }catch(e){ console.warn('nf36 team', e); } };
  window.nf26AfterPass = nf26AfterPass;
})();
/* ---------- daily routine fixes ---------- */
// after a cash count, the calendar shows today's result right away (it used to wait for the next page redraw)
(function(){
  if(typeof ccSave !== 'function' || ccSave._nf36) return;
  const base = ccSave;
  const w = async function(){
    const r = await base.apply(this, arguments);
    try{ const d = document.getElementById('mhDrawer'); if(d && typeof mhDrawer === 'function' && typeof BK !== 'undefined' && BK.loaded){ d.innerHTML = mhDrawer(); const pg = d.closest('.page'); if(pg && typeof nf26AfterPass === 'function') nf26AfterPass(pg); } }catch(e){}
    return r;
  };
  w._nf36 = true; window.ccSave = w; try{ ccSave = w; }catch(e){}
})();
// with no schedule saved, the two people who count most often take turns; one extra count by someone else no longer reshuffles the week
(function(){
  if(typeof mhSched !== 'function' || mhSched._nf36) return;
  const base = mhSched;
  const w = function(){
    let s = null; try{ s = bkSettings().count_schedule; }catch(e){}
    if(s && s.people) return base.apply(this, arguments);
    const tally = {}; ((typeof BK !== 'undefined' && BK.counts) || []).forEach(c => { const n = String(c.by || '').replace(/ \(You\)$/, '').trim(); if(n) tally[n] = (tally[n] || 0) + 1; });
    let ps = Object.keys(tally).sort((a, b) => tally[b] - tally[a] || a.localeCompare(b)).slice(0, 2);
    if(ps.length < 2){ try{ ps = ps.concat(mhPeople().filter(x => !ps.includes(x))).slice(0, 2); }catch(e){} }
    return {mode: 'alternate', people: ps, start: APP_TODAY, over: {}};
  };
  w._nf36 = true; window.mhSched = w; try{ mhSched = w; }catch(e){}
})();
