# Round 82 (dashboard): Money/Expenses polish, get-paid-faster tools in Free, onboarding and ease of use,
# operations helpers, offline sales, plan changes.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
CSS = ['r82.css', 'r82p.css']
JS = ['r82.js', 'r82p.js']
t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + '\n'.join(rd(c) for c in CSS) + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", '\n'.join(rd(j) for j in JS) + "\nfunction renderSidebarForViewAsRole(){")

# --- utang due dates: read from the server, saved with each utang sale ---
P("payLog: Array.isArray(r.payment_log) ? r.payment_log : []}; }", "payLog: Array.isArray(r.payment_log) ? r.payment_log : [], dueDate: r.due_date || null}; }")
P("  const _nf79Photo = QS.photo || null; if(_nf79Photo) sale.photo = _nf79Photo;",
  "  const _nf79Photo = QS.photo || null; if(_nf79Photo) sale.photo = _nf79Photo;\n  if(QS.paidWith === 'credit' && typeof nf82QsDue === 'function') sale.dueDate = nf82QsDue();")
P("    if(okId) row.price_approval_id = okId;\n    const { data, error } = isOffline ? {error: {message: 'offline'}} : await sb.from('downstream_sales').insert(row).select().single();",
  "    if(okId) row.price_approval_id = okId;\n    if(sale.dueDate) row.due_date = sale.dueDate;\n    const { data, error } = isOffline ? {error: {message: 'offline'}} : await sb.from('downstream_sales').insert(row).select().single();")
