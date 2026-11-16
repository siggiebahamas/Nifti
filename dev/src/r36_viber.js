/* ===== Round 36: Viber on your own number, inside Nifti =====
   Android (main way): the Nifti app on the phone reads Viber's notifications (and the chat you have open),
   sends them here, and sends replies typed in Nifti out from that phone's Viber.
   iPhone / computer (option A): reply = Nifti copies your words and opens their Viber chat; bring a message in by pasting it.
   Chats the phone picks up stay private to that person until they say who it is (customer or supplier) or hide it. */
const NF36V = {threads: [], msgs: {}, devices: [], vc: {}, ver: 0, since: null, seeded: false, route: {}, sig: {}, urls: {}, seenIssues: null, tick: 0, regTried: false, loading: false};
const NF36V_APK = 'https://siggiebahamas.github.io/Nifti/app/nifti.apk';
const NF36V_STRICT = ['xiaomi', 'oppo', 'vivo', 'transsion', 'huawei', 'samsung'];
const NF36V_IC = {
  viber: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c5 0 8.5 2.6 8.5 7.4 0 4.6-3.4 7.3-8.3 7.3-.8 0-1.5 0-2.2-.2L6.5 20v-3.2C4.4 15.6 3.5 13.4 3.5 10.4 3.5 5.6 7 3 12 3z"/><path d="M9 8.5c.3 2.6 2.4 4.8 5 5.2"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17.5v.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
};

// ---------- small helpers ----------
function nf36vIsoDate(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function nf36vToday(){ return myBusiness ? nf36vIsoDate(new Date()) : APP_TODAY; }
// the sample business lives on its own day; its clock starts at 3 PM so new messages land after the sample ones
function nf36vNowIso(){ if(myBusiness) return new Date().toISOString(); NF36V.dclock = (NF36V.dclock || 0) + 60000; return new Date(new Date(APP_TODAY + 'T15:00:00').getTime() + NF36V.dclock).toISOString(); }
function nf36vWhen(iso){
  const d = new Date(iso); if(isNaN(d)) return '';
  const t = d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}), day = nf36vIsoDate(d);
  return (day === nf36vToday() ? 'Today' : d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})) + ', ' + t;
}
function nf36vAgo(iso){
  const d = new Date(iso); if(!iso || isNaN(d)) return 'never';
  const now = myBusiness ? Date.now() : new Date(APP_TODAY + 'T15:00:00').getTime() + (NF36V.dclock || 0), m = Math.max(0, Math.round((now - d.getTime()) / 60000));
  if(m < 1) return 'just now'; if(m < 60) return m + ' min ago'; const h = Math.round(m / 60); if(h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago'); const dd = Math.round(h / 24); return dd + (dd === 1 ? ' day ago' : ' days ago');
}
function nf36vMins(iso){ const d = new Date(iso); return isNaN(d) ? 1e9 : ((myBusiness ? Date.now() : new Date(APP_TODAY + 'T15:00:00').getTime()) - d.getTime()) / 60000; }
function nf36vIni(name){ try{ return nfInitials(name); }catch(e){ return String(name || '?').slice(0, 2).toUpperCase(); } }
function nf36vEsc(s){ return escapeHtml(String(s == null ? '' : s)); }
function nf36vSafe(s){ return String(s == null ? '' : s).replace(/[<>`]/g, c => c === '<' ? '‹' : c === '>' ? '›' : "'").replace(/"/g, '”'); }
function nf36vLinkify(html){ return html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); }
function nf36vKindSide(k){ return k === 'supplier' ? 'buyer' : 'supplier'; }   // a customer chat is one where I'm the supplier
function nf36vSideKind(side){ return side === 'buyer' ? 'supplier' : 'customer'; }
function nf36vAndroid(){ if(!window.NiftiAndroid) return null; try{ return JSON.parse(window.NiftiAndroid.info() || '{}'); }catch(e){ return null; } }
function nf36vPlatform(){ const ua = navigator.userAgent || ''; if(window.NiftiAndroid) return 'app'; if(/android/i.test(ua)) return 'android'; if(/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'iphone'; return 'computer'; }
function nf36vMeId(){ try{ return (nifitAuthSession && nifitAuthSession.user && nifitAuthSession.user.id) || (myTeamMember && myTeamMember.auth_user_id) || null; }catch(e){ return null; } }
function nf36vMeName(){ return (myTeamMember && myTeamMember.name) || 'You'; }
const NF36V_ALL = allConversations;

// ---------- demo (sample business, nothing saved) ----------
function nf36vSeed(){
  if(NF36V.seeded || myBusiness) return; NF36V.seeded = true;
  const cus = supplierConversations[0], sup = buyerConversations[0], T = APP_TODAY, Y = addDaysIso(APP_TODAY, -1);
  const at = (d, hm) => new Date(d + 'T' + hm + ':00').toISOString();
  const dev = {id: 'dv1', user_id: 'me', user_name: 'You', name: "Owner's Redmi Note 13", brand: 'xiaomi', model: 'Redmi Note 13', flags: {notif: true, listener: true, screen: true, battery: false, photos: true, alerts: true, brand: 'xiaomi', previewOff: false}, last_seen_at: at(T, '14:58')};
  NF36V.devices = [dev];
  const th = [];
  if(cus) th.push({id: 'vt1', title: cus.name, status: 'linked', party_kind: 'customer', party_id: cus.id, party_name: cus.name, owner_user_id: 'me', owner_name: 'You', device_id: 'dv1', unread: 1, last_at: at(T, '13:12')});
  if(sup) th.push({id: 'vt2', title: sup.name, status: 'linked', party_kind: 'supplier', party_id: sup.id, party_name: sup.name, owner_user_id: 'me', owner_name: 'You', device_id: 'dv1', unread: 0, last_at: at(T, '11:40')});
  th.push({id: 'vt3', title: 'Aling Nena Sari-Sari', status: 'linked', party_kind: 'customer', party_id: null, party_name: 'Aling Nena Sari-Sari', owner_user_id: 'me', owner_name: 'You', device_id: 'dv1', unread: 2, last_at: at(T, '14:20')});
  th.push({id: 'vt4', title: 'Kuya Ben Hardware', status: 'new', owner_user_id: 'me', owner_name: 'You', device_id: 'dv1', unread: 1, last_at: at(T, '14:41'), last_text: 'Magkano po ang 1/2 plywood? 30 pcs sana'});
  NF36V.threads = th;
  const M = (tid, dir, body, kind, when, extra) => Object.assign({id: 'vm' + Math.random().toString(36).slice(2, 9), thread_id: tid, dir, body, kind: kind || 'text', at: when, media_status: 'none', status: dir === 'out' ? 'sent' : 'done', source: dir === 'out' ? 'nifti' : 'notif', ack: false}, extra || {});
  const dr = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="250"><rect width="360" height="250" fill="#FFFDF5"/><rect x="18" y="16" width="324" height="218" rx="6" fill="#fff" stroke="#D0D5DD"/><text x="34" y="48" font-family="Arial" font-size="17" font-weight="700" fill="#0B0F14">DELIVERY RECEIPT  No. 0412</text><text x="34" y="78" font-family="Arial" font-size="13" fill="#0B0F14">Received in good condition:</text><text x="34" y="106" font-family="Arial" font-size="13" fill="#0B0F14">20 bags Portland cement</text><text x="34" y="128" font-family="Arial" font-size="13" fill="#0B0F14">10 pcs deformed bar 10mm</text><path d="M200 200c20-24 40 10 60-12s30 6 50-4" stroke="#1D4ED8" stroke-width="2" fill="none"/><text x="34" y="210" font-family="Arial" font-size="12" fill="#0B0F14">Signature over printed name</text></svg>');
  NF36V.msgs = {
    vt1: [M('vt1', 'in', 'Pwede po pa-deliver bukas yung 20 bags na semento? Same price pa rin po ba?', 'text', at(Y, '16:05')),
      M('vt1', 'out', 'Opo, bukas ng umaga. Same price po, ₱265 per bag.', 'text', at(Y, '16:20')),
      M('vt1', 'in', 'Ito po yung pirmadong DR kahapon', 'photo', at(T, '09:02'), {media_status: 'ok', media_name: 'DR-0412.jpg', _url: dr}),
      M('vt1', 'in', '', 'photo', at(T, '13:12'), {media_status: 'missing', media_name: 'Photo'})],
    vt2: [M('vt2', 'in', 'Price update po: angle bar 1.5mm ₱385 na simula Lunes.', 'text', at(T, '11:31')),
      M('vt2', 'out', 'Noted po, salamat. Pa-reserve po ng 40 pcs sa lumang presyo kung kaya pa.', 'text', at(T, '11:40'), {status: 'failed', fail_reason: "Viber's reply button for this chat had closed, so it couldn't be sent from the phone automatically"})],
    vt3: [M('vt3', 'in', 'Good afternoon po! May stock pa po ba kayo ng Lucky Me pancit canton? 5 boxes po sana', 'text', at(T, '14:12')),
      M('vt3', 'in', 'SOA_October.pdf', 'file', at(T, '14:20'), {body: '', media_status: 'ok', media_name: 'SOA_October.pdf', media_size: 182000, _url: 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbXS9Db3VudCAwPj4KZW5kb2JqCnRyYWlsZXIKPDwvUm9vdCAxIDAgUj4+CiUlRU9GCg=='})],
    vt4: [M('vt4', 'in', 'Magkano po ang 1/2 plywood? 30 pcs sana', 'text', at(T, '14:41'))],
  };
  NF36V.ver++;
}

// ---------- which chats belong where ----------
function nf36vConvFor(t){
  if(!t || t.status !== 'linked' || !t.party_id) return null;
  return NF36V_ALL().find(c => c.id === t.party_id && convSide(c) === nf36vKindSide(t.party_kind)) || null;
}
function nf36vLinkedFor(conv){
  if(!conv) return [];
  if(conv._vb){ const t = NF36V.threads.find(x => x.id === conv._vb); return t ? [t] : []; }
  const kind = nf36vSideKind(convSide(conv));
  return NF36V.threads.filter(t => t.status === 'linked' && t.party_id === conv.id && (t.party_kind || 'customer') === kind)
    .sort((a, b) => String(b.last_at || '').localeCompare(String(a.last_at || '')));
}
function nf36vAppMsg(m, t){
  const d = new Date(m.at);
  const plain = m.body || (m.kind === 'photo' ? 'Photo' : m.kind === 'video' ? 'Video' : m.kind === 'file' ? (m.media_name || 'File') : m.kind === 'voice' ? 'Voice message' : m.kind === 'sticker' ? 'Sticker' : '');
  return {id: 'vb:' + m.id, from: m.dir === 'out' ? 'me' : 'them', text: nf36vSafe(plain), time: nf36vWhen(m.at), date: isNaN(d) ? '' : nf36vIsoDate(d), vb: m, vbt: t, _ts: isNaN(d) ? 0 : d.getTime()};
}
function nf36vMsgsOf(t){ return (NF36V.msgs[t.id] || []).slice().sort((a, b) => String(a.at).localeCompare(String(b.at))); }
function nf36vTs(m){
  if(m._ts) return m._ts;
  const t = String(m.time || ''), d = m.date || (/^today|just now/i.test(t) ? nf36vToday() : '');
  if(/just now/i.test(t)) return Date.now();
  const h = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i); let mins = 0;
  if(h) mins = (Number(h[1]) % 12) * 60 + Number(h[2]) + (/pm/i.test(h[3]) ? 720 : 0);
  const base = d ? new Date(d + 'T00:00:00').getTime() : 0;
  return base + mins * 60000;
}
// one conversation's messages from Nifti and Viber, in time order
function nf36vMerged(conv, ths){
  const vbm = []; ths.forEach(t => nf36vMsgsOf(t).forEach(m => vbm.push(nf36vAppMsg(m, t))));
  if(conv._vb) return vbm;
  const all = conv.messages.map((m, i) => ({m, k: nf36vTs(m), i})).concat(vbm.map((m, i) => ({m, k: m._ts, i: 1e6 + i})));
  all.sort((a, b) => (a.k - b.k) || (a.i - b.i));
  return all.map(x => x.m);
}
function nf36vVirtuals(){
  const out = [];
  NF36V.threads.forEach(t => {
    if(t.status !== 'linked' || nf36vConvFor(t)) return;
    const id = 'vb_' + t.id; let c = NF36V.vc[id];
    if(!c){ c = NF36V.vc[id] = {id, _vb: t.id}; }
    c.name = nf36vSafe(t.party_name || t.title); c.initials = nf36vIni(c.name).replace(/[^A-Za-z0-9]/g, '') || '?'; c.side = nf36vKindSide(t.party_kind || 'customer');
    if(c._ver !== NF36V.ver){ c.messages = nf36vMsgsOf(t).map(m => nf36vAppMsg(m, t)); c._ver = NF36V.ver; }
    c.unread = t.unread || 0; out.push(c);
  });
  return out;
}
function nf36vListConv(c){
  if(!c || c._vb) return c;
  const ths = nf36vLinkedFor(c); if(!ths.length) return c;
  const extra = ths.reduce((s, t) => s + (t.unread || 0), 0);
  return Object.assign({}, c, {messages: nf36vMerged(c, ths), unread: (c.unread || 0) + extra});
}
function nf36vNewThreads(){ const me = nf36vMeId() || 'me'; return NF36V.threads.filter(t => t.status === 'new' && (!myBusiness || t.owner_user_id === me)); }
function nf36vLiveDevice(t){
  const d = NF36V.devices.find(x => x.id === t.device_id && !x.revoked_at);
  return d && nf36vMins(d.last_seen_at) < 24 * 60 ? d : null;
}

// ---------- problems to show right away ----------
function nf36vIssues(){
  const out = [];
  NF36V.threads.forEach(t => {
    if(t.status === 'ignored') return;
    (NF36V.msgs[t.id] || []).forEach(m => {
      if(m.ack) return;
      if(m.dir === 'in' && m.media_status === 'missing') out.push({id: 'm' + m.id, kind: 'missing', t, m, text: (m.kind === 'photo' ? 'A photo' : m.kind === 'video' ? 'A video' : (m.media_name || 'A file')) + ' from ' + (t.party_name || t.title) + " didn't come through"});
      if(m.dir === 'out' && m.status === 'failed') out.push({id: 'f' + m.id, kind: 'failed', t, m, text: 'Your reply to ' + (t.party_name || t.title) + " wasn't sent"});
    });
  });
  NF36V.devices.forEach(d => {
    if(d.revoked_at) return; const f = d.flags || {}, who = d.name || 'A phone';
    if(nf36vMins(d.last_seen_at) > 45) out.push({id: 'o' + d.id, kind: 'offline', d, text: who + ' last checked in ' + nf36vAgo(d.last_seen_at) + '. Viber messages may be waiting on it.'});
    else if(f.notif === false) out.push({id: 'n' + d.id, kind: 'access', d, text: who + ": notification access is off, so Viber can't come in."});
    else if(f.previewOff) out.push({id: 'p' + d.id, kind: 'preview', d, text: who + ': Viber is hiding message text. Turn on "Show message preview" in Viber.'});
  });
  return out;
}
function nf36vBadgeExtra(){
  let n = nf36vNewThreads().length;
  NF36V.threads.forEach(t => { if(t.status === 'linked' && nf36vConvFor(t)) n += (t.unread || 0) > 0 ? 1 : 0; });
  n += nf36vIssues().filter(i => i.kind === 'missing' || i.kind === 'failed').length;
  return n;
}

// ---------- the bubble ----------
function nf36vBubble(m, t){
  const from = t && t.is_group && m.dir === 'in' && m.sender ? `<b class="nf36v-from">${nf36vEsc(m.sender)}</b>` : '';
  const body = m.body ? `<span class="nf36v-tx">${nf36vLinkify(nf36vEsc(m.body))}</span>` : '';
  let media = '';
  if(m.kind === 'photo' || m.kind === 'video' || m.kind === 'file'){
    const label = m.kind === 'photo' ? 'photo' : m.kind === 'video' ? 'video' : 'file';
    if(m.media_status === 'ok'){
      const url = m._url || '';
      if(m.kind === 'photo') media = `<button type="button" class="nf36v-img" data-vbp="${nf36vEsc(m.media_path || '')}" data-vbn="${nf36vEsc(m.media_name || 'photo.jpg')}" onclick="nf36vOpen(this)"><img alt="Photo from Viber" ${url ? `src="${nf36vEsc(url)}"` : ''} loading="lazy"></button>`;
      else media = `<button type="button" class="msg-attachment nf36v-file" data-vbp="${nf36vEsc(m.media_path || '')}" data-vbn="${nf36vEsc(m.media_name || 'file')}" ${url ? `data-vbu="${nf36vEsc(url)}"` : ''} onclick="nf36vOpen(this)">${ATTACHMENT_ICON_SVG}<span><b>${nf36vEsc(m.media_name || 'File')}</b><small>${m.media_size ? Math.max(1, Math.round(m.media_size / 1024)) + ' KB · ' : ''}tap to open</small></span></button>`;
    } else if(m.media_status === 'missing' && !m.ack){
      media = `<span class="nf36v-miss">${NF36V_IC.warn}<span><b>This ${label} didn't come through</b><small>On the phone: open the Viber chat, hold the ${label}, tap Share, then Nifti. Or add it here.</small>
        <span class="nf36v-acts"><label class="nf36v-btn">Add it here<input type="file" ${m.kind === 'photo' ? 'accept="image/*"' : m.kind === 'video' ? 'accept="video/*"' : ''} onchange="nf36vFill('${m.id}', this)" hidden></label><button type="button" class="nf36v-btn ghost" onclick="nf36vAck('${m.id}')">Dismiss</button></span></span></span>`;
    } else if(m.media_status === 'missing'){
      media = `<span class="nf36v-gone">${label[0].toUpperCase() + label.slice(1)} is only on the phone</span>`;
    } else if(m.media_status === 'waiting'){
      media = `<span class="nf36v-wait">${NF36V_IC.clock}Getting the ${label} from the phone…</span>`;
    }
  } else if(m.kind === 'voice') media = `<span class="nf36v-gone">Voice message · play it in Viber</span>`;
  else if(m.kind === 'sticker') media = `<span class="nf36v-gone">Sticker</span>`;
  let st = '';
  if(m.dir === 'out'){
    if(m.status === 'queued' || m.status === 'sending') st = `<span class="nf36v-st q">${NF36V_IC.clock}Sending from ${nf36vEsc(nf36vOwnerPhone(t))}…</span>`;
    else if(m.status === 'failed' && !m.ack) st = `<span class="nf36v-miss">${NF36V_IC.warn}<span><b>Not sent</b><small>${nf36vEsc(m.fail_reason || 'The phone could not send it.')}</small>
      <span class="nf36v-acts"><button type="button" class="nf36v-btn" onclick="nf36vRetry('${m.id}')">Try again</button><button type="button" class="nf36v-btn" onclick="nf36vManual('${m.id}')">Send from my phone</button><button type="button" class="nf36v-btn ghost" onclick="nf36vAck('${m.id}', true)">It was sent</button></span></span></span>`;
    else if(m.status === 'failed') st = `<span class="nf36v-st">Marked as sent</span>`;
    else if(m.source === 'manual') st = `<span class="nf36v-st">Copied for Viber · you send it</span>`;
    else if(m.source === 'notif' || m.source === 'screen') st = `<span class="nf36v-st ok">${NF36V_IC.ok}Sent from Viber</span>`;
    else st = `<span class="nf36v-st ok">${NF36V_IC.ok}Sent on Viber</span>`;
  }
  return `<span class="nf36v-b" data-vb="${nf36vEsc(m.id)}">${from}${body}${media}${st}<span class="nf36v-chip">${NF36V_IC.viber}Viber</span></span>`;
}
function nf36vOwnerPhone(t){ const d = t && NF36V.devices.find(x => x.id === t.device_id); if(!d) return 'the phone'; const me = nf36vMeId() || 'me'; return d.user_id === me ? 'your phone' : ((d.user_name || 'their').split(' ')[0] + "'s phone"); }

// ---------- open photos and files ----------
async function nf36vUrl(path){
  if(!path) return '';
  const c = NF36V.urls[path]; if(c && c.exp > Date.now()) return c.u;
  const { data, error } = await sb.storage.from('viber-media').createSignedUrl(path, 3600); if(error) throw error;
  NF36V.urls[path] = {u: data.signedUrl, exp: Date.now() + 3300000}; return data.signedUrl;
}
async function nf36vHydrate(){
  if(!myBusiness) return;
  const imgs = [...document.querySelectorAll('#threadBody .nf36v-img img:not([src])')];
  for(const img of imgs){ const p = img.parentElement.dataset.vbp; if(!p) continue; try{ img.src = await nf36vUrl(p); }catch(e){} }
}
async function nf36vOpen(el){
  try{ const u = el.dataset.vbu || (el.querySelector('img') && el.querySelector('img').getAttribute('src')) || await nf36vUrl(el.dataset.vbp); if(u) window.open(u, '_blank', 'noopener'); }
  catch(e){ showToast("Couldn't open that file. Try again in a moment."); }
}

// ---------- thread view ----------
function nf36vRoute(conv, ths){
  if(conv._vb) return 'viber';
  const r = NF36V.route[conv.id]; if(r) return r;
  const merged = nf36vMerged(conv, ths), lastThem = [...merged].reverse().find(m => m.from === 'them');
  return lastThem && lastThem.vb ? 'viber' : 'nifti';
}
function nf36vSetRoute(id, r){ NF36V.route[id] = r; const c = getActiveConv(); if(c) nf36vBar(c, nf36vLinkedFor(c)); }
function nf36vBar(conv, ths){
  const input = document.getElementById('msgInput'); if(!input) return;
  const host = input.closest('.msg-composer, .thread-composer, .composer, .msg-input-row') || input.parentElement;
  let bar = document.getElementById('nf36vBar');
  if(!conv || !ths || !ths.length){ if(bar) bar.remove(); input.placeholder = input.dataset.nf36p || input.placeholder; return; }
  if(!bar){ bar = document.createElement('div'); bar.id = 'nf36vBar'; bar.className = 'nf36v-bar'; host.parentElement.insertBefore(bar, host); }
  if(!input.dataset.nf36p) input.dataset.nf36p = input.placeholder || 'Type a message';
  const route = nf36vRoute(conv, ths), t = ths[0], live = nf36vLiveDevice(t);
  const how = route !== 'viber' ? 'Goes to their Nifti inbox.' : live ? `Goes out on Viber from ${nf36vEsc(nf36vOwnerPhone(t))}, as if you typed it there.` : 'Tap Send: Nifti copies it and opens their Viber chat. Paste and send.';
  bar.innerHTML = `${conv._vb ? `<span class="nf36v-on">${NF36V_IC.viber}Viber</span>` : `<span class="nf36v-seg" role="group" aria-label="Send on"><button type="button" class="${route === 'nifti' ? 'on' : ''}" onclick="nf36vSetRoute('${conv.id}','nifti')">Nifti</button><button type="button" class="${route === 'viber' ? 'on' : ''}" onclick="nf36vSetRoute('${conv.id}','viber')">${NF36V_IC.viber}Viber</button></span>`}
    <small>${how}</small><button type="button" class="nf36v-add" onclick="nf36vAddSheet()">+ Add a Viber message</button>`;
  input.placeholder = route === 'viber' ? 'Message on Viber' : input.dataset.nf36p;
}
function nf36vSigOf(list){ return list.map(m => m.id + (m.vb ? m.vb.status + m.vb.media_status + (m.vb.ack ? 1 : 0) + (m.vb.media_path || '') : '')).join('|'); }

// ---------- sending ----------
function nf36vPhoneFor(t, conv){
  const pid = (conv && !conv._vb && conv.id) || t.party_id || ('vb_' + t.id);
  try{ const p = nf33RPref(pid); if(p && p.phone) return nf33RPhone(p.phone); }catch(e){}
  return t.phone ? String(t.phone).replace(/[^\d]/g, '') : '';
}
async function nf36vOptionA(t, text, conv){
  const ph = nf36vPhoneFor(t, conv);
  if(window.NiftiAndroid){ try{ window.NiftiAndroid.viber(ph ? '+' + ph : '', text); return; }catch(e){} }
  let copied = false; try{ copied = await nf33RCopy(text); }catch(e){}
  showToast(copied ? 'Copied. Paste it in Viber and tap send.' : 'Open Viber and type it there.');
  setTimeout(() => { try{ location.href = ph ? 'viber://chat?number=%2B' + ph : 'viber://forward?text=' + encodeURIComponent(text); }catch(e){} }, 250);
}
async function nf36vSend(t, text, conv){
  const live = nf36vLiveDevice(t), manual = !live;
  const row = {id: 'tmp' + Date.now(), thread_id: t.id, dir: 'out', body: text, kind: 'text', status: manual ? 'sent' : 'queued', source: manual ? 'manual' : 'nifti', at: nf36vNowIso(), media_status: 'none', by_name: nf36vMeName(), ack: false};
  (NF36V.msgs[t.id] = NF36V.msgs[t.id] || []).push(row); t.last_at = row.at; t.last_text = text;
  nf36vChanged();
  if(manual) nf36vOptionA(t, text, conv);
  if(myBusiness){
    const { data, error } = await sb.rpc('viber_send', {p_thread: t.id, p_text: text, p_manual: manual});
    if(error){ row.status = 'failed'; row.fail_reason = "Couldn't save it: " + (error.message || 'no connection') + '. Try again.'; }
    else Object.assign(row, data);
    nf36vChanged();
  } else if(!manual){
    setTimeout(() => { row.status = 'sent'; nf36vChanged(); }, 2200);
  }
}
function nf36vFindMsg(id){ for(const tid in NF36V.msgs){ const m = NF36V.msgs[tid].find(x => x.id === id); if(m) return {m, t: NF36V.threads.find(x => x.id === tid)}; } return {}; }
async function nf36vRetry(id){
  const {m} = nf36vFindMsg(id); if(!m) return;
  m.status = 'queued'; m.fail_reason = null; nf36vChanged();
  if(myBusiness){ const { error } = await sb.rpc('viber_retry', {p_msg: id, p_manual: false}); if(error){ m.status = 'failed'; m.fail_reason = error.message; } nf36vChanged(); }
  else setTimeout(() => { m.status = 'sent'; m.source = 'nifti'; nf36vChanged(); }, 2000);
}
async function nf36vManual(id){
  const {m, t} = nf36vFindMsg(id); if(!m) return;
  nf36vOptionA(t, m.body, getActiveConv());
  m.status = 'sent'; m.source = 'manual'; nf36vChanged();
  if(myBusiness) await sb.rpc('viber_retry', {p_msg: id, p_manual: true});
}
async function nf36vAck(id, sent){
  const {m} = nf36vFindMsg(id); if(!m) return;
  m.ack = true; if(sent && m.status === 'failed'){ m.status = 'sent'; m.source = 'manual'; }
  nf36vChanged();
  if(myBusiness){ if(sent) await sb.rpc('viber_retry', {p_msg: id, p_manual: true}); else await sb.rpc('viber_ack', {p_msg: id}); }
}
async function nf36vFill(id, input){
  const f = input.files && input.files[0]; if(!f) return;
  const {m} = nf36vFindMsg(id); if(!m) return;
  if(f.size > 25 * 1024 * 1024) return showToast('That file is over 25 MB. Pick a smaller one.');
  if(!myBusiness){ m._url = URL.createObjectURL(f); m.media_status = 'ok'; m.media_name = f.name; m.media_size = f.size; nf36vChanged(); return showToast('Added ✓'); }
  const path = `${m.business_id}/${m.thread_id}/${m.id}-${f.name.replace(/[^\w.\-]+/g, '_').slice(-80)}`;
  showToast('Adding…');
  const up = await sb.storage.from('viber-media').upload(path, f, {contentType: f.type || 'application/octet-stream', upsert: true});
  if(up.error) return showToast("Couldn't add it: " + up.error.message);
  const { error } = await sb.rpc('viber_media_set', {p_msg: id, p_path: path, p_name: f.name, p_mime: f.type || '', p_size: f.size});
  if(error) return showToast("Couldn't add it: " + error.message);
  Object.assign(m, {media_path: path, media_name: f.name, media_status: 'ok', media_size: f.size, ack: false}); nf36vChanged(); showToast('Added ✓');
}

// ---------- option A: bring a Viber message in by hand ----------
function nf36vAddSheet(){
  const conv = getActiveConv(); if(!conv) return;
  slModal('nf36vAdd', `<div class="sl-sheet-h"><b>Add a Viber message</b><button class="sl-x" onclick="slClose('nf36vAdd')" aria-label="Close">✕</button></div>
    <div class="nf36v-form">
      <p class="nf36v-p">For phones Nifti can't read (iPhone) or anything that didn't come in. In Viber, hold the message, tap Copy, then paste it here.</p>
      <span class="nf36v-seg wide" role="group" aria-label="Who sent it"><button type="button" class="on" data-dir="in" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b===this))">${nf36vEsc(conv.name)} sent it</button><button type="button" data-dir="out" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b===this))">I sent it</button></span>
      <label class="nf36v-f"><span>The message</span><textarea id="nf36vAddText" rows="4" placeholder="Paste or type it here"></textarea></label>
      <label class="nf36v-f"><span>Photo or file (optional)</span><input id="nf36vAddFile" type="file"></label>
      <button type="button" class="btn btn-primary" onclick="nf36vAddSave()">Add to this chat</button>
    </div>`);
  setTimeout(() => { const ta = document.getElementById('nf36vAddText'); if(ta) ta.focus(); }, 60);
}
async function nf36vAddSave(){
  const conv = getActiveConv(); if(!conv) return;
  const text = (document.getElementById('nf36vAddText').value || '').trim(), file = (document.getElementById('nf36vAddFile').files || [])[0];
  const dirBtn = document.querySelector('#nf36vAdd .nf36v-seg button.on'), dir = dirBtn ? dirBtn.dataset.dir : 'in';
  if(!text && !file) return needText(document.getElementById('nf36vAddText'), 'Paste the message, or pick a photo or file.');
  const kindOfFile = f => /^image\//.test(f.type) ? 'photo' : /^video\//.test(f.type) ? 'video' : 'file';
  const ths = nf36vLinkedFor(conv), kind = conv._vb ? (ths[0] && ths[0].party_kind) || 'customer' : nf36vSideKind(convSide(conv));
  const partyId = conv._vb ? (ths[0] && ths[0].party_id) || '' : conv.id, partyName = conv.name;
  if(!myBusiness){
    let t = ths[0];
    if(!t){ t = {id: 'vt' + Date.now(), title: partyName, status: 'linked', party_kind: kind, party_id: partyId, party_name: partyName, owner_user_id: 'me', unread: 0}; NF36V.threads.push(t); }
    (NF36V.msgs[t.id] = NF36V.msgs[t.id] || []).push({id: 'vm' + Date.now(), thread_id: t.id, dir, body: text, kind: file ? kindOfFile(file) : 'text', at: nf36vNowIso(), media_status: file ? 'ok' : 'none', media_name: file ? file.name : null, media_size: file ? file.size : null, _url: file ? URL.createObjectURL(file) : null, status: dir === 'out' ? 'sent' : 'done', source: 'paste', ack: false});
    slClose('nf36vAdd'); nf36vChanged(); return showToast('Added ✓');
  }
  const { data, error } = await sb.rpc('viber_web_add', {p_business: myBusiness.id, p_kind: kind, p_party_id: partyId, p_party_name: partyName, p_dir: dir, p_text: text || null, p_media_kind: file ? kindOfFile(file) : 'text'});
  if(error) return showToast("Couldn't add it: " + error.message);
  slClose('nf36vAdd');
  if(file && data && data.message){ const mm = data.message; (NF36V.msgs[mm.thread_id] = NF36V.msgs[mm.thread_id] || []).push(mm); const inp = {files: [file]}; await nf36vLoad(); await nf36vFill(mm.id, inp); }
  else { await nf36vLoad(); showToast('Added ✓'); }
}

// ---------- new chats the phone picked up ----------
function nf36vNewHtml(){
  const list = nf36vNewThreads(); if(!list.length) return '';
  return `<div class="nf36v-new"><div class="nf36v-nh"><b>${NF36V_IC.viber}New on Viber <em class="nf36v-n">${list.length}</em></b><small>Only you see these until you say who they are.</small></div>
    ${list.slice(0, 4).map(t => `<div class="nf36v-nrow"><button type="button" class="nf36v-nmain" onclick="nf36vPeek('${t.id}')"><span class="nf33-av sm">${nfAvatarInner(t.title)}</span><span><b>${nf36vEsc(t.title)}</b><small>${nf36vEsc(t.last_text || '')}</small></span></button>
      <span class="nf36v-nacts"><button type="button" onclick="nf36vPick('${t.id}','customer')">Customer</button><button type="button" onclick="nf36vPick('${t.id}','supplier')">Supplier</button><button type="button" class="ghost" onclick="nf36vIgnore('${t.id}')">Not business</button></span></div>`).join('')}
    ${list.length > 4 ? `<button type="button" class="nf36v-more" onclick="nf36vAllNew()">See all ${list.length}</button>` : ''}</div>`;
}
function nf36vAllNew(){ slModal('nf36vAllN', `<div class="sl-sheet-h"><b>New on Viber</b><button class="sl-x" onclick="slClose('nf36vAllN')" aria-label="Close">✕</button></div><div class="nf36v-sheetlist">${nf36vNewThreads().map(t => `<div class="nf36v-nrow"><button type="button" class="nf36v-nmain" onclick="slClose('nf36vAllN'); nf36vPeek('${t.id}')"><span class="nf33-av sm">${nfAvatarInner(t.title)}</span><span><b>${nf36vEsc(t.title)}</b><small>${nf36vEsc(t.last_text || '')}</small></span></button><span class="nf36v-nacts"><button type="button" onclick="slClose('nf36vAllN'); nf36vPick('${t.id}','customer')">Customer</button><button type="button" onclick="slClose('nf36vAllN'); nf36vPick('${t.id}','supplier')">Supplier</button><button type="button" class="ghost" onclick="slClose('nf36vAllN'); nf36vIgnore('${t.id}')">Not business</button></span></div>`).join('')}</div>`); }
function nf36vPeek(id){
  const t = NF36V.threads.find(x => x.id === id); if(!t) return;
  const ms = nf36vMsgsOf(t).slice(-12);
  slModal('nf36vPeek', `<div class="sl-sheet-h"><b>${nf36vEsc(t.title)}</b><button class="sl-x" onclick="slClose('nf36vPeek')" aria-label="Close">✕</button></div>
    <p class="nf36v-p">From Viber on ${nf36vEsc(nf36vOwnerPhone(t))}. Who is this?</p>
    <div class="nf36v-peek">${ms.map(m => `<div class="nf36v-pm ${m.dir}">${nf36vBubble(m, t)}<small>${nf36vEsc(nf36vWhen(m.at))}</small></div>`).join('') || '<p class="nf36v-p">No messages yet.</p>'}</div>
    <div class="nf36v-acts big"><button type="button" class="btn btn-primary" onclick="slClose('nf36vPeek'); nf36vPick('${t.id}','customer')">A customer</button><button type="button" class="btn btn-primary" onclick="slClose('nf36vPeek'); nf36vPick('${t.id}','supplier')">A supplier</button><button type="button" class="btn btn-outline" onclick="slClose('nf36vPeek'); nf36vIgnore('${t.id}')">Not business</button></div>`);
}
function nf36vPick(id, kind){
  const t = NF36V.threads.find(x => x.id === id); if(!t) return;
  const side = nf36vKindSide(kind), convs = NF36V_ALL().filter(c => convSide(c) === side);
  const guess = convs.find(c => c.name.toLowerCase() === String(t.title).toLowerCase());
  slModal('nf36vPick', `<div class="sl-sheet-h"><b>Which ${kind}?</b><button class="sl-x" onclick="slClose('nf36vPick')" aria-label="Close">✕</button></div>
    <p class="nf36v-p">Viber chat: <b>${nf36vEsc(t.title)}</b>. Pick who this is, so their Viber messages show in their chat.</p>
    <input class="nf36v-search" type="search" placeholder="Search ${kind}s" oninput="const q=this.value.toLowerCase(); document.querySelectorAll('#nf36vPick .nf36v-pk').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(q))">
    <div class="nf36v-sheetlist">${convs.map(c => `<button type="button" class="nf36v-pk${guess === c ? ' on' : ''}" onclick="nf36vLink('${t.id}','${kind}','${nf36vEsc(c.id)}')"><span class="nf33-av sm">${nfAvatarInner(c.name)}</span><b>${nf36vEsc(c.name)}</b></button>`).join('')}</div>
    <div class="nf36v-newp"><label class="nf36v-f"><span>Not in the list? Save as a new ${kind}</span><input id="nf36vNewName" value="${nf36vEsc(t.title)}"></label><button type="button" class="btn btn-outline" onclick="nf36vLink('${t.id}','${kind}','')">Save as new ${kind}</button></div>`);
}
async function nf36vLink(id, kind, convId){
  const t = NF36V.threads.find(x => x.id === id); if(!t) return;
  const c = convId ? NF36V_ALL().find(x => x.id === convId) : null;
  const name = c ? c.name : ((document.getElementById('nf36vNewName') || {}).value || t.title).trim() || t.title;
  if(myBusiness){ const { error } = await sb.rpc('viber_link', {p_thread: id, p_kind: kind, p_party_id: convId || '', p_party_name: name}); if(error) return showToast("Couldn't save: " + error.message); }
  Object.assign(t, {status: 'linked', party_kind: kind, party_id: convId || null, party_name: name});
  slClose('nf36vPick'); nf36vChanged();
  showToast(`${name}: Viber messages now show in their chat ✓`);
}
async function nf36vIgnore(id){
  const t = NF36V.threads.find(x => x.id === id); if(!t) return;
  if(!confirm(`Hide "${t.title}" from Nifti?\n\nNifti deletes what it saved from this chat and stops bringing it in. The chat stays in your Viber.`)) return;
  if(myBusiness){
    try{
      const { data } = await sb.auth.getSession(); const tok = data && data.session && data.session.access_token;
      const r = await fetch(`${NIFTI_SUPABASE_URL}/functions/v1/viber-media?op=ignore&t=${encodeURIComponent(id)}`, {method: 'POST', headers: {Authorization: 'Bearer ' + tok, apikey: NIFTI_SUPABASE_KEY}});
      if(!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
    }catch(e){ return showToast("Couldn't hide it: " + e.message); }
  }
  t.status = 'ignored'; delete NF36V.msgs[id]; nf36vChanged(); showToast('Hidden. Nifti won\'t bring this chat in.');
}

// ---------- warnings ----------
function nf36vWarnHtml(){
  const is = nf36vIssues(); if(!is.length) return '';
  const msg = is.filter(i => i.kind === 'missing').length, rep = is.filter(i => i.kind === 'failed').length, dev = is.filter(i => i.kind !== 'missing' && i.kind !== 'failed');
  const parts = []; if(msg) parts.push(msg + (msg === 1 ? " photo or file didn't come through" : " photos or files didn't come through")); if(rep) parts.push(rep + (rep === 1 ? " reply wasn't sent" : " replies weren't sent"));
  return `<button type="button" class="nf36v-warn" onclick="nf36vWarnSheet()">${NF36V_IC.warn}<span><b>${parts.length ? parts.join(' · ') : nf36vEsc(dev[0].text)}</b>${parts.length && dev.length ? `<small>${nf36vEsc(dev[0].text)}</small>` : ''}</span><i>See</i></button>`;
}
function nf36vWarnSheet(){
  const is = nf36vIssues();
  slModal('nf36vWarn', `<div class="sl-sheet-h"><b>Needs one tap</b><button class="sl-x" onclick="slClose('nf36vWarn')" aria-label="Close">✕</button></div>
    <div class="nf36v-sheetlist">${is.map(i => `<div class="nf36v-irow">${NF36V_IC.warn}<span><b>${nf36vEsc(i.text)}</b><small>${i.kind === 'missing' ? 'On the phone: open the chat, hold it, Share, Nifti. Or open the chat here and add it.' : i.kind === 'failed' ? nf36vEsc(i.m.fail_reason || '') : i.kind === 'offline' ? 'Open the Nifti app on that phone. If it keeps happening, do the battery steps in Connect Viber.' : i.kind === 'access' ? 'On that phone: Nifti app → Connect Viber → turn on notification access.' : 'In Viber: More → Settings → Notifications → Show message preview.'}</small></span>
      ${i.t ? `<button type="button" class="btn btn-outline" onclick="slClose('nf36vWarn'); nf36vGoThread('${i.t.id}')">Open chat</button>` : `<button type="button" class="btn btn-outline" onclick="slClose('nf36vWarn'); nf36vSetup()">Fix</button>`}</div>`).join('') || '<p class="nf36v-p">All good.</p>'}</div>`);
}
function nf36vGoThread(tid){
  const t = NF36V.threads.find(x => x.id === tid); if(!t) return;
  if(t.status === 'new') return nf36vPeek(tid);
  const c = nf36vConvFor(t), id = c ? c.id : 'vb_' + t.id;
  try{ if(typeof navigate === 'function' && !document.querySelector('#page-messages.active, #page-messages:not(.hidden)')) navigate('messages'); }catch(e){}
  setTimeout(() => selectConversation(id, c ? convSide(c) : nf36vKindSide(t.party_kind)), 60);
}

// ---------- Connect Viber (setup) ----------
const NF36V_BRAND = {
  xiaomi: {name: 'Xiaomi, Redmi and POCO', battery: 'Battery saver: tap Nifti → No restrictions.', auto: 'Find Nifti in the Autostart list and switch it on.', lock: 'Open recent apps, hold Nifti, tap the lock.'},
  oppo: {name: 'OPPO and realme', battery: 'Battery: tap Nifti → Allow background activity (or Don\'t optimize).', auto: 'Find Nifti under Auto launch (or Startup manager) and switch it on.', lock: 'Open recent apps, tap ⋮ on Nifti, tap Lock.'},
  vivo: {name: 'vivo and iQOO', battery: 'Battery → Background power consumption: allow Nifti (High background power).', auto: 'Find Nifti under Autostart (or Background startup) and switch it on.', lock: 'Open recent apps, pull Nifti down to lock it.'},
  transsion: {name: 'Infinix, Tecno and itel', battery: 'Phone Master → Power saving: take Nifti off the list.', auto: 'Find Nifti under Auto-start management and switch it on.', lock: 'Open recent apps and lock Nifti.'},
  huawei: {name: 'Huawei and Honor', battery: 'Battery → App launch: turn off "Manage automatically" for Nifti and turn all three switches on.', auto: 'Same screen as above.', lock: 'Open recent apps, pull Nifti down to lock it.'},
  samsung: {name: 'Samsung', battery: 'Battery: tap Nifti → Unrestricted. Also make sure Nifti is not under "Sleeping apps".', auto: '', lock: ''},
};
function nf36vStep(ok, title, sub, btn, warn){
  return `<div class="nf36v-step${ok ? ' ok' : warn ? ' bad' : ''}"><span class="nf36v-dot">${ok ? NF36V_IC.ok : warn ? '!' : ''}</span><span class="nf36v-sx"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${btn && !ok ? btn : ''}</div>`;
}
async function nf36vRegister(force){
  const A = nf36vAndroid(); if(!A || !myBusiness) return false;
  if(!force && A.connected && A.business === myBusiness.id) return true;
  const { data, error } = await sb.rpc('viber_device_register', {p_business: myBusiness.id, p_name: (nf36vMeName() === 'You' ? '' : nf36vMeName().split(' ')[0] + "'s ") + (A.model || 'Android phone'), p_brand: A.brand || '', p_model: A.model || '', p_version: A.versionCode || 1});
  if(error || !data) return false;
  window.NiftiAndroid.connect(JSON.stringify({url: NIFTI_SUPABASE_URL, key: NIFTI_SUPABASE_KEY, device: data.id, secret: data.secret, business: myBusiness.id, user: nf36vMeName()}));
  await nf36vLoad();
  return true;
}
function nf36vSetup(){ nf36vSetupPaint(true); }
function nf36vSetupPaint(open){
  if(!open && !document.getElementById('nf36vSetup')) return;
  const plat = nf36vPlatform(), A = nf36vAndroid();
  let body = '';
  if(plat === 'app' && A){
    const b = NF36V_BRAND[A.brand], strict = NF36V_STRICT.includes(A.brand);
    body = `<div class="nf36v-hero ok">${NF36V_IC.phone}<span><b>${A.connected ? 'This phone is connected to ' + nf36vEsc((myBusiness && myBusiness.name) || 'your business') : 'Connecting this phone…'}</b><small>${A.lastIn ? 'Last Viber message came in ' + nf36vAgo(new Date(A.lastIn).toISOString()) + '.' : 'Do the steps below once. It takes about 2 minutes.'}</small></span></div>
      ${A.connected ? '' : `<button type="button" class="btn btn-primary nf36v-wide" onclick="nf36vRegister(true).then(()=>nf36vSetupPaint())">Connect this phone</button>`}
      <div class="nf36v-steps">
      ${nf36vStep(A.notif, 'Let Nifti see Viber notifications', A.notif ? 'On.' : 'Tap Turn on, find Nifti, switch it on. <br>If Android says <b>"Restricted setting"</b>: open App info → ⋮ (top right) → <b>Allow restricted settings</b>, then try again.', `<span class="nf36v-sb"><button type="button" class="nf36v-btn" onclick="NiftiAndroid.open('notif')">Turn on</button><button type="button" class="nf36v-btn ghost" onclick="NiftiAndroid.open('appinfo')">App info</button></span>`, !A.notif)}
      ${nf36vStep(A.alerts, 'Let Nifti warn you', 'So you get a warning the moment a photo, file or reply doesn\'t go through.', `<button type="button" class="nf36v-btn" onclick="NiftiAndroid.open('alerts')">Allow</button>`)}
      ${nf36vStep(A.photos, 'Let Nifti pick up Viber photos', 'Nifti only takes pictures from Viber\'s own folder, never your camera photos.', `<button type="button" class="nf36v-btn" onclick="NiftiAndroid.open('photos')">Allow</button>`)}
      ${strict ? `<div class="nf36v-brand"><b>${NF36V_IC.warn}${nf36vEsc(b ? b.name : 'This phone')}: don't let the phone limit Nifti's battery</b><small>${nf36vEsc(b ? b.name.split(',')[0] : 'This')} phones close apps in the background to save battery. If Nifti gets closed, Viber messages stop coming in until you open it again. Do all of these once:</small>
        ${nf36vStep(A.battery, 'Battery: no restrictions', nf36vEsc(b ? b.battery : 'Allow Nifti to run in the background.'), `<button type="button" class="nf36v-btn" onclick="NiftiAndroid.open('battery')">Open</button>`, !A.battery)}
        ${b && b.auto ? nf36vStep(A.autostartDone, 'Autostart', nf36vEsc(b.auto), `<button type="button" class="nf36v-btn" onclick="NiftiAndroid.open('autostart')">Open</button>`, false) : ''}
        ${b && b.lock ? nf36vStep(false, 'Lock Nifti in recent apps', nf36vEsc(b.lock), '', false) : ''}</div>`
        : nf36vStep(A.battery, "Don't limit Nifti's battery", 'So the phone never closes Nifti in the background.', `<button type="button" class="nf36v-btn" onclick="NiftiAndroid.open('battery')">Open</button>`)}
      ${nf36vStep(A.screen, 'Open chats: catch messages in the chat you have open', 'Viber shows no notification for a chat that\'s open on screen. Turn this on so those still come in. Nifti only reads Viber. Find <b>Nifti: open Viber chats</b> → On.', `<button type="button" class="nf36v-btn" onclick="NiftiAndroid.open('screen')">Turn on</button>`)}
      ${nf36vStep(!A.previewOff, 'In Viber: show message previews', A.previewOff ? 'Viber is hiding message text. Viber → More → Settings → Notifications → turn on <b>Show message preview</b>.' : 'Keep Viber notifications on and <b>unmute</b> business chats. Muted chats send no notification.', `<button type="button" class="nf36v-btn" onclick="NiftiAndroid.open('viber')">Open Viber</button>`, A.previewOff)}
      </div>
      <p class="nf36v-p"><b>Test it:</b> ask someone to send you a Viber message. It shows in Messages within seconds.</p>
      <button type="button" class="nf36v-link" onclick="if(confirm('Disconnect this phone? Viber stops coming into Nifti from it.')){ nf36vDisconnect(); }">Disconnect this phone</button>`;
  } else if(plat === 'android'){
    body = `<div class="nf36v-hero">${NF36V_IC.phone}<span><b>Get the Nifti app for Android</b><small>A website can't read Viber; an app on your phone can. It's Nifti itself, and it brings your Viber chats, photos and files in by itself.</small></span></div>
      <a class="btn btn-primary nf36v-wide" href="${NF36V_APK}" download>Download Nifti for Android</a>
      <ol class="nf36v-ol"><li>Tap Download, then open the file.</li><li>If asked, allow your browser to install apps. Android shows this warning for any app that's not from the Play Store.</li><li>Open Nifti, sign in, and follow the steps. About 2 minutes.</li></ol>
      ${nf36vDevicesHtml()}`;
  } else {
    body = `${plat === 'iphone' ? `<div class="nf36v-hero">${NF36V_IC.phone}<span><b>On iPhone it's one tap each way</b><small>Apple doesn't let any app read Viber, so Nifti can't bring it in by itself on iPhone.</small></span></div>` : `<div class="nf36v-hero">${NF36V_IC.phone}<span><b>Bring your Viber into Nifti</b><small>Connect an Android phone that has your business Viber. Every chat, photo and file comes in by itself, and replies typed here go out from that phone.</small></span></div>`}
      <div class="nf36v-steps">
        ${nf36vStep(false, 'Android phone: install the Nifti app', `On the phone, open <b>siggiebahamas.github.io/Nifti</b> → Messages → Connect Viber, or download it directly: <a href="${NF36V_APK}">Nifti for Android</a>.`, `<button type="button" class="nf36v-btn" onclick="nf33RCopy('${NF36V_APK}').then(()=>showToast('Link copied. Send it to your phone.'))">Copy link</button>`)}
        ${nf36vStep(false, plat === 'iphone' ? 'Reply' : 'iPhone or no app: reply', 'Type in Nifti and tap Send. Nifti copies it and opens their Viber chat. Paste and send.', '')}
        ${nf36vStep(false, plat === 'iphone' ? 'Bring a message in' : 'iPhone or no app: bring a message in', 'In Viber, hold the message → Copy. In the chat here, tap <b>+ Add a Viber message</b> and paste. For a photo, save it to Photos first, then add it.', '')}
      </div>${nf36vDevicesHtml()}`;
  }
  const html = `<div class="sl-sheet-h"><b>Connect Viber</b><button class="sl-x" onclick="slClose('nf36vSetup')" aria-label="Close">✕</button></div><div class="nf36v-setup">${body}</div>`;
  const el = document.getElementById('nf36vSetup');
  if(el && el.querySelector('.nf36v-setup')){ el.querySelector('.nf36v-setup').innerHTML = body; } else slModal('nf36vSetup', html);
}
function nf36vDevicesHtml(){
  if(!NF36V.devices.length) return '';
  return `<h4 class="nf36v-h4">Phones bringing in Viber</h4>` + NF36V.devices.filter(d => !d.revoked_at).map(d => {
    const f = d.flags || {}, off = nf36vMins(d.last_seen_at) > 45, probs = [];
    if(off) probs.push('last checked in ' + nf36vAgo(d.last_seen_at)); if(f.notif === false) probs.push('notification access off'); if(f.previewOff) probs.push('Viber previews hidden');
    if(f.battery === false && NF36V_STRICT.includes(f.brand)) probs.push('battery not set'); if(f.screen === false) probs.push('open chats off');
    return `<div class="nf36v-dev${probs.length ? ' bad' : ''}">${NF36V_IC.phone}<span><b>${nf36vEsc(d.name || d.model || 'Android phone')}</b><small>${probs.length ? nf36vEsc(probs.join(' · ')) : 'Working · checked in ' + nf36vAgo(d.last_seen_at)}</small></span>${myBusiness ? `<button type="button" class="nf36v-btn ghost" onclick="nf36vRevoke('${d.id}')">Disconnect</button>` : ''}</div>`;
  }).join('');
}
async function nf36vRevoke(id){
  if(!confirm('Disconnect this phone? Viber stops coming into Nifti from it.')) return;
  const { error } = await sb.rpc('viber_device_revoke', {p_device: id}); if(error) return showToast("Couldn't: " + error.message);
  NF36V.devices = NF36V.devices.filter(d => d.id !== id); nf36vSetupPaint(); nf36vChanged();
}
async function nf36vDisconnect(){
  const A = nf36vAndroid(); if(A && A.device && myBusiness) await sb.rpc('viber_device_revoke', {p_device: A.device});
  try{ window.NiftiAndroid.disconnect(); }catch(e){}
  slClose('nf36vSetup'); nf36vLoad(); showToast('This phone is disconnected.');
}
window.nf36vNative = function(what){ try{ nf36vSetupPaint(); nf36vTick(true); }catch(e){} };

// ---------- loading (real accounts) ----------
async function nf36vLoad(full){
  nf36vMode();
  if(!myBusiness || NF36V.loading) return; NF36V.loading = true;
  try{
    const biz = myBusiness.id;
    const [th, dv] = await Promise.all([
      sb.from('viber_threads').select('*').eq('business_id', biz).neq('status', 'ignored').order('last_at', {ascending: false, nullsFirst: false}).limit(300),
      sb.from('viber_devices').select('id,business_id,user_id,user_name,name,brand,model,app_version,flags,last_seen_at,revoked_at,created_at').eq('business_id', biz).is('revoked_at', null)]);
    if(th.error) return;
    const before = JSON.stringify([NF36V.threads, NF36V.devices]);
    NF36V.threads = th.data || []; NF36V.devices = dv.data || [];
    let rows = [];
    if(!NF36V.since || full){ const r = await sb.from('viber_messages').select('*').eq('business_id', biz).order('created_at', {ascending: false}).limit(800); rows = (r.data || []).reverse(); NF36V.msgs = {}; }
    else { const r = await sb.from('viber_messages').select('*').eq('business_id', biz).gt('created_at', NF36V.since).order('created_at', {ascending: true}).limit(500); rows = r.data || []; }
    // statuses that can still change
    const pend = []; for(const tid in NF36V.msgs) NF36V.msgs[tid].forEach(m => { if(!String(m.id).startsWith('tmp') && ((m.dir === 'out' && (m.status === 'queued' || m.status === 'sending')) || m.media_status === 'waiting' || (m.media_status === 'missing' && !m.ack))) pend.push(m.id); });
    if(pend.length){ const r = await sb.from('viber_messages').select('*').in('id', pend.slice(0, 200)); rows = rows.concat(r.data || []); }
    let changed = before !== JSON.stringify([NF36V.threads, NF36V.devices]);
    rows.forEach(m => {
      const list = NF36V.msgs[m.thread_id] = NF36V.msgs[m.thread_id] || [];
      const i = list.findIndex(x => x.id === m.id);
      if(i >= 0){ if(JSON.stringify(list[i]) !== JSON.stringify(Object.assign({}, list[i], m))){ Object.assign(list[i], m); changed = true; } }
      else { const tmp = list.findIndex(x => String(x.id).startsWith('tmp') && x.dir === m.dir && x.body === m.body); if(tmp >= 0) list[tmp] = m; else list.push(m); changed = true; }
      if(!NF36V.since || m.created_at > NF36V.since) NF36V.since = m.created_at;
    });
    if(changed) nf36vChanged();
  }catch(e){ console.warn('nf36v', e); }
  finally{ NF36V.loading = false; }
}
function nf36vMode(){
  const mode = myBusiness ? 'real:' + myBusiness.id : 'demo';
  if(NF36V.mode !== mode){ Object.assign(NF36V, {threads: [], msgs: {}, devices: [], vc: {}, since: null, seeded: false, seenIssues: null, regTried: false, route: {}, mode}); NF36V.ver++; }
}
async function nf36vTick(force){
  nf36vMode();
  if(document.hidden && !force) return;
  NF36V.tick++;
  if(!myBusiness){ nf36vSeed(); return; }
  if(window.NiftiAndroid && !NF36V.regTried){
    NF36V.regTried = true;
    const ok = await nf36vRegister(false); const A = nf36vAndroid();
    if(ok && A && !A.notif){ let seen = null; try{ seen = localStorage.getItem('nf36v-setup-shown'); }catch(e){} if(!seen){ try{ localStorage.setItem('nf36v-setup-shown', '1'); }catch(e){} setTimeout(nf36vSetup, 800); } }
  }
  const onMsgs = document.body.classList.contains('nf33-msgs');
  if(force || onMsgs || NF36V.tick % 4 === 0) await nf36vLoad();
}

// ---------- repaint when anything changed ----------
function nf36vChanged(){
  NF36V.ver++;
  // new problems: say so right away
  const is = nf36vIssues().filter(i => i.kind === 'missing' || i.kind === 'failed'), ids = is.map(i => i.id);
  if(NF36V.seenIssues){ const fresh = is.filter(i => !NF36V.seenIssues.includes(i.id)); if(fresh.length) showToast('⚠ ' + fresh[0].text + (fresh.length > 1 ? ` (+${fresh.length - 1} more)` : ''), 'error'); }
  NF36V.seenIssues = ids;
  try{ if(document.getElementById('convList')) nf33Paint(); }catch(e){}
  try{ const c = getActiveConv(); if(c && document.getElementById('threadBody') && (c._vb || nf36vLinkedFor(c).length)) renderThread(c); }catch(e){}
  try{ updateMessagesBadge(); }catch(e){}
}
function nf36vPaintExtras(){
  const side = document.querySelector('#page-messages .msg-sidebar'), list = document.getElementById('convList'); if(!side || !list) return;
  let box = document.getElementById('nf36vTop');
  if(!box){ box = document.createElement('div'); box.id = 'nf36vTop'; side.insertBefore(box, list); }
  const q = (typeof NF33 !== 'undefined' && NF33.q || '').trim(), tab = typeof nf33Tab === 'function' ? nf33Tab() : 'cus';
  const html = nf36vWarnHtml() + (q || tab === 'team' ? '' : nf36vNewHtml());
  if(box._h !== html){ box.innerHTML = html; box._h = html; }
  const title = document.querySelector('#nf33Head .nf33-title');
  if(title){
    let pill = document.getElementById('nf36vPill');
    if(!pill){ pill = document.createElement('button'); pill.type = 'button'; pill.id = 'nf36vPill'; pill.className = 'nf36v-pill'; pill.onclick = nf36vSetup; title.insertBefore(pill, title.querySelector('.nf33-ico')); }
    const devs = NF36V.devices.filter(d => !d.revoked_at), bad = nf36vIssues().some(i => i.d), st = !devs.length ? 'off' : bad ? 'warn' : 'ok';
    const lbl = `${NF36V_IC.viber}<span>${st === 'off' ? 'Connect Viber' : 'Viber'}</span><i class="${st}"></i>`;
    if(pill._h !== lbl){ pill.innerHTML = lbl; pill._h = lbl; pill.title = st === 'off' ? 'Bring your Viber chats into Nifti' : st === 'warn' ? 'Viber needs attention' : 'Viber is connected'; }
  }
}

// ---------- hook into Messages ----------
(function(){
  allConversations = function(){ return NF36V_ALL().concat(nf36vVirtuals()); };
  window.allConversations = allConversations;

  const baseRow = nf33Row; nf33Row = function(c){ return baseRow(nf36vListConv(c)); };
  const baseTs = nf33Ts; nf33Ts = function(c){ return baseTs(nf36vListConv(c)); };
  const basePv = nf33Preview; nf33Preview = function(m){
    const h = basePv(m); if(!m || !m.vb) return h;
    const bad = (m.vb.media_status === 'missing' && !m.vb.ack) || (m.vb.status === 'failed' && !m.vb.ack);
    return `<i class="nf36v-pvi${bad ? ' bad' : ''}" title="Viber">${bad ? NF36V_IC.warn : NF36V_IC.viber}</i>` + h;
  };
  const baseCounts = nf33Counts; nf33Counts = function(){
    const c = baseCounts();
    NF36V.threads.forEach(t => { if(t.status !== 'linked' || !(t.unread > 0)) return; const conv = nf36vConvFor(t); if(conv && !(conv.unread > 0)) c[nf33Group(conv)] += 1; });
    return c;
  };
  const basePaint = nf33Paint; nf33Paint = function(){ basePaint.apply(this, arguments); try{ nf36vPaintExtras(); }catch(e){ console.warn('nf36v', e); } };
  window.nf33Paint = nf33Paint;

  const baseTotal = totalUnread; totalUnread = function(){ return baseTotal() + nf36vBadgeExtra(); };
  window.totalUnread = totalUnread;

  const baseActive = getActiveConv; getActiveConv = function(){
    if(typeof activeConvId === 'string' && activeConvId.startsWith('vb_')) return nf36vVirtuals().find(c => c.id === activeConvId) || null;
    return baseActive.apply(this, arguments);
  };
  window.getActiveConv = getActiveConv;

  const baseSel = window.selectConversation;
  const sel = function(id){
    if(typeof id === 'string' && id.startsWith('vb_')){
      const c = nf36vVirtuals().find(x => x.id === id); if(!c){ showToast("Couldn't open that conversation."); return; }
      try{ if(typeof NF33 !== 'undefined' && !NF33.q) NF33.tab = nf33Group(c); }catch(e){}
      try{ if(typeof NF18T !== 'undefined') NF18T.on = false; }catch(e){}
      activeConvId = id;
      const t = NF36V.threads.find(x => x.id === c._vb); if(t && t.unread){ t.unread = 0; if(myBusiness) sb.rpc('viber_read', {p_thread: t.id}); }
      const body = document.getElementById('threadBody'); if(body) body.dataset.filesView = '0';
      try{ nf33Paint(); }catch(e){}
      try{ clearMsgFilter(); }catch(e){ renderThread(c); }
      const shell = document.querySelector('.messages-shell'); if(shell) shell.classList.add('thread-active');
      try{ updateMessagesBadge(); }catch(e){}
      return;
    }
    const r = baseSel.apply(this, arguments);
    try{ const conv = NF36V_ALL().find(x => x.id === id); nf36vLinkedFor(conv).forEach(t => { if(t.unread){ t.unread = 0; if(myBusiness) sb.rpc('viber_read', {p_thread: t.id}); } }); nf33Paint(); updateMessagesBadge(); }catch(e){}
    return r;
  };
  Object.keys(baseSel || {}).forEach(k => { sel[k] = baseSel[k]; }); sel._nf36v = true;
  window.selectConversation = sel; try{ selectConversation = sel; }catch(e){}

  const baseRT = renderThread;
  const rt = function(conv){
    if(!conv) return baseRT.apply(this, arguments);
    const ths = nf36vLinkedFor(conv);
    if(!ths.length){ nf36vBar(null); return baseRT.apply(this, arguments); }
    const merged = nf36vMerged(conv, ths).map(m => m.vb ? Object.assign({}, m, {text: nf36vBubble(m.vb, m.vbt), _plain: m.text, attachment: null}) : m);
    const body = document.getElementById('threadBody'), sig = nf36vSigOf(merged);
    const r = baseRT.call(this, Object.assign({}, conv, {messages: merged}, conv._vb ? {name: nf36vEsc(conv.name), initials: nf36vEsc(conv.initials)} : {}));
    if(body){ body.classList.add('nf36v-thread'); NF36V.sig[conv.id] = sig; }
    nf36vBar(conv, ths); nf36vHydrate();
    return r;
  };
  Object.keys(baseRT).forEach(k => { rt[k] = baseRT[k]; });
  window.renderThread = rt; try{ renderThread = rt; }catch(e){}

  const baseSend = sendMessage;
  const send = function(){
    const conv = getActiveConv(); if(!conv) return baseSend.apply(this, arguments);
    const ths = nf36vLinkedFor(conv);
    if(!ths.length || nf36vRoute(conv, ths) !== 'viber') return baseSend.apply(this, arguments);
    const input = document.getElementById('msgInput'), text = (input.value || '').trim();
    if(pendingAttachment){ showToast("Photos and files can't go out on Viber from Nifti yet. Send them from the phone, or switch to Nifti."); return; }
    if(!text) return needText(input, 'Type a message first.');
    input.value = ''; input.style.height = 'auto';
    const live = ths.find(t => nf36vLiveDevice(t)) || ths[0];
    nf36vSend(live, text, conv);
  };
  window.sendMessage = send; try{ sendMessage = send; }catch(e){}

  // chat smarts (quotes, price changes, deliveries) read the words, not the bubble's HTML
  if(typeof nf31Detect === 'function'){ const bd = nf31Detect; nf31Detect = function(m, conv){ if(m && m._plain !== undefined) m = Object.assign({}, m, {text: m._plain}); return bd.call(this, m, conv); }; try{ window.nf31Detect = nf31Detect; }catch(e){} }

  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ if(page && page.id === 'page-messages'){ nf36vMode(); if(!myBusiness) nf36vSeed(); nf36vPaintExtras(); } }catch(e){} };
  window.nf26AfterPass = nf26AfterPass;

  setInterval(() => { nf36vTick(false); }, 15000);
  setTimeout(() => { nf36vTick(true); }, 2500);
  document.addEventListener('visibilitychange', () => { if(!document.hidden) nf36vTick(true); });
})();
