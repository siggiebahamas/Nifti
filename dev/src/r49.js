/* Round 49
   1. Online store page: one calm home with four big choices, each opening on its own (no clutter, step by step)
   2. Facebook without a Meta app: phone share sheet (Facebook or Business Suite), computer picture-on-clipboard,
      and Facebook's own free automations set up from Nifti (comment and Messenger replies, store button)
   3. Supabase: store photos shared by the team and shown on the buyer's store page; honest saves
*/
const NF49S = {view: 'home', title: '', inlineId: null, next: false};
function nf49E(s){ return typeof nf48E === 'function' ? nf48E(s) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); }
const NF49_IC = {
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v2a3 3 0 0 1-5.3 2 3 3 0 0 1-5.4 0A3 3 0 0 1 4 11z"/><path d="M5 13v7h14v-7"/>',
  peso: '<path d="M7 4v16M7 4h5a4 4 0 0 1 0 8H7M4 8h12M4 11h12"/>',
  fb: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  back: '<path d="M15 18l-6-6 6-6"/>', check: '<path d="M5 12l5 5L20 7"/>', copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7h-4M14 21h.01"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
};
function nf49Svg(k, s){ return `<svg viewBox="0 0 24 24" width="${s || 22}" height="${s || 22}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NF49_IC[k] || ''}</svg>`; }
function nf49Biz(){ return typeof myBusiness !== 'undefined' && myBusiness ? myBusiness : null; }
function nf49Mac(){ return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || ''); }

/* ================= 1. Supabase: honest saves, shared store photos ================= */
(function(){
  if(typeof nf48SaveStoreKey !== 'function') return;
  nf48SaveStoreKey = async function(key, val){
    const st = Object.assign({}, nf48Store(), {[key]: val});
    const biz = nf49Biz();
    if(biz){
      try{
        const { data, error } = await sb.rpc('set_store', {p_store: st, p_slug: biz.store_slug || slugify(biz.name)});
        if(error) throw error;
        biz.store = data || st;
        if(data && !(key in data)){ console.warn('nf49: the server did not keep store.' + key); return false; }
        return true;
      }catch(e){ console.warn('nf49 store save', e); return false; }
    }
    window._demoStore = st; return true;
  };
  window.nf48SaveStoreKey = nf48SaveStoreKey;
})();
function nf49Slug(s){ return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item'; }
function nf49PhotoUrl(path){ try{ return sb.storage.from('store-photos').getPublicUrl(path).data.publicUrl; }catch(e){ return ''; } }
// the clean photo (no price tag, no name) goes to the store and to everyone on the team
async function nf49PhotoUpload(item, canvas){
  const biz = nf49Biz(); if(!biz || !item || item === '__own' || typeof sb === 'undefined') return 'local';
  const blob = await nf48Blob(canvas, 'image/jpeg', .86); if(!blob) return 'fail';
  const path = biz.id + '/' + nf49Slug(item) + '.jpg';
  const up = await sb.storage.from('store-photos').upload(path, blob, {upsert: true, contentType: 'image/jpeg', cacheControl: '60'});
  if(up.error) throw up.error;
  const r = await sb.rpc('set_store_photo', {p_item: item, p_path: path}); if(r.error) throw r.error;
  biz.store = Object.assign({}, biz.store || {}, {photos: r.data || {}});
  return 'cloud';
}
(function(){
  if(typeof nf48PhotoUse !== 'function') return;
  const use = nf48PhotoUse;
  nf48PhotoUse = function(){
    const item = NF48F.item; let clean = null;
    try{ const cv = document.getElementById('nf48FCv');
      if(cv && NF48F.img && nf49Biz() && item){ const tag = NF48F.tag, name = NF48F.name; NF48F.tag = false; NF48F.name = false; NF48F.before = false; nf48PhotoRender();
        clean = document.createElement('canvas'); clean.width = cv.width; clean.height = cv.height; clean.getContext('2d').drawImage(cv, 0, 0); NF48F.tag = tag; NF48F.name = name; nf48PhotoRender(); } }catch(e){ clean = null; }
    const out = use.apply(this, arguments);
    if(clean) nf49PhotoUpload(item, clean).then(r => { if(r === 'cloud') showToast('Saved for your whole team and shown on your store page.', 'success'); })
      .catch(e => { console.warn('nf49 photo upload', e); showToast("Saved on this phone. It couldn't go to your team yet: " + (e.message || 'try again later'), 'warn'); });
    return out;
  };
  window.nf48PhotoUse = nf48PhotoUse;
})();
const NF49P = {loading: {}};
(function(){
  if(typeof nf48LoadPhotos !== 'function') return;
  const load = nf48LoadPhotos;
  nf48LoadPhotos = function(){
    const out = load.apply(this, arguments);
    const biz = nf49Biz(), ph = biz && biz.store && biz.store.photos; if(!ph) return out;
    NF22S.photo = NF22S.photo || {};
    Object.keys(ph).slice(0, 40).forEach(item => {
      const path = ph[item]; if(!path || NF22S.photo[item] || NF49P.loading[path]) return; NF49P.loading[path] = 1;
      const url = nf49PhotoUrl(path); if(!url) return;
      fetch(url, {cache: 'no-store'}).then(r => r.ok ? r.blob() : null).then(b => { if(!b) return; const fr = new FileReader(); fr.onload = () => { NF22S.photo[item] = fr.result; }; fr.readAsDataURL(b); }).catch(() => {});
    });
    return out;
  };
  window.nf48LoadPhotos = nf48LoadPhotos;
})();
function nf49PhotoCount(){ const s = new Set(Object.keys(nf48Photos ? nf48Photos() : {})); const biz = nf49Biz(); Object.keys((biz && biz.store && biz.store.photos) || {}).forEach(k => s.add(k)); s.delete('__own'); return s.size; }

/* ================= 2. Facebook, the free way ================= */
const NF49F = {blob: null, text: '', kind: ''};
const NF49_FB_KEYWORDS = ['magkano', 'hm', 'how much', 'price', 'presyo'];
function nf49StoreLink(src){ const s = nf22Shop(); return s.url(src); }
async function nf49FbPost(cv, text, kind, onDone){
  const blob = await nf48Blob(cv); if(!blob){ showToast("Couldn't make the picture. Try again.", 'error'); return false; }
  NF49F.blob = blob; NF49F.text = text; NF49F.kind = kind || 'post'; NF49F.done = onDone;
  const file = new File([blob], 'nifti-post.png', {type: 'image/png'});
  if(nf48Phone() && navigator.canShare && navigator.canShare({files: [file]})){
    if(!nf48Get('fb-tip', false)){
      nf45Pop('nf49FbTip', 'Post it on Facebook', `<ol class="nf49-steps">
          <li><i>1</i><div><b>Pick where to post</b><span><b>Facebook</b> posts on your profile or in a group. <b>Business Suite</b> posts on your shop's Page.</span></div></li>
          <li><i>2</i><div><b>Paste the words</b><span>Nifti copies them for you. Press and hold the text box, then tap <b>Paste</b>.</span></div></li>
          <li><i>3</i><div><b>Tap Post</b><span>Come back here and tap "Yes, count it".</span></div></li></ol>`,
        `<button type="button" class="btn btn-primary nf49-wide" onclick="nf48Set('fb-tip', true); slClose('nf49FbTip'); nf49FbShareNow()">Got it, open Facebook</button>`);
      return true;
    }
    return nf49FbShareNow();
  }
  // computer: the picture goes on the clipboard so it pastes straight into Facebook
  let pic = false;
  try{ if(navigator.clipboard && window.ClipboardItem){ await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]); pic = true; } }catch(e){ pic = false; }
  if(!pic) nf48Download(blob, 'nifti-post.png');
  nf49FbDesk(pic);
  return true;
}
async function nf49FbShareNow(){
  const file = new File([NF49F.blob], 'nifti-post.png', {type: 'image/png'});
  const copied = await nf48Copy(NF49F.text);
  showToast(copied ? 'The words are copied. Paste them in Facebook.' : 'Pick Facebook or Business Suite.', 'success');
  try{ await navigator.share({files: [file], text: NF49F.text}); nf48AskPosted(NF49F.kind, NF49F.done); return true; }catch(e){ return false; }
}
function nf49FbDest(){ return nf48Get('fb-dest', 'page') === 'profile' ? 'profile' : 'page'; }
function nf49FbOpen(){ window.open(nf49FbDest() === 'page' ? 'https://business.facebook.com/latest/composer' : 'https://www.facebook.com/', '_blank', 'noopener'); }
async function nf49FbCopyWords(btn){ const ok = await nf48Copy(NF49F.text); const t = btn && btn.querySelector('span'); if(t) t.textContent = ok ? 'Words copied ✓' : 'Select the words under the picture and copy them'; }
function nf49FbDesk(pic){
  const k = nf49Mac() ? '⌘ Cmd + V' : 'Ctrl + V', d = nf49FbDest();
  const body = `<p class="nf45-p">${pic ? 'Your picture is copied. Facebook opens in a new tab: paste the picture, then the words.' : 'Your picture is saved in Downloads (nifti-post.png). Facebook opens in a new tab.'}</p>
    <div class="nf49-seg" role="group" aria-label="Where to post">
      <button type="button" class="${d === 'page' ? 'on' : ''}" onclick="nf48Set('fb-dest', 'page'); nf49FbDesk(${pic})"><b>My shop's Page</b><small>Business Suite</small></button>
      <button type="button" class="${d === 'profile' ? 'on' : ''}" onclick="nf48Set('fb-dest', 'profile'); nf49FbDesk(${pic})"><b>My profile or a group</b><small>Facebook</small></button></div>
    <ol class="nf49-steps">
      <li><i>1</i><div><b>Open Facebook</b><span>${d === 'page' ? 'Business Suite opens the "Create post" box for your Page.' : 'Click "What\'s on your mind?" (or open your group first).'}</span><button type="button" class="btn btn-primary nf49-fbgo" onclick="nf49FbOpen()">${nf49Svg('fb', 18)}Open ${d === 'page' ? 'Business Suite' : 'Facebook'}</button></div></li>
      <li><i>2</i><div><b>${pic ? 'Paste the picture' : 'Add the picture'}</b><span>${pic ? `Click inside the post box and press <kbd>${k}</kbd>.` : 'Click "Photo/video" and pick nifti-post.png.'}</span></div></li>
      <li><i>3</i><div><b>Paste the words</b><span>Copy them here, then press <kbd>${k}</kbd> in the post box.</span><button type="button" class="btn btn-outline" id="nf49FbWords" onclick="nf49FbCopyWords(this)">${nf49Svg('copy', 16)}<span>Copy the words</span></button></div></li>
      <li><i>4</i><div><b>Click Post</b><span>Then tap "I posted it" so it counts for this week.</span></div></li></ol>`;
  const foot = `<button type="button" class="btn btn-outline" onclick="nf48Download(NF49F.blob, 'nifti-post.png')">Save the picture</button><button type="button" class="btn btn-primary" onclick="slClose('nf49FbDesk'); nf48Counted(NF49F.kind)">I posted it</button>`;
  const ex = document.getElementById('nf49FbDesk');
  if(ex && !ex.classList.contains('nf49-tool')){ const b = ex.querySelector('.nf49-fbbody'); if(b){ b.innerHTML = body; return; } }
  nf45Pop('nf49FbDesk', 'Post it on Facebook', `<div class="nf49-fbbody">${body}</div>`, foot);
}
(function(){
  if(typeof nf48PostFacebook !== 'function') return;
  const viaApi = nf48PostFacebook;
  nf48PostFacebook = function(cv, text, kind, onDone){
    if(typeof nf48FbPage === 'function' && nf48FbPage() && NIFTI_FB.ready && nf49Biz()) return viaApi.apply(this, arguments);
    return nf49FbPost(cv, text, kind, onDone);
  };
  window.nf48PostFacebook = nf48PostFacebook;
})();
// Facebook's own free tools, set up from here once
function nf49FbState(){ return Object.assign({link: false, comments: false, messenger: false}, nf48Get('fb-setup', {})); }
function nf49FbMark(k, v){ const s = nf49FbState(); s[k] = v; nf48Set('fb-setup', s); nf49FbSetupPaint(); }
function nf49FbTexts(){
  const s = nf22Shop(), link = nf49StoreLink('fb'), en = (nf48ReplyCfg().lang || 'tl') === 'en', c = nf48Checkout(), m = c.methods || {};
  const pays = [m.cod !== false ? 'COD' : '', m.gcash ? 'GCash' : '', m.maya ? 'Maya' : '', m.bank ? 'bank transfer' : ''].filter(Boolean).join(', ') || 'COD';
  const fees = (c.fees || []).slice(0, 4).map(f => `${f.area} ₱${Number(f.fee || 0).toLocaleString('en-PH')}`).join(', ');
  return en ? {
    comment: `Hi! Thanks for asking 😊 All our prices are here, and you can order right away: ${link}`,
    instant: `Hi, thanks for messaging ${s.name}! 😊 Prices and ordering: ${link} We'll reply to you shortly.`,
    faq: [['How much?', `All our prices are here, and you can order there too: ${link}`], ['Do you deliver?', `Yes! We deliver to ${s.areas}${fees ? ' (' + fees + ')' : ''}. ${s.lead}.`], ['How do I pay?', `You can pay by ${pays}. Order here: ${link}`], ['Where are you?', `We're in ${s.town}. Open ${s.hours}. Order online anytime: ${link}`]]
  } : {
    comment: `Hi po! Salamat sa tanong 😊 Nandito po lahat ng presyo namin, at pwede na kayong mag-order: ${link}`,
    instant: `Hi po, salamat sa message sa ${s.name}! 😊 Presyo at order dito po: ${link} Sasagutin namin kayo agad.`,
    faq: [['Magkano po?', `Nandito po lahat ng presyo namin, at pwede na rin mag-order: ${link}`], ['Nagde-deliver po ba kayo?', `Opo! Nagde-deliver kami sa ${s.areas}${fees ? ' (' + fees + ')' : ''}. ${s.lead}.`], ['Paano po magbayad?', `Pwede po ${pays}. Mag-order dito: ${link}`], ['Saan po kayo?', `Nasa ${s.town} po kami. Bukas ${s.hours}. Pwede mag-order online anytime: ${link}`]]
  };
}
function nf49CopyBtn(text, label){ return `<button type="button" class="nf49-copy" data-copy="${nf49E(text)}" onclick="nf48Copy(this.dataset.copy).then(ok => { const t = this.querySelector('span'); if(t){ const o = t.textContent; t.textContent = ok ? 'Copied' : 'Select and copy'; setTimeout(() => { t.textContent = o; }, 1600); } })">${nf49Svg('copy', 16)}<span>${nf49E(label || 'Copy')}</span></button>`; }
function nf49FbSetupHtml(){
  const st = nf49FbState(), t = nf49FbTexts(), link = nf49StoreLink('fbpage'), done = ['link', 'comments', 'messenger'].filter(k => st[k]).length, pg = nf48Get('fb-page-url', '');
  const card = (k, n, title, sub, inner) => `<section class="nf49-fbc ${st[k] ? 'done' : ''}"><header><i>${st[k] ? nf49Svg('check', 18) : n}</i><div><b>${title}</b><small>${sub}</small></div>
      <label class="nf49-done"><input type="checkbox" ${st[k] ? 'checked' : ''} onchange="nf49FbMark('${k}', this.checked)"><span>Done</span></label></header><div class="nf49-fbin">${inner}</div></section>`;
  return `<div class="nf49-fbhead"><div><b>${done} of 3 set up</b><span>Facebook does these for free once you switch them on. Set up on a computer, about 5 minutes. Nothing to pay, no app to approve.</span></div>
      <div class="nf49-bar"><u style="width:${Math.round(done / 3 * 100)}%"></u></div></div>
    <label class="nf49-pg">Your shop's Facebook Page link <small>(optional, so the buttons open your Page)</small><input type="url" inputmode="url" placeholder="e.g. facebook.com/delacruzhardware" value="${nf49E(pg)}" onchange="nf48Set('fb-page-url', this.value.trim() ? (/^https?:/.test(this.value.trim()) ? this.value.trim() : 'https://' + this.value.trim()) : ''); nf49FbSetupPaint()"></label>
    ${card('link', 1, 'Put an "Order now" button on your Page', 'Buyers tap it and land on your store.', `
      <ol class="nf49-mini"><li>Open your Page${pg ? '' : ' on Facebook'}, then click <b>Edit</b> next to the blue button (or <b>+ Add action button</b>).</li><li>Choose <b>Shop now</b> or <b>Order food / Order now</b>.</li><li>Paste your store link and save.</li></ol>
      <div class="nf49-copyrow"><code>${nf49E(nf22Short(link))}</code>${nf49CopyBtn(link, 'Copy link')}</div>
      <button type="button" class="btn btn-outline nf49-open" onclick="window.open(${pg ? `'${nf49E(pg)}'` : `'https://www.facebook.com/pages/?category=your_pages'`}, '_blank', 'noopener')">${nf49Svg('ext', 16)}Open my Page</button>`)}
    ${card('comments', 2, 'Answer "how much?" comments by itself', 'When someone comments a price question on your posts, Facebook sends them your link in Messenger.', `
      <ol class="nf49-mini"><li>Open <b>Business Suite</b> → <b>Inbox</b> → <b>Automations</b>.</li><li>Pick the comment automation (<b>Comment to message</b> or <b>Reply to comments</b>), then <b>Add keywords</b>.</li><li>Add these words, one by one:</li></ol>
      <div class="nf49-kw">${NF49_FB_KEYWORDS.map(w => `<span>${nf49E(w)}</span>`).join('')}${nf49CopyBtn(NF49_FB_KEYWORDS.join(', '), 'Copy words')}</div>
      <ol class="nf49-mini" start="4"><li>Paste this as the message, then <b>Save</b> and switch it <b>On</b>:</li></ol>
      <div class="nf49-msg"><p>${nf49E(t.comment)}</p>${nf49CopyBtn(t.comment, 'Copy message')}</div>
      <button type="button" class="btn btn-primary nf49-open" onclick="window.open('https://business.facebook.com/latest/inbox/automations', '_blank', 'noopener')">${nf49Svg('ext', 16)}Open Business Suite automations</button>`)}
    ${card('messenger', 3, 'Answer Messenger messages by itself', 'A friendly first reply with your link, plus answers to the 4 questions buyers ask most.', `
      <ol class="nf49-mini"><li>In <b>Automations</b>, turn on <b>Instant reply</b> and paste:</li></ol>
      <div class="nf49-msg"><p>${nf49E(t.instant)}</p>${nf49CopyBtn(t.instant, 'Copy')}</div>
      <ol class="nf49-mini" start="2"><li>Turn on <b>Frequently asked questions</b> and add these:</li></ol>
      <div class="nf49-faq">${t.faq.map(([q, a]) => `<div><b>${nf49E(q)}</b><p>${nf49E(a)}</p><span class="nf49-faqb">${nf49CopyBtn(q, 'Copy question')}${nf49CopyBtn(a, 'Copy answer')}</span></div>`).join('')}</div>
      <button type="button" class="btn btn-primary nf49-open" onclick="window.open('https://business.facebook.com/latest/inbox/automations', '_blank', 'noopener')">${nf49Svg('ext', 16)}Open Business Suite automations</button>`)}
    <section class="nf49-fbone"><div><b>Someone asked under a post just now?</b><span>Paste their comment and Nifti writes the reply with the right price.</span></div><button type="button" class="btn btn-outline" onclick="nf48Replies()">${nf49Svg('chat', 16)}Write one reply</button></section>
    <div class="nf49-lang"><span>Words in:</span><button type="button" class="${(nf48ReplyCfg().lang || 'tl') !== 'en' ? 'on' : ''}" onclick="nf49FbLang('tl')">Taglish</button><button type="button" class="${(nf48ReplyCfg().lang || 'tl') === 'en' ? 'on' : ''}" onclick="nf49FbLang('en')">English</button></div>`;
}
function nf49FbLang(l){ const cfg = Object.assign(nf48ReplyCfg(), {lang: l}); nf48Set('replies', cfg); nf49FbSetupPaint(); }
function nf49FbSetupPaint(){ const b = document.getElementById('nf49FbSetupBody'); if(b) b.innerHTML = nf49FbSetupHtml(); }
function nf49FbSetup(){ nf45Pop('nf49FbSetup', 'Answer buyers on Facebook automatically', `<div id="nf49FbSetupBody">${nf49FbSetupHtml()}</div>`, `<button type="button" class="btn btn-primary" onclick="slClose('nf49FbSetup')">Done</button>`, {wide: true}); }

/* ================= 3. The online store page ================= */
// tools open inside the page instead of a popup when they start from the store home
(function(){
  if(typeof nf45Pop !== 'function') return;
  const pop = nf45Pop;
  nf45Pop = function(id, title, body, foot, opts){
    const host = document.getElementById('nf22sBody');
    const again = NF49S.inlineId === id && host && host.querySelector(':scope > .nf49-tool#' + CSS.escape(id));
    if((NF49S.next || again) && host){
      NF49S.next = false; NF49S.inlineId = id; NF49S.view = 'inline';
      const w = document.createElement('div'); w.className = 'nf49-tool'; w.id = id;
      w.innerHTML = `<div class="nf49-tbody">${body}</div>${foot ? `<div class="nf49-tfoot">${foot}</div>` : ''}`;
      host.innerHTML = ''; delete host.dataset.k49; host.appendChild(w);
      w.querySelectorAll('.nf43-cancel').forEach(c => c.remove());
      w.querySelectorAll('.nf49-tfoot button').forEach(b => { if(/^(Close|Cancel|Not now|Done)$/i.test(b.textContent.trim()) && /slClose\(/.test(b.getAttribute('onclick') || '')) b.classList.add('nf49-quiet'); });
      return w;
    }
    return pop.apply(this, arguments);
  };
  window.nf45Pop = nf45Pop;
  const close = slClose;
  slClose = function(id){
    const el = id ? document.getElementById(id) : null;
    if(el && el.classList.contains('nf49-tool')){ NF49S.inlineId = null; nf49Home(); return; }
    return close.apply(this, arguments);
  };
  window.slClose = slClose;
})();
const NF49_VIEWS = {
  post: {title: 'Post something today', tab: 'today'}, week: {title: 'Plan your posts for the week', tab: 'week'}, buyers: {title: 'Who ordered from your store', tab: 'buyers'},
  details: {title: 'Store details', tab: 'store'}, make: {title: 'Make your own post', tab: 'make'},
  list: {title: "This week's price list", fn: () => nf48PriceList()}, photo: {title: 'Product photos', fn: () => nf48Photo('', () => {})},
  fb: {title: 'Answer buyers on Facebook automatically', fn: () => nf49FbSetup()}, pay: {title: 'How buyers pay and what delivery costs', fn: () => nf48CheckoutOpen()}
};
function nf49Top(){ window.scrollTo({top: 0, behavior: 'auto'}); }
function nf49Home(){ NF49S.view = 'home'; NF49S.inlineId = null; NF49S.next = false; try{ nf22Paint(); }catch(e){} nf49Top(); }
function nf49Open(v){
  const d = NF49_VIEWS[v]; if(!d) return;
  if(v === 'pay' && typeof requirePermission === 'function' && !requirePermission('manageAccount')) return;
  NF49S.title = d.title;
  if(d.tab){ NF49S.view = v; NF22S.tab = d.tab; try{ localStorage.setItem('nifti-store-tab', d.tab); }catch(e){} nf22Paint(); nf49Top(); return; }
  NF49S.view = 'inline'; NF49S.iv = v;
  const page = document.querySelector('#storeContent .nf22s'); if(page){ const top = page.querySelector('.nf22s-top'); if(top) top.replaceWith(nf22Top()); page.classList.remove('nf49-home'); page.classList.add('nf49-in'); }
  NF49S.next = true;
  try{ d.fn(); }catch(e){ console.warn('nf49 open', e); }
  NF49S.next = false;
  if(!document.querySelector('#nf22sBody > .nf49-tool')){ nf49Home(); return; }
  if(v === 'photo') nf49PhotoGallery();
  nf49Top();
}
function nf49PhotoGallery(){
  const host = document.querySelector('#nf22sBody > .nf49-tool .nf49-tbody'); if(!host || host.querySelector('.nf49-gal')) return;
  const local = nf48Photos ? nf48Photos() : {}, items = Object.keys(local).filter(k => k !== '__own');
  const sec = document.createElement('section'); sec.className = 'nf49-gal';
  sec.innerHTML = `<h3>Your photos ${items.length ? `<span>${items.length}</span>` : ''}</h3>${items.length ? `<div class="nf49-galg">${items.map(k => `<button type="button" onclick="NF49S.next = true; nf48Photo(${nf49E(JSON.stringify(k))}, () => {})"><img src="${local[k]}" alt=""><span>${nf49E(k)}</span><em>Redo</em></button>`).join('')}</div>` : '<p class="nf45-sm">No photos yet. Pick an item below and take one: Nifti makes the background plain and adds the price.</p>'}
    <div class="nf49-tips"><b>Real photos sell best</b><span>Stand near a door or window for light · put the item on a plain floor or wall · fill the frame with the item.</span></div>`;
  host.insertBefore(sec, host.firstChild);
}
function nf49Stats(){
  const st = typeof NF47ST !== 'undefined' ? NF47ST.data : null; try{ nf47StoreStats(); }catch(e){}
  if(!st) return {views: '…', orders: '…', sales: '…'};
  if(st.locked) return null;
  const n = Number(st.sales || 0), compact = innerWidth < 761 && n >= 10000 ? '₱' + (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K') : null;
  return {views: Number(st.views || 0).toLocaleString('en-PH'), orders: Number(st.orders || 0).toLocaleString('en-PH'), sales: compact || nf47P(n), demo: st.demo};
}
function nf49HeroHtml(){
  const s = nf22Shop(), k = nf49Stats();
  const stats = k ? `<div class="nf49-k"><button type="button" onclick="nf49Open('buyers')"><span>Visits this week</span><b>${k.views}</b></button><button type="button" onclick="nf49Open('buyers')"><span>Orders from it</span><b>${k.orders}</b></button><button type="button" onclick="nf49Open('buyers')"><span>Sold through it</span><b>${k.sales}</b></button></div>${k.demo ? '<small class="nf49-ex">Example numbers for the demo shop.</small>' : ''}`
    : `<div class="nf49-klock"><b>See who visits and orders</b><span>Visits, orders and sales from your link show here on Pro.</span><button type="button" class="nf43-link" onclick="nf26OpenPlans()">See plans</button></div>`;
  return `<div class="nf49-hero ${s.open ? 'open' : 'closed'}">
      <div class="nf49-hl">
        <div class="nf49-status"><span class="nf49-dot"></span><b>${s.open ? 'Your store is open' : 'Your store is closed'}</b></div>
        <p>${s.open ? 'Anyone with your link can see your prices and order, even without Nifti.' : 'Open it so buyers can order from your link.'}</p>
        <div class="nf49-link"><code>${nf49E(nf22Short(s.url()))}</code><button type="button" class="nf49-lb" onclick="nf47Share('link')">${nf49Svg('copy', 18)}<span>Copy</span></button></div>
        <div class="nf49-share">${s.open ? `<button type="button" class="fb" onclick="nf47Share('fb')">${nf49Svg('fb', 18)}Share link on Facebook</button><button type="button" class="vb" onclick="nf47Share('viber')">Send link on Viber</button><button type="button" class="qr" data-go="poster">${nf49Svg('qr', 18)}QR for your counter</button>` : `<button type="button" class="fb" onclick="nf49Open('details')">Open my store</button>`}</div>
      </div>
      <div class="nf49-hr">${stats}</div></div>`;
}
function nf49BarHtml(){
  return `<div class="nf49-bar2"><button type="button" class="nf49-back" onclick="nf49Home()">${nf49Svg('back', 20)}<span>Your store</span></button><h2>${nf49E(NF49S.title || '')}</h2></div>`;
}
function nf49SetupState(){
  const s = nf22Shop(), c = nf48Checkout(), fb = nf49FbState(); let shared = false; try{ shared = !!localStorage.getItem('nifti-store-shared'); }catch(e){}
  return [
    {k: 'details', t: 'Store details', d: s.open && !!(s.st.delivery_areas || '').trim(), sub: s.open ? 'Open, with delivery areas' : 'Open your store, add delivery areas'},
    {k: 'pay', t: 'Payments and delivery fees', d: !!(s.st.checkout && ((c.fees || []).length || (c.methods || {}).gcash || (c.methods || {}).maya)), sub: 'GCash, Maya, COD · fee by barangay'},
    {k: 'fb', t: 'Facebook auto-replies', d: fb.link || fb.comments || fb.messenger, sub: 'Free, set up once'},
    {k: 'share', t: 'Share your link', d: shared, sub: 'On Facebook and your Viber groups'}
  ];
}
function nf49HomeHtml(){
  const owner = typeof nf20IsOwner !== 'function' || nf20IsOwner();
  const ideas = (typeof nf22Ideas === 'function' ? nf22Ideas() : []), idea = ideas.length ? ideas[NF22S.idea % ideas.length] : null;
  const it = idea && idea.items && idea.items[0] ? nf48Items().find(x => x.name === idea.items[0]) : null;
  const pick = idea ? (idea.type === 'list' ? 'Your price list' : (idea.items || [])[0] || '') + (it && it.price && idea.type !== 'list' ? ' · ' + nf48P(it.price) : '') : '';
  const wk = nf22Week().filter(x => x.type !== 'share').length, goal = nf22Plan().goal || 3, sent = nf48ListSentThisWeek(), ph = nf49PhotoCount(), fb = nf49FbState(), fbn = ['link', 'comments', 'messenger'].filter(k => fb[k]).length;
  const setup = nf49SetupState(), sd = setup.filter(x => x.d).length;
  const card = (cls, ic, title, sub, status, on, extra) => `<div class="nf49-card ${cls}"><button type="button" class="nf49-cmain" onclick="${on}"><span class="nf49-ic">${nf49Svg(ic, 26)}</span><span class="nf49-ct"><b>${title}</b><small>${sub}</small></span>${status ? `<span class="nf49-cs">${status}</span>` : ''}<span class="nf49-go" aria-hidden="true">›</span></button>${extra || ''}</div>`;
  return `<div class="nf49-hm">
    <h3 class="nf49-q">What do you want to do?</h3>
    <div class="nf49-cards">
      ${card('c-post big', 'megaphone', 'Post something today', 'Nifti picks what to post and writes it. One tap to Facebook or Viber.', idea ? `<em>Today's pick</em>${nf49E(pick)}` : '<em>Start</em>Add items first', "nf49Open('post')",
        `<button type="button" class="nf49-say" onclick="nf48Voice()">${nf49Svg('mic', 18)}<span>Or just say it</span></button>`)}
      ${card('c-list', 'list', "This week's price list", 'One picture of your prices for your Viber groups.', sent ? '<em class="ok">Sent this week ✓</em>' : `<em>${new Date(APP_TODAY + 'T00:00:00').getDay() === 1 ? 'Send it today' : 'Best on Mondays'}</em>`, "nf49Open('list')")}
      ${card('c-photo', 'cam', 'Product photos', 'Plain background and a price tag, ready to post.', ph ? `<em class="ok">${ph} photo${ph === 1 ? '' : 's'} ready</em>` : '<em>Take your first one</em>', "nf49Open('photo')")}
      ${card('c-fb', 'chat', 'Answer buyers automatically', 'Facebook replies "how much?" with your link. Free.', fbn ? `<em class="${fbn === 3 ? 'ok' : ''}">${fbn} of 3 set up</em>` : '<em>5 minutes, once</em>', "nf49Open('fb')")}
    </div>
    <section class="nf49-ready ${sd === setup.length ? 'all' : ''}">
      <header><b>${sd === setup.length ? 'Your store is all set' : 'Get your store ready'}</b><span>${sd} of ${setup.length} done</span><div class="nf49-bar"><u style="width:${Math.round(sd / setup.length * 100)}%"></u></div></header>
      <div class="nf49-chips">${setup.filter(x => owner || (x.k !== 'pay' && x.k !== 'details')).map(x => `<button type="button" class="${x.d ? 'done' : ''}" onclick="${x.k === 'share' ? "nf47Share('link')" : `nf49Open('${x.k}')`}"><i>${x.d ? nf49Svg('check', 15) : ''}</i><span><b>${x.t}</b><small>${x.sub}</small></span></button>`).join('')}</div>
    </section>
    <section class="nf49-wk">
      <div class="nf49-wkl"><b>This week</b><span class="nf49-dots">${Array.from({length: goal}, (_, i) => `<i class="${i < wk ? 'on' : ''}"></i>`).join('')}</span><span>${Math.min(wk, goal)} of ${goal} posts</span></div>
      <div class="nf49-wkr"><button type="button" class="nf43-link" onclick="nf49Open('week')">${nf49Svg('cal', 16)}Plan my week</button><button type="button" class="nf43-link" onclick="nf49Open('buyers')">${nf49Svg('people', 16)}Who ordered</button><button type="button" class="nf43-link" onclick="nf49Open('make')">Make my own post</button></div>
    </section></div>`;
}
// steps inside "Post something today"
function nf49PostSteps(){
  const body = document.getElementById('nf22sBody'); if(!body) return;
  body.querySelectorAll(':scope > .nf47-stback').forEach(b => b.remove());
  if(NF49S.view !== 'post') return;
  const card = body.querySelector('.nf23-post, .nf22-card'); if(!card) return;
  const step = (n, t, cls) => { const h = document.createElement('h3'); h.className = 'nf49-step ' + (cls || ''); h.innerHTML = `<i>${n}</i><span>${t}</span>`; return h; };
  if(!card.querySelector(':scope > .nf49-step.s1')) card.insertBefore(step(1, 'Pick what to post', 's1'), card.firstChild);
  const kind = card.querySelector('.nf23-kind');
  if(kind && !kind.querySelector('.nf49-say2')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'nf49-say2'; b.innerHTML = `${nf49Svg('mic', 17)}<span>Say it instead</span>`; b.onclick = () => nf48Voice(); kind.appendChild(b); }
  const post = card.querySelector('.nf22-post');
  if(post && !card.querySelector('.nf49-step.s2')) post.parentNode.insertBefore(step(2, 'Check the picture and words', 's2'), post);
  const how = card.querySelector('.nf22-post .nf22-how');
  if(how && !how.classList.contains('nf49-step')){ const h = step(3, 'Post it', 's3'); how.replaceWith(h); }
}
(function(){
  if(typeof nf22Top !== 'function' || typeof nf22Paint !== 'function') return;
  nf22Top = function(){ const el = document.createElement('section'); el.className = 'nf22s-top nf49-top'; el.innerHTML = NF49S.view === 'home' ? nf49HeroHtml() : nf49BarHtml(); return el; };
  window.nf22Top = nf22Top;
  const paint = nf22Paint;
  nf22Paint = function(){
    const page = document.querySelector('#storeContent .nf22s'); if(!page) return;
    if(NF49S.view === 'inline' && document.querySelector('#nf22sBody > .nf49-tool')) return;
    if(NF49S.view === 'inline'){ NF49S.view = 'home'; }
    if(NF49S.view === 'home'){
      page.classList.add('nf49-home'); page.classList.remove('nf49-in');
      const top = page.querySelector('.nf22s-top'); if(top) top.replaceWith(nf22Top());
      const body = document.getElementById('nf22sBody'); if(body){ const h = nf49HomeHtml(); if(body.dataset.k49 !== h || !body.querySelector(':scope > .nf49-hm')){ body.dataset.k49 = h; body.innerHTML = h; } }
      const keep = page.querySelector('.nf22s-keep'); if(keep) keep.hidden = true;
      try{ nf48LoadPhotos(); }catch(e){}
      return;
    }
    page.classList.remove('nf49-home'); page.classList.add('nf49-in');
    const body = document.getElementById('nf22sBody'); if(body) delete body.dataset.k49;
    const r = paint.apply(this, arguments);
    try{ nf49PostSteps(); }catch(e){ console.warn('nf49 steps', e); }
    return r;
  };
  window.nf22Paint = nf22Paint;
  // the old tab switches open the matching view
  if(typeof nf47StoreTab === 'function'){ nf47StoreTab = function(t){ const v = {today: 'post', week: 'week', buyers: 'buyers', store: 'details', make: 'make'}[t]; if(v) nf49Open(v); else nf49Home(); }; window.nf47StoreTab = nf47StoreTab; }
  // tools that used to sit on the page now open from the home choices
  if(typeof nf48VoiceMake === 'function'){ const vm = nf48VoiceMake; nf48VoiceMake = function(){ NF49S.view = 'post'; NF49S.title = NF49_VIEWS.post.title; return vm.apply(this, arguments); }; window.nf48VoiceMake = nf48VoiceMake; }
  // coming back to the store page starts at its home
  const nav = navigate;
  navigate = function(pg){ try{ const act = document.querySelector('#view-app .app-page.active'); if(pg === 'store' && !(act && act.id === 'page-store') && NF49S.view !== 'post'){ NF49S.view = 'home'; NF49S.inlineId = null; } }catch(e){} return nav.apply(this, arguments); };
  Object.keys(nav).forEach(k => { try{ navigate[k] = nav[k]; }catch(e){} }); window.navigate = navigate;
})();

/* ---------- header pills: big words that may wrap to two lines, so four still fit in a row ---------- */
(function(){
  if(typeof nf43Fit !== 'function' || typeof nf43Cols !== 'function') return;
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  const tw = (el, txt) => { if(!el) return 0; const cs = getComputedStyle(el); ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return ctx.measureText(txt == null ? (el.textContent || '') : txt).width; };
  nf43Fit = function(row){
    if(!row || !row.isConnected || !row.parentElement) return;
    const n = Number(row.dataset.n) || 0; if(!n) return;
    const phone = document.documentElement.classList.contains('nf-phone') || window.innerWidth <= 760;
    let c = 1;
    if(!phone){
      let need = 0;
      row.querySelectorAll('.nf43-pill').forEach(p => {
        const k = p.querySelector('.k'), v = p.querySelector('.v'), ic = p.querySelector('.ic'), cs = getComputedStyle(p);
        const over = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) * 2 + (ic ? ic.offsetWidth : 0) + parseFloat(cs.columnGap || cs.gap || 0) + 4;
        const words = (k ? k.textContent : '').trim().split(/\s+/), kw = tw(k), longest = Math.max(0, ...words.map(w => tw(k, w)));
        const label = Math.max(longest, kw / 2 + 24);  // two lines at most
        let val = 0;
        if(v && v.classList.contains('nf47-sp')){ const bs = v.querySelectorAll('b'); val = [...bs].reduce((a, b) => a + tw(b), 0) + 44; return need = Math.max(need, val + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 8, label + over); }
        if(v){ const sm = v.querySelector('.sm'); val = tw(v, (v.childNodes[0] && v.childNodes[0].nodeType === 3 ? v.childNodes[0].textContent : v.textContent)) + (sm ? tw(sm) + 8 : 0); }
        need = Math.max(need, over + Math.max(label, val));
      });
      c = nf43Cols(n, row.clientWidth || row.parentElement.clientWidth, need, 14);
    }
    if(row.style.getPropertyValue('--cols') !== String(c)) row.style.setProperty('--cols', String(c));
  };
  window.nf43Fit = nf43Fit;
  const refit = () => document.querySelectorAll('.nf43-pills').forEach(r => { try{ nf43Fit(r); }catch(e){} });
  window.addEventListener('resize', () => { clearTimeout(refit._t); refit._t = setTimeout(refit, 120); });
  if(typeof NF45_AFTER !== 'undefined') NF45_AFTER.push(page => { if(page) page.querySelectorAll('.nf43-pills').forEach(r => { try{ nf43Fit(r); }catch(e){} }); });
})();
