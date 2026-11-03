const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const W of [1280, 390]) {
    const ctx = await b.newContext({ viewport: {width: W, height: 900}, isMobile: W < 500 });
    await ctx.route(/googletagmanager|supabase\.co|fonts\.g/, r => r.abort());
    await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
    const m = await ctx.newPage(); const errs = []; m.on('pageerror', e => errs.push(e.message));
    await m.goto('file:///home/user/SadieCutie/Nifti_Sept17.html'); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(600);
    await m.evaluate(() => navigate('pricing')); await m.waitForTimeout(400);
    const r = await m.evaluate(() => ({plans: [...document.querySelectorAll('#view-pricing .p2-set')].filter(x => x.offsetParent).map(x => [...x.querySelectorAll('.p2-plan-h b')].map(b => b.textContent).join('+')), picker: !!document.querySelector('#view-pricing .p2-who:not(.hidden)'), faq: document.querySelector('#view-pricing .f6-faq .q').textContent}));
    const p = await m.locator('#view-pricing .p2-plans').first(); await p.screenshot({path: `../shots/pricing_${W}.png`});
    await m.evaluate(() => { navigate('login'); const t = document.querySelectorAll('#view-login .tabs button')[1]; if(t) setLoginTab('signup', t); }); await m.waitForTimeout(300);
    const kinds = await m.evaluate(() => [...document.querySelectorAll('#signupView .role-chip')].map(c => c.textContent));
    if (W === 390) await m.screenshot({path: '../shots/signup_390.png'});
    console.log(W, JSON.stringify(r), JSON.stringify(kinds), 'errors', errs.length, errs.slice(0,3).join('|'));
    await ctx.close();
  }
  await b.close();
})();
