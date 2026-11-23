/* Round 67: complete the visible daily-control, intelligence, staff and counterparty experience.
   Uses existing Nifti records and actions only. No AI services, new tables, or permission changes. */
(function(){
 'use strict';
 const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const peso=n=>'₱'+Math.round(Number(n)||0).toLocaleString('en-PH');
 function marketing(){
  const page=document.getElementById('view-index');if(!page)return;
  // The original How It Works is the canonical section. Remove only later duplicates.
  const how=[...page.querySelectorAll('.nf20-how')];how.slice(1).forEach(x=>x.remove());
  page.querySelectorAll('#nf63How, #mkCalc, #nf64-calm, [data-nf64-calm]').forEach(x=>x.remove());
  const hero=page.querySelector('.f4-hero');
  if(hero){
   const p=hero.querySelector('p.nf66-tagline, p');
   if(p && !p.classList.contains('nf66-tagline')){p.classList.add('nf66-tagline');p.innerHTML='<span>ORDERS.</span><span>STOCK.</span><span>CASH.</span><strong>UNDER CONTROL.</strong>';}
   let points=hero.querySelector('.nf64-hero-points');
   if(points && !points.querySelector('.nf66-benefit')){
    const benefits=[
     ['Sell with confidence','Every customer order, clearly accounted for.','M7 7h10M7 12h10M7 17h6'],
     ['Keep stock moving','Purchases, stock and deliveries connected.','M4 7h16v13H4zM8 7V4h8v3'],
     ['Know your numbers','See sales, costs, collections and profit.','M3 19V5m0 14h18M7 15l4-4 3 3 6-7']
    ];
    points.innerHTML=benefits.map(x=>'<div class="nf67-benefit"><span class="nf67-benefit-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+x[2]+'"/></svg></span><span><b>'+x[0]+'</b><small>'+x[1]+'</small></span><i>✓</i></div>').join('');
   }
  }
  // Prevent stale, competing inline handlers from overriding the selected feature panel.
  const show=page.querySelector('#mkShow');
  if(show){
   const tabs=[...show.querySelectorAll('.nf20-stabs button')],panels=[...show.querySelectorAll('.nf20-sp')];
   tabs.forEach(t=>{t.removeAttribute('onclick');t.setAttribute('role','tab');});
   if(!show.dataset.nf67Tabs){
    show.dataset.nf67Tabs='1';
    show.addEventListener('click',e=>{
     const tab=e.target.closest('.nf20-stabs button');if(!tab||!show.contains(tab))return;
     const ts=[...show.querySelectorAll('.nf20-stabs button')],ps=[...show.querySelectorAll('.nf20-sp')],i=ts.indexOf(tab);
     if(i<0||!ps[i])return;
     e.preventDefault();e.stopImmediatePropagation();
     ts.forEach((t,j)=>{const on=j===i;t.classList.toggle('on',on);t.setAttribute('aria-selected',String(on));t.setAttribute('tabindex',on?'0':'-1');});
     ps.forEach((p,j)=>{p.hidden=j!==i;p.classList.toggle('on',j===i);});
    },true);
   }
  }
  // Replace the missing calculator with a useful interactive preview integrated into the existing benefits section.
  const out=page.querySelector('#nf63Outcomes');
  if(out&&!out.querySelector('.nf67-control-preview')){
   const box=document.createElement('div');box.className='nf67-control-preview';
   box.innerHTML='<div class="nf67-preview-head"><span class="nf67-eyebrow">SEE THE DIFFERENCE</span><h3>What would you like to get under control?</h3><p>Choose a business pressure. See how Nifti connects the next steps.</p></div><div class="nf67-preview-tabs" role="tablist" aria-label="Business priorities"><button type="button" class="on" aria-selected="true" data-view="orders"><span>01</span><b>Orders</b></button><button type="button" aria-selected="false" data-view="cash"><span>02</span><b>Cash</b></button><button type="button" aria-selected="false" data-view="stock"><span>03</span><b>Stock & delivery</b></button></div><div class="nf67-preview-result" aria-live="polite"><div><small>ORDERS, WITHOUT THE CHASING</small><b>One clear order. Everyone knows the next step.</b><p>Review the order, share a link, and see the customer response in the same workflow.</p></div><div class="nf67-preview-flow"><span>ORDER</span><i>→</i><span>CONFIRM</span><i>→</i><span>FULFIL</span><i>→</i><span>RECORD</span></div></div>';
   out.appendChild(box);
   const data={
    orders:['ORDERS, WITHOUT THE CHASING','One clear order. Everyone knows the next step.','Review the order, share a link, and see the customer response in the same workflow.',['ORDER','CONFIRM','FULFIL','RECORD']],
    cash:['CASH, WITHOUT THE GUESSWORK','Know what came in—and what is still due.','Keep invoices, payment promises, collections and recorded payments connected.',['INVOICE','PROMISE','COLLECT','RECORD']],
    stock:['STOCK, WITHOUT THE SURPRISES','See what is available and what needs attention.','Connect customer demand with purchasing, receiving and delivery updates.',['DEMAND','PURCHASE','RECEIVE','DELIVER']]
   };
   box.addEventListener('click',e=>{
    const b=e.target.closest('[data-view]');if(!b)return;
    const d=data[b.dataset.view];if(!d)return;
    box.querySelectorAll('[data-view]').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-selected',String(on));});
    const result=box.querySelector('.nf67-preview-result');result.querySelector('small').textContent=d[0];result.querySelector('b').textContent=d[1];result.querySelector('p').textContent=d[2];
    const flow=result.querySelector('.nf67-preview-flow');flow.replaceChildren();
    d[3].forEach((v,i)=>{if(i){const arrow=document.createElement('i');arrow.textContent='→';flow.appendChild(arrow);}const s=document.createElement('span');s.textContent=v;flow.appendChild(s);});
   });
  }
  // Pricing: retain the original published monthly benchmark and show the beta offer clearly.
  page.querySelectorAll('.nf26-pl-p.nf64-beta-price').forEach(el=>{
   const old=el.querySelector('s'),now=el.querySelector('b'),per=el.querySelector('span');
   if(old){old.setAttribute('aria-label','Original monthly price '+old.textContent);old.classList.add('nf67-price-anchor');}
   if(now){now.textContent='₱0';now.setAttribute('aria-label','Beta price zero pesos');}
   if(per)per.textContent='per month · beta access';
  });
  // Stronger, concise FAQ and final call-to-action hierarchy.
  page.querySelectorAll('.f6-faq-g .faq-item .a').forEach(a=>a.style.color='#18251d');
  const cta=page.querySelector('.cta-band');if(cta){const actions=cta.querySelector('.f4-hero-cta');if(actions){actions.style.justifyContent='center';actions.style.alignItems='center';}}
 }
 function decorateHome(){
  const home=document.getElementById('mhHome');if(!home)return;
  const hero=home.querySelector('.hero');if(!hero)return;
  const rows=home.querySelector('.mh-priority')||home.querySelector('.rows');
  const lanes=rows?[...rows.querySelectorAll('.lane')]:[];
  const red=lanes.find(x=>x.querySelector('.lane-h.r')),amber=lanes.find(x=>x.querySelector('.lane-h.y')),green=lanes.find(x=>x.querySelector('.lane-h.g'));
  const count=x=>x?x.querySelectorAll('.task').length:0;
  let pulse=home.querySelector('.nf67-pulse');
  if(!pulse){pulse=document.createElement('section');pulse.className='nf67-pulse';hero.insertAdjacentElement('afterend',pulse);}
  const urgent=count(red),week=count(amber),clear=count(green);
  const pulseSig=[urgent,week,clear,typeof APP_TODAY!=='undefined'?APP_TODAY:''].join('|');
  if(pulse.dataset.sig!==pulseSig){
   pulse.innerHTML='<div class="nf67-pulse-top"><div><small>YOUR BUSINESS, AT A GLANCE</small><h4>Today’s control room</h4><p>Live priorities from the records and tasks already in Nifti.</p></div><div class="nf67-pulse-actions"><span class="nf67-pulse-date">'+esc(typeof APP_TODAY!=='undefined'?APP_TODAY:'')+'</span><button type="button" data-share>Share Nifti ↗</button></div></div><div class="nf67-pulse-grid"><button type="button" data-lane="r"><b>'+urgent+'</b><span>Needs attention</span><small>Review today</small></button><button type="button" data-lane="y"><b>'+week+'</b><span>Coming up</span><small>This week</small></button><button type="button" data-lane="g"><b>'+clear+'</b><span>On track</span><small>Recorded as clear</small></button></div>';
   pulse.dataset.sig=pulseSig;
   pulse.querySelectorAll('[data-lane]').forEach(b=>b.addEventListener('click',()=>{
    const target=lanes.find(x=>x.querySelector('.lane-h.'+b.dataset.lane));
    if(target)target.scrollIntoView({behavior:'smooth',block:'center'});
   }));
   const share=pulse.querySelector('[data-share]');if(share)share.addEventListener('click',()=>{try{copyPlainText('https://siggiebahamas.github.io/Nifti/','Nifti link copied. Share it with another business owner.');}catch(e){window.open('https://siggiebahamas.github.io/Nifti/','_blank','noopener');}});
  }
  // Owner-only financial intelligence. All figures come from the existing bookkeeping ledger.
  let owner=false;try{owner=typeof booksCanSeeTotals==='function'&&booksCanSeeTotals()&&typeof BK!=='undefined'&&BK.loaded&&typeof bkPnl==='function';}catch(e){}
  let intel=home.querySelector('.nf67-intel');
  if(!owner){if(intel)intel.remove();return;}
  try{
   const month=bkMonth(APP_TODAY),p=bkPnl(month),sales=Number(p.sales)||0,cost=Number(p.cost)||0,expenses=Number(p.expenses)||0,spend=cost+expenses,profit=sales-spend,margin=sales?profit/sales*100:null;
   if(!intel){intel=document.createElement('section');intel.className='nf67-intel';const mosaic=home.querySelector('.mosaic');(mosaic||pulse).insertAdjacentElement('afterend',intel);}
   const fmt=n=>peso(n), flags=typeof bkFlags==='function'?bkFlags().filter(f=>f.lvl==='red'||f.lvl==='amber').slice(0,3):[];
   const intelSig=[month,sales,cost,expenses,profit,margin===null?'na':margin.toFixed(1),...flags.map(f=>String(f.t)+String(f.v))].join('|');
   if(intel.dataset.sig!==intelSig){
    intel.innerHTML='<div class="nf67-intel-head"><div><small>OWNER VIEW · RECORDED FIGURES</small><h4>Business intelligence</h4><p>Know where the month stands before deciding what to do next.</p></div><button type="button" class="nf67-text-btn" data-go="money">Open financials →</button></div><div class="nf67-intel-grid"><div><span>Sales this month</span><b>'+fmt(sales)+'</b></div><div><span>Recorded costs & expenses</span><b>'+fmt(spend)+'</b></div><div class="'+(profit<0?'negative':'positive')+'"><span>'+(profit<0?'Operating loss':'Operating profit')+'</span><b>'+(profit<0?'−':'')+fmt(Math.abs(profit))+'</b></div><div><span>Operating margin</span><b>'+(margin===null?'—':margin.toFixed(1)+'%')+'</b></div></div><div class="nf67-intel-foot">'+(sales?'Based on entries recorded for '+esc(month)+'.':'No sales recorded for this month yet. Add a sale to start building this view.')+' Figures reflect recorded entries; they are not forecasts.</div><div class="nf67-flags"><b>Items worth reviewing</b><div class="nf67-flag-list"></div></div>';
    intel.querySelector('[data-go="money"]').addEventListener('click',()=>go('money'));
    const list=intel.querySelector('.nf67-flag-list');
    if(flags.length)flags.forEach(f=>{const button=document.createElement('button');button.type='button';button.className='nf67-flag '+(f.lvl==='red'?'red':'amber');const t=document.createElement('span');t.textContent=String(f.t||'Review item')+': '+String(f.v||'');button.appendChild(t);const sub=document.createElement('small');sub.textContent=String(f.s||'Open to review');button.appendChild(sub);button.addEventListener('click',()=>go('money'));list.appendChild(button);});
    else list.innerHTML='<span class="nf67-no-flags">No flagged bookkeeping items right now. Keep records up to date for a clearer picture.</span>';
    intel.dataset.sig=intelSig;
   }
  }catch(e){console.warn('Nifti intelligence panel',e);}
  // Staff accountability: owner-only reconciliation context, never a misconduct score.
  const drawer=home.querySelector('#mhDrawer'),fold=drawer&&drawer.closest('.mh-cash-fold');
  if(drawer&&fold&&owner&&!home.querySelector('.nf67-staff')){
   const panel=document.createElement('div');panel.className='nf67-staff';
   let counts=[];try{counts=(BK.counts||[]).filter(c=>c.day&&bkMonth(c.day)===bkMonth(APP_TODAY)&&!c.reopenedAt).map(c=>({day:c.day,by:c.by,diff:Number(c.difference)||0}));}catch(e){}
   const names=[...new Set(counts.map(c=>String(c.by||'').replace(/ \(You\)$/,'')))];
   const today=counts.find(c=>c.day===APP_TODAY);
   const scheduled=typeof mhWho==='function'?mhWho(APP_TODAY):'';
   panel.innerHTML='<div class="nf67-staff-head"><div><small>OWNER CONTROL</small><h4>Staff cash accountability</h4><p>Review recorded drawer counts and differences by person. A variance is a reconciliation signal—not proof of misconduct.</p></div><button type="button" data-team>Manage team →</button></div><div class="nf67-staff-today"><span>Today’s assigned counter</span><b>'+esc(scheduled||'Not scheduled')+'</b><em class="'+(today?'done':'pending')+'">'+(today?'Count recorded':'Awaiting count')+'</em><button type="button" data-schedule>Review schedule</button></div><div class="nf67-staff-people"></div>';
   const people=panel.querySelector('.nf67-staff-people');
   if(!names.length){people.innerHTML='<p class="nf67-empty">Cash-count history will appear here as your team records closing counts.</p>';}
   else names.forEach(name=>{
    const recs=counts.filter(c=>String(c.by||'').replace(/ \(You\)$/,'')===name),short=recs.filter(c=>Number(c.diff)<-.5).length,over=recs.filter(c=>Number(c.diff)>.5).length,net=recs.reduce((n,c)=>n+(Number(c.diff)||0),0),latest=recs.slice().sort((a,b)=>String(b.day).localeCompare(String(a.day)))[0];
    const card=document.createElement('button');card.type='button';card.className='nf67-person';
    const who=document.createElement('b');who.textContent=name;const meta=document.createElement('span');meta.textContent=recs.length+' counts · '+short+' short days · '+over+' over days';const val=document.createElement('strong');val.textContent='Net difference '+(net<0?'−':'')+peso(Math.abs(net));card.append(who,meta,val);card.addEventListener('click',()=>{if(latest&&typeof mhOpenDay==='function')mhOpenDay(latest.day);});people.appendChild(card);
   });
   panel.querySelector('[data-team]').addEventListener('click',()=>go('team'));
   panel.querySelector('[data-schedule]').addEventListener('click',()=>mhOpenSched());
   fold.insertAdjacentElement('beforebegin',panel);
  }
  // The existing drawer detail can be re-rendered; preserve the enhanced panel on refresh.
 }
 function external(d){
  const host=document.getElementById('publicOrderView')||document.getElementById('publicDeliveryView');if(!host||!d)return;
  const status=String(d.status||'').toLowerCase();
  const copy={
   sent:['Your response is next','Review the details below and choose the response available to you.'],
   confirmed:['Order confirmed','The order is confirmed. Follow the updates shown here as it is prepared.'],
   preparing:['Being prepared','The business is preparing the order. Check this page for the next update.'],
   shipped:['On the way','The order has been marked as on the way.'],
   in_customs:['In transit','The latest recorded status shows the order is still in transit.'],
   partially_delivered:['Partially delivered','Some items have been marked delivered. Review the order details for what remains.'],
   delivered:['Delivery marked complete','Review the order and any invoice or payment details shown below.'],
   invoiced:['Invoice issued','Review the amount and due date shown in the order details.'],
   paid:['Payment recorded','The payment has been recorded. Thank you.'],
   declined:['Order declined','This order is no longer awaiting confirmation. Contact the business if you need help.'],
   rejected:['Order declined','This order is no longer awaiting confirmation. Contact the business if you need help.'],
   cancelled:['Order cancelled','This order is no longer active. Contact the business if you need clarification.']
  };
  const item=copy[status];if(!item)return;
  let box=host.querySelector('.nf67-next-step');
  if(!box){box=document.createElement('section');box.className='nf67-next-step';const anchor=host.querySelector('.nf65-progress, .po-public-status');(anchor||host.firstElementChild||host).insertAdjacentElement(anchor?'afterend':'beforebegin',box);}
  box.innerHTML='';const small=document.createElement('small');small.textContent='WHAT HAPPENS NEXT';const b=document.createElement('b');b.textContent=item[0];const p=document.createElement('p');p.textContent=item[1];const note=document.createElement('span');note.textContent='No Nifti account is needed to use this link.';box.append(small,b,p,note);
  let foot=host.querySelector('.nf67-share-nifti');
  if(!foot){foot=document.createElement('div');foot.className='nf67-share-nifti';foot.innerHTML='<span>Want this kind of clarity in your own business?</span><a href="https://siggiebahamas.github.io/Nifti/" target="_blank" rel="noopener">See how Nifti works →</a>';host.appendChild(foot);}
 }
 function wrapExternal(name){
  const base=window[name];if(typeof base!=='function'||base._nf67)return;
  const wrapped=function(){const args=arguments,result=base.apply(this,args);const d=args[0];setTimeout(()=>external(d),0);return result;};
  wrapped._nf67=true;window[name]=wrapped;try{if(name==='renderPublicOrderView')renderPublicOrderView=wrapped;else renderDeliveryLinkView=wrapped;}catch(e){}
 }
 function discover(){
  const page=document.getElementById('page-discover');if(!page)return;
  const intro=page.querySelector('#nf63DiscoverIntro');if(intro&&!intro.querySelector('.nf67-discover-steps')){
   const steps=document.createElement('div');steps.className='nf67-discover-steps';steps.innerHTML='<div><b>1</b><span>Choose what you need</span></div><div><b>2</b><span>Review the business profile</span></div><div><b>3</b><span>Start a conversation or save it</span></div>';intro.appendChild(steps);
  }
  const find=page.querySelector('#nfFind');if(find){
   find.querySelectorAll('.nf36f-tools input,.nf36f-tools select').forEach(el=>{el.style.fontSize='16px';el.style.minHeight='50px';});
   find.querySelectorAll('.nf36f-card').forEach(card=>{card.classList.add('nf67-discover-card');});
   const tools=find.querySelector('.nf36f-tools');if(tools&&!tools.querySelector('.nf67-find-hint')){const hint=document.createElement('div');hint.className='nf67-find-hint';hint.textContent='Search by business name, what they buy, business type or area. Matches are based on the products you have listed.';tools.insertAdjacentElement('afterend',hint);}
  }
  const grid=page.querySelector('#discGrid');if(grid)grid.querySelectorAll('.disc-card,.nfx-card').forEach(card=>card.classList.add('nf67-discover-card'));
 }
 function checklist(){
  if(typeof window.nf55Allowed==='function'&&!window.nf55Allowed._nf67){
   const base=window.nf55Allowed;
   const guarded=function(){
    let ok=false;try{ok=base.apply(this,arguments);}catch(e){}
    const app=document.getElementById('view-app'),active=app&&app.querySelector('.app-page.active');
    let real=false,demo=true;try{real=!!(myBusiness&&myBusiness.id);demo=typeof nfIsDemo==='function'?!!nfIsDemo():true;}catch(e){}
    return !!(ok&&real&&!demo&&app&&!app.classList.contains('hidden')&&active&&active.id==='page-dashboard'&&document.getElementById('mhHome'));
   };
   guarded._nf67=true;window.nf55Allowed=guarded;try{nf55Allowed=guarded;}catch(e){}
  }
  const dock=document.getElementById('nf55Dock'),app=document.getElementById('view-app'),active=app&&app.querySelector('.app-page.active');
  let real=false,demo=true;try{real=!!(myBusiness&&myBusiness.id);demo=typeof nfIsDemo==='function'?!!nfIsDemo():true;}catch(e){}
  const allowed=!!(real&&!demo&&app&&!app.classList.contains('hidden')&&active&&active.id==='page-dashboard'&&document.getElementById('mhHome'));
  if(dock&&!allowed)dock.remove();
 }
 function run(){
  marketing();discover();checklist();
  wrapExternal('renderPublicOrderView');wrapExternal('renderDeliveryLinkView');
  decorateHome();
 }
 ready(run);
 const mo=new MutationObserver(()=>{clearTimeout(window.__nf67Timer);window.__nf67Timer=setTimeout(run,180);});
 ready(()=>mo.observe(document.body,{subtree:true,childList:true}));
})();
