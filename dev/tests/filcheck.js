// Switches to Filipino, walks every page, and lists English left on screen.
// Usage: node filcheck.js <width> <out.json> [shotsDir]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const W = Number(process.argv[2] || 1280), OUT = process.argv[3] || 'fil.json', SHOTS = process.argv[4];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: {width: W, height: 900}, isMobile: W < 500, hasTouch: W < 500 });
  await ctx.route(/googletagmanager|supabase\.co|fonts\.g|tesseract|xlsx|pdfjs/, r => r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
  await ctx.route(/qrcode-generator/, r => r.fulfill({ path: __dirname + '/node_modules/qrcode-generator/dist/qrcode.js', contentType: 'application/javascript' }));
  const m = await ctx.newPage(); const errs = [];
  m.on('pageerror', e => errs.push(e.message)); m.on('dialog', d => d.dismiss());
  await m.goto('file:///home/user/SadieCutie/Nifti_Sept17.html'); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(800);
  await m.evaluate(() => { try{ localStorage.removeItem('nifti-lang'); }catch(e){} window.open = () => null; window.print = () => {}; setLanguage('FIL'); });
  await m.waitForTimeout(300);
  await m.evaluate(() => {
    window.__left = new Map();
    window.__scan = (where) => {
      const roots = i18nRoots();
      roots.forEach(r => {
        const w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT);
        while(w.nextNode()){
          const n = w.currentNode, p = n.parentElement; if(!p || i18nSkip(p)) continue;
          const st = getComputedStyle(p); if(st.display === 'none' || st.visibility === 'hidden' || !p.getClientRects().length) continue;
          const c = n.nodeValue.trim().replace(/\s+/g, ' '); if(!/[A-Za-z]{3}/.test(c)) continue;
          if(n.__fil === n.nodeValue) continue;
          const k = i18nKey(c).key; if(!/[A-Za-z]{3}/.test(k.replace(/\{\d+\}/g, ''))) continue;
          const e = window.__left.get(k) || {ex: c, where: new Set()}; e.where.add(where); window.__left.set(k, e);
        }
      });
    };
  });
  const pages = [['dashboard'], ['money'], ['expenses'], ['cashcount'], ['profit'], ['sales'], ['inventory'], ['orders', 'supplier'], ['orders', 'buyer'], ['messages'], ['suppliers', 'supplier'], ['suppliers', 'buyer'],
    ['collections', 'supplier'], ['collections', 'buyer'], ['team'], ['settings'], ['store'], ['prices', 'supplier'], ['prices', 'buyer'], ['analytics', 'supplier'], ['analytics', 'buyer'],
    ['discover', 'buyer'], ['discover', 'supplier'], ['cheques', 'supplier'], ['returns', 'supplier'], ['books', 'supplier'], ['taxforms', 'supplier'], ['watchdog'], ['followups'], ['routes'], ['datacenter'], ['issues'], ['close'], ['payroll'], ['ledger']];
  for (const [pg, lens] of pages) {
    await m.evaluate(([pg, lens]) => { if(lens) pickLens(pg, lens); else go(pg); }, [pg, lens]);
    await m.waitForTimeout(250);
    await m.evaluate(w => window.__scan(w), pg + (lens ? ':' + lens : ''));
    if (SHOTS && ['dashboard', 'money', 'expenses', 'cashcount', 'profit', 'sales', 'inventory', 'orders', 'settings'].includes(pg) && lens !== 'buyer') await m.screenshot({ path: `${SHOTS}/fil_${W}_${pg}.png`, fullPage: false });
  }
  await m.evaluate(async () => {
    const sleep = t => new Promise(r => setTimeout(r, t));
    const shot = async (w, f) => { try{ f(); }catch(e){} await sleep(200); window.__scan(w); document.querySelectorAll('.share-modal-backdrop, .sl-modal-bg').forEach(x => x.remove()); };
    go('dashboard');
    await shot('quicksale', () => openQuickSale());
    await shot('expense', () => openExpenseForm());
    for(const k of ['count', 'bad', 'history', 'promised']) await shot('stock-' + k, () => openStockSheet(k));
    for(const po of purchaseOrders.slice(0, 12)){ await shot('order', () => { setLens(sideOfPo(po)); openOrderDetailModal(po.id, sideOfPo(po) === 'supplier'); }); try{ closeOrderDetailModal(); }catch(e){} }
    await shot('create', () => toggleCreateMenu({stopPropagation(){}}));
    await shot('notif', () => toggleNotifications({stopPropagation(){}}));
    await shot('more', () => openMoreSheet());
    for(const t of ['summary','pnl','bs','cash','tb','gl','journal','accounts']){ LGV.tab = t; go('ledger'); await renderLedgerPage(); await sleep(150); window.__scan('ledger-' + t); }
    await shot('manual', () => lgOpenManual());
    await shot('entry', () => lgShowEntry(LG.entries[3].id));
    await shot('payroll-new', () => { go('payroll'); prNew(); });
    await shot('cashmove', () => openCashMove());
    go('expenses'); await sleep(200); window.__scan('expenses2');
    go('cashcount'); await sleep(200); window.__scan('cashcount2');
    go('issues'); await sleep(300); window.__scan('issues2');
    go('close'); await sleep(300); window.__scan('close2');
    go('money'); await sleep(400); window.__scan('money2');
  });
  if (SHOTS) { await m.evaluate(() => { go('dashboard'); openQuickSale(); }); await m.waitForTimeout(300); await m.screenshot({ path: `${SHOTS}/fil_${W}_quicksale.png` }); }
  // switch back: English must come back exactly
  const back = await m.evaluate(async () => { document.querySelectorAll('.share-modal-backdrop, .sl-modal-bg').forEach(x => x.remove()); go('money'); await new Promise(r => setTimeout(r, 200)); setLanguage('EN'); await new Promise(r => setTimeout(r, 200)); return document.querySelector('#page-money h1').textContent + ' | ' + document.querySelector('.lang-switch').textContent.trim(); });
  const left = await m.evaluate(() => [...window.__left.entries()].map(([k, v]) => ({k, ex: v.ex, where: [...v.where].slice(0, 4).join(',')})));
  fs.writeFileSync(OUT, JSON.stringify(left, null, 1));
  console.log('untranslated', left.length, 'back:', back, 'errors', errs.length, errs.slice(0, 5).join(' | '));
  await b.close();
})();
