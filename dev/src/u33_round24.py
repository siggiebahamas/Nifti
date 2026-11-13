# Round 24: forest "All good", soft green "What's this page?", tax books one line per invoice with the amount
# before VAT, and a notebook reader for busy shops (many pages at once, snap now and check later).
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    return open(os.path.join(HERE, n), encoding='utf-8').read()

P("function renderSidebarForViewAsRole(){", rd('r24.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 24 css begin ===== */\n' + rd('r24.css') + '\n/* ===== Round 24 css end ===== */\n' + t[i:]
