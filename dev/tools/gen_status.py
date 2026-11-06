# Writes dev/src/status.css: every red, yellow/orange/brown and status-green colour in the app's CSS and in
# inline template styles is mapped to ONE standard palette (Tailwind-style red / yellow / green):
#   red    text #DC2626 · fill #DC2626 · tints #FEF2F2 #FEE2E2 #FECACA · line #FCA5A5
#   yellow never a text colour (text on yellow is near-black #1F2329) · fill #FACC15 · tints #FEFCE8 #FEF9C3 #FEF08A · line #FACC15 / #FDE047
#   green  text #15803D · fill #16A34A · tints #F0FDF4 #DCFCE7 · line #86EFAC   (brand green #1F6B45 for buttons is kept)
# Beige / brownish near-whites become neutral. Run after a build, then build again (it ignores its own previous output).
import re, colorsys, os
HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(HERE, '..', '..', 'Nifti_Sept17.html'), encoding='utf-8').read()
html = re.sub(r'/\* ===== Standard status colours.*?/\* ===== end status colours ===== \*/', '', html, flags=re.S)
html = re.sub(r'/\* ===== Round \d+ css begin.*?/\* ===== Round \d+ css end ===== \*/', '', html, flags=re.S)
html = re.sub(r'/\* ===== No orange anywhere.*?(?=/\* =====)', '', html, flags=re.S)
css = re.sub(r'/\*.*?\*/', '', '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', html, re.S)), flags=re.S)
MK = re.compile(r'(^|[\s>+~(,])(\.(mk|f\d|h\d|hiw|pr-|faq|hero|login|footer|nav-links|cta|lp-|price|plan-|m2|m3|v3|v-|gate|tour|wiz|onb)|nav\.top|\.marketing|#view-(index|pricing|login|features))')
KEEP = {'#25D366', '#EA4335', '#004512'}  # other brands (WhatsApp, Google)
def hls(h):
    h = h.lstrip('#'); h = ''.join(c*2 for c in h) if len(h) == 3 else h
    r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4)); H, L, S = colorsys.rgb_to_hls(r, g, b); return H * 360, L, S
def kind(prop):
    if prop == 'color': return 't'
    if 'border' in prop or prop.startswith('outline'): return 'b'
    if prop in ('fill', 'stroke'): return 's'
    return 'f'
def family(h):
    if h.upper() in KEEP: return None
    H, L, S = hls(h)
    if S < .3 or L < .08 or L > .985: return None
    if H < 14 or H >= 345: return 'r'
    if H < 66: return 'beige' if (L >= .85 and S < .7) else 'y'
    if 115 <= H <= 165 and S >= .65: return 'g'
    return None
def repl(h, prop):
    f = family(h)
    if not f: return None
    H, L, S = hls(h); k = kind(prop)
    if f == 'r':
        if k == 't': return '#FECACA' if L >= .75 else '#DC2626'
        if k == 'b': return '#FECACA' if L >= .88 else '#FCA5A5' if L >= .7 else '#DC2626'
        if k == 's': return '#DC2626'
        return '#FEF2F2' if L >= .96 else '#FEE2E2' if L >= .9 else '#FECACA' if L >= .8 else '#FCA5A5' if L >= .65 else '#DC2626'
    if f == 'y':
        if k == 't': return '#FDE047' if L >= .7 else '#1F2329'
        if k == 'b': return '#FDE047' if L >= .8 else '#FACC15'
        if k == 's': return '#EAB308'
        return '#FEFCE8' if L >= .95 else '#FEF9C3' if L >= .88 else '#FEF08A' if L >= .78 else '#FDE047' if L >= .6 else '#FACC15'
    if f == 'g':
        if k == 't': return '#BBF7D0' if L >= .7 else '#15803D'
        if k == 'b': return '#BBF7D0' if L >= .85 else '#86EFAC' if L >= .65 else '#16A34A'
        if k == 's': return '#16A34A'
        return '#F0FDF4' if L >= .95 else '#DCFCE7' if L >= .88 else '#BBF7D0' if L >= .75 else '#16A34A'
    if f == 'beige':
        return '#1F2329' if k == 't' else '#E4E4DF' if k == 'b' else '#F6F6F3'
HEX = r'#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![0-9A-Fa-f])'
def splitsel(sel):
    out, d, cur = [], 0, ''
    for ch in sel:
        d += {'(': 1, ')': -1}.get(ch, 0)
        if ch == ',' and d == 0: out.append(cur); cur = ''
        else: cur += ch
    out.append(cur); return [s.strip() for s in out if s.strip()]
def walk(text):
    out, i = [], 0
    while i < len(text):
        j = text.find('{', i)
        if j < 0: break
        sel = text[i:j].strip(); d, k = 1, j + 1
        while d and k < len(text):
            d += {'{': 1, '}': -1}.get(text[k], 0); k += 1
        body = text[j+1:k-1]
        if sel.startswith('@media') or sel.startswith('@supports'):
            inner = walk(body)
            if inner: out.append(sel + '{' + inner + '}')
        elif not sel.startswith('@'):
            parts = [p for p in splitsel(sel) if not MK.search(' ' + re.sub(r':(is|where|not)\([^()]*\)', '', p)) and not re.match(r'^(from|to|\d+%)$', p)]
            if parts:
                decls = []
                for dcl in body.split(';'):
                    if ':' not in dcl or '#' not in dcl: continue
                    p, v = dcl.split(':', 1); p = p.strip().lower()
                    if p.startswith('--'): continue
                    hit = [False]
                    def sub(m):
                        r = repl(m.group(0), p)
                        if r and r.upper() != m.group(0).upper(): hit[0] = True; return r
                        return m.group(0)
                    nv = re.sub(HEX, sub, v)
                    if hit[0]: decls.append(p + ':' + nv.strip())
                if decls: out.append(', '.join(parts) + '{' + ';'.join(decls) + '}')
        i = k
    return '\n'.join(out)
res = walk(css)
# inline styles inside page templates
inl = {}
for st in re.findall(r'style=\\?["\']([^"\']*)', html):
    for p, h in re.findall(r'(color|background|background-color|border(?:-left|-top|-bottom|-right)?(?:-color)?)\s*:\s*(' + HEX + ')', st):
        r = repl(h, p.lower())
        if r and r.upper() != h.upper():
            prop = 'border-color' if p.startswith('border') else ('background' if p.startswith('background') else 'color')
            inl.setdefault((prop, r), set()).add(f'[style*="{p}:{h}"]')
            inl[(prop, r)].add(f'[style*="{p}: {h}"]')
inline = '\n'.join('#view-app :is(' + ','.join(sorted(sels)) + '), #mhSheet :is(' + ','.join(sorted(sels)) + '){' + prop + ':' + r + ' !important;}' for (prop, r), sels in sorted(inl.items()))
tokens = '''body{--bg:#F3F3F0;--border:#DDE1E6;} #view-app, #mhSheet{--border:#DDE1E6;}
#view-app, body, #mhSheet{--danger:#DC2626;--danger-soft:#FEE2E2;--warn:#EAB308;--warn-soft:#FEF9C3;--lowstock:#1F2329;--lowstock-soft:#FEF9C3;--lowstock-fill:#FACC15;--clay:#15803D;--clay-soft:#DCFCE7;
  --st-red:#DC2626;--st-red-fill:#EF4444;--st-red-soft:#FEF2F2;--st-red-tint:#FEE2E2;--st-red-line:#FCA5A5;
  --st-yel:#FACC15;--st-yel-deep:#EAB308;--st-yel-soft:#FEFCE8;--st-yel-tint:#FEF9C3;--st-yel-line:#FACC15;
  --st-grn:#15803D;--st-grn-fill:#16A34A;--st-grn-soft:#F0FDF4;--st-grn-tint:#DCFCE7;--st-grn-line:#86EFAC;--st-ink:#1F2329;}
'''
out = '  /* ===== Standard status colours: generated by dev/tools/gen_status.py ===== */\n' + tokens + res + '\n' + inline + '\n  /* ===== end status colours ===== */\n'
open(os.path.join(HERE, '..', 'src', 'status.css'), 'w', encoding='utf-8').write(out)
print('status.css', len(res.splitlines()), 'rules,', len(inl), 'inline groups')
