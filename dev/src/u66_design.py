# Round 66: high-legibility marketing and intentional visual hierarchy.
import os
from patchlib import P, S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text'];k=t.index('</style>')
S['text']=t[:k]+'\n'+rd('r66_design.css')+'\n'+t[k:]
P("function renderSidebarForViewAsRole(){",rd('r66_design.js')+"\nfunction renderSidebarForViewAsRole(){")
