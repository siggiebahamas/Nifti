# Version A, "Sunlit": white and airy with soft mint and sunshine glows, green ink, white cards.
from common import *

def sec(n, inner, cls='', lab=True, sid=None):
    tag = f'<span class="lab-tag"><b>A{n}</b>{SNAME[n]}</span>' if lab else ''
    return f'<section class="a-sec {cls}" data-s="{n}"{f" id={sid}" if sid else ""}>{tag}{inner}</section>\n'

def build(lab=True, brand='<b class="a-word">Nifti</b>'):
    h = []
    h.append(f'''<nav class="a-nav"><div class="a-in">{brand}
  <div class="a-links"><a href="#aTour">Features</a><a href="#aAi">AI tools</a><a href="#aDay">Your day</a><a href="#aPrice">Pricing</a></div>
  <div class="a-cta"><a class="a-login" data-go="login">Log in</a><a class="a-btn a-btn-g a-btn-sm" data-go="start">Start free</a></div></div></nav>''')
    # 1 intro
    h.append(sec(1, f'''<div class="a-aura"></div><div class="a-in a-hero-in">
  <div class="a-hero-t">
    <span class="a-eyebrow"><i></i>Made for Philippine shops, distributors and suppliers</span>
    <h1>Sell more.<br>Chase less.<br><span class="a-mark">Know every peso.</span></h1>
    <p class="a-lead">Nifti puts your Viber orders, your notebook utang, your stock and your cash drawer in one app. It reminds customers to pay, tells you what to reorder, and keeps the books while you sell. <b>Your customers don't need an app.</b></p>
    <div class="a-hcta"><a class="a-btn a-btn-g a-btn-lg" data-go="start">Start free {ic('arrow', 20)}</a><a class="a-btn a-btn-w a-btn-lg" data-go="demo">{ic('play', 20)}Open the demo shop</a></div>
    <ul class="a-ticks"><li>No card needed</li><li>Free plan for good</li><li>Works on any phone</li><li>Nifti never holds your money</li></ul>
  </div>
  <div class="a-hero-v" aria-hidden="true">{PHONE_SEQ}
    <div class="a-float f1"><small>Collected this week</small><b>₱84,200</b><em>reminders did the chasing</em></div>
    <div class="a-float f2"><span class="a-dot r"></span><div><b>Cement: 12 bags left</b><small>Reorder from Cebu Aggregates</small></div></div>
    <div class="a-float f3"><span class="a-dot g"></span><div><b>Cash drawer matched</b><small>Counted by Joy · 6:02 PM</small></div></div>
  </div></div>''', 'a-hero', lab))
    # 2 works with
    w = ''.join(f'<b>{x}</b>' for x in WORKS)
    h.append(sec(2, f'<div class="a-in a-works"><span>Works with what you already use</span><div class="a-marq"><div class="a-track">{w}{w}</div></div></div>', 'a-worksec', lab))
    # 3 benefits
    cards = ''.join(f'<div class="a-ben rv c{i}"><span class="a-ico">{ic(k, 24)}</span><h3>{t}</h3><p>{d}</p></div>' for i, (k, t, d) in enumerate(BENEFITS))
    h.append(sec(3, f'''<div class="a-in"><div class="a-head rv"><span class="a-k">WHY SHOPS SWITCH</span><h2>Less chasing, less typing, <span class="a-g">more selling.</span></h2><p>The jobs that eat your day, done for you.</p></div>
  <div class="a-bens">{cards}</div></div>''', 'a-soft', lab))
    # 4 tour
    tabs = ''.join(f'<button type="button" role="tab" data-tab="{i}">{ic(f[2], 18)}{f[1]}</button>' for i, f in enumerate(FEATURES))
    panels = ''.join(f'''<div class="a-panel" role="tabpanel" data-panel="{i}"{'' if i == 0 else ' hidden'}><div class="a-pt"><span class="a-tag {f[3]}">{TAGNAME[f[3]]}</span><h3>{f[4]}</h3><p>{f[5]}</p>
      <ul class="a-list">{''.join(f'<li>{b}</li>' for b in f[6])}</ul></div><div class="a-pv">{M[f[0]]}</div></div>''' for i, f in enumerate(FEATURES))
    h.append(sec(4, f'''<div class="a-in"><div class="a-head rv"><span class="a-k">ONE APP, THE WHOLE BUSINESS</span><h2>Everything between the order <span class="a-g">and the money in your hand.</span></h2><p>Tap any of these. Everything you see here is in the app today.</p></div>
  <div data-tabs data-auto><div class="a-tabs" role="tablist">{tabs}</div><div class="tab-prog a-prog"><i></i></div><div class="a-stage">{panels}</div></div></div>''', '', lab, 'aTour'))
    # 5 AI
    vis = ['<span class="hw">Mang Bert ..... 5,700</span><span class="hw">Aling Nena ..... 600</span><span class="ar">↓</span><span class="cl">Mang Bert Construction <b>₱5,700</b></span>',
           '<span class="bub">10 sako semento, 5 rolls wire</span><span class="ar">↓</span><span class="cl">Order · <b>₱4,880</b></span>',
           '<span class="mic"><i></i><i></i><i></i><i></i><i></i></span><span class="ar">↓</span><span class="cl">“Sale ngayong Sabado! Rebar ₱65 na lang…”</span>',
           '<span class="pp"><span class="ph b"></span><span class="ar">→</span><span class="ph a"></span></span>']
    ai = ''.join(f'<div class="a-ai rv"><div class="a-aiv v{i}">{vis[i]}</div><h3>{t}</h3><p>{d}</p></div>' for i, (k, t, d) in enumerate(AI))
    h.append(sec(5, f'''<div class="a-in"><div class="a-head rv"><span class="a-k">AI THAT DOES THE BORING PART</span><h2>You run the business. <span class="a-g">Nifti does the typing.</span></h2><p>Smart tools that save you hours every week, and always let you check before anything is saved.</p></div>
  <div class="a-ais">{ai}</div></div>''', 'a-aisec', lab, 'aAi'))
    # 6 no app
    h.append(sec(6, f'''<div class="a-in a-link"><div class="a-link-t rv"><span class="a-k">THE BEST PART</span><h2>Your customers and suppliers <span class="a-g">don't need an app.</span></h2>
    <p>They get a link by Viber or SMS. They tap it on any phone and confirm the order, see what they owe, or tell you they paid with the reference number. That's it.</p>
    <ul class="a-list big"><li>No download, no sign-up, no password</li><li>Statements of account they can open any time</li><li>If they join Nifti later, every order is waiting for them</li></ul></div>
  <div class="a-link-v rv" aria-hidden="true">{LINK_PHONES}</div></div>''', '', lab))
    # 7 day
    rows = ''.join(f'''<div class="a-row rv t{i}"><div class="a-time"><span class="a-sky s-{sky}">{ic(sky, 20)}</span><div><b>{t}</b><small>{lbl}</small></div></div>
      <div class="a-bef"><span class="ib">{ic(bi, 18)}</span><b>{bt}</b></div><div class="a-ar">{ic('arrow', 18)}</div>
      <div class="a-aft"><span class="ia">{ic(ai_, 18)}</span><div><b>{at}</b><span class="res">{ar}</span></div></div></div>''' for i, (t, lbl, sky, bi, bt, ai_, at, ar) in enumerate(DAY))
    sm = ''.join(f'<div class="rv"><span class="ia">{ic(k, 22)}</span><p><b>{t}</b><span>{d}</span></p></div>' for k, t, d in DAY_SUM)
    h.append(sec(7, f'''<div class="a-in"><div class="a-head rv"><span class="a-k">WHAT CHANGES</span><h2>Your day, <span class="a-g">before and after Nifti.</span></h2><p>From a hard day to an easy one.</p></div>
  <div class="a-daykey"><span class="kb">Before</span><span class="ka">With Nifti</span></div><div class="a-rows">{rows}</div><div class="a-sum">{sm}</div></div>''', 'a-day', lab, 'aDay'))
    # 8 facts
    fx = ''.join(f'<div class="rv"><b>{n}</b><span>{d}</span></div>' for n, d in FACTS)
    h.append(sec(8, f'<div class="a-in a-facts">{fx}</div>', 'a-factsec', lab))
    # 9 trust
    tr = ''.join(f'<div class="a-tr rv"><span class="a-ico">{ic(k, 24)}</span><h3>{t}</h3><p>{d}</p></div>' for k, t, d in TRUST)
    h.append(sec(9, f'''<div class="a-in"><div class="a-head rv"><span class="a-k">YOUR BUSINESS, KEPT SAFE</span><h2>Your records are yours. <span class="a-g">Full stop.</span></h2></div><div class="a-trs">{tr}</div></div>''', 'a-soft', lab))
    # 10 pricing
    def plan(p):
        eqm = 'Free for good' if p['k'] == 'free' else f"or {peso(p['y'])} a year, 2 months free"
        eqy = 'Free for good' if p['k'] == 'free' else f"Like {peso(round(p['y'] / 12))} a month · 2 months free"
        per_m, per_y = ('forever', 'forever') if p['k'] == 'free' else ('a month', 'a year')
        btn = {'free': '<a class="a-btn a-btn-w" data-go="start">Start free</a>', 'pro': '<a class="a-btn a-btn-g" data-go="start" data-plan="pro">Start with Pro</a>', 'business': '<a class="a-btn a-btn-w" data-go="start" data-plan="business">Start with Business</a>'}[p['k']]
        return f'''<div class="a-plan {p['k']} rv">{'<span class="a-flag">MOST SHOPS</span>' if p['k'] == 'pro' else ''}<h3>{p['name']}</h3><p class="who">{p['who']}</p>
      <div class="amt"><b data-m="{peso(p['m'])}" data-y="{peso(p['y'])}">{peso(p['m'])}</b><span data-m="{per_m}" data-y="{per_y}">{per_m}</span></div><div class="eq" data-m="{eqm}" data-y="{eqy}">{eqm}</div>
      <ul>{''.join(f'<li>{f}</li>' for f in p['f'])}</ul>{btn}</div>'''
    steps = ''.join(f'<div><span>{i + 1}</span><b>{t}</b><p>{d}</p></div>' for i, (t, d) in enumerate(PAYSTEPS))
    h.append(sec(10, f'''<div class="a-in" data-prices><div class="a-head rv"><span class="a-k">SIMPLE PRICES</span><h2>Start free. <span class="a-g">Upgrade when it pays for itself.</span></h2><p>No card, no contract. Pay by GCash, Maya or bank QR. Stop any time and keep your records.</p></div>
  <div class="a-cyc"><button type="button" class="on" data-cycle="monthly">Monthly</button><button type="button" data-cycle="yearly">Yearly <em>2 months free</em></button></div>
  <div class="a-plans">{''.join(plan(p) for p in PLANS)}</div>
  <div class="a-pay rv"><h3>How paying works</h3><div class="a-steps">{steps}</div></div></div>''', '', lab, 'aPrice'))
    # 11 faq
    fq = ''.join(f'<details{" open" if i == 0 else ""}><summary>{q}</summary><p>{a}</p></details>' for i, (q, a) in enumerate(FAQ))
    h.append(sec(11, f'''<div class="a-in a-faq"><div class="a-head left rv"><span class="a-k">QUICK ANSWERS</span><h2>Questions people <span class="a-g">usually ask.</span></h2><p>Something else? Start free and message us from inside the app.</p></div><div class="a-faqs">{fq}</div></div>''', 'a-soft', lab))
    # 12 final
    h.append(sec(12, f'''<div class="a-in"><div class="a-final rv"><div class="a-final-glow"></div><h2>Your next order could be <span class="a-mark">your first one in Nifti.</span></h2>
    <p>Set up your shop for free. Or look around the demo shop first, no sign-up needed.</p>
    <div class="a-hcta c"><a class="a-btn a-btn-g a-btn-lg" data-go="start">Start free {ic('arrow', 20)}</a><a class="a-btn a-btn-w a-btn-lg" data-go="demo">Open the demo shop</a></div></div></div>
  <footer class="a-foot"><div class="a-in">{brand}<div class="a-fl"><a href="#aTour">Features</a><a data-go="pricing">Pricing</a><a data-go="privacy">Privacy &amp; Security</a><a data-go="terms">Terms</a><a data-go="login">Log in</a></div><small>Made in the Philippines for the businesses that keep it running.</small></div></footer>''', 'a-end', lab))
    return '\n'.join(h)

CSS = r'''
.va{--ink:#0B1F17;--g:#1F6B45;--g2:#15803D;--mint:#34D399;--mintbg:#ECFDF5;--sun:#FACC15;--sunbg:#FEF9C3;--line:#E3E9E5;--soft:#F6FBF8;--muted:#3F4F47;
  font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink);background:#FFFFFF;overflow-x:clip;-webkit-font-smoothing:antialiased;--lab:#1F6B45}
.va *{box-sizing:border-box}.va h1,.va h2,.va h3{font-family:'Plus Jakarta Sans',Inter,sans-serif;margin:0;letter-spacing:-.02em}.va p{margin:0}.va a{cursor:pointer;text-decoration:none;color:inherit}
.va .a-in{width:min(1180px,100%);margin:0 auto;padding:0 24px}
.va .a-nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.82);backdrop-filter:saturate(170%) blur(14px);-webkit-backdrop-filter:saturate(170%) blur(14px);border-bottom:1px solid rgba(16,40,30,.08)}
.va .a-nav .a-in{display:flex;align-items:center;gap:28px;height:68px}
.va .brand{display:flex;align-items:center;gap:10px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:22px;color:var(--ink)}.va .brand img{height:30px;width:auto}
.va .a-word{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;color:var(--g)}
.va .a-links{display:flex;gap:26px;margin-left:10px}.va .a-links a{color:var(--muted);font-weight:600;font-size:15.5px}.va .a-links a:hover{color:var(--g)}
.va .a-cta{margin-left:auto;display:flex;align-items:center;gap:18px}.va .a-login{font-weight:700;font-size:15.5px}
.va .a-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;transition:transform .15s,box-shadow .2s,background .2s;white-space:nowrap}
.va .a-btn:hover{transform:translateY(-2px)}.va .a-btn-sm{padding:10px 18px;font-size:15px}.va .a-btn-lg{padding:16px 26px;font-size:17px;border-radius:16px}
.va .a-btn-g{background:var(--g);color:#FFFFFF;box-shadow:0 12px 26px -12px rgba(31,107,69,.75)}.va .a-btn-g:hover{background:#185A39;box-shadow:0 18px 34px -14px rgba(31,107,69,.85)}
.va .a-btn-w{background:#FFFFFF;color:var(--ink);border:1.5px solid #CFDCD4}.va .a-btn-w:hover{border-color:var(--g);color:var(--g)}
/* hero */
.va .a-hero{position:relative;padding:70px 0 40px;overflow:hidden;isolation:isolate;background:linear-gradient(180deg,#FFFFFF 0%,#F7FCF9 100%)}
.va .a-aura{position:absolute;inset:0;z-index:-1;background:radial-gradient(520px 420px at 82% 18%,rgba(52,211,153,.30),transparent 70%),radial-gradient(460px 380px at 62% 85%,rgba(250,204,21,.26),transparent 70%),radial-gradient(420px 360px at 5% 10%,rgba(125,211,252,.20),transparent 70%)}
.va .a-aura::after{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(31,107,69,.12) 1px,transparent 1.2px);background-size:22px 22px;-webkit-mask-image:radial-gradient(ellipse at 70% 40%,#000 15%,transparent 70%);mask-image:radial-gradient(ellipse at 70% 40%,#000 15%,transparent 70%)}
.va .a-hero-in{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px;align-items:center}
.va .a-eyebrow{display:inline-flex;align-items:center;gap:10px;padding:8px 16px 8px 12px;border-radius:999px;background:#FFFFFF;border:1px solid #D7EBDF;font-size:14.5px;font-weight:700;color:var(--g);box-shadow:0 6px 18px -12px rgba(31,107,69,.6)}
.va .a-eyebrow i{width:8px;height:8px;border-radius:50%;background:var(--mint);box-shadow:0 0 0 4px rgba(52,211,153,.25);animation:aPulse 2s ease-in-out infinite}
.va .a-hero h1{margin-top:22px;font-size:clamp(44px,4.2vw,60px);line-height:1.02;font-weight:800;letter-spacing:-.035em}
.va .a-mark{color:var(--g);background:linear-gradient(transparent 62%,rgba(250,204,21,.65) 62%,rgba(250,204,21,.65) 92%,transparent 92%);padding:0 .06em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.va .a-g{color:var(--g)}
.va .a-lead{margin-top:22px;font-size:clamp(17px,1.45vw,19.5px);line-height:1.6;color:var(--muted);max-width:590px}.va .a-lead b{color:var(--ink)}
.va .a-hcta{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}.va .a-hcta.c{justify-content:center}
.va .a-ticks{list-style:none;display:flex;flex-wrap:wrap;gap:10px 20px;padding:0;margin:24px 0 0}
.va .a-ticks li{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:var(--muted)}.va .a-ticks li::before{content:"✓";display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#DCFCE7;color:var(--g2);font-size:12px;font-weight:900}
.va .a-hero-v{position:relative;display:flex;justify-content:flex-end;padding-right:16px;min-height:600px}
.va .a-hero-v .m-phone{transform:rotate(-2deg);animation:aBob 7s ease-in-out infinite}
.va .a-float{position:absolute;z-index:4;max-width:250px;background:#FFFFFF;border-radius:18px;padding:13px 15px;box-shadow:0 24px 50px -22px rgba(16,40,30,.45),0 0 0 1px rgba(16,40,30,.06);display:flex;gap:10px;align-items:center}
.va .a-float b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px}.va .a-float small{display:block;font-size:12.5px;color:var(--muted);font-weight:600}
.va .a-float.f1{flex-direction:column;align-items:flex-start;gap:2px;top:70px;left:0;animation:aBob 6s ease-in-out infinite .6s}.va .a-float.f1 b{font-size:28px;color:var(--g);letter-spacing:-.02em}
.va .a-float.f1 em{font-style:normal;font-size:12.5px;font-weight:700;color:var(--g2);background:#DCFCE7;border-radius:999px;padding:2px 9px;margin-top:4px}
.va .a-float.f2{top:290px;left:30px;animation:aBob 7s ease-in-out infinite 1.2s}.va .a-float.f3{top:450px;left:6px;animation:aBob 8s ease-in-out infinite .2s}
.va .a-dot{flex:0 0 12px;height:12px;border-radius:50%}.va .a-dot.r{background:#EF4444;box-shadow:0 0 0 5px rgba(239,68,68,.15)}.va .a-dot.g{background:#22C55E;box-shadow:0 0 0 5px rgba(34,197,94,.18)}
/* works */
.va .a-worksec{padding:26px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#FFFFFF}
.va .a-works{display:flex;align-items:center;gap:24px}.va .a-works>span{flex:0 0 auto;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#6B7A72}
.va .a-marq{flex:1;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.va .a-track{display:flex;gap:44px;width:max-content;animation:aMarq 38s linear infinite}.va .a-track b{font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;font-weight:800;color:#5B6B63;white-space:nowrap}
/* shared section bits */
.va .a-sec{position:relative;padding:100px 0}.va .a-soft{background:var(--soft)}
.va .a-head{text-align:center;max-width:840px;margin:0 auto 50px}.va .a-head.left{text-align:left;margin:0}
.va .a-k{display:inline-block;font-size:13px;font-weight:800;letter-spacing:.12em;color:var(--g);background:#DCFCE7;padding:7px 14px;border-radius:999px}
.va .a-head h2{margin-top:18px;font-size:clamp(32px,4.2vw,52px);line-height:1.08;font-weight:800}.va .a-head p{margin-top:14px;font-size:clamp(16.5px,1.35vw,19px);line-height:1.6;color:var(--muted)}
/* benefits */
.va .a-bens{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.va .a-ben{border-radius:24px;padding:26px;background:#FFFFFF;border:1px solid var(--line);box-shadow:0 18px 40px -34px rgba(16,40,30,.5);transition:transform .25s,box-shadow .25s}
.va .a-ben:hover{transform:translateY(-6px);box-shadow:0 28px 50px -30px rgba(16,40,30,.45)}
.va .a-ico{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:#DCFCE7;color:var(--g)}
.va .a-ben.c1 .a-ico{background:#FEF3C7;color:#A16207}.va .a-ben.c2 .a-ico{background:#E0F2FE;color:#0369A1}.va .a-ben.c3 .a-ico{background:#F3E8FF;color:#7E22CE}.va .a-ben.c4 .a-ico{background:#FCE7F3;color:#BE185D}.va .a-ben.c5 .a-ico{background:#ECFCCB;color:#4D7C0F}
.va .a-ben h3{margin-top:18px;font-size:20px}.va .a-ben p{margin-top:8px;font-size:15.5px;line-height:1.55;color:var(--muted)}
/* tour */
.va .a-tabs{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:1040px;margin:0 auto}
.va .a-tabs button{display:inline-flex;align-items:center;gap:8px;font:inherit;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;padding:10px 16px;border-radius:999px;border:1.5px solid var(--line);background:#FFFFFF;color:var(--ink);cursor:pointer;transition:all .18s}
.va .a-tabs button svg{color:var(--g)}.va .a-tabs button:hover{border-color:#9FD3B7;background:var(--soft)}
.va .a-tabs button.on{background:var(--g);border-color:var(--g);color:#FFFFFF;box-shadow:0 10px 22px -12px rgba(31,107,69,.85)}.va .a-tabs button.on svg{color:#FFFFFF}
.va .a-prog{width:min(260px,60%);height:4px;border-radius:4px;background:#E7EFEA;margin:20px auto 0;overflow:hidden}.va .a-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--mint),var(--sun))}.va .a-prog.run i{animation:aProg 7s linear forwards}.va .stopped .a-prog{visibility:hidden}
.va .a-stage{margin-top:30px;border-radius:32px;background:radial-gradient(500px 300px at 90% 0%,rgba(52,211,153,.18),transparent 70%),radial-gradient(400px 300px at 0% 100%,rgba(250,204,21,.16),transparent 70%),#F7FBF8;border:1px solid #DCEDE3;padding:46px;min-height:520px}
.va .a-panel{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:46px;align-items:center}.va .a-panel[hidden]{display:none}
.va .a-panel.on .a-pt{animation:aIn .5s ease both}.va .a-panel.on .a-pv{animation:aIn .6s ease .08s both}
.va .a-tag{display:inline-block;font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:5px 12px;border-radius:999px}
.va .a-tag.free{background:#DCFCE7;color:#166534}.va .a-tag.pro{background:#DBEAFE;color:#1E40AF}.va .a-tag.biz{background:#EDE9FE;color:#5B21B6}.va .a-tag.ai{background:linear-gradient(90deg,#FEF08A,#BBF7D0);color:#14532D}
.va .a-pt h3{margin-top:14px;font-size:clamp(26px,2.5vw,34px);line-height:1.15}.va .a-pt>p{margin-top:12px;font-size:17px;line-height:1.6;color:var(--muted)}
.va .a-list{list-style:none;padding:0;margin:20px 0 0;display:grid;gap:12px}.va .a-list li{position:relative;padding-left:32px;font-size:16px;line-height:1.5;font-weight:500}
.va .a-list li::before{content:"";position:absolute;left:0;top:2px;width:22px;height:22px;border-radius:50%;background:var(--g) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 12 4 4 8-8'/%3E%3C/svg%3E") center/13px no-repeat}
.va .a-list.big li{font-size:17px}.va .a-pv{display:flex;justify-content:center}
/* AI */
.va .a-aisec{background:linear-gradient(180deg,#FBFAFF 0%,#F2FBF6 100%)}
.va .a-ais{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
.va .a-ai{border-radius:24px;padding:18px;background:#FFFFFF;border:1px solid var(--line);box-shadow:0 18px 40px -34px rgba(16,40,30,.5);transition:transform .25s}.va .a-ai:hover{transform:translateY(-6px)}
.va .a-ai h3{margin-top:16px;font-size:19px}.va .a-ai p{margin-top:6px;font-size:15px;line-height:1.55;color:var(--muted)}
.va .a-aiv{height:150px;border-radius:16px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:7px;padding:12px;text-align:center;overflow:hidden}
.va .a-aiv.v0{background:#FFFBEB}.va .a-aiv.v1{background:#F5F3FF}.va .a-aiv.v2{background:#ECFDF5}.va .a-aiv.v3{background:#F0F9FF}
.va .a-aiv .hw{font-family:Caveat,cursive;font-size:21px;color:#1E3A8A;line-height:1}.va .a-aiv .ar{color:var(--g);font-weight:900;font-size:17px;animation:aNudge 1.6s ease-in-out infinite}
.va .a-aiv .cl{font-size:12.5px;font-weight:700;background:#FFFFFF;padding:6px 10px;border-radius:10px;box-shadow:0 4px 12px -6px rgba(0,0,0,.2);line-height:1.35}.va .a-aiv .cl b{color:var(--g)}
.va .a-aiv .bub{font-size:12.5px;background:#7C3AED;color:#FFFFFF;padding:7px 11px;border-radius:14px 14px 14px 4px}
.va .a-aiv .mic{display:flex;gap:4px;align-items:center;height:32px}.va .a-aiv .mic i{width:6px;border-radius:4px;background:var(--g2);animation:aWave 1s ease-in-out infinite}
.va .a-aiv .mic i:nth-child(1){height:12px}.va .a-aiv .mic i:nth-child(2){height:24px;animation-delay:.1s}.va .a-aiv .mic i:nth-child(3){height:32px;animation-delay:.2s}.va .a-aiv .mic i:nth-child(4){height:20px;animation-delay:.3s}.va .a-aiv .mic i:nth-child(5){height:10px;animation-delay:.4s}
.va .a-aiv .pp{display:flex;align-items:center;gap:10px}.va .a-aiv .ph{width:66px;height:80px;border-radius:12px;position:relative}
.va .a-aiv .ph.b{background:linear-gradient(160deg,#A8A29E,#D6D3D1 60%,#78716C);transform:rotate(-6deg);filter:saturate(.6)}.va .a-aiv .ph.a{background:#FFFFFF;box-shadow:0 10px 22px -8px rgba(31,107,69,.45)}
.va .a-aiv .ph::after{content:"";position:absolute;left:17px;right:17px;top:18px;bottom:15px;border-radius:8px;background:linear-gradient(180deg,#E7E5E4,#A8A29E)}
/* link */
.va .a-link{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;align-items:center}
.va .a-link-t h2{margin-top:18px;font-size:clamp(32px,3.8vw,48px);line-height:1.08}.va .a-link-t>p{margin-top:16px;font-size:18px;line-height:1.6;color:var(--muted)}
.va .a-link-v{position:relative;height:520px}.va .a-link-v::before{content:"";position:absolute;inset:8% 6%;border-radius:50%;background:radial-gradient(circle,rgba(52,211,153,.22),rgba(250,204,21,.12) 55%,transparent 70%);z-index:0}
.va .a-link-v .m-phone{position:absolute}.va .a-link-v .k1{left:4%;top:10px;transform:rotate(-5deg);z-index:2}.va .a-link-v .k2{right:4%;top:70px;transform:rotate(5deg)}
/* day */
.va .a-day{background:linear-gradient(180deg,#FFF9E8 0%,#F0F8FF 45%,#F3F1FF 100%)}
.va .a-daykey{display:flex;justify-content:center;gap:12px;margin:-24px 0 26px}.va .a-daykey span{font-size:13px;font-weight:800;padding:5px 12px;border-radius:999px}
.va .a-daykey .kb{background:#FFE4E6;color:#9F1239}.va .a-daykey .ka{background:#DCFCE7;color:#166534}
.va .a-rows{display:grid;gap:14px;max-width:1000px;margin:0 auto}
.va .a-row{display:grid;grid-template-columns:170px minmax(0,1fr) 44px minmax(0,1.15fr);gap:14px;align-items:center}
.va .a-time{display:flex;align-items:center;gap:12px}.va .a-time b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:17px}.va .a-time small{display:block;font-size:13px;color:var(--muted);font-weight:600;line-height:1.3}
.va .a-sky{flex:0 0 44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#FFFFFF;box-shadow:0 8px 18px -12px rgba(0,0,0,.3)}
.va .s-sunrise{color:#D97706;background:#FEF3C7}.va .s-sun{color:#CA8A04;background:#FEF9C3}.va .s-sunset{color:#DB2777;background:#FCE7F3}.va .s-moon{color:#6D28D9;background:#EDE9FE}
.va .a-bef,.va .a-aft{display:flex;align-items:center;gap:12px;border-radius:18px;padding:16px 18px;min-height:72px}
.va .a-bef{background:rgba(255,255,255,.75);border:1px solid #F5D0D6}.va .a-bef b{font-size:16px;color:#7A2E3B;font-weight:700}
.va .a-bef .ib{flex:0 0 36px;height:36px;display:grid;place-items:center;border-radius:11px;background:#FFE4E6;color:#BE123C}
.va .a-ar{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--g);color:#FFFFFF;box-shadow:0 8px 18px -8px rgba(31,107,69,.7)}
.va .a-aft{background:#FFFFFF;border:1.5px solid #86EFAC;box-shadow:0 16px 30px -24px rgba(21,128,61,.7)}.va .a-aft .ia{flex:0 0 36px;height:36px;display:grid;place-items:center;border-radius:11px;background:#DCFCE7;color:var(--g2)}
.va .a-aft b{display:block;font-size:16px}.va .a-aft .res{display:inline-block;margin-top:4px;font-size:12.5px;font-weight:800;color:#166534;background:#DCFCE7;border-radius:999px;padding:2px 9px}
.va .a-sum{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:1000px;margin:28px auto 0}
.va .a-sum>div{display:flex;align-items:center;gap:14px;border-radius:20px;padding:18px 20px;background:#FFFFFF;border:1px solid var(--line)}
.va .a-sum .ia{flex:0 0 46px;height:46px;display:grid;place-items:center;border-radius:14px;background:var(--g);color:#FFFFFF}
.va .a-sum b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:19px}.va .a-sum p span{font-size:15px;color:var(--muted)}
/* facts */
.va .a-factsec{padding:60px 0;background:#FFFFFF}
.va .a-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.va .a-facts>div{border-left:4px solid var(--sun);padding-left:18px}
.va .a-facts b{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(38px,4.4vw,56px);font-weight:800;color:var(--g);letter-spacing:-.03em;line-height:1}
.va .a-facts span{display:block;margin-top:10px;font-size:16px;color:var(--muted);font-weight:600;line-height:1.4}
/* trust */
.va .a-trs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
.va .a-tr{border-radius:22px;padding:24px;background:#FFFFFF;border:1px solid var(--line)}.va .a-tr h3{margin-top:16px;font-size:18px}.va .a-tr p{margin-top:8px;font-size:15.5px;line-height:1.55;color:var(--muted)}
/* pricing */
.va .a-cyc{display:flex;width:max-content;max-width:100%;margin:0 auto 36px;padding:5px;border-radius:999px;background:#FFFFFF;border:1px solid var(--line);box-shadow:0 8px 20px -14px rgba(16,40,30,.5)}
.va .a-cyc button{font:inherit;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15.5px;padding:10px 22px;border-radius:999px;border:0;background:transparent;color:var(--ink);cursor:pointer}
.va .a-cyc button em{font-style:normal;font-size:12.5px;font-weight:800;color:var(--g2);background:#DCFCE7;border-radius:999px;padding:2px 8px;margin-left:6px}.va .a-cyc button.on{background:var(--g);color:#FFFFFF}.va .a-cyc button.on em{background:var(--sun);color:var(--ink)}
.va .a-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:stretch}
.va .a-plan{position:relative;border-radius:28px;padding:30px 28px;background:#FFFFFF;border:1px solid var(--line);display:flex;flex-direction:column}
.va .a-plan h3{font-size:22px}.va .a-plan .who{margin-top:6px;font-size:15px;color:var(--muted);line-height:1.5;min-height:46px}
.va .a-plan .amt{display:flex;align-items:baseline;gap:8px;margin-top:18px}.va .a-plan .amt b{font-family:'Plus Jakarta Sans',sans-serif;font-size:50px;font-weight:800;letter-spacing:-.03em;line-height:1}.va .a-plan .amt span{font-size:15px;color:var(--muted);font-weight:600}
.va .a-plan .eq{font-size:13.5px;color:var(--g2);font-weight:700;min-height:20px;margin-top:6px}
.va .a-plan ul{list-style:none;padding:0;margin:20px 0 26px;display:grid;gap:11px;flex:1}.va .a-plan li{position:relative;padding-left:30px;font-size:15px;line-height:1.45}
.va .a-plan li::before{content:"";position:absolute;left:0;top:1px;width:20px;height:20px;border-radius:50%;background:#DCFCE7 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2315803D' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 12 4 4 8-8'/%3E%3C/svg%3E") center/12px no-repeat}
.va .a-plan .a-btn{width:100%;padding:15px;font-size:16px}
.va .a-plan.pro{border:2px solid var(--g);background:linear-gradient(180deg,#F4FCF7,#FFFFFF 40%);box-shadow:0 34px 70px -40px rgba(31,107,69,.65);transform:translateY(-10px)}
.va .a-flag{position:absolute;top:-14px;left:28px;font-size:12.5px;font-weight:800;letter-spacing:.08em;padding:6px 14px;border-radius:999px;background:var(--sun);color:var(--ink);box-shadow:0 8px 20px -8px rgba(250,204,21,.8)}
.va .a-pay{margin-top:40px;border-radius:24px;padding:26px 28px;background:var(--soft);border:1px solid var(--line)}.va .a-pay h3{font-size:19px}
.va .a-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:16px}.va .a-steps>div{display:grid;grid-template-columns:36px 1fr;gap:4px 12px}
.va .a-steps span{grid-row:span 2;display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--g);color:#FFFFFF;font-weight:800}.va .a-steps b{font-size:15.5px}.va .a-steps p{font-size:14.5px;color:var(--muted);line-height:1.5}
/* faq */
.va .a-faq{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:56px;align-items:start}.va .a-faqs{display:grid;gap:12px}
.va .a-faqs details{border-radius:18px;border:1px solid var(--line);background:#FFFFFF;transition:border-color .2s,box-shadow .2s}.va .a-faqs details[open]{border-color:#9FD3B7;box-shadow:0 14px 30px -24px rgba(16,40,30,.6)}
.va .a-faqs summary{list-style:none;cursor:pointer;padding:18px 56px 18px 22px;position:relative;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:17px}.va .a-faqs summary::-webkit-details-marker{display:none}
.va .a-faqs summary::after{content:"+";position:absolute;right:18px;top:50%;transform:translateY(-50%);width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:var(--soft);color:var(--g);font-size:20px;font-weight:700}
.va .a-faqs details[open] summary::after{content:"−";background:var(--g);color:#FFFFFF}.va .a-faqs details p{padding:0 22px 20px;font-size:16px;line-height:1.6;color:var(--muted)}
/* final */
.va .a-end{padding:90px 0 0}
.va .a-final{position:relative;overflow:hidden;text-align:center;border-radius:36px;padding:76px 32px;background:linear-gradient(120deg,#FEF9C3 0%,#ECFDF5 50%,#E0F2FE 100%);border:1px solid #E5EFE0}
.va .a-final-glow{position:absolute;width:420px;height:420px;border-radius:50%;background:rgba(52,211,153,.25);filter:blur(80px);right:-120px;top:-160px}
.va .a-final h2{position:relative;font-size:clamp(34px,4.6vw,58px);line-height:1.08}.va .a-final p{position:relative;margin:16px auto 0;max-width:560px;font-size:18px;line-height:1.6;color:var(--muted)}
.va .a-foot{margin-top:70px;border-top:1px solid var(--line);padding:28px 0 40px}.va .a-foot .a-in{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.va .a-fl{display:flex;gap:22px;flex-wrap:wrap}.va .a-fl a{color:var(--muted);font-weight:600;font-size:15px}.va .a-fl a:hover{color:var(--g)}.va .a-foot small{margin-left:auto;font-size:14px;color:#6B7A72}
/* reveal */
.va .rv{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.8,.2,1)}.va .rv.in{opacity:1;transform:none}
@keyframes aPulse{0%,100%{box-shadow:0 0 0 4px rgba(52,211,153,.25)}50%{box-shadow:0 0 0 8px rgba(52,211,153,.05)}}
@keyframes aBob{0%,100%{translate:0 0}50%{translate:0 -10px}}@keyframes aMarq{to{transform:translateX(-50%)}}@keyframes aProg{to{width:100%}}
@keyframes aIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}@keyframes aNudge{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}@keyframes aWave{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1)}}
@media (prefers-reduced-motion:reduce){.va *,.va *::before,.va *::after{animation:none !important;transition:none !important}.va .rv{opacity:1;transform:none}}
@media (max-width:1080px){
  .va .a-links{display:none}.va .a-hero-in{grid-template-columns:1fr;gap:16px}.va .a-hero-t{text-align:center}.va .a-lead{margin-left:auto;margin-right:auto}.va .a-hcta,.va .a-ticks{justify-content:center}
  .va .a-hero h1{font-size:clamp(46px,8vw,70px)}
  .va .a-hero-v{justify-content:center;padding-right:0;min-height:620px;margin-top:16px}.va .a-float{max-width:200px}
  .va .a-float.f1{left:calc(50% - 370px)}.va .a-float.f2{left:calc(50% + 170px);top:250px}.va .a-float.f3{left:calc(50% - 380px);top:460px}
  .va .a-bens,.va .a-ais,.va .a-trs{grid-template-columns:repeat(2,minmax(0,1fr))}.va .a-panel{grid-template-columns:1fr;gap:30px}.va .a-stage{padding:34px}
  .va .a-link{grid-template-columns:1fr}.va .a-plans{grid-template-columns:1fr;max-width:520px;margin:0 auto}.va .a-plan.pro{transform:none}
  .va .a-faq{grid-template-columns:1fr;gap:26px}.va .a-head.left{text-align:center}.va .a-facts{grid-template-columns:repeat(2,1fr);gap:30px}
  .va .a-row{grid-template-columns:150px minmax(0,1fr) 40px minmax(0,1.1fr)}
}
@media (max-width:760px){.va .a-float.f2,.va .a-float.f3{display:none}.va .a-float.f1{left:auto;right:-4px;top:auto;bottom:70px;padding:10px 12px}}
@media (max-width:640px){
  .va .a-in{padding:0 16px}.va .a-nav .a-in{height:60px;gap:12px}.va .a-cta{gap:12px}
  .va .a-hero{padding:40px 0 24px}.va .a-hero h1{font-size:clamp(40px,11vw,50px)}.va .a-eyebrow{font-size:13px;text-align:left}.va .a-lead{font-size:17px}
  .va .a-hcta{flex-direction:column}.va .a-hcta .a-btn{width:100%}.va .a-ticks li{font-size:14px}
  .va .a-hero-v{min-height:540px;transform:scale(.94);transform-origin:top center;margin-bottom:-30px}
  .va .a-works{flex-direction:column;align-items:stretch;gap:12px;text-align:center}.va .a-track b{font-size:17px}
  .va .a-sec{padding:66px 0}.va .a-head{margin-bottom:32px}.va .a-head h2{font-size:clamp(28px,8vw,36px)}
  .va .a-bens,.va .a-ais,.va .a-trs{grid-template-columns:1fr}
  .va .a-tabs{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:2px 16px 6px}.va .a-tabs::-webkit-scrollbar{display:none}.va .a-tabs button{flex:0 0 auto}
  .va .a-stage{padding:22px 14px;border-radius:24px;min-height:0}.va .a-pt h3{font-size:26px}
  .va .a-link-v{height:360px}.va .a-link-v .m-phone{width:250px;transform-origin:top left}.va .a-link-v .k1{left:0;transform:scale(.66) rotate(-4deg)}.va .a-link-v .k2{left:auto;right:-4px;top:40px;transform:scale(.66) rotate(4deg);transform-origin:top right}
  .va .a-daykey{margin-top:-14px}
  .va .a-row{grid-template-columns:1fr;gap:8px;padding:16px;border-radius:22px;background:rgba(255,255,255,.6);border:1px solid rgba(16,40,30,.06)}
  .va .a-ar{transform:rotate(90deg);justify-self:center;width:34px;height:34px}.va .a-sum{grid-template-columns:1fr}
  .va .a-facts{gap:24px 16px}.va .a-facts span{font-size:14.5px}
  .va .a-cyc button{padding:10px 16px;font-size:15px}.va .a-plan{padding:26px 22px}.va .a-plan .who{min-height:0}.va .a-steps{grid-template-columns:1fr}
  .va .a-faqs summary{font-size:16px;padding:16px 52px 16px 18px}.va .a-final{padding:54px 20px;border-radius:28px}.va .a-final .a-hcta{flex-direction:column}.va .a-foot small{margin-left:0}
}
'''
