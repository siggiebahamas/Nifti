# Runs after every round's styles: no gray text anywhere (any neutral gray used as a text colour becomes black;
# placeholder hints keep their light gray). Added in Round 80 so new features can never bring gray text back.
import re
from patchlib import S
# --- No gray text anywhere: any neutral gray used as a text colour becomes black (placeholder hints keep their light gray) ---
BLACK = '#0B0F14'
def _gray(r, g, b):
    mx, mn = max(r, g, b), min(r, g, b); l = (mx + mn) / 510; ch = (mx - mn) / 255
    return ch < 0.12 and 0.14 < l < 0.62
def _hex(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return [int(h[i:i+2], 16) for i in (0, 2, 4)]
pat = re.compile(r'(?<![-\w])color\s*:\s*(#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\))')
t = S['text']; out, last, n = [], 0, 0
for m in pat.finditer(t):
    v = m.group(1)
    if v.startswith('#'): r, g, b = _hex(v); a = 1
    else:
        nums = [float(x) for x in re.findall(r'[\d.]+', v)]; r, g, b = nums[:3]; a = nums[3] if len(nums) > 3 else 1
    dark_rgba = (not v.startswith('#')) and a < 1 and max(r, g, b) < 80
    if not (_gray(r, g, b) or dark_rgba): continue
    s = m.start(); ob, cb = t.rfind('{', 0, s), t.rfind('}', 0, s); sel = ''
    if ob > cb:
        st = max(t.rfind('}', 0, ob), t.rfind('>', 0, ob), t.rfind(';', 0, ob)); sel = t[st + 1:ob]
    if 'placeholder' in sel or 'disabled' in sel: continue
    out.append(t[last:s]); out.append('color:' + BLACK); last = m.end(); n += 1
out.append(t[last:]); S['text'] = ''.join(out)
print('  no-gray pass: %d gray text colours changed to black' % n)
# text-only colour variables that hold a gray
for _v in ['--body', '--faint', '--muted', '--nf68-muted', '--r72-text', '--lowstock', '--ty-ink2', '--st-ink']:
    S['text'] = re.sub(r'(?<![-\w])(' + re.escape(_v) + r')\s*:\s*#[0-9a-fA-F]{3,6}\b', r'\1:' + BLACK, S['text'])
