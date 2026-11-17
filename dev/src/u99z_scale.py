# Round 43: six text sizes for the whole app (14, 16, 18, 24, 28, 36). Runs last, over the finished file, so every
# style written by any round snaps to the scale before the page is ever shown. Count badges, avatars and chart labels
# keep their own small sizes because their circles and axes are built around them.
import re
from patchlib import S
t = S['text']
SKIP = re.compile(r'badge|bnav|kbd|avatar|initial|\.av\b|\bsvg\b|\.ico\b|nfd-|\.sl-n\b|chart|axis|tick|sup\b|emoji|\.nf-db\b|caret', re.I)
def snap(x):
    if x <= 0: return x
    if x < 15: return 14
    if x < 17: return 16
    if x < 21: return 18
    if x < 26: return 24
    if x < 32: return 28
    return 36
def ctx_ok(pos):
    o = t.rfind('{', 0, pos); c = t.rfind('}', 0, pos)
    sel = t[c + 1:o] if o > c else ''
    return not SKIP.search(sel[-400:])
out = []; last = 0; n = 0; kept = 0
for m in re.finditer(r'(font-size\s*:\s*)(\d+(?:\.\d+)?)px', t):
    v = float(m.group(2)); s = snap(v)
    if s == v or not ctx_ok(m.start()):
        kept += 1; continue
    out.append(t[last:m.start(2)]); out.append(str(s)); last = m.end(2); n += 1
out.append(t[last:]); t = ''.join(out)
# font shorthand: "font:700 13px/1.4 ..." or "font: 600 15px Inter"
def fsh(m):
    v = float(m.group(2)); s = snap(v)
    return m.group(1) + (str(s) if s != v else m.group(2)) + m.group(3)
t, k = re.subn(r'(font\s*:\s*(?:[a-z0-9-]+\s+){0,3})(\d+(?:\.\d+)?)(px)', fsh, t)
# the old type themes multiplied sizes by a factor (1.0625 on computers, .92 on phones): sizes now sit on the scale
def calc(m):
    return 'font-size:' + m.group(1) + str(snap(float(m.group(2)))) + 'px'
t, kc = re.subn(r'font-size\s*:\s*(\s*)calc\(\s*(\d+(?:\.\d+)?)px\s*\*\s*var\(--ty-k\s*,\s*1\)\s*\)', calc, t)
def tyv(m):
    return m.group(1) + str(snap(float(m.group(2)))) + 'px'
t, kv = re.subn(r'(--ty-(?:small|row|body|tab|btn|h1|h2|display|lead)\s*:\s*)(\d+(?:\.\d+)?)px', tyv, t)
print('six text sizes: theme sizes', kc, 'calc and', kv, 'variables')
S['text'] = t
print('six text sizes: snapped', n, 'font-size values, left', kept, 'as they were;', k, 'shorthand checked')
