# Round 54: header buttons grouped (and moved onto the toolbar row when it has room) + Setup coach
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
t = S['text']; k = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:k] + rd('r55.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r55_coach.js') + "\nfunction renderSidebarForViewAsRole(){")
