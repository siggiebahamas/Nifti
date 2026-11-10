# Round 14: waiting on a supplier (read receipts / usual time), Messages grouped with each chat's order,
# and the new order popup asked one question at a time, using a careful order reader (r14_read.js).
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''
P("function renderSidebarForViewAsRole(){", rd('r14_read.js') + "\n" + rd('r14.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 14 css begin ===== */\n' + rd('r14.css') + '\n/* ===== Round 14 css end ===== */\n' + t[i:]
