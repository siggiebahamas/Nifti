# U12: Home card "What runs out" (days left vs supplier lead time, or pesos on the shelf), placed under Needs attention
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('stockrun.js') + "\nfunction renderSidebarForViewAsRole(){")
P("    ${oneHomeRecent()}", "    ${typeof srCard === 'function' ? srCard() : ''}\n    ${oneHomeRecent()}")
t = S['text']; anchor = '  .settings-card:empty{display:none;}'
i = t.rindex(anchor)
S['text'] = t[:i] + rd('stockrun.css') + t[i:]
