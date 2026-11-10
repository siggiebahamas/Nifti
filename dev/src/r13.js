/* ===== Round 13: the Focus order popup =====
   One order, one next step. Big plain title, choices as tiles and chips, one green button.
   The button stays locked and says what is missing ("Pick who delivers it") until the step is ready.
   Every action still runs the app's own save code (the same forms as before, filled in for you),
   so nothing about how orders are saved changes. */
const NFF_STEPS = ['To confirm', 'Preparing', 'On the way', 'Delivered', 'Billed', 'Paid'];
const NFF = {key: '', id: '', sell: false, v: {}, view: 'step', busy: false, last: {}, justDone: ''};
const NFF_IC = {
  clip: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4h6v3H9zM9 13.5l2 2 4-4"/>',
  box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  truck: '<path d="M2 6h12v10H2zM14 10h4.5L22 13.5V16h-8z"/><circle cx="6" cy="17.5" r="2"/><circle cx="18" cy="17.5" r="2"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><path d="M9.2 9.8l2 2 3.8-3.8"/>',
  receipt: '<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z"/><path d="M9 7.5h6M9 11h6M9 14.5h3.5"/>',
  paid: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="M15 6l-6 6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  img: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  bike: '<circle cx="5.5" cy="16.5" r="3"/><circle cx="18.5" cy="16.5" r="3"/><path d="M5.5 16.5 9 10h5.5l4 6.5M9 10 7.5 6.5H5M14.5 10l-1.2-3.5H16"/>',
  store: '<path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M9.5 20v-6h5v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
  courier: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M7.5 5.2l9 4.5M3 7.5 12 12l9-4.5M12 12v9"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M5.5 9.5v5M18.5 9.5v5"/>',
  gcash: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18h3"/>',
  bank: '<path d="M3 10h18M5 10v7.5M9.5 10v7.5M14.5 10v7.5M19 10v7.5M3 20.5h18M12 3l9 5H3z"/>',
  cheque: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 14h5M15 11h3"/>',
  msg: '<path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.3-4.4A7.5 7.5 0 1 1 20 11.5z"/>',
  print: '<path d="M6 9V3h12v6M6 17H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-2M7 14h10v7H7z"/>',
  bell: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  again: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  dl: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>', up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  sign: '<path d="M3 17c3-1 4-6 6-6s1 6 4 6 3-3 5-3 2 2 3 2"/><path d="M3 21h18"/>', ret: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  stop: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>'
};
const nffI = (n, c) => `<svg class="nff-i${c ? ' ' + c : ''}" viewBox="0 0 24 24" aria-hidden="true">${NFF_IC[n] || ''}</svg>`;
const nffE = s => escapeHtml(String(s == null ? '' : s));
const nffShort = d => d ? stmtDate(d).replace(/, \d{4}$/, '') : '';
function nffDay(d){ try{ const x = new Date(String(d).slice(0, 10) + 'T00:00:00'); return x.toLocaleDateString('en-PH', {weekday: 'short', month: 'short', day: 'numeric'}); }catch(e){ return nffShort(d); } }
function nffStepOf(o, sell){
  if(o.status === 'cancelled') return -1;
  if(o.status === 'paid' || (o.invoice && o.invoice.status === 'paid')) return 5;
  if(o.invoice || o.status === 'invoiced') return 4;
  if(['delivered', 'partially_delivered'].includes(o.status)) return 3;
  if(['shipped', 'in_customs'].includes(o.status)) return (!sell && o.deliveryConfirmation) ? 3 : 2;
  if(['confirmed', 'preparing'].includes(o.status)) return 1;
  return 0;
}
function nffPoss(n){ n = String(n || ''); return /s$/i.test(n) ? n + "'" : n + "'s"; }
function nffFirst(name){ const w = String(name || '').replace(/\b(co|corp|inc|corporation|company)\.?$/i, '').trim().split(/\s+/); return w.length > 2 ? w.slice(0, 2).join(' ') : w.join(' '); }
function nffHave(name){
  try{ const n = String(name).toLowerCase().trim(); const rows = (typeof inventoryData !== 'undefined' ? inventoryData : []).filter(i => String(i.name).toLowerCase().trim() === n);
    return rows.length ? rows.reduce((s, i) => s + (Number(i.onHand) || 0), 0) : null; }catch(e){ return null; }
}
function nffHistDate(o, rx){ const h = (o.history || []).slice().reverse().find(x => rx.test(x.action || '')); return h ? h.date : null; }
function nffDrivers(){
  let names = [];
  try{ names = getActiveTeamMembers().filter(m => !/\(you\)/i.test(m.name)).map(m => m.name); }catch(e){}
  return names.slice(0, 2);
}
const NFF_PAY = [['cash', 'Cash', 'cash'], ['gcash', 'GCash', 'gcash'], ['bank', 'Bank', 'bank_transfer'], ['cheque', 'Check', 'check']];
const NFF_PAY_MORE = [['maya', 'Maya'], ['bank_deposit', 'Bank deposit'], ['remittance', 'Remittance'], ['grabpay', 'GrabPay'], ['shopeepay', 'ShopeePay']];

/* ---------- values typed or picked in the popup ---------- */
const nffV = (k, d) => (NFF.v[k] !== undefined ? NFF.v[k] : d);
function nffSet(k, val){ NFF.v[k] = val; }

/* ---------- what each step looks like ---------- */
function nffSpec(o, sell){
  const id = o.id, who = sell ? o.buyerName : o.supplierName, first = nffFirst(who), step = nffStepOf(o, sell);
  const q = `'${id}'`, total = poTotal(o), amend = typeof pendingAmendment === 'function' && pendingAmendment(o);
  const msg = {ic: 'msg', label: 'Message ' + first, run: `nfMessage(${q})`};
  const by = o.requestedDeliveryDate ? nffDay(o.requestedDeliveryDate) : '';
  const S = {step, turn: 'you', icon: 'clip', title: '', text: '', tasks: [], sec: [], showItems: step === 0 ? 'full' : 'line'};
  if(step === -1) return Object.assign(S, {turn: 'done', icon: 'stop', title: 'This order was cancelled', text: 'Nothing left to do. You can still see what was in it below.', sec: [msg], showItems: 'full', cancelled: true});

  if(sell){
    if(amend) return Object.assign(S, {icon: 'edit', title: `${first} wants to change this order`, text: 'Look at the change below, then say yes or no.',
      primary: {label: 'Yes, accept the change', run: `respondAmendment(${q}, true)`}, quiet: {label: 'No, keep it as it is', run: `respondAmendment(${q}, false)`}, showItems: 'full'});
    if(o.rma && o.rma.status === 'open') return Object.assign(S, {icon: 'ret', title: `${first} returned something`, text: 'Settle it with a credit or a replacement.',
      primary: {label: 'Settle the return', inline: `openResolveRmaForm(${q})`}, sec: [msg]});
    const awaiting = []; (o.depositPayments || []).forEach((p, i) => { if(paymentNeedsSupplierAction(p)) awaiting.push(['deposit', p, i]); });
    ((o.invoice && o.invoice.payments) || []).forEach((p, i) => { if(paymentNeedsSupplierAction(p)) awaiting.push(['invoice', p, i]); });
    if(awaiting.length) return Object.assign(S, {step: Math.max(step, 0), icon: 'cash', title: `${first} says they paid`, text: 'Check your GCash or bank app first. Then tell Nifti if the money arrived.',
      tasks: [{type: 'confirmpay', list: awaiting}], sec: [msg]});
    switch(o.status){
      case 'sent': return Object.assign(S, {title: 'Can you fill this order?', text: `${first} wants ${o.lineItems.length} item${o.lineItems.length > 1 ? 's' : ''}${by ? ' by ' + by : ''}.`,
        tasks: [{type: 'items', stock: true}], showItems: 'none',
        primary: {label: 'Yes, I can fill it', run: `confirmSupplierPO(${q})`},
        sec: [{ic: 'edit', label: 'Change price or quantity', inline: `openCounterForm(${q})`}, {ic: 'box', label: 'Send only part', inline: `openPartialConfirmForm(${q})`}, {ic: 'cash', label: 'Ask for a deposit first', inline: `openDepositRequestForm(${q})`}],
        quiet: {label: "No, I can't fill it", run: `cancelOrder(${q}, 'supplier')`, bad: 1}});
      case 'quote': return Object.assign(S, {turn: 'them', icon: 'clip', title: `Waiting for ${first} to say yes`, text: 'You sent this for their OK. Nifti reminds them for you.',
        tasks: [{type: 'hand', label: `${nffPoss(first)} turn`, sub: `Sent ${nffShort(o.createdDate)} · we'll tell you when they answer`}],
        wait: {ic: 'bell', label: 'Nudge them', run: `qtNudge(${q})`}, sec: [{ic: 'check', label: 'They said yes', run: `qtOpen(${q})`}, msg]});
      case 'countered': return Object.assign(S, {icon: 'edit', title: `${first} wants a different price`, text: 'Accept their price, or offer another one.', showItems: 'full',
        primary: {label: 'Accept their price', run: `acceptCounter(${q}, 'supplier')`}, sec: [{ic: 'edit', label: 'Offer another price', inline: `openNegotiateForm(${q}, 'supplier')`}],
        quiet: {label: 'Say no', run: `rejectCounter(${q}, 'supplier')`, bad: 1}});
      case 'confirmed': case 'preparing': {
        const drivers = nffDrivers(), how = nffV('how', null);
        const tasks = [{type: 'tiles', id: 'how', label: 'Who delivers it?', req: 1, need: 'Pick who delivers it', options: [['truck', 'Our truck', 'truck'], ['bike', 'Lalamove', 'lalamove'], ['courier', 'Courier', 'courier'], ['store', 'They pick up', 'pickup']]}];
        if(how === 'truck') tasks.push({type: 'chips', id: 'driver', label: 'Driver', def: drivers[0] || 'other', options: drivers.map(d => [d, d]).concat([['other', 'Someone else']])});
        if(how === 'truck' && nffV('driver', drivers[0] || 'other') === 'other') tasks.push({type: 'text', id: 'drivername', label: "Driver's name", ph: 'e.g. Rico Reyes', req: 1, need: "Type the driver's name"});
        if(how === 'courier') tasks.push({type: 'text', id: 'carrier', label: 'Which courier?', ph: 'e.g. LBC, J&T, 2GO', req: 1, need: 'Type the courier name'}, {type: 'text', id: 'track', label: 'Tracking number', ph: 'If they gave one', opt: 1});
        const req = o.requestedDeliveryDate && o.requestedDeliveryDate.slice(0, 10) > addDaysIso(APP_TODAY, 1) ? o.requestedDeliveryDate.slice(0, 10) : null;
        tasks.push({type: 'chips', id: 'eta', label: how === 'pickup' ? 'They pick it up' : 'It arrives', def: 'today', options: [['today', 'Today'], ['tomorrow', 'Tomorrow']].concat(req ? [[req, nffDay(req)]] : []).concat([['pick', 'Another day']])});
        if(nffV('eta', 'today') === 'pick') tasks.push({type: 'date', id: 'etadate', label: 'Pick the day', req: 1, need: 'Pick the day it arrives'});
        tasks.push({type: 'photo', id: 'photo', label: 'Photo of the waybill or delivery receipt', opt: 1});
        return Object.assign(S, {icon: 'box', title: 'Pack it and send it out', text: 'Choose how it goes out. Tap the green button when it leaves.', tasks,
          primary: {label: "It left. It's on the way", act: 'ship'}, sec: [{ic: 'print', label: 'Print delivery receipt', run: `generateDeliveryReceipt(${q})`}, msg]});
      }
      case 'in_customs': return Object.assign(S, {icon: 'truck', title: 'At customs', text: 'Update it when it clears customs.', primary: {label: 'Update customs', inline: `openCustomsForm(${q})`}, sec: [msg]});
      case 'shipped': {
        const sh = o.shipping || {}, proof = nffV('proof', null);
        const tasks = [{type: 'track', carrier: sh.carrier, eta: sh.eta, track: sh.tracking}, {type: 'text', id: 'rcv', label: 'Who received it?', ph: 'Name of the person who signed', req: 1, need: 'Type who received it'},
          {type: 'tiles', id: 'proof', label: 'Proof it arrived', req: 1, need: 'Add a signature or a photo', options: [['sign', 'They sign here', 'sign'], ['cam', 'Photo of the signed receipt', 'photo']]}];
        if(proof === 'sign') tasks.push({type: 'sign', id: 'sig', req: 1, need: 'Have them sign in the box'});
        if(proof === 'photo') tasks.push({type: 'photo', id: 'photo', label: 'Photo of the signed receipt', req: 1, need: 'Add the photo of the signed receipt'});
        if(!o.invoice){ tasks.push({type: 'chips', id: 'cod', label: 'Did they pay when it arrived?', def: 'no', opt: 1, options: [['no', 'Not yet'], ['cash', 'Cash'], ['gcash', 'GCash'], ['bank_transfer', 'Bank']]});
          if(nffV('cod', 'no') !== 'no') tasks.push({type: 'money', id: 'codamt', label: 'How much did they pay?', def: total, req: 1, need: 'Type how much they paid'}); }
        return Object.assign(S, {icon: 'truck', title: 'Get it signed when it arrives', text: sh.eta ? `It should arrive ${nffDay(sh.eta)}.` : 'When it arrives, get it signed.', tasks,
          primary: {label: 'It arrived', act: 'delivered'}, sec: [msg]});
      }
      case 'partially_delivered': return Object.assign(S, {icon: 'pin', title: 'Only part of it arrived', text: 'Settle the short items first, then send the bill.',
        primary: {label: 'Settle the short items', run: `acknowledgePartialDelivery(${q})`}, sec: [msg]});
      case 'delivered': {
        const due = (typeof computeInvoiceDueDate === 'function' && myBusiness) ? computeInvoiceDueDate(o) : null;
        return Object.assign(S, {icon: 'pin', title: 'Send the bill', text: `One tap makes the bill and sends it to ${first}.`, tasks: [{type: 'bill', total, due, items: o.lineItems.length}],
          primary: {label: 'Send the bill', run: `issueInvoice(${q})`}, sec: [{ic: 'print', label: 'Print delivery receipt', run: `generateDeliveryReceipt(${q})`}, msg]});
      }
      case 'invoiced': {
        const pay = computeInvoicePayments(o);
        return Object.assign(S, {turn: 'them', icon: 'receipt', title: `Waiting for ${first} to pay`, text: 'When the money comes in, record it here.',
          tasks: [{type: 'due', total: pay.balance, of: pay.totalPaid > 0 ? total : 0, due: o.invoice && o.invoice.dueDate}].concat(nffPayTasks(pay.balance, true)),
          primary: {label: 'Record the payment', act: 'pay'}, sec: [{ic: 'bell', label: 'Send a friendly reminder', run: `sendPaymentReminder(${q})`}, msg]});
      }
      case 'paid': return Object.assign(S, {turn: 'done', icon: 'paid', title: 'Paid in full', text: `${bkPeso(total)} received. This order is complete.`, tasks: [{type: 'summary'}], showItems: 'line',
        primary: {label: 'Print the receipt', run: `generateReceipt(${q})`, last: 1}, sec: [msg]});
    }
  } else {
    if(amend) return Object.assign(S, {turn: 'them', icon: 'edit', title: `Waiting for ${first} to answer your change`, text: 'They will say yes or no.',
      tasks: [{type: 'hand', label: `${nffPoss(first)} turn`, sub: 'We will tell you when they answer'}], wait: msg, sec: []});
    if(o.rma && o.rma.status === 'open') return Object.assign(S, {turn: 'them', icon: 'ret', title: `Waiting for ${first} to settle your return`, text: 'They will send a credit or a replacement.',
      tasks: [{type: 'hand', label: `${nffPoss(first)} turn`, sub: 'We will tell you when they settle it'}], wait: msg, sec: []});
    switch(o.status){
      case 'draft': return Object.assign(S, {icon: 'clip', title: 'Send this order', text: `Check the items, then send it to ${first}.`, tasks: [{type: 'items'}], showItems: 'none',
        primary: {label: 'Send to ' + first, run: `openSendConfirmModal(${q})`}, sec: [{ic: 'edit', label: 'Edit items', run: `editDraftPO(${q})`}], quiet: {label: 'Delete this draft', run: `cancelOrder(${q}, 'buyer')`, bad: 1}});
      case 'sent': return Object.assign(S, {turn: 'them', icon: 'clip', title: `Waiting for ${first} to say yes`, text: 'They will say yes, or offer a new price.',
        tasks: [{type: 'hand', label: `${nffPoss(first)} turn`, sub: `Sent ${nffShort(o.createdDate)} · we'll tell you when they answer`}],
        wait: msg, sec: [{ic: 'edit', label: 'Change my order', inline: `openAmendForm(${q})`}], quiet: {label: 'Cancel this order', run: `cancelOrder(${q}, 'buyer')`, bad: 1}});
      case 'quote': return Object.assign(S, {icon: 'clip', title: `${first} sent you a price`, text: 'Check the items. Change a quantity if you need to, then confirm.',
        tasks: [{type: 'html', html: typeof qtBuyerPanel === 'function' ? qtBuyerPanel(o) : ''}], showItems: 'none', sec: [msg]});
      case 'countered': return Object.assign(S, {icon: 'edit', title: `${first} offered a new price`, text: 'Accept it, or offer your own price.', showItems: 'full',
        primary: {label: 'Accept their price', run: `acceptCounter(${q}, 'buyer')`}, sec: [{ic: 'edit', label: 'Offer another price', inline: `openNegotiateForm(${q}, 'buyer')`}],
        quiet: {label: 'Say no', run: `rejectCounter(${q}, 'buyer')`, bad: 1}});
      case 'confirmed': case 'preparing': return Object.assign(S, {turn: 'them', icon: 'box', title: o.status === 'preparing' ? `${first} is packing it` : `${first} said yes`,
        text: by ? `It should arrive ${by}.` : 'You will see it here when it leaves their warehouse.',
        tasks: [{type: 'hand', label: `${nffPoss(first)} turn`, sub: o.status === 'preparing' ? 'Packing your order now' : 'Getting your order ready'}], wait: msg, sec: [{ic: 'edit', label: 'Change my order', inline: `openAmendForm(${q})`}]});
      case 'shipped': case 'in_customs': {
        if(o.deliveryConfirmation) return Object.assign(S, {turn: 'them', icon: 'pin', title: `Waiting for ${nffPoss(first)} bill`, text: 'You got it. Nothing to do until they bill you.',
          tasks: [{type: 'stockup'}, {type: 'hand', label: `${nffPoss(first)} turn`, sub: 'They send the bill next'}], wait: {ic: 'msg', label: 'Ask for the bill', run: `nfMessage(${q})`}, sec: []});
        const sh = o.shipping || {};
        const tasks = [{type: 'track', carrier: sh.carrier, eta: sh.eta, track: sh.tracking}, {type: 'count', id: 'count', label: 'What arrived?', req: 1, need: 'Check each item'}];
        if(o.lineItems.some((li, i) => nffV('c' + i, null) === 'bad')) tasks.push({type: 'text', id: 'dcnote', label: 'What is wrong?', ph: 'e.g. 3 rolls are rusty', opt: 1});
        tasks.push({type: 'photo', id: 'photo', label: 'Photo of the delivery receipt', hint: 'Helps if anything is wrong later', opt: 1});
        return Object.assign(S, {icon: 'truck', title: 'Did it arrive?', text: 'Count what came, then confirm. Your stock updates by itself.', tasks,
          primary: {label: o.lineItems.some((li, i) => nffV('c' + i, null) === 'bad') ? 'Report what is wrong' : 'Yes, I got everything', act: 'received'}, sec: [msg]});
      }
      case 'delivered': case 'partially_delivered': return Object.assign(S, {turn: 'them', icon: 'pin', title: `Waiting for ${nffPoss(first)} bill`, text: 'Nothing to do until they bill you.',
        tasks: [{type: 'stockup'}, {type: 'hand', label: `${nffPoss(first)} turn`, sub: 'They send the bill next'}], wait: {ic: 'msg', label: 'Ask for the bill', run: `nfMessage(${q})`}, sec: [{ic: 'ret', label: 'Return something', inline: `openRmaForm(${q})`}]});
      case 'invoiced': {
        const pay = computeInvoicePayments(o), room = Math.max(0, roundPeso(pay.balance - pay.pendingAmount));
        if(room <= 0) return Object.assign(S, {turn: 'them', icon: 'receipt', title: `Waiting for ${first} to confirm`, text: `You sent ${bkPeso(pay.pendingAmount)}. Your balance goes down once they see it.`,
          tasks: [{type: 'hand', label: `${nffPoss(first)} turn`, sub: 'Checking that your payment arrived'}], wait: msg, sec: []});
        return Object.assign(S, {icon: 'receipt', title: 'Pay this bill', text: `Pay any way below, then tell ${first} here.`,
          tasks: [{type: 'due', total: room, of: pay.totalPaid > 0 || pay.pendingAmount > 0 ? total : 0, due: o.invoice && o.invoice.dueDate, pending: pay.pendingAmount}, {type: 'payto'}].concat(nffPayTasks(room, false)),
          primary: {label: 'I paid', act: 'pay'}, sec: [msg]});
      }
      case 'paid': return Object.assign(S, {turn: 'done', icon: 'paid', title: 'All paid', text: `${first} has your ${bkPeso(total)}. This order is complete.`, tasks: [{type: 'summary'}],
        primary: {label: 'Order this again', run: `reorderFromPO(${q})`, last: 1}, sec: [{ic: 'dl', label: 'Download the receipt', run: `generateReceipt(${q})`}, msg]});
    }
  }
  // anything else: the old next-step text and buttons, in the new look
  const nx = nfNextStep(o, sell) || {};
  return Object.assign(S, {title: nx.title || 'Nothing to do', text: nx.text || '', showItems: 'full',
    primary: nx.form ? {label: 'Open the form', inline: `${nx.form}(${q})`} : (nx.btns && nx.btns[0] && !nx.btns[0][2]) ? {label: nx.btns[0][0], run: nx.btns[0][1]} : null,
    sec: (nx.btns || []).slice(nx.btns && nx.btns[0] && !nx.btns[0][2] ? 1 : 0).map(b => ({ic: 'dots', label: b[0], [b[3] ? 'inline' : 'run']: b[1]}))});
}
function nffPayTasks(room, sell){
  const m = nffV('method', null), method = (NFF_PAY.find(x => x[0] === m) || [])[2] || (m && NFF_PAY_MORE.find(x => x[0] === m) ? m : null);
  const t = [{type: 'paytiles', id: 'method', label: sell ? 'How did they pay?' : 'How did you pay?', req: 1, need: sell ? 'Pick how they paid' : 'Pick how you paid'},
    {type: 'chips', id: 'part', label: 'How much?', def: 'all', options: [['all', 'All ' + bkPeso(room)], ['part', 'Only part']]}];
  if(nffV('part', 'all') === 'part') t.push({type: 'money', id: 'amt', label: 'Amount', def: '', req: 1, need: 'Type the amount', max: room});
  if(method && method !== 'cash') t.push({type: 'text', id: 'ref', label: (PAYMENT_REF_LABELS[method] || 'Reference number').replace(/^./, c => c.toUpperCase()), ph: method === 'check' ? 'e.g. 000781' : 'e.g. 5521 0087 113', req: 1, need: method === 'check' ? 'Type the check number' : 'Type the reference number', mode: 'numeric'});
  if(method === 'check') t.push({type: 'date', id: 'chkdate', label: 'Check date', def: APP_TODAY, req: 1, need: 'Pick the check date'});
  const amt = nffV('part', 'all') === 'part' ? Number(nffV('amt', 0)) || 0 : room;
  const needPhoto = !sell && amt > PAYMENT_PROOF_REQUIRED_THRESHOLD;
  t.push({type: 'photo', id: 'slip', label: sell ? 'Photo of the payment slip' : 'Screenshot or photo of your payment', hint: needPhoto ? `Needed for payments over ${bkPeso(PAYMENT_PROOF_REQUIRED_THRESHOLD)}` : 'They confirm faster with a photo', req: needPhoto ? 1 : 0, opt: needPhoto ? 0 : 1, need: 'Add a photo of your payment'});
  return t;
}

/* ---------- is the step ready? ---------- */
function nffTaskOk(o, t){
  if(!t.req) return true;
  switch(t.type){
    case 'tiles': case 'paytiles': return nffV(t.id, null) != null;
    case 'text': return String(nffV(t.id, '')).trim().length > 0;
    case 'money': { const n = Number(String(nffV(t.id, t.def)).replace(/,/g, '')); return n > 0 && (!t.max || n <= t.max + 0.001); }
    case 'date': return !!nffV(t.id, t.def || '');
    case 'photo': return !!nffV(t.id, null);
    case 'sign': return !!nffV('sigok', false);
    case 'count': return o.lineItems.every((li, i) => nffV('c' + i, null) != null);
  }
  return true;
}
function nffMissing(o, sp){ return (sp.tasks || []).filter(t => !nffTaskOk(o, t)); }
function nffNeedText(o, t){
  if(t.type === 'money' && t.max){ const n = Number(String(nffV(t.id, t.def)).replace(/,/g, '')); if(n > t.max) return 'That is more than the balance'; }
  return t.need || 'Fill in the step above';
}
function nffPrimaryLabel(o, sp){
  const p = sp.primary; if(!p) return '';
  if(p.act === 'pay'){
    const pay = computeInvoicePayments(o), room = sp.turn === 'them' ? pay.balance : Math.max(0, roundPeso(pay.balance - pay.pendingAmount));
    const amt = nffV('part', 'all') === 'part' ? Number(String(nffV('amt', 0)).replace(/,/g, '')) || 0 : room;
    const m = nffV('method', null), lab = (NFF_PAY.find(x => x[0] === m) || NFF_PAY_MORE.find(x => x[0] === m) || [])[1];
    return NFF.sell ? (lab ? `Record ${bkPeso(amt)} by ${lab}` : 'Record the payment') : `I paid ${bkPeso(amt)}`;
  }
  return p.label;
}

/* ---------- drawing ---------- */
function nffAvatar(name){ return `<span class="nff-av nf-av" aria-hidden="true">${nffE(nfInitials(name))}</span>`; }
function nffTurn(sp, first){
  if(sp.turn === 'done') return sp.cancelled ? '<span class="nff-turn off">Cancelled</span>' : `<span class="nff-turn done">${nffI('check')}Done</span>`;
  return sp.turn === 'you' ? '<span class="nff-turn you"><i></i>Your turn</span>' : `<span class="nff-turn them"><i></i><span>Waiting on <span class="nff-tl">${nffE(first)}</span><span class="nff-ts">them</span></span></span>`;
}
function nffItemsHtml(o, stock){
  const items = o.lineItems || [], sub = items.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0), total = poTotal(o);
  return `<div class="nff-items">${items.map(l => { const have = stock ? nffHave(l.product) : null, q = Number(l.qty) || 0;
      return `<div class="nff-it"><b>${nffE(l.product)}</b><strong>${bkPeso(q * (Number(l.unitPrice) || 0))}</strong><small>${q} × ${bkPeso(Number(l.unitPrice) || 0)}${have != null ? (have >= q ? ` <span class="nff-ok">${nffI('check')}You have ${have}</span>` : ` <span class="nff-short">Only ${have} in stock</span>`) : ''}</small></div>`; }).join('')}</div>
    ${Math.abs(total - sub) >= 1 ? `<div class="nff-sub"><span>Items</span><b>${bkPeso(sub)}</b></div><div class="nff-sub"><span>VAT</span><b>${bkPeso(total - sub)}</b></div>` : ''}
    <div class="nff-tot"><span>Total</span><b>${bkPeso(total)}</b></div>`;
}
function nffReceipt(o, sell, stock){
  const by = o.requestedDeliveryDate ? nffDay(o.requestedDeliveryDate) : '';
  return `<div class="nff-rcpt"><div class="nff-rh"><span>${sell ? 'What they ordered' : 'What you ordered'}</span><span>${by ? (sell ? 'Deliver by ' : 'Arrives ') + nffE(by) : ''}</span></div>${nffItemsHtml(o, stock)}
    ${o.deliveryAddress ? `<div class="nff-addr">${nffI('pin')}<span>${nffE(o.deliveryAddress)}</span></div>` : ''}</div>`;
}
function nffLine(o, sell){
  const items = o.lineItems || [];
  return `<details class="nff-line"><summary><span><b>${items.length} item${items.length === 1 ? '' : 's'}</b> · ${nffE(items.map(l => l.product).join(', '))}</span><b>${bkPeso(poTotal(o))}</b>${nffI('down', 'nff-chev')}</summary>${nffReceipt(o, sell, false)}</details>`;
}
function nffLabel(t){ return t.label ? `<div class="nff-lbl"><span>${nffE(t.label)}</span>${t.opt ? '<small>Optional</small>' : ''}</div>` : ''; }
function nffTaskHtml(o, sell, t){
  const k = t.id;
  switch(t.type){
    case 'items': return nffReceipt(o, sell, !!t.stock);
    case 'html': return `<div class="nff-raw">${t.html}</div>`;
    case 'tiles': return `<div class="nff-task" data-t="${k}">${nffLabel(t)}<div class="nff-tiles n${t.options.length}">${t.options.map(x => `<button type="button" class="nff-tile${nffV(k, null) === x[2] ? ' on' : ''}" data-nff="pick" data-k="${k}" data-v="${nffE(x[2])}">${nffI(x[0])}<span>${nffE(x[1])}</span></button>`).join('')}</div></div>`;
    case 'paytiles': { const v = nffV(k, null), more = NFF_PAY_MORE.find(x => x[0] === v);
      return `<div class="nff-task" data-t="${k}">${nffLabel(t)}<div class="nff-tiles n4">${NFF_PAY.map(x => `<button type="button" class="nff-tile${v === x[0] ? ' on' : ''}" data-nff="pick" data-k="${k}" data-v="${x[0]}">${nffI(x[0])}<span>${x[1]}</span></button>`).join('')}</div>
        <details class="nff-more-ways"${more ? ' open' : ''}><summary>Paid another way?</summary><div class="nff-chips">${NFF_PAY_MORE.map(x => `<button type="button" class="nff-chip${v === x[0] ? ' on' : ''}" data-nff="pick" data-k="${k}" data-v="${x[0]}">${x[1]}</button>`).join('')}</div></details></div>`; }
    case 'chips': return `<div class="nff-task" data-t="${k}">${nffLabel(t)}<div class="nff-chips">${t.options.map(x => `<button type="button" class="nff-chip${nffV(k, t.def) === x[0] ? ' on' : ''}" data-nff="pick" data-k="${k}" data-v="${nffE(x[0])}">${nffE(x[1])}</button>`).join('')}</div></div>`;
    case 'text': return `<div class="nff-task" data-t="${k}">${nffLabel(t)}<input class="nff-in" type="text" data-nff-in="${k}" value="${nffE(nffV(k, ''))}" placeholder="${nffE(t.ph || '')}" maxlength="80"${t.mode ? ` inputmode="${t.mode}"` : ''} autocomplete="off"></div>`;
    case 'money': return `<div class="nff-task" data-t="${k}">${nffLabel(t)}<div class="nff-money"><span>₱</span><input type="text" inputmode="decimal" data-nff-in="${k}" value="${nffE(nffV(k, t.def))}" placeholder="0" autocomplete="off"></div>${t.max ? `<div class="nff-hint">Balance: ${bkPeso(t.max)}</div>` : ''}</div>`;
    case 'date': return `<div class="nff-task" data-t="${k}">${nffLabel(t)}<input class="nff-in" type="date" data-nff-in="${k}" value="${nffE(nffV(k, t.def || ''))}" min="${t.id === 'chkdate' ? '' : APP_TODAY}"></div>`;
    case 'photo': { const p = nffV(k, null);
      return `<div class="nff-task" data-t="${k}">${nffLabel(t)}${p ? `<div class="nff-photo on"><img alt="" src="${p}"><div><b>Photo added</b><span>It is saved with this order.</span></div><button type="button" class="nff-link" data-nff="unphoto" data-k="${k}">Remove</button></div>`
        : `<div class="nff-photo-2"><button type="button" class="nff-pbtn" data-nff="shoot" data-k="${k}">${nffI('cam')}<span><b>Take a photo</b><small>Use the camera</small></span></button>
          <label class="nff-pbtn">${nffI('img')}<span><b>Attach a photo</b><small>From your gallery or files</small></span><input type="file" accept="image/*" hidden data-nf-cam="1" data-nf-own="1" data-nff-file="${k}"></label></div>
          ${t.hint ? `<div class="nff-hint">${nffE(t.hint)}</div>` : ''}`}</div>`; }
    case 'sign': return `<div class="nff-task" data-t="sig"><div class="nff-lbl"><span>Signature</span><button type="button" class="nff-link" data-nff="unsign">Clear</button></div><canvas class="nff-sig" id="nffSig" width="640" height="220"></canvas><div class="nff-hint">Hand them the phone, or sign with the mouse.</div></div>`;
    case 'count': return `<div class="nff-task" data-t="count">${nffLabel(t)}<div class="nff-count">${o.lineItems.map((li, i) => { const v = nffV('c' + i, null), q = Number(li.qty) || 0;
        return `<div class="nff-cr${v === 'bad' ? ' bad' : ''}"><div class="nff-cr-h"><div><b>${nffE(li.product)}</b><small>${q} ordered</small></div><div class="nff-yn"><button type="button" class="y${v === 'ok' ? ' on' : ''}" data-nff="pick" data-k="c${i}" data-v="ok">${nffI('check')}All ${q} here</button><button type="button" class="n${v === 'bad' ? ' on' : ''}" data-nff="pick" data-k="c${i}" data-v="bad">Problem</button></div></div>
          ${v === 'bad' ? `<div class="nff-cr-q"><label>How many arrived?<input type="text" inputmode="numeric" data-nff-in="got${i}" value="${nffE(nffV('got' + i, q))}"></label><label>How many are damaged?<input type="text" inputmode="numeric" data-nff-in="dmg${i}" value="${nffE(nffV('dmg' + i, 0))}"></label></div>` : ''}</div>`; }).join('')}</div></div>`;
    case 'track': return `<div class="nff-card nff-track"><span class="nff-dot">${nffI('truck')}</span><div><b>${nffE(t.carrier || 'On the way')}</b><span>${t.eta ? 'Arrives ' + nffE(nffDay(t.eta)) : 'On its way'}${t.track && t.track !== '—' ? ' · #' + nffE(t.track) : ''}</span></div></div>`;
    case 'hand': { const who = NFF.sell ? o.buyerName : o.supplierName;
      return `<div class="nff-hand"><div class="nff-hand-row"><span class="nff-hand-me">${nffI('check')}<small>You</small></span><span class="nff-hand-line"><i></i>${nffI('arrow')}</span><span class="nff-hand-them">${nffAvatar(who)}</span></div>
        <div class="nff-hand-t"><b>${nffE(t.label)}</b><span>${nffE(t.sub || '')}</span></div><div class="nff-hand-note">Nothing for you to do right now.</div></div>`; }
    case 'bill': return `<div class="nff-bill"><div class="nff-bh"><span>The bill</span><span>To ${nffE(o.buyerName)}</span></div><div class="nff-ba">${bkPeso(t.total)}</div>
      <div class="nff-kv"><span>Items</span><b>${t.items} item${t.items === 1 ? '' : 's'}${o.deliveryConfirmation && o.deliveryConfirmation.confirmedDate ? ', delivered ' + nffE(nffShort(o.deliveryConfirmation.confirmedDate)) : ''}</b>${t.due ? `<span>Pay by</span><b>${nffE(nffDay(t.due))}</b>` : ''}</div></div>`;
    case 'due': { const d = t.due ? new Date(String(t.due).slice(0, 10) + 'T00:00:00') : null, days = t.due ? daysBetween(APP_TODAY, t.due) : null;
      return `<div class="nff-due">${d ? `<span class="nff-cal${days < 0 ? ' late' : ''}"><small>${d.toLocaleDateString('en-US', {month: 'short'}).toUpperCase()}</small><b>${d.getDate()}</b></span>` : ''}<p><b>${bkPeso(t.total)}</b>${t.of ? `<span>left of ${bkPeso(t.of)}</span>` : ''}
        ${days != null ? `<span class="${days < 0 ? 'late' : ''}">${days < 0 ? `${-days} day${days === -1 ? '' : 's'} late` : days === 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}`}</span>` : ''}</p></div>
        ${t.pending ? `<div class="nff-note">${nffI('receipt')}<span>${bkPeso(t.pending)} you already sent is waiting for them to confirm.</span></div>` : ''}`; }
    case 'payto': return `<div class="nff-task"><div class="nff-lbl"><span>Pay ${nffE(nffFirst(o.supplierName))} here</span></div><div class="nff-payto" id="nffPayTo">Loading their payment details…</div></div>`;
    case 'stockup': { const items = o.lineItems || [];
      return `<div class="nff-stockup">${nffI('up')}<div>${items.slice(0, 3).map(li => { const have = nffHave(li.product); return `<b>+${Number(li.qty) || 0} ${nffE(li.product)}</b>${have != null ? `<span>Now ${have} in stock</span>` : ''}`; }).join('')}</div></div>`; }
    case 'confirmpay': return `<div class="nff-task">${t.list.map(([kind, p, i]) => { const key = paymentKey(p, i), dom = String(key).replace('#', 'i');
        return `<div class="nff-cp"><div class="nff-cp-h"><span class="nff-tile-ic">${nffI(p.method === 'cash' ? 'cash' : p.method === 'check' ? 'cheque' : /bank/.test(p.method) ? 'bank' : 'gcash')}</span><div><b>${bkPeso(p.amount)} by ${nffE(PAYMENT_METHOD_LABELS[p.method] || p.method)}</b><span>${kind === 'deposit' ? 'Deposit · ' : ''}${p.reference ? 'Ref ' + nffE(p.reference) + ' · ' : ''}${nffE(nffShort(p.date))}${p.method === 'check' && p.checkDate ? ' · check dated ' + nffE(nffShort(p.checkDate)) : ''}</span></div></div>
          ${p.proofUrl ? `<a class="nff-link" href="${nffE(p.proofUrl)}" target="_blank" rel="noopener">See their photo</a>` : ''}
          <div class="nff-cp-b"><button type="button" class="nff-btn1 sm" data-nff="run" data-js="${nffE(`confirmPaymentReceived('${o.id}','${kind}','${key}')`)}">${nffI('check')}${p.method === 'check' ? 'It cleared' : 'Yes, it arrived'}</button><button type="button" class="nff-btn2" data-nff="run" data-js="${nffE(`openRejectPaymentForm('${o.id}','${kind}','${key}')`)}">Not received</button></div>
          <div id="rejectPayForm_${o.id}_${kind}_${dom}" class="nff-rej"></div></div>`; }).join('')}</div>`;
    case 'summary': { const steps = (o.history || []).filter(h => h.action).slice(-6);
      return `<div class="nff-card"><div class="nff-sumtl">${steps.map(h => `<div><i>${nffI('check')}</i><b>${nffE(String(h.action).replace(/^[^\w₱]+/, '').slice(0, 70))}</b><span>${nffE(nffShort(h.date))}</span></div>`).join('')}</div></div>`; }
  }
  return '';
}
function nffHtml(o, sell){
  const sp = nffSpec(o, sell), who = sell ? o.buyerName : o.supplierName, first = nffFirst(who), miss = nffMissing(o, sp), step = sp.step;
  const segs = NFF_STEPS.map((n, i) => `<i class="${step === -1 ? 'x' : (i < step || sp.turn === 'done') ? 'd' : i === step ? 'n' : ''}" title="${n}"></i>`).join('');
  let primary = '';
  if(sp.primary){
    primary = miss.length ? `<button type="button" class="nff-btn1 lock" data-nff="locked">${nffI('lock')}<span>${nffE(nffNeedText(o, miss[0]))}</span></button>`
      : `<button type="button" class="nff-btn1" data-nff="primary"><span>${nffE(nffPrimaryLabel(o, sp))}</span>${sp.primary.last ? '' : nffI('arrow')}</button>`;
  } else if(sp.wait) primary = `<button type="button" class="nff-btn1 soft" data-nff="run" data-js="${nffE(sp.wait.run)}">${nffI(sp.wait.ic)}<span>${nffE(sp.wait.label)}</span></button>`;
  const sec = (sp.sec || []).map((b, i) => `<button type="button" class="nff-btn2" data-nff="sec" data-i="${i}">${nffI(b.ic || 'dots')}<span>${nffE(b.label)}</span></button>`).join('');
  return `<div class="nff${NFF.view === 'more' ? ' is-more' : ''}${NFF.view === 'inline' ? ' is-inline' : ''}" data-nf-who="${nffE(who)}" data-nf-side="${sell ? 'cust' : 'sup'}">
    <div class="nff-top">${nffAvatar(who)}<div class="nff-who"><b>${nffE(who)}</b><span>${sell ? 'Customer' : 'Supplier'} · ${nffE(o.poNumber)}</span></div><button type="button" class="nff-x" aria-label="Close" onclick="closeOrderDetailModal()">${nffI('x')}</button></div>
    <div class="nff-prog"><div class="nff-segs">${segs}</div><div class="nff-pl"><span>${step === -1 ? 'Cancelled' : `Step ${step + 1} of 6 · <b>${NFF_STEPS[step]}</b>`}</span>${nffTurn(sp, first)}</div></div>
    <div class="nff-body" id="nffBody">
      <div class="nff-pane nff-step">
        ${NFF.justDone ? `<div class="nff-just">${nffI('check')}<span>${nffE(NFF.justDone)}</span></div>` : ''}
        <div class="nff-hero">${sp.turn === 'done' && !sp.cancelled ? `<div class="nff-seal">${nffI('check')}</div>` : `<span class="nff-ic ${sp.turn}${sp.cancelled ? ' off' : ''}">${nffI(sp.icon)}</span>`}<h2>${nffE(sp.title)}</h2>${sp.text ? `<p>${nffE(sp.text)}</p>` : ''}</div>
        ${(sp.tasks || []).map(t => nffTaskHtml(o, sell, t)).join('')}
        ${sp.showItems === 'full' ? nffReceipt(o, sell, false) : sp.showItems === 'line' ? nffLine(o, sell) : ''}
        ${(sp.sec || []).length ? `<div class="nff-seclist"><div class="nff-lbl"><span>Other choices</span></div>${(sp.sec || []).map((b, i) => `<button type="button" class="nff-srow" data-nff="sec" data-i="${i}">${nffI(b.ic || 'dots')}<span>${nffE(b.label)}</span>${nffI('arrow', 'nff-sgo')}</button>`).join('')}</div>` : ''}
      </div>
      <div class="nff-pane nff-inline"><button type="button" class="nff-back" data-nff="back">${nffI('left')}Back to the next step</button><h3 class="nff-slot-h" id="nffSlotH"></h3><div class="nff-slot" id="nffSlot"></div></div>
      <div class="nff-pane nff-morep"><button type="button" class="nff-back" data-nff="back">${nffI('left')}Back to the next step</button>
        ${typeof nfOpCardHtml === 'function' ? nfOpCardHtml(o, sell) : ''}
        <div class="nff-legacy" id="nffLegacy"></div></div>
    </div>
    <div class="nff-foot">${primary}${sec ? `<div class="nff-sec">${sec}</div>` : ''}
      ${sp.quiet ? `<button type="button" class="nff-quiet${sp.quiet.bad ? ' bad' : ''}" data-nff="quiet">${nffE(sp.quiet.label)}</button>` : ''}
      <button type="button" class="nff-moreb" data-nff="more">${nffI('dots')}<span class="nff-ml">More: change, cancel, documents, history</span><span class="nff-ms">More options: change, cancel, history</span></button></div>
  </div>`;
}

/* ---------- render + events ---------- */
function nffKey(o){ return [o.id, o.status, o.invoice ? o.invoice.status + ':' + ((o.invoice.payments || []).length) : '', (o.depositPayments || []).length, o.deliveryConfirmation ? 1 : 0, o.rma ? o.rma.status : ''].join('|'); }
function nffLegacyHtml(o, sell){ try{ return sell ? renderSupplierPoDetail(o) : renderBuyerPoDetail(o); }catch(e){ console.warn(e); return ''; } }
function nffRender(o, sell){
  const body = document.getElementById('orderDetailModalBody'); if(!body) return;
  const key = nffKey(o), sameOrder = NFF.id === o.id;
  if(key !== NFF.key){
    const prev = sameOrder ? NFF.last[o.id] : undefined, now = nffStepOf(o, sell);
    NFF.justDone = (sameOrder && prev != null && now > prev && now >= 0) ? `Step ${prev + 1} done: ${NFF_STEPS[prev].toLowerCase()}.` : '';
    NFF.v = {}; NFF.view = 'step';
  }
  NFF.key = key; NFF.id = o.id; NFF.sell = sell; NFF.last[o.id] = nffStepOf(o, sell);
  const scroll = (document.getElementById('nffBody') || {}).scrollTop || 0;
  body.innerHTML = nffHtml(o, sell);
  const modal = document.getElementById('orderDetailModal'); modal.classList.add('nff-modal'); modal.classList.remove('nfo-modal');
  const leg = document.getElementById('nffLegacy'); if(leg) leg.innerHTML = nffLegacyHtml(o, sell);
  const nb = document.getElementById('nffBody'); if(nb && sameOrder) nb.scrollTop = scroll;
  nffAfter(o, sell);
}
function nffAfter(o, sell){
  const pt = document.getElementById('nffPayTo'); if(pt && typeof loadPayToDetails === 'function') loadPayToDetails(o, 'nffPayTo');
  const c = document.getElementById('nffSig'); if(c) nffSigInit(c);
  if(typeof nfOpRenderGrid === 'function' && document.getElementById('nfOpGrid')) setTimeout(() => nfOpRenderGrid(o.id), 0);
  if(NFF.justDone) setTimeout(() => { NFF.justDone = ''; const j = document.querySelector('.nff-just'); if(j) j.classList.add('gone'); }, 3200);
}
function nffRefresh(){ const o = getPO(NFF.id); if(o) nffRender(o, NFF.sell); }
function nffSigInit(c){
  const x = c.getContext('2d'); if(!x) return; x.lineWidth = 4; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#0E1114';
  if(NFF.v.sigData){ const im = new Image(); im.onload = () => x.drawImage(im, 0, 0); im.src = NFF.v.sigData; }
  let on = false; const at = e => { const r = c.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; return [(p.clientX - r.left) * c.width / r.width, (p.clientY - r.top) * c.height / r.height]; };
  const down = e => { on = true; const [a, b] = at(e); x.beginPath(); x.moveTo(a, b); e.preventDefault(); };
  const move = e => { if(!on) return; const [a, b] = at(e); x.lineTo(a, b); x.stroke(); e.preventDefault(); };
  const up = () => { if(!on) return; on = false; const was = !!NFF.v.sigok; NFF.v.sigok = true; NFF.v.sigData = c.toDataURL('image/png'); if(!was) nffFoot(); };
  c.addEventListener('mousedown', down); c.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  c.addEventListener('touchstart', down, {passive: false}); c.addEventListener('touchmove', move, {passive: false}); c.addEventListener('touchend', up);
}
// redraw just the footer (keeps typing focus in the fields)
function nffFoot(){
  const o = getPO(NFF.id); if(!o) return; const root = document.querySelector('#orderDetailModal .nff'); if(!root) return;
  const tmp = document.createElement('div'); tmp.innerHTML = nffHtml(o, NFF.sell);
  const f = root.querySelector('.nff-foot'), nf = tmp.querySelector('.nff-foot'); if(f && nf) f.replaceWith(nf);
}
function nffPane(view){ NFF.view = view; const r = document.querySelector('#orderDetailModal .nff'); if(!r) return; r.classList.toggle('is-more', view === 'more'); r.classList.toggle('is-inline', view === 'inline'); const b = document.getElementById('nffBody'); if(b) b.scrollTop = 0; }
function nffRun(js){ try{ (0, eval)(js); }catch(e){ console.warn(e); showToast('That did not work. Try again, or use More.', 'error'); } }
// open one of the app's own small forms (counter offer, part delivery, deposit, return...) inside the popup
function nffInline(js, title){
  const o = getPO(NFF.id); if(!o) return; const leg = document.getElementById('nffLegacy'), slot = document.getElementById('nffSlot'); if(!leg || !slot) return;
  leg.innerHTML = nffLegacyHtml(o, NFF.sell);
  const before = new Map(); leg.querySelectorAll('[id]').forEach(e => before.set(e, e.innerHTML.trim().length));
  nffRun(js);
  const opened = [...leg.querySelectorAll('[id]')].filter(e => (before.get(e) || 0) === 0 && e.innerHTML.trim().length > 20);
  const el = opened.find(e => e.id.endsWith('_' + o.id)) || opened.find(e => e.id.includes(o.id)) || opened[0];
  if(!el){ if(document.getElementById('orderDetailModal').classList.contains('hidden')) return; nffPane('more'); return; }
  slot.innerHTML = ''; slot.appendChild(el); if(typeof nfEnhanceForm === 'function') nfEnhanceForm(slot);
  const h = document.getElementById('nffSlotH'); if(h) h.textContent = title || ''; nffPane('inline');
}
// fill one of the app's own forms with what was picked here, then run its save
function nffEngine(prefix, opener, fill, submit){
  const o = getPO(NFF.id); if(!o) return false; const leg = document.getElementById('nffLegacy'); if(!leg) return false;
  leg.innerHTML = nffLegacyHtml(o, NFF.sell);
  const box = document.getElementById(prefix + o.id); if(!box){ showToast('This step needs the full form. Opening More.', 'info'); nffPane('more'); return false; }
  if(box.innerHTML.trim() === '') window[opener](o.id);
  try{ fill(o.id); }catch(e){ console.warn(e); }
  window[submit](o.id); return true;
}
function nffSetVal(id, val){ const e = document.getElementById(id); if(!e) return; e.value = val; e.dispatchEvent(new Event('input', {bubbles: true})); }
function nffSetFile(id, data){ const e = document.getElementById(id); if(!e || !data) return; try{ const dt = new DataTransfer(); dt.items.add(nfDataUrlToFile(data, 'photo-' + Date.now() + '.jpg')); e.files = dt.files; }catch(err){} }
function nffKeepPhoto(kind, data){ if(data && typeof nfOpAdd === 'function') nfOpAdd(NFF.id, kind, data).then(() => { if(typeof nfOpRenderGrid === 'function') nfOpRenderGrid(NFF.id); }).catch(() => {}); }
function nffEta(){ const v = nffV('eta', 'today'); return v === 'today' ? APP_TODAY : v === 'tomorrow' ? addDaysIso(APP_TODAY, 1) : v === 'pick' ? nffV('etadate', '') : v; }
function nffAct(act){
  const o = getPO(NFF.id); if(!o) return; const id = o.id;
  if(act === 'ship'){
    const how = nffV('how'), drivers = nffDrivers(), drv = nffV('driver', drivers[0] || 'other');
    const carrier = how === 'truck' ? 'Our truck · ' + (drv === 'other' ? String(nffV('drivername', '')).trim() : drv) : how === 'lalamove' ? 'Lalamove' : how === 'pickup' ? 'Customer pick-up' : String(nffV('carrier', '')).trim();
    const eta = nffEta(), photo = nffV('photo', null), track = String(nffV('track', '')).trim();
    NFF.busy = true;
    if(o.status === 'confirmed'){ markSupplierPreparing(id); if(getPO(id).status !== 'preparing'){ NFF.busy = false; nffRefresh(); return; } }
    nffEngine('shipForm_', 'openShipForm', i => { nffSetVal('shipCarrier_' + i, carrier); nffSetVal('shipTracking_' + i, track); nffSetVal('shipEta_' + i, eta); nffSetFile('shipProof_' + i, photo); }, 'submitShip');
    NFF.busy = false; if(photo) nffKeepPhoto('shipped', photo); nffRefresh(); return;
  }
  if(act === 'delivered'){
    const name = String(nffV('rcv', '')).trim(), proof = nffV('proof'), photo = nffV('photo', null), sig = NFF.v.sigData, cod = nffV('cod', 'no');
    const go = im => {
      NFF.busy = true;
      nffEngine('supplierDcForm_', 'openSupplierDeliveryConfirm', i => {
        nffSetVal('supplierDcName_' + i, name);
        const pad = document.getElementById('supplierSigPad_' + i);
        if(pad && im && im.width){ const x = pad.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, pad.width, pad.height); const k = Math.min(pad.width / im.width, pad.height / im.height);
          x.drawImage(im, (pad.width - im.width * k) / 2, (pad.height - im.height * k) / 2, im.width * k, im.height * k); pad.dataset.hasSignature = '1'; }
        if(proof === 'photo') nffSetFile('supplierDcProof_' + i, photo);
        if(cod !== 'no'){ nffSetVal('supplierDcCodMethod_' + i, cod); nffSetVal('supplierDcCodAmount_' + i, String(nffV('codamt', poTotal(o))).replace(/,/g, '')); }
      }, 'submitSupplierDeliveryConfirm');
      NFF.busy = false; if(photo) nffKeepPhoto('delivered', photo); nffRefresh();
    };
    const src = proof === 'sign' ? sig : photo;
    if(src){ const im = new Image(); im.onload = () => go(im); im.onerror = () => go(null); im.src = src; } else go(null);
    return;
  }
  if(act === 'received'){
    const bad = o.lineItems.map((li, i) => nffV('c' + i) === 'bad'), photo = nffV('photo', null), note = String(nffV('dcnote', '')).trim();
    const got = o.lineItems.map((li, i) => Math.max(0, Math.min(Number(li.qty) || 0, Number(nffV('got' + i, li.qty)) || 0)));
    const dmg = o.lineItems.map((li, i) => Math.max(0, Number(nffV('dmg' + i, 0)) || 0));
    const mode = !bad.some(Boolean) ? 'yes' : got.some((g, i) => g < (Number(o.lineItems[i].qty) || 0)) ? 'partial' : dmg.some(d => d > 0) ? 'damaged' : 'no';
    NFF.busy = true;
    nffEngine('deliveryConfirmForm_', 'openDeliveryConfirm', i => {
      const r = document.querySelector(`input[name="dcMatch_${i}"][value="${mode}"]`); if(r){ r.checked = true; if(typeof toggleDcMode === 'function') toggleDcMode(i, mode === 'partial' || mode === 'damaged' ? mode : 'none'); }
      o.lineItems.forEach((li, k) => { nffSetVal(`dcQty_${i}_${k}`, String(got[k])); nffSetVal(`dcDamaged_${i}_${k}`, String(dmg[k])); });
      nffSetVal('dcNote_' + i, note || (mode === 'no' ? 'Something is wrong with this delivery.' : '')); nffSetFile('dcProof_' + i, photo);
    }, 'submitDeliveryConfirm');
    NFF.busy = false; if(photo) nffKeepPhoto(bad.some(Boolean) ? 'damage' : 'received', photo); nffRefresh(); return;
  }
  if(act === 'pay'){
    const pay = computeInvoicePayments(o), room = NFF.sell ? pay.balance : Math.max(0, roundPeso(pay.balance - pay.pendingAmount));
    const m = nffV('method'), method = (NFF_PAY.find(x => x[0] === m) || [])[2] || m;
    const amt = nffV('part', 'all') === 'part' ? Number(String(nffV('amt', 0)).replace(/,/g, '')) || 0 : room;
    const photo = nffV('slip', null);
    NFF.busy = true;
    nffEngine('markPaidForm_', 'openMarkPaidForm', i => {
      if(!document.getElementById('payMethod_' + i)) openMarkPaidForm(i);
      nffSetVal('payMethod_' + i, method); if(typeof togglePaymentFields === 'function') togglePaymentFields(i);
      nffSetVal('payAmount_' + i, String(amt)); nffSetVal('payRef_' + i, String(nffV('ref', '')).trim()); nffSetVal('payCheckDate_' + i, nffV('chkdate', APP_TODAY)); nffSetFile('paidProof_' + i, photo);
    }, 'submitRecordPayment');
    NFF.busy = false; if(photo) nffKeepPhoto('payment', photo); nffRefresh(); return;
  }
}
function nffFlagMissing(){
  const o = getPO(NFF.id); if(!o) return; const sp = nffSpec(o, NFF.sell), m = nffMissing(o, sp)[0]; if(!m) return;
  const el = document.querySelector(`#nffBody [data-t="${m.type === 'sign' ? 'sig' : m.type === 'count' ? 'count' : m.id}"]`);
  if(el){ el.scrollIntoView({behavior: 'smooth', block: 'center'}); el.classList.remove('nff-need'); void el.offsetWidth; el.classList.add('nff-need'); const f = el.querySelector('input:not([type=file])'); if(f && window.innerWidth > 760) setTimeout(() => f.focus({preventScroll: true}), 250); }
  const b = document.querySelector('#orderDetailModal .nff-btn1.lock'); if(b){ b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#orderDetailModal [data-nff]'); if(!b) return;
  const o = getPO(NFF.id); if(!o) return; const a = b.dataset.nff, sp = nffSpec(o, NFF.sell);
  if(a === 'pick'){ const k = b.dataset.k, v = b.dataset.v; nffSet(k, v); if(k === 'how' || k === 'proof' || k === 'method') { if(k === 'method') delete NFF.v.ref; } nffRender(o, NFF.sell); return; }
  if(a === 'locked'){ nffFlagMissing(); return; }
  if(a === 'primary'){ const p = sp.primary; if(!p) return; if(p.act) return nffAct(p.act); if(p.inline) return nffInline(p.inline, p.label); return nffRun(p.run); }
  if(a === 'sec'){ const s = (sp.sec || [])[Number(b.dataset.i)]; if(!s) return; if(s.inline) return nffInline(s.inline, s.label); return nffRun(s.run); }
  if(a === 'quiet'){ const s = sp.quiet; if(s) nffRun(s.run); return; }
  if(a === 'run'){ nffRun(b.dataset.js); return; }
  if(a === 'more'){ const leg = document.getElementById('nffLegacy'); if(leg) leg.innerHTML = nffLegacyHtml(o, NFF.sell); nffPane('more'); return; }
  if(a === 'back'){ nffRender(o, NFF.sell); nffPane('step'); return; }
  if(a === 'shoot'){ const k = b.dataset.k; nfTakePhoto(data => { nffSet(k, data); nffRender(getPO(NFF.id), NFF.sell); }, {title: 'Photo for this order'}); return; }
  if(a === 'unphoto'){ delete NFF.v[b.dataset.k]; nffRender(o, NFF.sell); return; }
  if(a === 'unsign'){ delete NFF.v.sigok; delete NFF.v.sigData; nffRender(o, NFF.sell); return; }
});
document.addEventListener('input', e => {
  const t = e.target; if(!t || !t.dataset || !t.dataset.nffIn || !t.closest('#orderDetailModal')) return;
  nffSet(t.dataset.nffIn, t.value);
  if(/^(amt|part)$/.test(t.dataset.nffIn)){ nffFoot(); } else nffFoot();
});
document.addEventListener('change', e => {
  const t = e.target; if(!t || !t.dataset) return;
  if(t.dataset.nffIn && t.closest('#orderDetailModal') && t.type === 'date'){ nffSet(t.dataset.nffIn, t.value); nffFoot(); return; }
  if(t.dataset.nffFile && t.closest('#orderDetailModal')){ const k = t.dataset.nffFile; nfPickFile(t, data => { nffSet(k, data); nffRender(getPO(NFF.id), NFF.sell); }); }
});
// the popup is the Focus sheet from now on
(function(){
  window.nfRenderOrderSheet = function(o, sell){ nffRender(o, sell); };
  window.nfRenderOrderSheet._nf9 = true;
  const ref0 = window.refreshOrderModalIfOpen;
  window.refreshOrderModalIfOpen = function(id){ if(NFF.busy && id === NFF.id) return; return ref0.apply(this, arguments); };
  const close0 = window.closeOrderDetailModal;
  if(typeof close0 === 'function') window.closeOrderDetailModal = function(){ NFF.key = ''; NFF.id = ''; NFF.v = {}; NFF.view = 'step'; const m = document.getElementById('orderDetailModal'); if(m) m.classList.remove('nff-modal'); return close0.apply(this, arguments); };
})();
// Esc closes the popup
document.addEventListener('keydown', e => { if(e.key === 'Escape'){ const m = document.getElementById('orderDetailModal'); if(m && !m.classList.contains('hidden') && m.classList.contains('nff-modal') && !document.querySelector('.sl-modal:not(.hidden), #nfCam, #nfOk')) closeOrderDetailModal(); } });

/* ===== Round 13: calmer pictures everywhere =====
   No coloured rings around pictures, no coloured bars on chats, no purple. Initials sit on a calm colour. */
const NF_INI_CALM = ['#2563EB', '#0E7490', '#0F766E', '#15803D', '#475569', '#1D4ED8', '#0369A1', '#334155', '#047857'];
window.nfIniColor = function(name){ let h = 0; String(name).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return NF_INI_CALM[h % NF_INI_CALM.length]; };
