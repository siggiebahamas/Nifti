# U10: the website home page tells one story (selling, the books, buying) instead of "which one are you?"
from patchlib import P, S
P("""<div class="f4-pickh">First, which one are you?</div>""", """<div class="f4-pickh">One app for selling, buying and your books.</div>""")
t = S['text']
i = t.index('<div class="f4-set" data-for="buy" id="mkBuy">')
books = ('<div class="f4-set" data-for="buy" id="mkBuy"><div class="f5-head mk-books"><div class="p2-burst">YOUR BOOKS</div><h2>And the books <span>keep themselves.</span></h2>'
  '<p>Every sale, expense and payment lands in proper books, so you always know your profit, your cash, and what to check.</p></div>'
  '<div class="h4-flow c3 mk-books-flow">'
  '<div class="h4-step"><div class="h4-meta"><span class="h4-n">1</span><em>Staff</em></div><h4>Record it as it happens</h4><p>Counter sales, expenses with a receipt photo, and a cash count at closing. Works without signal.</p></div>'
  '<div class="h4-step"><div class="h4-meta"><span class="h4-n">2</span><em>Nifti</em></div><h4>Checks what doesn\'t add up</h4><p>Cash short, missing stock, missing receipts, sales below cost, bills not sent. Each one says why.</p></div>'
  '<div class="h4-step"><div class="h4-meta"><span class="h4-n">3</span><em>You</em></div><h4>See the real profit</h4><p>Profit and loss, balance sheet and cash outlook, every number traceable. Close the month and hand it to your accountant.</p></div>'
  '</div>')
t = t[:i] + books + t[i + len('<div class="f4-set" data-for="buy" id="mkBuy">'):]
j = t.index('<h2>From order to paid, <span>without the chasing.</span></h2>', i + len(books))
j0 = t.rfind('<div class="f5-head">', 0, j)
# the buy story's own "how it works" repeats the one above: start it at "what you get" instead
k = t.index('<div class="f5-head"><div class="p2-burst">WHAT YOU GET</div><h2>Everything between the order <span>and the payment.</span></h2></div>', j)
t = t[:j0] + t[k:]
t = t.replace('<div class="f5-head"><div class="p2-burst">WHAT YOU GET</div><h2>Everything between the order <span>and the payment.</span></h2></div>',
              '<div class="f5-head"><div class="p2-burst">WHEN YOU BUY</div><h2>Buying from suppliers, <span>under control.</span></h2></div>', 2)
t = t.replace('<div class="f5-head"><div class="p2-burst">WHEN YOU BUY</div><h2>Buying from suppliers, <span>under control.</span></h2></div>',
              '<div class="f5-head"><div class="p2-burst">WHAT YOU GET</div><h2>Everything between the order <span>and the payment.</span></h2></div>', 1)
S['text'] = t
P("""function mkPick(view, side){
  const v = document.getElementById('view-' + view); if(!v) return;""", """function mkPick(view, side){
  const v = document.getElementById('view-' + view); if(!v) return;
  if(view === 'index'){ v.querySelectorAll('.f4-set').forEach(s => s.classList.add('on')); return; } // one story on the home page""")
P("""  .f4-set{display:none;} .f4-set.on{display:block;animation:p2in .25s ease;}""",
  """  .f4-set{display:none;} .f4-set.on{display:block;animation:p2in .25s ease;}
  #view-index .f4-who{display:none;} #view-index .f4-pickh{margin-bottom:6px;}
  .mk-books-flow .h4-step{padding-top:18px;}""")
