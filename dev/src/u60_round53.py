# Round 53: one-minute page guides (top right of every main page, hideable) + clear Viber notice on Messages
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
t = S['text']; k = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:k] + rd('r53_guide.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r53_guide.js') + "\nfunction renderSidebarForViewAsRole(){")
