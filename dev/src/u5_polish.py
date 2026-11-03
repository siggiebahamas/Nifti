# U5: wording on shared panels for one business
from patchlib import P
P("""  return `<section class="lg-panel lg-money"><div class="lg-ph"><b>${role === 'supplier' ? 'Receivables' : 'Payables'}</b>${link}</div>""",
  """  return `<section class="lg-panel lg-money"><div class="lg-ph"><b>${role === 'supplier' ? 'Owed to you' : 'You owe'}</b>${link}</div>""")
P("""      <div class="lg-ag-tot"><span>${total >= 1 ? `Outstanding across ${parties} ${role === 'supplier' ? (parties === 1 ? 'buyer' : 'buyers') : (parties === 1 ? 'supplier' : 'suppliers')}` : 'Nothing outstanding'}</span>""",
  """      <div class="lg-ag-tot"><span>${total >= 1 ? `Unpaid by ${parties} ${role === 'supplier' ? (parties === 1 ? 'customer' : 'customers') : (parties === 1 ? 'supplier' : 'suppliers')}` : 'Nothing unpaid'}</span>""")
P("""  const link = role === 'supplier' ? `<a class="lg-link" onclick="navigate('collections')">Collections</a>` : `<a class="lg-link" onclick="hmScrollTo('billsToPayPanel')">Bills</a>`;""",
  """  const link = role === 'supplier' ? `<a class="lg-link" onclick="pickLens('collections','supplier')">Who owes you</a>` : `<a class="lg-link" onclick="pickLens('collections','buyer')">Bills</a>`;""")

# counter sales are part of every business now: no on/off switch
P("let downstreamSalesEnabled = false;", "let downstreamSalesEnabled = true; // counter sales are always on for one business")
P("  downstreamSalesEnabled = (s.downstreamSalesEnabled !== undefined) ? s.downstreamSalesEnabled : downstreamSalesEnabled;\n",
  "  downstreamSalesEnabled = true;\n")
P("""  if(currentAppRole !== 'buyer'){ el.innerHTML = ''; return; } // a supplier has no downstream customers of its own here
  el.innerHTML = `""", """  el.innerHTML = ''; return; // counter sales are always on (Sales page)
  el.innerHTML = `""")
# our own late deliveries are about us, not a supplier
P("""    const supplier = getSupplierRecordById(supplierId);
    insights.push(createInsight({
      type: INSIGHT_TYPES.SUPPLIER_DELAY, severity: lateRate>=0.5?'High':'Medium',
      headline: `${supplier?supplier.name:supplierId} has been late on ${lateCount} of their last ${pos.length} deliveries`,""",
"""    const supplier = getSupplierRecordById(supplierId);
    if(supplierId === ME_SUPPLIER){
      insights.push(createInsight({
        type: INSIGHT_TYPES.SUPPLIER_DELAY, severity: lateRate>=0.5?'High':'Medium',
        headline: `You were late on ${lateCount} of your last ${pos.length} deliveries to customers`,
        explanation: `${Math.round(lateRate*100)}% of your recent deliveries arrived after the date the customer asked for.`,
        quantifiedImpact: {status:'ok', value: Math.round(lateRate*100), unit:'% late rate'},
        recommendation: `Promise a later date when stock or trucks are tight, and check what slowed these down.`,
        confidence: pos.length>=4 ? CONFIDENCE.HIGH : CONFIDENCE.NEEDS_REVIEW,
        sourceRefs: pos.map(po=>po.poNumber), entityType:'supplier', entityId:supplierId,
      }));
      return;
    }
    insights.push(createInsight({
      type: INSIGHT_TYPES.SUPPLIER_DELAY, severity: lateRate>=0.5?'High':'Medium',
      headline: `${supplier?supplier.name:supplierId} has been late on ${lateCount} of their last ${pos.length} deliveries`,""")

# one business: these labels no longer flip with the lens
P("""  if(suppliersPageSub) suppliersPageSub.textContent = role==='buyer'
    ? '8 connected · private to you, never shown to anyone else'
    : '6 connected · private to you, never shown to anyone else';""",
"""  if(suppliersPageSub) suppliersPageSub.textContent = ((role==='buyer' ? suppliersData : buyersData) || []).length + ' connected · private to you, never shown to anyone else';""")
P("""  if(msgSub) msgSub.textContent = role==='buyer'
    ? 'Every supplier conversation, organized by relationship — nothing lost in a Viber thread ever again.'
    : 'Every buyer conversation, organized by relationship — nothing lost in a Viber thread ever again.';
  if(msgSearch) msgSearch.placeholder = role==='buyer' ? 'Search suppliers…' : 'Search buyers…';""",
"""  if(msgSub) msgSub.textContent = 'Every customer and supplier chat in one place, kept for good.';
  if(msgSearch) msgSearch.placeholder = 'Search chats…';""")
P("""  if(settingsProfileSub) settingsProfileSub.textContent = role==='buyer'
    ? 'Shown to suppliers you invite or connect with.'
    : 'Shown to buyers you invite or connect with.';""",
"""  if(settingsProfileSub) settingsProfileSub.textContent = 'Shown to the customers and suppliers you connect with.';""")
P("""<div class="sub" id="settingsProfileSub">Shown to suppliers you invite or connect with.</div>""",
  """<div class="sub" id="settingsProfileSub">Shown to the customers and suppliers you connect with.</div>""")
P("""onclick="openAnnouncementComposer()">📢 Announce to All Buyers</span>""", """onclick="openAnnouncementComposer()">📢 Announce to all customers</span>""")
P("""  if(btn) btn.classList.toggle('hidden', currentAppRole !== 'supplier');
}
function openAnnouncementComposer(){""", """  if(btn) btn.classList.toggle('hidden', !(buyersData || []).length);
}
function openAnnouncementComposer(){""")
P("""      <h2 style="font-family:var(--font-h);font-size:19px;font-weight:800;">📢 Announce to All Buyers</h2>""",
  """      <h2 style="font-family:var(--font-h);font-size:19px;font-weight:800;">📢 Announce to all customers</h2>""")

# "See who owes you" after opening balances: the Who owes you page (the old dashboard panel is gone)
P("""onclick="slClose('obModal'); navigate('dashboard'); setTimeout(() => hmScrollTo('whoOwesMePanel'), 200)">See who owes you</button>""",
  """onclick="slClose('obModal'); pickLens('collections','supplier')">See who owes you</button>""")
