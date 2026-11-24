/* ===== Round 72: landing page, rebuilt cleanly on the original design =====
   Replaces the stacked runtime rewrites from Rounds 62-70. Everything on the page is written at build time
   (u72_site.py); this file only drives the moving parts: the phone in the hero, the "follow one order"
   journey, and the Stock panel of "See it in action". No observers, no polling. */

// "See it in action": the Stock panel (real feature: What runs out, from Round 12)
function nf72StockPanel(){
  return `<div class="f4-spot-t"><h3>Know what runs out before it does</h3><p>Nifti watches how fast each item really sells and how long your supplier takes to deliver, then tells you what to order today.</p>
    <ul class="m2-ticks"><li>Days of stock left for every item, from your real sales</li><li>Reorder line = supplier delivery time + your safety days</li><li>One tap drafts the purchase order to your supplier</li></ul>
    <div class="f4-out"><b>2 days</b><span>warning before the wire runs out, not after</span></div></div>
  <div class="f4-art green"><div class="f4-main"><div class="mk-stack">
    <div class="r72-sr"><div class="r72-sr-h"><b>What runs out</b><small>Days of stock left</small></div>
      <div class="r72-sr-row"><span><b>Galvanized Wire 12ga</b><small>Sells 3 a day · Metro Steel · 5-day delivery</small></span><i class="r72-sr-bar r"><em style="width:8%"></em></i><strong class="r">2 days</strong></div>
      <div class="r72-sr-row"><span><b>Portland Cement 40kg</b><small>Sells 5 a day · Cebu Aggregates · 3-day delivery</small></span><i class="r72-sr-bar y"><em style="width:22%"></em></i><strong class="y">6 days</strong></div>
      <div class="r72-sr-row"><span><b>Steel Rebar 12mm</b><small>Sells 6 a day · Metro Steel · 5-day delivery</small></span><i class="r72-sr-bar g"><em style="width:84%"></em></i><strong class="g">38 days</strong></div></div>
    <div class="mk-owe"><div><b>Order wire from Metro Steel</b><small>60 rolls drafted · arrives in 5 days</small></div><span class="mk-btnsm p">Send</span></div>
  </div></div></div>`;
}

// the real app, playing on a phone in the hero
const NF72_CAPS = ['Every order in one list', "Your driver's day, stop by stop", 'Who owes you, at a glance', 'Your whole day on one screen'];
function nf72Phone(){
  const imgs = document.querySelectorAll('#view-index .r72-phone-screen img'); if(imgs.length < 2) return;
  let reduce = false; try{ reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
  if(reduce) return;
  let i = 0;
  setInterval(() => {
    const v = document.getElementById('view-index'); if(!v || v.classList.contains('hidden') || document.hidden) return;
    i = (i + 1) % imgs.length;
    imgs.forEach((im, k) => im.classList.toggle('on', k === i));
    const c = document.getElementById('r72PhoneCap'); if(c) c.textContent = NF72_CAPS[i] || '';
  }, 3200);
}

// "Follow one order": six steps, the ledger on the right updates itself
const NF72_JR = [
  {status: ['New', 'y'], stock: '120 bags', owed: '₱0', cash: '₱0', profit: '—'},
  {status: ['Confirmed', 'b'], stock: '120 bags', owed: '₱0', cash: '₱0', profit: '—'},
  {status: ['On the way', 'b'], stock: '120 bags', owed: '₱0', cash: '₱0', profit: '—'},
  {status: ['Delivered', 'b'], stock: '100 bags', owed: '₱0', cash: '₱0', profit: '—'},
  {status: ['Billed · due Dec 8', 'y'], stock: '100 bags', owed: '₱4,560', cash: '₱0', profit: '—'},
  {status: ['Paid', 'g'], stock: '100 bags', owed: '₱0', cash: '₱4,560', profit: '₱880'}
];
const NF72J = {i: 0, t: null, auto: false, started: false};
function nf72JrGo(i, user){
  const box = document.getElementById('mkJourney'); if(!box) return;
  const prev = NF72_JR[NF72J.i] || NF72_JR[0], now = NF72_JR[i]; NF72J.i = i;
  box.querySelectorAll('.r72-jr-track button').forEach((b, k) => { b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
  box.querySelectorAll('.r72-jr-track li').forEach((li, k) => li.classList.toggle('r72-lit', k < i));
  box.querySelectorAll('.r72-sc').forEach((s, k) => s.classList.toggle('on', k === i));
  box.querySelectorAll('.r72-led').forEach(row => {
    const k = row.dataset.k, b = row.querySelector('b'); if(!b) return;
    if(k === 'status'){ b.innerHTML = `<em class="r72-pill ${now.status[1]}">${now.status[0]}</em>`; }
    else b.textContent = now[k];
    const changed = k === 'status' ? prev.status[0] !== now.status[0] : prev[k] !== now[k];
    row.classList.remove('flash'); if(changed && i !== 0){ void row.offsetWidth; row.classList.add('flash'); }
    row.classList.toggle('g', (k === 'cash' || k === 'profit') && now[k] !== '₱0' && now[k] !== '—');
    row.classList.toggle('y', k === 'owed' && now[k] !== '₱0');
  });
  const bar = box.querySelector('.r72-prog i'); if(bar) bar.style.width = ((i + 1) / NF72_JR.length * 100) + '%';
  const again = box.querySelector('.r72-replay'); if(again) again.hidden = i < NF72_JR.length - 1;
  if(user){ NF72J.auto = false; clearTimeout(NF72J.t); }
}
function nf72JrPlay(){
  clearTimeout(NF72J.t); NF72J.auto = true; nf72JrGo(0);
  const step = () => { if(!NF72J.auto) return; if(NF72J.i >= NF72_JR.length - 1){ NF72J.auto = false; return; }
    NF72J.t = setTimeout(() => { if(!NF72J.auto) return; const v = document.getElementById('view-index'); if(v && v.classList.contains('hidden')){ step(); return; } nf72JrGo(NF72J.i + 1); step(); }, 2600); };
  step();
}
function nf72JrInit(){
  const box = document.getElementById('mkJourney'); if(!box || box.dataset.r72) return; box.dataset.r72 = '1';
  const tabs = [...box.querySelectorAll('.r72-jr-track button')];
  tabs.forEach((b, k) => b.addEventListener('click', () => nf72JrGo(k, true)));
  box.querySelector('.r72-jr-track').addEventListener('keydown', e => {
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.preventDefault();
    const n = (NF72J.i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; nf72JrGo(n, true); tabs[n].focus();
  });
  const again = box.querySelector('.r72-replay'); if(again) again.addEventListener('click', nf72JrPlay);
  let reduce = false; try{ reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
  nf72JrGo(0);
  if(reduce) return;
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => { es.forEach(en => { if(en.isIntersecting && !NF72J.started){ NF72J.started = true; nf72JrPlay(); io.disconnect(); } }); }, {threshold: .35});
    io.observe(box.querySelector('.r72-jr-box'));
  } else { NF72J.started = true; nf72JrPlay(); }
}
(function(){
  const go = () => { try{ nf72Phone(); }catch(e){} try{ nf72JrInit(); }catch(e){} };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, {once: true}); else setTimeout(go, 0);
})();
