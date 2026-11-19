# Version B, "Notebook": warm paper, highlighter, sticky notes and handwriting. Playful and very local.
from common import *

def sec(n, inner, cls='', lab=True, sid=None):
    tag = f'<span class="lab-tag"><b>B{n}</b>{SNAME[n]}</span>' if lab else ''
    return f'<section class="b-sec {cls}" data-s="{n}"{f" id={sid}" if sid else ""}>{tag}{inner}</section>\n'

ASIDE = ['bye, singilan stress!', 'wala nang retype', 'hindi na mauubusan', 'sakto ang kaha', 'alam mo ang kita', 'benta kahit tulog']
NOTE = ['ny', 'np', 'nb', 'ng', 'ny', 'nb']
ARROW = '<svg class="b-doodle" viewBox="0 0 160 90" aria-hidden="true"><path d="M8 70 C 40 10, 100 6, 146 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M128 28 L148 42 L126 52" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def build(lab=True, brand='<b class="b-word">Nifti</b>'):
    h = []
    h.append(f'''<nav class="b-nav"><div class="b-in">{brand}
  <div class="b-links"><a href="#bTour">Features</a><a href="#bAi">AI tools</a><a href="#bDay">Your day</a><a href="#bPrice">Pricing</a></div>
  <div class="b-cta"><a class="b-login" data-go="login">Log in</a><a class="b-btn b-btn-y b-btn-sm" data-go="start">Start free</a></div></div></nav>''')
    # 1 intro
    h.append(sec(1, f'''<div class="b-in b-hero-in">
  <div class="b-hero-t">
    <span class="b-hand b-hi">Para sa mga tindahan, distributor at supplier 🇵🇭</span>
    <h1>Goodbye, utang notebook.<br>Hello, <span class="b-circ">Nifti<svg viewBox="0 0 300 110" preserveAspectRatio="none" aria-hidden="true"><path d="M20 62 C 18 18, 270 8, 284 50 C 296 92, 60 104, 26 72 C 10 56, 40 28, 120 22" fill="none" stroke="#16A34A" stroke-width="5" stroke-linecap="round"/></svg></span>.</h1>
    <p class="b-lead">Your Viber orders, your <span class="b-hl">utang list</span>, your stock and your cash drawer, in one app on your phone. It reminds customers to pay, tells you what to reorder, and keeps the books while you sell. <b>Your customers don't need an app.</b></p>
    <div class="b-hcta"><a class="b-btn b-btn-y b-btn-lg" data-go="start">Start free {ic('arrow', 20)}</a><a class="b-btn b-btn-w b-btn-lg" data-go="demo">{ic('play', 20)}Open the demo shop</a></div>
    <p class="b-hand b-note">✓ no card needed &nbsp; ✓ free plan for good &nbsp; ✓ any phone</p>
  </div>
  <div class="b-hero-v" aria-hidden="true">
    <div class="b-page"><div class="b-holes"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="b-ttl">UTANG — Nov</div>
      <div class="b-ln"><span>Aling Nena</span><span>600</span></div><div class="b-ln"><span>Mang Bert</span><span>5,700</span></div><div class="b-ln x"><span>JRC</span><span>2,280</span></div><div class="b-ln"><span>Bayvw</span><span>780</span></div><div class="b-ln"><span>Corazon (bayad?)</span><span>?</span></div></div>
    <div class="b-arrowlbl"><span class="b-hand">Nifti reads it</span>{ARROW}</div>
    <div class="b-app"><div class="b-app-h"><small>WHO OWES YOU</small><b>₱9,360</b></div>
      <div class="b-al"><span>Aling Nena Store</span><b>₱600</b></div><div class="b-al"><span>Mang Bert Construction</span><b>₱5,700</b></div><div class="b-al"><span>Bayview Construction Co.</span><b>₱780</b></div><div class="b-al q"><span>Corazon Welding · check</span><b>?</b></div>
      <div class="b-rem">Reminders go out Friday, 9 AM</div><span class="b-stamp">PAID ✓</span></div>
    <div class="b-sticky ny s1"><i class="tape"></i><span class="b-hand">₱84,200 collected this week!</span></div>
  </div></div>''', 'b-hero', lab))
    # 2 works with
    w = ''.join(f'<span class="b-stk c{i % 5}">{x}</span>' for i, x in enumerate(WORKS))
    h.append(sec(2, f'<div class="b-in b-works"><span class="b-hand">works with what you already use →</span><div class="b-stks">{w}</div></div>', 'b-worksec', lab))
    # 3 benefits
    cards = ''.join(f'<div class="b-sn {NOTE[i]} rv r{i % 3}"><i class="tape"></i><span class="b-sico">{ic(k, 22)}</span><h3>{t}</h3><p>{d}</p><span class="b-hand b-aside">{ASIDE[i]}</span></div>' for i, (k, t, d) in enumerate(BENEFITS))
    h.append(sec(3, f'''<div class="b-in"><div class="b-head rv"><span class="b-hand b-k">bakit Nifti?</span><h2>The boring jobs, <span class="b-hl">done for you.</span></h2><p>Six things that stop eating your day the moment you switch.</p></div>
  <div class="b-sns">{cards}</div></div>''', 'b-ruled', lab))
    # 4 tour
    cols = ['#FEF08A', '#FBCFE8', '#BFDBFE', '#BBF7D0', '#DDD6FE', '#FDE68A', '#A5F3FC', '#FECDD3', '#D9F99D']
    tabs = ''.join(f'<button type="button" role="tab" data-tab="{i}" style="--tc:{cols[i]}">{f[1]}</button>' for i, f in enumerate(FEATURES))
    panels = ''.join(f'''<div class="b-panel" role="tabpanel" data-panel="{i}"{'' if i == 0 else ' hidden'}><div class="b-pt"><span class="b-tag {f[3]}">{TAGNAME[f[3]]}</span><h3>{f[4]}</h3><p>{f[5]}</p>
      <ul class="b-list">{''.join(f'<li>{b}</li>' for b in f[6])}</ul></div><div class="b-pv">{M[f[0]]}</div></div>''' for i, f in enumerate(FEATURES))
    h.append(sec(4, f'''<div class="b-in"><div class="b-head rv"><span class="b-hand b-k">lahat nasa isang app</span><h2>Everything between the order <span class="b-hl">and the money in your hand.</span></h2><p>Flip through the tabs. Everything here is in the app today.</p></div>
  <div data-tabs class="b-binder"><div class="b-tabs" role="tablist">{tabs}</div><div class="b-sheet">{panels}</div></div></div>''', 'b-grid', lab, 'bTour'))
    # 5 AI
    vis = ['<span class="hw">Mang Bert ..... 5,700</span><span class="ar">↓</span><span class="cl">Mang Bert Construction <b>₱5,700</b></span>',
           '<span class="bub">10 sako semento, 5 rolls wire</span><span class="ar">↓</span><span class="cl">Order · <b>₱4,880</b></span>',
           '<span class="mic"><i></i><i></i><i></i><i></i><i></i></span><span class="ar">↓</span><span class="cl">“Sale ngayong Sabado! Rebar ₱65 na lang…”</span>',
           '<span class="pp"><span class="ph b"></span><span class="ar">→</span><span class="ph a"></span></span>']
    caps = ['kahit pangit sulat ko 😅', 'Taglish okay lang', 'magsalita ka lang', 'parang pro photographer']
    ai = ''.join(f'<div class="b-pol rv r{i % 3}"><div class="b-polv v{i}">{vis[i]}</div><h3>{t}</h3><p>{d}</p><span class="b-hand">{caps[i]}</span></div>' for i, (k, t, d) in enumerate(AI))
    h.append(sec(5, f'''<div class="b-in"><div class="b-head rv"><span class="b-hand b-k">AI na tumutulong talaga</span><h2>You run the business. <span class="b-hl">Nifti does the typing.</span></h2><p>Smart tools that save you hours every week, and always let you check before anything is saved.</p></div>
  <div class="b-pols">{ai}</div></div>''', 'b-ruled', lab, 'bAi'))
    # 6 no app
    h.append(sec(6, f'''<div class="b-in b-link"><div class="b-link-t rv"><span class="b-hand b-k">ang pinakamaganda</span><h2>Your customers and suppliers <span class="b-hl">don't need an app.</span></h2>
    <p>They get a link by Viber or SMS. They tap it on any phone and confirm the order, see what they owe, or tell you they paid with the reference number. That's it.</p>
    <ul class="b-list big"><li>No download, no sign-up, no password</li><li>Statements of account they can open any time</li><li>If they join Nifti later, every order is waiting for them</li></ul></div>
  <div class="b-link-v rv" aria-hidden="true">{LINK_PHONES}<span class="b-hand b-n1">tap lang!</span><span class="b-hand b-n2">walang download ✓</span></div></div>''', 'b-grid', lab))
    # 7 day
    rows = ''.join(f'''<div class="b-row rv"><div class="b-time"><span class="b-sky s-{sky}">{ic(sky, 20)}</span><div><b class="b-hand">{t}</b><small>{lbl}</small></div></div>
      <div class="b-bef"><span class="ib">{ic(bi, 18)}</span><b>{bt}</b><i class="b-strike"></i></div><div class="b-ar">{ARROW}</div>
      <div class="b-aft"><i class="tape"></i><span class="ia">{ic(ai_, 18)}</span><div><b>{at}</b><span class="res b-hand">{ar}</span></div></div></div>''' for i, (t, lbl, sky, bi, bt, ai_, at, ar) in enumerate(DAY))
    sm = ''.join(f'<div class="b-stamp2 rv"><span>{ic(k, 22)}</span><p><b>{t}</b><span>{d}</span></p></div>' for k, t, d in DAY_SUM)
    h.append(sec(7, f'''<div class="b-in"><div class="b-head rv"><span class="b-hand b-k">isang araw sa tindahan</span><h2>Your day, <span class="b-hl">before and after Nifti.</span></h2><p>From a hard day to an easy one.</p></div>
  <div class="b-diary"><div class="b-dhead"><span>Time</span><span>Before</span><span></span><span>With Nifti</span></div>{''.join([rows])}</div><div class="b-sum">{sm}</div></div>''', 'b-ruled b-day', lab, 'bDay'))
    # 8 facts
    fx = ''.join(f'<div class="b-badge rv c{i}"><b>{n}</b><span>{d}</span></div>' for i, (n, d) in enumerate(FACTS))
    h.append(sec(8, f'<div class="b-in b-facts">{fx}</div>', 'b-factsec', lab))
    # 9 trust
    tr = ''.join(f'<li class="rv"><span class="b-box">✓</span><div><b>{t}</b><p>{d}</p></div></li>' for k, t, d in TRUST)
    h.append(sec(9, f'''<div class="b-in"><div class="b-pledge rv"><i class="tape"></i><span class="b-hand b-k">pangako namin sa iyo</span><h2>Your records are yours. <span class="b-hl">Full stop.</span></h2><ul>{tr}</ul><div class="b-sig"><span class="b-hand">— The Nifti team</span></div></div></div>''', 'b-grid', lab))
    # 10 pricing
    def plan(p):
        eqm = 'free for good' if p['k'] == 'free' else f"or {peso(p['y'])} a year, 2 months free"
        eqy = 'free for good' if p['k'] == 'free' else f"like {peso(round(p['y'] / 12))} a month · 2 months free"
        per_m, per_y = ('forever', 'forever') if p['k'] == 'free' else ('a month', 'a year')
        btn = {'free': '<a class="b-btn b-btn-w" data-go="start">Start free</a>', 'pro': '<a class="b-btn b-btn-y" data-go="start" data-plan="pro">Start with Pro</a>', 'business': '<a class="b-btn b-btn-w" data-go="start" data-plan="business">Start with Business</a>'}[p['k']]
        return f'''<div class="b-tagcard {p['k']} rv"><span class="b-hole"></span>{'<span class="b-hand b-most">most shops pick this ★</span>' if p['k'] == 'pro' else ''}<h3>{p['name']}</h3><p class="who">{p['who']}</p>
      <div class="amt"><b data-m="{peso(p['m'])}" data-y="{peso(p['y'])}">{peso(p['m'])}</b><span data-m="{per_m}" data-y="{per_y}">{per_m}</span></div><div class="eq b-hand" data-m="{eqm}" data-y="{eqy}">{eqm}</div>
      <ul>{''.join(f'<li>{f}</li>' for f in p['f'])}</ul>{btn}</div>'''
    steps = ''.join(f'<div class="rv"><span class="b-hand">{i + 1}</span><b>{t}</b><p>{d}</p></div>' for i, (t, d) in enumerate(PAYSTEPS))
    h.append(sec(10, f'''<div class="b-in" data-prices><div class="b-head rv"><span class="b-hand b-k">simple lang ang presyo</span><h2>Start free. <span class="b-hl">Upgrade when it pays for itself.</span></h2><p>No card, no contract. Pay by GCash, Maya or bank QR. Stop any time and keep your records.</p></div>
  <div class="b-cyc"><button type="button" class="on" data-cycle="monthly">Monthly</button><button type="button" data-cycle="yearly">Yearly <em>2 months free</em></button></div>
  <div class="b-tags">{''.join(plan(p) for p in PLANS)}</div>
  <div class="b-pay"><h3 class="b-hand">paano magbayad:</h3><div class="b-steps">{steps}</div></div></div>''', 'b-ruled', lab, 'bPrice'))
    # 11 faq
    fq = ''.join(f'<div class="b-qa {NOTE[i]} rv r{i % 3}"><b>{q}</b><p>{a}</p></div>' for i, (q, a) in enumerate(FAQ))
    h.append(sec(11, f'''<div class="b-in"><div class="b-head rv"><span class="b-hand b-k">mga madalas itanong</span><h2>Questions people <span class="b-hl">usually ask.</span></h2><p>Something else? Start free and message us from inside the app.</p></div><div class="b-qas">{fq}</div></div>''', 'b-grid', lab))
    # 12 final
    h.append(sec(12, f'''<div class="b-in"><div class="b-final rv"><i class="tape l"></i><i class="tape r"></i><span class="b-hand b-k">tara na!</span><h2>Your next order could be <span class="b-hl">your first one in Nifti.</span></h2>
    <p>Set up your shop for free. Or look around the demo shop first, no sign-up needed.</p>
    <div class="b-hcta c"><a class="b-btn b-btn-y b-btn-lg" data-go="start">Start free {ic('arrow', 20)}</a><a class="b-btn b-btn-w b-btn-lg" data-go="demo">Open the demo shop</a></div></div></div>
  <footer class="b-foot"><div class="b-in">{brand}<div class="b-fl"><a href="#bTour">Features</a><a data-go="pricing">Pricing</a><a data-go="privacy">Privacy &amp; Security</a><a data-go="terms">Terms</a><a data-go="login">Log in</a></div><small class="b-hand">gawa sa Pilipinas, para sa mga negosyong nagpapatakbo nito ♥</small></div></footer>''', 'b-ruled b-end', lab))
    return '\n'.join(h)

CSS = r'''
.vb{--ink:#14211B;--g:#16A34A;--g2:#15803D;--blue:#1D4ED8;--red:#DC2626;--hl:#FDE047;--paper:#FFFCF3;--line:#E8E1CC;--muted:#4A5650;
  font-family:Inter,system-ui,sans-serif;color:var(--ink);background:var(--paper);overflow-x:clip;-webkit-font-smoothing:antialiased;--lab:#1D4ED8}
.vb *{box-sizing:border-box}.vb h1,.vb h2,.vb h3{font-family:'Plus Jakarta Sans',Inter,sans-serif;margin:0;letter-spacing:-.02em}.vb p{margin:0}.vb a{cursor:pointer;text-decoration:none;color:inherit}
.vb .b-in{width:min(1180px,100%);margin:0 auto;padding:0 24px}
.vb .b-hand{font-family:Caveat,'Segoe Print',cursive;font-weight:700}
.vb .b-hl{background:linear-gradient(100deg,transparent 2%,rgba(253,224,71,.85) 4%,rgba(253,224,71,.75) 96%,transparent 98%) 0 72%/100% 46% no-repeat;padding:0 .08em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.vb .b-nav{position:sticky;top:0;z-index:50;background:rgba(255,252,243,.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:2px dashed #E3D9BC}
.vb .b-nav .b-in{display:flex;align-items:center;gap:28px;height:68px}
.vb .brand{display:flex;align-items:center;gap:10px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:22px}.vb .brand img{height:30px;width:auto}.vb .b-word{font-size:24px;font-family:'Plus Jakarta Sans',sans-serif;color:var(--g2)}
.vb .b-links{display:flex;gap:26px;margin-left:10px}.vb .b-links a{font-weight:700;font-size:15.5px;color:var(--muted)}.vb .b-links a:hover{color:var(--ink);text-decoration:underline wavy var(--hl) 3px;text-underline-offset:6px}
.vb .b-cta{margin-left:auto;display:flex;align-items:center;gap:18px}.vb .b-login{font-weight:700}
.vb .b-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;border:2.5px solid var(--ink);transition:transform .12s,box-shadow .12s;white-space:nowrap}
.vb .b-btn-sm{padding:8px 16px;font-size:15px;box-shadow:3px 3px 0 var(--ink)}.vb .b-btn-lg{padding:14px 24px;font-size:17px;box-shadow:5px 5px 0 var(--ink)}
.vb .b-btn:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--ink)}.vb .b-btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
.vb .b-btn-y{background:var(--hl);color:var(--ink)}.vb .b-btn-w{background:#FFFFFF;color:var(--ink)}
/* hero */
.vb .b-hero{padding:56px 0 50px;background:radial-gradient(500px 300px at 85% 20%,rgba(253,224,71,.35),transparent 70%),radial-gradient(420px 300px at 10% 90%,rgba(134,239,172,.35),transparent 70%),var(--paper)}
.vb .b-hero-in{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:40px;align-items:center}
.vb .b-hi{display:inline-block;font-size:24px;color:var(--blue);transform:rotate(-2deg)}
.vb .b-hero h1{margin-top:12px;font-size:clamp(42px,4.8vw,68px);line-height:1.04;font-weight:800;letter-spacing:-.035em}
.vb .b-circ{position:relative;display:inline-block;color:var(--g2);padding:0 .12em}.vb .b-circ svg{position:absolute;left:-14%;top:-18%;width:128%;height:136%;overflow:visible}
.vb .b-circ path{stroke-dasharray:900;stroke-dashoffset:900;animation:bDraw 1.4s .5s ease forwards}
.vb .b-lead{margin-top:22px;font-size:clamp(17px,1.45vw,19.5px);line-height:1.6;color:var(--muted);max-width:590px}.vb .b-lead b{color:var(--ink)}
.vb .b-hcta{display:flex;flex-wrap:wrap;gap:16px;margin-top:30px}.vb .b-hcta.c{justify-content:center}
.vb .b-note{margin-top:20px;font-size:22px;color:var(--g2)}
.vb .b-hero-v{position:relative;min-height:540px}
.vb .b-page{position:absolute;left:0;top:24px;width:300px;padding:44px 20px 20px 46px;background:#FFFEF7;border-radius:6px;box-shadow:0 22px 40px -24px rgba(60,40,0,.35),0 0 0 1px #EDE3C6;transform:rotate(-5deg);background-image:repeating-linear-gradient(180deg,transparent 0 35px,#BFD3F5 35px 36px);background-position:0 30px}
.vb .b-page::before{content:"";position:absolute;left:34px;top:0;bottom:0;width:2px;background:#F8A5A5}
.vb .b-holes{position:absolute;top:12px;left:30px;right:16px;display:flex;justify-content:space-between}.vb .b-holes i{width:12px;height:12px;border-radius:50%;background:var(--paper);box-shadow:inset 0 1px 2px rgba(0,0,0,.25)}
.vb .b-ttl{font-family:Caveat,cursive;font-weight:700;font-size:26px;color:var(--red);margin:-6px 0 4px}
.vb .b-ln{display:flex;justify-content:space-between;height:36px;align-items:center;font-family:Caveat,cursive;font-size:25px;color:#1E3A8A;opacity:0;animation:bWrite .5s ease forwards}
.vb .b-ln:nth-child(3){animation-delay:.3s}.vb .b-ln:nth-child(4){animation-delay:.6s}.vb .b-ln:nth-child(5){animation-delay:.9s}.vb .b-ln:nth-child(6){animation-delay:1.2s}.vb .b-ln:nth-child(7){animation-delay:1.5s}
.vb .b-ln.x span:first-child{text-decoration:line-through;text-decoration-color:var(--red);text-decoration-thickness:2px}
.vb .b-arrowlbl{position:absolute;left:230px;top:0;color:var(--g2);display:flex;flex-direction:column;align-items:center;z-index:3}.vb .b-arrowlbl span{font-size:26px;transform:rotate(-6deg)}.vb .b-doodle{width:150px;height:84px}
.vb .b-app{position:absolute;right:0;top:110px;width:300px;background:#FFFFFF;border:2.5px solid var(--ink);border-radius:20px;padding:16px;box-shadow:8px 8px 0 #BBF7D0;transform:rotate(2.5deg);animation:bIn .7s 1.6s both}
.vb .b-app-h{padding:10px 12px;border-radius:12px;background:#FEF9C3;margin-bottom:8px}.vb .b-app-h small{display:block;font-size:11.5px;font-weight:800;letter-spacing:.08em;color:#854D0E}.vb .b-app-h b{font-family:'Plus Jakarta Sans',sans-serif;font-size:30px}
.vb .b-al{display:flex;justify-content:space-between;gap:8px;padding:8px 2px;border-bottom:1px dashed #E5E7EB;font-size:14px}.vb .b-al span{color:var(--muted)}.vb .b-al.q b{color:#CA8A04}
.vb .b-rem{margin-top:10px;font-size:13px;font-weight:700;color:var(--g2)}.vb .b-rem::before{content:"🔔 "}
.vb .b-app{padding-bottom:58px}.vb .b-stamp{position:absolute;right:16px;bottom:12px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:22px;color:var(--g);border:3px solid var(--g);border-radius:10px;padding:2px 10px;transform:rotate(-14deg);opacity:0;animation:bStamp .4s 2.6s cubic-bezier(.3,1.6,.5,1) forwards}
.vb .b-sticky{position:absolute;padding:18px 18px 16px;width:190px;box-shadow:0 14px 24px -14px rgba(60,40,0,.45)}.vb .b-sticky span{font-size:24px;line-height:1.1}
.vb .b-sticky.s1{left:40px;bottom:0;transform:rotate(-4deg)}
.vb .ny{background:#FEF08A}.vb .np{background:#FBCFE8}.vb .nb{background:#BFDBFE}.vb .ng{background:#BBF7D0}
.vb .tape{position:absolute;top:-12px;left:50%;width:84px;height:24px;transform:translateX(-50%) rotate(-3deg);background:rgba(255,255,255,.6);border:1px solid rgba(0,0,0,.06);box-shadow:0 2px 4px rgba(0,0,0,.06)}
/* works */
.vb .b-worksec{padding:26px 0;border-top:2px dashed #E3D9BC;border-bottom:2px dashed #E3D9BC;background:#FFFFFF}
.vb .b-works{display:flex;align-items:center;gap:20px;flex-wrap:wrap}.vb .b-works>span{font-size:24px;color:var(--blue)}
.vb .b-stks{display:flex;flex-wrap:wrap;gap:10px}.vb .b-stk{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15px;padding:7px 14px;border-radius:999px;border:2px solid var(--ink)}
.vb .b-stk:nth-child(odd){transform:rotate(-2deg)}.vb .b-stk:nth-child(even){transform:rotate(1.5deg)}
.vb .b-stk.c0{background:#FEF08A}.vb .b-stk.c1{background:#BBF7D0}.vb .b-stk.c2{background:#BFDBFE}.vb .b-stk.c3{background:#FBCFE8}.vb .b-stk.c4{background:#FFFFFF}
/* sections */
.vb .b-sec{position:relative;padding:96px 0}
.vb .b-ruled{background-color:var(--paper);background-image:repeating-linear-gradient(180deg,transparent 0 39px,rgba(147,180,230,.22) 39px 40px)}
.vb .b-grid{background-color:#FFFFFF;background-image:linear-gradient(rgba(147,180,230,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(147,180,230,.14) 1px,transparent 1px);background-size:28px 28px}
.vb .b-head{text-align:center;max-width:840px;margin:0 auto 50px}.vb .b-k{display:inline-block;font-size:28px;color:var(--blue);transform:rotate(-2deg)}
.vb .b-head h2{margin-top:8px;font-size:clamp(32px,4.2vw,52px);line-height:1.1;font-weight:800}.vb .b-head p{margin-top:14px;font-size:clamp(16.5px,1.35vw,19px);line-height:1.6;color:var(--muted)}
/* benefits = sticky notes */
.vb .b-sns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px 26px}
.vb .b-sn{position:relative;padding:28px 24px 22px;box-shadow:0 18px 30px -20px rgba(60,40,0,.45);transition:transform .25s}
.vb .b-sn.r0{transform:rotate(-1.5deg)}.vb .b-sn.r1{transform:rotate(1deg)}.vb .b-sn.r2{transform:rotate(-.5deg)}.vb .b-sn:hover{transform:rotate(0) translateY(-6px)}
.vb .b-sico{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.7);border:2px solid var(--ink)}
.vb .b-sn h3{margin-top:14px;font-size:20px}.vb .b-sn p{margin-top:8px;font-size:15.5px;line-height:1.55;color:#2E3A33}
.vb .b-aside{display:block;margin-top:12px;font-size:23px;color:var(--red);transform:rotate(-2deg)}
/* tour = binder with index tabs */
.vb .b-tabs{display:flex;flex-wrap:wrap;gap:6px;padding-left:18px}
.vb .b-tabs button{font:inherit;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:14.5px;padding:10px 16px 14px;border:2px solid var(--ink);border-bottom:0;border-radius:14px 14px 0 0;background:var(--tc);cursor:pointer;margin-bottom:-2px;transform:translateY(6px);transition:transform .15s}
.vb .b-tabs button:hover{transform:translateY(2px)}.vb .b-tabs button.on{transform:translateY(0);background:#FFFFFF;position:relative;z-index:2;padding-bottom:16px}
.vb .b-sheet{position:relative;z-index:1;background:#FFFFFF;border:2px solid var(--ink);border-radius:18px;padding:44px;box-shadow:8px 8px 0 #FDE68A;min-height:500px}
.vb .b-panel{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:44px;align-items:center}.vb .b-panel[hidden]{display:none}.vb .b-panel.on .b-pt,.vb .b-panel.on .b-pv{animation:bIn .45s ease both}
.vb .b-tag{display:inline-block;font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 11px;border-radius:999px;border:2px solid var(--ink)}
.vb .b-tag.free{background:#BBF7D0}.vb .b-tag.pro{background:#BFDBFE}.vb .b-tag.biz{background:#DDD6FE}.vb .b-tag.ai{background:#FEF08A}
.vb .b-pt h3{margin-top:14px;font-size:clamp(26px,2.5vw,34px);line-height:1.15}.vb .b-pt>p{margin-top:12px;font-size:17px;line-height:1.6;color:var(--muted)}
.vb .b-list{list-style:none;padding:0;margin:20px 0 0;display:grid;gap:12px}.vb .b-list li{position:relative;padding-left:34px;font-size:16px;line-height:1.5;font-weight:500}
.vb .b-list li::before{content:"✓";position:absolute;left:0;top:-4px;font-family:Caveat,cursive;font-size:30px;font-weight:700;color:var(--g)}.vb .b-list.big li{font-size:17px}.vb .b-pv{display:flex;justify-content:center}
.vb .b-pv .m-card,.vb .b-pv .m-phone{box-shadow:6px 6px 0 rgba(20,33,27,.12),0 0 0 2px var(--ink)}
/* AI = polaroids */
.vb .b-pols{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:26px}
.vb .b-pol{background:#FFFFFF;padding:14px 14px 18px;box-shadow:0 18px 30px -18px rgba(60,40,0,.45),0 0 0 1px #EEE6CF;transition:transform .25s}
.vb .b-pol.r0{transform:rotate(-2deg)}.vb .b-pol.r1{transform:rotate(1.5deg)}.vb .b-pol.r2{transform:rotate(-1deg)}.vb .b-pol:hover{transform:rotate(0) translateY(-6px)}
.vb .b-pol h3{margin-top:14px;font-size:18.5px}.vb .b-pol p{margin-top:6px;font-size:15px;line-height:1.5;color:var(--muted)}.vb .b-pol>.b-hand{display:block;margin-top:10px;font-size:22px;color:var(--blue)}
.vb .b-polv{height:150px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:7px;padding:12px;text-align:center;overflow:hidden}
.vb .b-polv.v0{background:#FFFBEB}.vb .b-polv.v1{background:#F5F3FF}.vb .b-polv.v2{background:#ECFDF5}.vb .b-polv.v3{background:#F0F9FF}
.vb .b-polv .hw{font-family:Caveat,cursive;font-size:23px;color:#1E3A8A}.vb .b-polv .ar{font-weight:900;color:var(--g2);font-size:17px;animation:bNudge 1.6s ease-in-out infinite}
.vb .b-polv .cl{font-size:12.5px;font-weight:700;background:#FFFFFF;padding:6px 10px;border-radius:10px;border:2px solid var(--ink);line-height:1.35}.vb .b-polv .cl b{color:var(--g2)}
.vb .b-polv .bub{font-size:12.5px;background:#7C3AED;color:#FFFFFF;padding:7px 11px;border-radius:14px 14px 14px 4px}
.vb .b-polv .mic{display:flex;gap:4px;align-items:center;height:32px}.vb .b-polv .mic i{width:6px;border-radius:4px;background:var(--g);animation:bWave 1s ease-in-out infinite}
.vb .b-polv .mic i:nth-child(1){height:12px}.vb .b-polv .mic i:nth-child(2){height:24px;animation-delay:.1s}.vb .b-polv .mic i:nth-child(3){height:32px;animation-delay:.2s}.vb .b-polv .mic i:nth-child(4){height:20px;animation-delay:.3s}.vb .b-polv .mic i:nth-child(5){height:10px;animation-delay:.4s}
.vb .b-polv .pp{display:flex;align-items:center;gap:10px}.vb .b-polv .ph{width:62px;height:76px;border-radius:10px;position:relative}.vb .b-polv .ph.b{background:linear-gradient(160deg,#A8A29E,#D6D3D1 60%,#78716C);transform:rotate(-6deg);filter:saturate(.6)}
.vb .b-polv .ph.a{background:#FFFFFF;border:2px solid var(--ink)}.vb .b-polv .ph::after{content:"";position:absolute;left:16px;right:16px;top:16px;bottom:14px;border-radius:7px;background:linear-gradient(180deg,#E7E5E4,#A8A29E)}
/* link */
.vb .b-link{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;align-items:center}
.vb .b-link-t h2{margin-top:8px;font-size:clamp(32px,3.8vw,48px);line-height:1.1}.vb .b-link-t>p{margin-top:16px;font-size:18px;line-height:1.6;color:var(--muted)}
.vb .b-link-v{position:relative;height:520px}.vb .b-link-v .m-phone{position:absolute;box-shadow:6px 6px 0 rgba(20,33,27,.14),0 0 0 2px var(--ink)}
.vb .b-link-v .k1{left:4%;top:20px;transform:rotate(-5deg);z-index:2}.vb .b-link-v .k2{right:4%;top:80px;transform:rotate(5deg)}
.vb .b-n1,.vb .b-n2{position:absolute;font-size:30px;color:var(--red);z-index:4}.vb .b-n1{left:0;bottom:24px;transform:rotate(-8deg)}.vb .b-n2{right:0;top:0;transform:rotate(6deg);color:var(--g2)}
/* day = diary */
.vb .b-diary{max-width:1020px;margin:0 auto;background:#FFFFFF;border:2px solid var(--ink);border-radius:18px;padding:12px 22px 22px;box-shadow:8px 8px 0 #BFDBFE}
.vb .b-dhead{display:grid;grid-template-columns:170px minmax(0,1fr) 70px minmax(0,1.15fr);gap:14px;padding:10px 0 12px;border-bottom:2px solid var(--ink);margin-bottom:8px}
.vb .b-dhead span{font-family:Caveat,cursive;font-weight:700;font-size:26px;color:var(--blue)}.vb .b-dhead span:nth-child(2){color:var(--red)}.vb .b-dhead span:nth-child(4){color:var(--g2)}
.vb .b-row{display:grid;grid-template-columns:170px minmax(0,1fr) 70px minmax(0,1.15fr);gap:14px;align-items:center;padding:12px 0;border-bottom:1.5px dashed #E5DCC2}.vb .b-row:last-child{border-bottom:0}
.vb .b-time{display:flex;align-items:center;gap:12px}.vb .b-time b{display:block;font-size:28px;line-height:1;color:var(--ink)}.vb .b-time small{display:block;font-size:13px;color:var(--muted);font-weight:600;line-height:1.3}
.vb .b-sky{flex:0 0 42px;height:42px;display:grid;place-items:center;border-radius:50%;border:2px solid var(--ink)}.vb .s-sunrise{background:#FEF3C7}.vb .s-sun{background:#FEF08A}.vb .s-sunset{background:#FBCFE8}.vb .s-moon{background:#DDD6FE}
.vb .b-bef{position:relative;display:flex;align-items:center;gap:10px;padding:10px 4px;color:#7A2E2E}.vb .b-bef b{font-size:16px;font-weight:700}
.vb .b-bef .ib{flex:0 0 34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#FEE2E2;color:var(--red)}
.vb .b-strike{position:absolute;left:46px;right:6px;top:50%;height:3px;background:var(--red);border-radius:3px;transform-origin:left;transform:scaleX(0) rotate(-2deg);transition:transform .7s .3s ease;opacity:.75}
.vb .b-row.in .b-strike{transform:scaleX(1) rotate(-2deg)}
.vb .b-ar{color:var(--g2)}.vb .b-ar .b-doodle{width:64px;height:40px}
.vb .b-aft{position:relative;display:flex;align-items:center;gap:12px;padding:14px 16px 12px;background:#DCFCE7;box-shadow:0 10px 18px -12px rgba(21,128,61,.6);transform:rotate(-.8deg)}
.vb .b-aft .tape{width:60px;height:18px;top:-9px}.vb .b-aft .ia{flex:0 0 34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#FFFFFF;border:2px solid var(--ink)}
.vb .b-aft b{display:block;font-size:16px}.vb .b-aft .res{display:block;font-size:22px;color:var(--g2);line-height:1}
.vb .b-sum{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-top:34px}
.vb .b-stamp2{display:flex;align-items:center;gap:12px;padding:12px 18px;border:3px solid var(--g);border-radius:14px;color:var(--g2);background:#FFFFFF;transform:rotate(-2deg)}.vb .b-stamp2:nth-child(2){transform:rotate(2deg)}
.vb .b-stamp2 b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:19px;text-transform:uppercase;letter-spacing:.04em}.vb .b-stamp2 p span{font-size:14.5px;color:var(--muted)}
/* facts = badges */
.vb .b-factsec{padding:70px 0;background:#FFFFFF;border-top:2px dashed #E3D9BC;border-bottom:2px dashed #E3D9BC}
.vb .b-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;justify-items:center}
.vb .b-badge{width:210px;height:210px;border-radius:50%;border:2.5px solid var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;box-shadow:5px 5px 0 var(--ink)}
.vb .b-badge.c0{background:#FEF08A;transform:rotate(-6deg)}.vb .b-badge.c1{background:#BBF7D0;transform:rotate(4deg)}.vb .b-badge.c2{background:#BFDBFE;transform:rotate(-3deg)}.vb .b-badge.c3{background:#FBCFE8;transform:rotate(6deg)}
.vb .b-badge b{font-family:'Plus Jakarta Sans',sans-serif;font-size:46px;font-weight:800;letter-spacing:-.03em;line-height:1}.vb .b-badge span{margin-top:8px;font-size:14.5px;font-weight:600;line-height:1.35}
/* trust = pledge */
.vb .b-pledge{position:relative;max-width:900px;margin:0 auto;background:#FFFEF7;border:2px solid var(--ink);border-radius:8px;padding:46px 50px 36px;box-shadow:10px 10px 0 #BBF7D0;background-image:repeating-linear-gradient(180deg,transparent 0 39px,rgba(147,180,230,.3) 39px 40px)}
.vb .b-pledge h2{margin-top:6px;font-size:clamp(30px,3.6vw,44px)}.vb .b-pledge ul{list-style:none;padding:0;margin:26px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:20px 30px}
.vb .b-pledge li{display:flex;gap:14px;align-items:flex-start}.vb .b-box{flex:0 0 30px;height:30px;display:grid;place-items:center;border:2.5px solid var(--ink);border-radius:6px;font-family:Caveat,cursive;font-weight:700;font-size:28px;color:var(--g)}
.vb .b-pledge b{display:block;font-size:17px}.vb .b-pledge p{margin-top:4px;font-size:15px;line-height:1.55;color:var(--muted)}
.vb .b-sig{margin-top:26px;text-align:right}.vb .b-sig span{font-size:32px;color:var(--blue)}
/* pricing = price tags */
.vb .b-cyc{display:flex;width:max-content;max-width:100%;margin:0 auto 40px;border:2.5px solid var(--ink);border-radius:999px;overflow:hidden;background:#FFFFFF;box-shadow:4px 4px 0 var(--ink)}
.vb .b-cyc button{font:inherit;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15.5px;padding:10px 22px;border:0;background:transparent;cursor:pointer}.vb .b-cyc button em{font-style:normal;font-size:12.5px;margin-left:6px;background:#BBF7D0;border-radius:999px;padding:2px 8px}
.vb .b-cyc button.on{background:var(--hl)}
.vb .b-tags{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px;align-items:stretch}
.vb .b-tagcard{position:relative;display:flex;flex-direction:column;background:#FFFFFF;border:2.5px solid var(--ink);border-radius:22px 22px 22px 22px;padding:46px 26px 26px;box-shadow:6px 6px 0 var(--ink)}
.vb .b-tagcard:nth-child(1){transform:rotate(-1.2deg)}.vb .b-tagcard:nth-child(3){transform:rotate(1.2deg)}
.vb .b-hole{position:absolute;top:16px;left:50%;width:18px;height:18px;margin-left:-9px;border-radius:50%;border:2.5px solid var(--ink);background:var(--paper)}
.vb .b-hole::before{content:"";position:absolute;bottom:14px;left:50%;width:2px;height:40px;background:var(--ink);transform:rotate(18deg);transform-origin:bottom}
.vb .b-tagcard.pro{background:#FEF9C3;transform:translateY(-10px)}
.vb .b-most{position:absolute;top:-36px;right:6px;font-size:26px;color:var(--red);transform:rotate(4deg)}
.vb .b-tagcard h3{font-size:24px}.vb .b-tagcard .who{margin-top:6px;font-size:15px;line-height:1.5;color:var(--muted);min-height:46px}
.vb .b-tagcard .amt{display:flex;align-items:baseline;gap:8px;margin-top:16px}.vb .b-tagcard .amt b{font-family:'Plus Jakarta Sans',sans-serif;font-size:50px;font-weight:800;letter-spacing:-.03em;line-height:1}.vb .b-tagcard .amt span{font-weight:700;color:var(--muted)}
.vb .b-tagcard .eq{font-size:22px;color:var(--g2);min-height:26px}
.vb .b-tagcard ul{list-style:none;padding:0;margin:16px 0 24px;display:grid;gap:10px;flex:1}.vb .b-tagcard li{position:relative;padding-left:28px;font-size:15px;line-height:1.45}
.vb .b-tagcard li::before{content:"✓";position:absolute;left:0;top:-3px;font-family:Caveat,cursive;font-size:26px;font-weight:700;color:var(--g)}
.vb .b-tagcard .b-btn{width:100%;padding:13px;font-size:16px;box-shadow:4px 4px 0 var(--ink)}
.vb .b-pay{margin-top:46px;text-align:center}.vb .b-pay h3{font-size:32px;color:var(--blue)}
.vb .b-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:16px;text-align:left}
.vb .b-steps>div{position:relative;background:#FFFFFF;border:2px solid var(--ink);border-radius:16px;padding:20px 20px 18px 66px}
.vb .b-steps span{position:absolute;left:18px;top:8px;font-size:52px;color:var(--g2);line-height:1}.vb .b-steps b{display:block;font-size:16px}.vb .b-steps p{margin-top:4px;font-size:14.5px;line-height:1.5;color:var(--muted)}
/* faq = notes */
.vb .b-qas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px}
.vb .b-qa{padding:22px 22px 20px;box-shadow:0 16px 26px -18px rgba(60,40,0,.45)}.vb .b-qa.r0{transform:rotate(-1deg)}.vb .b-qa.r1{transform:rotate(1deg)}.vb .b-qa.r2{transform:rotate(-.4deg)}
.vb .b-qa b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:17px;line-height:1.3}.vb .b-qa p{margin-top:10px;font-size:15px;line-height:1.55;color:#2E3A33}
/* final */
.vb .b-end{padding:90px 0 0}
.vb .b-final{position:relative;text-align:center;max-width:920px;margin:0 auto;background:#FEF08A;padding:56px 34px 50px;box-shadow:0 26px 44px -26px rgba(60,40,0,.5);transform:rotate(-1deg)}
.vb .b-final .tape.l{left:18%}.vb .b-final .tape.r{left:82%;transform:translateX(-50%) rotate(4deg)}
.vb .b-final h2{margin-top:6px;font-size:clamp(32px,4.4vw,54px);line-height:1.1}.vb .b-final .b-hl{background-color:transparent;background-image:linear-gradient(100deg,transparent 2%,rgba(134,239,172,.9) 4%,rgba(134,239,172,.8) 96%,transparent 98%)}
.vb .b-final p{margin:14px auto 0;max-width:560px;font-size:18px;line-height:1.6;color:#2E3A33}
.vb .b-foot{margin-top:70px;border-top:2px dashed #E3D9BC;padding:26px 0 40px}.vb .b-foot .b-in{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.vb .b-fl{display:flex;gap:22px;flex-wrap:wrap}.vb .b-fl a{font-weight:700;color:var(--muted);font-size:15px}.vb .b-foot small{margin-left:auto;font-size:22px;color:var(--muted)}
.vb .rv{opacity:0;transition:opacity .6s ease,translate .6s cubic-bezier(.2,.8,.2,1);translate:0 22px}.vb .rv.in{opacity:1;translate:0 0}
@keyframes bDraw{to{stroke-dashoffset:0}}@keyframes bWrite{from{opacity:0;clip-path:inset(0 100% 0 0)}to{opacity:1;clip-path:inset(0 0 0 0)}}
@keyframes bIn{from{opacity:0;translate:0 16px}to{opacity:1;translate:0 0}}@keyframes bStamp{0%{opacity:0;scale:2}100%{opacity:1;scale:1}}
@keyframes bNudge{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}@keyframes bWave{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1)}}
@media (prefers-reduced-motion:reduce){.vb *,.vb *::before,.vb *::after{animation:none !important;transition:none !important}.vb .rv{opacity:1;translate:none}.vb .b-ln,.vb .b-stamp{opacity:1}.vb .b-circ path{stroke-dashoffset:0}.vb .b-strike{transform:scaleX(1) rotate(-2deg)}}
@media (max-width:1080px){
  .vb .b-links{display:none}.vb .b-hero-in{grid-template-columns:1fr}.vb .b-hero-t{text-align:center}.vb .b-lead{margin-left:auto;margin-right:auto}.vb .b-hcta{justify-content:center}
  .vb .b-hero-v{max-width:640px;width:100%;margin:10px auto 0}
  .vb .b-sns,.vb .b-qas{grid-template-columns:repeat(2,minmax(0,1fr))}.vb .b-pols{grid-template-columns:repeat(2,minmax(0,1fr))}.vb .b-panel{grid-template-columns:1fr;gap:30px}.vb .b-sheet{padding:30px}
  .vb .b-link{grid-template-columns:1fr}.vb .b-tags{grid-template-columns:1fr;max-width:520px;margin:0 auto}.vb .b-tagcard{transform:none !important}
  .vb .b-facts{grid-template-columns:repeat(2,1fr);gap:30px}.vb .b-pledge ul{grid-template-columns:1fr}
}
@media (max-width:640px){
  .vb .b-in{padding:0 16px}.vb .b-nav .b-in{height:60px;gap:12px}.vb .b-cta{gap:12px}
  .vb .b-hero{padding:34px 0 30px}.vb .b-hi{font-size:21px}.vb .b-hero h1{font-size:clamp(36px,10vw,46px)}.vb .b-lead{font-size:17px}
  .vb .b-hcta{flex-direction:column}.vb .b-hcta .b-btn{width:100%}.vb .b-note{font-size:20px}
  .vb .b-hero-v{min-height:560px}.vb .b-page{left:0;top:10px;width:250px;transform:rotate(-4deg)}.vb .b-arrowlbl{left:auto;right:0;top:10px}.vb .b-arrowlbl span{font-size:22px}.vb .b-doodle{width:110px;height:62px}
  .vb .b-hero-v{min-height:660px}.vb .b-app{right:0;top:250px;width:260px}.vb .b-sticky.s1{left:auto;right:8px;bottom:0;top:auto;width:180px;transform:rotate(3deg)}.vb .b-sticky span{font-size:21px}
  .vb .b-works{justify-content:center;text-align:center}.vb .b-works>span{width:100%;font-size:22px}.vb .b-stks{justify-content:center}
  .vb .b-sec{padding:64px 0}.vb .b-head{margin-bottom:32px}.vb .b-head h2{font-size:clamp(28px,8vw,36px)}.vb .b-k{font-size:25px}
  .vb .b-sns,.vb .b-qas,.vb .b-pols{grid-template-columns:1fr}
  .vb .b-tabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding:8px 2px 0;margin:0 -16px;padding-left:16px}.vb .b-tabs::-webkit-scrollbar{display:none}.vb .b-tabs button{flex:0 0 auto}
  .vb .b-sheet{padding:20px 14px;min-height:0;box-shadow:5px 5px 0 #FDE68A}.vb .b-pt h3{font-size:25px}
  .vb .b-link-v{height:380px}.vb .b-link-v .m-phone{width:250px;transform-origin:top left}.vb .b-link-v .k1{left:0;transform:scale(.66) rotate(-4deg)}.vb .b-link-v .k2{left:auto;right:-4px;top:50px;transform:scale(.66) rotate(4deg);transform-origin:top right}
  .vb .b-n1{bottom:0;font-size:26px}.vb .b-n2{font-size:24px;top:-6px}
  .vb .b-diary{padding:8px 14px 14px}.vb .b-dhead{display:none}
  .vb .b-row{grid-template-columns:1fr;gap:6px;padding:16px 0}.vb .b-ar{justify-self:center;transform:rotate(90deg)}.vb .b-ar .b-doodle{width:46px;height:30px}
  .vb .b-facts{gap:18px}.vb .b-badge{width:150px;height:150px;padding:14px}.vb .b-badge b{font-size:34px}.vb .b-badge span{font-size:12.5px}
  .vb .b-pledge{padding:34px 20px 26px;box-shadow:6px 6px 0 #BBF7D0}.vb .b-steps{grid-template-columns:1fr}
  .vb .b-final{padding:44px 18px 38px}.vb .b-final .b-hcta{flex-direction:column}.vb .b-foot small{margin-left:0;font-size:20px}
}
'''
