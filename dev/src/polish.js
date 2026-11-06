/* ===== One icon set for the whole app =====
   Emoji used as icons (in headings, buttons, tabs, list icons) are swapped for clean line icons.
   Customer-facing message text (chat bubbles, templates, inputs) is never touched. */
const NF_P = {
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  bank: '<path d="M3 21h18M5 18v-7M9.5 18v-7M14.5 18v-7M19 18v-7M12 3l9 5H3z"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.6L3 21l1.9-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  camera: '<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z"/><circle cx="12" cy="13" r="3.5"/>',
  wallet: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h16v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M16 14h.01"/>',
  moneyout: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 9v6M9.5 12.5 12 15l2.5-2.5"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  printer: '<path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8" rx="1"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  pencil: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
  bag: '<path d="M6 7h12l1 14H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L12 19a2.8 2.8 0 0 1-4-4z"/><path d="M14.7 6.3 17 4l3 3-2.3 2.3"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0M12 17v5"/>',
  bars: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  checkc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  stop: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  flame: '<path d="M12 22c4 0 7-2.7 7-7 0-4-3-6-4-9-1 2-2 3-4 3 0-2-1-4-2-5-1 4-4 6-4 11 0 4.3 3 7 7 7z"/>',
  drop: '<path d="M12 2.7s7 7.3 7 12.3a7 7 0 0 1-14 0c0-5 7-12.3 7-12.3z"/>',
  wifi: '<path d="M5 12.6a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0M12 20h.01"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M4 10h11"/><path d="M15 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
  food: '<path d="M3 11h18a9 9 0 0 1-18 0zM12 2v4M8 3v3M16 3v3"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  store: '<path d="M3 9 4.5 4h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>',
  factory: '<path d="M2 20V9l6 4V9l6 4V4h4l2 16z"/><path d="M2 20h20"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  hourglass: '<path d="M6 2h12M6 22h12M7 2v4a5 5 0 0 0 10 0V2M7 22v-4a5 5 0 0 1 10 0v4"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  map: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v12h16V8M10 12h4"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  siren: '<path d="M7 18v-6a5 5 0 0 1 10 0v6M5 21h14v-3H5zM12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4"/>',
  toolbox: '<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M9 7V4h6v3M2 13h20"/>',
  extinguisher: '<path d="M15 6.5V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3.5"/><path d="M9 18h8M18 9l3-3M10 22h6a1 1 0 0 0 1-1v-9a4 4 0 0 0-8 0v9a1 1 0 0 0 1 1z"/>',
  speak: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.6L3 21l1.9-5.4A8.4 8.4 0 1 1 21 11.5z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
  robot: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M9 13h.01M15 13h.01M9 17h6"/>'
};
const NF_E = {'💵':'cash','💴':'cash','🏦':'bank','🏛':'bank','🧾':'receipt','📝':'note','✍':'note','📋':'clipboard','🗂':'folder','🗄':'archive','📒':'book','📘':'book','📇':'clipboard','🚚':'truck','💬':'chat','🗣':'speak',
  '📦':'box','📎':'clip','🔒':'lock','🔐':'lock','🔑':'key','👀':'eye','👁':'eye','📷':'camera','💰':'wallet','💸':'moneyout','💡':'bulb','📍':'pin','🗺':'map','🤝':'users','👥':'users','👤':'user','🖨':'printer','💳':'card','⭐':'star',
  '🔁':'repeat','🔀':'shuffle','✏':'pencil','✎':'pencil','📲':'phone','📱':'phone','📵':'phone','📞':'call','🔔':'bell','📄':'file','📜':'file','🛒':'cart','🛍':'bag','🧺':'bag','📢':'megaphone','📣':'megaphone','⬆':'upload','📤':'upload','📥':'download',
  '🛠':'wrench','🔧':'wrench','🧰':'toolbox','📅':'cal','📨':'send','📩':'mail','📧':'mail','✉':'mail','📬':'mail','⚙':'gear','🎯':'target','🎙':'mic','🎤':'mic','📊':'bars','📈':'trend','🔗':'link','🛡':'shield','🕵':'shield','✅':'checkc',
  '⚠':'alert','🚨':'siren','⛔':'stop','❌':'stop','☀':'sun','💾':'save','🔥':'flame','🚰':'drop','📶':'wifi','🏠':'home','⛽':'fuel','🍚':'food','🏢':'building','🏪':'store','🏗':'building','🏭':'factory','🏷':'tag','⏰':'clock','🕒':'clock','⏱':'clock',
  '⏳':'hourglass','⏸':'pause','⚑':'flag','🏁':'flag','🔍':'search','🔎':'search','🌐':'globe','🗑':'trash','🧯':'extinguisher','🧻':'box','✋':'hand','👉':'flag','🤖':'robot'};
const NF_RX = /(\p{Extended_Pictographic}️?|[☀-➿]️?)/u;
const NF_SKIP = new Set(['✓', '✔', '✕', '✗', '•', '★', '☆', '→', '←', '↑', '↓', '↗', '↘', '⚡']);
const NF_NO = 'textarea, input, select, option, script, style, svg, [contenteditable], .msg-bubble, .conv-preview, .one-msg-t small, .qt-tpl, .tpl-text, .nf-keep, .chat-bubble, .mk-paper, .marketing-view';
const nfSvg = (k, cls) => `<svg class="nf-ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${NF_P[k]}</svg>`;
function nfIconText(node){
  const txt = node.nodeValue; if(!txt || !NF_RX.test(txt)) return;
  const el = node.parentElement; if(!el || el.closest(NF_NO)) return;
  const parts = txt.split(NF_RX); let changed = false, html = '';
  const first = parts.findIndex(p => p.trim() !== '');
  parts.forEach((p, i) => {
    const base = p.replace(/️/g, '');
    if(i % 2 === 1 && !NF_SKIP.has(base)){
      if(NF_E[base]){ html += nfSvg(NF_E[base]); changed = true; return; }
      if(i === first){ changed = true; return; } // a decorative emoji that leads a label: drop it
    }
    html += p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });
  if(!changed) return;
  const span = document.createElement('span'); span.className = 'nf-t'; span.innerHTML = html.replace(/^(<svg[^>]*>.*?<\/svg>)\s+/, '$1');
  node.parentNode.replaceChild(span, node);
}
function nfIconize(root){
  if(!root || root.nodeType !== 1 && root.nodeType !== 3) return;
  if(root.nodeType === 3){ nfIconText(root); return; }
  if(root.closest && root.closest(NF_NO)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [];
  while(w.nextNode()) list.push(w.currentNode);
  list.forEach(nfIconText);
}
(function nfStart(){
  if(typeof document === 'undefined') return;
  let queue = new Set(), raf = 0;
  const flush = () => { raf = 0; const q = queue; queue = new Set(); q.forEach(n => { if(n.isConnected) nfIconize(n); }); };
  const mo = new MutationObserver(ms => { ms.forEach(m => m.addedNodes.forEach(n => queue.add(n))); if(!raf) raf = requestAnimationFrame(flush); });
  const go = () => { const app = document.getElementById('view-app'); if(app){ nfIconize(app); mo.observe(app, {childList: true, subtree: true}); }
    mo.observe(document.body, {childList: true}); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
