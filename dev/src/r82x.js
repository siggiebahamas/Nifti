/* ===== Round 82 · Operations: feedback with a screenshot, weekly check-in, import templates ===== */
const NF82X = {kind: 'broken', text: '', shot: null, busy: false, rate: 0, note: ''};
function nf82Ops(){ try{ return Object.assign({}, bkSettings().nf_ops || {}); }catch(e){ return {}; } }
function nf82CheckinDue(){ const o = nf82Ops(); return !o.checkin || daysBetween(String(o.checkin).slice(0, 10), APP_TODAY) >= 7; }
function nf82PageName(){ const a = document.querySelector('.app-page.active'); const k = a ? a.id.replace(/^page-/, '') : ''; try{ return (typeof nf82PageLabel === 'function' ? nf82PageLabel(k) : k) || k; }catch(e){ return k; } }

/* ---------- Home: one small help-desk card at the bottom ---------- */
function nf82DeskHtml(){
  const due = nf82CheckinDue();
  return `<section class="panel-card nf82-desk" aria-labelledby="nf82DeskH"><div class="hd"><h2 id="nf82DeskH">Help us make Nifti better for you</h2><span>We read every message.</span></div>
    <div class="tl">
      <button type="button" onclick="nf82FbOpen()"><span class="ic">${nf82Ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>', 22)}</span><span class="tx"><b>Send feedback</b><small>Something broken, an idea, a question. Add a screenshot.</small></span></button>
      <button type="button" class="${due ? 'due' : ''}" onclick="nf82CiOpen()"><span class="ic">${nf82Ic('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>', 22)}</span><span class="tx"><b>Weekly check-in${due ? ' <em>due</em>' : ''}</b><small>${due ? 'One tap: how was Nifti this week?' : 'Done this week. Thank you!'}</small></span></button>
      <button type="button" onclick="nf82ImpOpen()"><span class="ic">${nf82Ic('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>', 22)}</span><span class="tx"><b>Bring in your records</b><small>Excel templates for your items and who owes you.</small></span></button>
    </div></section>`;
}
function nf82DeskPaint(){
  const home = document.getElementById('mhHome'); if(!home || !home.offsetParent) return;
  let own = true; try{ own = isPrivilegedUser() && !previewRole; }catch(e){}
  let box = document.getElementById('nf82Desk'); if(!own){ if(box) box.remove(); return; }
  const html = nf82DeskHtml(); if(!box){ box = document.createElement('div'); box.id = 'nf82Desk'; }
  if(box.dataset.k !== html){ box.dataset.k = html; box.innerHTML = html; }
  if(home.lastElementChild !== box) home.appendChild(box);
}
NF45_AFTER.push(page => { try{ if(page && page.id === 'page-dashboard') nf82DeskPaint(); }catch(e){} });

/* ---------- feedback with a screenshot ---------- */
function nf82FbOpen(kind){
  try{ if(typeof closeUserMenu === 'function') closeUserMenu(); }catch(e){}
  NF82X.kind = kind || NF82X.kind || 'broken'; NF82X.page = nf82PageName(); NF82X.err = '';
  slModal('nf82Fb', `<div class="sl-sheet-h"><b>Send feedback</b><button class="sl-x" onclick="slClose('nf82Fb')" aria-label="Close">✕</button></div><div class="nf82-fb" id="nf82FbBody"></div>`);
  nf82FbPaint();
}
function nf82FbPaint(){
  const b = document.getElementById('nf82FbBody'); if(!b) return;
  const K = [['broken', "Something's not working"], ['idea', 'An idea'], ['question', 'A question'], ['praise', 'Something I like']];
  b.innerHTML = `<div class="ch" role="radiogroup" aria-label="What is it about?">${K.map(([k, l]) => `<button type="button" role="radio" aria-checked="${NF82X.kind === k}" class="${NF82X.kind === k ? 'on' : ''}" onclick="NF82X.kind='${k}'; NF82X.text=document.getElementById('nf82FbT').value; nf82FbPaint()">${l}</button>`).join('')}</div>
    <label class="fl"><span>${NF82X.kind === 'broken' ? 'What happened? What did you expect?' : NF82X.kind === 'idea' ? 'What would make Nifti better for you?' : NF82X.kind === 'question' ? 'What would you like to know?' : 'What do you like?'}</span><textarea id="nf82FbT" rows="5" maxlength="2000" placeholder="Taglish is fine.">${nf82E(NF82X.text || '')}</textarea></label>
    <div class="shot"><span class="lb">Screenshot <small>optional, shows us exactly what you see</small></span>
      ${NF82X.shot ? `<div class="pv"><img src="${NF82X.shot}" alt="Your screenshot"><button type="button" class="nf82-lk" onclick="NF82X.shot=null; nf82FbPaint()">Remove</button></div>` : `<div class="sb"><button type="button" class="nf82-btn s" onclick="nf82FbCapture()">${nf82Ic('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>', 17)}Capture this screen</button><label class="nf82-btn s up">${nf82Ic('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>', 17)}Upload a picture<input type="file" accept="image/*" onchange="nf82FbFile(this)"></label></div>`}</div>
    <p class="meta">We also send the page you're on (${nf82E(NF82X.page || 'Home')}) so we can find it.</p>
    <div class="err" role="alert">${nf82E(NF82X.err || '')}</div>
    <div class="ft"><button type="button" class="nf82-btn s" onclick="slClose('nf82Fb')">Cancel</button><button type="button" class="nf82-btn p" id="nf82FbSend" onclick="nf82FbSend()">${NF82X.busy ? 'Sending…' : 'Send to Nifti'}</button></div>`;
}
function nf82LoadScript(src){ return new Promise((res, rej) => { if(document.querySelector(`script[src="${src}"]`)){ const t = setInterval(() => { if(window.html2canvas){ clearInterval(t); res(); } }, 50); setTimeout(() => { clearInterval(t); res(); }, 8000); return; } const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => res(); s.onerror = rej; document.head.appendChild(s); }); }
async function nf82FbCapture(){
  NF82X.text = (document.getElementById('nf82FbT') || {}).value || NF82X.text;
  const m = document.getElementById('nf82Fb'); if(m) m.style.visibility = 'hidden';
  try{
    if(!window.html2canvas) await nf82LoadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    const c = await window.html2canvas(document.body, {x: window.scrollX, y: window.scrollY, width: innerWidth, height: innerHeight, scale: Math.min(1, 1600 / innerWidth), useCORS: true, logging: false, backgroundColor: '#FFFFFF', ignoreElements: el => el.id === 'nf82Fb' || el.classList && el.classList.contains('nf82-rc')});
    NF82X.shot = c.toDataURL('image/jpeg', 0.8);
  }catch(e){ showToast("Couldn't capture the screen here. Upload a picture instead.", 'warn'); }
  if(m) m.style.visibility = ''; nf82FbPaint();
}
function nf82FbFile(inp){
  const f = inp.files && inp.files[0]; if(!f) return; NF82X.text = (document.getElementById('nf82FbT') || {}).value || NF82X.text;
  const img = new Image(); img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); NF82X.shot = c.toDataURL('image/jpeg', 0.82); URL.revokeObjectURL(img.src); nf82FbPaint(); };
  img.onerror = () => showToast("That picture couldn't be opened.", 'warn'); img.src = URL.createObjectURL(f);
}
async function nf82FbSend(){
  if(NF82X.busy) return;
  const t = String((document.getElementById('nf82FbT') || {}).value || '').trim(); NF82X.text = t;
  if(t.length < 3 && !NF82X.shot){ NF82X.err = 'Write a few words or add a screenshot.'; nf82FbPaint(); const i = document.getElementById('nf82FbT'); if(i) i.focus(); return; }
  const label = {broken: "Something's not working", idea: 'Idea', question: 'Question', praise: 'Something I like'}[NF82X.kind] || 'Feedback';
  const message = `${label}: ${t || '(screenshot only)'}\n— Page: ${NF82X.page || ''} · Screen ${innerWidth}×${innerHeight}${navigator.onLine ? '' : ' · offline'}`;
  NF82X.busy = true; NF82X.err = ''; nf82FbPaint();
  if(myBusiness){
    let path = null; if(NF82X.shot){ try{ path = await bkUploadPhoto(NF82X.shot, 'feedback-' + Date.now()); }catch(e){ path = null; } }
    let me = null; try{ me = getActiveTeamMembers().find(m => m.id === currentUserId); }catch(e){}
    const { error } = await sb.from('support_messages').insert({business_id: myBusiness.id, category: 'feedback', message: message.slice(0, 4000), from_name: me ? me.name : null, attachment_path: path});
    NF82X.busy = false;
    if(error){ NF82X.err = "Couldn't send. Check your internet and try again."; nf82FbPaint(); return; }
  } else NF82X.busy = false;
  NF82X.text = ''; NF82X.shot = null;
  const b = document.getElementById('nf82FbBody'); if(b) b.innerHTML = `<div class="nf82-thx">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 30)}<b>Salamat! We got it.</b><p>${myBusiness ? "We'll reply in Help & Support, usually within a day." : 'This is the sample shop, so nothing was sent. In your own account it goes straight to the Nifti team.'}</p><button type="button" class="nf82-btn p" onclick="slClose('nf82Fb')">Done</button></div>`;
}

/* ---------- weekly check-in ---------- */
function nf82CiOpen(){
  try{ if(typeof closeUserMenu === 'function') closeUserMenu(); }catch(e){}
  NF82X.rate = 0; NF82X.note = '';
  slModal('nf82Ci', `<div class="sl-sheet-h"><b>Weekly check-in</b><button class="sl-x" onclick="slClose('nf82Ci')" aria-label="Close">✕</button></div><div class="nf82-ci" id="nf82CiBody"></div>`);
  nf82CiPaint();
}
const NF82_RATE = [[1, 'Hard to use'], [2, 'Not great'], [3, 'Okay'], [4, 'Good'], [5, 'Great']];
function nf82CiFace(n){ const m = {1: 'M8 16.5c1-1.2 2.4-2 4-2s3 .8 4 2', 2: 'M8.5 16c.9-.6 2.1-1 3.5-1s2.6.4 3.5 1', 3: 'M8.5 15.5h7', 4: 'M8.5 14.5c.9.9 2.1 1.5 3.5 1.5s2.6-.6 3.5-1.5', 5: 'M8 14c1 1.6 2.4 2.5 4 2.5s3-.9 4-2.5'}[n]; return nf82Ic(`<circle cx="12" cy="12" r="10"/><path d="M9 9.5h.01M15 9.5h.01"/><path d="${m}"/>`, 30); }
function nf82CiPaint(){
  const b = document.getElementById('nf82CiBody'); if(!b) return;
  b.innerHTML = `<p class="q">How was Nifti for your shop this week?</p>
    <div class="rt" role="radiogroup" aria-label="Rating">${NF82_RATE.map(([n, l]) => `<button type="button" role="radio" aria-checked="${NF82X.rate === n}" class="r${n}${NF82X.rate === n ? ' on' : ''}" onclick="NF82X.note=(document.getElementById('nf82CiT')||{}).value||NF82X.note; NF82X.rate=${n}; nf82CiPaint()">${nf82CiFace(n)}<span>${l}</span></button>`).join('')}</div>
    ${NF82X.rate ? `<label class="fl"><span>${NF82X.rate <= 3 ? 'What got in the way? We\'ll fix it.' : 'What helped the most? Anything to add?'} <small>optional</small></span><textarea id="nf82CiT" rows="4" maxlength="1500" placeholder="Taglish is fine.">${nf82E(NF82X.note)}</textarea></label>
    <div class="ft"><button type="button" class="nf82-btn s" onclick="slClose('nf82Ci')">Later</button><button type="button" class="nf82-btn p" onclick="nf82CiSend()">Send</button></div>` : '<p class="hint">Tap a face. It takes 10 seconds.</p>'}`;
}
async function nf82CiSend(){
  const note = String((document.getElementById('nf82CiT') || {}).value || '').trim(), r = NF82X.rate; if(!r) return;
  if(myBusiness){ let me = null; try{ me = getActiveTeamMembers().find(m => m.id === currentUserId); }catch(e){}
    const { error } = await sb.from('support_messages').insert({business_id: myBusiness.id, category: 'checkin', message: `Weekly check-in: ${r}/5 (${NF82_RATE[r - 1][1]})${note ? ' · ' + note : ''}`.slice(0, 4000), from_name: me ? me.name : null});
    if(error){ showToast("Couldn't send. Check your internet and try again.", 'error'); return; } }
  await bkSaveSettings({nf_ops: Object.assign(nf82Ops(), {checkin: APP_TODAY, last_rate: r})});
  const b = document.getElementById('nf82CiBody'); if(b) b.innerHTML = `<div class="nf82-thx">${nf82Ic('<path d="M20 6 9 17l-5-5"/>', 30)}<b>Salamat po!</b><p>${r <= 3 ? "We're sorry it was a hard week. Someone from Nifti will look at this first." : "Glad it's helping. See you next week."}</p><button type="button" class="nf82-btn p" onclick="slClose('nf82Ci')">Done</button></div>`;
  try{ nf82DeskPaint(); }catch(e){}
}

/* ---------- import templates (items and who owes you) ---------- */
function nf82ImpOpen(){
  try{ if(typeof closeUserMenu === 'function') closeUserMenu(); }catch(e){}
  slModal('nf82Imp', `<div class="sl-sheet-h"><b>Bring in your records</b><button class="sl-x" onclick="slClose('nf82Imp')" aria-label="Close">✕</button></div>
    <div class="nf82-imp"><ol class="how"><li><b>1</b>Download a template</li><li><b>2</b>Fill it in (Excel or Google Sheets)</li><li><b>3</b>Upload it. You check everything before it's saved.</li></ol>
      <div class="cards">
        <div class="cd"><span class="ic">${nf82Ic('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>', 24)}</span><b>Items and prices</b><small>Name, SKU or barcode, cost, selling price, how many you have.</small>
          <div class="ac"><a class="nf82-btn s" href="./templates/nifti-items-template.xlsx" download>${nf82Ic('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', 16)}Download template</a><button type="button" class="nf82-btn p" onclick="slClose('nf82Imp'); if(typeof nf26OpenStart === 'function') nf26OpenStart('file'); else go('inventory')">Upload my file</button></div></div>
        <div class="cd"><span class="ic">${nf82Ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>', 24)}</span><b>Who owes you (old utang)</b><small>Customer name, how much they owe, when they should pay, their phone.</small>
          <div class="ac"><button type="button" class="nf82-btn s" onclick="nf82UtTemplate()">${nf82Ic('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', 16)}Download template</button><label class="nf82-btn p up">Upload my file<input type="file" accept=".csv,text/csv,.txt" onchange="nf82UtImport(this)"></label></div></div>
      </div>
      <p class="nt">Prefer to send it to us? Send your file or a photo of your notebook in Help & Support and we'll load it for you.</p></div>`);
}
function nf82UtTemplate(){
  const d = n => addDaysIso(APP_TODAY, n);
  const csv = 'Customer name,Amount owed,Pay by (YYYY-MM-DD),Phone,Note\r\n' + `Aling Nena,1500,${d(7)},09171234567,from notebook p.12\r\n` + `JM Builders,12400,${d(15)},09181234567,cement and rebar\r\n`;
  const blob = new Blob(['﻿' + csv], {type: 'text/csv;charset=utf-8'}), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'nifti-utang-template.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function nf82Csv(text){
  const rows = []; let row = [], cur = '', q = false;
  for(let i = 0; i < text.length; i++){ const c = text[i];
    if(q){ if(c === '"'){ if(text[i + 1] === '"'){ cur += '"'; i++; } else q = false; } else cur += c; }
    else if(c === '"') q = true; else if(c === ',' || c === '\t' || c === ';'){ row.push(cur); cur = ''; } else if(c === '\n'){ row.push(cur); rows.push(row); row = []; cur = ''; } else if(c !== '\r') cur += c; }
  if(cur || row.length){ row.push(cur); rows.push(row); }
  return rows.map(r => r.map(x => x.trim())).filter(r => r.some(Boolean));
}
function nf82DateIn(v){
  const s = String(v || '').trim(); let m;
  if((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  if((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/))){ const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`; }
  const t = Date.parse(s); return isNaN(t) ? null : new Date(t).toLocaleDateString('en-CA');
}
function nf82UtImport(inp){
  const f = inp.files && inp.files[0]; if(!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    const rows = nf82Csv(String(rd.result || '').replace(/^﻿/, '')); if(rows.length < 2){ showToast("That file looks empty. Use the template's columns.", 'warn'); return; }
    const head = rows[0].map(h => h.toLowerCase()), col = re => head.findIndex(h => re.test(h));
    const ci = {n: col(/name|customer|pangalan/), a: col(/amount|owe|utang|balance|halaga/), d: col(/pay by|due|date|petsa/), p: col(/phone|mobile|number|cp/), r: col(/note|ref|remarks/)};
    if(ci.n < 0 || ci.a < 0){ showToast('Keep the "Customer name" and "Amount owed" columns from the template.', 'warn'); return; }
    const list = rows.slice(1).map(r => ({name: r[ci.n] || '', amount: String(r[ci.a] || '').replace(/[₱,\s]/g, ''), due: (ci.d >= 0 && nf82DateIn(r[ci.d])) || nf82DefaultDue(APP_TODAY), phone: ci.p >= 0 ? r[ci.p] : '', ref: ci.r >= 0 ? r[ci.r] : ''})).filter(x => x.name && Number(x.amount) > 0);
    if(!list.length){ showToast('No rows with a name and an amount were found.', 'warn'); return; }
    slClose('nf82Imp');
    try{
      if(typeof openOpeningBalances === 'function'){ if(typeof currentAppRole !== 'undefined' && currentAppRole !== 'supplier' && typeof switchAppRole === 'function'){ try{ switchAppRole('supplier'); }catch(e){} }
        openOpeningBalances();
        if(typeof OB !== 'undefined' && OB && typeof obNewRow === 'function'){ OB.rows = list.map(x => obNewRow({buyerId: '', name: x.name.slice(0, 120), amount: x.amount, due: x.due, dueKind: 'date', phone: x.phone, ref: x.ref})); OB.err = ''; obRender(); }
        showToast(`${list.length} customer${list.length === 1 ? '' : 's'} read from your file. Check them, then save.`, 'success');
      }
    }catch(e){ console.warn('nf82 import', e); showToast("Couldn't open the list. Try again.", 'error'); }
  };
  rd.readAsText(f);
}

/* ===== Round 83: bringing records in, the easy way (type or paste first; photo or spreadsheet if they prefer) ===== */
const NF83B = {tab: 'items', items: null, owed: null, paste: false, pasteText: ''};
function nf83BringOpen(tab){
  if(typeof nf83CloseOverlays === 'function') nf83CloseOverlays();
  NF83B.tab = tab === 'utang' ? 'utang' : 'items'; NF83B.paste = false;
  if(!NF83B.items) NF83B.items = [{n: '', p: '', q: ''}, {n: '', p: '', q: ''}, {n: '', p: '', q: ''}];
  if(!NF83B.owed) NF83B.owed = [{n: '', a: '', d: 'd15'}, {n: '', a: '', d: 'd15'}];
  slModal('nf83Bring', `<div class="sl-sheet-h"><b>Bring in your records</b><button class="sl-x" onclick="slClose('nf83Bring')" aria-label="Close">✕</button></div><div class="nf83-br" id="nf83BrBody"></div>`);
  nf83BringPaint();
}
function nf83Grab(){
  const b = document.getElementById('nf83BrBody'); if(!b) return;
  b.querySelectorAll('[data-r]').forEach(inp => { const [list, i, f] = inp.dataset.r.split(':'); const arr = list === 'i' ? NF83B.items : NF83B.owed; if(arr[+i]) arr[+i][f] = inp.value; });
  const pt = document.getElementById('nf83Paste'); if(pt) NF83B.pasteText = pt.value;
}
function nf83BringPaint(){
  const b = document.getElementById('nf83BrBody'); if(!b) return; const t = NF83B.tab;
  const tabs = `<div class="tb" role="tablist"><button type="button" role="tab" aria-selected="${t === 'items'}" class="${t === 'items' ? 'on' : ''}" onclick="nf83Grab(); NF83B.tab='items'; nf83BringPaint()">Your items and prices</button><button type="button" role="tab" aria-selected="${t === 'utang'}" class="${t === 'utang' ? 'on' : ''}" onclick="nf83Grab(); NF83B.tab='utang'; nf83BringPaint()">Who owes you</button></div>`;
  const way = (ic, ti, d, fn) => `<button type="button" class="wy" onclick="${fn}"><span class="ic">${nf82Ic(ic, 20)}</span><span><b>${ti}</b><small>${d}</small></span></button>`;
  let body = '';
  if(t === 'items') body = `<p class="ld">Type a few items now. You can add the rest any time in Stock.</p>
    <div class="rows it"><div class="rh"><span>Item name</span><span>Selling price</span><span>In stock</span><span></span></div>
      ${NF83B.items.map((r, i) => `<div class="rr"><input data-r="i:${i}:n" value="${nf82E(r.n)}" placeholder="${['e.g. Portland Cement 40kg', 'e.g. Coke 1.5L', 'e.g. Rebar 10mm'][i % 3]}" aria-label="Item name ${i + 1}"><span class="pe"><i>₱</i><input data-r="i:${i}:p" value="${nf82E(r.p)}" inputmode="decimal" placeholder="0" aria-label="Selling price ${i + 1}"></span><input data-r="i:${i}:q" value="${nf82E(r.q)}" inputmode="numeric" placeholder="0" aria-label="How many ${i + 1}"><button type="button" class="rm" onclick="nf83Grab(); NF83B.items.splice(${i},1); if(!NF83B.items.length) NF83B.items.push({n:'',p:'',q:''}); nf83BringPaint()" aria-label="Remove row">${nf82Ic('<path d="M18 6 6 18M6 6l12 12"/>', 15)}</button></div>`).join('')}
      <button type="button" class="nf82-lk add" onclick="nf83Grab(); NF83B.items.push({n:'',p:'',q:''}); nf83BringPaint()">+ Add another item</button></div>
    <div class="ft"><span class="er" id="nf83BrErr" role="alert"></span><button type="button" class="nf82-btn p" onclick="nf83SaveItems()">Save items</button></div>
    <div class="or"><span>Or, if it's easier</span></div>
    <div class="ways">${way('<path d="M12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5z"/>', 'Start from a ready list', 'Common items for your kind of shop. Just fix the prices.', "slClose('nf83Bring'); nf26OpenStart('kind')")}
      ${way('<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3"/>', 'Send us a photo', 'Snap your price list or notebook. The Nifti team types it in for you.', "nf83PhotoHelp('items')")}
      ${way('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>', 'Have a spreadsheet?', 'Upload Excel or Google Sheets. Nifti reads the columns.', "slClose('nf83Bring'); if(typeof nf41ImportOpen === 'function') nf41ImportOpen(); else nf26OpenStart('file')")}</div>`;
  else body = NF83B.paste ? `<p class="ld">Paste or type one customer per line, like you'd write in a notebook. Nifti finds the name, the amount and the date.</p>
    <textarea id="nf83Paste" rows="7" placeholder="Aling Nena 1,500 Dec 15&#10;JM Builders 12400 30 days&#10;Kuya Ramil 640">${nf82E(NF83B.pasteText)}</textarea>
    <div class="ft"><button type="button" class="nf82-btn s" onclick="nf83Grab(); NF83B.paste=false; nf83BringPaint()">Back</button><button type="button" class="nf82-btn p" onclick="nf83ReadPaste()">Read my list</button></div>`
    : `<p class="ld">Who owes you from before Nifti? Add them here. They show up in Who owes you, with reminders on their pay-by date.</p>
    <div class="rows ow"><div class="rh"><span>Customer</span><span>Amount owed</span><span>Pay by</span><span></span></div>
      ${NF83B.owed.map((r, i) => `<div class="rr"><input data-r="o:${i}:n" value="${nf82E(r.n)}" placeholder="${['e.g. Aling Nena', 'e.g. JM Builders'][i % 2]}" aria-label="Customer ${i + 1}"><span class="pe"><i>₱</i><input data-r="o:${i}:a" value="${nf82E(r.a)}" inputmode="decimal" placeholder="0" aria-label="Amount ${i + 1}"></span><select data-r="o:${i}:d" aria-label="Pay by ${i + 1}">${[['d7', 'In 1 week'], ['d15', 'In 15 days'], ['d30', 'In 30 days'], ['payday', 'Next payday'], ['late', 'Already late']].map(([k, l]) => `<option value="${k}" ${r.d === k ? 'selected' : ''}>${l}</option>`).join('')}</select><button type="button" class="rm" onclick="nf83Grab(); NF83B.owed.splice(${i},1); if(!NF83B.owed.length) NF83B.owed.push({n:'',a:'',d:'d15'}); nf83BringPaint()" aria-label="Remove row">${nf82Ic('<path d="M18 6 6 18M6 6l12 12"/>', 15)}</button></div>`).join('')}
      <button type="button" class="nf82-lk add" onclick="nf83Grab(); NF83B.owed.push({n:'',a:'',d:'d15'}); nf83BringPaint()">+ Add another customer</button></div>
    <div class="ft"><span class="er" id="nf83BrErr" role="alert"></span><button type="button" class="nf82-btn p" onclick="nf83SaveOwed()">Save who owes you</button></div>
    <div class="or"><span>Or, if it's easier</span></div>
    <div class="ways">${way('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>', 'Paste from your notes', 'Copy a list from your phone notes or Viber. One customer per line.', "nf83Grab(); NF83B.paste=true; nf83BringPaint(); setTimeout(() => { const t = document.getElementById('nf83Paste'); if(t) t.focus(); }, 30)")}
      ${way('<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3"/>', 'Send us a photo', 'Snap your utang notebook. The Nifti team types it in for you.', "nf83PhotoHelp('utang')")}
      ${way('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>', 'Have a spreadsheet?', 'Upload a CSV with name, amount and pay-by date.', "nf83CsvPick()")}</div>
      <input type="file" id="nf83Csv" accept=".csv,text/csv,.txt" hidden onchange="nf82UtImport(this)">`;
  b.innerHTML = tabs + body;
}
function nf83CsvPick(){ const i = document.getElementById('nf83Csv'); if(i) i.click(); }
function nf83PhotoHelp(kind){ slClose('nf83Bring'); NF82X.text = kind === 'items' ? 'Please type in my items and prices from this photo.' : 'Please type in who owes me from this photo of my notebook.'; NF82X.shot = null; nf82FbOpen('question'); }
function nf83DueOf(k){ return k === 'payday' ? nf82Payday(APP_TODAY) : k === 'late' ? APP_TODAY : addDaysIso(APP_TODAY, Number(String(k).slice(1)) || 15); }
async function nf83SaveItems(){
  nf83Grab(); const err = document.getElementById('nf83BrErr');
  const rows = NF83B.items.map(r => ({n: String(r.n || '').trim().slice(0, 120), p: Number(String(r.p || '').replace(/[,₱\s]/g, '')) || 0, q: Math.max(0, parseInt(String(r.q || '').replace(/[,\s]/g, '')) || 0)})).filter(r => r.n);
  if(!rows.length){ if(err) err.textContent = 'Type at least one item name.'; return; }
  const dup = rows.find(r => (inventoryData || []).some(x => String(x.name).toLowerCase() === r.n.toLowerCase())); if(dup){ if(err) err.textContent = `${dup.n} is already in Stock.`; return; }
  if(typeof requirePermission === 'function' && !requirePermission('editInventory')) return;
  const made = rows.map(r => { const code = generateUniqueSkuCode('SKU-', inventoryData, 1000, 8999), rop = 5; const it = {id: newRecordId(), code, name: r.n, warehouse: (inventoryData[0] && inventoryData[0].warehouse) || 'main', onHand: r.q, rop, maxLevel: rop * 3, lot: null, exp: null, status: r.q <= rop ? 'critical' : 'healthy', supplier: 'Not set', daysLeft: 14, leadTime: 5, sellPrice: r.p || null}; try{ assignBarcodeIfMissing(it, '48'); }catch(e){} inventoryData.push(it); return it; });
  try{ syncInventoryToSupabase(made); }catch(e){}
  try{ scheduleNiftiSave(); }catch(e){}
  NF83B.items = null; slClose('nf83Bring');
  showToast(`${made.length} item${made.length === 1 ? '' : 's'} added to Stock.`, 'success');
  try{ nf82StartPaint(true); }catch(e){}
}
async function nf83SaveOwed(){
  nf83Grab(); const err = document.getElementById('nf83BrErr');
  const rows = NF83B.owed.map(r => ({n: String(r.n || '').trim().slice(0, 120), a: Number(String(r.a || '').replace(/[,₱\s]/g, '')) || 0, d: nf83DueOf(r.d)})).filter(r => r.n || r.a);
  if(!rows.length){ if(err) err.textContent = 'Add at least one customer and how much they owe.'; return; }
  const bad = rows.find(r => r.n.length < 2 || !(r.a >= 1)); if(bad){ if(err) err.textContent = bad.n.length < 2 ? 'Each line needs the customer name.' : `How much does ${bad.n} owe?`; return; }
  slClose('nf83Bring');
  try{
    if(typeof currentAppRole !== 'undefined' && currentAppRole !== 'supplier' && typeof switchAppRole === 'function') switchAppRole('supplier');
    openOpeningBalances();
    OB.rows = rows.map(r => obNewRow({buyerId: '', name: r.n, amount: String(r.a), due: r.d, dueKind: 'date'}));
    obRender(); await obSave();
    NF83B.owed = null; try{ nf82StartPaint(true); nf82Repaint(); }catch(e){}
  }catch(e){ console.warn('nf83 owed', e); showToast("Couldn't save. Try again.", 'error'); }
}
function nf83ReadPaste(){
  nf83Grab(); const lines = String(NF83B.pasteText || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
  const got = lines.map(l => { try{ return obParseLine(l); }catch(e){ return null; } }).filter(Boolean);
  if(!got.length){ showToast('Write one customer per line, with a name and an amount. Example: Aling Nena 1500 Dec 15', 'warn'); return; }
  NF83B.owed = got.map(g => ({n: g.name, a: g.amount, d: g.due ? 'pick:' + g.due : 'd15'}));
  NF83B.owed.forEach(r => { if(r.d.startsWith('pick:')){ const dd = r.d.slice(5), days = daysBetween(APP_TODAY, dd); r.d = days <= 0 ? 'late' : days <= 8 ? 'd7' : days <= 20 ? 'd15' : 'd30'; } });
  NF83B.paste = false; nf83BringPaint(); showToast(`${got.length} customer${got.length === 1 ? '' : 's'} read. Check them, then save.`, 'success');
}
nf82ImpOpen = function(){ nf83BringOpen('items'); };
