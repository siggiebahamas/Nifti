/* Nifti Design Lab — the 8 owner tasks from the brief, as reusable content.
   Each concept decides HOW to present these (panel, article, zoom, inspector, timeline...); the facts stay identical.
   Output uses neutral classes (fx-*) that every concept styles in its own language. */
(function(){
const D = ND;
const hrows = (rows, opt) => { opt = opt || {}; const mx = Math.max(...rows.map(r => r[1])) || 1;
  return `<div class="fx-hbars">${rows.map(r => `<div class="fx-hb${r[3] ? ' is-' + r[3] : ''}"><span class="fx-hb-l">${F.esc(r[0])}</span><span class="fx-hb-t"><i style="width:${Math.max(2, r[1] / mx * 100).toFixed(1)}%"></i></span><span class="fx-hb-v">${r[2] || F.peso(r[1])}</span></div>`).join('')}</div>`; };
const kv = pairs => `<dl class="fx-kv">${pairs.map(([k,v,t]) => `<div${t ? ` class="is-${t}"` : ''}><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
const why = items => `<ul class="fx-why">${items.map(x => `<li>${x}</li>`).join('')}</ul>`;
const next = btns => `<div class="fx-next">${btns.map((b,i) => `<button type="button" class="fx-btn${i ? '' : ' is-primary'}" onclick="proto('${b.replace(/'/g, '\\\'')}')">${b}</button>`).join('')}</div>`;
const tag = (t, txt) => `<span class="fx-tag is-${t}"><span class="fx-glyph" aria-hidden="true">${t === 'r' ? '▲' : t === 'y' ? '●' : '✓'}</span>${txt}</span>`;

const FLOWS = {
  // 2. select a financial metric
  metric(key){
    const m = D.month;
    if(key === 'cash'){ const f = D.forecast(), low = f.reduce((a,b) => b.bal < a.bal ? b : a);
      return {kicker:'Cash position', title:F.peso(D.cash.total) + ' in bank and GCash', body:
        `<p class="fx-lede">Enough for tomorrow's cheque. The tight day is <b>${low.d}</b>, when the balance dips to <b>${F.peso(low.bal)}</b>, under your ₱40,000 safety line.</p>
        ${kv([['BDO current account', F.peso(D.cash.bank)], ['GCash', F.peso(D.cash.gcash)], ['Drawer today (expected)', F.peso(D.cash.drawerExpected)], ['Lowest in 14 days', F.peso(low.bal) + ' · ' + low.d, 'r']])}
        <div class="fx-sub">Next 14 days</div>${hrows(f.map(x => [x.d, x.bal, F.k(x.bal), x.bal < D.cash.safety ? 'r' : '']))}
        ${why(['Salaries (₱14,000) and rent (₱18,000) land on 31 Aug and 1 Sep.', 'The ₱33,500 Metro Steel balance follows on 2 Sep.', 'Collecting half of Riverside Builders\' ₱77,240 before 2 Sep keeps you above the line.'])}
        ${next(['Call Riverside Builders', 'Move the Metro Steel balance to 5 Sep'])}`}; }
    if(key === 'receivables') return FLOWS.overdue();
    if(key === 'stock') return FLOWS.stock();
    if(key === 'payables') return FLOWS.supplier();
    const rows = [['Sales', m.revenue, F.peso(m.revenue)], ['Cost of goods sold', m.cogs, '−' + F.peso(m.cogs)], ['Expenses', m.expenses, '−' + F.peso(m.expenses)], ['Profit', m.profit, F.peso(m.profit), 'g']];
    return {kicker:'Profit, 1–26 August', title:F.peso(m.profit) + ' profit so far', body:
      `<p class="fx-lede">On pace for <b>${F.peso(m.projProfit)}</b> this month, about 4.5% above July (${F.peso(m.lastProfit)}). For every ₱100 sold you keep ₱7.70.</p>
      ${hrows(rows)}
      <div class="fx-sub">Profit by month</div>${hrows(D.trend.map(t => [t.m + (t.partial ? ' (so far)' : ''), t.profit, F.peso(t.profit), t.partial ? 'y' : '']))}
      ${why(['Sales are up 4% on the same 26 days of July.', 'Electricity is ₱3,017 above normal and repairs ₱3,400 above normal.', 'Gross margin is 20.3%, steady with July.'])}
      ${next(['Open the profit and loss', 'Look at electricity'])}`}; },

  // 3. investigate an unusual expense
  expense(){ const e = D.electricity;
    return {kicker:'Unusual expense', title:'Electricity is 51% above normal', body:
      `<p class="fx-lede">The August Meralco bill is <b>₱8,940</b> against a 3-month average of <b>₱5,923</b>. Usage, not price, went up: 712 kWh against about 470.</p>
      ${hrows(e.map(x => [x.m + ' · ' + x.kwh + ' kWh', x.amt, F.peso(x.amt), x.m === 'Aug' ? 'r' : '']))}
      ${kv([['Extra cost this month', '₱3,017', 'r'], ['Rate per kWh', '₱12.56, unchanged'], ['Started', 'Week of 30 Jul'], ['Paid from', 'BDO, 18 Aug']])}
      <div class="fx-sub">Likely reason</div>
      ${why(['On 30 Jul you paid ₱5,500 to rewind the motor of the rebar cutter. Usage rose the same week.', 'A rewound motor that runs hot draws more power, or the cutter now runs longer each day.', 'Nothing else changed: same opening hours, same staff, no new equipment recorded.'])}
      ${next(['Ask the repair shop to check the motor', 'Track cutter hours for a week', 'Mark as expected'])}`}; },

  // 4. review overdue customer payments
  overdue(){ const r = D.receivables;
    return {kicker:'Owed to you', title:F.peso(D.receivablesTotal) + ' is past due', body:
      `<p class="fx-lede">Four customers, all past their 15-day terms. <b>Riverside Builders alone is 44%</b> of it, and two written reminders have not worked.</p>
      <div class="fx-tw"><table class="fx-tbl"><thead><tr><th>Customer</th><th class="n">Days late</th><th class="n">Owes</th><th>Pattern</th></tr></thead><tbody>
      ${r.map(x => `<tr><td><b>${x.cust}</b><small>${x.id} · due ${x.due}</small></td><td class="n">${tag(x.days > 30 ? 'r' : x.days > 14 ? 'r' : 'y', x.days + ' days')}</td><td class="n"><b>${F.peso(x.amount)}</b></td><td><small>${x.lastPaid}</small></td></tr>`).join('')}</tbody></table></div>
      ${why(['Call Riverside today; they pay after a call, not a message.', 'Bayview gets a delivery tomorrow: ask for the ₱45,144 when the truck arrives.', 'Pause new credit for Riverside until they pay something.'])}
      ${next(['Call Riverside Builders', 'Send Bayview a reminder', 'Pause credit for Riverside'])}`}; },

  // 5. identify a stock shortage
  stock(){ const s = D.stock.slice().sort((a,b) => a.cover / a.lead - b.cover / b.lead);
    return {kicker:'Stock', title:'Cement runs out in 2 days', body:
      `<p class="fx-lede"><b>12 bags</b> left; you sell about 6.5 a day, so you run out on <b>28 Aug</b>. The Cebu Aggregates order (PO-0877, 220 bags) is waiting for your OK, and their price ends on 28 Aug.</p>
      <div class="fx-tw"><table class="fx-tbl"><thead><tr><th>Item</th><th class="n">On hand</th><th class="n">Days left</th><th class="n">Supplier needs</th><th>What's open</th></tr></thead><tbody>
      ${s.map(x => `<tr><td><b>${x.name}</b></td><td class="n">${x.on} ${x.unit}</td><td class="n">${tag(x.risk, F.days(x.cover))}</td><td class="n">${x.lead} days</td><td><small>${x.open || '—'}</small></td></tr>`).join('')}</tbody></table></div>
      ${why(['Confirm PO-0877 today; it arrives in 3 days, so expect 1 day without cement.', 'Galvanized wire has 4 days left and Balintawak is late. If they miss tomorrow, buy 20 rolls from Quezon Fasteners.', 'I-beams: 35 days of stock and 20 more coming. Ask Metro Steel to cut the order to 10.'])}
      ${next(['Confirm Cebu Aggregates PO-0877', 'Ask Metro Steel to reduce to 10', 'Message Balintawak'])}`}; },

  // 6. check a supplier payment
  supplier(){
    return {kicker:'Supplier payment', title:'Metro Steel cheque · ₱15,400 · clears tomorrow', body:
      `<p class="fx-lede">Covered: BDO has <b>₱86,240</b>, leaving <b>₱70,840</b> after it clears. The cheque is the deposit on PO-0870, 20 I-beams for ₱48,900.</p>
      <div class="fx-match">
        <div class="ok"><span class="fx-glyph" aria-hidden="true">✓</span><b>Order</b><span>PO-0870 · 20 × ₱2,445 = ₱48,900</span></div>
        <div class="ok"><span class="fx-glyph" aria-hidden="true">✓</span><b>Deposit</b><span>Cheque 004512 · ₱15,400 · 27 Aug</span></div>
        <div class="wait"><span class="fx-glyph" aria-hidden="true">●</span><b>Delivery</b><span>Moved to 2 Sep · port delay</span></div>
        <div class="wait"><span class="fx-glyph" aria-hidden="true">●</span><b>Balance</b><span>₱33,500 on delivery</span></div>
      </div>
      ${kv([['You owe suppliers in total', F.peso(D.payablesTotal)], ['Next after this', 'Balintawak ₱9,840 on delivery'], ['Metro Steel this year', '14 orders · always on time until this one']])}
      ${why(['You already have 35 days of I-beams. Twenty more ties up ₱48,900 for over two months.', 'Ask Metro Steel to reduce the order to 10. The deposit already covers most of a 10-beam order.'])}
      ${next(['Ask Metro Steel to reduce to 10', 'View the cheque record'])}`}; },

  // 7. review an employee's transaction
  staff(){ const r = D.rico24;
    return {kicker:'Staff review', title:'Rico Reyes · 24 Aug · drawer ₱800 short', body:
      `<p class="fx-lede">Expected <b>${F.peso(r.expected)}</b>, counted <b>${F.peso(r.counted)}</b>. One event, not a pattern yet: his other two counts matched.</p>
      <div class="fx-tw"><table class="fx-tbl"><thead><tr><th>SKU</th><th>Item sold for cash</th><th class="n">Qty</th><th class="n">Price</th><th class="n">Amount</th></tr></thead><tbody>
      ${r.sales.map(s => `<tr><td>${s[0]}</td><td><b>${s[1]}</b></td><td class="n">${s[2]}</td><td class="n">${F.peso(s[3])}</td><td class="n"><b>${F.peso(s[2] * s[3])}</b></td></tr>`).join('')}</tbody></table></div>
      <div class="fx-calc"><div><span>Change fund at opening</span><b>₱1,000</b></div><div class="in"><span>+ Cash sales</span><b>₱840</b></div><div class="out"><span>− Cash paid out</span><b>₱0</b></div><div class="tot"><span>Should be in the drawer</span><b>₱1,840</b></div><div><span>Counted (${r.bills})</span><b>₱1,040</b></div><div class="tot is-r"><span>Difference</span><b>−₱800</b></div></div>
      <div class="fx-sub">What Nifti cross-checked</div>${why(r.findings)}
      <p class="fx-note">Rico entered only the bills and coins. He never saw the expected amount.</p>
      ${next(['Ask Liza to recount the rod shelf', 'Talk to Rico', 'Add a note to the record'])}`}; },

  // 8. ask Nifti AI
  ask(i){ const a = D.ask[i];
    return {kicker:'Ask Nifti', title:a.q, body:
      `<p class="fx-answer">${a.a}</p><p class="fx-src">Based on: ${a.src}</p><p class="fx-note">Prototype: this is a sample answer written from the demo data, not a live AI response.</p>`}; }
};
FLOWS.keys = [
  ['open','Open the dashboard'], ['metric','Select a financial metric'], ['expense','Investigate an unusual expense'], ['overdue','Review overdue customer payments'],
  ['stock','Identify a stock shortage'], ['supplier','Check a supplier payment'], ['staff','Review an employee\'s transaction'], ['ask','Ask Nifti AI a question']
];
FLOWS.tag = tag; FLOWS.hrows = hrows; FLOWS.kv = kv;
window.FLOWS = FLOWS;
})();
