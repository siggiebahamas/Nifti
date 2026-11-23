/* ===== Round 54: header buttons sit together + Setup coach that walks new shops through everything ===== */

/* ---------- 1. header buttons: grouped on the right, and moved onto the toolbar row below when that row has room ---------- */
function nf55Heads(){
  const pg = document.querySelector('#view-app .app-page.active'); if(!pg) return;
  const head = pg.querySelector(':scope > .page-head') || pg.querySelector('.page-head'); if(!head || head.offsetParent === null) return;
  pg.querySelectorAll('.nf55-bar').forEach(x => { const w = x.parentElement; if(w && w === head.nextElementSibling && w.firstElementChild !== x) w.insertBefore(x, w.firstChild); });
  const btns = [...head.children].filter(c => c.matches('button, a.btn, .nf45-teamhd, .bk-head-act') && c.offsetParent !== null);
  if(!btns.length || btns.some(b => b.matches('.nf45-teamhd'))) return;
  if(innerWidth <= 760) return;
  pg.querySelectorAll('.nf55-acts').forEach(a => a.remove()); // a redraw put fresh buttons back in the header
  const have = [...pg.querySelectorAll('.nf55-bar')].find(x => x.offsetParent !== null);
  if(have){ const acts = document.createElement('div'); acts.className = 'nf55-acts'; btns.forEach(b => acts.appendChild(b)); have.appendChild(acts); return; }
  let next = head.nextElementSibling; while(next && (next.offsetParent === null || next.matches('.nf53-vb, script, style'))) next = next.nextElementSibling;
  if(!next) return;
  const ok = el => { if(!el || el.offsetParent === null || el.classList.contains('nf55-bar') || el.closest('.nf55-bar')) return false;
    const r = el.getBoundingClientRect(); if(r.height < 24 || r.height > 72) return false;
    if(el.querySelector('table, .card, .mosaic, [class*="tile"]') || /card|panel|banner|tile|grid/.test(el.className)) return false;
    if(!el.querySelector('select, input, button, .chip, [class*="chip"]') && !el.matches('select')) return false;
    let right = r.left; [...el.querySelectorAll('*')].forEach(c => { if(c.offsetParent === null || /^(OPTION|svg|path)$/i.test(c.tagName)) return; const cr = c.getBoundingClientRect(); if(cr.width && cr.width < r.width * .9 && cr.right > right) right = cr.right; });
    const need = btns.reduce((a, b) => a + b.getBoundingClientRect().width + 10, 0);
    return r.right - right >= need + 24; };
  if(next.querySelector(':scope > .nf55-bar') || next.classList.contains('nf55-bar')) return;
  if(!ok(next)) next = ok(next.firstElementChild) ? next.firstElementChild : null;
  if(!next) return;
  const bar = document.createElement('div'); bar.className = 'nf55-bar';
  next.parentNode.insertBefore(bar, next); bar.appendChild(next);
  const acts = document.createElement('div'); acts.className = 'nf55-acts'; btns.forEach(b => acts.appendChild(b)); bar.appendChild(acts);
}

/* ---------- 2. Setup coach ---------- */
const NF55_KEY = () => 'nifti-coach:' + ((typeof myBusiness !== 'undefined' && myBusiness && myBusiness.id) || 'demo');
function nf55St(){ try{ return JSON.parse(localStorage.getItem(NF55_KEY()) || '{}') || {}; }catch(e){ return {}; } }
function nf55Set(k, v){ const s = nf55St(); s[k] = v; try{ localStorage.setItem(NF55_KEY(), JSON.stringify(s)); }catch(e){} }
function nf55Len(n){ try{ const v = window[n] !== undefined ? window[n] : eval(n); return Array.isArray(v) ? v.length : 0; }catch(e){ return 0; } }
// each step: what, why (one line), minutes, where to go, what to point at, and how we know it's done
const NF55_STEPS = [
  {k: 'items', e: '📦', t: 'Add your items', why: 'Everything else (orders, prices, stock) uses your item list.', min: 5, go: 'inventory', txt: /add items|add your items/i, spot: '.nf47-addbtn, .app-page.active .page-head .btn-primary', tip: 'Tap here. Pick your kind of shop for 50 ready items, or upload your Excel.', done: () => nf55Len('inventoryData') >= 5},
  {k: 'cust', e: '🧑‍🤝‍🧑', t: 'Add your first customer', why: 'So you can send them orders and see who owes you.', min: 2, go: 'collections', act: () => { if(typeof openAddCustomerForm === 'function') openAddCustomerForm(); }, tip: 'Type their name and Viber number. That is all.', done: () => nf55Len('buyersData') >= 1},
  {k: 'sup', e: '🏭', t: 'Add your first supplier', why: 'So you can order from them and track what you owe.', min: 2, go: 'suppliers', txt: /add (a )?supplier|new supplier|\+ ?add/i, spot: '.app-page.active .page-head .btn-primary, .app-page.active .btn-primary', tip: 'Tap here and add the supplier you buy from most.', done: () => nf55Len('suppliersData') >= 1},
  {k: 'order', e: '🧾', t: 'Make your first order', why: 'See how a customer confirms with one tap on Viber.', min: 3, go: 'orders', txt: /new order/i, spot: '.app-page.active .btn-primary', tip: 'Tap here, choose the customer, and paste their Viber message or type the items.', manual: true},
  {k: 'owes', e: '💰', t: 'Check who owes you', why: 'Old unpaid bills go here. Reminders can go out by themselves.', min: 1, go: 'collections', tip: 'This list is your money still out. Tap Remind on anyone late.', visit: true},
  {k: 'sale', e: '🛒', t: 'Record a walk-in sale', why: 'Counter sales keep your stock and cash drawer right.', min: 1, go: 'sales', txt: /new sale/i, spot: '.app-page.active .page-head .btn-primary, .app-page.active .btn-primary', tip: 'Tap here, pick the items, and choose how they paid.', manual: true},
  {k: 'exp', e: '🧾', t: 'Add one expense', why: 'So your profit is real profit.', min: 1, go: 'expenses', txt: /add expense/i, spot: '.app-page.active .page-head .btn-primary, .app-page.active .btn-primary', tip: 'Tap here and snap a receipt (diesel, rent, power).', manual: true},
  {k: 'team', e: '👥', t: 'Invite your staff (optional)', why: 'Each person sees only the pages you allow.', min: 2, go: 'team', txt: /add or manage people|add people|invite/i, tip: 'Tap "Add or manage people", then choose what they can see.', manual: true, opt: true},
  {k: 'store', e: '🏪', t: 'Open your online store (optional)', why: 'A link where buyers order and pay by GCash, Maya or COD.', min: 3, go: 'store', tip: 'Follow the steps on this page. Your store is ready in about 2 minutes.', manual: true, opt: true},
  {k: 'alerts', e: '🔔', t: 'Get alerts on your phone (optional)', why: 'New orders and payments reach you even when Nifti is closed.', min: 2, go: 'settings', tip: 'Search "alerts" in Settings and follow the steps.', manual: true, opt: true}
];
const NF55 = {open: false, spotT: null};
function nf55Done(s, st){ st = st || nf55St(); if(st['d_' + s.k]) return true; try{ return !!(s.done && s.done()); }catch(e){ return false; } }
function nf55Allowed(){ try{ if(typeof isPrivilegedUser === 'function' && !isPrivilegedUser()) return false; }catch(e){ return false; } const app=document.querySelector('#view-app:not(.hidden)'); const home=document.getElementById('mhHome'); const realBusiness=typeof myBusiness!=='undefined' && !!myBusiness; const demo=typeof nfIsDemo==='function' && nfIsDemo(); return !!(app && home && realBusiness && !demo); }
function nf55Paint(){
  const st = nf55St();
  let dock = document.getElementById('nf55Dock');
  if(!nf55Allowed() || st.off){ if(dock) dock.remove(); document.body.classList.remove('nf55-on'); return; }
  const steps = NF55_STEPS, done = steps.filter(s => nf55Done(s, st)), must = steps.filter(s => !s.opt), mustDone = must.filter(s => nf55Done(s, st)).length;
  const nextS = steps.find(s => !nf55Done(s, st) && !st['skip_' + s.k]) || steps.find(s => !nf55Done(s, st));
  // celebrate newly finished steps
  const was = st.seenDone || []; const fresh = done.map(s => s.k).filter(k => !was.includes(k));
  if(fresh.length && st.started){ nf55Set('seenDone', done.map(s => s.k)); fresh.forEach(k => { const s = steps.find(x => x.k === k); nf55Cheer(s, done.length, steps.length); }); }
  else if(!st.seenDone){ nf55Set('seenDone', done.map(s => s.k)); }
  if(!dock){ dock = document.createElement('div'); dock.id = 'nf55Dock'; document.body.appendChild(dock); }
  document.body.classList.add('nf55-on');
  dock.style.left = '';
  const pct = Math.round(done.length / steps.length * 100), allMust = mustDone === must.length;
  const sig = [NF55.open, done.length, nextS && nextS.k, st.mini ? 1 : 0, JSON.stringify(Object.keys(st).filter(k => /^skip_|^d_/.test(k)))].join('|');
  if(dock.dataset.sig === sig) return; dock.dataset.sig = sig;
  const ring = `<svg class="nf55-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="4"/><circle cx="18" cy="18" r="15.5" fill="none" stroke="#FDE047" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(pct * 97.4 / 100).toFixed(1)} 97.4" transform="rotate(-90 18 18)"/></svg>`;
  if(!NF55.open){
    dock.className = 'nf55-dock' + (st.mini ? ' mini' : '');
    dock.innerHTML = st.mini ? `<button type="button" class="nf55-pill mini" onclick="nf55Set('mini',false);nf55Open()" aria-label="Open setup coach">${ring}<b>${done.length}/${steps.length}</b></button>`
      : `<button type="button" class="nf55-pill" onclick="nf55Open()">${ring}<span><small>${allMust ? 'Setup done · extras left' : `Set up your shop · ${done.length} of ${steps.length}`}</small><b>${nextS ? (allMust ? '' : 'Next: ') + nextS.t : 'All done!'}</b></span><i aria-hidden="true">›</i></button><button type="button" class="nf55-min" onclick="nf55Set('mini',true);nf55Paint()" aria-label="Make smaller">–</button>`;
    return;
  }
  dock.className = 'nf55-dock open';
  const left = steps.filter(s => !nf55Done(s, st)).reduce((a, s) => a + s.min, 0);
  dock.innerHTML = `<div class="nf55-panel" role="dialog" aria-label="Setup coach">
    <div class="nf55-ph">${ring}<div><b>${allMust ? 'The basics are done 🎉' : "Let's set up your shop together"}</b><small>${done.length} of ${steps.length} done${left ? ` · about ${left} min left` : ''} · any order is fine</small></div><button type="button" class="nf55-x" onclick="nf55Close()" aria-label="Close">×</button></div>
    <div class="nf55-list">${steps.map((s, i) => { const d = nf55Done(s, st), cur = nextS && s.k === nextS.k, sk = st['skip_' + s.k];
      return `<div class="nf55-step${d ? ' done' : ''}${cur ? ' cur' : ''}${sk && !d ? ' skip' : ''}">
        <div class="nf55-sh" onclick="nf55Toggle('${s.k}')"><span class="nf55-n">${d ? '✓' : i + 1}</span><span class="nf55-e" aria-hidden="true">${s.e}</span><b>${s.t}</b><em>${d ? 'Done' : s.min + ' min'}</em></div>
        ${cur || st.exp === s.k ? `<div class="nf55-sb"><p>${s.why}</p><div class="nf55-btns">${d ? `<button type="button" class="btn btn-outline btn-sm" onclick="nf55Show('${s.k}')">Show me again</button>` : `<button type="button" class="btn btn-primary btn-sm" onclick="nf55Show('${s.k}')">Show me how →</button>${s.manual || s.visit ? `<button type="button" class="btn btn-outline btn-sm" onclick="nf55Mark('${s.k}')">I did it ✓</button>` : ''}${!sk ? `<button type="button" class="nf55-skip" onclick="nf55Skip('${s.k}')">Later</button>` : ''}`}</div></div>` : ''}
      </div>`; }).join('')}</div>
    <div class="nf55-pf"><button type="button" class="nf55-skip" onclick="nf55Off()">Hide the coach</button><span>Stuck? Tap <b>Help</b> any time.</span></div></div>`;
}
function nf55Open(){ NF55.open = true; nf55Set('started', true); nf55Paint(); }
function nf55Close(){ NF55.open = false; nf55Paint(); }
function nf55Toggle(k){ const st = nf55St(); nf55Set('exp', st.exp === k ? '' : k); nf55Paint(); }
function nf55Skip(k){ nf55Set('skip_' + k, true); nf55Set('exp', ''); nf55Paint(); }
function nf55Mark(k){ nf55Set('d_' + k, true); nf55Paint(); }
function nf55Off(){ nf55Set('off', true); NF55.open = false; nf55Paint(); if(typeof showToast === 'function') showToast('Coach hidden. Turn it back on in Settings.', 'success'); }
function nf55On(){ nf55Set('off', false); nf55Set('mini', false); nf55Paint(); }
// go to the page, open the right tool, and point at the exact button with one plain sentence
function nf55Show(k){
  const s = NF55_STEPS.find(x => x.k === k); if(!s) return;
  nf55Set('started', true); NF55.open = false; nf55Paint();
  try{ navigate(s.go); }catch(e){}
  if(s.visit) setTimeout(() => nf55Mark(k), 2500);
  setTimeout(() => {
    if(s.act){ try{ s.act(); }catch(e){} nf55Tip(null, s); return; }
    let el = null;
    if(s.txt) el = [...document.querySelectorAll('#view-app .app-page.active button, #view-app .app-page.active a.btn')].find(x => x.offsetParent !== null && s.txt.test(x.textContent.trim()) && x.getBoundingClientRect().width > 20) || null;
    if(!el && s.spot) for(const sel of s.spot.split(',')){ el = [...document.querySelectorAll(sel.trim())].find(x => x.offsetParent !== null && x.getBoundingClientRect().width > 20); if(el) break; }
    nf55Tip(el, s);
  }, 700);
}
function nf55Tip(el, s){
  nf55TipOff();
  const w = document.createElement('div'); w.id = 'nf55Tip'; w.className = 'nf55-tip';
  w.innerHTML = `<div class="nf55-tb"><span aria-hidden="true">${s.e}</span><div><b>${s.t}</b><p>${s.tip}</p></div><button type="button" onclick="nf55TipOff()" aria-label="Close">Got it</button></div>`;
  document.body.appendChild(w);
  if(el){
    el.scrollIntoView({block: 'center', behavior: 'smooth'});
    const ring = document.createElement('div'); ring.id = 'nf55Ring'; ring.className = 'nf55-spot'; document.body.appendChild(ring);
    const place = () => { if(!document.body.contains(el) || el.offsetParent === null){ nf55TipOff(); return; } const r = el.getBoundingClientRect();
      Object.assign(ring.style, {left: (r.left - 6) + 'px', top: (r.top - 6) + 'px', width: (r.width + 12) + 'px', height: (r.height + 12) + 'px'});
      const below = r.bottom + 170 < innerHeight, tw = Math.min(360, innerWidth - 24);
      Object.assign(w.style, {width: tw + 'px', left: Math.max(12, Math.min(innerWidth - tw - 12, r.left + r.width / 2 - tw / 2)) + 'px', top: (below ? r.bottom + 14 : Math.max(12, r.top - 14 - w.offsetHeight)) + 'px'});
      w.classList.toggle('up', !below); };
    place(); NF55.spotT = setInterval(place, 120);
    el.addEventListener('click', nf55TipOff, {once: true});
  } else w.classList.add('float');
  setTimeout(() => { document.addEventListener('click', nf55TipAway, true); }, 50);
}
function nf55TipAway(e){ const w = document.getElementById('nf55Tip'); if(w && !w.contains(e.target)) nf55TipOff(); }
function nf55TipOff(){ clearInterval(NF55.spotT); ['nf55Tip', 'nf55Ring'].forEach(id => { const x = document.getElementById(id); if(x) x.remove(); }); document.removeEventListener('click', nf55TipAway, true); }
function nf55Cheer(s, n, of){
  const c = document.createElement('div'); c.className = 'nf55-cheer';
  c.innerHTML = `<span class="nf55-burst" aria-hidden="true">${'<i></i>'.repeat(12)}</span><b>${n === of ? 'Your shop is fully set up! 🎉' : 'Nice! ' + s.t.replace(' (optional)', '') + ' ✓'}</b><small>${n === of ? 'You are ready to run your day in Nifti.' : `${n} of ${of} done. Keep going, you're doing great.`}</small>`;
  document.body.appendChild(c); setTimeout(() => c.classList.add('out'), 2600); setTimeout(() => c.remove(), 3200);
}
// Settings: bring the coach back
function nf55SettingsLine(){
  const pg = document.getElementById('page-settings'); if(!pg || pg.offsetParent === null || pg.querySelector('.nf55-set')) return;
  const d = document.createElement('div'); d.className = 'nf53-set nf55-set'; d.innerHTML = '<span><b>Setup coach</b> Step-by-step help to set up your shop.</span><button class="btn btn-outline btn-sm" onclick="nf55On()">Show coach</button>';
  const a = pg.querySelector('.nf53-set'); if(a) a.insertAdjacentElement('afterend', d); else pg.insertBefore(d, pg.firstChild);
}
NF45_AFTER.push(() => { try{ nf55Heads(); }catch(e){} nf55Paint(); nf55SettingsLine(); });
setInterval(() => { if(!document.hidden){ try{ nf55Heads(); }catch(e){} nf55Paint(); } }, 2000);
// never cover anything: hide the dock while a popup or side panel is open
function nf55Overlay(){ return [...document.querySelectorAll('.modal-overlay, .modal.show, .nf20-ov, .sl-modal, .sl-sheet, [role="dialog"], .nf43-frame, #nfwModal, .nf48-side, .nf53-ov')].some(x => !x.closest('#nf55Dock') && !x.hidden && x.offsetParent !== null && x.getBoundingClientRect().width > 200); }
setInterval(() => { const d = document.getElementById('nf55Dock'); if(!d || NF55.open) return; d.classList.toggle('away', nf55Overlay()); }, 400);
