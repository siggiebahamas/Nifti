# Round 35: faster sale/expense entry, menu fixes, red menu counts, AI reading off for launch, Getting paid numbers that tie out
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

# Getting paid: the Promised box adds up the same promises shown on the customer rows
P("const promised = (promisesCache || []).filter(p => p.status === 'open').reduce((s, p) => s + Number(p.amount), 0);",
  "const promised = typeof nf35Promised === 'function' ? nf35Promised().amt : 0;")
P("<span>${(n => n + ' promise' + (n === 1 ? '' : 's'))((promisesCache || []).filter(p => p.status === 'open').length)}</span>",
  "<span>${(n => n + ' promise' + (n === 1 ? '' : 's'))(typeof nf35Promised === 'function' ? nf35Promised().n : 0)}</span>")

# AI reading is off for launch: no "notebook pages" promises on the plans or the compare table
t = S['text']
t = re.sub(r"<li>(?:(?!</li>).)*?notebook pages a month(?:(?!</li>).)*?</li>", "", t)
t = re.sub(r"'[\d,]+ notebook pages a month',\s*", "", t)
t = re.sub(r"<tr><td>Notebook pages read a month</td>.*?</tr>", "", t)
S['text'] = t

P("function renderSidebarForViewAsRole(){", rd('r35.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 35 css ===== */\n' + rd('r35.css') + '\n' + t[i:]
