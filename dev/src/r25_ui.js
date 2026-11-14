/* ===== Round 25: every list reads like the Prices table ===== */
// Lists of rows (sales, expenses, vale, payroll, bills, cheques, cash outlook, who owes you) become tables with a
// label on every column and the values underneath, in big black type. On a phone each row becomes a card where
// every value sits under its own small label. One amount per row, no repeats: a section total only shows when
// there is more than one row to add up, and the summary tiles on Getting paid only show for two or more people.
// Buttons are moved, not copied, so everything they did still works.
function nf25Txt(h){ const d = document.createElement('div'); d.innerHTML = h || ''; return (d.textContent || '').trim(); }
function nf25Split(t){ const i = t.indexOf(' · '); return i < 0 ? [t, ''] : [t.slice(0, i), t.slice(i + 3)]; }
function nf25By(m){ return m.findIndex(x => /^(by|ni)\s/i.test(nf25Txt(x))); }
function nf25En(el){ if(!el) return ''; let t = ''; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while((n = w.nextNode())) t += (n.__en != null && n.nodeValue === n.__fil) ? n.__en : n.nodeValue; return t.replace(/\s+/g, ' ').trim(); }
function nf25L(t){ try{ return typeof currentLanguage !== 'undefined' && currentLanguage === 'FIL' && typeof i18nTr === 'function' ? i18nTr(t) : t; }catch(e){ return t; } }
function nf25Strip(s, re){ return String(s || '').replace(re, ''); }
function nf25Peso(t){ const n = Number(String(t || '').replace(/[^\d.\-−]/g, '').replace('−', '-')); return isFinite(n) ? n : 0; }
function nf25Parts(row){
  const m = row.querySelector('.bk-row-m, .nfc-m'), b = m && m.querySelector('b'), s = m && m.querySelector('small');
  const amtEl = row.querySelector('.bk-amt') || row.querySelector(':scope > strong');
  const ic = row.querySelector(':scope > .bk-ic');
  return {title: b ? b.innerHTML.trim() : '', meta: s ? s.innerHTML.split(/\s+·\s+/).map(x => x.trim()).filter(Boolean) : [],
    amt: amtEl ? `<span class="${amtEl.className || ''}">${amtEl.innerHTML.trim()}</span>` : '', amtN: amtEl ? nf25Peso(amtEl.textContent) : 0,
    act: row.querySelector(':scope > .bk-row-a, :scope > button, :scope > .btn'), ic: ic ? ic.innerHTML : '',
    date: (() => { const d = row.querySelector('.nf-db'); return d ? d.textContent.replace(/\s+/g, ' ').trim() : ''; })()};
}
const nf25Sm = a => a.filter(Boolean).length ? `<small>${a.filter(Boolean).join(' · ')}</small>` : '';
const NF25_TBL = [
  {page: 'sales', h: /^Utang/, rename: 'Utang from shop sales', cols: [['Customer', 't'], ['Sales'], ['Oldest'], ['Owes', 'n'], ['', 'a']],
    cells: p => [p.title, p.meta[0], nf25Strip(p.meta[1], /^(oldest|pinakaluma)\s*/i), p.amt, p.act], total: 3},
  {page: 'sales', h: /^Discounts/, cols: [['Who', 't'], ['What happened', 'w'], ['Amount', 'n']], cells: p => [p.title, p.meta.join(' · '), p.amt], total: 2},
  {page: 'sales', test: s => !!s.querySelector('.bk-row [onclick^="bkReceipt"], .bk-row [onclick^="bkVoidSale"]'),
    cols: [['What was sold', 't'], ['Customer'], ['Paid with'], ['Time'], ['By'], ['Amount', 'n'], ['', 'a']],
    cells: p => { const m = p.meta, bi = nf25By(m), extra = bi >= 0 ? m.slice(bi + 1) : m.slice(3); return [p.title + nf25Sm(extra), m[0], m[1], m[2], bi >= 0 ? nf25Strip(m[bi], /^(by|ni)\s+/i) : '', p.amt, p.act]; }},  // no total: the Sales tile right above already shows it
  {page: 'expenses', h: /^Waiting for your OK/, cols: [['What', 't'], ['Paid to'], ['When'], ['By'], ['Note', 'w'], ['Amount', 'n'], ['', 'a']],
    cells: p => { const [c, v] = nf25Split(p.title), m = p.meta, bi = nf25By(m); return [c, v, (bi >= 0 ? m.slice(0, bi) : m).join(' · '), bi >= 0 ? nf25Strip(m[bi], /^(by|ni)\s+/i) : '', bi >= 0 ? m.slice(bi + 1).join(' · ') : '', p.amt, p.act]; }},
  {page: 'expenses', h: /^Vale/, cols: [['Staff', 't'], ['Note', 'w'], ['Amount', 'n']], cells: p => [p.title, p.meta.join(' · '), p.amt], total: 2},
  {page: 'expenses', h: /^All expenses/, cols: [['What', 't'], ['Paid to'], ['Paid from'], ['By'], ['Amount', 'n'], ['', 'a']],
    cells: p => { const [c, v] = nf25Split(p.title), tagged = [], m = p.meta.map(x => x.replace(/<span class="bk-tag">[^<]*<\/span>\s*/g, t => { tagged.push(t.trim()); return ''; }).trim()).filter(Boolean), bi = nf25By(m), before = bi >= 0 ? m.slice(0, bi) : m, after = (bi >= 0 ? m.slice(bi + 1) : []).concat(tagged);
      const from = before.length ? before[before.length - 1] : '', tags = before.slice(0, -1); return [c + nf25Sm(tags.concat(after)), v, from, bi >= 0 ? nf25Strip(m[bi], /^(by|ni)\s+/i) : '', p.amt, p.act]; }},
  {page: 'payroll', h: /^Vale/, cols: [['Staff', 't'], ['Note', 'w'], ['Amount', 'n']], cells: p => [p.title, p.meta.join(' · '), p.amt], total: 2},
  {page: 'payroll', h: /^Payroll$/, cols: [['Pay period', 't'], ['People'], ['Status', 'w'], ['Total', 'n']], cells: p => [p.title, p.meta[0], p.meta.slice(1).join(' · '), p.amt]},
  {page: 'money', h: /^Cash outlook/, cols: [['What', 't'], ['Who'], ['When'], ['Amount', 'n']], cells: p => { const [a, b] = nf25Split(p.title); return [a, b, p.meta.join(' · '), p.amt]; }},
  {page: 'collections', h: /^Bills, oldest first/, cols: [['Supplier', 't'], ['Order'], ['Due'], ['Status', 'w'], ['You owe', 'n'], ['', 'a']],
    cells: p => [p.title, p.meta[0], nf25Strip(p.meta[1], /^(due|dapat bayaran)\s+/i), p.meta.slice(2).join(' · '), p.amt, p.act], total: 4},
  {page: 'cheques', row: '.nfc-row', test: s => !!s.querySelector('.nfc-row'), cols: [['Date', 'd'], ['Who', 't'], ['Bank'], ['Check'], ['When'], ['Amount', 'n'], ['', 'a']],
    cells: p => [p.date, p.title, p.meta[0], nf25Strip(p.meta[1], /^check\s+/i), p.meta.slice(2).join(' · '), p.amt, p.act]},
];
function nf25Head(sec){ const h = sec.querySelector('.panel-head h2, .nfc-h, h2, h3'); return h ? nf25En(h) : ''; }
function nf25Tablize(sec, cfg){
  const rowSel = cfg.row || '.bk-row';
  const nodes = [...sec.querySelectorAll(rowSel + ', .bk-day')].filter(n => !n.closest('table.nf25-t'));
  const rows = nodes.filter(n => n.matches(rowSel)); if(!rows.length) return;
  const first = nodes[0], parent = first.parentElement;
  const tbl = document.createElement('table'); tbl.className = 'nf25-t'; tbl.dataset.nfCard = '1';
  tbl.innerHTML = `<thead><tr>${cfg.cols.map(([t, c]) => `<th class="${c || ''}">${t ? nf25L(t) : ''}</th>`).join('')}</tr></thead>`;
  const tb = document.createElement('tbody'); tbl.appendChild(tb);
  const wrap = document.createElement('div'); wrap.className = 'nf25-tw'; wrap.appendChild(tbl); parent.insertBefore(wrap, first);
  let sum = 0, n = 0;
  nodes.forEach(node => {
    if(node.matches('.bk-day')){ const tr = document.createElement('tr'); tr.className = 'nf25-g'; tr.innerHTML = `<td colspan="${cfg.cols.length}">${node.innerHTML}</td>`; tb.appendChild(tr); node.remove(); return; }
    const p = nf25Parts(node), cells = cfg.cells(p, node), tr = document.createElement('tr');
    [...node.classList].filter(c => !/-row$/.test(c)).forEach(c => tr.classList.add(c));
    ['onclick', 'role', 'tabindex'].forEach(a => { if(node.hasAttribute(a)) tr.setAttribute(a, node.getAttribute(a)); });
    if(node.hasAttribute('onclick')) tr.classList.add('nf25-click');
    cells.forEach((v, i) => { const td = document.createElement('td'), [lab, cls] = cfg.cols[i] || ['', ''];
      if(cls) td.className = cls; if(lab) td.dataset.l = nf25L(lab);
      if(v && v.nodeType === 1) td.appendChild(v); else td.innerHTML = (cls === 't' && i === 0 && p.ic ? `<span class="nf25-ic" aria-hidden="true">${p.ic}</span>` : '') + (v == null ? '' : v);
      if(!td.textContent.trim() && !td.querySelector('button')) td.classList.add('nf25-empty');
      tr.appendChild(td); });
    tb.appendChild(tr); node.remove(); sum += p.amtN; n++;
  });
  if(cfg.total != null && n > 1){ const tf = document.createElement('tfoot'); tf.innerHTML = `<tr>${cfg.cols.map(([t, c], i) => `<td class="${c || ''}">${i === 0 ? '<b>Total</b>' : i === cfg.total ? `<b>${bkPeso(Math.round(sum * 100) / 100)}</b>` : ''}</td>`).join('')}</tr>`; tbl.appendChild(tf); }
  // a total in the section header just repeats the row when there is only one
  const ph = sec.querySelector('.panel-head > span.bk-dim, .panel-head > .bk-dim');
  if(ph && /₱/.test(ph.textContent)) ph.classList.add('nf25-hide');
  if(cfg.rename){ const h = sec.querySelector('.panel-head h2'), want = nf25L(cfg.rename); if(h && h.textContent !== want) h.textContent = want; }
}
function nf25Lists(){
  const page = document.querySelector('#view-app .app-page.active'); if(!page) return;
  const pid = (page.id || '').replace(/^page-/, '');
  NF25_TBL.filter(c => c.page === pid).forEach(cfg => {
    page.querySelectorAll('section.bk-list, .panel-card, section').forEach(sec => {
      const rowSel = cfg.row || '.bk-row';
      if(sec.parentElement && sec.parentElement.closest('section.bk-list, .panel-card') && sec.matches('section:not(.bk-list)')) return;
      const own = [...sec.querySelectorAll(rowSel)].filter(r => !r.closest('table.nf25-t'));
      if(!own.length) return;
      // only the innermost section that holds these rows
      if([...sec.querySelectorAll('section, .panel-card')].some(x => x !== sec && x.querySelector(rowSel))) return;
      const h = nf25Head(sec);
      if(cfg.h ? !cfg.h.test(h) : !(cfg.test && cfg.test(sec))) return;
      try{ nf25Tablize(sec, cfg); }catch(e){ console.warn('nf25 table', h, e); }
    });
  });
  try{ nf25Owed(page); }catch(e){ console.warn('nf25 owed', e); }
  try{ nf25Dedupe(page); }catch(e){ console.warn('nf25 dedupe', e); }
  try{ nf25MinFont(page); ['nf21Alerts', 'nf22Nb', 'nf20Who'].forEach(id => { const o = document.getElementById(id); if(o && !o.hidden) nf25MinFont(o); }); }catch(e){ console.warn('nf25 font', e); }
}



/* ---------- no text under 14px, anywhere on the page ---------- */
const NF25_SMALL_OK = 'svg, .nfd-c, .nfd-dow, .nfd-st, .bnav-label, .nfo-dt, .nav-badge, .nf22-new, .nf-bar-k, .s-done, .s-fail, .user-chip, .nf24-badge, .sl-n, [class*="badge"], .nf-db, .sr-act, .nft-chart, .nf-chart, .nft-bars, canvas, .lg-pill, .nf25-t thead, .nf24-tb thead';
function nf25MinFont(root){
  if(!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n, k = 0; const fix = [];
  while((n = w.nextNode()) && k < 6000){ k++; const el = n.parentElement; if(!el || el.dataset.nf25f || !n.nodeValue.trim()) continue; el.dataset.nf25f = '1';
    if(el.closest(NF25_SMALL_OK)) continue; if(el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
    const fs = parseFloat(getComputedStyle(el).fontSize); if(fs > 0 && fs < 14) fix.push(el); }
  fix.forEach(el => el.style.setProperty('font-size', '14px', 'important'));
}

/* ---------- no repeated amounts ---------- */
// A tile whose small line repeats its own big number ("₱17,504" then "₱17,504 overdue") says it in words instead.
// The cash outlook showed the same "expected in" on every row because each row counted from today; each row now
// shows only what comes in and goes out in that stretch of days, so every number is new.
function nf25Dedupe(page){
  page.querySelectorAll('.tx, .sl-tile, .bk-tile, .nft-tile').forEach(t => {
    const v = t.querySelector('.v') || t.querySelector('.bk-tile-v') || t.querySelector('b'), sub = t.querySelector('.s') || t.querySelector('.bk-tile-s') || t.querySelector(':scope > span'); if(!v || !sub || sub === v || sub.dataset.nf25) return;
    const val = (v.textContent || '').trim(); if(!/^₱[\d,.]+$/.test(val)) return;
    const st = nf25En(sub);
    if(st === val + ' overdue'){ sub.textContent = nf25L('All of it is overdue'); sub.dataset.nf25 = '1'; }
  });
  // Orders: a customer's balance at the top of their block is not repeated when the order card below already shows
  // it, or when the same customer already showed it higher up the page
  const seen = new Set();
  page.querySelectorAll('.nfo-tl').forEach(tl => {
    const mon = tl.querySelector('.nfo-h .nfo-money'), mb = mon && mon.querySelector('b'); if(!mb) return;
    const amt = mb.textContent.trim(), name = nf25En(tl.querySelector('.nfo-h .nm b'));
    if(!/^₱[\d,.]+$/.test(amt) || amt === '₱0') return;
    const inCard = [...tl.querySelectorAll('.nfo-amt')].some(x => ((x.firstChild && x.firstChild.nodeValue) || '').trim() === amt);
    const key = name + '|' + amt, dup = seen.has(key); seen.add(key);
    mon.classList.toggle('nf25-hide', inCard || dup);
  });
  page.querySelectorAll('section.panel-card').forEach(sec => {
    const h = sec.querySelector('.panel-head h2'); if(!h || nf25En(h) !== 'Cash outlook') return;
    const tb = sec.querySelector('table.lg-tbl'); if(!tb || tb.dataset.nf25co) return; tb.dataset.nf25co = '1';
    const ths = tb.querySelectorAll('thead th'); const names = ['When', 'Coming in', 'Going out', 'Cash at the end'];
    ths.forEach((th, i) => { if(names[i]) th.textContent = nf25L(names[i]); });
    const lab = {'7 days': 'Next 7 days', '30 days': 'Day 8 to 30', '60 days': 'Day 31 to 60', '90 days': 'Day 61 to 90'};
    const num = td => nf25Peso(td.textContent); let pin = 0, pout = 0;
    tb.querySelectorAll('tbody tr').forEach(tr => { const td = tr.children; if(td.length < 4) return;
      const l = nf25En(td[0]); if(lab[l]) td[0].textContent = nf25L(lab[l]);
      const cin = num(td[1]), cout = num(td[2]); const din = Math.round((cin - pin) * 100) / 100, dout = Math.round((cout - pout) * 100) / 100; pin = cin; pout = cout;
      td[1].textContent = din > 0 ? bkPeso(din) : '—'; td[2].textContent = dout > 0 ? bkPeso(dout) : '—';
      [...td].forEach((c, i) => { if(names[i]) c.dataset.label = nf25L(names[i]); }); });
  });
}

/* ---------- Getting paid: one row per customer, the amount once, the rest as plain status chips ---------- */
function nf25Owed(page){
  if(page.id !== 'page-collections') return;
  page.querySelectorAll('.sl-card').forEach(card => {
    const rows = [...card.querySelectorAll('.sl-row.col-row')]; if(!rows.length) return;
    // open promises already show in each customer's row; keep only past promises in the Promises card
    const promCard = [...page.querySelectorAll('.sl-card')].find(c => c !== card && /Promises to pay/.test(nf25En(c.querySelector('.sl-card-h') || c)));
    const promBtns = {};
    if(promCard) promCard.querySelectorAll('.sl-row').forEach(r => { const t = (r.querySelector('.sl-t') || {}).textContent || '', btn = r.querySelector('button[onclick^="colCancelPromise"]');
      if(btn){ promBtns[t.split(' · ')[0].trim()] = btn; r.remove(); } });
    const tbl = document.createElement('table'); tbl.className = 'nf25-t nf25-owed'; tbl.dataset.nfCard = '1';
    tbl.innerHTML = `<thead><tr><th class="t">${nf25L('Customer')}</th><th class="n">${nf25L('Owes')}</th><th class="w">${nf25L('Status')}</th><th class="a"></th></tr></thead><tbody></tbody>`;
    const tb = tbl.querySelector('tbody'); let sum = 0;
    rows.forEach(r => {
      const name = nf25En(r.querySelector('.sl-t')), ss = r.querySelectorAll('.sl-s'), line = nf25En(ss[0]), parts = line.split(/\s+·\s+/);
      const owes = escapeHtml(parts[0] || ''), owesN = nf25Peso(parts[0]); sum += owesN;
      const chips = [], ln = (cls, label, val, extra) => `<div><i class="${cls}"></i>${escapeHtml(label)}${val ? `<b>${escapeHtml(val)}</b>` : ''}${extra || ''}</div>`;
      parts.slice(1).forEach(t => {
        let m = t.match(/^(₱[\d,.]+) overdue, (\d+)d/); if(m){ chips.push(ln('bad', 'Late', `${m[2]} day${m[2] === '1' ? '' : 's'}${nf25Peso(m[1]) === owesN ? '' : ' · ' + m[1]}`)); return; }
        m = t.match(/^(₱[\d,.]+) to confirm/); if(m){ chips.push(ln('warn', 'Says paid', m[1])); return; }
        chips.push(ln('', t, '')); });
      const st = ss[1] ? nf25En(ss[1]) : '';
      if(st){ const good = ss[1].querySelector('.sl-good'), warn = ss[1].querySelector('.sl-warn'); const clean = st.replace(/^[^\w₱]+/u, '');
        const pb = promBtns[name.trim()]; let extra = ''; if(pb && good){ pb.className = 'sl-link nf25-cancel'; pb.textContent = 'Cancel'; extra = pb.outerHTML; }
        const pm = clean.match(/^(Promised|Broke a promise|Promise broken)\s*(.*)$/i);
        chips.push(pm ? ln(good ? 'good' : warn ? 'warn' : '', pm[1], pm[2].replace(/^by /, 'by '), extra) : ln(good ? 'good' : warn ? 'warn' : '', clean, '', extra)); }
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="t" data-l="${nf25L('Customer')}"><b>${escapeHtml(name)}</b></td><td class="n" data-l="${nf25L('Owes')}"><b>${owes}</b></td><td class="w" data-l="${nf25L('Status')}"><div class="nf26-gl">${chips.join('')}</div></td><td class="a"></td>`;
      const act = r.querySelector('.sl-right'); if(act) tr.lastElementChild.appendChild(act);
      tb.appendChild(tr); r.remove();
    });
    if(rows.length > 1){ const tf = document.createElement('tfoot'); tf.innerHTML = `<tr><td class="t"><b>Total</b></td><td class="n"><b>${bkPeso(sum)}</b></td><td></td><td></td></tr>`; tbl.appendChild(tf); }
    const w = document.createElement('div'); w.className = 'nf25-tw'; w.appendChild(tbl); card.appendChild(w);
    if(promCard && !promCard.querySelector('.sl-row')) promCard.hidden = true;
    // with one customer, the four tiles only repeat what the row already says
    const half = card.closest('.nf-half') || page, tiles = half.querySelector('.sl-tiles');
    if(tiles) tiles.classList.toggle('nf25-hide', rows.length < 2);
  });
  // buying side: the tiles repeat the single bill
  const buy = page.querySelector('.nf-half-buyer');
  if(buy){ const t = buy.querySelector('table.nf25-t'); const n = t ? t.querySelectorAll('tbody tr:not(.nf25-g)').length : 0;
    buy.querySelectorAll('.sl-tiles, .bk-tiles, .nf22-tiles').forEach(x => x.classList.toggle('nf25-hide', n === 1)); }
}

/* ---------- wiring ---------- */
(function(){
  let t = 0, busy = false;
  const run = () => { if(busy) return; busy = true; try{ nf25Lists(); }catch(e){ console.warn('nf25 lists', e); } finally{ busy = false; } };
  const start = () => { run(); const app = document.getElementById('view-app'); if(app && !app.dataset.nf25ui){ app.dataset.nf25ui = '1';
      new MutationObserver(() => { clearTimeout(t); t = setTimeout(run, 90); }).observe(app, {childList: true, subtree: true}); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 800)); else setTimeout(start, 800);
})();
