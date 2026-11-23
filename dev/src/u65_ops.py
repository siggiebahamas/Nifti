# Round 65: daily dashboard priorities and simpler external order progress.
import os
from patchlib import P, S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text'];k=t.index('</style>')
S['text']=t[:k]+'\n'+rd('r65_ops.css')+'\n'+t[k:]
P("function renderSidebarForViewAsRole(){",rd('r65_ops.js')+"\nfunction renderSidebarForViewAsRole(){")
