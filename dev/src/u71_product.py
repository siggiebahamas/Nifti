# Round 71: enforce SKU-first sales and inject counter UX refinements.
import os
from patchlib import S
HERE=os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text']
anchor="function renderSidebarForViewAsRole(){"
if anchor not in t: raise SystemExit("Round 71 insertion point missing")
t=t.replace(anchor,rd('r71_product.js')+"\n"+anchor,1)
i=t.index('</style>')
t=t[:i]+'\n'+rd('r71_product.css')+'\n'+t[i:]
S['text']=t
