/* Round 64: sharpen the landing-page hook and make feature exploration intentional. */
(function(){
 'use strict';
 const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
 function marketing(){
  const page=document.getElementById('view-index'); if(!page) return;
  // Keep the original three-step How It Works section created by NF20.
  const duplicate=page.querySelector('#nf63How'); if(duplicate) duplicate.remove();
  page.querySelectorAll('#mkPick .p2-burst').forEach(el=>{if(/daily workflow/i.test(el.textContent))el.textContent='SELL · BUY · MANAGE';});
  const hero=page.querySelector('.f4-hero');
  if(hero){
   const h=hero.querySelector('h1'); if(h) h.innerHTML='Run your business. <span>Not the daily chaos.</span>';
   const p=hero.querySelector('p'); if(p) p.textContent='Orders. Stock. Cash. Under control.';
   const promise=hero.querySelector('.nf62-link-promise'); if(promise) promise.remove();
   let chips=hero.querySelector('.nf64-hero-points');
   if(!chips){chips=document.createElement('div');chips.className='nf64-hero-points';chips.innerHTML='<span>SELL WITH CONFIDENCE</span><span>KEEP STOCK MOVING</span><span>KNOW YOUR NUMBERS</span>';const cta=hero.querySelector('.f4-hero-cta'); if(cta)cta.insertAdjacentElement('beforebegin',chips);else hero.appendChild(chips);}
  }
  page.querySelectorAll('#mkBuy .f4-spot').forEach(card=>{if(/report card for every supplier|supplier grades|grades from your real orders/i.test(card.textContent||''))card.remove();});
  const out=page.querySelector('#nf63Outcomes');
  if(out){
   const h=out.querySelector('.f5-head h2'); if(h)h.innerHTML='A calmer day. <span>A stronger business.</span>';
   const p=out.querySelector('.f5-head p'); if(p)p.remove();
   const cards=[...out.querySelectorAll('.nf63-out')];
   const titles=['Every order, accounted for.','Know what is owed.','Stock ready for what’s next.','Your team. Your control.'];
   const subs=['Nothing important buried in chat.','See what came in—and what is still due.','Purchasing and stock, working together.','Clear tasks. Fewer surprises.'];
   const ctas=['KEEP ORDERS MOVING','STAY ON TOP OF CASH','PROTECT THE FLOW','RUN WITH CONFIDENCE'];
   cards.forEach((c,i)=>{const b=c.querySelector('b'),sm=c.querySelector('small'),em=c.querySelector('em');if(b)b.textContent=titles[i]||b.textContent;if(sm)sm.textContent=subs[i]||'';if(em)em.textContent=ctas[i]||'EXPLORE';});
   const detail=out.querySelector('.nf63-out-detail');
   if(detail){const small=detail.querySelector('small'),b=detail.querySelector('b'),p=detail.querySelector('p');if(small)small.textContent='THE NIFTI DIFFERENCE';if(b)b.textContent='One connected business. Fewer loose ends.';if(p)p.textContent='Orders, stock, delivery and money stay in view—so you can lead the business instead of chasing every detail.';}
  }
  // Replace the unreliable "hours back" calculator with a low-effort, aspirational day-in-the-life picker.
  const calc=page.querySelector('#mkCalc');
  if(calc && !calc.dataset.nf64){
   calc.dataset.nf64='1';calc.classList.add('nf64-calm');
   calc.innerHTML='<div class="wrap"><div class="f5-head"><div class="p2-burst">PICTURE YOUR NEXT MONDAY</div><h2>Less firefighting. <span>More time to lead.</span></h2><p>Choose the part of the day you most want under control.</p></div><div class="nf64-scenarios" role="group" aria-label="Choose your business priority"><button type="button" class="nf64-sc on" data-i="0" aria-pressed="true"><span>01</span><b>Orders under control</b><small>Know what came in, what is confirmed and what needs attention.</small></button><button type="button" class="nf64-sc" data-i="1" aria-pressed="false"><span>02</span><b>Cash under control</b><small>See who owes you, what was paid and what needs a follow-up.</small></button><button type="button" class="nf64-sc" data-i="2" aria-pressed="false"><span>03</span><b>Operations under control</b><small>Keep stock, purchasing and deliveries moving together.</small></button></div><div class="nf64-calm-result" aria-live="polite"><div class="nf64-calm-kicker">THE DAY YOU WANT</div><h3>Start the morning knowing what needs you.</h3><p>Orders are in one place. Your team can see the next step. Customers can respond through a simple link.</p><div class="nf64-calm-flow"><span>ORDERS</span><i>→</i><span>STOCK</span><i>→</i><span>DELIVERY</span><i>→</i><span>PAYMENT</span></div><a class="btn btn-hero-primary mk-big" onclick="mk52Start()">I want this for my business</a></div></div>';
   const stories=[
    ['Start the morning knowing what needs you.','Orders are in one place. Your team can see the next step. Customers can respond through a simple link.',['ORDERS','CONFIRMATIONS','NEXT STEPS','TEAM']],
    ['Know where your money stands.','See balances, payment promises and recorded collections—without piecing the story together from messages.',['AMOUNTS DUE','FOLLOW-UPS','PAYMENTS','RECORDS']],
    ['Keep the whole operation moving.','See what is available, what needs purchasing and what is on its way to the customer.',['STOCK','PURCHASING','DELIVERY','CUSTOMER']]
   ];
   calc.querySelectorAll('.nf64-sc').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.i)||0;calc.querySelectorAll('.nf64-sc').forEach((x,j)=>{x.classList.toggle('on',i===j);x.setAttribute('aria-pressed',String(i===j));});const [h,p,flow]=stories[i];calc.querySelector('.nf64-calm-result h3').textContent=h;calc.querySelector('.nf64-calm-result p').textContent=p;calc.querySelector('.nf64-calm-flow').innerHTML=flow.map((x,j)=>(j?'<i>→</i>':'')+'<span>'+x+'</span>').join('');}));
  }
  // FAQ: single-column, legible answers and a positive visual marker instead of question marks.
  page.querySelectorAll('.f6-faq-g .faq-item').forEach(item=>{const a=item.querySelector('.a');if(a)a.style.opacity='1';});
  const cta=page.querySelector('.cta-band');
  if(cta){const h=cta.querySelector('h2');if(h)h.textContent='Keep your whole operation in view.';let hook=cta.querySelector('.nf64-cta-hook');if(!hook){hook=document.createElement('p');hook.className='nf64-cta-hook';hook.textContent='Know your numbers. Protect your margins. Find your peace of mind.';h&&h.insertAdjacentElement('afterend',hook);}const p=cta.querySelector('.wrap > p');if(p)p.textContent='One calmer way to run your business.';}
 }
 function fixTabs(){
  const show=document.getElementById('mkShow');if(!show)return;
  // Drop the two showcase tiles that imply unproven chat-reading or supplier-scoring capabilities.
  if(!show.dataset.nf64Pruned){
   const rows=[...show.querySelectorAll('.nf20-stabs button')], views=[...show.querySelectorAll('.nf20-sp')];
   rows.forEach((tab,i)=>{if(/orders from any chat|know when staff overpay/i.test(tab.textContent||'')){tab.remove();if(views[i])views[i].remove();}});
   const remaining=[...show.querySelectorAll('.nf20-stabs button')], remainingPanels=[...show.querySelectorAll('.nf20-sp')];
   remaining.forEach((tab,i)=>{tab.id='nf64St'+i;tab.setAttribute('aria-controls','nf64Sp'+i);tab.setAttribute('aria-selected',String(i===0));tab.classList.toggle('on',i===0);tab.setAttribute('tabindex',i===0?'0':'-1');tab.setAttribute('onclick','nf20ShowGo('+i+', true)');});
   remainingPanels.forEach((panel,i)=>{panel.id='nf64Sp'+i;panel.setAttribute('aria-labelledby','nf64St'+i);panel.hidden=i!==0;panel.classList.toggle('on',i===0);});
   show.dataset.nf64Pruned='1';
  }
  const tabs=[...show.querySelectorAll('.nf20-stabs button')],panels=[...show.querySelectorAll('.nf20-sp')];if(!tabs.length||!panels.length)return;
  // Stop auto-advancing: users choose what they want to inspect, and the selection stays put.
  try{if(window.NF20S){NF20S.stop=true;clearTimeout(NF20S.t);}}catch(e){}
  if(!show.dataset.nf64){
   show.dataset.nf64='1';
   tabs.forEach((tab,i)=>{tab.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();tabs.forEach((t,j)=>{const active=j===i;t.classList.toggle('on',active);t.setAttribute('aria-selected',String(active));t.setAttribute('tabindex',active?'0':'-1');});panels.forEach((panel,j)=>{const active=j===i;panel.hidden=!active;panel.classList.toggle('on',active);});try{if(window.NF20S){NF20S.i=i;NF20S.stop=true;clearTimeout(NF20S.t);}}catch(e){}},{capture:true});});
  }
 }
 function run(){marketing();fixTabs();}
 ready(run);
 const mo=new MutationObserver(()=>{clearTimeout(window.__nf64timer);window.__nf64timer=setTimeout(run,160);});
 ready(()=>mo.observe(document.body,{subtree:true,childList:true}));
})();
