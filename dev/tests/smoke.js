// Smoke: every page of the one-business app in demo mode, desktop + phone. Screenshots in one/.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W = Number(process.argv[2] || 1280);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: {width: W, height: 900}, isMobile: W < 500, hasTouch: W < 500 });
  await ctx.route(/googletagmanager|supabase\.co|fonts\.g|tesseract/, r => r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
  await ctx.route(/qrcode-generator/, r => r.fulfill({ path: __dirname + '/node_modules/qrcode-generator/dist/qrcode.js', contentType: 'application/javascript' }));
  const m = await ctx.newPage(); const errs = [];
  m.on('pageerror', e => errs.push(e.message)); m.on('dialog', d => d.accept());
  await m.goto('file:///home/user/SadieCutie/Nifti_Sept17.html'); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(800);
  const tag = W > 500 ? 'd' : 'm';
  const pages = [['dashboard'], ['money'], ['expenses'], ['cashcount'], ['profit'], ['sales'], ['inventory'], ['orders', 'supplier'], ['orders', 'buyer'], ['messages'], ['suppliers', 'supplier'], ['suppliers', 'buyer'], ['collections', 'supplier'], ['collections', 'buyer'], ['team'], ['settings'], ['store'], ['prices', 'supplier'], ['prices', 'buyer'], ['analytics', 'supplier'], ['discover', 'buyer'], ['cheques', 'supplier'], ['returns', 'buyer'], ['books', 'supplier'], ['taxforms', 'buyer'], ['watchdog'], ['followups'], ['routes']];
  for (const [p, lens] of pages) {
    const before = errs.length;
    await m.evaluate(([p, lens]) => { if(lens) pickLens(p, lens); else go(p); }, [p, lens]);
    await m.waitForTimeout(p === 'dashboard' ? 600 : 300);
    const info = await m.evaluate((p) => { const el = document.getElementById('page-' + p); return {active: el && el.classList.contains('active'), len: el ? el.innerText.length : 0, tabs: el && el.querySelector('.lens-tabs') ? el.querySelector('.lens-tabs').innerText.replace(/\n/g, ' | ') : ''}; }, p);
    console.log(p, lens || '', JSON.stringify(info), errs.length > before ? 'ERR: ' + errs.slice(before).join(' || ') : '');
    await m.screenshot({path: `${__dirname}/one/${tag}_${p}${lens ? '_' + lens : ''}.png`, fullPage: p === 'dashboard' || p === 'money'});
  }
  console.log('total errors', errs.length);
  await b.close();
})();
