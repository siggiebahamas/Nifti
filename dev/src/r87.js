/* ===== Round 87 ===== */
function nf87E(s){ return escapeHtml(String(s == null ? '' : s)); }
function nf87Demo(){ return !(typeof myBusiness !== 'undefined' && myBusiness); }

/* ---------- Demo: at most 3 examples, full stop (no hidden extras, no "See all") ---------- */
(function(){
  const strict = () => { if(!nf87Demo()) return;
    /* See-all buttons are hidden by CSS (removing them made the limiter add them back in a loop) */
    // lane counts match what is shown
    document.querySelectorAll('#mhHome .lanes .lane').forEach(l => { const n = [...l.querySelectorAll(':scope > .task:not(.nf86-cut):not(.nf84-dn)')].length; const c = l.querySelector('.lane-h span:last-child'); if(c && c.textContent !== String(n)) c.textContent = n; });
    // briefing list: 3 tasks
    document.querySelectorAll('#nf85Brief .td').forEach(td => { const items = [...td.querySelectorAll(':scope > .ti')]; items.forEach((t, i) => t.classList.toggle('nf86-cut', i >= 3)); const s = td.querySelector('.tdh span'); if(s && items.length > 3){ const d = items.slice(0, 3).filter(t => t.classList.contains('ok')).length; s.textContent = d === 3 ? 'All done. Great work! 🎉' : `${d} of 3 done`; } });
    document.querySelectorAll('#view-app table.nf25-t tr.nf26-rowoff, #view-app table.nf24-tb tr.nf26-rowoff').forEach(r => r.classList.add('nf86-cut'));
  };
  if(typeof NF45_AFTER !== 'undefined') NF45_AFTER.push(() => setTimeout(strict, 420));
  setInterval(strict, 1000);
  try{ new MutationObserver(() => { clearTimeout(window._nf87s); window._nf87s = setTimeout(strict, 120); }).observe(document.body, {childList: true, subtree: true}); }catch(e){}
})();

/* ---------- Chat: always both. One thread; no switch to choose ---------- */
try{ if(typeof nf36vRoute === 'function'){
  const r86 = nf36vRoute; nf36vRoute = function(conv, ths){ if(conv && !conv._vb && ths && ths.length && nf86OnNifti(conv)) return 'both'; if(conv && NF36V.route) delete NF36V.route[conv.id]; return r86.apply(this, arguments) === 'both' ? 'both' : (ths && ths.length ? 'viber' : 'nifti'); }; window.nf36vRoute = nf36vRoute;
  nf36vBar = function(conv, ths){
    const input = document.getElementById('msgInput'); if(!input) return; const host = input.closest('.msg-composer, .thread-composer, .composer, .msg-input-row') || input.parentElement;
    let bar = document.getElementById('nf36vBar'); if(!conv || !ths || !ths.length){ if(bar) bar.remove(); input.placeholder = 'Type a message'; return; }
    if(!bar){ bar = document.createElement('div'); bar.id = 'nf36vBar'; host.parentElement.insertBefore(bar, host); }
    const route = nf36vRoute(conv, ths); bar.className = 'nf36v-bar nf87-both';
    bar.innerHTML = `<span class="pl">${route === 'both' ? '✓ Sends to Nifti + Viber' : '✓ Sends to Viber'}</span><span>${route === 'both' ? 'One chat. Their Viber replies show up here too.' : 'They\'re not on Nifti yet, so it goes to their Viber.'}</span><button type="button" class="nf36v-add" onclick="nf36vAddSheet()">+ Add a Viber message</button>`;
    input.placeholder = 'Type a message';
  }; window.nf36vBar = nf36vBar;
} }catch(e){}

/* ---------- Home Who owes you: tiles and headers open the list here; cards are compact ---------- */
function nf87MiniCard(g){
  const sk = nf85Suki(g), kind = g.src === 'ut' ? 'Shop utang' : 'Delivery order';
  return `<article class="nf87-mc ${g.bucket}"><div class="t"><div class="n"><b>${nf87E(g.name)}</b>${nf83Status(g)}</div><div class="r"><b>${nf85P(g.total)}</b><small>${kind}</small><span class="suki ${sk.tier}" title="${nf87E(sk.why)}">Suki ${sk.score}</span></div></div>
    <div class="a">${nf83Main(g)}<button type="button" class="o" onclick="nf83Qr('${g.id}')">${nf85Ic(NF85I.qr, 15)}QR</button><button type="button" class="o" onclick="nf87WhoPop('${g.bucket}', '${g.id}')">Details</button></div></article>`;
}
try{ nf86MiniCard = nf87MiniCard; }catch(e){}
function nf87WhoPop(filter, openId){
  const rows = nf83Rows().filter(g => filter === 'all' || filter === g.bucket || (filter === 'ut' && g.src === 'ut') || (filter === 'po' && g.src === 'po'));
  const shown = openId ? rows.filter(g => g.id === openId) : nf87Demo() ? rows.slice(0, 3) : rows;
  const title = openId ? (shown[0] ? shown[0].name : 'Details') : {all: 'Everyone who owes you', late: 'Late', soon: 'Due in 7 days', later: 'Not due yet', ut: 'Shop utang', po: 'Delivery orders not paid'}[filter];
  const row = g => { const pay = g.src === 'ut' ? nf79RpHtml('uc:' + g.id, Math.max(0, g.total - (g.pending || 0)), {utang: true}) : nf79RpHtml(g.key, Math.max(0, g.total - (g.pending || 0)));
    return `<div class="it nf79-rph"><div class="w"><b>${nf87E(g.name)}</b><small>${g.src === 'ut' ? 'Shop utang' : 'Delivery order'}${g.items.length > 1 ? ' · ' + g.items.length + ' bills' : ''}</small>${nf83Status(g)}</div><b class="am">${nf85P(g.total)}</b>
      ${openId ? `<div class="bx" style="grid-column:1/-1">${nf83Bills(g)}</div>` : ''}
      <div class="bx"><button type="button" class="nf82-btn p" onclick="slClose('nf86T'); nf82Remind('${g.id}')">${nf85Ic(NF85I.chat, 15)}Remind with pay link</button><button type="button" class="nf82-btn s" onclick="nf79RpOpen(this)">${nf85Ic(NF85I.plus, 15)}They paid</button><button type="button" class="nf82-btn s" onclick="nf83Qr('${g.id}')">${nf85Ic(NF85I.qr, 15)}QR</button></div>${pay}</div>`; };
  nf86Pop('who:' + filter, `${title}${openId ? '' : ` · ${nf85P(rows.reduce((a, g) => a + g.total, 0))}`}`, openId ? 'Their bills are below. Send a reminder with the pay link, or record what they paid.' : 'Remind each one with the pay link, or tap "They paid" to record a payment.', shown.length ? `<div class="nf86-ls">${shown.map(row).join('')}</div>` : nf86Empty('Nobody here right now.'), "NF82G.f='all'; go('collections')");
  const done = document.querySelector('#nf86T .sl-actions .btn-primary'); if(done) done.remove();
  const pg = document.querySelector('#nf86T .nf86-pg'); if(pg){ pg.textContent = 'Open Getting paid (everything) ›'; pg.classList.add('big'); }
}
function nf87WhoWire(){ try{
  const w = document.querySelector('#mhHome .nf86-who'); if(!w || w.dataset.nf87) return; w.dataset.nf87 = 1;
  const t = [...w.querySelectorAll('.tls3 .tl')]; ['all', 'ut', 'po'].forEach((f, i) => { if(t[i]){ t[i].setAttribute('role', 'button'); t[i].tabIndex = 0; t[i].onclick = () => nf87WhoPop(f); } });
  w.querySelectorAll('.cols .col').forEach((c, i) => { const h = c.querySelector('.ch'); if(h){ h.removeAttribute('onclick'); h.onclick = () => nf87WhoPop(['late', 'soon', 'later'][i]); } });
  const sa = [...w.querySelectorAll('.ha button')].find(b => /See all/.test(b.textContent)); if(sa){ sa.removeAttribute('onclick'); sa.onclick = () => nf87WhoPop('all'); sa.textContent = 'See everyone'; }
}catch(e){} }
NF45_AFTER.push(nf87WhoWire); setInterval(nf87WhoWire, 1500);

/* ---------- Task popups: orders get a Message button and room to breathe; counting cash shows the numbers ---------- */
(function(){ const base = nf86Task; nf86Task = function(k){
  if(k === 'orders'){
    let rows = []; try{ rows = nfoAll().filter(r => r.band === 'red'); }catch(e){}
    const short = t => String(t || '').replace(/^(They say they paid\.|Delivered \d+ days ago,)\s*/i, '').replace(/\s+/g, ' ').trim();
    nf86Pop(k, `${rows.length} order${rows.length === 1 ? '' : 's'} need you`, 'Do the next step on each order. Not sure how they paid? Message them first.', rows.length ? `<div class="nf86-ls">${rows.map(r => `<div class="it"><div class="w"><b>${nf87E(r.who)}</b><small>${nf87E(String(r.o.poNumber || '').replace(/^PO-\d{4}-/, 'Order '))} · ${nf87E(String(r.items || '').slice(0, 60))}</small><span class="nx">${nf87E(r.step)} · ${nf87E(short(r.todo))}</span></div><b class="am">${nf85P(r.amt)}</b><div class="bx"><button type="button" class="nf82-btn p" onclick="slClose('nf86T'); nfoOpen('${r.id}')">${nf87E(r.btn || 'Open')}</button><button type="button" class="nf82-btn s" onclick="slClose('nf86T'); nfoChat('${r.pid}', ${!!r.sell})">${nf85Ic(NF85I.chat, 15)}Message ${nf87E(String(r.who).split(' ')[0])}</button></div></div>`).join('')}</div>` : nf86Empty('No orders need you right now.'), "go('orders')");
    return;
  }
  if(k === 'count'){
    let exp = 0, last = null; try{ const ccs = BK.counts.slice().sort((a, b) => String(b.day).localeCompare(String(a.day))); last = ccs[0]; exp = bkLiveSales().filter(x => x.date === APP_TODAY).reduce((a, x) => a + (x.payments || []).filter(p => p.method === 'cash' && p.date === APP_TODAY).reduce((s, p) => s + (Number(p.amount) || 0), 0), 0); }catch(e){}
    nf86Pop(k, 'Count the cash at closing', 'Count every peso in the drawer before you close. Nifti compares it with today\'s cash sales right away.', `<div class="nf87-cc"><div><small>Cash sales today</small><b>${nf85P(exp)}</b></div><div><small>Last count</small><b>${last ? nf85Day(last.day) : 'None yet'}</b></div><div><small>Last result</small><b class="${last && last.difference < 0 ? 'neg' : ''}">${last ? (last.difference < 0 ? nf85P(-last.difference) + ' short' : last.difference > 0 ? nf85P(last.difference) + ' over' : 'Matched') : '—'}</b></div></div>
      <div class="nf87-row"><span>Ready? It takes about 2 minutes.</span><button type="button" class="nf82-btn p" onclick="slClose('nf86T'); nf84CountCash()">Start counting</button></div>`, '');
    return;
  }
  return base.apply(this, arguments);
}; window.nf86Task = nf86Task; })();

/* ---------- Checks: add any check, every step green, details with photo proof, edit, and undo ---------- */
function nf87Undo(poId, side, after){ const po = getPO(poId); if(!po || !po._undoSnapshot){ showToast('Nothing to undo for this one.', 'warn'); return; } undoLastAction(poId, side); try{ afterPaymentChange(getPO(poId)); }catch(e){} try{ (after || renderChequesPage)(); }catch(e){} }
function nf87ChqKey(c){ return `'${c.po.id}','${c.kind}','${c.key}'`; }
const NF87_CHQ_STEP = {due: 'Not deposited yet', hold: 'Dated later', deposited: 'Deposited, waiting to clear', cleared: 'Cleared', bounced: 'Bounced'};
function nf87ChqFind(poId, kind, key){ const side = currentAppRole === 'supplier' ? 'supplier' : 'buyer'; return collectCheques(side).find(c => c.po.id === poId && c.kind === kind && String(c.key) === String(key)); }
function nf87ChqOpen(poId, kind, key){
  const c = nf87ChqFind(poId, kind, key); if(!c) return; const got = currentAppRole === 'supplier', p = c.p, k = `'${poId}','${kind}','${key}'`;
  const steps = got ? [['Received', true], ['Deposited', !!p.depositedAt || ['cleared', 'bounced'].includes(c.status)], [c.status === 'bounced' ? 'Bounced' : 'Cleared', ['cleared', 'bounced'].includes(c.status)]] : [['Written', true], [c.status === 'bounced' ? 'Bounced' : 'Cleared', ['cleared', 'bounced'].includes(c.status)]];
  const next = got ? (['due', 'hold'].includes(c.status) ? `<button type="button" class="nf82-btn p" onclick="slClose('nf87Chq'); chequeDeposited(${k}${c.status === 'hold' ? ', true' : ''})">Mark deposited</button>` : c.status === 'deposited' ? `<button type="button" class="nf82-btn p" onclick="slClose('nf87Chq'); nf87ChqClear(${k})">It cleared</button><button type="button" class="nf82-btn s nf87-red" onclick="slClose('nf87Chq'); chequeBounced(${k})">It bounced</button>` : '') : '';
  const hist = (c.po.history || []).filter(h => /[Cc]heck|cheque/.test(h.action || '')).slice(-4).reverse();
  nf45Pop('nf87Chq', `Check from ${nf87E(c.party)}`, `<div class="nf87-chq">
      <div class="top"><div><small>${nf87E(c.bank || 'Bank')} · #${nf87E(c.no || '—')}</small><b>${nf85P(c.amount)}</b><span>Dated ${nf87E(nf85Day(c.date))} · ${nf87E(String(c.po.poNumber || '').replace(/^PO-\\d{4}-/, 'Order '))}</span></div><span class="st s-${c.status}">${nf87E(NF87_CHQ_STEP[c.status] || c.status)}</span></div>
      <div class="steps">${steps.map(([l, ok]) => `<span class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${l}</span>`).join('<i></i>')}</div>
      ${next ? `<div class="nx"><b>Next step</b><div>${next}</div></div>` : ''}
      <div class="pf"><b>Proof</b>${p.proofUrl || p.proof ? `<a href="${nf87E(p.proofUrl || '#')}" target="_blank" rel="noopener" class="ok">✓ Photo attached</a>` : '<span>No photo yet</span>'}<label class="nf82-btn s">Add a photo<input type="file" accept="image/*" hidden onchange="nf87ChqPhoto(${k}, this)"></label></div>
      <details class="ed"><summary>Fix a mistake in this check</summary><div class="g"><label><small>Amount</small><input id="nf87ChA" inputmode="decimal" value="${c.amount}"></label><label><small>Check number</small><input id="nf87ChN" value="${nf87E(c.no)}"></label><label><small>Bank</small><input id="nf87ChB" value="${nf87E(c.bank)}"></label><label><small>Date on the check</small><input id="nf87ChD" type="date" value="${nf87E(c.date)}"></label></div><button type="button" class="nf82-btn p" onclick="nf87ChqEdit(${k})">Save the fix</button></details>
      ${hist.length ? `<div class="hs"><b>History</b>${hist.map(h => `<div><span>${nf87E(h.date || '')}</span>${nf87E(h.action || '')}</div>`).join('')}</div>` : ''}
    </div>`, `${c.po._undoSnapshot ? `<button type="button" class="btn btn-outline" onclick="slClose('nf87Chq'); nf87Undo('${poId}', '${got ? 'supplier' : 'buyer'}')">↶ Undo the last step</button>` : ''}`);
}
function nf87ChqClear(poId, kind, key){ chequeCleared(poId, kind, key); nf84Undo('Marked cleared. Add the deposit slip photo if you have it.', () => nf87Undo(poId, currentAppRole === 'supplier' ? 'supplier' : 'buyer'), 10); }
async function nf87ChqPhoto(poId, kind, key, input){
  const f = input.files && input.files[0]; if(!f) return; const po = getPO(poId), p = po && findChequePayment(po, kind, key); if(!p) return;
  let data; try{ data = await bkCompressImage(f, 1400); }catch(e){ showToast("Couldn't read that picture.", 'warn'); return; }
  snapshotPO(po);
  if(myBusiness){ try{ const path = await bkUploadPhoto(data, 'chq-' + (p.id || Date.now())); p.proof = path; }catch(e){ showToast("The photo didn't upload. Try again.", 'warn'); return; } } else { p.proof = 'demo'; p.proofUrl = data; }
  mirrorChequeFields(po, kind, p); poLogHistory(po, currentAppRole === 'supplier' ? 'supplier' : 'buyer', 'Check photo added'); afterPaymentChange(po);
  showToast('Photo added.', 'success'); nf87ChqOpen(poId, kind, key);
}
function nf87ChqEdit(poId, kind, key){
  const po = getPO(poId), p = po && findChequePayment(po, kind, key); if(!p) return;
  const amt = Number(String((document.getElementById('nf87ChA') || {}).value).replace(/[^\d.]/g, '')); if(!(amt > 0)){ showToast('Type the amount.', 'warn'); return; }
  const was = `${fmtPHP(p.amount)} #${p.reference || ''} ${p.bank || ''} ${p.checkDate || ''}`;
  snapshotPO(po); p.amount = amt; p.reference = stripMarkup((document.getElementById('nf87ChN') || {}).value || '').slice(0, 40); p.bank = stripMarkup((document.getElementById('nf87ChB') || {}).value || '').slice(0, 40); p.checkDate = (document.getElementById('nf87ChD') || {}).value || p.checkDate;
  mirrorChequeFields(po, kind, p); poLogHistory(po, currentAppRole === 'supplier' ? 'supplier' : 'buyer', `Check corrected (was ${was})`); afterPaymentChange(po);
  slClose('nf87Chq'); renderChequesPage(); nf84Undo('Check fixed.', () => nf87Undo(poId, currentAppRole === 'supplier' ? 'supplier' : 'buyer'), 10);
}
function nf87ChqAdd(){
  const got = currentAppRole === 'supplier';
  const pos = got ? getSupplierPOs().filter(po => po.invoice && !['paid', 'cancelled'].includes(po.status)) : getBuyerPOs().filter(po => po.invoice && !['paid', 'cancelled'].includes(po.status));
  nf45Pop('nf87ChAdd', got ? 'Add a check you got' : 'Add a check you wrote', `<div class="nf87-chq">
    <p class="lead">${got ? 'A customer paid you with a check. Nifti reminds you on the date to deposit it.' : 'You paid a supplier with a check. Nifti reminds you to keep money in the bank.'}</p>
    <div class="g"><label class="w2"><small>${got ? 'Which bill is it for?' : 'Which supplier bill?'}</small><select id="nf87AdPo">${pos.map(po => { const cpi = computeInvoicePayments(po); return `<option value="${po.id}" data-room="${Math.max(0, cpi.balance - cpi.pendingAmount)}">${nf87E(got ? po.buyerName : po.supplierName)} · ${nf87E(po.invoice.number || po.poNumber)} · ${fmtPHP(Math.max(0, cpi.balance - cpi.pendingAmount))} open</option>`; }).join('')}</select></label>
      <label><small>Amount</small><input id="nf87AdA" inputmode="decimal" placeholder="0"></label><label><small>Date on the check</small><input id="nf87AdD" type="date" value="${APP_TODAY}"></label>
      <label><small>Bank</small><input id="nf87AdB" placeholder="BDO, BPI…"></label><label><small>Check number</small><input id="nf87AdN" placeholder="e.g. 004512"></label></div>
    ${pos.length ? '' : '<p class="lead">No open bills right now. Checks are linked to a bill so Nifti can mark it paid.</p>'}</div>`,
    `<button type="button" class="btn btn-primary" onclick="nf87ChqAddSave()" ${pos.length ? '' : 'disabled'}>Save the check</button>`);
  const s = document.getElementById('nf87AdPo'), a = document.getElementById('nf87AdA'); if(s && a){ const f = () => { const o = s.selectedOptions[0]; if(o) a.value = o.dataset.room; }; f(); s.onchange = f; }
}
function nf87ChqAddSave(){
  const got = currentAppRole === 'supplier', po = getPO((document.getElementById('nf87AdPo') || {}).value); if(!po) return;
  const amount = Number(String(document.getElementById('nf87AdA').value).replace(/[^\d.]/g, '')), date = document.getElementById('nf87AdD').value, no = stripMarkup(document.getElementById('nf87AdN').value).slice(0, 40), bank = stripMarkup(document.getElementById('nf87AdB').value).slice(0, 40);
  if(!(amount > 0)){ showToast('Type the amount on the check.', 'warn'); return; } if(!no){ showToast('Type the check number.', 'warn'); return; }
  snapshotPO(po);
  paymentListFor(po, 'invoice').push({id: newRecordId(), method: 'check', amount, reference: no, bank, checkDate: date || APP_TODAY, date: APP_TODAY, confirmStatus: 'pending', checkStatus: 'pending', submittedBy: got ? 'supplier' : 'buyer'});
  poLogHistory(po, got ? 'supplier' : 'buyer', `Check ${got ? 'received' : 'written'} — ${bank ? bank + ' ' : ''}#${no} ${fmtPHP(amount)} dated ${date}`); afterPaymentChange(po);
  slClose('nf87ChAdd'); renderChequesPage(); nf84Undo('Check saved.', () => nf87Undo(po.id, got ? 'supplier' : 'buyer'), 10);
}
(function(){ const base = window.renderChequesPage; const w = function(){ const r = base.apply(this, arguments); try{ nf87ChqDecorate(); }catch(e){ console.warn('nf87 chq', e); } return r; }; window.renderChequesPage = w; try{ renderChequesPage = w; }catch(e){} })();
function nf87ChqDecorate(){
  const el = document.getElementById('chequesContent'); if(!el) return; const got = currentAppRole === 'supplier';
  el.querySelectorAll('details.panel-card').forEach(d => { if(/check you received/i.test(d.textContent)) d.remove(); });
  if(!el.querySelector('.nf87-chadd')){ el.insertAdjacentHTML('afterbegin', `<div class="nf87-chadd"><button type="button" class="nf82-btn p" onclick="nf87ChqAdd()">+ Add a check ${got ? 'you got' : 'you wrote'}</button><span>Tap any check to see its steps, add a photo, fix a mistake or undo.</span></div>`); }
  const list = collectCheques(got ? 'supplier' : 'buyer');
  el.querySelectorAll('.nfc-row, tbody tr').forEach((row, i) => {
    if(row.dataset.nf87) return; row.dataset.nf87 = 1;
    row.querySelectorAll('button').forEach(b => { if(/^Cleared$/.test(b.textContent.trim())){ b.className = 'btn btn-primary btn-sm'; const m = (b.getAttribute('onclick') || '').match(/chequeCleared\(([^)]*)\)/); if(m) b.setAttribute('onclick', `event.stopPropagation(); nf87ChqClear(${m[1]})`); } else b.setAttribute('onclick', 'event.stopPropagation(); ' + (b.getAttribute('onclick') || '')); });
    const btn = row.querySelector('button[onclick*="cheque"], button[onclick*="nf87Chq"]'); let args = btn && (btn.getAttribute('onclick') || '').match(/'([^']+)','([^']+)','([^']+)'/);
    if(!args){ const nm = row.textContent; const c = list.find(x => nm.includes(x.party) && nm.includes(String(x.no))); if(c) args = [null, c.po.id, c.kind, String(c.key)]; }
    if(args){ row.style.cursor = 'pointer'; row.onclick = () => nf87ChqOpen(args[1], args[2], args[3]); }
  });
}

/* ---------- Returns & credits: open examples on both sides, every row opens its details, using a credit shows the bill, and it can be undone ---------- */
function nf87RetSeed(){
  if(!nf87Demo() || window._nf87Ret) return; window._nf87Ret = true;
  try{
    const bp = getBuyerPOs().filter(p => ['delivered', 'invoiced', 'paid'].includes(p.status));
    const ms = bp.find(p => p.rma) || bp[0]; if(ms && ms.rma){ ms.rma.lines = ms.rma.lines || [{product: 'Steel Rebar 12mm', qty: 10, unit: 'piece', price: 64}]; ms.rma.credit = 640; ms.rma.memo = 'MS-CM-118'; }
    const open2 = bp.find(p => p !== ms && !p.rma); if(open2) open2.rma = {reason: 'Damaged goods', desc: '3 bags of cement torn in the truck', filedDate: addDaysIso(APP_TODAY, -2), status: 'open', lines: [{product: 'Portland Cement 40kg', qty: 3, unit: 'bag', price: 228}]};
    const sp = getSupplierPOs().filter(p => ['delivered', 'invoiced', 'paid'].includes(p.status) && !p.rma);
    if(sp[0]) sp[0].rma = {reason: 'Wrong item', desc: 'Sent 16mm rebar instead of 12mm', filedDate: addDaysIso(APP_TODAY, -1), status: 'open', lines: [{product: 'Steel Rebar 12mm', qty: 20, unit: 'piece', price: 64}]};
    if(sp[1]) sp[1].rma = {reason: 'Short delivery', desc: '2 rolls of wire missing', filedDate: addDaysIso(APP_TODAY, -12), status: 'credited', outcome: 'credit', lines: [{product: 'Galvanized Wire 12ga', qty: 2, unit: 'roll', price: 520}], credit: 1040, memo: 'CM-0042'};
    if(typeof demoCreditMemos !== 'undefined' && sp[1] && !demoCreditMemos.some(m => m.id === 'nf87-cm-s1')){
      demoCreditMemos.push({id: 'nf87-cm-s1', buyer_business_id: sp[1].buyerId, supplier_business_id: ME_SUPPLIER, number: 'CM-0042', amount: 1040, remaining: 1040, reason: 'Short delivery, 2 rolls of wire', status: 'open', created_at: addDaysIso(APP_TODAY, -11) + 'T03:00:00Z', source_po_id: sp[1].id, _party: sp[1].buyerName});
    }
  }catch(e){ console.warn('nf87 ret seed', e); }
}
function nf87CmUses(m){ const out = []; [...getSupplierPOs(), ...getBuyerPOs()].forEach(po => ((po.invoice && po.invoice.payments) || []).forEach(p => { if(p.method === 'credit_note' && p.reference === m.number) out.push({po, p}); })); return out; }
function nf87Lines(rows){ return rows && rows.length ? `<table class="nf87-lt"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${rows.map(l => `<tr><td>${nf87E(l.product)}</td><td>${nf87E(l.qty)} ${nf87E(l.unit || '')}</td><td>${nf85P(l.unitPrice != null ? l.unitPrice : l.price)}</td><td><b>${nf85P(l.qty * (l.unitPrice != null ? l.unitPrice : l.price))}</b></td></tr>`).join('')}</tbody></table>` : ''; }
async function nf87CmOpen(id){
  const m = (await loadCreditMemos()).find(x => x.id === id); if(!m) return; const sell = currentAppRole === 'supplier', uses = nf87CmUses(m);
  const src = m.source_po_id ? getPO(m.source_po_id) : null, party = m._party || (src ? (sell ? src.buyerName : src.supplierName) : (typeof nf21Party === 'function' ? nf21Party(m, sell) : 'Partner'));
  nf45Pop('nf87Cm', `Credit ${nf87E(m.number || '')} · ${nf87E(party)}`, `<div class="nf87-chq">
      <div class="top"><div><small>${nf87E(m.reason || '')}</small><b>${nf85P(m.amount)}</b><span>Given ${nf87E(nf85Day(String(m.created_at).slice(0, 10)))} · ${nf85P(m.remaining)} left</span></div><span class="st ${m.status === 'void' ? '' : Number(m.remaining) < .5 ? 's-cleared' : 's-due'}">${m.status === 'void' ? 'Cancelled' : Number(m.remaining) < .5 ? 'Used up' : Number(m.remaining) < Number(m.amount) ? 'Partly used' : 'Not used yet'}</span></div>
      ${src && src.rma && src.rma.lines ? `<div class="sec"><b>What it was for · ${nf87E(String(src.poNumber || '').replace(/^PO-\\d{4}-/, 'Order '))}</b>${nf87Lines(src.rma.lines)}</div>` : ''}
      <div class="sec"><b>Where it was used</b>${uses.length ? uses.map(u => `<div class="use"><span>${nf87E(nf85Day(u.p.date))} · ${nf87E(u.po.invoice && u.po.invoice.number || u.po.poNumber)}</span><b>−${nf85P(u.p.amount)}</b><button type="button" class="nf82-btn s" onclick="slClose('nf87Cm'); openOrderDetailModal('${u.po.id}', ${sell})">Open the bill</button>${sell ? `<button type="button" class="nf82-btn s nf87-red" onclick="nf87CmUndo('${m.id}', '${u.po.id}')">↶ Undo</button>` : ''}</div>`).join('') : '<p class="lead">Not used on any bill yet.</p>'}</div>
    </div>`, sell && m.status === 'open' && Number(m.remaining) >= .5 ? `<button type="button" class="btn btn-primary" onclick="slClose('nf87Cm'); applyCreditMemo('${m.id}')">Use it on a bill</button>` : '');
}
applyCreditMemo = async function(id){
  const m = (await loadCreditMemos()).find(x => x.id === id); if(!m) return;
  const pos = getSupplierPOs().filter(po => po.buyerId === m.buyer_business_id && po.invoice && !['paid', 'cancelled'].includes(po.status)).map(po => ({po, room: computeInvoicePayments(po).balance - computeInvoicePayments(po).pendingAmount})).filter(x => x.room >= 1);
  if(!pos.length){ showToast('This customer has no open bill yet. The credit waits for the next one.'); return; }
  window._nf87Cm = {m, pos, i: 0}; nf87CmPick(0);
};
window.applyCreditMemo = applyCreditMemo;
function nf87CmPick(i){
  const s = window._nf87Cm; if(!s) return; s.i = i; const x = s.pos[i], amt = Math.min(Number(s.m.remaining), x.room);
  nf45Pop('nf87CmUse', `Use credit ${nf87E(s.m.number)} on a bill`, `<div class="nf87-chq">
      ${s.pos.length > 1 ? `<label class="g1"><small>Which bill?</small><select onchange="nf87CmPick(Number(this.value))">${s.pos.map((p, j) => `<option value="${j}" ${j === i ? 'selected' : ''}>${nf87E(p.po.invoice.number || p.po.poNumber)} · ${fmtPHP(p.room)} open</option>`).join('')}</select></label>` : ''}
      <div class="sec"><b>${nf87E(x.po.invoice.number || x.po.poNumber)} · ${nf87E(x.po.buyerName)}</b>${nf87Lines(x.po.lineItems || [])}</div>
      <div class="sum"><div><span>Bill total now</span><b>${nf85P(x.room)}</b></div><div class="m"><span>Credit ${nf87E(s.m.number)}</span><b>−${nf85P(amt)}</b></div><div class="t"><span>New total to pay</span><b>${nf85P(x.room - amt)}</b></div></div>
    </div>`, `<button type="button" class="btn btn-primary" onclick="nf87CmUse()">Use ${nf85P(amt)} on this bill</button>`);
}
async function nf87CmUse(){
  const s = window._nf87Cm; if(!s) return; const m = s.m, x = s.pos[s.i], amt = Math.min(Number(m.remaining), x.room);
  if(myBusiness){ const { error } = await sb.rpc('use_credit_memo', {p_memo: m.id, p_amount: amt, p_po: x.po.id}); if(error){ showToast(error.message, 'error'); return; } }
  else { m.remaining = Number(m.remaining) - amt; if(m.remaining <= 0.005) m.status = 'used'; }
  snapshotPO(x.po);
  paymentListFor(x.po, 'invoice').push({id: newRecordId(), method: 'credit_note', amount: amt, reference: m.number, checkDate: null, date: APP_TODAY, confirmStatus: 'confirmed', confirmedAt: APP_TODAY, submittedBy: 'supplier'});
  settleInvoiceStatus(x.po); poLogHistory(x.po, 'supplier', `Credit ${m.number} applied — ${fmtPHP(amt)}`); afterPaymentChange(x.po);
  if(myBusiness) creditMemosCache = null;
  slClose('nf87CmUse'); renderReturnsPage(); nf84Undo(`Credit used: ${x.po.invoice.number || x.po.poNumber} now ${fmtPHP(x.room - amt)}.`, () => nf87CmUndo(m.id, x.po.id), 12);
}
async function nf87CmUndo(memoId, poId){
  const m = (await loadCreditMemos()).find(x => x.id === memoId), po = getPO(poId); if(!m || !po) return;
  const list = paymentListFor(po, 'invoice'), idx = list.map((p, i) => [p, i]).reverse().find(([p]) => p.method === 'credit_note' && p.reference === m.number); if(!idx){ showToast('That credit is no longer on the bill.', 'warn'); return; }
  const amt = Number(idx[0].amount) || 0;
  if(myBusiness){ const { error } = await sb.rpc('unuse_credit_memo', {p_memo: m.id, p_po: po.id}); if(error){ showToast(error.message, 'error'); return; } creditMemosCache = null; }
  else { m.remaining = Number(m.remaining) + amt; m.status = 'open'; }
  snapshotPO(po); list.splice(idx[1], 1); settleInvoiceStatus(po); poLogHistory(po, 'supplier', `Credit ${m.number} taken back — ${fmtPHP(amt)}`); afterPaymentChange(po);
  slClose('nf87Cm'); renderReturnsPage(); showToast(`Undone. ${fmtPHP(amt)} is back on credit ${m.number}.`, 'success');
}
function nf87RmaOpen(poId){
  const po = getPO(poId); if(!po || !po.rma) return; const sell = currentAppRole === 'supplier', r = po.rma, party = sell ? po.buyerName : po.supplierName;
  const cr = r.credit || (r.lines || []).reduce((a, l) => a + l.qty * (l.price || 0), 0);
  nf45Pop('nf87Rma', `${nf87E(r.reason || 'Problem')} · ${nf87E(String(po.poNumber || '').replace(/^PO-\\d{4}-/, 'Order '))}`, `<div class="nf87-chq">
      <div class="top"><div><small>${nf87E(party)} · reported ${nf87E(nf85Day(r.filedDate || po.createdDate))}</small><b>${r.status === 'open' ? 'Still open' : r.outcome === 'replacement' ? 'Replaced' : 'Credited ' + nf85P(cr)}</b><span>${nf87E(r.desc || '')}</span></div><span class="st ${r.status === 'open' ? 's-bounced' : 's-cleared'}">${r.status === 'open' ? 'Needs an answer' : 'Closed'}</span></div>
      ${r.lines ? `<div class="sec"><b>${/short|missing/i.test(r.reason || '') ? 'Missing' : 'Affected items'}</b>${nf87Lines(r.lines)}</div>` : ''}
      ${r.status !== 'open' && r.memo ? `<div class="sec"><b>Credit ${nf87E(r.memo)}</b><p class="lead">${nf85P(cr)} taken off ${sell ? 'their' : 'your'} next bill.</p></div>` : ''}
    </div>`, `<button type="button" class="btn btn-outline" onclick="slClose('nf87Rma'); nfoChat('${sell ? po.buyerId : po.supplierId}', ${sell})">Message ${nf87E(String(party).split(' ')[0])}</button><button type="button" class="btn btn-primary" onclick="slClose('nf87Rma'); openOrderDetailModal('${po.id}', ${sell})">Open the order</button>`);
}
(function(){ const base = window.renderReturnsPage; if(typeof base !== 'function') return; const w = async function(){ nf87RetSeed(); const r = await base.apply(this, arguments); try{ await nf87RetWire(); }catch(e){ console.warn('nf87 ret', e); } return r; }; window.renderReturnsPage = w; try{ renderReturnsPage = w; }catch(e){} })();
async function nf87RetWire(){
  const el = document.getElementById('returnsContent'); if(!el) return; const sell = currentAppRole === 'supplier';
  const memos = (await loadCreditMemos()).filter(m => sell ? m.supplier_business_id === ME_SUPPLIER : m.buyer_business_id === ME_BUYER).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const pos = sell ? getSupplierPOs() : getBuyerPOs(), since = addDaysIso(APP_TODAY, -180), rmas = pos.filter(po => po.rma && (po.rma.filedDate || po.createdDate) >= since);
  const tables = el.querySelectorAll('table.nf-tbl'); const ct = tables[0], rt = tables[1];
  if(ct) [...ct.querySelectorAll('tbody tr')].forEach((tr, i) => { const m = memos[i]; if(!m) return; tr.classList.add('nf-click'); tr.onclick = e => { if(e.target.closest('button')) return; nf87CmOpen(m.id); }; tr.querySelectorAll('.nfc-link').forEach(b => { if(/Cancel/.test(b.textContent)) b.classList.add('nf87-red'); }); });
  el.querySelectorAll('.nf23-wr').forEach(w => { if(w.dataset.nf87) return; const b = w.querySelector('[onclick*="voidCreditMemo"],[onclick*="nf21Use"]'); const m = b && (b.getAttribute('onclick') || '').match(/\('([^']+)'/); if(!m) return; w.dataset.nf87 = 1; w.classList.add('nf-click'); w.style.cursor = 'pointer'; w.onclick = e => { if(e.target.closest('button')) return; nf87CmOpen(m[1]); };
    w.querySelectorAll('button').forEach(x => { if(/^Cancel$/.test(x.textContent.trim())) x.classList.add('nf87-red'); const u = (x.getAttribute('onclick') || '').match(/nf21Use\('([^']+)'/); if(u) x.setAttribute('onclick', `applyCreditMemo('${u[1]}')`); }); });
  el.querySelectorAll('li.nf-click[onclick*="openOrderDetailModal"]').forEach(li => { const m = (li.getAttribute('onclick') || '').match(/openOrderDetailModal\('([^']+)'/); if(!m) return; li.removeAttribute('onclick'); li.onclick = () => nf87RmaOpen(m[1]); });
  if(rt) [...rt.querySelectorAll('tbody tr')].forEach((tr, i) => { const po = rmas[i]; if(!po) return; tr.removeAttribute('onclick'); tr.onclick = () => nf87RmaOpen(po.id); });
}
try{ if(typeof nfReturnsPage === 'function'){ const b2 = nfReturnsPage; nfReturnsPage = async function(){ nf87RetSeed(); const r = await b2.apply(this, arguments); try{ await nf87RetWire(); }catch(e){} return r; }; } }catch(e){}

/* ---------- Cash, bank & deposits: three clear steps, every number opens its list, deposits can be checked, fixed (with history) and undone ---------- */
function nf87Who(){ try{ return slMemberName(); }catch(e){ return 'You'; } }
async function nf87DepSave(d, patch, label){
  const was = {amount: d.amount, bank: d.bank, deposited_on: d.deposited_on, reference: d.reference, checked_by: d.checked_by || null, checked_at: d.checked_at || null};
  const edits = (d.edits || []).concat([{at: new Date().toISOString(), by: nf87Who(), what: label, was}]);
  if(myBusiness){ const { error } = await sb.from('cash_deposits').update(Object.assign({}, patch, {edits})).eq('id', d.id); if(error){ showToast(error.message, 'error'); return false; } }
  Object.assign(d, patch, {edits}); return true;
}
async function nf87DepUndo(id){
  const d = (depositsCache || []).find(x => x.id === id); if(!d || !(d.edits || []).length) return; const last = d.edits[d.edits.length - 1], edits = d.edits.slice(0, -1);
  if(myBusiness){ const { error } = await sb.from('cash_deposits').update(Object.assign({}, last.was, {edits})).eq('id', id); if(error){ showToast(error.message, 'error'); return; } }
  Object.assign(d, last.was, {edits}); slClose('nf87Dep'); nf87BankRefresh(); showToast('Undone: ' + last.what + '.', 'success');
}
function nf87BankRefresh(){ const s = document.querySelector('#collectionsContent .nf86-bank .nf86-bb'); if(s) nf87BankRender(s); }
function nf87BankData(){
  const led = colLedger(), dep = colDepositedKeys(), matched = colMatchedKeys();
  const cashOn = led.filter(x => x.method === 'cash' && x.counted && !dep.has(x.id) && slDaysAgo(x.date) <= 120);
  const by = {}; cashOn.forEach(x => { (by[x.collector] = by[x.collector] || []).push(x); });
  const deps = (depositsCache || []).slice().sort((a, b) => String(b.deposited_on).localeCompare(String(a.deposited_on)));
  const unB = led.filter(x => x.counted && x.method !== 'cash' && slDaysAgo(x.date) <= 60 && !matched.has(x.id));
  const unD = deps.filter(d => !matched.has('dep:' + d.id) && slDaysAgo(d.deposited_on) <= 60);
  return {led, cashOn, by, deps, unB, unD};
}
function nf87BankRender(host){
  const D = nf87BankData(), cash = D.cashOn.reduce((a, x) => a + x.amount, 0), unchecked = D.deps.filter(d => !d.checked_by).length, nUn = D.unB.length + D.unD.length;
  const demoCut = l => nf87Demo() ? l.slice(0, 3) : l;
  host.innerHTML = `<div class="nf87-bank">
    <div class="st3"><button type="button" class="s ${cash >= 1 ? 'y' : 'g'}" onclick="document.getElementById('nf87BkA').scrollIntoView({behavior:'smooth', block:'center'})"><i>1</i><span><small>Cash still with the team</small><b>${nf85P(cash)}</b><em>${Object.keys(D.by).length} ${Object.keys(D.by).length === 1 ? 'person' : 'people'} holding it</em></span></button>
      <button type="button" class="s ${unchecked ? 'y' : 'g'}" onclick="document.getElementById('nf87BkB').scrollIntoView({behavior:'smooth', block:'center'})"><i>2</i><span><small>Deposits to check</small><b>${unchecked}</b><em>${D.deps.length} deposit${D.deps.length === 1 ? '' : 's'} this period</em></span></button>
      <button type="button" class="s ${nUn ? 'r' : 'g'}" onclick="nf87Unmatched()"><i>3</i><span><small>Not matched to the bank</small><b>${nUn}</b><em>tap to see which</em></span></button></div>
    <section class="card" id="nf87BkA"><div class="ch"><b>1 · Cash still with the team</b><span>Whoever brings this cash to the bank taps <b>Record deposit</b> and adds the slip photo.</span></div>
      ${Object.keys(D.by).length ? Object.entries(D.by).map(([h, xs]) => `<div class="rw"><span class="av">${nf87E(String(h).slice(0, 1))}</span><div class="w"><b>${nf87E(h)}</b><small>${xs.length} payment${xs.length === 1 ? '' : 's'} · oldest ${nf87E(nf85Day(xs.map(x => x.date).sort()[0]))}${xs[0].withDriver ? ' · still on the road' : ''}</small></div><b class="am">${nf85P(xs.reduce((a, x) => a + x.amount, 0))}</b><button type="button" class="nf82-btn p" onclick="colDeposit()">Record deposit</button></div>`).join('') : '<p class="em">All cash is in the bank. 🎉</p>'}</section>
    <section class="card" id="nf87BkB"><div class="ch"><b>2 · Deposits</b><span>Someone else checks each deposit against the slip or the bank app, then taps <b>Check it</b>.</span></div>
      ${D.deps.length ? demoCut(D.deps).map(d => `<div class="rw dep" onclick="nf87DepOpen('${d.id}')"><span class="av b">₱</span><div class="w"><b>${nf87E(nf85Day(d.deposited_on))} · ${nf87E(d.bank || 'Bank')}${d.reference ? ' #' + nf87E(d.reference) : ''}</b><small>Recorded by ${nf87E(d.created_by || 'staff')}${d.note ? ` · <span class="bad">${nf87E(d.note)}</span>` : ''}${(d.edits || []).length ? ` · edited ${d.edits.length}×` : ''}</small></div><b class="am">${nf85P(d.amount)}</b><span class="chip ${d.checked_by ? 'ok' : 'wait'}">${d.checked_by ? '✓ Checked by ' + nf87E(String(d.checked_by).split(' ')[0]) : 'Not checked yet'}</span></div>`).join('') : '<p class="em">No deposits yet.</p>'}</section>
    <section class="card"><div class="ch"><b>Every payment, last 30 days</b><span>Tap one to see the order it paid.</span></div>
      ${demoCut(D.led.filter(x => slDaysAgo(x.date) <= 30)).map(x => `<div class="rw" onclick="openOrderDetailModal('${x.po.id}', true)"><div class="w"><b>${nf87E(x.po.buyerName)} · ${nf87E(String(x.po.poNumber || '').replace(/^PO-\d{4}-/, 'Order '))}</b><small>${nf87E(nf85Day(x.date))} · ${nf87E(PAYMENT_METHOD_LABELS[x.method] || x.method)}${x.ref ? ' · ' + nf87E(x.ref) : ''} · ${nf87E(x.collector)}</small></div><b class="am">${nf85P(x.amount)}</b><span class="chip ${x.pending ? 'wait' : !x.counted ? 'bad' : 'ok'}">${x.pending ? 'To confirm' : !x.counted ? 'Rejected' : x.method === 'cash' ? 'Cash' : 'Confirmed'}</span></div>`).join('')}</section>
  </div>`;
}
function nf87Unmatched(){
  const D = nf87BankData(), rows = D.unB.map(x => ({d: x.date, t: `${x.po.buyerName} · ${PAYMENT_METHOD_LABELS[x.method] || x.method}${x.ref ? ' · ' + x.ref : ''}`, a: x.amount, po: x.po.id})).concat(D.unD.map(d => ({d: d.deposited_on, t: `Cash deposit · ${d.bank || 'Bank'}${d.reference ? ' #' + d.reference : ''}`, a: d.amount, dep: d.id})));
  const shown = nf87Demo() ? rows.slice(0, 3) : rows;
  nf86Pop('unm', `Not matched to the bank · ${rows.length}`, 'These payments are in Nifti but not yet found in your bank or GCash statement. Upload the statement and Nifti ticks off the ones it finds.', shown.length ? `<div class="nf86-ls">${shown.map(r => `<div class="it"><div class="w"><b>${nf87E(r.t)}</b><small>${nf87E(nf85Day(r.d))}</small></div><b class="am">${nf85P(r.a)}</b><div class="bx">${r.po ? `<button type="button" class="nf82-btn s" onclick="slClose('nf86T'); openOrderDetailModal('${r.po}', true)">Open the order</button>` : `<button type="button" class="nf82-btn s" onclick="slClose('nf86T'); nf87DepOpen('${r.dep}')">Open the deposit</button>`}</div></div>`).join('')}</div><div class="nf87-row"><span>Have your bank statement?</span><button type="button" class="nf82-btn p" onclick="slClose('nf86T'); nf45BankMatch()">Match my bank statement</button></div>` : nf86Empty('Everything is matched.'), '');
  const done = document.querySelector('#nf86T .sl-actions .btn-primary'); if(done) done.remove();
}
function nf87DepOpen(id){
  const d = (depositsCache || []).find(x => x.id === id); if(!d) return; const D = nf87BankData(), items = D.led.filter(x => (d.items || []).includes(x.id)), sum = items.reduce((a, x) => a + x.amount, 0);
  nf45Pop('nf87Dep', `Deposit · ${nf87E(nf85Day(d.deposited_on))}`, `<div class="nf87-chq">
      <div class="top"><div><small>${nf87E(d.bank || 'Bank')}${d.reference ? ' · #' + nf87E(d.reference) : ''} · recorded by ${nf87E(d.created_by || 'staff')}</small><b>${nf85P(d.amount)}</b><span>${items.length} cash payment${items.length === 1 ? '' : 's'} = ${nf85P(sum)}${Math.abs(sum - d.amount) >= 1 ? ` · <b class="neg">${d.amount < sum ? 'short' : 'over'} ${nf85P(Math.abs(sum - d.amount))}</b>` : ' · matches'}</span></div><span class="st ${d.checked_by ? 's-cleared' : 's-due'}">${d.checked_by ? 'Checked by ' + nf87E(d.checked_by) : 'Not checked yet'}</span></div>
      ${items.length ? `<div class="sec"><b>What's in it</b>${items.map(x => `<div class="use"><span>${nf87E(x.po.buyerName)} · ${nf87E(nf85Day(x.date))} · ${nf87E(x.collector)}</span><b>${nf85P(x.amount)}</b></div>`).join('')}</div>` : ''}
      ${d.checked_by ? '' : `<div class="nx"><b>Check it</b><div><button type="button" class="nf82-btn p" onclick="nf87DepCheck('${d.id}')">✓ The slip matches</button><label class="nf82-btn s">Add slip photo<input type="file" accept="image/*" hidden onchange="nf87DepSlip('${d.id}', this)"></label></div></div>`}
      <details class="ed"><summary>Fix a mistake in this deposit</summary><div class="g"><label><small>Amount on the slip</small><input id="nf87DpA" inputmode="decimal" value="${d.amount}"></label><label><small>Date</small><input id="nf87DpD" type="date" value="${nf87E(d.deposited_on)}"></label><label><small>Bank</small><input id="nf87DpB" value="${nf87E(d.bank || '')}"></label><label><small>Slip number</small><input id="nf87DpR" value="${nf87E(d.reference || '')}"></label></div><button type="button" class="nf82-btn p" onclick="nf87DepFix('${d.id}')">Save the fix</button></details>
      ${(d.edits || []).length ? `<div class="hs"><b>Change history</b>${d.edits.slice().reverse().map(e => `<div><span>${nf87E(new Date(e.at).toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}))}</span>${nf87E(e.what)} by ${nf87E(e.by)} · was ${nf85P(e.was.amount)}</div>`).join('')}</div>` : ''}
    </div>`, (d.edits || []).length ? `<button type="button" class="btn btn-outline" onclick="nf87DepUndo('${d.id}')">↶ Undo the last change</button>` : '');
}
async function nf87DepCheck(id){ const d = (depositsCache || []).find(x => x.id === id); if(!d) return; if(await nf87DepSave(d, {checked_by: nf87Who(), checked_at: new Date().toISOString()}, 'Checked')){ slClose('nf87Dep'); nf87BankRefresh(); nf84Undo('Deposit checked.', () => nf87DepUndo(id), 10); } }
async function nf87DepFix(id){
  const d = (depositsCache || []).find(x => x.id === id); if(!d) return; const amount = Number(String(document.getElementById('nf87DpA').value).replace(/[^\d.]/g, '')); if(!(amount > 0)){ showToast('Type the amount on the slip.', 'warn'); return; }
  if(await nf87DepSave(d, {amount, deposited_on: document.getElementById('nf87DpD').value || d.deposited_on, bank: document.getElementById('nf87DpB').value || null, reference: document.getElementById('nf87DpR').value || null, checked_by: null, checked_at: null}, 'Fixed')){ slClose('nf87Dep'); nf87BankRefresh(); nf84Undo('Deposit fixed. Someone should check it again.', () => nf87DepUndo(id), 10); }
}
async function nf87DepSlip(id, input){
  const d = (depositsCache || []).find(x => x.id === id), f = input.files && input.files[0]; if(!d || !f) return; let data; try{ data = await bkCompressImage(f, 1400); }catch(e){ return; }
  let path = 'demo'; if(myBusiness){ try{ path = await bkUploadPhoto(data, 'dep-' + id); }catch(e){ showToast("The photo didn't upload.", 'warn'); return; } }
  if(await nf87DepSave(d, {slip_path: path}, 'Slip photo added')){ showToast('Slip photo added.', 'success'); nf87DepOpen(id); }
}
try{ colRenderCash = async function(body){ if(!hasFeature('reconcile')){ body.innerHTML = lockedPanelHtml('reconcile', 'See every peso collected, who holds the cash, what went to the bank, and match your bank statement.'); return; } if(typeof loadRoutes === 'function' && hasFeature('routes')) await loadRoutes(); if(!nf87Demo() || !(depositsCache || []).length) nf87DemoDeps(); nf87BankRender(body); }; window.colRenderCash = colRenderCash; }catch(e){}
function nf87DemoDeps(){ if(!nf87Demo() || window._nf87Dep) return; window._nf87Dep = true; if(!depositsCache) return; if(!depositsCache.length){ depositsCache.push({id: 'D87a', amount: 12500, bank: 'BDO', reference: '771203', deposited_on: addDaysIso(APP_TODAY, -3), items: [], created_by: 'Rico', note: null, edits: []}, {id: 'D87b', amount: 9800, bank: 'BPI', reference: '55120', deposited_on: addDaysIso(APP_TODAY, -6), items: [], created_by: 'Liza', note: 'Short ₱200 vs recorded cash', checked_by: 'Ramon Dela Cruz', checked_at: addDaysIso(APP_TODAY, -5) + 'T09:00:00Z', edits: [{at: addDaysIso(APP_TODAY, -5) + 'T08:30:00Z', by: 'Liza', what: 'Fixed', was: {amount: 10000, bank: 'BPI', deposited_on: addDaysIso(APP_TODAY, -6), reference: '55120'}}]}); } }

/* ---------- Payroll: correct a paid payroll next to the old numbers; "Amount deducted" everywhere ---------- */
function nf87Was(l, i, k){ if(!PRF || !PRF.orig || !PRF.orig[i]) return ''; const o = PRF.orig[i][k]; if(o == null || o === '' || Number(o) === 0 && !Number(l[k])) return ''; return `<em class="nf87-was">Before: ${k === 'days' ? nf87E(o) : bkPeso(Number(o) || 0)}</em>`; }
try{ nf44PrCorrect = function(id){
  const r = PR.runs.find(x => x.id === id); if(!r) return;
  const ls = PR.lines.filter(l => l.run_id === id), f = l => ({staff_name: l.staff_name, basis: l.basis || 'day', rate: String(l.rate || ''), days: String(l.days || ''), extra: String(l.extra || ''), vale_deduct: String(l.vale_deduct || ''), contrib_employee: String(l.contrib_employee || ''), contrib_employer: '', other_deduct: '', note: ''});
  PRF = {id: null, from: r.period_from, to: r.period_to, err: '', saving: false, correction: id, open: 0, lines: ls.map(f), orig: ls.map(f)}; prFormRender();
}; window.nf44PrCorrect = nf44PrCorrect; }catch(e){}
(function(){ if(typeof prSave !== 'function') return; const base = prSave; prSave = async function(pay){
  if(!PRF || !PRF.orig) return base.apply(this, arguments);
  const keep = PRF.lines, orig = PRF.orig, n = v => Number(String(v || 0).replace(/,/g, '')) || 0;
  const diffs = keep.map((l, i) => { const o = orig[i] || {}; const g = prCalc(l).gross - (o.staff_name ? prCalc(o).gross : 0); const vd = n(l.vale_deduct) - n(o.vale_deduct), ce = n(l.contrib_employee) - n(o.contrib_employee);
    return {staff_name: l.staff_name, basis: 'month', rate: String(Math.round(g * 100) / 100), days: '1', extra: '', vale_deduct: String(Math.max(0, vd)), contrib_employee: String(Math.max(0, ce)), contrib_employer: '', other_deduct: '', note: 'Correction'}; }).filter(l => Number(l.rate) > 0 || Number(l.vale_deduct) > 0 || Number(l.contrib_employee) > 0);
  if(!diffs.length){ PRF.err = 'Nothing changed yet. Change the box that was wrong.'; const e = document.getElementById('prErr'); if(e) e.textContent = PRF.err; return; }
  if(diffs.some(l => !(Number(l.rate) > 0))){ PRF.err = 'A correction can only add pay or a missed deduction. For pay that was too high, take it back as an amount deducted next payroll.'; const e = document.getElementById('prErr'); if(e) e.textContent = PRF.err; return; }
  PRF.lines = diffs; const r = await base.call(this, pay); if(PRF){ PRF.lines = keep; } return r;
}; window.prSave = prSave; })();
['prPayslip', 'prShowPaid'].forEach(fn => { try{ const f = window[fn]; if(typeof f !== 'function') return; const src = f.toString().replace(/− Vale taken back/g, '− Amount deducted').replace(/ · vale −/g, ' · deducted −').replace(/Vale/g, 'Amount deducted'); const nf = (0, eval)('(' + src + ')'); window[fn] = nf; eval(fn + ' = nf'); }catch(e){ console.warn('nf87 vale', fn, e); } });
NF45_AFTER.push(() => { try{ document.querySelectorAll('#page-payroll, #prModal, #prPaid').forEach(root => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t; while((t = w.nextNode())){ if(/\bvale\b/i.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/Vale to take back/gi, 'Amount deducted').replace(/\bVale\b/g, 'Amount deducted').replace(/\bvale\b/g, 'amount deducted'); } }); }catch(e){} });

/* ---------- Walk-in sales: a removed sale can always be brought back (toast + "Removed sales" list) ---------- */
async function nf87RestoreSale(id){
  const s = BK.sales.find(x => x.id === id); if(!s || !s.voidedAt) return;
  if(myBusiness){ const { error } = await sb.from('downstream_sales').update({voided_at: null, void_reason: null}).eq('id', id); if(error){ showToast(error.message, 'error'); return; } }
  s.voidedAt = null; s.voidedBy = null; s.voidReason = null;
  const real = (s.lines || []).filter(l => !l.totalOnly); if(real.length) try{ stockOut(bkStockLines(real), 'sold', 'Sale brought back', 'Restore'); }catch(e){}
  bkSaveDemo(); bkRefreshViews(); showToast(`Sale brought back · ${bkPeso(s.total)}.`, 'success');
}
(function(){ if(typeof bkVoidSale !== 'function') return; const base = bkVoidSale; bkVoidSale = async function(id){ const r = await base.apply(this, arguments); const s = BK.sales.find(x => x.id === id); if(s && s.voidedAt) nf84Undo(`Sale removed · ${bkPeso(s.total)}.`, () => nf87RestoreSale(id), 12); return r; }; window.bkVoidSale = bkVoidSale; })();
function nf87RemovedSales(){
  const pg = document.querySelector('#page-sales.active'); if(!pg) return;
  const list = (BK.sales || []).filter(s => s.voidedAt && daysBetween(String(s.voidedAt).slice(0, 10), APP_TODAY) <= 30).sort((a, b) => String(b.voidedAt).localeCompare(String(a.voidedAt)));
  const key = list.map(s => s.id).join('|'); let box = pg.querySelector('.nf87-rm'); if(box && box.dataset.k === key) return; if(box) box.remove(); if(!list.length) return;
  box = document.createElement('section'); box.className = 'panel-card nf87-rm'; box.dataset.k = key;
  box.innerHTML = `<div class="h"><b>Removed sales</b><span>Removed by mistake? Bring it back. Stock goes out again.</span></div>${list.slice(0, 3).map(s => `<div class="r"><div><b>${nf87E(s.customer || 'Walk-in')} · ${bkPeso(s.total)}</b><small>${nf87E(nf85Day(s.date))} · removed${s.voidedBy ? ' by ' + nf87E(s.voidedBy) : ''}${s.voidReason ? ' · “' + nf87E(s.voidReason) + '”' : ''}</small></div><button type="button" class="nf82-btn s" onclick="nf87RestoreSale('${s.id}')">↶ Bring back</button></div>`).join('')}`;
  pg.appendChild(box);
}
NF45_AFTER.push(() => { try{ nf87RemovedSales(); }catch(e){} });
NF45_AFTER.push(() => setTimeout(() => { try{ nf87ChqDecorate(); }catch(e){} try{ if(document.getElementById('returnsContent')) nf87RetWire(); }catch(e){} }, 300));
setInterval(() => { try{ const c = document.getElementById('chequesContent'); if(c && c.offsetParent && c.querySelector('tbody tr:not([data-nf87])')) nf87ChqDecorate(); const r = document.getElementById('returnsContent'); if(r && r.offsetParent && r.querySelector('.nf23-wr:not([data-nf87]), li.nf-click[onclick*="openOrderDetailModal"]')) nf87RetWire(); }catch(e){} }, 1200);

/* ---------- Demo: past months carry their delivery-order sales too, so month-to-month changes read true on every tab ---------- */
(function(){ if(typeof lgBuildDemo !== 'function') return; const base = lgBuildDemo;
  lgBuildDemo = function(){ const r = base.apply(this, arguments);
    try{
      const m1 = bkPrevMonth(APP_TODAY.slice(0, 7)), m2 = bkPrevMonth(m1);
      const plan = [[m2, [[5, 'Bayview Construction Co.', 61000, 43300], [13, 'Riverside Builders Corp', 72000, 52400], [21, 'Cavite Steel Works', 65000, 46700]]],
                    [m1, [[6, 'Bayview Construction Co.', 70500, 52400], [14, 'Riverside Builders Corp', 76000, 57100], [22, 'Corazon Welding Shop', 68500, 50800]]]];
      plan.forEach(([m, rows]) => rows.forEach(([day, who, amt, cost], i) => {
        const d = m + '-' + String(day).padStart(2, '0'), id = 'H' + m + i, vat = lgVat(amt, 0.12);
        const add = (k, memo, ls) => { const e = {id: id + k, date: d, memo, kind: 'auto', type: k === 's' ? 'po_sale' : k === 'c' ? 'po_cogs' : 'po_pay', sid: 'sample', status: 'posted', by: 'Nifti'}; LG.entries.push(e); ls.forEach(l => LG.lines.push(Object.assign({eid: e.id}, l))); };
        add('s', 'Invoice (sample) · ' + who, lgLs(lgL('1100', amt, 'd', who), lgL('4010', amt - vat, 'c'), lgL('2100', vat, 'c')));
        add('c', 'Cost of order (sample) · ' + who, lgLs(lgL('5000', cost, 'd'), lgL('1200', cost, 'c')));
        add('p', 'Payment (sample) · ' + who, lgLs(lgL('1020', amt, 'd'), lgL('1100', amt, 'c', who)));
        // keep stock on the books whole: these sales came from stock bought the same month
        add('b', 'Stock bought (sample) · restock', lgLs(lgL('1200', cost, 'd'), lgL('1020', cost, 'c')));
      }));
      LG.entries.sort((a, b) => a.date.localeCompare(b.date));
    }catch(e){ console.warn('nf87 hist', e); }
    return r; };
  try{ window.lgBuildDemo = lgBuildDemo; }catch(e){}
})();
