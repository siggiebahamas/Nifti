/* ===== Round 83 ===== */
function nf83E(s){ return escapeHtml(String(s == null ? '' : s)); }
/* any dark button (green, black, red) always shows white text and icons, wherever it is */
function nf83Lum(c){ const m = String(c || '').match(/[\d.]+/g); if(!m) return null; const [r, g, b, a] = m.map(Number); if(m.length > 3 && a < 0.6) return null; const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); }
function nf83FixContrast(root){
  try{
    (root || document).querySelectorAll('button, a.btn, .btn, [role="button"], label.nf82-btn, .nf77-b, .nf53-btn').forEach(el => {
      if(el.classList.contains('nf83-lt') || !el.offsetParent) return;
      const cs = getComputedStyle(el), lb = nf83Lum(cs.backgroundColor); if(lb == null || lb > 0.2) return;
      const lt = nf83Lum(cs.color); if(lt != null && lt < 0.45) el.classList.add('nf83-lt');
    });
  }catch(e){}
}
NF45_AFTER.push(page => { try{ nf83FixContrast(page || document); }catch(e){} });
(function(){ if(typeof slModal !== 'function' || slModal._nf83) return; const base = slModal; const w = function(){ const m = base.apply(this, arguments); setTimeout(() => nf83FixContrast(m || document), 30); return m; }; Object.assign(w, base); w._nf83 = true; slModal = w; window.slModal = w; })();
setInterval(() => { if(document.visibilityState === 'visible') nf83FixContrast(document); }, 2000);

/* ---------- Expenses: undo an edit, bring back a removed expense; "Staff advance" without "(vale)" ---------- */
function nf83XKey(){ return 'nifti-exp-undo:' + (myBusiness ? myBusiness.id : 'demo'); }
function nf83XLog(){ try{ return JSON.parse(localStorage.getItem(nf83XKey()) || '[]'); }catch(e){ return []; } }
function nf83XPush(it){ const l = [it].concat(nf83XLog()).slice(0, 20); try{ localStorage.setItem(nf83XKey(), JSON.stringify(l)); }catch(e){} }
const NF83_XF = ['category', 'amount', 'paidFrom', 'date', 'vendor', 'staff', 'note', 'repeat'];
function nf83XRow(o){ return {category: o.category, amount: o.amount, paid_from: o.paidFrom, spent_on: o.date, vendor: o.vendor || null, staff_name: o.staff || null, note: o.note || null, repeat_monthly: !!o.repeat}; }
if(typeof exSave === 'function' && !exSave._nf83){ const _xs = exSave; exSave = async function(){ const id = EXF && EXF.id, e = id && BK.expenses.find(x => x.id === id), before = e ? NF83_XF.reduce((a, k) => (a[k] = e[k], a), {}) : null; const r = await _xs.apply(this, arguments);
  try{ const now = id && BK.expenses.find(x => x.id === id); if(before && now && NF83_XF.some(k => String(before[k] ?? '') !== String(now[k] ?? ''))) nf83XPush({t: 'edit', id, before, label: now.category, amt: now.amount, was: before.amount, at: new Date().toISOString()}); setTimeout(nf83XPaint, 120); }catch(err){} return r; }; exSave._nf83 = true; window.exSave = exSave; }
if(typeof bkRemoveExpense === 'function' && !bkRemoveExpense._nf83){ const _xr = bkRemoveExpense; bkRemoveExpense = async function(id){ const r = await _xr.apply(this, arguments); try{ const e = BK.expenses.find(x => x.id === id); if(e && e.deletedAt) nf83XPush({t: 'remove', id, label: e.category, amt: e.amount, at: new Date().toISOString()}); setTimeout(nf83XPaint, 120); }catch(err){} return r; }; bkRemoveExpense._nf83 = true; window.bkRemoveExpense = bkRemoveExpense; }
async function nf83XUndo(i){
  const l = nf83XLog(), it = l[i]; if(!it) return; const e = BK.expenses.find(x => x.id === it.id); if(!e){ showToast('That expense is no longer here.', 'warn'); return; }
  if(it.t === 'edit'){ if(myBusiness){ const { error } = await sb.from('expenses').update(nf83XRow(it.before)).eq('id', it.id); if(error){ showToast(error.message, 'error'); return; } } Object.assign(e, it.before); showToast(`${e.category} is back to how it was.`, 'success'); }
  else { if(myBusiness){ const { error } = await sb.from('expenses').update({deleted_at: null, delete_reason: null}).eq('id', it.id); if(error){ showToast(error.message, 'error'); return; } } e.deletedAt = null; e.deleteReason = ''; showToast(`${e.category} ${nf83P(e.amount)} is back.`, 'success'); }
  l.splice(i, 1); try{ localStorage.setItem(nf83XKey(), JSON.stringify(l)); }catch(err){} try{ bkSaveDemo(); }catch(err){} bkRefreshViews(); setTimeout(nf83XPaint, 150);
}
function nf83P(n){ return typeof bkPeso === 'function' ? bkPeso(n) : fmtPHP(n); }
function nf83Ago(iso){ const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; }
function nf83XPaint(){
  const pg = document.getElementById('page-expenses'); if(!pg || !pg.classList.contains('active')) return;
  const sec = [...pg.querySelectorAll('section.panel-card')].find(s => /^All expenses/.test(((s.querySelector('.panel-head h2') || {}).textContent || '').trim())); if(!sec) return;
  const l = nf83XLog().filter(it => { const e = BK.expenses.find(x => x.id === it.id); return e && (it.t === 'edit' || e.deletedAt); }).slice(0, 5);
  const known = new Set(l.filter(x => x.t === 'remove').map(x => x.id));
  const old = (BK.expenses || []).filter(e => e.deletedAt && !known.has(e.id) && daysBetween(String(e.deletedAt).slice(0, 10), APP_TODAY) <= 30).slice(0, 5).map(e => ({t: 'remove', id: e.id, label: e.category, amt: e.amount, at: e.deletedAt, old: true}));
  const all = l.concat(old); let box = sec.querySelector('.nf83-chg');
  if(!all.length){ if(box) box.remove(); return; }
  const full = nf83XLog();
  const html = `<div class="h">${'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>'}<b>Recent changes</b><span>Undo a change or bring back something removed by mistake.</span></div>
    ${all.map(it => { const i = full.findIndex(x => x.id === it.id && x.at === it.at && x.t === it.t); const lbl = it.t === 'edit' ? `Edited <b>${nf83E(it.label)}</b>${it.was != null && it.was !== it.amt ? ` · ${nf83P(it.was)} → ${nf83P(it.amt)}` : ''}` : `Removed <b>${nf83E(it.label)}</b> · ${nf83P(it.amt)}`;
      return `<div class="r"><span>${lbl} <em>${nf83E(nf83Ago(it.at))}</em></span>${it.old ? `<button type="button" class="nf82-btn s" onclick="nf83XBring('${it.id}')">Bring back</button>` : `<button type="button" class="nf82-btn s" onclick="nf83XUndo(${i})">${it.t === 'edit' ? 'Undo' : 'Bring back'}</button>`}</div>`; }).join('')}`;
  if(!box){ box = document.createElement('div'); box.className = 'nf83-chg'; const head = sec.querySelector('.panel-head'); if(head) head.insertAdjacentElement('afterend', box); else sec.prepend(box); }
  if(box.dataset.k !== html){ box.dataset.k = html; box.innerHTML = html; }
}
async function nf83XBring(id){ nf83XPush({t: 'remove', id, label: '', amt: 0, at: new Date().toISOString()}); await nf83XUndo(0); }
function nf83Vale(root){ try{ const w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT); let n; const hit = []; while((n = w.nextNode())){ if(n.nodeValue.indexOf('(vale)') >= 0) hit.push(n); } hit.forEach(t => { t.nodeValue = t.nodeValue.replace(/\s*\(vale\)/g, ''); }); }catch(e){} }
NF45_AFTER.push(page => { try{ if(page && page.id === 'page-expenses'){ nf83XPaint(); nf83Vale(page); } }catch(e){} });
(function(){ if(typeof exRender !== 'function' || exRender._nf83) return; const _er = exRender; exRender = function(){ const r = _er.apply(this, arguments); try{ document.querySelectorAll('.share-modal-backdrop').forEach(m => nf83Vale(m)); }catch(e){} return r; }; exRender._nf83 = true; window.exRender = exRender; })();

/* ---------- Phone: 5 buttons for the daily jobs. Everything else is in Menu (with its red counts). ---------- */
const NF83_BB = [['dashboard', 'Home', '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'], ['sales', 'Sell', '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/>'], ['collections', 'Get paid', '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h4"/>'], ['inventory', 'Stock', '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>']];
function nf83Num(id){ const b = document.getElementById(id); return b && b.style.display !== 'none' ? (parseInt(b.textContent, 10) || 0) : 0; }
function nf83BottomBar(){
  const bn = document.getElementById('bottomNav'); if(!bn) return;
  bn.classList.add('nf83-bb');
  [...bn.children].forEach(c => { if(!c.classList.contains('nf83-b') && !c.classList.contains('nf83-hid')) c.classList.add('nf83-hid'); });
  let wrap = bn.querySelector('.nf83-b'); if(!wrap){ NF83_BB.forEach(([p, l, ic]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'bnav-item nf83-b'; b.dataset.page = p; b.setAttribute('aria-label', l); b.onclick = () => { go(p); }; b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg><span class="bnav-label">${l}</span>`; bn.appendChild(b); });
    const m = document.createElement('button'); m.type = 'button'; m.className = 'bnav-item nf83-b nf83-menu'; m.setAttribute('aria-label', 'Menu: every page'); m.onclick = () => { if(typeof toggleMobileSidebar === 'function') toggleMobileSidebar(); else if(typeof openMoreSheet === 'function') openMoreSheet(); };
    m.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span class="bnav-label">Menu</span><span class="nf83-bd" hidden></span>'; bn.appendChild(m); }
  const n = nf83Num('ordersNavBadge') + nf83Num('messagesNavBadge'), bd = bn.querySelector('.nf83-bd'); if(bd){ bd.hidden = !n; bd.textContent = n > 99 ? '99+' : String(n); }
  const act = (document.querySelector('#view-app .app-page.active') || {}).id || ''; bn.querySelectorAll('.nf83-b[data-page]').forEach(b => b.classList.toggle('active', act === 'page-' + b.dataset.page));
  [...bn.children].forEach(c => { if(!c.classList.contains('nf83-b')) c.classList.add('nf83-hid'); });
}
NF45_AFTER.push(() => { try{ if(innerWidth <= 980) nf83BottomBar(); }catch(e){} });
setInterval(() => { try{ if(innerWidth <= 980) nf83BottomBar(); }catch(e){} }, 1500);

/* ---------- BIR 2307 on a phone: one switch only (From customers / To suppliers), not a second Selling/Buying one ---------- */
try{ if(typeof nf26SideSwitch === 'function' && !nf26SideSwitch._nf83){ const o = nf26SideSwitch; nf26SideSwitch = function(page){ if(page && page.id === 'page-taxforms'){ const sw = page.querySelector('.nf26-side'); if(sw) sw.remove(); page.querySelectorAll('.nf26-off').forEach(x => x.classList.remove('nf26-off')); return; } return o.apply(this, arguments); }; nf26SideSwitch._nf83 = 1; window.nf26SideSwitch = nf26SideSwitch; } }catch(e){}
/* Orders subtitle: "left/right" only makes sense on a wide screen */
NF45_AFTER.push(() => { try{ const p = document.querySelector('#page-orders.active .page-head p'); if(!p) return; if(!p.dataset.nf83w) p.dataset.nf83w = p.innerHTML; p.innerHTML = innerWidth < 900 ? p.dataset.nf83w.replace(/\s*Customers on the left, suppliers on the right\.?/, ' Switch between customers and suppliers below.') : p.dataset.nf83w; }catch(e){} });
NF45_AFTER.push(() => { try{ const pg = document.getElementById('page-orders'), h = pg && pg.querySelector(':scope > .nf-orders-head'); if(pg) pg.classList.toggle('nf83-oh', !!(h && h.offsetParent && h.querySelector('h1'))); }catch(e){} });
