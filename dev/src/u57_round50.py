# Round 50: no info icons on pills, Notebook reader / Old records / Plans as their own pages, store back fix,
# sweep fixes, and the new landing + pricing pages
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

# (the landing and pricing pages moved to u58_round51)
# handwriting font for the notebook pictures
S['text'] = S['text'].replace('family=IBM+Plex+Sans:wght@400;500;600;700&display=swap', 'family=IBM+Plex+Sans:wght@400;500;600;700&family=Caveat:wght@600;700&display=swap', 1)

# ---- app ----
P("function renderSidebarForViewAsRole(){", rd('r50.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 50 css ===== */\n' + rd('r50.css') + '\n' + t[i:]
