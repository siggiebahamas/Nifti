/* ===== Round 31: chat smarts. Nifti reads what suppliers and customers send and does the paperwork ===== */
// Quotations, invoices, order confirmations, price changes and deliveries are spotted in every chat.
// Text is checked right on the phone (free, instant). Files (PDF invoices, price lists, photos of receipts)
// are read by the same AI that reads notebook pages, once, and the result is kept for the business.
const NF31A = {cache: {}, busy: {}, tried: {}, loaded: false};
// Reading the numbers inside files needs the AI key. Off for launch: the words in each message are still read (free).
const NF31_FILES_ON = false;
const NF31_KINDS = {
  quote: {t: 'Quotation', c: 'blue'}, invoice: {t: 'Invoice', c: 'amber'}, confirm: {t: 'Order confirmed', c: 'green'},
  priceup: {t: 'Price going up', c: 'red'}, pricedown: {t: 'Price going down', c: 'green'}, delivered: {t: 'Delivered', c: 'teal'},
  shipped: {t: 'On the way', c: 'teal'}, delay: {t: 'Delivery delay', c: 'yellow'}, statement: {t: 'Statement', c: 'amber'}, doc: {t: 'Document', c: 'gray'},
};
const NF31_SPARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>';

// demo shop: what the AI would have read off the sample files
const NF31_DEMO_FILES = {
  'Invoice_INV-2026-0398.pdf': {kind: 'invoice', doc_number: 'INV-2026-0398', po_number: 'PO-2026-0765', total: 0, summary: 'Invoice for the Structural I-Beams order.'},
  'Price_List_Sept2026.pdf': {kind: 'quote', summary: 'New price list, cement up about 8%.', items: [{name: 'Portland Cement 40kg', unit: 'bag', unit_price: 211}, {name: 'Washed Sand', unit: 'cu.m', unit_price: 1450}, {name: 'Gravel 3/4', unit: 'cu.m', unit_price: 1650}]},
  'Mill_Certificate_Aug2026.pdf': {kind: 'doc', summary: 'Mill certificate (quality papers) for the steel batch. Keep it with order 0798.'},
  'DR-0412_Cebu.jpg': {kind: 'delivered', doc_number: 'DR-0412', summary: 'Delivery receipt: 50 bags Portland Cement 40kg, signed by Rico.', items: [{name: 'Portland Cement 40kg', qty: 50, unit: 'bag'}]},
};

function nf31Peso(n){ return '₱' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('en-US'); }
function nf31Amounts(t){ const out = []; String(t || '').replace(/(?:₱|php|\bp)\s?([\d][\d,]*(?:\.\d{1,2})?)/gi, (_, n) => { const v = Number(n.replace(/,/g, '')); if(v >= 1) out.push(v); }); return out; }
function nf31PoOf(text){ const m = String(text || '').match(/\bPO[-\s#]?(\d{4})[-\s]?(\d{3,4})\b/i); return m ? `PO-${m[1]}-${m[2]}` : ''; }
function nf31FindPO(num, conv){
  if(num){ const p = purchaseOrders.find(x => x.poNumber === num); if(p) return p; }
  // no number: the one open order with this party, if there is exactly one
  if(!conv) return null; const name = conv.name;
  const open = purchaseOrders.filter(p => (p.supplierName === name || p.buyerName === name) && !['paid', 'cancelled', 'draft'].includes(p.status));
  return open.length === 1 ? open[0] : null;
}
// text rules: English, Tagalog and Taglish shop words
function nf31Detect(m, conv){
  const txt = String(m.text || ''), fn = m.attachment ? String(m.attachment.name || '') : '', all = (txt + ' ' + fn.replace(/[_.-]/g, ' ')).toLowerCase();
  const out = {po: nf31PoOf(txt + ' ' + fn) || m.poRef || '', amounts: nf31Amounts(txt)};
  const pct = (all.match(/(\d+(?:\.\d+)?)\s?%/) || [])[1];
  if(/\b(invoice|inv\s?\d|billing|sales invoice|\bsi\s?#?\d|statement of account|\bsoa\b|singil)\b/.test(all)) out.kind = /statement of account|\bsoa\b/.test(all) ? 'statement' : 'invoice';
  else if(/\b(price ?list|quotation|quote|price sheet|pricelist|offer|presyo nila|bagong presyo)\b/.test(all) && !/\b(went up|going up)\b/.test(all)) out.kind = 'quote';
  else if(/(price|prices|presyo)[^.]{0,40}\b(going up|go up|went up|increase|increasing|tataas|tumaas|higher|adjust)|\b(surcharge|price increase|taas presyo|price hike)\b|\d+(\.\d+)?\s?% (increase|up|higher)/.test(all)) out.kind = 'priceup';
  else if(/(price|prices|presyo)[^.]{0,40}\b(going down|go down|went down|decrease|lower|bababa|bumaba|discount)\b/.test(all)) out.kind = 'pricedown';
  else if(/\b(delivered|has arrived|arrived|received by|dropped off|na-?deliver|nai-?deliver|nadeliver|natanggap|\bdr[-\s#]?\d)/.test(all)) out.kind = 'delivered';
  else if(/\b(delay|delayed|late|congestion|behind|extra day|next week na|matatagalan)\b/.test(all)) out.kind = 'delay';
  else if(/\b(on the way|otw|out for delivery|dispatched|shipped|loaded|papunta na|byahe na)\b/.test(all)) out.kind = 'shipped';
  else if(/\b(confirm|confirmed|confirming|noted|in production|po received|got your order|will prepare|ok na|sige po|approved|processing)\b/.test(all) && (out.po || nf31FindPO('', conv))) out.kind = 'confirm';
  if(pct) out.pct = Number(pct);
  // a question is not a confirmation or a delivery ("do you have a confirmed date?")
  if(/\?/.test(txt) && ['confirm', 'delivered', 'shipped'].includes(out.kind)) out.kind = null;
  return out.kind ? out : null;
}
// what this side bought from this party before: last price per item
function nf31LastPrices(conv){
  const name = conv && conv.name, map = {};
  purchaseOrders.filter(p => p.supplierName === name || p.buyerName === name).sort((a, b) => String(a.createdDate || a.date || '').localeCompare(String(b.createdDate || b.date || ''))).forEach(p => (p.lineItems || []).forEach(l => { map[l.product] = {price: Number(l.unitPrice) || 0, qty: Number(l.qty) || 0, po: p.poNumber}; }));
  return map;
}
function nf31Match(name, prices){ const n = String(name || '').toLowerCase(); const k = Object.keys(prices).find(x => x.toLowerCase() === n) || Object.keys(prices).find(x => n.includes(x.toLowerCase().split(' ')[0]) || x.toLowerCase().includes(n.split(' ')[0])); return k || ''; }
function nf31Ins(m, conv){
  try{
    if(!m || m.from !== 'them') return '';
    const key = m.id || (conv && conv.id) + '|' + (m.time || '') + '|' + String(m.text || '').slice(0, 30);
    let ai = NF31_FILES_ON && m.attachment && (NF31A.cache[m.id] || (!myBusiness && NF31_DEMO_FILES[m.attachment.name]));
    const det = nf31Detect(m, conv);
    if(!ai && !det){ return m.attachment && nf31Readable(m) ? nf31ReadBtn(m, conv) : ''; }
    const kind = (ai && ai.kind) || det.kind, k = NF31_KINDS[kind] || NF31_KINDS.doc;
    const po = nf31FindPO((ai && ai.po_number) || (det && det.po), conv);
    if(po && !m.poRef && (kind === 'confirm' || kind === 'invoice' || kind === 'delivered' || kind === 'shipped' || kind === 'delay')) m.poRef = po.poNumber; // the chat is now linked to the order
    NF31A.last = NF31A.last || {}; NF31A.last[key] = {m, conv, ai, det, po, kind};
    const short = po ? String(po.poNumber).replace(/^PO-\d{4}-/, '') : '';
    let line = '', acts = '';
    const openPo = po ? `<button type="button" onclick="openOrderDetailModal('${po.id}', ${po.supplierName === conv.name ? 'false' : 'true'})">Open order ${short}</button>` : '';
    if(kind === 'invoice' || kind === 'statement'){
      const amt = (ai && ai.total) || (det && det.amounts[0]) || (po && po.invoice && po.invoice.statedTotal) || (po && typeof poTotal === 'function' ? poTotal(po) : 0);
      const num = (ai && ai.doc_number) || (po && po.invoice && po.invoice.number) || '';
      const exp = po && typeof poTotal === 'function' ? poTotal(po) : 0, diff = amt && exp ? Math.round(amt - exp) : 0;
      line = `<b>${escapeHtml(num || k.t)}</b>${amt ? ` · ${nf31Peso(amt)}` : ''}${po ? ` · for order ${short}` : ''}${ai && ai.doc_date ? ` · dated ${escapeHtml(ai.doc_date)}` : ''}`
        + (po && amt ? (Math.abs(diff) < 1 ? `<span class="nf31-ok">✓ Same as the order</span>` : `<span class="nf31-bad">${diff > 0 ? nf31Peso(diff) + ' more' : nf31Peso(diff) + ' less'} than the order</span>`) : '');
      acts = openPo;
    } else if(kind === 'quote'){
      const items = (ai && ai.items) || [], last = nf31LastPrices(conv);
      line = items.length ? `<b>${items.length} item${items.length === 1 ? '' : 's'} with prices</b>${items.slice(0, 3).map(it => { const mk = nf31Match(it.name, last), was = mk ? last[mk].price : 0, ch = was && it.unit_price ? (it.unit_price - was) / was * 100 : null;
        return `<span class="nf31-it">${escapeHtml(it.name)} <b>${it.unit_price ? nf31Peso(it.unit_price) : ''}</b>${ch != null && Math.abs(ch) >= 0.5 ? `<em class="${ch > 0 ? 'up' : 'down'}">${ch > 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(1)}% vs what you paid</em>` : ''}</span>`; }).join('')}`
        : `<b>${escapeHtml((ai && ai.summary) || 'Prices sent in this chat')}</b>`;
      acts = `<button type="button" onclick="nf31Compare('${escapeHtml(key).replace(/'/g, '&#39;')}')">Compare with what I paid</button>`;
    } else if(kind === 'priceup' || kind === 'pricedown'){
      const last = nf31LastPrices(conv), words = String(m.text || '').toLowerCase(), hit = Object.keys(last).filter(n => n.toLowerCase().split(/[\s/]+/).some(w => w.length > 3 && !/\d/.test(w) && words.includes(w.replace(/s$/, ''))));
      const pct = det && det.pct, up = kind === 'priceup';
      line = `<b>${up ? 'Price going up' : 'Price going down'}${pct ? ' ' + pct + '%' : ''}</b>` + (hit.length ? hit.slice(0, 2).map(n => { const was = last[n].price, now = pct ? Math.round(was * (1 + (up ? 1 : -1) * pct / 100)) : 0;
        return `<span class="nf31-it">${escapeHtml(n)}: you last paid <b>${nf31Peso(was)}</b>${now ? ` → about <b>${nf31Peso(now)}</b>` : ''}${now && last[n].qty ? `<em class="${up ? 'up' : 'down'}">${up ? '+' : '−'}${nf31Peso(Math.abs(now - was) * last[n].qty)} on an order of ${last[n].qty}</em>` : ''}</span>`; }).join('') : `<span class="nf31-it">Nifti will compare the new prices with your last order once you get them.</span>`);
      acts = up ? `<button type="button" onclick="nf31OrderNow('${escapeHtml(conv.name).replace(/'/g, '&#39;')}')">Order before it goes up</button>` : '';
    } else if(kind === 'confirm'){
      line = po ? `<b>Order ${short} confirmed</b> by ${escapeHtml(conv.name)} · ${escapeHtml(PO_STATUS_LABELS[po.status] || po.status)} now` : `<b>Confirmed</b>`;
      acts = openPo;
    } else if(kind === 'delivered'){
      const it = ai && ai.items && ai.items[0];
      line = `<b>${po ? 'Order ' + short + ' delivered' : 'Delivery done'}</b>${it ? ` · ${it.qty || ''} ${escapeHtml(it.unit || '')} ${escapeHtml(it.name)}` : ''}${ai && ai.doc_number ? ` · ${escapeHtml(ai.doc_number)}` : ''}`;
      acts = po ? `<button type="button" onclick="openOrderDetailModal('${po.id}', ${po.supplierName === conv.name ? 'false' : 'true'})">Check it in and update stock</button>` : '';
    } else if(kind === 'shipped'){
      line = `<b>${po ? 'Order ' + short + ' is on the way' : 'On the way'}</b>`; acts = openPo;
    } else if(kind === 'delay'){
      line = `<b>${po ? 'Order ' + short + ' may be late' : 'Delivery may be late'}</b>${/\b(\d)\s?-\s?(\d)\s?days?\b/.test(m.text || '') ? ' · ' + escapeHtml((m.text.match(/\b\d\s?-\s?\d\s?days?\b/) || [''])[0]) : ''}`;
      acts = openPo;
    } else {
      line = `<b>${escapeHtml((ai && ai.summary) || k.t)}</b>`; acts = openPo;
    }
    return `<div class="nf31-ins ${k.c}"><div class="nf31-ins-h">${NF31_SPARK}<span>Nifti saw: ${escapeHtml(k.t)}</span>${ai ? '<i>read from the file</i>' : ''}</div><div class="nf31-ins-b">${line}</div>${acts ? `<div class="nf31-ins-a">${acts}</div>` : ''}</div>`;
  }catch(e){ console.warn('nf31 ins', e); return ''; }
}
function nf31Readable(m){ const a = m.attachment || {}; return /\.(pdf|jpe?g|png|webp)$/i.test(a.name || '') || a.image; }
function nf31DocName(name){ return /(inv|invoice|bill|soa|statement|quot|price|dr[-_ ]?\d|delivery|receipt|resibo|po[-_ ]?\d|order)/i.test(String(name || '')); }
function nf31ReadBtn(m, conv){
  if(!NF31_FILES_ON || !m.id) return '';
  if(NF31A.busy[m.id]) return `<div class="nf31-ins gray"><div class="nf31-ins-h">${NF31_SPARK}<span>Nifti is reading this file…</span></div></div>`;
  // business papers read themselves; other files wait for a tap
  if(myBusiness && !NF31A.tried[m.id] && nf31DocName(m.attachment.name)){ setTimeout(() => nf31Read(m.id, true), 400); }
  return `<div class="nf31-ins gray"><div class="nf31-ins-a"><button type="button" onclick="nf31Read('${m.id}')">${NF31_SPARK} Read the numbers in this file</button></div></div>`;
}
function nf31MsgById(id){ for(const c of allConversations()){ const m = (c.messages || []).find(x => x.id === id); if(m) return {m, c}; } return null; }
async function nf31Read(id, auto){
  if(!myBusiness){ showToast('Demo shop: in your own account, Nifti reads the file and shows what it found.', 'info'); return; }
  const f = nf31MsgById(id); if(!f || NF31A.busy[id]) return; NF31A.tried[id] = true;
  const a = f.m.attachment || {}; if(!a.path){ if(!auto) showToast("This file was sent before Nifti kept files, so it can't be read.", 'info'); return; }
  NF31A.busy[id] = true; nf31Rerender();
  try{
    const { data, error } = await sb.functions.invoke('chat-read', {body: {path: a.path, name: a.name, message_id: id, party: f.c.name}});
    if(error){ let msg = ''; try{ msg = (await error.context.json()).error; }catch(e){} throw new Error(msg || error.message); }
    if(!data || !data.result) throw new Error((data && data.error) || 'Nothing found');
    const r = data.result; NF31A.cache[id] = r;
    try{ await sb.from('chat_insights').upsert({business_id: myBusiness.id, message_id: id, kind: r.kind, data: r}); }catch(e){}
  }catch(e){ if(!auto) showToast(String(e.message || e).slice(0, 160), 'error'); }
  NF31A.busy[id] = false; nf31Rerender();
}
async function nf31LoadInsights(){
  if(!myBusiness || NF31A.loaded) return; NF31A.loaded = true;
  try{ const { data } = await sb.from('chat_insights').select('message_id, data').eq('business_id', myBusiness.id).order('created_at', {ascending: false}).limit(800);
    (data || []).forEach(r => { NF31A.cache[r.message_id] = r.data; NF31A.tried[r.message_id] = true; }); if((data || []).length) nf31Rerender(); }catch(e){}
}
function nf31Rerender(){ try{ const c = allConversations().find(x => x.id === activeConvId); if(c) renderThread(c); }catch(e){} }
function nf31Compare(key){
  const x = NF31A.last && NF31A.last[key]; if(!x) return;
  const items = (x.ai && x.ai.items) || [], last = nf31LastPrices(x.conv);
  const rows = items.map(it => { const mk = nf31Match(it.name, last), was = mk ? last[mk].price : 0, ch = was && it.unit_price ? it.unit_price - was : null;
    return `<tr><td>${escapeHtml(it.name)}</td><td class="r">${was ? nf31Peso(was) : '—'}</td><td class="r"><b>${it.unit_price ? nf31Peso(it.unit_price) : '—'}</b></td><td class="r ${ch > 0 ? 'up' : ch < 0 ? 'down' : ''}">${ch == null ? 'new item' : Math.abs(ch) < 0.5 ? 'same' : (ch > 0 ? '+' : '−') + nf31Peso(ch) + ' (' + (Math.abs(ch) / was * 100).toFixed(1) + '%)'}</td></tr>`; }).join('');
  slModal('nf31Cmp', `<div class="sl-sheet-h"><b>New prices vs what you paid</b><button class="sl-x" onclick="slClose('nf31Cmp')" aria-label="Close">✕</button></div>
    <div class="nf31-pop"><p class="nf31-none">From ${escapeHtml(x.conv.name)}. "You paid" is your last order with them.</p>
    ${rows ? `<table class="nf31-cmp"><thead><tr><th>Item</th><th class="r">You paid</th><th class="r">New price</th><th class="r">Change</th></tr></thead><tbody>${rows}</tbody></table>` : `<p class="nf31-none">No item prices could be read from this message yet.</p>`}
    <div class="nf31-acts"><button type="button" class="btn btn-primary" onclick="slClose('nf31Cmp'); nf31OrderNow('${escapeHtml(x.conv.name).replace(/'/g, '&#39;')}')">Make an order</button><button type="button" class="btn btn-outline" onclick="slClose('nf31Cmp'); go('prices')">See all my prices</button></div></div>`);
}
function nf31OrderNow(name){ try{ openCreatePOModal(); setTimeout(() => { const sel = document.getElementById('createPoSupplier'); if(sel){ const o = [...sel.options].find(x => x.textContent.trim() === name); if(o){ sel.value = o.value; sel.dispatchEvent(new Event('change', {bubbles: true})); } } }, 250); }catch(e){ go('orders'); } }

// demo: a delivery receipt photo arrives from the cement supplier this morning
function nf31DemoSeed(){
  if(myBusiness) return;
  try{ const c = buyerConversations.find(x => x.id === 'cebu'); if(c && !c.messages.some(m => m.nf31demo)){
    c.messages.push({from: 'them', nf31demo: true, text: 'Good morning! Delivered 50 bags Portland Cement 40kg today, received by Rico. DR attached.', time: 'Today, 7:50 AM', date: APP_TODAY, attachment: {name: 'DR-0412_Cebu.jpg', size: '640 KB'}});
    c.unread = (c.unread || 0) + 1; } }catch(e){}
}
(function(){
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ if(page && page.id === 'page-messages'){ nf31DemoSeed(); nf31LoadInsights(); } }catch(e){ console.warn('nf31 ai', e); } };
  window.nf26AfterPass = nf26AfterPass;
  try{ nf31DemoSeed(); }catch(e){}
})();
