# U14: readability pass (larger, darker text; roomier rows), one line-icon set instead of emoji, Month-end close and Follow-ups spacing
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('polish.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + rd('polish.css') + t[i:]
