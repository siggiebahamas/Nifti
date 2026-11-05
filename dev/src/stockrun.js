/* ===== Home: "What runs out" (days left against supplier lead time, or pesos sitting on the shelf) ===== */
let srAll = false;
let srMode = (() => { try{ return localStorage.getItem('nifti_sr_mode') || 'days'; }catch(e){ return 'days'; } })();
function srRows(){
  const multi = new Set(inventoryData.map(i => i.warehouse || '')).size > 1;
  return inventoryData.filter(i => i && i.name).map(i => {
    const on = Number(i.onHand) || 0, lead = Number(i.leadTime) || 0, days = i.daysLeft != null && i.daysLeft !== '' ? Number(i.daysLeft) : null;
    const cost = typeof bkStockCost === 'function' ? (Number(bkStockCost(i.name)) || 0) : 0;
    const risk = days == null ? 'n' : lead && days <= lead ? 'r' : lead && days < lead * 2 ? 'y' : 'g';
    const wh = multi && typeof whLabel !== 'undefined' && whLabel[i.warehouse] ? whLabel[i.warehouse].split(' — ')[0] : '';
    return {code: i.code, name: i.name, wh, on, lead, days, cost, value: on * cost, risk, sup: i.supplier || ''};
  });
}
function srSetMode(m){ srMode = m; try{ localStorage.setItem('nifti_sr_mode', m); }catch(e){} const el = document.getElementById('srCard'); if(el) el.outerHTML = srCard(); }
function srCard(){
  if(typeof isPageAllowedForViewAsRole === 'function' && !isPageAllowedForViewAsRole('inventory')) return '';
  const rows = srRows(); if(!rows.length) return '';
  const days = srMode !== 'value', MAXD = 45;
  const short = rows.filter(r => r.risk === 'r').length, total = rows.reduce((a, r) => a + r.value, 0);
  const nos = rows.filter(r => r.days == null);
  let list, note;
  if(days){
    list = rows.filter(r => r.days != null).sort((a, b) => a.days - b.days);
    note = short ? `<b>${short} item${short > 1 ? 's' : ''} run${short > 1 ? '' : 's'} out before a new delivery could arrive.</b> Bar = days left at today's selling rate · black notch = days the supplier needs.`
      : `Nothing runs out before the supplier can deliver. Bar = days left · black notch = days the supplier needs.`;
  } else {
    list = rows.slice().sort((a, b) => b.value - a.value);
    const slow = rows.filter(r => r.days != null && r.days > 30).reduce((a, r) => a + r.value, 0);
    note = `<b>${fmtPHP(total)} on the shelf at cost.</b>${slow > 0 && total > 0 ? ` Slow sellers (over 30 days of stock) hold ${Math.round(slow / total * 100)}% of it.` : ''}`;
  }
  const mx = days ? MAXD : Math.max(1, ...list.map(r => r.value));
  const row = r => {
    const w = days ? (r.days == null ? 0 : Math.min(r.days, MAXD) / MAXD * 100) : r.value / mx * 100;
    const tone = days ? r.risk : (r.days != null && r.days > 30 ? 'slow' : r.risk === 'r' ? 'r' : 'n');
    const val = days ? (r.days == null ? '<span class="sr-dim">no sales yet</span>' : `${r.days} day${r.days === 1 ? '' : 's'}`) : (r.cost ? fmtPHP(r.value) : '<span class="sr-dim">cost not set</span>');
    const sub = (r.wh ? escapeHtml(r.wh) + ' · ' : '') + (days ? `${r.on} on hand${r.lead ? ` · ${escapeHtml(r.sup)} needs ${r.lead} day${r.lead === 1 ? '' : 's'}` : ''}` : `${r.on} on hand${r.days != null ? ` · ${r.days} days of stock` : ''}`);
    return `<button type="button" class="sr-row is-${tone}" onclick="go('inventory')"><span class="sr-l"><b>${escapeHtml(r.name)}</b><small title="${sub}">${sub}</small></span>
      <span class="sr-t"><i style="width:${w.toFixed(1)}%"></i>${days && r.lead ? `<u style="left:${(Math.min(r.lead, MAXD) / MAXD * 100).toFixed(1)}%"></u>` : ''}</span><span class="sr-v">${val}</span></button>`;
  };
  return `<section class="lg-panel sr-card" id="srCard"><div class="lg-ph"><b>What runs out</b>
      <span class="sr-seg" role="group" aria-label="Show stock by"><button type="button" class="${days ? 'on' : ''}" aria-pressed="${days}" onclick="srSetMode('days')">Days left</button><button type="button" class="${days ? '' : 'on'}" aria-pressed="${!days}" onclick="srSetMode('value')">Pesos on the shelf</button></span>
      <a class="lg-link" onclick="go('inventory')">Stock</a></div>
    <p class="sr-note">${note}</p><div class="sr-list">${(srAll ? list : list.slice(0, 8)).map(row).join('')}</div>
    ${days ? `<div class="sr-axis" aria-hidden="true"><span></span><span class="sr-ax">${[0, 10, 20, 30, 45].map(v => `<i style="left:${v / MAXD * 100}%">${v}${v === 45 ? '+ days' : ''}</i>`).join('')}</span><span></span></div>` : ''}
    ${list.length > 8 ? `<button type="button" class="sr-more" onclick="srAll=!srAll; srSetMode(srMode)">${srAll ? 'Show fewer' : `Show all ${list.length}`}</button>` : ''}
    ${days && nos.length ? `<p class="sr-nos"><b>No sales recorded yet (${nos.length}):</b> ${nos.map(r => escapeHtml(r.name) + (r.wh ? ' (' + escapeHtml(r.wh) + ')' : '')).join(', ')}</p>` : ''}
</section>`;
}
