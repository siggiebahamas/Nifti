/* ===== Round 9: built for phones =====
   On a phone (760px wide or less) the app changes shape, not just size:
   - More: every feature in one scrollable sheet, grouped like the desktop menu.
   - Chat: a full-screen conversation like Viber, with the message box always above the keyboard.
   - Home: the order board becomes stage tabs and simple cards; "What to do" becomes three tabs.
   - Tables become cards; pop-ups open full screen above the bottom bar; nothing zooms. */
const NF_PHONE = window.matchMedia('(max-width: 760px)');
function nfIsPhone(){ return NF_PHONE.matches; }
function nfPhoneClass(){ document.documentElement.classList.toggle('nf-phone', nfIsPhone()); }
nfPhoneClass(); try{ NF_PHONE.addEventListener('change', () => { nfPhoneClass(); try{ if(typeof homeIsActive === 'function' && homeIsActive()) renderMistHome(); }catch(e){} }); }catch(e){}
// keep fixed screens (chat, sheets) sized to the visible area when the keyboard opens
function nfViewport(){ const v = window.visualViewport; const h = v ? v.height : innerHeight, top = v ? v.offsetTop : 0;
  document.documentElement.style.setProperty('--nf-vvh', h + 'px'); document.documentElement.style.setProperty('--nf-vvt', top + 'px'); }
nfViewport(); if(window.visualViewport){ visualViewport.addEventListener('resize', nfViewport); visualViewport.addEventListener('scroll', nfViewport); } window.addEventListener('resize', nfViewport);

/* ---------- More: all features, grouped, scrollable ---------- */
function nfMoreSheetHtml(){
  const groups = [...document.querySelectorAll('.sidebar .nav-group')];
  const out = []; let first = true;
  groups.forEach(g => {
    const head = g.querySelector('.heading'); const name = head ? (head.childNodes[0] && head.childNodes[0].textContent || head.textContent).replace(/[▾▸]/g, '').trim() : (first ? 'Every day' : 'Account'); first = false;
    const items = [...g.querySelectorAll('.nav-item[data-page]')].filter(i => !['admin', 'growth'].includes(i.dataset.page) && !i.classList.contains('owner-only'));
    if(!items.length) return;
    out.push(`<section class="nfm-grp"><h6>${escapeHtml(name)}</h6><div class="nfm-grid">${items.map(i => { const svg = i.querySelector('svg'), label = (i.querySelector('span') || i).textContent.replace(/\d+$/, '').trim(), badge = i.querySelector('.nav-badge');
      const page = i.dataset.page, on = document.getElementById('page-' + page) && document.getElementById('page-' + page).classList.contains('active');
      return `<button type="button" class="nfm-it${on ? ' on' : ''}" data-nav="${escapeHtml(page)}" data-label="${escapeHtml(label)}">${svg ? svg.outerHTML : ''}<span>${escapeHtml(label)}</span>${badge && badge.textContent.trim() && getComputedStyle(badge).display !== 'none' ? `<i>${escapeHtml(badge.textContent.trim())}</i>` : ''}</button>`; }).join('')}</div></section>`);
  });
  return `<div class="nfm-h"><b>Everything in Nifti</b><button type="button" class="nfm-x" aria-label="Close" onclick="closeMoreSheet()">✕</button></div><div class="nfm-scroll">${out.join('')}
    <div class="nfm-foot">${window._nfMoreRow || ''}</div></div>`;
}
(function(){ const f = window.openMoreSheet; if(typeof f !== 'function' || f._nf9) return;
  const w = function(){ const s0 = document.getElementById('moreSheet'); if(s0 && !window._nfMoreRow){ const row = s0.querySelector('.more-sheet-row'); window._nfMoreRow = row ? row.outerHTML : ''; }
    const r = f.apply(this, arguments); const s = document.getElementById('moreSheet'); if(s){ s.classList.add('nfm'); s.innerHTML = nfMoreSheetHtml(); document.documentElement.classList.add('nf-sheet-open'); } return r; };
  w._nf9 = true; window.openMoreSheet = w;
  const c = window.closeMoreSheet; if(typeof c === 'function' && !c._nf9){ const w2 = function(){ document.documentElement.classList.remove('nf-sheet-open'); return c.apply(this, arguments); }; w2._nf9 = true; window.closeMoreSheet = w2; }
})();
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#moreSheet [data-nav]'); if(!b) return;
  const page = b.dataset.nav, label = b.dataset.label; closeMoreSheet();
  const item = [...document.querySelectorAll('.sidebar .nav-item[data-page="' + page + '"]')].find(i => (i.querySelector('span') || i).textContent.replace(/\d+$/, '').trim() === label) || document.querySelector('.sidebar .nav-item[data-page="' + page + '"]');
  if(item) item.click(); else go(page); window.scrollTo(0, 0); });

/* ---------- Chat: full screen on a phone ---------- */
function nfChatState(){ const sh = document.querySelector('.messages-shell'); const open = nfIsPhone() && !!sh && sh.classList.contains('thread-active') && document.getElementById('page-messages').classList.contains('active');
  document.documentElement.classList.toggle('nf-chat-open', open); }
(function(){ const f = window.backToConvList; if(typeof f === 'function' && !f._nf9){ const w = function(){ const r = f.apply(this, arguments); nfChatState(); return r; }; w._nf9 = true; window.backToConvList = w; } })();

/* ---------- Home: the order board as stage tabs + cards on a phone ---------- */
function nfBoardPhone(){
  const rows = mhOrderRows(); const cnt = i => rows.filter(r => r.stage === i).length;
  let st = window._nfStage; if(st == null || !cnt(st)){ st = [0, 1, 2, 3, 4, 5].find(i => rows.some(r => r.stage === i && r.tone === 'r')); if(st == null) st = [0, 1, 2, 3, 4, 5].find(i => cnt(i)); if(st == null) st = 0; }
  window._nfStage = st;
  const card = r => `<button type="button" class="nfb-card t-${r.tone}" onclick="setLens('${r.sell ? 'supplier' : 'buyer'}'); openOrderDetailModal('${r.id}', ${r.sell})"><span class="nfb-n">${mhEsc(r.name)}</span><span class="nfb-a">${mhPeso(r.total)}</span><span class="nfb-s">${mhEsc(r.note)}</span><span class="nfb-go" aria-hidden="true">›</span></button>`;
  const side = (s, t) => { const list = rows.filter(r => r.stage === st && r.side === s).sort((a, b) => ({r: 0, y: 1, g: 2}[a.tone] - {r: 0, y: 1, g: 2}[b.tone]));
    return `<div class="nfb-side nfb-${s}"><div class="nfb-sh"><i></i><b>${t}</b><span>${list.length}</span></div>${list.length ? list.map(card).join('') : `<div class="nfb-none">Nothing here right now.</div>`}</div>`; };
  return `<div class="nfb" id="nfBoard"><div class="nfb-stages" role="tablist">${MH_STAGES.map(([s], i) => `<button type="button" role="tab" aria-selected="${i === st}" class="${i === st ? 'on' : ''}${rows.some(r => r.stage === i && r.tone === 'r') ? ' late' : ''}" onclick="window._nfStage=${i}; document.getElementById('nfBoard').outerHTML = nfBoardPhone()"><em>${i + 1}</em><b>${s}</b><span>${cnt(i)}</span></button>`).join('')}</div>
    <p class="nfb-desc">${mhEsc(MH_STAGES[st][1])}</p>${side('sell', 'Selling to customers')}${side('buy', 'Buying from suppliers')}</div>`;
}
(function(){ const f = window.mhBoard; if(typeof f !== 'function' || f._nf9) return;
  const w = function(){ if(!nfIsPhone()) return f.apply(this, arguments); try{ return nfBoardPhone(); }catch(e){ console.warn(e); return f.apply(this, arguments); } };
  w._nf9 = true; window.mhBoard = w; })();
// "What to do": one lane at a time on a phone
function nfLaneTabs(){
  if(!nfIsPhone()) return; const lanes = [...document.querySelectorAll('#mhHome .lane')]; if(lanes.length < 2) return;
  const host = lanes[0].parentElement; if(!host || host.querySelector(':scope > .nfl-tabs')) return;
  let on = window._nfLane != null ? window._nfLane : 0;
  const tabs = document.createElement('div'); tabs.className = 'nfl-tabs'; tabs.setAttribute('role', 'tablist');
  tabs.innerHTML = lanes.map((l, i) => { const h = l.querySelector('.lane-h'); const sp = h ? h.querySelectorAll('span') : []; return `<button type="button" role="tab" class="${h ? h.className.replace('lane-h', '').trim() : ''}${i === on ? ' on' : ''}" data-i="${i}"><b>${sp[0] ? sp[0].textContent : ''}</b><span>${sp[1] ? sp[1].textContent : ''}</span></button>`; }).join('');
  host.insertBefore(tabs, lanes[0]); host.classList.add('nfl-host');
  const show = i => { lanes.forEach((l, k) => l.classList.toggle('nfl-on', k === i)); tabs.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i)); window._nfLane = i; };
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if(b) show(Number(b.dataset.i)); }); show(on);
}

/* ---------- tables become cards on a phone ---------- */
function nfCardTables(){
  document.querySelectorAll('#view-app table, #orderDetailModal table').forEach(t => {
    if(t.dataset.nfCard === '1' || t.closest('.cal, .mh-cal, .nfb, #mhSheet')) return;
    const heads = [...t.querySelectorAll('thead th')].map(th => th.textContent.replace(/[▲▼ⓘ−↑↓⇅↕]/g, '').trim());
    if(heads.length < 3) return;
    t.dataset.nfCard = '1'; t.classList.add('nf-cardtable');
  });
  document.querySelectorAll('table.nf-cardtable').forEach(t => { const heads = [...t.querySelectorAll('thead th')].map(th => th.textContent.replace(/[▲▼ⓘ−↑↓⇅↕]/g, '').trim());
    t.querySelectorAll('tbody tr').forEach(tr => { if(tr.dataset.nfL === String(heads.length)) return; tr.dataset.nfL = String(heads.length);
      [...tr.children].forEach((td, i) => { if(td.tagName === 'TD' && !td.hasAttribute('data-label')) td.setAttribute('data-label', heads[i] || ''); if(td.colSpan > 1) td.classList.add('nf-span'); }); }); });
}

/* ---------- run after every render ---------- */
(function(){ let raf = 0; const run = () => { raf = 0; try{ nfChatState(); nfLaneTabs(); nfCardTables(); }catch(e){} };
  const start = () => { new MutationObserver(() => { if(!raf) raf = requestAnimationFrame(run); }).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']}); run(); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start(); })();
// short placeholder on a phone (the long one wrapped inside the box)
(function(){ const set = () => { const i = document.getElementById('msgInput'); if(!i) return; if(!i.dataset.nfPh) i.dataset.nfPh = i.placeholder; i.placeholder = nfIsPhone() ? 'Message' : i.dataset.nfPh; };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', set); else set(); try{ NF_PHONE.addEventListener('change', set); }catch(e){} })();
// keep the chosen stage in view in the stage strip
function nfStageScroll(){ const s = document.querySelector('#nfBoard .nfb-stages'); if(!s || s.dataset.nfSc === String(window._nfStage)) return; const b = s.querySelector('button.on'); if(!b) return; s.dataset.nfSc = String(window._nfStage); s.scrollLeft = Math.max(0, b.offsetLeft - s.offsetLeft - 16); }
(function(){ let raf = 0; new MutationObserver(() => { if(!raf) raf = requestAnimationFrame(() => { raf = 0; try{ nfStageScroll(); }catch(e){} }); }).observe(document.body, {childList: true, subtree: true}); })();
