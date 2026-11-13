/* ===== Round 23: two money boxes for credits, Books without repeats, a ledger that lines up, an AI tools menu ===== */

/* ---------- 1. Returns & credits: one money box per side, the add button centered at the bottom, past credits and problems folded below ---------- */
const NF23_WHY = typeof NF21_WHY !== 'undefined' ? NF21_WHY : ['Damaged goods', 'Short delivery', 'Returned items', 'Wrong item', 'Price correction', 'Other'];
function nf23Date(d){ try{ return typeof stmtDate === 'function' ? stmtDate(d) : String(d).slice(0, 10); }catch(e){ return String(d || '').slice(0, 10); } }
function nf23Toggle(btn){
  const box = btn.closest('.nf23-box'); if(!box) return;
  const f = box.querySelector('.nf23-form'); if(!f) return;
  const open = f.hidden; f.hidden = !open; box.classList.toggle('open', open);
  btn.textContent = open ? 'Close' : btn.dataset.label;
  if(open){ const first = f.querySelector('select, input'); if(first) setTimeout(() => first.focus(), 30); }
}
async function nf23ReturnsPage(){
  const el = document.getElementById('returnsContent'); if(!el) return;
  const sell = currentAppRole === 'supplier';
  try{ nfDemoReturns(); }catch(e){}
  const pos = sell ? getSupplierPOs() : getBuyerPOs();
  const memos = (await loadCreditMemos()).filter(m => sell ? nf21Side(m) : (!nf21Side(m) && m.buyer_business_id === ME_BUYER));
  const since = addDaysIso(APP_TODAY, -180), rmas = pos.filter(po => po.rma && (po.rma.filedDate || po.createdDate) >= since)
    .sort((a, b) => String(b.rma.filedDate || '').localeCompare(String(a.rma.filedDate || '')));
  const byNew = (a, b) => String(b.created_at).localeCompare(String(a.created_at));
  const open = memos.filter(m => m.status === 'open' && Number(m.remaining) >= 0.5).sort(byNew);
  const past = memos.filter(m => !open.includes(m)).sort(byNew);
  const total = open.reduce((s, m) => s + Number(m.remaining || 0), 0);
  const party = m => escapeHtml(nf21Party(m, sell));
  const wait = m => {
    const pid = sell ? m.buyer_business_id : m.supplier_business_id, b = nf21Bills(sell, pid)[0];
    const part = Number(m.remaining) < Number(m.amount) ? ` · ${nfP(m.remaining)} left of ${nfP(m.amount)}` : '';
    const act = b ? `<button type="button" class="btn btn-primary nf23-take" onclick="nf21Use('${m.id}','${b.po.id}')">Take ${fmtPHP(Math.min(Number(m.remaining), b.room))} off ${escapeHtml(b.po.invoice.number || b.po.poNumber)} now</button>`
      : `<span class="nf23-auto">✓ Comes off ${sell ? 'their' : 'your'} next bill by itself</span>`;
    const more = [m._proof ? `<button type="button" class="nfc-link" onclick="nf21Proof('${m.id}')">See the slip</button>` : '',
      sell && Number(m.remaining) === Number(m.amount) ? `<button type="button" class="nfc-link" onclick="voidCreditMemo('${m.id}')">Cancel</button>` : '',
      !sell && m._manual && Number(m.remaining) === Number(m.amount) ? `<button type="button" class="nfc-link" onclick="nf21Remove('${m.id}')">Remove</button>` : ''].join('');
    return `<div class="nf23-wr"><div class="nf23-wt"><b>${party(m)}</b><small>${escapeHtml(m.reason || 'Credit')} · ${nf23Date(m.created_at)}${part}</small></div><span class="nf23-wa">${nfP(m.remaining)}</span>
      <div class="nf23-wact">${act}${more}</div></div>`;
  };
  const used = m => {
    const off = Number(m.amount || 0) - Number(m.remaining || 0);
    const t = m.status === 'void' ? `Canceled: <b>${party(m)}</b>, ${nfP(m.amount)}` : sell ? `<b>${party(m)}</b> got <b>${nfP(off)}</b> off a bill` : `<b>${party(m)}</b> took <b>${nfP(off)}</b> off your bill`;
    return `<li><div class="nf23-lt">${t}</div><small>${escapeHtml(m.reason || '')} · ${escapeHtml(m.number || '')} · ${nf23Date(m.created_at)}</small>
      <span class="nf23-lr">${m.status === 'void' ? '<span class="nf-pill plain">Canceled</span>' : '<span class="nf-pill good">Used</span>'}${m._proof ? `<button type="button" class="nfc-link" onclick="nf21Proof('${m.id}')">See the slip</button>` : ''}</span></li>`;
  };
  const prob = po => {
    const who = escapeHtml(sell ? po.buyerName : po.supplierName), why = escapeHtml(po.rma.reason || 'A problem');
    const st = po.rma.status === 'open' ? '<span class="nf-pill bad">Open</span>' : po.rma.outcome === 'replacement' ? '<span class="nf-pill good">Replaced</span>' : '<span class="nf-pill good">Credited</span>';
    return `<li class="nf-click" onclick="openOrderDetailModal('${po.id}', ${sell})"><div class="nf23-lt">${sell ? `<b>${who}</b> reported: ${why}` : `You told <b>${who}</b>: ${why}`}</div>
      <small>${po.rma.desc ? escapeHtml(po.rma.desc) + ' · ' : ''}${escapeHtml(po.poNumber)} · ${nf23Date(po.rma.filedDate)}</small><span class="nf23-lr">${st}</span></li>`;
  };
  const buyers = [...new Map(getSupplierPOs().map(p => [p.buyerId, p.buyerName])).entries()];
  const sups = [...new Map([...(suppliersData || []).map(s => [s.id, s.name]), ...getBuyerPOs().map(p => [p.supplierId, p.supplierName])]).entries()];
  const form = sell ? `<div class="nf23-form" hidden><h3>Give a customer a credit</h3>
      <div class="field"><label for="cmBuyer">Which customer?</label><select id="cmBuyer">${buyers.map(([id, n]) => `<option value="${escapeHtml(id)}">${escapeHtml(n)}</option>`).join('')}</select></div>
      <div class="nf23-two"><div class="field"><label for="cmAmt">How much? (₱)</label><input id="cmAmt" type="number" min="1" step="0.01" inputmode="decimal" placeholder="e.g. 500"></div>
        <div class="field"><label for="cmReason">Why?</label><select id="cmReason">${NF23_WHY.map(r => `<option>${r}</option>`).join('')}</select></div></div>
      <button type="button" class="btn btn-primary nf23-wide" onclick="giveCreditMemo()">Give the credit</button>
      <p class="nf23-note">It comes off their next bill by itself. Their bill, statement, your sales and the books all show the lower amount.</p></div>`
    : `<div class="nf23-form" hidden><h3>Add a credit a supplier gave you</h3>
      <div class="field"><label for="sc21Sup">Which supplier?</label><select id="sc21Sup">${sups.map(([id, n]) => `<option value="${escapeHtml(id)}">${escapeHtml(n)}</option>`).join('')}</select></div>
      <div class="nf23-two"><div class="field"><label for="sc21Amt">How much? (₱)</label><input id="sc21Amt" type="number" min="1" step="0.01" inputmode="decimal" placeholder="e.g. 640"></div>
        <div class="field"><label for="sc21Why">Why?</label><select id="sc21Why">${NF23_WHY.map(r => `<option>${r}</option>`).join('')}</select></div></div>
      <div class="field"><label for="sc21Ref">Their slip number <span class="nf21-opt">(if any)</span></label><input id="sc21Ref" type="text" maxlength="40" placeholder="e.g. CM-0442"></div>
      <label class="nf21-snap"><input type="file" accept="image/*" capture="environment" data-nf-cam="1" onchange="nf21PickPhoto(this)"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/></svg>Snap their credit slip</span></label>
      <div class="nf21-prev" id="sc21Prev">${NF21P.photo ? `<img src="${NF21P.photo}" alt="Credit slip photo">` : ''}</div>
      <button type="button" class="btn btn-primary nf23-wide" onclick="nf21SaveSupplierCredit()">Save the credit</button>
      <p class="nf23-note">For any supplier, even one not on Nifti. It comes off your next bill from them by itself.</p></div>`;
  const label = sell ? '+ Give a credit' : '+ Add their credit';
  el.innerHTML = `<section class="nf23-box">
      <div class="nf23-bh"><span class="nf23-k">${sell ? 'Credits you owe customers' : 'Credits suppliers owe you'}</span>
        <span class="nf23-amt${total >= 0.5 ? '' : ' zero'}">${nfP(total)}</span>
        <span class="nf23-sub">${total >= 0.5 ? (sell ? `${open.length} credit${open.length === 1 ? '' : 's'} waiting. ${open.length === 1 ? 'It comes' : 'They come'} off their next bill by itself.` : `${open.length} credit${open.length === 1 ? '' : 's'} waiting. ${open.length === 1 ? 'It comes' : 'They come'} off your next bill from them.`) : (sell ? 'Nothing waiting. Give a credit when a customer returns items or gets money off.' : 'Nothing waiting. Add one when a supplier gives you a credit slip.')}</span></div>
      ${open.length ? `<div class="nf23-rows">${open.map(wait).join('')}</div>` : ''}
      ${form}
      <div class="nf23-bf"><button type="button" class="btn nf23-add" data-label="${label}" onclick="nf23Toggle(this)">${label}</button></div></section>
    <details class="nf23-fold"><summary><span>Used credits</span><b>${past.length}</b></summary>
      ${past.length ? `<ul class="nf23-list">${past.map(used).join('')}</ul>` : `<p class="nf23-empty">No used credits yet.</p>`}</details>
    <details class="nf23-fold"><summary><span>Problems reported</span><b>${rmas.length}</b></summary>
      ${rmas.length ? `<ul class="nf23-list">${rmas.map(prob).join('')}</ul>` : `<p class="nf23-empty">${sell ? 'No problems reported in the last 6 months.' : 'None in the last 6 months. If a delivery comes damaged, short or wrong, open the order and tap "Report a problem".'}</p>`}</details>`;
}

/* ---------- 2. Books: no statement shown twice, a ledger that lines up, the Money overview look ---------- */
// Money overview keeps the monthly profit and money in and out. Books keeps what Money overview doesn't have:
// what changed, what you own and owe, and every peso line by line. Accountants still get every statement.
function nf23LedgerTabs(){
  if(typeof LG_TABS === 'undefined' || typeof LGV === 'undefined') return;
  const acct = !!window._nfAcct;
  if(!acct) for(let i = LG_TABS.length - 1; i >= 0; i--) if(['pnl', 'cash'].includes(LG_TABS[i][0])) LG_TABS.splice(i, 1);
  const order = ['summary', 'bs', 'gl', 'pnl', 'cash', 'tb', 'journal', 'accounts'];
  LG_TABS.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  LG_TABS.forEach(t => { if(t[0] === 'summary') t[1] = 'What changed'; if(t[0] === 'bs') t[1] = 'What you own and owe'; if(t[0] === 'gl') t[1] = 'Every peso (ledger)'; });
  if(!LG_TABS.some(t => t[0] === LGV.tab)) LGV.tab = 'summary';
}
function nf23LedgerAfter(){
  const body = document.getElementById('lgBody'); if(!body) return;
  if(LGV.tab === 'summary') body.querySelectorAll('.lg-tiles').forEach(x => x.remove());
  // the Money overview look: red for money going out, green for what's left, bigger totals
  body.querySelectorAll('section.pl').forEach(sec => {
    sec.classList.add('nf23-st'); let grp = '';
    sec.querySelectorAll('.pl-r').forEach(r => {
      const lab = (r.querySelector('span') || {}).textContent || '', val = (r.querySelector('b') || {}).textContent || '';
      if(r.classList.contains('pl-strong') && !val.trim()){ grp = lab.trim(); r.classList.add('nf23-gh'); return; }
      if(/^[−-]/.test(val.trim()) || /^[−-]\s/.test(lab.trim())) r.classList.add('nf23-neg');
      if(/^Total$/.test(lab.trim()) && grp){ r.classList.add(grp === 'What you have' || grp === 'Money in' ? 'nf23-pos' : grp === 'What you owe' || grp === 'Money out' ? 'nf23-neg' : ''); }
    });
  });
  const pg = document.getElementById('page-ledger'), p = pg && pg.querySelector('.page-head p');
  if(p && !p.dataset.nf23){ p.dataset.nf23 = '1'; p.innerHTML = 'What changed this month, what you own and owe, and every peso line by line. Your profit for the month is on <a class="lg-link" onclick="go(\'money\')">Money overview</a>.'; }
}
function nf23GlHtml(){
  const r = lgRangeNow(), em = lgEntryMap(), code = LGV.acct, acc = lgAcct(code), money = ['1000', '1010', '1020'].includes(String(code));
  const open = lgBal(lgSums(null, addDaysIso(r.from, -1), LGV.branch), code);
  const sign = ['asset', 'expense'].includes(acc.type) ? 1 : -1;
  let run = open;
  const rows = LG.lines.filter(l => l.a === code).map(l => ({l, e: em[l.eid]})).filter(x => x.e && x.e.date >= r.from && x.e.date <= r.to && (!LGV.branch || (x.e.branch || '') === LGV.branch))
    .sort((a, b) => a.e.date.localeCompare(b.e.date));
  const what = (memo, p) => { const parts = String(memo || '').split(' · '); const main = parts.shift() || 'Entry', sub = parts.concat(p ? [p] : []).filter((x, i, a) => x && a.indexOf(x) === i).join(' · ');
    return `<b>${escapeHtml(main)}</b>${sub ? `<small>${escapeHtml(sub)}</small>` : ''}`; };
  const body = rows.map(({l, e}) => { run = lgR(run + sign * (l.d - l.c)); const off = e.status === 'reversed' || e.kind === 'reversal';
    return `<tr onclick="lgShowEntry('${e.id}')" class="${off ? 'off' : ''}"><td class="d">${bkDayLabel(e.date)}</td><td class="w">${what(e.memo, l.p)}</td>
      <td class="n in">${l.d ? (money ? '+' : '') + bkPeso(l.d) : ''}</td><td class="n out">${l.c ? (money ? '−' : '') + bkPeso(l.c) : ''}</td><td class="n bal"><small>Balance</small>${bkPeso(run)}</td></tr>`; }).join('');
  return `<section class="panel-card bk-list nf23-glc"><div class="panel-head"><h2>Every peso, line by line</h2><div class="bk-head-act"><select aria-label="Which account" onchange="LGV.acct=this.value; renderLedgerPage()">${LG.accounts.slice().sort((a, b) => a.code.localeCompare(b.code)).map(a => `<option value="${a.code}" ${a.code === code ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}</select>
      <button class="btn btn-outline" onclick="lgExport('gl')">⬇ CSV</button></div></div>
    <div class="nf23-glw"><table class="nf23-gl ${money ? 'money' : ''}"><thead><tr><th class="d">Date</th><th class="w">What</th><th class="n">${money ? 'Money in' : 'Goes up'}<small>debit</small></th><th class="n">${money ? 'Money out' : 'Goes down'}<small>credit</small></th><th class="n">Balance</th></tr></thead><tbody>
      <tr class="tot"><td class="d"></td><td class="w"><b>Balance at the start</b></td><td class="n"></td><td class="n"></td><td class="n bal">${bkPeso(open)}</td></tr>
      ${body || '<tr><td class="w" colspan="5">No entries in this period.</td></tr>'}
      <tr class="tot end"><td class="d"></td><td class="w"><b>Balance at the end</b></td><td class="n"></td><td class="n"></td><td class="n bal">${bkPeso(run)}</td></tr></tbody></table></div>
    <p class="nf23-note">Tap a line to see where it came from. Faded lines were undone (the record was changed or removed).</p></section>`;
}
// Tax books: every total says what it is
function nf23TaxTotals(){
  document.querySelectorAll('#booksContent table.bk-table').forEach(tb => {
    const heads = [...tb.querySelectorAll('thead th')].map(th => th.textContent.trim());
    const tds = [...tb.querySelectorAll('tfoot td')]; if(!tds.length || tb.dataset.nf23) return; tb.dataset.nf23 = '1';
    let col = 0; tds.forEach(td => { const span = Number(td.getAttribute('colspan') || 1);
      if(col === 0){ td.innerHTML = '<b>Month total</b>'; } else { const h = heads[col] || ''; td.innerHTML = `<small class="nf23-tl">${escapeHtml(h)}</small><span>${td.textContent.trim()}</span>`; td.classList.add('nf23-tv'); }
      col += span; });
  });
}

/* ---------- 3. "What's this page?" sits centered beside the title ---------- */
function nf23HelpRow(){
  document.querySelectorAll('#view-app .nf22-help').forEach(b => {
    const h = b.previousElementSibling; if(!h || !/^H[13]$/.test(h.tagName) || h.parentElement.classList.contains('nf23-th')) return;
    const row = document.createElement('div'); row.className = 'nf23-th'; h.parentElement.insertBefore(row, h); row.appendChild(h); row.appendChild(b);
  });
}

/* ---------- 4. AI tools in the menu: the notebook reader, one tap away ---------- */
const NF23_NB_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M9 8h6"/></svg>';
function nf23Menu(){
  const box = document.querySelector('.sidebar .nf19-nav'); if(!box) return;
  let g = box.querySelector('.nf20-g[data-g="ai"]');
  if(!g){
    let folded = {}; try{ folded = nf20Folded(); }catch(e){}
    g = document.createElement('div'); g.className = 'nf20-g nf23-ai' + (folded.ai ? ' folded' : ''); g.dataset.g = 'ai';
    g.innerHTML = `<button type="button" class="heading nf19-h nf20-h" aria-expanded="${!folded.ai}"><span>AI tools</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="nf20-gi"><button type="button" class="nav-item nf23-nb" id="nf23NbNav">${NF23_NB_IC}<span>Notebook reader</span><em class="nf22-new">New</em></button></div>`;
    g.querySelector('.nf20-h').onclick = () => nf20Fold('ai');
    g.querySelector('#nf23NbNav').onclick = () => { try{ nf22NbOpen(); }catch(e){ console.warn(e); } };
  }
  // right under the main pages, so it's on screen without scrolling the menu
  const at = box.querySelector('.nf20-g[data-g="money"]') || box.querySelector('#nf22Foot');
  if(g.parentElement !== box || g.nextElementSibling !== at) box.insertBefore(g, at || null);
  g.classList.remove('nf20-empty');
}

/* ---------- wiring ---------- */
(function(){
  try{ window.renderReturnsPage = nf23ReturnsPage; renderReturnsPage = nf23ReturnsPage; if(typeof nfRewrap === 'function') nfRewrap('returns'); }catch(e){ console.warn('nf23 returns', e); }
  try{ window.lgGlHtml = nf23GlHtml; lgGlHtml = nf23GlHtml; }catch(e){}
  const rl = window.renderLedgerPage;
  if(typeof rl === 'function' && !rl._nf23){ const w = async function(){ try{ nf23LedgerTabs(); }catch(e){} const out = await rl.apply(this, arguments); try{ nf23LedgerAfter(); }catch(e){ console.warn(e); } return out; };
    Object.keys(rl).forEach(k => { w[k] = rl[k]; }); w._nf23 = true; window.renderLedgerPage = w; try{ renderLedgerPage = w; }catch(e){} }
  const rb = window.renderBooksPage;
  if(typeof rb === 'function' && !rb._nf23){ const w = function(){ const out = rb.apply(this, arguments); Promise.resolve(out).then(() => { try{ nf23TaxTotals(); }catch(e){} }); return out; };
    Object.keys(rb).forEach(k => { w[k] = rb[k]; }); w._nf23 = true; window.renderBooksPage = w; try{ renderBooksPage = w; }catch(e){} }
  const hb = window.nf22HelpBtn;
  if(typeof hb === 'function' && !hb._nf23){ const w = function(){ const out = hb.apply(this, arguments); try{ nf23HelpRow(); }catch(e){} return out; }; w._nf23 = true; window.nf22HelpBtn = w; try{ nf22HelpBtn = w; }catch(e){} }
  // phone menu: AI tools gets its own row
  const om = window.openMoreSheet;
  if(typeof om === 'function' && !om._nf23){ const w = function(){ const r = om.apply(this, arguments); try{ const s = document.querySelector('#moreSheet .nfm-scroll'); if(s && !s.querySelector('.nf23-mai')){
      const sec = document.createElement('section'); sec.className = 'nfm-grp nf23-mai'; sec.innerHTML = `<h6>AI tools</h6><div class="nfm-grid"><button type="button" class="nfm-it" id="nf23NbMore">${NF23_NB_IC}<span>Notebook reader</span></button></div>`;
      sec.querySelector('button').onclick = () => { try{ closeMoreSheet(); }catch(e){} nf22NbOpen(); };
      s.insertBefore(sec, s.firstElementChild); }
      // the first block lists every page; it used to borrow a group's heading
      const first = s.querySelector('.nfm-grp:not(.nf23-mai) h6'); if(first && !first.dataset.nf23){ first.dataset.nf23 = '1'; first.textContent = 'Every page'; } }catch(e){} return r; };
    w._nf23 = true; window.openMoreSheet = w; try{ openMoreSheet = w; }catch(e){} }
  const run = () => { try{ nf23Menu(); nf23HelpRow(); }catch(e){} };
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf23){ const w = function(){ const out = nav.apply(this, arguments); setTimeout(run, 0); return out; };
    Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf23 = true; window.navigate = w; try{ navigate = w; }catch(e){} }
  const mr = window.nf20MenuRoles;
  if(typeof mr === 'function' && !mr._nf23){ const w = function(){ const r = mr.apply(this, arguments); try{ nf23Menu(); }catch(e){} return r; }; w._nf23 = true; window.nf20MenuRoles = w; try{ nf20MenuRoles = w; }catch(e){} }
  // the Money overview link points to Books with the right words
  const start = () => { run(); const app = document.getElementById('view-app'); if(app && !app.dataset.nf23){ app.dataset.nf23 = '1'; let t = 0;
      new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { try{ nf23HelpRow(); nf23Menu(); nf23TaxTotals();
        document.querySelectorAll('#page-money .bk-note').forEach(n => { if(/Profit comes from your posted books/.test(n.textContent) && !n.dataset.nf23){ n.dataset.nf23 = '1'; n.innerHTML = 'Want every peso behind these numbers, or what you own and owe? <a class="lg-link" onclick="go(\'ledger\')">Open Books</a>.'; } }); }catch(e){} }, 150); }).observe(app, {childList: true, subtree: true}); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 500)); else setTimeout(start, 500);
})();
