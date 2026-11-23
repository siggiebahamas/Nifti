# Round 63: connected-operations marketing and honest feature presentation.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
t = S['text']
k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r63_growth.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r63_growth.js') + "\nfunction renderSidebarForViewAsRole(){")
