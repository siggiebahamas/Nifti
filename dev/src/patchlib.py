import sys
S = {'text': None, 'log': []}
def P(old, new, count=1):
    t = S['text']; n = t.count(old)
    if n != count:
        sys.exit('PATCH FAIL (found %d, want %d): %r' % (n, count, old[:160]))
    S['text'] = t.replace(old, new)
def INS_BEFORE(anchor, text, count=1):
    P(anchor, text + anchor, count)
def INS_AFTER(anchor, text, count=1):
    P(anchor, anchor + text, count)
