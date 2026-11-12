# Round 22: lighter blue for selling and emerald for buying, Alerts you can find (menu foot, Home, bell, Settings),
# one profit number on every page, "What's this page?" help, welcome back, a calm pass over every page, an online
# store that does the selling work, and a notebook reader built for people who are new to apps.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''

# login: the demo button says less
P("""<small>See Nifti running a real hardware store. No sign-up, nothing to install.</small>""",
  """<small>Free. No sign-up needed.</small>""")

# Home setup list: finished steps turn gray with a check, not crossed out (crossed-out text is hard to read)
P("""<span style="${s.done ? 'opacity:.55;text-decoration:line-through;' : ''}">""",
  """<span class="${s.done ? 'gs-done' : ''}">""")

# Cash drawer calendar: days with no sales stay empty; days with sales and no count say so
P("""    if(!c){ cells += `<div class="day none"><span class="dn">${d}</span><span class="st">No count</span></div>`; continue; }""",
  """    if(!c){ const sold = (BK.sales || []).some(x => x.date === k && !x.voided); cells += `<div class="day none${sold ? ' miss' : ''}"><span class="dn">${d}</span><span class="st">${sold ? 'Not counted' : ''}</span></div>`; continue; }""")

# How the business is doing: months before Nifti come from the notebook, and empty months don't count as losses
_o = """return Object.assign(r, {sales: Number(p.revenue) || 0, profit: Number(p.net) || 0}); });"""
assert S['text'].count(_o) == 2, S['text'].count(_o)
S['text'] = S['text'].replace(_o, """return Object.assign(r, typeof nf22Month === 'function' ? nf22Month(r, p, k) : {sales: Number(p.revenue) || 0, profit: Number(p.net) || 0}); });""")
P("""const tS = months.reduce((a, m) => a + m.sales, 0), tP = months.reduce((a, m) => a + m.profit, 0);""",
  """const real = months.filter(m => !m.pre), tS = real.reduce((a, m) => a + m.sales, 0), tP = real.reduce((a, m) => a + m.profit, 0);""")
P("""const best = months.slice().sort((a, b) => b.profit - a.profit)[0], worst = months.slice().sort((a, b) => a.profit - b.profit)[0];""",
  """const best = (real.length ? real : months).slice().sort((a, b) => b.profit - a.profit)[0], worst = (real.length ? real : months).slice().sort((a, b) => a.profit - b.profit)[0];""")
P("""Average ${nfShort(tS / 6)}""", """Average ${nfShort(tS / Math.max(1, real.length))}""")

P("function renderSidebarForViewAsRole(){", rd('r22.js') + "\n" + rd('r22_store.js') + "\n" + rd('r22_nb.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 22 css begin ===== */\n' + rd('r22.css') + '\n/* ===== Round 22 css end ===== */\n' + t[i:]
