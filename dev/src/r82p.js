/* ===== Round 82 · Get paid faster (free for everyone) =====
   One list of everyone who owes you (shop utang + delivery orders), "Collect today" ranked by amount × days late,
   reminders on your schedule with the message ready, how old the money owed is, how many days customers take to pay,
   due dates and limits on utang, a statement link per customer where they can say "I paid" with a screenshot,
   and a receipt ready to send after every payment. */
const NF82G = {claims: null, remlog: null, loading: false, reg: {}, ag: null, setOpen: false, more: false};
function nf82Norm(n){ return String(n || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function nf82Id(k){ let h = 0; const s = String(k); for(let i = 0; i < s.length; i++){ h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return 'g' + (h >>> 0).toString(36); }
function nf82Day(d){ return d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}) : ''; }
function nf82Initials(n){ const w = String(n || '?').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean); return ((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : (w[0] || '')[1] || '')).toUpperCase(); }
function nf82Boss(){ try{ return booksCanSeeTotals(); }catch(e){ return true; } }
function nf82Sells(){ try{ return typeof getSupplierPOs === 'function'; }catch(e){ return false; } }

/* ---------- demo: a few believable shop customers who owe, outside the Oct 1–26 / November windows so profit numbers don't move ---------- */
function nf82DemoSeed(){
  if(myBusiness || !BK || !Array.isArray(BK.sales) || BK.sales.some(s => String(s.id).startsWith('nf82d-'))) return;
  const d = n => addDaysIso(APP_TODAY, -n), line = (p, q) => { const pr = Number(bkItemPrice(p)) || 0; return {product: p, qty: q, unitPrice: pr, unitCost: Number(bkItemCost(p)) || 0, listPrice: pr}; };
  const mk = (id, n, customer, lines, extra) => { const total = lines.reduce((a, l) => a + l.qty * l.unitPrice, 0); return Object.assign({id: 'nf82d-' + id, date: d(n), at: d(n) + 'T10:30:00', customer, lines, total, paidWith: 'credit', payments: [], by: 'Liza', byId: null, note: '', branch: null, payLog: []}, typeof extra === 'function' ? extra(total) : (extra || {})); };
  const add = [
    mk('lorna', 72, 'Tindahan ni Lorna', [line('Portland Cement 40kg', 10), line('Galvanized Wire 12ga', 2)], t => ({payments: [{method: 'cash', amount: 1000, date: d(50), by: 'Liza'}]})),
    mk('jm', 59, 'JM Builders', [line('Steel Rebar 12mm', 120), line('Portland Cement 40kg', 20)], {dueDate: d(29)}),
    mk('nena', 29, 'Aling Nena', [line('Portland Cement 40kg', 5), line('Welding Rods 3.2mm', 4)], {dueDate: d(14)}),
    mk('ramil', 29, 'Kuya Ramil', [line('Steel Rebar 12mm', 8)], {dueDate: addDaysIso(APP_TODAY, 2)}),
    mk('gonz1', 30, 'Gonzales Hardware', [line('Portland Cement 40kg', 10)], t => ({payments: [{method: 'gcash', amount: t, date: d(12), by: 'Ramon Dela Cruz'}]})),
    mk('gonz2', 67, 'Gonzales Hardware', [line('Steel Rebar 12mm', 30)], t => ({payments: [{method: 'cash', amount: t, date: d(43), by: 'Liza'}]}))
  ].filter(s => s.total > 0);
  BK.sales.push(...add); try{ bkSaveDemo(); }catch(e){}
  if(!NF82G.claims){ const nena = add.find(s => s.id === 'nf82d-nena'); NF82G.claims = nena ? [{id: 'nf82dc-1', customer_name: 'Aling Nena', amount: 500, method: 'gcash', reference: '7710 2231 905', payer_name: 'Nena', proof_path: null, status: 'pending', created_at: new Date(Date.now() - 2 * 3600e3).toISOString(), demo: true}] : []; }
}
if(typeof bkSeedDemo === 'function' && !bkSeedDemo._nf82){ const _bsd = bkSeedDemo; bkSeedDemo = function(){ const r = _bsd.apply(this, arguments); try{ nf82DemoSeed(); }catch(e){ console.warn('nf82 seed', e); } return r; }; bkSeedDemo._nf82 = true; window.bkSeedDemo = bkSeedDemo; }

/* ---------- data ---------- */
async function nf82GLoad(force){
  if(NF82G.loading || (NF82G.claims && NF82G.remlog && !force)) return;
  NF82G.loading = true;
  try{
    if(myBusiness){
      const since = new Date(Date.now() - 75 * 864e5).toISOString();
      const [c, r] = await Promise.all([
        sb.from('utang_claims').select('*').eq('business_id', myBusiness.id).or(`status.eq.pending,decided_at.gte.${since}`).order('created_at', {ascending: false}).limit(200),
        sb.from('utang_reminder_log').select('*').eq('business_id', myBusiness.id).gte('sent_at', since).order('sent_at', {ascending: false}).limit(500)]);
      NF82G.claims = c.error ? [] : (c.data || []); NF82G.remlog = r.error ? [] : (r.data || []);
    } else { try{ nf82DemoSeed(); }catch(e){} NF82G.claims = NF82G.claims || []; NF82G.remlog = NF82G.remlog || []; }
  }catch(e){ NF82G.claims = NF82G.claims || []; NF82G.remlog = NF82G.remlog || []; }
  NF82G.loading = false;
}
function nf82Claims(){ return (NF82G.claims || []).filter(c => c.status === 'pending'); }
function nf82TermsRaw(){ const v = bkSettings().utang_terms; return v === 'payday' ? 'payday' : (Number(v) || Number(bkSettings().utang_terms_days) || 15); }
function nf82Payday(from){ const d = new Date(String(from || APP_TODAY).slice(0, 10) + 'T00:00:00'), y = d.getFullYear(), m = d.getMonth(), day = d.getDate(), last = new Date(y, m + 1, 0).getDate();
  const iso = (yy, mm, dd) => new Date(yy, mm, dd).toLocaleDateString('en-CA');
  if(day < 15) return iso(y, m, 15); if(day < last) return iso(y, m, last); return iso(y, m + 1, 15); }
function nf82DefaultDue(from){ const t = nf82TermsRaw(); return t === 'payday' ? nf82Payday(from) : addDaysIso(String(from || APP_TODAY).slice(0, 10), t); }
function nf82Due(s){ return s.dueDate || nf82DefaultDue(s.date); }
function nf82UtLimit(name){ const s = bkSettings(), per = s.utang_limits || {}, k = nf82Norm(name); return Number(per[k]) > 0 ? Number(per[k]) : (Number(s.utang_limit_default) || 0); }
function nf82UtOwes(name){ const k = nf82Norm(name); return (BK.sales || []).filter(s => !s.voidedAt && !s.deletedAt && nf82Norm(s.customer) === k).reduce((a, s) => a + bkSaleBalance(s), 0); }
function nf82Open(){
  const out = [];
  (BK.sales || []).forEach(s => {
    if(s.voidedAt || s.deletedAt || !s.customer || s.customer === 'Walk-in') return; const bal = bkSaleBalance(s); if(bal < 1) return;
    const due = nf82Due(s); out.push({src: 'ut', id: s.id, name: s.customer, key: 'ut:' + nf82Norm(s.customer), date: s.date, due, bal, total: Number(s.total) || 0, late: daysBetween(due, APP_TODAY), age: daysBetween(s.date, APP_TODAY), sale: s});
  });
  try{ if(typeof unpaidInvoicesFor === 'function') unpaidInvoicesFor('supplier').forEach(r => { const date = String(r.po.invoice.issuedDate || r.po.createdDate || APP_TODAY).slice(0, 10);
    out.push({src: 'po', id: r.po.id, name: r.po.buyerName || 'Customer', key: r.po.buyerId, date, due: r.due ? String(r.due).slice(0, 10) : null, bal: r.balance, pending: r.pending || 0, total: r.balance, late: r.due ? r.daysOverdue : null, age: daysBetween(date, APP_TODAY), po: r.po}); }); }catch(e){}
  return out;
}
function nf82Custs(){
  const by = {}, claims = nf82Claims();
  nf82Open().forEach(r => {
    const g = by[r.key] || (by[r.key] = {key: r.key, id: nf82Id(r.key), src: r.src, name: r.name, total: 0, items: [], maxLate: null, oldest: r.date, nextDue: null, pending: 0, late: 0});
    g.total += r.bal; g.items.push(r); if(r.date < g.oldest) g.oldest = r.date; g.pending += r.pending || 0;
    if(r.late != null){ g.maxLate = g.maxLate == null ? r.late : Math.max(g.maxLate, r.late); if(r.late > 0) g.late += r.bal; else if(!g.nextDue || r.due < g.nextDue) g.nextDue = r.due; }
  });
  Object.values(by).forEach(g => { if(g.src === 'ut') g.pending += claims.filter(c => 'ut:' + nf82Norm(c.customer_name) === g.key).reduce((a, c) => a + Number(c.amount || 0), 0); g.total = Math.round(g.total * 100) / 100; NF82G.reg[g.id] = g; });
  return Object.values(by);
}

/* ---------- reminder stage on the schedule (shared with delivery orders) ---------- */
function nf82Sched(){ try{ return collSettings().schedule; }catch(e){ return [-2, 0, 3, 7, 14, 30]; } }
function nf82StageLabel(o){ return o < 0 ? `${-o} day${o === -1 ? '' : 's'} before it's due` : o === 0 ? 'on the due day' : `${o} day${o === 1 ? '' : 's'} late`; }
function nf82UtLogged(g, st){ return (NF82G.remlog || []).some(l => nf82Norm(l.customer_name) === g.key.slice(3) && l.stage === 'd' + st && String(l.sent_at).slice(0, 10) >= g.oldest); }
function nf82UtToday(g){ return (NF82G.remlog || []).some(l => nf82Norm(l.customer_name) === g.key.slice(3) && String(l.sent_at).slice(0, 10) === APP_TODAY) || NF82G['sent:' + g.key] === APP_TODAY; }
function nf82Stage(g){
  if(g.maxLate == null) return null;
  if(g.src === 'po'){ try{ const row = colRows().find(x => x.id === g.key); if(row && row.needs && row.needs.length){ const st = Number(String(row.needs[row.needs.length - 1].stage).slice(1)); return {st, due: true, promise: row.promise}; } return row && row.promise ? {st: null, due: false, promise: row.promise} : null; }catch(e){ return null; } }
  const st = colStage(g.maxLate, nf82Sched()); if(st == null) return null;
  return {st, due: !nf82UtLogged(g, st)};
}

/* ---------- Collect today ---------- */
function nf82CollectRows(){
  return nf82Custs().filter(g => g.total >= 1).map(g => {
    const stg = nf82Stage(g), sent = g.src === 'ut' ? nf82UtToday(g) : NF82G['sent:' + g.key] === APP_TODAY, promised = stg && stg.promise && stg.promise.promised_date >= APP_TODAY;
    const dueNow = (g.maxLate != null && g.maxLate >= 0) || (stg && stg.due);
    return Object.assign(g, {stg, sent, promised, dueNow, score: g.total * Math.max(1, (g.maxLate || 0) + 1)});
  }).filter(g => g.dueNow && !(g.pending >= g.total)).sort((a, b) => (a.sent - b.sent) || (a.promised - b.promised) || (b.score - a.score));
}
function nf82LateTag(g){
  if(g.maxLate == null) return '<span class="tg n">No due date</span>';
  if(g.maxLate > 0) return `<span class="tg r">${g.maxLate} day${g.maxLate === 1 ? '' : 's'} late</span>`;
  if(g.maxLate === 0) return '<span class="tg a">Due today</span>';
  return `<span class="tg b">Due in ${-g.maxLate} day${g.maxLate === -1 ? '' : 's'}</span>`;
}
function nf82ColRow(g){
  const n = g.items.length, kind = g.src === 'ut' ? 'shop utang' : 'delivery order' + (n === 1 ? '' : 's');
  const status = g.sent ? `<span class="st ok">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 14)}Reminded today</span>`
    : g.promised ? `<span class="st ok">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 14)}Promised ${nf82P(g.stg.promise.amount)} by ${nf82E(nf82Day(g.stg.promise.promised_date))}</span>`
    : g.stg && g.stg.due && g.stg.st != null ? `<span class="st due">${nf82Ic('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>', 14)}Reminder due today</span>` : '';
  const pay = g.src === 'ut' ? nf79RpHtml('uc:' + g.id, Math.max(0, g.total - (g.pending || 0)), {utang: true}) : nf79RpHtml(g.key, Math.max(0, g.total - (g.pending || 0)));
  return `<div class="cr nf79-rph${g.sent || g.promised ? ' done' : g.maxLate > 0 ? ' late' : ''}" data-g="${g.id}">
    <span class="av" aria-hidden="true">${nf82E(nf82Initials(g.name))}</span>
    <div class="w"><b>${nf82E(g.name)}</b><small>${nf82LateTag(g)}<span>${n} bill${n === 1 ? '' : 's'} · ${kind}</span></small>${status ? `<small class="sl">${status}</small>` : ''}</div>
    <div class="am"><b>${nf82P(g.total)}</b>${g.pending >= 1 ? `<small>${nf82P(g.pending)} to confirm</small>` : ''}</div>
    <div class="ac"><button type="button" class="nf82-btn ${g.sent || g.promised ? 's' : 'p'}" onclick="nf82Remind('${g.id}')">${nf82Ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 16)}${g.sent ? 'Remind again' : 'Remind'}</button><button type="button" class="nf82-lk" onclick="nf79RpOpen(this)">Record payment</button></div>
    ${pay}</div>`;
}
function nf82DTP(from, to){
  const v = [];
  (BK.sales || []).forEach(s => { if(s.voidedAt || s.paidWith !== 'credit' || bkSaleBalance(s) >= 1) return; const last = (s.payments || []).map(bkPayDate).filter(Boolean).sort().pop(); if(last && last >= from && last <= to) v.push(Math.max(0, daysBetween(s.date, last))); });
  try{ (getSupplierPOs() || []).forEach(po => { if(!po.invoice || po.status === 'cancelled' || po.invoice.opening) return; const pi = computeInvoicePayments(po); if(pi.balance > 0.5) return;
    const last = (po.invoice.payments || []).filter(p => (p.confirmStatus || 'confirmed') === 'confirmed').map(p => String(p.confirmedAt || p.date || '').slice(0, 10)).filter(Boolean).sort().pop();
    const start = String(po.invoice.issuedDate || po.createdDate || '').slice(0, 10); if(last && start && last >= from && last <= to) v.push(Math.max(0, daysBetween(start, last))); }); }catch(e){}
  return v.length ? {avg: Math.round(v.reduce((a, x) => a + x, 0) / v.length), n: v.length} : null;
}
function nf82DTPHtml(){
  const m = bkMonth(APP_TODAY), now = nf82DTP(m + '-01', APP_TODAY); let R = null, was = null; try{ R = nf74SameRange(m); was = nf82DTP(R.from, R.to); }catch(e){}
  if(!now && !was) return `<div class="dtp"><small>Days to get paid</small><b>—</b><em>Shows once customers finish paying a bill</em></div>`;
  const d = now && was ? now.avg - was.avg : null;
  return `<div class="dtp"><small>Customers pay in</small><b>${now ? now.avg + ' day' + (now.avg === 1 ? '' : 's') : '—'}</b>${was ? `<em class="${d == null ? '' : d < 0 ? 'g' : d > 0 ? 'r' : ''}">${d == null ? '' : d < 0 ? `${-d} day${d === -1 ? '' : 's'} faster · ` : d > 0 ? `${d} day${d === 1 ? '' : 's'} slower · ` : 'same as · '}${nf82E(R.label)}: ${was.avg} days</em>` : '<em>on average this month</em>'}</div>`;
}
function nf82CollectHtml(where){
  const rows = nf82CollectRows(), todo = rows.filter(g => !g.sent && !g.promised), tot = todo.reduce((a, g) => a + g.total, 0), lim = where === 'home' ? 4 : 6;
  const shown = NF82G.more ? rows : rows.slice(0, lim);
  return `<section class="panel-card nf82-col" aria-labelledby="nf82ColH${where}">
    <div class="hd"><div class="tt"><h2 id="nf82ColH${where}">${nf82Ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 20)}Collect today</h2>
      <p>${todo.length ? `<b>${nf82P(tot)}</b> from ${todo.length} customer${todo.length === 1 ? '' : 's'} · the message is ready, you just tap send` : rows.length ? 'Everyone due today has been reminded. Nice.' : 'Nobody is due or late today.'}</p></div>${nf82DTPHtml()}</div>
    ${rows.length ? `<div class="list">${shown.map(nf82ColRow).join('')}</div>` : `<div class="empty">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 22)}<span>When a bill is due or late, the customer shows up here with a reminder ready to send.</span></div>`}
    <div class="ft">${rows.length > lim ? `<button type="button" class="nf82-lk" onclick="NF82G.more=!NF82G.more; nf82Repaint()">${NF82G.more ? 'Show fewer' : `Show all ${rows.length}`}</button>` : '<span></span>'}${where === 'home' ? `<button type="button" class="nf82-lk" onclick="go('collections')">Everyone who owes you ›</button>` : `<button type="button" class="nf82-lk" title="Reminder days: ${nf82E(nf82SchedShort())}" onclick="NF82G.setOpen=true; nf82Repaint(); setTimeout(() => { const e = document.getElementById('nf82Set'); if(e) e.scrollIntoView({behavior: 'smooth', block: 'center'}); }, 80)">Change reminder days</button>`}</div>
  </section>`;
}
function nf82SchedShort(){ return nf82Sched().map(o => o < 0 ? `${-o}d before` : o === 0 ? 'due day' : `${o}d late`).join(', '); }

/* ---------- how old the money owed is ---------- */
function nf82AgingHtml(){
  const all = nf82Open(); if(!all.length) return '';
  const B = [{k: 'a', l: '0–30 days', t: x => x.age <= 30}, {k: 'b', l: '31–60 days', t: x => x.age > 30 && x.age <= 60}, {k: 'c', l: 'Over 60 days', t: x => x.age > 60}].map(b => { const it = all.filter(b.t); return Object.assign(b, {it, sum: it.reduce((a, x) => a + x.bal, 0)}); });
  const tot = B.reduce((a, b) => a + b.sum, 0) || 1, open = B.find(b => b.k === NF82G.ag);
  return `<section class="panel-card nf82-age"><div class="hd"><h2>How old the money owed is</h2><span>Counted from the day of the sale or bill</span></div>
    <div class="bar" role="img" aria-label="${B.map(b => `${b.l}: ${nf82P(b.sum)}`).join(', ')}">${B.map(b => b.sum > 0 ? `<i class="${b.k}" style="width:${(b.sum / tot * 100).toFixed(2)}%"></i>` : '').join('')}</div>
    <div class="bk">${B.map(b => `<button type="button" class="${b.k}${NF82G.ag === b.k ? ' on' : ''}" aria-expanded="${NF82G.ag === b.k}" ${b.it.length ? `onclick="NF82G.ag = NF82G.ag === '${b.k}' ? null : '${b.k}'; nf82Repaint()"` : 'disabled'}><span><i></i>${b.l}</span><b>${nf82P(b.sum)}</b><small>${b.it.length} bill${b.it.length === 1 ? '' : 's'}</small></button>`).join('')}</div>
    ${open ? `<div class="ls">${open.it.sort((a, b) => b.age - a.age).map(x => `<div><span><b>${nf82E(x.name)}</b><small>${x.src === 'ut' ? 'Shop utang' : 'Order ' + nf82E(String(x.po.poNumber || '').replace(/^PO-\d{4}-/, ''))} · ${nf82E(nf82Day(x.date))} · ${x.age} days ago</small></span><b>${nf82P(x.bal)}</b></div>`).join('')}</div>` : ''}
  </section>`;
}

/* ---------- reminders: the same sheet as delivery orders (Viber, WhatsApp, Messenger, SMS, email), message + statement link ready ---------- */
async function nf82UtLink(name){
  if(!myBusiness) return appBaseUrl() + '#ut/demo';
  try{ const { data, error } = await sb.rpc('create_utang_link', {p_customer: name}); if(!error && data) return appBaseUrl() + '#ut/' + data; }catch(e){}
  return null;
}
function nf82UtMsg(g, link){
  const shop = myBusiness ? myBusiness.name : 'Dela Cruz Hardware', worst = g.maxLate == null ? -1 : g.maxLate;
  const lines = g.items.slice().sort((a, b) => String(a.due).localeCompare(String(b.due))).map(x => `• ${nf82Day(x.date)}${x.sale && x.sale.lines && x.sale.lines[0] ? ' · ' + x.sale.lines.slice(0, 2).map(l => l.qty + ' × ' + l.product).join(', ') : ''}: ${nf82P(x.bal)}${x.late > 0 ? ` (${x.late} days late)` : x.late === 0 ? ' (due today)' : ` (due ${nf82Day(x.due)})`}`).join('\n');
  const head = worst < 0 ? 'Friendly reminder po, may babayaran kayo soon:' : worst === 0 ? 'Friendly reminder po, due na po ito today:' : worst < 14 ? 'Just following up po, lampas na po sa due date:' : worst < 30 ? 'Paalala po, matagal na pong due ito. Sana ma-settle this week:' : 'Paalala po, matagal na pong hindi nababayaran ito. Pakisabi po kung kailan namin maaasahan ang bayad:';
  return `Hi ${g.name}! ${head}\n${lines}\n\nBalance: ${nf82P(g.total)}${link ? `\nSee your balance and pay by GCash or bank (tap "I've paid" after): ${link}` : ''}\nSalamat po! – ${shop}`;
}
async function nf82Remind(id){
  const g = NF82G.reg[id]; if(!g) return;
  if(g.src === 'po'){ window._nf82UtLog = null; NF82G['sent:' + g.key] = APP_TODAY; if(typeof colRemindNf33 === 'function') return colRemindNf33(g.key); return colRemind(g.key); }
  await nf33RLoad();
  const pid = g.key, p = Object.assign({channel: 'viber', phone: '', handle: '', email: ''}, (NF33R.prefs || {})[pid] || {});
  NF33R.cur = {id: pid, g: {name: g.name, total: g.total, overdue: g.late, maxLate: Math.max(0, g.maxLate || 0)}, p, text: nf82UtMsg(g, await nf82UtLink(g.name)), always: true, nf82: true};
  window._colPendingLog = [];
  window._nf82UtLog = {name: g.name, key: g.key, stage: g.stg && g.stg.st != null ? 'd' + g.stg.st : 'manual'};
  nf33RSheet(); nf82SheetTweak();
}
function nf82SheetTweak(){
  const x = NF33R.cur; const sh = document.querySelector('#nf33rSheet .sl-sheet, #nf33rSheet'); if(!x || !sh) return;
  if(x.receipt){ const h = sh.querySelector('.sl-sheet-h b'); if(h) h.textContent = 'Send ' + x.g.name + ' a receipt'; const s = sh.querySelector('.nf33r-sum'); if(s) s.innerHTML = x.left >= 1 ? `Still owes <b>${nf82P(x.left)}</b> after this` : '<b>Fully paid</b> with this payment';
    const lbl = [...sh.querySelectorAll('.nf33r-chk')]; lbl.forEach(l => { const t = l.lastChild; if(t && t.nodeType === 3) t.textContent = ' Always use this app for ' + x.g.name; }); }
}
if(typeof nf33RSheet === 'function' && !nf33RSheet._nf82){ const _rs = nf33RSheet; nf33RSheet = function(){ const r = _rs.apply(this, arguments); try{ nf82SheetTweak(); }catch(e){} return r; }; nf33RSheet._nf82 = true; window.nf33RSheet = nf33RSheet; }
async function nf82LogUt(u, channel){
  NF82G['sent:' + u.key] = APP_TODAY;
  const row = {customer_name: u.name, stage: u.stage, channel: channel || 'manual', sent_by: typeof bkMe === 'function' ? bkMe() : null, sent_at: new Date().toISOString()};
  NF82G.remlog = (NF82G.remlog || []).concat([row]);
  if(myBusiness){ try{ await sb.from('utang_reminder_log').insert(Object.assign({business_id: myBusiness.id}, row)); }catch(e){} }
}
if(typeof colLogManual === 'function' && !colLogManual._nf82){ const _clm = colLogManual; colLogManual = async function(){ const u = window._nf82UtLog; window._nf82UtLog = null; if(u){ try{ await nf82LogUt(u, NF33R.cur && NF33R.cur.p && NF33R.cur.p.channel); }catch(e){} } const r = await _clm.apply(this, arguments); setTimeout(nf82Repaint, 80); return r; }; colLogManual._nf82 = true; window.colLogManual = colLogManual; }

/* ---------- payment reports from statement links: confirm or "not in yet" right in Payments to confirm ---------- */
const NF82_MI = {gcash: 'GCash', maya: 'Maya', bank_transfer: 'Bank transfer', bank_deposit: 'Bank deposit', cash: 'Cash', grabpay: 'GrabPay', shopeepay: 'ShopeePay', remittance: 'Remittance'};
function nf82SaleMethod(m){ return m === 'cash' ? 'cash' : m === 'maya' ? 'maya' : m === 'bank_transfer' || m === 'bank_deposit' || m === 'remittance' ? 'bank' : 'gcash'; }
function nf82ClaimRow(c){
  const m = nf82SaleMethod(c.method), mi = typeof nf79Method === 'function' ? nf79Method(m === 'bank' ? 'bank' : m) : {l: NF82_MI[c.method] || c.method, ic: ''};
  const how = `${NF82_MI[c.method] || c.method}${c.reference ? ' · ref ' + c.reference : ''}`, when = `${bkDayLabel(String(c.created_at).slice(0, 10))}${c.payer_name ? ' · sent by ' + c.payer_name : ''}`;
  return `<div class="r nf79-cr nf82-cl" data-c="${nf82E(c.id)}"><span class="mi" title="${nf82E(mi.l)}">${typeof nf79Ic === 'function' ? nf79Ic(mi.ic, 20) : ''}</span>
    <div class="w"><b>${nf82E(c.customer_name)}</b><span class="nf82-utg">Shop utang · from their statement link</span><small class="how">${nf82E(how)}${c.proof_path ? ` · <button type="button" class="nf82-proof" onclick="nf82ShowProof('${nf82E(c.proof_path)}')">See screenshot</button>` : ''}</small></div>
    <em>${nf82P(c.amount)}</em>
    <div class="ft"><div class="bt"><button type="button" class="nf77-b p sm" onclick="nf82ClaimOk('${nf82E(c.id)}')">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 15)}It came in</button><button type="button" class="nf77-b s sm" onclick="this.closest('.nf82-cl').classList.toggle('why')">Not in yet</button></div><small class="when">${nf82E(when)}</small></div>
    <div class="nf79-why"><span>What happened?</span>${["Not in my account yet", "Wrong amount", "Can't find this payment"].map(w => `<button type="button" onclick="nf82ClaimNo('${nf82E(c.id)}', ${JSON.stringify(w).replace(/"/g, '&quot;')})">${nf82E(w)}</button>`).join('')}</div></div>`;
}
async function nf82ShowProof(path){
  let url = null;
  if(myBusiness){ try{ const { data } = await sb.storage.from('pay-proofs').createSignedUrl(path, 600); url = data && data.signedUrl; }catch(e){} }
  if(!url){ showToast("Couldn't open the screenshot. Try again.", 'warn'); return; }
  slModal('nf82Proof', `<div class="sl-sheet-h"><b>Payment screenshot</b><button class="sl-x" onclick="slClose('nf82Proof')" aria-label="Close">✕</button></div><div class="nf82-pv"><img src="${nf82E(url)}" alt="Payment screenshot sent by the customer"></div>`);
}
async function nf82ClaimOk(id){
  if(typeof requirePermission === 'function' && !requirePermission('markInvoicePaid')) return;
  const c = (NF82G.claims || []).find(x => x.id === id); if(!c || c.status !== 'pending') return;
  const k = nf82Norm(c.customer_name), m = nf82SaleMethod(c.method);
  const open = (BK.sales || []).filter(s => !s.voidedAt && !s.deletedAt && nf82Norm(s.customer) === k && bkSaleBalance(s) >= 0.01).sort((a, b) => String(nf82Due(a)).localeCompare(String(nf82Due(b))) || a.date.localeCompare(b.date));
  if(open.some(s => s.pending)){ showToast('One of their sales is still waiting to upload. Try again when the internet is back.'); return; }
  let left = Number(c.amount) || 0; const changed = [];
  for(const s of open){ if(left < 0.01) break; const use = Math.min(left, bkSaleBalance(s)); const payments = (s.payments || []).concat([{method: m, amount: Math.round(use * 100) / 100, date: APP_TODAY, by: bkMe(), ref: c.reference || null, via: 'link'}]);
    if(myBusiness){ const { error } = await sb.from('downstream_sales').update({payments}).eq('id', s.id); if(error){ showToast(error.message, 'error'); return; } }
    s.payments = payments; changed.push(s); left = Math.round((left - use) * 100) / 100; }
  if(myBusiness){ const { error } = await sb.from('utang_claims').update({status: 'confirmed', decided_by: bkMe()}).eq('id', id); if(error){ showToast(error.message, 'error'); } }
  c.status = 'confirmed'; c.decided_at = new Date().toISOString(); try{ bkSaveDemo(); }catch(e){}
  const rest = nf82UtOwes(c.customer_name);
  showToast(`${nf82P(Number(c.amount) - left)} from ${c.customer_name} saved${left >= 0.01 ? `. ${nf82P(left)} was more than they owed, so it wasn't recorded` : ''}.`, 'success');
  try{ bkRefreshViews(); }catch(e){} setTimeout(() => { try{ renderCollectionsPage(); }catch(e){} nf82Repaint(); }, 60);
  nf82Receipt({name: c.customer_name, key: 'ut:' + k, amt: Number(c.amount) - left, method: m, left: rest});
}
async function nf82ClaimNo(id, reason){
  const c = (NF82G.claims || []).find(x => x.id === id); if(!c || c.status !== 'pending') return;
  if(myBusiness){ const { error } = await sb.from('utang_claims').update({status: 'rejected', reason, decided_by: bkMe()}).eq('id', id); if(error){ showToast(error.message, 'error'); return; } }
  c.status = 'rejected'; c.reason = reason; c.decided_at = new Date().toISOString();
  showToast(`Marked not received: ${reason}. Their balance stays the same.`, 'success');
  setTimeout(() => { try{ renderCollectionsPage(); }catch(e){} nf82Repaint(); }, 60);
}

/* ---------- receipts: after any payment, one tap sends them a thank-you with what's left ---------- */
function nf82ReceiptText(o){
  const shop = myBusiness ? myBusiness.name : 'Dela Cruz Hardware', how = {cash: 'cash', gcash: 'GCash', maya: 'Maya', bank: 'bank transfer', check: 'check', card: 'card'}[o.method] || o.method || '';
  return `Salamat po, ${o.name}! Natanggap na po namin ang bayad ninyo.\nReceived: ${nf82P(o.amt)}${how ? ' (' + how + ')' : ''} on ${nf82Day(APP_TODAY)}\n${o.left >= 1 ? `Remaining balance: ${nf82P(o.left)}` : 'Fully paid na po. Salamat sa tiwala!'}\n– ${shop}`;
}
function nf82Receipt(o){
  if(!o || !(o.amt > 0)) return;
  document.querySelectorAll('.nf82-rc').forEach(x => x.remove());
  const el = document.createElement('div'); el.className = 'nf82-rc'; el.setAttribute('role', 'status');
  el.innerHTML = `<span class="ic">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 18)}</span><div class="t"><b>${nf82P(o.amt)} from ${nf82E(o.name)} saved</b><small>${o.left >= 1 ? `Still owes ${nf82P(o.left)}` : 'Fully paid'} · send them a receipt?</small></div><button type="button" class="nf82-btn p">Send receipt</button><button type="button" class="x" aria-label="No thanks">✕</button>`;
  document.body.appendChild(el);
  const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); };
  el.querySelector('.x').onclick = kill; const tm = setTimeout(kill, 14000);
  el.querySelector('.nf82-btn').onclick = async () => { clearTimeout(tm); kill(); await nf33RLoad();
    const p = Object.assign(typeof nf33RPref === 'function' && o.key && !String(o.key).startsWith('ut:') ? nf33RPref(o.key) : {channel: 'viber', phone: '', handle: '', email: ''}, (NF33R.prefs || {})[o.key] || {});
    NF33R.cur = {id: o.key || ('ut:' + nf82Norm(o.name)), g: {name: o.name, total: o.left, overdue: 0, maxLate: 0}, p, text: nf82ReceiptText(o), always: true, receipt: true, left: o.left};
    window._colPendingLog = []; window._nf82UtLog = null; nf33RSheet(); };
}
if(typeof nf79UtSave === 'function' && !nf79UtSave._nf82){
  const _us = nf79UtSave;
  nf79UtSave = async function(btn){
    const f = btn.closest('.nf79-rp'), key = f ? f.dataset.rp : '';
    if(key.startsWith('uc:')) return nf82UtPayAll(btn);
    const s = BK.sales.find(x => x.id === key.replace(/^ut:/, '')), before = s ? (s.payments || []).length : 0, v = f ? nf79RpVals(f) : {};
    const r = await _us.apply(this, arguments);
    if(s && (s.payments || []).length > before) nf82Receipt({name: s.customer, key: 'ut:' + nf82Norm(s.customer), amt: Math.min(v.amt, Number(s.payments[s.payments.length - 1].amount) || v.amt), method: v.m, left: nf82UtOwes(s.customer)});
    return r;
  };
  nf79UtSave._nf82 = true; window.nf79UtSave = nf79UtSave;
}
async function nf82UtPayAll(btn){
  if(typeof requirePermission === 'function' && !requirePermission('markInvoicePaid')) return;
  const f = btn.closest('.nf79-rp'), g = NF82G.reg[f.dataset.rp.slice(3)], v = nf79RpVals(f); if(!g) return;
  if(!(v.amt > 0)){ showToast('Type how much they paid.', 'warn'); return; }
  const open = g.items.map(x => x.sale).filter(Boolean).filter(s => bkSaleBalance(s) >= 0.01).sort((a, b) => String(nf82Due(a)).localeCompare(String(nf82Due(b))) || a.date.localeCompare(b.date));
  if(open.some(s => s.pending)){ showToast('One of their sales is still waiting to upload. Try again when the internet is back.'); return; }
  let left = v.amt;
  for(const s of open){ if(left < 0.01) break; const use = Math.min(left, bkSaleBalance(s)); const payments = (s.payments || []).concat([{method: v.m, amount: Math.round(use * 100) / 100, date: APP_TODAY, by: bkMe()}]);
    if(myBusiness){ const { error } = await sb.from('downstream_sales').update({payments}).eq('id', s.id); if(error){ showToast(error.message, 'error'); return; } }
    s.payments = payments; left = Math.round((left - use) * 100) / 100; }
  try{ bkSaveDemo(); }catch(e){}
  showToast(`Saved ${nf82P(v.amt - left)} from ${g.name}${left >= 0.01 ? ` (${nf82P(left)} more than they owed was not recorded)` : ''}.`, 'success');
  try{ bkRefreshViews(); }catch(e){} setTimeout(() => { try{ renderCollectionsPage(); }catch(e){} nf82Repaint(); }, 60);
  nf82Receipt({name: g.name, key: g.key, amt: v.amt - left, method: v.m, left: nf82UtOwes(g.name)});
}
if(typeof nf79RpSave === 'function' && !nf79RpSave._nf82){
  const _rs2 = nf79RpSave;
  nf79RpSave = function(btn){
    const f = btn.closest('.nf79-rp'), key = f ? f.dataset.rp : '', v = f ? nf79RpVals(f) : {};
    const ids = (() => { try{ let invs = unpaidInvoicesFor('supplier'); invs = key.startsWith('po:') ? invs.filter(r => r.po.id === key.slice(3)) : invs.filter(r => r.po.buyerId === key); return invs; }catch(e){ return []; } })();
    const before = ids.reduce((a, r) => a + r.balance, 0), buyer = ids[0] && ids[0].po;
    const r = _rs2.apply(this, arguments);
    try{ if(buyer && v.amt > 0){ const after = unpaidInvoicesFor('supplier').filter(x => x.po.buyerId === buyer.buyerId).reduce((a, x) => a + x.balance, 0), paid = Math.round((before - (key.startsWith('po:') ? Math.max(0, unpaidInvoicesFor('supplier').filter(x => x.po.id === key.slice(3)).reduce((a, x) => a + x.balance, 0)) : after)) * 100) / 100;
      if(paid > 0) nf82Receipt({name: buyer.buyerName, key: buyer.buyerId, amt: paid, method: v.m, left: after}); } }catch(e){}
    return r;
  };
  nf79RpSave._nf82 = true; window.nf79RpSave = nf79RpSave;
}
if(typeof confirmPaymentReceived === 'function' && !confirmPaymentReceived._nf82){
  const _cp = confirmPaymentReceived;
  confirmPaymentReceived = function(id, kind, key){
    let po = null, p = null; try{ po = getPO(id); p = po && findPayment(po, kind, key); }catch(e){}
    const was = p ? p.confirmStatus : null;
    const r = _cp.apply(this, arguments);
    try{ if(p && was !== 'confirmed' && p.confirmStatus === 'confirmed'){ const left = unpaidInvoicesFor('supplier').filter(x => x.po.buyerId === po.buyerId).reduce((a, x) => a + x.balance, 0); nf82Receipt({name: po.buyerName, key: po.buyerId, amt: Number(p.amount) || 0, method: String(p.method || '').toLowerCase(), left}); } }catch(e){}
    return r;
  };
  confirmPaymentReceived._nf82 = true; window.confirmPaymentReceived = confirmPaymentReceived;
}

/* ---------- New sale (Utang): pay-by date + utang limit, right in the popup ---------- */
function nf82QsDue(){ const q = (typeof QS !== 'undefined' && QS) || {}; const c = q.nf82due || (nf82TermsRaw() === 'payday' ? 'payday' : 'd' + nf82TermsRaw());
  if(c === 'payday') return nf82Payday(APP_TODAY); if(c === 'pick') return q.nf82dueDate || nf82DefaultDue(APP_TODAY); return addDaysIso(APP_TODAY, Number(String(c).slice(1)) || 15); }
function nf82QsDueHtml(){
  const q = QS, cur = q.nf82due || (nf82TermsRaw() === 'payday' ? 'payday' : 'd' + nf82TermsRaw()), pd = nf82Payday(APP_TODAY);
  const opts = [['payday', `Next payday · ${nf82Day(pd)}`], ['d7', '1 week'], ['d15', '15 days'], ['d30', '30 days'], ['pick', 'Pick a date']];
  if(!opts.some(o => o[0] === cur) && /^d\d+$/.test(cur)) opts.splice(1, 0, [cur, cur.slice(1) + ' days']);
  return `<section class="nf82-due"><div class="nf43-q">Pay by <small class="nf44-opt">due ${nf82E(nf82Day(nf82QsDue()))}</small></div>
    <div class="ch" role="radiogroup" aria-label="Pay by">${opts.map(([k, l]) => `<button type="button" role="radio" aria-checked="${cur === k}" class="${cur === k ? 'on' : ''}" onclick="QS.nf82due='${k}'; qsRender()">${nf82E(l)}</button>`).join('')}</div>
    ${cur === 'pick' ? `<input type="date" class="dt" min="${APP_TODAY}" value="${nf82E(q.nf82dueDate || nf82DefaultDue(APP_TODAY))}" onchange="QS.nf82dueDate=this.value; qsRender()" aria-label="Pay by date">` : ''}
    <p class="nt">They show up in Collect today when it's due, with a reminder ready to send.</p></section>`;
}
function nf82QsLimitHtml(){
  const q = QS, nm = String(q.customer || '').trim(); if(!nm || nm === 'Walk-in') return '';
  const owes = nf82UtOwes(nm), t = Math.round((typeof qsTotal === 'function' ? qsTotal() : 0) * 100) / 100, after = owes + t, lim = nf82UtLimit(nm), over = lim > 0 && after > lim, boss = nf82Boss();
  const editing = q.nf82lim;
  return `<div class="nf82-lim ${over ? 'over' : lim > 0 ? 'ok' : 'n'}" role="${over ? 'alert' : 'status'}">
    <div class="r"><span>${nf82E(nm)} owes now</span><b>${nf82P(owes)}</b></div><div class="r"><span>After this sale</span><b>${nf82P(after)}</b></div>
    ${lim > 0 ? `<div class="r"><span>Utang limit</span><b>${nf82P(lim)}</b></div>` : ''}
    ${over ? `<p class="w">${nf82Ic('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>', 16)}Over the limit by ${nf82P(after - lim)}. You can still save it.</p>` : ''}
    ${boss ? (editing ? `<div class="ed"><span class="pe"><i>₱</i><input type="text" inputmode="decimal" id="nf82LimIn" value="${lim || ''}" placeholder="No limit" aria-label="Utang limit for ${nf82E(nm)}"></span><button type="button" class="nf77-b p sm" onclick="nf82SaveLimit(${JSON.stringify(nm).replace(/"/g, '&quot;')}, document.getElementById('nf82LimIn').value)">Save limit</button><button type="button" class="nf82-lk" onclick="QS.nf82lim=false; qsRender()">Cancel</button></div>` : `<button type="button" class="nf82-lk" onclick="QS.nf82lim=true; qsRender(); setTimeout(() => { const i = document.getElementById('nf82LimIn'); if(i) i.focus(); }, 30)">${lim > 0 ? 'Change limit' : 'Set a limit for ' + nf82E(nm)}</button>`) : ''}</div>`;
}
async function nf82SaveLimit(name, val){
  const v = Math.max(0, Math.round(Number(String(val || '').replace(/[,₱\s]/g, '')) || 0)), per = Object.assign({}, bkSettings().utang_limits || {}); const k = nf82Norm(name);
  if(v > 0) per[k] = v; else delete per[k];
  if(await bkSaveSettings({utang_limits: per})){ showToast(v > 0 ? `Utang limit for ${name}: ${nf82P(v)}.` : `No utang limit for ${name}.`, 'success'); if(typeof QS !== 'undefined' && QS){ QS.nf82lim = false; qsRender(); } nf82Repaint(); }
}
if(typeof qsRender === 'function' && !qsRender._nf82){
  const _qr = qsRender;
  qsRender = function(){
    const r = _qr.apply(this, arguments);
    try{ if(QS && QS.paidWith === 'credit'){ const m = document.getElementById('qsModal'); if(m){
      const secs = [...m.querySelectorAll('.nf44-qs > section')], paid = secs.find(s => /^Paid with/.test(((s.querySelector('.nf43-q') || {}).textContent || '').trim())), cust = m.querySelector('.nf44-cust');
      if(paid && !m.querySelector('.nf82-due')) paid.insertAdjacentHTML('afterend', nf82QsDueHtml());
      const host = cust && cust.closest('section'); if(host && !m.querySelector('.nf82-lim')){ const h = nf82QsLimitHtml(); if(h) host.insertAdjacentHTML('beforeend', h); }
      if(host && !host._nf82){ host._nf82 = true; host.addEventListener('input', () => { clearTimeout(host._nf82t); host._nf82t = setTimeout(() => { const o = m.querySelector('.nf82-lim'), h = nf82QsLimitHtml(); if(o) o.outerHTML = h || ''; else if(h) host.insertAdjacentHTML('beforeend', h); }, 250); }); }
    } } }catch(e){ console.warn('nf82 qs', e); }
    return r;
  };
  qsRender._nf82 = true; window.qsRender = qsRender;
}

/* ---------- utang tracker: each utang shows its due date, changeable in place ---------- */
async function nf82SetDue(id, date){
  const s = BK.sales.find(x => x.id === id); if(!s || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return;
  if(s.pending){ showToast('This sale is still waiting to upload. Try again when the internet is back.'); return; }
  if(myBusiness){ const { error } = await sb.from('downstream_sales').update({due_date: date}).eq('id', id); if(error){ showToast(error.message, 'error'); return; } }
  s.dueDate = date; try{ bkSaveDemo(); }catch(e){} showToast(`${s.customer} pays by ${nf82Day(date)}.`, 'success');
  try{ if(typeof nf80UtPaint === 'function') nf80UtPaint(true); }catch(e){} nf82Repaint();
}
if(typeof nf80UtRow === 'function' && !nf80UtRow._nf82){
  const _ur = nf80UtRow;
  nf80UtRow = function(s){
    let html = _ur.apply(this, arguments);
    try{ if(bkSaleBalance(s) >= 1){ const due = nf82Due(s), late = daysBetween(due, APP_TODAY), lim = nf82UtLimit(s.customer);
      const line = `<div class="nf82-dl${late > 0 ? ' late' : ''}"><span>${nf82Ic('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', 15)}${late > 0 ? `<b>${late} day${late === 1 ? '' : 's'} late</b> · was due ${nf82E(nf82Day(due))}` : late === 0 ? '<b>Due today</b>' : `Pay by <b>${nf82E(nf82Day(due))}</b>`}${s.dueDate ? '' : ' <i>(your usual terms)</i>'}</span>
        <label class="ch">Change<input type="date" value="${due}" onchange="nf82SetDue('${s.id}', this.value)" aria-label="Change the pay-by date for ${nf82E(s.customer)}"></label>${lim > 0 ? `<span class="lm">Limit ${nf82P(lim)}</span>` : ''}</div>`;
      html = html.replace('<div class="prog">', line + '<div class="prog">'); } }catch(e){}
    return html;
  };
  nf80UtRow._nf82 = true; window.nf80UtRow = nf80UtRow;
}

/* ---------- settings for getting paid (reminder days, usual utang terms, utang limit) ---------- */
function nf82SetHtml(){
  const sched = nf82Sched(), terms = nf82TermsRaw(), lim = Number(bkSettings().utang_limit_default) || 0, boss = nf82Boss();
  const OFF = [-3, -2, -1, 0, 3, 7, 14, 30], lab = o => o < 0 ? `${-o} day${o === -1 ? '' : 's'} before` : o === 0 ? 'Due day' : `${o} day${o === 1 ? '' : 's'} late`;
  return `<section class="panel-card nf82-set${NF82G.setOpen ? ' open' : ''}" id="nf82Set"><button type="button" class="hd" aria-expanded="${!!NF82G.setOpen}" onclick="NF82G.setOpen=!NF82G.setOpen; nf82Repaint()"><span>${nf82Ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>', 18)}Reminder days, utang terms and limits</span><i aria-hidden="true">›</i></button>
    <div class="bd">
      <div class="gp"><b>Remind customers on these days</b><small>On these days the customer shows up in Collect today with the message ready.</small>
        <div class="ch">${OFF.map(o => `<button type="button" class="${sched.includes(o) ? 'on' : ''}" aria-pressed="${sched.includes(o)}" ${boss ? `onclick="nf82SchedToggle(${o})"` : 'disabled'}>${lab(o)}</button>`).join('')}</div></div>
      <div class="gp"><b>Shop utang is usually due</b><small>Used when a sale doesn't have its own pay-by date.</small>
        <div class="ch">${[['payday', 'Next payday (15th or month end)'], [7, '1 week'], [15, '15 days'], [30, '30 days']].map(([k, l]) => `<button type="button" class="${String(terms) === String(k) ? 'on' : ''}" aria-pressed="${String(terms) === String(k)}" ${boss ? `onclick="nf82SetTerms('${k}')"` : 'disabled'}>${l}</button>`).join('')}</div></div>
      <div class="gp"><b>Utang limit for each customer</b><small>New sale warns when someone goes over it. You can still save the sale. Set a different limit per customer in New sale.</small>
        <div class="li"><span class="pe"><i>₱</i><input type="text" inputmode="decimal" id="nf82LimDef" value="${lim || ''}" placeholder="No limit" ${boss ? '' : 'disabled'} aria-label="Utang limit for each customer"></span>${boss ? `<button type="button" class="nf77-b p sm" onclick="nf82SaveLimDef()">Save</button>` : ''}</div></div>
    </div></section>`;
}
async function nf82SchedToggle(o){ const s = nf82Sched().slice(), i = s.indexOf(o); if(i >= 0){ if(s.length === 1){ showToast('Keep at least one reminder day.', 'warn'); return; } s.splice(i, 1); } else s.push(o); s.sort((a, b) => a - b); await collSave({schedule: s}); nf82Repaint(); try{ renderCollectionsPage(); }catch(e){} }
async function nf82SetTerms(k){ if(await bkSaveSettings({utang_terms: k === 'payday' ? 'payday' : Number(k)})){ showToast(k === 'payday' ? 'Utang is due on the next payday (15th or month end).' : `Utang is due after ${k} days.`, 'success'); nf82Repaint(); try{ nf80UtPaint(true); }catch(e){} } }
async function nf82SaveLimDef(){ const v = Math.max(0, Math.round(Number(String((document.getElementById('nf82LimDef') || {}).value || '').replace(/[,₱\s]/g, '')) || 0)); if(await bkSaveSettings({utang_limit_default: v})){ showToast(v ? `Utang limit for each customer: ${nf82P(v)}.` : 'No utang limit.', 'success'); nf82Repaint(); } }

/* ---------- Getting paid: Collect today + how old on top, utang reports in Payments to confirm, settings at the bottom ---------- */
if(typeof nf77CollHtml === 'function' && !nf77CollHtml._nf82){
  const _ch = nf77CollHtml;
  nf77CollHtml = function(){
    let html = _ch.apply(this, arguments);
    try{
      const cl = nf82Claims();
      if(cl.length){
        const rows = cl.map(nf82ClaimRow).join(''), amt = cl.reduce((a, c) => a + Number(c.amount || 0), 0);
        if(/class="nf77-conf nf78-conf"/.test(html)){
          html = html.replace(/(<section class="nf77-conf nf78-conf" id="nf77Conf"><div class="h"><div><b>Payments to confirm<\/b><span>[^<]*<\/span><\/div><em>)(₱[\d,.]+)<small>(\d+) payments?<\/small><\/em><\/div>/, (m0, a, p, n) => { const tot = (Number(String(p).replace(/[₱,]/g, '')) || 0) + amt, cnt = Number(n) + cl.length; return `${a}${nf82P(tot)}<small>${cnt} payment${cnt === 1 ? '' : 's'}</small></em></div>`; });
          html = html.replace(/(<section class="nf77-conf nf78-conf" id="nf77Conf">[\s\S]*?)(<\/section>)/, (m0, a, b) => a + rows + b);
        } else html = `<section class="nf77-conf nf78-conf" id="nf77Conf"><div class="h"><div><b>Payments to confirm</b><span>Check your bank, GCash or the check first, then tap.</span></div><em>${nf82P(amt)}<small>${cl.length} payment${cl.length === 1 ? '' : 's'}</small></em></div>${rows}</section>` + html;
      }
      if(nf82Boss()) html = `<div class="nf82-top">${nf82CollectHtml('gp')}${nf82AgingHtml()}</div>` + html + nf82SetHtml();
    }catch(e){ console.warn('nf82 coll', e); }
    return html;
  };
  nf77CollHtml._nf82 = true; window.nf77CollHtml = nf77CollHtml;
}
function nf82Repaint(){
  try{ const pg = document.getElementById('page-collections'); if(pg && pg.classList.contains('active') && typeof nf77CollPaint === 'function') nf77CollPaint(); }catch(e){}
  try{ nf82HomePaint(true); }catch(e){}
}

/* ---------- Home: Collect today under the owner view ---------- */
function nf82HomePaint(force){
  const home = document.getElementById('mhHome'); if(!home || !home.offsetParent) return;
  let box = document.getElementById('nf82Home');
  if(!nf82Boss() || !BK.loaded){ if(box) box.remove(); return; }
  if(!NF82G.claims || !NF82G.remlog){ if(!NF82G.loading) nf82GLoad().then(() => nf82HomePaint(true)); }
  const rows = nf82Custs().filter(g => g.total >= 1);
  if(!rows.length){ if(box) box.remove(); return; }
  const html = nf82CollectHtml('home');
  if(!box){ box = document.createElement('div'); box.id = 'nf82Home'; }
  if(box.dataset.k !== html){ box.dataset.k = html; box.innerHTML = html; }
  const anchor = home.querySelector('.nf75-owner') || [...home.querySelectorAll('.sect')].find(s => /^What to do/.test(((s.querySelector('.sect-h h4') || {}).textContent || '').trim()));
  if(anchor){ if(anchor.nextElementSibling !== box) anchor.insertAdjacentElement('afterend', box); }
  else if(!box.isConnected){ const r = home.querySelector('.rows') || home; r.prepend(box); }
}
NF45_AFTER.push(page => { try{ if(page && page.id === 'page-dashboard') nf82HomePaint(); if(page && page.id === 'page-collections' && (!NF82G.claims || !NF82G.remlog) && !NF82G.loading) nf82GLoad().then(nf82Repaint); }catch(e){} });

/* ---------- the customer's statement page (no account): shop utang at #ut/<token>; "I paid" with a screenshot on both kinds ---------- */
function nf82DemoUtang(){
  const d = n => addDaysIso(APP_TODAY, -n);
  return {kind: 'utang', as_of: APP_TODAY, local: true, supplier: {name: 'Dela Cruz Hardware', address: 'Rizal Ave., Sta. Cruz, Manila', tin: '', contact: {phone: '0917 555 0100'}, pay_to: [{type: 'gcash', accountName: 'Ramon Dela Cruz', accountNumber: '0917 555 0100'}, {type: 'bank', bankName: 'BDO', accountName: 'Dela Cruz Hardware', accountNumber: '0012 3456 7890'}]},
    buyer: {name: 'Aling Nena'}, invoices: [{po_number: '5 × Portland Cement 40kg, 4 × Welding Rods 3.2mm', invoice_number: 'Utang · ' + nf82Day(d(29)), date: d(29), due: d(14), amount: 1620, balance: 1620, pending: 0, days_overdue: 14}],
    payments: [], aging: {current: 0, d1_30: 1620, d31_60: 0, d61_90: 0, d90p: 0}, totals: {balance: 1620, pending: 0, open_count: 1}, claims: []};
}
async function nf82LoadUtang(token){
  window._stmtToken = token; window._nf82UtTok = token;
  let d = null;
  if(token === 'demo') d = nf82DemoUtang();
  else { try{ const { data, error } = await sb.rpc('get_utang_statement', {p_token: token}); if(!error) d = data; }catch(e){} }
  if(!d){ let host = document.getElementById('statementView'); if(!host){ host = document.createElement('div'); host.id = 'statementView'; document.body.appendChild(host); }
    document.body.classList.add('statement-open'); host.innerHTML = `<div class="stmt-paper" style="text-align:center;"><div style="font-size:36px;">🔗</div><h1 style="font-size:24px;">This link isn't working</h1><p>It may have expired. Ask the shop for a new one.</p></div>`; return; }
  document.title = `Your balance at ${d.supplier && d.supplier.name || 'the shop'} · Nifti`;
  showStatementOverlay(d, {isPublic: true});
  const t = document.querySelector('#statementView .stmt-title'); if(t) t.textContent = 'YOUR BALANCE';
  const tb = [...document.querySelectorAll('#statementView .stmt-toolbar span')].find(x => /Statement of account/.test(x.textContent)); if(tb) tb.textContent = 'Your balance at ' + (d.supplier && d.supplier.name || 'the shop');
}
if(typeof handleIncomingLink === 'function' && !handleIncomingLink._nf82){
  const _hl = handleIncomingLink;
  handleIncomingLink = async function(){ const m = (location.hash || '').match(/^#ut\/([A-Za-z0-9_-]{4,64})$/); if(m){ await nf82LoadUtang(m[1]); return true; } return _hl.apply(this, arguments); };
  handleIncomingLink._nf82 = true; window.handleIncomingLink = handleIncomingLink;
}
const NF82PF = {file: null};
async function nf82Shrink(file){
  if(!file || !/^image\//.test(file.type)) return null;
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src);
  return await new Promise(res => c.toBlob(b => res(b), 'image/jpeg', 0.82));
}
function nf82PickProof(inp){
  const f = inp.files && inp.files[0]; NF82PF.file = f || null; const pv = document.getElementById('spProofPv');
  if(pv) pv.innerHTML = f ? `<img src="${URL.createObjectURL(f)}" alt="Your payment screenshot"><span>${nf82E(f.name)}</span><button type="button" class="nf82-lk" onclick="NF82PF.file=null; document.getElementById('spProof').value=''; this.parentElement.innerHTML=''">Remove</button>` : '';
}
stmtShowPaid = function(){
  const d = currentStatement && currentStatement.data; if(!d) return;
  const ut = d.kind === 'utang', due = Math.max(0, Math.round((d.totals.balance - (d.totals.pending || 0)) * 100) / 100); NF82PF.file = null;
  const opts = ut ? [['gcash', 'GCash'], ['maya', 'Maya'], ['bank_transfer', 'Bank transfer / InstaPay'], ['bank_deposit', 'Bank deposit'], ['cash', 'Cash']] : [['gcash', 'GCash'], ['maya', 'Maya'], ['bank_transfer', 'Bank transfer / InstaPay'], ['bank_deposit', 'Bank deposit'], ['check', 'Check'], ['cash', 'Cash']];
  document.getElementById('stmtShare').innerHTML = `<div class="share-box stmt-paid nf82-ip">
    <div class="h">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 20)}<b>Tell ${escapeHtml(d.supplier.name)} you paid</b></div>
    <p>It goes against your oldest ${ut ? 'utang' : 'invoices'} first. They confirm it once they see it in their account.</p>
    <div class="row-2"><div class="field"><label>Amount paid</label><input id="spAmt" type="number" min="1" step="0.01" inputmode="decimal" value="${due || ''}"></div>
      <div class="field"><label>How you paid</label><select id="spMethod">${opts.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div></div>
    <div class="row-2"><div class="field"><label>Reference no.${ut ? '' : ' (or check no.)'}</label><input id="spRef" maxlength="64" placeholder="From your GCash or bank receipt"></div>
      <div class="field"><label>Your name</label><input id="spName" maxlength="60"></div></div>
    <div class="field nf82-pf"><label for="spProof">Screenshot of your payment <small>optional, helps them find it fast</small></label>
      <label class="up">${nf82Ic('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>', 18)}<span>Add a screenshot</span><input id="spProof" type="file" accept="image/*" onchange="nf82PickProof(this)"></label><div id="spProofPv" class="pv"></div></div>
    <div id="spErr" class="err" role="alert"></div>
    <button class="btn btn-primary" id="spSend" style="width:100%;" onclick="stmtSubmitPaid()">Send to ${escapeHtml(d.supplier.name)}</button></div>`;
  document.getElementById('spAmt').focus();
};
window.stmtShowPaid = stmtShowPaid;
stmtSubmitPaid = async function(){
  const d = currentStatement && currentStatement.data; if(!d) return;
  const ut = d.kind === 'utang', amt = Number(document.getElementById('spAmt').value), method = document.getElementById('spMethod').value, ref = document.getElementById('spRef').value.trim(), name = document.getElementById('spName').value.trim();
  const err = document.getElementById('spErr'), btn = document.getElementById('spSend'), box = document.getElementById('stmtShare');
  if(!(amt > 0)){ err.textContent = 'Enter the amount you paid.'; return; }
  if(method !== 'cash' && !ref && !NF82PF.file){ err.textContent = 'Add the reference number or a screenshot so they can find it.'; return; }
  const tok = window._stmtToken;
  if(!tok || tok === 'demo'){ box.innerHTML = `<div class="share-box stmt-paid nf82-ok"><b>${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 18)}Sent (sample page).</b> In a real account the shop gets a notification, checks the money came in, then confirms it.</div>`; return; }
  err.textContent = ''; if(btn){ btn.disabled = true; btn.textContent = 'Sending…'; }
  let proof = null;
  if(NF82PF.file){ try{ const blob = await nf82Shrink(NF82PF.file); if(blob){ const path = tok + '/' + (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)) + '.jpg'; const { error } = await sb.storage.from('pay-proofs').upload(path, blob, {contentType: 'image/jpeg', upsert: false}); if(!error) proof = path; } }catch(e){} }
  const args = {p_token: tok, p_amount: amt, p_method: method, p_reference: ref || null, p_name: name || null, p_proof: proof};
  const { data, error } = await sb.rpc(ut ? 'report_utang_payment' : 'report_payment_by_link_v2', args);
  if(error){ err.textContent = error.message; if(btn){ btn.disabled = false; btn.textContent = 'Send to ' + d.supplier.name; } return; }
  box.innerHTML = `<div class="share-box stmt-paid nf82-ok"><b>${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 18)}Sent.</b> ${fmtPHP(data.applied)} is waiting for ${escapeHtml(d.supplier.name)} to confirm.${data.extra >= 1 ? ` ${fmtPHP(data.extra)} was more than what's due, so message them about it.` : ''}${proof ? ' Your screenshot is attached.' : ''} This page updates once they do.</div>`;
};
window.stmtSubmitPaid = stmtSubmitPaid;

/* ===== Round 83: one simple "Who owes you" (Home and Getting paid) =====
   Everyone who owes you in one list: late first, then due soon, then later. Three tiles on top filter it.
   Each row: name, one clear status, the amount, one main button. Tap the row for the bills and everything else. */
NF82G.f = NF82G.f || 'all'; NF82G.open = NF82G.open || {};
function nf83Rows(){
  let promises = []; try{ promises = (promisesCache || []).filter(p => p.status === 'open'); }catch(e){}
  return nf82Custs().filter(g => g.total >= 1).map(g => {
    const ml = g.maxLate, sent = g.src === 'ut' ? nf82UtToday(g) : NF82G['sent:' + g.key] === APP_TODAY;
    const pr = g.src === 'po' ? promises.find(p => p.buyer_business_id === g.key) : null;
    const bucket = ml != null && ml > 0 ? 'late' : ml != null && ml >= -7 ? 'soon' : 'later';
    return Object.assign(g, {sent, pr, bucket, score: g.total * Math.max(1, (ml || 0) + 1)});
  }).sort((a, b) => ({late: 0, soon: 1, later: 2}[a.bucket] - {late: 0, soon: 1, later: 2}[b.bucket]) || (a.bucket === 'later' ? String(a.nextDue || '9').localeCompare(String(b.nextDue || '9')) : b.score - a.score));
}
function nf83Status(g){
  if(g.pending >= 1) return `<span class="s b">Says they paid ${nf82P(Math.min(g.pending, g.total))}</span>`;
  if(g.pr && g.pr.promised_date >= APP_TODAY) return `<span class="s g">Promised ${nf82P(g.pr.amount)} by ${nf82E(nf82Day(g.pr.promised_date))}</span>`;
  if(g.maxLate == null) return '<span class="s">No due date</span>';
  if(g.maxLate > 0) return `<span class="s r">${g.maxLate} day${g.maxLate === 1 ? '' : 's'} late</span>`;
  if(g.maxLate === 0) return '<span class="s a">Due today</span>';
  return `<span class="s">Due ${nf82E(nf82Day(g.nextDue || addDaysIso(APP_TODAY, -g.maxLate)))}</span>`;
}
function nf83Main(g){
  if(g.pending >= 1) return `<button type="button" class="nf82-btn p" onclick="event.stopPropagation(); ${g.src === 'po' ? `nf77GoConfirm('${g.key}')` : `nf83GoConf()`}">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 16)}Check & confirm</button>`;
  if(g.bucket === 'later') return `<button type="button" class="nf82-btn s" onclick="event.stopPropagation(); nf83Open('${g.id}', 'pay')">Record payment</button>`;
  return `<button type="button" class="nf82-btn ${g.sent ? 's' : 'p'}" onclick="event.stopPropagation(); nf82Remind('${g.id}')">${nf82Ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 16)}${g.sent ? 'Remind again' : 'Remind'}</button>`;
}
function nf83GoConf(){ const c = document.getElementById('nf77Conf'); if(c){ c.scrollIntoView({behavior: 'smooth', block: 'start'}); } else go('collections'); }
function nf83Bills(g){
  return `<div class="bl" role="table"><div class="bh" role="row"><span>Bill</span><span>Date</span><span>Due</span><span>Owes</span></div>${g.items.slice().sort((a, b) => String(a.due || '9').localeCompare(String(b.due || '9'))).map(x => {
    const what = x.src === 'ut' ? ((x.sale && x.sale.lines || []).slice(0, 2).map(l => l.qty + ' × ' + l.product).join(', ') || 'Shop utang') : 'Order ' + String(x.po.poNumber || '').replace(/^PO-\d{4}-/, '');
    return `<div class="br" role="row"><span class="w">${nf82E(what)}</span><span>${nf82E(nf82Day(x.date))}</span><span class="${x.late > 0 ? 'r' : ''}">${x.due ? nf82E(nf82Day(x.due)) + (x.late > 0 ? ` · ${x.late}d late` : '') : '—'}</span><b>${nf82P(x.bal)}</b></div>`; }).join('')}</div>`;
}
function nf83Row(g){
  const o = NF82G.open[g.id], kind = g.src === 'ut' ? 'Shop utang' : 'Delivery order' + (g.items.length === 1 ? '' : 's');
  const pay = g.src === 'ut' ? nf79RpHtml('uc:' + g.id, Math.max(0, g.total - (g.pending || 0)), {utang: true}) : nf79RpHtml(g.key, Math.max(0, g.total - (g.pending || 0)));
  return `<div class="wr nf79-rph ${g.bucket}${o ? ' open' : ''}" data-g="${g.id}">
    <div class="hd" role="button" tabindex="0" aria-expanded="${!!o}" onclick="nf83Open('${g.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); nf83Open('${g.id}');}">
      <span class="av" aria-hidden="true">${nf82E(nf82Initials(g.name))}</span>
      <span class="nm"><b>${nf82E(g.name)}</b><small>${nf83Status(g)}<span class="k">${kind}${g.items.length > 1 ? ' · ' + g.items.length + ' bills' : ''}${g.sent ? ' · reminded today' : ''}</span></small></span>
      <b class="am">${nf82P(g.total)}</b>
      <span class="ac">${nf83Main(g)}</span>
      <span class="cv" aria-hidden="true">${nf82Ic('<path d="m9 18 6-6-6-6"/>', 18)}</span>
    </div>
    ${o ? `<div class="dt">${nf83Bills(g)}
      <div class="mo"><button type="button" class="nf82-btn s" onclick="nf79RpOpen(this)">${nf82Ic('<path d="M12 5v14M5 12h14"/>', 15)}Record payment</button><button type="button" class="nf82-btn s" onclick="nf82Remind('${g.id}')">${nf82Ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 15)}Send pay link</button><button type="button" class="nf82-btn s" onclick="nf83Qr('${g.id}')">${nf82Ic('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M17 20h4v-3"/>', 15)}Show QR to scan</button>${g.src === 'po' ? (g.pr ? `<button type="button" class="nf82-lk" onclick="colCancelPromise('${g.pr.id}')">Cancel promise</button>` : `<button type="button" class="nf82-lk" onclick="colPromise('${g.key}')">They promised to pay</button>`) : ''}</div>
      ${pay}</div>` : ''}
  </div>`;
}
function nf83Open(id, what){ NF82G.open[id] = what === 'pay' ? true : !NF82G.open[id]; nf82Repaint(); if(what === 'pay') setTimeout(() => { const r = document.querySelector(`.nf83-who .wr[data-g="${id}"] .nf79-rp`); if(r){ r.classList.add('open'); const i = r.querySelector('input'); if(i){ i.focus(); i.select(); } } }, 60); }
function nf83WhoHtml(where){
  const rows = nf83Rows(), home = where === 'home';
  const sum = b => rows.filter(g => b === 'all' || g.bucket === b), tot = b => sum(b).reduce((a, g) => a + g.total, 0);
  const f = home ? 'all' : NF82G.f, list = sum(f).slice(0, home ? 5 : 999);
  const tile = (k, l, cls) => { const n = sum(k).length; return `<button type="button" class="tl ${cls}${!home && f === k ? ' on' : ''}" ${home ? `onclick="NF82G.f='${k}'; go('collections')"` : `onclick="NF82G.f = NF82G.f === '${k}' ? 'all' : '${k}'; nf82Repaint()"`} aria-pressed="${!home && f === k}"><small>${l}</small><b>${nf82P(tot(k))}</b><span>${n} customer${n === 1 ? '' : 's'}</span></button>`; };
  let po = 0, ut = 0; rows.forEach(g => { if(g.src === 'po') po += g.total; else ut += g.total; });
  return `<section class="panel-card nf83-who" aria-labelledby="nf83WhoH${where}">
    <div class="top"><span class="ic" aria-hidden="true">${nf82Ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>', 22)}</span>
      <div class="tt"><h2 id="nf83WhoH${where}">Who owes you</h2><p><b>${nf82P(tot('all'))}</b> in utang and unpaid bills${po && ut ? ` · Shop utang ${nf82P(ut)} · Delivery orders ${nf82P(po)}` : ''}</p></div>${nf82DTPHtml()}</div>
    ${rows.length ? `<div class="tls">${tile('late', 'Late', 'r')}${tile('soon', 'Due in 7 days', 'a')}${tile('later', 'Not due yet', 'g')}</div>
      <div class="ls">${list.length ? list.map(nf83Row).join('') : '<p class="em">Nobody in this group. Tap the tile again to see everyone.</p>'}</div>`
      : `<div class="em">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 22)}<span>Nobody owes you right now. Utang and unpaid orders show up here.</span></div>`}
    <div class="ft">${home ? `<button type="button" class="nf82-lk" onclick="go('collections')">${rows.length > list.length ? `See all ${rows.length} customers ›` : 'Open Getting paid ›'}</button>` : `<button type="button" class="nf82-lk" onclick="go('sales'); setTimeout(() => { const u = document.querySelector('#page-sales .nf80-ut'); if(u) u.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 600)">Paid off and history ›</button>`}<button type="button" class="nf82-btn s" onclick="nf83BringOpen('utang')">${nf82Ic('<path d="M12 5v14M5 12h14"/>', 15)}Someone owes me</button></div>
  </section>`;
}
/* pay link + QR: for customers who aren't on Nifti, the link goes in the Viber/SMS message; at the counter they can scan this QR */
async function nf83Qr(id){
  const g = NF82G.reg[id]; if(!g) return;
  let link = null;
  if(g.src === 'ut') link = await nf82UtLink(g.name);
  else { try{ if(myBusiness){ const { data } = await sb.rpc('create_statement_link', {p_buyer: g.key}); if(data) link = appBaseUrl() + '#st/' + data; } else link = appBaseUrl() + '#st/demo'; }catch(e){} }
  if(!link){ showToast("Couldn't make the link. Check your internet.", 'warn'); return; }
  slModal('nf83Qr', `<div class="sl-sheet-h"><b>${nf82E(g.name)}'s pay link</b><button class="sl-x" onclick="slClose('nf83Qr')" aria-label="Close">✕</button></div>
    <div class="nf83-qr"><p>At the counter? Let them scan this with their phone camera. They see what they owe and how to pay you, no app or account needed.</p><div class="qb" id="nf83QrBox" aria-label="QR code for the pay link"></div><div class="ln"><span>${nf82E(link)}</span></div>
      <div class="ac"><button type="button" class="nf82-btn s" onclick="nf33RCopy(${JSON.stringify(link).replace(/"/g, '&quot;')}).then(ok => showToast(ok ? 'Link copied. Paste it in Viber or a text.' : 'Copy the link above.', ok ? 'success' : 'warn'))">Copy link</button><button type="button" class="nf82-btn p" onclick="slClose('nf83Qr'); nf82Remind('${g.id}')">Send in a message</button></div></div>`);
  try{ if(!window.QRCode) await nf82LoadScript2('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', () => window.QRCode); const box = document.getElementById('nf83QrBox'); if(box && window.QRCode) new QRCode(box, {text: link, width: 220, height: 220, colorDark: '#0B0F14', colorLight: '#FFFFFF', correctLevel: QRCode.CorrectLevel.M}); }catch(e){ const box = document.getElementById('nf83QrBox'); if(box) box.innerHTML = '<p>The QR code needs internet. Copy the link instead.</p>'; }
}
function nf82LoadScript2(src, ready){ return new Promise((res, rej) => { if(ready()) return res(); const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => res(); s.onerror = rej; document.head.appendChild(s); }); }

/* Getting paid: Payments to confirm, then Who owes you, then settings. Nothing repeated. */
if(typeof nf77CollHtml === 'function' && !nf77CollHtml._nf83){
  const _c83 = nf77CollHtml;
  nf77CollHtml = function(){
    let html = _c83.apply(this, arguments);
    try{
      if(nf82Boss()){
        html = html.replace(/<div class="nf82-top">[\s\S]*?<\/section><\/div>/, '');
        const conf = (html.match(/<section class="nf77-conf nf78-conf" id="nf77Conf">[\s\S]*?<\/section>(?=<section|<div class="nf77-rem|<section class="panel-card nf82-set|$)/) || [''])[0];
        const set = (html.match(/<section class="panel-card nf82-set[\s\S]*$/) || [''])[0];
        html = conf + nf83WhoHtml('gp') + set;
      }
    }catch(e){ console.warn('nf83 coll', e); }
    return html;
  };
  nf77CollHtml._nf83 = true; window.nf77CollHtml = nf77CollHtml;
}
nf82CollectHtml = function(where){ return nf83WhoHtml(where); };
