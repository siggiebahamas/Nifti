# Round 36: menu counts = to-dos, steady chat list, wide summary boxes, clean lead cards, task history, Viber bridge (web side)
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

# section headings in the menu show how many things need you inside (not how many pages it holds)
P("    if(c.textContent !== String(n)) c.textContent = n;",
  "    { const todo = typeof nf36GroupTodo === 'function' ? nf36GroupTodo(g) : 0, lbl = todo ? String(todo) : ''; if(c.textContent !== lbl) c.textContent = lbl; if(c.hidden !== !todo) c.hidden = !todo; }")

# the chat list is never reworded after it's drawn (that made names and previews jump)
for name in ["const NF26_SKIP = '", "const NF_NO = '", "const I18N_SKIP = '"]:
    P(name, name + ".nf33-row, .nf33-hit, .nf33-tabs, ")

# summary box names
P("<small>Waiting for customer's OK</small>", "<small>Waiting for Customer's OK</small>")
P("<small>Said yes (30 days)</small>", "<small>Said Yes</small>")

# expense note field announces itself to screen readers
P('<input maxlength="500" value="${escapeHtml(EXF.note)}" oninput="EXF.note=this.value">', '<input maxlength="500" aria-label="Note (optional)" value="${escapeHtml(EXF.note)}" oninput="EXF.note=this.value">')

# deleted jobs remember who and when
P("startedAt: r.started_at ? r.started_at.slice(0,10) : null,", "startedAt: r.started_at ? r.started_at.slice(0,10) : null, deletedAt: r.deleted_at || null, deletedBy: r.deleted_by_name || null,")

JS = [f for f in ['r36.js', 'r36_viber.js'] if os.path.exists(os.path.join(HERE, f))]
CSS = [f for f in ['r36.css', 'r36_viber.css'] if os.path.exists(os.path.join(HERE, f))]
P("function renderSidebarForViewAsRole(){", "\n".join(rd(f) for f in JS) + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 36 css ===== */\n' + "\n".join(rd(f) for f in CSS) + '\n' + t[i:]
