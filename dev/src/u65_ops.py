# Round 65: simpler external order progress on shared order links.
# (Round 72 removed this module's Home reshuffle: it moved "What to do" above the summary tiles and renamed it,
#  which cut the Home layout apart. The original Home order is restored; status cards come from r72.js.)
import os
from patchlib import P, S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text'];k=t.index('</style>')
S['text']=t[:k]+'\n'+rd('r65_ops.css')+'\n'+t[k:]
P("function renderSidebarForViewAsRole(){",rd('r65_ops.js')+"\nfunction renderSidebarForViewAsRole(){")
