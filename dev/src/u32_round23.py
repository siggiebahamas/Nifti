# Round 23: two money boxes for credits, Books without repeats, a ledger that lines up, AI tools menu,
# Telegram-only alerts, and a simpler online store (one Post today, a week planner that opens in place).
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    return open(os.path.join(HERE, n), encoding='utf-8').read()

P("function renderSidebarForViewAsRole(){", rd('r23.js') + "\n" + rd('r23_store.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 23 css begin ===== */\n' + rd('r23.css') + '\n/* ===== Round 23 css end ===== */\n' + t[i:]
