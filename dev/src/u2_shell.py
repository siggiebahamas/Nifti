# U2: one menu, no "Viewing as" switch, one Home, lens tabs, combined create menu and messages.
import re
from patchlib import P, INS_BEFORE, INS_AFTER, S

t = S['text']
# ---------------- icons from the current menu
def icon(page):
    m = re.search(r'<div class="nav-item[^"]*"[^>]*data-page="%s"[^>]*>(<svg.*?</svg>)' % page, t)
    return m.group(1)
ICON = {p: icon(p) for p in ['dashboard','orders','messages','suppliers','inventory','sales','followups','store','routes','prices','returns',
                             'watchdog','discover','collections','cheques','books','taxforms','analytics','team','admin','growth','settings']}
SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">%s</svg>'
ICON['money'] = SVG % '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>'
ICON['expenses'] = SVG % '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/>'
ICON['cashcount'] = SVG % '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'
ICON['profit'] = SVG % '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
ICON['sales'] = SVG % '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'

LABEL = {'dashboard':'Home','orders':'Orders','messages':'Messages','suppliers':'Customers &amp; suppliers','inventory':'Stock',
  'money':'Money overview','sales':'Sales','expenses':'Expenses','cashcount':'Cash count','collections':'Who owes you','profit':'Profit &amp; prices',
  'store':'Online store','prices':'Price list','followups':'Follow-ups','watchdog':"Owner's watchdog",'team':'Team',
  'cheques':'Cheques','returns':'Returns &amp; credits','routes':'Delivery routes','books':'Tax books','taxforms':'BIR 2307s','analytics':'Reports',
  'discover':'Find suppliers &amp; customers','admin':'Admin console','growth':'Growth desk','settings':'Settings'}
BADGE = {'orders':'ordersNavBadge','messages':'messagesNavBadge','inventory':'inventoryNavBadge','team':'teamNavBadge','cashcount':'cashcountNavBadge','money':'moneyNavBadge'}
def item(page, extra_cls=''):
    b = BADGE.get(page)
    badge = '<span id="%s" class="nav-badge" style="display:none;"></span>' % b if b else ''
    pid = ' id="salesNavItem"' if page == 'sales' else ''
    return '      <div class="nav-item%s"%s data-page="%s" onclick="go(\'%s\')" style="position:relative;">%s<span>%s</span>%s</div>\n' % (
        extra_cls, pid, page, page, ICON[page], LABEL[page], badge)
def group(heading, pages, cls='', grp=''):
    h = ''
    if heading:
        h = ('      <div class="heading nav-fold" onclick="toggleNavGroup(\'%s\')">%s<span class="nav-fold-ic" aria-hidden="true">▾</span></div>\n' % (grp, heading)) if grp else '      <div class="heading">%s</div>\n' % heading
    return '    <div class="nav-group%s"%s>\n%s%s    </div>\n' % (cls, ' data-grp="%s"' % grp if grp else '', h, ''.join(item(p) for p in pages))
nav = (group('', ['dashboard','orders','messages','suppliers','inventory'])
     + group('Money', ['money','sales','expenses','cashcount','collections','profit'])
     + group('Sell more', ['store','prices','followups'])
     + group('Control', ['watchdog','team'])
     + group('More tools', ['cheques','returns','routes','books','taxforms','analytics','discover'], ' nav-more', 'more')
     + '    <div class="nav-group">\n' + item('admin', ' owner-only') + item('growth', ' owner-only') + item('settings') + '    </div>\n')
start = t.index('    <div class="nav-group">\n      <div class="nav-item" data-page="dashboard"')
end = t.index('  <!-- Phone navigation:')
old_block = t[start:end]
new_block = nav + '  </div>\n\n'
P(old_block, new_block)

# ---------------- phone: bottom bar + More sheet
t = S['text']
bstart = t.index('  <nav class="bottom-nav" id="bottomNav" aria-label="Main">')
bend = t.index('  <div class="main">')
def bitem(page, label):
    return '    <button class="bnav-item" data-page="%s" onclick="go(\'%s\')">%s<span class="bnav-label">%s</span></button>\n' % (page, page, ICON[page], label)
more_btn = re.search(r'    <button class="bnav-item" id="bnavMoreBtn".*?</button>\n', t[bstart:bend], re.S).group(0)
def mitem(page, extra=''):
    return '      <button class="more-sheet-item%s" data-page="%s" onclick="closeMoreSheet(); go(\'%s\')">%s<span>%s</span></button>\n' % (extra, page, page, ICON[page], LABEL[page])
more_pages = ['suppliers','inventory','sales','expenses','cashcount','collections','profit','store','prices','followups','watchdog','team',
              'cheques','returns','routes','books','taxforms','analytics','discover','settings']
phone = ('  <nav class="bottom-nav" id="bottomNav" aria-label="Main">\n'
  + bitem('dashboard','Home') + bitem('orders','Orders') + bitem('money','Money') + bitem('messages','Chat') + more_btn
  + '  </nav>\n'
  + '  <div class="more-sheet-backdrop hidden" id="moreSheetBackdrop" onclick="closeMoreSheet()"></div>\n'
  + '  <div class="more-sheet hidden" id="moreSheet" role="dialog" aria-label="More">\n    <div class="more-sheet-grip"></div>\n    <div class="more-sheet-grid">\n'
  + ''.join(mitem(p) for p in more_pages) + mitem('admin', ' owner-only') + mitem('growth', ' owner-only')
  + '    </div>\n    <div class="more-sheet-row">\n'
  + '      <div class="lang-switch" role="group" aria-label="Language"><button data-lang="EN" onclick="setLanguage(\'EN\')">English</button><button data-lang="FIL" onclick="setLanguage(\'FIL\')">Filipino</button></div>\n'
  + '      <button class="btn btn-outline" style="flex:1;" onclick="closeMoreSheet(); openHelpCenter();">Help</button>\n    </div>\n  </div>\n\n')
P(t[bstart:bend], phone)

# ---------------- topbar: language switch (two clear words, not "EN / FIL")
P("""        <button id="langToggle" class="btn btn-outline" style="padding:7px 12px;font-size:15px;" onclick="toggleLanguage()">EN / FIL</button>""",
  """        <div id="langToggle" class="lang-switch" role="group" aria-label="Language"><button data-lang="EN" onclick="setLanguage('EN')">EN</button><button data-lang="FIL" onclick="setLanguage('FIL')">FIL</button></div>""")

# ---------------- + Create: everything a business records, buying or selling
cstart = S['text'].index('          <div id="createMenuDropdown" class="notif-dropdown hidden" style="width:220px;">')
cend = S['text'].index('        <div class="icon-btn" style="position:relative;" onclick="toggleNotifications(event)">')
old_create = S['text'][cstart:cend]
ci = lambda label, js, cls='': '            <div class="notif-item%s" style="cursor:pointer;" onclick="%s"><div><div class="notif-text">%s</div></div></div>\n' % (cls, js, label)
new_create = ('          <div id="createMenuDropdown" class="notif-dropdown hidden create-menu" style="width:260px;">\n'
  + '            <div class="notif-head">Money</div>\n'
  + ci('Record a sale', "closeCreateMenu(); go('sales'); setTimeout(()=>{ if(typeof openQuickSale==='function') openQuickSale(); }, 60);")
  + ci('Add an expense', "closeCreateMenu(); go('expenses'); setTimeout(()=>{ if(typeof openExpenseForm==='function') openExpenseForm(); }, 60);")
  + ci('Count today\'s cash', "closeCreateMenu(); go('cashcount');")
  + ci('Add what a customer owes you', "createAs('supplier', openOpeningBalances)")
  + '            <div class="notif-head">Orders</div>\n'
  + ci('Order from a supplier', "createAs('buyer', openCreatePOModal)", '" id="createMenuPoItem')
  + ci("Enter a customer's order", "createAs('supplier', openCustomerPoImport)")
  + ci('Send an order for a customer\'s OK', "createAs('supplier', () => openCustomerPoImport({tentative: true}))")
  + ci('Paste an order from Viber', "createAs('buyer', openPasteOrderModal)", '" id="createMenuPasteItem')
  + ci('Ask suppliers for a quote', "createAs('buyer', () => { navigate('invite'); setInviteTab('rfq'); })")
  + '            <div class="notif-head">People</div>\n'
  + ci('Invite a customer', "createAs('supplier', () => { navigate('invite'); setInviteTab('invite'); })")
  + ci('Invite a supplier', "createAs('buyer', () => { navigate('invite'); setInviteTab('invite'); })")
  + ci('Add a lead', "createAs('supplier', () => { navigate('followups'); setTimeout(fuAddLead, 150); })")
  + ci('Message', "closeCreateMenu(); go('messages');")
  + '          </div>\n        </div>\n')
P(old_create, new_create)

# ---------------- Home: one combined view (the old two are kept hidden so older code that writes into them doesn't break)
P("""      <div id="page-dashboard" class="app-page active">
        <div id="buyerDashboardView">""",
"""      <div id="page-dashboard" class="app-page active">
        <div id="oneHome"></div>
        <div id="buyerDashboardView" class="hidden old-home" aria-hidden="true">""")
P("""        <div id="supplierDashboardView" class="hidden"></div>""",
"""        <div id="supplierDashboardView" class="hidden old-home" aria-hidden="true"></div>""")
for old in ["document.getElementById(currentAppRole === 'supplier' ? 'supplierDashboardView' : 'buyerDashboardView')"]:
    P(old, "homeHost()", 4)
P("""  document.getElementById('buyerDashboardView').classList.toggle('hidden', role!=='buyer');
  document.getElementById('supplierDashboardView').classList.toggle('hidden', role!=='supplier');""", "")
P("""  latepay: g => ({t: `${g.length} buyers are late paying`, s: `${fmtPHP(hmSum(g, x => x.amt))} overdue`, a: "hmScrollTo('whoOwesMePanel')", ic: '💰', tone: 'rose'}),""",
  """  latepay: g => ({t: `${g.length} customers are late paying`, s: `${fmtPHP(hmSum(g, x => x.amt))} overdue`, a: "pickLens('collections','supplier')", ic: '💰', tone: 'rose'}),""")
P("""  pay: g => ({t: `${g.length} bills due`, s: `${fmtPHP(hmSum(g, x => x.amt))} · oldest first`, a: "hmScrollTo('billsToPayPanel')", ic: '💳', tone: 'rose'}),""",
  """  pay: g => ({t: `${g.length} supplier bills due`, s: `${fmtPHP(hmSum(g, x => x.amt))} · oldest first`, a: "pickLens('collections','buyer')", ic: '💳', tone: 'rose'}),""")

# ---------------- navigation: fixed lens pages, the one Home, tabs on two-sided pages
P("""function navigate(page){
  if(page === 'features') page = 'index'; // Features and How it works are one page now""",
"""function navigate(page){
  if(page === 'features') page = 'index'; // Features and How it works are one page now
  if(typeof PAGE_FIXED_LENS !== 'undefined' && PAGE_FIXED_LENS[page]) setLens(PAGE_FIXED_LENS[page]);""")
P("""    const inMore = !['dashboard','orders','messages','suppliers'].includes(page);""",
  """    const inMore = !['dashboard','orders','money','messages'].includes(page);""")
dash_old = re.search(r"    if\(page==='dashboard'\)\{\n      hmShowAll = false; renderHomeV2\(\);\n.*?\n    \}\n", S['text'], re.S).group(0)
P(dash_old, """    if(page==='dashboard'){ hmShowAll = false; renderOneHome(); }
""")
P("""    if(page==='settings'){ setupSettingsAccordion();""",
  """    if(typeof booksOnNavigate === 'function') booksOnNavigate(page);
    if(page==='settings'){ setupSettingsAccordion();""")
P("""  window.scrollTo(0,0);
}
// Gap: nothing oriented a first-time user""",
"""  if(appPages.includes(page) && typeof renderLensTabs === 'function') renderLensTabs(page);
  window.scrollTo(0,0);
}
// Gap: nothing oriented a first-time user""")
P("""const appPages = ['dashboard','messages','suppliers','orders','inventory','invite','discover','analytics','datacenter','settings','status','team','sales','taxforms','watchdog','store','growth','cheques','routes','prices','returns','books','admin','followups','collections'];""",
  """const appPages = ['dashboard','messages','suppliers','orders','inventory','invite','discover','analytics','datacenter','settings','status','team','sales','taxforms','watchdog','store','growth','cheques','routes','prices','returns','books','admin','followups','collections','money','expenses','cashcount','profit'];""")

# ---------------- staff roles: who can open which page (Owner / General Manager see everything)
P("""  'Purchasing Agent': ['dashboard','messages','suppliers','orders','inventory','invite','discover','analytics','prices','returns'],
  'Warehouse Manager': ['dashboard','messages','orders','inventory','routes','returns'],
  'Finance': ['dashboard','orders','suppliers','analytics','taxforms','cheques','returns','books','prices'],
  'Driver': ['dashboard','routes','messages'],""",
"""  'Purchasing Agent': ['dashboard','messages','suppliers','orders','inventory','invite','discover','analytics','prices','returns','expenses'],
  'Warehouse Manager': ['dashboard','messages','orders','inventory','routes','returns','expenses'],
  'Cashier': ['dashboard','messages','orders','sales','cashcount','expenses','inventory'],
  'Finance': ['dashboard','orders','suppliers','analytics','taxforms','cheques','returns','books','prices','money','sales','expenses','cashcount','collections','profit'],
  'Driver': ['dashboard','routes','messages'],""")
P("""  datacenter:'Upload Data', settings:'Settings', taxforms:'BIR 2307 tracker', watchdog:"Owner's control", store:'Online store', cheques:'Cheques', routes:'Routes', prices:'Price changes', returns:'Returns & credits', books:'Sales & purchase books',""",
  """  datacenter:'Upload Data', settings:'Settings', taxforms:'BIR 2307 tracker', watchdog:"Owner's watchdog", store:'Online store', cheques:'Cheques', routes:'Routes', prices:'Price list', returns:'Returns & credits', books:'Tax books',
  money:'Money overview', sales:'Sales', expenses:'Expenses', cashcount:'Cash count', collections:'Who owes you', profit:'Profit & prices',""")

# ---------------- messages: one list of customers and suppliers
P("""          <div><h1 data-i18n="head_messages">Messages</h1><p id="messagesSub">Every supplier conversation, organized by relationship — nothing lost in a Viber thread ever again.</p></div>""",
  """          <div><h1 data-i18n="head_messages">Messages</h1><p id="messagesSub">Every customer and supplier chat in one place, kept for good.</p></div>""")
P("""              <input id="msgSearchInput" type="text" placeholder="Search suppliers…" oninput="renderConversationList()">""",
  """              <input id="msgSearchInput" type="text" placeholder="Search chats…" oninput="renderConversationList()">""")
P("""              <div class="chip" onclick="setMsgFilter('unread',this)">Unread</div>
            </div>""",
"""              <div class="chip" onclick="setMsgFilter('unread',this)">Unread</div>
              <div class="chip" onclick="setMsgFilter('customers',this)">Customers</div>
              <div class="chip" onclick="setMsgFilter('suppliers',this)">Suppliers</div>
            </div>""")

# ---------------- settings: the tools card is for every business
P("""        <div class="settings-card only-supplier no-acc">
          <h2>🧰 Optional tools</h2>""",
"""        <div class="settings-card no-acc">
          <h2>🧰 Optional tools</h2>""")
# new demo user chip label is the one business
P("""        node.textContent = role==='buyer' ? 'Dela Cruz Hardware' : 'Metro Steel Co.';""",
  """        node.textContent = selfName();""")
