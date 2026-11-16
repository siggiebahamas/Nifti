/* ===== Round 31: clear colors on every summary box, money coming up you can open, red unread counts, a calmer menu foot ===== */

/* ---------- 1. Summary boxes: green good, yellow waiting, red problem, gray nothing yet, blue plain totals, teal money moved ---------- */
// No more empty white boxes: every box says something by its color.
const NF31_EXACT = {
  'sales': v => v > 0 ? 'good' : 'plain',
  'cash': v => v > 0 ? 'good' : 'plain',
  'gcash & maya': v => v > 0 ? 'warn' : 'plain',
  'utang': v => v > 0 ? 'bad' : 'plain',
  'days matched': v => v > 0 ? 'good' : 'plain',
  'owner took': v => v > 0 ? 'note' : 'plain',
  'stock bought in cash': v => v > 0 ? 'note' : 'plain',
  'deposited this month': v => v > 0 ? 'good' : 'plain',
  'collected this month': v => v > 0 ? 'good' : 'plain',
  'closed': v => v > 0 ? 'good' : 'plain',
  'stock value': v => v > 0 ? 'gray' : 'plain',
  'owed to you': v => v > 0 ? 'good' : 'plain',
  'you owe': v => v > 0 ? 'bad' : 'good',
  'you owe suppliers': v => v > 0 ? 'bad' : 'good',
};
(function(){
  const base = nfToneOf;
  const wrapped = function(el, label, valueTxt){
    const l = String(label || '').toLowerCase().replace(/\s+/g, ' ').trim(), v = nfNum(valueTxt) || 0;
    if(NF31_EXACT[l]) return NF31_EXACT[l](v, el);
    if(l.startsWith('spent')) return v > 0 ? 'bad' : 'plain';
    const t = base(el, label, valueTxt);
    if(t === 'plain') return v ? 'gray' : 'plain';
    return t;
  };
  try{ nfToneOf = wrapped; }catch(e){} window.nfToneOf = wrapped;
})();

/* ---------- 2. Menu: plans and help as two quiet rows at the bottom ---------- */
function nf31PlanChip(){
  try{ const s = nf26PlanNow(); if(s.pending) return 'Checking';
    const p = NF26_PLANS.find(x => x.k === s.plan); return p ? p.name : 'Free'; }catch(e){ return ''; }
}

/* ---------- 3. Money overview: what's coming in and going out, each one opens ---------- */
const NF31N = {items: []};
function nf31NextItems(){
  const items = [];
  try{ unpaidInvoicesFor('supplier').forEach(x => items.push({k: 'in', d: x.due && x.due > APP_TODAY ? x.due : APP_TODAY, amt: x.balance, what: 'To collect · ' + (x.po.invoice && x.po.invoice.number || x.po.poNumber), who: x.po.buyerName, late: x.daysOverdue > 0, days: x.daysOverdue, po: x.po, file: x.po.invoice && x.po.invoice.attachmentName})); }catch(e){}
  try{ unpaidInvoicesFor('buyer').forEach(x => items.push({k: 'bill', d: x.due && x.due > APP_TODAY ? x.due : APP_TODAY, amt: -x.balance, what: 'To pay · ' + (x.po.invoice && x.po.invoice.number || x.po.poNumber), who: x.po.supplierName, late: x.daysOverdue > 0, days: x.daysOverdue, po: x.po, file: x.po.invoice && x.po.invoice.attachmentName})); }catch(e){}
  try{ const rec = {}; BK.expenses.filter(e => !e.deletedAt && e.repeat && (e.status || 'approved') === 'approved').forEach(e => { if(!rec[e.category] || e.date > rec[e.category].date) rec[e.category] = e; });
    Object.values(rec).forEach(e => { const day = String(e.date).slice(8, 10); let m = APP_TODAY.slice(0, 7);
      for(let i = 0; i < 2; i++){ const d = m + '-' + day; if(d > APP_TODAY && d <= addDaysIso(APP_TODAY, 45)){ items.push({k: 'exp', d, amt: -e.amount, what: e.category, who: e.vendor || '', cat: e.category, last: e, file: e.receipt ? 'Last bill photo' : (!myBusiness ? 'Last bill photo' : '')}); break; } m = bkNextMonth(m); } }); }catch(e){}
  try{ const lastPay = (typeof PR !== 'undefined' ? PR.runs : []).filter(r => r.status === 'paid').sort((a, b) => String(b.paid_on).localeCompare(String(a.paid_on)))[0];
    if(lastPay){ const lines = PR.lines.filter(l => l.run_id === lastPay.id), net = lines.reduce((a, l) => a + Number(l.net || 0), 0), gap = Math.max(7, daysBetween(lastPay.period_from, lastPay.period_to) + 1);
      let d = addDaysIso(lastPay.paid_on, gap); while(d <= APP_TODAY) d = addDaysIso(d, gap);
      if(d <= addDaysIso(APP_TODAY, 45)) items.push({k: 'pay', d, amt: -net, what: 'Payroll', who: lines.length + ' ' + (lines.length === 1 ? 'person' : 'people'), run: lastPay, lines}); } }catch(e){}
  return items.sort((a, b) => a.d.localeCompare(b.d) || (b.amt - a.amt));
}
const NF31_IC = {
  in: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
};
function nf31NextHtml(){
  const items = nf31NextItems(); NF31N.items = items;
  if(!items.length) return '';
  const show = items.slice(0, myBusiness ? 8 : 4), tIn = items.filter(x => x.amt > 0).reduce((a, x) => a + x.amt, 0), tOut = -items.filter(x => x.amt < 0).reduce((a, x) => a + x.amt, 0);
  return `<section class="panel-card nf31-next"><div class="panel-head"><h2>Coming up: money in and out</h2><span class="nf31-sum"><b class="g">+${bkPeso(tIn)}</b> in · <b class="r">−${bkPeso(tOut)}</b> out · next 45 days</span></div>
    <p class="nf31-hint">Tap any line to see what it is, the order or bill behind it, and any file attached.</p>
    <div class="nf31-list">${show.map((x, i) => `<button type="button" class="nf31-row ${x.amt > 0 ? 'in' : 'out'}${x.late ? ' late' : ''}" onclick="nf31Open(${i})">
      <span class="nf31-ic">${x.amt > 0 ? NF31_IC.in : NF31_IC.out}</span>
      <span class="nf31-m"><b>${escapeHtml(x.what)}</b><small>${escapeHtml(x.who || (x.k === 'exp' ? 'Every month' : ''))}${x.file ? ` · <span class="nf31-f">${NF31_IC.file}${escapeHtml(x.k === 'exp' ? 'photo' : 'file')}</span>` : ''}</small></span>
      <span class="nf31-d"><b>${x.d === APP_TODAY ? 'Today' : escapeHtml(bkDayLabel(x.d))}</b>${x.late ? `<small class="late">${x.days} day${x.days === 1 ? '' : 's'} late</small>` : ''}</span>
      <span class="nf31-a">${x.amt > 0 ? '+' : '−'}${bkPeso(Math.abs(x.amt))}</span><span class="nf31-go">${NF31_IC.go}</span></button>`).join('')}</div>
    ${items.length > show.length ? `<p class="nf31-more">${items.length - show.length} more after these.</p>` : ''}</section>`;
}
function nf31DemoBill(x){
  const e = x.last, amt = bkPeso(e.amount), due = bkDayLabel(x.d);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="780" viewBox="0 0 600 780"><rect width="600" height="780" fill="#fbfaf7"/><rect x="0" y="0" width="600" height="96" fill="#2b4b6f"/><text x="36" y="58" font-family="Arial" font-size="30" font-weight="700" fill="#fff">${(e.category || 'Bill').toUpperCase()} BILL</text><text x="36" y="84" font-family="Arial" font-size="16" fill="#dbe6f2">${(e.vendor || 'Service provider').replace(/[<&]/g, '')} · sample photo</text>
  <g font-family="Arial" fill="#222" font-size="18"><text x="36" y="150">Account name: Dela Cruz Hardware</text><text x="36" y="182">Account no.: 0412-5532-08</text><text x="36" y="214">Billing period: last month</text></g>
  <line x1="36" y1="250" x2="564" y2="250" stroke="#ccc" stroke-width="2"/><g font-family="Arial" font-size="18" fill="#333"><text x="36" y="292">This month's charges</text><text x="564" y="292" text-anchor="end">${amt}</text><text x="36" y="328">Previous balance</text><text x="564" y="328" text-anchor="end">₱0.00</text></g>
  <rect x="36" y="370" width="528" height="110" rx="10" fill="#eef3f8" stroke="#2b4b6f" stroke-width="2"/><text x="60" y="416" font-family="Arial" font-size="20" fill="#2b4b6f">TOTAL AMOUNT DUE</text><text x="540" y="458" text-anchor="end" font-family="Arial" font-size="40" font-weight="700" fill="#111">${amt}</text>
  <text x="36" y="530" font-family="Arial" font-size="20" fill="#b42318" font-weight="700">Please pay by ${due}</text><g fill="#999"><rect x="36" y="600" width="528" height="70" fill="none" stroke="#bbb" stroke-dasharray="6 6"/></g><text x="300" y="642" font-family="Arial" font-size="16" text-anchor="middle" fill="#888">Demo shop: a made-up bill to show how photos look</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function nf31Open(i){
  const x = NF31N.items[i]; if(!x) return;
  const row = (a, b, cls) => `<div class="nf31-kv${cls ? ' ' + cls : ''}"><span>${a}</span><b>${b}</b></div>`;
  let head = '', body = '', acts = '';
  if(x.po){
    const po = x.po, inv = po.invoice || {}, tot = typeof poTotal === 'function' ? poTotal(po) : 0, paid = Math.max(0, Math.round(tot - Math.abs(x.amt))), sell = x.k === 'in';
    head = `<div class="nf31-ph ${sell ? 'in' : 'out'}"><em>${sell ? 'Money coming in' : 'Bill to pay'}</em><h3>${escapeHtml(x.what)}</h3><p>${sell ? 'From' : 'To'} <b>${escapeHtml(x.who || '')}</b> · order ${escapeHtml(po.poNumber || '')}</p><div class="nf31-big">${bkPeso(Math.abs(x.amt))}</div>${x.late ? `<span class="nf31-late">${x.days} day${x.days === 1 ? '' : 's'} late</span>` : `<span class="nf31-due">Due ${escapeHtml(bkDayLabel(x.d))}</span>`}</div>`;
    body = `<h4>What it's for</h4><div class="nf31-items">${(po.lineItems || []).map(l => `<div><span>${Number(l.qty) || 0} × ${escapeHtml(l.product || '')}</span><b>${bkPeso((Number(l.qty) || 0) * (Number(l.unitPrice) || 0))}</b></div>`).join('') || '<p>No items on this order.</p>'}</div>
      ${row('Order total', bkPeso(typeof poTotal === 'function' ? poTotal(po) : 0))}${paid ? row('Paid so far', '−' + bkPeso(paid), 'g') : ''}${row(sell ? 'Still to collect' : 'Still to pay', bkPeso(Math.abs(x.amt)), 'strong')}
      ${inv.issuedDate ? row('Invoice date', escapeHtml(bkDayLabel(inv.issuedDate))) : ''}${inv.dueDate ? row('Due date', escapeHtml(bkDayLabel(inv.dueDate))) : ''}
      <h4>Files</h4>${x.file ? `<button type="button" class="nf31-file" onclick="nf31File('${escapeHtml(String(x.file)).replace(/'/g, '&#39;')}')">${NF31_IC.file}<span><b>${escapeHtml(x.file)}</b><small>Tap to open</small></span></button>` : `<p class="nf31-none">No file attached to this ${sell ? 'invoice' : 'bill'} yet.</p>`}`;
    acts = `<button type="button" class="btn btn-primary" onclick="slClose('nf31Next'); openOrderDetailModal('${po.id}', ${sell})">Open order ${escapeHtml(String(po.poNumber || '').replace(/^PO-\d{4}-/, ''))}</button>${sell ? `<button type="button" class="btn btn-outline" onclick="slClose('nf31Next'); go('collections')">Getting paid</button>` : `<button type="button" class="btn btn-outline" onclick="slClose('nf31Next'); pickLens('collections','buyer')">Bills to pay</button>`}`;
  } else if(x.k === 'exp'){
    const e = x.last, hist = BK.expenses.filter(y => !y.deletedAt && y.category === x.cat && (y.status || 'approved') === 'approved').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
    const photo = e.receipt || (!myBusiness ? nf31DemoBill(x) : '');
    head = `<div class="nf31-ph out"><em>Monthly bill</em><h3>${escapeHtml(x.what)}</h3><p>${e.vendor ? 'To <b>' + escapeHtml(e.vendor) + '</b> · ' : ''}paid from ${escapeHtml(({cash: 'the cash drawer', bank: 'the bank', gcash: 'GCash', maya: 'Maya'})[e.paidFrom] || e.paidFrom || 'cash')}</p><div class="nf31-big">about ${bkPeso(e.amount)}</div><span class="nf31-due">Usually paid around ${escapeHtml(bkDayLabel(x.d))}</span></div>`;
    body = `<h4>Last ${hist.length} time${hist.length === 1 ? '' : 's'}</h4><div class="nf31-items">${hist.map(y => `<div><span>${escapeHtml(bkDayLabel(y.date))}${y.by ? ' · by ' + escapeHtml(y.by) : ''}</span><b>${bkPeso(y.amount)}</b></div>`).join('')}</div>
      <h4>Last bill photo</h4>${photo ? `<button type="button" class="nf31-photo" onclick="bkShowPhoto(${JSON.stringify(photo).replace(/"/g, '&quot;')})"><img src="${/^data:/.test(photo) ? photo : ''}" alt="" data-ref="${escapeHtml(photo)}"><span>Tap to see it big</span></button>` : `<p class="nf31-none">No photo of the last bill. Next time, snap it when you record the expense.</p>`}`;
    acts = `<button type="button" class="btn btn-primary" onclick="slClose('nf31Next'); go('expenses')">See all expenses</button>`;
  } else if(x.k === 'pay'){
    head = `<div class="nf31-ph out"><em>Payroll</em><h3>Next payday</h3><p>Same as the last one, ${escapeHtml(x.who)}</p><div class="nf31-big">${bkPeso(Math.abs(x.amt))}</div><span class="nf31-due">${escapeHtml(bkDayLabel(x.d))}</span></div>`;
    body = `<h4>Who gets paid (last time)</h4><div class="nf31-items">${x.lines.map(l => `<div><span>${escapeHtml(l.staff_name || l.name || 'Staff')}</span><b>${bkPeso(l.net)}</b></div>`).join('')}</div>`;
    acts = `<button type="button" class="btn btn-primary" onclick="slClose('nf31Next'); go('payroll')">Open payroll</button>`;
  }
  slModal('nf31Next', `<div class="sl-sheet-h"><b>${x.amt > 0 ? 'Coming in' : 'Going out'}</b><button class="sl-x" onclick="slClose('nf31Next')" aria-label="Close">✕</button></div><div class="nf31-pop">${head}${body}<div class="nf31-acts">${acts}</div></div>`);
  // real receipt photos need a short signed link
  document.querySelectorAll('.nf31-photo img[data-ref]').forEach(async im => { const ref = im.dataset.ref; if(!ref || /^data:/.test(ref) || !myBusiness) return;
    try{ const { data } = await sb.storage.from('receipts').createSignedUrl(ref, 300); if(data) im.src = data.signedUrl; }catch(e){} });
}
function nf31File(name){
  if(!myBusiness){ showToast('Demo shop: "' + name + '" is a sample file name. In your own account the real file opens here.', 'info'); return; }
  try{ for(const c of allConversations()){ const m = (c.messages || []).find(x => x.attachment && x.attachment.name === name && x.attachment.path);
      if(m){ nf29Url(m.attachment.path, name, true).then(u => { if(u) window.open(u, '_blank', 'noopener'); }).catch(() => showToast("Couldn't open the file.", 'error')); return; } } }catch(e){}
  showToast('This file is kept with the order. Open the order to see it.', 'info');
}

/* ---------- 4. Messages: red unread counts, and Team / Customers / Suppliers in their own colors ---------- */
function nf31TagConv(){
  const l = document.getElementById('convList'); if(!l) return;
  let g = '';
  [...l.children].forEach(el => {
    if(el.classList.contains('nfw-gh')){ const t = (el.querySelector('span') || el).textContent.trim().toLowerCase(); g = /team/.test(t) ? 'team' : /supplier/.test(t) ? 'sup' : /customer|buyer/.test(t) ? 'cus' : '';
      if(g && el.dataset.nf31 !== g){ el.dataset.nf31 = g; } return; }
    if(el.classList.contains('conv-item') && g && el.dataset.nf31 !== g) el.dataset.nf31 = g;
  });
}
function nf31WatchConv(){
  const l = document.getElementById('convList'); if(!l || l._nf31) return; l._nf31 = true;
  try{ new MutationObserver(() => nf31TagConv()).observe(l, {childList: true}); }catch(e){}
  nf31TagConv();
}

/* ---------- 5. Help: a red count beside Help in the menu when the Nifti team answers ---------- */
function nf31HelpDemo(){
  if(typeof nf25Real === 'function' && nf25Real()) return; if(NF26B._nf31) return; NF26B._nf31 = true;
  const t = (h, m) => { const d = new Date(APP_TODAY + 'T00:00:00'); d.setHours(h, m); return d.toISOString(); };
  NF26B.help = [{message: 'Hi, how do I put my GCash QR on my bills?', from_admin: false, from_name: 'You', created_at: t(9, 12)},
    {message: 'Hi! Go to Settings, then "How customers pay you", and tap Add GCash QR. Take a photo of your QR and save. It shows on every bill from then on.', from_admin: true, created_at: t(9, 40), _new: true}];
  NF26B.unread = 1; try{ nf26HelpBadge(); }catch(e){}
}

/* ---------- wiring ---------- */
(function(){
  try{ window.lgForecastHtml = nf31NextHtml; lgForecastHtml = nf31NextHtml; }catch(e){ console.warn('nf31 next', e); }
  const hp = window.nf26Help;
  if(typeof hp === 'function' && !hp._nf31){ const w = function(){ const r = hp.apply(this, arguments); if(!(typeof nf25Real === 'function' && nf25Real())){ NF26B.unread = 0; try{ nf26HelpBadge(); }catch(e){} } return r; }; w._nf31 = true; window.nf26Help = w; try{ nf26Help = w; }catch(e){} }
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ nf31HelpDemo(); nf26HelpBadge(); }catch(e){} try{ if(page && page.id === 'page-messages') nf31WatchConv(); }catch(e){ console.warn('nf31 conv', e); } };
  window.nf26AfterPass = nf26AfterPass;
})();
