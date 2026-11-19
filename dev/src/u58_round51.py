# Round 51: the original landing and pricing pages stay exactly as they were (fonts, colours, sizes, spacing, layout).
# Only the product pictures and the lines beside them are brought up to date, so a visitor who then opens the demo
# shop sees the same shop: Dela Cruz Hardware is YOUR shop, the customers are Riverside, Bayview, Corazon and
# Cavite Steel Works, the suppliers are Metro Steel and Cebu Aggregates, the team is Ana Reyes and Mark Santos, and the
# items and prices are the demo's. The Deliveries and Online store phones show the screens the app has today.
# The pricing page's "Compare every feature" table now agrees with the plan cards (routes, staff spending, supplier
# report card, price checks and credit limits are Business; payment reminders are in Free).
import re
from patchlib import S

def R(old, new):
    t = S['text']; n = t.count(old)
    if n < 1:
        raise SystemExit('R51 PATCH FAIL (not found): %r' % old[:160])
    S['text'] = t.replace(old, new)

# ---- hero pictures ----
R('<strong>New order from Aling Nena</strong><small>20 bags cement · ₱4,900</small>', '<strong>New order from Bayview</strong><small>20 bags cement · ₱4,560</small>')
R('<strong>Dela Cruz paid ₱18,900</strong><small>GCash · matched to INV-0412</small>', '<strong>Riverside paid ₱6,000</strong><small>GCash · confirm in one tap</small>')
R('<strong>Delivered: PO-0853</strong><small>Signed by Juan · photo saved</small>', '<strong>Delivered: Order 0855</strong><small>Signed at Bayview · photo saved</small>')
R('<strong>Delivered: PO-0853</strong><small>Received by Juan · complete · photo saved</small>', '<strong>Delivered: Order 0855</strong><small>Received at Bayview · complete · photo saved</small>')

# ---- a chat message becomes an order (demo items and prices) ----
R('10 bags cement, 5 rolls wire, 20 pcs rebar 10mm</div>', '10 bags cement, 5 rolls wire, 20 pcs rebar 12mm</div>')
R('<span>Portland Cement 40kg × 10</span><b>₱2,450</b>', '<span>Portland Cement 40kg × 10</span><b>₱2,280</b>')
R('<span>GI Wire #16 × 5</span><b>₱475</b>', '<span>Galvanized Wire 12ga × 5</span><b>₱4,250</b>')
R('<span>Rebar 10mm × 20</span><b>₱3,600</b>', '<span>Steel Rebar 12mm × 20</span><b>₱1,300</b>')
R('<strong>New order · Boy Hardware</strong><small>3 items · ₱6,525</small>', '<strong>New order · Bayview Construction</strong><small>3 items · ₱7,830</small>')

# ---- who owes you ----
R('<b>Dela Cruz Hardware</b><small>₱63,400 · 12 days late</small>', '<b>Riverside Builders Corp</b><small>₱63,400 · 12 days late</small>')
R('<b>Aling Nena Store</b><small>₱14,800 · due Fri</small>', '<b>Bayview Construction Co.</b><small>₱14,800 · promised Friday</small>')
R('<b>JR Bautista</b><small>₱6,000 · paid ✓ confirmed</small>', '<b>Corazon Welding Shop</b><small>₱6,000 · paid ✓ you confirmed</small>')
R('<strong>Reminder sent to Dela Cruz</strong><small>₱63,400 · polite, on schedule</small>', '<strong>Reminder sent to Riverside</strong><small>by Viber · ₱63,400 · on time</small>')
R('<li>Reminders on your terms (Pro)</li>', '<li>Reminders by Viber, SMS, Messenger, WhatsApp or email</li>')

# ---- deliveries: the day list the app shows now (Mark Santos, L300 van, Done / Next stop / Couldn't do) ----
R('<span class="m2-badge pro">PRO</span><h3>Routes your drivers can follow</h3>', '<span class="m2-badge pro">BUSINESS</span><h3>Routes your drivers can follow</h3>')
R('<li>Photo proof at every stop</li><li>Short cash flagged the same day</li><li>Works on the driver’s own phone</li>',
  '<li>Send the day’s list to your driver on Viber</li><li>Each stop turns green: done, next, or couldn’t do</li><li>Photo proof, and cash checked the same day</li>')
R('<div class="f4-out"><b>6 stops</b><span>planned, tracked, collected</span></div>', '<div class="f4-out"><b>5 stops</b><span>planned, tracked, collected</span></div>')
R('<small>TODAY · MANG RAMON · NBX 4821</small><b>3 of 6 stops</b><span>₱25,850 collected · ₱18,370 to go</span>', '<small>TODAY · MARK SANTOS · L300 VAN</small><b>3 of 5 stops</b><span>₱18,200 collected · ₱13,620 to go</span>')
R('<b>Aling Nena Hardware</b><small>Malinta · Deliver</small>', '<b>Cavite Steel Works</b><small>Dasmariñas · Delivered</small>')
R('<b>JR Bautista Const.</b><small>Karuhatan · Collect</small>', '<b>Bayview Const.</b><small>Karuhatan · Collected</small>')
R('<b>Boy Hardware</b><small>Marulas · Deliver + collect</small></div><em class="due">₱4,750</em>', '<b>Riverside Builders</b><small>Pasig · Next · Collect</small></div><em class="due">₱6,000</em>')
R('<span>5 rolls GI Wire</span><span class="g">Collect ₱4,750</span></div><div class="mk-btns"><span class="p">Delivered + collect</span><span>Can\'t</span>',
  '<span>20 bags cement</span><span class="g">Collect ₱6,000</span></div><div class="mk-btns"><span class="p">Done</span><span>Can\'t</span>')
R('<b>Villanueva Supply</b><small>Potrero · Deliver</small>', '<b>Corazon Welding</b><small>Cainta · Deliver</small>')
R('<b>Ramos Hardware</b><small>Monumento · Collect</small></div><em class="due">₱3,120</em>', '<b>JV Hardware</b><small>Marikina · Collect</small></div><em class="due">₱7,620</em>')
R('<strong>Collected ₱4,750</strong><small>Boy Hardware · Mang Ramon</small>', '<strong>Collected ₱18,200</strong><small>Bayview · Mark Santos</small>')

# ---- your own store: the demo shop's store, with checkout and delivery fees ----
R('One link with your items, prices and sale prices. Buyers order without messaging you.', 'One link with your items, photos and prices. Buyers order and pay without messaging you.')
R('<li>Ready-made posts for your Page</li><li>Link in your Messenger auto-reply</li><li>Orders land straight in your list</li>',
  '<li>Buyers pay by GCash, Maya or cash on delivery</li><li>Your delivery fee, set per barangay</li><li>One-tap Facebook posts and a Monday price list picture</li>')
R('<span class="mk-av g">MS</span><div><b>Metro Steel Co. ', '<span class="mk-av g">DC</span><div><b>Dela Cruz Hardware ')
R('<small>Construction supplies · Valenzuela</small>', '<small>Hardware &amp; construction · Marikina</small>')
R(' Next-day</span><span> COD</span>', ' Delivery by barangay</span><span> GCash · Maya · COD</span>')
R('<b>Portland Cement 40kg</b><small><s>₱245</s> <b class="mk-red">₱235</b> /bag · sale</small>', '<b>Portland Cement 40kg</b><small><s>₱240</s> <b class="mk-red">₱228</b> /bag · sale</small>')
R('<b>Rebar 10mm</b><small>₱180 /pc</small>', '<b>Steel Rebar 12mm</b><small>₱65 /pc</small>')
R('<b>GI Wire #16</b><small>₱95 /roll</small>', '<b>Galvanized Wire 12ga</b><small>₱850 /roll</small>')
R(' 2 items · ₱6,500 <b>Order now →</b>', ' 2 items · ₱5,210 <b>Checkout →</b>')
R('<strong>New store order</strong><small>Aling Nena · ₱6,500</small>', '<strong>New store order · GCash</strong><small>Corazon Welding · ₱5,290</small>')

# ---- buying from suppliers ----
R('<span class="mk-av">BH</span><div><b>Boy Hardware</b><small>Viber</small>', '<span class="mk-av">MS</span><div><b>Metro Steel Co.</b><small>Viber</small>')
S['text'] = re.sub(r'(<svg[^>]*>(?:(?!</svg>).)*</svg>) Dela Cruz says they paid</b>', r'\1 Riverside says they paid</b>', S['text'], flags=re.S)

# ---- staff spending (Business) ----
R('<span class="m2-badge pro">PRO</span><h3>Know when staff overpay</h3>', '<span class="m2-badge pro">BUSINESS</span><h3>Know when staff overpay</h3>')
R('<span class="m2-badge pro">PRO</span><h3>A report card for every supplier</h3>', '<span class="m2-badge pro">BUSINESS</span><h3>A report card for every supplier</h3>')
R('<b>Cement ordered above your agreed price</b><small>₱265 vs agreed ₱245 · 100 bags · by Staff Joy</small>', '<b>Rebar ordered above your agreed price</b><small>₱52 vs agreed ₱48 · 500 pcs · by Ana Reyes</small>')
R(" Joy's monthly cap</b>", " Ana's monthly cap</b>")
R('Rebar 10mm: you ₱178 · others ₱180–₱192', 'Rebar 12mm: you ₱48 · others ₱49–₱53')

# ---- checks (kept consistent with the demo's customers) ----
R('<b>Dela Cruz Hardware</b><b>₱18,200</b>', '<b>Riverside Builders Corp</b><b>₱18,200</b>')
R('<small>Dela Cruz Hardware · ₱18,200</small>', '<small>Riverside Builders · ₱18,200</small>')

# ---- books (r20.js builds this panel) ----
R('<small>₱450 short · counted by Joy</small>', '<small>₱450 short · counted by Ana</small>')
R('<b>August books</b><small>closed · sent to accountant</small>', '<b>October summary</b><small>ready for your bookkeeper</small>')

# ---- pricing page: the compare table agrees with the plan cards ----
t = S['text']; i = t.index('<div id="view-pricing"'); j = t.index('<div id="view-privacy"', i); pr = t[i:j]
NO, YES = '<td><span class="mk-n">—</span></td>', '<td><span class="mk-y">✓</span></td>'
for row in ['Routes for drivers and collectors', 'Alerts when staff overpay', 'Spending limits', 'Supplier report card', 'Price check vs other buyers', 'Credit limits per buyer']:
    old = f'<tr><td>{row}</td>{NO}{YES}{YES}</tr>'
    if old not in pr: raise SystemExit('R51 compare row not found: ' + row)
    pr = pr.replace(old, f'<tr><td>{row}</td>{NO}{NO}{YES}</tr>')
old = f'<tr><td>Payment reminders sent for you</td>{NO}{YES}{YES}</tr>'
if old not in pr: raise SystemExit('R51 compare row not found: reminders')
pr = pr.replace(old, f'<tr><td>Payment reminders sent for you</td>{YES}{YES}{YES}</tr>')
S['text'] = t[:i] + pr + t[j:]
