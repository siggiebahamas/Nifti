# Round 10: remove a proof photo (logged), cash drawer + every sheet rebuilt for phones, phone type scale.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''
P("function renderSidebarForViewAsRole(){", rd('r10.js') + "\n" + rd('r10b.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 10 css begin ===== */\n' + rd('r10.css') + rd('r10b.css') + '\n/* ===== Round 10 css end ===== */\n' + t[i:]
