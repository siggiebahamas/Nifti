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
# Round 51: the marketing pages (landing, pricing, features, login, privacy, terms) keep the sizes they were designed
# with. The scale is for the app; snapping the landing shrank its 50px headline to 36px and its buttons and cards.
MKT = re.compile(r'(?:^|[\s,>+~(])(?:[.#](?:v-notif|v-nic|v-ntop|v-stat|f4-|f5-|f6-|h4-|p2-|m2-|mk-|nf20-(?:show|stabs|stage|sp\b|how)|nf26-pls|nf26-pl\b|nf26-pl-|nf26-nd|nf26-plans|nf26-cmp|nf26-pay|login-card|nf21-demo|cta-band|cta-wrap|btn-hero|foot-|nav-links|nav-cta|login-link|marketing-view|view-(?:index|pricing|features|privacy|terms|login)|mkShow|mkHow|mkPlans|mkPick|mkSell|mkBuy|mkHowItWorks)|nav\.top)', re.I)
def ctx_ok(pos):
    o = t.rfind('{', 0, pos); c = t.rfind('}', 0, pos)
    sel = t[c + 1:o] if o > c else ''
    return not SKIP.search(sel[-400:]) and not MKT.search(sel[-600:])
out = []; last = 0; n = 0; kept = 0
for m in re.finditer(r'(font-size\s*:\s*)(\d+(?:\.\d+)?)px', t):
    v = float(m.group(2)); s = snap(v)
    if s == v or not ctx_ok(m.start()):
        kept += 1; continue
    out.append(t[last:m.start(2)]); out.append(str(s)); last = m.end(2); n += 1
out.append(t[last:]); t = ''.join(out)
# font shorthand: "font:700 13px/1.4 ..." or "font: 600 15px Inter"
def fsh(m):
    if not ctx_ok(m.start()): return m.group(0)
    v = float(m.group(2)); s = snap(v)
    return m.group(1) + (str(s) if s != v else m.group(2)) + m.group(3)
t, k = re.subn(r'(font\s*:\s*(?:[a-z0-9-]+\s+){0,3})(\d+(?:\.\d+)?)(px)', fsh, t)
# the old type themes multiplied sizes by a factor (1.0625 on computers, .92 on phones): sizes now sit on the scale
def calc(m):
    if not ctx_ok(m.start()): return m.group(0)
    return 'font-size:' + m.group(1) + str(snap(float(m.group(2)))) + 'px'
t, kc = re.subn(r'font-size\s*:\s*(\s*)calc\(\s*(\d+(?:\.\d+)?)px\s*\*\s*var\(--ty-k\s*,\s*1\)\s*\)', calc, t)
def tyv(m):
    return m.group(1) + str(snap(float(m.group(2)))) + 'px'
t, kv = re.subn(r'(--ty-(?:small|row|body|tab|btn|h1|h2|display|lead)\s*:\s*)(\d+(?:\.\d+)?)px', tyv, t)
print('six text sizes: theme sizes', kc, 'calc and', kv, 'variables')
# Round 51: the marketing pages read the type variables too, so they get back the values they were designed with
MKT_VARS = ('\n/* Round 51: marketing pages keep their original type sizes (the six-size scale is for the app) */\n'
  '.marketing-view, #view-login{--ty-k:1.0625;--ty-min:14px;--ty-body:17px;--ty-lead:17.5px;--ty-display:40px;--ty-h1:36px;--ty-h2:22px;--ty-cap:14px;--ty-lbl:17px;--ty-val:29px;--ty-sub:16px;--ty-th:14.5px;--ty-td:16.5px;--ty-row:17.5px;--ty-small:16px;--ty-pill:14px;--ty-tab:16.5px;--ty-btn:16.5px;--ty-nav:16.5px}\n'
  'html[data-ty] .marketing-view details.p2-compare > summary, html[data-ty] .marketing-view .mk-table td{font-size:calc(16px*var(--ty-k,1))}\n'
  'html[data-ty] .marketing-view .mk-table th{font-size:calc(16.5px*var(--ty-k,1))}\n'
  'html[data-ty] #view-login .back-link, html[data-ty] #view-login .tabs button, html[data-ty] #view-login .form-sub{font-size:calc(15.5px*var(--ty-k,1))}\n'
  'html[data-ty] #view-login h1.form-title{font-size:calc(24px*var(--ty-k,1))}\n'
  'html[data-ty] #view-login .field label{font-size:calc(16px*var(--ty-k,1))}\n'
  'html[data-ty] #view-login .field input{font-size:calc(16.5px*var(--ty-k,1))}\n'
  'html[data-ty] #view-login p.fine{font-size:calc(15px*var(--ty-k,1))}\n'
  '@media (max-width:760px){ html.nf-phone .marketing-view, html.nf-phone #view-login{--ty-k:.92;--ty-min:13px;--ty-body:15.5px;--ty-lead:15px;--ty-display:24px;--ty-h1:25px;--ty-h2:18.5px;--ty-cap:13px;--ty-lbl:14px;--ty-val:22px;--ty-sub:13.5px;--ty-th:13px;--ty-td:14.5px;--ty-row:15.5px;--ty-small:13.5px;--ty-pill:13px;--ty-tab:14.5px;--ty-btn:15px;--ty-nav:15px} }\n')
i = t.index('</style>'); t = t[:i] + MKT_VARS + t[i:]
S['text'] = t
print('six text sizes: snapped', n, 'font-size values, left', kept, 'as they were;', k, 'shorthand checked')
