# Round 84: calmer orders, pay link in the order, fix-it stock popup, no black highlights.

import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
CSS = ['r84.css']
JS = ['r84.js']
t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + '\n'.join(rd(c) for c in CSS) + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", '\n'.join(rd(j) for j in JS) + "\nfunction renderSidebarForViewAsRole(){")
