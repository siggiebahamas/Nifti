# Round 86: compact Who owes you, task popups, one Getting paid page, max 3 examples.

import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
CSS = ['r86.css']
JS = ['r86.js']
t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + '\n'.join(rd(c) for c in CSS) + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", '\n'.join(rd(j) for j in JS) + "\nfunction renderSidebarForViewAsRole(){")
