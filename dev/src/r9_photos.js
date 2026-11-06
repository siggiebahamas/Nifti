/* ===== Round 9: photos are proof, saved in the database =====
   Order photos (shipped, delivered, received, payment, damage) go to the private "order-photos"
   store and the order_photos table. Both sides of the order, and their teams, can see them on any
   device; nobody can edit or delete them. Profile pictures go to "avatars" + profile_photos.
   The demo keeps its photos on the device. */
const NF_OP_DEMO = 'nifti-order-photos-demo-v1';
const NF_OP_KINDS = [['shipped', 'Shipped'], ['delivered', 'Delivered'], ['received', 'Received'], ['payment', 'Payment'], ['damage', 'Damage'], ['other', 'Other']];
const NFOP = {cache: {}, loading: {}};
function nfLive(){ return typeof myBusiness !== 'undefined' && !!myBusiness; }
function nfOpKindFor(o, sell){
  if(!o) return 'other';
  if(o.invoice && o.invoice.status !== 'paid') return 'payment';
  if(o.status === 'preparing' || o.status === 'confirmed') return 'shipped';
  if(o.status === 'shipped' || o.status === 'in_customs') return sell ? 'delivered' : 'received';
  if(['delivered', 'partially_delivered'].includes(o.status)) return sell ? 'delivered' : 'received';
  return 'other';
}
function nfOpDemoStore(){ try{ return JSON.parse(localStorage.getItem(NF_OP_DEMO) || '{}'); }catch(e){ return {}; } }
function nfShrink(dataUrl, max, q){ return new Promise(res => { const img = new Image(); img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q || 0.82)); }; img.onerror = () => res(dataUrl); img.src = dataUrl; }); }
function nfBlob(dataUrl){ const [h, b] = dataUrl.split(','), bin = atob(b), u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], {type: (h.match(/:(.*?);/) || [])[1] || 'image/jpeg'}); }
function nfUuid(){ return (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'p' + Date.now() + Math.random().toString(36).slice(2); }
async function nfOpList(poId, force){
  if(NFOP.cache[poId] && !force) return NFOP.cache[poId];
  if(!nfLive()){ try{ nfDemoOrderPhotos(); }catch(e){} NFOP.cache[poId] = (nfOpDemoStore()[poId] || []).slice(); return NFOP.cache[poId]; }
  const { data, error } = await sb.from('order_photos').select('*').eq('po_id', poId).order('created_at', {ascending: true});
  if(error){ console.warn(error); return NFOP.cache[poId] = []; }
  const rows = data || []; let urls = [];
  if(rows.length){ const r = await sb.storage.from('order-photos').createSignedUrls(rows.map(x => x.path), 3600); urls = (r.data || []); }
  NFOP.cache[poId] = rows.map((x, i) => ({id: x.id, kind: x.kind, url: (urls[i] && urls[i].signedUrl) || '', by: x.taken_by_name || '', at: x.created_at, caption: x.caption || '', mine: x.business_id === myBusiness.id}));
  return NFOP.cache[poId];
}
async function nfOpAdd(poId, kind, dataUrl, caption){
  const by = (typeof bkMe === 'function' ? bkMe() : '') || 'Someone';
  if(!nfLive()){
    const small = await nfShrink(dataUrl, 900, 0.72), s = nfOpDemoStore(); (s[poId] = s[poId] || []).push({id: nfUuid(), kind, url: small, by, at: new Date().toISOString(), caption: caption || '', mine: true});
    try{ localStorage.setItem(NF_OP_DEMO, JSON.stringify(s)); }catch(e){ showToast('This device is out of space for demo photos. Remove a few and try again.', 'error'); return false; }
    NFOP.cache[poId] = s[poId].slice(); return true;
  }
  const big = await nfShrink(dataUrl, 1600, 0.82), path = `${poId}/${nfUuid()}.jpg`;
  const up = await sb.storage.from('order-photos').upload(path, nfBlob(big), {contentType: 'image/jpeg', upsert: false});
  if(up.error){ showToast("Couldn't save the photo: " + up.error.message, 'error'); return false; }
  const ins = await sb.from('order_photos').insert({po_id: poId, business_id: myBusiness.id, kind, path, caption: caption || null, taken_by_name: by, created_by: (await sb.auth.getUser()).data.user.id});
  if(ins.error){ showToast("Couldn't save the photo: " + ins.error.message, 'error'); return false; }
  await nfOpList(poId, true); return true;
}
// the "Proof photos" card inside the order sheet
function nfOpCardHtml(o, sell){
  const k = nfOpKindFor(o, sell);
  return `<section class="nfo-photos" id="nfoPhotos" data-po="${o.id}"><div class="nfo-sec">Proof photos <small>Both sides can see these. They can't be changed or deleted.</small></div>
    <div class="nf-op-grid" id="nfOpGrid"><div class="nf-op-empty">Loading photos…</div></div>
    <div class="nf-op-kind" id="nfOpKind">${NF_OP_KINDS.filter(x => sell ? x[0] !== 'received' : x[0] !== 'shipped').map(([v, l]) => `<button type="button" class="${v === k ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="nf-op-acts"><button type="button" class="btn btn-primary" onclick="nfOpShoot()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3.5"/></svg>Take a photo</button>
      <label class="btn btn-outline">Upload a photo<input type="file" accept="image/*" hidden data-nf-cam="1" data-nf-own="1" onchange="nfOpPick(this)"></label></div></section>`;
}
function nfOpKindNow(){ const b = document.querySelector('#nfOpKind button.on'); return b ? b.dataset.v : 'other'; }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#nfOpKind button'); if(!b) return; b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
async function nfOpRenderGrid(poId){
  const grid = document.getElementById('nfOpGrid'); if(!grid) return;
  const list = await nfOpList(poId); const g = document.getElementById('nfOpGrid'); if(!g) return;
  const lbl = Object.fromEntries(NF_OP_KINDS);
  g.innerHTML = list.length ? list.map((p, i) => `<button type="button" class="nf-op-th" onclick="nfOpView('${poId}', ${i})"><img alt="${escapeHtml(lbl[p.kind] || 'Photo')} photo" src="${p.url}"><span>${escapeHtml(lbl[p.kind] || 'Photo')}</span></button>`).join('')
    : '<div class="nf-op-empty">No photos yet. A photo of the signed receipt or the payment slip settles any question later.</div>';
}
function nfOpView(poId, i){
  const p = (NFOP.cache[poId] || [])[i]; if(!p) return; const lbl = Object.fromEntries(NF_OP_KINDS);
  slModal('nfOpView', `<div class="sl-sheet-h"><b>${escapeHtml(lbl[p.kind] || 'Photo')} photo</b><button class="sl-x" onclick="slClose('nfOpView')">✕</button></div>
    <div class="nf-ok-img"><img alt="" src="${p.url}"></div><div class="sl-sub">${p.by ? 'By ' + escapeHtml(p.by) + ' · ' : ''}${new Date(p.at).toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})}${p.caption ? ' · ' + escapeHtml(p.caption) : ''}</div>`);
}
async function nfOpSave(data){
  const id = currentModalOrderId; if(!id) return; const grid = document.getElementById('nfOpGrid'); if(grid) grid.insertAdjacentHTML('afterbegin', '<div class="nf-op-empty">Saving…</div>');
  if(await nfOpAdd(id, nfOpKindNow(), data)){ showToast('Photo saved to this order. Both sides can see it.', 'success'); nfOpRenderGrid(id); }
  else nfOpRenderGrid(id);
}
function nfOpShoot(){ nfTakePhoto(nfOpSave, {title: 'Photo for this order'}); }
function nfOpPick(inp){ nfPickFile(inp, nfOpSave); }
// a photo attached inside any order form (waybill, delivery, payment slip) is also kept as proof
document.addEventListener('change', e => {
  const inp = e.target; if(!inp || inp.type !== 'file' || inp.dataset.nfOwn === '1' || !inp.closest || !inp.closest('#orderDetailModal')) return;
  const f = inp.files && inp.files[0]; if(!f || !/^image\//.test(f.type)) return; const id = currentModalOrderId; if(!id) return;
  const o = getPO(id); const kind = nfOpKindFor(o, sideOfPo(o) === 'supplier');
  const r = new FileReader(); r.onload = () => nfOpAdd(id, kind, r.result).then(ok => { if(ok) nfOpRenderGrid(id); }); r.readAsDataURL(f);
}, true);
// demo: a signed delivery receipt and a GCash slip, drawn on the spot so the demo has real proof to open
function nfDemoReceipt(kind, who, amount){
  const c = document.createElement('canvas'); c.width = 600; c.height = 760; const x = c.getContext('2d');
  x.fillStyle = '#E9E4DA'; x.fillRect(0, 0, 600, 760); x.save(); x.translate(300, 380); x.rotate(-0.03); x.fillStyle = '#FFFFFF'; x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 18; x.fillRect(-240, -330, 480, 660); x.restore();
  x.fillStyle = '#1F2329'; x.font = 'bold 30px sans-serif'; x.fillText(kind === 'payment' ? 'GCash' : 'DELIVERY RECEIPT', 90, 120);
  x.font = '22px sans-serif'; x.fillText(kind === 'payment' ? 'Sent to ' + who : 'Delivered to ' + who, 90, 170); x.fillText('Amount: ₱' + Number(amount).toLocaleString('en-US'), 90, 210); x.fillText('Date: ' + stmtDate(APP_TODAY), 90, 250);
  for(let i = 0; i < 6; i++){ x.fillStyle = '#D5DBE2'; x.fillRect(90, 300 + i * 34, 420 - (i % 3) * 60, 12); }
  x.strokeStyle = '#1E3A8A'; x.lineWidth = 3; x.beginPath(); x.moveTo(110, 600); x.bezierCurveTo(160, 540, 200, 650, 250, 590); x.bezierCurveTo(290, 550, 320, 640, 380, 585); x.stroke();
  x.fillStyle = '#1F2329'; x.font = '18px sans-serif'; x.fillText(kind === 'payment' ? 'Ref no. 5521 0087 113' : 'Received in good condition', 90, 650);
  return c.toDataURL('image/jpeg', 0.6);
}
function nfDemoOrderPhotos(){
  if(nfLive() || window._nfOpSeeded) return; window._nfOpSeeded = true; const s = nfOpDemoStore(); let changed = false;
  const add = (po, kind, who, by) => { const o = getPO(po); if(!o || (s[po] && s[po].length)) return; s[po] = [{id: nfUuid(), kind, url: nfDemoReceipt(kind, who, poTotal(o)), by, at: addDaysIso(APP_TODAY, -2) + 'T03:20:00Z', caption: '', mine: kind !== 'payment'}]; changed = true; };
  add('po12', 'delivered', 'Cavite Steel Works', 'Mark Santos'); add('po3', 'payment', 'Quezon Produce Traders', 'Liza Santos');
  if(changed) try{ localStorage.setItem(NF_OP_DEMO, JSON.stringify(s)); }catch(e){}
}
// the order sheet gets the photos card
(function(){ const f = window.nfOrderSheetHtml; if(typeof f !== 'function' || f._nf9) return;
  const w = function(o, sell, legacy){ const h = f.apply(this, arguments); return h.replace('<section class="nfo-items">', nfOpCardHtml(o, sell) + '<section class="nfo-items">'); };
  w._nf9 = true; window.nfOrderSheetHtml = w;
  const r = window.nfRenderOrderSheet; if(typeof r !== 'function' || r._nf9) return;
  const w2 = function(o, sell){ const out = r.apply(this, arguments); try{ nfDemoOrderPhotos(); }catch(e){} setTimeout(() => nfOpRenderGrid(o.id), 0); return out; };
  w2._nf9 = true; window.nfRenderOrderSheet = w2;
})();

/* ---------- profile pictures, synced through the database ---------- */
const NF_REMOTE_AV = {};
function nfSubjectFor(name){
  if(!nfLive()) return null; const k = nfAvKey(name);
  if(nfAvKey(myBusiness.name) === k) return ['business', myBusiness.id];
  const tm = (typeof teamMembers !== 'undefined' ? teamMembers : []).concat(typeof supplierTeamMembers !== 'undefined' ? supplierTeamMembers : []).find(t => nfAvKey(t.name) === k);
  if(tm) return ['member', String(tm.id)];
  const p = buyersData.concat(suppliersData).find(s => nfAvKey(s.name) === k);
  if(p) return [p.isOutside ? 'contact' : 'business', String(p.id)];
  return ['contact', k];
}
async function nfAvUpload(name, dataUrl){
  const subj = nfSubjectFor(name); if(!subj) return;
  const path = `${myBusiness.id}/${nfUuid()}.jpg`;
  const up = await sb.storage.from('avatars').upload(path, nfBlob(dataUrl), {contentType: 'image/jpeg', upsert: false});
  if(up.error){ showToast("Photo kept on this phone only: " + up.error.message, 'error'); return; }
  // a partner's own business photo belongs to them: you can only set a private one for your list
  const type = subj[0] === 'business' && subj[1] !== myBusiness.id ? 'contact' : subj[0];
  const { error } = await sb.from('profile_photos').upsert({owner_business_id: myBusiness.id, subject_type: type, subject_key: subj[1], path, updated_at: new Date().toISOString()}, {onConflict: 'owner_business_id,subject_type,subject_key'});
  if(error) showToast("Photo kept on this phone only: " + error.message, 'error');
  else NF_REMOTE_AV[nfAvKey(name)] = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
async function nfAvLoadRemote(){
  if(!nfLive()) return;
  const { data, error } = await sb.from('profile_photos').select('owner_business_id, subject_type, subject_key, path, updated_at').order('updated_at', {ascending: true}); if(error || !data) return;
  const nameOf = (type, key) => { if(type === 'business' && key === myBusiness.id) return myBusiness.name;
    if(type === 'member'){ const tm = (teamMembers || []).concat(supplierTeamMembers || []).find(t => String(t.id) === key); return tm && tm.name; }
    const p = buyersData.concat(suppliersData).find(s => String(s.id) === key); return p ? p.name : (type === 'contact' ? key : null); };
  data.forEach(r => { const n = nameOf(r.subject_type, r.subject_key); if(!n) return; const k = nfAvKey(n);
    // your own choice for a contact wins over their business photo
    if(r.subject_type === 'business' && NF_REMOTE_AV[k] && NF_REMOTE_AV[k]._own) return;
    const u = new String(sb.storage.from('avatars').getPublicUrl(r.path).data.publicUrl); if(r.owner_business_id === myBusiness.id && r.subject_type === 'contact') u._own = true; NF_REMOTE_AV[k] = u; });
  try{ document.querySelectorAll('[data-nfav]').forEach(e => delete e.dataset.nfav); nfAvatars(); }catch(e){}
}
(function(){
  const f = window.nfPhotoFor; if(typeof f === 'function' && !f._nf9){ const w = function(name){ const k = nfAvKey(name); const loc = nfAvStore()[k]; if(loc) return loc; const r = NF_REMOTE_AV[k]; return r ? String(r) : f.apply(this, arguments); }; w._nf9 = true; window.nfPhotoFor = w; }
  const s = window.nfAvSet; if(typeof s === 'function' && !s._nf9){ const w = function(name, dataUrl){ const out = s.apply(this, arguments); if(nfLive()) nfSquare(dataUrl, 320, sq => nfAvUpload(name, sq)); return out; }; w._nf9 = true; window.nfAvSet = w; }
  let tries = 0; const t = setInterval(() => { tries++; if(nfLive() && (buyersData.length || suppliersData.length || tries > 20)){ clearInterval(t); nfAvLoadRemote(); } else if(tries > 40) clearInterval(t); }, 1500);
})();
