/* ===== Round 25: real Telegram alerts, the admin switches for Telegram and notebook reading, full Excel export ===== */
// Telegram: each person links their own Telegram once (a one-time t.me link), chooses which alerts they get,
// and can send themselves a test. The bot and the sending live on the server (telegram-bot, push-dispatch).
// The demo shop can look at everything but can't link, because it has no account behind it.
const NF25 = {tg: null, poll: 0, linkUrl: '', qr: ''};
function nf25Real(){ try{ return typeof myBusiness !== 'undefined' && !!myBusiness && typeof sb !== 'undefined' && !!sb; }catch(e){ return false; } }
function nf25E(s){ return typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]); }
async function nf25FnError(error, data){
  let m = (data && data.error) || (error && error.message) || 'Something went wrong. Try again.';
  try{ if(error && error.context && typeof error.context.json === 'function'){ const j = await error.context.json(); if(j && j.error) m = j.error; } }catch(e){}
  return m;
}
const NF25_TG_SW = [
  ['orders', 'Orders', 'New orders, confirmations, deliveries, and payments a customer says they sent'],
  ['money', 'Money', 'Cash short or over, cheques to deposit, price OKs. Owners and managers only.'],
  ['stock', 'Running low', 'The moment an item drops to its reorder point'],
  ['messages', 'Messages', 'New chat messages from customers and suppliers'],
  ['team', 'Team', 'Tasks, handover notes and delivery routes'],
  ['summary', 'Daily and weekly summary', 'Every evening, and Monday morning']];
function nf25TgAlerts(){
  if(nf25Real()) return Object.assign({}, (NF25.tg && NF25.tg.me && NF25.tg.me.alerts) || {});
  try{ return JSON.parse(localStorage.getItem('nifti-tg-alerts') || '{}') || {}; }catch(e){ return {}; }
}
async function nf25TgLoad(){
  if(!nf25Real()) return null;
  const { data, error } = await sb.rpc('telegram_status');
  NF25.tg = error ? {error: error.message} : (data || {});
  return NF25.tg;
}
async function nf25TgSet(k, on){
  const a = nf25TgAlerts();
  if(k === 'quiet') a.quiet = !!on; else a[k] = !!on;
  if(!nf25Real()){ try{ localStorage.setItem('nifti-tg-alerts', JSON.stringify(a)); }catch(e){} return; }
  const { error } = await sb.rpc('telegram_set_alerts', {p_alerts: a});
  if(error){ showToast(error.message, 'error'); return; }
  if(NF25.tg && NF25.tg.me) NF25.tg.me.alerts = a;
  showToast('Saved.', 'success');
}
async function nf25TgLink(){
  if(!nf25Real()){ showToast('This is the demo shop. Sign up free, then link your own Telegram here.', 'warn'); return; }
  const phone = document.documentElement.classList.contains('nf-phone') || /Android|iPhone|iPad/i.test(navigator.userAgent);
  const { data, error } = await sb.rpc('telegram_link_code');
  if(error){ showToast(error.message, 'error'); return; }
  if(!data || !data.ready){ showToast('Telegram alerts are not switched on yet. The Nifti team is turning them on.', 'warn'); await nf25TgLoad(); nf25PaintAlerts(); return; }
  NF25.linkUrl = data.url; NF25.qr = '';
  if(phone){ try{ window.location.href = data.url; }catch(e){} }
  else { try{ NF25.qr = await qrDataUrl(data.url, 6); }catch(e){ NF25.qr = ''; } }
  nf25PaintAlerts(); nf25TgPoll();
}
function nf25TgPoll(){
  clearInterval(NF25.poll); let n = 0;
  NF25.poll = setInterval(async () => {
    n++; const ov = document.getElementById('nf21Alerts');
    if(!ov || ov.hidden || n > 80){ clearInterval(NF25.poll); return; }
    const d = await nf25TgLoad();
    if(d && d.me){ clearInterval(NF25.poll); NF25.linkUrl = ''; NF25.qr = ''; nf25PaintAlerts(); showToast('Linked. Nifti sent a hello message on Telegram.', 'success'); }
  }, 3000);
}
async function nf25TgTest(){
  if(!nf25Real()){ showToast('This is the demo shop. Sign up to get real messages.', 'warn'); return; }
  const { error } = await sb.rpc('telegram_test');
  showToast(error ? error.message : 'Sent. Check Telegram in a few seconds.', error ? 'error' : 'success');
}
async function nf25TgUnlink(member){
  if(!nf25Real()) return;
  if(!confirm(member ? 'Stop Telegram alerts for this person?' : 'Stop Telegram alerts on your phone? You can link again any time.')) return;
  const { error } = await sb.rpc('telegram_unlink', {p_member: member || null});
  if(error){ showToast(error.message, 'error'); return; }
  await nf25TgLoad(); nf25PaintAlerts(); showToast('Unlinked.', 'success');
}
function nf25Sw(k, t, d, on){
  return `<div class="nf25-sw"><div><b>${t}</b><small>${d}</small></div><label class="nf20-pr nf21-sw"><input type="checkbox" role="switch" aria-label="${nf25E(t)}" ${on ? 'checked' : ''} onchange="nf25TgSet('${k}', this.checked)"><i aria-hidden="true"></i></label></div>`;
}
const NF25_TG_EX = [
  ['🛒', 'New order from Bayview Construction', 'PO-2026-0912 · 40 × Portland Cement 40kg · ₱9,120'],
  ['🟡', 'Running low: Steel Rebar 12mm', 'Only 18 pcs left. Reorder point is 25.'],
  ['💳', 'Riverside Builders says they paid for INV-0418', 'Check your account, then confirm it in Nifti.']];
function nf25PaintAlerts(){
  const ov = document.getElementById('nf21Alerts'); if(!ov) return;
  const real = nf25Real();
  if(real && !NF25.tg){ ov.innerHTML = nf25Sheet('<p class="nf25-wait">Checking your Telegram link…</p>'); nf25TgLoad().then(() => nf25PaintAlerts()); return; }
  const st = NF25.tg || {}, me = st.me, a = nf25TgAlerts();
  let top = '';
  if(!real){
    top = `<div class="nf25-st demo"><b>You're looking at the demo shop</b><span>Sign up free, then come back here and tap <b>Link my Telegram</b>. Your link is private to you.</span></div>`;
  } else if(st.error){
    top = `<div class="nf25-st warn"><b>Couldn't check your Telegram link</b><span>${nf25E(st.error)}</span></div>`;
  } else if(!st.ready){
    top = `<div class="nf25-st warn"><b>Almost ready</b><span>The Nifti team is switching on the Telegram bot. When it's on, a <b>Link my Telegram</b> button shows here.</span></div>`;
  } else if(me){
    top = `<div class="nf25-st ok"><span class="nf25-ok" aria-hidden="true">✓</span><div><b>Linked to ${nf25E(me.name || 'your Telegram')}</b><span>Since ${new Date(me.linked_at).toLocaleDateString('en-PH', {month: 'short', day: 'numeric', year: 'numeric'})}. Alerts come with a button that opens the right page.</span></div>
      <div class="nf25-st-b"><button type="button" class="btn btn-primary" onclick="nf25TgTest()">Send me a test</button><button type="button" class="btn btn-outline" onclick="nf25TgUnlink()">Unlink</button></div></div>`;
  }
  const canLink = !real || (st.ready && !me && !st.error);
  const steps = canLink ? `<ol class="nf25-steps">
      <li><b>Get Telegram</b><span>Free from the App Store or Google Play. Sign up with your mobile number.</span></li>
      <li><b>Tap Link my Telegram</b><span>${real ? 'On a computer, scan the code with your phone camera instead.' : 'In your own account, this opens Telegram on your phone.'}</span></li>
      <li><b>Tap START in Telegram</b><span>The big button at the bottom of the chat. Nifti says hello, and you're done.</span></li></ol>
    <div class="nf25-link">${NF25.qr ? `<img src="${NF25.qr}" alt="Scan with your phone camera to link Telegram" width="180" height="180">` : ''}
      <div><button type="button" class="btn btn-primary nf25-big" onclick="nf25TgLink()">${NF25.linkUrl ? 'Get a new link' : 'Link my Telegram'}</button>
      ${NF25.linkUrl ? `<p>Waiting for you to tap START in Telegram… <a href="${nf25E(NF25.linkUrl)}" target="_blank" rel="noopener">Open Telegram</a></p>` : `<p>Each person on your team links their own phone from this same page.</p>`}</div></div>` : '';
  const sw = (!real || me) ? `<h3>Which alerts do you want?</h3><div class="nf25-sws">${NF25_TG_SW.map(([k, t, d]) => nf25Sw(k, t, d, a[k] !== false)).join('')}
      ${nf25Sw('quiet', 'Quiet at night', 'No sound from 9 PM to 7 AM. Messages still arrive.', a.quiet === true)}</div>` : '';
  const team = st.team && st.team.length ? `<h3>Linked on your team</h3><ul class="nf25-team">${st.team.map(t => `<li><b>${nf25E(t.member)}</b><span>${nf25E(t.tg || 'Telegram')} · since ${new Date(t.linked_at).toLocaleDateString('en-PH', {month: 'short', day: 'numeric'})}</span></li>`).join('')}</ul>` : '';
  const ex = `<h3>What they look like</h3><div class="nf25-ex">${NF25_TG_EX.map(([ic, t, b]) => `<div class="nf25-exm"><span aria-hidden="true">${ic}</span><div><b>${t}</b><small>${b}</small><i>Open in Nifti</i></div></div>`).join('')}</div>
    <p class="nf25-p">In the Telegram chat, type <b>/today</b> any time to see today at a glance: orders to confirm and deliver, sales today, who owes you, and items running low. Type <b>/stop</b> to turn alerts off on that phone.</p>`;
  ov.innerHTML = nf25Sheet(top + steps + sw + team + ex);
}
function nf25Sheet(body){
  return `<div class="nf20-sheet nf21-sheet nf25-sheet">
    <div class="nf20-sh"><div><h2>Telegram alerts on your phone</h2><p>Free. New orders, payments, low stock and your daily summary, with a button that opens the right page.</p></div><button type="button" class="nf20-x" onclick="nf21CloseAlerts()" aria-label="Close">✕</button></div>
    <div class="nf20-rc nf21-body">${body}</div>
    <div class="nf20-sf"><span></span><button type="button" class="btn btn-primary" onclick="nf21CloseAlerts()">Done</button></div></div>`;
}

/* ---------- Admin: switch on Telegram and notebook reading ---------- */
async function nf25AdminServices(body){
  if(!body || body.querySelector('.nf25-svc')) return;
  let s; try{ s = await adminRpc('admin_service_status'); }catch(e){ return; }
  const card = document.createElement('div'); card.className = 'panel-card nf25-svc';
  const cost = Math.round((s.reader_pages_month || 0) * 1.7);
  card.innerHTML = `<div class="adm-h">Telegram alerts and notebook reading</div>
    <div class="nf25-svcb"><div class="nf25-svch"><b>Telegram bot</b><span class="nf25-pill ${s.telegram ? 'on' : ''}">${s.telegram ? 'On' : 'Off'}</span></div>
      <p>${s.telegram ? `Bot: @${nf25E(s.telegram_bot || '')} · ${s.telegram_links} phone${s.telegram_links === 1 ? '' : 's'} linked.` : 'Off. Customers see "Almost ready" on the Telegram page.'}</p>
      <ol><li>In Telegram, open <b>@BotFather</b> and send <b>/newbot</b>.</li><li>Name it, for example "Nifti Alerts". Its username must end in "bot".</li><li>BotFather replies with a token. Copy it and paste it here.</li></ol>
      <div class="nf25-in"><input id="nf25TgTok" type="password" autocomplete="off" placeholder="Paste the bot token" aria-label="Telegram bot token"><button type="button" class="btn btn-primary" onclick="nf25SaveSecret('telegram_bot_token', 'nf25TgTok')">${s.telegram ? 'Replace' : 'Switch on'}</button>${s.telegram ? `<button type="button" class="btn btn-outline" onclick="nf25OffSecret('telegram_bot_token')">Switch off</button>` : ''}</div></div>
    <div class="nf25-svcb"><div class="nf25-svch"><b>Notebook reading</b><span class="nf25-pill ${s.reader ? 'on' : ''}">${s.reader ? 'On' : 'Off'}</span></div>
      <p>${s.reader ? `${s.reader_pages_month} page${s.reader_pages_month === 1 ? '' : 's'} read this month, about ₱${cost.toLocaleString('en-PH')} on your Anthropic bill.` : 'Off. People can still save notebook pages; they get read once this is on.'}</p>
      <ol><li>Go to <b>console.anthropic.com</b> and sign in.</li><li>Add a payment card under Billing. Each page costs about ₱1 to ₱2.</li><li>Open API keys, create a key, copy it and paste it here.</li></ol>
      <div class="nf25-in"><input id="nf25AiKey" type="password" autocomplete="off" placeholder="Paste the API key" aria-label="Anthropic API key"><button type="button" class="btn btn-primary" onclick="nf25SaveSecret('anthropic_api_key', 'nf25AiKey')">${s.reader ? 'Replace' : 'Switch on'}</button>${s.reader ? `<button type="button" class="btn btn-outline" onclick="nf25OffSecret('anthropic_api_key')">Switch off</button>` : ''}</div></div>
    <p class="nf25-p">Keys are saved on the server only. They never show again, not even to you.</p>`;
  body.insertBefore(card, body.firstChild);
}
async function nf25SaveSecret(name, inputId){
  const inp = document.getElementById(inputId), v = inp ? inp.value.trim() : '';
  if(!v){ showToast('Paste it first.', 'warn'); return; }
  try{ await adminRpc('admin_set_secret', {p_name: name, p_value: v}); }catch(e){ showToast(e.message, 'error'); return; }
  if(inp) inp.value = '';
  if(name === 'telegram_bot_token'){
    const { data, error } = await sb.functions.invoke('telegram-bot', {body: {action: 'setup'}});
    if(error || !data || !data.ok){ showToast(await nf25FnError(error, data), 'error'); renderAdminPage(); return; }
    showToast('Telegram is on: @' + data.bot, 'success');
  } else showToast('Notebook reading is on.', 'success');
  renderAdminPage();
}
async function nf25OffSecret(name){
  if(!confirm('Switch this off for every business?')) return;
  try{ await adminRpc('admin_set_secret', {p_name: name, p_value: ''}); }catch(e){ showToast(e.message, 'error'); return; }
  showToast('Switched off.', 'success'); renderAdminPage();
}

/* ---------- Export: everything in one Excel workbook ---------- */
function nf25Label(k){ const s = String(k).replace(/_/g, ' ').replace(/\s+/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }
function nf25Cell(v){ if(v == null) return ''; if(typeof v === 'object') return JSON.stringify(v); return v; }
function nf25Flat(o, pre, out){
  Object.entries(o || {}).forEach(([k, v]) => { const key = pre ? pre + ' ' + k : k;
    if(v && typeof v === 'object' && !Array.isArray(v)) nf25Flat(v, key, out);
    else if(!(Array.isArray(v) && v.length && v.every(x => x && typeof x === 'object'))) out[nf25Label(key)] = nf25Cell(v); });
  return out;
}
function nf25SheetName(s, used){ let n = nf25Label(s).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31); let i = 2; while(used.has(n)){ n = n.slice(0, 28) + ' ' + i++; } used.add(n); return n; }
async function nf25ExportXlsx(){
  let data, name;
  if(nf25Real()){
    const { data: d, error } = await sb.rpc('my_data_export');
    if(error){ showToast(error.message, 'error'); return; }
    data = d; name = myBusiness.name || 'business';
  } else {
    try{ data = collectNiftiPersistableState(); }catch(e){ data = {}; }
    name = 'Demo shop';
  }
  try{ await cpoLoadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); }catch(e){ showToast("Couldn't load the Excel maker. Check your internet and try again.", 'error'); return; }
  const wb = XLSX.utils.book_new(), used = new Set(), list = [];
  const addRows = (title, rows) => { if(!rows.length) return; const ws = XLSX.utils.json_to_sheet(rows); const cols = Object.keys(rows[0]).map(k => ({wch: Math.min(40, Math.max(10, k.length + 2))})); ws['!cols'] = cols; const n = nf25SheetName(title, used); XLSX.utils.book_append_sheet(wb, ws, n); list.push([n, rows.length]); };
  const about = [['Nifti records'], ['Business', name], ['Downloaded', new Date().toLocaleString('en-PH')], [''], ['Each tab is one part of your records. Open in Excel or Google Sheets.'], ['']];
  const aboutWs = XLSX.utils.aoa_to_sheet(about); XLSX.utils.book_append_sheet(wb, aboutWs, nf25SheetName('About', used));
  Object.entries(data || {}).forEach(([key, val]) => {
    if(Array.isArray(val)){
      const objs = val.filter(x => x && typeof x === 'object');
      if(!objs.length){ if(val.length) addRows(key, val.map(v => ({Value: nf25Cell(v)}))); return; }
      addRows(key, objs.map(r => nf25Flat(r, '', {})));
      // lists inside each row (order lines, payroll lines, ledger lines, payments, route stops) get their own tab
      const inner = {};
      objs.forEach(r => Object.entries(r).forEach(([f, v]) => { if(Array.isArray(v) && v.length && v.every(x => x && typeof x === 'object')){
        (inner[f] = inner[f] || []).push(...v.map(x => Object.assign({[nf25Label(key) + ' ref']: r.po_number || r.number || r.id || ''}, nf25Flat(x, '', {})))); } }));
      Object.entries(inner).forEach(([f, rows]) => addRows(key + ' ' + f, rows));
    } else if(val && typeof val === 'object'){
      addRows(key, Object.entries(nf25Flat(val, '', {})).map(([k, v]) => ({Field: k, Value: v})));
    }
  });
  XLSX.utils.sheet_add_aoa(aboutWs, [['Tab', 'Rows'], ...list], {origin: 'A7'});
  aboutWs['!cols'] = [{wch: 32}, {wch: 50}];
  XLSX.writeFile(wb, 'Nifti records - ' + String(name).replace(/[^a-z0-9 ]+/gi, ' ').trim() + ' - ' + (typeof APP_TODAY !== 'undefined' ? APP_TODAY : new Date().toISOString().slice(0, 10)) + '.xlsx');
  showToast(nf25Real() ? 'Downloaded. Keep it somewhere safe.' : 'Downloaded the demo shop\'s records.', 'success');
}
function nf25DataCard(){
  const c = document.getElementById('myDataCard'); if(!c || c.dataset.nf25) return; c.dataset.nf25 = '1';
  const row = c.querySelector('div[style*="flex-wrap"]'); if(!row) return;
  const b = document.createElement('button'); b.className = 'btn btn-primary'; b.type = 'button'; b.textContent = '⬇ Everything in Excel'; b.onclick = () => nf25ExportXlsx();
  row.insertBefore(b, row.firstChild);
  const j = [...row.querySelectorAll('button')].find(x => /Everything \(one file\)/.test(x.textContent)); if(j) j.textContent = '⬇ Everything (backup file)';
  const sub = c.querySelector('.sub'); if(sub) sub.textContent = 'Everything Nifti holds about your business is yours: orders, sales, expenses, stock, payroll, books, team notes and notebook pages. The Excel file has one tab for each.';
}

/* ---------- Store results: say clearly when the numbers are examples ---------- */
function nf25StoreStats(){
  if(nf25Real()) return;
  document.querySelectorAll('#view-app .panel-card').forEach(p => { if(p.dataset.nf25ex) return; const t = p.firstElementChild; if(t && /Last 30 days/.test(t.textContent) && /example numbers/.test(t.textContent)){ p.dataset.nf25ex = '1';
    const n = document.createElement('p'); n.className = 'nf25-exnote'; n.textContent = 'These are example numbers for the demo shop. In your own account, every visit and order from your store link is counted here.'; p.appendChild(n); } });
}

/* ---------- wiring ---------- */
(function(){
  try{ window.nf21PaintAlerts = nf25PaintAlerts; nf21PaintAlerts = nf25PaintAlerts; }catch(e){ console.warn('nf25 alerts', e); }
  const oa = window.nf21OpenAlerts;
  if(typeof oa === 'function' && !oa._nf25){ const w = function(){ NF25.tg = null; NF25.linkUrl = ''; NF25.qr = ''; return oa.apply(this, arguments); }; w._nf25 = true; window.nf21OpenAlerts = w; try{ nf21OpenAlerts = w; }catch(e){} }
  const ca = window.nf21CloseAlerts;
  if(typeof ca === 'function' && !ca._nf25){ const w = function(){ clearInterval(NF25.poll); return ca.apply(this, arguments); }; w._nf25 = true; window.nf21CloseAlerts = w; try{ nf21CloseAlerts = w; }catch(e){} }
  const rs = window.renderAdminSite;
  if(typeof rs === 'function' && !rs._nf25){ const w = async function(body){ const out = await rs.apply(this, arguments); try{ await nf25AdminServices(body); }catch(e){ console.warn('nf25 admin', e); } return out; }; w._nf25 = true; window.renderAdminSite = w; try{ renderAdminSite = w; }catch(e){} }
  const st = window.renderStoreStats;
  if(typeof st === 'function' && !st._nf25){ const w = async function(){ const out = await st.apply(this, arguments); try{ nf25StoreStats(); }catch(e){} return out; }; w._nf25 = true; window.renderStoreStats = w; try{ renderStoreStats = w; }catch(e){} }
  try{ window.exportFullHistory = nf25ExportXlsx; exportFullHistory = nf25ExportXlsx; }catch(e){}
  const start = () => { try{ nf25DataCard(); }catch(e){} const app = document.getElementById('view-app'); if(app && !app.dataset.nf25){ app.dataset.nf25 = '1'; let t = 0;
      new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { try{ nf25DataCard(); }catch(e){} }, 150); }).observe(app, {childList: true, subtree: true}); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 700)); else setTimeout(start, 700);
})();
