# Round 50: no info icons on pills, Notebook reader / Old records / Plans as their own pages, store back fix, sweep fixes
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('r50.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 50 css ===== */\n' + rd('r50.css') + '\n' + t[i:]
