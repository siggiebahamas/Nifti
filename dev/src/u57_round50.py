# Round 50: no info icons on pills, Notebook reader / Old records / Plans as their own pages, store back fix,
# sweep fixes, and the new landing + pricing pages
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

# ---- landing + pricing pages ----
t = S['text']
i = t.index('<div id="view-index" class="marketing-view">'); j = t.index('<!-- ============ MARKETING: FEATURES', i)
old = t[i:j]
m = re.search(r'<div class="brand">.*?</div>', old, re.S); brand = m.group(0) if m else '<div class="brand"><b>Nifti</b></div>'
site = rd('r50_site.html').replace('{{BRAND}}', brand)
# the headline font draws a wide gap before a period; pull each headline period in a little
site = re.sub(r'<(h1|h2)([^>]*)>(.*?)</\1>', lambda m: '<%s%s>%s</%s>' % (m.group(1), m.group(2), re.sub(r'(?<=[A-Za-z])\.(?=<|$|\s)', '<i class="lp-pd">.</i>', m.group(3)), m.group(1)), site, flags=re.S)
S['text'] = t[:i] + site + '\n\n' + t[j:]

# pricing page: same look, built from the landing's pieces
def piece(start, end_tag):
    a = site.index(start); b = site.index(end_tag, a) + len(end_tag); return site[a:b]
nav = piece('<nav class="lp-nav">', '</nav>')
price = piece('<section class="lp-sec lp-price" id="lpPrice">', '</section>').replace(' id="lpPrice"', '')
price = re.sub(r'<div class="lp-head lp-rv">.*?</div>\s*', '', price, count=1, flags=re.S)
faq = piece('<section class="lp-sec lp-faq">', '</section>')
final = piece('<section class="lp-final">', '</section>')
foot = piece('<footer class="lp-foot">', '</footer>')
how = ('<section class="lp-sec lp-trust lp-payhow"><div class="lp-in"><div class="lp-head lp-rv"><span class="lp-k">HOW PAYING WORKS</span><h2>Three short steps<i class="lp-pd">.</i> <span class="lp-hl">No card<i class="lp-pd">.</i></span></h2></div>'
       '<div class="lp-trust-g three">'
       '<div class="lp-rv"><span class="lp-ic"><b>1</b></span><b>Pick a plan and scan our QR</b><p>Use GCash, Maya or any bank app. It goes by InstaPay, like any transfer.</p></div>'
       '<div class="lp-rv"><span class="lp-ic"><b>2</b></span><b>Type the reference number</b><p>Or snap the receipt. It takes a few seconds, right inside Nifti.</p></div>'
       '<div class="lp-rv"><span class="lp-ic"><b>3</b></span><b>We switch your plan on</b><p>Usually within a few hours. Your records stay exactly as they are.</p></div>'
       '</div></div></section>')
phero = ('<header class="lp-phero"><div class="lp-glow g1"></div><div class="lp-grid"></div><div class="lp-in"><span class="lp-eyebrow"><i></i>Free plan for good · no card needed</span>'
         '<h1>Simple prices<i class="lp-pd">.</i><br><span class="lp-grad">Start free today<i class="lp-pd">.</i></span></h1><p>One plan covers selling, buying and your books. Upgrade when it pays for itself, stop any time and keep every record.</p></div></header>')
t = S['text']
i = t.index('<div id="view-pricing" class="marketing-view hidden"'); j = t.index('<div id="view-privacy" class="marketing-view hidden">', i)
seg = t[i:j]; cm = seg.rfind('<!--'); end = i + cm if cm > 0 else j
S['text'] = t[:i] + '<div id="view-pricing" class="marketing-view hidden nf50lp" data-side="sell">\n' + nav + phero + price + how + faq + final + foot + '\n</div>\n\n' + t[end:]

# handwriting font for the notebook pictures
S['text'] = S['text'].replace('family=IBM+Plex+Sans:wght@400;500;600;700&display=swap', 'family=IBM+Plex+Sans:wght@400;500;600;700&family=Caveat:wght@600;700&display=swap', 1)
# landing css in the head, next to the other marketing css
t = S['text']; i = t.index('</style>')
S['text'] = t[:i] + '\n' + rd('r50_site.css') + '\n' + t[i:]

# ---- app ----
P("function renderSidebarForViewAsRole(){", rd('r50.js') + '\n' + rd('r50_site.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 50 css ===== */\n' + rd('r50.css') + '\n' + t[i:]
