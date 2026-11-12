/* ===== Round 22: an online store that does the selling work for people who don't sell online ===== */
// Six tabs, each one job: Post today (ready for you), Make a post (3 taps), My week (plan once, get reminded),
// Get more buyers (groups, Marketplace, QR poster, reviews, Viber community), Reply fast (answers to "HM?"),
// My store (link, prices, results). Every post comes with the words AND a picture Nifti draws for you.

const NF22S = {tab: 'today', idea: 0, ver: 0, lang: 'tl', short: false,
  make: {type: 'spot', items: [], theme: 'green', tone: 'friendly', newPrice: '', until: ''}, replyItem: '', photo: {}};
// the demo shop's store settings, the same ones the store form shows
if(!window._demoStore) window._demoStore = {enabled: true, headline: 'Cement, steel & hardware. Same-day delivery in Marikina and nearby.', delivery_areas: 'Marikina, Metro Manila, Bulacan', delivery_days: 'Mon–Sat', lead_time: 'Order by 2pm, delivered next day', min_order: 5000, price_mode: 'public', cod: true, show_phone: true};
try{ const t = localStorage.getItem('nifti-store-tab'); if(t) NF22S.tab = t; const l = localStorage.getItem('nifti-post-lang'); if(l) NF22S.lang = l; }catch(e){}

/* ---------- the shop, its items and its link ---------- */
function nf22Shop(){
  const biz = (typeof myBusiness !== 'undefined' && myBusiness) ? myBusiness : null;
  const st = biz ? (biz.store || {}) : (window._demoStore || {});
  const name = biz ? biz.name : 'Dela Cruz Hardware';
  const slug = biz ? (biz.store_slug || (typeof slugify === 'function' ? slugify(biz.name) : 'my-store')) : 'dela-cruz-hardware';
  const areas = st.delivery_areas || 'Marikina, Metro Manila';
  const town = biz ? ((biz.city || '').trim() || areas.split(',')[0].trim()) : 'Marikina';
  return {name, slug, st, areas, town, lead: st.lead_time || 'Order today, delivered tomorrow', days: st.delivery_days || 'Mon–Sat', cod: st.cod !== false, min: Number(st.min_order) || 0,
    open: !!st.enabled, url: src => (typeof storeUrl === 'function' ? storeUrl(slug, src) : 'https://nifti.ph/s/' + slug + '/'), hours: st.hours || '8 AM – 5 PM'};
}
function nf22Items(){
  const cat = (typeof myCatalog !== 'undefined' && myCatalog) || [], inv = (typeof inventoryData !== 'undefined' && inventoryData) || [];
  const sold = {}; try{ (BK.sales || []).filter(s => !s.voided).forEach(s => (s.lines || []).forEach(l => { sold[l.product] = (sold[l.product] || 0) + (Number(l.qty) || 0); })); }catch(e){}
  const out = cat.map(c => { const i = inv.find(x => x.name === c.product) || {};
    return {name: c.product, price: Number(c.price || c.unitPrice || i.sellPrice) || 0, unit: c.unit || 'pc', onHand: i.onHand, max: i.maxLevel, days: i.daysLeft, status: i.status, sold: sold[c.product] || 0}; });
  inv.forEach(i => { if(!out.some(o => o.name === i.name) && i.sellPrice) out.push({name: i.name, price: Number(i.sellPrice) || 0, unit: 'pc', onHand: i.onHand, max: i.maxLevel, days: i.daysLeft, status: i.status, sold: sold[i.name] || 0}); });
  return out.filter(o => o.name);
}
const nf22P = v => '₱' + Math.round(Number(v) || 0).toLocaleString('en-PH');
function nf22Esc(s){ return typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s)) : String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); }
function nf22Short(url){ return String(url).replace(/^https?:\/\//, '').replace(/\/$/, ''); }

/* ---------- selling days in the Philippines ---------- */
function nf22Days(from, n){
  const out = [], d0 = new Date(from + 'T00:00:00'), iso = d => d.toISOString().slice(0, 10);
  const lastMon = (y, m) => { const d = new Date(Date.UTC(y, m + 1, 0)); while(d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() - 1); return d; };
  for(let k = 0; k <= n; k++){
    const d = new Date(Date.UTC(d0.getFullYear(), d0.getMonth(), d0.getDate() + k)), y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate(), md = (m + 1) * 100 + day;
    const end = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), s = iso(d);
    if(day === 15 || day === end) out.push({d: s, k: 'pay', t: 'Payday (sweldo)', idea: 'People fix and buy after payday. Post your price list the day before.', type: 'list'});
    if(lastMon(y, 7).getTime() === d.getTime()) out.push({d: s, k: 'hol', t: 'National Heroes Day (holiday)', idea: 'Tell people if you are open, and your hours.', type: 'hours'});
    const fixed = {101: ['New Year', 'hours'], 409: ['Araw ng Kagitingan (holiday)', 'hours'], 501: ['Labor Day (holiday)', 'hours'], 612: ['Independence Day (holiday)', 'hours'], 821: ['Ninoy Aquino Day (holiday)', 'hours'],
      901: ['"Ber" months start', 'list', 'Christmas fix-ups start now. Post "Pa-ayos bago mag-Pasko".'], 1015: ['Undas is in 2 weeks', 'spot', 'Paint and cement for tomb repairs sell well before Nov 1.'], 1101: ['All Saints\' Day (Undas)', 'hours'],
      1130: ['Bonifacio Day (holiday)', 'hours'], 1208: ['Feast of the Immaculate Conception (holiday)', 'hours'], 1225: ['Christmas Day', 'thanks'], 1230: ['Rizal Day (holiday)', 'hours'], 601: ['Rainy season starts', 'spot', 'Roof, gutter and leak repairs. Post sealant, GI wire and cement.'], 301: ['Dry season: building time', 'list', 'Most building happens now. Post your price list every Monday.']};
    const f = fixed[md]; if(f) out.push({d: s, k: 'day', t: f[0], idea: f[2] || (f[1] === 'hours' ? 'Tell people if you are open, and your hours.' : f[1] === 'thanks' ? 'Thank your suki. It brings them back in January.' : 'A good day to post.'), type: f[1]});
  }
  let fiesta = ''; try{ fiesta = localStorage.getItem('nifti-fiesta') || ''; }catch(e){}
  if(fiesta){ const y = d0.getFullYear(); [y, y + 1].forEach(yy => { const s = yy + fiesta.slice(4); const t = new Date(s + 'T00:00:00') - d0; if(t >= 0 && t <= n * 864e5) out.push({d: s, k: 'fiesta', t: 'Your town fiesta', idea: 'Houses get fixed and painted before the fiesta. Post 2 weeks before.', type: 'list'}); }); }
  return out.sort((a, b) => a.d < b.d ? -1 : 1);
}

/* ---------- what to post today: picked from your stock and the calendar ---------- */
function nf22Ideas(){
  const items = nf22Items(), today = APP_TODAY, out = [];
  const plenty = items.filter(i => i.onHand != null && ((i.max && i.onHand >= i.max * 0.8) || (i.days != null && i.days >= 30))).sort((a, b) => (b.onHand || 0) - (a.onHand || 0))[0];
  if(plenty) out.push({type: 'spot', items: [plenty.name], why: `You have plenty of ${plenty.name} (${plenty.onHand} on hand). A post turns that stock into cash.`, tag: 'Plenty in stock'});
  const soon = nf22Days(today, 6).find(x => x.k === 'pay');
  if(soon) out.push({type: 'list', items: items.slice().sort((a, b) => b.sold - a.sold).slice(0, 5).map(i => i.name), why: `Payday is ${typeof hmDay === 'function' ? hmDay(soon.d) : soon.d}. People buy right after. Post your price list before it.`, tag: 'Payday is coming'});
  const best = items.slice().sort((a, b) => b.sold - a.sold)[0];
  if(best && (!plenty || best.name !== plenty.name)) out.push({type: 'spot', items: [best.name], why: `${best.name} is your best seller. Remind people you have it.`, tag: 'Best seller'});
  let arriving = null; try{ arriving = getBuyerPOs().filter(o => ['shipped', 'delivered'].includes(o.status)).map(o => (o.lineItems || []).map(l => l.product)).flat()[0]; }catch(e){}
  if(arriving) out.push({type: 'new', items: [arriving], why: `New stock of ${arriving} is arriving. "Bagong dating" posts get people asking.`, tag: 'New stock'});
  const m = Number(today.slice(5, 7)); if(m >= 6 && m <= 10) out.push({type: 'spot', items: items.filter(i => /cement|wire|seal|roof|gi/i.test(i.name)).slice(0, 1).map(i => i.name), why: 'It is rainy season. People fix roofs and leaks now.', tag: 'Rainy season'});
  out.push({type: 'deliver', items: [], why: 'People forget you deliver. Say where and when.', tag: 'Delivery day'});
  out.push({type: 'thanks', items: [], why: 'A thank-you post keeps your suki coming back.', tag: 'Thank your suki'});
  return out.filter(x => x.type !== 'spot' || x.items.length);
}

/* ---------- the words ---------- */
const NF22_TYPES = [['spot', 'One item', 'Show one item and its price'], ['list', 'Price list', 'Up to 6 items, one picture'], ['sale', 'Sale', 'Lower price for a few days'],
  ['new', 'New stock', '"Bagong dating" items'], ['deliver', 'We deliver', 'Where and when you deliver'], ['hours', 'Open today', 'Holiday or store hours'], ['thanks', 'Thank you', 'For your suki']];
function nf22Caption(spec){
  const s = nf22Shop(), all = nf22Items(), it = (spec.items || []).map(n => all.find(i => i.name === n) || {name: n, price: 0, unit: 'pc'});
  const L = spec.lang || NF22S.lang, tone = spec.tone || 'friendly', e = tone === 'simple' ? () => '' : x => x + ' ', v = (spec.ver || 0);
  const link = s.url(spec.src || 'fb'), one = it[0] || {name: 'our items', price: 0, unit: 'pc'};
  const lines = it.slice(0, 6).map(i => `• ${i.name}: ${nf22P(i.price)}/${i.unit}`).join('\n');
  const pick = arr => arr[v % arr.length];
  const fun = tone === 'fun';
  const T = {
    tl: {
      spot: [pick([`${e('✅')}Available na po: ${one.name}!`, `${e('📢')}Meron po kami ng ${one.name}!`, `${e('👷')}Para sa inyong project: ${one.name}`]), `${e('💰')}${nf22P(one.price)} per ${one.unit}`, `${e('🚚')}Delivery sa ${s.areas}. ${s.lead}.`, `${e('📦')}Maramihan? May discount po.`, fun ? 'Matibay, pang-matagalan. Hindi ka iiwan. 😄' : '', `${e('👉')}Order dito: ${link}`, 'O mag-PM lang po. Salamat!'],
      list: [pick([`${e('📋')}PRESYO NGAYONG LINGGO`, `${e('📋')}Updated price list po`, `${e('💸')}Sweldo na! Presyo namin ngayon:`]), `${s.name}`, lines, `${e('🚚')}Delivery sa ${s.areas}`, `${e('👉')}Order online: ${link}`, 'PM lang po para sa bulk orders!'],
      sale: [pick([`${e('📣')}SALE po ngayong linggo!`, `${e('📣')}Bawas-presyo po!`]), `${one.name}: ${spec.newPrice ? nf22P(one.price) + ' → ' + nf22P(spec.newPrice) + ' na lang' : nf22P(one.price)} per ${one.unit}!`, spec.until ? `Hanggang ${spec.until} lang po.` : 'Habang may stock pa po.', fun ? 'Bilis, baka maubusan! 😄' : '', `${e('👉')}${link}`],
      new: [pick([`${e('📦')}Bagong dating po!`, `${e('📦')}Kumpleto na ulit ang stock!`]), it.length ? it.map(i => `• ${i.name}`).join('\n') : '', 'Order na habang marami pa.', `${e('🚚')}Delivery sa ${s.areas}`, `${e('👉')}${link}`],
      deliver: [pick([`${e('🚚')}Nagdedeliver po kami!`, `${e('🚚')}Delivery schedule po namin:`]), `${s.days} sa ${s.areas}.`, `${s.lead}.`, s.cod ? 'Pwede po ang COD (cash on delivery).' : '', `${e('👉')}Order dito: ${link}`],
      hours: [pick([`${e('📅')}Bukas po kami!`, `${e('📅')}Paalala po sa oras namin:`]), `${spec.until || 'Ngayong araw'}: ${s.hours}.`, 'Pwede rin pong mag-order online anytime:', `${e('👉')}${link}`],
      thanks: [pick([`${e('🙏')}Salamat po sa lahat ng suki namin!`, `${e('🙏')}Maraming salamat po sa tiwala!`]), `Dahil sa inyo, tuloy-tuloy ang ${s.name}.`, fun ? 'Kayo ang tunay na pundasyon namin. 😄' : '', `Sa susunod na order: ${link}`],
    },
    en: {
      spot: [pick([`${e('✅')}Now available: ${one.name}`, `${e('📢')}In stock: ${one.name}`]), `${nf22P(one.price)} per ${one.unit}`, `We deliver to ${s.areas}. ${s.lead}.`, 'Ordering in bulk? Ask us for a better price.', fun ? 'Built to last. Unlike some promises. 😄' : '', `${e('👉')}Order here: ${link}`],
      list: [pick([`${e('📋')}THIS WEEK'S PRICES`, `${e('📋')}Updated price list`]), s.name, lines, `Delivery to ${s.areas}`, `${e('👉')}Order online: ${link}`, 'Message us for bulk orders.'],
      sale: [`${e('📣')}SALE this week!`, `${one.name}: ${spec.newPrice ? nf22P(one.price) + ' → now ' + nf22P(spec.newPrice) : nf22P(one.price)} per ${one.unit}`, spec.until ? `Until ${spec.until} only.` : 'While stocks last.', `${e('👉')}${link}`],
      new: [`${e('📦')}Just arrived!`, it.length ? it.map(i => `• ${i.name}`).join('\n') : '', 'Order while stocks are high.', `${e('👉')}${link}`],
      deliver: [`${e('🚚')}We deliver!`, `${s.days} to ${s.areas}.`, `${s.lead}.`, s.cod ? 'Cash on delivery is OK.' : '', `${e('👉')}Order here: ${link}`],
      hours: [`${e('📅')}We're open!`, `${spec.until || 'Today'}: ${s.hours}.`, 'You can also order online anytime:', `${e('👉')}${link}`],
      thanks: [`${e('🙏')}Thank you to all our regular customers!`, `You keep ${s.name} going.`, `For your next order: ${link}`],
    },
    fil: {
      spot: [`${e('✅')}Mayroon na po kaming ${one.name}!`, `${nf22P(one.price)} bawat ${one.unit}`, `Nagdadala kami sa ${s.areas}.`, 'Maramihan? May bawas po.', `${e('👉')}Mag-order dito: ${link}`],
      list: [`${e('📋')}PRESYO NGAYONG LINGGO`, s.name, lines, `Dinadala namin sa ${s.areas}`, `${e('👉')}Mag-order dito: ${link}`],
      sale: [`${e('📣')}Bawas-presyo ngayong linggo!`, `${one.name}: ${spec.newPrice ? nf22P(spec.newPrice) + ' na lang' : nf22P(one.price)} bawat ${one.unit}`, spec.until ? `Hanggang ${spec.until} lamang.` : 'Habang may natitira pa.', `${e('👉')}${link}`],
      new: [`${e('📦')}Bagong dating po!`, it.length ? it.map(i => `• ${i.name}`).join('\n') : '', `${e('👉')}${link}`],
      deliver: [`${e('🚚')}Nagdadala po kami ng order!`, `${s.days} sa ${s.areas}.`, s.cod ? 'Bayad pagdating, pwede po.' : '', `${e('👉')}${link}`],
      hours: [`${e('📅')}Bukas po kami!`, `${spec.until || 'Ngayon'}: ${s.hours}.`, `${e('👉')}${link}`],
      thanks: [`${e('🙏')}Maraming salamat po sa aming mga suki!`, `Sa susunod na order: ${link}`],
    }};
  let rows = ((T[L] || T.tl)[spec.type] || T.tl.spot).filter(x => x && String(x).trim());
  if(spec.short || NF22S.short) rows = [rows[0], rows.find(r => /₱/.test(r) && r !== rows[0]) || '', rows[rows.length - 1]].filter(Boolean);
  if(tone !== 'simple' && !(spec.short || NF22S.short)) rows.push(L === 'en' ? '#' + s.town.replace(/\s+/g, '') + ' #hardware #construction' : '#' + s.town.replace(/\s+/g, '') + ' #hardware #murangpresyo');
  return rows.join('\n');
}

/* ---------- the picture: Nifti draws a clean post card, with your own photo if you add one ---------- */
const NF22_THEMES = {green: ['#1F6B45', '#FFFFFF', '#FDE68A', '#123F29'], blue: ['#2563EB', '#FFFFFF', '#FDE68A', '#163E8C'], yellow: ['#FDE047', '#1D2939', '#1F6B45', '#1D2939'], slate: ['#334155', '#FFFFFF', '#FDE68A', '#1E293B']};
function nf22Wrap(ctx, text, max){ const w = String(text).split(/\s+/), out = []; let line = ''; w.forEach(x => { const t = line ? line + ' ' + x : x; if(ctx.measureText(t).width > max && line){ out.push(line); line = x; } else line = t; }); if(line) out.push(line); return out; }
function nf22Rr(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function nf22Glyph(ctx, kind, cx, cy, s, col){
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if(kind === 'deliver'){ ctx.strokeRect(cx - s * 0.5, cy - s * 0.25, s * 0.6, s * 0.45); ctx.beginPath(); ctx.moveTo(cx + s * 0.1, cy - s * 0.1); ctx.lineTo(cx + s * 0.35, cy - s * 0.1); ctx.lineTo(cx + s * 0.5, cy + s * 0.05); ctx.lineTo(cx + s * 0.5, cy + s * 0.2); ctx.lineTo(cx + s * 0.1, cy + s * 0.2); ctx.stroke();
    [cx - s * 0.3, cx + s * 0.3].forEach(x => { ctx.beginPath(); ctx.arc(x, cy + s * 0.27, s * 0.09, 0, 7); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.stroke(); }); }
  else if(kind === 'hours'){ nf22Rr(ctx, cx - s * 0.42, cy - s * 0.32, s * 0.84, s * 0.7, s * 0.08); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - s * 0.42, cy - s * 0.12); ctx.lineTo(cx + s * 0.42, cy - s * 0.12); ctx.stroke();
    [-0.2, 0.2].forEach(k => { ctx.beginPath(); ctx.moveTo(cx + s * k, cy - s * 0.42); ctx.lineTo(cx + s * k, cy - s * 0.24); ctx.stroke(); }); ctx.beginPath(); ctx.moveTo(cx - s * 0.14, cy + s * 0.12); ctx.lineTo(cx - s * 0.02, cy + s * 0.24); ctx.lineTo(cx + s * 0.2, cy); ctx.stroke(); }
  else if(kind === 'thanks'){ ctx.beginPath(); const y = cy - s * 0.1; ctx.moveTo(cx, y + s * 0.42); ctx.bezierCurveTo(cx - s * 0.6, y, cx - s * 0.32, y - s * 0.4, cx, y - s * 0.12); ctx.bezierCurveTo(cx + s * 0.32, y - s * 0.4, cx + s * 0.6, y, cx, y + s * 0.42); ctx.fill(); }
  else { ctx.strokeRect(cx - s * 0.4, cy - s * 0.25, s * 0.8, s * 0.55); ctx.beginPath(); ctx.moveTo(cx - s * 0.4, cy - s * 0.25); ctx.lineTo(cx - s * 0.25, cy - s * 0.42); ctx.lineTo(cx + s * 0.55, cy - s * 0.42); ctx.lineTo(cx + s * 0.4, cy - s * 0.25); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - s * 0.1, cy - s * 0.25); ctx.lineTo(cx - s * 0.1, cy - s * 0.05); ctx.lineTo(cx + s * 0.1, cy - s * 0.05); ctx.lineTo(cx + s * 0.1, cy - s * 0.25); ctx.stroke(); }
  ctx.restore();
}
async function nf22Draw(cv, spec){
  const ctx = cv.getContext('2d'), W = 1080, H = 1080; cv.width = W; cv.height = H;
  try{ await document.fonts.load('800 60px "Plus Jakarta Sans"'); }catch(e){}
  const th = NF22_THEMES[spec.theme] || NF22_THEMES.green, [bg, ink, tag, deep] = th, s = nf22Shop(), all = nf22Items();
  const it = (spec.items || []).map(n => all.find(i => i.name === n) || {name: n, price: 0, unit: 'pc'});
  const F = (w, px) => `${w} ${px}px "Plus Jakarta Sans", Inter, system-ui, sans-serif`;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.07; ctx.strokeStyle = ink; ctx.lineWidth = 26; for(let x = -H; x < W; x += 90){ ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke(); } ctx.restore();
  // top: shop name
  ctx.fillStyle = ink; ctx.font = F(800, 50); ctx.textBaseline = 'top'; ctx.fillText(s.name, 64, 60);
  ctx.font = F(600, 30); ctx.globalAlpha = 0.85; ctx.fillText(spec.type === 'list' ? (spec.lang === 'en' ? "This week's prices" : 'Presyo ngayong linggo') : (spec.lang === 'en' ? 'Order online or message us' : 'Order online o mag-PM'), 64, 124); ctx.globalAlpha = 1;
  // middle: white card
  const cx = 64, cy = 196, cw = W - 128, ch = 640; ctx.fillStyle = '#FFFFFF'; nf22Rr(ctx, cx, cy, cw, ch, 36); ctx.fill();
  const head = {sale: 'SALE', new: spec.lang === 'en' ? 'JUST ARRIVED' : 'BAGONG DATING', deliver: spec.lang === 'en' ? 'WE DELIVER' : 'NAGDEDELIVER KAMI', hours: spec.lang === 'en' ? "WE'RE OPEN" : 'BUKAS PO KAMI', thanks: spec.lang === 'en' ? 'THANK YOU' : 'SALAMAT PO'}[spec.type];
  if(spec.type === 'list'){
    ctx.fillStyle = '#101828'; let y = cy + 56; const rows = it.slice(0, 6);
    rows.forEach((r, i) => { ctx.font = F(700, 42); const nm = nf22Wrap(ctx, r.name, cw - 420)[0]; ctx.fillStyle = '#101828'; ctx.fillText(nm, cx + 48, y);
      ctx.font = F(800, 46); ctx.fillStyle = deep === '#1D2939' ? '#1F6B45' : deep; const p = nf22P(r.price); const pw = ctx.measureText(p).width; ctx.fillText(p, cx + cw - 48 - pw - 110, y - 2);
      ctx.font = F(600, 28); ctx.fillStyle = '#475467'; ctx.fillText('/' + r.unit, cx + cw - 48 - 104, y + 10);
      y += 92; if(i < rows.length - 1){ ctx.fillStyle = '#EAECF0'; ctx.fillRect(cx + 48, y - 24, cw - 96, 3); } });
    if(!rows.length){ ctx.font = F(700, 40); ctx.fillStyle = '#475467'; ctx.fillText('Add items in Stock first', cx + 48, cy + 80); }
  } else if(['deliver', 'hours', 'thanks'].includes(spec.type)){
    nf22Glyph(ctx, spec.type, W / 2, cy + 210, 260, deep === '#1D2939' ? '#1F6B45' : bg);
    ctx.fillStyle = '#101828'; ctx.font = F(800, 64); ctx.textAlign = 'center'; ctx.fillText(head, W / 2, cy + 380);
    ctx.font = F(600, 38); ctx.fillStyle = '#344054';
    const sub = spec.type === 'deliver' ? `${s.days} · ${s.areas}` : spec.type === 'hours' ? `${spec.until || (spec.lang === 'en' ? 'Today' : 'Ngayon')} · ${s.hours}` : (spec.lang === 'en' ? 'to all our regular customers' : 'sa lahat ng aming suki');
    nf22Wrap(ctx, sub, cw - 120).slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, cy + 470 + i * 52)); ctx.textAlign = 'left';
  } else {
    const one = it[0] || {name: 'Your item', price: 0, unit: 'pc'}, ph = NF22S.photo[one.name];
    const ix = cx + 40, iy = cy + 40, iw = cw - 80, ih = 330;
    if(ph){ await new Promise(res => { const im = new Image(); im.onload = () => { const r = Math.max(iw / im.width, ih / im.height), w = im.width * r, h = im.height * r; ctx.save(); nf22Rr(ctx, ix, iy, iw, ih, 26); ctx.clip(); ctx.drawImage(im, ix + (iw - w) / 2, iy + (ih - h) / 2, w, h); ctx.restore(); res(); }; im.onerror = res; im.src = ph; }); }
    else { ctx.fillStyle = '#F2F4F7'; nf22Rr(ctx, ix, iy, iw, ih, 26); ctx.fill(); nf22Glyph(ctx, 'box', W / 2, iy + ih / 2 + 20, 230, deep === '#1D2939' ? '#1F6B45' : bg); }
    if(head){ ctx.fillStyle = tag; nf22Rr(ctx, ix + 20, iy + 20, 0, 0, 0); ctx.font = F(800, 38); const hw = ctx.measureText(head).width + 52; nf22Rr(ctx, ix + 22, iy + 22, hw, 66, 33); ctx.fill(); ctx.fillStyle = '#1D2939'; ctx.fillText(head, ix + 48, iy + 36); }
    ctx.fillStyle = '#101828'; ctx.font = F(800, 56); const nl = nf22Wrap(ctx, one.name, cw - 96).slice(0, 2); nl.forEach((l, i) => ctx.fillText(l, cx + 48, iy + ih + 34 + i * 64));
    const py = iy + ih + 34 + nl.length * 64 + 18, price = spec.type === 'sale' && spec.newPrice ? spec.newPrice : one.price;
    ctx.font = F(800, 92); const pt = nf22P(price), pw = ctx.measureText(pt).width; ctx.fillStyle = tag === '#1F6B45' ? '#DCFCE7' : '#FEF3C7'; nf22Rr(ctx, cx + 36, py - 6, pw + 230, 120, 24); ctx.fill();
    ctx.fillStyle = '#101828'; ctx.fillText(pt, cx + 60, py + 8); ctx.font = F(600, 34); ctx.fillStyle = '#344054'; ctx.fillText('/ ' + one.unit, cx + 72 + pw, py + 52);
    if(spec.type === 'sale' && spec.newPrice && one.price){ ctx.font = F(700, 36); ctx.fillStyle = '#B42318'; const ot = nf22P(one.price), ow = ctx.measureText(ot).width, ox = cx + cw - 60 - ow; ctx.fillText(ot, ox, py + 40); ctx.fillRect(ox - 4, py + 58, ow + 8, 5); }
  }
  // bottom: delivery line, link, QR
  ctx.fillStyle = ink; ctx.font = F(700, 34); ctx.fillText((spec.lang === 'en' ? 'Delivery: ' : 'Delivery sa ') + s.areas, 64, 870);
  ctx.font = F(600, 30); ctx.globalAlpha = 0.9; ctx.fillText(nf22Short(s.url('pic')), 64, 924); ctx.globalAlpha = 1;
  ctx.font = F(600, 26); ctx.globalAlpha = 0.75; ctx.fillText(spec.lang === 'en' ? 'Scan the code to order' : 'I-scan para mag-order', 64, 972); ctx.globalAlpha = 1;
  try{ if(typeof qrDataUrl === 'function'){ const q = await qrDataUrl(s.url('pic'), 6); await new Promise(res => { const im = new Image(); im.onload = () => { ctx.fillStyle = '#FFFFFF'; nf22Rr(ctx, W - 64 - 190, 856, 190, 190, 18); ctx.fill(); ctx.imageSmoothingEnabled = false; ctx.drawImage(im, W - 64 - 178, 868, 166, 166); res(); }; im.onerror = res; im.src = q; }); } }catch(e){}
}

/* ---------- posting: copy, save, share, and a log so Nifti can keep your streak ---------- */
function nf22Log(){ try{ return JSON.parse(localStorage.getItem('nifti-post-log') || '[]'); }catch(e){ return []; } }
function nf22Logged(type, where){ const l = nf22Log(); l.push({d: APP_TODAY, at: Date.now(), type, where}); try{ localStorage.setItem('nifti-post-log', JSON.stringify(l.slice(-200))); localStorage.setItem('nifti-store-shared', '1'); }catch(e){} }
function nf22Week(){ const d = new Date(APP_TODAY + 'T00:00:00'), dow = (d.getDay() + 6) % 7, mon = addDaysIso(APP_TODAY, -dow); return nf22Log().filter(x => x.d >= mon && x.d <= addDaysIso(mon, 6)); }
function nf22Plan(){ let p = null; try{ p = JSON.parse(localStorage.getItem('nifti-post-plan') || 'null'); }catch(e){} return p || {days: {0: 'list', 2: 'spot', 4: 'sale', 5: 'deliver'}, time: '09:00', who: 'me', remind: true, goal: 3}; }
function nf22SavePlan(p){ try{ localStorage.setItem('nifti-post-plan', JSON.stringify(p)); }catch(e){} }
async function nf22Blob(cv){ return new Promise(res => cv.toBlob(b => res(b), 'image/png')); }
async function nf22Act(a, box){
  const cv = box.querySelector('canvas'), ta = box.querySelector('textarea'), text = ta ? ta.value : '', type = box.dataset.type || 'post';
  if(a === 'copy'){ if(typeof copyText === 'function') copyText(text); else { try{ await navigator.clipboard.writeText(text); }catch(e){} } nf22Done(box, 'copy'); showToast('Words copied. Now paste them in your post.', 'success'); return; }
  if(a === 'save'){ const b = await nf22Blob(cv); if(!b) return; const u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = 'nifti-post.png'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); nf22Done(box, 'save'); showToast('Picture saved. Add it to your post.', 'success'); return; }
  if(a === 'share'){ const b = await nf22Blob(cv); const f = b && new File([b], 'nifti-post.png', {type: 'image/png'});
    if(f && navigator.canShare && navigator.canShare({files: [f]})){ try{ await navigator.share({files: [f], text}); nf22Logged(type, 'share'); nf22Done(box, 'share'); return; }catch(e){ return; } }
    nf22Act('copy', box); setTimeout(() => nf22Act('save', box), 300); return; }
  if(a === 'fb'){ if(typeof copyText === 'function') copyText(text); window.open('https://www.facebook.com/', '_blank', 'noopener'); nf22Done(box, 'fb'); showToast('Words copied. In Facebook: tap "What\'s on your mind?", paste, add the picture.', 'success'); return; }
  if(a === 'viber'){ window.open('viber://forward?text=' + encodeURIComponent(text), '_blank'); nf22Done(box, 'viber'); return; }
  if(a === 'posted'){ nf22Logged(type, 'marked'); showToast('Nice! That counts for this week.', 'success'); nf22Paint(); return; }
}
function nf22Done(box, step){ const b = box.querySelector(`[data-a="${step}"]`); if(b) b.classList.add('done'); }

/* ---------- the page ---------- */
const NF22_TABS = [['today', 'Post today', 'Ready for you', '<path d="M12 3v3M18.4 5.6l-2.1 2.1M21 12h-3M5.6 5.6l2.1 2.1M3 12h3"/><circle cx="12" cy="14" r="5"/>'],
  ['make', 'Make a post', 'In 3 taps', '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'],
  ['week', 'My week', 'Plan once', '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'],
  ['buyers', 'Get more buyers', 'Groups, QR, reviews', '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M19 8v6M16 11h6"/>'],
  ['reply', 'Reply fast', 'Answers to "HM?"', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8M8 13h5"/>'],
  ['store', 'My store', 'Link, prices, results', '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>']];
function nf22StoreLayout(){
  const el = document.getElementById('storeContent'); if(!el) return;
  const old = el.querySelector(':scope > .nfs');
  let page = el.querySelector(':scope > .nf22s');
  if(!page){ page = document.createElement('div'); page.className = 'nf22s'; el.appendChild(page); }
  const keep = document.createElement('div'); keep.className = 'nf22s-keep';
  if(old){ // the original store page goes into "My store", minus its old post box
    const posts = [...old.querySelectorAll('.nfs-card')].find(c => c.querySelector('#postComposer')); if(posts) posts.remove();
    const nm = old.querySelector('.nfs-ph-top b'); if(nm) nm.textContent = nf22Shop().name;
    old.querySelectorAll('.nfs-card .nfs-h').forEach(h => h.classList.add('nf22-left'));
    keep.appendChild(old);
  }
  page.innerHTML = '';
  page.appendChild(nf22Top());
  const tabs = document.createElement('div'); tabs.className = 'nf22s-tabs'; tabs.setAttribute('role', 'tablist');
  tabs.innerHTML = NF22_TABS.map(([k, t, s, ic]) => `<button type="button" role="tab" data-tab="${k}" class="${NF22S.tab === k ? 'on' : ''}" aria-selected="${NF22S.tab === k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg><span><b>${t}</b><small>${s}</small></span></button>`).join('');
  page.appendChild(tabs);
  const body = document.createElement('div'); body.className = 'nf22s-body'; body.id = 'nf22sBody'; page.appendChild(body);
  page.appendChild(keep); keep.hidden = NF22S.tab !== 'store';
  if(!page.dataset.wired){ page.dataset.wired = '1';
    page.addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if(t){ NF22S.tab = t.dataset.tab; try{ localStorage.setItem('nifti-store-tab', NF22S.tab); }catch(x){} nf22Paint(); return; }
      const a = e.target.closest('[data-a]'); if(a){ const box = a.closest('.nf22-post'); if(box){ nf22Act(a.dataset.a, box); return; } }
      const g = e.target.closest('[data-go]'); if(g) nf22Go(g.dataset.go, g); });
    page.addEventListener('change', e => nf22Change(e)); page.addEventListener('input', e => { if(e.target.matches('[data-live]')) nf22Change(e); }); }
  nf22Paint();
}
function nf22Top(){
  const s = nf22Shop(), wk = nf22Week().length, goal = nf22Plan().goal || 3, top = document.createElement('section'); top.className = 'nf22s-top';
  top.innerHTML = `<div class="nf22s-who"><span class="nf22s-dot ${s.open ? 'on' : ''}"></span><div><b>${nf22Esc(s.name)}</b><small>${s.open ? 'Your store is open. Anyone with the link can order.' : 'Your store is closed. Open it in My store.'}</small></div></div>
    <div class="nf22s-link"><code>${nf22Esc(nf22Short(s.url()))}</code><button type="button" class="btn btn-outline" data-go="copylink">Copy link</button><button type="button" class="btn btn-outline" data-go="poster">QR poster</button></div>
    <div class="nf22s-streak" aria-label="Posts this week"><span>This week</span>${Array.from({length: goal}, (_, i) => `<i class="${i < wk ? 'on' : ''}"></i>`).join('')}<b>${Math.min(wk, goal)} of ${goal} posts</b></div>`;
  return top;
}
function nf22Paint(){
  const page = document.querySelector('#storeContent .nf22s'); if(!page) return;
  page.querySelectorAll('.nf22s-tabs [data-tab]').forEach(b => { const on = b.dataset.tab === NF22S.tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  const top = page.querySelector('.nf22s-top'); if(top) top.replaceWith(nf22Top());
  const body = document.getElementById('nf22sBody'), keep = page.querySelector('.nf22s-keep'); if(!body) return;
  if(keep) keep.hidden = NF22S.tab !== 'store';
  body.innerHTML = ({today: nf22TodayHtml, make: nf22MakeHtml, week: nf22WeekHtml, buyers: nf22BuyersHtml, reply: nf22ReplyHtml, store: nf22StoreHtml}[NF22S.tab] || nf22TodayHtml)();
  body.querySelectorAll('.nf22-post').forEach(b => nf22Refresh(b));
}
function nf22PostBox(spec, opts){
  const o = opts || {}; const txt = nf22Caption(spec);
  return `<div class="nf22-post" data-type="${spec.type}" data-spec="${nf22Esc(JSON.stringify(spec))}">
    <div class="nf22-post-pic"><canvas width="1080" height="1080" aria-label="The picture for your post"></canvas>${o.photo ? `<label class="nf22-photo"><input type="file" accept="image/*" capture="environment" data-nf-cam="1" data-photo="${nf22Esc((spec.items || [])[0] || '')}"><span>Use my own photo</span></label>` : ''}</div>
    <div class="nf22-post-txt"><div class="nf22-lang" role="group" aria-label="Language">${[['tl', 'Taglish'], ['en', 'English'], ['fil', 'Tagalog']].map(([k, l]) => `<button type="button" data-go="lang" data-v="${k}" class="${(spec.lang || NF22S.lang) === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <label class="nf22-lbl" for="nf22T${o.id || 0}">The words (you can change them)</label><textarea id="nf22T${o.id || 0}" rows="9">${nf22Esc(txt)}</textarea>
      <div class="nf22-mini"><button type="button" data-go="again">Another version</button><button type="button" data-go="short">${NF22S.short ? 'Longer' : 'Shorter'}</button></div>
      <p class="nf22-how">Post it in 3 steps</p>
      <div class="nf22-steps3"><button type="button" class="btn btn-primary" data-a="share"><i>1</i>${navigator.canShare ? 'Share picture + words' : 'Copy words + save picture'}</button>
        <button type="button" class="btn btn-outline" data-a="fb"><i>2</i>Open Facebook and paste</button>
        <button type="button" class="btn btn-outline" data-a="posted"><i>3</i>I posted it</button></div>
      <div class="nf22-also"><span>Also:</span><button type="button" data-a="copy">Copy words</button><button type="button" data-a="save">Save picture</button><button type="button" data-a="viber">Send on Viber</button></div></div></div>`;
}
async function nf22Refresh(box){ try{ const spec = JSON.parse(box.dataset.spec); await nf22Draw(box.querySelector('canvas'), spec); }catch(e){ console.warn('nf22 draw', e); } }

function nf22TodayHtml(){
  const ideas = nf22Ideas(), i = NF22S.idea % Math.max(1, ideas.length), idea = ideas[i];
  if(!idea) return `<div class="nf22-card"><h3>Add a few items first</h3><p>Nifti makes your posts from your items and prices.</p><button class="btn btn-primary" data-go="stock">Add items</button></div>`;
  const spec = {type: idea.type, items: idea.items, theme: ['green', 'blue', 'slate', 'yellow'][i % 4], tone: 'friendly', lang: NF22S.lang, ver: NF22S.ver};
  const next = ideas[(i + 1) % ideas.length];
  return `<div class="nf22-card nf22-today"><div class="nf22-h"><div><span class="nf22-tag">${nf22Esc(idea.tag)}</span><h3>Today's post is ready</h3><p class="nf22-why"><b>Why this one:</b> ${nf22Esc(idea.why)}</p></div>
      <button type="button" class="btn btn-outline" data-go="nextidea">Show me another idea</button></div>${nf22PostBox(spec, {photo: spec.type === 'spot' || spec.type === 'sale', id: 1})}</div>
    <div class="nf22-row2"><div class="nf22-card nf22-soft"><h4>Tomorrow</h4><p>${nf22Esc(next ? next.tag + ': ' + next.why : 'Another ready post.')}</p></div>
      <div class="nf22-card nf22-soft"><h4>Real photos sell best</h4><ul class="nf22-ul"><li>Stand near a door or window for light.</li><li>Put the item on a plain floor or wall.</li><li>Show the price tag, or hold one up.</li></ul></div></div>`;
}
function nf22MakeHtml(){
  const m = NF22S.make, items = nf22Items(), need = ['spot', 'sale', 'list', 'new'].includes(m.type);
  if(need && !m.items.length && items.length) m.items = m.type === 'list' ? items.slice(0, 5).map(i => i.name) : [items[0].name];
  const multi = m.type === 'list' || m.type === 'new';
  const spec = {type: m.type, items: need ? m.items : [], theme: m.theme, tone: m.tone, lang: NF22S.lang, ver: NF22S.ver, newPrice: m.newPrice, until: m.until};
  return `<div class="nf22-card"><ol class="nf22-make">
      <li><b>What do you want to post?</b><div class="nf22-tiles">${NF22_TYPES.map(([k, t, s]) => `<button type="button" data-go="mtype" data-v="${k}" class="${m.type === k ? 'on' : ''}"><b>${t}</b><small>${s}</small></button>`).join('')}</div></li>
      ${need ? `<li><b>${multi ? 'Pick the items (up to 6)' : 'Pick the item'}</b><div class="nf22-chips">${items.map(i => `<button type="button" data-go="mitem" data-v="${nf22Esc(i.name)}" class="${m.items.includes(i.name) ? 'on' : ''}">${nf22Esc(i.name)}<small>${nf22P(i.price)}</small></button>`).join('')}</div>
        ${m.type === 'sale' ? `<div class="nf22-inl"><label>New price (₱)<input type="number" inputmode="numeric" min="0" data-live="1" data-k="newPrice" value="${nf22Esc(m.newPrice)}" placeholder="e.g. 60"></label><label>Until<input type="text" data-live="1" data-k="until" value="${nf22Esc(m.until)}" placeholder="e.g. Sunday"></label></div>` : ''}</li>` : ''}
      ${m.type === 'hours' ? `<li><b>Which day?</b><div class="nf22-inl"><label>Day<input type="text" data-live="1" data-k="until" value="${nf22Esc(m.until)}" placeholder="e.g. Aug 31, Heroes Day"></label></div></li>` : ''}
      <li><b>How should it look and sound?</b><div class="nf22-chips nf22-th">${Object.keys(NF22_THEMES).map(k => `<button type="button" data-go="mtheme" data-v="${k}" class="${m.theme === k ? 'on' : ''}"><i style="background:${NF22_THEMES[k][0]}"></i>${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
        <div class="nf22-chips">${[['simple', 'Simple'], ['friendly', 'Friendly'], ['fun', 'Fun']].map(([k, l]) => `<button type="button" data-go="mtone" data-v="${k}" class="${m.tone === k ? 'on' : ''}">${l}</button>`).join('')}</div></li>
    </ol></div>
    <div class="nf22-card"><h3>Your post</h3>${nf22PostBox(spec, {photo: m.type === 'spot' || m.type === 'sale', id: 2})}</div>`;
}
function nf22WeekHtml(){
  const p = nf22Plan(), names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], d = new Date(APP_TODAY + 'T00:00:00'), dow = (d.getDay() + 6) % 7, mon = addDaysIso(APP_TODAY, -dow), log = nf22Log();
  let team = ['Me']; try{ team = ['Me'].concat((getActiveTeamMembers() || []).map(t => t.name || t.full_name || t.display_name).filter(n => n && !/\(you\)/i.test(n))); }catch(e){}
  const days = nf22Days(APP_TODAY, 75).slice(0, 6);
  return `<div class="nf22-card"><div class="nf22-h"><div><h3>Post ${p.goal || 3} times a week without thinking</h3><p>Pick a kind of post for each day. On that morning Nifti makes it ready and sends it to your phone. You just tap Share.</p></div></div>
      <div class="nf22-week">${names.map((n, i) => { const iso = addDaysIso(mon, i), done = log.some(x => x.d === iso), today = iso === APP_TODAY, past = iso < APP_TODAY, v = p.days[i] || '';
        return `<div class="nf22-day ${today ? 'today' : ''} ${done ? 'done' : ''}"><b>${n}</b><small>${typeof hmDay === 'function' ? hmDay(iso).replace(/^\w+,\s*/, '') : iso.slice(5)}</small>
          <select data-k="day" data-i="${i}" aria-label="${n} post"><option value="">No post</option>${NF22_TYPES.map(([k, t]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <em>${done ? '✓ Posted' : today && v ? 'Today' : past && v ? 'Missed, that\'s OK' : v ? 'Planned' : ''}</em></div>`; }).join('')}</div>
      <div class="nf22-inl nf22-plan"><label>Send it to<select data-k="who">${team.map(t => `<option ${p.who === t || (t === 'Me' && p.who === 'me') ? 'selected' : ''}>${nf22Esc(t)}</option>`).join('')}</select></label>
        <label>At<input type="time" data-k="time" value="${nf22Esc(p.time || '09:00')}"></label>
        <label class="nf22-chk"><input type="checkbox" data-k="remind" ${p.remind ? 'checked' : ''}> Remind on Telegram <small>(prototype)</small></label></div>
      <p class="nf22-calm">Missed a day? Nothing breaks. Nifti just offers it again tomorrow.</p></div>
    <div class="nf22-card"><div class="nf22-h"><div><h3>Good days to post, coming up</h3><p>Paydays, holidays and seasons when people in the Philippines fix and buy.</p></div></div>
      <ul class="nf22-cal">${days.map(x => `<li><span class="nf22-cal-d"><b>${typeof hmDay === 'function' ? hmDay(x.d).replace(/^\w+,\s*/, '') : x.d}</b><small>${new Date(x.d + 'T00:00:00').toLocaleDateString('en-PH', {weekday: 'short'})}</small></span><div><b>${nf22Esc(x.t)}</b><small>${nf22Esc(x.idea)}</small></div><button type="button" class="btn btn-outline" data-go="calpost" data-v="${x.type}" data-d="${nf22Esc(x.t)}">Make this post</button></li>`).join('')}</ul>
      <div class="nf22-inl"><label>Your town fiesta<input type="date" data-k="fiesta" value="${(() => { try{ return localStorage.getItem('nifti-fiesta') || ''; }catch(e){ return ''; } })()}"></label><small class="nf22-dim">Add it once. Nifti reminds you 2 weeks before every year.</small></div></div>`;
}
function nf22Groups(){ let g = null; try{ g = JSON.parse(localStorage.getItem('nifti-groups') || 'null'); }catch(e){} if(!g){ g = [{name: 'Your town\'s buy & sell group (example)', link: '', last: addDaysIso(APP_TODAY, -9), ex: true}, {name: 'A contractors group near you (example)', link: '', last: addDaysIso(APP_TODAY, -3), ex: true}]; } return g; }
function nf22SaveGroups(g){ try{ localStorage.setItem('nifti-groups', JSON.stringify(g)); }catch(e){} }
function nf22BuyersHtml(){
  const s = nf22Shop(), places = [...new Set([s.town].concat(s.areas.split(',').map(x => x.trim())).filter(Boolean))].slice(0, 3);
  const terms = places.flatMap(p => [`buy and sell ${p}`, `${p} contractors`, `${p} home renovation`]).slice(0, 6);
  const g = nf22Groups().slice().sort((a, b) => (a.last || '') < (b.last || '') ? -1 : 1), next = g[0];
  let paid = []; try{ paid = getSupplierPOs().filter(o => o.status === 'paid').slice(0, 3); }catch(e){}
  return `<div class="nf22-card"><div class="nf22-h"><div><h3>1. Find the Facebook groups where your buyers are</h3><p>Tap one. Facebook shows the groups. Join 3 to 5 that are near you.</p></div></div>
      <div class="nf22-chips">${terms.map(t => `<a class="nf22-chiplink" href="https://www.facebook.com/search/groups/?q=${encodeURIComponent(t)}" target="_blank" rel="noopener">${nf22Esc(t)} ↗</a>`).join('')}</div>
      <div class="nf22-manners"><b>Group manners that keep you welcome</b><ul class="nf22-ul"><li>Read the group rules first. Some only allow selling on certain days.</li><li>Post in each group once a week, not every day.</li><li>Use a real photo and the price. "PM for price" gets ignored.</li><li>Answer comments fast. Use the ready replies in Reply fast.</li></ul></div></div>
    <div class="nf22-card"><div class="nf22-h"><div><h3>2. Your groups</h3><p>Nifti tells you which group to post in next, so you never post too often in one.</p></div></div>
      ${next ? `<div class="nf22-next"><span>Post here next</span><b>${nf22Esc(next.name)}</b><small>Last post ${next.last ? (typeof hmDay === 'function' ? hmDay(next.last) : next.last) : 'never'}</small>${next.link ? `<a class="btn btn-primary" href="${nf22Esc(next.link)}" target="_blank" rel="noopener">Open the group</a>` : ''}<button type="button" class="btn btn-outline" data-go="gposted" data-v="${nf22Esc(next.name)}">I posted there</button></div>` : ''}
      <ul class="nf22-groups">${g.map(x => `<li><div><b>${nf22Esc(x.name)}</b><small>Last post: ${x.last ? (typeof hmDay === 'function' ? hmDay(x.last) : x.last) : 'never'}</small></div><button type="button" class="nf22-link" data-go="gdel" data-v="${nf22Esc(x.name)}">Remove</button></li>`).join('')}</ul>
      <div class="nf22-inl"><label>Group name<input type="text" id="nf22GName" placeholder="e.g. Marikina Buy & Sell"></label><label>Link (optional)<input type="url" id="nf22GLink" placeholder="Paste the group link"></label><button type="button" class="btn btn-outline" data-go="gadd">Add group</button></div></div>
    <div class="nf22-row2"><div class="nf22-card"><h3>3. Facebook Marketplace</h3><ol class="nf22-ol"><li>Tap <b>Open Marketplace</b>.</li><li>Tap <b>Create new listing</b>, then <b>Item for sale</b>.</li><li>Use the picture and words from <b>Post today</b>.</li><li>In the description, paste your store link.</li></ol><a class="btn btn-outline" href="https://www.facebook.com/marketplace/create/item" target="_blank" rel="noopener">Open Marketplace ↗</a></div>
      <div class="nf22-card"><h3>4. A QR poster for your counter and truck</h3><p>Walk-in buyers scan it and can order from home next time.</p><button type="button" class="btn btn-outline" data-go="poster">Print the QR poster</button></div></div>
    <div class="nf22-row2"><div class="nf22-card"><h3>5. Ask happy customers for a review</h3><p>A good word from a real buyer works better than any ad.</p>
        ${paid.length ? `<ul class="nf22-groups">${paid.map(o => `<li><div><b>${nf22Esc(o.buyerName)}</b><small>Paid ${nf22Esc(o.poNumber)}</small></div><button type="button" class="btn btn-outline" data-go="review" data-v="${nf22Esc(o.buyerName)}">Ask on Viber</button></li>`).join('')}</ul>` : '<p class="nf22-dim">When a customer pays, they show up here.</p>'}
        <button type="button" class="nf22-link" data-go="calpost" data-v="thanks">Make a thank-you post →</button></div>
      <div class="nf22-card"><h3>6. Your own Viber community</h3><p>Your suki join once. Every price list reaches all of them, and they can't reply all at once.</p>
        <ol class="nf22-ol"><li>In Viber, tap <b>Chats</b>, then the pencil, then <b>New Community</b>.</li><li>Name it "${nf22Esc(s.name)} Suki".</li><li>Send the invite below to your buyers.</li></ol>
        <button type="button" class="btn btn-outline" data-go="vinvite">Copy the invite message</button></div></div>`;
}
const NF22_QS = [['hm', 'HM po? / Magkano?', 'How much?'], ['avail', 'Available pa?', 'Still available?'], ['where', 'Saan location?', 'Where are you?'], ['cod', 'Pwede COD?', 'Cash on delivery?'],
  ['fee', 'Magkano delivery?', 'Delivery fee?'], ['bulk', 'May discount sa bulk?', 'Bulk discount?'], ['when', 'Kailan madedeliver?', 'When can you deliver?'], ['reserve', 'Pwede pa-reserve?', 'Can I reserve?']];
function nf22Reply(k, it, en){
  const s = nf22Shop(), link = s.url('reply'), unit = it ? it.unit : 'pc', name = it ? it.name : 'item';
  const tl = {hm: `Hi po! Ang ${name} ay ${it ? nf22P(it.price) : '₱—'} per ${unit}. Pwede pong mag-order dito: ${link} o PM lang po. Salamat!`,
    avail: it && it.onHand > 0 ? `Yes po, available pa! May ${it.onHand} ${unit} kami ngayon. Order na po dito: ${link}` : `Ubos po ngayon, pero darating ulit sa susunod na linggo. Pa-reserve po? Sabihin lang po kung ilan.`,
    where: `Nasa ${s.town} po kami. Nagdedeliver din kami sa ${s.areas}. ${s.lead}.`,
    cod: s.cod ? `Yes po, pwede ang COD (cash on delivery) sa ${s.areas}.` : `Sa ngayon po ay bayad muna bago i-deliver (GCash o bank). Pwede rin po pickup.`,
    fee: s.min ? `Libre po ang delivery para sa orders na ${nf22P(s.min)} pataas sa ${s.areas}. Sa mas maliit na order, depende po sa lugar.` : `Depende po sa lugar at dami. Sabihin lang po ang address at order, sasabihin namin agad.`,
    bulk: `Meron po! Sabihin lang po kung ilan ang kailangan, bibigyan namin kayo ng best price.`,
    when: `${s.lead}. Delivery po kami ${s.days}.`, reserve: `Pwede po! Sabihin lang po kung ilan at kailan kukunin o ipapa-deliver.`};
  const e = {hm: `Hi! ${name} is ${it ? nf22P(it.price) : '₱—'} per ${unit}. You can order here: ${link} or message us. Thank you!`,
    avail: it && it.onHand > 0 ? `Yes, still available! We have ${it.onHand} ${unit} right now. Order here: ${link}` : `Sold out today, more arriving next week. Want us to reserve some for you?`,
    where: `We're in ${s.town}. We also deliver to ${s.areas}. ${s.lead}.`, cod: s.cod ? `Yes, cash on delivery is OK in ${s.areas}.` : `Right now we take payment before delivery (GCash or bank). Pickup is also OK.`,
    fee: s.min ? `Delivery is free for orders of ${nf22P(s.min)} and up in ${s.areas}. For smaller orders it depends on the place.` : `It depends on the place and the amount. Send your address and order and we'll tell you right away.`,
    bulk: `Yes! Tell us how many you need and we'll give you our best price.`, when: `${s.lead}. We deliver ${s.days}.`, reserve: `Sure! Tell us how many and when you'll pick up or want delivery.`};
  return (en ? e : tl)[k];
}
function nf22ReplyHtml(){
  const items = nf22Items(), it = items.find(i => i.name === NF22S.replyItem) || items[0], en = NF22S.lang === 'en';
  return `<div class="nf22-card"><div class="nf22-h"><div><h3>Ready answers to what buyers ask</h3><p>Tap Copy, then paste it as your reply in Facebook or Viber. The price and stock are already filled in.</p></div></div>
      <div class="nf22-inl"><label>Which item are they asking about?<select data-k="replyItem">${items.map(i => `<option ${it && i.name === it.name ? 'selected' : ''}>${nf22Esc(i.name)}</option>`).join('')}</select></label>
        <div class="nf22-lang" role="group" aria-label="Language">${[['tl', 'Taglish'], ['en', 'English']].map(([k, l]) => `<button type="button" data-go="lang" data-v="${k}" class="${(en ? 'en' : 'tl') === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <ul class="nf22-replies">${NF22_QS.map(([k, q, qe]) => { const r = nf22Reply(k, it, en); return `<li><div class="nf22-q">"${nf22Esc(en ? qe : q)}"</div><p>${nf22Esc(r)}</p><button type="button" class="btn btn-outline" data-go="copyreply" data-v="${nf22Esc(r)}">Copy</button></li>`; }).join('')}</ul>
      <p class="nf22-calm">Answer fast. People usually buy from whoever replies first.</p></div>`;
}
function nf22StoreHtml(){ return `<div class="nf22-card nf22-soft"><p>Your link, what buyers see, prices, delivery areas and results are below. Change anything, then tap Save.</p></div>`; }

/* ---------- actions ---------- */
function nf22Go(k, el){
  const v = el.dataset.v, s = nf22Shop();
  if(k === 'copylink'){ copyText(s.url('link')); return; }
  if(k === 'poster'){ nf22Poster(); return; }
  if(k === 'stock'){ navigate('inventory'); return; }
  if(k === 'nextidea'){ NF22S.idea++; NF22S.ver = 0; nf22Paint(); return; }
  if(k === 'again'){ NF22S.ver++; nf22Paint(); return; }
  if(k === 'short'){ NF22S.short = !NF22S.short; nf22Paint(); return; }
  if(k === 'lang'){ NF22S.lang = v; try{ localStorage.setItem('nifti-post-lang', v); }catch(e){} nf22Paint(); return; }
  if(k === 'mtype'){ NF22S.make.type = v; NF22S.make.items = []; nf22Paint(); return; }
  if(k === 'mitem'){ const m = NF22S.make, multi = m.type === 'list' || m.type === 'new'; if(multi){ m.items = m.items.includes(v) ? m.items.filter(x => x !== v) : m.items.concat(v).slice(0, 6); } else m.items = [v]; nf22Paint(); return; }
  if(k === 'mtheme'){ NF22S.make.theme = v; nf22Paint(); return; }
  if(k === 'mtone'){ NF22S.make.tone = v; nf22Paint(); return; }
  if(k === 'calpost'){ NF22S.make.type = v || 'list'; NF22S.make.items = []; if(v === 'hours') NF22S.make.until = el.dataset.d || ''; NF22S.tab = 'make'; nf22Paint(); window.scrollTo({top: 0, behavior: 'smooth'}); return; }
  if(k === 'gposted'){ const g = nf22Groups(); const x = g.find(y => y.name === v); if(x) x.last = APP_TODAY; nf22SaveGroups(g); nf22Logged('group', v); showToast('Saved. Next time Nifti picks a different group.', 'success'); nf22Paint(); return; }
  if(k === 'gdel'){ nf22SaveGroups(nf22Groups().filter(y => y.name !== v)); nf22Paint(); return; }
  if(k === 'gadd'){ const n = (document.getElementById('nf22GName') || {}).value || '', l = (document.getElementById('nf22GLink') || {}).value || ''; if(!n.trim()){ showToast('Type the group name first.', 'warn'); return; }
    const g = nf22Groups().filter(y => !y.ex); g.push({name: n.trim(), link: /^https?:\/\//.test(l.trim()) ? l.trim() : '', last: ''}); nf22SaveGroups(g); nf22Paint(); return; }
  if(k === 'review'){ const msg = `Hi ${v}! Salamat po ulit sa order. Kung OK lang po, pwede po ba kayong magsulat ng maikling review sa Facebook page namin? Malaking tulong po sa ${s.name}. Salamat po!`; window.open('viber://forward?text=' + encodeURIComponent(msg), '_blank'); copyText(msg); return; }
  if(k === 'vinvite'){ copyText(`Hi po! Gumawa kami ng Viber community para sa aming mga suki: ${s.name} Suki. Dito namin ipapadala ang presyo, bagong dating at sale. Sali po kayo!`); return; }
  if(k === 'copyreply'){ copyText(v); return; }
}
function nf22Change(e){
  const t = e.target, k = t.dataset.k;
  if(t.matches('[data-photo]')){ const f = t.files && t.files[0]; if(!f) return; const r = new FileReader(); r.onload = () => { NF22S.photo[t.dataset.photo] = r.result; const box = t.closest('.nf22-post'); if(box) nf22Refresh(box); showToast('Your photo is in the picture now.', 'success'); }; r.readAsDataURL(f); return; }
  if(!k) return;
  if(k === 'newPrice' || k === 'until'){ NF22S.make[k] = t.value; const box = t.closest('.nf22-card') && document.querySelector('#nf22sBody .nf22-post'); if(box){ const spec = JSON.parse(box.dataset.spec); spec[k] = t.value; box.dataset.spec = JSON.stringify(spec); const ta = box.querySelector('textarea'); if(ta) ta.value = nf22Caption(spec); clearTimeout(nf22Change._t); nf22Change._t = setTimeout(() => nf22Refresh(box), 250); } return; }
  if(k === 'replyItem'){ NF22S.replyItem = t.value; nf22Paint(); return; }
  if(k === 'fiesta'){ try{ localStorage.setItem('nifti-fiesta', t.value); }catch(x){} nf22Paint(); return; }
  const p = nf22Plan();
  if(k === 'day'){ p.days[t.dataset.i] = t.value; if(!t.value) delete p.days[t.dataset.i]; p.goal = Math.max(1, Object.keys(p.days).length); }
  if(k === 'who') p.who = t.value; if(k === 'time') p.time = t.value; if(k === 'remind') p.remind = t.checked;
  nf22SavePlan(p); if(k === 'day') nf22Paint(); else showToast('Saved.', 'success');
}
async function nf22Poster(){
  const s = nf22Shop(), qr = typeof qrDataUrl === 'function' ? await qrDataUrl(s.url('poster'), 12) : '';
  let host = document.getElementById('statementView'); if(!host){ host = document.createElement('div'); host.id = 'statementView'; document.body.appendChild(host); }
  document.body.classList.add('statement-open');
  host.innerHTML = `<div class="stmt-toolbar"><button class="btn btn-outline" onclick="closeStatementOverlay()">✕ Close</button><button class="btn btn-primary" onclick="window.print()">Print</button></div>
    <div class="stmt-paper nf22-poster"><div class="nf22-pt">${nf22Esc(s.name)}</div><div class="nf22-pk">Order from your phone</div><p>Scan with your phone camera. See prices, order, and we deliver.</p>
      ${qr ? `<img src="${qr}" alt="QR code to the store">` : ''}<div class="nf22-pl">${nf22Esc(nf22Short(s.url()))}</div><div class="nf22-pd">Delivery: ${nf22Esc(s.areas)} · ${nf22Esc(s.days)}</div></div>`;
}

/* ---------- wiring ---------- */
(function(){
  const f = window.renderStorePage; if(typeof f !== 'function' || f._nf22) return;
  const w = function(){ const out = f.apply(this, arguments); try{ nf22StoreLayout(); }catch(e){ console.warn('nf22 store', e); }
    const t = document.getElementById('storePageTitle'), p = document.getElementById('storePageSub'); if(t) t.textContent = 'Online store'; if(p) p.textContent = 'Sell on Facebook and Viber without being an online seller. Nifti makes the posts; you tap Share.'; return out; };
  Object.keys(f).forEach(k => { w[k] = f[k]; }); w._nf22 = true; window.renderStorePage = w; try{ renderStorePage = w; }catch(e){}
})();
