# Round 75 (dashboard): one-page Walk-in sales, Deliveries board and standing rider, price announcements to chosen buyers,
# To check as one-fix cards, Follow-ups composer, BIR 2307 quarters and proof, expenses approvals, Team, Plans.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
def Pspan(start, end, new):
    t = S['text']; assert t.count(start) == 1, ('Pspan start', t.count(start), start[:60]); i = t.index(start); j = t.index(end, i) + len(end); S['text'] = t[:i] + new + t[j:]

t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r75.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r75.js') + "\nfunction renderSidebarForViewAsRole(){")

# --- Walk-in sales: Utang keeps Customer / Owes / Paid; Discounts names its first column Staff member ---
P("{page: 'sales', h: /^Utang/, rename: 'Utang from shop sales', cols: [['Customer', 't'], ['Sales'], ['Oldest'], ['Owes', 'n'], ['', 'a']],\n    cells: p => [p.title, p.meta[0], nf25Strip(p.meta[1], /^(oldest|pinakaluma)\\s*/i), p.amt, p.act], total: 3},",
  "{page: 'sales', h: /^Utang/, rename: 'Utang from shop sales', cols: [['Customer', 't'], ['Owes', 'n'], ['', 'a']],\n    cells: p => [p.title, p.amt, p.act], total: 1},")
P("{page: 'sales', h: /^Discounts/, cols: [['Who', 't'], ['What happened', 'w'], ['Amount', 'n']],",
  "{page: 'sales', h: /^Discounts/, cols: [['Staff member', 't'], ['What happened', 'w'], ['Amount', 'n']],")
# --- Cash drawer: the month's summary sits in the calendar header; today's box says who counts ---
P("'<span class=\"pill n\">No counts this month yet</span>'}</span></div>",
  "'<span class=\"pill n\">No counts this month yet</span>'}</span>${typeof nf75CalStat === 'function' ? nf75CalStat(y, m, by) : ''}</div>")
P("box.dataset.k = key; box.innerHTML = nf30DayHtml(NF30C.day); }",
  "box.dataset.k = key; box.innerHTML = (typeof nf75WhoCounts === 'function' ? nf75WhoCounts(NF30C.day) : '') + nf30DayHtml(NF30C.day); }")

# --- Expenses: Expense type, N/A, approve right on the row, one simple approval rule ---
P("{page: 'expenses', h: /^Waiting for your OK/, cols: [['What', 't']", "{page: 'expenses', h: /^Waiting for your OK/, cols: [['Expense type', 't']")
P("dayCol: true, cols: [['Date', 'd'], ['What', 't'], ['Paid to'],", "dayCol: true, cols: [['Date', 'd'], ['Expense type', 't'], ['Paid to'],")
P("return [p.day, c + nf25Sm(tags.concat(after)), v, from,", "return [p.day, c + nf25Sm(tags.concat(after)), v || 'N/A', from,")
P("if(e.status === 'submitted') return '<span class=\"bk-tag\">waiting for OK</span> ';",
  "if(e.status === 'submitted') return (typeof booksCanSeeTotals === 'function' && booksCanSeeTotals()) ? '<span class=\"bk-tag\">needs your OK</span> ' : '<span class=\"bk-tag\">waiting for the owner\\'s OK</span> ';")
P("${boss && !e.deletedAt ? `<button class=\"sl-link\" onclick=\"openExpenseForm('${e.id}')\">Edit</button>",
  "${boss && !e.deletedAt && e.status === 'submitted' ? `<button class=\"sl-link nf75-ok\" onclick=\"bkReviewExpense('${e.id}', true)\">Approve</button><button class=\"sl-link bk-dim\" onclick=\"bkReviewExpense('${e.id}', false)\">Send back</button>` : ''}${boss && !e.deletedAt && e.status !== 'submitted' ? `<button class=\"sl-link\" onclick=\"openExpenseForm('${e.id}')\">Edit</button>")
P("""      <div class="field"><label class="bk-check"><input type="checkbox" ${s.dual_approval ? 'checked' : ''} onchange="bkSaveSettings({dual_approval: this.checked})"> Big expenses from managers and finance also need someone else's OK</label></div></div>""",
  """      </div>""")

# --- Demo owner: a person's name (Ramon Dela Cruz), so short names read "Ramon", not "Dela" ---
_n = S['text'].count("'Dela Cruz'"); assert _n >= 20, _n
S['text'] = S['text'].replace("'Dela Cruz'", "'Ramon Dela Cruz'").replace("Dela Cruz (You)", "Ramon Dela Cruz (You)")

# --- Plans: an icon per feature, short words, a hook line per plan ---
P("<p class=\"nf26-who\">${p.who}</p><ul>${p.f.map(f => `<li>${NF26_CHK}<span>${f}</span></li>`).join('')}</ul>",
  "${typeof nf75PlanTop === 'function' ? nf75PlanTop(p, s) : ''}<p class=\"nf26-who\">${p.who}</p><ul class=\"nf75-fl\">${p.f.map(f => typeof nf75Feat === 'function' ? nf75Feat(f) : `<li>${NF26_CHK}<span>${f}</span></li>`).join('')}</ul>")

# --- Prices & profit: the announcement composer is rebuilt (who hears it, a clear start date, a short preview) ---
Pspan("  el.innerHTML = `<div class=\"panel-card\">\n      <div style=\"font-weight:800;font-size:16px;\">📢 Announce new prices</div>", "  renderPricePreview();\n}",
      "  nf75Composer(el, cat, history, buyers);\n}")
# --- BIR 2307 worksheet: a missing address is flagged like a missing TIN; a clear note on what Nifti does and doesn't do ---
P("<div style=\"font-size:14px;\">Address: ${escapeHtml(p.address || '—')}</div></div>`;",
  "<div style=\"font-size:14px;\">Address: ${p.address ? escapeHtml(p.address) : '<span style=\"color:var(--danger);\">missing, add it before you sign</span>'}</div></div>`;")
P("<div class=\"stmt-small\">Certificate of Creditable Tax Withheld at Source · the numbers to copy into the official form</div>",
  "<div class=\"stmt-small\">Certificate of Creditable Tax Withheld at Source · the numbers to copy into the official form. Check each one against your receipts before signing; anything in red is missing.</div>")
