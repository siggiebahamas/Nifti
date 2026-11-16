/* ===== Round 38 ===== */

/* ---------- 1. Money overview: add a photo of the bill right from "Coming up" ---------- */
(function(){
  if(typeof nf31Open !== 'function') return;
  const base = nf31Open;
  const w = function(i){
    base.apply(this, arguments);
    try{ nf38AttachBlock(i); }catch(e){ console.warn('nf38 attach', e); }
  };
  window.nf31Open = w; try{ nf31Open = w; }catch(e){}
})();
function nf38AttachBlock(i){
  const x = NF31N.items[i]; if(!x) return;
  const pop = document.querySelector('#nf31Next .nf31-pop'); if(!pop) return;
  const acts = pop.querySelector('.nf31-acts');
  const box = document.createElement('div'); box.className = 'nf38-att';
  if(x.po){
    const sell = x.k === 'in';
    box.innerHTML = `<h4>Photos and files</h4><div class="nf38-thumbs" id="nf38Thumbs"><span class="nf38-load">Loading…</span></div>
      <label class="nf38-add"><input type="file" accept="image/*" multiple hidden onchange="nf38AddPhotos('${x.po.id}', ${sell}, this)">
        <span class="nf38-add-ic">+</span><span><b>Add a photo of the ${sell ? 'invoice or payment slip' : 'bill or receipt'}</b><small>Take a picture or pick one. It's saved with order ${escapeHtml(String(x.po.poNumber || '').replace(/^PO-\d{4}-/, ''))}.</small></span></label>`;
    if(acts) pop.insertBefore(box, acts); else pop.appendChild(box);
    nf38Thumbs(x.po.id);
  } else if(x.k === 'exp' && x.last){
    box.innerHTML = `<h4>This month's bill</h4><button type="button" class="nf38-add" onclick="nf38NewBill(${i})"><span class="nf38-add-ic">+</span><span><b>Add the new ${escapeHtml(x.what)} bill</b><small>Snap the bill. Amount and details are filled in from last time; mark it paid now or later.</small></span></button>`;
    if(acts) pop.insertBefore(box, acts); else pop.appendChild(box);
  }
}
async function nf38Thumbs(poId){
  const el = document.getElementById('nf38Thumbs'); if(!el) return;
  let list = [];
  try{ if(typeof nfOpList === 'function') list = (await nfOpList(poId)) || (NFOP.cache && NFOP.cache[poId]) || []; }catch(e){ list = (typeof NFOP !== 'undefined' && NFOP.cache[poId]) || []; }
  if(!Array.isArray(list)) list = (typeof NFOP !== 'undefined' && NFOP.cache[poId]) || [];
  el.innerHTML = list.length ? list.map(p => `<button type="button" class="nf38-th" onclick="bkShowPhoto('${String(p.url).replace(/'/g, '%27')}')" title="${escapeHtml((p.caption || p.kind || '') + (p.by ? ' · ' + p.by : ''))}"><img src="${escapeHtml(p.url)}" alt=""></button>`).join('')
    : '<span class="nf38-none">Nothing attached yet.</span>';
}
async function nf38AddPhotos(poId, sell, input){
  const files = [...(input.files || [])]; if(!files.length) return;
  const th = document.getElementById('nf38Thumbs'); if(th) th.insertAdjacentHTML('beforeend', '<span class="nf38-load">Saving…</span>');
  let ok = 0;
  for(const f of files){
    const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(f); });
    if(dataUrl && await nfOpAdd(poId, sell ? 'other' : 'payment', dataUrl, sell ? 'Invoice / payment slip' : 'Bill / receipt')) ok++;
  }
  input.value = '';
  try{ const po = getPO(poId); if(po && po.invoice && !po.invoice.attachmentName && files[0]) po.invoice.attachmentName = files[0].name; }catch(e){}
  if(ok) showToast(ok === 1 ? 'Photo saved with the order ✓' : `${ok} photos saved with the order ✓`, 'success');
  nf38Thumbs(poId);
}
function nf38NewBill(i){
  const x = NF31N.items[i]; if(!x || !x.last) return;
  slClose('nf31Next');
  try{ openExpenseForm(); }catch(e){ return; }
  setTimeout(() => {
    try{ if(typeof nf35UseExpense === 'function') nf35UseExpense(x.last.id); }catch(e){}
    try{ if(typeof EXF !== 'undefined' && EXF){ EXF.paidFrom = 'credit'; EXF.date = x.d > APP_TODAY ? APP_TODAY : x.d; if(typeof exRender === 'function') exRender(); } }catch(e){}
    const inp = [...document.querySelectorAll('.share-modal-backdrop input[type=file], .sl-modal input[type=file]')].find(el => /image/.test(el.accept || 'image'));
    if(inp) setTimeout(() => inp.click(), 150);
  }, 250);
}

/* ---------- 2. Team: the people row stays one tidy line, even with 25 people ---------- */
const NF38T = {max: 5};
function nf38People(){
  const el = document.getElementById('teamPeopleStrip'); if(!el || typeof nf33TMembers !== 'function') return;
  const ms = nf33TMembers(), all = teamTasks.filter(t => teamScoped(t) && !t.deletedAt);
  const today = t => t.status === 'done' && (t.completedAt || t.doneAt) === APP_TODAY;
  const stat = list => { const open = list.filter(t => t.status !== 'done').length, done = list.filter(today).length; return {open, done, tot: open + done, late: list.some(t => t.status !== 'done' && t.dueDate && t.dueDate < APP_TODAY)}; };
  const people = ms.map(m => Object.assign({id: m.id, name: m.name}, stat(all.filter(t => t.assignedTo === m.id))));
  // busiest and late first, so the people you need to see are always in view
  people.sort((a, b) => (b.late - a.late) || (b.open - a.open) || a.name.localeCompare(b.name));
  const pick = NF33T.who;
  const max = window.innerWidth < 520 ? 1 : window.innerWidth < 700 ? 3 : window.innerWidth < 1200 ? 4 : NF38T.max;
  let shown = people.slice(0, max);
  if(pick !== 'all' && !shown.some(p => p.id === pick)){ const sel = people.find(p => p.id === pick); if(sel) shown = [sel].concat(shown.slice(0, max - 1)); }
  const more = people.length - shown.length, ev = stat(all);
  const chip = (p, isAll) => `<button type="button" class="nf38-p${pick === p.id ? ' on' : ''}" onclick="NF33T.who='${p.id}'; renderTeamPeopleStrip(); renderTaskList()">
    ${isAll ? '<span class="nf38-av all">All</span>' : `<span class="nf38-av" style="background:${typeof nfIniColor === 'function' ? nfIniColor(p.name) : '#475467'}">${escapeHtml(teamInitials(p.name))}</span>`}
    <span class="nf38-pn"><b>${escapeHtml(isAll ? 'Everyone' : p.name.split(' ')[0])}${p.late ? '<i class="late" title="Has a late job"></i>' : ''}</b><small>${p.done}/${p.tot} done</small></span></button>`;
  el.innerHTML = `<div class="nf38-people">${chip(Object.assign({id: 'all'}, ev), true)}${shown.map(p => chip(p)).join('')}
    ${more > 0 ? `<button type="button" class="nf38-more" onclick="nf38AllPeople()">+${more} more</button>` : ''}</div>`;
}
function nf38AllPeople(){
  const ms = nf33TMembers(), all = teamTasks.filter(t => teamScoped(t) && !t.deletedAt);
  const rows = ms.map(m => { const l = all.filter(t => t.assignedTo === m.id), open = l.filter(t => t.status !== 'done').length, late = l.some(t => t.status !== 'done' && t.dueDate && t.dueDate < APP_TODAY); return {m, open, late}; })
    .sort((a, b) => (b.late - a.late) || (b.open - a.open) || a.m.name.localeCompare(b.m.name));
  slModal('nf38People', `<div class="sl-sheet-h"><b>Your team (${ms.length})</b><button class="sl-x" onclick="slClose('nf38People')" aria-label="Close">✕</button></div>
    <input class="nf38-search" type="search" placeholder="Search a name" oninput="const q=this.value.toLowerCase(); document.querySelectorAll('#nf38People .nf38-pr').forEach(r=>r.hidden=!r.dataset.n.includes(q))">
    <div class="nf38-plist">${rows.map(r => `<button type="button" class="nf38-pr" data-n="${escapeHtml(r.m.name.toLowerCase())}" onclick="NF33T.who='${r.m.id}'; slClose('nf38People'); renderTeamPeopleStrip(); renderTaskList()">
      <span class="nf38-av" style="background:${typeof nfIniColor === 'function' ? nfIniColor(r.m.name) : '#475467'}">${escapeHtml(teamInitials(r.m.name))}</span><b>${escapeHtml(r.m.name)}</b>
      <small>${r.late ? '<i class="late"></i>Late job · ' : ''}${r.open} open</small></button>`).join('')}</div>`);
}
(function(){
  const base = window.renderTeamPeopleStrip;
  if(typeof base !== 'function') return;
  const w = function(){ const r = base.apply(this, arguments); try{ nf38People(); }catch(e){ console.warn('nf38 people', e); } return r; };
  window.renderTeamPeopleStrip = w; try{ renderTeamPeopleStrip = w; }catch(e){}
})();
