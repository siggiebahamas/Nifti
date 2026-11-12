# Round 18: a smaller demo, five main pages with tabs, merged money pages, Home = today only,
# clearer order-board counts and Customer/Supplier tags, Team chat in Messages, chat with the order beside it.
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''

# Customer / Supplier tag: the same arrows as "Selling ↗" and "Buying ↙"
P("""function nfoSideTag(sell){ return `<span class="nfo-side ${sell ? 'c' : 's'}">${sell ? 'Customer' : 'Supplier'}</span>`; }""",
  """function nfoSideTag(sell){ return `<span class="nfo-side ${sell ? 'c' : 's'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${sell ? '<path d="M7 17 17 7M8 7h9v9"/>' : '<path d="M17 7 7 17M16 17H7V8"/>'}</svg>${sell ? 'Customer' : 'Supplier'}</span>`; }""")

# the extra supplier order waiting for a yes is left out of the smaller demo
P("if((typeof myBusiness !== 'undefined' && myBusiness) || purchaseOrders.some(p => p.id === 'po_w1')) return;",
  "if((typeof myBusiness !== 'undefined' && myBusiness) || purchaseOrders.some(p => p.id === 'po_w1') || (typeof NF_DEMO_KEEP !== 'undefined' && !NF_DEMO_KEEP.po.includes('po_w1'))) return;")
# Orders: "Message" under a customer or supplier opens the chat with their open order beside it
P("""<div class="nfo-more"><button type="button" onclick="nfoChat('${g.pid}', ${g.sell})">Message</button>""",
  """<div class="nfo-more"><button type="button" onclick="nf18MsgFor('${(g.os.find(r => r.turn !== 'done') || g.os[0]).id}')">Message</button>""")
# Home = today only: 4 tiles, no cash drawer calendar (now on Counter), no business report (now on Money)
P('<div class="mosaic num">${mhTiles(boss).join(\'\')}</div>', '<div class="mosaic num">${nf18Tiles(mhTiles(boss))}</div>')
P('${boss && BK.loaded ? `<section class="sect glass" id="mhDrawer">${mhDrawer()}</section>` : \'\'}', '')
P("if(boss && root && !document.getElementById('nfHomeReport')){", "if(false && boss && root && !document.getElementById('nfHomeReport')){")
# What to do in the demo: 3 today, 4 this week
P("  return L;\n}\nfunction mhLane(k, list){", "  return nf18Lanes(L);\n}\nfunction mhLane(k, list){")
# How the business is doing: top 3 in each list
P('nfTop(cust, 4)', 'nfTop(cust, 3)'); P('nfTop(items, 4)', 'nfTop(items, 3)'); P('nfTop(sups, 4)', 'nfTop(sups, 3)')

# the demo has short lists already, so nothing folds behind "Show all" there (real accounts keep it)
P("function nfCapRun(){\n  const pg = document.querySelector('#view-app .app-page.active'); if(!pg) return;",
  "function nfCapRun(){\n  const pg = document.querySelector('#view-app .app-page.active'); if(!pg) return;\n  if(typeof nfIsDemo === 'function' && nfIsDemo()){ document.querySelectorAll('#view-app .nf-capm').forEach(b => b.remove()); document.querySelectorAll('#view-app .nf-cap-h').forEach(e => e.classList.remove('nf-cap-h')); return; }")
P("const n = 4, all = NFO.band === b || !!NFO.q.trim()", "const n = (typeof nfIsDemo === 'function' && nfIsDemo()) ? 99 : 4, all = NFO.band === b || !!NFO.q.trim()")

P("function renderSidebarForViewAsRole(){", rd('r18.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 18 css begin ===== */\n' + rd('r18.css') + '\n/* ===== Round 18 css end ===== */\n' + t[i:]

# Home sections that moved (cash drawer, business report) keep their look on Counter and Money:
# every Home style rule also applies inside .nf18-mh
def widen(m):
    return m.group(1) + m.group(2).replace('#mhHome', ':is(#mhHome,.nf18-mh)') + m.group(3)
S['text'] = re.sub(r'(<style[^>]*>)(.*?)(</style>)', widen, S['text'], flags=re.S)
