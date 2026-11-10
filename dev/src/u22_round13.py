# Round 13: the Focus order popup (one next step, locked button that names what is missing, take or attach a photo),
# calmer pictures (no rings, no coloured chat bars, no purple), and the price lock & receipts box removed.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n):
    p = os.path.join(HERE, n)
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''
P("function renderSidebarForViewAsRole(){", rd('r13.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 13 css begin ===== */\n' + rd('r13.css') + '\n/* ===== Round 13 css end ===== */\n' + t[i:]

# price lock & receipts: the fold-out box on Sales goes, and no receipt pops up after every sale
P("    ${plDiscountsHtml(day)}${plSettingsHtml()}`;", "    ${plDiscountsHtml(day)}`;")
P("  if(plCfg().receipt) bkReceipt(", "  if(false && plCfg().receipt) bkReceipt(")
P("""<div class="bk-note">Staff can give up to ${max}% off on their own. Change it on Sales → Price lock.</div>""",
  """<div class="bk-note">Staff can give up to ${max}% off on their own.</div>""")
P("""
      <div class="prow"><div><b>Price lock and receipt after every sale</b> <span class="pill g" style="font-size:12.5px">Part of Nifti</span><p>Staff can't sell under the price list without your OK, and every customer gets a receipt with the real price. Change it in Settings.</p></div></div></div></div>`, 'Extra protections'); }""",
  """</div></div>`, 'Extra protections'); }""")
