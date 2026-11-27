/* ===== Round 84 ===== */
function nf84E(s){ return escapeHtml(String(s == null ? '' : s)); }

/* ---------- 1. Delivery orders: band-coloured dates (never black), compact single orders, "still owes from earlier" only when true ---------- */
nfoTile = function(r){
  const [y, m, d] = r.date.split('-').map(Number), today = r.date === APP_TODAY;
  return `<span class="nfo-dt ${r.band}${today ? ' nf84-today' : ''}" title="${nfoE(new Date(y, m - 1, d).toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'}))}"><span class="m">${today ? 'TODAY' : NFO_MON[m - 1]}</span><span class="d">${d}</span></span>`;
}; window.nfoTile = nfoTile;
function nf84Prior(g){
  try{ const ids = new Set(g.os.map(r => r.id));
    const un = unpaidInvoicesFor(g.sell ? 'supplier' : 'buyer').filter(x => x.po && (g.sell ? x.po.buyerId : x.po.supplierId) === g.pid && !ids.has(x.po.id) && (Number(x.balance) || 0) > 0);
    return {amt: un.reduce((a, x) => a + (Number(x.balance) || 0), 0), n: un.length, late: un.some(x => x.daysOverdue > 0)};
  }catch(e){ return {amt: 0, n: 0, late: false}; }
}
function nf84PriorPill(g){
  const pr = nf84Prior(g); if(!(pr.amt > 0)) return '';
  const what = `${pr.n} earlier order${pr.n === 1 ? '' : 's'}`;
  return `<span class="nf84-prev${pr.late ? ' late' : ''}" title="Not part of the orders shown here">${g.sell ? `Still owes you <b>${nfoPeso(pr.amt)}</b> from ${what}${pr.late ? ' · late' : ''}` : `You still owe <b>${nfoPeso(pr.amt)}</b> from ${what}${pr.late ? ' · late' : ''}`}</span>`;
}
const NF84_PAYREG = {};
function nf84PayLink(pid, name){
  try{ if(typeof NF82G === 'undefined' || typeof nf83Qr !== 'function') return showToast('Open Getting paid to share a pay link.', 'warn');
    const id = 'po84_' + pid; NF82G.reg[id] = {src: 'po', key: pid, name}; nf83Qr(id);
  }catch(e){ showToast("Couldn't open the pay link.", 'warn'); }
}
function nf84Dots(btn){ const m = btn.nextElementSibling, open = m.hidden; document.querySelectorAll('.nf43-menu').forEach(x => { x.hidden = true; }); m.hidden = !open; }
function nf84Menu(g, r){
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const items = [`<button type="button" onclick="nfoChat('${g.pid}', ${g.sell})">Message ${nf84E(g.who.split(' ')[0])}</button>`, `<button type="button" onclick="nfoNew(${g.sell}, '${g.pid}')">New order</button>`];
  if(g.sell) items.unshift(`<button type="button" onclick="nf84PayLink('${g.pid}', '${esc(g.who)}')">Pay link &amp; QR</button>`);
  return `<span class="nf43-dotw nf84-dw" onclick="event.stopPropagation()"><button type="button" class="nf43-dots" aria-label="More" onclick="nf84Dots(this)">⋯</button><div class="nf43-menu" hidden onclick="this.hidden=true">${items.join('')}</div></span>`;
}
function nf84Act(r, g){
  if(!r.btn){ if(r.turn === 'done') return `<span class="nf84-done">✓ Done</span>`; return '<span></span>'; }
  const on = r.act === 'msg' ? `nfMessage('${r.id}')` : `nfoOpen('${r.id}')`;
  return `<button type="button" class="btn ${r.turn === 'you' ? 'btn-primary' : 'btn-outline'} nf84-b" onclick="event.stopPropagation(); ${on}">${nfoE(r.btn)}</button>`;
}
function nf84PayChip(r, g){
  // a customer's bill that is still open: the pay link sits right on the order, one tap
  if(!g.sell || !r.o || !r.o.invoice || r.turn === 'done' || !/collect|paid|pay|bill/i.test((r.step || '') + ' ' + (r.todo || '') + ' ' + (r.amtL || ''))) return '';
  const esc = s => String(s).replace(/'/g, "\\'");
  return `<button type="button" class="nf84-pl" onclick="event.stopPropagation(); nf84PayLink('${g.pid}', '${esc(g.who)}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/></svg>Pay link</button>`;
}
function nf84Row(r, g, one){
  return `<div class="nf84-row b-${r.band}${one ? ' one' : ''}" role="button" tabindex="0" onclick="nfoOpen('${r.id}')" onkeydown="if(event.key==='Enter')nfoOpen('${r.id}')"><i class="nfo-po" style="display:none !important"></i>
    ${nfoTile(r)}
    <div class="m">${one ? `<div class="nm"><b>${nfoE(g.who)}</b>${nfoSideTag(g.sell)}</div>` : ''}
      <div class="o"><span class="n">${nfoE(r.o.poNumber || '')}</span><span class="it">${nfoE(r.items)}</span></div>
      <div class="s"><span class="nfo-step t-${r.turn}"><i></i>${nfoE(r.step)}</span><span class="when ${r.tone}">${nfoE(r.when)}</span> <span class="td">${nfoE(r.todo)}</span></div>
      ${one ? nf84PriorPill(g) : ''}</div>
    <div class="a"><b>${nfoPeso(r.amt)}</b><span>${nfoE(r.amtL)}</span></div>
    <div class="x">${nf84PayChip(r, g)}${nf84Act(r, g)}${one ? nf84Menu(g, r) : ''}</div></div>`;
}
nfoGroupHtml = function(g){
  if(g.os.length === 1) return `<div class="nfo-pc nf84-pc one">${nf84Row(g.os[0], g, true)}</div>`;
  const p = nfoPerson(g.sell, g.pid, g.who);
  return `<div class="nfo-pc nf84-pc"><div class="nf84-hd"><div class="nfo-a">${nfoAv(g.who)}</div>
      <div class="hm"><div class="nm"><b>${nfoE(g.who)}</b>${nfoSideTag(g.sell)}</div><div class="fx">${nfoFacts(p, g.sell)}</div>${nf84PriorPill(g)}</div>${nf84Menu(g)}</div>
    <div class="nf84-ls">${g.os.map(r => nf84Row(r, g, false)).join('')}</div></div>`;
}; window.nfoGroupHtml = nfoGroupHtml;

/* ---------- 2. Demo: a real month of spending (5–6 kinds), so "Where the money went" looks like a real shop ---------- */
try{ if(typeof nfDemoBooks === 'function' && !nfDemoBooks._nf84){ const o = nfDemoBooks; nfDemoBooks = function(){ const r = o.apply(this, arguments); try{ nf84DemoExp(); }catch(e){} return r; }; nfDemoBooks._nf84 = 1; window.nfDemoBooks = nfDemoBooks; } }catch(e){}
function nf84DemoExp(){
  if(typeof myBusiness !== 'undefined' && myBusiness) return; if(!BK || !Array.isArray(BK.expenses) || BK._nf84) return; BK._nf84 = true;
  const m = bkMonth(APP_TODAY), have = new Set(BK.expenses.filter(e => !e.deletedAt && bkMonth(e.date) === m && (e.status || 'approved') === 'approved').map(e => e.category));
  const add = (n, category, amount, paidFrom, vendor, extra) => { if(have.has(category)) return; const date = addDaysIso(APP_TODAY, -Math.min(n, Number(String(APP_TODAY).slice(8, 10)) - 1)); BK.expenses.push(Object.assign({id: bkUid(), date, category, amount, paidFrom, vendor, note: '', staff: '', repeat: false, by: 'Dela Cruz', at: date + 'T17:00:00'}, extra || {})); have.add(category); };
  add(4, 'Water', 820, 'gcash', 'Maynilad', {repeat: true});
  add(6, 'Internet & phone', 1299, 'bank', 'PLDT', {repeat: true});
  add(5, 'Supplies', 640, 'cash', 'National Book Store');
  add(9, 'Repairs', 1500, 'cash', 'Mang Ben welding', {note: 'shop door'});
}

/* ---------- 3. Pay link inside the order: any open customer bill shows "Send pay link · Show QR" right in the order popup ---------- */
try{ if(typeof nffHtml === 'function' && !nffHtml._nf84){ const o84 = nffHtml; nffHtml = function(o, sell){ let h = o84.apply(this, arguments);
  try{ if(sell && o && o.invoice && nffSpec(o, sell).turn !== 'done' && !o.cancelled){
    const who = o.buyerName || 'your customer', first = nffFirst(who), esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const card = `<div class="nf84-paycard"><span class="ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/></svg></span><div class="t"><b>Get paid faster: send ${nf84E(first)} a pay link</b><span>They open it on their phone, see this bill and pay you by GCash or bank. No app needed.</span></div><button type="button" class="nf84-pcb" onclick="nf84PayLink('${o.buyerId}', '${esc(who)}')">Send pay link or QR</button></div>`;
    h = h.replace(/<\/div>(\s*)<div class="nff-pane nff-inline">/, () => card + '</div>\n<div class="nff-pane nff-inline">');
  } }catch(e){ console.warn('nf84 pay card', e); }
  try{ const m = h.match(/<div class="nff-sec">([\s\S]*?)<\/div>/); if(m && (m[1].match(/<button/g) || []).length >= 3) h = h.replace(m[0], `<details class="nf84-more"><summary>Change something first</summary>${m[0]}</details>`); }catch(e){}
  return h; }; nffHtml._nf84 = 1; window.nffHtml = nffHtml; } }catch(e){}

/* ---------- 4. Messages: fix a contact tagged as the wrong kind (customer ⇄ supplier) ---------- */
function nf84KindOf(id){ if((supplierConversations || []).some(c => c.id === id) || (buyersData || []).some(b => b.id === id)) return 'customer'; if((buyerConversations || []).some(c => c.id === id) || (suppliersData || []).some(s => s.id === id)) return 'supplier'; return null; }
function nf84KindChip(){
  const info = document.getElementById('threadHeadInfo'); if(!info || !document.querySelector('#page-messages.active')) return; const head = info.parentElement;
  const id = typeof activeConvId !== 'undefined' ? activeConvId : null; const kind = id ? nf84KindOf(id) : null;
  let chip = head.querySelector('.nf84-kind'); if(!kind){ if(chip) chip.remove(); return; }
  if(chip && chip.dataset.k === id + kind) return; if(chip) chip.remove();
  info.insertAdjacentHTML('afterend', `<button type="button" class="nf84-kind ${kind === 'customer' ? 'c' : 's'}" data-k="${id + kind}" onclick="nf84KindOpen('${id}')" title="Wrong? Change it"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${kind === 'customer' ? '<path d="M7 17 17 7M8 7h9v9"/>' : '<path d="M17 7 7 17M16 17H7V8"/>'}</svg><b>${kind === 'customer' ? 'Customer' : 'Supplier'}</b><span aria-label="Change"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></span></button>`);
}
NF45_AFTER.push(() => { try{ nf84KindChip(); }catch(e){} });
setInterval(() => { try{ nf84KindChip(); }catch(e){} }, 1200);
function nf84KindOpen(id){
  const kind = nf84KindOf(id), conv = [...(supplierConversations || []), ...(buyerConversations || [])].find(c => c.id === id), name = (conv && conv.name) || 'This contact';
  const opt = (k, t, s) => `<button type="button" class="nf84-ko${kind === k ? ' on' : ''}" ${kind === k ? 'disabled' : `onclick="nf84KindSet('${id}', '${k}')"`}><b>${t}</b><span>${s}</span>${kind === k ? '<em>Now</em>' : ''}</button>`;
  slModal('nf84Kind', `<div class="sl-sheet-h"><b>What is ${nf84E(name)} to you?</b><button class="sl-x" onclick="slClose('nf84Kind')" aria-label="Close">✕</button></div>
    <div class="nf84-kinds">${opt('customer', 'Customer', 'They buy from you. Their orders, bills and utang show under Selling.')}${opt('supplier', 'Supplier', 'You buy from them. Their bills show under Buying.')}</div>
    <p class="nf84-kn">Your chat history stays. If they already have orders as the other kind, they become both.</p>`);
}
async function nf84KindSet(id, as){
  const conv = [...(supplierConversations || []), ...(buyerConversations || [])].find(c => c.id === id), name = (conv && conv.name) || 'This contact', was = nf84KindOf(id);
  const moveLocal = () => { const from = as === 'customer' ? buyerConversations : supplierConversations, to = as === 'customer' ? supplierConversations : buyerConversations;
    const i = from.findIndex(c => c.id === id); if(i >= 0){ const [c] = from.splice(i, 1); if(!to.some(x => x.id === id)) to.push(c); }
    const fromL = as === 'customer' ? suppliersData : buyersData, toL = as === 'customer' ? buyersData : suppliersData;
    const j = fromL.findIndex(s => s.id === id); if(j >= 0){ const [s] = fromL.splice(j, 1); if(!toL.some(x => x.id === id)) toL.push(s); } };
  let res = 'moved';
  if(typeof myBusiness !== 'undefined' && myBusiness){
    try{ const { data, error } = await sb.rpc('reclassify_contact', {p_other: id, p_as: as}); if(error) throw error; res = data || 'moved'; }
    catch(e){ showToast(String((e && e.message) || "Couldn't change it. Check your internet."), 'warn'); return; }
    if(res === 'moved') moveLocal();
    try{ if(typeof loadMyConnections === 'function') await loadMyConnections(); }catch(e){}
  } else moveLocal();
  slClose('nf84Kind');
  try{ if(as === 'customer'){ currentAppRole = 'supplier'; } else { currentAppRole = 'buyer'; } activeConvId = id; renderConversationList(); selectConversation(id); }catch(e){}
  try{ document.querySelector('.nf84-kind') && document.querySelector('.nf84-kind').remove(); nf84KindChip(); }catch(e){}
  const msg = res === 'both' ? `${name} already has orders as your ${was}, so they're now both a customer and a supplier.` : res === 'already' ? `${name} is already your ${as}.` : `${name} is now your ${as}.`;
  if(res === 'moved' && !(typeof myBusiness !== 'undefined' && myBusiness)) nf84Undo(msg, () => nf84KindSet(id, was)); else showToast(msg, 'success');
}

/* ---------- Undo toast: every quick action can be taken back for a few seconds ---------- */
function nf84Undo(text, undo, secs, label){
  let t = document.getElementById('nf84Toast'); if(t) t.remove();
  t = document.createElement('div'); t.id = 'nf84Toast'; t.setAttribute('role', 'status');
  t.innerHTML = `<span class="ok"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span><span class="tx"></span>${undo ? `<button type="button" class="un">${label || 'Undo'}</button>` : ''}<button type="button" class="cl" aria-label="Close">✕</button>`;
  t.querySelector('.tx').textContent = text; document.body.appendChild(t);
  const close = () => { t.classList.add('out'); setTimeout(() => t.remove(), 250); };
  if(undo) t.querySelector('.un').onclick = () => { close(); try{ undo(); }catch(e){ console.warn(e); } };
  t.querySelector('.cl').onclick = close; setTimeout(() => { if(t.isConnected) close(); }, (secs || 8) * 1000);
}

/* ---------- 5. Nothing black: any black-filled chip, tab, pill or selected button becomes light green ---------- */
function nf84IsBlack(c){ const m = String(c).match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?/); if(!m) return false; if(m[4] !== undefined && Number(m[4]) < .5) return false; const [r, g, b] = [m[1], m[2], m[3]].map(Number); return r < 56 && g < 56 && b < 64 && Math.abs(r - g) < 22 && Math.abs(g - b) < 26; }
function nf84NoBlack(root){
  (root || document).querySelectorAll('button, [role=tab], [role=radio], [role=button], label, a, .on, .active, .sel, .selected, [aria-pressed=true], [aria-selected=true], [class*=pill], [class*=chip], [class*=seg], [class*=tab], span[class], i[class], b[class], em[class]').forEach(e => {
    if(e.classList.contains('nf84-nb') || e.closest('#bottomNav, .notif-toast')) return;
    const r = e.getBoundingClientRect(); if(r.width < 8 || r.height < 8) return;
    if(nf84IsBlack(getComputedStyle(e).backgroundColor)){ e.classList.add('nf84-nb'); e.classList.remove('nf83-lt'); e.querySelectorAll('.nf83-lt').forEach(x => x.classList.remove('nf83-lt')); }
  });
}
let nf84NbT = null;
function nf84NbSoon(){ clearTimeout(nf84NbT); nf84NbT = setTimeout(() => { try{ const scope = [document.querySelector('#view-app .app-page.active'), ...document.querySelectorAll('.sl-modal, .sl-ov, .modal-overlay.active, .modal.active, [role=dialog], #orderDetailModal, .nff, #mhSheet, .more-sheet')].filter(Boolean); scope.forEach(s => nf84NoBlack(s)); }catch(e){} }, 250); }
try{ new MutationObserver(nf84NbSoon).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected', 'aria-pressed']}); }catch(e){}
NF45_AFTER.push(nf84NbSoon);
/* Bank & deposits: "bank" written as a name, "Bank" */
NF45_AFTER.push(() => { try{ document.querySelectorAll('#page-collections .sl-row .sl-s').forEach(s => { if(/(^|·\s)bank(\s·|$)/.test(s.textContent)) s.textContent = s.textContent.replace(/(^|·\s)bank(\s·|$)/g, '$1Bank$2'); }); }catch(e){} });

/* ---------- 6. Home "Act today": Cash short and Missing & bad stock open a clear popup in the middle, with what happened and what to do ---------- */
function nf84WhyKey(){ return 'nifti-why:' + ((typeof myBusiness !== 'undefined' && myBusiness && myBusiness.id) || 'demo'); }
function nf84Why(){ try{ return JSON.parse(localStorage.getItem(nf84WhyKey()) || '{}'); }catch(e){ return {}; } }
function nf84WhySet(k, v){ const w = nf84Why(); if(v) w[k] = {why: v, at: new Date().toISOString(), by: typeof bkMe === 'function' ? bkMe() : ''}; else delete w[k]; try{ localStorage.setItem(nf84WhyKey(), JSON.stringify(w)); }catch(e){} }
const NF84_DAYFMT = d => { try{ return new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'}); }catch(e){ return d; } };
const NF84_CASH_WHY = ['Counted wrong, the cash is there', 'Paid an expense from the drawer', 'Gave the wrong change', 'A sale was recorded twice', 'Cash is missing'];
const NF84_STOCK_WHY = ['Counted wrong, it is there', 'Sold but not recorded', 'Damaged or expired', 'Used in the shop', 'Lost or stolen'];
function nf84CashOpen(){
  const m = bkMonth(APP_TODAY), c = bkCashSummary(m), why = nf84Why();
  const rows = c.list.filter(x => x.difference < 0).sort((a, b) => String(b.day).localeCompare(String(a.day)));
  const done = rows.filter(r => why['cash:' + r.id]).length;
  const row = r => { const k = 'cash:' + r.id, w = why[k], exp = Number((r.expected || {}).cash) || 0, got = Number((r.counted || {}).cash) || 0;
    return `<div class="nf84-fx${w ? ' ok' : ''}" data-k="${k}"><div class="top"><div class="w"><b>${nf84E(NF84_DAYFMT(r.day))}</b><span>Counted by ${nf84E(r.by || 'staff')}${r.note ? ' · “' + nf84E(r.note) + '”' : ''}</span></div><div class="n"><b class="neg">${bkPeso(-r.difference)} short</b><span>Should be ${bkPeso(exp)} · counted ${bkPeso(got)}</span></div></div>
      ${w ? `<div class="done"><span>✓ ${nf84E(w.why)}</span><button type="button" onclick="nf84WhySet('${k}'); nf84CashOpen()">Change</button></div>`
        : `<div class="ask">What happened?</div><div class="why">${NF84_CASH_WHY.map(t => `<button type="button" onclick="nf84CashWhy('${k}', ${JSON.stringify(t).replace(/"/g, '&quot;')}, ${-r.difference}, '${r.day}')">${nf84E(t)}</button>`).join('')}</div>`}</div>`; };
  nf45Pop('nf84Cash', `Cash short this month: ${bkPeso(c.short)}`, `<div class="nf84-fxw">
      <p class="lead">On these days the drawer had less cash than your sales said. Go through each day: ask who counted, then pick what happened. ${rows.length ? `<b>${done} of ${rows.length} explained.</b>` : ''}</p>
      ${rows.length ? rows.map(row).join('') : '<div class="nf84-fxe">No short days this month. 🎉</div>'}</div>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf84Cash')">Close</button><button type="button" class="btn btn-primary" onclick="slClose('nf84Cash'); nf84CountCash()">Count today's cash</button>`, {wide: true});
}
function nf84CashWhy(k, why, amt, day){
  nf84WhySet(k, why); nf84CashOpen();
  if(/expense from the drawer/i.test(why)){ setTimeout(() => { try{ slClose('nf84Cash'); openExpenseForm(); EXF.amount = String(amt); EXF.paidFrom = 'cash'; EXF.date = day; exRender(); }catch(e){} }, 150); nf84Undo('Saved. Add the expense so the drawer matches next time.', () => { nf84WhySet(k); }); return; }
  nf84Undo('Saved: ' + why + '.', () => { nf84WhySet(k); if(document.querySelector('#nf84Cash')) nf84CashOpen(); });
}
function nf84StockOpen(){
  const m = bkMonth(APP_TODAY), why = nf84Why();
  const mv = (BK.moves || []).filter(x => bkMonth(x.date) === m && ((x.kind === 'count' && x.qty < 0) || x.kind === 'bad')).sort((a, b) => String(b.at || b.date).localeCompare(String(a.at || a.date)));
  const cost = x => ((x.unitCost != null ? x.unitCost : bkItemCost(x.item)) || 0) * Math.abs(Number(x.qty) || 0);
  const miss = mv.filter(x => x.kind === 'count').reduce((a, x) => a + cost(x), 0), bad = mv.filter(x => x.kind === 'bad').reduce((a, x) => a + cost(x), 0);
  const done = mv.filter(x => why['stock:' + x.id]).length;
  const sku = n => { const i = (inventoryData || []).find(z => z.name === n); return i ? (i.code || '') : ''; };
  const unit = n => { const i = (inventoryData || []).find(z => z.name === n); return i && i.unit ? ' ' + i.unit : ''; };
  const row = x => { const k = 'stock:' + x.id, w = why[k], isBad = x.kind === 'bad', q = Math.abs(Number(x.qty) || 0);
    return `<div class="nf84-fx${w || isBad ? ' ok' : ''}"><div class="top"><div class="w"><b>${nf84E(x.item)}</b><span>${sku(x.item) ? nf84E(sku(x.item)) + ' · ' : ''}${nf84E(NF84_DAYFMT(x.date))} · ${isBad ? 'written off' : 'counted'} by ${nf84E(x.by || 'staff')}</span>${x.reason ? `<span class="rs">“${nf84E(String(x.reason).replace(/^Spot count: /, 'Count: '))}”</span>` : ''}</div>
      <div class="n"><b class="${isBad ? 'amb' : 'neg'}">${q}${nf84E(unit(x.item))} ${isBad ? 'bad' : 'missing'}</b><span>worth ${bkPeso(cost(x))}</span></div></div>
      ${isBad ? `<div class="done amb"><span>Written off as damaged or expired. Nothing to fix.</span></div>`
        : w ? `<div class="done"><span>✓ ${nf84E(w.why)}</span><button type="button" onclick="nf84WhySet('${k}'); nf84StockOpen()">Change</button></div>`
        : `<div class="ask">Step 1 · Count it again <button type="button" class="nf84-rc" onclick="slClose('nf84Stock'); nf75Recount('stock:${x.id}')">Recount ${nf84E(x.item)}</button></div><div class="ask">Step 2 · Still missing? Pick what happened</div><div class="why">${NF84_STOCK_WHY.map(t => `<button type="button" onclick="nf84StockWhy('${k}', ${JSON.stringify(t).replace(/"/g, '&quot;')})">${nf84E(t)}</button>`).join('')}</div>`}</div>`; };
  nf45Pop('nf84Stock', `Missing & bad stock this month: ${bkPeso(miss + bad)}`, `<div class="nf84-fxw">
      <div class="nf84-sum"><span><small>Missing in counts</small><b class="neg">${bkPeso(miss)}</b></span><span><small>Damaged or expired</small><b class="amb">${bkPeso(bad)}</b></span><span><small>Explained</small><b>${done} of ${mv.filter(x => x.kind === 'count').length}</b></span></div>
      <p class="lead"><b>Missing</b> means a count found fewer than Nifti expected. For each item: count it again, and if it's really gone, pick what happened. Nifti keeps the reason so you can spot a pattern.</p>
      ${mv.length ? mv.map(row).join('') : '<div class="nf84-fxe">Nothing missing or damaged this month.</div>'}</div>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf84Stock')">Close</button><button type="button" class="btn btn-primary" onclick="slClose('nf84Stock'); go('inventory')">Open Stock</button>`, {wide: true});
}
function nf84StockWhy(k, why){ nf84WhySet(k, why); nf84StockOpen(); nf84Undo('Saved: ' + why + '.', () => { nf84WhySet(k); if(document.querySelector('#nf84Stock')) nf84StockOpen(); }); }
try{ if(typeof bkFlags === 'function' && !bkFlags._nf84){ const o = bkFlags; bkFlags = function(){ const r = o.apply(this, arguments); try{ r.forEach(f => { if(f.k === 'cash' && /short/.test(f.v)) f.a = 'nf84CashOpen()'; if(f.k === 'stock' && f.a && /openStockSheet/.test(f.a)) f.a = 'nf84StockOpen()'; }); }catch(e){} return r; }; bkFlags._nf84 = 1; window.bkFlags = bkFlags; } }catch(e){}
function nf84CountCash(){ try{ if(typeof ccStart === 'function') ccStart(APP_TODAY); }catch(e){} go('cashcount'); setTimeout(() => { const f = document.querySelector('.cc-form'); if(f) f.scrollIntoView({behavior: 'smooth', block: 'center'}); }, 500); }

/* ---------- 7. Home "What to do": a task you finish moves to "Done today" (with See it), it never just vanishes ---------- */
function nf84WK(n){ return 'nifti-wtd-' + n + ':' + ((typeof myBusiness !== 'undefined' && myBusiness && myBusiness.id) || 'demo') + ':' + APP_TODAY; }
function nf84WGet(n){ try{ return JSON.parse(localStorage.getItem(nf84WK(n)) || '[]'); }catch(e){ return []; } }
function nf84WPut(n, v){ try{ localStorage.setItem(nf84WK(n), JSON.stringify(v.slice(-20))); }catch(e){} }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#mhHome .lanes .task .btn'); if(!b || b.closest('.nf84-dn')) return; const t = b.closest('.task'); const it = {h: (t.querySelector('h5') || {}).textContent || '', p: (t.querySelector('p') || {}).textContent || '', on: b.getAttribute('onclick') || '', at: Date.now()}; const l = nf84WGet('clicked').filter(x => x.on !== it.on); l.push(it); nf84WPut('clicked', l); }, true);
function nf84WtdSync(){
  const lanes = document.querySelector('#mhHome .lanes'); if(!lanes) return;
  const now = [...lanes.querySelectorAll('.task:not(.nf84-dn)')].map(t => ({h: (t.querySelector('h5') || {}).textContent || '', on: ((t.querySelector('.btn') || {}).getAttribute ? t.querySelector('.btn').getAttribute('onclick') : '') || ''}));
  let clicked = nf84WGet('clicked'), done = nf84WGet('done'); const fresh = [];
  clicked = clicked.filter(c => { const still = now.some(n => (c.on && n.on === c.on) || n.h === c.h); if(still) return Date.now() - c.at < 6 * 3600e3; if(!done.some(d => d.on === c.on && d.h === c.h)){ done.push(Object.assign({}, c, {doneAt: Date.now()})); fresh.push(c); } return false; });
  nf84WPut('clicked', clicked); nf84WPut('done', done);
  const last = lanes.querySelector('.lane:last-child'); if(!last) return;
  let box = last.querySelector('.nf84-dbox'); const key = done.map(d => d.h).join('|');
  if(box && box.dataset.k === key) return; if(box) box.remove(); if(!done.length) return;
  box = document.createElement('div'); box.className = 'nf84-dbox'; box.dataset.k = key;
  box.innerHTML = `<div class="dh">✓ Done today <span>${done.length}</span></div>` + done.slice().reverse().map((d, i) => `<div class="task nf84-dn"><div><h5>${nf84E(d.h)}</h5><p>${nf84E(d.p)}</p></div><button class="btn" type="button" data-i="${done.length - 1 - i}">See it</button></div>`).join('');
  box.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { const d = done[Number(b.dataset.i)]; try{ (0, eval)(d.on); }catch(e){ showToast("Couldn't open it.", 'warn'); } });
  last.appendChild(box);
  if(fresh.length) nf84Undo(`Done: ${fresh[0].h}. It's under "Done today" if you want to check it.`, () => { const b = box.querySelector('button[data-i]'); if(b) b.click(); }, 8, 'See it');
}
NF45_AFTER.push(() => { try{ nf84WtdSync(); }catch(e){} });
setInterval(() => { try{ if(document.querySelector('#page-dashboard.active')) nf84WtdSync(); }catch(e){} }, 1500);

/* ---------- 8. Plans: "Soon:" lines get a purple Soon tag ---------- */
try{ if(typeof nf75Feat === 'function' && !nf75Feat._nf84){ const o = nf75Feat; nf75Feat = function(f){ const m = String(f).match(/^([a-z]+)\|Soon: (.*)$/); if(m) return `<li class="nf84-soon"><i class="nf75-fi">${nf75Ic(NF75_FI.history || NF75_FI.star, 20)}</i><span><em class="soon">Soon</em>${m[2]}</span></li>`; return o.apply(this, arguments); }; nf75Feat._nf84 = 1; window.nf75Feat = nf75Feat; } }catch(e){}
