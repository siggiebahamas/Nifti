# Round 21: slate tabs, Orders counts that match, no order table, simple credits (with supplier credit
# slips), a big demo button on the login page, Alerts on your phone (Telegram/Viber setup and practice),
# and American spelling in everything people read.
import os, re
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''

# login: the demo link becomes a big, centered button
P("""    <div style="margin-bottom:10px;"><span class="row-action" onclick="startDemoOrder()">Try a Demo Order — no signup required →</span></div>""",
  """    <button type="button" class="nf21-demo" onclick="startDemoOrder()"><span class="nf21-demo-ic"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg></span><span class="nf21-demo-t"><b>Try the demo shop</b><small>See Nifti running a real hardware store. No sign-up, nothing to install.</small></span><span class="nf21-demo-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></button>
    <div class="nf21-or"><span>or use your account</span></div>""")

P("function renderSidebarForViewAsRole(){", rd('r21.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 21 css begin ===== */\n' + rd('r21.css') + '\n/* ===== Round 21 css end ===== */\n' + t[i:]

# American spelling in what people read (internal names like 'cancelled' status keys and cheque tables stay)
t = S['text']
t = re.sub(r'(?<=[a-zA-Z] )cancelled(?!\s*:)', 'canceled', t)
t = t.replace('Cancelled', 'Canceled')
for a, b in [('colours', 'colors'), ('Colours', 'Colors'), ('coloured', 'colored'), ('Coloured', 'Colored'), ('colour', 'color'), ('Colour', 'Color'),
             ('centred', 'centered'), ('centre', 'center'), ('favour', 'favor'), ('behaviour', 'behavior')]:
    t = t.replace(a, b)
t = re.sub(r"(?<![A-Za-z_.'\"/#-])Cheque(s?)(?=[\s<'\".,:!?)\]])", lambda m: 'Check' + m.group(1), t)
t = re.sub(r"\b(a|the|your|every|Every|each|bounced|dated|of|from|with|or|manager's|new|his|our|return|miss a|Yung|bagong|Save|Record a|bounces|No|1) cheque(s?)\b(?!\s*[:=,(])", lambda m: m.group(1) + ' check' + m.group(2), t)
S['text'] = t
