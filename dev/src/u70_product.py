# Round 70: sales visibility choice, cash evidence and restrained navigation polish.
import os
from patchlib import S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text']
k=t.index('</style>')
S['text']=t[:k]+'\n'+rd('r70_product.css')+'\n'+t[k:]
S['text']=S['text'].replace("function renderSidebarForViewAsRole(){",rd('r70_product.js')+"\nfunction renderSidebarForViewAsRole(){",1)
