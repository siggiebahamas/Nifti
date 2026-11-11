# Round 17: shorter lists on every page, no step numbers on Home's order board, Orders totals on one line,
# darker blue date tiles, and the Money overview profit statement in the same style as the other cards.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''

# Home · Where every order is: no step number above each step
P('const sh = (s, d, i, n) => `<div class="sh"><span class="sn">${i + 1}</span><span class="sh-t">',
  'const sh = (s, d, i, n) => `<div class="sh"><span class="sh-t">')

# Home · What to do: Act Today shows 3, This Week 5, Fine 3. The rest open with "+ N more".
P("""const name = {r: 'Act Today', y: 'This Week', g: 'Fine'}[k], key = 'lane' + k, open = MH.open[key], show = open ? list : list.slice(0, 5);""",
  """const name = {r: 'Act Today', y: 'This Week', g: 'Fine'}[k], key = 'lane' + k, open = MH.open[key], cap = {r: 3, y: 5, g: 3}[k], show = open ? list : list.slice(0, cap);""")
P("""${list.length > 5 ? `<button class="more" type="button" onclick="MH.open['${key}']=!MH.open['${key}']; renderMistHome()">${open ? 'Show less' : '+ ' + (list.length - 5) + ' more'}</button>` : ''}</div>`;""",
  """${list.length > cap ? `<button class="more" type="button" onclick="MH.open['${key}']=!MH.open['${key}']; renderMistHome()">${open ? 'Show less' : '+ ' + (list.length - cap) + ' more'}</button>` : ''}</div>`;""")
P("/^(lane[ryg]|sell\\d|buy\\d)$/", "/^(sell\\d|buy\\d)$/")
# the same late payment was listed twice in Act Today ("Riverside is 6 days late" and "Overdue money")
P("bkFlags().forEach(f => { if(f.lvl === 'red') L.r.push(",
  "bkFlags().forEach(f => { if(f.k === 'late' && f.lvl !== 'green' && L.r.concat(L.y).some(x => /late paying|overdue/i.test(String(x.h)))) return; if(f.lvl === 'red') L.r.push(")

# Home · What runs out: the 4 most urgent, the rest behind "Show all"
P("shown = srAll ? list : list.slice(0, 8);", "shown = srAll ? list : list.slice(0, 4);")
P("${list.length > 8 ? `<button type=\"button\" class=\"sr-more\"", "${list.length > 4 ? `<button type=\"button\" class=\"sr-more\"")

# Money overview · Next money in and out: 4 rows
P('.slice(0, 5).map(x => `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(x.what)}',
  '.slice(0, 4).map(x => `<div class="bk-row"><div class="bk-row-m"><b>${escapeHtml(x.what)}')
P('items.length > 5 ? `<p>${items.length - 5} more in the next 90 days',
  'items.length > 4 ? `<p>${items.length - 4} more in the next 90 days')

# Orders: the peso total sits on the same line as the count, on the right
P("""<b>${rs.length}<span> order${rs.length === 1 ? '' : 's'}</span></b><em${rs.length ? '' : ' class="z"'}>${rs.length ? nfoPeso(sum) : 'Nothing'}</em></button>`;""",
  """<span class="ln"><b>${rs.length}<span> order${rs.length === 1 ? '' : 's'}</span></b><em${rs.length ? '' : ' class="z"'}>${rs.length ? nfoPeso(sum) : 'Nothing'}</em></span></button>`;""")
# Orders: each band shows 4 customers or suppliers, the rest behind "Show N more"
P("""return `<div class="nfo-band b-${b}"><span>${h}</span><b>${vis.filter(r => r.band === b).length}</b></div>${g.map(nfoGroupHtml).join('')}`; })""",
  """return `<div class="nfo-band b-${b}"><span>${h}</span><b>${vis.filter(r => r.band === b).length}</b></div>${nfoCapGroups(b, g)}`; })""")

P("function renderSidebarForViewAsRole(){", rd('r17.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 17 css begin ===== */\n' + rd('r17.css') + '\n/* ===== Round 17 css end ===== */\n' + t[i:]
