# Round 52: WOW pieces on the ORIGINAL landing page, in its own look:
#  1. "Try it right now": type an order like a customer would, Nifti turns it into an order (sample shop items and
#     prices), with the REAL app playing on a phone beside it (five screens from the demo shop)
#  2. Notebook before / after slider (AI notebook reader)
#  3. "Your time back" calculator (honest estimate, assumptions written under it)
#  4. Start free / Try the demo bar on phones after the hero
#  5. Bigger calls to action; the hero's notifications pop in like live alerts
import os, base64
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

CAPS = ['Orders arrive from Viber', 'Every order in one list', "Your driver's day, stop by stop", 'Who owes you, and reminders', 'Your whole day at a glance']
imgs = []
for k, (f, cap) in enumerate(zip(['messages', 'orders', 'routes', 'collections', 'dashboard'], CAPS)):
    b64 = base64.b64encode(open(os.path.join(HERE, f'loop52_{f}.jpg'), 'rb').read()).decode()
    imgs.append(f'<img src="data:image/jpeg;base64,{b64}" alt="Nifti app: {cap}" decoding="async"{" class=on" if k == 0 else ""}>')
TRY = rd('r52_try.html').replace('{{LOOP_IMGS}}', ''.join(imgs))

t = S['text']
i = t.index('<div id="view-index"'); j = t.index('<!-- ============ MARKETING: FEATURES', i)
v = t[i:j]
# 1. right after the hero
a = v.index('<section class="f4-hero">'); b = v.index('</section>', a) + len('</section>')
v = v[:b] + '\n' + TRY + v[b:]
# 2. before the hour-by-hour day
a = v.index('<section class="f6-ba-sec nf26-nd" id="mkHow">')
v = v[:a] + rd('r52_nb.html') + '\n' + v[a:]
# 3. after the day, before the plans
a = v.index('<section class="nf26-plans-sec" id="mkPlans">')
v = v[:a] + rd('r52_calc.html') + '\n' + v[a:]
# 4. the phone bar, at the end of the landing
STICKY = '<div class="mk-sticky" id="mkSticky"><a class="btn btn-hero-primary" onclick="mk52Start()">Start free</a><a class="btn btn-hero-outline" onclick="startDemoOrder()">Try the demo</a></div>\n'
a = v.rindex('</div>')
v = v[:a] + STICKY + v[a:]
S['text'] = t[:i] + v + t[j:]

# css with the marketing styles in the head; behaviour with the app's scripts
t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r52_wow.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r52_wow.js') + "\nfunction renderSidebarForViewAsRole(){")
