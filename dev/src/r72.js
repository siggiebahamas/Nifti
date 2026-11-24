/* ===== Round 72: dashboard fixes from the "Nifti Revisions" brief =====
   Home: three status cards on top + owner view, original sections kept in their original order.
   Every function here is idempotent and runs after the page it decorates has drawn (no MutationObservers). */
const nf72Esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf72Peso = n => (Number(n) < 0 ? '−' : '') + '₱' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('en-PH');
const NF72_IC = {
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  up: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>', down: '<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>', wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-4v4M17 13.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>'
};
const nf72Svg = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NF72_IC[n] || ''}</svg>`;

/* ---------- Home: the three status cards (brief 4.1, 4.2) ----------
   Read straight from "What to do": Act Today = needs attention (red), This Week = coming up (amber),
   Fine = on track (green). Tapping a card scrolls to that lane. Labels say the status in words, so color is never the only cue. */
function nf72Lanes(home){
  const out = {};
  home.querySelectorAll('.lane').forEach(l => {
    const h = l.querySelector('.lane-h'); if(!h) return;
    const k = h.classList.contains('r') ? 'r' : h.classList.contains('y') ? 'y' : h.classList.contains('g') ? 'g' : ''; if(!k) return;
    const spans = h.querySelectorAll('span'), n = parseInt((spans[1] || {}).textContent, 10);
    const first = [...l.querySelectorAll('.task h5')].map(x => x.textContent.trim()).filter(Boolean);
    out[k] = {el: l, n: isNaN(n) ? first.length : n, first};
  });
  return out;
}
function nf72StatusHtml(L){
  const card = (k, tone, ic, label, when, empty) => {
    const x = L[k] || {n: 0, first: []}, n = x.n;
    const line = n ? x.first.slice(0, 2).map(nf72Esc).join(' · ') + (n > 2 ? ` · +${n - 2} more` : '') : empty;
    return `<button type="button" class="nf72-st ${tone}" data-lane="${k}" aria-label="${label}: ${n}. ${nf72Esc(line)}">
      <span class="nf72-st-top"><span class="nf72-st-ic">${nf72Svg(ic)}</span><span class="nf72-st-lbl">${label}</span><span class="nf72-st-n">${n}</span></span>
      <span class="nf72-st-when">${when}</span><span class="nf72-st-line">${line}</span></button>`;
  };
  return `<section class="nf72-status" aria-label="Your business at a glance">
    ${card('r', 'red', 'alert', 'Needs attention', 'Act today', 'Nothing urgent right now')}
    ${card('y', 'amber', 'clock', 'Coming up', 'This week', 'Nothing due this week')}
    ${card('g', 'green', 'check', 'On track', 'Looking good', 'Records will show here as you use Nifti')}</section>`;
}
function nf72Status(home){
  const L = nf72Lanes(home), hero = home.querySelector('.hero'); if(!hero) return;
  let box = home.querySelector('.nf72-status');
  if(!L.r && !L.y && !L.g){ if(box) box.remove(); return; }   // roles without "What to do" (e.g. drivers) don't get the cards
  const sig = ['r', 'y', 'g'].map(k => L[k] ? L[k].n + ':' + L[k].first.slice(0, 2).join('|') : '-').join('/');
  if(box && box.dataset.sig === sig) return;
  const tmp = document.createElement('div'); tmp.innerHTML = nf72StatusHtml(L); const fresh = tmp.firstElementChild; fresh.dataset.sig = sig;
  if(box) box.replaceWith(fresh); else hero.insertAdjacentElement('afterend', fresh);
  fresh.addEventListener('click', e => {
    const b = e.target.closest('[data-lane]'); if(!b) return;
    const lane = nf72Lanes(home)[b.dataset.lane]; if(!lane) return;
    lane.el.scrollIntoView({behavior: 'smooth', block: 'center'});
    lane.el.classList.remove('nf72-flash'); void lane.el.offsetWidth; lane.el.classList.add('nf72-flash');
  });
}

/* ---------- Home: owner view (brief 4.4) ----------
   Owner/GM/Finance only. Recorded figures, not forecasts. Sales is NOT repeated (the "Sales this month" box above has it).
   "Worth reviewing" lists things the What-to-do lanes don't already show: where the money went, how sure the profit is, margin trend. */
function nf72OwnerHtml(){
  const m = bkMonth(APP_TODAY), pm = bkPrevMonth(m), p = bkPnl(m), q = bkPnl(pm);
  const mon = new Date(m + '-01T00:00:00').toLocaleDateString('en-PH', {month: 'long'}), pmon = new Date(pm + '-01T00:00:00').toLocaleDateString('en-PH', {month: 'long'});
  const sales = Number(p.sales) || 0, spend = (Number(p.cost) || 0) + (Number(p.expenses) || 0), profit = sales - spend;
  const margin = sales ? profit / sales * 100 : null, qs = Number(q.sales) || 0, qm = qs ? (qs - (Number(q.cost) || 0) - (Number(q.expenses) || 0)) / qs * 100 : null;
  const delta = margin != null && qm != null ? margin - qm : null;
  const review = [];
  const cats = Object.entries(p.byCat || {}).filter(([, v]) => Number(v) > 0).sort((a, b) => b[1] - a[1]).slice(0, 2);
  cats.forEach(([c, v]) => review.push({tone: 'plain', ic: 'wallet', t: `${c}: ${nf72Peso(v)}`, s: sales ? `${Math.round(v / sales * 100)}% of this month's sales went here` : 'Your biggest expense so far this month', b: 'See expenses', a: "go('expenses')"}));
  const noCost = new Set();
  try{ bkLiveSales().filter(s => bkMonth(s.date) === m).forEach(s => (s.lines || []).forEach(l => { if(!l.totalOnly && l.product && !(Number(l.unitCost) || bkItemCost(l.product))) noCost.add(l.product); }));
    getSupplierPOs().filter(o => bkMonth(o.createdDate) === m && !['draft', 'cancelled'].includes(o.status)).forEach(o => (o.lineItems || []).forEach(l => { if(l.product && !bkItemCost(l.product)) noCost.add(l.product); })); }catch(e){}
  const nc = noCost.size;
  if(nc > 0) review.push({tone: 'amber', ic: 'tag', t: `${nc} item${nc === 1 ? '' : 's'} sold with no cost saved`, s: 'Profit looks higher than it is until each item has a cost', b: 'Add costs', a: "go('profit')"});
  if(delta != null && delta <= -2) review.push({tone: 'amber', ic: 'down', t: `Margin down ${Math.abs(delta).toFixed(1)} points from ${pmon}`, s: `You kept ${margin.toFixed(1)}% of sales, ${qm.toFixed(1)}% last month. Check costs and discounts.`, b: 'Prices & profit', a: "go('profit')"});
  else if(delta != null && delta >= 2) review.push({tone: 'green', ic: 'up', t: `Margin up ${delta.toFixed(1)} points from ${pmon}`, s: `You kept ${margin.toFixed(1)}% of sales, up from ${qm.toFixed(1)}%.`, b: 'See why', a: "go('money')"});
  const stat = (lbl, val, sub, cls) => `<div class="nf72-ow-stat ${cls || ''}"><span>${lbl}</span><b>${val}</b><small>${sub}</small></div>`;
  return `<section class="sect glass nf72-owner" aria-labelledby="nf72OwH">
    <div class="sect-h"><h4 id="nf72OwH">Owner view · ${mon} so far</h4><button class="sch-btn" type="button" onclick="go('money')">Money overview ›</button></div>
    <div class="nf72-ow-grid">
      ${stat('Costs and expenses', nf72Peso(spend), `Cost of goods ${nf72Peso(p.cost)} · expenses ${nf72Peso(p.expenses)}`)}
      ${stat(profit < 0 ? 'Operating loss' : 'Operating profit', nf72Peso(profit), sales ? 'Sales minus costs and expenses' : 'No sales recorded yet', profit < 0 ? 'neg' : 'pos')}
      ${stat('Operating margin', margin == null ? '—' : margin.toFixed(1) + '%', margin == null ? 'Shows once you record a sale' : qm == null ? `Of every ₱100 sold, ₱${Math.round(margin)} stays` : `${pmon}: ${qm.toFixed(1)}%`, margin != null && margin < 0 ? 'neg' : '')}
    </div>
    <div class="nf72-ow-rev"><b>Worth reviewing</b>${review.length ? review.map(r => `<div class="nf72-ow-row ${r.tone}"><span class="ic">${nf72Svg(r.ic)}</span><span class="tx"><b>${nf72Esc(r.t)}</b><small>${nf72Esc(r.s)}</small></span><button type="button" class="btn btn-outline" onclick="${r.a}">${r.b}</button></div>`).join('')
      : '<p class="nf72-ow-none">Nothing extra to review. Urgent items are in What to do above.</p>'}</div>
    <p class="nf72-ow-foot">From the sales, costs and expenses recorded in Nifti for ${mon}. Not a forecast.</p>
  </section>`;
}
function nf72Owner(home){
  let boss = false; try{ boss = typeof booksCanSeeTotals === 'function' && booksCanSeeTotals() && BK.loaded; }catch(e){}
  let box = home.querySelector('.nf72-owner');
  if(!boss){ if(box) box.remove(); return; }
  let html = ''; try{ html = nf72OwnerHtml(); }catch(e){ console.warn('owner view', e); return; }
  if(box && box.dataset.html === html) return;
  const tmp = document.createElement('div'); tmp.innerHTML = html; const fresh = tmp.firstElementChild; fresh.dataset.html = html;
  if(box){ box.replaceWith(fresh); return; }
  // right after "What to do"; if a role has no lanes, after the summary boxes
  const what = [...home.querySelectorAll('.sect')].find(s => /^What to do/.test(((s.querySelector('.sect-h h4') || {}).textContent || '').trim()));
  if(what) what.insertAdjacentElement('afterend', fresh);
  else { const rows = home.querySelector('.rows'); if(rows) rows.prepend(fresh); }
}

/* ---------- Home: show each summary only once (brief 4.3) ---------- */
function nf72Dedupe(home){
  // within each row of boxes (the pills, or the original tiles they were made from), a label appears once
  home.querySelectorAll('.nf43-pills, .mosaic').forEach(row => {
    const seen = new Set();
    row.querySelectorAll(':scope > .nf43-pill, :scope > .tile').forEach(t => {
      const k = ((t.querySelector('.k') || t).textContent || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if(!k) return; if(seen.has(k)) t.remove(); else seen.add(k);
    });
  });
  home.querySelectorAll('.nf67-pulse, .nf67-intel, .mh-priority').forEach(x => x.remove());   // older layers, never shown together with these
}
function nf72Home(){
  const home = document.getElementById('mhHome'); if(!home) return;
  try{ nf72Dedupe(home); }catch(e){}
  try{ nf72Status(home); }catch(e){ console.warn('status cards', e); }
  try{ nf72Owner(home); }catch(e){ console.warn('owner view', e); }
}
(function(){
  if(typeof booksAfterHome !== 'function') return;
  const base = booksAfterHome;
  booksAfterHome = function(){ const r = base.apply(this, arguments); Promise.resolve().then(nf72Home); setTimeout(nf72Home, 0); return r; };
})();

/* ---------- Deliveries (brief 5): status in its own column, Try again in its own fixed column ----------
   Same data, same buttons, same meanings as Round 46. Pending states are never green:
   "Delivered · not collected" is amber because money is still out. */
nf46StopRow = function(r, s, i){
  const st = nfStopState(r, s), res = s.result || {}, col = res.collected, due = Number(s.amount_due) || 0, why = res.reason || s.fail_reason;
  const pill = (tone, txt, sub) => `<span class="nf72-rs t-${tone}"><b>${nf45Esc(txt)}</b>${sub ? `<small>${nf45Esc(sub)}</small>` : ''}</span>`;
  const status = col ? pill('g', 'Collected', nfP(col.amount)) : st === 'fail' ? pill('r', "Couldn't do", why ? String(why) : '')
    : st === 'done' ? (due >= 1 ? pill('y', 'Delivered', 'not collected yet') : pill('g', 'Delivered')) : due >= 1 ? pill('y', 'Collect', nfP(due))
    : st === 'next' ? pill('b', 'Next stop') : pill('n', 'Not yet');
  const act = st === 'fail' && r.status !== 'done' ? `<button type="button" class="btn btn-outline nf72-ra" onclick="reopenStop('${s.id}')">Try again</button>` : '';
  return `<div class="nf46-stop nf72-stop s-${st}" role="button" tabindex="0" onclick="if(!event.target.closest('button')) nf45StopOpen('${r.id}', '${s.id}')" onkeydown="if(event.key==='Enter') nf45StopOpen('${r.id}', '${s.id}')">
    <span class="nf45-ld ${st === 'wait' ? 'wait' : st}">${st === 'done' ? '✓' : st === 'fail' ? '✕' : i + 1}</span>
    <div class="nf72-rm"><b>${nf45Esc(s.buyer_name)}</b><small>${nf45StopWhat(s)}${s.address ? ' · ' + nf45Esc(String(s.address).split(',')[0]) : ''}${s.done_at && st !== 'wait' ? ' · ' + new Date(s.done_at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila'}) : ''}</small></div>
    <span class="nf72-rcol">${status}</span><span class="nf72-racol">${act}</span><i class="nf72-rgo" aria-hidden="true">›</i></div>`;
};

/* ---------- Find customers / Find suppliers (brief 6) ----------
   What was wrong: the page kept saying "Find customers" on the suppliers tab; a second guide box from Round 63/67
   landed in different places (below the results on one tab, above on the other) with buttons that only scrolled;
   real accounts showed "No businesses match yet" while the list was still loading, and the same text for "nobody listed"
   and "your search found nothing". Now: one title per tab, one helper line, and separate loading / empty / no-match states. */
const NF72_DISC = {
  customers: ['Find customers', 'Businesses on Nifti that buy what you sell.', 'Best matches first: they buy items you already sell. Tap Message to send your price list, or ☆ to save them as a lead.'],
  suppliers: ['Find suppliers', 'Suppliers on Nifti that show their prices.', 'Compare their prices with what you pay now. Send a connection request to start ordering from them.']
};
function nf72Discover(){
  const pg = document.getElementById('page-discover'); if(!pg) return;
  const mode = (typeof NFX !== 'undefined' && NFX.mode === 'suppliers') ? 'suppliers' : 'customers', d = NF72_DISC[mode];
  const h = pg.querySelector(':scope > .page-head h1, :scope > .page-head h2');
  if(h){ const tn = [...h.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); if(tn && tn.textContent.trim() !== d[0]) tn.textContent = d[0] + ' '; }
  // the subtitle stays Round 43's "New buyers and better suppliers." (it fits both tabs; rewriting it would fight that pass)
  const sw = pg.querySelector(':scope > .nfx-switch');
  if(sw){ let help = pg.querySelector(':scope > .nf72-dhelp'); if(!help){ help = document.createElement('p'); help.className = 'nf72-dhelp'; sw.insertAdjacentElement('afterend', help); } if(help.textContent !== d[2]) help.textContent = d[2]; }
  pg.querySelectorAll('#nf63DiscoverIntro').forEach(x => x.remove());
}
(function(){
  const lay = window.nfDiscoverLayout;
  if(typeof lay === 'function' && !lay._nf72){ const w = function(){ const r = lay.apply(this, arguments); try{ nf72Discover(); }catch(e){} return r; }; w._nf72 = true; window.nfDiscoverLayout = w; try{ nfDiscoverLayout = w; }catch(e){} }
  const fh = window.nfFindHtml;
  if(typeof fh === 'function' && !fh._nf72){
    const w = function(){
      let loading = false; try{ loading = !!(myBusiness && typeof realDiscover !== 'undefined' && !realDiscover.buyers); }catch(e){}
      if(loading) return '<div class="nf72-dstate"><span class="nf72-spin" aria-hidden="true"></span><b>Looking for businesses near you…</b></div>';
      let out = fh.apply(this, arguments);
      const empty = '<div class="nf-empty">No businesses match yet. Try All Philippines, or search Google Maps below.</div>';
      if(out.includes(empty)){
        let total = 0; try{ total = nfFindList().length; }catch(e){}
        const filtered = total > 0;
        const q = (typeof NF36F !== 'undefined' && NF36F.q) ? NF36F.q.trim() : '';
        out = out.replace(empty, filtered
          ? `<div class="nf72-dstate"><b>No business matches ${q ? '“' + nf72Esc(q) + '”' : 'these filters'}</b><span>${total} business${total === 1 ? '' : 'es'} are listed. Clear the search to see them all.</span><button type="button" class="btn btn-outline" onclick="NF36F.q=''; NF36F.type='All'; NF36F.area='All Philippines'; nfFindRender()">Clear search</button></div>`
          : `<div class="nf72-dstate"><b>No buyers have listed themselves on Nifti yet</b><span>Nifti is new, so this list grows as businesses join and choose to be found. For now, search Google Maps below and add good ones as leads.</span></div>`);
      }
      return out;
    };
    w._nf72 = true; window.nfFindHtml = w; try{ nfFindHtml = w; }catch(e){}
  }
})();

/* ---------- Leads on Find customers (brief 7): status and follow-up date in their own roomy column ---------- */
function nf72LeadRow(l){
  const late = l.next_follow_up && l.next_follow_up < APP_TODAY, today = l.next_follow_up === APP_TODAY;
  const tone = {new: 'y', contacted: 'b', quoted: 'b'}[l.stage] || 'n';
  const ini = String(l.name || '?').split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  return `<div class="nf72-lead" role="button" tabindex="0" onclick="fuOpenLead('${l.id}')" onkeydown="if(event.key==='Enter') fuOpenLead('${l.id}')">
    <span class="nf72-lav" style="background:${typeof nfIniColor === 'function' ? nfIniColor(l.name || '') : '#1F6B45'}">${nf72Esc(ini)}</span>
    <div class="nf72-lmid"><b>${nf72Esc(l.name)}${l.company && l.company !== l.name ? ` · ${nf72Esc(l.company)}` : ''}</b><small>${nf72Esc(l.interest || (typeof LEAD_SOURCES !== 'undefined' && LEAD_SOURCES[l.source]) || '')}</small></div>
    <div class="nf72-lst"><span class="nf72-lchip t-${tone}">${nf72Esc((typeof LEAD_STAGES !== 'undefined' && LEAD_STAGES[l.stage]) || l.stage)}</span>
      <span class="nf72-ldue ${late ? 'late' : today ? 'today' : ''}">${nf72Svg('clock')}<span>${late ? 'Follow up: ' : today ? 'Follow up ' : 'Next: '}${nf72Esc(typeof fuDueLabel === 'function' ? fuDueLabel(l.next_follow_up).toLowerCase() : (l.next_follow_up || ''))}</span></span></div>
    <i class="nf72-lgo" aria-hidden="true">›</i></div>`;
}
if(typeof nf18Leads === 'function'){
  nf18Leads = async function(){
    const pg = document.getElementById('page-discover'); if(!pg) return;
    let s = document.getElementById('nf18Leads');
    if(!s){ s = document.createElement('section'); s.id = 'nf18Leads'; s.className = 'panel-card nf18-leads'; pg.appendChild(s); }
    try{ if(typeof fuLoad === 'function') await fuLoad(); }catch(e){}
    const open = (typeof leadsCache !== 'undefined' && leadsCache || []).filter(l => l.stage !== 'won' && l.stage !== 'lost')
      .sort((a, b) => String(a.next_follow_up || '9999').localeCompare(String(b.next_follow_up || '9999')));
    const html = `<div class="nf18-lh"><h2>Your leads</h2><p>People who asked for a price or may buy soon. Soonest follow-up first.</p></div>`
      + (open.length ? `<div class="nf72-leads">${open.map(nf72LeadRow).join('')}</div>` : '<p class="nf18-none">No leads yet. Tap ☆ on any business above, or add one yourself.</p>')
      + `<button type="button" class="btn btn-outline btn-sm" onclick="typeof fuAddLead === 'function' && fuAddLead()">+ Add a lead</button>`;
    if(s.dataset.h !== html){ s.innerHTML = html; s.dataset.h = html; }
  };
}

/* ---------- Sales visibility (brief 9): the owner chooses; Owner, GM and Finance always see everything ---------- */
function nf72SalesMode(){ try{ return bkSettings().sales_visibility === 'own' ? 'own' : 'business'; }catch(e){ return 'business'; } }
function nf72IsOwner(){ try{ return getEffectiveRoles().includes('Owner'); }catch(e){ return true; } }
function nf72FullView(){ try{ return booksCanSeeTotals(); }catch(e){ return true; } }
function nf72Mine(row){
  if(!row) return false;
  let mid = null; try{ mid = typeof myTeamMember !== 'undefined' && myTeamMember ? myTeamMember.id : null; }catch(e){}
  if(mid && row.byId) return String(mid) === String(row.byId);           // created_by on downstream_sales = team_members.id
  let me = ''; try{ me = bkMe(); }catch(e){}
  return !!(me && row.by && String(row.by).replace(/ \(You\)$/, '').trim().toLowerCase() === String(me).replace(/ \(You\)$/, '').trim().toLowerCase());
}
(function(){
  const base = window.renderSalesBooksPage; if(typeof base !== 'function' || base._nf72) return;
  const w = function(){
    const own = !nf72FullView() && nf72SalesMode() === 'own', all = BK.sales;
    if(own && Array.isArray(all)) BK.sales = all.filter(nf72Mine);
    let r; try{ r = base.apply(this, arguments); } finally { BK.sales = all; }
    try{
      const body = document.getElementById('bkSalesBody'), pg = document.getElementById('page-sales');
      if(pg){ pg.querySelectorAll('.nf70-sales-control, .nf69-own-summary, .nf69-role-note, .nf70-own-note').forEach(x => x.remove()); }
      if(body){
        let note = body.querySelector('.nf72-svnote');
        const html = own ? 'Showing the sales <b>you</b> recorded. Your owner chose this in Settings.'
          : nf72IsOwner() ? `Staff see: <b>${nf72SalesMode() === 'own' ? 'only the sales they recorded' : 'all shop sales'}</b>. <button type="button" class="nf43-link" onclick="nf72GoSalesVis()">Change who sees sales</button>` : '';
        if(!html){ if(note) note.remove(); }
        else { if(!note){ note = document.createElement('p'); note.className = 'nf72-svnote'; body.prepend(note); } if(note.innerHTML !== html) note.innerHTML = html; }
      }
    }catch(e){}
    return r;
  };
  Object.keys(base).forEach(k => { w[k] = base[k]; }); w._nf72 = true; window.renderSalesBooksPage = w; try{ renderSalesBooksPage = w; }catch(e){}
})();
function nf72SalesVisCard(){
  const m = nf72SalesMode();
  const opt = (v, t, s) => `<label class="nf72-svopt ${m === v ? 'on' : ''}"><input type="radio" name="nf72sv" value="${v}" ${m === v ? 'checked' : ''} onchange="nf72SetSalesVis('${v}')"><span><b>${t}</b><small>${s}</small></span></label>`;
  return `<h2>Who can see sales</h2><div class="sub">Choose what your staff see on the Walk-in sales page. You, your General Manager and Finance always see everything.</div>
    <div class="nf72-svopts" role="radiogroup" aria-label="Staff sales visibility">
      ${opt('business', 'Everyone sees all shop sales', 'Best when a few people share one counter or one cashier rings up for the team. Staff see the whole day of sales and its totals.')}
      ${opt('own', 'Each person sees only the sales they recorded', 'Best when each cashier has their own drawer or shift. Staff see their own entries and their own totals.')}
    </div>
    <p class="nf72-svfoot">Either way, every sale keeps the name of the person who entered it. This choice only changes what staff see in Nifti. It does not change who served the customer, and it is not a sales quota.</p>`;
}
async function nf72SetSalesVis(v){
  if(!nf72IsOwner()){ showToast('Only the owner can change this.', 'warn'); return; }
  const ok = await bkSaveSettings({sales_visibility: v === 'own' ? 'own' : 'business'});
  if(ok !== false) showToast(v === 'own' ? 'Saved. Staff now see only the sales they recorded.' : 'Saved. Staff now see all shop sales.', 'success');
  const c = document.getElementById('nf72SalesVis'); if(c) c.innerHTML = nf72SalesVisCard();
}
function nf72GoSalesVis(){
  go('settings');
  setTimeout(() => { nf72SettingsCard(document.getElementById('page-settings')); const c = document.getElementById('nf72SalesVis'); if(!c) return;
    c.scrollIntoView({behavior: 'smooth', block: 'center'}); c.classList.remove('nf72-hl'); void c.offsetWidth; c.classList.add('nf72-hl'); }, 120);
}
function nf72SettingsCard(page){
  if(!page || page.id !== 'page-settings') return;
  let c = document.getElementById('nf72SalesVis');
  if(!nf72IsOwner()){ if(c) c.remove(); return; }
  if(c) return;
  c = document.createElement('section'); c.id = 'nf72SalesVis'; c.className = 'settings-card no-acc nf72-sv'; c.innerHTML = nf72SalesVisCard();
  // beside "Who sees what" (page access per role), so both team controls sit together
  const who = document.getElementById('nf26WhoCard'), head = page.querySelector(':scope > .page-head');
  if(who) who.insertAdjacentElement('afterend', c); else (head || page.firstElementChild).insertAdjacentElement('afterend', c);
}
try{ NF45_AFTER.push(nf72SettingsCard); }catch(e){}
// findable from both search boxes: "sales visibility", "staff sales access", "team permissions", "sales overview"
try{
  NF26_FIND.push({p: '@salesvis', t: 'Who can see sales', d: 'Sales visibility for your staff', w: 'sales visibility visible staff sales access team permissions permission sales overview who sees cashier benta makita makikita tingin'});
  NF26_FIND.push({p: '@who', t: 'Team permissions', d: 'Which pages each role can open', w: 'team permissions permission roles role access who sees what staff access pages tauhan'});
  const ok = nf26FindOk; nf26FindOk = function(x){ if(x.p === '@salesvis' || x.p === '@who') return nf72IsOwner(); return ok.apply(this, arguments); };
  const gw = nf26Go; nf26Go = function(p){ if(p === '@salesvis' || p === '@who'){ try{ gw('settings'); }catch(e){} if(p === '@salesvis') return nf72GoSalesVis(); try{ return nf20OpenWho(); }catch(e){} return; } return gw.apply(this, arguments); };
  window.nf26Go = nf26Go;
}catch(e){ console.warn('nf72 search', e); }

/* ---------- New sale, SKU first (brief 10) ----------
   Scan a barcode (USB/Bluetooth scanners type the code and press Enter) or pick the item; Nifti fills the name and the
   saved selling price. Scanning the same item again adds one. There is no "just the total": a sale is built from items.
   An item with no selling price blocks the sale until someone who manages prices sets it. Only Owner/GM/Finance can change
   a price on a line (it is then recorded as a discount against the list price). Customer and payment are for the whole sale. */
const NF72Q = {q: '', edit: -1};
function nf72CanPrice(){ return nf72FullView(); }
const nf72Sku = c => { const s = String(c || '').trim(); return !s ? '' : /^sku/i.test(s) ? s : 'SKU ' + s; };
function nf72Item(name){ const k = String(name || '').toLowerCase(); return (inventoryData || []).find(x => String(x.name).toLowerCase() === k) || null; }
function nf72ByCode(code){
  const k = String(code || '').trim().toLowerCase(); if(!k) return null;
  const hit = x => [x.code, x.sku, x.barcode].some(v => v != null && String(v).trim().toLowerCase() === k);
  const inv = (inventoryData || []).find(hit) || (inventoryData || []).find(x => String(x.name).trim().toLowerCase() === k); if(inv) return inv.name;
  const m = (BK.menu || []).find(x => x.active && (hit(x) || String(x.name).trim().toLowerCase() === k)); return m ? m.name : null;
}
function nf72Hits(v){
  const q = String(v || '').trim(); if(!q) return [];
  const all = typeof nf44AllItems === 'function' ? nf44AllItems() : [];
  const score = n => { const it = nf72Item(n), code = it ? [it.code, it.sku].filter(Boolean).join(' ').toLowerCase() : ''; if(code && code.includes(q.toLowerCase())) return 50; return typeof nf45Match === 'function' ? nf45Match(n, q) : (n.toLowerCase().includes(q.toLowerCase()) ? 1 : 0); };
  return all.map(n => [n, score(n)]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);
}
function nf72LinePrice(l){
  if(l && l.custom && nf72CanPrice()){ const p = Number(String(l.price).replace(/,/g, '')); if(p > 0) return p; }
  return Number(bkItemPrice(String((l && l.product) || '').trim())) || 0;
}
function nf72QsAdd(name){
  name = String(name || '').trim(); if(!name || !QS) return;
  if(!nf72Item(name) && !(BK.menu || []).some(m => m.active && String(m.name).toLowerCase() === name.toLowerCase())){
    showToast(`"${name}" is not in your Stock list yet. Add it in Stock first, with its selling price.`, 'warn'); return; }
  QS.lines = (QS.lines || []).filter(l => String(l.product).trim());
  const have = QS.lines.find(l => String(l.product).toLowerCase() === name.toLowerCase());
  if(have) have.qty = (Number(have.qty) || 0) + 1; else QS.lines.push({product: name, qty: 1, price: String(bkItemPrice(name) || '')});
  NF72Q.q = ''; QS.err = ''; qsRender();
  setTimeout(() => { const s = document.getElementById('nf72Scan'); if(s) s.focus(); }, 0);
}
function nf72Scan(v){
  const raw = String(v || '').trim(); if(!raw) return;
  const name = nf72ByCode(raw) || (nf72Hits(raw)[0] || null);
  if(name) nf72QsAdd(name); else showToast(`No item with the code or name "${raw}". Check it in Stock.`, 'warn');
}
function nf72Find(v){
  NF72Q.q = v; const box = document.getElementById('nf72Res'); if(!box) return;
  const hits = nf72Hits(v);
  box.innerHTML = hits.map(n => { const it = nf72Item(n), pr = bkItemPrice(n); return `<button type="button" onclick="nf72QsAdd(${JSON.stringify(n).replace(/"/g, '&quot;')})"><span><b>${escapeHtml(n)}</b>${it && it.code ? `<small>${escapeHtml(nf72Sku(it.code))}</small>` : ''}</span><small>${it ? escapeHtml(String(it.onHand)) + ' left' : ''}</small><em class="${pr ? '' : 'np'}">${pr ? bkPeso(pr) : 'no price'}</em></button>`; }).join('')
    || (String(v).trim() ? `<p class="nf72-qnone">No item matches. Items are added in Stock, with their price.</p>` : '');
  box.hidden = !String(v).trim();
}
function nf72QsQty(i, d){ const l = QS.lines[i]; if(!l) return; l.qty = Math.max(0, (Number(l.qty) || 0) + d); if(l.qty === 0) QS.lines.splice(i, 1); qsRender(); }
try{ nf44QsAdd = nf72QsAdd; window.nf44QsAdd = nf72QsAdd; }catch(e){}
function nf72QsTotal(){ return (QS.lines || []).reduce((a, l) => a + (Number(l.qty) || 0) * nf72LinePrice(l), 0); }
try{ const qt = qsTotal; qsTotal = function(){ return QS && QS.mode !== 'total' ? nf72QsTotal() : qt.apply(this, arguments); }; }catch(e){}
qsRender = function(){
  if(!QS) return;
  QS.mode = 'items'; QS.lines = (QS.lines || []).filter(l => String(l.product).trim());
  const lines = QS.lines, t = nf72QsTotal(), cash = QS.paidWith === 'cash', can = nf72CanPrice();
  const noPrice = lines.filter(l => !(nf72LinePrice(l) > 0)).map(l => l.product);
  const often = typeof nf44Often === 'function' ? nf44Often() : [];
  const custs = ['Walk-in'].concat(typeof nf45RecentCusts === 'function' ? nf45RecentCusts(5) : bkCustomerNames().filter(n => n !== 'Walk-in').slice(0, 5));
  const row = (l, i) => {
    const it = nf72Item(l.product), unit = nf72LinePrice(l), list = Number(bkItemPrice(l.product)) || 0, lt = (Number(l.qty) || 0) * unit, low = it && Number(l.qty) > Number(it.onHand);
    const priceCell = NF72Q.edit === i && can
      ? `<div class="nf72-qpe"><span>₱</span><input inputmode="decimal" value="${escapeHtml(String(l.price || list || ''))}" aria-label="Price each" oninput="QS.lines[${i}].price=this.value; QS.lines[${i}].custom=true; nf44QsChange()" onkeydown="if(event.key==='Enter'){ NF72Q.edit=-1; qsRender(); }"><button type="button" class="nf43-link" onclick="NF72Q.edit=-1; qsRender()">Done</button></div>`
      : `<div class="nf72-qp ${unit ? '' : 'np'}"><b>${unit ? bkPeso(unit) : 'No price'}</b>${l.custom && unit !== list && list ? `<small>list ${bkPeso(list)}</small>` : ''}${can ? `<button type="button" class="nf43-link" onclick="NF72Q.edit=${i}; qsRender()">${unit ? 'Change' : 'Set'}</button>` : ''}</div>`;
    return `<div class="nf72-ql${unit ? '' : ' bad'}"><div class="nm"><b>${escapeHtml(l.product)}</b><small>${it && it.code ? escapeHtml(nf72Sku(it.code)) + ' · ' : ''}${it ? escapeHtml(String(it.onHand)) + ' in stock' : 'menu item'}${low ? ' · more than you have, count the shelf later' : ''}</small></div>
      <div class="qty"><button type="button" onclick="nf72QsQty(${i}, -1)" aria-label="One less">−</button><input inputmode="decimal" value="${escapeHtml(String(l.qty))}" oninput="QS.lines[${i}].qty=this.value; nf44QsChange()" onchange="qsRender()" aria-label="Quantity of ${escapeHtml(l.product)}"><button type="button" onclick="nf72QsQty(${i}, 1)" aria-label="One more">+</button></div>
      ${priceCell}<em>${lt ? bkPeso(lt) : '—'}</em><button type="button" class="x" onclick="QS.lines.splice(${i},1); qsRender()" aria-label="Remove ${escapeHtml(l.product)}">✕</button></div>`;
  };
  slModal('qsModal', `<div class="sl-sheet-h"><b>New sale</b><button class="sl-x" onclick="slClose('qsModal')" aria-label="Close">✕</button></div>
    <div class="nf44-qs nf72-qs">
    <section><div class="nf43-q">Scan or pick an item</div>
      <div class="nf72-scan"><span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8"/></svg></span>
        <input id="nf72Scan" type="search" autocomplete="off" enterkeyhint="done" placeholder="Scan a barcode, or type an item name or SKU" value="${escapeHtml(NF72Q.q)}" oninput="nf72Find(this.value)" onkeydown="if(event.key==='Enter'){ event.preventDefault(); nf72Scan(this.value); }" aria-label="Scan a barcode, or type an item name or SKU"></div>
      <div class="nf44-res nf72-res" id="nf72Res" hidden></div>
      <p class="nf72-qhint">A USB or Bluetooth barcode scanner works here: scan, and the item drops in. Scan it again to add one more.</p>
      ${lines.length ? `<div class="nf72-qlh" aria-hidden="true"><span>Item</span><span>Qty</span><span>Price each</span><span>Amount</span><span></span></div><div class="nf72-qls">${lines.map(row).join('')}</div>`
        : `<div class="nf44-often"><span>Sold most often</span>${often.map(n => `<button type="button" onclick="nf72QsAdd(${JSON.stringify(n).replace(/"/g, '&quot;')})"><span>${escapeHtml(n)}</span><em>${bkItemPrice(n) ? bkPeso(bkItemPrice(n)) : 'no price'}</em><i aria-hidden="true">+</i></button>`).join('')}</div>`}
      ${typeof nf45BrowseHtml === 'function' ? nf45BrowseHtml() : ''}</section>
    ${noPrice.length ? `<div class="nf72-qwarn" role="alert"><b>${noPrice.length === 1 ? 'This item has' : 'These items have'} no selling price: ${noPrice.map(escapeHtml).join(', ')}</b><span>${can ? 'Tap "Set" on the line, or set it in Prices & profit so it is right next time.' : 'Ask the owner to set the price in Prices & profit. The sale can be saved once it has a price.'}</span></div>` : ''}
    <section class="nf44-tot"><label>Total</label><b id="qsTotal">${bkPeso(t)}</b></section>
    <section><div class="nf43-q">Paid with</div><div class="sl-days bk-chips">${BK_SALE_PAY.map(([k, l]) => `<button type="button" class="${QS.paidWith === k ? 'on' : ''}" onclick="QS.paidWith='${k}'; qsRender()">${l}</button>`).join('')}</div></section>
    ${cash ? `<section class="nf44-cash"><div><div class="nf43-q">Cash received <small class="nf44-opt">optional</small></div><div class="nf43-amt"><span>₱</span><input inputmode="decimal" value="${escapeHtml(QS.received)}" placeholder="${Math.ceil(t) || 0}" oninput="QS.received=this.value; nf44QsChange()" aria-label="Cash received"></div></div><div id="qsChange" class="nf44-chg"></div></section>` : ''}
    <section><div class="nf43-q">Customer ${QS.paidWith === 'credit' ? '<small class="nf44-opt">needed for utang</small>' : '<small class="nf44-opt">optional</small>'}</div>
      <div class="nf44-cust">${custs.map(n => `<button type="button" class="${QS.customer === n ? 'on' : ''}" onclick="QS.customer=${JSON.stringify(n).replace(/"/g, '&quot;')}; qsRender()" title="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join('')}</div>
      ${typeof nf45CustHtml === 'function' ? nf45CustHtml(custs) : ''}</section>
    ${NF44S.note || QS.note ? `<section><div class="nf43-q">Note</div><input class="nf43-search" maxlength="300" value="${escapeHtml(QS.note)}" oninput="QS.note=this.value" placeholder="e.g. suki"></section>` : `<button type="button" class="nf43-link nf44-addnote" onclick="NF44S.note=true; qsRender()">+ Add a note</button>`}
    ${typeof plBoxHtml === 'function' ? plBoxHtml() : ''}
    </div>
    <div class="sl-err" id="qsErr">${escapeHtml(QS.err)}</div>
    <div class="nf43-btns"><button type="button" class="btn btn-ghost" onclick="slClose('qsModal')">Cancel</button><button type="button" class="btn btn-outline" onclick="window._nf35Again='sale'; qsSave()" ${QS.saving || !lines.length || noPrice.length ? 'disabled' : ''}>Save & new sale</button><button class="btn btn-primary" onclick="qsSave()" ${QS.saving || !lines.length || noPrice.length || (QS.ask && QS.ask.state === 'waiting') ? 'disabled' : ''}>${QS.saving ? 'Saving…' : lines.length ? 'Save sale · ' + bkPeso(t) : 'Save sale'}</button></div>`);
  try{ nf44QsChange(); }catch(e){}
  if(!lines.length || NF72Q.q) setTimeout(() => { const s = document.getElementById('nf72Scan'); if(s && document.activeElement !== s && !document.querySelector('#qsModal input:focus')) s.focus(); }, 0);
};
window.qsRender = qsRender;
(function(){ const o = window.openQuickSale; if(typeof o !== 'function' || o._nf72) return; const w = function(){ NF72Q.q = ''; NF72Q.edit = -1; return o.apply(this, arguments); }; Object.keys(o).forEach(k => { w[k] = o[k]; }); w._nf72 = true; window.openQuickSale = w; try{ openQuickSale = w; }catch(e){} })();

/* ---------- Sale details for review (brief 10.3): built from the saved sale, never re-typed ---------- */
function nf72SaleDetail(id){
  const s = (BK.sales || []).find(x => x.id === id); if(!s) return;
  const full = nf72FullView(), pay = {cash: 'Cash', gcash: 'GCash', maya: 'Maya', credit: 'Utang (on credit)', bank: 'Bank', other: 'Other'}[s.paidWith] || s.paidWith || '—';
  const bal = typeof bkSaleBalance === 'function' ? bkSaleBalance(s) : 0;
  const lines = (s.lines || []);
  const rows = lines.map(l => {
    if(l.totalOnly) return `<tr><td colspan="${full ? 7 : 4}"><b>Total only, no items</b><small>Recorded before item-by-item sales. Item, price and cost were not saved, so they can't be shown.</small></td><td>${bkPeso(l.unitPrice)}</td></tr>`;
    const q = Number(l.qty) || 0, u = Number(l.unitPrice) || 0, list = Number(l.listPrice) || 0, c = Number(l.unitCost) || 0, disc = list > u ? (list - u) * q : 0;
    return `<tr><td><b>${escapeHtml(l.product)}</b></td><td>${q}</td><td>${bkPeso(u)}</td><td>${list ? bkPeso(list) : 'not saved'}</td>${full ? `<td>${disc ? bkPeso(disc) + (list ? ` (${Math.round(disc / (list * q) * 100)}%)` : '') : '—'}</td><td>${c ? bkPeso(c) : 'not saved'}</td><td>${c ? bkPeso(c * q) : '—'}</td>` : `<td>${disc ? bkPeso(disc) : '—'}</td>`}<td><b>${bkPeso(q * u)}</b></td></tr>`;
  }).join('');
  const cost = lines.reduce((a, l) => a + (l.totalOnly ? 0 : (Number(l.unitCost) || 0) * (Number(l.qty) || 0)), 0), noCost = lines.some(l => !l.totalOnly && !(Number(l.unitCost) > 0));
  slModal('nf72Sale', `<div class="sl-sheet-h"><b>Sale details</b><button class="sl-x" onclick="slClose('nf72Sale')" aria-label="Close">✕</button></div>
    <div class="nf72-sd">
      <div class="nf72-sdh"><div><small>Customer</small><b>${escapeHtml(s.customer || 'Walk-in')}</b></div><div><small>Paid with</small><b>${escapeHtml(pay)}</b></div><div><small>Payment</small><b class="${bal > 0 ? 'due' : 'ok'}">${bal > 0 ? bkPeso(bal) + ' still owed' : 'Paid in full'}</b></div><div><small>Entered by</small><b>${escapeHtml(s.by || '—')}</b></div><div><small>When</small><b>${escapeHtml(s.date)}${s.at ? ' · ' + new Date(s.at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila'}) : ''}</b></div></div>
      <div class="nf70-detail-table"><table><thead><tr><th>Item</th><th>Qty</th><th>Price each</th><th>List price</th>${full ? '<th>Discount</th><th>Cost each</th><th>Line cost</th>' : '<th>Discount</th>'}<th>Amount</th></tr></thead><tbody>${rows}</tbody>
        <tfoot><tr><td colspan="${full ? 7 : 5}">Total</td><td><b>${bkPeso(s.total)}</b></td></tr>${full && cost ? `<tr><td colspan="${full ? 7 : 5}">Cost of these items${noCost ? ' (some costs not saved)' : ''} · kept before expenses</td><td>${bkPeso(cost)} · ${bkPeso(s.total - cost)}</td></tr>` : ''}</tfoot></table></div>
      ${s.note ? `<p class="nf72-sdn"><b>Note:</b> ${escapeHtml(s.note)}</p>` : ''}
      ${s.voidedAt ? `<p class="nf72-sdn"><b>Removed</b>${s.voidReason ? ': ' + escapeHtml(s.voidReason) : ''}${s.voidedBy ? ' · by ' + escapeHtml(s.voidedBy) : ''}</p>` : ''}
    </div>
    <div class="nf43-btns"><button type="button" class="btn btn-outline" onclick="slClose('nf72Sale')">Close</button><button type="button" class="btn btn-primary" onclick="slClose('nf72Sale'); bkReceipt('${s.id}')">Receipt</button></div>`);
}
