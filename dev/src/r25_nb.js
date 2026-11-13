/* ===== Round 25: the notebook reader reads real photos (signed-in businesses) ===== */
// Pages are saved to the business (nb_pages), so anyone on the team can check them from any phone.
// Reading goes through the nb-read service with the person's own sign-in; it counts against the
// business's monthly page allowance (Free 10, Pro 300, Business 1,500). Every line still waits for a
// person to say yes, then goes to the right place: Sales, Getting paid, Expenses or Stock. Words the
// person confirms ("Bayvw" = Bayview Construction Co.) are saved, so the next page reads them by itself.
// The demo shop keeps the sample page, labeled as a sample.
const NB25 = {server: null, reading: false, err: '', usage: null, saving: false, summary: '', total: 0, real: false};
const NB25_DEST = {
  sales: ['Sales', 'sales', 'Each line becomes a sale in Sales, dated as written, marked "From paper".'],
  unsure: ['Sales', 'sales', 'Each line becomes a sale in Sales, dated as written, marked "From paper".'],
  utang: ['Getting paid', 'collections', 'Each customer\'s total goes into Getting paid as money they already owed you.'],
  bills: ['Expenses', 'expenses', 'Each bill goes into Expenses as unpaid ("on credit"), so you can see what you owe.'],
  exp: ['Expenses', 'expenses', 'Each line becomes an expense, dated as written, marked "From paper".'],
  stock: ['Stock', 'inventory', 'Each item you already have gets the count from the page. Nifti keeps the old number in the stock history.']};
function nb25Real(){ return typeof nf25Real === 'function' ? nf25Real() : false; }
async function nb25Load(){
  if(!nb25Real()) return;
  const { data } = await sb.from('nb_pages').select('id, kind, status, created_at, created_by_name, photo').eq('business_id', myBusiness.id).eq('status', 'waiting').order('created_at').limit(60);
  NB25.server = (data || []).map(r => ({id: r.id, kind: r.kind, at: Date.parse(r.created_at), by: r.created_by_name || 'someone', photo: r.photo, status: 'waiting'}));
  try{ nf24Badge(); }catch(e){}
}
async function nb25Usage(){
  if(!nb25Real()) return;
  const { data } = await sb.rpc('nb_usage'); NB25.usage = data || null;
}
async function nb25SavePages(){
  const pages = NB24.pages.slice(); if(!pages.length) return [];
  const rows = pages.map(p => ({business_id: myBusiness.id, kind: NB.kind || 'unsure', photo: p.photo}));
  const { data, error } = await sb.from('nb_pages').insert(rows).select('id');
  if(error){ showToast("Couldn't save the pages: " + error.message, 'error'); return null; }
  NB24.pages = []; await nb25Load();
  return (data || []).map(r => r.id);
}
function nb25Open(id){
  const x = (NB25.server || []).find(y => y.id === id); if(!x) return;
  NB24.curId = id; NB24.saved = 0;
  Object.assign(NB, {kind: x.kind, photo: x.photo, step: 2, added: false, qi: 0, picking: -1, lines: [], learned: [], cols: ['date', 'who', 'what', 'qty', 'amt']});
  NB25.reading = true; NB25.err = ''; NB25.summary = ''; NB25.real = true;
  nf22NbPaint(); nb25Read(x);
}
async function nb25Read(x){
  try{
    const { data, error } = await sb.functions.invoke('nb-read', {body: {image: x.photo, kind: x.kind, page_id: x.id}});
    if(error || !data || !data.ok) throw new Error(await nf25FnError(error, data));
    NB25.usage = Object.assign({}, NB25.usage || {}, {used: data.used, limit: data.limit});
    nb25Apply(data.result || {});
  }catch(e){ NB25.err = e.message || String(e); }
  NB25.reading = false; nf22NbPaint();
}
function nb25Apply(r){
  const cols = (r.columns || []).filter(c => NF22_NB_COLS[c]);
  NB.cols = cols.length === 5 ? cols : ['date', 'who', 'what', 'qty', 'amt'];
  if(r.page_kind && (NB.kind === 'unsure' || !NB.kind)) NB.kind = r.page_kind;
  NB25.summary = r.summary || ''; NB25.total = Number(r.written_total) || 0;
  NB.lines = (r.lines || []).map((l, i) => {
    const amt = Number(l.amount) || 0; let q = Number(l.qty) || 0, price = Number(l.unit_price) || 0;
    if(!q && amt){ q = 1; price = amt; } else if(q && !price && amt) price = Math.round(amt / q * 100) / 100;
    const walk = /^walk.?in$/i.test(String(l.who || ''));
    const ask = [];
    if(l.readable && !l.sure){ if(l.who && !l.who_known && !walk) ask.push('who'); if(l.item && !l.item_known) ask.push('what'); if(!ask.length) ask.push('what'); }
    return {n: i + 1, d: l.date_raw || '', w: l.who_raw || l.who || '', i: l.item_raw || l.item || '', q: String(q || ''), a: l.amount_raw || (amt ? amt.toLocaleString('en-PH') : ''),
      who: l.who || l.who_raw || 'Walk-in', item: l.item || l.item_raw || '', price, amt: amt || price * q, date: l.date || '', paid: l.paid || 'unknown',
      whoKnown: !!l.who_known || walk, itemKnown: !!l.item_known, sure: !!(l.sure && l.readable), blur: !l.readable, ask: l.sure ? [] : ask, note: l.note || '', ok: !!(l.sure && l.readable), skipped: false};
  });
}
function nb25Amt(l){ const v = Number(l.price) * Number(l.q); return Math.round(((isFinite(v) && v > 0) ? v : (Number(l.amt) || 0)) * 100) / 100; }
function nb25Day(l){ const t = typeof APP_TODAY !== 'undefined' ? APP_TODAY : new Date().toISOString().slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(l.date || '') && l.date <= t ? l.date : t; }
async function nb25Add(){
  const keep = NB.lines.filter(l => !l.skipped && !l.blur);
  if(!keep.length){ showToast('Nothing to add. Every line was skipped.', 'warn'); return; }
  NB25.saving = true; nf22NbPaint();
  const biz = myBusiness.id, kind = NB.kind || 'sales'; let err = null, added = 0, missing = [];
  try{
    if(kind === 'sales' || kind === 'unsure'){
      const rows = keep.filter(l => nb25Amt(l) > 0).map(l => { const amt = nb25Amt(l), credit = l.paid === 'credit';
        return {business_id: biz, sale_date: nb25Day(l), customer_name: String(l.who || 'Walk-in').slice(0, 120), line_items: [{product: String(l.item || 'Item').slice(0, 120), qty: Number(l.q) || 1, unitPrice: Number(l.price) || amt, unitCost: 0}],
          payments: credit ? [] : [{method: 'cash', amount: amt, date: nb25Day(l)}], total: amt, paid_with: credit ? 'credit' : 'cash', note: 'From paper'}; });
      if(rows.length){ const { error } = await sb.from('downstream_sales').insert(rows); err = error; added = rows.length; }
    } else if(kind === 'utang'){
      const by = {}; keep.forEach(l => { const k = String(l.who || '').trim(); if(!k) return; by[k] = (by[k] || 0) + nb25Amt(l); });
      const rows = Object.entries(by).filter(([, a]) => a > 0).map(([name, amount]) => ({buyer_id: null, name: name.slice(0, 120), phone: null, email: null, amount: Math.round(amount * 100) / 100, due: null, ref: 'From paper'}));
      if(rows.length){ const { error } = await sb.rpc('record_opening_balances', {p_rows: rows}); err = error; added = rows.length; }
    } else if(kind === 'exp' || kind === 'bills'){
      const rows = keep.filter(l => nb25Amt(l) > 0).map(l => ({business_id: biz, spent_on: nb25Day(l), category: String(kind === 'bills' ? 'Supplier bill' : (l.item || 'Other')).slice(0, 40), amount: nb25Amt(l),
        paid_from: kind === 'bills' || l.paid === 'credit' ? 'credit' : 'cash', vendor: String(l.who || '').slice(0, 120) || null, note: 'From paper'}));
      if(rows.length){ const { error } = await sb.from('expenses').insert(rows); err = error; added = rows.length; }
    } else if(kind === 'stock'){
      const { data: inv, error: e1 } = await sb.from('inventory_items').select('id, name').eq('business_id', biz); err = e1;
      if(!err){ for(const l of keep){ const name = String(l.item || '').trim().toLowerCase(), it = (inv || []).find(x => String(x.name).trim().toLowerCase() === name); const n = Number(l.q);
          if(!it || !isFinite(n)){ missing.push(l.item || l.i); continue; }
          const { error } = await sb.from('inventory_items').update({on_hand: n}).eq('id', it.id); if(error){ err = error; break; } added++; } }
    }
  }catch(e){ err = e; }
  if(err){ NB25.saving = false; nf22NbPaint(); showToast(/closed/i.test(err.message || '') ? 'That month is closed in your books. Reopen it in Books first, or change the dates.' : "Couldn't add the lines: " + (err.message || err), 'error'); return; }
  const words = [], seen = new Set();
  NB.lines.forEach(l => { if(l.ok_who && l.w && l.who && l.w !== l.who && !seen.has('who' + l.w)){ seen.add('who' + l.w); words.push({business_id: biz, kind: 'who', raw: String(l.w).slice(0, 60), meaning: String(l.who).slice(0, 120), updated_at: new Date().toISOString()}); }
    if(l.ok_what && l.i && l.item && l.i !== l.item && !seen.has('what' + l.i)){ seen.add('what' + l.i); words.push({business_id: biz, kind: 'what', raw: String(l.i).slice(0, 60), meaning: String(l.item).slice(0, 120), updated_at: new Date().toISOString()}); } });
  if(words.length) await sb.from('nb_words').upsert(words, {onConflict: 'business_id,kind,raw'});
  if(NB24.curId) await sb.from('nb_pages').update({status: 'added', kind, added_count: added, lines: keep.map(l => ({date: nb25Day(l), who: l.who, item: l.item, qty: l.q, price: l.price, amount: nb25Amt(l), paid: l.paid}))}).eq('id', NB24.curId);
  NB25.server = (NB25.server || []).filter(x => x.id !== NB24.curId); NB24.curId = null;
  NB25.saving = false; NB25.added = added; NB25.missing = missing; NB.added = true; nf22NbPaint(); try{ nf24Badge(); }catch(e){}
  showToast(`Added ${added} line${added === 1 ? '' : 's'} from paper.`, 'success');
  try{ if(typeof loadBooksData === 'function') loadBooksData(); }catch(e){}
}
async function nb25Skip(){
  if(!NB24.curId || !confirm('Skip this whole page? The photo stays saved, marked skipped.')) return;
  await sb.from('nb_pages').update({status: 'skipped'}).eq('id', NB24.curId);
  NB25.server = (NB25.server || []).filter(x => x.id !== NB24.curId); NB24.curId = null; NB25.err = ''; NB.step = 0; NB.photo = ''; nf22NbPaint(); try{ nf24Badge(); }catch(e){}
}
function nb25Who(kind){ return kind === 'bills' ? 'the supplier' : kind === 'exp' ? 'who you paid' : 'the customer'; }
function nb25Main(){
  const ov = document.getElementById('nf22Nb'), main = ov && ov.querySelector('.nf22-nbmain'); if(!main) return;
  const real = nb25Real(), foot = ov.querySelector('.nf22-nbfoot');
  // the demo shop: say plainly it's a sample
  if(!real){ main.querySelectorAll('.nf22-nbproto').forEach(p => { p.textContent = 'Demo shop: Nifti shows a sample page. In your own account it reads your real photo.'; }); return; }
  main.querySelectorAll('.nf22-nbproto').forEach(p => p.remove());
  if(NB24.saved){ const p = main.querySelector('.nf22-nbdone p'); if(p) p.textContent = 'They\'re saved to your business. Anyone on your team can check them from their own phone. Nothing goes into your books until a person says yes.'; }
  if(NB.step === 0 && !NB.added && NB25.usage && !main.querySelector('.nf25-use')){
    const u = NB25.usage, el = document.createElement('p'); el.className = 'nf25-use';
    el.innerHTML = u.ready === false ? 'Notebook reading is being switched on by the Nifti team. You can save pages now; they get read once it\'s on.' : `This month: <b>${u.used || 0} of ${u.limit} pages</b> read.${u.used >= u.limit ? ' You\'ve used them all. <a onclick="nf22NbClose(); navigate(\'settings\')">See Pro</a>' : ''}`;
    main.insertBefore(el, main.firstChild);
  }
  if(NB.step >= 2 && NB24.curId && !NB.added){
    if(NB25.reading){
      main.innerHTML = `<div class="nf25-reading"><img src="${NB.photo}" alt="Your page"><div><span class="nf25-spin" aria-hidden="true"></span><h2>Reading your page…</h2><p>This takes about 20 seconds. Nifti looks for each line, then matches names and items to your own lists.</p></div></div>`;
      if(foot) foot.hidden = true; return;
    }
    if(NB25.err){
      main.innerHTML = `<div class="nf25-reading"><img src="${NB.photo}" alt="Your page"><div><h2>Nifti couldn't read this page</h2><p>${nf25E(NB25.err)}</p>
        <div class="nf22-nbbtns"><button type="button" class="btn btn-primary" data-nb="nb25retry">Try again</button><button type="button" class="btn btn-outline" data-nb="nb25skip">Skip this page</button><button type="button" class="btn btn-outline" data-nb="close">Check it later</button></div></div></div>`;
      if(foot) foot.hidden = true; return;
    }
    if(foot) foot.hidden = false;
    if(NB.step === 2){
      const h = main.querySelector('h2'); if(h) h.textContent = NB.lines.length ? `Nifti found ${NB.lines.length} line${NB.lines.length === 1 ? '' : 's'}. Is each column right?` : 'Nifti found no lines on this page';
      if(NB25.summary && !main.querySelector('.nf25-sum')){ const s = document.createElement('p'); s.className = 'nf25-sum'; s.textContent = NB25.summary; const sub = main.querySelector('.nf22-nbsub'); if(sub) sub.after(s); }
    }
    if(NB.step === 3){
      const q = nf22NbQs()[0], box = main.querySelector('.nf22-nbq');
      if(q && box && q.k !== 'blur'){ const l = NB.lines[q.i], m = box.querySelector('.nf22-nbmath'), h3 = box.querySelector('h3');
        if(h3) h3.innerHTML = h3.innerHTML.replace(q.k === 'who' ? 'the customer' : 'the item', q.k === 'who' ? nb25Who(NB.kind) : 'the item');
        if(m){ if(q.k === 'who') m.textContent = l.whoKnown ? 'Already in your list.' : `New name. Nifti adds "${l.who}" for you.`;
          else { const calc = Number(l.q) && Number(l.price) ? `${l.q} × ${bkPeso(l.price)} = ${bkPeso(nb25Amt(l))}` : bkPeso(nb25Amt(l)); m.innerHTML = `${nf25E(calc)}${l.note ? ` <em>${nf25E(l.note)}</em>` : ''}`; } } }
    }
    if(NB.step === 4){
      const d = NB25_DEST[NB.kind] || NB25_DEST.sales, where = main.querySelector('.nf22-nbwhere');
      if(where) where.innerHTML = `<li><b>${d[0]}</b><span>${d[2]}</span></li><li><b>Words you confirmed</b><span>are remembered, so the next page reads them by itself.</span></li><li><b>The photo</b><span>stays saved with this page, so you can always look back.</span></li>`;
      const lab = main.querySelectorAll('.nf22-nbsum span'); if(lab[1]) lab[1].textContent = NB.kind === 'stock' ? 'counted' : NB.kind === 'utang' ? 'owed to you' : (NB.kind === 'exp' || NB.kind === 'bills') ? 'in expenses' : 'in sales';
      if(lab[2]) lab[2].textContent = NB.kind === 'bills' ? 'suppliers' : NB.kind === 'exp' ? 'paid to' : NB.kind === 'stock' ? 'items' : 'customers';
      const tot = main.querySelector('.nf22-nbsum div:nth-child(2) b'); if(tot) tot.textContent = NB.kind === 'stock' ? String(NB.lines.filter(l => !l.skipped && !l.blur).length) : bkPeso(NB.lines.filter(l => !l.skipped && !l.blur).reduce((a, l) => a + nb25Amt(l), 0));
      const calm = main.querySelector('.nf22-calm'); if(calm) calm.textContent = 'Lines from paper are marked "From paper", so you can always find them.';
      const go = ov.querySelector('.nf22-nbgo'); if(go && NB25.saving){ go.disabled = true; go.textContent = 'Adding…'; }
    }
  }
  if(NB.added && NB25.added == null){ const p = main.querySelector('.nf22-nbdone p'); if(p) p.textContent = 'This was the sample page, so nothing was saved. Take a photo of your own notebook to add real lines.'; }
  if(NB.added && NB25.added != null){
    const h = main.querySelector('.nf22-nbdone h2'), p = main.querySelector('.nf22-nbdone p'), d = NB25_DEST[NB.kind] || NB25_DEST.sales;
    if(h) h.textContent = `Done. ${NB25.added} line${NB25.added === 1 ? ' is' : 's are'} in ${d[0]}.`;
    if(p) p.textContent = `Marked "From paper" with your photo kept.${NB25.missing && NB25.missing.length ? ` Not added (not in your stock list yet): ${NB25.missing.join(', ')}.` : ''}`;
    const go = main.querySelector('[data-nb="nb24go"]'); if(go){ go.dataset.v = d[1]; go.textContent = 'Open ' + d[0]; }
  }
}

/* ---------- wiring ---------- */
(function(){
  if(typeof nf24Inbox !== 'function') return;
  const inbox = nf24Inbox; nf24Inbox = function(){ return nb25Real() ? (NB25.server || []) : inbox.apply(this, arguments); };
  const openPage = nf24OpenPage; nf24OpenPage = function(id){ if(nb25Real()) return nb25Open(id); NB25.real = false; return openPage.apply(this, arguments); };
  const op = nf22NbOpen; nf22NbOpen = function(){ const out = op.apply(this, arguments); NB25.added = null; NB25.err = ''; NB25.reading = false; NB25.real = false;
    if(nb25Real()) Promise.all([nb25Load(), nb25Usage()]).then(() => { const ov = document.getElementById('nf22Nb'); if(ov && !ov.hidden && NB.step === 0) nf22NbPaint(); }); return out; };
  const pt = nf22NbPaint; nf22NbPaint = function(){ const out = pt.apply(this, arguments); try{ nb25Main(); }catch(e){ console.warn('nb25', e); } return out; };
  const dd = nf22NbDo; nf22NbDo = function(a, v){
    if(nb25Real()){
      if(a === 'nb24later'){ nb25SavePages().then(ids => { if(!ids) return; NB24.saved = ids.length; nf22NbPaint(); }); return; }
      if(a === 'nb24now'){ nb25SavePages().then(ids => { if(ids && ids.length) nb25Open(ids[0]); }); return; }
      if(a === 'nb25retry'){ const x = (NB25.server || []).find(y => y.id === NB24.curId); if(x){ NB25.reading = true; NB25.err = ''; nf22NbPaint(); nb25Read(x); } return; }
      if(a === 'nb25skip'){ nb25Skip(); return; }
      if(a === 'add' && NB24.curId){ if(!NB25.saving) nb25Add(); return; }
      if(a === 'back' && NB.step === 2 && NB24.curId){ NB24.curId = null; NB.photo = ''; NB.step = 1; NB25.err = ''; nf22NbPaint(); return; }
    }
    return dd.apply(this, arguments);
  };
  // the demo's toast must not suggest it saved anything
  const tst = window.showToast;
  if(typeof tst === 'function' && !tst._nb25){ const w = function(m){ if(m === 'Added from paper (prototype).') arguments[0] = nb25Real() ? 'Sample page: nothing was saved.' : 'Demo shop: nothing was saved. In your own account these lines go into your books.'; return tst.apply(this, arguments); }; Object.keys(tst).forEach(k => { w[k] = tst[k]; }); w._nb25 = true; window.showToast = w; try{ showToast = w; }catch(e){} }
})();
