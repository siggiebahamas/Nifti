# Round 11: centered tables, cash count without bill-by-bill, To check colours by kind, simpler Check payments /
# Returns / Routes / BIR 2307, the business trend on Home (Reports folded in), Find customers, More tools always open.
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''
P("function renderSidebarForViewAsRole(){", rd('r11.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 11 css begin ===== */\n' + rd('r11.css') + '\n/* ===== Round 11 css end ===== */\n' + t[i:]
# demo gets a loss month: start the demo books fresh once
P("const BK_DEMO_KEY = 'nifti-books-demo-v3';", "const BK_DEMO_KEY = 'nifti-books-demo-v4';")
P("const LG_DEMO_KEY = 'nifti-ledger-demo-v2';", "const LG_DEMO_KEY = 'nifti-ledger-demo-v3';")
# sidebar: More tools never folds, Reports lives on Home, Find suppliers & customers sits under Sell more
P('<div class="nav-group nav-more" data-grp="more">\n      <div class="heading nav-fold" onclick="toggleNavGroup(\'more\')">More tools<span class="nav-fold-ic" aria-hidden="true">▾</span></div>',
  '<div class="nav-group nav-more">\n      <div class="heading">More tools</div>')
t = S['text']
m = re.search(r'\n      <div class="nav-item" data-page="analytics" onclick="go\(\'analytics\'\)"[^\n]*</div>(?=\n)', t)
assert m, 'analytics nav item'
t = t[:m.start()] + t[m.end():]
m = re.search(r'\n      <div class="nav-item" data-page="discover" onclick="go\(\'discover\'\)"[^\n]*</div>(?=\n)', t)
assert m, 'discover nav item'
disc = m.group(0).replace('Find suppliers &amp; customers', 'Find customers &amp; suppliers')
t = t[:m.start()] + t[m.end():]
anchor = re.search(r'\n      <div class="nav-item" data-page="followups" onclick="go\(\'followups\'\)"[^\n]*</div>(?=\n)', t)
assert anchor, 'followups nav item'
t = t[:anchor.end()] + disc + t[anchor.end():]
S['text'] = t
