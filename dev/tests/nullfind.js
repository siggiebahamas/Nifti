const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: {width: 1280, height: 900} });
  await ctx.route(/googletagmanager|supabase\.co|fonts\.g|tesseract|xlsx|pdfjs/, r => r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
  await ctx.route(/qrcode-generator/, r => r.fulfill({ path: __dirname + '/node_modules/qrcode-generator/dist/qrcode.js', contentType: 'application/javascript' }));
  const m = await ctx.newPage();
  await m.goto('file:///home/user/SadieCutie/Nifti_Sept17.html'); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(800);
  const r = await m.evaluate(async () => {
    const out = [];
    for (const [pg, lens] of [['orders','supplier'],['analytics','supplier'],['analytics','buyer']]) {
      pickLens(pg, lens); await new Promise(r => setTimeout(r, 300));
      const w = document.createTreeWalker(document.getElementById('page-' + pg), NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (/^\s*null\s*$|\bnull\b|undefined|NaN/.test(n.nodeValue)) out.push(pg + ':' + lens + ' ' + n.parentElement.outerHTML.slice(0, 300)); }
    }
    return out;
  });
  console.log(r.join('\n'));
  await b.close();
})();
