/* ===== Round 86 ===== */
function nf86E(s){ return escapeHtml(String(s == null ? '' : s)); }
function nf86Demo(){ return !(typeof myBusiness !== 'undefined' && myBusiness); }
/* ---------- Who owes you: Home = 3 tiles in a row + one person per tier side by side; Getting paid = cards (3 examples in the demo) ---------- */
function nf86MiniCard(g, tier){
  const sk = nf85Suki(g), kind = g.src === 'ut' ? 'Shop utang' : 'Delivery order';
  return `<article class="nf86-mc ${g.bucket}"><div class="t"><span class="av">${nf86E(nf82Initials(g.name))}</span><div class="n"><b>${nf86E(g.name)}</b><span>${nf83Status(g)}</span></div></div>
    <div class="m"><b>${nf85P(g.total)}</b><span>${kind}${g.items.length > 1 ? ' · ' + g.items.length + ' bills' : ''}</span><span class="suki ${sk.tier}" title="${nf86E(sk.why)}">Suki ${sk.score}${sk.limit ? ' · limit ' + nf85P(sk.limit) : ' · cash only'}</span></div>
    <div class="a">${nf83Main(g)}<div class="r"><button type="button" onclick="nf82Remind('${g.id}')" title="Send pay link">${nf85Ic(NF85I.chat, 15)}Pay link</button><button type="button" onclick="nf83Qr('${g.id}')" title="Show QR to scan">${nf85Ic(NF85I.qr, 15)}QR</button><button type="button" onclick="NF82G.open['${g.id}']=true; NF82G.f='all'; go('collections')" title="See details">Details</button></div></div></article>`;
}
function nf86HomeWho(){
  const rows = nf83Rows(), sum = b => rows.filter(g => b === 'all' || g.bucket === b), tot = b => sum(b).reduce((a, g) => a + g.total, 0);
  let po = 0, ut = 0, nPo = 0, nUt = 0; rows.forEach(g => { if(g.src === 'po'){ po += g.total; nPo++; } else { ut += g.total; nUt++; } });
  const tile = (cls, ic, l, amt, n) => `<div class="tl ${cls}"><span class="i">${nf85Ic(ic, 18)}</span><div><small>${l}</small><b>${nf85P(amt)}</b><em>${n} ${n === 1 ? 'person' : 'people'}</em></div></div>`;
  const col = (k, l, cls) => { const list = sum(k), n = list.length; return `<div class="col ${cls}"><button type="button" class="ch" onclick="NF82G.f='${k}'; go('collections')"><span>${l}</span><b>${nf85P(tot(k))}</b><em>${n} ${n === 1 ? 'person' : 'people'} ›</em></button>${list[0] ? nf86MiniCard(list[0]) : `<p class="em">Nobody here.</p>`}</div>`; };
  return `<section class="panel-card nf83-who nf86-who" aria-labelledby="nf86WhoH"><div class="hd"><h2 id="nf86WhoH">Who owes you</h2><div class="ha"><button type="button" class="nf82-btn s" onclick="nf83BringOpen('utang')">${nf85Ic(NF85I.plus, 15)}Someone owes me</button><button type="button" class="nf82-btn s" onclick="NF82G.f='all'; go('collections')">See all ${rows.length} ›</button></div></div>
    <div class="tls3">${tile('t', NF85I.peso, 'Total owed to you', tot('all'), rows.length)}${tile('u', NF85I.shop, 'Shop utang', ut, nUt)}${tile('d', NF85I.truck, 'Delivery orders', po, nPo)}</div>
    ${rows.length ? `<div class="cols">${col('late', 'Late', 'r')}${col('soon', 'Due in 7 days', 'a')}${col('later', 'Not due yet', 'g')}</div>` : `<div class="em">Nobody owes you right now.</div>`}</section>`;
}
(function(){ const base = nf83WhoHtml; nf83WhoHtml = function(where){
  if(where === 'home') return nf86HomeWho();
  let html = base.apply(this, arguments);
  if(nf86Demo() && !NF86.gpAll){ // demo: one example per tier, the rest behind "See all"
    try{ const rows = nf83Rows(), f = NF82G.f || 'all'; if(f === 'all' && rows.length > 3){ const pick = ['late', 'soon', 'later'].map(b => rows.find(g => g.bucket === b)).filter(Boolean);
      const wrap = document.createElement('div'); wrap.innerHTML = html; const ls = wrap.querySelector('.nf85-ls'); if(ls){ ls.innerHTML = pick.map(nf85Card).join('') + `<button type="button" class="nf86-all" onclick="NF86.gpAll=1; nf82Repaint()">See all ${rows.length} people</button>`; html = wrap.innerHTML; } } }catch(e){}
  }
  return html; }; window.nf83WhoHtml = nf83WhoHtml; try{ nf82CollectHtml = function(where){ return nf83WhoHtml(where); }; }catch(e){} })();
const NF86 = {gpAll: 0};
/* Walk-in sales: no utang section at all (it lives in Getting paid) */
NF45_AFTER.push(() => { try{ document.querySelectorAll('#page-sales .nf85-su, #page-sales .nf80-ut').forEach(e => { e.style.display = 'none'; }); }catch(e){} });
try{ nf85SalesUtang = function(){}; }catch(e){}

/* ---------- Pages never open in a side panel ---------- */
try{ if(typeof NF48K !== 'undefined'){ NF48K.off = true; if(typeof nf48PeekClear === 'function') nf48PeekClear(); } }catch(e){}

/* ---------- Morning briefing v2: round checkboxes, a progress bar, and every task opens a ready-to-do popup ---------- */
function nf86BKey(){ return 'nifti-brief2:' + ((typeof myBusiness !== 'undefined' && myBusiness && myBusiness.id) || 'demo') + ':' + APP_TODAY; }
function nf86BDone(){ try{ return new Set(JSON.parse(localStorage.getItem(nf86BKey()) || '[]')); }catch(e){ return new Set(); } }
function nf86BSet(k, on){ const s = nf86BDone(); if(on === undefined ? !s.has(k) : on) s.add(k); else s.delete(k); try{ localStorage.setItem(nf86BKey(), JSON.stringify([...s])); }catch(e){} nf85BriefPaint(true); }
nf85BriefCard = function(){
  let b; try{ b = nf85Brief(); }catch(e){ console.warn('brief', e); return ''; } window._nf86B = b;
  const hour = new Date().getHours(), hi = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening', done = nf86BDone();
  const n = b.todo.length, d = b.todo.filter(t => done.has(t.k)).length, pct = n ? Math.round(d / n * 100) : 0;
  return `<section class="panel-card nf85-brief nf86-brief" id="nf85Brief"><div class="bh"><span class="sun" aria-hidden="true">${nf85Ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 22)}</span><div><h2>${hi}! Here's your day</h2><p>${nf86E(new Date(APP_TODAY + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'long', month: 'long', day: 'numeric'}))} · made from your own sales, costs, utang and stock</p></div></div>
    <div class="fc"><div class="fh"><span class="ic">${nf85Ic(b.focus.ic, 20)}</span><div><small>Focus for today</small><b>${nf86E(b.focus.t)}</b></div></div><p>${nf86E(b.focus.why)}</p><ol>${b.focus.how.map(h => `<li>${nf86E(h)}</li>`).join('')}</ol>${b.focus.tag === 'collect' ? `<button type="button" class="nf82-btn p" onclick="nf86Task('late')">Start collecting</button>` : `<button type="button" class="nf82-btn p" onclick="${b.focus.btn[1]}">${nf86E(b.focus.btn[0])}</button>`}</div>
    <div class="td"><div class="tdh"><b>Today's list</b><span>${d === n && n ? 'All done. Great work! 🎉' : `${d} of ${n} done`}</span></div><div class="pb"><i style="width:${pct}%"></i></div>
      ${b.todo.map(t => { const ok = done.has(t.k); return `<div class="ti${ok ? ' ok' : ''}"><button type="button" class="ck" role="checkbox" aria-checked="${ok}" aria-label="${ok ? 'Mark not done' : 'Mark done'}" onclick="nf86BSet('${t.k}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></button><div class="tt" onclick="${t.a}"><b>${nf86E(t.t)}</b><small>${nf86E(t.s)}</small></div><button type="button" class="go" onclick="${t.a}">${ok ? 'See again' : nf86E(t.b)}</button></div>`; }).join('')}</div>
    <div class="tip">${nf85Ic('<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>', 18)}<span><b>Tip from Nifti:</b> ${nf86E(b.tip)}</span></div>
  </section>`;
};
function nf86Pop(k, title, guide, body, page){
  nf45Pop('nf86T', title, `<div class="nf86-tp"><div class="gd">${nf85Ic('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', 18)}<span>${guide}</span></div>${body}</div>`,
    `${page ? `<button type="button" class="nf86-pg" onclick="slClose('nf86T'); ${page}">Open the full page ›</button>` : '<span></span>'}<button type="button" class="btn btn-primary" onclick="nf86BSet('${k}', true); slClose('nf86T'); nf84Undo('Done. Nice one!', () => nf86BSet('${k}', false), 6, 'Undo')">${nf85Ic('<path d="M20 6 9 17l-5-5"/>', 16)} Mark as done</button>`);
  const sh = document.querySelector('#nf86T .sl-sheet'); if(sh) sh.classList.add('nf86-sheet');
}
function nf86Empty(t){ return `<div class="nf86-empty">${nf85Ic('<path d="M20 6 9 17l-5-5"/>', 22)}<span>${t}</span></div>`; }
function nf86Task(k){
  const b = window._nf86B || nf85Brief(); const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  if(k === 'cash') return nf84CashOpen();
  if(k === 'count') return nf86Pop(k, 'Count the cash at closing', 'Count every peso in the drawer before you go home. Nifti compares it with today\'s sales and tells you right away if it\'s short.', `<div class="nf86-one"><b>What you need</b><ul><li>The cash drawer</li><li>2 minutes</li></ul><button type="button" class="nf82-btn p" onclick="slClose('nf86T'); nf84CountCash()">Start counting</button></div>`, '');
  if(k === 'orders'){
    let rows = []; try{ rows = nfoAll().filter(r => r.band === 'red'); }catch(e){}
    return nf86Pop(k, `${rows.length} order${rows.length === 1 ? '' : 's'} need you`, 'Each order shows the one thing to do next. Tap its button to finish it here.', rows.length ? `<div class="nf86-ls">${rows.map(r => `<div class="it"><div class="w"><b>${nf86E(r.who)}</b><small>${nf86E(String(r.o.poNumber || '').replace(/^PO-\d{4}-/, 'Order '))} · ${nf86E(r.items)}</small><span class="nx">${nf86E(r.when)} ${nf86E(r.todo)}</span></div><b class="am">${nf85P(r.amt)}</b><button type="button" class="nf82-btn p" onclick="slClose('nf86T'); nfoOpen('${r.id}')">${nf86E(r.btn || 'Open')}</button></div>`).join('')}</div>` : nf86Empty('No orders need you right now.'), "go('orders')");
  }
  if(k === 'due' || k === 'late'){
    const rows = (k === 'due' ? b.dueToday : nf83Rows().filter(g => g.bucket === 'late'));
    const row = g => { const pay = g.src === 'ut' ? nf79RpHtml('uc:' + g.id, Math.max(0, g.total - (g.pending || 0)), {utang: true}) : nf79RpHtml(g.key, Math.max(0, g.total - (g.pending || 0)));
      return `<div class="it nf79-rph"><div class="w"><b>${nf86E(g.name)}</b><small>${g.src === 'ut' ? 'Shop utang' : 'Delivery order'}${g.items.length > 1 ? ' · ' + g.items.length + ' bills' : ''}</small>${nf83Status(g)}</div><b class="am">${nf85P(g.total)}</b>
        <div class="bx"><button type="button" class="nf82-btn p" onclick="nf82Remind('${g.id}')">${nf85Ic(NF85I.chat, 15)}Send reminder + pay link</button><button type="button" class="nf82-btn s" onclick="nf83Qr('${g.id}')">${nf85Ic(NF85I.qr, 15)}QR</button><button type="button" class="nf82-btn s" onclick="nf79RpOpen(this)">${nf85Ic(NF85I.plus, 15)}They paid</button></div>${pay}</div>`; };
    return nf86Pop(k, k === 'due' ? 'Due to pay today' : `Late utang: ${nf85P(rows.reduce((a, g) => a + g.total, 0))}`, k === 'due' ? 'Send each one a friendly reminder with the pay link. If they already paid, tap "They paid" and type the amount.' : 'Start with the biggest amount. Send the reminder with the pay link. If they paid, tap "They paid" and type how much.', rows.length ? `<div class="nf86-ls">${rows.map(row).join('')}</div>` : nf86Empty('Nobody to remind right now.'), "go('collections')");
  }
  if(k === 'deliveries'){
    const routes = (typeof routesCache !== 'undefined' && routesCache) || (typeof demoRoutes !== 'undefined' ? demoRoutes : []), list = [];
    routes.filter(r => r.route_date === APP_TODAY).forEach(r => (r.stops || []).filter(s => s.status === 'pending').forEach(s => list.push({r, s})));
    return nf86Pop(k, `${list.length} deliver${list.length === 1 ? 'y' : 'ies'} today`, 'Make sure each stop has a rider and the items are packed. Move anything that can\'t go out today.', list.length ? `<div class="nf86-ls">${list.map(({r, s}) => `<div class="it"><div class="w"><b>${nf86E(s.buyer_name)}</b><small>${nf86E((s.items || []).slice(0, 2).map(x => (x.qty ? x.qty + ' × ' : '') + x.product).join(', ') || 'Delivery')}</small><span class="nx">Rider: ${nf86E(r.driver_name || 'none yet')}</span></div><span></span><div class="bx"><button type="button" class="nf82-btn s" onclick="slClose('nf86T'); nf85StopMove('${r.id}', '${s.id}')">Change day or rider</button><button type="button" class="nf82-btn p" onclick="slClose('nf86T'); openRouteSheet('${r.id}', '${s.id}', 'done')">Mark delivered</button></div></div>`).join('')}</div>` : nf86Empty('Nothing left to deliver today.'), "go('routes')");
  }
  if(k === 'reorder'){
    const sup = n => (suppliersData || []).find(s => s.name === n);
    return nf86Pop(k, `Reorder ${b.low.length} item${b.low.length === 1 ? '' : 's'}`, 'These are at or below the level where you said to reorder. Tap Order to send your supplier an order with the suggested amount.', b.low.length ? `<div class="nf86-ls">${b.low.map(i => { const s = sup(i.supplier), q = Math.max(1, Math.round((Number(i.maxLevel) || Number(i.rop) * 2) - Number(i.onHand))); return `<div class="it"><div class="w"><b>${nf86E(i.name)}</b><small>${nf86E(i.code || '')}${i.supplier ? ' · ' + nf86E(i.supplier) : ''}</small><span class="nx">${Number(i.onHand)} left · reorder at ${Number(i.rop)} · suggest ${q} ${nf86E(i.unit || '')}</span></div><span></span><div class="bx">${s ? `<button type="button" class="nf82-btn p" onclick="slClose('nf86T'); nfoNew(false, '${s.id}')">Order ${q} from ${nf86E(String(s.name).split(' ')[0])}</button><button type="button" class="nf82-btn s" onclick="slClose('nf86T'); nfoChat('${s.id}', false)">Message</button>` : `<button type="button" class="nf82-btn s" onclick="slClose('nf86T'); go('inventory')">Open in Stock</button>`}</div></div>`; }).join('')}</div>` : nf86Empty('Nothing to reorder today.'), "go('inventory')");
  }
  if(k === 'bills'){
    return nf86Pop(k, 'Supplier bills due soon', 'Pay these before the due date to keep your good name with suppliers. Tap Pay to record it.', b.bills.length ? `<div class="nf86-ls">${b.bills.map(r => `<div class="it"><div class="w"><b>${nf86E(r.po.supplierName || 'Supplier')}</b><small>${nf86E(String(r.po.poNumber || '').replace(/^PO-\d{4}-/, 'Order '))}</small><span class="nx">Due ${nf86E(nf85Day(String(r.due).slice(0, 10)))}</span></div><b class="am">${nf85P(r.balance)}</b><button type="button" class="nf82-btn p" onclick="slClose('nf86T'); nfoOpen('${r.po.id}')">Pay</button></div>`).join('')}</div>` : nf86Empty('No bills due in the next 3 days.'), "go('collections')");
  }
  if(k === 'prices'){
    const sup = n => (suppliersData || []).find(s => s.name === n);
    return nf86Pop(k, 'Supplier prices going up', 'Order before the new price starts and you pay today\'s price.', b.incoming.length ? `<div class="nf86-ls">${b.incoming.map(x => { const s = sup(x.supplier_name); return `<div class="it"><div class="w"><b>${nf86E(x.product)}</b><small>${nf86E(x.supplier_name)}</small><span class="nx">${nf85P(x.old_price)} → ${nf85P(x.new_price)} from ${nf86E(nf85Day(x.effective_date))}</span></div><span></span>${s ? `<button type="button" class="nf82-btn p" onclick="slClose('nf86T'); nfoNew(false, '${s.id}')">Order now</button>` : '<span></span>'}</div>`; }).join('')}</div>` : nf86Empty('No price increases coming.'), "go('prices')");
  }
}

/* ---------- Popups everywhere: light backdrop, soft red ✕, no extra "Close" button, main action easy to see ---------- */
function nf86PopTidy(m){
  if(!m || !m.querySelector) return; const sh = m.querySelector('.sl-sheet') || m; if(!sh.querySelector('.sl-x')) return;
  sh.querySelectorAll('.sl-actions > button, .sl-actions > .btn, .sl-acts > button').forEach(b => { if(/^(Close|Isara)$/i.test(b.textContent.trim())) b.remove(); });
  const acts = sh.querySelector('.sl-actions'); if(acts){ const n = acts.querySelectorAll('button, .btn, a').length; acts.classList.toggle('nf86-one', n === 1); if(!n) acts.remove(); }
}
(function(){ if(typeof slModal !== 'function' || slModal._nf86) return; const base = slModal; const w = function(){ const m = base.apply(this, arguments); try{ nf86PopTidy(m); setTimeout(() => nf86PopTidy(m), 40); }catch(e){} return m; }; Object.assign(w, base); w._nf86 = 1; slModal = w; window.slModal = w; })();

/* Monthly summary: no gross-margin notices */
try{ if(typeof lgInsightCard === 'function' && !lgInsightCard._nf86){ const o = lgInsightCard; lgInsightCard = function(c){ if(c && /margin/i.test(String(c.t || '') + ' ' + String(c.what || ''))) return ''; return o.apply(this, arguments); }; lgInsightCard._nf86 = 1; window.lgInsightCard = lgInsightCard; } }catch(e){}

/* Returns & credits: used credits and problems reported stay open */
NF45_AFTER.push(() => { try{ document.querySelectorAll('#page-returns details').forEach(d => { if(!d.dataset.nf86){ d.dataset.nf86 = 1; d.open = true; } }); }catch(e){} });

/* ---------- Messages: one Send reaches them wherever they are (Nifti + Viber), with a clear "Sends to" switch ---------- */
function nf86OnNifti(conv){ if(!conv || conv._vb) return false; const p = [...(buyersData || []), ...(suppliersData || [])].find(x => x.id === conv.id); return !!p && !p.isOutside; }
try{ if(typeof nf36vRoute === 'function' && !nf36vRoute._nf86){
  const oR = nf36vRoute; nf36vRoute = function(conv, ths){ if(conv && !conv._vb && NF36V.route[conv.id]) return NF36V.route[conv.id]; if(conv && !conv._vb && ths && ths.length && nf86OnNifti(conv)) return 'both'; return oR.apply(this, arguments); }; nf36vRoute._nf86 = 1; window.nf36vRoute = nf36vRoute;
  nf36vBar = function(conv, ths){
    const input = document.getElementById('msgInput'); if(!input) return;
    const host = input.closest('.msg-composer, .thread-composer, .composer, .msg-input-row') || input.parentElement;
    let bar = document.getElementById('nf36vBar');
    if(!conv || !ths || !ths.length){ if(bar) bar.remove(); input.placeholder = 'Message on Nifti'; return; }
    if(!bar){ bar = document.createElement('div'); bar.id = 'nf36vBar'; host.parentElement.insertBefore(bar, host); }
    bar.className = 'nf36v-bar nf86-route';
    const route = nf36vRoute(conv, ths), t = ths[0], live = nf36vLiveDevice(t), onN = nf86OnNifti(conv), ph = nf36vPhoneFor(t, conv);
    const opt = (k, l) => `<button type="button" class="${route === k ? 'on' : ''}" onclick="nf36vSetRoute('${conv.id}','${k}')">${route === k ? '✓ ' : ''}${l}</button>`;
    const say = route === 'both' ? `Each message goes to their <b>Nifti inbox</b> and their <b>Viber</b>${ph ? ' (+' + nf86E(ph) + ')' : ''}. Nothing gets missed.` : route === 'viber' ? (live ? `Goes out on <b>Viber</b> from ${nf86E(nf36vOwnerPhone(t))}, as if you typed it there.` : 'Goes to <b>Viber</b>: Nifti copies it and opens their Viber chat. Paste and send.') : 'Goes to their <b>Nifti inbox</b> only.';
    bar.innerHTML = `<div class="r1"><span class="lb">Sends to</span><span class="sg" role="group" aria-label="Send on">${onN && !conv._vb ? opt('both', 'Nifti + Viber') + opt('nifti', 'Nifti only') + opt('viber', 'Viber only') : `<button type="button" class="on">✓ Viber</button>`}</span><button type="button" class="nf36v-add" onclick="nf36vAddSheet()">+ Add a Viber message</button></div><p>${say}</p>`;
    input.placeholder = route === 'both' ? 'Message on Nifti + Viber' : route === 'viber' ? 'Message on Viber' : 'Message on Nifti';
  }; window.nf36vBar = nf36vBar;
  const curSend = sendMessage;
  const send86 = function(){
    const conv = getActiveConv(); if(!conv) return curSend.apply(this, arguments);
    const ths = nf36vLinkedFor(conv); if(!ths.length || nf36vRoute(conv, ths) !== 'both') return curSend.apply(this, arguments);
    const input = document.getElementById('msgInput'), text = (input.value || '').trim(); const hadFile = !!pendingAttachment;
    const r = curSend.apply(this, arguments); // Nifti inbox
    if(text){ const live = ths.find(x => nf36vLiveDevice(x)) || ths[0]; nf36vSend(live, text, conv); }
    if(hadFile) showToast('The file went to their Nifti inbox. Send it from your phone if they need it on Viber too.');
    return r;
  };
  window.sendMessage = send86; try{ sendMessage = send86; }catch(e){}
} }catch(e){ console.warn('nf86 route', e); }

/* ---------- Getting paid + Bank & deposits = one page (no tabs, no second menu item) ---------- */
let nf86BankBusy = false;
async function nf86BankMerge(){
  const pg = document.querySelector('#page-collections.active'); if(!pg || currentAppRole === 'buyer' || typeof colRenderCash !== 'function') return;
  if(typeof colTab !== 'undefined' && colTab !== 'follow'){ colTab = 'follow'; try{ renderCollectionsPage(); }catch(e){} return; }
  const host = document.getElementById('collectionsContent'); if(!host || !document.getElementById('colBody')) return;
  host.querySelectorAll(':scope > .adm-tabs').forEach(t => t.style.display = 'none');
  if(host.querySelector('.nf86-bank') || nf86BankBusy) return; nf86BankBusy = true;
  try{
    const sec = document.createElement('section'); sec.className = 'nf86-bank';
    sec.innerHTML = `<div class="nf86-bh"><span class="ic">${nf85Ic('<path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>', 20)}</span><div><h2>Cash, bank &amp; deposits</h2><p>Who is holding cash, what went to the bank, and every payment in the last 30 days.</p></div></div><div class="nf86-bb"></div>`;
    const set = host.querySelector('.nf82-set'); if(set) set.before(sec); else host.appendChild(sec);
    await colRenderCash(sec.querySelector('.nf86-bb'));
    const note = [...sec.querySelectorAll('div, p')].find(e => e.children.length === 0 && /^Nifti doesn't connect to your bank/.test(e.textContent.trim()));
    if(note && typeof nf45BankMatch === 'function'){ const bar = document.createElement('div'); bar.className = 'nf45-bankbar'; bar.innerHTML = `<div><b>Is the money really in the bank?</b><span>Upload the statement your bank or GCash gives you and Nifti ticks off every payment it finds.</span></div><button type="button" class="btn btn-primary" onclick="nf45BankMatch()">Match my bank statement</button>`; note.replaceWith(bar); }
  }catch(e){ console.warn('nf86 bank', e); } finally { nf86BankBusy = false; }
}
NF45_AFTER.push(() => { try{ nf86BankMerge(); }catch(e){} });
setInterval(() => { try{ if(document.querySelector('#page-collections.active') && !document.querySelector('#collectionsContent .nf86-bank')) nf86BankMerge(); }catch(e){} }, 1200);
function nf86HideBankNav(){ document.querySelectorAll('#view-app .sidebar [data-page="bank-deposits"], #nf26BankNav').forEach(n => { n.style.display = 'none'; }); }
NF45_AFTER.push(() => { try{ nf86HideBankNav(); }catch(e){} }); setTimeout(nf86HideBankNav, 1500);

/* ---------- Prices step 2: two plain date fields that always work, quick picks under them, one sentence that says what happens ---------- */
nf75PcWhen = function(){
  const box = document.getElementById('nf75PcWhen'); if(!box) return; const d = NF75PC.date || APP_TODAY, sale = NF75PC.endMode === 'until';
  if(sale && (!NF75PC.endDate || NF75PC.endDate <= d)) NF75PC.endDate = addDaysIso(d, 7);
  const end = sale ? NF75PC.endDate : null; NF75PC.endPreset = 'date';
  const ch = nf75PcChanges(), ex = ch[0] || null, eom = (() => { const x = new Date(d + 'T00:00:00'); return new Date(x.getFullYear(), x.getMonth() + 1, 0).toLocaleDateString('en-CA'); })();
  const q = (on, l, js) => `<button type="button" class="${on ? 'on' : ''}" onclick="${js}; nf75PcWhen(); nf75PcLive()">${l}</button>`;
  const days = daysBetween(APP_TODAY, d);
  box.innerHTML = `<div class="nf86-when">
    <div class="fld"><label for="nf86Start">New price starts on</label><input id="nf86Start" type="date" min="${APP_TODAY}" value="${d}" onchange="if(this.value){ NF75PC.preset='date'; NF75PC.date=this.value; nf75PcWhen(); nf75PcLive(); }">
      <div class="qk">${q(d === APP_TODAY, 'Today', `NF75PC.date='${APP_TODAY}'`)}${q(d === addDaysIso(APP_TODAY, 1), 'Tomorrow', `NF75PC.date='${addDaysIso(APP_TODAY, 1)}'`)}${q(d === addDaysIso(APP_TODAY, 7), 'In a week', `NF75PC.date='${addDaysIso(APP_TODAY, 7)}'`)}</div></div>
    <label class="sw"><input type="checkbox" ${sale ? 'checked' : ''} onchange="NF75PC.endMode=this.checked?'until':'stay'; nf75PcWhen(); nf75PcLive()"><span class="tg"></span><span><b>It's a sale or promo</b><small>The price goes back to normal on a date you pick</small></span></label>
    ${sale ? `<div class="fld"><label for="nf86End">Back to the usual price on</label><input id="nf86End" type="date" min="${addDaysIso(d, 1)}" value="${end}" onchange="if(this.value){ NF75PC.endDate=this.value; nf75PcWhen(); nf75PcLive(); }">
      <div class="qk">${q(end === addDaysIso(d, 7), 'After 1 week', `NF75PC.endDate='${addDaysIso(d, 7)}'`)}${q(end === addDaysIso(d, 14), 'After 2 weeks', `NF75PC.endDate='${addDaysIso(d, 14)}'`)}${eom > d ? q(end === eom, 'End of the month', `NF75PC.endDate='${eom}'`) : ''}</div></div>` : ''}
    <div class="say">${nf85Ic('<path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>', 18)}<span>${ex ? `Buyers pay <b>${nf85P(ex.v)}</b> instead of ${nf85P(ex.c.price)}` : 'The new price applies'} <b>${d <= APP_TODAY ? 'from today' : 'from ' + nf85Day(d)}</b>${end ? ` until <b>${nf85Day(addDaysIso(end, -1))}</b>, then ${ex ? nf85P(ex.c.price) : 'the usual price'} again` : ''}. ${days > 0 ? `They get ${days} day${days === 1 ? '' : 's'} notice; orders sent before then keep today's price.` : 'No notice: fine for a price drop, but a price increase can surprise buyers.'}</span></div>
  </div>`;
};
window.nf75PcWhen = nf75PcWhen;
nf85EndDate = function(){ if(NF75PC.endMode !== 'until') return null; const d = NF75PC.date || APP_TODAY; return NF75PC.endDate && NF75PC.endDate > d ? NF75PC.endDate : addDaysIso(d, 7); };

/* Demo: at most 3 red alerts, so lists and the menu badge show 3 examples */
try{ if(typeof bkFlags === 'function' && !bkFlags._nf86){ const o = bkFlags; bkFlags = function(){ const r = o.apply(this, arguments); try{ if(nf86Demo()){ let n = 0; r.forEach(f => { if(f.lvl === 'red'){ n++; if(n > 3) f.lvl = 'amber'; } }); } }catch(e){} return r; }; bkFlags._nf86 = 1; window.bkFlags = bkFlags; } }catch(e){}

/* ---------- To check lives on Home now: its items join "What to do"; the separate page and menu item are gone ---------- */
const NF86_DUP = ['Not billed', 'Missing stock', 'Changed by hand', 'Cash short', 'Not counted', 'Long overdue'];
let nf86IssReady = false;
async function nf86IssLoad(){ if(nf86IssReady) return; try{ if(typeof issLoadDecisions === 'function' && (typeof ISS === 'undefined' || !ISS.decisions)) await issLoadDecisions(); nf86IssReady = true; nf86IssPaint(); }catch(e){} }
function nf86IssPaint(){
  const lanes = document.querySelector('#mhHome .lanes'); if(!lanes || typeof issuesAll !== 'function') return;
  let list = []; try{ list = issuesAll().filter(i => !['resolved', 'accepted'].includes(i.status) && !NF86_DUP.includes(i.kind)); }catch(e){ return; }
  const key = list.map(i => i.fp).join('|'); if(lanes.dataset.nf86 === key) return; lanes.dataset.nf86 = key;
  lanes.querySelectorAll('.nf86-iss').forEach(e => e.remove());
  window._nf86Iss = {}; list.forEach(i => { window._nf86Iss[i.fp] = i; });
  const lane = lvl => [...lanes.querySelectorAll('.lane')][lvl === 'red' ? 0 : 1];
  list.forEach(i => { const L = lane(i.lvl); if(!L) return; const verb = (typeof NF75_KIND !== 'undefined' && NF75_KIND[i.kind] && NF75_KIND[i.kind].verb) || 'Open';
    const div = document.createElement('div'); div.className = 'task nf86-iss';
    div.innerHTML = `<div><h5>${nf86E(i.t)}</h5><p>${nf86E(i.what || '')}</p><button type="button" class="nf86-fine" onclick="nf86IssFine('${i.fp}')">It's fine, close it</button></div><button class="btn" type="button" onclick="nf86IssGo('${i.fp}')">${nf86E(verb)}</button>`;
    L.appendChild(div);
    const n = L.querySelector('.lane-h span:last-child'); if(n) n.textContent = L.querySelectorAll('.task:not(.nf84-dn)').length; });
}
function nf86IssGo(fp){
  const i = (window._nf86Iss || {})[fp]; if(!i) return;
  if(i.kind === 'Missing receipts'){
    const m = String(i.fp).split(':')[1] || bkMonth(APP_TODAY);
    const ex = (BK.expenses || []).filter(e => !e.deletedAt && bkMonth(e.date) === m && Number(e.amount) >= 1000 && !e.receipt && !bkCat(e.category).transfer);
    return nf86Pop('iss:' + fp, 'Add the missing receipts', 'Take a photo of each receipt. Tap Add photo on an expense, then snap or pick the picture. Bills without a paper receipt can be closed with "No receipt for this".', ex.length ? `<div class="nf86-ls">${ex.map(e => `<div class="it"><div class="w"><b>${nf86E(e.category)}</b><small>${nf86E(e.vendor || '')}${e.vendor ? ' · ' : ''}${nf86E(nf85Day(e.date))}</small></div><b class="am">${nf85P(e.amount)}</b><div class="bx"><button type="button" class="nf82-btn p" onclick="slClose('nf86T'); openExpenseForm('${e.id}')">Add photo</button></div></div>`).join('')}</div>` : nf86Empty('Every expense has its receipt.'), "go('expenses')");
  }
  const k = typeof NF75_KIND !== 'undefined' ? NF75_KIND[i.kind] : null;
  if(k && k.recount) return nf75Recount(fp);
  if(i.ev && i.ev[0]) try{ (0, eval)(i.ev[0][1]); }catch(e){}
}
function nf86IssFine(fp){ const i = (window._nf86Iss || {})[fp]; if(!i) return; if(!window._nf75Iss) window._nf75Iss = {}; window._nf75Iss[fp] = i; if(typeof nf75IssFine === 'function') nf75IssFine(fp); }
NF45_AFTER.push(() => { try{ if(document.querySelector('#page-dashboard.active')){ nf86IssLoad(); nf86IssPaint(); } }catch(e){} });
setInterval(() => { try{ if(document.querySelector('#page-dashboard.active') && nf86IssReady) nf86IssPaint(); }catch(e){} }, 2000);
(function(){ if(typeof navigate !== 'function' || navigate._nf86) return; const nav = navigate; const w = function(page){ if(page === 'issues'){ page = 'dashboard'; arguments[0] = 'dashboard'; setTimeout(() => { const l = document.querySelector('#mhHome .lanes'); if(l) l.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 400); } return nav.apply(this, arguments); }; Object.assign(w, nav); w._nf86 = 1; navigate = w; window.navigate = w; })();
function nf86HideNav(){ document.querySelectorAll('#view-app .sidebar [data-page="issues"]').forEach(n => { n.style.display = 'none'; }); }
NF45_AFTER.push(() => { try{ nf86HideNav(); }catch(e){} }); setTimeout(nf86HideNav, 1500);

/* ---------- Follow-ups live in Messages: a "Follow-ups" folder opens who to follow up, each with its one action ---------- */
let nf86FuN = 0;
async function nf86FuCount(){ try{ if(typeof fuLoad === 'function') await fuLoad(); nf86FuN = nf45FuItems().filter(x => x.k !== 'lost').length; nf86FuFolder(); }catch(e){} }
function nf86FuFolder(){
  const nav = document.getElementById('nf39Fold'); if(!nav) return;
  let b = nav.querySelector('.nf86-fu');
  if(!b){ b = document.createElement('button'); b.type = 'button'; b.className = 'nf39-fi nf86-fu'; b.title = 'Follow-ups'; b.onclick = () => nf86FuOpen();
    const anchor = nav.querySelector('.nf39-sp'); if(anchor) nav.insertBefore(b, anchor); else nav.appendChild(b); }
  const html = `<span class="nf39-ic">${nf85Ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>', 18)}</span><span class="nf39-l">Follow-ups</span>${nf86FuN ? `<em class="nf86-fun">${nf86FuN}</em>` : ''}`;
  if(b.dataset.k !== String(nf86FuN)){ b.dataset.k = String(nf86FuN); b.innerHTML = html; }
}
async function nf86FuOpen(all){
  try{ if(typeof fuLoad === 'function') await fuLoad(); }catch(e){}
  let list = []; try{ list = nf45FuItems().filter(x => x.k !== 'lost').sort((a, b) => (b.late ? 1 : 0) - (a.late ? 1 : 0) || b.amt - a.amt); }catch(e){}
  const shown = !all && nf86Demo() ? (() => { const seen = new Set(), out = []; list.forEach(x => { if(out.length < 3 && !seen.has(x.k)){ seen.add(x.k); out.push(x); } }); list.forEach(x => { if(out.length < 3 && !out.includes(x)) out.push(x); }); return out; })() : list;
  const row = it => { const [main] = nf45FuAct(it); return `<div class="it"><div class="w"><b>${nf86E(it.name)}</b><span class="nx"><span class="nf45-chipk t-${it.tone}">${nf86E(it.why)}</span>${it.due ? ` <span class="${it.late ? 'r' : ''}">${nf86E(it.due)}</span>` : ''}</span><small>${nf86E(it.sub || '')}</small></div>${it.amt ? `<b class="am">${(it.k === 'lead' ? '~' : '') + nf85P(it.amt)}</b>` : '<span></span>'}<div class="bx">${main.replace('class="btn btn-primary"', 'class="nf82-btn p"').replace('class="btn btn-outline"', 'class="nf82-btn s"')}</div></div>`; };
  nf86Pop('fu', `Follow up · ${list.length} ${list.length === 1 ? 'person' : 'people'}`, 'People waiting on you, leads that could buy, and old customers to win back. Tap the button on each. The message is written for you.', list.length ? `<div class="nf86-ls">${shown.map(row).join('')}</div>${shown.length < list.length ? `<button type="button" class="nf86-all" onclick="nf86FuOpen(true)">See all ${list.length}</button>` : ''}` : nf86Empty('Nobody to follow up right now.'), '');
  const done = document.querySelector('#nf86T .sl-actions .btn-primary'); if(done) done.remove();
}
NF45_AFTER.push(() => { try{ if(document.querySelector('#page-messages.active')){ nf86FuFolder(); nf86FuCount(); } document.querySelectorAll('#view-app .sidebar [data-page="followups"]').forEach(n => { n.style.display = 'none'; }); }catch(e){} });
setInterval(() => { try{ if(document.querySelector('#page-messages.active')) nf86FuFolder(); }catch(e){} }, 1500);
(function(){ const nav = navigate; const w = function(page){ if(page === 'followups'){ arguments[0] = 'messages'; setTimeout(() => nf86FuOpen(), 500); } return nav.apply(this, arguments); }; Object.assign(w, nav); navigate = w; window.navigate = w; })();

/* ---------- Menu: Payroll sits with Expenses; To check and Follow-ups moved into Home and Messages; clearer group name ---------- */
try{
  NF20_GROUPS.splice(0, NF20_GROUPS.length,
    {k: 'main', label: '', items: [['dashboard', 'Home'], ['orders', 'Orders'], ['messages', 'Messages'], ['inventory', 'Stock']]},
    {k: 'money', label: 'Money', items: [['money', 'Money overview'], ['sales', 'Sales'], ['expenses', 'Expenses'], ['payroll', 'Payroll'], ['collections', 'Getting paid'], ['profit', 'Prices'], ['ledger', 'Books']]},
    {k: 'sell', label: 'Selling & delivery', items: [['routes', 'Deliveries'], ['returns', 'Returns & credits'], ['store', 'Online store'], ['discover', 'Find customers']]},
    {k: 'more', label: 'Checks, forms & team', items: [['cheques', 'Checks'], ['books', 'Tax books'], ['taxforms', 'BIR 2307s'], ['team', 'Team']]});
  NF20_PAGES.splice(0, NF20_PAGES.length, ...NF20_GROUPS.flatMap(g => g.items.map(x => x[0])), 'issues', 'followups');
}catch(e){ console.warn('nf86 menu', e); }
NF45_AFTER.push(() => { try{ document.querySelectorAll('#view-app .sidebar .nf20-g[data-g="more"] .nf20-h').forEach(h => { const s = [...h.querySelectorAll('span, b')].find(x => /Checks, taxes/.test(x.textContent)); if(s) s.textContent = s.textContent.replace('Checks, taxes & team', 'Checks, forms & team'); }); }catch(e){} });

/* ---------- Payroll: a calm form. Period picks, one card per person (Pay / Deductions), live take-home, paid-from as buttons ---------- */
try{ if(typeof prFormRender === 'function' && !prFormRender._nf86){
  prFormRender = function(){
    const v = prValeBalances(), tot = PRF.lines.reduce((a, l) => a + prCalc(l).net, 0);
    if(PRF.open == null) PRF.open = 0; if(!PRF.payFrom) PRF.payFrom = 'cash';
    const m = String(APP_TODAY).slice(0, 7), pm = bkPrevMonth(m), eomOf = mm => { const x = new Date(mm + '-01T00:00:00'); return new Date(x.getFullYear(), x.getMonth() + 1, 0).toLocaleDateString('en-CA'); };
    const periods = [[pm + '-16', eomOf(pm)], [m + '-01', m + '-15'], [m + '-16', eomOf(m)]];
    const pl = ([a, b]) => new Date(a + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}) + '–' + Number(b.slice(8, 10));
    const inp = (i, k, ph) => `<span class="nf86-pin">${k === 'days' ? '' : '<em>₱</em>'}<input inputmode="decimal" value="${escapeHtml(String(PRF.lines[i][k] || ''))}" placeholder="${ph}" oninput="PRF.lines[${i}].${k}=this.value; nf86PrLive(${i})"></span>`;
    const card = (l, i) => { const c = prCalc(l), open = PRF.open === i, ded = (Number(l.vale_deduct) || 0) + (Number(l.contrib_employee) || 0) + (Number(l.other_deduct) || 0);
      return `<div class="nf86-pr${open ? ' open' : ''}"><div class="hd" onclick="if(!event.target.closest('input,select,button')){ PRF.open = PRF.open === ${i} ? -1 : ${i}; prFormRender(); }">
          <span class="av">${escapeHtml(String(l.staff_name || '?').replace(/^(\S)\S*\s*(\S?).*/, '$1$2').toUpperCase())}</span>
          <input class="nm" maxlength="80" value="${escapeHtml(l.staff_name)}" placeholder="Name" oninput="PRF.lines[${i}].staff_name=this.value">
          <b class="th" id="nf86PrTh${i}">${bkPeso(c.net)}</b><span class="cv">${open ? '▴' : '▾'}</span></div>
        ${open ? `<div class="bd">
          <div class="sec pay"><div class="sh"><span>Pay</span><span class="seg"><button type="button" class="${l.basis !== 'month' ? 'on' : ''}" onclick="PRF.lines[${i}].basis='day'; prFormRender()">Per day</button><button type="button" class="${l.basis === 'month' ? 'on' : ''}" onclick="PRF.lines[${i}].basis='month'; prFormRender()">Per month</button></span></div>
            <div class="g3"><label><small>${l.basis === 'month' ? 'Monthly rate' : 'Daily rate'}</small>${inp(i, 'rate', '0')}${nf87Was(l, i, 'rate')}</label><label><small>${l.basis === 'month' ? 'Months (0.5 = half)' : 'Days worked'}</small>${inp(i, 'days', l.basis === 'month' ? '0.5' : '0')}${nf87Was(l, i, 'days')}</label><label><small>Overtime or extra</small>${inp(i, 'extra', '0')}${nf87Was(l, i, 'extra')}</label></div></div>
          <div class="sec ded"><div class="sh"><span>Deductions</span></div>
            <div class="g3 g2"><label><small>Amount deducted${v[l.staff_name] > 0 ? ` · still owes ${bkPeso(v[l.staff_name])}` : ''}</small>${inp(i, 'vale_deduct', '0')}${nf87Was(l, i, 'vale_deduct')}</label><label><small>Gov't contributions (SSS, PhilHealth, Pag-IBIG)</small>${inp(i, 'contrib_employee', '0')}${nf87Was(l, i, 'contrib_employee')}</label></div>
            </div>
          <div class="eq" id="nf86PrEq${i}">${nf86PrEq(l)}</div>
          <button type="button" class="rm" onclick="PRF.lines.splice(${i},1); PRF.open = -1; prFormRender()">Remove ${escapeHtml(l.staff_name || 'this person')}</button></div>`
        : `<div class="sm">${c.gross ? `Pay ${bkPeso(c.gross)}${ded ? ` · deductions ${bkPeso(ded)}` : ''}` : 'Tap to fill in their pay'}</div>`}</div>`; };
    slModal('prModal', `<div class="sl-sheet-h"><b>${PRF.orig ? 'Correct this payroll' : PRF.id ? 'Payroll (draft)' : 'Pay your staff'}</b><button class="sl-x" onclick="slClose('prModal')">✕</button></div>
      <div class="nf86-prf">${PRF.orig ? '<div class="nf87-corr">Change only what was wrong. The old amount is shown under each box. Nifti records just the difference, so your books stay right.</div>' : ''}
        <div class="per"><span class="lb">Pay period</span><div class="qk">${periods.map(p => `<button type="button" class="${PRF.from === p[0] && PRF.to === p[1] ? 'on' : ''}" onclick="PRF.from='${p[0]}'; PRF.to='${p[1]}'; prFormRender()">${pl(p)}</button>`).join('')}</div>
          <div class="dt"><input type="date" value="${PRF.from}" onchange="PRF.from=this.value" aria-label="From"><span>to</span><input type="date" value="${PRF.to}" onchange="PRF.to=this.value" aria-label="To"></div></div>
        <div class="ls">${PRF.lines.map(card).join('')}</div>
        <button type="button" class="nf86-add" onclick="PRF.lines.push({staff_name:'',basis:'day',rate:'',days:'',extra:'',vale_deduct:'',contrib_employee:'',contrib_employer:'',other_deduct:'',note:''}); PRF.open = PRF.lines.length - 1; prFormRender()">+ Add a person</button>
        <div class="tot"><span>Total take-home pay</span><b id="prTot">${bkPeso(tot)}</b></div>
        <div class="pf"><span class="lb">Paid from</span><span class="seg">${[['cash', 'Cash drawer'], ['gcash', 'GCash'], ['bank', 'Bank']].map(([k, l]) => `<button type="button" class="${PRF.payFrom === k ? 'on' : ''}" onclick="PRF.payFrom='${k}'; prFormRender()">${l}</button>`).join('')}</span></div>
        <div class="sl-err" id="prErr">${escapeHtml(PRF.err)}</div>
        <div class="ac"><button class="btn btn-outline" onclick="prSave(false)" ${PRF.saving ? 'disabled' : ''}>Save as draft</button><button class="btn btn-primary" onclick="nf86PrPay()" ${PRF.saving ? 'disabled' : ''}>${PRF.saving ? 'Saving…' : `Pay ${bkPeso(tot)} now`}</button></div>
      </div>`);
    const sh = document.querySelector('#prModal .sl-sheet'); if(sh) sh.classList.add('nf86-sheet');
  };
  prFormRender._nf86 = 1; window.prFormRender = prFormRender;
} }catch(e){ console.warn('nf86 payroll', e); }
function nf86PrEq(l){ const c = prCalc(l), ded = (Number(l.vale_deduct) || 0) + (Number(l.contrib_employee) || 0); return `<span>Pay <b>${bkPeso(c.gross)}</b></span><i>−</i><span>Deductions <b>${bkPeso(ded)}</b></span><i>=</i><span class="t">Take home <b class="${c.net < 0 ? 'bad' : ''}">${bkPeso(c.net)}</b></span>`; }
function nf86PrLive(i){ const l = PRF.lines[i]; const e = document.getElementById('nf86PrEq' + i); if(e) e.innerHTML = nf86PrEq(l); const th = document.getElementById('nf86PrTh' + i); if(th) th.textContent = bkPeso(prCalc(l).net); const t = document.getElementById('prTot'); const tot = PRF.lines.reduce((a, x) => a + prCalc(x).net, 0); if(t) t.textContent = bkPeso(tot); const pb = document.querySelector('#prModal .nf86-prf .ac .btn-primary'); if(pb && !PRF.saving) pb.textContent = `Pay ${bkPeso(tot)} now`; }
function nf86PrPay(){ const op = window.prompt; window.prompt = () => PRF.payFrom || 'cash'; try{ return prSave(true); } finally { setTimeout(() => { window.prompt = op; }, 0); } }

/* ---------- Demo: never more than 3 examples in a list, picked to show different kinds; the rest behind "See all" ---------- */
const NF86_CAP_SKIP = 'nav, header, .sidebar, #bottomNav, [role=tablist], select, form, .nf82-where, .tls, .tls3, .sl-tiles, .nf74-ots, .nf86-who .cols, .stk, .nf75-board > *, .nf85-sum, .nf43-pills, .chip-filter, .pl-grp, .nf78-col, .nf81-ct, .nft-side, .nf45-months, .nf49-cards, .nfo-card, #page-settings, .lane-row, .hdr, .ob, .board, .sr-list, .nf77-ng, .msg-composer, .msg-thread-head, .nf86-route, .nf85-qa, .nf86-route, .nf33-tabs, .sr-k4, .nfo-key, .nums, .qk, .seg, .nf85-chips, .nf86-when, .nf85-tl, .msg-thread-body, #threadBody, .nf39-fold, .nf45-futiles, svg, .pl, .pl-list, .lg-pl, .nf72-pl, .nf86-prf, .nf85-pcx .nf75-pcl, .nf26-side, .nf75-days, .nf75-aud, .nf76-aud, .rt-seg, .nf25-tw thead, .sl-modal, .share-modal-backdrop, #mhSheet, .nff, .nf84-fxw, .nf86-tp, .cal, [class*="calendar"], .nf75-cs, .nf30-cal, .ow-grid, .board-cols, .hm-tiles';
function nf86Sig(e){ return e.tagName + '.' + (String(e.className || '').trim().split(/\s+/)[0] || ''); }
function nf86Variant(e, sig){ const base = sig.split('.')[1]; return String(e.className || '').split(/\s+/).filter(c => c && c !== base && !/^(open|active|on|nf86|nf26-rowoff)/.test(c)).sort().join(' '); }
function nf86CapOne(c){
  if(c.dataset.nf86all || c.closest(NF86_CAP_SKIP)) return;
  const kids = [...c.children].filter(k => !k.classList.contains('nf86-seeall') && (k.offsetParent || k.classList.contains('nf86-cut')));
  if(kids.length < 4) return;
  const by = {}; kids.forEach(k => { const s = nf86Sig(k); (by[s] = by[s] || []).push(k); });
  const [sig, items] = Object.entries(by).sort((a, b) => b[1].length - a[1].length)[0];
  if(items.length < 4 || items.length < kids.length * .6) return;
  if(/^(TH|COL|OPTION|LI)\./.test(sig) && c.closest('thead')) return;
  if(items.some(k => [...k.querySelectorAll('input:not([type=checkbox]), textarea, select')].some(i => i.offsetParent))) return;
  if(items.some(k => k.matches('section, .panel-card, .sect, .rows') || k.querySelector(':scope > .panel-head, :scope > .sect-h, :scope > h2'))) return;
  const h = items.reduce((a, k) => a + (k.offsetHeight || 0), 0) / items.length; if(h && h < 30 && !/^TR\./.test(sig)) return;
  if(/^(BUTTON|A|LABEL|INPUT|TEXTAREA|SELECT|SPAN|I|B|EM|SMALL)\./.test(sig) && h < 60) return; // chips and small pills are controls, not examples
  if(items.some(k => /^(total|kabuuan)/i.test((k.textContent || '').trim()))) return;
  // pick 3 that look different (late / soon / paid …), keep their order
  const pick = []; const seen = new Set();
  items.forEach(k => { const v = nf86Variant(k, sig); if(pick.length < 3 && !seen.has(v)){ seen.add(v); pick.push(k); } });
  items.forEach(k => { if(pick.length < 3 && !pick.includes(k)) pick.push(k); });
  items.forEach(k => k.classList.toggle('nf86-cut', !pick.includes(k)));
  const host = c.tagName === 'TBODY' ? c.closest('table') : c;
  let btn = host.nextElementSibling && host.nextElementSibling.classList && host.nextElementSibling.classList.contains('nf86-seeall') ? host.nextElementSibling : null;
  if(host.nextElementSibling && host.nextElementSibling.classList && host.nextElementSibling.classList.contains('nf26-more')) host.nextElementSibling.remove();
  if(!btn) btn = c.tagName !== 'TBODY' ? c.querySelector(':scope > .nf86-seeall') : null;
  if(!btn){ btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nf86-seeall'; if(c.tagName === 'TBODY' || /^(UL|OL)$/.test(c.tagName)) host.after(btn); else c.appendChild(btn); btn.onclick = () => { c.dataset.nf86all = '1'; c.querySelectorAll(':scope > .nf86-cut').forEach(k => k.classList.remove('nf86-cut')); btn.remove(); }; }
  btn.textContent = `See all ${items.length}`;
}
function nf86Cap(){
  if(!nf86Demo()) return;
  const act = document.querySelector('#view-app .app-page.active'); if(!act) return;
  const key = act.id + ':' + act.getElementsByTagName('*').length + ':' + act.getElementsByClassName('nf86-cut').length + ':' + act.getElementsByClassName('nf86-seeall').length; if(act.id === NF86C.last && key === NF86C.key) return; NF86C.last = act.id; NF86C.key = key;
  const scopes = act.id === 'page-messages' ? [...act.querySelectorAll('.msg-conv-list')] : [act];
  scopes.forEach(s => { s.querySelectorAll('tbody, div, section, ul, ol').forEach(c => { if(c.children.length >= 4) try{ nf86CapOne(c); }catch(e){} }); });
}
const NF86C = {last: '', key: '', at: 0}; let nf86CapT = null; function nf86CapSoon(){ if(nf86CapT) return; const wait = Math.max(350, 1200 - (Date.now() - NF86C.at)); nf86CapT = setTimeout(() => { nf86CapT = null; NF86C.at = Date.now(); try{ nf86Cap(); }catch(e){} }, wait); }
try{ new MutationObserver(m => { if(m.some(x => x.type === 'childList' && [...x.addedNodes].some(n => n.nodeType === 1 && !(n.classList && n.classList.contains('nf86-seeall'))))) nf86CapSoon(); }).observe(document.body, {childList: true, subtree: true}); }catch(e){}
NF45_AFTER.push(nf86CapSoon);

/* Orders (demo): one example per status, at most 3 per side, so every status still shows somewhere */
function nf86OrdersCap(){
  if(!nf86Demo() || !document.querySelector('#page-orders.active')) return;
  document.querySelectorAll('#nfOrd .nfo-card').forEach(card => {
    if(card.dataset.nf86all) return; let shown = 0, bands = [...card.querySelectorAll(':scope > .nfo-band')];
    const sell = !!card.closest('.nf20-col:not(.s), .nf-half-supplier') || /Selling/.test((card.closest('section, .nf20-col') || card).textContent.slice(0, 80));
    let hidden = 0;
    bands.forEach(b => { let n = b.nextElementSibling, first = true; const keep = !(sell && /Waiting on them/i.test(b.textContent) && bands.length > 3) && shown < 3; if(keep) shown++; b.classList.toggle('nf86-cut', !keep);
      while(n && !n.classList.contains('nfo-band')){ if(n.classList.contains('nfo-pc')){ const k = keep && first; n.classList.toggle('nf86-cut', !k); if(!k) hidden++; first = false; } n = n.nextElementSibling; } });
    let btn = card.querySelector(':scope > .nf86-seeall'); if(hidden && !btn){ btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nf86-seeall'; btn.onclick = () => { card.dataset.nf86all = 1; card.querySelectorAll('.nf86-cut').forEach(x => x.classList.remove('nf86-cut')); btn.remove(); }; const people = card.querySelector('#nfoPeople, .nfo-people'); if(people) people.before(btn); else card.appendChild(btn); }
    if(btn) btn.textContent = 'See all orders';
  });
}
NF45_AFTER.push(() => setTimeout(() => { try{ nf86OrdersCap(); }catch(e){} }, 380));
setInterval(() => { try{ nf86OrdersCap(); }catch(e){} }, 1500);
