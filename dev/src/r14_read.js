/* ===== Round 14: reading an order message, carefully =====
   Rules over guesses. A line becomes an item only when we can tell the item and how many.
   Sizes must match exactly (10mm is never 12mm). Anything unsure is shown to the person to tap,
   never filled in silently. Works the same for a customer's PO (selling) and your own Viber
   message to a supplier (buying). */
const NFW_UNIT = {bag: 'bags', bags: 'bags', sack: 'bags', sacks: 'bags', sako: 'bags', sakos: 'bags', pc: 'pcs', pcs: 'pcs', piece: 'pcs', pieces: 'pcs', piraso: 'pcs', pirasos: 'pcs',
  roll: 'rolls', rolls: 'rolls', rolyo: 'rolls', box: 'boxes', boxes: 'boxes', bx: 'boxes', bxs: 'boxes', kahon: 'boxes', can: 'cans', cans: 'cans', gal: 'gallons', gals: 'gallons', gallon: 'gallons', gallons: 'gallons', galon: 'gallons',
  set: 'sets', sets: 'sets', length: 'lengths', lengths: 'lengths', lgth: 'lengths', lgths: 'lengths', haba: 'lengths', pack: 'packs', packs: 'packs', pk: 'packs', pks: 'packs', bundle: 'bundles', bundles: 'bundles', tali: 'bundles',
  drum: 'drums', drums: 'drums', pail: 'pails', pails: 'pails', kilo: 'kilos', kilos: 'kilos', ton: 'tons', tons: 'tons', unit: 'units', units: 'units', carton: 'cartons', cartons: 'cartons', ctn: 'cartons', ctns: 'cartons',
  dozen: 'dozens', dozens: 'dozens', doz: 'dozens', ream: 'reams', reams: 'reams', sheet: 'sheets', sheets: 'sheets', liter: 'liters', liters: 'liters', litro: 'liters', ltr: 'liters', ltrs: 'liters',
  meter: 'meters', meters: 'meters', metro: 'meters', mtr: 'meters', mtrs: 'meters', 'cu.m': 'cu.m', cum: 'cu.m', cubic: 'cu.m', truck: 'trucks', trucks: 'trucks', pair: 'pairs', pairs: 'pairs', bottle: 'bottles', bottles: 'bottles',
  tray: 'trays', trays: 'trays', case: 'cases', cases: 'cases', tub: 'tubs', sachet: 'sachets', sachets: 'sachets', pack_: 'packs'};
const NFW_SYN = {semento: 'cement', cemento: 'cement', buhangin: 'sand', pako: 'nail', pakong: 'nail', lansang: 'nail', nails: 'nail', alambre: 'wire', kawad: 'wire', tie: 'tie', wires: 'wire', bakal: 'steel',
  graba: 'gravel', kahoy: 'lumber', tubo: 'pipe', pintura: 'paint', yero: 'roofing', bareta: 'rebar', bareta_: 'rebar', varilla: 'rebar', kabilya: 'rebar', rebars: 'rebar', gi: 'galvanized', chb: 'hollow block',
  liha: 'sandpaper', plywud: 'plywood', ibeam: 'ibeam', ibeams: 'ibeam', anggulo: 'angle', welding: 'welding', rod: 'rod', rods: 'rod', kamatis: 'tomato', tomatoes: 'tomato', sibuyas: 'onion', onions: 'onion', bawang: 'garlic'};
const NFW_NUMW = {isa: 1, isang: 1, one: 1, dalawa: 2, dalawang: 2, two: 2, tatlo: 3, tatlong: 3, three: 3, apat: 4, four: 4, lima: 5, limang: 5, five: 5, anim: 6, six: 6, pito: 7, pitong: 7, seven: 7, walo: 8, walong: 8, eight: 8,
  siyam: 9, nine: 9, sampu: 10, sampung: 10, ten: 10, labindalawa: 12, dose: 12, dosena: 12, twelve: 12, kinse: 15, fifteen: 15, beinte: 20, bente: 20, dalawampu: 20, dalawampung: 20, twenty: 20, trenta: 30, tatlumpu: 30, tatlumpung: 30, thirty: 30,
  kwarenta: 40, apatnapu: 40, apatnapung: 40, forty: 40, singkwenta: 50, limampu: 50, limampung: 50, fifty: 50, sitenta: 70, seventy: 70, sandaan: 100, isandaan: 100, hundred: 100};
const NFW_NOISE = /^(?:good\s+(?:morning|afternoon|evening|day)|gud\s*(?:am|pm|morning)|morning|hi+|hello|hey|po|opo|sir|ma'?am|maam|boss|bossing|kuya|ate|salamat(?:\s+po)?|thank(?:s| you)(?:\s+po)?|ty|tnx|thanks|god\s+bless|regards|ok(?:ay)?|sige|noted|please|pls|plz)\b[\s,.!:;-]*/i;
const NFW_LEAD = /^(?:(?:pa[\s-]?order|pa[\s-]?deliver|order|orders|paorder|padeliver|pakuha|pabili|bili|kailangan|need|needs|request|requesting)\s*(?:po|ko|kami|namin|natin|sana|ulit|for\s+\w+(?:\s+\w+)?|ng|na|of)?\s*(?:po|ko|kami|namin|ng|na|of)?\s*)+[:\-]?\s*/i;
const NFW_SKIP_LINE = /^(?:total|totals|sub-?total|grand\s*total|vat|less|net|amount\s*due|prepared|approved|received|noted\s+by|terms|remarks|page|tin|address|tel|mobile|email|attention|attn|supplier|vendor|to:|from:|date\b|deliver(?:y)?\s*(?:to|address|date|by|on)|ship\s*to|needed\s*(?:by|on)|required|qty\b.*desc|description|item\s*no|purchase\s*order|p\.?\s?o\.?\s*(?:no|#|number)|po#)/i;
const NFW_TAIL = /\s*(?:\.|!|,)?\s*(?:deliver(?:y)?\s+(?:po\s+)?(?:bukas|tomorrow|today|ngayon|this\s+\w+|on\s+\w+|by\s+\w+|sa\s+\w+|\w+day)\b.*|pa[\s-]?deliver\b.*|salamat.*|thank.*|god\s+bless.*|asap.*|rush.*|for\s+(?:tomorrow|today|bukas)\b.*)$/i;

function nfwNum(s){ return Number(String(s).replace(/,/g, '')); }
// "limampung sako" → "50 sako", "isang daan" → "100"
function nfwWordsToNums(t){
  return t.replace(/\b(isang|isa|dalawang|tatlong|apat\s*na|limang|anim\s*na|pitong|walong|siyam\s*na)\s*(?:daan|raan)\b/gi, (m, a) => String((NFW_NUMW[a.toLowerCase().replace(/\s*na$/, '')] || 1) * 100))
    .replace(/\b([a-z]+)\b/gi, w => { const v = NFW_NUMW[w.toLowerCase()]; return v ? String(v) : w; });
}
// a size written in the item name: 40kg, 10mm, 3.2mm, 12ga, #12, 2", 1 1/2", 3/4, 6mm
function nfwSizes(s){
  const out = []; const t = ' ' + String(s).toLowerCase() + ' ';
  let m; const re1 = /(\d+(?:\.\d+)?)\s?(mm|cm|kg|g|ga|gauge|in|inch|inches|ft|ml|l|ltr|m|"|'')(?![a-z])/g;
  while((m = re1.exec(t))){ const u = {gauge: 'ga', inch: 'in', inches: 'in', '"': 'in', "''": 'in', ltr: 'l'}[m[2]] || m[2]; out.push({v: Number(m[1]), u}); }
  const re2 = /#\s?(\d+)/g; while((m = re2.exec(t))) out.push({v: Number(m[1]), u: 'ga'});
  const re3 = /(\d+)[\s-]+(\d)\/(\d+)/g; while((m = re3.exec(t))) out.push({v: Number(m[1]) + Number(m[2]) / Number(m[3]), u: 'in'});
  const re4 = /(?<![\d\s-])(?:^|\s)(\d)\/(\d+)/g; while((m = re4.exec(t))) out.push({v: Number(m[1]) / Number(m[2]), u: 'in'});
  return out;
}
function nfwNorm(s){
  let t = ' ' + String(s || '').toLowerCase().replace(/([a-z])-([a-z])/g, '$1$2').replace(/[“”"'`]/g, '"').replace(/[^a-z0-9#./" ]+/g, ' ') + ' ';
  t = t.replace(/\s(\w+)\s/g, (m, w) => ' ' + (NFW_SYN[w] || w) + ' ').replace(/\s(\w+)\s/g, (m, w) => ' ' + (NFW_SYN[w] || w) + ' ');
  return t.replace(/\s+/g, ' ').trim();
}
const NFW_SOFT = new Set(['steel', 'structural', 'portland', 'fresh', 'grade', 'a', 'the', 'of', 'and', 'for', 'na', 'ng', 'type', 'size', 'brand', 'new', 'per', 'w/', 'with', 'washed', 'crushed', 'common', 'regular']);
function nfwStem(w){ return w.length > 3 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w; }
function nfwWords(s){ return nfwNorm(s).replace(/#?\d+(?:\.\d+)?\s?(mm|cm|kg|g|ga|in|ft|ml|l|m|")?(?![a-z])/g, ' ').replace(/\d\/\d+/g, ' ').split(' ').map(nfwStem).filter(w => w.length > 1 && !/^\d/.test(w)); }

/* split a message into item pieces */
function nfwChunks(text){
  const out = [];
  String(text || '').replace(/\r/g, '').split('\n').forEach(line => {
    let l = line.replace(/^[\s>*•·\-–—]+/, '').trim();
    if(!l) return;
    if(NFW_SKIP_LINE.test(l) && !/\d+\s*(?:bags?|pcs?|rolls?|box|sako)/i.test(l)) return;
    // one line can hold many items: "30 bags cement, 100 pcs rebar 10mm saka 5 rolls GI wire"
    l.split(/\s*(?:;|,(?!\d{3})|\s\+\s|\s&\s|\band\b|\bsaka\b|\btapos\b|\bat\s+(?=\d))\s*/i).forEach(p => { if(p && p.trim()) out.push(p.trim()); });
  });
  return out;
}
/* one piece → {name, qty, unit, price, amount, raw} or null */
function nfwPiece(raw){
  let p = raw;
  for(let k = 0; k < 4; k++){ const before = p; p = p.replace(NFW_NOISE, '').replace(NFW_LEAD, ''); if(p === before) break; }
  const colon = p.indexOf(':'); if(colon > 0 && !/\d/.test(p.slice(0, colon)) && p.slice(0, colon).split(/\s+/).length <= 4) p = p.slice(colon + 1).trim();
  p = p.replace(NFW_TAIL, '').replace(/^\d{1,2}[.)]\s+/, '').replace(/\s+po\.?$/i, '').replace(/[!?]+$/, '').trim();
  if(!p || !/[a-z]/i.test(p)) return null;
  p = nfwWordsToNums(p);
  let qty = null, unit = null, price = null, amount = null, work = ' ' + p + ' ';
  const take = (re, fn) => { const m = work.match(re); if(m){ fn(m); work = work.replace(m[0], ' '); return true; } return false; };
  // prices first: @85, @ ₱520, ₱890, P1,200.00, 85 each, 85/pc
  take(/@\s*(?:₱|php|p)?\s*(\d[\d,]*(?:\.\d+)?)/i, m => { price = nfwNum(m[1]); });
  if(price == null) take(/(?:₱|php\s?)(\d[\d,]*(?:\.\d+)?)/i, m => { price = nfwNum(m[1]); });
  if(price == null) take(/(\d[\d,]*(?:\.\d+)?)\s?(?:each|ea\.?|\/\s?(?:pc|pcs|bag|roll|box|unit|kilo|kg|length|set))\b/i, m => { price = nfwNum(m[1]); });
  // quantity with a unit word: 50 bags, 20 sako, 5 rolls, 3 cu.m
  const unitWords = Object.keys(NFW_UNIT).filter(u => !/_$/.test(u)).sort((a, b) => b.length - a.length).map(u => u.replace('.', '\\.')).join('|');
  take(new RegExp('(?:^|\\s)(\\d{1,3}(?:,\\d{3})+|\\d+(?:\\.\\d+)?)\\s?(' + unitWords + ')(?![a-z])', 'i'), m => { qty = nfwNum(m[1]); unit = NFW_UNIT[m[2].toLowerCase()]; });
  // x100, x 100, ×100 (not 2x4)
  if(qty == null) take(/(?<=^|\s)[x×]\s?(\d+(?:\.\d+)?)(?![\d.]*\s?(?:mm|kg|ga|in|"))/i, m => { qty = Number(m[1]); });
  if(qty == null) take(/(?:^|\s)(\d+(?:\.\d+)?)\s?[x×](?=\s|$)/i, m => { qty = Number(m[1]); });
  // money numbers left (printed POs: 245.00 24,500.00)
  const money = []; work = work.replace(/(?:^|\s)(\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\d+\.\d{2})(?=\s|$)/g, (m0, v) => { money.push(nfwNum(v)); return ' '; });
  if(money.length >= 2){ price = price == null ? money[money.length - 2] : price; amount = money[money.length - 1]; }
  else if(money.length === 1 && price == null) price = money[0];
  // bare numbers that are not sizes
  const sizeMask = work.replace(/(\d+(?:\.\d+)?)\s?(mm|cm|kg|g|ga|gauge|in|inch|ft|ml|l|ltr|m|"|'')(?![a-z])/gi, s => '§'.repeat(s.length)).replace(/#\s?\d+/g, s => '§'.repeat(s.length)).replace(/\d+[\s-]+\d\/\d+|\d\/\d+/g, s => '§'.repeat(s.length));
  const bare = []; let mm; const reB = /(^|[\s\-:=(])(\d+(?:\.\d+)?)(?=[\s\-:=)]|$)/g;
  while((mm = reB.exec(sizeMask))) bare.push({v: Number(mm[2]), at: mm.index + mm[1].length, len: mm[2].length, after: /[-:=]\s*$/.test(sizeMask.slice(Math.max(0, mm.index - 3), mm.index + mm[1].length))});
  if(qty == null && bare.length){
    let pick = bare.find(b => b.after) || (bare.length === 1 ? bare[0] : null);
    if(!pick && /^\s*\d/.test(sizeMask)) pick = bare[0];
    if(!pick) pick = bare[bare.length - 1];
    qty = pick.v; work = work.slice(0, pick.at) + ' '.repeat(pick.len) + work.slice(pick.at + pick.len);
  }
  let name = work.replace(new RegExp('(?:^|\\s)(?:' + unitWords + ')(?=\\s|$)', 'gi'), ' ').replace(/\s[-:=@x×]\s/gi, ' ').replace(/^[\s\-:=@,.]+|[\s\-:=@,.]+$/g, '').replace(/\b(?:of|na|ng|po)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  if(!name || !/[a-z]{2,}/i.test(name)) return null;
  if(NFW_NOISE.test(name) && name.replace(NFW_NOISE, '').trim().length < 2) return null;
  if(amount != null && price != null && qty && Math.abs(qty * price - amount) > Math.max(2, amount * 0.02) && Math.abs(qty * amount - price) <= 2){ const t = price; price = amount; amount = t; }
  if(price == null && amount != null && qty) price = Math.round(amount / qty * 100) / 100;
  return {name, qty, unit, price, amount, raw: raw.trim()};
}
function nfwParse(text){
  const all = String(text || '');
  const ref = all.match(/(?:p\.?\s?o\.?\s*(?:no\.?|number|#)|purchase\s+order\s*(?:no\.?|number|#)?)\s*[:#.]?\s*([A-Z0-9][A-Z0-9-/]{2,})/i);
  const nb = all.match(/(?:deliver(?:y)?\s*(?:date|by|on)|needed\s*(?:by|on)|date\s*needed|required\s*date)\s*[:\-]?\s*([A-Za-z0-9 ,/.-]{5,24})/i);
  const ad = all.match(/(?:deliver\s*to|ship\s*to|delivery\s*address)\s*[:\-]\s*([^\n]{6,160})/i);
  const rows = []; nfwChunks(all).forEach(c => { const r = nfwPiece(c); if(r) rows.push(r); });
  return {rows, ref: ref ? ref[1] : null, neededRaw: nb ? nb[1].trim() : null, address: ad ? ad[1].trim() : null};
}
/* match one item name to a list of products. cands: [{product, price, unit}] */
function nfwSizeOk(ts, cs){
  for(const s of ts){
    if(!s.u) continue;
    const same = cs.filter(c => c.u === s.u || (s.u === 'ga' && c.u === 'ga'));
    if(same.length && !same.some(c => Math.abs(c.v - s.v) < 0.001)) return false;
  }
  return true;
}
function nfwMatch(name, cands, alias){
  if(alias && cands.some(c => c.product === alias)) return {product: alias, conf: 'saved', options: []};
  const tw = nfwWords(name), tsz = nfwSizes(nfwNorm(name)), bareT = (nfwNorm(name).match(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$)/g) || []).map(x => Number(x));
  if(!tw.length) return {product: '', conf: 'none', options: []};
  const scored = [];
  cands.forEach(c => {
    const cw = nfwWords(c.product), csz = nfwSizes(c.product);
    if(!cw.length) return;
    if(!nfwSizeOk(tsz, csz)) return;
    if(bareT.length && csz.length && !bareT.some(b => csz.some(s => Math.abs(s.v - b) < 0.001))) return; // "rebar 12" is not Rebar 10mm
    const strong = cw.filter(w => !NFW_SOFT.has(w));
    const hit = w => tw.some(x => x === w || (x.length >= 4 && w.length >= 4 && (x.startsWith(w) || w.startsWith(x))));
    const hs = strong.filter(hit).length, ha = cw.filter(hit).length;
    if(!hs) return;
    const tHit = tw.filter(x => cw.some(w => x === w || (x.length >= 4 && w.length >= 4 && (x.startsWith(w) || w.startsWith(x))))).length;
    let s = (hs / Math.max(strong.length, 1)) * 0.6 + (tHit / tw.length) * 0.4 + ha * 0.01;
    if(tsz.length && csz.length) s += 0.15;
    if(bareT.length && csz.some(z => bareT.some(b => Math.abs(z.v - b) < 0.001))) s += 0.15;
    scored.push({c, s, base: strong.filter(hit).join(' ')});
  });
  scored.sort((a, b) => b.s - a.s);
  if(!scored.length) return {product: '', conf: 'none', options: []};
  const best = scored[0], close = scored.filter(x => x.s >= best.s - 0.12 && x !== best);
  const options = scored.slice(0, 4).map(x => x.c.product);
  // same item in several sizes and no size given: ask which size
  if(close.length && !tsz.length && !bareT.length) return {product: '', conf: 'check', options, why: 'size'};
  if(best.s >= 0.62 && !close.length) return {product: best.c.product, conf: 'ok', options};
  if(best.s >= 0.3) return {product: '', conf: 'check', options};
  return {product: '', conf: 'none', options};
}
