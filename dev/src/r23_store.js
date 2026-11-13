/* ===== Round 23: the online store, simpler. One "Post today" (Nifti's pick, or pick your own in one tap),
   a week planner where each day opens in place with its picture, and step-by-step help for buyers and replies. ===== */

NF22S.pick = 'auto'; NF22S.theme = null; NF22S.openDay = null; NF22S.bstep = null; NF22S.q = 'hm';
if(NF22S.tab === 'make') NF22S.tab = 'today';
NF22_TABS.splice(0, NF22_TABS.length,
  ['today', 'Post today', 'Ready, or pick your own', '<path d="M12 3v3M18.4 5.6l-2.1 2.1M21 12h-3M5.6 5.6l2.1 2.1M3 12h3"/><circle cx="12" cy="14" r="5"/>'],
  ['week', 'My week', 'Plan once, see each post', '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'],
  ['buyers', 'Get more buyers', '6 easy steps', '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M19 8v6M16 11h6"/>'],
  ['reply', 'Reply fast', 'Answers in 2 taps', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8M8 13h5"/>'],
  ['store', 'My store', 'Link and settings', '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>']);
const NF23_KIND_IC = {spot: '📦', list: '📋', sale: '🏷️', new: '📢', deliver: '🚚', hours: '📅', thanks: '🤝'};
const NF23_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const nf23Type = k => NF22_TYPES.find(t => t[0] === k) || ['spot', 'One item', ''];
const nf23Dow = iso => (new Date(iso + 'T00:00:00').getDay() + 6) % 7;
const nf23DayLabel = iso => { try{ return new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}); }catch(e){ return iso; } };
// the items Nifti uses when it makes a post by itself
function nf23AutoItems(type){
  const items = nf22Items(), top = items.slice().sort((a, b) => b.sold - a.sold);
  if(type === 'list') return top.slice(0, 5).map(i => i.name);
  if(type === 'new'){ const idea = nf22Ideas().find(x => x.type === 'new'); return idea ? idea.items : top.slice(0, 3).map(i => i.name); }
  if(type === 'spot' || type === 'sale'){ const idea = nf22Ideas().find(x => x.type === 'spot'); return idea ? idea.items.slice(0, 1) : top.slice(0, 1).map(i => i.name); }
  return [];
}
function nf23Box(spec, o){
  const dots = `<div class="nf23-colors" role="group" aria-label="Picture color"><span>Color</span>${Object.keys(NF22_THEMES).map(k => `<button type="button" data-go="color" data-v="${k}" class="${spec.theme === k ? 'on' : ''}" aria-label="${k}" style="--dot:${NF22_THEMES[k][0]}"></button>`).join('')}</div>`;
  return nf22PostBox(spec, o).replace('</canvas>', '</canvas>' + dots);
}
function nf23Kinds(cur, go, extra){
  return `<div class="nf23-kchips">${extra || ''}${NF22_TYPES.map(([k, t]) => `<button type="button" data-go="${go}" data-v="${k}" class="${cur === k ? 'on' : ''}"><span aria-hidden="true">${NF23_KIND_IC[k]}</span>${t}</button>`).join('')}</div>`;
}

/* ---------- Post today: Nifti's pick, or one tap to pick your own ---------- */
function nf23PostHtml(){
  const ideas = nf22Ideas(), items = nf22Items();
  if(!items.length && !ideas.length) return `<div class="nf22-card"><h3>Add a few items first</h3><p>Nifti makes your posts from your items and prices.</p><button class="btn btn-primary" data-go="stock">Add items</button></div>`;
  const auto = NF22S.pick === 'auto', i = NF22S.idea % Math.max(1, ideas.length), idea = ideas[i] || {type: 'deliver', items: [], tag: 'Delivery day', why: 'People forget you deliver.'};
  const m = NF22S.make; if(!auto) m.type = NF22S.pick;
  const need = ['spot', 'sale', 'list', 'new'].includes(m.type), multi = m.type === 'list' || m.type === 'new';
  if(!auto && need && !m.items.length) m.items = nf23AutoItems(m.type);
  const theme = NF22S.theme || (auto ? ['green', 'blue', 'slate', 'yellow'][i % 4] : m.theme);
  const spec = auto ? {type: idea.type, items: idea.items, theme, tone: 'friendly', lang: NF22S.lang, ver: NF22S.ver}
    : {type: m.type, items: need ? m.items : [], theme, tone: 'friendly', lang: NF22S.lang, ver: NF22S.ver, newPrice: m.newPrice, until: m.until};
  const t = nf23Type(spec.type);
  const pickRow = auto ? '' : need ? (multi
      ? `<div class="nf23-opt"><b>Which items? <small>(up to 6)</small></b><div class="nf22-chips">${items.map(x => `<button type="button" data-go="mitem" data-v="${nf22Esc(x.name)}" class="${m.items.includes(x.name) ? 'on' : ''}">${nf22Esc(x.name)}<small>${nf22P(x.price)}</small></button>`).join('')}</div></div>`
      : `<div class="nf23-opt nf23-inl"><label>Which item?<select data-k="pitem">${items.map(x => `<option value="${nf22Esc(x.name)}" ${m.items[0] === x.name ? 'selected' : ''}>${nf22Esc(x.name)} · ${nf22P(x.price)}</option>`).join('')}</select></label>
        ${m.type === 'sale' ? `<label>Sale price (₱)<input type="number" inputmode="numeric" min="0" data-live="1" data-k="newPrice" value="${nf22Esc(m.newPrice)}" placeholder="e.g. 60"></label><label>Until<input type="text" data-live="1" data-k="until" value="${nf22Esc(m.until)}" placeholder="e.g. Sunday"></label>` : ''}</div>`)
    : m.type === 'hours' ? `<div class="nf23-opt nf23-inl"><label>Which day?<input type="text" data-live="1" data-k="until" value="${nf22Esc(m.until)}" placeholder="e.g. Sunday, Nov 30"></label></div>` : '';
  const next = ideas[(i + 1) % Math.max(1, ideas.length)];
  return `<div class="nf22-card nf23-post"><div class="nf22-h"><div><span class="nf22-tag">${auto ? nf22Esc(idea.tag) : 'Your pick'}</span><h3>${auto ? "Today's post is ready" : nf22Esc(t[1]) + ' post'}</h3>
        <p class="nf22-why">${auto ? `<b>Why this one:</b> ${nf22Esc(idea.why)}` : nf22Esc(t[2]) + '. Change anything below; the picture and words follow.'}</p></div>
        ${auto && ideas.length > 1 ? '<button type="button" class="btn btn-outline" data-go="nextidea">Show me another idea</button>' : ''}</div>
      <div class="nf23-kind"><b>What do you want to post?</b>${nf23Kinds(auto ? '' : m.type, 'pick', `<button type="button" data-go="pick" data-v="auto" class="${auto ? 'on' : ''}"><span aria-hidden="true">⭐</span>Nifti's pick</button>`)}</div>
      ${pickRow}${nf23Box(spec, {photo: spec.type === 'spot' || spec.type === 'sale', id: 1})}</div>
    <div class="nf22-row2"><div class="nf22-card nf22-soft"><h4>Tomorrow</h4><p>${nf22Esc(next ? next.tag + ': ' + next.why : 'Another ready post.')}</p></div>
      <div class="nf22-card nf22-soft"><h4>Real photos sell best</h4><ul class="nf22-ul"><li>Stand near a door or window for light.</li><li>Put the item on a plain floor or wall.</li><li>Show the price tag, or hold one up.</li></ul></div></div>`;
}

/* ---------- My week: each day opens in place and shows its post ---------- */
function nf23Plan(){ const p = nf22Plan(); p.on = p.on || {}; return p; }
function nf23DayInfo(iso, p){
  const sp = nf22Days(iso, 0).filter(x => x.d === iso)[0] || null, dow = nf23Dow(iso);
  const type = Object.prototype.hasOwnProperty.call(p.on, iso) ? p.on[iso] : sp ? sp.type : (p.days[dow] || '');
  return {iso, dow, sp, type, own: Object.prototype.hasOwnProperty.call(p.on, iso)};
}
function nf23DayRow(x, log){
  const open = NF22S.openDay === x.iso, today = x.iso === APP_TODAY, done = log.some(l => l.d === x.iso), t = x.type ? nf23Type(x.type) : null;
  const sub = x.sp ? x.sp.t : x.type ? 'Every ' + NF23_DAYS[x.dow] : 'Tap to add a post';
  let body = '';
  if(open){
    const spec = x.type ? {type: x.type, items: nf23AutoItems(x.type), theme: NF22S.theme || ['green', 'blue', 'slate', 'yellow'][x.dow % 4], tone: 'friendly', lang: NF22S.lang, ver: NF22S.ver, until: x.type === 'hours' ? (x.sp ? x.sp.t.replace(/ \(holiday\)/, '') : NF23_DAYS[x.dow]) : ''} : null;
    body = `<div class="nf23-dbody"><b class="nf23-q">What should Nifti make for ${today ? 'today' : NF23_DAYS[x.dow] + ', ' + nf23DayLabel(x.iso)}?</b>
      ${nf23Kinds(x.type, 'dtype', `<button type="button" data-go="dtype" data-v="" class="${!x.type ? 'on' : ''}"><span aria-hidden="true">—</span>No post</button>`).replace(/data-go="dtype"/g, `data-go="dtype" data-d="${x.iso}"`)}
      <p class="nf23-dnote">${x.sp ? `Only for this day. ${nf22Esc(x.sp.idea)}` : x.type ? `Nifti makes this every ${NF23_DAYS[x.dow]} morning and reminds you.` : 'Pick one and you will see the picture and words right here.'}</p>
      ${spec ? `<div class="nf23-prev"><p class="nf23-pl">${today ? 'Ready now. Post it in 3 steps:' : `This is how it will look on ${NF23_DAYS[x.dow]}. Nifti picks the item from your stock that morning. Want it now? Post it early:`}</p>${nf23Box(spec, {id: 'w' + x.iso.replace(/-/g, '')})}</div>` : ''}</div>`;
  }
  return `<li class="nf23-day${open ? ' open' : ''}${today ? ' today' : ''}${done ? ' done' : ''}${x.sp ? ' sp' : ''}">
    <button type="button" class="nf23-dh" data-go="day" data-v="${x.iso}" aria-expanded="${open}"><span class="nf23-dd"><b>${today ? 'Today' : NF23_DAYS[x.dow].slice(0, 3)}</b><small>${nf23DayLabel(x.iso)}</small></span>
      <span class="nf23-dt">${t ? `<b><span aria-hidden="true">${NF23_KIND_IC[x.type]}</span> ${nf22Esc(t[1])}</b>` : '<b class="nf23-none">No post</b>'}<small>${x.sp ? '<i class="nf23-spd">Good day</i> ' : ''}${nf22Esc(sub)}</small></span>
      <span class="nf23-ds">${done ? '✓ Posted' : today && x.type ? 'Post today' : ''}</span><i class="nf23-chev" aria-hidden="true">›</i></button>${body}</li>`;
}
function nf23WeekHtml(){
  const p = nf23Plan(), log = nf22Log();
  const week = Array.from({length: 7}, (_, k) => nf23DayInfo(addDaysIso(APP_TODAY, k), p));
  const later = nf22Days(addDaysIso(APP_TODAY, 7), 45).filter((x, i, a) => a.findIndex(y => y.d === x.d) === i).slice(0, 5).map(x => nf23DayInfo(x.d, p));
  let team = ['Me']; try{ team = ['Me'].concat((getActiveTeamMembers() || []).map(t => t.name || t.full_name || t.display_name).filter(n => n && !/\(you\)/i.test(n))); }catch(e){}
  const n = Object.keys(p.days).length;
  return `<div class="nf22-card"><div class="nf22-h"><div><h3>Your next 7 days</h3><p>Tap a day to choose what Nifti makes. You see the picture and words right there. On that morning it's ready on your phone; you just tap Share.</p></div>
      <span class="nf23-goal">${n} post${n === 1 ? '' : 's'} a week</span></div>
      <ul class="nf23-days">${week.map(x => nf23DayRow(x, log)).join('')}</ul>
      ${later.length ? `<h4 class="nf23-lh">Good days to post later</h4><p class="nf23-ls">Paydays, holidays and seasons when people fix and buy. Tap one to plan it.</p><ul class="nf23-days">${later.map(x => nf23DayRow(x, log)).join('')}</ul>` : ''}
      <div class="nf23-rem"><b>Reminders</b><div class="nf22-inl nf22-plan"><label>Send it to<select data-k="who">${team.map(t => `<option ${p.who === t || (t === 'Me' && p.who === 'me') ? 'selected' : ''}>${nf22Esc(t)}</option>`).join('')}</select></label>
        <label>At<input type="time" data-k="time" value="${nf22Esc(p.time || '09:00')}"></label>
        <label class="nf22-chk"><input type="checkbox" data-k="remind" ${p.remind ? 'checked' : ''}> Remind me on Telegram <small>(prototype)</small></label>
        <label>Your town fiesta<input type="date" data-k="fiesta" value="${(() => { try{ return localStorage.getItem('nifti-fiesta') || ''; }catch(e){ return ''; } })()}"></label></div>
        <p class="nf22-calm">Missed a day? Nothing breaks. Nifti offers it again tomorrow.</p></div></div>`;
}

/* ---------- Get more buyers: 6 small steps, one open at a time, each with one button ---------- */
function nf23BuyDone(){ try{ return JSON.parse(localStorage.getItem('nifti-buyers-done') || '{}') || {}; }catch(e){ return {}; } }
function nf23BuyersHtml(){
  const s = nf22Shop(), done = nf23BuyDone(), places = [...new Set([s.town].concat(s.areas.split(',').map(x => x.trim())).filter(Boolean))].slice(0, 3);
  const terms = places.flatMap(p => [`buy and sell ${p}`, `${p} contractors`, `${p} home renovation`]).slice(0, 6);
  const g = nf22Groups().slice().sort((a, b) => (a.last || '') < (b.last || '') ? -1 : 1), next = g[0];
  let paid = []; try{ paid = getSupplierPOs().filter(o => o.status === 'paid').slice(0, 3); }catch(e){}
  const steps = [
    {k: 'groups', t: 'Join 3 Facebook groups near you', s: 'Your buyers are already there.', b: `<p>Tap a search. Facebook shows the groups. Join 3 that are near you.</p>
      <div class="nf22-chips">${terms.map(t => `<a class="nf22-chiplink" href="https://www.facebook.com/search/groups/?q=${encodeURIComponent(t)}" target="_blank" rel="noopener">${nf22Esc(t)} ↗</a>`).join('')}</div>
      <details class="nf22-fold nf23-mini"><summary>Group manners that keep you welcome</summary><ul class="nf22-ul"><li>Read the rules first. Some groups only allow selling on certain days.</li><li>Post in each group once a week, not every day.</li><li>Use a real photo and the price. "PM for price" gets ignored.</li></ul></details>`},
    {k: 'rotate', t: 'Post in one group at a time', s: 'Nifti picks the group, so you never post too often.', b: `${next ? `<div class="nf23-next"><span>Post here next</span><b>${nf22Esc(next.name)}</b><small>Last post: ${next.last ? (typeof hmDay === 'function' ? hmDay(next.last) : next.last) : 'never'}</small>
        <div class="nf23-nb">${next.link ? `<a class="btn btn-primary" href="${nf22Esc(next.link)}" target="_blank" rel="noopener">Open the group</a>` : ''}<button type="button" class="btn btn-outline" data-go="gposted" data-v="${nf22Esc(next.name)}">I posted there</button></div></div>` : ''}
      <details class="nf22-fold nf23-mini"><summary>My groups (${g.length})</summary><ul class="nf22-groups">${g.map(x => `<li><div><b>${nf22Esc(x.name)}</b><small>Last post: ${x.last ? (typeof hmDay === 'function' ? hmDay(x.last) : x.last) : 'never'}</small></div><button type="button" class="nf22-link" data-go="gdel" data-v="${nf22Esc(x.name)}">Remove</button></li>`).join('')}</ul>
        <div class="nf22-inl"><label>Group name<input type="text" id="nf22GName" placeholder="e.g. Marikina Buy & Sell"></label><label>Link (optional)<input type="url" id="nf22GLink" placeholder="Paste the group link"></label><button type="button" class="btn btn-outline" data-go="gadd">Add group</button></div></details>`},
    {k: 'market', t: 'Put your best item on Marketplace', s: 'Free, and people search there every day.', b: `<ol class="nf22-ol"><li>Tap <b>Open Marketplace</b>.</li><li>Tap <b>Create new listing</b>, then <b>Item for sale</b>.</li><li>Use the picture and words from <b>Post today</b>, and paste your store link.</li></ol>
      <a class="btn btn-primary" href="https://www.facebook.com/marketplace/create/item" target="_blank" rel="noopener">Open Marketplace ↗</a>`},
    {k: 'poster', t: 'Put a QR poster on your counter', s: 'Walk-in buyers scan it and order from home next time.', b: `<p>Print it, then tape it by the cashier and on your truck.</p><button type="button" class="btn btn-primary" data-go="poster">Print the QR poster</button>`},
    {k: 'reviews', t: 'Ask 3 happy customers for a review', s: 'A good word from a real buyer beats any ad.', b: paid.length ? `<p>These customers paid recently. Tap to send a short, polite ask.</p><ul class="nf22-groups">${paid.map(o => `<li><div><b>${nf22Esc(o.buyerName)}</b><small>Paid ${nf22Esc(o.poNumber)}</small></div><button type="button" class="btn btn-outline" data-go="review" data-v="${nf22Esc(o.buyerName)}">Ask on Viber</button></li>`).join('')}</ul>` : '<p>When a customer pays, they show up here so you can ask them.</p>'},
    {k: 'viber', t: 'Start a Viber group for your suki', s: 'One message reaches all your regular buyers.', b: `<ol class="nf22-ol"><li>In Viber, tap <b>Chats</b>, then the pencil, then <b>New Community</b>.</li><li>Name it "${nf22Esc(s.name)} Suki".</li><li>Send the invite to your buyers.</li></ol><button type="button" class="btn btn-primary" data-go="vinvite">Copy the invite message</button>`}];
  const nDone = steps.filter(x => done[x.k]).length;
  let cur = NF22S.bstep; if(cur === null){ const f = steps.find(x => !done[x.k]); cur = f ? f.k : ''; }
  return `<div class="nf22-card"><div class="nf22-h"><div><h3>6 easy ways to get more buyers</h3><p>Do one at a time. Each takes a few minutes and has one button.</p></div><span class="nf23-goal">${nDone} of 6 done</span></div>
      <div class="nf23-bar" aria-hidden="true"><i style="width:${Math.round(nDone / 6 * 100)}%"></i></div>
      <ol class="nf23-steps">${steps.map((x, i) => { const open = cur === x.k, d = !!done[x.k];
        return `<li class="nf23-step${open ? ' open' : ''}${d ? ' done' : ''}"><button type="button" class="nf23-sh" data-go="bstep" data-v="${x.k}" aria-expanded="${open}"><i>${d ? '✓' : i + 1}</i><span><b>${x.t}</b><small>${x.s}</small></span><em>${d ? 'Done' : ''}</em><i class="nf23-chev" aria-hidden="true">›</i></button>
          ${open ? `<div class="nf23-sb">${x.b}<button type="button" class="nf22-link nf23-did" data-go="bdone" data-v="${x.k}">${d ? 'Mark as not done' : '✓ I did this'}</button></div>` : ''}</li>`; }).join('')}</ol></div>`;
}

/* ---------- Reply fast: pick the item, pick the question, copy ---------- */
function nf23ReplyHtml(){
  const items = nf22Items(), it = items.find(i => i.name === NF22S.replyItem) || items[0], en = NF22S.lang === 'en';
  const q = NF22_QS.find(x => x[0] === NF22S.q), ans = q ? nf22Reply(q[0], it, en) : '';
  return `<div class="nf22-card nf23-reply"><div class="nf22-h"><div><h3>Answer buyers in 2 taps</h3><p>Pick the item, then what they asked. Copy the answer and paste it as your reply in Facebook or Viber.</p></div>
      <div class="nf22-lang" role="group" aria-label="Language">${[['tl', 'Taglish'], ['en', 'English']].map(([k, l]) => `<button type="button" data-go="lang" data-v="${k}" class="${(en ? 'en' : 'tl') === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="nf23-r"><b><i>1</i>Which item are they asking about?</b><select data-k="replyItem" aria-label="Item">${items.map(i => `<option ${it && i.name === it.name ? 'selected' : ''}>${nf22Esc(i.name)}</option>`).join('')}</select></div>
      <div class="nf23-r"><b><i>2</i>What did they ask?</b><div class="nf23-qs">${NF22_QS.map(([k, tq, eq]) => `<button type="button" data-go="q" data-v="${k}" class="${NF22S.q === k ? 'on' : ''}"><b>"${nf22Esc(tq)}"</b><small>${nf22Esc(eq)}</small></button>`).join('')}</div></div>
      ${q ? `<div class="nf23-ans"><span>Your answer</span><p>${nf22Esc(ans)}</p><button type="button" class="btn btn-primary" data-go="copyreply" data-v="${nf22Esc(ans)}">Copy the answer</button></div>` : ''}
      <p class="nf22-calm">Answer fast. People usually buy from whoever replies first.</p></div>`;
}

/* ---------- My store: the right link, steps in order, plain buttons ---------- */
function nf23StoreFix(){
  const keep = document.querySelector('#storeContent .nf22s-keep'); if(!keep) return;
  const s = nf22Shop();
  if(!(typeof myBusiness !== 'undefined' && myBusiness)){
    keep.querySelectorAll('a[href], button[onclick]').forEach(a => { ['href', 'onclick'].forEach(k => { const v = a.getAttribute(k); if(v && /metro-steel-co/.test(v)) a.setAttribute(k, v.replace(/metro-steel-co/g, s.slug)); }); });
  }
  keep.querySelectorAll('.nfs-card .nfs-h > i').forEach((n, i) => { n.textContent = String(i + 1); });
  keep.querySelectorAll('.pro-badge').forEach(b => b.remove());
}

/* ---------- wiring ---------- */
(function(){
  try{ nf22TodayHtml = nf23PostHtml; nf22WeekHtml = nf23WeekHtml; nf22BuyersHtml = nf23BuyersHtml; nf22ReplyHtml = nf23ReplyHtml; }catch(e){ console.warn('nf23 store', e); }
  const go0 = nf22Go;
  nf22Go = function(k, el){
    const v = el.dataset.v;
    if(k === 'pick'){ NF22S.pick = v; NF22S.ver = 0; if(v !== 'auto'){ NF22S.make.type = v; NF22S.make.items = []; } nf22Paint(); return; }
    if(k === 'color'){ NF22S.theme = v; NF22S.make.theme = v; nf22Paint(); return; }
    if(k === 'day'){ NF22S.openDay = NF22S.openDay === v ? null : v; nf22Paint(); const li = document.querySelector(`#nf22sBody [data-go="day"][data-v="${v}"]`); if(li && NF22S.openDay) li.scrollIntoView({block: 'nearest', behavior: 'smooth'}); return; }
    if(k === 'dtype'){ const p = nf23Plan(), iso = el.dataset.d, x = nf23DayInfo(iso, p);
      if(x.sp || x.own){ p.on[iso] = v; } else { if(v) p.days[x.dow] = v; else delete p.days[x.dow]; }
      p.goal = Math.max(1, Object.keys(p.days).length); nf22SavePlan(p); nf22Paint(); return; }
    if(k === 'bstep'){ NF22S.bstep = NF22S.bstep === v ? '' : v; nf22Paint(); return; }
    if(k === 'bdone'){ const d = nf23BuyDone(); d[v] = !d[v]; try{ localStorage.setItem('nifti-buyers-done', JSON.stringify(d)); }catch(e){} if(d[v]){ showToast('Nice. One step closer to more buyers.', 'success'); NF22S.bstep = null; } nf22Paint(); return; }
    if(k === 'q'){ NF22S.q = v; nf22Paint(); const a = document.querySelector('#nf22sBody .nf23-ans'); if(a) a.scrollIntoView({block: 'nearest', behavior: 'smooth'}); return; }
    if(k === 'calpost'){ NF22S.pick = v || 'list'; NF22S.make.type = NF22S.pick; NF22S.make.items = []; NF22S.tab = 'today'; nf22Paint(); return; }
    return go0(k, el);
  };
  const ch0 = nf22Change;
  nf22Change = function(e){
    const t = e.target, k = t.dataset && t.dataset.k;
    if(k === 'pitem'){ NF22S.make.items = [t.value]; nf22Paint(); return; }
    if(k === 'day') return;
    return ch0(e);
  };
  const p0 = nf22Paint;
  nf22Paint = function(){ const out = p0.apply(this, arguments); try{ nf23StoreFix(); }catch(e){} return out; };
})();
