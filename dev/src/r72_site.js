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
      <div class="r72-sr-row"><span><b>Galvanized Wire 12ga</b><small>Sells 3 a day · 5-day delivery</small></span><i class="r72-sr-bar r"><em style="width:8%"></em></i><strong class="r">2 days</strong></div>
      <div class="r72-sr-row"><span><b>Portland Cement 40kg</b><small>Sells 5 a day · 3-day delivery</small></span><i class="r72-sr-bar y"><em style="width:22%"></em></i><strong class="y">6 days</strong></div>
      <div class="r72-sr-row"><span><b>Steel Rebar 12mm</b><small>Sells 6 a day · 5-day delivery</small></span><i class="r72-sr-bar g"><em style="width:84%"></em></i><strong class="g">38 days</strong></div></div>
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
  {status: ['Confirmed', 'b'], stock: '120 bags', owed: '₱0', cash: '₱0', profit: '—'},
  {status: ['Delivered', 'b'], stock: '100 bags', owed: '₱4,560', cash: '₱0', profit: '—'},
  {status: ['Paid', 'g'], stock: '100 bags', owed: '₱0', cash: '₱4,560', profit: '₱880'}
];
const NF72J = {i: 0, t: null, auto: false, started: false};
function nf72JrGo(i, user){
  const box = document.getElementById('mkJourney'); if(!box) return;
  const prev = NF72_JR[NF72J.i] || NF72_JR[0], now = NF72_JR[i]; NF72J.i = i;
  box.querySelectorAll('.r72-ph button[data-i]').forEach(b => { const k = Number(b.dataset.i); b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
  const line = box.querySelector('.r72-ph-line i'); if(line) line.style.width = (i / (NF72_JR.length - 1) * 100) + '%';
  box.querySelectorAll('.r72-win-nav span').forEach(s => s.classList.toggle('on', (' ' + s.dataset.on + ' ').includes(' ' + i + ' ')));
  box.querySelectorAll('.r72-sc').forEach((s, k) => s.classList.toggle('on', k === i));
  box.querySelectorAll('.r72-led').forEach(row => {
    const k = row.dataset.k, b = row.querySelector('b'); if(!b) return;
    if(k === 'status') b.innerHTML = `<em class="r72-pill ${now.status[1]}">${now.status[0]}</em>`; else b.textContent = now[k];
    const changed = k === 'status' ? prev.status[0] !== now.status[0] : prev[k] !== now[k];
    row.classList.remove('flash'); if(changed && i !== 0){ void row.offsetWidth; row.classList.add('flash'); }
    row.classList.toggle('g', (k === 'cash' || k === 'profit') && now[k] !== '₱0' && now[k] !== '—');
    row.classList.toggle('y', k === 'owed' && now[k] !== '₱0');
    row.classList.toggle('b', k === 'stock' && now[k] !== NF72_JR[0].stock);
  });
  const bar = box.querySelector('.r72-prog i'); if(bar) bar.style.width = ((i + 1) / NF72_JR.length * 100) + '%';
  box.querySelectorAll('.r76-track span').forEach(sp => { const k = Number(sp.dataset.s); sp.classList.toggle('done', k < i); sp.classList.remove('on'); if(k === i){ void sp.offsetWidth; sp.classList.add('on'); } });
  box.classList.toggle('r76-auto', !!NF72J.auto);
  const again = box.querySelector('.r72-replay'); if(again) again.hidden = i < NF72_JR.length - 1;
  if(user){ NF72J.auto = false; NF72J.started = true; clearTimeout(NF72J.t); box.classList.remove('r76-auto'); }   // a visitor's tap always wins over the autoplay
}
function nf72JrPlay(){
  clearTimeout(NF72J.t); NF72J.auto = true; nf72JrGo(0);
  const step = () => { if(!NF72J.auto) return; if(NF72J.i >= NF72_JR.length - 1){ NF72J.auto = false; return; }
    NF72J.t = setTimeout(() => { if(!NF72J.auto) return; const v = document.getElementById('view-index'); if(v && v.classList.contains('hidden')){ step(); return; } nf72JrGo(NF72J.i + 1); step(); }, 5600); };
  step();
}
function nf72JrInit(){
  const box = document.getElementById('mkJourney'); if(!box || box.dataset.r72) return; box.dataset.r72 = '1';
  const tabs = [...box.querySelectorAll('.r72-ph button[data-i]')];
  tabs.forEach(b => b.addEventListener('click', () => nf72JrGo(Number(b.dataset.i), true)));
  box.querySelector('.r72-ph').addEventListener('keydown', e => {
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
// "See it in action": a short hook and three quick wins per tab
const NF76_SHOW = {
  'Know exactly who owes you': ['Know exactly who owes you', 'Every peso owed, on one screen. Nifti reminds them so you don\u2019t have to.', ['See who\u2019s late at a glance', 'One-tap reminders, or let Nifti send them', 'They mark it paid, you confirm']],
  'Routes your drivers can follow': ['Routes your drivers can follow', 'Every stop and every peso collected. No more \u201cBoss, nasaan na?\u201d', ['Send the day\u2019s stops in one tap', 'Each stop turns green when done', 'Photo proof, cash checked the same day']],
  'Order from every supplier in one place': ['All your suppliers, one list', 'Even suppliers not on Nifti: they get a link and tap Confirm.', ['Price and date agreed in writing', 'Reorder your usual in one tap', 'Chat right beside every order']],
  'Know what runs out before it does': ['Know what runs out first', 'Nifti tells you what to order today, before the shelf is empty.', ['Days of stock left, from real sales', 'Alerts timed to your supplier\u2019s delivery', 'One tap drafts the order']],
  'Your own store, ready for Facebook': ['Your own online store', 'One link with your items and prices. Buyers order and pay, no back-and-forth.', ['GCash, Maya or cash on delivery', 'Delivery fee set per barangay', 'Ready-made Facebook posts']],
  'Books that keep themselves': ['Books that keep themselves', 'Every sale and expense lands in your books. Know your real profit, any day.', ['A receipt photo with every expense', 'Cash short and odd bills flagged', 'Profit and loss, ready for your accountant']]
};
// Round 77: one short line next to the big green number, same size as the ticks
const NF77_STAT = {'Know what runs out first': ['2 days', 'warning before it runs out'], 'Know exactly who owes you': ['\u20b184,200', 'owed to you right now'], 'Routes your drivers can follow': ['5 stops', 'planned, done and collected'], 'All your suppliers, one list': ['1 list', 'for every supplier you buy from'], 'Your own online store': ['2 min', 'to open your store'], 'Books that keep themselves': ['\u20b138,400', 'real profit this month']};
// the pictures use the same words and buttons as the app's pages
function nf77ShowArt(){
  const box = document.getElementById('mkShow'); if(!box || box.dataset.r77) return; box.dataset.r77 = '1';
  box.querySelectorAll('.mk-bigstat small').forEach(s => { const t = s.textContent.trim(); if(t === 'WHO OWES YOU') s.textContent = 'GETTING PAID \u00b7 OWED TO YOU'; else if(t === 'PROFIT THIS MONTH') s.textContent = 'MONTHLY SUMMARY \u00b7 PROFIT SO FAR'; });
  box.querySelectorAll('.mk-owe').forEach(r => { const b = r.querySelector('b'), sm = r.querySelector('small'), btn = r.querySelector('.mk-btnsm'); if(!b || !sm) return; const n = b.textContent.trim();
    if(n === 'Bayview Construction Co.'){ sm.textContent = '\u20b114,800 \u00b7 says they paid by GCash'; if(btn){ btn.textContent = 'Confirm'; btn.classList.add('p'); } }
    if(n === 'Cash count, Tuesday' && btn) btn.textContent = 'To check';
    if(/summary$/.test(n)){ sm.textContent = 'ready to download for your accountant'; } });
}
function nf76ShowCopy(){
  const sps = document.querySelectorAll('#mkShow .nf20-sp .f4-spot-t'); if(!sps.length) return false;
  sps.forEach(t => { const h = t.querySelector('h3'); if(!h || t.dataset.r76) return; const c = NF76_SHOW[h.textContent.trim()]; t.dataset.r76 = '1'; t.classList.add('r76-copy'); if(!c) return;
    h.textContent = c[0]; const p = t.querySelector('p'); if(p) p.textContent = c[1];
    const ul = t.querySelector('.m2-ticks'); if(ul) ul.innerHTML = c[2].map(x => `<li>${x}</li>`).join('');
    const o = t.querySelector('.f4-out'), st = NF77_STAT[c[0]]; if(o && st) o.innerHTML = `<b>${st[0]}</b><span>${st[1]}</span>`; });
  try{ nf77ShowArt(); }catch(e){}
  return true;
}
(function(){
  const go = () => { try{ nf72Phone(); }catch(e){} try{ nf72JrInit(); }catch(e){} let n = 0; const tick = () => { let ok = false; try{ ok = nf76ShowCopy(); }catch(e){} if(!ok && n++ < 40) setTimeout(tick, 150); }; tick(); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, {once: true}); else setTimeout(go, 0);
})();
