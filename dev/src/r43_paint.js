/* ---------- 1. Paint once per click ----------
   Pages are drawn by a base renderer and then finished by later passes (plain words, sizes, extra sections) that were
   scheduled with short timers. Each timer painted a half-finished page, so words changed, text vanished and sizes jumped.
   While a click, change or back/forward is being handled, short timers are collected and run right away, in order, in
   the same task. The browser then paints only the finished page. Long timers (toasts, polling) are left alone. */
const NF43P = {on: false, q: [], seq: 0, now: 0, per: new Map(), rt: window.setTimeout.bind(window), rc: window.clearTimeout.bind(window), max: 800, runs: 0};
window.NF43P = NF43P;
(function(){
  if(window.__nf43Paint) return; window.__nf43Paint = true;
  const realST = NF43P.rt, realCT = NF43P.rc;
  window.setTimeout = function(fn, d){
    const ms = Math.max(0, Number(d) || 0);
    if(NF43P.on && typeof fn === 'function' && ms <= NF43P.max){
      const id = 'nf43_' + (++NF43P.seq);
      NF43P.q.push({id, fn, args: Array.prototype.slice.call(arguments, 2), at: NF43P.now + ms, seq: NF43P.seq});
      return id;
    }
    return realST.apply(window, arguments);
  };
  window.clearTimeout = function(id){
    if(typeof id === 'string' && id.indexOf('nf43_') === 0){ NF43P.q = NF43P.q.filter(x => x.id !== id); return; }
    return realCT(id);
  };
  // Run the collected timers in the order the clock would have run them, then give observers a few microtask turns
  // to react; repeat until nothing new arrives. It all happens in microtasks, so the browser cannot paint in between.
  function runQueue(){
    let n = 0;
    while(NF43P.q.length && n < 150){
      NF43P.q.sort((a, b) => a.at - b.at || a.seq - b.seq);
      const t = NF43P.q.shift(); NF43P.now = t.at; n++; NF43P.runs++;
      const c = (NF43P.per.get(t.fn) || 0) + 1; NF43P.per.set(t.fn, c);
      // a timer that keeps re-arming itself (a poll) goes back to the real clock
      if(c > 6){ (NF43P.def = NF43P.def || []).push((t.fn.name || String(t.fn).slice(0, 60)) + ' x' + c); realST(() => { try{ t.fn.apply(window, t.args); }catch(e){ console.warn(e); } }, 50); continue; }
      try{ t.fn.apply(window, t.args); }catch(e){ console.warn('nf43 timer', e); }
    }
    return n;
  }
  function step(idle){
    if(!NF43P.on) return;
    const n = runQueue();
    if(NF43P.runs > 400){ (NF43P.def = NF43P.def || []).push('CAP ' + NF43P.q.length + ' left'); finish(); return; }
    idle = n ? 0 : idle + 1;
    if(idle >= 3) finish(); else Promise.resolve().then(() => step(idle));
  }
  function finish(){
    // menu counts show or hide in the same paint as the page, not on the next sweep
    try{ if(typeof nf37Sweep === 'function') nf37Sweep(); }catch(e){}
    NF43P.on = false; NF43P.runs = 0; NF43P.per = new Map();
    const base = NF43P.now, left = NF43P.q; NF43P.q = []; NF43P.now = 0;
    left.forEach(t => realST(() => { try{ t.fn.apply(window, t.args); }catch(e){ console.warn(e); } }, Math.max(0, t.at - base)));
  }
  function start(){ if(NF43P.on) return; NF43P.on = true; NF43P.runs = 0; NF43P.now = 0; NF43P.per = new Map(); Promise.resolve().then(() => step(0)); }
  NF43P.start = start;
  ['click', 'change', 'submit', 'popstate', 'hashchange'].forEach(ev => window.addEventListener(ev, start, true));
  // Any redraw starts the same guard the moment it begins, so timers it sets up are caught too
  // (redraws also come from background sweeps and observers, not only from clicks).
  const hook = (proto, prop) => { const d = Object.getOwnPropertyDescriptor(proto, prop); if(!d || !d.set) return;
    Object.defineProperty(proto, prop, {configurable: true, enumerable: d.enumerable, get: d.get, set(v){ if(!NF43P.on && this.isConnected) start(); return d.set.call(this, v); }}); };
  hook(Element.prototype, 'innerHTML'); hook(Element.prototype, 'outerHTML');
  const iah = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function(){ if(!NF43P.on && this.isConnected) start(); return iah.apply(this, arguments); };
  // Passes that run from animation frames or page observers open the same guard, so the timers they set run before paint
  // A pass asked for "next frame" while this frame's passes are still running would show the page half-done for one
  // frame. Those requests run right away in this frame instead (once per function, so animation loops still wait).
  const rAF = window.requestAnimationFrame.bind(window), cAF = window.cancelAnimationFrame.bind(window);
  let stage = false, stageRan = new Set(), fake = 0; const dead = new Set();
  window.requestAnimationFrame = function(cb){
    if(stage && typeof cb === 'function' && !stageRan.has(cb)){
      stageRan.add(cb); const id = -(++fake);
      Promise.resolve().then(() => { if(dead.has(id)) return; start(); try{ cb(performance.now()); }catch(e){ console.warn(e); } });
      return id;
    }
    return rAF(function(t){
      if(!stage){ stage = true; realST(() => { stage = false; stageRan = new Set(); dead.clear(); }, 0); }
      stageRan.add(cb); start(); return cb(t);
    });
  };
  window.cancelAnimationFrame = function(id){ if(id < 0){ dead.add(id); return; } return cAF(id); };
  const RealMO = window.MutationObserver;
  window.MutationObserver = function(cb){ return new RealMO(function(recs, obs){ start(); return cb.call(this, recs, obs); }); };
  window.MutationObserver.prototype = RealMO.prototype;
  // Writes that change nothing are skipped. Several passes re-set the same class or the same text on every run; each
  // such write still woke the page observers, which ran the passes again, forever (about 10 times a second).
  const TL = DOMTokenList.prototype, tAdd = TL.add, tRem = TL.remove, tTog = TL.toggle;
  TL.add = function(){ for(let i = 0; i < arguments.length; i++){ if(!this.contains(arguments[i])) return tAdd.apply(this, arguments); } };
  TL.remove = function(){ for(let i = 0; i < arguments.length; i++){ if(this.contains(arguments[i])) return tRem.apply(this, arguments); } };
  TL.toggle = function(tok, force){ if(force !== undefined){ const has = this.contains(tok); if(!!force === has) return has; } return tTog.apply(this, arguments); };
  const sA = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(n, v){ if(this.getAttribute(n) === String(v)) return; return sA.call(this, n, v); };
  const cn = Object.getOwnPropertyDescriptor(Element.prototype, 'className');
  Object.defineProperty(Element.prototype, 'className', {configurable: true, enumerable: cn.enumerable, get: cn.get, set(v){ if(cn.get.call(this) === String(v)) return; return cn.set.call(this, v); }});
  const tc = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  Object.defineProperty(Node.prototype, 'textContent', {configurable: true, enumerable: tc.enumerable, get: tc.get, set(v){
    const sv = v == null ? '' : String(v);
    if(this.nodeType === 1){ const c = this.childNodes; if((c.length === 1 && c[0].nodeType === 3 && c[0].data === sv) || (c.length === 0 && sv === '')) return; }
    else if(this.nodeType === 3 && this.data === sv) return;
    return tc.set.call(this, v); }});
  function wrapNav(){
    const nav = window.navigate;
    if(typeof nav !== 'function' || nav._nf43) return;
    // Some finishing passes only worked because the old endless loop re-ran them. After a page switch the page is
    // nudged twice more inside the same paint, so those passes get their second run before anything shows.
    const poke = () => { const pg = [...document.querySelectorAll('[id^="page-"]')].find(e => e.classList.contains('active')) || document.getElementById('view-app'); if(!pg) return; const c = document.createComment('nf43'); pg.appendChild(c); c.remove(); };
    const w = function(){ start(); const out = nav.apply(this, arguments);
      [850, 1700].forEach(ms => NF43P.q.push({id: 'nf43_' + (++NF43P.seq), fn: poke, args: [], at: NF43P.now + ms, seq: NF43P.seq}));
      return out; };
    Object.keys(nav).forEach(k => { w[k] = nav[k]; }); w._nf43 = true;
    window.navigate = w; try{ navigate = w; }catch(e){}
  }
  wrapNav(); window.addEventListener('load', () => { wrapNav(); realST(wrapNav, 1500); realST(wrapNav, 4000); });
})();
