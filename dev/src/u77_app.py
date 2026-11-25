# Round 77 (dashboard): every gray text black, owner view sizes and green, Getting paid made obvious,
# Money overview simplified, Pay-this-bill sizes, store pills, bank breakdown, 2307 checks.
import os, re, colorsys
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()

t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + rd('r77.css') + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", rd('r77.js') + "\nfunction renderSidebarForViewAsRole(){")

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
print('  r77 gray text: %d changed to black' % n)
# text-only colour variables that hold a gray
for _v in ['--body', '--faint', '--muted', '--nf68-muted', '--r72-text', '--lowstock', '--ty-ink2', '--st-ink']:
    S['text'] = re.sub(r'(?<![-\w])(' + re.escape(_v) + r')\s*:\s*#[0-9a-fA-F]{3,6}\b', r'\1:' + BLACK, S['text'])
# Getting paid, supplier bills: a short status so the due date fits on one line
P("r.pending > 0 ? ' · You paid ' + bkPeso(r.pending) + ', not confirmed by them yet' : ' · Not paid yet'", "r.pending > 0 ? ' · You paid ' + bkPeso(r.pending) + ', unconfirmed' : ' · Not paid yet'")
# Pay this bill: name the parts so the amount and due date can be laid out side by side
P("${t.of ? `<span>left of ${bkPeso(t.of)}</span>` : ''}", "${t.of ? `<span class=\"of\">left of ${bkPeso(t.of)}</span>` : ''}")
P("${days != null ? `<span class=\"${days < 0 ? 'late' : ''}\">${days < 0 ? `${-days} day", "${days != null ? `<span class=\"dd ${days < 0 ? 'late' : ''}\">${days < 0 ? `${-days} day")
# Online store: no "example numbers" note under the three numbers
P("${k.demo ? '<small class=\"nf49-ex\">Example numbers for the demo shop.</small>' : ''}", "")
# phone Selling/Buying switch: count the new customer cards on Getting paid
P("const count = h => { const n = h.querySelectorAll('.nfo-po').length || h.querySelectorAll('table.nf25-t tbody tr:not(.nf25-g), table.nf24-tb tbody tr').length; return n; };",
  "const count = h => { const n = h.querySelectorAll('.nfo-po').length || h.querySelectorAll('.nf77-cu').length || h.querySelectorAll('table.nf25-t tbody tr:not(.nf25-g), table.nf24-tb tbody tr').length; return n || ''; };")
# Delivery orders: the selling total includes delivered orders not billed yet, so it says "to collect", not "owed to you"
P("<small>${sell ? 'owed to you' : 'you owe'}</small>", "<small>${sell ? 'to collect, incl. not billed' : 'you owe'}</small>", 2)
# Tax books: the buying side said "No supplier bills" while it listed one (only matched boxes were checked); gross sales were labelled "before tax"
P("const allZero = cfg.empty && tiles.length && (pills.length ? pills.every(q => nf43Zero(q.v)) : tiles.every(t => nf43Zero(nf43Read(t).v)));",
  "const allZero = cfg.empty && tiles.length && tiles.every(t => nf43Zero(nf43Read(t).v));")
P("[/^Sales \\(gross\\)/i, x => ({t: 'Sales before tax', tone: 'blu', ic: 'note', v: x.v})],",
  "[/^Sales \\(gross\\)/i, x => ({t: 'Sales, VAT included', tone: 'blu', ic: 'note', v: x.v})],\n    [/^Purchases \\(gross\\)/i, x => ({t: 'Purchases, VAT included', tone: 'blu', ic: 'note', v: x.v})],\n    [/^VAT you paid/i, x => ({t: 'VAT you paid', tone: 'blu', ic: 'pct', v: x.v})],")
P("[/^VAT-exempt/i, x => ({t: 'VAT-free sales', tone: 'blu', ic: 'pct', v: x.v})],", "[/^VAT-exempt/i, x => ({t: 'VAT-free (exempt)', tone: 'blu', ic: 'pct', v: x.v})],")
