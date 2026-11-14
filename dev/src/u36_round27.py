# Round 27: Telegram off, short Settings, order cards with a status strip, cash drawer summary boxes, pay by QR,
# install card on phones, plans (Pro 15 people, Business 75, payment reminders in Free), demo numbers that add up.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('r27.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 27 css ===== */\n' + rd('r27.css') + '\n' + t[i:]
# demo: owes 17,504 = says paid 14,500 + promised 3,004
a = "amount: 15000, promised_date"
print('  demo promise fixed' if S['text'].count(a) == 1 else '  (demo promise not found)')
S['text'] = S['text'].replace(a, "amount: 3004, promised_date")
