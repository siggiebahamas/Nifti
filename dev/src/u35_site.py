# Round 26 marketing pages: the Free / Pro / Business plans on the landing page and the Pricing page.
# (exec'd from u35_round26.py, so P, S, rd are already defined)
CHK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
PLANS = [
  ('free', 'Free', '₱0', 'forever', '', 'A small shop running day to day.',
   ['Orders with customers and suppliers', 'Messages, stock, shop sales, expenses', 'Who owes you, with reminders you send yourself', 'Online store and Facebook posts', 'Telegram alerts', '10 notebook pages a month', 'Up to 3 people', 'Download everything any time'],
   'Start free', "navigate('login'); try{ nf20ToSignup(); }catch(e){}", 'outline'),
  ('pro', 'Pro', '₱990', '/ month', 'or ₱9,900 a year (2 months free)', 'Owner-run shops that want Nifti to chase money and keep the books.',
   ['Everything in Free', 'Payment reminders sent for you, and statements', 'Books, profit and summaries for your bookkeeper', 'Payroll and check tracking', 'Credits and returns that take themselves off', 'Price announcements to all customers', 'Store results, promos, reorder reminders', '300 notebook pages a month', 'Up to 8 people'],
   'Start with Pro', "navigate('login'); try{ nf20ToSignup(); }catch(e){} try{ localStorage.setItem('nifti-want-plan','pro'); }catch(e){}", 'primary'),
  ('business', 'Business', '₱2,990', '/ month', 'or ₱29,900 a year', 'Distributors with drivers, branches and staff who order and collect.',
   ['Everything in Pro', 'Delivery routes and driver lists', 'Branches: each with its own drawer and stock', 'Spending caps and alerts when staff overpay', 'Credit limits and a who-pays-late list', 'Supplier report card and price checks', 'Done-for-you setup, verified badge, priority help', '1,500 notebook pages a month', 'Up to 50 people'],
   'Start with Business', "navigate('login'); try{ nf20ToSignup(); }catch(e){} try{ localStorage.setItem('nifti-want-plan','business'); }catch(e){}", 'outline'),
]
def card(p, short=False):
    k, name, price, per, alt, who, feats, btn, act, kind = p
    fl = feats[:5] if short else feats
    more = f'<li class="more"><a onclick="navigate(\'pricing\')">See everything in {name} →</a></li>' if short and len(feats) > 5 else ''
    return (f'<div class="nf26-pl {k}">' + ('<span class="nf26-pl-flag">MOST SHOPS</span>' if k == 'pro' else '') +
            f'<h3>{name}</h3><div class="nf26-pl-p"><b>{price}</b><span>{per}</span></div>' + (f'<small class="nf26-pl-alt">{alt}</small>' if alt else '<small class="nf26-pl-alt">&nbsp;</small>') +
            f'<p class="nf26-pl-who">{who}</p><ul>' + ''.join(f'<li>{CHK}<span>{f}</span></li>' for f in fl) + more + '</ul>' +
            f'<button type="button" class="plan-btn {kind}" onclick="{act}">{btn}</button></div>')
HOW = ('<div class="nf26-pay"><b>How paying works</b><ol><li><span>1</span>Pick a plan in Nifti and send the amount by GCash, Maya or bank transfer.</li>'
       '<li><span>2</span>Type the reference number, or snap the receipt.</li><li><span>3</span>We switch your plan on, usually within a few hours. No contract, stop any time.</li></ol></div>')

# landing: the plans, right on the first page
t = S['text']; i = t.index('<section class="f4-free" id="mkFree">'); j = t.index('</section>', i) + len('</section>')
S['text'] = t[:i] + ('<section class="nf26-plans-sec" id="mkPlans"><div class="wrap">'
  '<div class="f5-head"><div class="p2-burst">SIMPLE PRICES</div><h2>Start free. <span>Upgrade when it pays for itself.</span></h2><p>No card needed to start. One plan covers buying, selling and your books.</p></div>'
  '<div class="nf26-pls">' + ''.join(card(p, True) for p in PLANS) + '</div>' + HOW +
  '<p class="nf26-pl-all"><a onclick="navigate(\'pricing\')">Compare every feature →</a></p></div></section>') + t[j:]

# pricing page: hero, the three plans, and how paying works
P('''    <div class="p2-burst"> PILOT</div>
    <h1>Right now, <span>everything is free.</span></h1>
    <p>Orders and chat: free forever. Pro: free while we're in the pilot.</p>
    <div class="p2-tag"><s>₱990/month</s><b>₱0</b></div>''',
'''    <div class="p2-burst">PRICING</div>
    <h1>Simple prices. <span>Start free.</span></h1>
    <p>Free runs a small shop every day. Pro chases payments and keeps your books. Business runs deliveries, branches and a team you need to keep an eye on.</p>''')
t = S['text']; i = t.index('<div class="p2-plans">'); j = t.index('<div class="f6-roi">', i)
S['text'] = t[:i] + '<div class="nf26-pls">' + ''.join(card(p) for p in PLANS) + '</div>' + HOW + '\n  ' + t[j:]
t = S['text']; i = t.index('<div class="p2-biz">'); j = t.index('</section>', i)
S['text'] = t[:i] + '</div>\n' + t[j:]
P('<div class="faq-item"><div class="q">I buy and I sell. Do I need two plans?</div><div class="a">No. One Pro plan covers buying, selling and your books.</div></div>',
  '<div class="faq-item"><div class="q">I buy and I sell. Do I need two plans?</div><div class="a">No. One plan covers buying, selling and your books.</div></div>'
  '<div class="faq-item"><div class="q">How do I pay?</div><div class="a">By GCash, Maya or bank transfer. Pick a plan in Nifti, send the amount, and type the reference number. We switch you on within a few hours.</div></div>'
  '<div class="faq-item"><div class="q">What happens if I stop paying?</div><div class="a">You go back to Free. Your records stay, and you can download everything any time.</div></div>')
# compare table: the newer features
P('<tr><td>Teammates</td>', '<tr><td>Telegram alerts</td><td><span class="mk-y">✓</span></td><td><span class="mk-y">✓</span></td><td><span class="mk-y">✓</span></td></tr>'
  '<tr><td>Payroll</td><td>—</td><td><span class="mk-y">✓</span></td><td><span class="mk-y">✓</span></td></tr>'
  '<tr><td>Books and summaries for your bookkeeper</td><td>—</td><td><span class="mk-y">✓</span></td><td><span class="mk-y">✓</span></td></tr>'
  '<tr><td>Done-for-you setup</td><td>—</td><td>—</td><td><span class="mk-y">✓</span></td></tr>'
  '<tr><td>Notebook pages read a month</td><td>10</td><td>300</td><td>1,500</td></tr><tr><td>Teammates</td>')

# compare table: what moved from Pro to Business
Y = '<td><span class="mk-y">✓</span></td>'
for row in ['Routes for drivers and collectors', 'Credit limits per buyer', 'Alerts when staff overpay', 'Spending limits', 'Supplier report card', 'Price check vs other buyers']:
    a = '<tr><td>' + row + '</td><td>—</td>' + Y + Y + '</tr>'
    if S['text'].count(a) == 1: S['text'] = S['text'].replace(a, '<tr><td>' + row + '</td><td>—</td><td>—</td>' + Y + '</tr>')
    else: print('  (compare row not found)', row)
S['text'] = S['text'].replace('<tr><td>Teammates</td><td>3</td><td>15</td><td>50</td></tr>', '<tr><td>Teammates</td><td>3</td><td>8</td><td>50</td></tr>')
