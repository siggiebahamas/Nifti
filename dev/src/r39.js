/* ===== Round 39 =====
   1. Chats sorted into folders: All chats, New on Viber, Customers, Suppliers, Team, and Personal last.
      On a computer the folders are a column with names, like email. On a phone (and narrow screens)
      they are a rail of icons down the left side.
   2. Team board: soft colored lanes (blue to do, yellow doing, green done), bold headings, a big clear count,
      and job cards laid out in three calm lines: the job, when, who. */

/* ---------- 1. Chat folders ---------- */
const NF39_F = [
  {k: 'all', l: 'All chats', s: 'All'},
  {k: 'new', l: 'New on Viber', s: 'New'},
  {k: 'cus', l: 'Customers', s: 'Customers'},
  {k: 'sup', l: 'Suppliers', s: 'Suppliers'},
  {k: 'team', l: 'Team', s: 'Team'},
  {k: 'pers', l: 'Personal', s: 'Personal'},
];
const NF39_KEYS = NF39_F.map(f => f.k);
const NF39_IC = {
  all: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  new: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="4"/><path d="M3 20a7 7 0 0 1 11-5.7"/><path d="M19 14v6M16 17h6"/></svg>',
  cus: NF33_IC.cus, sup: NF33_IC.sup, team: NF33_IC.team,
  pers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>',
};
// a fresh start on the new layout: everyone opens on All chats once
nf33Tab = function(){
  if(NF33.tab && NF39_KEYS.includes(NF33.tab)) return NF33.tab;
  let t = null; try{ t = localStorage.getItem('nifti-msg-folder'); }catch(e){}
  NF33.tab = NF39_KEYS.includes(t) ? t : 'all'; return NF33.tab;
};
window.nf33Tab = nf33Tab;
nf33SetTab = function(t){
  if(!NF39_KEYS.includes(t)) t = 'all';
  NF33.tab = t; try{ localStorage.setItem('nifti-msg-folder', t); }catch(e){}
  const box = document.getElementById('convList'); if(box) box.scrollTop = 0;
  nf33Paint();
};
window.nf33SetTab = nf33SetTab;

function nf39Personal(){
  if(typeof NF36V === 'undefined') return [];
  const me = typeof nf36vMeId === 'function' ? nf36vMeId() : null;
  return NF36V.threads.filter(t => (t.status === 'ignored' || (t.status === 'new' && typeof nf37vSort === 'function' && nf37vSort(t).cls === 'personal'))
    && (!myBusiness || !t.owner_user_id || t.owner_user_id === me));
}
function nf39Counts(){
  const c = Object.assign({team: 0, cus: 0, sup: 0}, nf33Counts());
  let n = 0;
  allConversations().forEach(x => { if(x && x._new && x.unread > 0){ n++; const g = nf33Group(x); if(c[g] > 0) c[g]--; } });
  c.new = n; c.all = c.new + c.cus + c.sup + c.team; c.pers = nf39Personal().length;
  return c;
}
function nf39TeamTs(){
  const {msgs} = nf33Team(), m = msgs[msgs.length - 1]; if(!m) return '0000-00-00 0000 00000';
  const h = String(m.time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i); let mins = 0;
  if(h) mins = (Number(h[1]) % 12) * 60 + Number(h[2]) + (/pm/i.test(h[3]) ? 720 : 0);
  return (m.date || (typeof APP_TODAY !== 'undefined' ? APP_TODAY : '')) + ' ' + String(mins).padStart(4, '0') + ' 00000';
}
function nf39PersHtml(){
  const list = nf39Personal();
  const note = `<p class="nf39-pnote">Family and friends land here, out of your business chats. Only you can see this list. If one is really a customer or supplier, move them.</p>`;
  if(!list.length) return note + `<p class="nf33-empty">No personal chats.</p>`;
  return note + list.map(t => `<div class="nf39-prow"><div class="nf39-pmain"><span class="nf33-av">${nfAvatarInner(t.title || '?')}</span>
      <span class="nf39-pm"><b>${escapeHtml(t.title || 'Viber chat')}</b><small>${t.status === 'ignored' ? 'Kept out of Nifti' : 'Looks personal'}</small></span>
      ${t.status === 'ignored' ? '' : `<button type="button" class="nf39-keep" title="Confirm it's personal. Nifti deletes what it kept from this chat." onclick="nf37vPersonalize('${t.id}')">Keep personal</button>`}</div>
      <div class="nf39-pacts"><button type="button" onclick="nf37vAdd('${t.id}','customer')">It's a customer</button><button type="button" onclick="nf37vAdd('${t.id}','supplier')">It's a supplier</button></div></div>`).join('');
}
function nf39ListHtml(tab){
  const convs = allConversations().filter(Boolean);
  const byLast = list => list.sort((a, b) => nf33Ts(b).localeCompare(nf33Ts(a)));
  if(tab === 'team') return nf33TeamRow();
  if(tab === 'pers') return nf39PersHtml();
  if(tab === 'all'){
    const rows = convs.map(c => ({ts: nf33Ts(c), h: nf33Row(c)}));
    rows.push({ts: nf39TeamTs(), h: nf33TeamRow().replace(/<p class="nf33-note">[\s\S]*?<\/p>/, '')});
    rows.sort((a, b) => b.ts.localeCompare(a.ts));
    return rows.map(r => r.h).join('');
  }
  if(tab === 'new'){
    const list = byLast(convs.filter(c => c._new));
    return list.length ? list.map(nf33Row).join('') : `<p class="nf33-empty">No new contacts. When someone who isn't saved yet messages you on Viber, they show up here first.</p>`;
  }
  const list = byLast(convs.filter(c => !c._new && nf33Group(c) === tab));
  return list.length ? list.map(nf33Row).join('') : `<p class="nf33-empty">No ${tab === 'cus' ? 'customer' : 'supplier'} chats yet. They show up here as soon as one starts.</p>`;
}
function nf39Nav(tab){
  const side = document.querySelector('#page-messages .msg-sidebar'); if(!side) return;
  let nav = document.getElementById('nf39Fold');
  if(!nav){ nav = document.createElement('nav'); nav.id = 'nf39Fold'; nav.className = 'nf39-fold'; nav.setAttribute('aria-label', 'Chat folders'); side.insertBefore(nav, side.firstChild); }
  side.classList.add('nf39-side');
  const cnt = nf39Counts(), F = k => NF39_F.find(f => f.k === k);
  const item = f => {
    const n = cnt[f.k] || 0;
    const badge = f.k === 'pers' ? (n ? `<em class="g">${n}</em>` : '') : n ? `<em>${n > 99 ? '99+' : n}</em>` : '';
    return `<button type="button" class="nf39-fi${tab === f.k ? ' on' : ''}" data-f="${f.k}" aria-current="${tab === f.k ? 'true' : 'false'}" title="${f.l}" onclick="nf33SetTab('${f.k}')"><span class="nf39-ic">${NF39_IC[f.k]}</span><span class="nf39-l">${f.l}</span><span class="nf39-s">${f.s}</span>${badge}</button>`;
  };
  const html = item(F('all')) + '<span class="nf39-fh">Folders</span>' + ['new', 'cus', 'sup', 'team'].map(k => item(F(k))).join('') + '<span class="nf39-sp"></span>' + item(F('pers'));
  if(nav._h !== html){ nav.innerHTML = html; nav._h = html; }
  // on a phone the rail starts right under the title and search
  const head = document.getElementById('nf33Head');
  if(head){ const top = head.offsetTop + head.offsetHeight; if(top > 0 && nav._top !== top){ side.style.setProperty('--nf39-top', top + 'px'); nav._top = top; } }
}
function nf39Paint(){
  const h = nf33Head(), box = document.getElementById('convList'); if(!h || !box) return;
  const tab = nf33Tab(), q = NF33.q.trim();
  h.classList.toggle('searching', !!q);
  try{ nf39Nav(tab); }catch(e){ console.warn('nf39 nav', e); }
  const html = q ? nf33SearchHtml(q) : nf39ListHtml(tab);
  // only the highlighted chat changed? move the highlight, don't redraw (nothing on screen moves)
  const key = html.replace(/ (on|un)(?=[ "])/g, '').replace(/<em class="nf33-badge">\d+<\/em>/g, '');
  const g = q ? 'search' : tab;
  if(box._nf33key === key && box.dataset.g === g){
    const pickedId = (typeof NF18T !== 'undefined' && NF18T.on) ? '__team' : activeConvId;
    box.querySelectorAll('.nf33-row').forEach(r => { const m = (r.getAttribute('onclick') || '').match(/selectConversation\('([^']+)'/), id = m ? m[1] : (/nf18OpenTeam/.test(r.getAttribute('onclick') || '') ? '__team' : ''); r.classList.toggle('on', id === pickedId); const c = id && id !== '__team' ? allConversations().find(x => x.id === id) : null; if(c && c.unread <= 0){ r.classList.remove('un'); const b = r.querySelector('.nf33-badge'); if(b) b.remove(); } });
  } else { box.innerHTML = html; box._nf33key = key; }
  box.dataset.g = g;
  try{ updateMessagesBadge(); }catch(e){}
  try{ if(document.getElementById('oneHomeMsgs') && typeof renderOneHomeMessages === 'function') renderOneHomeMessages(); }catch(e){}
}
(function(){
  nf33Paint = function(){ nf39Paint(); try{ if(typeof nf36vPaintExtras === 'function') nf36vPaintExtras(); }catch(e){ console.warn('nf36v', e); } };
  window.nf33Paint = nf33Paint;
  // the personal link at the top of the list is now its own folder
  if(typeof nf36vNewHtml === 'function'){ nf36vNewHtml = function(){ return ''; }; window.nf36vNewHtml = nf36vNewHtml; }
  // opening a chat keeps you in the folder you're in (All stays All; a new contact stays in New)
  const sc = window.selectConversation;
  if(typeof sc === 'function' && !sc._nf39){
    const w = function(id){
      const before = nf33Tab(), r = sc.apply(this, arguments);
      try{
        const c = allConversations().find(x => x && x.id === id);
        const want = before === 'all' ? 'all' : (c && c._new) ? 'new' : NF33.tab;
        if(NF33.tab !== want){ NF33.tab = want; nf33Paint(); }
      }catch(e){}
      return r;
    };
    Object.keys(sc).forEach(k => { w[k] = sc[k]; }); w._nf39 = true; window.selectConversation = w; try{ selectConversation = w; }catch(e){}
  }
  const ot = window.nf18OpenTeam;
  if(typeof ot === 'function' && !ot._nf39){
    const w = function(){ const before = nf33Tab(), r = ot.apply(this, arguments); if(before === 'all' && NF33.tab !== 'all'){ NF33.tab = 'all'; try{ nf33Paint(); }catch(e){} } return r; };
    Object.keys(ot).forEach(k => { w[k] = ot[k]; }); w._nf39 = true; w._nf33 = true; window.nf18OpenTeam = w; try{ nf18OpenTeam = w; }catch(e){}
  }
  // the photo button keeps its name for screen readers when it shows only its icon
  setTimeout(() => { document.querySelectorAll('.composer-row .nf-take').forEach(x => { if(!x.getAttribute('aria-label')) x.setAttribute('aria-label', 'Take a photo'); x.title = 'Take a photo'; }); }, 3000);
  window.addEventListener('resize', () => { const nav = document.getElementById('nf39Fold'); if(nav){ nav._top = -1; try{ nf39Nav(nf33Tab()); }catch(e){} } });
})();

/* ---------- 2. Team board ---------- */
const NF39T_IC = {
  late: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
};
function nf39TWhen(t){
  const day = d => (typeof bkDayLabel === 'function' ? bkDayLabel(d) : d);
  if(t.status === 'done'){
    const by = t.completedBy ? ' by ' + String(t.completedBy).split(' ')[0] : '', when = t.completedAt ? ' · ' + day(t.completedAt) : '';
    return `<span class="nf39-when g">${NF39T_IC.ok}Done${escapeHtml(by + when)}</span>`;
  }
  if(!t.dueDate) return '';
  if(t.dueDate < APP_TODAY){ const d = day(t.dueDate); return `<span class="nf39-when r">${NF39T_IC.late}Late · due ${escapeHtml(/^(yesterday|today|tomorrow)$/i.test(d) ? d.toLowerCase() : d)}</span>`; }
  if(t.dueDate === APP_TODAY) return `<span class="nf39-when y">${NF39T_IC.late}Due today</span>`;
  return `<span class="nf39-when">${NF39T_IC.cal}Due ${escapeHtml(day(t.dueDate))}</span>`;
}
nf33TCard = function(t){
  const c = nf33TCol(t), who = t.assignedTo ? teamMemberName(t.assignedTo) : 'Anyone';
  const btn = c === 'todo' ? `<button type="button" class="nf39-go" onclick="nf33TMove('${t.id}','doing')">Start</button>`
    : c === 'doing' ? `<button type="button" class="nf39-go done" onclick="nf33TMove('${t.id}','done')">${NF39T_IC.ok}Done</button>`
    : `<button type="button" class="nf39-go ghost" onclick="nf33TMove('${t.id}','todo')">Undo</button>`;
  const late = t.status !== 'done' && t.dueDate && t.dueDate < APP_TODAY;
  return `<article class="nf39-card ${c}${late ? ' late' : ''}" draggable="true" data-id="${t.id}" ondragstart="NF33T.drag='${t.id}'; this.classList.add('dragging')" ondragend="this.classList.remove('dragging')">
    <div class="nf39-ct"><b>${escapeHtml(t.title)}</b><button type="button" class="nf39-x" title="Delete" aria-label="Delete task" onclick="deleteTask('${t.id}')">✕</button></div>
    ${nf39TWhen(t)}
    <div class="nf39-cf"><span class="nf39-who"><span class="nf39-av" style="background:${typeof nfIniColor === 'function' ? nfIniColor(who) : '#475467'}">${escapeHtml(teamInitials(who))}</span><span>${escapeHtml(who.split(' ')[0])}</span></span>${btn}</div></article>`;
};
window.nf33TCard = nf33TCard;
function nf39Board(){
  const b = document.querySelector('#taskListOpen .nf33t-board'); if(!b) return;
  b.classList.add('nf39b');
  b.querySelectorAll('.nf33t-col').forEach(col => {
    const hd = col.querySelector(':scope > header'); if(!hd || hd.dataset.nf39) return;
    const n = hd.querySelector('.nf33t-n'), title = hd.querySelector('b'), sub = hd.querySelector('small'), num = n ? n.textContent.trim() : '0';
    hd.innerHTML = `<span class="nf39-ht"><b>${escapeHtml(title ? title.textContent : '')}</b><small>${escapeHtml(sub ? sub.textContent : '')}</small></span><span class="nf39-n" aria-label="${num} ${num === '1' ? 'job' : 'jobs'}">${num}</span>`;
    hd.dataset.nf39 = '1';
  });
}
(function(){
  const rtl = window.renderTaskList;
  if(typeof rtl !== 'function' || rtl._nf39) return;
  const w = function(){ const r = rtl.apply(this, arguments); try{ nf39Board(); }catch(e){ console.warn('nf39 board', e); } return r; };
  Object.keys(rtl).forEach(k => { w[k] = rtl[k]; }); w._nf39 = true;
  window.renderTaskList = w; try{ renderTaskList = w; }catch(e){}
})();
