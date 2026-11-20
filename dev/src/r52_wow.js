/* ===== Round 52: landing WOW pieces ===== */
function mk52Start(){ navigate('login'); try{ nf20ToSignup(); }catch(e){} }
// the sample shop's items (same names and prices as the demo)
const MK52_ITEMS = [
  {name: 'Portland Cement 40kg', price: 228, unit: 'bag', words: ['semento', 'cement', 'simento', 'portland']},
  {name: 'Steel Rebar 12mm', price: 65, unit: 'pc', words: ['rebar', 'bakal', 'varilla', 'bareta']},
  {name: 'Galvanized Wire 12ga', price: 850, unit: 'roll', words: ['wire', 'alambre', 'kawad']},
  {name: 'Angle Bars', price: 85, unit: 'pc', words: ['angle', 'anggulo']},
  {name: 'Welding Rods 3.2mm', price: 120, unit: 'box', words: ['welding rod', 'rod', 'rods', 'electrode']},
  {name: 'Structural I-Beams', price: 2850, unit: 'length', words: ['i-beam', 'ibeam', 'i beam', 'beam']},
  {name: 'Welding Plates 6mm', price: 480, unit: 'pc', words: ['plate', 'plates', 'plaka']}
];
const MK52_NUM = {isa: 1, isang: 1, dalawa: 2, dalawang: 2, tatlo: 3, tatlong: 3, apat: 4, lima: 5, limang: 5, anim: 6, pito: 7, walo: 8, siyam: 9, sampu: 10, sampung: 10, bente: 20, trenta: 30, kwarenta: 40, singkwenta: 50, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10, twenty: 20, fifty: 50};
function mk52Peso(n){ return '₱' + Math.round(n).toLocaleString('en-PH'); }
function mk52Esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]); }
// uses the SAME order reader as the app (nfwParse + nfwMatch): only items it can tell are filled in; anything else is asked, never guessed
function mk52Parse(msg){
  const text = String(msg || ''), lines = [], ask = [], seen = {};
  const cands = MK52_ITEMS.map(it => ({product: it.name, it}));
  let rows = [];
  try { rows = nfwParse(text).rows; } catch(e) { rows = []; }
  rows.forEach(r => {
    let m = {product: ''}; try { m = nfwMatch(r.name || '', cands); } catch(e){}
    if(!m.product){ // try the sample shop's own Taglish words too
      const low = ' ' + String(r.raw || r.name || '').toLowerCase() + ' ';
      const it = MK52_ITEMS.find(x => x.words.some(w => low.includes(' ' + w)));
      if(it) m = {product: it.name};
    }
    const it = m.product ? MK52_ITEMS.find(x => x.name === m.product) : null;
    if(it){ if(seen[it.name]) return; seen[it.name] = 1; lines.push({item: it, q: r.qty || 1, guessed: !r.qty}); return; }
    const words = String(r.name || '').toLowerCase().replace(/[^a-zñ0-9\s-]/g, ' ').split(/\s+/).filter(w => w && !(typeof NFW_FILL !== 'undefined' && NFW_FILL.has(w)));
    if(!words.length) return;
    const nm = words.join(' ');
    ask.push({name: nm.charAt(0).toUpperCase() + nm.slice(1), q: r.qty, unit: r.unit});
  });
  let when = ''; const t = text.toLowerCase();
  if(/bukas|tomorrow/.test(t)) when = 'Deliver tomorrow';
  else if(/pick ?up|pickup|kunin|mamaya|later/.test(t)) when = 'Pick up today';
  else if(/monday|lunes/.test(t)) when = 'Deliver Monday';
  else if(/deliver|hatid/.test(t)) when = 'Deliver';
  return {lines, ask, when};
}
function mk52Try(){
  const out = document.getElementById('mkTryOut'), msg = (document.getElementById('mkTryIn') || {}).value || ''; if(!out) return;
  out.innerHTML = '<div class="mk-try-reading"><i></i>Nifti is reading the message…</div>';
  clearTimeout(mk52Try.t);
  mk52Try.t = setTimeout(() => {
    const r = mk52Parse(msg);
    if(!r.lines.length && !r.ask.length){ out.innerHTML = '<div class="mk-try-order"><div class="mk-try-oh"><span class="spark">✦</span><b>Nifti needs a little help</b></div><p class="mk-try-note">Add what they want and how many, like “10 sako semento, 5 wire”. In your own shop Nifti knows all your items.</p></div>'; return; }
    const total = r.lines.reduce((a, l) => a + l.q * l.item.price, 0), ask = r.ask.length;
    const no = 1044 + Math.floor(Math.random() * 40);
    out.innerHTML = `<div class="mk-try-order"><div class="mk-try-oh"><span class="spark">✦</span><b>Order #${no} <span>· Bayview Construction</span></b><small>${r.lines.length + r.ask.length} item${r.lines.length + r.ask.length === 1 ? '' : 's'}</small></div>
      ${r.lines.map((l, i) => `<div class="mk-try-row${l.guessed ? ' q' : ''}" style="animation-delay:${.08 * i}s"><span>${mk52Esc(l.item.name)} × ${l.q}${l.guessed ? ' (check the qty)' : ''}</span><b>${mk52Peso(l.q * l.item.price)}</b></div>`).join('')}
      ${r.ask.map(a => `<div class="mk-try-row q"><span>${mk52Esc(a.name)}${a.q ? ' × ' + a.q + (a.unit ? ' ' + a.unit : '') : ''}</span><b><i class="mk-try-ask">Not on your list yet</i></b></div>`).join('')}
      ${r.lines.length ? '<div class="mk-try-tot"><span>Total</span><b id="mkTryTot">₱0</b></div>' : ''}
      ${r.when ? `<p class="mk-try-note">🚚 ${mk52Esc(r.when)} · prices from your price list</p>` : '<p class="mk-try-note">Prices from your price list</p>'}
      ${ask ? `<p class="mk-try-note mk-try-new">✦ ${ask === 1 ? 'That item isn’t' : 'Those items aren’t'} on this sample shop’s list. In your shop Nifti matches your own items, and asks you about anything new once, then remembers it.</p>` : ''}</div>`;
    // count the total up
    const el = document.getElementById('mkTryTot'), t0 = performance.now(), dur = 700;
    const step = now => { const k = Math.min(1, (now - t0) / dur); if(el) el.textContent = mk52Peso(total * (1 - Math.pow(1 - k, 3))); if(k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    setTimeout(() => { if(!out.querySelector('.mk-try-order')) return;
      out.insertAdjacentHTML('beforeend', `<div class="mk-try-send"><span class="ok">✓</span><div><b>${out.querySelector('.mk-try-ask') ? 'You pick the item once, then it goes to Bayview' : 'Sent to Bayview for their OK'}</b><small>They tap a link on Viber. No app, no sign-up.</small></div><a onclick="mk52Start()">Do this for real →</a></div>`); }, 900);
  }, 650);
}
// the real app, playing on a phone
const MK52_CAPS = ['Orders arrive from Viber', 'Every order in one list', "Your driver's day, stop by stop", 'Who owes you, and reminders', 'Your whole day at a glance'];
const MK52 = {i: 0, t: null, io: null};
function mk52Loop(){
  clearInterval(MK52.t);
  const imgs = document.querySelectorAll('#mkTry .mk-loop-screen img'); if(!imgs.length) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  MK52.t = setInterval(() => {
    const v = document.getElementById('view-index'); if(!v || v.classList.contains('hidden') || document.hidden) return;
    MK52.i = (MK52.i + 1) % imgs.length;
    imgs.forEach((im, k) => im.classList.toggle('on', k === MK52.i));
    document.querySelectorAll('#mkLoopDots i').forEach((d, k) => d.classList.toggle('on', k === MK52.i));
    const c = document.getElementById('mkLoopCap'); if(c) c.textContent = MK52_CAPS[MK52.i] || '';
  }, 2800);
}
// notebook before / after
function mk52Ba(v){
  v = Math.max(0, Math.min(100, Number(v)));
  const app = document.getElementById('mkBaApp'), h = document.getElementById('mkBaHandle');
  if(app) app.style.clipPath = `inset(0 0 0 ${v}%)`; if(h) h.style.left = v + '%';
}
// time back
function mk52Calc(){
  const g = id => Number((document.getElementById(id) || {}).value || 0);
  const a = g('mkC1'), b = g('mkC2'), c = g('mkC3');
  const h1 = a * 26 * 3 / 60, h2 = b * 4.3 * 8 / 60, h3 = c * 4.3 * 0.6, tot = h1 + h2 + h3;
  const set = (id, txt) => { const e = document.getElementById(id); if(e) e.textContent = txt; };
  set('mkCv1', a); set('mkCv2', b); set('mkCv3', c);
  set('mkCtot', Math.round(tot)); const days = tot / 8;
  set('mkCdays', days >= 1 ? `That's about ${days < 10 ? days.toFixed(1).replace(/\.0$/, '') : Math.round(days)} full working day${Math.round(days) === 1 ? '' : 's'}, every month.` : 'Every hour counts.');
  const mx = Math.max(h1, h2, h3, 1);
  [[h1, 'mkCb1', 'mkCh1'], [h2, 'mkCb2', 'mkCh2'], [h3, 'mkCb3', 'mkCh3']].forEach(([h, bar, lab]) => { const e = document.getElementById(bar); if(e) e.style.width = (h / mx * 100) + '%'; set(lab, Math.round(h) + ' h'); });
}
// phone bar: after the hero, until the last call to action
function mk52Sticky(){
  const bar = document.getElementById('mkSticky'), hero = document.querySelector('#view-index .f4-hero'), cta = document.querySelector('#view-index .cta-band'); if(!bar || !hero) return;
  const v = document.getElementById('view-index');
  const show = v && !v.classList.contains('hidden') && hero.getBoundingClientRect().bottom < 0 && !(cta && cta.getBoundingClientRect().top < window.innerHeight);
  bar.classList.toggle('on', !!show);
}
(function(){
  // bigger buttons that open "Create account" for Start free
  document.querySelectorAll('#view-index .f4-hero-cta .btn, #view-index .cta-band .btn').forEach(b => { b.classList.add('mk-big'); if(/Start free/.test(b.textContent)) b.setAttribute('onclick', 'mk52Start()'); });
  const go = document.getElementById('mkTryGo'); if(go) go.addEventListener('click', mk52Try);
  document.querySelectorAll('[data-mk-sample]').forEach(b => b.addEventListener('click', () => { const t = document.getElementById('mkTryIn'); if(t){ t.value = b.getAttribute('data-mk-sample'); } mk52Try(); }));
  const ta = document.getElementById('mkTryIn'); if(ta) ta.addEventListener('keydown', e => { if(e.key === 'Enter' && (e.metaKey || e.ctrlKey)){ e.preventDefault(); mk52Try(); } });
  const r = document.getElementById('mkBaRange'); if(r){ r.addEventListener('input', () => mk52Ba(r.value)); mk52Ba(r.value); }
  ['mkC1', 'mkC2', 'mkC3'].forEach(id => { const e = document.getElementById(id); if(e) e.addEventListener('input', mk52Calc); }); mk52Calc();
  window.addEventListener('scroll', mk52Sticky, {passive: true}); window.addEventListener('resize', mk52Sticky);
  mk52Loop();
  // the slider moves itself once when it first comes into view, so people see it can be dragged
  const ba = document.getElementById('mkBa');
  if(ba && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    const io = new IntersectionObserver(es => es.forEach(e => { if(!e.isIntersecting) return; io.disconnect(); let t0 = null; const r2 = document.getElementById('mkBaRange');
      const anim = now => { if(t0 === null) t0 = now; const k = (now - t0) / 1600; const v = k < 1 ? 50 + 32 * Math.sin(k * Math.PI * 2) : 50; mk52Ba(v); if(r2) r2.value = v; if(k < 1) requestAnimationFrame(anim); }; requestAnimationFrame(anim); }), {threshold: .5});
    io.observe(ba);
  }
  // show the Try it result straight away so the box never looks empty
  
})();
