# Writes themes/type/ink.css: rewrites every gray, faded or small text rule in the app as an html[data-ty] rule
# (near-black text, full opacity, sizes scaled by --ty-k with a 14px floor).
# Usage: python3 dev/tools/gen_ink.py app.css   (app.css = the CSS of all <style> blocks in a build, joined)
import sys, os
import re, colorsys
css = re.sub(r'/\*.*?\*/', '', open(sys.argv[1]).read(), flags=re.S)
MK = re.compile(r'(^|[\s>+~(,])(\.(mk|f\d|h\d|hiw|pr-|faq|hero|login|footer|nav-links|cta|lp-|price|plan-|m2|m3|v3|v-|gate|tour|wiz|onb)|nav\.top|\.brand|\.marketing|#view-(index|pricing|login|features))')
NO_OP = re.compile(r'svg|img|icon|\bic\b|-ic\b|disabled|void|done|past|blank|skeleton|loading|strike|knob|placeholder|::?before|::?after|:hover|\.off\b|locked|hidden|backdrop|overlay|\bdot|-dot|bar|track|fill|progress|chart|spark|ghost|faded|cancel|closed|expired|inactive|\.empty|future|mute|logo|switch|toggle\b|ring|line|arrow|chev|caret|spinner|badge|tooltip')
NO_FS = re.compile(r'badge|count|\bdot|-dot|-n\b|kbd|sup\b|sub\b(?!-)|chev|caret|arrow|icon|ic\b|lens-n|nav-badge|unread|notif-count|tag\b|-tag|pill-s|ord-q|sort-arrow')
def neutral_gray(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c*2 for c in h)
    r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
    H, L, S = colorsys.rgb_to_hls(r, g, b)
    return S < .3 and .3 <= L <= .82
def fsmap(v, small_ok):
    if v < 9 or v > 44: return None
    if small_ok or v >= 14: return f'calc({v}px * var(--ty-k, 1))'
    return f'max(var(--ty-min, 14px), calc({v}px * var(--ty-k, 1)))'
def splitsel(sel):
    out, d, cur = [], 0, ''
    for ch in sel:
        if ch == '(': d += 1
        elif ch == ')': d -= 1
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
        if sel.startswith('@media'):
            inner = walk(body)
            if inner: out.append(sel + '{' + inner + '}')
        elif not sel.startswith('@'):
            parts = [p for p in splitsel(sel) if not MK.search(' ' + p) and not p.startswith(('html', 'body', ':root', 'from', 'to')) and not re.match(r'^\d+%$', p)]
            if parts:
                decls = []
                for dcl in body.split(';'):
                    if ':' not in dcl: continue
                    p, v = dcl.split(':', 1); p = p.strip(); v = v.strip()
                    imp = ' !important' if '!important' in v else ''
                    if p == 'color':
                        m = re.match(r'(#[0-9A-Fa-f]{3,6})\b', v)
                        if m and neutral_gray(m.group(1)): decls.append('color:var(--ty-ink2)' + imp)
                    elif p == 'opacity':
                        try: o = float(v.replace('!important', ''))
                        except: o = 1
                        if .35 <= o < .96 and not NO_OP.search(sel): decls.append('opacity:1' + imp)
                    elif p == 'font-size':
                        m = re.match(r'([\d.]+)px', v.strip())
                        if m:
                            r = fsmap(float(m.group(1)), bool(NO_FS.search(sel)))
                            if r: decls.append('font-size:' + r + imp)
                if decls:
                    out.append(', '.join('html[data-ty] ' + p for p in parts) + '{' + ';'.join(decls) + '}')
        i = k
    return '\n'.join(out)
res = walk(css)
inline = '''
/* inline styles inside page templates */
html[data-ty] #view-app :is(span,small,div,p,b,em,td,li,label,strong,i):not(svg *):is([style*="opacity:.4"],[style*="opacity:.5"],[style*="opacity:.55"],[style*="opacity:.6"],[style*="opacity:.65"],[style*="opacity:.7"],[style*="opacity:.75"],[style*="opacity:.8"],[style*="opacity:.85"]){opacity:1 !important;color:var(--ty-ink2) !important;}
html[data-ty] #view-app [style*="font-size:11px"]{font-size:max(var(--ty-min, 14px), calc(11px * var(--ty-k, 1))) !important;}
html[data-ty] #view-app [style*="font-size:11.5px"]{font-size:max(var(--ty-min, 14px), calc(11.5px * var(--ty-k, 1))) !important;}
html[data-ty] #view-app [style*="font-size:12px"]{font-size:max(var(--ty-min, 14px), calc(12px * var(--ty-k, 1))) !important;}
html[data-ty] #view-app [style*="font-size:12.5px"]{font-size:max(var(--ty-min, 14px), calc(12.5px * var(--ty-k, 1))) !important;}
html[data-ty] #view-app [style*="font-size:13px"]{font-size:max(var(--ty-min, 14px), calc(13px * var(--ty-k, 1))) !important;}
html[data-ty] #view-app [style*="font-size:13.5px"]{font-size:max(var(--ty-min, 14px), calc(13.5px * var(--ty-k, 1))) !important;}
html[data-ty] #view-app [style*="font-size:14px"]{font-size:calc(14px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:14.5px"]{font-size:calc(14.5px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:15px"]{font-size:calc(15px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:15.5px"]{font-size:calc(15.5px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:16px"]{font-size:calc(16px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:16.5px"]{font-size:calc(16.5px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:17px"]{font-size:calc(17px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:18px"]{font-size:calc(18px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:19px"]{font-size:calc(19px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:20px"]{font-size:calc(20px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:22px"]{font-size:calc(22px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:24px"]{font-size:calc(24px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:26px"]{font-size:calc(26px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app [style*="font-size:28px"]{font-size:calc(28px * var(--ty-k, 1)) !important;}
html[data-ty] #view-app :is([style*="color:#555"],[style*="color:#888"],[style*="color:var(--faint)"],[style*="color:var(--muted)"]){color:var(--ty-ink2) !important;}
'''
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'themes', 'type', 'ink.css'), 'w').write('/* Generated: no gray, faded or tiny text anywhere in the app (only when a typography theme is on). */\n' + res + '\n' + inline)
print(len(res.splitlines()), 'rules')
