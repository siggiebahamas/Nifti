// End-to-end checks for the day-one features, in demo mode (no backend).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
fs.mkdirSync(__dirname + '/qt', {recursive: true});
const results = []; const ok = (name, cond, extra) => { results.push((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
async function openPage(b, w, opts){
  const ctx = await b.newContext({ viewport: {width: w, height: 900}, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.route(/googletagmanager|supabase\.co|fonts\.g/, r => r.abort());
  if(opts && opts.google) await ctx.route(/auth\/v1\/settings/, r => r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({external: {google: true, email: true}})}));
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'application/javascript' }));
  await ctx.route(/qrcode-generator/, r => r.fulfill({ path: __dirname + '/node_modules/qrcode-generator/dist/qrcode.js', contentType: 'application/javascript' }));
  const m = await ctx.newPage(); const errs = [];
  m.on('pageerror', e => errs.push(e.message)); m.on('dialog', d => d.accept());
  await m.goto('file:///home/user/SadieCutie/Nifti_Sept17.html'); await m.waitForFunction(() => typeof navigate === 'function'); await m.waitForTimeout(900);
  return {ctx, m, errs};
}
(async () => {
  const b = await chromium.launch();
  for (const w of [1280, 390]) {
    const tag = w > 500 ? 'd' : 'm';
    // ---------- 1) Opening balances: paste parser
    let {ctx, m, errs} = await openPage(b, w);
    if (w === 1280) {
      const parsed = await m.evaluate(() => [
        'Juan Hardware 12,500 Oct 15', 'Aling Nena Store - 4,800 - overdue', '3. Bayan Builders\t32000\t2026-11-30', 'Rico Trading P 9.5k in 15 days',
        '• Sta. Cruz Supply: ₱1,250.50 due 9/30', 'just a note with no amount', '15 Nov Lopez Hardware 7000', 'Aling Nena Test 4,800 Nov 15'].map(l => obParseLine(l)));
      ok('parse: month after other words', parsed[7] && parsed[7].name === 'Aling Nena Test' && parsed[7].due === '2026-11-15', JSON.stringify(parsed[7]));
      ok('parse: name+amount+month', parsed[0] && parsed[0].name === 'Juan Hardware' && parsed[0].amount === '12500' && parsed[0].due === '2026-10-15', JSON.stringify(parsed[0]));
      ok('parse: overdue → late', parsed[1] && parsed[1].name === 'Aling Nena Store' && parsed[1].amount === '4800' && parsed[1].dueKind === 'late', JSON.stringify(parsed[1]));
      ok('parse: excel tabs + iso', parsed[2] && parsed[2].name === 'Bayan Builders' && parsed[2].amount === '32000' && parsed[2].due === '2026-11-30', JSON.stringify(parsed[2]));
      ok('parse: 9.5k + in 15 days', parsed[3] && parsed[3].name === 'Rico Trading' && parsed[3].amount === '9500', JSON.stringify(parsed[3]));
      ok('parse: ₱ decimals + m/d', parsed[4] && parsed[4].name === 'Sta. Cruz Supply' && parsed[4].amount === '1250.5' && parsed[4].due === '2026-09-30', JSON.stringify(parsed[4]));
      ok('parse: skips no amount', parsed[5] === null);
      ok('parse: day-month first', parsed[6] && parsed[6].name === 'Lopez Hardware' && parsed[6].due === '2026-11-15', JSON.stringify(parsed[6]));
    }
    // ---------- 1b) Opening balances: full flow (supplier, demo)
    await m.evaluate(() => { switchAppRole('supplier'); navigate('dashboard'); });
    await m.waitForTimeout(400);
    const owedBefore = await m.evaluate(() => unpaidInvoicesFor('supplier').reduce((s, r) => s + r.balance, 0));
    await m.evaluate(() => openOpeningBalances());
    await m.waitForSelector('#obModal');
    await m.fill('#obName_0', 'Juan Hardware Test');
    await m.fill('#obAmt_0', '12,500');
    await m.click('#obModal .ob-due button:has-text("Already late")');
    await m.screenshot({path: `qt/ob_${tag}_edit.png`});
    await m.click('#obModal .sl-link:has-text("Paste a list instead")');
    await m.fill('#obPaste', 'Aling Nena Test 4,800 Nov 15\nBayan Builders Test 32000 overdue\nnot a line');
    await m.click('#obModal button:has-text("Read my list")');
    const rowsAfterPaste = await m.evaluate(() => OB.rows.length);
    ok('paste replaced rows', rowsAfterPaste === 2, 'rows=' + rowsAfterPaste);
    const errShown = await m.textContent('#obErr');
    ok('paste: skipped line reported', /Skipped 1 line/.test(errShown), errShown);
    // add the first one back by hand
    await m.click('#obModal .sl-link:has-text("Add another customer")');
    await m.fill('#obName_2', 'Juan Hardware Test');
    await m.fill('#obAmt_2', '12500');
    // empty amount validation
    await m.fill('#obAmt_0', '');
    await m.click('#obSaveBtn');
    ok('validation: amount required', /How much does Aling Nena Test owe/.test(await m.textContent('#obErr')), await m.textContent('#obErr'));
    await m.fill('#obAmt_0', '4800');
    await m.click('#obSaveBtn');
    await m.waitForSelector('#obModal .ob-done-list');
    await m.screenshot({path: `qt/ob_${tag}_done.png`});
    const owedAfter = await m.evaluate(() => unpaidInvoicesFor('supplier').reduce((s, r) => s + r.balance, 0));
    ok('who owes you increased by 49,300', Math.round(owedAfter - owedBefore) === 49300, `${owedBefore} → ${owedAfter}`);
    const undoId = await m.evaluate(() => OB.result[0].poId);
    await m.click(`#obDone_${undoId} button`);
    const owedUndo = await m.evaluate(() => unpaidInvoicesFor('supplier').reduce((s, r) => s + r.balance, 0));
    ok('undo removes one (4,800)', Math.round(owedAfter - owedUndo) === 4800, `${owedAfter} → ${owedUndo}`);
    await m.click('#obModal button:has-text("See who owes you")');
    await m.waitForTimeout(500);
    const owesText = await m.evaluate(() => (document.querySelector('#page-collections.active') || {}).textContent || '');
    ok('who owes you lists new customers', /Bayan Builders Test/.test(owesText) && /Juan Hardware Test/.test(owesText));
    ok('home shows the new total', await m.evaluate(() => { go('dashboard'); return /66,004|₱66K/.test(document.getElementById('oneHome').textContent); }));
    // statement for an opening-balance customer works (demo builds it locally)
    const stmtOk = await m.evaluate(() => { const b = buyersData.find(x => x.name === 'Bayan Builders Test'); try{ const d = buildLocalStatement(b.id); return d && d.totals && d.totals.balance >= 32000; }catch(e){ return 'ERR ' + e.message; } });
    ok('statement includes opening balance', stmtOk === true, String(stmtOk));
    // Collections page header button + create menu item
    await m.evaluate(() => navigate('collections')); await m.waitForTimeout(400);
    ok('collections button visible', await m.isVisible('#page-collections button:has-text("Add what a customer owes")'));
    ok('create menu has item', await m.evaluate(() => [...document.querySelectorAll('#createMenuDropdown .notif-text')].some(x => /Add what a customer owes you/.test(x.textContent))));
    ok('no page errors (opening balances)', errs.length === 0, errs.join(' | '));
    await ctx.close();

    // ---------- 2) Guided first order: supplier
    ({ctx, m, errs} = await openPage(b, w));
    await m.evaluate(() => {
      switchAppRole('supplier');
      for(let i = purchaseOrders.length - 1; i >= 0; i--) if(purchaseOrders[i].supplierId === ME_SUPPLIER) purchaseOrders.splice(i, 1);
      buyersData.length = 0; try{ localStorage.removeItem(fgKey()); }catch(e){}
      navigate('dashboard');
    });
    await m.waitForTimeout(500);
    ok('supplier guide shows', await m.isVisible('#getStartedCard.fg-card'));
    ok('empty receivables shows add-who-owes CTA', await m.isVisible('.lg-money .ob-cta'));
    await m.screenshot({path: `qt/fg_${tag}_sup0.png`, fullPage: false});
    await m.click('#getStartedCard button:has-text("Pick a customer")');
    await m.waitForSelector('#fgModal');
    await m.click('#fgModal button:has-text("Next")');
    ok('pick: name required', /Type their business name/.test(await m.textContent('#fgErr')));
    await m.fill('#fgName', 'Ramos Hardware');
    await m.fill('#fgPhone', '0917 222 3333');
    await m.click('#fgModal button:has-text("Next")');
    await m.waitForSelector('#cpoModal .fg-banner');
    ok('guided order banner', /Step 2 of 4/.test(await m.textContent('#cpoModal .fg-banner')));
    await m.fill('#cpoTypeItem', 'Portland Cement 40kg'); await m.fill('#cpoTypeQty', '20');
    await m.click('#cpoModal .cpo-type button');
    await m.waitForTimeout(150);
    // price (the demo catalog may already know it)
    const price = await m.evaluate(() => CPO.rows[0] && CPO.rows[0].myPrice);
    if(!(price > 0)) await m.fill('#cpoModal .cpo-grid input[placeholder="Price"]', '245');
    await m.screenshot({path: `qt/fg_${tag}_sup2.png`});
    await m.click('#cpoModal button:has-text("Send for their OK")');
    await m.waitForTimeout(400);
    const st1 = await m.evaluate(() => fgState());
    ok('guide remembers the order', !!st1.poId, JSON.stringify(st1));
    await m.evaluate(() => slClose('cpoModal'));
    await m.evaluate(() => renderGetStartedCard()); await m.waitForTimeout(200);
    ok('step 3 active', await m.isVisible('#getStartedCard .fg-step.active button:has-text("Send on Viber")'));
    await m.click('#getStartedCard button:has-text("Send on Viber")');
    await m.waitForTimeout(600);
    ok('share sheet opens', await m.isVisible('#shareSheet'));
    await m.evaluate(() => slClose('shareSheet'));
    await m.evaluate(() => renderGetStartedCard()); await m.waitForTimeout(100);
    ok('step 4 waiting', /Waiting for Ramos/.test(await m.textContent('#getStartedCard')));
    await m.screenshot({path: `qt/fg_${tag}_sup3.png`});
    await m.evaluate(() => { const po = getPO(fgState().poId); po.status = 'confirmed'; renderGetStartedCard(); });
    await m.waitForTimeout(100);
    ok('celebration', /FIRST ORDER CONFIRMED/.test(await m.textContent('#getStartedCard')));
    await m.screenshot({path: `qt/fg_${tag}_sup4.png`});
    await m.click('#getStartedCard button:has-text("Done")');
    await m.waitForTimeout(100);
    ok('back to checklist after done', await m.evaluate(() => !document.querySelector('#getStartedCard.fg-card')));
    ok('no page errors (supplier guide)', errs.length === 0, errs.join(' | '));
    await ctx.close();

    // ---------- 2b) One home: same home whichever side was used last; a supplier order still works from + Create
    ({ctx, m, errs} = await openPage(b, w));
    await m.evaluate(() => { switchAppRole('buyer'); navigate('dashboard'); });
    await m.waitForTimeout(500);
    ok('one home after buyer lens', await m.evaluate(() => !!document.querySelector('#oneHome') && document.querySelector('#oneHome').offsetParent !== null));
    await m.evaluate(() => createAs('buyer', () => openCreatePOModal()));
    await m.waitForTimeout(300);
    ok('create PO opens from one home', await m.evaluate(() => !document.getElementById('createPoModal').classList.contains('hidden')));
    ok('no page errors (one home)', errs.length === 0, errs.join(' | '));
    await ctx.close();

    // ---------- 3) Scan to pay: public order page + statement + settings
    ({ctx, m, errs} = await openPage(b, w));
    const qr = 'data:image/png;base64,' + fs.readFileSync('/home/user/SadieCutie/favicon-48.png').toString('base64');
    await m.evaluate(qr => {
      const d = {kind: 'order', po_number: 'PO-2026-1042', status: 'invoiced', type: 'local', currency: 'PHP', tax_rate: 0, line_items: [{product: 'Cement', qty: 20, unitPrice: 245}],
        created_date: '2026-10-20', buyer_name: 'Juan Hardware', supplier_name: 'Metro Steel Co.', supplier_is_outside: false, buyer_is_outside: true, history: [],
        invoice: {number: 'INV-1', status: 'unpaid', due_date: '2026-11-05'},
        pay: {accounts: [{type: 'gcash', accountName: 'Metro Steel Co.', accountNumber: '09171234567', qr}, {type: 'bank', bankName: 'BDO', accountName: 'Metro Steel Co.', accountNumber: '001234567890'}], updated_at: null, has_invoice: true, due: 4900, pending: 0}};
      publicOrderToken = 'tok_test_12345678901234567890';
      window._rpcCalls = [];
      sb.rpc = async (fn, args) => { window._rpcCalls.push([fn, args]); return {data: {applied: args.p_amount, extra: 0}, error: null}; };
      renderPublicOrderView(d);
    }, qr);
    await m.waitForTimeout(200);
    ok('order link shows scan to pay', await m.isVisible('#publicOrderView .stp img'));
    await m.screenshot({path: `qt/stp_${tag}_order.png`, fullPage: true});
    await m.click('#publicOrderView .stp-tabs button:has-text("BDO")');
    ok('switch account tab', /001234567890/.test(await m.textContent('#stpCard')));
    await m.click('#publicOrderView button:has-text("I\'ve paid")');
    ok('method preselected from account', (await m.inputValue('#stpMethod')) === 'bank_transfer');
    await m.fill('#stpName', 'Rico');
    await m.click('#stpSend');
    ok('ref required', /reference number/.test(await m.textContent('#stpErr')));
    await m.fill('#stpRef', 'BDO-778812');
    await m.click('#stpSend');
    await m.waitForTimeout(200);
    const call = await m.evaluate(() => window._rpcCalls[0]);
    ok('calls report_payment_by_order_link', call && call[0] === 'report_payment_by_order_link' && call[1].p_amount === 4900 && call[1].p_reference === 'BDO-778812', JSON.stringify(call));
    ok('confirmation shown', /waiting for them to confirm/.test(await m.textContent('#stpPaid')));
    await m.evaluate(() => closePublicOrderView());
    // statement (public)
    await m.evaluate(qr => {
      window._stmtToken = 'stmt_test_1234567890123456'; window._rpcCalls = [];
      showStatementOverlay({as_of: '2026-10-28', supplier: {name: 'Metro Steel Co.', pay_to: [{type: 'maya', accountName: 'Metro Steel Co.', accountNumber: '09181234567', qr}], contact: {}},
        buyer: {name: 'Juan Hardware'}, invoices: [{po_number: 'PO-1', invoice_number: 'BAL-1', date: '2026-10-01', due: '2026-10-15', amount: 12500, balance: 12500, pending: 0, days_overdue: 13}],
        payments: [], aging: {current: 0, d1_30: 12500, d31_60: 0, d61_90: 0, d90p: 0}, totals: {balance: 12500, pending: 0, open_count: 1}}, {isPublic: true});
    }, qr);
    await m.waitForTimeout(150);
    ok('statement shows scan to pay', await m.isVisible('#statementView .stp img'));
    await m.screenshot({path: `qt/stp_${tag}_stmt.png`, fullPage: true});
    await m.click('.stmt-toolbar button:has-text("I\'ve paid")');
    await m.waitForTimeout(400);
    ok('toolbar I\'ve paid opens form', await m.isVisible('#stpRef'));
    ok('statement method maya', (await m.inputValue('#stpMethod')) === 'maya');
    await m.evaluate(() => closeStatementOverlay());
    // settings: preview + missing QR prompt
    await m.evaluate(() => { switchAppRole('supplier'); myPaymentAccounts.push({id: 'acc1', type: 'gcash', accountName: 'Metro Steel Co.', accountNumber: '09171234567', qr: null}); navigate('settings'); openSettingsCard('paymentDetailsCard'); renderPaymentDetailsSettings(); });
    await m.waitForTimeout(300);
    ok('settings: scan to pay box', await m.isVisible('#paymentDetailsContent .stp-set'));
    ok('settings: add QR prompt', /has no QR yet/.test(await m.textContent('#paymentDetailsContent')));
    await m.setInputFiles('#paymentDetailsContent input[type=file]', '/home/user/SadieCutie/icon-192.png');
    await m.waitForTimeout(800);
    ok('QR saved to account', await m.evaluate(() => isSafeImageDataUrl(myPaymentAccounts[0].qr)));
    await m.click('#paymentDetailsContent button:has-text("See what customers see")');
    ok('preview modal', await m.isVisible('#stpPrevModal .stp img'));
    ok('preview I\'ve paid disabled', await m.evaluate(() => document.querySelector('#stpPrevModal .stp-big').disabled));
    await m.screenshot({path: `qt/stp_${tag}_preview.png`});
    ok('no page errors (scan to pay)', errs.length === 0, errs.join(' | '));
    await ctx.close();

    // ---------- 4) Weekly recap card (demo data)
    ({ctx, m, errs} = await openPage(b, w));
    for (const role of ['supplier', 'buyer']) {
      await m.evaluate(r => { switchAppRole(r); navigate('dashboard'); }, role);
      await m.waitForTimeout(600);
      const wk = await m.evaluate(() => [wkLocal(1), wkLocal(0)]);
      const shown = await m.isVisible('#wkCard');
      ok(`weekly card ${role}`, shown === (wkHasAnyCheck(wk[0]) || wkHasAnyCheck(wk[1])), JSON.stringify(wk[0]));
      if(shown) await m.locator('#wkCard').screenshot({path: `qt/wk_${tag}_${role}.png`});
    }
    ok('no page errors (weekly)', errs.length === 0, errs.join(' | '));
    await ctx.close();

    // ---------- 5) Google sign-in button (provider on)
    ({ctx, m, errs} = await openPage(b, w, {google: true}));
    await m.evaluate(() => { try{ sessionStorage.removeItem('nifti-google'); }catch(e){} renderGoogleSignInButtons(); navigate('login'); });
    await m.waitForTimeout(500);
    ok('google button on sign in', await m.isVisible('#signinView .google-btn'));
    await m.screenshot({path: `qt/google_${tag}.png`});
    await m.evaluate(() => { const s = document.querySelector('[onclick*="showSignup"], [onclick*="signupView"]'); if(typeof showSignup === 'function') showSignup(); else if(s) s.click(); });
    await m.waitForTimeout(200);
    ok('google button on sign up', await m.evaluate(() => !!document.querySelector('#signupView .google-btn')));
    ok('no page errors (google)', errs.length === 0, errs.join(' | '));
    await ctx.close();
    // provider off → no button
    ({ctx, m, errs} = await openPage(b, w));
    await m.evaluate(() => navigate('login')); await m.waitForTimeout(400);
    ok('google button hidden when off', !(await m.evaluate(() => !!document.querySelector('.google-btn'))));
    await ctx.close();
  }
  await b.close();
  console.log(results.join('\n'));
  console.log(results.filter(r => r.startsWith('FAIL')).length + ' failed of ' + results.length);
})();
function wkHasAnyCheck(r){ return !!(r && ((r.orders || 0) + (r.collected || 0) + (r.paid || 0) + (r.reminders || 0) + (r.deliveries_confirmed || 0) + (r.deliveries || 0) + (r.overpay_alerts || 0)) > 0); }
