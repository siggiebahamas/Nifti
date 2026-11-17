# Round 43: paint once per click, header pills, popups, six text sizes, page fixes
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
# the paint guard must exist before any other script makes observers or timers
t = S['text']; i = t.index('<script')
S['text'] = t[:i] + '<script>\n' + rd('r43_paint.js') + '\n</script>\n' + t[i:]
P("function renderSidebarForViewAsRole(){", rd('r43.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 43 css ===== */\n' + rd('r43.css') + '\n' + t[i:]
