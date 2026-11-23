# Round 68: product-wide readability, status contrast and interaction consistency.
import os
from patchlib import P, S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text']
k=t.index('</style>')
S['text']=t[:k]+'\\n'+rd('r68_product_ui.css')+'\\n'+t[k:]
