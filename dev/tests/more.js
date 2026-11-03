const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const W of [1280, 390]) {
  const ctx = await b.newContext({ viewport: {width: W, height: 900}, isMobile: W < 500, hasTouch: W < 500 });
  await ctx.route(/googletagmanager|supabase\.co|fonts\.g|tesseract|xlsx|pdfjs/, r => r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
  await ctx.route(/qrcode-generator/, r => r.fulfill({ path: __dirname + '/node_modules/qrcode-generator/dist/qrcode.js', contentType: 'application/javascript' }));
  const m = await ctx.newPage(); const errs = [];
  m.on('pageerror', e => errs.push(e.message)); m.on('dialog', d => d.accept());
  await m.goto('file:///home/user/SadieCutie/Nifti_Sept17.html'); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(800);
  const r = await m.evaluate(async () => {
    const out = {}; const sleep = t => new Promise(r => setTimeout(r, t));
    window.print = () => {};
    go('cashcount'); await sleep(200);
    const before = cashExpected(APP_TODAY).cash;
    const monthExp = bkMonthExpenses(bkMonth(APP_TODAY)).total;
    openCashMove(); await sleep(50);
    out.cashMoveTitle = document.querySelector('#exModal .sl-sheet-h b').textContent;
    out.cashMoveCats = [...document.querySelectorAll('#exModal .ex-cats button')].map(b => b.textContent.trim());
    EXF.category = 'Cash to bank'; EXF.amount = '2000'; exRender(); await exSave(); await sleep(50);
    out.bankDelta = before - cashExpected(APP_TODAY).cash;
    out.expUnchanged = bkMonthExpenses(bkMonth(APP_TODAY)).total === monthExp;
    openCashMove(); EXF.category = 'Owner put in cash'; EXF.amount = '500'; exRender(); await exSave();
    out.netDelta = before - cashExpected(APP_TODAY).cash;
    out.breakdown = document.querySelector('.cc-break') ? document.querySelector('.cc-break').textContent.includes('Cash to bank') : 'no-breakdown';
    // menu
    go('profit'); await sleep(150);
    out.menuEmpty = !!document.querySelector('.bk-menu-empty');
    openMenuForm(); MF.name = 'Steel bundle'; MF.price = '600'; MF.recipe = [{item: 'Angle Bars', qty: '2'}, {item: 'Welding Rods 3.2mm', qty: '1'}]; await mfSave(); await sleep(50);
    out.menuRows = [...document.querySelectorAll('#bkProfitBody .bk-list')].some(s => s.textContent.includes('Steel bundle'));
    out.menuCost = bkItemCost('Steel bundle');
    const ab = inventoryData.filter(i => i.name === 'Angle Bars').reduce((a, i) => a + i.onHand, 0);
    const wr = inventoryData.filter(i => i.name === 'Welding Rods 3.2mm').reduce((a, i) => a + i.onHand, 0);
    openQuickSale(); QS.lines = [{product: 'Steel bundle', qty: 3, price: ''}]; qsPick(0, 'Steel bundle'); QS.received = '2000'; await qsSave(); await sleep(50);
    const sale = BK.sales[0];
    out.salePrice = sale.lines[0].unitPrice; out.saleCost = sale.lines[0].unitCost; out.saleMenu = sale.lines[0].menu;
    out.abDelta = ab - inventoryData.filter(i => i.name === 'Angle Bars').reduce((a, i) => a + i.onHand, 0);
    out.wrDelta = wr - inventoryData.filter(i => i.name === 'Welding Rods 3.2mm').reduce((a, i) => a + i.onHand, 0);
    out.trail = BK.moves.slice(0, 2).map(x => x.item + ' ' + x.qty + ' ' + x.reason);
    out.snack = !!document.getElementById('bkSnack');
    bkReceipt(sale.id); await sleep(50);
    out.receipt = document.querySelector('#bkRcpt .rc') ? document.querySelector('#bkRcpt .rc').innerText.replace(/\n+/g, ' | ').slice(0, 260) : null;
    bkPrintReceipt(sale.id); await sleep(400);
    out.printFrame = !!document.querySelector('.rc-frame');
    slClose('bkRcpt');
    // void returns ingredients
    await bkVoidSale(sale.id);
    out.abAfterVoid = ab - inventoryData.filter(i => i.name === 'Angle Bars').reduce((a, i) => a + i.onHand, 0);
    // vale
    go('expenses'); await sleep(150);
    out.vale = [...document.querySelectorAll('#bkExpBody h2')].map(h => h.textContent).includes('Vale this month');
    // offline sale on a "real" account
    const savedBiz = myBusiness, savedFrom = sb.from;
    myBusiness = {id: 'test-biz', name: 'Test'}; isOffline = true;
    openQuickSale(); QS.lines = [{product: 'Angle Bars', qty: 1, price: '85'}]; await qsSave();
    out.offPending = !!BK.sales[0].pending; out.queue = bkQueue().length;
    go('sales'); await sleep(100); out.pendingTag = !!document.querySelector('#bkSalesBody .pending-sync-tag');
    let upserted = null;
    sb.from = t => ({upsert: async (row) => { upserted = t + ':' + row.id; return {error: null}; }});
    isOffline = false; await bkFlushQueue();
    out.flushed = !!upserted && bkQueue().length === 0 && !BK.sales[0].pending;
    sb.from = savedFrom; myBusiness = savedBiz; isOffline = false;
    try{ localStorage.removeItem('nifti-books-queue-test-biz'); }catch(e){}
    document.querySelectorAll('.share-modal-backdrop,#bkSnack').forEach(x => x.remove());
    return out;
  });
  console.log(W, JSON.stringify(r, null, 1));
  if (W === 390) { await m.evaluate(() => { go('profit'); openMenuForm(BK.menu[0].id); }); await m.waitForTimeout(200); await m.screenshot({path: '../shots/menu_390.png'});
    await m.evaluate(() => { slClose('mfModal'); bkReceipt(BK.sales.find(s => !s.voidedAt).id); }); await m.waitForTimeout(200); await m.screenshot({path: '../shots/receipt_390.png'});
    await m.evaluate(() => { slClose('bkRcpt'); openCashMove(); EXF.category = 'Cash to bank'; exRender(); }); await m.waitForTimeout(200); await m.screenshot({path: '../shots/cashmove_390.png'}); }
  console.log('errors', errs.length, errs.slice(0, 5).join(' | '));
  await ctx.close();
  }
  await b.close();
})();
