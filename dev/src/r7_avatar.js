/* ===== Round 7: photos and pictures instead of plain initials =====
   Every person and business gets a picture: a photo you upload, or one of the ready-made icons.
   Customers always have a blue ring and a blue tag, suppliers a purple ring and a purple tag, so
   you can tell them apart at a glance (red, yellow and green stay for good and bad news only).
   Pictures are kept on this device. */
const NF_AV_KEY = 'nifti-avatars-v1';
const NF_ICONS = {
  store: '<path d="M10 26h44l-3-10H13z"/><path d="M14 26v22h36V26"/><path d="M27 48V36h10v12"/>',
  steel: '<path d="M12 20h40M12 44h40M26 20v24M38 20v24"/>',
  cement: '<path d="M18 18h28l4 30H14z"/><path d="M22 28h20M22 36h20"/>',
  produce: '<path d="M32 50c10 0 16-8 16-18S40 16 32 16s-16 6-16 16 6 18 16 18z"/><path d="M32 16c0-5 3-8 8-9M32 16c-3-4-7-5-11-4"/>',
  truck: '<path d="M10 22h26v20H10zM36 28h10l6 7v7H36"/><circle cx="18" cy="45" r="4"/><circle cx="44" cy="45" r="4"/>',
  helmet: '<path d="M12 40h40M16 40a16 16 0 0 1 32 0"/><path d="M28 24v-6h8v6"/><path d="M14 40v5h36v-5"/>',
  weld: '<path d="M18 46l16-16M34 30l6-14 6 6-14 6"/><path d="M14 22l3 3M22 14l1 4M12 32l4-1"/>',
  box: '<path d="M32 12l18 9v22l-18 9-18-9V21z"/><path d="M14 21l18 9 18-9M32 30v22"/>',
  wrench: '<path d="M38 14a10 10 0 0 0-9 14L14 43l7 7 15-15a10 10 0 0 0 14-9l-6 2-5-5 2-6z"/>',
  fish: '<path d="M10 32c8-10 22-12 32 0-10 12-24 10-32 0z"/><path d="M42 32l10-8v16z"/><circle cx="22" cy="30" r="1.5"/>',
  rice: '<path d="M16 30h32c0 10-7 18-16 18s-16-8-16-18z"/><path d="M24 30c0-6 4-12 8-14M32 30c0-7 3-12 8-13"/>',
  person: '<circle cx="32" cy="24" r="10"/><path d="M14 52c2-10 9-15 18-15s16 5 18 15"/>',
};
// ready-made "photos" for the people in the demo team
const NF_FACES = {
  liza: ['#F6D5C0', '#3B2A20', '#E9F2FF', 'long'], rico: ['#C99A78', '#1E1A16', '#FFF4E5', 'short'], ana: ['#E8C4A8', '#5A3A28', '#FCEFF5', 'bun'],
  mark: ['#B9866A', '#24201C', '#EAF7F1', 'cap'], dela: ['#D9A988', '#2B2420', '#EEF2F7', 'short'],
};
function nfFaceSvg(skin, hair, bg, style){
  const h = style === 'long' ? `<path d="M14 34c0-14 8-22 18-22s18 8 18 22v14H14z" fill="${hair}"/>` : style === 'bun' ? `<circle cx="32" cy="12" r="6" fill="${hair}"/><path d="M18 28c0-10 6-15 14-15s14 5 14 15z" fill="${hair}"/>`
    : style === 'cap' ? `<path d="M17 26c0-9 7-14 15-14s15 5 15 14z" fill="#1F6B45"/><path d="M40 24h12v3H40z" fill="#1F6B45"/>` : `<path d="M19 27c0-10 6-14 13-14s13 4 13 14c-4-4-9-5-13-5s-9 1-13 5z" fill="${hair}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/>${style === 'long' ? h : ''}<path d="M10 64c2-12 11-18 22-18s20 6 22 18z" fill="#3E5A80"/><rect x="27" y="38" width="10" height="10" rx="3" fill="${skin}"/><circle cx="32" cy="29" r="12" fill="${skin}"/>${style !== 'long' ? h : ''}<circle cx="27.5" cy="30" r="1.4" fill="#222"/><circle cx="36.5" cy="30" r="1.4" fill="#222"/><path d="M28 35c2.5 2 5.5 2 8 0" stroke="#7A3E2E" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
}
function nfIconSvg(key, side){
  const g = side === 'cust' ? ['#3B82F6', '#1D4ED8'] : side === 'sup' ? ['#8B5CF6', '#6D28D9'] : ['#2F855A', '#1F6B45'];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${NF_ICONS[key] || NF_ICONS.store}</g></svg>`;
}
const nfUri = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
function nfAvStore(){ try{ return JSON.parse(localStorage.getItem(NF_AV_KEY) || '{}'); }catch(e){ return {}; } }
function nfAvSave(k, v){ const s = nfAvStore(); if(v) s[k] = v; else delete s[k]; try{ localStorage.setItem(NF_AV_KEY, JSON.stringify(s)); }catch(e){ showToast('That photo is too big to keep on this device. Try a smaller one.', 'error'); } }
function nfAvKey(name){ return String(name || '').toLowerCase().replace(/\(you\)/, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
function nfGuessIcon(name){
  const n = String(name || '').toLowerCase();
  return /steel|metal|beam|rebar|iron/.test(n) ? 'steel' : /cement|aggregate|sand/.test(n) ? 'cement' : /produce|fresh|vegetable|fruit|farm/.test(n) ? 'produce' : /poultry|chicken|meat/.test(n) ? 'produce'
    : /seafood|fish/.test(n) ? 'fish' : /rice|grain/.test(n) ? 'rice' : /weld|fabricat/.test(n) ? 'weld' : /construct|builder|scaffold|contractor/.test(n) ? 'helmet'
    : /packag|box|carton/.test(n) ? 'box' : /truck|logistic|freight|express/.test(n) ? 'truck' : /hardware|supply|store|trading/.test(n) ? 'store' : 'store';
}
function nfFaceFor(name){ const n = nfAvKey(name); const k = Object.keys(NF_FACES).find(f => n.startsWith(f) || n.split(' ').includes(f)); return k ? nfUri(nfFaceSvg(...NF_FACES[k])) : null; }
function nfAvatarSrc(name, side){
  const v = nfAvStore()[nfAvKey(name)];
  if(v && v.startsWith('icon:')) return nfUri(nfIconSvg(v.slice(5), side));
  if(v) return v;
  return nfFaceFor(name) || nfUri(nfIconSvg(nfGuessIcon(name), side));
}
function nfAvatarImg(name, side){ return `<img class="nf-av-img" alt="" src="${nfAvatarSrc(name, side)}">`; }

// put pictures into every avatar on screen
function nfAvName(el){
  const conv = el.closest('.conv-item'); if(conv){ const n = conv.querySelector('.conv-name'); return n && n.textContent; }
  if(el.closest('#threadHeadInfo')){ const d = el.parentElement.querySelector(':scope > div:not(.conv-avatar) > div'); return d && d.textContent; }
  const pt = el.closest('.pt-row'); if(pt){ const n = pt.querySelector('.pt-name'); return n && n.firstChild && n.firstChild.textContent; }
  const tp = el.closest('.team-person, .team-person-chip, [class*="team-person"]'); if(tp){ const n = tp.querySelector('.team-person-name'); return n && n.textContent; }
  if(el.closest('.user-chip')) return '__me';
  const one = el.closest('.one-msg'); if(one){ const b = one.querySelector('b'); return b && b.textContent; }
  return null;
}
function nfAvSide(el){
  const conv = el.closest('.conv-item');
  if(conv){ const k = conv.querySelector('.conv-kind'); return k && /customer/i.test(k.textContent) ? 'cust' : k ? 'sup' : null; }
  if(el.closest('#threadHeadInfo') && typeof getActiveConv === 'function'){ const c = getActiveConv(); if(c) return (c.side || (supplierConversations.includes(c) ? 'supplier' : 'buyer')) === 'supplier' ? 'cust' : 'sup'; }
  if(el.closest('#page-suppliers')) return currentAppRole === 'supplier' ? 'cust' : 'sup';
  return null;
}
function nfMyName(){ try{ const me = typeof teamMe === 'function' && teamMe(); return (me && me.name) || 'Dela Cruz'; }catch(e){ return 'Dela Cruz'; } }
function nfAvatars(){
  document.querySelectorAll('#view-app :is(.conv-avatar,.pt-av,.team-avatar,.user-chip .avatar), #mhSheet .conv-avatar').forEach(el => {
    let name = nfAvName(el); if(!name) return; if(name === '__me') name = nfMyName();
    const side = nfAvSide(el), sig = name + '|' + side + '|' + (nfAvStore()[nfAvKey(name)] || '').slice(0, 40);
    if(el.dataset.nfav === sig && el.querySelector('img')) return;
    el.dataset.nfav = sig; el.classList.add('nf-has-av'); el.classList.toggle('nf-cust', side === 'cust'); el.classList.toggle('nf-sup', side === 'sup');
    el.innerHTML = nfAvatarImg(name, side);
    const conv = el.closest('.conv-item'); if(conv){ conv.classList.toggle('nf-cust', side === 'cust'); conv.classList.toggle('nf-sup', side === 'sup'); }
    if(el.closest('#threadHeadInfo') || el.closest('.user-chip') || el.closest('.team-person, [class*="team-person"]')){ el.classList.add('nf-av-edit'); el.title = 'Change picture'; el.onclick = ev => { ev.stopPropagation(); nfAvPicker(name, side); }; }
  });
}
// choose a picture: upload a photo or pick an icon
function nfAvPicker(name, side){
  const icons = Object.keys(NF_ICONS);
  slModal('nfAv', `<div class="sl-sheet-h"><b>Picture for ${escapeHtml(name)}</b><button class="sl-x" onclick="slClose('nfAv')">✕</button></div>
    <div class="sl-sub">Upload a photo or logo, or pick a picture below.</div>
    <div class="nf-av-now">${nfAvatarImg(name, side)}</div>
    <label class="btn btn-primary nf-av-up">Upload a photo<input type="file" accept="image/*" hidden onchange="nfAvUpload(this, ${escapeHtml(JSON.stringify(name))})"></label>
    <div class="nf-av-grid">${icons.map(k => `<button type="button" onclick='nfAvSave(${JSON.stringify(nfAvKey(name))}, "icon:${k}"); slClose("nfAv"); nfAvatars();' aria-label="${k}"><img alt="" src="${nfUri(k === 'person' ? nfIconSvg('person', side) : nfIconSvg(k, side))}"></button>`).join('')}</div>
    <button class="btn btn-outline" onclick='nfAvSave(${JSON.stringify(nfAvKey(name))}, null); slClose("nfAv"); nfAvatars();'>Use the default picture</button>`);
}
function nfAvUpload(input, name){
  const f = input.files && input.files[0]; if(!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => { const c = document.createElement('canvas'), S = 160, s = Math.min(img.width, img.height); c.width = c.height = S;
    c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, S, S); URL.revokeObjectURL(url);
    nfAvSave(nfAvKey(name), c.toDataURL('image/jpeg', 0.82)); slClose('nfAv'); nfAvatars(); showToast('Picture saved.', 'success'); };
  img.onerror = () => showToast("That file isn't a photo we can read.", 'error');
  img.src = url;
}
(function(){ let raf = 0; const run = () => { raf = 0; try{ nfAvatars(); }catch(e){} };
  const start = () => { new MutationObserver(() => { if(!raf) raf = requestAnimationFrame(run); }).observe(document.getElementById('view-app') || document.body, {childList: true, subtree: true}); run(); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start(); })();
