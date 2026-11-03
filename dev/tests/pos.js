const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext();
  await ctx.route(/googletagmanager|supabase\.co|fonts\.g/, r => r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
  const m = await ctx.newPage(); await m.goto('file:///home/user/SadieCutie/Nifti_Sept17.html'); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(800);
  console.log(await m.evaluate(() => getSupplierPOs().map(o => [o.id, o.status, o.createdDate, o.invoice ? (o.invoice.issuedDate || '-') + ' ' + (o.invoice.statedTotal || '') + ' pays' + (o.invoice.payments || []).length : 'noinv', poTotal(o), o.deliveryConfirmation ? o.deliveryConfirmation.confirmedDate : ''].join(' | ')).join('\n')));
  console.log('--- buy');
  console.log(await m.evaluate(() => getBuyerPOs().map(o => [o.id, o.status, o.createdDate, o.invoice ? (o.invoice.issuedDate || '-') + ' pays' + (o.invoice.payments || []).length : 'noinv', poTotal(o)].join(' | ')).join('\n')));
  await b.close();
})();
