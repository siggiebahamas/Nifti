const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const W of [1280, 390]) {
  const ctx = await b.newContext({ viewport: {width: W, height: 900}, isMobile: W < 500, hasTouch: W < 500, timezoneId: 'Asia/Manila' });
  await ctx.route(/googletagmanager|supabase\.co|fonts\.g|tesseract|xlsx|pdfjs/, r => r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
  await ctx.route(/qrcode-generator/, r => r.fulfill({ path: __dirname + '/node_modules/qrcode-generator/dist/qrcode.js', contentType: 'application/javascript' }));
  const m = await ctx.newPage(); const errs = [];
  m.on('pageerror', e => errs.push(e.message)); m.on('dialog', d => d.type() === 'prompt' ? d.accept(d.defaultValue() || 'checked it') : d.accept());
  await m.goto('file:///home/user/SadieCutie/Nifti_Sept17.html'); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(800);
  const r = await m.evaluate(async () => {
    const out = {}; const sleep = t => new Promise(r => setTimeout(r, t));
    out.tz = [APP_TODAY, addDaysIso(APP_TODAY, 1), bkPrevMonth('2026-10'), new Date().getTimezoneOffset()];
    go('ledger'); await sleep(400);
    const tabs = {};
    for(const t of ['summary','pnl','bs','cash','tb','gl','journal','accounts']){ LGV.tab = t; await renderLedgerPage(); await sleep(60); tabs[t] = (document.getElementById('lgBody').innerText || '').length; }
    out.tabs = tabs;
    const all = lgSums(null, APP_TODAY), td = Object.values(all).reduce((a, x) => a + x.d, 0), tc = Object.values(all).reduce((a, x) => a + x.c, 0);
    out.tb = [Math.round(td), Math.round(tc)];
    LGV.tab = 'bs'; await renderLedgerPage(); out.bs = document.querySelector('#lgBody .pl-total').innerText.replace(/\s+/g, ' ');
    const r0 = lgRange('month'); const p = lgPnlFor(r0.from, r0.to); out.pnl = {rev: p.revenue, cogs: p.cogs, gross: p.gross, opex: p.opexTot, net: p.net};
    out.moneyPnl = bkPnl(bkMonth(APP_TODAY)).fromLedger;
    // manual journal
    lgOpenManual(); LGJ.memo = 'Owner capital'; LGJ.lines = [{a:'1020', d:'50000', c:''},{a:'3000', d:'', c:'49000'}]; await lgManualSave(); out.unbalanced = LGJ && LGJ.err;
    LGJ.lines[1].c = '50000'; await lgManualSave(); out.manualPosted = !!lgDemoStore().manual.length;
    // issues
    go('issues'); await sleep(300); out.issues = issuesAll().map(i => i.kind).reduce((a, k) => (a[k] = (a[k] || 0) + 1, a), {});
    const first = issuesAll()[0]; await issDecide(first.fp, 'accepted'); out.accepted = issuesAll().find(i => i.fp === first.fp).status;
    // approvals
    go('expenses'); await sleep(200); out.waiting = !!document.querySelector('.bk-approve');
    const sub = BK.expenses.find(e => e.status === 'submitted'); await bkReviewExpense(sub.id, true); out.approved = sub.status;
    // payroll
    go('payroll'); await sleep(200); prNew(); PRF.lines = [{staff_name:'Rico', basis:'day', rate:'610', days:'12', extra:'200', vale_deduct:'1500', contrib_employee:'450', contrib_employer:'600', other_deduct:'', note:''}];
    const cash0 = lgBal(lgSums(null, APP_TODAY), '1000');
    await prSave(true); await lgLoad(); out.payroll = PR.runs.map(r => r.status); out.payNet = PR.lines[0].net;
    out.cashDrop = Math.round(cash0 - lgBal(lgSums(null, APP_TODAY), '1000'));
    out.valeLeft = prValeBalances()['Rico'];
    // close last month
    go('close'); await sleep(300); const m = clsMonths()[0];
    clsChecks(m).forEach(c => { if(!c.ok) clsMark(m, c.k, true); });
    await clsLock(m); out.locked = lgMonthLocked(m + '-15');
    exSave; openExpenseForm(); EXF.amount = '100'; EXF.category = 'Water'; EXF.date = m + '-10'; exRender(); await exSave(); out.lockedBlocked = EXF && EXF.err;
    slClose('exModal');
    // branches
    await bkSaveSettings({branches: [{name: 'Marikina', wh: 'main'}, {name: 'Taytay', wh: 'branch2'}]});
    bkSetHereBranch('Taytay'); go('cashcount'); await sleep(200); out.picker = !!document.querySelector('.bk-branch select');
    out.expTaytay = cashExpected(APP_TODAY).cash; bkSetHereBranch('Marikina'); out.expMain = cashExpected(APP_TODAY).cash;
    // bank: money out
    pickLens('collections','supplier'); await sleep(200);
    const exb = BK.expenses.find(e => e.paidFrom === 'bank');
    window._bankText = 'Date,Description,Debit,Credit\n' + exb.date + ',PAYMENT ' + exb.vendor + ',' + exb.amount + ',\n' + APP_TODAY + ',UNKNOWN DEBIT,777.00,';
    return out;
  });
  console.log(W, JSON.stringify(r));
  // bank flow through the real page
  await m.evaluate(() => { colTab = 'cash'; renderCollectionsPage(); }); await m.waitForTimeout(300);
  const bank = await m.evaluate(() => { const ta = document.getElementById('bankPaste'); if(!ta) return 'no bank box (' + colTab + ')'; ta.value = window._bankText; colMatchBank(); return colBankResult && colBankResult.out ? {matched: colBankResult.out.matched.length, unknown: colBankResult.out.unknown.length} : 'no result'; });
  console.log('bank', JSON.stringify(bank));
  for (const t of ['summary','pnl','bs']) { await m.evaluate(t => { LGV.tab = t; go('ledger'); }, t); await m.waitForTimeout(300); await m.screenshot({path: `../shots/lg_${t}_${W}.png`, fullPage: W > 500}); }
  await m.evaluate(() => go('issues')); await m.waitForTimeout(300); await m.screenshot({path: `../shots/issues_${W}.png`});
  await m.evaluate(() => go('close')); await m.waitForTimeout(300); await m.screenshot({path: `../shots/close_${W}.png`});
  await m.evaluate(() => { go('payroll'); setTimeout(() => prNew(), 100); }); await m.waitForTimeout(400); await m.screenshot({path: `../shots/payroll_${W}.png`});
  console.log('errors', errs.length, errs.slice(0, 6).join(' | '));
  await ctx.close();
  }
  await b.close();
})();
