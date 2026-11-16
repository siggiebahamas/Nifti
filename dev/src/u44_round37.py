# Round 37: solid red counts that clear once seen, page explanations, headings, black list headings, lighter yellow,
# Getting paid lines that add up, Money overview coming-up table, Viber made seamless
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

JS = [f for f in ['r37.js', 'r37_viber.js'] if os.path.exists(os.path.join(HERE, f))]
CSS = [f for f in ['r37.css', 'r37_viber.css'] if os.path.exists(os.path.join(HERE, f))]
P("function renderSidebarForViewAsRole(){", "\n".join(rd(f) for f in JS) + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 37 css ===== */\n' + "\n".join(rd(f) for f in CSS) + '\n' + t[i:]
