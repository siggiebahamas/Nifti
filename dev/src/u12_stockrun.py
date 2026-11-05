# U12: "What runs out" engine (days left vs supplier delivery time, or pesos on the shelf); shown on the Home built in u13
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('stockrun.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; anchor = '  .settings-card:empty{display:none;}'
i = t.rindex(anchor)
S['text'] = t[:i] + rd('stockrun.css') + t[i:]
