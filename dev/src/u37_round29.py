# Round 29: real files in chat (photos up to 1080p, PDFs keep their names, kept for good)
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
P('<div class="msg-attachment">${ATTACHMENT_ICON_SVG}<span>${m.attachment.name} · ${m.attachment.size}</span></div>', '${nf29Att(m)}')
P("function renderSidebarForViewAsRole(){", rd('r29.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 29 css ===== */\n' + rd('r29.css') + '\n' + t[i:]
