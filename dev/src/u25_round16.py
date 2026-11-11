# Round 16: Orders by customer & supplier with dates, Customers & suppliers page removed,
# clearer "What runs out" and "Where every order is" on Home, Claude-like colours.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''

# Home · Where every order is: just the three colour words, and a clear count after each step
P('<div class="legend"><span class="lg"><span class="spl r">Late</span>late or waiting on you</span><span class="lg"><span class="spl y">Pending</span>coming up, on track</span><span class="lg"><span class="spl g">Done</span>completed</span></div>',
  '<div class="legend nf-lg16"><span class="lg"><span class="spl r">Late</span></span><span class="lg"><span class="spl y">Pending</span></span><span class="lg"><span class="spl g">Done</span></span></div>')
P('<span><b>${s}</b> <span class="sc">${n}</span></span>',
  '<span class="sh-t"><b>${s}</b><span class="sh-c"><span class="sc-d" aria-hidden="true">–</span><span class="sc">${n}</span></span></span>')

# Home · What runs out: the colour key is just the four names, and "Days left" is labelled in blue
P("""<span class="sr-kd">: at or under the black line. Without an order now, stock drops below ${L.critical} days before the delivery arrives.</span>""", '')
P("""<span class="sr-kd">: within ${L.warn} days of the line.</span>""", '')
P("""<span class="sr-kd">: more than that.</span>""", '')
P("""<span class="sr-kd">: delivery time + ${L.critical} days.</span>""", '')
P("""use each supplier's delivery time and your ${L.critical}-day critical level.</p><ul>""",
  """use each supplier's delivery time and your ${L.critical}-day critical level.</p><ul class="sr-k4">""")
P("""<div class="sr-axis" aria-hidden="true"><span></span><span class="sr-ax">""",
  """<div class="sr-axis sr-axis16"><span class="sr-axl"><em class="sr-dl">Days left <b aria-hidden="true">→</b></em></span><span class="sr-ax" aria-hidden="true">""")
P("""</i>`).join('')}</span><span>days left</span></div>""",
  """</i>`).join('')}</span><span class="sr-axr"><em class="sr-dl">Days left</em></span></div>""")

# Customers & suppliers page removed: out of the phone menu too
P("!['admin', 'growth'].includes(i.dataset.page)", "!['admin', 'growth', 'suppliers'].includes(i.dataset.page)")

P("function renderSidebarForViewAsRole(){", rd('r16.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 16 css begin ===== */\n' + rd('r16.css') + '\n/* ===== Round 16 css end ===== */\n' + t[i:]
