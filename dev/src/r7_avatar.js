/* ===== Pictures: a real photo when there is one, otherwise clean initials (like Viber) =====
   Tap your own picture, a teammate's, or a chat's to take a photo on the spot or upload one.
   Customers have a blue ring and suppliers a purple ring. Photos are kept on this device. */
const NF_AV_KEY = 'nifti-avatars-v2';
const NF_INI_COLORS = ['#2563EB', '#0891B2', '#7C3AED', '#DB2777', '#4F46E5', '#0D9488', '#475569', '#9333EA', '#0369A1', '#BE185D'];
function nfAvStore(){ try{ return JSON.parse(localStorage.getItem(NF_AV_KEY) || '{}'); }catch(e){ return {}; } }
function nfAvSave(k, v){ const s = nfAvStore(); if(v) s[k] = v; else delete s[k]; try{ localStorage.setItem(NF_AV_KEY, JSON.stringify(s)); return true; }catch(e){ showToast('That photo is too big to keep on this device. Try a smaller one.', 'error'); return false; } }
function nfAvKey(name){ return String(name || '').toLowerCase().replace(/\(you\)/, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
function nfInitials(name){ const w = String(name || '?').replace(/\(you\)/i, '').replace(/\b(co|corp|inc)\.?$/i, '').trim().split(/\s+/).filter(x => /[A-Za-z0-9]/.test(x)); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toUpperCase(); }
function nfIniColor(name){ let h = 0; String(name).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return NF_INI_COLORS[h % NF_INI_COLORS.length]; }
function nfSamplePhoto(name){
  if(typeof NF_PHOTOS === 'undefined' || (typeof myBusiness !== 'undefined' && myBusiness)) return null;
  const n = nfAvKey(name); if(NF_PHOTOS[n]) return NF_PHOTOS[n];
  const first = n.split(' ')[0]; return ['liza', 'rico', 'ana', 'mark'].includes(first) ? NF_PHOTOS[first] : null;
}
function nfPhotoFor(name){ return nfAvStore()[nfAvKey(name)] || nfSamplePhoto(name); }
function nfAvatarInner(name){ const p = nfPhotoFor(name); return p ? `<img class="nf-av-img" alt="" src="${p}">` : `<span class="nf-ini" style="background:${nfIniColor(name)}">${escapeHtml(nfInitials(name))}</span>`; }

function nfAvName(el){
  const conv = el.closest('.conv-item'); if(conv){ const n = conv.querySelector('.conv-name'); return n && n.textContent; }
  if(el.closest('#threadHeadInfo')){ const d = el.parentElement.querySelector(':scope > div:not(.conv-avatar) > div'); return d && d.textContent; }
  const pt = el.closest('.pt-row'); if(pt){ const n = pt.querySelector('.pt-name'); return n && n.firstChild && n.firstChild.textContent; }
  const tp = el.closest('.team-person, .team-person-chip, [class*="team-person"]'); if(tp){ const n = tp.querySelector('.team-person-name'); return n && n.textContent; }
  if(el.closest('.user-chip')) return '__me';
  const sl = el.closest('.sl-row'); if(sl && el.classList.contains('sl-av')){ const t = sl.querySelector('.sl-t'); return t && t.firstChild && t.firstChild.textContent; }
  const nfo = el.closest('[data-nf-who]'); if(nfo) return nfo.dataset.nfWho;
  return null;
}
function nfAvSide(el){
  const conv = el.closest('.conv-item');
  if(conv){ const k = conv.querySelector('.conv-kind'); return k && /customer/i.test(k.textContent) ? 'cust' : k ? 'sup' : null; }
  if(el.closest('#threadHeadInfo') && typeof getActiveConv === 'function'){ const c = getActiveConv(); if(c) return (c.side || (supplierConversations.includes(c) ? 'supplier' : 'buyer')) === 'supplier' ? 'cust' : 'sup'; }
  const r = el.closest('[data-nf-side]'); if(r) return r.dataset.nfSide;
  return null;
}
function nfMyName(){ try{ const me = typeof teamMe === 'function' && teamMe(); return (me && me.name) || 'Dela Cruz'; }catch(e){ return 'Dela Cruz'; } }
function nfAvatars(){
  document.querySelectorAll('#view-app :is(.conv-avatar,.pt-av,.team-avatar,.user-chip .avatar,.sl-row .sl-av,.nf-av), #orderDetailModal .nf-av').forEach(el => {
    let name = nfAvName(el); if(!name) return; if(name === '__me') name = nfMyName();
    const side = nfAvSide(el), photo = nfPhotoFor(name), sig = name + '|' + side + '|' + (photo ? photo.length + photo.slice(-24) : 'ini');
    if(el.dataset.nfav === sig && el.firstElementChild) return;
    el.dataset.nfav = sig; el.classList.add('nf-has-av'); el.classList.toggle('nf-cust', side === 'cust'); el.classList.toggle('nf-sup', side === 'sup');
    el.innerHTML = nfAvatarInner(name);
    const conv = el.closest('.conv-item'); if(conv){ conv.classList.toggle('nf-cust', side === 'cust'); conv.classList.toggle('nf-sup', side === 'sup'); }
    if(el.closest('#threadHeadInfo') || el.closest('.user-chip') || el.closest('.team-person, [class*="team-person"]') || el.closest('.pt-row')){ el.classList.add('nf-av-edit'); el.title = 'Change photo'; el.onclick = ev => { ev.stopPropagation(); nfAvPicker(name); }; }
  });
}
function nfAvPicker(name){
  const has = !!nfAvStore()[nfAvKey(name)];
  slModal('nfAv', `<div class="sl-sheet-h"><b>Photo for ${escapeHtml(name)}</b><button class="sl-x" onclick="slClose('nfAv')">✕</button></div>
    <div class="nf-av-now"><span class="nf-has-av nf-av-big">${nfAvatarInner(name)}</span></div>
    <div class="nf-av-acts"><button class="btn btn-primary" onclick='nfTakePhoto(d => nfAvSet(${JSON.stringify(name)}, d), {title: "Photo for ${escapeHtml(name).replace(/"/g, '')}", face: true})'>Take a photo</button>
      <label class="btn btn-outline">Upload a photo<input type="file" accept="image/*" hidden onchange='nfPickFile(this, d => nfAvSet(${JSON.stringify(name)}, d))'></label>
      ${has ? `<button class="btn btn-outline" onclick='nfAvSave(${JSON.stringify(nfAvKey(name))}, null); slClose("nfAv"); nfAvatars();'>Remove photo</button>` : ''}</div>`);
}
function nfAvSet(name, dataUrl){ nfSquare(dataUrl, 160, sq => { if(nfAvSave(nfAvKey(name), sq)){ slClose('nfAv'); nfAvatars(); showToast('Photo saved.', 'success'); } }); }
function nfSquare(src, S, cb){ const img = new Image(); img.onload = () => { const c = document.createElement('canvas'), s = Math.min(img.width, img.height); c.width = c.height = S; c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, S, S); cb(c.toDataURL('image/jpeg', 0.82)); }; img.src = src; }
function nfPickFile(input, cb){ const f = input.files && input.files[0]; if(!f) return; const r = new FileReader(); r.onload = () => nfConfirmPhoto(r.result, cb, () => input.click()); r.readAsDataURL(f); input.value = ''; }

/* ---------- take a photo on the spot, then confirm before it is used ---------- */
let nfCam = null;
function nfTakePhoto(cb, opts){
  opts = opts || {};
  const fallback = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.setAttribute('capture', opts.face ? 'user' : 'environment'); i.onchange = () => nfPickFile(i, cb); i.click(); };
  if(!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return fallback();
  slModal('nfCam', `<div class="sl-sheet-h"><b>${escapeHtml(opts.title || 'Take a photo')}</b><button class="sl-x" onclick="nfCamStop(); slClose('nfCam')">✕</button></div>
    <div class="nf-cam"><video id="nfCamV" autoplay playsinline muted></video><div class="nf-cam-msg" id="nfCamMsg">Starting the camera…</div></div>
    <div class="nf-cam-acts"><button class="btn btn-primary nf-snap" id="nfSnap" disabled onclick="nfCamSnap()">Take photo</button></div>`);
  navigator.mediaDevices.getUserMedia({video: {facingMode: opts.face ? 'user' : 'environment'}, audio: false}).then(stream => {
    nfCam = {stream, cb}; const v = document.getElementById('nfCamV'); if(!v){ nfCamStop(); return; } v.srcObject = stream;
    const m = document.getElementById('nfCamMsg'); if(m) m.remove(); const b = document.getElementById('nfSnap'); if(b) b.disabled = false;
  }).catch(() => { slClose('nfCam'); fallback(); });
}
function nfCamStop(){ if(nfCam && nfCam.stream) nfCam.stream.getTracks().forEach(t => t.stop()); }
function nfCamSnap(){
  const v = document.getElementById('nfCamV'); if(!v || !nfCam) return;
  const c = document.createElement('canvas'), W = Math.min(1280, v.videoWidth || 640), H = Math.round(W * ((v.videoHeight || 480) / (v.videoWidth || 640)));
  c.width = W; c.height = H; c.getContext('2d').drawImage(v, 0, 0, W, H);
  const data = c.toDataURL('image/jpeg', 0.85), cb = nfCam.cb; nfCamStop(); slClose('nfCam');
  nfConfirmPhoto(data, cb, () => nfTakePhoto(cb));
}
function nfConfirmPhoto(data, cb, retake){
  window._nfPhotoCb = cb; window._nfPhotoRetake = retake; window._nfPhotoData = data;
  slModal('nfOk', `<div class="sl-sheet-h"><b>Use this photo?</b><button class="sl-x" onclick="slClose('nfOk')">✕</button></div>
    <div class="nf-ok-img"><img alt="Your photo" src="${data}"></div>
    <div class="nf-cam-acts"><button class="btn btn-outline" onclick="slClose('nfOk'); window._nfPhotoRetake && window._nfPhotoRetake()">Retake</button><button class="btn btn-primary" onclick="slClose('nfOk'); window._nfPhotoCb && window._nfPhotoCb(window._nfPhotoData)">Yes, upload it</button></div>`);
}
// every photo upload in the app also offers "Take a photo" (with the same confirm step)
function nfDataUrlToFile(data, name){ const [h, b] = data.split(','), bin = atob(b), u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new File([u], name || 'photo.jpg', {type: (h.match(/:(.*?);/) || [])[1] || 'image/jpeg'}); }
function nfCameraButtons(){
  document.querySelectorAll('#view-app input[type=file], #orderDetailModal input[type=file], .sl-sheet input[type=file], .share-modal input[type=file]').forEach(inp => {
    if(inp.dataset.nfCam || inp.closest('.nf-av-acts')) return; const acc = inp.getAttribute('accept') || '';
    if(acc && !/image/.test(acc)) return; inp.dataset.nfCam = '1';
    const host = inp.closest('label') || inp; const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-outline nf-take';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3.5"/></svg>Take a photo';
    b.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); nfTakePhoto(data => { try{ const dt = new DataTransfer(); dt.items.add(nfDataUrlToFile(data, 'photo-' + Date.now() + '.jpg')); inp.files = dt.files; inp.dispatchEvent(new Event('change', {bubbles: true})); }catch(e){ showToast("This browser can't attach the photo. Use Upload instead.", 'error'); } }); };
    host.insertAdjacentElement('beforebegin', b);
  });
}
(function(){ let raf = 0; const run = () => { raf = 0; try{ nfAvatars(); nfCameraButtons(); }catch(e){} };
  const start = () => { new MutationObserver(() => { if(!raf) raf = requestAnimationFrame(run); }).observe(document.body, {childList: true, subtree: true}); run(); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start(); })();
