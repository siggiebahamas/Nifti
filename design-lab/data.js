/* Nifti Design Lab — shared sample data and helpers.
   One realistic day at a Philippine hardware distributor. Every concept reads from here, so numbers agree across concepts.
   Sample data only: nothing here talks to Supabase or the production app. */
(function(){
const D = {
  biz:{ name:'Dela Cruz Hardware & Construction Supply', short:'Dela Cruz Hardware', owner:'Ben Dela Cruz', first:'Ben', city:'Valenzuela City',
        todayLabel:'Wednesday, 26 August 2026', todayShort:'Wed 26 Aug', day:26, daysInMonth:31 },

  // ---- month to date (Aug 1–26) ----
  month:{ revenue:400000, cogs:318940, expenses:50179, profit:30881, projRevenue:476900, projProfit:36800,
          lastRevenue:459200, lastProfit:35200, lastSameDayRevenue:384600, lastSameDayProfit:29400 },
  trend:[ {m:'Mar', rev:412300, profit:28100}, {m:'Apr', rev:431000, profit:31000}, {m:'May', rev:446500, profit:33400},
          {m:'Jun', rev:438200, profit:29900}, {m:'Jul', rev:459200, profit:35200}, {m:'Aug', rev:400000, profit:30881, partial:true, projRev:476900, projProfit:36800} ],
  // daily revenue Aug 1–26 (counter + delivered orders)
  daily:[9800,0,14200,16900,36100,13300,38950,13500,0,36500,3820,31400,8880,17200,50400,6200,768,26192,45000,600,9100,3940,3650,840,7140,5620],

  // ---- cash position ----
  cash:{ bank:86240, gcash:12450, drawerExpected:5620, safety:40000 },

  // ---- customers who owe (all past due) ----
  receivables:[
    {id:'INV-0412', cust:'Riverside Builders', contact:'Engr. Paolo Mendoza', amount:77240, days:34, issued:'8 Jul', due:'23 Jul', terms:'15 days', reminders:2, lastPaid:'Usually pays about 20 days late, after a call', share:0.44},
    {id:'INV-0418', cust:'Bayview Construction', contact:'Engr. Lea Ramos', amount:45144, days:21, issued:'21 Jul', due:'5 Aug', terms:'15 days', reminders:1, lastPaid:'Paid the last 3 invoices within a week of the first reminder', share:0.26},
    {id:'INV-0425', cust:'Cavite Steel Works', contact:'Mr. Arnel Cruz', amount:38304, days:12, issued:'30 Jul', due:'14 Aug', terms:'15 days', reminders:1, lastPaid:'New customer; this is their second order', share:0.22},
    {id:'INV-0431', cust:'Corazon Welding', contact:'Ms. Corazon Lim', amount:14280, days:5, issued:'6 Aug', due:'21 Aug', terms:'15 days', reminders:0, lastPaid:'Promised to pay on 28 Aug by GCash', share:0.08}
  ],
  // ---- what the shop owes ----
  payables:[
    {id:'CHQ-004512', sup:'Metro Steel Co.', what:'Cheque · deposit on PO-0870', amount:15400, due:'27 Aug', dueIdx:1, status:'Cheque issued, clears tomorrow'},
    {id:'PO-0870-B', sup:'Metro Steel Co.', what:'Balance on delivery of 20 I-beams', amount:33500, due:'2 Sep', dueIdx:7, status:'Delivery moved from 29 Aug (port delay)'},
    {id:'PO-0866', sup:'Quezon Fasteners', what:'400 kg concrete nails, received 25 Aug', amount:22400, due:'11 Sep', dueIdx:16, status:'Received, matches the order'},
    {id:'BILL-2231', sup:'Cebu Aggregates', what:'July cement and sand', amount:31860, due:'15 Sep', dueIdx:20, status:'Bill on file'},
    {id:'PO-0841', sup:'Balintawak Wire Supply', what:'Galvanized and tie wire, cash on delivery', amount:9840, due:'On delivery', dueIdx:2, status:'Delivery 1 day late'}
  ],

  // ---- orders ----
  stages:['To confirm','Preparing','On the way','Delivered','Billed','Paid'],
  orders:[
    {id:'PO-0877', who:'Cebu Aggregates', side:'buy', amount:63056, stage:0, note:'Answer by 28 Aug, price ends', tone:'r', items:'220 bags cement, 14 cu.m sand'},
    {id:'SO-0301', who:'Bayview Construction', side:'sell', amount:34720, stage:1, note:'Deliver 27 Aug', tone:'y', items:'560 pcs rebar 10mm'},
    {id:'SO-0302', who:'Manila Bay Scaffolding', side:'sell', amount:5712, stage:1, note:'Deliver 28 Aug', tone:'y', items:'68 pcs angle bars'},
    {id:'PO-0870', who:'Metro Steel Co.', side:'buy', amount:48900, stage:2, note:'Arrives 2 Sep, port delay', tone:'y', items:'20 lengths I-beams'},
    {id:'PO-0841', who:'Balintawak Wire Supply', side:'buy', amount:9840, stage:2, note:'Supplier 1 day late', tone:'r', items:'60 rolls galvanized wire, 30 rolls tie wire'},
    {id:'PO-0866', who:'Quezon Fasteners', side:'buy', amount:22400, stage:3, note:'Pay by 11 Sep', tone:'y', items:'400 kg concrete nails'},
    {id:'INV-0412', who:'Riverside Builders', side:'sell', amount:77240, stage:4, note:'Payment 34 days late', tone:'r', items:'1,000 pcs rebar 12mm, 144 angle bars'},
    {id:'INV-0418', who:'Bayview Construction', side:'sell', amount:45144, stage:4, note:'Payment 21 days late', tone:'r', items:'198 bags cement'},
    {id:'INV-0425', who:'Cavite Steel Works', side:'sell', amount:38304, stage:4, note:'Payment 12 days late', tone:'r', items:'16 lengths I-beams'},
    {id:'INV-0431', who:'Corazon Welding', side:'sell', amount:14280, stage:4, note:'Payment 5 days late', tone:'r', items:'168 pcs angle bars'},
    {id:'INV-0402', who:'San Pedro Hardware', side:'sell', amount:12400, stage:5, note:'Paid 22 Aug', tone:'g', items:'100 boxes welding rods'}
  ],

  // ---- stock (unit cost and price in pesos, avg units sold per day, supplier lead time in days) ----
  stock:[
    {sku:'PC-40', name:'Portland Cement 40kg', unit:'bags', on:12, reorder:30, cost:184, price:228, perDay:6.5, lead:3, sup:'Cebu Aggregates', open:'PO-0877 waiting for your OK'},
    {sku:'GW-12', name:'Galvanized Wire 12ga', unit:'rolls', on:6, reorder:25, cost:430, price:520, perDay:1.4, lead:5, sup:'Balintawak Wire Supply', open:'PO-0841 is 1 day late'},
    {sku:'TW-01', name:'Tie Wire 1kg', unit:'rolls', on:18, reorder:20, cost:70, price:95, perDay:2.0, lead:5, sup:'Balintawak Wire Supply', open:'PO-0841 is 1 day late'},
    {sku:'RB-12', name:'Steel Rebar 12mm', unit:'pcs', on:480, reorder:200, cost:50, price:64, perDay:22, lead:4, sup:'Metro Steel Co.', open:''},
    {sku:'AB-01', name:'Angle Bars', unit:'pcs', on:85, reorder:40, cost:60, price:85, perDay:5, lead:4, sup:'Metro Steel Co.', open:''},
    {sku:'WR-32', name:'Welding Rods 3.2mm', unit:'boxes', on:42, reorder:20, cost:88, price:120, perDay:2.2, lead:3, sup:'Quezon Fasteners', open:'', flag:'6 boxes missing at the 25 Aug count'},
    {sku:'CN-02', name:'Concrete Nails 2"', unit:'kg', on:380, reorder:100, cost:41, price:56, perDay:9, lead:3, sup:'Quezon Fasteners', open:''},
    {sku:'IB-01', name:'Structural I-Beams', unit:'lengths', on:14, reorder:10, cost:2300, price:2850, perDay:0.4, lead:7, sup:'Metro Steel Co.', open:'20 more arriving 2 Sep (PO-0870)'}
  ],

  // ---- expenses (month to date vs 3-month average) ----
  expenses:[
    {cat:'Rent', amt:18000, avg:18000}, {cat:'Salaries', amt:14000, avg:14000}, {cat:'Electricity', amt:8940, avg:5923, flag:true},
    {cat:'Repairs', amt:5500, avg:2100}, {cat:'Internet & phone', amt:1299, avg:1299}, {cat:'Fuel & transport', amt:830, avg:1950},
    {cat:'Water', amt:820, avg:790}, {cat:'Supplies', amt:640, avg:700}, {cat:'Bank & GCash fees', amt:150, avg:140}
  ],
  electricity:[ {m:'May', kwh:480, amt:5980}, {m:'Jun', kwh:471, amt:5910}, {m:'Jul', kwh:468, amt:5880}, {m:'Aug', kwh:712, amt:8940} ],

  // ---- staff and cash counts ----
  staff:[
    {name:'Liza Santos', ini:'LS', role:'Cashier', counts:5, net:0, discounts:0, note:'All counts within ₱20'},
    {name:'Rico Reyes', ini:'RR', role:'Cashier and driver', counts:3, net:-800, discounts:490, note:'₱800 short on 24 Aug'}
  ],
  counts:[ // newest first
    {d:'26 Aug', who:'Liza Santos', exp:5620, got:null},
    {d:'25 Aug', who:'Liza Santos', exp:6620, got:6620},
    {d:'24 Aug', who:'Rico Reyes', exp:1840, got:1040},
    {d:'23 Aug', who:'Liza Santos', exp:4650, got:4670},
    {d:'22 Aug', who:'Liza Santos', exp:3320, got:3320, edited:'Typo fixed by Ben on 23 Aug (₱3,020 → ₱3,320)'},
    {d:'21 Aug', who:'Rico Reyes', exp:1650, got:1650},
    {d:'20 Aug', who:'Liza Santos', exp:1600, got:1580},
    {d:'19 Aug', who:'Rico Reyes', exp:7660, got:7660}
  ],
  rico24:{ day:'Monday, 24 August', who:'Rico Reyes', fund:1000, sales:[['WR-32','Welding Rods 3.2mm',7,120]], paidOut:0, expected:1840, counted:1040,
           bills:'₱1,000 × 1 · ₱20 × 2', findings:['Only 1 sale recorded all day, which is low for a Monday (average Monday: 9 sales).','The 25 Aug stock count found 6 boxes of Welding Rods 3.2mm (₱720) fewer than the records.','No cash was paid out or deposited that day.','Rico\'s other 2 counts this month matched to the peso.'] },

  // ---- what changed since yesterday ----
  deltas:[
    {t:'Sales yesterday', v:'₱7,140', note:'4 sales, 1 by GCash', tone:'g'},
    {t:'Corazon Welding', v:'now 5 days late', note:'₱14,280, promised for 28 Aug', tone:'r'},
    {t:'Metro Steel delivery', v:'moved to 2 Sep', note:'port delay, balance ₱33,500 moves too', tone:'y'},
    {t:'Quezon Fasteners', v:'delivered', note:'400 kg nails, matches the order', tone:'g'},
    {t:'Stock count', v:'6 welding rods missing', note:'counted by Liza, 25 Aug', tone:'r'}
  ],

  // ---- prototype answers for "Ask Nifti" (sample responses written from this data) ----
  ask:[
    {q:'Am I making more than last month?', a:'Yes, slightly. August profit is ₱30,881 after 26 days, on pace for about ₱36,800. July finished at ₱35,200, so you are about 4.5% ahead. Sales are up 4% on the same 26 days, but two costs ate into it: electricity (₱3,017 above normal) and repairs (₱3,400 above normal).', src:'Sales 1–26 Aug, expenses, July close'},
    {q:'Who should I collect from first?', a:'Riverside Builders: ₱77,240, 34 days late, 44% of everything owed to you. They usually pay after a phone call, and two written reminders have not worked. Next: Bayview Construction (₱45,144, 21 days), who pay within a week of a reminder, and you deliver to them tomorrow, so ask in person.', src:'Receivables, payment history'},
    {q:'Can I cover the Metro Steel cheque tomorrow?', a:'Yes. The ₱15,400 cheque clears against ₱86,240 in BDO, leaving ₱70,840. The pinch comes later: on 2 Sep, after salaries, rent and the ₱33,500 Metro Steel balance, bank plus GCash drops to about ₱39,700, just under your ₱40,000 safety line. Collecting even half of Riverside Builders\' ₱77,240 before then keeps you safely above it.', src:'Bank balance, cash forecast, payables'},
    {q:'What should I reorder this week?', a:'Cement first: 12 bags left, you sell about 6.5 a day, so you run out on 28 Aug. The Cebu Aggregates order (PO-0877) already covers it; confirm it by 28 Aug. Galvanized wire: 6 rolls, about 4 days left, and Balintawak is late. If they miss tomorrow, buy 20 rolls from Quezon Fasteners. Do not reorder I-beams: you have 35 days of stock and 20 more are coming.', src:'Stock, sales rate, open orders'},
    {q:'Is any cash missing?', a:'One day stands out: 24 Aug, counted by Rico Reyes, ₱800 short. The next day\'s stock count found 6 boxes of welding rods (₱720) missing, the item Rico sold that day. It is one event, not a pattern yet: his other two counts matched. Ask Liza to recount the rod shelf and talk to Rico before deciding anything.', src:'Cash counts, stock counts, sales 24 Aug'}
  ]
};

// ---- derived numbers ----
D.receivablesTotal = D.receivables.reduce((a,r) => a + r.amount, 0);
D.payablesTotal = D.payables.reduce((a,p) => a + p.amount, 0);
D.cash.total = D.cash.bank + D.cash.gcash;
D.stock.forEach(s => { s.value = s.on * s.cost; s.cover = s.on / s.perDay; s.risk = s.cover < s.lead ? 'r' : s.cover < s.lead * 2 ? 'y' : 'g'; });
D.stockValue = D.stock.reduce((a,s) => a + s.value, 0);
D.expenseTotal = D.expenses.reduce((a,e) => a + e.amt, 0);
// 14-day cash forecast (bank + GCash), 27 Aug – 9 Sep. Counter cash adds about ₱2,500 a day after restocking and daily costs.
D.forecastDays = ['27 Aug','28 Aug','29 Aug','30 Aug','31 Aug','1 Sep','2 Sep','3 Sep','4 Sep','5 Sep','6 Sep','7 Sep','8 Sep','9 Sep'];
D.forecastEvents = [
  {i:0, amt:-15400, label:'Metro Steel cheque'}, {i:1, amt:14280, label:'Corazon Welding promised'}, {i:1, amt:-9840, label:'Balintawak COD (if delivered)'},
  {i:4, amt:-14000, label:'Salaries'}, {i:5, amt:-18000, label:'Rent'}, {i:6, amt:-33500, label:'Metro Steel balance'}
];
function forecast(extra){
  let bal = D.cash.total; const out = [];
  D.forecastDays.forEach((d,i) => { let net = 2500; const ev = D.forecastEvents.filter(e => e.i === i).concat((extra || []).filter(e => e.i === i)); ev.forEach(e => net += e.amt); bal += net; out.push({d, bal, net, ev}); });
  return out;
}
D.forecast = forecast;

// ---- formatting ----
const F = {
  peso: n => (n < 0 ? '−' : '') + '₱' + Math.round(Math.abs(n)).toLocaleString('en-PH'),
  k: n => { const a = Math.abs(n), s = n < 0 ? '−' : ''; return a >= 1e6 ? s + '₱' + (a/1e6).toFixed(2).replace(/\.?0+$/,'') + 'M' : a >= 1000 ? s + '₱' + (a/1000).toFixed(a >= 100000 ? 0 : 1).replace(/\.0$/,'') + 'K' : s + '₱' + a; },
  signed: n => (n > 0 ? '+' : n < 0 ? '−' : '') + '₱' + Math.round(Math.abs(n)).toLocaleString('en-PH'),
  pct: (n, d) => Math.round(n * 100 * (d ? 10 : 1)) / (d ? 10 : 1) + '%',
  esc: s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
  days: n => n.toFixed(n < 10 ? 1 : 0).replace(/\.0$/,'') + (Math.abs(n - 1) < .05 ? ' day' : ' days')
};

// ---- tiny SVG helpers (charts always carry real values and labels) ----
const SVG = {
  spark(vals, w, h, opt){ opt = opt || {}; const mx = Math.max(...vals), mn = opt.zero ? 0 : Math.min(...vals), r = (mx - mn) || 1;
    const pts = vals.map((v,i) => [i * (w - 2) / (vals.length - 1) + 1, h - 2 - (v - mn) / r * (h - 4)]);
    const d = pts.map((p,i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const last = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${F.esc(opt.label || 'trend')}">${opt.area ? `<path d="${d} L${last[0]} ${h} L1 ${h} Z" fill="currentColor" opacity=".12"/>` : ''}<path d="${d}" fill="none" stroke="currentColor" stroke-width="${opt.sw || 1.6}" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${last[0]}" cy="${last[1]}" r="2.4" fill="currentColor"/></svg>`; },
  bars(vals, w, h, opt){ opt = opt || {}; const mx = Math.max(...vals) || 1, bw = w / vals.length;
    return `<svg class="minibars" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${F.esc(opt.label || 'bars')}">${vals.map((v,i) => { const bh = Math.max(v ? 1.5 : 0, v / mx * (h - 2)); return `<rect x="${(i * bw + bw * .15).toFixed(1)}" y="${(h - bh).toFixed(1)}" width="${(bw * .7).toFixed(1)}" height="${bh.toFixed(1)}" rx="1" fill="currentColor" opacity="${opt.hi === i ? 1 : .45}"/>`; }).join('')}</svg>`; }
};

// ---- prototype actions: never pretend something real happened ----
function proto(what){ LAB.toast('Prototype: in Nifti, "' + what + '" would run here. Nothing was sent or saved.'); }

window.ND = D; window.F = F; window.SVG = SVG; window.proto = proto;
})();
