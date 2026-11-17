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
  const box = page.querySelector(cfg.sel); if(!box) return;
  const tiles = [...box.children].filter(e => e.nodeType === 1 && !e.classList.contains('nf43-pills'));
  const pills = [];
  tiles.forEach((tile, i) => { const x = nf43Read(tile); const r = cfg.rules.find(([re]) => re.test(x.k)); if(!r) return; let p = r[1](x); if(!p) return; (Array.isArray(p) ? p : [p]).forEach(q => { if(q && q.v !== '' && q.v != null){ q.i = i; pills.push(q); } }); });
  let row = box.nextElementSibling && box.nextElementSibling.classList.contains('nf43-pills') ? box.nextElementSibling : null;
  const allZero = cfg.empty && pills.length && pills.every(q => nf43Zero(q.v));
  const html = allZero ? `<div class="nf43-empty"><b>No bills this month yet</b><span>Bills you make in Orders show up here, ready for your bookkeeper.</span></div>`
    : pills.map((q, j) => `<button type="button" class="nf43-pill t-${q.tone}" data-i="${q.i}" ${q.go ? `data-go="${escapeHtml(q.go)}"` : ''}><span class="ic">${nf43Svg(q.ic)}</span><span class="tx"><span class="k">${escapeHtml(q.t)}</span><span class="v">${escapeHtml(q.v)}${q.sm ? `<span class="sm">${escapeHtml(q.sm)}</span>` : ''}</span></span></button>`).join('');
  if(!row){ row = document.createElement('div'); row.className = 'nf43-pills'; box.insertAdjacentElement('afterend', row); // after the hidden old row, so passes that place things before it keep their spot
    row.addEventListener('click', e => { const b = e.target.closest('.nf43-pill'); if(!b) return; if(b.dataset.go){ try{ (new Function(b.dataset.go))(); }catch(err){} return; } const t = [...box.children].filter(el => !el.classList.contains('nf43-pills'))[Number(b.dataset.i)]; if(t){ const c = t.matches('button,[onclick],a') ? t : t.querySelector('button,[onclick],a'); if(c) c.click(); else t.click(); } });
    try{ new ResizeObserver(() => nf43Fit(row)).observe(row); }catch(e){} }
  if(row.dataset.k !== html){ row.dataset.k = html; row.innerHTML = html; }
  row.dataset.n = allZero ? 0 : pills.length;
  box.classList.add('nf43-old'); nf43Fit(row);
}
function nf43Fit(row){
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
