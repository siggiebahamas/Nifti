# Round 66: high-legibility marketing and intentional visual hierarchy.
import os, re
from patchlib import P, S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text']
# Remove the redundant time calculator section at build time. Its assumptions were
# not a reliable measure of customer value; the interactive outcome cards remain.
def remove_section_by_id(html, ident):
    m=re.search(r'<section\\b[^>]*\\bid="' + re.escape(ident) + r'"[^>]*>',html,re.I)
    if not m:return html
    depth=1
    for tag in re.finditer(r'<section\\b[^>]*>|</section\\s*>',html[m.end():],re.I):
        depth += -1 if tag.group(0).lower().startswith('</section') else 1
        if depth==0:return html[:m.start()]+html[m.end()+tag.end():]
    raise SystemExit('u66_design: unclosed section '+ident)
t=remove_section_by_id(t,'mkCalc')
k=t.index('</style>')
S['text']=t[:k]+'\n'+rd('r66_design.css')+'\n'+t[k:]
P("function renderSidebarForViewAsRole(){",rd('r66_design.js')+"\nfunction renderSidebarForViewAsRole(){")
