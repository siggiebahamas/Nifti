# Round 9: photos saved in the database as order proof, and a phone-first rebuild.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''
P("function renderSidebarForViewAsRole(){", rd('r9_photos.js') + "\n" + rd('r9_mobile.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 9 css begin ===== */\n' + rd('r9.css') + rd('r9_mobile.css') + '\n/* ===== Round 9 css end ===== */\n' + t[i:]
