// Collects every English phrase the dashboard can show (as i18n templates), for the Filipino dictionary.
// Usage: node collect.js <width> <out.json> [pages]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const W = Number(process.argv[2] || 1280), OUT = process.argv[3] || 'keys.json';
const ONLY = process.argv[4] ? process.argv[4].split(',') : null;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: {width: W, height: 900}, isMobile: W < 500, hasTouch: W < 500 });
  await ctx.route(/googletagmanager|supabase\.co|fonts\.g|tesseract|xlsx|pdfjs/, r => r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
  await ctx.route(/qrcode-generator/, r => r.fulfill({ path: __dirname + '/node_modules/qrcode-generator/dist/qrcode.js', contentType: 'application/javascript' }));
  const m = await ctx.newPage(); const errs = [];
  m.on('pageerror', e => errs.push(e.message)); m.on('dialog', d => d.type() === 'prompt' ? d.accept('Test reason') : d.accept());
  await m.goto('file:///home/user/SadieCutie/Nifti_Sept17.html'); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(800);
  await m.evaluate(() => {
    window.__keys = new Map();
    window.__collect = () => {
      i18nRefreshNames();
      const add = (s, where) => { const c = String(s || '').trim().replace(/\s+/g, ' '); if(!c || !/[A-Za-z]{2}/.test(c) || c.length > 400) return; const k = i18nKey(c).key; if(!window.__keys.has(k)) window.__keys.set(k, {ex: c, where}); };
      const roots = i18nRoots();
      roots.forEach(r => {
        const w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        while(w.nextNode()){
          const n = w.currentNode;
          if(n.nodeType === 3){ const p = n.parentElement; if(!p || i18nSkip(p)) continue; const st = getComputedStyle(p); if(st.display === 'none' || st.visibility === 'hidden') continue; add(n.nodeValue, (document.querySelector('.app-page.active') || {}).id); }
          else { if(i18nSkip(n)) continue; I18N_ATTRS.forEach(a => { if(n.hasAttribute(a)) add(n.getAttribute(a), 'attr'); }); }
        }
      });
    };
    const _toast = window.showToast; window.showToast = function(msg){ try{ const c = String(msg || '').trim(); if(c) window.__keys.set(i18nKey(c).key, {ex: c, where: 'toast'}); }catch(e){} return _toast.apply(this, arguments); };
    ['confirm', 'prompt', 'alert'].forEach(f => { const base = window[f]; window[f] = function(msg){ try{ const c = String(msg || '').trim(); if(c) window.__keys.set(i18nKey(c).key, {ex: c, where: 'dialog'}); }catch(e){} return f === 'confirm' ? true : f === 'prompt' ? 'Test reason' : undefined; }; });
    window.open = () => null; window.print = () => {};
  });
  const pages = [['dashboard'], ['money'], ['expenses'], ['cashcount'], ['profit'], ['sales'], ['inventory'], ['orders', 'supplier'], ['orders', 'buyer'], ['messages'], ['suppliers', 'supplier'], ['suppliers', 'buyer'],
    ['collections', 'supplier'], ['collections', 'buyer'], ['team'], ['settings'], ['store'], ['prices', 'supplier'], ['prices', 'buyer'], ['analytics', 'supplier'], ['analytics', 'buyer'],
    ['discover', 'buyer'], ['discover', 'supplier'], ['cheques', 'supplier'], ['cheques', 'buyer'], ['returns', 'supplier'], ['returns', 'buyer'], ['books', 'supplier'], ['books', 'buyer'],
    ['taxforms', 'supplier'], ['taxforms', 'buyer'], ['watchdog'], ['followups'], ['routes'], ['invite', 'supplier'], ['invite', 'buyer'], ['datacenter'], ['status']];
  for (const [pg, lens] of pages) {
    if (ONLY && !ONLY.includes(pg)) continue;
    // one level of clicking: every visible button on the page, then whatever it opened
    const n = await m.evaluate(async ([pg, lens]) => {
      const sleep = t => new Promise(r => setTimeout(r, t));
      const reset = async () => {
        document.querySelectorAll('.share-modal-backdrop, #stkSheet, #shareSheet, [id$="Modal"].sl-modal-bg, .sl-modal-bg').forEach(x => { if(x.id !== 'helpCenterModal') x.remove(); });
        document.querySelectorAll('.modal-backdrop:not(.hidden), .modal-overlay:not(.hidden)').forEach(x => x.classList.add('hidden'));
        try{ closeCreateMenu(); closeMoreSheet(); closeUserMenu(); }catch(e){}
        ['publicOrderView', 'statementView'].forEach(id => { const x = document.getElementById(id); if(x) x.remove(); });
        document.body.classList.remove('public-order-open', 'modal-open', 'statement-open');
        if(lens) pickLens(pg, lens); else go(pg);
        await sleep(60);
      };
      await reset(); window.__collect();
      const vis = el => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && getComputedStyle(el).visibility !== 'hidden'; };
      const SEL = 'button, [onclick], .chip, [role=button], .switch, select';
      const bad = el => /logOut|deleteMyAccount|deleteAccount|Log out|signOut|setLanguage|toggleLanguage/i.test((el.getAttribute('onclick') || '') + el.textContent) || el.closest('.sidebar, .bottom-nav, nav.top') || (el.tagName === 'INPUT' && el.type === 'file');
      const root = document.getElementById('page-' + pg);
      const top = [...root.querySelectorAll(SEL)].filter(el => vis(el) && !bad(el));
      const sig = el => (el.getAttribute('onclick') || '') + '|' + el.textContent.trim().slice(0, 30);
      const sigs = [...new Set(top.map(sig))].slice(0, 70);
      let clicks = 0;
      for(const s of sigs){
        await reset();
        const el = [...root.querySelectorAll(SEL)].find(x => sig(x) === s && vis(x) && !bad(x)); if(!el) continue;
        try{ if(el.tagName === 'SELECT'){ const o = el.options[Math.min(1, el.options.length - 1)]; if(o){ el.value = o.value; el.dispatchEvent(new Event('change', {bubbles: true})); } } else el.click(); }catch(e){}
        clicks++; await sleep(120); window.__collect();
        // one more level inside anything that opened
        const opened = [...document.querySelectorAll('.share-modal-backdrop button, .sl-modal-bg button, [id$="Modal"]:not(.hidden) button')].filter(vis).slice(0, 12);
        for(const k of opened){ if(bad(k) || /close|✕|cancel/i.test(k.textContent)) continue; try{ k.click(); }catch(e){} await sleep(80); window.__collect(); }
      }
      return clicks;
    }, [pg, lens]).catch(e => 'crash ' + e.message);
    console.log(pg, lens || '', n, await m.evaluate(() => window.__keys.size));
  }
  // explicit pop-ups
  await m.evaluate(async () => {
    const sleep = t => new Promise(r => setTimeout(r, t));
    const shot = async f => { try{ f(); }catch(e){} await sleep(150); window.__collect(); document.querySelectorAll('.share-modal-backdrop, .sl-modal-bg').forEach(x => x.remove()); };
    go('dashboard');
    await shot(() => openQuickSale()); QS = null;
    await shot(() => { openQuickSale(); QS.mode = 'total'; QS.paidWith = 'credit'; qsRender(); });
    await shot(() => { openQuickSale(); qsSave(); });
    await shot(() => openExpenseForm());
    for(const c of BK_CATS.slice(0, 18)) await shot(() => { openExpenseForm(); EXF.category = c.k; exRender(); });
    await shot(() => { openExpenseForm(); exSave(); });
    for(const k of ['count', 'bad', 'history', 'promised']) await shot(() => openStockSheet(k));
    await shot(() => { openStockSheet('count'); STK.done = 'x'; stkRender(); });
    await shot(() => openOpeningBalances());
    await shot(() => { setLens('buyer'); openCreatePOModal(); });
    await shot(() => { setLens('supplier'); openCustomerPoImport(); });
    await shot(() => { setLens('supplier'); openCustomerPoImport({tentative: true}); });
    await shot(() => { setLens('buyer'); openPasteOrderModal(); });
    for(const po of purchaseOrders.slice(0, 40)){ await shot(() => { setLens(sideOfPo(po)); openOrderDetailModal(po.id, sideOfPo(po) === 'supplier'); }); try{ closeOrderDetailModal(); }catch(e){} }
    await shot(() => { const e = {stopPropagation(){}}; toggleCreateMenu(e); });
    await shot(() => { const e = {stopPropagation(){}}; toggleNotifications(e); });
    await shot(() => { const e = {stopPropagation(){}}; toggleUserMenu(e); });
    await shot(() => openHelpCenter());
    await shot(() => openMoreSheet());
    for(const d of [0, 1, 2]){ await shot(() => { go('cashcount'); ccStart(addDaysIso(APP_TODAY, -d)); renderCashCountPage(); }); }
  });
  // every page's static content too, even what isn't on screen right now (settings cards, closed pop-ups)
  await m.evaluate(() => {
    go('settings'); i18nRefreshNames();
    const add = (s, where) => { const c = String(s || '').trim().replace(/\s+/g, ' '); if(!c || !/[A-Za-z]{2}/.test(c) || c.length > 400) return; const k = i18nKey(c).key; if(!window.__keys.has(k)) window.__keys.set(k, {ex: c, where}); };
    const w = document.createTreeWalker(document.getElementById('view-app'), NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while(w.nextNode()){ const n = w.currentNode; const p = n.nodeType === 3 ? n.parentElement : n; if(!p || i18nSkip(p) || p.closest('.old-home')) continue;
      if(n.nodeType === 3) add(n.nodeValue, 'static'); else I18N_ATTRS.forEach(a => { if(n.hasAttribute(a)) add(n.getAttribute(a), 'attr'); }); }
    document.querySelectorAll('body > div[id$="Modal"], body > div.hidden').forEach(r => { const w2 = document.createTreeWalker(r, NodeFilter.SHOW_TEXT); while(w2.nextNode()){ const p = w2.currentNode.parentElement; if(p && !i18nSkip(p)) add(w2.currentNode.nodeValue, 'static-modal'); } });
  });
  const keys = await m.evaluate(() => [...window.__keys.entries()].map(([k, v]) => ({k, ex: v.ex, where: v.where})));
  fs.writeFileSync(OUT, JSON.stringify(keys, null, 0));
  console.log('keys', keys.length, 'errors', errs.length, errs.slice(0, 5).join(' | '));
  await b.close();
})();
