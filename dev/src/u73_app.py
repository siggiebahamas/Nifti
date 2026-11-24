# Round 72 (dashboard): Home status cards and owner view, AI tools hidden, Deliveries, Find customers, Leads,
# sales visibility, SKU-first checkout and cash reconciliation. Brief "Nifti Revisions", sections 4-12.
# Every build-time replacement is checked: the build stops if a string is missing.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

# --- AI tools out of sight (brief 2, 8): no tip, no promise of photo reading. The reader's code is untouched. ---
P("  {k: '@notebook', t: 'Did you know Nifti can read your old notebook?', d: 'Take a photo of your utang or sales notebook. Nifti types it in for you, and you say yes to each line.', b: 'Try it'},\n", "")
P("Bring it into Nifti in minutes: take photos, upload Excel, or type the list. Nifti adds it up and reminds who owes you.",
  "Bring it into Nifti in minutes: upload Excel or type the list. Nifti adds it up and reminds who owes you.")
P("<p class=\"nf45-sm\">Delivery slips also update stock: Nifti adds what arrived to what you already have. Old utang, sales or supplier bills?",
  "<p class=\"nf45-sm\">Old utang, sales or supplier bills?")
P("    <p class=\"nf45-sm\">Notebook photos use your monthly pages (Free 10, Pro 100, Business 400, plus 300 extra in your first month). Excel and typing are always free.</p>`,",
  "    <p class=\"nf45-sm\">Excel and typing are always free.</p>`,")

t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r72.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r72.js') + "\nfunction renderSidebarForViewAsRole(){")

# --- Find customers (brief 6): the demo shop is Dela Cruz Hardware, not Metro Steel; no double period after a name ---
P("  const x = nfFindList()[i]; if(!x) return; const me = (myBusiness && myBusiness.name) || 'Metro Steel Co.';\n  const link = typeof storeUrl === 'function' ? storeUrl((myBusiness && myBusiness.store_slug) || 'metro-steel-co') : '';",
  "  const x = nfFindList()[i]; if(!x) return; const me = String((myBusiness && myBusiness.name) || 'Dela Cruz Hardware').replace(/\\.$/, '');\n  const link = typeof storeUrl === 'function' ? storeUrl((myBusiness && myBusiness.store_slug) || 'dela-cruz-hardware') : '';")
P("  const x = nfFindList()[i]; if(!x) return; const me = (myBusiness && myBusiness.name) || 'Metro Steel Co.';\n  const text = `Hi ${x.n}! This is ${me}.",
  "  const x = nfFindList()[i]; if(!x) return; const me = String((myBusiness && myBusiness.name) || 'Dela Cruz Hardware').replace(/\\.$/, '');\n  const text = `Hi ${x.n}! This is ${me}.")

# --- New sale (brief 10): items only, prices from the item list (Owner/GM/Finance may change a line; recorded as a discount) ---
P("""  if(QS.mode === 'items'){
    lines = QS.lines.filter(l => String(l.product).trim()).map(l => ({product: String(l.product).trim().slice(0, 120), qty: Number(l.qty) || 0, unitPrice: Number(bkItemPrice(String(l.product).trim())) || 0}));
    if(!lines.length) return err('Scan an SKU or add at least one item.');""",
"""  QS.mode = 'items'; {
    lines = QS.lines.filter(l => String(l.product).trim()).map(l => ({product: String(l.product).trim().slice(0, 120), qty: Number(l.qty) || 0, unitPrice: typeof nf72LinePrice === 'function' ? nf72LinePrice(l) : (Number(bkItemPrice(String(l.product).trim())) || 0)}));
    if(!lines.length) return err('Scan or pick at least one item. A sale is built from items.');""")
P("return err('A selling price is missing. Ask the owner to set the item price in Price list before selling it.');",
  "return err('An item has no selling price. Ask the owner to set it in Prices & profit, then save the sale.');")
# Walk-in sales list: every sale opens its details (items, prices, list price, discount; cost only for Owner/GM/Finance)
P("""<span class="bk-row-a">${!s.voidedAt ? `<button class="sl-link" onclick="bkReceipt('${s.id}')">Receipt</button>` : ''}""",
  """<span class="bk-row-a"><button class="sl-link" onclick="nf72SaleDetail('${s.id}')">Details</button>${!s.voidedAt ? `<button class="sl-link" onclick="bkReceipt('${s.id}')">Receipt</button>` : ''}""")

# --- Settings (brief 9.1): "Who can see sales" is an everyday card, never folded under "More settings" ---
P("const NF27_KEEP = /^(Business profile|How buyers pay you|Team & roles|Who sees what|",
  "const NF27_KEEP = /^(Business profile|How buyers pay you|Team & roles|Who sees what|Who can see sales|")

# --- Speed (Round 73): two old passes swapped the Expenses toolbar back and forth forever (nf43Expenses vs nf55Heads).
#     The toolbar row that nf55Heads builds (.nf55-bar) now counts as "the toolbar", so both agree on the order. ---
P("  const tool = body.querySelector(':scope > .bk-toolbar'), pills = body.querySelector(':scope > .nf43-pills'), wait = body.querySelector(':scope > .bk-approve');",
  "  const tool = body.querySelector(':scope > .nf55-bar') || body.querySelector(':scope > .bk-toolbar'), pills = body.querySelector(':scope > .nf43-pills'), wait = body.querySelector(':scope > .bk-approve');")
#     Same kind of loop on Prices & profit and Stock: the Excel button was re-added to the header whenever nf55Heads had
#     moved it to the toolbar row. Look for it anywhere on the page, not only in the header.
P("    if(head && !head.querySelector('.nf41-impbtn')){", "    if(head && !page.querySelector('.nf41-impbtn')){")
P("    if(host && !host.querySelector('.nf41-impbtn')){", "    if(host && !page.querySelector('.nf41-impbtn')){")

# --- Bring in old records without AI (Round 73) ---
# Excel / pasted / typed rows open the "check each line" screen directly (beta-pauses.js keeps the real opener for this).
P("  slClose('nf45Old');\n  nf22NbOpen();\n  NB.kind = NF45O.kind;", "  slClose('nf45Old');\n  (window.nf22NbOpenForImport || nf22NbOpen)();\n  NB.kind = NF45O.kind;")
# the only two AI calls in the app stay off while NIFTI_AI_ON is false (no tokens can be spent from the screen)
P("    const { data, error } = await sb.functions.invoke('nb-read', {body: {image: x.photo, kind: x.kind, page_id: x.id}});",
  "    if(typeof NIFTI_AI_ON !== 'undefined' && !NIFTI_AI_ON) throw new Error('Reading photos is paused for now. Upload Excel, paste from Google Sheets, or type the lines instead.');\n    const { data, error } = await sb.functions.invoke('nb-read', {body: {image: x.photo, kind: x.kind, page_id: x.id}});")
P("    const { data, error } = await sb.functions.invoke('chat-read', {body: {path: a.path, name: a.name, message_id: id, party: f.c.name}});",
  "    if(typeof NIFTI_AI_ON !== 'undefined' && !NIFTI_AI_ON) return;\n    const { data, error } = await sb.functions.invoke('chat-read', {body: {path: a.path, name: a.name, message_id: id, party: f.c.name}});")
# imported sales are item lines too: an item name is required, the price falls back to the item list, cost and list price are saved
P("""      const rows = keep.filter(l => nb25Amt(l) > 0).map(l => { const amt = nb25Amt(l), credit = l.paid === 'credit';
        return {business_id: biz, sale_date: nb25Day(l), customer_name: String(l.who || 'Walk-in').slice(0, 120), line_items: [{product: String(l.item || 'Item').slice(0, 120), qty: Number(l.q) || 1, unitPrice: Number(l.price) || amt, unitCost: 0}],""",
"""      const noItem = keep.filter(l => kind === 'sales' && !String(l.item || '').trim()).length;
      if(noItem) showToast(noItem + ' line' + (noItem === 1 ? '' : 's') + ' had no item and ' + (noItem === 1 ? 'was' : 'were') + ' left out. Every sale needs the item sold.', 'warn');
      const rows = keep.filter(l => nb25Amt(l) > 0 && (kind !== 'sales' || String(l.item || '').trim())).map(l => { const amt = nb25Amt(l), credit = l.paid === 'credit', it = String(l.item || 'Item').trim().slice(0, 120), q = Number(l.q) || 1;
        return {business_id: biz, sale_date: nb25Day(l), customer_name: String(l.who || 'Walk-in').slice(0, 120), line_items: [{product: it, qty: q, unitPrice: Number(l.price) || (typeof bkItemPrice === 'function' && bkItemPrice(it)) || Math.round(amt / q * 100) / 100, unitCost: (typeof bkItemCost === 'function' && bkItemCost(it)) || 0, listPrice: (typeof bkItemPrice === 'function' && bkItemPrice(it)) || 0}],""")
# sales info popups: a sale with no items reads "No items recorded" (old history only; new sales always have items)
import re as _re
_t = S['text']; _n = _t.count("|| 'Just"); S['text'] = _t.replace("|| 'Just the total'", "|| 'No items recorded'")
# Home start card: "Snap your notebook" (AI) becomes "Bring in old records" (Excel, Sheets or typing)
P("<button type=\"button\" onclick=\"nf26OpenStart('snap')\">${nf26Svg('cam')}<b>Snap your notebook</b><span>Nifti types it in</span></button>",
  "<button type=\"button\" onclick=\"navigate('oldrecords')\">${nf26Svg('file')}<b>Bring in old records</b><span>Excel, Sheets or typing</span></button>")

# --- Audit fixes (Round 73) ---
# Home "Owed to you" = order bills + shop utang, the same number Money overview shows (it left out shop utang)
P("  const owed = hmSum(owedRows, r => r.balance), owedLate = hmSum(owedRows.filter(r => r.daysOverdue > 0), r => r.balance);",
  "  let shopOwed = 0, shopLate = 0; try{ bkLiveSales().forEach(s => { const b = bkSaleBalance(s); if(b > 0){ shopOwed += b; if(daysBetween(s.date, APP_TODAY) > 30) shopLate += b; } }); }catch(e){}\n"
  "  const owed = hmSum(owedRows, r => r.balance) + shopOwed, owedLate = hmSum(owedRows.filter(r => r.daysOverdue > 0), r => r.balance) + shopLate;")
# "Vale" is a staff cash advance: say it in plain words instead of "Value to collect"
S['text'] = S['text'].replace("'Value to collect'", "'Cash advances to collect'").replace('<span>Value to collect</span>', '<span>Cash advances to collect</span>').replace('/^Value to collect/i', '/^Cash advances to collect/i')
# both-sides pages: each side says what it holds on THIS page (and Getting paid shows the totals)
P("      sec.innerHTML = nfHalfHead(side); const b = document.createElement('div'); b.className = 'nf-half-b';",
  "      sec.innerHTML = nfHalfHead(side, '', page); const b = document.createElement('div'); b.className = 'nf-half-b';")
