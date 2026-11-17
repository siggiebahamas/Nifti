/* ===== Round 43: paint once per click, header pills, popups, page fixes ===== */


/* ---------- 2. Header pills: a title that says what it is, the number under it, a colored icon ----------
   Reads the numbers each page already works out and draws them as one row of equal pills. Colors: red = act today,
   yellow = check it or due soon, green = done or money in, blue = good to know, gray = for reference. */
const NF43_ICON = {
  chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>', cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>', peso: '<path d="M8 20V4h5a4 4 0 0 1 0 8H8"/><path d="M5 8h13M5 11h13"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/>', cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  hour: '<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9"/>', check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>', box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>', tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M15 11.5c3 .3 6 1.5 6 3.5c0 1.7-2.7 3-6 3-1.5 0-2.9-.3-4-.8"/>', phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', note: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-4v4M17 13.5h.01"/>', cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l3 12h11l2-8H6.5"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  up: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>', in: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>', out: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 3h16"/>', flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', thumb: '<path d="M7 11v10H3V11zM7 11l4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 17.7 21H7"/>',
  pct: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>', clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
};
const nf43Svg = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NF43_ICON[n] || ''}</svg>`;
const nf43Num = s => { const m = String(s || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : NaN; };
const nf43Zero = v => /^\s*₱?\s*0(\.0+)?\s*$/.test(String(v || ''));
const nf43Plural = (n, w) => `${n} ${w}${Number(n) === 1 ? '' : 's'}`;
// each rule: [label test, (tile) => pill or null]. A pill: {t: title, tone, ic, v: value, sm: small text beside it}
const NF43_PAGES = {
  dashboard: {sel: '#mhHome .mosaic.num', rules: [
    [/^Sales this month/i, x => ({t: 'Sales this month', tone: 'blu', ic: 'chart', v: x.v})],
    [/^Cash today/i, x => ({t: 'Cash to count tonight', tone: 'yel', ic: 'cash', v: x.v.replace(/\s*expected\s*$/i, '')})],
    [/^Owed to you/i, x => ({t: /all of it is overdue/i.test(x.s) ? 'Overdue to collect' : 'Owed to you', tone: /overdue/i.test(x.s) ? 'red' : 'grn', ic: 'peso', v: x.v})],
    [/^You owe suppliers/i, x => ({t: 'Supplier bills due', tone: 'yel', ic: 'card', v: x.v})],
  ]},
  orders: {sel: '#nfoStats', rules: [
    [/^Needs you now/i, x => ({t: 'Need you today', tone: 'red', ic: 'alert', ...nf43Split(x.v)})],
    [/^Coming up/i, x => ({t: 'Due this week', tone: 'yel', ic: 'cal', ...nf43Split(x.v)})],
    [/^Waiting on them/i, x => ({t: 'Waiting on others', tone: 'blu', ic: 'hour', ...nf43Split(x.v)})],
    [/^All good/i, x => ({t: 'Done and paid', tone: 'grn', ic: 'check', ...nf43Split(x.v)})],
  ]},
  inventory: {sel: '#inventoryMainView .bk-stock-t', rules: [
    [/^Reorder now/i, x => ({t: 'Reorder today', tone: 'red', ic: 'box', v: nf43Plural(nf43Num(x.v), 'item')})],
    [/^Missing this month/i, x => ({t: 'Missing in counts', tone: 'yel', ic: 'search', v: x.v})],
    [/^Bad stock/i, x => ({t: 'Damaged or expired', tone: 'yel', ic: 'trash', v: x.v})],
    [/^Promised to customers/i, x => nf43Zero(x.v) ? null : ({t: 'Set aside for orders', tone: 'blu', ic: 'tag', v: nf43Plural(nf43Num(x.v), 'item')})],
    [/^Last count/i, () => null],
    [/^Stock value/i, x => ({t: 'Stock value', tone: 'grn', ic: 'coins', v: x.v})],
  ]},
  sales: {sel: '#page-sales .bk-tiles', rules: [
    [/^Sales$/i, x => ({t: 'Sales today', tone: 'grn', ic: 'chart', v: x.v, sm: /\d+ sales?/i.test(x.s) ? x.s : ''})],
    [/^Cash$/i, x => ({t: 'Cash for the drawer', tone: 'blu', ic: 'cash', v: x.v})],
    [/^GCash/i, x => nf43Zero(x.v) ? null : ({t: 'GCash & Maya to check', tone: 'yel', ic: 'phone', v: x.v})],
    [/^Utang/i, x => nf43Zero(x.v) ? null : ({t: 'Utang today', tone: 'gry', ic: 'note', v: x.v})],
  ]},
  expenses: {sel: '#page-expenses .bk-tiles', rules: [
    [/^Spent in/i, x => ({t: 'Spent this month', tone: 'red', ic: 'wallet', v: x.v})],
    [/^Stock bought/i, x => nf43Zero(x.v) ? null : ({t: 'Stock paid in cash', tone: 'blu', ic: 'cart', v: x.v})],
    [/^Owner took/i, x => nf43Zero(x.v) ? null : ({t: 'Owner took out', tone: 'blu', ic: 'user', v: x.v})],
  ]},
  profit: {sel: '#page-profit .bk-tiles', rules: [
    [/^Sales$/i, x => ({t: 'Sales this month', tone: 'grn', ic: 'chart', v: x.v})],
    [/^Cost of what you sold/i, x => { const n = nf43Num((x.s.match(/(\d+) items? ha(ve|s) no cost/i) || [])[1]); const out = [{t: 'Cost of what you sold', tone: 'blu', ic: 'tag', v: x.v}]; if(n > 0) out.push({t: 'Items with no cost', tone: 'gry', ic: 'alert', v: String(n), go: "nf43NoCost()"}); return out; }],
    [/^Profit before expenses/i, x => ({t: 'Profit before expenses', tone: 'grn', ic: 'up', v: x.v, sm: (x.s.match(/\d+(\.\d+)?%/) || [''])[0]})],
  ]},
  money: {sel: '#page-money .bk-tiles', rules: [
    [/^Owed to you/i, x => ({t: 'Owed to you', tone: 'grn', ic: 'in', v: x.v})],
    [/^You owe/i, x => ({t: 'You owe suppliers', tone: 'red', ic: 'out', v: x.v})],
  ]},
  issues: {sel: '#page-issues .bk-tiles', rules: [
    [/^To check/i, x => { const all = nf43Num(x.v), urg = nf43Num((x.s.match(/(\d+) important/i) || [])[1]) || 0, other = Math.max(0, all - urg), out = [];
      if(urg) out.push({t: 'Urgent to check', tone: 'red', ic: 'flag', v: String(urg)}); if(other) out.push({t: urg ? 'Other to check' : 'To check', tone: 'blu', ic: 'list', v: String(other)}); return out; }],
    [/^Money involved/i, x => nf43Zero(x.v) ? null : ({t: 'Money at risk', tone: 'yel', ic: 'alert', v: x.v})],
    [/^Closed/i, x => nf43Zero(x.v) ? null : ({t: 'Closed this month', tone: 'grn', ic: 'check', v: x.v})],
  ]},
  followups: {sel: '#page-followups .sl-tiles', rules: [
    [/^Waiting for/i, x => ({t: "Waiting for the customer's OK", tone: 'yel', ic: 'hour', v: x.v, sm: (x.s.match(/^\d+ orders?/i) || [''])[0]})],
    [/^Said yes/i, x => ({t: 'Said yes', tone: 'grn', ic: 'thumb', v: x.v, sm: (x.s.match(/₱[\d,]+/) || [''])[0]})],
  ]},
  books: {sel: '#page-books .cq-tiles', empty: true, rules: [
    [/^Sales \(gross\)/i, x => ({t: 'Sales before tax', tone: 'blu', ic: 'note', v: x.v})],
    [/^VAT you collected/i, x => ({t: 'VAT you collected', tone: 'blu', ic: 'pct', v: x.v})],
    [/^VAT-exempt/i, x => ({t: 'VAT-free sales', tone: 'blu', ic: 'pct', v: x.v})],
    [/^Tax withheld/i, x => ({t: 'Tax withheld (2307)', tone: 'yel', ic: 'clip', v: x.v})],
  ]},
};
function nf43Split(v){ const m = String(v).match(/^(\d+)\s+(orders?)\s*(.*)$/i); return m ? {v: m[1], sm: m[2] + (m[3] ? ' · ' + m[3] : '')} : {v}; }
function nf43Read(tile){
  const tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
  const q = sel => tile.querySelector(sel);
  if(q('.tx')) return {k: tx(q('.tx .k')), v: tx(q('.tx .v')), s: tx(q('.tx .s'))};
  if(q('.bk-tile-l')) return {k: tx(q('.bk-tile-l')), v: tx(q('.bk-tile-v')), s: tx(q('.bk-tile-s'))};
  if(q('.cq-tile-l')) return {k: tx(q('.cq-tile-l')), v: tx(q('.cq-tile-v')), s: tx(q('.cq-tile-n'))};
  if(q('.k') && q('.ln')) return {k: tx(q('.k')), v: tx(q('.ln')), s: ''};
  return {k: tx(q(':scope > small')), v: tx(q(':scope > b')), s: tx(q(':scope > span'))};
}
// Columns: as many equal pills per row as fit their longest title or number, and never one pill alone on the last row.
function nf43Cols(n, w, need, gap){
  let c = n;
  while(c > 1 && (w - (c - 1) * gap) / c < need) c--;
  while(c > 2 && n % c === 1) c--;
  if(c === 2 && n % 2 === 1) c = 1;
  return Math.max(1, c);
}
function nf43Pills(page){
  if(!page) return; const id = page.id.replace('page-', ''), cfg = NF43_PAGES[id]; if(!cfg) return;
  // Stock: make sure the Reorder and Stock value boxes exist first (they are added by another pass that can run later)
  if(id === 'inventory' && typeof nf18Stock === 'function'){ try{ nf18Stock(); }catch(e){} }
  page.querySelectorAll(cfg.sel).forEach(box => nf43PillsFor(box, cfg));
}
function nf43PillsFor(box, cfg){
  const tiles = [...box.children].filter(e => e.nodeType === 1 && !e.classList.contains('nf43-pills'));
  const pills = [];
  tiles.forEach((tile, i) => { const x = nf43Read(tile); const r = cfg.rules.find(([re]) => re.test(x.k)); if(!r) return; let p = r[1](x); if(!p) return; (Array.isArray(p) ? p : [p]).forEach(q => { if(q && q.v !== '' && q.v != null){ q.i = i; pills.push(q); } }); });
  let row = box.nextElementSibling && box.nextElementSibling.classList.contains('nf43-pills') ? box.nextElementSibling : null;
  const allZero = cfg.empty && tiles.length && (pills.length ? pills.every(q => nf43Zero(q.v)) : tiles.every(t => nf43Zero(nf43Read(t).v)));
  if(!pills.length && !allZero){ if(row) row.remove(); box.classList.remove('nf43-old'); box.style.removeProperty('display'); return; }
  const buying = /Buying from suppliers/i.test(((box.closest('section, .panel-card, .nf-half') || {}).textContent || '').slice(0, 200));
  const html = allZero ? (buying ? `<div class="nf43-empty"><b>No supplier bills this month yet</b><span>Bills you record from suppliers show up here.</span></div>` : `<div class="nf43-empty"><b>No bills this month yet</b><span>Bills you make in Orders show up here, ready for your bookkeeper.</span></div>`)
    : pills.map(q => `<button type="button" class="nf43-pill t-${q.tone}" data-i="${q.i}" ${q.go ? `data-go="${escapeHtml(q.go)}"` : ''}><span class="ic">${nf43Svg(q.ic)}</span><span class="tx"><span class="k">${escapeHtml(q.t)}</span><span class="v">${escapeHtml(q.v)}${q.sm ? `<span class="sm">${escapeHtml(q.sm)}</span>` : ''}</span></span></button>`).join('');
  if(!row){ row = document.createElement('div'); row.className = 'nf43-pills'; box.insertAdjacentElement('afterend', row); // after the hidden old row, so passes that place things before it keep their spot
    row.addEventListener('click', e => { const b = e.target.closest('.nf43-pill'); if(!b) return; if(b.dataset.go){ try{ (new Function(b.dataset.go))(); }catch(err){} return; } const t = [...box.children].filter(el => !el.classList.contains('nf43-pills'))[Number(b.dataset.i)]; if(t){ const c = t.matches('button,[onclick],a') ? t : t.querySelector('button,[onclick],a'); if(c) c.click(); else t.click(); } });
    try{ new ResizeObserver(() => nf43Fit(row)).observe(row); }catch(e){} }
  if(row.dataset.k !== html){ row.dataset.k = html; row.innerHTML = html; }
  row.dataset.n = allZero ? 0 : pills.length;
  box.classList.add('nf43-old'); box.style.setProperty('display', 'none', 'important'); nf43Fit(row);
}
function nf43Fit(row){
  if(!row || !row.isConnected || !row.parentElement) return;
  const n = Number(row.dataset.n) || 0; if(!n) return;
  const phone = document.documentElement.classList.contains('nf-phone') || window.innerWidth <= 760;
  let c = 1;
  if(!phone){
    let need = 0; row.querySelectorAll('.nf43-pill').forEach(p => { const k = p.querySelector('.k'), v = p.querySelector('.v'), ic = p.querySelector('.ic'), cs = getComputedStyle(p); const over = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) * 2 + ic.offsetWidth + parseFloat(cs.columnGap || cs.gap || 0) + 2; const tw = el => { const r = document.createRange(); r.selectNodeContents(el); return Math.ceil(r.getBoundingClientRect().width); }; need = Math.max(need, over + Math.max(tw(k), tw(v))); });
    c = nf43Cols(n, row.clientWidth || row.parentElement.clientWidth, need, 12);
  }
  if(row.style.getPropertyValue('--cols') !== String(c)) row.style.setProperty('--cols', String(c));
}
function nf43NoCost(){ try{ navigate('profit'); const el = document.querySelector('#page-profit table'); if(el) el.scrollIntoView({behavior: 'smooth', block: 'start'}); }catch(e){} }
(function(){
  if(typeof nf26AfterPass !== 'function') return;
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ nf43Pills(page); }catch(e){ console.warn('nf43 pills', e); } };
  window.nf26AfterPass = nf26AfterPass;
})();

/* ---------- 3. One popup frame for every popup ----------
   Title and close on top, the form in the middle (it scrolls), the buttons pinned at the bottom with the main one on
   the right. Popups built with slModal are rearranged into this frame when they open, so every popup looks and works
   the same on a computer and as a bottom sheet on a phone. */
function nf43IsBtnRow(el){
  if(!el || el.nodeType !== 1) return false;
  if(el.matches('.sl-err, .nf43-pf')) return false;
  if(el.matches('button.btn, a.btn')) return true;
  const kids = [...el.children]; if(!kids.length || kids.length > 4) return false;
  return kids.every(k => k.matches('button, a.btn, .btn')) && !!el.querySelector('.btn-primary, .btn');
}
function nf43Frame(m){
  const sheet = m && m.querySelector(':scope > .sl-sheet'); if(!sheet || sheet.classList.contains('nf43-pop') || sheet.classList.contains('nf42-sheet')) return;
  const head = sheet.querySelector(':scope > .sl-sheet-h');
  const kids = [...sheet.children].filter(k => k !== head);
  const foot = []; let i = kids.length - 1;
  while(i >= 0 && nf43IsBtnRow(kids[i]) && foot.length < 3){ foot.unshift(kids[i]); i--; }
  if(i >= 0 && kids[i].matches('.sl-err') && foot.length){ foot.unshift(kids[i]); i--; }
  const body = document.createElement('div'); body.className = 'nf43-pb';
  kids.slice(0, i + 1).forEach(k => body.appendChild(k));
  sheet.classList.add('nf43-pop'); if(sheet.querySelector('table')) sheet.classList.add('nf43-wide');
  if(head) head.after(body); else sheet.prepend(body);
  if(foot.length){
    const f = document.createElement('div'); f.className = 'nf43-pf';
    const err = foot[0].matches('.sl-err') ? foot.shift() : null; if(err) f.appendChild(err);
    const row = document.createElement('div'); row.className = 'nf43-pfr';
    const btns = [], shells = []; foot.forEach(x => { if(x.matches('button, a.btn')) btns.push(x); else { [...x.children].forEach(c => btns.push(c)); shells.push(x); } });
    btns.forEach(b => b.classList.remove('sl-wide'));
    const prim = btns.filter(b => b.classList.contains('btn-primary')), rest = btns.filter(b => !b.classList.contains('btn-primary'));
    const hasCancel = rest.some(b => /^(cancel|close|not now|back|no)\b/i.test(b.textContent.trim()));
    if(!hasCancel && prim.length){ const c = document.createElement('button'); c.type = 'button'; c.className = 'btn btn-ghost nf43-cancel'; c.textContent = 'Cancel'; c.onclick = () => m.remove(); row.appendChild(c); }
    rest.forEach(b => row.appendChild(b)); prim.forEach(b => row.appendChild(b));
    f.appendChild(row); sheet.appendChild(f); shells.forEach(x => x.remove());
  }
}
// Long rows of choice chips (paid with, kind) become 3 main choices + "Other", like Add expense.
const NF43_OPEN = {};
function nf43Seg(sheet, mid){
  sheet.querySelectorAll('.sl-days.bk-chips, .bk-chips').forEach((g, gi) => {
    if(g.dataset.nf43) return; const btns = [...g.querySelectorAll(':scope > button')]; if(btns.length < 5) return;
    g.dataset.nf43 = '1'; const key = mid + ':' + gi, on = btns.find(b => b.classList.contains('on'));
    const main = btns.slice(0, 3), rest = btns.slice(3), otherOn = !!on && rest.includes(on);
    const seg = document.createElement('div'); seg.className = 'nf43-seg'; seg.setAttribute('role', 'group');
    main.forEach(b => seg.appendChild(b));
    const dd = document.createElement('div'); dd.className = 'nf43-drop'; dd.hidden = !NF43_OPEN[key];
    const o = document.createElement('button'); o.type = 'button'; o.className = otherOn ? 'on' : ''; o.textContent = (otherOn ? on.textContent.trim() : 'Other') + ' ▾';
    o.onclick = () => { NF43_OPEN[key] = !NF43_OPEN[key]; dd.hidden = !NF43_OPEN[key]; };
    seg.appendChild(o);
    rest.forEach(b => { const t = b.textContent.trim(); b.innerHTML = '<b>' + escapeHtml(t) + '</b>'; b.addEventListener('click', () => { NF43_OPEN[key] = false; }, true); dd.appendChild(b); });
    g.replaceChildren(seg, dd); g.classList.add('nf43-segwrap');
  });
}
(function(){
  if(typeof slModal !== 'function' || slModal._nf43) return;
  const base = slModal;
  const w = function(id, html){ const m = base.apply(this, arguments); try{ nf43Frame(m); const sh = m.querySelector('.sl-sheet'); if(sh) nf43Seg(sh, id); }catch(e){ console.warn('nf43 frame', e); } return m; };
  w._nf43 = true; slModal = w; window.slModal = w;
})();

/* ---------- 4. Add an expense: repeat a recent one, or pick what for, how much, paid with ---------- */
const NF43_CAT_IC = {Electricity: 'bolt', Water: 'drop', 'Internet & phone': 'wifi', 'Gas (LPG)': 'flame', Rent: 'home', Salaries: 'users', 'Staff advance (vale)': 'hand',
  'Stock bought in cash': 'basket', 'Fuel & transport': 'fuel', 'Delivery & shipping': 'truck', Supplies: 'boxs', Repairs: 'wrench', 'Food & meals': 'food', 'Taxes & permits': 'gov',
  'Bank & GCash fees': 'bank', Marketing: 'mega', 'Owner took money': 'user', Other: 'dots', 'Cash to bank': 'bank', 'Owner put in cash': 'cashin'};
Object.assign(NF43_ICON, {
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>', drop: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z"/>', wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><circle cx="12" cy="19.5" r="1"/>',
  flame: '<path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>', home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 6"/>',
  hand: '<path d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v7M16 12V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-3-5a1.5 1.5 0 0 1 2.5-1.5L7 13"/>',
  basket: '<path d="M3 10h18l-2 10H5z"/><path d="M8 10l4-6 4 6"/>', fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3M7 8h4"/>',
  truck: '<path d="M1 6h13v10H1z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="5.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/>', boxs: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5z"/>', food: '<path d="M4 3v8a3 3 0 0 0 6 0V3M7 3v18M17 3c-2 0-3 3-3 6s1 4 3 4v8"/>',
  gov: '<path d="M3 21h18M5 10v8M9.5 10v8M14.5 10v8M19 10v8M2 10l10-6 10 6z"/>', bank: '<path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>',
  mega: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zM17 8a5 5 0 0 1 0 8"/>', dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  cashin: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 9v6M9 12h6"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
});
const NF43_CAT_TONE = {Utilities: 'yel', Rent: 'blu', People: 'blu', Stock: 'grn', Transport: 'yel', Supplies: 'gry', Repairs: 'blu', Other: 'gry', Taxes: 'gry', Fees: 'gry', Marketing: 'grn', Owner: 'blu', Transfer: 'grn'};
const NF43_CAT_WORDS = {Electricity: 'kuryente meralco ilaw power light', Water: 'tubig maynilad manila water', 'Internet & phone': 'load wifi pldt globe smart converge internet', 'Gas (LPG)': 'lpg tangke gasul',
  Rent: 'upa renta', Salaries: 'sahod sweldo suweldo pay', 'Staff advance (vale)': 'vale bale utang ng tao', 'Fuel & transport': 'gas gasolina diesel petron shell caltex pamasahe grab jeep',
  'Delivery & shipping': 'lalamove lbc jnt courier padala', Supplies: 'gamit supplies bond paper', Repairs: 'ayos gawa sira welding', 'Food & meals': 'pagkain kain merienda lunch',
  'Taxes & permits': 'bir permit tax buwis', 'Bank & GCash fees': 'fee singil charge', Marketing: 'ads boost facebook', 'Stock bought in cash': 'palengke paninda stock', 'Owner took money': 'kinuha owner draw'};
const NF43_EX = {q: '', all: false, more: false, pay: false, recentAll: false};
function nf43ExUse(){ const u = {}; (BK.expenses || []).forEach(e => { if(!e.deletedAt) u[e.category] = (u[e.category] || 0) + 1; }); return u; }
function nf43PayUse(){ const u = {cash: 3, gcash: 2, bank: 1}; (BK.expenses || []).forEach(e => { if(!e.deletedAt && e.paidFrom) u[e.paidFrom] = (u[e.paidFrom] || 0) + 1; }); return u; }
function nf43Ic(name, tone){ const t = {red: ['#FDDCDC', '#B42318'], yel: ['#FBEFAE', '#8A6100'], grn: ['#D3F0DD', '#15803D'], blu: ['#D8E6F8', '#1A4F8C'], gry: ['#E8EAEE', '#475467']}[tone || 'gry']; return `<i class="nf43-ic" style="background:${t[0]};color:${t[1]}">${nf43Svg(name)}</i>`; }
function nf43ExRender(){
  if(!EXF) return;
  const cat = EXF.category ? bkCat(EXF.category) : null, isNew = !EXF.id;
  const cats = EXF.cashMove ? BK_CATS.filter(c => c.transfer || c.drawing) : BK_CATS.filter(c => !c.transfer);
  if(cat && cat.transfer) EXF.paidFrom = 'cash';
  const use = nf43ExUse(), q = NF43_EX.q.trim().toLowerCase();
  let list = cats.slice().sort((a, b) => (use[b.k] || 0) - (use[a.k] || 0));
  if(q) list = list.filter(c => (c.k + ' ' + (NF43_CAT_WORDS[c.k] || '')).toLowerCase().includes(q));
  const top = q || NF43_EX.all ? list : list.slice(0, 5);
  if(!q && !NF43_EX.all && cat && !top.some(c => c.k === cat.k)) top[top.length - 1] = cat;
  const catBtn = c => `<button type="button" class="nf43-cat ${EXF.category === c.k ? 'on' : ''}" onclick="nf43ExSet('category', ${JSON.stringify(c.k).replace(/"/g, '&quot;')})">${nf43Ic(NF43_CAT_IC[c.k] || 'dots', NF43_CAT_TONE[c.g])}<span>${escapeHtml(c.k)}</span></button>`;
  const rec = isNew && !EXF.cashMove && typeof nf35RecentExpenses === 'function' ? nf35RecentExpenses() : [];
  const recShown = NF43_EX.recentAll ? rec : rec.slice(0, 3);
  const pu = nf43PayUse(), payAll = BK_PAID.filter(p => p[0] !== 'credit' || isNew || EXF.paidFrom === 'credit');
  const main = payAll.slice().sort((a, b) => (pu[b[0]] || 0) - (pu[a[0]] || 0)).slice(0, 3).map(p => p[0]);
  const payLabel = k => k === 'credit' ? 'Pay later' : (BK_PAID.find(p => p[0] === k) || [k, k])[1];
  const otherSel = !main.includes(EXF.paidFrom);
  const showMore = NF43_EX.more || !isNew || !!(EXF.note || EXF.repeat || (EXF.date && EXF.date !== APP_TODAY) || EXF.staff || (cat && cat.staff));
  const vendorLabel = cat && cat.staff ? 'Staff name' : cat && cat.transfer === 'out' ? 'Bank' : cat && cat.transfer ? 'Who' : 'Paid to';
  const note = cat && cat.drawing ? "Money the owner takes out is not an expense. It's kept apart so your profit stays right." : cat && cat.cogs ? 'Stock bought with cash counts as the cost of what you sell.' : cat && cat.transfer === 'out' ? 'Cash taken from the drawer to deposit in the bank. Snap the deposit slip.' : cat && cat.transfer === 'in' ? "Cash the owner added to the drawer, like extra change. It isn't a sale." : '';
  slModal('exModal', `<div class="sl-sheet-h"><b>${EXF.cashMove ? 'Cash in or out of the drawer' : EXF.id ? 'Edit expense' : 'Add an expense'}</b><button class="sl-x" onclick="slClose('exModal')" aria-label="Close">✕</button></div>
    <div class="nf43-ex">
    ${EXF.cashMove ? `<p class="nf43-lead">Not a sale and not an expense: money moved in or out. The cash count knows about it, so the drawer still adds up.</p>` : ''}
    ${rec.length ? `<section><div class="nf43-q">Repeat a recent one ${rec.length > 3 ? `<button type="button" class="nf43-link" onclick="NF43_EX.recentAll=!NF43_EX.recentAll; exRender()">${NF43_EX.recentAll ? 'Show fewer' : `See all ${rec.length}`}</button>` : ''}</div>
      <div class="nf43-rec ${NF43_EX.recentAll ? 'all' : ''}">${recShown.map(e => { const c = bkCat(e.category); return `<div class="nf43-rr ${EXF.category === e.category && (EXF.vendor || '') === (e.vendor || '') ? 'on' : ''}">${nf43Ic(NF43_CAT_IC[c.k] || 'dots', NF43_CAT_TONE[c.g])}<span class="nm"><b>${escapeHtml(e.category)}</b><small>${escapeHtml([e.vendor, bkDayLabel(e.date)].filter(Boolean).join(' · '))}</small></span><em>${bkPeso(e.amount)}</em><button type="button" class="btn btn-outline" onclick="nf35UseExpense('${e.id}')">Use</button></div>`; }).join('')}</div></section>
      <div class="nf43-or">or start a new one</div>` : ''}
    <section><div class="nf43-q">${EXF.cashMove ? 'What happened?' : 'What for?'}</div>
      ${EXF.cashMove ? '' : `<input class="nf43-search" type="search" placeholder="Type: kuryente, rent, gas…" value="${escapeHtml(NF43_EX.q)}" oninput="NF43_EX.q=this.value; nf43ExCats()" aria-label="Search what it was for">`}
      <div class="nf43-cats" id="nf43Cats">${top.map(catBtn).join('')}${!q && !NF43_EX.all && list.length > top.length ? `<button type="button" class="nf43-cat more" onclick="NF43_EX.all=true; exRender()">More (${list.length - top.length})</button>` : ''}${q && !list.length ? '<p class="nf43-none">Nothing matches. Try another word, or pick Other.</p>' : ''}</div>
      ${note ? `<p class="nf43-note">${note}</p>` : ''}</section>
    <section><div class="nf43-q">How much?</div><div class="nf43-amt"><span>₱</span><input id="exAmt" inputmode="decimal" value="${escapeHtml(EXF.amount)}" placeholder="0" oninput="EXF.amount=this.value" aria-label="Amount in pesos"></div></section>
    ${cat && cat.transfer ? '' : `<section><div class="nf43-q">Paid with</div>
      <div class="nf43-seg" role="group" aria-label="Paid with">${main.map(k => `<button type="button" class="${EXF.paidFrom === k ? 'on' : ''}" onclick="NF43_EX.pay=false; nf43ExSet('paidFrom','${k}')">${escapeHtml(payLabel(k))}</button>`).join('')}<button type="button" class="${otherSel ? 'on' : ''}" onclick="NF43_EX.pay=!NF43_EX.pay; exRender()">${otherSel ? escapeHtml(payLabel(EXF.paidFrom)) : 'Other'} ▾</button></div>
      ${NF43_EX.pay ? `<div class="nf43-drop">${payAll.filter(p => !main.includes(p[0])).map(p => `<button type="button" class="${EXF.paidFrom === p[0] ? 'on' : ''}" onclick="NF43_EX.pay=false; nf43ExSet('paidFrom','${p[0]}')"><b>${escapeHtml(payLabel(p[0]))}</b><small>${{maya: 'E-wallet', card: 'Debit or credit card', owner: 'You paid from your own pocket', credit: 'Saves it as a bill to pay', bank: 'Bank transfer', gcash: 'E-wallet', cash: 'From the cash drawer'}[p[0]] || ''}</small></button>`).join('')}</div>` : ''}</section>`}
    <section><label class="nf43-rcpt">${nf43Svg('camera')}<span>${EXF.reading ? 'Reading the receipt…' : EXF.photo || EXF.photoRef ? '✓ Receipt photo added · Change' : 'Add a receipt photo'} <small>(optional, fills the amount for you)</small></span><input type="file" accept="image/*" capture="environment" onchange="exPhoto(this)" hidden></label></section>
    <section class="nf43-more ${showMore ? 'open' : ''}"><button type="button" class="nf43-mt" onclick="NF43_EX.more=!NF43_EX.more; exRender()" aria-expanded="${showMore}">More details <small>date, ${vendorLabel.toLowerCase()}, note</small><span aria-hidden="true">${showMore ? '▴' : '▾'}</span></button>
      ${showMore ? `<div class="nf43-md"><div class="row-2"><div class="field"><label>Date</label><input type="date" value="${EXF.date}" max="${APP_TODAY}" onchange="EXF.date=this.value||APP_TODAY"></div>
        <div class="field"><label>${vendorLabel} <small>(optional)</small></label>${cat && cat.staff
          ? `<input maxlength="80" value="${escapeHtml(EXF.staff)}" oninput="EXF.staff=this.value" placeholder="e.g. Rico" list="exStaff"><datalist id="exStaff">${getActiveTeamMembers().map(m => `<option value="${escapeHtml(String(m.name).replace(/ \(You\)$/, ''))}">`).join('')}</datalist>`
          : `<input maxlength="120" value="${escapeHtml(EXF.vendor)}" oninput="EXF.vendor=this.value" placeholder="${cat && cat.transfer === 'out' ? 'e.g. BDO' : cat && cat.transfer ? 'e.g. the owner' : 'e.g. Meralco'}">`}</div></div>
        <div class="field"><label>Note <small>(optional)</small></label><input maxlength="500" value="${escapeHtml(EXF.note)}" oninput="EXF.note=this.value"></div>
        ${EXF.cashMove ? '' : `<label class="bk-check"><input type="checkbox" ${EXF.repeat ? 'checked' : ''} onchange="EXF.repeat=this.checked"> Every month (rent, bills). Nifti reminds you if it's not in yet.</label>`}</div>` : ''}</section>
    </div>
    <div class="sl-err" id="exErr">${escapeHtml(EXF.err)}</div>
    <div class="nf43-btns"><button type="button" class="btn btn-ghost" onclick="slClose('exModal')">Cancel</button>${isNew && !EXF.cashMove ? `<button type="button" class="btn btn-outline" onclick="window._nf35Again='exp:'+(EXF.paidFrom||'cash'); exSave()" ${EXF.saving ? 'disabled' : ''}>Save & add another</button>` : ''}<button class="btn btn-primary" onclick="exSave()" ${EXF.saving ? 'disabled' : ''}>${EXF.saving ? 'Saving…' : EXF.cashMove ? 'Save' : 'Save expense'}</button></div>`);
  const m = document.getElementById('exModal'); if(m){ const sh = m.querySelector('.sl-sheet'); if(sh) sh.classList.add('nf43-exsheet'); }
}
function nf43ExSet(k, v){ EXF[k] = v; const keep = document.querySelector('#exModal .nf43-pb'); const top = keep ? keep.scrollTop : 0; exRender(); const b = document.querySelector('#exModal .nf43-pb'); if(b) b.scrollTop = top; if(k === 'category'){ const a = document.getElementById('exAmt'); if(a && !a.value) a.focus(); } }
function nf43ExCats(){ const box = document.getElementById('nf43Cats'); if(!box) return; const el = document.querySelector('#exModal .nf43-search'); const pos = el ? el.selectionStart : 0; const top = document.querySelector('#exModal .nf43-pb'); const st = top ? top.scrollTop : 0; exRender(); const s = document.querySelector('#exModal .nf43-search'); if(s){ s.focus(); try{ s.setSelectionRange(pos, pos); }catch(e){} } const b = document.querySelector('#exModal .nf43-pb'); if(b) b.scrollTop = st; }
(function(){
  if(typeof exRender !== 'function') return;
  exRender = nf43ExRender; window.exRender = nf43ExRender;
  const oe = window.openExpenseForm; if(typeof oe === 'function' && !oe._nf43){ const w = function(){ NF43_EX.q = ''; NF43_EX.all = false; NF43_EX.more = false; NF43_EX.pay = false; NF43_EX.recentAll = false; return oe.apply(this, arguments); }; w._nf43 = true; Object.keys(oe).forEach(k => { if(!(k in w)) w[k] = oe[k]; }); window.openExpenseForm = w; try{ openExpenseForm = w; }catch(e){} }
})();

/* ---------- 5. Names that match, short subtitles, a shorter Home ---------- */
const NF43_NAV = {profit: 'Prices & profit', ledger: 'Monthly summary'};
const NF43_TITLE = {profit: 'Prices & profit', ledger: 'Monthly summary'};
const NF43_SUB = {orders: 'Customers on the left, suppliers on the right.', inventory: 'What you have and what to order.', money: 'Your profit, and where the money went.',
  sales: "Today's sales, then count the cash.", expenses: 'Bills, rent and salaries, with receipts.', collections: 'Who owes you, and who you owe.', profit: 'What each item costs and earns.',
  issues: "Things that don't add up.", payroll: 'Pay your staff and print payslips.', ledger: 'What changed this month, line by line.', followups: 'Win back leads and old customers.',
  routes: "Today's delivery list for your driver.", returns: 'Credits for returned or bad items.', store: 'Your order page for Facebook and Viber.', discover: 'New buyers and better suppliers.',
  cheques: 'Checks to deposit and checks to fund.', books: 'Sales and purchases for your bookkeeper.', taxforms: '2307 forms you give and collect.', team: 'Your people, their jobs, and who did what.',
  settings: 'Your business details and preferences.', messages: 'Customers, suppliers and your team, in one place.'};
function nf43SetText(el, t){ if(!el) return; const n = [...el.childNodes].find(x => x.nodeType === 3 && x.textContent.trim()); if(n){ if(n.textContent.trim() !== t) n.textContent = t; } else if(el.textContent.trim() !== t) el.textContent = t; }
function nf43Names(page){
  Object.entries(NF43_NAV).forEach(([k, t]) => { const s = document.querySelector(`#view-app .sidebar [data-page="${k}"] span`); if(s && s.textContent !== t) s.textContent = t; });
  if(!page) return; const id = page.id.replace('page-', '');
  const head = page.querySelector('.page-head'); if(!head) return;
  const h1 = head.querySelector('h1'), p = head.querySelector('p');
  let title = NF43_TITLE[id], sub = NF43_SUB[id];
  if(id === 'collections' && typeof colTab !== 'undefined' && colTab === 'cash'){ title = 'Bank & deposits'; sub = 'Cash on hand, and what reached the bank.'; }
  if(id === 'collections' && !title) title = 'Getting paid';
  if(title) nf43SetText(h1, title);
  if(sub && p && p.textContent.trim() !== sub) p.textContent = sub;
}
function nf43Home(page){
  if(!page || page.id !== 'page-dashboard') return;
  const home = document.getElementById('mhHome'); if(!home) return;
  const hide = el => { if(el && el.style.getPropertyValue('display') !== 'none') el.style.setProperty('display', 'none', 'important'); };
  // the setup checklist stays until it's done; the "new shops" cards only show to a shop with nothing in it yet
  if(typeof inventoryData !== 'undefined' && inventoryData.length) hide(document.getElementById('nf26Start'));
  hide(document.getElementById('nf28Paid'));        // same money as the Overdue pill; tapping the pill opens Getting paid
  hide(document.getElementById('nf26HomePlan'));    // the plan lives in the menu
  const rows = home.querySelector(':scope > .rows'); if(!rows) return;
  const kids = [...rows.children];
  const find = re => kids.find(k => re.test(((k.querySelector('h2,h3,h4,.sect-h,.tip-k,b') || {}).textContent || k.textContent || '').trim().slice(0, 60)));
  hide(kids.find(k => /^TIP OF THE WEEK|Tip of the week/i.test(k.textContent.trim().slice(0, 30))));
  const order = [find(/^What to do/i), document.getElementById('srCard') || find(/^What runs out/i), find(/^Where every order is/i)].filter(Boolean);
  order.forEach((el, i) => { const want = order[i - 1] ? order[i - 1].nextElementSibling : rows.firstElementChild; if(el !== want){ if(i === 0) rows.prepend(el); else order[i - 1].after(el); } });
}
(function(){
  if(typeof nf26AfterPass !== 'function') return;
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ nf43Names(page); nf43Home(page); }catch(e){ console.warn('nf43 names', e); } };
  window.nf26AfterPass = nf26AfterPass;
})();

/* ---------- 6. Orders: one main button per card, the rest under ⋯ ---------- */
function nf43Orders(page){
  if(!page || page.id !== 'page-orders') return;
  page.querySelectorAll('.nfo-pc').forEach(pc => {
    const more = pc.querySelector('.nfo-more'); if(!more || more.dataset.nf43) return;
    const po = pc.querySelector('.nfo-po'); const btns = [...more.querySelectorAll('button')]; if(!po || !btns.length) return;
    more.dataset.nf43 = '1'; more.hidden = true;
    const wrap = document.createElement('span'); wrap.className = 'nf43-dotw';
    const dots = document.createElement('button'); dots.type = 'button'; dots.className = 'nf43-dots'; dots.setAttribute('aria-label', 'More for this order'); dots.textContent = '⋯';
    const menu = document.createElement('div'); menu.className = 'nf43-menu'; menu.hidden = true;
    btns.forEach(b => { b.className = ''; menu.appendChild(b); });
    dots.addEventListener('click', e => { e.stopPropagation(); const open = menu.hidden; document.querySelectorAll('.nf43-menu').forEach(m => { m.hidden = true; }); menu.hidden = !open; });
    menu.addEventListener('click', e => { e.stopPropagation(); menu.hidden = true; });
    wrap.append(dots, menu);
    const main = po.querySelector('.nfo-b');
    if(main){ const act = document.createElement('div'); act.className = 'nf43-act'; main.before(act); act.append(main, wrap); } else po.appendChild(wrap);
  });
}
document.addEventListener('click', () => document.querySelectorAll('.nf43-menu').forEach(m => { if(!m.hidden) m.hidden = true; }));

/* ---------- 7. Expenses: pills, waiting for your OK, where the money went, then approval rules ---------- */
function nf43Expenses(page){
  if(!page || page.id !== 'page-expenses') return;
  const body = page.querySelector('#bkExpBody'); if(!body) return;
  const kids = [...body.children];
  const tool = body.querySelector(':scope > .bk-toolbar'), pills = body.querySelector(':scope > .nf43-pills'), wait = body.querySelector(':scope > .bk-approve');
  const where = kids.find(k => /^Where the money went/i.test(((k.querySelector('.panel-head') || {}).textContent || '').trim()));
  const alerts = body.querySelector(':scope > .bk-alerts'), det = body.querySelector(':scope > details.lg-det');
  // "Electricity is 51% higher than usual" becomes a tag on the Electricity bar
  if(alerts && where){
    alerts.querySelectorAll('.bk-alert').forEach(a => { const m = a.textContent.match(/^\s*(.+?) is (\d+)% (higher|lower) than usual/i); if(!m) return;
      const bar = [...where.querySelectorAll('.bk-bar')].find(b => b.textContent.trim().startsWith(m[1])); if(!bar || bar.querySelector('.nf43-tag')) return;
      const lab = bar.firstElementChild || bar; const t = document.createElement('span'); t.className = 'nf43-tag ' + (m[3].toLowerCase() === 'higher' ? 'up' : 'dn'); t.textContent = (m[3].toLowerCase() === 'higher' ? '+' : '−') + m[2] + '% vs usual'; lab.appendChild(t); });
    alerts.style.setProperty('display', 'none', 'important');
  }
  // approval rules: a clear card at the bottom with what the rule is now, and Change to edit it
  let rules = body.querySelector(':scope > .nf43-rules');
  if(det && !rules){
    rules = document.createElement('section'); rules.className = 'panel-card nf43-rules';
    rules.innerHTML = `<div class="nf43-rh"><div><h3>Approval rules</h3><p class="nf43-rs"></p></div><button type="button" class="btn btn-outline">Change</button></div><div class="nf43-rb" hidden></div>`;
    const rb = rules.querySelector('.nf43-rb'); [...det.children].filter(c => c.tagName !== 'SUMMARY').forEach(c => rb.appendChild(c));
    rules.querySelector('.btn').addEventListener('click', () => { rb.hidden = !rb.hidden; rules.querySelector('.btn').textContent = rb.hidden ? 'Change' : 'Done'; });
    det.style.setProperty('display', 'none', 'important'); body.appendChild(rules);
  }
  if(rules){ const amt = rules.querySelector('input[inputmode="decimal"]'), dual = rules.querySelector('input[type="checkbox"]');
    const s = `Expenses your staff add from <b>${bkPeso(Number(amt && amt.value) || 2000)}</b> wait for your OK before they count.${dual && dual.checked ? ' Big ones from managers also need a second OK.' : ''}`;
    const p = rules.querySelector('.nf43-rs'); if(p && p.dataset.k !== s){ p.dataset.k = s; p.innerHTML = s; } }
  const order = [tool, pills, wait, where, rules].filter(Boolean);
  order.forEach((el, i) => { if(i === 0){ if(body.firstElementChild !== el) body.prepend(el); } else if(order[i - 1].nextElementSibling !== el) order[i - 1].after(el); });
}

/* ---------- 8. Getting paid: payments to confirm on top, with buttons; reminders in one line ---------- */
function nf43Claims(){
  const out = [], seen = new Set(); let pos = []; try{ pos = unpaidInvoicesFor('supplier').map(r => r.po); }catch(e){}
  pos.forEach(po => { if(seen.has(po.id)) return; seen.add(po.id);
    ['deposit', 'invoice'].forEach(kind => { let list = []; try{ list = paymentListFor(po, kind); }catch(e){} list.forEach((p, i) => { if(paymentNeedsSupplierAction(p)) out.push({po, p, kind, key: paymentKey(p, i)}); }); });
  });
  return out;
}
function nf43Collections(page){
  if(!page || page.id !== 'page-collections' || (typeof colTab !== 'undefined' && colTab === 'cash')) return;
  const body = page.querySelector('#colBody'); if(!body) return;
  const claims = nf43Claims();
  let box = body.querySelector(':scope > .nf43-claims');
  const html = claims.length ? `<div class="nf43-ch"><b>Payments to confirm</b><span>${claims.length} payment${claims.length === 1 ? '' : 's'} from ${new Set(claims.map(c => c.po.buyerId || c.po.buyerName)).size === 1 ? escapeHtml(claims[0].po.buyerName || 'a customer') : new Set(claims.map(c => c.po.buyerId || c.po.buyerName)).size + ' customers'}. Check your bank or GCash, then confirm each one.</span></div>` + claims.map(c => {
      const who = c.po.buyerName || c.po.customerName || (c.po.buyer && c.po.buyer.name) || 'Customer', m = (c.p.method || '').toLowerCase();
      const how = m === 'check' ? 'Check' : m === 'gcash' ? 'GCash' : m === 'bank' ? 'Bank transfer' : m === 'cash' ? 'Cash' : (c.p.method || 'Payment');
      return `<div class="nf43-cr"><div class="nf43-cw"><b>${escapeHtml(who)}</b><small>${escapeHtml(c.po.poNumber ? 'Order ' + String(c.po.poNumber).replace(/^PO-\d{4}-/, '') : '')} · ${escapeHtml(how)}${c.p.date ? ' · ' + escapeHtml(bkDayLabel(String(c.p.date).slice(0, 10))) : ''}</small></div><em>${bkPeso(c.p.amount)}</em>
        <div class="nf43-cb"><button type="button" class="btn btn-primary" onclick="confirmPaymentReceived('${c.po.id}','${c.kind}','${c.key}'); setTimeout(renderCollectionsPage, 50)">${m === 'check' ? 'Check cleared' : 'Received'}</button><button type="button" class="btn btn-outline" onclick="navigate('orders'); setTimeout(() => nfoOpen('${c.po.id}'), 80)">${m === 'check' ? 'Bounced' : 'Not received'}</button></div></div>`; }).join('') : '';
  if(claims.length){ if(!box){ box = document.createElement('section'); box.className = 'nf43-claims'; } const ref = body.querySelector(':scope > .sl-tiles'); if(ref){ if(ref.nextElementSibling !== box) ref.after(box); } else if(body.firstElementChild !== box) body.prepend(box); if(box.dataset.k !== html){ box.dataset.k = html; box.innerHTML = html; } }
  else if(box) box.remove();
  // reminders: one line that says what happens, with Change to see the settings
  const strip = body.querySelector(':scope > #nf33rStrip'), auto = body.querySelector(':scope > .sl-auto'), bar = body.querySelector(':scope > .nf28-bar');
  const parts = [strip, auto, bar].filter(Boolean); if(!parts.length) return;
  let line = body.querySelector(':scope > .nf43-remline');
  const on = auto ? auto.classList.contains('on') || !!auto.querySelector('.switch.on') : true;
  if(!line){ line = document.createElement('div'); line.className = 'nf43-remline'; line.innerHTML = `<span class="nf43-rl"></span><button type="button" class="nf43-link">Change</button>`;
    line.querySelector('button').addEventListener('click', () => { const open = line.classList.toggle('open'); body.querySelectorAll(':scope > #nf33rStrip, :scope > .sl-auto, :scope > .nf28-bar').forEach(p => p.classList.toggle('nf43-remhid', !open)); line.querySelector('button').textContent = open ? 'Done' : 'Change'; }); }
  const t = `🔔 Reminders: <b>${on ? 'On' : 'Off'}</b> · ${on ? '2 days before, due day, then 3, 7, 14 and 30 days late' : 'turn them on to remind customers for you'}`;
  const rl = line.querySelector('.nf43-rl'); if(rl.dataset.k !== t){ rl.dataset.k = t; rl.innerHTML = t; }
  const last = [...body.children].filter(c => !c.classList.contains('nf43-remline')).pop();
  if(!line.classList.contains('open')) parts.forEach(p => p.classList.add('nf43-remhid'));
  const anchor = box && box.isConnected ? box : body.querySelector(':scope > .sl-tiles');
  if(anchor){ if(anchor.nextElementSibling !== line) anchor.after(line); } else if(body.firstElementChild !== line) body.prepend(line);
  parts.forEach(p => { if(p.previousElementSibling !== line && !line.classList.contains('open')){} });
}

/* ---------- 9. Find customers: one main button, a bigger save star ---------- */
function nf43Discover(page){
  if(!page || page.id !== 'page-discover') return;
  page.querySelectorAll('.nf36f-card, .nfd2-card, .nf36d-card').forEach(card => {
    if(card.dataset.nf43) return; const btns = [...card.querySelectorAll('button')]; if(btns.length < 2) return; card.dataset.nf43 = '1';
    const save = btns.find(b => /^save|saved/i.test(b.textContent.trim())), price = btns.find(b => /price list/i.test(b.textContent));
    if(price) price.style.setProperty('display', 'none', 'important');
    if(save){ const star = document.createElement('button'); star.type = 'button'; star.className = 'nf43-star' + (/saved/i.test(save.textContent) ? ' on' : ''); star.setAttribute('aria-label', 'Save'); star.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>'; star.addEventListener('click', e => { e.stopPropagation(); save.click(); });
      save.style.setProperty('display', 'none', 'important'); card.appendChild(star); card.classList.add('nf43-dcard'); }
  });
}

/* ---------- 10. Phone: a + button within thumb reach on the pages where you add things ---------- */
const NF43_FAB = {sales: () => openQuickSale(), expenses: () => openExpenseForm(), orders: () => { const b = [...document.querySelectorAll('#page-orders button')].find(x => /New order/i.test(x.textContent) && x.offsetParent !== null); if(b) b.click(); }, inventory: () => { const b = [...document.querySelectorAll('#page-inventory button')].find(x => /Add Product/i.test(x.textContent)); if(b) b.click(); }};
const NF43_FAB_L = {sales: 'New sale', expenses: 'Add an expense', orders: 'New order', inventory: 'Add an item'};
function nf43Fab(page){
  let f = document.getElementById('nf43Fab');
  const id = page ? page.id.replace('page-', '') : '', phone = window.innerWidth <= 760;
  if(!phone || !NF43_FAB[id]){ if(f) f.hidden = true; return; }
  if(!f){ f = document.createElement('button'); f.id = 'nf43Fab'; f.type = 'button'; f.innerHTML = '<span aria-hidden="true">+</span>'; f.addEventListener('click', () => { const k = f.dataset.page; try{ NF43_FAB[k] && NF43_FAB[k](); }catch(e){} }); document.body.appendChild(f); }
  f.hidden = false; f.dataset.page = id; f.setAttribute('aria-label', NF43_FAB_L[id]);
  // long lists on a phone: 5 rows, then Show all
  page.querySelectorAll('table tbody').forEach(tb => { const rows = [...tb.children].filter(r => r.tagName === 'TR'); if(rows.length <= 7 || tb.dataset.nf43all) return;
    rows.forEach((r, i) => r.classList.toggle('nf43-rowhid', i >= 5));
    let more = tb.parentElement.parentElement.querySelector(':scope > .nf43-showall');
    if(!more){ more = document.createElement('button'); more.type = 'button'; more.className = 'nf43-showall btn btn-outline'; more.addEventListener('click', () => { tb.dataset.nf43all = '1'; tb.querySelectorAll('.nf43-rowhid').forEach(r => r.classList.remove('nf43-rowhid')); more.remove(); }); tb.parentElement.after(more); }
    more.textContent = `Show all ${rows.length}`; });
}
(function(){
  if(typeof nf26AfterPass !== 'function') return;
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); [nf43Orders, nf43Expenses, nf43Collections, nf43Discover, nf43Fab].forEach(f => { try{ f(page); }catch(e){ console.warn('nf43 page', f.name, e); } }); };
  window.nf26AfterPass = nf26AfterPass;
})();

/* ---------- 11. Online store: the post maker up front, fewer buttons around it ---------- */
const NF43_ST = {more: false};
function nf43Store(page){
  if(!page || page.id !== 'page-store') return;
  const root = page.querySelector('.nf22s'); if(!root) return;
  // canned replies and the long guide are gone; making posts is what the page is for
  root.querySelectorAll('.nf22s-tabs > *').forEach(t => { if(/^(Reply fast|Get more buyers)/i.test(t.textContent.trim())) t.style.setProperty('display', 'none', 'important'); });
  const tabs = root.querySelector('.nf22s-tabs'); if(tabs) tabs.classList.add('nf43-sttabs');
  // one Share button instead of a link box, Copy link and QR poster
  const link = root.querySelector('.nf22s-link');
  if(link && !link.dataset.nf43){ link.dataset.nf43 = '1';
    const btns = [...link.querySelectorAll('button, a')]; const url = (link.textContent.match(/\S+\/s\/\S+/) || [''])[0];
    const w = document.createElement('span'); w.className = 'nf43-dotw nf43-share';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-primary'; b.textContent = 'Share my store ▾';
    const menu = document.createElement('div'); menu.className = 'nf43-menu'; menu.hidden = true;
    btns.forEach(x => { x.className = ''; menu.appendChild(x); });
    if(url){ const o = document.createElement('a'); o.href = url.startsWith('http') ? url : 'https://' + url; o.target = '_blank'; o.rel = 'noopener'; o.textContent = 'Open my store'; o.className = ''; menu.appendChild(o); }
    b.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; });
    menu.addEventListener('click', e => { e.stopPropagation(); menu.hidden = true; });
    w.append(b, menu); link.replaceChildren(w);
  }
  // four kinds of post, the rest behind More ideas
  const ask = [...root.querySelectorAll('div, section')].find(d => /^What do you want to post\?/.test((d.firstElementChild || {}).textContent || '') && d.querySelectorAll('button').length >= 6);
  if(ask){ const chips = [...ask.querySelectorAll('button')].filter(x => !x.classList.contains('nf43-more')); const host = chips[0] && chips[0].parentElement;
    chips.forEach((c, i) => c.classList.toggle('nf43-hide', !NF43_ST.more && i >= 4 && !c.classList.contains('on')));
    let more = host && host.querySelector('.nf43-more');
    if(host && !more){ more = document.createElement('button'); more.type = 'button'; more.className = 'nf43-more'; more.addEventListener('click', () => { NF43_ST.more = !NF43_ST.more; nf43Store(page); }); host.appendChild(more); }
    if(more){ const t = NF43_ST.more ? 'Fewer ▴' : `More ideas (${Math.max(0, chips.length - 4)}) ▾`; if(more.textContent !== t) more.textContent = t; }
  }
}
(function(){
  if(typeof nf26AfterPass !== 'function') return;
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ nf43Store(page); }catch(e){ console.warn('nf43 store', e); } };
  window.nf26AfterPass = nf26AfterPass;
})();
