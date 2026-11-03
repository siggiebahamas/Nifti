# U11: price lock (owner OK for prices under the price list), discounts per cashier, receipt after every sale
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('pricelock.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; anchor = '  .settings-card:empty{display:none;}'
i = t.rindex(anchor)
S['text'] = t[:i] + rd('pricelock.css') + t[i:]
