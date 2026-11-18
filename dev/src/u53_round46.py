# Round 46: delete wrong photos, Nifti-styled suggestions, clean Follow-ups rows, Deliveries day view, add tasks from each lane, no dead-end pages
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('r46.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 46 css ===== */\n' + rd('r46.css') + '\n' + t[i:]
