# Round 47: split order boxes, prices table, month table + line, one Add items button, store on one screen, clear page names,
# pages you can switch on and off, a menu that grows as you go, edit delivery runs in place, a way back from every jump
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('r47.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 47 css ===== */\n' + rd('r47.css') + '\n' + t[i:]
# demo chat: say "order 0852" the way the rest of the app does
P("Following up on PO-2026-0852 —", "Following up on order 0852 —")
