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
