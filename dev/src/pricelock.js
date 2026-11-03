
/* ================= PRICE LOCK: staff can't sell under the price list without the owner's OK =================
   Settings (owner only, in books_settings): price_lock (default on), max_discount (% staff may give on their own, default 5),
   receipt_auto (show the receipt after every sale, default on). The server checks the same rules on every staff sale. */
function plCfg(){
  const s = bkSettings();
  const max = s.max_discount === undefined || s.max_discount === null || s.max_discount === '' ? 5 : Math.max(0, Math.min(100, Number(s.max_discount) || 0));
  return {on: s.price_lock !== false, max, receipt: s.receipt_auto !== false};
}
function plApplies(){ return plCfg().on && !booksCanSeeTotals(); }
// the lowest price staff may charge on their own: list price minus the allowed discount; no list price → the cost
function plFloor(name){
  const list = bkItemPrice(name);
  if(list > 0) return {list, min: Math.round(list * (1 - plCfg().max / 100) * 100) / 100};
  const i = inventoryData.find(x => String(x.name).toLowerCase() === String(name).trim().toLowerCase());
  return {list: 0, min: i && Number(i.unitCost) > 0 ? Number(i.unitCost) : 0};
}
function plIssues(lines){
  return lines.filter(l => {
    if(l.totalOnly) return true;
    const f = plFloor(l.product); return f.min > 0 && (Number(l.unitPrice) || 0) < f.min - 0.005;
  }).map(l => Object.assign({}, l, plFloor(l.product)));
}
// an OK covers the sale when every flagged item is priced at or above what the owner OK'd
function plCovered(issues, okLines){
  return issues.every(i => (okLines || []).some(x => String(x.product).toLowerCase() === String(i.product).toLowerCase() && (Number(x.unitPrice) || 0) <= (Number(i.unitPrice) || 0) + 0.005));
}
function plIssueText(i){
  if(i.totalOnly) return 'A total-only sale';
  return `${escapeHtml(i.product)}: ${bkPeso(i.unitPrice)}` + (i.list ? ` <small>(price list ${bkPeso(i.list)}, lowest you can give: ${bkPeso(i.min)})</small>` : ` <small>(under cost ${bkPeso(i.min)})</small>`);
}
// the box inside "New sale" when a price needs the owner's OK
function plBoxHtml(){
  const a = QS && QS.ask; if(!a) return '';
  const list = `<div class="pl-items">${a.issues.map(i => `<div>${plIssueText(i)}</div>`).join('')}</div>`;
  if(a.state === 'approved') return `<div class="bk-alert pl-box ok"><b>✅ OK'd by ${escapeHtml(a.by || 'the owner')}</b><span>Tap Save sale now.</span></div>`;
  if(a.state === 'waiting') return `<div class="bk-alert amber pl-box"><b>⏳ Waiting for the owner's OK…</b><span>We sent it to their phone. Keep this open.</span>${list}
    <div class="pl-act">${myBusiness ? '' : `<button class="btn btn-primary" onclick="plDemoApprove()">Demo: approve as the owner</button>`}<button class="sl-link" onclick="plCancelAsk()">Cancel</button></div></div>`;
  if(a.state === 'declined') return `<div class="bk-alert pl-box bad"><b>✋ The owner said no</b><span>${escapeHtml(a.note || 'Use the price list price.')}</span>
    <div class="pl-act"><button class="btn btn-primary" onclick="plUseList()">Use the price list</button></div></div>`;
  return `<div class="bk-alert amber pl-box"><b>🔒 This price needs the owner's OK</b>${list}
    <div class="pl-act"><button class="btn btn-primary" onclick="plAsk()" ${a.sending ? 'disabled' : ''}>${a.sending ? 'Sending…' : 'Ask the owner'}</button>${a.issues.some(i => !i.totalOnly) ? `<button class="btn btn-outline" onclick="plUseList()">Use the price list</button>` : ''}</div></div>`;
}
function plScrollBox(){ setTimeout(() => { const b = document.querySelector('#qsModal .pl-box'); if(b) b.scrollIntoView({block: 'center', behavior: 'smooth'}); }, 30); }
// called from qsSave: true = go ahead, false = stop and show the box
function plCheck(lines){
  if(!plApplies()) return true;
  const issues = plIssues(lines);
  if(!issues.length){ QS.ask = null; return true; }
  if(QS.ask && QS.ask.state === 'approved' && plCovered(issues, QS.ask.okLines)) return true;
  if(!QS.ask || QS.ask.state === 'approved' || QS.ask.state === 'declined') QS.ask = {issues, lines, state: 'idle'};
  else { QS.ask.issues = issues; QS.ask.lines = lines; }
  qsRender(); plScrollBox(); return false;
}
async function plAsk(){
  const a = QS && QS.ask; if(!a) return;
  if(myBusiness && isOffline){ showToast('Asking the owner needs internet. Use the price list price, or try again when you have signal.'); return; }
  a.sending = true; qsRender();
  if(myBusiness){
    const { data, error } = await sb.rpc('request_price_ok', {p_business: myBusiness.id, p_lines: a.lines, p_customer: String(QS.customer || '').slice(0, 120), p_note: String(QS.note || '').slice(0, 300)});
    if(!QS || QS.ask !== a) return;
    a.sending = false;
    if(error){ qsRender(); showToast("Couldn't ask: " + error.message, 'error'); return; }
    a.id = data; a.state = 'waiting'; plPoll(a);
  } else { a.sending = false; a.id = 'demo'; a.state = 'waiting'; }
  qsRender(); plScrollBox();
}
function plPoll(a){
  clearTimeout(a.timer);
  a.timer = setTimeout(async () => {
    if(!QS || QS.ask !== a || a.state !== 'waiting' || !document.getElementById('qsModal')) return;
    const { data } = await sb.from('price_approvals').select('status, decided_by_name, decline_note, lines').eq('id', a.id).maybeSingle();
    if(!QS || QS.ask !== a) return;
    if(data && data.status === 'approved'){ a.state = 'approved'; a.by = data.decided_by_name; a.okLines = data.lines; qsRender(); showToast('The owner OK\'d the price.', 'success'); return; }
    if(data && data.status === 'declined'){ a.state = 'declined'; a.note = data.decline_note; qsRender(); return; }
    plPoll(a);
  }, 4000);
}
function plDemoApprove(){ const a = QS && QS.ask; if(!a) return; a.state = 'approved'; a.by = 'the owner'; a.okLines = a.lines; qsRender(); }
async function plCancelAsk(){
  const a = QS && QS.ask; if(!a) return;
  clearTimeout(a.timer);
  if(myBusiness && a.id) await sb.rpc('cancel_price_ok', {p_id: a.id});
  QS.ask = null; qsRender();
}
function plUseList(){
  const a = QS && QS.ask; if(!a) return;
  QS.lines.forEach(l => { const f = plFloor(l.product); if(f.list > 0 && (Number(String(l.price).replace(/,/g, '')) || 0) < f.min) l.price = String(f.list); });
  if(QS.mode === 'total') QS.mode = 'items';
  clearTimeout(a.timer); QS.ask = null; qsRender();
}
// server said no (its price list differs from this phone's): offer the same "Ask the owner" box
function plFromServerError(msg, lines){
  if(!/PRICE_LOCK/.test(msg || '')) return false;
  const issues = plIssues(lines);
  QS.ask = {issues: issues.length ? issues : lines.map(l => Object.assign({}, l, plFloor(l.product))), lines, state: 'idle'};
  return true;
}

/* ---- owner: answer requests from the phone. Checks while the app is open; the push opens the app on Sales. ---- */
let PL_OWNER = {timer: null, shown: '', busy: false};
async function plOwnerCheck(){
  clearTimeout(PL_OWNER.timer);
  PL_OWNER.timer = setTimeout(plOwnerCheck, 20000);
  if(!myBusiness || !booksCanSeeTotals() || document.hidden || PL_OWNER.busy) return;
  const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
  const { data, error } = await sb.from('price_approvals').select('*').eq('business_id', myBusiness.id).eq('status', 'pending').gte('created_at', since).order('created_at');
  if(error) return;
  const list = data || [], key = list.map(r => r.id).join(',');
  if(!list.length){ PL_OWNER.shown = ''; slClose('plOk'); return; }
  if(key === PL_OWNER.shown && document.getElementById('plOk')) return;
  PL_OWNER.shown = key; plOwnerRender(list);
}
function plOwnerRender(list){
  const max = plCfg().max;
  slModal('plOk', `<div class="sl-sheet-h"><b>Price OK needed</b><button class="sl-x" onclick="slClose('plOk')">✕</button></div>
    ${list.map(r => {
      const lines = (r.lines || []).map(l => {
        const list = Number(l.listPrice) || 0, p = Number(l.unitPrice) || 0, off = list > 0 && p < list ? Math.round((1 - p / list) * 100) : 0;
        return `<div class="pl-ln"><span>${escapeHtml(l.totalOnly ? 'Total only' : l.product)} <small>${escapeHtml(String(l.qty || 1))} ×</small></span><b>${bkPeso(p)}</b>${list > 0 ? `<small class="${off > max ? 'bk-bad' : ''}">list ${bkPeso(list)}${off ? ` · ${off}% off` : ''}</small>` : ''}</div>`;
      }).join('');
      const t = new Date(r.created_at).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit'});
      return `<div class="panel-card pl-req"><div class="pl-who"><b>${escapeHtml(r.requested_by_name || 'Staff')}</b><small>${t}${r.customer_name && r.customer_name !== 'Walk-in' ? ' · for ' + escapeHtml(r.customer_name) : ''}${r.note ? ' · ' + escapeHtml(r.note) : ''}</small></div>
        ${lines}<div class="pl-ln pl-tot"><span>Sale total</span><b>${bkPeso(r.total)}</b></div>
        <div class="pl-act"><button class="btn btn-primary" onclick="plDecide('${r.id}', true)">OK this price</button><button class="btn btn-outline" onclick="plDecide('${r.id}', false)">Say no</button></div></div>`;
    }).join('')}
    <div class="bk-note">Staff can give up to ${max}% off on their own. Change it on Sales → Price lock.</div>`);
}
async function plDecide(id, ok){
  let note = null;
  if(!ok){ note = prompt('Tell them why (optional)', 'Use the price list price'); if(note === null) return; }
  PL_OWNER.busy = true;
  const { error } = await sb.rpc('decide_price_ok', {p_id: id, p_ok: ok, p_note: note});
  PL_OWNER.busy = false;
  if(error){ showToast(error.message, 'error'); }
  else showToast(ok ? 'OK sent. They can save the sale now.' : 'Sent. They\'ll use the price list.', 'success');
  PL_OWNER.shown = ''; slClose('plOk'); plOwnerCheck();
}
document.addEventListener('visibilitychange', () => { if(!document.hidden && myBusiness) plOwnerCheck(); });
setTimeout(plOwnerCheck, 3000);

/* ---- owner settings: on the Sales page ---- */
function plSettingsHtml(){
  if(!booksCanSeeTotals()) return '';
  const c = plCfg();
  return `<details class="panel-card lg-det pl-set"><summary>🔒 Price lock &amp; receipts</summary>
    <label class="bk-check"><input type="checkbox" ${c.on ? 'checked' : ''} onchange="bkSaveSettings({price_lock: this.checked}).then(renderSalesBooksPage)"> Staff can't sell under the price list without your OK</label>
    <div class="field"><label>Staff can give up to this much off on their own</label><div class="ob-peso pl-pct"><input inputmode="decimal" value="${c.max}" ${c.on ? '' : 'disabled'} onchange="bkSaveSettings({max_discount: Math.max(0, Math.min(100, Number(this.value) || 0))}).then(renderSalesBooksPage)"><span>%</span></div></div>
    <label class="bk-check"><input type="checkbox" ${c.receipt ? 'checked' : ''} onchange="bkSaveSettings({receipt_auto: this.checked}).then(renderSalesBooksPage)"> Show the receipt after every sale</label>
    <div class="bk-note">When staff go lower, you get a message on your phone to OK it or say no. Items without a price list price can't be sold under their cost. You and your managers aren't locked, but your discounts still count.</div></details>`;
}
// discounts under the price list for one day, by who rang the sale
function plDiscountsBy(day){
  const by = {};
  BK.sales.filter(s => s.date === day && !s.voidedAt).forEach(s => (s.lines || []).forEach(l => {
    if(l.totalOnly) return;
    const list = Number(l.listPrice) || bkItemPrice(l.product), p = Number(l.unitPrice) || 0;
    if(list > p) by[s.by || 'Someone'] = (by[s.by || 'Someone'] || 0) + (list - p) * (Number(l.qty) || 0);
  }));
  return Object.entries(by).filter(x => x[1] >= 1).sort((a, b) => b[1] - a[1]);
}
function plDiscountsHtml(day){
  if(!booksCanSeeTotals()) return '';
  const rows = plDiscountsBy(day); if(!rows.length) return '';
  return `<section class="panel-card bk-list"><div class="panel-head"><h2>Discounts · ${bkDayLabel(day)}</h2><span class="bk-dim">${bkPeso(rows.reduce((a, r) => a + r[1], 0))}</span></div>
    ${rows.map(([k, v]) => `<div class="bk-row"><span class="bk-ic" aria-hidden="true">🏷</span><div class="bk-row-m"><b>${escapeHtml(k)}</b><small>gave under the price list</small></div><span class="bk-amt">${bkPeso(v)}</span></div>`).join('')}</section>`;
}
// Filipino for the new screens (the receipt itself stays as printed)
window.addEventListener('DOMContentLoaded', () => { if(typeof I18N_FIL === 'undefined') return; Object.assign(I18N_FIL, {
  "🔒 This price needs the owner's OK": "🔒 Kailangan ng OK ng may-ari sa presyong ito",
  "Ask the owner": "Magpaalam sa may-ari",
  "Use the price list": "Gamitin ang price list",
  "⏳ Waiting for the owner's OK…": "⏳ Hinihintay ang OK ng may-ari…",
  "We sent it to their phone. Keep this open.": "Pinadala na sa phone niya. Huwag munang isara.",
  "Demo: approve as the owner": "Demo: i-approve bilang may-ari",
  "Cancel": "Kanselahin",
  "✋ The owner said no": "✋ Hindi pumayag ang may-ari",
  "Tap Save sale now.": "I-tap na ang Save sale.",
  "Price OK needed": "Kailangan ng OK sa presyo",
  "OK this price": "OK ang presyong ito",
  "Say no": "Hindi",
  "Sale total": "Kabuuang benta",
  "🔒 Price lock & receipts": "🔒 Lock ng presyo at resibo",
  "Staff can't sell under the price list without your OK": "Hindi makakabenta ang staff nang mas mababa sa price list nang walang OK mo",
  "Staff can give up to this much off on their own": "Hanggang ganito kalaking diskwento ang puwedeng ibigay ng staff nang mag-isa",
  "Show the receipt after every sale": "Ipakita ang resibo pagkatapos ng bawat benta",
  "When staff go lower, you get a message on your phone to OK it or say no. Items without a price list price can't be sold under their cost. You and your managers aren't locked, but your discounts still count.": "Kapag mas mababa ang presyo ng staff, may mensahe sa phone mo para i-OK o tanggihan. Ang mga item na walang presyo sa price list ay hindi puwedeng ibenta nang mas mababa sa puhunan. Hindi naka-lock ka at ang mga manager, pero bilang pa rin ang mga diskwento ninyo.",
  "gave under the price list": "nagbigay nang mas mababa sa price list",
  "Show or send this to the customer.": "Ipakita o ipadala ito sa customer."
}); });
