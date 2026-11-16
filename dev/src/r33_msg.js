/* ===== Round 33: Messages like Viber / WhatsApp. Three colored tabs that stay on top, photo on the left,
   last message in the middle, a search for names or words, and the chat filling the screen ===== */
const NF33 = {tab: null, q: ''};
const NF33_TABS = [['team', 'Team'], ['cus', 'Customers'], ['sup', 'Suppliers']];
const NF33_IC = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2a5 5 0 0 1 5.5 5.8"/></svg>',
  cus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/></svg>',
  sup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="7" width="13" height="10" rx="1"/><path d="M14.5 10H19l3 3.5V17h-7.5z"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="18" cy="18.5" r="1.8"/></svg>',
  photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  mega: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/></svg>',
};
function nf33Tab(){
  if(NF33.tab) return NF33.tab;
  let t = null; try{ t = localStorage.getItem('nifti-msg-tab'); }catch(e){}
  NF33.tab = ['team', 'cus', 'sup'].includes(t) ? t : 'cus'; return NF33.tab;
}
function nf33SetTab(t){ NF33.tab = t; try{ localStorage.setItem('nifti-msg-tab', t); }catch(e){} nf33Paint(); }
function nf33Group(c){ return convSide(c) === 'supplier' ? 'cus' : 'sup'; }
function nf33Team(){ const tm = (typeof teamMembers !== 'undefined' && teamMembers) || []; const msgs = (typeof teamChatMessages !== 'undefined' ? teamChatMessages : []).filter(m => typeof teamScoped !== 'function' || teamScoped(m)); return {tm, msgs}; }
function nf33When(m){
  if(!m) return ''; const t = String(m.time || ''), d = t.split(',')[0].trim();
  if(/^today$/i.test(d)) return (t.split(',')[1] || '').trim() || 'Today';
  if(m.date && typeof APP_TODAY !== 'undefined'){ if(m.date === APP_TODAY) return (t.split(',')[1] || d).trim(); try{ if(m.date === addDaysIso(APP_TODAY, -1)) return 'Yesterday'; }catch(e){} }
  return d;
}
function nf33Preview(m){
  if(!m) return '';
  const me = m.from === 'me' ? 'You: ' : '';
  if(m.attachment){ const a = m.attachment, img = a.image || /\.(jpe?g|png|webp|gif|heic)$/i.test(a.name || '');
    return `${me}<span class="nf33-pi">${img ? NF33_IC.photo : NF33_IC.file}</span>${escapeHtml(m.text && m.text.length < 60 ? m.text : (img ? 'Photo' : a.name || 'File'))}`; }
  return me + escapeHtml(m.text || '');
}
function nf33Ts(c){
  const m = c.messages[c.messages.length - 1]; if(!m) return '';
  const t = String(m.time || ''), d = m.date || (/^today/i.test(t) ? APP_TODAY : '');
  const h = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i); let mins = 0;
  if(h){ mins = (Number(h[1]) % 12) * 60 + Number(h[2]) + (/pm/i.test(h[3]) ? 720 : 0); }
  return d + ' ' + String(mins).padStart(4, '0') + ' ' + String(c.messages.length).padStart(5, '0');
}
function nf33Counts(){
  const all = allConversations(), c = {team: 0, cus: 0, sup: 0};
  // the red circle counts people (chats with something unread), not messages
  all.forEach(x => { if(x.unread > 0) c[nf33Group(x)] += 1; });
  try{ if(typeof teamUnreadChatCount === 'function' && teamUnreadChatCount() > 0) c.team += 1; }catch(e){}
  return c;
}
function nf33Row(c){
  const side = convSide(c), last = c.messages[c.messages.length - 1], g = nf33Group(c);
  let oc = null; try{ oc = nfwConvOrder(c, side); }catch(e){}
  const act = c.id === activeConvId && side === currentAppRole && !(typeof NF18T !== 'undefined' && NF18T.on);
  return `<button type="button" class="nf33-row${c.unread > 0 ? ' un' : ''}${act ? ' on' : ''}" data-g="${g}" onclick="selectConversation('${c.id}','${side}')">
    <span class="nf33-av">${nfAvatarInner(c.name)}</span>
    <span class="nf33-mid"><span class="nf33-top"><b>${escapeHtml(c.name)}</b><time>${escapeHtml(nf33When(last))}</time></span>
      <span class="nf33-bot"><span class="nf33-pv">${nf33Preview(last) || '<i>No messages yet</i>'}</span>${c.unread > 0 ? `<em class="nf33-badge">${c.unread}</em>` : ''}</span>
      ${oc && oc.turn === 'you' ? `<span class="nf33-oc" onclick="event.stopPropagation(); openOrderDetailModal('${oc.id}', ${oc.sell})">${escapeHtml(oc.n)} · ${escapeHtml(oc.label)} · your turn</span>` : ''}</span></button>`;
}
function nf33TeamRow(){
  const {tm, msgs} = nf33Team(), last = msgs[msgs.length - 1], on = typeof NF18T !== 'undefined' && NF18T.on;
  return `<button type="button" class="nf33-row${on ? ' on' : ''}" data-g="team" onclick="nf18OpenTeam()">
    <span class="nf33-av nf33-avt">${NF33_IC.team}</span>
    <span class="nf33-mid"><span class="nf33-top"><b>Team chat</b><time>${last ? escapeHtml(String(last.time || '')) : ''}</time></span>
      <span class="nf33-bot"><span class="nf33-pv">${last ? escapeHtml((last.author ? last.author.split(' ')[0] + ': ' : '') + (last.text || '')) : 'Only your own people see this'}</span></span></span></button>
    <p class="nf33-note">${tm.length ? `${tm.length} ${tm.length === 1 ? 'person' : 'people'} on your team. Customers and suppliers never see this chat.` : 'Add your staff on the Team page to chat with them here.'}</p>`;
}
function nf33Hl(text, q){ const s = escapeHtml(text); if(!q) return s; const i = s.toLowerCase().indexOf(escapeHtml(q).toLowerCase()); if(i < 0) return s; const n = escapeHtml(q).length; return s.slice(0, i) + '<mark>' + s.slice(i, i + n) + '</mark>' + s.slice(i + n); }
function nf33SearchHtml(q){
  const all = allConversations(), lq = q.toLowerCase();
  const chats = all.filter(c => c.name.toLowerCase().includes(lq));
  const hits = [];
  all.forEach(c => (c.messages || []).forEach((m, i) => { const t = String(m.text || '') + ' ' + (m.attachment ? m.attachment.name : ''); if(t.toLowerCase().includes(lq)) hits.push({c, m, i}); }));
  hits.sort((a, b) => String(b.m.date || '').localeCompare(String(a.m.date || '')));
  const tag = c => `<span class="nf33-tag" data-g="${nf33Group(c)}">${nf33Group(c) === 'cus' ? 'Customer' : 'Supplier'}</span>`;
  return (chats.length ? `<h6 class="nf33-sh">Chats</h6>` + chats.map(c => nf33Row(c)).join('') : '')
    + (hits.length ? `<h6 class="nf33-sh">Messages</h6>` + hits.slice(0, 40).map(h => { const t = String(h.m.text || '') || (h.m.attachment ? h.m.attachment.name : ''), j = t.toLowerCase().indexOf(lq), snip = (j > 30 ? '…' + t.slice(j - 24) : t).slice(0, 120);
        return `<button type="button" class="nf33-hit" onclick="nf33OpenHit('${h.c.id}','${convSide(h.c)}',${h.i})"><span class="nf33-av sm">${nfAvatarInner(h.c.name)}</span><span class="nf33-mid"><span class="nf33-top"><b>${escapeHtml(h.c.name)}</b>${tag(h.c)}<time>${escapeHtml(nf33When(h.m))}</time></span><span class="nf33-pv">${h.m.from === 'me' ? 'You: ' : ''}${nf33Hl(snip, q)}</span></span></button>`; }).join('') : '')
    || `<p class="nf33-empty">Nothing found for "${escapeHtml(q)}".</p>`;
}
function nf33OpenHit(id, side, idx){
  selectConversation(id, side);
  setTimeout(() => { const rows = document.querySelectorAll('#threadBody .msg-bubble-row'), c = allConversations().find(x => x.id === id); if(!c) return;
    const want = c.messages[idx]; const el = [...rows].find(r => want && r.textContent.includes(String(want.text || (want.attachment && want.attachment.name) || '').slice(0, 30)));
    if(el){ el.scrollIntoView({block: 'center'}); el.classList.add('nf33-flash'); setTimeout(() => el.classList.remove('nf33-flash'), 1800); } }, 250);
}
function nf33Head(){
  const side = document.querySelector('#page-messages .msg-sidebar'), list = document.getElementById('convList'); if(!side || !list) return null;
  let h = document.getElementById('nf33Head');
  if(!h){ h = document.createElement('div'); h.id = 'nf33Head'; h.className = 'nf33-head'; side.insertBefore(h, list);
    h.innerHTML = `<div class="nf33-title"><b>Chats</b><button type="button" class="nf33-ico" title="Message all customers" aria-label="Message all customers" onclick="try{ openAnnouncementComposer(); }catch(e){}">${NF33_IC.mega}</button></div>
      <label class="nf33-search">${NF33_IC.search}<input id="nf33Q" type="search" placeholder="Search name or message" autocomplete="off" oninput="NF33.q=this.value; nf33Paint()"><button type="button" class="nf33-clr" aria-label="Clear search" onclick="NF33.q=''; document.getElementById('nf33Q').value=''; nf33Paint()">${NF33_IC.x}</button></label>
      <div class="nf33-tabs" role="tablist"></div>`; }
  return h;
}
function nf33Paint(){
  const h = nf33Head(), box = document.getElementById('convList'); if(!h || !box) return;
  const tab = nf33Tab(), cnt = nf33Counts(), q = NF33.q.trim();
  h.classList.toggle('searching', !!q);
  h.querySelector('.nf33-tabs').innerHTML = NF33_TABS.map(([k, l]) => `<button type="button" role="tab" data-g="${k}" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" onclick="nf33SetTab('${k}')"><span class="nf33-ti">${NF33_IC[k]}</span><span class="nf33-tl">${l}</span>${cnt[k] ? `<em>${cnt[k] > 99 ? '99+' : cnt[k]}</em>` : ''}</button>`).join('');
  if(q){ box.innerHTML = nf33SearchHtml(q); }
  else if(tab === 'team'){ box.innerHTML = nf33TeamRow(); }
  else {
    // order = last message only (like WhatsApp). Opening a chat or reading it never moves it; a new message does.
    const list = allConversations().filter(c => nf33Group(c) === tab).sort((a, b) => nf33Ts(b).localeCompare(nf33Ts(a)));
    box.innerHTML = list.length ? list.map(nf33Row).join('') : `<p class="nf33-empty">No ${tab === 'cus' ? 'customer' : 'supplier'} chats yet. They show up here as soon as one starts.</p>`;
  }
  box.dataset.g = q ? 'all' : tab;
  try{ updateMessagesBadge(); }catch(e){}
  try{ if(document.getElementById('oneHomeMsgs') && typeof renderOneHomeMessages === 'function') renderOneHomeMessages(); }catch(e){}
}
// opening a chat jumps to its tab so the colored tab always matches what's on screen
(function(){
  const rcl = function(){ try{ nf33Paint(); }catch(e){ console.warn('nf33', e); } };
  rcl._nf18 = true; rcl._nf33 = true; window.renderConversationList = rcl; try{ renderConversationList = rcl; }catch(e){}
  const sc = window.selectConversation;
  if(typeof sc === 'function' && !sc._nf33){ const w = function(id){ const c = allConversations().find(x => x.id === id); if(c && !NF33.q){ const g = nf33Group(c); if(NF33.tab !== g){ NF33.tab = g; } } return sc.apply(this, arguments); };
    Object.keys(sc).forEach(k => { w[k] = sc[k]; }); w._nf33 = true; window.selectConversation = w; try{ selectConversation = w; }catch(e){} }
  const ot = window.nf18OpenTeam;
  if(typeof ot === 'function' && !ot._nf33){ const w = function(){ NF33.tab = 'team'; return ot.apply(this, arguments); }; w._nf33 = true; window.nf18OpenTeam = w; try{ nf18OpenTeam = w; }catch(e){} }
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ if(page && page.id === 'page-messages'){ document.body.classList.add('nf33-msgs'); if(!document.getElementById('nf33Head')) nf33Paint(); } else document.body.classList.remove('nf33-msgs'); }catch(e){} };
  window.nf26AfterPass = nf26AfterPass;
})();
