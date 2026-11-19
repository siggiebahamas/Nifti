# Version C, "Bento Bright": clean white, pastel colour washes, a live bento grid, gradient type.
from common import *

def sec(n, inner, cls='', lab=True, sid=None):
    tag = f'<span class="lab-tag"><b>C{n}</b>{SNAME[n]}</span>' if lab else ''
    return f'<section class="c-sec {cls}" data-s="{n}"{f" id={sid}" if sid else ""}>{tag}{inner}</section>\n'

TINT = ['mint', 'sun', 'sky', 'lilac', 'rose', 'lime']

def build(lab=True, brand='<b class="c-word">Nifti</b>'):
    h = []
    h.append(f'''<nav class="c-nav"><div class="c-in">{brand}
  <div class="c-links"><a href="#cTour">Features</a><a href="#cAi">AI tools</a><a href="#cDay">Your day</a><a href="#cPrice">Pricing</a></div>
  <div class="c-cta"><a class="c-login" data-go="login">Log in</a><a class="c-btn c-btn-g c-btn-sm" data-go="start">Start free</a></div></div></nav>''')
    # 1 intro: centered headline + bento grid
    h.append(sec(1, f'''<div class="c-mesh"></div><div class="c-in">
  <div class="c-hero-t"><span class="c-eyebrow">{ic('spark', 16)}Made for Philippine shops, distributors and suppliers</span>
    <h1>Your whole business.<br><span class="c-grad">One bright little app.</span></h1>
    <p class="c-lead">Viber orders, utang, stock, your cash drawer and your books, all in one place on your phone. Nifti chases payments, warns you before stock runs out, and keeps the books while you sell. <b>Your customers don't need an app.</b></p>
    <div class="c-hcta"><a class="c-btn c-btn-g c-btn-lg" data-go="start">Start free {ic('arrow', 20)}</a><a class="c-btn c-btn-w c-btn-lg" data-go="demo">{ic('play', 20)}Open the demo shop</a></div>
    <ul class="c-ticks"><li>No card needed</li><li>Free plan for good</li><li>Works on any phone</li></ul></div>
  <div class="c-bento" aria-hidden="true">
    <div class="c-t t-chat mint"><small>{ic('chat', 16)} New order from Viber</small><div class="c-typing"><span class="c-b1">Boss, 10 sako semento tsaka 5 rolls wire</span><span class="c-b2"><b>Order #1042</b> · Cement × 10, Wire × 5 <em>₱4,880</em></span></div></div>
    <div class="c-t t-owed sun"><small>{ic('cash', 16)} Owed to you</small><b class="c-count">₱84,200</b><span>3 customers · reminders on</span></div>
    <div class="c-t t-stock sky"><small>{ic('box', 16)} What runs out</small><div class="c-bars"><div><span>Wire 12ga</span><i style="--w:8%" class="r"></i></div><div><span>Cement 40kg</span><i style="--w:13%" class="r"></i></div><div><span>Rods 3.2mm</span><i style="--w:45%" class="y"></i></div><div><span>Rebar 12mm</span><i style="--w:100%" class="g"></i></div></div></div>
    <div class="c-t t-drawer lilac"><small>{ic('drawer', 16)} Cash drawer</small><b>Matched ✓</b><span>₱18,450 counted by Joy</span></div>
    <div class="c-t t-store rose"><small>{ic('store', 16)} Online store</small><b>5 orders today</b><span>GCash · Maya · COD</span></div>
    <div class="c-t t-nb lime"><small>{ic('pen', 16)} Notebook read</small><div class="c-nbl"><span class="hw">Mang Bert 5,700</span><span class="ok">✓ Mang Bert Construction ₱5,700</span></div></div>
  </div></div>''', 'c-hero', lab))
    # 2 works with
    w = ''.join(f'<span>{x}</span>' for x in WORKS)
    h.append(sec(2, f'<div class="c-in c-works"><p>Works with what you already use</p><div class="c-logos">{w}</div></div>', 'c-worksec', lab))
    # 3 benefits bento
    cards = ''.join(f'<div class="c-ben {TINT[i]} rv{" big" if i in (0, 1) else ""}"><span class="c-ico">{ic(k, 26)}</span><h3>{t}</h3><p>{d}</p></div>' for i, (k, t, d) in enumerate(BENEFITS))
    h.append(sec(3, f'''<div class="c-in"><div class="c-head rv"><span class="c-k">Benefits</span><h2>The jobs that eat your day, <span class="c-grad">done for you.</span></h2></div><div class="c-bens">{cards}</div></div>''', '', lab))
    # 4 tour: list on the left, sticky preview on the right
    items = ''.join(f'<button type="button" role="tab" data-tab="{i}" class="c-item"><span class="c-iic {TINT[i % 6]}">{ic(f[2], 20)}</span><span><b>{f[1]}</b><small>{f[4]}</small></span></button>' for i, f in enumerate(FEATURES))
    panels = ''.join(f'''<div class="c-panel" role="tabpanel" data-panel="{i}"{'' if i == 0 else ' hidden'}><div class="c-pv {TINT[i % 6]}">{M[f[0]]}</div><div class="c-pt"><span class="c-tag {f[3]}">{TAGNAME[f[3]]}</span><h3>{f[4]}</h3><p>{f[5]}</p>
      <ul class="c-list">{''.join(f'<li>{b}</li>' for b in f[6])}</ul></div></div>''' for i, f in enumerate(FEATURES))
    h.append(sec(4, f'''<div class="c-in"><div class="c-head rv"><span class="c-k">Everything in one app</span><h2>From the first order <span class="c-grad">to money in your hand.</span></h2><p>Pick anything on the left. Everything here is in the app today.</p></div>
  <div data-tabs class="c-tour"><div class="c-items" role="tablist">{items}</div><div class="c-stage">{panels}</div></div></div>''', 'c-soft', lab, 'cTour'))
    # 5 AI
    vis = ['<span class="hw">Mang Bert ..... 5,700</span><span class="ar">↓</span><span class="cl">Mang Bert Construction <b>₱5,700</b></span>',
           '<span class="bub">10 sako semento, 5 rolls wire</span><span class="ar">↓</span><span class="cl">Order · <b>₱4,880</b></span>',
           '<span class="mic"><i></i><i></i><i></i><i></i><i></i></span><span class="ar">↓</span><span class="cl">“Sale ngayong Sabado! Rebar ₱65 na lang…”</span>',
           '<span class="pp"><span class="ph b"></span><span class="ar">→</span><span class="ph a"></span></span>']
    ai = ''.join(f'<div class="c-ai rv"><div class="c-aiin"><div class="c-aiv v{i}">{vis[i]}</div><div><h3>{t}</h3><p>{d}</p></div></div></div>' for i, (k, t, d) in enumerate(AI))
    h.append(sec(5, f'''<div class="c-in"><div class="c-head rv"><span class="c-k">AI tools</span><h2>You run the business. <span class="c-grad">Nifti does the typing.</span></h2><p>Smart tools that save you hours every week, and always let you check before anything is saved.</p></div><div class="c-ais">{ai}</div></div>''', '', lab, 'cAi'))
    # 6 no app: three steps + phones
    h.append(sec(6, f'''<div class="c-in"><div class="c-head rv"><span class="c-k">No app for your customers</span><h2>They tap a link. <span class="c-grad">That's it.</span></h2><p>Your customers and suppliers get a link by Viber or SMS and open it on any phone. No download, no sign-up, no password.</p></div>
  <div class="c-flow"><div class="c-steps3"><div class="rv"><span>1</span><b>You send a link</b><p>An order, a statement, or a bill. Right from Nifti, by Viber or SMS.</p></div><div class="rv"><span>2</span><b>They tap it</b><p>It opens on any phone. They confirm the order or see what they owe.</p></div><div class="rv"><span>3</span><b>You see it</b><p>Confirmed, or paid with a reference number. If they join Nifti later, every order is waiting.</p></div></div>
  <div class="c-link-v rv" aria-hidden="true">{LINK_PHONES}</div></div></div>''', 'c-soft', lab))
    # 7 day: time cards in a row
    cards = ''.join(f'''<div class="c-dc rv s-{sky}"><div class="c-dtop"><span>{ic(sky, 20)}</span><div><b>{t}</b><small>{lbl}</small></div></div>
      <div class="c-dbef"><span class="x">✕</span><span>{bt}</span></div><div class="c-darr">{ic('arrow', 16)}</div>
      <div class="c-daft"><span class="ia">{ic(ai_, 18)}</span><b>{at}</b><em>{ar}</em></div></div>''' for (t, lbl, sky, bi, bt, ai_, at, ar) in DAY)
    sm = ''.join(f'<div class="rv"><span>{ic(k, 20)}</span><p><b>{t}</b> {d}</p></div>' for k, t, d in DAY_SUM)
    h.append(sec(7, f'''<div class="c-in"><div class="c-head rv"><span class="c-k">Your day at a glance</span><h2>Your day, <span class="c-grad">before and after Nifti.</span></h2><p>From a hard day to an easy one.</p></div>
  <div class="c-days">{cards}</div><div class="c-dsum">{sm}</div></div>''', 'c-day', lab, 'cDay'))
    # 8 facts
    fx = ''.join(f'<div class="c-fact {TINT[i]} rv"><b>{n}</b><span>{d}</span></div>' for i, (n, d) in enumerate(FACTS))
    h.append(sec(8, f'<div class="c-in c-facts">{fx}</div>', 'c-factsec', lab))
    # 9 trust
    tr = ''.join(f'<div class="c-tr rv"><span class="c-ico {TINT[i + 2]}">{ic(k, 24)}</span><div><h3>{t}</h3><p>{d}</p></div></div>' for i, (k, t, d) in enumerate(TRUST))
    h.append(sec(9, f'''<div class="c-in"><div class="c-head rv"><span class="c-k">Safe and yours</span><h2>Your records are yours. <span class="c-grad">Full stop.</span></h2></div><div class="c-trs">{tr}</div></div>''', 'c-soft', lab))
    # 10 pricing
    def plan(p):
        eqm = 'Free for good' if p['k'] == 'free' else f"or {peso(p['y'])} a year, 2 months free"
        eqy = 'Free for good' if p['k'] == 'free' else f"Like {peso(round(p['y'] / 12))} a month · 2 months free"
        per_m, per_y = ('forever', 'forever') if p['k'] == 'free' else ('/ month', '/ year')
        btn = {'free': '<a class="c-btn c-btn-w" data-go="start">Start free</a>', 'pro': '<a class="c-btn c-btn-g" data-go="start" data-plan="pro">Start with Pro</a>', 'business': '<a class="c-btn c-btn-w" data-go="start" data-plan="business">Start with Business</a>'}[p['k']]
        return f'''<div class="c-plan {p['k']} rv"><div class="c-pin">{'<span class="c-flag">Most shops</span>' if p['k'] == 'pro' else ''}<h3>{p['name']}</h3><p class="who">{p['who']}</p>
      <div class="amt"><b data-m="{peso(p['m'])}" data-y="{peso(p['y'])}">{peso(p['m'])}</b><span data-m="{per_m}" data-y="{per_y}">{per_m}</span></div><div class="eq" data-m="{eqm}" data-y="{eqy}">{eqm}</div>
      {btn}<ul>{''.join(f'<li>{f}</li>' for f in p['f'])}</ul></div></div>'''
    steps = ''.join(f'<div><span>{i + 1}</span><div><b>{t}</b><p>{d}</p></div></div>' for i, (t, d) in enumerate(PAYSTEPS))
    h.append(sec(10, f'''<div class="c-in" data-prices><div class="c-head rv"><span class="c-k">Pricing plans</span><h2>Start free. <span class="c-grad">Upgrade when it pays for itself.</span></h2><p>No card, no contract. Pay by GCash, Maya or bank QR. Stop any time and keep your records.</p></div>
  <div class="c-cyc"><button type="button" class="on" data-cycle="monthly">Monthly</button><button type="button" data-cycle="yearly">Yearly <em>−2 months</em></button></div>
  <div class="c-plans">{''.join(plan(p) for p in PLANS)}</div><div class="c-pay rv"><b>How paying works</b><div class="c-psteps">{steps}</div></div></div>''', '', lab, 'cPrice'))
    # 11 faq
    half = (len(FAQ) + 1) // 2
    col = lambda arr, o: ''.join(f'<details{" open" if i + o == 0 else ""}><summary>{q}</summary><p>{a}</p></details>' for i, (q, a) in enumerate(arr))
    h.append(sec(11, f'''<div class="c-in"><div class="c-head rv"><span class="c-k">Questions</span><h2>Questions people <span class="c-grad">usually ask.</span></h2><p>Something else? Start free and message us from inside the app.</p></div>
  <div class="c-faq"><div>{col(FAQ[:half], 0)}</div><div>{col(FAQ[half:], 1)}</div></div></div>''', 'c-soft', lab))
    # 12 final
    h.append(sec(12, f'''<div class="c-in"><div class="c-final rv"><div class="c-mesh2"></div><h2>Your next order could be<br><span class="c-grad">your first one in Nifti.</span></h2>
    <p>Set up your shop for free. Or look around the demo shop first, no sign-up needed.</p>
    <div class="c-hcta"><a class="c-btn c-btn-g c-btn-lg" data-go="start">Start free {ic('arrow', 20)}</a><a class="c-btn c-btn-w c-btn-lg" data-go="demo">Open the demo shop</a></div></div></div>
  <footer class="c-foot"><div class="c-in">{brand}<div class="c-fl"><a href="#cTour">Features</a><a data-go="pricing">Pricing</a><a data-go="privacy">Privacy &amp; Security</a><a data-go="terms">Terms</a><a data-go="login">Log in</a></div><small>Made in the Philippines for the businesses that keep it running.</small></div></footer>''', 'c-end', lab))
    return '\n'.join(h)

CSS = r'''
.vc{--ink:#0F172A;--g:#059669;--g2:#047857;--muted:#475569;--line:#E7EAF0;--soft:#F8FAFC;
  --mint:#D1FAE5;--sun:#FEF3C7;--sky:#E0F2FE;--lilac:#EDE9FE;--rose:#FCE7F3;--lime:#ECFCCB;
  font-family:Inter,system-ui,sans-serif;color:var(--ink);background:#FFFFFF;overflow-x:clip;-webkit-font-smoothing:antialiased;--lab:#7C3AED}
.vc *{box-sizing:border-box}.vc h1,.vc h2,.vc h3{font-family:'Plus Jakarta Sans',Inter,sans-serif;margin:0;letter-spacing:-.025em}.vc p{margin:0}.vc a{cursor:pointer;text-decoration:none;color:inherit}
.vc .c-in{width:min(1200px,100%);margin:0 auto;padding:0 24px}
.vc .c-grad{background:linear-gradient(95deg,#059669 0%,#0EA5E9 55%,#8B5CF6 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.vc .c-nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.78);backdrop-filter:saturate(180%) blur(16px);-webkit-backdrop-filter:saturate(180%) blur(16px);border-bottom:1px solid rgba(15,23,42,.06)}
.vc .c-nav .c-in{display:flex;align-items:center;gap:28px;height:66px}
.vc .brand{display:flex;align-items:center;gap:10px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:22px}.vc .brand img{height:30px;width:auto}.vc .c-word{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px}
.vc .c-links{display:flex;gap:6px;margin-left:10px;padding:4px;border-radius:999px;background:var(--soft);border:1px solid var(--line)}.vc .c-links a{font-weight:600;font-size:15px;color:var(--muted);padding:7px 14px;border-radius:999px}.vc .c-links a:hover{background:#FFFFFF;color:var(--ink)}
.vc .c-cta{margin-left:auto;display:flex;align-items:center;gap:16px}.vc .c-login{font-weight:700;font-size:15px}
.vc .c-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border-radius:999px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;transition:transform .15s,box-shadow .2s;white-space:nowrap}
.vc .c-btn:hover{transform:translateY(-2px)}.vc .c-btn-sm{padding:10px 18px;font-size:15px}.vc .c-btn-lg{padding:16px 28px;font-size:17px}
.vc .c-btn-g{color:#FFFFFF;background:linear-gradient(135deg,#10B981,#059669 55%,#0D9488);box-shadow:0 12px 28px -12px rgba(5,150,105,.7),inset 0 1px 0 rgba(255,255,255,.3)}
.vc .c-btn-w{background:#FFFFFF;color:var(--ink);border:1.5px solid #D9DEE7;box-shadow:0 6px 16px -12px rgba(15,23,42,.4)}
/* hero */
.vc .c-hero{position:relative;padding:70px 0 70px;overflow:hidden;isolation:isolate}
.vc .c-mesh{position:absolute;inset:0;z-index:-1;background:radial-gradient(600px 360px at 15% 0%,#D1FAE5 0%,transparent 70%),radial-gradient(520px 340px at 85% 5%,#E0F2FE 0%,transparent 70%),radial-gradient(560px 380px at 70% 75%,#EDE9FE 0%,transparent 70%),radial-gradient(480px 320px at 20% 85%,#FEF3C7 0%,transparent 70%),#FFFFFF;animation:cMesh 16s ease-in-out infinite alternate}
.vc .c-hero-t{text-align:center;max-width:900px;margin:0 auto}
.vc .c-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.8);border:1px solid var(--line);font-size:14.5px;font-weight:700;color:var(--g2);box-shadow:0 6px 18px -12px rgba(15,23,42,.35)}
.vc .c-hero h1{margin-top:22px;font-size:clamp(44px,6.4vw,84px);line-height:1;font-weight:800;letter-spacing:-.04em}
.vc .c-lead{margin:22px auto 0;max-width:680px;font-size:clamp(17px,1.45vw,19.5px);line-height:1.6;color:var(--muted)}.vc .c-lead b{color:var(--ink)}
.vc .c-hcta{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:32px}
.vc .c-ticks{list-style:none;display:flex;flex-wrap:wrap;justify-content:center;gap:10px 22px;padding:0;margin:22px 0 0}.vc .c-ticks li{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:var(--muted)}.vc .c-ticks li::before{content:"✓";display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--mint);color:var(--g2);font-size:12px;font-weight:900}
.vc .c-bento{margin-top:56px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:150px;gap:16px}
.vc .c-t{position:relative;border-radius:26px;padding:18px 20px;border:1px solid rgba(15,23,42,.06);box-shadow:0 20px 40px -30px rgba(15,23,42,.45);overflow:hidden;display:flex;flex-direction:column;gap:6px;text-align:left;animation:cPop .7s both}
.vc .c-t small{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:var(--muted)}.vc .c-t b{font-family:'Plus Jakarta Sans',sans-serif;font-size:32px;letter-spacing:-.02em}.vc .c-t>span{font-size:14px;color:var(--muted);font-weight:600}
.vc .mint{background:var(--mint)}.vc .sun{background:var(--sun)}.vc .sky{background:var(--sky)}.vc .lilac{background:var(--lilac)}.vc .rose{background:var(--rose)}.vc .lime{background:var(--lime)}
.vc .t-chat{grid-column:span 2;grid-row:span 2;animation-delay:.05s}.vc .t-owed{animation-delay:.12s}.vc .t-stock{grid-row:span 2;animation-delay:.19s}.vc .t-drawer{animation-delay:.26s}.vc .t-store{animation-delay:.33s}.vc .t-nb{grid-column:span 3;animation-delay:.4s}
.vc .c-typing{display:grid;gap:12px;margin-top:14px}
.vc .c-b1{justify-self:start;max-width:85%;background:#FFFFFF;border-radius:18px 18px 18px 6px;padding:12px 16px;font-size:16px;box-shadow:0 8px 18px -12px rgba(15,23,42,.4);animation:cIn .5s .6s both}
.vc .c-b2{justify-self:end;max-width:90%;background:#FFFFFF;border:1.5px solid #6EE7B7;border-radius:18px 18px 6px 18px;padding:12px 16px;font-size:15px;box-shadow:0 12px 24px -14px rgba(5,150,105,.6);animation:cIn .5s 1.4s both}
.vc .c-b2 b{color:var(--g2)}.vc .c-b2 em{font-style:normal;font-weight:800;margin-left:6px}
.vc .c-bars{display:grid;gap:12px;margin-top:8px}.vc .c-bars div{display:grid;gap:5px}.vc .c-bars span{font-size:13.5px;font-weight:700}
.vc .c-bars i{display:block;height:9px;border-radius:9px;background:rgba(255,255,255,.8);position:relative;overflow:hidden}.vc .c-bars i::after{content:"";position:absolute;inset:0;width:var(--w);border-radius:9px;animation:cBar 1.4s .6s both}
.vc .c-bars i.r::after{background:#EF4444}.vc .c-bars i.y::after{background:#EAB308}.vc .c-bars i.g::after{background:#22C55E}
.vc .c-nbl{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:6px}.vc .c-nbl .hw{font-family:Caveat,cursive;font-size:28px;color:#1E3A8A}.vc .c-nbl .ok{font-size:14.5px;font-weight:700;background:#FFFFFF;border-radius:12px;padding:8px 12px;color:var(--g2);animation:cIn .5s 1.8s both}
/* works */
.vc .c-worksec{padding:24px 0 30px}.vc .c-works{text-align:center}.vc .c-works p{font-size:13.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94A3B8}
.vc .c-logos{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 34px;margin-top:14px}.vc .c-logos span{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:19px;color:#64748B}
/* sections */
.vc .c-sec{position:relative;padding:100px 0}.vc .c-soft{background:linear-gradient(180deg,#F8FAFC,#F5F7FB)}
.vc .c-head{text-align:center;max-width:860px;margin:0 auto 50px}
.vc .c-k{display:inline-block;font-size:13.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:7px 14px;border-radius:999px;background:linear-gradient(90deg,#D1FAE5,#E0F2FE,#EDE9FE);color:#0F766E}
.vc .c-head h2{margin-top:18px;font-size:clamp(32px,4.4vw,54px);line-height:1.06;font-weight:800}.vc .c-head p{margin-top:14px;font-size:clamp(16.5px,1.35vw,19px);line-height:1.6;color:var(--muted)}
/* benefits */
.vc .c-bens{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.vc .c-ben{border-radius:26px;padding:26px;border:1px solid rgba(15,23,42,.05);transition:transform .25s}.vc .c-ben:hover{transform:translateY(-6px)}.vc .c-ben.big{grid-column:span 2}
.vc .c-ico{display:grid;place-items:center;width:54px;height:54px;border-radius:17px;background:#FFFFFF;color:var(--g2);box-shadow:0 8px 18px -12px rgba(15,23,42,.4)}
.vc .c-ben h3{margin-top:18px;font-size:21px}.vc .c-ben.big h3{font-size:26px}.vc .c-ben p{margin-top:8px;font-size:15.5px;line-height:1.55;color:var(--muted)}.vc .c-ben.big p{font-size:17px;max-width:460px}
/* tour */
.vc .c-tour{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:26px;align-items:start}
.vc .c-items{display:grid;gap:8px}
.vc .c-item{display:flex;align-items:center;gap:14px;text-align:left;font:inherit;padding:12px 14px;border-radius:18px;border:1.5px solid transparent;background:transparent;cursor:pointer;color:var(--ink);transition:all .18s}
.vc .c-item:hover{background:#FFFFFF}.vc .c-item.on{background:#FFFFFF;border-color:#A7F3D0;box-shadow:0 16px 30px -22px rgba(5,150,105,.6)}
.vc .c-iic{flex:0 0 42px;height:42px;display:grid;place-items:center;border-radius:13px;color:var(--g2)}
.vc .c-item b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:16.5px}.vc .c-item small{display:block;font-size:13.5px;color:var(--muted);line-height:1.35}
.vc .c-stage{position:sticky;top:90px;border-radius:30px;background:#FFFFFF;border:1px solid var(--line);box-shadow:0 30px 60px -40px rgba(15,23,42,.5);padding:24px}
.vc .c-panel[hidden]{display:none}.vc .c-panel.on .c-pv,.vc .c-panel.on .c-pt{animation:cIn .45s ease both}
.vc .c-pv{border-radius:22px;padding:26px;display:flex;justify-content:center}.vc .c-pt{padding:22px 10px 6px}
.vc .c-tag{display:inline-block;font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:5px 12px;border-radius:999px}.vc .c-tag.free{background:var(--mint);color:#065F46}.vc .c-tag.pro{background:var(--sky);color:#075985}.vc .c-tag.biz{background:var(--lilac);color:#5B21B6}.vc .c-tag.ai{background:linear-gradient(90deg,#FEF3C7,#D1FAE5);color:#065F46}
.vc .c-pt h3{margin-top:12px;font-size:clamp(24px,2.3vw,30px);line-height:1.15}.vc .c-pt>p{margin-top:10px;font-size:16.5px;line-height:1.6;color:var(--muted)}
.vc .c-list{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:10px}.vc .c-list li{position:relative;padding-left:30px;font-size:15.5px;line-height:1.5;font-weight:500}
.vc .c-list li::before{content:"";position:absolute;left:0;top:2px;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#10B981,#0EA5E9) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 12 4 4 8-8'/%3E%3C/svg%3E") center/12px no-repeat}
/* AI */
.vc .c-ais{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.vc .c-ai{border-radius:28px;padding:2px;background:linear-gradient(135deg,#6EE7B7,#7DD3FC,#C4B5FD,#FDE68A);transition:transform .25s}.vc .c-ai:hover{transform:translateY(-6px)}
.vc .c-aiin{height:100%;border-radius:26px;background:#FFFFFF;padding:18px;display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:center}
.vc .c-ai h3{font-size:21px}.vc .c-ai p{margin-top:8px;font-size:15.5px;line-height:1.55;color:var(--muted)}
.vc .c-aiv{height:160px;border-radius:18px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:7px;padding:12px;text-align:center;overflow:hidden}
.vc .c-aiv.v0{background:var(--sun)}.vc .c-aiv.v1{background:var(--lilac)}.vc .c-aiv.v2{background:var(--mint)}.vc .c-aiv.v3{background:var(--sky)}
.vc .c-aiv .hw{font-family:Caveat,cursive;font-size:22px;color:#1E3A8A}.vc .c-aiv .ar{font-weight:900;color:var(--g2);animation:cNudge 1.6s ease-in-out infinite}
.vc .c-aiv .cl{font-size:12.5px;font-weight:700;background:#FFFFFF;padding:6px 10px;border-radius:10px;line-height:1.35}.vc .c-aiv .cl b{color:var(--g2)}
.vc .c-aiv .bub{font-size:12.5px;background:#7C3AED;color:#FFFFFF;padding:7px 11px;border-radius:14px 14px 14px 4px}
.vc .c-aiv .mic{display:flex;gap:4px;align-items:center;height:32px}.vc .c-aiv .mic i{width:6px;border-radius:4px;background:var(--g);animation:cWave 1s ease-in-out infinite}
.vc .c-aiv .mic i:nth-child(1){height:12px}.vc .c-aiv .mic i:nth-child(2){height:24px;animation-delay:.1s}.vc .c-aiv .mic i:nth-child(3){height:32px;animation-delay:.2s}.vc .c-aiv .mic i:nth-child(4){height:20px;animation-delay:.3s}.vc .c-aiv .mic i:nth-child(5){height:10px;animation-delay:.4s}
.vc .c-aiv .pp{display:flex;align-items:center;gap:10px}.vc .c-aiv .ph{width:60px;height:74px;border-radius:12px;position:relative}.vc .c-aiv .ph.b{background:linear-gradient(160deg,#A8A29E,#D6D3D1 60%,#78716C);transform:rotate(-6deg);filter:saturate(.6)}
.vc .c-aiv .ph.a{background:#FFFFFF;box-shadow:0 10px 22px -8px rgba(14,165,233,.5)}.vc .c-aiv .ph::after{content:"";position:absolute;left:15px;right:15px;top:16px;bottom:14px;border-radius:7px;background:linear-gradient(180deg,#E7E5E4,#A8A29E)}
/* no app */
.vc .c-flow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px;align-items:center}
.vc .c-steps3{display:grid;gap:14px}.vc .c-steps3>div{position:relative;border-radius:22px;padding:20px 22px 20px 82px;background:#FFFFFF;border:1px solid var(--line)}
.vc .c-steps3 span{position:absolute;left:20px;top:20px;display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#10B981,#0EA5E9);color:#FFFFFF;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:20px}
.vc .c-steps3 b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:18px}.vc .c-steps3 p{margin-top:4px;font-size:15px;line-height:1.55;color:var(--muted)}
.vc .c-link-v{position:relative;height:500px;display:flex;justify-content:center;gap:20px;align-items:center}.vc .c-link-v .m-phone{flex:0 0 auto}.vc .c-link-v .k1{transform:translateY(-14px)}.vc .c-link-v .k2{transform:translateY(24px)}
/* day */
.vc .c-day{background:linear-gradient(180deg,#FFFFFF 0%,#FBFAFF 100%)}
.vc .c-days{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
.vc .c-dc{border-radius:24px;background:#FFFFFF;border:1px solid var(--line);box-shadow:0 20px 40px -32px rgba(15,23,42,.5);overflow:hidden;display:flex;flex-direction:column}
.vc .c-dtop{display:flex;gap:10px;align-items:center;padding:16px 16px 14px}.vc .c-dtop>span{flex:0 0 40px;height:40px;display:grid;place-items:center;border-radius:12px;background:rgba(255,255,255,.75)}
.vc .c-dtop b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:18px}.vc .c-dtop small{display:block;font-size:12.5px;font-weight:700;color:var(--muted);line-height:1.25}
.vc .s-sunrise .c-dtop{background:linear-gradient(135deg,#FEF3C7,#FDE68A)}.vc .s-sunrise .c-dtop>span{color:#B45309}
.vc .s-sun .c-dtop{background:linear-gradient(135deg,#E0F2FE,#BAE6FD)}.vc .s-sun .c-dtop>span{color:#0369A1}
.vc .s-sunset .c-dtop{background:linear-gradient(135deg,#FCE7F3,#FBCFE8)}.vc .s-sunset .c-dtop>span{color:#BE185D}
.vc .s-moon .c-dtop{background:linear-gradient(135deg,#EDE9FE,#DDD6FE)}.vc .s-moon .c-dtop>span{color:#6D28D9}
.vc .c-dbef{display:flex;gap:8px;align-items:flex-start;padding:14px 16px 6px;font-size:14.5px;color:#64748B;min-height:68px}.vc .c-dbef span:last-child{text-decoration:line-through;text-decoration-color:rgba(225,29,72,.6);text-decoration-thickness:2px}
.vc .c-dbef .x{flex:0 0 20px;height:20px;display:grid;place-items:center;border-radius:50%;background:#FFE4E6;color:#E11D48;font-size:11px;font-weight:900;text-decoration:none}
.vc .c-darr{align-self:center;color:var(--g);transform:rotate(90deg);margin:2px 0}
.vc .c-daft{margin:6px 12px 14px;padding:14px;border-radius:18px;background:linear-gradient(135deg,#ECFDF5,#F0F9FF);border:1px solid #A7F3D0;display:grid;gap:6px;flex:1}
.vc .c-daft .ia{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:#FFFFFF;color:var(--g2)}.vc .c-daft b{font-size:15.5px;line-height:1.3}
.vc .c-daft em{justify-self:start;font-style:normal;font-size:12.5px;font-weight:800;color:#065F46;background:#D1FAE5;border-radius:999px;padding:3px 10px}
.vc .c-dsum{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:28px}.vc .c-dsum>div{display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:999px;background:#FFFFFF;border:1px solid var(--line);font-size:15px;color:var(--muted)}
.vc .c-dsum span{color:var(--g2);display:grid}.vc .c-dsum b{color:var(--ink)}
/* facts */
.vc .c-factsec{padding:40px 0 90px}.vc .c-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.vc .c-fact{border-radius:26px;padding:26px 24px}.vc .c-fact b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(40px,4.4vw,58px);font-weight:800;letter-spacing:-.04em;line-height:1;background:linear-gradient(95deg,#047857,#0369A1);-webkit-background-clip:text;background-clip:text;color:transparent}
.vc .c-fact span{display:block;margin-top:10px;font-size:15.5px;font-weight:600;color:#334155;line-height:1.4}
/* trust */
.vc .c-trs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.vc .c-tr{display:flex;gap:18px;align-items:flex-start;border-radius:24px;padding:24px;background:#FFFFFF;border:1px solid var(--line)}
.vc .c-tr .c-ico{flex:0 0 54px;box-shadow:none}.vc .c-tr h3{font-size:19px}.vc .c-tr p{margin-top:6px;font-size:15.5px;line-height:1.55;color:var(--muted)}
/* pricing */
.vc .c-cyc{display:flex;width:max-content;max-width:100%;margin:0 auto 38px;padding:5px;border-radius:999px;background:var(--soft);border:1px solid var(--line)}
.vc .c-cyc button{font:inherit;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15.5px;padding:10px 22px;border-radius:999px;border:0;background:transparent;cursor:pointer;color:var(--muted)}.vc .c-cyc button em{font-style:normal;font-size:12.5px;margin-left:6px;color:var(--g2)}
.vc .c-cyc button.on{background:#FFFFFF;color:var(--ink);box-shadow:0 6px 14px -8px rgba(15,23,42,.4)}
.vc .c-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;align-items:stretch}
.vc .c-plan{border-radius:30px;padding:2px;background:var(--line)}.vc .c-plan.pro{background:conic-gradient(from var(--a,0deg),#10B981,#0EA5E9,#8B5CF6,#F59E0B,#10B981);animation:cSpin 6s linear infinite}
.vc .c-pin{height:100%;border-radius:28px;background:#FFFFFF;padding:28px 26px;display:flex;flex-direction:column}
.vc .c-flag{align-self:flex-start;font-size:12.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:999px;background:linear-gradient(90deg,#D1FAE5,#E0F2FE);color:#0F766E;margin-bottom:10px}
.vc .c-plan h3{font-size:22px}.vc .c-plan .who{margin-top:6px;font-size:15px;line-height:1.5;color:var(--muted);min-height:46px}
.vc .c-plan .amt{display:flex;align-items:baseline;gap:6px;margin-top:16px}.vc .c-plan .amt b{font-family:'Plus Jakarta Sans',sans-serif;font-size:52px;font-weight:800;letter-spacing:-.04em;line-height:1}.vc .c-plan .amt span{font-weight:700;color:var(--muted)}
.vc .c-plan .eq{font-size:13.5px;font-weight:700;color:var(--g2);min-height:20px;margin-top:6px}.vc .c-plan .c-btn{width:100%;margin-top:18px;padding:14px;font-size:16px}
.vc .c-plan ul{list-style:none;padding:0;margin:22px 0 0;display:grid;gap:10px}.vc .c-plan li{position:relative;padding-left:28px;font-size:15px;line-height:1.45}
.vc .c-plan li::before{content:"";position:absolute;left:0;top:1px;width:19px;height:19px;border-radius:50%;background:var(--mint) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23047857' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 12 4 4 8-8'/%3E%3C/svg%3E") center/11px no-repeat}
.vc .c-pay{margin-top:34px;border-radius:24px;padding:22px 26px;background:var(--soft);border:1px solid var(--line);display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center}.vc .c-pay>b{font-family:'Plus Jakarta Sans',sans-serif;font-size:18px}
.vc .c-psteps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.vc .c-psteps>div{display:flex;gap:10px}.vc .c-psteps span{flex:0 0 30px;height:30px;display:grid;place-items:center;border-radius:10px;background:#FFFFFF;border:1px solid var(--line);font-weight:800;color:var(--g2)}
.vc .c-psteps b{display:block;font-size:15px}.vc .c-psteps p{font-size:14px;color:var(--muted);line-height:1.5}
/* faq */
.vc .c-faq{display:grid;grid-template-columns:1fr 1fr;gap:14px}.vc .c-faq>div{display:grid;gap:14px;align-content:start}
.vc .c-faq details{border-radius:20px;background:#FFFFFF;border:1px solid var(--line)}.vc .c-faq details[open]{box-shadow:0 18px 34px -26px rgba(15,23,42,.5);border-color:#BAE6FD}
.vc .c-faq summary{list-style:none;cursor:pointer;padding:18px 56px 18px 22px;position:relative;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:16.5px}.vc .c-faq summary::-webkit-details-marker{display:none}
.vc .c-faq summary::after{content:"";position:absolute;right:20px;top:50%;width:10px;height:10px;border-right:2.5px solid var(--g2);border-bottom:2.5px solid var(--g2);transform:translateY(-70%) rotate(45deg);transition:transform .2s}.vc .c-faq details[open] summary::after{transform:translateY(-30%) rotate(-135deg)}
.vc .c-faq details p{padding:0 22px 20px;font-size:15.5px;line-height:1.6;color:var(--muted)}
/* final */
.vc .c-end{padding:90px 0 0}
.vc .c-final{position:relative;overflow:hidden;isolation:isolate;text-align:center;border-radius:40px;padding:84px 30px;border:1px solid var(--line)}
.vc .c-mesh2{position:absolute;inset:0;z-index:-1;background:radial-gradient(420px 260px at 10% 10%,#D1FAE5,transparent 70%),radial-gradient(420px 260px at 90% 20%,#E0F2FE,transparent 70%),radial-gradient(420px 260px at 50% 100%,#FEF3C7,transparent 70%),radial-gradient(360px 240px at 80% 90%,#FCE7F3,transparent 70%),#FFFFFF}
.vc .c-final h2{font-size:clamp(34px,5vw,62px);line-height:1.04}.vc .c-final p{margin:16px auto 0;max-width:560px;font-size:18px;line-height:1.6;color:var(--muted)}
.vc .c-foot{margin-top:60px;border-top:1px solid var(--line);padding:26px 0 40px}.vc .c-foot .c-in{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.vc .c-fl{display:flex;gap:22px;flex-wrap:wrap}.vc .c-fl a{font-weight:600;color:var(--muted);font-size:15px}.vc .c-foot small{margin-left:auto;font-size:14px;color:#94A3B8}
.vc .rv{opacity:0;transform:translateY(24px) scale(.985);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.8,.2,1)}.vc .rv.in{opacity:1;transform:none}
@property --a{syntax:'<angle>';initial-value:0deg;inherits:false}
@keyframes cSpin{to{--a:360deg}}@keyframes cMesh{0%{background-position:0 0}100%{background-position:0 0;filter:hue-rotate(12deg)}}
@keyframes cPop{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}@keyframes cIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes cBar{from{width:0}}@keyframes cNudge{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}@keyframes cWave{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1)}}
@media (prefers-reduced-motion:reduce){.vc *,.vc *::before,.vc *::after{animation:none !important;transition:none !important}.vc .rv{opacity:1;transform:none}}
@media (max-width:1080px){
  .vc .c-links{display:none}.vc .c-bento{grid-template-columns:repeat(2,minmax(0,1fr))}.vc .t-stock{grid-row:span 2}.vc .t-nb{grid-column:span 2}
  .vc .c-bens{grid-template-columns:repeat(2,minmax(0,1fr))}.vc .c-tour{grid-template-columns:1fr}.vc .c-items{grid-template-columns:repeat(3,minmax(0,1fr))}.vc .c-item small{display:none}.vc .c-stage{position:relative;top:auto;min-height:0}
  .vc .c-flow{grid-template-columns:1fr}.vc .c-days{grid-template-columns:repeat(5,minmax(230px,1fr));overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 4px 16px;margin:0 -24px;padding-left:24px;padding-right:24px}.vc .c-dc{scroll-snap-align:start}
  .vc .c-facts{grid-template-columns:repeat(2,1fr)}.vc .c-plans{grid-template-columns:1fr;max-width:520px;margin:0 auto}.vc .c-pay{grid-template-columns:1fr}.vc .c-faq{grid-template-columns:1fr}.vc .c-aiin{grid-template-columns:1fr}
}
@media (max-width:640px){
  .vc .c-in{padding:0 16px}.vc .c-nav .c-in{height:60px;gap:12px}.vc .c-cta{gap:12px}
  .vc .c-hero{padding:40px 0 50px}.vc .c-hero h1{font-size:clamp(38px,11vw,50px)}.vc .c-eyebrow{font-size:13px}.vc .c-lead{font-size:17px}
  .vc .c-hcta{flex-direction:column}.vc .c-hcta .c-btn{width:100%}.vc .c-ticks li{font-size:14px}
  .vc .c-bento{grid-template-columns:1fr 1fr;grid-auto-rows:auto;gap:10px;margin-top:36px}.vc .c-t{padding:14px 16px;border-radius:20px;min-height:120px}.vc .c-t b{font-size:24px}
  .vc .t-chat,.vc .t-nb{grid-column:span 2}.vc .t-chat{grid-row:auto}.vc .t-stock{grid-row:auto;grid-column:span 2}.vc .c-b1{font-size:14.5px}.vc .c-b2{font-size:14px}
  .vc .c-sec{padding:64px 0}.vc .c-head{margin-bottom:32px}.vc .c-head h2{font-size:clamp(28px,8vw,36px)}
  .vc .c-bens{grid-template-columns:1fr}.vc .c-ben.big{grid-column:auto}.vc .c-ben.big h3{font-size:22px}
  .vc .c-items{display:flex;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:2px 16px 8px;gap:8px}.vc .c-items::-webkit-scrollbar{display:none}
  .vc .c-item{flex:0 0 auto;padding:10px 14px;background:#FFFFFF;border-color:var(--line)}.vc .c-iic{flex-basis:32px;height:32px}.vc .c-item b{font-size:15px}
  .vc .c-stage{padding:14px;border-radius:24px}.vc .c-pv{padding:16px 10px}
  .vc .c-ais{grid-template-columns:1fr}.vc .c-link-v{display:block;height:370px}.vc .c-link-v .m-phone{position:absolute;width:250px;transform-origin:top left}.vc .c-link-v .k1{left:0;top:0;transform:scale(.66)}.vc .c-link-v .k2{left:auto;right:0;top:40px;transform:scale(.66);transform-origin:top right}
  .vc .c-days{margin:0 -16px;padding-left:16px;padding-right:16px;grid-template-columns:repeat(5,82%)}
  .vc .c-facts{gap:10px}.vc .c-fact{padding:20px 18px;border-radius:20px}.vc .c-fact span{font-size:14px}.vc .c-trs{grid-template-columns:1fr}.vc .c-psteps{grid-template-columns:1fr}
  .vc .c-final{padding:56px 18px;border-radius:30px}.vc .c-foot small{margin-left:0}
}
'''
