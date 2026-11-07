/* ===== Round 11 =====
   Cash count without bill-by-bill, To check colours by kind, simple Check payments / Returns / Routes /
   BIR 2307 pages, the business trend on Home, Find customers, and nothing important hidden behind a click. */
const nfP = n => bkPeso(n);
const nfDateBadge = d => { const x = new Date(String(d).slice(0, 10) + 'T00:00:00'); return isNaN(x) ? '<span class="nf-db"><b>—</b></span>' : `<span class="nf-db"><small>${x.toLocaleDateString('en-PH', {month: 'short'})}</small><b>${x.getDate()}</b></span>`; };
const nfInDays = d => { const n = daysBetween(APP_TODAY, String(d).slice(0, 10)); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n > 1 ? `in ${n} days` : n === -1 ? 'yesterday' : `${-n} days ago`; };
function nfRewrap(page){ try{ if(typeof nfDualWrap === 'function') nfDualWrap(page); }catch(e){} }

/* ---------- 1. Cash count: one number, no bill-by-bill ---------- */
(function(){
  const f = window.ccFormHtml; if(typeof f !== 'function' || f._nf11) return;
  window.ccFormHtml = function(){ if(CC) CC.typed = true; let h = f.apply(this, arguments);
    return h.replace(/<button class="sl-link" onclick="CC\.typed=!CC\.typed;[^"]*">[^<]*<\/button>/, '')
      .replace('Count the cash in the drawer</h2>', 'How much cash is in the drawer?</h2>')
      .replace('<label>Total cash counted</label>', '<label>Count it, then type the total</label>'); };
  window.ccFormHtml._nf11 = true;
  const s0 = window.ccStart; if(typeof s0 === 'function' && !s0._nf11){ window.ccStart = function(){ const r = s0.apply(this, arguments); if(CC) CC.typed = true; return r; }; window.ccStart._nf11 = true; }
  const r0 = window.renderCashCountPage; if(typeof r0 !== 'function' || r0._nf11) return;
  window.renderCashCountPage = function(){ const out = r0.apply(this, arguments);
    try{ const body = document.getElementById('bkCashBody'); if(!body) return out;
      body.querySelectorAll('section.panel-card').forEach(s => { const h = s.querySelector('.panel-head h2'); if(h && /^(Settings|Branches and drawers)$/.test(h.textContent.trim())) s.remove(); });
      if(booksCanSeeTotals() && !body.querySelector('.nf-cc-set')){ const st = bkSettings();
        const at = body.querySelector('.cc-grid') || body.querySelector('.bk-tiles');
        const line = document.createElement('div'); line.className = 'nf-cc-set';
        line.innerHTML = `<span>Change fund (sukli) each morning: <b>${nfP(st.change_fund || 0)}</b></span><button type="button" class="sl-link" onclick="nfCcFund()">Change</button><span class="nf-cc-dot">·</span><span>Alert me when short by <b>${nfP(st.cash_alert || 0)}</b> or more</span><button type="button" class="sl-link" onclick="nfCcAlert()">Change</button>`;
        if(at) at.insertAdjacentElement('afterend', line); }
    }catch(e){ console.warn(e); }
    return out; };
  window.renderCashCountPage._nf11 = true;
})();
function nfCcFund(){ const v = prompt('How much change (sukli) do you leave in the drawer each morning? (₱)', String(bkSettings().change_fund || 0)); if(v == null) return; bkSaveSettings({change_fund: Number(String(v).replace(/[^\d.]/g, '')) || 0}).then(renderCashCountPage); }
function nfCcAlert(){ const v = prompt('Send me an alert when the cash is short by at least (₱)', String(bkSettings().cash_alert || 0)); if(v == null) return; bkSaveSettings({cash_alert: Number(String(v).replace(/[^\d.]/g, '')) || 0}).then(renderCashCountPage); }
// branches and drawers now live in Settings > Your business (only shops with more than one store need them)
function nfSettingsCash(){
  const pg = document.getElementById('page-settings'); if(!pg || document.getElementById('nfCashSet') || typeof bkBranchSettingsHtml !== 'function') return;
  const title = [...pg.querySelectorAll('.settings-section-title')].find(t => /Your business/.test(t.textContent)); if(!title) return;
  let last = title, n = title.nextElementSibling; while(n && n.classList.contains('settings-card')){ last = n; n = n.nextElementSibling; }
  const card = document.createElement('div'); card.className = 'settings-card'; card.id = 'nfCashSet';
  try{ SETTINGS_HINTS['Branches & cash drawers'] = 'Only if you have more than one store or drawer'; }catch(e){}
  card.innerHTML = `<h2>Branches & cash drawers</h2><div class="nf-set-b">${bkBranchSettingsHtml().replace('<section class="panel-card">', '<div>').replace(/<\/section>\s*$/, '</div>')}</div>`;
  last.insertAdjacentElement('afterend', card); try{ setupSettingsAccordion(); }catch(e){}
}

/* ---------- 2. To check: colour by kind ---------- */
const NF_ISS_KIND = {
  r: ['Cash short', 'Missing stock', 'Below cost', 'Long overdue', 'Not billed'],
  y: ['Missing receipts', 'No supplier bill', 'Missing cost'],
  b: ['Possible duplicate', 'Stock value differs', 'Supplier price up'],
  g: ['Not counted', 'Waiting for approval'],
};
const NF_ISS_NAME = {r: 'Money lost or at risk', y: 'Paperwork missing', b: 'Looks odd, double-check', g: 'Not done yet'};
function nfIssueTone(kind){ for(const k of Object.keys(NF_ISS_KIND)) if(NF_ISS_KIND[k].includes(kind)) return k; return 'y'; }
function nfIssuesColour(){
  const pg = document.getElementById('page-issues'); if(!pg || !pg.classList.contains('active')) return;
  const cards = [...pg.querySelectorAll('.lg-card')]; if(!cards.length) return;
  const n = {r: 0, y: 0, b: 0, g: 0};
  cards.forEach(c => { const pill = c.querySelector('.lg-card-h > .lg-pill:not(.st)'); const k = nfIssueTone(pill ? pill.textContent.trim() : ''); n[k]++;
    if(!c.classList.contains('nfk-' + k)){ c.classList.remove('nfk-r', 'nfk-y', 'nfk-b', 'nfk-g'); c.classList.add('nfk-' + k); } });
  let lg = pg.querySelector('.nf-iss-key'); const html = Object.keys(n).map(k => `<span class="k-${k}${n[k] ? '' : ' z'}"><i></i>${NF_ISS_NAME[k]}<b>${n[k]}</b></span>`).join('');
  if(!lg){ lg = document.createElement('div'); lg.className = 'nf-iss-key'; const first = cards[0].parentElement; first.insertBefore(lg, cards[0]); }
  if(lg.innerHTML !== html) lg.innerHTML = html;
}

/* ---------- 3. Check payments: grouped by what happens next, one button at most ---------- */
function nfChqRow(c, act){ return `<div class="nfc-row nfc-${c.status}">${nfDateBadge(c.date)}<div class="nfc-m"><b>${escapeHtml(c.party || '—')}</b><small>${escapeHtml(c.bank || 'Bank')} · check #${escapeHtml(c.no || '—')}${c.date ? ' · dated ' + nfInDays(c.date) : ''}</small></div><strong>${nfP(c.amount)}</strong>${act || ''}</div>`; }
function nfChequesPage(){
  const el = document.getElementById('chequesContent'); if(!el) return;
  const badge = document.getElementById('chequesBadge'); if(badge) badge.innerHTML = proBadge('cheques');
  if(typeof nfToolHead === 'function') nfToolHead('cheques');
  if(!hasFeature('cheques')){ el.innerHTML = lockedPanelHtml('cheques', 'Every check in one list, a reminder the day each one can go to the bank, and an alert if one bounces.'); return; }
  try{ seedDemoCheques(); }catch(e){}
  const got = currentAppRole === 'supplier', all = collectCheques(got ? 'supplier' : 'buyer'), sum = l => l.reduce((s, c) => s + c.amount, 0);
  const due = all.filter(c => c.status === 'due'), later = all.filter(c => c.status === 'hold').sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const dep = all.filter(c => c.status === 'deposited'), bounced = all.filter(c => c.status === 'bounced' && (c.date || APP_TODAY) >= addDaysIso(APP_TODAY, -90)), cleared = all.filter(c => c.status === 'cleared' && (c.date || APP_TODAY) >= addDaysIso(APP_TODAY, -60));
  const key = c => `'${c.po.id}','${c.kind}','${c.key}'`;
  const grp = (cls, title, sub, list, act) => list.length ? `<section class="nfc-g ${cls}"><div class="nfc-gh"><b>${title}</b><span>${sub}</span><em>${nfP(sum(list))}</em></div>${list.map(c => nfChqRow(c, act ? act(c) : '')).join('')}</section>` : '';
  const n = l => `${l.length} check${l.length === 1 ? '' : 's'}`;
  el.innerHTML = (got
    ? grp('t-y', 'Deposit today', n(due) + ' can go to the bank now', due, c => `<button class="btn btn-primary btn-sm" onclick="chequeDeposited(${key(c)})">Deposited</button>`)
      + grp('t-b', 'Coming up', n(later) + ' · deposit on the date shown', later)
      + grp('t-n', 'In the bank, waiting to clear', n(dep) + ' · usually 1 to 3 days', dep, c => `<button class="btn btn-outline btn-sm" onclick="chequeCleared(${key(c)})">Cleared</button><button class="nfc-link" onclick="chequeBounced(${key(c)})">Bounced?</button>`)
      + grp('t-r', 'Bounced', n(bounced) + ' · last 90 days', bounced, c => `<button class="nfc-link" onclick="askReplacementCheque(${key(c)})">Ask for a new check</button>`)
      + grp('t-g', 'Cleared', n(cleared) + ' · last 60 days', cleared)
    : grp('t-y', 'Will come out of your bank soon', 'keep enough money in the account', due.concat(dep, later).sort((a, b) => String(a.date).localeCompare(String(b.date))))
      + grp('t-r', 'Bounced', n(bounced), bounced) + grp('t-g', 'Cleared', n(cleared) + ' · last 60 days', cleared))
    || `<div class="nf-empty">No checks yet. ${got ? 'When a customer pays by check, add it below.' : 'Checks you pay suppliers with show here.'}</div>`;
  if(got){ el.insertAdjacentHTML('beforeend', chequeQuickAddHtml().replace('＋ Record a cheque you received', '＋ Add a check you got').replace(/cheque/g, 'check')); try{ renderChequeInvoices(); }catch(e){} }
}

/* ---------- 4. Returns & credits: two clear tables ---------- */
function nfDemoReturns(){
  if(!(typeof nfIsDemo === 'function' && nfIsDemo()) || window._nfRetSeeded) return; window._nfRetSeeded = true;
  try{ const bp = getBuyerPOs().filter(p => ['delivered', 'invoiced', 'paid'].includes(p.status) && !p.rma);
    const ms = bp.find(p => /Metro Steel/.test(p.supplierName)) || bp[0];
    if(ms && !getBuyerPOs().some(p => p.rma)) ms.rma = {reason: 'Short delivery', desc: '1 bundle of rebar missing', filedDate: addDaysIso(APP_TODAY, -9), status: 'credited', outcome: 'credit'};
    if(typeof demoCreditMemos !== 'undefined' && !demoCreditMemos.some(m => m.id === 'nf-cm-3')){
      const sup = ms ? ms.supplierId : 'metro';
      demoCreditMemos.push({id: 'nf-cm-3', buyer_business_id: ME_BUYER, supplier_business_id: sup, number: 'MS-CM-118', amount: 640, remaining: 640, reason: 'Short delivery, 1 bundle of rebar', status: 'open', created_at: addDaysIso(APP_TODAY, -8) + 'T03:00:00Z', _party: ms ? ms.supplierName : 'Metro Steel Co.'},
        {id: 'nf-cm-4', buyer_business_id: ME_BUYER, supplier_business_id: sup, number: 'MS-CM-104', amount: 1500, remaining: 0, reason: 'Price correction', status: 'applied', created_at: addDaysIso(APP_TODAY, -40) + 'T03:00:00Z', _party: ms ? ms.supplierName : 'Metro Steel Co.'}); }
  }catch(e){ console.warn(e); }
}

async function nfReturnsPage(){
  const el = document.getElementById('returnsContent'); if(!el) return;
  const sell = currentAppRole === 'supplier';
  nfDemoReturns();
  const pos = sell ? getSupplierPOs() : getBuyerPOs();
  const memos = (await loadCreditMemos()).filter(m => sell ? m.supplier_business_id === ME_SUPPLIER : m.buyer_business_id === ME_BUYER);
  const since = addDaysIso(APP_TODAY, -180), rmas = pos.filter(po => po.rma && (po.rma.filedDate || po.createdDate) >= since);
  const party = m => { const id = sell ? m.buyer_business_id : m.supplier_business_id; const po = pos.find(p => (sell ? p.buyerId : p.supplierId) === id); return po ? (sell ? po.buyerName : po.supplierName) : (m._party || 'Partner'); };
  const open = memos.filter(m => m.status === 'open'), used = memos.filter(m => m.status === 'applied' || (m.status !== 'void' && Number(m.remaining) < Number(m.amount)));
  const reasons = {}; rmas.forEach(po => { const r = po.rma.reason || 'Other'; reasons[r] = (reasons[r] || 0) + 1; }); const top = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
  const st = m => m.status === 'void' ? '<span class="nf-pill plain">Cancelled</span>' : Number(m.remaining) < 0.5 ? '<span class="nf-pill good">Used</span>' : Number(m.remaining) < Number(m.amount) ? '<span class="nf-pill warn">Partly used</span>' : `<span class="nf-pill warn">${sell ? 'Waiting to be used' : 'Comes off your next bill'}</span>`;
  const sorted = memos.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const buyers = [...new Map(getSupplierPOs().map(p => [p.buyerId, p.buyerName])).entries()];
  el.innerHTML = `<div class="bk-tiles">${bkTile(sell ? 'Credits waiting to be used' : 'Credits from suppliers', nfP(open.reduce((s, m) => s + Number(m.remaining || 0), 0)), `${open.length} credit${open.length === 1 ? '' : 's'}`, open.length ? 'warn' : '')}
      ${bkTile('Credits already used', nfP(used.reduce((s, m) => s + Number(m.amount || 0) - Number(m.remaining || 0), 0)), 'taken off bills')}
      ${bkTile('Bad orders', String(rmas.length), 'last 6 months', rmas.length ? 'bad' : 'good')}
      ${bkTile('Most common problem', top ? escapeHtml(top[0]) : 'None', top ? `${top[1]} time${top[1] === 1 ? '' : 's'}` : 'nothing reported')}</div>
    ${sell ? `<section class="panel-card nf-card nfr-give"><div class="panel-head"><h2>Give a customer a credit</h2><span class="bk-dim">It comes off their next bill by itself</span></div>
      <div class="nfr-form"><div class="field"><label for="cmBuyer">Customer</label><select id="cmBuyer">${buyers.map(([id, n]) => `<option value="${escapeHtml(id)}">${escapeHtml(n)}</option>`).join('')}</select></div>
        <div class="field"><label for="cmAmt">Amount (₱)</label><input id="cmAmt" type="number" min="1" step="0.01" inputmode="decimal" placeholder="0"></div>
        <div class="field"><label for="cmReason">Why</label><select id="cmReason">${['Damaged goods', 'Expired / near expiry', 'Wrong item', 'Short delivery', 'Price correction', 'Goodwill'].map(r => `<option>${r}</option>`).join('')}</select></div>
        <button class="btn btn-primary" onclick="giveCreditMemo()">Give credit</button></div></section>` : ''}
    <section class="panel-card nf-card"><div class="panel-head"><h2>${sell ? 'Credits you gave' : 'Credits suppliers gave you'}</h2><span class="bk-dim">${memos.length} in total</span></div>
      ${sorted.length ? `<div class="lg-tbl-wrap"><table class="lg-tbl nf-tbl"><thead><tr><th>${sell ? 'Customer' : 'Supplier'}</th><th>Why</th><th>Amount</th><th>Left</th><th>Status</th>${sell ? '<th>What to do</th>' : ''}</tr></thead><tbody>
        ${sorted.map(m => `<tr><td><b>${escapeHtml(party(m))}</b><small class="nf-sub">${escapeHtml(m.number || '')} · ${stmtDate(m.created_at)}</small></td><td>${escapeHtml(m.reason || '')}</td><td>${nfP(m.amount)}</td><td><b>${nfP(m.remaining)}</b></td><td>${st(m)}</td>
          ${sell ? `<td><div class="nf-acts">${m.status === 'open' && Number(m.remaining) >= 0.5 ? `<button class="btn btn-primary btn-sm" onclick="applyCreditMemo('${m.id}')">Use it</button>${Number(m.remaining) === Number(m.amount) ? `<button class="nfc-link" onclick="voidCreditMemo('${m.id}')">Cancel</button>` : ''}` : '—'}</div></td>` : ''}</tr>`).join('')}</tbody></table></div>`
        : `<div class="nf-empty">No credits yet.</div>`}</section>
    <section class="panel-card nf-card"><div class="panel-head"><h2>${sell ? 'Bad orders from customers' : 'Bad orders you reported'}</h2><span class="bk-dim">last 6 months</span></div>
      ${rmas.length ? `<div class="lg-tbl-wrap"><table class="lg-tbl nf-tbl"><thead><tr><th>Order</th><th>${sell ? 'Customer' : 'Supplier'}</th><th>What went wrong</th><th>Reported</th><th>Result</th></tr></thead><tbody>
        ${rmas.map(po => `<tr class="nf-click" onclick="openOrderDetailModal('${po.id}', ${sell})"><td><b>${escapeHtml(po.poNumber)}</b></td><td>${escapeHtml(sell ? po.buyerName : po.supplierName)}</td><td>${escapeHtml(po.rma.reason || '')}${po.rma.desc ? `<small class="nf-sub">${escapeHtml(po.rma.desc)}</small>` : ''}</td><td>${stmtDate(po.rma.filedDate)}</td>
          <td>${po.rma.status === 'open' ? '<span class="nf-pill bad">Open</span>' : po.rma.outcome === 'replacement' ? '<span class="nf-pill good">Replaced</span>' : '<span class="nf-pill good">Credited</span>'}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="nf-empty">No bad orders. ${sell ? '' : 'If a delivery comes damaged, short or wrong, open the order and tap "Report a problem".'}</div>`}</section>`;
}

/* ---------- 5. Delivery routes: every stop visible, one status circle each ---------- */
function nfStopState(r, s){ const firstPending = (r.stops || []).find(x => x.status === 'pending'); return s.status === 'done' ? 'done' : s.status === 'failed' ? 'fail' : firstPending && firstPending.id === s.id && r.status !== 'planned' ? 'next' : 'wait'; }
const NF_STOP_LBL = {done: 'Done', next: 'Next stop', wait: 'Not yet', fail: "Couldn't do"};
function nfStopRow(r, s, i){
  const st = nfStopState(r, s), res = s.result || {}, col = res.collected, due = Number(s.amount_due) || 0, why = res.reason || s.fail_reason;
  const what = [(s.deliver_po_ids || []).length ? 'Deliver' : '', (s.collect_po_ids || []).length ? 'Collect' : ''].filter(Boolean).join(' + ') || 'Visit';
  const money = col ? `<span class="nfs-m got">Collected ${nfP(col.amount)}${col.method === 'check' ? ' (check)' : ''}</span>` : st === 'fail' ? `<span class="nfs-m bad">${escapeHtml(why ? "Couldn't: " + why : 'Not done')}</span>`
    : due >= 1 ? `<span class="nfs-m due">${st === 'done' ? 'Not collected ' : 'To collect '}${nfP(due)}</span>` : st === 'done' ? '<span class="nfs-m got">Delivered</span>' : '<span class="nfs-m none">Nothing to collect</span>';
  return `<div class="nfs-row s-${st}"><span class="nfs-c" title="${NF_STOP_LBL[st]}">${st === 'done' ? '✓' : st === 'fail' ? '✕' : i + 1}</span>
    <div class="nfs-mid"><b>${escapeHtml(s.buyer_name)}</b><small>${what}${s.address ? ' · ' + escapeHtml(String(s.address).split(',')[0]) : ''}${s.done_at && st !== 'wait' ? ' · ' + new Date(s.done_at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit'}) : ''}</small></div>
    <div class="nfs-r">${money}${s.has_proof ? `<button class="nfc-link" onclick="viewStopProof('${s.id}')">Photo</button>` : ''}${st === 'fail' && r.status !== 'done' ? `<button class="nfc-link" onclick="reopenStop('${s.id}')">Try again</button>` : ''}</div></div>`;
}
const NF_STOP_KEY = `<div class="nfs-key"><span class="s-done"><i>✓</i>Done</span><span class="s-next"><i></i>Next stop</span><span class="s-wait"><i></i>Not yet</span><span class="s-fail"><i>✕</i>Couldn't do</span></div>`;
function nfRouteCard(r, past){
  const t = routeTotals(r), rem = r.remit, canRemit = !past && t.n && t.done === t.n && (t.cash > 0 || t.cheque > 0) && !rem;
  const pctS = t.n ? Math.round(t.done / t.n * 100) : 0, pctM = t.due ? Math.min(100, Math.round(t.got / t.due * 100)) : 0;
  return `<section class="panel-card nfs-card"><div class="nfs-h"><div><b>${escapeHtml(r.driver_name || 'No driver yet')}</b>${r.vehicle ? `<span> · ${escapeHtml(r.vehicle)}</span>` : ''}<small>${chequeDayLabel(r.route_date)} · ${t.n} stop${t.n === 1 ? '' : 's'}</small></div>
      <span class="nf-pill ${r.status === 'done' ? 'good' : r.status === 'on_road' ? 'info' : 'plain'}">${r.status === 'done' ? 'Finished' : r.status === 'on_road' ? 'On the road' : 'Planned'}</span></div>
    <div class="nfs-prog"><div><span>Stops done</span><b>${t.done} of ${t.n}</b><i><u style="width:${pctS}%"></u></i></div><div><span>Money collected</span><b>${nfP(t.got)} of ${nfP(t.due)}</b><i class="m"><u style="width:${pctM}%"></u></i></div></div>
    <div class="nfs-list">${(r.stops || []).map((s, i) => nfStopRow(r, s, i)).join('')}</div>
    ${rem ? `<div class="nfs-remit ${Math.abs(rem.diff) >= 1 ? 'bad' : 'ok'}">${Math.abs(rem.diff) >= 1 ? `Cash handed over is ${rem.diff < 0 ? 'short' : 'over'} by ${nfP(Math.abs(rem.diff))}` : 'Cash handed over matches'}: ${nfP(rem.counted_cash)} of ${nfP(rem.expected_cash)}</div>` : ''}
    ${canRemit ? `<div class="nfs-remit-f"><b>Driver is back. Count the cash they hand over.</b><span>Expect ${nfP(t.cash)} in cash${t.cheque ? ` and ${nfP(t.cheque)} in checks` : ''}.</span><div><input id="remit_${r.id}" type="number" inputmode="decimal" value="${t.cash}"><button class="btn btn-primary" onclick="confirmRemit('${r.id}')">Confirm</button></div></div>` : ''}
    ${past ? '' : `<div class="nfs-acts">${r.status !== 'done' ? `<button class="btn btn-outline btn-sm" onclick="editRoute('${r.id}')">Edit stops</button>` : ''}<button class="btn btn-outline btn-sm" onclick="shareRouteText('${r.id}')">Send list on Viber</button>${!t.done ? `<button class="nfc-link nf-bad-t" onclick="deleteRoute('${r.id}')">Delete</button>` : ''}</div>`}</section>`;
}
(function(){
  const b0 = window.routeBoardCard; if(typeof b0 === 'function' && !b0._nf11){ window.routeBoardCard = function(r){ return nfRouteCard(r, false); }; window.routeBoardCard._nf11 = true; }
  const rb = window.renderRouteBoard; if(typeof rb === 'function' && !rb._nf11){ window.renderRouteBoard = function(body, routes){ const out = rb.apply(this, arguments); try{ const tl = body.querySelector(':scope > .cq-tiles'); if(tl) tl.remove(); const first = body.querySelector('.nfs-card'); if(first) first.insertAdjacentHTML('beforebegin', NF_STOP_KEY); }catch(e){} return out; }; window.renderRouteBoard._nf11 = true; }
  window.renderRouteHistory = function(body, routes){
    const past = routes.filter(r => r.route_date < APP_TODAY).sort((a, b) => b.route_date.localeCompare(a.route_date));
    body.innerHTML = past.length ? NF_STOP_KEY + past.map(r => nfRouteCard(r, true)).join('') : '<div class="nf-empty">Past routes from the last 30 days show here.</div>';
  };
  // My run: every stop open, nothing to tap to expand
  const st0 = window.routeStationHtml; if(typeof st0 === 'function' && !st0._nf11){
    window.routeStationHtml = function(r, s, i, isNext){ const keep = routeOpenStop; routeOpenStop = s.id; try{ return st0.apply(this, arguments).replace(/ onclick="routeOpenStop = [^"]*"/, ' tabindex="-1"').replace(' aria-expanded="true"', '').replace('<div class="adm-sub" style="margin-top:4px;">You can fix or undo this until the office confirms the cash handover.</div>', ''); } finally{ routeOpenStop = keep; } };
    window.routeStationHtml._nf11 = true; }
  // Plan: step 1 day & driver, step 2 tap customers, step 3 check the order and send
  const pl = window.renderRoutePlanner; if(typeof pl === 'function' && !pl._nf11){
    window.renderRoutePlanner = function(body){ const out = pl.apply(this, arguments);
      try{ const kids = [...body.children]; const secs = kids.filter(k => k.classList.contains('rt-section'));
        const stopsSec = secs[0], addSec = secs[1]; if(!stopsSec || !addSec){ return out; }
        const form = kids[0]; const stopBlock = kids.slice(kids.indexOf(stopsSec), kids.indexOf(addSec)); const addBlock = kids.slice(kids.indexOf(addSec));
        const h = (n, t, s) => `<div class="nfp-step"><i>${n}</i><div><b>${t}</b>${s ? `<small>${s}</small>` : ''}</div></div>`;
        body.innerHTML = ''; body.insertAdjacentHTML('beforeend', h(1, 'Pick the day and the driver', 'Who drives, and on what day'));
        body.appendChild(form); body.insertAdjacentHTML('beforeend', h(2, 'Tap customers to add them as stops', 'Orders to deliver and money to collect are listed for you'));
        addBlock.forEach(x => body.appendChild(x)); body.insertAdjacentHTML('beforeend', h(3, 'Check the order of stops, then send', 'Use the arrows to change the order'));
        stopBlock.forEach(x => body.appendChild(x));
        addSec.firstElementChild && (addSec.firstElementChild.textContent = 'Customers to visit');
        const ttl = form.firstElementChild; if(ttl && /^(New|Edit) route$/.test(ttl.textContent.trim())) ttl.remove();
        stopBlock.forEach(x => { if(x.textContent.trim() === 'Tap buyers below to add them as stops.') x.textContent = 'No stops yet. Tap + Add on a customer in step 2.'; });
      }catch(e){ console.warn(e); }
      return out; };
    window.renderRoutePlanner._nf11 = true; }
})();

// My run: earlier runs show in full under today's run
(function(){ const f = window.renderDriverRun; if(typeof f !== 'function' || f._nf11) return;
  window.renderDriverRun = function(body, routes){ const out = f.apply(this, arguments);
    try{ const h = body.querySelector('.rl-hint'); if(h) h.textContent = 'Every stop is open. Finished stops can be fixed or undone until the cash is handed over.';
      const past = (routes || []).filter(r => (r.mine || !myBusiness) && r.route_date < APP_TODAY).sort((a, b) => b.route_date.localeCompare(a.route_date)).slice(0, 5);
      if(past.length) body.insertAdjacentHTML('beforeend', `<div class="rt-section nfs-past-h">Your earlier runs</div>${NF_STOP_KEY}${past.map(r => nfRouteCard(r, true)).join('')}`); }catch(e){ console.warn(e); }
    return out; };
  window.renderDriverRun._nf11 = true; })();
function nfDemoPastRoute(){
  if(!(typeof nfIsDemo === 'function' && nfIsDemo()) || typeof demoRoutes === 'undefined' || !demoRoutes.some(r => r.id === 'nf-rt-1') || demoRoutes.some(r => r.id === 'nf-rt-0')) return;
  const tm = (teamMembers || []), drv = tm[2] || tm[1] || tm[0] || {}, y = addDaysIso(APP_TODAY, -1);
  const stop = (k, seq, name, addr, amt, col, extra) => Object.assign({id: 'nf-st0-' + k, seq, status: 'done', buyer_business_id: '', buyer_name: name, address: addr, phone: '', deliver_po_ids: ['x'], collect_po_ids: amt ? ['y'] : [], items: [], amount_due: amt, note: '', done_at: y + 'T0' + (1 + k) + ':30:00Z', result: Object.assign({outcome: 'done', delivered: true}, col ? {collected: {amount: col, method: 'cash'}} : {})}, extra || {});
  demoRoutes.push({id: 'nf-rt-0', route_date: y, driver_member_id: drv.id, driver_name: drv.name || 'Mark Santos', vehicle: 'L300 van', status: 'done', mine: true,
    remit: {expected_cash: 9500, counted_cash: 9500, diff: 0, cheques: 0, by: 'Dela Cruz'},
    stops: [stop(1, 1, 'Bayview Construction Co.', 'Pasay, Roxas Blvd', 6500, 6500), stop(2, 2, 'Riverside Builders Corp', 'Pasig site, gate 2', 3000, 3000), stop(3, 3, 'Corazon Welding Shop', 'Cainta, near the market', 0, 0)]});
}

/* ---------- 6. BIR 2307: what it is, what is missing, one button each ---------- */
function nfDemo2307(){
  const sup = [{counterparty_id: 'buy_cavite', counterparty: 'Cavite Steel Works', quarter: '2026-Q2', tax: 1840, base: 184000, count: 3, lines: [{month: 1, date: '2026-04-12', atc: 'WC158', rate: 0.01, base: 64000, tax: 640, po_number: 'PO-2026-0611', invoice_number: 'INV-2026-0301'}, {month: 2, date: '2026-05-20', atc: 'WC158', rate: 0.01, base: 70000, tax: 700, po_number: 'PO-2026-0680', invoice_number: 'INV-2026-0344'}, {month: 3, date: '2026-06-18', atc: 'WC158', rate: 0.01, base: 50000, tax: 500, po_number: 'PO-2026-0702', invoice_number: 'INV-2026-0366'}]},
    {counterparty_id: 'buy_bayview', counterparty: 'Bayview Construction Co.', quarter: '2026-Q2', tax: 2650, base: 265000, count: 2, lines: [{month: 2, date: '2026-05-08', atc: 'WC158', rate: 0.01, base: 140000, tax: 1400, po_number: 'PO-2026-0655', invoice_number: 'INV-2026-0330'}, {month: 3, date: '2026-06-22', atc: 'WC158', rate: 0.01, base: 125000, tax: 1250, po_number: 'PO-2026-0711', invoice_number: 'INV-2026-0370'}]},
    {counterparty_id: 'buy_riverside', counterparty: 'Riverside Builders Corp', quarter: '2026-Q3', tax: 773, base: 77280, count: 1, lines: [{month: 2, date: '2026-08-14', atc: 'WC158', rate: 0.01, base: 77280, tax: 773, po_number: 'PO-2026-0810', invoice_number: 'INV-2026-0421'}]}];
  const buy = [{counterparty_id: 'metro', counterparty: 'Metro Steel Co.', quarter: '2026-Q2', tax: 1120, base: 112000, count: 2, lines: [{month: 1, date: '2026-04-20', atc: 'WC158', rate: 0.01, base: 62000, tax: 620, po_number: 'PO-2026-0620', invoice_number: 'MS-1102'}, {month: 3, date: '2026-06-15', atc: 'WC158', rate: 0.01, base: 50000, tax: 500, po_number: 'PO-2026-0700', invoice_number: 'MS-1188'}]},
    {counterparty_id: 'cebu', counterparty: 'Cebu Aggregates', quarter: '2026-Q2', tax: 640, base: 64000, count: 1, lines: [{month: 2, date: '2026-05-11', atc: 'WC158', rate: 0.01, base: 64000, tax: 640, po_number: 'PO-2026-0661', invoice_number: 'CA-5521'}]}];
  if(!window._nf2307Seeded){ window._nf2307Seeded = true; if(!demo2307Status['supplier|buy_bayview|2026-Q2']) demo2307Status['supplier|buy_bayview|2026-Q2'] = 'received'; if(!demo2307Status['buyer|cebu|2026-Q2']) demo2307Status['buyer|cebu|2026-Q2'] = 'sent'; }
  return (currentAppRole === 'supplier' ? sup : buy).map(g => { const [y, qq] = g.quarter.split('-Q'); const qEnd = new Date(Number(y), Number(qq) * 3, 0).niftiDay(), due = new Date(Number(y), Number(qq) * 3, 20).niftiDay();
    const st = demo2307Status[currentAppRole + '|' + g.counterparty_id + '|' + g.quarter] || 'owed'; return Object.assign({role: currentAppRole, tax_pending: 0}, g, {due, status: st, quarter_ended: APP_TODAY > qEnd, overdue: APP_TODAY > due && st === 'owed'}); });
}
async function nfTaxFormsPage(){
  const el = document.getElementById('taxFormsContent'); if(!el) return;
  const head = document.getElementById('taxFormsBadge'); if(head) head.innerHTML = proBadge('bir2307');
  const sell = currentAppRole === 'supplier';
  if(!hasFeature('bir2307')){ el.innerHTML = lockedPanelHtml('bir2307', sell ? 'See every 2307 your customers owe you and remind them in one tap.' : 'Never miss a 2307 you owe your suppliers.'); return; }
  let rows = [];
  if(myBusiness){ el.innerHTML = '<div class="panel-card">Loading…</div>'; const { data, error } = await sb.rpc('ewt_tracker'); if(error){ el.innerHTML = `<div class="panel-card">${escapeHtml(error.message)}</div>`; return; } rows = (data || []).filter(r => r.role === currentAppRole); }
  else { rows = buildLocal2307().filter(r => !r.example); if(!rows.length) rows = nfDemo2307(); }
  taxFormsCache = rows;
  const year = String(APP_TODAY).slice(0, 4), yr = rows.filter(r => r.quarter.startsWith(year));
  const total = yr.reduce((s, r) => s + Number(r.tax), 0), done = yr.filter(r => r.status === 'received' || (!sell && r.status === 'sent')), doneAmt = done.reduce((s, r) => s + Number(r.tax), 0);
  const need = rows.filter(r => r.quarter_ended && (sell ? r.status !== 'received' : r.status === 'owed'));
  const pct = total ? Math.round(doneAmt / total * 100) : 0;
  const stat = r => { if(sell){ if(r.status === 'received') return '<span class="nf-pill good">Got the form</span>'; if(r.status === 'sent') return '<span class="nf-pill warn">They say they sent it</span>'; if(!r.quarter_ended) return '<span class="nf-pill plain">Not due yet</span>'; return '<span class="nf-pill bad">Missing</span>'; }
    if(r.status === 'sent' || r.status === 'received') return '<span class="nf-pill good">Given</span>'; if(!r.quarter_ended) return '<span class="nf-pill plain">Not due yet</span>'; return `<span class="nf-pill ${r.overdue ? 'bad' : 'warn'}">${r.overdue ? 'Late' : 'To give'}</span>`; };
  const act = r => { const a = `'${r.counterparty_id}', '${r.quarter}'`;
    if(sell) return r.status === 'received' ? `<button class="nfc-link" onclick="open2307Worksheet(${a})">See details</button>` : `${r.quarter_ended ? `<button class="btn btn-primary btn-sm" onclick="remind2307(${a})">Remind them</button>` : ''}<button class="btn btn-outline btn-sm" onclick="mark2307(${a}, 'received')">I got it</button>`;
    return r.status === 'owed' ? `<button class="btn btn-primary btn-sm" onclick="open2307Worksheet(${a})">Make the form</button><button class="btn btn-outline btn-sm" onclick="mark2307(${a}, 'sent')">I gave it</button>` : `<button class="nfc-link" onclick="mark2307(${a}, 'owed')">Undo</button>`; };
  el.innerHTML = `<section class="nf23-hero ${need.length ? 'bad' : 'ok'}">
      <div class="nf23-big"><small>${sell ? `Tax your customers kept in ${year}` : `Tax you kept from suppliers in ${year}`}</small><b>${nfP(total)}</b>
        <span>${sell ? `You have forms for <b>${nfP(doneAmt)}</b>. ${need.length ? `<b class="t-r">${need.length} form${need.length === 1 ? '' : 's'} missing</b>: without them you pay this tax twice.` : 'Every form is in. Nice.'}` : `${need.length ? `<b class="t-r">${need.length} form${need.length === 1 ? '' : 's'} to give</b> by the 20th after each quarter.` : 'Every form is given.'}`}</span>
        <i><u style="width:${pct}%"></u></i><em>${pct}% ${sell ? 'collected' : 'given'}</em></div>
      <ol class="nf23-how">${(sell ? ['A customer pays you 1% less and gives that 1% to BIR', 'They owe you a BIR 2307 form as proof', 'Give the forms to your bookkeeper: you pay that much less tax']
        : ['You paid a supplier 1% less and gave that 1% to BIR', 'You must give them a BIR 2307 form as proof', 'Tap "Make the form": the numbers are filled in for you']).map((s, i) => `<li><i>${i + 1}</i><span>${s}</span></li>`).join('')}</ol></section>
    <section class="panel-card nf-card"><div class="panel-head"><h2>${sell ? 'Forms your customers owe you' : 'Forms you owe your suppliers'}</h2><span class="bk-dim">one row per ${sell ? 'customer' : 'supplier'} per quarter</span></div>
      ${rows.length ? `<div class="lg-tbl-wrap"><table class="lg-tbl nf-tbl"><thead><tr><th>${sell ? 'Customer' : 'Supplier'}</th><th>Quarter</th><th>Tax kept</th><th>Form due</th><th>Status</th><th>What to do</th></tr></thead><tbody>
        ${rows.map(r => `<tr class="${sell ? (r.status === 'received' ? '' : r.quarter_ended ? 'nf-tr-bad' : '') : (r.status === 'owed' && r.quarter_ended ? 'nf-tr-bad' : '')}"><td><b>${escapeHtml(r.counterparty)}</b><small class="nf-sub">${r.count} payment${r.count > 1 ? 's' : ''}</small></td><td>${r.quarter.replace('-', ' ')}</td><td><b>${nfP(r.tax)}</b></td><td>${stmtDate(r.due)}</td><td>${stat(r)}</td><td><div class="nf-acts">${act(r)}</div><div id="remind2307_${r.counterparty_id}_${r.quarter}"></div></td></tr>`).join('')}</tbody></table></div>`
        : `<div class="nf-empty">No withheld tax yet. When ${sell ? 'a customer pays you less because they kept 1% for BIR' : 'you keep 1% of a supplier payment for BIR'}, record it on the payment and it shows here.</div>`}</section>`;
}

/* ---------- 7. Home: how the business is doing (moved from Reports) ---------- */
function nfShort(n){ const a = Math.abs(n), s = n < 0 ? '−' : ''; return s + '₱' + (a >= 1e6 ? (a / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : a >= 1000 ? Math.round(a / 1000) + 'K' : Math.round(a)); }
function nfTrendSvg(months){
  const ph = typeof nfIsPhone === 'function' && nfIsPhone(), W = ph ? 340 : 560, padX = ph ? 4 : 14, top = 26, sH = ph ? 104 : 118, n = months.length, bw = (W - padX * 2) / n, barW = Math.min(44, bw * (ph ? 0.62 : 0.52));
  const maxS = Math.max(1, ...months.map(m => m.sales)), maxP = Math.max(1, ...months.map(m => Math.abs(m.profit))), avg = months.reduce((a, m) => a + m.sales, 0) / n;
  const lblY = top + sH + 22, plTop = lblY + 22, plH = 84, z = plTop + plH / 2, H = plTop + plH + 16;
  const ay = top + sH - avg / maxS * sH;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="nft-svg" role="img" aria-label="Sales and profit, last ${n} months"><defs>
    <linearGradient id="nftS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C7D7EE"/><stop offset="1" stop-color="#E6EEF8"/></linearGradient>
    <linearGradient id="nftN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F6FD6"/><stop offset="1" stop-color="#5B8FE3"/></linearGradient></defs>`;
  s += `<line x1="${padX}" x2="${W - padX}" y1="${top + sH}" y2="${top + sH}" stroke="#DDE3EA"/><line x1="${padX}" x2="${W - padX}" y1="${ay}" y2="${ay}" stroke="#94A3B8" stroke-dasharray="4 4"/>`;
  s += `<line x1="${padX}" x2="${W - padX}" y1="${z}" y2="${z}" stroke="#CBD5E1"/>`;
  months.forEach((m, i) => { const cx = padX + bw * (i + 0.5), h = Math.max(3, m.sales / maxS * sH), now = i === n - 1, x = cx - barW / 2;
    s += `<g><title>${m.label}: sales ${nfP(m.sales)}, ${m.profit < 0 ? 'loss' : 'profit'} ${nfP(Math.abs(m.profit))}</title><rect x="${x}" y="${top + sH - h}" width="${barW}" height="${h}" rx="8" fill="${now ? 'url(#nftN)' : 'url(#nftS)'}"/>`;
    s += `<text x="${cx}" y="${top + sH - h - 7}" text-anchor="middle" class="nft-v${now ? ' now' : ''}">${nfShort(m.sales)}</text><text x="${cx}" y="${lblY}" text-anchor="middle" class="nft-m${now ? ' now' : ''}">${m.label}${now && !ph ? ' (so far)' : ''}</text>`;
    const bh = Math.max(3, Math.abs(m.profit) / maxP * (plH / 2 - 6)), loss = m.profit < 0, pw = barW * 0.7;
    s += `<rect x="${cx - pw / 2}" y="${loss ? z : z - bh}" width="${pw}" height="${bh}" rx="5" fill="${loss ? '#EF4444' : '#22A06B'}"/><text x="${cx}" y="${loss ? z + bh + 13 : z - bh - 5}" text-anchor="middle" class="nft-p ${loss ? 'l' : 'g'}">${m.profit < 0 ? '' : '+'}${nfShort(m.profit)}</text></g>`; });
  return s + '</svg>';
}
async function nfFillHomeReport(){
  const host = document.getElementById('nfHomeReport'); if(!host) return;
  try{ if(typeof bkLoad === 'function') await bkLoad(); if(typeof nfDemoLoss === 'function') nfDemoLoss(); if(typeof lgLoad === 'function') await lgLoad(); }catch(e){}
  const h = document.getElementById('nfHomeReport'); if(!h) return;
  const months = [5, 4, 3, 2, 1, 0].map(k => { const r = nfMonthRange(k); let p = {revenue: 0, net: 0}; try{ p = lgPnlFor(r.from, r.to) || p; }catch(e){} return Object.assign(r, {sales: Number(p.revenue) || 0, profit: Number(p.net) || 0}); });
  const tS = months.reduce((a, m) => a + m.sales, 0), tP = months.reduce((a, m) => a + m.profit, 0);
  const best = months.slice().sort((a, b) => b.profit - a.profit)[0], worst = months.slice().sort((a, b) => a.profit - b.profit)[0];
  let why = '';
  if(worst && worst.profit < 0){ const ex = (BK.expenses || []).filter(e => !e.deletedAt && e.date >= worst.from && e.date <= worst.to).sort((a, b) => Number(b.amount) - Number(a.amount))[0]; if(ex) why = `Biggest cost: ${escapeHtml(ex.category)}${ex.vendor ? ' · ' + escapeHtml(ex.vendor) : ''} ${nfP(ex.amount)}`; }
  const sup = getSupplierPOs().filter(o => !['cancelled', 'draft'].includes(o.status)), buy = getBuyerPOs().filter(o => !['cancelled', 'draft'].includes(o.status));
  const cust = {}, items = {}, sups = {}, y = APP_TODAY.slice(0, 4);
  sup.filter(o => ['delivered', 'invoiced', 'paid'].includes(o.status) || o.invoice).forEach(o => { cust[o.buyerName] = (cust[o.buyerName] || 0) + poTotal(o); (o.lineItems || []).forEach(l => { items[l.product] = (items[l.product] || 0) + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0); }); });
  (BK.sales || []).filter(s => String(s.date).startsWith(y) && !s.voided).forEach(s => { if(s.customer && s.customer !== 'Walk-in') cust[s.customer] = (cust[s.customer] || 0) + Number(s.total || 0); (s.lines || []).forEach(l => { items[l.product] = (items[l.product] || 0) + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0); }); });
  buy.forEach(o => { sups[o.supplierName] = (sups[o.supplierName] || 0) + poTotal(o); });
  h.innerHTML = `<div class="sect-h"><h4>How the business is doing</h4><span class="hint">Last 6 months</span></div>
    <div class="nft-wrap"><div class="nft-chart"><div class="nft-legend"><span><i class="s"></i>Sales</span><span><i class="a"></i>Average ${nfShort(tS / 6)}</span><span><i class="g"></i>Profit</span><span><i class="l"></i>Loss</span></div>${nfTrendSvg(months)}</div>
      <div class="nft-side"><div class="nft-k"><small>Sales, 6 months</small><b>${nfP(tS)}</b></div><div class="nft-k"><small>${tP < 0 ? 'Loss' : 'Profit'}, 6 months</small><b class="${tP < 0 ? 't-r' : 't-g'}">${nfP(tP)}</b></div>
        <div class="nft-k"><small>Best month</small><b>${best.label} · <span class="t-g">+${nfShort(best.profit)}</span></b></div>
        ${worst.profit < 0 ? `<div class="nft-k bad"><small>Loss month</small><b>${worst.label} · <span class="t-r">${nfShort(worst.profit)}</span></b>${why ? `<span>${why}</span>` : ''}</div>` : `<div class="nft-k"><small>Weakest month</small><b>${worst.label} · +${nfShort(worst.profit)}</b></div>`}</div></div>
    <div class="nft-lists"><div><h5>Best customers <small>this year</small></h5>${nfBars(nfTop(cust, 4), true)}</div><div><h5>Best-selling items <small>this year</small></h5>${nfBars(nfTop(items, 4), true)}</div><div><h5>Where you buy the most</h5>${nfBars(nfTop(sups, 4), true)}</div></div>`;
}
function nfDemoLoss(){
  if(!(typeof nfIsDemo === 'function' && nfIsDemo()) || !BK || !Array.isArray(BK.expenses) || BK.expenses.some(e => e.id === 'nf-exp-loss')) return;
  const r = nfMonthRange(3); BK.expenses.push({id: 'nf-exp-loss', date: addDaysIso(r.from, 13), category: 'Repairs', amount: 42000, paidFrom: 'bank', vendor: 'Truck engine overhaul', note: 'delivery truck', staff: '', repeat: false, by: 'Dela Cruz', at: addDaysIso(r.from, 13) + 'T15:00:00'});
  try{ bkSaveDemo(); }catch(e){} try{ lgInvalidate(); }catch(e){}
}
(function(){ const f = window.renderMistHome; if(typeof f !== 'function' || f._nf11) return;
  window.renderMistHome = function(){ const out = f.apply(this, arguments);
    try{ const boss = typeof booksCanSeeTotals === 'function' ? booksCanSeeTotals() : true; const root = document.querySelector('#mhHome .rows');
      if(boss && root && !document.getElementById('nfHomeReport')){ const sec = document.createElement('section'); sec.className = 'sect glass'; sec.id = 'nfHomeReport'; sec.innerHTML = '<div class="sect-h"><h4>How the business is doing</h4></div><div class="nf-empty">Adding up your numbers…</div>';
        const board = [...root.children].find(c => /Where every order is/.test((c.querySelector('h4') || {}).textContent || '')); if(board) board.insertAdjacentElement('afterend', sec); else root.appendChild(sec); nfFillHomeReport(); } }catch(e){ console.warn(e); }
    return out; };
  window.renderMistHome._nf11 = true;
  try{ if(typeof renderHomeV2 !== 'undefined') renderHomeV2 = window.renderMistHome; }catch(e){} try{ if(typeof renderOneHome !== 'undefined') renderOneHome = window.renderMistHome; }catch(e){} })();

/* ---------- 8. Find customers ---------- */
const NF_FIND_BUYERS = [
  {n: 'Golden Spoon Restaurant Group', type: 'Restaurants', area: 'Metro Manila', buys: ['Rice', 'Cooking oil', 'Fresh produce'], monthly: 180000, note: '4 branches, orders twice a week'},
  {n: 'Northgate Homebuilders', type: 'Contractors', area: 'Bulacan', buys: ['Portland Cement 40kg', 'Steel Rebar 12mm', 'Galvanized Wire 12ga'], monthly: 420000, note: '120-unit housing project, starts next month'},
  {n: 'Sta. Rosa Hardware Center', type: 'Hardware stores', area: 'Laguna', buys: ['Angle Bars', 'Welding Rods 3.2mm', 'Galvanized Wire 12ga'], monthly: 150000, note: 'Looking for a second steel supplier'},
  {n: 'J. Ramos Metal Works', type: 'Fabricators', area: 'Cavite', buys: ['Angle Bars', 'Structural I-Beams', 'Welding Rods 3.2mm'], monthly: 95000, note: 'Gates, trusses and grills'},
  {n: 'Bright Minds Academy', type: 'Schools & offices', area: 'Rizal', buys: ['Paint', 'Plywood', 'Cement'], monthly: 40000, note: 'Building repairs before the school year'},
  {n: 'Marikina Riverside Builders', type: 'Contractors', area: 'Metro Manila', buys: ['Steel Rebar 12mm', 'Portland Cement 40kg', 'Wire Mesh Panels'], monthly: 260000, note: 'Two mid-rise projects'},
  {n: 'Pampanga Agri Supply', type: 'Hardware stores', area: 'Pampanga', buys: ['Galvanized Wire 12ga', 'Fertilizer', 'Water hose'], monthly: 70000, note: 'Farm and hardware store'},
];
const NFX = {mode: 'customers', type: 'All', area: 'All'};
function nfMyItems(){ return new Set((inventoryData || []).map(i => String(i.name).toLowerCase()).concat((typeof myCatalog !== 'undefined' && myCatalog || []).map(c => String(c.product).toLowerCase()))); }
function nfFindList(){
  if(myBusiness){ return (realDiscover.buyers || []).map(p => ({id: p.id, n: p.n, type: p.cat || 'Business', area: (p.desc || '').split(' · ')[0] || '', buys: (p.catalog || []).slice(0, 4).map(c => c.product || c), monthly: 0, note: p.desc || '', live: true, connected: p.connected, req: p.requestStatus})); }
  return NF_FIND_BUYERS;
}
function nfFindHtml(){
  const mine = nfMyItems(), list = nfFindList(), types = ['All', ...new Set(list.map(x => x.type))], areas = ['All', ...new Set(list.map(x => x.area).filter(Boolean))];
  const shown = list.filter(x => (NFX.type === 'All' || x.type === NFX.type) && (NFX.area === 'All' || x.area === NFX.area))
    .map(x => Object.assign({}, x, {match: x.buys.filter(b => mine.has(String(b).toLowerCase())).length})).sort((a, b) => b.match - a.match || b.monthly - a.monthly);
  const chip = (k, v) => `<button type="button" class="${NFX[k] === v ? 'on' : ''}" onclick="NFX.${k}=${JSON.stringify(v).replace(/"/g, '&quot;')}; nfFindRender()">${escapeHtml(v)}</button>`;
  return `<div class="nfx-filters"><div><span>Type of business</span><div class="nfx-chips">${types.map(t => chip('type', t)).join('')}</div></div><div><span>Area</span><div class="nfx-chips">${areas.map(a => chip('area', a)).join('')}</div></div></div>
    <div class="nfx-grid">${shown.map((x, i) => `<article class="nfx-card${x.match ? ' fit' : ''}"><div class="nfx-top"><span class="nf-av" data-nf-who="${escapeHtml(x.n)}" data-nf-side="cust"></span><div><b>${escapeHtml(x.n)}</b><small>${escapeHtml(x.type)}${x.area ? ' · ' + escapeHtml(x.area) : ''}</small></div>
        ${x.match ? `<span class="nf-pill good">Buys ${x.match} thing${x.match > 1 ? 's' : ''} you sell</span>` : ''}</div>
      ${x.note ? `<p>${escapeHtml(x.note)}</p>` : ''}
      ${x.buys.length ? `<div class="nfx-buys"><span>They buy</span>${x.buys.map(b => `<em class="${mine.has(String(b).toLowerCase()) ? 'm' : ''}">${escapeHtml(b)}</em>`).join('')}</div>` : ''}
      ${x.monthly ? `<div class="nfx-val">About <b>${nfP(x.monthly)}</b> a month in supplies</div>` : ''}
      <div class="nfx-acts">${x.live ? (x.connected ? '<span class="nf-pill good">Connected</span>' : x.req === 'pending' ? '<span class="nf-pill warn">Request sent</span>' : `<button class="btn btn-primary btn-sm" onclick="nfFindConnect('${x.id}')">Connect on Nifti</button>`) : `<button class="btn btn-primary btn-sm" onclick="nfFindIntro(${list.indexOf(list.find(y => y.n === x.n))})">Send my price list</button>`}<button class="btn btn-outline btn-sm" onclick="nfFindLead(${list.indexOf(list.find(y => y.n === x.n))})">Save as a lead</button></div></article>`).join('') || '<div class="nf-empty">No businesses match these filters yet.</div>'}</div>
    <p class="nfx-note">${myBusiness ? 'Only businesses that chose to be found are listed. They never see your prices or customers until you connect.' : 'Sample businesses for the demo. In your account, this lists real buyers on Nifti who chose to be found.'}</p>`;
}
function nfFindRender(){ const h = document.getElementById('nfFind'); if(h) h.innerHTML = nfFindHtml(); }
function nfFindIntro(i){
  const x = nfFindList()[i]; if(!x) return; const me = (myBusiness && myBusiness.name) || 'Metro Steel Co.';
  const link = typeof storeUrl === 'function' ? storeUrl((myBusiness && myBusiness.store_slug) || 'metro-steel-co') : '';
  const text = `Hi ${x.n}! This is ${me}. We supply ${x.buys.slice(0, 3).join(', ')} with delivery in ${x.area || 'your area'}. Here are our prices and you can order directly: ${link}`;
  slModal('nfIntro', `<div class="sl-sheet-h"><b>Send your price list</b><button class="sl-x" onclick="slClose('nfIntro')">✕</button></div><div class="sl-sub">To ${escapeHtml(x.n)}. Change the message if you like.</div>
    <textarea id="nfIntroTxt" class="sl-ta" rows="5">${escapeHtml(text)}</textarea>
    <div class="nf-cam-acts"><button class="btn btn-outline" onclick="copyPlainText(document.getElementById('nfIntroTxt').value, 'Copied. Paste it in Viber or Messenger.')">Copy</button><a class="btn btn-primary" href="viber://forward?text=${encodeURIComponent(text)}" onclick="setTimeout(() => slClose('nfIntro'), 300)">Send on Viber</a></div>`);
}
function nfFindLead(i){
  const x = nfFindList()[i]; if(!x) return; fuAddLead();
  setTimeout(() => { const set = (id, v) => { const e = document.getElementById(id); if(e) e.value = v; };
    set('ldName', x.n); set('ldCompany', x.n); set('ldInterest', 'Buys ' + x.buys.join(', ')); if(x.monthly) set('ldValue', x.monthly); const s = document.getElementById('ldSource'); if(s){ const o = [...s.options].find(o => /nifti|discover|other/i.test(o.value + o.text)); if(o) s.value = o.value; } }, 80);
}
async function nfFindConnect(id){ const { error } = await sb.rpc('request_connection', {p_to: id, p_note: null}); if(error){ showToast(error.message, 'error'); return; } showToast('Request sent. You can message them once they accept.', 'success'); realDiscover.buyers = null; await loadRealDiscover('buyers'); nfFindRender(); }
function nfDiscoverLayout(){
  const pg = document.getElementById('page-discover'); if(!pg) return;
  let sw = pg.querySelector(':scope > .nfx-switch');
  if(!sw){ sw = document.createElement('div'); sw.className = 'nfx-switch'; sw.setAttribute('role', 'tablist');
    const anchor = pg.querySelector(':scope > .nf-steps') || pg.querySelector(':scope > .page-head'); anchor.insertAdjacentElement('afterend', sw);
    const host = document.createElement('div'); host.id = 'nfFind'; sw.insertAdjacentElement('afterend', host); }
  sw.innerHTML = `<button type="button" class="${NFX.mode === 'customers' ? 'on' : ''}" onclick="NFX.mode='customers'; nfDiscoverLayout()"><b>Find customers</b><small>Businesses that buy what you sell</small></button><button type="button" class="${NFX.mode === 'suppliers' ? 'on' : ''}" onclick="NFX.mode='suppliers'; nfDiscoverLayout()"><b>Find suppliers</b><small>Where to buy cheaper or faster</small></button>`;
  pg.classList.toggle('nfx-cust', NFX.mode === 'customers');
  try{ setDiscView(NFX.mode === 'customers' ? 'buyers' : 'suppliers'); }catch(e){}
  if(NFX.mode === 'customers'){ if(myBusiness && !realDiscover.buyers) loadRealDiscover('buyers').then(nfFindRender); nfFindRender(); }
}


// supplier cards: price lists show without a tap
(function(){ const f = window.renderDiscover; if(typeof f !== 'function' || f._nf11) return;
  window.renderDiscover = function(){ const out = f.apply(this, arguments);
    try{ document.querySelectorAll('#discGrid [id^="discCatalog_"]').forEach(el => { const i = Number(el.id.split('_')[1]); if(!el.innerHTML.trim()) toggleDiscCatalog(i); el.classList.remove('hidden');
      const t = el.previousElementSibling; if(t && /View catalog/.test(t.textContent)){ t.textContent = 'Their prices'; t.removeAttribute('onclick'); t.className = 'nfx-cat-h'; } }); }catch(e){ console.warn(e); }
    return out; };
  window.renderDiscover._nf11 = true; })();

/* ---------- 9. Every page: sections that only showed after a tap are now open ---------- */
const NF_OPEN_DETAILS = /^(Show the \d+ items|Stops|What is a 2307|How you.re doing)/;
// Home lists and the order board show every item (tap "Show less" to shorten)
try{ if(typeof MH !== 'undefined'){ const o = MH.open || {}; MH.open = new Proxy(o, {get: (t, k) => k in t ? t[k] : (typeof k === 'string' && /^(lane[ryg]|sell\d|buy\d)$/.test(k))}); } }catch(e){}
function nfOpenDetails(){ document.querySelectorAll('#view-app .app-page.active details:not([open])').forEach(d => { const s = d.querySelector('summary'); if(s && NF_OPEN_DETAILS.test(s.textContent.trim()) && !d.dataset.nfOpened){ d.open = true; d.dataset.nfOpened = '1'; } }); }


/* ---------- Tax books: no blank notes under a tile ---------- */
function nfBooksTiles(){
  const pg = document.getElementById('page-books'); if(!pg || !pg.classList.contains('active')) return;
  pg.querySelectorAll('.cq-tile').forEach(t => { const n = t.querySelector('.cq-tile-n'), l = t.querySelector('.cq-tile-l'), v = t.querySelector('.cq-tile-v'); if(!n || !l || n.textContent.replace(/ /g, '').trim()) return;
    const zero = v && /^₱?0(\.00)?$/.test(v.textContent.replace(/[\s,]/g, ''));
    n.textContent = /exempt/i.test(l.textContent) ? (zero ? 'nothing exempt this month' : 'invoices with 0% VAT') : /withheld/i.test(l.textContent) ? (zero ? 'none this month' : 'see BIR 2307s') : ''; });
}


/* ---------- phone: totals rows in card tables get labels too ---------- */
function nfCardFoot(){
  if(!(typeof nfIsPhone === 'function' && nfIsPhone())) return;
  document.querySelectorAll('table.nf-cardtable tfoot tr:not([data-nf-f])').forEach(tr => { const t = tr.closest('table'); const heads = [...t.querySelectorAll('thead th')].map(th => th.textContent.trim());
    let col = 0; [...tr.children].forEach((td, i) => { if(!td.hasAttribute('data-label')) td.setAttribute('data-label', i === 0 ? '' : (heads[col] || '')); if(i === 0) td.classList.add('nf-foot-h'); col += td.colSpan || 1; });
    tr.dataset.nfF = '1'; });
}

/* ---------- wiring ---------- */
(function(){
  window.renderChequesPage = nfChequesPage; nfRewrap('cheques');
  window.renderReturnsPage = nfReturnsPage; nfRewrap('returns');
  window.renderTaxFormsPage = nfTaxFormsPage; nfRewrap('taxforms');
  try{ if(typeof NF_TOOL_TEXT !== 'undefined'){ NF_TOOL_TEXT.taxforms = ['BIR 2307s', 'When a big customer pays you 1% less for tax, they owe you a BIR 2307 form. Collect every form here so you never pay that tax twice.', null];
    NF_TOOL_TEXT.discover = ['Find customers & suppliers', 'New customers who buy what you sell, and suppliers who can sell to you for less. Nobody sees your prices or partners.', null];
    NF_TOOL_TEXT.returns = ['Returns & credits', 'When a customer returns items or gets money off for a bad item, give a credit here. It comes off their next bill by itself.', ['Give the credit', 'It waits on their account', 'It comes off their next bill']]; } }catch(e){}
  try{ const lr = window.loadRoutes; if(typeof lr === 'function' && !lr._nf11){ window.loadRoutes = async function(){ try{ nfDemoPastRoute(); }catch(e){} return lr.apply(this, arguments); }; window.loadRoutes._nf11 = true; } }catch(e){}
  const nav = window.navigate; if(typeof nav !== 'function' || nav._nf11) return;
  const w = function(page){
    if(page === 'analytics'){ const r = nav.call(this, 'dashboard'); setTimeout(() => { const h = document.getElementById('nfHomeReport'); if(h) h.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 400); return r; }
    const r = nav.apply(this, arguments);
    setTimeout(() => { try{ if(page === 'settings') nfSettingsCash(); if(page === 'discover') nfDiscoverLayout(); nfOpenDetails(); nfIssuesColour(); }catch(e){ console.warn(e); } }, 30);
    return r; };
  w._nf11 = w._nf8 = w._nf7 = true; window.navigate = w;
})();
(function(){ let raf = 0; const run = () => { raf = 0; try{ nfIssuesColour(); nfOpenDetails(); nfBooksTiles(); nfCardFoot(); }catch(e){} };
  new MutationObserver(() => { if(!raf) raf = requestAnimationFrame(run); }).observe(document.getElementById('view-app') || document.body, {childList: true, subtree: true}); })();
