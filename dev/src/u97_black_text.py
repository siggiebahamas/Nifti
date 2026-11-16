# Text is black everywhere: every gray text color in the app's styles (and in inline styles) becomes near-black.
# Backgrounds, borders and icons keep their gray; placeholder hints in empty boxes stay light so they still read as hints.
import re
from patchlib import S

BLACK = '#0B0F14'
HEX = ['344054', '475467', '667085', '98A2B3', '6B7280', '64748B', '4B5563', '9CA3AF', '5E6470', '666666', '777777', '888888', '999999', '666', '777', '888', '999']
VARS = ['muted', 'f-mut', 'faint', 'ink2', 'ty-ink2', 'f-ink2', 'side-ink', 'f-w']
pat = re.compile(r'(?<![-\w])color\s*:\s*(?:#(?:' + '|'.join(HEX) + r')\b|var\(--(?:' + '|'.join(VARS) + r')\))', re.I)

t = S['text']
out, last, n, kept = [], 0, 0, 0
for m in pat.finditer(t):
    s = m.start()
    ob, cb = t.rfind('{', 0, s), t.rfind('}', 0, s)
    sel = ''
    if ob > cb:
        st = max(t.rfind('}', 0, ob), t.rfind('>', 0, ob), t.rfind(';', 0, ob))
        sel = t[st + 1:ob]
    if 'placeholder' in sel:
        kept += 1
        continue
    out.append(t[last:s]); out.append('color:' + BLACK); last = m.end(); n += 1
out.append(t[last:])
S['text'] = ''.join(out)
print('  black text: %d gray text colors changed, %d placeholder hints kept' % (n, kept))
