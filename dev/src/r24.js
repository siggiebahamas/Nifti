/* ===== Round 24: forest "All good", one line per invoice in the tax books, and a notebook reader that keeps up
   with a busy shop: many pages at once, snap now and check later, so paper notes never get lost. ===== */

/* ---------- 1. Orders key says "All good", same words as the band ---------- */
function nf24Key(){ document.querySelectorAll('#nfOrd .nfo-key i.k-green').forEach(i => { const s = i.parentElement; if(s && s.lastChild && s.lastChild.nodeType === 3 && s.lastChild.nodeValue.trim() === 'Done') s.lastChild.nodeValue = 'All good'; }); }

/* ---------- 2. Tax books: one line per invoice, with the amount before VAT ---------- */
const nf24Num = s => Number(String(s == null ? '' : s).replace(/[^\d.-]/g, '')) || 0;
const nf24P = v => '₱' + (Math.round(v * 100) / 100).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
function nf24Day(s){ const d = new Date(String(s).slice(0, 10) + 'T00:00:00'); return isNaN(d) ? s : d.toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}); }
function nf24TaxBooks(){
  document.querySelectorAll('#booksContent table.bk-table').forEach(tb => {
    const heads = [...tb.querySelectorAll('thead th')].map(th => th.textContent.trim());
    if(heads.length < 9) return;
    const party = /supplier/i.test(heads[2]) ? 'Supplier' : 'Customer', sell = party === 'Customer';
    const rows = [...tb.querySelectorAll('tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim())).filter(r => r.length >= 9);
    const T = rows.reduce((a, r) => ({g: a.g + nf24Num(r[4]), x: a.x + nf24Num(r[5]), v: a.v + nf24Num(r[6]), t: a.t + nf24Num(r[7]), w: a.w + nf24Num(r[8])}), {g: 0, x: 0, v: 0, t: 0, w: 0});
    const ex = T.x >= 0.005, e = s => escapeHtml(String(s || ''));
    const wrap = document.createElement('div'); wrap.className = 'nf24-tbw' + (ex ? ' has-ex' : '');
    wrap.innerHTML = `<table class="nf24-tb" data-nf-card="1"><thead><tr><th class="d">Date</th><th class="w">Invoice and ${party.toLowerCase()}</th><th class="n bir">TIN</th><th class="n ex">VAT-exempt</th><th class="n">Before VAT</th><th class="n">VAT 12%</th><th class="n">Amount</th><th class="n">Withheld</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td class="d">${nf24Day(r[0])}</td><td class="w"><b>${e(r[2])}</b><small>${e(r[1])}</small></td><td class="n bir tin">${e(r[3]) || '—'}</td><td class="n ex">${nf24P(nf24Num(r[5]))}</td>
        <td class="n pre">${nf24P(nf24Num(r[6]))}</td><td class="n vat">${nf24P(nf24Num(r[7]))}</td><td class="n amt">${nf24P(nf24Num(r[4]))}</td><td class="n wh">${nf24Num(r[8]) ? nf24P(nf24Num(r[8])) : '—'}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td class="d"></td><td class="w"><b>Month total</b><small>${rows.length} invoice${rows.length === 1 ? '' : 's'}</small></td><td class="n bir"></td><td class="n ex"><small>VAT-exempt</small><b>${nf24P(T.x)}</b></td>
        <td class="n"><small>Before VAT</small><b>${nf24P(T.v)}</b></td><td class="n"><small>VAT 12%</small><b>${nf24P(T.t)}</b></td><td class="n"><small>${sell ? 'Total sales' : 'Total purchases'}</small><b>${nf24P(T.g)}</b></td><td class="n"><small>Tax withheld</small><b>${nf24P(T.w)}</b></td></tr></tfoot></table>
      <button type="button" class="nf24-bir" onclick="const w = this.closest('.nf24-tbw'); w.classList.toggle('show-bir'); this.textContent = w.classList.contains('show-bir') ? 'Hide the TIN column' : 'Show the TIN column'">Show the TIN column</button>`;
    tb.replaceWith(wrap);
  });
}

/* ---------- 3. Notebook reader: many pages at once, and "snap now, check later" ---------- */
// Real handover notes pile up because nobody has time to sit and check them. So taking the photos and checking
// them are now two separate jobs: anyone can snap 10 pages in a minute, and the pages wait safely until someone
// has time. Nothing goes into the books until a person says yes, and a page that can't be read is never thrown away.
const NB24 = {pages: [], curId: null, saved: 0};
const NB24_KEY = 'nifti-nb-inbox';
const NB24_GO = {sales: ['sales', 'Sales'], utang: ['collections', 'Getting paid'], bills: ['collections', 'Getting paid'], stock: ['inventory', 'Stock'], exp: ['expenses', 'Expenses'], unsure: ['sales', 'Sales']};
function nf24Inbox(){ try{ return JSON.parse(localStorage.getItem(NB24_KEY) || '[]') || []; }catch(e){ return []; } }
function nf24SaveInbox(l){ try{ localStorage.setItem(NB24_KEY, JSON.stringify(l)); nf24Badge(); return true; }catch(e){ showToast('This phone is full. Check or delete a few saved pages first.', 'warn'); return false; } }
function nf24Waiting(){ return nf24Inbox().filter(x => x.status === 'waiting').sort((a, b) => a.at - b.at); }
function nf24Kind(k){ const x = NF22_NB_KINDS.find(y => y[0] === k); return x ? x[1] : 'Notebook'; }
function nf24Who(){ try{ return (typeof currentUser !== 'undefined' && currentUser && (currentUser.name || currentUser.full_name)) || (myBusiness ? 'You' : 'Owner'); }catch(e){ return 'You'; } }
function nf24Shrink(file){ return new Promise(res => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 1000 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.6)); }; im.onerror = () => res(''); im.src = r.result; }; r.onerror = () => res(''); r.readAsDataURL(file); }); }
async function nf24Files(files){
  const list = [...(files || [])].slice(0, Math.max(0, 12 - NB24.pages.length));
  if(files && files.length > list.length) showToast('Up to 12 pages at a time. Check these first, then add more.', 'warn');
  for(const f of list){ const p = await nf24Shrink(f); if(p) NB24.pages.push({photo: p}); }
  nf22NbPaint();
}
function nf24Store(){
  const now = Date.now(), add = NB24.pages.map((p, i) => ({id: 'nb' + now + '_' + i, kind: NB.kind || 'unsure', at: now + i, by: nf24Who(), photo: p.photo, status: 'waiting'}));
  const done = nf24Inbox().filter(x => x.status !== 'waiting').slice(-10);
  if(!nf24SaveInbox(nf24Waiting().concat(done, add))) return null;
  NB24.pages = []; return add.map(x => x.id);
}
function nf24OpenPage(id){
  const x = nf24Inbox().find(y => y.id === id); if(!x) return;
  NB24.curId = id; NB24.saved = 0; NB.kind = x.kind; NB.photo = x.photo; NB.step = 2; NB.added = false; NB.qi = 0; NB.picking = -1;
  NB.lines = NF22_NB_PAGE.map((l, i) => Object.assign({n: i + 1, ok: !!l.sure, skipped: false}, l));
  nf22NbPaint();
}
function nf24Badge(){
  const n = nf24Waiting().length;
  document.querySelectorAll('#nf23NbNav, #nf23NbMore').forEach(b => { let s = b.querySelector('.nf24-badge');
    if(n){ if(!s){ s = document.createElement('span'); s.className = 'nav-badge nf24-badge'; b.appendChild(s); } s.textContent = n; s.title = n + ' notebook page' + (n === 1 ? '' : 's') + ' to check'; } else if(s) s.remove();
    const nw = b.querySelector('.nf22-new'); if(nw) nw.hidden = !!n; });
}
const NB24_IMG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>';
const NB24_CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
function nf24When(t){ try{ const d = new Date(t); if(d.toDateString() === new Date().toDateString()) return 'today'; return 'on ' + d.toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}); }catch(e){ return ''; } }
function nf24Main(){
  const ov = document.getElementById('nf22Nb'), main = ov && ov.querySelector('.nf22-nbmain'); if(!main) return;
  const wait = nf24Waiting(), sm = ov.querySelector('.nf22-nbtop small'); if(sm) sm.textContent = 'Paper notes into Nifti. Many pages at once, check them now or later.';
  if(NB24.saved){
    main.innerHTML = `<div class="nf22-nbdone"><span class="nf22-nbbig" aria-hidden="true">✓</span><h2>Saved. ${NB24.saved} page${NB24.saved === 1 ? ' is' : 's are'} waiting.</h2>
      <p>They're safe on this phone until someone has time to check them. Nothing goes into your books until a person says yes.</p>
      <div class="nf22-nbbtns"><button type="button" class="btn btn-primary" data-nb="nb24open" data-v="${wait[0] ? wait[0].id : ''}">Check one now</button><button type="button" class="btn btn-outline" data-nb="close">Done for now</button></div>
      <p class="nf22-nbproto">Prototype: saved on this phone only. In the real app they're saved to your business so anyone on the team can check them.</p></div>`;
    const f = ov.querySelector('.nf22-nbfoot'), d = ov.querySelector('.nf22-nbdots'); if(f) f.hidden = true; if(d) d.hidden = true; return;
  }
  if(NB.added){
    const go = NB24_GO[NB.kind] || NB24_GO.sales, btns = main.querySelector('.nf22-nbbtns');
    if(btns && !btns.dataset.nb24){ btns.dataset.nb24 = '1';
      btns.innerHTML = `${wait.length ? `<button type="button" class="btn btn-primary" data-nb="nb24open" data-v="${wait[0].id}">Check the next page (${wait.length} waiting)</button>` : `<button type="button" class="btn btn-primary" data-nb="again">Read another page</button>`}
        <button type="button" class="btn btn-outline" data-nb="nb24go" data-v="${go[0]}">Open ${go[1]}</button><button type="button" class="btn btn-outline" data-nb="close">I'm done</button>`; }
    return;
  }
  if(NB.step === 0 && wait.length){
    const box = document.createElement('div'); box.className = 'nf24-inbox';
    box.innerHTML = `<div class="nf24-it"><b>${wait.length} page${wait.length === 1 ? '' : 's'} waiting to be checked</b><small>Oldest: ${escapeHtml(nf24Kind(wait[0].kind))} · saved ${nf24When(wait[0].at)} by ${escapeHtml(wait[0].by || 'someone')}</small></div>
      <div class="nf24-th">${wait.slice(0, 4).map(x => `<img src="${x.photo}" alt="Saved page">`).join('')}${wait.length > 4 ? `<span>+${wait.length - 4}</span>` : ''}</div>
      <button type="button" class="btn btn-primary" data-nb="nb24open" data-v="${wait[0].id}">Check the oldest page</button>`;
    main.insertBefore(box, main.firstChild);
    const sub = main.querySelector('.nf22-nbsub'); if(sub) sub.textContent = 'Or start a new notebook. Any notebook works. Messy is OK. Nifti learns your shorthand: the first time it sees "GW 12" it asks, then it remembers.';
    return;
  }
  if(NB.step === 1){
    const n = NB24.pages.length;
    main.innerHTML = `<h2>Take photos of the pages</h2><p class="nf22-nbsub">One page or a whole notebook. Check them now, or save them and check later when you have time.</p>
      <div class="nf24-pick"><label class="nf24-src main"><input type="file" accept="image/*" capture="environment" data-nf-cam="1" data-nb24="cam">${NB24_CAM}<b>${n ? 'Take the next page' : 'Take a photo'}</b><small>One page per photo. Tap again for the next page.</small></label>
        <label class="nf24-src"><input type="file" accept="image/*" multiple data-nf-cam="1" data-nb24="gal">${NB24_IMG}<b>Choose photos</b><small>Pick many pages from your gallery at once.</small></label></div>
      ${n ? `<div class="nf24-ready"><b>${n} page${n === 1 ? '' : 's'} ready</b><div class="nf24-grid">${NB24.pages.map((p, i) => `<figure><img src="${p.photo}" alt="Page ${i + 1}"><figcaption>Page ${i + 1}</figcaption><button type="button" data-nb="nb24rm" data-v="${i}" aria-label="Remove page ${i + 1}">✕</button></figure>`).join('')}</div>
        <div class="nf24-go"><button type="button" class="btn btn-primary" data-nb="nb24now">Check page 1 now</button><button type="button" class="btn btn-outline" data-nb="nb24later">Save ${n === 1 ? 'it' : 'all ' + n}, check later</button></div>
        <p class="nf22-calm">Saved pages wait safely until someone checks them. Nothing goes into your books until a person says yes.</p></div>`
      : `<ul class="nf22-nbtips"><li><b>Flat</b><span>Lay the notebook on a table.</span></li><li><b>Bright</b><span>Near a window or under a light.</span></li><li><b>Whole page</b><span>All four corners in the photo.</span></li></ul>`}
      <button type="button" class="nf22-link nf22-nbsample" data-nb="sample">No notebook with you? Try a sample page</button>`;
    return;
  }
  if(NB.step >= 2 && NB24.curId){ const h = main.querySelector('h2'), all = nf24Waiting(), i = all.findIndex(x => x.id === NB24.curId);
    if(h && i >= 0 && !main.querySelector('.nf24-pg')) h.insertAdjacentHTML('beforebegin', `<p class="nf24-pg">Saved page · ${escapeHtml(nf24Kind(NB.kind))}${all.length > 1 ? ` · ${all.length - 1} more waiting` : ''}</p>`); }
}

/* ---------- wiring ---------- */
(function(){
  if(typeof NF22_NB_STEPS !== 'undefined') NF22_NB_STEPS[1] = 'Photos';
  const op = nf22NbOpen; nf22NbOpen = function(){ NB24.pages = []; NB24.curId = null; NB24.saved = 0; return op.apply(this, arguments); };
  const pt = nf22NbPaint; nf22NbPaint = function(){ const out = pt.apply(this, arguments); try{ nf24Main(); }catch(e){ console.warn('nf24 nb', e); } return out; };
  const dd = nf22NbDo; nf22NbDo = function(a, v, el){
    if(a === 'nb24rm'){ NB24.pages.splice(Number(v), 1); nf22NbPaint(); return; }
    if(a === 'nb24later'){ const ids = nf24Store(); if(!ids) return; NB24.saved = ids.length; nf22NbPaint(); return; }
    if(a === 'nb24now'){ const ids = nf24Store(); if(!ids || !ids.length) return; nf24OpenPage(ids[0]); return; }
    if(a === 'nb24open'){ if(v) nf24OpenPage(v); return; }
    if(a === 'nb24go'){ nf22NbClose(); try{ navigate(v); }catch(e){ go(v); } return; }
    if(a === 'add' && NB24.curId){ const l = nf24Inbox(), x = l.find(y => y.id === NB24.curId); if(x){ x.status = 'done'; x.doneAt = Date.now(); x.photo = ''; nf24SaveInbox(l); } NB24.curId = null; }
    if(a === 'back' && NB.step === 2 && NB24.curId){ NB24.curId = null; NB.photo = ''; }
    return dd.apply(this, arguments);
  };
  document.addEventListener('change', e => { const t = e.target; if(t && t.matches && t.matches('#nf22Nb input[data-nb24]')){ nf24Files(t.files); t.value = ''; } });
  // keep the menu count and the Orders key fresh
  const mr = window.nf20MenuRoles; if(typeof mr === 'function' && !mr._nf24){ const w = function(){ const r = mr.apply(this, arguments); try{ nf24Badge(); }catch(e){} return r; }; w._nf24 = true; window.nf20MenuRoles = w; try{ nf20MenuRoles = w; }catch(e){} }
  const om = window.openMoreSheet; if(typeof om === 'function' && !om._nf24){ const w = function(){ const r = om.apply(this, arguments); try{ nf24Badge(); }catch(e){} return r; }; w._nf24 = true; window.openMoreSheet = w; try{ openMoreSheet = w; }catch(e){} }
  const rb = window.renderBooksPage; if(typeof rb === 'function' && !rb._nf24){ const w = function(){ const out = rb.apply(this, arguments); Promise.resolve(out).then(() => { try{ nf24TaxBooks(); }catch(e){ console.warn(e); } }); return out; };
    Object.keys(rb).forEach(k => { w[k] = rb[k]; }); w._nf24 = true; window.renderBooksPage = w; try{ renderBooksPage = w; }catch(e){} }
  const start = () => { try{ nf24Badge(); nf24Key(); nf24TaxBooks(); }catch(e){} const app = document.getElementById('view-app'); if(app && !app.dataset.nf24){ app.dataset.nf24 = '1'; let t = 0;
      new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { try{ nf24Key(); nf24TaxBooks(); nf24Badge(); }catch(e){} }, 120); }).observe(app, {childList: true, subtree: true}); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 600)); else setTimeout(start, 600);
})();
