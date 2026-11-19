/* ===== Round 48: sell online without the tech headache, and no more jumping between pages =====
   1. Voice to post   2. Post to Facebook   3. Monday price list   4. Photo cleanup   5. Replies to "how much?"
   6. Poster role     7. Checkout: GCash, Maya, COD and delivery fee by barangay   8. Pages open beside you, not instead */

const nf48E = s => nf45Esc(s);
const nf48P = n => '₱' + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-PH');
const NF48_IC = {
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  fb: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>', vb: '<path d="M21 12a9 9 0 0 1-13.6 7.7L3 21l1.4-4.2A9 9 0 1 1 21 12z"/><path d="M9 9.5c.5 2.5 2.5 4.5 5 5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', cam: '<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3.5"/>',
  wand: '<path d="m15 4 5 5L9 20l-5-5z"/><path d="M14 5l5 5M5 3v3M3.5 4.5h3M19 15v3M17.5 16.5h3"/>', chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 21 12z"/>',
  down: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>', copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  back: '<path d="M15 18l-6-6 6-6"/>', full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
};
const nf48Svg = (k, w) => `<svg viewBox="0 0 24 24" width="${w || 20}" height="${w || 20}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NF48_IC[k] || ''}</svg>`;
const nf48Phone = () => window.innerWidth <= 760 || document.documentElement.classList.contains('nf-phone');
function nf48Key(k){ return 'nifti-' + k + ':' + (typeof myBusiness !== 'undefined' && myBusiness ? myBusiness.id : 'demo'); }
function nf48Get(k, d){ try{ const v = JSON.parse(localStorage.getItem(nf48Key(k)) || 'null'); return v == null ? d : v; }catch(e){ return d; } }
function nf48Set(k, v){ try{ localStorage.setItem(nf48Key(k), JSON.stringify(v)); return true; }catch(e){ return false; } }
async function nf48Copy(t){ try{ await navigator.clipboard.writeText(t); return true; }catch(e){ try{ const a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); const ok = document.execCommand('copy'); a.remove(); return ok; }catch(x){ return false; } } }
function nf48Blob(cv, type, q){ return new Promise(res => { try{ cv.toBlob(b => res(b), type || 'image/png', q); }catch(e){ res(null); } }); }
function nf48Download(blob, name){ const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
function nf48Store(){ return (typeof myBusiness !== 'undefined' && myBusiness) ? (myBusiness.store || {}) : (window._demoStore || {}); }
// the shop's items with selling prices, best sellers first (same list the post maker uses)
function nf48Items(){ try{ return nf22Items().slice().sort((a, b) => (b.sold || 0) - (a.sold || 0) || a.name.localeCompare(b.name)); }catch(e){ return []; } }

/* ---------- 2. Post to Facebook: straight to the Page when it's connected, otherwise Facebook opens with the picture ready ---------- */
// Direct posting needs Nifti's Facebook app (set up once by Nifti, approved by Meta). NIFTI_FB is filled in by the
// config below when that is live. Until then every "Post to Facebook" button still works: on a phone the share
// sheet opens with the picture attached and the words already copied; on a computer the picture downloads and
// Facebook opens.
const NIFTI_FB = window.NIFTI_FB || {appId: '', ready: false};
function nf48FbPage(){ const s = nf48Store(); return s.fb_page && s.fb_page.id ? s.fb_page : null; }
async function nf48PostFacebook(cv, text, kind, onDone){
  const page = nf48FbPage();
  if(page && NIFTI_FB.ready && typeof myBusiness !== 'undefined' && myBusiness){
    showToast('Posting to ' + page.name + '…');
    try{
      const blob = await nf48Blob(cv, 'image/jpeg', .9), b64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
      const { data, error } = await sb.functions.invoke('fb-page', {body: {action: 'post', image: b64, caption: text}});
      if(error || !data || data.error) throw new Error((data && data.error) || (error && error.message) || 'Facebook said no');
      try{ nf22Logged(kind || 'post', 'fb-page'); }catch(e){}
      showToast('Posted on ' + page.name + '. People can see it now.', 'success'); if(onDone) onDone(true); return true;
    }catch(e){ showToast("Couldn't post straight to your Page (" + e.message + "). Opening Facebook instead.", 'warn'); }
  }
  const blob = await nf48Blob(cv); if(!blob){ showToast("Couldn't make the picture. Try again.", 'error'); return false; }
  const file = new File([blob], 'nifti-post.png', {type: 'image/png'});
  const copied = await nf48Copy(text);
  if(nf48Phone() && navigator.canShare && navigator.canShare({files: [file]})){
    showToast(copied ? 'Words copied. Pick Facebook, then long-press to paste the words.' : 'Pick Facebook. The picture is attached.', 'success');
    try{ await navigator.share({files: [file], text}); nf48AskPosted(kind, onDone); return true; }catch(e){ return false; }
  }
  nf48Download(blob, 'nifti-post.png');
  window.open(page && page.url ? page.url : 'https://www.facebook.com/', '_blank', 'noopener');
  nf45Pop('nf48FbHow', 'Post it on Facebook', `<ol class="nf48-steps"><li><b>The picture is saved</b><span>Look in your Downloads: nifti-post.png</span></li><li><b>The words are copied</b><span>${copied ? 'Ready to paste.' : 'Copy them from the box under the picture.'}</span></li><li><b>In Facebook, tap "What's on your mind?"</b><span>Paste the words, tap Photo, pick nifti-post.png, then Post.</span></li></ol>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf48FbHow')">Not yet</button><button type="button" class="btn btn-primary" onclick="slClose('nf48FbHow'); nf48Counted('${kind || 'post'}')">I posted it</button>`);
  return true;
}
function nf48Counted(kind){ try{ nf22Logged(kind || 'post', 'marked'); }catch(e){} showToast('Nice! That counts for this week.', 'success'); try{ if(document.querySelector('#storeContent .nf22s')) nf22Paint(); }catch(e){} }
function nf48AskPosted(kind, onDone){
  let n = document.getElementById('nf48Ask'); if(!n){ n = document.createElement('div'); n.id = 'nf48Ask'; n.className = 'nf48-ask'; document.body.appendChild(n); }
  n.innerHTML = `<b>Did it post?</b><button type="button" class="btn btn-primary btn-sm" onclick="this.parentElement.hidden = true; nf48Counted('${kind || 'post'}')">Yes, count it</button><button type="button" class="btn btn-outline btn-sm" onclick="this.parentElement.hidden = true">Not yet</button>`;
  n.hidden = false; clearTimeout(n._t); n._t = setTimeout(() => { n.hidden = true; }, 20000); if(onDone) onDone(false);
}
async function nf48ShareViber(cv, text, kind){
  const blob = await nf48Blob(cv); const copied = await nf48Copy(text);
  const file = blob && new File([blob], 'nifti-post.png', {type: 'image/png'});
  if(file && nf48Phone() && navigator.canShare && navigator.canShare({files: [file]})){
    showToast(copied ? 'Pick Viber, then your group. The words are copied too.' : 'Pick Viber, then your group.', 'success');
    try{ await navigator.share({files: [file], text}); nf48AskPosted(kind); }catch(e){} return; }
  if(blob) nf48Download(blob, 'nifti-post.png');
  window.open('viber://forward?text=' + encodeURIComponent(text), '_blank');
  showToast('Picture saved and words copied. In Viber, open your group, paste the words and attach the picture.', 'success');
}
// every post card gets one green "Post to Facebook" button, then Viber, then "I posted it"
(function(){
  if(typeof nf22PostBox !== 'function') return;
  const box = nf22PostBox;
  nf22PostBox = function(spec, opts){
    let h = box.apply(this, arguments);
    const page = nf48FbPage();
    h = h.replace(/<p class="nf22-how">[\s\S]*?<\/div>\s*<div class="nf22-also">/, `<p class="nf22-how">Post it</p>
      <div class="nf22-steps3 nf48-post3"><button type="button" class="btn btn-primary nf48-fbbtn" data-a="fbpost">${nf48Svg('fb', 18)}${page ? 'Post to ' + nf48E(page.name) : 'Post to Facebook'}</button>
        <button type="button" class="btn btn-outline nf48-vbbtn" data-a="vbpost">${nf48Svg('vb', 18)}Send to Viber group</button>
        <button type="button" class="btn btn-outline" data-a="posted">${nf48Svg('check', 18)}I posted it</button></div>
      <div class="nf22-also">`);
    h = h.replace(/<label class="nf22-photo">[\s\S]*?<\/label>/, m => `<button type="button" class="nf22-photo nf48-photobtn" data-a="photo" data-photo-item="${nf48E((spec.items || [])[0] || '')}"><span>Use my own photo</span></button>`);
    return h;
  };
  window.nf22PostBox = nf22PostBox;
  const act = nf22Act;
  nf22Act = async function(a, box){
    if(a === 'fbpost' || a === 'vbpost'){ const cv = box.querySelector('canvas'), ta = box.querySelector('textarea'), kind = box.dataset.type || 'post';
      if(a === 'fbpost') return nf48PostFacebook(cv, ta ? ta.value : '', kind, () => nf22Done(box, 'fbpost'));
      return nf48ShareViber(cv, ta ? ta.value : '', kind); }
    if(a === 'photo'){ const b = box.querySelector('[data-a="photo"]'); return nf48Photo(b ? b.dataset.photoItem : '', () => nf22Refresh(box)); }
    return act.apply(this, arguments);
  };
  window.nf22Act = nf22Act;
  // the words can carry what the owner said out loud
  const cap = nf22Caption;
  nf22Caption = function(spec){ let t = cap.apply(this, arguments); if(spec && spec.extra){ const rows = t.split('\n'); rows.splice(1, 0, '💬 ' + spec.extra); t = rows.join('\n'); } return t; };
  window.nf22Caption = nf22Caption;
})();

/* ---------- 1. Voice to post: say it the way you'd tell a suki, Nifti makes the picture and the words ---------- */
const NF48V = {rec: null, on: false, text: '', lang: 'fil-PH', res: null};
function nf48VoiceOk(){ return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
function nf48Voice(){
  NF48V.text = ''; NF48V.res = null;
  const ok = nf48VoiceOk();
  nf45Pop('nf48Voice', 'Say it, Nifti posts it', `<div class="nf48-vbody" id="nf48VBody">${nf48VoiceStart(ok)}</div>`, `<button type="button" class="btn btn-outline" onclick="nf48VoiceStop(); slClose('nf48Voice')">Close</button>`, {wide: true});
}
function nf48VoiceStart(ok){
  return `<p class="nf45-p">Talk like you're telling a customer. Say the item, the price, and anything else, like delivery or a sale.</p>
    <div class="nf48-vex"><span>"Bagong dating po ang semento, 230 isang bag"</span><span>"Sale ang rebar 12mm, 60 na lang hanggang Sabado"</span><span>"Nagdedeliver kami sa Marikina tuwing Lunes at Huwebes"</span></div>
    ${ok ? `<div class="nf48-mic"><button type="button" class="nf48-micbtn" id="nf48MicBtn" onclick="nf48VoiceToggle()" aria-label="Start talking">${nf48Svg('mic', 40)}</button><b id="nf48MicTxt">Tap and talk</b>
        <div class="nf48-lang"><button type="button" class="${NF48V.lang === 'fil-PH' ? 'on' : ''}" onclick="NF48V.lang='fil-PH'; this.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === this))">Tagalog / Taglish</button><button type="button" class="${NF48V.lang === 'en-PH' ? 'on' : ''}" onclick="NF48V.lang='en-PH'; this.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === this))">English</button></div></div>
      <p class="nf48-heard" id="nf48Heard" hidden></p>` : `<p class="nf48-warn">This browser can't listen. Type it below, or tap the microphone on your phone's keyboard and talk.</p>`}
    <label class="nf48-lbl" for="nf48VText">${ok ? 'Or type it' : 'What do you want to post?'}</label>
    <div class="nf48-vtype"><input id="nf48VText" placeholder="e.g. Bagong dating semento 230 isang bag" onkeydown="if(event.key==='Enter') nf48VoiceUse(this.value)"><button type="button" class="btn btn-primary" onclick="nf48VoiceUse(document.getElementById('nf48VText').value)">Make the post</button></div>`;
}
function nf48VoiceToggle(){ if(NF48V.on) return nf48VoiceStop(); const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if(!SR) return;
  const rec = new SR(); NF48V.rec = rec; rec.lang = NF48V.lang; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  const btn = document.getElementById('nf48MicBtn'), txt = document.getElementById('nf48MicTxt'), heard = document.getElementById('nf48Heard');
  rec.onstart = () => { NF48V.on = true; if(btn) btn.classList.add('on'); if(txt) txt.textContent = 'Listening… tap again when done'; };
  rec.onresult = e => { let t = ''; for(let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; NF48V.text = t; if(heard){ heard.hidden = false; heard.textContent = '"' + t + '"'; } };
  rec.onerror = e => { NF48V.on = false; if(btn) btn.classList.remove('on'); if(txt) txt.textContent = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Allow the microphone in your browser, or type it below' : e.error === 'no-speech' ? "I didn't hear anything. Tap and try again" : 'Tap and try again'; };
  rec.onend = () => { const was = NF48V.on; NF48V.on = false; if(btn) btn.classList.remove('on'); if(txt && was) txt.textContent = 'Tap and talk'; if(NF48V.text.trim()) nf48VoiceUse(NF48V.text); };
  try{ rec.start(); }catch(e){ if(txt) txt.textContent = 'Tap and try again'; }
}
function nf48VoiceStop(){ try{ if(NF48V.rec) NF48V.rec.stop(); }catch(e){} }
// what was said: kind of post, the item, the price, until when, and the rest as an extra line
function nf48Parse(raw){
  const text = String(raw || '').trim(), low = ' ' + text.toLowerCase() + ' ';
  const has = re => re.test(low);
  let type = has(/\b(sale|bawas|discount|promo|less|off|mura na|binagsak)\b/) ? 'sale' : has(/(bagong dating|bago ?ng stock|kararating|dumating|new stock|just arrived|arrived|restock|meron na ulit|kumpleto na)/) ? 'new'
    : has(/(price ?list|listahan|presyo ngayong|lahat ng presyo|prices this week)/) ? 'list' : has(/(salamat|thank)/) ? 'thanks' : 'spot';
  // the item: score every item by how many of its words were said (Tagalog words count too)
  const said = ' ' + (typeof cpoNorm === 'function' ? cpoNorm(text) : text.toLowerCase()) + ' ';
  let best = null, bestScore = 0;
  nf48Items().forEach(it => { const toks = (typeof cpoNorm === 'function' ? cpoNorm(it.name) : it.name.toLowerCase()).split(' ').filter(t => t.length > 1); let s = 0; toks.forEach(t => { if(said.includes(' ' + t + ' ')) s += /\d/.test(t) ? 2 : 3; else if(t.length > 3 && said.includes(t)) s += 1; }); if(s > bestScore){ bestScore = s; best = it; } });
  if(type === 'spot' && !best && has(/(deliver|hatid|delivery)/)) type = 'deliver';
  // the price: a number next to ₱/piso/pesos/each, or the first number that isn't a size
  const sizes = /(\d+)\s*(mm|kg|g|ml|l|inch|in|ft|ga|x)\b/gi; const clean = text.replace(sizes, ' ');
  let price = null; const m1 = clean.match(/(?:₱|php|p\s?)(\d[\d,]*(?:\.\d+)?)/i) || clean.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:piso|pesos?|each|isang|bawat|per|kada|a\s|na lang)/i) || clean.match(/(\d[\d,]*(?:\.\d+)?)/);
  if(m1){ const v = Number(String(m1[1]).replace(/,/g, '')); if(v > 0 && v < 10000000) price = v; }
  const um = low.match(/(?:isang|bawat|per|kada|a|each)\s+(bag|sako|piraso|piece|pc|roll|rolyo|box|kahon|galon|gallon|kilo|kg|meter|metro|length|sheet|dozen|set)\b/); const unit = um ? ({sako: 'bag', piraso: 'pc', piece: 'pc', rolyo: 'roll', kahon: 'box', galon: 'gallon', metro: 'meter'}[um[1]] || um[1]) : null;
  const until = (low.match(/(?:hanggang|until|till)\s+([a-z0-9]+(?:\s+[0-9]+)?)/) || [])[1] || '';
  let extra = text.replace(/\s+/g, ' ').trim(); if(extra.length > 12){ extra = extra.charAt(0).toUpperCase() + extra.slice(1); if(!/[.!?]$/.test(extra)) extra += '.'; } else extra = '';
  return {text, type, item: best, score: bestScore, price, unit, until: until ? until.charAt(0).toUpperCase() + until.slice(1) : '', extra};
}
function nf48VoiceUse(raw){
  const text = String(raw || '').trim(); if(!text){ showToast('Say or type what you want to post first.', 'warn'); return; }
  const r = nf48Parse(text); NF48V.res = r;
  const body = document.getElementById('nf48VBody'); if(!body) return;
  const items = nf48Items(), it = r.item, stockPrice = it ? Number(it.price) || 0 : 0;
  const needsItem = ['spot', 'sale', 'new'].includes(r.type);
  const types = [['spot', 'One item'], ['new', 'New stock'], ['sale', 'Sale'], ['list', 'Price list'], ['deliver', 'Delivery days'], ['thanks', 'Thank you']];
  const priceDiff = it && r.price && r.type !== 'sale' && Math.abs(r.price - stockPrice) >= 0.5;
  body.innerHTML = `<p class="nf48-heard">"${nf48E(text)}"</p>
    <div class="nf48-vres">
      <label>Kind of post<select id="nf48VType" onchange="NF48V.res.type=this.value; nf48VoiceUse(NF48V.res.text)">${types.map(([k, l]) => `<option value="${k}" ${r.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${needsItem ? `<label>Item<select id="nf48VItem" onchange="NF48V.res.item = nf48Items().find(i => i.name === this.value) || null; nf48VoiceUse(NF48V.res.text)"><option value="">${it ? '' : 'Pick the item…'}</option>${items.map(x => `<option value="${nf48E(x.name)}" ${it && it.name === x.name ? 'selected' : ''}>${nf48E(x.name)} · ${nf48P(x.price)}</option>`).join('')}</select></label>` : ''}
      ${r.type === 'sale' ? `<label>Sale price (₱)<input id="nf48VPrice" type="number" inputmode="decimal" value="${r.price || ''}"></label><label>Until<input id="nf48VUntil" value="${nf48E(r.until)}" placeholder="e.g. Saturday"></label>`
        : needsItem ? `<label>Price you said (₱)<input id="nf48VPrice" type="number" inputmode="decimal" value="${r.price || (it ? stockPrice : '')}"></label>` : ''}
    </div>
    ${needsItem && !it ? `<div class="nf48-warn">I couldn't match an item in your Stock. Pick it above${typeof openAddInventoryItem === 'function' ? `, or <button type="button" class="nf43-link" onclick="slClose('nf48Voice'); openAddInventoryItem()">add it to Stock first</button>` : ''}.</div>` : ''}
    ${priceDiff ? `<label class="nf48-chk"><input type="checkbox" id="nf48VSync" checked> Also change the selling price in Stock from ${nf48P(stockPrice)} to ${nf48P(r.price)}</label>` : ''}
    <label class="nf48-chk"><input type="checkbox" id="nf48VExtra" ${r.extra ? 'checked' : ''}> Add what I said as a line in the post</label>
    <div class="nf48-vgo"><button type="button" class="btn btn-outline" onclick="document.getElementById('nf48VBody').innerHTML = nf48VoiceStart(nf48VoiceOk())">Say it again</button><button type="button" class="btn btn-primary" onclick="nf48VoiceMake()">Make the post</button></div>`;
}
function nf48VoiceMake(){
  const r = NF48V.res; if(!r) return;
  const type = (document.getElementById('nf48VType') || {}).value || r.type, itemSel = document.getElementById('nf48VItem'), it = itemSel ? nf48Items().find(i => i.name === itemSel.value) : r.item;
  if(['spot', 'sale', 'new'].includes(type) && !it){ showToast('Pick the item first.', 'warn'); return; }
  const price = Number((document.getElementById('nf48VPrice') || {}).value) || null, until = (document.getElementById('nf48VUntil') || {}).value || r.until;
  const sync = document.getElementById('nf48VSync'), extra = document.getElementById('nf48VExtra');
  if(sync && sync.checked && it && price && typeof bkSetItemNumber === 'function'){ try{ bkSetItemNumber(it.name, 'sellPrice', price); const c = (typeof myCatalog !== 'undefined' ? myCatalog : []).find(x => x.product === it.name); if(c) c.price = price; showToast(`${it.name} now sells at ${nf48P(price)} in Stock.`, 'success'); }catch(e){} }
  NF22S.pick = type; NF22S.make = Object.assign(NF22S.make || {}, {type, items: it ? [it.name] : (type === 'list' ? nf48Items().slice(0, 6).map(x => x.name) : []), newPrice: type === 'sale' ? price : '', until: type === 'sale' ? until : ''});
  NF22S.extra = extra && extra.checked ? r.extra : ''; NF22S.tab = 'today';
  slClose('nf48Voice');
  const done = () => { try{ nf22Paint(); }catch(e){} setTimeout(() => { const pb = document.querySelector('#nf22sBody .nf22-post'); if(pb) pb.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 120); };
  if(!document.querySelector('#storeContent .nf22s')){ navigate('store'); setTimeout(done, 500); } else done();
}
// the spoken line goes into the post the maker draws
(function(){ if(typeof nf23PostHtml !== 'function') return; const ph = nf23PostHtml; nf23PostHtml = function(){ const h = ph.apply(this, arguments); if(!NF22S.extra) return h;
  return h.replace(/data-spec="([^"]*)"/, (m, s) => { try{ const spec = JSON.parse(s.replace(/&quot;/g, '"').replace(/&amp;/g, '&')); spec.extra = NF22S.extra; return 'data-spec="' + nf22Esc(JSON.stringify(spec)) + '"'; }catch(e){ return m; } })
    .replace(/(<textarea[^>]*>)([\s\S]*?)(<\/textarea>)/, (m, a, t, c) => a + nf22Esc((() => { const rows = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').split('\n'); rows.splice(1, 0, '💬 ' + NF22S.extra); return rows.join('\n'); })()) + c); };
  window.nf23PostHtml = nf23PostHtml;
  if(typeof nf22TodayHtml === 'function'){ const th = nf22TodayHtml; nf22TodayHtml = function(){ const h = th.apply(this, arguments); if(!NF22S.extra || h.includes('💬 ')) return h; return h.replace(/(<textarea[^>]*>)([\s\S]*?)(<\/textarea>)/, (m, a, t, c) => { const rows = t.split('\n'); rows.splice(1, 0, '💬 ' + nf22Esc(NF22S.extra)); return a + rows.join('\n') + c; }); }; window.nf22TodayHtml = nf22TodayHtml; } })();

/* ---------- 3. Monday price list: one picture from Stock, ready every week, sent to the Viber group in one tap ---------- */
const NF48L = {pages: [], i: 0, picks: null, lang: 'tl'};
function nf48WeekStart(iso){ const d = new Date((iso || APP_TODAY) + 'T00:00:00'), dow = (d.getDay() + 6) % 7; return addDaysIso(iso || APP_TODAY, -dow); }
function nf48ListItems(){
  const all = nf48Items().filter(i => i.price > 0), picks = NF48L.picks || nf48Get('pl-pick', null);
  if(picks && picks.length) return all.filter(i => picks.includes(i.name));
  return all.filter(i => !(Number(i.onHand) <= 0 && i.onHand != null)).slice(0, 24);
}
function nf48ListSentThisWeek(){ const l = nf48Get('pl-last', null); return !!(l && l.d >= nf48WeekStart()); }
async function nf48DrawList(items, page, pages, last){
  const s = nf22Shop(), W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const font = (w, px) => `${w} ${px}px "Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif`;
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#1F6B45'; c.fillRect(0, 0, W, 210);
  c.fillStyle = '#FFFFFF'; c.font = font(800, 54); c.fillText(s.name.slice(0, 30), 60, 92);
  const wk = new Date(nf48WeekStart() + 'T00:00:00').toLocaleDateString('en-PH', {month: 'long', day: 'numeric'});
  c.font = font(700, 34); c.fillStyle = '#FDE68A'; c.fillText((NF48L.lang === 'en' ? 'PRICE LIST · Week of ' : 'PRESYO NGAYONG LINGGO · ') + wk, 60, 150);
  if(pages > 1){ c.font = font(700, 28); c.fillStyle = '#FFFFFF'; c.textAlign = 'right'; c.fillText(`${page + 1}/${pages}`, W - 60, 92); c.textAlign = 'left'; }
  const top = 250, rowH = 74;
  c.font = font(700, 24); c.fillStyle = '#475467'; c.fillText(NF48L.lang === 'en' ? 'ITEM' : 'PRODUKTO', 60, top - 12); c.textAlign = 'right'; c.fillText(NF48L.lang === 'en' ? 'PRICE' : 'PRESYO', W - 60, top - 12); c.textAlign = 'left';
  items.forEach((it, k) => { const y = top + k * rowH;
    if(k % 2 === 0){ c.fillStyle = '#F4F7F5'; c.fillRect(40, y, W - 80, rowH); }
    c.fillStyle = '#0B0F14'; c.font = font(700, 34); let name = it.name; while(c.measureText(name).width > 610 && name.length > 4) name = name.slice(0, -2); if(name !== it.name) name = name.trim() + '…'; c.fillText(name, 60, y + 48);
    c.font = font(800, 38); c.textAlign = 'right'; c.fillText(nf22P(it.price), W - 60, y + 50); const pw = c.measureText(nf22P(it.price)).width;
    c.font = font(600, 24); c.fillStyle = '#475467'; c.fillText('/' + (it.unit || 'pc'), W - 60, y + 50 - 0, 0); c.textAlign = 'left';
    const was = last && last.p ? last.p[it.name] : undefined; let tag = '', col = '';
    if(was == null && last && last.p) { tag = NF48L.lang === 'en' ? 'NEW' : 'BAGO'; col = '#2563EB'; } else if(was != null && Math.round(it.price) !== Math.round(was)){ tag = (it.price > was ? '▲ ' : '▼ ') + nf22P(Math.abs(it.price - was)); col = it.price > was ? '#B42318' : '#15803D'; }
    if(tag){ c.font = font(800, 22); const tw = c.measureText(tag).width + 22, tx = W - 60 - pw - 24 - tw; c.fillStyle = col; nf22Rr(c, tx, y + 22, tw, 34, 17); c.fill(); c.fillStyle = '#FFFFFF'; c.fillText(tag, tx + 11, y + 46); }
  });
  // footer: how to order
  c.fillStyle = '#123F29'; c.fillRect(0, H - 220, W, 220);
  c.fillStyle = '#FFFFFF'; c.font = font(800, 36); c.fillText(NF48L.lang === 'en' ? 'Order online:' : 'Mag-order online:', 60, H - 150);
  c.font = font(700, 30); c.fillStyle = '#FDE68A'; c.fillText(nf22Short(s.url('pricelist')).slice(0, 42), 60, H - 104);
  c.font = font(600, 26); c.fillStyle = '#FFFFFF'; c.fillText(((NF48L.lang === 'en' ? 'Delivery: ' : 'Delivery sa ') + s.areas + (s.cod ? ' · COD ok' : '')).slice(0, 56), 60, H - 58);
  try{ if(typeof qrDataUrl === 'function'){ const q = await qrDataUrl(s.url('pricelist'), 6); if(q){ const im = await new Promise((r, j) => { const x = new Image(); x.onload = () => r(x); x.onerror = j; x.src = q; }); c.fillStyle = '#FFFFFF'; nf22Rr(c, W - 230, H - 205, 180, 180, 16); c.fill(); c.drawImage(im, W - 220, H - 195, 160, 160); } } }catch(e){}
  return cv;
}
async function nf48BuildList(){
  const items = nf48ListItems(), per = 12, last = nf48Get('pl-last', null), chunks = [];
  for(let i = 0; i < items.length; i += per) chunks.push(items.slice(i, i + per));
  NF48L.pages = []; for(let i = 0; i < chunks.length; i++) NF48L.pages.push(await nf48DrawList(chunks[i], i, chunks.length, last));
  NF48L.i = 0; return items;
}
function nf48ListText(items){ const s = nf22Shop(), en = NF48L.lang === 'en'; return [(en ? '📋 THIS WEEK\'S PRICES' : '📋 PRESYO NGAYONG LINGGO') + ' · ' + s.name, ...items.map(i => `• ${i.name}: ${nf22P(i.price)}/${i.unit || 'pc'}`), (en ? '🚚 Delivery to ' : '🚚 Delivery sa ') + s.areas + (s.cod ? ' · COD ok' : ''), (en ? '👉 Order here: ' : '👉 Order dito: ') + s.url('pricelist')].join('\n'); }
async function nf48PriceList(){
  nf45Pop('nf48List', 'This week\'s price list', `<div class="nf48-lwrap"><div class="nf48-lprev"><div id="nf48LCv" class="nf48-lcv"><p class="nf45-sm">Making your price list…</p></div><div class="nf48-ldots" id="nf48LDots"></div></div>
      <div class="nf48-lside"><p class="nf45-p">Made from your Stock prices. <b>Red ▲</b> went up, <b>green ▼</b> went down since the last list you sent.</p>
        <div class="nf48-lang"><button type="button" class="${NF48L.lang === 'tl' ? 'on' : ''}" onclick="NF48L.lang='tl'; nf48ListPaint()">Taglish</button><button type="button" class="${NF48L.lang === 'en' ? 'on' : ''}" onclick="NF48L.lang='en'; nf48ListPaint()">English</button></div>
        <details class="nf48-lpick"><summary>Items on the list <small id="nf48LCount"></small></summary><div class="nf48-lbar"><button type="button" class="nf43-link" onclick="nf48ListAll(true)">All</button><button type="button" class="nf43-link" onclick="nf48ListAll(false)">Best sellers only</button></div><div id="nf48LItems"></div></details>
        <div class="nf48-lacts"><button type="button" class="btn btn-primary" onclick="nf48ListSend('viber')">${nf48Svg('vb', 18)}Send to Viber group</button><button type="button" class="btn btn-outline" onclick="nf48ListSend('fb')">${nf48Svg('fb', 18)}Post to Facebook</button>
          <button type="button" class="btn btn-outline" onclick="nf48ListSend('save')">${nf48Svg('down', 18)}Save picture</button><button type="button" class="btn btn-outline" onclick="nf48ListSend('text')">${nf48Svg('copy', 18)}Copy as text</button></div>
        <p class="nf45-sm" id="nf48LLast"></p></div></div>`, `<button type="button" class="btn btn-outline" onclick="slClose('nf48List')">Close</button>`, {wide: true});
  nf48ListPaint();
}
async function nf48ListPaint(){
  const items = await nf48BuildList(), host = document.getElementById('nf48LCv'); if(!host) return;
  document.querySelectorAll('#nf48List .nf48-lang button').forEach((b, i) => b.classList.toggle('on', (i === 0) === (NF48L.lang === 'tl')));
  host.innerHTML = ''; if(!NF48L.pages.length){ host.innerHTML = '<p class="nf45-sm">No items with a selling price yet. Add prices in Stock first.</p>'; return; }
  const cv = NF48L.pages[NF48L.i]; cv.className = 'nf48-lcanvas'; host.appendChild(cv);
  const dots = document.getElementById('nf48LDots'); if(dots) dots.innerHTML = NF48L.pages.length > 1 ? NF48L.pages.map((_, i) => `<button type="button" class="${i === NF48L.i ? 'on' : ''}" onclick="NF48L.i=${i}; nf48ListShow()" aria-label="Page ${i + 1}">${i + 1}</button>`).join('') : '';
  const all = nf48Items().filter(i => i.price > 0), on = new Set(items.map(i => i.name));
  const box = document.getElementById('nf48LItems'); if(box) box.innerHTML = all.map(i => `<label><input type="checkbox" ${on.has(i.name) ? 'checked' : ''} onchange="nf48ListToggle(this.value, this.checked)" value="${nf48E(i.name)}"><span>${nf48E(i.name)}</span><b>${nf48P(i.price)}</b></label>`).join('');
  const cnt = document.getElementById('nf48LCount'); if(cnt) cnt.textContent = `${items.length} item${items.length === 1 ? '' : 's'}${NF48L.pages.length > 1 ? ' · ' + NF48L.pages.length + ' pictures' : ''}`;
  const last = nf48Get('pl-last', null), ll = document.getElementById('nf48LLast'); if(ll) ll.textContent = last ? 'Last sent ' + new Date(last.d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'}) + '.' : 'Not sent yet. Send it every Monday so buyers know your prices.';
}
function nf48ListShow(){ const host = document.getElementById('nf48LCv'); if(!host || !NF48L.pages[NF48L.i]) return; host.innerHTML = ''; NF48L.pages[NF48L.i].className = 'nf48-lcanvas'; host.appendChild(NF48L.pages[NF48L.i]); document.querySelectorAll('#nf48LDots button').forEach((b, i) => b.classList.toggle('on', i === NF48L.i)); }
function nf48ListToggle(name, on){ const cur = (NF48L.picks || nf48Get('pl-pick', null) || nf48ListItems().map(i => i.name)).filter(n => n !== name); if(on) cur.push(name); NF48L.picks = cur; nf48Set('pl-pick', cur); nf48ListPaint(); }
function nf48ListAll(all){ NF48L.picks = all ? nf48Items().filter(i => i.price > 0).map(i => i.name) : nf48Items().filter(i => i.price > 0).slice(0, 12).map(i => i.name); nf48Set('pl-pick', NF48L.picks); nf48ListPaint(); }
async function nf48ListSend(how){
  const items = nf48ListItems(); if(!NF48L.pages.length){ showToast('Add selling prices in Stock first.', 'warn'); return; }
  const text = nf48ListText(items), mark = () => { const p = {}; nf48Items().forEach(i => { p[i.name] = i.price; }); nf48Set('pl-last', {d: APP_TODAY, p}); try{ nf22Logged('list', how); }catch(e){} nf48HomeCard(); };
  if(how === 'text'){ await nf48Copy(text); showToast('Price list copied as text. Paste it in Viber or Messenger.', 'success'); mark(); return; }
  if(how === 'save'){ for(let i = 0; i < NF48L.pages.length; i++){ const b = await nf48Blob(NF48L.pages[i]); if(b) nf48Download(b, `price-list-${APP_TODAY}${NF48L.pages.length > 1 ? '-' + (i + 1) : ''}.png`); } showToast('Saved to your Downloads.', 'success'); mark(); return; }
  if(how === 'fb'){ await nf48PostFacebook(NF48L.pages[0], text, 'list'); mark(); return; }
  // Viber: every picture at once through the share sheet
  const files = []; for(let i = 0; i < NF48L.pages.length; i++){ const b = await nf48Blob(NF48L.pages[i]); if(b) files.push(new File([b], `price-list-${i + 1}.png`, {type: 'image/png'})); }
  await nf48Copy(text);
  if(nf48Phone() && navigator.canShare && navigator.canShare({files})){ showToast('Pick Viber, then your customer group. The text is copied too.', 'success'); try{ await navigator.share({files, text}); mark(); nf48AskPosted('list'); }catch(e){} return; }
  files.forEach(f => nf48Download(f, f.name)); window.open('viber://forward?text=' + encodeURIComponent(text), '_blank');
  showToast('Pictures saved and text copied. In Viber, open your group and attach the pictures.', 'success'); mark();
}
// Home: a short reminder on Mondays (and until it's sent that week)
function nf48HomeCard(){
  const home = document.getElementById('page-dashboard'); if(!home) return;
  let c = home.querySelector('.nf48-home');
  const allowed = typeof isPageAllowedForViewAsRole !== 'function' || isPageAllowedForViewAsRole('store');
  const items = nf48Items().filter(i => i.price > 0), dow = new Date(APP_TODAY + 'T00:00:00').getDay();
  const poster = nf48IsPoster();
  const show = allowed && items.length >= 3 && (poster || ((dow === 1 || dow === 2) && !nf48ListSentThisWeek()));
  if(!show){ if(c) c.remove(); return; }
  const want = poster ? 'top' : 'pills';
  if(c && c.dataset.at !== want){ c.remove(); c = null; }
  if(!c){ c = document.createElement('section'); c.className = 'nf48-home panel-card'; c.dataset.at = want;
    const anchor = poster ? home.querySelector(':scope > .page-head') : (home.querySelector('.nf43-pills') || home.querySelector('.page-head'));
    if(anchor) anchor.after(c); else home.prepend(c); }
  const sent = nf48ListSentThisWeek();
  const html = poster ? `<div class="h"><b>Your job: post for ${nf48E(nf22Shop().name)}</b><small>Three things that bring in orders. Each one takes a minute.</small></div>
      <div class="a"><button type="button" class="btn btn-primary" onclick="nf48Voice()">${nf48Svg('mic', 18)}Say it, Nifti posts it</button><button type="button" class="btn btn-outline" onclick="nf48PriceList()">${nf48Svg('list', 18)}${sent ? 'Price list (sent this week)' : 'Send this week\'s price list'}</button><button type="button" class="btn btn-outline" onclick="go('store')">Today's post</button></div>`
    : `<div class="h"><b>This week's price list is ready</b><small>Made from your Stock prices. Send it to your customer group so they order this week.</small></div><div class="a"><button type="button" class="btn btn-primary" onclick="nf48PriceList()">${nf48Svg('list', 18)}See and send it</button><button type="button" class="nf43-link" onclick="nf48Set('pl-last', {d: APP_TODAY, p: (nf48Get('pl-last', {}) || {}).p || {}}); nf48HomeCard()">Not this week</button></div>`;
  if(c.dataset.k !== html){ c.dataset.k = html; c.innerHTML = html; }
}

/* ---------- 4. Photo cleanup: brighter, plain background, a price tag, ready for posts and the price list ---------- */
const NF48F = {img: null, item: '', after: null, bg: 1, tag: true, name: true, bright: true, price: '', unit: '', out: '', before: false};
function nf48Photos(){ return nf48Get('item-photos', {}) || {}; }
function nf48LoadPhotos(){ try{ const m = nf48Photos(); NF22S.photo = NF22S.photo || {}; Object.keys(m).forEach(k => { if(!NF22S.photo[k]) NF22S.photo[k] = m[k]; }); }catch(e){} }
function nf48Photo(item, after){
  NF48F.item = item || ''; NF48F.after = after || null; NF48F.img = null; NF48F.out = '';
  const it = nf48Items().find(i => i.name === NF48F.item); NF48F.price = it ? it.price : ''; NF48F.unit = it ? (it.unit || 'pc') : 'pc';
  nf45Pop('nf48Photo', 'Make your photo look good', `<div id="nf48FBody">${nf48PhotoPick()}</div>`, `<button type="button" class="btn btn-outline" onclick="slClose('nf48Photo')">Close</button>`, {wide: true});
}
function nf48PhotoPick(){
  const items = nf48Items();
  return `<p class="nf45-p">Take the photo on a plain floor or wall, near a window. Nifti brightens it, cleans the background and adds your price.</p>
    <label class="nf48-lbl">Which item is it?<select id="nf48FItem" onchange="NF48F.item=this.value; const it = nf48Items().find(i => i.name === this.value); if(it){ NF48F.price = it.price; NF48F.unit = it.unit || 'pc'; }"><option value="">Not an item (just a photo)</option>${items.map(i => `<option value="${nf48E(i.name)}" ${NF48F.item === i.name ? 'selected' : ''}>${nf48E(i.name)}</option>`).join('')}</select></label>
    <div class="nf48-fsrc"><label class="nf48-fbig"><input type="file" accept="image/*" capture="environment" data-nf-cam="1" hidden onchange="nf48PhotoFile(this)">${nf48Svg('cam', 30)}<b>Take a photo</b></label><label class="nf48-fbig"><input type="file" accept="image/*" data-nf-cam="1" hidden onchange="nf48PhotoFile(this)">${nf48Svg('down', 30)}<b>Pick from my phone</b></label></div>`;
}
function nf48PhotoFile(input){
  const f = input.files && input.files[0]; if(!f) return; const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => { NF48F.img = im; nf48PhotoEditor(); }; im.onerror = () => showToast("Couldn't open that photo. Try another one.", 'error'); im.src = r.result; };
  r.readAsDataURL(f);
}
function nf48PhotoEditor(){
  const b = document.getElementById('nf48FBody'); if(!b) return;
  b.innerHTML = `<div class="nf48-fed"><div class="nf48-fprev"><canvas id="nf48FCv" width="1080" height="1080"></canvas><button type="button" class="nf48-fbefore" onpointerdown="NF48F.before=true; nf48PhotoRender()" onpointerup="NF48F.before=false; nf48PhotoRender()" onpointerleave="if(NF48F.before){ NF48F.before=false; nf48PhotoRender(); }">Hold to see the original</button></div>
    <div class="nf48-fctl"><b>Background</b><div class="nf48-seg">${[['0', 'Keep it'], ['1', 'Clean'], ['2', 'Cleaner']].map(([v, l]) => `<button type="button" class="${String(NF48F.bg) === v ? 'on' : ''}" onclick="NF48F.bg=${v}; this.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === this)); nf48PhotoRender()">${l}</button>`).join('')}</div>
      <label class="nf48-chk"><input type="checkbox" ${NF48F.bright ? 'checked' : ''} onchange="NF48F.bright=this.checked; nf48PhotoRender()"> Brighter colors</label>
      <label class="nf48-chk"><input type="checkbox" ${NF48F.tag ? 'checked' : ''} onchange="NF48F.tag=this.checked; nf48PhotoRender()"> Price tag</label>
      <div class="nf48-frow"><label>Price (₱)<input type="number" inputmode="decimal" value="${nf48E(NF48F.price)}" oninput="NF48F.price=this.value; nf48PhotoRender()"></label><label>Per<input value="${nf48E(NF48F.unit)}" oninput="NF48F.unit=this.value; nf48PhotoRender()"></label></div>
      <label class="nf48-chk"><input type="checkbox" ${NF48F.name ? 'checked' : ''} onchange="NF48F.name=this.checked; nf48PhotoRender()"> Shop name in the corner</label>
      <div class="nf48-fgo"><button type="button" class="btn btn-primary" onclick="nf48PhotoUse()">Use this photo</button><button type="button" class="btn btn-outline" onclick="nf48PhotoSave()">Save to my phone</button><button type="button" class="nf43-link" onclick="document.getElementById('nf48FBody').innerHTML = nf48PhotoPick()">Take another</button></div></div></div>`;
  nf48PhotoRender();
}
// background: flood-fill from the edges with what looks like the backdrop, then fade it to white
function nf48Clean(img, level, bright){
  const max = 900, sc = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height)), w = Math.round((img.naturalWidth || img.width) * sc), h = Math.round((img.naturalHeight || img.height) * sc);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); c.drawImage(img, 0, 0, w, h);
  const id = c.getImageData(0, 0, w, h), d = id.data, n = w * h;
  if(bright){ for(let ch = 0; ch < 3; ch++){ const hist = new Uint32Array(256); for(let i = 0; i < n; i++) hist[d[i * 4 + ch]]++; let lo = 0, hi = 255, acc = 0; while(lo < 255 && (acc += hist[lo]) < n * .01) lo++; acc = 0; while(hi > 0 && (acc += hist[hi]) < n * .01) hi--; if(hi - lo > 30){ const k = 255 / (hi - lo); for(let i = 0; i < n; i++){ const v = (d[i * 4 + ch] - lo) * k; d[i * 4 + ch] = v < 0 ? 0 : v > 255 ? 255 : v; } } } }
  let box = {x0: 0, y0: 0, x1: w, y1: h};
  if(level > 0){
    const tol = level === 1 ? 34 : 54, edge = [], step = Math.max(1, Math.floor(Math.min(w, h) / 120));
    for(let x = 0; x < w; x += step){ edge.push(x, (h - 1) * w + x); } for(let y = 0; y < h; y += step){ edge.push(y * w, y * w + w - 1); }
    const rs = [], gs = [], bs = []; edge.forEach(p => { rs.push(d[p * 4]); gs.push(d[p * 4 + 1]); bs.push(d[p * 4 + 2]); }); const med = a => a.sort((x, y) => x - y)[a.length >> 1]; const br = med(rs), bg = med(gs), bb = med(bs);
    const dist = p => Math.abs(d[p * 4] - br) + Math.abs(d[p * 4 + 1] - bg) + Math.abs(d[p * 4 + 2] - bb);
    const mask = new Uint8Array(n), q = new Int32Array(n); let qh = 0, qt = 0;
    for(let x = 0; x < w; x++){ [x, (h - 1) * w + x].forEach(p => { if(!mask[p] && dist(p) < tol * 1.6){ mask[p] = 1; q[qt++] = p; } }); }
    for(let y = 0; y < h; y++){ [y * w, y * w + w - 1].forEach(p => { if(!mask[p] && dist(p) < tol * 1.6){ mask[p] = 1; q[qt++] = p; } }); }
    while(qh < qt){ const p = q[qh++], x = p % w, y = (p / w) | 0; const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for(const m of nb){ if(m < 0 || mask[m]) continue; const local = Math.abs(d[m * 4] - d[p * 4]) + Math.abs(d[m * 4 + 1] - d[p * 4 + 1]) + Math.abs(d[m * 4 + 2] - d[p * 4 + 2]); if(dist(m) < tol * 1.6 && local < tol){ mask[m] = 1; q[qt++] = m; } } }
    const kept = n - qt;
    if(kept > n * .04){ // something is left that isn't backdrop: whiten the rest with a soft edge
      const a = new Float32Array(n); for(let i = 0; i < n; i++) a[i] = mask[i] ? 1 : 0;
      for(let pass = 0; pass < 2; pass++){ const t = new Float32Array(n); for(let y = 1; y < h - 1; y++) for(let x = 1; x < w - 1; x++){ const p = y * w + x; t[p] = (a[p] * 4 + a[p - 1] + a[p + 1] + a[p - w] + a[p + w]) / 8; } a.set(t); }
      let x0 = w, y0 = h, x1 = 0, y1 = 0;
      for(let i = 0; i < n; i++){ const k = a[i]; if(k > 0){ d[i * 4] += (255 - d[i * 4]) * k; d[i * 4 + 1] += (255 - d[i * 4 + 1]) * k; d[i * 4 + 2] += (255 - d[i * 4 + 2]) * k; } if(!mask[i]){ const x = i % w, y = (i / w) | 0; if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; } }
      if(x1 > x0 && y1 > y0) box = {x0, y0, x1, y1};
    }
  }
  c.putImageData(id, 0, 0);
  return {cv, box, w, h};
}
function nf48PhotoRender(){
  const cv = document.getElementById('nf48FCv'); if(!cv || !NF48F.img) return; const c = cv.getContext('2d'), S = 1080;
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, S, S);
  if(NF48F.before){ const im = NF48F.img, r = Math.min(S / im.naturalWidth, S / im.naturalHeight); c.drawImage(im, (S - im.naturalWidth * r) / 2, (S - im.naturalHeight * r) / 2, im.naturalWidth * r, im.naturalHeight * r); return; }
  const k = NF48F.bg + '|' + NF48F.bright; if(NF48F._k !== k){ NF48F._k = k; NF48F._c = nf48Clean(NF48F.img, Number(NF48F.bg), NF48F.bright); }
  const {cv: src, box} = NF48F._c, bw = box.x1 - box.x0, bh = box.y1 - box.y0, pad = Number(NF48F.bg) > 0 ? .12 : 0;
  const room = S * (1 - pad * 2) - (NF48F.tag ? 60 : 0), r = Math.min(room / bw, room / bh), dw = bw * r, dh = bh * r, dx = (S - dw) / 2, dy = (S - dh) / 2 - (NF48F.tag ? 30 : 0);
  if(Number(NF48F.bg) > 0){ c.fillStyle = 'rgba(11,15,20,.08)'; c.beginPath(); c.ellipse(S / 2, dy + dh + 10, dw * .42, 22, 0, 0, Math.PI * 2); c.fill(); }
  c.drawImage(src, box.x0, box.y0, bw, bh, dx, dy, dw, dh);
  const font = (wt, px) => `${wt} ${px}px "Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif`;
  if(NF48F.tag && Number(NF48F.price) > 0){ const p = nf22P(NF48F.price), u = '/' + (NF48F.unit || 'pc'); c.font = font(800, 72); const pw = c.measureText(p).width; c.font = font(700, 36); const uw = c.measureText(u).width; const tw = pw + uw + 70, th = 112, tx = 48, ty = S - th - 48;
    c.fillStyle = '#FDE047'; nf22Rr(c, tx, ty, tw, th, 28); c.fill(); c.fillStyle = '#0B0F14'; c.font = font(800, 72); c.fillText(p, tx + 30, ty + 80); c.font = font(700, 36); c.fillText(u, tx + 38 + pw, ty + 80); }
  if(NF48F.name){ c.font = font(700, 30); c.fillStyle = '#344054'; c.textAlign = 'right'; c.fillText(nf22Shop().name.slice(0, 32), S - 44, S - 52); c.textAlign = 'left'; }
}
function nf48PhotoData(px){ const cv = document.getElementById('nf48FCv'); if(!cv) return ''; if(!px || px >= cv.width) return cv.toDataURL('image/jpeg', .86); const t = document.createElement('canvas'); t.width = px; t.height = px; t.getContext('2d').drawImage(cv, 0, 0, px, px); return t.toDataURL('image/jpeg', .8); }
function nf48PhotoUse(){
  NF48F.before = false; nf48PhotoRender();
  const full = nf48PhotoData(), small = nf48PhotoData(720), key = NF48F.item || '__own';
  NF22S.photo = NF22S.photo || {}; NF22S.photo[key] = full;
  const m = nf48Photos(); m[key] = small; const keys = Object.keys(m); while(keys.length > 30){ delete m[keys.shift()]; }
  const saved = nf48Set('item-photos', m);
  slClose('nf48Photo');
  showToast(saved ? 'Your photo is in the post now, and saved for next time.' : 'Your photo is in the post now. (This phone is full, so it won\'t be kept.)', 'success');
  if(NF48F.after) try{ NF48F.after(full); }catch(e){}
}
async function nf48PhotoSave(){ const cv = document.getElementById('nf48FCv'); if(!cv) return; NF48F.before = false; nf48PhotoRender(); const b = await nf48Blob(cv, 'image/jpeg', .9); if(b) nf48Download(b, (NF48F.item || 'photo').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.jpg'); showToast('Saved to your phone.', 'success'); }

/* ---------- 5. Replies to "how much?": the right price and your store link, for comments and messages ---------- */
const NF48R_DEF = {tl: 'Hi {name}! Ang {item} po ay {price} per {unit}. Pwede po kayong mag-order dito: {link} Salamat po! 😊', tl0: 'Hi {name}! Salamat po sa tanong. Nandito po lahat ng presyo namin at pwede na rin mag-order: {link} 😊',
  en: 'Hi {name}! {item} is {price} per {unit}. You can order here: {link} Thank you! 😊', en0: 'Hi {name}! Thanks for asking. All our prices are here and you can order right away: {link} 😊'};
function nf48ReplyCfg(){ const s = nf48Store(); return Object.assign({lang: 'tl', on: false, withItem: NF48R_DEF.tl, noItem: NF48R_DEF.tl0}, nf48Get('replies', {}), s.replies || {}); }
const NF48_ASK = /(how\s*much|hm+\b|hmp|magkano|mag\s*kano|presyo|price|pm\b|pm\s*po|pa?\s*pm|hm\s*po|ilan po|available|avail|meron po ba|mayroon po ba|order|bili|bibili)/i;
function nf48IsAsk(t){ return NF48_ASK.test(String(t || '')); }
function nf48Reply(comment, name, cfg){
  cfg = cfg || nf48ReplyCfg(); const s = nf22Shop(), said = ' ' + (typeof cpoNorm === 'function' ? cpoNorm(comment) : String(comment).toLowerCase()) + ' ';
  let best = null, bs = 0; nf48Items().forEach(it => { const toks = (typeof cpoNorm === 'function' ? cpoNorm(it.name) : it.name.toLowerCase()).split(' ').filter(t => t.length > 1); let sc = 0; toks.forEach(t => { if(said.includes(' ' + t + ' ')) sc += /\d/.test(t) ? 2 : 3; }); if(sc > bs){ bs = sc; best = it; } });
  const first = String(name || '').trim().split(/\s+/)[0] || (cfg.lang === 'en' ? 'there' : 'po');
  const tpl = best ? cfg.withItem : cfg.noItem;
  return {item: best, ask: nf48IsAsk(comment), text: tpl.replace(/\{name\}/g, first).replace(/\{item\}/g, best ? best.name : '').replace(/\{price\}/g, best ? nf22P(best.price) : '').replace(/\{unit\}/g, best ? (best.unit || 'pc') : '').replace(/\{link\}/g, s.url('reply')).replace(/\{shop\}/g, s.name)};
}
function nf48Replies(){
  const cfg = nf48ReplyCfg(), page = nf48FbPage(), owner = typeof requirePermission !== 'function' || (typeof nf20IsOwner === 'function' ? nf20IsOwner() : true);
  nf45Pop('nf48Rep', 'Answer "how much?" in one tap', `
    <div class="nf48-rtest"><label class="nf48-lbl" for="nf48RIn">Paste a comment or message from a customer</label><textarea id="nf48RIn" rows="2" placeholder="e.g. Magkano po semento? Pm po" oninput="nf48ReplyTest()"></textarea>
      <label class="nf48-lbl" for="nf48RName">Their name (optional)</label><input id="nf48RName" placeholder="e.g. Aling Nena" oninput="nf48ReplyTest()">
      <div class="nf48-rout" id="nf48ROut"><span class="nf45-sm">Your reply shows here, with the right price and your store link.</span></div>
      <div class="nf48-rbtns"><button type="button" class="btn btn-primary" onclick="nf48ReplyCopy()">${nf48Svg('copy', 18)}Copy reply</button></div></div>
    <details class="nf48-rtpl"><summary>Change the reply words</summary>
      <div class="nf48-lang"><button type="button" class="${cfg.lang !== 'en' ? 'on' : ''}" onclick="nf48ReplyLang('tl')">Taglish</button><button type="button" class="${cfg.lang === 'en' ? 'on' : ''}" onclick="nf48ReplyLang('en')">English</button></div>
      <label class="nf48-lbl">When they name an item</label><textarea id="nf48RT1" rows="3" ${owner ? '' : 'readonly'}>${nf48E(cfg.withItem)}</textarea>
      <label class="nf48-lbl">When they don't</label><textarea id="nf48RT0" rows="3" ${owner ? '' : 'readonly'}>${nf48E(cfg.noItem)}</textarea>
      <p class="nf45-sm">{name}, {item}, {price}, {unit} and {link} are filled in for you.</p>${owner ? `<button type="button" class="btn btn-outline btn-sm" onclick="nf48ReplySave()">Save the words</button>` : ''}</details>
    <details class="nf48-rmsg"><summary>Answer Messenger by itself, starting today</summary>
      <p class="nf45-p">Facebook can send this reply for you whenever someone messages your Page. It's free and needs no approval.</p>
      <ol class="nf48-steps"><li><b>Copy the reply</b><span><button type="button" class="nf43-link" onclick="nf48Copy(nf48Reply('', '').text.replace(/Hi po!/, 'Hi!')); showToast('Copied.', 'success')">Copy the general reply</button></span></li>
        <li><b>Open Meta Business Suite, then Inbox, then Automations</b><span>On your phone: the Meta Business Suite app, Inbox, the ⚡ icon.</span></li>
        <li><b>Turn on "Instant reply" and paste</b><span>Add "Frequently asked questions" too: "Magkano po?" with the same reply.</span></li></ol></details>
    ${NIFTI_FB.appId ? `<div class="nf48-rauto"><b>Reply to comments on your Page by itself</b><small>${page ? 'Nifti answers "how much?" comments on ' + nf48E(page.name) + ' with the item price and your link.' : 'Connect your Page first, then Nifti answers "how much?" comments by itself.'}</small>
      ${page ? `<label class="nf48-chk"><input type="checkbox" ${cfg.on ? 'checked' : ''} onchange="nf48ReplyAuto(this.checked)" ${owner ? '' : 'disabled'}> Answer comments by itself</label>` : `<button type="button" class="btn btn-outline btn-sm" onclick="nf48FbConnect()">Connect my Facebook Page</button>`}</div>` : ''}`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf48Rep')">Close</button>`, {wide: true});
}
function nf48ReplyTest(){ const v = (document.getElementById('nf48RIn') || {}).value || '', n = (document.getElementById('nf48RName') || {}).value || '', out = document.getElementById('nf48ROut'); if(!out) return; if(!v.trim()){ out.innerHTML = '<span class="nf45-sm">Your reply shows here, with the right price and your store link.</span>'; return; }
  const r = nf48Reply(v, n); out.innerHTML = `<p>${nf48E(r.text)}</p><small>${r.item ? 'Matched: ' + nf48E(r.item.name) + ' · ' + nf48P(r.item.price) : 'No item named, so it sends your store link.'}${r.ask ? '' : ' · This doesn\'t look like a price question.'}</small>`; out.dataset.t = r.text; }
async function nf48ReplyCopy(){ const out = document.getElementById('nf48ROut'), t = out && out.dataset.t ? out.dataset.t : nf48Reply('', (document.getElementById('nf48RName') || {}).value || '').text; await nf48Copy(t); showToast('Reply copied. Paste it under their comment or in Messenger.', 'success'); }
function nf48ReplyLang(l){ const t1 = document.getElementById('nf48RT1'), t0 = document.getElementById('nf48RT0'); if(t1) t1.value = NF48R_DEF[l]; if(t0) t0.value = NF48R_DEF[l + '0']; document.querySelectorAll('#nf48Rep .nf48-rtpl .nf48-lang button').forEach((b, i) => b.classList.toggle('on', (i === 1) === (l === 'en'))); NF48R_LANG = l; nf48ReplyTest(); }
let NF48R_LANG = null;
async function nf48SaveStoreKey(key, val){
  const st = Object.assign({}, nf48Store(), {[key]: val});
  if(typeof myBusiness !== 'undefined' && myBusiness){ try{ const { data, error } = await sb.rpc('set_store', {p_store: st, p_slug: myBusiness.store_slug || slugify(myBusiness.name)}); if(error) throw error; myBusiness.store = data || st; if(data && !(key in data)) myBusiness.store[key] = val; return true; }catch(e){ console.warn('nf48 store save', e); return false; } }
  window._demoStore = st; return true;
}
async function nf48ReplySave(){ const cfg = Object.assign(nf48ReplyCfg(), {withItem: document.getElementById('nf48RT1').value.trim() || NF48R_DEF.tl, noItem: document.getElementById('nf48RT0').value.trim() || NF48R_DEF.tl0, lang: NF48R_LANG || nf48ReplyCfg().lang}); nf48Set('replies', cfg); const ok = await nf48SaveStoreKey('replies', cfg); showToast(ok ? 'Saved. Every reply uses these words now.' : 'Saved on this device.', ok ? 'success' : 'warn'); nf48ReplyTest(); }
async function nf48ReplyAuto(on){ const cfg = Object.assign(nf48ReplyCfg(), {on}); nf48Set('replies', cfg); const ok = await nf48SaveStoreKey('replies', cfg); showToast(on ? (ok ? 'Nifti now answers "how much?" comments on your Page.' : "Couldn't turn it on. Try again.") : 'Auto-replies are off.', ok ? 'success' : 'error'); }
function nf48FbConnect(){ if(!NIFTI_FB.appId) return; const st = Math.random().toString(36).slice(2); try{ sessionStorage.setItem('nifti-fb-state', st); }catch(e){}
  const redirect = location.origin + location.pathname; window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(NIFTI_FB.appId)}&redirect_uri=${encodeURIComponent(redirect)}&state=fb_${st}&scope=pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_engagement`; }
// back from Facebook with ?code=…&state=fb_…: the server swaps it for a Page token (kept on the server only)
(async function(){ try{ const u = new URL(location.href), code = u.searchParams.get('code'), state = u.searchParams.get('state') || ''; if(!code || !/^fb_/.test(state)) return;
  history.replaceState(null, '', location.pathname + location.hash); let ok = false; try{ ok = sessionStorage.getItem('nifti-fb-state') === state.slice(3); }catch(e){}
  if(!ok) return; const wait = () => new Promise(r => setTimeout(r, 1500)); for(let i = 0; i < 8 && !(typeof myBusiness !== 'undefined' && myBusiness); i++) await wait();
  const { data, error } = await sb.functions.invoke('fb-page', {body: {action: 'connect', code, redirect: location.origin + location.pathname}});
  if(error || !data || data.error){ showToast("Couldn't connect your Page: " + ((data && data.error) || (error && error.message) || 'try again'), 'error'); return; }
  myBusiness.store = Object.assign({}, myBusiness.store || {}, {fb_page: data.page}); showToast('Connected to ' + data.page.name + '. "Post to Facebook" now posts straight to your Page.', 'success');
}catch(e){} })();

/* ---------- 6. Poster: someone in the family posts for the shop, without seeing the money ---------- */
try{ if(!('Poster' in ROLE_PERMISSIONS)) ROLE_PERMISSIONS['Poster'] = ['dashboard', 'store', 'messages']; }catch(e){}
function nf48PosterView(){
  const on = nf48IsPoster(); document.body.classList.toggle('nf48-poster', on);
  ['nf23NbNav', 'nf45OldNav'].forEach(id => { const el = document.getElementById(id); if(!el) return; if(on){ if(!el.hidden){ el.hidden = true; el.dataset.nf48p = '1'; } } else if(el.dataset.nf48p){ el.hidden = false; delete el.dataset.nf48p; } });
}
function nf48IsPoster(){ try{ const r = getEffectiveRoles(); return r.includes('Poster') && !r.some(x => getRoleAllowedPages(x) === null); }catch(e){ return false; } }

/* ---------- 7. Checkout: how buyers pay and what delivery costs, set once by the owner ---------- */
function nf48Checkout(){ const s = nf48Store(); return Object.assign({methods: {cod: s.cod !== false}, gcash: {}, maya: {}, bank: {}, fees: [], free_over: null, other: 'ask', other_fee: null}, s.checkout || {}); }
function nf48CheckoutOpen(){
  const c = nf48Checkout(), acc = typeof getMyPaymentAccounts === 'function' ? getMyPaymentAccounts() : [];
  const fromAcc = t => acc.find(a => a.type === t) || {};
  ['gcash', 'maya'].forEach(t => { if(!c[t].number && fromAcc(t).accountNumber){ c[t] = {number: fromAcc(t).accountNumber, name: fromAcc(t).accountName || ''}; } });
  if(!c.bank.number && fromAcc('bank').accountNumber) c.bank = {bank: fromAcc('bank').bankName || '', number: fromAcc('bank').accountNumber, name: fromAcc('bank').accountName || ''};
  NF48C.fees = (c.fees || []).slice(); if(!NF48C.fees.length) NF48C.fees = nf22Shop().areas.split(',').map(a => ({area: a.trim(), fee: ''})).filter(x => x.area).slice(0, 4);
  NF48C.qr = c.gcash.qr || '';
  const m = c.methods || {};
  nf45Pop('nf48Chk', 'How buyers pay and what delivery costs', `
    <p class="nf45-p">Buyers see this when they order from your store link. They pick their barangay, see the delivery fee, and choose how to pay.</p>
    <h4 class="nf48-h">How buyers can pay</h4>
    <div class="nf48-pays">
      <label class="nf48-pay"><input type="checkbox" id="nf48CCod" ${m.cod !== false ? 'checked' : ''}><span><b>Cash on delivery (COD)</b><small>Your driver collects. It shows on the Deliveries list.</small></span></label>
      <label class="nf48-pay"><input type="checkbox" id="nf48CG" ${m.gcash ? 'checked' : ''}><span><b>GCash</b><small>Buyers see your number and name after ordering.</small></span></label>
      <div class="nf48-payd"><input id="nf48CGNum" inputmode="tel" placeholder="GCash number, e.g. 0917 123 4567" value="${nf48E(c.gcash.number || '')}"><input id="nf48CGName" placeholder="Name on GCash" value="${nf48E(c.gcash.name || '')}">
        <label class="nf48-qr"><input type="file" accept="image/*" data-nf-cam="1" hidden onchange="nf48CheckoutQr(this)"><span id="nf48CQr">${c.gcash.qr ? `<img src="${c.gcash.qr}" alt="GCash QR">` : ''}${c.gcash.qr ? 'Change QR' : '+ Add your GCash QR (optional)'}</span></label></div>
      <label class="nf48-pay"><input type="checkbox" id="nf48CM" ${m.maya ? 'checked' : ''}><span><b>Maya</b></span></label>
      <div class="nf48-payd"><input id="nf48CMNum" inputmode="tel" placeholder="Maya number" value="${nf48E(c.maya.number || '')}"><input id="nf48CMName" placeholder="Name on Maya" value="${nf48E(c.maya.name || '')}"></div>
      <label class="nf48-pay"><input type="checkbox" id="nf48CB" ${m.bank ? 'checked' : ''}><span><b>Bank transfer</b></span></label>
      <div class="nf48-payd"><input id="nf48CBBank" placeholder="Bank, e.g. BDO" value="${nf48E(c.bank.bank || '')}"><input id="nf48CBNum" inputmode="numeric" placeholder="Account number" value="${nf48E(c.bank.number || '')}"><input id="nf48CBName" placeholder="Account name" value="${nf48E(c.bank.name || '')}"></div>
    </div>
    <h4 class="nf48-h">Delivery fee by barangay or city</h4>
    <div class="nf48-fees" id="nf48CFees"></div>
    <button type="button" class="nf43-link" onclick="NF48C.fees.push({area: '', fee: ''}); nf48CheckoutFees()">+ Add an area</button>
    <div class="nf48-frow"><label>Free delivery for orders of (₱)<input id="nf48CFree" type="number" inputmode="numeric" placeholder="e.g. 5000" value="${nf48E(c.free_over || '')}"></label>
      <label>Other areas<select id="nf48COther" onchange="document.getElementById('nf48COtherFee').hidden = this.value !== 'fee'"><option value="ask" ${c.other !== 'fee' && c.other !== 'no' ? 'selected' : ''}>We'll tell them the fee</option><option value="fee" ${c.other === 'fee' ? 'selected' : ''}>Same fee for everywhere else</option><option value="no" ${c.other === 'no' ? 'selected' : ''}>We don't deliver there</option></select></label>
      <label id="nf48COtherFee" ${c.other === 'fee' ? '' : 'hidden'}>Fee (₱)<input id="nf48COtherAmt" type="number" inputmode="numeric" value="${nf48E(c.other_fee || '')}"></label></div>
    <p class="nf45-sm">The fee is added to the order and to the bill. A buyer's GCash or Maya reference number shows on the order so you can check it in your app.</p>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf48Chk')">Cancel</button><button type="button" class="btn btn-primary" onclick="nf48CheckoutSave()">Save</button>`, {wide: true});
  nf48CheckoutFees();
}
const NF48C = {fees: [], qr: ''};
function nf48CheckoutFees(){ const b = document.getElementById('nf48CFees'); if(!b) return; b.innerHTML = NF48C.fees.map((f, i) => `<div class="nf48-fee"><input placeholder="Barangay or city" value="${nf48E(f.area)}" oninput="NF48C.fees[${i}].area=this.value"><span>₱</span><input type="number" inputmode="numeric" placeholder="Fee" value="${nf48E(f.fee)}" oninput="NF48C.fees[${i}].fee=this.value"><button type="button" aria-label="Remove" onclick="NF48C.fees.splice(${i}, 1); nf48CheckoutFees()">✕</button></div>`).join('') || '<p class="nf45-sm">No areas yet.</p>'; }
function nf48CheckoutQr(input){ const f = input.files && input.files[0]; if(!f) return; const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 420 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); NF48C.qr = cv.toDataURL('image/png'); if(NF48C.qr.length > 140000) NF48C.qr = cv.toDataURL('image/jpeg', .8); const sp = document.getElementById('nf48CQr'); if(sp) sp.innerHTML = `<img src="${NF48C.qr}" alt="GCash QR">Change QR`; }; im.src = r.result; }; r.readAsDataURL(f); }
async function nf48CheckoutSave(){
  if(typeof requirePermission === 'function' && !requirePermission('manageAccount')) return;
  const v = id => ((document.getElementById(id) || {}).value || '').trim(), on = id => !!(document.getElementById(id) || {}).checked;
  const c = {methods: {cod: on('nf48CCod'), gcash: on('nf48CG'), maya: on('nf48CM'), bank: on('nf48CB')}, gcash: {number: v('nf48CGNum'), name: v('nf48CGName'), qr: NF48C.qr || ''}, maya: {number: v('nf48CMNum'), name: v('nf48CMName')}, bank: {bank: v('nf48CBBank'), number: v('nf48CBNum'), name: v('nf48CBName')},
    fees: NF48C.fees.map(f => ({area: String(f.area || '').trim().slice(0, 60), fee: Number(f.fee) || 0})).filter(f => f.area), free_over: Number(v('nf48CFree')) || null, other: v('nf48COther') || 'ask', other_fee: Number(v('nf48COtherAmt')) || null};
  if(c.methods.gcash && c.gcash.number.replace(/\D/g, '').length < 10){ showToast('Type your GCash number, or untick GCash.', 'warn'); return; }
  if(c.methods.maya && c.maya.number.replace(/\D/g, '').length < 10){ showToast('Type your Maya number, or untick Maya.', 'warn'); return; }
  if(c.methods.bank && !c.bank.number){ showToast('Type the bank account number, or untick Bank transfer.', 'warn'); return; }
  const st = nf48Store(); st.cod = c.methods.cod;
  const ok = await nf48SaveStoreKey('checkout', c); if(ok){ const s2 = nf48Store(); s2.cod = c.methods.cod; }
  slClose('nf48Chk'); showToast(ok ? 'Saved. Buyers see the fees and how to pay when they order.' : "Couldn't save it. Check your connection and try again.", ok ? 'success' : 'error');
  try{ if(document.querySelector('#storeContent .nf22s')) nf22Paint(); }catch(e){}
}
// an order from the store says how they'll pay and what delivery costs; show it where the owner works
function nf48OrderInfo(po){
  const n = String((po && (po.notes || po.note)) || ''); const pay = n.match(/\[Pay: ([^\]]+)\]/), del = n.match(/\[Delivery: ([^\]]+?)(?: ₱([\d,.]+))?\]/), fee = del && del[2] ? Number(del[2].replace(/,/g, '')) : null;
  return pay || del ? {pay: pay ? pay[1] : '', area: del ? del[1] : '', fee, note: n.replace(/\[(Pay|Delivery): [^\]]+\]\s*/g, '').trim()} : null;
}

/* ---------- order popup and bill: what the buyer chose at checkout ---------- */
(function(){
  if(typeof openOrderDetailModal !== 'function') return;
  const open = openOrderDetailModal;
  openOrderDetailModal = function(id, sup){ const r = open.apply(this, arguments); try{ nf48OrderBox(id); }catch(e){} return r; };
  window.openOrderDetailModal = openOrderDetailModal;
  if(typeof refreshOrderModalIfOpen === 'function'){ const rf = refreshOrderModalIfOpen; refreshOrderModalIfOpen = function(id){ const r = rf.apply(this, arguments); try{ nf48OrderBox(id); }catch(e){} return r; }; window.refreshOrderModalIfOpen = refreshOrderModalIfOpen; }
  if(typeof issueInvoice === 'function'){ const iss = issueInvoice; issueInvoice = function(id){ try{ nf48AddFee(getPO(id), true); }catch(e){} return iss.apply(this, arguments); }; window.issueInvoice = issueInvoice; }
})();
function nf48AddFee(po, quiet){
  const info = nf48OrderInfo(po); if(!po || !info || !(info.fee > 0)) return false;
  po.lineItems = po.lineItems || []; if(po.lineItems.some(l => /^Delivery fee/i.test(l.product || ''))) return false;
  po.lineItems.push({product: 'Delivery fee', qty: 1, unitPrice: info.fee, unit: 'trip', note: info.area});
  try{ poLogHistory(po, 'supplier', `Delivery fee ${nf48P(info.fee)} added (${info.area}, from your store checkout)`); }catch(e){}
  if(!quiet) showToast(`Delivery fee ${nf48P(info.fee)} added to the order.`, 'success'); return true;
}
function nf48OrderBox(id){
  const po = getPO(id), body = document.getElementById('orderDetailModalBody'); if(!po || !body) return;
  const info = nf48OrderInfo(po); const old = body.querySelector('.nf48-obox'); if(!info){ if(old) old.remove(); return; }
  const has = (po.lineItems || []).some(l => /^Delivery fee/i.test(l.product || ''));
  const ref = (info.pay.match(/ref(?:erence)?\s*([A-Za-z0-9][A-Za-z0-9 -]*[A-Za-z0-9])/i) || [])[1] || '';
  const paidOnline = /gcash|maya|bank/i.test(info.pay), recorded = (po.depositPayments || []).some(p => ref && String(p.reference || '').includes(ref));
  const html = `<div class="nf48-obox"><b>From your online store</b>
    <div class="r"><span>How they'll pay</span><em>${nf48E(info.pay || 'Not chosen')}</em></div>
    ${info.area ? `<div class="r"><span>Deliver to</span><em>${nf48E(info.area)}${info.fee != null ? ' · fee ' + nf48P(info.fee) : ''}</em></div>` : ''}
    ${info.note ? `<div class="r"><span>Their note</span><em>${nf48E(info.note)}</em></div>` : ''}
    <div class="a">${info.fee > 0 && !has ? `<button type="button" class="btn btn-outline btn-sm" onclick="nf48AddFee(getPO('${po.id}')); refreshOrderModalIfOpen('${po.id}')">Add the ${nf48P(info.fee)} delivery fee</button>` : info.fee > 0 ? '<span class="ok">Delivery fee is on the order</span>' : ''}
      ${paidOnline && !recorded ? `<button type="button" class="btn btn-primary btn-sm" onclick="nf48PaidOnline('${po.id}')">They paid: record it</button>` : recorded ? '<span class="ok">Payment recorded</span>' : ''}</div></div>`;
  if(old){ if(old.dataset.k !== html){ old.dataset.k = html; old.outerHTML = html; } } else { const w = document.createElement('div'); w.innerHTML = html; const box = w.firstElementChild; box.dataset.k = html;
    const head = body.querySelector('.nf13-fh, .nf13-head, .fo-head, .ofm-head, [class*="-head"]'); const anchor = head && head.closest('#orderDetailModalBody > *') || body.firstElementChild;
    if(anchor && anchor.nextSibling) anchor.parentElement.insertBefore(box, anchor.nextSibling); else body.appendChild(box); }
}
function nf48PaidOnline(id){
  const po = getPO(id), info = nf48OrderInfo(po) || {}; const ref = (String(info.pay || '').match(/ref(?:erence)?\s*([A-Za-z0-9][A-Za-z0-9 -]*[A-Za-z0-9])/i) || [])[1] || '';
  const method = /gcash/i.test(info.pay) ? 'GCash' : /maya/i.test(info.pay) ? 'Maya' : 'Bank transfer';
  const total = (typeof poTotal === 'function' ? poTotal(po) : 0);
  nf45Pop('nf48Paid', 'Record their payment', `<p class="nf45-p">Check your ${method} app first. Record it only when you see the money.</p>
    <div class="nf48-frow"><label>Amount (₱)<input id="nf48PAmt" type="number" inputmode="decimal" value="${Math.round(total * 100) / 100}"></label><label>Reference number<input id="nf48PRef" value="${nf48E(ref)}"></label></div>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf48Paid')">Cancel</button><button type="button" class="btn btn-primary" onclick="nf48PaidSave('${id}', '${method}')">I see it, record it</button>`);
}
function nf48PaidSave(id, method){
  const po = getPO(id), amt = Number((document.getElementById('nf48PAmt') || {}).value) || 0, ref = ((document.getElementById('nf48PRef') || {}).value || '').trim();
  if(!(amt > 0)){ showToast('Type the amount you received.', 'warn'); return; }
  if(typeof snapshotPO === 'function') snapshotPO(po);
  const p = {id: typeof newRecordId === 'function' ? newRecordId() : 'p' + Date.now(), amount: amt, method, reference: ref || method, date: APP_TODAY, confirmStatus: 'confirmed', recordedBy: 'supplier'};
  if(po.invoice){ po.invoice.payments = po.invoice.payments || []; po.invoice.payments.push(p); try{ settleInvoiceStatus(po); }catch(e){} } else { po.depositPayments = po.depositPayments || []; po.depositPayments.push(p); }
  try{ poLogHistory(po, 'supplier', `${method} payment ${nf48P(amt)} recorded${ref ? ' (ref ' + ref + ')' : ''}`); }catch(e){}
  try{ if(typeof scheduleNiftiSave === 'function') scheduleNiftiSave(); }catch(e){}
  slClose('nf48Paid'); showToast(`${nf48P(amt)} recorded. It counts toward their bill.`, 'success'); try{ refreshOrderModalIfOpen(id); }catch(e){} try{ renderSupplierOrdersTable(); }catch(e){}
}

/* ---------- the store page: the selling tools in one row, right under your link ---------- */
(function(){
  if(typeof nf22Top !== 'function') return;
  const top = nf22Top;
  nf22Top = function(){
    const el = top.apply(this, arguments);
    try{ const owner = typeof nf20IsOwner !== 'function' || nf20IsOwner(), c = nf48Checkout(), sent = nf48ListSentThisWeek();
      const tools = document.createElement('div'); tools.className = 'nf48-tools';
      tools.innerHTML = `<button type="button" class="nf48-tool main" onclick="nf48Voice()"><span class="ic">${nf48Svg('mic', 22)}</span><span><b>Say it, Nifti posts it</b><small>Talk, and the picture and words are ready</small></span></button>
        <button type="button" class="nf48-tool" onclick="nf48PriceList()"><span class="ic">${nf48Svg('list', 22)}</span><span><b>This week's price list</b><small>${sent ? 'Sent this week ✓' : 'One picture for your Viber group'}</small></span></button>
        <button type="button" class="nf48-tool" onclick="nf48Photo('', () => { try{ nf22Paint(); }catch(e){} })"><span class="ic">${nf48Svg('wand', 22)}</span><span><b>Clean up a photo</b><small>Brighter, plain background, price tag</small></span></button>
        <button type="button" class="nf48-tool" onclick="nf48Replies()"><span class="ic">${nf48Svg('chat', 22)}</span><span><b>Answer "how much?"</b><small>Price and link in one tap</small></span></button>
        ${owner ? `<button type="button" class="nf48-tool" onclick="nf48CheckoutOpen()"><span class="ic">₱</span><span><b>Payments and delivery fees</b><small>${(c.fees || []).length ? (c.fees.length + ' area' + (c.fees.length === 1 ? '' : 's') + ' · ' + ['cod', 'gcash', 'maya', 'bank'].filter(k => (c.methods || {})[k]).map(k => ({cod: 'COD', gcash: 'GCash', maya: 'Maya', bank: 'Bank'})[k]).join(', ')) : 'GCash, Maya, COD, fee by barangay'}</small></span></button>` : ''}`;
      const wrap = document.createElement('div'); wrap.className = 'nf48-topwrap'; wrap.appendChild(el); wrap.appendChild(tools);
      // nf22Paint replaces ".nf22s-top": keep that class on the wrapper so the swap still works
      el.classList.remove('nf22s-top'); wrap.classList.add('nf22s-top', 'nf48-topwrap'); return wrap;
    }catch(e){ console.warn('nf48 tools', e); return el; }
  };
  window.nf22Top = nf22Top;
  if(typeof nf22Go === 'function'){ const g = nf22Go; nf22Go = function(k){ if(['nextidea', 'mtype', 'calpost'].includes(k)) NF22S.extra = ''; return g.apply(this, arguments); }; window.nf22Go = nf22Go; }
})();

/* ---------- wiring ---------- */
nf48LoadPhotos();
NF45_AFTER.push(page => {
  nf48PosterView();
  if(page && page.id === 'page-dashboard') nf48HomeCard();
  if(page && page.id === 'page-store'){ nf48LoadPhotos(); }
});

/* ---------- 8. Pages open beside you, not instead ----------
   A button inside a page that leads to another page now opens that page as a panel over the one you were on.
   The page underneath stays exactly as it was (same scroll, same open sections). "Back" or a tap outside closes
   the panel; "Open full page" keeps going there. Menu taps still switch pages normally. */
const NF48K = {under: null, y: 0, stack: [], backing: false};
function nf48PeekOn(){ return !!NF48K.under; }
function nf48Left(){ const sb = document.querySelector('#view-app .sidebar'); return sb && sb.offsetParent !== null && window.innerWidth > 900 ? Math.round(sb.getBoundingClientRect().right) : 0; }
function nf48PeekClear(){
  document.querySelectorAll('.app-page.nf48-under, .app-page.nf48-peek').forEach(p => p.classList.remove('nf48-under', 'nf48-peek'));
  document.body.classList.remove('nf48-peeking'); const d = document.getElementById('nf48Dim'); if(d) d.hidden = true;
  document.querySelectorAll('.nf48-pbar').forEach(b => b.remove());
  NF48K.under = null; NF48K.stack = [];
}
(function(){
  const nav = navigate;
  navigate = function(page){
    let peek = false, closing = false, prevPeek = null;
    try{
      const actEl = document.querySelector('#view-app .app-page.active'), from = actEl ? actEl.id.replace('page-', '') : null;
      const isApp = typeof appPages !== 'undefined' && appPages.includes(page);
      closing = !!NF48K.under && page === NF48K.under;
      const content = Date.now() - NF47J.t < 2500 && NF47J.src === 'content';
      peek = !closing && isApp && from && page !== from && (content || NF48K.backing) && !NF48K.off && document.getElementById('page-' + page);
      if(peek){ if(!NF48K.under){ NF48K.under = from; NF48K.y = window.scrollY; } else if(!NF48K.backing && from !== NF48K.under) NF48K.stack.push(from); prevPeek = actEl; }
      else { const y = NF48K.y, wasUnder = NF48K.under; nf48PeekClear(); if(closing && wasUnder){ NF47J.back = true; setTimeout(() => window.scrollTo(0, y), 0); [80, 300].forEach(ms => setTimeout(() => window.scrollTo(0, y), ms)); } }
    }catch(e){ console.warn('nf48 peek', e); }
    const r = nav.apply(this, arguments);
    if(peek){ try{ nf48PeekShow(page, prevPeek); }catch(e){ console.warn('nf48 peek show', e); nf48PeekClear(); } }
    NF48K.backing = false;
    return r;
  };
  Object.keys(nav).forEach(k => { navigate[k] = nav[k]; }); window.navigate = navigate;
})();
function nf48PeekShow(page, prevEl){
  const el = document.getElementById('page-' + page), base = document.getElementById('page-' + NF48K.under); if(!el || !base) return nf48PeekClear();
  document.querySelectorAll('.app-page.nf48-peek').forEach(p => { if(p !== el) p.classList.remove('nf48-peek'); });
  base.classList.add('nf48-under'); el.classList.add('nf48-peek'); document.body.classList.add('nf48-peeking');
  document.body.style.setProperty('--nf48-l', nf48Left() + 'px');
  let dim = document.getElementById('nf48Dim'); if(!dim){ dim = document.createElement('div'); dim.id = 'nf48Dim'; dim.className = 'nf48-dim'; dim.addEventListener('click', nf48PeekClose); document.body.appendChild(dim); }
  dim.hidden = false; dim.style.left = nf48Left() + 'px';
  window.scrollTo(0, NF48K.y); el.scrollTop = 0;
  nf48PeekBar(el);
}
function nf48PeekBar(el){
  el = el || document.querySelector('.app-page.nf48-peek'); if(!el) return;
  const prev = NF48K.stack.length ? NF48K.stack[NF48K.stack.length - 1] : NF48K.under;
  const label = 'Back to ' + nf47PageName(prev), title = nf47PageName(el.id.replace('page-', ''));
  let bar = el.querySelector(':scope > .nf48-pbar');
  const html = `<button type="button" class="nf48-pback" onclick="nf48PeekBack()">${nf48Svg('back', 18)}<span>${nf48E(label)}</span></button><b>${nf48E(title)}</b><button type="button" class="nf48-pfull" onclick="nf48PeekFull()">${nf48Svg('full', 16)}<span>Open full page</span></button><button type="button" class="nf48-px" aria-label="Close" onclick="nf48PeekClose()">${nf48Svg('x', 18)}</button>`;
  if(!bar){ bar = document.createElement('div'); bar.className = 'nf48-pbar'; el.insertBefore(bar, el.firstChild); }
  else if(bar !== el.firstElementChild) el.insertBefore(bar, el.firstChild);
  if(bar.dataset.k !== html){ bar.dataset.k = html; bar.innerHTML = html; }
}
function nf48PeekBack(){ if(NF48K.stack.length){ const prev = NF48K.stack.pop(); NF48K.backing = true; NF47J.src = 'other'; navigate(prev); return; } nf48PeekClose(); }
function nf48PeekClose(){ if(!NF48K.under) return; NF47J.src = 'other'; navigate(NF48K.under); }
function nf48PeekFull(){ const el = document.querySelector('.app-page.nf48-peek'); nf48PeekClear(); NF47J.to = null; window.scrollTo(0, 0); if(el){ const id = el.id.replace('page-', ''); try{ nf26AfterPass(el); }catch(e){} } }
document.addEventListener('keydown', e => { if(e.key === 'Escape' && NF48K.under && !document.querySelector('.sl-overlay:not([hidden]), .sl-modal.open, #nf22Nb:not([hidden])')) nf48PeekClose(); });
window.addEventListener('resize', () => { if(!NF48K.under) return; document.body.style.setProperty('--nf48-l', nf48Left() + 'px'); const d = document.getElementById('nf48Dim'); if(d) d.style.left = nf48Left() + 'px'; });
NF45_AFTER.push(page => { if(page && page.classList.contains('nf48-peek')){ nf48PeekBar(page); const jb = page.querySelector(':scope > .nf47-jbar'); if(jb) jb.remove(); } });

/* ---------- copy that never fails silently: falls back when the browser blocks the clipboard ---------- */
(function(){ if(typeof copyText !== 'function') return; copyText = function(t){ try{ if(String(t).includes('/s/') && typeof markStoreShared === 'function') markStoreShared(); }catch(e){}
  nf48Copy(String(t)).then(ok => { if(ok) showToast('Copied.', 'success'); else { try{ prompt('Copy this:', t); }catch(e){} } }); }; window.copyText = copyText; })();
