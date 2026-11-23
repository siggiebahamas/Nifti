# Round 63: connected-operations marketing and honest feature presentation.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
t = S['text']
# Remove the public AI order-reading and notebook-reading demonstrations at build time.
# Keep the paused implementation and beta notice in the app; only remove unsupported marketing claims.
import re
def remove_section_by_id(html, ident):
    m = re.search(r'<section\\b[^>]*\\bid=["\\']' + re.escape(ident) + r'["\\'][^>]*>', html, re.I)
    if not m: return html
    depth = 1
    for tag in re.finditer(r'<section\\b[^>]*>|</section\\s*>', html[m.end():], re.I):
        if tag.group(0).lower().startswith('</section'): depth -= 1
        else: depth += 1
        if depth == 0:
            return html[:m.start()] + html[m.end()+tag.end():]
    raise SystemExit('u63_growth: unclosed section ' + ident)
for ident in ('mkTry', 'mkNotebook'):
    t = remove_section_by_id(t, ident)
k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r63_growth.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r63_growth.js') + "\nfunction renderSidebarForViewAsRole(){")
