/* ===== Home: "What runs out" =====
   Days left = stock on hand ÷ how fast it really sells (last 4 weeks of sales, the latest week weighted more;
   falls back to the item's own days-left figure when there's no sales history yet).
   Colours: Smart mode uses each supplier's delivery time:
     red    = runs out before a new delivery could arrive if you ordered today (days ≤ lead time + 1)
     yellow = order within the next ~2.5 weeks (days ≤ the larger of 17.5 or 2 × lead time + 3)
     green  = covered
   or the owner sets their own red / yellow limits in days. Saved with the business (books_settings.stock_levels). */
let srMode = (() => { try{ return localStorage.getItem('nifti_sr_mode') || 'days'; }catch(e){ return 'days'; } })();
let srAll = false, srEdit = false;
const SR_MAXD = 45;
function srLevels(){ const s = (typeof bkSettings === 'function' ? bkSettings().stock_levels : null) || {}; return {mode: s.mode === 'custom' ? 'custom' : 'smart', red: Number(s.red) > 0 ? Number(s.red) : 7, yellow: Number(s.yellow) > 0 ? Number(s.yellow) : 17}; }
function srRate(name){
  const moves = (typeof BK !== 'undefined' && BK.moves) ? BK.moves.filter(m => m.item === name && m.kind === 'sold' && m.qty < 0) : [];
  if(moves.length < 2) return null;
  const since = d => moves.filter(m => daysBetween(m.date, APP_TODAY) < d && daysBetween(m.date, APP_TODAY) >= 0).reduce((a, m) => a - m.qty, 0);
  const r7 = since(7) / 7, r28 = since(28) / 28;
  return r28 > 0 ? (r7 > 0 ? .6 * r7 + .4 * r28 : r28) : null;
}
function srRows(){
  const L = srLevels(), multi = new Set(inventoryData.map(i => i.warehouse || '')).size > 1;
  const byName = {}; inventoryData.forEach(i => { byName[i.name] = (byName[i.name] || 0) + (Number(i.onHand) || 0); });
  return inventoryData.filter(i => i && i.name).map(i => {
    const on = Number(i.onHand) || 0, leadKnown = Number(i.leadTime) > 0, lead = leadKnown ? Number(i.leadTime) : 7;
    const measured = srRate(i.name), share = byName[i.name] ? on / byName[i.name] : 1;
    let rate = measured != null ? measured * share : null, src = 'sales';
    if(rate == null && i.daysLeft != null && i.daysLeft !== '' && Number(i.daysLeft) > 0){ rate = on / Number(i.daysLeft); src = 'item'; }
    if(rate == null && Number(i.daysLeft) === 0 && i.daysLeft !== null && i.daysLeft !== ''){ rate = on || 1; src = 'item'; }
    const days = rate > 0 ? on / rate : null;
    const redMax = L.mode === 'custom' ? L.red : lead + 1, yelMax = L.mode === 'custom' ? Math.max(L.yellow, L.red) : Math.max(17.5, lead * 2 + 3);
    const risk = days == null ? 'n' : days <= redMax ? 'r' : days <= yelMax ? 'y' : 'g';
    const cost = typeof bkStockCost === 'function' ? (Number(bkStockCost(i.name)) || 0) : 0;
    const wh = multi && typeof whLabel !== 'undefined' && whLabel[i.warehouse] ? whLabel[i.warehouse].split(' — ')[0] : '';
    const orderIn = days == null ? null : Math.floor(days - lead - 1);
    const suggest = rate > 0 ? Math.max(0, Math.ceil(rate * (lead + 30) - on)) : 0;
    return {code: i.code, name: i.name, wh, on, unit: i.unit || '', lead, leadKnown, rate, src, days, redMax, yelMax, risk, cost, value: on * cost, sup: i.supplier || '', orderIn, suggest,
      slow: days == null || days > 60};
  });
}
function srSetMode(m){ srMode = m; try{ localStorage.setItem('nifti_sr_mode', m); }catch(e){} srRefresh(); }
function srRefresh(){ const el = document.getElementById('srCard'); if(el) el.innerHTML = srSection(); }
function srFmtDays(d){ return d == null ? '—' : d < 10 ? (Math.round(d * 10) / 10).toString().replace(/\.0$/, '') : String(Math.round(d)); }
function srDate(n){ return new Date(new Date(APP_TODAY + 'T00:00:00').getTime() + n * 864e5).toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}); }
function srRateTxt(r){ return r.rate == null ? 'no sales yet' : 'sells ' + (r.rate >= 10 ? Math.round(r.rate) : Math.round(r.rate * 10) / 10) + (r.unit ? ' ' + r.unit : '') + '/day'; }
async function srSaveLevels(){
  const mode = (document.querySelector('input[name="srLvMode"]:checked') || {}).value || 'smart';
  const red = Number((document.getElementById('srRed') || {}).value) || 7, yellow = Number((document.getElementById('srYel') || {}).value) || 17;
  if(mode === 'custom' && yellow <= red){ showToast('Yellow must be more days than red.', 'error'); return; }
  if(await bkSaveSettings({stock_levels: {mode, red, yellow}})){ srEdit = false; srRefresh(); showToast(mode === 'smart' ? 'Using smart levels from each supplier\'s delivery time.' : `Saved: red at ${red} days or less, yellow up to ${yellow} days.`, 'success'); }
}
function srLevelsPanel(L){
  return `<div class="sr-lv"><div class="sr-lv-h"><b>Stock level colours</b><button type="button" class="sr-x" onclick="srEdit=false; srRefresh()" aria-label="Close">✕</button></div>
    <label class="sr-opt"><input type="radio" name="srLvMode" value="smart" ${L.mode === 'smart' ? 'checked' : ''} onchange="document.getElementById('srCustom').classList.add('off')"><span><b>Smart (recommended)</b><small>Uses each supplier's delivery time. Red when it would run out before a new delivery could arrive. Yellow when you should order within about 2½ weeks (longer for slow suppliers). Green when covered.</small></span></label>
    <label class="sr-opt"><input type="radio" name="srLvMode" value="custom" ${L.mode === 'custom' ? 'checked' : ''} onchange="document.getElementById('srCustom').classList.remove('off')"><span><b>My own days</b><small>The same limits for every item.</small></span></label>
    <div class="sr-custom${L.mode === 'custom' ? '' : ' off'}" id="srCustom"><label><span class="sw r"></span>Red at <input id="srRed" type="number" min="1" max="120" value="${L.red}" inputmode="numeric"> days or less</label><label><span class="sw y"></span>Yellow up to <input id="srYel" type="number" min="2" max="180" value="${L.yellow}" inputmode="numeric"> days</label><span class="sr-note2"><span class="sw g"></span>Green: more than that</span></div>
    <div class="sr-lv-f"><button type="button" class="btn ghost" onclick="srEdit=false; srRefresh()">Cancel</button><button type="button" class="btn" onclick="srSaveLevels()">Save</button></div></div>`;
}
function srSection(){
  const rows = srRows(); if(!rows.length) return `<div class="sect-h"><h4>What runs out</h4></div><p class="sr-note">Add products in Stock to see what runs out.</p>`;
  const L = srLevels(), days = srMode !== 'value';
  const known = rows.filter(r => r.days != null), nos = rows.filter(r => r.days == null);
  const nr = known.filter(r => r.risk === 'r').length, ny = known.filter(r => r.risk === 'y').length, ng = known.filter(r => r.risk === 'g').length;
  const total = rows.reduce((a, r) => a + r.value, 0), slowV = rows.filter(r => r.slow).reduce((a, r) => a + r.value, 0), riskV = rows.filter(r => r.risk === 'r' || r.risk === 'y').reduce((a, r) => a + r.value, 0);
  let list, note;
  if(days){
    list = known.sort((a, b) => a.days - b.days);
    note = nr ? `<b>${nr} item${nr > 1 ? 's' : ''} need${nr > 1 ? '' : 's'} ordering today</b>: ${nr > 1 ? 'they run' : 'it runs'} out before a new delivery could arrive.${ny ? ` ${ny} more to order within about 2 weeks.` : ''}` : ny ? `<b>Nothing urgent.</b> ${ny} item${ny > 1 ? 's' : ''} to order within about 2 weeks.` : '<b>Everything is covered</b> for the next few weeks.';
  } else {
    list = rows.slice().sort((a, b) => b.value - a.value);
    note = `<b>${mhPesoSr(total)} on the shelf at cost.</b> ${total ? Math.round(slowV / total * 100) + '% is in slow sellers (over 60 days of stock, or no sales yet)' : ''}${riskV ? `; ${mhPesoSr(riskV)} is in items running low.` : '.'}`;
  }
  const mxV = Math.max(1, ...list.map(r => r.value)), shown = srAll ? list : list.slice(0, 8);
  const row = r => {
    if(days){
      const w = Math.min(r.days, SR_MAXD) / SR_MAXD * 100, rz = Math.min(r.redMax, SR_MAXD) / SR_MAXD * 100, yz = Math.min(r.yelMax, SR_MAXD) / SR_MAXD * 100;
      const act = r.risk === 'r' ? `<span class="sr-act r">Order today${r.suggest ? ' · about ' + r.suggest + (r.unit ? ' ' + r.unit : '') + ' covers a month' : ''}</span>` : r.risk === 'y' ? `<span class="sr-act y">Order by ${r.orderIn <= 0 ? 'today' : srDate(r.orderIn)}${r.suggest ? ' · about ' + r.suggest + (r.unit ? ' ' + r.unit : '') + ' covers a month' : ''}</span>` : `<span class="sr-act g">Covered until about ${srDate(Math.floor(r.days))}</span>`;
      return `<button type="button" class="sr-row is-${r.risk}" onclick="go('inventory')"><span class="sr-l"><b>${escapeHtml(r.name)}</b><small>${r.wh ? escapeHtml(r.wh) + ' · ' : ''}${r.on} on hand · ${srRateTxt(r)}${r.sup ? ' · ' + escapeHtml(r.sup) + ' delivers in ' + r.lead + ' day' + (r.lead === 1 ? '' : 's') + (r.leadKnown ? '' : ' (assumed)') : ''}</small>${act}</span>
        <span class="sr-t" aria-hidden="true"><span class="z zr" style="width:${rz}%"></span><span class="z zy" style="left:${rz}%;width:${Math.max(0, yz - rz)}%"></span><i style="width:${Math.max(1.5, w).toFixed(1)}%"></i>${L.mode === 'smart' ? `<u style="left:${(Math.min(r.lead, SR_MAXD) / SR_MAXD * 100).toFixed(1)}%"></u>` : ''}</span>
        <span class="sr-v"><b>${srFmtDays(r.days)} day${srFmtDays(r.days) === '1' ? '' : 's'}</b><small>runs out ${srDate(Math.floor(r.days))}</small></span></button>`;
    }
    const tone = r.risk === 'r' ? 'r' : r.risk === 'y' ? 'y' : r.slow ? 'slow' : 'g', w = r.value / mxV * 100;
    const tag = tone === 'r' ? 'Running out' : tone === 'y' ? 'Order soon' : tone === 'slow' ? (r.days == null ? 'Not selling' : 'Slow seller') : 'Healthy';
    return `<button type="button" class="sr-row sr-val is-${tone}" onclick="go('inventory')"><span class="sr-l"><b>${escapeHtml(r.name)}</b><small>${r.wh ? escapeHtml(r.wh) + ' · ' : ''}${r.on} on hand${r.cost ? ' × ' + mhPesoSr(r.cost) : ''} · ${r.days == null ? 'no sales yet' : srFmtDays(r.days) + ' days of stock'}</small><span class="sr-act ${tone}">${tag}</span></span>
      <span class="sr-t"><i style="width:${Math.max(1.5, w).toFixed(1)}%"></i></span><span class="sr-v"><b>${r.cost ? mhPesoSr(r.value) : '—'}</b><small>${r.cost && total ? Math.round(r.value / total * 100) + '% of stock' : 'cost not set'}</small></span></button>`;
  };
  const legend = days
    ? `<span class="sr-k r"><i></i>Order today <b>${nr}</b></span><span class="sr-k y"><i></i>Order soon <b>${ny}</b></span><span class="sr-k g"><i></i>Covered <b>${ng}</b></span><span class="sr-k t">${L.mode === 'smart' ? '<u></u>Black notch = supplier delivery time · shaded = red and yellow zones' : `Your levels: red ≤ ${L.red} days, yellow ≤ ${L.yellow} days`}</span>`
    : `<span class="sr-k r"><i></i>Running out</span><span class="sr-k y"><i></i>Order soon</span><span class="sr-k g"><i></i>Healthy</span><span class="sr-k slow"><i></i>Slow or not selling: cash tied up</span>`;
  return `<div class="sect-h"><h4>What runs out</h4><span class="mh-sp"></span>
      <span class="sr-seg" role="group" aria-label="Show stock by"><button type="button" aria-pressed="${days}" onclick="srSetMode('days')">Days left</button><button type="button" aria-pressed="${!days}" onclick="srSetMode('value')">Pesos on the shelf</button></span>
      <button type="button" class="sch-btn" onclick="srEdit=!srEdit; srRefresh()" aria-expanded="${srEdit}">Colour levels: ${L.mode === 'smart' ? 'Smart' : 'My days'}</button><button type="button" class="sch-btn" onclick="go('inventory')">Stock ›</button></div>
    ${srEdit ? srLevelsPanel(L) : ''}
    <p class="sr-note">${note}</p><div class="sr-legend">${legend}</div>
    <div class="sr-list">${shown.map(row).join('')}</div>
    ${days ? `<div class="sr-axis" aria-hidden="true"><span></span><span class="sr-ax">${[0, 7, 14, 21, 30, 45].map(v => `<i style="left:${v / SR_MAXD * 100}%">${v}${v === 45 ? '+' : ''}</i>`).join('')}</span><span>days left</span></div>` : ''}
    ${list.length > 8 ? `<button type="button" class="sr-more" onclick="srAll=!srAll; srRefresh()">${srAll ? 'Show fewer' : `Show all ${list.length}`}</button>` : ''}
    ${days && nos.length ? `<p class="sr-nos"><b>No sales recorded yet (${nos.length}):</b> ${nos.map(r => escapeHtml(r.name) + (r.wh ? ' (' + escapeHtml(r.wh) + ')' : '')).join(', ')}. They show once they start selling.</p>` : ''}`;
}
function mhPesoSr(n){ return '₱' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('en-PH'); }
