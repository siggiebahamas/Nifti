# Round 49: the online store page as one calm home with four big choices (each opens on its own), Facebook through
# Facebook's own free tools (no Meta app to approve), store photos shared by the team, and header pills as big and
# clear as the Home tiles on every page
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('r49.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 49 css ===== */\n' + rd('r49.css') + '\n' + t[i:]
