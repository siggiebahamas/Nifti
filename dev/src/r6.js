/* ===== Round 6: every summary tile says good / bad / iffy / not important; numbers always fit ===== */
function nfNum(t){ t = String(t || '').replace(/\s+/g, ' ').trim(); const neg = /^[−-]|₱\s*[−-]/.test(t); const m = t.replace(/[₱,]/g, '').match(/(\d+(?:\.\d+)?)\s*([KkMm])?/); if(!m) return null;
  let v = parseFloat(m[1]) * (/[Kk]/.test(m[2] || '') ? 1e3 : /[Mm]/.test(m[2] || '') ? 1e6 : 1); return neg ? -v : v; }
const NF_TONE = [
  // [label starts with, tone(value, tile, sub)]  tones: bad | warn | good | plain
  ['missing this month', v => v > 0 ? 'bad' : 'good'],
  ['bad stock this month', v => v > 0 ? 'warn' : 'plain'],
  ['short this month', v => v > 0 ? 'bad' : 'good'],
  ['over this month', v => v > 0 ? 'warn' : 'plain'],
  ['days not counted', v => v > 0 ? 'warn' : 'good'],
  ['overdue', v => v > 0 ? 'bad' : 'good'],
  ['due in 7 days', v => v > 0 ? 'warn' : 'plain'],
  ['due this week', v => v > 0 ? 'warn' : 'plain'],
  ['promised to customers', () => 'plain'],
  ['promised', v => v > 0 ? 'warn' : 'plain'],
  ['to confirm', v => v > 0 ? 'warn' : 'plain'],
  ['to check', (v, el) => el.classList.contains('bad') ? 'bad' : v > 0 ? 'warn' : 'good'],
  ['money involved', v => v > 0 ? 'warn' : 'plain'],
  ['closed', v => v > 0 ? 'good' : 'plain'],
  ['gross profit', v => v < 0 ? 'bad' : v > 0 ? 'good' : 'plain'],
  ['net profit', v => v < 0 ? 'bad' : v > 0 ? 'good' : 'plain'],
  ['customers owe you', v => v > 0 ? 'warn' : 'plain'],
  ['owed to you', v => v > 0 ? 'warn' : 'plain'],
  ['utang', v => v > 0 ? 'warn' : 'plain'],
  ['collected this month', v => v > 0 ? 'good' : 'plain'],
  ['cash not yet in bank', v => v > 0 ? 'warn' : 'good'],
  ['not matched to bank', v => v > 0 ? 'warn' : 'good'],
  ['waiting for their ok', v => v > 0 ? 'warn' : 'plain'],
  ['said yes', v => v > 0 ? 'good' : 'plain'],
  ['reminders → orders', v => v > 0 ? 'good' : 'plain'],
  ['healthy', v => v > 0 ? 'good' : 'plain'],
  ['reorder now', v => v > 0 ? 'bad' : 'good'],
  ['spent in', (v, el) => el.classList.contains('warn') ? 'warn' : 'plain'],
  ['stock value', (v, el) => el.classList.contains('warn') ? 'warn' : 'plain'],
];
function nfToneOf(el, label, valueTxt){
  const l = label.toLowerCase().replace(/\s+/g, ' ').trim(), v = nfNum(valueTxt);
  for(const [k, f] of NF_TONE) if(l.startsWith(k)) return f(v == null ? 0 : v, el);
  if(/(^|\s)(bad|red)(\s|$)/.test(el.className)) return 'bad';
  if(/(^|\s)(warn|amber)(\s|$)/.test(el.className)) return 'warn';
  if(/(^|\s)(good|green)(\s|$)/.test(el.className)) return 'good';
  return 'plain';
}
function nfCal(){
  document.querySelectorAll('#mhHome .cal .day').forEach(d => { const st = d.querySelector('.st'), dn = d.querySelector('.dn');
    if(st && (st.classList.contains('tr') || st.classList.contains('tb'))) st.dataset.s = st.textContent.replace(/₱/g, '').trim();
    if(dn) dn.dataset.s = (dn.textContent.match(/\d+/) || [''])[0]; });
}
function nfTone(all){
  try{ nfCal(); }catch(e){}
  const changed = [];
  document.querySelectorAll('#view-app .bk-tile, #view-app .sl-tile, #view-app .stat-card').forEach(el => {
    const lb = el.querySelector('.bk-tile-l, :scope > small, .stat-label'), vl = el.querySelector('.bk-tile-v, :scope > b, .stat-num');
    if(!lb || !vl) return; const sig = lb.textContent + '|' + vl.textContent + '|' + el.className.replace(/\s*nt-\w+/g, '') + '|' + (el.offsetParent ? 1 : 0);
    if(el.dataset.ntSig === sig && !all) return; el.dataset.ntSig = sig;
    const t = nfToneOf(el, lb.textContent, vl.textContent); el.classList.remove('nt-bad', 'nt-warn', 'nt-good', 'nt-plain'); el.classList.add('nt-' + t);
    changed.push(vl);
  });
  document.querySelectorAll('#mhHome .tile .v').forEach(v => { const sig = v.textContent + (v.offsetParent ? 1 : 0); if(v.dataset.ntSig === sig && !all) return; v.dataset.ntSig = sig; changed.push(v); });
  nfFit(changed);
}
// last line of defence: shrink a number until it fits its box (never below 16px)
function nfFit(list){
  list.forEach(v => {
    if(!v.offsetParent) return; const card = v.closest('.tile,.bk-tile,.sl-tile,.stat-card'); if(!card) return;
    const tgt = v.querySelector('.cpill b') || v; tgt.style.removeProperty('font-size');
    const cs = getComputedStyle(card), lim = () => card.getBoundingClientRect().right - parseFloat(cs.paddingRight) + 1;
    const right = () => { const r = document.createRange(); r.selectNodeContents(v); return r.getBoundingClientRect().right; };
    let fs = parseFloat(getComputedStyle(tgt).fontSize), n = 0;
    while(right() > lim() && fs > 15 && n++ < 24){ fs -= 1; tgt.style.setProperty('font-size', fs + 'px', 'important'); }
  });
}
// the menu highlights one page only (Who owes you and Bank & deposits share a screen)
function nfNavOne(){
  const act = [...document.querySelectorAll('#view-app .nav-item.active')]; if(act.length < 2) return;
  const bank = typeof colTab !== 'undefined' && colTab === 'cash';
  act.forEach(a => { const isBank = /bank/i.test(a.dataset.page || '') || /Bank/.test(a.textContent); if(isBank !== bank) a.classList.remove('active'); });
}
(function(){ let raf = 0; const run = () => { raf = 0; try{ nfTone(); nfNavOne(); }catch(e){} };
  const start = () => { const host = document.getElementById('view-app') || document.body;
    new MutationObserver(() => { if(!raf) raf = requestAnimationFrame(run); }).observe(host, {childList:true, subtree:true, characterData:true});
    let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { try{ nfTone(true); }catch(e){} }, 120); }); run(); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start(); })();

// Orders: a friendly promised date with how close it is (never "null")
function nfDue(o){
  const d = o && o.requestedDeliveryDate; if(!d || d === 'null') return '<span class="ord-none">Not set</span>';
  const iso = String(d).slice(0, 10), x = new Date(iso + 'T00:00:00'); if(isNaN(x)) return escapeHtml(String(d));
  const lbl = x.toLocaleDateString('en-PH', {month: 'short', day: 'numeric'});
  if(typeof poIsDelivered === 'function' && poIsDelivered(o)) return `<b>${lbl}</b>`;
  const n = daysBetween(APP_TODAY, iso);
  const tag = n < 0 ? `<i class="late">${-n} day${n === -1 ? '' : 's'} late</i>` : n === 0 ? '<i class="soon">Due today</i>' : n <= 3 ? `<i class="soon">in ${n} day${n === 1 ? '' : 's'}</i>` : `<i class="later">in ${n} days</i>`;
  return `<b>${lbl}</b>${tag}`;
}
