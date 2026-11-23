/* Round 66: premium legibility, strong benefit hierarchy and a cleaner conversion journey. */
(function(){
 'use strict';
 const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
 const icon=(d)=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
 function apply(){
  const page=document.getElementById('view-index');if(!page)return;
  const hero=page.querySelector('.f4-hero');
  if(hero&&!hero.dataset.nf66){
   hero.dataset.nf66='1';
   const p=hero.querySelector('p');if(p){p.classList.add('nf66-tagline');p.innerHTML='<span>ORDERS.</span><span>STOCK.</span><span>CASH.</span><strong>ALL UNDER CONTROL.</strong>';}
   const points=hero.querySelector('.nf64-hero-points');
   if(points){
    points.innerHTML=[
     [icon('<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 1.9-1.4L21 8H6"/> <circle cx="10" cy="20" r="1"/> <circle cx="18" cy="20" r="1"/>'),'Sell with confidence','Every customer order, clearly accounted for.'],
     [icon('<path d="m4 7 8-4 8 4v10l-8 4-8-4z"/> <path d="m4 7 8 4 8-4M12 11v10"/>'),'Keep stock moving','Purchases, stock and deliveries connected.'],
     [icon('<path d="M3 3v18h18"/> <path d="m7 14 4-4 3 3 6-7"/>'),'Know your numbers','See sales, costs, collections and profit.']
    ].map(x=>'<div class="nf66-benefit"><span class="nf66-benefit-icon">'+x[0]+'</span><span><b>'+x[1]+'</b><small>'+x[2]+'</small></span><i>✓</i></div>').join('');
   }
  }
  // Remove the redundant "Picture your next Monday" / calculator block; its promises are now
  // represented by the concrete benefits and the interactive outcome cards above.
  const calc=page.querySelector('#mkCalc');if(calc)calc.remove();
  page.querySelectorAll('#mkShow .nf20-stabs button').forEach(btn=>{
   const label=btn.querySelector('span');if(label&&/Your own store,?\s*ready for Facebook/i.test(label.textContent)&&!label.dataset.nf66){
    label.dataset.nf66='1';label.innerHTML='Your own store,<br>ready for Facebook';
   }
  });
  const out=page.querySelector('#nf63Outcomes');
  if(out&&!out.dataset.nf66){
   out.dataset.nf66='1';
   const paths=[
    '<path d="M7 3h10l3 3v15H4V3z"/><path d="M8 11h8M8 15h8M8 7h4"/>',
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    '<path d="m4 7 8-4 8 4v10l-8 4-8-4z"/><path d="m4 7 8 4 8-4M12 11v10"/>',
    '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/>'
   ];
   out.querySelectorAll('.nf63-out-ic').forEach((el,i)=>{if(paths[i])el.innerHTML=icon(paths[i]);});
  }
  // Make the original showcase tab wrap intentionally, without clipping its icon.
  const show=page.querySelector('#mkShow');
  if(show){const target=[...show.querySelectorAll('.nf20-stabs button')].find(b=>/Your own store/i.test(b.textContent));if(target)target.classList.add('nf66-store-tab');}
 }
 ready(apply);
 const observer=new MutationObserver(()=>{const p=document.getElementById('view-index');if(p&&(!p.querySelector('.f4-hero')?.dataset.nf66||!p.querySelector('#nf63Outcomes')?.dataset.nf66)){apply();}});
 ready(()=>observer.observe(document.body,{childList:true,subtree:true}));
})();
