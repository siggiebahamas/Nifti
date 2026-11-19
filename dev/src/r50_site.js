/* ===== Round 50: the landing page (tour, prices, reveal on scroll) ===== */
const NF50LP = {i: 0, t: null, stop: false, cycle: 'monthly', io: null};
function nf50Start(plan){
  try{ if(plan && plan !== 'free') localStorage.setItem('nifti-want-plan', plan); }catch(e){}
  navigate('login'); try{ nf20ToSignup(); }catch(e){}
}
function nf50LpView(){ return [...document.querySelectorAll('.marketing-view.nf50lp')].find(v => !v.classList.contains('hidden')) || null; }
function nf50LpTo(id){
  let el = document.getElementById(id);
  if(!el || el.closest('.marketing-view.hidden')){ navigate('index'); el = document.getElementById(id); setTimeout(() => nf50LpTo(id), 60); return; }
  const nav = el.closest('.nf50lp') && el.closest('.nf50lp').querySelector('.lp-nav'), off = nav ? nav.offsetHeight : 0;
  window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - off + 1, behavior: 'smooth'});
}
function nf50LpReduce(){ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
function nf50LpTab(i, user){
  const v = document.getElementById('view-index'); if(!v) return;
  const tabs = [...v.querySelectorAll('.lp-tabs button')], panels = [...v.querySelectorAll('.lp-panel')]; if(!panels.length) return;
  i = (i + panels.length) % panels.length; NF50LP.i = i;
  tabs.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', String(k === i)); });
  panels.forEach((p, k) => { p.hidden = k !== i; p.classList.toggle('on', k === i); });
  const b = tabs[i], row = b && b.parentElement; if(row && row.scrollWidth > row.clientWidth) row.scrollTo({left: Math.max(0, b.offsetLeft - row.offsetLeft - 16), behavior: 'smooth'});
  if(user){ NF50LP.stop = true; clearTimeout(NF50LP.t); const pr = v.querySelector('.lp-prog'); if(pr) pr.classList.remove('run'); return; }
  nf50LpTimer();
}
function nf50LpTimer(){
  clearTimeout(NF50LP.t); const v = document.getElementById('view-index'); if(!v || NF50LP.stop || nf50LpReduce()) return;
  const pr = v.querySelector('.lp-prog'); if(pr){ pr.classList.remove('run'); void pr.offsetWidth; pr.classList.add('run'); }
  NF50LP.t = setTimeout(() => { if(v.classList.contains('hidden') || NF50LP.stop) return; nf50LpTab(NF50LP.i + 1); }, 7000);
}
function nf50LpPeso(n){ return '₱' + Number(n || 0).toLocaleString('en-PH'); }
function nf50LpPlans(){
  const plans = typeof NF26_PLANS !== 'undefined' ? NF26_PLANS : [];
  const y = NF50LP.cycle === 'yearly';
  const html = plans.map(p => { const amt = y ? p.y : p.m;
    const btn = p.k === 'free' ? `<a class="lp-btn lp-btn-line" onclick="nf50Start('free')">Start free</a>`
      : p.k === 'pro' ? `<a class="lp-btn lp-btn-sun" onclick="nf50Start('pro')">Start with Pro</a>` : `<a class="lp-btn lp-btn-green" onclick="nf50Start('business')">Start with Business</a>`;
    const eq = p.k === 'free' ? 'Free for good' : y ? `Like ${nf50LpPeso(Math.round(p.y / 12))} a month · 2 months free` : `or ${nf50LpPeso(p.y)} a year, 2 months free`;
    return `<div class="lp-plan ${p.k}">${p.k === 'pro' ? '<span class="lp-flag">MOST SHOPS</span>' : ''}<h3>${p.name}</h3><p class="who">${p.who}</p>
      <div class="amt"><b>${nf50LpPeso(amt)}</b><span>${p.k === 'free' ? 'forever' : y ? 'a year' : 'a month'}</span></div><div class="eq">${eq}</div>
      <ul>${p.f.map(f => `<li>${f}</li>`).join('')}</ul>${btn}</div>`; }).join('');
  document.querySelectorAll('.nf50lp .lp-plans').forEach(box => { if(box.dataset.k !== html){ box.dataset.k = html; box.innerHTML = html; } });
  document.querySelectorAll('.nf50lp .lp-cyc button').forEach(b => b.classList.toggle('on', b.dataset.c === NF50LP.cycle));
}
function nf50LpCycle(c){ NF50LP.cycle = c; nf50LpPlans(); }
function nf50LpReveal(){
  const els = document.querySelectorAll('.nf50lp .lp-rv:not(.in)');
  if(!('IntersectionObserver' in window) || nf50LpReduce()){ els.forEach(e => e.classList.add('in')); return; }
  if(!NF50LP.io) NF50LP.io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); NF50LP.io.unobserve(e.target); } }), {rootMargin: '0px 0px -8% 0px', threshold: .08});
  els.forEach(e => NF50LP.io.observe(e));
}
function nf50LpInit(){
  if(!nf50LpView()) return;
  try{ nf50LpPlans(); }catch(e){ console.warn('lp plans', e); }
  try{ nf50LpReveal(); }catch(e){ document.querySelectorAll('.nf50lp .lp-rv').forEach(x => x.classList.add('in')); }
  if(!NF50LP.stop && !NF50LP.t) nf50LpTimer();
}
(function(){
  const nav = navigate;
  navigate = function(page){ const r = nav.apply(this, arguments); try{ if(page === 'index' || page === 'features' || page === 'pricing') setTimeout(nf50LpInit, 30); }catch(e){} return r; };
  Object.keys(nav).forEach(k => { navigate[k] = nav[k]; }); window.navigate = navigate;
  // the brand in the landing nav goes to the top of the landing page
  document.querySelectorAll('.nf50lp .lp-nav .brand, .nf50lp .lp-foot .brand').forEach(b => { b.style.cursor = 'pointer'; b.addEventListener('click', () => { navigate('index'); window.scrollTo({top: 0, behavior: 'smooth'}); }); });
  setTimeout(nf50LpInit, 50);
  document.addEventListener('visibilitychange', () => { if(document.hidden) clearTimeout(NF50LP.t); else if(nf50LpView() && !NF50LP.stop) nf50LpTimer(); });
  const st = document.querySelector('#view-index .lp-stage');
  if(st){ st.addEventListener('pointerenter', e => { if(e.pointerType === 'mouse'){ clearTimeout(NF50LP.t); const pr = document.querySelector('#view-index .lp-prog'); if(pr) pr.classList.remove('run'); } });
    st.addEventListener('pointerleave', e => { if(e.pointerType === 'mouse' && !NF50LP.stop) nf50LpTimer(); }); }
})();
