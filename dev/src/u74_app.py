# Round 74 (dashboard): Home order and permanent homes for the banners, owner view, running "vs last month",
# walk-in sales, cash count correction, expenses, team task edit, plans, page-wide alignment fixes.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r74.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r74.js') + "\nfunction renderSidebarForViewAsRole(){")

# --- running comparison: this month so far vs the same days last month (decision: keep it, make it fair) ---
P("${dl(p.net, prev.sales ? prev.net : 0)}",
  "${typeof nf74ProfitChip === 'function' ? nf74ProfitChip(m, p.net) : dl(p.net, prev.sales ? prev.net : 0)}")
P("if(!isFinite(ch) || !ch) return '<small class=\"nf45-dz\">same as last month</small>'; const up = ch > 0, good = goodUp ? up : !up; return `<small class=\"${good ? 'nf45-good' : 'nf45-bad'}\">${up ? '▲' : '▼'} ${Math.abs(ch)}% vs last month</small>`; };",
  "if(!isFinite(ch) || !ch) return `<small class=\"nf45-dz\">same as ${nf45Esc(pr.label)}</small>`; const up = ch > 0, good = goodUp ? up : !up; return `<small class=\"${good ? 'nf45-good' : 'nf45-bad'}\">${up ? '▲' : '▼'} ${Math.abs(ch)}% vs ${nf45Esc(pr.label)}</small>`; };")
P("same as last month</small>' : `<small class=\"${p.net > pp.net ? 'nf45-good' : 'nf45-bad'}\">${nf45Peso(Math.abs(p.net - pp.net))} ${p.net > pp.net ? 'better' : 'worse'} than last month</small>`",
  "same as ' + nf45Esc(pr.label) + '</small>' : `<small class=\"${p.net > pp.net ? 'nf45-good' : 'nf45-bad'}\">${p.net > pp.net ? '▲' : '▼'} ${nf45Peso(Math.abs(p.net - pp.net))} vs ${nf45Esc(pr.label)}</small><small class=\"nf74-was\">${nf45Esc(pr.label)}: ${nf45Peso(pp.net)}</small>`")
P("return {m: x, s: q.revenue || 0, k: q.net || 0}; }).filter(h => h.s > 0);",
  "return {m: x, s: q.revenue || 0, k: q.net || 0, pk: (x === String(APP_TODAY).slice(0, 7) && typeof nf74SameRange === 'function') ? (lgPnlFor(nf74SameRange(x).from, nf74SameRange(x).to).net || 0) : null, pl: (x === String(APP_TODAY).slice(0, 7) && typeof nf74SameRange === 'function') ? nf74SameRange(x).label : ''}; }).filter(h => h.s > 0);")
P("const rows = hist.map((h, i) => { const prev = hist[i - 1], diff = prev ? h.k - prev.k : null, costs = h.s - h.k;",
  "const rows = hist.map((h, i) => { const prev = hist[i - 1], diff = prev ? h.k - (h.pk != null ? h.pk : prev.k) : null, costs = h.s - h.k;")
P("<p class=\"nf45-gl\"><span>Tap a month to open it.</span></p>`;",
  "<p class=\"nf45-gl\"><span>Tap a month to open it.${hist.some(h => h.pk != null) ? ` The change for this month compares it with ${nf47E(hist.find(h => h.pk != null).pl)}, the same days last month.` : ''}</span></p>`;")
# Money overview, you owe suppliers: a column header, not a sentence
P("['You paid, waiting for their OK', 'n']", "['Paid, awaiting OK', 'n']")
# Monthly summary, Every peso: "Balance at the start / end" starts at the left edge of the table
P('<tr class="tot"><td class="d"></td><td class="w"><b>Balance at the start</b></td>', '<tr class="tot"><td class="d nf74-bal" colspan="2"><b>Balance at the start</b></td>')
P('<tr class="tot end"><td class="d"></td><td class="w"><b>Balance at the end</b></td>', '<tr class="tot end"><td class="d nf74-bal" colspan="2"><b>Balance at the end</b></td>')
# Demo: each past month also has a sale after the 24th, so "this month so far vs the same days last month" means something
P("sale(30 * k + 19, 'Riverside Builders Corp', [['Structural I-Beams', Math.round(22 * f), 3650]]));",
  "sale(30 * k + 19, 'Riverside Builders Corp', [['Structural I-Beams', Math.round(22 * f), 3650]]), sale(30 * k - 2, 'Cavite Steel Works', [['Galvanized Wire 12ga', Math.round(40 * f), 520]]));")

# --- Expenses: "Where the money went" becomes a ring + ranked list; All expenses gets a Date column on the left ---
def Pspan(start, end, new):
    t = S['text']; assert t.count(start) == 1, ('Pspan start', t.count(start), start[:60]); i = t.index(start); j = t.index(end, i) + len(end); S['text'] = t[:i] + new + t[j:]
Pspan("${cats.length ? `<section class=\"panel-card\"><div class=\"panel-head\"><h2>Where the money went</h2></div>", "</div></section>` : ''}",
      "${cats.length ? (typeof nf74Where === 'function' ? nf74Where(cats, m, un) : '') : ''}")
P("const p = nf25Parts(node), cells = cfg.cells(p, node), tr = document.createElement('tr');",
  "const p = Object.assign(nf25Parts(node), {day: cfg._day || ''}), cells = cfg.cells(p, node), tr = document.createElement('tr');")
P("if(node.matches('.bk-day')){ const tr = document.createElement('tr');",
  "if(node.matches('.bk-day') && cfg.dayCol){ cfg._day = node.textContent.trim(); node.remove(); return; } if(node.matches('.bk-day')){ const tr = document.createElement('tr');")
P("{page: 'expenses', h: /^All expenses/, cols: [['What', 't'], ['Paid to'], ['Paid from'], ['By'], ['Amount', 'n'], ['', 'a']],",
  "{page: 'expenses', h: /^All expenses/, dayCol: true, cols: [['Date', 'd'], ['What', 't'], ['Paid to'], ['Paid from'], ['By'], ['Amount', 'n'], ['', 'a']],")
P("return [c + nf25Sm(tags.concat(after)), v, from,", "return [p.day, c + nf25Sm(tags.concat(after)), v, from,")

# --- Cash drawer: the owner can fix a count or settle a real difference; a settled day shows green ---
P("    ${verdict}\n", "    ${typeof nf74SettleBox === 'function' ? nf74SettleBox(c, verdict) : verdict}\n")
P("const tn = mhTone(c.diff); if(c.diff < -0.5) shorts++; else if(c.diff > 0.5) overs++; else ok++;",
  "const settled = typeof nf74Settled === 'function' && nf74Settled(c), tn = settled ? 'g' : mhTone(c.diff); if(c.diff < -0.5) shorts++; else if(c.diff > 0.5) overs++; else ok++;")
P("<span class=\"st t${tn}\">${tn === 'g' ? 'Matched' : mhSigned(c.diff)}</span></button>`; }",
  "<span class=\"st t${tn}\">${settled ? '✓ Settled ' + mhSigned(c.diff) : tn === 'g' ? 'Matched' : mhSigned(c.diff)}</span></button>`; }")

# --- Number popups: the big number without its note glued on ---
P("const v = (el.querySelector('.v') || el.querySelector('b') || {}).textContent || '';",
  "const v = typeof nf74BigText === 'function' ? nf74BigText(el) : ((el.querySelector('.v') || el.querySelector('b') || {}).textContent || '');")

# --- Plans & pricing: ₱0 beta offer with the regular price crossed out; the stray "}" under the table is gone ---
P('<div class="nf26-price"><b>${nf26Peso(amt)}</b><span>${p.k === \'free\' ? \'forever\' : NF26P.cycle === \'yearly\' ? \'a year\' : \'a month\'}</span></div>',
  '${typeof nf74PlanPrice === \'function\' ? nf74PlanPrice(p, amt, s) : `<div class="nf26-price"><b>${nf26Peso(amt)}</b><span>${p.k === \'free\' ? \'forever\' : NF26P.cycle === \'yearly\' ? \'a year\' : \'a month\'}</span></div>`}')
P('${NF26P.note ? `<div class="nf26-pbanner note">${NF26P.note}</div>` : \'\'}${head}',
  '${NF26P.note ? `<div class="nf26-pbanner note">${NF26P.note}</div>` : \'\'}${head}${typeof nf74PlanOffer === \'function\' ? nf74PlanOffer(s) : \'\'}')
P(": !owner ? `<span class=\"nf26-cur soft\">Ask your owner to subscribe</span>`",
  ": s.demo ? `<button type=\"button\" class=\"btn ${p.k === 'pro' ? 'btn-primary' : 'btn-outline'}\" onclick=\"nf74PlanDemo('${p.k}')\">Get ${p.name} free</button>` : !owner ? `<span class=\"nf26-cur soft\">Ask your owner to subscribe</span>`")
Pspan("    ${s.pilot ? '<div class=\"nf26-how\"><b>During beta</b>", "Message the Nifti team</a>.</p></div>}",
      "    ${typeof nf74PlanFoot === 'function' ? nf74PlanFoot(s) : ''}")

# --- Checks: a short button ---
P(">Ask for a new check</button>`)", ">Get a new check</button>`)")
P(">Ask for a new check</button>`;", ">Get a new check</button>`;")

# --- Count the cash: the day's summary in the same style as the owner view (no figures repeated from the pills above) ---
Pspan("const summary='<div class=\"nf70-detail-summary\">", "before expenses':'')+'</span></div><div><small>Discounts from the price list</small><b>'+peso(tot.discount)+'</b></div></div>';",
      "const summary=(typeof nf74DaySummary==='function'?nf74DaySummary(sales,pays,tot,lines,salesTotal):'');")
P("const kids = [...sec.children].filter(k => !k.matches('.panel-head, .nf70-detail-summary'));", "const kids = [...sec.children].filter(k => !k.matches('.panel-head, .nf70-detail-summary, .nf74-day'));")
P('<div class="nf45-ib"><b>${nf45Esc(big)}</b>${r.sub ? `<span>${r.sub}</span>` : \'\'}</div>',
  '<div class="nf45-ib"><b>${nf45Esc(big)}</b>${r.sub ? `<span>${r.sub}</span>` : (typeof nf74BigSub === \'function\' && nf74BigSub(el) ? `<span>${nf45Esc(nf74BigSub(el))}</span>` : \'\')}</div>')
P("nf45Esc(s.paidWith || '')", "nf45Esc(({cash: 'Cash', gcash: 'GCash', maya: 'Maya', credit: 'Utang', bank: 'Bank', card: 'Card'})[s.paidWith] || s.paidWith || '')")
# Home order keeper: the price list and notebook cards are allowed right under What to do (no tug-of-war with nf74HomeOrder)
P("const order = [find(/^What to do/i), document.getElementById('srCard') || find(/^What runs out/i), find(/^Where every order is/i)].filter(Boolean);",
  "const order = [find(/^What to do/i), rows.querySelector(':scope > .nf48-home'), rows.querySelector(':scope > .nf45-oldhint'), document.getElementById('srCard') || find(/^What runs out/i), find(/^Where every order is/i)].filter(Boolean);")
