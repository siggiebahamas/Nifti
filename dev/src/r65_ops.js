/* Round 65: make the daily control room and external order links easier to follow. */
(function(){
 'use strict';
 function progress(d){
  const host=document.getElementById('publicOrderView');if(!host||!d||host.querySelector('.nf65-progress'))return;
  const status=String(d.status||'').toLowerCase();
  if(['cancelled','declined','rejected','draft'].includes(status))return;
  const idx=status==='sent'?0:['confirmed','preparing'].includes(status)?1:['shipped','in_customs'].includes(status)?2:['partially_delivered','delivered','invoiced','paid'].includes(status)?3:-1;
  if(idx<0)return;
  const badge=host.querySelector('.po-public-status');if(!badge)return;
  const labels=['Order sent','Confirmed','On the way','Delivered'];
  const el=document.createElement('div');el.className='nf65-progress';el.setAttribute('aria-label','Order progress');
  el.innerHTML=labels.map((label,i)=>'<div class="nf65-progress-step '+(i<idx?'done':i===idx?'current':'')+'"><span>'+(i<idx?'✓':String(i+1))+'</span><b>'+label+'</b></div>').join('');
  badge.insertAdjacentElement('afterend',el);
 }
 function wrap(name){
  const base=window[name];if(typeof base!=='function'||base._nf65)return;
  const wrapped=function(d){const result=base.apply(this,arguments);setTimeout(()=>progress(d),0);return result;};
  wrapped._nf65=true;window[name]=wrapped;if(name==='renderPublicOrderView')renderPublicOrderView=wrapped;else if(name==='renderDeliveryLinkView')renderDeliveryLinkView=wrapped;
 }
 function run(){wrap('renderPublicOrderView');wrap('renderDeliveryLinkView');}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
