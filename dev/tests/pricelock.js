// Price lock, discounts per cashier, receipt after every sale (demo mode). Screenshots in shots/.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const FILE = 'file://' + require('path').resolve(__dirname, '../../Nifti_Sept17.html');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: {width: 420, height: 900} });
  await ctx.route(/googletagmanager|supabase\.co|fonts\.g|tesseract/, r => r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
  await ctx.route(/qrcode-generator/, r => r.fulfill({ path: __dirname + '/node_modules/qrcode-generator/dist/qrcode.js', contentType: 'application/javascript' }));
  const m = await ctx.newPage(); const errs = []; let fails = 0;
  m.on('pageerror', e => errs.push(e.message)); m.on('dialog', d => d.accept());
  const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if(!c) fails++; };
  await m.goto(FILE); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(800);
  await m.evaluate(async () => { go('sales'); await bkLoad(); });
  const item = 'Angle Bars';
  const list = await m.evaluate(n => bkItemPrice(n), item);
  console.log('list price', list, 'cfg', JSON.stringify(await m.evaluate(() => plCfg())));
  // cashier view
  await m.evaluate(() => { previewRole = 'Cashier'; });
  ok(await m.evaluate(() => plApplies()), 'lock applies to a cashier');
  const sell = async (price) => m.evaluate(([item, price]) => { openQuickSale(); QS.lines[0] = {product: item, qty: 2, price: String(price)}; qsRender(); return qsSave(); }, [item, price]);
  const before = await m.evaluate(() => BK.sales.length);
  await sell(Math.round(list * 0.85));
  ok(await m.evaluate(() => !!document.querySelector('#qsModal .pl-box')) && await m.evaluate(() => BK.sales.length) === before, '15% off is blocked and asks for the owner');
  ok(await m.evaluate(() => !document.querySelector('#qsModal .bk-seg')), '"Just the total" hidden for staff');
  await m.screenshot({path: __dirname + '/shots/1_blocked.png'});
  await m.evaluate(() => plAsk()); await m.waitForTimeout(100);
  ok(await m.evaluate(() => QS.ask.state === 'waiting'), 'request is waiting');
  await m.screenshot({path: __dirname + '/shots/2_waiting.png'});
  await m.evaluate(() => plDemoApprove());
  await m.evaluate(() => qsSave()); await m.waitForTimeout(200);
  ok(await m.evaluate(() => BK.sales.length) === before + 1, 'saved after the OK');
  ok(await m.evaluate(() => !document.getElementById('bkRcpt')), 'no receipt pops up after the sale (removed in Round 13)');
  await m.evaluate(() => { const n = BK.sales.reduce((a, x) => String(x.at || '') > String(a.at || '') ? x : a); bkReceipt(n.id); }); await m.waitForTimeout(300);
  const rc = await m.evaluate(() => document.getElementById('bkRcpt').innerText);
  if(!(/regular/.test(rc) && /Discount given/.test(rc))) console.log('RECEIPT TEXT:', rc.slice(0, 400));
  ok(/regular/.test(rc) && /Discount given/.test(rc), 'receipt shows the regular price and the discount');
  await m.screenshot({path: __dirname + '/shots/3_receipt.png'});
  await m.evaluate(() => slClose('bkRcpt'));
  // within 5%: no OK needed
  await sell(Math.round(list * 0.97 * 100) / 100); await m.waitForTimeout(100);
  ok(await m.evaluate(() => BK.sales.length) === before + 2, '3% off saves without asking');
  await m.evaluate(() => slClose('bkRcpt'));
  // "use the price list" fixes the price
  await sell(1);
  await m.evaluate(() => plUseList()); await m.evaluate(() => qsSave()); await m.waitForTimeout(100);
  ok(await m.evaluate(() => BK.sales.length) === before + 3 && await m.evaluate(l => BK.sales[0].lines[0].unitPrice === l, list), '"Use the price list" sets the list price');
  await m.evaluate(() => slClose('bkRcpt'));
  // owner: not locked, sees discounts and settings
  await m.evaluate(() => { previewRole = null; });
  ok(!(await m.evaluate(() => plApplies())), 'owner is not locked');
  await m.evaluate(() => renderSalesBooksPage()); await m.waitForTimeout(100);
  const page = await m.evaluate(() => document.getElementById('page-sales').innerText);
  ok(/Discounts · Today/.test(page), 'sales page shows discounts by cashier');
  ok(!/Price lock/.test(page), 'price lock box is gone from Sales (Round 13)');
  console.log(JSON.stringify(await m.evaluate(() => plDiscountsBy(APP_TODAY))));
  await m.screenshot({path: __dirname + '/shots/4_owner_sales.png'});
  // switching off the receipt
  await m.evaluate(() => bkSaveSettings({receipt_auto: false}));
  await m.evaluate(([item, list]) => { openQuickSale(); QS.lines[0] = {product: item, qty: 1, price: String(list)}; return qsSave(); }, [item, list]); await m.waitForTimeout(100);
  ok(await m.evaluate(() => !document.getElementById('bkRcpt') && !!document.getElementById('bkSnack')), 'receipt off → small snack instead');
  // owner approval popup renders
  await m.evaluate(() => plOwnerRender([{id: 'x', requested_by_name: 'Liza', created_at: new Date().toISOString(), customer_name: 'Walk-in', total: 140, lines: [{product: 'Angle Bars', qty: 2, unitPrice: 70, listPrice: 78}]}]));
  await m.screenshot({path: __dirname + '/shots/5_owner_popup.png'});
  ok(await m.evaluate(() => /OK this price/.test(document.getElementById('plOk').innerText)), 'owner popup renders');
  ok(errs.length === 0, 'no page errors ' + errs.join(' | '));
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  await b.close();
})();
