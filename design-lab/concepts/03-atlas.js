/* 03 · Atlas — spatial interface. The business as a map: money flows in from customers, out to suppliers; stock below, people above.
   Click any node and the camera flies to it; context appears beside it. Layers, minimap and breadcrumbs keep you oriented. */
(function(){
const D = ND, WORLD = {w:1200, h:720};
let root, svg, card, vb = {x:0, y:0, w:1200, h:720}, anim, layers = {money:true, goods:true, people:true}, focusId = null;
const rr = a => 16 + Math.sqrt(a) / 11;
const NODES = [
  {id:'core', g:'core', x:600, y:360, r:66, label:'Dela Cruz Hardware', val:F.peso(D.cash.total), sub:'cash in bank and GCash', flow:['metric','cash'], crumb:['Business']},
  // customers
  {id:'riverside', g:'cust', x:200, y:228, amt:77240, label:'Riverside Builders', val:'₱77,240', sub:'34 days late', tone:'r', flow:['overdue']},
  {id:'bayview', g:'cust', x:270, y:370, amt:45144, label:'Bayview Construction', val:'₱45,144', sub:'21 days late · delivery tomorrow', tone:'r', flow:['overdue']},
  {id:'cavite', g:'cust', x:165, y:478, amt:38304, label:'Cavite Steel Works', val:'₱38,304', sub:'12 days late', tone:'r', flow:['overdue']},
  {id:'corazon', g:'cust', x:330, y:560, amt:14280, label:'Corazon Welding', val:'₱14,280', sub:'5 days late · promised 28 Aug', tone:'y', flow:['overdue']},
  {id:'manila', g:'cust', x:150, y:100, amt:5712, label:'Manila Bay Scaffolding', val:'₱5,712', sub:'order preparing, cash on delivery', tone:'g', flow:['order','SO-0302']},
  // suppliers
  {id:'metro', g:'sup', x:1005, y:215, amt:48900, label:'Metro Steel Co.', val:'₱48,900', sub:'cheque clears tomorrow', tone:'y', flow:['supplier']},
  {id:'cebu', g:'sup', x:1060, y:365, amt:63056, label:'Cebu Aggregates', val:'₱63,056', sub:'order waiting for your OK', tone:'r', flow:['stock']},
  {id:'balintawak', g:'sup', x:950, y:505, amt:9840, label:'Balintawak Wire Supply', val:'₱9,840', sub:'delivery 1 day late', tone:'r', flow:['stock']},
  {id:'quezon', g:'sup', x:1050, y:610, amt:22400, label:'Quezon Fasteners', val:'₱22,400', sub:'received, pay by 11 Sep', tone:'g', flow:['order','PO-0866']},
  // people and bills
  {id:'liza', g:'people', x:450, y:92, r:24, label:'Liza Santos', val:'counts tonight', sub:'5 counts, all within ₱20', tone:'g', flow:['person','liza']},
  {id:'rico', g:'people', x:640, y:78, r:24, label:'Rico Reyes', val:'−₱800 on 24 Aug', sub:'6 rod boxes missing', tone:'r', flow:['staff']},
  {id:'bills', g:'people', x:835, y:100, r:30, label:'Bills this month', val:'₱50,179', sub:'electricity +51%', tone:'y', flow:['expense']}
];
D.stock.forEach((s,i) => NODES.push({id:'sku' + i, g:'goods', x:440 + i * 56, y:i % 2 ? 628 : 580, r:10 + Math.sqrt(s.value) / 22, label:s.name, val:F.days(s.cover) + ' left', sub:F.peso(s.value) + ' at cost', tone:s.risk, flow:['stock'], sku:true}));
const N = id => NODES.find(n => n.id === id);
const GROUP_NAME = {core:'Business', cust:'Customers', sup:'Suppliers', people:'People and bills', goods:'Stock'};

function edge(a, b, w, cls, label){ const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - (a.y - b.y) * .15;
  return `<path class="at-e ${cls}" d="M${a.x} ${a.y} Q${mx} ${my - 30} ${b.x} ${b.y}" stroke-width="${w}"/>${label ? `<text class="at-el" x="${mx}" y="${my - 20}" text-anchor="middle">${label}</text>` : ''}`; }
function draw(){
  const core = N('core'); let money = '', goods = '', people = '', nodes = '';
  NODES.filter(n => n.g === 'cust').forEach(n => money += edge(n, core, Math.max(1.5, n.amt / 9000), 'is-in' + (n.tone === 'r' ? ' is-late' : ''), ''));
  NODES.filter(n => n.g === 'sup').forEach(n => money += edge(core, n, Math.max(1.5, n.amt / 9000), 'is-out', ''));
  NODES.filter(n => n.g === 'goods').forEach(n => goods += `<line class="at-e is-goods" x1="${core.x}" y1="${core.y + 60}" x2="${n.x}" y2="${n.y}"/>`);
  NODES.filter(n => n.g === 'people').forEach(n => people += `<line class="at-e is-people" x1="${core.x}" y1="${core.y - 60}" x2="${n.x}" y2="${n.y}"/>`);
  NODES.forEach(n => { const r = n.r || rr(n.amt);
    const lab = n.g === 'goods' ? `<text class="at-sl" x="${n.x}" y="${n.y + r + 14}" text-anchor="middle">${n.label.split(' ')[0]}</text>` :
      n.g === 'core' ? `<text class="at-cl" x="${n.x}" y="${n.y - 6}" text-anchor="middle">${n.val}</text><text class="at-cs" x="${n.x}" y="${n.y + 16}" text-anchor="middle">cash today</text>` :
      `<text class="at-nl" x="${n.x}" y="${n.y + r + 18}" text-anchor="middle">${n.label}</text><text class="at-nv" x="${n.x}" y="${n.y + r + 35}" text-anchor="middle">${n.val} · ${n.sub}</text>`;
    nodes += `<g class="at-n is-${n.g}${n.tone ? ' t-' + n.tone : ''}${focusId === n.id ? ' is-focus' : ''}" data-id="${n.id}" data-layer="${n.g === 'cust' || n.g === 'sup' ? 'money' : n.g === 'goods' ? 'goods' : n.g === 'people' ? 'people' : 'core'}" tabindex="0" role="button" aria-label="${F.esc(n.label + ', ' + n.val + ', ' + n.sub)}">
      <circle class="at-halo" cx="${n.x}" cy="${n.y}" r="${r + 9}"/><circle class="at-c" cx="${n.x}" cy="${n.y}" r="${r}"/>${n.tone === 'r' && n.g !== 'goods' ? `<text class="at-glyph" x="${n.x}" y="${n.y + 5}" text-anchor="middle">▲</text>` : ''}${lab}</g>`; });
  svg.innerHTML = `<g class="at-zone"><text x="70" y="56" class="at-zl">CUSTOMERS · money coming in</text><text x="1010" y="56" text-anchor="end" class="at-zl">SUPPLIERS · money going out</text><text x="600" y="702" text-anchor="middle" class="at-zl">STOCK · ${F.peso(D.stockValue)} at cost</text></g>
    <g class="at-L" data-l="money"${layers.money ? '' : ' style="display:none"'}>${money}</g><g class="at-L" data-l="goods"${layers.goods ? '' : ' style="display:none"'}>${goods}</g><g class="at-L" data-l="people"${layers.people ? '' : ' style="display:none"'}>${people}</g>${nodes}`;
  svg.querySelectorAll('.at-n').forEach(g => { if(g.dataset.layer !== 'core' && !layers[g.dataset.layer]) g.style.display = 'none';
    g.addEventListener('click', () => ATLAS.focus(g.dataset.id)); g.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); ATLAS.focus(g.dataset.id); } }); });
  mini();
}
function setVB(v){ vb = v; svg.setAttribute('viewBox', `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`); mini(); }
function fly(to){ cancelAnimationFrame(anim); const from = Object.assign({}, vb), t0 = performance.now(), dur = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 520;
  const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); setVB({x:from.x + (to.x - from.x) * e, y:from.y + (to.y - from.y) * e, w:from.w + (to.w - from.w) * e, h:from.h + (to.h - from.h) * e}); if(k < 1) anim = requestAnimationFrame(step); };
  anim = requestAnimationFrame(step); }
function mini(){ const m = root && root.querySelector('#atMini'); if(!m) return;
  m.innerHTML = `<svg viewBox="0 0 1200 720" aria-hidden="true">${NODES.map(n => `<circle cx="${n.x}" cy="${n.y}" r="${Math.max(8, (n.r || rr(n.amt)) * .8)}" class="mm-${n.g}${n.tone ? ' t-' + n.tone : ''}"/>`).join('')}<rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" class="mm-vp"/></svg>`; }
function crumb(n){ const c = root.querySelector('#atCrumb');
  c.innerHTML = `<button type="button" onclick="ATLAS.reset()">Business</button>${n && n.id !== 'core' ? ` <span aria-hidden="true">›</span> <button type="button" onclick="ATLAS.group('${n.g}')">${GROUP_NAME[n.g]}</button> <span aria-hidden="true">›</span> <b>${n.label}</b>` : ''}`; }
function smallCard(kind, ref){
  if(kind === 'person') return {kicker:'People', title:'Liza Santos · counts the drawer tonight', body:`<p class="fx-lede">Five counts this month: four matched to the peso, one ₱20 over and one ₱20 short. No edits except a typo Ben fixed on 22 Aug.</p>${FLOWS.kv([['Counts this month','5'],['Net difference','₱0'],['Discounts given','₱0'],['Tonight','Drawer count due by 9 PM']])}`};
  const o = D.orders.find(x => x.id === ref);
  return {kicker:o.side === 'sell' ? 'Customer order' : 'Supplier order', title:o.who + ' · ' + F.peso(o.amount), body:`<p class="fx-lede">${o.items}. Stage: <b>${D.stages[o.stage]}</b>, ${o.note.toLowerCase()}.</p>${FLOWS.kv([['Order',o.id],['Stage',D.stages[o.stage]],['Amount',F.peso(o.amount)],['Status',o.note]])}`};
}
function list(){ const host = root.querySelector('#atList');
  host.innerHTML = ['cust','sup','goods','people'].map(g => `<section><h3>${GROUP_NAME[g]}</h3>${NODES.filter(n => n.g === g).map(n => `<button type="button" class="at-li t-${n.tone || 'n'}" onclick="ATLAS.focus('${n.id}')"><i aria-hidden="true">${n.tone === 'r' ? '▲' : n.tone === 'y' ? '●' : '✓'}</i><span><b>${n.label}</b><small>${n.sub}</small></span><b class="num">${n.val}</b></button>`).join('')}</section>`).join('');
  host.insertAdjacentHTML('afterbegin', `<button type="button" class="at-li at-core" onclick="ATLAS.focus('core')"><span><b>Cash today</b><small>Bank and GCash · tap for the 14-day outlook</small></span><b class="num">${F.peso(D.cash.total)}</b></button>`); }
const ATLAS = {
  mode(m){ const w = root.querySelector('.at-wrap'); w.dataset.mode = m; (m === 'list' ? w : root.querySelector('.at-canvas')).appendChild(card); root.querySelectorAll('.at-mode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m))); },
  focus(id){ const n = N(id); focusId = id; const w = n.id === 'core' ? 980 : 860, h = w * .6;
    fly({x:Math.max(-120, n.x - w * .3), y:Math.max(-60, n.y - h / 2), w, h});
    svg.querySelectorAll('.at-n').forEach(g => g.classList.toggle('is-focus', g.dataset.id === id));
    const [k, sub] = n.flow; const f = k === 'metric' ? FLOWS.metric(sub) : k === 'order' || k === 'person' ? smallCard(k, sub) : FLOWS[k]();
    card.innerHTML = `<div class="at-ch"><span>${f.kicker}</span><button type="button" class="at-x" onclick="ATLAS.reset()" aria-label="Close and zoom out">✕</button></div><h3>${f.title}</h3><div class="at-cb">${f.body}</div>`;
    card.hidden = false; crumb(n); },
  group(g){ const ns = NODES.filter(n => n.g === g), xs = ns.map(n => n.x), ys = ns.map(n => n.y), pad = 120;
    const x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad, w = Math.max(x1 - x0, (y1 - y0) / .6);
    fly({x:x0, y:y0, w, h:w * .6}); card.hidden = true; focusId = null; crumb({id:'x', g, label:GROUP_NAME[g]}); root.querySelector('#atCrumb b').textContent = 'all'; },
  reset(){ focusId = null; fly({x:0, y:0, w:1200, h:720}); card.hidden = true; svg.querySelectorAll('.at-n').forEach(g => g.classList.remove('is-focus', 'is-hl')); crumb(null); },
  zoom(f){ const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2, w = Math.min(1600, Math.max(360, vb.w * f)); fly({x:cx - w / 2, y:cy - w * .3, w, h:w * .6}); },
  layer(l, btn){ layers[l] = !layers[l]; btn.setAttribute('aria-pressed', String(layers[l])); draw(); },
  ask(i){ const a = D.ask[i], hl = [['core'],['riverside','bayview'],['metro','core'],['sku0','sku1','sku7','cebu','balintawak'],['rico','sku5']][i];
    svg.querySelectorAll('.at-n').forEach(g => g.classList.toggle('is-hl', hl.includes(g.dataset.id)));
    const box = root.querySelector('#atAns'); box.innerHTML = `<p class="at-q">${a.q}</p><p>${a.a}</p><small>Highlighted on the map · based on ${a.src.toLowerCase()} · sample answer</small><button type="button" class="at-x" onclick="this.parentNode.hidden=true;document.querySelectorAll('.at-n').forEach(g=>g.classList.remove('is-hl'))" aria-label="Close answer">✕</button>`; box.hidden = false; }
};
window.ATLAS = ATLAS;

LAB.register({
  id:'atlas', n:3, name:'Atlas', territory:'Next-generation spatial interface', tagline:'Your business as a living map',
  fonts:'family=Sora:wght@300;400;500;600;700',
  identity:{
    vision:'Nifti as a map you can fly around: customers on the left sending money in, suppliers on the right taking it out, stock below, people above. Position on screen has meaning.',
    philosophy:'Relationships are the real story of a distributor. Seeing who you depend on, and how much flows along each line, builds intuition no table can. Curious, oriented, in control.',
    distinct:'The Business Map itself: node size is pesos at stake, line thickness is money in motion, a triangle marks trouble. Click and the camera flies there; context sits beside the node instead of replacing the map.',
    type:'Sora throughout: geometric, open, readable at small map sizes. Labels are direct on the map; no legends needed.',
    color:'Pale cool canvas with a dot grid. Teal for money in, coral for money out, graphite for goods and people. Late customers get dashed lines and a triangle, not just red.',
    visual:'Circles, curves and hairlines on an open field; the only rectangles are the context card and controls.',
    motion:'Camera flights ease out over 0.5 s (instant if the user prefers reduced motion). Highlights pulse once when Nifti answers a question.',
    arch:'One spatial overview. Zoom levels: Business → group (Customers, Suppliers, Stock, People) → single node. Breadcrumbs and a minimap show where you are; layers switch money, goods and people on and off.'
  },
  components:[['Business map','nodes sized by pesos, lines by money in motion'],['Camera flight','click a node and the view travels to it'],['Context card','details beside the node, the map stays visible'],['Minimap','always shows where you are on the whole business'],['Layer switch','money, goods and people on or off'],['Ask the map','answers light up the nodes they talk about']],
  tasks:{open:'The whole business on one map: who owes you on the left, who you owe on the right.', metric:'Click the centre (cash) to see position and the 14-day outlook.', expense:'Click "Bills this month" at the top; electricity is flagged.', overdue:'Click a customer; the biggest circle is Riverside Builders.', stock:'Zoom to Stock; the red dots are items that run out before the supplier can deliver.', supplier:'Click Metro Steel on the right to check the cheque.', staff:'Click Rico Reyes at the top; the matching rod shelf lights up below.', ask:'Ask the map a question; the answer highlights the customers, suppliers or items it mentions.'},
  map:{arch:'Single zoomable spatial canvas', nav:'Camera, breadcrumbs, minimap, layers', viz:'Node-link map sized by money', type:'Sora'},
  eval:{scores:[5,3,5,4,3,3,5], good:'Unmistakably different and memorable; makes concentration risk (one customer, one supplier) obvious at a glance.', bad:'Spatial maps get crowded as a business grows; reading exact numbers is slower than a list; harder on small phones and for keyboard users.'},
  mount(el){ root = el; focusId = null; vb = {x:0, y:0, w:1200, h:720};
    el.innerHTML = `<div class="at-wrap"><header class="at-top"><div class="at-id"><b>Nifti</b><span>${D.biz.short} · ${D.biz.todayShort}</span></div><nav class="at-crumb" id="atCrumb" aria-label="Where you are"></nav>
        <div class="at-mode" role="group" aria-label="View"><button type="button" data-m="map" onclick="ATLAS.mode('map')">Map</button><button type="button" data-m="list" onclick="ATLAS.mode('list')">List</button></div>
        <div class="at-layers" role="group" aria-label="Layers"><button type="button" aria-pressed="true" onclick="ATLAS.layer('money',this)"><i class="lm"></i>Money</button><button type="button" aria-pressed="true" onclick="ATLAS.layer('goods',this)"><i class="lg"></i>Goods</button><button type="button" aria-pressed="true" onclick="ATLAS.layer('people',this)"><i class="lp"></i>People</button></div></header>
      <div class="at-canvas"><svg id="atSvg" viewBox="0 0 1200 720" role="group" aria-label="Business map"></svg>
        <div class="at-zoom"><button type="button" onclick="ATLAS.zoom(.75)" aria-label="Zoom in">+</button><button type="button" onclick="ATLAS.zoom(1.33)" aria-label="Zoom out">−</button><button type="button" onclick="ATLAS.reset()" aria-label="Show everything">⤢</button></div>
        <div class="at-mini" id="atMini" aria-hidden="true"></div>
        <form class="at-ask" onsubmit="event.preventDefault()"><label for="atAskSel">Ask the map</label><select id="atAskSel" onchange="if(this.value!=='')ATLAS.ask(+this.value)"><option value="">Choose a question…</option>${D.ask.map((a,i) => `<option value="${i}">${a.q}</option>`).join('')}</select></form>
        <div class="at-ans" id="atAns" hidden aria-live="polite"></div>
        <aside class="at-card" id="atCard" hidden aria-label="Details"></aside></div><div class="at-list" id="atList"></div></div>`;
    svg = el.querySelector('#atSvg'); card = el.querySelector('#atCard'); draw(); crumb(null); list(); ATLAS.mode(innerWidth < 760 ? 'list' : 'map'); },
  run(k){ const map = {open:null, metric:'core', expense:'bills', overdue:'riverside', stock:'sku0', supplier:'metro', staff:'rico'};
    if(k === 'open') return ATLAS.reset(); if(k === 'ask'){ root.querySelector('#atAskSel').value = '3'; ATLAS.ask(3); return; }
    if(k === 'stock'){ ATLAS.group('goods'); setTimeout(() => ATLAS.focus('sku0'), 600); return; }
    ATLAS.focus(map[k]); }
});
})();
