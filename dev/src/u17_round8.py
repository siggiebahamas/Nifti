# Round 8: both sides of the business on one page, a one-screen order sheet, take-a-photo,
# centered tables, plain statuses with named parties, and less clutter.
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()

# --- statuses: no leading symbols, and always say who we are waiting for ---
P("""  const icon = o.status==='draft' ? '✎' : cls==='pill-lowstock' ? '●' : cls==='pill-ok' ? '✓' : '…';
  return `<span class="status-pill ${cls}">${icon} ${getBuyerNextAction(o)}</span>`;""",
  """  return `<span class="status-pill ${cls}">${getBuyerNextAction(o)}</span>`;""")
P("""  const icon = cls==='pill-lowstock' ? '●' : cls==='pill-ok' ? '✓' : '…';
  return `<span class="status-pill ${cls}">${icon} ${getSupplierNextAction(o)}</span>`;""",
  """  return `<span class="status-pill ${cls}">${getSupplierNextAction(o)}</span>`;""")
P("""<span class="status-pill pill-cancelled">✕ Cancelled</span>""", """<span class="status-pill pill-cancelled">Cancelled</span>""", 2)
for a, b in [
  ("return 'Awaiting supplier reply to your amendment';", "return \"Waiting for supplier's reply to your change\";"),
  ("return 'Awaiting supplier on your return/dispute';", "return \"Waiting for supplier to settle your return\";"),
  ("'Waiting on supplier to confirm your deposit' : 'Pay the deposit';", "\"Waiting for supplier to confirm your deposit\" : 'Pay the deposit';"),
  ("return 'Waiting on supplier to confirm your payment';", "return \"Waiting for supplier to confirm your payment\";"),
  ("    case 'draft': return 'Send this PO';", "    case 'draft': return 'Send this order to the supplier';"),
  ("    case 'sent': return 'Waiting on supplier to confirm';", "    case 'sent': return \"Waiting for supplier's confirmation\";"),
  ("    case 'countered': return 'Review counter-offer';", "    case 'countered': return \"Answer the supplier's new price\";"),
  ("    case 'quote': return 'Confirm this order';", "    case 'quote': return \"Confirm the supplier's quote\";"),
  ("    case 'preparing': return 'Waiting on supplier to ship';", "    case 'preparing': return 'Waiting for supplier to ship';"),
  ("    case 'in_customs': return o.deliveryConfirmation ? 'Nothing to do' : 'Confirm delivery when it arrives';", "    case 'in_customs': return o.deliveryConfirmation ? 'Done' : 'Confirm what arrived';"),
  ("""    case 'delivered': return 'Nothing to do';
    case 'partially_delivered': return 'Nothing to do';
    case 'invoiced': return (o.invoice && o.invoice.status!=='paid') ? 'Pay invoice' : 'Nothing to do';
    case 'paid': return 'Nothing to do';
    case 'cancelled': return 'Nothing to do';""",
   """    case 'delivered': return "Waiting for supplier's bill";
    case 'partially_delivered': return "Waiting for supplier's bill";
    case 'invoiced': return (o.invoice && o.invoice.status!=='paid') ? "Pay the supplier's bill" : 'Done, paid';
    case 'paid': return 'Done, paid';
    case 'cancelled': return 'Cancelled';"""),
  ("""  if(pendingAmendment(o)) return "Respond to buyer's amendment request";
  if(o.rma && o.rma.status==='open') return "Resolve buyer's return/dispute";
  if(poHasPaymentsAwaitingSupplier(o)) return "Confirm the buyer's payment";""",
   """  if(pendingAmendment(o)) return "Answer the customer's change request";
  if(o.rma && o.rma.status==='open') return "Settle the customer's return";
  if(poHasPaymentsAwaitingSupplier(o)) return "Confirm the customer's payment";"""),
  ("""    case 'sent': return 'Confirm or counter this PO';
    case 'countered': return 'Waiting on buyer';
    case 'quote': return 'Waiting for their OK';
    case 'confirmed': return 'Start preparing order';
    case 'preparing': return 'Mark as shipped when ready';
    case 'shipped':
    case 'in_customs': return 'Nothing to do';
    case 'delivered': return 'Send invoice';
    case 'partially_delivered': return 'Resolve the shortfall, then send invoice';
    case 'invoiced': return (o.invoice && o.invoice.status!=='paid') ? 'Waiting on payment' : 'Nothing to do';
    case 'paid': return 'Nothing to do';
    case 'cancelled': return 'Nothing to do';""",
   """    case 'sent': return 'Confirm this order';
    case 'countered': return "Waiting for customer's reply to your price";
    case 'quote': return "Waiting for customer's confirmation";
    case 'confirmed': return 'Start preparing';
    case 'preparing': return 'Mark as shipped';
    case 'shipped':
    case 'in_customs': return 'On the way to the customer';
    case 'delivered': return 'Send the bill';
    case 'partially_delivered': return 'Settle the short delivery, then bill';
    case 'invoiced': return (o.invoice && o.invoice.status!=='paid') ? "Waiting for customer's payment" : 'Done, paid';
    case 'paid': return 'Done, paid';
    case 'cancelled': return 'Cancelled';"""),
]:
    P(a, b)
P("<small>Waiting for their OK</small>", "<small>Waiting for customer's OK</small>")

# --- To check and What changed: no "Why it matters" line ---
S['text'] = S['text'].replace('<span>Why it matters</span><p>${escapeHtml(c.why)}</p>', '').replace('<span>Why it matters</span><p>${escapeHtml(i.why)}</p>', '')

# --- Who owes you: the bank statement matcher goes (nobody uses it) ---
t = S['text']; a = t.index('    <div class="sl-card"><div class="sl-card-h"><b>🏦 Match your bank or GCash statement</b></div>'); b = t.index('    <div class="sl-card"><div class="sl-card-h"><b>🧾 Every payment, last 30 days</b></div>', a)
S['text'] = t[:a] + t[b:]

# --- Month-end close: removed from the menu (safeguards already live on each page) ---
S['text'] = re.sub(r'\s*<div class="nav-item" data-page="close" onclick="go\(\'close\'\)"[^\n]*</div>', '', S['text'], count=1)
S['text'] = re.sub(r'\s*<button class="more-sheet-item" data-page="close"[^\n]*</button>', '', S['text'], count=1)

P("function renderSidebarForViewAsRole(){", rd('r8_photos.js') + "\n" + rd('r8.js') + "\n" + rd('r8b.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 8 css begin ===== */\n' + rd('r8.css') + '\n/* ===== Round 8 css end ===== */\n' + t[i:]
# no "complete your profile" pop-up after confirming an order
P("function showCompleteProfileBanner(){\n  if(document.getElementById('completeProfileBanner')) return;", "function showCompleteProfileBanner(){\n  return; // removed: an extra pop-up after every first confirm\n  if(document.getElementById('completeProfileBanner')) return;")
P("<div><h1>Money overview</h1><p>Your profit, where the money went, and the five things to check every day.</p></div>", "<div><h1>Money overview</h1><p>Your profit, where the money went, and who owes who.</p></div>")
