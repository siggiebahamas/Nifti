# U8: one business, one Pro plan (pricing page, plan settings, admin)
import re
from patchlib import P, S
# ---- pricing page: no "which one are you?", one Pro card
P("""    <h2>First, which one are you?</h2>
    <div class="p2-who">""", """    <div class="p2-who hidden">""")
t = S['text']
a = t.index('    <div class="p2-set" data-for="buy">'); b = t.index('    <div class="p2-biz">', a)
S['text'] = t[:a] + t[b:]
P("""      <div class="p2-plan-h"><b>Supplier Pro</b><span><s>₱990</s> ₱0 <em>/month for now</em></span></div>
      <p>Get paid faster and deliver smarter. Everything in Free, plus:</p>""",
  """      <div class="p2-plan-h"><b>Pro</b><span><s>₱990</s> ₱0 <em>/month for now</em></span></div>
      <p>Get paid faster, stop leaks, and keep clean books. Everything in Free, plus:</p>""")
P("""      <ul class="p2-more"><li>Customers due to reorder, reminded for you</li><li>Statements of account</li><li>Credit limits per buyer</li><li>Returns, credits and BIR 2307</li><li>Up to 15 teammates</li></ul>""",
  """      <ul class="p2-more"><li>Profit, daily cash count and red flags</li><li>Alerts when staff overpay or skip approval</li><li>Customers due to reorder, reminded for you</li><li>Statements of account and credit limits</li><li>Returns, credits and BIR 2307</li><li>Up to 15 teammates</li></ul>""")
P("""Everything in Pro for your side, plus up to 50 teammates""", """Everything in Pro, plus up to 50 teammates""")
P("""<th>Pro<br><small>for your side</small></th>""", """<th>Pro</th>""")
S['text'] = S['text'].replace('<td>Supplier Pro</td>', '<td><span class="mk-y">✓</span></td>').replace('<td>Buyer Pro</td>', '<td><span class="mk-y">✓</span></td>')
P("""<tr><td>Teammates</td><td>3</td><td>15</td><td>50</td></tr>""",
  """<tr><td>Sales, expenses and stock history</td><td><span class="mk-y">✓</span></td><td><span class="mk-y">✓</span></td><td><span class="mk-y">✓</span></td></tr><tr><td>Profit, cash count and red flags</td><td><span class="mk-n">—</span></td><td><span class="mk-y">✓</span></td><td><span class="mk-y">✓</span></td></tr><tr><td>Teammates</td><td>3</td><td>15</td><td>50</td></tr>""")
P("""<div class="q">Do I pay for both Supplier Pro and Buyer Pro?</div><div class="a">No. You only get the one for your side: seller or buyer.</div>""",
  """<div class="q">I buy and I sell. Do I need two plans?</div><div class="a">No. One Pro plan covers buying, selling and your books.</div>""")
P("""function mkSide(side){
  const v""", """function mkSide(side){
  side = 'sell'; // one plan for every business now
  const v""")
# ---- in the app: one Pro plan
P("""  supplier_pro: {name: 'Supplier Pro', forType: 'supplier', tagline: 'Get paid faster and sell more.',
    features: [""", """  pro: {name: 'Pro', forType: 'any', tagline: 'Get paid faster, stop leaks, and keep clean books.',
    features: ['Profit, daily cash count and red flags, for the owner only', "Owner's watchdog: alerts when staff overpay or skip approval", 'Spending caps you set per business, teammate or supplier', 'Supplier scorecard: late, short, returns, price hikes', 'Market price check vs other Nifti buyers', """)
t = S['text']
a = t.index("  buyer_pro: {name: 'Buyer Pro', forType: 'buyer'"); b = t.index("  business: {name: 'Business'", a)
S['text'] = t[:a] + t[b:]
P("""'BIR 2307 tracker and monthly sales book (VAT)', 'Who pays late""", """'BIR 2307 tracker and sales & purchase books (VAT)', 'Who pays late""")
P("""tagline: 'For bigger teams and multi-branch businesses. Everything in Pro for your side, plus:',""", """tagline: 'For bigger teams and multi-branch businesses. Everything in Pro, plus:',""")
P("""function proPlanFor(){ return currentAppRole === 'supplier' ? 'supplier_pro' : 'buyer_pro'; }""",
  """PRO_PLANS.supplier_pro = PRO_PLANS.buyer_pro = PRO_PLANS.pro; // older records still read as Pro
function proPlanFor(){ return 'pro'; }""")
P("""  const onPaid = ['supplier_pro', 'buyer_pro', 'business'].includes(info.plan);""", """  const onPaid = ['pro', 'supplier_pro', 'buyer_pro', 'business'].includes(info.plan);""")
P("""<option value="supplier_pro">Supplier Pro (1 month)</option><option value="buyer_pro">Buyer Pro (1 month)</option>""", """<option value="pro">Pro (1 month)</option>""")
P("""${['free', 'supplier_pro', 'buyer_pro', 'business'].map(p =>""", """${['free', 'pro', 'business'].map(p =>""")
P("""  {id:'supplier_pro', name:'Supplier Pro', priceMonthly:990, tagline:'Get paid faster and sell more.',""", """  {id:'pro', name:'Pro', priceMonthly:990, tagline:'Get paid faster, stop leaks, and keep clean books.',""")
P("""Run limited-time sale prices with Supplier Pro.""", """Run limited-time sale prices with Pro.""")
P("""   Supplier Pro / Buyer Pro (₱990/month or ₱9,900/year): the money and control tools, 15 teammates.""",
  """   Pro (₱990/month or ₱9,900/year): the money, control and bookkeeping tools, 15 teammates.""")
# ---- sign-up: what kind of business, not buyer vs supplier
P("""        <div class="role-chip active" onclick="pickRole(this, 'buyer')">I'm a Buyer</div>
        <div class="role-chip" onclick="pickRole(this, 'supplier')">I'm a Supplier</div>""",
  """        <div class="kind-label">What kind of business?</div>
        <div class="role-chip active" onclick="pickKind(this, 'store')">Store</div>
        <div class="role-chip" onclick="pickKind(this, 'restaurant')">Restaurant / food</div>
        <div class="role-chip" onclick="pickKind(this, 'distributor')">Distributor</div>
        <div class="role-chip" onclick="pickKind(this, 'other')">Other</div>""")
P("""  const chip = document.querySelectorAll('#signupView .role-chip')[claimRole === 'buyer' ? 0 : 1];
  if(chip) pickRole(chip, claimRole);""",
  """  document.getElementById('buyerSignupFields').classList.toggle('hidden', claimRole !== 'buyer');
  document.getElementById('supplierSignupFields').classList.toggle('hidden', claimRole === 'buyer');""")
P("""function pickRole(el, role){""", """let signupKind = 'store';
function pickKind(el, kind){
  signupKind = kind;
  el.parentElement.querySelectorAll('.role-chip').forEach(c => c.classList.toggle('active', c === el));
}
function pickRole(el, role){""")
P("""  const claimCode = businessType === 'supplier' ? getPendingClaimCode() : null;""", """  const claimCode = getPendingClaimCode();""")
P("""    options: { data: Object.assign({ business_name: bizName, business_type: businessType, full_name: bizName }, claimCode ? { claim_code: claimCode } : {}) }""",
  """    options: { data: Object.assign({ business_name: bizName, business_type: businessType, business_kind: signupKind, full_name: bizName }, claimCode ? { claim_code: claimCode } : {}) }""")
P("""  .role-chip{flex:1;""", """  .role-pick{flex-wrap:wrap;} .kind-label{flex:0 0 100%;font-size:14.5px;font-weight:700;margin-bottom:-2px;}
  .role-chip{flex:1 1 40%;""")
P("""<p class="form-sub">Tell us which side of the trade you're on.</p>""", """<p class="form-sub">Free to start. Your sales, orders and books in one place.</p>""")
