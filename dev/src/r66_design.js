/* Round 66: premium legibility, strong benefit hierarchy and a cleaner conversion journey. */
(function(){
 'use strict';
 const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
 const icon=d=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
 const benefits=[
  [icon('<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 1.9-1.4L21 8H6"/> <circle cx="10" cy="20" r="1"/> <circle cx="18" cy="20" r="1"/>'),'Sell with confidence','Every customer order, clearly accounted for.'],
  [icon('<path d="m4 7 8-4 8 4v10l-8 4-8-4z"/> <path d="m4 7 8 4 8-4M12 11v10"/>'),'Keep stock moving','Purchases, stock and deliveries connected.'],
  [icon('<path d="M3 3v18h18"/> <path d="m7 14 4-4 3 3 6-7"/>'),'Know your numbers','See sales, costs, collections and profit.']
 ];
 function apply(){
  const page=document.getElementById('view-index');if(!page)return;
  const hero=page.querySelector('.f4-hero');
  if(hero&&!hero.dataset.nf66){
   const p=hero.querySelector('p');if(p){p.classList.add('nf66-tagline');p.innerHTML='<span>ORDERS.</span><span>STOCK.</span><span>CASH.</span><strong>UNDER CONTROL.</strong>';}
   hero.dataset.nf66='1';
  }
  const points=hero&&hero.querySelector('.nf64-hero-points');
  if(points&&!points.dataset.nf66){
   points.innerHTML=benefits.map(x=>'<div class="nf66-benefit"><span class="nf66-benefit-icon">'+x[0]+'</span><span><b>'+x[1]+'</b><small>'+x[2]+'</small></span><i>✓</i></div>').join('');
   points.dataset.nf66='1';
  }
  // The former time calculator was removed at build time; this also clears stale cached DOM.
  const calc=page.querySelector('#mkCalc');if(calc)calc.remove();
  const show=page.querySelector('#mkShow');
  if(show&&!show.dataset.nf66){
   show.querySelectorAll('h3').forEach(h=>{
    if(/^Your own store,?\s*ready for Facebook$/i.test(h.textContent.trim())){
     h.innerHTML='Your own store,<br>ready for Facebook';h.dataset.nf66='1';
    }
   });
   show.querySelectorAll('.nf20-stabs button').forEach(btn=>{
    const label=btn.querySelector('span');
    if(label&&/Your own store,?\s*ready for Facebook/i.test(label.textContent)){
     label.innerHTML='Your own store,<br>ready for Facebook';label.dataset.nf66='1';btn.classList.add('nf66-store-tab');
    }
   });
   show.dataset.nf66='1';
  }
  const out=page.querySelector('#nf63Outcomes');
  if(out&&!out.dataset.nf66){
   const paths=[
    '<path d="M7 3h10l3 3v15H4V3z"/><path d="M8 11h8M8 15h8M8 7h4"/>',
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    '<path d="m4 7 8-4 8 4v10l-8 4-8-4z"/><path d="m4 7 8 4 8-4M12 11v10"/>',
    '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/>'
   ];
   out.querySelectorAll('.nf63-out-ic').forEach((el,i)=>{if(paths[i])el.innerHTML=icon(paths[i]);});
   out.dataset.nf66='1';
  }
 }
 ready(apply);
 const observer=new MutationObserver(()=>{
  const p=document.getElementById('view-index');if(!p)return;
  const hero=p.querySelector('.f4-hero'),points=hero&&hero.querySelector('.nf64-hero-points'),out=p.querySelector('#nf63Outcomes'),show=p.querySelector('#mkShow');
  if((hero&&!hero.dataset.nf66)||(points&&!points.dataset.nf66)||(out&&!out.dataset.nf66)||(show&&!show.dataset.nf66))apply();
 });
 ready(()=>observer.observe(document.body,{childList:true,subtree:true}));
})();
