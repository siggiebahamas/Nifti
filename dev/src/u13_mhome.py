# U13: the approved "Mist" Home on real data (tiles, what to do, order board, what runs out, cash drawer by person)
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('mhome.js') + "\nrenderOneHome = renderMistHome;\nfunction renderSidebarForViewAsRole(){")
t = S['text']; anchor = '  .settings-card:empty{display:none;}'
i = t.rindex(anchor)
S['text'] = t[:i] + rd('mhome_port.css') + rd('mhome.css') + t[i:]
