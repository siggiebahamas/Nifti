/* ===== Round 45: nothing traps you, every number explains itself, simpler pages that still show everything ===== */

/* ---------- 0. small shared helpers ---------- */
function nf45Esc(s){ return typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
function nf45Peso(n){ return typeof bkPeso === 'function' ? bkPeso(n) : '₱' + Math.round(Number(n) || 0).toLocaleString('en-PH'); }
function nf45Day(d){ try{ return bkDayLabel(String(d).slice(0, 10)); }catch(e){ return String(d || '').slice(0, 10); } }
function nf45Me(){ try{ return slMemberName(); }catch(e){ return 'You'; } }
function nf45Pop(id, title, body, foot, opts){
  opts = opts || {};
  const m = slModal(id, `<div class="sl-sheet-h"><b>${title}</b><button class="sl-x" type="button" aria-label="Close" onclick="slClose('${id}')">✕</button></div>${body}${foot ? `<div class="sl-actions">${foot}</div>` : ''}`);
  const sh = m.querySelector('.sl-sheet'); if(sh){ sh.classList.add('nf45-pop'); if(opts.wide) sh.classList.add('nf45-wide'); }
  m.querySelectorAll('.nf43-cancel').forEach(c => c.remove());
  return m;
}
function nf45Store(k, v){ try{ if(v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return v === undefined ? null : false; } }

// pages register small after-draw steps here; they run after every redraw pass
const NF45_AFTER = [];
(function(){
  const base = window.nf26AfterPass;
  const w = function(page){ if(typeof base === 'function') base.apply(this, arguments); NF45_AFTER.forEach(f => { try{ f(page); }catch(e){ console.warn('nf45 after', e); } }); };
  window.nf26AfterPass = w; try{ nf26AfterPass = w; }catch(e){}
})();

/* ---------- 1. Notebook reader: leaving never traps you, drafts are kept and easy to find ---------- */
const NB45_KEY = 'nifti-nb-drafts';
function nf45NbOpenNow(){ const ov = document.getElementById('nf22Nb'); return !!(ov && !ov.hidden); }
function nf45NbDrafts(){ return (nf45Store(NB45_KEY) || []).filter(d => d && d.id); }
function nf45NbHasWork(){
  try{ if(typeof NB === 'undefined' || NB.added) return false;
    return !!(NB.photo || (typeof NB24 !== 'undefined' && NB24.pages && NB24.pages.length) || (NB.step > 0 && NB.kind)); }catch(e){ return false; }
}
function nf45NbSnapshot(){
  const pick = ['step', 'kind', 'photo', 'cols', 'lines', 'learned', 'qi'];
  const nb = {}; pick.forEach(k => { if(NB[k] !== undefined) nb[k] = NB[k]; });
  return {id: 'd' + Date.now(), at: Date.now(), by: nf45Me(), nb, pages: (typeof NB24 !== 'undefined' && NB24.pages ? NB24.pages.slice(0, 12) : []), curId: typeof NB24 !== 'undefined' ? NB24.curId : null};
}
function nf45NbSaveDraft(){
  if(!nf45NbHasWork()) return null;
  const d = nf45NbSnapshot(), list = nf45NbDrafts().filter(x => x.id !== NB45_CUR.id);
  if(NB45_CUR.id) d.id = NB45_CUR.id;
  list.unshift(d);
  let keep = list.slice(0, 8);
  while(keep.length && !nf45Store(NB45_KEY, keep)) keep = keep.slice(0, keep.length - 1);
  NB45_CUR.id = d.id; try{ nf24Badge(); }catch(e){}
  return keep.length ? d : null;
}
const NB45_CUR = {id: null};
function nf45NbDropDraft(id){ nf45Store(NB45_KEY, nf45NbDrafts().filter(x => x.id !== id)); if(NB45_CUR.id === id) NB45_CUR.id = null; try{ nf24Badge(); }catch(e){} }
function nf45NbResume(id){
  const d = nf45NbDrafts().find(x => x.id === id); if(!d) return;
  nf22NbOpen();
  Object.assign(NB, d.nb || {}, {added: false, picking: -1});
  if(typeof NB24 !== 'undefined'){ NB24.pages = (d.pages || []).slice(); NB24.curId = d.curId || null; NB24.saved = 0; }
  NB45_CUR.id = d.id;
  nf22NbPaint();
}
function nf45NbStepName(d){ const s = (d.nb || {}).step || 0; return s >= 3 ? 'checking the lines' : s >= 2 ? 'photo taken' : s >= 1 ? (d.pages && d.pages.length ? d.pages.length + ' photo' + (d.pages.length === 1 ? '' : 's') + ' taken' : 'about to take photos') : 'just started'; }
function nf45NbLeft(page){
  const d = nf45NbSaveDraft();
  nf22NbClose();
  if(!d) return;
  nf45Pop('nf45NbLeave', 'Save your notebook page?', `<p class="nf45-p">You left <b>Read my notebook</b>. Keep what you did as a draft so you can finish it later? Nothing went into your books yet.</p>
    <div class="nf45-draftcard">${d.nb && d.nb.photo ? `<img src="${d.nb.photo}" alt="">` : (d.pages && d.pages[0] ? `<img src="${d.pages[0].photo}" alt="">` : '<span class="nf45-dic">📒</span>')}<div><b>${nf45Esc(nf24Kind((d.nb || {}).kind || 'unsure'))}</b><small>${nf45Esc(nf45NbStepName(d))} · saved just now</small></div></div>
    <p class="nf45-sm">Drafts wait in <b>AI tools › Notebook reader</b>, at the top.</p>`,
    `<button type="button" class="btn btn-outline" onclick="nf45NbDropDraft('${d.id}'); slClose('nf45NbLeave'); showToast('Draft thrown away.')">Don't save</button><button type="button" class="btn btn-primary" onclick="slClose('nf45NbLeave'); showToast('Saved to Drafts in the Notebook reader.', 'success')">Save draft</button>`);
}
(function(){
  if(typeof navigate !== 'function') return;
  const nav = navigate;
  navigate = function(page){ try{ if(nf45NbOpenNow()) nf45NbLeft(page); }catch(e){ try{ nf22NbClose(); }catch(_){} } return nav.apply(this, arguments); };
  Object.keys(nav).forEach(k => { navigate[k] = nav[k]; });
  window.navigate = navigate;
})();
(function(){
  if(typeof nf22NbDo !== 'function') return;
  const doit = nf22NbDo;
  nf22NbDo = function(a, v, el){
    if(a === 'close'){ const d = nf45NbSaveDraft(); nf22NbClose(); if(d) showToast('Saved to Drafts. Open AI tools › Notebook reader to finish it.', 'success'); return; }
    if(a === 'nf45resume'){ nf45NbResume(v); return; }
    if(a === 'nf45drop'){ if(confirm('Throw away this draft?')){ nf45NbDropDraft(v); nf22NbPaint(); } return; }
    if(a === 'nf45cam'){ nf45Cam(); return; }
    const r = doit.apply(this, arguments);
    // once lines are added to the books the draft is finished
    try{ if(NB.added && NB45_CUR.id){ nf45NbDropDraft(NB45_CUR.id); } }catch(e){}
    return r;
  };
  window.nf22NbDo = nf22NbDo;
  const open = nf22NbOpen;
  nf22NbOpen = function(){ NB45_CUR.id = null; return open.apply(this, arguments); };
  window.nf22NbOpen = nf22NbOpen;
  const paint = nf22NbPaint;
  nf22NbPaint = function(){ const r = paint.apply(this, arguments); try{ nf45NbAfterPaint(); }catch(e){ console.warn('nf45 nb', e); } return r; };
  window.nf22NbPaint = nf22NbPaint;
})();
function nf45NbAfterPaint(){
  const ov = document.getElementById('nf22Nb'); if(!ov) return;
  const x = ov.querySelector('.nf22-nbx'); if(x && x.textContent !== 'Save draft and close') x.textContent = 'Save draft and close';
  const main = ov.querySelector('.nf22-nbmain'); if(!main) return;
  // drafts at the top of the first screen
  if(NB.step === 0 && !NB.added && !main.querySelector('.nf45-drafts')){
    const ds = nf45NbDrafts();
    if(ds.length){
      const box = document.createElement('section'); box.className = 'nf45-drafts';
      box.innerHTML = `<h3>Drafts <span>${ds.length}</span></h3><p>Pages you started and saved. Pick up where you left off.</p>
        <div class="nf45-dl">${ds.map(d => `<div class="nf45-draftcard">${d.nb && d.nb.photo ? `<img src="${d.nb.photo}" alt="">` : (d.pages && d.pages[0] ? `<img src="${d.pages[0].photo}" alt="">` : '<span class="nf45-dic">📒</span>')}
          <div><b>${nf45Esc(nf24Kind((d.nb || {}).kind || 'unsure'))}</b><small>${nf45Esc(nf45NbStepName(d))} · ${nf45Esc(nf24When(d.at))} · ${nf45Esc(d.by || '')}</small></div>
          <button type="button" class="btn btn-primary" data-nb="nf45resume" data-v="${d.id}">Continue</button><button type="button" class="nf45-icon" data-nb="nf45drop" data-v="${d.id}" aria-label="Throw away this draft">✕</button></div>`).join('')}</div>`;
      main.insertBefore(box, main.firstChild);
    }
  }
  // "Take a photo" opens the camera inside Nifti (with a frame to fit the page), not the file picker
  if(NB.step === 1){
    const lab = main.querySelector('label.nf24-src.main');
    if(lab && !lab.dataset.nf45){ lab.dataset.nf45 = '1'; lab.addEventListener('click', e => { if(e.target.matches('input')) return; e.preventDefault(); nf45Cam(); }); }
  }
}

/* in-app camera for notebook pages: frame guide, quick next page, works on phones and laptops */
const NF45C = {stream: null, shots: 0};
function nf45Cam(){
  const fall = () => { const i = document.querySelector('#nf22Nb input[data-nb24="cam"]'); if(i) i.click(); else showToast("This device didn't let Nifti open the camera. Use Choose photos instead.", 'warn'); };
  if(!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return fall();
  let el = document.getElementById('nf45Cam'); if(el) el.remove();
  el = document.createElement('div'); el.id = 'nf45Cam'; el.className = 'nf45-cam'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Camera');
  el.innerHTML = `<video autoplay playsinline muted></video><div class="nf45-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="nf45-camtop"><button type="button" class="nf45-camx" aria-label="Close camera">✕</button><b>Fit the whole page inside the corners</b><span class="nf45-camn"></span></div>
    <div class="nf45-cammsg">Starting the camera…</div>
    <div class="nf45-cambar"><span class="nf45-camtip">Flat · bright · all 4 corners</span><button type="button" class="nf45-snap" aria-label="Take photo" disabled></button><button type="button" class="btn btn-primary nf45-camdone" hidden>Done</button></div>
    <div class="nf45-flash"></div>`;
  document.body.appendChild(el);
  const v = el.querySelector('video'), msg = el.querySelector('.nf45-cammsg'), snap = el.querySelector('.nf45-snap'), done = el.querySelector('.nf45-camdone'), cnt = el.querySelector('.nf45-camn');
  const close = () => { if(NF45C.stream) NF45C.stream.getTracks().forEach(t => t.stop()); NF45C.stream = null; el.remove(); try{ nf22NbPaint(); }catch(e){} };
  el.querySelector('.nf45-camx').onclick = close; done.onclick = close;
  const paintN = () => { const n = (typeof NB24 !== 'undefined' ? NB24.pages.length : 0); cnt.textContent = n ? n + ' page' + (n === 1 ? '' : 's') : ''; done.hidden = !n; done.textContent = n ? `Done · ${n} page${n === 1 ? '' : 's'}` : 'Done'; };
  paintN();
  navigator.mediaDevices.getUserMedia({video: {facingMode: {ideal: 'environment'}, width: {ideal: 1920}, height: {ideal: 1440}}, audio: false}).then(stream => {
    NF45C.stream = stream; v.srcObject = stream; msg.remove(); snap.disabled = false;
  }).catch(() => { close(); fall(); });
  snap.onclick = () => {
    if(!v.videoWidth) return;
    const s = Math.min(1, 1000 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    const data = c.toDataURL('image/jpeg', 0.7);
    if(typeof NB24 !== 'undefined'){ if(NB24.pages.length >= 12){ showToast('Up to 12 pages at a time. Check these first, then add more.', 'warn'); return; } NB24.pages.push({photo: data}); }
    el.querySelector('.nf45-flash').classList.remove('on'); void el.offsetWidth; el.querySelector('.nf45-flash').classList.add('on');
    paintN(); showToast(`Page ${NB24.pages.length} saved. Turn the page and take the next one, or tap Done.`, 'success');
  };
}

/* ---------- 2. To check: the whole row opens, and it says so ---------- */
document.addEventListener('click', e => {
  const tr = e.target.closest && e.target.closest('#page-issues tr.nf44-ir');
  if(!tr || e.target.closest('select, button, a, input, label')) return;
  const fp = tr.dataset.fp; if(!fp || typeof NF44I === 'undefined') return;
  NF44I.open = NF44I.open === fp ? null : fp; renderIssuesPage();
  setTimeout(() => { const x = document.querySelector('#page-issues tr.nf44-ix'); if(x) x.scrollIntoView({block: 'nearest', behavior: 'smooth'}); }, 60);
});

/* ---------- 3. Bank & deposits: match a statement for real, mark one by hand, clean supplier side ---------- */
function nf45BankMatch(focusId){
  const row = focusId && window._nf44Pays ? window._nf44Pays.find(x => x.id === focusId) : null;
  const banks = [['BDO, BPI, Metrobank, Security Bank, UnionBank', 'Open online banking on a computer › your account › transaction history › pick the dates › Download or Export › choose CSV or Excel.'],
    ['GCash', 'GCash app › Profile › Transaction history › request your history by email, then download the file from the email.'],
    ['Maya', 'Maya app › your account › Transactions › download or email the statement, then save the file.'],
    ['No download button?', 'Select the rows on the online banking page, copy them, and paste them in the box below. Nifti reads dates and amounts from plain text too.']];
  nf45Pop('nf45Bank', 'Match my bank statement', `
    ${row ? `<div class="nf45-focus"><div><small>Checking this payment</small><b>${nf45Esc(row.po.buyerName)} · ${nf45Peso(row.amount)}</b><span>${nf45Esc(nf45Day(row.date))}${row.ref ? ' · ref ' + nf45Esc(row.ref) : ''} · ${nf45Esc((typeof PAYMENT_METHOD_LABELS !== 'undefined' && PAYMENT_METHOD_LABELS[row.method]) || row.method)}</span></div>
      <button type="button" class="btn btn-primary" onclick="nf45BankHand('${row.id}')">I see it in my bank app</button></div>
      <p class="nf45-sm">Quick way: open your bank or GCash app, find this amount, then tap the green button. Or match many at once with your statement below.</p>` : ''}
    <ol class="nf45-steps"><li><b>Get your statement</b><span>Download it from your bank or GCash as CSV or Excel. Nifti never logs in to your bank.</span></li>
      <li><b>Drop it here</b><span>Or paste the rows. Nifti finds each payment by amount, date and reference number.</span></li>
      <li><b>Check and save</b><span>You see what matched, what's in the bank but not in Nifti, and what Nifti expected but the bank doesn't show.</span></li></ol>
    <details class="nf45-how"><summary>How do I download it from my bank?</summary>${banks.map(([b, t]) => `<div><b>${nf45Esc(b)}</b><span>${nf45Esc(t)}</span></div>`).join('')}</details>
    <div class="nf45-drop"><label class="btn btn-primary nf45-up"><input type="file" accept=".csv,.txt,.xlsx,.xls,text/csv" hidden onchange="nf45BankFile(this)">Upload statement (CSV or Excel)</label>
      <button type="button" class="btn btn-outline" onclick="colSampleBank()">Try a sample statement</button></div>
    <label class="nf45-lbl" for="bankPaste">Or paste the rows here</label>
    <textarea id="bankPaste" class="nf45-ta" rows="4" placeholder="Date, Description, Amount&#10;11/14/2026, INSTAPAY FROM CAVITE STEEL REF 88213, 16464.00"></textarea>
    <div id="bankResult" class="nf45-res"></div>`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf45Bank')">Close</button><button type="button" class="btn btn-primary" onclick="colMatchBank()">Match now</button>`, {wide: true});
}
async function nf45BankFile(input){
  const f = input.files && input.files[0]; if(!f) return;
  try{
    if(/\.(xlsx|xls)$/i.test(f.name)){
      await cpoLoadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      const wb = XLSX.read(await f.arrayBuffer(), {type: 'array'}), ws = wb.Sheets[wb.SheetNames[0]];
      document.getElementById('bankPaste').value = XLSX.utils.sheet_to_csv(ws).slice(0, 400000);
    } else document.getElementById('bankPaste').value = String(await f.text()).slice(0, 400000);
    colMatchBank();
  }catch(e){ showToast("Couldn't read that file. Try the CSV download, or paste the rows.", 'error'); }
  input.value = '';
}
async function nf45BankHand(id){
  const row = (window._nf44Pays || []).find(x => x.id === id); if(!row) return;
  const ok = await colStoreMatch({line_hash: 'hand|' + id, line: {date: row.date, desc: 'Checked in the bank app by ' + nf45Me(), amount: row.amount}, status: 'matched', po_id: row.po ? row.po.id : null, payment_key: row.id});
  if(!ok) return;
  slClose('nf45Bank'); slClose('nf44Pay'); showToast(`${nf45Peso(row.amount)} from ${row.po.buyerName} marked as in the bank.`, 'success');
  try{ renderCollectionsPage(); }catch(e){}
}
(function(){
  if(typeof colSaveMatches !== 'function') return;
  const save = colSaveMatches;
  colSaveMatches = async function(){ const r = await save.apply(this, arguments); slClose('nf45Bank'); return r; };
  window.colSaveMatches = colSaveMatches;
})();
// the bank page gets the match button where people look first, and every box can be tapped
function nf45BankPage(){
  const pg = document.getElementById('page-collections'); if(!pg || !pg.classList.contains('active')) return;
  const nav = document.querySelector('#view-app .sidebar [data-page="bank-deposits"]'); if(!nav || !nav.classList.contains('active')) return;
  const head = pg.querySelector('.page-header, .nf-ph, header');
  const note = [...pg.querySelectorAll('div, p')].find(e => e.children.length === 0 && /^Nifti doesn't connect to your bank/.test(e.textContent.trim()));
  if(note && !pg.querySelector('.nf45-bankbar')){
    const bar = document.createElement('div'); bar.className = 'nf45-bankbar';
    bar.innerHTML = `<div><b>Is the money really in the bank?</b><span>Nifti doesn't log in to your bank or GCash. Upload the statement they give you and Nifti ticks off every payment it finds.</span></div>
      <button type="button" class="btn btn-primary" onclick="nf45BankMatch()">Match my bank statement</button>`;
    note.replaceWith(bar);
  }
}

NF45_AFTER.push(nf45BankPage);

/* ---------- 4. Every number explains itself: tap a box, see what it is, how it's worked out, and the records behind it ---------- */
const NF45_INFO = [];
function nf45I(page, re, build){ NF45_INFO.push({page, re, build}); }
function nf45PageKey(){
  const nav = document.querySelector('#view-app .sidebar [data-page="bank-deposits"]');
  const act = [...document.querySelectorAll('[id^="page-"]')].find(e => e.classList.contains('active'));
  if(act && act.id === 'page-collections' && nav && nav.classList.contains('active')) return 'bank-deposits';
  return act ? act.id.replace('page-', '') : '';
}
function nf45T(cols, rows, foot){
  // cols: [label, 'n' for money/number columns]
  if(!rows.length) return '';
  return `<div class="nf45-tw"><table class="nf45-t"><thead><tr>${cols.map(([h, k]) => `<th class="${k || ''}">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${(cols[i] || [])[1] || ''}" data-l="${nf45Esc((cols[i] || [])[0] || '')}">${c == null || c === '' ? '—' : c}</td>`).join('')}</tr>`).join('')}</tbody>
    ${foot ? `<tfoot><tr>${foot.map((c, i) => `<td class="${(cols[i] || [])[1] || ''}">${c == null ? '' : c}</td>`).join('')}</tr></tfoot>` : ''}</table></div>`;
}
function nf45TileTitle(el){ const k = el.querySelector('.k') || (el.parentElement && el.parentElement.classList.contains('nf44-prs') ? el.querySelector(':scope > span') : el.querySelector('small')); return ((k || {}).textContent || '').replace(/\s+/g, ' ').trim(); }
function nf45M(){ return bkMonth(APP_TODAY); }
function nf45MName(){ try{ return bkMonthLabel(nf45M()).replace(/ \d{4}$/, ''); }catch(e){ return 'this month'; } }
function nf45Sum(a, f){ return a.reduce((s, x) => s + (Number(f(x)) || 0), 0); }
function nf45Pass(el){ if(!el) return; el.dataset.nf45pass = '1'; try{ el.click(); }finally{ delete el.dataset.nf45pass; } }
let NF45_LAST = null;
function nf45InfoOpen(hit, el, title){
  let r; try{ r = hit.build({el, title}) || {}; }catch(e){ console.warn('nf45 info', e); r = {}; }
  NF45_LAST = el;
  const v = (el.querySelector('.v') || el.querySelector('b') || {}).textContent || '';
  const big = r.big || v.replace(/\s+/g, ' ').trim();
  const acts = (r.acts || []).map(([label, js, prim]) => `<button type="button" class="btn ${prim ? 'btn-primary' : 'btn-outline'}" onclick="slClose('nf45Info'); ${js}">${label}</button>`).join('');
  const pass = r.pass ? `<button type="button" class="btn ${(r.acts || []).some(a => a[2]) ? 'btn-outline' : 'btn-primary'}" onclick="slClose('nf45Info'); nf45Pass(NF45_LAST)">${r.pass}</button>` : '';
  nf45Pop('nf45Info', nf45Esc(r.title || title), `<div class="nf45-ib"><b>${nf45Esc(big)}</b>${r.sub ? `<span>${r.sub}</span>` : ''}</div>
    ${r.what ? `<div class="nf45-sec"><h4>What this is</h4><p>${r.what}</p></div>` : ''}
    ${r.how ? `<div class="nf45-sec"><h4>How Nifti works it out</h4><p class="nf45-calc">${r.how}</p></div>` : ''}
    ${r.table ? `<div class="nf45-sec"><h4>${r.tableTitle || 'Where the number comes from'}</h4>${r.table}</div>` : (r.empty ? `<div class="nf45-sec"><p class="nf45-empty">${r.empty}</p></div>` : '')}
    ${r.extra || ''}
    ${r.src ? `<p class="nf45-src">${r.src}</p>` : ''}`,
    `<button type="button" class="btn btn-outline" onclick="slClose('nf45Info')">Close</button>${pass}${acts}`, {wide: !!r.table});
}
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('#view-app .nf43-pill, #view-app .nf44-prs > div, #view-app .bk-tile, #view-app .sl-tile, #view-app .nf45-tile');
  if(!el || el.dataset.nf45pass) return;
  const page = nf45PageKey(), t = nf45TileTitle(el);
  const hit = NF45_INFO.find(x => (x.page === page || x.page === '*') && x.re.test(t));
  if(!hit) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  nf45InfoOpen(hit, el, t);
}, true);
// boxes that explain themselves get a small hint so people know they can tap them
function nf45TapHints(){
  const page = nf45PageKey();
  document.querySelectorAll('#view-app .nf43-pill, #view-app .nf44-prs > div, #view-app .sl-tile, #view-app .bk-tile').forEach(el => {
    const t = nf45TileTitle(el);
    const has = NF45_INFO.some(x => (x.page === page || x.page === '*') && x.re.test(t));
    if(has && !el.classList.contains('nf45-tap')){ el.classList.add('nf45-tap'); if(!el.title) el.title = 'Tap to see how this number is worked out'; if(!el.getAttribute('role') && el.tagName !== 'BUTTON'){ el.setAttribute('role', 'button'); el.tabIndex = 0; } }
  });
}
document.addEventListener('keydown', e => { if((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('nf45-tap') && e.target.tagName !== 'BUTTON'){ e.preventDefault(); e.target.click(); } });

/* --- Stock --- */
function nf45CountParse(x){ const r = String(x.reason || ''); let m = r.match(/system\s*([\d.]+)\D+shelf\s*([\d.]+)/i); if(m) return {had: +m[1], shelf: +m[2]}; m = r.match(/shelf\s*([\d.]+)/i); if(m){ const s = +m[1]; return {had: s - Number(x.qty), shelf: s}; } return {had: null, shelf: null}; }
function nf45Cost(x){ return (x.unitCost != null ? Number(x.unitCost) : bkItemCost(x.item)) || 0; }
nf45I('inventory', /^Missing in counts/i, () => {
  const m = nf45M(), list = BK.moves.filter(x => x.kind === 'count' && bkMonth(x.date) === m);
  const short = list.filter(x => x.qty < 0), extra = list.filter(x => x.qty > 0), ok = list.filter(x => !x.qty);
  const tot = nf45Sum(short, x => -x.qty * nf45Cost(x));
  return {sub: `${short.length} count${short.length === 1 ? '' : 's'} came up short in ${nf45MName()}`,
    what: 'When someone counts an item on the shelf and finds fewer than Nifti expected, the missing pieces show here, at what you paid for them. It may be theft, a sale nobody recorded, or a delivery that came in short.',
    how: `Missing pieces × what you paid for each, added up for every short count this month = <b>${nf45Peso(tot)}</b>. Counts that found extra are not subtracted.`,
    table: nf45T([['Item'], ['Counted'], ['Nifti had', 'n'], ['Shelf had', 'n'], ['Missing', 'n'], ['Cost each', 'n'], ['Value', 'n'], ['Counted by']],
      short.map(x => { const c = nf45CountParse(x), cost = nf45Cost(x); return [`<b>${nf45Esc(x.item)}</b>`, nf45Esc(nf45Day(x.date)), c.had ?? '', c.shelf ?? '', String(-x.qty), nf45Peso(cost), `<b>${nf45Peso(-x.qty * cost)}</b>`, nf45Esc(x.by || '')]; }),
      ['Total', '', '', '', String(nf45Sum(short, x => -x.qty)), '', `<b>${nf45Peso(tot)}</b>`, '']),
    empty: 'No count came up short this month.',
    extra: (extra.length || ok.length) ? `<p class="nf45-note">${ok.length ? `${ok.length} count${ok.length === 1 ? '' : 's'} matched exactly. ` : ''}${extra.length ? `${extra.length} found more than expected: ${extra.map(x => nf45Esc(x.item) + ' +' + x.qty).join(', ')}.` : ''}</p>` : '',
    src: 'From the spot counts your team saved under Stock › Spot count.',
    acts: [['Full stock history', "openStockSheet('history','count')"], ['Count an item now', "openStockSheet('count')", true]]};
});
nf45I('inventory', /^Damaged or expired/i, () => {
  const m = nf45M(), list = BK.moves.filter(x => x.kind === 'bad' && bkMonth(x.date) === m), tot = nf45Sum(list, x => -x.qty * nf45Cost(x));
  return {sub: `${list.length} record${list.length === 1 ? '' : 's'} in ${nf45MName()}`,
    what: 'Items your team took off stock because they were damaged, expired, spoiled or broken. This is money already lost, so it helps to see which items keep coming back.',
    how: `Pieces taken off × what you paid for each = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Item'], ['Date'], ['How many', 'n'], ['Why'], ['Cost each', 'n'], ['Value', 'n'], ['Recorded by'], ['Photo']],
      list.map(x => [`<b>${nf45Esc(x.item)}</b>`, nf45Esc(nf45Day(x.date)), String(-x.qty), nf45Esc(x.reason || ''), nf45Peso(nf45Cost(x)), `<b>${nf45Peso(-x.qty * nf45Cost(x))}</b>`, nf45Esc(x.by || ''), x.photo ? `<button type="button" class="nf43-link" onclick="bkShowPhoto(${JSON.stringify(x.photo).replace(/"/g, '&quot;')})">See photo</button>` : '']),
      ['Total', '', String(nf45Sum(list, x => -x.qty)), '', '', `<b>${nf45Peso(tot)}</b>`, '', '']),
    empty: 'Nothing was recorded as damaged or expired this month.',
    src: 'From Stock › Record bad stock. Every record keeps who saved it and when.',
    acts: [['Record bad stock', "openStockSheet('bad')", true]]};
});
nf45I('inventory', /^Reorder today/i, () => {
  const list = inventoryData.filter(i => i.status === 'critical');
  return {sub: `${list.length} item${list.length === 1 ? '' : 's'} will run out before a new delivery can arrive`,
    what: 'Items that will run out before your supplier can deliver more, if you order today.',
    how: 'An item is on this list when the days its stock will last are fewer than the days your supplier needs to deliver, or it is below the reorder level you set.',
    table: nf45T([['Item'], ['On hand', 'n'], ['Reorder at', 'n'], ['Lasts about', 'n'], ['Supplier needs', 'n'], ['Order about', 'n'], ['Supplier']],
      list.map(i => [`<b>${nf45Esc(i.name)}</b>`, `${i.onHand} ${nf45Esc(i.unit || '')}`, i.rop ?? '', i.daysLeft != null ? i.daysLeft + ' days' : '', i.leadTime != null ? i.leadTime + ' days' : '', i.maxLevel ? String(Math.max(0, i.maxLevel - i.onHand)) : '', nf45Esc(i.supplier || '')])),
    empty: 'Nothing needs ordering today.',
    src: '"Order about" fills you back up to the most you like to keep.', pass: 'Show these items'};
});
nf45I('inventory', /^Set aside for orders/i, () => {
  const prom = bkPromised(), rows = Object.entries(prom).map(([k, q]) => { const it = inventoryData.filter(i => i.name.toLowerCase() === k), on = nf45Sum(it, i => i.onHand); return [`<b>${nf45Esc(it[0] ? it[0].name : k)}</b>`, String(q), String(on), `<b class="${on - q < 0 ? 'nf45-bad' : ''}">${on - q}</b>`]; });
  return {what: "Items in orders you've confirmed but haven't delivered yet. They're still on your shelf, but they already belong to a customer, so don't sell them at the counter.",
    how: 'Free to sell = on the shelf − promised to customers.',
    table: nf45T([['Item'], ['Promised', 'n'], ['On the shelf', 'n'], ['Free to sell', 'n']], rows), empty: 'Nothing is promised right now.',
    src: 'From your confirmed orders that are not delivered yet.', pass: 'Show the orders'};
});
nf45I('inventory', /^Stock value/i, () => {
  const cost = i => { try{ const s = findSupplierIdByName(i.supplier); const p = s ? lookupKnownUnitPrice(s, i.name) : 0; return p || Number(i.unitCost) || 0; }catch(e){ return Number(i.unitCost) || 0; } };
  const list = inventoryData.slice().sort((a, b) => cost(b) * b.onHand - cost(a) * a.onHand), tot = nf45Sum(list, i => cost(i) * i.onHand);
  return {what: 'What everything on your shelves cost you. It is money sitting in stock, not cash you can spend.',
    how: `On hand × what you last paid your supplier, for every item = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Item'], ['On hand', 'n'], ['Cost each', 'n'], ['Value', 'n'], ['Share', 'n']],
      list.map(i => [`<b>${nf45Esc(i.name)}</b>`, `${i.onHand} ${nf45Esc(i.unit || '')}`, nf45Peso(cost(i)), `<b>${nf45Peso(cost(i) * i.onHand)}</b>`, tot ? Math.round(cost(i) * i.onHand / tot * 100) + '%' : '']),
      ['Total', '', '', `<b>${nf45Peso(tot)}</b>`, '100%']),
    src: 'Cost each comes from your latest supplier bill for that item.'};
});

/* --- Home, Money overview --- */
function nf45SalesMonth(){
  const m = nf45M(), p = bkPnl(m), s = bkMonthSales(m);
  const billed = p.fromLedger ? p.orders : s.orderTotal, counter = p.fromLedger ? p.counter : s.counterTotal, total = p.fromLedger ? p.sales : s.total;
  const unbilled = p.fromLedger ? Math.max(0, s.orderTotal - p.orders) : 0;
  const top = {}; s.counter.forEach(x => (x.lines || []).forEach(l => { top[l.product] = (top[l.product] || 0) + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0); }));
  const best = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return {sub: `${s.counter.length} counter sale${s.counter.length === 1 ? '' : 's'}${billed ? ' and billed customer orders' : ''} in ${nf45MName()}`,
    what: 'Everything you sold and billed this month: walk-in sales at the counter plus customer orders you already billed. It counts the sale when it happens, even if the customer pays later.',
    how: `Counter sales ${nf45Peso(counter)} + billed customer orders ${nf45Peso(billed)} = <b>${nf45Peso(total)}</b>.`,
    table: nf45T([['Where it came from'], ['Amount', 'n']], [['Sales at the counter', nf45Peso(counter)], ['Customer orders you billed', nf45Peso(billed)]], ['Total', `<b>${nf45Peso(total)}</b>`]),
    extra: (unbilled ? `<p class="nf45-note">${nf45Peso(unbilled)} more is in customer orders you confirmed but haven't billed yet. It counts here once you send the bill.</p>` : '') +
      (best.length ? `<div class="nf45-sec"><h4>Best sellers at the counter</h4>${nf45T([['Item'], ['Sold for', 'n']], best.map(([k, v]) => [nf45Esc(k), nf45Peso(v)]))}</div>` : ''),
    src: 'Cancelled orders, drafts and quotes the customer has not confirmed are left out.'};
}
nf45I('dashboard', /^Sales this month/i, nf45SalesMonth);
nf45I('profit', /^Sales this month/i, nf45SalesMonth);
function nf45CashToday(){
  const c = cashExpected(APP_TODAY), p = c.parts;
  const rows = [['Change fund in the drawer this morning', '+', p.fund], ['Cash sales today', '+', p.sales], ['Cash collected from customers', '+', p.collections], ['Owner put cash in', '+', p.ownerIn], ['Expenses paid from the drawer', '−', p.expenses], ['Suppliers paid in cash', '−', p.suppliers], ['Owner took out', '−', p.owner], ['Taken to the bank', '−', p.bank]].filter(r => r[2]);
  return {what: 'How much cash should be in the drawer when you close tonight. Count it before going home: if the drawer has less, Nifti tells you right away.',
    how: rows.map(r => `${r[1] === '−' ? '− ' : rows[0] === r ? '' : '+ '}${nf45Peso(r[2])} ${r[0].toLowerCase()}`).join('<br>') + `<br>= <b>${nf45Peso(c.cash)}</b>`,
    table: nf45T([['Step'], ['', 'n'], ['Amount', 'n']], rows.map(r => [r[0], r[1], nf45Peso(r[2])]), ['Cash that should be in the drawer', '=', `<b>${nf45Peso(c.cash)}</b>`]),
    src: c.gcash ? `GCash and Maya (${nf45Peso(c.gcash)} today) are not in the drawer. Check them on your phone.` : 'GCash, Maya and bank payments are not counted here.',
    acts: [['Count the cash', "go('sales')", true]]};
}
nf45I('dashboard', /^Cash to count tonight/i, nf45CashToday);
function nf45Owed(onlyLate){
  const rows = unpaidInvoicesFor('supplier').filter(r => !onlyLate || r.daysOverdue > 0).sort((a, b) => b.daysOverdue - a.daysOverdue), tot = nf45Sum(rows, r => r.balance);
  return {sub: `${new Set(rows.map(r => r.po.buyerName)).size} customer${new Set(rows.map(r => r.po.buyerName)).size === 1 ? '' : 's'} · ${rows.length} invoice${rows.length === 1 ? '' : 's'}`,
    what: onlyLate ? 'Money customers should have paid already: the due date on the invoice has passed.' : 'Every peso customers still owe you on invoices you sent, late or not.',
    how: `What's left on each ${onlyLate ? 'late ' : ''}invoice (total minus what they already paid) = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Customer'], ['Invoice'], ['Due'], ['Late by', 'n'], ['Still owed', 'n']], rows.map(r => [`<b>${nf45Esc(r.po.buyerName)}</b>`, nf45Esc((r.po.invoice && r.po.invoice.number) || r.po.poNumber), r.due ? nf45Esc(nf45Day(r.due)) : 'no due date', r.daysOverdue > 0 ? r.daysOverdue + ' days' : '—', `<b>${nf45Peso(r.balance)}</b>`]), ['Total', '', '', '', `<b>${nf45Peso(tot)}</b>`]),
    empty: 'Nobody owes you right now.', src: 'Payments a customer says they sent but you have not confirmed yet still count as owed.', acts: [['Open Getting paid', "go('collections')", true]]};
}
nf45I('dashboard', /^Overdue to collect/i, () => nf45Owed(true));
nf45I('money', /^Owed to you/i, () => nf45Owed(false));
function nf45Bills(){
  const rows = unpaidInvoicesFor('buyer').sort((a, b) => String(a.due || '9').localeCompare(String(b.due || '9'))), tot = nf45Sum(rows, r => r.balance);
  return {what: 'Bills from your suppliers that you have not fully paid yet, soonest due first.',
    how: `What's left on each bill (total minus what you already paid) = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Supplier'], ['Bill'], ['Due'], ['You paid, waiting for their OK', 'n'], ['You owe', 'n']], rows.map(r => [`<b>${nf45Esc(r.po.supplierName)}</b>`, nf45Esc((r.po.invoice && r.po.invoice.number) || r.po.poNumber), r.due ? nf45Esc(nf45Day(r.due)) + (r.daysOverdue > 0 ? ` <span class="nf45-bad">· ${r.daysOverdue} days late</span>` : '') : 'no due date', r.pending ? nf45Peso(r.pending) : '', `<b>${nf45Peso(r.balance)}</b>`]), ['Total', '', '', '', `<b>${nf45Peso(tot)}</b>`]),
    empty: 'You have no unpaid supplier bills.', src: '"Waiting for their OK" means you recorded a payment and the supplier has not confirmed it yet.'};
}
nf45I('dashboard', /^Supplier bills due/i, nf45Bills);
nf45I('money', /^You owe suppliers/i, nf45Bills);

/* --- Sales --- */
function nf45SalesDay(){ return (typeof bkSalesDay !== 'undefined' && bkSalesDay) || APP_TODAY; }
nf45I('sales', /^Sales today/i, () => {
  const d = nf45SalesDay(), list = bkLiveSales().filter(s => s.date === d), tot = nf45Sum(list, s => s.total);
  return {what: 'Every sale your team saved at the counter on this day, however it was paid.', how: `${list.length} sale${list.length === 1 ? '' : 's'} added up = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Time'], ['Customer'], ['What was sold'], ['Paid with'], ['By'], ['Amount', 'n']], list.map(s => [nf45Esc(s.at ? new Date(s.at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila'}) : ''), nf45Esc(s.customer || 'Walk-in'), nf45Esc((s.lines || []).map(l => l.qty + ' × ' + l.product).join(', ') || 'Just the total'), nf45Esc(s.paidWith || ''), nf45Esc(s.by || ''), `<b>${nf45Peso(s.total)}</b>`]), ['Total', '', '', '', '', `<b>${nf45Peso(tot)}</b>`]),
    empty: 'No sales saved on this day yet.', src: 'Removed sales are left out, but they stay in the history with the reason.'};
});
function nf45PayRows(day, f){
  const out = []; bkLiveSales().forEach(s => (s.payments || []).forEach(p => { if(bkPayDate(p) === day && f(bkMethodKey(p.method))) out.push({s, p}); })); return out;
}
nf45I('sales', /^Cash for the drawer/i, () => {
  const d = nf45SalesDay(), rows = nf45PayRows(d, k => k === 'cash'), tot = nf45Sum(rows, r => r.p.amount);
  return {what: 'Cash your team received for counter sales on this day. It goes in the drawer. It does not include the change fund or cash collected for old utang, so it can be lower than "Cash to count tonight" on Home.',
    how: `Cash paid on ${rows.length} sale${rows.length === 1 ? '' : 's'} = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Customer'], ['What was sold'], ['By'], ['Cash', 'n']], rows.map(r => [nf45Esc(r.s.customer || 'Walk-in'), nf45Esc((r.s.lines || []).map(l => l.qty + ' × ' + l.product).join(', ') || 'Just the total'), nf45Esc(r.s.by || ''), nf45Peso(r.p.amount)]), ['Total', '', '', `<b>${nf45Peso(tot)}</b>`]), empty: 'No cash sales on this day.'};
});
nf45I('sales', /^GCash & Maya/i, () => {
  const d = nf45SalesDay(), rows = nf45PayRows(d, k => k === 'gcash' || k === 'maya'), tot = nf45Sum(rows, r => r.p.amount);
  return {what: 'Sales paid by GCash or Maya on this day. This money is on your phone, not in the drawer, so open your GCash or Maya app and check each one arrived.',
    how: `${rows.length} e-wallet payment${rows.length === 1 ? '' : 's'} = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Customer'], ['Paid with'], ['Reference'], ['By'], ['Amount', 'n']], rows.map(r => [nf45Esc(r.s.customer || 'Walk-in'), nf45Esc(bkMethodKey(r.p.method) === 'maya' ? 'Maya' : 'GCash'), nf45Esc(r.p.reference || ''), nf45Esc(r.s.by || ''), nf45Peso(r.p.amount)]), ['Total', '', '', '', `<b>${nf45Peso(tot)}</b>`]), empty: 'No GCash or Maya sales on this day.'};
});
function nf45Counts(kind){
  const m = nf45M(), c = bkCashSummary(m), list = c.list.slice().sort((a, b) => String(b.day).localeCompare(String(a.day)));
  const pick = kind === 'short' ? list.filter(x => x.difference < 0) : kind === 'over' ? list.filter(x => x.difference > 0) : kind === 'match' ? list.filter(x => !x.difference) : list;
  const tot = nf45Sum(pick, x => x.difference);
  return {what: kind === 'short' ? 'Days the cash in the drawer was less than it should have been when your team counted it.' : kind === 'over' ? 'Days the drawer had more cash than expected, usually a sale or a payment nobody recorded.' : kind === 'match' ? 'Days the cash counted matched exactly what Nifti expected.' : 'Every cash count this month.',
    how: kind === 'short' || kind === 'over' ? `Counted − expected, for each ${kind === 'short' ? 'short' : 'over'} day, added up = <b>${nf45Peso(Math.abs(tot))}</b>.` : `${pick.length} of ${list.length} counted days.`,
    table: nf45T([['Day'], ['Expected', 'n'], ['Counted', 'n'], ['Difference', 'n'], ['By'], ['Note']], pick.map(x => [nf45Esc(nf45Day(x.day)), nf45Peso((x.expected || {}).cash), nf45Peso((x.counted || {}).cash), `<b class="${x.difference < 0 ? 'nf45-bad' : x.difference > 0 ? 'nf45-good' : ''}">${x.difference > 0 ? '+' : ''}${nf45Peso(x.difference)}</b>`, nf45Esc(x.by || ''), nf45Esc(x.note || '')])),
    empty: 'No days here this month.', src: 'From the cash counts saved on the Sales page.'};
}
nf45I('sales', /^Short this month/i, () => nf45Counts('short'));
nf45I('sales', /^Over this month/i, () => nf45Counts('over'));
nf45I('sales', /^Days matched/i, () => nf45Counts('match'));
nf45I('sales', /^Days not counted/i, () => { const c = bkCashSummary(nf45M()); return {what: 'Days with sales where nobody counted the cash at closing. Uncounted days are where money goes missing without anyone noticing.', how: 'Days in the last 2 weeks with at least one sale and no cash count.', table: nf45T([['Day'], ['Sales that day', 'n']], c.notCounted.sort().reverse().map(d => [nf45Esc(nf45Day(d)), nf45Peso(nf45Sum(bkLiveSales().filter(s => s.date === d), s => s.total))])), empty: 'Every day with sales was counted.'}; });

/* --- Expenses, Prices & profit --- */
nf45I('expenses', /^Spent this month/i, () => {
  const e = bkMonthExpenses(nf45M()), cats = Object.entries(e.byCat).sort((a, b) => b[1] - a[1]);
  return {what: 'Running costs this month: rent, electricity, salaries, gas, repairs and so on. Stock you bought to resell and money the owner took out are not counted here.',
    how: `Every approved expense this month, by kind, added up = <b>${nf45Peso(e.total)}</b>.`,
    table: nf45T([['Kind'], ['How many', 'n'], ['Amount', 'n'], ['Share', 'n']], cats.map(([k, v]) => [`<b>${nf45Esc(k)}</b>`, String(e.list.filter(x => x.category === k).length), nf45Peso(v), e.total ? Math.round(v / e.total * 100) + '%' : '']), ['Total', '', `<b>${nf45Peso(e.total)}</b>`, '100%']),
    empty: 'No expenses this month yet.', src: (e.cogs ? `${nf45Peso(e.cogs)} of stock bought as an expense counts in Cost of what you sold instead. ` : '') + 'Payroll and stock losses are counted in your Monthly summary. Expenses waiting for approval count once approved.'};
});
nf45I('expenses', /^Owner took/i, () => {
  const m = nf45M(), list = BK.expenses.filter(x => !x.deletedAt && bkMonth(x.date) === m && bkCat(x.category).drawing), tot = nf45Sum(list, x => x.amount);
  return {what: "Money the owner took from the business for personal use. It's not a business cost, so it doesn't lower your profit, but it does lower your cash.", how: `${list.length} time${list.length === 1 ? '' : 's'} this month = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Date'], ['Note'], ['From'], ['Recorded by'], ['Amount', 'n']], list.map(x => [nf45Esc(nf45Day(x.date)), nf45Esc(x.note || x.vendor || ''), nf45Esc(x.paidFrom || ''), nf45Esc(x.by || ''), nf45Peso(x.amount)]), ['Total', '', '', '', `<b>${nf45Peso(tot)}</b>`]), empty: 'The owner took nothing out this month.'};
});
nf45I('profit', /^Cost of what you sold/i, () => {
  const m = nf45M(), p = bkPnl(m), s = bkMonthSales(m), by = {};
  s.counter.forEach(x => (x.lines || []).forEach(l => { const c = (Number(l.qty) || 0) * (Number(l.unitCost) || bkItemCost(l.product)); if(c) by[l.product] = (by[l.product] || 0) + c; }));
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]), sum = nf45Sum(rows, r => r[1]);
  return {what: 'What the items you sold this month cost you to buy. Profit is what is left after this.',
    how: `Each item sold × what you paid for it, added up = <b>${nf45Peso(p.cost)}</b>.`,
    table: nf45T([['Item'], ['Cost of the ones sold', 'n'], ['Share', 'n']], rows.slice(0, 12).map(([k, v]) => [`<b>${nf45Esc(k)}</b>`, nf45Peso(v), p.cost ? Math.round(v / p.cost * 100) + '%' : '']), Math.abs(sum - p.cost) < 1 ? ['Total', `<b>${nf45Peso(p.cost)}</b>`, '100%'] : null),
    tableTitle: 'Biggest costs by item',
    src: p.missingCost ? 'Some items have no cost yet, so this number is lower than it should be. Add their cost under Prices & profit.' : 'Every item sold has a cost.'};
});
nf45I('profit', /^Items with no cost/i, () => {
  const m = nf45M(), s = bkMonthSales(m), seen = {};
  s.counter.forEach(x => (x.lines || []).forEach(l => { if(!(Number(l.unitCost) || bkItemCost(l.product))) seen[l.product] = (seen[l.product] || 0) + (Number(l.qty) || 0); }));
  s.orders.forEach(o => (o.lineItems || []).forEach(l => { if(!bkItemCost(l.product)) seen[l.product] = (seen[l.product] || 0) + (Number(l.qty) || 0); }));
  return {what: "Items you sold without telling Nifti what you paid for them. Nifti can't work out the profit on these until you add their cost.", how: 'Every item sold this month that has no cost saved.',
    table: nf45T([['Item'], ['Sold this month', 'n']], Object.entries(seen).map(([k, q]) => [`<b>${nf45Esc(k)}</b>`, String(q)])), empty: 'Every item you sold has a cost.', pass: 'Add their cost'};
});
nf45I('profit', /^Profit before expenses/i, () => {
  const p = bkPnl(nf45M());
  return {what: 'What you made on the items you sold, before paying rent, salaries and other running costs.',
    how: `Sales ${nf45Peso(p.sales)} − cost of what you sold ${nf45Peso(p.cost)} = <b>${nf45Peso(p.gross)}</b>${p.sales ? ` (${Math.round(p.gross / p.sales * 100)} centavos on every peso sold)` : ''}.`,
    table: nf45T([['Line'], ['Amount', 'n']], [['Sales', nf45Peso(p.sales)], ['Cost of what you sold', '− ' + nf45Peso(p.cost)], ['Profit before expenses', `<b>${nf45Peso(p.gross)}</b>`], ['Running costs (expenses)', '− ' + nf45Peso(p.expenses)], ['What you kept', `<b>${nf45Peso(p.net)}</b>`]]),
    src: p.missingCost ? 'Some items have no cost yet, so this looks better than it really is.' : ''};
});

/* --- To check, Follow-ups --- */
function nf45Iss(pick, title){
  const all = issuesAll().filter(i => !['resolved', 'accepted'].includes(i.status)), list = all.filter(pick), tot = nf45Sum(list, i => i.amount);
  return {what: title, how: list.some(i => i.amount) ? `Money each problem could cost you, added up = <b>${nf45Peso(tot)}</b>. It is possible, not proven: some will turn out fine.` : '',
    table: nf45T([['Problem'], ['Kind'], ['Found'], ['Money', 'n']], list.map(i => [`<b>${nf45Esc(i.title)}</b>`, nf45Esc(i.kind || ''), nf45Esc(i.date ? nf45Day(i.date) : ''), i.amount ? nf45Peso(i.amount) : '—'])), empty: 'Nothing here.'};
}
nf45I('issues', /^Urgent to check/i, () => nf45Iss(i => i.lvl === 'red', 'Problems that could cost real money or hide something wrong, like cash that does not add up or an expense far above normal.'));
nf45I('issues', /^Other to check/i, () => nf45Iss(i => i.lvl !== 'red', 'Smaller things worth a look when you have a minute, like a price change or a possible duplicate.'));
nf45I('issues', /^Money at risk/i, () => nf45Iss(() => true, 'The money involved in every open problem.'));
nf45I('followups', /^Waiting for/i, () => {
  const list = qtWaiting(), tot = nf45Sum(list, w => poTotal(w.po));
  return {what: "Orders you sent a customer for their OK. Nothing is delivered or billed until they say yes.", how: `Total of each order still waiting = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Customer'], ['Order'], ['Sent'], ['Opened', 'n'], ['Amount', 'n']], list.map(w => [`<b>${nf45Esc(w.po.buyerName)}</b>`, nf45Esc(w.po.poNumber), nf45Esc(w.po.quote && w.po.quote.sent_at ? nf45Day(String(w.po.quote.sent_at).slice(0, 10)) : ''), w.po.quote && w.po.quote.views ? w.po.quote.views + '×' : 'not yet', nf45Peso(poTotal(w.po))]), ['Total', '', '', '', `<b>${nf45Peso(tot)}</b>`]), empty: 'Nothing is waiting.'};
});
nf45I('followups', /^Said yes/i, () => {
  const all = getSupplierPOs().filter(po => po.quote && po.quote.sent_at && slDaysAgo(po.quote.sent_at) <= 30), yes = all.filter(po => po.quote.outcome === 'confirmed'), tot = nf45Sum(yes, poTotal);
  return {what: 'Orders customers said yes to in the last 30 days, out of all the orders you sent for their OK.', how: `${yes.length} of ${all.length} said yes. Value of the yes orders = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Customer'], ['Order'], ['Answer'], ['Amount', 'n']], all.map(po => [`<b>${nf45Esc(po.buyerName)}</b>`, nf45Esc(po.poNumber), po.quote.outcome === 'confirmed' ? '<span class="nf45-good">Said yes</span>' : po.quote.outcome ? nf45Esc(po.quote.outcome) : 'No answer yet', nf45Peso(poTotal(po))])), empty: 'You did not send any orders for an OK in the last 30 days.'};
});

/* --- Payroll --- */
function nf45PrNet(id){ return nf45Sum(PR.lines.filter(l => l.run_id === id), l => prCalc(l).net); }
nf45I('payroll', /^Next payday/i, () => {
  const drafts = PR.runs.filter(r => r.status !== 'paid').sort((a, b) => String(a.period_to).localeCompare(String(b.period_to)));
  return {what: 'The next day your people expect to be paid.', how: drafts.length ? `Your open payroll covers ${nf45Esc(nf45Day(drafts[0].period_from))} to ${nf45Esc(nf45Day(drafts[0].period_to))}, so pay day is its last day.` : 'You have no open payroll, so Nifti uses the usual 15th and end of the month.',
    table: nf45T([['Period'], ['People', 'n'], ['To pay (so far)', 'n'], ['Status']], drafts.map(r => [nf45Esc(nf45Day(r.period_from) + ' to ' + nf45Day(r.period_to)), String(PR.lines.filter(l => l.run_id === r.id).length), nf45Peso(nf45PrNet(r.id)), 'Not paid yet'])),
    empty: 'No payroll is open yet.', acts: drafts.length ? [['Open this payroll', `prOpenRun('${drafts[0].id}')`, true]] : [['Start a payroll', 'prNew()', true]]};
});
nf45I('payroll', /^Last payroll/i, () => {
  const last = PR.runs.filter(r => r.status === 'paid').sort((a, b) => String(b.period_to).localeCompare(String(a.period_to)))[0];
  if(!last) return {what: 'The most recent payroll you paid.', empty: 'You have not paid a payroll in Nifti yet.'};
  const ls = PR.lines.filter(l => l.run_id === last.id), tot = nf45Sum(ls, l => prCalc(l).net);
  return {sub: `${nf45Esc(nf45Day(last.period_from))} to ${nf45Esc(nf45Day(last.period_to))} · paid ${nf45Esc(nf45Day(last.paid_on || last.period_to))} from ${nf45Esc(last.paid_from || 'cash')}${last.paid_by_name ? ' by ' + nf45Esc(last.paid_by_name) : ''}`,
    what: 'What each person took home in the most recent payroll you paid.', how: `For each person: pay (days × rate, plus extras) − deductions (SSS, PhilHealth, Pag-IBIG, vale, others) = take-home. Added up = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Person'], ['Days', 'n'], ['Rate', 'n'], ['Gross pay', 'n'], ['Deductions', 'n'], ['Take-home', 'n']], ls.map(l => { const c = prCalc(l); return [`<b>${nf45Esc(l.staff_name)}</b>`, l.basis === 'month' ? 'monthly' : String(l.days || ''), nf45Peso(l.rate), nf45Peso(c.gross), nf45Peso((c.gross || 0) - (c.net || 0)), `<b>${nf45Peso(c.net)}</b>`]; }), ['Total', '', '', nf45Peso(nf45Sum(ls, l => prCalc(l).gross)), '', `<b>${nf45Peso(tot)}</b>`]),
    acts: [['Payslips', `prPayslip('${last.id}')`, true]]};
});
nf45I('payroll', /^Vale to collect/i, () => {
  const v = prValeBalances(), adv = BK.expenses.filter(e => !e.deletedAt && e.category === 'Staff advance (vale)' && (e.status || 'approved') === 'approved');
  const people = Object.keys(v).filter(k => v[k] > 0 || adv.some(e => String(e.staff || '').trim() === k));
  return {what: "Cash advances (vale) your people took and haven't paid back yet. Nifti takes them off their next payslip when you tell it to.",
    how: 'For each person: vale they took − vale already taken off paid payslips = still owed.',
    table: nf45T([['Person'], ['Vale taken', 'n'], ['Paid back', 'n'], ['Still owes', 'n']], people.map(k => { const took = nf45Sum(adv.filter(e => (String(e.staff || '').trim() || 'No name') === k), e => e.amount); return [`<b>${nf45Esc(k)}</b>`, nf45Peso(took), nf45Peso(took - v[k]), `<b class="${v[k] > 0 ? 'nf45-bad' : ''}">${nf45Peso(v[k])}</b>`]; })),
    empty: 'Nobody owes vale.', extra: adv.length ? `<div class="nf45-sec"><h4>Every vale given</h4>${nf45T([['Date'], ['Person'], ['Note'], ['Amount', 'n']], adv.map(e => [nf45Esc(nf45Day(e.date)), nf45Esc(e.staff || ''), nf45Esc(e.note || ''), nf45Peso(e.amount)]))}</div>` : '',
    src: 'Vale is saved as an expense of the kind "Staff advance (vale)".'};
});
nf45I('payroll', /^People on payroll/i, () => {
  const names = [...new Set(PR.lines.map(l => l.staff_name))], yr = APP_TODAY.slice(0, 4);
  return {what: 'Everyone who appears in your payrolls.', how: 'Names from every payroll you made in Nifti.',
    table: nf45T([['Person'], ['Pay rate', 'n'], ['Last paid'], ['Paid this year', 'n']], names.map(n => { const ls = PR.lines.filter(l => l.staff_name === n), runs = ls.map(l => PR.runs.find(r => r.id === l.run_id)).filter(r => r && r.status === 'paid').sort((a, b) => String(b.period_to).localeCompare(String(a.period_to))), lastL = ls[ls.length - 1] || {};
      return [`<b>${nf45Esc(n)}</b>`, lastL.rate ? nf45Peso(lastL.rate) + (lastL.basis === 'month' ? ' a month' : ' a day') : '', runs[0] ? nf45Esc(nf45Day(runs[0].paid_on || runs[0].period_to)) : 'not yet', nf45Peso(nf45Sum(ls.filter(l => { const r = PR.runs.find(x => x.id === l.run_id); return r && r.status === 'paid' && String(r.paid_on || r.period_to).startsWith(yr); }), l => prCalc(l).net))]; }))};
});

/* --- Bank & deposits --- */
nf45I('bank-deposits', /^Collected this month/i, () => {
  const m = nf45M(), list = colLedger().filter(x => x.counted && bkMonth(x.date) === m), tot = nf45Sum(list, x => x.amount);
  return {what: 'Payments from customers this month that you confirmed you received, by any method.', how: `${list.length} confirmed payment${list.length === 1 ? '' : 's'} = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Customer'], ['Order'], ['Date'], ['How'], ['Amount', 'n']], list.map(x => [`<b>${nf45Esc(x.po.buyerName)}</b>`, nf45Esc(x.po.poNumber), nf45Esc(nf45Day(x.date)), nf45Esc((typeof PAYMENT_METHOD_LABELS !== 'undefined' && PAYMENT_METHOD_LABELS[x.method]) || x.method), nf45Peso(x.amount)]), ['Total', '', '', '', `<b>${nf45Peso(tot)}</b>`]), empty: 'No confirmed payments this month yet.'};
});
nf45I('bank-deposits', /^Cash not yet in bank/i, () => {
  const dep = colDepositedKeys(), list = colLedger().filter(x => x.counted && x.method === 'cash' && !dep.has(x.id)), tot = nf45Sum(list, x => x.amount);
  return {what: 'Cash customers paid that someone is still holding, at the office or with a driver. It should reach the bank soon.', how: `Cash payments not in a deposit yet = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Who has it'], ['From'], ['Date'], ['Amount', 'n']], list.map(x => [`<b>${nf45Esc(x.collector)}</b>`, nf45Esc(x.po.buyerName), nf45Esc(nf45Day(x.date)), nf45Peso(x.amount)]), ['Total', '', '', `<b>${nf45Peso(tot)}</b>`]), empty: 'All cash is in the bank.', acts: list.length ? [['Record a deposit', 'colDeposit()', true]] : []};
});
nf45I('bank-deposits', /^Deposited this month/i, () => {
  const m = nf45M(), list = (depositsCache || []).filter(d => bkMonth(d.deposited_on) === m), tot = nf45Sum(list, d => d.amount);
  return {what: 'Cash you took to the bank this month.', how: `${list.length} deposit${list.length === 1 ? '' : 's'} = <b>${nf45Peso(tot)}</b>.`,
    table: nf45T([['Date'], ['Bank'], ['By'], ['Note'], ['Amount', 'n']], list.map(d => [nf45Esc(nf45Day(d.deposited_on)), nf45Esc(d.bank || ''), nf45Esc(d.created_by || ''), nf45Esc(d.note || ''), nf45Peso(d.amount)]), ['Total', '', '', '', `<b>${nf45Peso(tot)}</b>`]), empty: 'No deposits this month.'};
});
nf45I('bank-deposits', /^Not matched to bank/i, () => {
  const mk = colMatchedKeys(), list = colLedger().filter(x => x.counted && x.method !== 'cash' && !mk.has(x.id) && daysBetween(x.date, APP_TODAY) <= 60), tot = nf45Sum(list, x => x.amount);
  return {what: "Bank, GCash and check payments you recorded that haven't been found on a bank statement yet. Until then you're trusting the customer's word that it arrived.",
    how: `Non-cash payments from the last 60 days with no statement line found = <b>${nf45Peso(tot)}</b> (${list.length}).`,
    table: nf45T([['Customer'], ['Date'], ['How'], ['Reference'], ['Amount', 'n']], list.map(x => [`<b>${nf45Esc(x.po.buyerName)}</b>`, nf45Esc(nf45Day(x.date)), nf45Esc((typeof PAYMENT_METHOD_LABELS !== 'undefined' && PAYMENT_METHOD_LABELS[x.method]) || x.method), nf45Esc(x.ref || ''), nf45Peso(x.amount)])), empty: 'Everything is matched.', acts: [['Match my bank statement', 'nf45BankMatch()', true]]};
});

/* --- Orders: the boxes filter the list; the popup says what each one means first --- */
[[/^Need you today/i, 'Orders where you are the next step today: confirm, prepare, deliver or bill.'], [/^Due this week/i, 'Orders that should be delivered or paid within the next 7 days.'], [/^Waiting on others/i, 'Orders where the next step is the customer or the supplier, like a payment or an OK. Nothing for you to do but follow up.'], [/^Done and paid/i, 'Orders delivered and fully paid this month.']].forEach(([re, w]) =>
  nf45I('orders', re, () => ({what: w, how: 'The amount is the total of those orders. Tap Show these orders to see them in the list below.', pass: 'Show these orders'})));
NF45_AFTER.push(nf45TapHints);

// Expenses showed its boxes twice: keep the hidden source box next to the row people see, so only one row exists
function nf45ExpPills(page){
  const pg = document.getElementById('page-expenses'); if(!pg || !pg.classList.contains('active')) return;
  const rows = [...pg.querySelectorAll('.nf43-pills')]; if(rows.length < 2) return;
  const top = rows[0], box = pg.querySelector('.bk-tiles.nf43-old');
  if(box && top.previousElementSibling !== box) top.before(box);
  rows.slice(1).forEach(r => { if(r !== top) r.remove(); });
}
NF45_AFTER.push(nf45ExpPills);

/* ---------- 5. Section headings explain themselves: a small ⓘ next to each one ---------- */
const NF45_HELP = [
  [/^What to do$/, 'The few things that need you today, most urgent first. Each one has a button that does the job, so you never have to hunt for the right page.'],
  [/^What runs out$/, 'Items that will run out soon, based on how fast they sell and how long your supplier takes to deliver. Order before the bar turns red.'],
  [/^Where every order is$/, 'Every open order, by step: from the customer saying yes, to delivered, to paid. Tap a step to see the orders in it.'],
  [/^Profit for /, 'What you kept this month: sales minus what the items cost you, minus running costs like rent and salaries. It comes from your books.'],
  [/^Money in and out$/, 'Money you expect to receive from customers and money you have to pay suppliers and bills, so you can see if cash will be tight.'],
  [/^Coming up: money in and out$/, 'Payments due to you and bills you have to pay in the next weeks, by date. Plan your cash before it runs short.'],
  [/^How the business is doing$/, 'Your sales and profit month by month, so you can see if the business is growing.'],
  [/^Utang from shop sales$/, 'Customers who took items from the counter and will pay later. Tap Paid when they pay.'],
  [/^Discounts/, 'Sales sold below the usual price today, with who gave the discount. A quick way to catch discounts you did not approve.'],
  [/^Count the cash$/, 'Count the drawer at closing. Nifti compares it with what should be there and saves who counted, so missing cash is spotted the same day.'],
  [/^Cash drawer by person$/, 'Who counted the drawer each day and whether it matched. Helpful when more than one person handles cash.'],
  [/^How much cash is in the drawer\?$/, 'Type what you counted. Nifti shows right away if the drawer is short or over.'],
  [/^Waiting for your OK$/, 'Expenses your staff recorded that need your approval first. They are not counted until you approve them.'],
  [/^Where the money went$/, 'This month\'s spending by kind, biggest first. A tag shows when something is much higher than usual.'],
  [/^Approval rules$/, 'Set which expenses need your OK before they count, for example anything above a certain amount.'],
  [/^Vale this month$/, 'Cash advances given to your people this month. Nifti reminds you to take them back on payday.'],
  [/^All expenses$/, 'Every expense this month, newest first, with receipts. You can edit or remove any line; removing asks for a reason.'],
  [/^Payments to confirm$/, 'Payments customers say they sent (bank, GCash or check) that you have not checked yet. Confirm once you see the money.'],
  [/^Customers with a balance$/, 'Customers who still owe you, oldest debt first, with a button to remind them.'],
  [/^Bills, oldest first$/, 'Supplier bills you still have to pay. Late ones are in red. Tap a bill to pay it.'],
  [/^Who has the cash$/, 'Cash collected from customers that someone is still holding, at the office or with a driver. Record a deposit when it reaches the bank.'],
  [/^Every payment, last 30 days$/, 'Every customer payment in the last 30 days and where it is now. Tap one to confirm it, deposit it or match it with your bank.'],
  [/^Every item$/, 'All your items with what you pay and what you sell them for, and the profit on each. Tap a price to change it.'],
  [/^Price changes$/, 'When a supplier raised a price, or you changed one of yours. Check that your selling price still makes a profit.'],
  [/^Vale not yet taken back$/, 'Cash advances your people still owe. Take them back on their next payslip.'],
  [/^Payroll$/, 'Each payroll you made: draft ones you can still change, and paid ones with payslips.'],
  [/^Your people$/, 'Everyone on your payroll: their pay rate, what they took home this year, and any vale they still owe.'],
  [/^What changed$/, 'The biggest changes this month compared with last month, in plain words. Start here before reading the full statements.'],
  [/^Deposit today$/, 'Checks dated today or earlier that you can take to the bank now.'],
  [/^Coming up$/, 'Post-dated checks from customers. Nifti reminds you on the day each one can be deposited.'],
  [/^In the bank, waiting to clear$/, 'Checks you deposited that the bank has not cleared yet. Mark them cleared when the money shows up.'],
  [/^Bounced$/, 'Checks the bank returned. The customer still owes this money; Nifti added it back to what they owe.'],
  [/^Will come out of your bank soon$/, 'Checks you wrote to suppliers that they have not cashed yet. Keep enough money in the bank for them.'],
  [/^Forms your customers owe you$/, 'BIR Form 2307 your customers should give you when they withheld tax from a payment. You need them to lower your own tax.'],
  [/^Forms you owe your suppliers$/, 'BIR Form 2307 you need to give suppliers when you withheld tax from what you paid them.'],
  [/^Today's post is ready$/, 'A post for Facebook or Viber about your items, written for you. Copy it, change it if you like, and share.'],
  [/^Your leads$/, 'Businesses that may buy from you. Tap one to see why they fit and how to reach them.'],
  [/^Remind them for me every morning$/, 'When this is on, Nifti sends the follow-up messages on the right days so you don\'t have to remember.'],
];
function nf45Help(btn){ const h = btn.dataset.h, row = NF45_HELP.find(([re]) => re.test(h)); if(!row) return; nf45Pop('nf45Help', nf45Esc(h), `<p class="nf45-p">${nf45Esc(row[1])}</p>`, `<button type="button" class="btn btn-primary" onclick="slClose('nf45Help')">Got it</button>`); }
function nf45HelpMarks(){
  const act = [...document.querySelectorAll('[id^="page-"]')].find(e => e.classList.contains('active')); if(!act) return;
  act.querySelectorAll('h2, h3, h4, .panel-head b, b, span').forEach(e => {
    if(e.dataset.nf45h || e.offsetParent === null || e.closest('button, a, table, .nf43-pills, .sl-row, .nf44-prs, .nf45-pop, label')) return;
    const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim(); if(!own || own.length > 60) return;
    const row = NF45_HELP.find(([re]) => re.test(own)); if(!row) return;
    if(e.tagName === 'SPAN' || e.tagName === 'B'){ const fs = parseFloat(getComputedStyle(e).fontSize); if(fs < 17) return; }
    e.dataset.nf45h = '1';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'nf45-qi'; b.dataset.h = own; b.setAttribute('aria-label', 'What is ' + own + '?'); b.title = 'What is this?';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>';
    b.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); nf45Help(b); });
    e.appendChild(b);
  });
}
NF45_AFTER.push(nf45HelpMarks);

/* ---------- 6. New sale: browse every item (even if you don't know its exact name) and find any existing customer ---------- */
const NF45S = {browse: false, bq: '', bg: 'all', cq: '', copen: false, call: false};
function nf45Norm(s){ return String(s || '').toLowerCase().replace(/[“”"'`]/g, '').replace(/(\d)\s*(kg|mm|cm|m|g|ml|l|in|inch|ft|ga|gauge)\b/g, '$1$2').replace(/[^a-z0-9#./ ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function nf45Match(name, q){
  const n = ' ' + nf45Norm(name) + ' ', toks = nf45Norm(q).split(' ').filter(Boolean); if(!toks.length) return 0;
  const syn = typeof CPO_SYN !== 'undefined' ? CPO_SYN : {};
  let score = 0;
  for(const t of toks){
    const alts = [t].concat(syn[t] ? [syn[t]] : []).concat(t.length > 3 && t.endsWith('s') ? [t.slice(0, -1)] : []);
    let best = 0; alts.forEach(a => { if(n.includes(' ' + a)) best = Math.max(best, 3); else if(n.includes(a)) best = Math.max(best, 1); });
    if(!best) return 0; score += best;
  }
  if(nf45Norm(name).startsWith(nf45Norm(q))) score += 5; return score;
}
const NF45_GROUPS = [['Cement, sand & gravel', /cement|semento|sand|buhangin|gravel|graba|hollow ?block|aggregate|mortar/i], ['Steel & rebar', /rebar|steel|bakal|i-?beam|beam|angle|plate|tube|pipe|purlin|flat ?bar|round ?bar|deformed/i], ['Wire, nails & fasteners', /wire|alambre|nail|pako|screw|bolt|nut|tie|rivet/i], ['Welding', /weld|electrode|rod/i], ['Paint', /paint|pintura|primer|thinner|varnish|enamel/i], ['Wood & boards', /lumber|plywood|wood|kahoy|board|ply/i], ['Roofing', /roof|yero|gutter|gi sheet/i], ['Plumbing & electrical', /pvc|faucet|valve|elbow|tee|wire ?thhn|breaker|outlet|switch|bulb/i]];
function nf45Group(n){ const g = NF45_GROUPS.find(([, re]) => re.test(n)); return g ? g[0] : 'Other items'; }
function nf45Stock(n){ const it = (inventoryData || []).find(x => x.name.toLowerCase() === String(n).toLowerCase()); return it ? it : null; }
function nf45BrowseHtml(){
  const all = nf44AllItems(); if(!all.length) return '';
  const btn = `<button type="button" class="nf45-browse-btn ${NF45S.browse ? 'on' : ''}" onclick="NF45S.browse=!NF45S.browse; qsRender()" aria-expanded="${NF45S.browse}">${NF45S.browse ? 'Hide the item list ▴' : `Browse all ${all.length} items ▾`}</button>`;
  if(!NF45S.browse) return btn;
  const groups = {}; all.forEach(n => { const g = nf45Group(n); (groups[g] = groups[g] || []).push(n); });
  const gk = Object.keys(groups).sort((a, b) => a === 'Other items' ? 1 : b === 'Other items' ? -1 : a.localeCompare(b));
  let list = all; if(NF45S.bg !== 'all') list = groups[NF45S.bg] || [];
  if(NF45S.bq.trim()) list = list.map(n => [n, nf45Match(n, NF45S.bq)]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const inSale = new Set((QS.lines || []).map(l => String(l.product).toLowerCase()));
  return btn + `<div class="nf45-browse"><div class="nf45-bhead"><input type="search" placeholder="Filter: type part of a name, a size or a Tagalog word (semento, bakal…)" value="${escapeHtml(NF45S.bq)}" oninput="NF45S.bq=this.value; nf45BrowseList()" aria-label="Filter the item list" autocomplete="off"></div>
    ${gk.length > 1 ? `<div class="nf45-bchips"><button type="button" class="${NF45S.bg === 'all' ? 'on' : ''}" onclick="NF45S.bg='all'; qsRender()">All ${all.length}</button>${gk.map(g => `<button type="button" class="${NF45S.bg === g ? 'on' : ''}" onclick="NF45S.bg=${JSON.stringify(g).replace(/"/g, '&quot;')}; qsRender()">${escapeHtml(g)} ${groups[g].length}</button>`).join('')}</div>` : ''}
    <div class="nf45-blist" id="nf45BList">${nf45BrowseRows(list, inSale)}</div></div>`;
}
function nf45BrowseRows(list, inSale){
  inSale = inSale || new Set((QS.lines || []).map(l => String(l.product).toLowerCase()));
  if(!list.length) return `<p class="nf45-bnone">No item matches. Type the name in the search above to add it as a new item.</p>`;
  return list.map(n => { const st = nf45Stock(n), pr = bkItemPrice(n), on = inSale.has(n.toLowerCase());
    return `<button type="button" class="nf45-brow ${on ? 'in' : ''}" onclick="nf44QsAdd(${JSON.stringify(n).replace(/"/g, '&quot;')})"><span class="nm">${escapeHtml(n)}</span><span class="st ${st && st.status === 'critical' ? 'low' : ''}">${st ? st.onHand + ' left' : ''}</span><em>${pr ? bkPeso(pr) : 'no price'}</em><i aria-hidden="true">${on ? '+1' : '+'}</i></button>`; }).join('');
}
function nf45BrowseList(){ const box = document.getElementById('nf45BList'); if(!box) return; const all = nf44AllItems(); let list = NF45S.bg === 'all' ? all : all.filter(n => nf45Group(n) === NF45S.bg); if(NF45S.bq.trim()) list = list.map(n => [n, nf45Match(n, NF45S.bq)]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).map(x => x[0]); box.innerHTML = nf45BrowseRows(list); }
// the search box above also understands partial words, sizes and Tagalog
function nf44QsFind(v){
  NF44S.q = v; const box = document.getElementById('nf44Res'); if(!box) return; const q = v.trim();
  const hits = q ? nf44AllItems().map(n => [n, nf45Match(n, q)]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0]) : [];
  const exact = hits.some(n => n.toLowerCase() === q.toLowerCase());
  box.innerHTML = hits.map(n => { const st = nf45Stock(n); return `<button type="button" onclick="nf44QsAdd(${JSON.stringify(n).replace(/"/g, '&quot;')})"><span>${escapeHtml(n)}</span><small>${st ? st.onHand + ' left' : ''}</small><em>${bkItemPrice(n) ? bkPeso(bkItemPrice(n)) : ''}</em></button>`; }).join('')
    + (q && !exact ? `<button type="button" class="nf45-new" onclick="nf44QsAdd(${JSON.stringify(q).replace(/"/g, '&quot;')})"><span>+ Add “${escapeHtml(q)}” as a new item</span><em>new</em></button>` : '');
  box.hidden = !q;
}
window.nf44QsFind = nf44QsFind;

function nf45CustInfo(){
  const info = {};
  const add = (n) => info[n] = info[n] || {owes: 0, last: '', n: 0};
  try{ getSupplierPOs().filter(o => o.buyerName && !['draft', 'cancelled'].includes(o.status)).forEach(o => { const x = add(o.buyerName); x.n++; const d = String(o.createdDate || '').slice(0, 10); if(d > x.last) x.last = d; }); }catch(e){}
  (BK.sales || []).filter(s => !s.voidedAt && s.customer && s.customer !== 'Walk-in').forEach(s => { const x = add(s.customer); x.n++; if(String(s.date) > x.last) x.last = String(s.date); x.owes += (typeof bkSaleBalance === 'function' ? bkSaleBalance(s) : 0) || 0; });
  try{ unpaidInvoicesFor('supplier').forEach(r => { const x = add(r.po.buyerName); x.owes += r.balance; }); }catch(e){}
  bkCustomerNames().forEach(n => add(n));
  return info;
}
function nf45CustHtml(custs){
  const sel = QS.customer && QS.customer !== 'Walk-in' && !custs.includes(QS.customer) ? QS.customer : '';
  return `${sel ? `<div class="nf45-csel"><span>✓</span><b>${escapeHtml(sel)}</b><button type="button" class="nf43-link" onclick="QS.customer='Walk-in'; qsRender()">Change</button></div>` : ''}
    <div class="nf45-cfind"><label for="nf45Cust">Someone else? Find them by name</label>
      <input id="nf45Cust" type="search" autocomplete="off" placeholder="Type a name, e.g. Bayview" value="${escapeHtml(NF45S.cq)}" oninput="NF45S.cq=this.value; nf45CustList()" onfocus="nf45CustList()" onkeydown="if(event.key==='Enter'){ event.preventDefault(); const b=document.querySelector('#nf45CRes button'); if(b) b.click(); } if(event.key==='Escape'){ document.getElementById('nf45CRes').hidden=true; }" aria-label="Find a customer" aria-controls="nf45CRes">
      <div class="nf45-cres" id="nf45CRes" role="listbox" hidden></div></div>`;
}
function nf45CustList(showAll){
  const box = document.getElementById('nf45CRes'); if(!box) return;
  const info = nf45CustInfo(), names = Object.keys(info), q = NF45S.cq.trim();
  let list = q ? names.map(n => [n, nf45Match(n, q)]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).map(x => x[0]) : names.slice().sort((a, b) => String(info[b].last).localeCompare(String(info[a].last)) || a.localeCompare(b));
  const total = list.length; if(!showAll && !q) list = list.slice(0, 6); else list = list.slice(0, 60);
  box.innerHTML = list.map(n => { const x = info[n]; return `<button type="button" role="option" onclick="QS.customer=${JSON.stringify(n).replace(/"/g, '&quot;')}; NF45S.cq=''; qsRender()"><span class="av">${escapeHtml(n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span><span class="nm"><b>${escapeHtml(n)}</b><small>${x.last ? 'Last bought ' + escapeHtml(nf45Day(x.last)) : 'No sales yet'}${x.n ? ' · ' + x.n + (x.n === 1 ? ' purchase' : ' purchases') : ''}</small></span>${x.owes >= 1 ? `<em class="owes">owes ${bkPeso(x.owes)}</em>` : ''}</button>`; }).join('')
    + (!q && !showAll && total > 6 ? `<button type="button" class="nf45-call" onclick="event.stopPropagation(); nf45CustList(true)">See all ${total} customers (A to Z) ▾</button>` : '')
    + (q && !names.some(n => n.toLowerCase() === q.toLowerCase()) ? `<button type="button" class="nf45-new" onclick="QS.customer=${JSON.stringify(q).replace(/"/g, '&quot;')}; NF45S.cq=''; qsRender()"><span>+ New customer: “${escapeHtml(q)}”</span></button>` : '')
    || '<p class="nf45-bnone">No customers yet. Type a name to add one.</p>';
  if(showAll && !q){ box.innerHTML = list.sort((a, b) => a.localeCompare(b)).map(n => { const x = info[n]; return `<button type="button" role="option" onclick="QS.customer=${JSON.stringify(n).replace(/"/g, '&quot;')}; NF45S.cq=''; qsRender()"><span class="av">${escapeHtml(n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span><span class="nm"><b>${escapeHtml(n)}</b><small>${x.last ? 'Last bought ' + escapeHtml(nf45Day(x.last)) : 'No sales yet'}</small></span>${x.owes >= 1 ? `<em class="owes">owes ${bkPeso(x.owes)}</em>` : ''}</button>`; }).join(''); }
  box.hidden = false;
}
document.addEventListener('click', e => { const r = document.getElementById('nf45CRes'); if(r && !r.hidden && !e.target.closest('.nf45-cfind')) r.hidden = true; });
(function(){ const o = window.openQuickSale; if(typeof o !== 'function' || o._nf45) return; const w = function(){ Object.assign(NF45S, {browse: false, bq: '', bg: 'all', cq: ''}); return o.apply(this, arguments); }; Object.keys(o).forEach(k => { w[k] = o[k]; }); w._nf45 = true; window.openQuickSale = w; try{ openQuickSale = w; }catch(e){} })();

function nf45RecentCusts(k){ const info = nf45CustInfo(); return Object.keys(info).filter(n => n !== 'Walk-in').sort((a, b) => String(info[b].last).localeCompare(String(info[a].last)) || info[b].n - info[a].n || a.localeCompare(b)).slice(0, k); }
