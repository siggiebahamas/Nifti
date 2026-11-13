/* ===== Round 26: Bring your shop in (the first day) ===== */
// Four easy ways to start, shown to every new shop the moment they come in, and kept on Home until they're done:
//  1. Snap your notebook and price list   2. Pick your kind of shop (starter items)
//  3. Send us your file, or we set it up  4. Invite your suppliers and customers
const NF26_KINDS = {
  hardware: ['Hardware store', `Portland Cement 40kg|bag|245
Deformed Bar 10mm x 6m|pc|165
Deformed Bar 12mm x 6m|pc|235
GI Tie Wire #16|kg|85
Common Nails 1"|kg|75
Common Nails 2"|kg|70
Common Nails 3"|kg|68
Common Nails 4"|kg|68
Concrete Nails 2"|kg|110
Concrete Nails 3"|kg|105
Roofing Nails (Umbrella)|kg|120
Hollow Blocks 4"|pc|14
Hollow Blocks 6"|pc|19
Plywood 1/4 Ordinary|sheet|420
Plywood 1/2 Ordinary|sheet|780
Plywood 3/4 Marine|sheet|1450
Coco Lumber 2x2x10|pc|95
Coco Lumber 2x3x10|pc|135
GI Sheet Corrugated 8ft|pc|320
GI Sheet Plain|pc|380
PVC Pipe 1/2" Blue|pc|85
PVC Pipe 3/4" Blue|pc|120
PVC Pipe 2" Sanitary|pc|210
PVC Pipe 4" Sanitary|pc|480
PVC Elbow 1/2"|pc|12
PVC Tee 1/2"|pc|15
PVC Solvent Cement 100cc|can|75
Teflon Tape|pc|15
Faucet 1/2" Plastic|pc|65
Faucet 1/2" Brass|pc|180
Gate Valve 1/2"|pc|220
THHN Wire 2.0mm|meter|22
THHN Wire 3.5mm|meter|36
Electrical Tape|pc|35
Convenience Outlet|pc|95
Light Switch 1-gang|pc|75
LED Bulb 9W|pc|95
Junction Box|pc|28
Latex Paint White|gallon|620
Enamel Paint White|liter|290
Paint Thinner|bottle|85
Paint Brush 2"|pc|55
Paint Roller 7"|pc|120
Sandpaper #100|sheet|18
Wood Glue 250g|bottle|95
Padlock 40mm|pc|150
Door Hinges 3"|pair|65
Hacksaw Blade|pc|55
Welding Rod 6013|kg|130
Cutting Disc 4"|pc|45`],
  sari: ['Sari-sari store', `Lucky Me Pancit Canton|pc|15
Lucky Me Beef Mami|pc|10
Century Tuna 155g|can|42
Ligo Sardines 155g|can|26
555 Sardines 155g|can|24
Argentina Corned Beef 150g|can|42
Rice (Well-milled)|kg|52
Rice (Regular)|kg|45
White Sugar 1/4 kg|pack|24
Brown Sugar 1/4 kg|pack|20
Iodized Salt 250g|pack|10
Cooking Oil 250ml|pouch|38
Soy Sauce 200ml|pouch|14
Vinegar 200ml|pouch|12
Fish Sauce (Patis) 150ml|bottle|18
Eggs (Medium)|pc|9
Nescafe 3-in-1 Original|sachet|9
Kopiko Brown|sachet|9
Milo 22g|sachet|10
Bear Brand 33g|sachet|14
Evaporated Milk 370ml|can|38
Condensed Milk 300ml|can|48
Coke Mismo 290ml|bottle|20
Coke 1.5L|bottle|75
Royal 1.5L|bottle|75
C2 Green Tea 230ml|bottle|15
Bottled Water 500ml|bottle|15
Skyflakes|pack|8
Rebisco Crackers|pack|8
Piattos 40g|pack|20
Nova 40g|pack|20
Chippy 27g|pack|10
Boy Bawang|pack|20
Candy (assorted)|pc|2
Safeguard 60g|bar|26
Shampoo (sachet)|sachet|7
Conditioner (sachet)|sachet|7
Colgate 20g|sachet|12
Surf Powder 65g|sachet|8
Laundry Bar|bar|30
Downy (sachet)|sachet|8
Joy Dishwashing (sachet)|sachet|8
Zonrox 250ml|bottle|22
Sanitary Pad|pc|6
Diaper (Medium)|pc|12
Matches|box|3
Candle|pc|8
Ice|pc|5
Bread (loaf)|pc|65
Cellphone Load|peso|1`],
  food: ['Food supply (for eateries and resellers)', `Rice 25kg|sack|1250
Rice 50kg|sack|2450
Cooking Oil 17kg|tin|1650
Cooking Oil 1L|bottle|95
White Sugar 50kg|sack|3900
Brown Sugar 50kg|sack|3500
All-purpose Flour 25kg|sack|1150
Iodized Salt 1kg|pack|28
Soy Sauce 1 gallon|gallon|185
Vinegar 1 gallon|gallon|120
Fish Sauce 1 gallon|gallon|210
Oyster Sauce 1 gallon|gallon|430
Banana Ketchup 1 gallon|gallon|195
Tomato Sauce 1kg|pack|85
MSG 1kg|pack|150
Ground Black Pepper 1kg|pack|650
Garlic|kg|140
Red Onion|kg|120
Tomatoes|kg|70
Potatoes|kg|95
Carrots|kg|110
Cabbage|kg|80
Calamansi|kg|90
Ginger|kg|130
Green Chili (Sili)|kg|150
Eggs (tray of 30)|tray|255
Whole Chicken|kg|185
Chicken Leg Quarter|kg|165
Pork Liempo|kg|360
Pork Kasim|kg|320
Ground Pork|kg|300
Beef Brisket|kg|420
Bangus|kg|200
Tilapia|kg|140
Galunggong|kg|220
Hotdog 1kg|pack|185
Longganisa|kg|240
Tocino|kg|260
Evaporated Milk 370ml|can|38
Margarine 1kg|tub|180
Pancit Canton Noodles 1kg|pack|85
Bihon 1kg|pack|110
Spaghetti Noodles 1kg|pack|95
LPG 11kg|tank|1050
Disposable Cups (50)|pack|45
Takeout Boxes (50)|pack|110
Plastic Bags (100)|pack|35
Table Napkins|pack|25
Dishwashing Liquid 1 gallon|gallon|180
Charcoal|sack|380`],
  construction: ['Construction supply', `Portland Cement 40kg|bag|245
Washed Sand|cu.m|1300
Gravel 3/4"|cu.m|1400
Hollow Blocks 4"|pc|14
Hollow Blocks 5"|pc|17
Hollow Blocks 6"|pc|19
Deformed Bar 10mm x 6m|pc|165
Deformed Bar 12mm x 6m|pc|235
Deformed Bar 16mm x 6m|pc|420
Deformed Bar 20mm x 6m|pc|660
GI Tie Wire #16|kg|85
Angle Bar 3/16 x 1-1/2 x 6m|pc|620
Angle Bar 1/4 x 2 x 6m|pc|1100
Flat Bar 1/4 x 1 x 6m|pc|290
C-Purlins 2x4 1.5mm 6m|pc|780
C-Purlins 2x6 1.5mm 6m|pc|1050
Square Tube 2x2 6m|pc|690
GI Pipe 1" S40 6m|pc|980
GI Pipe 2" S40 6m|pc|2100
Long-span Roofing (Rib)|meter|285
Ridge Roll|pc|420
Gutter|pc|460
Tekscrew (100)|box|220
Welding Rod 6013|kg|130
Cutting Disc 14"|pc|180
Grinding Disc 4"|pc|55
Marine Plywood 1/2|sheet|980
Marine Plywood 3/4|sheet|1450
Phenolic Board 1/2|sheet|1250
Fiber Cement Board 4.5mm|sheet|420
Gypsum Board 9mm|sheet|420
Metal Furring|pc|95
Metal Studs|pc|130
Tile Adhesive 25kg|bag|320
Floor Tiles 60x60|pc|185
Tile Grout 2kg|pack|95
Waterproofing (cementitious)|set|1250
Skimcoat 20kg|bag|420
Concrete Primer and Sealer|gallon|680
Red Oxide Primer|gallon|520
Coco Lumber 2x3x10|pc|135
Lumber 2x4x10 KD|pc|340
Common Nails 3"|kg|68
Concrete Nails 3"|kg|105
PVC Pipe 2" Sanitary|pc|210
PVC Pipe 4" Sanitary|pc|480
PVC Conduit 1/2"|pc|75
THHN Wire 3.5mm (150m)|box|4900
Hard Hat|pc|180
Work Gloves|pair|45`]
};
const NF26S = {view: 'home', kind: null, rows: [], offer: null, busy: false, sent: false};
const NF26_SIC = {
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', shop: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/><path d="M3 9h18"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3-3 3 3"/>', people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M19 8v6M16 11h6"/>'};
const nf26Svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NF26_SIC[k]}</svg>`;
function nf26StartKey(){ return 'nifti-start:' + ((typeof myBusiness !== 'undefined' && myBusiness && myBusiness.id) || 'demo'); }
function nf26StartState(){ try{ return JSON.parse(localStorage.getItem(nf26StartKey()) || '{}') || {}; }catch(e){ return {}; } }
function nf26StartSet(k, v){ const s = nf26StartState(); s[k] = v; try{ localStorage.setItem(nf26StartKey(), JSON.stringify(s)); }catch(e){} }
function nf26StartCounts(){
  let items = 0, cust = 0, sup = 0; try{ items = (inventoryData || []).length; }catch(e){} try{ cust = (buyersData || []).length; }catch(e){} try{ sup = (suppliersData || []).length; }catch(e){}
  return {items, cust, sup};
}
function nf26OpenStart(view){
  try{ if(typeof closeUserMenu === 'function') closeUserMenu(); if(typeof closeMobileSidebar === 'function') closeMobileSidebar(); }catch(e){}
  let ov = document.getElementById('nf26StartOv');
  if(!ov){ ov = document.createElement('div'); ov.id = 'nf26StartOv'; ov.className = 'nf20-ov nf26-start'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Bring your shop in');
    ov.addEventListener('click', e => { if(e.target === ov) nf26CloseStart(); }); document.body.appendChild(ov); }
  NF26S.view = view === 'utang' || view === 'items' ? 'snap' : (view || 'home'); NF26S.sent = false;
  ov.hidden = false; document.body.classList.add('nf20-noscroll'); nf26StartSet('seen', 1); nf26PaintStart();
  if(nf25Real() && !NF26S.offer) sb.rpc('setup_offer').then(r => { NF26S.offer = r.data || null; if(!ov.hidden) nf26PaintStart(); }).catch(() => {});
}
function nf26CloseStart(){ const ov = document.getElementById('nf26StartOv'); if(ov) ov.hidden = true; document.body.classList.remove('nf20-noscroll'); try{ const p = document.querySelector('#view-app .app-page.active'); if(p) nf26StartPass(p); }catch(e){} }
function nf26StartGo(v){ NF26S.view = v; nf26PaintStart(); const ov = document.getElementById('nf26StartOv'); if(ov) ov.scrollTop = 0; }
function nf26Snap(kind){ nf26CloseStart(); try{ nf22NbOpen(); nf22NbDo('kind', kind); nf22NbDo('next'); nf26StartSet('snap', 1); }catch(e){ console.warn(e); } }
function nf26PickKind(k){
  NF26S.kind = k; let have = new Set(); try{ have = new Set((inventoryData || []).map(i => String(i.name).toLowerCase())); }catch(e){}
  NF26S.rows = NF26_KINDS[k][1].split('\n').map(l => { const [name, unit, price] = l.split('|'); return {name, unit, price: Number(price), on: !have.has(name.toLowerCase()), had: have.has(name.toLowerCase())}; });
  nf26StartGo('items');
}
function nf26RowSet(i, k, v){ const r = NF26S.rows[i]; if(!r) return; if(k === 'on'){ r.on = !!v; const n = document.getElementById('nf26AddN'); const c = NF26S.rows.filter(x => x.on && !x.had).length; if(n) n.textContent = c ? `Add ${c} item${c === 1 ? '' : 's'} to my stock` : 'Pick at least one item'; const b = document.getElementById('nf26AddBtn'); if(b) b.disabled = !c; }
  else if(k === 'price'){ const n = Number(v); if(isFinite(n) && n >= 0) r.price = n; } }
function nf26AllRows(on){ NF26S.rows.forEach(r => { if(!r.had) r.on = on; }); nf26PaintStart(); }
async function nf26AddItems(){
  if(NF26S.busy) return; const pick = NF26S.rows.filter(r => r.on && !r.had); if(!pick.length) return;
  NF26S.busy = true; nf26PaintStart();
  try{
    const made = pick.map(r => { const it = {id: newRecordId(), code: generateUniqueSkuCode('SKU-', inventoryData, 1000, 8999), name: r.name, warehouse: 'main', onHand: 0, rop: 0, maxLevel: 0, lot: null, exp: null, status: 'healthy',
        supplier: 'Not set', daysLeft: null, leadTime: 5, unit: r.unit, sellPrice: r.price, ropEnabled: false, maxLevelEnabled: false}; inventoryData.push(it); return it; });
    if(nf25Real()){ try{ await syncInventoryToSupabase(made); }catch(e){ console.warn(e); } }
    else if(typeof scheduleNiftiSave === 'function') scheduleNiftiSave();
    try{ renderInventoryTable(); }catch(e){}
    nf26StartSet('kind', NF26S.kind); NF26S.busy = false; NF26S.added = made.length; nf26StartGo('added');
  }catch(e){ NF26S.busy = false; nf26PaintStart(); showToast((e && e.message) || "Couldn't add the items. Try again.", 'error'); }
}
async function nf26SetupFile(input){
  const f = input.files && input.files[0]; if(!f || NF26S.busy) return;
  if(f.size > 15 * 1024 * 1024){ showToast('That file is over 15 MB. Send a smaller one, or a photo.', 'warn'); return; }
  if(!nf25Real()){ NF26S.sent = true; NF26S.sentName = f.name; nf26PaintStart(); return; }
  NF26S.busy = true; nf26PaintStart();
  try{
    const ext = (f.name.split('.').pop() || 'file').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'file';
    const path = `${myBusiness.id}/setup/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const up = await sb.storage.from('receipts').upload(path, f, {contentType: f.type || 'application/octet-stream', upsert: false}); if(up.error) throw up.error;
    const note = (document.getElementById('nf26SetupNote') || {}).value || '';
    const { error } = await sb.rpc('help_send', {p_message: `Please set up my shop from this file: ${f.name}. ${note}`.trim(), p_category: 'setup', p_attachment: path}); if(error) throw error;
    NF26S.sent = true; NF26S.sentName = f.name; NF26S.offer = null; nf26StartSet('file', 1);
  }catch(e){ showToast((e && e.message) || "Couldn't send the file. Check your internet and try again.", 'error'); }
  NF26S.busy = false; nf26PaintStart();
}
function nf26PaintStart(){
  const ov = document.getElementById('nf26StartOv'); if(!ov) return;
  const c = nf26StartCounts(), demo = !nf25Real(), x = `<button type="button" class="nf20-x" onclick="nf26CloseStart()" aria-label="Close">✕</button>`;
  const back = `<button type="button" class="nf26-back" onclick="nf26StartGo('home')">‹ All four ways</button>`;
  let body = '';
  if(NF26S.view === 'snap'){
    body = `<div class="nf20-sh"><div>${back}<h2>Snap your notebook or price list</h2><p>Take a clear photo of one page. Nifti types it in and asks you about anything it can't read. Nothing is added until you say yes.</p></div>${x}</div>
      <div class="nf26-sgrid three">
        <button type="button" class="nf26-sbig" onclick="nf26Snap('stock')">${nf26Svg('cam')}<b>My price list</b><span>Your items and prices go into Stock.</span></button>
        <button type="button" class="nf26-sbig" onclick="nf26Snap('utang')">${nf26Svg('cam')}<b>My utang notebook</b><span>Who owes you goes into Getting paid.</span></button>
        <button type="button" class="nf26-sbig" onclick="nf26Snap('sales')">${nf26Svg('cam')}<b>My sales notebook</b><span>What you sold goes into Sales.</span></button></div>
      <p class="nf26-stip">Tip: stand near a window, lay the page flat, and fit the whole page in the picture. About 5 minutes a page.</p>`;
  } else if(NF26S.view === 'kind'){
    body = `<div class="nf20-sh"><div>${back}<h2>What kind of shop do you have?</h2><p>Nifti loads the 50 most common items for that kind of shop, with usual prices. You remove what you don't carry and fix the prices.</p></div>${x}</div>
      <div class="nf26-sgrid">${Object.entries(NF26_KINDS).map(([k, v]) => `<button type="button" class="nf26-sbig" onclick="nf26PickKind('${k}')">${nf26Svg('shop')}<b>${v[0]}</b><span>50 starter items</span></button>`).join('')}</div>
      <p class="nf26-stip">Not on the list? Pick the closest one, or go back and snap your price list.</p>`;
  } else if(NF26S.view === 'items'){
    const n = NF26S.rows.filter(r => r.on && !r.had).length;
    body = `<div class="nf20-sh"><div><button type="button" class="nf26-back" onclick="nf26StartGo('kind')">‹ Kinds of shop</button><h2>${NF26_KINDS[NF26S.kind][0]}: starter items</h2><p>Untick what you don't carry. Fix any price that isn't yours. You can change everything later in Stock.</p></div>${x}</div>
      <div class="nf26-ibar"><button type="button" class="nf26-link" onclick="nf26AllRows(true)">Tick all</button><button type="button" class="nf26-link" onclick="nf26AllRows(false)">Untick all</button></div>
      <div class="nf26-items">${NF26S.rows.map((r, i) => `<label class="nf26-item${r.had ? ' had' : ''}"><input type="checkbox" ${r.on ? 'checked' : ''} ${r.had ? 'disabled' : ''} onchange="nf26RowSet(${i}, 'on', this.checked)"><span class="nm">${escapeHtml(r.name)}<small>${r.had ? 'already in your stock' : 'per ' + escapeHtml(r.unit)}</small></span>
        <span class="pr"><i>₱</i><input type="number" inputmode="decimal" min="0" step="0.01" value="${r.price}" ${r.had ? 'disabled' : ''} aria-label="Price of ${escapeHtml(r.name)}" onchange="nf26RowSet(${i}, 'price', this.value)"></span></label>`).join('')}</div>
      <div class="nf20-sf nf26-payfoot"><span>Stock starts at 0. Count it later, or snap a stock count.</span><button type="button" class="btn btn-primary" id="nf26AddBtn" ${n && !NF26S.busy ? '' : 'disabled'} onclick="nf26AddItems()"><span id="nf26AddN">${NF26S.busy ? 'Adding…' : n ? `Add ${n} item${n === 1 ? '' : 's'} to my stock` : 'Pick at least one item'}</span></button></div>`;
  } else if(NF26S.view === 'added'){
    body = `<div class="nf26-done"><span class="nf26-done-ic">${NF26_CHK}</span><h2>${NF26S.added} items are in your stock</h2><p>Next, bring in who owes you, or invite a supplier so your first order is one tap.</p>
      <div class="nf26-donebtns"><button type="button" class="btn btn-primary" onclick="nf26StartGo('home')">Next step</button><button type="button" class="btn btn-outline" onclick="nf26CloseStart(); go('inventory')">See my stock</button></div></div>`;
  } else if(NF26S.view === 'file'){
    const o = NF26S.offer, offer = demo ? 'Free for the first 20 shops. After that, ₱3,500 one time (included in Business).'
      : !o ? 'One-time setup by the Nifti team.' : o.included ? 'Included in your Business plan.' : o.asked ? "You've already sent us a file. We're on it." : o.free_left > 0 ? `Free for the first 20 shops. ${o.free_left} left.` : `₱${Number(o.price).toLocaleString('en-US')} one time. We'll message you before any charge.`;
    body = `<div class="nf20-sh"><div>${back}<h2>Send us your file, or load it yourself</h2><p>Any form works: Excel, an old POS export, a PDF, even a photo of a printout.</p></div>${x}</div>
      <div class="nf26-sgrid two">
        <div class="nf26-scard"><b>We set it up for you</b><p>Send the file. The Nifti team loads your items, prices and customers, usually within 2 days, and messages you when it's ready.</p><p class="nf26-offer">${offer}</p>
          ${NF26S.sent ? `<div class="nf26-sent">${NF26_CHK}<span>${demo ? 'Demo shop: nothing was sent. In your own account, ' + escapeHtml(NF26S.sentName || 'your file') + ' goes to the Nifti team.' : 'Got it: ' + escapeHtml(NF26S.sentName || 'your file') + ". We'll message you here and on Telegram."}</span></div>`
            : `<input id="nf26SetupNote" class="nf26-in" maxlength="200" placeholder="Anything we should know? (optional)" aria-label="A note for the Nifti team"><label class="btn btn-primary nf26-filebtn${NF26S.busy ? ' busy' : ''}"><input type="file" hidden onchange="nf26SetupFile(this)">${NF26S.busy ? 'Sending…' : 'Choose a file to send'}</label>`}</div>
        <div class="nf26-scard"><b>I'll load it myself</b><p>Have an Excel or CSV of your items? Nifti reads the columns and shows you every line before anything is added.</p>
          <button type="button" class="btn btn-outline" onclick="nf26CloseStart(); go('inventory'); setTimeout(() => { try{ openImportInventoryModal(); }catch(e){} }, 500)">Upload my item list</button>
          <button type="button" class="btn btn-outline" onclick="nf26CloseStart(); try{ openOpeningBalances(); }catch(e){ go('collections'); }">Type in who owes me</button></div></div>`;
  } else if(NF26S.view === 'invite'){
    body = `<div class="nf20-sh"><div>${back}<h2>Invite 3 suppliers and 5 customers</h2><p>Each invite is one Viber or Messenger message. They don't need to download anything: they open a link.</p></div>${x}</div>
      <div class="nf26-sgrid two">
        <div class="nf26-scard"><b>Your suppliers</b><p>Suppliers who join can share their price list, and your orders reach them in one tap.</p><div class="nf26-prog"><i style="width:${Math.min(100, c.sup / 3 * 100)}%"></i></div><p class="nf26-offer">${Math.min(c.sup, 3)} of 3 added</p>
          <button type="button" class="btn btn-primary" onclick="nf26CloseStart(); nfoInvite(false)">+ Invite a supplier</button></div>
        <div class="nf26-scard"><b>Your customers</b><p>Customers who join send orders straight in, and see what they owe without calling you.</p><div class="nf26-prog"><i style="width:${Math.min(100, c.cust / 5 * 100)}%"></i></div><p class="nf26-offer">${Math.min(c.cust, 5)} of 5 added</p>
          <button type="button" class="btn btn-primary" onclick="nf26CloseStart(); nfoInvite(true)">+ Invite a customer</button></div></div>`;
  } else {
    const way = (n, ic, t, d, time, v, done) => `<button type="button" class="nf26-way${done ? ' done' : ''}" onclick="nf26StartGo('${v}')"><span class="n">${done ? NF26_CHK : n}</span><span class="ic">${nf26Svg(ic)}</span><span class="tx"><b>${t}</b><span>${d}</span><em>${time}</em></span><span class="go" aria-hidden="true">›</span></button>`;
    const st = nf26StartState();
    body = `<div class="nf20-sh"><div><h2>${demo ? 'Bring your shop in' : 'Welcome to Nifti. Let\'s bring your shop in.'}</h2><p>Pick the easiest way for you. You can use more than one, and nothing is added until you say yes.</p></div>${x}</div>
      <div class="nf26-ways">
        ${way(1, 'cam', 'Snap your notebook and price list', 'Take a photo. Nifti types in your items, prices and who owes you.', 'About 5 minutes a page', 'snap', !!st.snap)}
        ${way(2, 'shop', 'Pick your kind of shop', 'Start with the 50 most common items for a shop like yours.', 'About 10 minutes', 'kind', !!st.kind)}
        ${way(3, 'file', 'Send us your file, or we set it up', 'Excel, POS export or a photo. Load it yourself, or the Nifti team does it.', '5 minutes for you', 'file', !!st.file)}
        ${way(4, 'people', 'Invite 3 suppliers and 5 customers', 'One Viber message each. They just open a link.', 'About 5 minutes', 'invite', c.sup >= 3 && c.cust >= 5)}
      </div>
      <div class="nf20-sf nf26-startfoot"><span>${c.items} item${c.items === 1 ? '' : 's'} · ${c.cust} customer${c.cust === 1 ? '' : 's'} · ${c.sup} supplier${c.sup === 1 ? '' : 's'} so far</span>
        <span class="nf26-sfb"><button type="button" class="nf26-link" onclick="nf26CloseStart(); nf26Help()">I'd like help</button><button type="button" class="btn btn-outline" onclick="nf26CloseStart()">I'll look around first</button></span></div>`;
  }
  ov.innerHTML = `<div class="nf20-sheet nf26-ssheet">${body}</div>`;
}

/* ---------- Home: the same four ways, right on top, until the shop is in ---------- */
function nf26StartDone(){ const c = nf26StartCounts(); return c.items >= 5 && c.cust >= 1 && c.sup >= 1; }
function nf26StartCard(page){
  if(!page || page.id !== 'page-dashboard') return;
  const rows = document.querySelector('#mhHome .rows'); if(!rows) return;
  const old = document.getElementById('nf26Start'); const st = nf26StartState(); let own = true; try{ own = isPrivilegedUser() && !previewRole; }catch(e){}
  const real = nf25Real();
  // a real shop sees it until its items, a customer and a supplier are in (or they hide it); the demo shows it as a preview
  const show = own && !st.hide && (real ? !nf26StartDone() : true);
  if(!show){ if(old) old.remove(); return; }
  const c = nf26StartCounts(), key = [c.items, c.cust, c.sup, real].join('|');
  if(old && old.dataset.k === key && old.isConnected){ const m = document.querySelector('#mhHome .mosaic'); if(!m || old.nextElementSibling === m) return; }
  const el = old || document.createElement('section'); el.id = 'nf26Start'; el.className = 'nf26-startcard'; el.dataset.k = key;
  el.innerHTML = `<div class="nf26-sch"><div><b>${real ? 'Bring your shop in' : 'New shops start here'}</b><span>${real ? 'Four easy ways. Most shops are set up by lunch.' : 'This is what a new shop sees on its first day. Tap any of them to try it.'}</span></div>
      <button type="button" class="nf26-link" onclick="nf26StartSet('hide', 1); document.getElementById('nf26Start').remove()">Hide</button></div>
    <div class="nf26-scb"><button type="button" onclick="nf26OpenStart('snap')">${nf26Svg('cam')}<b>Snap your notebook</b><span>Nifti types it in</span></button>
      <button type="button" onclick="nf26OpenStart('kind')">${nf26Svg('shop')}<b>Pick your kind of shop</b><span>50 starter items</span></button>
      <button type="button" onclick="nf26OpenStart('file')">${nf26Svg('file')}<b>Send us your Excel</b><span>We set it up</span></button>
      <button type="button" onclick="nf26OpenStart('invite')">${nf26Svg('people')}<b>Invite a supplier</b><span>One Viber message</span></button></div>`;
  // right under the greeting (and the one-line checklist), above the number tiles
  const mosaic = document.querySelector('#mhHome .mosaic');
  if(mosaic && mosaic.parentElement){ if(el.nextElementSibling !== mosaic) mosaic.parentElement.insertBefore(el, mosaic); }
  else if(el.parentElement !== rows || rows.firstElementChild !== el) rows.insertBefore(el, rows.firstChild);
}
function nf26StartPass(page){ nf26StartCard(page); try{ nf26HomePlan(page); }catch(e){} try{ nf26Gate(page); nf26MenuLocks(); }catch(e){} try{ nf26BankNote(page); }catch(e){} }
// a brand-new shop gets the welcome on its first visit, once
function nf26StartBoot(){
  try{ if(!nf25Real() || !isPrivilegedUser()) return; const st = nf26StartState(); if(st.seen || nf26StartDone()) return;
    const c = nf26StartCounts(); if(c.items > 0) return;
    setTimeout(() => { try{ if(!document.querySelector('.nf20-ov:not([hidden])')) nf26OpenStart(); }catch(e){} }, 1600); }catch(e){}
}

// the older "Get set up" checklist is one line until tapped
document.addEventListener('click', e => { const h = e.target.closest && e.target.closest('#getStartedCard > :first-child'); if(h && !e.target.closest('.row-action')) h.parentElement.classList.toggle('nf26-gsopen'); });
