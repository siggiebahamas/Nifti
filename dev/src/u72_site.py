# Round 72 (marketing): the landing page and pricing page, rebuilt at BUILD time on the original approved design.
# Replaces the runtime rewrites of Rounds 62-70 (removed from r62/r63/r67/r70; r64 and r66 deleted).
# Brief "Nifti Revisions", section 3. Every replacement is checked: the build stops if a string is missing.
import os, re, base64
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

def cut_section(html, ident):
    m = re.search(r'<section\b[^>]*\bid="' + re.escape(ident) + r'"[^>]*>', html)
    if not m: return html
    depth = 1
    for tag in re.finditer(r'<section\b[^>]*>|</section\s*>', html[m.end():]):
        depth += -1 if tag.group(0).startswith('</') else 1
        if depth == 0: return html[:m.start()] + html[m.end() + tag.end():]
    raise SystemExit('u72_site: unclosed section ' + ident)

SVG = lambda d: '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'
TICK = SVG('<path d="M20 6 9 17l-5-5"/>')

t = S['text']
i = t.index('<div id="view-index"'); j = t.index('<!-- ============ MARKETING: FEATURES', i)
v = t[i:j]

# 1. The time calculator goes (brief 3.4: the replacement visual is the "Follow one order" journey below)
v = cut_section(v, 'mkCalc')

# 2. Hero: one headline system (brief 3.1) and three polished benefits (3.2); the real app on a phone at the right
OLD_H = re.search(r'<h1>Orders, deliveries and payments\. <span>Finally in one place\.</span></h1>\s*<p>[^<]*</p>', v)
if not OLD_H: raise SystemExit('u72_site: hero headline not found')
BEN = [
  ('<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>', 'Sell with confidence', 'Every customer order, clearly accounted for.'),
  ('<path d="m4 7 8-4 8 4v10l-8 4-8-4z"/><path d="m4 7 8 4 8-4M12 11v10"/>', 'Keep stock moving', 'Purchases, stock and deliveries connected.'),
  ('<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/>', 'Know your numbers', 'See sales, costs, collections and profit.'),
]
NEW_H = ('<h1 class="r72-h1">Run your business. <span>Not the daily chaos.</span></h1>\n'
         '      <p class="r72-deck">Orders. Stock. Cash. <span>Under control.</span></p>\n'
         '      <ul class="r72-ben" aria-label="What Nifti does for you">' +
         ''.join(f'<li><span class="r72-ben-ic">{SVG(d)}</span><span><b>{a}</b><small>{b}</small></span><span class="r72-tick">{TICK}</span></li>' for d, a, b in BEN) +
         '</ul>')
v = v[:OLD_H.start()] + NEW_H + v[OLD_H.end():]
# the phone: four real screens from the demo shop (the Viber screen is left out on purpose: Viber sync is Android-only)
imgs = []
for k, f in enumerate(['orders', 'routes', 'collections', 'dashboard']):
    b64 = base64.b64encode(open(os.path.join(HERE, f'loop52_{f}.jpg'), 'rb').read()).decode()
    alt = ['every order in one list', "the driver's day", 'who owes you', 'Home'][k]
    imgs.append(f'<img src="data:image/jpeg;base64,{b64}" alt="Nifti app: {alt}" decoding="async"{" class=on" if k == 0 else ""}>')
PHONE = ('<div class="r72-phone" aria-label="The real Nifti app"><div class="r72-phone-notch"></div><div class="r72-phone-screen">' + ''.join(imgs) +
         '</div><div class="r72-phone-cap" id="r72PhoneCap">Every order in one list</div></div>')
a = v.index('<div class="f4-collage">')
v = v[:a] + '<div class="f4-collage r72-col">\n      ' + PHONE + v[a + len('<div class="f4-collage">'):]

# 3. How it works (kept, brief 3.7): no promise of voice notes (voice was removed from the order flow in Round 14)
for old, new in [
    ('<p>From Viber, a voice note, their PO, or your own store link. Nifti turns it into a clean order.</p>',
     '<p>From Viber, a pasted PO or Excel file, or your own store link. It becomes one clean order.</p>'),
    ('<span>chats, voice and POs become orders</span>', '<span>chats, POs and store orders become one list</span>'),
    ('Say it, or send their order form', 'Paste it, or send their order form'),
]:
    if v.count(old) != 1: raise SystemExit('u72_site: copy not found: ' + old[:60])
    v = v.replace(old, new)

# 4. How it works = "Follow one order" (Round 73: one section instead of two, right after the hero; the old 3-step
#    "How it works" block is no longer drawn, see the nf20Landing patch below). "What changes for you" before the day.
a = v.index('<section class="f4-hero">'); b = v.index('</section>', a) + len('</section>')
v = v[:b] + '\n' + rd('r72_journey.html') + v[b:]
a = v.index('<section class="f6-ba-sec nf26-nd" id="mkHow">')
v = v[:a] + rd('r72_changes.html') + '\n' + v[a:]

# 5. FAQ: a clear icon per question instead of the question-mark bubble; larger, darker answers (3.7)
FQ_IC = {
  'app': '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  'money': '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-4v4M17 13.5h.01"/>',
  'phone': '<path d="M5 12.5 9 16.5 19 6.5"/><circle cx="12" cy="12" r="10"/>',
  'see': '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  'join': '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',
  'pay': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  'stop': '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  'plan': '<path d="M12 2 2 7l10 5 10-5z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  'help': '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z"/>',
}
def fq_icon(q):
    s = q.lower()
    for k, words in [('app', ['download', 'app?']), ('money', ['hold my money']), ('phone', ['work on my phone']), ('see', ['who can see', 'safe', 'private']),
                     ('join', ['joins later']), ('pay', ['how do i pay']), ('stop', ['stop paying', 'cancel']), ('plan', ['two plans', 'plan'])]:
        if any(w in s for w in words): return FQ_IC[k]
    return FQ_IC['help']
def faq(html):
    def rep(m):
        return '<div class="faq-item r72-fq"><span class="r72-fq-ic">' + SVG(fq_icon(m.group(1))) + '</span><div class="q">' + m.group(1) + '</div>'
    return re.sub(r'<div class="faq-item"><div class="q">(.*?)</div>', rep, html)
v = faq(v)

# 6. Final call to action: centered, peace of mind and control, no promises we can't keep (3.7)
CTA_OLD = re.search(r'<div class="cta-band">.*?</div>\s*</div>', v, re.S)
if not CTA_OLD: raise SystemExit('u72_site: final CTA not found')
CK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
CTA_IT = [
  ('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>', 'What came in', 'Every order and payment, in one list'),
  ('<path d="M7 20V4h6a4 4 0 0 1 0 8H7"/><path d="M4 8h16M4 11h16"/>', 'Who owes you', 'With the days late beside each name'),
  ('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>', "What's running low", "Before your supplier's delivery time"),
  ('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>', 'What you really made', 'Profit after costs, not a guess'),
]
v = v[:CTA_OLD.start()] + ('<div class="cta-band r72-cta">\n    <div class="p2-burst">START TODAY · FREE DURING BETA</div>\n'
    '    <h2>Know where your business stands.<span>Every day.</span></h2>\n'
    '    <p class="r72-cta-lead">Open Nifti in the morning and see it all on one screen:</p>\n'
    '    <ul class="r72-cta-grid">' + ''.join(f'<li><span class="ic">{SVG(d)}</span><span><b>{a}</b><small>{b}</small></span></li>' for d, a, b in CTA_IT) + '</ul>\n'
    '    <p class="r72-cta-tag">Calmer days. Better decisions. <b>More of the profit you work for.</b></p>\n'
    '    <div class="f5-cta"><a onclick="mk52Start()" class="btn btn-hero-primary btn-lg mk-big">Start free</a><a onclick="startDemoOrder()" class="btn btn-hero-outline btn-lg mk-big">Try the demo</a></div>\n'
    f'    <div class="r72-cta-points"><span><i>{CK}</i>Free during beta</span><span><i>{CK}</i>No card needed</span><span><i>{CK}</i>Your customers don\'t need an app</span></div>\n'
    '  </div>') + v[CTA_OLD.end():]

# 7. Prices on the landing: the regular price crossed out, then the beta price (3.7)
for old, new in [
    ('<h2>Start free. <span>Upgrade when it pays for itself.</span></h2><p>No card needed to start. One plan covers buying, selling and your books.</p>',
     '<h2>Start free. <span>Every plan is ₱0 during beta.</span></h2><p>The regular prices are shown crossed out. No card needed, and one plan covers buying, selling and your books.</p>'),
]:
    if v.count(old) != 1: raise SystemExit('u72_site: plans heading not found')
    v = v.replace(old, new)
S['text'] = t[:i] + v + t[j:]

# Both the landing and the Pricing page: plan cards and the "how paying works" box (no payment during beta)
for name, price in [('Pro', '₱990'), ('Business', '₱2,990')]:
    old = (f'<h3>{name}</h3><div class="nf26-pl-p nf64-beta-price"><s>{price}</s><b>₱0</b><span>per month during beta</span></div>'
           '<small class="nf26-pl-alt nf64-beta-save"><b>100% off while the beta is open.</b> No subscription charge during the pilot.</small>')
    new = (f'<h3>{name}</h3><div class="r72-was"><s>{price} / month</s><em>Beta</em></div><div class="nf26-pl-p"><b>₱0</b><span>per month during beta</span></div>'
           f'<small class="nf26-pl-alt r72-save">Save {price} every month while the beta is open</small>')
    P(old, new, 2)
P('<h3>Free</h3><div class="nf26-pl-p">', '<h3>Free</h3><div class="r72-was r72-blank" aria-hidden="true">&nbsp;</div><div class="nf26-pl-p">', 2)
PAY = ('<div class="nf26-pay"><b>How paying works</b><ol><li><span>1</span>Pick a plan in Nifti and scan our QR with GCash, Maya or any bank app.</li>'
       '<li><span>2</span>Type the reference number, or snap the receipt.</li><li><span>3</span>We switch your plan on, usually within a few hours. No contract, stop any time.</li></ol></div>')
P(PAY, '<div class="r72-beta"><b>Beta offer: every Business feature, ₱0.</b> There is no payment step while Nifti is in beta. When the beta ends, we tell you first, and you choose a plan or stay on Free.</div>', 2)
t = S['text']; i = t.index('<div id="view-pricing"'); k = t.index('<footer', i)
S['text'] = t[:i] + faq(t[i:k]) + t[k:]

# the reminder in the "Who owes you" panel: automatic reminders go by email or Nifti chat (send_payment_reminders), never Viber
P('<strong>Reminder sent to Riverside</strong><small>by Viber · ₱63,400 · on time</small>', '<strong>Reminder sent to Riverside</strong><small>by email · ₱63,400 · on time</small>')

# 8. "See it in action" (3.7): six tabs that each open their own panel, set in the source so tabs and panels can never drift.
#    "Orders from chat" is dropped (order reading is not advertised); "Staff overspending" made claims about
#    price checks against other buyers, so it becomes Stock (What runs out), a feature that works today.
P("""const NF20_SHOW = [
  ['Orders from any chat', 'Orders from chat', 'chat'], ['Know exactly who owes you', 'Who owes you', 'peso'], ['Routes your drivers', 'Driver routes', 'truck'],
  ['Cheques you never miss', 'Checks', 'check'], ['Order from every supplier', 'Buying', 'cart'], ['Know when staff overpay', 'Staff overspending', 'shield'],
  ['Your own store', 'Your own store', 'store'], ['__books', 'Books', 'book']
];""", """const NF20_SHOW = [
  ['Know exactly who owes you', 'Who owes you', 'peso'], ['Routes your drivers', 'Driver routes', 'truck'], ['Order from every supplier', 'Buying', 'cart'],
  ['__stock', 'What runs out', 'box'], ['Your own store', 'Your own store', 'store'], ['__books', 'Books', 'book']
];""")
P("  book: '<path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z\"/><path d=\"M8 7h8M8 11h6\"/>'\n};",
  "  book: '<path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z\"/><path d=\"M8 7h8M8 11h6\"/>',\n  box: '<path d=\"M21 8 12 3 3 8v8l9 5 9-5z\"/><path d=\"m3 8 9 5 9-5M12 13v8\"/>'\n};")
P("    if(t === '__books') inner = nf20BooksPanel();", "    if(t === '__books') inner = nf20BooksPanel();\n    else if(t === '__stock') inner = nf72StockPanel();")
# Round 73: the 3-step How it works block is folded into "Follow one order" (#mkJourney), so it is not drawn
P("  pick.replaceWith(how); how.after(show);", "  pick.replaceWith(show);")
# no auto-advancing tabs: a visitor picks, the choice stays
P("  if(!reduce) nf20ShowTimer();\n  show.addEventListener", "  NF20S.stop = true;\n  show.addEventListener")

# styles with the marketing styles; behaviour with the app's scripts
t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r72_site.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r72_site.js') + "\nfunction renderSidebarForViewAsRole(){")
