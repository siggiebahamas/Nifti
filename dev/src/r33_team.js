/* ===== Round 33: Team = mission board. To do, Doing, Done. Drag a card or tap its button ===== */
const NF33T = {who: 'all', drag: null, showAllDone: false};
function nf33TMembers(){ try{ return getActiveTeamMembers().filter(m => m.status !== 'invited'); }catch(e){ return []; } }
function nf33TCol(t){ return t.status === 'done' ? 'done' : t.startedAt ? 'doing' : 'todo'; }
function nf33TDue(t){
  if(t.status === 'done') return `<span class="nf33t-due g">✓ Done${t.completedBy ? ' by ' + escapeHtml(String(t.completedBy).split(' ')[0]) : ''}</span>`;
  if(!t.dueDate) return '';
  if(t.dueDate < APP_TODAY) return `<span class="nf33t-due r">Late · ${escapeHtml(bkDayLabel ? bkDayLabel(t.dueDate) : t.dueDate)}</span>`;
  if(t.dueDate === APP_TODAY) return '<span class="nf33t-due y">Due today</span>';
  return `<span class="nf33t-due n">${escapeHtml(typeof bkDayLabel === 'function' ? bkDayLabel(t.dueDate) : t.dueDate)}</span>`;
}
function nf33TCard(t){
  const c = nf33TCol(t), who = t.assignedTo ? teamMemberName(t.assignedTo) : 'Anyone';
  const btn = c === 'todo' ? `<button type="button" class="nf33t-go" onclick="nf33TMove('${t.id}','doing')">Start</button>`
    : c === 'doing' ? `<button type="button" class="nf33t-go done" onclick="nf33TMove('${t.id}','done')">✓ Done</button>`
    : `<button type="button" class="nf33t-go ghost" onclick="nf33TMove('${t.id}','todo')">Undo</button>`;
  return `<div class="nf33t-card ${c}${t.status !== 'done' && t.dueDate && t.dueDate < APP_TODAY ? ' late' : ''}" draggable="true" data-id="${t.id}" ondragstart="NF33T.drag='${t.id}'; this.classList.add('dragging')" ondragend="this.classList.remove('dragging')">
    <b>${escapeHtml(t.title)}</b>
    <div class="nf33t-meta"><span class="nf33t-who"><span class="nf33t-av" style="background:${typeof nfIniColor === 'function' ? nfIniColor(who) : '#475467'}">${escapeHtml(teamInitials(who))}</span>${escapeHtml(who.split(' ')[0])}</span>${nf33TDue(t)}</div>
    <div class="nf33t-acts">${btn}<button type="button" class="nf33t-x" title="Delete" aria-label="Delete task" onclick="deleteTask('${t.id}')">✕</button></div></div>`;
}
function nf33RenderTaskList(){
  const box = document.getElementById('taskListOpen'); if(!box) return;
  try{ nf33TSeedDemo(); }catch(e){}
  const all = teamTasks.filter(t => teamScoped(t)), mine = NF33T.who === 'all' ? all : all.filter(t => t.assignedTo === NF33T.who);
  const weekAgo = addDaysIso(APP_TODAY, -7);
  const cols = [['todo', 'To do', 'Not started yet'], ['doing', 'Doing', 'Someone is on it'], ['done', 'Done', 'Last 7 days']];
  const sortOpen = (a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'));
  box.innerHTML = `<div class="nf33t-board">${cols.map(([k, h, sub]) => {
      let list = mine.filter(t => nf33TCol(t) === k);
      if(k === 'done'){ list = list.filter(t => !(t.completedAt || t.doneAt) || (t.completedAt || t.doneAt) >= weekAgo).sort((a, b) => String(b.completedAt || '').localeCompare(String(a.completedAt || ''))); }
      else list.sort(sortOpen);
      const extra = k === 'done' && !NF33T.showAllDone && list.length > 5 ? list.length - 5 : 0; if(extra) list = list.slice(0, 5);
      return `<section class="nf33t-col" data-col="${k}" ondragover="event.preventDefault(); this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="event.preventDefault(); this.classList.remove('over'); if(NF33T.drag) nf33TMove(NF33T.drag,'${k}'); NF33T.drag=null;">
        <header><i></i><b>${h}</b><span class="nf33t-n">${mine.filter(t => nf33TCol(t) === k && (k !== 'done' || !t.completedAt || t.completedAt >= weekAgo)).length}</span><small>${sub}</small></header>
        <div class="nf33t-list">${list.map(nf33TCard).join('') || `<p class="nf33t-empty">${k === 'todo' ? 'Nothing waiting. Add a job above.' : k === 'doing' ? 'Drag a card here, or tap Start.' : 'Finished jobs land here.'}</p>`}
        ${extra ? `<button type="button" class="nf33t-more" onclick="NF33T.showAllDone=true; renderTaskList()">Show ${extra} more</button>` : ''}</div></section>`; }).join('')}</div>`;
  const f = document.getElementById('teamTaskFilters'); if(f) f.innerHTML = '';
}
function nf33RenderPeople(){
  const el = document.getElementById('teamPeopleStrip'); if(!el) return;
  const ms = nf33TMembers(), all = teamTasks.filter(t => teamScoped(t));
  const today = t => t.status === 'done' && (t.completedAt || t.doneAt) === APP_TODAY;
  const chip = (id, name, mineList) => { const open = mineList.filter(t => t.status !== 'done').length, done = mineList.filter(today).length, tot = open + done, late = mineList.some(t => t.status !== 'done' && t.dueDate && t.dueDate < APP_TODAY);
    return `<button type="button" class="nf33t-p${NF33T.who === id ? ' on' : ''}" onclick="NF33T.who='${id}'; renderTeamPeopleStrip(); renderTaskList()">
      ${id === 'all' ? '<span class="nf33t-pav all">All</span>' : `<span class="nf33t-pav" style="background:${typeof nfIniColor === 'function' ? nfIniColor(name) : '#475467'}">${escapeHtml(teamInitials(name))}</span>`}
      <span class="nf33t-pm"><b>${escapeHtml(id === 'all' ? 'Everyone' : name.split(' ')[0])}${late ? '<i class="late" title="Has a late job"></i>' : ''}</b><span class="nf33t-bar"><i style="width:${tot ? Math.round(done / tot * 100) : 0}%"></i></span><small>${done} of ${tot} done today</small></span></button>`; };
  el.innerHTML = `<div class="nf33t-people">${chip('all', 'Everyone', all)}${ms.map(m => chip(m.id, m.name + ((m.id === currentUserId && !/\(you\)/i.test(m.name)) ? '' : ''), all.filter(t => t.assignedTo === m.id))).join('')}</div>`;
}
function nf33TMove(id, col){
  const t = teamTasks.find(x => x.id === id); if(!t || nf33TCol(t) === col) return;
  const me = teamMe(), now = new Date().toISOString();
  if(col === 'done'){ setTaskFields(id, {status: 'done', completedAt: APP_TODAY, completedBy: me ? me.name : null}, {status: 'done', completed_at: now, completed_by_name: me ? me.name : null}, `Completed: "${t.title}"`); try{ showToast('Nice work! "' + t.title + '" is done.', 'success'); }catch(e){} }
  else if(col === 'doing') setTaskFields(id, {status: 'open', startedAt: APP_TODAY, acknowledgedAt: t.acknowledgedAt || APP_TODAY, completedAt: null, completedBy: null}, {status: 'open', started_at: now, acknowledged_at: now, completed_at: null, completed_by_name: null}, `Started: "${t.title}"`);
  else setTaskFields(id, {status: 'open', startedAt: null, completedAt: null, completedBy: null}, {status: 'open', started_at: null, completed_at: null, completed_by_name: null}, `Moved back to To do: "${t.title}"`);
}
function nf33TSeedDemo(){ if(myBusiness || NF33T.seeded) return; NF33T.seeded = true; const t = teamTasks.find(x => x.id === 'nf-task-3'); if(t && !t.startedAt) t.startedAt = APP_TODAY; }
(function(){
  try{ renderTaskList = nf33RenderTaskList; window.renderTaskList = nf33RenderTaskList; renderTeamPeopleStrip = nf33RenderPeople; window.renderTeamPeopleStrip = nf33RenderPeople; }catch(e){ console.warn('nf33 team', e); }
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ if(page && page.id === 'page-team'){ const q = page.querySelector('.team-quickadd'); if(q && !q.classList.contains('nf33t-add')) q.classList.add('nf33t-add'); } }catch(e){} };
  window.nf26AfterPass = nf26AfterPass;
})();
