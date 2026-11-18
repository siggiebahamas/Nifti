/* ===== Round 44 ===== */

/* ---------- 1. Small fixes that make every page easier ---------- */
// The menu group holding the page you are on always opens, so the highlight is never hidden inside a folded group
function nf44Menu(){
  const a = document.querySelector('#view-app .sidebar .nav-item.active'); if(!a) return;
  const g = a.closest('.nf20-g'); if(!g || !g.classList.contains('folded')) return;
  g.classList.remove('folded'); const h = g.querySelector(':scope > .nf20-h'); if(h) h.setAttribute('aria-expanded', 'true');
  try{ const k = 'nifti-menu-fold-26', f = JSON.parse(localStorage.getItem(k) || '{}') || {}; if(g.dataset.g && f[g.dataset.g]){ f[g.dataset.g] = false; localStorage.setItem(k, JSON.stringify(f)); } }catch(e){}
}
// Stock: "200 on the way / confirmed, due Nov 25" becomes one line: "200 arriving Nov 25"
function nf44Stock(page){
  if(!page || page.id !== 'page-inventory') return;
  page.querySelectorAll('#inventoryTable .nf-inb').forEach(pill => {
    const small = pill.parentElement.querySelector('.nf-inb-d'); if(!small) return;
    const q = (pill.textContent.match(/([\d,]+)\s+on the way/i) || [])[1], d = (small.textContent.match(/(?:due|arriv\w*)\s+(.+)$/i) || [])[1];
    if(!q) return; const t = d ? `${q} arriving ${d.trim()}` : `${q} on the way`;
    const n = [...pill.childNodes].find(x => x.nodeType === 3 && x.textContent.trim()); if(n && n.textContent !== t) n.textContent = t;
    small.classList.add('nf44-hid');
  });
}
// Team: Trash and Job history move under the board, so the three lanes line up with the people column
function nf44Team(page){
  if(!page || page.id !== 'page-team') return;
  const bar = document.getElementById('nf36TBar'), main = bar && bar.closest('.nf41-main'); if(!bar || !main) return;
  if(main.lastElementChild !== bar) main.appendChild(bar);
  bar.classList.add('nf44-tbar');
}
// What runs out: one short line under each item instead of two crowded ones
function nf44RunsOut(page){
  if(!page || page.id !== 'page-dashboard') return;
  const many = typeof warehouses !== 'undefined' && Array.isArray(warehouses) && warehouses.length > 1;
  document.querySelectorAll('#page-dashboard .nf42-sr .sr-l').forEach(l => {
    if(l.dataset.nf44) return; l.dataset.nf44 = '1';
    const m1 = l.querySelector('.sr-m1'), m2 = l.querySelector('.sr-m2'); if(!m1 || !m2) return;
    const ems = [...m1.querySelectorAll('em')], sells = ems.find(e => /sells/i.test(e.textContent)), loc = ems.find(e => e !== sells);
    const sup = m2.querySelector('em'), dl = [...m2.querySelectorAll('em')].find(e => /deliver/i.test(e.textContent));
    const days = dl ? (dl.textContent.match(/(\d+)\s*day/) || [])[1] : '';
    const parts = [sells ? sells.textContent.trim().replace(/^sells\s*/i, 'Sells ') : '', sup ? sup.textContent.trim() + (days ? ` · ${days}-day delivery` : '') : '', many && loc ? loc.textContent.trim() : ''].filter(Boolean);
    const line = document.createElement('span'); line.className = 'nf44-srm'; line.textContent = parts.join(' · ');
    m1.replaceWith(line); m2.remove();
  });
}
(function(){
  if(typeof nf26AfterPass !== 'function') return;
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ document.body.classList.toggle('nf44-msg', !!page && page.id === 'page-messages'); }catch(e){} [nf44Menu, nf44Stock, nf44Team, nf44RunsOut].forEach(f => { try{ f(page); }catch(e){ console.warn('nf44', f.name, e); } }); };
  window.nf26AfterPass = nf26AfterPass;
})();

/* ---------- 2. To check: a table you can open; the status works itself out ----------
   New = nobody in charge yet. Someone is on it = a person is in charge. Fixed = Nifti no longer finds the problem
   (it checks again every time). OK'd = someone said it's fine, with a reason. Only "in charge" and "it's fine" are
   choices; the status itself is never tapped, so nothing gets closed by accident. */
const NF44I = {st: 'all', who: 'all', kind: 'all', open: null, closed: false};
function nf44IssSeen(list){
  let s = {}; try{ s = JSON.parse(localStorage.getItem('nifti-iss-seen') || '{}') || {}; }catch(e){}
  const now = APP_TODAY; list.forEach(i => { const o = s[i.fp] || {first: now}; s[i.fp] = Object.assign(o, {last: now, title: i.title, kind: i.kind, amount: i.amount || 0, gone: null}); });
  Object.keys(s).forEach(fp => { if(!list.some(i => i.fp === fp) && !s[fp].gone) s[fp].gone = now; });
  try{ localStorage.setItem('nifti-iss-seen', JSON.stringify(s)); }catch(e){}
  return s;
}
async function nf44IssSave(fp, status, to, note){
  const row = {business_id: myBusiness ? myBusiness.id : 'demo', fingerprint: fp, status, assigned_to: to ? String(to).slice(0, 80) : null, note: note ? String(note).slice(0, 500) : null};
  if(myBusiness){ const { data, error } = await sb.from('issue_decisions').upsert(row, {onConflict: 'business_id,fingerprint'}).select().single(); if(error){ showToast(error.message, 'error'); return false; } ISS.decisions[fp] = data; }
  else { const prev = ISS.decisions[fp] || {history: []}; ISS.decisions[fp] = Object.assign({}, row, {decided_by_name: bkMe(), updated_at: new Date().toISOString(), history: (prev.history || []).concat([{status, by: bkMe(), at: new Date().toISOString(), note: row.note, to: row.assigned_to}])}); try{ localStorage.setItem('nifti-issues-demo-v1', JSON.stringify(ISS.decisions)); }catch(e){} }
  return true;
}
async function nf44IssAssign(fp, name){ if(!name) return; if(await nf44IssSave(fp, 'assigned', name, null)){ showToast(name + ' is in charge of this now.', 'success'); renderIssuesPage(); } }
async function nf44IssFine(fp){ const note = prompt("Why is this fine? (kept in the history so others can see)", ''); if(note === null) return; if(String(note).trim().length < 3){ showToast('Write a short reason first.'); return; }
  const d = (ISS.decisions || {})[fp]; if(await nf44IssSave(fp, 'accepted', d ? d.assigned_to : null, note)){ showToast("OK'd as fine. It stays in the history.", 'success'); renderIssuesPage(); if(typeof updateBooksBadges === 'function') updateBooksBadges(); } }
async function nf44IssReopen(fp){ if(!confirm('Open this again?')) return; if(await nf44IssSave(fp, 'new', null, null)){ renderIssuesPage(); } }
function nf44IssState(i){ if(i.status === 'accepted') return ['ok', "OK'd as fine"]; if(i.status === 'resolved') return ['fix', 'Fixed']; return i.dec && i.dec.assigned_to ? ['on', 'Someone is on it'] : ['new', 'New']; }
function nf44Days(a, b){ try{ return Math.max(0, daysBetween(a, b || APP_TODAY)); }catch(e){ return 0; } }
renderIssuesPage = async function(){
  const body = document.getElementById('issBody'); if(!body) return;
  if(!booksCanSeeTotals()){ body.innerHTML = bkLockedForStaff('money'); return; }
  if(!BK.loaded || !ISS.decisions){ body.innerHTML = bkLoadingHtml(); await bkLoad(); await issLoadDecisions(); if(!LG.loaded) await lgLoad(); }
  const live = issuesAll(), seen = nf44IssSeen(live);
  const open = live.filter(i => !['resolved', 'accepted'].includes(i.status));
  const fixedAuto = Object.entries(seen).filter(([fp, s]) => s.gone && !live.some(i => i.fp === fp)).map(([fp, s]) => ({fp, title: s.title, kind: s.kind, amount: s.amount, date: s.gone, status: 'resolved', auto: true, dec: (ISS.decisions || {})[fp] || null, what: 'Nifti no longer finds this problem.', ev: [], basis: ''}));
  const closed = live.filter(i => ['resolved', 'accepted'].includes(i.status)).concat(fixedAuto);
  const people = [...new Set(open.map(i => i.dec && i.dec.assigned_to).filter(Boolean))], kinds = [...new Set(open.map(i => i.kind))];
  let list = NF44I.closed ? closed : open;
  if(!NF44I.closed){ if(NF44I.st !== 'all') list = list.filter(i => nf44IssState(i)[0] === NF44I.st); if(NF44I.who !== 'all') list = list.filter(i => (i.dec && i.dec.assigned_to) === NF44I.who); if(NF44I.kind !== 'all') list = list.filter(i => i.kind === NF44I.kind); }
  list.sort((a, b) => (a.lvl === 'red' ? 0 : 1) - (b.lvl === 'red' ? 0 : 1) || (b.amount || 0) - (a.amount || 0));
  const team = (typeof getActiveTeamMembers === 'function' ? getActiveTeamMembers() : []).map(m => String(m.name).replace(/ \(You\)$/, ''));
  const cnt = k => open.filter(i => nf44IssState(i)[0] === k).length;
  const chip = (k, label, n, dot) => `<button type="button" class="nf44-chip ${NF44I.st === k && !NF44I.closed ? 'on' : ''}" onclick="NF44I.closed=false; NF44I.st='${k}'; renderIssuesPage()">${dot ? `<i style="background:${dot}"></i>` : ''}${label} ${n}</button>`;
  const row = i => { const [sk, sl] = nf44IssState(i), s = seen[i.fp] || {}, age = nf44Days(s.first || i.date, i.auto ? i.date : APP_TODAY), who = i.dec && i.dec.assigned_to, isOpen = NF44I.open === i.fp, hist = (i.dec && i.dec.history) || [];
    return `<tr class="nf44-ir s-${sk} l-${i.lvl || 'amber'}"><td class="nf44-ip"><b>${escapeHtml(i.title)}</b>${i.what ? `<small>${escapeHtml(i.what)}</small>` : ''}</td><td><span class="nf44-k">${escapeHtml(i.kind || '')}</span></td><td class="nf44-am">${i.amount ? bkPeso(i.amount) : '—'}</td>
      <td>${NF44I.closed ? (who ? `<span class="nf44-who">${escapeHtml(who)}</span>` : '—') : `<select class="nf44-as ${who ? 'set' : ''}" onchange="nf44IssAssign('${i.fp}', this.value)" aria-label="Who is in charge"><option value="">${who ? escapeHtml(who) : '+ Put someone in charge'}</option>${team.filter(n => n !== who).map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')}</select>`}</td>
      <td class="nf44-age">${age === 0 ? 'Today' : age + ' day' + (age === 1 ? '' : 's')}</td><td><span class="nf44-st s-${sk}"><i></i>${sl}</span></td>
      <td><button type="button" class="btn btn-outline nf44-ob" onclick="NF44I.open = NF44I.open === '${i.fp}' ? null : '${i.fp}'; renderIssuesPage()">${isOpen ? 'Close ▴' : 'Open ▾'}</button></td></tr>
      ${isOpen ? `<tr class="nf44-ix"><td colspan="7"><div class="nf44-ixg">${i.why ? `<div><b>Why it matters</b>${escapeHtml(i.why)}</div>` : ''}<div><b>Proof</b>${(i.ev || []).length ? i.ev.map(([l, a]) => `<a class="nf44-pl" onclick="${a.replace(/"/g, '&quot;')}">${escapeHtml(l)}</a>`).join('') : escapeHtml(i.basis || '—')}</div><div><b>History</b>${hist.length ? hist.slice(-4).map(h => `<span>${h.status === 'assigned' ? escapeHtml(h.to || '') + ' put in charge' + (h.by && h.by !== h.to ? ' by ' + escapeHtml(h.by) : '') : h.status === 'accepted' ? "OK'd as fine by " + escapeHtml(h.by || '') : h.status === 'new' ? 'Opened again by ' + escapeHtml(h.by || '') : escapeHtml(ISS_LABEL[h.status] || h.status) + (h.by ? ' · ' + escapeHtml(h.by) : '')}${h.note ? ' · “' + escapeHtml(h.note) + '”' : ''}</span>`).join('') : `<span>First found ${escapeHtml(bkDayLabel(s.first || i.date || APP_TODAY))}</span>`}</div></div>
        <div class="nf44-ixb">${(i.ev || []).slice(0, 1).map(([l, a]) => `<button type="button" class="btn btn-primary" onclick="${a.replace(/"/g, '&quot;')}">${escapeHtml(l)}</button>`).join('')}${NF44I.closed ? (i.auto ? '' : `<button type="button" class="btn btn-outline" onclick="nf44IssReopen('${i.fp}')">Open again</button>`) : `<button type="button" class="btn btn-outline" onclick="nf44IssFine('${i.fp}')">It's fine, close it</button>`}</div></td></tr>` : ''}`; };
  body.innerHTML = `<div class="bk-tiles">${bkTile('To check', String(open.length), open.filter(i => i.lvl === 'red').length + ' important', open.some(i => i.lvl === 'red') ? 'bad' : '')}
      ${bkTile('Money involved', bkPeso(open.reduce((a, i) => a + (i.amount || 0), 0)), 'possible, not proven')}${bkTile('Closed', String(closed.length), 'fixed or accepted')}</div>
    <section class="panel-card nf44-iss"><div class="nf44-fil">${chip('all', 'All', open.length)}${chip('new', 'New', cnt('new'), '#EF4444')}${chip('on', 'Someone is on it', cnt('on'), '#EAB308')}<span class="nf44-sep"></span>
      <select onchange="NF44I.who=this.value; renderIssuesPage()" aria-label="Who is in charge"><option value="all">Everyone</option>${people.map(n => `<option value="${escapeHtml(n)}" ${NF44I.who === n ? 'selected' : ''}>${escapeHtml(n)}</option>`).join('')}</select>
      <select onchange="NF44I.kind=this.value; renderIssuesPage()" aria-label="Kind"><option value="all">All kinds</option>${kinds.map(k => `<option value="${escapeHtml(k)}" ${NF44I.kind === k ? 'selected' : ''}>${escapeHtml(k)}</option>`).join('')}</select>
      <button type="button" class="nf44-chip nf44-closed ${NF44I.closed ? 'on' : ''}" onclick="NF44I.closed=!NF44I.closed; renderIssuesPage()">Closed ${closed.length}</button></div>
      ${list.length ? `<div class="nf44-tw"><table class="nf44-it nf43-left"><thead><tr><th>Problem</th><th>Kind</th><th>Money</th><th>In charge</th><th>Open for</th><th>Status</th><th></th></tr></thead><tbody>${list.map(row).join('')}</tbody></table></div>`
        : `<p class="nf44-none">${NF44I.closed ? 'Nothing closed yet.' : 'Nothing to check right now. Nifti keeps looking every day.'}</p>`}
    </section>
    <p class="nf44-note">Nifti checks your sales, expenses, cash counts and orders every day. When a problem is fixed, it closes by itself.</p>`;
};
window.renderIssuesPage = renderIssuesPage;
