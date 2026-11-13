/* ===== Round 26: plain words, two clean lines, one language for now ===== */

/* ---------- 1. Plain words everywhere in the app ---------- */
// Words a shop owner doesn't use are swapped for the words they do, on whatever the screen shows. Typed text
// (chats, notes, inputs) is never touched.
const NF26_WORDS = [
  [/(?:\b[Oo]rder\s+#?)?#?\bPO-\d{4}-(\d{3,6}[A-Z]?)\b/g, 'Order $1'], [/(?:\b[Oo]rder\s+#?)?#?\bPO-(\d{3,6}[A-Z]?)\b/g, 'Order $1'],
  [/\bINVOICES\b/g, 'BILLS'], [/\bINVOICE\b/g, 'BILL'], [/\bInvoices\b/g, 'Bills'], [/\binvoices\b/g, 'bills'], [/\bInvoice\b/g, 'Bill'], [/\binvoice\b/g, 'bill'],
  [/\bStart [Ss]tocktake\b/g, 'Count all stock'], [/\bStocktakes?\b/g, 'Stock count'], [/\bstocktakes?\b/g, 'stock count'],
  [/\bSpot [Cc]ounts?\b/g, 'Count a few items'], [/\bspot counts?\b/g, 'count a few items'],
  [/\bDraft [Rr]eorder\b/g, 'Reorder'], [/\bGetting Low\b/g, 'Running low'],
  [/\bAll Warehouses\b/g, 'All storage places'], [/\b[Mm]anage warehouses\b/g, 'Manage storage places'],
  [/\bWarehouses\b/g, 'Storage places'], [/\bwarehouses\b/g, 'storage places'], [/\bWarehouse\b(?! Manager)/g, 'Storage place'], [/\bwarehouse\b(?! manager)/g, 'storage place'],
  [/\bVAT-?able\b/gi, 'Before VAT'],
  [/\bOutput VAT(?: \(?12%\)?)?/g, 'VAT you collected'], [/\bInput VAT(?: \(?12%\)?)?/g, 'VAT you paid'], [/\boutput VAT\b/g, 'VAT you collected'], [/\binput VAT\b/g, 'VAT you paid'],
  [/\bGross [Pp]rofit\b/g, 'Profit before expenses'], [/\bgross profit\b/g, 'profit before expenses'],
  [/\bCost of [Gg]oods(?: [Ss]old)?\b/g, 'Cost of what you sold'], [/\bcost of goods(?: sold)?\b/g, 'cost of what you sold'], [/\bCOGS\b/g, 'Cost of what you sold'],
  [/\bAccounts [Rr]eceivable\b/g, 'Customers owe you'], [/\bReceivables\b/g, 'Customers owe you'], [/\breceivables\b/g, 'what customers owe you'],
  [/\bAccounts [Pp]ayable\b/g, 'You owe suppliers'], [/\bPayables\b/g, 'You owe suppliers'], [/\bpayables\b/g, 'what you owe suppliers'],
  [/Import \/ export data/g, 'Bring in or save your list'], [/\bAnnounce to all customers\b/g, 'Message all customers'],
  [/\ba nudge\b/g, 'a reminder'], [/\bNudges\b/g, 'Reminders'], [/\bnudges\b/g, 'reminders'], [/\bNudged\b/g, 'Reminded'], [/\bnudged\b/g, 'reminded'], [/\bNudge\b/g, 'Remind'], [/\bnudge\b/g, 'remind'],
];
// a whole line that is a page name: the same name as the menu, everywhere
const NF26_EXACT = {'Money owed': 'Getting paid', 'Check payments': 'Checks', 'Delivery routes': 'Deliveries', 'Find customers & suppliers': 'Find customers',
  'Books & reports': 'Books', 'Viber & WhatsApp': 'Share by Viber or WhatsApp', 'Output VAT 12%': 'VAT you collected', 'Input VAT 12%': 'VAT you paid'};
const NF26_SKIP = 'input, textarea, select, option, script, style, code, pre, [contenteditable], .msg-bubble, .chat-bubble, .team-bubble-text, .msg-typing-bubble, .nf26-raw, .nf22-post-text, .marketing-view';
function nf26AcctName(code){
  try{ const list = (typeof LG !== 'undefined' && (LG.accounts || LG.accts)) || []; const a = list.find(x => String(x.code) === String(code)); if(a && a.name) return a.name; }catch(e){}
  const base = {1000: 'Cash in drawer', 1010: 'Bank', 1020: 'GCash', 1100: 'Customers owe you', 1200: 'Stock', 2000: 'You owe suppliers', 2100: 'VAT you collected', 3000: "Owner's money", 4000: 'Sales', 4010: 'Shop sales', 5000: 'Cost of what you sold'};
  return base[code] || '';
}
function nf26Plain(s, inBooks){
  let t = s;
  const ex = NF26_EXACT[t.trim()]; if(ex) return t.replace(t.trim(), ex);
  for(const [re, to] of NF26_WORDS){ if(re.test(t)){ re.lastIndex = 0; t = t.replace(re, to); } re.lastIndex = 0; }
  if(inBooks){
    // "1000 · Cash in drawer" -> "Cash in drawer"; "Accounts 4000 and 4010" -> "Sales and Shop sales"
    t = t.replace(/\b\d{4}\s*·\s*(?=\S)/g, '');
    t = t.replace(/\bAccounts? (\d{4})(?:,? and (\d{4}))?/g, (m, a, b) => { const na = nf26AcctName(a), nb = b ? nf26AcctName(b) : ''; return na ? (b ? (nb ? na + ' and ' + nb : m) : na) : m; });
  }
  return t;
}
function nf26Words(root){
  if(!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n, k = 0;
  while((n = w.nextNode()) && k < 9000){ k++;
    const v = n.nodeValue; if(!v || v === n.__nf26 || !/[A-Za-z]/.test(v)) continue;
    const el = n.parentElement; if(!el || el.closest(NF26_SKIP)) { n.__nf26 = v; continue; }
    const books = !!el.closest('#page-ledger, #page-books, .lg-root, .nf23-glc');
    const nv = nf26Plain(v, books);
    if(nv !== v){ n.nodeValue = nv; }
    n.__nf26 = n.nodeValue;
  }
  // a column called "Order" doesn't need the word again in every cell
  root.querySelectorAll && root.querySelectorAll('td[data-l="Order"]').forEach(td => { if(td.children.length) return; const t = td.textContent.trim(), m = t.match(/^Order (\d{3,6})$/); if(m) td.textContent = '#' + m[1]; });
}

/* ---------- 2. Status cells: the amount on one line, two or three plain words under it ---------- */
const NF26_SHORT = [
  [/waiting for (?:their|your|the supplier's|the customer's) OK/i, 'waiting for OK'], [/they say they paid/i, 'says paid'], [/\bto confirm\b/i, 'to confirm'],
  [/take it off the next salary/i, 'off next salary'], [/taken off the next (?:pay|salary)/i, 'off next pay'], [/not billed yet/i, 'not billed'],
  [/overdue by (\d+) days?/i, '$1 days late'], [/^is\s+/i, ''], [/\s*\(prototype\)/i, ''],
];
function nf26Short(s){ let t = String(s || '').replace(/\s+/g, ' ').trim(); NF26_SHORT.forEach(([re, to]) => { t = t.replace(re, to); }); return t; }
function nf26Status(root){
  (root || document).querySelectorAll('table.nf25-t td[data-l="Status"], table.nf25-t td[data-l="When"], table.nf25-t td[data-l="Note"], table.nf25-t td.w').forEach(td => {
    if(td.dataset.nf26s || td.querySelector('button, a, .nf25-chips, input, select')) return;
    const t = td.textContent.replace(/\s+/g, ' ').trim(); td.dataset.nf26s = '1'; if(!t) return;
    let top = '', sub = '';
    const m = t.match(/^(−?-?₱[\d,.]+)\s+(.+)$/);
    if(m){ top = m[1]; sub = nf26Short(m[2]); }
    else if(t.includes(' · ')){ const p = t.split(' · '); top = nf26Short(p[0]); sub = nf26Short(p.slice(1).join(', ')); }
    else { const s = nf26Short(t); if(s !== t) td.textContent = s; return; }
    const tag = td.querySelector('.bk-tag'), tagHtml = tag ? ' ' + tag.outerHTML : '';
    td.innerHTML = `<span class="nf26-l1">${escapeHtml(top)}</span>${sub ? `<span class="nf26-l2">${escapeHtml(sub)}${tagHtml}</span>` : tagHtml}`;
  });
}

/* ---------- 3. English only for now: the Filipino switch is hidden until every line is translated ---------- */
const NF26_FIL_OFF = true;
function nf26English(){
  if(!NF26_FIL_OFF) return;
  document.documentElement.classList.add('nf26-nofil');
  try{ if(typeof currentLanguage !== 'undefined' && currentLanguage === 'FIL' && typeof setLanguage === 'function') setLanguage('EN'); }catch(e){}
}

/* ---------- 4. Storage places only show once there are two ---------- */
function nf26Storage(){
  let n = 1; try{ if(typeof inventoryData !== 'undefined' && Array.isArray(inventoryData) && inventoryData.length) n = new Set(inventoryData.map(i => i.warehouse || 'main')).size; }catch(e){}
  const one = n < 2; document.documentElement.classList.toggle('nf26-one-store', one);
  if(one) document.querySelectorAll('#page-inventory .expand-detail-item .k, #page-inventory .expand-field > label').forEach(k => { if(/^(Storage place|Warehouse)$/.test(k.textContent.trim())){ const p = k.parentElement; if(p && !p.hidden) p.hidden = true; } });
}

/* ---------- wiring: runs after the Round 25 tables are drawn ---------- */
function nf26Pass(){
  const page = document.querySelector('#view-app .app-page.active');
  try{ if(page){ nf26Status(page); } }catch(e){ console.warn('nf26 status', e); }
  try{
    if(page) nf26Words(page);
    nf26Words(document.querySelector('#view-app .sidebar')); nf26Words(document.querySelector('#view-app .topbar, #view-app header'));
    document.querySelectorAll('body > div:not(.marketing-view):not(#view-app):not(#view-login), body > section, body > aside, #view-app .modal-overlay, #view-app [role="dialog"]').forEach(o => { if(o.offsetParent !== null || getComputedStyle(o).position === 'fixed') nf26Words(o); });
  }catch(e){ console.warn('nf26 words', e); }
  try{ nf26Storage(); }catch(e){}
  try{ if(typeof nf26AfterPass === 'function') nf26AfterPass(page); }catch(e){ console.warn('nf26 after', e); }
}
(function(){
  let t = 0, busy = false;
  const run = () => { if(busy) return; busy = true; try{ nf26Pass(); }catch(e){} finally{ busy = false; } };
  const start = () => { nf26English(); run();
    if(!document.body.dataset.nf26){ document.body.dataset.nf26 = '1';
      new MutationObserver(() => { clearTimeout(t); t = setTimeout(run, 110); }).observe(document.body, {childList: true, subtree: true}); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 900)); else setTimeout(start, 900);
})();
