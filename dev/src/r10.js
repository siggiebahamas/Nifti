/* ===== Round 10 =====
   1. Remove a proof photo you added (blurry, wrong one). Both sides still see "Photo removed by …".
   2. Phone: the cash drawer redesigned for a small screen. */

/* ---------- 1. remove a photo ---------- */
(function(){
  const list0 = window.nfOpList; if(typeof list0 !== 'function' || list0._nf10) return;
  window.nfOpList = async function(poId, force){
    if(!nfLive()) return list0.apply(this, arguments);
    if(NFOP.cache[poId] && !force) return NFOP.cache[poId];
    const { data, error } = await sb.from('order_photos').select('*').eq('po_id', poId).order('created_at', {ascending: true});
    if(error){ console.warn(error); return NFOP.cache[poId] = []; }
    const rows = data || [], live = rows.filter(x => !x.deleted_at); let urls = [];
    if(live.length){ const r = await sb.storage.from('order-photos').createSignedUrls(live.map(x => x.path), 3600); urls = r.data || []; }
    NFOP.cache[poId] = rows.map(x => { const i = live.indexOf(x); return {id: x.id, kind: x.kind, url: i > -1 && urls[i] ? urls[i].signedUrl : '', by: x.taken_by_name || '', at: x.created_at, caption: x.caption || '', mine: x.business_id === myBusiness.id, path: x.path, removed: x.deleted_at ? {at: x.deleted_at, by: x.deleted_by_name || ''} : null}; });
    return NFOP.cache[poId];
  };
  window.nfOpList._nf10 = true;
})();
async function nfOpRemove(poId, i){
  const p = (NFOP.cache[poId] || [])[i]; if(!p || p.removed) return;
  if(!confirm('Remove this photo? Both sides will see that a photo was removed, and by whom.')) return;
  const by = (typeof bkMe === 'function' ? bkMe() : '') || 'Someone';
  if(!nfLive()){
    const s = nfOpDemoStore(), list = s[poId] || [], j = list.findIndex(x => x.id === p.id);
    if(j > -1){ list[j] = {id: p.id, kind: p.kind, url: '', by: p.by, at: p.at, removed: {at: new Date().toISOString(), by}}; try{ localStorage.setItem(NF_OP_DEMO, JSON.stringify(s)); }catch(e){} }
    NFOP.cache[poId] = list.slice();
  } else {
    const r = await sb.rpc('remove_order_photo', {p_id: p.id, p_name: by});
    if(r.error){ showToast("Couldn't remove it: " + r.error.message, 'error'); return; }
    await sb.storage.from('order-photos').remove([r.data || p.path]);
    await nfOpList(poId, true);
  }
  slClose('nfOpView'); nfOpRenderGrid(poId);
  showToast('Photo removed. Take a new one when you are ready.', 'success');
}
(function(){
  const grid0 = window.nfOpRenderGrid; if(typeof grid0 !== 'function' || grid0._nf10) return;
  window.nfOpRenderGrid = async function(poId){
    const grid = document.getElementById('nfOpGrid'); if(!grid) return;
    const list = await nfOpList(poId); const g = document.getElementById('nfOpGrid'); if(!g) return;
    const lbl = Object.fromEntries(NF_OP_KINDS), live = list.map((p, i) => [p, i]).filter(([p]) => !p.removed && p.url), gone = list.filter(p => p.removed);
    const when = t => new Date(t).toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
    g.innerHTML = (live.length ? live.map(([p, i]) => `<button type="button" class="nf-op-th" onclick="nfOpView('${poId}', ${i})"><img alt="${escapeHtml(lbl[p.kind] || 'Photo')} photo" src="${p.url}"><span>${escapeHtml(lbl[p.kind] || 'Photo')}</span></button>`).join('')
      : '<div class="nf-op-empty">No photos yet. A photo of the signed receipt or the payment slip settles any question later.</div>')
      + gone.map(p => `<div class="nf-op-gone">${escapeHtml(lbl[p.kind] || 'Photo')} photo removed by ${escapeHtml(p.removed.by || 'someone')} · ${when(p.removed.at)}</div>`).join('');
  };
  window.nfOpRenderGrid._nf10 = true;
  const view0 = window.nfOpView; if(typeof view0 !== 'function' || view0._nf10) return;
  window.nfOpView = function(poId, i){
    const p = (NFOP.cache[poId] || [])[i]; if(!p) return; const lbl = Object.fromEntries(NF_OP_KINDS);
    slModal('nfOpView', `<div class="sl-sheet-h"><b>${escapeHtml(lbl[p.kind] || 'Photo')} photo</b><button class="sl-x" onclick="slClose('nfOpView')">✕</button></div>
      <div class="nf-ok-img"><img alt="" src="${p.url}"></div>
      <div class="sl-sub">${p.by ? 'By ' + escapeHtml(p.by) + ' · ' : ''}${new Date(p.at).toLocaleString('en-PH', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})}${p.caption ? ' · ' + escapeHtml(p.caption) : ''}</div>
      ${p.mine ? `<div class="nf-cam-acts"><button class="btn btn-outline nf-bad" onclick="nfOpRemove('${poId}', ${i})">Remove photo</button><button class="btn btn-primary" onclick="slClose('nfOpView'); nfOpShoot()">Take a new one</button></div>` : ''}`);
  };
  window.nfOpView._nf10 = true;
})();

/* ---------- 2. the cash drawer on a phone ---------- */
const NF_DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
function nfShortPeso(n){ const a = Math.abs(Math.round(n)); return (n < 0 ? '−' : '+') + (a >= 1000 ? (a / 1000).toFixed(a >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : a); }
function nfDrawerPhone(){
  if(!MH.cal){ const [y, m] = APP_TODAY.split('-').map(Number); MH.cal = {y, m}; }
  const {y, m} = MH.cal, by = mhCounts(), s = mhSched(), P = mhProt();
  const first = new Date(y, m - 1, 1), dim = new Date(y, m, 0).getDate(), pad = (first.getDay() + 6) % 7;
  let cells = '', shorts = 0, overs = 0, ok = 0;
  for(let i = 0; i < pad; i++) cells += '<span class="nfd-c blank" aria-hidden="true"></span>';
  for(let d = 1; d <= dim; d++){ const k = mhKey(y, m, d), c = by[k];
    if(k === APP_TODAY && !c){ const w = mhWho(k, s); cells += `<button type="button" class="nfd-c today" onclick="mhOpenSched()" aria-label="Today, ${mhEsc(mhFull(w))} counts"><b>${d}</b><i>${mhEsc(mhIni(w))}</i></button>`; continue; }
    if(k > APP_TODAY){ const w = mhWho(k, s); cells += `<button type="button" class="nfd-c future" onclick="mhOpenSched()" aria-label="${mhLabel(k)}, ${mhEsc(mhFull(w))} counts"><b>${d}</b><i>${mhEsc(mhIni(w))}</i></button>`; continue; }
    if(!c){ cells += `<span class="nfd-c none"><b>${d}</b></span>`; continue; }
    const tn = mhTone(c.diff); if(tn === 'r') shorts++; else if(tn === 'b') overs++; else ok++;
    cells += `<button type="button" class="nfd-c ${tn}" onclick="mhOpenDay('${k}')" aria-label="${mhLabel(k)}, ${mhEsc(mhFull(c.by))}, ${tn === 'g' ? 'matched' : mhSigned(c.diff)}"><b>${d}</b><i>${tn === 'g' ? '✓' : nfShortPeso(c.diff)}</i></button>`;
  }
  const mo = mhKey(y, m, 1).slice(0, 7), people = [...new Set(Object.values(by).filter(c => bkMonth(c.day) === mo).map(c => mhFirst(c.by)))];
  const pp = people.map(n => { const net = mhPersonNet(n, mo), offs = Object.values(by).filter(c => bkMonth(c.day) === mo && mhFirst(c.by) === n && Math.abs(c.diff) >= 1).sort((a, b) => a.day.localeCompare(b.day));
    const last = Object.values(by).filter(c => mhFirst(c.by) === n).map(c => c.day).sort().pop();
    return `<button type="button" class="nfd-p" onclick="mhOpenDay('${last}')"><span class="nfd-av">${mhEsc(mhIni(n))}</span><span class="nfd-pm"><b>${mhEsc(mhFull(n))}</b><small>${offs.length ? offs.map(c => mhLabel(c.day) + ' ' + mhSigned(c.diff)).join(' · ') : 'Every count matched'}</small></span><span class="nfd-net t${mhTone(net)}">${Math.round(net) === 0 ? 'Even' : mhSigned(net)}<small>net</small></span></button>`; }).join('');
  const on = MH_PROTS.filter(([k]) => P[k]).length;
  return `<div class="sect-h"><h4>Cash drawer</h4>${P.surprise ? '<button class="sch-btn" type="button" onclick="mhCountNow()">Count now</button>' : ''}</div>
    <button type="button" class="nfd-who" onclick="mhOpenSched()"><span>Who counts</span><b>${mhEsc(mhRule(s))}</b><i>Edit</i></button>
    ${pp ? `<div class="nfd-ps">${pp}</div>` : ''}
    <div class="nfd-cal"><div class="nfd-mh"><button type="button" aria-label="Previous month" onclick="mhCalMove(-1)">‹</button><b>${mhMonL[m - 1]} ${y}</b><button type="button" aria-label="Next month" onclick="mhCalMove(1)">›</button></div>
      <div class="nfd-st">${ok || shorts || overs ? `<span class="g">${ok} matched</span><span class="r">${shorts} short</span><span class="b">${overs} over</span>` : '<span>No counts this month yet</span>'}</div>
      <div class="nfd-grid">${NF_DOW.map(d => `<span class="nfd-dow">${d}</span>`).join('')}${cells}</div>
      <p class="nfd-hint">Tap a day to see its count. Initials show who counts next.</p></div>
    <div class="nfd-acts"><button type="button" onclick="mhOpenProtect()">Protections <small>${on} on</small></button><button type="button" onclick="mhEditHistory()">Edit history</button></div>`;
}
(function(){ const f = window.mhDrawer; if(typeof f !== 'function' || f._nf10) return;
  const w = function(){ if(!(typeof nfIsPhone === 'function' && nfIsPhone())) return f.apply(this, arguments); try{ return nfDrawerPhone(); }catch(e){ console.warn(e); return f.apply(this, arguments); } };
  w._nf10 = true; window.mhDrawer = w; })();
