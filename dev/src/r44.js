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

/* ---------- 3. New sale: one screen. Add items if you want, or just type the total ---------- */
const NF44S = {q: '', note: false};
function nf44Often(){
  const n = {}; (BK.sales || []).forEach(s => (s.lines || []).forEach(l => { if(!l.totalOnly && l.product) n[l.product] = (n[l.product] || 0) + 1; }));
  const names = Object.keys(n).sort((a, b) => n[b] - n[a]);
  (BK.menu || []).filter(m => m.active).map(m => m.name).concat((inventoryData || []).map(i => i.name)).forEach(x => { if(!names.includes(x)) names.push(x); });
  return names.slice(0, 6);
}
function nf44AllItems(){ return (BK.menu || []).filter(m => m.active).map(m => m.name).concat((inventoryData || []).map(i => i.name)).filter((v, i, a) => v && a.indexOf(v) === i).sort((a, b) => a.localeCompare(b)); }
function nf44QsAdd(name){
  name = String(name || '').trim(); if(!name) return;
  QS.lines = (QS.lines || []).filter(l => String(l.product).trim());
  const have = QS.lines.find(l => l.product.toLowerCase() === name.toLowerCase());
  if(have) have.qty = (Number(have.qty) || 0) + 1; else QS.lines.push({product: name, qty: 1, price: String(bkItemPrice(name) || '')});
  NF44S.q = ''; qsRender(); const s = document.getElementById('nf44Find'); if(s) s.focus();
}
function nf44QsQty(i, d){ const l = QS.lines[i]; if(!l) return; l.qty = Math.max(0, (Number(l.qty) || 0) + d); if(l.qty === 0) QS.lines.splice(i, 1); qsRender(); }
function nf44QsChange(){
  const t = qsTotal(), rec = Number(String(QS.received).replace(/,/g, '')) || 0, box = document.getElementById('qsChange'); if(!box) return;
  const tv = document.getElementById('qsTotal'); if(tv && tv.tagName !== 'INPUT') tv.textContent = bkPeso(t);
  box.className = 'nf44-chg' + (rec && rec >= t ? ' ok' : rec ? ' bad' : '');
  box.innerHTML = !rec ? '<span>Change</span><b>—</b>' : rec >= t ? `<span>Change (sukli)</span><b>${bkPeso(rec - t)}</b>` : `<span>Still short</span><b>${bkPeso(t - rec)}</b>`;
}
qsTotalNow = function(){ nf44QsChange(); };
window.qsTotalNow = qsTotalNow;
function nf44QsFind(v){ NF44S.q = v; const box = document.getElementById('nf44Res'); if(!box) return; const q = v.trim().toLowerCase();
  const hits = q ? nf44AllItems().filter(n => n.toLowerCase().includes(q)).slice(0, 6) : [];
  box.innerHTML = hits.map(n => `<button type="button" onclick="nf44QsAdd(${JSON.stringify(n).replace(/"/g, '&quot;')})"><span>${escapeHtml(n)}</span><em>${bkItemPrice(n) ? bkPeso(bkItemPrice(n)) : ''}</em></button>`).join('') + (q && !hits.length ? `<button type="button" onclick="nf44QsAdd(${JSON.stringify(v.trim()).replace(/"/g, '&quot;')})"><span>Add “${escapeHtml(v.trim())}”</span><em>new item</em></button>` : '');
  box.hidden = !q; }
qsRender = function(){
  if(!QS) return;
  QS.lines = (QS.lines || []).filter(l => String(l.product).trim() || QS.lines.length === 1 && false);
  const items = QS.lines.length > 0; QS.mode = items ? 'items' : 'total';
  const t = qsTotal(), cash = QS.paidWith === 'cash', rec = Number(String(QS.received).replace(/,/g, '')) || 0;
  const often = nf44Often(), custs = ['Walk-in'].concat(bkCustomerNames().filter(n => n !== 'Walk-in')).slice(0, 6);
  const line = (l, i) => { const lt = (Number(l.qty) || 0) * (Number(String(l.price).replace(/,/g, '')) || 0), item = bkMenuFind(l.product) ? null : (inventoryData || []).find(x => x.name.toLowerCase() === String(l.product).toLowerCase()), low = item && Number(l.qty) > Number(item.onHand);
    return `<div class="nf44-ql"><div class="nm"><b>${escapeHtml(l.product)}</b>${low ? `<small>Only ${item.onHand} in stock. You can still save.</small>` : ''}</div>
      <div class="qty"><button type="button" onclick="nf44QsQty(${i}, -1)" aria-label="One less">−</button><input inputmode="decimal" value="${escapeHtml(String(l.qty))}" oninput="QS.lines[${i}].qty=this.value; nf44QsChange()" aria-label="Quantity"><button type="button" onclick="nf44QsQty(${i}, 1)" aria-label="One more">+</button></div>
      <div class="pr"><span>₱</span><input inputmode="decimal" value="${escapeHtml(String(l.price))}" placeholder="Price" oninput="QS.lines[${i}].price=this.value; nf44QsChange()" aria-label="Price each"></div>
      <em>${lt ? bkPeso(lt) : '—'}</em><button type="button" class="x" onclick="QS.lines.splice(${i},1); qsRender()" aria-label="Remove">✕</button></div>`; };
  slModal('qsModal', `<div class="sl-sheet-h"><b>New sale</b><button class="sl-x" onclick="slClose('qsModal')" aria-label="Close">✕</button></div>
    <div class="nf44-qs">
    <section><div class="nf43-q">What was sold? <small class="nf44-opt">optional, adds the items to your stock records</small></div>
      <div class="nf44-find"><input id="nf44Find" type="search" placeholder="Search an item, or type its name" value="${escapeHtml(NF44S.q)}" oninput="nf44QsFind(this.value)" onkeydown="if(event.key==='Enter'){ event.preventDefault(); const b=document.querySelector('#nf44Res button'); if(b) b.click(); }" autocomplete="off" aria-label="Search an item"><div class="nf44-res" id="nf44Res" hidden></div></div>
      ${items ? `<div class="nf44-lines">${QS.lines.map(line).join('')}</div>` : `<div class="nf44-often"><span>Sold most often</span>${often.map(n => `<button type="button" onclick="nf44QsAdd(${JSON.stringify(n).replace(/"/g, '&quot;')})"><span>${escapeHtml(n)}</span><em>${bkItemPrice(n) ? bkPeso(bkItemPrice(n)) : ''}</em><i aria-hidden="true">+</i></button>`).join('')}</div>`}</section>
    <section class="nf44-tot"><label for="qsTotalIn">Total</label>${items ? `<b id="qsTotal">${bkPeso(t)}</b>` : `<div class="nf43-amt"><span>₱</span><input id="qsTotalIn" inputmode="decimal" value="${escapeHtml(QS.total)}" placeholder="0" oninput="QS.total=this.value; nf44QsChange()" aria-label="Total sale"></div>`}</section>
    ${items ? '' : '<p class="nf44-hint">No items listed: the sale is saved as a total. Stock stays the same.</p>'}
    <section><div class="nf43-q">Paid with</div><div class="sl-days bk-chips">${BK_SALE_PAY.map(([k, l]) => `<button type="button" class="${QS.paidWith === k ? 'on' : ''}" onclick="QS.paidWith='${k}'; qsRender()">${l}</button>`).join('')}</div></section>
    ${cash ? `<section class="nf44-cash"><div><div class="nf43-q">Cash received <small class="nf44-opt">optional</small></div><div class="nf43-amt"><span>₱</span><input inputmode="decimal" value="${escapeHtml(QS.received)}" placeholder="${Math.ceil(t) || 0}" oninput="QS.received=this.value; nf44QsChange()" aria-label="Cash received"></div></div><div id="qsChange" class="nf44-chg"></div></section>` : ''}
    <section><div class="nf43-q">Customer ${QS.paidWith === 'credit' ? '' : '<small class="nf44-opt">optional</small>'}</div>
      <div class="nf44-cust">${custs.map(n => `<button type="button" class="${QS.customer === n ? 'on' : ''}" onclick="QS.customer=${JSON.stringify(n).replace(/"/g, '&quot;')}; qsRender()" title="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join('')}</div>
      <input list="qsCust" value="${escapeHtml(QS.customer === 'Walk-in' ? '' : QS.customer)}" oninput="QS.customer=this.value||'Walk-in'" placeholder="Or type another name" class="nf43-search" aria-label="Customer name"><datalist id="qsCust">${bkCustomerNames().map(n => `<option value="${escapeHtml(n)}">`).join('')}</datalist></section>
    ${NF44S.note || QS.note ? `<section><div class="nf43-q">Note</div><input class="nf43-search" maxlength="300" value="${escapeHtml(QS.note)}" oninput="QS.note=this.value" placeholder="e.g. suki discount"></section>` : `<button type="button" class="nf43-link nf44-addnote" onclick="NF44S.note=true; qsRender()">+ Add a note</button>`}
    ${typeof plBoxHtml === 'function' ? plBoxHtml() : ''}
    </div>
    <div class="sl-err" id="qsErr">${escapeHtml(QS.err)}</div>
    <div class="nf43-btns"><button type="button" class="btn btn-ghost" onclick="slClose('qsModal')">Cancel</button><button type="button" class="btn btn-outline" onclick="window._nf35Again='sale'; qsSave()" ${QS.saving ? 'disabled' : ''}>Save & new sale</button><button class="btn btn-primary" onclick="qsSave()" ${QS.saving || (QS.ask && QS.ask.state === 'waiting') ? 'disabled' : ''}>${QS.saving ? 'Saving…' : 'Save sale'}</button></div>`);
  nf44QsChange();
};
window.qsRender = qsRender;
(function(){ const o = window.openQuickSale; if(typeof o !== 'function' || o._nf44) return; const w = function(){ NF44S.q = ''; NF44S.note = false; const r = o.apply(this, arguments); if(QS){ QS.lines = []; qsRender(); } return r; }; w._nf44 = true; window.openQuickSale = w; try{ openQuickSale = w; }catch(e){} })();
(function(){ const s = window.qsSave; if(typeof s !== 'function' || s._nf44) return; const w = function(){ if(QS){ QS.lines = (QS.lines || []).filter(l => String(l.product).trim()); QS.mode = QS.lines.length ? 'items' : 'total'; } return s.apply(this, arguments); }; Object.keys(s).forEach(k => { w[k] = s[k]; }); w._nf44 = true; window.qsSave = w; try{ qsSave = w; }catch(e){} })();

/* ---------- 4. Bank & deposits: every payment opens, with the right buttons for where it stands ---------- */
function nf44PayState(x){
  const dep = colDepositedKeys(), matched = colMatchedKeys();
  if(x.pending) return ['wait', x.method === 'check' ? 'Check not cleared yet' : 'To confirm', x.method === 'check' ? 'The customer gave a check. Tap Check cleared once your bank shows the money.' : 'The customer says they paid. Check your bank or GCash, then confirm.'];
  if(!x.counted) return ['bad', 'Rejected', 'This payment was marked as not received or bounced. The order still shows it as unpaid.'];
  if(x.method === 'cash') return dep.has(x.id) ? ['ok', 'Deposited', 'This cash is already in the bank.'] : ['wait', 'Cash on hand', `${x.collector} still has this cash. Record a deposit when it reaches the bank.`];
  return matched.has(x.id) ? ['ok', 'Matched to the bank', 'Your bank statement shows this payment.'] : ['wait', 'Not matched yet', 'Upload or paste your bank or GCash statement below and Nifti matches it for you.'];
}
function nf44PayOpen(i){
  const x = (window._nf44Pays || [])[i]; if(!x) return; const [k, label, why] = nf44PayState(x);
  const how = (typeof PAYMENT_METHOD_LABELS !== 'undefined' && PAYMENT_METHOD_LABELS[x.method]) || x.method;
  const act = x.pending ? `<button type="button" class="btn btn-outline" onclick="slClose('nf44Pay'); navigate('orders'); setTimeout(() => nfoOpen('${x.po.id}'), 80)">${x.method === 'check' ? 'It bounced' : 'Not received'}</button><button type="button" class="btn btn-primary" onclick="confirmPaymentReceived('${x.po.id}','${x.kind}','${x.key}'); slClose('nf44Pay'); setTimeout(renderCollectionsPage, 60)">${x.method === 'check' ? 'Check cleared' : 'Received'}</button>`
    : label === 'Cash on hand' ? `<button type="button" class="btn btn-primary" onclick="slClose('nf44Pay'); colDeposit()">Record a deposit</button>`
    : label === 'Not matched yet' ? `<button type="button" class="btn btn-primary" onclick="slClose('nf44Pay'); const t = document.getElementById('bankPaste'); if(t){ t.scrollIntoView({behavior:'smooth', block:'center'}); t.focus(); }">Match with my statement</button>` : '';
  slModal('nf44Pay', `<div class="sl-sheet-h"><b>Payment from ${escapeHtml(x.po.buyerName || 'customer')}</b><button class="sl-x" onclick="slClose('nf44Pay')" aria-label="Close">✕</button></div>
    <div class="nf44-pay"><div class="nf44-pa"><b>${fmtPHP(x.amount)}</b><span class="nf44-st s-${k === 'ok' ? 'fix' : k === 'bad' ? 'new' : 'on'}"><i></i>${escapeHtml(label)}</span></div>
      <p class="nf44-pw">${escapeHtml(why)}</p>
      <dl class="nf44-dl"><dt>Order</dt><dd>${escapeHtml(x.po.poNumber || '')}</dd><dt>Date</dt><dd>${escapeHtml(stmtDate(x.date))}</dd><dt>How</dt><dd>${escapeHtml(how)}${x.ref ? ' · ' + escapeHtml(x.ref) : ''}</dd><dt>Recorded by</dt><dd>${escapeHtml(x.collector)}</dd></dl>
      <button type="button" class="nf43-link" onclick="slClose('nf44Pay'); navigate('orders'); setTimeout(() => nfoOpen('${x.po.id}'), 80)">Open the order to change or remove this payment ›</button></div>
    <div class="nf43-btns"><button type="button" class="btn btn-ghost" onclick="slClose('nf44Pay')">Close</button>${act}</div>`);
}
function nf44Bank(page){
  if(!page || page.id !== 'page-collections' || typeof colTab === 'undefined' || colTab !== 'cash') return;
  const card = [...page.querySelectorAll('.sl-card')].find(c => /Every payment, last 30 days/.test((c.querySelector('.sl-card-h') || {}).textContent || '')); if(!card) return;
  let led = []; try{ led = colLedger().filter(x => slDaysAgo(x.date) <= 30).slice(0, 60); }catch(e){ return; }
  window._nf44Pays = led;
  card.querySelectorAll('.sl-row.tight').forEach((r, i) => { if(r.dataset.nf44 === String(i)) return; r.dataset.nf44 = String(i); r.classList.add('nf44-tap'); r.setAttribute('role', 'button'); r.tabIndex = 0;
    r.onclick = () => nf44PayOpen(i); r.onkeydown = e => { if(e.key === 'Enter') nf44PayOpen(i); };
    if(!r.querySelector('.nf44-chev')){ const c = document.createElement('span'); c.className = 'nf44-chev'; c.textContent = '›'; c.setAttribute('aria-hidden', 'true'); r.appendChild(c); } });
}
(function(){
  if(typeof nf26AfterPass !== 'function') return;
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ nf44Bank(page); }catch(e){ console.warn('nf44 bank', e); } };
  window.nf26AfterPass = nf26AfterPass;
})();

/* ---------- 5. Payroll: edit and delete drafts, correct paid ones, and the numbers an owner asks about ---------- */
function nf44NextPayday(){ const t = APP_TODAY, d = Number(t.slice(8, 10)), m = t.slice(0, 7); if(d <= 15) return m + '-15'; const x = new Date(m + '-01T00:00:00'); x.setMonth(x.getMonth() + 1); x.setDate(0); return m + '-' + String(x.getDate()).padStart(2, '0'); }
async function nf44PrDelete(id){
  const r = PR.runs.find(x => x.id === id); if(!r || r.status === 'paid') return;
  if(!confirm(`Delete this draft payroll (${bkDayLabel(r.period_from)} to ${bkDayLabel(r.period_to)})? Nothing was paid yet.`)) return;
  if(myBusiness){ const { error: le } = await sb.from('payroll_lines').delete().eq('run_id', id); const { error } = await sb.from('payroll_runs').delete().eq('id', id); if(error || le){ showToast((error || le).message, 'error'); return; } await prLoad(true); }
  else { PR.runs = PR.runs.filter(x => x.id !== id); PR.lines = PR.lines.filter(l => l.run_id !== id); prSaveDemo(); }
  showToast('Draft deleted.', 'success'); renderPayrollPage();
}
function nf44PrCorrect(id){
  const r = PR.runs.find(x => x.id === id); if(!r) return;
  if(!confirm('Paid payroll is already in your books, so it is not changed. Nifti starts a correction instead: put only the difference (more pay, or a deduction you forgot). Continue?')) return;
  const ls = PR.lines.filter(l => l.run_id === id);
  PRF = {id: null, from: r.period_from, to: r.period_to, err: '', saving: false, correction: id, lines: ls.map(l => ({staff_name: l.staff_name, basis: 'day', rate: '', days: '', extra: '', vale_deduct: '', contrib_employee: '', contrib_employer: '', other_deduct: '', note: 'Correction'}))};
  prFormRender();
}
(function(){
  if(typeof renderPayrollPage !== 'function') return;
  const base = renderPayrollPage;
  renderPayrollPage = async function(){
    await base.apply(this, arguments);
    const body = document.getElementById('prBody'); if(!body || !PR.loaded || typeof booksCanSeeTotals === 'function' && !booksCanSeeTotals()) return;
    const runs = PR.runs.slice().sort((a, b) => String(b.period_to).localeCompare(String(a.period_to))), last = runs.find(r => r.status === 'paid');
    const net = id => PR.lines.filter(l => l.run_id === id).reduce((a, l) => a + (prCalc(l).net || 0), 0);
    const vale = prValeBalances(), valeTot = Object.values(vale).filter(v => v > 0).reduce((a, v) => a + v, 0);
    const people = [...new Set(PR.lines.map(l => l.staff_name))];
    const pd = nf44NextPayday(), days = Math.max(0, daysBetween(APP_TODAY, pd));
    if(!body.querySelector('.nf44-prs')){
      const s = document.createElement('div'); s.className = 'nf44-prs';
      s.innerHTML = `<div><span>Next payday</span><b>${escapeHtml(bkDayLabel(pd))}</b><small>${days === 0 ? 'today' : 'in ' + days + ' day' + (days === 1 ? '' : 's')}</small></div>
        <div><span>Last payroll</span><b>${last ? bkPeso(net(last.id)) : '—'}</b><small>${last ? 'paid ' + escapeHtml(bkDayLabel(last.paid_on || last.period_to)) : 'none yet'}</small></div>
        <div><span>Vale to collect</span><b>${bkPeso(valeTot)}</b><small>${(n => n + (n === 1 ? ' person' : ' people'))(Object.values(vale).filter(v => v > 0).length)}</small></div>
        <div><span>People on payroll</span><b>${people.length}</b><small>from your payrolls</small></div>`;
      body.prepend(s);
    }
    nf44PrRows();
    // per person: what they are paid and what they owe
    if(people.length && !body.querySelector('.nf44-prp')){
      const sec = document.createElement('section'); sec.className = 'panel-card nf44-prp';
      const yr = APP_TODAY.slice(0, 4);
      const rowsH = people.map(n => { const ls = PR.lines.filter(l => l.staff_name === n), lastL = ls.slice().sort((a, b) => String((PR.runs.find(r => r.id === b.run_id) || {}).period_to).localeCompare(String((PR.runs.find(r => r.id === a.run_id) || {}).period_to)))[0] || {};
        const paidYr = ls.filter(l => { const r = PR.runs.find(x => x.id === l.run_id); return r && r.status === 'paid' && String(r.paid_on || r.period_to).startsWith(yr); }).reduce((a, l) => a + prCalc(l).net, 0);
        return `<tr><td><b>${escapeHtml(n)}</b></td><td>${lastL.rate ? bkPeso(lastL.rate) + (lastL.basis === 'month' ? ' a month' : ' a day') : '—'}</td><td>${bkPeso(paidYr)}</td><td class="${vale[n] > 0 ? 'nf44-owe' : ''}">${vale[n] > 0 ? bkPeso(vale[n]) : '—'}</td><td><button type="button" class="nf43-link" onclick="prPayslip('${(runs.find(r => r.status === 'paid' && PR.lines.some(l => l.run_id === r.id && l.staff_name === n)) || {}).id || ''}', ${JSON.stringify(n).replace(/"/g, '&quot;')})">Last payslip</button></td></tr>`; }).join('');
      sec.innerHTML = `<div class="panel-head"><h2>Your people</h2></div><div class="nf44-tw"><table class="nf43-left"><thead><tr><th>Name</th><th>Pay rate</th><th>Paid this year</th><th>Vale they owe</th><th></th></tr></thead><tbody>${rowsH}</tbody></table></div>`;
      const note = body.querySelector('.bk-note'); if(note) note.before(sec); else body.appendChild(sec);
    }
  };
  window.renderPayrollPage = renderPayrollPage;
})();
// each payroll row gets clear buttons (rows are tables by the time this runs, so this also runs after every redraw)
function nf44PrRows(){
  const body = document.getElementById('prBody'); if(!body || !PR.loaded) return;
  body.querySelectorAll('tr[onclick*="prOpenRun"], .bk-row[onclick*="prOpenRun"]').forEach(row => {
    if(row.querySelector('.nf44-pra')) return; const id = ((row.getAttribute('onclick') || '').match(/prOpenRun\('([^']+)'\)/) || [])[1]; const r = PR.runs.find(x => x.id === id); if(!r) return;
    const a = document.createElement('span'); a.className = 'nf44-pra';
    a.innerHTML = r.status === 'paid' ? `<button type="button" class="btn btn-outline">Payslips</button><button type="button" class="btn btn-outline">Correct it</button>` : `<button type="button" class="btn btn-primary">Edit</button><button type="button" class="btn btn-outline nf44-del">Delete</button>`;
    const [b1, b2] = a.querySelectorAll('button');
    b1.addEventListener('click', e => { e.stopPropagation(); prOpenRun(id); });
    b2.addEventListener('click', e => { e.stopPropagation(); if(r.status === 'paid') nf44PrCorrect(id); else nf44PrDelete(id); });
    if(row.tagName === 'TR'){ const td = document.createElement('td'); td.className = 'a'; td.setAttribute('data-l', ''); td.appendChild(a); row.appendChild(td);
      const th = row.closest('table').querySelector('thead tr'); if(th && th.children.length < row.children.length){ const h = document.createElement('th'); h.textContent = ''; th.appendChild(h); } }
    else row.appendChild(a);
  });
}
(function(){
  if(typeof nf26AfterPass !== 'function') return;
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); if(page && page.id === 'page-payroll'){ try{ nf44PrRows(); }catch(e){ console.warn('nf44 payroll rows', e); } } };
  window.nf26AfterPass = nf26AfterPass;
})();
// paying: choose where the money came from in the form, instead of typing it in a box
(function(){
  if(typeof prFormRender !== 'function') return;
  const base = prFormRender;
  prFormRender = function(){ const r = base.apply(this, arguments); try{
    const m = document.getElementById('prModal'), pb = m && m.querySelector('.nf43-pb'); if(!pb || pb.querySelector('.nf44-prfrom')) return r;
    if(!PRF.paidFrom) PRF.paidFrom = 'cash';
    const d = document.createElement('div'); d.className = 'field nf44-prfrom';
    d.innerHTML = `<label>When you pay, the money comes from</label><div class="nf43-seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[['cash', 'Cash drawer'], ['gcash', 'GCash'], ['bank', 'Bank']].map(([k, l]) => `<button type="button" class="${PRF.paidFrom === k ? 'on' : ''}" onclick="PRF.paidFrom='${k}'; this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('on')); this.classList.add('on')">${l}</button>`).join('')}</div>${PRF.correction ? '<p class="nf43-note">This is a correction. Put only the difference for each person.</p>' : ''}`;
    pb.appendChild(d); }catch(e){ console.warn('nf44 payroll form', e); } return r; };
  window.prFormRender = prFormRender;
  const save = prSave;
  prSave = async function(pay){ if(!pay) return save.apply(this, arguments); const op = window.prompt; window.prompt = () => (PRF && PRF.paidFrom) || 'cash'; try{ return await save.apply(this, arguments); } finally{ window.prompt = op; } };
  window.prSave = prSave;
})();
