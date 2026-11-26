# Lighter download: the brand logo was embedded 8 times as the same 60 KB image. Keep it once and
# point every copy at it when the page loads (works on every page, print windows and offline).
import re
from patchlib import S
t = S['text']
parts = re.split(r'(<script\b[^>]*>.*?</script>)', t, flags=re.S)
uris = {}
for i, part in enumerate(parts):
    if part.startswith('<script'): continue
    for m in re.finditer(r'src="(data:image/[a-z+]+;base64,[A-Za-z0-9+/=]{20000,})"', part):
        uris[m.group(1)] = uris.get(m.group(1), 0) + 1
big = [u for u, n in uris.items() if n >= 3]
GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
saved = 0
for idx, u in enumerate(big):
    for i, part in enumerate(parts):
        if part.startswith('<script'): continue
        n = part.count('src="' + u + '"')
        if n:
            parts[i] = part.replace('src="' + u + '"', 'src="' + GIF + '" data-nf-img="' + str(idx) + '"')
            saved += n * len(u)
t = ''.join(parts)
if big:
    js = '<script>window.NF_IMGS=' + '[' + ','.join('"' + u + '"' for u in big) + '];(function(){function f(){document.querySelectorAll("img[data-nf-img]").forEach(function(i){var u=window.NF_IMGS[+i.getAttribute("data-nf-img")];if(u&&i.src!==u)i.src=u;});}f();document.addEventListener("DOMContentLoaded",f);})();</script>'
    last = t.rfind('data-nf-img="')
    k = t.find('<script', last)
    if k < 0: k = t.rfind('</body>')
    t = t[:k] + js + t[k:]
S['text'] = t
print('assets pass: %d repeated images kept once, %d KB lighter' % (len(big), (saved - sum(len(u) for u in big)) // 1024))
