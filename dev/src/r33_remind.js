/* ===== Round 33: reminders on the app each customer actually uses (Viber, WhatsApp, Messenger, SMS, email, Nifti chat) ===== */
// Email and Nifti chat go out by themselves. Viber, WhatsApp, Messenger and SMS open with the message ready: one tap to send.
const NF33R = {prefs: null, cur: null, queue: null, qi: 0};
const NF33R_CH = {
  viber: {l: 'Viber', c: '#7360F2', ic: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.9 2 3 5.4 3 10.2c0 2.7 1.3 5 3.4 6.5V21l3.2-2.1c.8.2 1.6.3 2.4.3 5.1 0 9-3.4 9-8.1S17.1 2 12 2zm4.3 11.6c-.2.6-1.1 1.1-1.6 1.2-.4 0-.9.1-2.9-.8-2.4-1-3.9-3.5-4-3.7-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.3.4-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.3.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.1.1.6-.1 1.4z"/></svg>'},
  whatsapp: {l: 'WhatsApp', c: '#25D366', ic: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.4.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.2.5.1.7-.1l.8-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.2 1.7z"/></svg>'},
  messenger: {l: 'Messenger', c: '#0084FF', ic: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.4 2 2 6.1 2 11.6c0 2.9 1.2 5.4 3.2 7.1V22l3-1.7c1.1.3 2.3.5 3.8.5 5.6 0 10-4.1 10-9.6S17.6 2 12 2zm1 12.9-2.5-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.5 5.8z"/></svg>'},
  sms: {l: 'Text (SMS)', c: '#475467', ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>'},
  email: {l: 'Email', c: '#B45309', ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'},
  chat: {l: 'Nifti chat', c: '#1F6B45', ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'},
};
function nf33RKey(){ return 'nifti-contact-prefs:' + (myBusiness ? myBusiness.id : 'demo'); }
async function nf33RLoad(){
  if(NF33R.prefs) return NF33R.prefs;
  NF33R.prefs = {};
  if(myBusiness){ try{ const { data } = await sb.from('contact_prefs').select('*').eq('business_id', myBusiness.id); (data || []).forEach(r => { NF33R.prefs[r.party_id] = {channel: r.channel, phone: r.phone || '', handle: r.handle || '', email: r.email || ''}; }); }catch(e){} }
  else { try{ NF33R.prefs = JSON.parse(localStorage.getItem(nf33RKey()) || '{}') || {}; }catch(e){} if(!Object.keys(NF33R.prefs).length) NF33R.prefs = {buy_riverside: {channel: 'whatsapp', phone: '0917 555 0142'}}; }
  return NF33R.prefs;
}
async function nf33RSave(id, p){
  NF33R.prefs = NF33R.prefs || {}; NF33R.prefs[id] = p;
  if(myBusiness){ try{ await sb.from('contact_prefs').upsert({business_id: myBusiness.id, party_id: String(id), channel: p.channel, phone: p.phone || null, handle: p.handle || null, email: p.email || null, updated_at: new Date().toISOString()}); }catch(e){} }
  else { try{ localStorage.setItem(nf33RKey(), JSON.stringify(NF33R.prefs)); }catch(e){} }
}
function nf33RBuyer(id){ return (buyersData || []).find(x => x.id === id) || {}; }
function nf33ROnNifti(id){ const b = nf33RBuyer(id); return !b.isOutside && allConversations().some(c => c.id === id); }
function nf33RPref(id){
  const p = (NF33R.prefs || {})[id], b = nf33RBuyer(id), oc = b.outsideContact || {};
  const base = {channel: nf33ROnNifti(id) ? 'chat' : 'viber', phone: b.phone || oc.phone || '', handle: '', email: b.email || oc.email || ''};
  return Object.assign(base, p || {});
}
function nf33RPhone(s){ let d = String(s || '').replace(/[^\d+]/g, ''); if(d.startsWith('+')) d = d.slice(1); if(d.startsWith('09') && d.length === 11) d = '63' + d.slice(1); if(d.startsWith('9') && d.length === 10) d = '63' + d; return d; }
async function nf33RText(g){
  let text = colMessage(g), link = null;
  try{ if(myBusiness){ const { data } = await sb.rpc('create_statement_link', {p_buyer: g.id}); if(data) link = appBaseUrl() + '#st/' + data; } else link = appBaseUrl() + '#st/demo'; }catch(e){}
  if(link) text = text.replace('\nSalamat!', `\nSee your balance and how to pay (tap "I've paid" once you have): ${link}\nSalamat!`);
  return text;
}
async function colRemindNf33(buyerId){
  await nf33RLoad();
  const g = colRows().find(x => x.id === buyerId); if(!g) return;
  const p = nf33RPref(buyerId);
  NF33R.cur = {id: buyerId, g, p: Object.assign({}, p), text: await nf33RText(g), always: true};
  window._colPendingLog = g.needs.map(n => ({po_id: n.po.id, stage: n.stage}));
  nf33RSheet();
}
function nf33RSheet(){
  const x = NF33R.cur; if(!x) return;
  const ch = x.p.channel, on = nf33ROnNifti(x.id), q = NF33R.queue;
  const list = ['viber', 'whatsapp', 'messenger', 'sms', 'email'].concat(on ? ['chat'] : []);
  const field = ch === 'viber' || ch === 'whatsapp' || ch === 'sms' ? `<label class="nf33r-f"><span>Their mobile number</span><input id="nf33rPhone" inputmode="tel" placeholder="e.g. 0917 123 4567" value="${escapeHtml(x.p.phone || '')}" oninput="NF33R.cur.p.phone=this.value"></label>`
    : ch === 'messenger' ? `<label class="nf33r-f"><span>Their Facebook name or link (optional)</span><input id="nf33rHandle" placeholder="e.g. facebook.com/riversidebuilders or riversidebuilders" value="${escapeHtml(x.p.handle || '')}" oninput="NF33R.cur.p.handle=this.value"></label>`
    : ch === 'email' ? `<label class="nf33r-f"><span>Their email</span><input id="nf33rEmail" type="email" placeholder="name@example.com" value="${escapeHtml(x.p.email || '')}" oninput="NF33R.cur.p.email=this.value"></label>` : '';
  const how = ch === 'whatsapp' ? 'WhatsApp opens with the message already typed. Just tap send.'
    : ch === 'sms' ? 'Your phone\'s Messages app opens with the message already typed.'
    : ch === 'viber' ? 'Nifti copies the message and opens their Viber chat. Paste it (long-press, Paste) and send.'
    : ch === 'messenger' ? 'Nifti copies the message and opens Messenger. Paste it and send.'
    : ch === 'email' ? (collSettings().email ? 'Email reminders also go out by themselves on your schedule.' : 'Your email app opens with the message ready.')
    : 'Sent right away in your Nifti chat with them.';
  const btn = ch === 'viber' ? 'Copy message & open Viber' : ch === 'messenger' ? 'Copy message & open Messenger' : ch === 'chat' ? 'Send in Nifti chat' : 'Open ' + NF33R_CH[ch].l;
  slModal('nf33rSheet', `<div class="sl-sheet-h"><b>${q ? `Reminder ${NF33R.qi + 1} of ${q.length}: ` : 'Remind '}${escapeHtml(x.g.name)}</b><button class="sl-x" onclick="slClose('nf33rSheet'); NF33R.queue=null" aria-label="Close">✕</button></div>
    <div class="nf33r">
      <div class="nf33r-sum"><b>${fmtPHP(x.g.total)}</b> owed${x.g.overdue > 0 ? ` · <span class="r">${fmtPHP(x.g.overdue)} late, ${x.g.maxLate} days</span>` : ''}</div>
      <div class="nf33r-lbl">Send on the app they use</div>
      <div class="nf33r-chs">${list.map(k => `<button type="button" class="${ch === k ? 'on' : ''}" style="--c:${NF33R_CH[k].c}" onclick="NF33R.cur.p.channel='${k}'; nf33RSheet()"><span>${NF33R_CH[k].ic}</span>${NF33R_CH[k].l}</button>`).join('')}</div>
      ${field}
      <label class="nf33r-f"><span>Message</span><textarea id="nf33rText" rows="7" oninput="NF33R.cur.text=this.value">${escapeHtml(x.text)}</textarea></label>
      <label class="nf33r-chk"><input type="checkbox" ${x.always ? 'checked' : ''} onchange="NF33R.cur.always=this.checked"> Always use ${escapeHtml(NF33R_CH[ch].l)} for ${escapeHtml(x.g.name)}</label>
      <p class="nf33r-how">${how}</p>
      <div class="nf33r-acts"><button type="button" class="btn btn-primary nf33r-go" style="--c:${NF33R_CH[ch].c}" onclick="nf33RGo()"><span>${NF33R_CH[ch].ic}</span>${btn}</button>
        ${q ? `<button type="button" class="btn btn-outline" onclick="nf33RNext()">Skip</button>` : ''}</div>
    </div>`);
}
async function nf33RCopy(t){ try{ await navigator.clipboard.writeText(t); return true; }catch(e){ try{ const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); return true; }catch(e2){ return false; } } }
async function nf33RGo(){
  const x = NF33R.cur; if(!x) return; const ch = x.p.channel, t = x.text, ph = nf33RPhone(x.p.phone);
  if((ch === 'whatsapp' || ch === 'sms') && ph.length < 10){ showToast('Type their mobile number first.', 'warn'); const i = document.getElementById('nf33rPhone'); if(i) i.focus(); return; }
  if(ch === 'email' && !/@/.test(x.p.email || '')){ showToast('Type their email first.', 'warn'); const i = document.getElementById('nf33rEmail'); if(i) i.focus(); return; }
  if(x.always) await nf33RSave(x.id, x.p);
  let url = '';
  if(ch === 'whatsapp') url = 'https://wa.me/' + ph + '?text=' + encodeURIComponent(t);
  else if(ch === 'sms') url = 'sms:+' + ph + (/iphone|ipad|ipod/i.test(navigator.userAgent) ? '&' : '?') + 'body=' + encodeURIComponent(t);
  else if(ch === 'email') url = 'mailto:' + encodeURIComponent(x.p.email) + '?subject=' + encodeURIComponent('Payment reminder from ' + (myBusiness ? myBusiness.name : 'us')) + '&body=' + encodeURIComponent(t);
  else if(ch === 'viber'){ await nf33RCopy(t); url = ph.length >= 10 ? 'viber://chat?number=%2B' + ph : 'viber://forward?text=' + encodeURIComponent(t); showToast('Message copied. Paste it in Viber and send.', 'success'); }
  else if(ch === 'messenger'){ await nf33RCopy(t); const h = String(x.p.handle || '').replace(/^https?:\/\/(www\.)?(m\.)?facebook\.com\//i, '').replace(/^@/, '').split(/[/?#]/)[0]; url = h ? 'https://m.me/' + encodeURIComponent(h) : 'https://www.messenger.com/'; showToast('Message copied. Paste it in Messenger and send.', 'success'); }
  else if(ch === 'chat'){ if(sendTextInChat(x.id, t)){ showToast(`Reminder sent to ${x.g.name} in chat.`, 'success'); } }
  if(url){ try{ window.open(url, '_blank', 'noopener'); }catch(e){ location.href = url; } }
  try{ await colLogManual(); }catch(e){}
  if(NF33R.queue) return nf33RNext();
  slClose('nf33rSheet'); try{ renderCollectionsPage(); }catch(e){}
}
async function nf33RNext(){
  const q = NF33R.queue; if(!q){ slClose('nf33rSheet'); return; }
  NF33R.qi++;
  if(NF33R.qi >= q.length){ NF33R.queue = null; slClose('nf33rSheet'); showToast('All reminders done for today. 👍', 'success'); try{ renderCollectionsPage(); }catch(e){} return; }
  await colRemindNf33(q[NF33R.qi]);
}
async function nf33RQueue(){
  await nf33RLoad();
  const ids = colRows().filter(r => r.needsYou).map(r => r.id); if(!ids.length){ showToast('Nobody needs a reminder from you today.', 'success'); return; }
  NF33R.queue = ids; NF33R.qi = 0; await colRemindNf33(ids[0]);
}
// a strip on Getting paid: how many reminders are ready, and which app each customer gets
async function nf33RStrip(page){
  if(typeof colTab !== 'undefined' && colTab !== 'follow') return;
  const host = page.querySelector('#colBody') || page.querySelector('#collectionsContent'); if(!host) return;
  await nf33RLoad();
  let rows = []; try{ rows = colRows(); }catch(e){ return; }
  const due = rows.filter(r => r.needsYou);
  let s = document.getElementById('nf33rStrip');
  const sig = due.map(r => r.id).join(',') + '|' + JSON.stringify(NF33R.prefs);
  if(s && s.dataset.sig === sig && host.contains(s)) return;
  if(!s){ s = document.createElement('div'); s.id = 'nf33rStrip'; }
  s.dataset.sig = sig; s.className = 'nf33r-strip' + (due.length ? ' due' : '');
  s.innerHTML = `<div><b>${due.length ? `${due.length} reminder${due.length === 1 ? '' : 's'} ready to send` : 'Reminders are on schedule'}</b><small>Each customer gets it on their own app: ${['viber', 'whatsapp', 'messenger', 'sms', 'email'].map(k => `<span class="nf33r-mini" style="--c:${NF33R_CH[k].c}">${NF33R_CH[k].ic}</span>`).join('')} Email and Nifti chat go out by themselves.</small></div>
    ${due.length ? `<button type="button" class="btn btn-primary" onclick="nf33RQueue()">Send them now</button>` : ''}`;
  const first = host.querySelector('.sl-tiles, .sl-card'); if(first && first.parentElement === host) host.insertBefore(s, first.nextSibling); else host.prepend(s);
  // show each customer's app on their row
  page.querySelectorAll('button[onclick^="colRemind("]').forEach(b => { const id = (b.getAttribute('onclick').match(/colRemind\('([^']+)'\)/) || [])[1]; if(!id) return; const p = nf33RPref(id), c = NF33R_CH[p.channel];
    if(b.dataset.nf33 === p.channel) return; b.dataset.nf33 = p.channel; b.classList.add('nf33r-rb'); b.style.setProperty('--c', c.c); b.innerHTML = `<span>${c.ic}</span>Remind`; b.title = 'Remind by ' + c.l; });
}
(function(){
  try{ window.colRemind = colRemindNf33; colRemind = colRemindNf33; }catch(e){ console.warn('nf33r', e); }
  const bc = window.colBuyerChannel;
  if(typeof bc === 'function' && !bc._nf33){ const w = function(id){ const p = NF33R.prefs && NF33R.prefs[id]; if(p){ if(p.channel === 'chat' && nf33ROnNifti(id)) return 'chat'; if(p.channel === 'email' && p.email && collSettings().email) return 'email'; return 'manual'; } return bc.apply(this, arguments); };
    w._nf33 = true; window.colBuyerChannel = w; try{ colBuyerChannel = w; }catch(e){} }
  const base = nf26AfterPass;
  nf26AfterPass = function(page){ base(page); try{ if(page && page.id === 'page-collections') nf33RStrip(page); }catch(e){ console.warn('nf33r strip', e); } };
  window.nf26AfterPass = nf26AfterPass;
})();
