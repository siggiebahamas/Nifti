# Round 62: clarify Nifti's one-business-first model, improve the customer-link demo,
# simplify first-run onboarding and preserve the original marketing design system.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

t = S['text']
k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r62_cro.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r62_cro.js') + "\nfunction renderSidebarForViewAsRole(){")
