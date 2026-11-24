# Round 71: SKU-first counter sales; prices and stock movement are Nifti-derived.
import os,re
from patchlib import S
HERE=os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text']
def once(old,new,label):
 global t
 if old not in t: raise SystemExit("Round 71 source mismatch: "+label)
 t=t.replace(old,new,1)
once("  if(plApplies() && QS.mode === 'total') QS.mode = 'items';","  QS.mode = 'items';","force items")
t,n=re.subn(r'    \$\{plApplies\(\) \? \'\'.*?\n    <datalist id="qsStock">',"""    <div class="qs-scan-wrap"><label for="qsSkuScan">Scan SKU / barcode</label><div class="qs-scan-row"><span>▦</span><input id="qsSkuScan" autocomplete="off" inputmode="none" placeholder="Scan item, then press Enter" onkeydown="if(event.key==='Enter'){event.preventDefault();qsScanSku(this.value);this.value='';}"></div><small>Use a USB or Bluetooth scanner, or search for an item below.</small></div>
    <datalist id="qsStock">""",t,count=1,flags=re.S)
if n!=1: raise SystemExit("Round 71 could not replace total-only selector")
t,n=re.subn(r'    \$\{QS\.mode === \'items\' \? \x60.*?\n      : \x60.*?\x60\}',"""    <div class="qs-lines">${QS.lines.map(lineHtml).join('')}</div><button class="sl-link" onclick="QS.lines.push({product:'',qty:1,price:''}); qsRender()">+ Add another SKU</button>""",t,count=1,flags=re.S)
if n!=1: raise SystemExit("Round 71 could not remove total-only entry")
once("""<input inputmode="decimal" placeholder="Price" value="${escapeHtml(String(l.price))}" oninput="QS.lines[${i}].price=this.value; qsTotalNow()" aria-label="Price each">""","""<input inputmode="decimal" value="${escapeHtml(String(bkItemPrice(l.product) || 0))}" readonly aria-label="Saved selling price">""","read-only price")
once("const p = bkItemPrice(name); if(p && !l.price) l.price = String(p);","const p = bkItemPrice(name); l.price = p ? String(p) : '';","saved price")
once("""lines = QS.lines.filter(l => String(l.product).trim()).map(l => ({product: String(l.product).trim().slice(0, 120), qty: Number(l.qty) || 0, unitPrice: Number(String(l.price).replace(/,/g, '')) || 0}));
    if(!lines.length) return err('Add at least one item, or switch to "Just the total".');
    if(lines.some(l => l.qty <= 0)) return err('Each item needs a quantity.');
    lines.forEach(l => { l.unitCost = bkItemCost(l.product); l.listPrice = bkItemPrice(l.product) || 0; if(bkMenuFind(l.product)) l.menu = true; });
  } else lines = [{product: 'Sale (total only)', qty: 1, unitPrice: total, unitCost: 0, totalOnly: true}];""",
"""lines = QS.lines.filter(l => String(l.product).trim()).map(l => ({product: String(l.product).trim().slice(0, 120), qty: Number(l.qty) || 0, unitPrice: Number(bkItemPrice(String(l.product).trim())) || 0}));
    if(!lines.length) return err('Scan an SKU or add at least one item.');
    if(lines.some(l => l.qty <= 0)) return err('Each item needs a quantity.');
    if(lines.some(l => l.unitPrice <= 0)) return err('A selling price is missing. Ask the owner to set the item price in Price list before selling it.');
    lines.forEach(l => { l.unitCost = bkItemCost(l.product); l.listPrice = bkItemPrice(l.product) || 0; if(bkMenuFind(l.product)) l.menu = true; });""","SKU save")
anchor="function renderSidebarForViewAsRole(){"
if anchor not in t: raise SystemExit("Round 71 insertion point missing")
t=t.replace(anchor,rd('r71_product.js')+"\\n"+anchor,1)
i=t.index('</style>')
t=t[:i]+'\\n'+rd('r71_product.css')+'\\n'+t[i:]
S['text']=t
