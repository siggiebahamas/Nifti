# Round 51: the landing and pricing pages are light again (version A, "Sunlit", from dev/src/lab51). No dark sections.
# The design lab with all three light versions (A Sunlit, B Notebook, C Bento Bright) lives in design-lab/r51.
import os, re, sys
from patchlib import P, S
HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(HERE, 'lab51'))
import common as L51
import va as A51
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

def kern(html):
    # the headline font draws a wide gap before a period; pull each headline period in a little
    return re.sub(r'<(h1|h2)([^>]*)>(.*?)</\1>', lambda m: '<%s%s>%s</%s>' % (m.group(1), m.group(2), re.sub(r'(?<=[A-Za-z])\.(?=<|$|\s)', '<i class="pd">.</i>', m.group(3)), m.group(1)), html, flags=re.S)

t = S['text']
i = t.index('<div id="view-index" class="marketing-view">'); j = t.index('<!-- ============ MARKETING: FEATURES', i)
m = re.search(r'<div class="brand">.*?</div>', t[i:j], re.S); brand = m.group(0) if m else '<b class="a-word">Nifti</b>'
body = kern(A51.build(lab=False, brand=brand))
S['text'] = t[:i] + '<div id="view-index" class="marketing-view va lp51">\n' + body + '\n</div>\n\n' + t[j:]

# pricing page: same look, built from the landing's pieces
def piece(rx):
    mm = re.search(rx, body, re.S); return mm.group(0) if mm else ''
nav = piece(r'<nav class="a-nav">.*?</nav>')
price = piece(r'<section class="a-sec[^"]*" data-s="10".*?</section>').replace(' id=aPrice', '')
price = re.sub(r'<div class="a-head rv">.*?</div>', '', price, count=1, flags=re.S)
faq = piece(r'<section class="a-sec[^"]*" data-s="11".*?</section>')
final = piece(r'<section class="a-sec[^"]*" data-s="12".*?</section>')
phero = kern('<header class="a-sec a-phero"><div class="a-aura"></div><div class="a-in"><span class="a-eyebrow"><i></i>Free plan for good · no card needed</span>'
             '<h1>Simple prices. <span class="a-mark">Start free today.</span></h1><p class="a-lead">One plan covers selling, buying and your books. Upgrade when it pays for itself, stop any time and keep every record.</p></div></header>')
t = S['text']
i = t.index('<div id="view-pricing" class="marketing-view hidden"'); j = t.index('<div id="view-privacy" class="marketing-view hidden">', i)
seg = t[i:j]; cm = seg.rfind('<!--'); end = i + cm if cm > 0 else j
S['text'] = t[:i] + '<div id="view-pricing" class="marketing-view hidden va lp51" data-side="sell">\n' + nav + phero + price + faq + final + '\n</div>\n\n' + t[end:]

EXTRA = r'''
.va .a-phero{position:relative;overflow:hidden;isolation:isolate;padding:70px 0 30px;text-align:center;background:linear-gradient(180deg,#FFFFFF,#F7FCF9)}
.va .a-phero h1{margin-top:20px;font-size:clamp(40px,5vw,64px);line-height:1.04;font-weight:800;letter-spacing:-.03em}.va .a-phero .a-lead{margin:18px auto 0}
.va .a-phero + .a-sec{padding-top:30px}
.va .pd{font-style:normal;margin-left:-.09em}
.va .brand{cursor:pointer}
@media (max-width:640px){.va .a-phero{padding:40px 0 16px}}
'''
# landing css in the head, next to the other marketing css
t = S['text']; i = t.index('</style>')
S['text'] = t[:i] + '\n/* ===== Round 51 landing ===== */\n' + L51.MOCK_CSS + A51.CSS + EXTRA + '\n' + t[i:]
# behaviour: the shared tabs / prices / reveal script plus the app's own buttons
P("function renderSidebarForViewAsRole(){", L51.JS + '\n' + rd('r51_site.js') + "\nfunction renderSidebarForViewAsRole(){")
