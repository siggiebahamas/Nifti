# Round 33: Messages like Viber/WhatsApp, Team mission board, Help center + live chat, reminders by preferred app
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
# tasks remember when someone started them (the Doing column)
P("    acknowledgedAt: r.acknowledged_at ? r.acknowledged_at.slice(0,10) : null,\n    completedAt:", "    acknowledgedAt: r.acknowledged_at ? r.acknowledged_at.slice(0,10) : null, startedAt: r.started_at ? r.started_at.slice(0,10) : null,\n    completedAt:")
JS = ['r33_msg.js', 'r33_team.js', 'r33_help.js', 'r33_remind.js']
CSS = ['r33_msg.css', 'r33_team.css', 'r33_help.css', 'r33_remind.css']
JS = [f for f in JS if os.path.exists(os.path.join(HERE, f))]
CSS = [f for f in CSS if os.path.exists(os.path.join(HERE, f))]
P("function renderSidebarForViewAsRole(){", "\n".join(rd(f) for f in JS) + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 33 css ===== */\n' + "\n".join(rd(f) for f in CSS) + '\n' + t[i:]
