/* ===== Round 22: the notebook reader, built to feel safe for someone who has never used an app like this ===== */
// One question per screen. Big type, lots of space, plain words. Nifti guesses first, so the person mostly taps
// "Yes". Yellow means "please check", never red. Nothing goes into the books until the last screen, and
// everything from paper stays marked "From paper", with the photo kept, and can be undone for 30 days.

const NF22_NB_KINDS = [
  ['sales', 'Sales', 'What you sold each day', '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'],
  ['utang', 'Utang (who owes me)', 'Customers who will pay later', '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M18 8v6M15 11h6"/>'],
  ['bills', 'What I owe suppliers', 'Bills you still have to pay', '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6"/>'],
  ['stock', 'Stock count or price list', 'Your items, how many, and prices', '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/>'],
  ['exp', 'Expenses', 'Rent, gas, salaries, repairs', '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/>'],
  ['unsure', 'Not sure', 'Nifti will figure it out with you', '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>']];
// what each column can be, each with its own color, used the same way on every screen
const NF22_NB_COLS = {date: ['Date', 'c-date'], who: ['Customer', 'c-who'], what: ['Item', 'c-what'], qty: ['How many', 'c-qty'], amt: ['Amount', 'c-amt'], skip: ['Not needed', 'c-skip']};
// the sample page: what is written, and what Nifti reads it as
const NF22_NB_PAGE = [
  {d: '8/3', w: 'Mang Bert', i: 'sem. 40k', q: '10', a: '2,280', who: 'Mang Bert Construction', item: 'Portland Cement 40kg', price: 228, sure: true, note: '10 × ₱228 = ₱2,280, same as written'},
  {d: '8/3', w: 'Bayvw', i: 'RB12', q: '12', a: '780', who: 'Bayview Construction Co.', item: 'Steel Rebar 12mm', price: 65, ask: ['who', 'what']},
  {d: '8/4', w: 'Aling Nena', i: 'GW 12', q: '1', a: '520', who: 'Aling Nena Store', item: 'Galvanized Wire 12ga', price: 520, ask: ['what']},
  {d: '8/4', w: 'walk-in', i: 'angle bar', q: '5', a: '425', who: 'Walk-in', item: 'Angle Bars', price: 85, sure: true, note: '5 × ₱85 = ₱425'},
  {d: '8/5', w: 'Corazon', i: 'wld rod', q: '2', a: '240', who: 'Corazon Welding Shop', item: 'Welding Rods 3.2mm', price: 120, ask: ['what']},
  {d: '8/5', w: 'Mang Bert', i: 'sem 40k', q: '5', a: '1,140', who: 'Mang Bert Construction', item: 'Portland Cement 40kg', price: 228, sure: true, note: 'Same as line 1'},
  {d: '8/6', w: '≈≈≈', i: '≈≈ ≈≈', q: '?', a: '1,?00', blur: true},
  {d: '8/6', w: 'Bayvw', i: 'RB12', q: '30', a: '1,950', who: 'Bayview Construction Co.', item: 'Steel Rebar 12mm', price: 65, learn: ['Bayvw', 'RB12']},
];
const NB = {step: 0, kind: '', photo: '', cols: ['date', 'who', 'what', 'qty', 'amt'], lines: [], qi: 0, learned: [], added: false};
function nf22NbFont(){ if(document.getElementById('nf22Caveat')) return; const l = document.createElement('link'); l.id = 'nf22Caveat'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap'; document.head.appendChild(l); }
function nf22NbOpen(){
  nf22NbFont();
  Object.assign(NB, {step: 0, kind: '', photo: '', cols: ['date', 'who', 'what', 'qty', 'amt'], qi: 0, learned: [], added: false, picking: -1,
    lines: NF22_NB_PAGE.map((l, i) => Object.assign({n: i + 1, ok: !!l.sure, skipped: false}, l))});
  let ov = document.getElementById('nf22Nb');
  if(!ov){ ov = document.createElement('div'); ov.id = 'nf22Nb'; ov.className = 'nf22-nb'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Read my notebook'); document.body.appendChild(ov);
    ov.addEventListener('click', e => { const b = e.target.closest('[data-nb]'); if(b) nf22NbDo(b.dataset.nb, b.dataset.v, b); });
    ov.addEventListener('change', e => { if(e.target.matches('[data-nbphoto]')){ const f = e.target.files && e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = () => { NB.photo = r.result; NB.step = 2; nf22NbPaint(); }; r.readAsDataURL(f); } }); }
  ov.hidden = false; document.body.classList.add('nf22-nb-open'); nf22NbPaint();
}
function nf22NbClose(){ const ov = document.getElementById('nf22Nb'); if(ov) ov.hidden = true; document.body.classList.remove('nf22-nb-open'); }
const NF22_NB_STEPS = ['What notebook', 'Photo', 'Columns', 'Check', 'Add'];
function nf22NbQs(){ const q = []; NB.lines.forEach((l, i) => { if(l.blur && !l.ok && !l.skipped) q.push({i, k: 'blur'}); (l.ask || []).forEach(k => { if(!l['ok_' + k] && !NB.learned.includes(k === 'who' ? l.w : l.i)) q.push({i, k}); }); }); return q; }
function nf22NbLineOk(l){ if(l.blur) return l.ok || l.skipped; if(l.sure) return true; if(l.learn) return l.learn.every(x => NB.learned.includes(x)); return (l.ask || []).every(k => l['ok_' + k] || NB.learned.includes(k === 'who' ? l.w : l.i)); }
function nf22NbPage(cls){
  const cols = NB.cols;
  return `<div class="nf22-nbpage ${cls || ''}" aria-label="Your notebook page">${NB.photo ? `<img class="nf22-nbphoto" src="${NB.photo}" alt="Your photo of the page">` : ''}
    <div class="nf22-nbsheet ${NB.photo ? 'over' : ''}"><div class="nf22-nbhead">${cols.map((c, i) => `<button type="button" class="nf22-colchip ${NF22_NB_COLS[c][1]}" data-nb="pick" data-v="${i}" aria-label="Column ${i + 1}: ${NF22_NB_COLS[c][0]}. Tap to change">${NF22_NB_COLS[c][0]} <i aria-hidden="true">▾</i></button>`).join('')}</div>
      ${NB.lines.map(l => `<div class="nf22-nbrow ${l.blur ? 'blur' : ''}">${[l.d, l.w, l.i, l.q, l.a].map((v, i) => `<span class="${NF22_NB_COLS[cols[i]][1]}">${v}</span>`).join('')}</div>`).join('')}</div></div>`;
}
function nf22NbPaint(){
  const ov = document.getElementById('nf22Nb'); if(!ov) return;
  const s = NB.step, dots = NF22_NB_STEPS.map((t, i) => `<li class="${i < s ? 'done' : i === s ? 'now' : ''}"><i>${i < s ? '✓' : i + 1}</i><span>${t}</span></li>`).join('');
  let body = '';
  if(NB.added){
    const n = NB.lines.filter(l => !l.skipped && !l.blur).length, tot = NB.lines.filter(l => !l.skipped && !l.blur).reduce((a, l) => a + l.price * Number(l.q), 0);
    body = `<div class="nf22-nbdone"><span class="nf22-nbbig" aria-hidden="true">✓</span><h2>Done. ${n} lines are in Nifti.</h2><p>${bkPeso(tot)} of sales, marked "From paper", with your photo kept. You can undo this for 30 days.</p>
      <div class="nf22-nbbtns"><button type="button" class="btn btn-primary" data-nb="again">Read another page</button><button type="button" class="btn btn-outline" data-nb="close">I'm done</button></div></div>`;
  } else if(s === 0){
    body = `<h2>What kind of notebook is this?</h2><p class="nf22-nbsub">Any notebook works. Messy is OK.</p>
      <div class="nf22-nbkinds">${NF22_NB_KINDS.map(([k, t, d, ic]) => `<button type="button" data-nb="kind" data-v="${k}" class="${NB.kind === k ? 'on' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg><b>${t}</b><small>${d}</small></button>`).join('')}</div>`;
  } else if(s === 1){
    body = `<h2>Take a photo of one page</h2><p class="nf22-nbsub">Just one page for now. The photo stays with your business. Only you can see it.</p>
      <label class="nf22-nbcam"><input type="file" accept="image/*" capture="environment" data-nf-cam="1" data-nbphoto="1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg><b>Take the photo</b><small>or pick one from your phone</small></label>
      <ul class="nf22-nbtips"><li><b>Flat</b><span>Lay the notebook on a table.</span></li><li><b>Bright</b><span>Near a window or under a light.</span></li><li><b>Whole page</b><span>All four corners in the photo.</span></li></ul>
      <button type="button" class="nf22-link nf22-nbsample" data-nb="sample">No notebook with you? Try a sample page</button>`;
  } else if(s === 2){
    body = `<h2>Is each column right?</h2><p class="nf22-nbsub">Nifti guessed what each column is. If one is wrong, tap its name at the top and pick the right one.</p>
      ${NB.photo ? '<p class="nf22-nbproto">Prototype: Nifti reads a sample page in place of your photo for now.</p>' : ''}
      ${nf22NbPage()}
      ${NB.picking >= 0 ? `<div class="nf22-nbpick" role="group" aria-label="What is column ${NB.picking + 1}?"><b>Column ${NB.picking + 1} is:</b>${Object.entries(NF22_NB_COLS).map(([k, [t, c]]) => `<button type="button" class="${c} ${NB.cols[NB.picking] === k ? 'on' : ''}" data-nb="setcol" data-v="${k}">${t}</button>`).join('')}</div>` : ''}
      <div class="nf22-nbkey">${NB.cols.map(c => `<span class="${NF22_NB_COLS[c][1]}"><i></i>${NF22_NB_COLS[c][0]}</span>`).join('')}</div>`;
  } else if(s === 3){
    const qs = nf22NbQs(), q = qs[0], left = qs.length;
    let ask = '';
    if(q){ const l = NB.lines[q.i];
      if(q.k === 'blur') ask = `<div class="nf22-nbq"><p class="nf22-nbql">Line ${l.n}</p><h3>Nifti can't read this line.</h3><p>That's OK. Type it if you know it, or skip it. The photo of the page is kept either way.</p>
        <div class="nf22-nbrow nf22-nbshow blur">${[l.d, l.w, l.i, l.q, l.a].map((v, i) => `<span class="${NF22_NB_COLS[NB.cols[i]][1]}">${v}</span>`).join('')}</div>
        <div class="nf22-nbbtns"><button type="button" class="btn btn-outline" data-nb="skip" data-v="${q.i}">Skip this line</button></div></div>`;
      else { const raw = q.k === 'who' ? l.w : l.i, guess = q.k === 'who' ? l.who : l.item;
        ask = `<div class="nf22-nbq"><p class="nf22-nbql">Line ${l.n} · question ${NB.qi + 1}</p><h3>Is "<span class="nf22-hand">${nf22Esc(raw)}</span>" ${q.k === 'who' ? 'the customer' : 'the item'} <b>${nf22Esc(guess)}</b>?</h3>
          ${q.k === 'what' ? `<p class="nf22-nbmath">${l.q} × ${bkPeso(l.price)} = ${bkPeso(l.price * Number(l.q))} <em>✓ same as the ${l.a} written</em></p>` : `<p class="nf22-nbmath">${nf22Esc(guess)} is one of your customers.</p>`}
          <div class="nf22-nbbtns"><button type="button" class="btn btn-primary" data-nb="yes" data-v="${q.i}|${q.k}">Yes</button><button type="button" class="btn btn-outline" data-nb="no" data-v="${q.i}|${q.k}">No, it's something else</button></div>
          <p class="nf22-nbteach">Your answer teaches Nifti. Next time it reads "<b>${nf22Esc(raw)}</b>" by itself.</p></div>`; }
    }
    body = `<h2>${left ? 'A few quick questions' : 'All checked. Nice work.'}</h2><p class="nf22-nbsub">${left ? `${left} question${left > 1 ? 's' : ''} left. Green lines are already sure.` : 'Every line is sure, or skipped. Look it over, then tap Next.'}</p>
      ${ask}
      <ol class="nf22-nblines">${NB.lines.map(l => { const ok = nf22NbLineOk(l), sk = l.skipped;
        return `<li class="${sk ? 'sk' : ok ? 'ok' : 'chk'}"><span class="nf22-nbn">${l.n}</span>${l.blur ? `<div class="nf22-nbl"><b>${sk ? 'Skipped. The photo is kept.' : 'Can\'t read this line'}</b></div>` : `<div class="nf22-nbl"><b>${nf22Esc(l.who)}</b><small>${nf22Esc(l.d)} · ${nf22Esc(l.q)} × ${nf22Esc(l.item)}</small></div><span class="nf22-nba">${bkPeso(l.price * Number(l.q))}</span>`}<em>${sk ? 'Skipped' : ok ? '✓ Sure' : 'Please check'}</em></li>`; }).join('')}</ol>
      ${NB.learned.length ? `<div class="nf22-nbdict"><b>Words Nifti learned from you</b>${NB.learned.map(w => { const l = NB.lines.find(x => x.w === w || x.i === w); return `<span><i class="nf22-hand">${nf22Esc(w)}</i> → ${nf22Esc(l ? (l.w === w ? l.who : l.item) : w)}</span>`; }).join('')}</div>` : ''}`;
  } else if(s === 4){
    const keep = NB.lines.filter(l => !l.skipped && !l.blur), tot = keep.reduce((a, l) => a + l.price * Number(l.q), 0), cust = [...new Set(keep.filter(l => l.who !== 'Walk-in').map(l => l.who))];
    body = `<h2>Ready to add to your books</h2><p class="nf22-nbsub">Nothing has changed yet. Here is what will happen when you tap the green button.</p>
      <div class="nf22-nbsum"><div><b>${keep.length}</b><span>lines</span></div><div><b>${bkPeso(tot)}</b><span>in sales</span></div><div><b>${cust.length}</b><span>customers</span></div></div>
      <ul class="nf22-nbwhere"><li><b>Sales</b><span>go into Sales, marked "From paper".</span></li><li><b>Customers</b><span>you haven't added yet are added for you.</span></li><li><b>The photo</b><span>is kept with these lines, so you can always look back.</span></li></ul>
      <p class="nf22-calm">You can undo this for 30 days.</p>`;
  }
  const canNext = s === 0 ? !!NB.kind : s === 1 ? false : s === 3 ? !nf22NbQs().length : true;
  ov.innerHTML = `<div class="nf22-nbin"><header class="nf22-nbtop"><div><b>Read my notebook</b><small>Old records into Nifti, one page at a time</small></div><button type="button" class="nf22-nbx" data-nb="close">Save and close</button></header>
    ${NB.added ? '' : `<ol class="nf22-nbdots" aria-label="Step ${s + 1} of 5">${dots}</ol>`}
    <main class="nf22-nbmain">${body}</main>
    ${NB.added ? '' : `<footer class="nf22-nbfoot">${s > 0 ? '<button type="button" class="btn btn-outline" data-nb="back">← Back</button>' : '<span></span>'}
      ${s === 4 ? `<button type="button" class="btn btn-primary nf22-nbgo" data-nb="add">Add ${NB.lines.filter(l => !l.skipped && !l.blur).length} lines to Nifti</button>` : s === 1 ? '<span></span>' : `<button type="button" class="btn btn-primary nf22-nbgo" data-nb="next" ${canNext ? '' : 'disabled'}>${s === 2 ? 'Yes, the columns are right' : 'Next'}</button>`}</footer>`}</div>`;
  const m = ov.querySelector('.nf22-nbmain'); if(m) m.scrollTop = 0;
}
function nf22NbDo(a, v){
  if(a === 'close'){ nf22NbClose(); if(!NB.added && NB.step > 0) showToast('Saved. Open "Read my notebook" to carry on.', 'success'); return; }
  if(a === 'kind'){ NB.kind = v; nf22NbPaint(); return; }
  if(a === 'next'){ NB.step = Math.min(4, NB.step + 1); NB.picking = -1; nf22NbPaint(); return; }
  if(a === 'back'){ NB.step = Math.max(0, NB.step - 1); NB.picking = -1; nf22NbPaint(); return; }
  if(a === 'sample'){ NB.photo = ''; NB.step = 2; nf22NbPaint(); return; }
  if(a === 'pick'){ NB.picking = NB.picking === Number(v) ? -1 : Number(v); nf22NbPaint(); return; }
  if(a === 'setcol'){ if(NB.picking >= 0) NB.cols[NB.picking] = v; NB.picking = -1; nf22NbPaint(); return; }
  if(a === 'yes'){ const [i, k] = v.split('|'), l = NB.lines[Number(i)]; l['ok_' + k] = true; const raw = k === 'who' ? l.w : l.i; if(!NB.learned.includes(raw)) NB.learned.push(raw); NB.qi++; nf22NbPaint(); return; }
  if(a === 'no'){ const [i, k] = v.split('|'), l = NB.lines[Number(i)], list = k === 'who' ? (typeof buyersData !== 'undefined' ? buyersData.map(b => b.name) : []) : nf22Items().map(x => x.name);
    const pick = prompt(`Type the right ${k === 'who' ? 'customer' : 'item'} (for example: ${list.slice(0, 2).join(', ')})`, ''); if(pick && pick.trim()){ if(k === 'who') l.who = pick.trim(); else l.item = pick.trim(); l['ok_' + k] = true; NB.learned.push(k === 'who' ? l.w : l.i); NB.qi++; } nf22NbPaint(); return; }
  if(a === 'skip'){ NB.lines[Number(v)].skipped = true; NB.qi++; nf22NbPaint(); return; }
  if(a === 'add'){ NB.added = true; nf22NbPaint(); showToast('Added from paper (prototype).', 'success'); return; }
  if(a === 'again'){ nf22NbOpen(); return; }
}

/* ---------- where to find it ---------- */
(function(){
  const btn = (id, label) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'btn btn-outline nf22-nbbtn'; b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M16 2v20"/></svg>${label}`; b.onclick = () => nf22NbOpen(); return b; };
  const add = () => {
    const led = document.querySelector('#page-ledger .page-head'); if(led && !document.getElementById('nf22NbLed')) led.appendChild(btn('nf22NbLed', 'Read my old notebook'));
    const inv = document.querySelector('#page-inventory .page-head'); if(inv && !document.getElementById('nf22NbInv')){ const b = btn('nf22NbInv', 'Read a notebook'); const r = inv.querySelector('button, .btn'); inv.appendChild(b); }
    const team = document.querySelector('#page-team .page-head'); if(team && !document.getElementById('nf22NbTeam')) team.appendChild(btn('nf22NbTeam', 'Read a notebook someone left'));
    const um = document.getElementById('userMenuDropdown'); if(um && !um.querySelector('.nf22-um')){ const d = document.createElement('div'); d.className = 'notif-item nf22-um'; d.style.cursor = 'pointer'; d.innerHTML = '<div><div class="notif-text">Read my notebook</div></div>'; d.onclick = () => nf22NbOpen(); const w = um.querySelector('.nf21-um'); if(w) w.after(d); else um.insertBefore(d, um.firstChild); }
    const rep = document.querySelector('#nfHomeReport .nft-chart'); if(rep && !rep.querySelector('.nf22-paper') && !(typeof myBusiness !== 'undefined' && myBusiness)){ const n = document.createElement('p'); n.className = 'nf22-paper'; n.innerHTML = 'The months before August came from the shop\'s old notebook. <button type="button" class="nf22-link">See how →</button>'; n.querySelector('button').onclick = () => nf22NbOpen(); rep.appendChild(n); }
  };
  const nav = window.navigate;
  if(typeof nav === 'function' && !nav._nf22nb){ const w = function(){ const out = nav.apply(this, arguments); setTimeout(add, 60); return out; }; Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf22nb = true; window.navigate = w; try{ navigate = w; }catch(e){} }
  const start = () => { add(); const app = document.getElementById('view-app'); if(app && !app.dataset.nf22nb){ app.dataset.nf22nb = '1'; let t = 0; new MutationObserver(() => { clearTimeout(t); t = setTimeout(add, 200); }).observe(app, {childList: true, subtree: true}); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 500);
  document.addEventListener('keydown', e => { if(e.key === 'Escape'){ const ov = document.getElementById('nf22Nb'); if(ov && !ov.hidden) nf22NbClose(); } });
})();
