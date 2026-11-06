/* ===== Round 8b: an online store that is fun to use, sub-tabs you can't miss, and less clutter ===== */

/* ---------- online store: one friendly page ---------- */
function nfStoreLayout(){
  const el = document.getElementById('storeContent'); if(!el || el.querySelector('.nfs')) return;
  const st = (typeof myBusiness !== 'undefined' && myBusiness) ? (myBusiness.store || {}) : (window._demoStore || {enabled: true, headline: 'Cement, steel & hardware. Same-day delivery in Metro Manila.', delivery_areas: 'Metro Manila, Bulacan', lead_time: 'Order by 2pm, delivered next day'});
  const name = (typeof myBusiness !== 'undefined' && myBusiness && myBusiness.name) || 'Metro Steel Co.';
  const cat = (typeof myCatalog !== 'undefined' && myCatalog) || [];
  const feat = (st.featured && st.featured.length ? st.featured : cat.map(c => c.product)).slice(0, 4);
  const price = p => { const c = cat.find(x => x.product === p) || {}; const v = c.price || c.unitPrice || c.basePrice; return v ? bkPeso(v) + (c.unit ? '/' + c.unit : '') : ''; };
  const body = document.getElementById('storeTabBody'), panel = body && body.querySelector('.panel-card'), linkcard = el.querySelector('.store-linkcard'), tabs = el.querySelector('.store-tabs');
  if(!panel) return;
  const pick = id => { const i = document.getElementById(id); return i ? (i.closest('.toggle-row') || i.closest('.row-2') || i.closest('.field')) : null; };
  const open = pick('stEnabled'), head = pick('stHeadline'), areas = pick('stAreas'), lead = pick('stLead');
  const prices = panel.querySelector('input[name="stMode"]') && panel.querySelector('input[name="stMode"]').closest('.field');
  const shareRow = linkcard && linkcard.querySelector('div[style*="display:flex"]');
  const wrap = document.createElement('div'); wrap.className = 'nfs'; wrap.dataset.nfRole = 'supplier';
  wrap.innerHTML = `
    <section class="nfs-hero">
      <div class="nfs-hero-l"><span class="nfs-chip ${st.enabled ? 'on' : ''}">${st.enabled ? 'Open for orders' : 'Closed'}</span>
        <h2>${st.enabled ? 'Your store is open. Share it!' : 'Open your store in 1 minute'}</h2>
        <p>Buyers tap your link, pick items and order. The order lands in Orders, like any other.</p>
        <div class="nfs-open"></div><div class="nfs-share"></div></div>
      <div class="nfs-phone" aria-label="How buyers see your store"><div class="nfs-ph-top"><b>${escapeHtml(name)}</b><small>${escapeHtml(st.headline || 'Your one-line headline shows here')}</small></div>
        <div class="nfs-ph-del">${escapeHtml(st.lead_time || 'Order today, delivered tomorrow')} · ${escapeHtml(st.delivery_areas || 'Where you deliver')}</div>
        <div class="nfs-ph-grid">${(feat.length ? feat : ['Your best seller', 'Another item']).map(p => `<div class="nfs-ph-item"><span class="nfs-ph-img">${escapeHtml(nfInitials(p))}</span><b>${escapeHtml(p)}</b><small>${price(p) || (st.price_mode === 'hidden' ? 'Ask for price' : '')}</small><i>Add</i></div>`).join('')}</div>
        <div class="nfs-ph-cta">Send order</div></div>
    </section>
    <section class="nfs-card"><div class="nfs-h"><i>1</i><div><h3>What buyers see first</h3><p>Three things that make people order. Change them anytime.</p></div></div><div class="nfs-fields"></div>
      <div class="nfs-save"><button class="btn btn-primary" onclick="saveStoreSettings()">Save</button></div></section>
    <section class="nfs-card"><div class="nfs-h"><i>2</i><div><h3>Share a ready-made post</h3><p>Pick a post, tap share. Facebook, Messenger or Viber.</p></div></div><div id="postComposer"></div><div id="postReach"></div></section>
    <section class="nfs-card"><div class="nfs-h"><i>3</i><div><h3>How your store is doing</h3><p>Visits and orders from your link.</p></div></div><div id="nfsStats"></div></section>
    <details class="nfs-more"><summary>More settings <small>link name, about you, minimum order, cash on delivery, best sellers, sale prices</small></summary><div class="nfs-more-b"></div></details>`;
  el.innerHTML = ''; el.appendChild(wrap);
  if(open) wrap.querySelector('.nfs-open').appendChild(open);
  if(shareRow) wrap.querySelector('.nfs-share').appendChild(shareRow);
  const f = wrap.querySelector('.nfs-fields'); [head, areas, lead && lead.closest('.row-2') !== areas ? lead : null, prices].forEach(x => { if(x) f.appendChild(x); });
  wrap.querySelector('.nfs-more-b').appendChild(panel);
  const keep = currentAppRole; currentAppRole = 'supplier';
  try{ renderPostComposer(document.getElementById('postComposer')); renderPostReach(document.getElementById('postReach')); renderStoreStats(document.getElementById('nfsStats')); }catch(e){ console.warn(e); }
  finally{ currentAppRole = keep; }
}
(function(){ const f = window.renderStorePage; if(typeof f !== 'function' || f._nf8) return;
  const w = function(){ const keep = currentAppRole; currentAppRole = 'supplier'; storeTab = 'setup';
    try{ f.apply(this, arguments); nfStoreLayout(); }catch(e){ console.warn(e); } finally{ currentAppRole = keep; }
    const t = document.getElementById('storePageTitle'), p = document.getElementById('storePageSub'); if(t) t.textContent = 'Online store'; if(p) p.textContent = 'Your own order page for Facebook, Messenger and Viber.'; };
  w._nf8 = true; window.renderStorePage = w; })();

/* ---------- sub-tabs you can't miss: each one says what it is for ---------- */
const NF_TAB_DESC = {
  'To confirm': "Orders waiting for the customer's yes", 'Today': 'Who to call or message today', 'Leads': 'People who may buy soon', 'Sell again': 'Old customers to win back',
  'Follow up': 'Who to remind, and how much', 'Cash & bank': 'Who holds cash, what reached the bank',
  'Overpaying': 'Orders above your agreed price', 'Spending limits': 'A cap for each person', 'Supplier report card': 'Who delivers on time',
  'Tasks': 'Jobs for your people', 'Team chat': 'Talk with your team', 'Activity': 'Who did what',
};
function nfTabCards(){
  document.querySelectorAll('#view-app :is(.sl-tabs,.adm-tabs,.team-tabs)').forEach(bar => {
    const btns = [...bar.querySelectorAll(':scope > button, :scope > .team-tab')]; if(btns.length < 2) return;
    let any = false;
    btns.forEach(b => { if(b.querySelector('.nf-tab-d')) { any = true; return; } const label = (b.childNodes[0] && b.childNodes[0].textContent || b.textContent).trim(); const key = Object.keys(NF_TAB_DESC).find(k => label.startsWith(k));
      if(key){ b.insertAdjacentHTML('beforeend', `<small class="nf-tab-d">${NF_TAB_DESC[key]}</small>`); any = true; } });
    if(any) bar.classList.add('nf-tabcards');
  });
}

/* ---------- less clutter: sections that repeat other pages, or that almost nobody uses ---------- */
const NF_CUT_HEADINGS = ['Red flags', 'How sure are these numbers?', 'Something not saving?', 'Custom roles', 'Upcoming BIR filing'];
const NF_CUT_BUTTONS = [['#page-watchdog', 'Price check'], ['#page-watchdog', 'Rules'], ['#page-collections', 'Reminder rules'], ['#page-inventory', 'Scan']];
function nfCut(){
  document.querySelectorAll('#view-app :is(h2,.settings-card h2,.panel-head h2,.acc-txt)').forEach(h => {
    const t = (h.childNodes[0] && h.childNodes[0].textContent || '').trim(); if(!NF_CUT_HEADINGS.includes(t)) return;
    const box = h.closest('section, .settings-card, .panel-card'); if(box && !box.classList.contains('nf-cut')) box.classList.add('nf-cut');
  });
  NF_CUT_BUTTONS.forEach(([pg, label]) => document.querySelectorAll(pg + ' button').forEach(b => { if(b.textContent.trim().replace(/\s+/g, ' ').startsWith(label) && !b.classList.contains('nf-cut')) b.classList.add('nf-cut'); }));
}
// Books & reports: trial balance, journal and accounts sit behind one "for your accountant" switch
(function(){
  if(typeof LG_TABS === 'undefined' || window._nfLgAll) return; window._nfLgAll = LG_TABS.slice();
  const apply = () => { const acct = !!window._nfAcct; LG_TABS.length = 0; window._nfLgAll.forEach(t => { if(acct || !['tb', 'journal', 'accounts'].includes(t[0])) LG_TABS.push(t); }); };
  apply();
  const f = window.renderLedgerPage; if(typeof f !== 'function' || f._nf8) return;
  const w = function(){ if(!window._nfAcct && ['tb', 'journal', 'accounts'].includes(LGV.tab)) LGV.tab = 'summary'; const r = f.apply(this, arguments);
    const done = () => { const pg = document.getElementById('page-ledger'); if(!pg || pg.querySelector('.nf-acct')) return; pg.insertAdjacentHTML('beforeend', `<p class="nf-acct"><button class="lg-link" onclick="window._nfAcct = !window._nfAcct; (${apply.toString()})(); renderLedgerPage()">${window._nfAcct ? 'Hide the accountant pages' : 'For your accountant: trial balance, journal and accounts'}</button></p>`); };
    if(r && r.then) r.then(done); else done(); return r; };
  w._nf8 = true; window.renderLedgerPage = w;
})();
(function(){ let raf = 0; const run = () => { raf = 0; try{ nfTabCards(); nfCut(); }catch(e){} };
  const start = () => { new MutationObserver(() => { if(!raf) raf = requestAnimationFrame(run); }).observe(document.getElementById('view-app') || document.body, {childList: true, subtree: true}); run(); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start(); })();
