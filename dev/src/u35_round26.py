# Round 26: plain words everywhere (the 17 swaps from the launch review), status cells in two clean lines,
# the first column of every table on the left, cool gray for buying, English only for now, the landing page
# "night to day" section, a role-aware grouped menu with a shop-word search, weekly tips, pages that explain
# themselves when empty, a help line to the Nifti team, the new Free / Pro / Business plans with a simple way to
# pay, a guided first day, and the last prototype pieces made real.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    return open(os.path.join(HERE, n), encoding='utf-8').read()
def has(n):
    return os.path.exists(os.path.join(HERE, n))

# landing: the night-to-day section replaces the old before/after cards
t = S['text']; i = t.index('<section class="f6-ba-sec" id="mkHow">'); j = t.index('</section>', i) + len('</section>')
S['text'] = t[:i] + rd('r26_nightday.html') + t[j:]

# extra marketing changes (pricing page, landing plans) live in their own module so this file stays readable
if has('u35_site.py'):
    exec(open(os.path.join(HERE, 'u35_site.py'), encoding='utf-8').read())

JS = ['r26.js', 'r26_menu.js', 'r26_price.js', 'r26_start.js', 'r26_back.js', 'r26_pages.js']
CSS = ['r26.css', 'r26_menu.css', 'r26_price.css', 'r26_start.css', 'r26_pages.css']
P("function renderSidebarForViewAsRole(){", '\n'.join(rd(f) for f in JS if has(f)) + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 26 css begin ===== */\n' + '\n'.join(rd(f) for f in CSS if has(f)) + '\n/* ===== Round 26 css end ===== */\n' + t[i:]
# "Opening Nifti…" shows at once for people coming back to the app, while the rest of the file arrives on slow data
BOOT = ('<div id="nf26Boot" role="status" aria-live="polite"><i></i><span>Opening Nifti…</span></div>\n'
        '<script>(function(){try{var h=(location.hash||"").replace("#","");var mk=["","index","features","pricing","privacy","terms","login"];var signed=false;'
        'for(var i=0;i<localStorage.length;i++){if(/^sb-.*-auth-token$/.test(localStorage.key(i))){signed=true;break;}}'
        'if(signed||mk.indexOf(h)<0){document.getElementById("nf26Boot").className="on";}}catch(e){}'
        'setTimeout(function(){var b=document.getElementById("nf26Boot");if(b)b.remove();},12000);})();</script>\n')
t = S['text']; i = t.index('\n<body>\n') + len('\n<body>\n')
S['text'] = t[:i] + BOOT + t[i:]
# marketing css goes in the head, outside the app's own block
t = S['text']; i = t.index('</style>')
S['text'] = t[:i] + '\n' + rd('r26_site.css') + '\n' + t[i:]
# old landing tags
S['text'] = S['text'].replace('PRO · FREE IN THE PILOT', 'PRO')
