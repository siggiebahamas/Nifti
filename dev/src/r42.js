/* ===== Round 42 ===== */

/* ---------- 1. Add many items from Excel: a wide, calm popup with a picture of the template ---------- */
const NF42_TPL = 'templates/nifti-items-template.xlsx';
const NF42_IC = {
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  no: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8 12.5 3 3 5-6"/></svg>',
};
// a picture of the template, drawn like Excel: what's locked, what's required, where to type
function nf42Sheet(big){
  const rows = [['Portland Cement 40kg', '265.00', 'bag', '228.00', '120'], ['Deformed Bar 10mm', '185.00', 'piece', '160.00', '300'], ['GI Wire #16', '95.00', 'kg', '', '']];
  return `<div class="nf42-xl${big ? ' big' : ''}" role="img" aria-label="The Nifti Excel template: row 1 holds the locked column names, items go from row 2 down">
    <div class="nf42-xg">
      <span class="c h"></span>${['A', 'B', 'C', 'D', 'E'].map(l => `<span class="c h">${l}</span>`).join('')}
      <span class="c n">1</span>${[['Item name', 1], ['Selling price', 1], ['Unit', 0], ['Cost', 0], ['Stock on hand', 0]].map(([t, req]) => `<span class="c hd${req ? ' req' : ''}">${NF42_IC.lock}${t}</span>`).join('')}
      ${rows.map((r, i) => `<span class="c n">${i + 2}</span>${r.map((v, j) => `<span class="c${j === 0 || j === 2 ? '' : ' num'}${v === '' ? ' empty' : ''}">${escapeHtml(v)}</span>`).join('')}`).join('')}
      <span class="c n">5</span><span class="c type">Type here…</span><span class="c"></span><span class="c"></span><span class="c"></span><span class="c"></span>
    </div>
    <div class="nf42-xk"><span><i class="k1"></i>Row 1 is locked. Nifti reads these names.</span><span><i class="k2"></i>Required: Item name and Selling price</span><span><i class="k3"></i>Optional: leave empty if you don't know</span></div>
  </div>`;
}
nf41ImpPaint = function(){
  let body, wide = true;
  if(NF41I.step === 'pick'){
    body = `<p class="nf42-lead">Put all your items in Nifti at once. Nothing is saved until you check the list and tap Add.</p>
      <ol class="nf42-steps">
        <li class="nf42-step"><span class="nf42-n">1</span><div class="nf42-sb"><b>Download the template</b><span>An Excel file with the right columns, ready to fill in.</span></div>
          <a class="btn btn-primary nf42-dl" href="${NF42_TPL}" download="Nifti items template.xlsx">${NF42_IC.dl}Download template</a></li>
        <li class="nf42-step col"><span class="nf42-n">2</span><div class="nf42-sb"><b>Type one item per row</b><span>Prices are numbers only, like 265. Don't change row 1.</span></div>${nf42Sheet(false)}</li>
        <li class="nf42-step col"><span class="nf42-n">3</span><div class="nf42-sb"><b>Upload it here</b><span>You'll see what's new, what changes and what's skipped before anything is saved.</span></div>
          <label class="nf42-drop${NF41I.busy ? ' busy' : ''}"><input type="file" accept=".xlsx,.xls,.csv,text/csv" hidden onchange="nf41ImpFile(this)">${NF42_IC.up}<b>${NF41I.busy ? 'Reading your file…' : 'Choose your Excel file'}</b><small>.xlsx, .xls or .csv · or drop it here</small></label>
          ${NF41I.err ? `<p class="nf42-err">${escapeHtml(NF41I.err)}</p>` : ''}</li>
      </ol>
      <button type="button" class="nf42-how" onclick="NF41I.step='guide'; nf41ImpPaint()">See how it's done, with an example ›</button>`;
  } else if(NF41I.step === 'guide'){
    body = `<button type="button" class="nf42-back" onclick="NF41I.step='pick'; nf41ImpPaint()">‹ Back</button>
      <h3 class="nf42-h">How the template works</h3>${nf42Sheet(true)}
      <div class="nf42-dd"><div class="nf42-do"><h4>${NF42_IC.ok}Do</h4><ul><li>One item per row, from row 2 down</li><li>Prices as numbers: <b>265</b> or <b>265.50</b></li><li>Leave a box empty if you don't know it</li><li>Paste from another file as values only</li></ul></div>
        <div class="nf42-dont"><h4>${NF42_IC.no}Don't</h4><ul><li>Rename the top row (it's locked anyway)</li><li>Type ₱, "pesos" or commas in prices</li><li>Add totals or notes at the bottom</li><li>Merge cells</li></ul></div></div>
      <div class="nf42-qa"><b>What if the top row is changed?</b><p>It can't be changed by accident: Excel keeps it locked. If you upload your own file instead, Nifti still finds the columns from names like "Product", "SRP" or "Presyo". Your Nifti screens never change because of a file.</p>
        <b>What happens after I upload?</b><p>Nifti lists every row as <em class="nw">New item</em>, <em class="up">Price update</em> or <em class="sk">Skipped</em> with the reason. Nothing is saved until you tap Add.</p></div>
      <div class="nf42-foot"><a class="btn btn-outline" href="${NF42_TPL}" download="Nifti items template.xlsx">${NF42_IC.dl}Download template</a><button type="button" class="btn btn-primary" onclick="NF41I.step='pick'; nf41ImpPaint()">I'm ready to upload</button></div>`;
  } else if(NF41I.step === 'check'){
    const add = NF41I.rows.filter(r => !r.skip && !r.ex), upd = NF41I.rows.filter(r => !r.skip && r.ex && r.change), same = NF41I.rows.filter(r => !r.skip && r.ex && !r.change), skip = NF41I.rows.filter(r => r.skip);
    const peso = n => { const v = Number(n || 0); return '₱' + v.toLocaleString('en-US', {minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2}); };
    const pill = r => r.skip ? `<span class="nf41-ip sk">Skipped: ${escapeHtml(r.skip.toLowerCase())}</span>` : !r.ex ? '<span class="nf41-ip nw">New item</span>' : r.change ? `<span class="nf41-ip up">${Number(r.ex.sellPrice) !== r.price ? `Price ${peso(r.ex.sellPrice)} → ${peso(r.price)}` : 'Update'}</span>` : '<span class="nf41-ip same">No change</span>';
    body = `<div class="nf42-file">${NF42_IC.up}<b class="nf26-raw">${escapeHtml(NF41I.file)}</b><button type="button" onclick="NF41I.step='pick'; nf41ImpPaint()">Choose another file</button></div>
      <div class="nf42-sum"><span class="nw"><b>${add.length}</b>new</span><span class="up"><b>${upd.length}</b>price updates</span><span><b>${same.length}</b>no change</span>${skip.length ? `<span class="sk"><b>${skip.length}</b>skipped</span>` : ''}</div>
      <div class="nf42-tw"><table class="nf42-t"><colgroup><col class="c1"><col class="c2"><col class="c3"><col class="c4"><col class="c5"></colgroup>
        <thead><tr><th>Item</th><th class="r">Price</th><th>Unit</th><th class="r">Stock</th><th>What happens</th></tr></thead>
        <tbody>${NF41I.rows.slice(0, 300).map(r => `<tr class="${r.skip ? 'sk' : ''}"><td class="nf26-raw">${escapeHtml(r.name || '(no name)')}</td><td class="r">${isFinite(r.price) ? peso(r.price) : '—'}</td><td>${escapeHtml(r.unit || '')}</td><td class="r">${isFinite(r.stock) ? r.stock.toLocaleString('en-US') : ''}</td><td>${pill(r)}</td></tr>`).join('')}</tbody></table></div>
      ${NF41I.rows.length > 300 ? `<p class="nf42-lead">Showing the first 300 of ${NF41I.rows.length} rows. All of them are included.</p>` : ''}
      <div class="nf42-foot"><button type="button" class="btn btn-outline" onclick="slClose('nf41Imp')">Cancel</button>
        <button type="button" class="btn btn-primary" ${add.length + upd.length ? '' : 'disabled'} onclick="nf41ImpApply()">${NF41I.busy ? 'Saving…' : `Add ${add.length} item${add.length === 1 ? '' : 's'}${upd.length ? ` and update ${upd.length}` : ''}`}</button></div>`;
  } else {
    wide = false;
    body = `<div class="nf42-done">${NF42_IC.done}<b>${NF41I.added} item${NF41I.added === 1 ? '' : 's'} added${NF41I.updated ? `, ${NF41I.updated} updated` : ''}</b><span>They're in Stock and Prices now, ready for orders.</span>
      <div class="nf42-foot c"><button type="button" class="btn btn-outline" onclick="slClose('nf41Imp'); go('profit')">See my prices</button><button type="button" class="btn btn-primary" onclick="slClose('nf41Imp'); go('inventory')">See my stock</button></div></div>`;
  }
  let box = document.getElementById('nf41Imp');
  if(!box || !box.querySelector('.nf41-ibody')) box = slModal('nf41Imp', `<div class="sl-sheet-h"><b>Add many items from Excel</b><button class="sl-x" onclick="slClose('nf41Imp')" aria-label="Close">✕</button></div><div class="nf41-ibody nf42-ib"></div>`);
  box.querySelector('.nf41-ibody').innerHTML = body;
  const sheet = box.querySelector('.sl-sheet'); if(sheet){ sheet.classList.add('nf42-sheet'); sheet.classList.toggle('nf42-wide', wide); sheet.scrollTop = 0; }
  const drop = box.querySelector('.nf42-drop');
  if(drop){
    drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if(f) nf41ImpFile({files: [f], value: ''}); };
  }
};
window.nf41ImpPaint = nf41ImpPaint;
nf41ImpTemplate = function(){ const a = document.createElement('a'); a.href = NF42_TPL; a.download = 'Nifti items template.xlsx'; document.body.appendChild(a); a.click(); a.remove(); };
window.nf41ImpTemplate = nf41ImpTemplate;
// read the "Items" sheet of the template (never the Example), and accept "Item name *" style headers
nf41ImpFile = async function(input){
  const f = input.files && input.files[0]; if(!f) return;
  NF41I.busy = true; NF41I.err = ''; nf41ImpPaint();
  try{
    let matrix;
    if(/\.(csv|txt)$/i.test(f.name)){ const t = await f.text(); matrix = typeof colParseCsv === 'function' ? colParseCsv(t) : t.split(/\r?\n/).map(l => l.split(',')); }
    else { await cpoLoadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); const wb = XLSX.read(await f.arrayBuffer(), {type: 'array'});
      const name = wb.SheetNames.find(n => /^items$/i.test(n)) || wb.SheetNames.find(n => !/example|how to|instructions|guide/i.test(n)) || wb.SheetNames[0];
      matrix = XLSX.utils.sheet_to_json(wb.Sheets[name], {header: 1, raw: false, defval: ''}); }
    matrix = (matrix || []).map((r, i) => i < 5 ? r.map(c => String(c == null ? '' : c).replace(/\s*\*+\s*$/, '').replace(/\s*\((required|optional)\)\s*$/i, '')) : r);
    const rows = nf41ImpParse(matrix);
    if(!rows.filter(r => !r.skip).length) throw new Error("No items with a name and a price were found. Use the template, or check your file has a column for the item name and one for the selling price.");
    Object.assign(NF41I, {rows, file: f.name, step: 'check'});
  }catch(e){ NF41I.err = e.message || "Couldn't read that file."; }
  NF41I.busy = false; try{ input.value = ''; }catch(e){} nf41ImpPaint();
};
window.nf41ImpFile = nf41ImpFile;

/* ---------- 2. What your team did: grouped by day, with filters and a word for each kind ---------- */
const NF42A = {who: 'all', kind: 'all'};
const NF42K = {
  cash: ['Cash', '#15803D', '#E3F5EA', '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'],
  order: ['Orders', '#1E40AF', '#EAF1FF', '<path d="M1 6h13v10H1z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="5.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/>'],
  expense: ['Expenses', '#B42318', '#FDECEC', '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-4v4M17 13.5h.01"/>'],
  stock: ['Stock', '#854D0E', '#FFF5C2', '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'],
  task: ['Jobs', '#344054', '#EEF0F3', '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>'],
  handoff: ['Notes', '#0E7490', '#E0F4F8', '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'],
  price: ['Prices', '#854D0E', '#FFF5C2', '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>'],
  other: ['Other', '#344054', '#EEF0F3', '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'],
};
function nf42Kind(a){ const k = String(a.kind || '').toLowerCase(); if(NF42K[k]) return k; const t = String(a.text || '').toLowerCase();
  return /cash|drawer|collected|deposit/.test(t) ? 'cash' : /order|po-|received|delivered|sent/.test(t) ? 'order' : /expense|bill|paid for/.test(t) ? 'expense' : /stock|count|bad bag|damaged/.test(t) ? 'stock' : /price/.test(t) ? 'price' : /"|job|task|finished|started|added/.test(t) ? 'task' : 'other'; }
function nf42Mins(t){ const m = String(t || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i); return m ? (Number(m[1]) % 12) * 60 + Number(m[2]) + (/pm/i.test(m[3]) ? 720 : 0) : -1; }
function nf42DayLabel(d){
  if(!d) return 'Earlier'; if(d === APP_TODAY) return 'Today';
  try{ if(d === addDaysIso(APP_TODAY, -1)) return 'Yesterday'; }catch(e){}
  try{ return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'}); }catch(e){ return d; }
}
function nf42ActItems(){
  let items = (teamActivityLog || []).filter(a => typeof teamScoped !== 'function' || teamScoped(a)).map(a => ({actor: a.actor, text: (a.kind === 'handoff' ? 'pinned a note: ' : '') + a.action, date: String(a.date || '').slice(0, 10), time: a.time, kind: a.kind}));
  if(myBusiness){
    const out = [];
    teamTasks.forEach(t => {
      if(t.deletedAt) return;
      out.push({actor: t.createdBy || 'Someone', text: `added the job "${t.title}"${t.assignedTo && t.assignedTo !== t.createdById ? ' for ' + teamMemberName(t.assignedTo) : ''}`, date: String(t.createdAt || '').slice(0, 10), time: '', kind: 'task'});
      if(t.status === 'done' && t.completedAt) out.push({actor: t.completedBy || 'Someone', text: `finished the job "${t.title}"`, date: String(t.completedAt).slice(0, 10), time: '', kind: 'task'});
    });
    (typeof teamHandoffs !== 'undefined' ? teamHandoffs : []).forEach(h => out.push({actor: h.author, text: 'pinned a note: ' + h.text, date: String(h.date || '').slice(0, 10), time: '', kind: 'handoff'}));
    items = out;
  }
  items.forEach(a => {
    a.text = typeof nf26Plain === 'function' ? nf26Plain(String(a.text || '')) : String(a.text || '');
    // "Yesterday" written in the time box means the day before
    if(/^yesterday$/i.test(String(a.time || '').trim())){ try{ a.date = addDaysIso(APP_TODAY, -1); }catch(e){} a.time = ''; }
    a.k = nf42Kind(a);
  });
  return items.sort((a, b) => String(b.date).localeCompare(String(a.date)) || nf42Mins(b.time) - nf42Mins(a.time));
}
function nf42ActSet(k, v){ NF42A[k] = v; renderTeamActivityFeed(); }
renderTeamActivityFeed = function(){
  const el = document.getElementById('teamActivityFeed'); if(!el) return;
  const all = nf42ActItems();
  const people = [...new Set(all.map(a => a.actor))].sort((a, b) => a.localeCompare(b));
  const kinds = Object.keys(NF42K).filter(k => all.some(a => a.k === k));
  if(NF42A.who !== 'all' && !people.includes(NF42A.who)) NF42A.who = 'all';
  if(NF42A.kind !== 'all' && !kinds.includes(NF42A.kind)) NF42A.kind = 'all';
  const list = all.filter(a => (NF42A.who === 'all' || a.actor === NF42A.who) && (NF42A.kind === 'all' || a.k === NF42A.kind)).slice(0, 80);
  const ico = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NF42K[k][3]}</svg>`;
  const chip = (k, v, label, n) => `<button type="button" class="nf41-chip${NF42A[k] === v ? ' on' : ''}" aria-pressed="${NF42A[k] === v}" onclick="nf42ActSet('${k}', '${String(v).replace(/'/g, "\\'")}')">${label}${n != null ? ` <b>${n}</b>` : ''}</button>`;
  const first = n => String(n || '').replace(/\s*\(you\)\s*/i, '').split(' ')[0];
  const groups = []; list.forEach(a => { const d = a.date || ''; let g = groups[groups.length - 1]; if(!g || g.d !== d){ g = {d, items: []}; groups.push(g); } g.items.push(a); });
  el.innerHTML = `<div class="nf42-af">
      <div class="nf42-fr"><span class="nf42-fl">Who</span>${chip('who', 'all', 'Everyone', all.length)}${people.map(p => chip('who', p, escapeHtml(first(p)), all.filter(a => a.actor === p).length)).join('')}</div>
      <div class="nf42-fr"><span class="nf42-fl">Kind</span>${chip('kind', 'all', 'All kinds')}${kinds.map(k => chip('kind', k, `<i class="nf42-kd" style="background:${NF42K[k][1]}"></i>${NF42K[k][0]}`, all.filter(a => a.k === k).length)).join('')}</div>
    </div>
    ${list.length ? `<div class="nf42-at" role="table" aria-label="What your team did">
      <div class="nf42-ah" role="row"><span role="columnheader">What was done</span><span role="columnheader">Who</span><span role="columnheader">Kind</span><span role="columnheader">Time</span></div>
      ${groups.map(g => `<div class="nf42-day" role="row"><span role="cell">${escapeHtml(nf42DayLabel(g.d))}</span></div>${g.items.map(a => `<div class="nf42-ar" role="row">
        <span class="nf42-aw" role="cell"><span class="nf42-ki" style="background:${NF42K[a.k][2]};color:${NF42K[a.k][1]}">${ico(a.k)}</span><span class="nf26-raw">${escapeHtml(a.text.charAt(0).toUpperCase() + a.text.slice(1))}</span></span>
        <span class="nf42-who" role="cell"><span class="nf42-av" style="background:${typeof nfIniColor === 'function' ? nfIniColor(a.actor) : '#475467'}">${escapeHtml(typeof teamInitials === 'function' ? teamInitials(a.actor) : first(a.actor).slice(0, 2))}</span><span class="nf26-raw">${escapeHtml(a.actor)}</span></span>
        <span role="cell"><span class="nf42-kt" style="background:${NF42K[a.k][2]};color:${NF42K[a.k][1]}">${ico(a.k)}${NF42K[a.k][0]}</span></span>
        <span class="nf42-tm" role="cell">${escapeHtml(nf42Mins(a.time) >= 0 ? a.time : '')}</span></div>`).join('')}`).join('')}</div>`
      : `<div class="nf41-none">${all.length ? 'Nothing matches these filters.' : 'Nothing yet. What your team does shows up here.'}</div>`}`;
};
window.renderTeamActivityFeed = renderTeamActivityFeed;

/* ---------- 3. What runs out: "days left" said once, and stock on hand gets its own column ---------- */
(function(){
  if(typeof srSection !== 'function') return;
  const base = srSection;
  srSection = function(){
    let h = base.apply(this, arguments);
    if(!/sr-axis16/.test(h)) return h; // only in "Days left" view
    let rows = []; try{ rows = srRows(); }catch(e){}
    const byCode = {}; rows.forEach(r => { byCode[r.code] = r; });
    h = h.replace(/<span class="sr-axl">[\s\S]*?<\/em><\/span>/, '<span class="sr-axl"></span>')
         .replace(/<span class="sr-axr">[\s\S]*?<\/em><\/span>/, '<span class="sr-axoh"></span><span class="sr-axr"></span>')
         .replace(/(<span class="sr-ax" aria-hidden="true">[\s\S]*?)(<\/span>)(<span class="sr-axoh">)/, '$1<span class="sr-axcap">Days of stock left</span>$2$3')
         .replace(/<div class="sr-axis sr-axis16">/, '<div class="sr-axis sr-axis16 nf42-ax">');
    // each row: take "N on hand" out of the small line and give it a column
    h = h.replace(/<button type="button" class="sr-row is-(\w+)" aria-expanded="(true|false)" onclick="srToggle\('([^']+)'\)">([\s\S]*?)<span class="sr-v">/g, (m, cls, exp, code, inner) => {
      const r = byCode[code]; if(!r) return m;
      const inner2 = inner.replace(/<em>(?:(?!<\/em>)[\s\S])*?on hand<\/em><i>·<\/i>/, '');
      const oh = `<span class="sr-oh"><b>${Number(r.on || 0).toLocaleString('en-US')}</b><small>${r.unit ? escapeHtml(r.unit) + ' ' : ''}on hand</small></span>`;
      return `<button type="button" class="sr-row nf42-sr is-${cls}" aria-expanded="${exp}" onclick="srToggle('${code}')">${inner2}${oh}<span class="sr-v">`;
    });
    h = h.replace(/<b>([\d.]+) days?<\/b><small>runs out/g, (m, d) => `<b>${d} day${d === '1' ? '' : 's'} left</b><small>runs out`);
    return h;
  };
  window.srSection = srSection;
})();

/* ---------- 4. Check every line from a photo: the page beside the lines, every box editable, a person ticks each line ---------- */
const NF42C = {only: false, zoom: false, agree: false};
function nf42LineDone(l){ return !!(l.skipped || l.checked); }
function nf42LineTone(l){ if(l.skipped) return 'sk'; if(l.checked) return 'ok'; if(l.blur && !l.typed) return 'bad'; if(l.sure && !l.edited) return 'sure'; return 'chk'; }
function nf42Amt(l){ const v = Number(l.price) * Number(l.q); return isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : 0; }
function nf42WrittenAmt(l){ const n = Number(String(l.a || '').replace(/[^\d.]/g, '')); return isFinite(n) && n > 0 && !/\?/.test(String(l.a)) ? n : 0; }
function nf42Row(l, i){
  // One line from the page: what was written on top, every field below it ready to type over. Long names get a wide box.
  const tone = nf42LineTone(l), unsureWho = !l.sure && (l.ask || []).includes('who'), unsureWhat = !l.sure && (l.ask || []).includes('what');
  const amt = nf42Amt(l), wr = nf42WrittenAmt(l), diff = amt && wr && Math.abs(amt - wr) >= 1;
  const val = v => escapeHtml(v == null ? '' : String(v)), blank = l.blur && !l.typed, dis = l.skipped ? 'disabled' : '';
  const whoL = NB.kind === 'bills' ? 'Supplier' : NB.kind === 'exp' ? 'Paid to' : 'Customer';
  return `<div class="nf42-cr t-${tone}" data-i="${i}">
    <div class="nf42-ctop2">
      <label class="nf42-ck" title="This line is right"><input type="checkbox" ${l.checked ? 'checked' : ''} ${dis} onchange="nf42CSet(${i}, 'checked', this.checked)" aria-label="Line ${l.n} is right"><span></span></label>
      <span class="nf42-cn">${l.n}</span>
      <div class="nf42-cw">${l.blur ? `<b class="nf42-blurt">Nifti couldn't read this line</b><small>Look at the photo and type what it says, or skip it.</small>` : `<span class="nf42-hand" title="${val([l.d, l.w, l.i, l.q, l.a].filter(Boolean).join(' · '))}">${val([l.w, l.i].filter(Boolean).join(' · '))}</span><small>written: ${val(l.q)} · ${val(l.a)}</small>`}</div>
      ${l.blur ? `<button type="button" class="nf42-sk nf42-see" onclick="nf42Zoom(document.querySelector('#nf22Nb .nf42-zoom'))">See the photo</button>` : ''}
      <button type="button" class="nf42-sk" onclick="nf42CSet(${i}, 'skipped', ${!l.skipped})">${l.skipped ? 'Undo skip' : 'Skip line'}</button>
    </div>
    <div class="nf42-cfs">
      <label class="nf42-cf wide${unsureWho ? ' q' : ''}"><span>${whoL}</span><input list="nf42Who" value="${val(blank ? '' : l.who)}" placeholder="Type a name" title="${val(l.who)}" oninput="nf42CSet(${i}, 'who', this.value)" ${dis}></label>
      <label class="nf42-cf wide${unsureWhat ? ' q' : ''}"><span>Item</span><input list="nf42Items" value="${val(blank ? '' : l.item)}" placeholder="Type an item" title="${val(l.item)}" oninput="nf42CSet(${i}, 'item', this.value)" ${dis}></label>
      <label class="nf42-cf"><span>Date</span><input value="${val(blank ? '' : (l.date || l.d || ''))}" placeholder="e.g. 8/3" oninput="nf42CSet(${i}, 'date', this.value)" ${dis}></label>
      <label class="nf42-cf num"><span>Qty</span><input inputmode="decimal" value="${val(blank ? '' : l.q)}" oninput="nf42CSet(${i}, 'q', this.value)" ${dis}></label>
      <label class="nf42-cf num"><span>Price each ₱</span><input inputmode="decimal" value="${val(blank ? '' : l.price)}" oninput="nf42CSet(${i}, 'price', this.value)" ${dis}></label>
      <div class="nf42-ca"><span>Amount</span><b data-amt>${amt ? bkPeso(amt) : '—'}</b><small data-diff class="${diff ? 'bad' : wr && amt ? 'ok' : ''}">${diff ? `Written ${bkPeso(wr)}` : wr && amt ? '✓ same as written' : ''}</small></div>
    </div>
  </div>`;
}
function nf42CheckHtml(){
  const lines = NB.lines, done = lines.filter(nf42LineDone).length, sure = lines.filter(l => !nf42LineDone(l) && l.sure && !l.edited && !l.blur).length;
  const toCheck = lines.filter(l => !nf42LineDone(l)).length;
  const shown = lines.map((l, i) => [l, i]).filter(([l]) => !NF42C.only || !nf42LineDone(l));
  const who = [...new Set([].concat((typeof buyersData !== 'undefined' ? buyersData : []).map(b => b.name), (typeof suppliersData !== 'undefined' ? suppliersData : []).map(s => s.name)).filter(Boolean))];
  const items = [...new Set((typeof inventoryData !== 'undefined' ? inventoryData : []).map(x => x.name).filter(Boolean))];
  return `<div class="nf42-chk">
    <div class="nf42-ctop"><div><h2>Check and fix</h2><p>This is what Nifti read from your page. If something is wrong, just type over it. Tick each line when it's right. Nothing is saved until every line is ticked or skipped.</p><p class="nf42-disc"><b>Please double-check.</b> Nifti reads handwriting with AI, and AI can misread names, items or numbers. You decide what goes into your books, so check each line against your notebook.</p></div>
      <div class="nf42-cprog"><b>${done} of ${lines.length}</b><span>lines checked</span><i><em style="width:${lines.length ? Math.round(done / lines.length * 100) : 0}%"></em></i></div></div>
    <div class="nf42-cbar">
      <span class="nf42-lg"><i class="sure"></i>Nifti is sure</span><span class="nf42-lg"><i class="chk"></i>Please look</span><span class="nf42-lg"><i class="bad"></i>Can't read</span><span class="nf42-lg"><i class="ok"></i>You checked</span>
      <span class="nf42-sp"></span>
      <label class="nf42-only"><input type="checkbox" ${NF42C.only ? 'checked' : ''} onchange="NF42C.only=this.checked; nf22NbPaint()">Show only lines left (${toCheck})</label>
      ${sure ? `<button type="button" class="btn btn-outline" onclick="nf42TickSure()">Tick the ${sure} line${sure === 1 ? '' : 's'} Nifti is sure about</button>` : ''}
    </div>
    <div class="nf42-cgrid">
      <aside class="nf42-cph"><div class="nf42-cphh"><b>${NB.photo ? 'Your photo' : 'Sample page'}</b><button type="button" class="nf42-zoom" onclick="nf42Zoom(this)">See the whole page</button></div><div class="nf42-pv">${NB.photo ? `<img src="${NB.photo}" alt="Your photo of the page">` : (typeof nf22NbPage === 'function' ? nf22NbPage('nf42-sample') : '')}</div></aside>
      <div class="nf42-crows">${shown.map(([l, i]) => nf42Row(l, i)).join('') || '<p class="nf42-alldone">Every line is checked. Tap Next.</p>'}</div>
    </div>
    <datalist id="nf42Who">${who.map(n => `<option value="${escapeHtml(n)}">`).join('')}</datalist><datalist id="nf42Items">${items.map(n => `<option value="${escapeHtml(n)}">`).join('')}</datalist>
  </div>`;
}
function nf42CFoot(){
  const ov = document.getElementById('nf22Nb'); if(!ov) return;
  const go = ov.querySelector('.nf22-nbgo'); const left = NB.lines.filter(l => !nf42LineDone(l)).length;
  if(go){ go.disabled = left > 0; go.textContent = left ? `Tick ${left} more line${left === 1 ? '' : 's'}` : 'Next: add to my books'; }
  const prog = ov.querySelector('.nf42-cprog'); if(prog){ const done = NB.lines.length - left; prog.querySelector('b').textContent = `${done} of ${NB.lines.length}`; prog.querySelector('em').style.width = (NB.lines.length ? Math.round(done / NB.lines.length * 100) : 0) + '%'; }
}
function nf42CSet(i, f, v){
  const l = NB.lines[i]; if(!l) return;
  if(f === 'checked'){ l.checked = !!v; if(v && l.blur && l.typed) l.blur = false; }
  else if(f === 'skipped'){ l.skipped = !!v; if(v) l.checked = false; }
  else { l[f] = (f === 'q' || f === 'price') ? String(v).replace(/[^\d.]/g, '') : v; l.edited = true; if(f === 'who') l.whoKnown = false; if(f === 'item') l.itemKnown = false; if(l.blur && l.who && l.item && Number(l.q) > 0 && Number(l.price) > 0){ l.typed = true; } }
  const row = document.querySelector(`#nf22Nb .nf42-cr[data-i="${i}"]`);
  if(f === 'skipped' || (f === 'checked' && NF42C.only)) { nf22NbPaint(); return; }
  if(row){
    row.className = 'nf42-cr t-' + nf42LineTone(l);
    const amt = nf42Amt(l), wr = nf42WrittenAmt(l), diff = amt && wr && Math.abs(amt - wr) >= 1, a = row.querySelector('[data-amt]'), d = row.querySelector('[data-diff]');
    if(a) a.textContent = amt ? bkPeso(amt) : '—';
    if(d){ d.className = diff ? 'bad' : wr && amt ? 'ok' : ''; d.textContent = diff ? `Written ${bkPeso(wr)}` : wr && amt ? '✓ same as written' : ''; }
    if(f !== 'checked' && l.checked){ const c = row.querySelector('.nf42-ck input'); if(c) c.checked = true; }
  }
  nf42CFoot();
}
function nf42Zoom(btn){ const a = btn.closest('.nf42-cph'); NF42C.zoom = !a.classList.contains('zoom'); a.classList.toggle('zoom', NF42C.zoom); btn.textContent = NF42C.zoom ? 'Close' : 'See the whole page'; }
function nf42TickSure(){ NB.lines.forEach(l => { if(!l.skipped && l.sure && !l.edited && !l.blur) l.checked = true; }); nf22NbPaint(); }
(function(){
  if(typeof nf22NbPaint !== 'function') return;
  const pt = nf22NbPaint;
  nf22NbPaint = function(){
    const out = pt.apply(this, arguments);
    try{
      const ov = document.getElementById('nf22Nb'), main = ov && ov.querySelector('.nf22-nbmain');
      if(main && NB.step === 3 && !NB.added && NB.lines.length && !(typeof NB25 !== 'undefined' && (NB25.reading || NB25.err))){
        NB.lines.forEach(l => { if(l.price == null || l.price === '') l.price = ''; });
        main.innerHTML = nf42CheckHtml(); ov.classList.add('nf42-wide-ov'); nf42CFoot();
      } else if(ov) ov.classList.remove('nf42-wide-ov');
      // before anything is added, the person confirms they checked it (the books are theirs, not Nifti's)
      if(main && NB.step === 4 && !NB.added && !main.querySelector('.nf42-agree')){
        const d = document.createElement('label'); d.className = 'nf42-agree';
        d.innerHTML = `<input type="checkbox" ${NF42C.agree ? 'checked' : ''}><span><b>I checked these lines and they match my notebook.</b> I understand Nifti's reading can be wrong, and I'm the one who confirms what is saved.</span>`;
        main.prepend(d);
        const go = ov.querySelector('.nf22-nbgo'); const sync = () => { if(go) go.disabled = !NF42C.agree; };
        d.querySelector('input').addEventListener('change', e => { NF42C.agree = e.target.checked; sync(); }); sync();
      }
    }catch(e){ console.warn('nf42 check', e); }
    return out;
  };
  window.nf22NbPaint = nf22NbPaint;
})();
