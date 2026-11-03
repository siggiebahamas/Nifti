# U4: the bookkeeping pages, stock labels on every stock change, and the new JS/CSS modules.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()

# ---- pages
P("""      <div id="page-admin" class="app-page">""",
"""      <div id="page-money" class="app-page">
        <div class="page-head bk-head"><div><h1>Money overview</h1><p>Your profit, where the money went, and the five things to check every day.</p></div></div>
        <div id="bkMoneyBody"></div>
      </div>
      <div id="page-expenses" class="app-page">
        <div class="page-head bk-head"><div><h1>Expenses</h1><p>Bills, rent, salaries, gas: snap the receipt and it's recorded, with who paid it.</p></div><div class="bk-head-act"><button class="btn btn-primary" onclick="openExpenseForm()">+ Add expense</button></div></div>
        <div id="bkExpBody"></div>
      </div>
      <div id="page-cashcount" class="app-page">
        <div class="page-head bk-head"><div><h1>Cash count</h1><p>Count the drawer at closing. Nifti already knows what should be there.</p></div></div>
        <div id="bkCashBody"></div>
      </div>
      <div id="page-profit" class="app-page">
        <div class="page-head bk-head"><div><h1>Profit &amp; prices</h1><p>What each item costs you, what you sell it for, and every sale below cost.</p></div></div>
        <div id="bkProfitBody"></div>
      </div>

      <div id="page-admin" class="app-page">""")

# ---- every stock change says why (the server writes the history line for real accounts)
P("""  item.onHand = newQty;
  if(item.onHand <= item.rop) item.status = 'critical';
  else if(item.onHand <= item.rop*1.5) item.status = 'warning';
  else item.status = 'healthy';
  logAudit('manual_override', 'inventoryItem', code, 'onHand', before, newQty, note ? reasonDef.label+' — '+note : reasonDef.label);""",
"""  item.onHand = newQty;
  if(typeof stockLabel === 'function') stockLabel(item, {kind: {damage: 'bad', shrinkage: 'count', found: 'count', count_correction: 'count'}[reasonCode] || 'adjust', reason: reasonDef.label + (note ? ' — ' + note : ''), qty: delta});
  if(item.onHand <= item.rop) item.status = 'critical';
  else if(item.onHand <= item.rop*1.5) item.status = 'warning';
  else item.status = 'healthy';
  logAudit('manual_override', 'inventoryItem', code, 'onHand', before, newQty, note ? reasonDef.label+' — '+note : reasonDef.label);""")
P("""  if(remaining>0) showToast('Only had '+(qty-remaining)+' in stock — recorded that much, the rest wasn\\'t available.', 'warn');
  syncBatchTotals(item);""",
"""  if(remaining>0) showToast('Only had '+(qty-remaining)+' in stock — recorded that much, the rest wasn\\'t available.', 'warn');
  if(typeof stockLabel === 'function') stockLabel(item, {kind: 'used', reason: 'Taken out of stock', qty: -(qty - remaining)});
  syncBatchTotals(item);""")
P("""  item.batches.push({lot, exp, qty});
  syncBatchTotals(item);""",
"""  item.batches.push({lot, exp, qty});
  if(typeof stockLabel === 'function') stockLabel(item, {kind: 'received', reason: 'Received new stock (lot ' + lot + ')', qty});
  syncBatchTotals(item);""")

# ---- modules
helpers = """
function toggleNavGroup(g){
  const el = document.querySelector('.nav-group[data-grp="' + g + '"]'); if(!el) return;
  el.classList.toggle('folded');
  try{ localStorage.setItem('nifti-nav-fold-' + g, el.classList.contains('folded') ? '1' : '0'); }catch(e){}
}
if(typeof setLanguage !== 'function') window.setLanguage = function(l){ if(l !== currentLanguage) toggleLanguage(); };
(function(){
  const init = () => { document.querySelectorAll('.nav-group[data-grp]').forEach(el => { let v = null; try{ v = localStorage.getItem('nifti-nav-fold-' + el.getAttribute('data-grp')); }catch(e){} if(v === '1' || (v === null && el.classList.contains('nav-more'))) el.classList.add('folded'); }); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else setTimeout(init, 0);
})();
"""
P("function renderSidebarForViewAsRole(){", rd('one.js') + helpers + rd('books_core.js') + rd('books_pages.js') + rd('books_more.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; anchor = '  .settings-card:empty{display:none;}'
i = t.rindex(anchor)
S['text'] = t[:i] + rd('one.css') + rd('books.css') + t[i:]
