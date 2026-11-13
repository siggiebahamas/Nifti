# Round 25: real Telegram alerts (link, switches, test, team list), the admin switches for Telegram and
# notebook reading, real notebook reading for signed-in businesses, a full Excel export, clearer store
# example numbers, a lighter "All good" with a visible check, Counter renamed Sales, bookkeeper wording
# in place of "for the BIR", and a new privacy notice and terms.
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    return open(os.path.join(HERE, n), encoding='utf-8').read()

# new privacy notice and terms (replace the whole body of each page)
def swap(h1, new):
    t = S['text']; i = t.index(h1); j = t.index('</div></section>', i)
    S['text'] = t[:i] + new + t[j:]
swap('  <h1 style="margin-bottom:6px;">Privacy Policy</h1>', rd('r25_privacy.html'))
swap('  <h1 style="margin-bottom:6px;">Terms of Service</h1>', rd('r25_terms.html'))

# "Counter" is not a word people use for this: it is the shop's own sales
WORDS = [
    ('Every sale at the counter: walk-ins, GCash and utang. Stock comes out by itself.', 'Every sale in your shop: walk-ins, GCash and utang. Stock comes out by itself.'),
    ("Don't sell these at the counter.", "Don't sell these in the shop."),
    ('Received at the counter', 'Received in the shop'),
    ('sold at the counter', 'sold in the shop'),
    ('At the counter', 'In the shop'),
    ('Counter sales', 'Shop sales'),
    ('Counter sale', 'Shop sale'),
    ('Counter utang', 'Shop utang'),
    ('Bawat benta sa counter', 'Bawat benta sa tindahan'),
    ('Huwag itong ibenta sa counter', 'Huwag itong ibenta sa tindahan'),
    ('Natanggap sa counter', 'Natanggap sa tindahan'),
    ('Benta sa counter', 'Benta sa tindahan'),
    ('"Sa counter"', '"Sa tindahan"'),
    # until the books are registered, they are summaries for the bookkeeper
    ('Your sales book and purchase book for the BIR, filled in from your invoices.', 'Summaries for your bookkeeper: your sales and purchases, filled in from your invoices.'),
    ('The sales and purchase books BIR asks for.', 'Sales and purchase summaries for your bookkeeper.'),
    ('BIR-ready Sales Invoices, Delivery Receipts &amp; VAT', 'Sales invoices, delivery receipts &amp; VAT summaries for your bookkeeper'),
    ('BIR-ready Sales Invoices, Delivery Receipts & VAT', 'Sales invoices, delivery receipts & VAT summaries for your bookkeeper'),
    ('BIR-ready Sales Invoices and VAT tracking', 'Sales invoices and VAT summaries for your bookkeeper'),
    ('and BIR-ready sales invoices', 'and sales invoices with VAT summaries for your bookkeeper'),
]
for a, b in WORDS:
    n = S['text'].count(a)
    if n == 0:
        print('  (r25 words: not found)', a[:60])
    S['text'] = S['text'].replace(a, b)

P("function renderSidebarForViewAsRole(){", rd('r25.js') + "\n" + rd('r25_nb.js') + "\n" + rd('r25_ui.js') + "\n" + rd('r25_fil.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 25 css begin ===== */\n' + rd('r25.css') + '\n' + rd('r25_fix.css') + '\n' + rd('r25_ui.css') + '\n/* ===== Round 25 css end ===== */\n' + t[i:]
