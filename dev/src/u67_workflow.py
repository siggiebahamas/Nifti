# Round 67: finish the daily-control and counterparty experience using existing Nifti data only.
import os
from patchlib import P, S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text']
k=t.index('</style>')
S['text']=t[:k]+'\n'+rd('r67_workflow.css')+'\n'+t[k:]
P("function renderSidebarForViewAsRole(){",rd('r67_workflow.js')+"\nfunction renderSidebarForViewAsRole(){")
