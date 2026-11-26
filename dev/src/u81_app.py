# Round 81 (dashboard): New sale search list + aligned columns + two-line Utang, Money overview cost table,
# Home owner view (matching margin tile, walk-in vs delivery, costs open in place), bigger Getting paid confirm rows.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r81.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r81.js') + "\nfunction renderSidebarForViewAsRole(){")
