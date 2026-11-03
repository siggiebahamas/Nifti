# U9: the ledger and the owner's bookkeeping pages (Books & reports, To check, Payroll, Month-end close)
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()
SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">%s</svg>'
IC = {
  'issues': SVG % '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  'ledger': SVG % '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h6"/>',
  'payroll': SVG % '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  'close': SVG % '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'bank': SVG % '<path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>',
}
LBL = {'issues': 'To check', 'ledger': 'Books &amp; reports', 'payroll': 'Payroll', 'close': 'Month-end close', 'bank': 'Bank &amp; deposits'}
JS = {'bank': "colTab='cash'; pickLens('collections','supplier')"}
def nav(p):
    badge = '<span id="issuesNavBadge" class="nav-badge" style="display:none;"></span>' if p == 'issues' else ''
    return '      <div class="nav-item" data-page="%s" onclick="%s" style="position:relative;">%s<span>%s</span>%s</div>\n' % (p if p != 'bank' else 'collections', JS.get(p, "go('%s')" % p), IC[p], LBL[p], badge)
def sheet(p):
    return '      <button class="more-sheet-item" data-page="%s" onclick="closeMoreSheet(); %s">%s<span>%s</span></button>\n' % (p if p != 'bank' else 'collections', JS.get(p, "go('%s')" % p), IC[p], LBL[p])
t = S['text']
i = t.index('      <div class="nav-item" data-page="profit"'); j = t.index('    </div>\n', i) + len('    </div>\n')
group = '    <div class="nav-group">\n      <div class="heading">Bookkeeping</div>\n' + ''.join(nav(p) for p in ['issues', 'ledger', 'bank', 'payroll', 'close']) + '    </div>\n'
t = t[:j] + group + t[j:]
k = t.index('      <button class="more-sheet-item" data-page="profit"'); k2 = t.index('\n', k) + 1
t = t[:k2] + ''.join(sheet(p) for p in ['issues', 'ledger', 'bank', 'payroll', 'close']) + t[k2:]
S['text'] = t
P("""      <div id="page-admin" class="app-page">""",
"""      <div id="page-ledger" class="app-page">
        <div class="page-head bk-head"><div><h1>Books &amp; reports</h1><p>Profit and loss, balance sheet and ledger, made from what you already record. Every number opens the records behind it.</p></div></div>
        <div id="lgBody"></div>
      </div>
      <div id="page-issues" class="app-page">
        <div class="page-head bk-head"><div><h1>To check</h1><p>Things that don't add up: what happened, why it matters, the proof, and what to do next.</p></div></div>
        <div id="issBody"></div>
      </div>
      <div id="page-payroll" class="app-page">
        <div class="page-head bk-head"><div><h1>Payroll</h1><p>Pay your staff, take back their vale, and print a payslip for each.</p></div></div>
        <div id="prBody"></div>
      </div>
      <div id="page-close" class="app-page">
        <div class="page-head bk-head"><div><h1>Month-end close</h1><p>Check last month is complete, then lock it so the numbers stop changing.</p></div></div>
        <div id="clsBody"></div>
      </div>

      <div id="page-admin" class="app-page">""")
P("""'collections','money','expenses','cashcount','profit'];""", """'collections','money','expenses','cashcount','profit','ledger','issues','payroll','close'];""")
P("""  'Finance': ['dashboard','orders','suppliers','analytics','taxforms','cheques','returns','books','prices','money','sales','expenses','cashcount','collections','profit'],""",
  """  'Finance': ['dashboard','orders','suppliers','analytics','taxforms','cheques','returns','books','prices','money','sales','expenses','cashcount','collections','profit','ledger','issues','payroll','close'],""")
P("""  money:'Money overview', sales:'Sales', expenses:'Expenses', cashcount:'Cash count', collections:'Who owes you', profit:'Profit & prices',""",
  """  money:'Money overview', sales:'Sales', expenses:'Expenses', cashcount:'Cash count', collections:'Who owes you', profit:'Profit & prices', ledger:'Books & reports', issues:'To check', payroll:'Payroll', close:'Month-end close',""")
P("function renderSidebarForViewAsRole(){", rd('books_ledger.js') + rd('books_ops.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; anchor = '  .settings-card:empty{display:none;}'
i = t.rindex(anchor)
S['text'] = t[:i] + rd('ledger.css') + t[i:]
