# Round 45: nothing traps you, every number explains itself, simpler pages that still show everything
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
# a demo payment was dated four days in the future
P("reference:'BT-88213', checkDate:null, date:'2026-08-30'", "reference:'BT-88213', checkDate:null, date:'2026-08-24'")
P("function renderSidebarForViewAsRole(){", rd('r45.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 45 css ===== */\n' + rd('r45.css') + '\n' + t[i:]
# stock value counts every item: when there is no supplier bill yet, use the cost saved on the item
_t = S['text']; _a = _t.index('function renderInventoryStatsRow(){'); _b = _t.index('const unitPrice = supplierId ? lookupKnownUnitPrice(supplierId, item.name) : 0;', _a)
S['text'] = _t[:_b] + 'const unitPrice = (supplierId ? lookupKnownUnitPrice(supplierId, item.name) : 0) || Number(item.unitCost) || 0;' + _t[_b + len('const unitPrice = supplierId ? lookupKnownUnitPrice(supplierId, item.name) : 0;'):]
# a hardware shop's demo bad stock should be hardware
P("mv(3, 'Fresh Tomatoes (Grade A)', -6, 'bad', 'Spoiled', 'Liza')", "mv(3, 'Angle Bars', -2, 'bad', 'Rusted at the edges', 'Liza')")
# one customer, one name: the counter sales used a shorter name than the customer list
_t = S['text']; _n = _t.count("'Dela Cruz', 'Bayview Construction')")
assert _n == 2, _n
S['text'] = _t.replace("'Dela Cruz', 'Bayview Construction')", "'Dela Cruz', 'Bayview Construction Co.')")
