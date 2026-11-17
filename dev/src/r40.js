/* ===== Round 40 ===== */

/* ---------- 1. Team people row: picking someone only moves the highlight. Nothing is rebuilt, nothing resizes ---------- */
nf38People = function(){
  const el = document.getElementById('teamPeopleStrip'); if(!el || typeof nf33TMembers !== 'function') return;
  const ms = nf33TMembers(), all = teamTasks.filter(t => teamScoped(t) && !t.deletedAt);
  const today = t => t.status === 'done' && (t.completedAt || t.doneAt) === APP_TODAY;
  const stat = list => { const open = list.filter(t => t.status !== 'done').length, done = list.filter(today).length; return {open, done, tot: open + done, late: list.some(t => t.status !== 'done' && t.dueDate && t.dueDate < APP_TODAY)}; };
  const people = ms.map(m => Object.assign({id: m.id, name: m.name}, stat(all.filter(t => t.assignedTo === m.id))));
  people.sort((a, b) => (b.late - a.late) || (b.open - a.open) || a.name.localeCompare(b.name));
  const pick = NF33T.who;
  const max = window.innerWidth < 520 ? 1 : window.innerWidth < 700 ? 3 : window.innerWidth < 1200 ? 4 : NF38T.max;
  let shown = people.slice(0, max);
  if(pick !== 'all' && !shown.some(p => p.id === pick)){ const sel = people.find(p => p.id === pick); if(sel) shown = [sel].concat(shown.slice(0, max - 1)); }
  const more = people.length - shown.length, ev = stat(all);
  const chip = (p, isAll) => `<button type="button" class="nf38-p" data-id="${p.id}" aria-pressed="false" onclick="NF33T.who='${p.id}'; renderTeamPeopleStrip(); renderTaskList()">
    ${isAll ? '<span class="nf38-av all">All</span>' : `<span class="nf38-av" style="background:${typeof nfIniColor === 'function' ? nfIniColor(p.name) : '#475467'}">${escapeHtml(teamInitials(p.name))}</span>`}
    <span class="nf38-pn"><b>${escapeHtml(isAll ? 'Everyone' : p.name.split(' ')[0])}${p.late ? '<i class="late" title="Has a late job"></i>' : ''}</b><small>${p.done}/${p.tot} done</small></span></button>`;
  const html = `<div class="nf38-people">${chip(Object.assign({id: 'all'}, ev), true)}${shown.map(p => chip(p)).join('')}
    ${more > 0 ? `<button type="button" class="nf38-more" onclick="nf38AllPeople()">+${more} more</button>` : ''}</div>`;
  if(el._nf40 !== html || !el.firstElementChild){ el.innerHTML = html; el._nf40 = html; }
  el.querySelectorAll('.nf38-p').forEach(b => { const on = b.dataset.id === pick; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
};
window.nf38People = nf38People;
(function(){
  // the old row drew big chips first and then swapped them for small ones on every tap: draw the small ones only
  const w = function(){ try{ nf38People(); }catch(e){ console.warn('nf40 people', e); } };
  w._nf36 = true; w._nf40 = true;
  window.renderTeamPeopleStrip = w; try{ renderTeamPeopleStrip = w; }catch(e){}
})();

/* ---------- 2. Deleting a job asks first, and deleted jobs wait in Trash ---------- */
const NF40_DEL = typeof nf36DeleteTask === 'function' ? nf36DeleteTask : window.deleteTask;
const NF40_IC = {
  trash: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg>',
  hist: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>',
};
function nf40AskDelete(id){
  const t = teamTasks.find(x => x.id === id); if(!t) return;
  const who = t.assignedTo ? teamMemberName(t.assignedTo) : 'Anyone';
  slModal('nf40Del', `<div class="sl-sheet-h"><b>Delete this job?</b><button class="sl-x" onclick="slClose('nf40Del')" aria-label="Close">✕</button></div>
    <div class="nf40-del"><div class="nf40-dt"><b>${escapeHtml(t.title)}</b><small>For ${escapeHtml(who)}</small></div>
      <p>It goes to <b>Trash</b>, not gone for good. You can bring it back from Trash any time.</p>
      <div class="nf40-db"><button type="button" class="btn btn-outline" onclick="slClose('nf40Del')">Keep it</button><button type="button" class="nf40-danger" onclick="slClose('nf40Del'); NF40_DEL('${id}')">${NF40_IC.trash}Move to Trash</button></div></div>`);
}
window.deleteTask = nf40AskDelete; try{ deleteTask = nf40AskDelete; }catch(e){}
function nf40Ago(s){ try{ const d = new Date(s); if(isNaN(d)) return s || ''; return d.toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}); }catch(e){ return s || ''; } }
function nf40Trash(){
  const del = teamTasks.filter(t => t.deletedAt && (typeof teamScoped !== 'function' || teamScoped(t))).sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt)));
  const day = d => (typeof bkDayLabel === 'function' ? bkDayLabel(d) : d);
  slModal('nf40Trash', `<div class="sl-sheet-h"><b>Trash${del.length ? ` (${del.length})` : ''}</b><button class="sl-x" onclick="slClose('nf40Trash')" aria-label="Close">✕</button></div>
    <p class="nf40-tnote">Every deleted job waits here, with who deleted it and when. Bring any of them back to the board in one tap.</p>
    <div class="nf40-tlist">${del.length ? del.map(t => { const who = t.assignedTo ? teamMemberName(t.assignedTo) : 'Anyone';
      return `<div class="nf40-trow"><div class="nf40-tm"><b>${escapeHtml(t.title)}</b><small>Deleted by <strong>${escapeHtml(t.deletedBy || 'someone')}</strong> · ${escapeHtml(nf40Ago(t.deletedAt))}</small><small>Was for ${escapeHtml(who)}${t.dueDate ? ' · due ' + escapeHtml(day(t.dueDate)) : ''}</small></div>
        <button type="button" class="btn btn-outline" onclick="nf40Restore('${t.id}')">Bring back</button></div>`; }).join('')
      : `<div class="nf40-empty">${NF40_IC.trash}<b>Trash is empty</b><span>Deleted jobs show up here.</span></div>`}</div>`);
}
async function nf40Restore(id){
  try{ await nf36Restore(id); }catch(e){ console.warn('nf40 restore', e); }
  if(document.getElementById('nf40Trash')) nf40Trash();
}
nf36TeamBar = function(page){
  const box = page.querySelector('#taskListOpen'); if(!box || !box.parentElement) return;
  let bar = document.getElementById('nf36TBar');
  const n = teamTasks.filter(t => t.deletedAt && (typeof teamScoped !== 'function' || teamScoped(t))).length, sig = 'v40|' + n;
  if(bar && bar.dataset.sig === sig && bar.nextElementSibling === box) return;
  if(!bar){ bar = document.createElement('div'); bar.id = 'nf36TBar'; bar.className = 'nf36-tbar'; }
  bar.dataset.sig = sig;
  bar.innerHTML = `<button type="button" class="nf40-tb" onclick="nf40Trash()">${NF40_IC.trash}<span>Trash</span>${n ? `<em>${n}</em>` : ''}</button><button type="button" class="nf40-tb" onclick="nf36History()">${NF40_IC.hist}<span>Job history</span></button>`;
  box.parentElement.insertBefore(bar, box);
};
window.nf36TeamBar = nf36TeamBar;

/* ---------- 3. No red "N things need you" banner on top of any page ---------- */
nf37Why = function(page){ try{ const o = page && page.querySelector(':scope .nf37-why'); if(o) o.remove(); }catch(e){} };
window.nf37Why = nf37Why;

/* ---------- 4. "Exception Log" in plain words ---------- */
(function(){
  if(typeof renderExceptionLog !== 'function') return;
  const base = renderExceptionLog;
  const w = function(){ const r = base.apply(this, arguments); try{ const el = document.getElementById('exceptionLogPanel'); const h = el && el.querySelector('h2'); if(h && !h.dataset.nf40){ h.textContent = 'Problems with orders'; h.dataset.nf40 = '1'; const sub = el.querySelector('.sub'); if(sub) sub.textContent = sub.textContent.replace(/^Every dispute, rejected delivery, and short shipment/, 'Returns, damaged goods and short deliveries').replace(/Price conflicts are in the Audit Log instead, under Settings\./, ''); } }catch(e){} return r; };
  window.renderExceptionLog = w; try{ renderExceptionLog = w; }catch(e){}
})();
