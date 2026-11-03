// Clicks every button on a page, then every button that appears after it (one level down), and reports
// JS errors and clicks that change nothing. Usage: node crawl.js <role> <page1,page2> [width]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [role, width] = [process.argv[2], Number(process.argv[4] || 390)]; const pages = process.argv[3].split(',');
fs.mkdirSync(__dirname + '/crawl', {recursive: true});
(async () => {
  const b = await chromium.launch(); const out = {};
  for (const pg of pages) {
    let ctx, m; const pageErrs = [];
    const open = async () => {
      if(ctx) await ctx.close();
      ctx = await b.newContext({ viewport:{width, height: 844}, isMobile: width < 500, hasTouch: width < 500 });
      await ctx.route(/googletagmanager|supabase\.co|fonts\.g|jsdelivr\.net\/npm\/(xlsx|pdfjs|tesseract)/, r => r.abort());
      await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
      await ctx.route(/qrcode-generator/, r => r.fulfill({ path: __dirname + '/node_modules/qrcode-generator/dist/qrcode.js', contentType: 'application/javascript' }));
      m = await ctx.newPage(); m.on('pageerror', e => pageErrs.push(e.message)); m.on('dialog', d => d.type() === 'prompt' ? d.accept('5') : d.accept());
      await m.goto('file:///home/user/SadieCutie/Nifti_Sept17.html'); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(800);
    };
    await open();
    let startAt = 0, retryKey = null, topKeys = null, allErrs = [], allClicks = 0, nButtons = 0, guard = 0;
    while(guard++ < 80){
    if(guard > 1) await open();
    const res = await m.evaluate(async ({role, pg, startAt, topKeys, retryKey}) => {
      const sleep = t => new Promise(r => setTimeout(r, t));
      const errs = []; let cur = '';
      window.addEventListener('error', e => errs.push({at: cur, m: e.message}));
      window.addEventListener('unhandledrejection', e => errs.push({at: cur, m: 'promise: ' + (e.reason && e.reason.message || e.reason)}));
      window.alert = () => {}; window.confirm = () => true; window.prompt = () => '5';
      document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href]'); if(a && !/^#/.test(a.getAttribute('href') || '')) e.preventDefault(); }, true);
      const vis = el => { if(!el.isConnected) return false; const r = el.getBoundingClientRect(); if(r.width < 2 || r.height < 2) return false; const st = getComputedStyle(el); return st.visibility !== 'hidden' && st.display !== 'none' && el.closest('.hidden') === null; };
      const SEL = 'button, [onclick], a[href^="#"], a[onclick], .chip, [role=button], .switch, input[type=checkbox], input[type=radio], select';
      const bad = el => { const oc = (el.getAttribute('onclick') || '') + ' ' + (el.textContent || ''); return /logOut|deleteMyAccount|deleteAccount|Log out|signOut/i.test(oc) || el.closest('.bottom-nav, .bnav, nav.top, #sidebar, .sidebar') !== null || el.tagName === 'INPUT' && el.type === 'file'; };
      const sig = el => (el.getAttribute('onclick') || '').slice(0, 80) + '|' + (el.textContent || el.value || '').trim().replace(/\s+/g, ' ').replace(/[₱]?\d[\d,.]*/g, 'N').slice(0, 40);
      const list = root => [...root.querySelectorAll(SEL)].filter(el => vis(el) && !bad(el));
      const reset = async () => {
        document.querySelectorAll('.share-modal-backdrop, #stkSheet, #shareSheet').forEach(x => x.remove());
        document.querySelectorAll('.modal-backdrop:not(.hidden), .modal-overlay:not(.hidden)').forEach(x => x.classList.add('hidden'));
        try{ closeCreateMenu(); }catch(e){} try{ closeMoreSheet(); }catch(e){} try{ closeUserMenu(); }catch(e){}
        document.body.classList.remove('public-order-open', 'modal-open');
        ['publicOrderView', 'statementView'].forEach(id => { const x = document.getElementById(id); if(x) x.remove(); });
        document.body.classList.remove('statement-open');
        if(currentAppRole !== role) switchAppRole(role);
        navigate(pg);
        window.scrollTo(0, 0); await sleep(pg === 'orders' ? 350 : 80);
      };
      window.__fx = 0;
      window.open = () => { window.__fx++; return null; }; window.print = () => { window.__fx++; };
      try{ navigator.share = async () => { window.__fx++; }; navigator.clipboard.writeText = async () => { window.__fx++; }; }catch(e){}
      const _ct = window.showToast; if(typeof _ct === 'function') window.showToast = function(){ window.__fx++; return _ct.apply(this, arguments); };
      const fire = async (el, label) => {
        cur = label; const t = el.tagName;
        let muts = 0; const mo = new MutationObserver(ms => { ms.forEach(x => { if(!(x.type === 'attributes' && x.attributeName === 'data-bc')) muts++; }); });
        mo.observe(document.body, {subtree: true, childList: true, attributes: true, characterData: true});
        const fx0 = window.__fx, y0 = window.scrollY, h0 = location.hash, ae0 = document.activeElement;
        try{ if(t === 'SELECT'){ const o = el.options[Math.min(1, el.options.length - 1)]; if(o){ el.value = o.value; el.dispatchEvent(new Event('change', {bubbles: true})); } } else el.click(); }
        catch(e){ errs.push({at: label, m: 'click threw: ' + e.message}); }
        await sleep(160);
        mo.disconnect();
        const isLink = !!(el.closest('a[href]') && !/^#/.test(el.closest('a[href]').getAttribute('href') || ''));
        const isInput = t === 'SELECT' || t === 'INPUT' || t === 'LABEL' || t === 'TEXTAREA';
        const hasHandler = el.getAttribute('onclick') || el.closest('[onclick]') || t === 'BUTTON' || t === 'A';
        if(!isInput && !isLink && hasHandler && muts === 0 && window.__fx === fx0 && window.scrollY === y0 && location.hash === h0 && document.activeElement === ae0 && !el.closest('form') && !el.disabled)
          errs.push({at: label, m: 'DEAD: click changed nothing', oc: (el.getAttribute('onclick') || (el.closest('[onclick]') || {getAttribute(){return ''}}).getAttribute('onclick') || '').slice(0, 140)});
      };
      switchAppRole(role); await sleep(100); await reset();
      const root = () => document.getElementById('page-' + pg) || document.body;
      let top, keys;
      if(topKeys){ keys = topKeys; top = keys.map(k => k.replace(/#\d+$/, '')); }
      else { top = list(root()).map(sig); const counts = {}; keys = top.map(s => { counts[s] = (counts[s] || 0) + 1; return s + '#' + counts[s]; }); }
      let clicks = 0;
      for(let i = startAt; i < keys.length && clicks < 900; i++){
        await reset();
        const same = list(root()).filter(el => sig(el) === top[i]);
        const n = Number(keys[i].split('#').pop()) - 1; const el = same[n] || same[0];
        if(!el){ if(keys[i] !== retryKey) return {resume: i, keys, clicks, errs}; errs.push({at: keys[i], m: 'NOT REACHABLE after reload'}); continue; }
        document.querySelectorAll('[data-bc]').forEach(x => x.removeAttribute('data-bc')); list(document.body).forEach(x => x.setAttribute('data-bc', '1'));
        await fire(el, keys[i]); clicks++;
        const done = new Set();
        for(let k = 0; k < 30; k++){
          const kids = list(document.body).filter(x => !x.hasAttribute('data-bc') && !done.has(sig(x)));
          if(!kids.length) break;
          const kid = kids[0]; done.add(sig(kid)); kid.setAttribute('data-bc', '1');
          await fire(kid, keys[i] + '  >  ' + sig(kid)); clicks++;
        }
      }
      return {buttons: keys.length, clicks, errs, keys};
    }, {role, pg, startAt, topKeys, retryKey}).catch(e => ({crash: e.message}));
    allErrs = allErrs.concat(res.errs || []); allClicks += res.clicks || 0; if(res.keys){ topKeys = res.keys; nButtons = res.keys.length; }
    if(res.resume !== undefined){ retryKey = topKeys[res.resume]; startAt = res.resume; continue; }
    if(res.crash) allErrs.push({at: 'crash', m: res.crash});
    break;
    }
    const res = {buttons: nButtons, clicks: allClicks, errs: allErrs, pageErrs: [...new Set(pageErrs)].slice(0, 20)};
    out[pg] = res;
    fs.writeFileSync(`${__dirname}/crawl/${role}_${width}_${pages[0]}.json`, JSON.stringify(out, null, 1));
    console.log(role, pg, JSON.stringify({buttons: res.buttons, clicks: res.clicks, errs: res.errs.length, pageErrs: res.pageErrs.length}));
    await ctx.close();
  }
  await b.close();
})();
