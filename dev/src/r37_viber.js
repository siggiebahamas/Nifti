/* ===== Round 37: Viber that sorts itself =====
   A Viber chat from someone you already deal with joins their chat by itself (same name or number).
   Family and friends stay out of Nifti (personal chats are recognised and kept hidden).
   Anyone new shows as one row: "Looks like a new customer" with a one-tap answer, and you can reply right away. */
const NF37V = {auto: {}, undo: null};
const NF37V_BIZ = /\b(order|orders|pa-?order|pcs|piraso|pc|bags?|sako|kilos?|kg|box(es)?|cases?|rolls?|presyo|price|prices|magkano|how much|quotation|quote|qoute|delivery|deliver|ihatid|hatid|pick ?up|invoice|resibo|receipt|\bdr\b|\bpo\b|bayad|payment|paid|gcash|maya|bdo|bpi|metrobank|cheque|check|utang|balance|stock|available|meron pa|supplier|item|items|sku|price ?list|discount|terms|due|deposit|sukli|pesos?|php)\b|₱\s?\d|\d+\s?(x|pcs|bags|kg|boxes)\b/i;
const NF37V_PERSONAL = /\b(anak|nak|mama|mommy|mom|papa|daddy|dad|lola|lolo|tita|tito|ate|kuya ko|bunso|babe|baby|love|mahal|labyu|i love you|miss you|ingat|kumain ka na|kain na|uwi|bahay|happy birthday|hbd|merry christmas|simbang gabi|haha+|hehe+|lol)\b/i;
const NF37V_FAMILY_ONLY = /^\W*(mama|mom|mommy|ma|papa|dad|daddy|pa|lola|lolo|tita|tito|ate|kuya|bunso|wife|hubby|husband|babe|baby|love|mahal|family|pamilya|barkada)\W*$/i;
const NF37V_FAMILY_TITLES = /^\W*(mama|mom|mommy|papa|dad|daddy|lola|lolo|wife|hubby|husband|babe|baby|love|mahal|family|pamilya|barkada)\b/i;
const NF37V_BIZ_NAME = /\b(hardware|construction|builders?|trading|store|supply|supplies|enterprises?|corp|inc|co\.|company|sari-?sari|mart|shop|depot|steel|marketing|services?|industries|resto|restaurant|cafe|bakery|pharmacy|farm|agri|motors?|parts|electrical|plumbing|lumber|glass|aluminum|printing|logistics|trucking)\b/i;

function nf37vNorm(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\b(corp|corporation|inc|incorporated|co|company|enterprises?|trading|store|shop|opc|the)\b/g, ' ').replace(/\s+/g, ' ').trim(); }
function nf37vDigits(s){ const d = String(s || '').replace(/[^\d]/g, ''); return d.slice(-10); }
function nf37vPhoneOf(conv){
  try{ const p = nf33RPref(conv.id); if(p && p.phone) return nf37vDigits(p.phone); }catch(e){}
  try{ const b = (buyersData || []).find(x => x.id === conv.id); if(b && b.phone) return nf37vDigits(b.phone); }catch(e){}
  return '';
}
// who this Viber chat probably is: an existing customer or supplier (with how sure), or nobody yet
function nf37vMatch(t){
  const convs = NF36V_ALL(), tn = nf37vNorm(t.title), ph = nf37vDigits(t.phone);
  let best = null;
  convs.forEach(c => {
    let score = 0; const cn = nf37vNorm(c.name);
    if(ph.length === 10 && nf37vPhoneOf(c) === ph) score = 1;
    else if(tn.length >= 3 && cn === tn) score = 0.95;
    else if(tn.length >= 6 && cn.length >= 6 && (cn.startsWith(tn) || tn.startsWith(cn))) score = 0.88;
    else { const a = new Set(tn.split(' ').filter(w => w.length > 2)), b = new Set(cn.split(' ').filter(w => w.length > 2)); if(a.size && b.size){ const inter = [...a].filter(w => b.has(w)).length, uni = new Set([...a, ...b]).size; if(inter / uni >= 0.5) score = 0.7 + 0.1 * (inter / uni); } }
    if(score && (!best || score > best.score)) best = {conv: c, score, kind: nf36vSideKind(convSide(c))};
  });
  if(best){ const ties = convs.filter(c => c !== best.conv && nf37vNorm(c.name) === nf37vNorm(best.conv.name)); if(ties.length) best.score = Math.min(best.score, 0.6); }
  return best;
}
function nf37vText(t){ return nf36vMsgsOf(t).filter(m => m.dir === 'in').map(m => m.body || '').join(' \n ') + ' ' + (t.last_text || ''); }
// business, personal, or can't tell, from the chat's name and what they wrote
function nf37vSort(t){
  if(t._sort && t._sortVer === NF36V.ver) return t._sort;
  const text = nf37vText(t), m = nf37vMatch(t);
  let r;
  const title = String(t.title || '').trim(), bizText = NF37V_BIZ.test(text), bizName = NF37V_BIZ_NAME.test(title);
  if(m && m.score >= 0.85) r = {cls: 'match', match: m};
  else if(NF37V_FAMILY_ONLY.test(title) && !bizText) r = {cls: 'personal'};
  else if(!bizText && !bizName && (NF37V_FAMILY_TITLES.test(title) || NF37V_PERSONAL.test(text))) r = {cls: 'personal'};
  else {
    const biz = bizText || bizName;
    const supplierish = /\b(quotation|quote|price ?list|our price|new price|invoice|statement|soa|\bdr\b|delivery receipt|due date|pakibayad|please pay|we can deliver|available po kami)\b/i.test(text);
    const asks = /\b(magkano|how much|pwede po|pa-?order|order po|meron pa|available|may stock|pabili|bibili)\b/i.test(text);
    r = {cls: biz ? 'business' : 'unknown', guess: supplierish && !asks ? 'supplier' : 'customer', why: asks ? 'asked about a price or an order' : supplierish ? 'sent a price, bill or delivery note' : biz ? 'talked about an order' : '', maybe: m && m.score >= 0.6 ? m : null};
  }
  t._sort = r; t._sortVer = NF36V.ver; return r;
}
// chats that sort themselves: matched ones link, nobody has to touch them
function nf37vAutoLink(){
  NF36V.threads.filter(t => t.status === 'new' && !NF37V.auto[t.id]).forEach(t => {
    const s = nf37vSort(t); NF37V.auto[t.id] = true;
    if(s.cls !== 'match') return;
    const c = s.match.conv, kind = s.match.kind;
    Object.assign(t, {status: 'linked', party_kind: kind, party_id: c.id, party_name: c.name, _auto: true});
    if(myBusiness) sb.rpc('viber_link', {p_thread: t.id, p_kind: kind, p_party_id: c.id, p_party_name: c.name}).then(() => {}, () => {});
    NF37V.undo = t.id;
    if(document.body.classList.contains('nf33-msgs')) setTimeout(() => { try{ showToast(`Viber: "${t.title}" is ${c.name}. Their Viber messages are now in their chat.`, 'success'); }catch(e){} }, 400);
  });
}
function nf37vPersonal(){ return NF36V.threads.filter(t => t.status === 'new' && nf37vSort(t).cls === 'personal'); }
function nf37vNewShown(){ return NF36V.threads.filter(t => t.status === 'new' && ['business', 'unknown'].includes(nf37vSort(t).cls) && (!myBusiness || t.owner_user_id === nf36vMeId())); }

// ---- new contacts become chats you can open and answer right away ----
nf36vNewThreads = function(){ return nf37vNewShown(); };
const NF37V_VIRT = nf36vVirtuals;
nf36vVirtuals = function(){
  const out = NF37V_VIRT(); out.forEach(c => { c._new = false; });
  nf37vNewShown().forEach(t => {
    const id = 'vb_' + t.id; let c = NF36V.vc[id]; if(!c){ c = NF36V.vc[id] = {id, _vb: t.id}; }
    const s = nf37vSort(t);
    c._new = true; c.name = nf36vSafe(t.title); c.initials = nf36vIni(c.name).replace(/[^A-Za-z0-9]/g, '') || '?'; c.side = nf36vKindSide(s.guess || 'customer');
    if(c._ver !== NF36V.ver){ c.messages = nf36vMsgsOf(t).map(m => nf36vAppMsg(m, t)); c._ver = NF36V.ver; }
    c.unread = t.unread || 0; out.push(c);
  });
  return out;
};
// the list row of a new contact: what Nifti thinks, and one tap to say yes
(function(){
  const baseRow = nf33Row;
  nf33Row = function(c){
    const h = baseRow(c); if(!c || !c._new) return h;
    const t = NF36V.threads.find(x => x.id === c._vb); if(!t) return h;
    const s = nf37vSort(t), kind = s.guess || 'customer', m = s.maybe;
    const guess = m ? `Is this <b>${nf36vEsc(m.conv.name)}</b>?` : `Looks like a new ${kind}${s.why ? ' · ' + nf36vEsc(s.why) : ''}`;
    const acts = m ? `<button type="button" class="pri" onclick="event.stopPropagation(); nf36vLink('${t.id}','${m.kind}','${nf36vEsc(m.conv.id)}')">Yes, ${nf36vEsc(m.conv.name.split(' ')[0])}</button><button type="button" onclick="event.stopPropagation(); nf36vPick('${t.id}','${kind}')">Someone else</button>`
      : `<button type="button" class="pri" onclick="event.stopPropagation(); nf37vAdd('${t.id}','${kind}')">Add as ${kind}</button><button type="button" onclick="event.stopPropagation(); nf37vAdd('${t.id}','${kind === 'customer' ? 'supplier' : 'customer'}')">${kind === 'customer' ? 'Supplier' : 'Customer'}</button>`;
    return `<div class="nf37v-new" data-g="${nf33Group(c)}">${h.replace('class="nf33-row', 'class="nf33-row nf37v-row')}<div class="nf37v-tag"><span class="nf37v-chip">New on Viber</span><span class="nf37v-g">${guess}</span></div>
      <div class="nf37v-acts">${acts}<button type="button" class="ghost" onclick="event.stopPropagation(); nf37vPersonalize('${t.id}')">Personal</button></div></div>`;
  };
})();
// "Add as customer": done in one tap. If someone in your list has the same name, Nifti asks first.
async function nf37vAdd(id, kind){
  const t = NF36V.threads.find(x => x.id === id); if(!t) return;
  const s = nf37vSort(t); if(s.maybe && s.maybe.kind === kind) return nf36vPick(id, kind);
  if(myBusiness){ const { error } = await sb.rpc('viber_link', {p_thread: id, p_kind: kind, p_party_id: '', p_party_name: t.title}); if(error) return showToast("Couldn't save: " + error.message); }
  Object.assign(t, {status: 'linked', party_kind: kind, party_id: null, party_name: t.title});
  nf36vChanged(); showToast(`${t.title} is now a ${kind}. Their Viber messages stay in this chat.`, 'success');
}
// personal: kept out of Nifti, and nothing is saved from it
async function nf37vPersonalize(id){
  const t = NF36V.threads.find(x => x.id === id); if(!t) return;
  if(myBusiness){
    try{ const { data } = await sb.auth.getSession(); const tok = data && data.session && data.session.access_token;
      const r = await fetch(`${NIFTI_SUPABASE_URL}/functions/v1/viber-media?op=ignore&t=${encodeURIComponent(id)}`, {method: 'POST', headers: {Authorization: 'Bearer ' + tok, apikey: NIFTI_SUPABASE_KEY}});
      if(!r.ok) throw new Error('could not hide it'); }catch(e){ return showToast("Couldn't hide it: " + e.message); }
  }
  t.status = 'ignored'; delete NF36V.msgs[id];
  if(activeConvId === 'vb_' + id){ activeConvId = null; const sh = document.querySelector('.messages-shell'); if(sh) sh.classList.remove('thread-active'); }
  nf36vChanged(); showToast(`${t.title} is personal. Nifti won't show it or keep anything from it.`, 'success');
}
// hidden personal chats, in case one was really a customer
function nf37vPersonalSheet(){
  const list = nf37vPersonal();
  slModal('nf37vP', `<div class="sl-sheet-h"><b>Personal Viber chats</b><button class="sl-x" onclick="slClose('nf37vP')" aria-label="Close">✕</button></div>
    <p class="nf36v-p">Nifti thinks these are family or friends, so it keeps them out of your business chats. Only you can see this list.</p>
    <div class="nf36v-sheetlist">${list.map(t => `<div class="nf36v-nrow"><div class="nf36v-nmain"><span class="nf33-av sm">${nfAvatarInner(t.title)}</span><span><b>${nf36vEsc(t.title)}</b><small>${nf36vEsc(t.last_text || '')}</small></span></div>
      <span class="nf36v-nacts"><button type="button" onclick="slClose('nf37vP'); nf37vAdd('${t.id}','customer')">Customer</button><button type="button" onclick="slClose('nf37vP'); nf37vAdd('${t.id}','supplier')">Supplier</button><button type="button" class="ghost" onclick="slClose('nf37vP'); nf37vPersonalize('${t.id}')">Keep personal</button></span></div>`).join('') || '<p class="nf36v-p">None.</p>'}</div>`);
}
// the top of the list: replies that didn't go out, and a quiet note about personal chats
nf36vNewHtml = function(){
  const p = nf37vPersonal().length;
  return p ? `<button type="button" class="nf37v-pers" onclick="nf37vPersonalSheet()">${p} personal Viber chat${p === 1 ? '' : 's'} kept out of Nifti · see</button>` : '';
};

// ---- the bar above the message box ----
(function(){
  const baseBar = nf36vBar;
  nf36vBar = function(conv, ths){
    baseBar(conv, ths);
    const bar = document.getElementById('nf36vBar'); if(!bar || !conv || !ths || !ths.length) return;
    const t = ths[0];
    if(conv._new){
      const s = nf37vSort(t), kind = s.guess || 'customer';
      bar.insertAdjacentHTML('afterbegin', `<div class="nf37v-who"><span class="nf37v-chip">New on Viber</span><b>Who is ${nf36vEsc(t.title)}?</b>
        <span><button type="button" class="pri" onclick="nf37vAdd('${t.id}','${kind}')">A ${kind}</button><button type="button" onclick="nf37vAdd('${t.id}','${kind === 'customer' ? 'supplier' : 'customer'}')">A ${kind === 'customer' ? 'supplier' : 'customer'}</button><button type="button" onclick="nf36vPick('${t.id}','${kind}')">Already in my list</button><button type="button" class="ghost" onclick="nf37vPersonalize('${t.id}')">Personal</button></span></div>`);
    }
    // no phone connected (iPhone, or not set up): paste and photo in one tap
    if(!nf36vLiveDevice(t) && nf36vRoute(conv, ths) === 'viber'){
      const add = bar.querySelector('.nf36v-add'); if(add) add.remove();
      bar.insertAdjacentHTML('beforeend', `<span class="nf37v-quick"><button type="button" onclick="nf37vPaste()">${NF37V_IC.paste}Paste what they sent</button>
        <label>${NF37V_IC.photo}Add their photo<input type="file" accept="image/*,application/pdf" hidden onchange="nf37vPhoto(this)"></label></span>`);
    }
  };
})();
const NF37V_IC = {
  paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/></svg>',
  photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/></svg>',
};
// one tap: whatever you copied in Viber lands in this chat as their message
async function nf37vPaste(){
  let text = '';
  try{ text = await navigator.clipboard.readText(); }catch(e){}
  text = String(text || '').trim();
  if(!text){ nf36vAddSheet(); showToast('In Viber, hold their message and tap Copy. Then tap Paste here.', 'info'); return; }
  await nf37vAddIn(text, null);
}
async function nf37vPhoto(input){ const f = input.files && input.files[0]; if(!f) return; await nf37vAddIn('', f); input.value = ''; }
async function nf37vAddIn(text, file){
  const conv = getActiveConv(); if(!conv) return;
  const ths = nf36vLinkedFor(conv), kind = conv._vb ? (ths[0] && ths[0].party_kind) || 'customer' : nf36vSideKind(convSide(conv));
  const partyId = conv._vb ? (ths[0] && ths[0].party_id) || '' : conv.id;
  const fk = f => /^image\//.test(f.type) ? 'photo' : /^video\//.test(f.type) ? 'video' : 'file';
  if(!myBusiness){
    let t = ths[0]; if(!t){ t = {id: 'vt' + Date.now(), title: conv.name, status: 'linked', party_kind: kind, party_id: partyId, party_name: conv.name, owner_user_id: 'me', unread: 0}; NF36V.threads.push(t); }
    (NF36V.msgs[t.id] = NF36V.msgs[t.id] || []).push({id: 'vm' + Date.now(), thread_id: t.id, dir: 'in', body: text, kind: file ? fk(file) : 'text', at: nf36vNowIso(), media_status: file ? 'ok' : 'none', media_name: file ? file.name : null, media_size: file ? file.size : null, _url: file ? URL.createObjectURL(file) : null, status: 'done', source: 'paste', ack: false});
    nf36vChanged(); return showToast(file ? 'Photo added ✓' : 'Added ✓', 'success');
  }
  const { data, error } = await sb.rpc('viber_web_add', {p_business: myBusiness.id, p_kind: kind, p_party_id: partyId, p_party_name: conv.name, p_dir: 'in', p_text: text || null, p_media_kind: file ? fk(file) : 'text'});
  if(error) return showToast("Couldn't add it: " + error.message);
  await nf36vLoad();
  if(file && data && data.message) await nf36vFill(data.message.id, {files: [file]}); else showToast('Added ✓', 'success');
}

// ---- replying without the app: Nifti opens their chat with your words already typed where Viber allows it ----
nf36vOptionA = async function(t, text, conv){
  const ph = nf36vPhoneFor(t, conv);
  if(window.NiftiAndroid){ try{ window.NiftiAndroid.viber(ph ? '+' + ph : '', text); return; }catch(e){} }
  let copied = false; try{ copied = await nf33RCopy(text); }catch(e){}
  showToast(copied ? 'Opening Viber. If your words aren\'t there yet, hold the box and tap Paste.' : 'Opening Viber…', 'info');
  setTimeout(() => { try{ location.href = ph ? `viber://chat?number=%2B${ph}&draft=${encodeURIComponent(text)}` : 'viber://forward?text=' + encodeURIComponent(text); }catch(e){} }, 250);
};

// ---- demo: one chat that sorts itself into Riverside, to show it happening ----
(function(){
  const baseSeed = nf36vSeed;
  nf36vSeed = function(){
    const first = !NF36V.seeded && !myBusiness; baseSeed.apply(this, arguments);
    if(!first) return;
    const riv = NF36V_ALL().find(c => /riverside/i.test(c.name)); if(!riv) return;
    const at = new Date(APP_TODAY + 'T10:24:00').toISOString();
    NF36V.threads.push({id: 'vt6', title: 'Riverside Builders', status: 'new', owner_user_id: 'me', owner_name: 'You', device_id: 'dv1', unread: 1, last_at: at, last_text: 'Boss, na-deposit na po yung 6k na cheke kahapon'});
    NF36V.msgs.vt6 = [{id: 'vm-r1', thread_id: 'vt6', dir: 'in', body: 'Boss, na-deposit na po yung 6k na cheke kahapon. Paki-check na lang po.', kind: 'text', at, media_status: 'none', status: 'done', source: 'notif', ack: false}];
    NF36V.ver++;
  };
})();

// ---- after every load or change: sort new chats first ----
(function(){
  const baseChanged = nf36vChanged;
  nf36vChanged = function(){ try{ nf37vAutoLink(); }catch(e){} return baseChanged.apply(this, arguments); };
  const baseLoad = nf36vLoad;
  nf36vLoad = async function(){ const r = await baseLoad.apply(this, arguments); try{ const before = NF36V.threads.filter(t => t.status === 'linked').length; nf37vAutoLink(); if(NF36V.threads.filter(t => t.status === 'linked').length !== before) baseChanged(); }catch(e){} return r; };
  const baseTick = nf36vTick;
  nf36vTick = async function(){ const r = await baseTick.apply(this, arguments); if(!myBusiness){ const before = NF36V.threads.filter(t => t.status === 'linked').length; nf37vAutoLink(); if(NF36V.threads.filter(t => t.status === 'linked').length !== before) baseChanged(); } return r; };
})();

// the red count: a new contact is already a chat row, so it isn't counted twice
nf36vBadgeExtra = function(){ let n = 0; NF36V.threads.forEach(t => { if(t.status === 'linked' && nf36vConvFor(t) && (t.unread || 0) > 0) n += 1; }); n += nf36vIssues().filter(i => i.kind === 'failed').length; return n; };

// ---- Connect Viber inside the Android app: one step at a time, moves on by itself ----
const NF37V_STEPS_SKIP = 'nifti-viber-skip';
function nf37vSkipped(){ try{ return JSON.parse(localStorage.getItem(NF37V_STEPS_SKIP) || '{}') || {}; }catch(e){ return {}; } }
function nf37vSkip(k){ const s = nf37vSkipped(); s[k] = 1; try{ localStorage.setItem(NF37V_STEPS_SKIP, JSON.stringify(s)); }catch(e){} nf36vSetupPaint(); }
function nf37vSteps(A){
  const b = NF36V_BRAND[A.brand], strict = NF36V_STRICT.includes(A.brand), autoBrand = b && b.auto;
  return [
    {k: 'notif', title: 'Let Nifti see your Viber messages', sub: 'Tap the button, find <b>Nifti</b> in the list and switch it on. Nifti only reads Viber, like a smartwatch does.' + (A.restrictedSettings ? '<br><small class="nf37v-tip">If Android says "Restricted setting": tap <b>App info</b> below, then ⋮ at the top right, then <b>Allow restricted settings</b>, and try again.</small>' : ''),
      done: !!A.notif, btns: [['Turn on', "NiftiAndroid.open('notif')"], A.restrictedSettings ? ['App info', "NiftiAndroid.open('appinfo')", 1] : null]},
    {k: 'perms', title: 'Allow alerts, photos and contacts', sub: 'Three quick "Allow" taps. Nifti can then alert you, bring in Viber photos, and recognise customers by their saved number.',
      done: !!(A.alerts && A.photos && A.contacts), btns: [['Allow', "NiftiAndroid.open('perms')"]]},
    {k: 'battery', title: strict ? `Keep Nifti running on your ${b ? b.name.split(',')[0] : 'phone'}` : 'Keep Nifti running', sub: strict ? `${b ? b.name.split(',')[0] : 'This phone'} switches apps off to save battery, which would stop messages coming in. ${nf36vEsc(b ? b.battery : '')}${autoBrand ? ' Then ' + nf36vEsc(b.auto.charAt(0).toLowerCase() + b.auto.slice(1)) : ''}` : 'So the phone never switches Nifti off in the background.',
      done: !!A.battery && (!autoBrand || !!A.autostartDone), btns: [['Battery', "NiftiAndroid.open('battery')"], autoBrand ? ['Autostart', "NiftiAndroid.open('autostart')"] : null]},
    {k: 'screen', title: 'Catch messages in the chat you have open', sub: 'Viber shows no notification for the chat that\'s open on your screen. Turn on <b>Nifti: open Viber chats</b> so those come in too.',
      done: !!A.screen, opt: true, btns: [['Turn on', "NiftiAndroid.open('screen')"]]},
    {k: 'viber', title: 'Two switches in Viber', sub: 'In Viber: <b>More → Settings → Notifications</b>: Show message preview on. <b>More → Settings → Media</b>: Save to gallery and Auto-download on. Now every message and photo comes in by itself.',
      done: !A.previewOff && !!A.viberPhotos, opt: true, btns: [['Open Viber', "NiftiAndroid.open('viber')"]]},
  ];
}
(function(){
  const base = nf36vSetupPaint;
  nf36vSetupPaint = function(open){
    if(!open && !document.getElementById('nf36vSetup')) return;
    const A = nf36vAndroid();
    if(nf36vPlatform() !== 'app' || !A) return base.apply(this, arguments);
    const steps = nf37vSteps(A), sk = nf37vSkipped(), cur = steps.find(s => !s.done && !(s.opt && sk[s.k])), n = steps.findIndex(s => s === cur);
    const doneCount = steps.filter(s => s.done || (s.opt && sk[s.k])).length;
    let body;
    if(!A.connected) body = `<div class="nf36v-hero">${NF36V_IC.phone}<span><b>Connecting this phone…</b><small>One moment.</small></span></div><button type="button" class="btn btn-primary nf36v-wide" onclick="nf36vRegister(true).then(()=>nf36vSetupPaint())">Connect this phone</button>`;
    else if(!cur) body = `<div class="nf37v-done">${NF36V_IC.ok}<b>All set</b><span>Every Viber message, photo and file now comes into Nifti by itself, and your replies go out from this phone.</span></div>
      <p class="nf36v-p"><b>Try it:</b> ask someone to send you a Viber message. It appears in Messages within seconds.</p>${nf36vDevicesHtml()}
      <button type="button" class="nf36v-link" onclick="if(confirm('Disconnect this phone? Viber stops coming into Nifti from it.')){ nf36vDisconnect(); }">Disconnect this phone</button>`;
    else body = `<div class="nf37v-prog"><span style="width:${Math.round(doneCount / steps.length * 100)}%"></span></div><p class="nf37v-stepn">Step ${n + 1} of ${steps.length}</p>
      <div class="nf37v-step"><h3>${cur.title}</h3><p>${cur.sub}</p>
        <div class="nf37v-sb">${cur.btns.filter(Boolean).map(([l, js, ghost]) => `<button type="button" class="${ghost ? 'btn btn-outline' : 'btn btn-primary'}" onclick="${js}">${l}</button>`).join('')}${cur.opt ? `<button type="button" class="nf37v-skip" onclick="nf37vSkip('${cur.k}')">Later</button>` : ''}</div>
        <small class="nf37v-auto">Come back to Nifti when it's done. This moves to the next step by itself.</small></div>
      <ol class="nf37v-list">${steps.map((s, i) => `<li class="${s.done ? 'ok' : s === cur ? 'now' : sk[s.k] && s.opt ? 'later' : ''}">${s.done ? NF36V_IC.ok : `<em>${i + 1}</em>`}<span>${s.title}</span></li>`).join('')}</ol>`;
    const el = document.getElementById('nf36vSetup');
    if(el && el.querySelector('.nf36v-setup')) el.querySelector('.nf36v-setup').innerHTML = body;
    else slModal('nf36vSetup', `<div class="sl-sheet-h"><b>Connect Viber</b><button class="sl-x" onclick="slClose('nf36vSetup')" aria-label="Close">✕</button></div><div class="nf36v-setup">${body}</div>`);
  };
})();

// ---- Get the Nifti app (phone browsers) ----
const NF37_PLAY_URL = ''; // the Play Store link goes here once Nifti is listed; until then the direct download is used
function nf37AppBanner(page){
  if(!page || page.id !== 'page-dashboard') return;
  const plat = nf36vPlatform(), standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  const old = page.querySelector('.nf37-app');
  let hideUntil = 0; try{ hideUntil = +localStorage.getItem('nifti-app-banner') || 0; }catch(e){}
  if(plat === 'iphone'){ // Home already has an "Add to Home Screen" card on iPhone: give it a picture guide
    const card = [...page.querySelectorAll('div, section')].find(x => x.children.length < 8 && /Add to Home Screen/.test(x.textContent || '') && !x.closest('.nf37-app') && x.querySelector('button, a'));
    if(card && !card.querySelector('.nf37-howto')){ const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'btn btn-primary nf37-howto'; bt.textContent = 'Show me how'; bt.onclick = nf37IosSheet; const nn = [...card.querySelectorAll('button, a')].find(x => /not now/i.test(x.textContent)); (nn ? nn.parentElement : card).insertBefore(bt, nn || null); }
    if(old) old.remove(); return;
  }
  if(plat !== 'android' || Date.now() < hideUntil){ if(old) old.remove(); return; }
  if(old) return;
  const box = document.createElement('div'); box.className = 'nf37-app';
  box.innerHTML = plat === 'android'
    ? `<img src="icon-192.png" alt="" width="44" height="44"><span><b>Get the Nifti app</b><small>Your Nifti icon on the home screen, instant alerts, and your Viber chats inside Nifti.</small></span><a class="btn btn-primary" href="${NF37_PLAY_URL || NF36V_APK}" ${NF37_PLAY_URL ? 'target="_blank" rel="noopener"' : 'download'} onclick="nf37AppHelp()">Get the app</a><button type="button" class="nf37-app-x" aria-label="Not now" onclick="nf37AppHide(this)">✕</button>`
    : `<img src="apple-touch-icon.png" alt="" width="44" height="44"><span><b>Put Nifti on your home screen</b><small>It opens like an app, with its own icon and alerts.</small></span><button type="button" class="btn btn-primary" onclick="nf37IosSheet()">Show me</button><button type="button" class="nf37-app-x" aria-label="Not now" onclick="nf37AppHide(this)">✕</button>`;
  const head = page.querySelector('.page-head'); if(head && head.parentElement === page) head.after(box); else page.prepend(box);
}
function nf37AppHide(btn){ try{ localStorage.setItem('nifti-app-banner', String(Date.now() + 7 * 864e5)); }catch(e){} const b = btn.closest('.nf37-app'); if(b) b.remove(); }
function nf37AppHelp(){ if(NF37_PLAY_URL) return; setTimeout(() => slModal('nf37AppH', `<div class="sl-sheet-h"><b>Installing Nifti</b><button class="sl-x" onclick="slClose('nf37AppH')" aria-label="Close">✕</button></div>
  <ol class="nf36v-ol"><li>When the download finishes, tap <b>Open</b>.</li><li>If your phone asks, tap <b>Settings</b> and allow installing from your browser, then go back.</li><li>Tap <b>Install</b>, then <b>Open</b>, and sign in. That's it.</li></ol>
  <p class="nf36v-p">Your phone asks this for any app that isn't from the Play Store. Nifti will be on the Play Store soon, then it's one tap.</p>`), 600); }
function nf37IosSheet(){
  slModal('nf37Ios', `<div class="sl-sheet-h"><b>Nifti on your home screen</b><button class="sl-x" onclick="slClose('nf37Ios')" aria-label="Close">✕</button></div>
    <ol class="nf37-ios"><li><span class="nf37-ios-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg></span><span>Tap <b>Share</b> at the bottom of Safari.</span></li>
      <li><span class="nf37-ios-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg></span><span>Scroll down and tap <b>Add to Home Screen</b>.</span></li>
      <li><span class="nf37-ios-ic"><img src="icon-192.png" alt="" width="28" height="28"></span><span>Tap <b>Add</b>. Open Nifti from its new icon from now on, and allow alerts when asked.</span></li></ol>`);
}
(function(){
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ nf37AppBanner(page); }catch(e){} };
  window.nf26AfterPass = nf26AfterPass;
  // inside the app: say when a newer version is ready (Play Store updates by itself once listed)
  setTimeout(async () => { try{ const A = nf36vAndroid(); if(!A) return; const r = await fetch('app/version.json', {cache: 'no-store'}); const v = await r.json();
    if(v.versionCode > (A.versionCode || 0)) showToast('A newer Nifti app is ready. Tap here to update.', 'info'), document.addEventListener('click', function once(e){ if(e.target.closest && e.target.closest('.app-toast, .toast')){ location.href = v.url; document.removeEventListener('click', once); } }); }catch(e){} }, 6000);
})();
