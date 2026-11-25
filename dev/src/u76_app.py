# Round 76 (dashboard): no brown anywhere, sum-style day summary and breakdown table, expenses breakdown card,
# Getting paid subtotals, Deliveries rider inline, Prices polish, To check recount day detail, date pickers, 2307 worksheet.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
def Pspan(start, end, new):
    t = S['text']; assert t.count(start) == 1, ('Pspan start', t.count(start), start[:60]); i = t.index(start); j = t.index(end, i) + len(end); S['text'] = t[:i] + new + t[j:]

t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r76.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r76.js') + "\nfunction renderSidebarForViewAsRole(){")

# --- Walk-in sales, the day's breakdown: plain notes, the item table in the order the owner reads it, other stock changes set apart ---
Pspan("  const look=[];", "return '<section class=\"panel-card nf70-cash-detail\">'+head+summary+itemized+stock+looks+'</section>';",
      "  const head='<div class=\"panel-head\"><div><h2>Sales, stock and cash for '+esc(typeof bkDayLabel==='function'?bkDayLabel(day):day)+'</h2><p>What was sold, what left the shelf, and anything worth a second look</p></div><span class=\"nf70-detail-count\">'+lines.length+' item line'+(lines.length===1?'':'s')+'</span></div>';\n"
      "  const summary=(typeof nf74DaySummary==='function'?nf74DaySummary(sales,pays,tot,lines,salesTotal):'');\n"
      "  return (typeof nf76Detail === 'function') ? nf76Detail(head, summary, lines, other, unitemized) : '<section class=\"panel-card nf70-cash-detail\">'+head+summary+'</section>';")
P("const kids = [...sec.children].filter(k => !k.matches('.panel-head, .nf70-detail-summary, .nf74-day'));", "const kids = [...sec.children].filter(k => !k.matches('.panel-head, .nf70-detail-summary, .nf74-day, .nf76-day'));")
# --- Monthly summary: the three tabs are drawn styled from the start (no flicker) ---
P("  const tabs = `<div class=\"lens-tabs lg-tabs\" role=\"tablist\">${LG_TABS.map(([k, l]) => `<button role=\"tab\" class=\"${LGV.tab === k ? 'on' : ''}\" onclick=\"LGV.tab='${k}'; renderLedgerPage()\">${l}</button>`).join('')}</div>`;",
  "  const tabs = typeof nf76LgTabsHtml === 'function' ? nf76LgTabsHtml() : `<div class=\"lens-tabs lg-tabs\" role=\"tablist\">${LG_TABS.map(([k, l]) => `<button role=\"tab\" class=\"${LGV.tab === k ? 'on' : ''}\" onclick=\"LGV.tab='${k}'; renderLedgerPage()\">${l}</button>`).join('')}</div>`;")
# --- No brown anywhere: brown text becomes black, brown fills become yellow (with black text), brown accents get a clean colour ---
import re as _re
P('<i style="background:#B45309">MK</i>', '<i style="background:#EAB308;color:#0B0F14">MK</i>', S['text'].count('<i style="background:#B45309">MK</i>') or 1)
P('.nf45-av.t-y{background:#B45309;}', '.nf45-av.t-y{background:#EAB308;color:#0B0F14 !important;}')
P("email: {l: 'Email', c: '#B45309'", "email: {l: 'Email', c: '#0E7490'")
P("expenses: {t: 'Expenses', c: '#B45309'", "expenses: {t: 'Expenses', c: '#7C3AED'")
P("t: 'Notebook reader', c: '#92400E'", "t: 'Notebook reader', c: '#475467'")
P("'#1F6B45', '#2563EB', '#B7791F'", "'#1F6B45', '#2563EB', '#EAB308'")
S['text'] = _re.sub(r'#(92400E|B45309|78350F|854D0E|A16207|713F12|93370D|7A2E0E|B54708|7A4D00|8A6100|6B4500|8A5A00|3A2C00|9A3412|7C2D12|C2410C|7A5200|B7791F|5C3D00)\b', '#0B0F14', S['text'], flags=_re.I)
# every other brown shade (any hex that is a dark orange-brown): borders/shadows/fills go yellow, everything else goes black
P('.app-toast-warn .app-toast-icon{background:var(--warn);color:#fff;}', '.app-toast-warn .app-toast-icon{background:#FACC15;color:#0B0F14;}')
import colorsys as _cs
def _brown(h):
    r, g, b = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]; hh, l, sat = _cs.rgb_to_hls(r, g, b); hue = hh * 360
    return h.upper() not in ('CA8A04', 'C98A04') and 10 <= hue <= 48 and l < 0.42 and sat > 0.2 and (max(r, g, b) - min(r, g, b)) > 0.08
def _swap(m):
    h = m.group(1)
    if not _brown(h): return m.group(0)
    t = m.string; back = t[max(0, m.start() - 80):m.start()]
    pm = _re.search(r'([a-zA-Z-]+)\s*:\s*[^;:{}"]*$', back); prop = pm.group(1).lower() if pm else ''
    return '#EAB308' if _re.match(r'(border|box-shadow|outline|background|fill|stroke)', prop) else '#0B0F14'
S['text'] = _re.sub(r'#([0-9a-fA-F]{6})\b', _swap, S['text'])
S['text'] = S['text'].replace('rgb(160,110,0)', '#0B0F14').replace('rgb(160, 110, 0)', '#0B0F14').replace('rgb(133,77,14)', '#0B0F14').replace('rgb(133, 77, 14)', '#0B0F14')
