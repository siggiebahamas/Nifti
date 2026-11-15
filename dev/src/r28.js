/* ===== Round 28: get paid faster, and the founder's own dashboard ===== */
/* ---------- 1. Home: what came in this week, what is still out ---------- */
function nf28Money(){
  let got = 0, wait = 0, out = 0, late = 0, n = 0; const from = addDaysIso(APP_TODAY, -6);
  try{ getSupplierPOs().forEach(po => { if(!po.invoice || po.status === 'cancelled') return;
      (paymentListFor(po, 'invoice') || []).forEach(p => { const d = String(p.confirmedAt || p.date || '').slice(0, 10); if(p.confirmStatus === 'confirmed' && p.method !== 'credit_note' && d >= from && d <= APP_TODAY) got += Number(p.amount) || 0; });
      const c = computeInvoicePayments(po); const bal = Math.max(0, Number(c.balance) || 0); if(bal < 1) return; n++;
      wait += Number(c.pendingAmount) || 0; out += bal; if(po.invoice.dueDate && po.invoice.dueDate < APP_TODAY) late += bal; }); }catch(e){}
  return {got, wait, out, late, n};
}
function nf28HomeCard(page){
  if(!page || page.id !== 'page-dashboard') return; const rows = document.querySelector('#mhHome .rows'); if(!rows) return;
  let ok = true; try{ ok = isPageAllowedForViewAsRole('collections'); }catch(e){}
  const old = document.getElementById('nf28Paid'); if(!ok){ if(old) old.remove(); return; }
  const m = nf28Money(), key = [m.got, m.wait, m.out, m.late].join('|');
  if(old && old.dataset.k === key && old.parentElement === rows.parentElement) return;
  const el = old || document.createElement('section'); el.id = 'nf28Paid'; el.className = 'nf28-paid'; el.dataset.k = key;
  const P = n => fmtPHP(Math.round(n));
  el.innerHTML = `<div class="nf28-ph"><b>Getting paid</b><button type="button" class="nf26-link" onclick="go('collections')">Open Getting paid ›</button></div>
    <div class="nf28-pl"><div><i class="g"></i>Collected this week<b>${P(m.got)}</b></div>
      ${m.wait >= 1 ? `<div><i class="y"></i>They say they paid, for you to check<b>${P(m.wait)}</b></div>` : ''}
      <div><i class="${m.late >= 1 ? 'r' : 'n'}"></i>Still out${m.late >= 1 ? `, ${P(m.late)} of it late` : ''}<b>${P(m.out)}</b></div></div>`;
  if(el.parentElement !== rows.parentElement || el.nextElementSibling !== rows) rows.parentElement.insertBefore(el, rows);
}
/* ---------- 2. Getting paid: remind everyone who is due, one Viber tap each; see what the customer sees ---------- */
const NF28Q = {list: [], on: false};
function nf28Due(){ try{ return colRows().filter(g => g.needsYou); }catch(e){ return []; } }
function nf28RemindAll(){ NF28Q.list = nf28Due().map(g => g.id); NF28Q.on = true; nf28Next(); }
function nf28Next(){ const id = NF28Q.list.shift(); if(!id){ if(NF28Q.on){ NF28Q.on = false; showToast('Done. Everyone who was due has a reminder.', 'success'); } return; }
  colRemind(id).then(() => { setTimeout(() => { const s = document.getElementById('shareSheet'); if(!s) return; const h = s.querySelector('.sl-sheet-h b');
      if(h && NF28Q.on) h.insertAdjacentHTML('afterend', `<span class="nf28-qn">${NF28Q.list.length} more after this</span>`);
      if(NF28Q.on && !s.querySelector('.nf28-skip')){ const b = document.createElement('button'); b.type = 'button'; b.className = 'nf26-link nf28-skip'; b.textContent = NF28Q.list.length ? 'Skip this one' : 'Stop here'; b.onclick = () => { s.remove(); nf28Next(); }; s.querySelector('.share-modal').appendChild(b); } }, 60); }); }
function nf28Bar(page){
  if(!page || page.id !== 'page-collections') return; const host = page.querySelector('.nf-half-supplier') || page; const tbl = host.querySelector('table.nf25-owed'); if(!tbl) return;
  const due = nf28Due().length, key = String(due); let bar = host.querySelector('.nf28-bar'); const wrap = tbl.closest('.sl-card') || tbl.parentElement;
  if(bar && bar.dataset.k === key && bar.nextElementSibling === wrap) return;
  if(!bar){ bar = document.createElement('div'); bar.className = 'nf28-bar'; }
  bar.dataset.k = key;
  bar.innerHTML = `${due ? `<button type="button" class="btn btn-primary" onclick="nf28RemindAll()">Remind ${due === 1 ? 'the 1 customer' : 'all ' + due + ' customers'} due today on Viber</button>` : `<span class="nf28-ok">Nobody needs a reminder from you today.</span>`}
    <a class="nf26-link" href="${appBaseUrl()}#st/demo" target="_blank" rel="noopener">See the page your customer gets ›</a>`;
  wrap.parentElement.insertBefore(bar, wrap);
}
(function(){
  const base = window.colLogManual;
  if(typeof base === 'function' && !base._nf28){ const w = async function(){ const r = await base.apply(this, arguments); if(NF28Q.on) setTimeout(nf28Next, 500); return r; }; w._nf28 = true; window.colLogManual = w; try{ colLogManual = w; }catch(e){} }
})();
/* ---------- 3. The founder's dashboard: sign-ups by day, shops by plan, and a clear door ---------- */
async function nf28Founder(body){
  if(!body || body.querySelector('.nf28-fd')) return;
  let list = []; try{ list = await adminRpc('admin_businesses', {p_query: '', p_filter: 'all', p_limit: 1000, p_offset: 0}) || []; }catch(e){ return; }
  const day = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const days = []; for(let i = 29; i >= 0; i--){ const d = new Date(); d.setDate(d.getDate() - i); days.push(day(d)); }
  const per = {}; list.forEach(b => { const k = day(b.created_at); per[k] = (per[k] || 0) + 1; });
  const max = Math.max(1, ...days.map(d => per[d] || 0)), today = per[days[29]] || 0, week = days.slice(-7).reduce((s, d) => s + (per[d] || 0), 0);
  const plan = p => p === 'business' ? 'business' : ['pro', 'supplier_pro', 'buyer_pro'].includes(p) ? 'pro' : 'free'; const cnt = {free: 0, pro: 0, business: 0}; list.forEach(b => { cnt[plan(b.plan)]++; });
  const c = document.createElement('div'); c.className = 'nf28-fd';
  c.innerHTML = `<div class="panel-card"><div class="adm-h">New shops, last 30 days</div>
      <div class="nf28-nums"><div><em>TODAY</em><b>${today}</b></div><div><em>THIS WEEK</em><b>${week}</b></div><div><em>ALL SHOPS</em><b>${list.length}</b></div></div>
      <div class="nf28-chart" role="img" aria-label="Sign-ups per day for the last 30 days">${days.map(d => `<i title="${d}: ${per[d] || 0}" style="height:${Math.max(3, Math.round((per[d] || 0) / max * 100))}%" class="${per[d] ? 'on' : ''}"></i>`).join('')}</div>
      <div class="nf28-ax"><span>${days[0].slice(5)}</span><span>today</span></div></div>
    <div class="panel-card"><div class="adm-h">Shops by plan</div>
      <div class="nf28-nums"><div><em>FREE</em><b>${cnt.free}</b></div><div class="g"><em>PRO · ₱990</em><b>${cnt.pro}</b></div><div class="g"><em>BUSINESS · ₱2,990</em><b>${cnt.business}</b></div><div><em>MONTHLY, IF ALL PAY</em><b>${fmtPHP(cnt.pro * 990 + cnt.business * 2990)}</b></div></div>
      <p class="nf25-p" style="margin:10px 0 0;">Payments to confirm and plan changes are under Money. Questions, complaints and requests for more than 75 people are under Help. Suspend a shop from Businesses.</p></div>`;
  body.insertBefore(c, body.firstChild.nextSibling);
}
(function(){
  const ro = window.renderAdminOverview;
  if(typeof ro === 'function' && !ro._nf28){ const w = async function(body){ const out = await ro.apply(this, arguments); try{ await nf28Founder(body); }catch(e){ console.warn('nf28 founder', e); } return out; };
    w._nf28 = true; window.renderAdminOverview = w; try{ renderAdminOverview = w; }catch(e){} }
  const rp = window.renderAdminPage;
  if(typeof rp === 'function' && !rp._nf28){ const w = async function(){
      const h = document.querySelector('#page-admin .page-head'); if(h){ const a = h.querySelector('h1'), p = h.querySelector('p'); if(a) a.textContent = 'Founder dashboard'; if(p) p.textContent = 'Only you see this. Every shop on Nifti, sign-ups, plans, payments and help messages.'; }
      const el = document.getElementById('adminContent'); const owner = !!myBusiness && document.body.getAttribute('data-owner') === '1';
      if(!owner && el){ document.querySelectorAll('#page-admin .adm-host').forEach(x => x.classList.add('hidden'));
        el.innerHTML = `<div class="nf28-gate"><b>This page is for the founder of Nifti only.</b>
          <p>${myBusiness ? "You're signed in, but not with the founder's email. Sign out, then sign in with the founder's email." : "You're looking at the demo shop, so there is nothing to show here. Sign in with the founder's email and this page fills with every real shop, sign-ups by day, plans, payments and help messages."}</p>
          <ol><li>Tap the button below.</li><li>First time? Choose <b>Sign up</b>, type the founder's email and a password. No confirmation email is needed.</li><li>You land on your own shop's Home. Open the menu and tap <b>Founder dashboard</b>, or come back to this link.</li></ol>
          <button type="button" class="btn btn-primary" onclick="try{ sessionStorage.setItem('nifti-after-login','admin'); }catch(e){} navigate('login')">${myBusiness ? 'Go to sign in' : 'Sign in or sign up'}</button></div>`; return; }
      return rp.apply(this, arguments); };
    Object.keys(rp).forEach(k => { w[k] = rp[k]; }); w._nf28 = true; window.renderAdminPage = w; try{ renderAdminPage = w; }catch(e){} }
  // the menu and Settings call it what it is
  const ren = () => { document.querySelectorAll('.nav-item[data-page="admin"] span, .more-sheet-item[data-page="admin"] span').forEach(s => { if(s.textContent === 'Admin console') s.textContent = 'Founder dashboard'; }); };
  const base = nf26AfterPass; nf26AfterPass = function(page){ base(page); try{ ren(); nf28HomeCard(page); nf28Bar(page); if(page && page.id === 'page-dashboard' && document.body.getAttribute('data-owner') === '1' && sessionStorage.getItem('nifti-after-login') === 'admin'){ sessionStorage.removeItem('nifti-after-login'); go('admin'); } }catch(e){ console.warn('nf28', e); } }; window.nf26AfterPass = nf26AfterPass;
})();
