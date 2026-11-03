
/* ============ ENGLISH / FILIPINO for the whole dashboard ============
   One switch (EN | FIL). Everything the app itself writes is translated as it appears on screen:
   menus, buttons, headings, tips, toasts, pop-ups. What people typed (names, products, chat
   messages, notes) is never touched. Phrases with numbers, dates, order numbers or names are
   matched as templates: "Bill {0}" is one entry, whoever {0} is. English is restored exactly. */
const I18N_SKIP = '.msg-bubble, .msg-bubble-row, .msg-thread-body, .chat-bubble, .message-bubble, .team-chat-thread, .team-chat-msg, .one-msg-t small, .conv-preview, .conv-name, .no-i18n, textarea, script, style, code, pre, [contenteditable="true"], #view-index, #view-features, #view-pricing, #view-login, .marketing-view';
const I18N_KEEP = '.conv-kind';
const I18N_ATTRS = ['placeholder', 'title', 'aria-label'];
const I18N_DATE = {Mon: 'Lun', Tue: 'Mar', Wed: 'Miy', Thu: 'Huw', Fri: 'Biy', Sat: 'Sab', Sun: 'Lin',
  Monday: 'Lunes', Tuesday: 'Martes', Wednesday: 'Miyerkules', Thursday: 'Huwebes', Friday: 'Biyernes', Saturday: 'Sabado', Sunday: 'Linggo',
  Jan: 'Ene', Feb: 'Peb', Mar: 'Mar', Apr: 'Abr', May: 'May', Jun: 'Hun', Jul: 'Hul', Aug: 'Ago', Sep: 'Set', Sept: 'Set', Oct: 'Okt', Nov: 'Nob', Dec: 'Dis',
  January: 'Enero', February: 'Pebrero', March: 'Marso', April: 'Abril', June: 'Hunyo', July: 'Hulyo', August: 'Agosto', September: 'Setyembre', October: 'Oktubre', November: 'Nobyembre', December: 'Disyembre',
  WEDNESDAY: 'MIYERKULES', MONDAY: 'LUNES', TUESDAY: 'MARTES', THURSDAY: 'HUWEBES', FRIDAY: 'BIYERNES', SATURDAY: 'SABADO', SUNDAY: 'LINGGO',
  JANUARY: 'ENERO', FEBRUARY: 'PEBRERO', MARCH: 'MARSO', APRIL: 'ABRIL', MAY: 'MAYO', JUNE: 'HUNYO', JULY: 'HULYO', AUGUST: 'AGOSTO', SEPTEMBER: 'SETYEMBRE', OCTOBER: 'OKTUBRE', NOVEMBER: 'NOBYEMBRE', DECEMBER: 'DISYEMBRE'};
const I18N_MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec|JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER';
const I18N_DAYS = 'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY';
// order of token kinds matters: ids, then money, then dates, then names, then plain numbers
const I18N_TOK = new RegExp([
  '\\b(?:PO|RFQ|INV|SI|DR|CM|OR|BAL|SKU|PROD)-[A-Z0-9][A-Za-z0-9-]*',
  '[-−]?₱\\s?[\\d,]+(?:\\.\\d+)?[KM]?',
  '\\b(?:' + I18N_DAYS + ')(?=,)',
  '\\b(?:' + I18N_MONTHS + ')(?=\\s+\\d)',
  '(?<=\\d\\s)(?:' + I18N_MONTHS + ')\\b',
  '\\b\\d{4}-\\d{2}-\\d{2}\\b',
  '\\d{1,2}:\\d{2}(?:\\s?[AP]M)?',
].join('|'), 'g');
const I18N_NUM = /[-+]?\d[\d,]*(?:\.\d+)?/g;
let I18N_FIL = {}; // English (or English template) → Filipino; filled by the dictionary below
let i18nNameRx = null, i18nNameSig = '';
const i18nCache = new Map();
function i18nNames(){
  const names = new Set();
  const add = v => { v = String(v || '').trim(); if(v.length >= 3 && /[A-Za-z]/.test(v)) names.add(v); };
  try{
    (buyersData || []).forEach(x => add(x.name)); (suppliersData || []).forEach(x => add(x.name));
    (inventoryData || []).forEach(x => { add(x.name); add(x.supplier); });
    (purchaseOrders || []).forEach(o => { add(o.buyerName); add(o.supplierName); (o.lineItems || []).forEach(l => add(l.product)); });
    allConversations().forEach(c => add(c.name)); (teamMembers || []).forEach(m => { add(m.name); add(String(m.name).replace(/ \(You\)$/, '')); });
    add(selfName()); if(typeof BK !== 'undefined'){ BK.sales.forEach(s => add(s.customer)); BK.expenses.forEach(e => { add(e.vendor); add(e.staff); add(e.by); }); BK.moves.forEach(x => { add(x.item); add(x.by); }); BK.counts.forEach(c => add(c.by)); }
    (myCatalog || []).forEach(c => add(c.product));
  }catch(e){}
  // our own words are never names
  ['Walk-in', 'Cash', 'GCash', 'Maya', 'Bank', 'Card'].forEach(w => names.delete(w));
  return [...names];
}
function i18nRefreshNames(){
  const list = i18nNames();
  const sig = list.length + ':' + list.join('|').length;
  if(sig === i18nNameSig && i18nNameRx) return;
  i18nNameSig = sig;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  list.sort((a, b) => b.length - a.length);
  i18nNameRx = list.length ? new RegExp('(?<![A-Za-z])(?:' + list.map(esc).join('|') + ')(?![A-Za-z])', 'g') : null;
  i18nComboRx = new RegExp(I18N_TOK.source + (i18nNameRx ? '|' + i18nNameRx.source : ''), 'g');
  i18nCache.clear();
}
// "Bill Cavite Steel Works · ₱38,304" → key "Bill {0} · {1}", vals ["Cavite Steel Works", "₱38,304"]
let i18nComboRx = null;
function i18nKey(text){
  const vals = [], mark = v => { vals.push(v); return '\u0001' + String.fromCharCode(0xE000 + vals.length - 1) + '\u0002'; };
  const rx = i18nComboRx || I18N_TOK; rx.lastIndex = 0;
  let k = text.replace(rx, m => mark(m));
  k = k.replace(I18N_NUM, m => mark(m));
  const out = [];
  k = k.replace(/\u0001([\uE000-\uF8FF])\u0002/g, (m, c) => { out.push(vals[c.charCodeAt(0) - 0xE000]); return '{' + (out.length - 1) + '}'; });
  return {key: k, vals: out};
}
function i18nVal(v){
  return String(v).replace(new RegExp('\\b(?:' + I18N_MONTHS + '|' + I18N_DAYS + ')\\b', 'g'), w => I18N_DATE[w] || w);
}
function i18nTr(raw){
  if(raw == null) return raw;
  const s = String(raw);
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  const core = s.trim().replace(/\s+/g, ' ');
  if(!core || !/[A-Za-z]/.test(core)) return raw;
  if(i18nCache.has(core)){ const c = i18nCache.get(core); return c == null ? raw : lead + c + trail; }
  let out = null;
  if(Object.prototype.hasOwnProperty.call(I18N_FIL, core)) out = I18N_FIL[core];
  else {
    const {key, vals} = i18nKey(core);
    if(key !== core && Object.prototype.hasOwnProperty.call(I18N_FIL, key)) out = I18N_FIL[key].replace(/\{(\d+)\}/g, (m, d) => vals[Number(d)] != null ? i18nVal(vals[Number(d)]) : m);
    else if(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/.test(core) && /^[\s\d,.:APM–-]*(?:\b[A-Za-z]{3,9}\b[\s\d,.:APM–-]*){1,3}$/.test(core)) out = i18nVal(core); // a bare date like "Mon, Aug 24"
  }
  i18nCache.set(core, out);
  return out == null ? raw : lead + out + trail;
}
function i18nSkip(el){
  if(!el || el.nodeType !== 1) return false;
  if(el.closest(I18N_KEEP)) return false;
  return !!el.closest(I18N_SKIP);
}
function i18nNode(n){
  if(n.nodeType === 3){
    const p = n.parentElement; if(!p || i18nSkip(p)) return;
    const cur = n.nodeValue;
    if(n.__fil === cur) return;
    const t = i18nTr(cur);
    if(t !== cur){ n.__en = cur; n.__fil = t; n.nodeValue = t; }
    return;
  }
  if(n.nodeType !== 1 || i18nSkip(n)) return;
  I18N_ATTRS.forEach(a => {
    if(!n.hasAttribute(a)) return;
    const cur = n.getAttribute(a); n.__ia = n.__ia || {};
    if(n.__ia[a] && n.__ia[a].fil === cur) return;
    const t = i18nTr(cur);
    if(t !== cur){ n.__ia[a] = {en: cur, fil: t}; n.setAttribute(a, t); }
  });
  if(n.tagName === 'OPTION' || n.tagName === 'SELECT' || n.childNodes.length) n.childNodes.forEach(i18nNode);
}
function i18nRoots(){ return [document.getElementById('view-app'), ...document.querySelectorAll('body > .share-modal-backdrop, body > .sl-modal, body > [id$="Modal"], body > .app-toast-stack, #appToastStack, .app-toast-stack, #createMenuDropdown, #notifDropdown, #userMenuDropdown, #moreSheet, #bottomNav, .sidebar')].filter(Boolean); }
function i18nApply(root){
  if(currentLanguage !== 'FIL') return;
  i18nRefreshNames();
  (root ? [root] : i18nRoots()).forEach(r => i18nNode(r));
}
function i18nRestore(root){
  const walk = n => {
    if(n.nodeType === 3){ if(n.__en != null && n.nodeValue === n.__fil) n.nodeValue = n.__en; n.__en = n.__fil = undefined; return; }
    if(n.nodeType !== 1) return;
    if(n.__ia){ Object.entries(n.__ia).forEach(([a, v]) => { if(n.getAttribute(a) === v.fil) n.setAttribute(a, v.en); }); n.__ia = null; }
    n.childNodes.forEach(walk);
  };
  walk(root || document.body);
}
(function(){
  let pending = new Set(), timer = null;
  const flush = () => { timer = null; if(currentLanguage !== 'FIL'){ pending.clear(); return; } i18nRefreshNames(); const list = [...pending]; pending = new Set(); list.forEach(n => { if(n.isConnected) i18nNode(n); }); };
  const start = () => {
    new MutationObserver(ms => {
      if(currentLanguage !== 'FIL') return;
      ms.forEach(m => {
        if(m.type === 'characterData'){ if(m.target.__fil !== m.target.nodeValue) pending.add(m.target); }
        else if(m.type === 'attributes'){ pending.add(m.target); }
        else m.addedNodes.forEach(n => pending.add(n));
      });
      if(!timer) timer = setTimeout(flush, 0);
    }).observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS});
    let saved = null; try{ saved = localStorage.getItem('nifti-lang'); }catch(e){}
    if(saved === 'FIL' || saved === 'EN') currentLanguage = saved;
    i18nSyncSwitch();
    if(currentLanguage === 'FIL') i18nApply();
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})();
function i18nSyncSwitch(){
  document.querySelectorAll('.lang-switch button').forEach(b => { b.classList.toggle('on', b.getAttribute('data-lang') === currentLanguage); b.setAttribute('aria-pressed', b.getAttribute('data-lang') === currentLanguage); });
  document.documentElement.lang = currentLanguage === 'FIL' ? 'fil' : 'en';
}
function setLanguage(lang){
  if(lang !== 'EN' && lang !== 'FIL') return;
  currentLanguage = lang;
  try{ localStorage.setItem('nifti-lang', lang); }catch(e){}
  if(typeof scheduleNiftiSave === 'function') scheduleNiftiSave();
  i18nSyncSwitch();
  if(lang === 'FIL') i18nApply(); else i18nRestore();
  // redraw the page you're on so every number-filled line is rebuilt in the new language
  const active = document.querySelector('.app-page.active');
  if(active && document.getElementById('view-app') && !document.getElementById('view-app').classList.contains('hidden')){
    const y = window.scrollY; navigate(active.id.replace('page-', '')); window.scrollTo(0, y);
  }
}
toggleLanguage = function(){ setLanguage(currentLanguage === 'FIL' ? 'EN' : 'FIL'); };
// Native pop-ups (confirm/prompt/alert) speak the same language.
['alert', 'confirm', 'prompt'].forEach(fn => {
  const base = window[fn].bind(window);
  window[fn] = function(msg, def){ return currentLanguage === 'FIL' ? base(i18nTr(msg), def) : base(msg, def); };
});
// The old 30-word table still labels a few headings in English; the translator does the rest.
t = function(key){ return (TRANSLATIONS.EN && TRANSLATIONS.EN[key]) || key; };
