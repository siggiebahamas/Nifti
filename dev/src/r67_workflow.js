/* Round 67: complete the visible daily-control, intelligence, staff and counterparty experience.
   Uses existing Nifti records and actions only. No AI services, new tables, or permission changes. */
(function(){
 'use strict';
 const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const peso=n=>'₱'+Math.round(Number(n)||0).toLocaleString('en-PH');


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
  checklist(); // Round 72: the discover guide box is replaced by r72.js
  wrapExternal('renderPublicOrderView');wrapExternal('renderDeliveryLinkView');
  // Round 72: Home status cards and owner view are drawn by r72.js (nf72Home).
 }
 ready(run);
})();
