# Builds design-lab/r51: a.html, b.html, c.html (full pages, every section labelled) and index.html (choose, compare a section, pick per section).
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import *
import va, vb, vc

OUT = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'design-lab', 'r51')
os.makedirs(OUT, exist_ok=True)
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap">'
VERS = [('A', 'Sunlit', 'a', va, 'va', '#1F6B45', 'White and airy, soft mint and sunshine glows, green ink. Closest to the old page, with more pop.'),
        ('B', 'Notebook', 'b', vb, 'vb', '#1D4ED8', 'Warm paper, highlighter, sticky notes and handwriting in Taglish. Playful and very local.'),
        ('C', 'Bento Bright', 'c', vc, 'vc', '#7C3AED', 'Clean white with pastel colour washes, a live grid of tiles and gradient headlines. Modern and techy.')]
LAB_GO = r'''
document.addEventListener('click', function(e){ var a = e.target.closest('[data-go]'); if(!a) return; e.preventDefault();
  var g = a.getAttribute('data-go'), site = '../../'; var url = g === 'start' || g === 'login' ? site + '#login' : g === 'demo' ? site : site + '#' + g;
  if(window.self !== window.top) return; window.open(url, '_blank'); });
document.addEventListener('click', function(e){ var a = e.target.closest('a[href^="#"]'); if(!a) return; var t = document.querySelector(a.getAttribute('href')); if(!t) return; e.preventDefault(); var nav = document.querySelector('.a-nav,.b-nav,.c-nav'); window.scrollTo({top: t.getBoundingClientRect().top + scrollY - (nav ? nav.offsetHeight : 0) - (document.querySelector('.lab-bar') ? 44 : 0), behavior: 'smooth'}); });
'''

import re
def kern(html):
    # the headline font draws a wide gap before a period; pull each headline period in a little
    return re.sub(r'<(h1|h2)([^>]*)>(.*?)</\1>', lambda m: '<%s%s>%s</%s>' % (m.group(1), m.group(2), re.sub(r'(?<=[A-Za-z])\.(?=<|$|\s)', '<i class="pd">.</i>', m.group(3)), m.group(1)), html, flags=re.S)
def page(V, name, f, mod, root, color, desc):
    body = kern(mod.build(lab=True))
    others = ' '.join(f'<a href="{x[2]}.html">Version {x[0]}</a>' for x in VERS if x[0] != V)
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Nifti landing · Version {V} {name}</title><meta name="robots" content="noindex">{FONTS}
<style>html{{scroll-behavior:auto}}body{{margin:0;background:#FFFFFF}}{MOCK_CSS}{LAB_CSS}{mod.CSS}</style></head>
<body data-v="{V}"><div class="lab-bar" style="--lab:{color}"><span class="v">{V}</span><b>Version {V} · {name}</b><span style="color:#6B7280;font-weight:500">Each section has a label like {V}3. Mix and match by label.</span><span style="margin-left:auto;display:flex;gap:14px"><a href="index.html">← All versions</a>{others}</span></div>
<div class="{root}">{body}</div><script>{JS}{LAB_GO}</script></body></html>'''
    open(os.path.join(OUT, f + '.html'), 'w', encoding='utf-8').write(html)

for v in VERS: page(*v)

secbtns = ''.join(f'<button type="button" data-s="{n}">{n}. {t}</button>' for n, t in SECTIONS)
picks = ''.join(f'<tr><td><b>{n}</b> {t}</td>' + ''.join(f'<td><label><input type="radio" name="p{n}" value="{x[0]}"><span style="--c:{x[5]}">{x[0]}</span></label></td>' for x in VERS) + f'<td><a href="#" data-cmp="{n}">compare</a></td></tr>' for n, t in SECTIONS)
cards = ''.join(f'''<a class="vcard" href="{x[2]}.html" style="--c:{x[5]}"><img src="img/{x[2]}_hero.png" alt="Version {x[0]} hero" loading="lazy"><div><span class="vb">{x[0]}</span><b>Version {x[0]} · {x[1]}</b><p>{x[6]}</p><em>Open full page →</em></div></a>''' for x in VERS)
index = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Nifti landing · 3 light versions</title><meta name="robots" content="noindex">{FONTS}
<style>
:root{{--ink:#0F172A;--muted:#475569;--line:#E5E7EB}}*{{box-sizing:border-box}}body{{margin:0;font:15px/1.5 Inter,system-ui,sans-serif;color:var(--ink);background:#F7F8FA}}
.wrap{{width:min(1200px,100%);margin:0 auto;padding:0 20px}}h1,h2{{font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:-.02em;margin:0}}
header{{background:#FFFFFF;border-bottom:1px solid var(--line);padding:34px 0 28px}}header h1{{font-size:clamp(28px,4vw,40px)}}header p{{margin:10px 0 0;color:var(--muted);font-size:17px;max-width:820px}}
.how{{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}}.how span{{background:#F1F5F9;border-radius:999px;padding:6px 12px;font-size:13.5px;font-weight:600}}
.vcards{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:28px 0}}
.vcard{{display:flex;flex-direction:column;border-radius:22px;overflow:hidden;background:#FFFFFF;border:1px solid var(--line);color:inherit;text-decoration:none;transition:transform .2s,box-shadow .2s}}.vcard:hover{{transform:translateY(-4px);box-shadow:0 24px 40px -28px rgba(15,23,42,.5)}}
.vcard img{{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;border-bottom:1px solid var(--line);background:#F1F5F9}}.vcard>div{{padding:16px 18px 18px}}
.vb{{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--c);color:#FFFFFF;font-weight:800;margin-bottom:8px}}.vcard b{{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:19px}}.vcard p{{margin:6px 0 10px;color:var(--muted);font-size:14.5px}}.vcard em{{font-style:normal;font-weight:800;color:var(--c)}}
h2{{font-size:24px;margin-top:36px}}.sub{{color:var(--muted);margin:6px 0 14px}}
.seg{{display:flex;gap:8px;flex-wrap:wrap}}.seg button{{font:inherit;font-weight:700;font-size:14px;padding:8px 14px;border-radius:999px;border:1.5px solid var(--line);background:#FFFFFF;cursor:pointer}}.seg button.on{{background:var(--ink);color:#FFFFFF;border-color:var(--ink)}}
.dev{{display:inline-flex;margin:14px 0 0;border:1.5px solid var(--line);border-radius:999px;overflow:hidden;background:#FFFFFF}}.dev button{{font:inherit;font-weight:700;font-size:14px;padding:8px 16px;border:0;background:transparent;cursor:pointer}}.dev button.on{{background:#E0F2FE;color:#075985}}
.cmp{{display:grid;gap:22px;margin-top:18px}}.frame{{background:#FFFFFF;border:1px solid var(--line);border-radius:18px;overflow:hidden}}.frame h3{{margin:0;padding:12px 16px;font:800 15px/1.2 'Plus Jakarta Sans',sans-serif;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px}}
.frame h3 span{{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:8px;color:#FFFFFF;font-size:14px}}.frame h3 a{{margin-left:auto;font-size:13.5px;color:#1D4ED8;text-decoration:none}}
.frame .fw{{display:flex;justify-content:center;background:#F1F5F9}}.frame iframe{{display:block;width:100%;border:0;height:600px;background:#FFFFFF}}.phone .frame iframe{{width:390px;max-width:100%}}
table{{width:100%;border-collapse:collapse;background:#FFFFFF;border:1px solid var(--line);border-radius:16px;overflow:hidden}}td{{padding:10px 12px;border-bottom:1px solid var(--line);font-size:15px}}td:not(:first-child){{text-align:center;width:72px}}
td label{{cursor:pointer}}td input{{position:absolute;opacity:0}}td label span{{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:10px;border:1.5px solid var(--line);font-weight:800;color:var(--muted)}}td input:checked+span{{background:var(--c);border-color:var(--c);color:#FFFFFF}}
td a{{color:#1D4ED8;font-weight:700;font-size:13.5px;text-decoration:none}}.out{{display:flex;gap:10px;align-items:flex-start;margin:14px 0 60px;flex-wrap:wrap}}.out textarea{{flex:1;min-width:260px;min-height:120px;border:1.5px solid var(--line);border-radius:14px;padding:12px;font:14px/1.5 Inter,sans-serif}}
.out button{{font:inherit;font-weight:800;padding:12px 18px;border-radius:12px;border:0;background:#1F6B45;color:#FFFFFF;cursor:pointer}}
@media (max-width:900px){{.vcards{{grid-template-columns:1fr}}}}
</style></head><body>
<header><div class="wrap"><h1>Nifti landing page · 3 light versions</h1>
<p>No dark backgrounds anywhere. Each version has the same 12 sections in the same order, with labels like <b>A3</b>, <b>B7</b>, <b>C10</b>. Pick any section from any version and tell me your mix. The hour-by-hour “before and after Nifti” from the old page is section 7 in all three.</p>
<div class="how"><span>1 · Open a version and scroll</span><span>2 · Or compare one section side by side below</span><span>3 · Tick your picks and copy them to me</span></div></div></header>
<div class="wrap">
<div class="vcards">{cards}</div>
<h2>Compare one section across A, B and C</h2><p class="sub">Choose a section. The three versions show one under the other.</p>
<div class="seg" id="secs">{secbtns}</div><div class="dev" id="dev"><button type="button" class="on" data-w="pc">Computer</button><button type="button" data-w="phone">Phone</button></div>
<div class="cmp" id="cmp"></div>
<h2>Your picks</h2><p class="sub">Tick one version per section. Your picks stay in this browser.</p>
<table id="picks">{picks}</table>
<div class="out"><textarea id="out" readonly placeholder="Your picks show here"></textarea><button type="button" id="copy">Copy my picks</button></div>
</div>
<script>
var V = {[ [x[0], x[1], x[2], x[5]] for x in VERS ]};
var NAMES = {dict(SECTIONS)};
var cur = 1, dev = 'pc';
function show(n){{ cur = n; document.querySelectorAll('#secs button').forEach(function(b){{ b.classList.toggle('on', +b.dataset.s === n); }});
  var box = document.getElementById('cmp'); box.className = 'cmp' + (dev === 'phone' ? ' phone' : '');
  box.innerHTML = V.map(function(v){{ return '<div class="frame"><h3><span style="background:' + v[3] + '">' + v[0] + n + '</span>Version ' + v[0] + ' · ' + v[1] + ' — ' + NAMES[n] + '<a href="' + v[2] + '.html#" target="_blank">open full page</a></h3><div class="fw"><iframe title="Version ' + v[0] + ' section ' + n + '" data-v="' + v[0] + '" src="' + v[2] + '.html?only=' + n + (dev === 'phone' ? '&w=phone' : '') + '"></iframe></div></div>'; }}).join(''); }}
window.addEventListener('message', function(e){{ var d = e.data || {{}}; if(!d.v || +d.s !== cur) return; var f = document.querySelector('#cmp iframe[data-v="' + d.v + '"]'); if(f) f.style.height = Math.min(3000, d.h + 2) + 'px'; }});
document.getElementById('secs').addEventListener('click', function(e){{ var b = e.target.closest('button'); if(b) show(+b.dataset.s); }});
document.getElementById('dev').addEventListener('click', function(e){{ var b = e.target.closest('button'); if(!b) return; dev = b.dataset.w; document.querySelectorAll('#dev button').forEach(function(x){{ x.classList.toggle('on', x === b); }}); show(cur); }});
function out(){{ var lines = [], st = {{}}; Object.keys(NAMES).forEach(function(n){{ var c = document.querySelector('input[name="p' + n + '"]:checked'); if(c){{ st[n] = c.value; lines.push(n + '. ' + NAMES[n] + ': ' + c.value); }} }});
  document.getElementById('out').value = lines.length ? 'My landing page mix:\\n' + lines.join('\\n') : ''; try{{ localStorage.setItem('nifti-lp-picks', JSON.stringify(st)); }}catch(e){{}} }}
try{{ var st = JSON.parse(localStorage.getItem('nifti-lp-picks') || '{{}}'); Object.keys(st).forEach(function(n){{ var i = document.querySelector('input[name="p' + n + '"][value="' + st[n] + '"]'); if(i) i.checked = true; }}); }}catch(e){{}}
document.getElementById('picks').addEventListener('change', out);
document.getElementById('picks').addEventListener('click', function(e){{ var a = e.target.closest('[data-cmp]'); if(!a) return; e.preventDefault(); show(+a.dataset.cmp); document.getElementById('secs').scrollIntoView({{behavior: 'smooth'}}); }});
document.getElementById('copy').addEventListener('click', function(){{ var t = document.getElementById('out'); t.select(); try{{ navigator.clipboard.writeText(t.value); }}catch(e){{ document.execCommand('copy'); }} this.textContent = 'Copied ✓'; var b = this; setTimeout(function(){{ b.textContent = 'Copy my picks'; }}, 1600); }});
out(); show(1);
</script></body></html>'''
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(index)
print('built', OUT)
