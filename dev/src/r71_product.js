# Round 71 — SKU-first POS workflow and owner-controlled sales visibility discovery.
import os
from patchlib import S
HERE=os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text']
def once(old,new,label):
    global t
    if old not in t: raise SystemExit("Round 71 expected source missing: "+label)
    t=t.replace(old,new,1)
once("""  if(plApplies() && QS.mode === 'total') QS.mode = 'items';""","""  QS.mode = 'items';""","force items")
once("""    \${plApplies() ? '' : \`<div class="bk-seg"><button class="\${QS.mode === 'items' ? 'on' : ''}" onclick="QS.mode='items'; qsRender()">Items</button><button class="\${QS.mode === 'total' ? 'on' : ''}" onclick="QS.mode='total'; qsRender()">Just the total</button></div>\`}
    <datalist id="qsStock">""","""    <div class="qs-scan-wrap"><label for="qsSkuScan">Scan SKU / barcode</label><div class="qs-scan-row"><span>▦</span><input id="qsSkuScan" autocomplete="off" inputmode="none" placeholder="Scan item, then press Enter" onkeydown="if(event.key==='Enter'){event.preventDefault();qsScanSku(this.value);this.value='';}"></div><small>Use a USB or Bluetooth scanner, or search for an item below.</small></div>
    <datalist id="qsStock">""","scan input")
once("""    \${QS.mode === 'items' ? \`<div class="qs-lines">\${QS.lines.map(lineHtml).join('')}</div><button class="sl-link" onclick="QS.lines.push({product:'',qty:1,price:''}); qsRender()">+ Add item</button>\`
      : \`<div class="field"><label>Total sale</label><div class="ob-peso bk-big"><span>₱</span><input id="qsTotalIn" inputmode="decimal" value="\${escapeHtml(QS.total)}" placeholder="0" oninput="QS.total=this.value; qsTotalNow()"></div><div class="bk-note">For a register total. Stock won't move; record items when you can.</div></div>\`}""","""    <div class="qs-lines">\${QS.lines.map(lineHtml).join('')}</div><button class="sl-link" onclick="QS.lines.push({product:'',qty:1,price:''}); qsRender()">+ Add another SKU</button>""","remove total mode")
once("""      <div class="ob-peso qs-price"><span>₱</span><input inputmode="decimal" placeholder="Price" value="\${escapeHtml(String(l.price))}" oninput="QS.lines[\${i}].price=this.value; qsTotalNow()" aria-label="Price each"></div>""","""      <div class="ob-peso qs-price"><span>₱</span><input inputmode="decimal" value="\${escapeHtml(String(bkItemPrice(l.product) || 0))}" readonly aria-label="Saved selling price"></div>
      <div class="qs-line-total">\${bkPeso((Number(l.qty)||0)*(Number(bkItemPrice(l.product))||0))}</div>""","read-only saved price")
once("""  const p = bkItemPrice(name); if(p && !l.price) l.price = String(p);""","""  const p = bkItemPrice(name); l.price = p ? String(p) : '';""","refresh saved price")
once("""function qsRender(){""","""function qsScanSku(code){
  const raw=String(code||'').trim(); if(!raw||!QS)return;
  const key=raw.toLowerCase();
  const stock=(inventoryData||[]).find(x=>[x.code,x.sku,x.barcode,x.name].some(v=>String(v||'').trim().toLowerCase()===key));
  const menu=(BK.menu||[]).find(x=>x.active&&[x.code,x.sku,x.barcode,x.name].some(v=>String(v||'').trim().toLowerCase()===key));
  const name=(stock&&stock.name)||(menu&&menu.name);
  if(!name){showToast('SKU not found. Check the item code in Stock.','warn');return;}
  const found=QS.lines.find(x=>String(x.product||'').toLowerCase()===String(name).toLowerCase());
  if(found)found.qty=(Number(found.qty)||0)+1;
  else QS.lines.push({product:name,qty:1,price:String(bkItemPrice(name)||'')});
  qsRender();
  setTimeout(()=>{const el=document.getElementById('qsSkuScan');if(el)el.focus();},0);
}
function qsRender(){""","SKU scanner resolver")
once("""    lines = QS.lines.filter(l => String(l.product).trim()).map(l => ({product: String(l.product).trim().slice(0, 120), qty: Number(l.qty) || 0, unitPrice: Number(String(l.price).replace(/,/g, '')) || 0}));
    if(!lines.length) return err('Add at least one item, or switch to "Just the total".');
    if(lines.some(l => l.qty <= 0)) return err('Each item needs a quantity.');
    lines.forEach(l => { l.unitCost = bkItemCost(l.product); l.listPrice = bkItemPrice(l.product) || 0; if(bkMenuFind(l.product)) l.menu = true; });
  } else lines = [{product: 'Sale (total only)', qty: 1, unitPrice: total, unitCost: 0, totalOnly: true}];""","""    lines = QS.lines.filter(l => String(l.product).trim()).map(l => ({product: String(l.product).trim().slice(0, 120), qty: Number(l.qty) || 0, unitPrice: Number(bkItemPrice(String(l.product).trim())) || 0}));
    if(!lines.length) return err('Scan an SKU or add at least one item.');
    if(lines.some(l => l.qty <= 0)) return err('Each item needs a quantity.');
    if(lines.some(l => l.unitPrice <= 0)) return err('A selling price is missing. Ask the owner to set the item price in Price list before selling it.');
    lines.forEach(l => { l.unitCost = bkItemCost(l.product); l.listPrice = bkItemPrice(l.product) || 0; if(bkMenuFind(l.product)) l.menu = true; });""","backend-derived sale data")
# The owner can reach this control from Settings as well as Sales.
once("""  function run(){wrapSales();wrapCash();marketing();polishDashboard();}""","""  function addSalesPermissionShortcut(){
   let owner=false;try{owner=typeof getEffectiveRoles==='function'&&getEffectiveRoles().includes('Owner');}catch(e){}
   if(!owner)return;
   const settings=document.getElementById('page-settings');if(settings&&!settings.querySelector('.nf70-sales-setting-shortcut')){
    const card=document.createElement('section');card.className='settings-card nf70-sales-setting-shortcut';
    card.innerHTML='<h2>Sales visibility</h2><p>Choose whether staff can see the full business sales book or only entries recorded under their own accounts.</p><button type="button" class="btn btn-outline">Manage sales visibility →</button>';
    card.querySelector('button').addEventListener('click',()=>{if(typeof go==='function')go('sales');setTimeout(()=>document.querySelector('.nf70-sales-control')?.scrollIntoView({behavior:'smooth',block:'center'}),120);});
    settings.appendChild(card);
   }
  }
  function run(){wrapSales();wrapCash();marketing();polishDashboard();addSalesPermissionShortcut();}""","owner settings shortcut")
S['text']=t
