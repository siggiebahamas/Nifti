# Round 7: a curated demo (5 to 7 samples per section, nothing empty, no pile-up on refresh),
# the More tools rebuilt in plain words (Check payments, Reports) with steps on every tool,
# and pictures (upload or icons) with clear customer vs supplier colours.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('r7_demo.js') + "\n" + rd('r7_tools.js') + "\n" + rd('r7_avatar.js') + "\nfunction renderSidebarForViewAsRole(){")
# fresh demo storage, so old copies that grew on every visit are left behind
P("let NIFTI_STORAGE_KEY = 'nifti-app-state-v1';", "let NIFTI_STORAGE_KEY = 'nifti-app-state-v2';")
P("const BK_DEMO_KEY = 'nifti-books-demo-v2';", "const BK_DEMO_KEY = 'nifti-books-demo-v3';")
P("const LG_DEMO_KEY = 'nifti-ledger-demo-v1';", "const LG_DEMO_KEY = 'nifti-ledger-demo-v2';")
P("const PR_DEMO_KEY = 'nifti-payroll-demo-v1';", "const PR_DEMO_KEY = 'nifti-payroll-demo-v2';")
S['text'] = S['text'].replace('<span>Cheques</span>', '<span>Check payments</span>')
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 7 css begin ===== */\n' + rd('r7.css') + '\n/* ===== Round 7 css end ===== */\n' + t[i:]
