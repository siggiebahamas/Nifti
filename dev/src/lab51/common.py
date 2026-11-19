# Round 51: shared content for the three light landing versions. Every fact here is something the app does today.
SECTIONS = [
    (1, 'Introduction'), (2, 'Works with'), (3, 'Benefits of Nifti'), (4, 'Everything in one app'),
    (5, 'AI tools'), (6, 'No app for your customers'), (7, 'Your day at a glance'), (8, 'Quick facts'),
    (9, 'Safe and yours'), (10, 'Pricing plans'), (11, 'Questions'), (12, 'Final call'),
]
SNAME = dict(SECTIONS)

# same list as NF26_PLANS in the app (r26_price.js)
PLANS = [
    {'k': 'free', 'name': 'Free', 'm': 0, 'y': 0, 'who': 'A small shop running day to day.',
     'f': ['Orders with customers and suppliers', 'Who owes you, with payment reminders sent for you', 'Promises to pay, and your own GCash or bank QR on every bill', 'Messages, stock, shop sales, expenses', 'Online store and Facebook posts', 'Up to 3 people', 'Download everything any time']},
    {'k': 'pro', 'name': 'Pro', 'm': 990, 'y': 9900, 'who': 'Owner-run shops that want Nifti to chase money and keep the books.',
     'f': ['Everything in Free', 'We load your items and utang list for you', 'Books, profit and summaries for your bookkeeper', 'Payroll and check tracking', 'Credits and returns that take themselves off', 'Price announcements to all customers', 'Store results, promos, reorder reminders', 'Up to 15 people']},
    {'k': 'business', 'name': 'Business', 'm': 2990, 'y': 29900, 'who': 'Distributors with drivers, branches and staff who order and collect.',
     'f': ['Everything in Pro', 'Delivery routes and driver lists', 'Branches: each with its own drawer and stock', 'Spending caps and alerts when staff overpay', 'Credit limits and a who-pays-late list', 'Supplier report card and price checks', 'Setup by the Nifti team, verified badge, priority help', 'Up to 75 people (more? message us)']},
]
PAYSTEPS = [('Pick a plan and scan our QR', 'Use GCash, Maya or any bank app. It goes by InstaPay, like any transfer.'),
            ('Type the reference number', 'Or snap the receipt. It takes a few seconds, right inside Nifti.'),
            ('We switch your plan on', 'Usually within a few hours. Your records stay exactly as they are.')]

WORKS = ['Viber', 'GCash', 'Maya', 'Facebook', 'Messenger', 'WhatsApp', 'SMS', 'Telegram', 'Excel', 'Google Sheets', 'BIR 2307', 'Bank transfer']

BENEFITS = [
    ('cash', 'Get paid without chasing', 'Reminders go out for you by Viber, SMS, Messenger, WhatsApp or email, with your GCash QR.'),
    ('list', 'Every order in one list', 'Viber messages, voice notes and purchase orders become clean orders. Nothing retyped.'),
    ('box', 'Never run out by surprise', 'Nifti tells you what runs out, and from whom to reorder, before it happens.'),
    ('drawer', 'A cash drawer that adds up', 'Count at closing and see matched, over or short, by person and by day.'),
    ('chart', 'Know your profit any day', 'Sales, expenses and payments land in proper books while you sell.'),
    ('store', 'Sell online from a link', 'Your own store for Facebook, with GCash, Maya or cash on delivery.'),
]

AI = [
    ('pen', 'Reads your handwriting', 'Notebook pages, ledgers and messy lists become clean records. Even Taglish.'),
    ('chat', "Understands your customers' orders", 'Chats, voice notes and purchase orders turn into orders with your prices.'),
    ('mic', 'Writes your Facebook posts', "Say what's on sale. Nifti writes the post and makes the price list picture."),
    ('photo', 'Cleans up product photos', 'A quick phone photo becomes a clean product picture for your store.'),
]

# the per-hour before / after from the earlier landing page (kept, as asked)
DAY = [
    ('7:00 AM', 'Opening', 'sunrise', 'chat', 'Orders buried in 10 Viber chats', 'clip', 'Every order in one list', 'Nothing gets missed'),
    ('9:00 AM', 'Big order comes in', 'sun', 'keys', 'Retyping every PO by hand', 'mic', 'Say it, or send their order form', 'In seconds'),
    ('11:00 AM', 'Phone keeps ringing', 'sun', 'phone', '“Nasaan na yung delivery?”', 'pin', 'A tracking link they can open', 'No more calls'),
    ('3:00 PM', 'Who still owes?', 'sunset', 'clock', 'Chasing payments yourself', 'bell', 'Polite reminders, sent for you', 'On schedule'),
    ('8:00 PM', 'Closing', 'moon', 'book', 'Utang written in a notebook', 'wallet', 'Who owes you, always up to date', 'To the peso'),
]
DAY_SUM = [('layers', 'One place', 'for every order, payment and promise'), ('phoneoff', 'Fewer calls', 'customers check their own delivery')]

FACTS = [('₱0', 'to start. The Free plan stays free.'), ('0', 'apps your customers have to download'), ('1 list', 'instead of 10 Viber chats and a notebook'), ('2 min', 'to open your online store')]

TRUST = [
    ('lock', 'Sealed off from everyone else', 'Each business is kept separate. No other shop can see your customers, prices or numbers.'),
    ('peso', 'We never touch your money', 'Customers pay you directly by GCash, Maya, bank or cash, like today. Nifti keeps the record.'),
    ('down', 'Download everything, any time', 'Your records, in a file you keep. If you stop paying, you go back to Free and keep it all.'),
    ('help', 'A real person helps you', 'Message the Nifti team from inside the app. We answer, usually the same day.'),
]

FAQ = [
    ('Do my customers or suppliers need to download an app?', 'No. They get a link by Viber or SMS, open it on any phone, and tap Confirm. No sign-up.'),
    ('Can I bring in my old notebook or Excel file?', "Yes. Take photos of your notebook pages and Nifti reads them, or upload your Excel or Google Sheets file, or type them in like a spreadsheet. You check every line before it's saved."),
    ('Does Nifti hold my money?', 'No. You get paid directly, by GCash, Maya, bank or cash, like today. Nifti keeps the record and reminds people to pay.'),
    ('Do I need a computer?', 'No. Nifti works on any phone with internet. A computer is nice for bigger screens, but not needed.'),
    ('Who can see my orders and prices?', 'Only you, the people you add to your team (each sees only their part), and the customer or supplier on that order.'),
    ('What happens if I stop paying for Pro?', 'You go back to Free. Every record stays, and you can download everything any time.'),
]

ICON = {
    'cash': '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    'list': '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    'box': '<path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    'drawer': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18M10 8h4M10 16h4"/>',
    'chart': '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    'store': '<path d="M3 9 5 3h14l2 6"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z"/><path d="M5 13v8h14v-8"/>',
    'pen': '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    'chat': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    'mic': '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
    'photo': '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    'clip': '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    'keys': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M7 16h10"/>',
    'phone': '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    'pin': '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    'book': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    'wallet': '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    'sunrise': '<path d="M12 2v4M4.9 8.9l1.4 1.4M2 16h2M20 16h2M17.7 10.3l1.4-1.4M18 20H6"/><path d="M16 16a4 4 0 0 0-8 0"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    'sunset': '<path d="M12 10V2M4.9 10.9l1.4 1.4M2 18h2M20 18h2M17.7 12.3l1.4-1.4M22 22H2M16 18a4 4 0 0 0-8 0"/><path d="m16 6-4 4-4-4"/>',
    'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    'layers': '<path d="M12 2 2 7l10 5 10-5Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    'phoneoff': '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/><path d="m16 2 6 6M22 2l-6 6"/>',
    'lock': '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    'peso': '<path d="M7 21V3h6a5 5 0 0 1 0 10H7"/><path d="M4 7h14M4 10h14"/>',
    'down': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    'help': '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l2-5.2A8.4 8.4 0 1 1 21 11.5z"/>',
    'arrow': '<path d="M5 12h14M13 5l7 7-7 7"/>',
    'play': '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
    'check': '<path d="m5 12 5 5L20 7"/>',
    'x': '<path d="M18 6 6 18M6 6l12 12"/>',
    'cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H5.1"/>',
    'truck': '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.7a1 1 0 0 0-.2-.6l-3.5-4.3A1 1 0 0 0 17.5 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    'spark': '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
}
def ic(name, size=None, cls=''):
    s = f' width="{size}" height="{size}"' if size else ''
    return f'<svg class="ic {cls}" viewBox="0 0 24 24"{s} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON[name]}</svg>'

def peso(n): return '₱' + format(int(n), ',')

# product mockups shared by all versions (they show the real app, so they look the same everywhere)
M = {}
M['orders'] = '''<div class="m-card">
  <div class="m-bub"><small>Viber · Aling Nena Store</small>pabili po 3 bareta angle bar tsaka 2 kahon welding rod, pick up mamaya</div>
  <div class="m-arrow">Nifti turns it into</div>
  <div class="m-paper"><div class="m-row"><span>Angle Bars × 3</span><b>₱255</b></div><div class="m-row"><span>Welding Rods 3.2mm × 2</span><b>₱240</b></div><div class="m-row tot"><span>Order #1043 · Pick up</span><b>₱495</b></div></div>
  <div class="m-chips"><span class="g">Sent for confirmation</span><span>Viber link</span></div></div>'''
M['paid'] = '''<div class="m-card">
  <div class="m-big"><small>OWED TO YOU</small><b>₱84,200</b><span>3 customers · 1 late</span></div>
  <div class="m-li"><div><b>Mang Bert Construction</b><small>₱63,400 · 12 days late</small></div><span class="m-btn p">Remind</span></div>
  <div class="m-li"><div><b>Aling Nena Store</b><small>₱14,800 · promised Friday</small></div><span class="m-btn">Statement</span></div>
  <div class="m-li"><div><b>Corazon Welding Shop</b><small>₱6,000 · paid, you confirmed</small></div><span class="m-ok">✓</span></div>
  <div class="m-vb"><small>Sent for you by Viber, 9:00 AM</small>Hi Mang Bert! Friendly reminder: ₱63,400 for your Nov orders. Scan our GCash QR here. Salamat po!</div></div>'''
M['notebook'] = '''<div class="m-card m-nbw">
  <div class="m-nb"><div class="m-nbl"><span>8/3</span><span>Mang Bert</span><span>sem 40k</span><span>10</span><span>2,280</span></div><div class="m-nbl"><span>8/3</span><span>Bayvw</span><span>RB12</span><span>12</span><span>780</span></div><div class="m-nbl"><span>8/4</span><span>A. Nena</span><span>GW 12</span><span>1</span><span>520</span></div><i class="m-scan"></i></div>
  <div class="m-rl"><i>✓</i><div><b>Mang Bert Construction</b><small>Portland Cement 40kg × 10</small></div><em>₱2,280</em></div>
  <div class="m-rl"><i>✓</i><div><b>Bayview Construction Co.</b><small>Steel Rebar 12mm × 12</small></div><em>₱780</em></div>
  <div class="m-rl q"><i>?</i><div><b>Aling Nena Store</b><small>Galvanized Wire 12ga? Tap to check</small></div><em>₱520</em></div></div>'''
M['store'] = '''<div class="m-phone"><div class="m-notch"></div><div class="m-scr">
  <div class="m-sh"><span class="m-av">DC</span><div><b>Dela Cruz Hardware</b><small>Marikina · delivers Mon to Sat</small></div></div>
  <div class="m-prod"><span class="m-pic c1"></span><div><b>Portland Cement 40kg</b><small>₱228 a bag</small></div><span class="m-add">+</span></div>
  <div class="m-prod"><span class="m-pic c2"></span><div><b>Steel Rebar 12mm</b><small><s>₱70</s> ₱65 each</small></div><span class="m-add">+</span></div>
  <div class="m-prod"><span class="m-pic c3"></span><div><b>Galvanized Wire 12ga</b><small>₱520 a roll</small></div><span class="m-add">+</span></div>
  <div class="m-pay"><span class="on">GCash</span><span>Maya</span><span>Cash on delivery</span></div>
  <div class="m-cart">Checkout · ₱2,995<small>+ ₱80 delivery to Concepcion Uno</small></div></div></div>'''
M['stock'] = '''<div class="m-card">
  <div class="m-stk"><div><b>Galvanized Wire 12ga</b><small>6 of 75 left · about 2 days</small></div><div class="m-bar"><i style="width:8%" class="r"></i></div><span class="m-btn p">Reorder</span></div>
  <div class="m-stk"><div><b>Portland Cement 40kg</b><small>12 of 90 · 200 arriving Nov 22</small></div><div class="m-bar"><i style="width:13%" class="r"></i></div><span class="m-btn">See order</span></div>
  <div class="m-stk"><div><b>Welding Rods 3.2mm</b><small>18 of 40 · getting low</small></div><div class="m-bar"><i style="width:45%" class="y"></i></div><span class="m-btn">Reorder</span></div>
  <div class="m-stk"><div><b>Steel Rebar 12mm</b><small>240 of 240 · healthy</small></div><div class="m-bar"><i style="width:100%" class="g"></i></div><span class="m-ok">✓</span></div>
  <div class="m-snap"><span>📷</span><div><b>Snap a supplier receipt</b><small>Nifti reads names, sizes, prices and quantities</small></div></div></div>'''
M['sales'] = '''<div class="m-card">
  <div class="m-paper w"><div class="m-row"><span>Angle Bars × 5</span><b>₱425</b></div><div class="m-row"><span>Welding Rods 3.2mm × 1</span><b>₱120</b></div><div class="m-row tot"><span>Total</span><b>₱545</b></div><div class="m-row ch"><span>Cash ₱1,000 · Change</span><b>₱455</b></div></div>
  <div class="m-drw"><div><small>Expected</small><b>₱18,450</b></div><div><small>Counted</small><b>₱18,450</b></div><div class="m"><small>Result</small><b>Matched ✓</b></div></div>
  <div class="m-li"><div><b>Yesterday · counted by Joy</b><small>₱450 short · reason noted</small></div><span class="m-btn">See</span></div></div>'''
M['routes'] = '''<div class="m-card">
  <div class="m-rh"><small>TODAY · MANG RAMON · NBX 4821</small><b>3 of 6 stops</b><span>₱25,850 collected · ₱18,370 to go</span><div class="m-bar"><i style="width:50%" class="g"></i></div></div>
  <div class="m-stop done"><i>✓</i><div><b>Aling Nena Store</b><small>Malinta · Delivered</small></div><em>₱7,650</em></div>
  <div class="m-stop done"><i>✓</i><div><b>Bayview Construction Co.</b><small>Karuhatan · Collected</small></div><em>₱18,200</em></div>
  <div class="m-stop here"><i>4</i><div><b>Corazon Welding Shop</b><small>Potrero · Deliver and collect</small></div><em class="due">₱4,750</em></div>
  <div class="m-stop"><i>5</i><div><b>Mang Bert Construction</b><small>Monumento · Collect</small></div><em class="due">₱13,620</em></div></div>'''
M['books'] = '''<div class="m-card">
  <div class="m-big g"><small>PROFIT THIS MONTH</small><b>₱38,400</b><span>Sales ₱212,000 · costs ₱173,600</span></div>
  <div class="m-tiles"><div class="a"><small>Deposit today</small><b>₱18,200</b><span>1 check</span></div><div class="b"><small>Post-dated</small><b>₱42,500</b><span>next 30 days</span></div></div>
  <div class="m-li"><div><b>BIR 2307 · Bayview Construction</b><small>₱1,560 withheld · ready to file</small></div><span class="m-ok">✓</span></div>
  <div class="m-li"><div><b>October summary</b><small>sent to your bookkeeper</small></div><span class="m-ok">✓</span></div></div>'''
M['team'] = '''<div class="m-card">
  <div class="m-li"><span class="m-av g">RD</span><div><b>Rico</b><small>Owner · everything</small></div><span class="m-chip g">All pages</span></div>
  <div class="m-li"><span class="m-av b">JY</span><div><b>Joy</b><small>Cashier · sales, drawer, stock</small></div><span class="m-chip">3 pages</span></div>
  <div class="m-li"><span class="m-av y">MR</span><div><b>Mang Ramon</b><small>Driver · today's route</small></div><span class="m-chip">1 page</span></div>
  <div class="m-li"><span class="m-av p">KC</span><div><b>Kat</b><small>Poster · online store and Facebook</small></div><span class="m-chip">1 page</span></div>
  <div class="m-tg"><span>✈</span><div><b>Telegram · Nifti alerts</b><small>Mang Bert paid ₱63,400 by GCash. Tap to confirm.</small></div></div></div>'''

FEATURES = [
    ('orders', 'Orders', 'chat', 'free', 'Orders from any chat, in seconds', 'Paste a Viber message, send a voice note or snap their purchase order. Nifti matches it to your items and prices.',
     ['Taglish and shop words like “sako” understood', 'Your customer gets a link to confirm. No app, no sign-up.', 'Orders to your suppliers work the same way']),
    ('paid', 'Getting paid', 'cash', 'free', 'Know who owes you. Let Nifti do the chasing.', "Every unpaid bill in one list, with how late it is. Reminders go out on your terms, in your customer's favorite app.",
     ['Reminders by Viber, SMS, Messenger, WhatsApp or email', 'Your GCash or bank QR on every bill and statement', 'Promises to pay tracked, so you know who to call']),
    ('notebook', 'Notebook reader', 'pen', 'ai', 'Your old notebook, read in a minute', 'Take a photo of a page. Nifti reads the handwriting, even Taglish and shortcuts, and turns it into records you check line by line.',
     ['Nothing goes into your books until you tick it', 'It learns your words: “Bayvw” becomes Bayview Construction', 'Excel files and typing work too, always free']),
    ('store', 'Online store', 'store', 'free', 'Your own online store, ready for Facebook', 'One link with your items, prices and photos. Buyers order and pay without messaging you, and the order lands in your list.',
     ['GCash, Maya or cash on delivery, with your fee per barangay', 'A Monday price list picture made for you to post', 'Say your post out loud. Nifti writes it, you share it.']),
    ('stock', 'Stock', 'box', 'free', 'See what runs out, before it does', 'Stock goes down with every sale and up with every delivery. Nifti tells you what to reorder and from whom.',
     ['Reorder from your supplier in one tap', 'Add items from a photo of a receipt or price list', 'Damaged, expired and missing stock, each with a peso value']),
    ('sales', 'Sales & cash', 'drawer', 'free', 'Walk-in sales and a drawer that adds up', 'Ring up a sale in seconds, with the change worked out. At closing, count the drawer and see if it matches.',
     ['Matched, over or short, kept by person and by day', 'Expenses with a photo of the receipt', 'Sales go straight into your books and stock']),
    ('routes', 'Deliveries', 'truck', 'biz', 'Routes your drivers can follow', "Every stop for the day on the driver's own phone: what to drop off, what to collect, and proof it happened.",
     ['Photo proof at every stop', 'Cash handed over checked against what was collected', 'You see progress without calling anyone']),
    ('books', 'Books & BIR', 'chart', 'pro', 'Books that keep themselves', 'Every sale, expense and payment lands in proper books. Your profit, your cash and your BIR papers are ready when you need them.',
     ['Profit and a monthly summary for your bookkeeper', 'Post-dated checks with deposit reminders and bounce alerts', 'BIR 2307s and VAT books, by invoice']),
    ('team', 'Team', 'users', 'free', 'Your team, each with just their part', 'Add your cashier, driver, collector or the person who posts for your store. Each one sees only the pages for their job.',
     ['Owner sees everything. Staff see their part.', 'Phone alerts on Telegram for the things that matter', 'A task board so nothing gets forgotten']),
]
TAGNAME = {'free': 'Free', 'pro': 'Pro', 'biz': 'Business', 'ai': 'AI'}

# the hero phone (an order arriving, confirmed, delivered, paid)
PHONE_SEQ = '''<div class="m-phone hero"><div class="m-notch"></div><div class="m-scr">
  <div class="m-top"><b>Dela Cruz Hardware</b><span>Today</span></div>
  <div class="m-seq">
    <div class="m-s s1"><div class="m-bub"><small>Viber · Mang Bert</small>Boss, 10 sako semento tsaka 5 rolls wire. Deliver bukas? 🙏</div></div>
    <div class="m-s s2"><div class="m-ord"><div class="m-oh"><span class="m-spark">✦</span><b>Nifti made it an order</b></div>
      <div class="m-row"><span>Portland Cement 40kg × 10</span><b>₱2,280</b></div><div class="m-row"><span>Galvanized Wire 12ga × 5</span><b>₱2,600</b></div>
      <div class="m-row tot"><span>Total</span><b>₱4,880</b></div><div class="m-tap">Confirm and send link</div></div></div>
    <div class="m-s s3"><div class="m-done"><span>✓</span><div><b>Delivered</b><small>Photo proof · signed by Bert</small></div></div></div>
    <div class="m-s s4"><div class="m-done pay"><span>₱</span><div><b>Paid by GCash · ₱4,880</b><small>Books updated. Stock updated.</small></div></div></div>
  </div></div></div>'''

LINK_PHONES = '''<div class="m-phone sm k1"><div class="m-notch"></div><div class="m-scr">
  <div class="m-lh">Dela Cruz Hardware sent you an order</div>
  <div class="m-row"><span>Portland Cement × 10</span><b>₱2,280</b></div><div class="m-row"><span>Galvanized Wire × 5</span><b>₱2,600</b></div><div class="m-row tot"><span>Total</span><b>₱4,880</b></div>
  <div class="m-lb">Confirm order</div><small class="m-ls">Delivery Thursday morning</small></div></div>
<div class="m-phone sm k2"><div class="m-notch"></div><div class="m-scr">
  <div class="m-lh">You owe Dela Cruz Hardware</div><div class="m-amt">₱14,800</div><small class="m-ls">2 bills · oldest from Nov 3</small>
  <div class="m-qr"><i></i></div><div class="m-lb">I already paid</div></div></div>'''

# the mockup look (the app's own cards), shared by all versions
MOCK_CSS = r'''
.m-card{width:100%;max-width:470px;background:#FFFFFF;border-radius:22px;padding:18px;box-shadow:0 24px 50px -28px rgba(16,40,30,.28),0 0 0 1px rgba(16,40,30,.06);display:grid;gap:10px;text-align:left;color:#0B1F17;font-family:Inter,system-ui,sans-serif}
.m-bub{position:relative;background:#FFFFFF;border:1px solid #E3E9E5;border-radius:16px 16px 16px 6px;padding:9px 13px 11px;font-size:14px;line-height:1.45;box-shadow:0 6px 16px -10px rgba(16,24,40,.25)}
.m-bub small{display:block;font-size:11.5px;font-weight:700;color:#7C3AED;margin-bottom:2px}
.m-arrow{text-align:center;font-size:12.5px;font-weight:800;color:#1F6B45;letter-spacing:.03em}.m-arrow::before{content:"↓ "}
.m-paper{background:#FFFDF5;border:1px solid #F3E8C0;border-radius:14px;padding:8px 13px}.m-paper.w{background:#FFFFFF;border-color:#E3E9E5}
.m-row{display:flex;justify-content:space-between;gap:10px;padding:5px 0;font-size:13.5px}.m-row span{color:#3F4F47;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.m-row b{flex:0 0 auto;font-variant-numeric:tabular-nums}
.m-row.tot{border-top:1px dashed #CBD5D0;margin-top:3px;padding-top:7px;font-size:14.5px}.m-row.tot span{color:#0B1F17;font-weight:700}.m-row.ch b{color:#1F6B45}
.m-chips{display:flex;gap:6px;flex-wrap:wrap}.m-chips span,.m-chip{font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;background:#F2F4F7;color:#344054;white-space:nowrap}.m-chips .g,.m-chip.g{background:#DCFCE7;color:#166534}
.m-big{border-radius:16px;padding:14px 16px;background:linear-gradient(135deg,#FEF3C7,#FDE68A)}.m-big small{display:block;font-size:11.5px;font-weight:800;letter-spacing:.08em;color:#92400E}.m-big b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:32px;letter-spacing:-.02em}.m-big span{font-size:13px;font-weight:600;color:#78350F}
.m-big.g{background:linear-gradient(135deg,#DCFCE7,#A7F3D0)}.m-big.g small{color:#166534}.m-big.g span{color:#14532D}
.m-li,.m-stk{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:13px;border:1px solid #E3E9E5}
.m-li>div,.m-stk>div:first-child{flex:1;min-width:0}.m-li b,.m-stk b{display:block;font-size:14px}.m-li small,.m-stk small{display:block;font-size:12.5px;color:#3F4F47}
.m-btn{flex:0 0 auto;font-size:12px;font-weight:800;padding:5px 11px;border-radius:9px;border:1px solid #CBD5D0}.m-btn.p{background:#1F6B45;border-color:#1F6B45;color:#FFFFFF}
.m-ok{flex:0 0 24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#DCFCE7;color:#15803D;font-weight:900;font-size:12px}
.m-vb{background:#F5F3FF;border:1px solid #DDD6FE;border-radius:14px 14px 14px 6px;padding:9px 13px;font-size:13.5px;line-height:1.45}.m-vb small{display:block;font-size:11.5px;font-weight:700;color:#6D28D9;margin-bottom:2px}
.m-nbw{position:relative;overflow:hidden}
.m-nb{position:relative;background:#FFFDF2;border-radius:13px;padding:10px 14px 10px 32px;background-image:repeating-linear-gradient(180deg,transparent 0 31px,#C7D2FE 31px 32px);border:1px solid #F1E7C2;overflow:hidden}
.m-nb::before{content:"";position:absolute;left:20px;top:0;bottom:0;width:2px;background:#FCA5A5}
.m-nbl{display:grid;grid-template-columns:40px 1.3fr 1fr 28px 54px;gap:6px;height:32px;align-items:center;font-family:Caveat,'Segoe Print',cursive;font-size:21px;color:#1E3A8A}.m-nbl span:last-child{text-align:right}
.m-scan{position:absolute;left:0;right:0;top:-40px;height:40px;background:linear-gradient(180deg,rgba(52,211,153,0),rgba(52,211,153,.4),rgba(52,211,153,0));animation:mScan 3s ease-in-out infinite}
.m-rl{display:flex;align-items:center;gap:10px;padding:8px 11px;border-radius:12px;background:#F0FDF4;border:1px solid #BBF7D0}.m-rl i{flex:0 0 22px;height:22px;display:grid;place-items:center;border-radius:50%;background:#16A34A;color:#FFFFFF;font-style:normal;font-weight:900;font-size:12px}
.m-rl>div{flex:1;min-width:0}.m-rl b{display:block;font-size:13.5px}.m-rl small{font-size:12px;color:#3F4F47}.m-rl em{font-style:normal;font-weight:800;font-size:13.5px}.m-rl.q{background:#FEFCE8;border-color:#FDE68A}.m-rl.q i{background:#CA8A04}
.m-phone{position:relative;width:290px;border-radius:40px;background:#FFFFFF;padding:10px;box-shadow:0 40px 80px -36px rgba(16,40,30,.45),0 0 0 1.5px #E3E9E5,inset 0 0 0 2px #F3F5F4}
.m-notch{position:absolute;top:16px;left:50%;transform:translateX(-50%);width:78px;height:22px;border-radius:14px;background:#111827;z-index:2}
.m-scr{border-radius:31px;background:linear-gradient(180deg,#F6FBF8,#FFFFFF);padding:46px 13px 15px;display:grid;gap:9px;text-align:left;color:#0B1F17;font-family:Inter,system-ui,sans-serif;border:1px solid #EEF2F0}.m-scr>*{min-width:0}
.m-sh{display:flex;gap:10px;align-items:center;padding-bottom:8px;border-bottom:1px solid #E3E9E5}.m-sh b{display:block;font-size:14.5px}.m-sh small{font-size:12px;color:#3F4F47}
.m-av{flex:0 0 36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:12.5px;color:#FFFFFF;background:#1F6B45}.m-av.g{background:#15803D}.m-av.b{background:#1D4ED8}.m-av.y{background:#A16207}.m-av.p{background:#7C3AED}
.m-prod{display:flex;align-items:center;gap:10px}.m-prod>div{flex:1;min-width:0}.m-prod b{display:block;font-size:13.5px}.m-prod small{font-size:12.5px;color:#1F6B45;font-weight:700}.m-prod s{color:#98A2B3;font-weight:500}
.m-pic{flex:0 0 44px;height:44px;border-radius:12px}.m-pic.c1{background:linear-gradient(135deg,#E5E7EB,#9CA3AF)}.m-pic.c2{background:repeating-linear-gradient(135deg,#78716C 0 4px,#A8A29E 4px 8px)}.m-pic.c3{background:radial-gradient(circle,#E5E7EB 0 30%,#94A3B8 31% 45%,#E5E7EB 46% 60%,#94A3B8 61%)}
.m-add{flex:0 0 28px;height:28px;display:grid;place-items:center;border-radius:9px;background:#1F6B45;color:#FFFFFF;font-weight:800}
.m-pay{display:flex;gap:6px;flex-wrap:wrap}.m-pay span{font-size:11.5px;font-weight:700;padding:5px 9px;border-radius:9px;border:1.5px solid #E3E9E5}.m-pay span.on{border-color:#1F6B45;background:#F0FDF4;color:#1F6B45}
.m-cart{text-align:center;padding:10px;border-radius:13px;background:#1F6B45;color:#FFFFFF;font-weight:800;font-size:13.5px}.m-cart small{display:block;font-weight:600;font-size:11.5px;opacity:.85}
.m-bar{flex:0 0 80px;height:8px;border-radius:8px;background:#EEF2F0;overflow:hidden}.m-bar i{display:block;height:100%;border-radius:8px}.m-bar i.r{background:#EF4444}.m-bar i.y{background:#EAB308}.m-bar i.g{background:#22C55E}
.m-snap{display:flex;gap:10px;align-items:center;padding:11px;border-radius:13px;border:1.5px dashed #86EFAC;background:#F0FDF4}.m-snap>span{font-size:20px}.m-snap b{display:block;font-size:13.5px}.m-snap small{font-size:12px;color:#3F4F47}
.m-drw{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.m-drw>div{border-radius:13px;background:#F8FAF9;border:1px solid #E3E9E5;padding:9px 11px}.m-drw small{display:block;font-size:11.5px;color:#3F4F47;font-weight:700}.m-drw b{font-family:'Plus Jakarta Sans',sans-serif;font-size:16px}.m-drw .m{background:#DCFCE7;border-color:#86EFAC}.m-drw .m b{color:#15803D}
.m-rh{border-radius:15px;padding:13px 15px;background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border:1px solid #A7F3D0;display:grid;gap:3px}.m-rh small{font-size:11px;font-weight:800;letter-spacing:.06em;color:#166534}.m-rh b{font-family:'Plus Jakarta Sans',sans-serif;font-size:21px}.m-rh span{font-size:12.5px;color:#14532D}.m-rh .m-bar{flex:none;width:100%;margin-top:5px;background:#FFFFFF}
.m-stop{display:flex;align-items:center;gap:10px;padding:8px 11px;border-radius:13px;border:1px solid #E3E9E5}.m-stop i{flex:0 0 26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#F2F4F7;font-style:normal;font-weight:800;font-size:12.5px}.m-stop>div{flex:1;min-width:0}.m-stop b{display:block;font-size:13.5px}.m-stop small{font-size:12px;color:#3F4F47}.m-stop em{font-style:normal;font-weight:800;font-size:13.5px;color:#15803D}.m-stop em.due{color:#A16207}
.m-stop.done{background:#F8FAF9}.m-stop.done i{background:#16A34A;color:#FFFFFF}.m-stop.here{border:2px solid #1F6B45}.m-stop.here i{background:#1F6B45;color:#FFFFFF}
.m-tiles{display:grid;grid-template-columns:1fr 1fr;gap:9px}.m-tiles>div{border-radius:13px;padding:11px 13px}.m-tiles small{display:block;font-size:11.5px;font-weight:700}.m-tiles b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:20px}.m-tiles span{font-size:11.5px}.m-tiles .a{background:#FEF3C7;color:#78350F}.m-tiles .b{background:#DBEAFE;color:#1E3A8A}
.m-tg{display:flex;gap:10px;align-items:center;padding:11px;border-radius:13px;background:#EFF6FF;border:1px solid #BFDBFE}.m-tg>span{flex:0 0 32px;height:32px;display:grid;place-items:center;border-radius:50%;background:#229ED9;color:#FFFFFF}.m-tg b{display:block;font-size:13px}.m-tg small{font-size:12px;color:#1E3A8A}
.m-top{display:flex;justify-content:space-between;align-items:baseline;padding:0 3px 10px;border-bottom:1px solid #E3E9E5}.m-top b{font-family:'Plus Jakarta Sans',sans-serif;font-size:15px}.m-top span{font-size:12px;color:#3F4F47;font-weight:600}
.m-seq{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;padding-top:4px}.m-s{min-width:0;opacity:0;transform:translateY(14px) scale(.98);animation:mSeq 12s ease-in-out infinite}.m-s.s2{animation-delay:1.4s}.m-s.s3{animation-delay:3.4s}.m-s.s4{animation-delay:5s}
.m-ord{background:#FFFFFF;border:1.5px solid #BBF7D0;border-radius:16px;padding:11px 13px;box-shadow:0 14px 30px -18px rgba(21,128,61,.45)}.m-oh{display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:13px;color:#1F6B45}
.m-spark{display:grid;place-items:center;width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,#34D399,#FACC15);color:#0B1F17;font-size:12px}
.m-tap{margin-top:8px;text-align:center;padding:9px;border-radius:11px;background:#1F6B45;color:#FFFFFF;font-weight:800;font-size:13.5px}
.m-done{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:15px;background:#F0FDF4;border:1px solid #BBF7D0}.m-done>span{display:grid;place-items:center;flex:0 0 32px;height:32px;border-radius:50%;background:#16A34A;color:#FFFFFF;font-weight:900}.m-done b{display:block;font-size:14px}.m-done small{font-size:12px;color:#3F4F47}
.m-done.pay{background:#FEFCE8;border-color:#FDE68A}.m-done.pay>span{background:#CA8A04}
.m-phone.hero{width:300px}.m-phone.hero .m-scr{min-height:540px;align-content:start}
.m-phone.sm{width:250px}.m-phone.sm .m-scr{padding:42px 13px 16px}
.m-lh{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15.5px;line-height:1.25;padding-bottom:4px}.m-lb{text-align:center;padding:10px;border-radius:12px;background:#1F6B45;color:#FFFFFF;font-weight:800;font-size:13.5px;margin-top:4px}.m-ls{display:block;text-align:center;font-size:12px;color:#3F4F47}
.m-amt{font-family:'Plus Jakarta Sans',sans-serif;font-size:34px;font-weight:800;color:#A16207;letter-spacing:-.02em}
.m-qr{width:120px;height:120px;margin:4px auto;border-radius:12px;padding:9px;background:#FFFFFF;border:1.5px solid #E3E9E5}.m-qr i{display:block;width:100%;height:100%;background:conic-gradient(#111827 25%,transparent 0 50%,#111827 0 75%,transparent 0) 0 0/16px 16px;border-radius:3px;opacity:.9}
@keyframes mSeq{0%{opacity:0;transform:translateY(14px) scale(.98)}6%,84%{opacity:1;transform:none}92%,100%{opacity:0;transform:translateY(-6px)}}
@keyframes mScan{0%{top:-40px}100%{top:110px}}
@media (prefers-reduced-motion:reduce){.m-s{animation:none;opacity:1;transform:none}.m-scan{animation:none;display:none}}
@media (max-width:640px){.m-phone{width:270px}.m-phone.hero{width:276px}.m-phone.hero .m-scr{min-height:500px}.m-card{padding:13px;border-radius:18px}.m-bar{flex-basis:56px}.m-nbl{grid-template-columns:34px 1.3fr 1fr 22px 46px;font-size:18px}}
'''

# behavior shared by all versions: tabs, prices toggle, reveal on scroll, lab helpers (?only=7, label chips)
JS = r'''
(function(){
  function each(sel, fn, root){ Array.prototype.forEach.call((root || document).querySelectorAll(sel), fn); }
  // tabs
  each('[data-tabs]', function(box){
    var auto = box.hasAttribute('data-auto'), t = null, stop = false;
    function go(i, user){ var tabs = box.querySelectorAll('[data-tab]'), panels = box.querySelectorAll('[data-panel]'); if(!panels.length) return; i = (i + panels.length) % panels.length;
      each('[data-tab]', function(b){ var on = +b.getAttribute('data-tab') === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }, box);
      each('[data-panel]', function(p){ var on = +p.getAttribute('data-panel') === i; p.hidden = !on; p.classList.toggle('on', on); }, box);
      var b = tabs[i], row = b && b.parentElement; if(row && row.scrollWidth > row.clientWidth) row.scrollTo({left: Math.max(0, b.offsetLeft - row.offsetLeft - 16), behavior: 'smooth'});
      if(user){ stop = true; clearTimeout(t); box.classList.add('stopped'); } else if(auto) timer(i); }
    function timer(i){ clearTimeout(t); if(stop || matchMedia('(prefers-reduced-motion: reduce)').matches) return; var pr = box.querySelector('.tab-prog'); if(pr){ pr.classList.remove('run'); void pr.offsetWidth; pr.classList.add('run'); } t = setTimeout(function(){ go(i + 1); }, 7000); }
    each('[data-tab]', function(b){ b.addEventListener('click', function(){ go(+b.getAttribute('data-tab'), true); }); }, box);
    go(0);
  });
  // monthly / yearly
  each('[data-cycle]', function(b){ b.addEventListener('click', function(){ var c = b.getAttribute('data-cycle'), root = b.closest('[data-prices]') || document;
    each('[data-cycle]', function(x){ x.classList.toggle('on', x.getAttribute('data-cycle') === c); }, root);
    each('[data-m]', function(el){ el.textContent = el.getAttribute(c === 'yearly' ? 'data-y' : 'data-m'); }, root); }); });
  // reveal
  var io = 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches ? new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {rootMargin: '0px 0px -8% 0px', threshold: .06}) : null;
  each('.rv', function(e){ if(io) io.observe(e); else e.classList.add('in'); });
  // lab: show one section only (?only=7), and tell the compare page our height
  var q = location.search.match(/only=(\d+)/);
  if(q){ document.documentElement.classList.add('only'); if(q[1] === '1') document.documentElement.classList.add('s1'); each('section[data-s]', function(s){ if(s.getAttribute('data-s') !== q[1]) s.style.display = 'none'; }); each('.rv', function(e){ e.classList.add('in'); });
    var send = function(){ try{ parent.postMessage({h: document.documentElement.scrollHeight, v: document.body.getAttribute('data-v'), s: q[1]}, '*'); }catch(e){} }; window.addEventListener('load', send); setTimeout(send, 400); setTimeout(send, 1500); new ResizeObserver(send).observe(document.body); }
  if(/labels=0/.test(location.search)) document.documentElement.classList.add('nolabels');
})();
'''

LAB_CSS = r'''
.lab-tag{position:absolute;left:16px;top:0;transform:translateY(-50%);z-index:30;display:inline-flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:999px;background:#FFFFFF;border:1.5px solid var(--lab, #1F6B45);color:#0B1F17;font:800 13px/1 Inter,system-ui,sans-serif;box-shadow:0 6px 16px -8px rgba(0,0,0,.25);pointer-events:none}
.lab-tag b{display:grid;place-items:center;min-width:30px;height:24px;padding:0 6px;border-radius:999px;background:var(--lab, #1F6B45);color:#FFFFFF;font-size:12.5px}
html.nolabels .lab-tag,html.only .lab-tag{display:none}
section[data-s="1"] .lab-tag{top:12px;transform:none}
html.only:not(.s1) .a-nav,html.only:not(.s1) .b-nav,html.only:not(.s1) .c-nav{display:none}
html.only .rv{opacity:1 !important;transform:none !important;translate:none !important}
html.only body{padding-top:0}
section[data-s]{position:relative}
.pd{font-style:normal;margin-left:-.09em}
.lab-bar{position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 14px;background:#FFFFFF;border-bottom:1px solid #E5E7EB;font:600 13px/1.3 Inter,system-ui,sans-serif;color:#111827}
.lab-bar a{color:#1D4ED8;text-decoration:none;font-weight:700}.lab-bar .v{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:8px;background:var(--lab);color:#FFFFFF;font-weight:800}
html.only .lab-bar{display:none}
'''
